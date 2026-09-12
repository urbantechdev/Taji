import { LocationId, CategoryType, UnitType } from '../types';

export interface InwardInvoiceDraftItem {
  id: string;
  isExistingCatalogProduct: boolean;
  matchedProductId?: string;
  name: string;
  sku: string;
  category: CategoryType;
  subCategory?: string;
  fiberComposition?: string;
  colorName?: string;
  colorHex?: string;
  unit: UnitType;
  quantity: number;
  grossWeightKg?: number;
  unitPriceUSD?: number;
  unitPriceKES?: number;
  hsCode?: string;
  rollsCount?: number;
  dyeLot?: string;
  shadeCode?: string;
  packagesCount?: number;
  packageDetails?: string;
  bagNumberRange?: string;
}

export interface InwardInvoiceDraftData {
  savedAt: string;
  supplyType: 'import' | 'local';
  selectedSupplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customsOrEtimsRef: string;
  kraEslipRef: string;
  destinationLocation: LocationId;
  exchangeRate: number;
  totalFreightUSD: number;
  totalInsuranceUSD: number;
  cocFeesUSD: number;
  portClearingFeesKES: number;
  localFreightKES: number;
  targetMarkupPct: number;
  draftItems: InwardInvoiceDraftItem[];
  currentStep: 1 | 2 | 3;
  editingInvoiceRecordId: string | null;
}

export interface CategoryIntakeDraftData {
  savedAt: string;
  selectedCategory: CategoryType;
  selectedInvoiceId: string;
  lockedInvoiceRef: string;
  targetLocation: LocationId;
  yarnBatchMode: 'full' | 'half' | 'custom';
  yarnNetWeightKg: number;
  yarnGrossWeightKg: number;
  yarnTareWeightKg: number;
  yarnPackagesCount: number;
  scannedItems: any[];
}

const INWARD_INVOICE_KEY = 'taji_inward_invoice_draft_v1';
const CATEGORY_INTAKE_KEY = 'taji_category_intake_draft_v1';

export const saveInwardInvoiceDraft = (data: Omit<InwardInvoiceDraftData, 'savedAt'>) => {
  try {
    const payload: InwardInvoiceDraftData = {
      ...data,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(INWARD_INVOICE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Unable to auto-save inward invoice draft:', err);
  }
};

export const getInwardInvoiceDraft = (): InwardInvoiceDraftData | null => {
  try {
    const raw = localStorage.getItem(INWARD_INVOICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.draftItems) && parsed.draftItems.length > 0) {
      return parsed as InwardInvoiceDraftData;
    }
  } catch (err) {
    console.warn('Unable to read inward invoice draft:', err);
  }
  return null;
};

export const clearInwardInvoiceDraft = () => {
  try {
    localStorage.removeItem(INWARD_INVOICE_KEY);
  } catch (err) {
    console.warn('Unable to clear inward invoice draft:', err);
  }
};

export const saveCategoryIntakeDraft = (data: Omit<CategoryIntakeDraftData, 'savedAt'>) => {
  try {
    if (!data.scannedItems || data.scannedItems.length === 0) {
      // Don't clutter if nothing scanned yet
      return;
    }
    const payload: CategoryIntakeDraftData = {
      ...data,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(CATEGORY_INTAKE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Unable to auto-save category intake draft:', err);
  }
};

export const getCategoryIntakeDraft = (): CategoryIntakeDraftData | null => {
  try {
    const raw = localStorage.getItem(CATEGORY_INTAKE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.scannedItems) && parsed.scannedItems.length > 0) {
      return parsed as CategoryIntakeDraftData;
    }
  } catch (err) {
    console.warn('Unable to read category intake draft:', err);
  }
  return null;
};

export const clearCategoryIntakeDraft = () => {
  try {
    localStorage.removeItem(CATEGORY_INTAKE_KEY);
  } catch (err) {
    console.warn('Unable to clear category intake draft:', err);
  }
};

export const formatDraftTimeAgo = (isoDate: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'earlier today';
  }
};
