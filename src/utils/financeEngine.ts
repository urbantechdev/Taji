import {
  SaleOrder,
  ProductBatch,
  BranchExpense,
  PayrollRecord,
  LedgerEntry,
  LocationInfo,
  BalanceSheetData,
  IncomeStatementData,
  CashFlowStatementData,
  FixedAsset,
  MpesaStatementItem
} from '../types';

/**
 * 2026 Kenya Statutory Payroll Calculator
 * - Monthly Personal Relief: KSh 2,400
 * - Insurance Relief: 15% of SHIF contribution (Max KSh 5,000/month) - Income Tax Act Section 31
 * - Affordable Housing Relief: 15% of Employee Housing Levy (Max KSh 9,000/month) - Income Tax Act Section 30A
 * - PAYE Tax Bands (Monthly):
 *    First KSh 24,000 @ 10%
 *    Next KSh 8,333 (24,001 - 32,333) @ 25%
 *    Next KSh 467,667 (32,334 - 500,000) @ 30%
 *    Next KSh 300,000 (500,001 - 800,000) @ 32.5%
 *    Above KSh 800,000 @ 35%
 * - NSSF Act 2013:
 *    Tier I (up to KSh 8,000 @ 6% = max KSh 480)
 *    Tier II (KSh 8,001 to KSh 72,000 @ 6% = max KSh 3,840)
 *    Total NSSF Employee max: KSh 4,320 (matched 100% by Employer)
 * - SHIF (Social Health Insurance Fund): 2.75% of Gross Salary (Minimum KSh 300)
 * - Affordable Housing Levy: 1.5% of Gross Salary (matched 1.5% by Employer)
 */
export function calculateKenyaStatutoryDeductions(grossSalary: number) {
  // 1. NSSF Calculation (Tier I & Tier II)
  const tier1Limit = 8000;
  const tier2Limit = 72000;

  let nssfTier1 = Math.min(grossSalary, tier1Limit) * 0.06;
  let nssfTier2 = 0;
  if (grossSalary > tier1Limit) {
    const tier2Taxable = Math.min(grossSalary, tier2Limit) - tier1Limit;
    nssfTier2 = tier2Taxable * 0.06;
  }
  const totalNssfEmployee = Math.round(nssfTier1 + nssfTier2);
  const totalNssfEmployer = totalNssfEmployee; // 100% matching

  // 2. SHIF Calculation (2.75% mandatory, minimum KSh 300)
  const shifDeduction = Math.max(300, Math.round(grossSalary * 0.0275));

  // 3. Affordable Housing Levy (1.5% employee + 1.5% employer)
  const housingLevyEmployee = Math.round(grossSalary * 0.015);
  const housingLevyEmployer = housingLevyEmployee;

  // 4. Taxable Pay = Gross - Allowable NSSF (NSSF is tax deductible in Kenya) - Housing Levy
  const taxablePay = Math.max(0, grossSalary - totalNssfEmployee - housingLevyEmployee);

  // 5. PAYE Calculation on Taxable Pay
  let grossPaye = 0;
  if (taxablePay <= 24000) {
    grossPaye = taxablePay * 0.10;
  } else if (taxablePay <= 32333) {
    grossPaye = 24000 * 0.10 + (taxablePay - 24000) * 0.25;
  } else if (taxablePay <= 500000) {
    grossPaye = 24000 * 0.10 + (32333 - 24000) * 0.25 + (taxablePay - 32333) * 0.30;
  } else if (taxablePay <= 800000) {
    grossPaye = 24000 * 0.10 + (32333 - 24000) * 0.25 + (500000 - 32333) * 0.30 + (taxablePay - 500000) * 0.325;
  } else {
    grossPaye = 24000 * 0.10 + (32333 - 24000) * 0.25 + (500000 - 32333) * 0.30 + (800000 - 500000) * 0.325 + (taxablePay - 800000) * 0.35;
  }

  // 6. Statutory Tax Reliefs (Personal + Insurance + Housing)
  const personalRelief = 2400; // Monthly statutory personal relief
  const insuranceRelief = Math.min(5000, Math.round(shifDeduction * 0.15)); // 15% of SHIF (Cap: KSh 5,000/mo)
  const housingRelief = Math.min(9000, Math.round(housingLevyEmployee * 0.15)); // 15% of Housing Levy (Cap: KSh 9,000/mo)
  const totalReliefs = personalRelief + insuranceRelief + housingRelief;

  const netPayeTax = Math.max(0, Math.round(grossPaye - totalReliefs));

  const totalDeductions = netPayeTax + totalNssfEmployee + shifDeduction + housingLevyEmployee;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    grossSalary,
    nssfTier1: Math.round(nssfTier1),
    nssfTier2: Math.round(nssfTier2),
    totalNssf: totalNssfEmployee,
    totalNssfEmployer,
    shifDeduction,
    housingLevy: housingLevyEmployee,
    housingLevyEmployer,
    taxablePay: Math.round(taxablePay),
    grossPaye: Math.round(grossPaye),
    personalRelief,
    insuranceRelief,
    housingRelief,
    totalReliefs,
    payeTax: netPayeTax,
    totalDeductions,
    netPay: netSalary
  };
}

/**
 * Autonomous Live Balance Sheet Generator with Real Fixed Assets Support
 */
export function generateLiveBalanceSheet(
  orders: SaleOrder[],
  products: ProductBatch[],
  locations: LocationInfo[],
  branchExpenses: BranchExpense[],
  payroll: PayrollRecord[],
  ledger: LedgerEntry[],
  fixedAssets?: FixedAsset[]
): BalanceSheetData {
  // 1. Current Assets
  // Cash & Equivalents = Sum of active branch cash floats + Net cash inflows from orders minus expenses/payroll
  const totalBranchFloats = locations.reduce((acc, loc) => acc + (loc.currentCashBalance || loc.openingFloat || 0), 0);
  const totalCashOrders = orders.filter(o => o.paymentMethod === 'Cash' || o.paymentMethod === 'M-Pesa').reduce((acc, o) => acc + o.grandTotal, 0);
  const totalCashExpenses = branchExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCashPayroll = payroll.reduce((acc, p) => acc + p.netPay, 0);
  const estimatedCashAndBank = Math.max(totalBranchFloats, totalBranchFloats + totalCashOrders - totalCashExpenses - totalCashPayroll);

  // Accounts Receivable (Cheque/Bank/Corporate orders pending clearance)
  const accountsReceivable = orders
    .filter(o => o.paymentMethod === 'Cheque' || o.paymentMethod === 'Bank Transfer')
    .reduce((acc, o) => acc + o.grandTotal, 0) * 0.15; // 15% pending clearance

  // Inventory Asset Value (Stock Qty * Cost Price across all locations)
  const inventoryAssetValue = products.reduce((acc, p) => {
    const totalQty = Object.values(p.locationStock || {}).reduce((s, q) => s + (q || 0), 0);
    return acc + (totalQty * (p.costPrice || p.unitPriceRetail * 0.6));
  }, 0);

  const totalCurrentAssets = estimatedCashAndBank + accountsReceivable + inventoryAssetValue;

  // 2. Fixed Assets (Fabric machinery, Cutting tables, Computers, Vehicles, Depot fixtures)
  let machineryAndFixtures = 0;
  let equipmentAndDepots = 0;
  let accumulatedDepreciation = 0;

  if (fixedAssets && fixedAssets.length > 0) {
    const activeAssets = fixedAssets.filter(a => a.status === 'In Service' || a.status === 'Under Maintenance');
    activeAssets.forEach(asset => {
      if (asset.category === 'plant_machinery_looms' || asset.category === 'store_pos_terminals_scales') {
        machineryAndFixtures += asset.costPrice;
      } else {
        equipmentAndDepots += asset.costPrice;
      }
      accumulatedDepreciation += (asset.accumulatedDepreciation || 0);
    });
  }

  const totalFixedAssets = Math.max(0, machineryAndFixtures + equipmentAndDepots - accumulatedDepreciation);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  // 3. Current Liabilities
  const vatLiabilityPayable = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const payrollTaxPayable = payroll.reduce((acc, p) => acc + p.payeTax + p.nssfDeduction + p.nhifDeduction + p.housingLevy, 0);
  const supplierAccountsPayable = 0;
  const totalCurrentLiabilities = vatLiabilityPayable + payrollTaxPayable + supplierAccountsPayable;

  // 4. Long-Term Liabilities
  const termLoans = 0;
  const totalLongTermLiabilities = termLoans;

  // 5. Equity
  const ownersCapital = 0;
  const retainedEarnings = Math.max(0, totalAssets - (totalCurrentLiabilities + totalLongTermLiabilities) - ownersCapital);
  const totalEquity = ownersCapital + retainedEarnings;

  return {
    currentAssets: {
      cashAndEquivalents: Math.round(estimatedCashAndBank),
      accountsReceivable: Math.round(accountsReceivable),
      inventoryAssetValue: Math.round(inventoryAssetValue),
      totalCurrentAssets: Math.round(totalCurrentAssets)
    },
    fixedAssets: {
      machineryAndFixtures: Math.round(machineryAndFixtures),
      equipmentAndDepots: Math.round(equipmentAndDepots),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      totalFixedAssets: Math.round(totalFixedAssets)
    },
    totalAssets: Math.round(totalAssets),
    currentLiabilities: {
      vatLiabilityPayable: Math.round(vatLiabilityPayable),
      payrollTaxPayable: Math.round(payrollTaxPayable),
      supplierAccountsPayable: Math.round(supplierAccountsPayable),
      totalCurrentLiabilities: Math.round(totalCurrentLiabilities)
    },
    longTermLiabilities: {
      termLoans,
      totalLongTermLiabilities
    },
    equity: {
      ownersCapital,
      retainedEarnings: Math.round(retainedEarnings),
      totalEquity: Math.round(totalEquity)
    },
    totalLiabilitiesAndEquity: Math.round(totalCurrentLiabilities + totalLongTermLiabilities + totalEquity)
  };
}

/**
 * KRA Capital Allowances (Wear & Tear) and Asset Depreciation Engine
 * - Computers & Software: 25% Reducing Balance
 * - Motor Vehicles & Logistics: 25% Reducing Balance
 * - Plant, Heavy Looms & Machinery: 10% Reducing Balance or Straight Line
 * - Office Furniture & Retail Fixtures: 12.5% Reducing Balance
 * - POS Hardware & Digital Scales: 25% Reducing Balance
 */
export function calculateAssetMonthlyDepreciation(asset: FixedAsset): {
  monthlyAmount: number;
  newAccumulated: number;
  newBookValue: number;
} {
  const annualRate = asset.kraWearAndTearRate || 0.125;
  let annualDepreciation = 0;
  
  if (asset.depreciationMethod === 'straight_line') {
    const depreciableCost = Math.max(0, asset.costPrice - (asset.salvageValue || 0));
    annualDepreciation = asset.usefulLifeYears > 0 ? depreciableCost / asset.usefulLifeYears : depreciableCost * annualRate;
  } else {
    // Reducing balance (standard KRA 2nd Schedule)
    const currentBookValue = Math.max(0, asset.costPrice - (asset.accumulatedDepreciation || 0));
    annualDepreciation = currentBookValue * annualRate;
  }

  const monthlyAmount = Math.round(annualDepreciation / 12);
  const currentAccumulated = asset.accumulatedDepreciation || 0;
  const maxAllowableDepreciation = Math.max(0, asset.costPrice - (asset.salvageValue || 0));
  const effectiveMonthly = Math.min(monthlyAmount, Math.max(0, maxAllowableDepreciation - currentAccumulated));
  
  const newAccumulated = currentAccumulated + effectiveMonthly;
  const newBookValue = Math.max(asset.salvageValue || 0, asset.costPrice - newAccumulated);

  return {
    monthlyAmount: effectiveMonthly,
    newAccumulated,
    newBookValue
  };
}

/**
 * Safaricom M-Pesa & Bank Statement Text / CSV Parser
 */
export function parseMpesaStatementText(rawText: string): MpesaStatementItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items: MpesaStatementItem[] = [];

  lines.forEach((line, index) => {
    // Support CSV format: ReceiptNo, CompletionTime, Details, OtherParty, PaidIn, Withdrawn, Balance
    const csvParts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    
    // Check if line looks like M-Pesa transaction (e.g. QJK... or R... or standard code)
    const refMatch = line.match(/\b([A-Z0-9]{8,12})\b/);
    if (!refMatch && csvParts.length < 3) return;

    const receiptNo = csvParts[0]?.match(/^[A-Z0-9]{8,12}$/) ? csvParts[0] : (refMatch ? refMatch[1] : `TX-${Date.now().toString().slice(-4)}-${index}`);
    
    // Extract amounts
    let paidIn = 0;
    let withdrawn = 0;
    let balance = 0;
    let tariffFee = 0;
    let otherParty = '';
    let details = 'Customer Payment to Till';

    if (csvParts.length >= 5) {
      paidIn = parseFloat(csvParts[4]?.replace(/[^0-9.]/g, '')) || 0;
      withdrawn = parseFloat(csvParts[5]?.replace(/[^0-9.]/g, '')) || 0;
      balance = parseFloat(csvParts[6]?.replace(/[^0-9.]/g, '')) || 0;
      otherParty = csvParts[3] || csvParts[2] || '';
      details = csvParts[2] || 'Customer Payment Received';
    } else {
      // Freeform parsing: look for currency amounts (e.g. KSh 4,500.00)
      const numMatches = line.match(/(?:KSh|KES)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi);
      if (numMatches && numMatches.length > 0) {
        const parsedNums = numMatches.map(m => parseFloat(m.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        paidIn = parsedNums[0] || 0;
        if (parsedNums.length > 1) balance = parsedNums[parsedNums.length - 1];
      }
      otherParty = line.length > 30 ? line.slice(0, 40) : line;
    }

    // Auto-calculate standard Safaricom tariff fee if applicable (e.g. 0.5% or standard slab)
    if (paidIn > 0 && paidIn <= 500) tariffFee = 0;
    else if (paidIn > 500 && paidIn <= 1000) tariffFee = 6;
    else if (paidIn > 1000 && paidIn <= 2500) tariffFee = 16;
    else if (paidIn > 2500 && paidIn <= 5000) tariffFee = 35;
    else if (paidIn > 5000) tariffFee = Math.min(110, Math.round(paidIn * 0.0055));

    if (paidIn > 0 || withdrawn > 0) {
      items.push({
        id: `STMT-${Date.now().toString().slice(-4)}-${index}`,
        receiptNo,
        completionTime: new Date().toISOString().split('T')[0],
        details,
        otherPartyInfo: otherParty || 'Customer M-Pesa Mobile Wallet',
        paidIn,
        withdrawn,
        balance,
        tariffFee,
        matchStatus: 'UNMATCHED_IN_POS'
      });
    }
  });

  return items;
}

/**
 * Automatic M-Pesa & Bank Statement vs POS Orders Reconciler
 */
export function reconcileMpesaStatementsWithOrders(
  statementItems: MpesaStatementItem[],
  orders: SaleOrder[]
): {
  reconciledItems: MpesaStatementItem[];
  matchedCount: number;
  unmatchedInPosCount: number;
  unmatchedOrdersCount: number;
  totalStatementPaidIn: number;
  totalPosMpesaVolume: number;
  totalSafaricomTariffFees: number;
  variance: number;
} {
  const mpesaOrders = orders.filter(o => o.paymentMethod === 'M-Pesa');
  const matchedOrderIds = new Set<string>();

  const reconciledItems = statementItems.map(item => {
    // 1. Try exact match on M-Pesa Reference
    let matchedOrder = mpesaOrders.find(
      o => o.paymentReference && o.paymentReference.trim().toUpperCase() === item.receiptNo.trim().toUpperCase()
    );

    // 2. Try match on Order ID or Amount + Customer Phone
    if (!matchedOrder) {
      matchedOrder = mpesaOrders.find(
        o => !matchedOrderIds.has(o.id) &&
             Math.abs(o.grandTotal - item.paidIn) < 0.01 &&
             (o.customerPhone && item.otherPartyInfo.includes(o.customerPhone.slice(-6)))
      );
    }

    // 3. Try match on Exact Amount if within single match candidate
    if (!matchedOrder && item.paidIn > 0) {
      matchedOrder = mpesaOrders.find(
        o => !matchedOrderIds.has(o.id) && Math.abs(o.grandTotal - item.paidIn) < 0.01
      );
    }

    if (matchedOrder) {
      matchedOrderIds.add(matchedOrder.id);
      const isExactAmount = Math.abs(matchedOrder.grandTotal - item.paidIn) < 0.01;
      return {
        ...item,
        matchedOrderId: matchedOrder.id,
        matchStatus: (isExactAmount ? 'MATCHED' : 'VARIANCE') as MpesaStatementItem['matchStatus'],
        varianceAmount: Number((item.paidIn - matchedOrder.grandTotal).toFixed(2)),
        notes: `Matched to POS Order #${matchedOrder.receiptNumber || matchedOrder.id}`
      };
    }

    return {
      ...item,
      matchStatus: 'UNMATCHED_IN_POS' as MpesaStatementItem['matchStatus'],
      notes: 'Payment received on Till but no matching POS receipt registered'
    };
  });

  const matchedCount = reconciledItems.filter(i => i.matchStatus === 'MATCHED').length;
  const unmatchedInPosCount = reconciledItems.filter(i => i.matchStatus === 'UNMATCHED_IN_POS').length;
  const unmatchedOrdersCount = mpesaOrders.filter(o => !matchedOrderIds.has(o.id)).length;
  
  const totalStatementPaidIn = statementItems.reduce((acc, i) => acc + i.paidIn, 0);
  const totalPosMpesaVolume = mpesaOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalSafaricomTariffFees = statementItems.reduce((acc, i) => acc + i.tariffFee, 0);
  const variance = totalStatementPaidIn - totalPosMpesaVolume;

  return {
    reconciledItems,
    matchedCount,
    unmatchedInPosCount,
    unmatchedOrdersCount,
    totalStatementPaidIn,
    totalPosMpesaVolume,
    totalSafaricomTariffFees,
    variance
  };
}

/**
 * Autonomous Live Income Statement (P&L) Generator
 */
export function generateLiveIncomeStatement(
  orders: SaleOrder[],
  products: ProductBatch[],
  branchExpenses: BranchExpense[],
  payroll: PayrollRecord[]
): IncomeStatementData {
  const grossSalesRevenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const vatAmount = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const netSalesRevenue = grossSalesRevenue - vatAmount;

  // Calculate exact Cost of Goods Sold (COGS) based on items sold
  let costOfGoodsSold = 0;
  orders.forEach(order => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.batchId);
      const unitCost = prod?.costPrice || (item.unitPrice * 0.6);
      costOfGoodsSold += (unitCost * item.quantity);
    });
  });

  const grossOperatingProfit = Math.max(0, netSalesRevenue - costOfGoodsSold);
  const grossMarginPercent = netSalesRevenue > 0 ? (grossOperatingProfit / netSalesRevenue) * 100 : 0;

  // Operating Expenses Breakdown - Pure live totals without mock minimums
  const rentAndLeases = branchExpenses.filter(e => e.category === 'Rent').reduce((acc, e) => acc + e.amount, 0);
  const utilitiesAndPower = branchExpenses.filter(e => e.category === 'Utilities').reduce((acc, e) => acc + e.amount, 0);
  const salariesAndWages = payroll.reduce((acc, p) => acc + p.grossPay, 0);
  const transportAndLogistics = branchExpenses.filter(e => e.category === 'Transport & Logistics').reduce((acc, e) => acc + e.amount, 0);
  const repairsAndSupplies = branchExpenses.filter(e => e.category === 'Staff Supplies' || e.category === 'Repairs & Maintenance').reduce((acc, e) => acc + e.amount, 0);
  const statutoryTaxesAndLevies = payroll.reduce((acc, p) => acc + p.housingLevy, 0);
  const marketingAndOther = branchExpenses.filter(e => e.category === 'Marketing' || e.category === 'Petty Cash Voucher' || e.category === 'Other').reduce((acc, e) => acc + e.amount, 0);

  const totalOperatingExpenses =
    rentAndLeases +
    utilitiesAndPower +
    salariesAndWages +
    transportAndLogistics +
    repairsAndSupplies +
    statutoryTaxesAndLevies +
    marketingAndOther;

  const ebitda = grossOperatingProfit - totalOperatingExpenses;
  const corporateTaxProvision = ebitda > 0 ? Math.round(ebitda * 0.30) : 0; // 30% Kenyan Corporate Income Tax (CIT)
  const netIncomeAfterTax = ebitda - corporateTaxProvision;
  const netMarginPercent = netSalesRevenue > 0 ? (netIncomeAfterTax / netSalesRevenue) * 100 : 0;

  return {
    grossSalesRevenue: Math.round(grossSalesRevenue),
    salesDiscountsAndReturns: 0,
    netSalesRevenue: Math.round(netSalesRevenue),
    costOfGoodsSold: Math.round(costOfGoodsSold),
    grossOperatingProfit: Math.round(grossOperatingProfit),
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    operatingExpenses: {
      rentAndLeases: Math.round(rentAndLeases),
      utilitiesAndPower: Math.round(utilitiesAndPower),
      salariesAndWages: Math.round(salariesAndWages),
      transportAndLogistics: Math.round(transportAndLogistics),
      repairsAndSupplies: Math.round(repairsAndSupplies),
      statutoryTaxesAndLevies: Math.round(statutoryTaxesAndLevies),
      marketingAndOther: Math.round(marketingAndOther),
      totalOperatingExpenses: Math.round(totalOperatingExpenses)
    },
    ebitda: Math.round(ebitda),
    corporateTaxProvision: Math.round(corporateTaxProvision),
    netIncomeAfterTax: Math.round(netIncomeAfterTax),
    netMarginPercent: Number(netMarginPercent.toFixed(1))
  };
}

/**
 * Autonomous Live Cash Flow Statement Generator
 */
export function generateLiveCashFlowStatement(
  incomeStatement: IncomeStatementData,
  balanceSheet: BalanceSheetData
): CashFlowStatementData {
  const cashFromCustomers = incomeStatement.grossSalesRevenue;
  const cashPaidToSuppliers = incomeStatement.costOfGoodsSold;
  const cashPaidForExpenses = incomeStatement.operatingExpenses.totalOperatingExpenses;
  const netOperatingCashFlow = cashFromCustomers - cashPaidToSuppliers - cashPaidForExpenses;

  const equipmentPurchase = 0;
  const netInvestingCashFlow = -equipmentPurchase;

  const capitalInjections = 0;
  const ownersDrawings = 0;
  const netFinancingCashFlow = capitalInjections - ownersDrawings;

  const netChangeInCash = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
  const closingCashPosition = balanceSheet.currentAssets.cashAndEquivalents;

  return {
    operatingCashFlow: {
      cashFromCustomers: Math.round(cashFromCustomers),
      cashPaidToSuppliers: Math.round(cashPaidToSuppliers),
      cashPaidForExpenses: Math.round(cashPaidForExpenses),
      netOperatingCashFlow: Math.round(netOperatingCashFlow)
    },
    investingCashFlow: {
      equipmentPurchase,
      netInvestingCashFlow
    },
    financingCashFlow: {
      capitalInjections,
      ownersDrawings: Math.round(ownersDrawings),
      netFinancingCashFlow: Math.round(netFinancingCashFlow)
    },
    netChangeInCash: Math.round(netChangeInCash),
    closingCashPosition: Math.round(closingCashPosition)
  };
}

/**
 * 1-Click KRA VAT-3 Monthly Return CSV Generator
 */
export function generateKRAVat3CSV(orders: SaleOrder[], etrPin: string) {
  const headers = ['Period', 'PIN of Trader', 'Invoice / Receipt No', 'Customer PIN', 'Taxable Value (KSh)', 'Rate', 'Output VAT (KSh)', 'ETR Device Serial'];
  const rows = orders.map(o => [
    '2026-08',
    etrPin || 'P051982341Z',
    o.receiptNumber || o.id,
    o.customerKraPin || 'NOT_REGISTERED',
    (o.subtotal).toFixed(2),
    '16%',
    (o.vatAmount).toFixed(2),
    o.cuSerialNumber || 'KRA-CU-8812930'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}

/**
 * 1-Click KRA iTax PAYE Return CSV Generator
 */
export function generateKRAPayeCSV(payroll: PayrollRecord[]) {
  const headers = [
    'Employee PIN',
    'Employee Name',
    'ID Number',
    'Basic Salary (KSh)',
    'Allowances (KSh)',
    'Gross Pay (KSh)',
    'NSSF Defined Deduction',
    'SHIF Deduction',
    'Housing Levy (1.5%)',
    'Taxable Pay (KSh)',
    'Tax Payable (PAYE)',
    'Personal Relief',
    'Net PAYE Due'
  ];

  const rows = payroll.map(p => {
    const deductions = calculateKenyaStatutoryDeductions(p.grossPay || p.basicSalary);
    return [
      'A008923149Z',
      `"${p.staffName.replace(/"/g, '""')}"`,
      p.employeeNo,
      p.basicSalary,
      p.allowances,
      p.grossPay,
      deductions.totalNssf,
      deductions.shifDeduction,
      deductions.housingLevy,
      deductions.taxablePay,
      deductions.grossPaye,
      deductions.personalRelief,
      deductions.payeTax
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 1-Click Bank / M-Pesa B2C Bulk Salary Disbursal Schedule Generator
 */
export function generateBankBatchPaymentCSV(payroll: PayrollRecord[]) {
  const headers = [
    'Recipient Name',
    'Employee No',
    'Bank / M-Pesa Identifier',
    'Account / Phone Number',
    'Net Payout (KSh)',
    'Payment Narration',
    'Payment Status'
  ];

  const rows = payroll.map(p => [
    `"${p.staffName.replace(/"/g, '""')}"`,
    p.employeeNo,
    'Safaricom M-Pesa / Bank Disbursal',
    p.employeeNo,
    p.netPay,
    `Salary ${p.monthYear}`,
    'APPROVED_FOR_DISBURSAL'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
