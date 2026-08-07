import React from 'react';
import { motion } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { NavTab } from './Sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  Receipt,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  UserCheck,
  Building2,
  Mail
} from 'lucide-react';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  highlight?: boolean;
}

interface DesktopBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const DesktopBottomNav: React.FC<DesktopBottomNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const {
    transfers,
    orders,
    activeLocation,
    brandSettings,
    currentUser,
    isSuperAdmin,
    unreadMailCount
  } = useERP();

  const pendingTransfersCount = transfers.filter(
    t => t.status === 'pending_approval' || t.status === 'dispatched'
  ).length;

  const todayOrdersCount = orders.length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Admin Hub',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'POS Register',
      icon: ShoppingCart,
      badge: todayOrdersCount > 0 ? todayOrdersCount : undefined,
      highlight: true
    },
    {
      id: 'catalog',
      label: 'Stock Catalog',
      icon: Package,
    },
    {
      id: 'transfers',
      label: 'Inter-Store',
      icon: ArrowLeftRight,
      badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined
    },
    {
      id: 'etr',
      label: 'TIMS ETR',
      icon: Receipt,
    },
    {
      id: 'ledger',
      label: 'P&L Ledger',
      icon: FileSpreadsheet,
    },
    {
      id: 'operators',
      label: 'POS Team',
      icon: UserCheck,
    },
    {
      id: 'payroll',
      label: 'HR Payroll',
      icon: Users,
    },
    {
      id: 'gmail',
      label: 'Messages',
      icon: Mail,
      badge: (unreadMailCount || 0) > 0 ? unreadMailCount : undefined
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
    }
  ];

  const activeLocationName =
    activeLocation === 'main_store'
      ? 'Main Warehouse'
      : activeLocation === 'sales_shop'
      ? 'Sales Shop'
      : activeLocation === 'store_1'
      ? 'Store 1'
      : 'Store 2';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full hidden md:block pointer-events-auto transition-all duration-300">
      {/* Single Wave Curved SVG Top Edge */}
      <div className="relative w-full h-3 -mb-1 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full text-white drop-shadow-[0_-2px_4px_rgba(0,0,0,0.02)]"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Smooth Single Wave Fill */}
          <path
            d="M 0,24 C 420,52 1020,-8 1440,24 L 1440,48 L 0,48 Z"
            fill="currentColor"
          />
          {/* Subtle Rose Wave Contour Line */}
          <path
            d="M 0,24 C 420,52 1020,-8 1440,24"
            stroke="rgba(244, 63, 94, 0.25)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Main Sleek White Bar Container with 100% Increased Height */}
      <div className="w-full bg-white text-slate-900 border-t border-slate-100/80 shadow-[0_-12px_30px_rgba(0,0,0,0.06)] px-4 lg:px-8 py-3.5 min-h-[124px] flex items-center justify-between gap-4">
        
        {/* Brand Info & Active Location (Left of Nav) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 pr-4 border-r border-slate-200/80">
          <div className="space-y-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {brandSettings?.brandName || 'Zamoda'}
              </span>
              <span className="text-[9px] font-mono font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                ERP
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-bold text-slate-700">{activeLocationName}</span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Dock with doubled height buttons */}
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar py-1 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative group h-16 lg:h-18 px-4 lg:px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/35 ring-2 ring-rose-400/80'
                    : item.highlight
                    ? 'bg-rose-50 text-rose-800 border-2 border-rose-300/80 shadow-xs hover:bg-rose-100 hover:shadow-lg hover:shadow-rose-500/15'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:bg-white hover:text-rose-700 hover:border-rose-300 hover:shadow-lg hover:shadow-slate-300/40'
                }`}
              >
                {/* Background Shadow & Glow Blur Layer */}
                <motion.div
                  className={`absolute -inset-0.5 rounded-2xl blur-xs -z-10 transition-opacity ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 via-red-500 to-pink-600 opacity-80'
                      : 'bg-gradient-to-r from-rose-400/30 via-red-400/20 to-pink-400/30 opacity-0 group-hover:opacity-100'
                  }`}
                  animate={{
                    scale: isActive ? [0.98, 1.02, 0.98] : 1,
                  }}
                  transition={{
                    repeat: isActive ? Infinity : 0,
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                />

                <Icon className={`w-5 h-5 shrink-0 z-10 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-rose-600'
                }`} />

                <span className="whitespace-nowrap font-sans font-extrabold text-xs sm:text-sm tracking-tight z-10">{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black z-10 shadow-xs ${
                      isActive ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Underline Pill Accent */}
                {isActive && (
                  <motion.span
                    layoutId="activeUnderline"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-amber-400 rounded-full z-10"
                    animate={{
                      scaleX: [1, 1.15, 1],
                      boxShadow: [
                        '0 1px 6px rgba(251,191,36,0.6)',
                        '0 2px 10px rgba(251,191,36,0.95)',
                        '0 1px 6px rgba(251,191,36,0.6)'
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Quick System & Operator Profile Tag (Right Side) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 pl-4 border-l border-slate-200/80">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">ETR Online</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Orders: <strong className="text-slate-900 font-mono font-bold">{todayOrdersCount}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-xs font-mono font-extrabold text-slate-900 truncate max-w-[110px]">
                {currentUser?.name || 'POS Cashier'}
              </p>
              <p className="text-[8px] font-mono text-emerald-700 uppercase tracking-wider font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                {isSuperAdmin ? 'SUPER ADMIN' : 'POS OPERATOR'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
