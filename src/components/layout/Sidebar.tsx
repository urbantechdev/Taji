import React from 'react';
import { useERP } from '../../context/ERPContext';
import { isTabAllowedForRole, getRoleMetadata } from '../../utils/rbac';
import { evaluateStockStatus } from '../../utils/stockThresholdEngine';
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
  UserCheck,
  Building2,
  Shield,
  User,
  Settings,
  TrendingUp,
  BookOpen,
  HelpCircle,
  FileText,
  Globe,
  ExternalLink,
  Lock,
  LogOut
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'sales_today'
  | 'pos'
  | 'catalog'
  | 'transfers'
  | 'ledger'
  | 'etr'
  | 'payroll'
  | 'audit'
  | 'gmail'
  | 'operators'
  | 'branches'
  | 'settings'
  | 'guide';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, setIsUserProfileModalOpen, locations, products, orders, stockAlertSettings, setViewMode, lockPlatform, setAppMode } = useERP();

  const lowStockCount = products.filter(
    p => evaluateStockStatus(p, orders, stockAlertSettings).isLowStock
  ).length;

  const allNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'sales_today',
      label: 'Sales Today & Cash',
      icon: <TrendingUp className="w-8 h-8 stroke-[2.2] text-rose-500" />,
      badge: 'Live'
    },
    {
      id: 'branches',
      label: 'Autonomous Branches',
      icon: <Building2 className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'pos',
      label: 'POS Sales & Orders',
      icon: <ShoppingCart className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'catalog',
      label: 'Inventory Management',
      icon: <Boxes className="w-8 h-8 stroke-[2.2]" />,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined
    },
    {
      id: 'transfers',
      label: 'Inter-Store Transfers',
      icon: <ArrowLeftRight className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'ledger',
      label: 'Accounting & Ledger',
      icon: <BookOpenCheck className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'etr',
      label: 'Billing & Invoices',
      icon: <Receipt className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'payroll',
      label: (currentUser.role === 'admin' || currentUser.role === 'hr_manager') ? 'HR & Payroll' : 'My Payslips & Records',
      icon: (currentUser.role === 'admin' || currentUser.role === 'hr_manager') ? <Users className="w-8 h-8 stroke-[2.2]" /> : <FileText className="w-8 h-8 stroke-[2.2] text-emerald-500" />,
    },
    {
      id: 'operators',
      label: 'POS Users & PINs',
      icon: <UserCheck className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'audit',
      label: 'Operator Audit Trail',
      icon: <ClipboardList className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'gmail',
      label: 'Inbox',
      icon: <Mail className="w-8 h-8 stroke-[2.2]" />,
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: <Settings className="w-8 h-8 stroke-[2.2] text-rose-500" />,
    },
    {
      id: 'guide',
      label: 'User Guide & Manual',
      icon: <BookOpen className="w-8 h-8 stroke-[2.2] text-amber-400" />,
      badge: 'Help'
    }
  ];

  // RBAC Filter: Only show tabs permitted for the current user's role
  const permittedNavItems = allNavItems.filter(item =>
    isTabAllowedForRole(currentUser.role, item.id)
  );

  const roleMeta = getRoleMetadata(currentUser.role);
  const userBranch = locations.find(l => l.id === currentUser.assignedLocation);

  return (
    <aside
      className="hidden md:flex w-full md:w-72 border-r border-slate-700/50 text-slate-200 flex-col shrink-0 transition-colors duration-300 bg-gradient-to-b from-[#242830] via-[#1a1d24] to-[#121418] shadow-2xl relative overflow-y-auto overflow-x-hidden group/sidebar h-full select-none z-20"
    >
      {/* Sidebar Ambient Background Light Glow Effect */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-rose-500/15 transition-all duration-700" />
      <div className="absolute top-1/2 -right-24 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-pink-500/15 transition-all duration-700" />

      <div className="p-3.5 space-y-1 relative z-10 flex-1">
        <p className="px-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Platform Operations</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </p>
        <nav className="space-y-1.5">
          {permittedNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'pos') {
                    setAppMode('pos');
                  } else {
                    setAppMode('admin');
                  }
                  setActiveTab(item.id);
                }}
                className={`group/btn relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-xs leading-tight transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 shadow-lg shadow-rose-950/60 border border-rose-400/40 font-bold scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white hover:translate-x-1 hover:border-slate-600/60 border border-transparent hover:shadow-md'
                }`}
              >
                {/* Active Light Reflection Sheen Beam Sweep */}
                {isActive && (
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-reflection-sweep pointer-events-none" />
                )}

                {/* Active/Hover Left Glowing Bar Accent */}
                <span
                  className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full transition-all duration-300 ${
                    isActive
                      ? 'bg-white opacity-100 shadow-[0_0_10px_rgba(255,255,255,1)]'
                      : 'bg-rose-400/0 group-hover/btn:bg-rose-400/80 group-hover/btn:opacity-100'
                  }`}
                />

                <div className="flex items-center gap-3 pl-1 min-w-0 flex-1">
                  <span
                    className={`shrink-0 transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:rotate-2 ${
                      isActive ? 'text-white drop-shadow-xs' : 'text-slate-400 group-hover/btn:text-rose-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="transition-colors truncate tracking-tight text-left font-bold text-[12.5px]">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="shrink-0 ml-1.5 bg-rose-950/80 text-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold border border-rose-700/50 group-hover/btn:border-rose-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Switch to Online Storefront Website */}
      <div className="px-3 pb-1">
        <button
          onClick={() => setViewMode('storefront')}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-900/70 via-pink-900/60 to-slate-900/80 hover:from-rose-800 hover:to-pink-800 border border-rose-500/40 hover:border-rose-400 text-white flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-rose-950/40 group active:scale-98"
          title="Open Public Customer Website & Storefront"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center border border-pink-400/30 group-hover:scale-105 transition-transform shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-white font-bold leading-tight truncate">Visit Website</span>
              <span className="block text-[10px] text-pink-200/80 font-medium truncate">Public Storefront</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-pink-200/80 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-1.5" />
        </button>
      </div>

      {/* User Profile & Active Role Card in Sidebar Footer */}
      <div className="p-3 m-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${roleMeta.badgeClass}`}>
                {roleMeta.shortLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => setIsUserProfileModalOpen(true)}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Open Account Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => lockPlatform()}
              className="p-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Lock Terminal & Log Out"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
          <span className="truncate pr-1">{userBranch?.name || currentUser.assignedLocation}</span>
          <span className="font-mono text-emerald-400 font-bold shrink-0">● Active</span>
        </div>
      </div>
    </aside>
  );
};
