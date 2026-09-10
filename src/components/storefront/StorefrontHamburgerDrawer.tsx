import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { CategoryType } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playClickSound } from '../../utils/audio';
import {
  X,
  User,
  LogIn,
  LogOut,
  ShoppingBag,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface StorefrontHamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: 'all' | CategoryType; label: string; count: number }[];
  selectedCategory: 'all' | CategoryType;
  onSelectCategory: (cat: 'all' | CategoryType) => void;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenContact: () => void;
  onOpenAdminPortal?: () => void;
  cartItemCount: number;
  cartTotalAmount: number;
}

export const StorefrontHamburgerDrawer: React.FC<StorefrontHamburgerDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenCart,
  onOpenTrackOrder,
  onOpenContact,
  onOpenAdminPortal,
  cartItemCount,
  cartTotalAmount
}) => {
  const {
    websiteCustomer,
    logoutWebsiteCustomer,
    setIsCustomerAuthModalOpen,
    setIsCustomerProfileModalOpen,
    brandSettings,
    products
  } = useERP();

  const displayLogo = brandSettings?.logoUrl || tajiLogo;
  const brandName = brandSettings?.brandName || 'TAJI';
  const primaryColor = brandSettings?.primaryColor || '#B50044';

  const handleLogout = () => {
    playClickSound();
    logoutWebsiteCustomer();
    onClose();
  };

  const handleOpenLogin = () => {
    playClickSound();
    setIsCustomerAuthModalOpen(true);
    onClose();
  };

  const handleOpenProfile = () => {
    playClickSound();
    setIsCustomerProfileModalOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" id="storefront-hamburger-menu-drawer">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Drawer Slide-in Container (Right side) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col h-full z-10 overflow-hidden ml-auto"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-rose-100 bg-gradient-to-r from-rose-50/70 via-white to-pink-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo
                  logoUrl={displayLogo}
                  brandName={brandName}
                  size="sm"
                  effect="gleam"
                  primaryColor={primaryColor}
                  showSparkle={true}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-lg font-black tracking-tight"
                      style={{
                        fontFamily: "'Audiowide', sans-serif",
                        color: primaryColor
                      }}
                    >
                      {brandName}
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 rounded">
                      Navigation
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Textile Enterprise Portal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 sm:p-5 space-y-5">
              
              {/* 1. USER PROFILE & AUTHENTICATION SECTION */}
              <div className="space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Customer Account
                  </span>
                  {websiteCustomer ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified Shopper
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      Guest Shopper
                    </span>
                  )}
                </div>

                {websiteCustomer ? (
                  <div className="p-3.5 bg-gradient-to-br from-rose-50/60 to-slate-50 rounded-2xl border border-rose-100 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {websiteCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {websiteCustomer.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate font-mono">
                          {websiteCustomer.phone || websiteCustomer.email}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full capitalize">
                            Shopper
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {websiteCustomer.deliveryCity || 'Nairobi'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile & Logout Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-rose-600" />
                        <span>My Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Customer &amp; Shopper Portal
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Save delivery addresses &amp; track fabric orders
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenLogin}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
                      id="drawer-customer-login-btn"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Customer Sign In / Register</span>
                    </button>

                    <p className="text-[10px] text-slate-400 text-center leading-tight">
                      🔒 Private Notice: Staff and ERP login are restricted to internal terminals.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. FABRIC CATALOG CATEGORIES */}
              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Fabric Collections &amp; Inventory
                </p>

                <div className="space-y-1.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onSelectCategory(cat.id);
                          onClose();
                          const el = document.getElementById('storefront-catalog');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-rose-50/70 text-slate-800 hover:text-rose-700 border border-slate-100 hover:border-rose-200'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.label}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {cat.count}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. SHOPPER SERVICES & SHORTCUTS */}
              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Orders &amp; Customer Support
                </p>

                <div className="space-y-2">
                  {/* Cart Summary */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenCart();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-rose-600" />
                      <span>Shopping Cart</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {cartItemCount > 0 ? (
                        <span className="font-mono text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          KSh {cartTotalAmount.toLocaleString()} ({cartItemCount})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Empty</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>

                  {/* Track Active Order */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenTrackOrder();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>Track Active Order (ETR Receipt)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Branch Locations */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenContact();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Branch Locations &amp; Wholesale Inquiries</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* 4. BUSINESS & TAX ASSURANCE INFO */}
              <div className="pt-4">
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-[11px] text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>KRA eTIMS Validated Textile Partner</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Official fiscal receipts issued for every order. Pickup available at Nairobi Main Store &amp; River Road Sales Shop.
                  </p>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
              <span>{brandName} Textile Enterprise © 2026</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
