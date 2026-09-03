import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ETRConfig } from '../../types';
import {
  Receipt,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Percent,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  Landmark,
  Scale
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const FinancialSettings: React.FC = () => {
  const { etrConfig, updateETRConfig, recordAuditLog, locations, currentUser } = useERP();

  // KRA & ETR Fiscal Config State
  const [taxPin, setTaxPin] = useState(etrConfig.taxPin || 'P051982341Z');
  const [cuSerialNumber, setCuSerialNumber] = useState(etrConfig.cuSerialNumber || 'KRA-CU-2026-TX89921');
  const [vatRate, setVatRate] = useState<number>(etrConfig.vatRate ?? 16);
  const [enableWHT5, setEnableWHT5] = useState<boolean>(true);
  const [whtRate, setWhtRate] = useState<number>(5);
  const [whvatRate, setWhvatRate] = useState<number>(2);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(
    etrConfig.receiptFooterMessage || 'Goods once sold are returnable within 7 days in original condition. Thank you for shopping with us!'
  );

  // Payment Gateways & Banking State
  const [mpesaTillNumber, setMpesaTillNumber] = useState('542910');
  const [mpesaPaybillNumber, setMpesaPaybillNumber] = useState('880100');
  const [mpesaAccountRef, setMpesaAccountRef] = useState('TAJI-FABRICS');
  const [primaryBankName, setPrimaryBankName] = useState('Equity Bank Kenya');
  const [bankAccountNumber, setBankAccountNumber] = useState('0180293849102');
  const [bankBranchName, setBankBranchName] = useState('Nairobi Supreme Centre');
  const [defaultCashFloat, setDefaultCashFloat] = useState<number>(10000);

  // Accounting Policies & Controls State
  const [currencyCode, setCurrencyCode] = useState('KES');
  const [autoPostSalesJournal, setAutoPostSalesJournal] = useState(true);
  const [expenseApprovalThreshold, setExpenseApprovalThreshold] = useState<number>(5000);
  const [autoApplyWHTThreshold, setAutoApplyWHTThreshold] = useState<number>(24000);
  const [independentBranchFloats, setIndependentBranchFloats] = useState(true);

  // Feedback State
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFinancialConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    playClickSound();

    try {
      // Update ETR & Fiscal Device Settings in Context
      updateETRConfig({
        taxPin: taxPin.trim().toUpperCase(),
        cuSerialNumber: cuSerialNumber.trim().toUpperCase(),
        vatRate: Number(vatRate),
        receiptFooterMessage: receiptFooterMessage.trim(),
      });

      playSuccessSound();
      setStatusMessage({
        type: 'success',
        text: 'Financial, KRA Fiscal ETR, and payment channel settings saved successfully!'
      });
      recordAuditLog('FINANCIAL_SETTINGS_UPDATED', `KRA PIN ${taxPin} / VAT ${vatRate}% updated`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save financial configuration.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    playClickSound();
    setTaxPin('P051982341Z');
    setCuSerialNumber('KRA-CU-2026-TX89921');
    setVatRate(16);
    setWhtRate(5);
    setWhvatRate(2);
    setMpesaTillNumber('542910');
    setMpesaPaybillNumber('880100');
    setMpesaAccountRef('TAJI-FABRICS');
    setPrimaryBankName('Equity Bank Kenya');
    setBankAccountNumber('0180293849102');
    setDefaultCashFloat(10000);
    setStatusMessage({
      type: 'success',
      text: 'Reset financial configurations to standard defaults.'
    });
  };

  return (
    <form onSubmit={handleSaveFinancialConfig} className="space-y-6" id="financial-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Financial, KRA Fiscal &amp; Accounting Settings
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                Tax &amp; Gateways
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Govern KRA Tax PINs, ETR CU serial codes, 16% VAT, M-Pesa Tills, bank settlement accounts &amp; ledger policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Financial Settings'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: KRA ETR Fiscal Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
              KRA
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. KRA Fiscal Device &amp; Tax PIN
              </h4>
              <p className="text-[10px] text-slate-400">eTIMS compliance parameters</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company KRA Tax PIN
              </label>
              <input
                type="text"
                value={taxPin}
                onChange={e => setTaxPin(e.target.value.toUpperCase())}
                placeholder="e.g. P051982341Z"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden uppercase"
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Printed on all official receipts &amp; invoices</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Control Unit (CU) Serial Number
              </label>
              <input
                type="text"
                value={cuSerialNumber}
                onChange={e => setCuSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KRA-CU-2026-TX89921"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden uppercase"
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Assigned by approved KRA ETR distributor</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  VAT Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vatRate}
                    onChange={e => setVatRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WHT Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={whtRate}
                    onChange={e => setWhtRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Footer Disclaimer Note
              </label>
              <textarea
                rows={2}
                value={receiptFooterMessage}
                onChange={e => setReceiptFooterMessage(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-pink-600 outline-hidden resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Payment Channels & Settlement Accounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. M-Pesa Tills &amp; Bank Accounts
              </h4>
              <p className="text-[10px] text-slate-400">Payment receipt destination</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                M-Pesa Buy Goods Till Number
              </label>
              <input
                type="text"
                value={mpesaTillNumber}
                onChange={e => setMpesaTillNumber(e.target.value)}
                placeholder="e.g. 542910"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Direct counter customer payment till</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  M-Pesa Paybill
                </label>
                <input
                  type="text"
                  value={mpesaPaybillNumber}
                  onChange={e => setMpesaPaybillNumber(e.target.value)}
                  placeholder="e.g. 880100"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Name / Ref
                </label>
                <input
                  type="text"
                  value={mpesaAccountRef}
                  onChange={e => setMpesaAccountRef(e.target.value)}
                  placeholder="e.g. TAJI"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Settlement Bank Name
              </label>
              <input
                type="text"
                value={primaryBankName}
                onChange={e => setPrimaryBankName(e.target.value)}
                placeholder="e.g. Equity Bank Kenya"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 0180293849102"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Morning Cash Float (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={defaultCashFloat}
                onChange={e => setDefaultCashFloat(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Standard daily cash drawer float base</p>
            </div>
          </div>
        </div>

        {/* Card 3: Accounting Policies & Double-Entry Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. General Ledger &amp; Rules
              </h4>
              <p className="text-[10px] text-slate-400">Automated accounting policies</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Accounting Currency
              </label>
              <select
                value={currencyCode}
                onChange={e => setCurrencyCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="KES">KES - Kenyan Shillings (KSh)</option>
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="autoPost" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Auto-post Journal on POS Sale
                </label>
                <input
                  type="checkbox"
                  id="autoPost"
                  checked={autoPostSalesJournal}
                  onChange={e => setAutoPostSalesJournal(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 accent-pink-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Automatically posts debit to Cash/M-Pesa/Bank and credit to Revenue &amp; VAT Output Account.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="branchFloat" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Autonomous Branch Cash Floats
                </label>
                <input
                  type="checkbox"
                  id="branchFloat"
                  checked={independentBranchFloats}
                  onChange={e => setIndependentBranchFloats(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 accent-pink-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Maintains separate cash float balance sheets for each autonomous store location.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch Expense Approval Threshold (KSh)
              </label>
              <input
                type="number"
                value={expenseApprovalThreshold}
                onChange={e => setExpenseApprovalThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Petty cash payouts above this amount require manager authorization
              </p>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
};
