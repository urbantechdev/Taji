import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { playClickSound } from '../../utils/audio';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  Clock,
  LogOut,
  X,
  Check,
  Edit2,
  Save,
  PackageCheck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface StorefrontCustomerProfileModalProps {
  onOpenOrderTracker?: () => void;
}

export const StorefrontCustomerProfileModal: React.FC<StorefrontCustomerProfileModalProps> = ({
  onOpenOrderTracker
}) => {
  const {
    websiteCustomer,
    isCustomerProfileModalOpen,
    setIsCustomerProfileModalOpen,
    updateWebsiteCustomer,
    logoutWebsiteCustomer,
    orders
  } = useERP();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(websiteCustomer?.name || '');
  const [phone, setPhone] = useState(websiteCustomer?.phone || '');
  const [email, setEmail] = useState(websiteCustomer?.email || '');
  const [deliveryCity, setDeliveryCity] = useState(websiteCustomer?.deliveryCity || 'Nairobi');
  const [deliveryAddress, setDeliveryAddress] = useState(websiteCustomer?.deliveryAddress || '');
  const [kraPin, setKraPin] = useState(websiteCustomer?.kraPin || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isCustomerProfileModalOpen || !websiteCustomer) return null;

  // Filter orders placed by this customer (matching phone or email)
  const cleanPhone = (websiteCustomer.phone || '').replace(/\D/g, '');
  const customerOrders = orders.filter(o => {
    const oPhone = (o.customerPhone || '').replace(/\D/g, '');
    const oEmail = (o.customerEmail || '').toLowerCase();
    const isPhoneMatch = cleanPhone.length >= 6 && oPhone.includes(cleanPhone);
    const isEmailMatch = Boolean(websiteCustomer.email && oEmail === websiteCustomer.email.toLowerCase());
    return isPhoneMatch || isEmailMatch;
  });

  const handleClose = () => {
    playClickSound();
    setIsEditing(false);
    setSavedSuccess(false);
    setIsCustomerProfileModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    updateWebsiteCustomer({
      name,
      phone,
      email,
      deliveryCity,
      deliveryAddress,
      kraPin
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogout = () => {
    playClickSound();
    logoutWebsiteCustomer();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto"
        id="storefront-customer-profile-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 p-6 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner">
                {websiteCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>Verified Shopper Account</span>
                </div>
                <h2 className="text-xl font-black text-white">{websiteCustomer.name}</h2>
                <p className="text-xs text-rose-200 font-mono">{websiteCustomer.phone || websiteCustomer.email}</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Customer delivery details updated successfully!</span>
            </div>
          )}

          {/* Customer Delivery & Contact Profile */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Delivery Details &amp; Contact
              </span>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Info</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                    <p className="font-semibold text-slate-900">{websiteCustomer.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                    <p className="font-semibold text-slate-900 truncate">{websiteCustomer.email || 'None'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Area</p>
                    <p className="font-semibold text-slate-900">{websiteCustomer.deliveryCity || 'Nairobi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">KRA PIN</p>
                    <p className="font-semibold text-slate-900 font-mono">{websiteCustomer.kraPin || 'Unspecified'}</p>
                  </div>
                </div>

                {websiteCustomer.deliveryAddress && (
                  <div className="sm:col-span-2 flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Physical Address</p>
                      <p className="font-semibold text-slate-900">{websiteCustomer.deliveryAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery City/Town</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={e => setDeliveryCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. River Road, Shop 14"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </form>
            )}
          </div>

          {/* Customer Orders History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                <span>My Recent Orders ({customerOrders.length})</span>
              </h3>
              {onOpenOrderTracker && (
                <button
                  onClick={() => {
                    handleClose();
                    onOpenOrderTracker();
                  }}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Track Live Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {customerOrders.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Orders Placed Yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your online textile orders will appear here automatically when checked out.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerOrders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-rose-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">#{order.receiptNumber}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{order.items.length} items</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 font-mono">
                        KSh {order.grandTotal.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{order.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 text-rose-700 hover:bg-rose-100/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-customer-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Customer Account</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
