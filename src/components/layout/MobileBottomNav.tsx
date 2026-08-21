import React, { useState } from 'react';
import { NavTab } from './Sidebar';
import { useERP } from '../../context/ERPContext';
import { LocationId, UserRole } from '../../types';
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
  Settings,
  Lock,
  ShieldCheck,
  Store,
  Warehouse,
  Building2
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  appMode?: 'admin' | 'pos';
}

const roles: { role: UserRole; label: string; location: LocationId }[] = [
  { role: 'admin', label: 'Admin / Executive', location: 'main_store' },
  { role: 'main_store_operator', label: 'Main Store Operator', location: 'main_store' },
  { role: 'sales_shop_cashier', label: 'Sales Shop Cashier', location: 'sales_shop' },
  { role: 'store_1_attendant', label: 'Store 1 Attendant', location: 'store_1' },
  { role: 'store_2_attendant', label: 'Store 2 Attendant', location: 'store_2' },
  { role: 'accountant', label: 'Accountant', location: 'main_store' }
];

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
    setIsAuthModalOpen,
    posSession,
    lockPOSSession,
    isGoogleAdminAuthenticated,
    currentUser,
    isSuperAdmin,
    isAdmin,
    lockPlatform
  } = useERP();

  const unreadMails = mailNotifications.filter(m => !m.isRead).length;

  const mainStoreLowCount = products.filter(
    p => p.locationStock ? p.locationStock.main_store <= p.minReorderLevel : (p.location === 'main_store' && p.stockQuantity <= p.reorderLevel)
  ).length;

  const salesShopLowCount = products.filter(
    p => p.locationStock ? p.locationStock.sales_shop <= p.minReorderLevel : (p.location === 'sales_shop' && p.stockQuantity <= p.reorderLevel)
  ).length;

  const primaryNav: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'pos',
      label: 'POS Sales',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      id: 'catalog',
      label: 'Inventory',
      icon: <Boxes className="w-5 h-5" />
    },
    {
      id: 'transfers',
      label: 'Transfers',
      icon: <ArrowLeftRight className="w-5 h-5" />
    }
  ];

  const secondaryNav: { id: NavTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'branches',
      label: 'Autonomous Branches',
      icon: <Building2 className="w-5 h-5 text-indigo-500" />,
      desc: 'Branch P&L & Cash Floats'
    },
    {
      id: 'ledger',
      label: 'Accounting Ledger',
      icon: <BookOpenCheck className="w-5 h-5 text-rose-500" />,
      desc: 'Double-entry audit & balances'
    },
    {
      id: 'etr',
      label: 'KRA ETR Compliance',
      icon: <Receipt className="w-5 h-5 text-pink-500" />,
      desc: 'TIMS receipts & VAT 16%'
    },
    {
      id: 'payroll',
      label: 'HR & Payroll',
      icon: <Users className="w-5 h-5 text-purple-500" />,
      desc: 'PAYE, NSSF, NHIF payslips'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: <ClipboardList className="w-5 h-5 text-amber-500" />,
      desc: 'System operation logs'
    },
    {
      id: 'gmail',
      label: 'Inbox',
      icon: <Mail className="w-5 h-5 text-red-500" />,
      desc: 'Read & send store emails'
    }
  ];

  const handleSelectTab = (tab: NavTab) => {
    playClickSound();
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  const isSecondaryActive = secondaryNav.some(item => item.id === activeTab);

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

            {/* Mobile Header Item 1: App Mode Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                System Mode
              </label>
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
                <button
                  onClick={() => {
                    setAppMode('admin');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    appMode === 'admin'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setAppMode('pos');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    appMode === 'pos'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>POS Terminal</span>
                </button>
              </div>
            </div>

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
              <div className="grid grid-cols-3 gap-2">
                {/* Inbox Notifications */}
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

                {/* QR Scanner */}
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

                {/* Brand Settings */}
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
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Platform Navigation Modules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {secondaryNav.map(item => {
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

          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-around py-1.5 px-2 text-slate-600 md:hidden">
        {isAdmin ? (
          <>
            {primaryNav.map(item => {
              const isActive = activeTab === item.id;
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

            {/* Modules / Control Panel Drawer Trigger Button */}
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
          </>
        ) : (
          /* Specialized Cashier POS mobile bottom bar */
          <>
            <button
              onClick={() => {
                playClickSound();
                setAppMode('pos');
              }}
              className="flex flex-col items-center justify-center py-1 px-2 text-rose-600 font-black relative"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">POS Terminal</span>
              <span className="absolute -top-1.5 w-8 h-1 bg-rose-600 rounded-full" />
            </button>

            <button
              onClick={() => {
                playClickSound();
                setIsMailDrawerOpen(true);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                unreadMails > 0 ? 'text-amber-600 font-bold animate-pulse' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Mail className="w-5 h-5" />
                {unreadMails > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadMails}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Inbox</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setIsQRScannerOpen(true);
              }}
              className="flex flex-col items-center justify-center py-1 px-2 text-slate-500 hover:text-slate-800"
            >
              <QrCode className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Scan QR</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                lockPlatform();
              }}
              className="flex flex-col items-center justify-center py-1 px-2 text-rose-600 font-bold"
            >
              <Lock className="w-5 h-5 text-rose-500" />
              <span className="text-[10px] mt-0.5 tracking-tight">Lock</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};

export default MobileBottomNav;
