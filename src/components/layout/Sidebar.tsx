import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  ArrowLeftRight,
  BookOpenCheck,
  Receipt,
  Users,
  ClipboardList,
  Mail,
  UserCheck
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'catalog'
  | 'transfers'
  | 'ledger'
  | 'etr'
  | 'payroll'
  | 'audit'
  | 'gmail'
  | 'operators';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'POS Sales & Orders',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      label: 'Product Catalog',
      icon: <Layers className="w-4 h-4" />,
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
      label: 'KRA ETR Compliance',
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
  ];

  return (
    <aside
      className="hidden md:flex w-full md:w-64 border-r border-slate-700/50 text-slate-200 flex-col shrink-0 transition-colors duration-300 bg-gradient-to-b from-[#242830] via-[#1a1d24] to-[#121418] shadow-2xl relative overflow-hidden group/sidebar"
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
          {navItems.map(item => {
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
    </aside>
  );
};
