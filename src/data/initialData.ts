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
  KRAWithholdingTaxRecord,
  QuarantinedDefectRecord,
  ETIMSCreditNote,
  FabricRollRecord,
  FixedAsset,
  KRAInputVATClaim,
  StockAlertSettings
} from '../types';

export const INITIAL_POS_OPERATORS: POSOperator[] = [
  {
    id: 'op-super-admin',
    name: 'Executive Super Admin',
    email: 'gduniversalstudio@gmail.com',
    phone: '+254 700 000 000',
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
  tagline: 'Powered by urbantechdev',
  primaryColor: '#B50044', // Taji Pink #B50044
  accentColor: '#9f003c',
  headerBgColor: 'pink', // Options: 'pink', 'rose', 'slate', 'indigo', 'emerald'
  logoUrl: 'https://i.pinimg.com/736x/b2/47/2b/b2472b0a27beee4bf5d46d692ae0d8ed.jpg',
  faviconUrl: ''
};

export const INITIAL_STOCK_ALERT_SETTINGS: StockAlertSettings = {
  defaultLowStockThreshold: 50,
  lowStockEvaluationMode: 'location_specific',
  enableCustomBatchThresholds: true,
  autoReorderNotification: true,
  deadStockPeriodDays: 60,
  deadStockCalculationBasis: 'either_creation_or_no_sale',
  minRemainingStockForDeadStock: 1,
  deadStockDiscountSuggestionPct: 20,
  categoryLowStockThresholds: {
    Dereck: 50,
    Fleece: 50,
    Yarns: 30
  }
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

export const INITIAL_WHT_RECORDS: KRAWithholdingTaxRecord[] = [];

export const INITIAL_SHIFT_CLOSURES: any[] = [];

export const INITIAL_QUARANTINED_DEFECTS: QuarantinedDefectRecord[] = [];

export const INITIAL_FABRIC_ROLLS: FabricRollRecord[] = [];

export const INITIAL_CREDIT_NOTES: ETIMSCreditNote[] = [];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [];

export const INITIAL_INPUT_VAT_CLAIMS: KRAInputVATClaim[] = [];




