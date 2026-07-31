import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Settings, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface HeaderProps {
  analytics: AnalyticsSummary | null;
  onOpenSettings: () => void;
  onResetSeed: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingQuarantineCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  analytics,
  onOpenSettings,
  onResetSeed,
  activeTab,
  setActiveTab,
  pendingQuarantineCount,
}) => {
  return (
    <header className="bg-white border-b-4 border-black text-black sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 border-b-2 border-black">
          
          {/* Logo & System Identity */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-500 mb-0.5">
              SYSTEM v4.02 // CLOUD-NATIVE
            </span>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl sm:text-4xl font-black leading-none tracking-tighter uppercase text-black">
                Redundancy<span className="bg-black text-white px-2 py-0.5 ml-2">Engine</span>
              </h1>
              <span className="hidden sm:inline-flex bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
                Active Scan
              </span>
            </div>
            <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
              Data Redundancy Removal & AI False-Positive Detection
            </p>
          </div>

          {/* Key Metrics Quick View */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="border-2 border-black bg-white p-2.5 min-w-[120px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">Verified Records</p>
              <p className="font-black text-black text-xl leading-none mt-1">{analytics?.totalRecordsInDB ?? 0}</p>
            </div>

            <div className="border-2 border-black bg-white p-2.5 min-w-[120px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">Duplicates Blocked</p>
              <p className="font-black text-red-600 text-xl leading-none mt-1">{analytics?.duplicatesPrevented ?? 0}</p>
            </div>

            <div className="border-2 border-black bg-white p-2.5 min-w-[120px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">False Positives</p>
              <p className="font-black text-black text-xl leading-none mt-1">{analytics?.falsePositivesIdentified ?? 0}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetSeed}
              title="Re-seed Demo Data"
              className="p-2.5 bg-white text-black hover:bg-neutral-200 border-2 border-black font-black uppercase transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black text-white bg-black hover:bg-neutral-800 border-2 border-black transition-colors uppercase"
            >
              <Settings className="w-4 h-4" />
              <span>Config Rules</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-2 overflow-x-auto py-3">
          <button
            onClick={() => setActiveTab('ingest')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap border-2 border-black ${
              activeTab === 'ingest'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingestion & Validation</span>
          </button>

          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all relative whitespace-nowrap border-2 border-black ${
              activeTab === 'quarantine'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Quarantine Review</span>
            {pendingQuarantineCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-yellow-400 text-black border border-black uppercase">
                {pendingQuarantineCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap border-2 border-black ${
              activeTab === 'database'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Explorer ({analytics?.totalRecordsInDB ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap border-2 border-black ${
              activeTab === 'simulation'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Batch Stress Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap border-2 border-black ${
              activeTab === 'analytics'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Analytics & Audit Log</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
