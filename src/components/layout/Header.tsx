import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { UserRole, LocationId } from '../../types';
import { NavTab } from './Sidebar';
import { isTabAllowedForRole } from '../../utils/rbac';
import { evaluateStockStatus } from '../../utils/stockThresholdEngine';
import { MailInboxDrawer } from '../notifications/MailInboxDrawer';
import { BrandSettingsModal } from '../settings/BrandSettingsModal';
import { UserProfileModal } from '../profile/UserProfileModal';
import { CapabilityTooltip } from '../guide/CapabilityTooltip';
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
  ChevronRight,
  Check,
  Briefcase,
  Shield,
  CreditCard,
  MapPin,
  Boxes,
  FileSpreadsheet,
  RotateCcw,
  Layers,
  Menu,
  X,
  TrendingUp,
  Building2,
  BookOpenCheck,
  Receipt,
  Users,
  ClipboardList,
  BookOpen,
  HelpCircle,
  FileText,
  Globe,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
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
    isSuperAdmin,
    lockPlatform,
    setIsReturnExchangeModalOpen,
    quarantinedDefects,
    setIsFabricRollModalOpen,
    fabricRolls,
    orders,
    stockAlertSettings,
    viewMode,
    setViewMode
  } = useERP();

  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
        setIsMobileMenuOpen(false);
      } else if (e.altKey && (e.key === '1' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleSetMode('admin');
      } else if (e.altKey && (e.key === '2' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleSetMode('pos');
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

  const mainStoreLowCount = products.filter(p => evaluateStockStatus(p, orders, stockAlertSettings, 'main_store').isLowStock).length;
  const salesShopLowCount = products.filter(p => evaluateStockStatus(p, orders, stockAlertSettings, 'sales_shop').isLowStock).length;
  const totalAlertsCount = totalMessageAlerts + mainStoreLowCount + salesShopLowCount + (quarantinedDefects?.length || 0);

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

  // Nav modules list for the mobile drawer
  const allNavItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      desc: 'Real-time KPIs & financial metrics'
    },
    {
      id: 'sales_today',
      label: 'Sales Today & Cash',
      icon: TrendingUp,
      desc: 'Live revenue, bank, M-Pesa & cash drawer',
      badge: 'Live'
    },
    {
      id: 'branches',
      label: 'Autonomous Branches',
      icon: Building2,
      desc: 'Multi-store P&L, stock nodes & cash floats'
    },
    {
      id: 'pos',
      label: 'POS Sales Terminal',
      icon: ShoppingBag,
      desc: 'Fast barcode checkout & KRA eTIMS invoices'
    },
    {
      id: 'catalog',
      label: 'Inventory Management',
      icon: Boxes,
      desc: 'Yarn cones, dual-tare calibration & stock balances',
      badge: (mainStoreLowCount + salesShopLowCount) > 0 ? `${mainStoreLowCount + salesShopLowCount} Low` : undefined
    },
    {
      id: 'transfers',
      label: 'Inter-Store Transfers',
      icon: ArrowLeftRight,
      desc: 'Transfer tickets, dispatch & receipt verification',
      badge: pendingTransfersCount > 0 ? `${pendingTransfersCount} Pending` : undefined
    },
    {
      id: 'ledger',
      label: 'Accounting Ledger',
      icon: BookOpenCheck,
      desc: 'Double-entry audit, VAT & trial balance'
    },
    {
      id: 'etr',
      label: 'Billing & Invoices',
      icon: Receipt,
      desc: 'KRA eTIMS invoices, credit notes & proformas'
    },
    {
      id: 'payroll',
      label: (currentUser.role === 'admin' || currentUser.role === 'hr_manager') ? 'HR & Payroll' : 'My Payslips & Records',
      icon: (currentUser.role === 'admin' || currentUser.role === 'hr_manager') ? Users : FileText,
      desc: (currentUser.role === 'admin' || currentUser.role === 'hr_manager')
        ? 'Staff salary computation, PAYE, NSSF & SHA'
        : 'View my personal payslips, statutory deductions & records'
    },
    {
      id: 'operators',
      label: 'POS Users & PINs',
      icon: UserCheck,
      desc: 'Operator security profiles, shifts & access rules'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ClipboardList,
      desc: 'Real-time system operations & tamper-evident logs'
    },
    {
      id: 'gmail',
      label: 'Store Email Inbox',
      icon: Mail,
      desc: 'Official correspondence & customer notices',
      badge: unreadMails > 0 ? `${unreadMails} New` : undefined
    },
    {
      id: 'settings',
      label: 'System & Governance Settings',
      icon: Settings,
      desc: 'Product prices, roles, KRA fiscal, users & barcodes'
    },
    {
      id: 'guide',
      label: 'User Guide & Knowledge Base',
      icon: BookOpen,
      desc: 'Step-by-step guides, yarn/fleece tare, meter adjustments & shortcuts'
    }
  ];

  // Filter nav items by currentUser role
  const allowedNavItems = allNavItems.filter(item => isTabAllowedForRole(currentUser.role, item.id));

  const handleNavClick = (tab: NavTab) => {
    playClickSound();
    if (tab === 'pos') {
      setAppMode('pos');
    } else {
      setAppMode('admin');
    }
    if (setActiveTab) {
      setActiveTab(tab);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSetMode = (mode: 'admin' | 'pos') => {
    playClickSound();
    setAppMode(mode);
    if (mode === 'pos') {
      if (setActiveTab) {
        setActiveTab('pos');
      }
    } else {
      if (setActiveTab) {
        if (activeTab === 'pos') {
          setActiveTab('dashboard');
        }
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleSetLocation = (locId: LocationId) => {
    playClickSound();
    setActiveLocation(locId);
    setIsMobileMenuOpen(false);
  };

  const handleSetRole = (role: UserRole) => {
    playClickSound();
    setActiveRole(role);
    setIsMobileMenuOpen(false);
  };

  // Dynamic header background style & class based on brand selection
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
      : '';

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
      className={`${headerBgClass} text-white sticky top-0 z-50 relative shadow-lg transition-colors duration-300 overflow-visible`}
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
        <div className="absolute -top-12 -bottom-12 left-0 w-[500px] sm:w-[700px] animate-reflection-sweep pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 via-white/20 via-pink-100/35 via-white/20 via-white/5 to-transparent blur-lg" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
        </div>
      </div>

      {/* Direct POS Restriction Notice Banner for Store 1 & Store 2 */}
      {!activeLocInfo?.canSellDirectly && (
        <div className="bg-slate-950/80 text-amber-300 px-3 sm:px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <span className="truncate">
              <strong className="underline text-white">{activeLocInfo?.name}:</strong> Direct POS disabled. Use Transfer Tickets.
            </span>
          </div>
          <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-mono uppercase tracking-wider border border-amber-400/30 shrink-0 ml-2">
            Transfer Only
          </span>
        </div>
      )}

      {/* Main Header Container: Clean & Uncongested Mobile Bar vs Full Desktop Toolbar */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:pt-6 md:pb-8 flex items-center justify-between gap-3 sm:gap-4 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. MOBILE APP HEADER BAR (< 768px): Minimal & Clean, All Items in Menu   */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Brand Avatar & Name */}
          <div
            onClick={() => {
              playClickSound();
              setIsMobileMenuOpen(true);
            }}
            className="flex items-center gap-3.5 min-w-0 cursor-pointer active:scale-98 transition-transform"
            title="Open Menu & System Tools"
          >
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 0 0px rgba(255, 255, 255, 0.45)',
                  '0 0 0 12px rgba(255, 255, 255, 0)',
                  '0 0 0 0px rgba(255, 255, 255, 0.45)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-22 h-22 rounded-full bg-white/20 border-3 border-white/80 p-1 shadow-xl flex items-center justify-center shrink-0 backdrop-blur-md overflow-hidden relative"
            >
              {brandSettings?.logoUrl ? (
                <motion.img
                  src={brandSettings.logoUrl}
                  alt={brandSettings.brandName || 'Logo'}
                  className="w-full h-full object-cover rounded-full bg-white p-0.5 shadow-inner"
                  referrerPolicy="no-referrer"
                  animate={{
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                  {(brandSettings?.brandName || 'T').charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-ai text-white text-lg font-black uppercase tracking-wider truncate drop-shadow-sm leading-tight">
                  {brandSettings.brandName}
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-ai font-black bg-white/20 text-white border border-white/30 tracking-wider uppercase shrink-0">
                  ERP
                </span>
              </div>
              <p className="text-[12px] text-pink-100 font-semibold truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-pink-200 shrink-0" />
                <span className="truncate">{activeLocInfo?.name || getLocationShortLabel(activeLocation)}</span>
              </p>
            </div>
          </div>

          {/* Right: Hamburger Menu Toggle Button with Notification Counter */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(prev => !prev);
              }}
              className={`p-3 rounded-2xl transition-all active:scale-95 border flex items-center justify-center relative cursor-pointer shadow-md ${
                isMobileMenuOpen
                  ? 'bg-white text-pink-700 border-white ring-2 ring-white/50'
                  : 'bg-white hover:bg-slate-50 text-pink-800 border-white/90'
              }`}
              title="App Menu & System Tools"
              aria-label="Open App Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
              {/* Alert Indicator on Hamburger */}
              {!isMobileMenuOpen && (totalAlertsCount > 0 || totalMessageAlerts > 0) && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                  {totalAlertsCount + totalMessageAlerts}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP HEADER BAR (>= 768px): Full Toolbar with Refined Grouping      */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between w-full gap-4">
          
          {/* Brand Title & Logo */}
          <div className="flex items-center gap-3.5 lg:gap-5">
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
              className="w-16 h-16 lg:w-22 lg:h-22 rounded-full bg-white/25 border-3 lg:border-4 border-white/60 p-1 lg:p-1.5 shadow-2xl ring-2 lg:ring-4 ring-white/20 flex items-center justify-center shrink-0 backdrop-blur-md overflow-hidden relative cursor-pointer group/logo hover:border-white transition-all"
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
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl lg:text-3xl shadow-inner border border-white/30 group-hover/logo:scale-105 transition-transform">
                  {(brandSettings?.brandName || 'T').charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="font-ai text-white text-2xl lg:text-3xl xl:text-4xl font-black uppercase tracking-[0.1em] select-none drop-shadow-md">
                  {brandSettings.brandName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-ai font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md tracking-widest uppercase shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ERP
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <a
                  href="https://urbantechdev.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-100 hover:text-white font-medium font-sans max-w-xl truncate transition-colors inline-flex items-center gap-1 no-underline"
                  title="Visit urbantechdev.com"
                >
                  <span>Powered by <strong className="font-bold text-white">urbantechdev</strong></span>
                </a>
              </div>
            </div>
          </div>

          {/* Desktop Right Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-2.5 relative z-40">
            
            {/* View Online Website / Customer Storefront Button */}
            <CapabilityTooltip
              title="Visit Online Customer Storefront"
              description="Open public customer-facing textile catalog, Dereck/Fleece/Yarn specs, and M-Pesa store."
              roleRequired="All Roles"
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setViewMode('storefront');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-pink-500/30 to-rose-500/30 hover:from-pink-500/45 hover:to-rose-500/45 text-white border border-white/35 backdrop-blur-md shadow-xs hover:scale-105 active:scale-95 group"
                title="Visit Public Website & Storefront"
              >
                <Globe className="w-4 h-4 text-pink-200 group-hover:scale-110 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="font-bold tracking-tight">Visit Website</span>
                <ExternalLink className="w-3 h-3 text-pink-200/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </button>
            </CapabilityTooltip>

            {/* Mode Switcher: Admin / POS Toggle */}
            {isAdmin ? (
              <div className="bg-black/25 p-1 rounded-2xl flex items-center gap-1.5 border border-white/20 backdrop-blur-md shadow-inner">
                <CapabilityTooltip
                  title="Executive Admin Dashboard"
                  description="Access global sales analytics, inventory adjustments, double-entry ledger & system settings."
                  roleRequired="Admin, Branch Manager"
                  shortcut="Alt + 1"
                  placement="bottom"
                  align="left"
                >
                  <button
                    type="button"
                    onClick={() => handleSetMode('admin')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      appMode === 'admin' && activeTab !== 'pos'
                        ? 'bg-white text-pink-700 shadow-md scale-105 font-black'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Switch to Admin Dashboard (Alt + 1)"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-xs">Admin</span>
                  </button>
                </CapabilityTooltip>

                <CapabilityTooltip
                  title="Retail POS Terminal"
                  description="Open high-speed cash/M-Pesa checkout till with barcode scanner and Option 1 roll pricing."
                  roleRequired="All Roles"
                  shortcut="Alt + 2"
                  placement="bottom"
                  align="left"
                >
                  <button
                    type="button"
                    onClick={() => handleSetMode('pos')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      appMode === 'pos' || activeTab === 'pos'
                        ? 'bg-white text-pink-700 shadow-md scale-105 font-black'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Switch to POS Terminal (Alt + 2)"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-xs">POS</span>
                  </button>
                </CapabilityTooltip>
              </div>
            ) : (
              <CapabilityTooltip
                title="Staff POS Mode Active"
                description="Current terminal restricted to fast counter sales and inventory lookups."
                roleRequired="Cashier, Attendant"
                placement="bottom"
                align="left"
              >
                <div
                  className="px-3.5 py-2 bg-white/15 border border-white/20 rounded-xl text-white backdrop-blur-md shadow-xs flex items-center gap-2 text-xs font-bold"
                  title="POS Terminal (Staff Mode Active)"
                >
                  <ShoppingBag className="w-5 h-5 text-pink-200" />
                  <span>POS</span>
                </div>
              </CapabilityTooltip>
            )}

            {/* Location / Shop Selector */}
            <div className="relative" ref={locationDropdownRef}>
              <CapabilityTooltip
                title="Branch & Store Selector"
                description="Switch active inventory depot, stock levels, and POS checkout shop."
                roleRequired="Admin, Manager"
                shortcut="Alt + L"
                placement="bottom"
                align="center"
              >
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsLocationDropdownOpen(prev => !prev);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer group border shadow-xs ${
                    isLocationDropdownOpen
                      ? 'bg-white text-pink-900 border-white shadow-md font-bold'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                  title={`Active Branch: ${activeLocInfo?.name || 'All Branches'}`}
                >
                  <Building className={`w-5 h-5 transition-transform shrink-0 ${isLocationDropdownOpen ? 'text-pink-700 scale-110' : 'text-white group-hover:scale-110'}`} />
                  <span className="text-xs font-bold max-w-[95px] lg:max-w-[125px] truncate">
                    {getLocationShortLabel(activeLocation)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                      isLocationDropdownOpen ? 'rotate-180 text-pink-700' : 'text-white/70 group-hover:text-white'
                    }`}
                  />
                </button>
              </CapabilityTooltip>

              {/* Location Dropdown Menu */}
              <AnimatePresence>
                {isLocationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full right-0 mt-2 w-[380px] lg:w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-[9999] text-slate-900 ring-1 ring-black/5 overflow-hidden"
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
                        const stockInLocation = products.reduce((acc, p) => acc + (p.locationStock?.[loc.id] || 0), 0);
                        const isHub = loc.type === 'Main Store';
                        const isRetail = loc.canSellDirectly;

                        return (
                          <button
                            key={loc.id}
                            type="button"
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

            {/* Staff Role Switcher (Admin Only) */}
            {isAdmin && (
              <div className="relative" ref={roleDropdownRef}>
                <CapabilityTooltip
                  title="Switch Staff Role"
                  description="Switch active operating context and permissions between Cashier, Attendant, Warehouse, Manager, or Accountant."
                  roleRequired="Admin Only"
                  shortcut="Alt + U"
                  placement="bottom"
                  align="center"
                >
                  <button
                    type="button"
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
                    title={`Active Staff Role: ${roleOptions.find(r => r.role === activeRole)?.title || activeRole}`}
                  >
                    <UserCheck className={`w-3.5 h-3.5 transition-transform shrink-0 ${isRoleDropdownOpen ? 'text-indigo-700 scale-110' : 'text-white group-hover:scale-110'}`} />
                    <span className="text-xs font-bold max-w-[75px] lg:max-w-[95px] truncate">
                      {getRoleShortLabel(activeRole)}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 shrink-0 ${
                        isRoleDropdownOpen ? 'rotate-180 text-indigo-700' : 'text-white/70 group-hover:text-white'
                      }`}
                    />
                  </button>
                </CapabilityTooltip>

                {/* Role Dropdown Menu */}
                <AnimatePresence>
                  {isRoleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute top-full right-0 mt-2 w-[380px] lg:w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-[9999] text-slate-900 ring-1 ring-black/5 overflow-hidden"
                    >
                      <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Switch Staff Role</p>
                            <p className="text-[11px] text-slate-500 font-medium">Select role-specific view & permissions</p>
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
                              type="button"
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

            {/* Mail & Pending Transfers Inbox Button */}
            <CapabilityTooltip
              title="Store Messages & Waybills"
              description="View internal branch communications, low stock alerts, and receive inter-store transfer waybills."
              roleRequired="All Roles"
              shortcut="Alt + I"
              tip={`${pendingTransfersCount} pending transfers, ${unreadMails} unread notifications.`}
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => setIsMailDrawerOpen(true)}
                className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                  totalMessageAlerts > 0
                    ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 font-black animate-pulse shadow-lg shadow-amber-400/60 ring-2 ring-amber-300/80 scale-105'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                }`}
                title={`Store Messages & Transfers: ${pendingTransfersCount} pending, ${unreadMails} unread`}
              >
                <Mail className={`w-5 h-5 ${totalMessageAlerts > 0 ? 'animate-bounce text-slate-950' : ''}`} />
                <span>Inbox</span>
                {totalMessageAlerts > 0 && (
                  <span className="bg-rose-600 text-white border border-amber-300 font-black text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                    {totalMessageAlerts}
                  </span>
                )}
              </button>
            </CapabilityTooltip>

            {/* Fabric Rolls Button */}
            <CapabilityTooltip
              title="Fabric Roll Manager (Scissors)"
              description="Manage individual Fleece and Dereec fabric rolls with exact meter tracking, batch intake, and roll cutting."
              roleRequired="Admin, Branch Manager, Warehouse Operator"
              shortcut="Alt + R"
              tip="Manage piece goods and print roll barcodes."
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsFabricRollModalOpen(true);
                }}
                className="px-3 py-2 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-teal-400/40 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold group"
                title="Fabric Rolls & Piece Goods Inventory"
              >
                <Layers className="w-5 h-5 text-teal-200 group-hover:scale-110 transition-transform" />
                <span>Fabric</span>
                {fabricRolls.length > 0 && (
                  <span className="bg-teal-300 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {fabricRolls.filter(r => r.status !== 'depleted').length}
                  </span>
                )}
              </button>
            </CapabilityTooltip>

            {/* RMA / Returns Button */}
            <CapabilityTooltip
              title="RMA Returns & Defect Quarantine"
              description="Process customer fabric returns, yarn defect claims, and quarantine damaged rolls."
              roleRequired="Branch Manager, Accountant, Admin"
              shortcut="Alt + M"
              tip="Quarantined items are isolated from active inventory."
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsReturnExchangeModalOpen(true);
                }}
                className="px-3 py-2 bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-amber-400/40 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold group"
                title="RMA / Returns & Exchanges"
              >
                <RotateCcw className="w-5 h-5 text-amber-200 group-hover:rotate-180 transition-transform duration-500" />
                <span>RMA</span>
                {quarantinedDefects.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {quarantinedDefects.length}
                  </span>
                )}
              </button>
            </CapabilityTooltip>

            {/* Camera Barcode Scanner */}
            <CapabilityTooltip
              title="Camera Barcode Scanner"
              description="Use smartphone or tablet camera to scan 1D Code 128 barcodes and 2D QR codes."
              roleRequired="All Roles"
              tip="Useful for floor audits & stocktaking."
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => setIsMobileBarcodeScannerOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-400/50 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold group"
                title="Camera Barcode Scanner"
              >
                <Camera className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Barcode</span>
              </button>
            </CapabilityTooltip>

            {/* Batch QR Scanner */}
            <CapabilityTooltip
              title="Batch QR Scanner"
              description="Scan 2D QR codes on fabric rolls, customer receipts, and transfer waybills."
              roleRequired="All Roles"
              placement="bottom"
              align="center"
            >
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-slate-700 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold group"
                title="Open Batch QR Scanner"
              >
                <QrCode className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
                <span>QR</span>
              </button>
            </CapabilityTooltip>

            {/* Sound Mute / Unmute */}
            <CapabilityTooltip
              title="Audio Synthesizer & Feedback"
              description="Toggle synthesized sound effects on barcode scans, carts, errors, and checkout success."
              roleRequired="All Users"
              placement="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  soundOn
                    ? 'bg-white/15 hover:bg-white/25 border-white/30 text-white shadow-xs'
                    : 'bg-black/30 hover:bg-black/40 border-white/10 text-white/60'
                }`}
                title={soundOn ? 'Sound: Enabled' : 'Sound: Muted'}
              >
                {soundOn ? (
                  <Volume2 className="w-5 h-5 text-emerald-300" />
                ) : (
                  <VolumeX className="w-5 h-5 text-rose-300" />
                )}
              </button>
            </CapabilityTooltip>

            {/* User Guide & Knowledge Helper (All Roles) */}
            <CapabilityTooltip
              title="Interactive User Guide & Search"
              description="Ask any question, explore step-by-step guides for Fleece/Yarns, and inspect button capabilities."
              roleRequired="All Roles"
              shortcut="Alt + G"
              tip="Includes live button explorer and downloadable manuals."
              placement="bottom"
              align="right"
            >
              <button
                id="header-user-guide-btn"
                type="button"
                onClick={() => {
                  playClickSound();
                  if (setActiveTab) {
                    setActiveTab('guide');
                  }
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center group hover:scale-105 active:scale-95 border ${
                  activeTab === 'guide'
                    ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md font-bold'
                    : 'bg-white/10 hover:bg-amber-500/20 border-white/20 text-amber-300'
                }`}
                title="User Guide: Search How-To, Yarn Tare & Meter Guides"
              >
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </CapabilityTooltip>

            {/* System Settings & Governance (Admin only) */}
            {isAdmin && (
              <CapabilityTooltip
                title="System Settings & Governance"
                description="Configure brand logo, KRA ETR rates, dual-tare weights, and user security."
                roleRequired="Super Admin"
                shortcut="Alt + S"
                placement="bottom"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (setActiveTab) {
                      setActiveTab('settings');
                    } else {
                      setIsBrandSettingsModalOpen(true);
                    }
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center group hover:scale-105 active:scale-95 border ${
                    activeTab === 'settings'
                      ? 'bg-white text-pink-700 border-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                  title="System Settings, Roles, Pricing & Barcodes"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                </button>
              </CapabilityTooltip>
            )}

            {/* Executive User Profile */}
            <CapabilityTooltip
              title="User Profile & Credentials"
              description="View active operator name, role permissions, and active store station."
              roleRequired="Current User"
              shortcut="Alt + P"
              placement="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={() => setIsUserProfileModalOpen(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all cursor-pointer group flex items-center justify-center hover:scale-105 active:scale-95"
                title={`Profile: ${currentUser.name}`}
              >
                <User className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </CapabilityTooltip>

            {/* Lock Terminal / Log Out Button */}
            <CapabilityTooltip
              title="Lock Terminal & Log Out"
              description="Immediately lock and secure the POS terminal screen with PIN / Google Auth."
              roleRequired="All Users"
              shortcut="Alt + Q"
              placement="bottom"
              align="right"
            >
              <button
                id="header-lock-terminal-btn"
                type="button"
                onClick={() => {
                  playClickSound();
                  lockPlatform();
                }}
                className="px-3 py-2 bg-gradient-to-r from-rose-600/70 via-rose-700/80 to-pink-800/80 hover:from-rose-600 hover:to-pink-700 border border-rose-400/60 hover:border-rose-300 text-white rounded-xl shadow-md hover:shadow-rose-950/40 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 group font-bold text-xs"
                title="Lock Terminal & Log Out (Alt + Q)"
              >
                <Lock className="w-4 h-4 text-rose-200 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden xl:inline text-xs font-bold">Lock / Log Out</span>
              </button>
            </CapabilityTooltip>

          </div>

        </div>

      </div>

      {/* Decorative Single Wave Curved Bottom Edge (z-0, pointer-events-none so tooltips and popups always float unobstructed on top) */}
      <div className="absolute left-0 right-0 top-full -mt-0.5 w-full overflow-visible leading-none pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 120"
          className="relative block w-full h-6 sm:h-10 md:h-12 overflow-visible filter [filter:drop-shadow(0_6px_8px_rgba(0,0,0,0.25))]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="headerWaveLightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffd1dc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>

            <filter id="waveSoftGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M0,0 C480,100 960,-20 1440,60 L1440,0 L0,0 Z"
            style={{ fill: waveFillColor }}
          />

          <path
            d="M0,0 C480,100 960,-20 1440,60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.3"
            filter="url(#waveSoftGlow)"
          />

          <path
            d="M0,0 C480,100 960,-20 1440,60"
            fill="none"
            stroke="url(#headerWaveLightGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

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

        <div className="absolute inset-x-0 top-2 h-4 bg-gradient-to-r from-pink-500/10 via-white/20 to-pink-500/10 blur-md pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 3. MODERN MOBILE APP FULL-SCREEN NAVIGATION MODAL                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Full-Screen App Menu Content Container */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full h-full bg-white text-slate-900 shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              
              {/* Drawer Top Header */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-pink-50 via-rose-50 to-white border-b border-pink-100/80 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-pink-600 border-2 border-white shadow-xs flex items-center justify-center text-white font-black text-sm">
                    {(brandSettings?.brandName || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-ai text-sm font-black uppercase text-slate-900 tracking-wider">
                      {brandSettings.brandName}
                    </h2>
                    <p className="text-[10px] text-pink-700 font-bold">Mobile Navigation & Tools</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
                  title="Close Menu"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-slate-50/50">
                
                {/* User Session & Status Card */}
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 truncate text-xs">{currentUser?.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-700 font-mono font-bold border border-pink-200">
                          {isSuperAdmin ? 'SUPER ADMIN' : currentUser?.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserProfileModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Profile"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        lockPlatform();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                      title="Lock Session"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* System Mode Switcher (Admin vs POS) */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Operating Mode
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleSetMode('admin')}
                        className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          appMode === 'admin'
                            ? 'bg-rose-600 text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Admin View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetMode('pos')}
                        className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          appMode === 'pos'
                            ? 'bg-rose-600 text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>POS Terminal</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Branch Location Hub */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Active Branch Location
                    </label>
                    <span className="text-[10px] font-mono text-pink-700 font-bold">
                      {getLocationShortLabel(activeLocation)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {locations.map(loc => {
                      const isSelected = loc.id === activeLocation;
                      const stockCount = products.reduce((acc, p) => acc + (p.locationStock?.[loc.id] || 0), 0);

                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSetLocation(loc.id as LocationId)}
                          disabled={!isAdmin && loc.id !== currentStoreLocation}
                          className={`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'bg-pink-50 border-pink-500 text-pink-950 shadow-xs font-bold ring-1 ring-pink-500/20'
                              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                          } ${!isAdmin && loc.id !== currentStoreLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs truncate">{loc.name.split(' ')[0]}</span>
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-200" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-1.5">
                            <span className={`font-semibold ${loc.canSellDirectly ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {loc.canSellDirectly ? 'POS Ready' : 'Hub Only'}
                            </span>
                            <span className="font-mono text-slate-500">{stockCount} pcs</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operations & Quick Tools Bar */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Operations & Scanner Tools
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Barcode Camera */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMobileBarcodeScannerOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-300 text-slate-800 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-1 group text-center shadow-2xs cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">Barcode</span>
                    </button>

                    {/* Batch QR Scanner */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsQRScannerOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-300 text-slate-800 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-1 group text-center shadow-2xs cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">QR Scan</span>
                    </button>

                    {/* Fabric Piece Goods */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsFabricRollModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-teal-300 text-slate-800 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-1 group text-center shadow-2xs relative cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">Fabric</span>
                      {fabricRolls.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-teal-600 text-white font-black text-[8px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs">
                          {fabricRolls.filter(r => r.status !== 'depleted').length}
                        </span>
                      )}
                    </button>

                    {/* RMA Returns */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsReturnExchangeModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-amber-300 text-slate-800 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-1 group text-center shadow-2xs relative cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">RMA</span>
                      {quarantinedDefects.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white font-black text-[8px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs">
                          {quarantinedDefects.length}
                        </span>
                      )}
                    </button>

                    {/* Inbox Messages */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMailDrawerOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-rose-300 text-slate-800 hover:bg-rose-50/50 transition-all flex flex-col items-center justify-center gap-1 group text-center shadow-2xs relative cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-700 group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">Inbox</span>
                      {totalMessageAlerts > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white font-black text-[8px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                          {totalMessageAlerts}
                        </span>
                      )}
                    </button>

                    {/* Audio Sound Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 text-center shadow-2xs cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl ${soundOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">{soundOn ? 'Sound On' : 'Muted'}</span>
                    </button>
                  </div>
                </div>

                {/* Switch to Online Storefront Portal */}
                <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white border border-slate-700 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Online Customer Storefront</p>
                        <p className="text-[10px] text-slate-300 truncate">Customer catalog & M-Pesa store</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMobileMenuOpen(false);
                        setViewMode('storefront');
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      Open
                    </button>
                  </div>
                </div>

                {/* Primary App Views / Modules Navigation List */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Platform Navigation Modules
                  </label>
                  <div className="space-y-1.5">
                    {allowedNavItems.map(item => {
                      const isActive = activeTab === item.id;
                      const IconComp = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer border ${
                            isActive
                              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black shadow-md border-rose-600 ring-2 ring-pink-500/30'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-700 border border-pink-100'}`}>
                              <IconComp className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{item.label}</p>
                              <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/85' : 'text-slate-500'}`}>
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono shadow-2xs ${
                                isActive ? 'bg-white text-rose-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Staff Role Switcher (Admin Only) */}
                {isAdmin && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Switch Role (Admin)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {roleOptions.map(r => {
                        const isSelected = r.role === activeRole;
                        return (
                          <button
                            key={r.role}
                            type="button"
                            onClick={() => handleSetRole(r.role)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500/20'
                                : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <p className="text-xs font-bold truncate">{getRoleShortLabel(r.role)}</p>
                            <p className="text-[9px] text-slate-500 truncate mt-0.5">{r.badge}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsBrandSettingsModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>Brand Settings</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    lockPlatform();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Terminal</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Modals & Drawers */}
      <MailInboxDrawer
        isOpen={isMailDrawerOpen}
        onClose={() => setIsMailDrawerOpen(false)}
      />
      <BrandSettingsModal />
      <UserProfileModal />
    </header>
  );
};

export default Header;
