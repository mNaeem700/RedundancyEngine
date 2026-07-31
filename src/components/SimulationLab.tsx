import React, { useState } from 'react';
import { Layers, Play, CheckCircle, XCircle, AlertTriangle, Sparkles, RefreshCcw, Activity } from 'lucide-react';
import { ValidationResult } from '../types';

interface SimulationLabProps {
  onBatchIngest: (records: any[]) => Promise<any>;
  onRefresh: () => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  onBatchIngest,
  onRefresh,
}) => {
  const [batchSize, setBatchSize] = useState<number>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    processedCount: number;
    appendedCount: number;
    rejectedCount: number;
    quarantinedCount: number;
    results: ValidationResult[];
    timeMs: number;
  } | null>(null);

  const generateSyntheticBatch = (count: number) => {
    const baseNames = ['John Smith', 'Sarah Connor', 'Robert Chen', 'Alex Morgan', 'David Miller', 'Emily Davis', 'Michael Brown', 'Jessica Wilson'];
    const domains = ['customers', 'medical', 'inventory', 'financial'];
    
    const records = [];
    for (let i = 0; i < count; i++) {
      const isExactDup = i % 4 === 0;
      const isTypoDup = i % 4 === 1;
      const isFalsePos = i % 4 === 2;
      
      const baseName = baseNames[i % baseNames.length];
      
      if (isExactDup) {
        records.push({
          primaryKey: 'alex.morgan@techcorp.io',
          title: 'Alex Morgan',
          secondaryText: '+1 (555) 234-5678 • Enterprise Sales',
          content: 'Senior Enterprise Account Director in San Francisco HQ. Leads Key Account Renewal Team.',
          category: 'Sales',
          domain: 'customers'
        });
      } else if (isTypoDup) {
        records.push({
          primaryKey: 'alex.morgen@techcorp.io',
          title: 'Alex Morgen',
          secondaryText: '+1 (555) 234-5678 • Enterprise Sales',
          content: 'Senior Enterprise Account Director in SF HQ. Leads Key Account Renewal Team.',
          category: 'Sales',
          domain: 'customers'
        });
      } else if (isFalsePos) {
        records.push({
          primaryKey: `PAT-${8000 + i}`,
          title: 'Dr. Robert Chen',
          secondaryText: `DOB: 1990-01-15 • Blood Group: AB+ • Location: ${i % 2 === 0 ? 'Boston' : 'Chicago'}`,
          content: `Patient consultation for orthopedic surgery evaluation. Unique ID PAT-${8000 + i}.`,
          category: 'Orthopedics',
          domain: 'medical'
        });
      } else {
        records.push({
          primaryKey: `USER-UNIQ-${Date.now()}-${i}`,
          title: `${baseName} (Unique Entity ${i})`,
          secondaryText: `Specialist Level ${i} • Regional Hub`,
          content: `Unique record entry generated during automated stress test benchmark #${i}.`,
          category: 'Operations',
          domain: 'customers'
        });
      }
    }
    return records;
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setTestResults(null);
    const startTime = Date.now();

    try {
      const syntheticBatch = generateSyntheticBatch(batchSize);
      const batchRes = await onBatchIngest(syntheticBatch);
      setTestResults({
        processedCount: batchRes.processedCount,
        appendedCount: batchRes.appendedCount,
        rejectedCount: batchRes.rejectedCount,
        quarantinedCount: batchRes.quarantinedCount,
        results: batchRes.results || [],
        timeMs: Date.now() - startTime
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border-4 border-black p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            Batch Deduplication Stress Lab
          </h2>
          <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
            Simulate realistic multi-record dataset ingestion workloads featuring exact duplicates, typos, phonetic variations, and AI false positives.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="bg-white border-2 border-black px-3 py-1.5 text-xs text-black focus:outline-none focus:bg-yellow-50 font-black uppercase"
          >
            <option value={10}>10 Synthetic Records</option>
            <option value={20}>20 Synthetic Records</option>
            <option value={40}>40 Synthetic Records</option>
          </select>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="py-2 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center space-x-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {isRunning ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                <span>Run Batch Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Benchmark Summary Metrics */}
      {testResults && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-black p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Total Processed</p>
            <p className="text-3xl font-black text-black mt-1">{testResults.processedCount}</p>
            <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Time: {testResults.timeMs}ms</span>
          </div>

          <div className="bg-white border-2 border-black p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Appended Unique</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{testResults.appendedCount}</p>
            <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Includes AI False Positives</span>
          </div>

          <div className="bg-white border-2 border-black p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Duplicates Blocked</p>
            <p className="text-3xl font-black text-red-600 mt-1">{testResults.rejectedCount}</p>
            <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Exact & High Confidence</span>
          </div>

          <div className="bg-white border-2 border-black p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-black">Quarantined Review</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{testResults.quarantinedCount}</p>
            <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Sent to Quarantine Queue</span>
          </div>
        </div>
      )}

      {/* Detailed Benchmark Execution Results Table */}
      {testResults?.results && testResults.results.length > 0 && (
        <div className="bg-white border-4 border-black p-5 space-y-4">
          <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2">
            <Activity className="w-4 h-4 text-black" />
            Simulation Log Output
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-2 border-black">
              <thead className="bg-black text-white uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="p-2.5 border-r border-neutral-700">Title / Entity</th>
                  <th className="p-2.5 border-r border-neutral-700">Primary Key</th>
                  <th className="p-2.5 border-r border-neutral-700">Classification</th>
                  <th className="p-2.5 border-r border-neutral-700">Match %</th>
                  <th className="p-2.5">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black font-mono">
                {testResults.results.map((res, idx) => (
                  <tr key={idx} className="hover:bg-yellow-50">
                    <td className="p-2.5 font-sans font-black text-black border-r border-black">{res.candidateRecord.title}</td>
                    <td className="p-2.5 text-neutral-700 font-bold text-[11px] border-r border-black">{res.candidateRecord.primaryKey}</td>
                    <td className="p-2.5 border-r border-black">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                        res.classification === 'EXACT_DUPLICATE'
                          ? 'bg-red-500 text-white'
                          : res.classification === 'FALSE_POSITIVE'
                          ? 'bg-black text-white'
                          : res.classification === 'UNIQUE_VERIFIED'
                          ? 'bg-green-300 text-black'
                          : 'bg-yellow-400 text-black'
                      }`}>
                        {res.classification}
                      </span>
                    </td>
                    <td className="p-2.5 font-black text-black border-r border-black">{res.overallSimilarity}%</td>
                    <td className="p-2.5 font-sans font-bold text-neutral-800 uppercase text-[11px]">{res.actionTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
