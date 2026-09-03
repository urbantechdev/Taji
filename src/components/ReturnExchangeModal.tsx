import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Package,
  Building2,
  Trash2,
  Printer,
  Download,
  Search,
  Scale,
  DollarSign,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Layers,
  Clock,
  User,
  Phone,
  Tag,
  Filter,
  CheckSquare,
  Square,
  ArrowUpRight,
  FileSpreadsheet,
  Info,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  DefectReasonType,
  ReturnResolutionType,
  ReturnExchangePayload,
  QuarantinedDefectRecord,
  ETIMSCreditNote,
  LocationId,
  CategoryType
} from '../types';
import {
  exportRmaReturnVoucherPDF,
  exportSupplierClaimNotePDF,
  exportCreditNoteDirectPDF,
  exportRmaAuditScheduleCSV,
  formatCurrency
} from '../utils/documentExport';

export const ReturnExchangeModal: React.FC = () => {
  const {
    isReturnExchangeModalOpen,
    setIsReturnExchangeModalOpen,
    products,
    locations,
    activeLocation,
    orders,
    currentUser,
    etrConfig,
    quarantinedDefects,
    creditNotes,
    brandSettings,
    processReturnAndExchange,
    fileSupplierDefectClaim,
    resolveQuarantineRecord,
    deleteQuarantineRecord
  } = useERP();

  const [activeTab, setActiveTab] = useState<'new_rma' | 'quarantine_list' | 'credit_notes' | 'ledger_guide'>('new_rma');

  // ----------------------------------------------------
  // Form State: New Return & Exchange
  // ----------------------------------------------------
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Retail Garment Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('+254 7');
  const [locationId, setLocationId] = useState<LocationId>(activeLocation);

  // Returned item
  const [returnedBatchId, setReturnedBatchId] = useState<string>(products[0]?.id || '');
  const [returnedRollNumber, setReturnedRollNumber] = useState<string>('');
  const [returnedConesCount, setReturnedConesCount] = useState<number>(2);
  const [returnedGrossWeightKg, setReturnedGrossWeightKg] = useState<number>(4.140);
  const [returnedTareKg, setReturnedTareKg] = useState<number>(0.140);
  const [returnedRatePerKg, setReturnedRatePerKg] = useState<number>(750);
  const [defectReason, setDefectReason] = useState<DefectReasonType>('Broken / Snagged Yarn Ply');
  const [defectNotes, setDefectNotes] = useState<string>('2 cones found with filament breakage and irregular twist within bale.');
  const [supplierName, setSupplierName] = useState<string>('UDEY UDYOG UNIT OF OSTER INDIA PVT LTD');

  // Resolution type
  const [resolutionType, setResolutionType] = useState<ReturnResolutionType>('exchange_replacement');

  // Replacement item (for exchange)
  const [replacementBatchId, setReplacementBatchId] = useState<string>(products[0]?.id || '');
  const [replacementRollNumber, setReplacementRollNumber] = useState<string>('');
  const [replacementConesCount, setReplacementConesCount] = useState<number>(2);
  const [replacementNetWeightKg, setReplacementNetWeightKg] = useState<number>(4.000);
  const [replacementRatePerKg, setReplacementRatePerKg] = useState<number>(750);

  // Refund details
  const [refundChannel, setRefundChannel] = useState<'Bank Account' | 'M-Pesa B2C' | 'Cash Drawer' | 'Store Credit Note'>('Bank Account');
  const [refundReference, setRefundReference] = useState<string>('');

  // ----------------------------------------------------
  // Quarantine List Filter & Selection State
  // ----------------------------------------------------
  const [quarantineSearch, setQuarantineSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'quarantined' | 'supplier_claim_filed' | 'supplier_compensated' | 'written_off_scrap'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Yarns' | 'Fleece' | 'Dereck'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedQuarantineIds, setSelectedQuarantineIds] = useState<string[]>([]);

  // ----------------------------------------------------
  // Modals & Action Dialogs
  // ----------------------------------------------------
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimSupplierName, setClaimSupplierName] = useState<string>('UDEY UDYOG UNIT OF OSTER INDIA PVT LTD');
  const [claimNotes, setClaimNotes] = useState<string>('Batch defect claim: Spoilt yarn cones collected from customer bale inspection.');
  const [autoExportClaimPdf, setAutoExportClaimPdf] = useState(true);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockLocation, setRestockLocation] = useState<LocationId>(activeLocation);
  const [restockBatchId, setRestockBatchId] = useState<string>(products[0]?.id || '');
  const [restockQty, setRestockQty] = useState<number>(4.0);
  const [restockNotes, setRestockNotes] = useState<string>('Manufacturer replacement delivered and inspected.');

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<QuarantinedDefectRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<QuarantinedDefectRecord | null>(null);

  // Feedback Notification
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    rmaId?: string;
    createdRma?: QuarantinedDefectRecord;
  } | null>(null);

  // Credit note search state
  const [creditNoteSearch, setCreditNoteSearch] = useState<string>('');

  // Selected returned product
  const returnedProduct = products.find(p => p.id === returnedBatchId);
  const replacementProduct = products.find(p => p.id === replacementBatchId) || returnedProduct;
  const isFabric = returnedProduct?.category === 'Fleece' || returnedProduct?.category === 'Dereck' || returnedProduct?.unit === 'meter';
  const isReplacementFabric = replacementProduct?.category === 'Fleece' || replacementProduct?.category === 'Dereck' || replacementProduct?.unit === 'meter';

  // Auto-calculated weights & valuations
  const returnedNetWeightKg = isFabric
    ? Number(returnedGrossWeightKg.toFixed(2))
    : Math.max(0, Number((returnedGrossWeightKg - returnedTareKg).toFixed(3)));
  const returnedValuationRetail = Number((returnedNetWeightKg * returnedRatePerKg).toFixed(2));
  const returnedValuationCost = Number((returnedNetWeightKg * (returnedProduct?.costPrice || returnedRatePerKg * 0.6)).toFixed(2));

  const replacementValuationRetail = Number((replacementNetWeightKg * replacementRatePerKg).toFixed(2));
  const priceDifference = Number((replacementValuationRetail - returnedValuationRetail).toFixed(2));

  // Handler when selecting an existing order
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      setReceiptNumber(ord.receiptNumber || ord.id);
      setCustomerName(ord.customerName || 'Customer');
      setCustomerPhone(ord.customerPhone || '+254 7');
      if (ord.fulfilledByLocation) {
        setLocationId(ord.fulfilledByLocation as LocationId);
      }
      if (ord.items && ord.items.length > 0) {
        const firstItem = ord.items[0];
        setReturnedBatchId(firstItem.batchId);
        setReturnedRatePerKg(firstItem.unitPrice);
        setReplacementBatchId(firstItem.batchId);
        setReplacementRatePerKg(firstItem.unitPrice);
        const matchedProd = products.find(p => p.id === firstItem.batchId);
        if (matchedProd?.manufacturer) {
          setSupplierName(matchedProd.manufacturer);
        }
      }
    }
  };

  // Auto update tare when cones count changes
  const handleConesCountChange = (count: number) => {
    setReturnedConesCount(count);
    if (!isFabric) {
      const coneTare = returnedProduct?.tareProfile?.tareWeightPerUnit || 0.070;
      const computedTare = Number((count * coneTare).toFixed(3));
      setReturnedTareKg(computedTare);
      setReturnedGrossWeightKg(Number((count * 2.0 + computedTare).toFixed(3)));
      setReplacementConesCount(count);
      setReplacementNetWeightKg(Number((count * 2.0).toFixed(3)));
    }
  };

  // Submit RMA form
  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    const payload: ReturnExchangePayload = {
      orderId: selectedOrderId || undefined,
      receiptNumber: receiptNumber || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      locationId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      returnedBatchId,
      returnedUnit: isFabric ? 'meter' : 'kg',
      returnedConesCount: !isFabric ? returnedConesCount : undefined,
      returnedGrossWeightKg: !isFabric ? returnedGrossWeightKg : undefined,
      returnedTareKg: !isFabric ? returnedTareKg : undefined,
      returnedNetWeightKg: !isFabric ? returnedNetWeightKg : undefined,
      returnedMeters: isFabric ? returnedNetWeightKg : undefined,
      returnedRollNumber: isFabric ? returnedRollNumber : undefined,
      returnedRatePerKg: !isFabric ? returnedRatePerKg : undefined,
      returnedRatePerMeter: isFabric ? returnedRatePerKg : undefined,
      defectReason,
      defectNotes: defectNotes.trim(),
      resolutionType,
      replacementBatchId: resolutionType === 'exchange_replacement' ? replacementBatchId : undefined,
      replacementConesCount: resolutionType === 'exchange_replacement' && !isReplacementFabric ? replacementConesCount : undefined,
      replacementNetWeightKg: resolutionType === 'exchange_replacement' && !isReplacementFabric ? replacementNetWeightKg : undefined,
      replacementMeters: resolutionType === 'exchange_replacement' && isReplacementFabric ? replacementNetWeightKg : undefined,
      replacementRollNumber: resolutionType === 'exchange_replacement' && isReplacementFabric ? replacementRollNumber : undefined,
      replacementRatePerKg: resolutionType === 'exchange_replacement' && !isReplacementFabric ? replacementRatePerKg : undefined,
      replacementRatePerMeter: resolutionType === 'exchange_replacement' && isReplacementFabric ? replacementRatePerKg : undefined,
      refundChannel: resolutionType !== 'exchange_replacement' ? refundChannel : undefined,
      refundReference: refundReference.trim() || undefined,
      supplierName: supplierName.trim()
    };

    const res = processReturnAndExchange(payload);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: res.message,
        rmaId: res.rmaId,
        createdRma: res.exchangeRecord
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: res.message
      });
    }
  };

  // Submit Supplier Claim
  const handleFileClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuarantineIds.length === 0) return;

    const res = fileSupplierDefectClaim(selectedQuarantineIds, claimSupplierName, claimNotes);
    if (res.success) {
      const recordsClaimed = quarantinedDefects.filter(r => selectedQuarantineIds.includes(r.id));
      if (autoExportClaimPdf) {
        exportSupplierClaimNotePDF(
          res.claimRef,
          claimSupplierName,
          claimNotes,
          recordsClaimed,
          etrConfig,
          brandSettings
        );
      }
      setSelectedQuarantineIds([]);
      setIsClaimModalOpen(false);
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  // Submit Restock Replacement
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuarantineIds.length === 0) return;

    const res = resolveQuarantineRecord(
      selectedQuarantineIds,
      'supplier_replaced',
      restockNotes,
      restockBatchId,
      restockQty,
      restockLocation
    );
    if (res.success) {
      setSelectedQuarantineIds([]);
      setIsRestockModalOpen(false);
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  // Resolve as Compensated or Scrap
  const handleDirectResolve = (action: 'supplier_compensated' | 'written_off_scrap') => {
    if (selectedQuarantineIds.length === 0) return;
    const actionLabel = action === 'supplier_compensated' ? 'Supplier Reimbursed' : 'Written-off as Scrap';
    const res = resolveQuarantineRecord(
      selectedQuarantineIds,
      action,
      `Resolved as ${actionLabel} on ${new Date().toLocaleDateString()}`
    );
    if (res.success) {
      setSelectedQuarantineIds([]);
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  // Delete / Void single RMA
  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deleteQuarantineRecord(recordToDelete.id);
    if (res.success) {
      setRecordToDelete(null);
      if (selectedRecordForDetail?.id === recordToDelete.id) {
        setSelectedRecordForDetail(null);
      }
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  // ----------------------------------------------------
  // Filtered Lists
  // ----------------------------------------------------
  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders.slice(0, 15);
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        (o.receiptNumber && o.receiptNumber.toLowerCase().includes(q)) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q))
    ).slice(0, 15);
  }, [orders, orderSearchQuery]);

  const filteredQuarantinedDefects = useMemo(() => {
    return quarantinedDefects.filter(rec => {
      // Search query
      if (quarantineSearch.trim()) {
        const q = quarantineSearch.toLowerCase();
        const matchNumber = rec.rmaNumber.toLowerCase().includes(q);
        const matchCust = rec.customerName.toLowerCase().includes(q);
        const matchProd = rec.returnedItem.productName.toLowerCase().includes(q);
        const matchLot = (rec.returnedItem.dyeLot || '').toLowerCase().includes(q);
        const matchReason = rec.defectReason.toLowerCase().includes(q);
        const matchClaim = (rec.supplierClaimNumber || '').toLowerCase().includes(q);
        if (!matchNumber && !matchCust && !matchProd && !matchLot && !matchReason && !matchClaim) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (rec.quarantineStatus !== statusFilter) return false;
      }
      // Category filter
      if (categoryFilter !== 'all') {
        if (rec.returnedItem.category !== categoryFilter) return false;
      }
      // Location filter
      if (locationFilter !== 'all') {
        if (rec.locationId !== locationFilter) return false;
      }
      return true;
    });
  }, [quarantinedDefects, quarantineSearch, statusFilter, categoryFilter, locationFilter]);

  const filteredCreditNotes = useMemo(() => {
    if (!creditNoteSearch.trim()) return creditNotes;
    const q = creditNoteSearch.toLowerCase();
    return creditNotes.filter(
      crn =>
        crn.id.toLowerCase().includes(q) ||
        crn.originalInvoiceNo.toLowerCase().includes(q) ||
        crn.customerName.toLowerCase().includes(q) ||
        (crn.fiscalSignature && crn.fiscalSignature.toLowerCase().includes(q))
    );
  }, [creditNotes, creditNoteSearch]);

  // Statistics
  const totalQuarantinedCones = quarantinedDefects.reduce((sum, r) => sum + (r.returnedItem.conesCount || 0), 0);
  const totalQuarantinedKg = quarantinedDefects.reduce((sum, r) => sum + (r.returnedItem.netWeightKg || 0), 0);
  const totalQuarantinedMeters = quarantinedDefects.reduce((sum, r) => sum + (r.returnedItem.metersCount || 0), 0);
  const totalCostValuation = quarantinedDefects.reduce((sum, r) => sum + r.returnedItem.totalValuationCost, 0);
  const pendingClaimsCount = quarantinedDefects.filter(r => r.quarantineStatus === 'supplier_claim_filed').length;

  if (!isReturnExchangeModalOpen) return null;

  return (
    <div
      id="return-exchange-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="return-exchange-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col h-[94vh] max-h-[920px]"
      >
        {/* TOP BAR */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight text-white truncate">
                  RMA Return, Exchange & Quarantine Hub
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Full ERP Workflow
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Defective yarn cone isolation, 1:1 exchanges, eTIMS credit notes &amp; manufacturer debit claims
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportRmaAuditScheduleCSV(quarantinedDefects, locations)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Download Complete RMA CSV Schedule"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              id="close-return-exchange-modal-btn"
              onClick={() => setIsReturnExchangeModalOpen(false)}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              id="tab-new-rma-btn"
              onClick={() => {
                setActiveTab('new_rma');
                setActionFeedback(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'new_rma'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>1. New Return & Exchange (RMA)</span>
            </button>

            <button
              id="tab-quarantine-btn"
              onClick={() => {
                setActiveTab('quarantine_list');
                setActionFeedback(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'quarantine_list'
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>2. Quarantined Stock &amp; Supplier Claims</span>
              <span className="ml-1 px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded-full text-[10px] font-bold">
                {quarantinedDefects.length}
              </span>
            </button>

            <button
              id="tab-credit-notes-btn"
              onClick={() => {
                setActiveTab('credit_notes');
                setActionFeedback(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'credit_notes'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>3. KRA eTIMS Credit Notes</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-bold">
                {creditNotes.length}
              </span>
            </button>

            <button
              id="tab-ledger-guide-btn"
              onClick={() => {
                setActiveTab('ledger_guide');
                setActionFeedback(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'ledger_guide'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-200" />
              <span>4. Accounting &amp; Ledger Guide</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION FEEDBACK BANNER */}
        {actionFeedback && (
          <div
            className={`mx-5 mt-3 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shrink-0 animate-in slide-in-from-top-2 duration-150 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>

            <div className="flex items-center space-x-2">
              {actionFeedback.createdRma && (
                <button
                  type="button"
                  onClick={() =>
                    exportRmaReturnVoucherPDF(
                      actionFeedback.createdRma!,
                      locations,
                      etrConfig,
                      brandSettings
                    )
                  }
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Voucher PDF</span>
                </button>
              )}
              <button
                onClick={() => setActionFeedback(null)}
                className="text-slate-400 hover:text-slate-700 font-bold px-1.5 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
          {/* ---------------------------------------------------- */}
          {/* TAB 1: NEW RMA WIZARD */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'new_rma' && (
            <form onSubmit={handleProcessSubmit} className="space-y-5 max-w-5xl mx-auto">
              {/* STEP 1: CUSTOMER & ORIGINAL ORDER */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Customer &amp; Original Bale Sale Reference
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Branch: <strong className="text-slate-800">{locations.find(l => l.id === locationId)?.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link Existing Invoice / Order
                    </label>
                    <select
                      id="rma-order-select"
                      value={selectedOrderId}
                      onChange={e => handleSelectOrder(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    >
                      <option value="">-- Select from Past Orders (Optional) --</option>
                      {filteredOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.receiptNumber || o.id} • {o.customerName} ({formatCurrency(o.grandTotal)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Original Receipt / ETR No.
                    </label>
                    <input
                      type="text"
                      id="rma-receipt-input"
                      value={receiptNumber}
                      onChange={e => setReceiptNumber(e.target.value)}
                      placeholder="e.g. ETR-2026-9901"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Processing Store Branch
                    </label>
                    <select
                      id="rma-location-select"
                      value={locationId}
                      onChange={e => setLocationId(e.target.value as LocationId)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer / Garment Business Name *
                    </label>
                    <input
                      type="text"
                      id="rma-customer-name-input"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      id="rma-customer-phone-input"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Original Payment Method
                    </label>
                    <select
                      id="rma-refund-channel-select"
                      value={refundChannel}
                      onChange={e => setRefundChannel(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                    >
                      <option value="Bank Account">Bank Transfer (Direct Deposit)</option>
                      <option value="M-Pesa B2C">M-Pesa Till / Paybill</option>
                      <option value="Cash Drawer">Cash at Till</option>
                      <option value="Store Credit Note">Store Credit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 2: RETURNED DEFECTIVE PRODUCT */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isFabric
                        ? 'Returned Defective Fabric Meters & Quality Assessment'
                        : 'Returned Spoilt Yarn Cones & Tare Deduction Intake'}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                    {isFabric ? 'Fabric Quarantine Intake' : 'High-Bulk Yarn Quarantine Intake'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select {isFabric ? 'Fabric' : 'Yarn'} Product Batch
                    </label>
                    <select
                      id="rma-returned-batch-select"
                      value={returnedBatchId}
                      onChange={e => {
                        setReturnedBatchId(e.target.value);
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod) {
                          setReturnedRatePerKg(prod.unitPriceRetail);
                          setSupplierName(prod.manufacturer || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD');
                          if (prod.category === 'Fleece' || prod.category === 'Dereck' || prod.unit === 'meter') {
                            setDefectReason('Weft / Warp Slub & Weaving Flaw');
                          }
                        }
                      }}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category}) • KSh {p.unitPriceRetail}/{p.unit === 'meter' ? 'm' : 'kg'} (Stock: {p.locationStock[locationId]?.toFixed(2) || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {isFabric && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number / Identification
                      </label>
                      <input
                        type="text"
                        id="rma-returned-roll-input"
                        placeholder="e.g. Roll #14"
                        value={returnedRollNumber}
                        onChange={e => setReturnedRollNumber(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isFabric ? 'Defective Cut Length (Meters)' : 'Number of Spoilt Cones'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        id="rma-cones-count-input"
                        step={isFabric ? "0.1" : "1"}
                        min={isFabric ? "0.1" : "1"}
                        max="500"
                        value={isFabric ? returnedGrossWeightKg : returnedConesCount}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 1;
                          if (isFabric) {
                            setReturnedGrossWeightKg(val);
                            setReturnedTareKg(0);
                            setReplacementNetWeightKg(val);
                          } else {
                            handleConesCountChange(Math.round(val));
                          }
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-bold"
                      />
                      <span className="text-xs text-slate-500 font-semibold">{isFabric ? 'Meters' : 'Cones'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Rate (KSh / {isFabric ? 'm' : 'kg'})
                    </label>
                    <input
                      type="number"
                      id="rma-rate-input"
                      value={returnedRatePerKg}
                      onChange={e => setReturnedRatePerKg(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-bold"
                    />
                  </div>

                  {!isFabric && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Scale Gross Weight (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          id="rma-gross-weight-input"
                          value={returnedGrossWeightKg}
                          onChange={e => setReturnedGrossWeightKg(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-bold text-amber-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tare Plastic Cone Deduction (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          id="rma-tare-input"
                          value={returnedTareKg}
                          onChange={e => setReturnedTareKg(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isFabric ? 'Net Defect Length (Auto)' : 'Net Billable Weight (Auto)'}
                    </label>
                    <div className="w-full text-xs bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 font-bold text-emerald-900 flex items-center justify-between">
                      <span>{returnedNetWeightKg.toFixed(isFabric ? 2 : 3)} {isFabric ? 'meters' : 'kg'}</span>
                      <span className="text-[10px] text-emerald-700 font-normal">{isFabric ? 'Linear Fabric' : 'Pure Yarn'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Returned Valuation (Auto)
                    </label>
                    <div className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 flex items-center justify-between">
                      <span>{formatCurrency(returnedValuationRetail)}</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cost: {formatCurrency(returnedValuationCost)}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Defect Reason Classification *
                    </label>
                    <select
                      id="rma-defect-reason-select"
                      value={defectReason}
                      onChange={e => setDefectReason(e.target.value as DefectReasonType)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                    >
                      {isFabric ? (
                        <>
                          <option value="Weft / Warp Slub & Weaving Flaw">Weft / Warp Slub &amp; Weaving Flaw</option>
                          <option value="Oil / Machine Grease Stain on Fabric">Oil / Machine Grease Stain on Fabric</option>
                          <option value="Fabric Hole / Run / Tear">Fabric Hole / Run / Tear</option>
                          <option value="Color Shading / Dye Streaks across Width">Color Shading / Dye Streaks across Width</option>
                          <option value="Selvage Edge Damage / Curling">Selvage Edge Damage / Curling</option>
                          <option value="Uneven Width / Short Meterage on Roll">Uneven Width / Short Meterage on Roll</option>
                          <option value="Pilling / Uneven Fleece Pile">Pilling / Uneven Fleece Pile</option>
                          <option value="Other Defect">Other Defect</option>
                        </>
                      ) : (
                        <>
                          <option value="Broken / Snagged Yarn Ply">Broken / Snagged Yarn Ply</option>
                          <option value="Dye Lot Color Variation / Bleed">Dye Lot Color Variation / Bleed</option>
                          <option value="Oil / Grease Stain from Factory Machine">Oil / Grease Stain from Factory Machine</option>
                          <option value="Weak Tensile Strength / High Breakage">Weak Tensile Strength / High Breakage</option>
                          <option value="Mold / Moisture Damage">Mold / Moisture Damage</option>
                          <option value="Uneven Weight / Hollow Cone Core">Uneven Weight / Hollow Cone Core</option>
                          <option value="Knots & Splicing Defect">Knots &amp; Splicing Defect</option>
                          <option value="Other Defect">Other Defect</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Manufacturer / Mill Supplier
                    </label>
                    <input
                      type="text"
                      id="rma-supplier-input"
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inspection Notes &amp; Quality Observations
                    </label>
                    <input
                      type="text"
                      id="rma-notes-input"
                      value={defectNotes}
                      onChange={e => setDefectNotes(e.target.value)}
                      placeholder={
                        isFabric
                          ? "e.g. 3.5m has severe weaving slubs and grease spot midway through roll"
                          : "e.g. 2 cones had filament breakage and irregular twist within bale #148"
                      }
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: RESOLUTION METHOD */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Resolution Method &amp; Settlement
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    How is the customer compensated?
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionType('exchange_replacement')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      resolutionType === 'exchange_replacement'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <ArrowRightLeft className={`w-5 h-5 ${resolutionType === 'exchange_replacement' ? 'text-emerald-600' : 'text-slate-500'}`} />
                        {resolutionType === 'exchange_replacement' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">1. Exchange Replacement</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Hand over good cones/meters from active stock. Quarantines defective goods without affecting bank deposit.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded w-fit">
                      Most Common (Zero Cash Loss)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('bank_refund')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      resolutionType === 'bank_refund' || resolutionType === 'mpesa_refund' || resolutionType === 'cash_refund'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Banknote className={`w-5 h-5 ${resolutionType.includes('refund') ? 'text-blue-600' : 'text-slate-500'}`} />
                        {resolutionType.includes('refund') && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">2. Financial Refund</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Reverse sales revenue, refund cash/bank/M-Pesa, and auto-issue official KRA eTIMS Credit Note.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded w-fit">
                      eTIMS Credit Note
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('store_credit')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      resolutionType === 'store_credit'
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Tag className={`w-5 h-5 ${resolutionType === 'store_credit' ? 'text-purple-600' : 'text-slate-500'}`} />
                        {resolutionType === 'store_credit' && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">3. Store Credit Voucher</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Issue a digital store voucher credit usable on future yarn bale or fabric purchases.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded w-fit">
                      Customer Ledger Credit
                    </span>
                  </button>
                </div>

                {/* Sub-form: Exchange Details */}
                {resolutionType === 'exchange_replacement' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>Replacement Item Configuration (Dispatched from Active Stock)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Replacement Product / Batch
                        </label>
                        <select
                          id="rma-replacement-batch-select"
                          value={replacementBatchId}
                          onChange={e => {
                            setReplacementBatchId(e.target.value);
                            const prod = products.find(p => p.id === e.target.value);
                            if (prod) setReplacementRatePerKg(prod.unitPriceRetail);
                          }}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.locationStock[locationId]?.toFixed(2) || 0} {p.unit === 'meter' ? 'm' : 'kg'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {isReplacementFabric && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Replacement Roll #
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Roll #19"
                            value={replacementRollNumber}
                            onChange={e => setReplacementRollNumber(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none"
                          />
                        </div>
                      )}

                      {!isReplacementFabric && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Replacement Cones
                          </label>
                          <input
                            type="number"
                            id="rma-replacement-cones-input"
                            value={replacementConesCount}
                            onChange={e => setReplacementConesCount(parseInt(e.target.value) || 1)}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none font-bold"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {isReplacementFabric ? 'Replacement Length (m)' : 'Replacement Net Weight (Kg)'}
                        </label>
                        <input
                          type="number"
                          step={isReplacementFabric ? "0.1" : "0.001"}
                          id="rma-replacement-net-weight-input"
                          value={replacementNetWeightKg}
                          onChange={e => setReplacementNetWeightKg(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    {/* Weight Difference & Settlement Callout */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div>
                        <span className="font-semibold text-slate-700">Valuation Comparison:</span>{' '}
                        <span className="text-slate-500">
                          Returned: {formatCurrency(returnedValuationRetail)} ({returnedNetWeightKg.toFixed(isFabric ? 2 : 3)}{isFabric ? 'm' : 'kg'}) &rarr; Replacement: {formatCurrency(replacementValuationRetail)} ({replacementNetWeightKg.toFixed(isReplacementFabric ? 2 : 3)}{isReplacementFabric ? 'm' : 'kg'})
                        </span>
                      </div>
                      <div className="font-bold">
                        {priceDifference > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                            Customer pays variance: +{formatCurrency(priceDifference)}
                          </span>
                        ) : priceDifference < 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                            Refund customer variance: -{formatCurrency(Math.abs(priceDifference))}
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            Exact 1:1 Value Match (KSh 0.00 Diff)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: Direct Refund Details */}
                {(resolutionType === 'bank_refund' || resolutionType === 'mpesa_refund' || resolutionType === 'cash_refund') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>KRA eTIMS Credit Note &amp; Refund Disbursement</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Disbursement Mode
                        </label>
                        <select
                          value={resolutionType}
                          onChange={e => setResolutionType(e.target.value as any)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none font-medium"
                        >
                          <option value="bank_refund">Bank Transfer Reversal</option>
                          <option value="mpesa_refund">M-Pesa B2C / Till Reversal</option>
                          <option value="cash_refund">Cash Drawer Payout</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Refund Transaction Ref / EFT Code
                        </label>
                        <input
                          type="text"
                          value={refundReference}
                          onChange={e => setRefundReference(e.target.value)}
                          placeholder="e.g. EFT-STANBIC-9921"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Total Gross Refund Amount
                        </label>
                        <div className="w-full text-xs bg-blue-50 border border-blue-300 rounded-lg p-2 font-bold text-blue-900 flex items-center justify-between">
                          <span>{formatCurrency(returnedValuationRetail)}</span>
                          <span className="text-[10px] text-blue-700">Incl. 16% VAT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: DOUBLE-ENTRY LEDGER PREVIEW */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Real-time Accounting Ledger Impact Preview</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Auto-posted to General Ledger
                  </span>
                </div>

                <div className="text-xs font-mono space-y-1 pt-1">
                  {resolutionType === 'exchange_replacement' ? (
                    <>
                      <div className="text-amber-300">
                        Dr. 1350 Quarantined Damaged Inventory ({formatCurrency(returnedValuationCost)})
                      </div>
                      <div className="text-slate-300 pl-4">
                        Cr. 1200 Store Active Inventory Asset ({formatCurrency(returnedValuationCost)})
                      </div>
                      {priceDifference > 0 && (
                        <div className="text-emerald-300 pt-1">
                          Dr. Cash at Hand / Bank (+{formatCurrency(priceDifference)}) | Cr. Sales Revenue
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-blue-300">
                        Dr. 4200 Sales Returns &amp; Allowances ({formatCurrency(returnedValuationRetail / 1.16)})
                      </div>
                      <div className="text-blue-300">
                        Dr. 2150 KRA Output VAT Reversal ({formatCurrency(returnedValuationRetail - (returnedValuationRetail / 1.16))})
                      </div>
                      <div className="text-slate-300 pl-4">
                        Cr. {refundChannel === 'Cash Drawer' ? 'Cash Drawer' : 'Bank Operating Account'} ({formatCurrency(returnedValuationRetail)})
                      </div>
                      <div className="text-amber-300 pt-1">
                        Dr. 1350 Quarantined Damaged Inventory Asset ({formatCurrency(returnedValuationCost)}) | Cr. 5000 COGS Reversal
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnExchangeModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-rma-btn"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>
                    Confirm {resolutionType === 'exchange_replacement' ? '1:1 Exchange' : 'Return & Credit Note'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 2: QUARANTINE INVENTORY & SUPPLIER CLAIMS */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'quarantine_list' && (
            <div className="space-y-4">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Quarantined Defect Cones</span>
                  <div className="text-lg font-extrabold text-rose-700 mt-0.5">
                    {totalQuarantinedCones} Cones
                  </div>
                  <span className="text-[10px] text-slate-400">Total Net: {totalQuarantinedKg.toFixed(2)} kg</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Quarantined Fabric</span>
                  <div className="text-lg font-extrabold text-amber-700 mt-0.5">
                    {totalQuarantinedMeters.toFixed(2)} Meters
                  </div>
                  <span className="text-[10px] text-slate-400">Fleece &amp; Dereec cuts</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Spoilage Cost Valuation</span>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(totalCostValuation)}
                  </div>
                  <span className="text-[10px] text-slate-400">Internal Cost Base</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Active Mill Claims</span>
                  <div className="text-lg font-extrabold text-blue-700 mt-0.5">
                    {pendingClaimsCount} Claims
                  </div>
                  <span className="text-[10px] text-slate-400">Oster India / Udey Udyog</span>
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search RMA #, customer, product, lot, reason, claim #..."
                        value={quarantineSearch}
                        onChange={e => setQuarantineSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 outline-none font-medium"
                    >
                      <option value="all">All Statuses</option>
                      <option value="quarantined">In Quarantine</option>
                      <option value="supplier_claim_filed">Claim Filed</option>
                      <option value="supplier_compensated">Supplier Reimbursed</option>
                      <option value="written_off_scrap">Written-off Scrap</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 outline-none font-medium"
                    >
                      <option value="all">All Categories</option>
                      <option value="Yarns">High-Bulk Yarn (Cones)</option>
                      <option value="Fleece">Fleece Fabric</option>
                      <option value="Dereck">Dereck Fabric</option>
                    </select>

                    <select
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 outline-none font-medium"
                    >
                      <option value="all">All Branches</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-2.5 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="select-all-quarantine-checkbox"
                      checked={
                        filteredQuarantinedDefects.length > 0 &&
                        selectedQuarantineIds.length === filteredQuarantinedDefects.length
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedQuarantineIds(filteredQuarantinedDefects.map(r => r.id));
                        } else {
                          setSelectedQuarantineIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <label htmlFor="select-all-quarantine-checkbox" className="font-semibold text-slate-700 cursor-pointer">
                      Select All ({selectedQuarantineIds.length} chosen)
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      id="file-supplier-claim-btn"
                      disabled={selectedQuarantineIds.length === 0}
                      onClick={() => setIsClaimModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>File Mill Claim Note</span>
                    </button>

                    <button
                      type="button"
                      id="resolve-supplier-restock-btn"
                      disabled={selectedQuarantineIds.length === 0}
                      onClick={() => setIsRestockModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Supplier Replaced (Restock)</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedQuarantineIds.length === 0}
                      onClick={() => handleDirectResolve('supplier_compensated')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Reimbursed</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedQuarantineIds.length === 0}
                      onClick={() => handleDirectResolve('written_off_scrap')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Write-off Scrap</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quarantine Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="p-3 w-8"></th>
                        <th className="p-3">RMA Ticket #</th>
                        <th className="p-3">Date / Customer</th>
                        <th className="p-3">Product &amp; Batch</th>
                        <th className="p-3">Quantity / Weight</th>
                        <th className="p-3">Cost Valuation</th>
                        <th className="p-3">Defect Reason</th>
                        <th className="p-3">Quarantine Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredQuarantinedDefects.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                            No quarantine defect records match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredQuarantinedDefects.map(rec => {
                          const isSelected = selectedQuarantineIds.includes(rec.id);
                          const isFabricItem = rec.returnedItem.unit === 'meter' ||
                            rec.returnedItem.productName.toLowerCase().includes('fleece') ||
                            rec.returnedItem.productName.toLowerCase().includes('derec');

                          return (
                            <tr
                              key={rec.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-amber-50/70' : ''
                              }`}
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedQuarantineIds(prev => [...prev, rec.id]);
                                    } else {
                                      setSelectedQuarantineIds(prev => prev.filter(id => id !== rec.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                <div>{rec.rmaNumber}</div>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {rec.resolutionType === 'exchange_replacement'
                                    ? '1:1 Exchanged'
                                    : rec.resolutionType === 'store_credit'
                                    ? 'Store Credit'
                                    : 'Refunded'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{rec.customerName}</div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(rec.returnedAt).toLocaleDateString()} • {locations.find(l => l.id === rec.locationId)?.name}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{rec.returnedItem.productName}</div>
                                <div className="text-[10px] text-slate-400">
                                  Lot: {rec.returnedItem.dyeLot || 'N/A'} | Shade: {rec.returnedItem.shadeCode || 'N/A'}{rec.returnedItem.rollNumber ? ` | ${rec.returnedItem.rollNumber}` : ''}
                                </div>
                              </td>
                              <td className="p-3 font-bold">
                                {isFabricItem ? (
                                  <span className="text-amber-700 font-bold">
                                    {(rec.returnedItem.metersCount || 0).toFixed(2)} meters
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-bold">
                                    {rec.returnedItem.conesCount} cones ({(rec.returnedItem.netWeightKg || 0).toFixed(3)} kg)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                <div>{formatCurrency(rec.returnedItem.totalValuationCost)}</div>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Retail: {formatCurrency(rec.returnedItem.totalValuationRetail)}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">
                                  {rec.defectReason}
                                </span>
                                {rec.defectNotes && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={rec.defectNotes}>
                                    {rec.defectNotes}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {rec.quarantineStatus === 'quarantined' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    In Quarantine
                                  </span>
                                )}
                                {rec.quarantineStatus === 'supplier_claim_filed' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    Claim: {rec.supplierClaimNumber}
                                  </span>
                                )}
                                {rec.quarantineStatus === 'supplier_compensated' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Reimbursed / Settled
                                  </span>
                                )}
                                {rec.quarantineStatus === 'written_off_scrap' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    Written Off
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRecordForDetail(rec)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      exportRmaReturnVoucherPDF(
                                        rec,
                                        locations,
                                        etrConfig,
                                        brandSettings
                                      )
                                    }
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Print RMA Voucher PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRecordToDelete(rec)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Void / Delete Ticket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 3: KRA ETIMS CREDIT NOTES */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'credit_notes' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Official KRA eTIMS Credit Notes Register
                    </h3>
                    <p className="text-xs text-slate-500">
                      Compliant VAT reversals and return adjustments linked to Control Unit #{etrConfig.cuSerialNumber}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                    KRA Fiscal Compliant
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search credit note ID, invoice number, customer name, fiscal signature..."
                    value={creditNoteSearch}
                    onChange={e => setCreditNoteSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-2.5">
                  {filteredCreditNotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No credit notes match the search criteria.
                    </div>
                  ) : (
                    filteredCreditNotes.map(crn => (
                      <div
                        key={crn.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{crn.id}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">
                              Orig Inv: {crn.originalInvoiceNo}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                              {crn.creditReason}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700">
                            Customer: <strong className="text-slate-900">{crn.customerName}</strong>{' '}
                            {crn.customerKraPin && `(PIN: ${crn.customerKraPin})`}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            CU Signature: {crn.fiscalSignature} • Issued: {new Date(crn.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right space-y-1.5 shrink-0">
                          <div className="text-sm font-extrabold text-slate-900">
                            Total Credited: {formatCurrency(crn.creditAmount)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Net: {formatCurrency(crn.netCredited)} • 16% VAT: {formatCurrency(crn.vatCredited)}
                          </div>
                          <button
                            type="button"
                            onClick={() => exportCreditNoteDirectPDF(crn, etrConfig, brandSettings)}
                            className="text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg flex items-center space-x-1 ml-auto cursor-pointer shadow-sm"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Print Credit Note</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 4: ACCOUNTING & LEDGER FLOW EXPLANATION */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'ledger_guide' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      The Exact Accounting &amp; Inventory Lifecycle for Returned Spoilt Yarn Cones
                    </h3>
                    <p className="text-xs text-slate-400">
                      Standard operating procedure for Kenyan textile merchants handling damaged goods, bank deposits &amp; KRA VAT
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Day 1: Customer Purchases Bale via Bank Transfer
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customer pays for the entire bale (e.g. 24 cones = 48.0 kg @ KSh 750/kg = KSh 36,000) deposited in the company bank account.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
                    <div className="text-emerald-700 font-bold">Dr. Bank Operating Account (KSh 36,000)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. Sales Revenue (KSh 31,034.48)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. KRA 16% Output VAT (KSh 4,965.52)</div>
                    <div className="text-slate-500 text-[11px] pt-1">
                      Inventory Asset decremented by 48.0 kg; COGS recognized.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Day 3: Customer Returns 2 Spoilt Cones for 1-to-1 Exchange
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The customer brings back 2 damaged cones. <strong>The money stays in the bank.</strong> You hand them 2 brand new good cones from active stock.
                  </p>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs font-mono space-y-1">
                    <div className="text-amber-900 font-bold">Dr. 1350 - Quarantined Damaged Inventory Asset (KSh 1,800)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. 1200 - Store Active Inventory Asset (KSh 1,800)</div>
                    <div className="text-slate-600 text-[11px] pt-1">
                      Good replacement cones leave active stock. Defective cones enter Quarantine (NOT mixed with sellable stock).
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Alternative: Customer Demands Bank Refund for 2 Cones
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If customer does NOT want replacement cones, refund KSh 3,000 to their account and generate an eTIMS Credit Note.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs font-mono space-y-1">
                    <div className="text-blue-900 font-bold">Dr. 4200 - Sales Returns &amp; Allowances (KSh 2,586.21)</div>
                    <div className="text-blue-900 font-bold">Dr. 2150 - KRA Output VAT Reversal (KSh 413.79)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. Bank Account (Refund Payout: KSh 3,000.00)</div>
                    <div className="text-slate-600 text-[11px] pt-1">
                      eTIMS Credit Note automatically created to offset KRA tax liability.
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Filing Claim with Manufacturer (Oster India / Udey Udyog)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Accumulate damaged cones over the month, select them in Tab 2, and submit a Spoilage Debit Claim Note to the manufacturer.
                  </p>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs font-mono space-y-1">
                    <div className="text-emerald-900 font-bold">Dr. 1180 - Accounts Receivable (Supplier Claims)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. 1350 - Quarantined Damaged Inventory Asset</div>
                    <div className="text-slate-600 text-[11px] pt-1">
                      When supplier delivers replacement cones, stock is replenished with zero loss to your business.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-slate-900 text-slate-400 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Stock Quarantine &amp; Double-Entry Ledger Active</span>
          </div>
          <button
            onClick={() => setIsReturnExchangeModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DIALOG 1: FILE SUPPLIER CLAIM NOTE */}
      {/* ---------------------------------------------------- */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  File Manufacturer Debit Claim Note
                </h3>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFileClaimSubmit} className="space-y-3.5">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-900">
                You have selected <strong>{selectedQuarantineIds.length}</strong> defect ticket(s) totaling{' '}
                <strong>
                  {formatCurrency(
                    quarantinedDefects
                      .filter(r => selectedQuarantineIds.includes(r.id))
                      .reduce((sum, r) => sum + r.returnedItem.totalValuationCost, 0)
                  )}
                </strong>{' '}
                in cost valuation.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer / Mill Supplier *
                </label>
                <input
                  type="text"
                  required
                  value={claimSupplierName}
                  onChange={e => setClaimSupplierName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Debit Claim Notes / Mill Instructions
                </label>
                <textarea
                  rows={3}
                  value={claimNotes}
                  onChange={e => setClaimNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-export-claim-checkbox"
                  checked={autoExportClaimPdf}
                  onChange={e => setAutoExportClaimPdf(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto-export-claim-checkbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Automatically generate and download official Supplier Claim PDF Schedule
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 rounded-xl hover:bg-blue-800 shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Submit Claim Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIALOG 2: RESTOCK SUPPLIER REPLACEMENT */}
      {/* ---------------------------------------------------- */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Restock Supplier Replacement into Active Stock
                </h3>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3.5">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                Resolving <strong>{selectedQuarantineIds.length}</strong> defect ticket(s). Good replacement material will be credited directly to sellable store stock.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Store Branch *
                </label>
                <select
                  value={restockLocation}
                  onChange={e => setRestockLocation(e.target.value as LocationId)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restock Product / Batch *
                </label>
                <select
                  value={restockBatchId}
                  onChange={e => setRestockBatchId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivered Replacement Quantity (Kg or Meters) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restock Quality Inspection Notes
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Confirm Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIALOG 3: TICKET DETAIL VIEW DRAWER */}
      {/* ---------------------------------------------------- */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  RMA Ticket Details: {selectedRecordForDetail.rmaNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <strong className="text-slate-900">{selectedRecordForDetail.customerName}</strong>
                  {selectedRecordForDetail.customerPhone && (
                    <span className="text-slate-500 block text-[11px]">{selectedRecordForDetail.customerPhone}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date &amp; Store Branch</span>
                  <strong className="text-slate-900">
                    {new Date(selectedRecordForDetail.returnedAt).toLocaleString()}
                  </strong>
                  <span className="text-slate-500 block text-[11px]">
                    {locations.find(l => l.id === selectedRecordForDetail.locationId)?.name}
                  </span>
                </div>
              </div>

              {/* Defective Item */}
              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 space-y-1.5">
                <span className="text-rose-900 font-bold block text-xs">Defective Quarantined Item</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Product:</span>{' '}
                    <strong>{selectedRecordForDetail.returnedItem.productName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Lot / Shade:</span>{' '}
                    <strong>
                      Lot {selectedRecordForDetail.returnedItem.dyeLot || 'N/A'} • Shade {selectedRecordForDetail.returnedItem.shadeCode || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantity / Net:</span>{' '}
                    <strong className="text-rose-700">
                      {selectedRecordForDetail.returnedItem.conesCount
                        ? `${selectedRecordForDetail.returnedItem.conesCount} Cones (${selectedRecordForDetail.returnedItem.netWeightKg?.toFixed(3)} kg)`
                        : `${selectedRecordForDetail.returnedItem.metersCount?.toFixed(2)} meters`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Cost Valuation:</span>{' '}
                    <strong>{formatCurrency(selectedRecordForDetail.returnedItem.totalValuationCost)}</strong>
                  </div>
                </div>
                <div className="text-[11px] pt-1 text-slate-700">
                  <span className="font-semibold text-rose-800">Defect Reason:</span> {selectedRecordForDetail.defectReason}
                  {selectedRecordForDetail.defectNotes && (
                    <div className="text-slate-500 italic mt-0.5">&ldquo;{selectedRecordForDetail.defectNotes}&rdquo;</div>
                  )}
                </div>
              </div>

              {/* Replacement or Refund */}
              {selectedRecordForDetail.replacementItem && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                  <span className="text-emerald-900 font-bold block text-xs">Dispatched Replacement</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Product:</span>{' '}
                      <strong>{selectedRecordForDetail.replacementItem.productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Dispatched:</span>{' '}
                      <strong>
                        {selectedRecordForDetail.replacementItem.conesCount
                          ? `${selectedRecordForDetail.replacementItem.conesCount} Cones (${selectedRecordForDetail.replacementItem.netWeightKg?.toFixed(3)} kg)`
                          : `${selectedRecordForDetail.replacementItem.metersCount?.toFixed(2)} meters`}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Mill Claim & Status */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 space-y-1">
                <span className="text-blue-900 font-bold block text-xs">Mill Supplier &amp; Claim Status</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Supplier:</span>{' '}
                    <strong>{selectedRecordForDetail.supplierName || 'Oster India / Mill'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <strong>{selectedRecordForDetail.quarantineStatus.replace(/_/g, ' ').toUpperCase()}</strong>
                  </div>
                  {selectedRecordForDetail.supplierClaimNumber && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Claim Ref:</span>{' '}
                      <strong className="text-blue-800">{selectedRecordForDetail.supplierClaimNumber}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  exportRmaReturnVoucherPDF(
                    selectedRecordForDetail,
                    locations,
                    etrConfig,
                    brandSettings
                  )
                }
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Official Voucher PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIALOG 4: CONFIRM DELETE RMA */}
      {/* ---------------------------------------------------- */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">
                Void / Delete RMA Ticket {recordToDelete.rmaNumber}?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently cancel ticket <strong>{recordToDelete.rmaNumber}</strong> for{' '}
              <strong>{recordToDelete.customerName}</strong>? This will remove the defective items from quarantine isolation.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 cursor-pointer shadow-sm"
              >
                Yes, Void Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
