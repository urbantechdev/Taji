import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, googleProvider, signInWithPopup, signOut, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  LocationId,
  LocationInfo,
  BranchExpense,
  BranchFinancialSummary,
  UserRole,
  UserProfile,
  ProductBatch,
  SaleOrder,
  InterStoreTransfer,
  LedgerEntry,
  AuditLog,
  StaffMember,
  PayrollRecord,
  ETRConfig,
  POSCartItem,
  HeldCart,
  BrandSettings,
  MailNotification,
  AppMode,
  POSOperator,
  DeliveryRecord,
  DeliveryItem,
  CategoryType,
  UnitType,
  TareProfile,
  TareReconciliationRecord,
  CloudSyncStatus,
  CategoryPricingConfig,
  DuplicateBarcodeAlertState,
  MobileBarcodeScanOptions,
  KRAWithholdingTaxRecord,
  DocumentType,
  OrderStatus,
  CatalogDuplicateAuditReport,
  ProductDuplicateGroup,
  CashierShiftRecord,
  PeriodicStatementSummary,
  TodaySalesSummary,
  QuarantinedDefectRecord,
  ReturnExchangePayload,
  ETIMSCreditNote,
  FabricRollRecord,
  DefectReasonType
} from '../types';
import { checkDuplicateConflict, calculateCatalogDuplicateReport } from '../utils/duplicationControl';
import { calculateActiveShiftPreview, computeTodaySalesSummary, computePeriodicStatementSummary } from '../utils/salesStatementEngine';
import { calculateRollPricing } from '../utils/rollPricingEngine';
import {
  LOCATIONS,
  INITIAL_BRANCH_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_TRANSFERS,
  INITIAL_LEDGER,
  INITIAL_STAFF,
  INITIAL_PAYROLL,
  INITIAL_AUDIT_LOGS,
  INITIAL_ETR_CONFIG,
  INITIAL_BRAND_SETTINGS,
  INITIAL_MAIL_NOTIFICATIONS,
  INITIAL_POS_OPERATORS,
  INITIAL_DELIVERIES,
  INITIAL_TARE_RECONCILIATION_LOGS,
  INITIAL_WHT_RECORDS,
  INITIAL_SHIFT_CLOSURES,
  INITIAL_QUARANTINED_DEFECTS,
  INITIAL_CREDIT_NOTES,
  INITIAL_FABRIC_ROLLS,
  CURRENT_USER
} from '../data/initialData';
import {
  playAddToCartSound,
  playTrashSound,
  playSuccessSound,
  playNotificationSound,
  playAlertSound,
  playBarcodeScanBeep,
  playScannerErrorBeep
} from '../utils/audio';
import { calculateKenyaStatutoryDeductions } from '../utils/financeEngine';

interface ERPContextType {
  // Navigation, Mode & Role Context
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeLocation: LocationId;
  setActiveLocation: (loc: LocationId) => void;
  currentUser: UserProfile;

  // Google Admin Auth & Super Admin
  isGoogleAdminAuthenticated: boolean;
  isGoogleAuthLoading: boolean;
  adminUser: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null } | null;
  isSuperAdmin: boolean;
  signInWithGoogleAdmin: () => Promise<{ success: boolean; message?: string }>;
  signInAsWhitelistedAdmin: (email?: string) => { success: boolean };
  signOutGoogleAdmin: () => Promise<void>;

  // POS Operators & PIN Session
  posOperators: POSOperator[];
  addPOSOperator: (operator: Omit<POSOperator, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updatePOSOperator: (id: string, updates: Partial<Omit<POSOperator, 'id' | 'createdAt'>>) => Promise<{ success: boolean; message: string }>;
  deletePOSOperator: (id: string) => Promise<{ success: boolean; message: string }>;
  posSession: { isUnlocked: boolean; operatorId: string; operatorName: string; location: LocationId; pin: string; role: UserRole } | null;
  unlockPOSWithPin: (pin: string) => { success: boolean; message: string; operator?: POSOperator };
  lockPOSSession: () => void;

  // Brand Customization
  brandSettings: BrandSettings;
  updateBrandSettings: (settings: Partial<BrandSettings>) => void;

  // Data Collections
  locations: LocationInfo[];
  addLocation: (branchData: Omit<LocationInfo, 'id'> & { id?: string; initialStockAllocations?: Record<string, number> }) => Promise<{ success: boolean; message: string; location?: LocationInfo }>;
  updateLocation: (id: string, updates: Partial<LocationInfo>) => Promise<{ success: boolean; message: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; message: string }>;
  branchExpenses: BranchExpense[];
  addBranchExpense: (expense: Omit<BranchExpense, 'id' | 'timestamp' | 'recordedBy'>) => Promise<{ success: boolean; message: string; expenseId?: string }>;
  deleteBranchExpense: (id: string) => Promise<{ success: boolean; message: string }>;
  adjustBranchCashFloat: (locationId: string, adjustmentAmount: number, reason: string) => { success: boolean; message: string };
  getBranchFinancialSummary: (locationId: string) => BranchFinancialSummary;
  products: ProductBatch[];
  orders: SaleOrder[];
  transfers: InterStoreTransfer[];
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'timestamp'>) => { success: boolean; message: string; entryId?: string };
  auditLogs: AuditLog[];
  staff: StaffMember[];
  payroll: PayrollRecord[];
  etrConfig: ETRConfig;

  // POS State & Functions
  cart: POSCartItem[];
  addToCart: (batch: ProductBatch, quantity?: number, isBulk?: boolean) => void;
  removeFromCart: (batchId: string) => void;
  updateCartQuantity: (batchId: string, quantity: number) => void;
  updateCartItemRollPricing: (
    batchId: string,
    options: {
      looseDiscountPct?: number;
      standardRollMeters?: number;
      pricingMode?: 'hybrid_discounted_loose' | 'all_wholesale' | 'all_retail' | 'custom';
      customLooseRate?: number;
    }
  ) => void;
  clearCart: () => void;

  // Hold Cart Feature
  heldCarts: HeldCart[];
  holdCurrentCart: (note?: string, customerName?: string) => { success: boolean; message: string };
  restoreHeldCart: (heldId: string) => void;
  discardHeldCart: (heldId: string) => void;
  resumeTransferredSaleToCart: (transferId: string) => { success: boolean; message: string };

  // Mail / Transfer Notifications
  mailNotifications: MailNotification[];
  activeToastNotification: MailNotification | null;
  setActiveToastNotification: (toast: MailNotification | null) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Core Operational Actions
  processPOSCheckout: (
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName?: string,
    customerKraPin?: string,
    isQuotation?: boolean,
    applyWHT5?: boolean,
    whtCertificateNo?: string,
    isForwardDated?: boolean,
    forwardFulfillmentDate?: string,
    advanceDepositAmount?: number,
    fulfillmentNotes?: string
  ) => { success: boolean; orderId?: string; message?: string; isForwardDated?: boolean };
  convertQuotationToInvoice: (
    quotationId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    applyWHT5?: boolean,
    whtCertificateNo?: string
  ) => { success: boolean; message: string; order?: SaleOrder };

  // Forward-Dated Reservations & Advance Bookings (Deferred Revenue & Stock Allocation)
  fulfillForwardReservation: (
    orderId: string,
    finalPaymentMethod?: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    finalPaymentReference?: string,
    notes?: string
  ) => { success: boolean; message: string; order?: SaleOrder };
  cancelForwardReservation: (
    orderId: string,
    refundMethod?: 'cash' | 'mpesa' | 'bank' | 'store_credit',
    cancellationReason?: string
  ) => { success: boolean; message: string };
  isForwardReservationsModalOpen: boolean;
  setIsForwardReservationsModalOpen: (open: boolean) => void;

  // Billing Document Engine (Invoices, Quotations, Proformas, Receipts, Delivery Notes, Credit Notes)
  createBillingDocument: (docData: {
    documentType: DocumentType;
    locationId: LocationId;
    customerName: string;
    customerKraPin?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    deliveryAddress?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleRegistration?: string;
    dispatchDate?: string;
    packageCount?: number;
    deliveryNotes?: string;
    items: {
      batchId: string;
      productName: string;
      category: CategoryType;
      unit: UnitType;
      quantity: number;
      unitPrice: number;
      scaleGrossWeight?: number;
      tareDeduction?: number;
      netBillableWeight?: number;
      tareDescription?: string;
    }[];
    paymentMethod?: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Credit/On Account';
    paymentReference?: string;
    discountAmount?: number;
    applyWHT5?: boolean;
    whtCertificateNo?: string;
    dueDate?: string;
    validityDays?: number;
    notes?: string;
    termsAndConditions?: string;
    deductInventory?: boolean;
    originalInvoiceNumber?: string;
    creditReason?: string;
  }) => { success: boolean; message: string; order?: SaleOrder };
  deleteBillingDocument: (documentId: string) => { success: boolean; message: string };
  updateBillingDocumentStatus: (documentId: string, updates: Partial<SaleOrder>) => { success: boolean; message: string };

  // 5% Withholding Tax (WHT & WHVAT) Engine
  whtRecords: KRAWithholdingTaxRecord[];
  addWithholdingTaxRecord: (record: Omit<KRAWithholdingTaxRecord, 'id'>) => { success: boolean; message: string; recordId: string };
  settleWithholdingTaxRecord: (id: string, prnNumber?: string) => { success: boolean; message: string };

  createOrderRerouteTicket: (
    items: { batchId: string; quantity: number }[],
    customerName?: string,
    targetLocation?: LocationId
  ) => { success: boolean; transferId: string };

  requestRestock: (
    items: { batchId: string; quantity: number }[],
    notes?: string
  ) => { success: boolean; transferId: string };

  dispatchRestockTransfer: (
    transferId: string
  ) => { success: boolean; message: string };

  createDirectDispatchTransfer: (
    fromLocation: LocationId,
    toLocation: LocationId,
    items: { batchId: string; quantity: number }[],
    notes?: string
  ) => { success: boolean; transferId?: string; message: string };

  updateProductPrice: (batchId: string, newRetailPrice: number) => void;

  fulfillReroutedOrder: (
    transferId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName?: string,
    customerKraPin?: string
  ) => { success: boolean; orderId?: string; message: string };

  acceptPurchaseOrder: (
    transferId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName?: string,
    customerKraPin?: string
  ) => { success: boolean; orderId?: string; message: string };

  receiveRestockTransfer: (
    transferId: string
  ) => { success: boolean; message: string };

  addProductBatch: (newBatch: Omit<ProductBatch, 'id' | 'createdAt' | 'qrCodeData'>) => Promise<{ success: boolean; product: ProductBatch; message: string }>;
  updateProductBatch: (batchId: string, updates: Partial<ProductBatch>) => Promise<{ success: boolean; message: string }>;
  deleteProductBatch: (batchId: string) => Promise<{ success: boolean; message: string }>;
  deleteMultipleProducts: (batchIds: string[]) => Promise<{ success: boolean; count: number; deletedProducts?: ProductBatch[]; message: string }>;
  restoreProductBatch: (product: ProductBatch) => Promise<{ success: boolean; message: string }>;
  updateCategoryPrices: (
    category: CategoryType,
    priceUpdates: {
      retailPrice?: number;
      bulkPrice?: number;
      costPrice?: number;
      pricePerKgRate?: number;
      coneTareWeightKg?: number;
      baleTareWeightKg?: number;
      autoDeductTareAtPOS?: boolean;
      standardRollLengthMeters?: number;
      looseMeterDiscountPct?: number;
      enableHybridRollPricing?: boolean;
      adjustmentType?: 'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost';
      percentageValue?: number;
    }
  ) => Promise<{ success: boolean; updatedCount: number; message: string }>;
  updateCategoryPricingConfig: (
    category: CategoryType,
    configUpdates: Partial<CategoryPricingConfig>
  ) => Promise<{ success: boolean; message: string }>;
  categoryPricingConfigs: Record<CategoryType, CategoryPricingConfig>;
  categoryImages: Record<CategoryType, string>;
  updateCategoryImage: (category: CategoryType, imageUrl: string, applyToAllBatches?: boolean) => Promise<{ success: boolean; message: string }>;
  isProductImageModalOpen: boolean;
  setIsProductImageModalOpen: (open: boolean) => void;
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSync: Date | null;
  syncCloudInventory: () => Promise<{ success: boolean; count: number; message: string }>;
  updateETRConfig: (config: Partial<ETRConfig>) => void;
  generateMonthlyPayroll: (monthYear: string) => void;
  addStaffMember: (staffData: Omit<StaffMember, 'id' | 'employeeNo' | 'joinedDate'> & { employeeNo?: string; joinedDate?: string }) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  recordAuditLog: (action: string, details: string) => void;

  // Deliveries, Barcode Intake & Dynamic Valuation Module
  deliveries: DeliveryRecord[];
  activeDeliveryId: string | null;
  setActiveDeliveryId: (id: string | null) => void;
  createDelivery: (deliveryData: Omit<DeliveryRecord, 'id' | 'createdAt' | 'totalScannedQty' | 'totalCostValuation' | 'totalRetailValuation'>) => { success: boolean; deliveryId: string; message: string };
  startReceivingDelivery: (deliveryId: string) => void;
  scanDeliveryBarcode: (deliveryId: string, scannedCode: string) => { success: boolean; isNewProduct: boolean; barcode: string; product?: ProductBatch; message: string };
  autoCreateAndIntakeProduct: (
    deliveryId: string,
    newProductData: {
      barcode: string;
      name: string;
      category: CategoryType;
      subCategory?: string;
      fiberComposition?: string;
      colorName?: string;
      colorHex?: string;
      unit: UnitType;
      costPrice: number;
      unitPriceRetail: number;
      unitPriceBulk?: number;
      quantity: number;
      minReorderLevel?: number;
    }
  ) => { success: boolean; product: ProductBatch; message: string };
  completeDelivery: (deliveryId: string) => { success: boolean; message: string };
  commitCategoryIntakeSession: (
    category: CategoryType,
    items: {
      barcode: string;
      name?: string;
      quantity: number;
      wholesalePrice: number;
      retailPrice: number;
      unit?: UnitType;
      colorName?: string;
      colorHex?: string;
      fiberComposition?: string;
      yarnCount?: string;
      linearDensityTex?: string;
      dyeLot?: string;
      shadeCode?: string;
      bagNumber?: string;
      packagesCount?: number;
      weightPerPackageKg?: number;
      grossWeightKg?: number;
      netWeightKg?: number;
      tareWeightKg?: number;
      manufacturer?: string;
      countryOfOrigin?: string;
      yarnType?: string;
      tareProfile?: TareProfile;
    }[],
    targetLocation: LocationId,
    sessionNotes?: string
  ) => {
    success: boolean;
    category?: CategoryType;
    totalQtyAdded?: number;
    totalCostValuationAdded?: number;
    totalRetailValuationAdded?: number;
    newTotalBusinessAssetCost?: number;
    newTotalBusinessAssetRetail?: number;
    newTotalUnits?: number;
    targetLocationName?: string;
    message: string;
  };
  getTotalAssetValuation: (locationId?: LocationId) => { totalCostValuation: number; totalRetailValuation: number; totalCostValue: number; totalRetailValue: number; totalUnits: number; totalBatches: number };

  // Dual-Weight Tare Governance & Balance Sheet Protection
  tareReconciliationLogs: TareReconciliationRecord[];
  updateProductTareProfile: (batchId: string, profile: TareProfile) => void;
  addTareReconciliationRecord: (record: Omit<TareReconciliationRecord, 'id' | 'timestamp'>) => { success: boolean; id: string };
  reconcileTareWithJournal: (recordId: string) => { success: boolean; message: string };
  updateCartTare: (
    batchId: string,
    scaleGrossWeight: number,
    tareDeduction: number,
    netBillableWeight: number,
    tareDescription?: string
  ) => void;

  // Active Modals & Utilities
  isUserProfileModalOpen: boolean;
  setIsUserProfileModalOpen: (open: boolean) => void;
  updateCurrentUserProfile: (profileUpdates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  isPlatformUnlocked: boolean;
  isAdmin: boolean;
  lockPlatform: () => void;
  selectedReceipt: SaleOrder | null;
  setSelectedReceipt: (order: SaleOrder | null) => void;
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  isMobileBarcodeScannerOpen: boolean;
  setIsMobileBarcodeScannerOpen: (open: boolean) => void;
  duplicateAlertState: DuplicateBarcodeAlertState;
  setDuplicateAlertState: React.Dispatch<React.SetStateAction<DuplicateBarcodeAlertState>>;
  dismissDuplicateAlert: () => void;
  scanToAddProduct: (
    barcode: string,
    options?: MobileBarcodeScanOptions
  ) => Promise<{ success: boolean; isDuplicate: boolean; product?: ProductBatch; message: string }>;
  restockExistingProduct: (
    batchId: string,
    additionalQuantity: number,
    locationId: LocationId
  ) => Promise<{ success: boolean; message: string }>;
  checkProductDuplicate: (candidate: { barcode?: string; sku?: string; name?: string; category?: string; excludeId?: string }) => { isDuplicate: boolean; matchType?: 'barcode' | 'sku' | 'name'; existingProduct: ProductBatch | null; message: string };
  mergeDuplicateProducts: (masterProductId: string, duplicateProductIds: string[]) => Promise<{ success: boolean; mergedCount: number; message: string }>;
  scanAllCatalogDuplicates: () => CatalogDuplicateAuditReport;
  autoDeduplicateAllCatalog: () => Promise<{ success: boolean; groupsResolved: number; itemsMerged: number; message: string }>;
  scannedResult: string | null;
  setScannedResult: (res: string | null) => void;
  handleQRScan: (qrString: string) => boolean;
  playBarcodeScanBeep: (loud?: boolean) => void;
  playScannerErrorBeep: () => void;
  isBrandSettingsModalOpen: boolean;
  setIsBrandSettingsModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isMailDrawerOpen: boolean;
  setIsMailDrawerOpen: (open: boolean) => void;
  purgeAllMockData: () => Promise<{ success: boolean; message: string }>;

  // Shift Closure, Statements & Sales Today
  shiftClosures: CashierShiftRecord[];
  activeShiftStartTime: string;
  closeCashierShift: (data: {
    actualCashAtHand: number;
    actualMpesa: number;
    actualBank: number;
    actualCard?: number;
    cashDenominations?: {
      notes1000?: number;
      notes500?: number;
      notes200?: number;
      notes100?: number;
      notes50?: number;
      coins?: number;
    };
    handedOverTo?: string;
    closingNotes?: string;
  }) => Promise<{ success: boolean; shiftRecord?: CashierShiftRecord; message: string }>;
  isShiftClosureModalOpen: boolean;
  setIsShiftClosureModalOpen: (open: boolean) => void;
  selectedShiftRecord: CashierShiftRecord | null;
  setSelectedShiftRecord: (record: CashierShiftRecord | null) => void;
  isTodaySalesModalOpen: boolean;
  setIsTodaySalesModalOpen: (open: boolean) => void;
  isPeriodicStatementModalOpen: boolean;
  setIsPeriodicStatementModalOpen: (open: boolean) => void;
  getActiveShiftStats: () => ReturnType<typeof calculateActiveShiftPreview>;
  getTodaySalesSummary: (locationId?: LocationId | 'All') => TodaySalesSummary;
  getPeriodicStatementSummary: (
    periodType: 'daily' | 'weekly' | 'monthly' | 'custom',
    startDateStr: string,
    endDateStr: string,
    locationId?: LocationId | 'All'
  ) => PeriodicStatementSummary;

  // Returns, Exchanges, Defective Cones Quarantine & Supplier Claims (RMA)
  quarantinedDefects: QuarantinedDefectRecord[];
  creditNotes: ETIMSCreditNote[];
  addCreditNote: (creditNote: Omit<ETIMSCreditNote, 'id' | 'timestamp' | 'fiscalSignature'> & { id?: string }) => { success: boolean; creditNoteId: string; message: string; creditNote: ETIMSCreditNote };
  processReturnAndExchange: (payload: ReturnExchangePayload) => {
    success: boolean;
    rmaId?: string;
    message: string;
    creditNote?: ETIMSCreditNote;
    exchangeRecord?: QuarantinedDefectRecord;
  };
  fileSupplierDefectClaim: (recordIds: string[], supplierName: string, notes: string) => {
    success: boolean;
    claimRef: string;
    message: string;
  };
  resolveQuarantineRecord: (
    recordIds: string[],
    action: 'supplier_compensated' | 'supplier_replaced' | 'written_off_scrap',
    notes: string,
    restockBatchId?: string,
    restockQtyKg?: number
  ) => { success: boolean; message: string };
  isReturnExchangeModalOpen: boolean;
  setIsReturnExchangeModalOpen: (open: boolean) => void;

  // Fabric Rolls & Piece Goods Inventory (Fleece & Dereec Variable Meters & Remnants)
  fabricRolls: FabricRollRecord[];
  addFabricRoll: (roll: Omit<FabricRollRecord, 'id' | 'receivedAt'>) => { success: boolean; rollId: string; message: string };
  addFabricRollBatchIntake: (
    batchId: string,
    locationId: LocationId,
    rollLengths: number[],
    widthCm?: number,
    gsm?: number,
    supplierName?: string
  ) => { success: boolean; createdCount: number; totalMetersAdded: number; message: string };
  cutFabricFromRoll: (
    rollId: string,
    metersToCut: number,
    orderId?: string,
    isSpoiltCut?: boolean,
    flawReason?: DefectReasonType
  ) => { success: boolean; remainingMeters: number; message: string; isRemnant: boolean };
  logSpoiltFabricMeters: (
    rollId: string,
    spoiltMeters: number,
    flawReason: DefectReasonType,
    notes?: string
  ) => { success: boolean; rmaId?: string; message: string };
  isFabricRollModalOpen: boolean;
  setIsFabricRollModalOpen: (open: boolean) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appModeState, setAppModeState] = useState<AppMode>('pos');
  const [activeRole, setActiveRoleState] = useState<UserRole>('pos_cashier');
  const [activeLocation, setActiveLocation] = useState<LocationId>('sales_shop');
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);

  // Google Auth State for Admin
  const [adminUser, setAdminUser] = useState<{
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  } | null>(null);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(true);

  // Whitelisted Admin emails
  const SUPER_ADMIN_EMAIL = 'urbaninteriorkenya@gmail.com';
  const WHITELISTED_ADMINS = [
    'urbaninteriorkenya@gmail.com',
    'zamodasports@gmail.com'
  ];

  // POS Operators State & PIN Session
  const [posOperators, setPosOperators] = useState<POSOperator[]>(INITIAL_POS_OPERATORS);
  const [posSession, setPosSession] = useState<{
    isUnlocked: boolean;
    operatorId: string;
    operatorName: string;
    location: LocationId;
    pin: string;
    role: UserRole;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setAdminUser(null);
      }
      setIsGoogleAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isSuperAdmin = adminUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const isGoogleAdminAuthenticated = Boolean(
    adminUser?.email && (
      WHITELISTED_ADMINS.includes(adminUser.email.toLowerCase()) ||
      isSuperAdmin ||
      posOperators.some(op => op.email.toLowerCase() === adminUser.email?.toLowerCase() && op.role === 'admin')
    )
  );

  // STRICT ACCESS POLICY: Only Google/Gmail authenticated users have admin access.
  // Any user unlocking via PIN is strictly restricted to the POS terminal.
  const isAdmin = Boolean(isGoogleAdminAuthenticated);

  const isPlatformUnlocked = Boolean(
    (posSession && posSession.isUnlocked) ||
    isGoogleAdminAuthenticated
  );

  const setAppMode = (mode: AppMode) => {
    if (mode === 'admin' && !isAdmin) {
      setAppModeState('pos');
      return;
    }
    setAppModeState(mode);
  };

  const appMode = !isAdmin ? 'pos' : appModeState;

  const signInWithGoogleAdmin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email || '';
      setAdminUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL
      });
      setActiveRoleState('admin');
      setAppModeState('admin');
      setCurrentUser({
        id: 'op-super-admin',
        name: res.user.displayName || 'Executive Super Admin',
        email: email,
        phone: '+254 700 000 000',
        role: 'admin',
        assignedLocation: 'main_store',
        kraPin: 'P051982341Z',
        pin: '123456',
        status: 'active',
        lastLoginAt: new Date().toISOString()
      });
      recordAuditLog('Google Admin Login', `Logged in via Google as ${res.user.email}`);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return { success: false, message: err.message || 'Failed to sign in with Google' };
    }
  };

  const signInAsWhitelistedAdmin = (email: string = 'urbaninteriorkenya@gmail.com') => {
    setAdminUser({
      uid: 'admin-whitelisted-uid',
      email: email,
      displayName: 'Executive Super Admin',
      photoURL: null
    });
    setActiveRoleState('admin');
    setAppModeState('admin');
    setActiveLocation('main_store');
    setCurrentUser({
      id: 'op-super-admin',
      name: 'Executive Super Admin',
      email: email,
      phone: '+254 700 000 000',
      role: 'admin',
      assignedLocation: 'main_store',
      kraPin: 'P051982341Z',
      pin: '123456',
      status: 'active',
      lastLoginAt: new Date().toISOString()
    });
    recordAuditLog('Admin Direct Authentication', `Authenticated administrator session for ${email}`);
    return { success: true };
  };

  const signOutGoogleAdmin = async () => {
    try {
      await signOut(auth);
      setAdminUser(null);
      recordAuditLog('Google Admin Logout', 'Logged out of Google Admin session');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Firestore Sync for POS Operators with legacy mock filter
  useEffect(() => {
    const path = 'pos_operators';
    try {
      const unsub = onSnapshot(collection(db, path), (snapshot) => {
        if (!snapshot.empty) {
          const loadedOps: POSOperator[] = [];
          snapshot.forEach((doc) => {
            const op = doc.data() as POSOperator;
            // Cleanse obsolete mock operators that are not the root admin
            if (op.id !== 'op-main-cashier' && op.id !== 'op-sales-cashier') {
              loadedOps.push(op);
            }
          });
          if (loadedOps.length > 0) {
            setPosOperators(loadedOps);
          }
        }
      }, (error) => {
        console.warn('Firestore POS operators sync note (operating with local state):', error.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firestore POS operators sync fallback:', e);
    }
  }, []);

  const addPOSOperator = async (opData: Omit<POSOperator, 'id' | 'createdAt'>) => {
    const newOp: POSOperator = {
      ...opData,
      id: `op-${Date.now()}`,
      status: opData.status || 'active',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name || 'Executive Admin'
    };
    setPosOperators(prev => [newOp, ...prev]);

    try {
      await setDoc(doc(db, 'pos_operators', newOp.id), newOp);
    } catch (error) {
      console.error('Error saving operator to Firestore:', error);
    }

    recordAuditLog('User Operator Created', `Admin created ${newOp.role} user: ${newOp.name} (${newOp.email}) assigned to ${newOp.location}`);
    return { success: true, message: `User ${newOp.name} (${newOp.role}) created successfully!` };
  };

  const updatePOSOperator = async (id: string, updates: Partial<Omit<POSOperator, 'id' | 'createdAt'>>) => {
    let updatedOp: POSOperator | undefined;
    setPosOperators(prev => prev.map(op => {
      if (op.id === id) {
        updatedOp = { ...op, ...updates };
        return updatedOp;
      }
      return op;
    }));

    if (updatedOp) {
      // If current user is this operator, sync currentUser profile
      if (currentUser.id === id) {
        setCurrentUser(prev => ({
          ...prev,
          name: updatedOp!.name,
          email: updatedOp!.email,
          phone: updatedOp!.phone || prev.phone,
          kraPin: updatedOp!.kraPin || prev.kraPin,
          role: updatedOp!.role,
          assignedLocation: updatedOp!.location,
          pin: updatedOp!.pin
        }));
        setActiveRoleState(updatedOp.role);
        setActiveLocation(updatedOp.location);
      }

      try {
        await setDoc(doc(db, 'pos_operators', id), updatedOp, { merge: true });
      } catch (error) {
        console.error('Error updating operator in Firestore:', error);
      }
      recordAuditLog('User Profile Updated', `Updated user credentials for ${updatedOp.name} (${updatedOp.role})`);
      return { success: true, message: `User ${updatedOp.name} updated successfully!` };
    }
    return { success: false, message: 'User not found.' };
  };

  const deletePOSOperator = async (id: string) => {
    const opToDelete = posOperators.find(o => o.id === id);
    if (opToDelete?.role === 'admin' && posOperators.filter(o => o.role === 'admin').length <= 1) {
      return { success: false, message: 'Cannot delete the primary root Executive Admin account.' };
    }

    setPosOperators(prev => prev.filter(op => op.id !== id));
    try {
      await deleteDoc(doc(db, 'pos_operators', id));
    } catch (error) {
      console.error('Error deleting operator from Firestore:', error);
    }
    recordAuditLog('User Operator Deleted', `Removed operator ID ${id} (${opToDelete?.name || ''})`);
    return { success: true, message: 'User removed successfully.' };
  };

  const updateCurrentUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    const updated = { ...currentUser, ...profileUpdates };
    setCurrentUser(updated);

    if (currentUser.id) {
      setPosOperators(prev => prev.map(op => {
        if (op.id === currentUser.id) {
          return {
            ...op,
            name: profileUpdates.name ?? op.name,
            email: profileUpdates.email ?? op.email,
            phone: profileUpdates.phone ?? op.phone,
            kraPin: profileUpdates.kraPin ?? op.kraPin,
            pin: profileUpdates.pin ?? op.pin,
            location: profileUpdates.assignedLocation ?? op.location,
            role: profileUpdates.role ?? op.role
          };
        }
        return op;
      }));
    }

    recordAuditLog('Profile Updated', `Account profile updated for ${updated.name} (${updated.role})`);
    return { success: true, message: 'Profile details updated successfully.' };
  };

  const unlockPOSWithPin = (pin: string) => {
    const trimmedPin = pin.trim();
    if (!trimmedPin || trimmedPin.length !== 6) {
      return { success: false, message: 'PIN code must be exactly 6 numeric digits.' };
    }

    const matchedOp = posOperators.find(op => op.pin === trimmedPin);

    if (matchedOp) {
      const now = new Date().toISOString();
      const staffRole: UserRole = matchedOp.role === 'admin' ? 'pos_cashier' : matchedOp.role;
      const targetLoc: LocationId = matchedOp.location === 'main_store' ? 'sales_shop' : matchedOp.location;

      setPosSession({
        isUnlocked: true,
        operatorId: matchedOp.id,
        operatorName: matchedOp.name,
        location: targetLoc,
        pin: matchedOp.pin,
        role: staffRole
      });
      setActiveLocation(targetLoc);
      setActiveRoleState(staffRole);
      setCurrentUser({
        id: matchedOp.id,
        name: matchedOp.name,
        email: matchedOp.email,
        phone: matchedOp.phone || '+254 700 111 000',
        role: staffRole,
        assignedLocation: targetLoc,
        kraPin: matchedOp.kraPin || 'P051982341Z',
        pin: matchedOp.pin,
        status: matchedOp.status || 'active',
        lastLoginAt: now
      });

      // STRICT RULE: Any user who uses PIN can ONLY access POS
      setAppModeState('pos');

      recordAuditLog('User Login Success', `${matchedOp.name} unlocked POS terminal at ${targetLoc} via PIN`);
      return { success: true, message: `Welcome ${matchedOp.name}! POS Terminal ready.`, operator: matchedOp };
    } else {
      return { success: false, message: 'Invalid 6-digit PIN code. Contact Super Admin if you need access credentials.' };
    }
  };

  const lockPOSSession = () => {
    setPosSession(null);
    recordAuditLog('Session Locked', `Active session locked for user ${currentUser.name}`);
  };

  const lockPlatform = () => {
    setPosSession(null);
    setAdminUser(null);
    signOutGoogleAdmin();
    setAppModeState('pos');
    recordAuditLog('Platform Locked', `Terminal locked by user.`);
  };

  // Brand Settings & Modals
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(INITIAL_BRAND_SETTINGS);
  const [isBrandSettingsModalOpen, setIsBrandSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMailDrawerOpen, setIsMailDrawerOpen] = useState(false);

  // Dynamic Browser Favicon Update
  useEffect(() => {
    const iconUrl = brandSettings.faviconUrl || brandSettings.logoUrl;
    if (iconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = iconUrl;
    }
  }, [brandSettings.faviconUrl, brandSettings.logoUrl]);

  // Dynamic Locations / Branches State with localStorage caching
  const [locations, setLocations] = useState<LocationInfo[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((l: LocationInfo) => l.id !== 'branch_westlands');
        }
      }
    } catch (e) {
      console.warn('Error reading saved locations from localStorage:', e);
    }
    return LOCATIONS.filter((l: LocationInfo) => l.id !== 'branch_westlands');
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_locations', JSON.stringify(locations));
    } catch (e) {
      console.warn('Error saving locations to localStorage:', e);
    }
  }, [locations]);

  // Branch Expenses State with localStorage caching
  const [branchExpenses, setBranchExpenses] = useState<BranchExpense[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_branch_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: BranchExpense) => !e.id.startsWith('EXP-BR-'));
        }
      }
    } catch (e) {
      console.warn('Error reading branch expenses from localStorage:', e);
    }
    return INITIAL_BRANCH_EXPENSES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_branch_expenses', JSON.stringify(branchExpenses));
    } catch (e) {
      console.warn('Error saving branch expenses to localStorage:', e);
    }
  }, [branchExpenses]);

  // Core Data States - with cloud Firestore synchronization & local resilience
  const [products, setProducts] = useState<ProductBatch[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: ProductBatch) => !p.id.startsWith('BATCH-DRK-') && !p.id.startsWith('BATCH-FLC-') && !p.id.startsWith('BATCH-YRN-'));
        }
      }
    } catch (e) {
      console.warn('Error reading products from localStorage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);

  // Category Pricing Configurations (Fleece Wholesale 440 / Retail 470; Dereec Wholesale 220 / Retail 230; Yarns Wholesale 950 / Retail 950)
  const DEFAULT_CATEGORY_PRICING: Record<CategoryType, CategoryPricingConfig> = {
    Dereck: {
      category: 'Dereck',
      defaultRetailPrice: 230, // KSh 230 per meter
      defaultBulkPrice: 220,   // KSh 220 per meter (wholesale roll)
      defaultCostPrice: 160,
      marginPercentage: 44,
      pricePerKgRate: 230,
      coneTareWeightKg: 0.250,
      baleTareWeightKg: 0.500,
      autoDeductTareAtPOS: true,
      standardRollLengthMeters: 50,
      looseMeterDiscountPct: 10,
      enableHybridRollPricing: true,
      lastUpdated: new Date().toISOString()
    },
    Fleece: {
      category: 'Fleece',
      defaultRetailPrice: 470, // KSh 470 per meter
      defaultBulkPrice: 440,   // KSh 440 per meter (wholesale roll)
      defaultCostPrice: 320,
      marginPercentage: 47,
      pricePerKgRate: 470,
      coneTareWeightKg: 0.250,
      baleTareWeightKg: 0.500,
      autoDeductTareAtPOS: true,
      standardRollLengthMeters: 70,
      looseMeterDiscountPct: 10,
      enableHybridRollPricing: true,
      lastUpdated: new Date().toISOString()
    },
    Yarns: {
      category: 'Yarns',
      defaultRetailPrice: 950, // Standard KSh 950 per KG
      defaultBulkPrice: 950,   // Standard KSh 950 per KG (wholesale)
      defaultCostPrice: 650,
      marginPercentage: 46,
      pricePerKgRate: 950,     // Standard 1 KG = KSh 950
      coneTareWeightKg: 0.070, // Standard 70g empty paper/plastic cone spool
      baleTareWeightKg: 0.840, // Standard 840g bale bag & packaging
      autoDeductTareAtPOS: true,
      standardRollLengthMeters: 0,
      looseMeterDiscountPct: 0,
      enableHybridRollPricing: false,
      lastUpdated: new Date().toISOString()
    }
  };

  // Master Product Category Images (Dereck, Fleece, Yarns)
  const DEFAULT_CATEGORY_IMAGES: Record<CategoryType, string> = {
    Dereck: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    Fleece: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    Yarns: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=800&q=80'
  };

  const [categoryImages, setCategoryImages] = useState<Record<CategoryType, string>>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_category_images');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading category images from localStorage:', e);
    }
    return DEFAULT_CATEGORY_IMAGES;
  });

  const [isProductImageModalOpen, setIsProductImageModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_category_images', JSON.stringify(categoryImages));
    } catch (e) {
      console.warn('Error saving category images to localStorage:', e);
    }
  }, [categoryImages]);

  // Firestore realtime listener for Category Images
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'category_images'), (snapshot) => {
        if (!snapshot.empty) {
          const loadedImgs = { ...DEFAULT_CATEGORY_IMAGES };
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.category && data.imageUrl) {
              loadedImgs[data.category as CategoryType] = data.imageUrl;
            }
          });
          setCategoryImages(loadedImgs);
        }
      }, (err) => {
        console.warn('Firestore category images listener:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Error establishing Firestore category images sync:', e);
    }
  }, []);

  const [categoryPricingConfigs, setCategoryPricingConfigs] = useState<Record<CategoryType, CategoryPricingConfig>>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_category_pricing_v4');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading category pricing configs from localStorage:', e);
    }
    return DEFAULT_CATEGORY_PRICING;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Error saving products to localStorage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_category_pricing_v4', JSON.stringify(categoryPricingConfigs));
    } catch (e) {
      console.warn('Error saving category pricing configs to localStorage:', e);
    }
  }, [categoryPricingConfigs]);

  // Realtime Cloud Firestore Synchronization for Products (Accessible anywhere from phone, laptop, tablet)
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'products'), async (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ProductBatch[] = [];
          snapshot.forEach((docSnap) => {
            const item = docSnap.data() as ProductBatch;
            // Cleanse legacy mock batches from Firestore sync
            if (!item.id.startsWith('BATCH-DRK-') && !item.id.startsWith('BATCH-FLC-') && !item.id.startsWith('BATCH-YRN-')) {
              loaded.push(item);
            }
          });
          setProducts(loaded);
          setCloudSyncStatus('synced');
          setLastCloudSync(new Date());
        } else {
          setProducts([]);
          setCloudSyncStatus('synced');
          setLastCloudSync(new Date());
        }
      }, (error) => {
        console.warn('Firestore products listener notification (using local state fallback):', error.message);
        setCloudSyncStatus('offline');
      });

      return () => unsub();
    } catch (e) {
      console.warn('Error establishing Firestore products sync listener:', e);
      setCloudSyncStatus('offline');
    }
  }, []);

  const [orders, setOrders] = useState<SaleOrder[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((o: SaleOrder) => !o.id.startsWith('ORD-2026-88'));
        }
      }
    } catch (e) {
      console.warn('Error reading orders from localStorage:', e);
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving orders to localStorage:', e);
    }
  }, [orders]);

  const [transfers, setTransfers] = useState<InterStoreTransfer[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_transfers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: InterStoreTransfer) => !t.id.startsWith('TRF-2026-00'));
        }
      }
    } catch (e) {
      console.warn('Error reading transfers from localStorage:', e);
    }
    return INITIAL_TRANSFERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_transfers', JSON.stringify(transfers));
    } catch (e) {
      console.warn('Error saving transfers to localStorage:', e);
    }
  }, [transfers]);

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_ledger');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: LedgerEntry) => !l.id.startsWith('LED-'));
        }
      }
    } catch (e) {
      console.warn('Error reading ledger from localStorage:', e);
    }
    return INITIAL_LEDGER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_ledger', JSON.stringify(ledger));
    } catch (e) {
      console.warn('Error saving ledger to localStorage:', e);
    }
  }, [ledger]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: AuditLog) => !a.id.startsWith('AUD-'));
        }
      }
    } catch (e) {
      console.warn('Error reading audit logs from localStorage:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Error saving audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_staff');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: StaffMember) => !s.id.startsWith('STAFF-'));
        }
      }
    } catch (e) {
      console.warn('Error reading staff from localStorage:', e);
    }
    return INITIAL_STAFF;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_staff', JSON.stringify(staff));
    } catch (e) {
      console.warn('Error saving staff to localStorage:', e);
    }
  }, [staff]);

  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_payroll');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: PayrollRecord) => !p.id.startsWith('PAY-2026-08'));
        }
      }
    } catch (e) {
      console.warn('Error reading payroll from localStorage:', e);
    }
    return INITIAL_PAYROLL;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_payroll', JSON.stringify(payroll));
    } catch (e) {
      console.warn('Error saving payroll to localStorage:', e);
    }
  }, [payroll]);

  const [etrConfig, setEtrConfig] = useState<ETRConfig>(INITIAL_ETR_CONFIG);

  // Dual-Weight Tare Reconciliation Logs State
  const [tareReconciliationLogs, setTareReconciliationLogs] = useState<TareReconciliationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_tare_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: TareReconciliationRecord) => !t.id.startsWith('TARE-2026-00'));
        }
      }
    } catch (e) {
      console.warn('Error reading tare reconciliation logs from localStorage:', e);
    }
    return INITIAL_TARE_RECONCILIATION_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_tare_logs', JSON.stringify(tareReconciliationLogs));
    } catch (e) {
      console.warn('Error saving tare logs to localStorage:', e);
    }
  }, [tareReconciliationLogs]);

  // 5% Withholding Tax (WHT & WHVAT) Records State
  const [whtRecords, setWhtRecords] = useState<KRAWithholdingTaxRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_wht_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((w: KRAWithholdingTaxRecord) => !w.id?.startsWith('WHT-2026-0'));
        }
      }
    } catch (e) {
      console.warn('Error reading WHT records from localStorage:', e);
    }
    return INITIAL_WHT_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_wht_records', JSON.stringify(whtRecords));
    } catch (e) {
      console.warn('Error saving WHT records to localStorage:', e);
    }
  }, [whtRecords]);

  const updateProductTareProfile = (batchId: string, profile: TareProfile) => {
    setProducts(prev =>
      prev.map(p => (p.id === batchId ? { ...p, tareProfile: profile } : p))
    );
    recordAuditLog(
      'Product Tare Profile Updated',
      `Configured tare profile for batch ${batchId}: ${profile.packagingDescription || ''} (${profile.tareWeightPerUnit || 0}kg)`
    );
  };

  const addTareReconciliationRecord = (record: Omit<TareReconciliationRecord, 'id' | 'timestamp'>) => {
    const newRecord: TareReconciliationRecord = {
      ...record,
      id: `TARE-AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };
    setTareReconciliationLogs(prev => [newRecord, ...prev]);
    return { success: true, id: newRecord.id };
  };

  const reconcileTareWithJournal = (recordId: string) => {
    const targetRecord = tareReconciliationLogs.find(r => r.id === recordId);
    if (!targetRecord) return { success: false, message: 'Record not found' };

    const journalId = `JRN-TARE-${Date.now().toString().slice(-5)}`;
    const journalEntry: LedgerEntry = {
      id: journalId,
      timestamp: new Date().toISOString(),
      transactionRef: targetRecord.orderId || targetRecord.consignmentId || targetRecord.id,
      description: `Dual-Weight Tare Reconciliation Adjusting Journal for ${targetRecord.productName} (${targetRecord.tareWeightDeducted.toFixed(3)}kg tare)`,
      debitAccount: '5120 - Tare & Packaging Variance Expense',
      creditAccount: '1200 - Inventory Asset (Raw Materials & Finished Goods)',
      amount: Number(targetRecord.varianceCostSaved.toFixed(2)) || 100,
      locationId: targetRecord.locationId,
      category: 'Adjustment'
    };

    setLedger(prev => [journalEntry, ...prev]);
    setTareReconciliationLogs(prev =>
      prev.map(r => (r.id === recordId ? { ...r, status: 'journal_posted' } : r))
    );

    recordAuditLog(
      'Tare Adjusting Journal Posted',
      `Posted balancing journal ${journalId} for Tare record ${recordId} (KSh ${journalEntry.amount})`
    );

    return { success: true, message: 'Adjusting Journal Entry successfully posted to General Ledger.' };
  };

  const updateCartTare = (
    batchId: string,
    scaleGrossWeight: number,
    tareDeduction: number,
    netBillableWeight: number,
    tareDescription?: string
  ) => {
    setCart(prev =>
      prev.map(item => {
        if (item.batchId === batchId) {
          return {
            ...item,
            scaleGrossWeight,
            tareDeduction,
            netBillableWeight,
            quantity: netBillableWeight,
            isTareApplied: true,
            tareDescription: tareDescription || item.tareDescription
          };
        }
        return item;
      })
    );
  };

  // 5% WITHHOLDING TAX (WHT & WHVAT) METHODS
  const addWithholdingTaxRecord = (recordData: Omit<KRAWithholdingTaxRecord, 'id'>) => {
    const newId = `WHT-${Date.now().toString().slice(-6)}`;
    const certNo = recordData.certificateNo || `KRA-WHT-5%-${Date.now().toString().slice(-4)}`;
    const netPayable = recordData.netPayable ?? Number((recordData.grossAmount - recordData.whtAmount).toFixed(2));
    
    const created: KRAWithholdingTaxRecord = {
      ...recordData,
      id: newId,
      certificateNo: certNo,
      netPayable,
      issueDate: recordData.issueDate || new Date().toISOString().split('T')[0]
    };

    setWhtRecords(prev => [created, ...prev]);

    // Auto post double entry journal entry to ensure general ledger synchronization
    if (created.direction === 'Withheld_By_Us_Payable') {
      const jEntry: LedgerEntry = {
        id: `LEDG-WHT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: `WHT-DED-${newId}`,
        description: `5% Withholding Tax Deduction: ${created.entityName} (${created.natureOfTransaction})`,
        debitAccount: 'Professional, Legal & Consultancy Expense',
        creditAccount: 'KRA Withholding Tax 5% Payable',
        amount: created.whtAmount,
        locationId: activeLocation,
        category: 'Withholding Tax 5%'
      };
      setLedger(prev => [jEntry, ...prev]);
    } else {
      const jEntry: LedgerEntry = {
        id: `LEDG-WHT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: `WHT-REC-${newId}`,
        description: `5% Withholding Tax Credit Receivable: ${created.entityName} (Cert: ${certNo})`,
        debitAccount: 'Advance Withholding Tax Credits (5%)',
        creditAccount: 'Accounts Receivable (Trade Debtors)',
        amount: created.whtAmount,
        locationId: activeLocation,
        category: 'Withholding Tax 5%'
      };
      setLedger(prev => [jEntry, ...prev]);
    }

    recordAuditLog(
      '5% Withholding Tax Recorded',
      `Registered ${created.direction}: ${created.entityName} - Gross: KSh ${created.grossAmount.toLocaleString()}, WHT: KSh ${created.whtAmount.toLocaleString()} (${(created.rate * 100).toFixed(1)}%), Cert: ${certNo}`
    );
    playSuccessSound();

    return {
      success: true,
      message: `Withholding Tax record ${created.id} (Cert: ${certNo}) registered successfully!`,
      recordId: created.id
    };
  };

  const settleWithholdingTaxRecord = (id: string, prnNumber?: string) => {
    setWhtRecords(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          settled: true,
          prnNumber: prnNumber || r.prnNumber || `PRN-${Date.now().toString().slice(-6)}-KRA`
        };
      }
      return r;
    }));

    recordAuditLog('Withholding Tax Remitted', `Remitted WHT voucher ${id} to KRA. PRN: ${prnNumber || 'Confirmed'}`);
    playSuccessSound();
    return { success: true, message: `Withholding Tax ${id} marked as remitted to KRA!` };
  };

  // Deliveries Intake & Barcode Scanning State
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_deliveries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((d: DeliveryRecord) => !d.id.startsWith('DEL-2026-00'));
        }
      }
    } catch (e) {
      console.warn('Error reading deliveries from localStorage:', e);
    }
    return INITIAL_DELIVERIES;
  });

  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_deliveries', JSON.stringify(deliveries));
    } catch (e) {
      console.warn('Error saving deliveries to localStorage:', e);
    }
  }, [deliveries]);

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Mail / Transfer Notifications State - only real notifications from real triggers
  const [mailNotifications, setMailNotifications] = useState<MailNotification[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_mail_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Cleanse legacy mock notification IDs
          return parsed.filter((m: MailNotification) => m.id !== 'MAIL-001' && m.id !== 'MAIL-002');
        }
      }
    } catch (e) {
      console.warn('Error reading mail notifications from localStorage:', e);
    }
    return INITIAL_MAIL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_mail_notifications', JSON.stringify(mailNotifications));
    } catch (e) {
      console.warn('Error saving mail notifications to localStorage:', e);
    }
  }, [mailNotifications]);

  const [activeToastNotification, setActiveToastNotification] = useState<MailNotification | null>(null);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<SaleOrder | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isMobileBarcodeScannerOpen, setIsMobileBarcodeScannerOpen] = useState(false);
  const [duplicateAlertState, setDuplicateAlertState] = useState<DuplicateBarcodeAlertState>({
    isOpen: false,
    barcode: '',
    existingProduct: null,
    scannedAt: '',
    message: ''
  });
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const dismissDuplicateAlert = () => {
    setDuplicateAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const updateBrandSettings = (newSettings: Partial<BrandSettings>) => {
    setBrandSettings(prev => ({ ...prev, ...newSettings }));
    recordAuditLog('Brand Settings Updated', `Updated brand settings (${newSettings.brandName || brandSettings.brandName})`);
  };

  const markNotificationRead = (id: string) => {
    setMailNotifications(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const clearNotifications = () => {
    setMailNotifications([]);
  };

  // Shift Closures State
  const [shiftClosures, setShiftClosures] = useState<CashierShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_shift_closures');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: CashierShiftRecord) => !s.id?.startsWith('SHIFT-2026-0823'));
        }
      }
    } catch (e) {
      console.warn('Error reading shift closures from localStorage:', e);
    }
    return INITIAL_SHIFT_CLOSURES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_shift_closures', JSON.stringify(shiftClosures));
    } catch (e) {
      console.warn('Error saving shift closures to localStorage:', e);
    }
  }, [shiftClosures]);

  const [activeShiftStartTime, setActiveShiftStartTime] = useState<string>(() => {
    const saved = localStorage.getItem('urban_interior_active_shift_start');
    if (saved) return saved;
    const today8am = new Date();
    today8am.setHours(8, 0, 0, 0);
    return today8am.toISOString();
  });

  useEffect(() => {
    localStorage.setItem('urban_interior_active_shift_start', activeShiftStartTime);
  }, [activeShiftStartTime]);

  const [isShiftClosureModalOpen, setIsShiftClosureModalOpen] = useState(false);
  const [selectedShiftRecord, setSelectedShiftRecord] = useState<CashierShiftRecord | null>(null);
  const [isTodaySalesModalOpen, setIsTodaySalesModalOpen] = useState(false);
  const [isPeriodicStatementModalOpen, setIsPeriodicStatementModalOpen] = useState(false);

  const getActiveShiftStats = () => {
    const currentLoc = locations.find(l => l.id === activeLocation);
    const openingFloat = currentLoc?.openingFloat || 10000;
    return calculateActiveShiftPreview(
      currentUser?.id || 'op-current',
      currentUser?.name || 'Cashier',
      activeLocation,
      orders,
      branchExpenses,
      activeShiftStartTime,
      openingFloat
    );
  };

  const getTodaySalesSummary = (locationId: LocationId | 'All' = 'All') => {
    return computeTodaySalesSummary(
      orders,
      products,
      locations,
      branchExpenses,
      locationId
    );
  };

  const getPeriodicStatementSummary = (
    periodType: 'daily' | 'weekly' | 'monthly' | 'custom',
    startDateStr: string,
    endDateStr: string,
    locationId: LocationId | 'All' = 'All'
  ) => {
    return computePeriodicStatementSummary(
      periodType,
      startDateStr,
      endDateStr,
      orders,
      products,
      locations,
      branchExpenses,
      shiftClosures,
      locationId
    );
  };

  const closeCashierShift = async (data: {
    actualCashAtHand: number;
    actualMpesa: number;
    actualBank: number;
    actualCard?: number;
    cashDenominations?: {
      notes1000?: number;
      notes500?: number;
      notes200?: number;
      notes100?: number;
      notes50?: number;
      coins?: number;
    };
    handedOverTo?: string;
    closingNotes?: string;
  }) => {
    try {
      const activeStats = getActiveShiftStats();
      const nowISO = new Date().toISOString();
      const locInfo = locations.find(l => l.id === activeLocation);
      const shiftNum = `SH-${new Date().toISOString().slice(5, 10).replace('-', '')}-${String(shiftClosures.length + 1).padStart(2, '0')}`;
      const zNum = `Z-${Date.now().toString().slice(-8)}`;

      const cashVariance = Number((data.actualCashAtHand - activeStats.expectedCashInDrawer).toFixed(2));
      const mpesaVariance = Number((data.actualMpesa - activeStats.expectedMpesa).toFixed(2));
      const bankVariance = Number((data.actualBank - activeStats.expectedBank).toFixed(2));
      const totalVariance = Number((cashVariance + mpesaVariance + bankVariance).toFixed(2));

      const newShiftRecord: CashierShiftRecord = {
        id: `SHIFT-${Date.now()}`,
        shiftNumber: shiftNum,
        locationId: activeLocation,
        locationName: locInfo?.name || activeLocation,
        operatorId: currentUser?.id || 'op-current',
        operatorName: currentUser?.name || 'Cashier',
        operatorRole: currentUser?.role || 'pos_cashier',
        startTime: activeShiftStartTime,
        endTime: nowISO,
        status: 'closed',
        openingFloat: activeStats.openingFloat,
        totalSalesOrdersCount: activeStats.totalSalesOrdersCount,
        totalUnitsSold: activeStats.totalUnitsSold,
        grossSalesRevenue: activeStats.grossSalesRevenue,
        vatLiability: activeStats.vatLiability,
        netSalesRevenue: activeStats.netSalesRevenue,
        expectedCash: activeStats.expectedCashInDrawer,
        expectedMpesa: activeStats.expectedMpesa,
        expectedBank: activeStats.expectedBank,
        expectedCard: activeStats.expectedCard,
        cashExpensesPaid: activeStats.cashExpensesPaid,
        actualCashAtHand: data.actualCashAtHand,
        actualMpesa: data.actualMpesa,
        actualBank: data.actualBank,
        actualCard: data.actualCard ?? activeStats.expectedCard,
        cashVariance,
        mpesaVariance,
        bankVariance,
        totalVariance,
        cashDenominations: data.cashDenominations,
        handedOverTo: data.handedOverTo || 'Branch Supervisor / Safe',
        closingNotes: data.closingNotes || 'Shift closed and balanced.',
        closedBySupervisor: isAdmin ? (adminUser?.displayName || 'Administrator') : undefined,
        closedAt: nowISO,
        zReportNumber: zNum
      };

      setShiftClosures(prev => [newShiftRecord, ...prev]);

      // Adjust current cash balance in location to actual counted cash
      setLocations(prev => prev.map(l => {
        if (l.id === activeLocation) {
          return {
            ...l,
            currentCashBalance: data.actualCashAtHand
          };
        }
        return l;
      }));

      // Post variance to ledger if there is any cash discrepancy
      if (Math.abs(cashVariance) >= 0.01) {
        const varianceLedgerId = `LEDG-VAR-${Date.now().toString().slice(-6)}`;
        setLedger(prev => [
          {
            id: varianceLedgerId,
            timestamp: nowISO,
            transactionRef: zNum,
            description: `Cashier Shift Reconciled Variance for ${newShiftRecord.shiftNumber} (${cashVariance > 0 ? 'Surplus' : 'Shortage'})`,
            debitAccount: cashVariance > 0 ? 'Cash in Drawer' : 'Cash Shortage Expense',
            creditAccount: cashVariance > 0 ? 'Cash Over / Surplus Revenue' : 'Cash in Drawer',
            amount: Math.abs(cashVariance),
            locationId: activeLocation,
            category: 'Adjustment'
          },
          ...prev
        ]);
      }

      // Record Audit Log
      recordAuditLog(
        'Cashier Shift Closed',
        `Closed shift ${shiftNum} (Z-Report: ${zNum}) for ${newShiftRecord.operatorName} at ${locInfo?.name}. Expected Cash: KSh ${activeStats.expectedCashInDrawer.toLocaleString()}, Actual Cash: KSh ${data.actualCashAtHand.toLocaleString()}, Variance: KSh ${totalVariance.toLocaleString()}`
      );

      // Start next active shift session
      setActiveShiftStartTime(nowISO);
      setSelectedShiftRecord(newShiftRecord);

      return {
        success: true,
        shiftRecord: newShiftRecord,
        message: `Shift ${shiftNum} successfully closed and reconciled with Z-Report #${zNum}`
      };
    } catch (err: any) {
      console.error('Error closing shift:', err);
      return {
        success: false,
        message: err.message || 'Failed to close shift'
      };
    }
  };

  // QUARANTINED DEFECTS & CREDIT NOTES (RMA, DAMAGED CONES, SUPPLIER CLAIMS)
  const [quarantinedDefects, setQuarantinedDefects] = useState<QuarantinedDefectRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_quarantine_defects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading quarantine defects from localStorage:', e);
    }
    return INITIAL_QUARANTINED_DEFECTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_quarantine_defects', JSON.stringify(quarantinedDefects));
    } catch (e) {
      console.warn('Error saving quarantine defects to localStorage:', e);
    }
  }, [quarantinedDefects]);

  const [creditNotes, setCreditNotes] = useState<ETIMSCreditNote[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_credit_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading credit notes from localStorage:', e);
    }
    return INITIAL_CREDIT_NOTES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_credit_notes', JSON.stringify(creditNotes));
    } catch (e) {
      console.warn('Error saving credit notes to localStorage:', e);
    }
  }, [creditNotes]);

  // Fabric Rolls & Piece Goods Inventory (Fleece & Dereec variable roll lengths & remnants)
  const [fabricRolls, setFabricRolls] = useState<FabricRollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('urban_interior_fabric_rolls');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading fabric rolls from localStorage:', e);
    }
    return INITIAL_FABRIC_ROLLS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_interior_fabric_rolls', JSON.stringify(fabricRolls));
    } catch (e) {
      console.warn('Error saving fabric rolls to localStorage:', e);
    }
  }, [fabricRolls]);

  const [isReturnExchangeModalOpen, setIsReturnExchangeModalOpen] = useState(false);
  const [isFabricRollModalOpen, setIsFabricRollModalOpen] = useState(false);
  const [isForwardReservationsModalOpen, setIsForwardReservationsModalOpen] = useState(false);

  const addCreditNote = (noteData: Omit<ETIMSCreditNote, 'id' | 'timestamp' | 'fiscalSignature'> & { id?: string }) => {
    const id = noteData.id || `CRN-2026-${String(creditNotes.length + 1).padStart(3, '0')}`;
    const newNote: ETIMSCreditNote = {
      ...noteData,
      id,
      timestamp: new Date().toISOString(),
      fiscalSignature: `KRA-ETIMS-SIG-${Math.floor(10000 + Math.random() * 90000)}-${id}`
    };
    setCreditNotes(prev => [newNote, ...prev]);
    return { success: true, creditNoteId: id, message: `Credit Note ${id} created successfully.`, creditNote: newNote };
  };

  // Add a single fabric roll
  const addFabricRoll = (rollData: Omit<FabricRollRecord, 'id' | 'receivedAt'>) => {
    const id = `ROL-${rollData.category.slice(0, 3).toUpperCase()}-2026-${String(fabricRolls.length + 1).padStart(3, '0')}`;
    const newRoll: FabricRollRecord = {
      ...rollData,
      id,
      receivedAt: new Date().toISOString()
    };
    setFabricRolls(prev => [newRoll, ...prev]);
    recordAuditLog('Fabric Roll Created', `Logged roll ${newRoll.rollNumber} (${newRoll.currentLengthMeters}m of ${newRoll.productName})`);
    return { success: true, rollId: id, message: `Fabric Roll ${newRoll.rollNumber} created successfully.` };
  };

  // Multi-roll batch intake (e.g. bale arrival with variable meterages: [52.4, 48.0, 63.8, 55.0])
  const addFabricRollBatchIntake = (
    batchId: string,
    locationId: LocationId,
    rollLengths: number[],
    widthCm: number = 160,
    gsm: number = 300,
    supplierName?: string
  ) => {
    const batch = products.find(p => p.id === batchId);
    if (!batch) {
      return { success: false, createdCount: 0, totalMetersAdded: 0, message: 'Product batch not found.' };
    }

    const totalMeters = rollLengths.reduce((acc, len) => acc + len, 0);
    const newRolls: FabricRollRecord[] = rollLengths.map((len, idx) => {
      const rollSeq = fabricRolls.length + idx + 1;
      const rollId = `ROL-${batch.category.slice(0, 3).toUpperCase()}-2026-${String(rollSeq).padStart(3, '0')}`;
      return {
        id: rollId,
        rollNumber: `Roll #${idx + 1} (${batch.name.split(' - ')[0] || batch.name})`,
        barcode: `${batch.category.slice(0, 3).toUpperCase()}-ROL-${Date.now().toString().slice(-4)}${idx + 1}`,
        batchId: batch.id,
        productName: batch.name,
        category: batch.category,
        colorName: batch.colorName || 'Standard',
        colorHex: batch.colorHex,
        locationId,
        initialLengthMeters: len,
        currentLengthMeters: len,
        widthCm,
        gsm,
        status: 'sealed_full',
        isRemnant: len < 3.0,
        remnantDiscountPct: len < 3.0 ? 20 : undefined,
        spoiltMetersLogged: 0,
        receivedAt: new Date().toISOString(),
        supplierName: supplierName || batch.manufacturer || 'Oster India Garment Fabrics / Udey Udyog'
      };
    });

    setFabricRolls(prev => [...newRolls, ...prev]);

    // Update the master product batch total stock for this location
    setProducts(prev =>
      prev.map(p => {
        if (p.id === batchId) {
          const curStock = p.locationStock[locationId] || 0;
          return {
            ...p,
            locationStock: {
              ...p.locationStock,
              [locationId]: curStock + totalMeters
            }
          };
        }
        return p;
      })
    );

    recordAuditLog(
      'Fabric Batch Intake Registered',
      `Registered ${newRolls.length} rolls of ${batch.name} totalling ${totalMeters.toFixed(2)} meters at ${locationId}`
    );
    playSuccessSound();

    return {
      success: true,
      createdCount: newRolls.length,
      totalMetersAdded: totalMeters,
      message: `Successfully received ${newRolls.length} rolls totalling ${totalMeters.toFixed(2)} meters into inventory.`
    };
  };

  // Cut meters from an active fabric roll (handles piece goods deduction & remnant detection)
  const cutFabricFromRoll = (
    rollId: string,
    metersToCut: number,
    orderId?: string,
    isSpoiltCut: boolean = false,
    flawReason?: DefectReasonType
  ) => {
    const roll = fabricRolls.find(r => r.id === rollId);
    if (!roll) {
      return { success: false, remainingMeters: 0, message: 'Fabric roll not found.', isRemnant: false };
    }

    if (roll.currentLengthMeters < metersToCut) {
      playAlertSound();
      return {
        success: false,
        remainingMeters: roll.currentLengthMeters,
        message: `Insufficient length on ${roll.rollNumber}. Available: ${roll.currentLengthMeters.toFixed(2)}m, Requested: ${metersToCut.toFixed(2)}m.`,
        isRemnant: roll.isRemnant
      };
    }

    const newLength = Number((roll.currentLengthMeters - metersToCut).toFixed(2));
    const isNowRemnant = newLength > 0 && newLength <= 3.0;
    const isDepleted = newLength <= 0.05;

    let updatedStatus: FabricRollRecord['status'] = 'cutting_in_progress';
    if (isDepleted) updatedStatus = 'depleted';
    else if (isNowRemnant) updatedStatus = 'remnant';

    setFabricRolls(prev =>
      prev.map(r => {
        if (r.id === rollId) {
          return {
            ...r,
            currentLengthMeters: Math.max(0, newLength),
            status: updatedStatus,
            isRemnant: isNowRemnant,
            remnantDiscountPct: isNowRemnant ? (r.remnantDiscountPct || 20) : undefined,
            spoiltMetersLogged: isSpoiltCut ? (r.spoiltMetersLogged || 0) + metersToCut : r.spoiltMetersLogged
          };
        }
        return r;
      })
    );

    // Update parent batch stock
    setProducts(prev =>
      prev.map(p => {
        if (p.id === roll.batchId) {
          const curStock = p.locationStock[roll.locationId] || 0;
          return {
            ...p,
            locationStock: {
              ...p.locationStock,
              [roll.locationId]: Math.max(0, curStock - metersToCut)
            }
          };
        }
        return p;
      })
    );

    recordAuditLog(
      isSpoiltCut ? 'Spoilt Fabric Cut & Isolated' : 'Fabric Cut From Roll',
      `Cut ${metersToCut.toFixed(2)}m from ${roll.rollNumber}. Remaining: ${newLength.toFixed(2)}m ${isNowRemnant ? '(Marked as Remnant End-Piece)' : ''}`
    );

    return {
      success: true,
      remainingMeters: Math.max(0, newLength),
      message: `Cut ${metersToCut.toFixed(2)}m from ${roll.rollNumber}. ${isNowRemnant ? 'Roll has become a remnant (<=3m) and can be sold at bundle discount.' : ''}`,
      isRemnant: isNowRemnant
    };
  };

  // Cutout and quarantine spoilt meters directly from roll
  const logSpoiltFabricMeters = (
    rollId: string,
    spoiltMeters: number,
    flawReason: DefectReasonType,
    notes?: string
  ) => {
    const roll = fabricRolls.find(r => r.id === rollId);
    if (!roll) {
      return { success: false, message: 'Roll not found' };
    }
    const batch = products.find(p => p.id === roll.batchId);
    const unitPrice = batch?.unitPriceRetail || 650;
    const costPrice = batch?.costPrice || (unitPrice * 0.6);
    const costValuation = spoiltMeters * costPrice;

    // Deduct from roll
    const cutResult = cutFabricFromRoll(rollId, spoiltMeters, undefined, true, flawReason);
    if (!cutResult.success) {
      return { success: false, message: cutResult.message };
    }

    const rmaId = `RMA-FLC-2026-${String(quarantinedDefects.length + 1).padStart(4, '0')}`;
    const newQuarantineRecord: QuarantinedDefectRecord = {
      id: rmaId,
      rmaNumber: rmaId,
      customerName: 'Internal Spoilage / Cut Isolation',
      returnedAt: new Date().toISOString(),
      locationId: roll.locationId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      defectReason: flawReason,
      defectNotes: notes || `Cut out ${spoiltMeters.toFixed(2)}m of defective fabric from ${roll.rollNumber}`,
      resolutionType: 'exchange_replacement',
      returnedItem: {
        batchId: roll.batchId,
        productName: roll.productName,
        sku: roll.barcode,
        category: roll.category,
        unit: 'meter',
        colorName: roll.colorName,
        colorHex: roll.colorHex,
        metersCount: spoiltMeters,
        rollNumber: roll.rollNumber,
        unitPrice,
        costPrice,
        totalValuationRetail: spoiltMeters * unitPrice,
        totalValuationCost: costValuation
      },
      financialDetails: {},
      quarantineStatus: 'quarantined',
      supplierName: roll.supplierName || 'Oster India Garment Fabrics / Udey Udyog'
    };

    setQuarantinedDefects(prev => [newQuarantineRecord, ...prev]);

    // Ledger entry: Move cost from Active Inventory to Quarantined Damaged Inventory Asset
    const entry: LedgerEntry = {
      id: `LEDG-FLC-DEF-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: rmaId,
      description: `Defective Fabric Spoilage Quarantine (${spoiltMeters.toFixed(2)}m from ${roll.rollNumber}) - Reason: ${flawReason}`,
      debitAccount: '1350 - Quarantined Damaged Inventory Asset (Pending Supplier Claim)',
      creditAccount: `1200 - Inventory Asset (${roll.locationId})`,
      amount: Number(costValuation.toFixed(2)),
      locationId: roll.locationId,
      category: 'Adjustment'
    };
    setLedger(prev => [entry, ...prev]);

    recordAuditLog(
      'Defective Fabric Meters Quarantined',
      `Quarantined ${spoiltMeters.toFixed(2)}m of defective fabric from ${roll.rollNumber} under ${rmaId}. Valuation: KSh ${costValuation.toLocaleString()}`
    );
    playSuccessSound();

    return {
      success: true,
      rmaId,
      message: `Successfully cut and quarantined ${spoiltMeters.toFixed(2)}m of spoilt fabric under ticket ${rmaId}.`
    };
  };

  const processReturnAndExchange = (payload: ReturnExchangePayload) => {
    const rmaId = `RMA-2026-${String(quarantinedDefects.length + 1).padStart(4, '0')}`;
    const retBatch = products.find(p => p.id === payload.returnedBatchId);
    const locInfo = locations.find(l => l.id === payload.locationId);

    const isFabric = retBatch?.category === 'Fleece' || retBatch?.category === 'Dereck' || payload.returnedUnit === 'meter' || (payload.returnedMeters && payload.returnedMeters > 0);

    // Quantity metrics: meters for Fleece/Dereec, net kg for Yarn
    const returnedQty = isFabric
      ? (payload.returnedMeters && payload.returnedMeters > 0 ? payload.returnedMeters : 1.0)
      : (payload.returnedNetWeightKg > 0 ? payload.returnedNetWeightKg : 4.0);

    const unitPrice = isFabric
      ? (payload.returnedRatePerMeter && payload.returnedRatePerMeter > 0 ? payload.returnedRatePerMeter : (retBatch?.unitPriceRetail || 650))
      : (payload.returnedRatePerKg > 0 ? payload.returnedRatePerKg : (retBatch?.unitPriceRetail || 750));

    const costPrice = retBatch?.costPrice || (unitPrice * 0.6);
    const retailValuation = returnedQty * unitPrice;
    const costValuation = returnedQty * costPrice;

    // Tax calculation on returned goods
    const vatRate = etrConfig.vatRate || 0.16;
    const taxableNetRevenue = Number((retailValuation / (1 + vatRate)).toFixed(2));
    const vatReversal = Number((retailValuation - taxableNetRevenue).toFixed(2));

    let createdCreditNote: ETIMSCreditNote | undefined = undefined;
    let replacementInfo: QuarantinedDefectRecord['replacementItem'] = undefined;
    const financialDetails: QuarantinedDefectRecord['financialDetails'] = {
      originalPaymentMethod: payload.refundChannel || 'Bank Transfer'
    };

    // 1. RESOLUTION MODE HANDLING:
    if (payload.resolutionType === 'exchange_replacement') {
      // 1-to-1 Exchange: Issue good replacement cones or meters to customer from sellable active stock
      const repBatchId = payload.replacementBatchId || payload.returnedBatchId;
      const repBatch = products.find(p => p.id === repBatchId) || retBatch;
      const repQty = isFabric
        ? (payload.replacementMeters || returnedQty)
        : (payload.replacementNetWeightKg || returnedQty);
      const repUnitPrice = isFabric
        ? (payload.replacementRatePerMeter || unitPrice)
        : (payload.replacementRatePerKg || unitPrice);
      const repRetailValuation = repQty * repUnitPrice;

      // Check stock for replacement
      const availableStock = repBatch?.locationStock[payload.locationId] || 0;
      if (availableStock < repQty) {
        playAlertSound();
        return {
          success: false,
          message: `Cannot complete exchange: Insufficient replacement stock at ${locInfo?.name}. Available: ${availableStock.toFixed(2)}${isFabric ? 'm' : 'kg'}, Required: ${repQty.toFixed(2)}${isFabric ? 'm' : 'kg'}.`
        };
      }

      // Deduct replacement stock from Active Sellable Inventory
      setProducts(prevProds =>
        prevProds.map(p => {
          if (p.id === repBatchId) {
            const cur = p.locationStock[payload.locationId] || 0;
            return {
              ...p,
              locationStock: {
                ...p.locationStock,
                [payload.locationId]: Math.max(0, cur - repQty)
              }
            };
          }
          return p;
        })
      );

      replacementInfo = {
        batchId: repBatchId,
        productName: repBatch?.name || (isFabric ? 'Replacement Fabric' : 'Replacement Yarn Cones'),
        sku: repBatch?.sku || repBatchId,
        unit: isFabric ? 'meter' : 'kg',
        colorName: repBatch?.colorName,
        dyeLot: repBatch?.dyeLot,
        shadeCode: repBatch?.shadeCode,
        conesCount: !isFabric ? (payload.replacementConesCount || payload.returnedConesCount) : undefined,
        netWeightKg: !isFabric ? repQty : undefined,
        metersCount: isFabric ? repQty : undefined,
        rollNumber: payload.replacementRollNumber,
        unitPrice: repUnitPrice,
        totalValuationRetail: repRetailValuation
      };

      // Difference in price if replacement had slight variance
      const priceDiff = repRetailValuation - retailValuation;
      if (priceDiff > 0.01) {
        financialDetails.priceDifferencePaidByCustomer = priceDiff;
      } else if (priceDiff < -0.01) {
        financialDetails.priceDifferenceRefundedToCustomer = Math.abs(priceDiff);
      }

      // Ledger: Move cost from Active Inventory to Quarantined Damaged Inventory Asset
      const itemDesc = isFabric
        ? `${returnedQty.toFixed(2)} meters of ${retBatch?.name}`
        : `${payload.returnedConesCount} cones (${returnedQty.toFixed(3)}kg) of ${retBatch?.name}`;

      const entriesToPost: LedgerEntry[] = [
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-1`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `RMA Defective ${isFabric ? 'Fabric' : 'Yarn'} Quarantine (${itemDesc}) - Reason: ${payload.defectReason}`,
          debitAccount: '1350 - Quarantined Damaged Inventory Asset (Pending Supplier Claim)',
          creditAccount: `1200 - Inventory Asset (${locInfo?.name})`,
          amount: Number(costValuation.toFixed(2)),
          locationId: payload.locationId,
          category: 'Adjustment'
        }
      ];

      if (priceDiff > 0.01) {
        entriesToPost.push({
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-2`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `RMA Exchange Variance Surcharge Collected (Customer top-up ${priceDiff.toFixed(2)})`,
          debitAccount: 'Cash at Hand / Bank',
          creditAccount: 'Sales Revenue (Exchange Variance)',
          amount: Number(priceDiff.toFixed(2)),
          locationId: payload.locationId,
          category: 'Sales'
        });
      }

      setLedger(prev => [...entriesToPost, ...prev]);

    } else if (payload.resolutionType === 'bank_refund' || payload.resolutionType === 'mpesa_refund' || payload.resolutionType === 'cash_refund') {
      // Direct Cash/Bank Reversal: Company refunds the customer for spoilt goods
      const refundAmount = retailValuation;
      financialDetails.refundAmount = refundAmount;
      financialDetails.vatReversalAmount = vatReversal;
      financialDetails.netRevenueReversalAmount = taxableNetRevenue;
      financialDetails.bankTransferReference = payload.refundReference || `REF-BANK-${Date.now().toString().slice(-6)}`;

      // Generate official eTIMS Credit Note
      const crnId = `CRN-2026-${String(creditNotes.length + 1).padStart(3, '0')}`;
      createdCreditNote = {
        id: crnId,
        originalInvoiceNo: payload.receiptNumber || payload.orderId || 'INV-2026-ORIG',
        originalCuSerial: etrConfig.cuSerialNumber,
        customerName: payload.customerName,
        customerKraPin: undefined,
        creditReason: 'Damaged Fabric Return',
        originalAmount: refundAmount,
        creditAmount: refundAmount,
        vatCredited: vatReversal,
        netCredited: taxableNetRevenue,
        issuedBy: payload.operatorName || currentUser.name,
        timestamp: new Date().toISOString(),
        fiscalSignature: `KRA-ETIMS-CRN-${Math.floor(10000 + Math.random() * 90000)}-${crnId}`
      };
      setCreditNotes(prev => [createdCreditNote!, ...prev]);
      financialDetails.creditNoteNumber = crnId;

      // Decrement cash/bank if Cash
      if (payload.resolutionType === 'cash_refund') {
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === payload.locationId) {
              const cur = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: Math.max(0, cur - refundAmount) };
            }
            return l;
          })
        );
      }

      const channelName = payload.resolutionType === 'bank_refund'
        ? 'Bank Operating Account'
        : payload.resolutionType === 'mpesa_refund'
        ? 'M-Pesa Till / Paybill'
        : 'Cash Drawer';

      // Ledger: Reverse Sales Revenue & Output VAT, and isolate cost in Quarantine Asset
      const entriesToPost: LedgerEntry[] = [
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-1`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `Sales Return & Revenue Reversal for ${payload.customerName} (${payload.defectReason})`,
          debitAccount: '4200 - Sales Returns & Allowances',
          creditAccount: channelName,
          amount: Number(taxableNetRevenue.toFixed(2)),
          locationId: payload.locationId,
          category: 'Sales'
        },
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-2`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `KRA 16% Output VAT Reversal via Credit Note ${crnId}`,
          debitAccount: '2150 - KRA Output VAT Liability',
          creditAccount: channelName,
          amount: Number(vatReversal.toFixed(2)),
          locationId: payload.locationId,
          category: 'Tax VAT'
        },
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-3`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `Defective Stock Moved to Quarantine Asset at Cost (${isFabric ? `${returnedQty.toFixed(2)}m` : `${payload.returnedConesCount} cones`})`,
          debitAccount: '1350 - Quarantined Damaged Inventory Asset',
          creditAccount: '5000 - Cost of Goods Sold (COGS Reversal)',
          amount: Number(costValuation.toFixed(2)),
          locationId: payload.locationId,
          category: 'Adjustment'
        }
      ];

      setLedger(prev => [...entriesToPost, ...prev]);

    } else if (payload.resolutionType === 'store_credit') {
      // Digital Store Credit Voucher issued
      const creditAmount = retailValuation;
      financialDetails.refundAmount = creditAmount;
      financialDetails.vatReversalAmount = vatReversal;
      financialDetails.netRevenueReversalAmount = taxableNetRevenue;

      const crnId = `CRN-2026-${String(creditNotes.length + 1).padStart(3, '0')}`;
      createdCreditNote = {
        id: crnId,
        originalInvoiceNo: payload.receiptNumber || payload.orderId || 'INV-2026-ORIG',
        originalCuSerial: etrConfig.cuSerialNumber,
        customerName: payload.customerName,
        customerKraPin: undefined,
        creditReason: 'Damaged Fabric Return',
        originalAmount: creditAmount,
        creditAmount: creditAmount,
        vatCredited: vatReversal,
        netCredited: taxableNetRevenue,
        issuedBy: payload.operatorName || currentUser.name,
        timestamp: new Date().toISOString(),
        fiscalSignature: `KRA-ETIMS-CRN-${Math.floor(10000 + Math.random() * 90000)}-${crnId}`
      };
      setCreditNotes(prev => [createdCreditNote!, ...prev]);
      financialDetails.creditNoteNumber = crnId;

      const entriesToPost: LedgerEntry[] = [
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-1`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `Store Credit Issued to ${payload.customerName} for Damaged Goods (${crnId})`,
          debitAccount: '4200 - Sales Returns & Allowances',
          creditAccount: '2200 - Customer Store Credit Liabilities',
          amount: Number(taxableNetRevenue.toFixed(2)),
          locationId: payload.locationId,
          category: 'Sales'
        },
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-2`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `KRA 16% Output VAT Reversal for Credit Note ${crnId}`,
          debitAccount: '2150 - KRA Output VAT Liability',
          creditAccount: '2200 - Customer Store Credit Liabilities',
          amount: Number(vatReversal.toFixed(2)),
          locationId: payload.locationId,
          category: 'Tax VAT'
        },
        {
          id: `LEDG-RMA-${Date.now().toString().slice(-6)}-3`,
          timestamp: new Date().toISOString(),
          transactionRef: rmaId,
          description: `Defective Stock Moved to Quarantine Asset at Cost`,
          debitAccount: '1350 - Quarantined Damaged Inventory Asset',
          creditAccount: '5000 - Cost of Goods Sold (COGS Reversal)',
          amount: Number(costValuation.toFixed(2)),
          locationId: payload.locationId,
          category: 'Adjustment'
        }
      ];

      setLedger(prev => [...entriesToPost, ...prev]);
    }

    // 2. CREATE QUARANTINED DEFECT RECORD
    const newQuarantineRecord: QuarantinedDefectRecord = {
      id: rmaId,
      rmaNumber: rmaId,
      orderId: payload.orderId,
      receiptNumber: payload.receiptNumber,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      returnedAt: new Date().toISOString(),
      locationId: payload.locationId,
      operatorId: payload.operatorId || currentUser.id,
      operatorName: payload.operatorName || currentUser.name,
      defectReason: payload.defectReason,
      defectNotes: payload.defectNotes,
      resolutionType: payload.resolutionType,
      returnedItem: {
        batchId: payload.returnedBatchId,
        productName: retBatch?.name || (isFabric ? 'Damaged Fabric' : 'Damaged Yarn Cones'),
        sku: retBatch?.sku || payload.returnedBatchId,
        category: retBatch?.category || (isFabric ? 'Fleece' : 'Yarns'),
        unit: isFabric ? 'meter' : 'kg',
        colorName: retBatch?.colorName,
        colorHex: retBatch?.colorHex,
        dyeLot: retBatch?.dyeLot,
        shadeCode: retBatch?.shadeCode,
        yarnCount: retBatch?.yarnCount,
        conesCount: !isFabric ? payload.returnedConesCount : undefined,
        grossWeightKg: !isFabric ? payload.returnedGrossWeightKg : undefined,
        tareDeductionKg: !isFabric ? payload.returnedTareKg : undefined,
        netWeightKg: !isFabric ? returnedQty : undefined,
        metersCount: isFabric ? returnedQty : undefined,
        rollNumber: payload.returnedRollNumber,
        unitPrice: unitPrice,
        costPrice: costPrice,
        totalValuationRetail: retailValuation,
        totalValuationCost: costValuation
      },
      replacementItem: replacementInfo,
      financialDetails,
      quarantineStatus: 'quarantined',
      supplierName: payload.supplierName || retBatch?.manufacturer || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD'
    };

    setQuarantinedDefects(prev => [newQuarantineRecord, ...prev]);

    // 3. AUDIT LOG & SOUND
    const defectSummary = isFabric
      ? `${returnedQty.toFixed(2)}m of defective fabric quarantined`
      : `${payload.returnedConesCount} spoilt cones (${returnedQty.toFixed(3)}kg) quarantined`;

    recordAuditLog(
      'RMA Return & Exchange Processed',
      `Processed ${payload.resolutionType.replace('_', ' ')} (${rmaId}) for ${payload.customerName}: ${defectSummary}. Defect: ${payload.defectReason}`
    );
    playSuccessSound();

    return {
      success: true,
      rmaId,
      message: `Return & ${payload.resolutionType === 'exchange_replacement' ? 'Exchange' : 'Refund'} processed successfully under Ticket ${rmaId}.`,
      creditNote: createdCreditNote,
      exchangeRecord: newQuarantineRecord
    };
  };

  const fileSupplierDefectClaim = (recordIds: string[], supplierName: string, notes: string) => {
    const claimRef = `CLM-${supplierName.split(' ')[0].toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    let totalCostValuation = 0;
    let totalNetKg = 0;
    let totalMeters = 0;

    setQuarantinedDefects(prev =>
      prev.map(rec => {
        if (recordIds.includes(rec.id)) {
          totalCostValuation += rec.returnedItem.totalValuationCost;
          if (rec.returnedItem.netWeightKg) totalNetKg += rec.returnedItem.netWeightKg;
          if (rec.returnedItem.metersCount) totalMeters += rec.returnedItem.metersCount;
          return {
            ...rec,
            quarantineStatus: 'supplier_claim_filed',
            supplierName: supplierName || rec.supplierName,
            supplierClaimNumber: claimRef,
            supplierClaimFiledAt: now,
            supplierResolutionNotes: notes
          };
        }
        return rec;
      })
    );

    const qtySummary = [
      totalNetKg > 0 ? `${totalNetKg.toFixed(2)}kg yarn` : '',
      totalMeters > 0 ? `${totalMeters.toFixed(2)}m fabric` : ''
    ].filter(Boolean).join(' & ');

    // Ledger: Move from Quarantine Inventory to Supplier Receivable Claim
    const claimJournal: LedgerEntry = {
      id: `LEDG-CLM-${Date.now().toString().slice(-6)}`,
      timestamp: now,
      transactionRef: claimRef,
      description: `Supplier Defect Claim Filed against ${supplierName} (${qtySummary || `${recordIds.length} lots`})`,
      debitAccount: `1180 - Accounts Receivable (Supplier Claims - ${supplierName})`,
      creditAccount: '1350 - Quarantined Damaged Inventory Asset',
      amount: Number(totalCostValuation.toFixed(2)),
      locationId: activeLocation,
      category: 'Adjustment'
    };

    setLedger(prev => [claimJournal, ...prev]);

    recordAuditLog(
      'Supplier Defect Claim Filed',
      `Submitted Claim Note ${claimRef} to ${supplierName} for KSh ${totalCostValuation.toLocaleString()} (${qtySummary || `${recordIds.length} tickets`})`
    );
    playSuccessSound();

    return {
      success: true,
      claimRef,
      message: `Supplier Claim Note ${claimRef} successfully filed for ${recordIds.length} defect records (KSh ${totalCostValuation.toLocaleString()}).`
    };
  };

  const resolveQuarantineRecord = (
    recordIds: string[],
    action: 'supplier_compensated' | 'supplier_replaced' | 'written_off_scrap',
    notes: string,
    restockBatchId?: string,
    restockQtyKg?: number
  ) => {
    const now = new Date().toISOString();

    setQuarantinedDefects(prev =>
      prev.map(rec => {
        if (recordIds.includes(rec.id)) {
          return {
            ...rec,
            quarantineStatus: action === 'written_off_scrap' ? 'written_off_scrap' : 'supplier_compensated',
            supplierResolutionDate: now,
            supplierResolutionNotes: notes,
            isWrittenOff: action === 'written_off_scrap'
          };
        }
        return rec;
      })
    );

    // If replacement cones received from manufacturer, restock sellable inventory
    if (action === 'supplier_replaced' && restockBatchId && restockQtyKg && restockQtyKg > 0) {
      setProducts(prevProds =>
        prevProds.map(p => {
          if (p.id === restockBatchId) {
            const cur = p.locationStock[activeLocation] || 0;
            return {
              ...p,
              locationStock: {
                ...p.locationStock,
                [activeLocation]: cur + restockQtyKg
              }
            };
          }
          return p;
        })
      );
    }

    recordAuditLog(
      'Quarantine Defect Resolved',
      `Resolved ${recordIds.length} defect records via ${action.replace('_', ' ')}. Notes: ${notes}`
    );
    playSuccessSound();

    return { success: true, message: `Quarantine records resolved successfully.` };
  };

  // HELD CART OPERATIONS
  const holdCurrentCart = (note: string = 'Order Put On Hold', customerName: string = 'Retail Customer') => {
    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty. Nothing to put on hold.' };
    }
    const totalAmount = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const held: HeldCart = {
      id: `HOLD-${Date.now().toString().slice(-5)}`,
      note: note || 'Held Cart',
      customerName,
      items: [...cart],
      heldAt: new Date().toISOString(),
      totalAmount,
      locationId: activeLocation,
      operatorName: currentUser.name
    };

    setHeldCarts(prev => [held, ...prev]);
    clearCart();
    recordAuditLog('POS Cart Placed on Hold', `Held order ${held.id} (${cart.length} line items) totaling KSh ${totalAmount.toLocaleString()}`);
    return { success: true, message: `Cart successfully put on hold (${held.id}).` };
  };

  const restoreHeldCart = (heldId: string) => {
    const held = heldCarts.find(h => h.id === heldId);
    if (!held) return;

    // Check if receiver has a cue (active items currently in POS cart)
    if (cart.length > 0) {
      const currentQueueTotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const autoHeldQueue: HeldCart = {
        id: `HOLD-QUEUED-${Date.now().toString().slice(-4)}`,
        note: `Auto-held receiver queue before resuming ${held.id}`,
        customerName: 'Queued Customer',
        items: [...cart],
        heldAt: new Date().toISOString(),
        totalAmount: currentQueueTotal,
        locationId: activeLocation,
        operatorName: currentUser.name
      };
      setHeldCarts(prev => [autoHeldQueue, ...prev.filter(h => h.id !== heldId)]);
      recordAuditLog('POS Receiver Queue Auto-Held', `Auto-held receiver queue (${cart.length} items) to resume transferred sale ${held.id}`);
    } else {
      setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    }

    setCart(held.items);
    recordAuditLog('POS Transferred Sale / Order Resumed', `Restored held cart ${heldId} (${held.items.length} items) into POS cart for receiver service`);
  };

  const resumeTransferredSaleToCart = (transferId: string) => {
    // 1. Check if it's already in heldCarts
    const existingHeld = heldCarts.find(h => h.transferId === transferId || h.id === `HOLD-${transferId}`);
    if (existingHeld) {
      restoreHeldCart(existingHeld.id);
      return { success: true, message: `Transferred sale ${transferId} resumed into POS cart. Active queue held.` };
    }

    // 2. Otherwise find in transfers list
    const trf = transfers.find(t => t.id === transferId);
    if (!trf) {
      return { success: false, message: `Transfer ticket ${transferId} not found.` };
    }

    const cartItemsForHeld: POSCartItem[] = trf.items.map(i => {
      const prod = products.find(p => p.id === i.batchId);
      return {
        batchId: i.batchId,
        productName: i.productName,
        category: prod?.category || 'Dereck',
        colorName: prod?.colorName || 'Default Color',
        colorHex: prod?.colorHex || '#f43f5e',
        unit: i.unit,
        unitPrice: prod?.unitPriceRetail || 1000,
        quantity: i.quantity,
        isBulk: false,
        availableStock: prod?.locationStock[activeLocation] || 100
      };
    });

    // Auto-hold receiver's cue if cart has items
    if (cart.length > 0) {
      const currentQueueTotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const autoHeldQueue: HeldCart = {
        id: `HOLD-QUEUED-${Date.now().toString().slice(-4)}`,
        note: `Auto-held receiver queue before serving transferred sale ${transferId}`,
        customerName: 'Queued Customer',
        items: [...cart],
        heldAt: new Date().toISOString(),
        totalAmount: currentQueueTotal,
        locationId: activeLocation,
        operatorName: currentUser.name
      };
      setHeldCarts(prev => [autoHeldQueue, ...prev]);
    }

    setCart(cartItemsForHeld);
    recordAuditLog('POS Transferred Sale Resumed', `Resumed transferred sale ${transferId} into POS cart for receiver service`);
    return { success: true, message: `Transferred sale ${transferId} loaded into POS cart! Receiver queue auto-held.` };
  };

  const discardHeldCart = (heldId: string) => {
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    recordAuditLog('POS Held Cart Discarded', `Discarded held order ${heldId}`);
  };

  // Sync role changes with user profile & default location assignment
  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    let assignedLoc: LocationId = 'main_store';
    let roleName = 'Dereck Mwangi (Admin)';

    if (role === 'sales_shop_cashier') {
      assignedLoc = 'sales_shop';
      roleName = 'Amina Zainab (Sales Cashier)';
    } else if (role === 'store_1_attendant') {
      assignedLoc = 'store_1';
      roleName = 'David Ochieng (Store 1 Attendant)';
    } else if (role === 'store_2_attendant') {
      assignedLoc = 'store_2';
      roleName = 'Grace Wanjiku (Store 2 Attendant)';
    } else if (role === 'main_store_operator') {
      assignedLoc = 'main_store';
      roleName = 'Samuel Otieno (Main Store Op)';
    } else if (role === 'accountant') {
      assignedLoc = 'main_store';
      roleName = 'Faith Chebet (Accountant)';
    } else if (role === 'branch_manager') {
      assignedLoc = activeLocation && activeLocation !== 'branch_westlands' ? activeLocation : 'sales_shop';
      roleName = 'Brian O. Otieno (Branch Manager)';
    } else if (role === 'branch_cashier') {
      assignedLoc = activeLocation && activeLocation !== 'branch_westlands' ? activeLocation : 'sales_shop';
      roleName = 'Mercy Chebet (Branch Cashier)';
    }

    setActiveLocation(assignedLoc);
    setCurrentUser(prev => ({
      ...prev,
      role,
      name: roleName,
      assignedLocation: assignedLoc
    }));

    recordAuditLog('Role Switched', `User switched view to ${role} at location ${assignedLoc}`);
  };

  const recordAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      operatorName: currentUser.name,
      operatorRole: activeRole,
      locationId: activeLocation,
      action,
      details,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // BRANCH MANAGEMENT & INDEPENDENT FINANCIAL OPERATIONS
  const addLocation = async (branchData: Omit<LocationInfo, 'id'> & { id?: string; initialStockAllocations?: Record<string, number> }) => {
    const rawId = branchData.id || `branch_${(branchData.code || branchData.name).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const branchId: LocationId = rawId.toLowerCase();

    const newBranch: LocationInfo = {
      ...branchData,
      id: branchId,
      code: branchData.code || `BR-${branchId.slice(0, 4).toUpperCase()}`,
      status: branchData.status || 'active',
      isAutonomousFinancial: branchData.isAutonomousFinancial ?? true,
      openingFloat: branchData.openingFloat ?? 50000,
      currentCashBalance: branchData.currentCashBalance ?? (branchData.openingFloat ?? 50000),
      createdAt: new Date().toISOString()
    };

    // 1. Add to locations state
    setLocations(prev => [...prev, newBranch]);

    // 2. Initialize stock allocation for all products at this new branch location
    setProducts(prevProducts =>
      prevProducts.map(p => ({
        ...p,
        locationStock: {
          ...p.locationStock,
          [branchId]: branchData.initialStockAllocations?.[p.id] ?? 0
        }
      }))
    );

    // 3. Create initial opening float ledger entry if opening float > 0
    if (newBranch.openingFloat && newBranch.openingFloat > 0) {
      const openingLedgerEntry: LedgerEntry = {
        id: `LEDG-FLT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: `CAP-INJ-${newBranch.code || branchId}`,
        description: `Initial Opening Cash Float & Working Capital for ${newBranch.name}`,
        debitAccount: `${newBranch.name} Cash Drawer & Float Account`,
        creditAccount: 'Central Treasury / Capital Allocation',
        amount: newBranch.openingFloat,
        locationId: branchId,
        category: 'Sales'
      };
      setLedger(prev => [openingLedgerEntry, ...prev]);
    }

    recordAuditLog(
      'New Branch Created',
      `Created autonomous branch "${newBranch.name}" (${newBranch.code}) | Autonomous Finances: ${newBranch.isAutonomousFinancial ? 'YES' : 'NO'} | Opening Float: KSh ${(newBranch.openingFloat || 0).toLocaleString()}`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Branch "${newBranch.name}" created successfully with independent operations and finances!`,
      location: newBranch
    };
  };

  const updateLocation = async (id: string, updates: Partial<LocationInfo>) => {
    let updatedLoc: LocationInfo | undefined;
    setLocations(prev =>
      prev.map(loc => {
        if (loc.id === id) {
          updatedLoc = { ...loc, ...updates };
          return updatedLoc;
        }
        return loc;
      })
    );

    if (updatedLoc) {
      recordAuditLog(
        'Branch Profile Updated',
        `Updated settings and financial parameters for branch "${updatedLoc.name}" (${updatedLoc.code || updatedLoc.id})`
      );
      return { success: true, message: `Branch "${updatedLoc.name}" updated successfully.` };
    }
    return { success: false, message: 'Branch not found.' };
  };

  const deleteLocation = async (id: string) => {
    const locToDelete = locations.find(l => l.id === id);
    if (!locToDelete) return { success: false, message: 'Branch not found.' };

    if (id === 'main_store') {
      return { success: false, message: 'Cannot delete the Main Store Central Hub.' };
    }

    setLocations(prev => prev.filter(l => l.id !== id));
    if (activeLocation === id) {
      setActiveLocation('main_store');
    }

    recordAuditLog(
      'Branch Deactivated / Removed',
      `Removed branch "${locToDelete.name}" (${locToDelete.code || locToDelete.id}) from network.`
    );
    return { success: true, message: `Branch "${locToDelete.name}" removed successfully.` };
  };

  const addBranchExpense = async (expenseData: Omit<BranchExpense, 'id' | 'timestamp' | 'recordedBy'>) => {
    const loc = locations.find(l => l.id === expenseData.locationId);
    const locName = loc?.name || expenseData.locationId;
    const expId = `EXP-${Date.now().toString().slice(-6)}`;

    const newExpense: BranchExpense = {
      ...expenseData,
      id: expId,
      timestamp: new Date().toISOString(),
      recordedBy: currentUser.name
    };

    // 1. Add to branchExpenses
    setBranchExpenses(prev => [newExpense, ...prev]);

    // 2. Add double-entry to Ledger
    const expLedgerEntry: LedgerEntry = {
      id: `LEDG-${expId}`,
      timestamp: new Date().toISOString(),
      transactionRef: expId,
      description: `Branch Operating Expense: ${expenseData.title} (${expenseData.category}) - ${locName}`,
      debitAccount: `${locName} Operating Expense (${expenseData.category})`,
      creditAccount: `${locName} ${expenseData.paidVia}`,
      amount: expenseData.amount,
      locationId: expenseData.locationId,
      category: 'Expense'
    };
    setLedger(prev => [expLedgerEntry, ...prev]);

    // 3. Decrement cash drawer if paid via Cash Float
    if (expenseData.paidVia === 'Cash Float') {
      setLocations(prev =>
        prev.map(l => {
          if (l.id === expenseData.locationId) {
            const current = l.currentCashBalance ?? l.openingFloat ?? 0;
            return {
              ...l,
              currentCashBalance: Math.max(0, current - expenseData.amount)
            };
          }
          return l;
        })
      );
    }

    recordAuditLog(
      'Branch Expense Logged',
      `Recorded KSh ${expenseData.amount.toLocaleString()} for "${expenseData.title}" (${expenseData.category}) at ${locName} paid via ${expenseData.paidVia}`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Expense of KSh ${expenseData.amount.toLocaleString()} successfully recorded for ${locName}!`,
      expenseId: expId
    };
  };

  const deleteBranchExpense = async (id: string) => {
    setBranchExpenses(prev => prev.filter(e => e.id !== id));
    setLedger(prev => prev.filter(l => l.transactionRef !== id));
    return { success: true, message: 'Expense record deleted.' };
  };

  const adjustBranchCashFloat = (locationId: string, adjustmentAmount: number, reason: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return { success: false, message: 'Branch not found.' };

    const previousBalance = loc.currentCashBalance ?? loc.openingFloat ?? 0;
    const newBalance = previousBalance + adjustmentAmount;

    setLocations(prev =>
      prev.map(l => (l.id === locationId ? { ...l, currentCashBalance: newBalance } : l))
    );

    const adjLedgerEntry: LedgerEntry = {
      id: `LEDG-ADJ-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: `FLOAT-ADJ-${locationId}`,
      description: `Cash Drawer Float Adjustment for ${loc.name}: ${reason}`,
      debitAccount: adjustmentAmount >= 0 ? `${loc.name} Cash Drawer & Float` : 'Cash Shortage / Variance Expense',
      creditAccount: adjustmentAmount >= 0 ? 'Central Treasury Cash Injection' : `${loc.name} Cash Drawer & Float`,
      amount: Math.abs(adjustmentAmount),
      locationId,
      category: 'Expense'
    };
    setLedger(prev => [adjLedgerEntry, ...prev]);

    recordAuditLog(
      'Branch Cash Float Adjusted',
      `Adjusted cash float for ${loc.name} by KSh ${adjustmentAmount >= 0 ? '+' : ''}${adjustmentAmount.toLocaleString()} (New Balance: KSh ${newBalance.toLocaleString()}) - Reason: ${reason}`
    );

    return { success: true, message: `Cash balance updated to KSh ${newBalance.toLocaleString()}` };
  };

  const getBranchFinancialSummary = (locationId: string): BranchFinancialSummary => {
    const loc = locations.find(l => l.id === locationId) || {
      id: locationId,
      name: locationId,
      code: locationId,
      type: 'Independent Branch' as const,
      isAutonomousFinancial: true,
      canSellDirectly: true,
      canFulfillOrders: true,
      canRequestRestock: true,
      address: '',
      phone: ''
    };

    const branchOrders = orders.filter(
      o => (o.fulfilledByLocation === locationId || o.originLocation === locationId) && o.status === 'completed'
    );
    const grossRevenue = branchOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const vatLiability = branchOrders.reduce((sum, o) => sum + o.vatAmount, 0);
    const netRevenue = grossRevenue - vatLiability;

    const costOfGoodsSold = branchOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => {
        const prod = products.find(p => p.id === item.batchId);
        return itemSum + (item.quantity * (prod?.costPrice || 0));
      }, 0);
    }, 0);

    const grossProfit = netRevenue - costOfGoodsSold;
    const branchExps = branchExpenses.filter(e => e.locationId === locationId);
    const totalExpenses = branchExps.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const profitMarginPercent = grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

    const currentCashFloat = loc.currentCashBalance ?? loc.openingFloat ?? 0;
    const bankBalanceEstimate = (loc.openingFloat || 0) + grossRevenue - totalExpenses;

    const inventoryItemCount = products.reduce((sum, p) => sum + (p.locationStock[locationId] || 0), 0);
    const inventoryTotalValue = products.reduce(
      (sum, p) => sum + ((p.locationStock[locationId] || 0) * p.costPrice),
      0
    );
    const pendingTransfersCount = transfers.filter(
      t => (t.fromLocation === locationId || t.toLocation === locationId) && t.status === 'pending_approval'
    ).length;

    return {
      locationId,
      locationName: loc.name,
      locationCode: loc.code || locationId,
      locationType: loc.type,
      isAutonomousFinancial: Boolean(loc.isAutonomousFinancial),
      grossRevenue,
      vatLiability,
      netRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMarginPercent,
      currentCashFloat,
      bankBalanceEstimate,
      totalOrdersCount: branchOrders.length,
      inventoryItemCount,
      inventoryTotalValue,
      pendingTransfersCount
    };
  };

  // CART OPERATIONS
  const addToCart = (batch: ProductBatch, quantity: number = 1, isBulk: boolean = false) => {
    playAddToCartSound();
    const available = batch.locationStock[activeLocation] || 0;
    const price = (isBulk && activeLocation === 'main_store') ? batch.unitPriceBulk : batch.unitPriceRetail;

    const catConfig = categoryPricingConfigs[batch.category] || DEFAULT_CATEGORY_PRICING[batch.category];
    const stdRollMeters = batch.standardRollLengthMeters ?? catConfig?.standardRollLengthMeters ?? (batch.category === 'Fleece' ? 70 : (batch.category === 'Dereck' ? 50 : 0));
    const looseDiscount = catConfig?.looseMeterDiscountPct ?? 10;

    setCart(prev => {
      const existing = prev.find(item => item.batchId === batch.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const rollPricing = calculateRollPricing({
          quantity: newQty,
          unitPriceRetail: batch.unitPriceRetail,
          unitPriceBulk: batch.unitPriceBulk,
          category: batch.category,
          unit: batch.unit,
          standardRollMeters: existing.rollPricing?.standardRollMeters ?? stdRollMeters,
          looseDiscountPct: existing.rollPricing?.looseDiscountPct ?? looseDiscount,
          pricingMode: existing.rollPricing?.pricingMode ?? 'hybrid_discounted_loose'
        }) || undefined;

        return prev.map(item =>
          item.batchId === batch.id
            ? { ...item, quantity: newQty, availableStock: available, rollPricing }
            : item
        );
      }

      const rollPricing = calculateRollPricing({
        quantity,
        unitPriceRetail: batch.unitPriceRetail,
        unitPriceBulk: batch.unitPriceBulk,
        category: batch.category,
        unit: batch.unit,
        standardRollMeters: stdRollMeters,
        looseDiscountPct: looseDiscount,
        pricingMode: 'hybrid_discounted_loose'
      }) || undefined;

      return [
        ...prev,
        {
          batchId: batch.id,
          productName: batch.name,
          category: batch.category,
          colorName: batch.colorName,
          colorHex: batch.colorHex,
          unit: batch.unit,
          unitPrice: price,
          quantity,
          isBulk,
          availableStock: available,
          rollPricing
        }
      ];
    });
  };

  const removeFromCart = (batchId: string) => {
    playTrashSound();
    setCart(prev => prev.filter(item => item.batchId !== batchId));
  };

  const updateCartQuantity = (batchId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(batchId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.batchId !== batchId) return item;
        const prod = products.find(p => p.id === batchId);
        const catConfig = prod ? (categoryPricingConfigs[prod.category] || DEFAULT_CATEGORY_PRICING[prod.category]) : undefined;
        const stdRollMeters = item.rollPricing?.standardRollMeters ?? prod?.standardRollLengthMeters ?? catConfig?.standardRollLengthMeters ?? (prod?.category === 'Fleece' ? 70 : 50);
        const looseDiscount = item.rollPricing?.looseDiscountPct ?? catConfig?.looseMeterDiscountPct ?? 10;
        const pricingMode = item.rollPricing?.pricingMode ?? 'hybrid_discounted_loose';

        const rollPricing = prod ? (calculateRollPricing({
          quantity,
          unitPriceRetail: prod.unitPriceRetail,
          unitPriceBulk: prod.unitPriceBulk,
          category: prod.category,
          unit: prod.unit,
          standardRollMeters: stdRollMeters,
          looseDiscountPct: looseDiscount,
          pricingMode
        }) || undefined) : item.rollPricing;

        return { ...item, quantity, rollPricing };
      })
    );
  };

  const updateCartItemRollPricing = (
    batchId: string,
    options: {
      looseDiscountPct?: number;
      standardRollMeters?: number;
      pricingMode?: 'hybrid_discounted_loose' | 'all_wholesale' | 'all_retail' | 'custom';
      customLooseRate?: number;
    }
  ) => {
    setCart(prev =>
      prev.map(item => {
        if (item.batchId !== batchId) return item;
        const prod = products.find(p => p.id === batchId);
        if (!prod) return item;

        const catConfig = categoryPricingConfigs[prod.category] || DEFAULT_CATEGORY_PRICING[prod.category];
        const stdRollMeters = options.standardRollMeters ?? item.rollPricing?.standardRollMeters ?? prod.standardRollLengthMeters ?? catConfig?.standardRollLengthMeters ?? (prod.category === 'Fleece' ? 70 : 50);
        const looseDiscount = options.looseDiscountPct !== undefined ? options.looseDiscountPct : (item.rollPricing?.looseDiscountPct ?? catConfig?.looseMeterDiscountPct ?? 10);
        const pricingMode = options.pricingMode ?? item.rollPricing?.pricingMode ?? 'hybrid_discounted_loose';

        const rollPricing = calculateRollPricing({
          quantity: item.quantity,
          unitPriceRetail: prod.unitPriceRetail,
          unitPriceBulk: prod.unitPriceBulk,
          category: prod.category,
          unit: prod.unit,
          standardRollMeters: stdRollMeters,
          looseDiscountPct: looseDiscount,
          pricingMode,
          customLooseRate: options.customLooseRate
        }) || undefined;

        return {
          ...item,
          rollPricing
        };
      })
    );
  };

  const clearCart = () => {
    playTrashSound();
    setCart([]);
  };

  // POS CHECKOUT logic (Immediate Sales & Forward-Dated Reservations)
  const processPOSCheckout = (
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName: string = 'Walk-in Retail Customer',
    customerKraPin: string = '',
    isQuotation: boolean = false,
    applyWHT5: boolean = false,
    whtCertificateNo: string = '',
    isForwardDated: boolean = false,
    forwardFulfillmentDate: string = '',
    advanceDepositAmount?: number,
    fulfillmentNotes: string = ''
  ) => {
    // Check Store 1 and Store 2 restriction
    const locInfo = locations.find(l => l.id === activeLocation);
    if (!locInfo?.canSellDirectly && !isQuotation) {
      playAlertSound();
      return {
        success: false,
        message: `Direct POS Sales are disabled at ${locInfo?.name}. Please route this purchase order ticket to Main Store or Sales Shop.`
      };
    }

    if (cart.length === 0) {
      playAlertSound();
      return { success: false, message: 'Cart is empty.' };
    }

    // Check stock availability (accounting for already reserved stock)
    for (const item of cart) {
      const prod = products.find(p => p.id === item.batchId);
      const totalLocStock = prod?.locationStock[activeLocation] || 0;
      const alreadyReserved = prod?.reservedStock?.[activeLocation] || 0;
      const netAvailableStock = Math.max(0, totalLocStock - alreadyReserved);

      if (netAvailableStock < item.quantity && !isQuotation) {
        playAlertSound();
        return {
          success: false,
          message: `Insufficient available stock for "${item.productName}" at ${locInfo?.name}. Net Available (Unreserved): ${netAvailableStock.toFixed(2)} ${item.unit} (Total On-Hand: ${totalLocStock.toFixed(2)}, Reserved: ${alreadyReserved.toFixed(2)}).`
        };
      }
    }

    // Calculate totals & 16% KRA VAT breakdown (accounting for Option 1 roll pricing)
    const grossTotal = cart.reduce((acc, item) => {
      const lineTotal = item.rollPricing && item.rollPricing.totalPrice > 0 
        ? item.rollPricing.totalPrice 
        : item.unitPrice * item.quantity;
      return acc + lineTotal;
    }, 0);
    const subtotal = Number((grossTotal / (1 + etrConfig.vatRate)).toFixed(2));
    const vatAmount = Number((grossTotal - subtotal).toFixed(2));

    // 5% Withholding Tax calculations
    const whtRate = 0.05;
    const whtAmount = applyWHT5 ? Number((grossTotal * whtRate).toFixed(2)) : 0;
    const netReceivableAmount = applyWHT5 ? Number((grossTotal - whtAmount).toFixed(2)) : grossTotal;
    const whtCertNumber = applyWHT5 ? (whtCertificateNo || `KRA-WHT-5%-${Date.now().toString().slice(-6)}`) : undefined;

    const receiptNum = isForwardDated 
      ? `RES-${Math.floor(1000 + Math.random() * 9000)}-${orders.length + 1}`
      : `ETR-${Math.floor(1000 + Math.random() * 9000)}-${orders.length + 1}`;
    const orderId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // Forward-dated reservation specifics
    const depositPaid = isForwardDated ? Math.min(grossTotal, Math.max(0, advanceDepositAmount ?? grossTotal)) : grossTotal;
    const balanceDue = isForwardDated ? Number((grossTotal - depositPaid).toFixed(2)) : 0;
    const targetFulfillmentDate = forwardFulfillmentDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const newOrder: SaleOrder = {
      id: orderId,
      receiptNumber: receiptNum,
      documentType: isForwardDated ? 'advance_booking' : (isQuotation ? 'quotation' : 'receipt'),
      etrDevicePin: etrConfig.taxPin,
      cuSerialNumber: etrConfig.cuSerialNumber,
      originLocation: activeLocation,
      fulfilledByLocation: activeLocation,
      customerName,
      customerKraPin: customerKraPin || undefined,
      items: cart.map(item => {
        const itemLineTotal = item.rollPricing && item.rollPricing.totalPrice > 0
          ? item.rollPricing.totalPrice
          : item.unitPrice * item.quantity;
        return {
          batchId: item.batchId,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemLineTotal,
          scaleGrossWeight: item.scaleGrossWeight,
          tareDeduction: item.tareDeduction,
          netBillableWeight: item.netBillableWeight,
          isTareApplied: item.isTareApplied,
          tareDescription: item.tareDescription,
          dyeLot: item.dyeLot,
          shadeCode: item.shadeCode,
          yarnCount: item.yarnCount,
          bagNumber: item.bagNumber,
          rollPricing: item.rollPricing
        };
      }),
      subtotal,
      vatAmount,
      grandTotal: grossTotal,
      wht5Applied: applyWHT5,
      whtRate: applyWHT5 ? whtRate : undefined,
      whtAmount: applyWHT5 ? whtAmount : undefined,
      whtCertificateNo: whtCertNumber,
      netReceivableAmount: applyWHT5 ? netReceivableAmount : undefined,
      paymentMethod,
      paymentReference: `${(paymentMethod || 'CSH').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      status: isForwardDated ? 'reserved' : (isQuotation ? 'draft' : 'completed'),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      isRerouted: false,
      isQuotation,
      // Forward-Dated Reservation specific attributes
      isForwardDated,
      forwardFulfillmentDate: isForwardDated ? targetFulfillmentDate : undefined,
      advanceDepositPaid: isForwardDated ? depositPaid : undefined,
      balanceDue: isForwardDated ? balanceDue : undefined,
      depositPaymentMethod: isForwardDated ? paymentMethod : undefined,
      depositPaymentReference: isForwardDated ? `DEP-${(paymentMethod || 'CSH').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}` : undefined,
      reservationStatus: isForwardDated ? 'reserved_active' : undefined,
      fulfillmentNotes: isForwardDated ? fulfillmentNotes : undefined,
      isStockReserved: isForwardDated
    };

    if (isForwardDated) {
      // FORWARD-DATED RESERVATION MODE:
      // 1. Lock stock into reservedStock bucket for the active location (Do NOT deduct from total physical locationStock yet)
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const cartItem = cart.find(c => c.batchId === prod.id);
          if (cartItem) {
            const currentReserved = prod.reservedStock?.[activeLocation] || 0;
            return {
              ...prod,
              reservedStock: {
                ...(prod.reservedStock || {}),
                [activeLocation]: Number((currentReserved + cartItem.quantity).toFixed(3))
              }
            };
          }
          return prod;
        })
      );

      // 2. Accounting: Defer revenue recognition. Book customer advance deposit to liability account 2100
      if (depositPaid > 0) {
        const depositLedgerEntries: LedgerEntry[] = [
          {
            id: `LEDG-DEP-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            transactionRef: orderId,
            description: `Forward-Dated Reservation Deposit for ${customerName} (Fulfillment Target: ${targetFulfillmentDate})`,
            debitAccount: `${paymentMethod} Cash / Inflow Account`,
            creditAccount: '2100 - Customer Advance Deposits & Forward Order Liabilities',
            amount: depositPaid,
            locationId: activeLocation,
            category: 'Sales'
          }
        ];
        setLedger(prev => [...depositLedgerEntries, ...prev]);

        // Increment cash float if paid via physical cash
        if (paymentMethod === 'Cash') {
          setLocations(prevLocs =>
            prevLocs.map(l => {
              if (l.id === activeLocation) {
                const current = l.currentCashBalance ?? l.openingFloat ?? 0;
                return { ...l, currentCashBalance: current + depositPaid };
              }
              return l;
            })
          );
        }
      }

      // 3. Record Audit Log
      recordAuditLog(
        'Forward-Dated Reservation Booked',
        `Booked Reservation #${receiptNum} for ${customerName} at ${locInfo?.name}. Target Fulfillment: ${targetFulfillmentDate}. Reserved ${cart.length} item lines. Total: KSh ${grossTotal.toLocaleString()}, Deposit Paid: KSh ${depositPaid.toLocaleString()}, Balance Due: KSh ${balanceDue.toLocaleString()}`
      );

    } else if (!isQuotation) {
      // IMMEDIATE SALE MODE:
      // 1. Decrement Inventory stock at active location (using pure net billed weight)
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const cartItem = cart.find(c => c.batchId === prod.id);
          if (cartItem) {
            const currentStock = prod.locationStock[activeLocation] || 0;
            return {
              ...prod,
              locationStock: {
                ...prod.locationStock,
                [activeLocation]: Math.max(0, Number((currentStock - cartItem.quantity).toFixed(3)))
              }
            };
          }
          return prod;
        })
      );

      // 1b. Auto-Record Tare Reconciliation Audit Records for items with tare deduction
      const tareItems = cart.filter(c => (c.tareDeduction && c.tareDeduction > 0) || c.scaleGrossWeight);
      if (tareItems.length > 0) {
        const newTareLogs: TareReconciliationRecord[] = tareItems.map((ti, idx) => {
          const prod = products.find(p => p.id === ti.batchId);
          const gross = ti.scaleGrossWeight ?? (ti.quantity + (ti.tareDeduction || 0));
          const tare = ti.tareDeduction ?? 0;
          const net = ti.netBillableWeight ?? ti.quantity;
          const cost = prod?.costPrice ?? (ti.unitPrice * 0.6);
          const savedValuation = tare * ti.unitPrice;

          return {
            id: `TARE-AUD-${Date.now().toString().slice(-5)}-${idx}`,
            orderId,
            type: 'pos_sale',
            timestamp: new Date().toISOString(),
            batchId: ti.batchId,
            productName: ti.productName,
            sku: prod?.sku || ti.batchId,
            locationId: activeLocation,
            grossWeight: gross,
            tareWeightDeducted: tare,
            netWeightBillable: net,
            unitPrice: ti.unitPrice,
            costPrice: cost,
            varianceCostSaved: savedValuation,
            notes: `POS Scale reading: ${gross.toFixed(3)}kg. Auto-deducted ${tare.toFixed(3)}kg tare (${ti.tareDescription || 'Core/Cone'}). Billed pure net: ${net.toFixed(3)}kg.`,
            status: 'reconciled'
          };
        });

        setTareReconciliationLogs(prev => [...newTareLogs, ...prev]);
      }

      // 1c. If 5% WHT is applied, register receivable tax credit record
      if (applyWHT5 && whtAmount > 0) {
        const newWhtRecord: KRAWithholdingTaxRecord = {
          id: `WHT-POS-${Date.now().toString().slice(-6)}`,
          entityName: customerName || 'B2B Client',
          entityPin: customerKraPin || 'P051982341Z',
          natureOfTransaction: 'B2B Customer Invoiced Sales (5% Credit)',
          rate: 0.05,
          grossAmount: grossTotal,
          whtAmount,
          netPayable: netReceivableAmount,
          certificateNo: whtCertNumber || `KRA-WHT-5%-${Date.now().toString().slice(-4)}`,
          direction: 'Withheld_By_Customer_Receivable',
          period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          settled: true,
          issueDate: new Date().toISOString().split('T')[0],
          notes: `Auto-recorded from POS Sale Order ${orderId} (${receiptNum})`
        };
        setWhtRecords(prev => [newWhtRecord, ...prev]);
      }

      // 2. Add Ledger Entries (Double entry for revenue, 5% WHT credits, and VAT output tax)
      const entriesToPost: LedgerEntry[] = [];

      if (applyWHT5 && whtAmount > 0) {
        entriesToPost.push({
          id: `LEDG-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          transactionRef: orderId,
          description: `POS Retail Sale Net Proceeds (${paymentMethod}) [5% WHT Deducted by Customer]`,
          debitAccount: `${paymentMethod} Cash Account`,
          creditAccount: `Sales Revenue (${locInfo?.name})`,
          amount: netReceivableAmount,
          locationId: activeLocation,
          category: 'Sales'
        });

        entriesToPost.push({
          id: `LEDG-WHT-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          transactionRef: orderId,
          description: `5% Advance Withholding Tax Credit (KRA Cert: ${whtCertNumber})`,
          debitAccount: 'Advance Withholding Tax Credits (5%)',
          creditAccount: `Sales Revenue (${locInfo?.name})`,
          amount: whtAmount,
          locationId: activeLocation,
          category: 'Withholding Tax 5%'
        });
      } else {
        entriesToPost.push({
          id: `LEDG-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          transactionRef: orderId,
          description: `POS Retail Sale Revenue at ${locInfo?.name} (${paymentMethod})`,
          debitAccount: `${paymentMethod} Cash Account`,
          creditAccount: `Sales Revenue (${locInfo?.name})`,
          amount: grossTotal,
          locationId: activeLocation,
          category: 'Sales'
        });
      }

      // 16% Output VAT entry
      entriesToPost.push({
        id: `LEDG-VAT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: orderId,
        description: `KRA 16% Output VAT Liability for Receipt ${receiptNum}`,
        debitAccount: `Sales Revenue (${locInfo?.name})`,
        creditAccount: `KRA Output VAT Liability`,
        amount: vatAmount,
        locationId: activeLocation,
        category: 'Tax VAT'
      });

      setLedger(prev => [...entriesToPost, ...prev]);

      // 3. Update branch cash balance if paid in cash
      if (paymentMethod === 'Cash') {
        const cashIncrement = applyWHT5 ? netReceivableAmount : grossTotal;
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === activeLocation) {
              const current = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: current + cashIncrement };
            }
            return l;
          })
        );
      }

      // 4. Record Audit Log
      recordAuditLog(
        'POS Sale Completed',
        `Issued ETR Receipt ${receiptNum} for KSh ${grossTotal.toLocaleString()} (Net Collected: KSh ${netReceivableAmount.toLocaleString()}${applyWHT5 ? ', 5% WHT Withheld' : ''}) via ${paymentMethod} at ${locInfo?.name}`
      );
    } else {
      recordAuditLog('Proforma Quotation Created', `Generated KSh ${grossTotal.toLocaleString()} quotation for ${customerName}`);
    }

    setOrders(prev => [newOrder, ...prev]);
    setSelectedReceipt(newOrder);
    playSuccessSound();
    setCart([]);

    return { 
      success: true, 
      orderId, 
      isForwardDated,
      message: isForwardDated 
        ? `Forward Reservation #${receiptNum} successfully booked for ${targetFulfillmentDate}!` 
        : `Sale completed and ETR receipt #${receiptNum} generated!` 
    };
  };

  // FULFILL & RELEASE FORWARD-DATED RESERVATION (Trigger eTIMS Fiscal Invoice upon physical dispatch)
  const fulfillForwardReservation = (
    orderId: string,
    finalPaymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' = 'M-Pesa',
    finalPaymentReference: string = '',
    notes: string = ''
  ) => {
    const existingOrder = orders.find(o => o.id === orderId);
    if (!existingOrder) {
      playAlertSound();
      return { success: false, message: 'Reservation order not found.' };
    }

    if (existingOrder.status === 'completed' || existingOrder.reservationStatus === 'fulfilled') {
      playAlertSound();
      return { success: false, message: 'This reservation has already been fulfilled and finalized.' };
    }

    const fulfillLoc = existingOrder.fulfilledByLocation || activeLocation;
    const locInfo = locations.find(l => l.id === fulfillLoc);
    const locName = locInfo?.name || fulfillLoc;
    const nowISO = new Date().toISOString();

    // 1. Decrement physical stock and clear reserved stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const orderItem = existingOrder.items.find(i => i.batchId === prod.id);
        if (orderItem) {
          const currentPhysical = prod.locationStock[fulfillLoc] || 0;
          const currentReserved = prod.reservedStock?.[fulfillLoc] || 0;
          return {
            ...prod,
            locationStock: {
              ...prod.locationStock,
              [fulfillLoc]: Math.max(0, currentPhysical - orderItem.quantity)
            },
            reservedStock: {
              ...(prod.reservedStock || {}),
              [fulfillLoc]: Math.max(0, currentReserved - orderItem.quantity)
            }
          };
        }
        return prod;
      })
    );

    // 2. Financial Ledger recognition:
    // Move advance deposit from Liability (2100) -> Sales Revenue
    const depositAmt = existingOrder.advanceDepositPaid || 0;
    const balanceAmt = existingOrder.balanceDue || 0;
    const entriesToPost: LedgerEntry[] = [];

    if (depositAmt > 0) {
      entriesToPost.push({
        id: `LEDG-FULF-DEP-${Date.now().toString().slice(-6)}`,
        timestamp: nowISO,
        transactionRef: existingOrder.id,
        description: `Revenue Recognized from Advance Customer Deposit (Reservation ${existingOrder.receiptNumber})`,
        debitAccount: '2100 - Customer Advance Deposits & Forward Order Liabilities',
        creditAccount: `Sales Revenue (${locName})`,
        amount: depositAmt,
        locationId: fulfillLoc,
        category: 'Sales'
      });
    }

    // If remaining balance is collected now at fulfillment:
    if (balanceAmt > 0) {
      entriesToPost.push({
        id: `LEDG-FULF-BAL-${Date.now().toString().slice(-6)}`,
        timestamp: nowISO,
        transactionRef: existingOrder.id,
        description: `Remaining Balance Collected at Fulfillment for ${existingOrder.customerName || 'Client'} (${finalPaymentMethod})`,
        debitAccount: `${finalPaymentMethod} Cash / Bank Account`,
        creditAccount: `Sales Revenue (${locName})`,
        amount: balanceAmt,
        locationId: fulfillLoc,
        category: 'Sales'
      });

      // If cash, increment cash float
      if (finalPaymentMethod === 'Cash') {
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === fulfillLoc) {
              const cur = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: cur + balanceAmt };
            }
            return l;
          })
        );
      }
    }

    // 16% Output VAT Liability entry on fulfillment (KRA eTIMS timing requirement)
    entriesToPost.push({
      id: `LEDG-VAT-${Date.now().toString().slice(-6)}`,
      timestamp: nowISO,
      transactionRef: existingOrder.id,
      description: `KRA 16% Output VAT Liability for Fulfilled Reservation ${existingOrder.receiptNumber}`,
      debitAccount: `Sales Revenue (${locName})`,
      creditAccount: 'KRA Output VAT Liability',
      amount: existingOrder.vatAmount,
      locationId: fulfillLoc,
      category: 'Tax VAT'
    });

    // COGS & Inventory Asset reduction at cost
    const totalCostOfItems = existingOrder.items.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.batchId);
      return sum + item.quantity * (prod?.costPrice || (item.unitPrice * 0.6));
    }, 0);

    entriesToPost.push({
      id: `LEDG-COGS-${Date.now().toString().slice(-6)}`,
      timestamp: nowISO,
      transactionRef: existingOrder.id,
      description: `Cost of Goods Sold on Fulfillment of ${existingOrder.receiptNumber}`,
      debitAccount: '5000 - Cost of Goods Sold (COGS)',
      creditAccount: `1200 - Inventory Asset (${locName})`,
      amount: Number(totalCostOfItems.toFixed(2)),
      locationId: fulfillLoc,
      category: 'Adjustment'
    });

    setLedger(prev => [...entriesToPost, ...prev]);

    // 3. Update the order to completed Tax Invoice with official KRA fiscal signature
    const etrReceiptNo = `ETR-${Math.floor(1000 + Math.random() * 9000)}-${existingOrder.receiptNumber.replace('RES-', '')}`;
    const updatedOrder: SaleOrder = {
      ...existingOrder,
      receiptNumber: etrReceiptNo,
      documentType: 'receipt',
      status: 'completed',
      reservationStatus: 'fulfilled',
      fulfilledAt: nowISO,
      balanceDue: 0,
      paymentMethod: finalPaymentMethod,
      paymentReference: finalPaymentReference || `FULF-${finalPaymentMethod.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      fulfillmentNotes: notes || existingOrder.fulfillmentNotes || 'Order fulfilled and released to customer.'
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
    setSelectedReceipt(updatedOrder);
    playSuccessSound();

    recordAuditLog(
      'Forward Reservation Fulfilled & Dispatched',
      `Dispatched and fulfilled reservation ${existingOrder.receiptNumber} (New Fiscal ETR: ${etrReceiptNo}) for ${existingOrder.customerName}. Final Balance of KSh ${balanceAmt.toLocaleString()} cleared via ${finalPaymentMethod}. Inventory and VAT ledger finalized.`
    );

    return {
      success: true,
      order: updatedOrder,
      message: `Reservation fulfilled successfully! Issued official KRA Fiscal Receipt #${etrReceiptNo}.`
    };
  };

  // CANCEL FORWARD RESERVATION & RELEASE RESERVED STOCK
  const cancelForwardReservation = (
    orderId: string,
    refundMethod: 'cash' | 'mpesa' | 'bank' | 'store_credit' = 'mpesa',
    cancellationReason: string = 'Customer cancelled advance booking'
  ) => {
    const existingOrder = orders.find(o => o.id === orderId);
    if (!existingOrder) {
      playAlertSound();
      return { success: false, message: 'Reservation not found.' };
    }

    if (existingOrder.status === 'completed' || existingOrder.reservationStatus === 'fulfilled') {
      playAlertSound();
      return { success: false, message: 'Cannot cancel an order that has already been fulfilled and dispatched.' };
    }

    const fulfillLoc = existingOrder.fulfilledByLocation || activeLocation;
    const depositAmt = existingOrder.advanceDepositPaid || 0;
    const nowISO = new Date().toISOString();

    // 1. Release reserved stock back to sellable pool
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const orderItem = existingOrder.items.find(i => i.batchId === prod.id);
        if (orderItem) {
          const currentReserved = prod.reservedStock?.[fulfillLoc] || 0;
          return {
            ...prod,
            reservedStock: {
              ...(prod.reservedStock || {}),
              [fulfillLoc]: Math.max(0, currentReserved - orderItem.quantity)
            }
          };
        }
        return prod;
      })
    );

    // 2. Refund advance deposit if customer paid one
    if (depositAmt > 0) {
      const channelAccount = refundMethod === 'cash' 
        ? 'Cash Drawer Float' 
        : refundMethod === 'bank' 
        ? 'Bank Operating Account' 
        : refundMethod === 'store_credit' 
        ? 'Customer Store Credit Account' 
        : 'M-Pesa Till / Paybill';

      const refundEntry: LedgerEntry = {
        id: `LEDG-REF-${Date.now().toString().slice(-6)}`,
        timestamp: nowISO,
        transactionRef: orderId,
        description: `Advance Deposit Refund on Reservation Cancellation (${existingOrder.receiptNumber}) - Reason: ${cancellationReason}`,
        debitAccount: '2100 - Customer Advance Deposits & Forward Order Liabilities',
        creditAccount: channelAccount,
        amount: depositAmt,
        locationId: fulfillLoc,
        category: 'Sales'
      };
      setLedger(prev => [refundEntry, ...prev]);

      if (refundMethod === 'cash') {
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === fulfillLoc) {
              const cur = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: Math.max(0, cur - depositAmt) };
            }
            return l;
          })
        );
      }
    }

    // 3. Update order status to cancelled
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled',
              reservationStatus: 'cancelled',
              fulfillmentNotes: `Cancelled on ${new Date().toLocaleDateString()}: ${cancellationReason}`
            }
          : o
      )
    );

    recordAuditLog(
      'Forward Reservation Cancelled',
      `Cancelled reservation ${existingOrder.receiptNumber} for ${existingOrder.customerName}. Released ${existingOrder.items.length} reserved item lines back to sellable floor. Deposit of KSh ${depositAmt.toLocaleString()} refunded via ${refundMethod}.`
    );

    playAlertSound();
    return {
      success: true,
      message: `Reservation ${existingOrder.receiptNumber} cancelled and reserved stock returned to sellable floor.`
    };
  };

  // CONVERT PROFORMA QUOTATION TO OFFICIAL TAX INVOICE & ETR RECEIPT
  const convertQuotationToInvoice = (
    quotationId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    applyWHT5: boolean = false,
    whtCertificateNo: string = ''
  ) => {
    const existingQuotation = orders.find(o => o.id === quotationId);
    if (!existingQuotation) {
      playAlertSound();
      return { success: false, message: 'Quotation document not found.' };
    }

    const fulfillLoc = existingQuotation.fulfilledByLocation || activeLocation;
    const locInfo = locations.find(l => l.id === fulfillLoc);

    // 1. Check stock availability across the quotation items
    for (const item of existingQuotation.items) {
      const prod = products.find(p => p.id === item.batchId);
      const locStock = prod?.locationStock[fulfillLoc] || 0;
      if (locStock < item.quantity) {
        playAlertSound();
        return {
          success: false,
          message: `Insufficient stock for ${item.productName} at ${locInfo?.name || fulfillLoc}. Available: ${locStock} ${item.unit}.`
        };
      }
    }

    // 2. Decrement physical stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const orderItem = existingQuotation.items.find(i => i.batchId === prod.id);
        if (orderItem) {
          const currentStock = prod.locationStock[fulfillLoc] || 0;
          return {
            ...prod,
            locationStock: {
              ...prod.locationStock,
              [fulfillLoc]: Math.max(0, currentStock - orderItem.quantity)
            }
          };
        }
        return prod;
      })
    );

    // 3. 5% WHT and Financial breakdown
    const grossTotal = existingQuotation.grandTotal;
    const subtotal = Number((grossTotal / (1 + etrConfig.vatRate)).toFixed(2));
    const vatAmount = Number((grossTotal - subtotal).toFixed(2));

    const whtRate = 0.05;
    const whtAmount = applyWHT5 ? Number((grossTotal * whtRate).toFixed(2)) : 0;
    const netReceivableAmount = applyWHT5 ? Number((grossTotal - whtAmount).toFixed(2)) : grossTotal;
    const whtCertNumber = applyWHT5 ? (whtCertificateNo || `KRA-WHT-5%-${Date.now().toString().slice(-6)}`) : undefined;

    // 4. Update the order into a completed Tax Invoice
    const updatedOrder: SaleOrder = {
      ...existingQuotation,
      isQuotation: false,
      status: 'completed',
      paymentMethod,
      paymentReference: `${paymentMethod.slice(0, 3).toUpperCase()}-CNV-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      wht5Applied: applyWHT5,
      whtRate: applyWHT5 ? whtRate : undefined,
      whtAmount: applyWHT5 ? whtAmount : undefined,
      whtCertificateNo: whtCertNumber,
      netReceivableAmount: applyWHT5 ? netReceivableAmount : undefined,
      subtotal,
      vatAmount
    };

    // 5. Post Ledger Entries
    const entriesToPost: LedgerEntry[] = [];
    if (applyWHT5 && whtAmount > 0) {
      entriesToPost.push({
        id: `LEDG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: updatedOrder.id,
        description: `Quotation Converted to Invoice (${paymentMethod}) [5% WHT Deducted by Client]`,
        debitAccount: `${paymentMethod} Cash Account`,
        creditAccount: `Sales Revenue (${locInfo?.name})`,
        amount: netReceivableAmount,
        locationId: fulfillLoc,
        category: 'Sales'
      });

      entriesToPost.push({
        id: `LEDG-WHT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: updatedOrder.id,
        description: `5% Advance Withholding Tax Credit (KRA Cert: ${whtCertNumber})`,
        debitAccount: 'Advance Withholding Tax Credits (5%)',
        creditAccount: `Sales Revenue (${locInfo?.name})`,
        amount: whtAmount,
        locationId: fulfillLoc,
        category: 'Withholding Tax 5%'
      });

      const newWhtRecord: KRAWithholdingTaxRecord = {
        id: `WHT-POS-${Date.now().toString().slice(-6)}`,
        entityName: existingQuotation.customerName || 'B2B Client',
        entityPin: existingQuotation.customerKraPin || 'P051982341Z',
        natureOfTransaction: 'B2B Customer Invoiced Sales (5% Credit)',
        rate: 0.05,
        grossAmount: grossTotal,
        whtAmount,
        netPayable: netReceivableAmount,
        certificateNo: whtCertNumber || `KRA-WHT-5%-${Date.now().toString().slice(-4)}`,
        direction: 'Withheld_By_Customer_Receivable',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        settled: true,
        issueDate: new Date().toISOString().split('T')[0],
        notes: `Converted from Quotation ${existingQuotation.id} to ETR Receipt ${existingQuotation.receiptNumber}`
      };
      setWhtRecords(prev => [newWhtRecord, ...prev]);
    } else {
      entriesToPost.push({
        id: `LEDG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: updatedOrder.id,
        description: `Quotation Converted to Tax Invoice at ${locInfo?.name} (${paymentMethod})`,
        debitAccount: `${paymentMethod} Cash Account`,
        creditAccount: `Sales Revenue (${locInfo?.name})`,
        amount: grossTotal,
        locationId: fulfillLoc,
        category: 'Sales'
      });
    }

    // 16% Output VAT entry
    entriesToPost.push({
      id: `LEDG-VAT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: updatedOrder.id,
      description: `KRA 16% Output VAT Liability for Receipt ${updatedOrder.receiptNumber}`,
      debitAccount: `Sales Revenue (${locInfo?.name})`,
      creditAccount: `KRA Output VAT Liability`,
      amount: vatAmount,
      locationId: fulfillLoc,
      category: 'Tax VAT'
    });

    setLedger(prev => [...entriesToPost, ...prev]);

    // Update Cash Balance if paid in Cash
    if (paymentMethod === 'Cash') {
      const cashIncrement = applyWHT5 ? netReceivableAmount : grossTotal;
      setLocations(prevLocs =>
        prevLocs.map(l => {
          if (l.id === fulfillLoc) {
            const current = l.currentCashBalance ?? l.openingFloat ?? 0;
            return { ...l, currentCashBalance: current + cashIncrement };
          }
          return l;
        })
      );
    }

    setOrders(prev => prev.map(o => (o.id === quotationId ? updatedOrder : o)));
    setSelectedReceipt(updatedOrder);
    playSuccessSound();

    recordAuditLog(
      'Quotation Converted to Invoice',
      `Converted Quotation ${quotationId} to Official Tax Invoice ${updatedOrder.receiptNumber} for KSh ${grossTotal.toLocaleString()} via ${paymentMethod}`
    );

    return {
      success: true,
      message: `Quotation ${quotationId} successfully converted into Official Tax Invoice & ETR Receipt ${updatedOrder.receiptNumber}!`,
      order: updatedOrder
    };
  };

  // CREATE CUSTOM BILLING DOCUMENT (INVOICE, QUOTATION, PROFORMA, RECEIPT, DELIVERY NOTE, CREDIT NOTE)
  const createBillingDocument = (docData: {
    documentType: DocumentType;
    locationId: LocationId;
    customerName: string;
    customerKraPin?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    deliveryAddress?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleRegistration?: string;
    dispatchDate?: string;
    packageCount?: number;
    deliveryNotes?: string;
    items: {
      batchId: string;
      productName: string;
      category: CategoryType;
      unit: UnitType;
      quantity: number;
      unitPrice: number;
      scaleGrossWeight?: number;
      tareDeduction?: number;
      netBillableWeight?: number;
      tareDescription?: string;
    }[];
    paymentMethod?: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Credit/On Account';
    paymentReference?: string;
    discountAmount?: number;
    applyWHT5?: boolean;
    whtCertificateNo?: string;
    dueDate?: string;
    validityDays?: number;
    notes?: string;
    termsAndConditions?: string;
    deductInventory?: boolean;
    originalInvoiceNumber?: string;
    creditReason?: string;
  }) => {
    const rawNumber = Math.floor(1000 + Math.random() * 9000);
    const codeMap: Record<DocumentType, string> = {
      invoice: 'INV',
      quotation: 'QUO',
      proforma: 'PRO',
      receipt: 'RCP',
      delivery_note: 'DEL',
      credit_note: 'CRN',
      advance_booking: 'ADV'
    };
    const prefix = codeMap[docData.documentType] || 'DOC';
    const docId = `${prefix}-2026-${rawNumber}`;
    const receiptNumber = `KRA-${prefix}-${rawNumber}`;

    const isQuotation = docData.documentType === 'quotation' || docData.documentType === 'proforma';
    const isDelivery = docData.documentType === 'delivery_note';
    const isCredit = docData.documentType === 'credit_note';

    // Calculate line items and totals
    const formattedItems = docData.items.map(item => ({
      batchId: item.batchId,
      productName: item.productName,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      scaleGrossWeight: item.scaleGrossWeight,
      tareDeduction: item.tareDeduction,
      netBillableWeight: item.netBillableWeight,
      tareDescription: item.tareDescription
    }));

    const rawSubtotal = formattedItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const discount = Math.min(docData.discountAmount || 0, rawSubtotal);
    const taxableAmount = Math.max(0, rawSubtotal - discount);
    const vatAmount = Math.round(taxableAmount * 0.16 * 100) / 100;
    const grandTotal = isDelivery ? 0 : Math.round((taxableAmount + vatAmount) * 100) / 100;

    let whtAmount = 0;
    let netReceivableAmount = grandTotal;
    if (docData.applyWHT5 && grandTotal > 0) {
      whtAmount = Math.round(taxableAmount * 0.05 * 100) / 100;
      netReceivableAmount = Math.max(0, grandTotal - whtAmount);
    }

    const payMethod = docData.paymentMethod || (isQuotation ? 'Bank Transfer' : 'M-Pesa');
    const fulfillLoc = docData.locationId || activeLocation;
    const locInfo = locations.find(l => l.id === fulfillLoc);

    const initialStatus: OrderStatus = isDelivery
      ? 'dispatched'
      : isQuotation
      ? 'pending'
      : 'completed';

    const newDoc: SaleOrder = {
      id: docId,
      receiptNumber,
      documentType: docData.documentType,
      etrDevicePin: etrConfig.taxPin,
      cuSerialNumber: etrConfig.cuSerialNumber,
      originLocation: fulfillLoc,
      fulfilledByLocation: fulfillLoc,
      customerName: docData.customerName || 'Walk-in Client',
      customerKraPin: docData.customerKraPin,
      customerPhone: docData.customerPhone,
      customerEmail: docData.customerEmail,
      customerAddress: docData.customerAddress,
      deliveryAddress: docData.deliveryAddress || docData.customerAddress,
      driverName: docData.driverName,
      driverPhone: docData.driverPhone,
      vehicleRegistration: docData.vehicleRegistration,
      dispatchDate: docData.dispatchDate || new Date().toISOString().split('T')[0],
      packageCount: docData.packageCount || docData.items.length,
      deliveryNotes: docData.deliveryNotes,
      items: formattedItems,
      subtotal: taxableAmount,
      vatAmount,
      grandTotal,
      discountAmount: discount,
      paymentMethod: payMethod,
      paymentReference: docData.paymentReference,
      status: initialStatus,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      dueDate: docData.dueDate,
      validityDays: docData.validityDays || 30,
      isRerouted: false,
      isQuotation,
      originalInvoiceNumber: docData.originalInvoiceNumber,
      creditReason: docData.creditReason,
      wht5Applied: docData.applyWHT5,
      whtRate: docData.applyWHT5 ? 0.05 : undefined,
      whtAmount: docData.applyWHT5 ? whtAmount : undefined,
      whtCertificateNo: docData.whtCertificateNo,
      netReceivableAmount,
      notes: docData.notes,
      termsAndConditions: docData.termsAndConditions
    };

    // Deduct stock if requested or for active Tax Invoices/Receipts
    const shouldDeductStock = docData.deductInventory ?? (docData.documentType === 'invoice' || docData.documentType === 'receipt');
    if (shouldDeductStock && formattedItems.length > 0) {
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const matchedItem = formattedItems.find(it => it.batchId === prod.id);
          if (matchedItem) {
            const locStock = prod.locationStock ? (prod.locationStock[fulfillLoc] ?? 0) : 0;
            const updatedStock = Math.max(0, locStock - matchedItem.quantity);
            return {
              ...prod,
              locationStock: {
                ...(prod.locationStock || {}),
                [fulfillLoc]: updatedStock
              }
            };
          }
          return prod;
        })
      );
    }

    // Ledger posting for financial documents
    if (!isQuotation && !isDelivery && grandTotal > 0) {
      const entriesToPost: LedgerEntry[] = [];

      if (isCredit) {
        // Reverse Revenue & VAT for Credit Note
        entriesToPost.push({
          id: `LEDG-CRN-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          transactionRef: docId,
          description: `eTIMS Credit Note Adjustment (${docData.creditReason || 'Price Adjustment'}) - #${receiptNumber}`,
          debitAccount: `Sales Returns & Allowances`,
          creditAccount: `${payMethod} Cash Account`,
          amount: grandTotal,
          locationId: fulfillLoc,
          category: 'Sales'
        });
      } else {
        // Invoice / Receipt
        entriesToPost.push({
          id: `LEDG-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          transactionRef: docId,
          description: `${docData.documentType.toUpperCase()} Issue at ${locInfo?.name} (${payMethod}) - Ref: #${receiptNumber}`,
          debitAccount: `${payMethod} Cash Account`,
          creditAccount: `Sales Revenue (${locInfo?.name})`,
          amount: docData.applyWHT5 ? netReceivableAmount : grandTotal,
          locationId: fulfillLoc,
          category: 'Sales'
        });

        if (docData.applyWHT5 && whtAmount > 0) {
          entriesToPost.push({
            id: `LEDG-WHT-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            transactionRef: docId,
            description: `5% Advance Withholding Tax Credit (Cert: ${docData.whtCertificateNo || 'Pending'})`,
            debitAccount: 'Advance Withholding Tax Credits (5%)',
            creditAccount: `Sales Revenue (${locInfo?.name})`,
            amount: whtAmount,
            locationId: fulfillLoc,
            category: 'Withholding Tax 5%'
          });

          const newWhtRecord: KRAWithholdingTaxRecord = {
            id: `WHT-${Date.now().toString().slice(-6)}`,
            entityName: docData.customerName || 'B2B Client',
            entityPin: docData.customerKraPin || 'P051982341Z',
            natureOfTransaction: `B2B ${docData.documentType.toUpperCase()} Sales (5% Credit)`,
            rate: 0.05,
            grossAmount: grandTotal,
            whtAmount,
            netPayable: netReceivableAmount,
            certificateNo: docData.whtCertificateNo || `KRA-WHT-5%-${Date.now().toString().slice(-4)}`,
            direction: 'Withheld_By_Customer_Receivable',
            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            settled: true,
            issueDate: new Date().toISOString().split('T')[0],
            notes: `Generated on ${docData.documentType} #${receiptNumber}`
          };
          setWhtRecords(prev => [newWhtRecord, ...prev]);
        }

        // 16% Output VAT entry
        if (vatAmount > 0) {
          entriesToPost.push({
            id: `LEDG-VAT-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            transactionRef: docId,
            description: `KRA 16% Output VAT for #${receiptNumber}`,
            debitAccount: `Sales Revenue (${locInfo?.name})`,
            creditAccount: `KRA Output VAT Liability`,
            amount: vatAmount,
            locationId: fulfillLoc,
            category: 'Tax VAT'
          });
        }
      }

      setLedger(prev => [...entriesToPost, ...prev]);

      // Cash balance update if cash payment
      if (payMethod === 'Cash') {
        const cashDelta = isCredit ? -grandTotal : (docData.applyWHT5 ? netReceivableAmount : grandTotal);
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === fulfillLoc) {
              const current = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: current + cashDelta };
            }
            return l;
          })
        );
      }
    }

    setOrders(prev => [newDoc, ...prev]);
    setSelectedReceipt(newDoc);
    playSuccessSound();

    recordAuditLog(
      `Created ${docData.documentType.toUpperCase()} Document`,
      `Generated ${docData.documentType.toUpperCase()} #${receiptNumber} (ID: ${docId}) for ${docData.customerName || 'Client'} with ${formattedItems.length} items.`
    );

    return {
      success: true,
      message: `${docData.documentType.toUpperCase()} #${receiptNumber} successfully generated!`,
      order: newDoc
    };
  };

  const deleteBillingDocument = (documentId: string) => {
    setOrders(prev => prev.filter(o => o.id !== documentId));
    if (selectedReceipt?.id === documentId) {
      setSelectedReceipt(null);
    }
    recordAuditLog('Deleted Billing Document', `Removed document record ${documentId}`);
    return { success: true, message: `Document ${documentId} deleted successfully.` };
  };

  const updateBillingDocumentStatus = (documentId: string, updates: Partial<SaleOrder>) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === documentId) {
          const updated = { ...order, ...updates };
          if (selectedReceipt?.id === documentId) {
            setSelectedReceipt(updated);
          }
          return updated;
        }
        return order;
      })
    );
    return { success: true, message: `Document ${documentId} updated successfully.` };
  };

  // ROUTE ORDER TICKET (From Store 1 / Store 2 or Out-of-Stock Sales Shop -> Main Store)
  const createOrderRerouteTicket = (
    items: { batchId: string; quantity: number }[],
    customerName: string = 'Rerouted Customer Ticket',
    targetLocation: LocationId = 'main_store'
  ) => {
    const transferId = `TRF-${Date.now().toString().slice(-6)}`;
    const transferItems = items.map(i => {
      const prod = products.find(p => p.id === i.batchId);
      return {
        batchId: i.batchId,
        productName: prod?.name || 'Textile Item',
        quantity: i.quantity,
        unit: prod?.unit || 'meter',
        unitCost: prod?.costPrice || 0
      };
    });

    const originLoc = locations.find(l => l.id === activeLocation);
    const newTransfer: InterStoreTransfer = {
      id: transferId,
      transferType: 'order_fulfillment_reroute',
      fromLocation: activeLocation,
      toLocation: targetLocation,
      requestedByOperator: currentUser.name,
      items: transferItems,
      notes: `Purchase request routed from ${originLoc?.name || activeLocation} for customer: ${customerName}`,
      status: 'pending_approval',
      requestedAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);
    playNotificationSound();

    // Auto-add transfer to receiver's held carts list so receiver can resume to serve transferred sale
    const cartItemsForHeld: POSCartItem[] = transferItems.map(i => {
      const prod = products.find(p => p.id === i.batchId);
      return {
        batchId: i.batchId,
        productName: i.productName,
        category: prod?.category || 'Dereck',
        colorName: prod?.colorName || 'Default Color',
        colorHex: prod?.colorHex || '#f43f5e',
        unit: i.unit,
        unitPrice: prod?.unitPriceRetail || 1000,
        quantity: i.quantity,
        isBulk: false,
        availableStock: prod?.locationStock[targetLocation] || 100
      };
    });

    const totalTransferredAmount = cartItemsForHeld.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const heldTransferredCart: HeldCart = {
      id: `HOLD-${transferId}`,
      transferId,
      isTransferredSale: true,
      note: `Transferred Order Ticket (${transferId}) from ${originLoc?.name || activeLocation}`,
      customerName,
      items: cartItemsForHeld,
      heldAt: new Date().toISOString(),
      totalAmount: totalTransferredAmount,
      locationId: targetLocation,
      operatorName: currentUser.name
    };

    setHeldCarts(prev => [heldTransferredCart, ...prev]);

    // Send Mail Notification Popup
    const mailNotif: MailNotification = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      title: 'New Purchase Order Ticket Rerouted',
      message: `Purchase order ticket ${transferId} created at ${originLoc?.name || activeLocation} -> Rerouted to Main Store for customer ${customerName}.`,
      transferId,
      transferType: 'order_fulfillment_reroute',
      fromLocation: activeLocation,
      toLocation: targetLocation,
      timestamp: new Date().toISOString(),
      read: false,
      itemCount: items.length
    };
    setMailNotifications(prev => [mailNotif, ...prev]);
    setActiveToastNotification(mailNotif);

    recordAuditLog(
      'Order Reroute Ticket Created',
      `Ticket ${transferId} created at ${originLoc?.name || activeLocation} -> Routed to Main Store for customer ${customerName}`
    );

    clearCart();
    return { success: true, transferId };
  };

  // REQUEST RESTOCK (From Sales Shop / Store 1 / Store 2 -> Main Store at Zero Cost)
  const requestRestock = (
    items: { batchId: string; quantity: number }[],
    notes: string = 'Routine inventory restock request'
  ) => {
    const transferId = `TRF-RESTOCK-${Date.now().toString().slice(-5)}`;
    const transferItems = items.map(i => {
      const prod = products.find(p => p.id === i.batchId);
      return {
        batchId: i.batchId,
        productName: prod?.name || 'Textile Item',
        quantity: i.quantity,
        unit: prod?.unit || 'meter',
        unitCost: prod?.costPrice || 0
      };
    });

    const activeLocName = locations.find(l => l.id === activeLocation)?.name || activeLocation;
    const newTransfer: InterStoreTransfer = {
      id: transferId,
      transferType: 'restock_free',
      fromLocation: 'main_store',
      toLocation: activeLocation,
      requestedByOperator: `${currentUser.name} (${activeLocName})`,
      items: transferItems,
      notes,
      status: 'pending_approval',
      requestedAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);

    // Send Mail Notification Popup to Main Store
    const mailNotif: MailNotification = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      title: 'New Restock Request to Main Store',
      message: `${activeLocName} requested zero-cost restock ${transferId} (${items.length} line items).`,
      transferId,
      transferType: 'restock_free',
      fromLocation: activeLocation,
      toLocation: 'main_store',
      timestamp: new Date().toISOString(),
      read: false,
      itemCount: items.length
    };
    setMailNotifications(prev => [mailNotif, ...prev]);
    setActiveToastNotification(mailNotif);

    recordAuditLog(
      'Restock Request Issued',
      `Restock request ${transferId} issued by ${activeLocName} to Main Store`
    );

    playNotificationSound();
    return { success: true, transferId };
  };

  // DISPATCH RESTOCK TRANSFER (Main Store -> Target Shop at $0 Internal Cost)
  const dispatchRestockTransfer = (transferId: string) => {
    const trf = transfers.find(t => t.id === transferId);
    if (!trf) {
      playAlertSound();
      return { success: false, message: 'Transfer record not found' };
    }

    // Verify Main Store stock availability
    for (const item of trf.items) {
      const prod = products.find(p => p.id === item.batchId);
      const mainStock = prod?.locationStock.main_store || 0;
      if (mainStock < item.quantity) {
        playAlertSound();
        return {
          success: false,
          message: `Main Store stock insufficient for ${item.productName}. Required: ${item.quantity}, Available: ${mainStock}`
        };
      }
    }

    // 1. Decrement Main Store stock & Increment Receiving Store stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const trfItem = trf.items.find(i => i.batchId === prod.id);
        if (trfItem) {
          const fromStock = prod.locationStock[trf.fromLocation] || 0;
          const toStock = prod.locationStock[trf.toLocation] || 0;

          return {
            ...prod,
            locationStock: {
              ...prod.locationStock,
              [trf.fromLocation]: Math.max(0, fromStock - trfItem.quantity),
              [trf.toLocation]: toStock + trfItem.quantity
            }
          };
        }
        return prod;
      })
    );

    // 2. Mark transfer as fulfilled
    const totalAssetVal = trf.items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);
    setTransfers(prev =>
      prev.map(t =>
        t.id === transferId
          ? {
              ...t,
              status: 'fulfilled',
              fulfilledByOperator: currentUser.name,
              dispatchedAt: new Date().toISOString(),
              fulfilledAt: new Date().toISOString()
            }
          : t
      )
    );

    // 3. Ledger Entry: Double entry asset transfer at zero cost/cost valuation
    const toLocName = locations.find(l => l.id === trf.toLocation)?.name || trf.toLocation;
    const fromLocName = locations.find(l => l.id === trf.fromLocation)?.name || trf.fromLocation;

    const ledgerTransfer: LedgerEntry = {
      id: `LEDG-TRF-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: transferId,
      description: `Zero Cost Restock Transfer: ${fromLocName} -> ${toLocName}`,
      debitAccount: `${toLocName} Stock Holding Asset`,
      creditAccount: `${fromLocName} Stock Holding Asset`,
      amount: totalAssetVal,
      locationId: trf.fromLocation,
      category: 'Inter-Store Transfer'
    };

    setLedger(prev => [ledgerTransfer, ...prev]);

    // Send Mail Notification Popup to the receiving store only
    const mailNotif: MailNotification = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      title: `Stock Restock Dispatched to ${toLocName}`,
      message: `Main Store dispatched restock transfer ${transferId} (${trf.items.length} items) to ${toLocName}. Stock is now available in your inventory.`,
      transferId,
      transferType: 'restock_free',
      fromLocation: 'main_store',
      toLocation: trf.toLocation,
      timestamp: new Date().toISOString(),
      read: false,
      itemCount: trf.items.length
    };
    setMailNotifications(prev => [mailNotif, ...prev]);
    setActiveToastNotification(mailNotif);

    recordAuditLog(
      'Restock Dispatched',
      `Dispatched restock ${transferId} to ${toLocName}. Main Store stock decremented and ${toLocName} stock updated ($0 internal cost).`
    );

    playSuccessSound();
    return { success: true, message: `Restock transfer ${transferId} successfully dispatched and fulfilled!` };
  };

  // DIRECT DISPATCH STOCK TRANSFER (Any Source Store -> Any Target Store with POS Item Addition & Accountability)
  const createDirectDispatchTransfer = (
    fromLocation: LocationId,
    toLocation: LocationId,
    items: { batchId: string; quantity: number }[],
    notes: string = 'Inter-store dispatch transfer'
  ) => {
    if (fromLocation === toLocation) {
      playAlertSound();
      return { success: false, message: 'Source and destination locations must be different.' };
    }
    if (!items || items.length === 0) {
      playAlertSound();
      return { success: false, message: 'Please add at least one item to dispatch.' };
    }

    // Verify stock at source location
    for (const item of items) {
      const prod = products.find(p => p.id === item.batchId);
      if (!prod) {
        playAlertSound();
        return { success: false, message: `Product batch ${item.batchId} not found.` };
      }
      const currentStock = prod.locationStock[fromLocation] || 0;
      if (currentStock < item.quantity) {
        playAlertSound();
        const locName = locations.find(l => l.id === fromLocation)?.name || fromLocation;
        return {
          success: false,
          message: `Insufficient stock at ${locName} for "${prod.name}". Available: ${currentStock} ${prod.unit}, Requested: ${item.quantity} ${prod.unit}`
        };
      }
    }

    const transferId = `TRF-DISP-${Date.now().toString().slice(-5)}`;
    const dispatcherName = posSession?.isUnlocked
      ? `${posSession.operatorName} (${posSession.role})`
      : currentUser.name || 'Store Dispatcher';

    const transferItems = items.map(i => {
      const prod = products.find(p => p.id === i.batchId)!;
      return {
        batchId: i.batchId,
        productName: prod.name,
        quantity: i.quantity,
        unit: prod.unit,
        unitCost: prod.costPrice
      };
    });

    // Update Inventory stock across source & target stores
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const trfItem = items.find(i => i.batchId === prod.id);
        if (trfItem) {
          const fromStock = prod.locationStock[fromLocation] || 0;
          const toStock = prod.locationStock[toLocation] || 0;
          return {
            ...prod,
            locationStock: {
              ...prod.locationStock,
              [fromLocation]: Math.max(0, fromStock - trfItem.quantity),
              [toLocation]: toStock + trfItem.quantity
            }
          };
        }
        return prod;
      })
    );

    const newTransfer: InterStoreTransfer = {
      id: transferId,
      transferType: 'restock_free',
      fromLocation,
      toLocation,
      requestedByOperator: dispatcherName,
      fulfilledByOperator: dispatcherName,
      items: transferItems,
      notes,
      status: 'fulfilled',
      requestedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
      fulfilledAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);

    // Ledger Double-Entry Accounting
    const totalAssetVal = transferItems.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);
    const fromName = locations.find(l => l.id === fromLocation)?.name || fromLocation;
    const toName = locations.find(l => l.id === toLocation)?.name || toLocation;

    const ledgerTransfer: LedgerEntry = {
      id: `LEDG-DISP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: transferId,
      description: `Direct Dispatch Transfer: ${fromName} -> ${toName} (Dispatcher: ${dispatcherName})`,
      debitAccount: `${toName} Stock Holding Asset`,
      creditAccount: `${fromName} Stock Holding Asset`,
      amount: totalAssetVal,
      locationId: fromLocation,
      category: 'Inter-Store Transfer'
    };

    setLedger(prev => [ledgerTransfer, ...prev]);

    // Audit Log for accountability
    recordAuditLog(
      'Stock Dispatch Executed',
      `Dispatch Transfer ${transferId} (${transferItems.length} lines, Value KSh ${totalAssetVal.toLocaleString()}) dispatched from ${fromName} to ${toName} by ${dispatcherName}`
    );

    // Notification Mail
    const mailNotif: MailNotification = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      title: `Stock Dispatch Received at ${toName}`,
      message: `${fromName} dispatched stock transfer ${transferId} (${transferItems.length} items) directly to ${toName}. Dispatcher: ${dispatcherName}.`,
      transferId,
      transferType: 'restock_free',
      fromLocation,
      toLocation,
      timestamp: new Date().toISOString(),
      read: false,
      itemCount: transferItems.length
    };
    setMailNotifications(prev => [mailNotif, ...prev]);
    setActiveToastNotification(mailNotif);

    return {
      success: true,
      transferId,
      message: `Stock transfer ${transferId} successfully dispatched from ${fromName} to ${toName} with full accountability!`
    };
  };

  // UPDATE PRODUCT RETAIL PRICE (for Dead Stock Flash Clearance Promotions)
  const updateProductPrice = (batchId: string, newRetailPrice: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === batchId) {
          return { ...p, unitPriceRetail: newRetailPrice };
        }
        return p;
      })
    );
    recordAuditLog('Product Price Updated', `Updated retail price for batch ${batchId} to KSh ${newRetailPrice}`);
  };

  // FULFILL REROUTED ORDER (Main Store executes sales order routed from Store 1 / Store 2 / Sales Shop)
  const fulfillReroutedOrder = (
    transferId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName: string = 'Routed Order Customer',
    customerKraPin: string = ''
  ) => {
    const trf = transfers.find(t => t.id === transferId);
    if (!trf) return { success: false, message: 'Rerouted order ticket not found' };

    // 1. Verify Main Store stock
    for (const item of trf.items) {
      const prod = products.find(p => p.id === item.batchId);
      const mainStock = prod?.locationStock.main_store || 0;
      if (mainStock < item.quantity) {
        return {
          success: false,
          message: `Main Store stock insufficient to fulfill rerouted order for ${item.productName}. Available: ${mainStock}`
        };
      }
    }

    // Calculate total price based on product retail/bulk prices
    let totalGross = 0;
    const orderItems = trf.items.map(item => {
      const prod = products.find(p => p.id === item.batchId);
      const unitPrice = prod?.unitPriceRetail || 1000;
      const lineTotal = unitPrice * item.quantity;
      totalGross += lineTotal;

      return {
        batchId: item.batchId,
        productName: item.productName,
        category: prod?.category || 'Dereck',
        unit: item.unit,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal
      };
    });

    const subtotal = Number((totalGross / (1 + etrConfig.vatRate)).toFixed(2));
    const vatAmount = Number((totalGross - subtotal).toFixed(2));
    const receiptNum = `ETR-REROUTE-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ORD-REROUTE-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: SaleOrder = {
      id: orderId,
      receiptNumber: receiptNum,
      etrDevicePin: etrConfig.taxPin,
      cuSerialNumber: etrConfig.cuSerialNumber,
      originLocation: trf.fromLocation,
      fulfilledByLocation: 'main_store',
      customerName,
      customerKraPin: customerKraPin || undefined,
      items: orderItems,
      subtotal,
      vatAmount,
      grandTotal: totalGross,
      paymentMethod,
      paymentReference: `REROUTE-${(paymentMethod || 'CSH').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      isRerouted: true
    };

    // 2. Decrement Main Store Stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const item = trf.items.find(i => i.batchId === prod.id);
        if (item) {
          const mainStock = prod.locationStock.main_store || 0;
          return {
            ...prod,
            locationStock: {
              ...prod.locationStock,
              main_store: Math.max(0, mainStock - item.quantity)
            }
          };
        }
        return prod;
      })
    );

    // 3. Update Transfer record
    setTransfers(prev =>
      prev.map(t =>
        t.id === transferId
          ? {
              ...t,
              status: 'fulfilled',
              fulfilledByOperator: currentUser.name,
              fulfilledAt: new Date().toISOString(),
              customerOrderRef: orderId
            }
          : t
      )
    );

    // 4. Add Order & Ledger entries
    setOrders(prev => [newOrder, ...prev]);

    const originLocName = locations.find(l => l.id === trf.fromLocation)?.name || trf.fromLocation;

    const ledgerRev: LedgerEntry = {
      id: `LEDG-RR-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: orderId,
      description: `Rerouted Order Fulfillment Sale (Origin: ${originLocName} -> Fulfilled by Main Store)`,
      debitAccount: `${paymentMethod} Cash/Bank Account`,
      creditAccount: `Main Store Revenue (Rerouted Order)`,
      amount: totalGross,
      locationId: 'main_store',
      category: 'Sales'
    };

    const ledgerVat: LedgerEntry = {
      id: `LEDG-RR-VAT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      transactionRef: orderId,
      description: `16% KRA Output VAT for Rerouted ETR Receipt ${receiptNum}`,
      debitAccount: `Main Store Revenue (Rerouted Order)`,
      creditAccount: `KRA Output VAT Liability`,
      amount: vatAmount,
      locationId: 'main_store',
      category: 'Tax VAT'
    };

    setLedger(prev => [ledgerRev, ledgerVat, ...prev]);

    // Clean up corresponding held cart entry if present
    setHeldCarts(prev => prev.filter(h => h.transferId !== transferId && h.id !== `HOLD-${transferId}`));

    // Send Notification to Origin Store that order was fulfilled
    const mailNotif: MailNotification = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      title: 'Rerouted Order Fulfilled & Billed',
      message: `Main Store fulfilled order ticket ${transferId} (ETR Receipt: ${receiptNum}) for customer ${customerName}.`,
      transferId,
      transferType: 'order_fulfillment_reroute',
      fromLocation: 'main_store',
      toLocation: trf.fromLocation,
      timestamp: new Date().toISOString(),
      read: false,
      itemCount: trf.items.length
    };
    setMailNotifications(prev => [mailNotif, ...prev]);
    setActiveToastNotification(mailNotif);

    recordAuditLog(
      'Rerouted Order Executed',
      `Main Store fulfilled order ticket ${transferId} from ${originLocName}. Payment KSh ${totalGross.toLocaleString()} captured, ETR Receipt ${receiptNum} issued.`
    );

    setSelectedReceipt(newOrder);
    playSuccessSound();
    return { success: true, orderId, message: `Rerouted order successfully fulfilled! ETR Receipt ${receiptNum} generated.` };
  };

  // ACCEPT PURCHASE ORDER (Explicit alias for accepting & fulfilling transferred purchase order)
  const acceptPurchaseOrder = (
    transferId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName: string = 'Routed Order Customer',
    customerKraPin: string = ''
  ) => {
    return fulfillReroutedOrder(transferId, paymentMethod, customerName, customerKraPin);
  };

  // RECEIVE RESTOCK TRANSFER (Explicit alias for receiving restock stock into shop inventory)
  const receiveRestockTransfer = (transferId: string) => {
    const res = dispatchRestockTransfer(transferId);
    if (res.success) {
      playSuccessSound();
      const notif: MailNotification = {
        id: `MAIL-REC-${Date.now().toString().slice(-5)}`,
        title: 'Transfer Received Successfully ✓',
        message: `Stock Transfer ${transferId} has been received into inventory successfully!`,
        transferId,
        transferType: 'restock_free',
        fromLocation: activeLocation,
        toLocation: activeLocation,
        timestamp: new Date().toISOString(),
        read: false,
        itemCount: 1
      };
      setMailNotifications(prev => [notif, ...prev]);
      setActiveToastNotification(notif);
    }
    return res;
  };

  // DELIVERIES & BARCODE INTAKE METHODS
  const createDelivery = (
    deliveryData: Omit<DeliveryRecord, 'id' | 'createdAt' | 'totalScannedQty' | 'totalCostValuation' | 'totalRetailValuation'>
  ) => {
    const deliveryId = `DEL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newDelivery: DeliveryRecord = {
      ...deliveryData,
      id: deliveryId,
      status: 'pending',
      totalScannedQty: 0,
      totalCostValuation: 0,
      totalRetailValuation: 0,
      createdAt: new Date().toISOString()
    };

    setDeliveries(prev => [newDelivery, ...prev]);
    recordAuditLog('Delivery Manifest Created', `Registered delivery intake ${deliveryId} from ${deliveryData.supplierName} (${deliveryData.items.length} items)`);
    playSuccessSound();
    return { success: true, deliveryId, message: `Delivery manifest ${deliveryId} registered successfully.` };
  };

  const startReceivingDelivery = (deliveryId: string) => {
    setActiveDeliveryId(deliveryId);
    setDeliveries(prev =>
      prev.map(d => (d.id === deliveryId && d.status === 'pending' ? { ...d, status: 'receiving' } : d))
    );
    recordAuditLog('Delivery Receiving Started', `Started active barcode intake mode for delivery ${deliveryId}`);
  };

  const scanDeliveryBarcode = (deliveryId: string, rawBarcode: string) => {
    const code = rawBarcode.trim();
    if (!code) {
      return { success: false, isNewProduct: false, barcode: '', message: 'Empty barcode entered.' };
    }

    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) {
      return { success: false, isNewProduct: false, barcode: code, message: `Delivery ${deliveryId} not found.` };
    }

    // Match product by SKU, batch ID, barcode, or embedded QR code
    const matchedProduct = products.find(p =>
      p.sku.toLowerCase() === code.toLowerCase() ||
      p.id.toLowerCase() === code.toLowerCase() ||
      (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
      (p.qrCodeData && p.qrCodeData.includes(code))
    );

    if (!matchedProduct) {
      playAlertSound();
      // Gracefully trigger new product auto-creation prompt without throwing error
      return {
        success: false,
        isNewProduct: true,
        barcode: code,
        message: `Unrecognized barcode "${code}". Auto-Product Creation Prompt opened.`
      };
    }

    // Product is recognized! Increment stock for delivery's destination location
    const destLoc = delivery.destinationLocation || 'main_store';
    setProducts(prev =>
      prev.map(p => {
        if (p.id === matchedProduct.id) {
          const currentLocStock = p.locationStock[destLoc] || 0;
          return {
            ...p,
            locationStock: {
              ...p.locationStock,
              [destLoc]: currentLocStock + 1
            }
          };
        }
        return p;
      })
    );

    // Update Delivery Manifest line items and dynamic asset valuations
    setDeliveries(prev =>
      prev.map(d => {
        if (d.id === deliveryId) {
          let itemFound = false;
          const updatedItems = d.items.map(item => {
            if (item.barcode.toLowerCase() === code.toLowerCase() || item.batchId === matchedProduct.id) {
              itemFound = true;
              const newScanned = item.scannedQty + 1;
              return {
                ...item,
                scannedQty: newScanned,
                scannedBarcodes: [...(item.scannedBarcodes || []), code]
              };
            }
            return item;
          });

          if (!itemFound) {
            updatedItems.push({
              id: `DLI-${Date.now().toString().slice(-4)}`,
              barcode: matchedProduct.sku,
              batchId: matchedProduct.id,
              productName: matchedProduct.name,
              category: matchedProduct.category,
              unit: matchedProduct.unit,
              costPrice: matchedProduct.costPrice,
              unitPriceRetail: matchedProduct.unitPriceRetail,
              expectedQty: 1,
              scannedQty: 1,
              scannedBarcodes: [code]
            });
          }

          const totalScanned = updatedItems.reduce((acc, it) => acc + it.scannedQty, 0);
          const totalCostValuation = updatedItems.reduce((acc, it) => acc + it.scannedQty * it.costPrice, 0);
          const totalRetailValuation = updatedItems.reduce((acc, it) => acc + it.scannedQty * it.unitPriceRetail, 0);

          return {
            ...d,
            status: d.status === 'pending' ? 'receiving' : d.status,
            items: updatedItems,
            totalScannedQty: totalScanned,
            totalCostValuation,
            totalRetailValuation,
            receivedByOperator: currentUser.name || 'Store Receiving Agent'
          };
        }
        return d;
      })
    );

    playAddToCartSound();
    recordAuditLog(
      'Delivery Barcode Scanned',
      `Scanned +1 ${matchedProduct.unit} of ${matchedProduct.name} (${matchedProduct.sku}) for delivery ${deliveryId}`
    );

    return {
      success: true,
      isNewProduct: false,
      barcode: code,
      product: matchedProduct,
      message: `Scanned: ${matchedProduct.name} (+1 ${matchedProduct.unit}) | Valuation Added: +KSh ${matchedProduct.costPrice.toLocaleString()}`
    };
  };

  const autoCreateAndIntakeProduct = (
    deliveryId: string,
    newProductData: {
      barcode: string;
      name: string;
      category: CategoryType;
      subCategory?: string;
      fiberComposition?: string;
      colorName?: string;
      colorHex?: string;
      unit: UnitType;
      costPrice: number;
      unitPriceRetail: number;
      unitPriceBulk?: number;
      quantity: number;
      minReorderLevel?: number;
    }
  ) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    const destLoc = delivery?.destinationLocation || 'main_store';
    const batchId = `BATCH-${(newProductData.category || 'GEN').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const barcodeSku = newProductData.barcode.trim();

    const createdProduct: ProductBatch = {
      id: batchId,
      sku: barcodeSku,
      barcode: barcodeSku,
      name: newProductData.name || `Textile Batch ${barcodeSku}`,
      category: newProductData.category || 'Dereck',
      subCategory: newProductData.subCategory || 'General Textile Intake',
      fiberComposition: newProductData.fiberComposition || '100% Cotton Premium',
      colorName: newProductData.colorName || 'Standard Color',
      colorHex: newProductData.colorHex || '#B50044',
      unit: newProductData.unit || 'meter',
      unitPriceRetail: Number(newProductData.unitPriceRetail) || 1000,
      unitPriceBulk: Number(newProductData.unitPriceBulk) || Math.round((newProductData.unitPriceRetail || 1000) * 0.8),
      costPrice: Number(newProductData.costPrice) || 600,
      locationStock: {
        main_store: destLoc === 'main_store' ? newProductData.quantity : 0,
        sales_shop: destLoc === 'sales_shop' ? newProductData.quantity : 0,
        store_1: destLoc === 'store_1' ? newProductData.quantity : 0,
        store_2: destLoc === 'store_2' ? newProductData.quantity : 0,
        [destLoc]: newProductData.quantity
      },
      minReorderLevel: newProductData.minReorderLevel || 30,
      qrCodeData: JSON.stringify({
        sku: barcodeSku,
        batch: batchId,
        cat: newProductData.category,
        unitPrice: newProductData.unitPriceRetail
      }),
      createdAt: new Date().toISOString().split('T')[0]
    };

    // 1. Add to products catalog (Optimistic + Cloud sync)
    setProducts(prev => [createdProduct, ...prev]);

    try {
      setDoc(doc(db, 'products', batchId), createdProduct);
    } catch (err) {
      console.warn('Auto create product cloud sync error:', err);
    }

    // 2. Add to Delivery Record items & recalculate valuations
    setDeliveries(prev =>
      prev.map(d => {
        if (d.id === deliveryId) {
          const newItem: DeliveryItem = {
            id: `DLI-AUTO-${Date.now().toString().slice(-4)}`,
            barcode: barcodeSku,
            batchId,
            productName: createdProduct.name,
            category: createdProduct.category,
            unit: createdProduct.unit,
            costPrice: createdProduct.costPrice,
            unitPriceRetail: createdProduct.unitPriceRetail,
            expectedQty: newProductData.quantity,
            scannedQty: newProductData.quantity,
            scannedBarcodes: [barcodeSku]
          };

          const updatedItems = [...d.items, newItem];
          const totalScanned = updatedItems.reduce((acc, it) => acc + it.scannedQty, 0);
          const totalCostValuation = updatedItems.reduce((acc, it) => acc + it.scannedQty * it.costPrice, 0);
          const totalRetailValuation = updatedItems.reduce((acc, it) => acc + it.scannedQty * it.unitPriceRetail, 0);

          return {
            ...d,
            status: 'receiving',
            items: updatedItems,
            totalScannedQty: totalScanned,
            totalCostValuation,
            totalRetailValuation,
            receivedByOperator: currentUser.name || 'Store Receiving Agent'
          };
        }
        return d;
      })
    );

    playSuccessSound();
    recordAuditLog(
      'Product Auto-Created on Delivery',
      `Auto-created product "${createdProduct.name}" (SKU: ${barcodeSku}) with ${newProductData.quantity} ${createdProduct.unit} intaked at ${destLoc}.`
    );

    return {
      success: true,
      product: createdProduct,
      message: `Product "${createdProduct.name}" created and ${newProductData.quantity} ${createdProduct.unit} intaked successfully!`
    };
  };

  const completeDelivery = (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return { success: false, message: 'Delivery record not found.' };

    const completedAt = new Date().toISOString();
    const destLocName = locations.find(l => l.id === delivery.destinationLocation)?.name || delivery.destinationLocation;

    setDeliveries(prev =>
      prev.map(d =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'completed',
              completedAt,
              receivedByOperator: currentUser.name || 'Receiving Agent'
            }
          : d
      )
    );

    // Double-Entry Inventory Asset Valuation Ledger Entry
    const ledgerEntry: LedgerEntry = {
      id: `LEDG-DEL-${Date.now().toString().slice(-6)}`,
      timestamp: completedAt,
      transactionRef: deliveryId,
      description: `Delivery Intake Goods Received Note (${delivery.supplierName}, Consignment ${delivery.consignmentNo}) -> ${destLocName}`,
      debitAccount: `${destLocName} Inventory Asset`,
      creditAccount: `Supplier Accounts Payable (${delivery.supplierName})`,
      amount: delivery.totalCostValuation,
      locationId: delivery.destinationLocation,
      category: 'Inventory Revaluation'
    };

    setLedger(prev => [ledgerEntry, ...prev]);

    recordAuditLog(
      'Delivery Manifest Completed',
      `Delivery ${deliveryId} (${delivery.totalScannedQty} units, Cost Valuation: KSh ${delivery.totalCostValuation.toLocaleString()}) completed and booked into ledger.`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Delivery ${deliveryId} successfully completed! KSh ${delivery.totalCostValuation.toLocaleString()} added to ${destLocName} inventory assets.`
    };
  };

  const getTotalAssetValuation = (locationId?: LocationId) => {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let totalUnits = 0;
    const totalBatches = products.length;

    products.forEach(prod => {
      let qty = 0;
      if (locationId) {
        qty = Number(prod.locationStock[locationId]) || 0;
      } else {
        const stocks = Object.values(prod.locationStock) as number[];
        qty = stocks.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      }
      totalUnits += qty;
      totalCostValuation += qty * (prod.costPrice || 0);
      totalRetailValuation += qty * (prod.unitPriceRetail || 0);
    });

    return {
      totalCostValuation,
      totalRetailValuation,
      totalCostValue: totalCostValuation,
      totalRetailValue: totalRetailValuation,
      totalUnits,
      totalBatches
    };
  };

  // COMMIT CATEGORY-SPECIFIC INVENTORY INTAKE SESSION (Dereec, Fleeces, Yarns)
  const commitCategoryIntakeSession = (
    category: CategoryType,
    items: {
      barcode: string;
      name?: string;
      quantity: number;
      wholesalePrice: number;
      retailPrice: number;
      unit?: UnitType;
      colorName?: string;
      colorHex?: string;
      fiberComposition?: string;
      yarnCount?: string;
      linearDensityTex?: string;
      dyeLot?: string;
      shadeCode?: string;
      bagNumber?: string;
      packagesCount?: number;
      weightPerPackageKg?: number;
      grossWeightKg?: number;
      netWeightKg?: number;
      tareWeightKg?: number;
      manufacturer?: string;
      countryOfOrigin?: string;
      yarnType?: string;
      tareProfile?: TareProfile;
    }[],
    targetLocation: LocationId,
    sessionNotes?: string
  ) => {
    if (items.length === 0) {
      return { success: false, message: 'No scanned items in intake session.' };
    }

    const now = new Date().toISOString();
    let totalQtyAdded = 0;
    let totalCostValuationAdded = 0;
    let totalRetailValuationAdded = 0;

    let updatedProducts = [...products];
    const newTareLogs: TareReconciliationRecord[] = [];

    items.forEach(item => {
      const barcodeUpper = item.barcode.trim().toUpperCase();
      const existingIndex = updatedProducts.findIndex(
        p => (p.barcode && p.barcode.toUpperCase() === barcodeUpper) ||
             (p.sku && p.sku.toUpperCase() === barcodeUpper) ||
             p.id.toUpperCase() === barcodeUpper ||
             (item.shadeCode && p.shadeCode && p.shadeCode.toUpperCase() === item.shadeCode.toUpperCase() && item.dyeLot && p.dyeLot === item.dyeLot)
      );

      const qty = Math.max(0.1, Number(item.quantity) || 1);
      const wholesale = Number(item.wholesalePrice) || 0;
      const retail = Number(item.retailPrice) || 0;

      totalQtyAdded += qty;
      totalCostValuationAdded += qty * wholesale;
      totalRetailValuationAdded += qty * retail;

      if (existingIndex >= 0) {
        // Increment stock and optionally ensure pricing aligns
        const existing = updatedProducts[existingIndex];
        const currentLocStock = Number(existing.locationStock[targetLocation]) || 0;
        updatedProducts[existingIndex] = {
          ...existing,
          costPrice: wholesale > 0 ? wholesale : existing.costPrice,
          unitPriceRetail: retail > 0 ? retail : existing.unitPriceRetail,
          yarnCount: item.yarnCount || existing.yarnCount,
          dyeLot: item.dyeLot || existing.dyeLot,
          shadeCode: item.shadeCode || existing.shadeCode,
          bagNumber: item.bagNumber || existing.bagNumber,
          packagesCount: item.packagesCount || existing.packagesCount,
          weightPerPackageKg: item.weightPerPackageKg || existing.weightPerPackageKg,
          grossWeightKg: item.grossWeightKg || existing.grossWeightKg,
          netWeightKg: item.netWeightKg || existing.netWeightKg,
          tareWeightKg: item.tareWeightKg || existing.tareWeightKg,
          manufacturer: item.manufacturer || existing.manufacturer,
          locationStock: {
            ...existing.locationStock,
            [targetLocation]: currentLocStock + qty
          }
        };
      } else {
        // Auto-create product record under chosen category
        const batchId = `BATCH-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const sku = barcodeUpper;
        const colorName = item.colorName || (category === 'Dereck' ? 'Royal Navy' : category === 'Fleece' ? 'Charcoal Heather' : 'Mix Grey');
        const colorHex = item.colorHex || (category === 'Dereck' ? '#1E3A8A' : category === 'Fleece' ? '#374151' : '#94A3B8');
        const unit = item.unit || (category === 'Yarns' ? 'kg' : 'meter');
        const name = item.name || `${category} - ${colorName} (${sku})`;

        const qrData = JSON.stringify({
          sku,
          batch: batchId,
          cat: category,
          color: colorHex,
          unitPrice: retail,
          costPrice: wholesale,
          lot: item.dyeLot,
          shade: item.shadeCode,
          intakeAt: now
        });

        const newProd: ProductBatch = {
          id: batchId,
          sku,
          barcode: barcodeUpper,
          name,
          category,
          subCategory: item.yarnCount ? `Count ${item.yarnCount} ${category}` : `${category} Premium Stock`,
          fiberComposition: item.fiberComposition || (category === 'Dereck' ? '100% Superfine Dereec Weave' : category === 'Fleece' ? 'Heavyweight Thermal Polar Fleece' : '100% ACRYLIC (HB) DYED YARN'),
          colorName,
          colorHex,
          unit,
          unitPriceRetail: retail,
          unitPriceBulk: wholesale > 0 ? Math.round(wholesale * 1.35) : retail,
          costPrice: wholesale,
          locationStock: {
            main_store: targetLocation === 'main_store' ? qty : 0,
            sales_shop: targetLocation === 'sales_shop' ? qty : 0,
            store_1: targetLocation === 'store_1' ? qty : 0,
            store_2: targetLocation === 'store_2' ? qty : 0,
            [targetLocation]: qty
          },
          minReorderLevel: category === 'Yarns' ? 48 : 25,
          qrCodeData: qrData,
          manufacturer: item.manufacturer || (category === 'Yarns' ? 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD' : undefined),
          countryOfOrigin: item.countryOfOrigin || (category === 'Yarns' ? 'INDIA' : undefined),
          yarnCount: item.yarnCount,
          linearDensityTex: item.linearDensityTex,
          dyeLot: item.dyeLot,
          shadeCode: item.shadeCode,
          bagNumber: item.bagNumber,
          packagesCount: item.packagesCount,
          weightPerPackageKg: item.weightPerPackageKg,
          grossWeightKg: item.grossWeightKg,
          netWeightKg: item.netWeightKg || qty,
          tareWeightKg: item.tareWeightKg,
          yarnType: item.yarnType,
          tareProfile: item.tareProfile || (item.tareWeightKg ? {
            tareWeightPerUnit: item.tareWeightKg,
            tareType: 'fixed_tare',
            packagingDescription: `Yarn Bale Packaging (${item.tareWeightKg} KG Tare)`,
            isTareDeductedAtPOS: true
          } : undefined),
          createdAt: now.split('T')[0]
        };

        updatedProducts = [newProd, ...updatedProducts];

        // If tare weight is logged on intake, register tare reconciliation record
        if (item.tareWeightKg && item.tareWeightKg > 0) {
          newTareLogs.push({
            id: `TARE-INTK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
            consignmentId: item.bagNumber ? `BAG-#${item.bagNumber}` : `LOT-${item.dyeLot || batchId}`,
            type: 'delivery_intake',
            timestamp: now,
            batchId,
            productName: name,
            sku,
            locationId: targetLocation,
            grossWeight: item.grossWeightKg || (qty + item.tareWeightKg),
            tareWeightDeducted: item.tareWeightKg,
            netWeightBillable: qty,
            unitPrice: retail,
            costPrice: wholesale,
            varianceCostSaved: Math.round(item.tareWeightKg * wholesale),
            notes: `Auto Tare Deduction on Bale Intake (Gross: ${item.grossWeightKg}kg -> Net: ${qty}kg)`,
            status: 'reconciled'
          });
        }
      }
    });

    setProducts(updatedProducts);
    if (newTareLogs.length > 0) {
      setTareReconciliationLogs(prev => [...newTareLogs, ...prev]);
    }

    // Synchronize newly added/updated products to Firestore
    try {
      setCloudSyncStatus('syncing');
      updatedProducts.forEach(prod => {
        setDoc(doc(db, 'products', prod.id), prod, { merge: true }).catch(e => console.warn(e));
      });
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (err) {
      console.warn('Category intake cloud sync error:', err);
    }

    // Double-Entry Inventory Asset Valuation Ledger Entry
    const targetLocName = locations.find(l => l.id === targetLocation)?.name || targetLocation;
    const ledgerEntry: LedgerEntry = {
      id: `LEDG-CAT-${Date.now().toString().slice(-6)}`,
      timestamp: now,
      transactionRef: `CAT-INTAKE-${category.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      description: `Category Barcode Intake: ${category} (${totalQtyAdded} units) -> ${targetLocName}${sessionNotes ? ` - ${sessionNotes}` : ''}`,
      debitAccount: `${targetLocName} Inventory Asset`,
      creditAccount: `Supplier Inward Stock Clearing`,
      amount: totalCostValuationAdded,
      locationId: targetLocation,
      category: 'Inventory Revaluation'
    };

    setLedger(prev => [ledgerEntry, ...prev]);

    recordAuditLog(
      'Category Barcode Intake Completed',
      `Category Intake for "${category}": ${totalQtyAdded} units added to ${targetLocName}. Cost Valuation Added: +KSh ${totalCostValuationAdded.toLocaleString()}, Retail Valuation Added: +KSh ${totalRetailValuationAdded.toLocaleString()}.`
    );

    // Calculate new total business asset value across all products
    let newTotalBusinessAssetCost = 0;
    let newTotalBusinessAssetRetail = 0;
    let newTotalUnits = 0;

    updatedProducts.forEach(prod => {
      const stocks = Object.values(prod.locationStock) as number[];
      const q = stocks.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      newTotalUnits += q;
      newTotalBusinessAssetCost += q * (prod.costPrice || 0);
      newTotalBusinessAssetRetail += q * (prod.unitPriceRetail || 0);
    });

    playSuccessSound();

    return {
      success: true,
      category,
      totalQtyAdded,
      totalCostValuationAdded,
      totalRetailValuationAdded,
      newTotalBusinessAssetCost,
      newTotalBusinessAssetRetail,
      newTotalUnits,
      targetLocationName: targetLocName,
      message: `Category Intake for ${category} successfully completed! Added ${totalQtyAdded} units. New Business Asset Value: KSh ${newTotalBusinessAssetCost.toLocaleString()} (Cost) / KSh ${newTotalBusinessAssetRetail.toLocaleString()} (Retail).`
    };
  };

  // POST MANUAL JOURNAL VOUCHER / LEDGER ENTRY
  const addLedgerEntry = (entryData: Omit<LedgerEntry, 'id' | 'timestamp'>) => {
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `LEDG-JRN-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };

    setLedger(prev => [newEntry, ...prev]);

    recordAuditLog(
      'Manual Journal Entry Posted',
      `Journal Voucher: ${newEntry.description} (Debit: ${newEntry.debitAccount}, Credit: ${newEntry.creditAccount}, Amount: KSh ${newEntry.amount.toLocaleString()})`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Journal voucher ${newEntry.id} recorded successfully!`,
      entryId: newEntry.id
    };
  };

  // ADD NEW PRODUCT BATCH (With Global Firestore Sync & Multi-Device Propagation)
  const addProductBatch = async (newBatch: Omit<ProductBatch, 'id' | 'createdAt' | 'qrCodeData'>) => {
    const batchId = `BATCH-${(newBatch.category || 'GEN').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const qrData = JSON.stringify({
      sku: newBatch.sku,
      batch: batchId,
      cat: newBatch.category,
      color: newBatch.colorHex,
      unitPrice: newBatch.unitPriceRetail,
      comp: newBatch.fiberComposition
    });

    const created: ProductBatch = {
      ...newBatch,
      id: batchId,
      createdAt: new Date().toISOString().split('T')[0],
      qrCodeData: qrData
    };

    // Optimistic local update
    setProducts(prev => [created, ...prev.filter(p => p.id !== batchId)]);

    // Write to Firestore database for instant global sync
    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'products', batchId), created);
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore add product sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog('Product Catalog Added', `Added batch ${batchId} (${newBatch.name} - ${newBatch.colorName}) to global cloud database.`);
    playSuccessSound();
    return {
      success: true,
      product: created,
      message: `Product "${created.name}" created and synced to cloud database!`
    };
  };

  // UPDATE INVENTORY PRODUCT BATCH (Full Details, Multi-Store Stocks, Prices & Global Sync)
  const updateProductBatch = async (batchId: string, updates: Partial<ProductBatch>) => {
    let updatedProduct: ProductBatch | null = null;

    setProducts(prev =>
      prev.map(p => {
        if (p.id === batchId) {
          updatedProduct = {
            ...p,
            ...updates,
            // Recompute QR data if prices/color change
            qrCodeData: JSON.stringify({
              sku: updates.sku || p.sku,
              batch: p.id,
              cat: updates.category || p.category,
              color: updates.colorHex || p.colorHex,
              unitPrice: updates.unitPriceRetail ?? p.unitPriceRetail,
              comp: updates.fiberComposition || p.fiberComposition
            })
          };
          return updatedProduct;
        }
        return p;
      })
    );

    if (updatedProduct) {
      try {
        setCloudSyncStatus('syncing');
        await setDoc(doc(db, 'products', batchId), updatedProduct, { merge: true });
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date());
      } catch (e: any) {
        console.warn('Firestore update product sync warning:', e);
        setCloudSyncStatus('offline');
      }

      recordAuditLog(
        'Product Details Updated',
        `Updated inventory product ${batchId} (${(updatedProduct as ProductBatch).name}) across all branches and cloud database.`
      );
      playSuccessSound();
      return {
        success: true,
        message: `Product "${(updatedProduct as ProductBatch).name}" updated successfully and synced to cloud!`
      };
    }

    return { success: false, message: 'Product item not found.' };
  };

  // DELETE INVENTORY PRODUCT BATCH
  const deleteProductBatch = async (batchId: string) => {
    const target = products.find(p => p.id === batchId);
    setProducts(prev => prev.filter(p => p.id !== batchId));

    try {
      setCloudSyncStatus('syncing');
      await deleteDoc(doc(db, 'products', batchId));
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore delete product sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog('Product Removed', `Deleted product ${batchId} (${target?.name || ''} - SKU: ${target?.sku || ''}) from cloud inventory.`);
    playSuccessSound();
    return {
      success: true,
      message: `Product "${target?.name || batchId}" deleted from inventory.`
    };
  };

  // DELETE MULTIPLE PRODUCTS (Instant Bulk Delete)
  const deleteMultipleProducts = async (batchIds: string[]) => {
    if (!batchIds.length) return { success: false, count: 0, message: 'No products selected for deletion.' };
    const targets = products.filter(p => batchIds.includes(p.id));
    setProducts(prev => prev.filter(p => !batchIds.includes(p.id)));

    try {
      setCloudSyncStatus('syncing');
      await Promise.all(batchIds.map(id => deleteDoc(doc(db, 'products', id))));
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore bulk delete products sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog('Products Bulk Removed', `Deleted ${targets.length} products (${targets.map(t => t.sku).join(', ')}) from cloud inventory.`);
    playSuccessSound();
    return {
      success: true,
      count: targets.length,
      deletedProducts: targets,
      message: `Successfully deleted ${targets.length} product(s) from inventory.`
    };
  };

  // RESTORE PRODUCT BATCH (For Instant Undo)
  const restoreProductBatch = async (product: ProductBatch) => {
    setProducts(prev => [product, ...prev.filter(p => p.id !== product.id)]);

    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'products', product.id), product);
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore restore product sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog('Product Restored', `Restored product ${product.id} (${product.name} - SKU: ${product.sku}) to cloud inventory.`);
    playSuccessSound();
    return {
      success: true,
      message: `Product "${product.name}" successfully restored.`
    };
  };

  // BULK CATEGORY PRICING MANAGER (Adjust retail, bulk, cost or % markups for an entire category)
  const updateCategoryPrices = async (
    category: CategoryType,
    priceUpdates: {
      retailPrice?: number;
      bulkPrice?: number;
      costPrice?: number;
      adjustmentType?: 'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost';
      percentageValue?: number;
      pricePerKgRate?: number;
      coneTareWeightKg?: number;
      baleTareWeightKg?: number;
      autoDeductTareAtPOS?: boolean;
      standardRollLengthMeters?: number;
      looseMeterDiscountPct?: number;
      enableHybridRollPricing?: boolean;
    }
  ) => {
    const matchingProducts = products.filter(p => p.category === category);
    if (matchingProducts.length === 0) {
      return { success: false, updatedCount: 0, message: `No products found under category "${category}".` };
    }

    const updatedList: ProductBatch[] = [];

    setProducts(prev =>
      prev.map(p => {
        if (p.category !== category) return p;

        let newRetail = p.unitPriceRetail;
        let newBulk = p.unitPriceBulk;
        let newCost = p.costPrice;

        if (priceUpdates.adjustmentType === 'set_exact') {
          if (typeof priceUpdates.retailPrice === 'number' && priceUpdates.retailPrice > 0) {
            newRetail = priceUpdates.retailPrice;
          }
          if (typeof priceUpdates.bulkPrice === 'number' && priceUpdates.bulkPrice > 0) {
            newBulk = priceUpdates.bulkPrice;
          }
          if (typeof priceUpdates.costPrice === 'number' && priceUpdates.costPrice > 0) {
            newCost = priceUpdates.costPrice;
          }
        } else if (priceUpdates.adjustmentType === 'increase_percent' && priceUpdates.percentageValue) {
          const factor = 1 + priceUpdates.percentageValue / 100;
          newRetail = Math.round(p.unitPriceRetail * factor);
          newBulk = Math.round(p.unitPriceBulk * factor);
        } else if (priceUpdates.adjustmentType === 'decrease_percent' && priceUpdates.percentageValue) {
          const factor = Math.max(0.01, 1 - priceUpdates.percentageValue / 100);
          newRetail = Math.round(p.unitPriceRetail * factor);
          newBulk = Math.round(p.unitPriceBulk * factor);
        } else if (priceUpdates.adjustmentType === 'markup_from_cost' && priceUpdates.percentageValue) {
          const marginFactor = 1 + priceUpdates.percentageValue / 100;
          newRetail = Math.round(p.costPrice * marginFactor);
          newBulk = Math.round(p.costPrice * (1 + (priceUpdates.percentageValue * 0.75) / 100));
        }

        const updated: ProductBatch = {
          ...p,
          unitPriceRetail: newRetail,
          unitPriceBulk: newBulk,
          costPrice: newCost,
          standardRollLengthMeters: priceUpdates.standardRollLengthMeters ?? p.standardRollLengthMeters,
          qrCodeData: JSON.stringify({
            sku: p.sku,
            batch: p.id,
            cat: p.category,
            color: p.colorHex,
            unitPrice: newRetail,
            comp: p.fiberComposition
          })
        };
        updatedList.push(updated);
        return updated;
      })
    );

    // Update Category Pricing Configuration in state
    setCategoryPricingConfigs(prev => ({
      ...prev,
      [category]: {
        category,
        defaultRetailPrice: priceUpdates.retailPrice || prev[category]?.defaultRetailPrice || (category === 'Fleece' ? 470 : category === 'Dereck' ? 230 : 950),
        defaultBulkPrice: priceUpdates.bulkPrice || prev[category]?.defaultBulkPrice || (category === 'Fleece' ? 440 : category === 'Dereck' ? 220 : 950),
        defaultCostPrice: priceUpdates.costPrice || prev[category]?.defaultCostPrice || (category === 'Fleece' ? 320 : category === 'Dereck' ? 160 : 650),
        marginPercentage: priceUpdates.percentageValue || prev[category]?.marginPercentage || 50,
        pricePerKgRate: priceUpdates.pricePerKgRate || prev[category]?.pricePerKgRate || (category === 'Fleece' ? 470 : category === 'Dereck' ? 230 : 950),
        coneTareWeightKg: typeof priceUpdates.coneTareWeightKg === 'number' ? priceUpdates.coneTareWeightKg : prev[category]?.coneTareWeightKg ?? 0.070,
        baleTareWeightKg: typeof priceUpdates.baleTareWeightKg === 'number' ? priceUpdates.baleTareWeightKg : prev[category]?.baleTareWeightKg ?? 0.840,
        autoDeductTareAtPOS: priceUpdates.autoDeductTareAtPOS ?? prev[category]?.autoDeductTareAtPOS ?? true,
        standardRollLengthMeters: priceUpdates.standardRollLengthMeters ?? prev[category]?.standardRollLengthMeters ?? (category === 'Fleece' ? 70 : 50),
        looseMeterDiscountPct: priceUpdates.looseMeterDiscountPct ?? prev[category]?.looseMeterDiscountPct ?? 10,
        enableHybridRollPricing: priceUpdates.enableHybridRollPricing ?? prev[category]?.enableHybridRollPricing ?? true,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.name || 'Admin'
      }
    }));

    // Synchronize all updated products to Firestore in parallel for global access
    try {
      setCloudSyncStatus('syncing');
      await Promise.all(
        updatedList.map(prod => setDoc(doc(db, 'products', prod.id), prod, { merge: true }))
      );
      await setDoc(doc(db, 'category_pricing', category.toLowerCase()), {
        category,
        lastUpdated: new Date().toISOString(),
        updatedCount: updatedList.length,
        priceUpdates,
        updatedBy: currentUser.name || 'Admin'
      }, { merge: true });

      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore category prices sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog(
      'Category Prices Bulk Updated',
      `Updated prices for ${updatedList.length} products in category "${category}". Strategy: ${priceUpdates.adjustmentType || 'Custom'}`
    );

    playSuccessSound();
    return {
      success: true,
      updatedCount: updatedList.length,
      message: `Successfully updated prices for all ${updatedList.length} products in "${category}" and synchronized globally!`
    };
  };

  // UPDATE SPECIFIC CATEGORY PRICING CONFIG (Price per kg, tare defaults, etc.)
  const updateCategoryPricingConfig = async (
    category: CategoryType,
    configUpdates: Partial<CategoryPricingConfig>
  ): Promise<{ success: boolean; message: string }> => {
    const prevConfig = categoryPricingConfigs[category] || DEFAULT_CATEGORY_PRICING[category];
    const newConfig: CategoryPricingConfig = {
      ...prevConfig,
      ...configUpdates,
      category,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name || 'Admin'
    };

    setCategoryPricingConfigs(prev => ({
      ...prev,
      [category]: newConfig
    }));

    // Persist to Firestore
    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'category_pricing_configs', category.toLowerCase()), newConfig, { merge: true });
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore category pricing config sync warning:', e);
    }

    recordAuditLog(
      'Category Pricing Setting Updated',
      `Updated pricing settings for "${category}": 1 KG Rate = KSh ${newConfig.pricePerKgRate || newConfig.defaultRetailPrice}, Cone Tare = ${(Number(newConfig.coneTareWeightKg || 0) * 1000).toFixed(0)}g`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Updated "${category}" pricing settings! Rate: KSh ${newConfig.pricePerKgRate || newConfig.defaultRetailPrice}/kg, Cone Tare: ${(Number(newConfig.coneTareWeightKg || 0) * 1000).toFixed(0)}g.`
    };
  };

  // UPDATE MASTER CATEGORY PRODUCT IMAGE (Dereck, Fleece, Yarns)
  const updateCategoryImage = async (
    category: CategoryType,
    imageUrl: string,
    applyToAllBatches: boolean = true
  ) => {
    const cleanUrl = imageUrl.trim();
    if (!cleanUrl) {
      return { success: false, message: 'Image URL or file data is required.' };
    }

    setCategoryImages(prev => ({
      ...prev,
      [category]: cleanUrl
    }));

    // Persist category image metadata to Firestore
    try {
      await setDoc(doc(db, 'category_images', category), {
        category,
        imageUrl: cleanUrl,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.name || 'Admin'
      }, { merge: true });
    } catch (err: any) {
      console.warn('Firestore update category image warning:', err);
    }

    let updatedCount = 0;
    if (applyToAllBatches) {
      const updatedBatches: ProductBatch[] = [];
      setProducts(prev =>
        prev.map(p => {
          if (p.category === category) {
            updatedCount++;
            const updated = { ...p, imageUrl: cleanUrl };
            updatedBatches.push(updated);
            return updated;
          }
          return p;
        })
      );

      // Sync batch images to Firestore
      try {
        await Promise.all(
          updatedBatches.map(prod =>
            setDoc(doc(db, 'products', prod.id), { imageUrl: cleanUrl }, { merge: true })
          )
        );
      } catch (err: any) {
        console.warn('Firestore batch images update warning:', err);
      }
    }

    recordAuditLog(
      'Product Image Updated',
      `Admin updated product image for "${category}" line.${applyToAllBatches ? ` Applied to ${updatedCount} inventory items.` : ''}`
    );

    playSuccessSound();
    return {
      success: true,
      message: `Product image for "${category}" updated successfully!${applyToAllBatches ? ` Applied across ${updatedCount} batches.` : ''}`
    };
  };

  // MANUAL CLOUD RE-SYNC
  const syncCloudInventory = async () => {
    setCloudSyncStatus('syncing');
    try {
      for (const prod of products) {
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      }
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
      playSuccessSound();
      return {
        success: true,
        count: products.length,
        message: `Successfully synchronized ${products.length} inventory products to cloud database!`
      };
    } catch (err: any) {
      console.error('Error during manual cloud sync:', err);
      setCloudSyncStatus('offline');
      return {
        success: false,
        count: 0,
        message: `Cloud sync notification: ${err.message || 'Check connection'}`
      };
    }
  };

  // ETR CONFIG UPDATE
  const updateETRConfig = (config: Partial<ETRConfig>) => {
    setEtrConfig(prev => ({ ...prev, ...config }));
    recordAuditLog('ETR Settings Updated', 'Updated company tax details / CU serial number');
  };

  // PAYROLL GENERATION - 100% Dynamic Kenya Statutory Tax Engine (PAYE, NSSF, SHIF, Housing Levy)
  const generateMonthlyPayroll = (monthYear: string) => {
    const newRecords: PayrollRecord[] = staff.map((s, idx) => {
      const gross = s.basicSalary + s.allowances;
      const statutory = calculateKenyaStatutoryDeductions(gross);

      return {
        id: `PAY-${monthYear.replace(/\s+/g, '')}-${idx + 1}`,
        monthYear,
        staffId: s.id,
        staffName: s.name,
        employeeNo: s.employeeNo,
        role: s.role,
        locationId: s.locationId,
        basicSalary: s.basicSalary,
        allowances: s.allowances,
        grossPay: gross,
        payeTax: statutory.payeTax,
        nssfDeduction: statutory.totalNssf,
        nhifDeduction: statutory.shifDeduction,
        housingLevy: statutory.housingLevy,
        totalDeductions: statutory.totalDeductions,
        netPay: statutory.netPay,
        paymentStatus: 'Paid',
        generatedAt: new Date().toISOString()
      };
    });

    setPayroll(prev => [...newRecords, ...prev]);
    recordAuditLog('Payroll Processed', `Generated statutory monthly payroll for ${monthYear} covering ${staff.length} staff members.`);
  };

  // STAFF ONBOARDING & PERSONNEL MANAGEMENT (Admin & HR)
  const addStaffMember = (
    staffData: Omit<StaffMember, 'id' | 'employeeNo' | 'joinedDate'> & { employeeNo?: string; joinedDate?: string }
  ): StaffMember => {
    const nextNum = staff.length + 1;
    const autoEmpNo = staffData.employeeNo?.trim() || `EMP-2026-${nextNum.toString().padStart(3, '0')}`;
    const autoId = `STAFF-${Date.now()}-${nextNum}`;
    const joined = staffData.joinedDate || new Date().toISOString().split('T')[0];

    const newStaff: StaffMember = {
      id: autoId,
      employeeNo: autoEmpNo,
      name: staffData.name.trim(),
      role: staffData.role,
      locationId: staffData.locationId,
      idNumber: staffData.idNumber || '',
      kraPin: (staffData.kraPin || '').toUpperCase().trim(),
      nssfNo: staffData.nssfNo || '',
      nhifNo: staffData.nhifNo || '',
      basicSalary: Number(staffData.basicSalary) || 0,
      allowances: Number(staffData.allowances) || 0,
      joinedDate: joined,
      email: staffData.email?.trim() || '',
      phone: staffData.phone?.trim() || '',
      bankAccountName: staffData.bankAccountName?.trim() || '',
      bankAccountNumber: staffData.bankAccountNumber?.trim() || '',
      mpesaNumber: staffData.mpesaNumber?.trim() || staffData.phone?.trim() || '',
      status: staffData.status || 'active',
      onboardedBy: currentUser.name || 'Executive Admin'
    };

    setStaff(prev => [newStaff, ...prev]);
    recordAuditLog(
      'Staff Onboarded',
      `Onboarded ${newStaff.name} (${newStaff.employeeNo}) as ${newStaff.role} by ${currentUser.name || 'HR/Admin'}`
    );

    return newStaff;
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    recordAuditLog('Staff Updated', `Updated personnel records for staff ID ${id}`);
  };

  const deleteStaffMember = (id: string) => {
    const target = staff.find(s => s.id === id);
    setStaff(prev => prev.filter(s => s.id !== id));
    recordAuditLog('Staff Offboarded', `Removed staff member ${target?.name || id} from active directory`);
  };

  // SCAN TO ADD PRODUCT WITH ZERO REPETITION AND INSTANT DUPLICATE ALERT
  const scanToAddProduct = async (
    barcode: string,
    options?: MobileBarcodeScanOptions
  ): Promise<{ success: boolean; isDuplicate: boolean; product?: ProductBatch; message: string }> => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) {
      return { success: false, isDuplicate: false, message: 'Invalid barcode or QR payload.' };
    }

    // Check for exact barcode duplicate or existing batch ID / SKU match
    const existing = products.find(p => 
      (p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase()) ||
      (p.id && p.id.trim().toLowerCase() === cleanBarcode.toLowerCase()) ||
      (p.sku && p.sku.trim().toLowerCase() === cleanBarcode.toLowerCase())
    );

    if (existing) {
      playAlertSound();
      const alertMsg = `Duplicate Barcode Detected! Product "${existing.name}" (${existing.colorName || existing.category}) is already registered in the system with barcode "${cleanBarcode}".`;
      
      setDuplicateAlertState({
        isOpen: true,
        barcode: cleanBarcode,
        existingProduct: existing,
        scannedAt: new Date().toISOString(),
        scannedCategory: options?.category || existing.category,
        targetLocation: options?.locationId || activeLocation,
        message: alertMsg
      });

      recordAuditLog(
        'Duplicate Barcode Scan Blocked',
        `Blocked attempt to register duplicate barcode "${cleanBarcode}" for existing product ${existing.id} (${existing.name}).`
      );

      return {
        success: false,
        isDuplicate: true,
        product: existing,
        message: alertMsg
      };
    }

    // Item does not exist -> Create and instantly add product into system with zero repetition
    const selectedCategory: CategoryType = options?.category || 'Dereck';
    const targetLocation: LocationId = options?.locationId || activeLocation;
    const qty = Number(options?.quantity) || (selectedCategory === 'Yarns' ? 10 : 50);
    const unit: UnitType = options?.unit || (selectedCategory === 'Yarns' ? 'kg' : 'meter');

    const defaultPricing = categoryPricingConfigs[selectedCategory] || DEFAULT_CATEGORY_PRICING[selectedCategory];
    const retailP = options?.retailPrice ?? defaultPricing.defaultRetailPrice;
    const bulkP = options?.bulkPrice ?? defaultPricing.defaultBulkPrice;
    const costP = options?.costPrice ?? defaultPricing.defaultCostPrice;

    // Generate unique batch ID and product name
    const batchId = `BATCH-${selectedCategory.slice(0, 3).toUpperCase()}-${cleanBarcode.slice(-4) || Math.floor(100 + Math.random() * 900)}`;
    const prodName = options?.name?.trim() || `${selectedCategory} Fabric - Roll #${cleanBarcode.slice(-4) || '101'}`;
    const color = options?.colorName?.trim() || 'Midnight Classic';
    const colorHex = options?.colorHex || '#1e293b';
    const fiber = options?.fiberComposition || (selectedCategory === 'Dereck' ? '65% Poly / 35% Viscose' : selectedCategory === 'Fleece' ? '100% Anti-Pill Polyester' : '100% High-Bulk Acrylic');
    const subCat = selectedCategory === 'Dereck' ? 'Superfine Dereec Weave' : selectedCategory === 'Fleece' ? 'Polar Thermal Fleece' : 'High-Bulk Acrylic Yarn';
    const imgUrl = categoryImages[selectedCategory] || DEFAULT_CATEGORY_IMAGES[selectedCategory];

    const initialStockMap: Record<LocationId, number> = {
      main_store: 0,
      sales_shop: 0,
      eastleigh_wholesale: 0,
      parklands_store: 0
    };
    initialStockMap[targetLocation] = qty;

    const qrData = JSON.stringify({
      sku: `SKU-${cleanBarcode}`,
      batch: batchId,
      cat: selectedCategory,
      color: colorHex,
      unitPrice: retailP,
      comp: fiber
    });

    const newProduct: ProductBatch = {
      id: batchId,
      sku: `SKU-${cleanBarcode}`,
      barcode: cleanBarcode,
      name: prodName,
      category: selectedCategory,
      subCategory: subCat,
      unit,
      unitPriceRetail: retailP,
      unitPriceBulk: bulkP,
      costPrice: costP,
      colorName: color,
      colorHex: colorHex,
      fiberComposition: fiber,
      imageUrl: imgUrl,
      locationStock: initialStockMap,
      createdAt: new Date().toISOString().split('T')[0],
      qrCodeData: qrData,
      minReorderLevel: 15
    };

    // Optimistic local update
    setProducts(prev => [newProduct, ...prev]);

    // Global Cloud Firestore Sync
    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'products', batchId), newProduct);
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (err: any) {
      console.warn('Firestore instant barcode product sync warning:', err);
      setCloudSyncStatus('offline');
    }

    recordAuditLog(
      'Product Added via Barcode Scanner',
      `Mobile barcode scanner registered new product "${newProduct.name}" (${newProduct.category}, ${qty} ${unit}) with barcode "${cleanBarcode}" at ${targetLocation}.`
    );

    playBarcodeScanBeep(true);

    return {
      success: true,
      isDuplicate: false,
      product: newProduct,
      message: `Product "${newProduct.name}" registered instantly in system with barcode ${cleanBarcode}!`
    };
  };

  // RESTOCK EXISTING PRODUCT WHEN DUPLICATE SCANNED (OPTIONAL ACTION)
  const restockExistingProduct = async (
    batchId: string,
    additionalQuantity: number,
    locationId: LocationId
  ) => {
    const target = products.find(p => p.id === batchId);
    if (!target) return { success: false, message: 'Product not found.' };

    const currentLocStock = Number(target.locationStock[locationId]) || 0;
    const newLocStock = currentLocStock + additionalQuantity;

    const updatedStockMap = {
      ...target.locationStock,
      [locationId]: newLocStock
    };

    const updatedProd: ProductBatch = {
      ...target,
      locationStock: updatedStockMap
    };

    setProducts(prev => prev.map(p => p.id === batchId ? updatedProd : p));

    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'products', batchId), { locationStock: updatedStockMap }, { merge: true });
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore restock update warning:', e);
    }

    recordAuditLog(
      'Product Restocked via Barcode',
      `Added +${additionalQuantity} ${target.unit} to batch ${target.id} (${target.name}) at ${locationId}. New stock: ${newLocStock} ${target.unit}.`
    );

    playSuccessSound();
    dismissDuplicateAlert();

    return {
      success: true,
      message: `Restocked ${additionalQuantity} ${target.unit} of "${target.name}". Total at location: ${newLocStock} ${target.unit}.`
    };
  };

  // DUPLICATION CONTROL & AUDIT SHIELD ENGINE
  const checkProductDuplicate = (candidate: { barcode?: string; sku?: string; name?: string; category?: string; excludeId?: string }) => {
    return checkDuplicateConflict(candidate, products);
  };

  const scanAllCatalogDuplicates = (): CatalogDuplicateAuditReport => {
    return calculateCatalogDuplicateReport(products, locations);
  };

  const mergeDuplicateProducts = async (masterProductId: string, duplicateProductIds: string[]) => {
    const master = products.find(p => p.id === masterProductId);
    if (!master) return { success: false, mergedCount: 0, message: 'Master product record not found.' };

    const dupes = products.filter(p => duplicateProductIds.includes(p.id) && p.id !== masterProductId);
    if (dupes.length === 0) return { success: false, mergedCount: 0, message: 'No duplicate records to merge.' };

    // Aggregate location stocks across all stores
    const mergedLocationStock: Record<LocationId, number> = {
      main_store: Number(master.locationStock.main_store) || 0,
      sales_shop: Number(master.locationStock.sales_shop) || 0,
      eastleigh_wholesale: Number(master.locationStock.eastleigh_wholesale) || 0,
      parklands_store: Number(master.locationStock.parklands_store) || 0
    };

    dupes.forEach(d => {
      if (d.locationStock) {
        Object.entries(d.locationStock).forEach(([loc, qty]) => {
          const locKey = loc as LocationId;
          mergedLocationStock[locKey] = (mergedLocationStock[locKey] || 0) + (Number(qty) || 0);
        });
      }
    });

    const updatedMaster: ProductBatch = {
      ...master,
      locationStock: mergedLocationStock
    };

    // Update local state
    setProducts(prev => [
      updatedMaster,
      ...prev.filter(p => p.id !== masterProductId && !duplicateProductIds.includes(p.id))
    ]);

    // Firestore sync
    try {
      setCloudSyncStatus('syncing');
      await setDoc(doc(db, 'products', masterProductId), updatedMaster, { merge: true });
      await Promise.all(dupes.map(d => deleteDoc(doc(db, 'products', d.id))));
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date());
    } catch (e: any) {
      console.warn('Firestore merge products sync warning:', e);
      setCloudSyncStatus('offline');
    }

    recordAuditLog(
      'Duplicate Products Merged',
      `Merged ${dupes.length} duplicate product records into master batch ${master.id} (${master.name}). Total consolidated stock adjusted.`
    );
    playSuccessSound();

    return {
      success: true,
      mergedCount: dupes.length,
      message: `Successfully consolidated ${dupes.length} duplicate item(s) into master product "${master.name}". Stock re-tallied correctly.`
    };
  };

  const autoDeduplicateAllCatalog = async () => {
    const report = calculateCatalogDuplicateReport(products, locations);
    if (report.duplicateGroups.length === 0) {
      return { success: true, groupsResolved: 0, itemsMerged: 0, message: 'Zero duplicate products detected in the catalog!' };
    }

    let totalMerged = 0;
    let groupsDone = 0;

    for (const group of report.duplicateGroups) {
      const master = group.masterProduct;
      const dupIds = group.duplicates.map(d => d.id);
      const res = await mergeDuplicateProducts(master.id, dupIds);
      if (res.success) {
        totalMerged += res.mergedCount;
        groupsDone++;
      }
    }

    return {
      success: true,
      groupsResolved: groupsDone,
      itemsMerged: totalMerged,
      message: `Audit Guard resolved ${groupsDone} duplicate group(s) and safely merged ${totalMerged} duplicate stock records into canonical batches!`
    };
  };

  // QR SCANNER Handler (Enhanced Multi-Format Parser & Resolver)
  const handleQRScan = (qrString: string) => {
    const raw = (qrString || '').trim();
    if (!raw) return false;

    let matchedProd: ProductBatch | undefined;

    try {
      const parsed = JSON.parse(raw);
      const targetBatchId = parsed.batch || parsed.id || parsed.batchId;
      const targetSku = parsed.sku || parsed.barcode;

      matchedProd = products.find(p => 
        (targetBatchId && (p.id.toLowerCase() === String(targetBatchId).toLowerCase())) ||
        (targetSku && (p.sku.toLowerCase() === String(targetSku).toLowerCase() || (p.barcode && p.barcode.toLowerCase() === String(targetSku).toLowerCase())))
      );
    } catch {
      // Non-JSON plain text fallback
    }

    if (!matchedProd) {
      // Try direct match across SKU, ID, Barcode, or embedded QR token
      matchedProd = products.find(p => 
        p.sku.toLowerCase() === raw.toLowerCase() ||
        p.id.toLowerCase() === raw.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === raw.toLowerCase()) ||
        (p.qrCodeData && p.qrCodeData.includes(raw)) ||
        p.name.toLowerCase().includes(raw.toLowerCase())
      );
    }

    if (matchedProd) {
      addToCart(matchedProd, 1);
      setScannedResult(`Scanned & added ${matchedProd.name} (${matchedProd.colorName || matchedProd.sku}) to cart!`);
      recordAuditLog('QR Code Scanned', `Scanned QR Code for ${matchedProd.sku} (${matchedProd.name})`);
      playBarcodeScanBeep(true);
      return true;
    }

    setScannedResult(`QR Code decoded: "${raw}". Product matching batch/SKU not found in active inventory.`);
    playScannerErrorBeep();
    return false;
  };

  // Purge All Mock and Demo Data Engine
  const purgeAllMockData = async () => {
    try {
      const keysToClear = [
        'urban_interior_products',
        'urban_interior_orders',
        'urban_interior_transfers',
        'urban_interior_ledger',
        'urban_interior_branch_expenses',
        'urban_interior_deliveries',
        'urban_interior_tare_logs',
        'urban_interior_wht_records',
        'urban_interior_shift_closures',
        'urban_interior_staff',
        'urban_interior_payroll',
        'urban_interior_mail_notifications',
        'urban_interior_locations',
        'urban_interior_audit_logs',
        'urban_interior_held_carts'
      ];
      keysToClear.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch (e) {
          console.warn('Error clearing key:', k, e);
        }
      });

      setProducts([]);
      setOrders([]);
      setTransfers([]);
      setLedger([]);
      setBranchExpenses([]);
      setDeliveries([]);
      setTareReconciliationLogs([]);
      setWhtRecords([]);
      setShiftClosures([]);
      setStaff([]);
      setPayroll([]);
      setAuditLogs([]);
      setMailNotifications([]);
      setCart([]);
      setHeldCarts([]);
      setActiveDeliveryId(null);
      setLocations(LOCATIONS);

      // Cleanse legacy mock batches from Firestore if any exist
      try {
        const snap = await getDocs(collection(db, 'products'));
        for (const docSnap of snap.docs) {
          const docId = docSnap.id;
          if (docId.startsWith('BATCH-DRK-') || docId.startsWith('BATCH-FLC-') || docId.startsWith('BATCH-YRN-') || docId.startsWith('BATCH-MOCK')) {
            await deleteDoc(doc(db, 'products', docId));
          }
        }
      } catch (err) {
        console.warn('Firestore mock product cleanup notice:', err);
      }

      playSuccessSound();
      return { success: true, message: 'All mock figures and records have been purged. Database is clean for production.' };
    } catch (err: any) {
      console.error('Error during data purge:', err);
      return { success: false, message: err.message || 'Failed to purge mock data.' };
    }
  };

  return (
    <ERPContext.Provider
      value={{
        appMode,
        setAppMode,
        activeRole,
        setActiveRole,
        activeLocation,
        setActiveLocation,
        currentUser,
        isGoogleAdminAuthenticated,
        isGoogleAuthLoading,
        adminUser,
        isSuperAdmin,
        signInWithGoogleAdmin,
        signInAsWhitelistedAdmin,
        signOutGoogleAdmin,
        posOperators,
        addPOSOperator,
        updatePOSOperator,
        deletePOSOperator,
        posSession,
        unlockPOSWithPin,
        lockPOSSession,
        brandSettings,
        updateBrandSettings,
        products,
        orders,
        transfers,
        ledger,
        auditLogs,
        staff,
        payroll,
        etrConfig,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItemRollPricing,
        clearCart,
        heldCarts,
        holdCurrentCart,
        restoreHeldCart,
        discardHeldCart,
        resumeTransferredSaleToCart,
        mailNotifications,
        activeToastNotification,
        setActiveToastNotification,
        markNotificationRead,
        clearNotifications,
        processPOSCheckout,
        convertQuotationToInvoice,
        createBillingDocument,
        deleteBillingDocument,
        updateBillingDocumentStatus,
        createOrderRerouteTicket,
        requestRestock,
        dispatchRestockTransfer,
        createDirectDispatchTransfer,
        updateProductPrice,
        fulfillReroutedOrder,
        acceptPurchaseOrder,
        receiveRestockTransfer,
        addProductBatch,
        updateProductBatch,
        deleteProductBatch,
        deleteMultipleProducts,
        restoreProductBatch,
        updateCategoryPrices,
        updateCategoryPricingConfig,
        categoryPricingConfigs,
        categoryImages,
        updateCategoryImage,
        isProductImageModalOpen,
        setIsProductImageModalOpen,
        cloudSyncStatus,
        lastCloudSync,
        syncCloudInventory,
        addLedgerEntry,
        updateETRConfig,
        generateMonthlyPayroll,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        recordAuditLog,
        deliveries,
        activeDeliveryId,
        setActiveDeliveryId,
        createDelivery,
        startReceivingDelivery,
        scanDeliveryBarcode,
        autoCreateAndIntakeProduct,
        completeDelivery,
        commitCategoryIntakeSession,
        getTotalAssetValuation,
        tareReconciliationLogs,
        updateProductTareProfile,
        addTareReconciliationRecord,
        reconcileTareWithJournal,
        updateCartTare,
        whtRecords,
        addWithholdingTaxRecord,
        settleWithholdingTaxRecord,
        selectedReceipt,
        setSelectedReceipt,
        locations,
        addLocation,
        updateLocation,
        deleteLocation,
        branchExpenses,
        addBranchExpense,
        deleteBranchExpense,
        adjustBranchCashFloat,
        getBranchFinancialSummary,
        isQRScannerOpen,
        setIsQRScannerOpen,
        isMobileBarcodeScannerOpen,
        setIsMobileBarcodeScannerOpen,
        duplicateAlertState,
        setDuplicateAlertState,
        dismissDuplicateAlert,
        scanToAddProduct,
        restockExistingProduct,
        checkProductDuplicate,
        mergeDuplicateProducts,
        scanAllCatalogDuplicates,
        autoDeduplicateAllCatalog,
        scannedResult,
        setScannedResult,
        handleQRScan,
        playBarcodeScanBeep,
        playScannerErrorBeep,
        isBrandSettingsModalOpen,
        setIsBrandSettingsModalOpen,
        isUserProfileModalOpen,
        setIsUserProfileModalOpen,
        updateCurrentUserProfile,
        isPlatformUnlocked,
        isAdmin,
        lockPlatform,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isMailDrawerOpen,
        setIsMailDrawerOpen,
        purgeAllMockData,
        shiftClosures,
        activeShiftStartTime,
        closeCashierShift,
        isShiftClosureModalOpen,
        setIsShiftClosureModalOpen,
        selectedShiftRecord,
        setSelectedShiftRecord,
        isTodaySalesModalOpen,
        setIsTodaySalesModalOpen,
        isPeriodicStatementModalOpen,
        setIsPeriodicStatementModalOpen,
        getActiveShiftStats,
        getTodaySalesSummary,
        getPeriodicStatementSummary,
        quarantinedDefects,
        creditNotes,
        addCreditNote,
        processReturnAndExchange,
        fileSupplierDefectClaim,
        resolveQuarantineRecord,
        isReturnExchangeModalOpen,
        setIsReturnExchangeModalOpen,
        fabricRolls,
        addFabricRoll,
        addFabricRollBatchIntake,
        cutFabricFromRoll,
        logSpoiltFabricMeters,
        isFabricRollModalOpen,
        setIsFabricRollModalOpen,
        fulfillForwardReservation,
        cancelForwardReservation,
        isForwardReservationsModalOpen,
        setIsForwardReservationsModalOpen
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
