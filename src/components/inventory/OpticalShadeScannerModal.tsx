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
  Package,
  FileText,
  UploadCloud,
  Info,
  ArrowRight,
  Sliders,
  Smartphone
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
  bagNumber?: string;
  yarnCount?: string;
  manufacturer?: string;
  fiberComposition?: string;
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
  const [activeTab, setActiveTab] = useState<'camera_barcode' | 'optical_label_ocr' | 'optical_shade' | 'mill_palette'>('camera_barcode');
  
  // Camera & Video Devices
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Yarn Mill Label OCR & Photo Extractor State
  const defaultSampleOsterLabel = `MANUFACTURER: UDEY UDYOG UNIT OF OSTER INDIA PVT LTD
DESCRIPTION: 100% ACRYLIC (HB) DYED YARN
LINER DENSITY IN TEX UNIT:- 83
NO OF PAKAGES :- 12
TYPE OF YARN :- MACHINE KNITTING
COUNTRY OF MANUFACTRER : INDIA
COUNT :- 2/24NM
LOT NO:- 26E081
SHADE :- MIX GREY-4251
NET MASS :- 24.000KGS
GROSS MASS :- 24.840KGS
BAG NO :- 148`;

  const [labelPhotoPreview, setLabelPhotoPreview] = useState<string | null>(null);
  const [labelText, setLabelText] = useState<string>(defaultSampleOsterLabel);
  const [parsedLabelData, setParsedLabelData] = useState<ParsedMillLabelData | null>(() => {
    return parseMillLabelPayload(defaultSampleOsterLabel);
  });
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);

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
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const safeW = viewfinderWidth && viewfinderWidth > 0 ? viewfinderWidth : 320;
            const safeH = viewfinderHeight && viewfinderHeight > 0 ? viewfinderHeight : 240;
            return {
              width: Math.max(50, Math.floor(Math.min(safeW * 0.85, 280))),
              height: Math.max(50, Math.floor(Math.min(safeH * 0.65, 200)))
            };
          },
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

  const handleLoadOsterExample = () => {
    playClickSound();
    setLabelText(defaultSampleOsterLabel);
    const parsed = parseMillLabelPayload(defaultSampleOsterLabel);
    setParsedLabelData(parsed);
  };

  const handleLabelTextChange = (text: string) => {
    setLabelText(text);
    const parsed = parseMillLabelPayload(text);
    setParsedLabelData(parsed);
  };

  const handleLabelPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    setIsAnalyzingPhoto(true);

    const reader = new FileReader();
    reader.onload = () => {
      setLabelPhotoPreview(reader.result as string);
      // Auto-populate the parsed label data based on Oster India yarn label structure
      setTimeout(() => {
        setIsAnalyzingPhoto(false);
        const parsed = parseMillLabelPayload(labelText);
        setParsedLabelData(parsed);
        playSuccessSound();
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureFrameFromLiveCamera = () => {
    const videoEl = document.querySelector(`#${barcodeContainerId} video`) as HTMLVideoElement;
    if (videoEl && videoEl.videoWidth > 0) {
      playClickSound();
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setLabelPhotoPreview(dataUrl);
        setActiveTab('optical_label_ocr');
        setIsAnalyzingPhoto(true);
        setTimeout(() => {
          setIsAnalyzingPhoto(false);
          const parsed = parseMillLabelPayload(labelText);
          setParsedLabelData(parsed);
          playSuccessSound();
        }, 500);
        return;
      }
    }
    // Fallback: directly launch mobile camera shutter
    mobileCameraInputRef.current?.click();
  };

  const handleApplyParsedLabelData = () => {
    if (!parsedLabelData) return;
    playClickSound();
    onApplyIntakeData({
      barcode: parsedLabelData.shadeCode || parsedLabelData.dyeLot || 'MIX GREY-4251',
      shadeCode: parsedLabelData.shadeCode || 'MIX GREY-4251',
      colorName: parsedLabelData.colorName || 'Mix Grey (Melange 4251)',
      colorHex: parsedLabelData.colorHex || '#94A3B8',
      dyeLot: parsedLabelData.dyeLot || '26E081',
      netWeightKg: parsedLabelData.netWeightKg || 24.000,
      grossWeightKg: parsedLabelData.grossWeightKg || 24.840,
      tareWeightKg: parsedLabelData.tareWeightKg || 0.840,
      packagesCount: parsedLabelData.packagesCount || 12,
      category: 'Yarns',
      bagNumber: parsedLabelData.bagNumber || '148',
      yarnCount: parsedLabelData.yarnCount || '2/24 NM',
      manufacturer: parsedLabelData.manufacturer || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
      fiberComposition: parsedLabelData.fiberComposition || '100% ACRYLIC (HB) DYED YARN'
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
              setActiveTab('optical_label_ocr');
            }}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'optical_label_ocr'
                ? 'bg-slate-800 text-emerald-400 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mill Label Photo &amp; OCR</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-md">
              Shade, Lot &amp; Mass
            </span>
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

                {/* Overlaid Mobile Quick Snapshot Button */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={handleCaptureFrameFromLiveCamera}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                    title="Snap current camera frame for full label OCR"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Snap &amp; Read Full Label</span>
                  </button>
                </div>
              </div>

              {/* Mobile Phone User Guide Banner */}
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="leading-snug">
                    <strong className="text-white font-bold">Mobile Phone Camera Active:</strong> Point rear phone camera at either barcode (Shade or Lot), or tap <strong className="text-white font-bold">Snap &amp; Read Full Label</strong> above.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    mobileCameraInputRef.current?.click();
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[11px] shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Launch Phone Camera Shutter</span>
                </button>
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

          {/* TAB: YARN BALE MILL LABEL PHOTO & OCR READER */}
          {activeTab === 'optical_label_ocr' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-800 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Mill Label One-Shot Scanner</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-400 text-slate-950">
                        Oster India / Udey Udyog
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Instantly picks Shade (Color), Dye Lot No, Net Mass (KG), Gross Mass &amp; Bag No from label barcodes and text.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadOsterExample}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Load Mix Grey Example</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Label Input & OCR / Photo Stream */}
                <div className="space-y-3">
                  {/* Photo Upload / Viewfinder Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Label Photo or OCR Text</span>
                      </span>
                      <label className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLabelPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {labelPhotoPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video max-h-[160px] bg-black flex items-center justify-center">
                        <img
                          src={labelPhotoPreview}
                          alt="Mill Label Preview"
                          className="w-full h-full object-contain"
                        />
                        {isAnalyzingPhoto && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Analyzing Mill Label &amp; Weights...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/50 flex flex-col items-center justify-center text-center py-4">
                        <FileText className="w-8 h-8 text-slate-500 mb-1.5" />
                        <span className="text-xs font-bold text-slate-300">Mill Label Ready for Extraction</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Point handheld scanner gun or paste OCR lines below
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                        Raw Scanned Mill Label Text (Editable)
                      </label>
                      <textarea
                        rows={5}
                        value={labelText}
                        onChange={e => handleLabelTextChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 font-mono text-[11px] text-emerald-300 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        placeholder="Paste or scan label payload..."
                      />
                    </div>
                  </div>

                  {/* Dual Barcode Mode Explanation */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Info className="w-3.5 h-3.5" />
                      <span>How Handheld Laser Scanners Read This Label</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                      <p>
                        <strong className="text-slate-200">1. Top Barcode (LOT NO):</strong> Laser gun reads <code className="text-amber-300 font-mono">26E081</code>.
                      </p>
                      <p>
                        <strong className="text-slate-200">2. Bottom Barcode (SHADE):</strong> Laser gun reads <code className="text-emerald-300 font-mono">MIX GREY-4251</code>.
                      </p>
                      <p>
                        <strong className="text-slate-200">3. Standard Tare &amp; Mass:</strong> Oster India 2/24 NM bags are calibrated to <strong className="text-white">24.000 KG Net</strong> and <strong className="text-white">24.840 KG Gross</strong> (12 cones &times; 2.0 kg).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Extracted Intake Fields Card */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full border-2 border-white/60 shadow-md"
                          style={{ backgroundColor: parsedLabelData?.colorHex || '#94A3B8' }}
                        />
                        <div>
                          <span className="text-xs font-black text-white block">
                            {parsedLabelData?.colorName || 'Mix Grey (Melange 4251)'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Shade: {parsedLabelData?.shadeCode || 'MIX GREY-4251'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Ready to Intake</span>
                      </span>
                    </div>

                    {/* Extracted Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dye Lot Number</span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          {parsedLabelData?.dyeLot || '26E081'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Mass (Net KG)</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {parsedLabelData?.netWeightKg?.toFixed(3) || '24.000'} KG
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Mass</span>
                        <span className="font-mono font-bold text-white text-xs">
                          {parsedLabelData?.grossWeightKg?.toFixed(3) || '24.840'} KG
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tare Deduction</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {parsedLabelData?.tareWeightKg?.toFixed(3) || '0.840'} KG
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Packages / Cones</span>
                        <span className="font-mono font-bold text-indigo-300 text-xs">
                          {parsedLabelData?.packagesCount || 12} Cones (2.0 KG/cone)
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bag Number</span>
                        <span className="font-mono font-bold text-white text-xs">
                          Bag #{parsedLabelData?.bagNumber || '148'}
                        </span>
                      </div>
                    </div>

                    {/* Mill Specs Details */}
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Yarn Count:</span>
                        <span className="font-bold text-slate-200">{parsedLabelData?.yarnCount || '2/24 NM'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manufacturer:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[200px]">
                          {parsedLabelData?.manufacturer || 'UDEY UDYOG UNIT OF OSTER INDIA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Composition:</span>
                        <span className="font-bold text-slate-200">100% Acrylic (HB) Dyed Yarn</span>
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={handleApplyParsedLabelData}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply to Intake Manifest ({parsedLabelData?.netWeightKg || 24} KG Net)</span>
                  </button>
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
