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
  FabricRollRecord
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

export const INITIAL_WHT_RECORDS: KRAWithholdingTaxRecord[] = [];

export const INITIAL_SHIFT_CLOSURES: any[] = [];

export const INITIAL_QUARANTINED_DEFECTS: QuarantinedDefectRecord[] = [
  {
    id: 'RMA-2026-0012',
    rmaNumber: 'RMA-2026-0012',
    orderId: 'ORD-2026-99120',
    receiptNumber: 'ETR-8812-4',
    originalInvoiceNo: 'INV-2026-4401',
    customerName: 'Kenyatta Garment Industries',
    customerPhone: '+254 722 890 123',
    returnedAt: '2026-08-24T14:30:00.000Z',
    locationId: 'main_store',
    operatorId: 'op-super-admin',
    operatorName: 'Executive Super Admin',
    defectReason: 'Broken / Snagged Yarn Ply',
    defectNotes: '2 cones had severe filament breakage and irregular twist within bale #148.',
    resolutionType: 'exchange_replacement',
    returnedItem: {
      batchId: 'BATCH-2026-001',
      productName: '2/24 NM Acrylic Yarn - Mix Grey',
      sku: 'YRN-ACR-001',
      category: 'Yarns',
      unit: 'kg',
      colorName: 'Mix Grey',
      colorHex: '#9E9E9E',
      dyeLot: '26E081',
      shadeCode: 'MIX GREY-4251',
      yarnCount: '2/24 NM',
      conesCount: 2,
      grossWeightKg: 4.140,
      tareDeductionKg: 0.140,
      netWeightKg: 4.000,
      unitPrice: 750,
      costPrice: 450,
      totalValuationRetail: 3000,
      totalValuationCost: 1800
    },
    replacementItem: {
      batchId: 'BATCH-2026-001',
      productName: '2/24 NM Acrylic Yarn - Mix Grey',
      sku: 'YRN-ACR-001',
      unit: 'kg',
      colorName: 'Mix Grey',
      dyeLot: '26E081',
      shadeCode: 'MIX GREY-4251',
      conesCount: 2,
      netWeightKg: 4.000,
      unitPrice: 750,
      totalValuationRetail: 3000
    },
    financialDetails: {
      originalPaymentMethod: 'Bank Transfer',
      priceDifferencePaidByCustomer: 0,
      priceDifferenceRefundedToCustomer: 0
    },
    quarantineStatus: 'quarantined',
    supplierName: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    supplierClaimNumber: 'CLM-OSTER-2026-091'
  }
];

export const INITIAL_FABRIC_ROLLS: FabricRollRecord[] = [
  {
    id: 'ROL-FLC-2026-001',
    rollNumber: 'Roll #01 (Bale F-101)',
    barcode: 'FLC-ROL-881201',
    batchId: 'BATCH-FLC-001',
    productName: 'Heavyweight Polar Fleece - Charcoal Black',
    category: 'Fleece',
    colorName: 'Charcoal Black',
    colorHex: '#212121',
    locationId: 'main_store',
    initialLengthMeters: 52.4,
    currentLengthMeters: 38.5,
    widthCm: 160,
    gsm: 300,
    status: 'cutting_in_progress',
    isRemnant: false,
    spoiltMetersLogged: 0,
    receivedAt: '2026-08-20T08:30:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-FLC-2026-002',
    rollNumber: 'Roll #02 (Bale F-101)',
    barcode: 'FLC-ROL-881202',
    batchId: 'BATCH-FLC-001',
    productName: 'Heavyweight Polar Fleece - Charcoal Black',
    category: 'Fleece',
    colorName: 'Charcoal Black',
    colorHex: '#212121',
    locationId: 'main_store',
    initialLengthMeters: 48.0,
    currentLengthMeters: 48.0,
    widthCm: 160,
    gsm: 300,
    status: 'sealed_full',
    isRemnant: false,
    spoiltMetersLogged: 0,
    receivedAt: '2026-08-20T08:30:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-FLC-2026-003',
    rollNumber: 'Roll #03 (Bale F-102)',
    barcode: 'FLC-ROL-881203',
    batchId: 'BATCH-FLC-002',
    productName: 'Anti-Pill Polar Fleece - Navy Blue',
    category: 'Fleece',
    colorName: 'Navy Blue',
    colorHex: '#0D47A1',
    locationId: 'store_1',
    initialLengthMeters: 63.8,
    currentLengthMeters: 63.8,
    widthCm: 160,
    gsm: 320,
    status: 'sealed_full',
    isRemnant: false,
    spoiltMetersLogged: 0,
    receivedAt: '2026-08-21T09:15:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-FLC-2026-004',
    rollNumber: 'Roll #04 - End Remnant',
    barcode: 'FLC-ROL-881204',
    batchId: 'BATCH-FLC-003',
    productName: 'Micro-Fleece Knit - Heather Grey',
    category: 'Fleece',
    colorName: 'Heather Grey',
    colorHex: '#9E9E9E',
    locationId: 'sales_shop',
    initialLengthMeters: 41.5,
    currentLengthMeters: 2.1,
    widthCm: 160,
    gsm: 260,
    status: 'remnant',
    isRemnant: true,
    remnantDiscountPct: 20,
    spoiltMetersLogged: 0,
    notes: 'End of roll piece - 2.1 meters bundle discounted 20%',
    receivedAt: '2026-08-18T10:00:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-DRK-2026-001',
    rollNumber: 'Roll #01 (Bale D-201)',
    barcode: 'DRK-ROL-990101',
    batchId: 'BATCH-DRK-001',
    productName: 'Heavyweight Dereec Fabric - Crimson Maroon',
    category: 'Dereck',
    colorName: 'Crimson Maroon',
    colorHex: '#880E4F',
    locationId: 'main_store',
    initialLengthMeters: 55.0,
    currentLengthMeters: 55.0,
    widthCm: 150,
    gsm: 340,
    status: 'sealed_full',
    isRemnant: false,
    spoiltMetersLogged: 0,
    receivedAt: '2026-08-22T14:00:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-DRK-2026-002',
    rollNumber: 'Roll #02 (Bale D-201)',
    barcode: 'DRK-ROL-990102',
    batchId: 'BATCH-DRK-001',
    productName: 'Heavyweight Dereec Fabric - Crimson Maroon',
    category: 'Dereck',
    colorName: 'Crimson Maroon',
    colorHex: '#880E4F',
    locationId: 'store_2',
    initialLengthMeters: 46.2,
    currentLengthMeters: 29.0,
    widthCm: 150,
    gsm: 340,
    status: 'cutting_in_progress',
    isRemnant: false,
    spoiltMetersLogged: 0,
    receivedAt: '2026-08-22T14:00:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  },
  {
    id: 'ROL-DRK-2026-003',
    rollNumber: 'Roll #03 (Bale D-202)',
    barcode: 'DRK-ROL-990103',
    batchId: 'BATCH-DRK-002',
    productName: 'Superfine Dereec Weave - Forest Green',
    category: 'Dereck',
    colorName: 'Forest Green',
    colorHex: '#1B5E20',
    locationId: 'main_store',
    initialLengthMeters: 50.0,
    currentLengthMeters: 46.5,
    widthCm: 150,
    gsm: 320,
    status: 'cutting_in_progress',
    isRemnant: false,
    spoiltMetersLogged: 3.5,
    notes: '3.5 meters of weft slub defect cut out and quarantined on Aug 24',
    receivedAt: '2026-08-19T11:30:00.000Z',
    supplierName: 'Oster India Garment Fabrics / Udey Udyog'
  }
];

export const INITIAL_CREDIT_NOTES: ETIMSCreditNote[] = [
  {
    id: 'CRN-2026-001',
    originalInvoiceNo: 'INV-2026-8891',
    originalCuSerial: 'KRA-CU-8812930',
    customerName: 'Amani Apparel EPZ Ltd',
    customerKraPin: 'P051289102X',
    creditReason: 'Damaged Fabric Return',
    originalAmount: 18500,
    creditAmount: 3000,
    vatCredited: 413.79,
    netCredited: 2586.21,
    issuedBy: 'Executive Super Admin',
    timestamp: '2026-08-23T11:20:00.000Z',
    fiscalSignature: 'KRA-ETIMS-SIG-99120-CRN-001'
  }
];



