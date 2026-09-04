import {
  ImportShipmentLineItem,
  ComputedImportLineItem,
  ImportShipmentSummary,
  ImportShipmentRecord
} from '../types';

/**
 * Calculates all apportioned values, KRA customs taxes, and unit landed costs
 * across all line items in an import commercial invoice / customs shipment.
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
    portClearingFeesKES: number;
    targetMarkupPct: number; // e.g. 35%
  },
  items: ImportShipmentLineItem[]
): ImportShipmentSummary {
  const totalFOB_USD = items.reduce((sum, item) => sum + (Number(item.fobUSD) || 0), 0);
  const totalNetWeightKg = items.reduce((sum, item) => sum + (Number(item.netWeightKg) || 0), 0);
  const totalGrossWeightKg = items.reduce((sum, item) => sum + (Number(item.grossWeightKg) || Number(item.netWeightKg) || 0), 0);

  const exchangeRate = Number(params.exchangeRate) || 129.38999;
  // Specific duty rate floats dynamically with KRA exchange rate: USD 750 * Exchange Rate (e.g. $750 * 129.47 = KES 97,102.50 / tonne)
  const specificDutyUSDPerTonne = params.specificDutyUSDPerTonne !== undefined ? Number(params.specificDutyUSDPerTonne) : 750;
  const specificDutyRatePerTonne = specificDutyUSDPerTonne > 0 
    ? specificDutyUSDPerTonne * exchangeRate 
    : (Number(params.specificDutyRatePerTonne) || 97500);

  const adValoremRatePct = Number(params.adValoremRatePct) || 25;
  const idfRatePct = Number(params.idfRatePct) || 2.5;
  const rdlRatePct = Number(params.rdlRatePct) || 2.0;
  const vatRatePct = Number(params.vatRatePct) || 16.0;
  const mssLevyUSDRatePerTonne = Number(params.mssLevyUSDRatePerTonne) || 1.75;
  const cocFeesUSD = Number(params.cocFeesUSD) || 0;
  const totalFreightUSD = Number(params.totalFreightUSD) || 0;
  const totalInsuranceUSD = Number(params.totalInsuranceUSD) || 0;
  const portClearingFeesKES = Number(params.portClearingFeesKES) || 0;
  const targetMarkupPct = Number(params.targetMarkupPct) || 35;

  // Total MSS Levy in USD: (Gross Weight Tonnes * USD 1.75)
  const totalGrossTonnes = totalGrossWeightKg / 1000;
  const totalMSS_USD = totalGrossTonnes * mssLevyUSDRatePerTonne;
  const totalMSS_KES = totalMSS_USD * exchangeRate;

  const computedItems: ComputedImportLineItem[] = items.map((item) => {
    const itemFob = Number(item.fobUSD) || 0;
    const itemNetKg = Number(item.netWeightKg) || 0;
    const itemGrossKg = Number(item.grossWeightKg) || itemNetKg;

    // Ratios
    const fobRatio = totalFOB_USD > 0 ? itemFob / totalFOB_USD : 0;
    const weightRatio = totalNetWeightKg > 0 ? itemNetKg / totalNetWeightKg : 0;

    // Apportionment by Value (FOB ratio) - use explicit item freight/insurance if provided, otherwise apportion
    const apportionedFreightUSD = item.freightUSD !== undefined && item.freightUSD > 0
      ? Number(item.freightUSD)
      : totalFreightUSD * fobRatio;
    const apportionedInsuranceUSD = item.insuranceUSD !== undefined && item.insuranceUSD > 0
      ? Number(item.insuranceUSD)
      : totalInsuranceUSD * fobRatio;
    const apportionedCoCUSD = cocFeesUSD * fobRatio;
    const apportionedCoCKES = apportionedCoCUSD * exchangeRate;
    const apportionedPortClearingKES = portClearingFeesKES * fobRatio;

    // MSS Levy (6401): Gross Weight (Tonnes) * USD 1.75 * Exchange Rate
    const itemGrossTonnes = itemGrossKg / 1000;
    const apportionedMssUSD = itemGrossTonnes * mssLevyUSDRatePerTonne;
    const apportionedMssKES = apportionedMssUSD * exchangeRate;

    // CIF USD & Customs Value (KES)
    const cifUSD = itemFob + apportionedFreightUSD + apportionedInsuranceUSD;
    const customsValueKES = cifUSD * exchangeRate;

    // Duty Rule: Max(Ad-Valorem, Specific Duty)
    const adValoremDutyKES = customsValueKES * (adValoremRatePct / 100);
    const netWeightTonnes = itemNetKg / 1000;
    const specificDutyKES = netWeightTonnes * specificDutyRatePerTonne;
    const dutyAppliedKES = Math.max(adValoremDutyKES, specificDutyKES);
    const dutyRuleApplied: 'ad_valorem' | 'specific_duty' =
      adValoremDutyKES >= specificDutyKES ? 'ad_valorem' : 'specific_duty';

    // KRA Tax Heads
    const importDuty1002KES = dutyAppliedKES;
    const idf1801KES = customsValueKES * (idfRatePct / 100);
    const rdl6001KES = customsValueKES * (rdlRatePct / 100);
    // VAT Base = Customs Value + Import Duty + IDF + RDL (16%)
    const vatBaseKES = customsValueKES + importDuty1002KES + idf1801KES + rdl6001KES;
    const vat1202KES = vatBaseKES * (vatRatePct / 100);
    const mss6401KES = apportionedMssKES;

    const totalTaxesKES = importDuty1002KES + idf1801KES + rdl6001KES + vat1202KES + mss6401KES;

    // Total Landed Cost (KES) = CIF (KES) + Total Taxes + CoC + Port/Clearing
    const totalLandedCostKES =
      customsValueKES + totalTaxesKES + apportionedCoCKES + apportionedPortClearingKES;

    // Unit Landed Costing
    let fabricLengthMetres: number | undefined;
    let landedCostPerUnit = 0;
    let landedCostPerUnitExclVat = 0;

    const gsm = Number(item.gsm) || 0;
    const widthCm = Number(item.widthCm) || 0;

    if (gsm > 0 && widthCm > 0) {
      // Fabric Formula: Length in meters = (Net Weight in kg * 1000) / (GSM * (Width in cm / 100))
      const widthM = widthCm / 100;
      fabricLengthMetres = (itemNetKg * 1000) / (gsm * widthM);
      if (fabricLengthMetres > 0) {
        landedCostPerUnit = totalLandedCostKES / fabricLengthMetres;
        landedCostPerUnitExclVat = (totalLandedCostKES - vat1202KES) / fabricLengthMetres;
      }
    } else {
      // Weight-based (Yarn / KG)
      if (itemNetKg > 0) {
        landedCostPerUnit = totalLandedCostKES / itemNetKg;
        landedCostPerUnitExclVat = (totalLandedCostKES - vat1202KES) / itemNetKg;
      }
    }

    const suggestedRetailPrice = landedCostPerUnit * (1 + targetMarkupPct / 100);
    const projectedGrossProfitPerUnit = suggestedRetailPrice - landedCostPerUnit;

    return {
      ...item,
      fobRatio,
      weightRatio,
      apportionedFreightUSD,
      apportionedInsuranceUSD,
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

  const totalCIF_USD = computedItems.reduce((sum, i) => sum + i.cifUSD, 0);
  const totalCustomsValueKES = computedItems.reduce((sum, i) => sum + i.customsValueKES, 0);
  const totalImportDuty1002KES = computedItems.reduce((sum, i) => sum + i.importDuty1002KES, 0);
  const totalIDF1801KES = computedItems.reduce((sum, i) => sum + i.idf1801KES, 0);
  const totalRDL6001KES = computedItems.reduce((sum, i) => sum + i.rdl6001KES, 0);
  const totalVAT1202KES = computedItems.reduce((sum, i) => sum + i.vat1202KES, 0);
  const totalMSS6401KES = computedItems.reduce((sum, i) => sum + i.mss6401KES, 0);
  const totalKRATaxesKES = computedItems.reduce((sum, i) => sum + i.totalTaxesKES, 0);
  const totalCoCKES = computedItems.reduce((sum, i) => sum + i.apportionedCoCKES, 0);
  const totalPortClearingKES = computedItems.reduce((sum, i) => sum + i.apportionedPortClearingKES, 0);
  const totalLandedInventoryKES = computedItems.reduce((sum, i) => sum + i.totalLandedCostKES, 0);

  const totalFabricMetres = computedItems
    .filter(i => (i.fabricLengthMetres || 0) > 0)
    .reduce((sum, i) => sum + (i.fabricLengthMetres || 0), 0);

  const totalYarnKgs = computedItems
    .filter(i => !(i.fabricLengthMetres && i.fabricLengthMetres > 0))
    .reduce((sum, i) => sum + (i.netWeightKg || 0), 0);

  return {
    totalFOB_USD,
    totalNetWeightKg,
    totalGrossWeightKg,
    totalFreightUSD,
    totalInsuranceUSD,
    totalCIF_USD,
    totalCustomsValueKES,
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
    items: computedItems
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
  notes: 'Proforma Commercial Invoice 26PA222 from Zhejiang Puan Textile. CNF Mombasa container carrying Derek & Interlock fabrics (FOB USD 46,974.49, Net Wt 22,312.3 kg).',
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
  totalFreightUSD: 5500.0,
  totalInsuranceUSD: 14.38,
  portClearingFeesKES: 180000.0,
  targetMarkupPct: 35.0,
  status: 'assessed',
  notes: 'Actual Customs Declaration Entry 26EMKIM400968589 (Reconciled from Proforma 26PA222). Declared FOB USD 36,900.00 and Total Net Weight 22,600.0 kg.',
  lineItems: [
    {
      id: 'LI-SAD-001',
      description: '100% Poly Special Derek 150CM Cutable 260GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 35800.00, // 22,000 kg declared
      netWeightKg: 22000.0,
      grossWeightKg: 22240.0,
      gsm: 260,
      widthCm: 150,
      matchedProductId: 'BATCH-DRK-101'
    },
    {
      id: 'LI-SAD-002',
      description: '100% Poly Interlock 150CM Cutable 120GSM',
      category: 'Dereck',
      hsCode: '6006.32.00',
      fobUSD: 1100.00, // 600 kg declared
      netWeightKg: 600.0,
      grossWeightKg: 610.0,
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
