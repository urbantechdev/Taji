import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  DollarSign,
  Smartphone,
  Building2,
  CreditCard,
  TrendingUp,
  Receipt,
  FileText,
  Download,
  Calendar,
  Lock,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  ShoppingBag,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatCurrency, exportPeriodicSalesStatementPDF, exportPeriodicSalesStatementCSV } from '../../utils/documentExport';
import { LocationId } from '../../types';

export const TodaySalesView: React.FC = () => {
  const {
    getTodaySalesSummary,
    locations,
    activeLocation,
    shiftClosures,
    setIsShiftClosureModalOpen,
    setIsPeriodicStatementModalOpen,
    setSelectedReceipt,
    setSelectedShiftRecord,
    etrConfig
  } = useERP();

  const [selectedLocFilter, setSelectedLocFilter] = useState<LocationId | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Cash' | 'M-Pesa' | 'Bank Transfer' | 'Card'>('All');

  const todaySummary = getTodaySalesSummary(selectedLocFilter);

  // Filter orders
  const filteredOrders = todaySummary.orders.filter(o => {
    const matchesSearch =
      (o.receiptNumber || o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPayment = paymentFilter === 'All' || o.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Filter shifts closed today
  const todayStr = todaySummary.date;
  const todayShifts = shiftClosures.filter(s => {
    const sDate = (s.closedAt || s.startTime).slice(0, 10);
    const matchesDate = sDate === todayStr;
    const matchesLoc = selectedLocFilter === 'All' || s.locationId === selectedLocFilter;
    return matchesDate && matchesLoc;
  });

  const handleExportTodayPDF = () => {
    // Generate daily periodic statement summary
    const statement = {
      periodType: 'daily' as const,
      startDate: todaySummary.date,
      endDate: todaySummary.date,
      title: `Daily Sales & Revenue Statement (${todaySummary.date})`,
      locationId: selectedLocFilter,
      locationName: selectedLocFilter === 'All' ? 'All Branches' : (locations.find(l => l.id === selectedLocFilter)?.name || selectedLocFilter),
      totalOrders: todaySummary.totalOrders,
      totalUnitsSold: todaySummary.totalUnitsSold,
      grossSalesRevenue: todaySummary.grossRevenue,
      vat16Amount: todaySummary.vatLiability,
      netSalesRevenue: todaySummary.netRevenue,
      cogsAmount: todaySummary.cogs,
      grossProfit: todaySummary.grossProfit,
      grossMarginPercent: todaySummary.grossMarginPercent,
      cashSalesTotal: todaySummary.cashAtHand,
      cashSalesCount: todaySummary.cashOrdersCount,
      mpesaSalesTotal: todaySummary.mpesaTotal,
      mpesaSalesCount: todaySummary.mpesaOrdersCount,
      bankSalesTotal: todaySummary.bankTotal,
      bankSalesCount: todaySummary.bankOrdersCount,
      cardSalesTotal: todaySummary.cardTotal,
      cardSalesCount: todaySummary.cardOrdersCount,
      totalOpeningFloats: todayShifts.reduce((s, sh) => s + (sh.openingFloat || 0), 0),
      totalCashExpenses: todaySummary.todayCashExpenses,
      expectedCashInDrawer: todaySummary.currentCashDrawerBalance,
      actualCountedCash: todayShifts.reduce((s, sh) => s + (sh.actualCashAtHand || 0), 0),
      totalCashVariance: todayShifts.reduce((s, sh) => s + (sh.cashVariance || 0), 0),
      categoryBreakdown: todaySummary.categoryBreakdown.map(c => ({
        category: c.category,
        unitsSold: c.unitsSold,
        revenue: c.revenue,
        sharePercent: todaySummary.grossRevenue > 0 ? Number(((c.revenue / todaySummary.grossRevenue) * 100).toFixed(1)) : 0
      })),
      orders: todaySummary.orders,
      shiftClosures: todayShifts,
      generatedAt: new Date().toISOString()
    };

    exportPeriodicSalesStatementPDF(statement, etrConfig);
  };

  const handleExportTodayCSV = () => {
    const statement = {
      periodType: 'daily' as const,
      startDate: todaySummary.date,
      endDate: todaySummary.date,
      title: `Daily Sales & Revenue Statement (${todaySummary.date})`,
      locationId: selectedLocFilter,
      locationName: selectedLocFilter === 'All' ? 'All Branches' : (locations.find(l => l.id === selectedLocFilter)?.name || selectedLocFilter),
      totalOrders: todaySummary.totalOrders,
      totalUnitsSold: todaySummary.totalUnitsSold,
      grossSalesRevenue: todaySummary.grossRevenue,
      vat16Amount: todaySummary.vatLiability,
      netSalesRevenue: todaySummary.netRevenue,
      cogsAmount: todaySummary.cogs,
      grossProfit: todaySummary.grossProfit,
      grossMarginPercent: todaySummary.grossMarginPercent,
      cashSalesTotal: todaySummary.cashAtHand,
      cashSalesCount: todaySummary.cashOrdersCount,
      mpesaSalesTotal: todaySummary.mpesaTotal,
      mpesaSalesCount: todaySummary.mpesaOrdersCount,
      bankSalesTotal: todaySummary.bankTotal,
      bankSalesCount: todaySummary.bankOrdersCount,
      cardSalesTotal: todaySummary.cardTotal,
      cardSalesCount: todaySummary.cardOrdersCount,
      totalOpeningFloats: todayShifts.reduce((s, sh) => s + (sh.openingFloat || 0), 0),
      totalCashExpenses: todaySummary.todayCashExpenses,
      expectedCashInDrawer: todaySummary.currentCashDrawerBalance,
      actualCountedCash: todayShifts.reduce((s, sh) => s + (sh.actualCashAtHand || 0), 0),
      totalCashVariance: todayShifts.reduce((s, sh) => s + (sh.cashVariance || 0), 0),
      categoryBreakdown: todaySummary.categoryBreakdown.map(c => ({
        category: c.category,
        unitsSold: c.unitsSold,
        revenue: c.revenue,
        sharePercent: todaySummary.grossRevenue > 0 ? Number(((c.revenue / todaySummary.grossRevenue) * 100).toFixed(1)) : 0
      })),
      orders: todaySummary.orders,
      shiftClosures: todayShifts,
      generatedAt: new Date().toISOString()
    };

    exportPeriodicSalesStatementCSV(statement);
  };

  const cashShare = todaySummary.grossRevenue > 0 ? (todaySummary.cashAtHand / todaySummary.grossRevenue) * 100 : 0;
  const mpesaShare = todaySummary.grossRevenue > 0 ? (todaySummary.mpesaTotal / todaySummary.grossRevenue) * 100 : 0;
  const bankShare = todaySummary.grossRevenue > 0 ? (todaySummary.bankTotal / todaySummary.grossRevenue) * 100 : 0;

  return (
    <div id="today-sales-view-root" className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Sales Today Dashboard
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] sm:text-xs font-bold border border-rose-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-500" />
              Live Real-Time
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date: {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Location Scope Selector */}
          <select
            id="today-sales-location-filter"
            value={selectedLocFilter}
            onChange={e => setSelectedLocFilter(e.target.value as any)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-800"
          >
            <option value="All">All Locations & Central Stores</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Close Shift (EOD Handover) */}
          <button
            id="today-sales-close-shift-btn"
            onClick={() => setIsShiftClosureModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            Close Shift (EOD)
          </button>

          {/* Download Statements (Daily, Weekly, Monthly) */}
          <button
            id="today-sales-statements-modal-btn"
            onClick={() => setIsPeriodicStatementModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            Statements (Daily/Weekly/Monthly)
          </button>

          {/* Quick PDF Export of Today */}
          <button
            id="today-sales-export-pdf-btn"
            onClick={handleExportTodayPDF}
            className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
            title="Download Today's Statement PDF"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* HIGHLIGHT METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        
        {/* 1. Gross Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Gross Sales Turnover</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block tracking-tight">
            {formatCurrency(todaySummary.grossRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {todaySummary.totalOrders} total completed orders
          </span>
        </div>

        {/* 2. Net Sales Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Net Sales Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-teal-800 block tracking-tight">
            {formatCurrency(todaySummary.netRevenue)}
          </span>
          <span className="text-[11px] text-teal-600 font-medium mt-1 block">
            Excl. 16% Output VAT
          </span>
        </div>

        {/* 3. 16% VAT Output Tax */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">16% VAT Liability</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-amber-700 block tracking-tight">
            {formatCurrency(todaySummary.vatLiability)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            KRA E-TIMS Output Tax
          </span>
        </div>

        {/* 4. Gross Operating Profit */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Gross Profit Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-emerald-700 block tracking-tight">
            {formatCurrency(todaySummary.grossProfit)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {todaySummary.grossMarginPercent}% Gross Margin
          </span>
        </div>

        {/* 5. Units Sold */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Units Dispatched</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block tracking-tight">
            {todaySummary.totalUnitsSold.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Meters, kg & rolls
          </span>
        </div>

      </div>

      {/* THREE-CHANNEL LIQUID BREAKDOWN: CASH AT HAND vs MPESA vs BANK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Cash at Hand vs M-Pesa vs Commercial Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time payment channel breakdown and liquid asset distribution for today's transactions.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">Consolidated Today</span>
            <span className="text-sm font-extrabold text-slate-900">{formatCurrency(todaySummary.grossRevenue)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* 1. Cash at Hand Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Cash at Hand</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Physical Register</span>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {cashShare.toFixed(1)}% Share
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs text-slate-500 block">Today's Cash Sales Revenue</span>
                <span className="text-lg font-black text-emerald-900">{formatCurrency(todaySummary.cashAtHand)}</span>
              </div>
              
              <div className="pt-2 border-t border-emerald-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Transactions Count:</span>
                  <span className="font-bold text-slate-800">{todaySummary.cashOrdersCount} receipts</span>
                </div>
                <div className="flex justify-between">
                  <span>Today's Cash Expenses:</span>
                  <span className="font-medium text-rose-600">-{formatCurrency(todaySummary.todayCashExpenses)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-emerald-100">
                  <span>Current Cash in Drawer:</span>
                  <span className="text-emerald-800">{formatCurrency(todaySummary.currentCashDrawerBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Safaricom M-Pesa Card */}
          <div className="p-4 rounded-xl border border-green-200 bg-green-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Safaricom M-Pesa</span>
                  <span className="text-[11px] text-green-700 font-medium">Till / Paybill</span>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                {mpesaShare.toFixed(1)}% Share
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs text-slate-500 block">Today's M-Pesa Collections</span>
                <span className="text-lg font-black text-green-900">{formatCurrency(todaySummary.mpesaTotal)}</span>
              </div>
              
              <div className="pt-2 border-t border-green-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Transactions Count:</span>
                  <span className="font-bold text-slate-800">{todaySummary.mpesaOrdersCount} receipts</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Route:</span>
                  <span className="font-medium text-slate-800">Auto-Banked / Till</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-green-100">
                  <span>Merchant Verification:</span>
                  <span className="text-green-800">100% Cleared</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Commercial Bank Card */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Commercial Bank</span>
                  <span className="text-[11px] text-blue-700 font-medium">Direct EFT / RTGS</span>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {bankShare.toFixed(1)}% Share
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs text-slate-500 block">Today's Bank Transfers</span>
                <span className="text-lg font-black text-blue-900">{formatCurrency(todaySummary.bankTotal)}</span>
              </div>
              
              <div className="pt-2 border-t border-blue-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Transactions Count:</span>
                  <span className="font-bold text-slate-800">{todaySummary.bankOrdersCount} receipts</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Accounts:</span>
                  <span className="font-medium text-slate-800">KCB / Equity Bank</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-blue-100">
                  <span>Status:</span>
                  <span className="text-blue-800">Direct Inflows</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PRODUCT CATEGORIES PERFORMANCE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-600" />
          Textile Category Performance Today
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {todaySummary.categoryBreakdown.map(cat => (
            <div key={cat.category} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">{cat.category} Fabrics</span>
                <span className="text-[11px] text-slate-500 block">{cat.unitsSold.toLocaleString()} units sold</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-sm text-slate-900 block">{formatCurrency(cat.revenue)}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">{cat.margin.toFixed(1)}% margin</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CASHIER SHIFTS CLOSED TODAY (IF ANY) */}
      {todayShifts.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Cashier Shift Closures & Z-Reports Today ({todayShifts.length})
            </h3>
            <span className="text-xs text-slate-400">Reconciled end-of-work handovers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayShifts.map(s => (
              <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.shiftNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.totalVariance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {s.totalVariance === 0 ? '✓ Balanced' : `Variance: ${formatCurrency(s.totalVariance)}`}
                  </span>
                </div>
                <div className="text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-semibold text-slate-800">{s.operatorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual Cash Counted:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(s.actualCashAtHand)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closed At:</span>
                    <span>{new Date(s.closedAt || s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedShiftRecord(s)}
                  className="w-full py-1.5 mt-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1 text-[11px]"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  View & Download Z-Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED TODAY'S ORDERS LISTING */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              Itemized Sales Transactions Today ({filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Detailed audit log of all completed POS transactions and tax invoices issued today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="today-sales-search-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search receipt, customer..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 text-slate-900 w-44"
              />
            </div>

            {/* Payment Filter */}
            <select
              id="today-sales-payment-filter"
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
            >
              <option value="All">All Channels</option>
              <option value="Cash">Cash at Hand</option>
              <option value="M-Pesa">Safaricom M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card / Other</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Sold</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">16% VAT</th>
                <th className="py-2.5 px-3 text-right">Total (KSh)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No sales transactions recorded for today matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const itemsSummary = order.items.map(i => `${i.quantity}${i.unit} ${i.productName}`).join(', ');
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {order.receiptNumber || order.id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {order.customerName || 'Walk-in Retail Client'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={itemsSummary}>
                        {itemsSummary}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.paymentMethod === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentMethod === 'M-Pesa'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentMethod === 'Bank Transfer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {formatCurrency(order.vatAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          id={`today-sales-view-receipt-${order.id}`}
                          onClick={() => setSelectedReceipt(order)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
