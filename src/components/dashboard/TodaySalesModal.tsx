import React from 'react';
import { useERP } from '../../context/ERPContext';
import { TodaySalesView } from './TodaySalesView';
import { X, Sparkles } from 'lucide-react';

export const TodaySalesModal: React.FC = () => {
  const { isTodaySalesModalOpen, setIsTodaySalesModalOpen } = useERP();

  if (!isTodaySalesModalOpen) return null;

  return (
    <div id="today-sales-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div id="today-sales-modal-container" className="relative w-full max-w-6xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Sales Today Breakdown
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                Live Audit
              </span>
            </h2>
          </div>
          <button
            id="today-sales-modal-dismiss-btn"
            onClick={() => setIsTodaySalesModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <TodaySalesView />
        </div>

      </div>
    </div>
  );
};
