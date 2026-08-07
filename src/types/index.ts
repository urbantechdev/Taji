export type LocationId = 'main_store' | 'sales_shop' | 'store_1' | 'store_2';

export interface LocationInfo {
  id: LocationId;
  name: string;
  type: 'Main Store' | 'Sales Shop' | 'Store 1 (Transfer Only)' | 'Store 2 (Transfer Only)';
  canSellDirectly: boolean;
  canFulfillOrders: boolean;
  canRequestRestock: boolean;
  address: string;
  phone: string;
}

export type CategoryType = 'Dereck' | 'Fleece' | 'Yarns';

export type UnitType = 'kg' | 'roll' | 'meter' | 'skein' | 'yard';

export interface ProductBatch {
  id: string; // e.g. BATCH-2026-001
  sku: string; // e.g. TFX-DRK-101
  name: string;
  category: CategoryType;
  subCategory: string; // e.g. "Polar Fleece", "Acrylic Yarn", "Heavy Dereck Weave"
  fiberComposition: string; // e.g., "100% Cotton", "80% Polyester 20% Wool"
  colorName: string; // e.g., "Crimson Red"
  colorHex: string; // e.g., "#E91E63"
  unit: UnitType;
  unitPriceRetail: number; // KSh or $ retail price per unit
  unitPriceBulk: number; // Bulk price per unit (for Main Store bulk sales)
  costPrice: number; // Internal cost per unit
  locationStock: Record<LocationId, number>; // Stock per store location
  minReorderLevel: number; // Low stock threshold for automatic alert / request
  imageUrl?: string; // High-resolution product image URL
  qrCodeData: string; // Embedded QR payload string
  createdAt: string;
}

export type UserRole = 
  | 'admin'
  | 'main_store_operator'
  | 'sales_shop_cashier'
  | 'store_1_attendant'
  | 'store_2_attendant'
  | 'accountant';

export interface POSOperator {
  id: string;
  name: string;
  email: string;
  pin: string; // 6-digit PIN code
  location: LocationId;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedLocation: LocationId;
  kraPin?: string;
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

export interface LedgerEntry {
  id: string;
  timestamp: string;
  transactionRef: string;
  description: string;
  debitAccount: string; // e.g. "Main Store Inventory", "Sales Shop Inventory", "Sales Revenue", "VAT Output Tax"
  creditAccount: string;
  amount: number;
  locationId: LocationId;
  category: 'Sales' | 'Inter-Store Transfer' | 'Tax VAT' | 'Inventory Revaluation' | 'Expense';
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

