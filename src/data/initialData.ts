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

export const INITIAL_PRODUCTS: ProductBatch[] = [
  {
    id: 'prod-drk-001',
    sku: 'TJI-DRK-101',
    barcode: '616110001011',
    name: 'Premium Charcoal Structured Dereck Weave',
    category: 'Dereck',
    subCategory: 'Heavy Suiting & Uniform',
    fiberComposition: '65% Poly / 35% Viscose Dereck Weave',
    colorName: 'Charcoal Black',
    colorHex: '#1e293b',
    unit: 'meter',
    unitPriceRetail: 1200,
    unitPriceBulk: 950,
    costPrice: 600,
    locationStock: {
      main_store: 450,
      sales_shop: 180,
      store_1: 220,
      store_2: 150
    },
    minReorderLevel: 50,
    imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-DRK-101-CHARCOAL-DERECK',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-drk-002',
    sku: 'TJI-DRK-102',
    barcode: '616110001028',
    name: 'Royal Navy Executive Dereck Blazer Fabric',
    category: 'Dereck',
    subCategory: 'Blazer & Trouser Weave',
    fiberComposition: '100% High-Twist Poly Dereck',
    colorName: 'Navy Blue',
    colorHex: '#1e3a8a',
    unit: 'meter',
    unitPriceRetail: 1250,
    unitPriceBulk: 980,
    costPrice: 620,
    locationStock: {
      main_store: 380,
      sales_shop: 140,
      store_1: 190,
      store_2: 110
    },
    minReorderLevel: 40,
    imageUrl: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-DRK-102-NAVY-DERECK',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-drk-003',
    sku: 'TJI-DRK-103',
    barcode: '616110001035',
    name: 'Forest Green Durable Dereck Uniform Fabric',
    category: 'Dereck',
    subCategory: 'School & Institutional Uniform',
    fiberComposition: 'Heavy Duty Poly-Cotton Dereck',
    colorName: 'Forest Green',
    colorHex: '#14532d',
    unit: 'meter',
    unitPriceRetail: 1150,
    unitPriceBulk: 900,
    costPrice: 580,
    locationStock: {
      main_store: 520,
      sales_shop: 200,
      store_1: 280,
      store_2: 160
    },
    minReorderLevel: 60,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-DRK-103-GREEN-DERECK',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-drk-004',
    sku: 'TJI-DRK-104',
    barcode: '616110001042',
    name: 'Warm Camel Stretch Dereck Weave',
    category: 'Dereck',
    subCategory: 'Designer Suiting Weave',
    fiberComposition: 'Poly-Rayon Elastane Dereck',
    colorName: 'Warm Camel',
    colorHex: '#b45309',
    unit: 'meter',
    unitPriceRetail: 1300,
    unitPriceBulk: 1050,
    costPrice: 650,
    locationStock: {
      main_store: 310,
      sales_shop: 120,
      store_1: 150,
      store_2: 90
    },
    minReorderLevel: 30,
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-DRK-104-CAMEL-DERECK',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-flc-001',
    sku: 'TJI-FLC-201',
    barcode: '616110002018',
    name: 'Taji Signature Crimson Anti-Pill Polar Fleece (320 GSM)',
    category: 'Fleece',
    subCategory: 'Heavy Polar Fleece',
    fiberComposition: '100% Anti-Pill Polyester Microfiber',
    colorName: 'Taji Crimson Red',
    colorHex: '#b50044',
    unit: 'roll',
    unitPriceRetail: 1600,
    unitPriceBulk: 1350,
    costPrice: 850,
    locationStock: {
      main_store: 45,
      sales_shop: 18,
      store_1: 25,
      store_2: 12
    },
    minReorderLevel: 10,
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-FLC-201-CRIMSON-FLEECE',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.500,
      tareType: 'fixed_tare',
      packagingDescription: 'Heavy Roll Tube (500g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-flc-002',
    sku: 'TJI-FLC-202',
    barcode: '616110002025',
    name: 'Arctic White Coral Velvet Soft Microfleece',
    category: 'Fleece',
    subCategory: 'Blanket & Loungewear Fleece',
    fiberComposition: 'Super-Soft High Pile Coral Fleece',
    colorName: 'Arctic White',
    colorHex: '#f8fafc',
    unit: 'meter',
    unitPriceRetail: 1450,
    unitPriceBulk: 1200,
    costPrice: 780,
    locationStock: {
      main_store: 420,
      sales_shop: 160,
      store_1: 210,
      store_2: 130
    },
    minReorderLevel: 40,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-FLC-202-WHITE-FLEECE',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-flc-003',
    sku: 'TJI-FLC-203',
    barcode: '616110002032',
    name: 'Heather Grey Heavy Sherpa Bonded Fleece (450 GSM)',
    category: 'Fleece',
    subCategory: 'Bonded Winter Fleece',
    fiberComposition: 'Dual-Layer Sherpa + Polar Bonded Fleece',
    colorName: 'Heather Grey',
    colorHex: '#475569',
    unit: 'roll',
    unitPriceRetail: 1800,
    unitPriceBulk: 1500,
    costPrice: 950,
    locationStock: {
      main_store: 35,
      sales_shop: 14,
      store_1: 20,
      store_2: 8
    },
    minReorderLevel: 8,
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-FLC-203-GREY-SHERPA',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.500,
      tareType: 'fixed_tare',
      packagingDescription: 'Heavy Roll Tube (500g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-flc-004',
    sku: 'TJI-FLC-204',
    barcode: '616110002049',
    name: 'Midnight Black Double-Brushed Polar Fleece',
    category: 'Fleece',
    subCategory: 'Tracksuit & Hoodie Fabric',
    fiberComposition: '100% Hydrophobic Polyester Fleece',
    colorName: 'Midnight Black',
    colorHex: '#09090b',
    unit: 'meter',
    unitPriceRetail: 1550,
    unitPriceBulk: 1300,
    costPrice: 820,
    locationStock: {
      main_store: 480,
      sales_shop: 190,
      store_1: 240,
      store_2: 170
    },
    minReorderLevel: 50,
    imageUrl: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-FLC-204-BLACK-FLEECE',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.250,
      tareType: 'fixed_tare',
      packagingDescription: 'Cardboard Core Roll (250g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-yrn-001',
    sku: 'TJI-YRN-301',
    barcode: '616110003015',
    name: 'High-Bulk Acrylic Dyed Cone Yarn 2/28 Nm',
    category: 'Yarns',
    subCategory: 'Machine & Flat Knitting Yarn',
    fiberComposition: '100% High-Bulk (HB) Acrylic Dyed Yarn',
    colorName: 'Fiery Crimson',
    colorHex: '#b50044',
    unit: 'kg',
    unitPriceRetail: 850,
    unitPriceBulk: 680,
    costPrice: 420,
    locationStock: {
      main_store: 650,
      sales_shop: 280,
      store_1: 340,
      store_2: 210
    },
    minReorderLevel: 50,
    imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-YRN-301-CRIMSON-YARN',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.070,
      tareType: 'fixed_tare',
      packagingDescription: 'Plastic Yarn Cone Spool (70g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-yrn-002',
    sku: 'TJI-YRN-302',
    barcode: '616110003022',
    name: 'Combed Cotton Knitting & Weaving Yarn 30s/2',
    category: 'Yarns',
    subCategory: 'Ring Spun Combed Yarn',
    fiberComposition: '100% Combed Long-Staple Cotton',
    colorName: 'Natural Off-White',
    colorHex: '#fef08a',
    unit: 'kg',
    unitPriceRetail: 920,
    unitPriceBulk: 740,
    costPrice: 460,
    locationStock: {
      main_store: 500,
      sales_shop: 220,
      store_1: 290,
      store_2: 180
    },
    minReorderLevel: 40,
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-YRN-302-COTTON-YARN',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.070,
      tareType: 'fixed_tare',
      packagingDescription: 'Plastic Yarn Cone Spool (70g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-yrn-003',
    sku: 'TJI-YRN-303',
    barcode: '616110003039',
    name: 'Melange Mix Grey Acrylic Sweaters Yarn',
    category: 'Yarns',
    subCategory: 'Melange Knitwear Yarn',
    fiberComposition: '100% Acrylic Melange Blended Yarn',
    colorName: 'Mix Grey',
    colorHex: '#64748b',
    unit: 'kg',
    unitPriceRetail: 880,
    unitPriceBulk: 710,
    costPrice: 440,
    locationStock: {
      main_store: 580,
      sales_shop: 240,
      store_1: 310,
      store_2: 190
    },
    minReorderLevel: 45,
    imageUrl: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-YRN-303-GREY-YARN',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.070,
      tareType: 'fixed_tare',
      packagingDescription: 'Plastic Yarn Cone Spool (70g)',
      isTareDeductedAtPOS: true
    }
  },
  {
    id: 'prod-yrn-004',
    sku: 'TJI-YRN-304',
    barcode: '616110003046',
    name: 'Royal Blue High-Tenacity Polyester Spun Yarn 40/2',
    category: 'Yarns',
    subCategory: 'Weaving & Overlock Spun Yarn',
    fiberComposition: '100% Spun Polyester 40/2',
    colorName: 'Royal Blue',
    colorHex: '#2563eb',
    unit: 'kg',
    unitPriceRetail: 780,
    unitPriceBulk: 620,
    costPrice: 380,
    locationStock: {
      main_store: 420,
      sales_shop: 180,
      store_1: 220,
      store_2: 140
    },
    minReorderLevel: 35,
    imageUrl: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80',
    qrCodeData: 'TJI-YRN-304-BLUE-YARN',
    createdAt: '2026-08-01T08:00:00Z',
    tareProfile: {
      tareWeightPerUnit: 0.070,
      tareType: 'fixed_tare',
      packagingDescription: 'Plastic Yarn Cone Spool (70g)',
      isTareDeductedAtPOS: true
    }
  }
];

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





