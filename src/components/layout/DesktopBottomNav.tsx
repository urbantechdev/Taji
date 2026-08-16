import React from 'react';
import { motion } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { NavTab } from './Sidebar';
import { playClickSound } from '../../utils/audio';
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
    unreadMailCount,
    brandSettings
  } = useERP();

  const pendingTransfersCount = transfers.filter(
    t => t.status === 'pending_approval' || t.status === 'dispatched'
  ).length;

  const todayOrdersCount = orders.length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Hub',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'POS',
      icon: ShoppingCart,
      badge: todayOrdersCount > 0 ? todayOrdersCount : undefined,
      highlight: true
    },
    {
      id: 'catalog',
      label: 'Stock',
      icon: Package,
    },
    {
      id: 'transfers',
      label: 'Transfers',
      icon: ArrowLeftRight,
      badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined
    },
    {
      id: 'etr',
      label: 'ETR',
      icon: Receipt,
    },
    {
      id: 'ledger',
      label: 'Ledger',
      icon: FileSpreadsheet,
    },
    {
      id: 'operators',
      label: 'Team',
      icon: UserCheck,
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: Users,
    },
    {
      id: 'gmail',
      label: 'Inbox',
      icon: Mail,
      badge: (unreadMailCount || 0) > 0 ? unreadMailCount : undefined
    },
    {
      id: 'audit',
      label: 'Audit',
      icon: ShieldCheck,
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full hidden md:block pointer-events-auto transition-all duration-300">
      {/* Light Reflection Sheen Custom CSS Animations matching Header */}
      <style>{`
        @keyframes bottomNavReflectionSweep {
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

        .animate-nav-reflection-sweep {
          animation: bottomNavReflectionSweep 5s ease-in-out infinite;
        }
      `}</style>

      {/* Smooth Wave Curved SVG Top Edge with Glowing Light Highlight & Reflection Effect */}
      <div className="relative w-full h-8 sm:h-10 -mb-1 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full text-white drop-shadow-[0_-6px_14px_rgba(0,0,0,0.06)]"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="navWaveLightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.3" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.3" />
            </linearGradient>

            <filter id="navWaveSoftGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main solid clean white wave fill matching the bar */}
          <path
            d="M0,60 C480,-20 960,80 1440,0 L1440,60 L0,60 Z"
            fill="#ffffff"
          />

          {/* Subtle soft rose/light halo along the wave curve */}
          <path
            d="M0,60 C480,-20 960,80 1440,0"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeOpacity="0.25"
            filter="url(#navWaveSoftGlow)"
          />

          {/* Clean inner highlight stroke */}
          <path
            d="M0,60 C480,-20 960,80 1440,0"
            fill="none"
            stroke="url(#navWaveLightGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Animated Light Reflection Sheen following the wave curve */}
          <path
            d="M0,60 C480,-20 960,80 1440,0"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="400 1040"
            className="animate-nav-reflection-sweep"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(244, 63, 94, 0.6))'
            }}
          />
        </svg>

        {/* Ambient light flare reflection */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-pink-500/10 via-white/40 to-pink-500/10 blur-md pointer-events-none" />
      </div>

      {/* Main Sleek White Bar Container with Moving Light Reflection Effect */}
      <div className="w-full bg-white text-slate-900 border-t border-slate-100 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] px-2 sm:px-4 lg:px-6 py-2.5 min-h-[105px] lg:min-h-[115px] flex items-center justify-center relative overflow-hidden">
        {/* Moving Glass & Light Reflection Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-12 -bottom-12 left-0 w-[500px] sm:w-[700px] animate-nav-reflection-sweep pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-rose-100/10 via-pink-100/30 via-white/60 via-pink-100/30 via-rose-100/10 to-transparent blur-lg" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-rose-300/30 to-transparent blur-sm" />
          </div>
        </div>

        {/* Bottom Navigation Grid: evenly distributed with enlarged icons */}
        <div className="grid grid-cols-5 xl:grid-cols-10 gap-1.5 sm:gap-2.5 lg:gap-3 w-full max-w-7xl items-center relative z-10">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  playClickSound();
                  setActiveTab(item.id);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative group w-full h-18 lg:h-20 px-1 sm:px-2 py-2 rounded-2xl font-extrabold transition-all duration-150 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/35 ring-2 ring-rose-400/80'
                    : item.highlight
                    ? 'bg-rose-50 text-rose-800 border-2 border-rose-300/80 shadow-xs hover:bg-rose-100 hover:shadow-md hover:shadow-rose-500/15'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:bg-white hover:text-rose-700 hover:border-rose-300 hover:shadow-md hover:shadow-slate-300/40'
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

                {/* Enlarged Icon Container with Floating Badge */}
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-6 h-6 lg:w-7 lg:h-7 stroke-[2.2] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-600 group-hover:text-rose-600'
                  }`} />

                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-3.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-black shadow-xs shrink-0 ${
                        isActive ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Shortened Label */}
                <span className="truncate max-w-full font-sans font-extrabold text-xs lg:text-[13px] tracking-tight leading-none">
                  {item.label}
                </span>

                {/* Active Underline Pill Accent */}
                {isActive && (
                  <motion.span
                    layoutId="activeUnderline"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-1 sm:h-1.5 bg-amber-400 rounded-full z-10"
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
      </div>
    </div>
  );
};
