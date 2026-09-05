import { UserRole, LocationId } from '../types';

export interface RoleMetadata {
  role: UserRole;
  title: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotColor: string;
  defaultLocation: LocationId;
  allowedTabs: Array<
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
    | 'guide'
  >;
  permissions: {
    canManageUsers: boolean;
    canManageStaff: boolean;
    canAccessCFOAdvisor: boolean;
    canExecuteForensicAudit: boolean;
    canManageGeneralLedger: boolean;
    canDisbursePayroll: boolean;
    canConfigureETR: boolean;
    canDirectPOSSale: boolean;
    canManageBranchExpenses: boolean;
    canCreateLocations: boolean;
    canAddProductBatches: boolean;
    canDispatchTransfers: boolean;
    canReceiveTransfers: boolean;
    canViewCostPrice: boolean;
    canEditMasterPricing: boolean;
    canDeleteInventory: boolean;
    canAdjustCashFloat: boolean;
    canAccessSystemSettings: boolean;
  };
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMetadata> = {
  admin: {
    role: 'admin',
    title: 'Super Administrator / Executive',
    shortLabel: 'Executive Admin',
    description: 'Master root authority across all multi-branch operations, KRA compliance, user creation, forensic audits, and general ledgers.',
    badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    dotColor: 'bg-rose-400',
    defaultLocation: 'main_store',
    allowedTabs: [
      'dashboard',
      'sales_today',
      'branches',
      'pos',
      'catalog',
      'transfers',
      'ledger',
      'etr',
      'payroll',
      'operators',
      'audit',
      'gmail',
      'settings',
      'guide'
    ],
    permissions: {
      canManageUsers: true,
      canManageStaff: true,
      canAccessCFOAdvisor: true,
      canExecuteForensicAudit: true,
      canManageGeneralLedger: true,
      canDisbursePayroll: true,
      canConfigureETR: true,
      canDirectPOSSale: true,
      canManageBranchExpenses: true,
      canCreateLocations: true,
      canAddProductBatches: true,
      canDispatchTransfers: true,
      canReceiveTransfers: true,
      canViewCostPrice: true,
      canEditMasterPricing: true,
      canDeleteInventory: true,
      canAdjustCashFloat: true,
      canAccessSystemSettings: true
    }
  },
  hr_manager: {
    role: 'hr_manager',
    title: 'Human Resources & People Operations Manager',
    shortLabel: 'HR Manager',
    description: 'Autonomous employee onboarding, personnel records, KRA statutory compliance (PAYE, NSSF, SHIF, Housing Levy), and monthly staff payroll.',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
    dotColor: 'bg-fuchsia-400',
    defaultLocation: 'main_store',
    allowedTabs: [
      'dashboard',
      'payroll',
      'branches',
      'operators',
      'audit',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: true,
      canManageStaff: true,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: true,
      canConfigureETR: false,
      canDirectPOSSale: false,
      canManageBranchExpenses: true,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: false,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  branch_manager: {
    role: 'branch_manager',
    title: 'Autonomous Branch Manager',
    shortLabel: 'Branch Manager',
    description: 'Oversees local store operations, manages petty cash float and expense vouchers, reviews branch stock, and approves branch restock requests.',
    badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    dotColor: 'bg-blue-400',
    defaultLocation: 'sales_shop',
    allowedTabs: [
      'dashboard',
      'sales_today',
      'branches',
      'pos',
      'catalog',
      'transfers',
      'ledger',
      'etr',
      'audit',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: true,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: true,
      canManageBranchExpenses: true,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: true,
      canReceiveTransfers: true,
      canViewCostPrice: true,
      canEditMasterPricing: true,
      canDeleteInventory: false,
      canAdjustCashFloat: true,
      canAccessSystemSettings: false
    }
  },
  accountant: {
    role: 'accountant',
    title: 'Finance Manager & Tax Auditor',
    shortLabel: 'Finance & Auditor',
    description: 'Controls 3-statement financial accounting, General Ledger reconciliation, inventory valuation, KRA VAT returns, petty cash audits, and payroll verification.',
    badgeClass: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    dotColor: 'bg-purple-400',
    defaultLocation: 'main_store',
    allowedTabs: [
      'dashboard',
      'sales_today',
      'catalog',
      'ledger',
      'etr',
      'payroll',
      'branches',
      'audit',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: true,
      canExecuteForensicAudit: true,
      canManageGeneralLedger: true,
      canDisbursePayroll: true,
      canConfigureETR: true,
      canDirectPOSSale: false,
      canManageBranchExpenses: true,
      canCreateLocations: false,
      canAddProductBatches: true,
      canDispatchTransfers: false,
      canReceiveTransfers: true,
      canViewCostPrice: true,
      canEditMasterPricing: true,
      canDeleteInventory: false,
      canAdjustCashFloat: true,
      canAccessSystemSettings: false
    }
  },
  sales_shop_cashier: {
    role: 'sales_shop_cashier',
    title: 'Retail POS Cashier',
    shortLabel: 'POS Cashier',
    description: 'Direct customer retail point-of-sale checkout, ETR invoice printing, held cart management, and inventory stock check.',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    dotColor: 'bg-emerald-400',
    defaultLocation: 'sales_shop',
    allowedTabs: [
      'pos',
      'sales_today',
      'catalog',
      'etr',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: true,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: true,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  branch_cashier: {
    role: 'branch_cashier',
    title: 'Branch POS Cashier',
    shortLabel: 'Branch Cashier',
    description: 'Branch retail point-of-sale customer checkout, receipt issuance, and cash drawer sales recording.',
    badgeClass: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
    dotColor: 'bg-teal-400',
    defaultLocation: 'sales_shop',
    allowedTabs: [
      'pos',
      'sales_today',
      'catalog',
      'etr',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: true,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: true,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  main_store_operator: {
    role: 'main_store_operator',
    title: 'Central Hub / Warehouse Operator',
    shortLabel: 'Warehouse Operator',
    description: 'Responsible for central inventory management, batch intake, bulk dispatching, and fulfilling restock requests.',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    dotColor: 'bg-amber-400',
    defaultLocation: 'main_store',
    allowedTabs: [
      'catalog',
      'transfers',
      'branches',
      'audit',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: false,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: true,
      canDispatchTransfers: true,
      canReceiveTransfers: true,
      canViewCostPrice: true,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  store_1_attendant: {
    role: 'store_1_attendant',
    title: 'Store 1 Transfer Node Attendant',
    shortLabel: 'Store 1 Node',
    description: 'Transfer & fulfillment node operator. Manages rerouted customer order tickets and restock requests (direct POS disabled).',
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    dotColor: 'bg-indigo-400',
    defaultLocation: 'store_1',
    allowedTabs: [
      'transfers',
      'catalog',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: false,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: true,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  store_2_attendant: {
    role: 'store_2_attendant',
    title: 'Store 2 Transfer Node Attendant',
    shortLabel: 'Store 2 Node',
    description: 'Transfer & fulfillment node operator. Manages rerouted customer order tickets and restock requests (direct POS disabled).',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    dotColor: 'bg-cyan-400',
    defaultLocation: 'store_2',
    allowedTabs: [
      'transfers',
      'catalog',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: false,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: true,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  },
  pos_cashier: {
    role: 'pos_cashier',
    title: 'Point of Sale Cashier',
    shortLabel: 'POS Cashier',
    description: 'Front-desk point of sale terminal operator. Handles retail checkout, barcode scanning, M-Pesa receipts, and customer billing.',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    dotColor: 'bg-emerald-400',
    defaultLocation: 'sales_shop',
    allowedTabs: [
      'pos',
      'sales_today',
      'catalog',
      'etr',
      'gmail',
      'guide'
    ],
    permissions: {
      canManageUsers: false,
      canManageStaff: false,
      canAccessCFOAdvisor: false,
      canExecuteForensicAudit: false,
      canManageGeneralLedger: false,
      canDisbursePayroll: false,
      canConfigureETR: false,
      canDirectPOSSale: true,
      canManageBranchExpenses: false,
      canCreateLocations: false,
      canAddProductBatches: false,
      canDispatchTransfers: false,
      canReceiveTransfers: false,
      canViewCostPrice: false,
      canEditMasterPricing: false,
      canDeleteInventory: false,
      canAdjustCashFloat: false,
      canAccessSystemSettings: false
    }
  }
};

export const getRoleMetadata = (role: UserRole): RoleMetadata => {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.admin;
};

export const hasPermission = (
  role: UserRole,
  permission: keyof RoleMetadata['permissions']
): boolean => {
  const metadata = getRoleMetadata(role);
  return Boolean(metadata?.permissions?.[permission]);
};

export const isTabAllowedForRole = (
  role: UserRole,
  tabId: string
): boolean => {
  const metadata = getRoleMetadata(role);
  return metadata.allowedTabs.includes(tabId as any);
};

export const isAdminRole = (role: UserRole): boolean => {
  return role === 'admin' || role === 'accountant';
};

export const isGoogleSignInRequired = (role: UserRole): boolean => {
  return role === 'admin' || role === 'accountant';
};
