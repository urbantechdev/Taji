import {
  ImportShipmentLineItem,
  ComputedImportLineItem,
  ImportShipmentSummary,
  ImportShipmentRecord,
  TaxableBaseOverride
} from '../types';

/**
 * Calculates all apportioned values, KRA customs taxes, and unit landed costs
 * across all line items in an import commercial invoice / customs shipment.
 * Supports "Taxable Base Override" to match official KRA SAD entries without
 * corrupting original Commercial Invoice liability in Accounts Payable.
 */
export function calculateImportShipmentCosting(
  params: {
    exchangeRate: number;
    specificDutyUSDPerTonne?: number; // e.g. USD 750 / net tonne
    specificDutyRatePerTonne?: number; // fallback or legacy KES 97,500
    adValoremRatePct: number; // e.g. 25%
    idfRatePct: number; // 2.5%
    rdlRatePct: number; // 2.0%
    vatRatePct: number; // 16%
    mssLevyUSDRatePerTonne: number; // USD 1.75
    cocFeesUSD: number; // USD 600.00
    totalFreightUSD: number;
    totalInsuranceUSD: number;
    totalFreightKES?: number; // Box 9a Total Freight in KES
    totalInsuranceKES?: number; // Box 9b Total Insurance in KES
    portClearingFeesKES: number;
    targetMarkupPct: number; // e.g. 35%
    taxableBaseOverride?: TaxableBaseOverride;
    overrideCustomsValueKES?: number; // Box 9d Total Customs Value in KES
  },
  items: ImportShipmentLineItem[]
): ImportShipmentSummary {
  // 1. TRUE COMMERCIAL INVOICE BASE (ACCOUNTS PAYABLE REALITY - IMMUTABLE)
  const commFOB_USD = items.reduce((sum, item) => sum + (Number(item.fobUSD) || 0), 0);
  const commNetWeightKg = items.reduce((sum, item) => sum + (Number(item.netWeightKg) || 0), 0);
  const commGrossWeightKg = items.reduce((sum, item) => sum + (Number(item.grossWeightKg) || Number(item.netWeightKg) || 0), 0);
  const commExchangeRate = Number(params.exchangeRate) || 129.38999;
  const commFreightUSD = Number(params.totalFreightUSD) || 0;
  const commInsuranceUSD = Number(params.totalInsuranceUSD) || 0;
  const commCoCUSD = Number(params.cocFeesUSD) || 0;
  const portClearingFeesKES = Number(params.portClearingFeesKES) || 0;
  const targetMarkupPct = Number(params.targetMarkupPct) || 35;

  const commercialTotalLiabilityUSD = commFOB_USD + commFreightUSD + commInsuranceUSD + commCoCUSD;
  const commercialTotalLiabilityKES = commercialTotalLiabilityUSD * commExchangeRate;

  // 2. KRA CUSTOMS TAXABLE BASE DETERMINATION (SAD ASSESSMENT OVERRIDE OR AUTO-POPULATED)
  const isOverrideActive = Boolean(params.taxableBaseOverride?.isEnabled);
  const override = params.taxableBaseOverride;

  const taxableExchangeRate = isOverrideActive && override?.declaredExchangeRate !== undefined && Number(override.declaredExchangeRate) > 0
    ? Number(override.declaredExchangeRate)
    : commExchangeRate;

  const taxableFOB_USD = isOverrideActive && override?.declaredFOB_USD !== undefined
    ? Number(override.declaredFOB_USD)
    : commFOB_USD;

  const taxableNetWeightKg = isOverrideActive && override?.declaredNetWeightKg !== undefined && Number(override.declaredNetWeightKg) > 0
    ? Number(override.declaredNetWeightKg)
    : commNetWeightKg;

  const taxableGrossWeightKg = isOverrideActive && override?.declaredGrossWeightKg !== undefined && Number(override.declaredGrossWeightKg) > 0
    ? Number(override.declaredGrossWeightKg)
    : (isOverrideActive && taxableNetWeightKg > 0 ? taxableNetWeightKg : commGrossWeightKg);

  // Determine Total Freight in KES (Box 9a) and USD
  let totalTaxableFreightKES: number;
  let taxableFreightUSD: number;

  if (isOverrideActive && override?.declaredFreightKES !== undefined && Number(override.declaredFreightKES) > 0) {
    totalTaxableFreightKES = Number(override.declaredFreightKES);
    taxableFreightUSD = totalTaxableFreightKES / (taxableExchangeRate || 1);
  } else if (params.totalFreightKES !== undefined && Number(params.totalFreightKES) > 0) {
    totalTaxableFreightKES = Number(params.totalFreightKES);
    taxableFreightUSD = totalTaxableFreightKES / (taxableExchangeRate || 1);
  } else if (isOverrideActive && override?.declaredFreightUSD !== undefined) {
    taxableFreightUSD = Number(override.declaredFreightUSD);
    totalTaxableFreightKES = taxableFreightUSD * taxableExchangeRate;
  } else {
    taxableFreightUSD = commFreightUSD;
    totalTaxableFreightKES = taxableFreightUSD * taxableExchangeRate;
  }

  // Determine Total Insurance in KES (Box 9b) and USD
  let totalTaxableInsuranceKES: number;
  let taxableInsuranceUSD: number;

  if (isOverrideActive && override?.declaredInsuranceKES !== undefined && Number(override.declaredInsuranceKES) > 0) {
    totalTaxableInsuranceKES = Number(override.declaredInsuranceKES);
    taxableInsuranceUSD = totalTaxableInsuranceKES / (taxableExchangeRate || 1);
  } else if (params.totalInsuranceKES !== undefined && Number(params.totalInsuranceKES) > 0) {
    totalTaxableInsuranceKES = Number(params.totalInsuranceKES);
    taxableInsuranceUSD = totalTaxableInsuranceKES / (taxableExchangeRate || 1);
  } else if (isOverrideActive && override?.declaredInsuranceUSD !== undefined) {
    taxableInsuranceUSD = Number(override.declaredInsuranceUSD);
    totalTaxableInsuranceKES = taxableInsuranceUSD * taxableExchangeRate;
  } else {
    taxableInsuranceUSD = commInsuranceUSD;
    totalTaxableInsuranceKES = taxableInsuranceUSD * taxableExchangeRate;
  }

  // Determine Total Customs Value in KES (Box 9d / Box 46)
  // Exact Formula: Customs Value (KES) = (FOB USD * Exchange Rate) + Freight (KES) + Insurance (KES)
  let totalTaxableCustomsValueKES: number;
  let taxableCIF_USD: number;
  const hasDirectHeaderOverride =
    (isOverrideActive && override?.overrideCustomsValueKES !== undefined && Number(override.overrideCustomsValueKES) > 0) ||
    (params.overrideCustomsValueKES !== undefined && Number(params.overrideCustomsValueKES) > 0);

  if (isOverrideActive && override?.overrideCustomsValueKES !== undefined && Number(override.overrideCustomsValueKES) > 0) {
    totalTaxableCustomsValueKES = Number(override.overrideCustomsValueKES);
    taxableCIF_USD = totalTaxableCustomsValueKES / (taxableExchangeRate || 1);
  } else if (params.overrideCustomsValueKES !== undefined && Number(params.overrideCustomsValueKES) > 0) {
    totalTaxableCustomsValueKES = Number(params.overrideCustomsValueKES);
    taxableCIF_USD = totalTaxableCustomsValueKES / (taxableExchangeRate || 1);
  } else {
    totalTaxableCustomsValueKES = (taxableFOB_USD * taxableExchangeRate) + totalTaxableFreightKES + totalTaxableInsuranceKES;
    taxableCIF_USD = totalTaxableCustomsValueKES / (taxableExchangeRate || 1);
  }

  // Statutory Tax Rates
  const adValoremRatePct = Number(params.adValoremRatePct) || 25;
  const idfRatePct = Number(params.idfRatePct) || 2.5;
  const rdlRatePct = Number(params.rdlRatePct) || 2.0;
  const vatRatePct = Number(params.vatRatePct) || 16.0;
  const mssLevyUSDRatePerTonne = Number(params.mssLevyUSDRatePerTonne) || 1.75;

  const specificDutyUSDPerTonne = params.specificDutyUSDPerTonne !== undefined ? Number(params.specificDutyUSDPerTonne) : 750;
  // Specific duty rate floats dynamically with KRA exchange rate: USD 750 * Taxable Exchange Rate
  const specificDutyRatePerTonne = specificDutyUSDPerTonne > 0 
    ? specificDutyUSDPerTonne * taxableExchangeRate 
    : (Number(params.specificDutyRatePerTonne) || 97500);

  // 3. APPORTIONMENT ACROSS LINE ITEMS
  // Mirror KRA ICMS algorithm:
  // - Freight is apportioned strictly by Gross Weight ratio
  // - Insurance is apportioned strictly by FOB ratio
  // - Customs Value (KES) = (Line FOB USD * Exchange Rate) + Line Freight (KES) + Line Insurance (KES)
  const computedItems: ComputedImportLineItem[] = items.map((item) => {
    const itemFob = Number(item.fobUSD) || 0;
    const itemNetKg = Number(item.netWeightKg) || 0;
    const itemGrossKg = Number(item.grossWeightKg) || itemNetKg;

    // Commercial Ratios
    const commFobRatio = commFOB_USD > 0 ? itemFob / commFOB_USD : 0;
    const commWeightRatio = commNetWeightKg > 0 ? itemNetKg / commNetWeightKg : 0;
    const commGrossRatio = commGrossWeightKg > 0 ? itemGrossKg / commGrossWeightKg : commWeightRatio;

    // Item Declared / Taxable Ratios
    const itemOverride = override?.itemOverrides?.[item.id];
    let itemTaxableFobUSD: number;
    let itemTaxableNetKg: number;
    let itemTaxableGrossKg: number;

    if (isOverrideActive && itemOverride) {
      itemTaxableFobUSD = itemOverride.declaredFobUSD !== undefined ? Number(itemOverride.declaredFobUSD) : (taxableFOB_USD * commFobRatio);
      itemTaxableNetKg = itemOverride.declaredNetWeightKg !== undefined ? Number(itemOverride.declaredNetWeightKg) : (taxableNetWeightKg * commWeightRatio);
      itemTaxableGrossKg = itemOverride.declaredGrossWeightKg !== undefined ? Number(itemOverride.declaredGrossWeightKg) : (taxableGrossWeightKg * commGrossRatio);
    } else {
      itemTaxableFobUSD = commFOB_USD > 0 ? (taxableFOB_USD * itemFob / commFOB_USD) : itemFob;
      itemTaxableNetKg = commNetWeightKg > 0 ? (taxableNetWeightKg * itemNetKg / commNetWeightKg) : itemNetKg;
      itemTaxableGrossKg = commGrossWeightKg > 0 ? (taxableGrossWeightKg * itemGrossKg / commGrossWeightKg) : itemGrossKg;
    }

    // Line FOB in KES
    const lineFobKES = itemTaxableFobUSD * taxableExchangeRate;

    // Line Freight in KES (KRA ICMS: apportioned by Gross Weight)
    const lineGrossRatio = taxableGrossWeightKg > 0 ? (itemTaxableGrossKg / taxableGrossWeightKg) : commGrossRatio;
    let lineFreightKES: number;
    if (itemOverride?.freightKES !== undefined && Number(itemOverride.freightKES) > 0) {
      lineFreightKES = Number(itemOverride.freightKES);
    } else if (item.freightKES !== undefined && Number(item.freightKES) > 0) {
      lineFreightKES = Number(item.freightKES);
    } else if (item.freightUSD !== undefined && Number(item.freightUSD) > 0) {
      lineFreightKES = Number(item.freightUSD) * taxableExchangeRate;
    } else {
      lineFreightKES = totalTaxableFreightKES * lineGrossRatio;
    }
    const apportionedFreightUSD = lineFreightKES / (taxableExchangeRate || 1);

    // Line Insurance in KES (KRA ICMS: apportioned by FOB value)
    const lineFobRatio = taxableFOB_USD > 0 ? (itemTaxableFobUSD / taxableFOB_USD) : commFobRatio;
    let lineInsuranceKES: number;
    if (itemOverride?.insuranceKES !== undefined && Number(itemOverride.insuranceKES) > 0) {
      lineInsuranceKES = Number(itemOverride.insuranceKES);
    } else if (item.insuranceKES !== undefined && Number(item.insuranceKES) > 0) {
      lineInsuranceKES = Number(item.insuranceKES);
    } else if (item.insuranceUSD !== undefined && Number(item.insuranceUSD) > 0) {
      lineInsuranceKES = Number(item.insuranceUSD) * taxableExchangeRate;
    } else {
      lineInsuranceKES = totalTaxableInsuranceKES * lineFobRatio;
    }
    const apportionedInsuranceUSD = lineInsuranceKES / (taxableExchangeRate || 1);

    // Line Customs Value in KES
    // Exact Formula: Customs Value (KES) = (FOB USD * Exchange Rate) + Line Freight (KES) + Line Insurance (KES)
    let customsValueKES: number;
    if (itemOverride?.customsValueKES !== undefined && Number(itemOverride.customsValueKES) > 0) {
      customsValueKES = Number(itemOverride.customsValueKES);
    } else if (item.customsValueKES !== undefined && Number(item.customsValueKES) > 0) {
      customsValueKES = Number(item.customsValueKES);
    } else if (hasDirectHeaderOverride) {
      const unscaledLineCIF = lineFobKES + lineFreightKES + lineInsuranceKES;
      const unscaledTotalCIF = (taxableFOB_USD * taxableExchangeRate) + totalTaxableFreightKES + totalTaxableInsuranceKES;
      customsValueKES = unscaledTotalCIF > 0 ? (totalTaxableCustomsValueKES * unscaledLineCIF / unscaledTotalCIF) : (totalTaxableCustomsValueKES * commFobRatio);
    } else {
      customsValueKES = lineFobKES + lineFreightKES + lineInsuranceKES;
    }

    const cifUSD = customsValueKES / (taxableExchangeRate || 1);

    // Other non-customs logistics apportionment
    const apportionedCoCUSD = commCoCUSD * commFobRatio;
    const apportionedCoCKES = apportionedCoCUSD * commExchangeRate;
    const apportionedPortClearingKES = portClearingFeesKES * commFobRatio;

    // MSS Levy (6401) on Gross Weight
    const itemGrossTonnes = itemTaxableGrossKg / 1000;
    const apportionedMssUSD = itemGrossTonnes * mssLevyUSDRatePerTonne;
    const apportionedMssKES = Math.round(apportionedMssUSD * taxableExchangeRate);

    // KRA Duty Rule: Max(Ad-Valorem, Specific Duty)
    const adValoremDutyKES = customsValueKES * (adValoremRatePct / 100);
    const netWeightTonnes = itemTaxableNetKg / 1000;
    const specificDutyKES = netWeightTonnes * specificDutyRatePerTonne;
    const dutyAppliedKES = Math.max(adValoremDutyKES, specificDutyKES);
    const dutyRuleApplied: 'ad_valorem' | 'specific_duty' =
      adValoremDutyKES >= specificDutyKES ? 'ad_valorem' : 'specific_duty';

    // KRA Tax Heads (rounded to integer shillings as per KRA ICMS SAD assessment)
    const importDuty1002KES = Math.round(dutyAppliedKES);
    const idf1801KES = Math.round(customsValueKES * (idfRatePct / 100));
    const rdl6001KES = Math.round(customsValueKES * (rdlRatePct / 100));

    // Under EAC Customs Management Act & KRA ICMS:
    // VAT Base = Customs Value (KES) + Import Duty 1002 (KES)
    // Note: IDF (1801) and RDL (6001) are NOT part of VAT Tax Base!
    const vatBaseKES = customsValueKES + importDuty1002KES;
    const vat1202KES = Math.round(vatBaseKES * (vatRatePct / 100));
    const mss6401KES = apportionedMssKES;

    const totalTaxesKES = importDuty1002KES + idf1801KES + rdl6001KES + vat1202KES + mss6401KES;

    // Landed Cost to Inventory:
    // Commercial Purchase Cost (AP to supplier converted at actual contract FX) + Actual KRA Taxes Paid + CoC + Port/Clearing
    const itemCommercialPurchaseCostKES = (itemFob + (commFreightUSD * commFobRatio) + (commInsuranceUSD * commFobRatio)) * commExchangeRate;
    const totalLandedCostKES =
      itemCommercialPurchaseCostKES + totalTaxesKES + apportionedCoCKES + apportionedPortClearingKES;

    // Unit Landed Costing
    let fabricLengthMetres: number | undefined;
    let landedCostPerUnit = 0;
    let landedCostPerUnitExclVat = 0;

    const gsm = Number(item.gsm) || 0;
    const widthCm = Number(item.widthCm) || 0;

    if (gsm > 0 && widthCm > 0) {
      const widthM = widthCm / 100;
      fabricLengthMetres = (itemNetKg * 1000) / (gsm * widthM);
      if (fabricLengthMetres > 0) {
        landedCostPerUnit = totalLandedCostKES / fabricLengthMetres;
        landedCostPerUnitExclVat = (totalLandedCostKES - vat1202KES) / fabricLengthMetres;
      }
    } else {
      if (itemNetKg > 0) {
        landedCostPerUnit = totalLandedCostKES / itemNetKg;
        landedCostPerUnitExclVat = (totalLandedCostKES - vat1202KES) / itemNetKg;
      }
    }

    const suggestedRetailPrice = landedCostPerUnit * (1 + targetMarkupPct / 100);
    const projectedGrossProfitPerUnit = suggestedRetailPrice - landedCostPerUnit;

    return {
      ...item,
      fobRatio: commFobRatio,
      weightRatio: commWeightRatio,
      apportionedFreightUSD,
      apportionedInsuranceUSD,
      lineFobKES,
      lineFreightKES,
      lineInsuranceKES,
      vatBaseKES,
      apportionedCoCUSD,
      apportionedCoCKES,
      apportionedPortClearingKES,
      apportionedMssUSD,
      apportionedMssKES,
      cifUSD,
      customsValueKES,
      adValoremDutyKES,
      specificDutyKES,
      specificRateKESPerTonne: specificDutyRatePerTonne,
      dutyAppliedKES,
      dutyRuleApplied,
      importDuty1002KES,
      idf1801KES,
      rdl6001KES,
      vat1202KES,
      mss6401KES,
      totalTaxesKES,
      totalLandedCostKES,
      fabricLengthMetres,
      landedCostPerUnit,
      landedCostPerUnitExclVat,
      suggestedRetailPrice,
      projectedGrossProfitPerUnit
    };
  });

  const totalCIF_USD = taxableCIF_USD;
  const totalCustomsValueKES = totalTaxableCustomsValueKES;
  const totalVATBaseKES = computedItems.reduce((sum, i) => sum + i.vatBaseKES, 0);
  const totalImportDuty1002KES = computedItems.reduce((sum, i) => sum + i.importDuty1002KES, 0);
  const totalIDF1801KES = computedItems.reduce((sum, i) => sum + i.idf1801KES, 0);
  const totalRDL6001KES = computedItems.reduce((sum, i) => sum + i.rdl6001KES, 0);
  const totalVAT1202KES = computedItems.reduce((sum, i) => sum + i.vat1202KES, 0);
  const totalMSS6401KES = computedItems.reduce((sum, i) => sum + i.mss6401KES, 0);
  const totalKRATaxesKES = totalImportDuty1002KES + totalIDF1801KES + totalRDL6001KES + totalVAT1202KES + totalMSS6401KES;
  const totalCoCKES = computedItems.reduce((sum, i) => sum + i.apportionedCoCKES, 0);
  const totalPortClearingKES = computedItems.reduce((sum, i) => sum + i.apportionedPortClearingKES, 0);
  const totalLandedInventoryKES = computedItems.reduce((sum, i) => sum + i.totalLandedCostKES, 0);

  const totalFabricMetres = computedItems
    .filter(i => (i.fabricLengthMetres || 0) > 0)
    .reduce((sum, i) => sum + (i.fabricLengthMetres || 0), 0);

  const totalYarnKgs = computedItems
    .filter(i => !(i.fabricLengthMetres && i.fabricLengthMetres > 0))
    .reduce((sum, i) => sum + (i.netWeightKg || 0), 0);

  // 4. BASELINE PURE COMMERCIAL INVOICE TAX COMPUTATION (FOR REAL-TIME VARIANCE & TAX SAVINGS AUDITING)
  const pureCommFreightKES = commFreightUSD * commExchangeRate;
  const pureCommInsuranceKES = commInsuranceUSD * commExchangeRate;
  const pureCommCustomsValueKES = (commFOB_USD * commExchangeRate) + pureCommFreightKES + pureCommInsuranceKES;
  const pureCommSpecificDutyKES = (commNetWeightKg / 1000) * (specificDutyUSDPerTonne * commExchangeRate);
  const pureCommAdValoremDutyKES = pureCommCustomsValueKES * (adValoremRatePct / 100);
  const pureCommDuty1002KES = Math.round(Math.max(pureCommAdValoremDutyKES, pureCommSpecificDutyKES));
  const pureCommIDF1801KES = Math.round(pureCommCustomsValueKES * (idfRatePct / 100));
  const pureCommRDL6001KES = Math.round(pureCommCustomsValueKES * (rdlRatePct / 100));
  const pureCommVATBaseKES = pureCommCustomsValueKES + pureCommDuty1002KES;
  const pureCommVAT1202KES = Math.round(pureCommVATBaseKES * (vatRatePct / 100));
  const pureCommMSS6401KES = Math.round((commGrossWeightKg / 1000) * mssLevyUSDRatePerTonne * commExchangeRate);
  const pureCommTotalTaxesKES = pureCommDuty1002KES + pureCommIDF1801KES + pureCommRDL6001KES + pureCommVAT1202KES + pureCommMSS6401KES;

  const varianceFOB_USD = taxableFOB_USD - commFOB_USD;
  const varianceFOB_Pct = commFOB_USD > 0 ? (varianceFOB_USD / commFOB_USD) * 100 : 0;
  const varianceNetWeightKg = taxableNetWeightKg - commNetWeightKg;
  const varianceNetWeightPct = commNetWeightKg > 0 ? (varianceNetWeightKg / commNetWeightKg) * 100 : 0;
  const varianceCustomsValueKES = totalTaxableCustomsValueKES - pureCommCustomsValueKES;

  return {
    totalFOB_USD: taxableFOB_USD,
    totalNetWeightKg: taxableNetWeightKg,
    totalGrossWeightKg: taxableGrossWeightKg,
    totalFreightUSD: taxableFreightUSD,
    totalInsuranceUSD: taxableInsuranceUSD,
    totalFreightKES: totalTaxableFreightKES,
    totalInsuranceKES: totalTaxableInsuranceKES,
    totalCIF_USD,
    totalCustomsValueKES,
    totalVATBaseKES,
    specificRateKESPerTonne: specificDutyRatePerTonne,
    totalImportDuty1002KES,
    totalIDF1801KES,
    totalRDL6001KES,
    totalVAT1202KES,
    totalMSS6401KES,
    totalKRATaxesKES,
    totalCoCKES,
    totalPortClearingKES,
    totalLandedInventoryKES,
    totalFabricMetres,
    totalYarnKgs,
    items: computedItems,
    accountsPayable: {
      supplierFOB_USD: commFOB_USD,
      commercialFreightUSD: commFreightUSD,
      commercialInsuranceUSD: commInsuranceUSD,
      commercialCoCUSD: commCoCUSD,
      totalCommercialLiabilityUSD: commercialTotalLiabilityUSD,
      totalCommercialLiabilityKES: commercialTotalLiabilityKES,
      commercialExchangeRate: commExchangeRate,
      commercialNetWeightKg: commNetWeightKg,
      commercialGrossWeightKg: commGrossWeightKg,
      isProtectedFromKRAOverride: true
    },
    taxableBaseSummary: {
      isOverridden: isOverrideActive,
      taxableCustomsValueKES: totalTaxableCustomsValueKES,
      taxableNetWeightKg,
      taxableGrossWeightKg,
      taxableFOB_USD,
      taxableFreightUSD,
      taxableInsuranceUSD,
      taxableExchangeRate,
      varianceFOB_USD,
      varianceFOB_Pct,
      varianceNetWeightKg,
      varianceNetWeightPct,
      varianceCustomsValueKES,
      taxImpactKES: {
        dutyDiffKES: totalImportDuty1002KES - pureCommDuty1002KES,
        idfDiffKES: totalIDF1801KES - pureCommIDF1801KES,
        rdlDiffKES: totalRDL6001KES - pureCommRDL6001KES,
        vatDiffKES: totalVAT1202KES - pureCommVAT1202KES,
        mssDiffKES: totalMSS6401KES - pureCommMSS6401KES,
        totalTaxDiffKES: totalKRATaxesKES - pureCommTotalTaxesKES
      }
    }
  };
}

// -----------------------------------------------------------------------------
// Real-world Presets based on Provided Commercial Invoices & KRA SAD Entries
// -----------------------------------------------------------------------------
export const PRESET_INVOICE_26PA222: ImportShipmentRecord = {
  id: 'IMP-2026-PA222',
  shipmentNumber: 'IMP-2026-PA222',
  invoiceNumber: '26PA222',
  invoiceDate: '2026-06-03',
  supplierName: 'ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD.',
  supplierCountry: 'CHINA',
  consigneeName: 'TAJI KNITTERS LIMITED',
  consigneePin: 'P051656758Y',
  declarantName: 'Blue Pearl Logistics Limited',
  declarantPin: 'P051506858S',
  customsEntryNo: '26EMKIM400826138',
  kraEslipRef: '1020260001007429',
  portOfEntry: 'ICD EMBAKASI',
  destinationLocationId: 'main_store',
  exchangeRate: 129.47,
  specificDutyUSDPerTonne: 750,
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
  notes: 'Commercial Invoice 26PA222 from Zhejiang Puan Textile. AP Supplier Liability: USD 46,974.49 (Net Wt 22,312.3 kg). Official KRA SAD 26EMKIM400968589 assessment: Declared FOB USD 36,900.00, Net Wt 22,600.0 kg.',
  commercialInvoiceFOB_USD: 46974.49,
  commercialInvoiceNetWeightKg: 22312.3,
  taxableBaseOverride: {
    isEnabled: false,
    overrideCustomsValueKES: 5298546.07,
    declaredFOB_USD: 36900.00,
    declaredFreightUSD: 3999.8949,
    declaredInsuranceUSD: 24.9993,
    declaredFreightKES: 517866.39,
    declaredInsuranceKES: 3236.66,
    declaredExchangeRate: 129.47,
    declaredNetWeightKg: 22600.0,
    declaredGrossWeightKg: 22600.0,
    customsEntryNo: '26EMKIM400968589',
    kraEslipRef: '1020260001009685',
    valuationMethod: 'benchmark_adjusted',
    justificationReason: 'Official KRA ICMS SAD assessment 26EMKIM400968589 at ICD Embakasi (Declared FOB USD 36,900.00 vs Commercial FOB USD 46,974.49)'
  },
  lineItems: [
    {
      id: 'LI-001',
      description: '100% Poly Special Derek 150CM Cutable 260GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 45609.90, // 21,719 kg @ $2.10/kg
      netWeightKg: 21719.0,
      grossWeightKg: 21950.0,
      gsm: 260,
      widthCm: 150,
      matchedProductId: 'BATCH-DRK-101'
    },
    {
      id: 'LI-002',
      description: '100% Poly Interlock 150CM Cutable 120GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 1364.59, // 593.3 kg @ $2.30/kg
      netWeightKg: 593.3,
      grossWeightKg: 600.0,
      gsm: 120,
      widthCm: 150,
      matchedProductId: 'BATCH-DRK-102'
    }
  ]
};

export const PRESET_SAD_26EMKIM400968589: ImportShipmentRecord = {
  id: 'SAD-26EMKIM400968589',
  shipmentNumber: 'SAD-2026-400968589',
  invoiceNumber: '26PA222 (SAD ICMS Entry 26EMKIM400968589)',
  invoiceDate: '2026-06-15',
  supplierName: 'ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD.',
  supplierCountry: 'CHINA',
  consigneeName: 'TAJI KNITTERS LIMITED',
  consigneePin: 'P051656758Y',
  declarantName: 'Blue Pearl Logistics Limited',
  declarantPin: 'P051506858S',
  customsEntryNo: '26EMKIM400968589',
  kraEslipRef: '1020260001009685',
  portOfEntry: 'ICD EMBAKASI',
  destinationLocationId: 'main_store',
  exchangeRate: 129.47,
  specificDutyUSDPerTonne: 750, // USD 750 / net tonne dynamically converted via 129.47 = KES 97,102.50 / tonne
  specificDutyRatePerTonne: 97102.50,
  adValoremRatePct: 25.0,
  idfRatePct: 2.5,
  rdlRatePct: 2.0,
  vatRatePct: 16.0,
  mssLevyUSDRatePerTonne: 1.75,
  cocFeesUSD: 0.0, // CoC set to 0 in customs valuation base as per KRA rules (secondary handling cost)
  totalFreightUSD: 3999.8949, // KES 517,866.39 / 129.47
  totalInsuranceUSD: 24.9993, // KES 3,236.66 / 129.47
  totalFreightKES: 517866.39, // Box 9a Total Freight in KES
  totalInsuranceKES: 3236.66, // Box 9b Total Insurance in KES
  overrideCustomsValueKES: 5298546.07, // Box 9d Total Customs Value in KES
  isSadOverrideActive: true,
  portClearingFeesKES: 180000.0,
  targetMarkupPct: 35.0,
  status: 'assessed',
  notes: 'Official KRA SAD Entry 26EMKIM400968589 (Reconciled from Proforma 26PA222). Declared FOB USD 36,900.00, Customs Value KES 5,298,546.07, Total Tax KSh 3,636,966.00.',
  taxableBaseOverride: {
    isEnabled: true,
    overrideCustomsValueKES: 5298546.07,
    declaredFOB_USD: 36900.00,
    declaredFreightUSD: 3999.8949,
    declaredInsuranceUSD: 24.9993,
    declaredFreightKES: 517866.39,
    declaredInsuranceKES: 3236.66,
    declaredExchangeRate: 129.47,
    declaredNetWeightKg: 22600.0,
    declaredGrossWeightKg: 22600.0,
    customsEntryNo: '26EMKIM400968589',
    kraEslipRef: '1020260001009685',
    valuationMethod: 'benchmark_adjusted',
    justificationReason: 'Official KRA ICMS SAD assessment 26EMKIM400968589 at ICD Embakasi',
    itemOverrides: {
      'LI-SAD-001': {
        declaredFobUSD: 36000.00,
        declaredNetWeightKg: 22000.0,
        declaredGrossWeightKg: 22000.0,
        freightKES: 504117.73,
        insuranceKES: 3157.72,
        customsValueKES: 5168195.46
      },
      'LI-SAD-002': {
        declaredFobUSD: 900.00,
        declaredNetWeightKg: 600.0,
        declaredGrossWeightKg: 600.0,
        freightKES: 13748.67,
        insuranceKES: 78.94,
        customsValueKES: 130350.61
      }
    }
  },
  lineItems: [
    {
      id: 'LI-SAD-001',
      description: '100% Poly Special Derek 150CM Cutable 260GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 36000.00,
      netWeightKg: 22000.0,
      grossWeightKg: 22000.0,
      freightKES: 504117.73,
      insuranceKES: 3157.72,
      customsValueKES: 5168195.46,
      gsm: 260,
      widthCm: 150,
      matchedProductId: 'BATCH-DRK-101'
    },
    {
      id: 'LI-SAD-002',
      description: '100% Poly Interlock 150CM Cutable 120GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 900.00,
      netWeightKg: 600.0,
      grossWeightKg: 600.0,
      freightKES: 13748.67,
      insuranceKES: 78.94,
      customsValueKES: 130350.61,
      gsm: 120,
      widthCm: 150,
      matchedProductId: 'BATCH-DRK-102'
    }
  ]
};

export const PRESET_SAD_UDEY_UDYOG: ImportShipmentRecord = {
  id: 'IMP-2026-UDEY-036',
  shipmentNumber: 'IMP-2026-UDEY-036',
  invoiceNumber: 'UU/OI-EX-036/25-26',
  invoiceDate: '2026-03-17',
  supplierName: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
  supplierCountry: 'INDIA',
  consigneeName: 'TAJI KNITTERS LIMITED',
  consigneePin: 'P051656758Y',
  declarantName: 'Blue Pearl Logistics Limited',
  declarantPin: 'P051506858S',
  customsEntryNo: '26EMKIM400955090',
  kraEslipRef: '1020260001007429',
  portOfEntry: 'MOMBASA PORT / ICD EMBAKASI',
  destinationLocationId: 'main_store',
  exchangeRate: 129.389992176,
  specificDutyRatePerTonne: 97500,
  adValoremRatePct: 10.0, // 10% duty tariff rate for yarn as per SAD ICMS
  idfRatePct: 2.5,
  rdlRatePct: 2.0,
  vatRatePct: 16.0,
  mssLevyUSDRatePerTonne: 1.75,
  cocFeesUSD: 0.0,
  totalFreightUSD: 1975.0,
  totalInsuranceUSD: 14.38,
  portClearingFeesKES: 145000.0,
  targetMarkupPct: 30.0,
  status: 'assessed',
  notes: 'Commercial Invoice UU/OI-EX-036/25-26 & Packing List. 543 Bags in 1x40FT Container (NYKU 4933087/40) via Shipping Line ONE LINE. 2/24 NM 100% Acrylic High Bulk Dyed Yarn on Cones from Ludhiana, India. Advance $25,000.00 & balance against B/L. Total Net Wt: 12,940.600 kg, Gross Wt: 13,415.440 kg. Rate: $4.20/kg CIF USD 54,360.52.',
  lineItems: [
    {
      id: 'LI-YRN-26B020',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade BLACK 3061 (Lot 26B020)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 2811.48,
      netWeightKg: 669.400,
      grossWeightKg: 694.060,
      matchedProductId: 'BATCH-YRN-26B020',
      sku: 'TJI-YRN-26B020',
      dyeLot: '26B020',
      shadeCode: 'BLACK 3061',
      bagsCount: 28,
      packagesCount: 28,
      packageDetails: '27 standard bags @ 24.000 kg + 1 part bag @ 21.400 kg',
      bagNumberRange: '01 TO 28',
      colorName: 'Black 3061',
      colorHex: '#0a0a0a',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C002',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade MAROON-3059 (Lot 26C002)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 10635.24,
      netWeightKg: 2532.200,
      grossWeightKg: 2625.100,
      matchedProductId: 'BATCH-YRN-26C002',
      sku: 'TJI-YRN-26C002',
      dyeLot: '26C002',
      shadeCode: 'MAROON-3059',
      bagsCount: 106,
      packagesCount: 106,
      packageDetails: '105 standard bags @ 24.000 kg + 1 part bag @ 12.200 kg',
      bagNumberRange: '29 TO 134',
      colorName: 'Maroon 3059',
      colorHex: '#7f1d1d',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C007',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade GREEN-4551 (Lot 26C007)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 6229.86,
      netWeightKg: 1483.300,
      grossWeightKg: 1537.580,
      matchedProductId: 'BATCH-YRN-26C007',
      sku: 'TJI-YRN-26C007',
      dyeLot: '26C007',
      shadeCode: 'GREEN-4551',
      bagsCount: 62,
      packagesCount: 62,
      packageDetails: '61 standard bags @ 24.000 kg + 1 part bag @ 19.300 kg',
      bagNumberRange: '135 TO 196',
      colorName: 'Green 4551',
      colorHex: '#14532d',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C001',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade NEW NAVY-3075 (Lot 26C001)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 13796.16,
      netWeightKg: 3284.800,
      grossWeightKg: 3405.280,
      matchedProductId: 'BATCH-YRN-26C001',
      sku: 'TJI-YRN-26C001',
      dyeLot: '26C001',
      shadeCode: 'NEW NAVY-3075',
      bagsCount: 137,
      packagesCount: 137,
      packageDetails: '136 standard bags @ 24.000 kg + 1 part bag @ 20.800 kg',
      bagNumberRange: '197 TO 333',
      colorName: 'New Navy 3075',
      colorHex: '#1e3a8a',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C003',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade RED-3025 (Lot 26C003)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 6230.28,
      netWeightKg: 1483.400,
      grossWeightKg: 1537.680,
      matchedProductId: 'BATCH-YRN-26C003',
      sku: 'TJI-YRN-26C003',
      dyeLot: '26C003',
      shadeCode: 'RED-3025',
      bagsCount: 62,
      packagesCount: 62,
      packageDetails: '61 standard bags @ 24.000 kg + 1 part bag @ 19.400 kg',
      bagNumberRange: '334 TO 395',
      colorName: 'Red 3025',
      colorHex: '#dc2626',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C006',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade NAVY KK (Lot 26C006)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 4455.36,
      netWeightKg: 1060.800,
      grossWeightKg: 1099.720,
      matchedProductId: 'BATCH-YRN-26C006',
      sku: 'TJI-YRN-26C006',
      dyeLot: '26C006',
      shadeCode: 'NAVY KK',
      bagsCount: 45,
      packagesCount: 45,
      packageDetails: '44 standard bags @ 24.000 kg + 1 part bag @ 4.800 kg',
      bagNumberRange: '396 TO 440',
      colorName: 'Navy KK',
      colorHex: '#0f172a',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C004',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade BEIGE-4930 (Lot 26C004)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 1487.64,
      netWeightKg: 354.200,
      grossWeightKg: 367.420,
      matchedProductId: 'BATCH-YRN-26C004',
      sku: 'TJI-YRN-26C004',
      dyeLot: '26C004',
      shadeCode: 'BEIGE-4930',
      bagsCount: 15,
      packagesCount: 15,
      packageDetails: '14 standard bags @ 24.000 kg + 1 part bag @ 18.200 kg',
      bagNumberRange: '441 TO 455',
      colorName: 'Beige 4930',
      colorHex: '#d4b996',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C010',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade ASKARI OLIVE (Lot 26C010)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 1459.92,
      netWeightKg: 347.600,
      grossWeightKg: 360.520,
      matchedProductId: 'BATCH-YRN-26C010',
      sku: 'TJI-YRN-26C010',
      dyeLot: '26C010',
      shadeCode: 'ASKARI OLIVE',
      bagsCount: 15,
      packagesCount: 15,
      packageDetails: '14 standard bags @ 24.000 kg + 1 part bag @ 11.600 kg',
      bagNumberRange: '456 TO 470',
      colorName: 'Askari Olive',
      colorHex: '#4d5d36',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C005',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade BROWN-4412 (Lot 26C005)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 1367.94,
      netWeightKg: 325.700,
      grossWeightKg: 337.640,
      matchedProductId: 'BATCH-YRN-26C005',
      sku: 'TJI-YRN-26C005',
      dyeLot: '26C005',
      shadeCode: 'BROWN-4412',
      bagsCount: 14,
      packagesCount: 14,
      packageDetails: '13 standard bags @ 24.000 kg + 1 part bag @ 13.700 kg',
      bagNumberRange: '471 TO 484',
      colorName: 'Brown 4412',
      colorHex: '#5c3a21',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C009',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade NAVY-4515M (Lot 26C009)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 4465.44,
      netWeightKg: 1063.200,
      grossWeightKg: 1102.120,
      matchedProductId: 'BATCH-YRN-26C009',
      sku: 'TJI-YRN-26C009',
      dyeLot: '26C009',
      shadeCode: 'NAVY-4515M',
      bagsCount: 45,
      packagesCount: 45,
      packageDetails: '44 standard bags @ 24.000 kg + 1 part bag @ 7.200 kg',
      bagNumberRange: '485 TO 529',
      colorName: 'Navy 4515M',
      colorHex: '#1d2d44',
      unit: 'kg'
    },
    {
      id: 'LI-YRN-26C008',
      description: '2/24 NM Acrylic High Bulk Yarn - Shade BLACK (Lot 26C008)',
      category: 'Yarns',
      hsCode: '5509.32.00',
      fobUSD: 1411.20,
      netWeightKg: 336.000,
      grossWeightKg: 348.320,
      matchedProductId: 'BATCH-YRN-26C008',
      sku: 'TJI-YRN-26C008',
      dyeLot: '26C008',
      shadeCode: 'BLACK',
      bagsCount: 14,
      packagesCount: 14,
      packageDetails: '14 standard bags @ 24.000 kg',
      bagNumberRange: '530 TO 543',
      colorName: 'Black',
      colorHex: '#000000',
      unit: 'kg'
    }
  ]
};

export const PRESET_SAD_UDEY_UDYOG_028 = PRESET_SAD_UDEY_UDYOG;

export const PRESET_FLEECE_CONTAINER: ImportShipmentRecord = {
  id: 'IMP-2026-FLC-774',
  shipmentNumber: 'IMP-2026-FLC-774',
  invoiceNumber: '26FLC-882',
  invoiceDate: '2026-08-15',
  supplierName: 'SHAOXING SHENGLI TEXTILE CO., LTD.',
  supplierCountry: 'CHINA',
  consigneeName: 'TAJI KNITTERS LIMITED',
  consigneePin: 'P051656758Y',
  declarantName: 'Blue Pearl Logistics Limited',
  declarantPin: 'P051506858S',
  customsEntryNo: '26EMKIM400988112',
  kraEslipRef: '1020260001099231',
  portOfEntry: 'MOMBASA PORT',
  destinationLocationId: 'main_store',
  exchangeRate: 129.50,
  specificDutyRatePerTonne: 97500,
  adValoremRatePct: 25.0,
  idfRatePct: 2.5,
  rdlRatePct: 2.0,
  vatRatePct: 16.0,
  mssLevyUSDRatePerTonne: 1.75,
  cocFeesUSD: 600.0,
  totalFreightUSD: 6200.0,
  totalInsuranceUSD: 20.0,
  portClearingFeesKES: 195000.0,
  targetMarkupPct: 35.0,
  status: 'draft',
  notes: 'Heavyweight Polar Fleece 280GSM Rolls container. 16,800 kg net weight.',
  lineItems: [
    {
      id: 'LI-FLC-001',
      description: '100% Polyester Heavy Polar Fleece 160CM 280GSM',
      category: 'Fleece',
      hsCode: '6001.22.00',
      fobUSD: 38640.00, // 16,800 kg @ $2.30/kg
      netWeightKg: 16800.0,
      grossWeightKg: 17150.0,
      gsm: 280,
      widthCm: 160,
      matchedProductId: 'BATCH-FLC-301'
    }
  ]
};
