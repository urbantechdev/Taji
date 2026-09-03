import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ImportShipmentRecord,
  ImportShipmentLineItem,
  CategoryType,
  ProductBatch
} from '../../types';
import {
  calculateImportShipmentCosting,
  PRESET_INVOICE_26PA222,
  PRESET_SAD_26EMKIM400968589,
  PRESET_SAD_UDEY_UDYOG,
  PRESET_FLEECE_CONTAINER
} from '../../utils/importCostingEngine';
import {
  exportImportLandedCostingCSV,
  exportImportLandedCostingPDF
} from '../../utils/documentExport';
import {
  Ship,
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
  Building,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  Eye,
  Check,
  CalendarCheck,
  Sparkles,
  FileText,
  Truck,
  Building2
} from 'lucide-react';
import { Supplier, ClearingAgent } from '../../types';
import { SupplierDirectoryModal } from '../suppliers/SupplierDirectoryModal';
import { ClearingAgentDirectoryModal } from '../clearing/ClearingAgentDirectoryModal';
import { InwardInvoiceIntakeModal } from '../inventory/InwardInvoiceIntakeModal';
import { DocumentOCRParserModal } from './DocumentOCRParserModal';
import { ThreeWayWeightMatchingTab } from './ThreeWayWeightMatchingTab';
import { KRAVat3ReconcilerTab } from './KRAVat3ReconcilerTab';
import { MonthEndFastTrackWizard } from './MonthEndFastTrackWizard';
import { LocalPurchaseCostingTab } from './LocalPurchaseCostingTab';
import { ImportPaymentDisbursalSection } from './ImportPaymentDisbursalSection';

export const ImportTaxLandedCostingModule: React.FC = () => {
  const {
    products,
    locations,
    brandSettings,
    etrConfig,
    currentUser,
    addLedgerEntry,
    updateProductBatch
  } = useERP();

  // Active Sub-Tab within the Accountant Landed Costing & Tax Suite
  const [activeAccountantTab, setActiveAccountantTab] = useState<'local_purchase' | 'calculator' | 'three_way_matcher' | 'kra_vat3' | 'month_end'>('local_purchase');

  // OCR Document Parser Modal State
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);

  // Supplier Registry & Inward Invoice Intake Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isClearingAgentModalOpen, setIsClearingAgentModalOpen] = useState(false);
  const [isInwardInvoiceModalOpen, setIsInwardInvoiceModalOpen] = useState(false);
  const [selectedSupplierForInvoice, setSelectedSupplierForInvoice] = useState<Supplier | undefined>(undefined);

  // Active Shipment Record State (Initialized with Zhejiang Puan 26PA222 Preset)
  const [activeShipment, setActiveShipment] = useState<ImportShipmentRecord>(PRESET_INVOICE_26PA222);
  const [selectedPresetKey, setSelectedPresetKey] = useState<'26pa222' | 'sad_400968589' | 'udey' | 'fleece' | 'custom'>('26pa222');
  const [showSideBySideComparison, setShowSideBySideComparison] = useState(false);

  // Interactive FX Sensitivity Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [simulatedFXRate, setSimulatedFXRate] = useState<number>(activeShipment.exchangeRate);
  const [useSimulatedFX, setUseSimulatedFX] = useState(false);

  // Capitalization Modal State
  const [isCapitalizeModalOpen, setIsCapitalizeModalOpen] = useState(false);
  const [isCapitalizing, setIsCapitalizing] = useState(false);
  const [capitalizationSuccess, setCapitalizationSuccess] = useState<{
    journalRef: string;
    itemsUpdated: number;
    totalCapitalizedCost: number;
    vatClaimed: number;
  } | null>(null);

  // Active exchange rate used in calculation
  const effectiveExchangeRate = useSimulatedFX ? simulatedFXRate : activeShipment.exchangeRate;

  // Compute live costing and KRA taxes
  const costingSummary = useMemo(() => {
    return calculateImportShipmentCosting(
      {
        exchangeRate: effectiveExchangeRate,
        specificDutyUSDPerTonne: activeShipment.specificDutyUSDPerTonne ?? 750,
        specificDutyRatePerTonne: activeShipment.specificDutyRatePerTonne,
        adValoremRatePct: activeShipment.adValoremRatePct,
        idfRatePct: activeShipment.idfRatePct,
        rdlRatePct: activeShipment.rdlRatePct,
        vatRatePct: activeShipment.vatRatePct,
        mssLevyUSDRatePerTonne: activeShipment.mssLevyUSDRatePerTonne,
        cocFeesUSD: activeShipment.cocFeesUSD,
        totalFreightUSD: activeShipment.totalFreightUSD,
        totalInsuranceUSD: activeShipment.totalInsuranceUSD,
        portClearingFeesKES: activeShipment.portClearingFeesKES,
        targetMarkupPct: activeShipment.targetMarkupPct
      },
      activeShipment.lineItems
    );
  }, [activeShipment, effectiveExchangeRate]);

  // Dual computations for Proforma (26PA222) vs Actual Customs Entry (26EMKIM400968589) comparison
  const proformaSummary = useMemo(() => {
    return calculateImportShipmentCosting(
      {
        exchangeRate: PRESET_INVOICE_26PA222.exchangeRate,
        specificDutyUSDPerTonne: PRESET_INVOICE_26PA222.specificDutyUSDPerTonne ?? 750,
        specificDutyRatePerTonne: PRESET_INVOICE_26PA222.specificDutyRatePerTonne,
        adValoremRatePct: PRESET_INVOICE_26PA222.adValoremRatePct,
        idfRatePct: PRESET_INVOICE_26PA222.idfRatePct,
        rdlRatePct: PRESET_INVOICE_26PA222.rdlRatePct,
        vatRatePct: PRESET_INVOICE_26PA222.vatRatePct,
        mssLevyUSDRatePerTonne: PRESET_INVOICE_26PA222.mssLevyUSDRatePerTonne,
        cocFeesUSD: PRESET_INVOICE_26PA222.cocFeesUSD,
        totalFreightUSD: PRESET_INVOICE_26PA222.totalFreightUSD,
        totalInsuranceUSD: PRESET_INVOICE_26PA222.totalInsuranceUSD,
        portClearingFeesKES: PRESET_INVOICE_26PA222.portClearingFeesKES,
        targetMarkupPct: PRESET_INVOICE_26PA222.targetMarkupPct
      },
      PRESET_INVOICE_26PA222.lineItems
    );
  }, []);

  const actualSADSummary = useMemo(() => {
    return calculateImportShipmentCosting(
      {
        exchangeRate: PRESET_SAD_26EMKIM400968589.exchangeRate,
        specificDutyUSDPerTonne: PRESET_SAD_26EMKIM400968589.specificDutyUSDPerTonne ?? 750,
        specificDutyRatePerTonne: PRESET_SAD_26EMKIM400968589.specificDutyRatePerTonne,
        adValoremRatePct: PRESET_SAD_26EMKIM400968589.adValoremRatePct,
        idfRatePct: PRESET_SAD_26EMKIM400968589.idfRatePct,
        rdlRatePct: PRESET_SAD_26EMKIM400968589.rdlRatePct,
        vatRatePct: PRESET_SAD_26EMKIM400968589.vatRatePct,
        mssLevyUSDRatePerTonne: PRESET_SAD_26EMKIM400968589.mssLevyUSDRatePerTonne,
        cocFeesUSD: PRESET_SAD_26EMKIM400968589.cocFeesUSD,
        totalFreightUSD: PRESET_SAD_26EMKIM400968589.totalFreightUSD,
        totalInsuranceUSD: PRESET_SAD_26EMKIM400968589.totalInsuranceUSD,
        portClearingFeesKES: PRESET_SAD_26EMKIM400968589.portClearingFeesKES,
        targetMarkupPct: PRESET_SAD_26EMKIM400968589.targetMarkupPct
      },
      PRESET_SAD_26EMKIM400968589.lineItems
    );
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = (key: '26pa222' | 'sad_400968589' | 'udey' | 'fleece' | 'custom') => {
    setSelectedPresetKey(key);
    setCapitalizationSuccess(null);
    if (key === '26pa222') {
      setActiveShipment({ ...PRESET_INVOICE_26PA222 });
      setSimulatedFXRate(PRESET_INVOICE_26PA222.exchangeRate);
    } else if (key === 'sad_400968589') {
      setActiveShipment({ ...PRESET_SAD_26EMKIM400968589 });
      setSimulatedFXRate(PRESET_SAD_26EMKIM400968589.exchangeRate);
    } else if (key === 'udey') {
      setActiveShipment({ ...PRESET_SAD_UDEY_UDYOG });
      setSimulatedFXRate(PRESET_SAD_UDEY_UDYOG.exchangeRate);
    } else if (key === 'fleece') {
      setActiveShipment({ ...PRESET_FLEECE_CONTAINER });
      setSimulatedFXRate(PRESET_FLEECE_CONTAINER.exchangeRate);
    } else {
      // Blank custom shipment
      setActiveShipment({
        id: `IMP-CUSTOM-${Date.now().toString().slice(-4)}`,
        shipmentNumber: `IMP-2026-${Date.now().toString().slice(-4)}`,
        invoiceNumber: 'INV-CUSTOM-001',
        invoiceDate: new Date().toISOString().slice(0, 10),
        supplierName: 'OVERSEAS TEXTILE MILLS LTD',
        supplierCountry: 'CHINA',
        consigneeName: 'TAJI KNITTERS LIMITED',
        consigneePin: 'P051656758Y',
        declarantName: 'Blue Pearl Logistics Limited',
        declarantPin: 'P051506858S',
        customsEntryNo: '26EMKIM400999999',
        kraEslipRef: '1020260001009999',
        portOfEntry: 'ICD EMBAKASI',
        destinationLocationId: 'main_store',
        exchangeRate: 129.38999,
        specificDutyRatePerTonne: 97500,
        adValoremRatePct: 25.0,
        idfRatePct: 2.5,
        rdlRatePct: 2.0,
        vatRatePct: 16.0,
        mssLevyUSDRatePerTonne: 1.75,
        cocFeesUSD: 600.0,
        totalFreightUSD: 5000.0,
        totalInsuranceUSD: 20.0,
        portClearingFeesKES: 150000.0,
        targetMarkupPct: 35.0,
        status: 'draft',
        lineItems: [
          {
            id: 'LI-CUST-1',
            description: '100% Poly Special Derek 150CM 260GSM',
            category: 'Dereck',
            hsCode: '6006.32.00',
            fobUSD: 25000.0,
            netWeightKg: 10000.0,
            grossWeightKg: 10200.0,
            gsm: 260,
            widthCm: 150
          }
        ]
      });
      setSimulatedFXRate(129.38999);
    }
  };

  // Line item manipulation
  const handleUpdateLineItem = (id: string, updates: Partial<ImportShipmentLineItem>) => {
    setActiveShipment(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => (item.id === id ? { ...item, ...updates } : item))
    }));
  };

  const handleAddLineItem = () => {
    const newItem: ImportShipmentLineItem = {
      id: `LI-${Date.now().toString().slice(-4)}`,
      description: 'New Imported Fabric / Yarn Item',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 10000.0,
      netWeightKg: 5000.0,
      grossWeightKg: 5100.0,
      gsm: 260,
      widthCm: 150
    };
    setActiveShipment(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const handleRemoveLineItem = (id: string) => {
    if (activeShipment.lineItems.length <= 1) {
      alert('Shipment must have at least one line item.');
      return;
    }
    setActiveShipment(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  // General Ledger Posting & Inventory Capitalization
  const handleApproveAndCapitalize = async () => {
    setIsCapitalizing(true);

    try {
      const journalRef = `JRN-IMP-${activeShipment.customsEntryNo}`;
      const totalLandedExclVat = costingSummary.totalLandedInventoryKES - costingSummary.totalVAT1202KES;
      const vatClaim = costingSummary.totalVAT1202KES;
      const supplierPayable = (costingSummary.totalFOB_USD + costingSummary.totalFreightUSD + (activeShipment.cocFeesUSD || 0)) * effectiveExchangeRate;
      const kraTaxesPayable = costingSummary.totalKRATaxesKES;
      const portClearingPayable = costingSummary.totalPortClearingKES;

      // 1. Post Debit to Inventory Asset (Raw Materials / Stock in Transit)
      addLedgerEntry({
        transactionRef: journalRef,
        description: `Import Landed Inventory Capitalization - Invoice ${activeShipment.invoiceNumber} | SAD ${activeShipment.customsEntryNo} (${activeShipment.supplierName})`,
        debitAccount: '1200 - Inventory Asset (Imported Fabrics & Yarns Capitalized)',
        creditAccount: '2010 - Accounts Payable (Overseas Supplier Clearing)',
        amount: totalLandedExclVat,
        locationId: activeShipment.destinationLocationId || 'main_store',
        category: 'Import Landed Costing Capitalization'
      });

      // 2. Post Debit to KRA Input VAT Receivable (1202 Import VAT Claimable)
      addLedgerEntry({
        transactionRef: journalRef,
        description: `KRA 1202 Import VAT Input Tax Claim - E-Slip Ref ${activeShipment.kraEslipRef} | SAD ${activeShipment.customsEntryNo}`,
        debitAccount: '1410 - KRA Input VAT Receivable (Import VAT 1202)',
        creditAccount: '2120 - KRA Customs Taxes & Duties Clearing',
        amount: vatClaim,
        locationId: activeShipment.destinationLocationId || 'main_store',
        category: 'Tax VAT'
      });

      // 3. Post Credit to KRA Customs Duties & Levies Payable
      addLedgerEntry({
        transactionRef: journalRef,
        description: `KRA Customs Duty & Statutory Levies (1002 Duty, 1801 IDF, 6001 RDL, 6401 MSS) - E-Slip ${activeShipment.kraEslipRef}`,
        debitAccount: '2120 - KRA Customs Taxes & Duties Clearing',
        creditAccount: '1010 - Bank / KRA e-Payment Account',
        amount: kraTaxesPayable,
        locationId: activeShipment.destinationLocationId || 'main_store',
        category: 'Tax Settlement'
      });

      // 4. Update Product Batch Cost Prices in Catalog for linked items
      let updatedCount = 0;
      for (const item of costingSummary.items) {
        if (item.matchedProductId) {
          const matchingProduct = products.find(p => p.id === item.matchedProductId || p.sku === item.matchedProductId);
          if (matchingProduct) {
            const newCost = item.landedCostPerUnitExclVat > 0 ? Math.round(item.landedCostPerUnitExclVat * 100) / 100 : item.landedCostPerUnit;
            const newRetail = Math.round(item.suggestedRetailPrice);
            await updateProductBatch(matchingProduct.id, {
              costPrice: newCost,
              unitPriceRetail: newRetail
            });
            updatedCount++;
          }
        }
      }

      // Mark record as capitalized
      setActiveShipment(prev => ({
        ...prev,
        status: 'approved_capitalized',
        capitalizedAt: new Date().toISOString(),
        capitalizedBy: currentUser.name,
        journalVoucherRef: journalRef
      }));

      setCapitalizationSuccess({
        journalRef,
        itemsUpdated: updatedCount,
        totalCapitalizedCost: totalLandedExclVat,
        vatClaimed: vatClaim
      });
    } catch (err) {
      console.error('Failed to capitalize import inventory:', err);
      alert('Error capitalizing import shipment into General Ledger.');
    } finally {
      setIsCapitalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Presets Selector */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1b2230] to-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white shadow-md shadow-rose-950/50 shrink-0">
                <Ship className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                    Import Tax &amp; Landed Costing Engine
                  </h3>
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                    KRA ICMS SAD Compliant
                  </span>
                  {activeShipment.status === 'approved_capitalized' && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Capitalized to GL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated KRA tax liabilities (1002 Duty, 1801 IDF, 6001 RDL, 1202 Import VAT, 6401 MSS), freight/CoC apportionment, and unit landed inventory capitalization (KES/m &amp; KES/kg).
                </p>
              </div>
            </div>

            {/* Quick Export & Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* OCR Import Action */}
              <button
                type="button"
                id="btn-tax-smart-ocr"
                onClick={() => setIsOCRModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Scan & Auto-Extract Customs SAD / Supplier Invoice via OCR"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Smart OCR</span>
              </button>

              {/* Exports */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 p-1 rounded-xl shadow-2xs">
                <button
                  type="button"
                  id="btn-tax-export-pdf"
                  onClick={() => exportImportLandedCostingPDF(activeShipment, costingSummary, brandSettings, etrConfig)}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Download Official Landed Costing Assessment Schedule as PDF"
                >
                  <FileDown className="w-3.5 h-3.5 shrink-0" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-tax-export-csv"
                  onClick={() => exportImportLandedCostingCSV(activeShipment, costingSummary, etrConfig)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/70 font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Export Tax Breakdown Schedule as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span>CSV</span>
                </button>
              </div>

              {/* Supplier & Inward Intake */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 p-1 rounded-xl shadow-2xs">
                <button
                  type="button"
                  id="btn-tax-suppliers"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="px-2.5 py-1.5 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Open Supplier Directory"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Suppliers</span>
                </button>

                <button
                  type="button"
                  id="btn-tax-clearing-agents"
                  onClick={() => setIsClearingAgentModalOpen(true)}
                  className="px-2.5 py-1.5 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Open Clearing & Forwarding Declarants Directory"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Clearing Agents</span>
                </button>

                <button
                  type="button"
                  id="btn-tax-inward-invoice"
                  onClick={() => {
                    setSelectedSupplierForInvoice(undefined);
                    setIsInwardInvoiceModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                  title="Onboard New Inward Consignment or Commercial Invoice"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span>+ Inward Invoice</span>
                </button>
              </div>

              {/* Capitalize Button */}
              <button
                type="button"
                id="btn-tax-capitalize-ledger"
                onClick={() => setIsCapitalizeModalOpen(true)}
                disabled={activeShipment.status === 'approved_capitalized'}
                className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeShipment.status === 'approved_capitalized'
                    ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-700/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:scale-102'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{activeShipment.status === 'approved_capitalized' ? 'Capitalized' : 'Approve & Capitalize'}</span>
              </button>
            </div>
          </div>

          {/* Accountant Workflow Sub-Tabs - Organized responsive layout */}
          <div className="border-t border-slate-700/70 pt-3">
            <div className="flex flex-wrap lg:flex-nowrap gap-2 items-stretch">
              <button
                type="button"
                id="tab-accountant-local-purchase"
                onClick={() => setActiveAccountantTab('local_purchase')}
                className={`flex-1 min-w-[155px] lg:min-w-0 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                  activeAccountantTab === 'local_purchase'
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeAccountantTab === 'local_purchase' ? 'bg-emerald-700 text-white' : 'bg-slate-700/60 text-emerald-400'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black text-xs leading-tight">1. Local Supply (LPS)</div>
                  <div className={`text-[10px] truncate mt-0.5 ${activeAccountantTab === 'local_purchase' ? 'text-emerald-100' : 'text-slate-400'}`}>Domestic Landed &amp; eTIMS</div>
                </div>
              </button>

              <button
                type="button"
                id="tab-accountant-calculator"
                onClick={() => setActiveAccountantTab('calculator')}
                className={`flex-1 min-w-[155px] lg:min-w-0 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                  activeAccountantTab === 'calculator'
                    ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeAccountantTab === 'calculator' ? 'bg-rose-700 text-white' : 'bg-slate-700/60 text-rose-400'}`}>
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black text-xs leading-tight">2. Import Costing (IPS)</div>
                  <div className={`text-[10px] truncate mt-0.5 ${activeAccountantTab === 'calculator' ? 'text-rose-100' : 'text-slate-400'}`}>KRA SAD &amp; Tariff Duties</div>
                </div>
              </button>

              <button
                type="button"
                id="tab-accountant-three-way"
                onClick={() => setActiveAccountantTab('three_way_matcher')}
                className={`flex-1 min-w-[155px] lg:min-w-0 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                  activeAccountantTab === 'three_way_matcher'
                    ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeAccountantTab === 'three_way_matcher' ? 'bg-rose-700 text-white' : 'bg-slate-700/60 text-amber-400'}`}>
                  <Scale className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black text-xs leading-tight">3. 3-Way Weight Match</div>
                  <div className={`text-[10px] truncate mt-0.5 ${activeAccountantTab === 'three_way_matcher' ? 'text-rose-100' : 'text-slate-400'}`}>Scale Intake &amp; Claims</div>
                </div>
              </button>

              <button
                type="button"
                id="tab-accountant-kra-vat3"
                onClick={() => setActiveAccountantTab('kra_vat3')}
                className={`flex-1 min-w-[155px] lg:min-w-0 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                  activeAccountantTab === 'kra_vat3'
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeAccountantTab === 'kra_vat3' ? 'bg-emerald-700 text-white' : 'bg-slate-700/60 text-emerald-400'}`}>
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black text-xs leading-tight">4. KRA VAT-3 Return</div>
                  <div className={`text-[10px] truncate mt-0.5 ${activeAccountantTab === 'kra_vat3' ? 'text-emerald-100' : 'text-slate-400'}`}>LPS &amp; IPS Tax Offset</div>
                </div>
              </button>

              <button
                type="button"
                id="tab-accountant-month-end"
                onClick={() => setActiveAccountantTab('month_end')}
                className={`flex-1 min-w-[155px] lg:min-w-0 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                  activeAccountantTab === 'month_end'
                    ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeAccountantTab === 'month_end' ? 'bg-rose-700 text-white' : 'bg-slate-700/60 text-purple-400'}`}>
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black text-xs leading-tight">5. Month-End Close</div>
                  <div className={`text-[10px] truncate mt-0.5 ${activeAccountantTab === 'month_end' ? 'text-rose-100' : 'text-slate-400'}`}>GL Rollup &amp; Archive</div>
                </div>
              </button>
            </div>
          </div>

          {/* Preset Profiles Selector (Shown when on calculator or 3-way matcher) */}
          {(activeAccountantTab === 'calculator' || activeAccountantTab === 'three_way_matcher') && (
          <div className="space-y-1.5 border-t border-slate-700/70 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Active Commercial Invoice / Customs SAD Declaration:
                </span>
                <span className="text-[10px] text-slate-400">
                  Switch between Proforma estimates and final KRA customs entry declarations (SAD-ICMS)
                </span>
              </div>

              {/* Side-by-side comparison quick toggle */}
              <button
                onClick={() => setShowSideBySideComparison(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  showSideBySideComparison
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                    : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>{showSideBySideComparison ? 'Hide Side-by-Side Reconciliation' : '⚖️ Reconcile Proforma vs. Actual Entry'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <button
                onClick={() => handleSelectPreset('26pa222')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === '26pa222'
                    ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-300">Proforma 26PA222</span>
                  <span className="text-[9px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200 font-mono">Proforma Est.</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">Zhejiang Puan Textile</p>
                <p className="text-[10px] text-slate-400">FOB $46,974 | 22,312 kg</p>
              </button>

              <button
                onClick={() => handleSelectPreset('sad_400968589')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'sad_400968589'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300">SAD 26EMKIM400968589</span>
                  <span className="text-[9px] bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-200 font-mono">Actual Entry</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">Zhejiang Puan (Customs)</p>
                <p className="text-[10px] text-emerald-400 font-mono">FOB $36,900 | 22,600 kg</p>
              </button>

              <button
                onClick={() => handleSelectPreset('udey')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'udey'
                    ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-300">SAD 26EMKIM400955090</span>
                  <span className="text-[9px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200 font-mono">Acrylic Yarn</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">Udey Udyog (Oster India)</p>
                <p className="text-[10px] text-slate-400">13,000 kg 2/24 NM Cones | KES 2.71M Tax</p>
              </button>

              <button
                onClick={() => handleSelectPreset('fleece')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'fleece'
                    ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-300">Invoice 26FLC-882</span>
                  <span className="text-[9px] bg-sky-500/30 px-1.5 py-0.5 rounded text-sky-200 font-mono">Polar Fleece</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">Shaoxing Shengli Textile</p>
                <p className="text-[10px] text-slate-400">16,800 kg Heavy Polar Fleece Rolls</p>
              </button>

              <button
                onClick={() => handleSelectPreset('custom')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'custom'
                    ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-300">+ Custom Shipment</span>
                  <span className="text-[9px] bg-purple-500/30 px-1.5 py-0.5 rounded text-purple-200 font-mono">Blank Form</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1">Manual Commercial Invoice</p>
                <p className="text-[10px] text-slate-400">User Defined Parameters</p>
              </button>
            </div>

            {/* SIDE-BY-SIDE PROFORMA VS. ACTUAL CUSTOMS ENTRY (26EMKIM400968589) RECONCILIATION */}
            {showSideBySideComparison && (
              <div className="mt-4 p-4 sm:p-5 bg-slate-950/90 rounded-2xl border border-rose-500/40 shadow-xl text-slate-100 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-xs">
                      VS
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-2">
                        <span>Commercial Invoice Proforma vs. Actual Customs Declaration (SAD 26EMKIM400968589)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Reconciliation Engine
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Detailed variance analysis between initial supplier proforma (26PA222) and final ICMS customs declaration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectPreset('26pa222')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        selectedPresetKey === '26pa222'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Use Proforma
                    </button>
                    <button
                      onClick={() => handleSelectPreset('sad_400968589')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        selectedPresetKey === 'sad_400968589'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Use Actual SAD
                    </button>
                  </div>
                </div>

                {/* Variance Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <th className="py-2 px-3">Accounting Valuation Field</th>
                        <th className="py-2 px-3 text-right">Proforma (26PA222)</th>
                        <th className="py-2 px-3 text-right text-emerald-400">Actual SAD (26EMKIM400968589)</th>
                        <th className="py-2 px-3 text-right text-rose-400">Variance ($\Delta$)</th>
                        <th className="py-2 px-3 text-left">Compliance &amp; Accounting Treatment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11.5px]">
                      {/* FOB USD */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">Commercial FOB (USD)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          ${proformaSummary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          ${actualSADSummary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-300">
                          ${(actualSADSummary.totalFOB_USD - proformaSummary.totalFOB_USD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[9.5px] ml-1 opacity-70">
                            ({(((actualSADSummary.totalFOB_USD - proformaSummary.totalFOB_USD) / (proformaSummary.totalFOB_USD || 1)) * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          Declared customs value reflects agreed final supplier settlement invoice
                        </td>
                      </tr>

                      {/* Net Weight */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">Total Net Weight (kg)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {proformaSummary.totalNetWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          {actualSADSummary.totalNetWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-300">
                          +{(actualSADSummary.totalNetWeightKg - proformaSummary.totalNetWeightKg).toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                          <span className="text-[9.5px] ml-1 opacity-70">
                            (+{(((actualSADSummary.totalNetWeightKg - proformaSummary.totalNetWeightKg) / (proformaSummary.totalNetWeightKg || 1)) * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          Net certified scale weight on ICMS bill of lading / weighing certificate
                        </td>
                      </tr>

                      {/* Specific Duty Benchmark */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">Specific Duty Rate</td>
                        <td className="py-2 px-3 text-right text-slate-300">USD 750 / Tonne</td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">USD 750 / Tonne</td>
                        <td className="py-2 px-3 text-right text-slate-400">Floating FX</td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          KES {(750 * 129.47).toLocaleString()} / Tonne (KES 97.10 / kg) via prevailing exchange rate
                        </td>
                      </tr>

                      {/* Customs Value KES */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">Customs CIF Value (KES)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          KSh {proformaSummary.totalCustomsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          KSh {actualSADSummary.totalCustomsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-300">
                          KSh {(actualSADSummary.totalCustomsValueKES - proformaSummary.totalCustomsValueKES).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          (FOB + Freight + Insurance) × 129.47 KES/USD
                        </td>
                      </tr>

                      {/* KRA Tax Head 1002 (Duty) */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">1002 Import Duty (KES)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          KSh {proformaSummary.totalImportDuty1002KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          KSh {actualSADSummary.totalImportDuty1002KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-300">
                          +KSh {(actualSADSummary.totalImportDuty1002KES - proformaSummary.totalImportDuty1002KES).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          Specific duty benchmark applied (higher than 25% ad-valorem)
                        </td>
                      </tr>

                      {/* KRA Tax Head 1202 (VAT) */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">1202 Import VAT (16%)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          KSh {proformaSummary.totalVAT1202KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          KSh {actualSADSummary.totalVAT1202KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-300">
                          KSh {(actualSADSummary.totalVAT1202KES - proformaSummary.totalVAT1202KES).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10.5px]">
                          Input VAT offset against output tax on VAT-3 return
                        </td>
                      </tr>

                      {/* Total KRA Taxes */}
                      <tr className="hover:bg-slate-900/50 bg-slate-900/60 font-black">
                        <td className="py-2.5 px-3 font-sans font-extrabold text-white">Total KRA Customs Taxes</td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          KSh {proformaSummary.totalKRATaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          KSh {actualSADSummary.totalKRATaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-300">
                          KSh {(actualSADSummary.totalKRATaxesKES - proformaSummary.totalKRATaxesKES).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-emerald-400 text-[10.5px]">
                          Payable to National Bank of Kenya / CBK via KRA e-Slip
                        </td>
                      </tr>

                      {/* Unit Landed Costing Comparison */}
                      <tr className="hover:bg-slate-900/50 bg-emerald-950/30">
                        <td className="py-2 px-3 font-sans font-bold text-emerald-200">Derek Fabric Cost / Metre (Excl VAT)</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          KSh {(proformaSummary.items[0]?.landedCostPerUnitExclVat || 0).toFixed(2)} / m
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                          KSh {(actualSADSummary.items[0]?.landedCostPerUnitExclVat || 0).toFixed(2)} / m
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {((actualSADSummary.items[0]?.landedCostPerUnitExclVat || 0) - (proformaSummary.items[0]?.landedCostPerUnitExclVat || 0)).toFixed(2)} KES/m
                        </td>
                        <td className="py-2 px-3 font-sans text-emerald-300 text-[10.5px]">
                          Capitalized into Inventory Asset GL #1300 upon Customs sign-off
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Reconciliation Sign-Off:</strong> CoC fees are excluded from the customs valuation base (0% customs tax), but factored into the final capitalized inventory landed cost.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleSelectPreset('sad_400968589');
                      setShowSideBySideComparison(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Adopt Actual SAD Entry (26EMKIM400968589)
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* TAB 1: LPS • LOCAL PURCHASE SUPPLY (eTIMS & DOMESTIC LANDED COSTING) */}
      {activeAccountantTab === 'local_purchase' && (
        <LocalPurchaseCostingTab />
      )}

      {/* TAB 2: IPS • IMPORT PURCHASE SUPPLY (LANDED COSTING & KRA SCHEDULE) */}
      {activeAccountantTab === 'calculator' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Capitalization Success Alert Banner */}
          {capitalizationSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm text-slate-900 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-emerald-950">
                      Import Shipment Successfully Capitalized to General Ledger!
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
                  <span className="text-slate-500 block text-[10.5px]">Capitalized Inventory (Asset):</span>
                  <span className="font-black text-slate-900 text-sm">
                    KSh {capitalizationSuccess.totalCapitalizedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 block text-[10.5px]">1202 Import VAT Claim (Asset):</span>
                  <span className="font-black text-rose-700 text-sm">
                    KSh {capitalizationSuccess.vatClaimed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 block text-[10.5px]">Product Catalog Costs Updated:</span>
                  <span className="font-black text-emerald-800 text-sm">
                    {capitalizationSuccess.itemsUpdated} Product Batches Updated
                  </span>
                </div>
              </div>
            </div>
          )}

      {/* KPI Cards: Customs Value, Total Taxes, Total Landed Capital, Units */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Customs Value (KES)</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">
            KSh {costingSummary.totalCustomsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>CIF: ${costingSummary.totalCIF_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="font-mono font-bold text-slate-700">@ {effectiveExchangeRate.toFixed(2)} FX</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold">
            <span>KRA Tax Assessment (e-Slip)</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-700">
            KSh {costingSummary.totalKRATaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-rose-600/80 flex items-center justify-between font-medium">
            <span>1002 Duty: KSh {costingSummary.totalImportDuty1002KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>1202 VAT: KSh {costingSummary.totalVAT1202KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
            <span>Total Landed Capitalized</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800">
            KSh {costingSummary.totalLandedInventoryKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Excl VAT: KSh {(costingSummary.totalLandedInventoryKES - costingSummary.totalVAT1202KES).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-emerald-700 font-bold">+ CoC &amp; Port</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Imported Volume</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {costingSummary.totalFabricMetres > 0 ? (
              <span>{Math.round(costingSummary.totalFabricMetres).toLocaleString()} <span className="text-sm text-slate-500 font-bold">m</span></span>
            ) : (
              <span>{Math.round(costingSummary.totalNetWeightKg).toLocaleString()} <span className="text-sm text-slate-500 font-bold">kg</span></span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Net: {costingSummary.totalNetWeightKg.toLocaleString()} kg</span>
            <span>Gross: {costingSummary.totalGrossWeightKg.toLocaleString()} kg</span>
          </div>
        </div>
      </div>

      {/* FX Sensitivity & Stress-Test Simulator Accordion */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                Live Exchange Rate Sensitivity &amp; Margin Simulator
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  Stress Testing
                </span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Simulate currency volatility and CBK customs rate shifts to see immediate impact on KRA tax bills and landed unit cost per metre.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <input
                type="checkbox"
                checked={useSimulatedFX}
                onChange={e => setUseSimulatedFX(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Enable Simulation FX</span>
            </label>

            {useSimulatedFX && (
              <button
                onClick={() => setSimulatedFXRate(activeShipment.exchangeRate)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                title="Reset to Invoice Default Rate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {useSimulatedFX && (
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Simulated Rate:</span>
                <span className="font-mono text-base font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  KES {simulatedFXRate.toFixed(2)} / USD
                </span>
                <span className="text-[11px] text-slate-500">
                  (Diff: {(simulatedFXRate - activeShipment.exchangeRate >= 0 ? '+' : '')}{(simulatedFXRate - activeShipment.exchangeRate).toFixed(2)} KES)
                </span>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center gap-1.5">
                {[125.0, 129.39, 132.0, 135.0, 140.0, 145.0].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSimulatedFXRate(rate)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      Math.abs(simulatedFXRate - rate) < 0.01
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {rate.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-500">110.00</span>
              <input
                type="range"
                min="110.00"
                max="160.00"
                step="0.25"
                value={simulatedFXRate}
                onChange={e => setSimulatedFXRate(parseFloat(e.target.value))}
                className="flex-1 accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-bold text-slate-500">160.00</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout: Form Parameters & KRA Official Tax Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Shipment & Customs Entry Header Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-rose-600" />
              <span>Shipment &amp; Customs Parameters</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Ref: {activeShipment.shipmentNumber}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Invoice & Supplier Info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Commercial Invoice #</label>
                <input
                  type="text"
                  value={activeShipment.invoiceNumber}
                  onChange={e => setActiveShipment(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={activeShipment.invoiceDate}
                  onChange={e => setActiveShipment(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">Overseas Supplier Name</label>
              <input
                type="text"
                value={activeShipment.supplierName}
                onChange={e => setActiveShipment(prev => ({ ...prev, supplierName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* KRA Customs Entry Details */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">KRA SAD Entry Number</label>
                <input
                  type="text"
                  value={activeShipment.customsEntryNo}
                  onChange={e => setActiveShipment(prev => ({ ...prev, customsEntryNo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">KRA E-Slip Ref #</label>
                <input
                  type="text"
                  value={activeShipment.kraEslipRef}
                  onChange={e => setActiveShipment(prev => ({ ...prev, kraEslipRef: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Parameters: FX Rate, Freight, Insurance, CoC, Port Fees */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <h5 className="font-extrabold text-[11px] text-slate-600 uppercase tracking-wider">
                Financial Valuation &amp; Ocean Logistics
              </h5>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    CBK Exchange Rate (KES/USD)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={activeShipment.exchangeRate}
                    onChange={e => setActiveShipment(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-black text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">Total Ocean Freight (USD)</label>
                  <input
                    type="number"
                    step="1"
                    value={activeShipment.totalFreightUSD}
                    onChange={e => setActiveShipment(prev => ({ ...prev, totalFreightUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Insurance (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeShipment.totalInsuranceUSD}
                    onChange={e => setActiveShipment(prev => ({ ...prev, totalInsuranceUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">CoC Fees (USD)</label>
                  <input
                    type="number"
                    step="1"
                    value={activeShipment.cocFeesUSD}
                    onChange={e => setActiveShipment(prev => ({ ...prev, cocFeesUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Port/CFS Fees (KES)</label>
                  <input
                    type="number"
                    step="1000"
                    value={activeShipment.portClearingFeesKES}
                    onChange={e => setActiveShipment(prev => ({ ...prev, portClearingFeesKES: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tax Tariff Rates Header & Dynamic USD Specific Duty Benchmark */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-[11px] text-slate-600 uppercase tracking-wider">
                  Statutory KRA Tax Rates (Editable)
                </h5>
                <span className="text-[10px] text-slate-400">
                  Per EAC Customs Management Act
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1">Ad-Valorem %</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activeShipment.adValoremRatePct}
                    onChange={e => setActiveShipment(prev => ({ ...prev, adValoremRatePct: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-xs text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5"
                  />
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1">1801 IDF %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={activeShipment.idfRatePct}
                    onChange={e => setActiveShipment(prev => ({ ...prev, idfRatePct: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-xs text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5"
                  />
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1">6001 RDL %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={activeShipment.rdlRatePct}
                    onChange={e => setActiveShipment(prev => ({ ...prev, rdlRatePct: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-xs text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5"
                  />
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1">1202 VAT %</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activeShipment.vatRatePct}
                    onChange={e => setActiveShipment(prev => ({ ...prev, vatRatePct: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-xs text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5"
                  />
                </div>
              </div>

              {/* Specific Duty USD per Tonne & MSS Levy */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-rose-800">Specific Duty USD/Tonne</span>
                    <span className="text-[9px] text-rose-600 font-mono">Net Tonne</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-700">$</span>
                    <input
                      type="number"
                      step="10"
                      value={activeShipment.specificDutyUSDPerTonne ?? 750}
                      onChange={e => {
                        const usdVal = parseFloat(e.target.value) || 0;
                        setActiveShipment(prev => ({
                          ...prev,
                          specificDutyUSDPerTonne: usdVal,
                          specificDutyRatePerTonne: usdVal * effectiveExchangeRate
                        }));
                      }}
                      className="w-full font-mono font-bold text-xs text-rose-900 bg-white border border-rose-200 rounded px-2 py-1"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-700">6401 MSS Levy USD/Tonne</span>
                    <span className="text-[9px] text-slate-500 font-mono">Gross Tonne</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">$</span>
                    <input
                      type="number"
                      step="0.05"
                      value={activeShipment.mssLevyUSDRatePerTonne ?? 1.75}
                      onChange={e => setActiveShipment(prev => ({ ...prev, mssLevyUSDRatePerTonne: parseFloat(e.target.value) || 0 }))}
                      className="w-full font-mono font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Live Floating Specific Duty Benchmark in KES */}
              <div className="p-2.5 bg-rose-100/60 rounded-xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Dynamic Specific Duty Benchmark:</span>
                  <span className="font-mono font-black">
                    KES {((activeShipment.specificDutyUSDPerTonne ?? 750) * effectiveExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} / Tonne
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-rose-700 font-medium">
                  <span>Equivalent per Kilogram:</span>
                  <span className="font-mono font-bold">
                    KES {(((activeShipment.specificDutyUSDPerTonne ?? 750) * effectiveExchangeRate) / 1000).toFixed(2)} / kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Official KRA Tax Assessment Payment Slip Layout (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" />
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  KRA Customs Payment Slip Assessment (e-Slip)
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  Official Single Administrative Document (SAD-ICMS) tax accounting heads
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">E-Slip Search Code:</span>
              <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {activeShipment.kraEslipRef}
              </span>
            </div>
          </div>

          {/* Tax Code Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                  <th className="py-2 px-3 rounded-l-lg">Sr.No</th>
                  <th className="py-2 px-3">Tax Code</th>
                  <th className="py-2 px-3">Tax Head Description</th>
                  <th className="py-2 px-3 text-right">Tax Base (KES)</th>
                  <th className="py-2 px-3 text-right rounded-r-lg">Payable (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">1</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">1002</td>
                  <td className="py-2 px-3 font-semibold">Import Duty (Higher of Ad-Valorem vs Specific)</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {costingSummary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {costingSummary.totalImportDuty1002KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">2</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">1102</td>
                  <td className="py-2 px-3 text-slate-500">Excise Duty (Textiles / Fabrics)</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">0.00</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">0.00</td>
                </tr>

                <tr className="hover:bg-slate-50/80 bg-rose-50/30">
                  <td className="py-2 px-3 font-mono text-slate-500">3</td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-700">1202</td>
                  <td className="py-2 px-3 font-semibold text-rose-900">
                    VAT Imports (16% Input Tax Claimable)
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {(costingSummary.totalCustomsValueKES + costingSummary.totalImportDuty1002KES + costingSummary.totalIDF1801KES + costingSummary.totalRDL6001KES).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                    {costingSummary.totalVAT1202KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">4</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">1801</td>
                  <td className="py-2 px-3">Import Declaration Fee (IDF - 2.5%)</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {costingSummary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {costingSummary.totalIDF1801KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">5</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">6001</td>
                  <td className="py-2 px-3">Kenya Railway Development Levy (RDL - 2.0%)</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {costingSummary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {costingSummary.totalRDL6001KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">6</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">6401</td>
                  <td className="py-2 px-3">Merchant Shipping Superintendent (MSS) Levy</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {costingSummary.totalGrossWeightKg.toLocaleString()} kg
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {costingSummary.totalMSS6401KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Grand Total Row */}
                <tr className="bg-rose-100/70 font-black text-rose-950 text-sm">
                  <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider rounded-l-lg">
                    Total Amount to be Paid (KRA Tax Liability):
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-rose-700 rounded-r-lg">
                    KSh {costingSummary.totalKRATaxesKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Information Footnote */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>KRA Tax Compliance &amp; Accounting Treatment</span>
            </div>
            <p>
              Import Duty (1002), IDF (1801), RDL (6001), and MSS (6401) are non-recoverable customs costs that are directly capitalized into the inventory cost price (increasing balance sheet asset value).
            </p>
            <p>
              VAT on Imports (1202) of <span className="font-bold text-rose-700">KSh {costingSummary.totalVAT1202KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> is treated as Input VAT receivable on the monthly VAT-3 return, reducing future KRA tax remittances.
            </p>
          </div>
        </div>
      </div>

      {/* 3-WAY IMPORT DISBURSAL & PAYMENT SECTION (USD SUPPLIER • KES KRA • KES CLEARING) */}
      <ImportPaymentDisbursalSection
        shipment={activeShipment}
        totalCustomsTaxesKES={costingSummary.totalKRATaxesKES}
        duty1002KES={costingSummary.totalImportDuty1002KES}
        idf1801KES={costingSummary.totalIDF1801KES}
        rdl6001KES={costingSummary.totalRDL6001KES}
        vat1202KES={costingSummary.totalVAT1202KES}
        mss6401KES={costingSummary.totalMSS6401KES}
        totalFOB_USD={costingSummary.totalFOB_USD}
        totalFreightUSD={costingSummary.totalFreightUSD}
        effectiveExchangeRate={effectiveExchangeRate}
        onUpdateShipment={(updated) => setActiveShipment(updated)}
      />

      {/* Item-Level Data Grid & Unit Landed Costing Table */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-rose-600" />
              <span>Commercial Invoice Line Items &amp; Unit Landed Cost Valuation</span>
            </h4>
            <p className="text-xs text-slate-500">
              Formula: Apportioned CIF + KRA Taxes + CoC / Port Fees ÷ Fabric Metres = Landed Cost per Metre (KES/m)
            </p>
          </div>

          <button
            onClick={handleAddLineItem}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Commercial Line Item</span>
          </button>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Description / HS Code</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2 text-right">FOB (USD)</th>
                <th className="py-2.5 px-2 text-right">Net Wt (kg)</th>
                <th className="py-2.5 px-2 text-right">GSM / Width</th>
                <th className="py-2.5 px-2 text-right">Fabric Metres</th>
                <th className="py-2.5 px-2 text-right">Customs (KES)</th>
                <th className="py-2.5 px-2 text-right">KRA Duty Head</th>
                <th className="py-2.5 px-2 text-right">Total Landed (KES)</th>
                <th className="py-2.5 px-3 text-right bg-rose-50/70 text-rose-900 font-black">Landed Cost / m (Incl)</th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/70 text-emerald-950 font-black">Landed Cost / m (Excl VAT)</th>
                <th className="py-2.5 px-2 text-right">Target Retail</th>
                <th className="py-2.5 px-2 text-center">Catalog Link</th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {costingSummary.items.map((item, idx) => {
                const isFabric = (item.fabricLengthMetres || 0) > 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Description & HS Code */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateLineItem(item.id, { description: e.target.value })}
                        className="w-full font-bold text-slate-900 text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">HS:</span>
                        <input
                          type="text"
                          value={item.hsCode}
                          onChange={e => handleUpdateLineItem(item.id, { hsCode: e.target.value })}
                          className="font-mono text-[10.5px] text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 w-24"
                        />
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-2">
                      <select
                        value={item.category}
                        onChange={e => handleUpdateLineItem(item.id, { category: e.target.value as CategoryType })}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Dereck">Dereck</option>
                        <option value="Fleece">Fleece</option>
                        <option value="Yarns">Yarns</option>
                      </select>
                    </td>

                    {/* FOB USD */}
                    <td className="py-3 px-2 text-right">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.fobUSD}
                          onChange={e => handleUpdateLineItem(item.id, { fobUSD: parseFloat(e.target.value) || 0 })}
                          className="w-24 font-mono font-bold text-right text-xs px-2 py-1 pl-4 rounded-lg border border-slate-200"
                        />
                      </div>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">
                        Ratio: {(item.fobRatio * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Net Wt kg */}
                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        step="0.1"
                        value={item.netWeightKg}
                        onChange={e => handleUpdateLineItem(item.id, { netWeightKg: parseFloat(e.target.value) || 0 })}
                        className="w-20 font-mono font-medium text-right text-xs px-2 py-1 rounded-lg border border-slate-200"
                      />
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">
                        Gross: {item.grossWeightKg}kg
                      </span>
                    </td>

                    {/* GSM & Width */}
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          placeholder="GSM"
                          value={item.gsm || ''}
                          onChange={e => handleUpdateLineItem(item.id, { gsm: parseFloat(e.target.value) || undefined })}
                          className="w-14 text-right text-[11px] px-1.5 py-1 rounded border border-slate-200"
                          title="Grams per square metre"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="number"
                          placeholder="cm"
                          value={item.widthCm || ''}
                          onChange={e => handleUpdateLineItem(item.id, { widthCm: parseFloat(e.target.value) || undefined })}
                          className="w-12 text-right text-[11px] px-1.5 py-1 rounded border border-slate-200"
                          title="Width in cm"
                        />
                      </div>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">
                        {item.gsm ? `${item.gsm}g · ${item.widthCm}cm` : 'N/A (Yarn)'}
                      </span>
                    </td>

                    {/* Computed Fabric Metres */}
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      {isFabric ? (
                        <div>
                          <span>{item.fabricLengthMetres?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m</span>
                          <span className="text-[9.5px] text-slate-400 block font-normal">
                            {(item.netWeightKg / (item.fabricLengthMetres || 1)).toFixed(3)} kg/m
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">{item.netWeightKg.toLocaleString()} kg (Cone)</span>
                      )}
                    </td>

                    {/* Customs Value (KES) */}
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      {item.customsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>

                    {/* Duty Applied Rule Flag */}
                    <td className="py-3 px-2 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        item.dutyRuleApplied === 'ad_valorem'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.dutyRuleApplied === 'ad_valorem' ? 'Ad-Valorem' : 'Specific Duty'}
                      </span>
                      <span className="font-mono text-[10.5px] block font-bold text-slate-900 mt-0.5">
                        KSh {item.dutyAppliedKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>

                    {/* Total Landed Cost (KES) */}
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      KSh {item.totalLandedCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>

                    {/* Unit Landed Cost Incl VAT */}
                    <td className="py-3 px-3 text-right bg-rose-50/70 font-mono font-black text-rose-700 text-xs">
                      KSh {item.landedCostPerUnit.toFixed(2)}
                      <span className="text-[9.5px] font-normal text-rose-500 block">
                        /{isFabric ? 'm' : 'kg'}
                      </span>
                    </td>

                    {/* Unit Landed Cost Excl VAT */}
                    <td className="py-3 px-3 text-right bg-emerald-50/70 font-mono font-black text-emerald-800 text-xs">
                      KSh {item.landedCostPerUnitExclVat.toFixed(2)}
                      <span className="text-[9.5px] font-bold text-emerald-600 block">
                        Capitalized /{isFabric ? 'm' : 'kg'}
                      </span>
                    </td>

                    {/* Suggested Retail & Margin */}
                    <td className="py-3 px-2 text-right">
                      <span className="font-mono font-bold text-slate-900">
                        KSh {Math.round(item.suggestedRetailPrice)}
                      </span>
                      <span className="text-[9.5px] text-emerald-600 font-bold block">
                        +KSh {Math.round(item.projectedGrossProfitPerUnit)} ({activeShipment.targetMarkupPct}%)
                      </span>
                    </td>

                    {/* Catalog Product Batch Link */}
                    <td className="py-3 px-2 text-center">
                      <select
                        value={item.matchedProductId || ''}
                        onChange={e => handleUpdateLineItem(item.id, { matchedProductId: e.target.value })}
                        className="text-[10.5px] font-medium px-2 py-1 rounded border border-slate-200 bg-white max-w-[110px]"
                      >
                        <option value="">-- Link SKU --</option>
                        {products
                          .filter(p => p.category === item.category)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} ({p.name})
                            </option>
                          ))}
                      </select>
                    </td>

                    {/* Remove Action */}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* TAB 2: 3-WAY WEIGHT MATCHING & SUPPLIER DEBIT NOTES */}
      {activeAccountantTab === 'three_way_matcher' && (
        <ThreeWayWeightMatchingTab shipment={activeShipment} />
      )}

      {/* TAB 3: KRA VAT-3 NET RETURN & iTAX FILING PACK */}
      {activeAccountantTab === 'kra_vat3' && (
        <KRAVat3ReconcilerTab />
      )}

      {/* TAB 4: MONTH-END "CLOSE THE BOOKS" FAST-TRACK */}
      {activeAccountantTab === 'month_end' && (
        <MonthEndFastTrackWizard />
      )}

      {/* Approve & Capitalize Modal */}
      {isCapitalizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Capitalize Landed Inventory to General Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verification against KRA e-Slip Ref: {activeShipment.kraEslipRef}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCapitalizeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p>
                This action will automatically generate and commit double-entry journal entries to the <strong>General Ledger</strong> and capitalize the inventory cost down to individual units:
              </p>

              {/* Journal Voucher Preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1 font-bold text-slate-900">
                  <span>Account &amp; Classification</span>
                  <span>Debit / (Credit) KES</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Dr: 1200 - Inventory Asset (Imported Stock)</span>
                  <span className="font-bold text-emerald-700">
                    +KSh {(costingSummary.totalLandedInventoryKES - costingSummary.totalVAT1202KES).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Dr: 1410 - KRA Input VAT Receivable (1202 Claim)</span>
                  <span className="font-bold text-rose-700">
                    +KSh {costingSummary.totalVAT1202KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Cr: 2010 - Accounts Payable (Overseas Supplier)</span>
                  <span className="font-bold text-slate-700">
                    (KSh {((costingSummary.totalFOB_USD + costingSummary.totalFreightUSD + activeShipment.cocFeesUSD) * effectiveExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Cr: 2120 - KRA Customs Duties &amp; Taxes Payable</span>
                  <span className="font-bold text-slate-700">
                    (KSh {costingSummary.totalKRATaxesKES.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11.5px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Linked product batches in the catalog will have their <strong>Internal Cost Price</strong> and <strong>Suggested Retail Price</strong> automatically synchronized to the computed Landed Cost per Metre / Landed Cost per KG.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCapitalizeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleApproveAndCapitalize();
                  setIsCapitalizeModalOpen(false);
                }}
                disabled={isCapitalizing}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                {isCapitalizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Posting to Ledger...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Capitalize to Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Document Parser Modal */}
      {isOCRModalOpen && (
        <DocumentOCRParserModal
          isOpen={isOCRModalOpen}
          onClose={() => setIsOCRModalOpen(false)}
          onApplyParsedData={(extracted) => {
            setActiveShipment(prev => ({
              ...prev,
              supplierName: extracted.supplierName || prev.supplierName,
              supplierCountry: extracted.supplierCountry || prev.supplierCountry,
              invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
              customsEntryNo: extracted.customsEntryNo || prev.customsEntryNo,
              kraEslipRef: extracted.kraEslipRef || prev.kraEslipRef,
              exchangeRate: extracted.exchangeRate || prev.exchangeRate,
              lineItems: extracted.lineItems && extracted.lineItems.length > 0 ? extracted.lineItems : prev.lineItems
            }));
            setIsOCRModalOpen(false);
          }}
        />
      )}

      {/* Supplier Registry Management Modal */}
      <SupplierDirectoryModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSelectSupplierForInvoice={(sup) => {
          setSelectedSupplierForInvoice(sup);
          setIsInwardInvoiceModalOpen(true);
        }}
      />

      {/* Clearing & Forwarding Agents Master Directory Modal */}
      <ClearingAgentDirectoryModal
        isOpen={isClearingAgentModalOpen}
        onClose={() => setIsClearingAgentModalOpen(false)}
        onSelectClearingAgent={(agent) => {
          setActiveShipment(prev => ({
            ...prev,
            declarantName: agent.name,
            declarantPin: agent.kraPin,
            portClearingFeesKES: (agent.standardAgencyFeeKES || 35000) + (agent.cfsPortWharfageKES || 65000)
          }));
          setIsClearingAgentModalOpen(false);
        }}
      />

      {/* Inward Consignment & Commercial Invoice Intake Wizard Modal */}
      <InwardInvoiceIntakeModal
        isOpen={isInwardInvoiceModalOpen}
        onClose={() => {
          setIsInwardInvoiceModalOpen(false);
          setSelectedSupplierForInvoice(undefined);
        }}
        preselectedSupplier={selectedSupplierForInvoice}
      />
    </div>
  );
};
