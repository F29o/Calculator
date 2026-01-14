
import React from 'react';
import { CalculationRecord } from '../types';

interface HistoryItemProps {
  item: CalculationRecord;
  onRestore: (expression: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onRestore }) => {
  return (
    <div 
      className="p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer group transition-colors"
      onClick={() => onRestore(item.expression)}
    >
      <div className="text-xs text-slate-500 mb-1">
        {new Date(item.timestamp).toLocaleTimeString()}
      </div>
      <div className="text-sm text-slate-300 mono truncate">{item.expression}</div>
      <div className="text-lg text-emerald-400 font-bold mono">= {item.result}</div>
    </div>
  );
};

export default HistoryItem;
