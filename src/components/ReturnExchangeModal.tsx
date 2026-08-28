import React, { useState } from 'react';
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
  Sparkles,
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
  Tag
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  DefectReasonType,
  ReturnResolutionType,
  ReturnExchangePayload,
  QuarantinedDefectRecord,
  ETIMSCreditNote,
  LocationId
} from '../types';

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
    processReturnAndExchange,
    fileSupplierDefectClaim,
    resolveQuarantineRecord,
    categoryPricingConfigs
  } = useERP();

  const [activeTab, setActiveTab] = useState<'new_rma' | 'quarantine_list' | 'credit_notes' | 'ledger_guide'>('new_rma');

  // Form state for new Return / Exchange
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Retail Garment Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('+254 7');
  const [locationId, setLocationId] = useState<LocationId>(activeLocation);

  // Returned item
  const [returnedBatchId, setReturnedBatchId] = useState<string>(products[0]?.id || '');
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
  const [replacementConesCount, setReplacementConesCount] = useState<number>(2);
  const [replacementNetWeightKg, setReplacementNetWeightKg] = useState<number>(4.000);
  const [replacementRatePerKg, setReplacementRatePerKg] = useState<number>(750);

  // Refund details
  const [refundChannel, setRefundChannel] = useState<'Bank Account' | 'M-Pesa B2C' | 'Cash Drawer' | 'Store Credit Note'>('Bank Account');
  const [refundReference, setRefundReference] = useState<string>('');

  // Quarantine bulk actions
  const [selectedQuarantineIds, setSelectedQuarantineIds] = useState<string[]>([]);
  const [claimSupplierName, setClaimSupplierName] = useState<string>('UDEY UDYOG UNIT OF OSTER INDIA PVT LTD');
  const [claimNotes, setClaimNotes] = useState<string>('Batch defect claim: Spoilt yarn cones collected from customer bale inspection.');

  // Outcome notification
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string; rmaId?: string } | null>(null);

  if (!isReturnExchangeModalOpen) return null;

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
      if (ord.items && ord.items.length > 0) {
        const firstItem = ord.items[0];
        setReturnedBatchId(firstItem.batchId);
        setReturnedRatePerKg(firstItem.unitPrice);
        setReplacementBatchId(firstItem.batchId);
        setReplacementRatePerKg(firstItem.unitPrice);
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

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    const payload: ReturnExchangePayload = {
      orderId: selectedOrderId || undefined,
      receiptNumber: receiptNumber || undefined,
      customerName,
      customerPhone,
      locationId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      returnedBatchId,
      returnedConesCount,
      returnedGrossWeightKg,
      returnedTareKg,
      returnedNetWeightKg,
      returnedRatePerKg,
      defectReason,
      defectNotes,
      resolutionType,
      replacementBatchId: resolutionType === 'exchange_replacement' ? replacementBatchId : undefined,
      replacementConesCount: resolutionType === 'exchange_replacement' ? replacementConesCount : undefined,
      replacementNetWeightKg: resolutionType === 'exchange_replacement' ? replacementNetWeightKg : undefined,
      replacementRatePerKg: resolutionType === 'exchange_replacement' ? replacementRatePerKg : undefined,
      refundChannel: resolutionType !== 'exchange_replacement' ? refundChannel : undefined,
      refundReference: refundReference || undefined,
      supplierName
    };

    const res = processReturnAndExchange(payload);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: res.message,
        rmaId: res.rmaId
      });
      // Switch to quarantine view to see the isolated stock
      setTimeout(() => {
        setActiveTab('quarantine_list');
      }, 1200);
    } else {
      setActionFeedback({
        type: 'error',
        message: res.message
      });
    }
  };

  const handleFileClaim = () => {
    if (selectedQuarantineIds.length === 0) return;
    const res = fileSupplierDefectClaim(selectedQuarantineIds, claimSupplierName, claimNotes);
    if (res.success) {
      setSelectedQuarantineIds([]);
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  const handleResolveQuarantine = (action: 'supplier_compensated' | 'supplier_replaced' | 'written_off_scrap') => {
    if (selectedQuarantineIds.length === 0) return;
    const res = resolveQuarantineRecord(
      selectedQuarantineIds,
      action,
      `Resolved via ${action.replace('_', ' ')} on ${new Date().toLocaleDateString()}`,
      returnedBatchId,
      4.0
    );
    if (res.success) {
      setSelectedQuarantineIds([]);
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  return (
    <div
      id="return-exchange-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="return-exchange-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Damaged Yarn Cones, RMA Returns & Exchanges
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Dual-Ledger & Quarantine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Process spoilt cones from sold bales, balance store stock, manage eTIMS credit notes & file supplier claims
              </p>
            </div>
          </div>
          <button
            id="close-return-exchange-modal-btn"
            onClick={() => setIsReturnExchangeModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              id="tab-new-rma-btn"
              onClick={() => setActiveTab('new_rma')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all ${
                activeTab === 'new_rma'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>1. New Return & Exchange (RMA)</span>
            </button>
            <button
              id="tab-quarantine-btn"
              onClick={() => setActiveTab('quarantine_list')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all ${
                activeTab === 'quarantine_list'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>2. Quarantined Stock & Supplier Claims</span>
              <span className="ml-1 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                {quarantinedDefects.length}
              </span>
            </button>
            <button
              id="tab-credit-notes-btn"
              onClick={() => setActiveTab('credit_notes')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all ${
                activeTab === 'credit_notes'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. KRA eTIMS Credit Notes</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                {creditNotes.length}
              </span>
            </button>
            <button
              id="tab-ledger-guide-btn"
              onClick={() => setActiveTab('ledger_guide')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all ${
                activeTab === 'ledger_guide'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>4. Accounting & Ledger Flow Explanation</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: NEW RMA WIZARD */}
          {activeTab === 'new_rma' && (
            <form onSubmit={handleProcessSubmit} className="space-y-6">
              {/* Step 1: Customer & Original Sale Reference */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Customer & Original Bale Sale Information
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Location: {locations.find(l => l.id === locationId)?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link Existing Invoice / Order (Optional)
                    </label>
                    <select
                      id="rma-order-select"
                      value={selectedOrderId}
                      onChange={e => handleSelectOrder(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    >
                      <option value="">-- Manual Customer Entry --</option>
                      {orders.slice(0, 15).map(o => (
                        <option key={o.id} value={o.id}>
                          {o.id} - {o.customerName} (KSh {o.grandTotal.toLocaleString()})
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
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
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
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Returned Defective Items Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isFabric
                        ? 'Returned Defective Fabric Meters & Quality Assessment'
                        : 'Returned Spoilt Yarn Cones & Weight Measurements'}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                    {isFabric ? 'Fabric Quarantine Intake' : 'Yarn Quarantine Intake'}
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
                          {p.name} ({p.category}) - KSh {p.unitPriceRetail}/{p.unit === 'meter' ? 'm' : 'kg'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isFabric ? 'Defective Meters Returned' : 'Number of Spoilt Cones'}
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
                      <span className="text-xs text-slate-500 whitespace-nowrap">{isFabric ? 'Meters' : 'Cones'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Rate (KSh / {isFabric ? 'Meter' : 'Kg'})
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
                      {isFabric ? 'Net Defect Quantity (Auto)' : 'Net Billable Weight (Auto)'}
                    </label>
                    <div className="w-full text-xs bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 font-bold text-emerald-900 flex items-center justify-between">
                      <span>{returnedNetWeightKg.toFixed(isFabric ? 2 : 3)} {isFabric ? 'meters' : 'kg'}</span>
                      <span className="text-[10px] text-emerald-700 font-normal">{isFabric ? 'Linear Fabric' : 'Pure Yarn'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Returned Retail Value (Auto)
                    </label>
                    <div className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 flex items-center justify-between">
                      <span>KSh {returnedValuationRetail.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cost: KSh {returnedValuationCost.toLocaleString()}</span>
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
                      Inspection Notes & Customer Observations
                    </label>
                    <input
                      type="text"
                      id="rma-notes-input"
                      value={defectNotes}
                      onChange={e => setDefectNotes(e.target.value)}
                      placeholder={isFabric ? "e.g. 3.5 meters has severe weaving slubs and grease spot midway through roll" : "e.g. 2 cones had filament breakage and irregular twist within bale #148"}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Resolution Method */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Resolution Option & Financial Settlement
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    How is the customer compensated?
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionType('exchange_replacement')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
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
                        Hand over 2 good cones from active stock. Quarantines defective cones without affecting bank ledger.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded w-fit">
                      Most Common
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('bank_refund')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      resolutionType === 'bank_refund' || resolutionType === 'mpesa_refund' || resolutionType === 'cash_refund'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Banknote className={`w-5 h-5 ${resolutionType === 'bank_refund' ? 'text-blue-600' : 'text-slate-500'}`} />
                        {resolutionType === 'bank_refund' && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">2. Financial Refund</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Reverse sales revenue, refund cash/bank, and issue official KRA eTIMS Credit Note.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded w-fit">
                      eTIMS Credit Note
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('store_credit')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
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
                        Issue a digital store voucher credit usable on future yarn bale or cone purchases.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded w-fit">
                      Customer Balance
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

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {isReplacementFabric ? 'Replacement Rolls / Pieces' : 'Replacement Cones'}
                        </label>
                        <input
                          type="number"
                          id="rma-replacement-cones-input"
                          value={replacementConesCount}
                          onChange={e => setReplacementConesCount(parseInt(e.target.value) || 1)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-slate-900 outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {isReplacementFabric ? 'Replacement Meters (m)' : 'Replacement Net Weight (Kg)'}
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
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">Valuation Comparison:</span>{' '}
                        <span className="text-slate-500">
                          Returned: KSh {returnedValuationRetail.toLocaleString()} ({returnedNetWeightKg.toFixed(isFabric ? 2 : 3)}{isFabric ? 'm' : 'kg'}) &rarr; Replacement: KSh {replacementValuationRetail.toLocaleString()} ({replacementNetWeightKg.toFixed(isReplacementFabric ? 2 : 3)}{isReplacementFabric ? 'm' : 'kg'})
                        </span>
                      </div>
                      <div className="font-bold">
                        {priceDifference > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            Customer pays variance: +KSh {priceDifference.toFixed(2)}
                          </span>
                        ) : priceDifference < 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            Refund customer variance: -KSh {Math.abs(priceDifference).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
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
                      <span>KRA eTIMS Credit Note & Refund Disbursement</span>
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
                          <span>KSh {returnedValuationRetail.toLocaleString()}</span>
                          <span className="text-[10px] text-blue-700">Incl. 16% VAT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnExchangeModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-rma-btn"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>
                    Confirm {resolutionType === 'exchange_replacement' ? '1:1 Exchange' : 'Return & Credit Note'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: QUARANTINE INVENTORY & SUPPLIER CLAIMS */}
          {activeTab === 'quarantine_list' && (
            <div className="space-y-6">
              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Quarantined Defect Cones</span>
                  <div className="text-xl font-extrabold text-rose-700 mt-1">
                    {quarantinedDefects.reduce((sum, r) => sum + r.returnedItem.conesCount, 0)} Cones
                  </div>
                  <span className="text-[10px] text-slate-400">Isolated from active stock</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Total Quarantined Weight</span>
                  <div className="text-xl font-extrabold text-amber-700 mt-1">
                    {quarantinedDefects.reduce((sum, r) => sum + r.returnedItem.netWeightKg, 0).toFixed(3)} Kg
                  </div>
                  <span className="text-[10px] text-slate-400">Net yarn weight</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Spoilage Cost Valuation</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    KSh {quarantinedDefects.reduce((sum, r) => sum + r.returnedItem.totalValuationCost, 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Recorded at cost price</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-semibold block">Manufacturer Claims</span>
                  <div className="text-xl font-extrabold text-blue-700 mt-1">
                    {quarantinedDefects.filter(r => r.quarantineStatus === 'supplier_claim_filed').length} Claims
                  </div>
                  <span className="text-[10px] text-slate-400">Oster India / Udey Udyog</span>
                </div>
              </div>

              {/* Action Toolbar for Bulk Selection */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all-quarantine-checkbox"
                    checked={
                      quarantinedDefects.length > 0 &&
                      selectedQuarantineIds.length === quarantinedDefects.length
                    }
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedQuarantineIds(quarantinedDefects.map(r => r.id));
                      } else {
                        setSelectedQuarantineIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="select-all-quarantine-checkbox" className="text-xs font-semibold text-slate-700">
                    Select All ({selectedQuarantineIds.length} chosen)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    id="file-supplier-claim-btn"
                    disabled={selectedQuarantineIds.length === 0}
                    onClick={handleFileClaim}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>File Manufacturer Claim Note</span>
                  </button>

                  <button
                    type="button"
                    id="resolve-supplier-compensated-btn"
                    disabled={selectedQuarantineIds.length === 0}
                    onClick={() => handleResolveQuarantine('supplier_compensated')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Supplier Reimbursed</span>
                  </button>

                  <button
                    type="button"
                    id="resolve-writeoff-btn"
                    disabled={selectedQuarantineIds.length === 0}
                    onClick={() => handleResolveQuarantine('written_off_scrap')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Write-off as Scrap Loss</span>
                  </button>
                </div>
              </div>

              {/* Quarantine Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3 w-8"></th>
                      <th className="p-3">RMA Ticket #</th>
                      <th className="p-3">Date / Customer</th>
                      <th className="p-3">Yarn Product & Lot</th>
                      <th className="p-3">Spoilt Cones</th>
                      <th className="p-3">Net Weight</th>
                      <th className="p-3">Cost Valuation</th>
                      <th className="p-3">Defect Reason</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {quarantinedDefects.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                          No defective cones currently in quarantine.
                        </td>
                      </tr>
                    ) : (
                      quarantinedDefects.map(rec => {
                        const isSelected = selectedQuarantineIds.includes(rec.id);
                        return (
                          <tr
                            key={rec.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-amber-50/60' : ''
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
                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              <div>{rec.rmaNumber}</div>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {rec.resolutionType === 'exchange_replacement' ? '1:1 Exchanged' : 'Refunded'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{rec.customerName}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(rec.returnedAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{rec.returnedItem.productName}</div>
                              <div className="text-[10px] text-slate-400">
                                Lot: {rec.returnedItem.dyeLot || 'N/A'} | Shade: {rec.returnedItem.shadeCode || 'N/A'}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-rose-700">
                              {rec.returnedItem.unit === 'meter' ||
                              rec.returnedItem.productName.toLowerCase().includes('fleece') ||
                              rec.returnedItem.productName.toLowerCase().includes('derec')
                                ? `${rec.returnedItem.conesCount} Roll/Cutout`
                                : `${rec.returnedItem.conesCount} Cones`}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {rec.returnedItem.unit === 'meter' ||
                              rec.returnedItem.productName.toLowerCase().includes('fleece') ||
                              rec.returnedItem.productName.toLowerCase().includes('derec')
                                ? `${rec.returnedItem.netWeightKg.toFixed(2)} m`
                                : `${rec.returnedItem.netWeightKg.toFixed(3)} kg`}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              KSh {rec.returnedItem.totalValuationCost.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                                {rec.defectReason}
                              </span>
                              {rec.defectNotes && (
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
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
                                  Claim Filed ({rec.supplierClaimNumber})
                                </span>
                              )}
                              {rec.quarantineStatus === 'supplier_compensated' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Reimbursed
                                </span>
                              )}
                              {rec.quarantineStatus === 'written_off_scrap' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  Written Off
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: KRA ETIMS CREDIT NOTES */}
          {activeTab === 'credit_notes' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

                <div className="space-y-3">
                  {creditNotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No credit notes generated yet.
                    </div>
                  ) : (
                    creditNotes.map(crn => (
                      <div
                        key={crn.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{crn.id}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                              Orig Inv: {crn.originalInvoiceNo}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                              {crn.creditReason}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700">
                            Customer: <span className="font-semibold">{crn.customerName}</span>{' '}
                            {crn.customerKraPin && `(PIN: ${crn.customerKraPin})`}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            CU Signature: {crn.fiscalSignature} | Issued: {new Date(crn.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-sm font-extrabold text-slate-900">
                            Total Credited: KSh {crn.creditAmount.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Net: KSh {crn.netCredited.toLocaleString()} | 16% VAT: KSh {crn.vatCredited.toLocaleString()}
                          </div>
                          <button
                            onClick={() => window.print()}
                            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1 ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5" />
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

          {/* TAB 4: ACCOUNTING & LEDGER FLOW EXPLANATION */}
          {activeTab === 'ledger_guide' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      The Exact Accounting & Inventory Lifecycle for Returned Spoilt Yarn Cones
                    </h3>
                    <p className="text-xs text-slate-400">
                      How our ERP handles stock balance, bank transfer money, and general ledger reconciliation
                    </p>
                  </div>
                </div>
              </div>

              {/* 4-Step Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: When Bale was sold */}
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

                {/* Step 2: 2 Spoilt cones returned after 2 days */}
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

                {/* Step 3: What happens if customer wanted money back? */}
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
                    <div className="text-blue-900 font-bold">Dr. 4200 - Sales Returns & Allowances (KSh 2,586.21)</div>
                    <div className="text-blue-900 font-bold">Dr. 2150 - KRA Output VAT Reversal (KSh 413.79)</div>
                    <div className="text-slate-700 font-bold pl-4">Cr. Bank Account (Refund Payout: KSh 3,000.00)</div>
                    <div className="text-slate-600 text-[11px] pt-1">
                      eTIMS Credit Note automatically created to offset KRA tax liability.
                    </div>
                  </div>
                </div>

                {/* Step 4: Recovering cost from Manufacturer */}
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

        {/* Footer */}
        <div className="bg-slate-900 text-slate-400 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Stock Quarantine & Double-Entry Ledger Active</span>
          </div>
          <button
            onClick={() => setIsReturnExchangeModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
