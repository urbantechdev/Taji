import React from 'react';
import { useERP } from '../../context/ERPContext';
import { isTabAllowedForRole, getRoleMetadata } from '../../utils/rbac';
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
  HelpCircle
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
  const { currentUser, setIsUserProfileModalOpen, locations, products } = useERP();

  const lowStockCount = products.filter(
    p => (p.locationStock?.main_store <= p.minReorderLevel) || (p.locationStock?.sales_shop <= p.minReorderLevel)
  ).length;

  const allNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'sales_today',
      label: 'Sales Today & Cash',
      icon: <TrendingUp className="w-4 h-4 text-rose-500" />,
      badge: 'Live'
    },
    {
      id: 'branches',
      label: 'Autonomous Branches',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'POS Sales & Orders',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      label: 'Inventory Management',
      icon: <Boxes className="w-4 h-4" />,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined
    },
    {
      id: 'transfers',
      label: 'Inter-Store Transfers',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: 'ledger',
      label: 'Accounting & Ledger',
      icon: <BookOpenCheck className="w-4 h-4" />,
    },
    {
      id: 'etr',
      label: 'Billing & Invoices',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'payroll',
      label: 'HR & Payroll',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'operators',
      label: 'POS Users & PINs',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'Operator Audit Trail',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'gmail',
      label: 'Inbox',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: <Settings className="w-4 h-4 text-rose-500" />,
    },
    {
      id: 'guide',
      label: 'User Guide & Manual',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
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
      className="hidden md:flex w-full md:w-64 border-r border-slate-700/50 text-slate-200 flex-col shrink-0 transition-colors duration-300 bg-gradient-to-b from-[#242830] via-[#1a1d24] to-[#121418] shadow-2xl relative overflow-y-auto overflow-x-hidden group/sidebar h-full select-none z-20"
    >
      {/* Sidebar Ambient Background Light Glow Effect */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-rose-500/15 transition-all duration-700" />
      <div className="absolute top-1/2 -right-24 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-pink-500/15 transition-all duration-700" />

      <div className="p-4 space-y-1 relative z-10 flex-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Platform Operations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
        </p>
        <nav className="space-y-1">
          {permittedNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group/btn relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer overflow-hidden ${
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
                  className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all duration-300 ${
                    isActive
                      ? 'bg-white opacity-100 shadow-[0_0_10px_rgba(255,255,255,1)]'
                      : 'bg-rose-400/0 group-hover/btn:bg-rose-400/80 group-hover/btn:opacity-100'
                  }`}
                />

                <div className="flex items-center gap-2.5 pl-1.5">
                  <span
                    className={`transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:rotate-3 ${
                      isActive ? 'text-white drop-shadow-xs' : 'text-slate-400 group-hover/btn:text-rose-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="transition-colors">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="bg-rose-950/80 text-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold border border-rose-700/50 group-hover/btn:border-rose-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Active Role Card in Sidebar Footer */}
      <div className="p-3 m-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <span className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${roleMeta.badgeClass}`}>
                {roleMeta.shortLabel}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsUserProfileModalOpen(true)}
            className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Open Account Profile Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate">{userBranch?.name || currentUser.assignedLocation}</span>
          <span className="font-mono text-emerald-400 font-bold">● Active</span>
        </div>
      </div>
    </aside>
  );
};
