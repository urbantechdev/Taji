import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { UserRole, LocationId } from '../../types';
import { MailInboxDrawer } from '../notifications/MailInboxDrawer';
import { BrandSettingsModal } from '../settings/BrandSettingsModal';
import { UserProfileModal } from '../profile/UserProfileModal';
import { isSoundEnabled, toggleSound, playClickSound } from '../../utils/audio';
import {
  Store,
  Warehouse,
  QrCode,
  Barcode,
  Camera,
  ArrowLeftRight,
  ShieldAlert,
  UserCheck,
  Building,
  Mail,
  Settings,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  Volume2,
  VolumeX,
  User,
  ChevronDown,
  Check,
  Briefcase,
  Shield,
  CreditCard,
  MapPin,
  Boxes,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    appMode,
    setAppMode,
    activeRole,
    setActiveRole,
    activeLocation,
    setActiveLocation,
    locations,
    transfers,
    products,
    setIsQRScannerOpen,
    setIsMobileBarcodeScannerOpen,
    brandSettings,
    setIsBrandSettingsModalOpen,
    mailNotifications,
    setIsAuthModalOpen,
    isUserProfileModalOpen,
    setIsUserProfileModalOpen,
    currentUser,
    posSession,
    isGoogleAdminAuthenticated,
    adminUser,
    lockPOSSession,
    signOutGoogleAdmin,
    isMailDrawerOpen,
    setIsMailDrawerOpen,
    isAdmin,
    lockPlatform,
    setIsReturnExchangeModalOpen,
    quarantinedDefects
  } = useERP();

  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const handleSoundChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ enabled: boolean }>;
      if (customEvt.detail) {
        setSoundOn(customEvt.detail.enabled);
      }
    };
    window.addEventListener('zamoda-sound-changed', handleSoundChange);
    return () => window.removeEventListener('zamoda-sound-changed', handleSoundChange);
  }, []);

  // Click outside and escape key handling to auto-close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLocationDropdownOpen(false);
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const currentStoreLocation = posSession?.isUnlocked ? posSession.location : activeLocation;
  const activeLocInfo = locations.find(l => l.id === activeLocation);
  const unreadMails = mailNotifications.filter(
    m => !m.read && m.toLocation === currentStoreLocation && m.fromLocation !== currentStoreLocation
  ).length;

  // Pending transfers that need to be received at currentStoreLocation (or all in admin mode)
  const pendingTransfersToReceive = transfers.filter(
    t => (t.status === 'pending_approval' || t.status === 'dispatched') && (isAdmin || t.toLocation === currentStoreLocation)
  );
  const pendingTransfersCount = pendingTransfersToReceive.length;
  const totalMessageAlerts = unreadMails + pendingTransfersCount;

  const mainStoreLowCount = products.filter(p => p.locationStock.main_store <= p.minReorderLevel).length;
  const salesShopLowCount = products.filter(p => p.locationStock.sales_shop <= p.minReorderLevel).length;

  const roleOptions: {
    role: UserRole;
    title: string;
    badge: string;
    description: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      role: 'admin',
      title: 'Executive Super Admin',
      badge: 'Full Root Access',
      description: 'Global inventory, financial reports, settings & audit logs',
      color: 'from-pink-500 to-rose-600',
      icon: ShieldCheck
    },
    {
      role: 'branch_manager',
      title: 'Branch Manager',
      badge: 'Operations Hub',
      description: 'Branch stock control, operator approvals & shift reports',
      color: 'from-indigo-500 to-blue-600',
      icon: Briefcase
    },
    {
      role: 'main_store_operator',
      title: 'Main Store Logistics',
      badge: 'Central Warehouse',
      description: 'Stock intake, dual-tare calibration & transfer dispatches',
      color: 'from-emerald-500 to-teal-600',
      icon: Warehouse
    },
    {
      role: 'sales_shop_cashier',
      title: 'Sales Shop Cashier',
      badge: 'Direct Retail POS',
      description: 'Fast barcode checkout, cash drawer & M-Pesa receipts',
      color: 'from-amber-500 to-orange-600',
      icon: ShoppingBag
    },
    {
      role: 'store_1_attendant',
      title: 'Store 1 Attendant',
      badge: 'Transfer Depot',
      description: 'Stock reception verification and branch inventory audits',
      color: 'from-cyan-500 to-blue-500',
      icon: Store
    },
    {
      role: 'store_2_attendant',
      title: 'Store 2 Attendant',
      badge: 'Transfer Depot',
      description: 'Stock receipt reconciliation and restock request initiation',
      color: 'from-teal-500 to-emerald-500',
      icon: Store
    },
    {
      role: 'accountant',
      title: 'Financial Accountant',
      badge: 'Ledger & Audit',
      description: 'Double-entry ledger, VAT reporting & KRA compliance',
      color: 'from-purple-500 to-violet-600',
      icon: FileSpreadsheet
    }
  ];

  const getRoleShortLabel = (role: UserRole) => {
    if (role === 'admin') return 'Super Admin';
    if (role === 'branch_manager') return 'Manager';
    if (role === 'main_store_operator') return 'Warehouse';
    if (role === 'sales_shop_cashier') return 'Cashier';
    if (role === 'store_1_attendant') return 'Store 1';
    if (role === 'store_2_attendant') return 'Store 2';
    if (role === 'accountant') return 'Accountant';
    return role;
  };

  const getLocationShortLabel = (locId: LocationId) => {
    if (locId === 'main_store') return 'Main Hub';
    if (locId === 'sales_shop') return 'Sales Shop';
    if (locId === 'store_1') return 'Store 1';
    if (locId === 'store_2') return 'Store 2';
    const loc = locations.find(l => l.id === locId);
    return loc ? loc.name.split(' ')[0] : locId;
  };

  // Dynamic header background style & class based on brand selection (solid #B50044 pink, no gradients)
  const headerBgClass =
    brandSettings.headerBgColor === 'rose'
      ? 'bg-rose-900'
      : brandSettings.headerBgColor === 'indigo'
      ? 'bg-indigo-900'
      : brandSettings.headerBgColor === 'emerald'
      ? 'bg-emerald-900'
      : brandSettings.headerBgColor === 'amber'
      ? 'bg-amber-950'
      : brandSettings.headerBgColor === 'slate'
      ? 'bg-slate-900'
      : ''; // Handled via inline style for exact #B50044 pink!

  const headerStyle = brandSettings.headerBgColor === 'pink' || !brandSettings.headerBgColor
    ? { backgroundColor: brandSettings.primaryColor || '#B50044' }
    : undefined;

  const waveFillColor =
    brandSettings.headerBgColor === 'rose'
      ? '#881337'
      : brandSettings.headerBgColor === 'indigo'
      ? '#312e81'
      : brandSettings.headerBgColor === 'emerald'
      ? '#064e3b'
      : brandSettings.headerBgColor === 'amber'
      ? '#451a03'
      : brandSettings.headerBgColor === 'slate'
      ? '#0f172a'
      : brandSettings.primaryColor || '#B50044';

  return (
    <header
      className={`${headerBgClass} text-white sticky top-0 z-40 relative shadow-lg transition-colors duration-300 overflow-visible`}
      style={headerStyle}
    >
      {/* Glass Light Reflection Sheen Custom CSS Animations */}
      <style>{`
        @keyframes headerReflectionSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(320%) skewX(-25deg);
            opacity: 0;
          }
        }

        .animate-reflection-sweep {
          animation: headerReflectionSweep 5s ease-in-out infinite;
        }
      `}</style>

      {/* Elegant Moving Glass & Light Reflection Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft glossy diagonal reflection beam sweeping across header */}
        <div className="absolute -top-12 -bottom-12 left-0 w-[500px] sm:w-[700px] animate-reflection-sweep pointer-events-none">
          {/* Main sheen band with bright core specular highlight */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 via-white/20 via-pink-100/35 via-white/20 via-white/5 to-transparent blur-lg" />
          {/* Crisp center glare line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
        </div>
      </div>
      {/* Direct POS Restriction Notice Banner for Store 1 & Store 2 */}
      {!activeLocInfo?.canSellDirectly && (
        <div className="bg-slate-950/80 text-amber-300 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-2 max-w-4xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <span>
              <strong className="underline text-white">{activeLocInfo?.name} Operational Restriction:</strong> Direct POS sales disabled. Route orders via Transfer Tickets to Main Store.
            </span>
          </div>
          <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-mono uppercase tracking-wider border border-amber-400/30">
            Transfer Only Node
          </span>
        </div>
      )}

      {/* Main Header Container with responsive padding */}
      <div className="px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-5 sm:pb-8 md:pb-10 flex flex-wrap items-center justify-between gap-3 sm:gap-5 relative z-10">
        
        {/* Brand Title & Enlarged Animated Round Logo Frame */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          <motion.div
            onClick={() => setIsBrandSettingsModalOpen(true)}
            title="Click to customize brand logo & settings"
            animate={{
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 0 0 0px rgba(255, 255, 255, 0.45)',
                '0 0 0 16px rgba(255, 255, 255, 0)',
                '0 0 0 0px rgba(255, 255, 255, 0.45)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-14 h-14 sm:w-20 sm:h-20 md:w-26 md:h-26 rounded-full bg-white/25 border-2 sm:border-3 md:border-4 border-white/60 p-1 sm:p-1.5 shadow-2xl ring-2 sm:ring-4 ring-white/20 flex items-center justify-center shrink-0 backdrop-blur-md overflow-hidden relative cursor-pointer group/logo hover:border-white transition-all"
          >
            {brandSettings?.logoUrl ? (
              <motion.img
                src={brandSettings.logoUrl}
                alt={brandSettings.brandName || 'Logo'}
                className="w-full h-full object-cover rounded-full bg-white p-1 shadow-inner group-hover/logo:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                animate={{
                  rotate: [0, 1.5, -1.5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                whileHover={{ scale: 1.1, rotate: 3 }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl md:text-4xl shadow-inner border border-white/30 group-hover/logo:scale-105 transition-transform">
                {(brandSettings?.brandName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="font-ai text-white text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-black uppercase tracking-[0.12em] select-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all hover:scale-105 duration-200 cursor-default flex items-center">
                {brandSettings.brandName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-ai font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md tracking-widest uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                AI OS
              </span>
            </div>
            
            {/* Clean White AI Circuit Line */}
            <div className="flex items-center gap-1.5 opacity-80">
              <div className="h-[2px] w-12 sm:w-20 md:w-24 bg-gradient-to-r from-white via-white/70 to-transparent rounded-full shadow-xs" />
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
              <div className="h-[2px] w-4 bg-white/40 rounded-full" />
            </div>

            <p className="text-xs sm:text-sm text-pink-100 font-medium hidden sm:block mt-0.5 font-sans">
              {brandSettings.tagline || 'Autonomous Multi-Location ERP, KRA ETR Compliance & Accounting Ledger'}
            </p>
          </div>
        </div>

        {/* Center / Right Action Bar Controls - Icons with Short Names */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative z-40">
          
          {/* Mode Switcher: Admin / POS Toggle */}
          {isAdmin ? (
            <div className="bg-black/25 p-1 rounded-xl sm:rounded-2xl flex items-center gap-1 border border-white/20 backdrop-blur-md shadow-inner">
              <button
                onClick={() => {
                  playClickSound();
                  setAppMode('admin');
                }}
                className={`px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  appMode === 'admin'
                    ? 'bg-white text-pink-700 shadow-md scale-105 font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Switch to Admin Dashboard"
                aria-label="Admin Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="text-xs">Admin</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setAppMode('pos');
                }}
                className={`px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  appMode === 'pos'
                    ? 'bg-white text-pink-700 shadow-md scale-105 font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Switch to POS Terminal"
                aria-label="POS Terminal"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="text-xs">POS</span>
              </button>
            </div>
          ) : (
            <div
              className="px-3 py-1.5 bg-white/15 border border-white/20 rounded-xl text-white backdrop-blur-md shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="POS Terminal (Staff Mode Active)"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-pink-200" />
              <span>POS</span>
            </div>
          )}

          {/* Location / Shop Selector (Wide Modern White Dropdown) */}
          <div className="relative" ref={locationDropdownRef}>
            <button
              onClick={() => {
                playClickSound();
                setIsLocationDropdownOpen(prev => !prev);
                setIsRoleDropdownOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer group border shadow-xs ${
                isLocationDropdownOpen
                  ? 'bg-white text-pink-900 border-white shadow-md font-bold'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              title={`Active Branch: ${activeLocInfo?.name || 'All Branches'} (Click to switch branch)`}
              aria-label="Active Branch Location"
              aria-expanded={isLocationDropdownOpen}
            >
              <Building className={`w-3.5 h-3.5 transition-transform shrink-0 ${isLocationDropdownOpen ? 'text-pink-700 scale-110' : 'text-white group-hover:scale-110'}`} />
              <span className="text-xs font-bold max-w-[70px] sm:max-w-[100px] truncate">
                {getLocationShortLabel(activeLocation)}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 shrink-0 ${
                  isLocationDropdownOpen ? 'rotate-180 text-pink-700' : 'text-white/70 group-hover:text-white'
                }`}
              />
            </button>

            {/* Modern Animated Location Dropdown Menu (Wide + Clean White Theme) */}
            <AnimatePresence>
              {isLocationDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[390px] md:w-[430px] max-w-[430px] bg-white border border-slate-200/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] p-2.5 z-[9999] text-slate-900 ring-1 ring-black/5 overflow-hidden"
                >
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center border border-pink-200">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Branch & Location Hub</p>
                        <p className="text-[11px] text-slate-500 font-medium">Switch active stock inventory & POS checkout</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-white text-slate-700 rounded-full border border-slate-200 shadow-2xs">
                      {locations.length} Stores
                    </span>
                  </div>

                  <div className="py-1 space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {locations.map(loc => {
                      const isSelected = loc.id === activeLocation;
                      const stockInLocation = products.reduce((acc, p) => acc + (p.locationStock[loc.id] || 0), 0);
                      const isHub = loc.type === 'Main Store';
                      const isRetail = loc.canSellDirectly;

                      return (
                        <button
                          key={loc.id}
                          onClick={() => {
                            playClickSound();
                            setActiveLocation(loc.id as LocationId);
                            setIsLocationDropdownOpen(false);
                          }}
                          disabled={!isAdmin && loc.id !== currentStoreLocation}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                            isSelected
                              ? 'bg-pink-50/90 border-pink-400 text-pink-950 shadow-xs ring-1 ring-pink-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-800 shadow-2xs'
                          } ${!isAdmin && loc.id !== currentStoreLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isHub
                                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                                  : isRetail
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isHub ? <Warehouse className="w-4.5 h-4.5" /> : <Store className="w-4.5 h-4.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 truncate">{loc.name}</span>
                                {loc.code && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                    {loc.code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 mt-1">
                                <span
                                  className={`text-[10px] font-bold flex items-center gap-1.5 ${
                                    loc.canSellDirectly ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      loc.canSellDirectly ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                    }`}
                                  />
                                  {loc.canSellDirectly ? 'POS Active' : 'Transfer Hub'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  • {stockInLocation.toLocaleString()} in stock
                                </span>
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Staff Role Switcher (Wide Modern White Dropdown - Admin Only) */}
          {isAdmin && (
            <div className="relative" ref={roleDropdownRef}>
              <button
                onClick={() => {
                  playClickSound();
                  setIsRoleDropdownOpen(prev => !prev);
                  setIsLocationDropdownOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer group border shadow-xs ${
                  isRoleDropdownOpen
                    ? 'bg-white text-indigo-900 border-white shadow-md font-bold'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
                title={`Simulate Staff Role: ${roleOptions.find(r => r.role === activeRole)?.title || activeRole} (Click to switch role)`}
                aria-label="Simulate Staff Role"
                aria-expanded={isRoleDropdownOpen}
              >
                <UserCheck className={`w-3.5 h-3.5 transition-transform shrink-0 ${isRoleDropdownOpen ? 'text-indigo-700 scale-110' : 'text-white group-hover:scale-110'}`} />
                <span className="text-xs font-bold max-w-[65px] truncate">
                  {getRoleShortLabel(activeRole)}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 shrink-0 ${
                    isRoleDropdownOpen ? 'rotate-180 text-indigo-700' : 'text-white/70 group-hover:text-white'
                  }`}
                />
              </button>

              {/* Modern Animated Role Dropdown Menu (Wide + Clean White Theme) */}
              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[390px] md:w-[430px] max-w-[430px] bg-white border border-slate-200/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] p-2.5 z-[9999] text-slate-900 ring-1 ring-black/5 overflow-hidden"
                  >
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Staff Role Simulation</p>
                          <p className="text-[11px] text-slate-500 font-medium">Test role-specific workflows, permissions & views</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 shadow-2xs">
                        Admin Tool
                      </span>
                    </div>

                    <div className="py-1 space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {roleOptions.map(r => {
                        const isSelected = r.role === activeRole;
                        const IconComponent = r.icon;

                        return (
                          <button
                            key={r.role}
                            onClick={() => {
                              playClickSound();
                              setActiveRole(r.role);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 shadow-xs ring-1 ring-indigo-500/20'
                                : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-gradient-to-br ${r.color} text-white shadow-xs`}
                              >
                                <IconComponent className="w-4.5 h-4.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900 truncate">{r.title}</span>
                                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold border border-slate-200">
                                    {r.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 group-hover:text-slate-600 truncate mt-0.5 leading-snug">
                                  {r.description}
                                </p>
                              </div>
                            </div>

                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Stock Alert Quick Badges */}
          {isAdmin && mainStoreLowCount > 0 && (
            <button
              onClick={() => setAppMode('admin')}
              className="relative px-2.5 py-1.5 bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 border border-rose-400/50 rounded-xl backdrop-blur-md cursor-pointer transition-all shadow-xs group flex items-center gap-1.5"
              title={`Main Store Low Stock Alert: ${mainStoreLowCount} item(s) below reorder level`}
              aria-label="Main Store Low Stock Alert"
            >
              <Warehouse className="w-3.5 h-3.5 text-rose-200 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Hub</span>
              <span className="bg-rose-600 border border-white text-white font-mono font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                {mainStoreLowCount}
              </span>
            </button>
          )}

          {isAdmin && salesShopLowCount > 0 && (
            <button
              onClick={() => setAppMode('admin')}
              className="relative px-2.5 py-1.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 border border-amber-400/50 rounded-xl backdrop-blur-md cursor-pointer transition-all shadow-xs group flex items-center gap-1.5"
              title={`Sales Shop Retail Low Stock Alert: ${salesShopLowCount} item(s) below reorder level`}
              aria-label="Sales Shop Retail Low Stock Alert"
            >
              <Store className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Shop</span>
              <span className="bg-amber-600 border border-white text-white font-mono font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                {salesShopLowCount}
              </span>
            </button>
          )}

          {/* Mail & Pending Transfers Inbox Button */}
          <button
            onClick={() => setIsMailDrawerOpen(true)}
            className={`relative px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              totalMessageAlerts > 0
                ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 font-black animate-pulse shadow-lg shadow-amber-400/60 ring-2 ring-amber-300/80 scale-105'
                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            }`}
            title={`Store Messages & Pending Transfers: ${pendingTransfersCount} transfer(s) pending to be received, ${unreadMails} message(s)`}
            aria-label="Messages and Transfer Notifications"
          >
            <Mail className={`w-3.5 h-3.5 ${totalMessageAlerts > 0 ? 'animate-bounce text-slate-950' : ''}`} />
            <span>Inbox</span>
            {totalMessageAlerts > 0 && (
              <span className="bg-rose-600 text-white border border-amber-300 font-black text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                {totalMessageAlerts}
              </span>
            )}
          </button>

          {/* RMA / Returns & Exchanges Manager Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsReturnExchangeModalOpen(true);
            }}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white rounded-xl shadow-md shadow-rose-950/20 transition-all cursor-pointer border border-amber-400/40 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold group"
            title="Damaged Cones Returns, 1:1 Exchanges, eTIMS Credit Notes & Supplier Claims"
            aria-label="Returns and Exchanges RMA"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-200 group-hover:rotate-180 transition-transform duration-500" />
            <span>RMA / Returns</span>
            {quarantinedDefects.length > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {quarantinedDefects.length}
              </span>
            )}
          </button>

          {/* Mobile Phone Barcode Scanner */}
          <button
            onClick={() => setIsMobileBarcodeScannerOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer border border-emerald-400/50 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold group"
            title="Scan Product Barcodes with Phone / Camera to Add Products Instantly"
            aria-label="Camera Barcode Scanner"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Barcode</span>
          </button>

          {/* Batch QR Scanner */}
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-slate-700 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold group"
            title="Open Batch QR Scanner"
            aria-label="QR Code Scanner"
          >
            <QrCode className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>QR</span>
          </button>

          {/* Sound Effects Audio Mute / Unmute Toggle (Icon-Only) */}
          <button
            onClick={handleToggleSound}
            className={`p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              soundOn
                ? 'bg-white/15 hover:bg-white/25 border-white/30 text-white shadow-xs'
                : 'bg-black/30 hover:bg-black/40 border-white/10 text-white/60'
            }`}
            title={soundOn ? 'Sound Effects: Enabled (Click to mute)' : 'Sound Effects: Muted (Click to enable)'}
            aria-label="Toggle Sound Effects"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-300" />
            )}
          </button>

          {/* Brand Settings Gear Button (Icon-Only - Admin only) */}
          {isAdmin && (
            <button
              onClick={() => {
                playClickSound();
                setIsBrandSettingsModalOpen(true);
              }}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center group hover:scale-105 active:scale-95"
              title="Brand Color, Identity & Logo Settings"
              aria-label="Brand Settings"
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </button>
          )}

          {/* Executive User Account Profile (Icon-Only) */}
          <button
            onClick={() => setIsUserProfileModalOpen(true)}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all cursor-pointer group flex items-center justify-center hover:scale-105 active:scale-95"
            title={`Executive Account Profile: ${currentUser.name} (${currentUser.role})`}
            aria-label="Executive Profile"
          >
            <User className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Lock Session Terminal Button (Icon-Only) */}
          <button
            onClick={() => {
              playClickSound();
              lockPlatform();
            }}
            className="p-2.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/50 text-rose-100 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center group"
            title="Lock POS & Terminal Session Immediately"
            aria-label="Lock Terminal Session"
          >
            <Lock className="w-4 h-4 text-rose-300 group-hover:scale-110 transition-transform" />
          </button>

        </div>

      </div>

      {/* Single Wave Curved Bottom Edge with subtle lighting highlight */}
      <div className="absolute left-0 right-0 top-full -mt-0.5 w-full overflow-visible leading-none pointer-events-none z-20">
        <svg
          viewBox="0 0 1440 120"
          className="relative block w-full h-8 sm:h-12 overflow-visible filter [filter:drop-shadow(0_6px_8px_rgba(0,0,0,0.25))]"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Elegant soft light gradient for the wave edge */}
            <linearGradient id="headerWaveLightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffd1dc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>

            {/* Soft subtle glow filter */}
            <filter id="waveSoftGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main solid header wave body */}
          <path
            d="M0,0 C480,100 960,-20 1440,60 L1440,0 L0,0 Z"
            style={{ fill: waveFillColor }}
          />

          {/* Subtle soft light halo along the wave */}
          <path
            d="M0,0 C480,100 960,-20 1440,60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.3"
            filter="url(#waveSoftGlow)"
          />

          {/* Clean inner highlight stroke */}
          <path
            d="M0,0 C480,100 960,-20 1440,60"
            fill="none"
            stroke="url(#headerWaveLightGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Animated Light Reflection Sheen following the wave curve */}
          <path
            d="M0,0 C480,100 960,-20 1440,60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="400 1040"
            className="animate-reflection-sweep"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 18px rgba(255, 182, 193, 0.7))'
            }}
          />
        </svg>

        {/* Ambient bottom light flare reflection */}
        <div className="absolute inset-x-0 top-2 h-4 bg-gradient-to-r from-pink-500/10 via-white/20 to-pink-500/10 blur-md pointer-events-none" />
      </div>

      {/* Drawers & Modals */}
      <MailInboxDrawer
        isOpen={isMailDrawerOpen}
        onClose={() => setIsMailDrawerOpen(false)}
      />
      <BrandSettingsModal />
      <UserProfileModal />
    </header>
  );
};

