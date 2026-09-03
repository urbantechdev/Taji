import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Supplier,
  CategoryType,
  UnitType,
  LocationId,
  ImportShipmentRecord,
  ImportShipmentLineItem,
  LocalPurchaseRecord,
  LocalPurchaseLineItem,
  ProductBatch
} from '../../types';
import { calculateImportShipmentCosting } from '../../utils/importCostingEngine';
import { calculateLocalPurchaseCosting } from '../../utils/localPurchaseCostingEngine';
import {
  FileText,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  X,
  Globe2,
  ShieldCheck,
  Scale,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  Truck,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface InwardInvoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplier?: Supplier;
  onOpenCostingSuite?: (record: ImportShipmentRecord | LocalPurchaseRecord, type: 'import' | 'local') => void;
}

interface NewLineDraft {
  id: string;
  isExistingCatalogProduct: boolean;
  matchedProductId?: string;
  name: string;
  sku: string;
  category: CategoryType;
  subCategory: string;
  fiberComposition: string;
  colorName: string;
  colorHex: string;
  unit: UnitType;
  quantity: number; // kg for yarns or meters for fabrics
  grossWeightKg?: number;
  unitPriceUSD: number; // For imports (FOB USD/kg or unit)
  unitPriceKES: number; // For domestic (KES/m or unit)
  hsCode: string;
  rollsCount?: number;
}

export const InwardInvoiceIntakeModal: React.FC<InwardInvoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplier,
  onOpenCostingSuite
}) => {
  const {
    suppliers,
    products,
    locations,
    activeLocation,
    currentUser,
    addProductBatch,
    updateProductBatch,
    addLedgerEntry
  } = useERP();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Invoice Header
  const [supplyType, setSupplyType] = useState<'import' | 'local'>('import');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    preselectedSupplier?.id || (suppliers.length > 0 ? suppliers[0].id : '')
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customsOrEtimsRef, setCustomsOrEtimsRef] = useState<string>('26EMKIM' + Math.floor(100000000 + Math.random() * 900000000));
  const [kraEslipRef, setKraEslipRef] = useState<string>('102026' + Math.floor(1000000000 + Math.random() * 9000000000));
  const [destinationLocation, setDestinationLocation] = useState<LocationId>('main_store');
  const [exchangeRate, setExchangeRate] = useState<number>(129.38999);
  const [totalFreightUSD, setTotalFreightUSD] = useState<number>(2400);
  const [totalInsuranceUSD, setTotalInsuranceUSD] = useState<number>(12.50);
  const [cocFeesUSD, setCocFeesUSD] = useState<number>(600);
  const [portClearingFeesKES, setPortClearingFeesKES] = useState<number>(120000);
  const [localFreightKES, setLocalFreightKES] = useState<number>(45000);
  const [targetMarkupPct, setTargetMarkupPct] = useState<number>(35);

  // Step 2: Line items under this invoice
  const [draftItems, setDraftItems] = useState<NewLineDraft[]>([
    {
      id: 'draft-1',
      isExistingCatalogProduct: false,
      name: 'Polyester Heavy Special Derek Weave',
      sku: 'TFX-DRK-NEW',
      category: 'Dereck',
      subCategory: 'Heavy Dereck Weave 150CM',
      fiberComposition: '100% Polyester High Density',
      colorName: 'Royal Navy Blue',
      colorHex: '#1E3A8A',
      unit: 'meter',
      quantity: 5000,
      grossWeightKg: 5200,
      unitPriceUSD: 2.15,
      unitPriceKES: 260,
      hsCode: '6006.32.00',
      rollsCount: 100
    }
  ]);

  // Step 3: Submission & Status
  const [isCapitalizing, setIsCapitalizing] = useState(false);
  const [capitalizationResult, setCapitalizationResult] = useState<{
    journalRef: string;
    itemsOnboarded: number;
    totalLandedCostKES: number;
    vatClaimedKES: number;
  } | null>(null);

  if (!isOpen) return null;

  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  // Auto-switch supply type if supplier classification differs
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      if (sup.type === 'overseas_import') {
        setSupplyType('import');
      } else {
        setSupplyType('local');
      }
    }
  };

  // Convert drafts to ImportShipmentLineItem for costing engine calculation
  const calculatedImportSummary = useMemo(() => {
    if (supplyType !== 'import') return null;

    const importItems: ImportShipmentLineItem[] = draftItems.map(d => ({
      id: d.id,
      description: d.name,
      category: d.category,
      hsCode: d.hsCode || '6006.32.00',
      fobUSD: (Number(d.quantity) || 0) * (Number(d.unitPriceUSD) || 0),
      netWeightKg: Number(d.quantity) || 0,
      grossWeightKg: Number(d.grossWeightKg) || Number(d.quantity) || 0,
      matchedProductId: d.isExistingCatalogProduct ? d.matchedProductId : undefined,
      sku: d.sku,
      subCategory: d.subCategory,
      colorName: d.colorName,
      colorHex: d.colorHex,
      unit: d.unit
    }));

    return calculateImportShipmentCosting(
      {
        exchangeRate,
        specificDutyRatePerTonne: 97500,
        adValoremRatePct: 25,
        idfRatePct: 2.5,
        rdlRatePct: 2.0,
        vatRatePct: 16,
        mssLevyUSDRatePerTonne: 1.75,
        cocFeesUSD,
        totalFreightUSD,
        totalInsuranceUSD,
        portClearingFeesKES,
        targetMarkupPct
      },
      importItems
    );
  }, [supplyType, draftItems, exchangeRate, totalFreightUSD, totalInsuranceUSD, cocFeesUSD, portClearingFeesKES, targetMarkupPct]);

  // Convert drafts to LocalPurchaseLineItem for local costing engine
  const calculatedLocalSummary = useMemo(() => {
    if (supplyType !== 'local') return null;

    const localItems: LocalPurchaseLineItem[] = draftItems.map(d => ({
      id: d.id,
      description: d.name,
      category: (d.category as any) || 'Heavy Drill',
      quantity: Number(d.quantity) || 0,
      unit: d.unit,
      netUnitPriceKES: Number(d.unitPriceKES) || 0,
      vatRatePct: 16,
      rollsCount: d.rollsCount,
      colorName: d.colorName,
      colorHex: d.colorHex,
      subCategory: d.subCategory,
      matchedProductId: d.isExistingCatalogProduct ? d.matchedProductId : undefined,
      sku: d.sku
    }));

    return calculateLocalPurchaseCosting({
      id: `LPS-${Date.now()}`,
      purchaseOrderNo: `PO-${Date.now().toString().slice(-6)}`,
      invoiceNumber: invoiceNumber || 'INV-DRAFT',
      invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
      supplierName: currentSupplier?.name || 'Domestic Mill Supplier',
      supplierPin: currentSupplier?.kraPin || 'P000000000Z',
      supplierCity: currentSupplier?.address || currentSupplier?.country || 'Nairobi',
      destinationLocationId: destinationLocation,
      paymentTerms: '30 Days Credit',
      withholdingVatEnabled: true,
      localFreightKES,
      localHandlingKES: 15000,
      inspectionTestingKES: 5000,
      targetMarkupPct,
      status: 'draft',
      lineItems: localItems
    });
  }, [supplyType, draftItems, localFreightKES, targetMarkupPct]);

  // Add Item to draft
  const handleAddDraftItem = () => {
    playClickSound();
    const newId = `draft-${Date.now()}`;
    setDraftItems(prev => [
      ...prev,
      {
        id: newId,
        isExistingCatalogProduct: false,
        name: 'New Textile Line Item',
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        category: 'Dereck',
        subCategory: 'Standard Grade',
        fiberComposition: '100% Synthetic',
        colorName: 'Slate Grey',
        colorHex: '#64748B',
        unit: 'meter',
        quantity: 1000,
        grossWeightKg: 1050,
        unitPriceUSD: 2.00,
        unitPriceKES: 250,
        hsCode: '6006.32.00',
        rollsCount: 20
      }
    ]);
  };

  const handleRemoveDraftItem = (id: string) => {
    if (draftItems.length <= 1) {
      alert('An invoice must contain at least 1 line item.');
      return;
    }
    playClickSound();
    setDraftItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateDraft = (id: string, updates: Partial<NewLineDraft>) => {
    setDraftItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If selected existing product, auto-fill details
          if (updates.matchedProductId && updates.matchedProductId !== item.matchedProductId) {
            const prod = products.find(p => p.id === updates.matchedProductId);
            if (prod) {
              updated.name = prod.name;
              updated.sku = prod.sku;
              updated.category = prod.category;
              updated.subCategory = prod.subCategory || prod.category;
              updated.fiberComposition = prod.fiberComposition || '';
              updated.colorName = prod.colorName;
              updated.colorHex = prod.colorHex;
              updated.unit = prod.unit;
              updated.unitPriceKES = prod.costPrice || 250;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Capitalize directly to both Inventory Catalog & General Ledger
  const handleApproveAndCapitalize = async () => {
    setIsCapitalizing(true);

    try {
      const journalRef = `JRN-INV-${invoiceNumber}-${Date.now().toString().slice(-4)}`;
      let totalLandedCost = 0;
      let totalVatClaim = 0;
      let onboardedCount = 0;

      if (supplyType === 'import' && calculatedImportSummary) {
        totalLandedCost = calculatedImportSummary.totalLandedInventoryKES - calculatedImportSummary.totalVAT1202KES;
        totalVatClaim = calculatedImportSummary.totalVAT1202KES;

        // 1. Post Debit to Inventory Asset
        addLedgerEntry({
          transactionRef: journalRef,
          description: `Import Landed Inventory Capitalization - Invoice ${invoiceNumber} | Entry ${customsOrEtimsRef} (${currentSupplier?.name})`,
          debitAccount: '1200 - Inventory Asset (Imported Fabrics & Yarns Capitalized)',
          creditAccount: '2010 - Accounts Payable (Overseas Supplier Clearing)',
          amount: totalLandedCost,
          locationId: destinationLocation,
          category: 'Import Landed Costing Capitalization'
        });

        // 2. Post Debit to KRA Input VAT
        addLedgerEntry({
          transactionRef: journalRef,
          description: `KRA 1202 Import VAT Input Tax Claim - E-Slip ${kraEslipRef} | Invoice ${invoiceNumber}`,
          debitAccount: '1410 - KRA Input VAT Receivable (Import VAT 1202)',
          creditAccount: '2120 - KRA Customs Taxes & Duties Clearing',
          amount: totalVatClaim,
          locationId: destinationLocation,
          category: 'Tax VAT'
        });

        // 3. Post Customs Duties to KRA Clearing
        addLedgerEntry({
          transactionRef: journalRef,
          description: `KRA Customs Duty & Statutory Levies (1002, 1801 IDF, 6001 RDL, 6401 MSS) - E-Slip ${kraEslipRef}`,
          debitAccount: '2120 - KRA Customs Taxes & Duties Clearing',
          creditAccount: '1010 - Bank / KRA e-Payment Account',
          amount: calculatedImportSummary.totalKRATaxesKES,
          locationId: destinationLocation,
          category: 'Tax Settlement'
        });

        // 4. Onboard items into Inventory Catalog!
        for (let i = 0; i < calculatedImportSummary.items.length; i++) {
          const comp = calculatedImportSummary.items[i];
          const draft = draftItems[i];
          const unitLanded = comp.landedCostPerUnitExclVat > 0 ? Math.round(comp.landedCostPerUnitExclVat * 100) / 100 : comp.landedCostPerUnit;
          const unitRetail = Math.round(comp.suggestedRetailPrice);
          const receivedQty = comp.fabricLengthMetres && comp.fabricLengthMetres > 0 ? comp.fabricLengthMetres : comp.netWeightKg;

          if (draft.isExistingCatalogProduct && draft.matchedProductId) {
            const existing = products.find(p => p.id === draft.matchedProductId);
            if (existing) {
              const currentStock = Number(existing.locationStock[destinationLocation]) || 0;
              await updateProductBatch(existing.id, {
                costPrice: unitLanded,
                unitPriceRetail: unitRetail,
                locationStock: {
                  ...existing.locationStock,
                  [destinationLocation]: currentStock + receivedQty
                }
              });
              onboardedCount++;
            }
          } else {
            // Create brand new product in catalog
            await addProductBatch({
              sku: draft.sku || `SKU-${Date.now().toString().slice(-6)}`,
              name: draft.name,
              category: draft.category,
              subCategory: draft.subCategory || 'Imported Grade',
              fiberComposition: draft.fiberComposition || '100% Fabric',
              colorName: draft.colorName || 'Natural',
              colorHex: draft.colorHex || '#1E3A8A',
              unit: draft.unit || 'meter',
              unitPriceRetail: unitRetail,
              unitPriceBulk: Math.round(unitRetail * 0.95),
              costPrice: unitLanded,
              locationStock: {
                [destinationLocation]: receivedQty
              },
              minReorderLevel: 50,
              countryOfOrigin: currentSupplier?.country || 'China',
              manufacturer: currentSupplier?.name || 'Overseas Mill',
              grossWeightKg: comp.grossWeightKg,
              netWeightKg: comp.netWeightKg
            });
            onboardedCount++;
          }
        }
      } else if (supplyType === 'local' && calculatedLocalSummary) {
        totalLandedCost = calculatedLocalSummary.totalCapitalizedInventoryCostKES;
        totalVatClaim = calculatedLocalSummary.totalVat16KES;

        // 1. Post Debit to Inventory Asset
        addLedgerEntry({
          transactionRef: journalRef,
          description: `Local Purchase Supply Capitalization - eTIMS Inv ${invoiceNumber} | ${currentSupplier?.name}`,
          debitAccount: '1200 - Inventory Asset (Domestic Fabrics & Raw Materials)',
          creditAccount: '2010 - Accounts Payable (Local Kenyan Suppliers)',
          amount: totalLandedCost,
          locationId: destinationLocation,
          category: 'Local Purchase Capitalization'
        });

        // 2. Post Debit to KRA eTIMS Input VAT
        addLedgerEntry({
          transactionRef: journalRef,
          description: `KRA 16% Input VAT Claimable - eTIMS CU Ref ${customsOrEtimsRef} (${currentSupplier?.name} PIN ${currentSupplier?.kraPin || 'N/A'})`,
          debitAccount: '1410 - KRA Input VAT Receivable (eTIMS Certified)',
          creditAccount: '2010 - Accounts Payable (Local Kenyan Suppliers)',
          amount: totalVatClaim,
          locationId: destinationLocation,
          category: 'Tax VAT'
        });

        // 3. Onboard items into Inventory Catalog!
        for (let i = 0; i < calculatedLocalSummary.items.length; i++) {
          const comp = calculatedLocalSummary.items[i];
          const draft = draftItems[i];
          const unitLanded = Math.round(comp.unitLandedCostKES * 100) / 100;
          const unitRetail = Math.round(comp.suggestedRetailPriceKES || unitLanded * 1.35);
          const receivedQty = comp.quantity;

          if (draft.isExistingCatalogProduct && draft.matchedProductId) {
            const existing = products.find(p => p.id === draft.matchedProductId);
            if (existing) {
              const currentStock = Number(existing.locationStock[destinationLocation]) || 0;
              await updateProductBatch(existing.id, {
                costPrice: unitLanded,
                unitPriceRetail: unitRetail,
                locationStock: {
                  ...existing.locationStock,
                  [destinationLocation]: currentStock + receivedQty
                }
              });
              onboardedCount++;
            }
          } else {
            // Create brand new product in catalog
            await addProductBatch({
              sku: draft.sku || `LPS-${Date.now().toString().slice(-6)}`,
              name: draft.name,
              category: draft.category,
              subCategory: draft.subCategory || 'Local Mill Woven',
              fiberComposition: draft.fiberComposition || '100% Cotton Drill',
              colorName: draft.colorName || 'Bleached White',
              colorHex: draft.colorHex || '#F8FAFC',
              unit: draft.unit || 'meter',
              unitPriceRetail: unitRetail,
              unitPriceBulk: Math.round(unitRetail * 0.95),
              costPrice: unitLanded,
              locationStock: {
                [destinationLocation]: receivedQty
              },
              minReorderLevel: 50,
              countryOfOrigin: 'Kenya',
              manufacturer: currentSupplier?.name || 'Kenyan Mill',
              netWeightKg: receivedQty
            });
            onboardedCount++;
          }
        }
      }

      playSuccessSound();
      setCapitalizationResult({
        journalRef,
        itemsOnboarded: onboardedCount,
        totalLandedCostKES: totalLandedCost,
        vatClaimedKES: totalVatClaim
      });
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Failed to capitalize inward consignment:', err);
      alert('Error capitalizing consignment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCapitalizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Inward Consignment &amp; Invoice Intake Wizard
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400">
                  Step {currentStep} of 3
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create invoice header, onboard inventory items, and blend directly with double-entry accounting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950 text-xs font-bold shrink-0">
          <div
            className={`p-3 text-center border-r border-slate-800 flex items-center justify-center gap-2 ${
              currentStep === 1
                ? 'bg-rose-500/10 text-rose-400 border-b-2 border-b-rose-500'
                : currentStep > 1
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">1</span>
            <span>1. Invoice &amp; Supplier Header</span>
          </div>

          <div
            className={`p-3 text-center border-r border-slate-800 flex items-center justify-center gap-2 ${
              currentStep === 2
                ? 'bg-rose-500/10 text-rose-400 border-b-2 border-b-rose-500'
                : currentStep > 2
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">2</span>
            <span>2. Onboard Line Items &amp; Landed Cost</span>
          </div>

          <div
            className={`p-3 text-center flex items-center justify-center gap-2 ${
              currentStep === 3
                ? 'bg-rose-500/10 text-rose-400 border-b-2 border-b-rose-500'
                : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">3</span>
            <span>3. Capitalize &amp; Push to Ledger</span>
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Invoice Header */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Type selector */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Select Consignment Channel:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSupplyType('import');
                    }}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      supplyType === 'import'
                        ? 'bg-sky-500/10 border-sky-500 text-white ring-1 ring-sky-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                      <Globe2 className="w-4 h-4" />
                      <span>Overseas Import Consignment (IPS)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Commercial Invoice in USD, Customs SAD Entry, Mombasa Port CFS &amp; KRA EAC CET import duties.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSupplyType('local');
                    }}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      supplyType === 'local'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Kenyan Domestic Supply (LPS)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      KRA eTIMS Tax Invoices in KES, 16% Input VAT claim, and domestic factory transport.
                    </p>
                  </button>
                </div>
              </div>

              {/* Header Fields */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Invoice &amp; Declarant Metadata
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Supplier Organization *
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => handleSupplierChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.country} • {sup.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Commercial Invoice Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      {supplyType === 'import' ? 'Customs Entry / SAD No.' : 'eTIMS CU Invoice Number'}
                    </label>
                    <input
                      type="text"
                      value={customsOrEtimsRef}
                      onChange={e => setCustomsOrEtimsRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {supplyType === 'import' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        KRA E-Slip / PRN Ref No.
                      </label>
                      <input
                        type="text"
                        value={kraEslipRef}
                        onChange={e => setKraEslipRef(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Destination Store / Warehouse *
                    </label>
                    <select
                      value={destinationLocation}
                      onChange={e => setDestinationLocation(e.target.value as LocationId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Logistics & Cost Parameters */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Landed Cost Allocation Parameters
                </h3>

                {supplyType === 'import' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Exchange Rate (USD/KES)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={exchangeRate}
                        onChange={e => setExchangeRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Freight (USD)
                      </label>
                      <input
                        type="number"
                        value={totalFreightUSD}
                        onChange={e => setTotalFreightUSD(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        CoC Fees (USD)
                      </label>
                      <input
                        type="number"
                        value={cocFeesUSD}
                        onChange={e => setCocFeesUSD(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Port Clearing (KES)
                      </label>
                      <input
                        type="number"
                        value={portClearingFeesKES}
                        onChange={e => setPortClearingFeesKES(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Target Markup %
                      </label>
                      <input
                        type="number"
                        value={targetMarkupPct}
                        onChange={e => setTargetMarkupPct(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Local Trucking Freight (KES)
                      </label>
                      <input
                        type="number"
                        value={localFreightKES}
                        onChange={e => setLocalFreightKES(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Offloading &amp; Handling (KES)
                      </label>
                      <input
                        type="number"
                        defaultValue={15000}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Target Markup %
                      </label>
                      <input
                        type="number"
                        value={targetMarkupPct}
                        onChange={e => setTargetMarkupPct(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Onboard Inventory Items */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Inventory Items Invoiced under {invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add batches to be received. You can link existing catalog items or define brand new SKUs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftItem}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Item to Invoice</span>
                </button>
              </div>

              {draftItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-white">
                        {item.name || 'Untitled Line Item'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isExistingCatalogProduct}
                          onChange={e =>
                            handleUpdateDraft(item.id, {
                              isExistingCatalogProduct: e.target.checked
                            })
                          }
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Link to Existing Catalog SKU</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.isExistingCatalogProduct ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Select Existing Product from Catalog
                      </label>
                      <select
                        value={item.matchedProductId || ''}
                        onChange={e => handleUpdateDraft(item.id, { matchedProductId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku} • {p.category} • {p.colorName}) - Current Cost: KSh {p.costPrice}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateDraft(item.id, { name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          New SKU / Barcode *
                        </label>
                        <input
                          type="text"
                          value={item.sku}
                          onChange={e => handleUpdateDraft(item.id, { sku: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Category *
                        </label>
                        <select
                          value={item.category}
                          onChange={e => handleUpdateDraft(item.id, { category: e.target.value as CategoryType })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="Dereck">Dereck</option>
                          <option value="Fleece">Fleece</option>
                          <option value="Single Jersey">Single Jersey</option>
                          <option value="Interlock">Interlock</option>
                          <option value="Acrylic Yarn">Acrylic Yarn</option>
                          <option value="Cotton Yarn">Cotton Yarn</option>
                          <option value="Raw Materials">Raw Materials</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Unit Cost */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Invoiced Qty ({item.unit}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleUpdateDraft(item.id, { quantity: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={e => handleUpdateDraft(item.id, { unit: e.target.value as UnitType })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="meter">Meters (m)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="yard">Yards</option>
                        <option value="piece">Pieces</option>
                      </select>
                    </div>

                    {supplyType === 'import' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          FOB Unit Price ($ USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPriceUSD}
                          onChange={e => handleUpdateDraft(item.id, { unitPriceUSD: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Net Unit Price (KSh KES) *
                        </label>
                        <input
                          type="number"
                          value={item.unitPriceKES}
                          onChange={e => handleUpdateDraft(item.id, { unitPriceKES: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Color / Shade
                      </label>
                      <input
                        type="text"
                        value={item.colorName}
                        onChange={e => handleUpdateDraft(item.id, { colorName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Gross Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={item.grossWeightKg || item.quantity}
                        onChange={e => handleUpdateDraft(item.id, { grossWeightKg: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Review & Blend with Accounting */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {capitalizationResult ? (
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Consignment Successfully Capitalized &amp; Onboarded!
                  </h3>
                  <p className="text-xs text-emerald-300 max-w-lg mx-auto">
                    Stock has been loaded into <span className="font-bold text-white">{destinationLocation}</span> at its true calculated landed cost basis, and double-entry General Ledger vouchers have posted.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Journal Ref</div>
                      <div className="text-xs font-mono font-bold text-emerald-300 mt-1">{capitalizationResult.journalRef}</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Items Onboarded</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">{capitalizationResult.itemsOnboarded} Batches</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Capitalized Asset</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">KSh {Math.round(capitalizationResult.totalLandedCostKES).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Input VAT Claimed</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-1">KSh {Math.round(capitalizationResult.vatClaimedKES).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Close &amp; View Catalog
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Financial Summary Box */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center justify-between">
                      <span>Accounting Balance Sheet &amp; Landed Costing Impact</span>
                      <span className="text-slate-400 font-mono normal-case">Invoice: {invoiceNumber}</span>
                    </h3>

                    {supplyType === 'import' && calculatedImportSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Total FOB Value</div>
                          <div className="text-sm font-mono font-bold text-sky-300 mt-1">
                            ${calculatedImportSummary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            KSh {Math.round(calculatedImportSummary.totalFOB_USD * exchangeRate).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Total KRA Taxes</div>
                          <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                            KSh {Math.round(calculatedImportSummary.totalKRATaxesKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Duty, IDF, RDL, VAT 1202
                          </div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">KRA Input VAT (16%)</div>
                          <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                            KSh {Math.round(calculatedImportSummary.totalVAT1202KES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Claimable in VAT-3 Return
                          </div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Total Landed Inventory</div>
                          <div className="text-sm font-mono font-bold text-white mt-1">
                            KSh {Math.round(calculatedImportSummary.totalLandedInventoryKES - calculatedImportSummary.totalVAT1202KES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Debited to Asset 1200
                          </div>
                        </div>
                      </div>
                    )}

                    {supplyType === 'local' && calculatedLocalSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Net Purchases</div>
                          <div className="text-sm font-mono font-bold text-sky-300 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalNetPurchaseKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Excl. 16% VAT</div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">16% Input VAT</div>
                          <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalVat16KES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">eTIMS claimable</div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Logistics Add-ons</div>
                          <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalLogisticsAddOnsKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Trucking &amp; Handling</div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Capitalized Asset</div>
                          <div className="text-sm font-mono font-bold text-white mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalCapitalizedInventoryCostKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Debited to Asset 1200</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Onboarding preview */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Line Item Landed Unit Costs &amp; Stock Routing
                    </h3>

                    <div className="divide-y divide-slate-800">
                      {draftItems.map((item, idx) => {
                        const compImport = calculatedImportSummary?.items[idx];
                        const compLocal = calculatedLocalSummary?.items[idx];
                        const landedUnitCost = compImport
                          ? Math.round(compImport.landedCostPerUnitExclVat)
                          : compLocal
                          ? Math.round(compLocal.unitLandedCostKES)
                          : 0;
                        const suggestedRetail = compImport
                          ? Math.round(compImport.suggestedRetailPrice)
                          : compLocal
                          ? Math.round(compLocal.suggestedRetailPriceKES || landedUnitCost * 1.35)
                          : 0;

                        return (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white">{item.name}</span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                SKU: <span className="font-mono text-slate-300">{item.sku}</span> • Onboarding{' '}
                                <span className="text-white font-bold">{item.quantity.toLocaleString()} {item.unit}</span> into{' '}
                                <span className="text-rose-400 font-bold">{destinationLocation}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-400">
                                Landed Cost: KSh {landedUnitCost.toLocaleString()}/{item.unit}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Suggested Retail: KSh {suggestedRetail.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && !capitalizationResult && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 3 && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setCurrentStep((currentStep + 1) as any);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && !capitalizationResult && (
              <button
                type="button"
                disabled={isCapitalizing}
                onClick={handleApproveAndCapitalize}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCapitalizing ? 'Posting & Capitalizing...' : 'Approve & Capitalize to Catalog + GL'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default InwardInvoiceIntakeModal;
