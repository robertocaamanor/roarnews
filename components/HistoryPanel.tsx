
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  currentId?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onSelectItem, 
  onDeleteItem, 
  onClearHistory,
  currentId 
}) => {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <i className="fa-solid fa-folder-open text-2xl"></i>
        </div>
        <h3 className="text-slate-800 font-bold mb-1">Biblioteca vacía</h3>
        <p className="text-slate-500 text-sm">Los artículos que generes aparecerán aquí para consultarlos después.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left"></i> Biblioteca de Artículos
        </h3>
        <button 
          onClick={onClearHistory}
          className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-tighter transition-colors"
        >
          Vaciar Todo
        </button>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
              currentId === item.id 
              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {new Date(item.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
            <h4 className={`text-sm font-bold leading-tight line-clamp-2 ${currentId === item.id ? 'text-indigo-900' : 'text-slate-800'}`}>
              {item.title}
            </h4>
            <div className="mt-2 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
               <span className="text-[10px] text-slate-500 font-medium truncate">{item.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
