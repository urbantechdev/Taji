import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductDuplicateGroup, CatalogDuplicateAuditReport, ProductBatch } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Scale,
  DollarSign,
  Package,
  Barcode
} from 'lucide-react';

interface DuplicateAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicateAuditModal: React.FC<DuplicateAuditModalProps> = ({ isOpen, onClose }) => {
  const {
    scanAllCatalogDuplicates,
    mergeDuplicateProducts,
    autoDeduplicateAllCatalog
  } = useERP();

  const [auditReport, setAuditReport] = useState<CatalogDuplicateAuditReport>(() => scanAllCatalogDuplicates());
  const [selectedGroup, setSelectedGroup] = useState<ProductDuplicateGroup | null>(null);
  const [primaryProductId, setPrimaryProductId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshAudit = () => {
    const fresh = scanAllCatalogDuplicates();
    setAuditReport(fresh);
    if (selectedGroup) {
      const updated = fresh.duplicateGroups.find(g => g.key === selectedGroup.key);
      setSelectedGroup(updated || null);
    }
  };

  const handleAutoDeduplicateAll = async () => {
    setIsProcessing(true);
    const res = await autoDeduplicateAllCatalog();
    setIsProcessing(false);
    setActionSuccess(res.message);
    refreshAudit();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleMergeGroup = async (group: ProductDuplicateGroup) => {
    const allProducts = [group.masterProduct, ...group.duplicates];
    const targetPrimary = primaryProductId || group.masterProduct.id;
    const secondary = allProducts
      .filter(p => p.id !== targetPrimary)
      .map(p => p.id);

    if (!secondary.length) return;

    setIsProcessing(true);
    const res = await mergeDuplicateProducts(targetPrimary, secondary);
    setIsProcessing(false);
    setActionSuccess(res.message);
    setSelectedGroup(null);
    refreshAudit();
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-4 max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-rose-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Catalog Duplication Control &amp; Financial Audit
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  auditReport.totalDuplicateRecords === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {auditReport.totalDuplicateRecords === 0 ? 'Audit Clean' : `${auditReport.duplicateGroups.length} Conflicts Detected`}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Detects duplicate barcodes, SKUs, and identical products preventing inventory inflation &amp; incorrect financial audits.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Catalog Batches</span>
            <span className="text-lg font-mono font-bold text-slate-900 mt-0.5 block">{auditReport.totalProductsScanned}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duplicate Conflicts</span>
            <span className={`text-lg font-mono font-bold mt-0.5 block ${auditReport.totalDuplicateRecords > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {auditReport.totalDuplicateRecords} items
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audit Variance Risk</span>
            <span className={`text-lg font-mono font-bold mt-0.5 block ${auditReport.totalFinancialDistortionCost > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              KSh {auditReport.totalFinancialDistortionCost.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
            {auditReport.totalDuplicateRecords > 0 ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleAutoDeduplicateAll}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Merge All</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Audit Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {auditReport.duplicateGroups.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">No Duplicate Conflicts Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Every barcode, SKU, and item in your catalog is strictly unique. Your inventory valuation and financial audits are accurate and free from double-counting.
              </p>
              <button
                type="button"
                onClick={refreshAudit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Scan Catalog</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Duplicate Product Groups Requiring Resolution ({auditReport.duplicateGroups.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Click on any group to inspect and merge into a single master record.
                </span>
              </div>

              <div className="space-y-3">
                {auditReport.duplicateGroups.map((group, idx) => {
                  const isSelected = selectedGroup?.key === group.key;
                  const allInGroup = [group.masterProduct, ...group.duplicates];

                  return (
                    <div
                      key={group.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-300 shadow-sm ring-1 ring-rose-400'
                          : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md uppercase">
                              Conflict #{idx + 1} ({group.matchType})
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900">
                              Ref: {group.key}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              ({allInGroup.length} duplicate records)
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-800">
                            Primary Item: <strong>{group.masterProduct.name}</strong> ({group.masterProduct.category})
                          </p>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                            <span>Stock Distortion: <strong>{group.totalStockDistortion} units</strong></span>
                            <span>Cost Distortion: <strong>KSh {group.financialValuationDistortionCost.toLocaleString()}</strong></span>
                            <span className="text-rose-600 font-bold">Audit Impact: KSh {group.financialValuationDistortionCost.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGroup(null);
                              } else {
                                setSelectedGroup(group);
                                setPrimaryProductId(group.masterProduct.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            {isSelected ? 'Close Details' : 'Review & Merge'}
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleMergeGroup(group)}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Quick Merge</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Conflict Comparison */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-rose-200/60 space-y-3 animate-in fade-in duration-150">
                          <span className="text-xs font-bold text-slate-700 block">
                            Select Master Record to Retain (Others will be merged and their stocks consolidated):
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {allInGroup.map((p: ProductBatch) => {
                              const isPrimary = (primaryProductId || group.masterProduct.id) === p.id;
                              const stock = Object.values(p.locationStock || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => setPrimaryProductId(p.id)}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                    isPrimary
                                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500'
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-slate-900">{p.sku}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isPrimary ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {isPrimary ? 'Keep as Master' : 'Will Merge into Master'}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 mt-1">{p.name}</p>
                                  <div className="text-[11px] text-slate-600 mt-1 flex justify-between">
                                    <span>Stock: {stock} {p.unit}s</span>
                                    <span>Cost: KSh {p.costPrice.toLocaleString()}</span>
                                    <span>Retail: KSh {p.unitPriceRetail.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleMergeGroup(group)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Merge &amp; Update Balance Sheet</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={refreshAudit}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Scan Entire Catalog</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
