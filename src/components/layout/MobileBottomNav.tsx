import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavTab } from './Sidebar';
import { useERP } from '../../context/ERPContext';
import { LocationId, UserRole } from '../../types';
import { isTabAllowedForRole } from '../../utils/rbac';
import { evaluateStockStatus } from '../../utils/stockThresholdEngine';
import { playClickSound, playPopupSound } from '../../utils/audio';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ArrowLeftRight,
  BookOpenCheck,
  Receipt,
  Users,
  ClipboardList,
  Mail,
  Grid,
  X,
  Sparkles,
  Building,
  UserCheck,
  QrCode,
  Barcode,
  Camera,
  Settings,
  Lock,
  ShieldCheck,
  Store,
  Warehouse,
  Building2,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  appMode?: 'admin' | 'pos';
}

const roles: { role: UserRole; label: string; location: LocationId }[] = [
  { role: 'admin', label: 'Admin / Executive', location: 'main_store' },
  { role: 'accountant', label: 'Finance & Accounting', location: 'main_store' },
  { role: 'hr_manager', label: 'HR Manager', location: 'main_store' },
  { role: 'branch_manager', label: 'Branch Manager', location: 'sales_shop' },
  { role: 'main_store_operator', label: 'Main Store Operator', location: 'main_store' },
  { role: 'sales_shop_cashier', label: 'Sales Shop Cashier', location: 'sales_shop' },
  { role: 'store_1_attendant', label: 'Store 1 Attendant', location: 'store_1' },
  { role: 'store_2_attendant', label: 'Store 2 Attendant', location: 'store_2' }
];

const ROLE_PRIMARY_PRIORITIES: Record<UserRole, NavTab[]> = {
  admin: ['dashboard', 'pos', 'catalog', 'transfers'],
  accountant: ['ledger', 'catalog', 'sales_today', 'etr'],
  hr_manager: ['payroll', 'operators', 'dashboard', 'branches'],
  branch_manager: ['dashboard', 'pos', 'catalog', 'ledger'],
  sales_shop_cashier: ['pos', 'catalog', 'guide'],
  branch_cashier: ['pos', 'catalog', 'guide'],
  pos_cashier: ['pos', 'catalog', 'guide'],
  main_store_operator: ['catalog', 'transfers', 'branches', 'audit'],
  store_1_attendant: ['transfers', 'catalog', 'guide'],
  store_2_attendant: ['transfers', 'catalog', 'guide']
};

const ALL_TABS_META: Record<
  NavTab,
  {
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    desc: string;
    isInventoryHighlight?: boolean;
  }
> = {
  dashboard: {
    label: 'Executive Dashboard',
    shortLabel: 'Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
    desc: 'Executive multi-branch stats & metrics'
  },
  sales_today: {
    label: 'Sales Today & Cash',
    shortLabel: 'Today',
    icon: <TrendingUp className="w-5 h-5 text-rose-600" />,
    desc: 'Live revenue, bank, mpesa & cash'
  },
  pos: {
    label: 'POS Sales & Orders',
    shortLabel: 'POS',
    icon: <ShoppingCart className="w-5 h-5" />,
    desc: 'Retail counter sale & held carts'
  },
  catalog: {
    label: 'Inventory Management',
    shortLabel: 'Inventory',
    icon: <Boxes className="w-5 h-5" />,
    desc: 'Stock counts, meters & reorders',
    isInventoryHighlight: true
  },
  transfers: {
    label: 'Inter-Store Transfers',
    shortLabel: 'Transfers',
    icon: <ArrowLeftRight className="w-5 h-5" />,
    desc: 'Dispatch & receive store stock'
  },
  branches: {
    label: 'Autonomous Branches',
    shortLabel: 'Branches',
    icon: <Building2 className="w-5 h-5 text-indigo-500" />,
    desc: 'Branch P&L & Cash Floats'
  },
  ledger: {
    label: 'Accounting Ledger',
    shortLabel: 'Ledger',
    icon: <BookOpenCheck className="w-5 h-5 text-rose-500" />,
    desc: 'Double-entry audit & balances'
  },
  etr: {
    label: 'Billing & Invoices',
    shortLabel: 'Billing',
    icon: <Receipt className="w-5 h-5 text-pink-500" />,
    desc: 'Invoices, receipts & quotes'
  },
  payroll: {
    label: 'HR & Payroll',
    shortLabel: 'Payroll',
    icon: <Users className="w-5 h-5 text-purple-500" />,
    desc: 'PAYE, NSSF, SHA payslips'
  },
  operators: {
    label: 'POS Users & PINs',
    shortLabel: 'Team',
    icon: <UserCheck className="w-5 h-5 text-teal-600" />,
    desc: 'Cashier accounts & permissions'
  },
  audit: {
    label: 'Audit Trail',
    shortLabel: 'Audit',
    icon: <ClipboardList className="w-5 h-5 text-amber-500" />,
    desc: 'System operation logs'
  },
  gmail: {
    label: 'Store Inbox',
    shortLabel: 'Inbox',
    icon: <Mail className="w-5 h-5 text-red-500" />,
    desc: 'Read & send store emails'
  },
  settings: {
    label: 'Platform Settings',
    shortLabel: 'Settings',
    icon: <Settings className="w-5 h-5 text-rose-500" />,
    desc: 'Pricing, roles, barcodes & finance'
  },
  guide: {
    label: 'User Guide & Manual',
    shortLabel: 'Guide',
    icon: <BookOpen className="w-5 h-5 text-amber-500" />,
    desc: 'How-to guides, yarn tare & calibration'
  }
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const {
    appMode,
    setAppMode,
    activeLocation,
    setActiveLocation,
    locations,
    activeRole,
    setActiveRole,
    products,
    mailNotifications,
    setIsMailDrawerOpen,
    setIsBrandSettingsModalOpen,
    setIsQRScannerOpen,
    setIsMobileBarcodeScannerOpen,
    setIsAuthModalOpen,
    posSession,
    lockPOSSession,
    isGoogleAdminAuthenticated,
    currentUser,
    isSuperAdmin,
    isAdmin,
    lockPlatform,
    orders,
    stockAlertSettings
  } = useERP();

  const effectiveRole = activeRole || currentUser.role;

  const unreadMails = mailNotifications.filter(m => !m.read).length;

  const mainStoreLowCount = products.filter(
    p => evaluateStockStatus(p, orders, stockAlertSettings, 'main_store').isLowStock
  ).length;

  const salesShopLowCount = products.filter(
    p => evaluateStockStatus(p, orders, stockAlertSettings, 'sales_shop').isLowStock
  ).length;

  // Strict RBAC filtering for permitted tabs
  const allowedTabIds: NavTab[] = (
    [
      'dashboard',
      'sales_today',
      'branches',
      'pos',
      'catalog',
      'transfers',
      'ledger',
      'etr',
      'payroll',
      'operators',
      'audit',
      'gmail',
      'settings',
      'guide'
    ] as NavTab[]
  ).filter(tabId => isTabAllowedForRole(effectiveRole, tabId));

  // Determine top 4 primary tabs based on role priority
  const priorityList = ROLE_PRIMARY_PRIORITIES[effectiveRole] || ['dashboard', 'pos', 'catalog', 'transfers'];
  
  const primaryTabIds: NavTab[] = [];
  priorityList.forEach(tab => {
    if (allowedTabIds.includes(tab) && !primaryTabIds.includes(tab) && primaryTabIds.length < 4) {
      primaryTabIds.push(tab);
    }
  });
  allowedTabIds.forEach(tab => {
    if (!primaryTabIds.includes(tab) && primaryTabIds.length < 4) {
      primaryTabIds.push(tab);
    }
  });

  // Secondary tabs are whatever allowed tabs remain for this role
  const secondaryTabIds = allowedTabIds.filter(tab => !primaryTabIds.includes(tab));

  const displayPrimaryNav = primaryTabIds.map(id => ({
    id,
    label: ALL_TABS_META[id]?.shortLabel || id,
    icon: ALL_TABS_META[id]?.icon,
    isInventoryHighlight: ALL_TABS_META[id]?.isInventoryHighlight
  }));

  const displaySecondaryNav = secondaryTabIds.map(id => ({
    id,
    label: ALL_TABS_META[id]?.label || id,
    icon: ALL_TABS_META[id]?.icon,
    desc: ALL_TABS_META[id]?.desc || ''
  }));

  const handleSelectTab = (tab: NavTab) => {
    playClickSound();
    if (tab === 'pos') {
      setAppMode('pos');
    } else if (isAdmin) {
      setAppMode('admin');
    }
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  const isSecondaryActive = displaySecondaryNav.some(item => item.id === activeTab);
  const canSwitchMode = isTabAllowedForRole(effectiveRole, 'dashboard') && isTabAllowedForRole(effectiveRole, 'pos');
  const canUseBarcode = isTabAllowedForRole(effectiveRole, 'pos') || isTabAllowedForRole(effectiveRole, 'catalog') || isTabAllowedForRole(effectiveRole, 'transfers');
  const canAccessSettings = isTabAllowedForRole(effectiveRole, 'settings') || isAdmin;
  const canAccessInbox = isTabAllowedForRole(effectiveRole, 'gmail');

  return (
    <>
      {/* Mobile "Control Panel & System Modules" Bottom Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative bg-white border-t border-slate-200 rounded-t-3xl p-4 sm:p-5 space-y-4 text-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Control Panel & Modules
                </h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Header Item 1: App Mode Switcher (Visible if role has access to both Admin & POS) */}
            {canSwitchMode && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  System Mode
                </label>
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setAppMode('admin');
                      if (activeTab === 'pos') {
                        setActiveTab('dashboard');
                      }
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      appMode === 'admin' && activeTab !== 'pos'
                        ? 'bg-rose-600 text-white shadow-md font-black'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setAppMode('pos');
                      setActiveTab('pos');
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      appMode === 'pos' || activeTab === 'pos'
                        ? 'bg-rose-600 text-white shadow-md font-black'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>POS Terminal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Header Item 2 & 3: Location Selector & Role Switcher */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Location Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3 h-3 text-rose-600" />
                  <span>Active Location</span>
                </label>
                <select
                  value={activeLocation}
                  onChange={e => setActiveLocation(e.target.value as LocationId)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 truncate"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Switcher */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-rose-600" />
                  <span>Active Role</span>
                </label>
                <select
                  value={activeRole}
                  onChange={e => setActiveRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 truncate"
                >
                  {roles.map(r => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Header Items 4: System Quick Action Tools */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Action Tools
              </label>
              <div className="grid grid-cols-4 gap-2">
                {/* Barcode Scanner (Camera Instant Add - only if role has POS or stock permissions) */}
                {canUseBarcode ? (
                  <button
                    onClick={() => {
                      setIsMobileBarcodeScannerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors shadow-xs group"
                  >
                    <Camera className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-emerald-950 mt-1">Barcode</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsQRScannerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-900 mt-1">QR Code</span>
                  </button>
                )}

                {/* Inbox Notifications (Restricted from cashiers) */}
                {canAccessInbox && (
                  <button
                    onClick={() => {
                      setIsMailDrawerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors relative"
                  >
                    <Mail className="w-5 h-5 text-rose-600" />
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Inbox</span>
                    {unreadMails > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadMails}
                      </span>
                    )}
                  </button>
                )}

                {/* QR Scanner (if barcode was rendered) */}
                {canUseBarcode && (
                  <button
                    onClick={() => {
                      setIsQRScannerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Scan QR</span>
                  </button>
                )}

                {/* Brand / Platform Settings (Admin / Settings permission only) */}
                {canAccessSettings ? (
                  <button
                    onClick={() => {
                      setIsBrandSettingsModalOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-amber-600" />
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Settings</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleSelectTab('guide');
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-900 mt-1">Guide</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Header Item 5: User & Operator PIN Security Status */}
            <div className="p-3 bg-rose-50/80 border border-rose-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  {posSession?.isUnlocked || isGoogleAdminAuthenticated ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {currentUser?.name || 'POS Cashier'}
                  </p>
                  <p className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">
                    {isSuperAdmin ? 'SUPER ADMIN' : 'POS OPERATOR'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (posSession?.isUnlocked) {
                    lockPOSSession();
                  } else {
                    setIsAuthModalOpen(true);
                  }
                  setIsMoreMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors"
              >
                {posSession?.isUnlocked ? 'Lock Session' : 'PIN Login'}
              </button>
            </div>

            {/* Low Stock Alerts (if any) */}
            {(mainStoreLowCount > 0 || salesShopLowCount > 0) && (
              <div className="flex gap-2">
                {mainStoreLowCount > 0 && (
                  <button
                    onClick={() => handleSelectTab('catalog')}
                    className="flex-1 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-bold"
                  >
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-rose-600" />
                      <span>Main Store</span>
                    </div>
                    <span className="bg-rose-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                      {mainStoreLowCount} Low
                    </span>
                  </button>
                )}

                {salesShopLowCount > 0 && (
                  <button
                    onClick={() => handleSelectTab('catalog')}
                    className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-xs font-bold"
                  >
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sales Shop</span>
                    </div>
                    <span className="bg-amber-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                      {salesShopLowCount} Low
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile Navigation Modules Grid */}
            {displaySecondaryNav.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Platform Navigation Modules
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displaySecondaryNav.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 border-rose-500 text-white shadow-lg'
                            : 'bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{item.label}</p>
                          <p className={`text-[10px] leading-tight ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-around py-1.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-slate-600 md:hidden">
        {displayPrimaryNav.map(item => {
          const isActive = activeTab === item.id;
          const isInventory = item.id === 'catalog';

          if (isInventory) {
            return (
              <div key={item.id} className="relative -mt-7 flex flex-col items-center shrink-0">
                <motion.button
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  animate={{
                    scale: isActive ? [1, 1.07, 1] : [1, 1.04, 1],
                    boxShadow: isActive
                      ? [
                          '0 0 0 0px rgba(244, 63, 94, 0.55), 0 6px 20px rgba(225, 29, 72, 0.5)',
                          '0 0 0 16px rgba(244, 63, 94, 0), 0 10px 30px rgba(225, 29, 72, 0.75)',
                          '0 0 0 0px rgba(244, 63, 94, 0.55), 0 6px 20px rgba(225, 29, 72, 0.5)'
                        ]
                      : [
                          '0 0 0 0px rgba(244, 63, 94, 0.4), 0 4px 14px rgba(225, 29, 72, 0.35)',
                          '0 0 0 12px rgba(244, 63, 94, 0), 0 8px 24px rgba(225, 29, 72, 0.55)',
                          '0 0 0 0px rgba(244, 63, 94, 0.4), 0 4px 14px rgba(225, 29, 72, 0.35)'
                        ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-15 h-15 rounded-full p-1 border-3 border-white shadow-2xl flex items-center justify-center relative cursor-pointer backdrop-blur-md overflow-hidden active:scale-95 transition-all ${
                    isActive
                      ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 ring-4 ring-pink-500/40'
                      : 'bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 ring-3 ring-rose-400/25'
                  }`}
                  title="Inventory & Stock Catalog"
                  aria-label="Inventory"
                >
                  {/* Subtle Light Reflection Sweep */}
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full pointer-events-none z-0"
                    animate={{
                      translateX: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      repeatDelay: 1.2
                    }}
                  />

                  <motion.div
                    animate={{
                      rotate: [0, 4, -4, 0],
                      scale: [1, 1.08, 1]
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="w-full h-full rounded-full flex items-center justify-center text-white relative z-10"
                  >
                    <Boxes className="w-7 h-7 text-white drop-shadow-md stroke-[2.3]" />
                  </motion.div>

                  {/* Stock low count alert indicator badge */}
                  {(mainStoreLowCount + salesShopLowCount > 0) && (
                    <span className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] min-w-4.5 h-4.5 px-0.5 rounded-full flex items-center justify-center border-2 border-white shadow-md z-20 animate-bounce">
                      {mainStoreLowCount + salesShopLowCount}
                    </span>
                  )}
                </motion.button>
                <span className={`text-[10.5px] mt-1 tracking-tight font-extrabold ${isActive ? 'text-rose-600' : 'text-slate-700'}`}>
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-[0_2px_8px_rgba(244,63,94,0.6)]" />
              )}
            </button>
          );
        })}

        {/* Modules / Control Panel Drawer Trigger Button (Only if extra allowed modules exist) */}
        {displaySecondaryNav.length > 0 && (
          <button
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isSecondaryActive || isMoreMenuOpen
                ? 'text-rose-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Modules</span>
            {(isSecondaryActive || isMoreMenuOpen) && (
              <span className="absolute -top-1.5 w-8 h-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-[0_2px_8px_rgba(244,63,94,0.6)]" />
            )}
          </button>
        )}
      </nav>
    </>
  );
};

export default MobileBottomNav;
