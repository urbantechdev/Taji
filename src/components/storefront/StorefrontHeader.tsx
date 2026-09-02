import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryType } from '../../types';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import {
  ShoppingBag,
  Search,
  MapPin,
  Menu,
  X,
  Clock,
  ArrowRight
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
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const { cart, brandSettings, products } = useERP();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs" id="storefront-header">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-xs border border-rose-200 bg-white p-0.5 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={displayLogo}
                  alt={brandName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xl sm:text-2xl font-black tracking-tight"
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
                <p className="text-[10px] text-slate-500 font-medium tracking-wide hidden sm:block">
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
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Branches Button */}
            <button
              onClick={onOpenContact}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50/60 rounded-xl transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Branches</span>
            </button>

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

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 border-t border-slate-100 mt-2">
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

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-white border-b border-rose-100 px-6 py-5 space-y-4 shadow-xl"
          >
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Navigation</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-rose-50 font-bold text-slate-800 text-sm flex items-center justify-between"
              >
                <span>Browse All Fabrics ({products.length})</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('Dereck');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50 font-bold text-amber-900 text-sm flex items-center justify-between"
              >
                <span>Dereck Weaves</span>
                <span className="text-xs font-mono bg-amber-100 px-2 py-0.5 rounded">
                  {products.filter(p => p.category === 'Dereck').length} items
                </span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('Fleece');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-rose-50 font-bold text-rose-900 text-sm flex items-center justify-between"
              >
                <span>Polar &amp; Coral Fleece</span>
                <span className="text-xs font-mono bg-rose-100 px-2 py-0.5 rounded">
                  {products.filter(p => p.category === 'Fleece').length} items
                </span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('Yarns');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-indigo-50 font-bold text-indigo-900 text-sm flex items-center justify-between"
              >
                <span>Knitting Yarns &amp; Cones</span>
                <span className="text-xs font-mono bg-indigo-100 px-2 py-0.5 rounded">
                  {products.filter(p => p.category === 'Yarns').length} items
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenTrackOrder();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Track My Active Order</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Branch Locations &amp; Contacts</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
