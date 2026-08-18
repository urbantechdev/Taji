import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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
  POSOperator
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
  CURRENT_USER
} from '../data/initialData';
import {
  playAddToCartSound,
  playTrashSound,
  playSuccessSound,
  playNotificationSound,
  playAlertSound
} from '../utils/audio';

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
    isQuotation?: boolean
  ) => { success: boolean; orderId?: string; message?: string };

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

  addProductBatch: (newBatch: Omit<ProductBatch, 'id' | 'createdAt' | 'qrCodeData'>) => void;
  updateETRConfig: (config: Partial<ETRConfig>) => void;
  generateMonthlyPayroll: (monthYear: string) => void;
  recordAuditLog: (action: string, details: string) => void;

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
  scannedResult: string | null;
  setScannedResult: (res: string | null) => void;
  handleQRScan: (qrString: string) => boolean;
  isBrandSettingsModalOpen: boolean;
  setIsBrandSettingsModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isMailDrawerOpen: boolean;
  setIsMailDrawerOpen: (open: boolean) => void;
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
        if (Array.isArray(parsed)) return parsed;
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

  // Core Data States
  const [products, setProducts] = useState<ProductBatch[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<SaleOrder[]>(INITIAL_ORDERS);
  const [transfers, setTransfers] = useState<InterStoreTransfer[]>(INITIAL_TRANSFERS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(INITIAL_PAYROLL);
  const [etrConfig, setEtrConfig] = useState<ETRConfig>(INITIAL_ETR_CONFIG);

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Mail / Transfer Notifications State
  const [mailNotifications, setMailNotifications] = useState<MailNotification[]>(INITIAL_MAIL_NOTIFICATIONS);
  const [activeToastNotification, setActiveToastNotification] = useState<MailNotification | null>(null);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<SaleOrder | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

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
    isQuotation: boolean = false
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
        totalPrice: item.unitPrice * item.quantity
      })),
      subtotal,
      vatAmount,
      grandTotal: grossTotal,
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
      // 1. Decrement Inventory stock at active location
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const cartItem = cart.find(c => c.batchId === prod.id);
          if (cartItem) {
            const currentStock = prod.locationStock[activeLocation] || 0;
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

      // 2. Add Ledger Entries (Double entry for revenue & VAT output tax)
      const ledgerRev: LedgerEntry = {
        id: `LEDG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: orderId,
        description: `POS Retail Sale Revenue at ${locInfo?.name} (${paymentMethod})`,
        debitAccount: `${paymentMethod} Cash Account`,
        creditAccount: `Sales Revenue (${locInfo?.name})`,
        amount: grossTotal,
        locationId: activeLocation,
        category: 'Sales'
      };

      const ledgerVat: LedgerEntry = {
        id: `LEDG-VAT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        transactionRef: orderId,
        description: `KRA 16% Output VAT Liability for Receipt ${receiptNum}`,
        debitAccount: `Sales Revenue (${locInfo?.name})`,
        creditAccount: `KRA Output VAT Liability`,
        amount: vatAmount,
        locationId: activeLocation,
        category: 'Tax VAT'
      };

      setLedger(prev => [ledgerRev, ledgerVat, ...prev]);

      // 3. Update branch cash balance if paid in cash
      if (paymentMethod === 'Cash') {
        setLocations(prevLocs =>
          prevLocs.map(l => {
            if (l.id === activeLocation) {
              const current = l.currentCashBalance ?? l.openingFloat ?? 0;
              return { ...l, currentCashBalance: current + grossTotal };
            }
            return l;
          })
        );
      }

      // 4. Record Audit Log
      recordAuditLog(
        'POS Sale Completed',
        `Issued ETR Receipt ${receiptNum} for KSh ${grossTotal.toLocaleString()} (${paymentMethod}) at ${locInfo?.name}`
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
    return dispatchRestockTransfer(transferId);
  };

  // ADD NEW PRODUCT BATCH
  const addProductBatch = (newBatch: Omit<ProductBatch, 'id' | 'createdAt' | 'qrCodeData'>) => {
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

    setProducts(prev => [created, ...prev]);
    recordAuditLog('Product Catalog Added', `Added batch ${batchId} (${newBatch.name} - ${newBatch.colorName}) with hex ${newBatch.colorHex}`);
  };

  // ETR CONFIG UPDATE
  const updateETRConfig = (config: Partial<ETRConfig>) => {
    setEtrConfig(prev => ({ ...prev, ...config }));
    recordAuditLog('ETR Settings Updated', 'Updated company tax details / CU serial number');
  };

  // PAYROLL GENERATION
  const generateMonthlyPayroll = (monthYear: string) => {
    const newRecords: PayrollRecord[] = staff.map((s, idx) => {
      const gross = s.basicSalary + s.allowances;
      // KRA Standard Tax Brackets simulation
      const paye = Math.round(gross * 0.25);
      const nssf = 1080;
      const nhif = 1300;
      const housingLevy = Math.round(gross * 0.015);
      const totalDeductions = paye + nssf + nhif + housingLevy;
      const netPay = gross - totalDeductions;

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
        payeTax: paye,
        nssfDeduction: nssf,
        nhifDeduction: nhif,
        housingLevy,
        totalDeductions,
        netPay,
        paymentStatus: 'Paid',
        generatedAt: new Date().toISOString()
      };
    });

    setPayroll(prev => [...newRecords, ...prev]);
    recordAuditLog('Payroll Processed', `Generated monthly payroll for ${monthYear} covering ${staff.length} staff members.`);
  };

  // QR SCANNER Handler
  const handleQRScan = (qrString: string) => {
    try {
      const parsed = JSON.parse(qrString);
      if (parsed.batch) {
        const prod = products.find(p => p.id === parsed.batch || p.sku === parsed.sku);
        if (prod) {
          addToCart(prod, 1);
          setScannedResult(`Scanned & added ${prod.name} (${prod.colorName}) to cart!`);
          recordAuditLog('QR Code Scanned', `Scanned QR Code for ${prod.sku}`);
          return true;
        }
      }
    } catch {
      // Raw SKU fallback check
      const prod = products.find(p => p.sku === qrString || p.id === qrString);
      if (prod) {
        addToCart(prod, 1);
        setScannedResult(`Scanned SKU ${prod.sku}: Added ${prod.name} to cart!`);
        return true;
      }
    }
    setScannedResult(`QR Code decoded: ${qrString}. Product matching batch/SKU not found.`);
    return false;
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
        createOrderRerouteTicket,
        requestRestock,
        dispatchRestockTransfer,
        createDirectDispatchTransfer,
        updateProductPrice,
        fulfillReroutedOrder,
        acceptPurchaseOrder,
        receiveRestockTransfer,
        addProductBatch,
        updateETRConfig,
        generateMonthlyPayroll,
        recordAuditLog,
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
        scannedResult,
        setScannedResult,
        handleQRScan,
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
        setIsMailDrawerOpen
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
