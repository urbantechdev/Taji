import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Boxes,
  Users,
  Factory,
  Settings,
  Plus,
  DollarSign,
  ShieldCheck,
  Building2,
  X,
  AlertTriangle,
  FileText,
  Sparkles,
  Image as ImageIcon,
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';

export type ERPTabType =
  | 'overview'
  | 'billing'
  | 'payments'
  | 'inventory'
  | 'customers'
  | 'production'
  | 'hero'
  | 'settings';

interface AdminERPSidebarProps {
  activeTab: ERPTabType;
  setActiveTab: (tab: ERPTabType) => void;
  onOpenNewDocModal: (type?: 'invoice' | 'quotation' | 'receipt' | 'delivery_note') => void;
  onOpenNewPaymentModal: () => void;
  onOpenNewInventoryModal: () => void;
  onOpenPostProductModal?: () => void;
  onSwitchToStorefront: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
}

export const AdminERPSidebar: React.FC<AdminERPSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewDocModal,
  onOpenNewPaymentModal,
  onOpenNewInventoryModal,
  onOpenPostProductModal,
  isOpenMobile,
  onCloseMobile,
  onOpenProfileModal,
  onLogout,
}) => {
  const { documents, inventory, productionOrders, currentUser } = useERP();

  // Metrics for live badges
  const unpaidInvoicesCount = documents.filter(
    (d) => d.type === 'invoice' && d.balanceDue > 0
  ).length;

  const lowStockCount = inventory.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  ).length;

  const activeProductionCount = productionOrders.filter(
    (p) => p.status !== 'completed'
  ).length;

  const navItems: {
    id: ERPTabType;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      description: 'KPIs & Revenue analytics',
      icon: LayoutDashboard,
    },
    {
      id: 'billing',
      label: 'Invoices & Billing',
      description: 'Invoices, Quotes & Receipts',
      icon: FileSpreadsheet,
      badge: unpaidInvoicesCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'payments',
      label: 'M-Pesa & Payments',
      description: 'Till & Bank reconciliation',
      icon: CreditCard,
    },
    {
      id: 'inventory',
      label: 'Inventory & Materials',
      description: 'SKUs, Fabrics & Trims stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'customers',
      label: 'Institutional Clients',
      description: 'Schools, Hospitals & Corporates',
      icon: Users,
    },
    {
      id: 'production',
      label: 'Factory Kanban',
      description: 'Cutting, Embroidery & Stitching',
      icon: Factory,
      badge: activeProductionCount > 0 ? activeProductionCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/30',
    },
    {
      id: 'hero',
      label: 'Hero Banner & Slides',
      description: 'Storefront banners, images & slides',
      icon: ImageIcon,
    },
    {
      id: 'settings',
      label: 'Brand Logos & Settings',
      description: 'Change logo, favicon, footer & profile',
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: ERPTabType) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop (starts below the top navigation and wave) */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed top-[168px] sm:top-[172px] inset-x-0 bottom-24 z-30 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Persistent Sidebar with Dark Navy Blue Theme (Positioned comfortably below the top navigation bar & glowing wave) */}
      <aside
        className={`fixed top-[168px] sm:top-[172px] bottom-24 left-0 z-25 w-64 sm:w-72 bg-[#041429] text-slate-200 flex flex-col rounded-tr-2xl border-r border-t border-[#0d2342] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Subtle Ambient Radial Highlight & Shadow Smoke Plumes */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-slate-950/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-smoke-1" />
        <div className="absolute bottom-10 -left-10 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none animate-smoke-2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-950/50 rounded-full blur-2xl pointer-events-none" />

        {/* Navigation Menu with Admin Hero Gradient styling & smooth hover transitions */}
        <div className="relative flex-1 overflow-y-auto px-3 py-3.5 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex items-center justify-between px-3 pb-1 text-[10px] font-bold tracking-widest text-blue-300/80 uppercase">
            <span>Management Modules</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all group cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-400/40 font-bold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <motion.div
                    layoutId="activeHeroIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-300 rounded-r shadow-[0_0_8px_rgba(125,211,252,0.8)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-2.5 min-w-0 pl-1">
                  <div
                    className={`p-1.5 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-black/20 text-blue-300 group-hover:text-white group-hover:bg-white/15 group-hover:scale-110'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate tracking-wide ${isActive ? 'text-white font-bold' : 'group-hover:text-white'}`}>
                      {item.label}
                    </div>
                  </div>
                </div>

                {/* Badge indicator */}
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'bg-white/25 text-white border border-white/30'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Quick Post Product Live Button */}
        {onOpenPostProductModal && (
          <div className="relative z-10 px-3 py-2 border-t border-[#0d2342]/70">
            <button
              type="button"
              onClick={() => {
                onOpenPostProductModal();
                onCloseMobile();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>+ Post Product Live</span>
            </button>
          </div>
        )}

        {/* User Profile & Logout Bottom Card */}
        {currentUser && (
          <div className="relative z-10 p-3 border-t border-[#0d2342] bg-slate-950/70 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/30 transition-all">
              <button
                type="button"
                onClick={() => {
                  onOpenProfileModal?.();
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 cursor-pointer group flex-1"
                title="View & Edit Administrator Profile"
              >
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-sky-400/50"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#041429]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  onCloseMobile();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Log Out of Admin Console"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
