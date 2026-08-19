import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BookOpenCheck, X, CheckCircle2, AlertCircle, ArrowLeftRight, Building, Plus } from 'lucide-react';
import { LedgerCategory } from '../../types';

interface JournalVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_DEBIT_ACCOUNTS = [
  'Main Store Inventory Asset',
  'Sales Shop Inventory Asset',
  'Central Warehouse Inventory',
  'Cash on Hand (Main Drawer)',
  'Sales Shop POS Cash Float',
  'M-Pesa Business Till (Safaricom)',
  'KCB Corporate Bank Account',
  'Accounts Receivable',
  'Textile Processing Machinery & Equipment',
  'Depot Fixtures & ETR Terminals',
  'Branch Rent & Depot Lease',
  'Staff Salaries & Commissions',
  'Electricity & Utilities',
  'Logistics & Fuel Expense',
  'ETR & Software Maintenance',
  'Petty Cash & Consumables',
  'Raw Material Direct Cost (COGS)'
];

const COMMON_CREDIT_ACCOUNTS = [
  'KCB Corporate Bank Account',
  'Cash on Hand (Main Drawer)',
  'M-Pesa Business Till (Safaricom)',
  'Sales Shop POS Cash Float',
  'Supplier Accounts Payable (Yarn Mills)',
  'KRA Output VAT 16% Liability',
  'PAYE / Statutory Payroll Liability',
  'Commercial Bank Term Loan',
  'Shareholders Contributed Capital',
  'Retained Earnings & Reserves',
  'Wholesale & Bulk Textile Revenue',
  'Retail POS Sales Revenue',
  'Owner Drawings'
];

export const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({ isOpen, onClose }) => {
  const { locations, addLedgerEntry } = useERP();

  const [description, setDescription] = useState('');
  const [transactionRef, setTransactionRef] = useState(`JV-${Date.now().toString().slice(-6)}`);
  const [debitAccount, setDebitAccount] = useState('Main Store Inventory Asset');
  const [creditAccount, setCreditAccount] = useState('KCB Corporate Bank Account');
  const [amount, setAmount] = useState<string>('');
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || 'main_store');
  const [category, setCategory] = useState<LedgerCategory>('General Journal Voucher');
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ success: false, message: 'Please enter a valid positive voucher amount.' });
      return;
    }
    if (!description.trim()) {
      setFeedback({ success: false, message: 'Please provide a clear transaction description/narration.' });
      return;
    }
    if (debitAccount === creditAccount) {
      setFeedback({ success: false, message: 'Debit and Credit accounts must be different to balance properly.' });
      return;
    }

    const res = addLedgerEntry({
      transactionRef: transactionRef.trim() || `JV-${Date.now().toString().slice(-6)}`,
      description: description.trim(),
      debitAccount,
      creditAccount,
      amount: numAmount,
      locationId,
      category
    });

    if (res.success) {
      setFeedback({ success: true, message: res.message });
      setTimeout(() => {
        setDescription('');
        setAmount('');
        setFeedback(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl">
              <BookOpenCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Post Manual Journal Voucher</h3>
              <p className="text-xs text-slate-400">Self-balancing double-entry general ledger voucher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handlePostEntry} className="p-6 space-y-4">
          
          {feedback && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              feedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Ref & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Voucher Reference / Ref ID
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                placeholder="e.g. JV-2026-081"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Branch / Warehouse Node
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Narration / Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Direct purchase of cutting machine spares via KCB Bank transfer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Debit & Credit Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>(+) Debit Account (Receiving)</span>
              </label>
              <select
                value={debitAccount}
                onChange={e => setDebitAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {COMMON_DEBIT_ACCOUNTS.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>(-) Credit Account (Giving)</span>
              </label>
              <select
                value={creditAccount}
                onChange={e => setCreditAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {COMMON_CREDIT_ACCOUNTS.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Voucher Amount (KSh)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 25000.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Accounting Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as LedgerCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
              >
                <option value="General Journal Voucher">General Journal Voucher</option>
                <option value="Asset Purchase">Asset Purchase</option>
                <option value="Expense Payment">Expense Payment</option>
                <option value="Inter-Store Cash Transfer">Inter-Store Cash Transfer</option>
                <option value="Inventory Revaluation">Inventory Revaluation</option>
                <option value="Tax Settlement">Tax Settlement</option>
                <option value="Owner Distribution">Owner Distribution</option>
              </select>
            </div>
          </div>

          {/* Visual Balance Preview */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Self-Balancing Journal Entry</span>
              <span className="text-emerald-400 font-bold">DR: {debitAccount.slice(0, 20)}...</span>
              <span className="text-slate-400 mx-1.5">|</span>
              <span className="text-rose-400 font-bold">CR: {creditAccount.slice(0, 20)}...</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-sans">Balanced Sum</span>
              <span className="text-sm font-black text-amber-300">
                KSh {(parseFloat(amount) || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Voucher</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
