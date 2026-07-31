import React from 'react';
import { AnalyticsSummary, AuditLog } from '../types';
import { Sparkles, ShieldCheck, Database, HardDrive, DollarSign, Activity, FileText } from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
  auditLogs: AuditLog[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  auditLogs,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border-4 border-black p-5">
        <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-black" />
          Deduplication Analytics & Audit Trail
        </h2>
        <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
          Efficiency metrics, storage compression, false positive accuracy rates, and immutable pre-ingestion audit logs.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-black p-4 flex items-center space-x-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 bg-black text-white border border-black flex items-center justify-center shrink-0 font-black">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Duplicates Blocked</p>
            <p className="text-2xl font-black text-black">{analytics?.duplicatesPrevented ?? 0}</p>
            <span className="text-[10px] font-bold text-neutral-600 uppercase">Prevented cloud clutter</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 flex items-center space-x-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 bg-yellow-300 text-black border border-black flex items-center justify-center shrink-0 font-black">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-black">False Positives</p>
            <p className="text-2xl font-black text-black">{analytics?.falsePositivesIdentified ?? 0}</p>
            <span className="text-[10px] font-bold text-neutral-600 uppercase">Distinct data preserved</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 flex items-center space-x-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 bg-green-300 text-black border border-black flex items-center justify-center shrink-0 font-black">
            <HardDrive className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Storage Saved</p>
            <p className="text-2xl font-black text-black">
              {((analytics?.storageSavedBytes ?? 0) / 1024).toFixed(1)} KB
            </p>
            <span className="text-[10px] font-bold text-neutral-600 uppercase">Estimated ~${analytics?.estimatedCostSavingsUSD ?? 0} saved</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 flex items-center space-x-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 bg-black text-white border border-black flex items-center justify-center shrink-0 font-black">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Accuracy Rate</p>
            <p className="text-2xl font-black text-black">{analytics?.accuracyRate ?? 99}%</p>
            <span className="text-[10px] font-bold text-neutral-600 uppercase">Attempts: {analytics?.totalValidationAttempts ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white border-4 border-black p-5 space-y-4">
        <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2">
          <FileText className="w-4 h-4 text-black" />
          Real-Time Gatekeeper Audit Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-2 border-black">
            <thead className="bg-black text-white uppercase tracking-wider text-[10px] font-black">
              <tr>
                <th className="p-2.5 border-r border-neutral-700">Timestamp</th>
                <th className="p-2.5 border-r border-neutral-700">Event Type</th>
                <th className="p-2.5 border-r border-neutral-700">Description</th>
                <th className="p-2.5 border-r border-neutral-700">Record ID</th>
                <th className="p-2.5">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-600 font-black uppercase text-xs">
                    No audit log events recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-yellow-50">
                    <td className="p-2.5 text-neutral-700 font-bold text-[11px] border-r border-black">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5 border-r border-black">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                        log.eventType === 'REJECT_DUPLICATE'
                          ? 'bg-red-500 text-white'
                          : log.eventType === 'FALSE_POSITIVE_OVERRIDE'
                          ? 'bg-black text-white'
                          : log.eventType === 'QUARANTINE_FLAG'
                          ? 'bg-yellow-400 text-black'
                          : 'bg-green-300 text-black'
                      }`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-2.5 font-sans font-bold text-black border-r border-black">{log.details}</td>
                    <td className="p-2.5 text-neutral-700 font-bold text-[11px] border-r border-black">{log.recordId}</td>
                    <td className="p-2.5 font-black text-black">
                      {log.similarityScore !== undefined ? `${log.similarityScore}%` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
