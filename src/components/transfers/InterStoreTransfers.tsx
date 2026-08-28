import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { hasPermission } from '../../utils/rbac';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import DocumentHeader from '../common/DocumentHeader';
import { InterStoreTransfer, LocationId, ProductBatch } from '../../types';
import {
  ArrowLeftRight,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  ShieldCheck,
  Send,
  Plus,
  Search,
  Trash2,
  Printer,
  FileText,
  X,
  UserCheck,
  Sparkles,
  PackageCheck,
  AlertCircle,
  Download
} from 'lucide-react';
import { exportInterStoreTransferWaybillPDF } from '../../utils/documentExport';

export const InterStoreTransfers: React.FC = () => {
  const {
    transfers,
    locations,
    dispatchRestockTransfer,
    createDirectDispatchTransfer,
    fulfillReroutedOrder,
    resumeTransferredSaleToCart,
    activeLocation,
    products,
    posSession,
    brandSettings,
    etrConfig,
    currentUser,
    isAdmin
  } = useERP();

  const canDispatchTransfers = isAdmin || hasPermission(currentUser.role, 'canDispatchTransfers');
  const canApproveTransfers = isAdmin || hasPermission(currentUser.role, 'canReceiveTransfers');

  const [activeTab, setActiveTab] = useState<'pending' | 'fulfilled' | 'all'>('pending');
  const [selectedFulfillTransfer, setSelectedFulfillTransfer] = useState<InterStoreTransfer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [customerName, setCustomerName] = useState('');
  const [customerKraPin, setCustomerKraPin] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Direct Stock Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchFrom, setDispatchFrom] = useState<LocationId>('main_store');
  const [dispatchTo, setDispatchTo] = useState<LocationId>('sales_shop');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchItems, setDispatchItems] = useState<{ batchId: string; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Selected Waybill Modal for Accountability Audit
  const [selectedWaybill, setSelectedWaybill] = useState<InterStoreTransfer | null>(null);

  const filteredTransfers = transfers.filter(t => {
    if (activeTab === 'pending') return t.status === 'pending_approval';
    if (activeTab === 'fulfilled') return t.status === 'fulfilled';
    return true;
  });

  const handleDispatchClick = (transferId: string) => {
    setStatusMsg(null);
    const res = dispatchRestockTransfer(transferId);
    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.message });
    } else {
      setStatusMsg({ type: 'success', text: res.message });
    }
  };

  const handleFulfillRerouteSubmit = () => {
    if (!selectedFulfillTransfer) return;
    setStatusMsg(null);
    const res = fulfillReroutedOrder(
      selectedFulfillTransfer.id,
      paymentMethod,
      customerName || 'Rerouted Customer',
      customerKraPin
    );

    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.message });
    } else {
      setStatusMsg({ type: 'success', text: res.message });
      setSelectedFulfillTransfer(null);
    }
  };

  // Dispatch Builder Actions
  const handleAddItemToDispatch = (batch: ProductBatch) => {
    const existing = dispatchItems.find(i => i.batchId === batch.id);
    const available = batch.locationStock[dispatchFrom] || 0;
    if (available <= 0) return;

    if (existing) {
      if (existing.quantity >= available) return;
      setDispatchItems(prev =>
        prev.map(i => (i.batchId === batch.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setDispatchItems(prev => [...prev, { batchId: batch.id, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (batchId: string, qty: number) => {
    const batch = products.find(p => p.id === batchId);
    if (!batch) return;
    const available = batch.locationStock[dispatchFrom] || 0;
    const validQty = Math.max(1, Math.min(available, qty));

    setDispatchItems(prev =>
      prev.map(i => (i.batchId === batchId ? { ...i, quantity: validQty } : i))
    );
  };

  const handleRemoveItem = (batchId: string) => {
    setDispatchItems(prev => prev.filter(i => i.batchId !== batchId));
  };

  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (dispatchFrom === dispatchTo) {
      setStatusMsg({ type: 'error', text: 'Source and destination store locations must be different!' });
      return;
    }

    if (dispatchItems.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please add at least one item from the inventory catalog.' });
      return;
    }

    const res = createDirectDispatchTransfer(
      dispatchFrom,
      dispatchTo,
      dispatchItems,
      dispatchNotes || 'Direct POS Stock Transfer'
    );

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setIsDispatchModalOpen(false);
      setDispatchItems([]);
      setDispatchNotes('');
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  // Products available at chosen source store
  const availableSourceProducts = products.filter(p => {
    const stockAtSource = p.locationStock[dispatchFrom] || 0;
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    return stockAtSource > 0 && matchesSearch;
  });

  const totalDispatchVal = dispatchItems.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.batchId);
    return acc + (p ? p.costPrice * item.quantity : 0);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Topology & Quick Dispatch Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 group">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rose" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-400/40 text-rose-300 flex items-center justify-center shadow-inner">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                Inter-Store Stock Dispatch &amp; Accountability Center
              </h2>
              <p className="text-[11px] text-rose-200">
                Direct POS Item Addition • Real-Time Stock Transfer • Audit Manifests
              </p>
            </div>
          </div>

          {canDispatchTransfers && (
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg border border-white/20 transition-all cursor-pointer flex items-center gap-2 shrink-0 scale-102 hover:scale-105"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Dispatch New Stock Transfer</span>
            </button>
          )}
        </div>

        {/* Visual Topology Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-rose-400/30 space-y-1.5 text-center relative">
            <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-black flex items-center justify-center mx-auto text-xs shadow-md">
              M
            </div>
            <h4 className="font-bold text-xs text-rose-200">MAIN STORE CENTRAL HUB</h4>
            <p className="text-[10px] text-slate-300 leading-tight">
              Primary Holding Depot • Bulk Receiving • Inter-Store Dispatch Hub
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-rose-400 py-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Truck className="w-4 h-4 animate-pulse text-amber-300" />
              <span>Full Accountability &amp; Ledger Audited</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 space-y-1.5 text-center">
            <div className="flex justify-center gap-1.5">
              <span className="px-2 py-0.5 bg-pink-500/30 text-pink-200 rounded font-bold text-[10px]">Sales Shop</span>
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded font-bold text-[10px]">Store 1</span>
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded font-bold text-[10px]">Store 2</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Retail Counters &amp; Showrooms • Immediate POS Availability
            </p>
          </div>

        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Transfer Queue Table Container */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs space-y-4 p-5">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Stock Transfer &amp; Fulfillment Audit Trail
            </h3>
          </div>

          {/* Tab Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Pending ({transfers.filter(t => t.status === 'pending_approval').length})
            </button>
            <button
              onClick={() => setActiveTab('fulfilled')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'fulfilled'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Fulfilled / Dispatched ({transfers.filter(t => t.status === 'fulfilled').length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              All Records ({transfers.length})
            </button>
          </div>
        </div>

        {/* Transfers List */}
        {filteredTransfers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p>No transfer or reroute records found in this queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransfers.map(trf => {
              const fromLoc = locations.find(l => l.id === trf.fromLocation);
              const toLoc = locations.find(l => l.id === trf.toLocation);
              const isRestock = trf.transferType === 'restock_free';
              const isPending = trf.status === 'pending_approval';
              const lineVal = trf.items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

              return (
                <div
                  key={trf.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-rose-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                          isRestock
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isRestock ? 'Zero-Cost Stock Transfer' : 'Rerouted Order Ticket'}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {trf.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {fromLoc?.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {toLoc?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-slate-900">
                        Value: KSh {lineVal.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {(trf.status || '').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                  </div>

                  {/* Transfer Items Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Dispatched Items Manifest:
                      </p>
                      <ul className="space-y-1">
                        {trf.items.map((item, idx) => (
                          <li key={idx} className="font-medium text-slate-800 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span>{item.productName}</span>
                            <span className="font-mono font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 border-l border-slate-200 pl-3">
                      <p className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <strong>Dispatch Operator Accountability:</strong> {trf.requestedByOperator}
                      </p>
                      <p><strong>Notes / Purpose:</strong> {trf.notes || 'Routine inventory dispatch'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Dispatched At: {new Date(trf.requestedAt).toLocaleString()}
                      </p>
                      {trf.fulfilledAt && (
                        <p className="text-[10px] text-emerald-700 font-semibold font-mono flex items-center gap-1">
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Fulfilled / Confirmed: {new Date(trf.fulfilledAt).toLocaleString()} by {trf.fulfilledByOperator || trf.requestedByOperator}
                        </p>
                      )}

                      <button
                        onClick={() => setSelectedWaybill(trf)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Waybill &amp; Audit Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  {isPending && canApproveTransfers && (
                    <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                      {isRestock ? (
                        <button
                          onClick={() => handleDispatchClick(trf.id)}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-4 h-4" />
                          Receive Stock ($0 Internal Transfer)
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const res = resumeTransferredSaleToCart(trf.id);
                              setStatusMsg({ type: res.success ? 'success' : 'error', text: res.message });
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
                            title="Auto-holds receiver active queue and loads transferred sale into POS"
                          >
                            <Sparkles className="w-4 h-4 fill-current" />
                            Resume Sale in POS (Hold Queue)
                          </button>
                          <button
                            onClick={() => setSelectedFulfillTransfer(trf)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept &amp; Fulfill Order (Issue ETR)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL 1: NEW STOCK DISPATCH TRANSFER FROM POS INVENTORY */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-3xl w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] border-0 sm:border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-rose-500/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md text-rose-300 border border-white/20 flex items-center justify-center shadow-lg shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                    New Stock Dispatch Transfer
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-rose-200">
                    Add items directly from POS store inventory with dispatcher accountability
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Store Source & Destination Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Source Dispatch Store (From):
                  </label>
                  <select
                    value={dispatchFrom}
                    onChange={(e) => {
                      setDispatchFrom(e.target.value as LocationId);
                      setDispatchItems([]); // Reset items if store source changes
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Destination Store (To):
                  </label>
                  <select
                    value={dispatchTo}
                    onChange={(e) => setDispatchTo(e.target.value as LocationId)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: POS Item Catalog Selection */}
                <div className="space-y-3 border-r border-slate-100 pr-0 md:pr-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      Select Items at {locations.find(l => l.id === dispatchFrom)?.name}:
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {availableSourceProducts.length} In-Stock Batches
                    </span>
                  </div>

                  {/* Product Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search fabric SKU, name, color..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Catalog Item List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {availableSourceProducts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No in-stock items found at this source store location.
                      </p>
                    ) : (
                      availableSourceProducts.map((p) => {
                        const sourceStock = p.locationStock[dispatchFrom] || 0;
                        const addedItem = dispatchItems.find(i => i.batchId === p.id);

                        return (
                          <div
                            key={p.id}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-2 transition-all"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="font-mono">{p.sku}</span>
                                <span>•</span>
                                <span className="font-bold text-slate-700">{p.colorName}</span>
                              </div>
                              <span className="text-[10px] text-emerald-700 font-bold">
                                Available: {sourceStock} {p.unit}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddItemToDispatch(p)}
                              disabled={sourceStock <= 0}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-rose-600 disabled:opacity-30 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                            >
                              {addedItem ? `Added (${addedItem.quantity})` : '+ Add'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Dispatch Manifest Cart & Operator Accountability */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <PackageCheck className="w-4 h-4 text-rose-600" />
                        Dispatch Manifest Cart ({dispatchItems.length}):
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700">
                        KSh {totalDispatchVal.toLocaleString()}
                      </span>
                    </div>

                    {dispatchItems.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                        <Truck className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No items added to dispatch yet. Click '+ Add' on the left catalog.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {dispatchItems.map((item) => {
                          const p = products.find(prod => prod.id === item.batchId);
                          if (!p) return null;
                          const sourceStock = p.locationStock[dispatchFrom] || 0;

                          return (
                            <div
                              key={item.batchId}
                              className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                <span className="truncate max-w-[160px]">{p.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.batchId)}
                                  className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <label className="text-[10px] text-slate-500 font-bold">Qty:</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={sourceStock}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantity(item.batchId, Number(e.target.value))}
                                    className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-900"
                                  />
                                  <span className="text-[10px] font-bold text-slate-600">{p.unit}</span>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  KSh {(p.costPrice * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Accountability & Notes Block */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                        Waybill Dispatch Notes / Reference:
                      </label>
                      <input
                        type="text"
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        placeholder="e.g. Replenishing high-demand Fleece rolls for weekend sales"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-0.5">
                      <p className="font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Accountability Audit Logged:
                      </p>
                      <p className="text-[10px] font-semibold text-amber-800">
                        Dispatch Operator: <strong>{posSession?.isUnlocked ? `${posSession.operatorName} (${posSession.role})` : 'Super Admin / Controller'}</strong>
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDispatch}
                disabled={dispatchItems.length === 0}
                className="px-5 py-2.5 bg-slate-900 hover:bg-rose-600 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Execute Dispatch Transfer</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: FULFILL REROUTED ORDER */}
      {selectedFulfillTransfer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-md w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border-0 sm:border border-rose-100 animate-in fade-in zoom-in duration-200 overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Fulfill Rerouted Order Ticket ({selectedFulfillTransfer.id})
                </h3>
                <button
                  onClick={() => setSelectedFulfillTransfer(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Eastleigh Uniform Manufacturers"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Customer KRA PIN (Optional):
                  </label>
                  <input
                    type="text"
                    value={customerKraPin}
                    onChange={e => setCustomerKraPin(e.target.value)}
                    placeholder="e.g. P051119284K"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Payment Method Captured:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Cash">Cash Currency</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedFulfillTransfer(null)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFulfillRerouteSubmit}
                className="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Fulfill &amp; Generate ETR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WAYBILL ACCOUNTABILITY AUDIT MODAL */}
      {selectedWaybill && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-lg w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] border-0 sm:border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6 animate-scaleUp overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-600" />
                  <h3 className="font-black text-slate-900 text-base">
                    Official Transfer Waybill &amp; Audit Manifest
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedWaybill(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Waybill Document Body */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-sans text-xs">
                
                <DocumentHeader
                  variant="a4"
                  title="Official Inter-Store Waybill"
                  docNumber={selectedWaybill.trackingNumber || selectedWaybill.id}
                  docDate={selectedWaybill.dispatchedAt || selectedWaybill.requestedAt}
                  badgeText="INVENTORY WAYBILL"
                />

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Origin Store:</p>
                    <p className="font-extrabold text-slate-900">{locations.find(l => l.id === selectedWaybill.fromLocation)?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Destination Store:</p>
                    <p className="font-extrabold text-slate-900">{locations.find(l => l.id === selectedWaybill.toLocation)?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Dispatcher:</p>
                    <p className="font-bold text-slate-800">{selectedWaybill.requestedByOperator}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Timestamp:</p>
                    <p className="font-mono text-slate-800">{new Date(selectedWaybill.requestedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="font-bold text-slate-700 text-[10px] uppercase mb-1">Itemized Line Manifest:</p>
                  <div className="space-y-1">
                    {selectedWaybill.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-500">Unit Cost: KSh {item.unitCost.toLocaleString()}</p>
                        </div>
                        <span className="font-mono font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Double-Entry Ledger Verified
                  </p>
                  <p className="text-[10px] text-emerald-800">
                    Stock holding assets transferred from source account to destination holding asset with zero gross profit impact.
                  </p>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => exportInterStoreTransferWaybillPDF(selectedWaybill, etrConfig, locations, brandSettings)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF Waybill</span>
              </button>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Waybill</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
