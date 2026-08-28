import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductBatch, TareReconciliationRecord, LocationId } from '../../types';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { TareSettingsModal } from './TareSettingsModal';
import {
  exportTareWeightAuditScheduleCSV,
  exportTareWeightAuditSchedulePDF
} from '../../utils/documentExport';
import {
  Scale,
  ShieldCheck,
  Calculator,
  ArrowRight,
  TrendingDown,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  Store,
  Info,
  DollarSign,
  PackageCheck,
  BadgeAlert,
  ArrowLeftRight,
  BookOpen
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const WeightReconciliationModule: React.FC = () => {
  const {
    products,
    locations,
    activeLocation,
    tareReconciliationLogs,
    updateProductTareProfile,
    reconcileTareWithJournal,
    etrConfig
  } = useERP();

  // Active Sub-Tab within Weight Reconciler
  const [activeTab, setActiveTab] = useState<'calculator' | 'audit_log' | 'matrix' | 'accounting_flow'>('calculator');
  const [searchFilter, setSearchFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  
  // Interactive Scale Calculator State
  const [simBatchId, setSimBatchId] = useState<string>(products.find(p => p.category === 'Yarns')?.id || products[0]?.id || '');
  const [simGrossWeight, setSimGrossWeight] = useState<number>(5.250); // Scale says 5.250 kg
  const [simContainerCount, setSimContainerCount] = useState<number>(5); // 5 cones
  const [simManualTareKg, setSimManualTareKg] = useState<number>(0.050); // 50g per cone
  const [simOverrideTare, setSimOverrideTare] = useState<boolean>(false);

  // Selected Product for Tare Profile Modal
  const [editingProduct, setEditingProduct] = useState<ProductBatch | null>(null);

  const selectedProduct = products.find(p => p.id === simBatchId) || products[0];

  // Calculated Tare Values for Calculator
  const effectiveTarePerUnit = simOverrideTare
    ? simManualTareKg
    : (selectedProduct?.tareProfile?.tareWeightPerUnit ?? (selectedProduct?.category === 'Yarns' ? 0.050 : 0.250));

  const totalTareDeducted = effectiveTarePerUnit * simContainerCount;
  const billableNetWeight = Math.max(0, simGrossWeight - totalTareDeducted);
  const retailUnitPrice = selectedProduct?.unitPriceRetail || 1000;
  const costUnitPrice = selectedProduct?.costPrice || 600;

  // Financial Impact Comparisons
  const grossBilledTotal = simGrossWeight * retailUnitPrice;
  const netBilledTotal = billableNetWeight * retailUnitPrice;
  const customerOverchargePrevented = grossBilledTotal - netBilledTotal;
  const inventoryAssetBilledOut = billableNetWeight * costUnitPrice;
  const phantomStockLossPreventedKg = totalTareDeducted;
  const balanceSheetAssetDistortionPrevented = phantomStockLossPreventedKg * costUnitPrice;

  // Filtered Audit Logs
  const filteredLogs = tareReconciliationLogs.filter(log => {
    const matchesLoc = locationFilter === 'All' || log.locationId === locationFilter;
    const matchesSearch =
      log.productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (log.orderId && log.orderId.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesLoc && matchesSearch;
  });

  const totalLogsGross = filteredLogs.reduce((acc, l) => acc + l.grossWeight, 0);
  const totalLogsTare = filteredLogs.reduce((acc, l) => acc + l.tareWeightDeducted, 0);
  const totalLogsNet = filteredLogs.reduce((acc, l) => acc + l.netWeightBillable, 0);
  const totalFinancialProtected = filteredLogs.reduce((acc, l) => acc + l.varianceCostSaved, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Explanation of Gross vs Net Problem & Our Engine Solution */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-8 text-white border border-slate-800 shadow-xl">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rose" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Gross-to-Net Weight Governance
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Balance Sheet Integrity Shield
              </span>
            </div>
            <h1 className="text-base sm:text-3xl font-black tracking-tight text-white">
              Dual-Weight (Gross vs Net) &amp; Inventory Balance Sheet Reconciler
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              Eliminates financial conflict and inventory balance sheet distortions when textiles, fleeces, or yarn cones are received in <strong className="text-rose-400">Net Weight</strong> and weighed on store scales in <strong className="text-amber-400">Gross Weight</strong> with cone/core packaging.
            </p>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="p-2.5 sm:p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Tare Weight Reconciled</p>
              <p className="text-sm sm:text-xl font-black font-mono text-amber-400 mt-0.5">
                {totalLogsTare.toFixed(3)} kg
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{filteredLogs.length} audit transactions</p>
            </div>
            <div className="p-2.5 sm:p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Valuation Protected</p>
              <p className="text-sm sm:text-xl font-black font-mono text-emerald-400 mt-0.5">
                KSh {totalFinancialProtected.toLocaleString()}
              </p>
              <p className="text-[9px] sm:text-[10px] text-emerald-400/80 mt-0.5">Zero balance sheet distortion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => { playClickSound(); setActiveTab('calculator'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Scale & Tare Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => { playClickSound(); setActiveTab('audit_log'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit_log'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tare Reconciliation Audit Log ({tareReconciliationLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { playClickSound(); setActiveTab('matrix'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Product Tare Profiles ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { playClickSound(); setActiveTab('accounting_flow'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'accounting_flow'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Balance Sheet Protection Logic</span>
          </button>
        </div>

        {/* Action Buttons: Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playSuccessSound();
              exportTareWeightAuditScheduleCSV(tareReconciliationLogs, locations, etrConfig);
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSuccessSound();
              exportTareWeightAuditSchedulePDF(tareReconciliationLogs, locations, etrConfig);
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download PDF report"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span>PDF Audit Schedule</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SCALE CONVERTER & FINANCIAL CONVERSION CALCULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Controls */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-rose-100 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dual-Weight Conversion Inputs</h3>
                <p className="text-xs text-slate-500">Test live scale readings vs net inventory billing</p>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Textile / Yarn Batch</label>
              <select
                value={simBatchId}
                onChange={(e) => setSimBatchId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.category} [{p.unit}]
                  </option>
                ))}
              </select>
            </div>

            {/* Scale Gross Reading */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Gross Weight on Physical Scale</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Scale Reading (Inc. Cores)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={simGrossWeight}
                  onChange={(e) => setSimGrossWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">kg Gross</span>
              </div>
            </div>

            {/* Container / Cone Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Number of Cores / Cones</label>
                <input
                  type="number"
                  min="1"
                  value={simContainerCount}
                  onChange={(e) => setSimContainerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tare per Core</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    disabled={!simOverrideTare}
                    value={effectiveTarePerUnit}
                    onChange={(e) => setSimManualTareKg(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-3 pr-10 py-2 border rounded-xl font-mono text-sm font-bold ${
                      simOverrideTare
                        ? 'bg-white border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500'
                        : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">kg</span>
                </div>
              </div>
            </div>

            {/* Tare Override Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="simOverrideTare"
                checked={simOverrideTare}
                onChange={(e) => setSimOverrideTare(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="simOverrideTare" className="text-xs text-slate-700 font-medium cursor-pointer">
                Override Preset Tare ({selectedProduct?.tareProfile?.packagingDescription || 'Standard Core'})
              </label>
            </div>

            {/* Batch Unit Rates Display */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Retail Unit Selling Price:</span>
                <span className="font-mono font-bold text-slate-900">KSh {retailUnitPrice.toLocaleString()} / {selectedProduct?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory Balance Sheet Cost:</span>
                <span className="font-mono font-bold text-slate-900">KSh {costUnitPrice.toLocaleString()} / {selectedProduct?.unit}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Comparative Resolution Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {/* The Solution Waterfall Visual */}
            <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-rose-600" />
                <span>Dual-Weight Mathematical Resolution</span>
              </h3>

              {/* Conversion Pipeline Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    1. Scale Reading (Gross)
                  </span>
                  <p className="text-2xl font-black font-mono text-amber-900">
                    {simGrossWeight.toFixed(3)} <span className="text-sm">kg</span>
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium">Physical Yarn + Cones</p>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    2. Tare Deducted
                  </span>
                  <p className="text-2xl font-black font-mono text-rose-900">
                    - {totalTareDeducted.toFixed(3)} <span className="text-sm">kg</span>
                  </p>
                  <p className="text-[10px] text-rose-700 font-medium">{simContainerCount} Cores × {(effectiveTarePerUnit * 1000).toFixed(0)}g</p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    3. Pure Stock Billed (Net)
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-900">
                    = {billableNetWeight.toFixed(3)} <span className="text-sm">kg</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">Decremented from Balance Sheet</p>
                </div>
              </div>

              {/* Comparative Resolution Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* WITHOUT Dual-Weight Governance (The Disastrous Way) */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Without Tare Deduction (Unmanaged Gross)</span>
                  </div>
                  <ul className="text-xs text-rose-800 space-y-1.5 pt-1">
                    <li className="flex justify-between">
                      <span>Customer Charged:</span>
                      <strong className="font-mono text-rose-950">KSh {grossBilledTotal.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Inventory Depleted:</span>
                      <strong className="font-mono text-rose-950">{simGrossWeight.toFixed(3)} kg</strong>
                    </li>
                    <li className="flex justify-between text-[11px] text-rose-700 pt-1 border-t border-rose-200">
                      <span>Financial Conflict:</span>
                      <strong>Customer overcharged / KRA audit risk</strong>
                    </li>
                    <li className="flex justify-between text-[11px] text-rose-700">
                      <span>Stock Discrepancy:</span>
                      <strong>Phantom deficit ({totalTareDeducted.toFixed(3)} kg missing)</strong>
                    </li>
                  </ul>
                </div>

                {/* WITH Dual-Weight Governance (Our Solution) */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>With Dual-Weight Shield (Pure Net Billing)</span>
                  </div>
                  <ul className="text-xs text-emerald-800 space-y-1.5 pt-1">
                    <li className="flex justify-between">
                      <span>Customer Charged:</span>
                      <strong className="font-mono text-emerald-950">KSh {netBilledTotal.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Inventory Depleted:</span>
                      <strong className="font-mono text-emerald-950">{billableNetWeight.toFixed(3)} kg</strong>
                    </li>
                    <li className="flex justify-between text-[11px] text-emerald-700 pt-1 border-t border-emerald-200">
                      <span>Financial Balance:</span>
                      <strong>100% fair pricing & KRA compliant</strong>
                    </li>
                    <li className="flex justify-between text-[11px] text-emerald-700">
                      <span>Balance Sheet Asset:</span>
                      <strong>Perfect physical stock alignment</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Total Financial Distortion Prevented Callout */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Balance Sheet Asset Value Protected</p>
                    <p className="text-[11px] text-slate-400">Inventory asset valuation distortion prevented on this transaction</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold block">SAVED / RECONCILED</span>
                  <span className="text-xl font-black font-mono text-white">
                    KSh {balanceSheetAssetDistortionPrevented.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REAL-TIME AUDIT LOG REGISTER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gross-to-Net Tare Reconciliation Register</h3>
              <p className="text-xs text-slate-500">Historical audit trail of all transactions with tare deductions</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU, product, order..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="All">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Log Table */}
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Scale className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No tare reconciliation records match current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Date & Ref</th>
                    <th className="py-2.5 px-3">Product & SKU</th>
                    <th className="py-2.5 px-3">Store Location</th>
                    <th className="py-2.5 px-3 text-right">Gross (Scale)</th>
                    <th className="py-2.5 px-3 text-right text-rose-700">Tare Deducted</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700 font-black">Net Stock Billed</th>
                    <th className="py-2.5 px-3 text-right">Valuation Protected</th>
                    <th className="py-2.5 px-3 text-center">Ledger Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => {
                    const locName = locations.find(l => l.id === log.locationId)?.name || log.locationId;
                    return (
                      <tr key={log.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block">
                            {log.orderId || log.consignmentId || log.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{log.productName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.sku}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {locName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                          {log.grossWeight.toFixed(3)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          - {log.tareWeightDeducted.toFixed(3)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-700">
                          {log.netWeightBillable.toFixed(3)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          KSh {log.varianceCostSaved.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'journal_posted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.status === 'journal_posted' ? 'Journal Posted' : 'Reconciled'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {log.status !== 'journal_posted' && (
                            <button
                              type="button"
                              onClick={() => reconcileTareWithJournal(log.id)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Post Adjusting Journal
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={3} className="py-2.5 px-3">
                      Total ({filteredLogs.length} Transactions)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      {totalLogsGross.toFixed(3)} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300">
                      - {totalLogsTare.toFixed(3)} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 font-black">
                      {totalLogsNet.toFixed(3)} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                      KSh {totalFinancialProtected.toLocaleString()}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                      100% Stock Asset Aligned
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PRODUCT TARE PROFILES MATRIX */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Textile Batch Tare Profile Matrix</h3>
              <p className="text-xs text-slate-500">Configure default core/cone tare weights for automatic POS and intake deduction</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Batch & SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Tare Packaging Description</th>
                  <th className="py-2.5 px-3 text-right">Tare Weight</th>
                  <th className="py-2.5 px-3 text-right">Core Cost (KSh)</th>
                  <th className="py-2.5 px-3 text-center">POS Auto-Deduct</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(prod => {
                  const tare = prod.tareProfile || {
                    tareWeightPerUnit: prod.category === 'Yarns' ? 0.050 : prod.category === 'Fleece' ? 0.250 : 0.350,
                    packagingDescription: prod.category === 'Yarns' ? 'Plastic Yarn Cone (50g)' : 'Cardboard Roll Core',
                    packagingCost: prod.category === 'Yarns' ? 15 : 35,
                    isTareDeductedAtPOS: true
                  };

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{prod.sku}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold uppercase text-slate-600">{prod.unit}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {tare.packagingDescription || 'Standard Core'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {tare.tareWeightPerUnit ? `${(tare.tareWeightPerUnit * 1000).toFixed(0)}g (${tare.tareWeightPerUnit} kg)` : ('tarePercent' in tare && (tare as any).tarePercent ? `${(tare as any).tarePercent}%` : '0g')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        KSh {tare.packagingCost || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Enforced
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setEditingProduct(prod);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Configure Tare
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. BALANCE SHEET PROTECTION ARCHITECTURE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'accounting_flow' && (
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">How Dual-Weight Governance Protects the Balance Sheet</h3>
            <p className="text-xs text-slate-500">Technical and financial double-entry accounting reconciliation workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-slate-900 text-xs">Intake Inventory Valuation</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When raw material arrives invoiced by Net Weight, inventory asset account is debited strictly with pure fiber weight. Tare cores are booked separately if purchased, preventing fictitious asset inflation.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-slate-900 text-xs">POS Real-Time Tare Subtraction</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                At POS scales, cashier enters gross scale reading. The engine automatically deducts cone weight (e.g. 50g per cone). Customer is billed for net fiber and stock is reduced strictly by net weight.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-slate-900 text-xs">Zero Discrepancy Equilibrium</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                General Ledger balance sheet inventory asset matches physical yarn count exactly. No phantom shortages, no legal trade measurement violations, and no KRA VAT over-declarations.
              </p>
            </div>
          </div>

          {/* Sample Double Entry Voucher Table */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
            <h4 className="font-bold text-xs text-rose-300 uppercase tracking-wide">
              Automated Double-Entry Adjusting Journal Rule
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2">Account Code & Title</th>
                    <th className="py-2">Debit (KSh)</th>
                    <th className="py-2">Credit (KSh)</th>
                    <th className="py-2">Balance Sheet Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 text-emerald-400">1010 - Bank / Cash Receivable</td>
                    <td className="py-2 text-white">6,000.00</td>
                    <td className="py-2 text-slate-500">-</td>
                    <td className="py-2 text-slate-400">Current Asset</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-rose-400">4010 - Sales Revenue (Net Billed Stock)</td>
                    <td className="py-2 text-slate-500">-</td>
                    <td className="py-2 text-white">5,172.41</td>
                    <td className="py-2 text-slate-400">Income Statement Revenue</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-amber-400">2020 - KRA 16% Output VAT</td>
                    <td className="py-2 text-slate-500">-</td>
                    <td className="py-2 text-white">827.59</td>
                    <td className="py-2 text-slate-400">Current Liability</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-emerald-400">5010 - Cost of Goods Sold (Pure Net)</td>
                    <td className="py-2 text-white">3,250.00</td>
                    <td className="py-2 text-slate-500">-</td>
                    <td className="py-2 text-slate-400">COGS Expense</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-rose-400">1200 - Inventory Asset (Pure Net Stock Out)</td>
                    <td className="py-2 text-slate-500">-</td>
                    <td className="py-2 text-white">3,250.00</td>
                    <td className="py-2 text-slate-400">Current Asset (Stock In Perfect Balance)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Editing Tare Profile Modal */}
      {editingProduct && (
        <TareSettingsModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
          onSaveTareProfile={(batchId, profile) => {
            updateProductTareProfile(batchId, profile);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
