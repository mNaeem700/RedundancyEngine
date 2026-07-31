import React, { useState } from 'react';
import { RecordItem, DatasetDomain } from '../types';
import { Database, Search, Filter, Hash, Tag, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface DatabaseExplorerProps {
  records: RecordItem[];
  totalCount: number;
  onSearch: (query: string, domain: string, category: string) => void;
  onCheckAgainstDB: (record: RecordItem) => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  records,
  totalCount,
  onSearch,
  onCheckAgainstDB,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
    onSearch(q, domainFilter, categoryFilter);
  };

  const handleDomainChange = (d: string) => {
    setDomainFilter(d);
    onSearch(searchQuery, d, categoryFilter);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Domain Filter Bar */}
      <div className="bg-white border-4 border-black p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-black" />
              Verified Database Explorer
            </h2>
            <p className="text-xs font-bold uppercase text-neutral-600 mt-1">
              Explore unique, verified entries currently appended to the cloud database. Clean dataset free of duplicates.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-black uppercase text-black bg-yellow-300 px-3 py-1.5 border-2 border-black">
            <span>Verified Records:</span>
            <span className="text-black font-black">{records.length} / {totalCount}</span>
          </div>
        </div>

        {/* Search Input & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-black absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by title, primary key, or content..."
              className="w-full bg-white border-2 border-black pl-9 pr-3 py-2 text-xs font-mono font-bold text-black focus:outline-none focus:bg-yellow-50"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={domainFilter}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono font-bold uppercase text-black focus:outline-none focus:bg-yellow-50"
            >
              <option value="all">All Domains</option>
              <option value="customers">Customers CRM</option>
              <option value="medical">Medical Patient Logs</option>
              <option value="inventory">E-Commerce Inventory</option>
              <option value="financial">Financial Transactions</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setDomainFilter('all');
                onSearch('', 'all', 'all');
              }}
              className="text-xs text-black font-black uppercase underline hover:bg-yellow-300 px-2 py-1"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Record Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-black p-12 text-center space-y-2">
            <Database className="w-10 h-10 text-black mx-auto" />
            <p className="text-xs font-black uppercase text-black">No Matching Records Found</p>
            <p className="text-[11px] font-bold uppercase text-neutral-600">Try adjusting your search query or domain filters.</p>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="bg-white border-2 border-black p-4 flex flex-col justify-between space-y-3 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 group"
            >
              <div className="space-y-2">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-black text-white border border-black">
                    {record.domain}
                  </span>
                  <span className="text-[10px] text-neutral-600 font-mono font-bold flex items-center gap-1">
                    <Hash className="w-3 h-3 text-black" />
                    {record.contentHash ? record.contentHash.substring(0, 14) : 'hash_val'}...
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black uppercase">
                    {record.title}
                  </h3>
                  <span className="text-xs text-neutral-700 font-mono font-bold block mt-0.5">
                    {record.primaryKey}
                  </span>
                </div>

                {record.secondaryText && (
                  <p className="text-xs text-neutral-800 font-bold uppercase">
                    {record.secondaryText}
                  </p>
                )}

                <div className="p-2.5 bg-neutral-100 border border-black text-[11px] text-black font-mono font-medium line-clamp-3 leading-relaxed">
                  "{record.content}"
                </div>
              </div>

              {/* Footer info & Manual Check Trigger */}
              <div className="pt-2 border-t-2 border-black flex items-center justify-between text-[10px]">
                <span className="text-neutral-600 font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-black" />
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => onCheckAgainstDB(record)}
                  className="text-black font-black uppercase underline hover:bg-yellow-300 px-1.5 py-0.5 flex items-center gap-1 transition-colors"
                >
                  <span>Check Dupes</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
