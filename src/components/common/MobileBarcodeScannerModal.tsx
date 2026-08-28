import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useERP } from '../../context/ERPContext';
import { CategoryType, LocationId, UnitType } from '../../types';
import { playBarcodeScanBeep } from '../../utils/audio';
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
  Minimize2,
  PackageCheck,
  Volume2,
  ChevronUp,
  Radio
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
    brandSettings
  } = useERP();

  // Scan Configuration
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Dereck');
  const [targetLocation, setTargetLocation] = useState<LocationId>(activeLocation);
  const [quantity, setQuantity] = useState<number>(50);
  const [colorName, setColorName] = useState<string>('Navy Blue Classic');
  const [manualBarcode, setManualBarcode] = useState<string>('');

  // Scanner Viewport State (Fullscreen & Minimized After Scan)
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [autoMinimizeOnScan, setAutoMinimizeOnScan] = useState<boolean>(true);

  // Scanner hardware & device status
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState<{ type: 'success' | 'error'; text: string; barcode: string; product?: any } | null>(null);
  const [recentlyScannedList, setRecentlyScannedList] = useState<Array<{ barcode: string; name: string; time: string; qty: number; unit: string }>>([]);

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

  // Reset minimized state when modal opens
  useEffect(() => {
    if (isMobileBarcodeScannerOpen) {
      setIsMinimized(false);
    }
  }, [isMobileBarcodeScannerOpen]);

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
                fps: 20,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                  return {
                    width: Math.min(viewfinderWidth * 0.85, 340),
                    height: Math.min(viewfinderHeight * 0.65, 220)
                  };
                },
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
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.min(viewfinderWidth * 0.85, 340),
              height: Math.min(viewfinderHeight * 0.65, 220)
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
    const curQty = Number(quantity) || 50;
    const res = await scanToAddProduct(cleanBarcode, {
      category: selectedCategory,
      locationId: targetLocation,
      quantity: curQty,
      unit,
      colorName: colorName || 'Classic Roll',
      name: `${selectedCategory} - Roll #${cleanBarcode.slice(-4) || '101'}`
    });

    if (res.success && res.product) {
      setLastScanMessage({
        type: 'success',
        text: `Product "${res.product.name}" added instantly (${curQty} ${unit})!`,
        barcode: cleanBarcode,
        product: res.product
      });

      setRecentlyScannedList(prev => [
        {
          barcode: cleanBarcode,
          name: res.product?.name || cleanBarcode,
          time: new Date().toLocaleTimeString(),
          qty: curQty,
          unit
        },
        ...prev.slice(0, 5)
      ]);

      // Auto-minimize after scanning to allow next scan cleanly
      if (autoMinimizeOnScan) {
        setIsMinimized(true);
      }

      // Unlock processing after cooldown
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1200);
    } else {
      setLastScanMessage({
        type: 'error',
        text: res.message,
        barcode: cleanBarcode
      });

      // Unlock processing after cooldown
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

  const targetLocationName = locations.find(l => l.id === targetLocation)?.name || targetLocation;

  if (!isMobileBarcodeScannerOpen) return null;

  // MINIMIZED VIEW DOCK (Allows inspecting scanned product & 1-tap expanding for next scan)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[620px] z-50 animate-in slide-in-from-bottom-6 duration-200">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-emerald-500/50 p-4 text-white space-y-3">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {brandSettings.brandName || 'TAJI'} Barcode Vision • Ready
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({targetLocationName})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setAutoMinimizeOnScan(!autoMinimizeOnScan)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  autoMinimizeOnScan
                    ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Auto-Minimize mode after each scan"
              >
                Auto-Min: {autoMinimizeOnScan ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileBarcodeScannerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Last Scanned Item Summary Pill */}
          {lastScanMessage ? (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                lastScanMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {lastScanMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{lastScanMessage.text}</p>
                  <p className="font-mono text-[10px] text-slate-300">
                    Barcode: <span className="text-white font-bold">{lastScanMessage.barcode}</span> • {targetLocationName}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
                {lastScanMessage.type === 'success' ? 'Added' : 'Alert'}
              </span>
            </div>
          ) : (
            <div className="p-2 bg-slate-900/80 rounded-xl text-center text-xs text-slate-400">
              Ready to scan next product barcode. Tap button below or type barcode.
            </div>
          )}

          {/* Action Row: Big "Scan Next Barcode" Button + Quick Manual Gun Input */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/40"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              <span>Scan Next Barcode (Full Camera)</span>
              <Maximize2 className="w-4 h-4 ml-1 opacity-80" />
            </button>

            {/* Quick manual barcode gun input directly in minimized dock */}
            <form
              onSubmit={handleManualSubmit}
              className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0"
            >
              <Barcode className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
              <input
                type="text"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="Hardware Gun / Barcode"
                className="w-36 px-2 py-1.5 bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Footer Quick Info */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Next Category: <strong className="text-white">{selectedCategory}</strong> ({quantity} {selectedCategory === 'Yarns' ? 'kg' : 'm'})</span>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
            >
              Change Category &amp; Store &rarr;
            </button>
          </div>

        </div>
      </div>
    );
  }

  // FULL SCREEN BARCODE SCANNER VIEW
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-200 overflow-hidden">
      
      {/* Fullscreen Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 px-4 sm:px-6 py-3 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{brandSettings.brandName || 'TAJI'} Fullscreen Barcode Scanner</span>
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Instant Add
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Align barcode in viewfinder. Scanner will auto-minimize after each scan for rapid multi-item logging.
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoMinimizeOnScan(!autoMinimizeOnScan)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              autoMinimizeOnScan
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="When active, camera minimizes immediately upon scanning to allow checking results and readying next scan"
          >
            <Radio className={`w-3.5 h-3.5 ${autoMinimizeOnScan ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Auto-Minimize on Scan:</span>
            <span>{autoMinimizeOnScan ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => playBarcodeScanBeep(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Test scanner audio beep feedback"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">Test Beep</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Minimize to floating bottom bar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Minimize</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileBarcodeScannerOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Fullscreen Scanner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        
        {/* Left Column: Viewfinder & Quick Camera HUD (7 Cols on desktop) */}
        <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-black/60">
          
          {/* Live Scan Notification Toast Banner */}
          {lastScanMessage && (
            <div
              className={`mb-3 px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                lastScanMessage.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                  : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-950/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {lastScanMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="truncate">{lastScanMessage.text}</span>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-black/60 border border-white/20 shrink-0 ml-2">
                {lastScanMessage.barcode}
              </span>
            </div>
          )}

          {/* Full Camera Viewfinder Area */}
          <div className="relative flex-1 min-h-[320px] sm:min-h-[420px] rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center">
            
            {/* HTML5 QR/Barcode Video Canvas Container */}
            <div
              id={scannerContainerId}
              className="w-full h-full min-h-[320px] sm:min-h-[420px] flex items-center justify-center"
            />

            {/* High-Precision Reticle Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] max-w-[340px] h-[55%] max-h-[220px] border-2 border-emerald-400/80 rounded-2xl relative shadow-2xl shadow-emerald-500/30">
                  {/* Corner Reticles */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

                  {/* Red / Rose Scan Laser */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce absolute top-1/2 -translate-y-1/2"></div>
                </div>

                <div className="absolute bottom-4 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/30 shadow-lg">
                  Align product barcode inside frame
                </div>
              </div>
            )}

            {/* Permission Denied Fallback */}
            {cameraPermission === 'denied' && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="text-base font-bold text-white">Camera Access Not Accessible</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Camera permission was restricted in the browser. You can enter or scan barcodes with a handheld hardware gun in the panel on the right.
                </p>
              </div>
            )}

            {/* Top Toolbar overlay over camera */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-auto">
              <span className="bg-black/80 backdrop-blur-md text-[11px] font-bold text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live 20 FPS Scanner
              </span>

              {availableCameras.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <SwitchCamera className="w-4 h-4 text-slate-300" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => switchCameraDevice(e.target.value)}
                    className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl border border-white/20 focus:outline-none"
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
          </div>

          {/* Quick simulation buttons under camera */}
          <div className="mt-4 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Test Barcode Simulator:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestScan(false)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Test New Item Scan
              </button>
              <button
                type="button"
                onClick={() => handleTestScan(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Test Duplicate Scan
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Intake Configuration, Manual Entry & History (5 Cols on desktop) */}
        <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between space-y-5 bg-slate-900/70 overflow-y-auto">
          
          <div className="space-y-5">
            {/* Quick Intake Configuration Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-indigo-400" />
                  Product Intake Presets
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Applied to Scans
                </span>
              </div>

              {/* Category Selector Tabs */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Fabric / Yarn Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Dereck', 'Fleece', 'Yarns'] as CategoryType[]).map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-500/40'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Location & Default Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Destination Branch
                  </label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value as LocationId)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quantity per Scan ({selectedCategory === 'Yarns' ? 'kg' : 'm'})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400 shrink-0">
                      {selectedCategory === 'Yarns' ? 'KG' : 'M'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Barcode / USB Gun Input Field */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  Manual Barcode / Hardware Scanner Gun Input
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Press Enter to Add</span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Scan or enter code (e.g. 616400012345)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:bg-black focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </form>

            {/* Session Scanned Feed */}
            {recentlyScannedList.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Recently Scanned in Session ({recentlyScannedList.length}):
                </span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {recentlyScannedList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-white truncate block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.qty} {item.unit} • {item.barcode}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Bottom Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{brandSettings.brandName || 'TAJI'} Cloud Synchronized</span>
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
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
              >
                Done Scanning
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

