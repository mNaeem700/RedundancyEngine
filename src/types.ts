export type DatasetDomain = 'customers' | 'medical' | 'inventory' | 'financial' | 'custom';

export type ClassificationType = 
  | 'UNIQUE_VERIFIED'        // Safe to insert
  | 'EXACT_DUPLICATE'        // 100% Hash / Key Match
  | 'HIGH_CONFIDENCE_DUP'    // > 90% Fuzzy / Field Match
  | 'NEAR_DUPLICATE_REVIEW'  // 70% - 89% Similarity (Needs Human or AI review)
  | 'FALSE_POSITIVE';        // Flagged as similar but verified as distinct entity

export type ActionStatus = 
  | 'AUTO_APPENDED'
  | 'AUTO_REJECTED'
  | 'QUARANTINED'
  | 'MANUALLY_APPROVED'      // Marked False Positive -> Appended
  | 'MANUALLY_REJECTED'      // Confirmed Duplicate -> Rejected
  | 'MERGED';                // Merged into existing record

export interface RecordItem {
  id: string;
  domain: DatasetDomain;
  primaryKey: string;        // e.g. Email, SSN, SKU, Transaction ID
  title: string;             // Name / Product Name / Patient Name
  secondaryText: string;     // Phone, Department, Address, Category
  content: string;           // Detailed text / Description / Payload
  category: string;
  metadata: Record<string, any>;
  contentHash: string;       // Generated Hash for quick exact matching
  createdAt: string;
  updatedAt: string;
}

export interface MatchScoreDetail {
  field: string;
  similarityScore: number;   // 0 to 1
  matchMethod: 'exact' | 'levenshtein' | 'jaccard' | 'soundex' | 'ai_semantic';
  valueA: string;
  valueB: string;
  isExact: boolean;
}

export interface AIAnalysisResult {
  isFalsePositive: boolean;
  confidenceScore: number;     // 0 - 100
  reasoning: string;
  keyDifferences: string[];
  recommendedAction: 'APPEND' | 'REJECT' | 'MERGE' | 'HUMAN_REVIEW';
}

export interface ValidationResult {
  candidateRecord: RecordItem;
  classification: ClassificationType;
  actionTaken: ActionStatus;
  overallSimilarity: number;  // 0 - 100%
  matchedExistingRecord?: RecordItem;
  fieldDetails: MatchScoreDetail[];
  aiAnalysis?: AIAnalysisResult;
  timestamp: string;
  executionTimeMs: number;
}

export interface QuarantineItem {
  id: string;
  candidateRecord: RecordItem;
  existingMatch?: RecordItem;
  classification: ClassificationType;
  overallSimilarity: number;
  fieldDetails: MatchScoreDetail[];
  aiAnalysis?: AIAnalysisResult;
  status: 'PENDING' | 'APPROVED_FALSE_POSITIVE' | 'CONFIRMED_DUPLICATE' | 'MERGED';
  flaggedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface SystemConfig {
  domain: DatasetDomain;
  fuzzyThreshold: number;       // e.g., 0.82 (82%)
  exactHashMatching: boolean;
  usePhoneticMatching: boolean; // Soundex
  useAiContextualCheck: boolean;// Enable Gemini AI verification for near-duplicates
  autoRejectExactDuplicates: boolean;
  autoQuarantineNearDuplicates: boolean;
  autoMergeStrategy: 'KEEP_OLD' | 'OVERWRITE_NEW' | 'SMART_MERGE';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 'INGEST_UNIQUE' | 'REJECT_DUPLICATE' | 'QUARANTINE_FLAG' | 'FALSE_POSITIVE_OVERRIDE' | 'RECORD_MERGE' | 'BATCH_TEST';
  details: string;
  recordId: string;
  similarityScore?: number;
  user: string;
}

export interface AnalyticsSummary {
  totalRecordsInDB: number;
  totalValidationAttempts: number;
  duplicatesPrevented: number;
  falsePositivesIdentified: number;
  quarantinePendingCount: number;
  storageSavedBytes: number;
  estimatedCostSavingsUSD: number;
  accuracyRate: number;
  classificationBreakdown: {
    exactDuplicate: number;
    highConfidenceDup: number;
    nearDuplicateReview: number;
    falsePositive: number;
    uniqueVerified: number;
  };
}
