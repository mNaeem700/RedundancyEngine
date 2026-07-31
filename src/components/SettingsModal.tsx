import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Settings, X, Check, Sliders, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onSave: (updatedConfig: Partial<SystemConfig>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [fuzzyThreshold, setFuzzyThreshold] = useState(config.fuzzyThreshold);
  const [useAiContextualCheck, setUseAiContextualCheck] = useState(config.useAiContextualCheck);
  const [usePhoneticMatching, setUsePhoneticMatching] = useState(config.usePhoneticMatching);
  const [autoRejectExactDuplicates, setAutoRejectExactDuplicates] = useState(config.autoRejectExactDuplicates);
  const [autoQuarantineNearDuplicates, setAutoQuarantineNearDuplicates] = useState(config.autoQuarantineNearDuplicates);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        fuzzyThreshold,
        useAiContextualCheck,
        usePhoneticMatching,
        autoRejectExactDuplicates,
        autoQuarantineNearDuplicates,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black max-w-lg w-full p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-black" />
            <h3 className="text-base font-black text-black uppercase">Deduplication Gatekeeper Config</h3>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-neutral-200 p-1 border-2 border-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Fuzzy Threshold Slider */}
          <div className="bg-neutral-50 p-4 border-2 border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-black uppercase">Fuzzy Similarity Threshold</span>
              <span className="px-2 py-0.5 bg-yellow-300 text-black border border-black font-black font-mono">
                {Math.round(fuzzyThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.65"
              max="0.95"
              step="0.01"
              value={fuzzyThreshold}
              onChange={(e) => setFuzzyThreshold(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <p className="text-[11px] font-bold text-neutral-600 uppercase">
              Records with multi-field similarity scores above {Math.round(fuzzyThreshold * 100)}% will be flagged as duplicates.
            </p>
          </div>

          {/* AI Check Toggle */}
          <div className="bg-neutral-50 p-4 border-2 border-black flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="font-black text-black uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                Gemini AI Contextual False-Positive Analysis
              </span>
              <p className="text-[11px] font-bold text-neutral-600 uppercase">
                Uses Gemini 3.6 Flash to analyze context and prevent false-positive rejection of distinct entities.
              </p>
            </div>
            <input
              type="checkbox"
              checked={useAiContextualCheck}
              onChange={(e) => setUseAiContextualCheck(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer shrink-0 border-2 border-black"
            />
          </div>

          {/* Phonetic Soundex Toggle */}
          <div className="bg-neutral-50 p-4 border-2 border-black flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="font-black text-black uppercase">Phonetic Name Matching (Soundex)</span>
              <p className="text-[11px] font-bold text-neutral-600 uppercase">
                Catches phonetic misspellings in name fields (e.g. "Jon Smyth" vs "John Smith").
              </p>
            </div>
            <input
              type="checkbox"
              checked={usePhoneticMatching}
              onChange={(e) => setUsePhoneticMatching(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer shrink-0 border-2 border-black"
            />
          </div>

          {/* Auto Reject Exact Toggle */}
          <div className="bg-neutral-50 p-4 border-2 border-black flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="font-black text-black uppercase">Auto-Reject 100% Hash Duplicates</span>
              <p className="text-[11px] font-bold text-neutral-600 uppercase">
                Automatically block exact content hash matches without sending to quarantine.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRejectExactDuplicates}
              onChange={(e) => setAutoRejectExactDuplicates(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer shrink-0 border-2 border-black"
            />
          </div>

          {/* Auto Quarantine Near Toggle */}
          <div className="bg-neutral-50 p-4 border-2 border-black flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="font-black text-black uppercase">Auto-Quarantine Borderline Matches</span>
              <p className="text-[11px] font-bold text-neutral-600 uppercase">
                Send near-duplicate records to Human Quarantine Queue for review.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoQuarantineNearDuplicates}
              onChange={(e) => setAutoQuarantineNearDuplicates(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer shrink-0 border-2 border-black"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black uppercase text-black hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center space-x-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Save Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
};
