import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
  Scale,
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  QrCode,
  Printer,
  Download,
  Layers,
  Sparkles,
  Barcode,
  ExternalLink,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  InvoiceInventoryBatch,
  InvoiceInventoryBatchItem,
  InvoiceBatchRollItem,
  CategoryType,
  LocationId
} from '../../types';

interface InvoiceBatchesDrillDownViewProps {
  onOpenCostingSuite?: () => void;
  onOpenInwardWizard?: () => void;
}

export const InvoiceBatchesDrillDownView: React.FC<InvoiceBatchesDrillDownViewProps> = ({
  onOpenCostingSuite,
  onOpenInwardWizard
}) => {
  const {
    invoiceBatches,
    saveOrSyncInvoiceToInventory,
    deleteInvoiceBatch,
    updateInvoiceBatchStatus,
    updateInvoiceBatchPricing,
    suppliers,
    locations,
    isAdmin
  } = useERP();

  // Active view state: list of all batches vs active drill-down child view
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Batch Selling Price Configuration Modal State
  const [pricingModalBatch, setPricingModalBatch] = useState<InvoiceInventoryBatch | null>(null);
  const [pricingRetailPrice, setPricingRetailPrice] = useState<number>(360);
  const [pricingBulkPrice, setPricingBulkPrice] = useState<number>(340);
  const [pricingTargetMarkup, setPricingTargetMarkup] = useState<number>(35);
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Clearance' | 'Assessed' | 'Capitalized' | 'In Stock'>('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'qty_desc' | 'val_desc'>('date_desc');

  // Roll inspection modal
  const [inspectedRoll, setInspectedRoll] = useState<InvoiceBatchRollItem | null>(null);

  // New Invoice Quick Logger Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newInvNumber, setNewInvNumber] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD.');
  const [newCustomsEntry, setNewCustomsEntry] = useState('26EMKIM400955090');
  const [newKraEslip, setNewKraEslip] = useState('1020260001007429');
  const [newDestinationStore, setNewDestinationStore] = useState<LocationId>('main_store');
  const [newExchangeRate, setNewExchangeRate] = useState(129.47);
  const [newLineDescription, setNewLineDescription] = useState('100% Poly Special Derek 150CM Cutable 260GSM');
  const [newLineCategory, setNewLineCategory] = useState<CategoryType>('Dereck');
  const [newLineGsm, setNewLineGsm] = useState(260);
  const [newLineWidth, setNewLineWidth] = useState(150);
  const [newLineNetKg, setNewLineNetKg] = useState(21719);
  const [newLineFobUSD, setNewLineFobUSD] = useState(45609.90);
  const [isLoggingSaving, setIsLoggingSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Active selected batch
  const activeBatch = useMemo(() => {
    if (!selectedBatchId) return null;
    return invoiceBatches.find(b => b.id === selectedBatchId || b.invoiceNumber === selectedBatchId) || null;
  }, [selectedBatchId, invoiceBatches]);

  // Filtered & Sorted batches
  const filteredBatches = useMemo(() => {
    return invoiceBatches
      .filter(batch => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          batch.invoiceNumber.toLowerCase().includes(query) ||
          batch.supplierName.toLowerCase().includes(query) ||
          (batch.customsEntryNo && batch.customsEntryNo.toLowerCase().includes(query)) ||
          batch.lineItems.some(li => li.description.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'All' || batch.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'qty_desc') {
          return b.totalQuantity - a.totalQuantity;
        }
        if (sortBy === 'val_desc') {
          return b.totalLandedCostKES - a.totalLandedCostKES;
        }
        return 0;
      });
  }, [invoiceBatches, searchQuery, statusFilter, sortBy]);

  // Overall KPI aggregations
  const totalInvoices = invoiceBatches.length;
  const totalMetres = invoiceBatches.reduce((sum, b) => sum + (b.totalQuantityUnit === 'meter' ? b.totalQuantity : 0), 0);
  const totalNetKg = invoiceBatches.reduce((sum, b) => sum + b.totalNetWeightKg, 0);
  const totalLandedValueKES = invoiceBatches.reduce((sum, b) => sum + b.totalLandedCostKES, 0);

  // Handle logging new invoice
  const handleCreateNewInvoiceBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvNumber.trim()) return;

    setIsLoggingSaving(true);
    try {
      const lineItems = [
        {
          id: `LI-${Date.now()}-1`,
          description: newLineDescription,
          category: newLineCategory,
          hsCode: '6006.32.00',
          fobUSD: Number(newLineFobUSD),
          netWeightKg: Number(newLineNetKg),
          grossWeightKg: Number(newLineNetKg) * 1.01,
          gsm: Number(newLineGsm),
          widthCm: Number(newLineWidth)
        }
      ];

      const created = await saveOrSyncInvoiceToInventory({
        id: `IMP-${Date.now()}`,
        shipmentNumber: `IMP-2026-${newInvNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
        invoiceNumber: newInvNumber.trim(),
        invoiceDate: new Date().toISOString().split('T')[0],
        supplierName: newSupplierName,
        supplierCountry: 'CHINA',
        consigneeName: 'TAJI KNITTERS LIMITED',
        consigneePin: 'P051656758Y',
        declarantName: 'Blue Pearl Logistics Limited',
        declarantPin: 'P051506858S',
        customsEntryNo: newCustomsEntry,
        kraEslipRef: newKraEslip,
        portOfEntry: 'ICD EMBAKASI',
        destinationLocationId: newDestinationStore,
        exchangeRate: Number(newExchangeRate),
        specificDutyRatePerTonne: 97102.50,
        adValoremRatePct: 25.0,
        idfRatePct: 2.5,
        rdlRatePct: 2.0,
        vatRatePct: 16.0,
        mssLevyUSDRatePerTonne: 1.75,
        cocFeesUSD: 600.0,
        totalFreightUSD: 5500.0,
        totalInsuranceUSD: 14.38,
        portClearingFeesKES: 180000.0,
        targetMarkupPct: 35.0,
        status: 'draft',
        lineItems
      });

      setIsLogModalOpen(false);
      setSuccessBanner(`Invoice ${created.invoiceNumber} auto-synced to Inventory! Total: ${created.totalQuantity.toLocaleString()} ${created.totalQuantityUnit}`);
      setSelectedBatchId(created.id);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      console.error('Failed to log invoice batch:', err);
      alert('Error creating invoice batch.');
    } finally {
      setIsLoggingSaving(false);
    }
  };

  // Export CSV of batch line items
  const handleExportBatchCSV = (batch: InvoiceInventoryBatch) => {
    const headers = [
      'Invoice Number',
      'Supplier',
      'Item Description',
      'Category',
      'HS Code',
      'GSM',
      'Width (cm)',
      'Net Weight (kg)',
      'Gross Weight (kg)',
      'Fabric Length (m)',
      'FOB (USD)',
      'Landed Cost (KES/m)',
      'Total Landed Cost (KES)'
    ];

    const rows = batch.lineItems.map(item => [
      `"${batch.invoiceNumber}"`,
      `"${batch.supplierName}"`,
      `"${item.description}"`,
      `"${item.category}"`,
      `"${item.hsCode}"`,
      item.gsm,
      item.widthCm,
      item.netWeightKg,
      item.grossWeightKg,
      item.fabricLengthMetres,
      item.fobUSD,
      item.landedCostKESPerUnit,
      item.totalLandedCostKES
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TAJI_INVOICE_${batch.invoiceNumber}_INVENTORY.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pricing Configuration Handlers
  const handleOpenPricingModal = (batch: InvoiceInventoryBatch) => {
    setPricingModalBatch(batch);
    const firstLine = batch.lineItems[0];
    const landedUnitCost = firstLine?.landedCostKESPerUnit || (batch.totalLandedCostKES / (batch.totalQuantity || 1));
    const existingRetail = firstLine?.suggestedRetailPriceKES || Math.round(landedUnitCost * 1.35);
    const existingBulk = Math.round(existingRetail * 0.95);
    const computedMarkup = landedUnitCost > 0 ? Math.round(((existingRetail - landedUnitCost) / landedUnitCost) * 100) : 35;
    
    setPricingRetailPrice(existingRetail);
    setPricingBulkPrice(existingBulk);
    setPricingTargetMarkup(computedMarkup > 0 ? computedMarkup : 35);
    setPricingSuccessMsg(null);
  };

  const handleMarkupPreset = (pct: number) => {
    if (!pricingModalBatch) return;
    const firstLine = pricingModalBatch.lineItems[0];
    const landedUnitCost = firstLine?.landedCostKESPerUnit || (pricingModalBatch.totalLandedCostKES / (pricingModalBatch.totalQuantity || 1));
    const newRetail = Math.round(landedUnitCost * (1 + pct / 100));
    const newBulk = Math.round(newRetail * 0.95);
    setPricingTargetMarkup(pct);
    setPricingRetailPrice(newRetail);
    setPricingBulkPrice(newBulk);
  };

  const handleRetailPriceChange = (price: number) => {
    setPricingRetailPrice(price);
    if (!pricingModalBatch) return;
    const firstLine = pricingModalBatch.lineItems[0];
    const landedUnitCost = firstLine?.landedCostKESPerUnit || (pricingModalBatch.totalLandedCostKES / (pricingModalBatch.totalQuantity || 1));
    if (landedUnitCost > 0) {
      const computedMarkup = Math.round(((price - landedUnitCost) / landedUnitCost) * 100);
      setPricingTargetMarkup(computedMarkup);
    }
  };

  const handleSaveBatchPricing = async () => {
    if (!pricingModalBatch) return;
    setIsSavingPricing(true);
    setPricingSuccessMsg(null);
    try {
      const res = await updateInvoiceBatchPricing(pricingModalBatch.id, [
        {
          retailPriceKES: pricingRetailPrice,
          bulkPriceKES: pricingBulkPrice,
          targetMarkupPct: pricingTargetMarkup
        }
      ]);
      setPricingSuccessMsg(res.message || 'Pricing updated successfully!');
      setTimeout(() => {
        setPricingModalBatch(null);
        setPricingSuccessMsg(null);
      }, 1500);
    } catch (e: any) {
      alert('Error updating batch pricing: ' + (e?.message || e));
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Helper for Status Badge Styling
  const renderStatusPill = (status: InvoiceInventoryBatch['status']) => {
    if (status === 'Capitalized') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Capitalized</span>
        </span>
      );
    }
    if (status === 'Assessed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          <span>Assessed</span>
        </span>
      );
    }
    if (status === 'In Stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
          <Boxes className="w-3 h-3 text-purple-600" />
          <span>In Stock</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>Pending Clearance</span>
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // CHILD VIEW: INTERACTIVE DRILL-DOWN VIEW FOR A SPECIFIC INVOICE BATCH
  // ---------------------------------------------------------------------------
  if (activeBatch) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Top Navigation & Breadcrumbs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBatchId(null)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer font-bold text-xs"
              title="Return to Invoice Batches list"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Batches</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Inventory</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-500">Inward Invoices</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-rose-700">Invoice {activeBatch.invoiceNumber}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <span>Invoice Batch: {activeBatch.invoiceNumber}</span>
                {renderStatusPill(activeBatch.status)}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {/* Configure Batch Selling Price Button */}
            <button
              onClick={() => handleOpenPricingModal(activeBatch)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Configure Retail & Bulk Selling Price and Profit Markup for this batch"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Configure Selling Price &amp; Markup</span>
            </button>

            {/* Quick Status Toggle */}
            <button
              onClick={() => {
                const nextStatus = activeBatch.status === 'Capitalized' ? 'Pending Clearance' : 'Capitalized';
                updateInvoiceBatchStatus(activeBatch.id, nextStatus);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Toggle Status</span>
            </button>

            <button
              onClick={() => handleExportBatchCSV(activeBatch)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* Batch Metadata Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-5 text-white shadow-md border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-rose-400" />
                Supplier / Origin
              </span>
              <p className="font-extrabold text-sm text-slate-100 leading-snug">{activeBatch.supplierName}</p>
              <p className="text-xs text-slate-400">{activeBatch.supplierCountry || 'China'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Customs SAD &amp; E-Slip
              </span>
              <p className="font-mono font-bold text-xs text-emerald-300">
                SAD: {activeBatch.customsEntryNo || 'Pending Entry'}
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                E-Slip: {activeBatch.kraEslipRef || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Creation &amp; Arrival Date
              </span>
              <p className="font-bold text-xs text-slate-200">
                Import Date: {activeBatch.importDate}
              </p>
              <p className="text-[11px] text-slate-400">
                Created: {new Date(activeBatch.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                Destination Warehouse
              </span>
              <p className="font-bold text-xs text-amber-300">
                {activeBatch.destinationLocationName || 'Main Store Mombasa'}
              </p>
              <p className="text-[11px] text-slate-400">
                FX Rate: KSh {activeBatch.exchangeRate.toFixed(2)} / USD
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Bar for this Invoice (Includes Selling Price & Profit Margin) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Quantity</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900">{activeBatch.totalQuantity.toLocaleString()}</span>
              <span className="text-xs font-bold text-rose-600 uppercase">{activeBatch.totalQuantityUnit}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{activeBatch.lineItems.length} distinct line items</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Net Weight</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900">{activeBatch.totalNetWeightKg.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Gross: {activeBatch.totalGrossWeightKg.toLocaleString()} kg</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total FOB Invoice</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900">${activeBatch.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-xs font-bold text-slate-500">USD</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ex-Factory Supplier Price</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Landed Cost</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-900">KSh {activeBatch.totalLandedCostKES.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
              Avg Landed: KSh {(activeBatch.totalLandedCostKES / (activeBatch.totalQuantity || 1)).toFixed(2)} /{activeBatch.totalQuantityUnit === 'meter' ? 'm' : 'kg'}
            </span>
          </div>

          {(() => {
            const firstLine = activeBatch.lineItems[0];
            const avgLanded = activeBatch.totalLandedCostKES / (activeBatch.totalQuantity || 1);
            const sellingPrice = firstLine?.suggestedRetailPriceKES || Math.round(avgLanded * 1.35);
            const profitPerUnit = Math.max(0, sellingPrice - avgLanded);
            const markupPct = avgLanded > 0 ? Math.round((profitPerUnit / avgLanded) * 100) : 35;

            return (
              <div
                onClick={() => handleOpenPricingModal(activeBatch)}
                className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs cursor-pointer hover:border-rose-400 transition-all group"
                title="Click to reconfigure Batch Selling Price & Markup"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Configured Price</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-black group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    +{markupPct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-rose-900 font-mono">KSh {sellingPrice.toLocaleString()}</span>
                  <span className="text-xs font-bold text-rose-700">/{activeBatch.totalQuantityUnit === 'meter' ? 'm' : 'kg'}</span>
                </div>
                <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">
                  Profit: +KSh {profitPerUnit.toFixed(1)}/unit (Edit ⚡)
                </span>
              </div>
            );
          })()}
        </div>

        {/* Section 1: Granular Line Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                <span>Granular Line Items Linked to Invoice {activeBatch.invoiceNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full physical specs (GSM, width, weights) and calculated Landed Cost per Metre (KES/m)
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs">
              {activeBatch.lineItems.length} Products
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px] tracking-wider">
                  <th className="p-3.5">Line Item &amp; Category</th>
                  <th className="p-3.5 text-center">HS Code</th>
                  <th className="p-3.5 text-center">GSM</th>
                  <th className="p-3.5 text-center">Width</th>
                  <th className="p-3.5 text-right">Net Wt (kg)</th>
                  <th className="p-3.5 text-right">Metres (m)</th>
                  <th className="p-3.5 text-right">FOB Price</th>
                  <th className="p-3.5 text-right bg-rose-50/60 text-rose-900">Landed Cost/m</th>
                  <th className="p-3.5 text-right">Total Landed (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBatch.lineItems.map((item, idx) => {
                  return (
                    <tr key={item.id || idx} className="hover:bg-rose-50/30 transition-colors">
                      {/* Description & Category */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-xs leading-snug">
                          {item.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                          {item.subCategory && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.subCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* HS Code */}
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-600">
                        {item.hsCode}
                      </td>

                      {/* Individual GSM */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs inline-block">
                          {item.gsm} GSM
                        </span>
                      </td>

                      {/* Individual Width */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {item.widthCm} cm
                      </td>

                      {/* Net Weight */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {item.netWeightKg.toLocaleString()} kg
                        <span className="block text-[10px] text-slate-400 font-normal">Gross: {item.grossWeightKg} kg</span>
                      </td>

                      {/* Fabric Length in Metres */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900">
                        {item.fabricLengthMetres > 0 ? `${item.fabricLengthMetres.toLocaleString()} m` : `${item.quantity.toLocaleString()} ${item.unit}`}
                        {item.rollsCount && (
                          <span className="block text-[10px] text-slate-400 font-normal">~{item.rollsCount} rolls</span>
                        )}
                      </td>

                      {/* FOB Price */}
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ${item.fobUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="block text-[10px] text-slate-400">@ ${item.unitFobUSD.toFixed(2)}/kg</span>
                      </td>

                      {/* Calculated Landed Cost per Metre (KES/m) */}
                      <td className="p-3.5 text-right bg-rose-50/60">
                        <div className="font-mono font-black text-rose-700 text-sm">
                          KSh {item.landedCostKESPerUnit.toFixed(2)} /m
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                          Excl. VAT: KSh {item.landedCostKESPerUnitExclVat.toFixed(2)} /m
                        </div>
                      </td>

                      {/* Total Landed Cost */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        KSh {item.totalLandedCostKES.toLocaleString()}
                        {item.suggestedRetailPriceKES > 0 && (
                          <span className="block text-[10px] text-emerald-700 font-semibold">
                            Rec. Retail: KSh {item.suggestedRetailPriceKES.toLocaleString()} /m
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Unit-Level Fabric Rolls & Scannable Tokens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-600" />
                <span>Unit-Level Fabric Rolls &amp; Scannable Batch Barcodes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical piece inventory belonging to Invoice {activeBatch.invoiceNumber}, ready for warehouse scanning
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {activeBatch.lineItems.reduce((acc, li) => acc + (li.rolls ? li.rolls.length : 0), 0)} Pieces Registered
              </span>
            </div>
          </div>

          <div className="p-4">
            {activeBatch.lineItems.some(li => li.rolls && li.rolls.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBatch.lineItems.flatMap((li) => li.rolls || []).slice(0, 18).map((roll) => (
                  <div
                    key={roll.id}
                    onClick={() => setInspectedRoll(roll)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-rose-50/40 hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-slate-900 text-xs">{roll.rollNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        roll.inspectionStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {roll.inspectionStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2.5 text-[11px] text-slate-600 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Net Wt</span>
                        <span className="font-bold text-slate-800">{roll.netWeightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Gross Wt</span>
                        <span className="font-bold text-slate-800">{roll.grossWeightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Length</span>
                        <span className="font-bold text-rose-700">{roll.lengthMeters} m</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400">{roll.barcode}</span>
                      <span className="text-rose-600 font-bold group-hover:underline flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                Unit-level fabric rolls are generated upon warehouse barcode intake or capitalization.
              </div>
            )}
          </div>
        </div>

        {/* Single Roll Inspection Modal */}
        {inspectedRoll && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-base">{inspectedRoll.rollNumber}</h4>
                  <p className="text-xs text-slate-500 font-mono">Invoice: {activeBatch.invoiceNumber}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  inspectedRoll.inspectionStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inspectedRoll.inspectionStatus}
                </span>
              </div>

              {/* Scannable Token Simulation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
                <QrCode className="w-24 h-24 mx-auto text-slate-900" />
                <p className="font-mono text-xs font-bold text-slate-700">{inspectedRoll.barcode}</p>
                <p className="text-[10px] text-slate-400">Scannable Piece Goods Barcode Token</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-100">
                  <span className="text-slate-400 block text-[10px]">Net Weight</span>
                  <span className="font-bold text-slate-900">{inspectedRoll.netWeightKg} kg</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <span className="text-slate-400 block text-[10px]">Gross Weight</span>
                  <span className="font-bold text-slate-900">{inspectedRoll.grossWeightKg} kg</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <span className="text-slate-400 block text-[10px]">Length</span>
                  <span className="font-bold text-slate-900">{inspectedRoll.lengthMeters} metres</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <span className="text-slate-400 block text-[10px]">Store Allocation</span>
                  <span className="font-bold text-slate-900">Main Store</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setInspectedRoll(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setInspectedRoll(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PARENT VIEW: CHRONOLOGICAL BATCH LIST VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* KPI Aggregation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Invoice Batches</span>
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalInvoices}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Chronological Inward Sync</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Metres</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalMetres.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Fabric metres in transit / stock</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Net Weight</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalNetKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Consignment Net Tonnage</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Total Landed Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-1">KSh {totalLandedValueKES.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Capitalized Inventory Asset</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Sorters & Quick Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Invoice (e.g. 26PA222), Supplier, SAD #, Fabric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-rose-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter batches by clearance status"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-rose-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Clearance">Pending Clearance</option>
            <option value="Assessed">Assessed</option>
            <option value="Capitalized">Capitalized</option>
            <option value="In Stock">In Stock</option>
          </select>

          {/* Sorter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort batches by date, quantity, or value"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-rose-500 cursor-pointer"
          >
            <option value="date_desc">Newest First (Date Created)</option>
            <option value="date_asc">Oldest First</option>
            <option value="qty_desc">Highest Quantity</option>
            <option value="val_desc">Highest Landed Value</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCostingSuite && (
            <button
              onClick={onOpenCostingSuite}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Costing Suite</span>
            </button>
          )}

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Import Invoice Batch</span>
          </button>
        </div>
      </div>

      {/* Chronological Invoice Batches List */}
      <div className="space-y-3">
        {filteredBatches.length > 0 ? (
          filteredBatches.map((batch) => {
            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Visual accent left line */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  batch.status === 'Capitalized'
                    ? 'bg-emerald-500'
                    : batch.status === 'Assessed'
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
                  {/* Left block: Invoice Number, Supplier, Timestamps */}
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white tracking-wide shadow-2xs">
                        Invoice {batch.invoiceNumber}
                      </span>
                      {renderStatusPill(batch.status)}
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Logged: {new Date(batch.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-800">
                      <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{batch.supplierName}</span>
                      <span className="text-xs font-normal text-slate-400">({batch.supplierCountry || 'China'})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>SAD: <strong className="font-mono text-slate-700">{batch.customsEntryNo || 'Pending'}</strong></span>
                      <span>•</span>
                      <span>Destination: <strong className="text-slate-700">{batch.destinationLocationName || 'Main Store Mombasa'}</strong></span>
                      <span>•</span>
                      <span>Items: <strong className="text-slate-700">{batch.lineItems.map(li => li.description.slice(0, 24) + '...').join(', ')}</strong></span>
                    </div>
                  </div>

                  {/* Middle/Right Metrics: Quantity, Weight, Landed Cost */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-right min-w-24">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Metres</span>
                      <div className="font-mono font-black text-slate-900 text-base">
                        {batch.totalQuantity.toLocaleString()} <span className="text-xs font-bold text-rose-600">{batch.totalQuantityUnit}</span>
                      </div>
                      <span className="text-[10.5px] text-slate-400 block">{batch.totalItemsCount} line items</span>
                    </div>

                    <div className="text-right min-w-24">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Net Weight</span>
                      <div className="font-mono font-black text-slate-900 text-base">
                        {batch.totalNetWeightKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
                      </div>
                      <span className="text-[10.5px] text-slate-400 block">Gross: {batch.totalGrossWeightKg.toLocaleString()} kg</span>
                    </div>

                    <div className="text-right min-w-32 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Total Landed Cost</span>
                      <div className="font-mono font-black text-emerald-900 text-base">
                        KSh {batch.totalLandedCostKES.toLocaleString()}
                      </div>
                      <span className="text-[10.5px] text-emerald-700 font-semibold block">
                        KSh {(batch.totalLandedCostKES / (batch.totalQuantity || 1)).toFixed(2)} /{batch.totalQuantityUnit === 'meter' ? 'm' : 'kg'}
                      </span>
                    </div>

                    {/* Batch Selling Price & Markup Metric */}
                    {(() => {
                      const firstLine = batch.lineItems[0];
                      const landedPerUnit = firstLine?.landedCostKESPerUnit || (batch.totalLandedCostKES / (batch.totalQuantity || 1));
                      const sellingPrice = firstLine?.suggestedRetailPriceKES || Math.round(landedPerUnit * 1.35);
                      const markupPct = landedPerUnit > 0 ? Math.round(((sellingPrice - landedPerUnit) / landedPerUnit) * 100) : 35;
                      const profitPerUnit = Math.max(0, sellingPrice - landedPerUnit);

                      return (
                        <div className="text-right min-w-32 bg-rose-50/60 p-2.5 rounded-xl border border-rose-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-rose-800 font-bold block">Selling Price</span>
                            <span className="px-1 py-0.2 rounded bg-rose-200 text-rose-900 text-[9px] font-black">+{markupPct}%</span>
                          </div>
                          <div className="font-mono font-black text-rose-900 text-base">
                            KSh {sellingPrice.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-rose-700 font-bold block">
                            Profit: +KSh {profitPerUnit.toFixed(1)}/unit
                          </span>
                        </div>
                      );
                    })()}

                    {/* Drill-Down & Set Price Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 pl-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPricingModal(batch);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-2xs border border-amber-200 hover:border-amber-600 cursor-pointer"
                        title="Configure Selling Price & Markup for this batch"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Set Price</span>
                      </button>
                      <span className="px-3 py-2 rounded-xl bg-rose-50 group-hover:bg-rose-600 text-rose-700 group-hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-2xs">
                        <span>Drill Down</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">No Matching Invoice Batches Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No parent invoice inventory batches matched your filter criteria. Log a new import batch or adjust your search term.
            </p>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Import Invoice Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Log Import Invoice Batch Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Log New Commercial Invoice / Import Batch</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoiceBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 26PA222"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Exchange Rate (KES/USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExchangeRate}
                    onChange={(e) => setNewExchangeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:bg-white focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Customs Entry (SAD)</label>
                  <input
                    type="text"
                    value={newCustomsEntry}
                    onChange={(e) => setNewCustomsEntry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">KRA E-Slip Ref</label>
                  <input
                    type="text"
                    value={newKraEslip}
                    onChange={(e) => setNewKraEslip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:outline-rose-500"
                  />
                </div>
              </div>

              {/* Line Item Granular Specs */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs">Primary Fabric Line Item Specs</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Auto-Costing</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Description</label>
                  <input
                    type="text"
                    value={newLineDescription}
                    onChange={(e) => setNewLineDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">GSM</label>
                    <input
                      type="number"
                      value={newLineGsm}
                      onChange={(e) => setNewLineGsm(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Width (cm)</label>
                    <input
                      type="number"
                      value={newLineWidth}
                      onChange={(e) => setNewLineWidth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Net Weight (kg)</label>
                    <input
                      type="number"
                      value={newLineNetKg}
                      onChange={(e) => setNewLineNetKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900 text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">FOB Amount (USD)</label>
                    <input
                      type="number"
                      value={newLineFobUSD}
                      onChange={(e) => setNewLineFobUSD(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Category</label>
                    <select
                      value={newLineCategory}
                      onChange={(e) => setNewLineCategory(e.target.value as CategoryType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900"
                    >
                      <option value="Dereck">Dereec (Derek)</option>
                      <option value="Fleece">Fleece</option>
                      <option value="Yarns">Yarns</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingSaving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoggingSaving ? 'Auto-Syncing...' : 'Save & Register in Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* BATCH SELLING PRICE & PROFIT MARGIN CONFIGURATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {pricingModalBatch && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wide">
                  Batch Price Configuration
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">
                  Configure Selling Price &amp; Markup
                </h3>
                <p className="text-xs text-slate-500">
                  Invoice <strong className="text-slate-800 font-mono">#{pricingModalBatch.invoiceNumber}</strong> • {pricingModalBatch.supplierName}
                </p>
              </div>
              <button
                onClick={() => setPricingModalBatch(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Landed Cost Baseline */}
            {(() => {
              const firstLine = pricingModalBatch.lineItems[0];
              const avgLanded = firstLine?.landedCostKESPerUnit || (pricingModalBatch.totalLandedCostKES / (pricingModalBatch.totalQuantity || 1));
              const unitLabel = pricingModalBatch.totalQuantityUnit === 'meter' ? 'Metre' : 'KG';
              const profitPerUnit = pricingRetailPrice - avgLanded;
              const marginPct = avgLanded > 0 ? (profitPerUnit / avgLanded) * 100 : 0;
              const projectedBatchProfit = profitPerUnit * (pricingModalBatch.totalQuantity || 0);

              return (
                <div className="space-y-4">
                  {/* Baseline Cost Box */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Actual Landed Cost</span>
                      <span className="font-mono font-black text-slate-900 text-base">
                        KSh {avgLanded.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">per {unitLabel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Total Batch Quantity</span>
                      <span className="font-mono font-black text-slate-900 text-base">
                        {pricingModalBatch.totalQuantity.toLocaleString()} {pricingModalBatch.totalQuantityUnit}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Valuation: KSh {pricingModalBatch.totalLandedCostKES.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Markup Presets */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Target Profit Margin / Markup Presets:
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[20, 25, 30, 35, 45].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleMarkupPreset(pct)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            pricingTargetMarkup === pct
                              ? 'bg-rose-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Input Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Retail Price (KSh / {unitLabel})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={pricingRetailPrice}
                          onChange={(e) => handleRetailPriceChange(Number(e.target.value))}
                          className="w-full pl-11 pr-3 py-2 bg-white border-2 border-rose-300 focus:border-rose-600 rounded-xl font-mono font-black text-rose-950 text-base focus:outline-hidden"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">For walk-in shop retail sales</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Bulk Wholesale (KSh)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={pricingBulkPrice}
                          onChange={(e) => setPricingBulkPrice(Number(e.target.value))}
                          className="w-full pl-11 pr-3 py-2 bg-white border-2 border-slate-300 focus:border-slate-600 rounded-xl font-mono font-black text-slate-900 text-base focus:outline-hidden"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">For rolls / bulk yardage buyers</span>
                    </div>
                  </div>

                  {/* Realtime Margin & Gross Profit Analysis Card */}
                  <div className={`p-4 rounded-2xl border transition-colors ${
                    profitPerUnit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold text-slate-700">Financial Margin Impact:</span>
                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                        marginPct >= 25 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {marginPct >= 0 ? `+${marginPct.toFixed(1)}% Gross Margin` : `${marginPct.toFixed(1)}% Negative Margin`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10.5px] block">Gross Profit per {unitLabel}:</span>
                        <span className={`font-mono font-black text-sm ${profitPerUnit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
                          {profitPerUnit >= 0 ? `+KSh ${profitPerUnit.toFixed(2)}` : `-KSh ${Math.abs(profitPerUnit).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[10.5px] block">Projected Total Batch Profit:</span>
                        <span className={`font-mono font-black text-sm ${projectedBatchProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
                          +KSh {Math.round(projectedBatchProfit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Notification */}
                  {pricingSuccessMsg && (
                    <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{pricingSuccessMsg}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPricingModalBatch(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPricing}
                      onClick={handleSaveBatchPricing}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSavingPricing ? 'Saving & Syncing...' : 'Save & Sync to Catalog'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceBatchesDrillDownView;
