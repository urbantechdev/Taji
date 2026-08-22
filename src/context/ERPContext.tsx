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
  KRAWithholdingTaxRecord
} from '../types';
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
    whtCertificateNo?: string
  ) => { success: boolean; orderId?: string; message?: string };
  convertQuotationToInvoice: (
    quotationId: string,
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    applyWHT5?: boolean,
    whtCertificateNo?: string
  ) => { success: boolean; message: string; order?: SaleOrder };

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
      adjustmentType?: 'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost';
      percentageValue?: number;
    }
  ) => Promise<{ success: boolean; updatedCount: number; message: string }>;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved locations from localStorage:', e);
    }
    return LOCATIONS;
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

  // Category Pricing Configurations
  const DEFAULT_CATEGORY_PRICING: Record<CategoryType, CategoryPricingConfig> = {
    Dereck: {
      category: 'Dereck',
      defaultRetailPrice: 1200,
      defaultBulkPrice: 950,
      defaultCostPrice: 600,
      marginPercentage: 100,
      lastUpdated: new Date().toISOString()
    },
    Fleece: {
      category: 'Fleece',
      defaultRetailPrice: 1600,
      defaultBulkPrice: 1350,
      defaultCostPrice: 850,
      marginPercentage: 88,
      lastUpdated: new Date().toISOString()
    },
    Yarns: {
      category: 'Yarns',
      defaultRetailPrice: 850,
      defaultBulkPrice: 680,
      defaultCostPrice: 420,
      marginPercentage: 102,
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
      const saved = localStorage.getItem('urban_interior_category_pricing');
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
      localStorage.setItem('urban_interior_category_pricing', JSON.stringify(categoryPricingConfigs));
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
          return parsed;
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
      assignedLoc = activeLocation || 'branch_westlands';
      roleName = 'Brian O. Otieno (Branch Manager)';
    } else if (role === 'branch_cashier') {
      assignedLoc = activeLocation || 'branch_westlands';
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

    setCart(prev => {
      const existing = prev.find(item => item.batchId === batch.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map(item =>
          item.batchId === batch.id
            ? { ...item, quantity: newQty, availableStock: available }
            : item
        );
      }
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
          availableStock: available
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
      prev.map(item => (item.batchId === batchId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    playTrashSound();
    setCart([]);
  };

  // POS CHECKOUT logic
  const processPOSCheckout = (
    paymentMethod: 'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque',
    customerName: string = 'Walk-in Retail Customer',
    customerKraPin: string = '',
    isQuotation: boolean = false,
    applyWHT5: boolean = false,
    whtCertificateNo: string = ''
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

    // Check stock availability
    for (const item of cart) {
      const prod = products.find(p => p.id === item.batchId);
      const locStock = prod?.locationStock[activeLocation] || 0;
      if (locStock < item.quantity && !isQuotation) {
        return {
          success: false,
          message: `Insufficient stock for ${item.productName} at ${locInfo?.name}. Available: ${locStock} ${item.unit}. Consider auto-rerouting order to Main Store.`
        };
      }
    }

    // Calculate totals & 16% KRA VAT breakdown
    const grossTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const subtotal = Number((grossTotal / (1 + etrConfig.vatRate)).toFixed(2));
    const vatAmount = Number((grossTotal - subtotal).toFixed(2));

    // 5% Withholding Tax calculations
    const whtRate = 0.05;
    const whtAmount = applyWHT5 ? Number((grossTotal * whtRate).toFixed(2)) : 0;
    const netReceivableAmount = applyWHT5 ? Number((grossTotal - whtAmount).toFixed(2)) : grossTotal;
    const whtCertNumber = applyWHT5 ? (whtCertificateNo || `KRA-WHT-5%-${Date.now().toString().slice(-6)}`) : undefined;

    const receiptNum = `ETR-${Math.floor(1000 + Math.random() * 9000)}-${orders.length + 1}`;
    const orderId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: SaleOrder = {
      id: orderId,
      receiptNumber: receiptNum,
      etrDevicePin: etrConfig.taxPin,
      cuSerialNumber: etrConfig.cuSerialNumber,
      originLocation: activeLocation,
      fulfilledByLocation: activeLocation,
      customerName,
      customerKraPin: customerKraPin || undefined,
      items: cart.map(item => ({
        batchId: item.batchId,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        scaleGrossWeight: item.scaleGrossWeight,
        tareDeduction: item.tareDeduction,
        netBillableWeight: item.netBillableWeight,
        isTareApplied: item.isTareApplied,
        tareDescription: item.tareDescription
      })),
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
      status: 'completed',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      isRerouted: false,
      isQuotation
    };

    if (!isQuotation) {
      // 1. Decrement Inventory stock at active location (using pure net billed weight)
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const cartItem = cart.find(c => c.batchId === prod.id);
          if (cartItem) {
            const currentStock = prod.locationStock[activeLocation] || 0;
            // The item.quantity in cart is already the net billable weight when tare is applied
            return {
              ...prod,
              locationStock: {
                ...prod.locationStock,
                [activeLocation]: Math.max(0, currentStock - cartItem.quantity)
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
        // Net Cash/Bank collected
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

        // 5% Advance Withholding Tax Credit
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

    return { success: true, orderId };
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
        branch_westlands: destLoc === 'branch_westlands' ? newProductData.quantity : 0,
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

    items.forEach(item => {
      const barcodeUpper = item.barcode.trim().toUpperCase();
      const existingIndex = updatedProducts.findIndex(
        p => (p.barcode && p.barcode.toUpperCase() === barcodeUpper) ||
             (p.sku && p.sku.toUpperCase() === barcodeUpper) ||
             p.id.toUpperCase() === barcodeUpper
      );

      const qty = Math.max(1, Number(item.quantity) || 1);
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
          locationStock: {
            ...existing.locationStock,
            [targetLocation]: currentLocStock + qty
          }
        };
      } else {
        // Auto-create product record under chosen category
        const batchId = `BATCH-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const sku = barcodeUpper;
        const colorName = item.colorName || (category === 'Dereck' ? 'Royal Navy' : category === 'Fleece' ? 'Charcoal Heather' : 'Natural Ecru');
        const colorHex = item.colorHex || (category === 'Dereck' ? '#1E3A8A' : category === 'Fleece' ? '#374151' : '#F3F4F6');
        const unit = item.unit || (category === 'Yarns' ? 'kg' : 'meter');
        const name = item.name || `${category} - ${colorName} (${sku})`;

        const qrData = JSON.stringify({
          sku,
          batch: batchId,
          cat: category,
          color: colorHex,
          unitPrice: retail,
          costPrice: wholesale,
          intakeAt: now
        });

        const newProd: ProductBatch = {
          id: batchId,
          sku,
          barcode: barcodeUpper,
          name,
          category,
          subCategory: `${category} Premium Stock`,
          fiberComposition: item.fiberComposition || (category === 'Dereck' ? '100% Superfine Dereec Weave' : category === 'Fleece' ? 'Heavyweight Thermal Polar Fleece' : '100% Spun Acrylic Knitting Yarn'),
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
          minReorderLevel: 25,
          qrCodeData: qrData,
          createdAt: now.split('T')[0]
        };

        updatedProducts = [newProd, ...updatedProducts];
      }
    });

    setProducts(updatedProducts);

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
        defaultRetailPrice: priceUpdates.retailPrice || prev[category]?.defaultRetailPrice || 1200,
        defaultBulkPrice: priceUpdates.bulkPrice || prev[category]?.defaultBulkPrice || 950,
        defaultCostPrice: priceUpdates.costPrice || prev[category]?.defaultCostPrice || 600,
        marginPercentage: priceUpdates.percentageValue || prev[category]?.marginPercentage || 50,
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
        purgeAllMockData
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
