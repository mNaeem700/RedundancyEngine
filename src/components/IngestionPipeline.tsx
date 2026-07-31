import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Cpu, 
  Database,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { RecordItem, ValidationResult, DatasetDomain } from '../types';

interface IngestionPipelineProps {
  onValidateSingle: (record: Partial<RecordItem>) => Promise<ValidationResult>;
  onBatchIngest: (records: Partial<RecordItem>[]) => Promise<any>;
  onRefreshData: () => void;
}

export const IngestionPipeline: React.FC<IngestionPipelineProps> = ({
  onValidateSingle,
  onBatchIngest,
  onRefreshData,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [domain, setDomain] = useState<DatasetDomain>('customers');

  // Single Entry Form state
  const [primaryKey, setPrimaryKey] = useState('');
  const [title, setTitle] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Sales');

  // Pipeline execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Batch upload state
  const [batchRawJson, setBatchRawJson] = useState('');
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  // Preset Test Scenarios
  const loadPresetScenario = (type: 'exact' | 'fuzzy_duplicate' | 'false_positive' | 'unique') => {
    setValidationResult(null);
    if (type === 'exact') {
      setDomain('customers');
      setPrimaryKey('alex.morgan@techcorp.io');
      setTitle('Alex Morgan');
      setSecondaryText('+1 (555) 234-5678 • Enterprise Sales');
      setContent('Senior Enterprise Account Director in San Francisco HQ. Leads Key Account Renewal Team.');
      setCategory('Sales');
    } else if (type === 'fuzzy_duplicate') {
      setDomain('customers');
      setPrimaryKey('alex.morgan@techcorp.io');
      setTitle('Alex Morgen'); // Typo
      setSecondaryText('+1 (555) 234-5678 • Ent. Sales Dept');
      setContent('Senior Enterprise Account Director in San Francisco HQ. Leads Key Account Renewal Team.');
      setCategory('Sales');
    } else if (type === 'false_positive') {
      // Looks like Dr. Robert Chen, but distinct department & blood group!
      setDomain('medical');
      setPrimaryKey('PAT-883921'); // Similar ID pattern
      setTitle('Dr. Robert Chen'); // Same title/name
      setSecondaryText('DOB: 1984-05-12 • Blood Group: O-'); // Different Blood group!
      setContent('Patient presents with acute migraine. Prescribed Sumatriptan 50mg. Allergy to Penicillin.'); // Different symptoms/dept!
      setCategory('Neurology');
    } else if (type === 'unique') {
      setDomain('financial');
      setPrimaryKey('TXN-20260731-1002');
      setTitle('AWS Cloud Infrastructure Monthly Billing');
      setSecondaryText('$12,490.00 USD • Pending Approval');
      setContent('Production Kubernetes Cluster Compute & Serverless Ingress Traffic Charges for July 2026.');
      setCategory('Cloud Operations');
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKey || !title) return;

    setIsAnalyzing(true);
    setValidationResult(null);

    try {
      const candidate: Partial<RecordItem> = {
        domain,
        primaryKey,
        title,
        secondaryText,
        content,
        category,
      };

      const result = await onValidateSingle(candidate);
      setValidationResult(result);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!batchRawJson.trim()) return;
    setIsAnalyzing(true);
    setBatchStatus('Ingesting batch dataset...');
    try {
      const parsed = JSON.parse(batchRawJson);
      const recordsArray = Array.isArray(parsed) ? parsed : [parsed];
      const batchResult = await onBatchIngest(recordsArray);
      setBatchStatus(`Batch completed! Processed: ${batchResult.processedCount} | Appended Unique: ${batchResult.appendedCount} | Blocked Duplicates: ${batchResult.rejectedCount} | Quarantined: ${batchResult.quarantinedCount}`);
      onRefreshData();
    } catch (err: any) {
      setBatchStatus(`Error parsing JSON: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Description & Mode Switcher */}
      <div className="bg-white border-4 border-black p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-black" />
            Pre-Ingestion Validation Gateway
          </h2>
          <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
            Validates incoming records in real-time against existing cloud database records. Prevents duplicates, catches fuzzy text variations, and uses Gemini AI to verify false positives before insertion.
          </p>
        </div>

        <div className="flex items-center bg-neutral-100 p-1 border-2 border-black">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 text-xs font-black uppercase transition-all border-2 ${
              mode === 'single'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-black border-transparent hover:bg-neutral-200'
            }`}
          >
            Single Entry Validation
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-3 py-1.5 text-xs font-black uppercase transition-all border-2 ${
              mode === 'batch'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-black border-transparent hover:bg-neutral-200'
            }`}
          >
            Batch Dataset Ingestion
          </button>
        </div>
      </div>

      {/* Preset Test Case Shortcuts */}
      <div className="bg-white border-2 border-black p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-black" />
            Instant Test Scenarios (1-Click Loaders)
          </span>
          <span className="text-[11px] font-bold text-neutral-500 uppercase">Test exact duplicates, fuzzy typos, or AI false positive detection</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => loadPresetScenario('exact')}
            className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
          >
            <div className="text-xs font-black text-black uppercase flex items-center justify-between">
              <span>Exact Hash Match</span>
              <span className="w-2.5 h-2.5 bg-red-600 border border-black"></span>
            </div>
            <p className="text-[10px] font-bold text-neutral-600 uppercase mt-1 line-clamp-1">100% identical record payload</p>
          </button>

          <button
            type="button"
            onClick={() => loadPresetScenario('fuzzy_duplicate')}
            className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
          >
            <div className="text-xs font-black text-black uppercase flex items-center justify-between">
              <span>Subtle Typo Dup</span>
              <span className="w-2.5 h-2.5 bg-yellow-400 border border-black"></span>
            </div>
            <p className="text-[10px] font-bold text-neutral-600 uppercase mt-1 line-clamp-1">"Alex Morgen" vs "Alex Morgan"</p>
          </button>

          <button
            type="button"
            onClick={() => loadPresetScenario('false_positive')}
            className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
          >
            <div className="text-xs font-black text-black uppercase flex items-center justify-between flex-wrap gap-1">
              <span>AI False Positive</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black bg-black text-white uppercase">AI Check</span>
            </div>
            <p className="text-[10px] font-bold text-neutral-600 uppercase mt-1 line-clamp-1">Same Dr. Name, Different Patient/Blood</p>
          </button>

          <button
            type="button"
            onClick={() => loadPresetScenario('unique')}
            className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
          >
            <div className="text-xs font-black text-black uppercase flex items-center justify-between">
              <span>Unique Record</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-black"></span>
            </div>
            <p className="text-[10px] font-bold text-neutral-600 uppercase mt-1 line-clamp-1">AWS Billing record (0% match)</p>
          </button>
        </div>
      </div>

      {/* Main Validation Input Grid */}
      {mode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Form Column */}
          <div className="lg:col-span-5 bg-white border-4 border-black p-5 space-y-4">
            <h3 className="text-sm font-black text-black uppercase border-b-2 border-black pb-3 flex items-center justify-between">
              <span>Record Fields Payload</span>
              <span className="text-xs font-bold text-neutral-500 uppercase">Pre-Ingestion Check</span>
            </h3>

            <form onSubmit={handleSingleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Dataset Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as DatasetDomain)}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 font-bold uppercase"
                >
                  <option value="customers">Customer CRM Records</option>
                  <option value="medical">Medical Patient Logs</option>
                  <option value="inventory">E-Commerce Inventory</option>
                  <option value="financial">Financial Transactions</option>
                  <option value="custom">Custom General Data</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Primary Identifier / Unique Key <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={primaryKey}
                  onChange={(e) => setPrimaryKey(e.target.value)}
                  placeholder="e.g. email@domain.com, PAT-1092, SKU-9938"
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Title / Entity Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. John Smith, Logitech Mouse, Payment Settlement"
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Secondary Contact / Subtitle Info
                </label>
                <input
                  type="text"
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value)}
                  placeholder="e.g. +1 555-0199, DOB: 1988, Electronics"
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Sales, Cardiology, Peripherals"
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Record Content / Details / Description
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter record details or payload body text..."
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-yellow-50 resize-none font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !primaryKey || !title}
                className="w-full py-3 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center space-x-2 transition-all mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Executing Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validate & Append to DB</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Validation Analysis Feed & Output Column */}
          <div className="lg:col-span-7 bg-white border-4 border-black p-5 flex flex-col justify-between">
            {validationResult ? (
              <div className="space-y-5">
                
                {/* Result Header Badge */}
                <div className={`p-4 border-2 border-black flex items-start justify-between ${
                  validationResult.classification === 'EXACT_DUPLICATE'
                    ? 'bg-red-500 text-white'
                    : validationResult.classification === 'FALSE_POSITIVE'
                    ? 'bg-black text-white'
                    : validationResult.classification === 'UNIQUE_VERIFIED'
                    ? 'bg-green-300 text-black'
                    : 'bg-yellow-400 text-black'
                }`}>
                  <div className="flex items-start space-x-3">
                    {validationResult.classification === 'EXACT_DUPLICATE' ? (
                      <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    ) : validationResult.classification === 'FALSE_POSITIVE' ? (
                      <Sparkles className="w-6 h-6 shrink-0 mt-0.5" />
                    ) : validationResult.classification === 'UNIQUE_VERIFIED' ? (
                      <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                    )}

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-black text-sm uppercase">
                          {validationResult.classification === 'EXACT_DUPLICATE' && 'Exact Duplicate Blocked'}
                          {validationResult.classification === 'FALSE_POSITIVE' && 'AI Verified False Positive (Appended)'}
                          {validationResult.classification === 'UNIQUE_VERIFIED' && 'Unique Verified Entry Appended'}
                          {validationResult.classification === 'HIGH_CONFIDENCE_DUP' && 'High-Confidence Duplicate Flagged'}
                          {validationResult.classification === 'NEAR_DUPLICATE_REVIEW' && 'Near-Duplicate Quarantined for Review'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 font-black uppercase tracking-wider border border-current">
                          {validationResult.actionTaken}
                        </span>
                      </div>
                      <p className="text-xs uppercase font-bold mt-1 opacity-90">
                        Match Score: <strong className="font-black">{validationResult.overallSimilarity}%</strong> • Processed in {validationResult.executionTimeMs}ms
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gemini AI Contextual Explanation Box */}
                {validationResult.aiAnalysis && (
                  <div className="bg-neutral-50 border-2 border-black p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-xs font-black uppercase text-black">Gemini AI False-Positive Reasoning</span>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                        Confidence: {validationResult.aiAnalysis.confidenceScore}%
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-black leading-relaxed">
                      {validationResult.aiAnalysis.reasoning}
                    </p>

                    {validationResult.aiAnalysis.keyDifferences.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-black uppercase text-black block mb-1">Key Contextual Differences Identified:</span>
                        <ul className="space-y-1">
                          {validationResult.aiAnalysis.keyDifferences.map((diff, i) => (
                            <li key={i} className="text-[11px] font-bold text-neutral-800 flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 bg-black"></span>
                              <span>{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Field-by-Field Similarity Scores */}
                {validationResult.fieldDetails.length > 0 && (
                  <div className="bg-white border-2 border-black p-4 space-y-3">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider">
                      Algorithmic Field Comparison
                    </h4>

                    <div className="space-y-2.5">
                      {validationResult.fieldDetails.map((f, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-black font-bold uppercase">{f.field} ({f.matchMethod})</span>
                            <span className="font-black text-black">
                              {Math.round(f.similarityScore * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 border border-black overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                f.similarityScore > 0.9
                                  ? 'bg-red-600'
                                  : f.similarityScore > 0.7
                                  ? 'bg-yellow-400'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.round(f.similarityScore * 100)}%` }}
                            ></div>
                          </div>
                          <div className="grid grid-cols-2 text-[11px] text-black gap-2 bg-neutral-100 p-2 border border-black font-mono">
                            <div>Candidate: <span className="font-bold">{f.valueA || 'N/A'}</span></div>
                            <div>Existing: <span className="font-bold">{f.valueB || 'N/A'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched DB Record Side-by-Side */}
                {validationResult.matchedExistingRecord && (
                  <div className="bg-white border-2 border-black p-4">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                      Matched Database Record Comparison
                    </h4>
                    <div className="p-3 bg-neutral-100 border border-black space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="font-bold text-black">{validationResult.matchedExistingRecord.title}</span>
                        <span className="text-neutral-500 text-[10px]">{validationResult.matchedExistingRecord.id}</span>
                      </div>
                      <p className="text-neutral-700 text-[11px]">{validationResult.matchedExistingRecord.secondaryText}</p>
                      <p className="text-black text-[11px] italic mt-1 line-clamp-2">"{validationResult.matchedExistingRecord.content}"</p>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-black bg-neutral-50">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-black uppercase">Validation Output Ready</h3>
                <p className="text-xs font-bold text-neutral-600 max-w-sm mt-1 uppercase">
                  Enter candidate record details or click one of the Instant Test Scenario buttons above to trigger real-time deduplication analysis.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Batch Ingestion View */
        <div className="bg-white border-4 border-black p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-black uppercase flex items-center gap-2">
              <FileText className="w-5 h-5 text-black" />
              Batch JSON Ingestion Pipeline
            </h3>
            <p className="text-xs font-bold text-neutral-600 uppercase mt-1">
              Paste a JSON array of records to ingest in a single batch. Each record will pass through the multi-stage deduplication gatekeeper sequentially.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              JSON Array Payload
            </label>
            <textarea
              rows={8}
              value={batchRawJson}
              onChange={(e) => setBatchRawJson(e.target.value)}
              placeholder={`[\n  {\n    "primaryKey": "user1@example.com",\n    "title": "Jane Doe",\n    "secondaryText": "Marketing Director",\n    "content": "Lead growth strategy",\n    "category": "Marketing"\n  }\n]`}
              className="w-full bg-white border-2 border-black p-3 text-xs text-black font-mono focus:outline-none focus:bg-yellow-50 font-bold"
            ></textarea>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const sampleBatch = [
                  { primaryKey: 'sarah.connor@cyberdyne.org', title: 'Sarah Connor', secondaryText: '+1 555-987-6543', content: 'CISO Threat Audits', category: 'Security' },
                  { primaryKey: 'new.user@domain.com', title: 'Michael Vance', secondaryText: 'Ops Lead', content: 'Cloud architect', category: 'DevOps' },
                  { primaryKey: 'PAT-883920', title: 'Dr. Robert Chen', secondaryText: 'DOB: 1984-05-12', content: 'Cardiology Patient amoxicillin', category: 'Cardiology' }
                ];
                setBatchRawJson(JSON.stringify(sampleBatch, null, 2));
              }}
              className="text-xs text-black font-black uppercase underline hover:bg-yellow-300 px-1"
            >
              Load Sample Batch
            </button>

            <button
              onClick={handleBatchSubmit}
              disabled={isAnalyzing || !batchRawJson.trim()}
              className="py-2.5 px-6 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider border-2 border-black transition-all flex items-center space-x-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Execute Batch Ingestion</span>
                </>
              )}
            </button>
          </div>

          {batchStatus && (
            <div className="p-3 bg-neutral-100 border-2 border-black text-xs text-black font-mono font-bold">
              {batchStatus}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
