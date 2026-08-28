import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { hasPermission } from '../../utils/rbac';
import { LocationInfo, LocationId, BranchExpense, LocationType } from '../../types';
import {
  Building2,
  Plus,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  Building,
  Store,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  FileSpreadsheet,
  Filter,
  Search,
  Trash2,
  Edit3,
  Calendar,
  UserCheck,
  ShieldCheck,
  Package,
  Layers,
  ArrowLeftRight,
  HelpCircle,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  Briefcase
} from 'lucide-react';

export const BranchManagementModule: React.FC = () => {
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    branchExpenses,
    addBranchExpense,
    deleteBranchExpense,
    adjustBranchCashFloat,
    getBranchFinancialSummary,
    activeLocation,
    setActiveLocation,
    products,
    currentUser,
    isSuperAdmin,
    isAdmin
  } = useERP();

  const canCreateBranch = isSuperAdmin || isAdmin || hasPermission(currentUser.role, 'canAccessSystemSettings');
  const canRecordExpenses = isSuperAdmin || isAdmin || hasPermission(currentUser.role, 'canManageBranchExpenses');
  const canAdjustFloat = isSuperAdmin || isAdmin || hasPermission(currentUser.role, 'canAdjustCashFloat');

  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeLocation || 'main_store');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Branch Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    type: 'Independent Branch' as LocationType,
    address: '',
    phone: '',
    email: '',
    operatingHours: '8:00 AM - 6:00 PM',
    isAutonomousFinancial: true,
    canSellDirectly: true,
    canFulfillOrders: true,
    canRequestRestock: true,
    openingFloat: 50000,
    initialStockAllocations: {} as Record<string, number>
  });

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    locationId: selectedBranchId,
    title: '',
    category: 'Rent & Premises' as BranchExpense['category'],
    amount: '',
    paidVia: 'Cash Float' as BranchExpense['paidVia'],
    receiptRef: '',
    vendorName: '',
    notes: ''
  });

  // Cash Float Adjustment State
  const [floatAdjustment, setFloatAdjustment] = useState({
    amount: '',
    isAddition: true,
    reason: 'Daily Working Capital Replenishment'
  });

  const activeBranchInfo = locations.find(l => l.id === selectedBranchId) || locations[0];
  const summary = getBranchFinancialSummary(selectedBranchId);

  // All expenses for active selected branch
  const activeBranchExpenses = branchExpenses.filter(e => {
    const matchLoc = e.locationId === selectedBranchId;
    const matchCat = expenseCategoryFilter === 'All' || e.category === expenseCategoryFilter;
    const matchSearch =
      expenseSearch === '' ||
      e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.vendorName?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.receiptRef?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(expenseSearch.toLowerCase());
    return matchLoc && matchCat && matchSearch;
  });

  const handleCreateBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Branch name is required.' });
      return;
    }

    const res = await addLocation({
      name: newBranch.name.trim(),
      code: newBranch.code.trim() || undefined,
      type: newBranch.type,
      address: newBranch.address.trim(),
      phone: newBranch.phone.trim(),
      email: newBranch.email.trim(),
      operatingHours: newBranch.operatingHours.trim(),
      isAutonomousFinancial: newBranch.isAutonomousFinancial,
      canSellDirectly: newBranch.canSellDirectly,
      canFulfillOrders: newBranch.canFulfillOrders,
      canRequestRestock: newBranch.canRequestRestock,
      openingFloat: Number(newBranch.openingFloat) || 0,
      currentCashBalance: Number(newBranch.openingFloat) || 0,
      initialStockAllocations: newBranch.initialStockAllocations
    });

    if (res.success && res.location) {
      setSelectedBranchId(res.location.id);
      setIsCreateModalOpen(false);
      setFeedbackMessage({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMessage(null), 4000);
      // Reset form
      setNewBranch({
        name: '',
        code: '',
        type: 'Independent Branch',
        address: '',
        phone: '',
        email: '',
        operatingHours: '8:00 AM - 6:00 PM',
        isAutonomousFinancial: true,
        canSellDirectly: true,
        canFulfillOrders: true,
        canRequestRestock: true,
        openingFloat: 50000,
        initialStockAllocations: {}
      });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpense.amount);
    if (!newExpense.title.trim() || isNaN(amountNum) || amountNum <= 0) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid expense title and amount.' });
      return;
    }

    const res = await addBranchExpense({
      locationId: selectedBranchId,
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: amountNum,
      paidVia: newExpense.paidVia,
      receiptRef: newExpense.receiptRef.trim() || undefined,
      vendorName: newExpense.vendorName.trim() || undefined,
      notes: newExpense.notes.trim() || undefined
    });

    if (res.success) {
      setIsExpenseModalOpen(false);
      setFeedbackMessage({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMessage(null), 4000);
      setNewExpense({
        locationId: selectedBranchId,
        title: '',
        category: 'Rent & Premises',
        amount: '',
        paidVia: 'Cash Float',
        receiptRef: '',
        vendorName: '',
        notes: ''
      });
    }
  };

  const handleFloatAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adjNum = parseFloat(floatAdjustment.amount);
    if (isNaN(adjNum) || adjNum <= 0) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid adjustment amount.' });
      return;
    }

    const multiplier = floatAdjustment.isAddition ? 1 : -1;
    const res = adjustBranchCashFloat(selectedBranchId, adjNum * multiplier, floatAdjustment.reason);
    if (res.success) {
      setIsFloatModalOpen(false);
      setFeedbackMessage({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMessage(null), 4000);
      setFloatAdjustment({ amount: '', isAddition: true, reason: 'Daily Working Capital Replenishment' });
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (confirm(`Are you sure you want to deactivate and remove branch "${branchName}"?`)) {
      const res = await deleteLocation(branchId);
      if (res.success) {
        setSelectedBranchId('main_store');
        setFeedbackMessage({ type: 'success', text: res.message });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    }
  };

  // Category list for expense filter
  const expenseCategories = [
    'All',
    'Rent & Premises',
    'Utilities (Power/Water/Internet)',
    'Staff Meals & Transport',
    'Marketing & Promotion',
    'Maintenance & Repairs',
    'Office & Cleaning Supplies',
    'Security & Guard Services',
    'Packaging & Bags',
    'Sundry Expenses'
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-600 text-white border border-emerald-400'
                : 'bg-rose-600 text-white border border-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-white/80 hover:text-white px-2 py-1 rounded cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-tr from-rose-600 to-pink-600 rounded-xl text-white shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Autonomous Branch &amp; Financial Management
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Create new independent branches, manage branch cash floats, record operating expenses, and inspect autonomous Profit &amp; Loss accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canRecordExpenses && (
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-rose-600" />
                Record Branch Expense
              </button>
            )}

            {canAdjustFloat && (
              <button
                onClick={() => setIsFloatModalOpen(true)}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                Adjust Cash Float
              </button>
            )}

            {canCreateBranch && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Branch
              </button>
            )}
          </div>
        </div>

        {/* Branch Switcher Horizontal Tabs */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Active Branch Node:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {locations.map(loc => {
              const isSelected = loc.id === selectedBranchId;
              const isCurrentOperating = loc.id === activeLocation;
              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedBranchId(loc.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md ring-2 ring-rose-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/80'
                  }`}
                >
                  {loc.type === 'Central Warehouse' ? (
                    <Warehouse className="w-4 h-4 text-amber-400" />
                  ) : loc.type === 'Retail Sales Shop' ? (
                    <Store className="w-4 h-4 text-rose-400" />
                  ) : loc.type === 'Independent Branch' ? (
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Building className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{loc.name}</span>
                  {loc.isAutonomousFinancial && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Autonomous
                    </span>
                  )}
                  {isCurrentOperating && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Currently active session location" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Branch Overview Banner & Quick Actions */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden">
        {/* Background ambient decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono font-bold text-rose-300 uppercase">
                {activeBranchInfo.code || activeBranchInfo.id}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                {activeBranchInfo.type}
              </span>
              {activeBranchInfo.isAutonomousFinancial ? (
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-400/30 text-xs font-bold text-pink-300">
                  Full Financial Autonomy (P&amp;L + Cash Float)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-slate-500/20 border border-slate-400/30 text-xs font-bold text-slate-300">
                  Centralized Treasury
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeBranchInfo.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              {activeBranchInfo.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {activeBranchInfo.address}
                </span>
              )}
              {activeBranchInfo.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {activeBranchInfo.phone}
                </span>
              )}
              {activeBranchInfo.operatingHours && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {activeBranchInfo.operatingHours}
                </span>
              )}
            </div>
          </div>

          {/* Quick Context Switcher Button */}
          <div className="flex flex-wrap items-center gap-3">
            {activeLocation !== selectedBranchId && (
              <button
                onClick={() => setActiveLocation(selectedBranchId as LocationId)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Switch My Session to {activeBranchInfo.name}
              </button>
            )}

            {selectedBranchId !== 'main_store' && selectedBranchId !== 'sales_shop' && isSuperAdmin && (
              <button
                onClick={() => handleDeleteBranch(selectedBranchId, activeBranchInfo.name)}
                className="px-3 py-2.5 bg-white/10 hover:bg-rose-600/40 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Deactivate and delete branch"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate Branch
              </button>
            )}
          </div>
        </div>

        {/* Financial KPI Cards for the Selected Autonomous Branch */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Gross Sales Revenue */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-200">
              <span className="font-semibold">Gross Sales Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">
              KSh {summary.grossRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300">
              {summary.totalOrdersCount} completed sales orders
            </p>
          </div>

          {/* Card 2: Operating Expenses */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-200">
              <span className="font-semibold">Branch Expenses</span>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
              KSh {summary.totalExpenses.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300">
              {activeBranchExpenses.length} local expense vouchers
            </p>
          </div>

          {/* Card 3: Net Operating Profit */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-200">
              <span className="font-semibold">Net Operating Profit</span>
              <TrendingUp className={`w-4 h-4 ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <p className={`text-xl sm:text-2xl font-black font-mono ${
              summary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              KSh {summary.netProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300">
              Margin: <strong className="text-white">{summary.profitMarginPercent}%</strong>
            </p>
          </div>

          {/* Card 4: Cash Float / Working Drawer */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-200">
              <span className="font-semibold">Cash Drawer Float</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              KSh {summary.currentCashFloat.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300">
              Working balance in till
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (P&L Breakdown & Inventory), Right (Branch Expenses Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Autonomous Income Statement (P&L) & Inventory Holding */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Autonomous P&L Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Branch Income Statement (P&amp;L)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                YTD 2026
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Gross Sales Collections</span>
                <span className="font-bold font-mono text-slate-900">KSh {summary.grossRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Less: KRA 16% Output VAT</span>
                <span className="font-mono text-rose-600">- KSh {summary.vatLiability.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 font-bold bg-slate-50 px-2 rounded-lg">
                <span className="text-slate-800">Net Sales Revenue</span>
                <span className="font-mono text-slate-900">KSh {summary.netRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span className="font-mono text-rose-600">- KSh {summary.costOfGoodsSold.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 font-bold bg-slate-50 px-2 rounded-lg">
                <span className="text-slate-800">Gross Operating Margin</span>
                <span className="font-mono text-emerald-700">KSh {summary.grossProfit.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Less: Branch Operating Expenses</span>
                <span className="font-mono text-rose-600">- KSh {summary.totalExpenses.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-t-2 border-slate-900 font-black text-sm bg-rose-50/80 px-2.5 rounded-xl text-slate-900">
                <span>Net Branch Net Profit</span>
                <span className={`font-mono ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  KSh {summary.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Branch Stock & Asset Holding */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Local Inventory &amp; Stock Value
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {summary.inventoryItemCount} units
              </span>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                Total Stock Asset Valuation (Cost)
              </p>
              <p className="text-xl font-black font-mono text-indigo-950">
                KSh {summary.inventoryTotalValue.toLocaleString()}
              </p>
            </div>

            {/* Quick stock breakdown by product */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {products.map(p => {
                const stockAtLoc = p.locationStock[selectedBranchId] || 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs border border-slate-100"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.category} | {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-900">
                        {stockAtLoc} {p.unit}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        KSh {(stockAtLoc * p.costPrice).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Branch Expenses Ledger & Logging */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  <span>{activeBranchInfo.name} Expenses Ledger</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed vouchers for local operational expenses and petty cash disbursements.
                </p>
              </div>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {expenseCategories.slice(0, 4).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      expenseCategoryFilter === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                  placeholder="Search expenses..."
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Expenses List */}
            {activeBranchExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
                <Receipt className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-600">No expenses recorded for this branch yet.</p>
                <p className="text-[11px] text-slate-400">Click "Record Branch Expense" to log operating costs.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {activeBranchExpenses.map(exp => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{exp.title}</span>
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                            {exp.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Paid via <strong className="text-slate-700">{exp.paidVia}</strong> {exp.vendorName ? `• Vendor: ${exp.vendorName}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black font-mono text-rose-600">
                          - KSh {exp.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(exp.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {exp.notes && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 italic">
                        "{exp.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Recorded by: {exp.recordedBy}</span>
                      {exp.receiptRef && <span className="font-mono">Ref: {exp.receiptRef}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW AUTONOMOUS BRANCH */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-600 text-white rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      Create New Autonomous Branch
                    </h3>
                    <p className="text-xs text-slate-500">
                      Setup an independent branch node with autonomous finances, cash floats, and direct POS capability.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBranchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranch.name}
                      onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                      placeholder="e.g., Mombasa Branch Outlet"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Branch Code (e.g. BR-MSA)
                    </label>
                    <input
                      type="text"
                      value={newBranch.code}
                      onChange={e => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BR-MOMBASA"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Branch Type
                    </label>
                    <select
                      value={newBranch.type}
                      onChange={e => setNewBranch({ ...newBranch, type: e.target.value as LocationType })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                    >
                      <option value="Independent Branch">Independent Branch (Full Autonomy)</option>
                      <option value="Retail Sales Shop">Retail Sales Shop</option>
                      <option value="Transfer-Only Storage">Transfer-Only Storage</option>
                      <option value="Central Warehouse">Central Warehouse Hub</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Opening Cash Float &amp; Capital (KSh)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newBranch.openingFloat}
                      onChange={e => setNewBranch({ ...newBranch, openingFloat: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Physical Location / Address
                    </label>
                    <input
                      type="text"
                      value={newBranch.address}
                      onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                      placeholder="e.g., Nyali Mall, 2nd Floor, Links Road, Mombasa"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newBranch.phone}
                      onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                      placeholder="+254 700 123 456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Financial Autonomy & Capabilities Toggles */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Operational &amp; Financial Autonomy Configuration
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBranch.isAutonomousFinancial}
                      onChange={e => setNewBranch({ ...newBranch, isAutonomousFinancial: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Autonomous Financial Tracking &amp; Independent P&amp;L
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Maintains its own cash drawer, independent revenue accounting, and branch expense ledger.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBranch.canSellDirectly}
                      onChange={e => setNewBranch({ ...newBranch, canSellDirectly: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Enable Direct Retail POS Checkout at this Branch
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Cashiers at this branch can ring sales directly and issue compliant KRA ETR receipts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBranch.canRequestRestock}
                      onChange={e => setNewBranch({ ...newBranch, canRequestRestock: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Enable Zero-Cost Inter-Store Restock Requests
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Can request stock replenishments directly from the Main Store central warehouse.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Create Autonomous Branch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD BRANCH OPERATING EXPENSE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Record Expense for {activeBranchInfo.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Expense Title / Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExpense.title}
                    onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                    placeholder="e.g., Monthly Store Rent, Electricity Bill, Packaging Bags"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Expense Category
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={e => setNewExpense({ ...newExpense, category: e.target.value as BranchExpense['category'] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                    >
                      <option value="Rent & Premises">Rent &amp; Premises</option>
                      <option value="Utilities (Power/Water/Internet)">Utilities (Power/Water/Internet)</option>
                      <option value="Staff Meals & Transport">Staff Meals &amp; Transport</option>
                      <option value="Marketing & Promotion">Marketing &amp; Promotion</option>
                      <option value="Maintenance & Repairs">Maintenance &amp; Repairs</option>
                      <option value="Office & Cleaning Supplies">Office &amp; Cleaning Supplies</option>
                      <option value="Security & Guard Services">Security &amp; Guard Services</option>
                      <option value="Packaging & Bags">Packaging &amp; Bags</option>
                      <option value="Sundry Expenses">Sundry Expenses</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Amount (KSh) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="e.g., 15000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Payment Account
                    </label>
                    <select
                      value={newExpense.paidVia}
                      onChange={e => setNewExpense({ ...newExpense, paidVia: e.target.value as BranchExpense['paidVia'] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                    >
                      <option value="Cash Float">Cash Float / Till Drawer</option>
                      <option value="M-Pesa Till">M-Pesa Till / Paybill</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Vendor / Payee Name
                    </label>
                    <input
                      type="text"
                      value={newExpense.vendorName}
                      onChange={e => setNewExpense({ ...newExpense, vendorName: e.target.value })}
                      placeholder="e.g., Kenya Power / Landlord"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Receipt Ref / Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExpense.receiptRef}
                    onChange={e => setNewExpense({ ...newExpense, receiptRef: e.target.value })}
                    placeholder="e.g., KPLC-9821382"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Notes &amp; Particulars (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newExpense.notes}
                    onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                    placeholder="Provide additional details or authorization notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Post Expense Voucher
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: ADJUST / REPLENISH BRANCH CASH FLOAT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFloatModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Adjust Cash Float: {activeBranchInfo.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFloatModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFloatAdjustmentSubmit} className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Current Cash Float Balance
                  </p>
                  <p className="text-xl font-black font-mono text-slate-900">
                    KSh {summary.currentCashFloat.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFloatAdjustment({ ...floatAdjustment, isAddition: true })}
                    className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                      floatAdjustment.isAddition
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Inject / Add Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setFloatAdjustment({ ...floatAdjustment, isAddition: false })}
                    className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                      !floatAdjustment.isAddition
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    Withdraw / Transfer
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Amount (KSh) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={floatAdjustment.amount}
                    onChange={e => setFloatAdjustment({ ...floatAdjustment, amount: e.target.value })}
                    placeholder="e.g., 20000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Adjustment Reason / Explanation
                  </label>
                  <input
                    type="text"
                    required
                    value={floatAdjustment.reason}
                    onChange={e => setFloatAdjustment({ ...floatAdjustment, reason: e.target.value })}
                    placeholder="e.g., Daily Working Capital Replenishment from Central Vault"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFloatModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Confirm Float Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
