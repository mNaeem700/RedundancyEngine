import React, { useState } from 'react';
import { QuarantineItem } from '../types';
import { AlertTriangle, Check, X, GitMerge, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';

interface QuarantineQueueProps {
  items: QuarantineItem[];
  onAction: (quarantineId: string, action: 'APPROVE_FALSE_POSITIVE' | 'CONFIRM_DUPLICATE' | 'MERGE', notes?: string) => Promise<void>;
  onRefresh: () => void;
}

export const QuarantineQueue: React.FC<QuarantineQueueProps> = ({
  items,
  onAction,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [selectedItem, setSelectedItem] = useState<QuarantineItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = items.filter((item) => {
    if (filter === 'PENDING') return item.status === 'PENDING';
    return true;
  });

  const handleExecuteAction = async (action: 'APPROVE_FALSE_POSITIVE' | 'CONFIRM_DUPLICATE' | 'MERGE') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await onAction(selectedItem.id, action, reviewNotes);
      setSelectedItem(null);
      setReviewNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Bar */}
      <div className="bg-white border-4 border-black p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-black" />
            Human-in-the-Loop Quarantine Queue
          </h2>
          <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
            Flagged near-duplicates and borderline similarity records requiring human verification to confirm duplicates or approve false positives.
          </p>
        </div>

        <div className="flex items-center bg-neutral-100 p-1 border-2 border-black">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 text-xs font-black uppercase transition-all border-2 ${
              filter === 'PENDING'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-black border-transparent hover:bg-neutral-200'
            }`}
          >
            Pending Review ({items.filter((i) => i.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-black uppercase transition-all border-2 ${
              filter === 'ALL'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-black border-transparent hover:bg-neutral-200'
            }`}
          >
            History Log ({items.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Item List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white border-2 border-black p-8 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-black mx-auto" />
              <p className="text-xs font-black uppercase text-black">No Quarantine Items</p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase">
                {filter === 'PENDING' ? 'All flagged items have been reviewed.' : 'No quarantine history logged yet.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  selectedItem?.id === item.id
                    ? 'bg-yellow-300 text-black ring-2 ring-black'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black uppercase block">
                      {item.candidateRecord.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-600">
                      {item.candidateRecord.primaryKey}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                      item.overallSimilarity >= 90
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-400 text-black'
                    }`}>
                      {item.overallSimilarity}% Match
                    </span>
                    <span className="block text-[10px] font-mono font-bold text-neutral-500 mt-1">
                      {new Date(item.flaggedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] font-bold uppercase text-neutral-700 mt-2 line-clamp-1">
                  VS Match: <strong className="text-black font-black">{item.existingMatch?.title || 'Existing DB Record'}</strong>
                </p>

                {item.status !== 'PENDING' && (
                  <div className="mt-2 pt-2 border-t-2 border-black flex items-center justify-between text-[10px] font-black uppercase">
                    <span className="text-neutral-600">Status:</span>
                    <span className="text-black bg-emerald-300 px-1.5 py-0.5 border border-black">{item.status}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Item Review & Resolution Panel */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-5 space-y-5">
          {selectedItem ? (
            <div className="space-y-5">
              
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <h3 className="text-base font-black uppercase text-black">Review Flagged Entry</h3>
                  <p className="text-xs font-mono font-bold text-neutral-500">ID: {selectedItem.id}</p>
                </div>
                <span className="text-xs px-3 py-1 bg-black text-white font-black uppercase">
                  {selectedItem.overallSimilarity}% Similarity Flag
                </span>
              </div>

              {/* Side-by-Side Record Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                {/* Candidate Entry */}
                <div className="p-3 bg-neutral-50 border-2 border-black space-y-2 font-mono">
                  <span className="text-[10px] font-black uppercase text-black block bg-yellow-300 border border-black px-1">
                    Incoming Candidate Entry
                  </span>
                  <div>
                    <strong className="text-black block font-black text-sm">{selectedItem.candidateRecord.title}</strong>
                    <span className="text-neutral-600 text-[11px]">{selectedItem.candidateRecord.primaryKey}</span>
                  </div>
                  <p className="text-neutral-700 text-[11px] font-bold">{selectedItem.candidateRecord.secondaryText}</p>
                  <p className="text-black text-[11px] bg-white p-2 border border-black font-semibold">
                    "{selectedItem.candidateRecord.content}"
                  </p>
                </div>

                {/* Existing DB Record */}
                <div className="p-3 bg-neutral-50 border-2 border-black space-y-2 font-mono">
                  <span className="text-[10px] font-black uppercase text-black block bg-neutral-200 border border-black px-1">
                    Existing Database Record
                  </span>
                  <div>
                    <strong className="text-black block font-black text-sm">{selectedItem.existingMatch?.title || 'N/A'}</strong>
                    <span className="text-neutral-600 text-[11px]">{selectedItem.existingMatch?.primaryKey || 'N/A'}</span>
                  </div>
                  <p className="text-neutral-700 text-[11px] font-bold">{selectedItem.existingMatch?.secondaryText}</p>
                  <p className="text-black text-[11px] bg-white p-2 border border-black font-semibold">
                    "{selectedItem.existingMatch?.content}"
                  </p>
                </div>

              </div>

              {/* AI Contextual Analysis Rationale */}
              {selectedItem.aiAnalysis && (
                <div className="p-3 bg-neutral-100 border-2 border-black space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-black" />
                    <span className="text-xs font-black uppercase text-black">Gemini AI Audit Recommendation</span>
                  </div>
                  <p className="text-xs font-semibold text-black leading-relaxed">
                    {selectedItem.aiAnalysis.reasoning}
                  </p>
                  {selectedItem.aiAnalysis.keyDifferences.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-black uppercase text-black block mb-1">Key Context Differences:</span>
                      <ul className="list-disc list-inside text-[11px] font-bold text-neutral-800 space-y-0.5">
                        {selectedItem.aiAnalysis.keyDifferences.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Action Form */}
              {selectedItem.status === 'PENDING' ? (
                <div className="space-y-3 pt-3 border-t-2 border-black">
                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">
                      Reviewer Notes / Rationale (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Verified separate employee in different department..."
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono font-bold text-black focus:outline-none focus:bg-yellow-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleExecuteAction('APPROVE_FALSE_POSITIVE')}
                      disabled={isSubmitting}
                      className="py-2.5 px-3 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center space-x-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Approve False Pos</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('CONFIRM_DUPLICATE')}
                      disabled={isSubmitting}
                      className="py-2.5 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center space-x-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <X className="w-4 h-4 text-white" />
                      <span>Confirm Duplicate</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('MERGE')}
                      disabled={isSubmitting}
                      className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center space-x-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <GitMerge className="w-4 h-4 text-black" />
                      <span>Smart Merge</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-200 border-2 border-black text-xs text-black font-bold flex items-center justify-between">
                  <div>
                    <span className="font-black uppercase block">Resolution Completed: {selectedItem.status}</span>
                    <span className="text-[11px] uppercase">{selectedItem.notes}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold">Reviewed at {new Date(selectedItem.reviewedAt || '').toLocaleTimeString()}</span>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-black bg-neutral-50">
              <ShieldAlert className="w-8 h-8 text-black mb-2" />
              <h3 className="text-xs font-black uppercase text-black">Select a Quarantine Record</h3>
              <p className="text-[11px] font-bold uppercase text-neutral-600 max-w-xs mt-1">
                Click any record on the left to inspect matched field scores, review AI rationale, and take action.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
