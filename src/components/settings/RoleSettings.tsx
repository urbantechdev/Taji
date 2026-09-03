import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ROLE_DEFINITIONS, RoleMetadata, getRoleMetadata } from '../../utils/rbac';
import { UserRole } from '../../types';
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Check,
  RotateCcw,
  Building,
  UserCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const RoleSettings: React.FC = () => {
  const { currentUser, setActiveRole, activeRole, recordAuditLog } = useERP();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Local state for interactive role permission overrides
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RoleMetadata['permissions']>>(() => {
    const initial: any = {};
    Object.keys(ROLE_DEFINITIONS).forEach(roleKey => {
      initial[roleKey] = { ...ROLE_DEFINITIONS[roleKey as UserRole].permissions };
    });
    return initial;
  });

  const allRoles: UserRole[] = [
    'admin',
    'hr_manager',
    'branch_manager',
    'accountant',
    'sales_shop_cashier',
    'branch_cashier',
    'main_store_operator',
    'store_1_attendant',
    'store_2_attendant'
  ];

  const currentRoleMeta = ROLE_DEFINITIONS[selectedRole];
  const permissions = rolePermissions[selectedRole] || currentRoleMeta.permissions;

  const permissionCategories: Array<{
    id: string;
    title: string;
    description: string;
    permissions: Array<{
      key: keyof RoleMetadata['permissions'];
      label: string;
      description: string;
      isDangerous?: boolean;
    }>;
  }> = [
    {
      id: 'system',
      title: 'System, Governance & Users',
      description: 'Administrative power, user management, and audit inspection',
      permissions: [
        { key: 'canManageUsers', label: 'Manage POS Operators & PINs', description: 'Create, edit, reset PINs, and delete system operators', isDangerous: true },
        { key: 'canManageStaff', label: 'Manage HR Employees', description: 'Onboard and manage staff directory and statutory IDs' },
        { key: 'canAccessSystemSettings', label: 'Access System Settings', description: 'Configure master pricing, financial rules, roles, and backups', isDangerous: true },
        { key: 'canExecuteForensicAudit', label: 'Execute Forensic Audits', description: 'Run integrity checks across double-entry transactions and inventory logs' },
        { key: 'canAccessCFOAdvisor', label: 'CFO AI Financial Advisor', description: 'Access executive financial insights, balance sheet analysis & forecasts' },
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory & Master Pricing',
      description: 'Stock catalog, batch intake, transfer dispatch, and pricing controls',
      permissions: [
        { key: 'canEditMasterPricing', label: 'Edit Master Pricing & Margins', description: 'Change retail, wholesale, and category profit margins', isDangerous: true },
        { key: 'canViewCostPrice', label: 'View Cost Price (COGS)', description: 'Inspect confidential supplier acquisition costs and unit margins' },
        { key: 'canAddProductBatches', label: 'Add New Product Batches', description: 'Intake new fabrics, rolls, yarns, and assign barcodes' },
        { key: 'canDeleteInventory', label: 'Delete / Deplete Inventory Batches', description: 'Permanently remove batches from active stock catalogs', isDangerous: true },
        { key: 'canDispatchTransfers', label: 'Dispatch Inter-Store Transfers', description: 'Ship products between central warehouse and branches' },
        { key: 'canReceiveTransfers', label: 'Receive Restock Deliveries', description: 'Verify and acknowledge incoming inventory at destination' },
      ]
    },
    {
      id: 'financial',
      title: 'Financial & General Ledger',
      description: 'Double-entry bookkeeping, KRA compliance, and expense management',
      permissions: [
        { key: 'canManageGeneralLedger', label: 'General Ledger Entries', description: 'Post manual journal entries and review trial balances' },
        { key: 'canConfigureETR', label: 'Configure KRA ETR Fiscal Device', description: 'Modify Tax PIN, CU Serial numbers, and VAT rates', isDangerous: true },
        { key: 'canManageBranchExpenses', label: 'Approve Branch Expense Vouchers', description: 'Record petty cash expenses and deductions from store revenue' },
        { key: 'canAdjustCashFloat', label: 'Adjust Cash Float & Till Drawers', description: 'Reconcile morning cash floats and cashier till adjustments' },
        { key: 'canDisbursePayroll', label: 'Disburse HR Payroll', description: 'Generate monthly payslips with PAYE, NSSF, and SHA deductions' },
      ]
    },
    {
      id: 'pos_sales',
      title: 'Point of Sale & Store Front',
      description: 'Customer order processing, receipt generation, and branch operations',
      permissions: [
        { key: 'canDirectPOSSale', label: 'Direct POS Customer Checkout', description: 'Process cash, M-Pesa, card, and credit sales to customers' },
        { key: 'canCreateLocations', label: 'Provision New Autonomous Branches', description: 'Add new retail branches and autonomous store locations', isDangerous: true },
      ]
    }
  ];

  const handleTogglePermission = (key: keyof RoleMetadata['permissions']) => {
    playClickSound();
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [key]: !prev[selectedRole][key]
      }
    }));
    setFeedback(`Updated permission "${String(key)}" for role ${currentRoleMeta.title}`);
    recordAuditLog('ROLE_PERMISSION_CHANGED', `Toggled ${String(key)} for ${selectedRole}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetToDefaults = () => {
    playClickSound();
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: { ...ROLE_DEFINITIONS[selectedRole].permissions }
    }));
    playSuccessSound();
    setFeedback(`Reset ${currentRoleMeta.title} permissions to factory defaults.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSwitchRole = (role: UserRole) => {
    playClickSound();
    setActiveRole(role);
    setFeedback(`Switched active role to ${ROLE_DEFINITIONS[role].title}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6" id="role-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Role-Based Access Control (RBAC) Settings
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                Security Matrix
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Inspect, customize, and govern granular permissions, allowed navigation tabs, and system authorities for each user role.
            </p>
          </div>
        </div>

        {/* Current Active Role Indicator & Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Active Role:</span>
          </div>
          <span className="text-xs font-black text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            {getRoleMetadata(activeRole).shortLabel}
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2-Column Layout: Roles Directory + Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Roles */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-700" />
                System User Roles
              </h4>
              <span className="text-[10px] font-bold text-slate-500">{allRoles.length} Defined</span>
            </div>

            {/* Role List */}
            <div className="space-y-1.5">
              {allRoles.map(roleKey => {
                const meta = ROLE_DEFINITIONS[roleKey];
                const isSelected = selectedRole === roleKey;
                const isActive = activeRole === roleKey;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedRole(roleKey);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-600 text-purple-950 font-bold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                        <p className="text-xs font-black text-slate-900 truncate">{meta.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{meta.shortLabel}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm border border-emerald-300">
                          Active
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-purple-700' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Role Switcher Action */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xs space-y-2 border border-slate-800">
            <h5 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Role Switcher
            </h5>
            <p className="text-[11px] text-slate-300">
              Operate the interface and permissions as <strong>{currentRoleMeta.shortLabel}</strong>.
            </p>
            <button
              type="button"
              onClick={() => handleSwitchRole(selectedRole)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Switch to this Role</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Role Permissions Editor */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
          
          {/* Active Role Meta Card */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${currentRoleMeta.dotColor}`} />
                <h4 className="text-base font-black text-purple-950">{currentRoleMeta.title}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                  {currentRoleMeta.shortLabel}
                </span>
              </div>
              <p className="text-xs text-purple-900/80 font-medium mt-1">
                {currentRoleMeta.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              title="Reset permissions for this role"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Allowed Navigation Tabs for this Role */}
          <div className="space-y-2">
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Allowed Navigation Modules ({currentRoleMeta.allowedTabs.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {currentRoleMeta.allowedTabs.map(tab => (
                <span
                  key={tab}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="capitalize">{tab.replace('_', ' ')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Granular Permission Categories */}
          <div className="space-y-5 pt-2">
            {permissionCategories.map(category => (
              <div key={category.id} className="space-y-2.5">
                <div className="border-b border-slate-100 pb-1">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {category.title}
                  </h5>
                  <p className="text-[11px] text-slate-400">{category.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {category.permissions.map(perm => {
                    const isGranted = Boolean(permissions[perm.key]);

                    return (
                      <div
                        key={String(perm.key)}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isGranted
                            ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 opacity-70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{perm.label}</span>
                            {perm.isDangerous && (
                              <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1 py-0.2 rounded-xs">
                                High Priv
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {perm.description}
                          </p>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isGranted ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                              <XCircle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
