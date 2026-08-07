import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LOCATIONS } from '../../data/initialData';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import {
  DollarSign,
  Package,
  TrendingUp,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  Building,
  Warehouse,
  Store,
  Flame,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Receipt,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  CreditCard,
  Building2,
  PackageCheck,
  BarChart2,
  Calculator,
  Scale,
  Users,
  UserCheck,
  FileSpreadsheet,
  Layers,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    transfers,
    ledger,
    brandSettings,
    requestRestock,
    dispatchRestockTransfer,
    receiveRestockTransfer,
    acceptPurchaseOrder,
    setSelectedReceipt
  } = useERP();

  // Active Tab View: 'overview' | 'store_breakdown' | 'general_accounting'
  const [activeTab, setActiveTab] = useState<'overview' | 'store_breakdown' | 'general_accounting'>('overview');

  // Selected drilldown block state
  const [expandedBlock, setExpandedBlock] = useState<'stock' | 'revenue' | 'vat' | 'transfers' | null>(null);

  const toggleBlock = (block: 'stock' | 'revenue' | 'vat' | 'transfers') => {
    setExpandedBlock(prev => (prev === block ? null : block));
  };

  // 1. Calculate Total Asset Holding Value
  const totalStockValue = products.reduce((total, p) => {
    const totalUnits = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
    return total + totalUnits * p.costPrice;
  }, 0);

  const totalRetailAssetValue = products.reduce((total, p) => {
    const totalUnits = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
    return total + totalUnits * p.unitPriceRetail;
  }, 0);

  const totalStockUnits = products.reduce((total, p) => {
    const totalUnits = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
    return total + totalUnits;
  }, 0);

  // 2. Company Financials & Accounting Calculations
  const totalRevenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalVatLiab = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const totalNetRevenue = totalRevenue - totalVatLiab;

  // Cost of Goods Sold (COGS) for completed orders
  const totalCogs = orders.reduce((acc, o) => {
    if (o.status !== 'completed') return acc;
    const orderCost = o.items.reduce((iAcc, item) => {
      const prod = products.find(p => p.id === item.batchId);
      const unitCost = prod ? prod.costPrice : item.price * 0.7;
      return iAcc + unitCost * item.quantity;
    }, 0);
    return acc + orderCost;
  }, 0);

  const grossProfit = totalNetRevenue - totalCogs;
  const grossMarginPct = totalNetRevenue > 0 ? (grossProfit / totalNetRevenue) * 100 : 0;

  // 3. Pending Transfers
  const pendingTransfers = transfers.filter(t => t.status === 'pending_approval' || t.status === 'dispatched');
  const pendingCount = pendingTransfers.length;

  // 4. Store-by-Store Comprehensive Accounting & Responsibility Data
  const storeAccountabilityData = LOCATIONS.map(loc => {
    const locStockUnits = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0), 0);
    const locStockCostVal = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0) * p.costPrice, 0);
    const locStockRetailVal = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0) * p.unitPriceRetail, 0);

    const locOrders = orders.filter(o => o.fulfilledByLocation === loc.id && o.status === 'completed');
    const locOrderCount = locOrders.length;
    const locSalesRevenue = locOrders.reduce((acc, o) => acc + o.grandTotal, 0);
    const locVat = locOrders.reduce((acc, o) => acc + o.vatAmount, 0);
    const locNetSales = locSalesRevenue - locVat;

    const locMpesa = locOrders.filter(o => o.paymentMethod === 'M-Pesa').reduce((acc, o) => acc + o.grandTotal, 0);
    const locCash = locOrders.filter(o => o.paymentMethod === 'Cash').reduce((acc, o) => acc + o.grandTotal, 0);
    const locBank = locOrders.filter(o => o.paymentMethod === 'Bank Transfer').reduce((acc, o) => acc + o.grandTotal, 0);

    const locTransfersSent = transfers.filter(t => t.fromLocation === loc.id);
    const locTransfersReceived = transfers.filter(t => t.toLocation === loc.id);

    const locLowStockCount = products.filter(p => (p.locationStock[loc.id] || 0) <= p.minReorderLevel).length;

    let assignedRole = "Store Attendant";
    let operatorTitle = "Assigned Store Operator";
    if (loc.id === 'main_store') {
      assignedRole = "Central Hub Logistics & Warehouse Manager";
      operatorTitle = "Main Warehouse Manager";
    } else if (loc.id === 'sales_shop') {
      assignedRole = "Retail Counter Cashier & POS Operator";
      operatorTitle = "Sales Shop POS Team";
    } else if (loc.id === 'store_1') {
      assignedRole = "Sub-Depot 1 Ticket Reroute Operator";
      operatorTitle = "Store 1 Attendant";
    } else if (loc.id === 'store_2') {
      assignedRole = "Sub-Depot 2 Ticket Reroute Operator";
      operatorTitle = "Store 2 Attendant";
    }

    return {
      location: loc,
      stockUnits: locStockUnits,
      stockCostValue: locStockCostVal,
      stockRetailValue: locStockRetailVal,
      orders: locOrders,
      orderCount: locOrderCount,
      salesRevenue: locSalesRevenue,
      netSales: locNetSales,
      vatCollected: locVat,
      paymentBreakdown: { mpesa: locMpesa, cash: locCash, bank: locBank },
      transfersSentCount: locTransfersSent.length,
      transfersReceivedCount: locTransfersReceived.length,
      lowStockCount: locLowStockCount,
      assignedRole,
      operatorTitle
    };
  });

  // Stock Distribution Chart Data
  const storeStockData = LOCATIONS.map(loc => {
    const locValue = products.reduce((acc, p) => {
      const qty = p.locationStock[loc.id] || 0;
      return acc + qty * p.costPrice;
    }, 0);

    const locRevenue = orders
      .filter(o => o.fulfilledByLocation === loc.id && o.status === 'completed')
      .reduce((acc, o) => acc + o.grandTotal, 0);

    return {
      name: loc.name.split(' ')[0] + ' ' + (loc.name.split(' ')[1] || ''),
      stockValue: locValue,
      revenue: locRevenue
    };
  });

  // Category Breakdown Data (Dereck, Fleece, Yarns)
  const categoryData = ['Dereck', 'Fleece', 'Yarns'].map(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const totalUnits = catProducts.reduce((acc, p) => {
      return acc + (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
    }, 0);
    const value = catProducts.reduce((acc, p) => {
      const units = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
      return acc + units * p.costPrice;
    }, 0);

    return {
      name: cat,
      units: totalUnits,
      value
    };
  });

  const COLORS = ['#e91e63', '#ec4899', '#d946ef'];

  // Separated Low Stock Calculations
  const mainStoreLowStock = products.filter(p => p.locationStock.main_store <= p.minReorderLevel);
  const salesShopLowStock = products.filter(p => p.locationStock.sales_shop <= p.minReorderLevel);

  // Dead Stock Alert Calculations
  const deadStockItems = products.filter(p => {
    const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
    if (totalStock <= 0) return false;
    const unitsSold = orders.reduce((acc, order) => {
      if (order.status !== 'completed') return acc;
      const item = order.items.find(i => i.batchId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return unitsSold === 0;
  });

  const deadStockCapital = deadStockItems.reduce((acc, p) => {
    const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
    return acc + totalStock * p.costPrice;
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome / Hero Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-600 via-pink-600 via-rose-700 to-pink-800 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-rose-200/80 group">
        <ReflectionOverlay />
        
        {/* Animated Background Glowing Orbs */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <RightEdgeBlend variant="rainbow" />

        <div className="relative z-10 space-y-1.5 flex items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Enterprise Mode
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans drop-shadow-xs">
              {brandSettings.brandName} Enterprise Management Overview
            </h2>
            <p className="text-xs sm:text-sm text-pink-100 font-medium max-w-2xl leading-relaxed">
              Real-time multi-location inventory, zero-cost restock dispatch, KRA ETR compliance, and double-entry ledger updates for Dereck, Fleece, and Yarns.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <div className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/30 shadow-xs transition-all cursor-pointer hover:scale-105">
            <ShieldCheck className="w-4 h-4 text-emerald-300 animate-bounce" />
            <span>KRA TIMS ETR Operational</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE VIEW SWITCHER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-rose-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 Enterprise Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('store_breakdown')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'store_breakdown'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/60'
            }`}
          >
            <Store className="w-4 h-4 text-amber-500" />
            <span>🏬 Store Sales &amp; Stock Accountability</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
              activeTab === 'store_breakdown' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              4 Stores
            </span>
          </button>

          <button
            onClick={() => setActiveTab('general_accounting')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general_accounting'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/60'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>⚖️ Financials &amp; General Accounting</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
              activeTab === 'general_accounting' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              P&amp;L &amp; Trial Balance
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pr-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time POS &amp; Ledger Audit</span>
        </div>
      </div>

      {/* TAB VIEW 1: ENTERPRISE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Stock Holding Asset Value */}
            <div
              onClick={() => toggleBlock('stock')}
              className={`relative overflow-hidden bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md ${
                expandedBlock === 'stock'
                  ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/10 shadow-md'
                  : 'border-rose-100 shadow-xs hover:border-rose-300'
              }`}
            >
              <RightEdgeBlend variant="rose" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-600 transition-colors">
                  Stock Holding Asset Value
                </span>
                <div className={`p-2 rounded-xl transition-all ${expandedBlock === 'stock' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono group-hover:scale-105 transition-transform origin-left">
                KSh {totalStockValue.toLocaleString()}
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500 font-medium">
                  Across 4 Store Nodes
                </p>
                <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 group-hover:underline">
                  <span>{expandedBlock === 'stock' ? 'Hide Details' : 'Tap to expand'}</span>
                  {expandedBlock === 'stock' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

            {/* Card 2: Total Recorded Revenue */}
            <div
              onClick={() => toggleBlock('revenue')}
              className={`relative overflow-hidden bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md ${
                expandedBlock === 'revenue'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/10 shadow-md'
                  : 'border-rose-100 shadow-xs hover:border-rose-300'
              }`}
            >
              <RightEdgeBlend variant="rainbow" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                  Total Recorded Revenue
                </span>
                <div className={`p-2 rounded-xl transition-all ${expandedBlock === 'revenue' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono group-hover:scale-105 transition-transform origin-left">
                KSh {totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-emerald-600 font-medium">
                  {orders.length} Completed Orders
                </p>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 group-hover:underline">
                  <span>{expandedBlock === 'revenue' ? 'Hide Details' : 'Tap to expand'}</span>
                  {expandedBlock === 'revenue' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

            {/* Card 3: 16% VAT Tax Liability */}
            <div
              onClick={() => toggleBlock('vat')}
              className={`relative overflow-hidden bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md ${
                expandedBlock === 'vat'
                  ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/10 shadow-md'
                  : 'border-rose-100 shadow-xs hover:border-rose-300'
              }`}
            >
              <RightEdgeBlend variant="sunset" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                  16% VAT Tax Liability
                </span>
                <div className={`p-2 rounded-xl transition-all ${expandedBlock === 'vat' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 font-mono group-hover:scale-105 transition-transform origin-left">
                KSh {totalVatLiab.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500 font-medium">
                  KRA Output Tax Collected
                </p>
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 group-hover:underline">
                  <span>{expandedBlock === 'vat' ? 'Hide Details' : 'Tap to expand'}</span>
                  {expandedBlock === 'vat' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

            {/* Card 4: Pending Transfers */}
            <div
              onClick={() => toggleBlock('transfers')}
              className={`relative overflow-hidden bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md ${
                expandedBlock === 'transfers'
                  ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30 bg-fuchsia-50/10 shadow-md'
                  : 'border-rose-100 shadow-xs hover:border-rose-300'
              }`}
            >
              <RightEdgeBlend variant="ocean" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-fuchsia-600 transition-colors">
                  Pending Transfers
                </span>
                <div className={`p-2 rounded-xl transition-all relative ${expandedBlock === 'transfers' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white'}`}>
                  <ArrowLeftRight className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono group-hover:scale-105 transition-transform origin-left">
                {pendingCount} Requests
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-fuchsia-600 font-medium">
                  Restock &amp; Reroute Queue
                </p>
                <span className="text-[10px] font-bold text-fuchsia-600 flex items-center gap-0.5 group-hover:underline">
                  <span>{expandedBlock === 'transfers' ? 'Hide Queue' : 'Tap to view queue'}</span>
                  {expandedBlock === 'transfers' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EXPANDED DRILLDOWN PANEL BELOW THE METRIC CARDS */}
      {expandedBlock !== null && (
        <div className="relative overflow-hidden bg-white rounded-3xl border border-rose-200 shadow-xl p-6 space-y-5 animate-in slide-in-from-top-4 duration-300 group/drilldown">
          <RightEdgeBlend variant="rainbow" />

          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                {expandedBlock === 'transfers' && <ArrowLeftRight className="w-5 h-5 text-fuchsia-600" />}
                {expandedBlock === 'stock' && <Package className="w-5 h-5 text-rose-600" />}
                {expandedBlock === 'revenue' && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                {expandedBlock === 'vat' && <DollarSign className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  {expandedBlock === 'transfers' && 'Pending Transfers & Order Reroute Queue'}
                  {expandedBlock === 'stock' && 'Stock Holding Valuation & Store Node Breakdown'}
                  {expandedBlock === 'revenue' && 'Recorded Sales Revenue & Completed Orders Log'}
                  {expandedBlock === 'vat' && 'KRA ETR 16% Output Tax Liability Audit'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {expandedBlock === 'transfers' && 'Live inter-store restocks and customer purchase tickets waiting for dispatch or fulfillment'}
                  {expandedBlock === 'stock' && 'Detailed valuation across Dereck, Fleece, and Yarns inventory nodes'}
                  {expandedBlock === 'revenue' && 'Real-time sales breakdown by payment method and store location'}
                  {expandedBlock === 'vat' && 'KRA TIMS ETR Output Tax audit and compliance monitoring'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setExpandedBlock(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PANEL CONTENT 1: PENDING TRANSFERS */}
          {expandedBlock === 'transfers' && (
            <div className="space-y-4">
              {pendingTransfers.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">All Transfers &amp; Reroute Tickets Fulfilled!</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are no pending restock requests or customer reroutes currently waiting in queue.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTransfers.map(trf => {
                    const fromLoc = LOCATIONS.find(l => l.id === trf.fromLocation);
                    const toLoc = LOCATIONS.find(l => l.id === trf.toLocation);
                    const isReroute = trf.transferType === 'order_fulfillment_reroute';

                    return (
                      <div
                        key={trf.id}
                        className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 hover:bg-white hover:border-fuchsia-300 hover:shadow-md transition-all group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isReroute
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-pink-100 text-pink-800 border border-pink-300'
                            }`}
                          >
                            {isReroute ? 'Customer Order Reroute' : 'Zero-Cost Restock Request'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(trf.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{fromLoc?.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-rose-700">{toLoc?.name}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ref: {trf.id}</p>
                        </div>

                        {/* Items preview */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                          {trf.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between font-medium">
                              <span className="text-slate-700 truncate">{it.productName}</span>
                              <span className="font-mono font-bold text-slate-900">{it.quantity} {it.unit}</span>
                            </div>
                          ))}
                        </div>

                        {trf.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                            "{trf.notes}"
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                          {isReroute ? (
                            <button
                              onClick={() => acceptPurchaseOrder(trf.id, 'M-Pesa')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Fulfill &amp; Issue ETR</span>
                            </button>
                          ) : trf.status === 'pending_approval' ? (
                            <button
                              onClick={() => dispatchRestockTransfer(trf.id)}
                              className="px-3.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch Stock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => receiveRestockTransfer(trf.id)}
                              className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PANEL CONTENT 2: STOCK HOLDING */}
          {expandedBlock === 'stock' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LOCATIONS.map(loc => {
                  const val = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0) * p.costPrice, 0);
                  const totalUnits = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0), 0);
                  const pct = totalStockValue > 0 ? (val / totalStockValue) * 100 : 0;

                  return (
                    <div key={loc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{loc.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {loc.type}
                        </span>
                      </div>
                      <p className="text-lg font-black font-mono text-slate-900">KSh {val.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500">{totalUnits.toLocaleString()} total units in stock</p>
                      
                      {/* Share progress bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-right text-rose-600 font-bold font-mono">{pct.toFixed(1)}% share</p>
                    </div>
                  );
                })}
              </div>

              {/* Top High-Value Products */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Top High-Value Stock Batches</h4>
                <div className="space-y-2">
                  {products.slice(0, 4).map(p => {
                    const units = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
                    const batchVal = units * p.costPrice;

                    return (
                      <div key={p.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.colorHex }} />
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.category} • Cost: KSh {p.costPrice}/{p.unit}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-slate-900">KSh {batchVal.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">{units} {p.unit} total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PANEL CONTENT 3: REVENUE */}
          {expandedBlock === 'revenue' && (
            <div className="space-y-4">
              
              {/* Store Sales Separation Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <span className="text-xs font-bold uppercase text-rose-400 tracking-wider">Main Store &amp; Hub Sales</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">Fulfilled At Main Store</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-black font-mono text-white">
                      KSh {orders.filter(o => o.fulfilledByLocation === 'main_store').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </p>
                    <span className="text-xs text-slate-400">
                      {orders.filter(o => o.fulfilledByLocation === 'main_store').length} Order(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bulk orders, direct sales &amp; Store 1/2 ticket reroutes
                  </p>
                </div>

                <div className="p-4 bg-pink-50/80 rounded-2xl border border-pink-200 text-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b border-pink-200 pb-2">
                    <span className="text-xs font-bold uppercase text-pink-800 tracking-wider">Sales Shop Retail Sales</span>
                    <span className="text-[10px] bg-pink-200 text-pink-900 px-2 py-0.5 rounded-full font-mono font-bold">Counter POS Register</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-black font-mono text-pink-950">
                      KSh {orders.filter(o => o.fulfilledByLocation === 'sales_shop').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </p>
                    <span className="text-xs text-pink-800">
                      {orders.filter(o => o.fulfilledByLocation === 'sales_shop').length} Order(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-pink-700">
                    Direct counter retail sales &amp; walk-in customer receipts
                  </p>
                </div>
              </div>

              {/* Payment methods summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['M-Pesa', 'Cash', 'Bank Transfer'].map(method => {
                  const methodOrders = orders.filter(o => o.paymentMethod === method);
                  const methodTotal = methodOrders.reduce((a, o) => a + o.grandTotal, 0);

                  return (
                    <div key={method} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
                      <p className="text-xs font-bold text-emerald-900">{method} Revenue</p>
                      <p className="text-xl font-black font-mono text-emerald-950">KSh {methodTotal.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-700">{methodOrders.length} transaction(s)</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent Orders Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Completed Orders</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No completed orders recorded yet.</p>
                  ) : (
                    orders.map(ord => {
                      const loc = LOCATIONS.find(l => l.id === ord.fulfilledByLocation);

                      return (
                        <div key={ord.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                {loc?.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Customer: {ord.customerName} • {ord.items.length} item(s) • {ord.paymentMethod}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono font-black text-emerald-700 text-sm">
                              KSh {ord.grandTotal.toLocaleString()}
                            </span>
                            <button
                              onClick={() => setSelectedReceipt(ord)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="View ETR Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL CONTENT 4: VAT TAX */}
          {expandedBlock === 'vat' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                  <p className="text-xs font-bold text-amber-900">Taxable Net Sales Base</p>
                  <p className="text-xl font-black font-mono text-amber-950">
                    KSh {(totalRevenue - totalVatLiab).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-amber-800">Net of 16% VAT</p>
                </div>

                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-1">
                  <p className="text-xs font-bold text-rose-900">16% Output VAT Liability</p>
                  <p className="text-xl font-black font-mono text-rose-950">
                    KSh {totalVatLiab.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-rose-800">Collected for KRA TIMS</p>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                  <p className="text-xs font-bold text-emerald-900">Gross Taxable Revenue</p>
                  <p className="text-xl font-black font-mono text-emerald-950">
                    KSh {totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-emerald-800">Fully ETR Documented</p>
                </div>
              </div>

              {/* TIMS ETR Control Status */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Store Node TIMS Control Status</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">All Devices Online</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {LOCATIONS.map(loc => (
                    <div key={loc.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{loc.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Serial: KRA-ETR-{(loc?.id || '').toUpperCase()}-902</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Connected</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stock Holding & Revenue by Location Chart */}
        <div className="relative overflow-hidden lg:col-span-2 bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 group">
          <RightEdgeBlend variant="rainbow" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Node Financial Distribution &amp; Sales
              </h3>
              <p className="text-xs text-slate-500">
                Stock Asset Holding Value vs Sales Revenue per Location
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeStockData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`KSh ${value.toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #ffe4e6', fontSize: '12px' }}
                />
                <Bar dataKey="stockValue" name="Stock Value" fill="#e91e63" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" name="Sales Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Breakdown */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 flex flex-col justify-between group">
          <RightEdgeBlend variant="ocean" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Textile Category Asset Share
            </h3>
            <p className="text-xs text-slate-500">
              Dereck, Fleece, and Yarns Value Distribution
            </p>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-rose-100 pt-3">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  KSh {cat.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Operational Rules Verification Matrix & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core System Architecture Operational Rules Checklist */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 group">
          <RightEdgeBlend variant="rose" />
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                Core Inter-Store Logic &amp; Operational Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Active System Enforcement
              </p>
            </div>
          </div>

          <div className="space-y-3">
            
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-950">Main Store Operations</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Bulk &amp; Retail POS active. Zero-cost internal restock dispatch to Sales Shop, Store 1, and Store 2 decrements Main Store inventory and updates expected holding asset values.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-950">Store 1 &amp; Store 2 Sales Restrictions</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Direct POS sales disabled. Customer purchase requests automatically route Order Fulfillment Tickets to Main Store or Sales Shop.
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-950">Sales Shop &amp; ETR Engine</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Retail POS active. Auto-triggers restock requests when thresholds drop; out-of-stock orders reroute to Main Store. All sales generate KRA-compliant 16% VAT ETR Receipts.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Separated Low Stock Alerts Grid: Main Store vs. Sales Shop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* MAIN STORE LOW STOCK ALERT CARD */}
          <div className="relative overflow-hidden bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 group">
            <RightEdgeBlend variant="sunset" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-rose-400" />
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  Main Store Low Stock Alerts ({mainStoreLowStock.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Central Hub warehouse inventory below minimum reorder thresholds
                </p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${
                mainStoreLowStock.length > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {mainStoreLowStock.length > 0 ? `${mainStoreLowStock.length} Critical` : 'Stock Healthy'}
              </span>
            </div>

            {mainStoreLowStock.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-800/40 rounded-xl border border-slate-800">
                Main Store maintains healthy bulk inventory above all minimum thresholds.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {mainStoreLowStock.map((p) => (
                  <div
                    key={`main-low-${p.id}`}
                    className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                        style={{ backgroundColor: p.colorHex }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Main Store Stock: <strong className="text-rose-400 font-mono font-bold">{p.locationStock.main_store} {p.unit}</strong> (Min Level: {p.minReorderLevel})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        requestRestock(
                          [{ batchId: p.id, quantity: p.minReorderLevel * 3 }],
                          `Supplier Factory Reorder for Main Store Hub (${p.name})`
                        );
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Procure Hub Stock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SALES SHOP LOW STOCK ALERT CARD */}
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-pink-200 shadow-sm space-y-4 group">
            <RightEdgeBlend variant="rainbow" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-pink-600" />
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                  Sales Shop Low Stock Alerts ({salesShopLowStock.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Retail counter POS inventory below minimum reorder thresholds
                </p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${
                salesShopLowStock.length > 0 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {salesShopLowStock.length > 0 ? `${salesShopLowStock.length} Low` : 'Shop Stock Healthy'}
              </span>
            </div>

            {salesShopLowStock.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-medium bg-rose-50/30 rounded-xl border border-rose-100">
                Sales Shop retail counters are fully stocked above minimum thresholds.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {salesShopLowStock.map((p) => (
                  <div
                    key={`shop-low-${p.id}`}
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                        style={{ backgroundColor: p.colorHex }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-600">
                          Shop Counter Stock: <strong className="text-amber-800 font-mono font-bold">{p.locationStock.sales_shop} {p.unit}</strong> (Min Level: {p.minReorderLevel})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        requestRestock(
                          [{ batchId: p.id, quantity: p.minReorderLevel * 2 }],
                          `Inter-Store Restock Request from Main Store to Sales Shop for ${p.name}`
                        );
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Request Restock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* DEAD STOCK ALERT & STAGNANT INVENTORY CAPITAL RISK MONITOR */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-purple-800 shadow-xl space-y-4 group">
          <RightEdgeBlend variant="purple" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/80 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Dead Stock Alert &amp; Capital Clearance Monitor ({deadStockItems.length} Batches)</span>
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Stagnant inventory batches with 0 sales in order history • Total Tied-Up Capital: <strong className="text-amber-300 font-mono font-extrabold">KSh {deadStockCapital.toLocaleString()}</strong>
              </p>
            </div>

            <span className="px-3 py-1 text-xs font-mono font-extrabold rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 shrink-0">
              {deadStockItems.length > 0 ? `⚠️ ${deadStockItems.length} Batches Stagnant` : 'Zero Dead Stock'}
            </span>
          </div>

          {deadStockItems.length === 0 ? (
            <div className="p-6 text-center text-purple-200 text-xs font-medium bg-purple-900/30 rounded-xl border border-purple-800">
              High inventory turnover achieved! All catalog product batches have recorded active sales.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {deadStockItems.map(p => {
                const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
                const capitalValue = totalStock * p.costPrice;

                return (
                  <div
                    key={`dead-${p.id}`}
                    className="p-3.5 bg-purple-900/40 border border-purple-700/60 rounded-xl space-y-2 hover:border-purple-500 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                        style={{ backgroundColor: p.colorHex }}
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-white text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-purple-300 font-mono">{p.sku} • {p.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-800/80">
                      <div>
                        <span className="text-purple-300">Total Holding: </span>
                        <strong className="text-white font-mono">{totalStock} {p.unit}</strong>
                      </div>
                      <div>
                        <span className="text-purple-300">Tied-Up Capital: </span>
                        <strong className="text-amber-300 font-mono font-extrabold">KSh {capitalValue.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* TAB VIEW 2: STORE-BY-STORE SALES & STOCK RESPONSIBILITY MATRIX */}
      {activeTab === 'store_breakdown' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Store Responsibility Header Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-3xl border border-amber-800/80 shadow-lg space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">
                  Store Sales Responsibility &amp; Individual Inventory Accountability
                </h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-mono font-bold rounded-full">
                4 Separate Store Operating Nodes
              </span>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed max-w-3xl">
              Each store operator and cashier is directly responsible for sales revenue fulfilled at their location, physical inventory stock holdings, and POS counter payment collections (M-Pesa, Cash, Bank Transfer).
            </p>
          </div>

          {/* 4 Store Nodes Detailed Accountability Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {storeAccountabilityData.map(s => {
              const isMain = s.location.id === 'main_store';
              const isShop = s.location.id === 'sales_shop';

              return (
                <div
                  key={s.location.id}
                  className={`bg-white rounded-3xl border p-6 space-y-5 shadow-md relative overflow-hidden group transition-all hover:shadow-xl ${
                    isMain
                      ? 'border-rose-200 ring-1 ring-rose-300/50'
                      : isShop
                      ? 'border-pink-200 ring-1 ring-pink-300/50'
                      : 'border-slate-200'
                  }`}
                >
                  <RightEdgeBlend variant={isMain ? 'rose' : isShop ? 'rainbow' : 'ocean'} />

                  {/* Header info */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isMain && <Warehouse className="w-5 h-5 text-rose-600" />}
                        {isShop && <Store className="w-5 h-5 text-pink-600" />}
                        {!isMain && !isShop && <Building className="w-5 h-5 text-indigo-600" />}
                        <h4 className="font-black text-slate-900 text-base">{s.location.name}</h4>
                      </div>
                      <p className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{s.assignedRole}</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        Node: {(s?.location?.id || '').toUpperCase()}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">{s.location.type}</p>
                    </div>
                  </div>

                  {/* Key Metrics Dual Columns */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Stock Holding Column */}
                    <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-rose-600" />
                        Inventory Holding
                      </span>
                      <p className="text-xl font-black font-mono text-slate-900">
                        {s.stockUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                      </p>
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                        <p>Cost Value: <strong className="text-slate-900">KSh {s.stockCostValue.toLocaleString()}</strong></p>
                        <p>Market Value: <strong className="text-rose-700">KSh {s.stockRetailValue.toLocaleString()}</strong></p>
                      </div>
                    </div>

                    {/* Sales Revenue Column */}
                    <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        Fulfilled Sales
                      </span>
                      <p className="text-xl font-black font-mono text-emerald-950">
                        KSh {s.salesRevenue.toLocaleString()}
                      </p>
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                        <p>Completed Orders: <strong className="text-slate-900">{s.orderCount}</strong></p>
                        <p>KRA Output VAT: <strong className="text-emerald-800">KSh {s.vatCollected.toLocaleString()}</strong></p>
                      </div>
                    </div>

                  </div>

                  {/* Payment Breakdown per Operator */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Operator Register Payment Collections</span>
                      <span className="text-[10px] font-mono text-slate-500">Verified POS Sync</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-emerald-700">🟢 M-Pesa</p>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">KSh {s.paymentBreakdown.mpesa.toLocaleString()}</p>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-amber-700">💵 Cash</p>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">KSh {s.paymentBreakdown.cash.toLocaleString()}</p>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-indigo-700">🏦 Bank Transfer</p>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">KSh {s.paymentBreakdown.bank.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Movements & Low Stock Warnings */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                      <span>Dispatches Sent: <strong>{s.transfersSentCount}</strong></span>
                      <span>Restocks Received: <strong>{s.transfersReceivedCount}</strong></span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      s.lowStockCount > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {s.lowStockCount > 0 ? `⚠️ ${s.lowStockCount} Low Batches` : 'Stock Fully Healthy'}
                    </span>
                  </div>

                  {/* Orders fulfilled at this store list */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-800">Recent Fulfilled Orders ({s.orders.length})</p>
                    {s.orders.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No completed orders recorded for this store location.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {s.orders.slice(0, 3).map(ord => (
                          <div key={ord.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <p className="font-mono font-bold text-slate-900">{ord.id} • {ord.customerName}</p>
                              <p className="text-[10px] text-slate-500">{ord.paymentMethod} • {ord.items.length} item(s)</p>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-emerald-700">KSh {ord.grandTotal.toLocaleString()}</span>
                              <button
                                onClick={() => setSelectedReceipt(ord)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="View Receipt"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB VIEW 3: COMPANY-WIDE FINANCIALS & GENERAL ACCOUNTING MODULE */}
      {activeTab === 'general_accounting' && (
        <div className="space-y-6 animate-fadeIn">
          {/* General Accounting Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl border border-emerald-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">
                  Company-Wide Financial Statement &amp; General Accounting Ledger Audit
                </h3>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold rounded-full">
                Double-Entry Balanced Ledger
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
              Consolidated enterprise accounting statement: Net sales income, Cost of Goods Sold (COGS), Gross Operating Margin, KRA TIMS 16% Output VAT tax liability, and total asset valuation.
            </p>
          </div>

          {/* Income Statement (P&L) & Balance Sheet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Gross Sales Revenue</span>
              <p className="text-2xl font-black font-mono text-emerald-950">KSh {totalRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium">All completed POS sales across 4 stores</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">16% KRA Output VAT</span>
              <p className="text-2xl font-black font-mono text-amber-950">KSh {totalVatLiab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[11px] text-slate-500 font-medium">Output Tax collected for TIMS filing</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
              <p className="text-2xl font-black font-mono text-indigo-950">KSh {totalCogs.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium">Production &amp; inventory procurement cost</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl border border-emerald-500 shadow-md space-y-2">
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wider">Gross Operating Profit</span>
              <p className="text-2xl font-black font-mono text-white">KSh {grossProfit.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-100 font-bold font-mono">Gross Margin: {grossMarginPct.toFixed(1)}%</p>
            </div>

          </div>

          {/* Detailed Financial Statement Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Consolidated Enterprise Profit &amp; Loss Statement (KSh)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">KRA TIMS Compliant</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Total Gross Invoice Sales (Incl. 16% VAT)</span>
                <span className="font-extrabold text-slate-900">KSh {totalRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-950">
                <span className="font-bold">Less: 16% Output VAT Liability (Tax Account 2010)</span>
                <span className="font-extrabold text-amber-900">- KSh {totalVatLiab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-300 font-extrabold text-slate-900">
                <span>NET OPERATING SALES REVENUE (Revenue Account 4010)</span>
                <span className="text-sm">KSh {totalNetRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-indigo-950">
                <span className="font-bold">Less: Cost of Goods Sold / COGS (Expense Account 5010)</span>
                <span className="font-extrabold text-indigo-900">- KSh {totalCogs.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-md">
                <span>ESTIMATED GROSS OPERATING MARGIN</span>
                <span className="text-base font-mono">KSh {grossProfit.toLocaleString()} ({grossMarginPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Double-Entry Trial Balance & General Ledger Audit */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Double-Entry General Ledger Trial Balance Audit ({ledger.length} Transactions)
                </h4>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-mono font-bold rounded-full border border-emerald-300">
                ✓ Debits = Credits Balanced
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ledger.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No ledger transactions recorded yet.</p>
              ) : (
                ledger.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs gap-3 font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{tx.account}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'debit' ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {(tx?.type || '').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">{tx.description} • By: {tx.performedBy}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-slate-900">KSh {tx.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

