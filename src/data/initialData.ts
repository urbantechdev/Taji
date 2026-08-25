import {
  LocationInfo,
  ProductBatch,
  SaleOrder,
  InterStoreTransfer,
  LedgerEntry,
  AuditLog,
  StaffMember,
  PayrollRecord,
  ETRConfig,
  UserProfile,
  POSOperator,
  BranchExpense,
  DeliveryRecord,
  TareReconciliationRecord,
  MailNotification,
  KRAWithholdingTaxRecord
} from '../types';

export const INITIAL_POS_OPERATORS: POSOperator[] = [
  {
    id: 'op-super-admin',
    name: 'Executive Super Admin',
    email: 'admin@taji.co.ke',
    phone: '+254 700 111 000',
    kraPin: 'P051982341Z',
    pin: '123456',
    location: 'main_store',
    role: 'admin',
    status: 'active',
    createdBy: 'System Root',
    createdAt: new Date().toISOString()
  }
];

export const LOCATIONS: LocationInfo[] = [
  {
    id: 'main_store',
    code: 'HUB-001',
    name: 'Main Store & Central Hub',
    type: 'Main Store',
    canSellDirectly: true,
    canFulfillOrders: true,
    canRequestRestock: false,
    address: 'Textile Hub, Block A1, Industrial Area, Nairobi',
    phone: '+254 700 111 000',
    managerName: 'Branch Manager',
    managerPhone: '+254 711 000 000',
    managerEmail: 'manager.main@taji.co.ke',
    isAutonomousFinancial: true,
    openingFloat: 0,
    currentCashBalance: 0,
    bankAccountName: 'Taji Main Operating Account',
    bankAccountNumber: '',
    mpesaTillNumber: '',
    monthlyBudget: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sales_shop',
    code: 'SHP-001',
    name: 'Sales Shop (Retail POS)',
    type: 'Sales Shop',
    canSellDirectly: true,
    canFulfillOrders: false,
    canRequestRestock: true,
    address: 'Biashara Street Plaza, Ground Floor, Nairobi',
    phone: '+254 700 222 000',
    managerName: 'Retail Supervisor',
    managerPhone: '+254 722 000 000',
    managerEmail: 'shop.biashara@taji.co.ke',
    isAutonomousFinancial: true,
    openingFloat: 0,
    currentCashBalance: 0,
    bankAccountName: 'Taji Retail Outlet Account',
    bankAccountNumber: '',
    mpesaTillNumber: '',
    monthlyBudget: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'store_1',
    code: 'DEP-001',
    name: 'Store 1 (Transfer & Fulfillment Only)',
    type: 'Store 1 (Transfer Only)',
    canSellDirectly: false, // DIRECT POS DISABLED
    canFulfillOrders: false,
    canRequestRestock: true,
    address: 'Eastleigh Garment Center, Shop 14, Nairobi',
    phone: '+254 700 333 000',
    managerName: 'Depot Attendant 1',
    managerPhone: '+254 744 000 000',
    managerEmail: 'store1@taji.co.ke',
    isAutonomousFinancial: false,
    openingFloat: 0,
    currentCashBalance: 0,
    monthlyBudget: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'store_2',
    code: 'DEP-002',
    name: 'Store 2 (Transfer & Fulfillment Only)',
    type: 'Store 2 (Transfer Only)',
    canSellDirectly: false, // DIRECT POS DISABLED
    canFulfillOrders: false,
    canRequestRestock: true,
    address: 'River Road Textile Mart, Unit 8, Nairobi',
    phone: '+254 700 444 000',
    managerName: 'Depot Attendant 2',
    managerPhone: '+254 755 000 000',
    managerEmail: 'store2@taji.co.ke',
    isAutonomousFinancial: false,
    openingFloat: 0,
    currentCashBalance: 0,
    monthlyBudget: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_BRANCH_EXPENSES: BranchExpense[] = [];

export const INITIAL_PRODUCTS: ProductBatch[] = [];

export const INITIAL_ORDERS: SaleOrder[] = [];

export const INITIAL_TRANSFERS: InterStoreTransfer[] = [];

export const INITIAL_LEDGER: LedgerEntry[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const INITIAL_PAYROLL: PayrollRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_ETR_CONFIG: ETRConfig = {
  taxPin: 'P051982341Z',
  cuSerialNumber: 'KRA-CU-8812930',
  vatRate: 0.16,
  companyName: 'Taji Textile & Garment Solutions Ltd',
  companyAddress: 'Industrial Area, Block A1, P.O. Box 40210 - 00100 Nairobi, Kenya',
  companyPhone: '+254 700 111 000',
  companyEmail: 'billing@taji.co.ke',
  receiptFooterMessage: 'Thank you for trading with Taji. Official KRA ETR Tax Invoice.'
};

export const INITIAL_BRAND_SETTINGS = {
  brandName: 'Taji',
  tagline: 'Textile Inventory & ETR Billing Platform',
  primaryColor: '#B50044', // Taji Pink #B50044
  accentColor: '#9f003c',
  headerBgColor: 'pink', // Options: 'pink', 'rose', 'slate', 'indigo', 'emerald'
  logoUrl: 'https://i.pinimg.com/736x/b2/47/2b/b2472b0a27beee4bf5d46d692ae0d8ed.jpg',
  faviconUrl: ''
};

export const INITIAL_MAIL_NOTIFICATIONS: MailNotification[] = [];

export const CURRENT_USER: UserProfile = {
  id: 'op-super-admin',
  name: 'Executive Super Admin',
  email: 'admin@taji.co.ke',
  phone: '+254 700 111 000',
  role: 'admin',
  assignedLocation: 'main_store',
  kraPin: 'P051982341Z',
  pin: '123456',
  status: 'active'
};

export const INITIAL_DELIVERIES: DeliveryRecord[] = [];

export const INITIAL_TARE_RECONCILIATION_LOGS: TareReconciliationRecord[] = [];

export const INITIAL_WHT_RECORDS: KRAWithholdingTaxRecord[] = [
  {
    id: 'WHT-2026-01',
    entityName: 'Otieno & Co Certified Public Accountants & Tax Auditors',
    entityPin: 'P051449102X',
    natureOfTransaction: 'Professional, Legal & Audit Fees (5%)',
    rate: 0.05,
    grossAmount: 80000,
    whtAmount: 4000,
    netPayable: 76000,
    certificateNo: 'KRA-WHT-2026-8819',
    direction: 'Withheld_By_Us_Payable',
    period: 'August 2026',
    settled: false,
    prnNumber: 'PRN-991823-WHT',
    issueDate: '2026-08-10'
  },
  {
    id: 'WHT-2026-02',
    entityName: 'Amani Legal Advocates & Corporate Counsel',
    entityPin: 'P051338811K',
    natureOfTransaction: 'Professional, Legal & Audit Fees (5%)',
    rate: 0.05,
    grossAmount: 50000,
    whtAmount: 2500,
    netPayable: 47500,
    certificateNo: 'KRA-WHT-2026-8820',
    direction: 'Withheld_By_Us_Payable',
    period: 'August 2026',
    settled: false,
    prnNumber: 'PRN-991824-WHT',
    issueDate: '2026-08-14'
  },
  {
    id: 'WHT-2026-03',
    entityName: 'Bungoma Industrial Transporters & Logistics',
    entityPin: 'P051893112Y',
    natureOfTransaction: 'Contractual / Transport Services (3%)',
    rate: 0.03,
    grossAmount: 45000,
    whtAmount: 1350,
    netPayable: 43650,
    certificateNo: 'KRA-WHT-2026-8821',
    direction: 'Withheld_By_Us_Payable',
    period: 'August 2026',
    settled: false,
    issueDate: '2026-08-16'
  },
  {
    id: 'WHT-2026-04',
    entityName: 'Commercial Property Warehouse Ltd',
    entityPin: 'P051772199Z',
    natureOfTransaction: 'Commercial Warehouse Rent (10%)',
    rate: 0.10,
    grossAmount: 85000,
    whtAmount: 8500,
    netPayable: 76500,
    certificateNo: 'KRA-WHT-2026-8822',
    direction: 'Withheld_By_Us_Payable',
    period: 'August 2026',
    settled: false,
    issueDate: '2026-08-01'
  },
  {
    id: 'WHT-2026-05',
    entityName: 'Apex Textiles Corporate Client & Garment Manufacturers',
    entityPin: 'P051998822A',
    natureOfTransaction: 'B2B Customer Invoiced Sales (5% Credit)',
    rate: 0.05,
    grossAmount: 120000,
    whtAmount: 6000,
    netPayable: 114000,
    certificateNo: 'KRA-WHT-5%-2026-9011',
    direction: 'Withheld_By_Customer_Receivable',
    period: 'August 2026',
    settled: true,
    issueDate: '2026-08-18'
  }
];

export const INITIAL_SHIFT_CLOSURES: any[] = [
  {
    id: 'SHIFT-2026-0823-01',
    shiftNumber: 'SH-0823-01',
    locationId: 'loc-002',
    locationName: 'Sales Shop 1 (Moi Avenue)',
    operatorId: 'user-001',
    operatorName: 'John Kamau',
    operatorRole: 'cashier',
    startTime: '2026-08-23T08:00:00.000Z',
    endTime: '2026-08-23T17:30:00.000Z',
    status: 'closed',
    openingFloat: 10000,
    totalSalesOrdersCount: 8,
    totalUnitsSold: 340,
    grossSalesRevenue: 185000,
    vatLiability: 25517.24,
    netSalesRevenue: 159482.76,
    expectedCash: 65000,
    expectedMpesa: 90000,
    expectedBank: 30000,
    cashExpensesPaid: 2500,
    actualCashAtHand: 65000,
    actualMpesa: 90000,
    actualBank: 30000,
    cashVariance: 0,
    mpesaVariance: 0,
    bankVariance: 0,
    totalVariance: 0,
    cashDenominations: {
      notes1000: 55,
      notes500: 16,
      notes200: 8,
      notes100: 4,
      notes50: 0,
      coins: 0
    },
    handedOverTo: 'Central Safe Deposit / Branch Supervisor',
    closingNotes: 'Shift closed without variance. All cash bundled and deposited to branch safe.',
    closedBySupervisor: 'Evans Wachira (Branch Manager)',
    closedAt: '2026-08-23T17:35:00.000Z',
    zReportNumber: 'Z-20260823-002'
  }
];

