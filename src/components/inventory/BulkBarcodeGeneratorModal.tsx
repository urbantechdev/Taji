import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductBatch, CategoryType, LocationId, InwardInvoiceRecord } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Barcode,
  QrCode,
  Printer,
  Download,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Plus,
  X,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  Package,
  Store,
  Warehouse,
  Eye,
  Tag,
  Grid,
  Boxes,
  Scroll,
  Scissors
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';
import { generateRealQRCodeDataURL, generateRealBarcodeDataURL } from '../../utils/realQrBarcode';

interface BulkBarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBatchId?: string;
  preselectedInvoice?: InwardInvoiceRecord | null;
}

export const BulkBarcodeGeneratorModal: React.FC<BulkBarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  preselectedBatchId,
  preselectedInvoice
}) => {
  const { products, locations, activeLocation, currentUser } = useERP();

  // Selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'All'>('All');
  const [stockLocationFilter, setStockLocationFilter] = useState<LocationId | 'All'>('All');

  // Invoice Packing List state
  const [packingListMode, setPackingListMode] = useState<'line_items' | 'rolls'>('line_items');
  const [selectedPackingItemIds, setSelectedPackingItemIds] = useState<string[]>([]);

  // Generator configuration
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'EAN13' | 'QR' | 'BOTH'>('BOTH');
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'jewelry_mini' | 'shelf_tag'>('standard');
  const [copiesPerItem, setCopiesPerItem] = useState<number>(2);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [includeCategory, setIncludeCategory] = useState<boolean>(true);
  const [includeColor, setIncludeColor] = useState<boolean>(true);
  const [includeStoreName, setIncludeStoreName] = useState<boolean>(true);
  const [customStoreHeader, setCustomStoreHeader] = useState<string>('ZAMODA SPORTS TEXTILES');
  
  // Custom manual barcode generation list (add on the fly)
  const [customItems, setCustomItems] = useState<Array<{ sku: string; name: string; price: number; category: string }>>([]);
  const [customSkuInput, setCustomSkuInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');
  const [customPriceInput, setCustomPriceInput] = useState(1200);

  // Status/Feedback
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  // Initialize selected products on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedInvoice && preselectedInvoice.lineItems) {
        setSelectedPackingItemIds(preselectedInvoice.lineItems.map(li => li.id));
        setCustomStoreHeader(`TAJI TEXTILES • INV ${preselectedInvoice.invoiceNumber}`);
      } else if (preselectedBatchId) {
        setSelectedProductIds([preselectedBatchId]);
      } else if (products.length > 0) {
        // Pre-select the first 8 products by default for instant preview if none selected
        setSelectedProductIds(prev => (prev.length === 0 ? products.slice(0, 8).map(p => p.id) : prev));
      }
    }
  }, [isOpen, preselectedBatchId, preselectedInvoice?.id, preselectedInvoice?.invoiceNumber]);

  if (!isOpen) return null;

  // Filtered product catalog
  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.colorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStock = true;
    if (stockLocationFilter !== 'All') {
      matchesStock = (p.locationStock[stockLocationFilter] || 0) > 0;
    }
    return matchesCat && matchesSearch && matchesStock;
  });

  const toggleSelectAll = () => {
    playClickSound();
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleProductSelection = (id: string) => {
    playClickSound();
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkuInput.trim()) return;
    playClickSound();
    setCustomItems(prev => [
      ...prev,
      {
        sku: customSkuInput.trim().toUpperCase(),
        name: customNameInput.trim() || `Textile Item ${customSkuInput.trim().toUpperCase()}`,
        price: Number(customPriceInput) || 1000,
        category: 'Dereck'
      }
    ]);
    setCustomSkuInput('');
    setCustomNameInput('');
  };

  // Compile list of items to render
  const selectedProductList: Array<{
    id: string;
    sku: string;
    barcode: string;
    name: string;
    category: string;
    colorName: string;
    colorHex: string;
    price: number;
    unit: string;
    subText?: string;
  }> = useMemo(() => {
    if (preselectedInvoice && preselectedInvoice.lineItems && preselectedInvoice.lineItems.length > 0) {
      const items: Array<{
        id: string;
        sku: string;
        barcode: string;
        name: string;
        category: string;
        colorName: string;
        colorHex: string;
        price: number;
        unit: string;
        subText?: string;
      }> = [];

      preselectedInvoice.lineItems
        .filter(li => selectedPackingItemIds.includes(li.id))
        .forEach((li, idx) => {
          const baseSku = li.sku || `INV-${preselectedInvoice.invoiceNumber}-${idx + 1}`;
          const basePrice = li.unitPriceKES || (li.unitPriceUSD ? Math.round(li.unitPriceUSD * (preselectedInvoice.exchangeRate || 130)) : 1000);
          const rolls = Math.min(100, Math.max(1, Number(li.rollsCount || li.packagesCount || 1)));

          if (packingListMode === 'rolls') {
            for (let r = 1; r <= rolls; r++) {
              const rollCode = `${baseSku}-R${String(r).padStart(2, '0')}`;
              items.push({
                id: `${li.id}-roll-${r}`,
                sku: rollCode,
                barcode: rollCode,
                name: `${li.name} (Roll ${r}/${rolls})`,
                category: li.category,
                colorName: `${li.colorName || li.shadeCode || 'Standard'} • Roll ${r} of ${rolls}`,
                colorHex: li.colorHex || '#334155',
                price: basePrice,
                unit: li.unit || 'meter',
                subText: `Inv: ${preselectedInvoice.invoiceNumber} • Lot: ${li.dyeLot || 'N/A'}`
              });
            }
          } else {
            items.push({
              id: li.id,
              sku: baseSku,
              barcode: li.sku || `INV-${preselectedInvoice.invoiceNumber}-${idx + 1}`,
              name: li.name,
              category: li.category,
              colorName: `${li.colorName || ''} ${li.shadeCode ? `(${li.shadeCode})` : ''}`.trim() || 'Standard',
              colorHex: li.colorHex || '#334155',
              price: basePrice,
              unit: li.unit || 'meter',
              subText: `Inv: ${preselectedInvoice.invoiceNumber}${li.dyeLot ? ` • Lot: ${li.dyeLot}` : ''}${rolls > 1 ? ` • ${rolls} Rolls` : ''}`
            });
          }
        });

      return items;
    }

    return [
      ...products
        .filter(p => selectedProductIds.includes(p.id))
        .map(p => {
          const lotSku = p.dyeLot || p.sku;
          return {
            id: p.id,
            sku: lotSku,
            barcode: p.barcode || lotSku,
            name: p.name,
            category: p.category,
            colorName: p.colorName,
            colorHex: p.colorHex,
            price: p.unitPriceRetail,
            unit: p.unit,
            subText: p.dyeLot ? `Lot: ${p.dyeLot}` : undefined
          };
        }),
      ...customItems.map((c, i) => ({
        id: `CUSTOM-${i}`,
        sku: c.sku,
        barcode: c.sku,
        name: c.name,
        category: c.category,
        colorName: 'Standard',
        colorHex: '#334155',
        price: c.price,
        unit: 'meter'
      }))
    ];
  }, [preselectedInvoice, selectedPackingItemIds, packingListMode, products, selectedProductIds, customItems]);

  const totalLabelsToPrint = selectedProductList.length * Math.max(1, copiesPerItem);

  // Real Barcode & QR Code generators using ISO/IEC standards
  const generateBarcodeDataUrl = (code: string): string => {
    return generateRealBarcodeDataURL(code, {
      format: 'CODE128',
      width: 2,
      height: 48,
      displayValue: true,
      fontSize: 10
    });
  };

  // EXPORT STICKER SHEET AS PRINT-READY PDF
  const handleExportPdf = async () => {
    if (selectedProductList.length === 0) return;
    setIsGeneratingPdf(true);
    playClickSound();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(customStoreHeader, 12, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `Bulk Barcode Sticker Sheet | ISO/IEC Real Barcodes | Generated on ${new Date().toLocaleDateString()} | Total Labels: ${totalLabelsToPrint}`,
        12,
        17
      );

      // Grid Layout for Labels (e.g., 3 columns x 7 rows per A4 page)
      const cols = labelSize === 'compact' ? 4 : labelSize === 'shelf_tag' ? 2 : 3;
      const marginX = 8;
      const marginY = 26;
      const colWidth = (pageWidth - marginX * 2 - (cols - 1) * 4) / cols;
      const rowHeight = labelSize === 'compact' ? 32 : labelSize === 'shelf_tag' ? 46 : 38;

      let currentX = marginX;
      let currentY = marginY;
      let colIndex = 0;

      // Expand items by copies
      const allLabelsToRender: typeof selectedProductList = [];
      selectedProductList.forEach(item => {
        for (let i = 0; i < Math.max(1, copiesPerItem); i++) {
          allLabelsToRender.push(item);
        }
      });

      for (let index = 0; index < allLabelsToRender.length; index++) {
        const item = allLabelsToRender[index];

        // Check page overflow
        if (currentY + rowHeight > pageHeight - 10) {
          doc.addPage();
          currentY = 12;
          colIndex = 0;
          currentX = marginX;
        }

        // Draw sticker container with rounded border
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.roundedRect(currentX, currentY, colWidth, rowHeight - 2, 2, 2, 'FD');

        // Store Name / Tag Top
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(customStoreHeader.slice(0, 28), currentX + 3, currentY + 4.5);

        // Category Badge
        if (includeCategory) {
          doc.setFontSize(6);
          doc.setTextColor(190, 24, 93); // pink-700
          doc.text(item.category.toUpperCase(), currentX + colWidth - 3, currentY + 4.5, { align: 'right' });
        }

        // Product Name (Truncated)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const truncatedName = item.name.length > 22 ? `${item.name.slice(0, 20)}...` : item.name;
        doc.text(truncatedName, currentX + 3, currentY + 9);

        // Color & Specs
        if (includeColor) {
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Color: ${item.colorName}`, currentX + 3, currentY + 12.5);
        }

        // Real Barcode and QR Images
        const barcodeImg = generateBarcodeDataUrl(item.barcode);
        const qrImg = await generateRealQRCodeDataURL(item.barcode, { width: 140, margin: 1 });

        if (barcodeFormat === 'QR') {
          if (qrImg) {
            doc.addImage(qrImg, 'PNG', currentX + (colWidth - 18) / 2, currentY + 14, 18, 18);
          }
        } else if (barcodeFormat === 'CODE128') {
          if (barcodeImg) {
            doc.addImage(barcodeImg, 'PNG', currentX + 3, currentY + 13, colWidth - 6, 13);
          }
        } else {
          // BOTH: Barcode on left, QR on right
          if (barcodeImg) {
            doc.addImage(barcodeImg, 'PNG', currentX + 3, currentY + 13.5, colWidth - 19, 11);
          }
          if (qrImg) {
            doc.addImage(qrImg, 'PNG', currentX + colWidth - 15, currentY + 13, 12, 12);
          }
        }

        // Price Footer
        if (includePrice) {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.text(
            `KSh ${item.price.toLocaleString()}/${item.unit}`,
            currentX + 3,
            currentY + rowHeight - 4.5
          );

          // SKU text at bottom right
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(item.sku, currentX + colWidth - 3, currentY + rowHeight - 4.5, { align: 'right' });
        }

        // Move to next column/row
        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          currentX = marginX;
          currentY += rowHeight;
        } else {
          currentX += colWidth + 4;
        }
      }

      doc.save(`Zamoda_Bulk_Barcodes_${new Date().toISOString().slice(0, 10)}.pdf`);
      playSuccessSound();
      setCopySuccessMsg(`PDF Generated with ${totalLabelsToPrint} Printable Barcode Stickers!`);
      setTimeout(() => setCopySuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // BROWSER DIRECT PRINT TRIGGER
  const handleDirectPrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-slate-950 sm:bg-slate-950/70 backdrop-blur-md p-0 sm:p-4 overflow-hidden sm:overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-6xl w-full h-[100dvh] sm:h-[95vh] flex flex-col border-0 sm:border border-slate-200 overflow-hidden text-slate-900">
        
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-500/20 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Barcode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-extrabold text-sm sm:text-lg text-white truncate">
                  {preselectedInvoice ? `Packing List Barcode Studio (${preselectedInvoice.invoiceNumber})` : 'Bulk Barcode & QR Label Generator'}
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[9px] sm:text-[10px] font-bold border border-rose-500/30 shrink-0">
                  {preselectedInvoice ? 'Packing List' : 'Labels'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                {preselectedInvoice
                  ? `Generate, preview and print barcode stickers directly from accountant's invoice packing list (${preselectedInvoice.supplierName})`
                  : 'Batch generate, preview and print EAN/Code-128 barcode labels with live price & category tags'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {copySuccessMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{copySuccessMsg}</span>
            </div>
            <button onClick={() => setCopySuccessMsg(null)} className="p-1 hover:bg-emerald-700 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-hidden">
          
          {/* LEFT COLUMN: SELECTION & CUSTOMIZATION (5 Cols) */}
          <div className="lg:col-span-5 border-r border-slate-200 p-4 overflow-y-auto space-y-4 bg-slate-50/50">

            {/* INVOICE PACKING LIST SECTION (When opened from an Inward Invoice) */}
            {preselectedInvoice && (
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-rose-50/90 border-2 border-amber-300/80 rounded-2xl p-3.5 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                          Packing List: {preselectedInvoice.invoiceNumber}
                        </span>
                        <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded-md text-[9px] font-extrabold uppercase">
                          {preselectedInvoice.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Supplier: <strong className="text-slate-800">{preselectedInvoice.supplierName}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Packing List Mode Switch */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Label Generation Mode:</span>
                    <span className="text-[10px] text-amber-700 font-semibold font-mono">
                      {packingListMode === 'rolls' ? '1 Label per Roll/Bale' : '1 Label per SKU/Line Item'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setPackingListMode('line_items');
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        packingListMode === 'line_items'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Line Item SKUs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setPackingListMode('rolls');
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        packingListMode === 'rolls'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Roll-by-Roll (R01..)</span>
                    </button>
                  </div>
                </div>

                {/* Checklist of Packing List Items */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Scroll className="w-3.5 h-3.5 text-amber-600" />
                      Invoice Items ({selectedPackingItemIds.length}/{preselectedInvoice.lineItems?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        if (selectedPackingItemIds.length === (preselectedInvoice.lineItems?.length || 0)) {
                          setSelectedPackingItemIds([]);
                        } else {
                          setSelectedPackingItemIds(preselectedInvoice.lineItems?.map(li => li.id) || []);
                        }
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      {selectedPackingItemIds.length === (preselectedInvoice.lineItems?.length || 0) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="bg-white border border-amber-200/90 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1 shadow-2xs">
                    {preselectedInvoice.lineItems?.map((li, liIdx) => {
                      const isSelected = selectedPackingItemIds.includes(li.id);
                      return (
                        <div
                          key={li.id || liIdx}
                          onClick={() => {
                            playClickSound();
                            setSelectedPackingItemIds(prev =>
                              prev.includes(li.id) ? prev.filter(x => x !== li.id) : [...prev, li.id]
                            );
                          }}
                          className={`p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs'
                              : 'bg-slate-50/40 border-slate-100 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 text-rose-600">
                              {isSelected ? <CheckSquare className="w-4 h-4 fill-rose-600 text-white" /> : <Square className="w-4 h-4 text-slate-300" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate text-slate-900">{li.name}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                {li.colorHex && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: li.colorHex }}
                                  />
                                )}
                                <span className="truncate">{li.colorName || li.shadeCode || 'Std'}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{li.quantity} {li.unit}</span>
                                {li.rollsCount ? (
                                  <span className="font-bold text-amber-700">({li.rollsCount} rolls)</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-mono font-bold text-slate-600">
                              {li.sku || `ITEM-${liIdx + 1}`}
                            </div>
                            <div className="text-[9.5px] font-bold text-emerald-600">
                              KSh {(li.unitPriceKES || (li.unitPriceUSD ? Math.round(li.unitPriceUSD * preselectedInvoice.exchangeRate) : 0)).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Search & Quick Filters (Catalog fallback / extra products) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                  {preselectedInvoice ? 'Or Add from Catalog' : 'Select Catalog Products'} ({selectedProductIds.length} Selected)
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  {selectedProductIds.length === filteredProducts.length ? 'Deselect All' : 'Select All Filtered'}
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products by SKU, name, color, or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['All', 'Dereck', 'Fleece', 'Yarns'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'Dereck' ? 'Dereec' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Product Checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 max-h-52 overflow-y-auto space-y-1 shadow-2xs">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No catalog products found matching filters.
                </div>
              ) : (
                filteredProducts.map(prod => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  const totalStock = (Object.values(prod.locationStock) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProductSelection(prod.id)}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-slate-50/40 border-slate-100 hover:bg-slate-100/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 text-rose-600">
                          {isSelected ? <CheckSquare className="w-4 h-4 fill-rose-600 text-white" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">{prod.name}</span>
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-white border border-slate-200 text-slate-600 rounded">
                              {prod.sku}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span>{prod.colorName}</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-600">KSh {prod.unitPriceRetail.toLocaleString()}/{prod.unit}</span>
                            <span>•</span>
                            <span>{totalStock} in stock</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* QUICK ADD CUSTOM BARCODE ON THE FLY */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-rose-600" />
                Quick-Add Custom Item Barcode (Ad-Hoc)
              </label>
              <form onSubmit={handleAddCustomItem} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="SKU / Barcode"
                  value={customSkuInput}
                  onChange={e => setCustomSkuInput(e.target.value)}
                  className="col-span-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Item Name"
                  value={customNameInput}
                  onChange={e => setCustomNameInput(e.target.value)}
                  className="col-span-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
                <div className="col-span-1 flex gap-1">
                  <input
                    type="number"
                    placeholder="Price"
                    value={customPriceInput}
                    onChange={e => setCustomPriceInput(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* GENERATOR STICKER CONFIGURATION CONTROLS */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-600" />
                Sticker Format &amp; Print Settings
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Barcode Standard:</label>
                  <select
                    value={barcodeFormat}
                    onChange={e => setBarcodeFormat(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="BOTH">Hybrid (1D Barcode + 2D QR)</option>
                    <option value="CODE128">Standard 1D Barcode (Code 128)</option>
                    <option value="QR">2D QR Code Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1">Label Size / Type:</label>
                  <select
                    value={labelSize}
                    onChange={e => setLabelSize(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="standard">Standard Textile Tag (3 x 7 Sheet)</option>
                    <option value="compact">Compact Fabric Roll Tag (4 x 8 Sheet)</option>
                    <option value="shelf_tag">Large Shelf / Rack Display (2 x 5 Sheet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Sticker Copies Per Item:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={copiesPerItem}
                      onChange={e => setCopiesPerItem(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">labels</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1">Header Brand Text:</label>
                  <input
                    type="text"
                    value={customStoreHeader}
                    onChange={e => setCustomStoreHeader(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePrice}
                    onChange={e => setIncludePrice(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Show Retail Price</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategory}
                    onChange={e => setIncludeCategory(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Show Category</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeColor}
                    onChange={e => setIncludeColor(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Show Color Specs</span>
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE PRINT PREVIEW & EXPORT ACTIONS (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-100/80 p-4 sm:p-5 overflow-hidden">
            
            {/* Live Sheet Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Live Sticker Sheet Print Preview
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedProductList.length} distinct items × {copiesPerItem} copies = <strong>{totalLabelsToPrint} total stickers</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Direct Print</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingPdf || selectedProductList.length === 0}
                  onClick={handleExportPdf}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Export Printable PDF</span>
                </button>
              </div>
            </div>

            {/* LIVE STICKER PREVIEW GRID (Physical A4 & thermal label sheet) */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-200/60 rounded-2xl border border-slate-300 shadow-inner">
              {selectedProductList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Barcode className="w-12 h-12 stroke-[1.5] mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-slate-600">No Products Selected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Select products from the left panel or enter a custom barcode to generate stickers.
                  </p>
                </div>
              ) : (
                <div className={`grid gap-3.5 ${
                  labelSize === 'compact' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' :
                  labelSize === 'shelf_tag' ? 'grid-cols-1 sm:grid-cols-2' :
                  'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                }`}>
                  {selectedProductList.map((item, idx) => (
                    <BulkStickerItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      customStoreHeader={customStoreHeader}
                      includeCategory={includeCategory}
                      includeColor={includeColor}
                      includePrice={includePrice}
                      barcodeFormat={barcodeFormat}
                      copiesPerItem={copiesPerItem}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Supports zebra thermal label printers, standard inkjets &amp; PDF roll cutouts
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Generator
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

interface BulkStickerItemCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    category: string;
    colorName: string;
    colorHex: string;
    price: number;
    unit: string;
    subText?: string;
  };
  customStoreHeader: string;
  includeCategory: boolean;
  includeColor: boolean;
  includePrice: boolean;
  barcodeFormat: 'CODE128' | 'EAN13' | 'QR' | 'BOTH';
  copiesPerItem: number;
}

const BulkStickerItemCard: React.FC<BulkStickerItemCardProps> = ({
  item,
  customStoreHeader,
  includeCategory,
  includeColor,
  includePrice,
  barcodeFormat,
  copiesPerItem
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const generate = async () => {
      const bUrl = generateRealBarcodeDataURL(item.barcode, {
        format: 'CODE128',
        width: 2,
        height: 44,
        displayValue: true,
        fontSize: 10
      });
      const qUrl = await generateRealQRCodeDataURL(item.barcode, { width: 120, margin: 1 });
      if (mounted) {
        setBarcodeUrl(bUrl);
        setQrUrl(qUrl);
      }
    };
    generate();
    return () => {
      mounted = false;
    };
  }, [item.barcode]);

  return (
    <div className="bg-white border-2 border-slate-300 rounded-xl p-3 shadow-md relative group hover:border-rose-400 transition-colors flex flex-col justify-between">
      {/* Top store title & category */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[9px] font-black text-slate-700 uppercase truncate">
          {customStoreHeader}
        </span>
        {includeCategory && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded-md border border-rose-200 uppercase">
            {item.category}
          </span>
        )}
      </div>

      {/* Product Name & Specs */}
      <div className="mt-1.5">
        <p className="text-xs font-black text-slate-900 truncate" title={item.name}>
          {item.name}
        </p>
        {includeColor && (
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
              style={{ backgroundColor: item.colorHex }}
            />
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {item.colorName}
            </span>
          </div>
        )}
        {item.subText && (
          <div className="text-[9px] font-mono text-slate-500 font-semibold truncate mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {item.subText}
          </div>
        )}
      </div>

      {/* Real Barcode & QR Visualization */}
      <div className="my-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center gap-2 min-h-[48px]">
        {barcodeFormat !== 'QR' && barcodeUrl && (
          <img
            src={barcodeUrl}
            alt={item.barcode}
            className="h-10 object-contain max-w-[140px]"
          />
        )}
        {barcodeFormat !== 'CODE128' && qrUrl && (
          <img
            src={qrUrl}
            alt="Real QR"
            className="w-10 h-10 object-contain shrink-0 rounded"
          />
        )}
      </div>

      {/* Footer: Price & SKU */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        {includePrice ? (
          <span className="text-xs font-black text-emerald-600">
            KSh {item.price.toLocaleString()}
            <span className="text-[9px] font-normal text-slate-500">/{item.unit}</span>
          </span>
        ) : (
          <span />
        )}

        <span className="text-[10px] font-mono font-bold text-slate-600">
          {item.sku}
        </span>
      </div>

      {/* Copies Badge */}
      <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs border border-white">
        ×{copiesPerItem}
      </div>
    </div>
  );
};
