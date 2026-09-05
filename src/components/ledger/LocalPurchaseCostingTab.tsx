import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LocalPurchaseRecord,
  LocalPurchaseLineItem,
  LocalFabricCategory,
  UnitType,
  ProductBatch
} from '../../types';
import {
  calculateLocalPurchaseCosting,
  PRESET_LPS_RIVATEX,
  PRESET_LPS_THIKA_CLOTH_MILLS,
  PRESET_LPS_SPINNERS
} from '../../utils/localPurchaseCostingEngine';
import {
  exportLocalPurchaseCostingPDF,
  exportLocalPurchaseCostingCSV
} from '../../utils/documentExport';
import {
  Building2,
  FileSpreadsheet,
  FileDown,
  Calculator,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Receipt,
  Scale,
  ShieldCheck,
  Zap,
  Tag,
  Check,
  Truck,
  FileText,
  BadgeAlert,
  Info
} from 'lucide-react';

export const LocalPurchaseCostingTab: React.FC = () => {
  const {
    locations,
    brandSettings,
    etrConfig,
    currentUser,
    addLedgerEntry,
    updateProductBatch
  } = useERP();

  const [activePresetKey, setActivePresetKey] = useState<'rivatex' | 'thika' | 'spinners' | 'custom'>('rivatex');
  const [activePurchase, setActivePurchase] = useState<LocalPurchaseRecord>(PRESET_LPS_RIVATEX);

  // Capitalization state
  const [isCapitalizeModalOpen, setIsCapitalizeModalOpen] = useState(false);
  const [isCapitalizing, setIsCapitalizing] = useState(false);
  const [capitalizationSuccess, setCapitalizationSuccess] = useState<{
    journalRef: string;
    itemsUpdated: number;
    totalCapitalizedCost: number;
    vatClaimed: number;
  } | null>(null);

  // Capitalization and Change Tracking State
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => JSON.stringify(PRESET_LPS_RIVATEX));
  const [hasUncapitalizedChanges, setHasUncapitalizedChanges] = useState<boolean>(false);
  const isPresetSwitchingRef = useRef(false);

  // Detect whenever changes are made in LPS costing to trigger blinking reminder
  useEffect(() => {
    if (isPresetSwitchingRef.current) {
      isPresetSwitchingRef.current = false;
      return;
    }
    const current = JSON.stringify(activePurchase);
    if (current !== lastSavedSnapshot) {
      setHasUncapitalizedChanges(true);
    } else {
      setHasUncapitalizedChanges(false);
    }
  }, [activePurchase, lastSavedSnapshot]);

  // Computed summary
  const summary = useMemo(() => {
    return calculateLocalPurchaseCosting(activePurchase);
  }, [activePurchase]);

  // Handle Preset Switching
  const handleSelectPreset = (key: 'rivatex' | 'thika' | 'spinners' | 'custom') => {
    setActivePresetKey(key);
    setCapitalizationSuccess(null);
    isPresetSwitchingRef.current = true;
    let selected: LocalPurchaseRecord;
    if (key === 'rivatex') {
      selected = { ...PRESET_LPS_RIVATEX };
    } else if (key === 'thika') {
      selected = { ...PRESET_LPS_THIKA_CLOTH_MILLS };
    } else if (key === 'spinners') {
      selected = { ...PRESET_LPS_SPINNERS };
    } else {
      selected = {
        id: `LPS-CUSTOM-${Date.now().toString().slice(-4)}`,
        purchaseOrderNo: `LPO-2026-LOC-${Date.now().toString().slice(-4)}`,
        invoiceNumber: 'INV-LOC-001',
        etimsControlNo: '001001202602000000',
        invoiceDate: new Date().toISOString().slice(0, 10),
        supplierName: 'LOCAL TEXTILE VENDOR NAIROBI',
        supplierPin: 'P051999888Z',
        supplierCity: 'Nairobi Industrial Area',
        destinationLocationId: 'main_store',
        paymentTerms: '30 Days Credit',
        withholdingVatEnabled: false,
        localFreightKES: 10000,
        localHandlingKES: 3000,
        inspectionTestingKES: 0,
        targetMarkupPct: 30,
        status: 'draft',
        lineItems: [
          {
            id: `LPS-LI-${Date.now()}`,
            description: 'Local Knitted Cotton Fabric (180 GSM)',
            category: 'Single Jersey',
            quantity: 1000,
            unit: 'meter',
            netUnitPriceKES: 220.0,
            vatRatePct: 16.0,
            rollsCount: 20,
            gsm: 180,
            widthCm: 160,
            colorName: 'Core Black'
          }
        ],
        notes: 'Custom local purchase supply order'
      };
    }
    setActivePurchase(selected);
    setLastSavedSnapshot(JSON.stringify(selected));
    setHasUncapitalizedChanges(false);
  };

  // Add line item
  const handleAddLineItem = () => {
    const newItem: LocalPurchaseLineItem = {
      id: `LPS-LI-${Date.now()}`,
      description: 'New Local Fabric / Yarn Batch',
      category: 'Single Jersey',
      quantity: 500,
      unit: 'meter',
      netUnitPriceKES: 200,
      vatRatePct: 16.0,
      rollsCount: 10,
      gsm: 200,
      widthCm: 150,
      colorName: 'Navy Blue'
    };
    setActivePurchase(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  // Update line item
  const handleUpdateLineItem = (id: string, field: keyof LocalPurchaseLineItem, value: any) => {
    setActivePurchase(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  // Remove line item
  const handleRemoveLineItem = (id: string) => {
    if (activePurchase.lineItems.length <= 1) return;
    setActivePurchase(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  // Capitalize LPS to General Ledger
  const handleConfirmCapitalize = () => {
    setIsCapitalizing(true);
    setTimeout(() => {
      const journalRef = `JRN-LPS-${Date.now().toString().slice(-6)}`;
      const targetLoc = activePurchase.destinationLocationId || 'main_store';

      // 1. Post General Ledger Entry for Raw Material Inventory Asset (Net Purchase + Logistics Addons)
      addLedgerEntry({
        description: `Local Purchase Capitalization (PO ${activePurchase.purchaseOrderNo} / Inv ${activePurchase.invoiceNumber}) - ${activePurchase.supplierName}`,
        transactionRef: journalRef,
        debitAccount: '1200 - Raw Materials & Fabric Inventory Asset',
        creditAccount: '2010 - Accounts Payable (Local Suppliers)',
        amount: summary.totalCapitalizedInventoryCostKES,
        locationId: targetLoc,
        category: 'Inventory Revaluation'
      });

      // 2. Post 16% Input VAT to KRA Input VAT Asset (Claimable in VAT-3 Section C)
      if (summary.totalVat16KES > 0) {
        addLedgerEntry({
          description: `Local Input VAT (16%) Claim on eTIMS Inv ${activePurchase.invoiceNumber} - ${activePurchase.supplierName}`,
          transactionRef: journalRef,
          debitAccount: '1201 - Input VAT Claimable Asset (Local eTIMS)',
          creditAccount: '2010 - Accounts Payable (Local Suppliers)',
          amount: summary.totalVat16KES,
          locationId: targetLoc,
          category: 'Tax VAT'
        });
      }

      // 3. Post Withholding VAT (2% WHVAT) if applicable
      if (summary.totalWithholdingVat2KES > 0) {
        addLedgerEntry({
          description: `KRA 2% Withholding VAT Certificate deducted on ${activePurchase.supplierName}`,
          transactionRef: journalRef,
          debitAccount: '2010 - Accounts Payable (Local Suppliers)',
          creditAccount: '2050 - Withholding VAT Payable (KRA)',
          amount: summary.totalWithholdingVat2KES,
          locationId: targetLoc,
          category: 'Tax VAT'
        });
      }

      // Update product catalog batch costs
      summary.items.forEach(item => {
        updateProductBatch(item.id, {
          costPrice: item.unitLandedCostKES,
          unitPriceRetail: item.suggestedRetailPriceKES,
          unitPriceBulk: item.suggestedBulkPriceKES
        });
      });

      setIsCapitalizing(false);
      setIsCapitalizeModalOpen(false);
      setCapitalizationSuccess({
        journalRef,
        itemsUpdated: summary.items.length,
        totalCapitalizedCost: summary.totalCapitalizedInventoryCostKES,
        vatClaimed: summary.totalVat16KES
      });
      setLastSavedSnapshot(JSON.stringify(activePurchase));
      setHasUncapitalizedChanges(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Selector */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-2xl p-5 text-white shadow-md border border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-600/90 text-emerald-100 rounded-full text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                LPS • Local Purchase Supply
              </span>
              <span className="text-xs text-emerald-400 font-mono font-medium">
                eTIMS 16% Input VAT • Domestic Landed Costing
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Local Purchase Supply (LPS) Costing & Capitalization Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Costing & double-entry capitalization for Kenyan domestic suppliers (Rivatex, Thika Cloth Mills, Spinners & Spinners).
              Apportions local freight and offloading, separates deductible 16% Input VAT (KRA VAT-3 Section C), and locks in true unit landed costs.
            </p>
          </div>

          {/* Action Buttons: Export & Capitalize */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => exportLocalPurchaseCostingPDF(activePurchase, summary, brandSettings, etrConfig)}
                className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Download Local Purchase Costing Schedule as PDF"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => exportLocalPurchaseCostingCSV(activePurchase, summary)}
                className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Export Local Purchase Costing Schedule as CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
            <button
              onClick={() => setIsCapitalizeModalOpen(true)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                hasUncapitalizedChanges
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-600 text-white ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse scale-105 shadow-amber-500/50 hover:scale-108'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
              }`}
              title={hasUncapitalizedChanges ? "Costing changes detected! Click to approve, save, and capitalize LPS to GL." : "Capitalize LPS to General Ledger"}
            >
              {hasUncapitalizedChanges && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-black text-white items-center justify-center">
                    !
                  </span>
                </span>
              )}
              <CheckCircle2 className={`w-4 h-4 ${hasUncapitalizedChanges ? 'animate-bounce text-amber-200' : ''}`} />
              <span>{hasUncapitalizedChanges ? '⚡ Capitalize LPS (Save Changes)' : 'Capitalize LPS to GL'}</span>
            </button>
          </div>
        </div>

        {/* Uncapitalized Changes Notification Alert */}
        {hasUncapitalizedChanges && (
          <div className="mt-3 p-3 bg-amber-500/20 border-2 border-amber-400 text-amber-100 rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-pulse">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <span className="font-black text-amber-200 block text-xs">Uncapitalized LPS Changes Detected!</span>
                <span className="text-[11px] text-amber-100/90 font-medium">Local purchase costing or logistics inputs were altered. Click <strong>Capitalize LPS</strong> to commit values to General Ledger.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCapitalizeModalOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-md whitespace-nowrap cursor-pointer shrink-0"
            >
              Capitalize Now →
            </button>
          </div>
        )}

        {/* Local Mill Presets */}
        <div className="mt-4 pt-3.5 border-t border-emerald-800/40 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Quick Presets:
          </span>
          <button
            onClick={() => handleSelectPreset('rivatex')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePresetKey === 'rivatex'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Rivatex East Africa (Single Jersey & Rib)
          </button>
          <button
            onClick={() => handleSelectPreset('thika')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePresetKey === 'thika'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Thika Cloth Mills (Fleece & Pique)
          </button>
          <button
            onClick={() => handleSelectPreset('spinners')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePresetKey === 'spinners'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Spinners & Spinners (Knitting Yarns)
          </button>
          <button
            onClick={() => handleSelectPreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePresetKey === 'custom'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            + Custom Local Supplier
          </button>
        </div>
      </div>

      {/* Capitalization Alert Banner */}
      {capitalizationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm text-slate-900 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-black text-sm text-emerald-950">
                  Local Purchase Supply (LPS) Successfully Capitalized to General Ledger!
                </h4>
                <p className="text-xs text-emerald-800">
                  Journal Voucher Ref: <span className="font-mono font-bold">{capitalizationSuccess.journalRef}</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs">
              Double-Entry Balanced
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-emerald-200/80">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block text-[10.5px]">Capitalized Inventory (Asset 1200):</span>
              <span className="font-black text-slate-900 text-sm">
                KSh {capitalizationSuccess.totalCapitalizedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block text-[10.5px]">1201 Local Input VAT Claim (Section C):</span>
              <span className="font-black text-rose-700 text-sm">
                KSh {capitalizationSuccess.vatClaimed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block text-[10.5px]">Product Catalog Batches Updated:</span>
              <span className="font-black text-emerald-800 text-sm">
                {capitalizationSuccess.itemsUpdated} Product Batches Updated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards: Net Purchases, 16% Input VAT, Logistics Add-ons, Total Capitalized Asset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Net Purchase (Excl. VAT)</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            KSh {summary.totalNetPurchaseKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-400">
            Base invoice goods value
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>16% Input VAT Claimable</span>
            <Percent className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700">
            KSh {summary.totalVat16KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold">
            Reclaimable in KRA VAT-3 (Section C)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Local Freight & Handling</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800">
            KSh {summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            Capitalized into unit landed cost
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>Total Capitalized Inventory Asset</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900">
            KSh {summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">
            Average KSh {summary.effectiveAverageCapitalizedCostPerUnit.toFixed(1)} / unit
          </span>
        </div>
      </div>

      {/* Local Supplier & eTIMS Parameters Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Local Supplier & eTIMS Tax Invoice Parameters
          </h3>
          <span className="text-xs text-slate-500">
            PO: <span className="font-mono font-bold text-slate-800">{activePurchase.purchaseOrderNo}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Supplier Name</label>
            <input
              type="text"
              value={activePurchase.supplierName}
              onChange={e => setActivePurchase(prev => ({ ...prev, supplierName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Supplier KRA PIN</label>
            <input
              type="text"
              value={activePurchase.supplierPin}
              onChange={e => setActivePurchase(prev => ({ ...prev, supplierPin: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Supplier Invoice No</label>
            <input
              type="text"
              value={activePurchase.invoiceNumber}
              onChange={e => setActivePurchase(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">eTIMS CU Invoice / Control No</label>
            <input
              type="text"
              value={activePurchase.etimsControlNo || ''}
              onChange={e => setActivePurchase(prev => ({ ...prev, etimsControlNo: e.target.value }))}
              placeholder="e.g. 005001202602189912"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Supplier City / Mill Location</label>
            <input
              type="text"
              value={activePurchase.supplierCity}
              onChange={e => setActivePurchase(prev => ({ ...prev, supplierCity: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Destination Branch Store</label>
            <select
              value={activePurchase.destinationLocationId}
              onChange={e => setActivePurchase(prev => ({ ...prev, destinationLocationId: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Payment Terms</label>
            <select
              value={activePurchase.paymentTerms}
              onChange={e => setActivePurchase(prev => ({ ...prev, paymentTerms: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="Immediate Cash/M-Pesa">Immediate Cash / M-Pesa</option>
              <option value="30 Days Credit">30 Days Credit</option>
              <option value="60 Days Credit">60 Days Credit</option>
              <option value="Advance EFT">Advance EFT</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Target Selling Markup %</label>
            <div className="relative">
              <input
                type="number"
                value={activePurchase.targetMarkupPct}
                onChange={e => setActivePurchase(prev => ({ ...prev, targetMarkupPct: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Ancillary Logistics Breakdown */}
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Domestic Logistics & Ancillary Add-ons (Capitalized into stock cost, NOT VAT):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Local Transporter / Trucking (KES)</label>
              <input
                type="number"
                value={activePurchase.localFreightKES}
                onChange={e => setActivePurchase(prev => ({ ...prev, localFreightKES: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Offloading Labour & Handling (KES)</label>
              <input
                type="number"
                value={activePurchase.localHandlingKES}
                onChange={e => setActivePurchase(prev => ({ ...prev, localHandlingKES: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Lab Testing / Quality GSM Audit (KES)</label>
              <input
                type="number"
                value={activePurchase.inspectionTestingKES}
                onChange={e => setActivePurchase(prev => ({ ...prev, inspectionTestingKES: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              Local Goods & Material Line Items ({summary.items.length})
            </h3>
          </div>
          <button
            onClick={handleAddLineItem}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 text-[11px]">
                <th className="p-3 w-10">#</th>
                <th className="p-3 min-w-[200px]">Item Description</th>
                <th className="p-3 w-28">Category</th>
                <th className="p-3 w-24 text-right">Quantity</th>
                <th className="p-3 w-20">Unit</th>
                <th className="p-3 w-28 text-right">Net Price (KES)</th>
                <th className="p-3 w-28 text-right">Net Total (KES)</th>
                <th className="p-3 w-24 text-right">16% VAT</th>
                <th className="p-3 w-28 text-right">Freight/Handling</th>
                <th className="p-3 w-32 text-right bg-emerald-50/50 text-emerald-900 font-black">Capitalized Cost</th>
                <th className="p-3 w-28 text-right bg-emerald-100/60 text-emerald-950 font-black">Unit Landed</th>
                <th className="p-3 w-28 text-right text-slate-900 font-black">Retail (Markup)</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {summary.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => handleUpdateLineItem(item.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-400">
                      <span>Rolls: {item.rollsCount || 0}</span>
                      <span>•</span>
                      <span>GSM: {item.gsm || '-'}</span>
                      <span>•</span>
                      <span>Shade: {item.colorName || 'Standard'}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={item.category}
                      onChange={e => handleUpdateLineItem(item.id, 'category', e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="Single Jersey">Single Jersey</option>
                      <option value="Rib">Rib</option>
                      <option value="Fleece">Fleece</option>
                      <option value="Heavy Pique">Heavy Pique</option>
                      <option value="Dereck">Dereck</option>
                      <option value="Interlock">Interlock</option>
                      <option value="Yarns">Yarns</option>
                      <option value="School Uniform Fabric">School Uniform</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={item.unit}
                      onChange={e => handleUpdateLineItem(item.id, 'unit', e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="meter">meters</option>
                      <option value="kg">kgs</option>
                      <option value="yard">yards</option>
                      <option value="piece">pieces</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      value={item.netUnitPriceKES}
                      onChange={e => handleUpdateLineItem(item.id, 'netUnitPriceKES', Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-900"
                    />
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    KSh {item.lineNetKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-700">
                    KSh {item.lineVatKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    KSh {item.allocatedLogisticsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-900 bg-emerald-50/50">
                    KSh {item.totalCapitalizedKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-950 bg-emerald-100/60 text-xs">
                    KSh {item.unitLandedCostKES.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-slate-900">
                    KSh {item.suggestedRetailPriceKES?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      Bulk: KSh {item.suggestedBulkPriceKES}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveLineItem(item.id)}
                      disabled={activePurchase.lineItems.length <= 1}
                      className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs">
                <td colSpan={6} className="p-3 text-right">TOTALS:</td>
                <td className="p-3 text-right font-mono">
                  KSh {summary.totalNetPurchaseKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-3 text-right font-mono text-rose-700">
                  KSh {summary.totalVat16KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  KSh {summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-3 text-right font-mono text-emerald-900 bg-emerald-100/80">
                  KSh {summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td colSpan={3} className="p-3 text-center text-emerald-950 font-bold">
                  Avg Landed: KSh {summary.effectiveAverageCapitalizedCostPerUnit.toFixed(2)} / unit
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* LPS vs IPS Operational & Tax Guide */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Kenyan Textile Accounting Master Guide: LPS vs IPS Comparison
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 font-black text-emerald-400 text-sm">
              <Truck className="w-4 h-4" />
              <span>LPS: Local Purchase Supply</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              <li><strong>Source</strong>: Domestic Kenya mills & distributors (Rivatex, Thika Cloth Mills, Spinners).</li>
              <li><strong>Currency</strong>: 100% Kenyan Shillings (KES). No foreign exchange exposure or USD rates.</li>
              <li><strong>Tax Documentation</strong>: eTIMS / KRA TIMS Electronic Tax Invoice with CU Control Serial.</li>
              <li><strong>VAT Treatment</strong>: 16% Input VAT is claimed directly under <strong>KRA VAT-3 Return Section C</strong>.</li>
              <li><strong>Customs Duties</strong>: ZERO (No Import Duty, IDF, RDL, or EAC CET tariffs).</li>
              <li><strong>Landed Costing</strong>: Net Price + Local Transporter Trucking + Handling Labour = Unit Cost.</li>
            </ul>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 font-black text-rose-400 text-sm">
              <Layers className="w-4 h-4" />
              <span>IPS: Import Purchase Supply</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              <li><strong>Source</strong>: Overseas textile mills (China, India, Turkey, Egypt, UAE).</li>
              <li><strong>Currency</strong>: USD / EUR converted at KRA Customs Official Exchange Rate.</li>
              <li><strong>Tax Documentation</strong>: Customs SAD (C17B), Commercial Invoice, Packing List & KRA E-Slip.</li>
              <li><strong>VAT Treatment</strong>: Head 1202 Import VAT (16%) is claimed under <strong>KRA VAT-3 Return Section B</strong>.</li>
              <li><strong>Customs Duties</strong>: Import Duty (25-35%), IDF (2.5%), RDL (2.0%), MSS (USD 1.75/Tonne).</li>
              <li><strong>Landed Costing</strong>: CIF KES + Import Duty + IDF + RDL + Port CFS + Clearing Agent Fees = Unit Landed Cost.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Capitalization Confirmation Modal */}
      {isCapitalizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Confirm LPS Capitalization to General Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    PO {activePurchase.purchaseOrderNo} • {activePurchase.supplierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCapitalizeModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Confirming will execute a balanced double-entry journal entry and update the active cost valuation across all {summary.items.length} inventory lines:
              </p>

              {/* Double-entry preview */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono text-[11.5px]">
                <div className="flex justify-between text-slate-800 font-bold border-b border-slate-200 pb-1">
                  <span>Account Posting</span>
                  <span>Amount (KES)</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Dr 1200 - Raw Materials & Fabric Inventory Asset</span>
                  <span>+KSh {summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Dr 1201 - Input VAT Claimable (KRA Section C)</span>
                  <span>+KSh {summary.totalVat16KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Cr 2010 - Accounts Payable ({activePurchase.supplierName})</span>
                  <span>-KSh {summary.totalGrossSupplierPayableKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {summary.totalLogisticsAddOnsKES > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>Cr 2020 - Transporter / Clearing Logistics</span>
                    <span>-KSh {summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCapitalizeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCapitalize}
                disabled={isCapitalizing}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCapitalizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Posting to General Ledger...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Capitalize LPS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
