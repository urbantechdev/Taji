import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useERP } from '../../context/ERPContext';
import { CategoryType, LocationId, UnitType } from '../../types';
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
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  SwitchCamera,
  Keyboard,
  Info,
  Maximize2,
  PackageCheck
} from 'lucide-react';

export const MobileBarcodeScannerModal: React.FC = () => {
  const {
    isMobileBarcodeScannerOpen,
    setIsMobileBarcodeScannerOpen,
    scanToAddProduct,
    duplicateAlertState,
    locations,
    activeLocation,
    products,
    categoryPricingConfigs
  } = useERP();

  // Scan Configuration
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Dereck');
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation);
  const [quantity, setQuantity] = useState<number>(50);
  const [colorName, setColorName] = useState<string>('Navy Blue Classic');
  const [manualBarcode, setManualBarcode] = useState<string>('');

  // Scanner status
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState<{ type: 'success' | 'error'; text: string; barcode: string } | null>(null);
  const [recentlyScannedList, setRecentlyScannedList] = useState<Array<{ barcode: string; name: string; time: string }>>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const scannerContainerId = 'mobile-barcode-reader-view';

  // Synchronize targetLocation when activeLocation changes
  useEffect(() => {
    setTargetLocation(activeLocation);
  }, [activeLocation]);

  // Adjust default quantity/unit when category changes
  useEffect(() => {
    if (selectedCategory === 'Yarns') {
      setQuantity(10);
    } else {
      setQuantity(50);
    }
  }, [selectedCategory]);

  // Initialize and start scanner when modal opens
  useEffect(() => {
    let isMounted = true;

    if (isMobileBarcodeScannerOpen) {
      setLastScanMessage(null);

      const startCamera = async () => {
        try {
          // 1. Get available cameras
          const devices = await Html5Qrcode.getCameras();
          if (!isMounted) return;

          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
            
            // Prefer back camera for phone scanning
            const backCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') || 
              d.label.toLowerCase().includes('environment')
            );
            const chosenId = backCamera ? backCamera.id : devices[0].id;
            setSelectedCameraId(chosenId);

            // 2. Initialize scanner
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
                fps: 15,
                qrbox: { width: 280, height: 180 },
                aspectRatio: 1.333333
              },
              onBarcodeDecoded,
              () => {
                // Ignore per-frame scan errors
              }
            );

            if (isMounted) {
              setCameraPermission('granted');
              setIsScanning(true);
            }
          } else {
            if (isMounted) setCameraPermission('denied');
          }
        } catch (err: any) {
          console.warn('Camera initialization warning:', err);
          if (isMounted) setCameraPermission('denied');
        }
      };

      // Delay slightly for container element to mount in DOM
      const timer = setTimeout(() => {
        startCamera();
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isMobileBarcodeScannerOpen]);

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
          fps: 15,
          qrbox: { width: 280, height: 180 },
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
      console.warn('Torch toggle not supported on this device:', e);
    }
  };

  // MAIN BARCODE DECODE HANDLER
  const onBarcodeDecoded = async (decodedText: string) => {
    if (isProcessingScanRef.current || duplicateAlertState.isOpen) {
      return;
    }

    const cleanBarcode = decodedText.trim();
    if (!cleanBarcode) return;

    // Lock scanner to prevent duplicate firing during processing
    isProcessingScanRef.current = true;

    // Perform scan-to-add action
    const unit: UnitType = selectedCategory === 'Yarns' ? 'kg' : 'meter';
    const res = await scanToAddProduct(cleanBarcode, {
      category: selectedCategory,
      locationId: targetLocation,
      quantity: Number(quantity) || 50,
      unit,
      colorName: colorName || 'Classic Roll',
      name: `${selectedCategory} - Roll #${cleanBarcode.slice(-4) || '101'}`
    });

    if (res.success && res.product) {
      setLastScanMessage({
        type: 'success',
        text: `Product "${res.product.name}" added instantly to system!`,
        barcode: cleanBarcode
      });

      setRecentlyScannedList(prev => [
        {
          barcode: cleanBarcode,
          name: res.product?.name || cleanBarcode,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 4)
      ]);

      // Pause for 1.8s before accepting the next barcode
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1800);
    } else {
      setLastScanMessage({
        type: 'error',
        text: res.message,
        barcode: cleanBarcode
      });

      // Keep locked while duplicate popup is active
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

  // Helper for quick test barcodes
  const handleTestScan = (isDuplicateTest: boolean = false) => {
    if (isDuplicateTest && products.length > 0) {
      // Pick existing barcode from database
      const existing = products.find(p => p.barcode) || products[0];
      onBarcodeDecoded(existing.barcode || existing.id);
    } else {
      // Generate guaranteed unique fresh barcode
      const freshBarcode = `EAN-${Date.now().toString().slice(-8)}`;
      onBarcodeDecoded(freshBarcode);
    }
  };

  if (!isMobileBarcodeScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Mobile Barcode Scanner</h3>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Instant Add
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Point your phone or camera at any product barcode to add it with zero repetition.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileBarcodeScannerOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Feedback Toast Banner */}
        {lastScanMessage && (
          <div
            className={`px-5 py-2.5 border-b text-xs font-bold flex items-center justify-between transition-all ${
              lastScanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {lastScanMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="truncate">{lastScanMessage.text}</span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-300 shrink-0 ml-2">
              {lastScanMessage.barcode}
            </span>
          </div>
        )}

        {/* Scanner Viewfinder & Settings Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Intake Configuration Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                Intake Configuration for Scanned Items
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Auto-assigned to each new scan
              </span>
            </div>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(['Dereck', 'Fleece', 'Yarns'] as CategoryType[]).map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Target Location & Default Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Destination Branch
                </label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value as LocationId)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Quantity per Scanned Item ({selectedCategory === 'Yarns' ? 'kg' : 'meters'})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    {selectedCategory === 'Yarns' ? 'Kilograms' : 'Meters'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[260px]">
            
            {/* HTML5 QR/Barcode Video Canvas Mount Container */}
            <div
              id={scannerContainerId}
              className="w-full h-full min-h-[260px] flex items-center justify-center text-white"
            />

            {/* Visual Reticle Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-indigo-400/80 rounded-xl relative shadow-2xl shadow-indigo-500/30">
                  {/* Corner Reticle Accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>

                  {/* Red Laser Scanline */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-bounce absolute top-1/2 -translate-y-1/2"></div>
                </div>

                <div className="absolute bottom-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/20">
                  Align Barcode or QR Code within frame
                </div>
              </div>
            )}

            {/* Permission / Loading State */}
            {cameraPermission === 'denied' && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                <Camera className="w-10 h-10 text-slate-500 mb-1" />
                <p className="text-sm font-bold">Camera Access Restricted or Not Found</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Please enable camera permission in your browser or enter the barcode number manually below.
                </p>
              </div>
            )}

            {/* Top Right Device Controls */}
            {availableCameras.length > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                <select
                  value={selectedCameraId}
                  onChange={(e) => switchCameraDevice(e.target.value)}
                  className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-1 rounded-lg border border-white/20 focus:outline-none"
                >
                  {availableCameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Manual Entry or Barcode Gun Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                Manual Barcode / Hardware Scanner Gun Input
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Press Enter to Add</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 782910384729"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
          </form>

          {/* Test Scanner Trigger Buttons */}
          <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Quick Scanner Simulation Tests:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestScan(false)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                title="Simulates scanning a new unique barcode"
              >
                <Zap className="w-3 h-3" /> Test New Item Scan
              </button>
              <button
                type="button"
                onClick={() => handleTestScan(true)}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                title="Simulates scanning an existing barcode to test duplicate alert"
              >
                <AlertCircle className="w-3 h-3" /> Test Duplicate Scan
              </button>
            </div>
          </div>

          {/* Recently Scanned List */}
          {recentlyScannedList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Session Scanned Items:
              </span>
              <div className="space-y-1">
                {recentlyScannedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {item.barcode}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-device Realtime Cloud Sync Active</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileBarcodeScannerOpen(false)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Done Scanning
          </button>
        </div>

      </div>
    </div>
  );
};
