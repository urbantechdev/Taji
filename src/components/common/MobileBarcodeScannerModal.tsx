import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useERP } from '../../context/ERPContext';
import { CategoryType, LocationId, UnitType, ProductBatch } from '../../types';
import { playBarcodeScanBeep } from '../../utils/audio';
import ReflectionOverlay from './ReflectionOverlay';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
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
  Sliders,
  Box,
  DollarSign,
  RotateCcw
} from 'lucide-react';

type WizardStep = 1 | 2 | 3;

interface ScannedRollRecord {
  barcode: string;
  name: string;
  category: CategoryType;
  colorName: string;
  colorHex?: string;
  retailPrice: number;
  costPrice: number;
  qty: number;
  unit: UnitType;
  locationId: LocationId;
  time: string;
}

export const MobileBarcodeScannerModal: React.FC = () => {
  const {
    isMobileBarcodeScannerOpen,
    setIsMobileBarcodeScannerOpen,
    scanToAddProduct,
    duplicateAlertState,
    locations,
    activeLocation,
    products,
    categoryPricingConfigs,
    brandSettings
  } = useERP();

  // WIZARD STEP STATE
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // STEP 1: ITEM SELECTION STATE
  const [selectionMode, setSelectionMode] = useState<'inventory' | 'custom'>('inventory');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductBatch | null>(null);

  // Custom Item Fields
  const [customCategory, setCustomCategory] = useState<CategoryType>('Dereck');
  const [customName, setCustomName] = useState<string>('');
  const [customColorName, setCustomColorName] = useState<string>('Midnight Navy');
  const [customColorHex, setCustomColorHex] = useState<string>('#1e3a8a');
  const [customUnit, setCustomUnit] = useState<UnitType>('meter');
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation);

  // STEP 2: PRICE & QUANTITY CONFIRMATION STATE
  const [retailPrice, setRetailPrice] = useState<number>(350);
  const [bulkPrice, setBulkPrice] = useState<number>(300);
  const [costPrice, setCostPrice] = useState<number>(220);
  const [quantity, setQuantity] = useState<number>(50);
  const [isPriceConfirmed, setIsPriceConfirmed] = useState<boolean>(true);

  // STEP 3: SCANNING ENGINE STATE
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [autoMinimizeOnScan, setAutoMinimizeOnScan] = useState<boolean>(false);
  const [, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Results & Session Feed
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'error';
    text: string;
    barcode: string;
    product?: any;
  } | null>(null);
  const [sessionScannedList, setSessionScannedList] = useState<ScannedRollRecord[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const scannerContainerId = 'mobile-barcode-wizard-reader-view';

  // Popular Color Palette Presets
  const COLOR_PRESETS = [
    { name: 'Midnight Navy', hex: '#1e3a8a' },
    { name: 'Jet Black', hex: '#0f172a' },
    { name: 'Royal Burgundy', hex: '#881337' },
    { name: 'Emerald Green', hex: '#065f46' },
    { name: 'Heather Grey', hex: '#64748b' },
    { name: 'Oatmeal Beige', hex: '#d6d3d1' },
    { name: 'Mustard Gold', hex: '#d97706' },
    { name: 'Crimson Red', hex: '#dc2626' },
    { name: 'Chocolate Brown', hex: '#78350f' },
    { name: 'Pure White', hex: '#ffffff' }
  ];

  // Sync destination location when activeLocation changes
  useEffect(() => {
    setTargetLocation(activeLocation);
  }, [activeLocation]);

  // Reset wizard flow when modal opens
  useEffect(() => {
    if (isMobileBarcodeScannerOpen) {
      setIsMinimized(false);
      setLastScanResult(null);
      
      // Auto-select first product if none selected
      if (!selectedProduct && products.length > 0) {
        handleSelectInventoryProduct(products[0]);
      }
    }
  }, [isMobileBarcodeScannerOpen]);

  // Handle choosing an inventory item in Step 1
  const handleSelectInventoryProduct = (prod: ProductBatch) => {
    setSelectedProduct(prod);
    setCustomCategory(prod.category);
    setCustomName(prod.name);
    setCustomColorName(prod.colorName || 'Classic');
    setCustomColorHex(prod.colorHex || '#1e293b');
    setCustomUnit(prod.unit || (prod.category === 'Yarns' ? 'kg' : 'meter'));

    const pricing = categoryPricingConfigs[prod.category] || {
      defaultRetailPrice: prod.unitPriceRetail || 350,
      defaultBulkPrice: prod.unitPriceBulk || 300,
      defaultCostPrice: prod.costPrice || 220
    };

    setRetailPrice(prod.unitPriceRetail || pricing.defaultRetailPrice);
    setBulkPrice(prod.unitPriceBulk || pricing.defaultBulkPrice);
    setCostPrice(prod.costPrice || pricing.defaultCostPrice);
    setQuantity(prod.unit === 'kg' ? 10 : 50);
    setIsPriceConfirmed(true);
  };

  // Handle switching category in custom creation
  const handleSelectCustomCategory = (cat: CategoryType) => {
    setCustomCategory(cat);
    const unit: UnitType = cat === 'Yarns' ? 'kg' : 'meter';
    setCustomUnit(unit);

    const pricing = categoryPricingConfigs[cat] || {
      defaultRetailPrice: cat === 'Yarns' ? 450 : cat === 'Fleece' ? 420 : 350,
      defaultBulkPrice: cat === 'Yarns' ? 380 : cat === 'Fleece' ? 360 : 300,
      defaultCostPrice: cat === 'Yarns' ? 280 : cat === 'Fleece' ? 260 : 220
    };

    setRetailPrice(pricing.defaultRetailPrice);
    setBulkPrice(pricing.defaultBulkPrice);
    setCostPrice(pricing.defaultCostPrice);
    setQuantity(cat === 'Yarns' ? 10 : 50);
    
    if (!customName || customName.includes('Fabric') || customName.includes('Yarn')) {
      setCustomName(`${cat} Roll - ${customColorName}`);
    }
  };

  // Filter products for Step 1
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategoryFilter === 'all' || p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const query = itemSearchQuery.toLowerCase().trim();
      const matchesQuery = !query || 
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.colorName?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategoryFilter, itemSearchQuery]);

  // Camera Management for Step 3
  useEffect(() => {
    let isMounted = true;

    if (isMobileBarcodeScannerOpen && currentStep === 3) {
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

  // MAIN BARCODE DECODE HANDLER
  const onBarcodeDecoded = async (decodedText: string) => {
    if (isProcessingScanRef.current || duplicateAlertState.isOpen) {
      return;
    }

    const cleanBarcode = decodedText.trim();
    if (!cleanBarcode) return;

    isProcessingScanRef.current = true;

    // Item parameters locked from Wizard Steps 1 & 2
    const currentName = selectedProduct ? selectedProduct.name : (customName || `${customCategory} Roll - ${customColorName}`);
    const currentCategory = selectedProduct ? selectedProduct.category : customCategory;
    const currentColor = selectedProduct ? (selectedProduct.colorName || 'Classic') : customColorName;
    const currentColorHex = selectedProduct ? (selectedProduct.colorHex || '#1e3a8a') : customColorHex;
    const currentUnit: UnitType = selectedProduct ? selectedProduct.unit : customUnit;
    const curQty = Number(quantity) || 50;

    const res = await scanToAddProduct(cleanBarcode, {
      category: currentCategory,
      locationId: targetLocation,
      quantity: curQty,
      unit: currentUnit,
      retailPrice: Number(retailPrice) || 350,
      bulkPrice: Number(bulkPrice) || 300,
      costPrice: Number(costPrice) || 220,
      colorName: currentColor,
      colorHex: currentColorHex,
      name: currentName
    });

    if (res.success && res.product) {
      playBarcodeScanBeep(true);
      setLastScanResult({
        type: 'success',
        text: `Item "${res.product.name}" registered with barcode ${cleanBarcode}!`,
        barcode: cleanBarcode,
        product: res.product
      });

      const newRecord: ScannedRollRecord = {
        barcode: cleanBarcode,
        name: res.product.name,
        category: currentCategory,
        colorName: currentColor,
        colorHex: currentColorHex,
        retailPrice: Number(retailPrice) || 350,
        costPrice: Number(costPrice) || 220,
        qty: curQty,
        unit: currentUnit,
        locationId: targetLocation,
        time: new Date().toLocaleTimeString()
      };

      setSessionScannedList(prev => [newRecord, ...prev]);

      if (autoMinimizeOnScan) {
        setIsMinimized(true);
      }

      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1200);
    } else {
      setLastScanResult({
        type: 'error',
        text: res.message,
        barcode: cleanBarcode
      });

      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    onBarcodeDecoded(manualBarcode.trim());
    setManualBarcode('');
  };

  // Profit Margins & Valuation Calculation
  const unitProfit = Math.max(0, (Number(retailPrice) || 0) - (Number(costPrice) || 0));
  const profitMarginPercent = retailPrice > 0 ? ((unitProfit / retailPrice) * 100).toFixed(1) : '0';
  const totalBatchRetailVal = (Number(quantity) || 0) * (Number(retailPrice) || 0);
  const totalBatchCostVal = (Number(quantity) || 0) * (Number(costPrice) || 0);
  const activeLocationName = locations.find(l => l.id === targetLocation)?.name || targetLocation;

  const currentItemTitle = selectedProduct 
    ? selectedProduct.name 
    : (customName || `${customCategory} - ${customColorName}`);

  const currentItemCategory = selectedProduct ? selectedProduct.category : customCategory;
  const currentItemColor = selectedProduct ? (selectedProduct.colorName || 'Classic') : customColorName;
  const currentItemUnit = selectedProduct ? selectedProduct.unit : customUnit;

  if (!isMobileBarcodeScannerOpen) return null;

  // MINIMIZED VIEW DOCK
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[660px] z-50 animate-in slide-in-from-bottom-6 duration-200">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-rose-500/60 shadow-[0_0_35px_rgba(181,0,68,0.35)] ring-1 ring-pink-500/30 p-4 text-white space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-rose-900/40 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                {brandSettings.brandName || 'TAJI'} Barcode Wizard • Active
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                • {currentItemTitle} ({retailPrice ? `KSh ${retailPrice}/${currentItemUnit}` : ''})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileBarcodeScannerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {lastScanResult && (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                lastScanResult.type === 'success'
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-100 shadow-md'
                  : 'bg-rose-950/90 border-rose-600/70 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {lastScanResult.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{lastScanResult.text}</p>
                  <p className="font-mono text-[10px] text-slate-300">
                    Barcode: <span className="text-white font-bold">{lastScanResult.barcode}</span> • {activeLocationName}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/50 border border-rose-500/30 text-rose-200 shrink-0">
                {lastScanResult.type === 'success' ? 'Saved' : 'Alert'}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-400/40"
            >
              <Camera className="w-4 h-4 animate-pulse" />
              <span>Scan Next Roll with Full Camera</span>
            </button>

            <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-rose-900/40 shrink-0">
              <Barcode className="w-4 h-4 text-rose-400 ml-2 shrink-0" />
              <input
                type="text"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="Hardware Barcode Gun"
                className="w-36 px-2 py-1 bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Scan
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-slate-950 sm:bg-slate-950/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden sm:overflow-y-auto animate-in fade-in duration-200">
      
      <div className="bg-slate-900 border-0 sm:border border-rose-900/60 text-white rounded-none sm:rounded-3xl shadow-2xl shadow-rose-950/60 max-w-5xl w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden relative ring-1 ring-rose-500/20">
        
        {/* WIZARD TOP HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-rose-950/90 to-slate-950 px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-rose-500/30 shrink-0 flex items-center justify-between">
          <ReflectionOverlay />
          
          <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 p-0.5 flex items-center justify-center text-white shadow-md shadow-rose-950/50 shrink-0 border border-rose-400/40 overflow-hidden">
              <img
                src={tajiLogo}
                alt={brandSettings.brandName || 'TAJI'}
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                  {brandSettings.brandName || 'TAJI'} Barcode Scanner Wizard
                </h3>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                  Step {currentStep}/3
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                3-Step Guided Workflow: Select Item &rarr; Confirm Price &rarr; Scan &amp; Log Roll Barcodes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => playBarcodeScanBeep(true)}
              className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Test Scanner Audio"
            >
              <Volume2 className="w-4 h-4 text-rose-400" />
            </button>

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Minimize Scanner"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileBarcodeScannerOpen(false)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WIZARD STEPPER PROGRESS BAR */}
        <div className="bg-slate-950 px-3 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 max-w-2xl mx-auto">
            
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 1
                  ? 'bg-rose-950/70 border border-rose-400/70 text-white ring-1 ring-rose-500/40 shadow-[0_0_12px_rgba(181,0,68,0.2)]'
                  : currentStep > 1
                  ? 'bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-slate-800'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 1
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                  : currentStep > 1
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold truncate">1. Select Item</p>
                <p className="text-[9px] text-slate-400 truncate hidden sm:block">Product &amp; Category</p>
              </div>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 2
                  ? 'bg-rose-950/70 border border-rose-400/70 text-white ring-1 ring-rose-500/40 shadow-[0_0_12px_rgba(181,0,68,0.2)]'
                  : currentStep > 2
                  ? 'bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-slate-800'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 2
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                  : currentStep > 2
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold truncate">2. Confirm Price</p>
                <p className="text-[9px] text-slate-400 truncate hidden sm:block">KSh Price &amp; Quantity</p>
              </div>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (retailPrice > 0) setCurrentStep(3);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 3
                  ? 'bg-rose-950/70 border border-rose-400/70 text-white ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(181,0,68,0.25)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 3
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold truncate">3. Scan Barcode</p>
                <p className="text-[9px] text-slate-400 truncate hidden sm:block">Camera &amp; Hardware Gun</p>
              </div>
            </button>

          </div>
        </div>

        {/* WIZARD BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================= */}
          {/* STEP 1: SELECT ITEM TO START SCANNING */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header explanation banner */}
              <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/60 p-4 rounded-2xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-600/30 text-rose-300 rounded-xl border border-rose-400/30">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">Step 1: Choose Item to Start Scanning</h4>
                    <p className="text-xs text-slate-300">
                      Pick from existing catalog products or quickly configure a new fabric roll / yarn line.
                    </p>
                  </div>
                </div>

                {/* Sub-mode switcher */}
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('inventory')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectionMode === 'inventory'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Catalog Products ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('custom');
                      setSelectedProduct(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectionMode === 'custom'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    + New Roll Line
                  </button>
                </div>
              </div>

              {/* Destination Branch Picker */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Destination Branch Location</span>
                    <span className="text-[11px] text-slate-400">Scanned rolls will be registered and stocked into this branch</span>
                  </div>
                </div>

                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value as LocationId)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* MODE A: BROWSE EXISTING CATALOG PRODUCTS */}
              {selectionMode === 'inventory' && (
                <div className="space-y-4">
                  
                  {/* Search and Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        placeholder="Search product by name, color, SKU, or category..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                      />
                      {itemSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setItemSearchQuery('')}
                          className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {['all', 'Dereck', 'Fleece', 'Yarns', 'Bedsheets', 'Curtains'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                            selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {cat === 'all' ? 'All Products' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {filteredProducts.map((prod) => {
                      const isSelected = selectedProduct?.id === prod.id;
                      const stockAtTarget = prod.locationStock?.[targetLocation] || 0;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectInventoryProduct(prod)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                            isSelected
                              ? 'bg-rose-950/70 border-rose-400 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-950'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Color Swatch / Category Icon */}
                            <div
                              className="w-10 h-10 rounded-xl border border-white/20 shadow-md shrink-0 flex items-center justify-center font-bold text-white relative overflow-hidden"
                              style={{ backgroundColor: prod.colorHex || '#1e293b' }}
                            >
                              <span className="text-[10px] uppercase font-black drop-shadow-md">
                                {prod.category.slice(0, 2)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/30">
                                  {prod.category}
                                </span>
                                {prod.colorName && (
                                  <span className="text-[10px] text-slate-400 truncate">
                                    • {prod.colorName}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-white truncate mt-1 group-hover:text-rose-300 transition-colors">
                                {prod.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                SKU: {prod.sku || prod.id}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Retail Price</span>
                              <span className="font-extrabold text-emerald-400 font-mono">
                                KSh {prod.unitPriceRetail?.toLocaleString()} /{prod.unit || 'm'}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Store Stock</span>
                              <span className="font-bold text-slate-300 text-[11px]">
                                {stockAtTarget} {prod.unit}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* MODE B: CREATE / CONFIGURE NEW ROLL LINE */}
              {selectionMode === 'custom' && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Configure New Roll / Product Line
                    </span>
                    <span className="text-[10px] text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/40">
                      Fast Intake
                    </span>
                  </div>

                  {/* Category Selection Tabs */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Select Fabric / Product Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Dereck', 'Fleece', 'Yarns', 'Bedsheets'] as CategoryType[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCustomCategory(cat)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                            customCategory === cat
                              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400 shadow-md ring-2 ring-rose-500/40'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product / Roll Name Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Product / Roll Name
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder={`e.g. ${customCategory} Superfine Roll - ${customColorName}`}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Color / Shade Description
                      </label>
                      <input
                        type="text"
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        placeholder="e.g. Royal Navy Blue Classic"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Popular Color Swatches
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setCustomColorName(color.name);
                            setCustomColorHex(color.hex);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            customColorName === color.name
                              ? 'bg-slate-800 border-rose-400 text-white ring-2 ring-rose-500/40'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-white/30"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Step 1 Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: selectedProduct?.colorHex || customColorHex }}
                  />
                  <span>
                    Selected: <strong className="text-white">{currentItemTitle}</strong> ({currentItemCategory})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next: Confirm Price (Step 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: CONFIRM PRICE & SPECIFICATIONS */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Selected Item Summary Header Card */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl border border-white/30 shadow-lg flex items-center justify-center font-black text-white text-sm shrink-0"
                    style={{ backgroundColor: selectedProduct?.colorHex || customColorHex }}
                  >
                    {currentItemCategory.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                        {currentItemCategory}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        Color: <span className="text-slate-200">{currentItemColor}</span>
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
                      {currentItemTitle}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-rose-400" />
                      <span>Destined for Store: <strong className="text-white">{activeLocationName}</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Change Item</span>
                </button>
              </div>

              {/* Interactive Price & Roll Quantity Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Retail Selling Price Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border-2 border-emerald-500/50 space-y-3 relative shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" /> Retail Selling Price
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40">
                      Active POS
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-emerald-400">KSh</span>
                    <input
                      type="number"
                      min="1"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-12 pr-12 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-base font-black font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      /{currentItemUnit}
                    </span>
                  </div>

                  {/* Quick price adjusters */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[-50, -10, +10, +50].map((adj) => (
                      <button
                        key={adj}
                        type="button"
                        onClick={() => setRetailPrice(prev => Math.max(0, prev + adj))}
                        className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                      >
                        {adj > 0 ? `+${adj}` : adj}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Bulk / Wholesale Price Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-rose-400" /> Wholesale / Bulk Price
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Option 1 Roll
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-rose-400">KSh</span>
                    <input
                      type="number"
                      min="0"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-12 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-black font-mono text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      /{currentItemUnit}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Applied automatically when customers purchase complete wholesale rolls.
                  </p>
                </div>

                {/* 3. Cost Price & Margin Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Unit Cost Price
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Landed Cost
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-rose-400">KSh</span>
                    <input
                      type="number"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-12 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-black font-mono text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      /{currentItemUnit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-0.5">
                    <span>Gross Unit Margin:</span>
                    <span className="text-emerald-400 font-mono">+KSh {unitProfit.toLocaleString()} ({profitMarginPercent}%)</span>
                  </div>
                </div>

              </div>

              {/* Roll Length / Quantity Card */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Box className="w-4 h-4 text-amber-400" />
                      Roll Length / Quantity per Scanned Barcode ({currentItemUnit})
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Every physical barcode scanned in Step 3 will automatically log this quantity into inventory.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[20, 30, 50, 60, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuantity(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          quantity === preset
                            ? 'bg-amber-600 text-white border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {preset}{currentItemUnit === 'kg' ? 'kg' : 'm'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-48 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-black font-mono text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    {currentItemUnit.toUpperCase()} per Roll
                  </span>
                </div>
              </div>

              {/* Financial Valuation Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-4 rounded-2xl border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Selling Price</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                    KSh {Number(retailPrice).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Retail Valuation</span>
                  <span className="text-sm sm:text-base font-black font-mono text-white">
                    KSh {totalBatchRetailVal.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Cost Valuation</span>
                  <span className="text-sm sm:text-base font-black font-mono text-rose-300">
                    KSh {totalBatchCostVal.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Profit / Roll</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-300">
                    +KSh {(totalBatchRetailVal - totalBatchCostVal).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Price Confirmation Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPriceConfirmed}
                  onChange={(e) => setIsPriceConfirmed(e.target.checked)}
                  className="w-4 h-4 text-rose-600 bg-slate-900 border-slate-700 rounded focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-300">
                  I confirm that <strong className="text-emerald-400">KSh {retailPrice}/{currentItemUnit}</strong> is the verified selling price and specifications for this batch.
                </span>
              </label>

              {/* Bottom Step 2 Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Select Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!isPriceConfirmed || retailPrice <= 0}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 animate-pulse" />
                  <span>Next: Start Barcode Scanning (Step 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SCAN BARCODE (LIVE CAMERA & HARDWARE GUN) */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Confirmed Preset HUD Ribbon */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-3.5 rounded-2xl border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/30 shadow-md shrink-0 flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: selectedProduct?.colorHex || customColorHex }}
                  >
                    {currentItemCategory.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-indigo-300 block">
                      Active Scan Target:
                    </span>
                    <p className="text-xs font-black text-white truncate">
                      {currentItemTitle} • <span className="text-emerald-400">KSh {retailPrice}/{currentItemUnit}</span> • <span className="text-amber-300">{quantity} {currentItemUnit}/roll</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-bold hidden sm:inline">
                    {activeLocationName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Price/Item</span>
                  </button>
                </div>
              </div>

              {/* Main Scanning Viewport (Camera + Hardware Gun) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Camera Viewfinder (7 Cols) */}
                <div className="lg:col-span-7 space-y-3">
                  
                  {/* Live Scan Notification Toast Banner */}
                  {lastScanResult && (
                    <div
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        lastScanResult.type === 'success'
                          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                          : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-950/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {lastScanResult.type === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <span className="truncate">{lastScanResult.text}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-black/60 border border-white/20 shrink-0 ml-2">
                        {lastScanResult.barcode}
                      </span>
                    </div>
                  )}

                  {/* High Speed Camera Canvas Container */}
                  <div className="relative min-h-[300px] sm:min-h-[360px] rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center">
                    
                    <div
                      id={scannerContainerId}
                      className="w-full h-full min-h-[300px] sm:min-h-[360px] flex items-center justify-center"
                    />

                    {/* Reticle Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[80%] max-w-[320px] h-[55%] max-h-[200px] border-2 border-emerald-400/80 rounded-2xl relative shadow-2xl shadow-emerald-500/30">
                          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

                          {/* Laser Scan Beam */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce absolute top-1/2 -translate-y-1/2"></div>
                        </div>

                        <div className="absolute bottom-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-bold text-emerald-300 border border-emerald-500/30 shadow-lg">
                          Align Roll Barcode inside viewfinder
                        </div>
                      </div>
                    )}

                    {/* Camera Switcher Toolbar */}
                    {availableCameras.length > 1 && (
                      <div className="absolute top-3 right-3 z-10 pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/20">
                        <SwitchCamera className="w-3.5 h-3.5 text-slate-300 ml-1.5" />
                        <select
                          value={selectedCameraId}
                          onChange={(e) => switchCameraDevice(e.target.value)}
                          className="bg-transparent text-white text-[11px] font-bold px-2 py-0.5 focus:outline-none"
                        >
                          {availableCameras.map((c, i) => (
                            <option key={c.id} value={c.id} className="bg-slate-950">
                              {c.label || `Camera ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Manual Input & Session Log (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Manual / USB Gun Input Field */}
                  <form onSubmit={handleManualSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Keyboard className="w-4 h-4 text-indigo-400" />
                        Hardware Barcode Gun / Manual Input
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Press Enter</span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="Scan or type barcode (e.g. 616400012345)"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:bg-black focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!manualBarcode.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  {/* Scanned Roll Session Feed */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Session Scanned Rolls ({sessionScannedList.length})
                      </span>
                      {sessionScannedList.length > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Total: {sessionScannedList.reduce((acc, curr) => acc + curr.qty, 0)} {currentItemUnit}
                        </span>
                      )}
                    </div>

                    {sessionScannedList.length === 0 ? (
                      <div className="p-4 bg-slate-900/50 rounded-xl text-center text-xs text-slate-400">
                        No rolls scanned yet in this session. Aim camera at a barcode or scan with a hardware scanner.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {sessionScannedList.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-lg border border-white/20 shrink-0 flex items-center justify-center font-black text-[10px] text-white"
                                style={{ backgroundColor: item.colorHex || '#1e293b' }}
                              >
                                {item.category.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-white block truncate">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.qty} {item.unit} • Barcode: <strong className="text-slate-200">{item.barcode}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-emerald-400 font-mono text-[11px] block">
                                KSh {item.retailPrice}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">{item.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rapid Multi-Roll Scanning Actions */}
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                      Rapid Multi-Roll Assembly:
                    </span>
                    <p className="text-xs text-slate-300">
                      Keep scanning consecutive roll barcodes to log each roll with this locked price &amp; specification. To scan a different item or modify pricing, click below:
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Item (Step 1)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Adjust Price (Step 2)</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Step 3 Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Live Inventory Sync Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Minimize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMobileBarcodeScannerOpen(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    Finish &amp; Close Wizard
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
