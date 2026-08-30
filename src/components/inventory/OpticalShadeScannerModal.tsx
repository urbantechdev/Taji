import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  Barcode,
  Pipette,
  Palette,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SwitchCamera,
  Layers,
  Sparkles,
  Search,
  Scale,
  Zap,
  Tag,
  Eye,
  Check,
  Package
} from 'lucide-react';
import {
  MILL_SHADE_CATALOG,
  MillShadeRecord,
  matchOpticalColorToMillShade,
  OpticalShadeMatchResult,
  parseMillLabelPayload,
  ParsedMillLabelData,
  rgbToHex
} from '../../utils/textileShadeEngine';
import { playBarcodeScanBeep, playClickSound, playSuccessSound } from '../../utils/audio';

export interface OpticalScanOutput {
  barcode?: string;
  shadeCode?: string;
  colorName?: string;
  colorHex?: string;
  dyeLot?: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  tareWeightKg?: number;
  packagesCount?: number;
  category?: 'Yarns' | 'Fleece' | 'Dereck';
}

interface OpticalShadeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIntakeData: (data: OpticalScanOutput) => void;
  activeCategory?: 'Yarns' | 'Fleece' | 'Dereck';
}

export const OpticalShadeScannerModal: React.FC<OpticalShadeScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyIntakeData,
  activeCategory = 'Yarns'
}) => {
  const [activeTab, setActiveTab] = useState<'camera_barcode' | 'optical_shade' | 'mill_palette'>('camera_barcode');
  
  // Camera & Video Devices
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Optical Shade Eyedropper State
  const [isEyedropperStreaming, setIsEyedropperStreaming] = useState<boolean>(false);
  const [isSampleLocked, setIsSampleLocked] = useState<boolean>(false);
  const [currentSampledHex, setCurrentSampledHex] = useState<string>('#94A3B8');
  const [currentSampledRgb, setCurrentSampledRgb] = useState<[number, number, number]>([148, 163, 184]);
  const [matchedShades, setMatchedShades] = useState<OpticalShadeMatchResult[]>([]);
  const [selectedShadeResult, setSelectedShadeResult] = useState<OpticalShadeMatchResult | null>(null);

  // Palette Search & Filter
  const [paletteSearch, setPaletteSearch] = useState<string>('');
  const [paletteFilter, setPaletteFilter] = useState<'All' | 'Yarns' | 'Fleece' | 'Dereck'>('All');

  // References
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const eyedropperVideoRef = useRef<HTMLVideoElement | null>(null);
  const eyedropperCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const eyedropperAnimationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);

  const barcodeContainerId = 'category-intake-html5-qr-reader';

  // Stop camera media stream
  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (eyedropperAnimationRef.current) {
      cancelAnimationFrame(eyedropperAnimationRef.current);
      eyedropperAnimationRef.current = null;
    }
    setIsEyedropperStreaming(false);
  }, []);

  // Stop Barcode Scanner
  const stopBarcodeScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('HTML5QrCode stop warning:', err);
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  // Enumerate cameras once on open
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(err => {
        console.warn('Camera enumeration error:', err);
      });
  }, [isOpen]);

  // Start Barcode Scanner Engine
  const startBarcodeScanner = useCallback(async () => {
    setCameraError(null);
    await stopBarcodeScanner();
    stopMediaStream();

    try {
      const qrScanner = new Html5Qrcode(barcodeContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
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

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

      await qrScanner.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 280, height: 200 },
          aspectRatio: 1.3333
        },
        (decodedText) => {
          if (isProcessingScanRef.current) return;
          isProcessingScanRef.current = true;
          playBarcodeScanBeep(true);

          // Parse decoded label payload
          const parsed = parseMillLabelPayload(decodedText);
          const result: OpticalScanOutput = {
            barcode: parsed?.barcode || decodedText,
            shadeCode: parsed?.shadeCode,
            colorName: parsed?.colorName,
            colorHex: parsed?.colorHex,
            dyeLot: parsed?.dyeLot,
            netWeightKg: parsed?.netWeightKg,
            grossWeightKg: parsed?.grossWeightKg,
            tareWeightKg: parsed?.tareWeightKg,
            packagesCount: parsed?.packagesCount,
            category: parsed?.category
          };

          onApplyIntakeData(result);
          playSuccessSound();

          setTimeout(() => {
            isProcessingScanRef.current = false;
          }, 1200);
        },
        () => {
          // Frame scan error (benign)
        }
      );
    } catch (err: any) {
      console.error('Barcode scanner initialization error:', err);
      setCameraError(err?.message || 'Failed to start camera for barcode scanning.');
    }
  }, [selectedCameraId, onApplyIntakeData, stopBarcodeScanner, stopMediaStream]);

  // Start Eyedropper Live Video Stream & Pixel Analyzer
  const startEyedropperStream = useCallback(async () => {
    setCameraError(null);
    await stopBarcodeScanner();
    stopMediaStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (eyedropperVideoRef.current) {
        eyedropperVideoRef.current.srcObject = stream;
        await eyedropperVideoRef.current.play();
        setIsEyedropperStreaming(true);
        setIsSampleLocked(false);

        // Start Color Extraction Loop
        const processFrame = () => {
          if (!isSampleLocked && eyedropperVideoRef.current && eyedropperCanvasRef.current) {
            const video = eyedropperVideoRef.current;
            const canvas = eyedropperCanvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = 120;
              canvas.height = 120;

              // Sample the center 40x40 area from the video stream
              const sampleSize = 40;
              const sourceX = Math.floor((video.videoWidth - sampleSize) / 2);
              const sourceY = Math.floor((video.videoHeight - sampleSize) / 2);

              ctx.drawImage(
                video,
                sourceX,
                sourceY,
                sampleSize,
                sampleSize,
                0,
                0,
                canvas.width,
                canvas.height
              );

              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;

              let rSum = 0;
              let gSum = 0;
              let bSum = 0;
              let count = 0;

              // Compute average RGB (skipping every 4th pixel for speed)
              for (let i = 0; i < data.length; i += 16) {
                rSum += data[i];
                gSum += data[i + 1];
                bSum += data[i + 2];
                count++;
              }

              if (count > 0) {
                const avgR = Math.round(rSum / count);
                const avgG = Math.round(gSum / count);
                const avgB = Math.round(bSum / count);
                const hex = rgbToHex(avgR, avgG, avgB);

                setCurrentSampledRgb([avgR, avgG, avgB]);
                setCurrentSampledHex(hex);

                // Run matching against mill shade catalog
                const matches = matchOpticalColorToMillShade(
                  [avgR, avgG, avgB],
                  activeCategory
                );
                setMatchedShades(matches);
                if (matches.length > 0) {
                  setSelectedShadeResult(matches[0]);
                }
              }
            }
          }

          eyedropperAnimationRef.current = requestAnimationFrame(processFrame);
        };

        eyedropperAnimationRef.current = requestAnimationFrame(processFrame);
      }
    } catch (err: any) {
      console.error('Eyedropper camera stream error:', err);
      setCameraError(err?.message || 'Unable to access camera for optical shade reading.');
    }
  }, [selectedCameraId, isSampleLocked, activeCategory, stopBarcodeScanner, stopMediaStream]);

  // Tab switching lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopBarcodeScanner();
      stopMediaStream();
      return;
    }

    if (activeTab === 'camera_barcode') {
      startBarcodeScanner();
    } else if (activeTab === 'optical_shade') {
      startEyedropperStream();
    } else {
      stopBarcodeScanner();
      stopMediaStream();
    }

    return () => {
      stopBarcodeScanner();
      stopMediaStream();
    };
  }, [isOpen, activeTab, selectedCameraId, startBarcodeScanner, startEyedropperStream, stopBarcodeScanner, stopMediaStream]);

  if (!isOpen) return null;

  // Filtered palette items
  const filteredPalette = MILL_SHADE_CATALOG.filter(s => {
    const matchesFilter = paletteFilter === 'All' || s.category === 'All' || s.category === paletteFilter;
    const matchesQuery =
      s.code.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(paletteSearch.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const handleSelectPaletteShade = (shade: MillShadeRecord) => {
    playClickSound();
    onApplyIntakeData({
      barcode: shade.code,
      shadeCode: shade.code,
      colorName: shade.name,
      colorHex: shade.hex,
      dyeLot: shade.defaultDyeLot,
      tareWeightKg: shade.standardTareKg,
      category: shade.category === 'All' ? activeCategory : shade.category
    });
    playSuccessSound();
    onClose();
  };

  const handleApplyOpticalDetectedShade = () => {
    if (!selectedShadeResult) return;
    playClickSound();
    const shade = selectedShadeResult.shade;
    onApplyIntakeData({
      barcode: shade.code,
      shadeCode: shade.code,
      colorName: shade.name,
      colorHex: currentSampledHex, // Use live sampled hex or mill hex
      dyeLot: shade.defaultDyeLot,
      tareWeightKg: shade.standardTareKg,
      category: shade.category === 'All' ? activeCategory : shade.category
    });
    playSuccessSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Optical Textile &amp; Barcode Scanner
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {activeCategory} Intake
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan mill labels, extract exact yarn shades, or match fabric bolts via live camera eyedropper.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('camera_barcode');
            }}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'camera_barcode'
                ? 'bg-slate-800 text-rose-400 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>1D / 2D Barcode &amp; QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('optical_shade');
            }}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'optical_shade'
                ? 'bg-slate-800 text-rose-400 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Pipette className="w-4 h-4" />
            <span>Optical Shade Eyedropper</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded-md">
              AI Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('mill_palette');
            }}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'mill_palette'
                ? 'bg-slate-800 text-rose-400 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Mill Shade Swatch Book ({MILL_SHADE_CATALOG.length})</span>
          </button>
        </div>

        {/* Camera Selector Toolbar (when camera modes active) */}
        {(activeTab === 'camera_barcode' || activeTab === 'optical_shade') && availableCameras.length > 1 && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <SwitchCamera className="w-4 h-4 text-slate-400" />
              <span>Camera Source:</span>
            </div>
            <select
              value={selectedCameraId}
              onChange={e => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-200 font-medium text-xs focus:outline-none focus:border-rose-500"
            >
              {availableCameras.map(cam => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cameraError && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* TAB 1: 1D & 2D BARCODE / QR SCANNER */}
          {activeTab === 'camera_barcode' && (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-video max-h-[380px] flex items-center justify-center border-2 border-slate-800 shadow-inner">
                <div id={barcodeContainerId} className="w-full h-full" />

                {/* Laser scan line overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-40 border-2 border-dashed border-rose-500/80 rounded-2xl relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
                    <span className="absolute bottom-2 inset-x-0 text-center text-[10px] font-bold text-rose-300 bg-black/60 py-0.5 px-2 rounded-full w-max mx-auto">
                      Align Barcode or QR Code
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                  <Barcode className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">1D Bale Barcodes</span>
                    <span className="text-[11px] text-slate-400">EAN-13, Code 128, Code 39, ITF tags</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">2D Smart QR Labels</span>
                    <span className="text-[11px] text-slate-400">Auto-extracts Shade, Lot, Net &amp; Tare KG</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Instant Intake</span>
                    <span className="text-[11px] text-slate-400">Applies immediately to your intake table</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTICAL FABRIC SHADE EYEDROPPER */}
          {activeTab === 'optical_shade' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Video Viewfinder with Crosshairs */}
                <div className="space-y-2">
                  <div className="relative rounded-3xl overflow-hidden bg-black aspect-video max-h-[320px] flex items-center justify-center border-2 border-slate-800 shadow-inner">
                    <video
                      ref={eyedropperVideoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={eyedropperCanvasRef} className="hidden" />

                    {/* Reticle Target Crosshairs */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-20 h-20 border-2 border-rose-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                        <div className="w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: currentSampledHex }} />
                        <div className="absolute -top-3 w-0.5 h-3 bg-rose-500" />
                        <div className="absolute -bottom-3 w-0.5 h-3 bg-rose-500" />
                        <div className="absolute -left-3 h-0.5 w-3 bg-rose-500" />
                        <div className="absolute -right-3 h-0.5 w-3 bg-rose-500" />
                      </div>
                    </div>

                    {/* Sample Status Badge */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80">
                        <span className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: currentSampledHex }} />
                        <span className="font-mono font-bold text-xs text-white">{currentSampledHex}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setIsSampleLocked(!isSampleLocked);
                        }}
                        className={`px-3 py-1.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                          isSampleLocked
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                      >
                        {isSampleLocked ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resume Stream</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Freeze Sample</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Center the camera crosshair over the yarn cone or fabric bolt in clean natural lighting.
                  </p>
                </div>

                {/* Detected Mill Shade Match Card */}
                <div className="space-y-3 flex flex-col justify-between">
                  {selectedShadeResult ? (
                    <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Closest Mill Shade Match
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            selectedShadeResult.confidenceScore >= 80
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : selectedShadeResult.confidenceScore >= 60
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {selectedShadeResult.confidenceScore}% Optical Match
                          </span>
                        </div>

                        {/* Shade Swatch & Info */}
                        <div className="mt-3 flex items-start gap-3.5">
                          <div
                            className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-md shrink-0"
                            style={{ backgroundColor: selectedShadeResult.shade.hex }}
                          />
                          <div>
                            <h3 className="font-black text-white text-base">
                              {selectedShadeResult.shade.code}
                            </h3>
                            <p className="text-xs font-bold text-rose-400">
                              {selectedShadeResult.shade.name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {selectedShadeResult.shade.description}
                            </p>
                          </div>
                        </div>

                        {/* Batch Details Breakdown */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                            <span className="text-[10px] text-slate-400 block font-medium">Standard Dye Lot</span>
                            <span className="font-mono font-bold text-slate-200">
                              {selectedShadeResult.shade.defaultDyeLot || 'LOT-2026'}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                            <span className="text-[10px] text-slate-400 block font-medium">Mill Supplier</span>
                            <span className="font-bold text-slate-200 truncate block">
                              {selectedShadeResult.shade.millSupplier || 'Oster India Pvt Ltd'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={handleApplyOpticalDetectedShade}
                        className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Apply Detected Shade ({selectedShadeResult.shade.code}) to Intake</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-center text-slate-400 space-y-2 flex-1 flex flex-col items-center justify-center">
                      <Pipette className="w-8 h-8 text-slate-500" />
                      <p className="text-xs font-bold text-slate-300">Sampling Live Optical Feed...</p>
                    </div>
                  )}

                  {/* Alternative Close Matches */}
                  {matchedShades.length > 1 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Alternative Optical Matches:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {matchedShades.slice(1, 3).map((match, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setSelectedShadeResult(match);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 flex items-center gap-2 text-left cursor-pointer transition-colors"
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: match.shade.hex }}
                            />
                            <div className="truncate">
                              <span className="font-bold text-xs text-slate-200 block truncate">
                                {match.shade.code}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {match.confidenceScore}% match
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MILL SHADE SWATCH BOOK */}
          {activeTab === 'mill_palette' && (
            <div className="space-y-4">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={paletteSearch}
                    onChange={e => setPaletteSearch(e.target.value)}
                    placeholder="Search standard mill shade by code (e.g. 4251, 108, Navy, Mix Grey)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl font-medium text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700 shrink-0">
                  {(['All', 'Yarns', 'Fleece', 'Dereck'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setPaletteFilter(cat);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paletteFilter === cat
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swatch Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredPalette.map(shade => (
                  <div
                    key={shade.code}
                    onClick={() => handleSelectPaletteShade(shade)}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-rose-500/80 transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl border border-white/20 shadow-md shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: shade.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-white group-hover:text-rose-400 transition-colors">
                          {shade.code}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                          {shade.category}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-300 truncate mt-0.5">
                        {shade.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        Lot: {shade.defaultDyeLot || '26E081'} • {shade.millSupplier?.split('/')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Powered by Optical CIE76 Color Distance &amp; Oster India Mill Catalog
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
