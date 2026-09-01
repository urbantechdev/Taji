import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  AlertTriangle,
  Trash2,
  Download,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldAlert,
  Database,
  Layers,
  ShoppingBag,
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  playClickSound,
  playSuccessSound,
  playScannerErrorBeep
} from '../../utils/audio';

interface DataWipeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const DataWipeConfirmationModal: React.FC<DataWipeConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    products,
    orders,
    ledger,
    transfers,
    staff,
    fabricRolls,
    fixedAssets,
    quarantinedDefects,
    shiftClosures,
    creditNotes,
    brandSettings,
    wipeSystemData,
    currentUser
  } = useERP();

  const [scope, setScope] = useState<'all' | 'transactions_only' | 'inventory_only'>('all');
  const [wipeFirestore, setWipeFirestore] = useState(true);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [step, setStep] = useState<'prompt' | 'processing' | 'done'>('prompt');
  const [wipeResult, setWipeResult] = useState<{ success: boolean; message: string } | null>(null);

  // Security challenge question generator
  const [challengeCode, setChallengeCode] = useState('RESET-TAJI-2026');

  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setTypedAnswer('');
      setIsWiping(false);
      setWipeResult(null);
      // Generate randomized prompt code
      const codes = [
        'RESET-TAJI-2026',
        'CONFIRM-WIPE-DATA',
        'PERMANENT-SYSTEM-PURGE',
        'CLEAN-PRODUCTION-DATABASE',
        'TAJI-TOTAL-RESET'
      ];
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      setChallengeCode(randomCode);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isChallengeMatched = typedAnswer.trim().toUpperCase() === challengeCode.toUpperCase();

  const handleDownloadBackup = () => {
    playClickSound();
    const backupData = {
      platform: brandSettings.brandName || 'Taji Textile ERP',
      exportedAt: new Date().toISOString(),
      initiatedBy: currentUser?.name || 'Administrator',
      systemStats: {
        productsCount: products.length,
        ordersCount: orders.length,
        ledgerCount: ledger.length,
        transfersCount: transfers.length,
        fabricRollsCount: fabricRolls.length,
        fixedAssetsCount: fixedAssets.length,
        staffCount: staff.length,
        quarantinedDefectsCount: quarantinedDefects.length,
        shiftClosuresCount: shiftClosures.length,
        creditNotesCount: creditNotes.length
      },
      products,
      orders,
      ledger,
      transfers,
      fabricRolls,
      fixedAssets,
      quarantinedDefects,
      shiftClosures,
      creditNotes,
      staff
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(brandSettings.brandName || 'TAJI').replace(/\s+/g, '_')}_Safety_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSuccessSound();
  };

  const handleExecuteWipe = async () => {
    if (!isChallengeMatched) {
      playScannerErrorBeep();
      return;
    }

    setIsWiping(true);
    setStep('processing');
    playClickSound();

    try {
      const res = await wipeSystemData({
        scope,
        wipeFirestore
      });

      setWipeResult(res);
      setStep('done');
      if (res.success) {
        playSuccessSound();
        if (onSuccess) onSuccess(res.message);
      } else {
        playScannerErrorBeep();
      }
    } catch (err: any) {
      setWipeResult({
        success: false,
        message: err?.message || 'Data wipe encountered an error.'
      });
      setStep('done');
      playScannerErrorBeep();
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white border-2 border-rose-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        id="data-wipe-modal"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-700/80 border border-rose-400/40 text-white flex items-center justify-center shadow-md">
              <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  System Data Wipe &amp; Master Purge
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  Destructive
                </span>
              </div>
              <p className="text-xs text-rose-200 font-medium">
                Mandatory Security Verification &amp; Prompt Challenge
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isWiping}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {step === 'prompt' && (
            <>
              {/* Warning Alert Banner */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                    Warning: Irreversible Data Deletion
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    This action will permanently delete records from both browser local storage and live cloud Firestore.
                    Please ensure you have exported a JSON backup before proceeding.
                  </p>
                </div>
              </div>

              {/* Data Summary Stats to be Cleared */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    Current System Database Footprint
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="text-xs font-bold text-pink-700 hover:text-pink-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON Backup First
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{products.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Products</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{orders.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Orders</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{ledger.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Ledger Entries</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{fabricRolls.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Fabric Rolls</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{transfers.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Transfers</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{fixedAssets.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Fixed Assets</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{shiftClosures.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Shift Records</div>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="text-base font-black text-slate-900">{quarantinedDefects.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Defect RMAs</div>
                  </div>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Wipe Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setScope('all');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      scope === 'all'
                        ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                      <Trash2 className="w-3.5 h-3.5" />
                      Complete Reset
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Wipes all catalog, transactions, fabric rolls, assets, payroll &amp; history.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setScope('transactions_only');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      scope === 'transactions_only'
                        ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Receipt className="w-3.5 h-3.5 text-slate-700" />
                      Transactions Only
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Clears sales, ledger, expenses &amp; shifts. Keeps catalog &amp; staff.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setScope('inventory_only');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      scope === 'inventory_only'
                        ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Layers className="w-3.5 h-3.5 text-slate-700" />
                      Inventory Only
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Clears all product batches, fabric rolls, and quarantine RMAs.
                    </p>
                  </button>
                </div>
              </div>

              {/* Firestore Cloud Option */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-pink-700" />
                    Synchronized Firestore Cloud Purge
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Also delete documents from the connected cloud database in real-time.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={wipeFirestore}
                  onChange={e => setWipeFirestore(e.target.checked)}
                  className="w-5 h-5 text-rose-600 rounded-lg border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              {/* Prompt Verification Security Question */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Security Question &amp; Confirmation Prompt:
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md font-mono">
                    Case-Insensitive
                  </span>
                </div>

                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  To confirm that you deliberately want to wipe all records for{' '}
                  <strong className="text-slate-950 font-black underline">{brandSettings.brandName || 'TAJI'}</strong>,
                  please type the exact confirmation phrase below into the text box:
                </p>

                {/* Challenge Code Display */}
                <div className="p-3 bg-white border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-black font-mono tracking-widest text-rose-900 select-all">
                    {challengeCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setTypedAnswer(challengeCode);
                    }}
                    className="text-[11px] font-bold text-pink-700 hover:text-pink-900 bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Auto-Fill Phrase
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={`Type "${challengeCode}" here to unlock wipe...`}
                    value={typedAnswer}
                    onChange={e => setTypedAnswer(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-xs font-mono font-bold tracking-wider outline-hidden transition-all ${
                      isChallengeMatched
                        ? 'border-emerald-500 text-emerald-900 bg-emerald-50/40 ring-2 ring-emerald-200'
                        : 'border-slate-300 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className={isChallengeMatched ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-slate-500'}>
                      {isChallengeMatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Security prompt verified. Ready to wipe.
                        </>
                      ) : (
                        'Enter the exact phrase above to enable the wipe button.'
                      )}
                    </span>
                    <span className="font-mono text-slate-400">
                      {typedAnswer.length} / {challengeCode.length} chars
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Executing System Data Wipe...
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Clearing local device storage caches, purging active Firestore collections, and registering security audit logs.
                </p>
              </div>
            </div>
          )}

          {step === 'done' && wipeResult && (
            <div className="py-8 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
                  wipeResult.success
                    ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-600'
                    : 'bg-rose-50 border-2 border-rose-200 text-rose-600'
                }`}
              >
                {wipeResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {wipeResult.success ? 'System Data Wiped Successfully' : 'Data Wipe Encountered Issues'}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {wipeResult.message}
                </p>
              </div>

              {wipeResult.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium max-w-md mx-auto">
                  The ERP system is now in a pristine state. You can add new live fabric rolls, products, and record fresh retail transactions.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 'prompt' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel / Keep Data
              </button>

              <button
                type="button"
                onClick={handleExecuteWipe}
                disabled={!isChallengeMatched || isWiping}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                  isChallengeMatched && !isWiping
                    ? 'bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-800 hover:to-red-700 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm &amp; Wipe Data Now</span>
              </button>
            </>
          ) : step === 'done' ? (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                Done &amp; Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
