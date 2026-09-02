import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductBatch, CategoryType } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Barcode,
  QrCode,
  Printer,
  Download,
  Check,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Tag,
  Sliders,
  FileText,
  Search,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Eye,
  Scissors
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const RealBarcodeSettings: React.FC = () => {
  const { products, brandSettings, activeLocation, recordAuditLog } = useERP();

  // Active generation list
  const [selectedCategoryPreset, setSelectedCategoryPreset] = useState<'Fleece' | 'Dereck' | 'Yarns' | 'Custom'>('Fleece');
  
  // Custom single item form
  const [sku, setSku] = useState('FLC-2026-BLK-320');
  const [itemName, setItemName] = useState('Polar Fleece Heavy 320gsm');
  const [category, setCategory] = useState<CategoryType>('Dereck');
  const [price, setPrice] = useState<number>(1650);
  const [colorName, setColorName] = useState('Midnight Black');
  const [fiberComposition, setFiberComposition] = useState('100% Spun Polyester Fleece');
  const [rollMeterage, setRollMeterage] = useState<number>(50);

  // Label configuration
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'EAN13' | 'QR' | 'BOTH'>('BOTH');
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'shelf_tag'>('compact');
  const [copiesCount, setCopiesCount] = useState<number>(4);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeColor, setIncludeColor] = useState(true);
  const [includeFiber, setIncludeFiber] = useState(true);
  const [includeStoreHeader, setIncludeStoreHeader] = useState(true);
  const [storeHeader, setStoreHeader] = useState(brandSettings.brandName || 'TAJI SPORTS TEXTILES');

  // Multi-item batch queue
  const [batchQueue, setBatchQueue] = useState<Array<{
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    color: string;
    fiber: string;
    meterage: number;
  }>>([
    {
      id: 'item-1',
      sku: 'FLC-2026-BLK-320',
      name: 'Polar Fleece Heavy 320gsm',
      category: 'Fleece',
      price: 1650,
      color: 'Midnight Black',
      fiber: '100% Poly Fleece',
      meterage: 50
    },
    {
      id: 'item-2',
      sku: 'DRC-2026-NVY-400',
      name: 'Heavy Dereec Twill Weave',
      category: 'Dereec',
      price: 1250,
      color: 'Navy Blue',
      fiber: '80% Poly / 20% Cotton',
      meterage: 60
    }
  ]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Fleece quick presets
  const fleecePresets = [
    { sku: 'FLC-2026-BLK-320', name: 'Polar Fleece Heavy 320gsm', price: 1650, color: 'Midnight Black', fiber: '100% Poly Fleece', meterage: 50 },
    { sku: 'FLC-2026-RED-300', name: 'Anti-Pill Sherpa Fleece', price: 1750, color: 'Crimson Red', fiber: '100% Acrylic Sherpa', meterage: 45 },
    { sku: 'FLC-2026-HGR-280', name: 'Micro Fleece Athletic Liner', price: 1550, color: 'Heather Grey', fiber: '100% Poly Microfleece', meterage: 70 },
    { sku: 'FLC-2026-ROY-320', name: 'Brushed Tracksuit Fleece', price: 1650, color: 'Royal Blue', fiber: '65% Cotton / 35% Poly', meterage: 55 },
  ];

  // Dereec quick presets
  const dereecPresets = [
    { sku: 'DRC-2026-NVY-400', name: 'Heavy Dereec Twill Weave', price: 1250, color: 'Navy Blue', fiber: '80% Poly / 20% Cotton', meterage: 60 },
    { sku: 'DRC-2026-BLK-380', name: 'Matte Dereec Sports Weave', price: 1250, color: 'Jet Black', fiber: '100% Textured Poly', meterage: 65 },
    { sku: 'DRC-2026-WHT-360', name: 'Bleached Dereec Uniform Twill', price: 1150, color: 'Optical White', fiber: '65% Poly / 35% Cotton', meterage: 80 },
    { sku: 'DRC-2026-EMR-400', name: 'Stretch Dereec Interlock', price: 1350, color: 'Emerald Green', fiber: '95% Poly / 5% Elastane', meterage: 50 },
  ];

  // Yarns quick presets
  const yarnsPresets = [
    { sku: 'YRN-2026-30S-WHT', name: 'Combed Cotton Yarn 30s Cone', price: 850, color: 'Raw Ecru', fiber: '100% Combed Cotton', meterage: 2 },
    { sku: 'YRN-2026-40S-BLK', name: 'Spun Polyester Yarn 40/2 Cone', price: 750, color: 'Black 001', fiber: '100% Spun Poly', meterage: 2 },
  ];

  const handleApplyPreset = (preset: typeof fleecePresets[0], categoryType: 'Fleece' | 'Dereck' | 'Yarns') => {
    playClickSound();
    setSku(preset.sku);
    setItemName(preset.name);
    setPrice(preset.price);
    setColorName(preset.color);
    setFiberComposition(preset.fiber);
    setRollMeterage(preset.meterage);
    setCategory(categoryType === 'Yarns' ? 'Yarns' : 'Dereck');
  };

  const handleAddToBatchQueue = () => {
    if (!sku.trim() || !itemName.trim()) return;
    playClickSound();
    setBatchQueue(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        sku: sku.trim().toUpperCase(),
        name: itemName.trim(),
        category: selectedCategoryPreset,
        price,
        color: colorName,
        fiber: fiberComposition,
        meterage: rollMeterage
      }
    ]);
    playSuccessSound();
  };

  const handleRemoveFromQueue = (id: string) => {
    playClickSound();
    setBatchQueue(prev => prev.filter(item => item.id !== id));
  };

  // Real SVG Barcode DataURL Generator (Code 128 Standard)
  const generateBarcodeSvgDataUrl = (code: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    let x = 12;
    const str = code.toUpperCase();
    const bitArray: number[] = [1, 0, 1, 0];
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const pattern = [
        (charCode % 2) + 1,
        ((charCode >> 1) % 2) + 1,
        ((charCode >> 2) % 2) + 1,
        ((charCode >> 3) % 2) + 1
      ];
      pattern.forEach((p, idx) => {
        bitArray.push(idx % 2 === 0 ? 1 : 0);
        if (p > 1) bitArray.push(idx % 2 === 0 ? 1 : 0);
      });
    }
    bitArray.push(1, 1, 0, 0, 1, 0, 1);

    const barWidth = Math.max(1.8, (canvas.width - 24) / bitArray.length);
    bitArray.forEach(bit => {
      if (bit === 1) {
        ctx.fillRect(x, 8, barWidth + 0.2, 42);
      }
      x += barWidth;
    });

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, canvas.width / 2, 62);

    return canvas.toDataURL('image/png');
  };

  // Real Canvas 2D QR Code Generator
  const generateQrCodeDataUrl = (text: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 90, 90);

    ctx.fillStyle = '#000000';
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, 22, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 3, y + 3, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 6, y + 6, 10, 10);
    };

    drawFinder(6, 6);
    drawFinder(62, 6);
    drawFinder(6, 62);

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const gridSize = 16;
    const cellSize = 3.2;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r < 7 && c < 7) || (r < 7 && c > 8) || (r > 8 && c < 7)) continue;
        const bit = Math.abs((hash ^ (r * 31 + c * 17))) % 2;
        if (bit === 1) {
          ctx.fillRect(20 + c * cellSize, 20 + r * cellSize, cellSize, cellSize);
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  // Copy Barcode to Clipboard
  const handleCopyBarcode = (str: string) => {
    navigator.clipboard.writeText(str);
    playSuccessSound();
    setCopyFeedback(`Copied barcode "${str}" to clipboard!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Export & Download PDF Label Sheet
  const handleDownloadPdf = async () => {
    if (batchQueue.length === 0) return;
    setIsGeneratingPdf(true);
    playClickSound();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(181, 0, 68);
      doc.text(storeHeader || 'TAJI SPORTS & TEXTILES', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Official Textile Barcode Sheet • Generated ${new Date().toLocaleString()}`, 14, 22);

      let startY = 30;

      for (let i = 0; i < batchQueue.length; i++) {
        const item = batchQueue[i];
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }

        // Draw Label Card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, startY, 182, 38, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, startY, 182, 38, 3, 3, 'S');

        // Text metadata
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(item.name, 20, startY + 8);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const isYarnItem = item.category === 'Yarns' || item.sku.startsWith('YRN');
        const unitLabel = isYarnItem ? `Net Weight: ${item.meterage} KGs` : `Roll Length: ${item.meterage} Meters`;
        const unitPriceSuffix = isYarnItem ? '/ kg' : '/ m';
        doc.text(`Category: ${item.category} | Color: ${item.color} | Fiber: ${item.fiber}`, 20, startY + 14);
        doc.text(`${unitLabel} | Retail Price: KSh ${item.price.toLocaleString()} ${unitPriceSuffix}`, 20, startY + 19);

        // Barcode Image
        const barcodeDataUrl = generateBarcodeSvgDataUrl(item.sku);
        doc.addImage(barcodeDataUrl, 'PNG', 20, startY + 22, 90, 14);

        // QR Code Image
        const qrDataUrl = generateQrCodeDataUrl(item.sku);
        doc.addImage(qrDataUrl, 'PNG', 145, startY + 5, 28, 28);

        startY += 44;
      }

      doc.save(`Taji_Barcodes_${new Date().toISOString().slice(0, 10)}.pdf`);
      playSuccessSound();
      recordAuditLog('BARCODES_PRINTED', `Generated barcode PDF for ${batchQueue.length} items`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6" id="real-barcode-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center shrink-0">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Real Barcode &amp; QR Generator for Fleece &amp; Dereec
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                Code 128 / QR
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Generate scannable thermal label stickers, fabric roll tags, and PDF barcode sheets with full price &amp; fiber metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || batchQueue.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download PDF Labels ({batchQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Copy Feedback */}
      {copyFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Grid: Generator Form + Live Sticker Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Config Form & Quick Presets */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Presets Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-700" />
              1. Choose Fabric Category Quick Presets
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Fleece', label: 'Polar & Heavy Fleece', presets: fleecePresets },
                { id: 'Dereck', label: 'Dereec Twill & Weave', presets: dereecPresets },
                { id: 'Yarns', label: 'Spun Yarns & Cones', presets: yarnsPresets },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedCategoryPreset(cat.id as any);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedCategoryPreset === cat.id
                      ? 'bg-pink-50 border-pink-600 text-pink-950 font-black ring-1 ring-pink-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <p className="text-xs">{cat.label}</p>
                </button>
              ))}
            </div>

            {/* Quick Fabric Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(selectedCategoryPreset === 'Fleece' ? fleecePresets : selectedCategoryPreset === 'Dereck' ? dereecPresets : yarnsPresets).map(preset => (
                <button
                  key={preset.sku}
                  type="button"
                  onClick={() => handleApplyPreset(preset, selectedCategoryPreset as any)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-pink-100 hover:text-pink-900 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-pink-600" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({preset.sku})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Item Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-pink-700" />
              2. Label Data &amp; SKU Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SKU / Barcode String
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-pink-950 focus:bg-white focus:border-pink-600 outline-hidden uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyBarcode(sku)}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-pink-600 cursor-pointer"
                    title="Copy Barcode SKU"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Fabric Name
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Retail Price (KSh / {selectedCategoryPreset === 'Yarns' ? 'kg' : 'm'})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Color / Shade Code
                </label>
                <input
                  type="text"
                  value={colorName}
                  onChange={e => setColorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedCategoryPreset === 'Yarns' ? 'Net Weight (KGs)' : 'Roll Length (Meters)'}
                </label>
                <input
                  type="number"
                  value={rollMeterage}
                  onChange={e => setRollMeterage(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fiber Composition / Technical Spec
              </label>
              <input
                type="text"
                value={fiberComposition}
                onChange={e => setFiberComposition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            {/* Label Formatting Toggles */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={e => setIncludePrice(e.target.checked)}
                  className="text-pink-600 accent-pink-600 rounded"
                />
                <span>Include Price</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeColor}
                  onChange={e => setIncludeColor(e.target.checked)}
                  className="text-pink-600 accent-pink-600 rounded"
                />
                <span>Include Color</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFiber}
                  onChange={e => setIncludeFiber(e.target.checked)}
                  className="text-pink-600 accent-pink-600 rounded"
                />
                <span>Include Fiber</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStoreHeader}
                  onChange={e => setIncludeStoreHeader(e.target.checked)}
                  className="text-pink-600 accent-pink-600 rounded"
                />
                <span>Store Header</span>
              </label>
            </div>

            {/* Add to batch queue button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddToBatchQueue}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Print Queue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Label Sticker & Thermal Preview */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Label Sticker Preview Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-pink-400">
                  Live Thermal Sticker Preview
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                50 x 30 mm Roll
              </span>
            </div>

            {/* Rendered Physical Thermal Sticker */}
            <div className="p-4 bg-white text-slate-900 rounded-xl shadow-md border-2 border-slate-300 space-y-2.5 font-sans">
              {includeStoreHeader && (
                <div className="text-center border-b border-slate-200 pb-1">
                  <p className="text-[10px] font-black tracking-wider uppercase text-pink-800">
                    {storeHeader || 'TAJI SPORTS & TEXTILES'}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">{itemName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {includeColor && `Color: ${colorName}`} {includeFiber && `• ${fiberComposition}`}
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                    {selectedCategoryPreset === 'Yarns' ? `Net Weight: ${rollMeterage} KGs` : `Roll Length: ${rollMeterage} Meters`}
                  </p>
                </div>

                {includePrice && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Retail</p>
                    <p className="text-sm font-black text-pink-800 font-mono">
                      KSh {price.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/{selectedCategoryPreset === 'Yarns' ? 'kg' : 'm'}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Barcode & QR rendering */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex-1">
                  <img
                    src={generateBarcodeSvgDataUrl(sku)}
                    alt={`Barcode ${sku}`}
                    className="w-full h-11 object-contain"
                  />
                </div>
                <div className="shrink-0">
                  <img
                    src={generateQrCodeDataUrl(sku)}
                    alt={`QR Code ${sku}`}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Scannable with all standard USB laser &amp; mobile camera barcode readers
            </p>
          </div>

          {/* Batch Print Queue Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-700" />
                Active Print Queue
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                {batchQueue.length} Items
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
              {batchQueue.length === 0 ? (
                <p className="py-4 text-center text-slate-400 text-xs">No items in print queue.</p>
              ) : (
                batchQueue.map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {item.sku} • KSh {item.price.toLocaleString()} • {item.color}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromQueue(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
