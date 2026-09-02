import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { SaleOrder } from '../../types';
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  MapPin,
  MessageCircle,
  FileText,
  AlertCircle
} from 'lucide-react';

interface StorefrontOrderTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorefrontOrderTracker: React.FC<StorefrontOrderTrackerProps> = ({
  isOpen,
  onClose
}) => {
  const { orders } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<SaleOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const matched = orders.find(o => 
      o.receiptNumber.toLowerCase().includes(q) || 
      o.id.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q))
    );

    setSearchedOrder(matched || null);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'completed': return 4;
      case 'dispatched': return 3;
      case 'held': return 2;
      default: return 1;
    }
  };

  const currentStep = searchedOrder ? getStatusStep(searchedOrder.status) : 1;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
        id="storefront-order-tracker"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Track Textile Order</h3>
                <p className="text-xs text-slate-500">Live KRA TIMS &amp; Branch Dispatch Status</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Enter Order Number or Phone Number:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-8891 or 0700111000"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Track
                </button>
              </div>
            </form>

            {/* Results Section */}
            {hasSearched && searchedOrder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Order Summary Header */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Order Number</span>
                      <p className="text-sm font-black font-mono text-rose-700">{searchedOrder.receiptNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] uppercase">
                      {searchedOrder.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Customer:</span>
                      <span className="font-bold text-slate-800">{searchedOrder.customerName || 'Retail Customer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Amount:</span>
                      <span className="font-mono font-bold text-slate-900">KSh {searchedOrder.grandTotal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fulfillment Location:</span>
                      <span className="font-semibold text-slate-800 capitalize">{searchedOrder.fulfilledByLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Date Placed:</span>
                      <span className="text-slate-700">{new Date(searchedOrder.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Steps Visualizer */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fulfillment Timeline
                  </h4>

                  <div className="space-y-3">
                    {[
                      { step: 1, title: 'Order Received & Fiscalized', desc: 'ETR invoice logged and stock reserved' },
                      { step: 2, title: 'Fabric Cutting & Batch Allocation', desc: 'Textile roll cut and tare weight checked' },
                      { step: 3, title: 'Packaging & Dispatch Ready', desc: 'Securely wrapped and assigned to courier/branch' },
                      { step: 4, title: 'Completed & Delivered', desc: 'Handed over to customer / verified' },
                    ].map((s) => {
                      const isComplete = currentStep >= s.step;
                      return (
                        <div key={s.step} className="flex items-start gap-3 text-xs">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                            isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                          </div>
                          <div>
                            <p className={`font-bold ${isComplete ? 'text-slate-900' : 'text-slate-400'}`}>
                              {s.title}
                            </p>
                            <p className="text-[11px] text-slate-500">{s.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct WhatsApp Follow-up */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/254700111000?text=${encodeURIComponent('Hello Taji, checking status of order #' + searchedOrder.receiptNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire Live on WhatsApp</span>
                  </a>
                </div>
              </motion.div>
            )}

            {hasSearched && !searchedOrder && (
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="text-xs font-bold text-rose-900">No matching order found</h4>
                <p className="text-[11px] text-rose-700">
                  Please verify your Order Number (e.g. INV-2026-XXXX) or the phone number used at checkout.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
