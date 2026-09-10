import React from 'react';
import { useERP } from '../../context/ERPContext';
import { playClickSound } from '../../utils/audio';
import {
  Store,
  Search,
  ShoppingBag,
  Truck,
  MapPin
} from 'lucide-react';

interface StorefrontMobileBottomNavProps {
  onOpenCatalog: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenContact: () => void;
  activeTab?: 'catalog' | 'search' | 'cart' | 'track' | 'contact';
}

/**
 * StorefrontMobileBottomNav
 * -------------------------------------------------------------
 * Fixed bottom navigation bar for mobile shoppers featuring an
 * architectural single wave curved top edge and quick access to
 * Catalog, Search, Cart (with live badge), Order Tracking, and Branches.
 */
export const StorefrontMobileBottomNav: React.FC<StorefrontMobileBottomNavProps> = ({
  onOpenCatalog,
  onOpenSearch,
  onOpenCart,
  onOpenTrackOrder,
  onOpenContact,
  activeTab = 'catalog'
}) => {
  const { cart } = useERP();

  // Total quantity in cart (supports integer or decimal kgs)
  const rawTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalItemsDisplay = rawTotalItems > 0
    ? (rawTotalItems % 1 === 0 ? rawTotalItems.toString() : rawTotalItems.toFixed(1))
    : null;

  return (
    <aside
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none select-none"
      id="storefront-mobile-bottom-nav"
      aria-label="Mobile Navigation"
    >
      <div className="relative w-full pointer-events-auto">
        {/* Single Wave Top Edge SVG */}
        <div className="w-full overflow-hidden leading-none -mb-[1px]">
          <svg
            viewBox="0 0 500 40"
            preserveAspectRatio="none"
            className="w-full h-8 block fill-white text-white drop-shadow-[0_-5px_8px_rgba(244,63,94,0.08)]"
            aria-hidden="true"
          >
            {/* Single Wave Body */}
            <path
              d="M 0,32 C 120,32 170,5 250,5 C 330,5 380,28 500,28 L 500,40 L 0,40 Z"
              fill="currentColor"
            />
            {/* Single Wave Rose Contour Stroke */}
            <path
              d="M 0,32 C 120,32 170,5 250,5 C 330,5 380,28 500,28"
              fill="none"
              stroke="#FECDD3" // rose-200
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Bottom Navigation Body */}
        <nav className="bg-white px-2 pt-0 pb-2.5 sm:pb-3 flex items-end justify-around border-t-0 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
          
          {/* 1. Catalog / Shop */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenCatalog();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
              activeTab === 'catalog'
                ? 'text-rose-700 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
            id="mobile-nav-catalog-btn"
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Catalog</span>
          </button>

          {/* 2. Search */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenSearch();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
              activeTab === 'search'
                ? 'text-rose-700 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
            id="mobile-nav-search-btn"
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Search</span>
          </button>

          {/* 3. Shopping Cart (Elevated at the Wave Peak) */}
          <div className="flex-1 flex justify-center -mt-5 relative z-10">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenCart();
              }}
              className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 via-rose-600 to-rose-700 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white"
              id="mobile-nav-cart-btn"
              title="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemsDisplay && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 bg-slate-900 text-white text-[10px] font-mono font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {totalItemsDisplay}
                </span>
              )}
            </button>
          </div>

          {/* 4. Live Order Tracker */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenTrackOrder();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
              activeTab === 'track'
                ? 'text-rose-700 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
            id="mobile-nav-track-btn"
          >
            <Truck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Track Order</span>
          </button>

          {/* 5. Branch Locations */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenContact();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
              activeTab === 'contact'
                ? 'text-rose-700 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
            id="mobile-nav-branches-btn"
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Branches</span>
          </button>

        </nav>
      </div>
    </aside>
  );
};
