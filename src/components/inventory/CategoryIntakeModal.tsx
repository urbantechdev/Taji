import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, LocationId, UnitType, InvoiceInventoryBatch } from '../../types';
import {
  Barcode,
  Scan,
  PackagePlus,
  Package,
  Scale,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  X,
  Plus,
  Trash2,
  Store,
  Warehouse,
  Check,
  TrendingUp,
  Coins,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Camera,
  Pipette,
  Palette,
  Lock,
  FileText,
  ShieldAlert,
  Search,
  Building2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Hash,
  Receipt,
  Tag,
  SlidersHorizontal,
  RotateCcw,
  Edit3,
  Filter,
  Clock,
  User
} from 'lucide-react';
import {
  PRESET_INVOICE_26PA222,
  PRESET_SAD_26EMKIM400968589,
  PRESET_SAD_UDEY_UDYOG,
  PRESET_FLEECE_CONTAINER
} from '../../utils/importCostingEngine';
import { PRESET_LPS_RIVATEX } from '../../utils/localPurchaseCostingEngine';
import {
  playAddToCartSound,
  playAlertSound,
  playClickSound,
  playSuccessSound,
  playBarcodeScanBeep,
  playScannerErrorBeep
} from '../../utils/audio';
import { OpticalShadeScannerModal, OpticalScanOutput } from './OpticalShadeScannerModal';
import { MILL_SHADE_CATALOG, parseMillLabelPayload } from '../../utils/textileShadeEngine';
import {
  saveCategoryIntakeDraft,
  getCategoryIntakeDraft,
  clearCategoryIntakeDraft,
  formatDraftTimeAgo
} from '../../utils/draftRecoveryEngine';

export interface CategoryPresetConfig {
  category: CategoryType;
  label: string;
  subTitle: string;
  defaultWholesalePrice: number;
  defaultRetailPrice: number;
  defaultUnit: UnitType;
  defaultComposition: string;
  iconText: string;
  themeGradient: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_PRESETS: Record<CategoryType, CategoryPresetConfig> = {
  Dereck: {
    category: 'Dereck',
    label: 'Dereec (Dereck Textile)',
    subTitle: 'Premium superfine suit, uniform & dress polyester weaves (Sold per Metre)',
    defaultWholesalePrice: 220,
    defaultRetailPrice: 230,
    defaultUnit: 'meter',
    defaultComposition: '100% Superfine Dereec Weave',
    iconText: '🧵',
    themeGradient: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Fabrics (Metres)'
  },
  Fleece: {
    category: 'Fleece',
    label: 'Fleeces (Polar & Sherpa)',
    subTitle: 'Heavyweight thermal winter & outdoor fleece weaves (Sold per Metre)',
    defaultWholesalePrice: 440,
    defaultRetailPrice: 470,
    defaultUnit: 'meter',
    defaultComposition: 'Heavyweight Thermal Polar Fleece',
    iconText: '🧥',
    themeGradient: 'from-purple-600 to-pink-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Fabrics (Metres)'
  },
  Yarns: {
    category: 'Yarns',
    label: 'Yarns (Knitting & Weaving)',
    subTitle: 'Oster India 2/24 NM Acrylic high-bulk dyed yarn bales (Sold per KG)',
    defaultWholesalePrice: 950,
    defaultRetailPrice: 950,
    defaultUnit: 'kg',
    defaultComposition: '100% ACRYLIC (HB) DYED YARN',
    iconText: '🧶',
    themeGradient: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Yarns (Kilograms)'
  }
};

export interface ScannedSessionItem {
  id: string;
  barcode: string;
  name: string;
  category: CategoryType;
  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  unit: UnitType;
  colorName?: string;
  colorHex?: string;
  fiberComposition?: string;
  isExistingProduct: boolean;
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
  invoiceRef?: string;
}

export interface UnifiedInvoiceOption {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierCountry?: string;
  customsEntryNo?: string;
  destinationLocationId: LocationId;
  destinationLocationName: string;
  totalQuantity?: number;
  totalQuantityUnit?: 'meter' | 'kg';
  totalLandedCostKES?: number;
  date?: string;
  createdAt?: string;
  createdBy?: string;
  type: 'import' | 'sad' | 'local' | 'delivery' | 'custom';
  suggestedCategory?: CategoryType;
  suggestedWholesalePrice?: number;
  notes?: string;
}

interface CategoryIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: CategoryType;
  initialInvoiceId?: string;
}

type IntakeWorkflowStep = 1 | 2 | 3 | 4;

export const CategoryIntakeModal: React.FC<CategoryIntakeModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Dereck',
  initialInvoiceId
}) => {
  const {
    products,
    locations,
    activeLocation,
    commitCategoryIntakeSession,
    getTotalAssetValuation,
    deliveries = [],
    invoiceBatches = [],
    inwardInvoices = []
  } = useERP();

  // Workflow Step State (1: Select Invoice -> 2: Select Category -> 3: Set Price -> 4: Scan Barcodes)
  const [currentStep, setCurrentStep] = useState<IntakeWorkflowStep>(1);

  // Inward Invoice Selection & Governance State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [lockedInvoiceRef, setLockedInvoiceRef] = useState<string>('');
  const [selectedInvoiceSupplier, setSelectedInvoiceSupplier] = useState<string>('');
  const [isStoreLockedByInvoice, setIsStoreLockedByInvoice] = useState<boolean>(false);
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation || 'main_store');

  // Search & Filter for Invoices in Step 1
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'import' | 'local' | 'delivery'>('all');
  const [isCreatingCustomInvoice, setIsCreatingCustomInvoice] = useState(false);
  const [customInvoiceForm, setCustomInvoiceForm] = useState({
    invoiceNumber: '',
    supplierName: '',
    customsEntryNo: '',
    destinationLocationId: 'main_store' as LocationId,
    totalQuantity: 500,
    totalQuantityUnit: 'meter' as 'meter' | 'kg',
    notes: ''
  });

  // Category Selection State (Step 2)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCategory);

  // Price Setting State (Step 3)
  const [wholesalePrice, setWholesalePrice] = useState<number>(CATEGORY_PRESETS[initialCategory].defaultWholesalePrice);
  const [retailPrice, setRetailPrice] = useState<number>(CATEGORY_PRESETS[initialCategory].defaultRetailPrice);
  const [unit, setUnit] = useState<UnitType>(CATEGORY_PRESETS[initialCategory].defaultUnit);

  // Yarn Batch Specification & Mass Configuration State
  const [yarnBatchMode, setYarnBatchMode] = useState<'full' | 'half' | 'custom'>('full');
  const [yarnNetWeightKg, setYarnNetWeightKg] = useState<number>(24.000);
  const [yarnGrossWeightKg, setYarnGrossWeightKg] = useState<number>(24.840);
  const [yarnTareWeightKg, setYarnTareWeightKg] = useState<number>(0.840);
  const [yarnPackagesCount, setYarnPackagesCount] = useState<number>(12);
  const [editingItemBatchId, setEditingItemBatchId] = useState<string | null>(null);

  // Barcode Scanning State (Step 4)
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [scannedItems, setScannedItems] = useState<ScannedSessionItem[]>([]);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isOpticalScannerOpen, setIsOpticalScannerOpen] = useState(false);

  // Completion Receipt State
  const [completionResult, setCompletionResult] = useState<{
    totalQtyAdded: number;
    totalCostValuationAdded: number;
    totalRetailValuationAdded: number;
    newTotalBusinessAssetCost: number;
    newTotalBusinessAssetRetail: number;
    newTotalUnits: number;
    targetLocationName: string;
  } | null>(null);

  // Session Recovery & Auto-save State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveredIntakeInfo, setRecoveredIntakeInfo] = useState<{ savedAt: string; count: number } | null>(null);
  const [isScanningAutosaved, setIsScanningAutosaved] = useState(false);

  // Auto-restore uncommitted scanning session when opening
  useEffect(() => {
    if (isOpen && scannedItems.length === 0 && !completionResult) {
      const saved = getCategoryIntakeDraft();
      if (saved && Array.isArray(saved.scannedItems) && saved.scannedItems.length > 0) {
        setSelectedCategory(saved.selectedCategory);
        if (saved.selectedInvoiceId) setSelectedInvoiceId(saved.selectedInvoiceId);
        if (saved.lockedInvoiceRef) setLockedInvoiceRef(saved.lockedInvoiceRef);
        if (saved.targetLocation) setTargetLocation(saved.targetLocation);
        if (saved.yarnBatchMode) setYarnBatchMode(saved.yarnBatchMode);
        if (saved.yarnNetWeightKg) setYarnNetWeightKg(saved.yarnNetWeightKg);
        if (saved.yarnGrossWeightKg) setYarnGrossWeightKg(saved.yarnGrossWeightKg);
        if (saved.yarnTareWeightKg) setYarnTareWeightKg(saved.yarnTareWeightKg);
        if (saved.yarnPackagesCount) setYarnPackagesCount(saved.yarnPackagesCount);
        setScannedItems(saved.scannedItems);
        setCurrentStep(4);
        setRecoveredIntakeInfo({
          savedAt: saved.savedAt,
          count: saved.scannedItems.length
        });
      }
    }
  }, [isOpen]);

  // Background Auto-Save to localStorage
  useEffect(() => {
    if (!isOpen || isSubmitting || completionResult) return;
    const timer = setTimeout(() => {
      if (scannedItems.length > 0) {
        saveCategoryIntakeDraft({
          selectedCategory,
          selectedInvoiceId,
          lockedInvoiceRef,
          targetLocation,
          yarnBatchMode,
          yarnNetWeightKg,
          yarnGrossWeightKg,
          yarnTareWeightKg,
          yarnPackagesCount,
          scannedItems
        });
        setIsScanningAutosaved(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    isSubmitting,
    completionResult,
    scannedItems,
    selectedCategory,
    selectedInvoiceId,
    lockedInvoiceRef,
    targetLocation,
    yarnBatchMode,
    yarnNetWeightKg,
    yarnGrossWeightKg,
    yarnTareWeightKg,
    yarnPackagesCount
  ]);

  const handleDiscardRecoveredIntake = () => {
    clearCategoryIntakeDraft();
    setRecoveredIntakeInfo(null);
    setScannedItems([]);
    setCurrentStep(1);
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Build Unified Invoices List
  const allInvoicesList = useMemo<UnifiedInvoiceOption[]>(() => {
    const list: UnifiedInvoiceOption[] = [];
    const addedInvoiceKeys = new Set<string>();

    // 1. Real Synced Invoice Batches
    invoiceBatches.forEach((batch: InvoiceInventoryBatch) => {
      const locName = locations.find(l => l.id === batch.destinationLocationId)?.name || batch.destinationLocationId;
      const key = batch.invoiceNumber.toUpperCase();
      addedInvoiceKeys.add(key);

      let catHint: CategoryType | undefined;
      let costHint: number | undefined;
      if (batch.lineItems && batch.lineItems.length > 0) {
        catHint = batch.lineItems[0].category;
        costHint = batch.lineItems[0].landedCostKESPerUnit;
      }

      list.push({
        id: batch.id,
        invoiceNumber: batch.invoiceNumber,
        supplierName: batch.supplierName,
        supplierCountry: batch.supplierCountry,
        customsEntryNo: batch.customsEntryNo,
        destinationLocationId: batch.destinationLocationId,
        destinationLocationName: locName,
        totalQuantity: batch.totalQuantity,
        totalQuantityUnit: batch.totalQuantityUnit,
        totalLandedCostKES: batch.totalLandedCostKES,
        date: batch.importDate || batch.createdAt?.split('T')[0],
        type: batch.invoiceNumber.toLowerCase().includes('riv') ? 'local' : 'import',
        suggestedCategory: catHint,
        suggestedWholesalePrice: costHint,
        notes: batch.notes
      });
    });

    // 2. Presets if not yet present
    const addPresetIfNotPresent = (
      id: string,
      invNum: string,
      supplier: string,
      country: string,
      customs: string,
      locId: LocationId,
      qty: number,
      unit: 'meter' | 'kg',
      cost: number,
      type: 'import' | 'sad' | 'local',
      cat: CategoryType,
      date: string
    ) => {
      if (!addedInvoiceKeys.has(invNum.toUpperCase())) {
        addedInvoiceKeys.add(invNum.toUpperCase());
        const locName = locations.find(l => l.id === locId)?.name || locId;
        list.push({
          id,
          invoiceNumber: invNum,
          supplierName: supplier,
          supplierCountry: country,
          customsEntryNo: customs,
          destinationLocationId: locId,
          destinationLocationName: locName,
          totalQuantity: qty,
          totalQuantityUnit: unit,
          totalLandedCostKES: cost,
          date,
          type,
          suggestedCategory: cat,
          suggestedWholesalePrice: cat === 'Dereck' ? 220 : cat === 'Fleece' ? 440 : 950
        });
      }
    };

    addPresetIfNotPresent(
      'IMP-2026-PA222',
      PRESET_INVOICE_26PA222.invoiceNumber,
      PRESET_INVOICE_26PA222.supplierName,
      'China',
      PRESET_INVOICE_26PA222.customsEntryNo || '26EMKIM400826138',
      (PRESET_INVOICE_26PA222.destinationLocationId as LocationId) || 'main_store',
      58000,
      'meter',
      12760000,
      'import',
      'Dereck',
      '2026-06-12'
    );

    addPresetIfNotPresent(
      'SAD-26EMKIM400968589',
      '26EMKIM400968589',
      'ZHEJIANG PUAN TEXTILE / ICMS SAD RECONCILED',
      'China',
      '26EMKIM400968589',
      (PRESET_SAD_26EMKIM400968589.destinationLocationId as LocationId) || 'main_store',
      22600,
      'kg',
      4972000,
      'sad',
      'Dereck',
      '2026-06-15'
    );

    addPresetIfNotPresent(
      'IMP-2026-UDEY-036',
      PRESET_SAD_UDEY_UDYOG.invoiceNumber,
      PRESET_SAD_UDEY_UDYOG.supplierName,
      'India',
      PRESET_SAD_UDEY_UDYOG.customsEntryNo || '26EMKIM400781204',
      (PRESET_SAD_UDEY_UDYOG.destinationLocationId as LocationId) || 'main_store',
      8000,
      'kg',
      7600000,
      'import',
      'Yarns',
      '2026-02-18'
    );

    addPresetIfNotPresent(
      'IMP-2026-FLC-774',
      PRESET_FLEECE_CONTAINER.invoiceNumber,
      PRESET_FLEECE_CONTAINER.supplierName,
      'China',
      PRESET_FLEECE_CONTAINER.customsEntryNo || '26EMKIM400619223',
      (PRESET_FLEECE_CONTAINER.destinationLocationId as LocationId) || 'main_store',
      15000,
      'meter',
      6600000,
      'import',
      'Fleece',
      '2026-04-10'
    );

    addPresetIfNotPresent(
      'LPS-REC-2026-001',
      PRESET_LPS_RIVATEX.invoiceNumber,
      PRESET_LPS_RIVATEX.supplierName,
      'Kenya (Domestic)',
      'eTIMS-KRA-981244',
      (PRESET_LPS_RIVATEX.destinationLocationId as LocationId) || 'main_store',
      5000,
      'meter',
      1050000,
      'local',
      'Dereck',
      '2026-05-20'
    );

    // 3. Inward Commercial Invoices from Ledger
    (inwardInvoices || []).forEach(inv => {
      const key = inv.invoiceNumber.toUpperCase();
      if (!addedInvoiceKeys.has(key)) {
        addedInvoiceKeys.add(key);
        const locName = locations.find(l => l.id === inv.destinationLocation)?.name || inv.destinationLocation;
        list.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          supplierName: inv.supplierName,
          supplierCountry: inv.supplierCountry,
          customsEntryNo: inv.customsOrEtimsRef,
          destinationLocationId: (inv.destinationLocation as LocationId) || 'main_store',
          destinationLocationName: locName,
          totalQuantity: inv.totalQuantity || (inv.lineItems ? inv.lineItems.reduce((acc, li) => acc + (Number(li.quantity) || 0), 0) : undefined),
          totalQuantityUnit: (inv.totalQuantityUnit === 'kg' ? 'kg' : 'meter') as 'meter' | 'kg',
          totalLandedCostKES: inv.totalAmountKES,
          date: inv.invoiceDate,
          createdAt: inv.createdAt,
          createdBy: inv.createdBy || inv.lastEditedBy,
          type: inv.supplyType === 'local' ? 'local' : 'import',
          suggestedCategory: inv.lineItems?.[0]?.category as CategoryType
        });
      }
    });

    // 4. Active Delivery Manifests
    (deliveries || []).forEach(del => {
      const key = (del.consignmentNo || del.id).toUpperCase();
      if (!addedInvoiceKeys.has(key)) {
        addedInvoiceKeys.add(key);
        const locName = locations.find(l => l.id === del.destinationLocation)?.name || del.destinationLocation;
        list.push({
          id: `DEL-${del.id}`,
          invoiceNumber: del.consignmentNo || del.id,
          supplierName: del.supplierName,
          supplierCountry: 'Inward Transit',
          destinationLocationId: del.destinationLocation,
          destinationLocationName: locName,
          totalQuantity: del.totalExpectedQty || (del.items ? del.items.reduce((s: number, i: any) => s + (i.expectedQty || 0), 0) : undefined),
          totalQuantityUnit: 'meter',
          date: new Date().toISOString().split('T')[0],
          type: 'delivery',
          notes: del.notes || 'Delivery Waybill'
        });
      }
    });

    return list;
  }, [invoiceBatches, inwardInvoices, deliveries, locations]);

  // Filtered invoices in Step 1
  const filteredInvoices = useMemo(() => {
    return allInvoicesList.filter(inv => {
      // Type filter
      if (invoiceTypeFilter === 'import' && inv.type !== 'import' && inv.type !== 'sad') return false;
      if (invoiceTypeFilter === 'local' && inv.type !== 'local') return false;
      if (invoiceTypeFilter === 'delivery' && inv.type !== 'delivery') return false;

      // Search query
      if (invoiceSearchQuery.trim()) {
        const q = invoiceSearchQuery.toLowerCase();
        const matchesInv = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesSupp = inv.supplierName.toLowerCase().includes(q);
        const matchesCustoms = inv.customsEntryNo?.toLowerCase().includes(q);
        const matchesStore = inv.destinationLocationName.toLowerCase().includes(q);
        if (!matchesInv && !matchesSupp && !matchesCustoms && !matchesStore) return false;
      }

      return true;
    });
  }, [allInvoicesList, invoiceTypeFilter, invoiceSearchQuery]);

  // Initialize or Reset Workflow when Modal Opens
  useEffect(() => {
    if (isOpen) {
      setCompletionResult(null);
      setScanFeedback(null);
      setIsCreatingCustomInvoice(false);

      if (initialInvoiceId) {
        // Preselect invoice if requested
        handleSelectInvoiceForIntake(initialInvoiceId);
        if (initialCategory) {
          setSelectedCategory(initialCategory);
          setWholesalePrice(CATEGORY_PRESETS[initialCategory].defaultWholesalePrice);
          setRetailPrice(CATEGORY_PRESETS[initialCategory].defaultRetailPrice);
          setUnit(CATEGORY_PRESETS[initialCategory].defaultUnit);
          setCurrentStep(3); // Go straight to pricing if invoice + category are given
        } else {
          setCurrentStep(2); // Go to category selection
        }
      } else {
        // Default strictly to Step 1: Select Invoice!
        setCurrentStep(1);
      }
    }
  }, [isOpen, initialInvoiceId]);

  // Handle Invoice Selection
  const handleSelectInvoiceForIntake = (invoiceKey: string) => {
    playClickSound();
    setSelectedInvoiceId(invoiceKey);

    const inv = allInvoicesList.find(i => i.id === invoiceKey || i.invoiceNumber === invoiceKey);
    if (inv) {
      setLockedInvoiceRef(inv.invoiceNumber);
      setSelectedInvoiceSupplier(inv.supplierName);
      setTargetLocation(inv.destinationLocationId);
      setIsStoreLockedByInvoice(true);

      // Auto-suggest category if present in invoice
      if (inv.suggestedCategory) {
        setSelectedCategory(inv.suggestedCategory);
        const preset = CATEGORY_PRESETS[inv.suggestedCategory];
        setWholesalePrice(inv.suggestedWholesalePrice || preset.defaultWholesalePrice);
        setRetailPrice(preset.defaultRetailPrice);
        setUnit(preset.defaultUnit);
      }
    } else {
      setLockedInvoiceRef(invoiceKey);
      setSelectedInvoiceSupplier('Selected Commercial Partner');
      setIsStoreLockedByInvoice(false);
    }
  };

  // Handle Custom Invoice Submission
  const handleCreateAndSelectCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInvoiceForm.invoiceNumber.trim() || !customInvoiceForm.supplierName.trim()) {
      playAlertSound();
      setScanFeedback({ type: 'error', message: 'Please enter both an Invoice Number and Supplier Name.' });
      return;
    }

    playSuccessSound();
    const invNumber = customInvoiceForm.invoiceNumber.trim().toUpperCase();
    const supplier = customInvoiceForm.supplierName.trim();
    const store = customInvoiceForm.destinationLocationId;

    setSelectedInvoiceId(invNumber);
    setLockedInvoiceRef(invNumber);
    setSelectedInvoiceSupplier(supplier);
    setTargetLocation(store);
    setIsStoreLockedByInvoice(true);
    setIsCreatingCustomInvoice(false);

    setScanFeedback({
      type: 'success',
      message: `Invoice #${invNumber} registered for intake! Store locked to ${locations.find(l => l.id === store)?.name || store}.`
    });

    // Advance to Step 2 automatically
    setCurrentStep(2);
  };

  // Handle Category Change (Step 2)
  const handleCategoryChange = (cat: CategoryType) => {
    playClickSound();
    setSelectedCategory(cat);
    const preset = CATEGORY_PRESETS[cat];
    setWholesalePrice(preset.defaultWholesalePrice);
    setRetailPrice(preset.defaultRetailPrice);
    setUnit(preset.defaultUnit);
    setScanFeedback(null);
  };

  // Helper to switch yarn batch preset (Full 24kg vs Half 12kg vs Custom)
  const handleApplyYarnBatchPreset = (mode: 'full' | 'half') => {
    playClickSound();
    setYarnBatchMode(mode);
    if (mode === 'full') {
      setYarnNetWeightKg(24.000);
      setYarnGrossWeightKg(24.840);
      setYarnTareWeightKg(0.840);
      setYarnPackagesCount(12);
    } else if (mode === 'half') {
      setYarnNetWeightKg(12.000);
      setYarnGrossWeightKg(12.420);
      setYarnTareWeightKg(0.420);
      setYarnPackagesCount(6);
    }
  };

  // Focus barcode input when arriving at Step 4
  useEffect(() => {
    if (isOpen && currentStep === 4) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const currentPreset = CATEGORY_PRESETS[selectedCategory];
  const globalAssetVal = getTotalAssetValuation();

  // Live session metrics (Step 4)
  const sessionTotalUnits = scannedItems.reduce((acc, item) => acc + item.quantity, 0);
  const sessionTotalCostValuation = scannedItems.reduce((acc, item) => acc + item.quantity * item.wholesalePrice, 0);
  const sessionTotalRetailValuation = scannedItems.reduce((acc, item) => acc + item.quantity * item.retailPrice, 0);

  const projectedBusinessCostValuation = globalAssetVal.totalCostValuation + sessionTotalCostValuation;
  const projectedBusinessRetailValuation = globalAssetVal.totalRetailValuation + sessionTotalRetailValuation;
  const projectedBusinessTotalUnits = globalAssetVal.totalUnits + sessionTotalUnits;

  // Unit profit margin
  const unitGrossProfit = retailPrice - wholesalePrice;
  const profitMarginPct = retailPrice > 0 ? ((unitGrossProfit / retailPrice) * 100).toFixed(1) : '0.0';

  // Process Barcode Scan (Step 4)
  const handleScanBarcode = (codeToScan?: string, customMeta?: Partial<ScannedSessionItem>) => {
    const rawCode = (codeToScan || barcodeInput).trim();
    if (!rawCode) return;

    const parsedLabel = parseMillLabelPayload(rawCode);
    const codeUpper = (customMeta?.barcode || parsedLabel?.barcode || rawCode).toUpperCase();
    const qtyToAdd = Math.max(1, Number(customMeta?.quantity || parsedLabel?.netWeightKg || scanQuantity) || 1);

    const existingProduct = products.find(
      p => (p.barcode && p.barcode.toUpperCase() === codeUpper) ||
           (p.sku && p.sku.toUpperCase() === codeUpper) ||
           (customMeta?.shadeCode && p.shadeCode && p.shadeCode.toUpperCase() === customMeta.shadeCode.toUpperCase()) ||
           (parsedLabel?.shadeCode && p.shadeCode && p.shadeCode.toUpperCase() === parsedLabel.shadeCode.toUpperCase()) ||
           p.id.toUpperCase() === codeUpper
    );

    const existingSessionIndex = scannedItems.findIndex(
      item => item.barcode.toUpperCase() === codeUpper ||
              (customMeta?.shadeCode && item.shadeCode && item.shadeCode.toUpperCase() === customMeta.shadeCode.toUpperCase())
    );

    let updatedSessionItems = [...scannedItems];

    if (existingSessionIndex >= 0) {
      updatedSessionItems[existingSessionIndex].quantity += qtyToAdd;
      if (customMeta?.shadeCode) updatedSessionItems[existingSessionIndex].shadeCode = customMeta.shadeCode;
      if (customMeta?.colorHex) updatedSessionItems[existingSessionIndex].colorHex = customMeta.colorHex;
      if (customMeta?.colorName) updatedSessionItems[existingSessionIndex].colorName = customMeta.colorName;
      if (customMeta?.dyeLot) updatedSessionItems[existingSessionIndex].dyeLot = customMeta.dyeLot;

      playBarcodeScanBeep(true);
      setScanFeedback({
        type: 'success',
        message: `Updated: +${qtyToAdd} ${unit} for "${updatedSessionItems[existingSessionIndex].name}" (Total: ${updatedSessionItems[existingSessionIndex].quantity} ${unit})`
      });
    } else {
      const isOsterBale = codeUpper.includes('MIX GREY') || codeUpper.includes('4251') || codeUpper.includes('26E081');
      let name = customMeta?.name || (existingProduct ? existingProduct.name : parsedLabel?.colorName ? `${selectedCategory} - ${parsedLabel.colorName} (${parsedLabel.shadeCode || codeUpper})` : `${currentPreset.category} - ${codeUpper}`);
      let colorName = customMeta?.colorName || parsedLabel?.colorName || (existingProduct ? existingProduct.colorName : 'Standard Batch Shade');
      let colorHex = customMeta?.colorHex || parsedLabel?.colorHex || (existingProduct ? existingProduct.colorHex : (selectedCategory === 'Dereck' ? '#1E3A8A' : selectedCategory === 'Fleece' ? '#374151' : '#F59E0B'));
      let itemFiber = customMeta?.fiberComposition || parsedLabel?.fiberComposition || (existingProduct ? existingProduct.fiberComposition : currentPreset.defaultComposition);

      let yarnCount = customMeta?.yarnCount || parsedLabel?.yarnCount || existingProduct?.yarnCount;
      let linearDensityTex = existingProduct?.linearDensityTex;
      let dyeLot = customMeta?.dyeLot || parsedLabel?.dyeLot || existingProduct?.dyeLot;
      let shadeCode = customMeta?.shadeCode || parsedLabel?.shadeCode || existingProduct?.shadeCode;
      let bagNumber = customMeta?.bagNumber || parsedLabel?.bagNumber || existingProduct?.bagNumber;
      let packagesCount = customMeta?.packagesCount || parsedLabel?.packagesCount || existingProduct?.packagesCount;
      let weightPerPackageKg = customMeta?.weightPerPackageKg || existingProduct?.weightPerPackageKg;
      let grossWeightKg = customMeta?.grossWeightKg || parsedLabel?.grossWeightKg || existingProduct?.grossWeightKg;
      let netWeightKg = customMeta?.netWeightKg || parsedLabel?.netWeightKg || existingProduct?.netWeightKg;
      let tareWeightKg = customMeta?.tareWeightKg || parsedLabel?.tareWeightKg || existingProduct?.tareWeightKg;
      let manufacturer = customMeta?.manufacturer || parsedLabel?.manufacturer || existingProduct?.manufacturer;
      let countryOfOrigin = existingProduct?.countryOfOrigin || (selectedCategory === 'Yarns' ? 'INDIA' : 'CHINA');
      let yarnType = existingProduct?.yarnType || 'MACHINE KNITTING';
      let itemQty = qtyToAdd;

      if (selectedCategory === 'Yarns' && (isOsterBale || parsedLabel?.shadeCode || customMeta?.shadeCode || !existingProduct)) {
        const activeNet = netWeightKg || (yarnNetWeightKg > 0 ? yarnNetWeightKg : 24.000);
        const activeGross = grossWeightKg || (yarnGrossWeightKg > 0 ? yarnGrossWeightKg : 24.840);
        const activeTare = tareWeightKg || (yarnTareWeightKg > 0 ? yarnTareWeightKg : Number((activeGross - activeNet).toFixed(3)));
        const activePcs = packagesCount || (yarnPackagesCount > 0 ? yarnPackagesCount : 12);
        const activeWtPerPkg = activePcs > 0 ? Number((activeNet / activePcs).toFixed(3)) : 2.0;

        if (isOsterBale || (shadeCode && shadeCode.includes('4251'))) {
          name = `Yarns - Mix Grey (Oster India 2/24 NM Acrylic${yarnBatchMode === 'half' ? ' - Half Batch' : ''})`;
          colorName = 'Mix Grey';
          colorHex = '#94A3B8';
          itemFiber = '100% ACRYLIC (HB) DYED YARN';
          yarnCount = '2/24 NM';
          linearDensityTex = '83 TEX';
          dyeLot = dyeLot || '26E081';
          shadeCode = 'MIX GREY-4251';
          bagNumber = bagNumber || '148';
          packagesCount = activePcs;
          weightPerPackageKg = activeWtPerPkg;
          grossWeightKg = activeGross;
          netWeightKg = activeNet;
          tareWeightKg = activeTare;
          manufacturer = 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD';
          countryOfOrigin = 'INDIA';
          yarnType = 'MACHINE KNITTING';
          itemQty = activeNet;
        } else {
          yarnCount = '2/24 NM';
          const matchedMill = MILL_SHADE_CATALOG.find(s => s.code.toUpperCase() === (shadeCode || codeUpper).toUpperCase());
          dyeLot = customMeta?.dyeLot || matchedMill?.defaultDyeLot || dyeLot || (codeUpper.startsWith('LOT-') ? codeUpper : 'LOT-2026');
          shadeCode = matchedMill?.code || shadeCode || codeUpper;
          if (matchedMill) {
            colorName = matchedMill.name;
            colorHex = matchedMill.hex;
          }
          packagesCount = activePcs;
          weightPerPackageKg = activeWtPerPkg;
          grossWeightKg = activeGross;
          netWeightKg = activeNet;
          tareWeightKg = activeTare;
          manufacturer = manufacturer || 'OSTER INDIA PVT LTD';
          countryOfOrigin = 'INDIA';
          yarnType = 'MACHINE KNITTING';
          itemQty = activeNet;
        }
      }

      const newItem: ScannedSessionItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        barcode: codeUpper,
        name,
        category: selectedCategory,
        quantity: itemQty,
        wholesalePrice: wholesalePrice,
        retailPrice: retailPrice,
        unit: unit,
        colorName,
        colorHex,
        fiberComposition: itemFiber,
        isExistingProduct: !!existingProduct,
        yarnCount,
        linearDensityTex,
        dyeLot,
        shadeCode,
        bagNumber,
        packagesCount,
        weightPerPackageKg,
        grossWeightKg,
        netWeightKg,
        tareWeightKg,
        manufacturer,
        countryOfOrigin,
        yarnType,
        invoiceRef: lockedInvoiceRef
      };

      updatedSessionItems = [newItem, ...updatedSessionItems];
      playBarcodeScanBeep(true);
      setScanFeedback({
        type: 'success',
        message: shadeCode
          ? `Intaked: Shade ${shadeCode} (${colorName}) | ${itemQty} ${unit} under Inv #${lockedInvoiceRef}`
          : `Scanned: "${name}" (+${itemQty} ${unit}) under Inv #${lockedInvoiceRef}`
      });
    }

    setScannedItems(updatedSessionItems);
    setBarcodeInput('');
    setScanQuantity(1);
  };

  // Optical scanner handler
  const handleApplyOpticalIntakeData = (output: OpticalScanOutput) => {
    const code = output.barcode || output.shadeCode || '';
    handleScanBarcode(code, {
      barcode: code,
      name: output.colorName ? `${selectedCategory} - ${output.colorName} (${output.shadeCode || code})` : `${selectedCategory} - ${code}`,
      shadeCode: output.shadeCode,
      colorName: output.colorName,
      colorHex: output.colorHex,
      dyeLot: output.dyeLot,
      quantity: output.netWeightKg || (selectedCategory === 'Yarns' ? (yarnNetWeightKg > 0 ? yarnNetWeightKg : 24.000) : 1),
      fiberComposition: output.fiberComposition || currentPreset.defaultComposition,
      yarnCount: selectedCategory === 'Yarns' ? (output.yarnCount || '2/24 NM') : undefined,
      packagesCount: selectedCategory === 'Yarns' ? (output.packagesCount || yarnPackagesCount) : undefined,
      tareWeightKg: selectedCategory === 'Yarns' ? (output.tareWeightKg || yarnTareWeightKg) : undefined,
      netWeightKg: selectedCategory === 'Yarns' ? (output.netWeightKg || yarnNetWeightKg) : undefined,
      grossWeightKg: selectedCategory === 'Yarns' ? (output.grossWeightKg || yarnGrossWeightKg) : undefined
    });
  };

  // Modify scanned item in manifest
  const handleRemoveItem = (itemId: string) => {
    playClickSound();
    setScannedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) return;
    setScannedItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdateItemBatchDetails = (itemId: string, updates: Partial<ScannedSessionItem>) => {
    setScannedItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  // Finalize & Commit Inventory
  const handleSaveAndFinalize = () => {
    if (scannedItems.length === 0) {
      playAlertSound();
      setScanFeedback({ type: 'error', message: 'No items scanned in this session.' });
      return;
    }

    playSuccessSound();

    const res = commitCategoryIntakeSession(
      selectedCategory,
      scannedItems.map(item => ({
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        wholesalePrice: item.wholesalePrice,
        retailPrice: item.retailPrice,
        unit: item.unit,
        colorName: item.colorName,
        colorHex: item.colorHex,
        fiberComposition: item.fiberComposition,
        yarnCount: item.yarnCount,
        linearDensityTex: item.linearDensityTex,
        dyeLot: item.dyeLot,
        shadeCode: item.shadeCode,
        bagNumber: item.bagNumber,
        packagesCount: item.packagesCount,
        weightPerPackageKg: item.weightPerPackageKg,
        grossWeightKg: item.grossWeightKg,
        netWeightKg: item.netWeightKg,
        tareWeightKg: item.tareWeightKg,
        manufacturer: item.manufacturer,
        countryOfOrigin: item.countryOfOrigin,
        yarnType: item.yarnType
      })),
      targetLocation,
      lockedInvoiceRef
        ? `Product Intake for ${currentPreset.label} (Linked to Invoice #${lockedInvoiceRef} - Store: ${locations.find(l => l.id === targetLocation)?.name || targetLocation})`
        : `Product Intake for ${currentPreset.label}`
    );

    if (res.success) {
      clearCategoryIntakeDraft();
      setRecoveredIntakeInfo(null);
      setCompletionResult({
        totalQtyAdded: res.totalQtyAdded || sessionTotalUnits,
        totalCostValuationAdded: res.totalCostValuationAdded || sessionTotalCostValuation,
        totalRetailValuationAdded: res.totalRetailValuationAdded || sessionTotalRetailValuation,
        newTotalBusinessAssetCost: res.newTotalBusinessAssetCost || projectedBusinessCostValuation,
        newTotalBusinessAssetRetail: res.newTotalBusinessAssetRetail || projectedBusinessRetailValuation,
        newTotalUnits: res.newTotalUnits || projectedBusinessTotalUnits,
        targetLocationName: res.targetLocationName || (locations.find(l => l.id === targetLocation)?.name || targetLocation)
      });
    } else {
      playAlertSound();
      setScanFeedback({ type: 'error', message: res.message });
    }
  };

  const targetLocationName = locations.find(l => l.id === targetLocation)?.name || targetLocation;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-5 bg-slate-950/90 sm:bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-hidden sm:overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-rose-100/60 overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">
        <RightEdgeBlend variant="rainbow" />
        <ReflectionOverlay opacity={0.06} />

        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-3.5 sm:p-5 text-white border-b border-rose-500/20 shrink-0">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 bg-rose-600/30 border border-rose-400/40 rounded-xl sm:rounded-2xl text-amber-400 shadow-md shrink-0">
                <Barcode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="font-extrabold text-sm sm:text-lg text-white truncate">
                    Inventory Product Intake
                  </h3>
                  <span className="bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    Step-by-Step
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-200/80 mt-0.5 hidden sm:block">
                  Sequential Intake: 1. Select Invoice → 2. Select Category → 3. Set Price → 4. Scan Barcodes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isScanningAutosaved && scannedItems.length > 0 && (
                <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Auto-saved
                </span>
              )}
              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Close Intake Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Recovery banner if restoring an in-progress intake session */}
          {recoveredIntakeInfo && (
            <div
              id="banner-intake-recovered-session"
              className="mt-3 bg-amber-500/20 border border-amber-400/40 px-3.5 py-2 rounded-xl text-xs text-amber-200 font-medium flex items-center justify-between gap-3 animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  <strong>Session Restored:</strong> Resumed your in-progress intake ({recoveredIntakeInfo.count} scanned items, saved {formatDraftTimeAgo(recoveredIntakeInfo.savedAt)}).
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRecoveredIntakeInfo(null)}
                  className="px-2.5 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                >
                  Keep Session
                </button>
                <button
                  type="button"
                  onClick={handleDiscardRecoveredIntake}
                  className="px-2.5 py-1 text-xs font-medium text-amber-200 hover:text-rose-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Discard &amp; Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Sequential Stepper Navigation Bar */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold">
              {/* Step 1 Tab */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setCurrentStep(1);
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40 font-black'
                    : lockedInvoiceRef
                    ? 'bg-white/10 text-emerald-300 hover:bg-white/15'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                  currentStep === 1 ? 'bg-white text-rose-700 font-black' : lockedInvoiceRef ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                }`}>
                  {lockedInvoiceRef ? '✓' : '1'}
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">1. </span>Invoice
                </span>
              </button>

              {/* Step 2 Tab */}
              <button
                type="button"
                disabled={!lockedInvoiceRef}
                onClick={() => {
                  if (lockedInvoiceRef) {
                    playClickSound();
                    setCurrentStep(2);
                  }
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-all ${
                  !lockedInvoiceRef
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : currentStep === 2
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40 font-black cursor-pointer'
                    : 'bg-white/10 text-emerald-300 hover:bg-white/15 cursor-pointer'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                  currentStep === 2 ? 'bg-white text-rose-700 font-black' : lockedInvoiceRef && currentStep > 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                }`}>
                  {lockedInvoiceRef && currentStep > 2 ? '✓' : '2'}
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">2. </span>Category
                </span>
              </button>

              {/* Step 3 Tab */}
              <button
                type="button"
                disabled={!lockedInvoiceRef}
                onClick={() => {
                  if (lockedInvoiceRef) {
                    playClickSound();
                    setCurrentStep(3);
                  }
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-all ${
                  !lockedInvoiceRef
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : currentStep === 3
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40 font-black cursor-pointer'
                    : currentStep > 3
                    ? 'bg-white/10 text-emerald-300 hover:bg-white/15 cursor-pointer'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                  currentStep === 3 ? 'bg-white text-rose-700 font-black' : currentStep > 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                }`}>
                  {currentStep > 3 ? '✓' : '3'}
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">3. </span>Set Price
                </span>
              </button>

              {/* Step 4 Tab */}
              <button
                type="button"
                disabled={!lockedInvoiceRef}
                onClick={() => {
                  if (lockedInvoiceRef) {
                    playClickSound();
                    setCurrentStep(4);
                  }
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-all ${
                  !lockedInvoiceRef
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : currentStep === 4
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40 font-black cursor-pointer'
                    : scannedItems.length > 0
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                  currentStep === 4 ? 'bg-white text-rose-700 font-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  4
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">4. </span>Scan
                  {scannedItems.length > 0 && ` (${scannedItems.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Feedback Banner */}
          {scanFeedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                scanFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : scanFeedback.type === 'info'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* COMPLETION RECEIPT VIEW */}
          {completionResult ? (
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl p-5 sm:p-8 space-y-5 text-center shadow-lg">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl ring-4 ring-emerald-400/30">
                <Check className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Category Inventory Intake Completed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {completionResult.totalQtyAdded} {unit} of {currentPreset.label} received under Invoice #{lockedInvoiceRef || 'N/A'}.
                </p>
                <p className="text-xs font-bold text-emerald-700">
                  Allocated to {completionResult.targetLocationName} and synchronized with double-entry financial ledger.
                </p>
              </div>

              {/* Valuation Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    Session Inward Valuation
                  </span>
                  <span className="text-lg font-mono font-black text-rose-700 block">
                    +KSh {completionResult.totalCostValuationAdded.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Retail Worth: +KSh {completionResult.totalRetailValuationAdded.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    Target Warehouse
                  </span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {completionResult.targetLocationName}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Stock count refreshed
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    New Business Asset Total
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-800 block">
                    KSh {completionResult.newTotalBusinessAssetCost.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Across {completionResult.newTotalUnits.toLocaleString()} units
                  </span>
                </div>
              </div>

              {/* Post-Intake Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setCompletionResult(null);
                    setScannedItems([]);
                    setCurrentStep(1); // Reset to Step 1: Select Invoice!
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Another Product Intake</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done &amp; Return to Catalog</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================ */}
              {/* STEP 1: SELECT INVOICE                                       */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-black">
                          1
                        </span>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">
                          Step 1: Select Incoming Commercial / Supplier Invoice
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 pl-8">
                        Every barcode scanned must be legally tied to an inward invoice or manifest. Store allocation will lock to the document.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreatingCustomInvoice(prev => !prev)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isCreatingCustomInvoice ? 'Close New Invoice Form' : '+ Enter New Invoice #'}</span>
                    </button>
                  </div>

                  {/* Inline New Invoice Creation Form */}
                  {isCreatingCustomInvoice && (
                    <form
                      onSubmit={handleCreateAndSelectCustomInvoice}
                      className="bg-gradient-to-r from-rose-50/70 to-amber-50/70 border-2 border-rose-300/80 p-4 rounded-2xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                          <FileText className="w-4 h-4 text-rose-600" />
                          <span>Register New Commercial Invoice / Waybill for this Intake</span>
                        </div>
                        <span className="text-[10.5px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
                          Direct Entry
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                            Invoice / SAD / Waybill # *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 26PA223 or INV-2026-09"
                            value={customInvoiceForm.invoiceNumber}
                            onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, invoiceNumber: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                            Supplier / Manufacturer *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Zhejiang Puan Textile"
                            value={customInvoiceForm.supplierName}
                            onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, supplierName: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                            Customs / eTIMS Ref (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 26EMKIM400981244"
                            value={customInvoiceForm.customsEntryNo}
                            onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, customsEntryNo: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                            Destination Warehouse *
                          </label>
                          <select
                            value={customInvoiceForm.destinationLocationId}
                            onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, destinationLocationId: e.target.value as LocationId })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                          >
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingCustomInvoice(false)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Use This Invoice &amp; Proceed</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search and Filter Row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={invoiceSearchQuery}
                        onChange={e => setInvoiceSearchQuery(e.target.value)}
                        placeholder="Search invoice number, supplier, customs entry..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {(['all', 'import', 'local', 'delivery'] as const).map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setInvoiceTypeFilter(tab);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                            invoiceTypeFilter === tab
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab === 'all' ? 'All Invoices' : tab === 'import' ? 'Overseas Imports' : tab === 'local' ? 'Local Purchases' : 'Waybills'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {filteredInvoices.map(inv => {
                      const isSelected = selectedInvoiceId === inv.id || lockedInvoiceRef === inv.invoiceNumber;
                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectInvoiceForIntake(inv.id)}
                          className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                            isSelected
                              ? 'border-rose-600 bg-rose-50/70 shadow-md ring-2 ring-rose-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                                <span className="font-mono font-black text-xs text-slate-900 truncate">
                                  {inv.invoiceNumber}
                                </span>
                              </div>

                              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                                inv.type === 'import'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : inv.type === 'sad'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : inv.type === 'local'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {inv.type === 'sad' ? 'ICMS SAD' : inv.type === 'import' ? 'Import Invoice' : inv.type === 'local' ? 'Local LPS' : 'Waybill'}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-800 line-clamp-1">
                              {inv.supplierName}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              {inv.supplierCountry && <span>{inv.supplierCountry}</span>}
                              {inv.date && <span>• {inv.date}</span>}
                              {inv.customsEntryNo && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  • {inv.customsEntryNo}
                                </span>
                              )}
                            </div>

                            {(inv.createdAt || inv.createdBy) && (
                              <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100">
                                {inv.createdAt && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                    <span>{new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    {inv.createdAt.includes('T') && (
                                      <span className="font-mono text-[9px] text-slate-400">
                                        {new Date(inv.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {inv.createdBy && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[120px]" title={inv.createdBy}>By: <strong className="text-slate-700">{inv.createdBy}</strong></span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Target Store & Quantities */}
                          <div className="pt-2.5 mt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                              <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate">{inv.destinationLocationName}</span>
                            </div>

                            {inv.totalQuantity && (
                              <span className="font-mono font-bold text-[11px] text-slate-600">
                                {inv.totalQuantity.toLocaleString()} {inv.totalQuantityUnit || 'units'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">No matching invoices found.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click "+ Enter New Invoice #" above to add a custom invoice.
                      </p>
                    </div>
                  )}

                  {/* Active Selected Invoice Confirmation & Next Button */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs">
                      {lockedInvoiceRef ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900">
                            Selected Invoice: <span className="font-mono text-rose-600 font-black">{lockedInvoiceRef}</span> ({selectedInvoiceSupplier})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>Please select an invoice from above to unlock product intake.</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!lockedInvoiceRef}
                      onClick={() => {
                        playClickSound();
                        setCurrentStep(2);
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                        !lockedInvoiceRef
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white cursor-pointer active:scale-95 shadow-rose-900/20'
                      }`}
                    >
                      <span>Proceed to Step 2: Select Category</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: SELECT CATEGORY                                      */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Linked Invoice Banner */}
                  <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs border border-rose-500/20">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Inward Invoice</span>
                        <span className="font-mono font-black text-amber-300">{lockedInvoiceRef}</span>
                        <span className="text-slate-300 ml-1.5">({selectedInvoiceSupplier})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex items-center gap-1 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-amber-300" />
                        <span>Store: {targetLocationName}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setCurrentStep(1);
                        }}
                        className="text-[11px] font-bold text-rose-300 hover:text-white underline cursor-pointer"
                      >
                        Change Invoice
                      </button>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-black">
                      2
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        Step 2: Select Product Category for this Intake
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose the textile or yarn classification. Preset pricing and units apply automatically.
                      </p>
                    </div>
                  </div>

                  {/* Category Selection Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.keys(CATEGORY_PRESETS) as CategoryType[]).map(catKey => {
                      const preset = CATEGORY_PRESETS[catKey];
                      const isSelected = selectedCategory === catKey;

                      return (
                        <div
                          key={catKey}
                          onClick={() => handleCategoryChange(catKey)}
                          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                            isSelected
                              ? 'border-rose-600 bg-rose-50/70 shadow-md ring-2 ring-rose-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{preset.iconText}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${preset.badgeBg}`}>
                                {preset.category}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">{preset.label}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{preset.subTitle}</p>
                            </div>
                          </div>

                          {/* Pre-configured Wholesale and Retail Prices */}
                          <div className="pt-3 mt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Standard Cost</span>
                              <span className="font-mono font-bold text-rose-700">KSh {preset.defaultWholesalePrice.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400"> / {preset.defaultUnit}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Standard Retail</span>
                              <span className="font-mono font-bold text-emerald-700">KSh {preset.defaultRetailPrice.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400"> / {preset.defaultUnit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* YARN SPECIFIC MASS & BATCH SIZE CONTROLS */}
                  {selectedCategory === 'Yarns' && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-300/80 rounded-2xl p-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-amber-700" />
                          <div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                              <span>Yarn Bale Weight &amp; Batch Defaults</span>
                              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-md">
                                Standard 12 Cones / 24 KG Net
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Set default gross/net mass for incoming yarn bales, or switch to half batch (6 pcs) when receiving split bags.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApplyYarnBatchPreset('full')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              yarnBatchMode === 'full'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-300'
                            }`}
                          >
                            Full (12 Cones / 24kg)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyYarnBatchPreset('half')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              yarnBatchMode === 'half'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-300'
                            }`}
                          >
                            Half (6 Cones / 12kg)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
                            Net Weight (Billable) *
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.001"
                              value={yarnNetWeightKg}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setYarnNetWeightKg(val);
                                setYarnBatchMode('custom');
                              }}
                              className="w-full font-mono font-black text-slate-900 text-sm focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">KG</span>
                          </div>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
                            Gross Weight (Scale)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.001"
                              value={yarnGrossWeightKg}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setYarnGrossWeightKg(val);
                                setYarnTareWeightKg(Number((val - yarnNetWeightKg).toFixed(3)));
                                setYarnBatchMode('custom');
                              }}
                              className="w-full font-mono font-black text-slate-900 text-sm focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">KG</span>
                          </div>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
                            Tare Deduction
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.001"
                              value={yarnTareWeightKg}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setYarnTareWeightKg(val);
                                setYarnBatchMode('custom');
                              }}
                              className="w-full font-mono font-black text-rose-700 text-sm focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">KG</span>
                          </div>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">
                            Batch Cones / Pieces *
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={yarnPackagesCount}
                              onChange={e => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setYarnPackagesCount(val);
                                setYarnBatchMode('custom');
                              }}
                              className="w-full font-mono font-black text-indigo-700 text-sm focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">PCS</span>
                          </div>
                        </div>

                        <div className="bg-amber-100/60 p-2 rounded-xl border border-amber-200 flex flex-col justify-between col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-extrabold uppercase text-amber-900 block">
                            Weight Per Cone
                          </span>
                          <span className="font-mono font-black text-xs text-amber-950">
                            {yarnPackagesCount > 0 ? (yarnNetWeightKg / yarnPackagesCount).toFixed(3) : '2.000'} KG / pc
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setCurrentStep(1);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Step 1: Invoices</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setCurrentStep(3);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <span>Proceed to Step 3: Set Price</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: SET PRICE                                            */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Context Header */}
                  <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs border border-rose-500/20">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-mono font-black text-amber-300">Inv #{lockedInvoiceRef}</span>
                      </div>
                      <span className="text-slate-500">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{currentPreset.iconText}</span>
                        <span className="font-bold text-white">{currentPreset.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-amber-300" />
                        <span>Store: {targetLocationName}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setCurrentStep(2);
                        }}
                        className="text-[11px] font-bold text-rose-300 hover:text-white underline cursor-pointer"
                      >
                        Change Category
                      </button>
                    </div>
                  </div>

                  {/* Step Title */}
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-black">
                      3
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        Step 3: Set Intake Wholesale &amp; Retail Pricing
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set the cost price (recorded as inventory asset valuation) and selling price before scanning barcodes.
                      </p>
                    </div>
                  </div>

                  {/* Pricing Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wholesale Cost Card */}
                    <div className="bg-rose-50/50 border-2 border-rose-200 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-rose-900">
                          <Coins className="w-4 h-4 text-rose-600" />
                          <span>Wholesale Cost Price (Per {unit})</span>
                        </div>
                        <span className="text-[10px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                          Balance Sheet Cost
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-400 font-mono">KSh</span>
                        <input
                          type="number"
                          value={wholesalePrice}
                          onChange={e => setWholesalePrice(Math.max(0, Number(e.target.value)))}
                          className="w-full text-2xl font-mono font-black text-slate-900 bg-white border border-rose-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">/ {unit}</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        {[-50, -10, 10, 50].map(delta => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setWholesalePrice(prev => Math.max(0, prev + delta));
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug">
                        Used to capitalize inventory asset value upon receiving rolls/bales into warehouse stock.
                      </p>
                    </div>

                    {/* Retail Selling Price Card */}
                    <div className="bg-emerald-50/50 border-2 border-emerald-200 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-900">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Retail Selling Price (Per {unit})</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          POS Register Price
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-400 font-mono">KSh</span>
                        <input
                          type="number"
                          value={retailPrice}
                          onChange={e => setRetailPrice(Math.max(0, Number(e.target.value)))}
                          className="w-full text-2xl font-mono font-black text-emerald-900 bg-white border border-emerald-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">/ {unit}</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        {[-50, -10, 10, 50].map(delta => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setRetailPrice(prev => Math.max(0, prev + delta));
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug">
                        Default counter selling price applied when ringing up meters or kilograms at the sales shop.
                      </p>
                    </div>
                  </div>

                  {/* Financial Analytics & Margin Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full sm:w-auto">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Margin</span>
                        <span className="font-mono font-black text-sm text-emerald-700">
                          +KSh {unitGrossProfit} / {unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Markup Percentage</span>
                        <span className="font-mono font-black text-sm text-slate-900">
                          {profitMarginPct}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Locked Receiving Store</span>
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1 mt-0.5">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{targetLocationName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 text-right hidden md:block">
                      <span>Ready to scan rolls/bales with these locked rates.</span>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setCurrentStep(2);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Step 2: Category</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSuccessSound();
                        setCurrentStep(4);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Confirm Prices &amp; Start Scanning Barcodes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: SCAN BARCODES UNDER THAT INVOICE                     */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Governance & Configuration Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-rose-500/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Invoice</span>
                        <span className="font-mono font-black text-amber-300 truncate block">#{lockedInvoiceRef}</span>
                        <span className="text-[10.5px] text-slate-400 truncate block">{selectedInvoiceSupplier}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Allocation</span>
                        <span className="font-bold text-white flex items-center gap-1 truncate mt-0.5">
                          <Lock className="w-3 h-3 text-amber-300" />
                          <span>{targetLocationName}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                        <span className="font-bold text-rose-300 block truncate">{currentPreset.label}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Intake Pricing</span>
                        <span className="font-mono font-bold text-slate-200 block text-[11px]">
                          Cost: KSh {wholesalePrice} | Ret: KSh {retailPrice}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setCurrentStep(3);
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-rose-200 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Setup</span>
                    </button>
                  </div>

                  {/* Mill Shade Swatches & Optical Eyedropper Bar */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Palette className="w-3.5 h-3.5 text-rose-600" />
                        <span>Standard Mill Shades &amp; Dye Swatches ({selectedCategory})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setIsOpticalScannerOpen(true);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200"
                      >
                        <Pipette className="w-3 h-3 text-rose-500" />
                        <span>Open Camera Eyedropper</span>
                      </button>
                    </div>

                    {/* Horizontal Scrollable Swatch Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      {MILL_SHADE_CATALOG.filter(s => s.category === 'All' || s.category === selectedCategory).slice(0, 10).map(shade => (
                        <button
                          key={shade.code}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            handleScanBarcode(shade.code, {
                              barcode: shade.code,
                              shadeCode: shade.code,
                              colorName: shade.name,
                              colorHex: shade.hex,
                              dyeLot: shade.defaultDyeLot,
                              tareWeightKg: shade.standardTareKg,
                              packagesCount: yarnPackagesCount || 12
                            });
                          }}
                          title={`Click to intake ${shade.name} (${shade.code})`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer shrink-0 shadow-2xs group"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs group-hover:scale-110 transition-transform shrink-0"
                            style={{ backgroundColor: shade.hex }}
                          />
                          <span className="font-mono font-bold text-[11px] text-slate-800 group-hover:text-rose-700">
                            {shade.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
                            {shade.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Barcode Scanner Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleScanBarcode();
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <div className="relative flex-1">
                      <Barcode className="w-5 h-5 text-rose-600 absolute left-3 top-2.5" />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        placeholder={`Scan barcode / Shade Code for Invoice #${lockedInvoiceRef}...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-gradient-to-r from-rose-50/40 to-slate-50 border-2 border-rose-300 focus:border-rose-600 rounded-2xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl px-3 py-1">
                        <span className="text-xs font-bold text-slate-500 mr-2">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={scanQuantity}
                          onChange={e => setScanQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-14 bg-transparent font-mono font-bold text-slate-900 text-center text-sm focus:outline-none"
                        />
                        <span className="text-[11px] text-slate-500 ml-1 font-medium">{unit}</span>
                      </div>

                      <button
                        type="button"
                        id="btn-category-open-camera-scanner"
                        onClick={() => {
                          playClickSound();
                          setIsOpticalScannerOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-600 hover:to-cyan-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ring-2 ring-cyan-400/20"
                        title="Open Live Camera Scanner (Captures Lot, Shade, and Mass)"
                      >
                        <Camera className="w-4 h-4 text-cyan-200" />
                        <span className="hidden sm:inline">Camera (Lot, Shade, Mass)</span>
                        <span className="sm:hidden">Camera</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Scan className="w-4 h-4" />
                        <span>Intake Scan</span>
                      </button>
                    </div>
                  </form>

                  {/* Quick Tag Simulators for instant testing */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500 py-0.5 scrollbar-thin">
                    <span className="font-bold text-slate-400 shrink-0">Sample Mill Barcodes:</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleScanBarcode('MIX GREY-4251', {
                          barcode: '26E081',
                          shadeCode: 'MIX GREY-4251',
                          colorName: 'Mix Grey (Melange 4251)',
                          colorHex: '#94A3B8',
                          dyeLot: '26E081',
                          quantity: 24.00,
                          netWeightKg: 24.00,
                          grossWeightKg: 24.84,
                          tareWeightKg: 0.84,
                          packagesCount: 12
                        });
                      }}
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200 font-mono text-[10.5px] cursor-pointer shrink-0 transition-colors"
                    >
                      🏷️ Mix Grey 4251 (Lot 26E081 • 24kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleScanBarcode('NAVY-108', {
                          barcode: '26E112',
                          shadeCode: 'NAVY-108',
                          colorName: 'Midnight Navy',
                          colorHex: '#1E3A8A',
                          dyeLot: '26E112',
                          quantity: 24.00,
                          netWeightKg: 24.00,
                          grossWeightKg: 24.84,
                          tareWeightKg: 0.84,
                          packagesCount: 12
                        });
                      }}
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200 font-mono text-[10.5px] cursor-pointer shrink-0 transition-colors"
                    >
                      🏷️ Navy-108 (Lot 26E112 • 24kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleScanBarcode('MAROON-88', {
                          barcode: '26E044',
                          shadeCode: 'MAROON-88',
                          colorName: 'Royal Maroon',
                          colorHex: '#881337',
                          dyeLot: '26E044',
                          quantity: 24.00,
                          netWeightKg: 24.00,
                          grossWeightKg: 24.84,
                          tareWeightKg: 0.84,
                          packagesCount: 12
                        });
                      }}
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200 font-mono text-[10.5px] cursor-pointer shrink-0 transition-colors"
                    >
                      🏷️ Maroon-88 (Lot 26E044 • 24kg)
                    </button>
                  </div>

                  {/* Scanned Items Session Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-rose-600" />
                        <span>Scanned Manifest ({scannedItems.length} items, {sessionTotalUnits} {unit})</span>
                        <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Inv #{lockedInvoiceRef}
                        </span>
                      </div>
                      {scannedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setScannedItems([]);
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Manifest</span>
                        </button>
                      )}
                    </div>

                    {scannedItems.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
                        <Barcode className="w-10 h-10 text-slate-300 mx-auto" />
                        <h5 className="font-bold text-slate-700 text-xs sm:text-sm">
                          Scanner Ready for Invoice #{lockedInvoiceRef}
                        </h5>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Use a mobile camera, handheld barcode scanner, or sample tags above. Items with Shade, Dye Lot, and Mass will appear here in real time.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3">Shade &amp; Color</th>
                              <th className="py-2.5 px-3">Dye Lot No</th>
                              <th className="py-2.5 px-3 text-center">Mass / Quantity</th>
                              <th className="py-2.5 px-3 text-right">Cost Value</th>
                              <th className="py-2.5 px-3 text-right">Retail Worth</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {scannedItems.map((item) => (
                              <tr key={item.id} className="hover:bg-rose-50/40 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    {item.colorHex && (
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                        style={{ backgroundColor: item.colorHex }}
                                      />
                                    )}
                                    <div>
                                      <span className="font-bold text-slate-900 block">{item.name}</span>
                                      {item.shadeCode && (
                                        <span className="text-[10px] text-rose-700 font-mono font-bold">
                                          Shade: {item.shadeCode}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 font-mono text-[11px]">
                                  {item.dyeLot ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300 text-xs">
                                      Lot {item.dyeLot}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">{item.barcode}</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      value={item.quantity}
                                      onChange={e => handleUpdateItemQuantity(item.id, Number(e.target.value))}
                                      className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-900"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                                  KSh {(item.quantity * item.wholesalePrice).toLocaleString()}
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                  KSh {(item.quantity * item.retailPrice).toLocaleString()}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Remove item from session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Session Computation Bar */}
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-4 rounded-2xl text-white shadow-md border border-rose-500/20">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Items Scanned</span>
                        <span className="text-lg font-mono font-black text-amber-400">+{sessionTotalUnits} {unit}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">({scannedItems.length} distinct barcodes)</span>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wholesale Asset Value Added</span>
                        <span className="text-lg font-mono font-black text-rose-300">+KSh {sessionTotalCostValuation.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Retail: +KSh {sessionTotalRetailValuation.toLocaleString()}</span>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projected Total Business Assets</span>
                        <span className="text-lg font-mono font-black text-emerald-400">
                          KSh {projectedBusinessCostValuation.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Total Units: {projectedBusinessTotalUnits.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Footer Commit Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setCurrentStep(3);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Step 3: Pricing</span>
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            onClose();
                          }}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveAndFinalize}
                          disabled={scannedItems.length === 0}
                          className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                            scannedItems.length === 0
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95 shadow-emerald-900/20'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Save &amp; Finalize Product Intake ({sessionTotalUnits} {unit})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Optical Textile Shade & Barcode Camera Scanner Modal */}
      <OpticalShadeScannerModal
        isOpen={isOpticalScannerOpen}
        onClose={() => setIsOpticalScannerOpen(false)}
        onApplyIntakeData={handleApplyOpticalIntakeData}
        activeCategory={selectedCategory}
      />
    </div>
  );
};
