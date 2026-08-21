export type LocationId = string;

export type LocationType = 
  | 'Main Store' 
  | 'Sales Shop' 
  | 'Independent Branch' 
  | 'Store 1 (Transfer Only)' 
  | 'Store 2 (Transfer Only)'
  | 'Warehouse / Depot'
  | 'Franchise Outlet';

export interface LocationInfo {
  id: LocationId;
  code?: string;
  name: string;
  type: LocationType;
  canSellDirectly: boolean;
  canFulfillOrders: boolean;
  canRequestRestock: boolean;
  address: string;
  phone: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  isAutonomousFinancial?: boolean; // Runs on its own financial accounts, petty cash float, and independent P&L
  openingFloat?: number; // Starting petty cash / float balance (KSh)
  currentCashBalance?: number; // Current live petty cash / cash drawer balance (KSh)
  bankAccountName?: string;
  bankAccountNumber?: string;
  mpesaTillNumber?: string;
  monthlyBudget?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export type BranchExpenseCategory = 
  | 'Rent' 
  | 'Utilities' 
  | 'Staff Supplies' 
  | 'Transport & Logistics' 
  | 'Repairs & Maintenance' 
  | 'Marketing' 
  | 'Wages & Commissions' 
  | 'Petty Cash Voucher' 
  | 'Other';

export interface BranchExpense {
  id: string;
  locationId: LocationId;
  title: string;
  amount: number;
  category: BranchExpenseCategory;
  paidVia: 'Cash Float' | 'Bank Transfer' | 'M-Pesa Till';
  paidTo?: string;
  receiptNo?: string;
  notes?: string;
  timestamp: string;
  recordedBy: string;
}

export interface BranchFinancialSummary {
  locationId: LocationId;
  locationName: string;
  locationCode: string;
  locationType: LocationType;
  isAutonomousFinancial: boolean;
  grossRevenue: number;
  vatLiability: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  currentCashFloat: number;
  bankBalanceEstimate: number;
  totalOrdersCount: number;
  inventoryItemCount: number;
  inventoryTotalValue: number;
  pendingTransfersCount: number;
}

export interface BranchCashReconciliation {
  id: string;
  locationId: LocationId;
  reconciledAt: string;
  reconciledBy: string;
  openingFloat: number;
  cashSalesRecorded: number;
  cashExpensesPaid: number;
  expectedCashInDrawer: number;
  actualCountedCash: number;
  variance: number; // positive = surplus, negative = shortage
  status: 'balanced' | 'surplus' | 'shortage';
  notes?: string;
}

export type CategoryType = 'Dereck' | 'Fleece' | 'Yarns';

export type UnitType = 'kg' | 'roll' | 'meter' | 'skein' | 'yard';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline';

export interface CategoryPricingConfig {
  category: CategoryType;
  defaultRetailPrice: number;
  defaultBulkPrice: number;
  defaultCostPrice: number;
  marginPercentage?: number;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface CategoryImageConfig {
  category: CategoryType;
  imageUrl: string;
  label: string;
  description: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface DuplicateBarcodeAlertState {
  isOpen: boolean;
  barcode: string;
  existingProduct: ProductBatch | null;
  scannedAt: string;
  scannedCategory?: CategoryType;
  targetLocation?: LocationId;
  message: string;
}

export interface MobileBarcodeScanOptions {
  category?: CategoryType;
  locationId?: LocationId;
  quantity?: number;
  unit?: UnitType;
  costPrice?: number;
  retailPrice?: number;
  bulkPrice?: number;
  name?: string;
  colorName?: string;
  colorHex?: string;
  fiberComposition?: string;
}

export type TareCalculationType = 'fixed_tare' | 'percentage_tare' | 'none';

export interface TareProfile {
  tareWeightPerUnit: number; // Tare per unit in kg (e.g., 0.050 kg = 50g plastic cone / 0.250 kg = cardboard roll core)
  tareType: TareCalculationType; // 'fixed_tare' | 'percentage_tare' | 'none'
  tarePercent?: number; // percentage tare (e.g. 2.5%)
  packagingDescription?: string; // e.g. "Plastic Yarn Cone 50g", "Cardboard Fleece Core 250g"
  packagingCost?: number; // cost of cone/container (KSh)
  isTareDeductedAtPOS?: boolean; // Whether POS automatically adjusts weight before pricing
}

export interface TareReconciliationRecord {
  id: string;
  orderId?: string;
  consignmentId?: string;
  type: 'pos_sale' | 'delivery_intake' | 'manual_audit_adjustment';
  timestamp: string;
  batchId: string;
  productName: string;
  sku: string;
  locationId: LocationId;
  grossWeight: number; // Gross weight on scale (kg)
  tareWeightDeducted: number; // Tare packaging weight removed (kg)
  netWeightBillable: number; // Pure stock net weight decremented from balance sheet (kg)
  unitPrice: number;
  costPrice: number;
  varianceCostSaved: number; // Financial over/under valuation avoided
  notes?: string;
  status: 'reconciled' | 'variance_adjusted' | 'journal_posted';
}

export interface ProductBatch {
  id: string; // e.g. BATCH-2026-001
  sku: string; // e.g. TFX-DRK-101 (Primary barcode / SKU identifier)
  barcode?: string; // Optional dedicated UPC / EAN-13 barcode
  name: string;
  category: CategoryType;
  subCategory: string; // e.g. "Polar Fleece", "Acrylic Yarn", "Heavy Dereck Weave"
  fiberComposition: string; // e.g., "100% Cotton", "80% Polyester 20% Wool"
  colorName: string; // e.g., "Crimson Red"
  colorHex: string; // e.g., "#E91E63"
  unit: UnitType;
  unitPriceRetail: number; // KSh or $ retail price per unit
  unitPriceBulk: number; // Bulk price per unit (for Main Store bulk sales)
  costPrice: number; // Internal cost per unit (for inventory valuation)
  locationStock: Record<LocationId, number>; // Stock per store location
  minReorderLevel: number; // Low stock threshold for automatic alert / request
  imageUrl?: string; // High-resolution product image URL
  qrCodeData: string; // Embedded QR payload string
  tareProfile?: TareProfile; // Dual-weight Tare Configuration
  createdAt: string;
}

export type UserRole = 
  | 'admin'
  | 'main_store_operator'
  | 'sales_shop_cashier'
  | 'store_1_attendant'
  | 'store_2_attendant'
  | 'branch_manager'
  | 'branch_cashier'
  | 'accountant';

export interface POSOperator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kraPin?: string;
  pin: string; // 6-digit PIN code
  location: LocationId;
  role: UserRole;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  createdBy?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  assignedLocation: LocationId;
  kraPin?: string;
  pin?: string;
  avatarUrl?: string;
  status?: 'active' | 'inactive';
  lastLoginAt?: string;
}

export interface POSCartItem {
  batchId: string;
  productName: string;
  category: CategoryType;
  colorName: string;
  colorHex: string;
  unit: UnitType;
  unitPrice: number;
  quantity: number;
  isBulk: boolean;
  availableStock: number;
  scaleGrossWeight?: number; // Gross weight on scale (kg)
  tareDeduction?: number; // Deducted packaging tare (kg)
  netBillableWeight?: number; // Resulting pure stock net weight
  isTareApplied?: boolean;
  tareDescription?: string;
}

export type OrderStatus = 'completed' | 'routed_to_main' | 'routed_to_shop' | 'cancelled';

export interface SaleOrder {
  id: string; // e.g. INV-2026-8891
  receiptNumber: string;
  etrDevicePin: string;
  cuSerialNumber: string;
  originLocation: LocationId;
  fulfilledByLocation: LocationId;
  customerName?: string;
  customerKraPin?: string;
  items: {
    batchId: string;
    productName: string;
    category: CategoryType;
    unit: UnitType;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    scaleGrossWeight?: number;
    tareDeduction?: number;
    netBillableWeight?: number;
    tareDescription?: string;
  }[];
  subtotal: number;
  vatAmount: number; // 16% VAT
  grandTotal: number;
  paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque';
  paymentReference?: string;
  status: OrderStatus;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  isRerouted: boolean;
  isQuotation?: boolean;
}

export type TransferType = 'restock_free' | 'order_fulfillment_reroute';

export type TransferStatus = 'pending_approval' | 'dispatched' | 'fulfilled' | 'rejected';

export interface InterStoreTransfer {
  id: string; // e.g. TRF-1029
  transferType: TransferType;
  fromLocation: LocationId;
  toLocation: LocationId;
  requestedByOperator: string;
  fulfilledByOperator?: string;
  items: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: UnitType;
    unitCost: number; // For stock value tracking
  }[];
  notes?: string;
  status: TransferStatus;
  requestedAt: string;
  dispatchedAt?: string;
  fulfilledAt?: string;
  customerOrderRef?: string; // If this transfer was spawned by Store 1/2 reroute
}

// Delivery Intake & Barcode Scanning Data Structures
export type DeliveryStatus = 'pending' | 'receiving' | 'completed' | 'cancelled';

export interface DeliveryItem {
  id: string;
  barcode: string; // SKU or barcode string
  batchId?: string; // matched ProductBatch id
  productName: string;
  category: CategoryType;
  unit: UnitType;
  costPrice: number; // preset/entered unit cost price
  unitPriceRetail: number; // preset/entered unit retail price
  expectedQty?: number;
  scannedQty: number;
  scannedBarcodes?: string[];
}

export interface DeliveryRecord {
  id: string; // e.g. "DEL-2026-001"
  supplierName: string;
  consignmentNo: string;
  destinationLocation: LocationId;
  status: DeliveryStatus;
  items: DeliveryItem[];
  notes?: string;
  totalExpectedQty: number;
  totalScannedQty: number;
  totalCostValuation: number; // dynamic asset valuation at cost
  totalRetailValuation: number; // dynamic asset valuation at retail
  receivedByOperator?: string;
  createdAt: string;
  completedAt?: string;
}

export type LedgerCategory = 
  | 'Sales' 
  | 'Inter-Store Transfer' 
  | 'Tax VAT' 
  | 'Inventory Revaluation' 
  | 'Expense'
  | 'General Journal Voucher'
  | 'Asset Purchase'
  | 'Expense Payment'
  | 'Inter-Store Cash Transfer'
  | 'Tax Settlement'
  | 'Owner Distribution'
  | 'Tare Variance Adjustment'
  | 'Inventory Variance'
  | 'Adjustment';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  transactionRef: string;
  description: string;
  debitAccount: string; // e.g. "Main Store Inventory", "Sales Shop Inventory", "Sales Revenue", "VAT Output Tax"
  creditAccount: string;
  amount: number;
  locationId: LocationId;
  category: LedgerCategory;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorRole: UserRole;
  locationId: LocationId;
  action: string; // e.g., "POS Sale Executed", "Restock Request Dispatched"
  details: string;
  ipAddress?: string;
}

export interface StaffMember {
  id: string;
  employeeNo: string;
  name: string;
  role: UserRole;
  locationId: LocationId;
  idNumber: string;
  kraPin: string;
  nssfNo: string;
  nhifNo: string;
  basicSalary: number;
  allowances: number;
  joinedDate: string;
}

export interface PayrollRecord {
  id: string;
  monthYear: string; // e.g. "August 2026"
  staffId: string;
  staffName: string;
  employeeNo: string;
  role: UserRole;
  locationId: LocationId;
  basicSalary: number;
  allowances: number;
  grossPay: number;
  payeTax: number; // KRA PAYE calculation
  nssfDeduction: number;
  nhifDeduction: number;
  housingLevy: number; // 1.5% Housing levy
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'Paid' | 'Pending';
  generatedAt: string;
}

export interface ETRConfig {
  taxPin: string; // e.g., "P051982341Z"
  cuSerialNumber: string; // e.g., "KRA-CU-8812930"
  vatRate: number; // 0.16 (16%)
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  receiptFooterMessage: string;
}

export interface ETIMSCreditNote {
  id: string; // e.g. "CRN-2026-001"
  originalInvoiceNo: string; // e.g. "INV-2026-8891"
  originalCuSerial: string;
  customerName: string;
  customerKraPin?: string;
  creditReason: 'Damaged Fabric Return' | 'Price Adjustment' | 'Order Cancellation' | 'Quantity Discrepancy';
  originalAmount: number;
  creditAmount: number; // gross credit
  vatCredited: number; // 16% VAT credited
  netCredited: number; // taxable net credited
  issuedBy: string;
  timestamp: string;
  fiscalSignature: string;
}

export interface KRAInputVATClaim {
  id: string;
  supplierName: string;
  supplierPin: string;
  supplierCuInvoiceNo: string;
  purchaseCategory: 'Raw Material (Yarn/Fleece/Dereck)' | 'Plant Machinery & Looms' | 'Factory Utilities' | 'Transport & Logistics';
  purchaseDate: string;
  taxableAmount: number;
  vatClaimable: number; // 16% Input VAT
  grossAmount: number;
  etimsVerified: boolean;
  status: 'Claimed' | 'Pending Verification';
}

export interface KRAWithholdingTaxRecord {
  id: string;
  entityName: string;
  entityPin: string;
  natureOfTransaction: 'Professional & Legal Fees (5%)' | 'Contractual / Transport Services (3%)' | 'Commercial Warehouse Rent (10%)' | 'Withholding VAT - WHVAT (2%)';
  rate: number;
  grossAmount: number;
  whtAmount: number;
  certificateNo: string;
  direction: 'Withheld_By_Us_Payable' | 'Withheld_By_Customer_Receivable';
  period: string;
  settled: boolean;
}

export interface HeldCart {
  id: string;
  note: string;
  customerName?: string;
  items: POSCartItem[];
  heldAt: string;
  totalAmount: number;
  locationId: LocationId;
  operatorName: string;
  transferId?: string;
  isTransferredSale?: boolean;
}

export interface BrandSettings {
  brandName: string;
  tagline: string;
  primaryColor: string; // e.g. '#ec4899' or hex
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  headerBgColor: string; // e.g. '#ec4899' or 'pink'
}

export interface MailNotification {
  id: string;
  title: string;
  message: string;
  transferId: string;
  transferType: TransferType;
  fromLocation: LocationId;
  toLocation: LocationId;
  timestamp: string;
  read: boolean;
  itemCount: number;
}

export type AppMode = 'admin' | 'pos';

export interface CFOAdvisorData {
  executiveSummary: string;
  financialHealthScore: number;
  taxOptimizationPlan: string[];
  workingCapitalActions: string[];
  costRationalization: string[];
  cashFlowProjection30Days: string;
  statutoryDeadlinesAdvice: string;
}

export interface ForensicAuditFinding {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  area: string;
  finding: string;
  remedy: string;
}

export interface ForensicAuditChecklist {
  control: string;
  status: 'VERIFIED' | 'ATTENTION' | 'FLAGGED';
  note: string;
}

export interface ForensicAuditReport {
  forensicScore: number;
  auditOpinion: string;
  anomalyFindings: ForensicAuditFinding[];
  controlsChecklist: ForensicAuditChecklist[];
  overallVerdict: string;
}

export interface BalanceSheetData {
  currentAssets: {
    cashAndEquivalents: number;
    accountsReceivable: number;
    inventoryAssetValue: number;
    totalCurrentAssets: number;
  };
  fixedAssets: {
    machineryAndFixtures: number;
    equipmentAndDepots: number;
    accumulatedDepreciation: number;
    totalFixedAssets: number;
  };
  totalAssets: number;
  currentLiabilities: {
    vatLiabilityPayable: number;
    payrollTaxPayable: number; // PAYE, NSSF, SHIF, Housing
    supplierAccountsPayable: number;
    totalCurrentLiabilities: number;
  };
  longTermLiabilities: {
    termLoans: number;
    totalLongTermLiabilities: number;
  };
  equity: {
    ownersCapital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface IncomeStatementData {
  grossSalesRevenue: number;
  salesDiscountsAndReturns: number;
  netSalesRevenue: number;
  costOfGoodsSold: number;
  grossOperatingProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    rentAndLeases: number;
    utilitiesAndPower: number;
    salariesAndWages: number;
    transportAndLogistics: number;
    repairsAndSupplies: number;
    statutoryTaxesAndLevies: number;
    marketingAndOther: number;
    totalOperatingExpenses: number;
  };
  ebitda: number; // Net Operating Profit before Tax
  corporateTaxProvision: number; // 30% CIT provision
  netIncomeAfterTax: number;
  netMarginPercent: number;
}

export interface CashFlowStatementData {
  operatingCashFlow: {
    cashFromCustomers: number;
    cashPaidToSuppliers: number;
    cashPaidForExpenses: number;
    netOperatingCashFlow: number;
  };
  investingCashFlow: {
    equipmentPurchase: number;
    netInvestingCashFlow: number;
  };
  financingCashFlow: {
    capitalInjections: number;
    ownersDrawings: number;
    netFinancingCashFlow: number;
  };
  netChangeInCash: number;
  closingCashPosition: number;
}

