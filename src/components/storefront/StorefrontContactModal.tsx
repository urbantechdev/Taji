import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Building,
  Truck,
  ShieldCheck
} from 'lucide-react';

interface StorefrontContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorefrontContactModal: React.FC<StorefrontContactModalProps> = ({
  isOpen,
  onClose
}) => {
  const { locations, brandSettings } = useERP();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
        id="storefront-contact-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Branch Locations &amp; Customer Support</h3>
                <p className="text-xs text-slate-500">Nairobi Store Direct &amp; Countrywide Inquiries</p>
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
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            
            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="tel:+254700111000"
                className="p-4 bg-rose-50/60 hover:bg-rose-100/70 rounded-2xl border border-rose-200 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Direct Phone</span>
                  <p className="font-bold text-slate-900 text-sm font-mono">+254 700 111 000</p>
                </div>
              </a>

              <a
                href="https://wa.me/254700111000"
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-emerald-50/60 hover:bg-emerald-100/70 rounded-2xl border border-emerald-200 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">WhatsApp Orders</span>
                  <p className="font-bold text-emerald-800 text-sm">Chat with Sales</p>
                </div>
              </a>

              <a
                href="mailto:orders@taji.co.ke"
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Email Desk</span>
                  <p className="font-bold text-slate-900 text-xs truncate">orders@taji.co.ke</p>
                </div>
              </a>
            </div>

            {/* Branch Directory Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Store Branches &amp; Collection Centers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-rose-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Building className="w-4 h-4 text-rose-600" />
                        <span>{loc.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md uppercase">
                        {loc.type}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">
                      {loc.address}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{loc.phone || '+254 700 111 000'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Clock className="w-3 h-3" />
                        <span>8:00 AM – 6:00 PM</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Hours & Dispatch Logistics */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Business Working Hours</span>
                </h5>
                <p className="text-slate-600 text-[11px]">
                  <strong>Monday – Friday:</strong> 8:00 AM – 6:00 PM<br />
                  <strong>Saturday:</strong> 8:30 AM – 4:00 PM<br />
                  <strong>Sunday &amp; Public Holidays:</strong> Closed / Online Order Dispatch
                </p>
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-rose-600" />
                  <span>Countrywide Parcel Logistics</span>
                </h5>
                <p className="text-slate-600 text-[11px]">
                  Daily scheduled parcel dispatches via <strong>Fargo Courier, Speedaf, G4S, Guardian, and Nairobi CBD Matatu Express Parcels</strong>.
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
