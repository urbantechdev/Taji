import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useERP } from '../../context/ERPContext';
import { ProductBatch, LocationId } from '../../types';
import ReflectionOverlay from './ReflectionOverlay';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playBarcodeScanBeep, playScannerErrorBeep, playSuccessSound, playAlertSound } from '../../utils/audio';
import {
  X,
  QrCode,
  Scan,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Layers,
  Store,
  RotateCcw,
  SwitchCamera,
  Zap,
  Copy,
  Check,
  PackagePlus,
  Info,
  RefreshCw,
  Barcode,
  Volume2,
  Minimize2,
  Maximize2,
  Radio
} from 'lucide-react';

export const QRScannerModal: React.FC = () => {
  const {
    isQRScannerOpen,
    setIsQRScannerOpen,
    setIsMobileBarcodeScannerOpen,
    products,
    locations,
    activeLocation,
    addToCart,
    handleQRScan,
    scannedResult,
    setScannedResult,
    updateProductBatch,
    scanToAddProduct,
    recordAuditLog,
    brandSettings
  } = useERP();

  // Scanner Operating Modes
  const [activeScanMode, setActiveScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  
  // Camera & Device State
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);

  // Scanner Viewport State (Fullscreen & Minimized After Scan)
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [autoMinimizeOnScan, setAutoMinimizeOnScan] = useState<boolean>(true);

  // Scanned Match State
  const [scannedProduct, setScannedProduct] = useState<ProductBatch | null>(null);
  const [rawDecodedToken, setRawDecodedToken] = useState<string | null>(null);
  const [cartQuantity, setCartQuantity] = useState<number>(1);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockLocation, setRestockLocation] = useState<LocationId>(activeLocation);
  
  // Manual text / barcode gun input
  const [manualCode, setManualCode] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ token: string; time: string; product?: ProductBatch }>>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'batch-qr-camera-stream-view';

  // Reset minimized state when modal opens
  useEffect(() => {
    if (isQRScannerOpen) {
      setIsMinimized(false);
    }
  }, [isQRScannerOpen]);

  // Synchronize restockLocation with active store node
  useEffect(() => {
    setRestockLocation(activeLocation);
  }, [activeLocation]);

  // Lifecycle: Start Camera when Modal is Opened in camera mode
  useEffect(() => {
    let isMounted = true;

    if (isQRScannerOpen && activeScanMode === 'camera') {
      const initCameraScanner = async () => {
        try {
          // 1. Enumerate available video inputs
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (!isMounted) return;

          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
            
            // Prefer rear/environment camera for physical batch scanning
            const backCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') || 
              d.label.toLowerCase().includes('environment')
            );
            const chosenId = backCamera ? backCamera.id : devices[0].id;
            setSelectedCameraId(chosenId);

            // 2. Initialize Scanner Instance with Full QR & Barcode Formats
            const qrScanner = new Html5Qrcode(scannerContainerId, {
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.DATA_MATRIX,
                Html5QrcodeSupportedFormats.AZTEC,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.ITF
              ],
              verbose: false
            });

            html5QrCodeRef.current = qrScanner;

            await qrScanner.start(
              chosenId,
              {
                fps: 15,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 300;
                  const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 300;
                  const minEdge = Math.min(safeW, safeH);
                  const qrboxSize = Math.max(50, Math.floor(Math.min(minEdge * 0.75, 260)));
                  return { width: qrboxSize, height: qrboxSize };
                },
                aspectRatio: 1.0
              },
              onDecodedCallback,
              () => {
                // Ignore per-frame non-detection
              }
            );

            if (isMounted) {
              setCameraPermission('granted');
              setIsScanning(true);
            }
          } else {
            // Attempt generic camera facing mode
            startGenericCameraFallback(isMounted);
          }
        } catch (err) {
          console.warn('Camera enumeration error, attempting fallback:', err);
          startGenericCameraFallback(isMounted);
        }
      };

      // Slight timeout to ensure container is fully mounted in DOM
      const timer = setTimeout(() => {
        initCameraScanner();
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isQRScannerOpen, activeScanMode]);

  const startGenericCameraFallback = async (isMounted: boolean) => {
    try {
      const qrScanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128],
        verbose: false
      });
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 300;
            const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 300;
            const minEdge = Math.min(safeW, safeH);
            const qrboxSize = Math.max(50, Math.floor(Math.min(minEdge * 0.75, 240)));
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        },
        onDecodedCallback,
        () => {}
      );

      if (isMounted) {
        setCameraPermission('granted');
        setIsScanning(true);
      }
    } catch (_fallbackErr) {
      if (isMounted) {
        setCameraPermission('denied');
        setIsScanning(false);
      }
    }
  };

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
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 300;
            const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 300;
            const minEdge = Math.min(safeW, safeH);
            const qrboxSize = Math.max(50, Math.floor(Math.min(minEdge * 0.75, 240)));
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        },
        onDecodedCallback,
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

  // RESOLVER: Locate matching batch across ERP catalog
  const resolveProductBatch = (decodedText: string): ProductBatch | null => {
    const raw = decodedText.trim();
    if (!raw) return null;

    // 1. JSON Payload Check
    try {
      const parsed = JSON.parse(raw);
      const targetBatchId = parsed.batch || parsed.id || parsed.batchId;
      const targetSku = parsed.sku || parsed.barcode;

      const found = products.find(p => 
        (targetBatchId && p.id.toLowerCase() === String(targetBatchId).toLowerCase()) ||
        (targetSku && (p.sku.toLowerCase() === String(targetSku).toLowerCase() || (p.barcode && p.barcode.toLowerCase() === String(targetSku).toLowerCase())))
      );
      if (found) return found;
    } catch {
      // Non-JSON payload
    }

    // 2. Direct SKU, ID, Barcode, or embedded QR data token match
    return products.find(p => 
      p.sku.toLowerCase() === raw.toLowerCase() ||
      p.id.toLowerCase() === raw.toLowerCase() ||
      (p.barcode && p.barcode.toLowerCase() === raw.toLowerCase()) ||
      (p.qrCodeData && p.qrCodeData.includes(raw)) ||
      p.name.toLowerCase() === raw.toLowerCase()
    ) || null;
  };

  // CORE SCAN PROCESSOR
  const onDecodedCallback = (decodedText: string) => {
    if (isProcessingScanRef.current) return;
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    isProcessingScanRef.current = true;

    const matched = resolveProductBatch(cleanCode);
    setRawDecodedToken(cleanCode);
    setScannedProduct(matched);
    setCartQuantity(1);

    // Record to recent scan history
    setRecentScans(prev => [
      {
        token: cleanCode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        product: matched || undefined
      },
      ...prev.slice(0, 19)
    ]);

    if (matched) {
      // Play loud, crisp laser scanner beep
      playBarcodeScanBeep(true);
      setActionFeedback({
        type: 'success',
        message: `Batch Identified: "${matched.name}" (${matched.sku}) • Ready for POS Cart, Restock, or Catalog inspection.`
      });
      recordAuditLog('Product Batch QR Scanned', `Scanned QR batch code for ${matched.sku} (${matched.name})`);

      // Auto-minimize after scan to allow immediate next scan
      if (autoMinimizeOnScan) {
        setIsMinimized(true);
      }
    } else {
      // Play alert error buzz
      playScannerErrorBeep();
      setActionFeedback({
        type: 'error',
        message: `Decoded Token: "${cleanCode}". No existing batch matched. You can register it as a new product below.`
      });
    }

    // Release scan lock after short debounce
    setTimeout(() => {
      isProcessingScanRef.current = false;
    }, 1200);
  };

  // Image Upload File QR Decoder
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const qrScanner = new Html5Qrcode('qr-temp-file-decoder');
      const decodedText = await qrScanner.scanFile(file, true);
      qrScanner.clear();
      onDecodedCallback(decodedText);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: `Could not decode a valid QR code or barcode from the uploaded image. Please ensure the code is clear and well-lit.`
      });
      playScannerErrorBeep();
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual Input Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onDecodedCallback(manualCode.trim());
      setManualCode('');
    }
  };

  // Quick Action: Add to POS Cart
  const handleAddToCart = (product: ProductBatch) => {
    addToCart(product, cartQuantity);
    setActionFeedback({
      type: 'success',
      message: `Added +${cartQuantity} ${product.unit} of "${product.name}" (${product.colorName}) to active POS Cart!`
    });
    playSuccessSound();
  };

  // Quick Action: Direct Stock Intake / Restock
  const handleQuickRestock = async (product: ProductBatch) => {
    const currentStock = product.locationStock[restockLocation] || 0;
    const newStock = currentStock + restockQty;
    
    await updateProductBatch(product.id, {
      locationStock: {
        ...product.locationStock,
        [restockLocation]: newStock
      }
    });

    const locName = locations.find(l => l.id === restockLocation)?.name || restockLocation;
    setActionFeedback({
      type: 'success',
      message: `Restocked +${restockQty} ${product.unit} of "${product.name}" at ${locName}! New Balance: ${newStock} ${product.unit}.`
    });
    
    // Update local state copy
    setScannedProduct({
      ...product,
      locationStock: {
        ...product.locationStock,
        [restockLocation]: newStock
      }
    });
    playSuccessSound();
  };

  // Quick Action: Auto-Register New Product for Unmatched Code
  const handleAutoRegisterNew = async () => {
    if (!rawDecodedToken) return;
    const res = await scanToAddProduct(rawDecodedToken, {
      category: 'Dereck',
      locationId: activeLocation,
      quantity: 50,
      unit: 'meter',
      colorName: 'Scanned Roll'
    });

    if (res.success && res.product) {
      setScannedProduct(res.product);
      setActionFeedback({
        type: 'success',
        message: `Registered new batch "${res.product.name}" (${res.product.sku}) into catalog and allocated to ${activeLocation}!`
      });
      playSuccessSound();
    } else {
      setActionFeedback({
        type: 'error',
        message: res.message || 'Failed to auto-register batch.'
      });
    }
  };

  // Copy Decoded Token to Clipboard
  const handleCopyToken = () => {
    if (!rawDecodedToken) return;
    navigator.clipboard.writeText(rawDecodedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Navigate to Inventory Catalog View
  const handleNavigateToCatalog = () => {
    setIsQRScannerOpen(false);
  };

  if (!isQRScannerOpen) return null;

  // MINIMIZED VIEW DOCK (Allows inspecting scanned product & 1-tap expanding for next scan)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[620px] z-50 animate-in slide-in-from-bottom-6 duration-200">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-rose-500/50 p-4 text-white space-y-3 shadow-rose-950/40">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={tajiLogo}
                alt="TAJI Brand Logo"
                className="w-7 h-7 object-contain rounded-lg bg-white/10 p-0.5 border border-white/20 shadow-xs shrink-0"
              />
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 truncate">
                  {brandSettings.brandName || 'TAJI'} QR Batch Vision
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  ({activeLocation})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setAutoMinimizeOnScan(!autoMinimizeOnScan)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  autoMinimizeOnScan
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Auto-Minimize mode after each scan"
              >
                Auto-Min: {autoMinimizeOnScan ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQRScannerOpen(false);
                  setScannedResult(null);
                  setActionFeedback(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Last Scanned Item Summary Pill */}
          {scannedProduct ? (
            <div className="p-2.5 rounded-xl border bg-slate-900/90 border-rose-500/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{scannedProduct.name}</p>
                  <p className="font-mono text-[10px] text-slate-300">
                    SKU: <strong className="text-rose-300">{scannedProduct.sku}</strong> • Stock: <strong>{Object.values(scannedProduct.locationStock || {}).reduce((a, b) => a + Number(b || 0), 0)} {scannedProduct.unit}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(scannedProduct, 1);
                    playSuccessSound();
                    setActionFeedback({ type: 'success', message: `Added 1 unit of "${scannedProduct.name}" to POS Cart!` });
                  }}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>+ POS Cart</span>
                </button>
              </div>
            </div>
          ) : rawDecodedToken ? (
            <div className="p-2.5 rounded-xl border bg-amber-950/80 border-amber-500/40 text-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Unmatched Code: {rawDecodedToken}</p>
                  <p className="text-[10px] text-amber-300/80">Tap below to register batch or scan next.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-slate-900/80 rounded-xl text-center text-xs text-slate-400">
              Ready to scan next product batch. Tap button below or use camera.
            </div>
          )}

          {/* Action Row: Big "Scan Next Batch" Button */}
          <div className="flex items-stretch gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-400/40"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              <span>Scan Next Batch / QR (Full Camera)</span>
              <Maximize2 className="w-4 h-4 ml-1 opacity-80" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-slate-950 sm:bg-slate-950/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden sm:overflow-y-auto animate-in fade-in duration-200">
      
      {/* Hidden container for file scanning */}
      <div id="qr-temp-file-decoder" className="hidden" />

      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-3xl w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] flex flex-col border-0 sm:border border-rose-100 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-rose-900/50 shrink-0">
          <ReflectionOverlay />
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <img
              src={tajiLogo}
              alt="TAJI Brand Logo"
              className="w-9 h-9 object-contain rounded-xl bg-white/10 p-1 border border-white/20 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-black text-xs sm:text-base text-white tracking-wide truncate">
                  {brandSettings.brandName || 'TAJI'} QR &amp; Barcode Scanner
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[9px] sm:text-[10px] font-bold rounded-full border border-rose-500/30 shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Instant batch traceability, POS checkout, multi-store stock balance, and intake.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsQRScannerOpen(false);
                setIsMobileBarcodeScannerOpen(true);
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              title="Switch to 3-Step Barcode Scanner Wizard"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barcode Wizard</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoMinimizeOnScan(!autoMinimizeOnScan)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                autoMinimizeOnScan
                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Auto-Minimize mode after each scan"
            >
              <Radio className={`w-3 h-3 ${autoMinimizeOnScan ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Auto-Min:</span>
              <span>{autoMinimizeOnScan ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Minimize to floating bottom dock"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minimize</span>
            </button>

            <button
              onClick={() => playBarcodeScanBeep(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Test loud scanner beep sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">Test Beep</span>
            </button>

            <button
              onClick={() => {
                setIsQRScannerOpen(false);
                setScannedResult(null);
                setActionFeedback(null);
              }}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close QR Scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center bg-slate-100/80 p-1 border-b border-slate-200 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveScanMode('camera')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeScanMode === 'camera'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveScanMode('upload')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeScanMode === 'upload'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => setActiveScanMode('manual')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeScanMode === 'manual'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Manual / Scanner Gun</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* ACTION / ERROR FEEDBACK BANNER */}
          {actionFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeScanMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-[4/3] max-h-[300px] flex items-center justify-center border-2 border-rose-500/40 shadow-inner shadow-rose-950/30">
                
                {/* HTML5 QR Code Video Target Element */}
                <div id={scannerContainerId} className="w-full h-full object-cover" />

                {/* Laser Overlay & Target Box */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-rose-500/80 rounded-2xl relative shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-rose-400 rounded-tl-lg" />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-rose-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-rose-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-rose-400 rounded-br-lg" />
                      
                      {/* Red Laser Sweep */}
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-scanner-laser absolute" />
                    </div>

                    <p className="text-rose-200 text-[11px] font-bold mt-3 bg-slate-950/90 px-3.5 py-1 rounded-full border border-rose-500/40 shadow-md">
                      Point camera at Batch QR Code or Barcode Tag
                    </p>
                  </div>
                )}

                {/* Camera Permission Denied / Loading Fallback */}
                {cameraPermission === 'denied' && (
                  <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Camera Stream Not Accessible</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Camera permissions are disabled or unavailable in this browser sandbox.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setCameraPermission('pending');
                          setActiveScanMode('upload');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Upload QR Image
                      </button>
                      <button
                        onClick={() => setActiveScanMode('manual')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                      >
                        Use Manual Input
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  {availableCameras.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <SwitchCamera className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={selectedCameraId}
                        onChange={e => switchCameraDevice(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
                      >
                        {availableCameras.map(cam => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={toggleTorch}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                      torchOn
                        ? 'bg-amber-500 text-slate-900 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{torchOn ? 'Torch ON' : 'Torch'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Scan className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                  <span>Continuous 15 FPS Autofocus</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PHOTO WITH QR */}
          {activeScanMode === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl text-center space-y-3 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Click to Upload Product QR / Barcode Image
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports PNG, JPG, WEBP, or device camera photos
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL INPUT & HARDWARE BARCODE GUN */}
          {activeScanMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter SKU, Batch ID, Barcode, or Paste Raw QR JSON:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="e.g. TFX-DRK-101, BATCH-DER-102, or paste QR token..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Decode</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hardware Barcode Gun Support:</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  USB and Bluetooth laser scanners emulate keyboard input. Focus on the field above and press the trigger on your scanner gun.
                </p>
              </div>
            </form>
          )}

          {/* DECODED PRODUCT INSPECTOR CARD & MULTI-ACTION HUB */}
          {scannedProduct ? (
            <div className="p-4 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 border-2 border-rose-200 rounded-2xl space-y-4 shadow-xs animate-in zoom-in-95 duration-150">
              
              {/* Product Header & Category Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-white font-black text-xs shrink-0"
                    style={{ backgroundColor: scannedProduct.colorHex || '#e11d48' }}
                  >
                    {scannedProduct.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                      {scannedProduct.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-semibold text-rose-700">{scannedProduct.sku}</span>
                      <span>•</span>
                      <span>Color: {scannedProduct.colorName}</span>
                      {scannedProduct.fiberComposition && (
                        <>
                          <span>•</span>
                          <span>{scannedProduct.fiberComposition}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-black">
                    KSh {scannedProduct.unitPriceRetail.toLocaleString()} / {scannedProduct.unit}
                  </span>
                </div>
              </div>

              {/* Multi-Store Stock Grid */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Real-time Multi-Branch Balances:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {locations.map(loc => {
                    const stock = scannedProduct.locationStock[loc.id] || 0;
                    const isLow = stock <= scannedProduct.minReorderLevel;
                    return (
                      <div
                        key={loc.id}
                        className={`p-2 rounded-xl border text-center ${
                          loc.id === activeLocation
                            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400/50'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 block truncate">
                          {loc.name}
                        </span>
                        <p className={`text-xs font-black font-mono mt-0.5 ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {stock} {scannedProduct.unit}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION ROW 1: ADD TO POS CART */}
              <div className="p-3 bg-white border border-rose-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Sale Qty:</span>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))}
                      className="p-1.5 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cartQuantity}
                      onChange={e => setCartQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-center text-xs font-bold font-mono bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCartQuantity(cartQuantity + 1)}
                      className="p-1.5 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{scannedProduct.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(scannedProduct)}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add {cartQuantity} {scannedProduct.unit} to Cart</span>
                </button>
              </div>

              {/* ACTION ROW 2: INSTANT RESTOCK & CATALOG ACCESS */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-100 text-xs">
                <div className="flex items-center gap-2">
                  <select
                    value={restockLocation}
                    onChange={e => setRestockLocation(e.target.value as LocationId)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleQuickRestock(scannedProduct)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Restock +{restockQty} {scannedProduct.unit}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy QR Data Token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNavigateToCatalog}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-rose-400" />
                    <span>View in Catalog</span>
                  </button>
                </div>
              </div>

            </div>
          ) : rawDecodedToken ? (
            /* UNMATCHED CODE DETECTED CARD */
            <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Unregistered QR / Barcode Token Detected
                  </h4>
                  <p className="font-mono text-xs text-amber-900 font-bold break-all mt-0.5">
                    {rawDecodedToken}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    This batch or barcode does not yet exist in your global ERP catalog. You can register it instantly.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={handleAutoRegisterNew}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register as New Batch (+50 Stock)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">
              Supports all Dereck, Fleece, and Yarn QR tokens &amp; 1D Barcodes.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsQRScannerOpen(false);
              setScannedResult(null);
            }}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
