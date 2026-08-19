import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, LocationId, UnitType } from '../../types';
import {
  Barcode,
  Scan,
  PackagePlus,
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
  Info
} from 'lucide-react';
import { playAddToCartSound, playAlertSound, playClickSound, playSuccessSound } from '../../utils/audio';

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
  sampleBarcodes: { code: string; label: string; colorName: string; colorHex: string }[];
}

const CATEGORY_PRESETS: Record<CategoryType, CategoryPresetConfig> = {
  Dereck: {
    category: 'Dereck',
    label: 'Dereec (Dereck Textile)',
    subTitle: 'Superfine dress & suit polyester textile weaves',
    defaultWholesalePrice: 650,
    defaultRetailPrice: 1250,
    defaultUnit: 'meter',
    defaultComposition: '100% Superfine Polyester Dereec Weave',
    iconText: '🧵',
    themeGradient: 'from-blue-950 via-slate-900 to-indigo-950',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    sampleBarcodes: [
      { code: 'DRC-ROYAL-NAVY-01', label: 'Royal Navy Dereec', colorName: 'Royal Navy', colorHex: '#1E3A8A' },
      { code: 'DRC-CRIMSON-RED-02', label: 'Crimson Red Dereec', colorName: 'Crimson Red', colorHex: '#DC2626' },
      { code: 'DRC-EMERALD-GRN-03', label: 'Deep Emerald Dereec', colorName: 'Deep Emerald', colorHex: '#047857' },
      { code: 'DRC-MIDNIGHT-BLK-04', label: 'Midnight Black Dereec', colorName: 'Midnight Black', colorHex: '#0F172A' }
    ]
  },
  Fleece: {
    category: 'Fleece',
    label: 'Fleeces (Polar & Sherpa)',
    subTitle: 'Heavyweight thermal winter & outdoor fleece',
    defaultWholesalePrice: 850,
    defaultRetailPrice: 1650,
    defaultUnit: 'meter',
    defaultComposition: 'Heavyweight Thermal Polar Fleece 320 GSM',
    iconText: '🧥',
    themeGradient: 'from-amber-950 via-slate-900 to-rose-950',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'text-amber-700',
    sampleBarcodes: [
      { code: 'FLC-CHARCOAL-HTH-01', label: 'Heather Charcoal Fleece', colorName: 'Heather Charcoal', colorHex: '#374151' },
      { code: 'FLC-ARCTIC-BLU-02', label: 'Arctic Glacier Fleece', colorName: 'Arctic Glacier', colorHex: '#0284C7' },
      { code: 'FLC-DESERT-SND-03', label: 'Desert Camel Fleece', colorName: 'Desert Camel', colorHex: '#D97706' },
      { code: 'FLC-FOREST-PIN-04', label: 'Pine Forest Fleece', colorName: 'Pine Forest', colorHex: '#15803D' }
    ]
  },
  Yarns: {
    category: 'Yarns',
    label: 'Yarns (Knitting & Weaving)',
    subTitle: 'Acrylic, wool & combed cotton cones & skeins',
    defaultWholesalePrice: 450,
    defaultRetailPrice: 950,
    defaultUnit: 'kg',
    defaultComposition: '100% Spun Acrylic & Combed Cotton Blend',
    iconText: '🧶',
    themeGradient: 'from-purple-950 via-slate-900 to-pink-950',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'text-purple-700',
    sampleBarcodes: [
      { code: 'YRN-IVORY-WHT-01', label: 'Pure Ivory White Yarn', colorName: 'Pure Ivory', colorHex: '#F8FAFC' },
      { code: 'YRN-SAFFRON-GLD-02', label: 'Saffron Gold Yarn', colorName: 'Saffron Gold', colorHex: '#EAB308' },
      { code: 'YRN-SOFT-LILAC-03', label: 'Soft Lilac Yarn', colorName: 'Soft Lilac', colorHex: '#A855F7' },
      { code: 'YRN-ONYX-BLK-04', label: 'Onyx Black Yarn', colorName: 'Onyx Black', colorHex: '#000000' }
    ]
  }
};

interface ScannedSessionItem {
  id: string;
  barcode: string;
  name: string;
  category: CategoryType;
  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  unit: UnitType;
  colorName: string;
  colorHex: string;
  fiberComposition: string;
  isExistingProduct: boolean;
}

interface CategoryIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: CategoryType;
}

export const CategoryIntakeModal: React.FC<CategoryIntakeModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Dereck'
}) => {
  const {
    products,
    locations,
    activeLocation,
    commitCategoryIntakeSession,
    getTotalAssetValuation
  } = useERP();

  // Workflow State
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCategory);
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation || 'main_store');
  
  // Category Preset Price Overrides for this session
  const [wholesalePrice, setWholesalePrice] = useState<number>(CATEGORY_PRESETS[initialCategory].defaultWholesalePrice);
  const [retailPrice, setRetailPrice] = useState<number>(CATEGORY_PRESETS[initialCategory].defaultRetailPrice);
  const [unit, setUnit] = useState<UnitType>(CATEGORY_PRESETS[initialCategory].defaultUnit);

  // Scanning State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [scannedItems, setScannedItems] = useState<ScannedSessionItem[]>([]);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Completion State
  const [completionResult, setCompletionResult] = useState<{
    totalQtyAdded: number;
    totalCostValuationAdded: number;
    totalRetailValuationAdded: number;
    newTotalBusinessAssetCost: number;
    newTotalBusinessAssetRetail: number;
    newTotalUnits: number;
    targetLocationName: string;
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Sync category changes
  const handleCategoryChange = (cat: CategoryType) => {
    playClickSound();
    setSelectedCategory(cat);
    const preset = CATEGORY_PRESETS[cat];
    setWholesalePrice(preset.defaultWholesalePrice);
    setRetailPrice(preset.defaultRetailPrice);
    setUnit(preset.defaultUnit);
    setScanFeedback(null);
  };

  useEffect(() => {
    if (isOpen) {
      setCompletionResult(null);
      setScanFeedback(null);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  const currentPreset = CATEGORY_PRESETS[selectedCategory];
  const globalAssetVal = getTotalAssetValuation();

  // Calculate live session metrics
  const sessionTotalUnits = scannedItems.reduce((acc, item) => acc + item.quantity, 0);
  const sessionTotalCostValuation = scannedItems.reduce((acc, item) => acc + item.quantity * item.wholesalePrice, 0);
  const sessionTotalRetailValuation = scannedItems.reduce((acc, item) => acc + item.quantity * item.retailPrice, 0);

  // Projected New Business Asset Valuations
  const projectedBusinessCostValuation = globalAssetVal.totalCostValuation + sessionTotalCostValuation;
  const projectedBusinessRetailValuation = globalAssetVal.totalRetailValuation + sessionTotalRetailValuation;
  const projectedBusinessTotalUnits = globalAssetVal.totalUnits + sessionTotalUnits;

  // Process Barcode Scan (Auto registers and adds item under selected category)
  const handleScanBarcode = (codeToScan?: string) => {
    const rawCode = (codeToScan || barcodeInput).trim();
    if (!rawCode) return;

    const codeUpper = rawCode.toUpperCase();
    const qtyToAdd = Math.max(1, Number(scanQuantity) || 1);

    // Look for existing product in database
    const existingProduct = products.find(
      p => (p.barcode && p.barcode.toUpperCase() === codeUpper) ||
           (p.sku && p.sku.toUpperCase() === codeUpper) ||
           p.id.toUpperCase() === codeUpper
    );

    // Check if item is already in our active session manifest
    const existingSessionIndex = scannedItems.findIndex(
      item => item.barcode.toUpperCase() === codeUpper
    );

    let updatedSessionItems = [...scannedItems];

    if (existingSessionIndex >= 0) {
      // Increment quantity in session list
      updatedSessionItems[existingSessionIndex].quantity += qtyToAdd;
      playAddToCartSound();
      setScanFeedback({
        type: 'success',
        message: `Updated: +${qtyToAdd} ${unit} for "${updatedSessionItems[existingSessionIndex].name}" (Total: ${updatedSessionItems[existingSessionIndex].quantity} ${unit})`
      });
    } else {
      // New item to session
      const name = existingProduct ? existingProduct.name : `${currentPreset.category} - Auto-Scanned (${codeUpper})`;
      const colorName = existingProduct ? existingProduct.colorName : 'Standard Batch Shade';
      const colorHex = existingProduct ? existingProduct.colorHex : (selectedCategory === 'Dereck' ? '#1E3A8A' : selectedCategory === 'Fleece' ? '#374151' : '#F59E0B');
      const itemFiber = existingProduct ? existingProduct.fiberComposition : currentPreset.defaultComposition;

      const newItem: ScannedSessionItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        barcode: codeUpper,
        name,
        category: selectedCategory,
        quantity: qtyToAdd,
        wholesalePrice: wholesalePrice,
        retailPrice: retailPrice,
        unit: unit,
        colorName,
        colorHex,
        fiberComposition: itemFiber,
        isExistingProduct: !!existingProduct
      };

      updatedSessionItems = [newItem, ...updatedSessionItems];
      playAddToCartSound();
      setScanFeedback({
        type: 'success',
        message: existingProduct
          ? `Scanned: Existing Product "${name}" (+${qtyToAdd} ${unit})`
          : `Auto-Registered: New ${selectedCategory} Item (${codeUpper}) with Wholesale KSh ${wholesalePrice} & Retail KSh ${retailPrice}`
      });
    }

    setScannedItems(updatedSessionItems);
    setBarcodeInput('');
    setScanQuantity(1);
    barcodeInputRef.current?.focus();
  };

  // Remove item from session manifest
  const handleRemoveSessionItem = (id: string) => {
    playClickSound();
    setScannedItems(prev => prev.filter(i => i.id !== id));
  };

  // Adjust quantity of item in session
  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveSessionItem(id);
      return;
    }
    setScannedItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: newQty } : i))
    );
  };

  // Commit & Finalize Category Intake Session
  const handleSaveAndFinalize = () => {
    if (scannedItems.length === 0) {
      playAlertSound();
      setScanFeedback({ type: 'error', message: 'Please scan at least one barcode before saving.' });
      return;
    }

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
        fiberComposition: item.fiberComposition
      })),
      targetLocation,
      `Batch Barcode Intake for ${currentPreset.label}`
    );

    if (res.success) {
      setCompletionResult({
        totalQtyAdded: res.totalQtyAdded || sessionTotalUnits,
        totalCostValuationAdded: res.totalCostValuationAdded || sessionTotalCostValuation,
        totalRetailValuationAdded: res.totalRetailValuationAdded || sessionTotalRetailValuation,
        newTotalBusinessAssetCost: res.newTotalBusinessAssetCost || projectedBusinessCostValuation,
        newTotalBusinessAssetRetail: res.newTotalBusinessAssetRetail || projectedBusinessRetailValuation,
        newTotalUnits: res.newTotalUnits || projectedBusinessTotalUnits,
        targetLocationName: res.targetLocationName || targetLocation
      });
    } else {
      playAlertSound();
      setScanFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-rose-100/60 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        <RightEdgeBlend variant="rainbow" />
        <ReflectionOverlay opacity={0.06} />

        {/* Modal Top Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-5 text-white border-b border-rose-500/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600/30 border border-rose-400/40 rounded-2xl text-amber-400 shadow-md">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Category-Specific Barcode Inventory Intake
                  </h3>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Automated Intake
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Scan barcodes for Fleeces, Dereec &amp; Yarns to auto-register items, allocate stock, and compute business asset value
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">

          {/* If Session is Completed -> Show Completion Summary Screen */}
          {completionResult ? (
            <div className="space-y-6 animate-fade-in py-2">
              <div className="p-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl border-2 border-emerald-500/40 text-white shadow-xl text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce-short" />
                </div>
                
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    Inventory Intake Completed &amp; Asset Value Updated!
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-xl mx-auto">
                    {currentPreset.label} intake has been committed to available stock at <span className="font-bold text-white uppercase">{completionResult.targetLocationName}</span> and recorded into double-entry accounting.
                  </p>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left">
                  <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Quantity Added</span>
                    <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                      +{completionResult.totalQtyAdded.toLocaleString()} {unit}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Added to active stock</span>
                  </div>

                  <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Cost Value Added</span>
                    <span className="text-lg sm:text-xl font-black text-rose-300 font-mono">
                      +KSh {completionResult.totalCostValuationAdded.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Wholesale asset increase</span>
                  </div>

                  <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">New Total Business Assets</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                      KSh {completionResult.newTotalBusinessAssetCost.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Total business cost value</span>
                  </div>

                  <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">New Total Physical Stock</span>
                    <span className="text-lg sm:text-xl font-black text-white font-mono">
                      {completionResult.newTotalUnits.toLocaleString()} units
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Across all branches</span>
                  </div>
                </div>
              </div>

              {/* Scanned Items Receipt Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Processed Category Line Items ({scannedItems.length})</span>
                  <span className="font-mono text-slate-500">Retail Worth: KSh {completionResult.totalRetailValuationAdded.toLocaleString()}</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {scannedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-700">{item.barcode}</span>
                        <span className="text-slate-900 font-bold">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-slate-900">{item.quantity} {item.unit}</span>
                        <span className="text-slate-500">@ KSh {item.wholesalePrice.toLocaleString()}</span>
                        <span className="font-bold text-emerald-700">KSh {(item.quantity * item.wholesalePrice).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setCompletionResult(null);
                    setScannedItems([]);
                    setScanFeedback(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Start Another Category Intake
                </button>

                <button
                  onClick={() => {
                    playSuccessSound();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Close Window &amp; View Catalog</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: CATEGORY SELECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Step 1: Select Target Product Category</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Preset pricing applies automatically</span>
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
                            ? 'border-rose-600 bg-rose-50/60 shadow-md ring-2 ring-rose-500/20'
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
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Wholesale (Cost)</span>
                            <span className="font-mono font-bold text-rose-700">KSh {preset.defaultWholesalePrice.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400"> / {preset.defaultUnit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Retail Price</span>
                            <span className="font-mono font-bold text-emerald-700">KSh {preset.defaultRetailPrice.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400"> / {preset.defaultUnit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Target Warehouse Location & Price Customization Accordion */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Store className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="font-bold text-slate-700">Intake Target Location:</span>
                    <select
                      value={targetLocation}
                      onChange={e => setTargetLocation(e.target.value as LocationId)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Session Wholesale:</span>
                      <input
                        type="number"
                        value={wholesalePrice}
                        onChange={e => setWholesalePrice(Number(e.target.value))}
                        className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Session Retail:</span>
                      <input
                        type="number"
                        value={retailPrice}
                        onChange={e => setRetailPrice(Number(e.target.value))}
                        className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: BATCH BARCODE SCANNING */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Step 2: Batch Barcode Scanning ({currentPreset.label})</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Scanner Mode Active</span>
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
                      placeholder={`Scan or type ${currentPreset.label} barcode / SKU (USB, Bluetooth or Keyboard)...`}
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
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Intake Scan</span>
                    </button>
                  </div>
                </form>

                {/* Scan Feedback Banner */}
                {scanFeedback && (
                  <div
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
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

                {/* Quick 1-Click Simulation Barcode Test Pills */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500">Quick Test Barcode Simulator ({selectedCategory}):</span>
                    <span className="text-[10px] text-slate-400">Click any barcode to simulate instant scan</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPreset.sampleBarcodes.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleScanBarcode(sample.code)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sample.colorHex }} />
                        <span>{sample.code}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({sample.colorName})</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleScanBarcode(`${selectedCategory.slice(0, 3).toUpperCase()}-NEW-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-amber-700" />
                      <span>Simulate Brand New Barcode</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Items Session Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rose-600" />
                      <span>Current Session Scanned Items ({scannedItems.length} items, {sessionTotalUnits} {unit})</span>
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
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {scannedItems.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 space-y-2">
                      <Barcode className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No items scanned in this session yet.</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Point your barcode scanner at physical bolts, cones, or garments, or click a test barcode above to start adding stock.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider sticky top-0">
                          <tr>
                            <th className="p-2.5">Barcode / SKU</th>
                            <th className="p-2.5">Product Title</th>
                            <th className="p-2.5 text-center">Quantity</th>
                            <th className="p-2.5 text-right">Wholesale Cost</th>
                            <th className="p-2.5 text-right">Subtotal Cost</th>
                            <th className="p-2.5 text-right">Retail Worth</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scannedItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2.5 font-mono font-bold text-rose-700">
                                {item.barcode}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{item.name}</span>
                                    <span className="text-[10px] text-slate-400 block">{item.fiberComposition}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                    className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-slate-900 px-1">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                    className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-600">
                                KSh {item.wholesalePrice.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-rose-800">
                                KSh {(item.quantity * item.wholesalePrice).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                KSh {(item.quantity * item.retailPrice).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSessionItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: LIVE COMPUTATION & AUTO-CLOSING SAVE */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Step 3: Dynamic Computation &amp; Closing</span>
                </label>

                {/* Dynamic Valuation Real-Time Projection Bar */}
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

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Saving automatically increases available stock and computes the new business asset valuation.</span>
                  </div>

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
                      <span>Save &amp; Finalize Category Intake ({sessionTotalUnits} {unit})</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
