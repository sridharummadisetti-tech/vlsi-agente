import React, { useState, useEffect } from 'react';
import { 
  getHistoryItems, 
  clearHistoryStore, 
  deleteHistoryItem, 
  HistoryItem 
} from '../utils/historyStore';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Clock, 
  Cpu, 
  Layers 
} from 'lucide-react';

interface HistoryViewerProps {
  onSelectHistoryPrompt: (prompt: string, icId?: string) => void;
  onNavigateToTab: (tabId: string) => void;
  onSelectComponent?: (id: string) => void;
}

export function HistoryViewer({ onSelectHistoryPrompt, onNavigateToTab, onSelectComponent }: HistoryViewerProps) {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHistoryList(getHistoryItems());
  }, []);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all prompt history?')) {
      clearHistoryStore();
      setHistoryList([]);
    }
  };

  const handleDeleteOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistoryList(updated);
  };

  const filteredItems = historyList.filter(item => 
    item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.componentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#141518] text-gray-200">
      {/* Search & Actions Bar */}
      <div className="p-3 bg-[#18191d] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt or IC history..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111215] border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
          />
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center space-x-1.5"
            title="Clear All History"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* List Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
            <Clock size={32} className="text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-400">No History Records Found</p>
            <p className="text-xs text-gray-500 max-w-xs">
              {searchTerm ? 'No prompts matched your search query.' : 'Prompts and component queries you enter in VLSI Studio will appear here for fast reuse.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectHistoryPrompt(item.query, item.icId)}
              className="group p-3 rounded-xl bg-[#191a1f] hover:bg-[#202127] border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-all shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cpu size={13} />
                  </span>
                  <span className="font-semibold text-xs text-gray-100">{item.componentName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                    {item.componentType}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => handleDeleteOne(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-400 rounded transition-opacity"
                    title="Delete item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-300 line-clamp-2 font-mono bg-black/30 p-2 rounded-lg border border-white/5">
                {item.query}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                <span className="flex items-center space-x-1 text-emerald-400/80">
                  <Sparkles size={11} />
                  <span>Click to reload prompt</span>
                </span>
                <span className="flex items-center space-x-1 text-gray-400 group-hover:text-emerald-300">
                  <span>Load</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
