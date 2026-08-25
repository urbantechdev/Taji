import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  Lock,
  DollarSign,
  Smartphone,
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calculator,
  Download,
  Clock,
  User,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, exportCashierShiftClosurePDF, exportCashierShiftClosureCSV } from '../../utils/documentExport';

export const CloseShiftModal: React.FC = () => {
  const {
    isShiftClosureModalOpen,
    setIsShiftClosureModalOpen,
    getActiveShiftStats,
    closeCashierShift,
    locations,
    activeLocation,
    currentUser,
    etrConfig,
    setSelectedShiftRecord
  } = useERP();

  const [activeStats, setActiveStats] = useState(() => getActiveShiftStats());
  const [useDenominations, setUseDenominations] = useState(false);

  // Cash Denomination Breakdown
  const [denom1000, setDenom1000] = useState<number | ''>('');
  const [denom500, setDenom500] = useState<number | ''>('');
  const [denom200, setDenom200] = useState<number | ''>('');
  const [denom100, setDenom100] = useState<number | ''>('');
  const [denom50, setDenom50] = useState<number | ''>('');
  const [denomCoins, setDenomCoins] = useState<number | ''>('');

  // Actual amounts recorded by cashier
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [actualMpesaInput, setActualMpesaInput] = useState<string>('');
  const [actualBankInput, setActualBankInput] = useState<string>('');
  const [handedOverTo, setHandedOverTo] = useState('Central Safe Deposit / Branch Manager');
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Refresh active stats when modal opens
  useEffect(() => {
    if (isShiftClosureModalOpen) {
      const stats = getActiveShiftStats();
      setActiveStats(stats);
      setActualCashInput(stats.expectedCashInDrawer.toString());
      setActualMpesaInput(stats.expectedMpesa.toString());
      setActualBankInput(stats.expectedBank.toString());
      setErrorMessage('');
    }
  }, [isShiftClosureModalOpen]);

  // Recalculate cash from denomination counts if enabled
  useEffect(() => {
    if (useDenominations) {
      const c1000 = (Number(denom1000) || 0) * 1000;
      const c500 = (Number(denom500) || 0) * 500;
      const c200 = (Number(denom200) || 0) * 200;
      const c100 = (Number(denom100) || 0) * 100;
      const c50 = (Number(denom50) || 0) * 50;
      const cCoins = Number(denomCoins) || 0;
      const totalDenom = c1000 + c500 + c200 + c100 + c50 + cCoins;
      setActualCashInput(totalDenom.toString());
    }
  }, [denom1000, denom500, denom200, denom100, denom50, denomCoins, useDenominations]);

  if (!isShiftClosureModalOpen) return null;

  const locInfo = locations.find(l => l.id === activeLocation);

  const actualCash = Number(actualCashInput) || 0;
  const actualMpesa = Number(actualMpesaInput) || 0;
  const actualBank = Number(actualBankInput) || 0;

  const cashVariance = Number((actualCash - activeStats.expectedCashInDrawer).toFixed(2));
  const mpesaVariance = Number((actualMpesa - activeStats.expectedMpesa).toFixed(2));
  const bankVariance = Number((actualBank - activeStats.expectedBank).toFixed(2));
  const totalVariance = Number((cashVariance + mpesaVariance + bankVariance).toFixed(2));

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const denominations = useDenominations
      ? {
          notes1000: Number(denom1000) || 0,
          notes500: Number(denom500) || 0,
          notes200: Number(denom200) || 0,
          notes100: Number(denom100) || 0,
          notes50: Number(denom50) || 0,
          coins: Number(denomCoins) || 0
        }
      : undefined;

    const res = await closeCashierShift({
      actualCashAtHand: actualCash,
      actualMpesa: actualMpesa,
      actualBank: actualBank,
      cashDenominations: denominations,
      handedOverTo,
      closingNotes
    });

    setIsSubmitting(false);

    if (res.success && res.shiftRecord) {
      setIsShiftClosureModalOpen(false);
      setSelectedShiftRecord(res.shiftRecord);
    } else {
      setErrorMessage(res.message || 'Failed to close shift');
    }
  };

  return (
    <div id="close-shift-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="close-shift-modal-container" className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Cashier Shift Closure & Handover
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                  End of Shift Z-Report
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Record actual cash at hand, verify M-Pesa & bank balances, and reconcile variances before handover.
              </p>
            </div>
          </div>
          <button
            id="close-shift-modal-dismiss-btn"
            onClick={() => setIsShiftClosureModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Metadata Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 block">Cashier</span>
              <span className="font-semibold text-slate-800">{currentUser?.name || 'Active Cashier'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 block">Branch</span>
              <span className="font-semibold text-slate-800">{locInfo?.name || 'Active Location'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 block">Shift Started</span>
              <span className="font-semibold text-slate-800">
                {new Date(activeStats.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 block">Turnover / Units</span>
              <span className="font-semibold text-slate-800">
                {activeStats.totalSalesOrdersCount} orders ({activeStats.totalUnitsSold} units)
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCloseShiftSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Three-Channel Financial Reconciliation Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-rose-600" />
                Channel Balance Reconciliation
              </h3>
              <span className="text-xs text-slate-500">
                Enter your physical counts to match against system balances
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Cash at Hand Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Cash at Hand</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseDenominations(!useDenominations)}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    {useDenominations ? 'Simple Input' : 'Count Notes'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Opening Float:</span>
                    <span>{formatCurrency(activeStats.openingFloat)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>+ Cash Sales:</span>
                    <span className="text-emerald-600 font-medium">+{formatCurrency(activeStats.expectedCashSales)}</span>
                  </div>
                  {activeStats.cashExpensesPaid > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>- Cash Expenses:</span>
                      <span className="text-rose-600 font-medium">-{formatCurrency(activeStats.cashExpensesPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                    <span>Expected Drawer:</span>
                    <span className="text-slate-900">{formatCurrency(activeStats.expectedCashInDrawer)}</span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Actual Cash Counted (KSh)*
                    </label>
                    <input
                      id="close-shift-actual-cash-input"
                      type="number"
                      step="any"
                      required
                      value={actualCashInput}
                      onChange={e => {
                        setUseDenominations(false);
                        setActualCashInput(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="0.00"
                    />
                  </div>

                  <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                    cashVariance === 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : cashVariance > 0
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span>Cash Variance:</span>
                    <span>
                      {cashVariance === 0 ? 'Balanced (KSh 0)' : `${cashVariance > 0 ? '+' : ''}${formatCurrency(cashVariance)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. M-Pesa Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">Safaricom M-Pesa</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>M-Pesa Receipts:</span>
                    <span>{activeStats.shiftOrders.filter(o => o.paymentMethod === 'M-Pesa').length} orders</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                    <span>Expected M-Pesa:</span>
                    <span className="text-slate-900">{formatCurrency(activeStats.expectedMpesa)}</span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recorded M-Pesa Till Total (KSh)*
                    </label>
                    <input
                      id="close-shift-actual-mpesa-input"
                      type="number"
                      step="any"
                      required
                      value={actualMpesaInput}
                      onChange={e => setActualMpesaInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
                      placeholder="0.00"
                    />
                  </div>

                  <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                    mpesaVariance === 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : mpesaVariance > 0
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span>M-Pesa Variance:</span>
                    <span>
                      {mpesaVariance === 0 ? 'Balanced (KSh 0)' : `${mpesaVariance > 0 ? '+' : ''}${formatCurrency(mpesaVariance)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Commercial Bank Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">Bank Transfers / Slips</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Direct Wire Receipts:</span>
                    <span>{activeStats.shiftOrders.filter(o => o.paymentMethod === 'Bank Transfer').length} orders</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                    <span>Expected Bank:</span>
                    <span className="text-slate-900">{formatCurrency(activeStats.expectedBank)}</span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recorded Bank Wire Total (KSh)*
                    </label>
                    <input
                      id="close-shift-actual-bank-input"
                      type="number"
                      step="any"
                      required
                      value={actualBankInput}
                      onChange={e => setActualBankInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                      placeholder="0.00"
                    />
                  </div>

                  <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                    bankVariance === 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : bankVariance > 0
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span>Bank Variance:</span>
                    <span>
                      {bankVariance === 0 ? 'Balanced (KSh 0)' : `${bankVariance > 0 ? '+' : ''}${formatCurrency(bankVariance)}`}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Physical Currency Denomination Breakdown Drawer */}
          {useDenominations && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Physical Cash Denomination Count</span>
                <span className="text-xs text-emerald-700 font-bold">
                  Auto-Sum: {formatCurrency(actualCash)}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">KSh 1,000 Notes</label>
                  <input
                    type="number"
                    min="0"
                    value={denom1000}
                    onChange={e => setDenom1000(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency((Number(denom1000) || 0) * 1000)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">KSh 500 Notes</label>
                  <input
                    type="number"
                    min="0"
                    value={denom500}
                    onChange={e => setDenom500(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency((Number(denom500) || 0) * 500)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">KSh 200 Notes</label>
                  <input
                    type="number"
                    min="0"
                    value={denom200}
                    onChange={e => setDenom200(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency((Number(denom200) || 0) * 200)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">KSh 100 Notes</label>
                  <input
                    type="number"
                    min="0"
                    value={denom100}
                    onChange={e => setDenom100(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency((Number(denom100) || 0) * 100)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">KSh 50 Notes</label>
                  <input
                    type="number"
                    min="0"
                    value={denom50}
                    onChange={e => setDenom50(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency((Number(denom50) || 0) * 50)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Coins & Change</label>
                  <input
                    type="number"
                    min="0"
                    value={denomCoins}
                    onChange={e => setDenomCoins(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    = {formatCurrency(Number(denomCoins) || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Handover Details & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Handed Over To / Destination Safe*
              </label>
              <input
                id="close-shift-handover-to"
                type="text"
                required
                value={handedOverTo}
                onChange={e => setHandedOverTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 text-slate-900"
                placeholder="e.g. Next Cashier Name / Branch Manager / Safe Deposit"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Closure Notes / Discrepancy Reasons
              </label>
              <input
                id="close-shift-notes"
                type="text"
                value={closingNotes}
                onChange={e => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 text-slate-900"
                placeholder="Optional notes or explanations for safe deposit"
              />
            </div>
          </div>

          {/* Total Variance Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            totalVariance === 0
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : totalVariance > 0
              ? 'bg-blue-50/80 border-blue-200 text-blue-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {totalVariance === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs block">
                  {totalVariance === 0
                    ? 'All Payment Channels Perfectly Balanced'
                    : totalVariance > 0
                    ? 'Net Shift Surplus Detected'
                    : 'Net Shift Cash Shortage Detected'}
                </span>
                <span className="text-[11px] opacity-85">
                  Expected Total: {formatCurrency(activeStats.expectedCashInDrawer + activeStats.expectedMpesa + activeStats.expectedBank)} | Actual Total: {formatCurrency(actualCash + actualMpesa + actualBank)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs block opacity-75">Consolidated Variance</span>
              <span className="text-base font-extrabold">
                {totalVariance === 0 ? 'KSh 0.00' : `${totalVariance > 0 ? '+' : ''}${formatCurrency(totalVariance)}`}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              id="close-shift-cancel-btn"
              type="button"
              onClick={() => setIsShiftClosureModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="close-shift-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Generating Z-Report...' : 'Reconcile & Close Shift (Issue Z-Report)'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
