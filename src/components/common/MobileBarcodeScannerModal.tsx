import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useERP } from '../../context/ERPContext';
import { CategoryType, LocationId, UnitType, ProductBatch } from '../../types';
import { playBarcodeScanBeep, playScannerErrorBeep, playSuccessSound, playAlertSound } from '../../utils/audio';
import ReflectionOverlay from './ReflectionOverlay';
import RightEdgeBlend from './RightEdgeBlend';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import {
  PRESET_INVOICE_26PA222,
  PRESET_SAD_26EMKIM400968589,
  PRESET_SAD_UDEY_UDYOG,
  PRESET_FLEECE_CONTAINER
} from '../../utils/importCostingEngine';
import { PRESET_LPS_RIVATEX } from '../../utils/localPurchaseCostingEngine';
import { CATEGORY_PRESETS } from '../inventory/CategoryIntakeModal';
import {
  parseMillLabelPayload,
  findMillShadeByQuery,
  MILL_SHADE_CATALOG,
  MillShadeRecord
} from '../../utils/textileShadeEngine';
import {
  X,
  Camera,
  Barcode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Store,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  SwitchCamera,
  Keyboard,
  Maximize2,
  Minimize2,
  PackageCheck,
  Volume2,
  Search,
  Check,
  Tag,
  Box,
  DollarSign,
  RotateCcw,
  Scale,
  FileText,
  PackagePlus,
  TrendingUp,
  Plus,
  Building2,
  Calendar,
  Package
} from 'lucide-react';

export type WizardStep = 1 | 2 | 3 | 4;

export interface InwardInvoiceOption {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  customsEntryNo?: string;
  destinationLocationId: LocationId;
  destinationLocationName: string;
  totalQuantity?: number;
  totalQuantityUnit?: 'meter' | 'kg';
  totalLandedCostKES?: number;
  date: string;
  type: 'sad' | 'import' | 'local' | 'delivery';
  suggestedCategory?: CategoryType;
}

export interface ScannedRollRecord {
  barcode: string;
  name: string;
  category: CategoryType;
  colorName: string;
  colorHex?: string;
  shadeCode?: string;
  dyeLot?: string;
  shadeSource?: string;
  retailPrice: number;
  costPrice: number;
  qty: number;
  unit: UnitType;
  locationId: LocationId;
  invoiceRef?: string;
  time: string;
}

export interface DetectedShadeResult {
  colorName: string;
  colorHex: string;
  shadeCode: string;
  dyeLot?: string;
  sourceLabel: string;
}

/**
 * Intelligent shade detection engine that extracts or deterministically maps
 * mill shade, dye lot, and color hex directly from the scanned barcode.
 */
export const autoDetectShadeFromBarcode = (
  cleanBarcode: string,
  category: CategoryType,
  existingProducts: ProductBatch[]
): DetectedShadeResult => {
  if (!cleanBarcode) {
    return {
      colorName: 'Standard Neutral',
      colorHex: '#64748b',
      shadeCode: 'STD-001',
      sourceLabel: 'Default'
    };
  }

  const bUpper = cleanBarcode.toUpperCase();

  // 1. Direct Inventory Lookup: Match by existing barcode, sku, or batch id
  const existing = existingProducts.find(p =>
    (p.barcode && p.barcode.trim().toUpperCase() === bUpper) ||
    (p.sku && p.sku.trim().toUpperCase() === bUpper) ||
    (p.id && p.id.trim().toUpperCase() === bUpper)
  );
  if (existing && existing.colorName) {
    return {
      colorName: existing.colorName,
      colorHex: existing.colorHex || '#1e3a8a',
      shadeCode: existing.shadeCode || existing.colorName.toUpperCase(),
      dyeLot: existing.dyeLot,
      sourceLabel: 'Inventory Record Match'
    };
  }

  // 2. Optical / Mill Label Payload parser (handles high-density QR or OCR text)
  const parsed = parseMillLabelPayload(cleanBarcode);
  if (parsed && (parsed.shadeCode || parsed.colorName)) {
    const catalogMatch = parsed.shadeCode ? findMillShadeByQuery(parsed.shadeCode) : undefined;
    return {
      colorName: parsed.colorName || catalogMatch?.name || parsed.shadeCode || 'Mill Standard Shade',
      colorHex: parsed.colorHex || catalogMatch?.hex || '#1e3a8a',
      shadeCode: parsed.shadeCode || catalogMatch?.code || cleanBarcode.toUpperCase(),
      dyeLot: parsed.dyeLot || catalogMatch?.defaultDyeLot,
      sourceLabel: 'Mill Label QR / OCR'
    };
  }

  // 3. Mill Shade Catalog Query lookup (matches codes, numeric tags, dye lots)
  const catalogMatch = findMillShadeByQuery(cleanBarcode);
  if (catalogMatch) {
    return {
      colorName: catalogMatch.name,
      colorHex: catalogMatch.hex,
      shadeCode: catalogMatch.code,
      dyeLot: catalogMatch.defaultDyeLot,
      sourceLabel: 'Mill Shade Catalog'
    };
  }

  // 4. Token & Keyword analysis from barcode string
  const KNOWN_TOKENS: Array<{
    keywords: string[];
    name: string;
    hex: string;
    code: string;
  }> = [
    { keywords: ['3061', 'BLACK', 'BLK', 'JET BLACK', 'NOIR'], name: 'Black 3061', hex: '#0a0a0a', code: 'BLACK 3061' },
    { keywords: ['3075', 'NEW NAVY', 'NAVY KK', 'NAVY', 'NVY', 'MIDNIGHT'], name: 'New Navy 3075', hex: '#1e3a8a', code: 'NEW NAVY-3075' },
    { keywords: ['3059', 'MAROON', 'BURGUNDY', 'WINE', 'MAR', 'BORDEAUX'], name: 'Maroon 3059', hex: '#7f1d1d', code: 'MAROON-3059' },
    { keywords: ['4551', 'GREEN', 'EMERALD', 'BOTTLE', 'GRN', 'FOREST'], name: 'Green 4551', hex: '#14532d', code: 'GREEN-4551' },
    { keywords: ['3025', 'RED', 'CRIMSON', 'SCARLET', 'ROUGE'], name: 'Red 3025', hex: '#dc2626', code: 'RED-3025' },
    { keywords: ['4251', 'MIX GREY', 'MELANGE', 'GREY', 'GRAY', 'CHARCOAL', 'GRY', 'ASH'], name: 'Mix Grey 4251', hex: '#64748b', code: 'MIX GREY-4251' },
    { keywords: ['4930', 'BEIGE', 'OATMEAL', 'CAMEL', 'SAND', 'BEI', 'TAN'], name: 'Beige 4930', hex: '#d4b996', code: 'BEIGE-4930' },
    { keywords: ['OLIVE', 'ASKARI', 'ARMY', 'KHAKI', 'KHK', 'OLV'], name: 'Askari Olive', hex: '#4d5d36', code: 'ASKARI OLIVE' },
    { keywords: ['4412', 'BROWN', 'CHOCOLATE', 'COFFEE', 'BRN', 'ESPRESSO'], name: 'Brown 4412', hex: '#451a03', code: 'BROWN-4412' },
    { keywords: ['4515', 'NAVY-4515M', '4515M'], name: 'Navy 4515M', hex: '#0f172a', code: 'NAVY-4515M' },
    { keywords: ['ROYAL', 'SAPPHIRE', 'COBALT', 'BLUE', 'BLU'], name: 'Royal Blue', hex: '#1d4ed8', code: 'ROYAL BLUE' },
    { keywords: ['YELLOW', 'MUSTARD', 'GOLD', 'YLW', 'GLD', 'AMBER'], name: 'Mustard Gold', hex: '#d97706', code: 'MUSTARD GOLD' },
    { keywords: ['WHITE', 'OPTICAL', 'IVORY', 'SNOW', 'BLANC', 'WHT'], name: 'Optical White', hex: '#f8fafc', code: 'WHITE' },
    { keywords: ['PURPLE', 'VIOLET', 'LILAC', 'PLUM', 'PRP'], name: 'Imperial Purple', hex: '#6b21a8', code: 'PURPLE' },
    { keywords: ['TEAL', 'TURQUOISE', 'AQUA', 'CYAN', 'TL'], name: 'Peacock Teal', hex: '#0f766e', code: 'TEAL' },
    { keywords: ['ORANGE', 'RUST', 'TERRACOTTA', 'ORG'], name: 'Rust Orange', hex: '#c2410c', code: 'RUST ORANGE' },
    { keywords: ['PINK', 'ROSE', 'BLUSH', 'CORAL', 'PNK'], name: 'Rose Quartz Pink', hex: '#db2777', code: 'PINK' }
  ];

  for (const t of KNOWN_TOKENS) {
    if (t.keywords.some(k => bUpper.includes(k))) {
      return {
        colorName: t.name,
        colorHex: t.hex,
        shadeCode: t.code,
        dyeLot: `LOT-${cleanBarcode.replace(/[^A-Z0-9]/gi, '').slice(-6) || '2026'}`,
        sourceLabel: `Barcode Token "${t.code}"`
      };
    }
  }

  // 5. Deterministic Textile Mill Palette Hashing for numeric / arbitrary barcodes
  const CATEGORY_PALETTES: Record<CategoryType, Array<{ name: string; hex: string; code: string; defaultDyeLot?: string }>> = {
    Dereck: [
      { name: 'Midnight Navy 3075', hex: '#1e3a8a', code: 'NEW NAVY-3075', defaultDyeLot: '26C001' },
      { name: 'Black 3061', hex: '#0a0a0a', code: 'BLACK 3061', defaultDyeLot: '26B020' },
      { name: 'Royal Burgundy 3059', hex: '#7f1d1d', code: 'MAROON-3059', defaultDyeLot: '26C002' },
      { name: 'Mix Grey (Melange 4251)', hex: '#64748b', code: 'MIX GREY-4251', defaultDyeLot: '26E081' },
      { name: 'Askari Olive Green', hex: '#4d5d36', code: 'ASKARI OLIVE', defaultDyeLot: '26C008' },
      { name: 'Beige 4930', hex: '#d4b996', code: 'BEIGE-4930', defaultDyeLot: '26C004' },
      { name: 'Chocolate Brown 4412', hex: '#451a03', code: 'BROWN-4412', defaultDyeLot: '26C009' },
      { name: 'Crimson Red 3025', hex: '#dc2626', code: 'RED-3025', defaultDyeLot: '26C003' },
      { name: 'Deep Forest Green 4551', hex: '#14532d', code: 'GREEN-4551', defaultDyeLot: '26C007' },
      { name: 'Royal Sapphire Blue', hex: '#1d4ed8', code: 'ROYAL BLUE', defaultDyeLot: '26C010' }
    ],
    Fleece: [
      { name: 'Alpine Crimson Red 3025', hex: '#dc2626', code: 'RED-3025', defaultDyeLot: '26C003' },
      { name: 'Polar Navy 3075', hex: '#1e3a8a', code: 'NEW NAVY-3075', defaultDyeLot: '26C001' },
      { name: 'Charcoal Heather Melange 4251', hex: '#475569', code: 'MIX GREY-4251', defaultDyeLot: '26E081' },
      { name: 'Hunter Green 4551', hex: '#14532d', code: 'GREEN-4551', defaultDyeLot: '26C007' },
      { name: 'Snow Optical White', hex: '#f8fafc', code: 'WHITE', defaultDyeLot: '26W001' },
      { name: 'Burgundy Wine 3059', hex: '#7f1d1d', code: 'MAROON-3059', defaultDyeLot: '26C002' },
      { name: 'Golden Mustard', hex: '#d97706', code: 'MUSTARD GOLD', defaultDyeLot: '26G005' },
      { name: 'Deep Jet Black 3061', hex: '#0a0a0a', code: 'BLACK 3061', defaultDyeLot: '26B020' }
    ],
    Yarns: [
      { name: 'Black 3061', hex: '#0a0a0a', code: 'BLACK 3061', defaultDyeLot: '26B020' },
      { name: 'Maroon 3059', hex: '#7f1d1d', code: 'MAROON-3059', defaultDyeLot: '26C002' },
      { name: 'Green 4551', hex: '#14532d', code: 'GREEN-4551', defaultDyeLot: '26C007' },
      { name: 'New Navy 3075', hex: '#1e3a8a', code: 'NEW NAVY-3075', defaultDyeLot: '26C001' },
      { name: 'Mix Grey 4251', hex: '#64748b', code: 'MIX GREY-4251', defaultDyeLot: '26E081' },
      { name: 'Red 3025', hex: '#dc2626', code: 'RED-3025', defaultDyeLot: '26C003' },
      { name: 'Navy KK', hex: '#0f172a', code: 'NAVY KK', defaultDyeLot: '26C006' },
      { name: 'Beige 4930', hex: '#d4b996', code: 'BEIGE-4930', defaultDyeLot: '26C004' },
      { name: 'Askari Olive', hex: '#4d5d36', code: 'ASKARI OLIVE', defaultDyeLot: '26C005' },
      { name: 'Brown 4412', hex: '#451a03', code: 'BROWN-4412', defaultDyeLot: '26C009' }
    ]
  };

  const palette = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.Dereck;
  let hash = 0;
  for (let i = 0; i < cleanBarcode.length; i++) {
    hash = (hash * 31 + cleanBarcode.charCodeAt(i)) & 0xffffffff;
  }
  const selected = palette[Math.abs(hash) % palette.length];
  return {
    colorName: selected.name,
    colorHex: selected.hex,
    shadeCode: selected.code,
    dyeLot: selected.defaultDyeLot || `LOT-${cleanBarcode.slice(-4) || '2026'}`,
    sourceLabel: 'Auto-Picked from Barcode'
  };
};

export const MobileBarcodeScannerModal: React.FC = () => {
  const {
    isMobileBarcodeScannerOpen,
    setIsMobileBarcodeScannerOpen,
    scanToAddProduct,
    restockExistingProduct,
    duplicateAlertState,
    dismissDuplicateAlert,
    locations,
    activeLocation,
    products,
    inwardInvoices,
    deliveries,
    brandSettings,
    setIsStockLedgerReconcileOpen
  } = useERP();

  // WIZARD STEP STATE: 1: Invoice -> 2: Category -> 3: Price -> 4: Scan & Add
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // STEP 1: INVOICE SELECTION STATE
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('PRESET-SAD-26EMKIM');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'import' | 'local' | 'delivery'>('all');
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation);
  
  // Custom Invoice Creator Toggle
  const [isCreatingCustomInvoice, setIsCreatingCustomInvoice] = useState<boolean>(false);
  const [customInvoiceNum, setCustomInvoiceNum] = useState<string>('');
  const [customSupplier, setCustomSupplier] = useState<string>('');
  const [customExpectedQty, setCustomExpectedQty] = useState<number>(500);

  // STEP 2: CATEGORY SELECTION STATE (Shade is auto-picked directly from barcode)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Dereck');
  const [unit, setUnit] = useState<UnitType>('meter');
  const [fiberComposition, setFiberComposition] = useState<string>('100% Superfine Dereec Weave');

  // STEP 3: PRICE & BATCH QUANTITY CONFIGURATION STATE
  const [wholesalePrice, setWholesalePrice] = useState<number>(220);
  const [retailPrice, setRetailPrice] = useState<number>(230);
  const [costPrice, setCostPrice] = useState<number>(148);
  const [rollQuantity, setRollQuantity] = useState<number>(50);

  // STEP 4: SCANNING ENGINE & REAL-TIME AUTO-ADD STATE
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);

  // Session Results & Auto-Add Live Feed
  const [sessionScannedList, setSessionScannedList] = useState<ScannedRollRecord[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'error';
    text: string;
    barcode: string;
    product?: any;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const scannerContainerId = 'mobile-barcode-wizard-reader-view';

  // Aggregated Invoices for Step 1
  const allInvoicesList = useMemo<InwardInvoiceOption[]>(() => {
    const list: InwardInvoiceOption[] = [];
    const addedInvoiceKeys = new Set<string>();

    // 1. Preset SAD customs entries
    list.push({
      id: 'PRESET-SAD-26EMKIM',
      invoiceNumber: '26EMKIM400968589',
      supplierName: 'ZHEJIANG PUAN TEXTILE / ICMS SAD RECONCILED',
      customsEntryNo: '26EMKIM400968589',
      destinationLocationId: 'main_store',
      destinationLocationName: 'Main Store (Nairobi Hub)',
      totalQuantity: 22600,
      totalQuantityUnit: 'kg',
      totalLandedCostKES: 4972000,
      date: '2026-06-15',
      type: 'sad',
      suggestedCategory: 'Dereck'
    });
    addedInvoiceKeys.add('26EMKIM400968589');

    // 2. Preset Commercial Invoices
    list.push({
      id: 'PRESET-INV-26PA222',
      invoiceNumber: PRESET_INVOICE_26PA222.invoiceNumber,
      supplierName: PRESET_INVOICE_26PA222.supplierName,
      destinationLocationId: 'main_store',
      destinationLocationName: 'Main Store (Nairobi Hub)',
      totalQuantity: 58000,
      totalQuantityUnit: 'meter',
      totalLandedCostKES: 12760000,
      date: '2026-06-12',
      type: 'import',
      suggestedCategory: 'Dereck'
    });
    addedInvoiceKeys.add(PRESET_INVOICE_26PA222.invoiceNumber.toUpperCase());

    // 3. Preset Fleece Container
    list.push({
      id: 'PRESET-FLEECE-CONT',
      invoiceNumber: PRESET_FLEECE_CONTAINER.invoiceNumber,
      supplierName: PRESET_FLEECE_CONTAINER.supplierName,
      destinationLocationId: 'main_store',
      destinationLocationName: 'Main Store (Nairobi Hub)',
      totalQuantity: 15000,
      totalQuantityUnit: 'meter',
      totalLandedCostKES: 6600000,
      date: '2026-04-10',
      type: 'import',
      suggestedCategory: 'Fleece'
    });
    addedInvoiceKeys.add(PRESET_FLEECE_CONTAINER.invoiceNumber.toUpperCase());

    // 4. Preset Local Purchase LPS
    list.push({
      id: 'PRESET-LPS-RIVATEX',
      invoiceNumber: PRESET_LPS_RIVATEX.invoiceNumber,
      supplierName: PRESET_LPS_RIVATEX.supplierName,
      destinationLocationId: 'sales_shop',
      destinationLocationName: 'Sales Shop (Retail Floor)',
      totalQuantity: 5000,
      totalQuantityUnit: 'meter',
      totalLandedCostKES: 1050000,
      date: '2026-05-20',
      type: 'local',
      suggestedCategory: 'Dereck'
    });
    addedInvoiceKeys.add(PRESET_LPS_RIVATEX.invoiceNumber.toUpperCase());

    // 5. Inward Invoices from ERP Context
    (inwardInvoices || []).forEach(inv => {
      const key = inv.invoiceNumber.toUpperCase();
      if (!addedInvoiceKeys.has(key)) {
        addedInvoiceKeys.add(key);
        const locName = locations.find(l => l.id === inv.destinationLocation)?.name || inv.destinationLocation;
        list.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          supplierName: inv.supplierName,
          customsEntryNo: inv.customsOrEtimsRef,
          destinationLocationId: inv.destinationLocation,
          destinationLocationName: locName,
          totalQuantity: inv.totalQuantity || (inv.lineItems ? inv.lineItems.reduce((acc, li) => acc + (Number(li.quantity) || 0), 0) : undefined),
          totalQuantityUnit: (inv.totalQuantityUnit === 'kg' ? 'kg' : 'meter') as 'meter' | 'kg',
          totalLandedCostKES: inv.totalAmountKES,
          date: inv.invoiceDate,
          type: inv.supplyType === 'local' ? 'local' : 'import',
          suggestedCategory: inv.lineItems?.[0]?.category as CategoryType
        });
      }
    });

    // 6. Delivery notes from context
    (deliveries || []).forEach(del => {
      const key = (del.consignmentNo || del.id).toUpperCase();
      if (!addedInvoiceKeys.has(key)) {
        addedInvoiceKeys.add(key);
        const locName = locations.find(l => l.id === del.destinationLocation)?.name || del.destinationLocation;
        list.push({
          id: `DEL-${del.id}`,
          invoiceNumber: del.consignmentNo || del.id,
          supplierName: del.supplierName,
          destinationLocationId: del.destinationLocation,
          destinationLocationName: locName,
          totalQuantity: del.totalExpectedQty,
          totalQuantityUnit: 'meter',
          date: new Date().toISOString().split('T')[0],
          type: 'delivery'
        });
      }
    });

    return list;
  }, [inwardInvoices, deliveries, locations]);

  // Filtered invoices in Step 1
  const filteredInvoices = useMemo(() => {
    return allInvoicesList.filter(inv => {
      if (invoiceTypeFilter === 'import' && inv.type !== 'import' && inv.type !== 'sad') return false;
      if (invoiceTypeFilter === 'local' && inv.type !== 'local') return false;
      if (invoiceTypeFilter === 'delivery' && inv.type !== 'delivery') return false;

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

  // Currently Selected Invoice Object
  const selectedInvoice = useMemo(() => {
    return allInvoicesList.find(inv => inv.id === selectedInvoiceId) || allInvoicesList[0];
  }, [allInvoicesList, selectedInvoiceId]);

  // Reset wizard flow when modal opens
  useEffect(() => {
    if (isMobileBarcodeScannerOpen) {
      setIsMinimized(false);
      setLastScanResult(null);
      // Ensure target location matches active location or selected invoice
      if (selectedInvoice) {
        setTargetLocation(selectedInvoice.destinationLocationId || activeLocation);
      }
    }
  }, [isMobileBarcodeScannerOpen]);

  // Handle selecting an invoice in Step 1
  const handleSelectInvoice = (inv: InwardInvoiceOption) => {
    setSelectedInvoiceId(inv.id);
    setTargetLocation(inv.destinationLocationId || activeLocation);

    if (inv.suggestedCategory && CATEGORY_PRESETS[inv.suggestedCategory]) {
      const preset = CATEGORY_PRESETS[inv.suggestedCategory];
      setSelectedCategory(inv.suggestedCategory);
      setWholesalePrice(preset.defaultWholesalePrice);
      setRetailPrice(preset.defaultRetailPrice);
      setUnit(preset.defaultUnit);
      setFiberComposition(preset.defaultComposition);
      setRollQuantity(preset.defaultUnit === 'kg' ? 24 : 50);
      setCostPrice(Math.round(preset.defaultWholesalePrice * 0.68));
    }
  };

  // Handle selecting a category in Step 2
  const handleSelectCategory = (cat: CategoryType) => {
    setSelectedCategory(cat);
    const preset = CATEGORY_PRESETS[cat];
    if (preset) {
      setWholesalePrice(preset.defaultWholesalePrice);
      setRetailPrice(preset.defaultRetailPrice);
      setUnit(preset.defaultUnit);
      setFiberComposition(preset.defaultComposition);
      setRollQuantity(preset.defaultUnit === 'kg' ? 24 : 50);
      setCostPrice(Math.round(preset.defaultWholesalePrice * 0.68));
    }
  };

  // Camera Management for Step 4
  useEffect(() => {
    let isMounted = true;

    if (isMobileBarcodeScannerOpen && currentStep === 4) {
      const startCamera = async () => {
        try {
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (!isMounted) return;

          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
            
            const backCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') || 
              d.label.toLowerCase().includes('environment')
            );
            const chosenId = backCamera ? backCamera.id : devices[0].id;
            setSelectedCameraId(chosenId);

            const qrCodeScanner = new Html5Qrcode(scannerContainerId, {
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.ITF
              ],
              verbose: false
            });

            html5QrCodeRef.current = qrCodeScanner;

            await qrCodeScanner.start(
              chosenId,
              {
                fps: 20,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 320;
                  const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 240;
                  return {
                    width: Math.max(50, Math.floor(Math.min(safeW * 0.85, 340))),
                    height: Math.max(50, Math.floor(Math.min(safeH * 0.65, 220)))
                  };
                },
                aspectRatio: 1.333333
              },
              onBarcodeDecoded,
              () => {}
            );

            if (isMounted) {
              setCameraPermission('granted');
              setIsScanning(true);
            }
          } else {
            if (isMounted) setCameraPermission('denied');
          }
        } catch (err) {
          console.warn('Camera start error:', err);
          if (isMounted) setCameraPermission('denied');
        }
      };

      const timer = setTimeout(() => {
        startCamera();
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isMobileBarcodeScannerOpen, currentStep]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCameraDevice = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.start(
        deviceId,
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 320;
            const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 240;
            return {
              width: Math.max(50, Math.floor(Math.min(safeW * 0.85, 340))),
              height: Math.max(50, Math.floor(Math.min(safeH * 0.65, 220)))
            };
          },
          aspectRatio: 1.333333
        },
        onBarcodeDecoded,
        () => {}
      );
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const track = (html5QrCodeRef.current as any).getRunningTrackCameraCapabilities?.();
      if (track && track.torchFeature().isSupported()) {
        const nextState = !torchOn;
        await track.torchFeature().apply(nextState);
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Flashlight/torch not supported:', e);
    }
  };

  // MAIN BARCODE DECODE HANDLER - AUTOMATICALLY ADDS TO INVENTORY ON EVERY SCAN!
  const onBarcodeDecoded = async (decodedText: string) => {
    if (isProcessingScanRef.current || duplicateAlertState.isOpen) {
      return;
    }

    const cleanBarcode = decodedText.trim();
    if (!cleanBarcode) return;

    isProcessingScanRef.current = true;

    // AUTO-PICK SHADE FROM BARCODE (Direct lookup, mill label OCR, catalog match, or deterministic palette)
    const autoShade = autoDetectShadeFromBarcode(cleanBarcode, selectedCategory, products);
    const prodName = `${selectedCategory} - ${autoShade.colorName} Roll`;
    const curQty = Number(rollQuantity) || 50;
    const invRef = selectedInvoice?.invoiceNumber || 'INWARD-INTAKE';

    const res = await scanToAddProduct(cleanBarcode, {
      category: selectedCategory,
      locationId: targetLocation,
      quantity: curQty,
      unit: unit,
      retailPrice: Number(retailPrice) || 230,
      bulkPrice: Number(wholesalePrice) || 220,
      costPrice: Number(costPrice) || 148,
      name: prodName,
      colorName: autoShade.colorName,
      colorHex: autoShade.colorHex,
      shadeCode: autoShade.shadeCode,
      dyeLot: autoShade.dyeLot,
      fiberComposition: fiberComposition,
      invoiceRef: invRef
    });

    if (res.success && res.product) {
      // Crisp laser scan beep
      playBarcodeScanBeep(true);

      const record: ScannedRollRecord = {
        barcode: cleanBarcode,
        name: res.product.name,
        category: res.product.category,
        colorName: autoShade.colorName,
        colorHex: autoShade.colorHex,
        shadeCode: autoShade.shadeCode,
        dyeLot: autoShade.dyeLot,
        shadeSource: autoShade.sourceLabel,
        retailPrice: Number(retailPrice) || 230,
        costPrice: Number(costPrice) || 148,
        qty: curQty,
        unit: unit,
        locationId: targetLocation,
        invoiceRef: invRef,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setSessionScannedList(prev => [record, ...prev]);
      setLastScanResult({
        type: 'success',
        text: `✓ Auto-Picked Shade: "${autoShade.colorName}" (${autoShade.shadeCode}) • Added "${prodName}" (${curQty} ${unit}) to #${invRef}`,
        barcode: cleanBarcode,
        product: res.product
      });
    } else if (res.isDuplicate) {
      playAlertSound();
      setLastScanResult({
        type: 'error',
        text: `Duplicate Barcode: ${cleanBarcode} is already registered in inventory.`,
        barcode: cleanBarcode
      });
    } else {
      playScannerErrorBeep();
      setLastScanResult({
        type: 'error',
        text: res.message || `Failed to add barcode ${cleanBarcode}`,
        barcode: cleanBarcode
      });
    }

    // Short throttle before next scan
    setTimeout(() => {
      isProcessingScanRef.current = false;
    }, 800);
  };

  // Submit manual barcode via hardware gun / input
  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    onBarcodeDecoded(manualBarcode.trim());
    setManualBarcode('');
  };

  // Financial Metrics Live Calculation
  const financialMetrics = useMemo(() => {
    const rPrice = Number(retailPrice) || 0;
    const wPrice = Number(wholesalePrice) || 0;
    const cPrice = Number(costPrice) || 0;
    const q = Number(rollQuantity) || 1;

    const retailProfitPerUnit = rPrice - cPrice;
    const wholesaleProfitPerUnit = wPrice - cPrice;
    const grossMarginPct = rPrice > 0 ? ((retailProfitPerUnit / rPrice) * 100).toFixed(1) : '0.0';
    const totalRollCost = cPrice * q;
    const totalRollRetail = rPrice * q;

    return {
      retailProfitPerUnit,
      wholesaleProfitPerUnit,
      grossMarginPct,
      totalRollCost,
      totalRollRetail
    };
  }, [retailPrice, wholesalePrice, costPrice, rollQuantity]);

  // Session Totals in Step 4
  const sessionStats = useMemo(() => {
    const totalRolls = sessionScannedList.length;
    const totalUnits = sessionScannedList.reduce((acc, r) => acc + r.qty, 0);
    const totalCostValuation = sessionScannedList.reduce((acc, r) => acc + (r.qty * r.costPrice), 0);
    const totalRetailValuation = sessionScannedList.reduce((acc, r) => acc + (r.qty * r.retailPrice), 0);
    return {
      totalRolls,
      totalUnits,
      totalCostValuation,
      totalRetailValuation
    };
  }, [sessionScannedList]);

  if (!isMobileBarcodeScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100/60 overflow-hidden flex flex-col max-h-[92vh]">
        <RightEdgeBlend variant="rainbow" />
        <ReflectionOverlay opacity={0.05} />

        {/* TOP HEADER & 4-STEP WIZARD PROGRESS BAR */}
        <div className="relative bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-white p-4 sm:p-5 border-b border-rose-500/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={tajiLogo}
                alt="TAJI"
                className="w-9 h-9 object-contain rounded-xl bg-white/10 p-1 border border-white/20 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                    Scan to Add &mdash; Product Intake Wizard
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 text-[10px] font-bold rounded-full border border-rose-400/40">
                    Step {currentStep} of 4
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Select Inward Invoice &rarr; Choose Category &rarr; Set Pricing &rarr; Scan &amp; Auto-Add to Inventory
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileBarcodeScannerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4-Step Visual Stepper */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all text-left cursor-pointer ${
                currentStep === 1
                  ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-xs'
                  : currentStep > 1
                  ? 'bg-white/10 border-white/20 text-emerald-300 font-semibold'
                  : 'bg-white/5 border-white/5 text-slate-400'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep > 1 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="truncate hidden sm:inline">1. Select Invoice</span>
              <span className="truncate sm:hidden">Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => currentStep >= 2 && setCurrentStep(2)}
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all text-left ${
                currentStep === 2
                  ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-xs cursor-pointer'
                  : currentStep > 2
                  ? 'bg-white/10 border-white/20 text-emerald-300 font-semibold cursor-pointer'
                  : 'bg-white/5 border-white/5 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep > 2 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className="truncate hidden sm:inline">2. Category</span>
              <span className="truncate sm:hidden">Category</span>
            </button>

            <button
              type="button"
              onClick={() => currentStep >= 3 && setCurrentStep(3)}
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all text-left ${
                currentStep === 3
                  ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-xs cursor-pointer'
                  : currentStep > 3
                  ? 'bg-white/10 border-white/20 text-emerald-300 font-semibold cursor-pointer'
                  : 'bg-white/5 border-white/5 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep > 3 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'
              }`}>
                {currentStep > 3 ? '✓' : '3'}
              </div>
              <span className="truncate hidden sm:inline">3. Set Price</span>
              <span className="truncate sm:hidden">Price</span>
            </button>

            <button
              type="button"
              onClick={() => currentStep >= 4 && setCurrentStep(4)}
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all text-left ${
                currentStep === 4
                  ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-xs cursor-pointer'
                  : 'bg-white/5 border-white/5 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                4
              </div>
              <span className="truncate hidden sm:inline">4. Scan &amp; Add</span>
              <span className="truncate sm:hidden">Scan</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">

          {/* ========================================================================= */}
          {/* STEP 1: SELECT INVOICE & DESTINATION STORE                                */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-600" />
                    Select Inward Commercial Invoice, Customs SAD or Delivery Waybill
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Link incoming scanned rolls to an audited import entry or local purchase voucher.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCustomInvoice(!isCreatingCustomInvoice)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingCustomInvoice ? 'Choose Existing Invoice' : '+ Quick Custom Invoice'}</span>
                </button>
              </div>

              {/* Custom Invoice Creator Form */}
              {isCreatingCustomInvoice ? (
                <div className="bg-white p-4 rounded-2xl border-2 border-rose-300 shadow-xs space-y-3">
                  <h5 className="font-bold text-xs text-rose-900 uppercase tracking-wider">
                    Enter Custom Inward Document Details
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Invoice / Delivery No. *</label>
                      <input
                        type="text"
                        value={customInvoiceNum}
                        onChange={e => setCustomInvoiceNum(e.target.value)}
                        placeholder="e.g. INV-2026-904"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        value={customSupplier}
                        onChange={e => setCustomSupplier(e.target.value)}
                        placeholder="e.g. Udey Udyog Ltd"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Destination Store Node *</label>
                      <select
                        value={targetLocation}
                        onChange={e => setTargetLocation(e.target.value as LocationId)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search & Filter Bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={invoiceSearchQuery}
                        onChange={e => setInvoiceSearchQuery(e.target.value)}
                        placeholder="Search invoice number, supplier name, customs SAD..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setInvoiceTypeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          invoiceTypeFilter === 'all' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceTypeFilter('import')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          invoiceTypeFilter === 'import' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Import / SAD
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceTypeFilter('local')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          invoiceTypeFilter === 'local' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Local
                      </button>
                    </div>
                  </div>

                  {/* Invoices Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredInvoices.map(inv => {
                      const isSelected = selectedInvoiceId === inv.id;

                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectInvoice(inv)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2 relative ${
                            isSelected
                              ? 'bg-rose-50/70 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-rose-600" />
                              {inv.invoiceNumber}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              inv.type === 'sad'
                                ? 'bg-purple-100 text-purple-800'
                                : inv.type === 'import'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {inv.type}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600">
                            <div className="font-bold text-slate-800 truncate">{inv.supplierName}</div>
                            {inv.customsEntryNo && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                Customs Entry: {inv.customsEntryNo}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                            <span>Store: <strong className="text-slate-700">{inv.destinationLocationName}</strong></span>
                            {inv.totalQuantity && (
                              <span className="font-mono font-bold text-slate-800">
                                {inv.totalQuantity.toLocaleString()} {inv.totalQuantityUnit || 'm'}
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Destination Store Confirmation */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-slate-700">Target Warehouse / Store Outlet:</span>
                </div>
                <select
                  value={targetLocation}
                  onChange={e => setTargetLocation(e.target.value as LocationId)}
                  className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 1 Footer Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Continue to Category Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SELECT CATEGORY (SHADE AUTO-PICKED FROM BARCODE)                  */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  Select Product Category
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the textile classification. Fabric shade, dye lot, and color profile will be automatically detected and picked directly from each barcode when scanned.
                </p>
              </div>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(CATEGORY_PRESETS).map(([catKey, preset]) => {
                  const isSelected = selectedCategory === catKey;

                  return (
                    <div
                      key={catKey}
                      onClick={() => handleSelectCategory(catKey as CategoryType)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2 relative ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{preset.iconText}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${preset.badgeBg}`}>
                          {preset.badgeText}
                        </span>
                      </div>

                      <div className="font-extrabold text-sm text-slate-900">{preset.label}</div>
                      <p className="text-[11px] text-slate-500 leading-snug">{preset.subTitle}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Default Price:</span>
                        <span className="text-rose-600 font-mono">KSh {preset.defaultWholesalePrice}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scanner Shade Auto-Pick Active Information Card */}
              <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-50 p-4 rounded-2xl border border-rose-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Automatic Shade Extraction Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                    Auto-Pick Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manual shade selection is bypassed. The optical barcode scanner will automatically parse, detect, and match each roll's fabric shade (e.g. <span className="font-semibold text-slate-900">Black 3061</span>, <span className="font-semibold text-slate-900">New Navy 3075</span>, <span className="font-semibold text-slate-900">Maroon 3059</span>, <span className="font-semibold text-slate-900">Mix Grey 4251</span>, <span className="font-semibold text-slate-900">Green 4551</span>), dye lot, and color swatch directly from its barcode tag.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-rose-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Zero Manual Shade Input</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-rose-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Mill Shade Catalog Recognition</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-rose-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant Automated Roll Creation</span>
                  </span>
                </div>
              </div>

              {/* Step 2 Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Continue to Pricing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SET PRICE & ROLL DIMENSIONS                                       */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  Set Pricing, Landed Cost &amp; Standard Batch Quantity
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the wholesale price, retail price, cost price, and default roll/bale units for auto-added stock.
                </p>
              </div>

              {/* Pricing Inputs Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Wholesale Price (KSh / {unit}) *
                    </label>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={e => setWholesalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Retail Price (KSh / {unit}) *
                    </label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={e => setRetailPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-emerald-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Cost Price (KSh / {unit}) *
                    </label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={e => setCostPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Qty per Scanned Unit ({unit}) *
                    </label>
                    <input
                      type="number"
                      value={rollQuantity}
                      onChange={e => setRollQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Financial KPI Margin Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Gross Margin %:</span>
                    <strong className="text-rose-600 font-mono text-sm font-extrabold">
                      {financialMetrics.grossMarginPct}%
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Retail Profit / Unit:</span>
                    <strong className="text-emerald-700 font-mono text-sm font-extrabold">
                      +KSh {financialMetrics.retailProfitPerUnit}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Total Roll Cost:</span>
                    <strong className="text-slate-900 font-mono text-sm font-extrabold">
                      KSh {financialMetrics.totalRollCost.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Total Roll Retail:</span>
                    <strong className="text-emerald-700 font-mono text-sm font-extrabold">
                      KSh {financialMetrics.totalRollRetail.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Locked Summary Review Card */}
              <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span className="font-extrabold text-slate-900">Intake Lock Ready</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Invoice: <strong className="text-slate-900 font-mono">{selectedInvoice?.invoiceNumber}</strong> &bull;{' '}
                    Category: <strong className="text-slate-900">{selectedCategory}</strong> &bull;{' '}
                    Fabric Shade: <strong className="text-rose-700 font-bold">Auto-Picked from Barcode</strong> &bull;{' '}
                    Store: <strong className="text-slate-900">{locations.find(l => l.id === targetLocation)?.name || targetLocation}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white rounded-lg font-mono font-bold text-slate-800 border border-slate-200 shadow-2xs">
                    {rollQuantity} {unit} @ KSh {retailPrice}
                  </span>
                </div>
              </div>

              {/* Step 3 Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Category</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Scanning (Auto-Add to Inventory)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: LIVE SCANNER VIEW & INSTANT AUTO-ADD TO INVENTORY                 */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Session Live Stats Banner */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-rose-500/40 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-300 font-black">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white">Active Scanning Session:</span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Invoice: <strong className="text-rose-300">{selectedInvoice?.invoiceNumber}</strong> &bull; {selectedCategory} &bull; <strong className="text-amber-300">Auto-Pick Shade Active</strong> ({rollQuantity} {unit} per scan)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">Rolls Added</span>
                    <div className="font-extrabold text-sm text-emerald-400">
                      {sessionStats.totalRolls} Rolls
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">Total Units</span>
                    <div className="font-extrabold text-sm text-white">
                      {sessionStats.totalUnits} {unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">Valuation (Cost)</span>
                    <div className="font-extrabold text-sm text-amber-400">
                      KSh {sessionStats.totalCostValuation.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Feedback Toast */}
              {lastScanResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                    lastScanResult.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lastScanResult.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{lastScanResult.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastScanResult(null)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Camera Viewfinder & Controls */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-[4/3] max-h-[300px] flex items-center justify-center border-2 border-rose-500/40 shadow-inner shadow-rose-950/30">
                {/* HTML5 QR Scanner Container */}
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Laser Scanning Overlay Target Line */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-32 border-2 border-rose-500/80 rounded-xl relative shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent top-1/2 -translate-y-1/2 animate-pulse" />
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/90 text-rose-300 font-mono text-[9px] font-black rounded border border-rose-500/40 uppercase tracking-widest whitespace-nowrap">
                      Point at Barcode
                    </span>
                  </div>
                </div>

                {/* Top Viewfinder Controls */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2 z-10">
                  {availableCameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={e => switchCameraDevice(e.target.value)}
                      className="bg-slate-900/80 text-white text-[11px] font-bold px-2 py-1 rounded-lg border border-white/20 backdrop-blur-xs"
                    >
                      {availableCameras.map(cam => (
                        <option key={cam.id} value={cam.id}>{cam.label || `Cam ${cam.id}`}</option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      torchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900/80 text-white border-white/20 hover:bg-slate-800'
                    }`}
                    title="Toggle Flashlight / Torch"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hardware Barcode Scanner Gun / Manual Input Bar */}
              <form onSubmit={handleManualBarcodeSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={e => setManualBarcode(e.target.value)}
                    placeholder="Scan barcode with USB scanner gun or type code and press Enter..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  + Add Barcode
                </button>
              </form>

              {/* Live Session Activity Reel of Scanned Rolls Added */}
              {sessionScannedList.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-rose-600" />
                      Session Intake Reel ({sessionScannedList.length} rolls added)
                    </h5>
                    <span className="text-[11px] text-emerald-700 font-mono font-bold">
                      +{sessionStats.totalUnits} {unit} in stock
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                    {sessionScannedList.map((item, idx) => (
                      <div
                        key={`${item.barcode}-${idx}`}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.colorHex || '#1e3a8a' }}
                            title={item.colorName}
                          />
                          <span className="font-mono font-bold text-slate-900 truncate">
                            {item.barcode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold text-[10px] truncate">
                            {item.colorName} {item.shadeCode ? `(${item.shadeCode})` : ''}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate hidden md:inline">
                            &bull; {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="font-bold text-emerald-700">
                            +{item.qty} {item.unit}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({item.time})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 Footer Action: COMPARE WITH ACCOUNTS LEDGER */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Pricing</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBarcodeScannerOpen(false);
                      setIsStockLedgerReconcileOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-slate-900 to-rose-950 hover:from-slate-800 hover:to-rose-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    title="Open Physical Stock vs. Accounts Ledger reconciliation audit"
                  >
                    <Scale className="w-4 h-4 text-rose-400" />
                    <span>Compare Scanned Stock with Accounts Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMobileBarcodeScannerOpen(false)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Finish Session
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* DUPLICATE ALERT MODAL DIALOG */}
        {duplicateAlertState.isOpen && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border-2 border-amber-400 shadow-2xl space-y-4 text-slate-900">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Duplicate Barcode Detected
                </h4>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p>
                  Barcode <strong className="font-mono font-bold text-slate-900">{duplicateAlertState.barcode}</strong> is already allocated to an existing product:
                </p>
                {duplicateAlertState.existingProduct && (
                  <p className="font-bold text-slate-900 pt-1">
                    "{duplicateAlertState.existingProduct.name}" &bull; SKU: {duplicateAlertState.existingProduct.sku}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={dismissDuplicateAlert}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Skip / Cancel
                </button>
                {duplicateAlertState.existingProduct && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (duplicateAlertState.existingProduct) {
                        await restockExistingProduct(
                          duplicateAlertState.existingProduct.id,
                          Number(rollQuantity) || 50,
                          targetLocation
                        );
                        dismissDuplicateAlert();
                        playSuccessSound();
                        setLastScanResult({
                          type: 'success',
                          text: `Restocked +${rollQuantity} ${unit} to "${duplicateAlertState.existingProduct.name}"`,
                          barcode: duplicateAlertState.barcode
                        });
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Restock +{rollQuantity} {unit}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
