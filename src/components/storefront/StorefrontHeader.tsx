import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryType } from '../../types';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { BrandLogo } from '../common/BrandLogo';
import { StorefrontHamburgerDrawer } from './StorefrontHamburgerDrawer';
import { playClickSound } from '../../utils/audio';
import {
  ShoppingBag,
  Search,
  MapPin,
  Menu,
  X,
  Clock,
  ArrowRight,
  Lock,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface StorefrontHeaderProps {
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenContact: () => void;
  onOpenAdminPortal?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: 'all' | CategoryType;
  setSelectedCategory: (cat: 'all' | CategoryType) => void;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  onOpenCart,
  onOpenTrackOrder,
  onOpenContact,
  onOpenAdminPortal,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const {
    cart,
    brandSettings,
    products,
    websiteCustomer,
    logoutWebsiteCustomer,
    setIsCustomerAuthModalOpen,
    setIsCustomerProfileModalOpen
  } = useERP();

  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Total items in cart
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalAmount = cart.reduce((acc, item) => acc + (item.rollPricing?.totalPrice ?? (item.unitPrice * item.quantity)), 0);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;
  const brandName = brandSettings?.brandName || 'TAJI';
  const primaryColor = brandSettings?.primaryColor || '#B50044';

  const categories: { id: 'all' | CategoryType; label: string; count: number }[] = [
    { id: 'all', label: 'All Inventory', count: products.length },
    { id: 'Dereck', label: 'Dereck Weaves', count: products.filter(p => p.category === 'Dereck').length },
    { id: 'Fleece', label: 'Polar & Coral Fleece', count: products.filter(p => p.category === 'Fleece').length },
    { id: 'Yarns', label: 'Knitting Yarns & Cones', count: products.filter(p => p.category === 'Yarns').length },
  ];

  const handleLogout = () => {
    playClickSound();
    setIsUserDropdownOpen(false);
    logoutWebsiteCustomer();
  };

  const handleOpenLogin = () => {
    playClickSound();
    setIsCustomerAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    playClickSound();
    setIsUserDropdownOpen(false);
    setIsCustomerProfileModalOpen(true);
  };

  return (
    <header className="relative z-30 bg-white border-b border-rose-100 shadow-xs" id="storefront-header">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logo & Brand Identity */}
            <div 
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            >
              <BrandLogo
                logoUrl={displayLogo}
                brandName={brandName}
                size="sm"
                effect={brandSettings?.logoEffect || 'gleam'}
                primaryColor={primaryColor}
                showSparkle={true}
                interactive={true}
              />
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span 
                    className="text-lg sm:text-2xl font-black tracking-tight"
                    style={{ 
                      fontFamily: "'Audiowide', sans-serif",
                      color: primaryColor 
                    }}
                  >
                    {brandName}
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 bg-rose-50 text-rose-800 text-[10px] font-extrabold uppercase rounded-full border border-rose-200 tracking-wider">
                    Storefront
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide hidden lg:block">
                  Textile Enterprise • Dereck • Fleece • Yarns
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar Center (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Dereck weaves, polar fleece, yarn cones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-xl text-xs font-medium text-slate-900 transition-all outline-hidden shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Branches Button */}
            <button
              onClick={onOpenContact}
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50/60 rounded-xl transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Branches</span>
            </button>

            {/* USER PROFILE, LOGIN & LOGOUT SECTION */}
            {websiteCustomer ? (
              <div className="relative flex items-center gap-1" ref={userDropdownRef}>
                {/* Profile Pill Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsUserDropdownOpen(!isUserDropdownOpen);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                  id="storefront-user-profile-btn"
                  title={`Customer Account: ${websiteCustomer.name}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-pink-600 text-white font-black text-xs flex items-center justify-center relative shadow-xs shrink-0">
                    <span>{websiteCustomer.name.charAt(0).toUpperCase()}</span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[85px] md:max-w-[110px]">
                      {websiteCustomer.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize truncate max-w-[85px] md:max-w-[110px]">
                      Shopper
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Direct Quick 1-Click Logout Button (Desktop) */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:flex items-center p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out of Customer Account"
                  id="storefront-quick-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* User Dropdown Flyout */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-rose-100 p-2 z-50 space-y-1 divide-y divide-slate-100"
                    >
                      {/* Dropdown Header */}
                      <div className="p-2.5 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                            Customer Account
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded-full">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-900 truncate mt-1">
                          {websiteCustomer.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate font-mono">
                          {websiteCustomer.phone || websiteCustomer.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-md capitalize">
                          {websiteCustomer.deliveryCity || 'Retail Shopper'}
                        </span>
                      </div>

                      {/* Dropdown Menu Links */}
                      <div className="pt-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={handleOpenProfile}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-rose-600" />
                          <span>My Profile &amp; Addresses</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setIsUserDropdownOpen(false);
                            onOpenTrackOrder();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>Track My Orders</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                      {/* Dropdown Logout Action */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Unauthenticated / Guest: Customer Sign In Button */
              <button
                type="button"
                onClick={handleOpenLogin}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50/80 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
                id="storefront-login-btn"
                title="Customer Sign In / Register"
              >
                <LogIn className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Customer Sign In</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
              id="header-cart-button"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
              {cartTotalAmount > 0 && (
                <span className="hidden sm:inline font-mono font-normal opacity-90 pl-1 border-l border-white/30">
                  KSh {cartTotalAmount.toLocaleString()}
                </span>
              )}
            </button>

            {/* Primary Hamburger Trigger (Right Side) */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsHamburgerOpen(true);
              }}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all cursor-pointer shadow-2xs group active:scale-95 shrink-0"
              title="Open Navigation Menu"
              id="header-hamburger-button"
            >
              <Menu className="w-5 h-5 text-slate-700 group-hover:text-rose-700 transition-colors shrink-0" />
              <span className="hidden md:inline text-xs font-bold text-slate-800 group-hover:text-rose-700">
                Menu
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        <AnimatePresence>
          {isSearchExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden pt-3 overflow-hidden"
            >
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Dereck, Fleece, Yarns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs font-medium text-slate-900 outline-hidden"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 sm:pt-3 border-t border-slate-100 mt-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-transparent hover:border-rose-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide-out Hamburger Navigation & Account Drawer */}
      <StorefrontHamburgerDrawer
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCart={onOpenCart}
        onOpenTrackOrder={onOpenTrackOrder}
        onOpenContact={onOpenContact}
        onOpenAdminPortal={onOpenAdminPortal}
        cartItemCount={cartItemCount}
        cartTotalAmount={cartTotalAmount}
      />
    </header>
  );
};

