import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IngestionPipeline } from './components/IngestionPipeline';
import { QuarantineQueue } from './components/QuarantineQueue';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { SimulationLab } from './components/SimulationLab';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { RecordItem, QuarantineItem, SystemConfig, AnalyticsSummary, AuditLog, ValidationResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ingest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    domain: 'customers',
    fuzzyThreshold: 0.82,
    exactHashMatching: true,
    usePhoneticMatching: true,
    useAiContextualCheck: true,
    autoRejectExactDuplicates: true,
    autoQuarantineNearDuplicates: true,
    autoMergeStrategy: 'SMART_MERGE',
  });

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [dbRecords, setDbRecords] = useState<RecordItem[]>([]);
  const [dbTotalCount, setDbTotalCount] = useState<number>(0);
  const [quarantineItems, setQuarantineItems] = useState<QuarantineItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Refresh data from Express backend
  const refreshAllData = async () => {
    try {
      const [analyticsRes, dbRes, quarantineRes, auditRes, configRes] = await Promise.all([
        fetch('/api/analytics').then((r) => r.json()),
        fetch('/api/database').then((r) => r.json()),
        fetch('/api/quarantine').then((r) => r.json()),
        fetch('/api/audit-logs').then((r) => r.json()),
        fetch('/api/config').then((r) => r.json()),
      ]);

      setAnalytics(analyticsRes);
      setDbRecords(dbRes.records || []);
      setDbTotalCount(dbRes.total || 0);
      setQuarantineItems(quarantineRes.items || []);
      setAuditLogs(auditRes || []);
      if (configRes) setSystemConfig(configRes);
    } catch (err) {
      console.error('Failed to fetch data from backend:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // API Call Handlers
  const handleValidateSingle = async (candidate: Partial<RecordItem>): Promise<ValidationResult> => {
    const res = await fetch('/api/validate-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    const data = await res.json();
    await refreshAllData();
    return data;
  };

  const handleBatchIngest = async (records: Partial<RecordItem>[]) => {
    const res = await fetch('/api/ingest-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    const data = await res.json();
    await refreshAllData();
    return data;
  };

  const handleQuarantineAction = async (
    quarantineId: string,
    action: 'APPROVE_FALSE_POSITIVE' | 'CONFIRM_DUPLICATE' | 'MERGE',
    notes?: string
  ) => {
    await fetch('/api/quarantine/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarantineId, action, notes }),
    });
    await refreshAllData();
  };

  const handleSearchDB = async (query: string, domain: string, category: string) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (domain) params.append('domain', domain);
    if (category) params.append('category', category);

    const res = await fetch(`/api/database?${params.toString()}`);
    const data = await res.json();
    setDbRecords(data.records || []);
  };

  const handleSaveConfig = async (updated: Partial<SystemConfig>) => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    await refreshAllData();
  };

  const handleResetSeed = async () => {
    if (window.confirm('Reset cloud database and re-seed initial baseline records?')) {
      await fetch('/api/seed', { method: 'POST' });
      await refreshAllData();
    }
  };

  const handleCheckExistingRecord = async (record: RecordItem) => {
    setActiveTab('ingest');
  };

  const pendingQuarantineCount = quarantineItems.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-neutral-100 text-black font-sans selection:bg-black selection:text-white">
      
      {/* Top Fixed Header & Stats Navigation */}
      <Header
        analytics={analytics}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSeed={handleResetSeed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingQuarantineCount={pendingQuarantineCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'ingest' && (
          <IngestionPipeline
            onValidateSingle={handleValidateSingle}
            onBatchIngest={handleBatchIngest}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'quarantine' && (
          <QuarantineQueue
            items={quarantineItems}
            onAction={handleQuarantineAction}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseExplorer
            records={dbRecords}
            totalCount={dbTotalCount}
            onSearch={handleSearchDB}
            onCheckAgainstDB={handleCheckExistingRecord}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationLab
            onBatchIngest={handleBatchIngest}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
            auditLogs={auditLogs}
          />
        )}

      </main>

      {/* Configuration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={systemConfig}
        onSave={handleSaveConfig}
      />

    </div>
  );
}
