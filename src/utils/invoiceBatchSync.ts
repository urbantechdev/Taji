import {
  InvoiceInventoryBatch,
  InvoiceInventoryBatchItem,
  InvoiceBatchRollItem,
  ImportShipmentRecord,
  LocationId
} from '../types';
import {
  calculateImportShipmentCosting,
  PRESET_INVOICE_26PA222,
  PRESET_SAD_26EMKIM400968589,
  PRESET_SAD_UDEY_UDYOG
} from './importCostingEngine';

/**
 * Generate realistic individual roll/unit level records for a fabric line item
 */
export function generateUnitLevelRolls(
  invoiceNumber: string,
  lineItemDescription: string,
  netWeightKg: number,
  grossWeightKg: number,
  fabricLengthMetres: number,
  gsm: number,
  widthCm: number,
  targetStore: LocationId = 'main_store',
  rollsCount: number = 30
): InvoiceBatchRollItem[] {
  const rolls: InvoiceBatchRollItem[] = [];
  const safeRollsCount = Math.max(1, Math.min(rollsCount, 60));
  const avgNetRoll = netWeightKg / safeRollsCount;
  const avgGrossRoll = grossWeightKg / safeRollsCount;
  const avgLengthRoll = fabricLengthMetres > 0 ? fabricLengthMetres / safeRollsCount : (avgNetRoll * 1000) / (gsm * (widthCm / 100));

  const cleanInv = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const descSlug = lineItemDescription.includes('Derek')
    ? 'DRK'
    : lineItemDescription.includes('Interlock')
    ? 'INT'
    : lineItemDescription.includes('Fleece')
    ? 'FLC'
    : 'TEX';

  for (let i = 1; i <= safeRollsCount; i++) {
    const pad = i.toString().padStart(3, '0');
    // slight natural variation in piece weights (+/- 1.5%)
    const variation = 1 + (Math.sin(i * 13) * 0.015);
    const rollNet = Math.round(avgNetRoll * variation * 10) / 10;
    const rollGross = Math.round(avgGrossRoll * variation * 10) / 10;
    const rollTare = Math.round((rollGross - rollNet) * 10) / 10;
    const rollLength = Math.round(avgLengthRoll * variation * 10) / 10;

    rolls.push({
      id: `ROLL-${cleanInv}-${descSlug}-${pad}`,
      rollNumber: `R-${cleanInv}-${pad}`,
      barcode: `TAJI-${cleanInv}-${descSlug}-${pad}`,
      grossWeightKg: Math.max(rollNet + 0.3, rollGross),
      netWeightKg: rollNet,
      tareWeightKg: Math.max(0.2, rollTare),
      lengthMeters: Math.max(10, rollLength),
      locationId: targetStore,
      inspectionStatus: i === 13 ? 'Pending' : 'Passed',
      shadeOrLot: `LOT-${cleanInv}-A`
    });
  }

  return rolls;
}

/**
 * Transform an ImportShipmentRecord into an InvoiceInventoryBatch
 */
export function buildInvoiceInventoryBatch(
  shipment: ImportShipmentRecord,
  creationTimestamp?: string
): InvoiceInventoryBatch {
  const costing = calculateImportShipmentCosting(
    {
      exchangeRate: shipment.exchangeRate,
      specificDutyUSDPerTonne: shipment.specificDutyUSDPerTonne ?? 750,
      specificDutyRatePerTonne: shipment.specificDutyRatePerTonne,
      adValoremRatePct: shipment.adValoremRatePct,
      idfRatePct: shipment.idfRatePct,
      rdlRatePct: shipment.rdlRatePct,
      vatRatePct: shipment.vatRatePct,
      mssLevyUSDRatePerTonne: shipment.mssLevyUSDRatePerTonne,
      cocFeesUSD: shipment.cocFeesUSD,
      totalFreightUSD: shipment.totalFreightUSD,
      totalInsuranceUSD: shipment.totalInsuranceUSD,
      portClearingFeesKES: shipment.portClearingFeesKES,
      targetMarkupPct: shipment.targetMarkupPct
    },
    shipment.lineItems
  );

  const destinationStore = shipment.destinationLocationId || 'main_store';
  let totalMetres = 0;
  let totalNetKg = 0;
  let totalGrossKg = 0;

  const lineItems: InvoiceInventoryBatchItem[] = costing.items.map((item, index) => {
    const isFabric = item.category === 'Dereck' || item.category === 'Fleece' || (item.gsm && item.gsm > 0);
    const gsm = item.gsm || (item.description.includes('260GSM') ? 260 : item.description.includes('120GSM') ? 120 : 250);
    const widthCm = item.widthCm || 150;
    const netKg = item.netWeightKg;
    const grossKg = item.grossWeightKg || netKg * 1.01;

    let lengthM = item.fabricLengthMetres && item.fabricLengthMetres > 0
      ? item.fabricLengthMetres
      : isFabric
      ? (netKg * 1000) / (gsm * (widthCm / 100))
      : 0;

    totalMetres += lengthM;
    totalNetKg += netKg;
    totalGrossKg += grossKg;

    const rollsCount = (item as any).rollsCount || (item.category === 'Yarns' ? 50 : 35);
    const unitLanded = item.landedCostPerUnitExclVat > 0
      ? Math.round(item.landedCostPerUnitExclVat * 100) / 100
      : Math.round(item.landedCostPerUnit * 100) / 100;

    const rolls = isFabric
      ? generateUnitLevelRolls(
          shipment.invoiceNumber,
          item.description,
          netKg,
          grossKg,
          lengthM,
          gsm,
          widthCm,
          destinationStore,
          rollsCount
        )
      : undefined;

    return {
      id: item.id || `LI-${index + 1}`,
      description: item.description,
      category: item.category,
      subCategory: (item as any).subCategory || (item.category === 'Dereck' ? 'Special Derek Suiting' : item.category === 'Yarns' ? '2/24 NM Knitting' : 'Polar Fleece'),
      hsCode: item.hsCode,
      gsm,
      widthCm,
      netWeightKg: Math.round(netKg * 10) / 10,
      grossWeightKg: Math.round(grossKg * 10) / 10,
      fabricLengthMetres: Math.round(lengthM * 10) / 10,
      unit: item.unit || (isFabric ? 'meter' : 'kg'),
      quantity: isFabric ? Math.round(lengthM * 10) / 10 : Math.round(netKg * 10) / 10,
      fobUSD: item.fobUSD,
      unitFobUSD: Math.round((item.fobUSD / (netKg || 1)) * 100) / 100,
      landedCostKESPerUnit: unitLanded,
      landedCostKESPerUnitExclVat: Math.round(item.landedCostPerUnitExclVat * 100) / 100,
      totalLandedCostKES: Math.round(item.totalLandedCostKES),
      customsValueKES: Math.round(item.customsValueKES),
      dutyAppliedKES: Math.round(item.dutyAppliedKES),
      suggestedRetailPriceKES: Math.round(item.suggestedRetailPrice),
      rollsCount,
      dyeLot: (item as any).dyeLot || `LOT-${shipment.invoiceNumber}`,
      shadeCode: (item as any).shadeCode,
      matchedProductId: item.matchedProductId,
      rolls
    };
  });

  const batchStatus: 'Pending Clearance' | 'Assessed' | 'Capitalized' | 'In Stock' =
    shipment.status === 'approved_capitalized'
      ? 'Capitalized'
      : shipment.status === 'assessed'
      ? 'Assessed'
      : 'Pending Clearance';

  return {
    id: `INV-BATCH-${shipment.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}`,
    invoiceNumber: shipment.invoiceNumber,
    supplierName: shipment.supplierName,
    supplierCountry: shipment.supplierCountry || 'China',
    customsEntryNo: shipment.customsEntryNo,
    kraEslipRef: shipment.kraEslipRef,
    createdAt: creationTimestamp || new Date().toISOString(),
    importDate: shipment.invoiceDate || new Date().toISOString().split('T')[0],
    destinationLocationId: destinationStore,
    destinationLocationName: destinationStore === 'main_store' ? 'Main Store Mombasa' : 'Sales Shop 1 (Biashara St)',
    totalQuantity: Math.round(totalMetres > 0 ? totalMetres : totalNetKg),
    totalQuantityUnit: totalMetres > 0 ? 'meter' : 'kg',
    totalItemsCount: lineItems.length,
    totalNetWeightKg: Math.round(totalNetKg * 10) / 10,
    totalGrossWeightKg: Math.round(totalGrossKg * 10) / 10,
    totalLandedCostKES: Math.round(costing.totalLandedInventoryKES),
    totalFOB_USD: Math.round(costing.totalFOB_USD * 100) / 100,
    exchangeRate: shipment.exchangeRate,
    status: batchStatus,
    journalRef: shipment.journalVoucherRef || (shipment.status === 'approved_capitalized' ? `JRN-IMP-${shipment.customsEntryNo}` : undefined),
    notes: shipment.notes,
    lineItems
  };
}

// Pre-built real world invoice batches ready for immediate exploration
export const PRESET_INVOICE_BATCH_26PA222: InvoiceInventoryBatch = buildInvoiceInventoryBatch(
  PRESET_INVOICE_26PA222,
  '2026-06-03T10:15:30.000Z'
);

export const PRESET_INVOICE_BATCH_SAD_26EMKIM: InvoiceInventoryBatch = buildInvoiceInventoryBatch(
  PRESET_SAD_26EMKIM400968589,
  '2026-06-15T14:45:00.000Z'
);

export const PRESET_INVOICE_BATCH_UDEY: InvoiceInventoryBatch = buildInvoiceInventoryBatch(
  PRESET_SAD_UDEY_UDYOG,
  '2026-02-18T09:20:00.000Z'
);

export const INITIAL_INVOICE_BATCHES: InvoiceInventoryBatch[] = [
  PRESET_INVOICE_BATCH_SAD_26EMKIM,
  PRESET_INVOICE_BATCH_26PA222,
  PRESET_INVOICE_BATCH_UDEY
].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
