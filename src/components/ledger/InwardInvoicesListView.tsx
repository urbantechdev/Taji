import React, { useState, useMemo } from 'react';
import {
  FileText,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Globe2,
  Truck,
  Layers,
  Search,
  Filter,
  Calculator,
  Eye,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Boxes,
  ShieldCheck,
  Lock,
  DollarSign,
  Receipt,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { InwardInvoiceRecord, CategoryType } from '../../types';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface InwardInvoicesListViewProps {
  onNewInvoice: () => void;
  onEditInvoice: (invoice: InwardInvoiceRecord) => void;
  onOpenCostingSuite?: (invoice: InwardInvoiceRecord) => void;
  onOpenInventoryIntake?: (invoiceId: string, category?: string) => void;
}

export const InwardInvoicesListView: React.FC<InwardInvoicesListViewProps> = ({
  onNewInvoice,
  onEditInvoice,
  onOpenCostingSuite,
  onOpenInventoryIntake
}) => {
  const {
    inwardInvoices,
    deleteInwardInvoice,
    locations,
    suppliers
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'import' | 'local'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'pending_clearance' | 'assessed' | 'capitalized'>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    return inwardInvoices.filter(inv => {
      // Channel filter
      if (selectedChannel !== 'all' && inv.supplyType !== selectedChannel) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) {
        return false;
      }
      // Store filter
      if (selectedStore !== 'all' && inv.destinationLocation !== selectedStore) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesSupplier = inv.supplierName?.toLowerCase().includes(q);
        const matchesRef = inv.customsOrEtimsRef?.toLowerCase().includes(q);
        const matchesEslip = inv.kraEslipRef?.toLowerCase().includes(q);
        const matchesCountry = inv.supplierCountry?.toLowerCase().includes(q);
        const matchesItems = inv.lineItems?.some(li =>
          li.name.toLowerCase().includes(q) ||
          li.category.toLowerCase().includes(q) ||
          li.sku?.toLowerCase().includes(q) ||
          li.dyeLot?.toLowerCase().includes(q)
        );
        return matchesNumber || matchesSupplier || matchesRef || matchesEslip || matchesCountry || matchesItems;
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [inwardInvoices, selectedChannel, selectedStatus, selectedStore, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = inwardInvoices.length;
    const importCount = inwardInvoices.filter(i => i.supplyType === 'import').length;
    const localCount = inwardInvoices.filter(i => i.supplyType === 'local').length;
    
    const capitalizedCount = inwardInvoices.filter(i => i.status === 'capitalized').length;
    const capitalizedValKES = inwardInvoices
      .filter(i => i.status === 'capitalized')
      .reduce((sum, i) => sum + (Number(i.totalAmountKES) || 0), 0);

    const pendingCount = inwardInvoices.filter(i => i.status === 'pending_clearance' || i.status === 'assessed').length;
    const pendingValKES = inwardInvoices
      .filter(i => i.status === 'pending_clearance' || i.status === 'assessed')
      .reduce((sum, i) => sum + (Number(i.totalAmountKES) || 0), 0);

    const draftCount = inwardInvoices.filter(i => i.status === 'draft').length;
    const totalValKES = inwardInvoices.reduce((sum, i) => sum + (Number(i.totalAmountKES) || 0), 0);

    return {
      totalCount,
      importCount,
      localCount,
      capitalizedCount,
      capitalizedValKES,
      pendingCount,
      pendingValKES,
      draftCount,
      totalValKES
    };
  }, [inwardInvoices]);

  const handleDelete = async (invoiceId: string, invoiceNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    try {
      await deleteInwardInvoice(invoiceId);
      setDeleteConfirmId(null);
      showToast(`Invoice "${invoiceNumber}" removed successfully.`);
    } catch (err) {
      console.error('Delete invoice error:', err);
    }
  };

  const getStatusBadge = (status: InwardInvoiceRecord['status']) => {
    switch (status) {
      case 'capitalized':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Capitalized &amp; In Stock</span>
          </span>
        );
      case 'assessed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Assessed &amp; Computed</span>
          </span>
        );
      case 'pending_clearance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Pending Customs Clearance</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Draft / In-Progress</span>
          </span>
        );
    }
  };

  const getLocationName = (locId: string) => {
    const loc = locations.find(l => l.id === locId);
    return loc ? loc.name : locId;
  };

  return (
    <div className="space-y-6" id="inward-invoices-management-module">
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          id="toast-inward-invoices-notice"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/50 animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Inward Commercial Invoices &amp; Consignments
                </h2>
                <p className="text-xs text-slate-500">
                  Centralized registry of import declarations (SAD) and Kenyan local purchases (LPS). Click any invoice to inspect or edit details.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="btn-new-inward-invoice-cta"
              type="button"
              onClick={() => {
                playClickSound();
                onNewInvoice();
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Inward Invoice</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div
            id="metric-total-invoices"
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Consignments</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">{metrics.totalCount}</span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({metrics.importCount} Import • {metrics.localCount} Local)
              </span>
            </div>
          </div>

          <div
            id="metric-capitalized-invoices"
            className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Capitalized &amp; In Stock</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-800">{metrics.capitalizedCount}</span>
              <span className="text-[11px] text-emerald-700 font-bold">
                KSh {Math.round(metrics.capitalizedValKES / 1000).toLocaleString()}k
              </span>
            </div>
          </div>

          <div
            id="metric-pending-invoices"
            className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/80 hover:bg-sky-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">Under Customs &amp; Costing</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-sky-800">{metrics.pendingCount}</span>
              <span className="text-[11px] text-sky-700 font-bold">
                KSh {Math.round(metrics.pendingValKES / 1000).toLocaleString()}k
              </span>
            </div>
          </div>

          <div
            id="metric-total-value"
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Value (KES)</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">
                KSh {Math.round(metrics.totalValKES).toLocaleString()}
              </span>
              {metrics.draftCount > 0 && (
                <span className="text-[10.5px] text-amber-700 font-bold">
                  ({metrics.draftCount} Drafts)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-inward-invoices"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, supplier name, customs SAD, dye lot, or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Layout Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-medium">Layout:</span>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              <button
                type="button"
                id="btn-toggle-layout-table"
                onClick={() => setViewLayout('table')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                id="btn-toggle-layout-cards"
                onClick={() => setViewLayout('cards')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards View
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1">
            <button
              id="filter-channel-all"
              type="button"
              onClick={() => setSelectedChannel('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedChannel === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Channels
            </button>
            <button
              id="filter-channel-import"
              type="button"
              onClick={() => setSelectedChannel('import')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                selectedChannel === 'import'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>Import Shipments</span>
            </button>
            <button
              id="filter-channel-local"
              type="button"
              onClick={() => setSelectedChannel('local')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                selectedChannel === 'local'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>Kenyan Local (LPS)</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Status Filters */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              id="filter-status-all"
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Statuses
            </button>
            <button
              id="filter-status-draft"
              type="button"
              onClick={() => setSelectedStatus('draft')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === 'draft'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              Drafts ({metrics.draftCount})
            </button>
            <button
              id="filter-status-pending"
              type="button"
              onClick={() => setSelectedStatus('pending_clearance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === 'pending_clearance'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/60'
              }`}
            >
              Pending Clearance
            </button>
            <button
              id="filter-status-capitalized"
              type="button"
              onClick={() => setSelectedStatus('capitalized')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === 'capitalized'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Capitalized ({metrics.capitalizedCount})
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Store Location Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500 font-medium">Store:</span>
            <select
              id="select-filter-destination-store"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Destination Stores</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table vs Cards */}
      {filteredInvoices.length === 0 ? (
        <div
          id="empty-inward-invoices-state"
          className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Inward Invoices Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedStore !== 'all'
                ? 'No invoices match the specified search or filter criteria. Try adjusting filters or search query.'
                : 'No inward invoices have been recorded yet. Click below to draft and persist your first commercial consignment.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedStore !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChannel('all');
                  setSelectedStatus('all');
                  setSelectedStore('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onNewInvoice();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Inward Invoice</span>
            </button>
          </div>
        </div>
      ) : viewLayout === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-800 font-bold">{filteredInvoices.length}</strong> invoice records (Click any row to resume editing)
            </span>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Synchronized
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice # &amp; Channel</th>
                  <th className="py-3 px-4">Supplier &amp; Origin</th>
                  <th className="py-3 px-4">Customs / eTIMS Ref</th>
                  <th className="py-3 px-4">Destination Store</th>
                  <th className="py-3 px-4">Consignment Items</th>
                  <th className="py-3 px-4 text-right">Invoice Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const isImport = inv.supplyType === 'import';

                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        id={`invoice-row-${inv.id}`}
                        onClick={() => {
                          playClickSound();
                          onEditInvoice(inv);
                        }}
                        className="hover:bg-rose-50/40 cursor-pointer transition-colors group"
                        title="Click to open, review, or resume editing this invoice"
                      >
                        {/* Invoice # & Channel */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isImport ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isImport ? <Globe2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
                                <span>{inv.invoiceNumber}</span>
                                <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Supplier & Country */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 line-clamp-1 max-w-[200px]" title={inv.supplierName}>
                            {inv.supplierName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>{inv.supplierCountry || (isImport ? 'Overseas' : 'Kenya')}</span>
                            {inv.supplierPin && <span>• PIN: {inv.supplierPin}</span>}
                          </div>
                        </td>

                        {/* Customs SAD / eTIMS */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] font-bold text-slate-800">
                            {inv.customsOrEtimsRef || 'N/A'}
                          </div>
                          {inv.kraEslipRef && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              E-Slip: {inv.kraEslipRef}
                            </div>
                          )}
                        </td>

                        {/* Destination Store */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{getLocationName(inv.destinationLocation)}</span>
                          </div>
                        </td>

                        {/* Consignment Items */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {inv.lineItems?.length || 0} Line {inv.lineItems?.length === 1 ? 'Item' : 'Items'}
                          </div>
                          <div className="text-[10.5px] text-slate-500">
                            {Number(inv.totalQuantity || 0).toLocaleString()} {inv.totalQuantityUnit || 'kg'}
                            {inv.totalRollsOrPackages ? ` • ${inv.totalRollsOrPackages} pkgs/rolls` : ''}
                          </div>
                        </td>

                        {/* Total Value */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-extrabold text-slate-900 text-[12.5px]">
                            KSh {Math.round(inv.totalAmountKES || 0).toLocaleString()}
                          </div>
                          {isImport && inv.totalAmountUSD ? (
                            <div className="text-[10.5px] text-sky-700 font-semibold font-mono">
                              ${Number(inv.totalAmountUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          ) : null}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(inv.status)}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              id={`btn-edit-invoice-${inv.id}`}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                onEditInvoice(inv);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit invoice header, line items, and landed costs"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {onOpenCostingSuite && (
                              <button
                                id={`btn-costing-invoice-${inv.id}`}
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  onOpenCostingSuite(inv);
                                }}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Open Landed Costing & Tax Suite"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenInventoryIntake && (
                              <button
                                id={`btn-inventory-invoice-${inv.id}`}
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  onOpenInventoryIntake(inv.invoiceNumber);
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                title="Update Inventory Batch"
                              >
                                <Boxes className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Button (with confirmation) */}
                            {deleteConfirmId === inv.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(inv.id, inv.invoiceNumber, e)}
                                  className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded-md hover:bg-red-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-md hover:bg-slate-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`btn-delete-invoice-${inv.id}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(inv.id);
                                }}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete invoice record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Accordion expand toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedInvoiceId(isExpanded ? null : inv.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Preview line items"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Items Preview Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-emerald-600" />
                                  <span>Consignment Line Items Breakdown ({inv.lineItems?.length || 0} items)</span>
                                </h4>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  Exchange Rate: 1 USD = {inv.exchangeRate} KES
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase">
                                      <th className="py-2 px-3">Item Description</th>
                                      <th className="py-2 px-3">Category</th>
                                      <th className="py-2 px-3">Color / Shade</th>
                                      <th className="py-2 px-3">Quantity</th>
                                      <th className="py-2 px-3">FOB / Unit Price</th>
                                      <th className="py-2 px-3 text-right">Total Price</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-[11px]">
                                    {inv.lineItems?.map((li, liIdx) => (
                                      <tr key={li.id || liIdx} className="hover:bg-slate-50/60">
                                        <td className="py-2 px-3 font-semibold text-slate-800">
                                          <div>{li.name}</div>
                                          {li.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {li.sku}</div>}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[10px]">
                                            {li.category}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-1.5">
                                            {li.colorHex && (
                                              <span
                                                className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                                style={{ backgroundColor: li.colorHex }}
                                              />
                                            )}
                                            <span className="text-slate-700">{li.colorName || 'N/A'}</span>
                                            {li.dyeLot && (
                                              <span className="text-[10px] text-slate-400 font-mono">({li.dyeLot})</span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 font-medium text-slate-800">
                                          {Number(li.quantity).toLocaleString()} {li.unit}
                                          {li.rollsCount ? ` (${li.rollsCount} rolls)` : ''}
                                        </td>
                                        <td className="py-2 px-3 font-mono">
                                          {isImport && li.unitPriceUSD ? (
                                            <span>${li.unitPriceUSD.toFixed(2)}/unit</span>
                                          ) : (
                                            <span>KSh {li.unitPriceKES || 0}/unit</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                                          KSh {Math.round(
                                            li.totalPriceKES ||
                                            ((li.unitPriceKES || (li.unitPriceUSD ? li.unitPriceUSD * inv.exchangeRate : 0)) * li.quantity)
                                          ).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-4">
                                  <span>Freight: ${inv.totalFreightUSD || 0}</span>
                                  <span>Insurance: ${inv.totalInsuranceUSD || 0}</span>
                                  <span>Port Clearance: KSh {(inv.portClearingFeesKES || 0).toLocaleString()}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClickSound();
                                    onEditInvoice(inv);
                                  }}
                                  className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open in Edit Mode</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="inward-invoices-cards-grid">
          {filteredInvoices.map((inv) => {
            const isImport = inv.supplyType === 'import';

            return (
              <div
                key={inv.id}
                id={`invoice-card-${inv.id}`}
                onClick={() => {
                  playClickSound();
                  onEditInvoice(inv);
                }}
                className="bg-white border border-slate-200 hover:border-rose-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isImport ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isImport ? <Globe2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase">
                            ({inv.supplyType})
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(inv.status)}
                    </div>
                  </div>

                  {/* Supplier & Ref */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Supplier:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[170px]" title={inv.supplierName}>
                        {inv.supplierName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Customs/Ref:</span>
                      <span className="font-mono font-semibold text-slate-700">{inv.customsOrEtimsRef || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Store Lock:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>{getLocationName(inv.destinationLocation)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Line Items Summary */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Items Breakdown ({inv.lineItems?.length || 0})</span>
                      <span className="text-slate-500 font-normal">
                        {Number(inv.totalQuantity || 0).toLocaleString()} {inv.totalQuantityUnit || 'kg'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {inv.lineItems?.slice(0, 3).map((li, idx) => (
                        <span
                          key={li.id || idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10.5px] font-medium truncate max-w-[180px]"
                        >
                          {li.name}
                        </span>
                      ))}
                      {(inv.lineItems?.length || 0) > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10.5px] font-bold">
                          +{(inv.lineItems?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Value & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Value</div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      KSh {Math.round(inv.totalAmountKES || 0).toLocaleString()}
                    </div>
                    {isImport && inv.totalAmountUSD ? (
                      <div className="text-[10px] text-sky-700 font-semibold font-mono">
                        ${Number(inv.totalAmountUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`card-btn-edit-${inv.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        onEditInvoice(inv);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
