import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  RecordItem, 
  QuarantineItem, 
  SystemConfig, 
  AuditLog, 
  ValidationResult, 
  ActionStatus, 
  AnalyticsSummary,
  DatasetDomain
} from './src/types';
import { computeContentHash, compareRecords } from './src/lib/dedupEngine';
import { analyzeFalsePositiveWithAI } from './src/lib/geminiClassifier';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Storage Engine
let systemConfig: SystemConfig = {
  domain: 'customers',
  fuzzyThreshold: 0.82,
  exactHashMatching: true,
  usePhoneticMatching: true,
  useAiContextualCheck: true,
  autoRejectExactDuplicates: true,
  autoQuarantineNearDuplicates: true,
  autoMergeStrategy: 'SMART_MERGE',
};

let dbRecords: RecordItem[] = [];
let quarantineQueue: QuarantineItem[] = [];
let auditLogs: AuditLog[] = [];
let totalValidationCount = 0;
let duplicatesPreventedCount = 0;
let falsePositivesIdentifiedCount = 0;

// Helper to log audit events
function addAuditLog(eventType: AuditLog['eventType'], details: string, recordId: string, similarityScore?: number) {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    details,
    recordId,
    similarityScore,
    user: 'System Ingestion Gateway'
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 200) auditLogs.pop();
}

// Initial Seeding
function seedInitialData() {
  dbRecords = [
    {
      id: 'REC_CUST_001',
      domain: 'customers',
      primaryKey: 'alex.morgan@techcorp.io',
      title: 'Alex Morgan',
      secondaryText: '+1 (555) 234-5678 • Enterprise Sales',
      content: 'Senior Enterprise Account Director in San Francisco HQ. Leads Key Account Renewal Team.',
      category: 'Sales',
      metadata: { department: 'Sales', location: 'San Francisco' },
      contentHash: '',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'REC_CUST_002',
      domain: 'customers',
      primaryKey: 'sarah.connor@cyberdyne.org',
      title: 'Sarah Connor',
      secondaryText: '+1 (555) 987-6543 • Security Ops',
      content: 'Chief Information Security Officer in Austin Branch. Responsible for Threat Vulnerability Audits.',
      category: 'Security',
      metadata: { department: 'Cybersecurity', location: 'Austin' },
      contentHash: '',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'REC_MED_001',
      domain: 'medical',
      primaryKey: 'PAT-883920',
      title: 'Dr. Robert Chen',
      secondaryText: 'DOB: 1984-05-12 • Blood Group: A+',
      content: 'Patient presents with mild respiratory congestion. Prescribed Amoxicillin 500mg. No known drug allergies.',
      category: 'Cardiology',
      metadata: { hospital: 'St. Jude General', room: '304-B' },
      contentHash: '',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'REC_INV_001',
      domain: 'inventory',
      primaryKey: 'SKU-LOGI-MX3S',
      title: 'Logitech MX Master 3S Wireless Mouse',
      secondaryText: 'Electronics • $99.99 USD',
      content: 'Ergonomic performance mouse with Quiet Clicks, 8K DPI sensor, Bluetooth & Logi Bolt Receiver.',
      category: 'Peripherals',
      metadata: { stock: 450, warehouse: 'WH-EAST-02' },
      contentHash: '',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: 'REC_FIN_001',
      domain: 'financial',
      primaryKey: 'TXN-20260730-9941',
      title: 'Stripe Merchant Settlement - Acme Inc',
      secondaryText: '$4,850.00 USD • Completed',
      content: 'Automated recurring billing payout for Monthly SaaS Tier 3 Accounts.',
      category: 'Payments',
      metadata: { provider: 'Stripe', currency: 'USD' },
      contentHash: '',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ];

  // Compute hashes
  dbRecords.forEach((rec) => {
    rec.contentHash = computeContentHash(rec);
  });

  addAuditLog('INGEST_UNIQUE', 'Database seeded with 5 initial unique baseline records', 'SYSTEM_SEED');
}

seedInitialData();

// Core Validation Pipeline Function
async function validateCandidateRecord(candidate: RecordItem): Promise<ValidationResult> {
  totalValidationCount++;
  const startTime = Date.now();

  // Ensure hash is calculated
  if (!candidate.contentHash) {
    candidate.contentHash = computeContentHash(candidate);
  }

  // Search through current verified database for potential duplicates
  let bestMatchScore = 0;
  let bestMatchedRecord: RecordItem | undefined = undefined;
  let bestMatchDetails: ReturnType<typeof compareRecords> | undefined = undefined;

  for (let existing of dbRecords) {
    const comparison = compareRecords(candidate, existing, systemConfig);
    if (comparison.overallSimilarity > bestMatchScore) {
      bestMatchScore = comparison.overallSimilarity;
      bestMatchedRecord = existing;
      bestMatchDetails = comparison;
    }
  }

  // 1. Exact Hash / Exact Duplicate Match
  if (bestMatchDetails?.isExactHashMatch || bestMatchScore >= 0.98) {
    duplicatesPreventedCount++;
    const result: ValidationResult = {
      candidateRecord: candidate,
      classification: 'EXACT_DUPLICATE',
      actionTaken: systemConfig.autoRejectExactDuplicates ? 'AUTO_REJECTED' : 'QUARANTINED',
      overallSimilarity: 100,
      matchedExistingRecord: bestMatchedRecord,
      fieldDetails: bestMatchDetails?.fieldScores || [],
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };

    if (result.actionTaken === 'QUARANTINED') {
      quarantineQueue.unshift({
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        candidateRecord: candidate,
        existingMatch: bestMatchedRecord,
        classification: 'EXACT_DUPLICATE',
        overallSimilarity: 100,
        fieldDetails: result.fieldDetails,
        status: 'PENDING',
        flaggedAt: new Date().toISOString()
      });
    }

    addAuditLog('REJECT_DUPLICATE', `Exact duplicate blocked (${candidate.primaryKey})`, candidate.id, 100);
    return result;
  }

  // 2. High Confidence or Near Duplicate Range (Check with AI if configured)
  if (bestMatchScore >= systemConfig.fuzzyThreshold && bestMatchedRecord) {
    let isFalsePositive = false;
    let aiResult;

    if (systemConfig.useAiContextualCheck) {
      aiResult = await analyzeFalsePositiveWithAI(
        candidate,
        bestMatchedRecord,
        bestMatchScore,
        bestMatchDetails?.fieldScores || []
      );
      isFalsePositive = aiResult.isFalsePositive;
    }

    if (isFalsePositive) {
      falsePositivesIdentifiedCount++;
      // AI determined this is actually a FALSE POSITIVE (distinct entity!)
      const result: ValidationResult = {
        candidateRecord: candidate,
        classification: 'FALSE_POSITIVE',
        actionTaken: 'AUTO_APPENDED',
        overallSimilarity: Math.round(bestMatchScore * 100),
        matchedExistingRecord: bestMatchedRecord,
        fieldDetails: bestMatchDetails?.fieldScores || [],
        aiAnalysis: aiResult,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime
      };

      // Append to Database directly
      dbRecords.unshift(candidate);
      addAuditLog('FALSE_POSITIVE_OVERRIDE', `AI verified False Positive (${candidate.title}) - Appended as unique`, candidate.id, Math.round(bestMatchScore * 100));
      return result;
    } else {
      duplicatesPreventedCount++;
      // Genuine near-duplicate or high-confidence duplicate
      const classification = bestMatchScore >= 0.90 ? 'HIGH_CONFIDENCE_DUP' : 'NEAR_DUPLICATE_REVIEW';
      const actionTaken: ActionStatus = systemConfig.autoQuarantineNearDuplicates ? 'QUARANTINED' : 'AUTO_REJECTED';

      const result: ValidationResult = {
        candidateRecord: candidate,
        classification,
        actionTaken,
        overallSimilarity: Math.round(bestMatchScore * 100),
        matchedExistingRecord: bestMatchedRecord,
        fieldDetails: bestMatchDetails?.fieldScores || [],
        aiAnalysis: aiResult,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime
      };

      if (actionTaken === 'QUARANTINED') {
        quarantineQueue.unshift({
          id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          candidateRecord: candidate,
          existingMatch: bestMatchedRecord,
          classification,
          overallSimilarity: Math.round(bestMatchScore * 100),
          fieldDetails: result.fieldDetails,
          aiAnalysis: aiResult,
          status: 'PENDING',
          flaggedAt: new Date().toISOString()
        });
        addAuditLog('QUARANTINE_FLAG', `Near-duplicate record quarantined for human review (${candidate.title})`, candidate.id, Math.round(bestMatchScore * 100));
      } else {
        addAuditLog('REJECT_DUPLICATE', `High-confidence duplicate rejected (${candidate.title})`, candidate.id, Math.round(bestMatchScore * 100));
      }

      return result;
    }
  }

  // 3. Unique Verified Entry -> Safe to append
  const result: ValidationResult = {
    candidateRecord: candidate,
    classification: 'UNIQUE_VERIFIED',
    actionTaken: 'AUTO_APPENDED',
    overallSimilarity: Math.round(bestMatchScore * 100),
    matchedExistingRecord: bestMatchedRecord,
    fieldDetails: bestMatchDetails?.fieldScores || [],
    timestamp: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime
  };

  dbRecords.unshift(candidate);
  addAuditLog('INGEST_UNIQUE', `Unique record appended to cloud database (${candidate.title})`, candidate.id, Math.round(bestMatchScore * 100));
  return result;
}

// API Routes
app.get('/api/config', (req, res) => {
  res.json(systemConfig);
});

app.post('/api/config', (req, res) => {
  systemConfig = { ...systemConfig, ...req.body };
  addAuditLog('BATCH_TEST', 'System configuration updated', 'SYS_CONFIG');
  res.json({ status: 'ok', config: systemConfig });
});

app.get('/api/database', (req, res) => {
  const { query, domain, category } = req.query;
  let results = [...dbRecords];

  if (domain && domain !== 'all') {
    results = results.filter((r) => r.domain === domain);
  }
  if (category && category !== 'all') {
    results = results.filter((r) => r.category === category);
  }
  if (query && typeof query === 'string' && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (r) =>
        r.primaryKey.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.secondaryText.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
    );
  }

  res.json({
    total: dbRecords.length,
    filtered: results.length,
    records: results
  });
});

app.post('/api/validate-record', async (req, res) => {
  try {
    const candidateData = req.body as Partial<RecordItem>;
    if (!candidateData.title || !candidateData.primaryKey) {
      res.status(400).json({ error: 'Primary Key and Title are required' });
      return;
    }

    const record: RecordItem = {
      id: candidateData.id || `REC_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      domain: candidateData.domain || systemConfig.domain,
      primaryKey: candidateData.primaryKey,
      title: candidateData.title,
      secondaryText: candidateData.secondaryText || '',
      content: candidateData.content || '',
      category: candidateData.category || 'General',
      metadata: candidateData.metadata || {},
      contentHash: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    record.contentHash = computeContentHash(record);

    const validationResult = await validateCandidateRecord(record);
    res.json(validationResult);
  } catch (err: any) {
    console.error('Validation error:', err);
    res.status(500).json({ error: err.message || 'Validation failed' });
  }
});

app.post('/api/ingest-batch', async (req, res) => {
  try {
    const batch = req.body.records as Partial<RecordItem>[];
    if (!Array.isArray(batch)) {
      res.status(400).json({ error: 'records array is required' });
      return;
    }

    const results: ValidationResult[] = [];
    for (const item of batch) {
      if (!item.title || !item.primaryKey) continue;
      const record: RecordItem = {
        id: item.id || `REC_B_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        domain: item.domain || systemConfig.domain,
        primaryKey: item.primaryKey,
        title: item.title,
        secondaryText: item.secondaryText || '',
        content: item.content || '',
        category: item.category || 'Batch Upload',
        metadata: item.metadata || {},
        contentHash: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      record.contentHash = computeContentHash(record);
      const resVal = await validateCandidateRecord(record);
      results.push(resVal);
    }

    res.json({
      processedCount: results.length,
      appendedCount: results.filter((r) => r.actionTaken === 'AUTO_APPENDED').length,
      rejectedCount: results.filter((r) => r.actionTaken === 'AUTO_REJECTED').length,
      quarantinedCount: results.filter((r) => r.actionTaken === 'QUARANTINED').length,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Batch ingestion error' });
  }
});

app.get('/api/quarantine', (req, res) => {
  res.json({
    pendingCount: quarantineQueue.filter((q) => q.status === 'PENDING').length,
    items: quarantineQueue
  });
});

app.post('/api/quarantine/action', (req, res) => {
  const { quarantineId, action, notes } = req.body;
  const itemIndex = quarantineQueue.findIndex((q) => q.id === quarantineId);

  if (itemIndex === -1) {
    res.status(404).json({ error: 'Quarantine record not found' });
    return;
  }

  const item = quarantineQueue[itemIndex];

  if (action === 'APPROVE_FALSE_POSITIVE') {
    item.status = 'APPROVED_FALSE_POSITIVE';
    item.notes = notes || 'Human reviewer confirmed False Positive. Unique entry appended.';
    item.reviewedAt = new Date().toISOString();
    falsePositivesIdentifiedCount++;
    dbRecords.unshift(item.candidateRecord);
    addAuditLog('FALSE_POSITIVE_OVERRIDE', `Manual override: Appended False Positive (${item.candidateRecord.title})`, item.candidateRecord.id);
  } else if (action === 'CONFIRM_DUPLICATE') {
    item.status = 'CONFIRMED_DUPLICATE';
    item.notes = notes || 'Human reviewer confirmed True Duplicate. Entry rejected.';
    item.reviewedAt = new Date().toISOString();
    addAuditLog('REJECT_DUPLICATE', `Manual review: Rejected confirmed duplicate (${item.candidateRecord.title})`, item.candidateRecord.id);
  } else if (action === 'MERGE') {
    item.status = 'MERGED';
    item.notes = notes || 'Record merged into existing database entry.';
    item.reviewedAt = new Date().toISOString();

    if (item.existingMatch) {
      const idx = dbRecords.findIndex((r) => r.id === item.existingMatch?.id);
      if (idx !== -1) {
        // Smart merge: append new notes or update secondary info if missing
        dbRecords[idx].content += `\n[Merged Info ${new Date().toLocaleDateString()}]: ${item.candidateRecord.content}`;
        dbRecords[idx].updatedAt = new Date().toISOString();
      }
    }
    addAuditLog('RECORD_MERGE', `Merged candidate entry into existing record (${item.candidateRecord.title})`, item.candidateRecord.id);
  }

  res.json({ status: 'ok', item });
});

app.get('/api/analytics', (req, res) => {
  const totalInDB = dbRecords.length;
  // Estimate storage: average 500 bytes per record
  const avgRecordSizeBytes = 512;
  const storageSavedBytes = duplicatesPreventedCount * avgRecordSizeBytes;
  const estimatedCostSavingsUSD = Math.round((duplicatesPreventedCount * 0.12) * 100) / 100;

  const totalEvaluated = Math.max(1, totalValidationCount);
  const accuracyRate = Math.min(100, Math.round(((totalValidationCount - falsePositivesIdentifiedCount) / totalEvaluated) * 100));

  const summary: AnalyticsSummary = {
    totalRecordsInDB: totalInDB,
    totalValidationAttempts: totalValidationCount,
    duplicatesPrevented: duplicatesPreventedCount,
    falsePositivesIdentified: falsePositivesIdentifiedCount,
    quarantinePendingCount: quarantineQueue.filter((q) => q.status === 'PENDING').length,
    storageSavedBytes,
    estimatedCostSavingsUSD,
    accuracyRate: accuracyRate || 99,
    classificationBreakdown: {
      exactDuplicate: Math.round(duplicatesPreventedCount * 0.55),
      highConfidenceDup: Math.round(duplicatesPreventedCount * 0.25),
      nearDuplicateReview: quarantineQueue.length,
      falsePositive: falsePositivesIdentifiedCount,
      uniqueVerified: totalInDB
    }
  };

  res.json(summary);
});

app.get('/api/audit-logs', (req, res) => {
  res.json(auditLogs);
});

app.post('/api/seed', (req, res) => {
  dbRecords = [];
  quarantineQueue = [];
  auditLogs = [];
  totalValidationCount = 0;
  duplicatesPreventedCount = 0;
  falsePositivesIdentifiedCount = 0;
  seedInitialData();
  res.json({ status: 'ok', message: 'Database re-seeded successfully' });
});

// Vite Development or Production Static Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Data Redundancy Removal System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
