import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from './ReflectionOverlay';
import { X, QrCode, Scan, CheckCircle, Sparkles, ShoppingBag } from 'lucide-react';

export const QRScannerModal: React.FC = () => {
  const {
    isQRScannerOpen,
    setIsQRScannerOpen,
    products,
    handleQRScan,
    scannedResult,
    setScannedResult
  } = useERP();

  const [inputCode, setInputCode] = useState('');

  if (!isQRScannerOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleQRScan(inputCode.trim());
      setInputCode('');
    }
  };

  const handleQuickSelectBatch = (qrData: string) => {
    handleQRScan(qrData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-lg w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto border-0 sm:border border-rose-100 animate-in fade-in zoom-in duration-200 flex flex-col">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 text-white p-4 flex items-center justify-between">
          <ReflectionOverlay />
          <div className="flex items-center gap-2 relative z-10">
            <QrCode className="w-5 h-5 text-rose-200" />
            <h3 className="font-semibold text-lg">Product Batch QR Scanner</h3>
          </div>
          <button
            onClick={() => {
              setIsQRScannerOpen(false);
              setScannedResult(null);
            }}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Simulated Camera Viewfinder */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center border-2 border-dashed border-rose-400/50 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
            
            {/* Animated Laser Line */}
            <div className="absolute w-3/4 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-[0_0_15px_#f43f5e]" />

            <Scan className="w-12 h-12 text-rose-400 animate-bounce relative z-10 opacity-80" />
            <p className="text-white text-xs font-medium relative z-10 mt-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              Align Product QR Code within camera field
            </p>
          </div>

          {/* Feedback Message */}
          {scannedResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scannedResult}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Enter SKU / Batch Code or Paste QR Data:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                placeholder="e.g. DRK-CRIMSON-220 or BATCH-DRK-001"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow transition-colors"
              >
                Scan Code
              </button>
            </div>
          </form>

          {/* Quick Demo QR Selector */}
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Select Batch to Simulate Live QR Scan:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleQuickSelectBatch(p.qrCodeData)}
                  className="p-2 bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-lg text-left transition-all group flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                    style={{ backgroundColor: p.colorHex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-rose-700">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      SKU: {p.sku} • KSh {p.unitPriceRetail}
                    </p>
                  </div>
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
