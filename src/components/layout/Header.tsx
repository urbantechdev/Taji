import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  User
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
    setIsMailDrawerOpen
  } = useERP();

  const [soundOn, setSoundOn] = useState<boolean>(true);

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

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const activeLocInfo = locations.find(l => l.id === activeLocation);
  const unreadMails = mailNotifications.filter(m => !m.read).length;

  const mainStoreLowCount = products.filter(p => p.locationStock.main_store <= p.minReorderLevel).length;
  const salesShopLowCount = products.filter(p => p.locationStock.sales_shop <= p.minReorderLevel).length;

  const roles: { role: UserRole; label: string; location: LocationId }[] = [
    { role: 'admin', label: 'Admin / Executive', location: 'main_store' },
    { role: 'main_store_operator', label: 'Main Store Operator', location: 'main_store' },
    { role: 'sales_shop_cashier', label: 'Sales Shop Cashier', location: 'sales_shop' },
    { role: 'store_1_attendant', label: 'Store 1 Attendant', location: 'store_1' },
    { role: 'store_2_attendant', label: 'Store 2 Attendant', location: 'store_2' },
    { role: 'accountant', label: 'Accountant', location: 'main_store' },
  ];

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
      className={`${headerBgClass} text-white sticky top-0 z-30 relative shadow-lg transition-colors duration-300 overflow-visible`}
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

      {/* Main Header Container with doubled height padding */}
      <div className="px-4 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 flex flex-wrap items-center justify-between gap-5 relative z-10">
        
        {/* Brand Title & Enlarged Animated Round Logo Frame */}
        <div className="flex items-center gap-4 sm:gap-5">
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
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/25 border-3 sm:border-4 border-white/60 p-1.5 sm:p-2 shadow-2xl ring-4 ring-white/20 flex items-center justify-center shrink-0 backdrop-blur-md overflow-hidden relative cursor-pointer group/logo hover:border-white transition-all"
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
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 flex items-center justify-center text-white font-black text-3xl sm:text-4xl md:text-5xl shadow-inner border border-white/30 group-hover/logo:scale-105 transition-transform">
                {(brandSettings?.brandName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="font-ai text-white text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-black uppercase tracking-[0.14em] select-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all hover:scale-105 duration-200 cursor-default flex items-center">
                {brandSettings.brandName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-ai font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md tracking-widest uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                AI OS
              </span>
            </div>
            
            {/* Clean White AI Circuit Line */}
            <div className="flex items-center gap-1.5 opacity-80">
              <div className="h-[2px] w-16 sm:w-24 bg-gradient-to-r from-white via-white/70 to-transparent rounded-full shadow-xs" />
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
              <div className="h-[2px] w-4 bg-white/40 rounded-full" />
            </div>

            <p className="text-xs sm:text-sm text-pink-100 font-medium hidden sm:block mt-1 font-sans">
              {brandSettings.tagline || 'Autonomous Multi-Location ERP, KRA ETR Compliance & Accounting Ledger'}
            </p>
          </div>
        </div>

        {/* Center / Right Action Bar Controls (Hidden on Mobile, accessible in Mobile Bottom Nav) */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          
          {/* Mode Switcher: POS vs Administrator Dashboard */}
          <div className="bg-black/20 p-1 rounded-2xl flex items-center gap-1 border border-white/20 backdrop-blur-xs">
            <button
              onClick={() => setAppMode('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appMode === 'admin'
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </button>

            <button
              onClick={() => setAppMode('pos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appMode === 'pos'
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">POS Terminal</span>
              <span className="sm:hidden">POS</span>
            </button>
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl px-2 py-1 backdrop-blur-xs max-w-[125px] sm:max-w-[150px]">
            <Building className="w-3.5 h-3.5 text-pink-100 shrink-0" />
            <select
              value={activeLocation}
              onChange={e => setActiveLocation(e.target.value as LocationId)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer w-full truncate"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} className="text-slate-900 font-medium">
                  {loc.name} {!loc.canSellDirectly ? '(POS Disabled)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl px-2 py-1 backdrop-blur-xs max-w-[125px] sm:max-w-[150px]">
            <UserCheck className="w-3.5 h-3.5 text-pink-100 shrink-0" />
            <select
              value={activeRole}
              onChange={e => setActiveRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer w-full truncate"
            >
              {roles.map(r => (
                <option key={r.role} value={r.role} className="text-slate-900 font-medium">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Alert Quick Badges */}
          {mainStoreLowCount > 0 && (
            <button
              onClick={() => setAppMode('admin')}
              className="hidden lg:flex items-center gap-1.5 bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 border border-rose-400/50 rounded-xl px-2.5 py-1.5 backdrop-blur-xs text-xs font-bold cursor-pointer transition-all shadow-xs group"
              title={`Main Store Hub Low Stock Alert: ${mainStoreLowCount} item(s) below reorder level`}
            >
              <Warehouse className="w-4 h-4 text-rose-300 group-hover:scale-110 transition-transform" />
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="font-mono bg-rose-600/90 px-1.5 py-0.5 rounded-md text-[11px] text-white font-bold">{mainStoreLowCount}</span>
            </button>
          )}

          {salesShopLowCount > 0 && (
            <button
              onClick={() => setAppMode('admin')}
              className="hidden lg:flex items-center gap-1.5 bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 border border-amber-400/50 rounded-xl px-2.5 py-1.5 backdrop-blur-xs text-xs font-bold cursor-pointer transition-all shadow-xs group"
              title={`Sales Shop Retail Low Stock Alert: ${salesShopLowCount} item(s) below reorder level`}
            >
              <Store className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="font-mono bg-amber-600/90 px-1.5 py-0.5 rounded-md text-[11px] text-white font-bold">{salesShopLowCount}</span>
            </button>
          )}

          {/* Mail Notifications Inbox Button */}
          <button
            onClick={() => setIsMailDrawerOpen(true)}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              unreadMails > 0
                ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 font-bold animate-pulse shadow-lg shadow-amber-400/60 ring-2 ring-amber-300/80 scale-105'
                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            }`}
            title="Store Mail & Transfer Notifications"
          >
            <Mail className={`w-4 h-4 ${unreadMails > 0 ? 'animate-bounce text-slate-950' : ''}`} />
            {unreadMails > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white border-2 border-amber-300 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-ping opacity-75" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white border-2 border-amber-300 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {unreadMails}
                </span>
              </>
            )}
          </button>

          {/* Sound Effects Audio Mute / Unmute Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 border rounded-xl transition-all cursor-pointer ${
              soundOn
                ? 'bg-white/15 hover:bg-white/25 border-white/30 text-white shadow-xs'
                : 'bg-black/30 hover:bg-black/40 border-white/10 text-white/50'
            }`}
            title={soundOn ? 'Sound Effects: Enabled (Click to mute)' : 'Sound Effects: Muted (Click to enable)'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-300" />
            )}
          </button>

          {/* Brand Settings Gear Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsBrandSettingsModalOpen(true);
            }}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Brand Color & Logo Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* QR Scanner Trigger */}
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Open Batch QR Scanner"
          >
            <QrCode className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">Scan</span>
          </button>

          {/* User Account Profile & Role Button */}
          <button
            onClick={() => setIsUserProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Open Account Profile & Role Permissions"
          >
            <div className="w-5 h-5 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-[10px] shadow-xs group-hover:scale-105 transition-transform">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[100px] sm:max-w-[130px] truncate hidden md:inline">
              {currentUser.name}
            </span>
          </button>

          {/* User Auth & PIN Switch / Lock Button */}
          {posSession?.isUnlocked || isGoogleAdminAuthenticated ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-300/50 text-emerald-100 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Active User Session - Click to Switch User or Lock Terminal"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="hidden lg:inline text-[11px]">Active</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black rounded-xl shadow-md border border-white/30 transition-all cursor-pointer"
              title="Login with Cashier PIN or Admin Google Account"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Login</span>
            </button>
          )}

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

