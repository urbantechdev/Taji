import React from 'react';
import { useERP } from '../../context/ERPContext';
import { isTabAllowedForRole, getRoleMetadata } from '../../utils/rbac';
import { evaluateStockStatus } from '../../utils/stockThresholdEngine';
import { LedgerTab } from '../../types';
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
  LogOut,
  Sparkles,
  Ship,
  FileSpreadsheet,
  Scale,
  Wallet,
  CreditCard,
  Building
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
  const {
    currentUser,
    setIsUserProfileModalOpen,
    locations,
    products,
    orders,
    stockAlertSettings,
    setViewMode,
    lockPlatform,
    setAppMode,
    isAccountant,
    accountantSubTab,
    setAccountantSubTab
  } = useERP();

  const isAccountantRole = Boolean(isAccountant || currentUser.role === 'accountant');

  const lowStockCount = products.filter(
    p => evaluateStockStatus(p, orders, stockAlertSettings).isLowStock
  ).length;

  // Standard platform items for non-accountant users
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

  // Accounting Body Menu Items - dedicated for the Accountant Sidebar
  const accountantMenuItems: {
    id: LedgerTab;
    label: string;
    section: 'Intelligence' | 'Costing & Trade' | 'Financial Statements' | 'Tax & Reconciliation';
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'cfo_advisory',
      label: 'Virtual CFO Intelligence',
      section: 'Intelligence',
      icon: <Sparkles className="w-10 h-10 stroke-[2.2]" />,
      badge: 'AI CFO'
    },
    {
      id: 'inward_invoices',
      label: 'Inward Invoices & Consignments',
      section: 'Costing & Trade',
      icon: <Receipt className="w-10 h-10 stroke-[2.2]" />,
      badge: 'Inward'
    },
    {
      id: 'import_costing',
      label: 'Import Landed Costing & Tax',
      section: 'Costing & Trade',
      icon: <Ship className="w-10 h-10 stroke-[2.2]" />,
      badge: 'KRA Suite'
    },
    {
      id: 'debtors_aging',
      label: 'Debtors Aging & Statements',
      section: 'Costing & Trade',
      icon: <FileText className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'financial_statements',
      label: 'Financial Statements & Channels',
      section: 'Financial Statements',
      icon: <FileSpreadsheet className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'general_ledger',
      label: 'General Ledger & Trial Balance',
      section: 'Financial Statements',
      icon: <Scale className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'balance_sheet',
      label: 'Live Balance Sheet',
      section: 'Financial Statements',
      icon: <Building2 className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'income_statement',
      label: 'Income Statement (P&L)',
      section: 'Financial Statements',
      icon: <TrendingUp className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'cash_flow',
      label: 'Cash Flow Statement',
      section: 'Financial Statements',
      icon: <Wallet className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'tax_engine',
      label: 'KRA Tax & iTax Compliance',
      section: 'Tax & Reconciliation',
      icon: <Receipt className="w-10 h-10 stroke-[2.2]" />,
      badge: 'eTIMS'
    },
    {
      id: 'bank_reconciliation',
      label: 'Bank & M-Pesa Reconciliation',
      section: 'Tax & Reconciliation',
      icon: <CreditCard className="w-10 h-10 stroke-[2.2]" />,
    },
    {
      id: 'fixed_assets',
      label: 'Fixed Asset Depreciation',
      section: 'Tax & Reconciliation',
      icon: <Building className="w-10 h-10 stroke-[2.2]" />,
    }
  ];

  const handleSelectAccountantSubTab = (subTab: LedgerTab) => {
    if (setAccountantSubTab) {
      setAccountantSubTab(subTab);
    }
    if (activeTab !== 'ledger') {
      setAppMode('admin');
      setActiveTab('ledger');
    }
  };

  const roleMeta = getRoleMetadata(currentUser.role);
  const userBranch = locations.find(l => l.id === currentUser.assignedLocation);

  return (
    <aside
      className="hidden md:flex w-full md:w-72 border-r border-[#d4d4d6] text-slate-800 flex-col shrink-0 transition-colors duration-300 bg-gradient-to-b from-[#f2f2f4] via-[#e9e9eb] to-[#dfdfe2] shadow-sm relative overflow-y-auto overflow-x-hidden group/sidebar h-full select-none z-20"
    >
      {/* Sidebar Subtle Ambient Background Light Effect */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-gradient-to-br from-white/90 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-16 -right-20 w-72 h-72 bg-gradient-to-tl from-slate-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ACCOUNTANT VIEW: Dedicated Accounting & Landed Costing Sub-Menu */}
      {isAccountantRole ? (
        <div className="p-3.5 space-y-1 relative z-10 flex-1">
          {/* Sub-Menu Navigation List */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Financial Modules
            </p>
            <nav className="space-y-1">
              {accountantMenuItems.map(item => {
                const isSelected = activeTab === 'ledger' && accountantSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAccountantSubTab(item.id)}
                    className={`group/btn relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-xs leading-tight transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'text-white bg-gradient-to-r from-slate-900 via-[#1e232d] to-slate-900 shadow-md border border-slate-800 font-bold scale-[1.01]'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-gradient-to-r hover:from-pink-100/85 hover:via-rose-50/80 hover:to-white/70 hover:backdrop-blur-md hover:translate-x-0.5 hover:border-pink-300/80 border border-transparent hover:shadow-[0_4px_18px_rgba(244,114,182,0.22),inset_0_1px_2px_rgba(255,255,255,0.95)]'
                    }`}
                  >
                    {/* Active Light Reflection Sheen Beam Sweep or Lighter Pink Hover Glow Sweep */}
                    {isSelected ? (
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-reflection-sweep pointer-events-none" />
                    ) : (
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                    )}

                    {/* Active/Hover Left Glowing Bar Accent */}
                    <span
                      className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full transition-all duration-300 ${
                        isSelected
                          ? 'bg-rose-500 opacity-100 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-pink-400/0 group-hover/btn:bg-pink-400 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_rgba(244,114,182,0.95)]'
                      }`}
                    />

                    <div className="flex items-center gap-3 pl-1 min-w-0 flex-1">
                      <span
                        className={`shrink-0 transition-all duration-200 group-hover/btn:scale-110 ${
                          isSelected ? 'text-white drop-shadow-xs' : 'text-slate-800 group-hover/btn:text-pink-600 group-hover/btn:drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className={`truncate tracking-tight text-left font-bold text-[12.5px] ${
                        isSelected ? 'text-white' : 'text-slate-800 group-hover/btn:text-slate-950'
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span className={`shrink-0 ml-1 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border transition-colors ${
                        isSelected
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-slate-200/90 text-slate-700 border-slate-300 group-hover/btn:border-pink-300 group-hover/btn:bg-pink-100/90 group-hover/btn:text-pink-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW: Platform Operations Navigation for Admins and Other Staff */
        <div className="p-3.5 space-y-1 relative z-10 flex-1">
          <p className="px-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center justify-between">
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
                      ? 'text-white bg-gradient-to-r from-slate-900 via-[#1e232d] to-slate-900 shadow-md border border-slate-800 font-bold scale-[1.02]'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-gradient-to-r hover:from-pink-100/85 hover:via-rose-50/80 hover:to-white/70 hover:backdrop-blur-md hover:translate-x-1 hover:border-pink-300/80 border border-transparent hover:shadow-[0_4px_18px_rgba(244,114,182,0.22),inset_0_1px_2px_rgba(255,255,255,0.95)]'
                  }`}
                >
                  {/* Active Light Reflection Sheen Beam Sweep or Lighter Pink Hover Glow Sweep */}
                  {isActive ? (
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-reflection-sweep pointer-events-none" />
                  ) : (
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                  )}

                  {/* Active/Hover Left Glowing Bar Accent */}
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full transition-all duration-300 ${
                      isActive
                        ? 'bg-rose-500 opacity-100 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                        : 'bg-pink-400/0 group-hover/btn:bg-pink-400 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_rgba(244,114,182,0.95)]'
                    }`}
                  />

                  <div className="flex items-center gap-3 pl-1 min-w-0 flex-1">
                    <span
                      className={`shrink-0 transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:rotate-2 ${
                        isActive ? 'text-white drop-shadow-xs' : 'text-slate-700 group-hover/btn:text-pink-600 group-hover/btn:drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className={`transition-colors truncate tracking-tight text-left font-bold text-[12.5px] ${
                      isActive ? 'text-white' : 'text-slate-800 group-hover/btn:text-slate-950'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className={`shrink-0 ml-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-slate-200/90 text-slate-700 border-slate-300 group-hover/btn:border-pink-300 group-hover/btn:bg-pink-100/90 group-hover/btn:text-pink-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Switch to Online Storefront Website */}
      <div className="px-3 pb-1">
        <button
          onClick={() => setViewMode('storefront')}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-b from-white via-[#fafafb] to-[#f0f0f2] hover:bg-gradient-to-r hover:from-pink-100/85 hover:via-rose-50/75 hover:to-white/80 hover:backdrop-blur-md border border-slate-300/80 hover:border-pink-300/80 text-slate-900 flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-[0_4px_18px_rgba(244,114,182,0.20),inset_0_1px_2px_rgba(255,255,255,0.95)] group active:scale-98"
          title="Open Public Customer Website & Storefront"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-pink-100/90 group-hover:text-pink-700 flex items-center justify-center border border-slate-200 group-hover:border-pink-300 transition-all shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-slate-900 group-hover:text-slate-950 font-bold leading-tight truncate">Visit Website</span>
              <span className="block text-[10px] text-slate-500 group-hover:text-pink-600 font-medium truncate">Public Storefront</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-1.5" />
        </button>
      </div>

      {/* User Profile & Active Role Card in Sidebar Footer */}
      <div className="p-3 m-3 bg-gradient-to-b from-white via-[#fafafb] to-[#f1f1f3] border border-slate-300/80 rounded-2xl relative z-10 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{currentUser.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${roleMeta.badgeClass}`}>
                {roleMeta.shortLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => setIsUserProfileModalOpen(true)}
              className="p-2 bg-slate-100 hover:bg-pink-100/80 hover:border-pink-300/70 hover:text-pink-800 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 hover:shadow-[0_2px_10px_rgba(244,114,182,0.2)]"
              title="Open Account Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => lockPlatform()}
              className="p-2 bg-rose-50 hover:bg-rose-100 hover:border-rose-300/60 text-rose-700 rounded-xl transition-all cursor-pointer border border-rose-200 hover:shadow-xs"
              title="Lock Terminal & Log Out"
            >
              <Lock className="w-4 h-4 text-rose-700" />
            </button>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
          <span className="truncate pr-1">{userBranch?.name || currentUser.assignedLocation}</span>
          <span className="font-mono text-emerald-600 font-bold shrink-0">● Active</span>
        </div>
      </div>
    </aside>
  );
};

