export type LocationId = string;

export type LocationType = 
  | 'Main Store' 
  | 'Sales Shop' 
  | 'Central Warehouse'
  | 'Retail Sales Shop'
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
  email?: string;
  operatingHours?: string;
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
  | 'Rent & Premises'
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
  vendorName?: string;
  receiptNo?: string;
  receiptRef?: string;
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
  pricePerKgRate?: number; // e.g. 75, 750, or 850 (KSh per 1 KG)
  coneTareWeightKg?: number; // e.g. 0.070 kg (70g plastic / paper spool tare)
  baleTareWeightKg?: number; // e.g. 0.840 kg (outer bag tare)
  autoDeductTareAtPOS?: boolean; // Enable auto-deduction on scale input
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
  sku?: string;
  matchType?: 'barcode' | 'sku' | 'name';
  existingProduct: ProductBatch | null;
  scannedAt: string;
  scannedCategory?: CategoryType;
  targetLocation?: LocationId;
  incomingQuantity?: number;
  message: string;
}

export interface ProductDuplicateGroup {
  key: string;
  matchType: 'barcode' | 'sku' | 'name';
  masterProduct: ProductBatch;
  duplicates: ProductBatch[];
  totalDuplicateCount: number;
  totalStockDistortion: number;
  financialValuationDistortionCost: number;
  financialValuationDistortionRetail: number;
}

export interface CatalogDuplicateAuditReport {
  totalProductsScanned: number;
  duplicateGroupsCount: number;
  totalDuplicateRecords: number;
  totalStockDistortionUnits: number;
  totalFinancialDistortionCost: number;
  totalFinancialDistortionRetail: number;
  duplicateGroups: ProductDuplicateGroup[];
  isAuditClean: boolean;
  auditGeneratedAt: string;
}

// Financial Statements Generation Types (Full, Mobile Money, Bank, PDQ)
export interface MobileMoneyStatementEntry {
  id: string;
  transactionId: string;
  timestamp: string;
  receiptNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  channel: 'Till Number (Buy Goods)' | 'Paybill Account' | 'Pochi la Biashara' | 'Direct Send Money';
  tillOrPaybillNo: string;
  grossAmount: number;
  transactionFee: number;
  netSettlement: number;
  locationId: LocationId;
  status: 'Settled' | 'Pending Verification' | 'Reconciled';
  notes?: string;
}

export interface MobileMoneyStatementSummary {
  totalGrossInflow: number;
  totalTransactionFees: number;
  totalNetSettled: number;
  transactionCount: number;
  reconciledCount: number;
  unreconciledCount: number;
  primaryTillNumber: string;
  paybillNumber?: string;
  accountReference?: string;
  settlementAccount: string;
}

export interface BankStatementEntry {
  id: string;
  transactionRef: string;
  valueDate: string;
  documentRef: string;
  customerName: string;
  bankName: string;
  accountNumber: string;
  paymentType: 'Direct Bank Transfer' | 'RTGS Wire' | 'Pesalink Instant' | 'Cheque Deposit';
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  locationId: LocationId;
  reconciliationStatus: 'Matched & Cleared' | 'Pending Bank Clearance' | 'Uncleared Cheque';
  notes?: string;
}

export interface BankStatementSummary {
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  closingBalance: number;
  clearedTransactionsCount: number;
  unclearedCount: number;
  bankName: string;
  accountNumber: string;
  accountCurrency?: string;
}

export interface PDQStatementEntry {
  id: string;
  terminalId: string;
  batchNumber: string;
  authCode: string;
  receiptNumber: string;
  orderId: string;
  cardType: 'Visa Credit' | 'Visa Debit' | 'Mastercard' | 'Contactless Tap';
  cardLast4: string;
  cardHolderName: string;
  timestamp: string;
  grossAmount: number;
  merchantDiscountFee: number;
  netSettlement: number;
  settlementBatchStatus: 'Settled to Bank' | 'Pending End-of-Day Batch Close';
  locationId: LocationId;
}

export interface PDQStatementSummary {
  merchantId?: string;
  terminalIds: string[];
  settlementBank?: string;
  totalGrossVolume: number;
  totalMerchantFees: number;
  totalNetSettlement: number;
  totalSwipesCount: number;
  visaVolume: number;
  mastercardVolume: number;
  settledBatchesCount: number;
}

export interface FullConsolidatedFinancialStatement {
  reportingPeriod: string;
  generatedAt: string;
  locationScope: string;
  companyInfo: ETRConfig;
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  cashFlow?: CashFlowStatementData;
  cashFlowStatement?: CashFlowStatementData;
  mobileMoneySummary: MobileMoneyStatementSummary;
  bankSummary: BankStatementSummary;
  pdqSummary: PDQStatementSummary;
  totalGrossInflows?: number;
  totalChannelFeesDeducted?: number;
  netSettledRevenue?: number;
  totalOperatingDisbursements?: number;
  closingCashAndBankEquivalents?: number;
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
  fiberComposition: string; // e.g., "100% Cotton", "100% ACRYLIC (HB) DYED YARN"
  colorName: string; // e.g., "Crimson Red", "Mix Grey"
  colorHex: string; // e.g., "#E91E63"
  unit: UnitType;
  unitPriceRetail: number; // KSh or $ retail price per unit
  unitPriceBulk: number; // Bulk price per unit (for Main Store bulk sales / full bag rate)
  costPrice: number; // Internal cost per unit (for inventory valuation)
  locationStock: Record<LocationId, number>; // Stock per store location
  reservedStock?: Record<LocationId, number>; // Stock reserved for advance / forward-dated orders
  minReorderLevel: number; // Low stock threshold for automatic alert / request
  imageUrl?: string; // High-resolution product image URL
  qrCodeData: string; // Embedded QR payload string
  tareProfile?: TareProfile; // Dual-weight Tare Configuration

  // Manufacturer & Bale Label Metadata
  manufacturer?: string; // e.g. "UDEY UDYOG UNIT OF OSTER INDIA PVT LTD"
  countryOfOrigin?: string; // e.g. "INDIA"
  yarnCount?: string; // e.g. "2/24 NM"
  linearDensityTex?: string; // e.g. "83"
  dyeLot?: string; // e.g. "26E081"
  shadeCode?: string; // e.g. "MIX GREY-4251"
  bagNumber?: string; // e.g. "148"
  packagesCount?: number; // e.g. 12 cones / packages
  weightPerPackageKg?: number; // e.g. 2.000 kg per cone
  grossWeightKg?: number; // e.g. 24.840 kg
  netWeightKg?: number; // e.g. 24.000 kg
  tareWeightKg?: number; // e.g. 0.840 kg
  yarnType?: string; // e.g. "MACHINE KNITTING"

  createdAt: string;
}

export type UserRole = 
  | 'admin'
  | 'hr_manager'
  | 'main_store_operator'
  | 'sales_shop_cashier'
  | 'store_1_attendant'
  | 'store_2_attendant'
  | 'branch_manager'
  | 'branch_cashier'
  | 'pos_cashier'
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
  // Textile & Yarn Bale Specifics
  dyeLot?: string;
  shadeCode?: string;
  yarnCount?: string;
  bagNumber?: string;
  isFullBag?: boolean;
  conesCount?: number;
}

export type OrderStatus = 
  | 'completed' 
  | 'routed_to_main' 
  | 'routed_to_shop' 
  | 'cancelled' 
  | 'pending' 
  | 'draft' 
  | 'dispatched' 
  | 'delivered'
  | 'reserved';

export type DocumentType = 
  | 'invoice' 
  | 'quotation' 
  | 'proforma' 
  | 'receipt' 
  | 'delivery_note' 
  | 'credit_note'
  | 'advance_booking';

export interface SaleOrder {
  id: string; // e.g. INV-2026-8891, QUO-2026-1029, DEL-2026-4401, RCP-2026-9021, PRO-2026-3301, CRN-2026-1102
  receiptNumber: string;
  documentType?: DocumentType;
  etrDevicePin: string;
  cuSerialNumber: string;
  originLocation: LocationId;
  fulfilledByLocation: LocationId;
  customerName?: string;
  customerKraPin?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
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
    dyeLot?: string;
    shadeCode?: string;
    yarnCount?: string;
    bagNumber?: string;
  }[];
  subtotal: number;
  vatAmount: number; // 16% VAT
  grandTotal: number;
  discountAmount?: number;
  paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Credit/On Account';
  paymentReference?: string;
  status: OrderStatus;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  dueDate?: string;
  validityDays?: number;
  isRerouted: boolean;
  isQuotation?: boolean;
  // Forward-Dated Reservation / Advance Order Fields
  isForwardDated?: boolean;
  forwardFulfillmentDate?: string;
  advanceDepositPaid?: number;
  balanceDue?: number;
  depositPaymentMethod?: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Credit/On Account';
  depositPaymentReference?: string;
  reservationStatus?: 'reserved_active' | 'fulfilled' | 'cancelled';
  fulfilledAt?: string;
  fulfillmentNotes?: string;
  isStockReserved?: boolean;
  scheduledReleaseDate?: string;
  // Delivery Note & Logistics fields
  deliveryAddress?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleRegistration?: string;
  dispatchDate?: string;
  packageCount?: number;
  deliveryNotes?: string;
  receivedByName?: string;
  receivedByPhone?: string;
  receivedDate?: string;
  // Credit Note fields
  originalInvoiceNumber?: string;
  creditReason?: string;
  // Tax withholding & Notes
  wht5Applied?: boolean;
  whtRate?: number; // 0.05 for 5% WHT
  whtAmount?: number; // KSh deducted
  whtCertificateNo?: string;
  netReceivableAmount?: number;
  notes?: string;
  termsAndConditions?: string;
}

export type TransferType = 'restock_free' | 'order_fulfillment_reroute';

export type TransferStatus = 'pending_approval' | 'dispatched' | 'fulfilled' | 'rejected';

export interface InterStoreTransfer {
  id: string; // e.g. TRF-1029
  trackingNumber?: string;
  transferType: TransferType;
  fromLocation: LocationId;
  toLocation: LocationId;
  originLocationId?: LocationId;
  destinationLocationId?: LocationId;
  requestedByOperator: string;
  requestedBy?: string;
  fulfilledByOperator?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  driverName?: string;
  vehicleRegistration?: string;
  driverPhone?: string;
  tareDeductionApplied?: boolean;
  tareWeightAllowance?: number;
  sealNumber?: string;
  items: {
    batchId: string;
    productName: string;
    category?: CategoryType;
    quantity: number;
    unit: UnitType;
    unitCost: number; // For stock value tracking
    tareWeightDeduction?: number;
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
  | 'Withholding Tax 5%'
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
  email?: string;
  phone?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  mpesaNumber?: string;
  status?: 'active' | 'suspended' | 'on_leave';
  onboardedBy?: string;
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
  tillNumber?: string;
  paybillNumber?: string;
  mpesaTill?: string;
  bankAccount?: string;
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

export type WHTTransactionNature = 
  | 'Professional, Legal & Audit Fees (5%)' 
  | 'Management & Consultancy Fees (5%)' 
  | 'Training, Agency & Commissions (5%)' 
  | 'Contractual & Technical Services (5%)' 
  | 'B2B Customer Invoiced Sales (5% Credit)' 
  | 'Contractual / Transport Services (3%)' 
  | 'Commercial Warehouse Rent (10%)' 
  | 'Withholding VAT - WHVAT (2%)'
  | string;

export interface KRAWithholdingTaxRecord {
  id: string;
  entityName: string;
  entityPin: string;
  natureOfTransaction: WHTTransactionNature;
  rate: number;
  grossAmount: number;
  whtAmount: number;
  netPayable?: number;
  certificateNo: string;
  direction: 'Withheld_By_Us_Payable' | 'Withheld_By_Customer_Receivable';
  period: string;
  settled: boolean;
  prnNumber?: string;
  issueDate?: string;
  notes?: string;
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
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
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

export interface CashierShiftRecord {
  id: string; // e.g. "SHIFT-2026-0824-001"
  shiftNumber: string;
  locationId: LocationId;
  locationName: string;
  operatorId: string;
  operatorName: string;
  operatorRole?: UserRole;
  startTime: string;
  endTime: string;
  status: 'active' | 'closed';
  
  // Starting float
  openingFloat: number;
  
  // Sales generated during this shift
  totalSalesOrdersCount: number;
  totalUnitsSold: number;
  grossSalesRevenue: number;
  vatLiability: number;
  netSalesRevenue: number;
  
  // Expected breakdown by channel
  expectedCash: number;
  expectedMpesa: number;
  expectedBank: number;
  expectedCard?: number;
  
  // Expenses / Cash Outflows during shift
  cashExpensesPaid: number;
  
  // Actual recorded by cashier at closing
  actualCashAtHand: number;
  actualMpesa: number;
  actualBank: number;
  actualCard?: number;
  
  // Variances (Actual - Expected)
  cashVariance: number; // positive = surplus, negative = shortage
  mpesaVariance: number;
  bankVariance: number;
  totalVariance: number;
  
  // Cash denomination count (notes & coins)
  cashDenominations?: {
    notes1000?: number;
    notes500?: number;
    notes200?: number;
    notes100?: number;
    notes50?: number;
    coins?: number;
  };
  
  // Handover details
  handedOverTo?: string;
  closingNotes?: string;
  closedBySupervisor?: string;
  closedAt: string;
  zReportNumber: string;
}

export type PeriodicStatementPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface PeriodicStatementSummary {
  periodType: PeriodicStatementPeriod;
  startDate: string;
  endDate: string;
  title: string;
  locationId?: LocationId | 'All';
  locationName: string;
  
  // Highlights
  totalOrders: number;
  totalUnitsSold: number;
  grossSalesRevenue: number;
  vat16Amount: number;
  netSalesRevenue: number;
  cogsAmount: number;
  grossProfit: number;
  grossMarginPercent: number;
  
  // Channel breakdown (Cash at hand vs Bank vs Mpesa)
  cashSalesTotal: number;
  cashSalesCount: number;
  mpesaSalesTotal: number;
  mpesaSalesCount: number;
  bankSalesTotal: number;
  bankSalesCount: number;
  cardSalesTotal: number;
  cardSalesCount: number;
  
  // Shifts & Cash Handover highlights
  totalOpeningFloats: number;
  totalCashExpenses: number;
  expectedCashInDrawer: number;
  actualCountedCash: number;
  totalCashVariance: number;
  
  // Itemized product lines
  categoryBreakdown: {
    category: CategoryType;
    unitsSold: number;
    revenue: number;
    sharePercent: number;
  }[];
  
  // List of matching orders
  orders: SaleOrder[];
  
  // Shift closures during this period
  shiftClosures: CashierShiftRecord[];
  
  generatedAt: string;
}

export interface TodaySalesSummary {
  date: string;
  totalOrders: number;
  totalUnitsSold: number;
  grossRevenue: number;
  vatLiability: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  
  // Channel Breakdown
  cashAtHand: number;
  cashOrdersCount: number;
  mpesaTotal: number;
  mpesaOrdersCount: number;
  bankTotal: number;
  bankOrdersCount: number;
  cardTotal: number;
  cardOrdersCount: number;
  
  // Drawer & Float
  currentCashDrawerBalance: number;
  todayCashExpenses: number;
  
  // Item categories
  categoryBreakdown: {
    category: CategoryType;
    unitsSold: number;
    revenue: number;
    margin: number;
  }[];
  
  orders: SaleOrder[];
}

// Return, Defective Cones Quarantine & Supplier Claim Types
export type DefectReasonType =
  | 'Oil Stained / Dirty Filament'
  | 'Broken / Snagged Yarn Ply'
  | 'Uneven Yarn Count / Thin Spots'
  | 'Dye Lot / Shade Variation'
  | 'Knotty / Weak Tensile'
  | 'Moisture / Mould Contamination'
  | 'Defective Cone Spool / Crushed Core'
  | 'Fabric Hole / Run / Tear'
  | 'Weft / Warp Slub & Weaving Flaw'
  | 'Oil / Machine Grease Stain on Fabric'
  | 'Color Shading / Dye Streaks across Width'
  | 'Selvage Edge Damage / Curling'
  | 'Uneven Width / Short Meterage on Roll'
  | 'Pilling / Uneven Fleece Pile'
  | 'Wrong Item / Customer Mistake'
  | 'Other Flaw / Defect';

export type ReturnResolutionType =
  | 'exchange_replacement' // 1-to-1 replacement cones or meters from active stock
  | 'store_credit'         // Digital credit voucher for next order
  | 'bank_refund'          // Bank account payout reversal
  | 'mpesa_refund'         // M-Pesa reversal payout
  | 'cash_refund';         // Cash drawer payout

export type QuarantineStatusType =
  | 'quarantined'          // Isolated in quarantine shelf / warehouse
  | 'supplier_claim_filed' // Claim submitted to manufacturer (e.g. Oster India / Fabric Mill)
  | 'supplier_compensated' // Supplier issued credit or replacement bale/roll
  | 'written_off_scrap';   // Written off to scrap expense

export interface FabricRollRecord {
  id: string; // e.g. ROL-FLC-2026-001
  rollNumber: string; // e.g. "Roll #14", "Bale 148 / R-02"
  barcode: string; // e.g. "26001849102"
  batchId: string;
  productName: string;
  category: CategoryType;
  colorName: string;
  colorHex?: string;
  locationId: LocationId;
  initialLengthMeters: number; // e.g. 52.4m
  currentLengthMeters: number; // e.g. 34.0m
  widthCm?: number; // e.g. 160cm (63")
  gsm?: number; // e.g. 280 GSM
  status: 'sealed_full' | 'cutting_in_progress' | 'remnant' | 'depleted' | 'quarantined_defect';
  isRemnant: boolean; // True if length < 3.0m
  remnantDiscountPct?: number; // e.g. 25% clearance on remnant
  spoiltMetersLogged: number; // Cutaway defect meters
  notes?: string;
  receivedAt: string;
  supplierName?: string;
}

export interface QuarantinedDefectRecord {
  id: string; // e.g. RMA-2026-0042
  rmaNumber: string;
  orderId?: string;
  receiptNumber?: string;
  originalInvoiceNo?: string;
  customerName: string;
  customerPhone?: string;
  returnedAt: string;
  locationId: LocationId;
  operatorId: string;
  operatorName: string;
  
  // Defect Categorization
  defectReason: DefectReasonType;
  defectNotes?: string;
  resolutionType: ReturnResolutionType;

  // Defective Item Details
  returnedItem: {
    batchId: string;
    productName: string;
    sku: string;
    category: CategoryType;
    unit: UnitType; // 'kg' | 'meter' | 'roll'
    colorName?: string;
    colorHex?: string;
    dyeLot?: string;
    shadeCode?: string;
    yarnCount?: string;
    conesCount?: number; // for Yarns e.g. 2 cones
    grossWeightKg?: number; // for Yarns e.g. 4.140 kg on scale
    tareDeductionKg?: number; // for Yarns e.g. 0.140 kg
    netWeightKg?: number; // for Yarns e.g. 4.000 kg net
    metersCount?: number; // for Fleece/Dereec e.g. 3.50 meters
    rollNumber?: string; // for Fleece/Dereec e.g. "Roll #07"
    unitPrice: number; // KSh per kg or KSh per meter
    costPrice: number; // Internal cost valuation
    totalValuationRetail: number; // e.g. 3,000 KSh
    totalValuationCost: number; // e.g. 1,800 KSh
  };

  // Replacement Cones / Meters Given (if resolution is exchange)
  replacementItem?: {
    batchId: string;
    productName: string;
    sku: string;
    unit: UnitType;
    colorName?: string;
    dyeLot?: string;
    shadeCode?: string;
    conesCount?: number;
    netWeightKg?: number;
    metersCount?: number;
    rollNumber?: string;
    unitPrice: number;
    totalValuationRetail: number;
  };

  // Financial & Ledger Resolution
  financialDetails: {
    originalPaymentMethod?: string;
    priceDifferencePaidByCustomer?: number; // In case replacement had higher meterage/weight
    priceDifferenceRefundedToCustomer?: number; // In case replacement had lower meterage/weight
    refundAmount?: number;
    vatReversalAmount?: number;
    netRevenueReversalAmount?: number;
    creditNoteNumber?: string;
    bankTransferReference?: string;
    mpesaReference?: string;
  };

  // Supplier Claim & Recovery
  quarantineStatus: QuarantineStatusType;
  supplierName?: string; // e.g. "UDEY UDYOG / OSTER INDIA PVT LTD / TEXTILE MILL"
  supplierClaimNumber?: string;
  supplierClaimFiledAt?: string;
  supplierResolutionDate?: string;
  supplierResolutionNotes?: string;
  isWrittenOff?: boolean;
}

export interface ReturnExchangePayload {
  orderId?: string;
  receiptNumber?: string;
  customerName: string;
  customerPhone?: string;
  locationId: LocationId;
  operatorId: string;
  operatorName: string;
  defectReason: DefectReasonType;
  defectNotes?: string;
  resolutionType: ReturnResolutionType;

  // Returned item
  returnedBatchId: string;
  returnedUnit?: UnitType; // 'kg' | 'meter' | 'roll'
  returnedConesCount?: number;
  returnedGrossWeightKg?: number;
  returnedTareKg?: number;
  returnedNetWeightKg?: number;
  returnedMeters?: number; // for Fleece / Dereec
  returnedRollNumber?: string;
  returnedRatePerKg?: number;
  returnedRatePerMeter?: number;

  // Replacement item (for exchange)
  replacementBatchId?: string;
  replacementConesCount?: number;
  replacementNetWeightKg?: number;
  replacementMeters?: number; // for Fleece / Dereec
  replacementRollNumber?: string;
  replacementRatePerKg?: number;
  replacementRatePerMeter?: number;

  // Financial payout specifics
  refundChannel?: 'Bank Account' | 'M-Pesa B2C' | 'Cash Drawer' | 'Store Credit Note';
  refundReference?: string;
  supplierName?: string;
}

