import React, { useState, useMemo, useEffect } from 'react';
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
  ProductBatch,
  DeliveryRecord,
  InwardInvoiceRecord
} from '../../types';
import {
  calculateImportShipmentCosting,
  PRESET_INVOICE_26PA222,
  PRESET_SAD_26EMKIM400968589,
  PRESET_SAD_UDEY_UDYOG,
  PRESET_FLEECE_CONTAINER
} from '../../utils/importCostingEngine';
import {
  calculateLocalPurchaseCosting,
  PRESET_LPS_RIVATEX
} from '../../utils/localPurchaseCostingEngine';
import { MILL_SHADE_CATALOG } from '../../utils/textileShadeEngine';
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
  ChevronLeft,
  Lock,
  Unlock,
  ShieldAlert,
  FileCheck,
  Ship,
  Barcode,
  Boxes,
  Save,
  Clock,
  User,
  RotateCcw
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';
import {
  saveInwardInvoiceDraft,
  getInwardInvoiceDraft,
  clearInwardInvoiceDraft,
  formatDraftTimeAgo
} from '../../utils/draftRecoveryEngine';

interface InwardInvoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplier?: Supplier;
  preselectedInvoice?: ImportShipmentRecord | LocalPurchaseRecord | DeliveryRecord | InwardInvoiceRecord;
  onOpenCostingSuite?: (record: ImportShipmentRecord | LocalPurchaseRecord, type: 'import' | 'local') => void;
  onStartUpdatingInventory?: (invoiceId: string, category?: string) => void;
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
  dyeLot?: string;
  shadeCode?: string;
  packagesCount?: number;
  packageDetails?: string;
  bagNumberRange?: string;
}

export const InwardInvoiceIntakeModal: React.FC<InwardInvoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplier,
  preselectedInvoice,
  onOpenCostingSuite,
  onStartUpdatingInventory
}) => {
  const {
    suppliers,
    products,
    locations,
    activeLocation,
    currentUser,
    addProductBatch,
    updateProductBatch,
    addLedgerEntry,
    deliveries = [],
    saveOrSyncInvoiceToInventory,
    openCategoryIntakeModal,
    inwardInvoices = [],
    saveInwardInvoice
  } = useERP();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editingInvoiceRecordId, setEditingInvoiceRecordId] = useState<string | null>(null);

  // Known shades collected from Mill Shade Catalog and existing inventory products
  const knownShades = useMemo(() => {
    const list: Array<{
      code: string;
      name: string;
      hex: string;
      category: string;
      defaultDyeLot?: string;
      description?: string;
      source: 'mill' | 'inventory';
    }> = [];
    const seen = new Set<string>();

    // 1. Mill Shade Catalog
    MILL_SHADE_CATALOG.forEach(s => {
      const codeUpper = s.code.trim().toUpperCase();
      if (!seen.has(codeUpper)) {
        seen.add(codeUpper);
        list.push({
          code: s.code,
          name: s.name,
          hex: s.hex || '#475569',
          category: s.category || 'All',
          defaultDyeLot: s.defaultDyeLot,
          description: s.description,
          source: 'mill'
        });
      }
    });

    // 2. Existing inventory products
    products.forEach(p => {
      const pCode = (p.shadeCode || '').trim();
      if (pCode && !seen.has(pCode.toUpperCase())) {
        seen.add(pCode.toUpperCase());
        list.push({
          code: pCode,
          name: p.color || p.name || pCode,
          hex: p.colorHex || '#475569',
          category: p.category || 'All',
          defaultDyeLot: p.dyeLot || p.sku,
          description: `${p.name} • SKU: ${p.sku}`,
          source: 'inventory'
        });
      }
    });

    return list;
  }, [products]);

  // Inward Invoice Selection & Store Lock Governance
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('custom');
  const [isStoreLockedByInvoice, setIsStoreLockedByInvoice] = useState<boolean>(false);
  const [storeLockOverridden, setStoreLockOverridden] = useState<boolean>(false);

  // Step 1: Invoice Header
  const [supplyType, setSupplyType] = useState<'import' | 'local'>('import');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    preselectedSupplier?.id || (suppliers.length > 0 ? suppliers[0].id : '')
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceCreatedAt, setInvoiceCreatedAt] = useState<string>('');
  const [invoiceCreatedBy, setInvoiceCreatedBy] = useState<string>('');
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

  // Session Recovery & Auto-save State
  const [recoveredDraftInfo, setRecoveredDraftInfo] = useState<{ savedAt: string; itemCount: number } | null>(null);
  const [isDraftAutosaved, setIsDraftAutosaved] = useState(false);

  // Auto-restore uncommitted draft when opening fresh
  useEffect(() => {
    if (isOpen && !preselectedInvoice && !editingInvoiceRecordId) {
      const saved = getInwardInvoiceDraft();
      if (saved && saved.draftItems && saved.draftItems.length > 0) {
        setSupplyType(saved.supplyType);
        if (saved.selectedSupplierId) setSelectedSupplierId(saved.selectedSupplierId);
        if (saved.invoiceNumber) setInvoiceNumber(saved.invoiceNumber);
        if (saved.invoiceDate) setInvoiceDate(saved.invoiceDate);
        if (saved.customsOrEtimsRef) setCustomsOrEtimsRef(saved.customsOrEtimsRef);
        if (saved.kraEslipRef) setKraEslipRef(saved.kraEslipRef);
        if (saved.destinationLocation) setDestinationLocation(saved.destinationLocation);
        if (saved.exchangeRate) setExchangeRate(saved.exchangeRate);
        if (saved.totalFreightUSD !== undefined) setTotalFreightUSD(saved.totalFreightUSD);
        if (saved.totalInsuranceUSD !== undefined) setTotalInsuranceUSD(saved.totalInsuranceUSD);
        if (saved.cocFeesUSD !== undefined) setCocFeesUSD(saved.cocFeesUSD);
        if (saved.portClearingFeesKES !== undefined) setPortClearingFeesKES(saved.portClearingFeesKES);
        if (saved.localFreightKES !== undefined) setLocalFreightKES(saved.localFreightKES);
        if (saved.targetMarkupPct !== undefined) setTargetMarkupPct(saved.targetMarkupPct);
        setDraftItems(saved.draftItems as NewLineDraft[]);
        if (saved.currentStep) setCurrentStep(saved.currentStep);
        if (saved.editingInvoiceRecordId) {
          setEditingInvoiceRecordId(saved.editingInvoiceRecordId);
          setSelectedInvoiceId(saved.editingInvoiceRecordId);
        }
        setRecoveredDraftInfo({
          savedAt: saved.savedAt,
          itemCount: saved.draftItems.length
        });
      }
    }
  }, [isOpen, preselectedInvoice]);

  // Background Auto-Save to localStorage
  useEffect(() => {
    if (!isOpen || isSaving || capitalizationResult) return;
    const timer = setTimeout(() => {
      if (draftItems.length > 0) {
        saveInwardInvoiceDraft({
          supplyType,
          selectedSupplierId,
          invoiceNumber,
          invoiceDate,
          customsOrEtimsRef,
          kraEslipRef,
          destinationLocation,
          exchangeRate,
          totalFreightUSD,
          totalInsuranceUSD,
          cocFeesUSD,
          portClearingFeesKES,
          localFreightKES,
          targetMarkupPct,
          draftItems,
          currentStep,
          editingInvoiceRecordId
        });
        setIsDraftAutosaved(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    isSaving,
    capitalizationResult,
    supplyType,
    selectedSupplierId,
    invoiceNumber,
    invoiceDate,
    customsOrEtimsRef,
    kraEslipRef,
    destinationLocation,
    exchangeRate,
    totalFreightUSD,
    totalInsuranceUSD,
    cocFeesUSD,
    portClearingFeesKES,
    localFreightKES,
    targetMarkupPct,
    draftItems,
    currentStep,
    editingInvoiceRecordId
  ]);

  const handleDiscardRecoveredDraft = () => {
    clearInwardInvoiceDraft();
    setRecoveredDraftInfo(null);
    setDraftItems([
      {
        id: `draft-${Date.now()}`,
        isExistingCatalogProduct: false,
        name: 'New Inward Line Item',
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        category: 'Yarns',
        subCategory: 'Standard Grade',
        fiberComposition: '100% ACRYLIC (HB) DYED YARN',
        colorName: 'Mix Grey',
        colorHex: '#94A3B8',
        unit: 'kg',
        quantity: 0,
        grossWeightKg: 0,
        unitPriceUSD: 0,
        unitPriceKES: 0
      }
    ]);
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomsOrEtimsRef('26EMKIM' + Math.floor(100000000 + Math.random() * 900000000));
    setKraEslipRef('102026' + Math.floor(1000000000 + Math.random() * 9000000000));
    setCurrentStep(1);
    setEditingInvoiceRecordId(null);
  };

  // Load preselectedInvoice prop if provided upon opening
  useEffect(() => {
    if (preselectedInvoice && isOpen) {
      applyInvoiceRecord(preselectedInvoice);
    }
  }, [preselectedInvoice, isOpen]);

  // Helper to load an invoice / shipment / delivery record and enforce store lock
  const applyInvoiceRecord = (record: ImportShipmentRecord | LocalPurchaseRecord | DeliveryRecord | InwardInvoiceRecord) => {
    // Check if it's an InwardInvoiceRecord
    if ('lineItems' in record && 'status' in record && 'supplyType' in record) {
      const inv = record as InwardInvoiceRecord;
      setEditingInvoiceRecordId(inv.id);
      setSelectedInvoiceId(inv.id);
      setSupplyType(inv.supplyType);
      setInvoiceNumber(inv.invoiceNumber);
      setInvoiceDate(inv.invoiceDate);
      setInvoiceCreatedAt(inv.createdAt || '');
      setInvoiceCreatedBy(inv.createdBy || '');
      setCustomsOrEtimsRef(inv.customsOrEtimsRef || '');
      setKraEslipRef(inv.kraEslipRef || '');
      setExchangeRate(inv.exchangeRate || 129.38999);
      setTotalFreightUSD(inv.totalFreightUSD || 0);
      setTotalInsuranceUSD(inv.totalInsuranceUSD || 0);
      setCocFeesUSD(inv.cocFeesUSD || 0);
      setPortClearingFeesKES(inv.portClearingFeesKES || 0);
      setLocalFreightKES(inv.localFreightKES || 0);
      setTargetMarkupPct(inv.targetMarkupPct || 35);

      const targetStore = (inv.destinationLocation as LocationId) || 'main_store';
      setDestinationLocation(targetStore);
      setIsStoreLockedByInvoice(true);
      setStoreLockOverridden(false);

      if (inv.supplierId) {
        setSelectedSupplierId(inv.supplierId);
      } else {
        const sup = suppliers.find(s => s.name.toLowerCase().includes(inv.supplierName.toLowerCase().slice(0, 8)));
        if (sup) setSelectedSupplierId(sup.id);
      }

      if (inv.lineItems && inv.lineItems.length > 0) {
        setDraftItems(inv.lineItems.map((li, idx) => ({
          id: li.id || `draft-${idx + 1}`,
          isExistingCatalogProduct: !!li.matchedProductId,
          matchedProductId: li.matchedProductId,
          name: li.name,
          sku: li.sku || `SKU-${Date.now().toString().slice(-4)}`,
          category: li.category,
          subCategory: li.subCategory || 'Standard Grade',
          fiberComposition: li.fiberComposition || '100% Synthetic',
          colorName: li.colorName || 'Standard',
          colorHex: li.colorHex || '#3B82F6',
          unit: li.unit,
          quantity: Number(li.quantity) || 0,
          grossWeightKg: li.grossWeightKg ? Number(li.grossWeightKg) : undefined,
          unitPriceUSD: Number(li.unitPriceUSD) || 0,
          unitPriceKES: Number(li.unitPriceKES) || 0,
          hsCode: li.hsCode || '',
          rollsCount: li.rollsCount ? Number(li.rollsCount) : undefined,
          dyeLot: li.dyeLot,
          shadeCode: li.shadeCode,
          packagesCount: li.packagesCount ? Number(li.packagesCount) : undefined,
          packageDetails: li.packageDetails,
          bagNumberRange: li.bagNumberRange
        })));
      }
      return;
    }

    if ('customsEntryNo' in record) {
      // ImportShipmentRecord
      setSupplyType('import');
      setSelectedInvoiceId(record.id || record.invoiceNumber);
      setInvoiceNumber(record.invoiceNumber);
      setInvoiceDate(record.invoiceDate);
      setCustomsOrEtimsRef(record.customsEntryNo);
      setKraEslipRef(record.kraEslipRef);
      setExchangeRate(record.exchangeRate);
      setTotalFreightUSD(record.totalFreightUSD);
      setTotalInsuranceUSD(record.totalInsuranceUSD);
      setCocFeesUSD(record.cocFeesUSD || 0);
      setPortClearingFeesKES(record.portClearingFeesKES);
      setTargetMarkupPct(record.targetMarkupPct);

      // Lock store to the invoice's destination store
      const targetStore = (record.destinationLocationId as LocationId) || 'main_store';
      setDestinationLocation(targetStore);
      setIsStoreLockedByInvoice(true);
      setStoreLockOverridden(false);

      // Match supplier if found
      const sup = suppliers.find(s => s.name.toLowerCase().includes(record.supplierName.toLowerCase().slice(0, 8)));
      if (sup) setSelectedSupplierId(sup.id);

      // Line items
      if (record.lineItems && record.lineItems.length > 0) {
        setDraftItems(record.lineItems.map((li, idx) => ({
          id: li.id || `draft-${idx + 1}`,
          isExistingCatalogProduct: !!li.matchedProductId,
          matchedProductId: li.matchedProductId,
          name: li.description,
          sku: (li as any).sku || `SKU-${li.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          category: li.category,
          subCategory: (li as any).subCategory || (li.category === 'Yarns' ? 'Machine Knitting Yarn 2/24 NM' : 'Imported Grade'),
          fiberComposition: li.category === 'Yarns' ? '100% High Bulk Acrylic Dyed Yarn' : '100% Synthetic',
          colorName: (li as any).colorName || 'Standard',
          colorHex: (li as any).colorHex || '#3B82F6',
          unit: (li as any).unit || (li.category === 'Yarns' ? 'kg' : 'meter'),
          quantity: (li as any).fabricLengthMetres || li.netWeightKg,
          grossWeightKg: li.grossWeightKg,
          unitPriceUSD: (li.fobUSD / (li.netWeightKg || 1)) || 2.10,
          unitPriceKES: Math.round((li.fobUSD / (li.netWeightKg || 1)) * record.exchangeRate),
          hsCode: li.hsCode,
          rollsCount: (li as any).rollsCount || (li as any).bagsCount || 50,
          dyeLot: (li as any).dyeLot,
          shadeCode: (li as any).shadeCode,
          packagesCount: (li as any).packagesCount || (li as any).bagsCount,
          packageDetails: (li as any).packageDetails,
          bagNumberRange: (li as any).bagNumberRange
        })));
      }
    } else if ('purchaseOrderNo' in record) {
      // LocalPurchaseRecord
      setSupplyType('local');
      setSelectedInvoiceId(record.id || record.invoiceNumber);
      setInvoiceNumber(record.invoiceNumber);
      setInvoiceDate(record.invoiceDate);
      setCustomsOrEtimsRef(record.etimsControlNo);
      setLocalFreightKES(record.localFreightKES || 0);
      setTargetMarkupPct(record.targetMarkupPct);

      // Lock store to the local purchase destination store
      const targetStore = (record.destinationLocationId as LocationId) || 'main_store';
      setDestinationLocation(targetStore);
      setIsStoreLockedByInvoice(true);
      setStoreLockOverridden(false);

      const sup = suppliers.find(s => s.name.toLowerCase().includes(record.supplierName.toLowerCase().slice(0, 8)));
      if (sup) setSelectedSupplierId(sup.id);

      if (record.lineItems && record.lineItems.length > 0) {
        setDraftItems(record.lineItems.map((li, idx) => ({
          id: li.id || `draft-lps-${idx + 1}`,
          isExistingCatalogProduct: !!li.matchedProductId,
          matchedProductId: li.matchedProductId,
          name: li.description,
          sku: `SKU-LPS-${Date.now().toString().slice(-4)}`,
          category: li.category as CategoryType,
          subCategory: 'Domestic Grade',
          fiberComposition: '100% Cotton / Blend',
          colorName: li.colorName || 'White',
          colorHex: '#FFFFFF',
          unit: li.unit,
          quantity: li.quantity,
          grossWeightKg: li.unit === 'kg' ? li.quantity : li.quantity * 0.3,
          unitPriceUSD: Math.round((li.netUnitPriceKES / exchangeRate) * 100) / 100,
          unitPriceKES: li.netUnitPriceKES,
          hsCode: '6006.22.00',
          rollsCount: li.rollsCount || 20
        })));
      }
    } else if ('consignmentNo' in record) {
      // DeliveryRecord
      setSelectedInvoiceId(`DEL-${record.id}`);
      setInvoiceNumber(record.consignmentNo);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDestinationLocation(record.destinationLocation);
      setIsStoreLockedByInvoice(true);
      setStoreLockOverridden(false);
      const sup = suppliers.find(s => s.name.toLowerCase().includes(record.supplierName.toLowerCase().slice(0, 8)));
      if (sup) setSelectedSupplierId(sup.id);
    }
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    playClickSound();

    if (id === 'custom') {
      setIsStoreLockedByInvoice(false);
      setStoreLockOverridden(false);
      setEditingInvoiceRecordId(null);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      return;
    }

    // Check saved inward invoices from Firestore
    const existingInward = inwardInvoices.find(inv => inv.id === id);
    if (existingInward) {
      applyInvoiceRecord(existingInward);
      return;
    }

    if (id === 'IMP-2026-PA222') {
      applyInvoiceRecord(PRESET_INVOICE_26PA222);
    } else if (id === 'SAD-26EMKIM400968589') {
      applyInvoiceRecord(PRESET_SAD_26EMKIM400968589);
    } else if (id === 'IMP-2026-UDEY-036' || id === 'IMP-2026-UDEY-028') {
      applyInvoiceRecord(PRESET_SAD_UDEY_UDYOG);
    } else if (id === 'IMP-2026-FLC-774') {
      applyInvoiceRecord(PRESET_FLEECE_CONTAINER);
    } else if (id === 'LPS-REC-2026-001') {
      applyInvoiceRecord(PRESET_LPS_RIVATEX);
    } else if (id.startsWith('DEL-')) {
      const delId = id.replace('DEL-', '');
      const del = deliveries.find(d => d.id === delId);
      if (del) applyInvoiceRecord(del);
    }
  };

  // Immediate Firestore database persistence for Inward Invoice
  const handleSaveInvoice = async (
    targetStatus?: 'draft' | 'pending_clearance' | 'assessed' | 'capitalized'
  ): Promise<InwardInvoiceRecord | null> => {
    if (!invoiceNumber.trim()) {
      alert('Please provide an Invoice Number before saving.');
      return null;
    }
    if (!selectedSupplierId) {
      alert('Please select a Supplier before saving.');
      return null;
    }

    setIsSaving(true);
    try {
      const totalQty = draftItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const primaryUnit = draftItems[0]?.unit || (supplyType === 'import' ? 'kg' : 'meter');
      const totalUSD = supplyType === 'import'
        ? draftItems.reduce((sum, it) => sum + ((Number(it.unitPriceUSD) || 0) * (Number(it.quantity) || 0)), 0)
        : 0;
      const totalKES = supplyType === 'import'
        ? Math.round(totalUSD * exchangeRate)
        : draftItems.reduce((sum, it) => sum + ((Number(it.unitPriceKES) || 0) * (Number(it.quantity) || 0)), 0);
      const totalRollsOrPkgs = draftItems.reduce((sum, it) => sum + (Number(it.rollsCount) || Number(it.packagesCount) || 0), 0);

      const existingInward = inwardInvoices.find(
        i => i.id === editingInvoiceRecordId ||
             (selectedInvoiceId !== 'custom' && i.id === selectedInvoiceId) ||
             i.invoiceNumber.trim().toLowerCase() === invoiceNumber.trim().toLowerCase()
      );

      const recordId = editingInvoiceRecordId || existingInward?.id || `INV-${supplyType.toUpperCase()}-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const statusToSave = targetStatus || existingInward?.status || (currentStep === 3 ? 'assessed' : 'draft');

      const invoiceRecord: InwardInvoiceRecord = {
        id: recordId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        supplyType,
        supplierId: selectedSupplierId,
        supplierName: currentSupplier?.name || 'Supplier',
        supplierCountry: currentSupplier?.country || (supplyType === 'import' ? 'Overseas' : 'Kenya'),
        supplierPin: currentSupplier?.kraPin,
        customsOrEtimsRef: customsOrEtimsRef.trim(),
        kraEslipRef: kraEslipRef.trim(),
        destinationLocation,
        exchangeRate,
        status: statusToSave,
        totalFreightUSD,
        totalInsuranceUSD,
        cocFeesUSD,
        portClearingFeesKES,
        localFreightKES,
        targetMarkupPct,
        totalAmountUSD: totalUSD,
        totalAmountKES: totalKES,
        totalQuantity: totalQty,
        totalQuantityUnit: primaryUnit,
        totalRollsOrPackages: totalRollsOrPkgs,
        lineItems: draftItems.map((d, idx) => ({
          id: d.id || `li-${idx + 1}`,
          name: d.name,
          sku: d.sku,
          category: d.category,
          subCategory: d.subCategory,
          fiberComposition: d.fiberComposition,
          colorName: d.colorName,
          colorHex: d.colorHex,
          unit: d.unit,
          quantity: Number(d.quantity) || 0,
          grossWeightKg: d.grossWeightKg ? Number(d.grossWeightKg) : undefined,
          unitPriceUSD: d.unitPriceUSD ? Number(d.unitPriceUSD) : undefined,
          unitPriceKES: d.unitPriceKES ? Number(d.unitPriceKES) : undefined,
          hsCode: d.hsCode,
          rollsCount: d.rollsCount ? Number(d.rollsCount) : undefined,
          dyeLot: d.dyeLot,
          shadeCode: d.shadeCode,
          packagesCount: d.packagesCount ? Number(d.packagesCount) : undefined,
          packageDetails: d.packageDetails,
          bagNumberRange: d.bagNumberRange,
          matchedProductId: d.matchedProductId,
          totalPriceUSD: supplyType === 'import' ? (Number(d.unitPriceUSD) || 0) * (Number(d.quantity) || 0) : undefined,
          totalPriceKES: (Number(d.unitPriceKES) || (d.unitPriceUSD ? Math.round(Number(d.unitPriceUSD) * exchangeRate) : 0)) * (Number(d.quantity) || 0)
        })),
        createdAt: invoiceCreatedAt || existingInward?.createdAt || new Date().toISOString(),
        createdBy: invoiceCreatedBy || existingInward?.createdBy || currentUser.name || currentUser.email || 'Chief Accountant',
        updatedAt: new Date().toISOString(),
        lastEditedBy: currentUser.name || currentUser.email || 'Chief Accountant',
        portOfEntry: 'ICD EMBAKASI',
        declarantName: 'Blue Pearl Logistics Limited',
        declarantPin: 'P051506858S'
      };

      const res = await saveInwardInvoice(invoiceRecord);
      clearInwardInvoiceDraft();
      setRecoveredDraftInfo(null);
      setEditingInvoiceRecordId(invoiceRecord.id);
      setSelectedInvoiceId(invoiceRecord.id);
      playSuccessSound();

      setSaveNotice(`✓ Invoice ${invoiceRecord.invoiceNumber} saved to database immediately.`);
      setTimeout(() => setSaveNotice(null), 5000);
      return res.invoice;
    } catch (err: any) {
      console.error('Failed to save inward invoice:', err);
      alert('Error saving invoice to database: ' + (err?.message || 'Unknown error'));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

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

  // Construct and bridge active invoice record into the Landed Costing & Tax Suite
  const handleOpenInCostingSuite = () => {
    if (!onOpenCostingSuite) return;
    playClickSound();
    if (supplyType === 'import') {
      const record: ImportShipmentRecord = {
        id: `SHP-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}`,
        shipmentNumber: `SHP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNumber,
        invoiceDate,
        supplierName: currentSupplier?.name || 'Overseas Supplier',
        supplierCountry: currentSupplier?.country || 'China',
        supplierPin: currentSupplier?.kraPin,
        consigneeName: 'TAJI KNITTERS LIMITED',
        consigneePin: 'P051656758Y',
        declarantName: 'Blue Pearl Logistics Limited',
        declarantPin: 'P051506858S',
        portOfEntry: 'ICD EMBAKASI',
        customsEntryNo: customsOrEtimsRef,
        kraEslipRef,
        destinationLocationId: destinationLocation,
        exchangeRate,
        specificDutyUSDPerTonne: 750,
        specificDutyRatePerTonne: 750 * exchangeRate,
        adValoremRatePct: 25.0,
        idfRatePct: 2.5,
        rdlRatePct: 2.0,
        vatRatePct: 16.0,
        mssLevyUSDRatePerTonne: 1.75,
        cocFeesUSD,
        totalFreightUSD,
        totalInsuranceUSD,
        totalFreightKES: totalFreightUSD * exchangeRate,
        totalInsuranceKES: totalInsuranceUSD * exchangeRate,
        portClearingFeesKES,
        targetMarkupPct: 35.0,
        status: 'assessed',
        lineItems: draftItems.map((item, idx) => ({
          id: item.id || `LI-${idx + 1}`,
          description: item.name,
          hsCode: item.hsCode || '6006.32.00',
          category: (item.category as any) || 'Dereck',
          netWeightKg: item.grossWeightKg * 0.95 || 1000,
          grossWeightKg: item.grossWeightKg || 1050,
          fabricLengthMetres: item.unit === 'meter' ? item.quantity : undefined,
          unit: item.unit,
          fobUSD: (item.unitPriceUSD || 2.0) * (item.unit === 'meter' ? item.quantity : item.grossWeightKg),
          unitFobUSD: item.unitPriceUSD || 2.0,
          freightUSD: 0,
          insuranceUSD: 0,
          customsValueKES: 0,
          dutyAppliedKES: 0,
          landedCostKES: 0,
          landedCostPerUnitKES: 0,
          suggestedRetailKES: 0,
          matchedProductId: item.matchedProductId
        }))
      };
      onOpenCostingSuite(record, 'import');
    } else {
      const localRecord: any = {
        id: `LPO-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}`,
        invoiceNumber,
        invoiceDate,
        supplierName: currentSupplier?.name || 'Domestic Supplier',
        supplierPin: currentSupplier?.kraPin,
        customsOrEtimsRef,
        destinationLocationId: destinationLocation,
        localFreightKES,
        portClearingFeesKES,
        status: 'received',
        lineItems: draftItems.map((item, idx) => ({
          id: item.id || `L-LI-${idx + 1}`,
          description: item.name,
          unitPriceKES: item.unitPriceKES || 250,
          quantity: item.quantity || 1000,
          unit: item.unit || 'meter',
          matchedProductId: item.matchedProductId
        }))
      };
      onOpenCostingSuite(localRecord, 'local');
    }
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
                dyeLot: draft.dyeLot || existing.dyeLot,
                shadeCode: draft.shadeCode || existing.shadeCode,
                packagesCount: draft.packagesCount || existing.packagesCount,
                packageDetails: draft.packageDetails || existing.packageDetails,
                bagNumber: draft.bagNumberRange || existing.bagNumber,
                invoiceRef: invoiceNumber,
                grossWeightKg: comp.grossWeightKg || existing.grossWeightKg,
                netWeightKg: comp.netWeightKg || existing.netWeightKg,
                locationStock: {
                  ...existing.locationStock,
                  [destinationLocation]: currentStock + receivedQty
                }
              });
              onboardedCount++;
            }
          } else {
            // Create brand new product in catalog (Lot No is our SKU)
            const lotSku = (draft.dyeLot?.trim() || draft.sku?.trim() || `LOT-${Date.now().toString().slice(-6)}`).toUpperCase();
            await addProductBatch({
              sku: lotSku,
              dyeLot: lotSku,
              barcode: lotSku,
              name: draft.name,
              category: draft.category,
              subCategory: draft.subCategory || (draft.category === 'Yarns' ? 'Machine Knitting Yarn 2/24 NM' : 'Imported Grade'),
              fiberComposition: draft.fiberComposition || (draft.category === 'Yarns' ? '100% High Bulk Acrylic Dyed Yarn' : '100% Fabric'),
              colorName: draft.colorName || 'Natural',
              colorHex: draft.colorHex || '#1E3A8A',
              unit: draft.unit || (draft.category === 'Yarns' ? 'kg' : 'meter'),
              unitPriceRetail: unitRetail,
              unitPriceBulk: Math.round(unitRetail * 0.95),
              costPrice: unitLanded,
              locationStock: {
                [destinationLocation]: receivedQty
              },
              minReorderLevel: 50,
              countryOfOrigin: currentSupplier?.country || 'India',
              manufacturer: currentSupplier?.name || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
              grossWeightKg: comp.grossWeightKg || draft.grossWeightKg,
              netWeightKg: comp.netWeightKg || draft.quantity,
              shadeCode: draft.shadeCode || (comp as any).shadeCode,
              packagesCount: draft.packagesCount || (comp as any).packagesCount,
              packageDetails: draft.packageDetails || (comp as any).packageDetails,
              bagNumber: draft.bagNumberRange || (comp as any).bagNumberRange,
              yarnCount: draft.category === 'Yarns' ? '2/24 NM' : undefined,
              containerNumber: 'NYKU 4933087/40',
              invoiceRef: invoiceNumber
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
            // Create brand new product in catalog (Lot No is our SKU)
            const lotSku = (draft.dyeLot?.trim() || draft.sku?.trim() || `LOT-${Date.now().toString().slice(-6)}`).toUpperCase();
            await addProductBatch({
              sku: lotSku,
              dyeLot: lotSku,
              barcode: lotSku,
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

      // Auto-sync parent invoice batch into Inventory module
      try {
        await saveOrSyncInvoiceToInventory({
          id: `IMP-${Date.now()}`,
          shipmentNumber: `INW-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
          invoiceNumber,
          invoiceDate,
          supplierName: currentSupplier?.name || 'Commercial Mill Supplier',
          supplierCountry: currentSupplier?.country || (supplyType === 'import' ? 'China' : 'Kenya'),
          consigneeName: 'TAJI KNITTERS LIMITED',
          consigneePin: 'P051656758Y',
          declarantName: 'Blue Pearl Logistics Limited',
          declarantPin: 'P051506858S',
          customsEntryNo: customsOrEtimsRef || `26EMKIM-${invoiceNumber}`,
          kraEslipRef: kraEslipRef || `102026-${invoiceNumber}`,
          portOfEntry: 'ICD EMBAKASI',
          destinationLocationId: destinationLocation,
          exchangeRate: exchangeRate,
          specificDutyRatePerTonne: 97102.50,
          adValoremRatePct: 25.0,
          idfRatePct: 2.5,
          rdlRatePct: 2.0,
          vatRatePct: 16.0,
          mssLevyUSDRatePerTonne: 1.75,
          cocFeesUSD: cocFeesUSD || 600.0,
          totalFreightUSD: totalFreightUSD || 5500.0,
          totalInsuranceUSD: totalInsuranceUSD || 14.38,
          portClearingFeesKES: portClearingFeesKES || 180000.0,
          targetMarkupPct: targetMarkupPct || 35.0,
          status: 'approved_capitalized',
          journalVoucherRef: journalRef,
          lineItems: draftItems.map((it, idx) => ({
            id: `LI-${idx + 1}`,
            description: it.name,
            category: it.category,
            hsCode: it.hsCode || '6006.32.00',
            fobUSD: (it.unitPriceUSD || 2.10) * (it.quantity || 1000),
            netWeightKg: it.quantity || 1000,
            grossWeightKg: it.grossWeightKg || (it.quantity ? it.quantity * 1.02 : 1020),
            gsm: 260,
            widthCm: 150
          }))
        }, 'Capitalized');
      } catch (syncErr) {
        console.warn('Auto-sync from inward intake modal notice:', syncErr);
      }

      // Persist the inward invoice record as 'capitalized' in Firestore immediately
      try {
        await handleSaveInvoice('capitalized');
      } catch (saveErr) {
        console.warn('Inward invoice capitalization persistence notice:', saveErr);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Inward Consignment &amp; Invoice Intake Wizard
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-emerald-700 font-bold">
                  Step {currentStep} of 3
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create invoice header, onboard inventory items, and blend directly with double-entry accounting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDraftAutosaved && !saveNotice && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Auto-saved
              </span>
            )}
            <button
              id="btn-modal-save-invoice-top"
              type="button"
              onClick={() => handleSaveInvoice()}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Save invoice header and all line items to database immediately"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save to Database'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recovery banner if restoring an in-progress draft */}
        {recoveredDraftInfo && (
          <div
            id="banner-modal-draft-recovered"
            className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 font-medium flex items-center justify-between gap-3 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Session Restored:</strong> Resumed your in-progress intake draft ({recoveredDraftInfo.itemCount} line items, saved {formatDraftTimeAgo(recoveredDraftInfo.savedAt)}).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRecoveredDraftInfo(null)}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors cursor-pointer"
              >
                Keep Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardRecoveredDraft}
                className="px-2.5 py-1 text-xs font-medium text-amber-800 hover:text-red-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              >
                Discard &amp; Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Save confirmation banner */}
        {saveNotice && (
          <div
            id="banner-modal-save-notice"
            className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <div
            className={`p-3 text-center border-r border-slate-200 flex items-center justify-center gap-2 ${
              currentStep === 1
                ? 'bg-rose-50 text-rose-600 border-b-2 border-b-rose-600'
                : currentStep > 1
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">1</span>
            <span>1. Invoice &amp; Supplier Header</span>
          </div>

          <div
            className={`p-3 text-center border-r border-slate-200 flex items-center justify-center gap-2 ${
              currentStep === 2
                ? 'bg-rose-50 text-rose-600 border-b-2 border-b-rose-600'
                : currentStep > 2
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">2</span>
            <span>2. Onboard Line Items &amp; Landed Cost</span>
          </div>

          <div
            className={`p-3 text-center flex items-center justify-center gap-2 ${
              currentStep === 3
                ? 'bg-rose-50 text-rose-600 border-b-2 border-b-rose-600'
                : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">3</span>
            <span>3. Capitalize &amp; Push to Ledger</span>
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* STEP 1: Invoice Header */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Inward Commercial Invoice & Consignment Selector with Store Locking */}
              <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-rose-800/40 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-rose-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Select Inward Commercial Invoice / Consignment</span>
                        {isStoreLockedByInvoice && !storeLockOverridden && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Store Lock Enforced</span>
                          </span>
                        )}
                      </h4>
                      <p className="text-[10.5px] text-rose-200/80">
                        Selecting an invoice automatically binds and locks intake inventory to the store that invoice was cleared/created for.
                      </p>
                    </div>
                  </div>

                  {isStoreLockedByInvoice && (
                    <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 bg-amber-400/15 border border-amber-400/30 rounded-xl text-amber-200 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Locked Store: {locations.find(l => l.id === destinationLocation)?.name || destinationLocation}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <select
                    id="select-inward-invoice-source"
                    value={selectedInvoiceId}
                    onChange={e => handleSelectInvoice(e.target.value)}
                    className="w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer transition-colors shadow-inner"
                  >
                    <option value="custom">✍️ Enter New / Custom Inward Invoice Header (Manual Store Allocation)</option>
                    {inwardInvoices && inwardInvoices.length > 0 && (
                      <optgroup label="Saved Inward Invoices (Live Database)">
                        {inwardInvoices.map(inv => {
                          const loc = locations.find(l => l.id === inv.destinationLocation);
                          return (
                            <option key={inv.id} value={inv.id}>
                              📄 {inv.invoiceNumber} — {inv.supplierName} ({inv.supplyType === 'import' ? 'Import' : 'Local'} • {inv.status.toUpperCase()} • KSh {Math.round(inv.totalAmountKES).toLocaleString()} • {loc?.name || inv.destinationLocation})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    <optgroup label="Overseas Import Invoices & KRA Customs Declarations">
                      <option value="IMP-2026-PA222">📄 Commercial Invoice 26PA222 — Zhejiang Puan Textile (Locked: Main Store / Industrial Area)</option>
                      <option value="SAD-26EMKIM400968589">📄 SAD Entry 26EMKIM400968589 — ICMS Reconciled (Locked: Main Store / Industrial Area)</option>
                      <option value="IMP-2026-UDEY-036">📄 Yarn Invoice UU/OI-EX-036/25-26 — Udey Udyog (Container NYKU 4933087/40 | 543 Bags | 12,940.6 kg)</option>
                      <option value="IMP-2026-FLC-774">📄 Invoice 26FLC-882 — Shaoxing Shengli Fleece (Locked: Main Store / Industrial Area)</option>
                    </optgroup>
                    <optgroup label="Kenyan Domestic Supplier Invoices (LPS)">
                      <option value="LPS-REC-2026-001">📄 Local Invoice INV-RIV-2026-9812 — Rivatex East Africa (Locked: Main Store / Industrial Area)</option>
                    </optgroup>
                    {deliveries && deliveries.length > 0 && (
                      <optgroup label="Active Inward Delivery Manifests & Waybills">
                        {deliveries.map(del => {
                          const loc = locations.find(l => l.id === del.destinationLocation);
                          return (
                            <option key={del.id} value={`DEL-${del.id}`}>
                              🚚 Manifest {del.id} ({del.consignmentNo}) — {del.supplierName} (Locked: {loc?.name || del.destinationLocation})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>

                  {isStoreLockedByInvoice && !storeLockOverridden && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Security Guard Active: Warehouse intake destination is locked to {locations.find(l => l.id === destinationLocation)?.name} as per documentation.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Type selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
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
                        ? 'bg-sky-50 border-sky-500 text-slate-900 ring-1 ring-sky-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                      <Globe2 className="w-4 h-4" />
                      <span>Overseas Import Consignment (IPS)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
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
                        ? 'bg-emerald-50 border-emerald-500 text-slate-900 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Kenyan Domestic Supply (LPS)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Domestic Tax Invoices in KES, 16% Input VAT claim, and domestic factory transport.
                    </p>
                  </button>
                </div>
              </div>

              {/* Header Fields */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-600">
                    Invoice &amp; Declarant Metadata
                  </h3>
                  {(invoiceCreatedAt || invoiceCreatedBy) && (
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>
                          Created: <strong className="text-slate-800 font-bold">
                            {new Date(invoiceCreatedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(invoiceCreatedAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Created by: <strong className="text-slate-800">{invoiceCreatedBy || 'Chief Accountant'}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supplier Organization *
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => handleSupplierChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.country} • {sup.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Commercial Invoice Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {supplyType === 'import' ? 'Customs Entry / SAD No.' : 'Tax / Domestic Invoice Number'}
                    </label>
                    <input
                      type="text"
                      value={customsOrEtimsRef}
                      onChange={e => setCustomsOrEtimsRef(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {supplyType === 'import' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        KRA E-Slip / PRN Ref No.
                      </label>
                      <input
                        type="text"
                        value={kraEslipRef}
                        onChange={e => setKraEslipRef(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Destination Store / Warehouse *
                      </label>
                      {isStoreLockedByInvoice && !storeLockOverridden ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Locked by Invoice</span>
                        </span>
                      ) : storeLockOverridden ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                          <Unlock className="w-3 h-3 text-rose-700" />
                          <span>Override Active</span>
                        </span>
                      ) : null}
                    </div>

                    {isStoreLockedByInvoice && !storeLockOverridden ? (
                      <div className="space-y-1.5">
                        <div className="w-full bg-amber-50/90 border-2 border-amber-300 rounded-xl px-3.5 py-2 text-xs text-amber-950 font-bold flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <span className="block font-extrabold text-slate-900">
                                {locations.find(l => l.id === destinationLocation)?.name || destinationLocation}
                              </span>
                              <span className="text-[10px] font-normal text-amber-800 block">
                                Bound strictly to Invoice #{invoiceNumber}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Administrative Warning: Invoice #${invoiceNumber} is designated for ${locations.find(l => l.id === destinationLocation)?.name || destinationLocation}. Re-routing may cause audit variance against supplier shipping documents. Do you wish to override the store lock?`)) {
                                setStoreLockOverridden(true);
                              }
                            }}
                            className="text-[10.5px] font-bold text-amber-800 hover:text-amber-950 underline px-2 py-1 rounded hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                            title="Authorized supervisor override"
                          >
                            Unlock Override
                          </button>
                        </div>
                        <p className="text-[10.5px] text-amber-800 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Intake destination is locked to this store as designated in invoice #{invoiceNumber}. Cross-location intake is restricted.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <select
                          id="select-destination-location"
                          value={destinationLocation}
                          onChange={e => setDestinationLocation(e.target.value as LocationId)}
                          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 ${
                            storeLockOverridden ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                        >
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.type})
                            </option>
                          ))}
                        </select>
                        {storeLockOverridden && (
                          <div className="flex items-center justify-between text-[10.5px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                            <span>⚠️ Supervisor override active. Receiving stock into custom facility.</span>
                            <button
                              type="button"
                              onClick={() => setStoreLockOverridden(false)}
                              className="font-bold underline text-amber-900 cursor-pointer ml-2"
                            >
                              Re-lock to Invoice
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logistics & Cost Parameters */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600">
                  Landed Cost Allocation Parameters
                </h3>

                {supplyType === 'import' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Exchange Rate (USD/KES)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={exchangeRate}
                        onChange={e => setExchangeRate(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Freight (USD)
                      </label>
                      <input
                        type="number"
                        value={totalFreightUSD}
                        onChange={e => setTotalFreightUSD(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        CoC Fees (USD)
                      </label>
                      <input
                        type="number"
                        value={cocFeesUSD}
                        onChange={e => setCocFeesUSD(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Port Clearing (KES)
                      </label>
                      <input
                        type="number"
                        value={portClearingFeesKES}
                        onChange={e => setPortClearingFeesKES(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Target Markup %
                      </label>
                      <input
                        type="number"
                        value={targetMarkupPct}
                        onChange={e => setTargetMarkupPct(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Local Trucking Freight (KES)
                      </label>
                      <input
                        type="number"
                        value={localFreightKES}
                        onChange={e => setLocalFreightKES(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Offloading &amp; Handling (KES)
                      </label>
                      <input
                        type="number"
                        defaultValue={15000}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Target Markup %
                      </label>
                      <input
                        type="number"
                        value={targetMarkupPct}
                        onChange={e => setTargetMarkupPct(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
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
                  <h3 className="text-sm font-bold text-slate-900">
                    Inventory Items Invoiced under {invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add batches to be received. You can link existing catalog items or define brand new SKUs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftItem}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Item to Invoice</span>
                </button>
              </div>

              {draftItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-900">
                        {item.name || 'Untitled Line Item'}
                      </span>
                      {item.shadeCode && (
                        <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-800 flex items-center gap-1.5 border border-slate-300">
                          {item.colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0 inline-block"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span>{item.shadeCode}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
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
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.isExistingCatalogProduct ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Select Existing Product from Catalog
                      </label>
                      <select
                        value={item.matchedProductId || ''}
                        onChange={e => handleUpdateDraft(item.id, { matchedProductId: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
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
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateDraft(item.id, { name: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Lot No / SKU *
                        </label>
                        <input
                          type="text"
                          value={item.sku}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            handleUpdateDraft(item.id, { sku: val, dyeLot: val });
                          }}
                          placeholder="e.g. 26C002"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Category *
                        </label>
                        <select
                          value={item.category}
                          onChange={e => handleUpdateDraft(item.id, { category: e.target.value as CategoryType })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Invoiced Qty ({item.unit}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleUpdateDraft(item.id, { quantity: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={e => handleUpdateDraft(item.id, { unit: e.target.value as UnitType })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      >
                        <option value="meter">Meters (m)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="yard">Yards</option>
                        <option value="piece">Pieces</option>
                      </select>
                    </div>

                    {supplyType === 'import' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          FOB Unit Price ($ USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPriceUSD}
                          onChange={e => handleUpdateDraft(item.id, { unitPriceUSD: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Net Unit Price (KSh KES) *
                        </label>
                        <input
                          type="number"
                          value={item.unitPriceKES}
                          onChange={e => handleUpdateDraft(item.id, { unitPriceKES: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Color / Shade
                      </label>
                      <input
                        type="text"
                        value={item.colorName}
                        onChange={e => handleUpdateDraft(item.id, { colorName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Gross Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={item.grossWeightKg || item.quantity}
                        onChange={e => handleUpdateDraft(item.id, { grossWeightKg: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Lot, Shade, & Packaging breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Dye Lot # (SKU)
                        </label>
                        {item.dyeLot && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 26C002"
                        value={item.dyeLot || item.sku || ''}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          handleUpdateDraft(item.id, { dyeLot: val, sku: val });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Shade / Color Code
                        </label>
                        {item.colorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                            title={`Color Swatch: ${item.colorHex}`}
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <select
                          value={
                            knownShades.some(s => s.code.toUpperCase() === (item.shadeCode || '').trim().toUpperCase())
                              ? (item.shadeCode || '').trim().toUpperCase()
                              : ((item.shadeCode && item.shadeCode !== '') ? '__custom__' : '')
                          }
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              if (!item.shadeCode) {
                                handleUpdateDraft(item.id, { shadeCode: 'CUSTOM-SHADE' });
                              }
                              return;
                            }
                            if (!val) {
                              handleUpdateDraft(item.id, { shadeCode: '', colorName: '', colorHex: '' });
                              return;
                            }
                            const matched = knownShades.find(s => s.code.toUpperCase() === val.toUpperCase());
                            if (matched) {
                              const autoLot = matched.defaultDyeLot || `LOT-${matched.code.replace(/[^A-Z0-9]/gi, '')}`;
                              handleUpdateDraft(item.id, {
                                shadeCode: matched.code,
                                colorName: matched.name,
                                colorHex: matched.hex,
                                dyeLot: autoLot,
                                sku: autoLot,
                                ...(matched.category && matched.category !== 'All' ? { category: matched.category as CategoryType } : {})
                              });
                            }
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-rose-500"
                        >
                          <option value="">-- Choose Known Shade Code ({knownShades.length}) --</option>
                          
                          {/* Recommended for this category */}
                          {(() => {
                            const recs = knownShades.filter(s =>
                              (item.category === 'Yarns' && s.category === 'Yarns') ||
                              (['Dereck', 'Fleece'].includes(item.category) && ['Dereck', 'Fleece'].includes(s.category))
                            );
                            if (recs.length === 0) return null;
                            return (
                              <optgroup label={`Recommended for ${item.category}`}>
                                {recs.map(s => (
                                  <option key={`rec-${s.code}`} value={s.code.toUpperCase()}>
                                    ● {s.code} — {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })()}

                          {/* Oster India Yarns */}
                          <optgroup label="Oster India 2/24 NM Acrylic Yarns">
                            {knownShades
                              .filter(s => s.category === 'Yarns')
                              .map(s => (
                                <option key={`yarn-${s.code}`} value={s.code.toUpperCase()}>
                                  ● {s.code} — {s.name}
                                </option>
                              ))}
                          </optgroup>

                          {/* Dereck Fabrics */}
                          <optgroup label="Dereck Fabrics (Rolls / Meters)">
                            {knownShades
                              .filter(s => s.category === 'Dereck')
                              .map(s => (
                                <option key={`fab-drk-${s.code}`} value={s.code.toUpperCase()}>
                                  ● {s.code} — {s.name}
                                </option>
                              ))}
                          </optgroup>

                          {/* Fleece Fabrics */}
                          <optgroup label="Polar Fleece Fabrics (Rolls / Meters)">
                            {knownShades
                              .filter(s => s.category === 'Fleece')
                              .map(s => (
                                <option key={`fab-fl-${s.code}`} value={s.code.toUpperCase()}>
                                  ● {s.code} — {s.name}
                                </option>
                              ))}
                          </optgroup>

                          {/* General Mill Palette */}
                          <optgroup label="General Mill Palette">
                            {knownShades
                              .filter(s => s.category === 'All' && s.source === 'mill')
                              .map(s => (
                                <option key={`all-${s.code}`} value={s.code.toUpperCase()}>
                                  ● {s.code} — {s.name}
                                </option>
                              ))}
                          </optgroup>

                          {/* Existing Inventory Shades */}
                          {knownShades.some(s => s.source === 'inventory') && (
                            <optgroup label="Catalog & Inventory Batches">
                              {knownShades
                                .filter(s => s.source === 'inventory')
                                .map(s => (
                                  <option key={`inv-${s.code}`} value={s.code.toUpperCase()}>
                                    ★ {s.code} — {s.name}
                                  </option>
                                ))}
                            </optgroup>
                          )}

                          <option value="__custom__">✏️ Custom Shade (Type Manually)...</option>
                        </select>

                        {/* Custom shade code input if not matching known codes or custom chosen */}
                        {(!knownShades.some(s => s.code.toUpperCase() === (item.shadeCode || '').trim().toUpperCase()) || item.shadeCode === 'CUSTOM-SHADE') && (
                          <input
                            type="text"
                            placeholder="Type custom shade code (e.g. MAROON-3059)"
                            value={item.shadeCode === 'CUSTOM-SHADE' ? '' : (item.shadeCode || '')}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              const matched = knownShades.find(s => s.code.toUpperCase() === val.trim() || s.defaultDyeLot?.toUpperCase() === val.trim());
                              if (matched) {
                                const autoLot = matched.defaultDyeLot || `LOT-${matched.code.replace(/[^A-Z0-9]/gi, '')}`;
                                handleUpdateDraft(item.id, {
                                  shadeCode: matched.code,
                                  colorName: matched.name,
                                  colorHex: matched.hex,
                                  dyeLot: autoLot,
                                  sku: autoLot,
                                  ...(matched.category && matched.category !== 'All' ? { category: matched.category as CategoryType } : {})
                                });
                              } else {
                                handleUpdateDraft(item.id, {
                                  shadeCode: val,
                                  colorName: item.colorName || val,
                                  ...(val.trim() && (!item.dyeLot || item.dyeLot.startsWith('LOT-')) ? {
                                    dyeLot: `LOT-${val.trim().replace(/[^A-Z0-9]/gi, '')}`,
                                    sku: `LOT-${val.trim().replace(/[^A-Z0-9]/gi, '')}`
                                  } : {})
                                });
                              }
                            }}
                            className="w-full bg-amber-50/80 border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Packages / Bags Count
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 106"
                        value={item.packagesCount || item.rollsCount || ''}
                        onChange={e => handleUpdateDraft(item.id, { packagesCount: Number(e.target.value), rollsCount: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Package Breakdown / Bag Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 105 bags @ 24kg + 1 part (Bags 29 to 134)"
                        value={item.packageDetails || item.bagNumberRange || ''}
                        onChange={e => handleUpdateDraft(item.id, { packageDetails: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
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
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Consignment Successfully Capitalized &amp; Onboarded!
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-lg mx-auto">
                    Stock has been loaded into <span className="font-bold text-slate-900">{destinationLocation}</span> at its true calculated landed cost basis, and double-entry General Ledger vouchers have posted.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Journal Ref</div>
                      <div className="text-xs font-mono font-bold text-emerald-700 mt-1">{capitalizationResult.journalRef}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Items Onboarded</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-1">{capitalizationResult.itemsOnboarded} Batches</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Capitalized Asset</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-1">KSh {Math.round(capitalizationResult.totalLandedCostKES).toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Input VAT Claimed</div>
                      <div className="text-xs font-mono font-bold text-emerald-700 mt-1">KSh {Math.round(capitalizationResult.vatClaimedKES).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                      id="btn-start-updating-inventory"
                      type="button"
                      onClick={() => {
                        playSuccessSound();
                        onClose();
                        const primaryCategory = (draftItems[0]?.category as any) || 'Yarns';
                        if (onStartUpdatingInventory) {
                          onStartUpdatingInventory(invoiceNumber, primaryCategory);
                        } else {
                          openCategoryIntakeModal(invoiceNumber, primaryCategory);
                        }
                      }}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-xl flex items-center gap-2 cursor-pointer scale-105 hover:scale-108 ring-4 ring-emerald-400/30"
                      title="Start updating physical roll/bale inventory for this invoice"
                    >
                      <Barcode className="w-4 h-4 text-emerald-200" />
                      <span>Start Updating Inventory</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </button>

                    <button
                      onClick={onClose}
                      className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Close &amp; View Catalog
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Destination Facility Lock Audit Verification */}
                  <div className="p-3.5 bg-amber-50/90 border border-amber-300/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-amber-800" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Intake Target Store: {locations.find(l => l.id === destinationLocation)?.name || destinationLocation}
                          </span>
                          {isStoreLockedByInvoice && !storeLockOverridden ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                              🔒 Locked to Invoice #{invoiceNumber}
                            </span>
                          ) : storeLockOverridden ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                              ⚠️ Re-route Override Active
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                          {draftItems.length} line items and capitalized asset entries will be credited strictly to {locations.find(l => l.id === destinationLocation)?.name || destinationLocation}.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10.5px] font-mono font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                        Depot ID: {destinationLocation}
                      </span>
                    </div>
                  </div>

                  {/* Financial Summary Box */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center justify-between">
                      <span>Accounting Balance Sheet &amp; Landed Costing Impact</span>
                      <span className="text-slate-500 font-mono normal-case">Invoice: {invoiceNumber}</span>
                    </h3>

                    {supplyType === 'import' && calculatedImportSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Total FOB Value</div>
                          <div className="text-sm font-mono font-bold text-sky-700 mt-1">
                            ${calculatedImportSummary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            KSh {Math.round(calculatedImportSummary.totalFOB_USD * exchangeRate).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Total KRA Taxes</div>
                          <div className="text-sm font-mono font-bold text-amber-700 mt-1">
                            KSh {Math.round(calculatedImportSummary.totalKRATaxesKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Duty, IDF, RDL, VAT 1202
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">KRA Input VAT (16%)</div>
                          <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                            KSh {Math.round(calculatedImportSummary.totalVAT1202KES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Claimable in VAT-3 Return
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Total Landed Inventory</div>
                          <div className="text-sm font-mono font-bold text-slate-900 mt-1">
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
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Net Purchases</div>
                          <div className="text-sm font-mono font-bold text-sky-700 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalNetPurchaseKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Excl. 16% VAT</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">16% Input VAT</div>
                          <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalVat16KES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">VAT claimable</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Logistics Add-ons</div>
                          <div className="text-sm font-mono font-bold text-amber-700 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalLogisticsAddOnsKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Trucking &amp; Handling</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase">Capitalized Asset</div>
                          <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                            KSh {Math.round(calculatedLocalSummary.totalCapitalizedInventoryCostKES).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Debited to Asset 1200</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Onboarding preview */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-600">
                      Line Item Landed Unit Costs &amp; Stock Routing
                    </h3>

                    <div className="divide-y divide-slate-200">
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
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                SKU: <span className="font-mono text-slate-700">{item.sku}</span> • Onboarding{' '}
                                <span className="text-slate-900 font-bold">{item.quantity.toLocaleString()} {item.unit}</span> into{' '}
                                <span className="text-rose-600 font-bold">{destinationLocation}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-700">
                                Landed Cost: KSh {landedUnitCost.toLocaleString()}/{item.unit}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
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
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {currentStep > 1 && !capitalizationResult && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {onOpenCostingSuite && !capitalizationResult && (
              <button
                type="button"
                onClick={handleOpenInCostingSuite}
                className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Transfer and edit this invoice directly in the Accountant Landed Costing & Tax Suite"
              >
                <Ship className="w-4 h-4 text-sky-600" />
                <span>Open in Landed Costing Suite</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>

            {!capitalizationResult && (
              <button
                id="btn-modal-save-invoice-bottom"
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveInvoice()}
                className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                title="Save invoice header and all line items to database immediately"
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSaving ? 'Saving...' : 'Save Draft / Changes'}</span>
              </button>
            )}

            {currentStep < 3 && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setCurrentStep((currentStep + 1) as any);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && !capitalizationResult && (
              <button
                type="button"
                disabled={isCapitalizing || isSaving}
                onClick={handleApproveAndCapitalize}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
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
