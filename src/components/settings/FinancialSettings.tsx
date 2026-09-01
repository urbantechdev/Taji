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
  Scale,
  BookOpen,
  Layers,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface ChartAccountItem {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
}

interface ExpenseCategoryItem {
  id: string;
  name: string;
  glCode: string;
  defaultMonthlyBudget: number;
}

interface FixedAssetClassItem {
  id: string;
  name: string;
  depreciationMethod: 'Straight Line' | 'Reducing Balance';
  usefulLifeYears: number;
  annualRatePct: number;
}

export const FinancialSettings: React.FC = () => {
  const { etrConfig, updateETRConfig, recordAuditLog, locations, currentUser } = useERP();

  const [activeTab, setActiveTab] = useState<'coa' | 'gl_mapping' | 'expenses' | 'assets_fiscal'>('coa');

  // Chart of Accounts State
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccountItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_chart_of_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      { code: '1010', name: 'Cash on Hand (Main Float)', type: 'Asset', description: 'Counter tills and petty cash floats' },
      { code: '1020', name: 'M-Pesa Collections Clearing', type: 'Asset', description: 'Buy Goods & Paybill clearing account' },
      { code: '1030', name: 'Primary Settlement Bank (Equity)', type: 'Asset', description: 'Main business operational account' },
      { code: '1200', name: 'Merchandise Inventory Asset', type: 'Asset', description: 'Fabric rolls, yarns and catalog stock' },
      { code: '1500', name: 'Plant, Machinery & Cutting Equipment', type: 'Asset', description: 'Fabric cutters, scales, and fixtures' },
      { code: '2010', name: 'Trade Accounts Payable (Suppliers)', type: 'Liability', description: 'Supplier fabric credit liabilities' },
      { code: '2110', name: 'VAT Output Tax Payable (16%)', type: 'Liability', description: 'KRA sales tax collected' },
      { code: '2120', name: 'Withholding VAT / Tax Payable', type: 'Liability', description: 'WHT & WHVAT statutory payable' },
      { code: '3010', name: 'Owner Capital & Equity', type: 'Equity', description: 'Initial business paid-in capital' },
      { code: '3020', name: 'Retained Earnings', type: 'Equity', description: 'Accumulated net profit surplus' },
      { code: '4010', name: 'Fabric & Roll Sales Revenue', type: 'Revenue', description: 'Gross sales from retail & wholesale' },
      { code: '4020', name: 'Cutting & Custom Processing Revenue', type: 'Revenue', description: 'Service fees for fabric cutting' },
      { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'Expense', description: 'Direct acquisition cost of sold items' },
      { code: '6010', name: 'Store Rent & Lease Expenses', type: 'Expense', description: 'Branch premise rental costs' },
      { code: '6020', name: 'Staff Wages & Monthly Payroll', type: 'Expense', description: 'Employee basic pay & allowances' },
      { code: '6030', name: 'Electricity, Water & Utilities', type: 'Expense', description: 'Operating utility bills' },
      { code: '6040', name: 'Transport & Inter-Store Logistics', type: 'Expense', description: 'Transfer and supplier haulage' },
      { code: '6050', name: 'Equipment Depreciation Expense', type: 'Expense', description: 'Monthly wear and tear write-off' },
    ];
  });

  // GL Auto-Posting Mapping
  const [glSalesCash, setGlSalesCash] = useState(localStorage.getItem('gl_sales_cash') || '1010');
  const [glSalesMpesa, setGlSalesMpesa] = useState(localStorage.getItem('gl_sales_mpesa') || '1020');
  const [glSalesBank, setGlSalesBank] = useState(localStorage.getItem('gl_sales_bank') || '1030');
  const [glInventoryAsset, setGlInventoryAsset] = useState(localStorage.getItem('gl_inventory_asset') || '1200');
  const [glCogs, setGlCogs] = useState(localStorage.getItem('gl_cogs') || '5010');
  const [glSalesRevenue, setGlSalesRevenue] = useState(localStorage.getItem('gl_sales_revenue') || '4010');
  const [glVatOutput, setGlVatOutput] = useState(localStorage.getItem('gl_vat_output') || '2110');

  // Expense Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'exp-rent', name: 'Store Rent & Rates', glCode: '6010', defaultMonthlyBudget: 120000 },
      { id: 'exp-salaries', name: 'Staff Salaries & Wages', glCode: '6020', defaultMonthlyBudget: 350000 },
      { id: 'exp-utilities', name: 'Electricity & Utilities', glCode: '6030', defaultMonthlyBudget: 25000 },
      { id: 'exp-transport', name: 'Transport & Dispatch Fuel', glCode: '6040', defaultMonthlyBudget: 45000 },
      { id: 'exp-maintenance', name: 'Equipment Repair & Maintenance', glCode: '6050', defaultMonthlyBudget: 15000 },
      { id: 'exp-marketing', name: 'Marketing, Signage & Socials', glCode: '6060', defaultMonthlyBudget: 30000 },
      { id: 'exp-packaging', name: 'Packaging, Bags & Core Tubes', glCode: '6070', defaultMonthlyBudget: 20000 },
      { id: 'exp-miscellaneous', name: 'Petty Cash Miscellaneous', glCode: '6080', defaultMonthlyBudget: 10000 }
    ];
  });

  // Fixed Asset Classes State
  const [assetClasses, setAssetClasses] = useState<FixedAssetClassItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_asset_classes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'ast-cutters', name: 'Fabric Cutting & Rolling Machinery', depreciationMethod: 'Straight Line', usefulLifeYears: 8, annualRatePct: 12.5 },
      { id: 'ast-electronics', name: 'POS Computers, Barcode & Scales', depreciationMethod: 'Reducing Balance', usefulLifeYears: 3, annualRatePct: 33.3 },
      { id: 'ast-furniture', name: 'Store Fixtures, Shelves & Racks', depreciationMethod: 'Straight Line', usefulLifeYears: 10, annualRatePct: 10.0 },
      { id: 'ast-vehicles', name: 'Delivery Vans & Logistics Vehicles', depreciationMethod: 'Reducing Balance', usefulLifeYears: 5, annualRatePct: 25.0 }
    ];
  });

  // Fiscal Year Controls
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(
    localStorage.getItem('erp_fiscal_start') || 'January'
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    localStorage.getItem('erp_currency_symbol') || 'KSh'
  );
  const [expenseApprovalThreshold, setExpenseApprovalThreshold] = useState<number>(
    Number(localStorage.getItem('erp_expense_threshold')) || 5000
  );
  const [autoPostSalesJournal, setAutoPostSalesJournal] = useState(
    localStorage.getItem('erp_autopost_journal') !== 'false'
  );

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Account inline form
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState<ChartAccountItem>({
    code: '',
    name: '',
    type: 'Expense',
    description: ''
  });

  const handleSaveFinancialConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    playClickSound();

    try {
      localStorage.setItem('erp_chart_of_accounts', JSON.stringify(chartOfAccounts));
      localStorage.setItem('erp_expense_categories', JSON.stringify(expenseCategories));
      localStorage.setItem('erp_asset_classes', JSON.stringify(assetClasses));

      localStorage.setItem('gl_sales_cash', glSalesCash);
      localStorage.setItem('gl_sales_mpesa', glSalesMpesa);
      localStorage.setItem('gl_sales_bank', glSalesBank);
      localStorage.setItem('gl_inventory_asset', glInventoryAsset);
      localStorage.setItem('gl_cogs', glCogs);
      localStorage.setItem('gl_sales_revenue', glSalesRevenue);
      localStorage.setItem('gl_vat_output', glVatOutput);

      localStorage.setItem('erp_fiscal_start', fiscalYearStartMonth);
      localStorage.setItem('erp_currency_symbol', currencySymbol);
      localStorage.setItem('erp_expense_threshold', String(expenseApprovalThreshold));
      localStorage.setItem('erp_autopost_journal', String(autoPostSalesJournal));

      playSuccessSound();
      setStatusMessage({
        type: 'success',
        text: 'Chart of accounts, GL mapping, expense budgets & fiscal rules saved successfully!'
      });
      recordAuditLog('ACCOUNTING_SETTINGS_SAVED', `Saved Chart of Accounts (${chartOfAccounts.length} accounts) & GL mappings`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save financial configuration.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAccount = () => {
    if (!newAccountForm.code.trim() || !newAccountForm.name.trim()) return;
    setChartOfAccounts([...chartOfAccounts, newAccountForm]);
    setNewAccountForm({ code: '', name: '', type: 'Expense', description: '' });
    setIsAddingAccount(false);
    playClickSound();
  };

  const handleDeleteAccount = (code: string) => {
    setChartOfAccounts(chartOfAccounts.filter(a => a.code !== code));
    playClickSound();
  };

  return (
    <form onSubmit={handleSaveFinancialConfig} className="space-y-6" id="financial-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Financial Accounting &amp; Chart of Accounts
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                General Ledger
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Govern Chart of Accounts numbering, double-entry auto-posting GL codes, operating expense categories &amp; asset depreciation policies.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Accounting Rules'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => { playClickSound(); setActiveTab('coa'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'coa'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Chart of Accounts ({chartOfAccounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickSound(); setActiveTab('gl_mapping'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'gl_mapping'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>GL Auto-Posting Mapping</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickSound(); setActiveTab('expenses'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'expenses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Expense Categories &amp; Budgets</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickSound(); setActiveTab('assets_fiscal'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'assets_fiscal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Fixed Assets &amp; Fiscal Year</span>
        </button>
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

      {/* Tab 1: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                General Ledger Chart of Accounts
              </h4>
              <p className="text-xs text-slate-500">
                Standard double-entry account codes for Assets, Liabilities, Equity, Revenue and Expenses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingAccount(!isAddingAccount)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          </div>

          {isAddingAccount && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
              <span className="text-xs font-black text-blue-900 block">Create New Chart of Account Code</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newAccountForm.code}
                  onChange={e => setNewAccountForm({ ...newAccountForm, code: e.target.value })}
                  placeholder="GL Code (e.g. 6090)"
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold outline-hidden"
                />
                <input
                  type="text"
                  value={newAccountForm.name}
                  onChange={e => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  placeholder="Account Name (e.g. Bank Charges)"
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold outline-hidden"
                />
                <select
                  value={newAccountForm.type}
                  onChange={e => setNewAccountForm({ ...newAccountForm, type: e.target.value as any })}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold outline-hidden"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
                <input
                  type="text"
                  value={newAccountForm.description}
                  onChange={e => setNewAccountForm({ ...newAccountForm, description: e.target.value })}
                  placeholder="Purpose / Description"
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="px-3 py-1 text-xs text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAccount}
                  className="px-4 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black"
                >
                  Save Account
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">GL Code</th>
                  <th className="py-2.5 px-3">Account Title</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartOfAccounts.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900">{acc.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{acc.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        acc.type === 'Asset' ? 'bg-emerald-100 text-emerald-800' :
                        acc.type === 'Liability' ? 'bg-amber-100 text-amber-800' :
                        acc.type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                        acc.type === 'Revenue' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{acc.description}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.code)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: GL Auto-Posting Mapping */}
      {activeTab === 'gl_mapping' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">
              Automated Journal Double-Entry GL Code Mapping
            </h4>
            <p className="text-xs text-slate-500">
              Define which GL accounts are automatically credited and debited when POS sales, restocks, or payroll execute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Sales &amp; Receipt Accounts
              </h5>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  POS Cash Sales Debit Account
                </label>
                <select
                  value={glSalesCash}
                  onChange={e => setGlSalesCash(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Asset').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  M-Pesa Collections Debit Account
                </label>
                <select
                  value={glSalesMpesa}
                  onChange={e => setGlSalesMpesa(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Asset').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Settlement Debit Account
                </label>
                <select
                  value={glSalesBank}
                  onChange={e => setGlSalesBank(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Asset').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Inventory &amp; Revenue Accounts
              </h5>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inventory Asset Clearing Account
                </label>
                <select
                  value={glInventoryAsset}
                  onChange={e => setGlInventoryAsset(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Asset').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost of Goods Sold (COGS) Account
                </label>
                <select
                  value={glCogs}
                  onChange={e => setGlCogs(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Expense').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sales Revenue Credit Account
                </label>
                <select
                  value={glSalesRevenue}
                  onChange={e => setGlSalesRevenue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Revenue').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  VAT Output Tax Liability Account
                </label>
                <select
                  value={glVatOutput}
                  onChange={e => setGlVatOutput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                >
                  {chartOfAccounts.filter(a => a.type === 'Liability').map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expense Categories & Budgets */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">
              Branch Operating Expense Categories &amp; Monthly Budgets
            </h4>
            <p className="text-xs text-slate-500">
              Set maximum monthly budget caps and linked GL account for allowable store operational expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-black text-slate-900">{cat.name}</h5>
                  <span className="text-[10px] font-mono text-slate-500">GL Account: {cat.glCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Cap</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-slate-900">KSh</span>
                    <input
                      type="number"
                      value={cat.defaultMonthlyBudget}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        setExpenseCategories(expenseCategories.map(c => c.id === cat.id ? { ...c, defaultMonthlyBudget: val } : c));
                      }}
                      className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-right outline-hidden"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Fixed Assets & Fiscal Year */}
      {activeTab === 'assets_fiscal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">
                Fixed Asset Classes &amp; Wear/Tear
              </h4>
              <p className="text-xs text-slate-500">
                Depreciation policies for fabric machinery, cutters and branch fit-outs.
              </p>
            </div>

            <div className="space-y-3">
              {assetClasses.map(ast => (
                <div key={ast.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{ast.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      {ast.depreciationMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Useful Lifespan: <strong>{ast.usefulLifeYears} Years</strong></span>
                    <span>Annual Rate: <strong>{ast.annualRatePct}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">
                Fiscal Year &amp; Currency Policy
              </h4>
              <p className="text-xs text-slate-500">
                Financial reporting calendar and currency representation.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Financial Year Start Month
                </label>
                <select
                  value={fiscalYearStartMonth}
                  onChange={e => setFiscalYearStartMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden cursor-pointer"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="postAuto" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Auto-Post Journal Voucher on POS Checkout
                  </label>
                  <input
                    type="checkbox"
                    id="postAuto"
                    checked={autoPostSalesJournal}
                    onChange={e => setAutoPostSalesJournal(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Maintains continuous real-time trial balances without requiring manual daily batch posting.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
