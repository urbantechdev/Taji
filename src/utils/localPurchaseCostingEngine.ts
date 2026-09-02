import {
  LocalPurchaseLineItem,
  LocalPurchaseRecord,
  ComputedLocalPurchaseSummary
} from '../types';

/**
 * Calculates Local Purchase Supply (LPS) costing, 16% input VAT,
 * apportioned local logistics (freight & offloading), true unit landed cost,
 * and profit margins.
 */
export function calculateLocalPurchaseCosting(
  record: LocalPurchaseRecord
): ComputedLocalPurchaseSummary {
  const items = record.lineItems || [];
  const totalNetPurchaseKES = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.netUnitPriceKES) || 0),
    0
  );

  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalWeightKg = items.reduce((sum, it) => {
    // If unit is kg or if rolls have weight
    if (it.unit === 'kg') return sum + (Number(it.quantity) || 0);
    // Estimated weight for fabric meters: (meter * width(m) * gsm / 1000)
    const gsm = it.gsm || 260;
    const widthM = (it.widthCm || 150) / 100;
    return sum + ((Number(it.quantity) || 0) * widthM * gsm) / 1000;
  }, 0);

  const totalFreight = Number(record.localFreightKES) || 0;
  const totalHandling = Number(record.localHandlingKES) || 0;
  const totalInspection = Number(record.inspectionTestingKES) || 0;
  const totalLogisticsAddOnsKES = totalFreight + totalHandling + totalInspection;

  const targetMarkup = Number(record.targetMarkupPct) || 30;

  let totalVat16KES = 0;

  const computedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.netUnitPriceKES) || 0;
    const lineNetKES = qty * unitPrice;

    // VAT calculation based on item vatRatePct (default 16%)
    const vatRate = item.vatRatePct !== undefined ? Number(item.vatRatePct) : 16;
    const lineVatKES = (lineNetKES * vatRate) / 100;
    totalVat16KES += lineVatKES;

    // Apportion logistics by net purchase value ratio (or weight ratio if available)
    const valueRatio = totalNetPurchaseKES > 0 ? lineNetKES / totalNetPurchaseKES : 0;
    const allocatedFreightKES = totalFreight * valueRatio;
    const allocatedHandlingKES = totalHandling * valueRatio;
    const allocatedInspectionKES = totalInspection * valueRatio;
    const allocatedLogisticsKES = allocatedFreightKES + allocatedHandlingKES + allocatedInspectionKES;

    // Total Capitalized Cost = Net Purchase + Freight + Handling + Inspection (VAT is excluded because it is an asset claim)
    const totalCapitalizedKES = lineNetKES + allocatedLogisticsKES;
    const unitLandedCostKES = qty > 0 ? totalCapitalizedKES / qty : 0;

    // Target Selling & Wholesale Price
    const suggestedRetailPriceKES = Math.round(unitLandedCostKES * (1 + targetMarkup / 100));
    const suggestedBulkPriceKES = Math.round(unitLandedCostKES * (1 + (targetMarkup - 8) / 100));
    const grossMarginPct = suggestedRetailPriceKES > 0 ? ((suggestedRetailPriceKES - unitLandedCostKES) / suggestedRetailPriceKES) * 100 : targetMarkup;

    return {
      ...item,
      lineNetKES,
      lineVatKES,
      allocatedFreightKES,
      allocatedHandlingKES,
      allocatedLogisticsKES,
      totalCapitalizedKES,
      unitLandedCostKES,
      suggestedRetailPriceKES,
      suggestedBulkPriceKES,
      grossMarginPct
    };
  });

  const totalCapitalizedInventoryCostKES = totalNetPurchaseKES + totalLogisticsAddOnsKES;
  const totalGrossSupplierPayableKES = totalNetPurchaseKES + totalVat16KES;
  const totalWithholdingVat2KES = record.withholdingVatEnabled ? totalNetPurchaseKES * 0.02 : 0;
  const effectiveAverageCapitalizedCostPerUnit = totalUnits > 0 ? totalCapitalizedInventoryCostKES / totalUnits : 0;

  return {
    totalNetPurchaseKES,
    totalVat16KES,
    totalWithholdingVat2KES,
    totalGrossSupplierPayableKES,
    totalLogisticsAddOnsKES,
    totalCapitalizedInventoryCostKES,
    totalUnits,
    effectiveAverageCapitalizedCostPerUnit,
    items: computedItems
  };
}

/**
 * Kenyan Local Supplier Presets (LPS)
 */
export const PRESET_LPS_RIVATEX: LocalPurchaseRecord = {
  id: 'LPS-REC-2026-001',
  purchaseOrderNo: 'LPO-2026-RIV089',
  invoiceNumber: 'INV-RIV-2026-9812',
  etimsControlNo: '005001202602189912',
  invoiceDate: '2026-02-18',
  supplierName: 'RIVATEX EAST AFRICA LIMITED',
  supplierPin: 'P051187654M',
  supplierCity: 'Eldoret / Nairobi Depot',
  destinationLocationId: 'main_store',
  paymentTerms: '30 Days Credit',
  withholdingVatEnabled: false,
  localFreightKES: 28500, // Trucking Eldoret to Nairobi CBD
  localHandlingKES: 6000, // Offloading & roll staging labour
  inspectionTestingKES: 3500, // Batch GSM & color fastness lab audit
  targetMarkupPct: 35,
  status: 'draft',
  lineItems: [
    {
      id: 'LPS-LI-001',
      description: '100% Pure Cotton Single Jersey (180 GSM - White)',
      category: 'Single Jersey',
      quantity: 3500,
      unit: 'meter',
      netUnitPriceKES: 195.0,
      vatRatePct: 16.0,
      rollsCount: 70,
      gsm: 180,
      widthCm: 160,
      colorName: 'Optical Pure White'
    },
    {
      id: 'LPS-LI-002',
      description: 'Heavy 100% Cotton Rib 1x1 Tubular (280 GSM - Navy)',
      category: 'Rib',
      quantity: 1200,
      unit: 'kg',
      netUnitPriceKES: 380.0,
      vatRatePct: 16.0,
      rollsCount: 40,
      gsm: 280,
      widthCm: 100,
      colorName: 'Deep Navy Blue'
    }
  ],
  notes: 'Direct mill procurement for corporate schoolwear production. Invoiced via KRA eTIMS.'
};

export const PRESET_LPS_THIKA_CLOTH_MILLS: LocalPurchaseRecord = {
  id: 'LPS-REC-2026-002',
  purchaseOrderNo: 'LPO-2026-TCM044',
  invoiceNumber: 'TCM-INV-77341',
  etimsControlNo: '003001202602158821',
  invoiceDate: '2026-02-15',
  supplierName: 'THIKA CLOTH MILLS LIMITED',
  supplierPin: 'P051102987X',
  supplierCity: 'Thika / Kiambu',
  destinationLocationId: 'main_store',
  paymentTerms: 'Immediate Cash/M-Pesa',
  withholdingVatEnabled: true,
  localFreightKES: 14000, // Thika to Nairobi industrial area
  localHandlingKES: 4500,
  inspectionTestingKES: 0,
  targetMarkupPct: 32,
  status: 'draft',
  lineItems: [
    {
      id: 'LPS-LI-003',
      description: 'Heavy Brushed Fleece 3-End (320 GSM - Heather Grey)',
      category: 'Fleece',
      quantity: 2800,
      unit: 'meter',
      netUnitPriceKES: 310.0,
      vatRatePct: 16.0,
      rollsCount: 56,
      gsm: 320,
      widthCm: 180,
      colorName: 'Heather Grey Melange'
    },
    {
      id: 'LPS-LI-004',
      description: 'Poly-Cotton Heavy Pique Fabric (240 GSM - Maroon)',
      category: 'Heavy Pique',
      quantity: 1900,
      unit: 'meter',
      netUnitPriceKES: 265.0,
      vatRatePct: 16.0,
      rollsCount: 38,
      gsm: 240,
      widthCm: 160,
      colorName: 'Kenyan Flag Maroon'
    }
  ],
  notes: 'Local winter hoodie fleece and polo pique replenishment.'
};

export const PRESET_LPS_SPINNERS: LocalPurchaseRecord = {
  id: 'LPS-REC-2026-003',
  purchaseOrderNo: 'LPO-2026-SPN112',
  invoiceNumber: 'SPN-TX-4402',
  etimsControlNo: '007001202602113390',
  invoiceDate: '2026-02-11',
  supplierName: 'SPINNERS & SPINNERS LIMITED',
  supplierPin: 'P051167432K',
  supplierCity: 'Ruaraka / Nairobi',
  destinationLocationId: 'main_store',
  paymentTerms: '30 Days Credit',
  withholdingVatEnabled: false,
  localFreightKES: 8500,
  localHandlingKES: 3000,
  inspectionTestingKES: 2000,
  targetMarkupPct: 30,
  status: 'draft',
  lineItems: [
    {
      id: 'LPS-LI-005',
      description: 'Spinners Acrylic & Polyester Knitting Yarns 28/2 Ne',
      category: 'Yarns',
      quantity: 4200,
      unit: 'kg',
      netUnitPriceKES: 410.0,
      vatRatePct: 16.0,
      rollsCount: 140,
      gsm: 0,
      widthCm: 0,
      colorName: 'Assorted Core Colours'
    }
  ],
  notes: 'Local yarn cone supply for sweater and collar knitting plant.'
};
