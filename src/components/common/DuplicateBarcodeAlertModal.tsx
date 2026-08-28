import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LocationId } from '../../types';
import {
  AlertTriangle,
  X,
  PlusCircle,
  Package,
  Layers,
  Store,
  Barcode,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export const DuplicateBarcodeAlertModal: React.FC = () => {
  const {
    duplicateAlertState,
    dismissDuplicateAlert,
    restockExistingProduct,
    locations,
    activeLocation
  } = useERP();

  const { isOpen, barcode, existingProduct, message } = duplicateAlertState;
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockLoc, setRestockLoc] = useState<LocationId>(activeLocation);
  const [isRestocking, setIsRestocking] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen || !existingProduct) return null;

  const totalStockAllBranches = Object.values(existingProduct.locationStock || {}).reduce(
    (sum: number, q: unknown) => sum + (Number(q) || 0),
    0
  );

  const handleRestock = async () => {
    if (restockQty <= 0) return;
    setIsRestocking(true);
    const res = await restockExistingProduct(existingProduct.id, restockQty, restockLoc);
    setIsRestocking(false);
    if (res.success) {
      setActionSuccess(res.message);
      setTimeout(() => {
        setActionSuccess(null);
        dismissDuplicateAlert();
      }, 1800);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Dereck':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Fleece':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Yarns':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/90 sm:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden sm:overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border-2 border-rose-500 w-full max-w-xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:my-4 transform animate-in zoom-in-95 duration-200">
        
        {/* Header with High-Visibility Duplicate Warning */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner text-white shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full border border-white/30 shrink-0">
                  Scan Blocked
                </span>
                <h3 className="text-sm sm:text-lg font-extrabold tracking-tight truncate">
                  Duplicate Item Detected!
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-100 mt-0.5 hidden sm:block">
                This barcode already exists in the system to prevent double-counting.
              </p>
            </div>
          </div>
          <button
            onClick={dismissDuplicateAlert}
            className="text-white/80 hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 sm:max-h-[75vh] overscroll-contain">
          
          {/* Main Alert Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-900 leading-snug">
                {message}
              </p>
              <p className="text-[11px] text-rose-700">
                The product registration was aborted to prevent duplicate batches or corrupting inventory metrics.
              </p>
            </div>
          </div>

          {/* Barcode Scanned Tag */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-600">Scanned Barcode:</span>
            </div>
            <span className="font-mono text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-xs">
              {barcode}
            </span>
          </div>

          {/* Existing Product Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Existing Product In Database
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getCategoryColor(existingProduct.category)}`}>
                {existingProduct.category}
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              {existingProduct.imageUrl ? (
                <img
                  src={existingProduct.imageUrl}
                  alt={existingProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: existingProduct.colorHex || '#475569' }}
                >
                  <Package className="w-7 h-7 opacity-80" />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {existingProduct.name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span>Batch: <strong className="text-slate-800 font-mono">{existingProduct.id}</strong></span>
                  <span>SKU: <strong className="text-slate-800 font-mono">{existingProduct.sku}</strong></span>
                  <span>Price: <strong className="text-slate-900 font-bold">KSh {existingProduct.unitPriceRetail.toLocaleString()}/{existingProduct.unit}</strong></span>
                </div>
                {existingProduct.fiberComposition && (
                  <p className="text-[11px] text-slate-500 truncate">
                    {existingProduct.fiberComposition}
                  </p>
                )}
              </div>
            </div>

            {/* Current Stock Levels across Branches */}
            <div className="border-t border-slate-200/80 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" /> Current Stock Across Branches:
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Total: {totalStockAllBranches.toLocaleString()} {existingProduct.unit}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {locations.map((loc) => {
                  const stock = Number(existingProduct.locationStock[loc.id]) || 0;
                  return (
                    <div
                      key={loc.id}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-center"
                    >
                      <span className="text-[10px] text-slate-500 font-medium block truncate">
                        {loc.name}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {stock} {existingProduct.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Resolution: Restock Existing Batch */}
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Did you mean to add stock to this existing batch?
                </h5>
              </div>
            </div>
            <p className="text-[11px] text-indigo-900">
              If this physical roll belongs to this existing batch, you can quickly increase its quantity below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                  Target Branch
                </label>
                <select
                  value={restockLoc}
                  onChange={(e) => setRestockLoc(e.target.value as LocationId)}
                  className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                  Add Quantity ({existingProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                />
              </div>

              <div className="sm:col-span-4 sm:pt-4">
                <button
                  type="button"
                  disabled={isRestocking}
                  onClick={handleRestock}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {isRestocking ? 'Restocking...' : `+ Add ${restockQty} ${existingProduct.unit}`}
                </button>
              </div>
            </div>

            {actionSuccess && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Zero duplication rule enforced</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismissDuplicateAlert}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
