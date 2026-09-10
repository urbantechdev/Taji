import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { playClickSound } from '../../utils/audio';
import {
  User,
  Phone,
  Mail,
  Lock,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const StorefrontCustomerAuthModal: React.FC = () => {
  const {
    isCustomerAuthModalOpen,
    setIsCustomerAuthModalOpen,
    loginWebsiteCustomer,
    registerWebsiteCustomer,
    brandSettings
  } = useERP();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration form fields
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [deliveryTown, setDeliveryTown] = useState('Nairobi');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [kraPin, setKraPin] = useState('');

  if (!isCustomerAuthModalOpen) return null;

  const brandName = brandSettings?.brandName || 'TAJI';

  // Check if current input in login field resembles an internal staff or admin email
  const isInputResemblingStaff =
    emailOrPhone.toLowerCase().includes('admin') ||
    emailOrPhone.toLowerCase().includes('accountant') ||
    emailOrPhone.toLowerCase().includes('cashier') ||
    emailOrPhone.toLowerCase().includes('feminiholdings') ||
    emailOrPhone.toLowerCase().includes('naisiae') ||
    emailOrPhone.toLowerCase().includes('mwkomu') ||
    emailOrPhone.toLowerCase().endsWith('@tajiknitters.com');

  const handleClose = () => {
    playClickSound();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCustomerAuthModalOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = loginWebsiteCustomer(emailOrPhone, password);
    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = registerWebsiteCustomer({
      name,
      phone: regPhone,
      email: regEmail,
      password: regPassword,
      deliveryCity: deliveryTown,
      deliveryAddress,
      kraPin
    });

    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  const handleQuickDemoCustomer = () => {
    playClickSound();
    setErrorMessage(null);
    const result = loginWebsiteCustomer('faith.wanjiku@gmail.com');
    if (result.success) {
      setSuccessMessage('Logged in as Faith Wanjiku (Retail Customer)');
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto"
        id="storefront-customer-auth-modal"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-rose-900 via-rose-800 to-pink-900 p-6 text-white overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-rose-100 text-[11px] font-bold tracking-wide">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                <span>Customer &amp; Shopper Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {mode === 'login' ? `Sign In to ${brandName}` : 'Create Shopper Account'}
              </h2>
              <p className="text-xs text-rose-200/90 leading-relaxed max-w-sm">
                Save delivery details, track your textile rolls &amp; fabrics, and enjoy streamlined MPESA checkout.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close modal"
              id="customer-auth-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Strict Private ERP Notice Badge */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-start gap-2 text-[11px] text-rose-100/90 bg-rose-950/40 rounded-xl p-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold text-amber-200">Public Customer Access Only:</span> Internal staff, administrator, and accountant accounts are strictly private and cannot authenticate on this website.
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-rose-100 bg-rose-50/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-white text-rose-900 shadow-xs border border-rose-200/80 font-black'
                : 'text-slate-600 hover:text-rose-800 hover:bg-white/60'
            }`}
            id="tab-customer-login"
          >
            <User className="w-4 h-4 text-rose-600" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white text-rose-900 shadow-xs border border-rose-200/80 font-black'
                : 'text-slate-600 hover:text-rose-800 hover:bg-white/60'
            }`}
            id="tab-customer-register"
          >
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>New Customer Account</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Error Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900 text-xs leading-relaxed"
              id="customer-auth-error-alert"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Access Warning: </span>
                {errorMessage}
              </div>
            </motion.div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold"
              id="customer-auth-success-alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Warning if input resembles staff */}
          {mode === 'login' && isInputResemblingStaff && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2 text-amber-900 text-xs leading-relaxed"
            >
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800">ERP Protection Active: </span>
                Company staff and administrators cannot log in from the public website. Please use an authorized internal enterprise terminal.
              </div>
            </motion.div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="form-customer-login">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Customer Email or Mobile Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or shopper@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                    id="input-customer-login-id"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your Kenyan mobile number or personal shopper email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password or PIN <span className="text-slate-400 font-normal">(Optional for quick sign in)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password if set"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                    id="input-customer-login-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-800 hover:to-pink-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                id="btn-submit-customer-login"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sign In to Customer Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Instant Demo Customer Button for Seamless Testing */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500 mb-2">Want to test the shopper experience instantly?</p>
                <button
                  type="button"
                  onClick={handleQuickDemoCustomer}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  id="btn-quick-demo-customer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>1-Click Test Login as Faith Wanjiku (Shopper)</span>
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" id="form-customer-register">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Customer / Business Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mary Achieng / Nairobi Tailors"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                    id="input-reg-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 0722 000 000"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                      id="input-reg-phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="shopper@domain.com"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                      id="input-reg-email"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Delivery Area
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={deliveryTown}
                      onChange={(e) => setDeliveryTown(e.target.value)}
                      placeholder="e.g. Nairobi CBD, Westlands, Thika"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                      id="input-reg-city"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KRA PIN <span className="text-slate-400 font-normal">(For Tax Invoices)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                      placeholder="e.g. A012345678X"
                      maxLength={11}
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all uppercase outline-none"
                      id="input-reg-krapin"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Address / Physical Building
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. River Road, Shop 14, Opposite Tea Room"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                  id="input-reg-address"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-800 hover:to-pink-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                id="btn-submit-customer-register"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Customer Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-rose-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>🔒 256-bit Encrypted Customer Data</span>
          <span className="font-semibold text-rose-700">Taji Retail &amp; Wholesale</span>
        </div>
      </motion.div>
    </div>
  );
};
