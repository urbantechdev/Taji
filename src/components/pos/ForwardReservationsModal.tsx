import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  AlertCircle, 
  Package, 
  Receipt, 
  DollarSign, 
  User, 
  Phone, 
  CalendarDays, 
  Truck, 
  Layers, 
  X,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SaleOrder } from '../../types';

export const ForwardReservationsModal: React.FC = () => {
  const {
    isForwardReservationsModalOpen,
    setIsForwardReservationsModalOpen,
    orders,
    fulfillForwardReservation,
    cancelForwardReservation,
    locations,
    activeLocation,
    setSelectedReceipt
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reserved_active' | 'fulfilled' | 'cancelled'>('reserved_active');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<SaleOrder | null>(null);
  const [actionType, setActionType] = useState<'fulfill' | 'cancel' | null>(null);

  // Fulfillment Action Form State
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [finalPaymentRef, setFinalPaymentRef] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Cancellation Action Form State
  const [refundMethod, setRefundMethod] = useState<'cash' | 'mpesa' | 'bank' | 'store_credit'>('mpesa');
  const [cancellationReason, setCancellationReason] = useState('Customer cancelled reservation');

  if (!isForwardReservationsModalOpen) return null;

  // Filter reservations
  const allReservations = orders.filter(
    o => o.isForwardDated || o.documentType === 'advance_booking' || o.status === 'reserved' || o.reservationStatus
  );

  const filteredReservations = allReservations.filter(ord => {
    const matchesSearch = 
      (ord.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'all' 
        ? true 
        : filterStatus === 'reserved_active' 
        ? ord.status === 'reserved' || ord.reservationStatus === 'reserved_active'
        : filterStatus === 'fulfilled'
        ? ord.status === 'completed' || ord.reservationStatus === 'fulfilled'
        : ord.status === 'cancelled' || ord.reservationStatus === 'cancelled';

    const matchesLoc = filterLocation === 'all' || ord.originLocation === filterLocation || ord.fulfilledByLocation === filterLocation;

    return matchesSearch && matchesStatus && matchesLoc;
  });

  const activeReservationsCount = allReservations.filter(o => o.status === 'reserved' || o.reservationStatus === 'reserved_active').length;
  const fulfilledCount = allReservations.filter(o => o.status === 'completed' || o.reservationStatus === 'fulfilled').length;
  const cancelledCount = allReservations.filter(o => o.status === 'cancelled' || o.reservationStatus === 'cancelled').length;

  const totalReservedValue = allReservations
    .filter(o => o.status === 'reserved' || o.reservationStatus === 'reserved_active')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalDepositsHeld = allReservations
    .filter(o => o.status === 'reserved' || o.reservationStatus === 'reserved_active')
    .reduce((sum, o) => sum + (o.advanceDepositPaid || 0), 0);

  // Execute Fulfillment
  const handleConfirmFulfill = () => {
    if (!selectedOrderForAction) return;
    setIsProcessing(true);
    setActionFeedback(null);

    try {
      const res = fulfillForwardReservation(
        selectedOrderForAction.id,
        finalPaymentMethod,
        finalPaymentRef,
        fulfillmentNotes
      );

      if (res.success) {
        setActionFeedback({ success: true, message: res.message });
        setTimeout(() => {
          setSelectedOrderForAction(null);
          setActionType(null);
          setIsProcessing(false);
        }, 1200);
      } else {
        setActionFeedback({ success: false, message: res.message });
        setIsProcessing(false);
      }
    } catch (e: any) {
      setActionFeedback({ success: false, message: e?.message || 'Error executing fulfillment.' });
      setIsProcessing(false);
    }
  };

  // Execute Cancellation
  const handleConfirmCancel = () => {
    if (!selectedOrderForAction) return;
    setIsProcessing(true);
    setActionFeedback(null);

    try {
      const res = cancelForwardReservation(
        selectedOrderForAction.id,
        refundMethod,
        cancellationReason
      );

      if (res.success) {
        setActionFeedback({ success: true, message: res.message });
        setTimeout(() => {
          setSelectedOrderForAction(null);
          setActionType(null);
          setIsProcessing(false);
        }, 1200);
      } else {
        setActionFeedback({ success: false, message: res.message });
        setIsProcessing(false);
      }
    } catch (e: any) {
      setActionFeedback({ success: false, message: e?.message || 'Error cancelling reservation.' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Forward-Dated Reservations & Advance Orders
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                  {activeReservationsCount} Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stock is locked in reservation. Revenue & KRA eTIMS Tax Invoices are deferred until target fulfillment date.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedOrderForAction(null);
              setActionType(null);
              setIsForwardReservationsModalOpen(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Active Bookings</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{activeReservationsCount} Orders</span>
            </div>
            <Clock className="w-5 h-5 text-amber-500/60" />
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Reserved Stock Value</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">KSh {totalReservedValue.toLocaleString()}</span>
            </div>
            <Package className="w-5 h-5 text-blue-500/60" />
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Deposits Held (Liability 2100)</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KSh {totalDepositsHeld.toLocaleString()}</span>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-500/60" />
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Fulfilled to Date</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{fulfilledCount} Completed</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-purple-500/60" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, booking ref, item or dye lot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setFilterStatus('reserved_active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'reserved_active'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Active ({activeReservationsCount})
              </button>
              <button
                onClick={() => setFilterStatus('fulfilled')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'fulfilled'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Fulfilled ({fulfilledCount})
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'cancelled'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>

            <select
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Locations</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body: List + Action View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {actionFeedback && (
            <div className={`p-3.5 rounded-xl text-sm font-medium border flex items-center gap-2 ${
              actionFeedback.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {actionFeedback.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Action Dialog Drawer: When an order is selected for Fulfillment or Cancellation */}
          {selectedOrderForAction && actionType === 'fulfill' && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/30 mb-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Fulfill & Release Order: {selectedOrderForAction.receiptNumber}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Customer: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrderForAction.customerName}</span> | Target Date: {selectedOrderForAction.forwardFulfillmentDate || 'Today'}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedOrderForAction(null); setActionType(null); }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Total Order Amount</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">KSh {selectedOrderForAction.grandTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deposit Already Paid</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">KSh {(selectedOrderForAction.advanceDepositPaid || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Balance Due Now</span>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">KSh {(selectedOrderForAction.balanceDue || 0).toLocaleString()}</span>
                </div>
              </div>

              {(selectedOrderForAction.balanceDue || 0) > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Balance Payment Channel</label>
                    <select
                      value={finalPaymentMethod}
                      onChange={e => setFinalPaymentMethod(e.target.value as any)}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    >
                      <option value="M-Pesa">M-Pesa Paybill / Till</option>
                      <option value="Cash">Cash Drawer</option>
                      <option value="Bank Transfer">Bank Transfer / EFT</option>
                      <option value="Card">Card POS</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Reference / Txn Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. QKH87219..."
                      value={finalPaymentRef}
                      onChange={e => setFinalPaymentRef(e.target.value)}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="mb-3 text-xs">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Dispatch / Fulfillment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Released directly to driver, verified yarn cone tare and meter count..."
                  value={fulfillmentNotes}
                  onChange={e => setFulfillmentNotes(e.target.value)}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Will generate KRA eTIMS Tax Invoice & deduct physical stock.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedOrderForAction(null); setActionType(null); }}
                    className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFulfill}
                    disabled={isProcessing}
                    className="px-4 py-1.5 text-xs rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Fulfillment & Issue ETR Invoice'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Dialog Drawer: Cancellation */}
          {selectedOrderForAction && actionType === 'cancel' && (
            <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50/60 dark:bg-rose-950/30 mb-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Cancel Reservation: {selectedOrderForAction.receiptNumber}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Will release reserved inventory back to sellable floor.
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedOrderForAction(null); setActionType(null); }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(selectedOrderForAction.advanceDepositPaid || 0) > 0 && (
                <div className="my-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-rose-600 block mb-1">
                    Refund Required: KSh {(selectedOrderForAction.advanceDepositPaid || 0).toLocaleString()}
                  </span>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value as any)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="mpesa">M-Pesa Reversal / Refund</option>
                    <option value="cash">Cash Drawer Refund</option>
                    <option value="bank">Bank Transfer Refund</option>
                    <option value="store_credit">Customer Store Credit Account</option>
                  </select>
                </div>
              )}

              <div className="mb-3 text-xs">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Cancellation Reason</label>
                <input
                  type="text"
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200 dark:border-rose-800/60">
                <button
                  onClick={() => { setSelectedOrderForAction(null); setActionType(null); }}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Cancelling...' : 'Confirm Cancellation & Release Stock'}
                </button>
              </div>
            </div>
          )}

          {/* Reservations Card Table */}
          {filteredReservations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-sm">No forward-dated reservations found.</p>
              <p className="text-xs mt-1">Book an advance order from the POS Checkout to lock stock for future dates.</p>
            </div>
          ) : (
            filteredReservations.map(order => {
              const isActive = order.status === 'reserved' || order.reservationStatus === 'reserved_active';
              const isFulfilled = order.status === 'completed' || order.reservationStatus === 'fulfilled';
              const isCancelled = order.status === 'cancelled' || order.reservationStatus === 'cancelled';
              const loc = locations.find(l => l.id === order.originLocation);

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800/90 border-amber-200 dark:border-amber-900/50 shadow-sm hover:border-amber-400'
                      : isFulfilled
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-90'
                      : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {order.receiptNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                          : isFulfilled
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                          : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700'
                      }`}>
                        {isActive ? 'Active Reservation' : isFulfilled ? 'Fulfilled & Dispatched' : 'Cancelled'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {loc?.name || order.originLocation}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Value</span>
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        KSh {order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 mb-3">
                    <div>
                      <span className="text-slate-400 block">Customer</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{order.customerName || 'Walk-in Client'}</span>
                      {order.customerPhone && <span className="text-[11px] text-slate-400 block">{order.customerPhone}</span>}
                    </div>

                    <div>
                      <span className="text-slate-400 block">Target Fulfillment</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {order.forwardFulfillmentDate || 'Standard Delivery'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Deposit Received</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        KSh {(order.advanceDepositPaid || 0).toLocaleString()} ({order.depositPaymentMethod || order.paymentMethod})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Balance Pending</span>
                      <span className={`font-semibold ${
                        (order.balanceDue || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                      }`}>
                        KSh {(order.balanceDue || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Line Items Reserved */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Reserved Items ({order.items.length} lines):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                        >
                          <Package className="w-3 h-3 text-amber-500" />
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-slate-400">x {item.quantity} {item.unit}</span>
                          {item.dyeLot && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">Lot: {item.dyeLot}</span>}
                          <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">KSh {item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.fulfillmentNotes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3">
                      Note: {order.fulfillmentNotes}
                    </p>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Booked on: {new Date(order.timestamp).toLocaleDateString()} by {order.operatorName}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Booking Ticket
                      </button>

                      {isActive && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedOrderForAction(order);
                              setActionType('cancel');
                              setActionFeedback(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 font-medium transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrderForAction(order);
                              setActionType('fulfill');
                              setActionFeedback(null);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fulfill & Release
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>KRA eTIMS Fiscal compliance active: invoices generated upon dispatch.</span>
          </div>
          <button
            onClick={() => {
              setSelectedOrderForAction(null);
              setActionType(null);
              setIsForwardReservationsModalOpen(false);
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
