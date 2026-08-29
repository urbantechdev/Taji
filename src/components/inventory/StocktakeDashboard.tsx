import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  StocktakeSession,
  StocktakeItem,
  StocktakeDiscrepancyReason,
  LocationId,
  CategoryType
} from '../../types';
import {
  exportStocktakeAuditReportPDF,
  exportStocktakeAuditReportCSV
} from '../../utils/documentExport';
import {
  ClipboardCheck,
  Plus,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Barcode,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Lock,
  Calendar,
  Building2,
  UserCheck,
  DollarSign,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
  Check,
  X,
  Trash2,
  Boxes,
  HelpCircle,
  BookOpen
} from 'lucide-react';

const DISCREPANCY_REASONS: { value: StocktakeDiscrepancyReason; label: string }[] = [
  { value: 'Normal Measurement Variance', label: 'Normal Measurement Variance (±1-2%)' },
  { value: 'Fabric off-cut shrinkage', label: 'Fabric Roll Cut Remnant / Offcut Loss' },
  { value: 'Theft / Unaccounted Shrinkage', label: 'Physical Theft / Unaccounted Shrinkage' },
  { value: 'Damaged / Water Stain', label: 'Damaged / Water Stain / Scrap' },
  { value: 'Cut-off defect', label: 'Cut-off Defect / Scrap' },
  { value: 'Tare / Scale Calibration', label: 'Tare Paper Core / Scale Calibration' },
  { value: 'Direct Sale Untracked', label: 'Direct Sale Untracked' },
  { value: 'Misplaced Shelf', label: 'Misplaced Shelf / Location Mismatch' },
  { value: 'Other Discrepancy', label: 'Other Discrepancy' }
];

export const StocktakeDashboard: React.FC = () => {
  const {
    stocktakeSessions,
    activeStocktakeSession,
    setActiveStocktakeSession,
    createStocktakeSession,
    updateStocktakeItemCount,
    bulkUpdateStocktakeItems,
    finalizeAndReconcileStocktake,
    deleteStocktakeSession,
    locations,
    etrConfig,
    currentUser,
    isAdmin
  } = useERP();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [newLocationId, setNewLocationId] = useState<LocationId | 'all'>('sales_shop');
  const [newCategoryFilter, setNewCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [newAuditorName, setNewAuditorName] = useState(currentUser.name || 'Store Auditor');
  const [newNotes, setNewNotes] = useState('');

  // Table Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'uncounted' | 'discrepancy' | 'matched' | 'deficit' | 'surplus'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showSOPGuide, setShowSOPGuide] = useState(false);

  // Barcode Fast-Scan Input State
  const [fastScanCode, setFastScanCode] = useState('');
  const [fastScanNotice, setFastScanNotice] = useState<string | null>(null);

  // Finalize Reconciliation Modal
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [autoPostJournal, setAutoPostJournal] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Delete Confirmation
  const [sessionToDelete, setSessionToDelete] = useState<StocktakeSession | null>(null);

  // Current Session
  const session = activeStocktakeSession || (stocktakeSessions.length > 0 ? stocktakeSessions[0] : null);

  // Filter items in active session
  const filteredItems = useMemo(() => {
    if (!session || !session.items) return [];

    return session.items.filter(item => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'uncounted' && item.status !== 'uncounted') return false;
      if (statusFilter === 'matched' && item.status !== 'matched') return false;
      if (statusFilter === 'deficit' && item.status !== 'deficit') return false;
      if (statusFilter === 'surplus' && item.status !== 'surplus') return false;
      if (statusFilter === 'discrepancy' && (item.status !== 'deficit' && item.status !== 'surplus')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.productName.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesBarcode = item.barcode ? item.barcode.toLowerCase().includes(q) : false;
        const matchesCat = item.category.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesBarcode || matchesCat;
      }

      return true;
    });
  }, [session, categoryFilter, statusFilter, searchQuery]);

  // Handle Fast Barcode Count
  const handleFastBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !fastScanCode.trim()) return;

    const raw = fastScanCode.trim().toLowerCase();
    const targetItem = session.items.find(
      it =>
        (it.barcode && it.barcode.toLowerCase() === raw) ||
        it.sku.toLowerCase() === raw ||
        it.productId.toLowerCase() === raw ||
        it.productName.toLowerCase().includes(raw)
    );

    if (targetItem) {
      const currentVal = targetItem.physicalCountedQty !== null ? targetItem.physicalCountedQty : 0;
      const nextVal = currentVal + 1;
      updateStocktakeItemCount(session.id, targetItem.productId, nextVal);
      setFastScanNotice(`Counted: ${targetItem.productName} (+1) -> Physical: ${nextVal} ${targetItem.unit}`);
      setFastScanCode('');
      setTimeout(() => setFastScanNotice(null), 4000);
    } else {
      setFastScanNotice(`Item with barcode/SKU "${fastScanCode}" not found in this session scope.`);
      setTimeout(() => setFastScanNotice(null), 4000);
    }
  };

  // Mark all uncounted items as matched
  const handleMarkAllAsMatched = () => {
    if (!session || session.status === 'reconciled') return;

    const uncounted = session.items.filter(i => i.physicalCountedQty === null);
    if (uncounted.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to mark all ${uncounted.length} uncounted items as matching system expected stock?`
      )
    ) {
      const updates = uncounted.map(item => ({
        productId: item.productId,
        countedQty: item.systemExpectedQty,
        notes: 'Auto-marked as matched system inventory'
      }));
      bulkUpdateStocktakeItems(session.id, updates);
      setActionMessage(`Marked ${updates.length} items as exact system match!`);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Handle New Session Creation
  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSess = createStocktakeSession({
      title: newTitle.trim() || `${newPeriod} Monthly Physical Stock Count`,
      locationId: newLocationId,
      period: newPeriod,
      conductedBy: newAuditorName,
      auditorName: newAuditorName,
      notes: newNotes,
      categoryFilter: newCategoryFilter
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewNotes('');
    setActionMessage(`Created new stocktake session ${newSess.sessionNumber} with ${newSess.totalItems} items!`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Handle Finalize & Reconcile
  const handleFinalize = async () => {
    if (!session) return;
    setIsFinalizing(true);
    const res = await finalizeAndReconcileStocktake(session.id, autoPostJournal);
    setIsFinalizing(false);
    setIsFinalizeModalOpen(false);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (!session) return;
    exportStocktakeAuditReportPDF(session, locations, etrConfig);
  };

  const handleExportCSV = () => {
    if (!session) return;
    exportStocktakeAuditReportCSV(session, locations, etrConfig);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Session Selector */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center text-rose-600 shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Monthly Physical Stocktake & Audit Reconciler
                </h2>
                <span className="bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-200">
                  IAS 2 / KRA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-cycle physical inventory counting, tare-weight verification, shrinkage write-off & automatic General Ledger posting.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSOPGuide(!showSOPGuide)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>{showSOPGuide ? 'Hide SOP Guide' : '5-Step SOP'}</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Stocktake Count</span>
            </button>
          </div>
        </div>

        {/* 5-Step SOP Interactive Guide */}
        {showSOPGuide && (
          <div className="p-4 bg-gradient-to-r from-rose-50 via-pink-50/50 to-amber-50/40 rounded-xl border border-rose-200/80 text-xs text-slate-700 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-rose-900 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-rose-600" />
                Urban Interior Standard Operating Procedure (SOP) for Monthly Stocktaking
              </span>
              <button
                onClick={() => setShowSOPGuide(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100">
                <strong className="block text-rose-700 font-black mb-1">1. Preparation</strong>
                <span>Initiate session, freeze pending dispatches, verify all delivery GRNs are committed.</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100">
                <strong className="block text-pink-700 font-black mb-1">2. Physical Count</strong>
                <span>Scan barcodes or input measured meters/cones. Check physical shelf count against sheet.</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100">
                <strong className="block text-amber-700 font-black mb-1">3. Weight Check</strong>
                <span>For yarns/fleece rolls, weigh gross roll and subtract core tare to verify true net meterage.</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100">
                <strong className="block text-indigo-700 font-black mb-1">4. Reason Assignment</strong>
                <span>Assign audit reasons to variances (Offcut scraps, measurement loss, undetected short delivery).</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100">
                <strong className="block text-emerald-700 font-black mb-1">5. Auto Reconciliation</strong>
                <span>Click Finalize to update stock balances and automatically post P&L shrinkage/gain journals.</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Message Toast */}
        {actionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Session Bar */}
        {stocktakeSessions.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Active Count Session:
              </span>
              <select
                value={session?.id || ''}
                onChange={e => {
                  const found = stocktakeSessions.find(s => s.id === e.target.value);
                  setActiveStocktakeSession(found || null);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {stocktakeSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sessionNumber} — {s.title} ({s.locationId.toUpperCase()} • {s.status.toUpperCase()})
                  </option>
                ))}
              </select>

              {session && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    session.status === 'reconciled'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : session.status === 'completed'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : session.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {session.status === 'reconciled' ? 'Reconciled & Locked' : session.status.replace('_', ' ')}
                </span>
              )}
            </div>

            {session && (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Export Reports */}
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Download KRA & Auditor-Ready Stocktake Audit PDF Report"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>Audit PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Export count variances to Excel CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel CSV</span>
                </button>

                {/* Finalize Button */}
                {session.status !== 'reconciled' && (
                  <button
                    onClick={() => setIsFinalizeModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102 ml-1"
                    title="Reconcile physical counts to active inventory and post GL shrinkage journal"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finalize & Reconcile</span>
                  </button>
                )}

                {/* Delete Draft Session */}
                {session.status !== 'reconciled' && (
                  <button
                    onClick={() => setSessionToDelete(session)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete this draft stocktake session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 border-t border-slate-100 space-y-2">
            <p className="text-sm font-bold text-slate-700">No stocktake sessions created yet.</p>
            <p className="text-xs text-slate-500">
              Click &quot;New Stocktake Count&quot; above to initialize your monthly physical stock counting session.
            </p>
          </div>
        )}
      </div>

      {session && (
        <>
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Progress / Total Items */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Counting Progress</span>
                <Boxes className="w-4 h-4 text-rose-600" />
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {session.countedItems}
                </span>
                <span className="text-xs font-bold text-slate-400">/ {session.totalItems} items</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${session.totalItems > 0 ? (session.countedItems / session.totalItems) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Exact Matches */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Exact Matches</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">
                  {session.matchedItems}
                </span>
                <span className="text-xs font-bold text-slate-400">batches</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold">100% physical & system parity</p>
            </div>

            {/* Deficit / Shrinkage Value */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Deficit / Shrinkage</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-600">
                  -KSh {Math.round(session.totalShrinkageValue || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-rose-700 font-bold">
                {session.deficitItems} item(s) short vs books
              </p>
            </div>

            {/* Surplus / Gain Value */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Surplus / Excess</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-600">
                  +KSh {Math.round(session.totalSurplusValue || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-blue-700 font-bold">
                {session.surplusItems} item(s) in excess
              </p>
            </div>

            {/* Net Financial Variance */}
            <div
              className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                session.netVarianceCostValue < 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : session.netVarianceCostValue > 0
                  ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between opacity-80">
                <span>Net Audit Variance</span>
                <DollarSign className="w-4 h-4" />
              </span>
              <div className="text-2xl font-black">
                {session.netVarianceCostValue < 0 ? '-' : '+'}KSh{' '}
                {Math.abs(Math.round(session.netVarianceCostValue || 0)).toLocaleString()}
              </div>
              <p className="text-[11px] font-bold opacity-80">
                {session.netVarianceCostValue < 0
                  ? 'P&L Shrinkage Write-off'
                  : session.netVarianceCostValue > 0
                  ? 'P&L Inventory Surplus'
                  : 'Zero Book Variance'}
              </p>
            </div>
          </div>

          {/* Barcode Fast-Scanner Input & Bulk Tools */}
          {session.status !== 'reconciled' && (
            <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-4 rounded-2xl text-white shadow-md space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-rose-400" />
                    <span>Barcode / SKU Fast-Count Mode</span>
                  </h3>
                  <p className="text-xs text-rose-200/80">
                    Scan or type SKU/Barcode to instantly increment count by 1 or match with physical rolls.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllAsMatched}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Quickly fill uncounted items with system quantity"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Remaining Uncounted as Matched</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleFastBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fastScanCode}
                    onChange={e => setFastScanCode(e.target.value)}
                    placeholder="Scan product barcode, SKU or color name..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs font-mono focus:ring-2 focus:ring-rose-400 focus:bg-white/15 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Count (+1)
                </button>
              </form>

              {fastScanNotice && (
                <div className="p-2 bg-rose-900/60 border border-rose-500/40 rounded-lg text-xs font-bold text-rose-100 animate-in fade-in">
                  {fastScanNotice}
                </div>
              )}
            </div>
          )}

          {/* Filtering & Items Table */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search SKU, name, barcode..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Dereck">Dereec (Dereck)</option>
                  <option value="Fleece">Fleeces</option>
                  <option value="Yarns">Yarns</option>
                </select>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'uncounted', label: `Uncounted (${session.uncountedItems})` },
                      { id: 'discrepancy', label: `Variances (${session.deficitItems + session.surplusItems})` },
                      { id: 'matched', label: `Matched (${session.matchedItems})` }
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-bold self-end md:self-center">
                Showing {filteredItems.length} of {session.items.length} items
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                    <th className="p-3.5">Product & SKU</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">System Book Qty</th>
                    <th className="p-3.5 text-center">Physical Count</th>
                    <th className="p-3.5 text-right">Variance Qty</th>
                    <th className="p-3.5 text-right">Cost Value</th>
                    <th className="p-3.5">Variance Reason / Audit Note</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-sans">
                  {filteredItems.map((item, idx) => {
                    const isReconciled = session.status === 'reconciled';
                    const isUncounted = item.physicalCountedQty === null;

                    return (
                      <tr
                        key={item.productId}
                        className={`transition-colors ${
                          item.status === 'deficit'
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : item.status === 'surplus'
                            ? 'bg-blue-50/40 hover:bg-blue-50/70'
                            : item.status === 'matched'
                            ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Index */}
                        <td className="p-3.5 text-center font-mono text-[11px] text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Product & SKU */}
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{item.productName}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                            <span>SKU: {item.sku}</span>
                            {item.barcode && <span>• Bar: {item.barcode}</span>}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* System Expected Qty */}
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                          {item.systemExpectedQty} {item.unit}
                        </td>

                        {/* Physical Count Input */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {!isReconciled ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = item.physicalCountedQty ?? item.systemExpectedQty;
                                    const next = Math.max(0, current - 1);
                                    updateStocktakeItemCount(session.id, item.productId, next);
                                  }}
                                  className="w-7 h-7 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={item.physicalCountedQty !== null ? item.physicalCountedQty : ''}
                                  placeholder={String(item.systemExpectedQty)}
                                  onChange={e => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    if (val !== null) {
                                      updateStocktakeItemCount(session.id, item.productId, val);
                                    }
                                  }}
                                  className="w-20 px-2 py-1.5 text-center font-mono font-black text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = item.physicalCountedQty ?? 0;
                                    updateStocktakeItemCount(session.id, item.productId, current + 1);
                                  }}
                                  className="w-7 h-7 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-lg font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                              </>
                            ) : (
                              <span className="font-mono font-black text-slate-900">
                                {item.physicalCountedQty ?? item.systemExpectedQty} {item.unit}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Variance Qty */}
                        <td className="p-3.5 text-right font-mono font-black">
                          {isUncounted ? (
                            <span className="text-slate-400 text-[11px] italic">Pending count</span>
                          ) : (
                            <span
                              className={
                                item.varianceQty < 0
                                  ? 'text-rose-600'
                                  : item.varianceQty > 0
                                  ? 'text-blue-600'
                                  : 'text-emerald-600'
                              }
                            >
                              {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Variance Cost Value */}
                        <td className="p-3.5 text-right font-mono font-black">
                          {isUncounted ? (
                            <span className="text-slate-400 text-[11px]">—</span>
                          ) : (
                            <span
                              className={
                                item.varianceValue < 0
                                  ? 'text-rose-600'
                                  : item.varianceValue > 0
                                  ? 'text-blue-600'
                                  : 'text-emerald-600'
                              }
                            >
                              {item.varianceValue < 0 ? '-' : item.varianceValue > 0 ? '+' : ''}KSh{' '}
                              {Math.abs(Math.round(item.varianceValue)).toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Discrepancy Reason & Notes */}
                        <td className="p-3.5 max-w-xs">
                          {item.varianceQty !== 0 && !isUncounted ? (
                            <div className="space-y-1">
                              {!isReconciled ? (
                                <select
                                  value={item.discrepancyReason || 'Normal Measurement Variance'}
                                  onChange={e =>
                                    updateStocktakeItemCount(
                                      session.id,
                                      item.productId,
                                      item.physicalCountedQty ?? item.systemExpectedQty,
                                      item.notes,
                                      e.target.value as StocktakeDiscrepancyReason
                                    )
                                  }
                                  className="w-full text-[11px] font-bold bg-white border border-slate-300 rounded-lg p-1 text-slate-800 focus:ring-1 focus:ring-rose-500 cursor-pointer"
                                >
                                  {DISCREPANCY_REASONS.map(r => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-[11px] font-bold text-slate-800">
                                  {item.discrepancyReason || 'Normal Measurement Variance'}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-[10px] text-slate-500 italic">{item.notes}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              item.status === 'matched'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'deficit'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.status === 'surplus'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Create New Stocktake Session */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Initiate New Monthly Stocktake Session
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700">Stocktake Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., August 2026 Monthly Physical Stock Audit"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Audit Period (Month)</label>
                  <input
                    type="month"
                    required
                    value={newPeriod}
                    onChange={e => setNewPeriod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Audit Location / Branch</label>
                  <select
                    value={newLocationId}
                    onChange={e => setNewLocationId(e.target.value as LocationId | 'all')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="sales_shop">Sales Shop (Retail Floor)</option>
                    <option value="main_store">Main Store (Central Warehouse)</option>
                    <option value="store_1">Store 1 (Nairobi CBD)</option>
                    <option value="store_2">Store 2 (Industrial Area)</option>
                    <option value="all">All Locations (Consolidated Multi-Store)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Category Scope</label>
                  <select
                    value={newCategoryFilter}
                    onChange={e => setNewCategoryFilter(e.target.value as CategoryType | 'all')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All Inventory Categories</option>
                    <option value="Dereck">Dereec (Dereck) Only</option>
                    <option value="Fleece">Fleeces Only</option>
                    <option value="Yarns">Yarns & Thread Cones Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Auditor / Conducted By</label>
                  <input
                    type="text"
                    required
                    value={newAuditorName}
                    onChange={e => setNewAuditorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700">Audit Scope & Objective Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g., Monthly end-of-month stock count for balance sheet reconciliation and scrap deduction."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <strong>System Snapshot Note:</strong>
                <p>
                  Creating this session will snapshot all system inventory book levels for the selected location. Count numbers can be entered progressively during the count.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Generate Stocktake Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Finalize & Reconcile */}
      {isFinalizeModalOpen && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Finalize & Apply Inventory Reconciliation
                </h3>
              </div>
              <button
                onClick={() => setIsFinalizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-sans">
              <p className="font-bold text-slate-900">
                You are about to finalize stock count session{' '}
                <strong className="text-rose-600 font-mono">{session.sessionNumber}</strong>.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Counted Items:</span>
                  <span className="font-black text-slate-900">
                    {session.countedItems} / {session.totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Deficits / Shrinkage:</span>
                  <span className="font-black text-rose-600">
                    -KSh {Math.round(session.totalShrinkageValue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Surplus / Gains:</span>
                  <span className="font-black text-blue-600">
                    +KSh {Math.round(session.totalSurplusValue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                  <span>Net Variance:</span>
                  <span className="text-sm font-black text-slate-900">
                    {session.netVarianceCostValue < 0 ? '-' : '+'}KSh{' '}
                    {Math.abs(Math.round(session.netVarianceCostValue)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 text-xs space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={autoPostJournal}
                    onChange={e => setAutoPostJournal(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5"
                  />
                  <span>
                    Automatically post double-entry General Ledger journal for variance (Debit Shrinkage Expense / Credit Finished Goods Inventory).
                  </span>
                </label>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Irreversible Action:</strong> Finalizing will update current live product balances in the catalog and lock this session against further modifications for statutory audit trail compliance.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isFinalizing}
                onClick={handleFinalize}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isFinalizing ? 'Reconciling...' : 'Confirm & Apply Reconciliation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Session */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3 border border-rose-100">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Delete Stocktake Session?</span>
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete session <strong>{sessionToDelete.sessionNumber}</strong>? All entered physical counts for this draft will be removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStocktakeSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-black bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
