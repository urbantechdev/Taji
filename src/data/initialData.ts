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
  StockAlertSettings,
  Supplier,
  ClearingAgent
} from '../types';

export const INITIAL_POS_OPERATORS: POSOperator[] = [
  {
    id: 'op-super-admin',
    name: 'Executive Super Admin',
    email: 'feminiholdings@gmail.com',
    phone: '+254 700 000 000',
    kraPin: 'P051982341Z',
    pin: '123456',
    location: 'main_store',
    role: 'admin',
    status: 'active',
    createdBy: 'System Root',
    createdAt: new Date().toISOString()
  },
  {
    id: 'op-accountant-lead',
    name: 'Chief Accountant & Finance Auditor',
    email: 'accountant@taji.co.ke',
    phone: '+254 700 333 444',
    kraPin: 'P059918234B',
    pin: '654321',
    location: 'main_store',
    role: 'accountant',
    status: 'active',
    createdBy: 'Executive Admin',
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

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-CN-001',
    name: 'ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD.',
    type: 'overseas_import',
    country: 'China',
    currency: 'USD',
    contactPerson: 'Lin Xiaowei (Export Sales Director)',
    email: 'export@puantextile.cn',
    phone: '+86 575 8899 1234',
    address: 'No. 88 Puan Road, Keqiao District, Shaoxing, Zhejiang, China',
    bankName: 'BANK OF CHINA, SHAOXING BRANCH',
    bankAccountNo: '3819 0291 0021 88',
    swiftBic: 'BKCHCNBJ920',
    paymentTermsDays: 45,
    category: 'Fabrics & Textiles (Poly Derek / Fleece / Interlock)',
    notes: 'Primary supplier for heavy knitted dereck fabrics and fleece rolls. Port of Loading: Ningbo / Shanghai.',
    createdAt: '2026-01-10T08:00:00.000Z',
    status: 'active'
  },
  {
    id: 'SUP-IN-002',
    name: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    type: 'overseas_import',
    country: 'India',
    currency: 'USD',
    contactPerson: 'Rajesh Singhania (Head of International Trade)',
    email: 'yarns.export@osterindia.com',
    phone: '+91 161 503 9900',
    address: 'G.T. Road, Oster Complex, Ludhiana, Punjab 141003, India',
    bankName: 'STATE BANK OF INDIA, OVERSEAS BRANCH LUDHIANA',
    bankAccountNo: '1092 8847 2910',
    swiftBic: 'SBININBB450',
    paymentTermsDays: 30,
    category: 'Acrylic & Blended Yarns (2/24 NM Cones)',
    notes: 'Premium supplier for machine knitting acrylic yarn cones (24.84kg bales). Port of Loading: Mundra / Nhava Sheva.',
    createdAt: '2026-01-15T09:30:00.000Z',
    status: 'active'
  },
  {
    id: 'SUP-KE-003',
    name: 'RIVATEX EAST AFRICA LIMITED',
    type: 'domestic_local',
    country: 'Kenya',
    kraPin: 'P051187654M',
    currency: 'KES',
    contactPerson: 'David Kiptoo (Commercial Accounts Manager)',
    email: 'sales@rivatex.co.ke',
    phone: '+254 722 205 345',
    address: 'Kipkaren Road, P.O. Box 2490-30100, Eldoret, Kenya',
    bankName: 'KENYA COMMERCIAL BANK (KCB), ELDORET BRANCH',
    bankAccountNo: '1109 4482 91',
    paymentTermsDays: 30,
    category: 'Kenyan Cotton Drill & Twill Weaves',
    notes: 'Domestic supplier with certified KRA eTIMS invoices. Eligible for 2% Withholding VAT certificates.',
    createdAt: '2026-02-01T10:00:00.000Z',
    status: 'active'
  },
  {
    id: 'SUP-KE-004',
    name: 'THIKA CLOTH MILLS LIMITED',
    type: 'domestic_local',
    country: 'Kenya',
    kraPin: 'P051112456A',
    currency: 'KES',
    contactPerson: 'Tejpal Patel (Managing Director Sales)',
    email: 'accounts@thikaclothmills.com',
    phone: '+254 733 600 812',
    address: 'Garissa Road, Industrial Area, Thika, Kenya',
    bankName: 'EQUITY BANK KENYA, THIKA SUPREME BRANCH',
    bankAccountNo: '0080 2938 4710 22',
    paymentTermsDays: 30,
    category: 'Woven Cotton Fabrics & Uniform Fabrics',
    notes: 'Kenyan manufacturer of high-tensile drill and bed-sheeting rolls. Registered for eTIMS online validation.',
    createdAt: '2026-02-05T11:15:00.000Z',
    status: 'active'
  },
  {
    id: 'SUP-KE-005',
    name: 'SPINNERS & SPINNERS KENYA LTD',
    type: 'domestic_local',
    country: 'Kenya',
    kraPin: 'P051234891Q',
    currency: 'KES',
    contactPerson: 'Naresh Shah (Credit Control & Supply Manager)',
    email: 'supply@spinnerskenya.com',
    phone: '+254 720 445 678',
    address: 'Ruaraka Industrial Area, Baba Dogo Road, Nairobi, Kenya',
    bankName: 'I&M BANK KENYA, INDUSTRIAL AREA NAIROBI',
    bankAccountNo: '0010 1198 3400',
    paymentTermsDays: 14,
    category: 'Local Spun Acrylic & Wool Blend Yarns',
    notes: 'Leading Nairobi yarn spinning and texturizing mill. Standard 16% VAT invoiced via eTIMS device.',
    createdAt: '2026-02-10T14:20:00.000Z',
    status: 'active'
  }
];

export const INITIAL_CLEARING_AGENTS: ClearingAgent[] = [
  {
    id: 'CLR-KE-001',
    name: 'BLUE PEARL LOGISTICS LIMITED',
    kraPin: 'P051506858S',
    declarantCode: 'KRA-CB-8841',
    contactPerson: 'Hassan Omar (Senior Declarant & CFS Liaison)',
    email: 'operations@bluepearllogistics.co.ke',
    phone: '+254 722 789 450',
    address: 'Cannon Towers II, 5th Floor, Moi Avenue, P.O. Box 90210, Mombasa, Kenya',
    operatingPorts: 'Mombasa Port (Kilindini CFS) & ICD Embakasi Nairobi',
    bankName: 'EQUITY BANK KENYA, MOMBASA SUPREME BRANCH',
    bankAccountNo: '0460 2938 1102 33',
    bankBranch: 'Mombasa Supreme',
    mpesaPaybill: '400222',
    paymentTermsDays: 14,
    standardAgencyFeeKES: 35000,
    cfsPortWharfageKES: 65000,
    demurrageAllowanceDays: 21,
    notes: 'KRA licensed customs clearing agent for marine containerized textiles. Pre-clearing via Simba/ICMS with rapid CFS unbundling.',
    createdAt: '2026-01-10T08:00:00.000Z',
    status: 'active'
  },
  {
    id: 'CLR-KE-002',
    name: 'BOLLORE TRANSPORT & LOGISTICS KENYA LTD',
    kraPin: 'P051122334A',
    declarantCode: 'KRA-CB-1029',
    contactPerson: 'Grace Mwende (Customs Affairs & ICD Operations)',
    email: 'customs.kenya@bollore.com',
    phone: '+254 733 910 200',
    address: 'Bollore Complex, Airport North Road, Embakasi, Nairobi, Kenya',
    operatingPorts: 'ICD Embakasi Nairobi, Kilindini Port & JKIA Air Cargo',
    bankName: 'STANDARD CHARTERED KENYA, INDUSTRIAL AREA',
    bankAccountNo: '0102 0489 2001 00',
    bankBranch: 'Industrial Area Nairobi',
    mpesaPaybill: '329329',
    paymentTermsDays: 30,
    standardAgencyFeeKES: 45000,
    cfsPortWharfageKES: 70000,
    demurrageAllowanceDays: 28,
    notes: 'Tier-1 AEO (Authorized Economic Operator) licensed with expedited Green Channel customs clearance at Kilindini and Embakasi ICD.',
    createdAt: '2026-01-15T10:00:00.000Z',
    status: 'active'
  },
  {
    id: 'CLR-KE-003',
    name: 'SIGINON GLOBAL LOGISTICS LIMITED',
    kraPin: 'P051139485F',
    declarantCode: 'KRA-CB-3490',
    contactPerson: 'Meshack Kiprono (Freight & Bonded CFS Lead)',
    email: 'info@siginon.com',
    phone: '+254 720 654 321',
    address: 'Siginon Complex, Jomo Kenyatta International Airport, Nairobi, Kenya',
    operatingPorts: 'Kilindini Port Mombasa, SGR Freight & Naivasha ICD',
    bankName: 'KCB BANK KENYA, KILINDINI BRANCH MOMBASA',
    bankAccountNo: '1189 0234 56',
    bankBranch: 'Kilindini',
    mpesaPaybill: '522522',
    paymentTermsDays: 14,
    standardAgencyFeeKES: 38000,
    cfsPortWharfageKES: 62000,
    demurrageAllowanceDays: 21,
    notes: 'Specialized in bonded CFS warehouse transfers and multimodal SGR rail haulage to Nairobi ICD.',
    createdAt: '2026-02-01T09:00:00.000Z',
    status: 'active'
  }
];





