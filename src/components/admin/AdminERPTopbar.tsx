import React from 'react';
import {
  Menu,
  Plus,
  CreditCard,
  Boxes,
  Store,
  Building2,
  Receipt,
  Users,
  Factory,
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Phone,
  ArrowUpRight,
  User,
  LogOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ERPTabType } from './AdminERPSidebar';
import { useERP } from '../../context/ERPContext';
import { NasisiLogo } from '../NasisiLogo';

interface AdminERPTopbarProps {
  activeTab: ERPTabType;
  onOpenMobileMenu: () => void;
  onOpenNewDocModal: (type?: 'invoice' | 'quotation' | 'receipt' | 'delivery_note') => void;
  onOpenNewPaymentModal: () => void;
  onOpenNewInventoryModal: () => void;
  onOpenPostProductModal?: () => void;
  onSwitchToStorefront: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
}

export const AdminERPTopbar: React.FC<AdminERPTopbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenNewDocModal,
  onOpenNewPaymentModal,
  onOpenNewInventoryModal,
  onOpenPostProductModal,
  onSwitchToStorefront,
  onOpenProfileModal,
  onLogout,
}) => {
  const { businessProfile, currentUser } = useERP();

  return (
    <header className="fixed top-0 left-0 right-0 h-32 bg-white text-slate-900 z-40 select-none">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6 relative z-10">
        {/* Left: Vertically Centered Logo & Title Block */}
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          {/* Mobile hamburger menu toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Logo & Enterprise Title Brand Group */}
          <div className="flex items-center gap-5">
            <NasisiLogo size="2xl" className="scale-100 origin-left" />
            <div className="hidden sm:flex flex-col border-l-2 border-slate-200 pl-4 py-1">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-wider uppercase text-[#06163c] leading-tight font-['Outfit']">
                  Enterprise ERP
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                  PRO
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-600 font-bold leading-tight mt-0.5">
                ● Kenya Tax Engine (Ksh)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Badges and Action Controls (Clean 2-tier stacked right block) */}
        <div className="flex flex-col items-end justify-center gap-2 sm:gap-2.5 py-1">
          {/* Top Tier: Customer Storefront Switcher & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Storefront Switcher */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onSwitchToStorefront}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Switch to Customer Storefront Catalog & Design Studio"
            >
              <Store className="w-4 h-4 text-[#06163c]" />
              <span className="hidden sm:inline">Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </motion.button>

            {/* Admin User Profile & Logout Widget */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200">
                {/* Profile Pill */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onOpenProfileModal}
                  className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-all cursor-pointer shadow-2xs group"
                  title="View & Edit Administrator Profile"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="font-bold text-slate-800 text-[11px] block leading-tight group-hover:text-blue-600 transition-colors">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                </motion.button>

                {/* Direct Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
                  title="Log out of Enterprise Admin"
                  aria-label="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            )}
          </div>

          {/* Bottom Tier: Fast-Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Post Garment Product Live */}
            {onOpenPostProductModal && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onOpenPostProductModal}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 hover:from-blue-600 hover:to-sky-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer border border-sky-400/30"
                title="Publish a new Kenyan uniform/garment SKU live to customer storefront catalog"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span className="hidden sm:inline">+ Post Product</span>
                <span className="sm:hidden">+ Product</span>
              </motion.button>
            )}

            {/* Quick Create Invoice */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => onOpenNewDocModal('invoice')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Create Tax Invoice"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </motion.button>

            {/* Quick Record M-Pesa Payment */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onOpenNewPaymentModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Record M-Pesa or Bank payment & issue Official Receipt"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Record M-Pesa</span>
              <span className="sm:hidden">M-Pesa</span>
            </motion.button>

            {/* Quick Add Stock */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onOpenNewInventoryModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Add new inventory SKU"
            >
              <Boxes className="w-4 h-4 text-slate-600" />
              <span>+ Add SKU</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Edge: Distinct Single Wave Curve with Vivid Blue & Shadow Smoke Mist Aura moving from Left to Right */}
      <div className="absolute top-full left-0 right-0 pointer-events-none overflow-hidden z-20 -mt-[1px] h-16 sm:h-20">
        {/* Layer 1: Ambient Glowing Blue & Dark Shadow Smoke / Mist Layer moving continuously Left to Right */}
        <div className="absolute -top-3 inset-x-0 h-14 bg-gradient-to-r from-slate-950/20 via-blue-900/25 to-slate-950/20 blur-2xl opacity-90 pointer-events-none" />
        <div className="absolute -top-1 inset-x-0 h-10 bg-gradient-to-r from-cyan-400/30 via-blue-500/40 to-sky-400/30 blur-xl opacity-90" />
        
        {/* Continuous Left-to-Right Flowing Smoke Plumes */}
        <div className="absolute top-0 -left-48 w-[400px] sm:w-[550px] h-9 bg-gradient-to-r from-transparent via-cyan-400/45 to-sky-300/40 rounded-full blur-xl animate-smoke-l2r-1" />
        <div className="absolute top-1 -left-64 w-[500px] sm:w-[650px] h-11 bg-gradient-to-r from-transparent via-blue-600/35 to-indigo-500/30 rounded-full blur-2xl animate-smoke-l2r-2" />
        <div className="absolute top-2 -left-40 w-[350px] sm:w-[480px] h-8 bg-gradient-to-r from-transparent via-sky-400/45 to-teal-300/40 rounded-full blur-lg animate-smoke-l2r-3" />
        <div className="absolute -top-1 -left-72 w-[450px] sm:w-[600px] h-10 bg-gradient-to-r from-transparent via-slate-950/35 to-blue-900/30 rounded-full blur-2xl animate-smoke-l2r-fast" />

        {/* Layer 2: Pronounced Single Wave SVG Line with Blue Neon Stroke & Drop Shadow */}
        <svg
          viewBox="0 0 1440 56"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-10 block filter drop-shadow-[0_6px_14px_rgba(14,165,233,0.55)] drop-shadow-[0_2px_6px_rgba(37,99,235,0.7)]"
        >
          <defs>
            <linearGradient id="topbarWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="60%" stopColor="#2563eb" stopOpacity="1" />
              <stop offset="85%" stopColor="#0ea5e9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="topbarWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Wave Body fill seamlessly joining the white topbar container */}
          <path
            d="M 0,0 L 1440,0 L 1440,44 C 1040,6 400,56 0,16 Z"
            fill="url(#topbarWaveFill)"
          />
          {/* Glowing Single Wave Crest Line */}
          <path
            d="M 0,16 C 400,56 1040,6 1440,44"
            stroke="url(#topbarWaveGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </header>
  );
};
