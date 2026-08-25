import {
  SaleOrder,
  ProductBatch,
  LocationInfo,
  BranchExpense,
  CashierShiftRecord,
  PeriodicStatementSummary,
  PeriodicStatementPeriod,
  TodaySalesSummary,
  CategoryType,
  LocationId
} from '../types';

/**
 * Returns YYYY-MM-DD for a date string or Date object in local time
 */
export function getLocalDateString(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filters orders belonging to a specific date (YYYY-MM-DD)
 */
export function isOrderOnDate(orderTimestamp: string, targetDateStr: string): boolean {
  return getLocalDateString(orderTimestamp) === targetDateStr;
}

/**
 * Filters orders within a date range (inclusive: startStr to endStr)
 */
export function isOrderInRange(orderTimestamp: string, startDateStr: string, endDateStr: string): boolean {
  const dateStr = getLocalDateString(orderTimestamp);
  return dateStr >= startDateStr && dateStr <= endDateStr;
}

/**
 * Computes today's sales highlight and itemized summary
 */
export function computeTodaySalesSummary(
  orders: SaleOrder[],
  products: ProductBatch[],
  locations: LocationInfo[],
  branchExpenses: BranchExpense[],
  targetLocationId: LocationId | 'All' = 'All',
  targetDateStr?: string
): TodaySalesSummary {
  const todayStr = targetDateStr || getLocalDateString();

  // Filter completed orders for target date and location
  const todayOrders = orders.filter(o => {
    const isCompleted = o.status === 'completed';
    const matchesDate = isOrderOnDate(o.timestamp, todayStr);
    const matchesLoc = targetLocationId === 'All' || o.fulfilledByLocation === targetLocationId || o.originLocation === targetLocationId;
    return isCompleted && matchesDate && matchesLoc;
  });

  const grossRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const vatLiability = todayOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
  const netRevenue = grossRevenue - vatLiability;

  let totalUnitsSold = 0;
  let cogs = 0;

  // Category map
  const catMap: Record<CategoryType, { units: number; revenue: number; cost: number }> = {
    Dereck: { units: 0, revenue: 0, cost: 0 },
    Fleece: { units: 0, revenue: 0, cost: 0 },
    Yarns: { units: 0, revenue: 0, cost: 0 }
  };

  todayOrders.forEach(o => {
    o.items?.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemTotal = Number(item.totalPrice) || (qty * price);
      totalUnitsSold += qty;

      const prod = products.find(p => p.id === item.batchId);
      const unitCost = prod ? Number(prod.costPrice) || (price * 0.6) : (price * 0.6);
      const itemCost = qty * unitCost;
      cogs += itemCost;

      const cat = (item.category as CategoryType) || 'Dereck';
      if (catMap[cat]) {
        catMap[cat].units += qty;
        catMap[cat].revenue += itemTotal;
        catMap[cat].cost += itemCost;
      }
    });
  });

  const grossProfit = netRevenue - cogs;
  const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // Channels
  const cashOrders = todayOrders.filter(o => o.paymentMethod === 'Cash');
  const mpesaOrders = todayOrders.filter(o => o.paymentMethod === 'M-Pesa');
  const bankOrders = todayOrders.filter(o => o.paymentMethod === 'Bank Transfer');
  const cardOrders = todayOrders.filter(o => o.paymentMethod === 'Card' || o.paymentMethod === 'Cheque');

  const cashAtHand = cashOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const bankTotal = bankOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const cardTotal = cardOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Today's cash expenses
  const todayExps = branchExpenses.filter(e => {
    const isToday = isOrderOnDate(e.timestamp, todayStr);
    const isCash = e.paidVia === 'Cash Float';
    const matchesLoc = targetLocationId === 'All' || e.locationId === targetLocationId;
    return isToday && isCash && matchesLoc;
  });
  const todayCashExpenses = todayExps.reduce((sum, e) => sum + e.amount, 0);

  // Current cash drawer balance across relevant locations
  const targetLocs = targetLocationId === 'All' ? locations : locations.filter(l => l.id === targetLocationId);
  const currentCashDrawerBalance = targetLocs.reduce((sum, l) => sum + (l.currentCashBalance ?? l.openingFloat ?? 0), 0);

  const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
    category: category as CategoryType,
    unitsSold: Number(val.units.toFixed(2)),
    revenue: Number(val.revenue.toFixed(2)),
    margin: val.revenue > 0 ? ((val.revenue - val.cost) / val.revenue) * 100 : 0
  }));

  return {
    date: todayStr,
    totalOrders: todayOrders.length,
    totalUnitsSold: Number(totalUnitsSold.toFixed(2)),
    grossRevenue: Number(grossRevenue.toFixed(2)),
    vatLiability: Number(vatLiability.toFixed(2)),
    netRevenue: Number(netRevenue.toFixed(2)),
    cogs: Number(cogs.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    cashAtHand: Number(cashAtHand.toFixed(2)),
    cashOrdersCount: cashOrders.length,
    mpesaTotal: Number(mpesaTotal.toFixed(2)),
    mpesaOrdersCount: mpesaOrders.length,
    bankTotal: Number(bankTotal.toFixed(2)),
    bankOrdersCount: bankOrders.length,
    cardTotal: Number(cardTotal.toFixed(2)),
    cardOrdersCount: cardOrders.length,
    currentCashDrawerBalance: Number(currentCashDrawerBalance.toFixed(2)),
    todayCashExpenses: Number(todayCashExpenses.toFixed(2)),
    categoryBreakdown,
    orders: todayOrders
  };
}

/**
 * Computes a Periodic Statement Summary for Daily, Weekly, Monthly, or Custom Date ranges
 */
export function computePeriodicStatementSummary(
  periodType: PeriodicStatementPeriod,
  startDateStr: string,
  endDateStr: string,
  orders: SaleOrder[],
  products: ProductBatch[],
  locations: LocationInfo[],
  branchExpenses: BranchExpense[],
  shiftClosures: CashierShiftRecord[],
  targetLocationId: LocationId | 'All' = 'All'
): PeriodicStatementSummary {
  const locName = targetLocationId === 'All'
    ? 'All Branches & Central Stores'
    : (locations.find(l => l.id === targetLocationId)?.name || targetLocationId);

  let title = '';
  if (periodType === 'daily') {
    title = `Daily Sales & Revenue Statement (${startDateStr})`;
  } else if (periodType === 'weekly') {
    title = `Weekly Sales & Revenue Statement (${startDateStr} to ${endDateStr})`;
  } else if (periodType === 'monthly') {
    const d = new Date(startDateStr);
    const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    title = `Monthly Sales & Revenue Statement - ${monthName}`;
  } else {
    title = `Periodic Sales & Revenue Statement (${startDateStr} to ${endDateStr})`;
  }

  // Filter completed orders in date range and location
  const matchingOrders = orders.filter(o => {
    const isCompleted = o.status === 'completed';
    const inRange = isOrderInRange(o.timestamp, startDateStr, endDateStr);
    const matchesLoc = targetLocationId === 'All' || o.fulfilledByLocation === targetLocationId || o.originLocation === targetLocationId;
    return isCompleted && inRange && matchesLoc;
  });

  const grossSalesRevenue = matchingOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const vat16Amount = matchingOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
  const netSalesRevenue = grossSalesRevenue - vat16Amount;

  let totalUnitsSold = 0;
  let cogsAmount = 0;

  const catMap: Record<CategoryType, { units: number; revenue: number }> = {
    Dereck: { units: 0, revenue: 0 },
    Fleece: { units: 0, revenue: 0 },
    Yarns: { units: 0, revenue: 0 }
  };

  matchingOrders.forEach(o => {
    o.items?.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemTotal = Number(item.totalPrice) || (qty * price);
      totalUnitsSold += qty;

      const prod = products.find(p => p.id === item.batchId);
      const unitCost = prod ? Number(prod.costPrice) || (price * 0.6) : (price * 0.6);
      cogsAmount += qty * unitCost;

      const cat = (item.category as CategoryType) || 'Dereck';
      if (catMap[cat]) {
        catMap[cat].units += qty;
        catMap[cat].revenue += itemTotal;
      }
    });
  });

  const grossProfit = netSalesRevenue - cogsAmount;
  const grossMarginPercent = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  // Channel breakdown
  const cashOrders = matchingOrders.filter(o => o.paymentMethod === 'Cash');
  const mpesaOrders = matchingOrders.filter(o => o.paymentMethod === 'M-Pesa');
  const bankOrders = matchingOrders.filter(o => o.paymentMethod === 'Bank Transfer');
  const cardOrders = matchingOrders.filter(o => o.paymentMethod === 'Card' || o.paymentMethod === 'Cheque');

  const cashSalesTotal = cashOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const mpesaSalesTotal = mpesaOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const bankSalesTotal = bankOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const cardSalesTotal = cardOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Shifts in range
  const matchingShifts = shiftClosures.filter(s => {
    const shiftDate = getLocalDateString(s.closedAt || s.startTime);
    const inRange = shiftDate >= startDateStr && shiftDate <= endDateStr;
    const matchesLoc = targetLocationId === 'All' || s.locationId === targetLocationId;
    return inRange && matchesLoc;
  });

  const totalOpeningFloats = matchingShifts.reduce((sum, s) => sum + (s.openingFloat || 0), 0);
  const totalCashExpenses = matchingShifts.reduce((sum, s) => sum + (s.cashExpensesPaid || 0), 0);
  const expectedCashInDrawer = totalOpeningFloats + cashSalesTotal - totalCashExpenses;
  const actualCountedCash = matchingShifts.reduce((sum, s) => sum + (s.actualCashAtHand || 0), 0);
  const totalCashVariance = matchingShifts.reduce((sum, s) => sum + (s.cashVariance || 0), 0);

  const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
    category: category as CategoryType,
    unitsSold: Number(val.units.toFixed(2)),
    revenue: Number(val.revenue.toFixed(2)),
    sharePercent: grossSalesRevenue > 0 ? Number(((val.revenue / grossSalesRevenue) * 100).toFixed(1)) : 0
  }));

  return {
    periodType,
    startDate: startDateStr,
    endDate: endDateStr,
    title,
    locationId: targetLocationId,
    locationName: locName,
    totalOrders: matchingOrders.length,
    totalUnitsSold: Number(totalUnitsSold.toFixed(2)),
    grossSalesRevenue: Number(grossSalesRevenue.toFixed(2)),
    vat16Amount: Number(vat16Amount.toFixed(2)),
    netSalesRevenue: Number(netSalesRevenue.toFixed(2)),
    cogsAmount: Number(cogsAmount.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    cashSalesTotal: Number(cashSalesTotal.toFixed(2)),
    cashSalesCount: cashOrders.length,
    mpesaSalesTotal: Number(mpesaSalesTotal.toFixed(2)),
    mpesaSalesCount: mpesaOrders.length,
    bankSalesTotal: Number(bankSalesTotal.toFixed(2)),
    bankSalesCount: bankOrders.length,
    cardSalesTotal: Number(cardSalesTotal.toFixed(2)),
    cardSalesCount: cardOrders.length,
    totalOpeningFloats: Number(totalOpeningFloats.toFixed(2)),
    totalCashExpenses: Number(totalCashExpenses.toFixed(2)),
    expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
    actualCountedCash: Number(actualCountedCash.toFixed(2)),
    totalCashVariance: Number(totalCashVariance.toFixed(2)),
    categoryBreakdown,
    orders: matchingOrders,
    shiftClosures: matchingShifts,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Calculates real-time cashier shift balance preview for active session
 */
export function calculateActiveShiftPreview(
  operatorId: string,
  operatorName: string,
  locationId: LocationId,
  orders: SaleOrder[],
  branchExpenses: BranchExpense[],
  shiftStartTime: string,
  openingFloat: number
) {
  // Orders fulfilled by this operator or location since shiftStartTime
  const shiftOrders = orders.filter(o => {
    const isCompleted = o.status === 'completed';
    const isAfterStart = new Date(o.timestamp).getTime() >= new Date(shiftStartTime).getTime();
    const matchesLoc = o.fulfilledByLocation === locationId || o.originLocation === locationId;
    return isCompleted && isAfterStart && matchesLoc;
  });

  const grossSalesRevenue = shiftOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const vatLiability = shiftOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
  const netSalesRevenue = grossSalesRevenue - vatLiability;

  let totalUnitsSold = 0;
  shiftOrders.forEach(o => {
    o.items?.forEach(i => {
      totalUnitsSold += Number(i.quantity) || 0;
    });
  });

  const cashOrders = shiftOrders.filter(o => o.paymentMethod === 'Cash');
  const mpesaOrders = shiftOrders.filter(o => o.paymentMethod === 'M-Pesa');
  const bankOrders = shiftOrders.filter(o => o.paymentMethod === 'Bank Transfer');
  const cardOrders = shiftOrders.filter(o => o.paymentMethod === 'Card' || o.paymentMethod === 'Cheque');

  const expectedCashSales = cashOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const expectedMpesa = mpesaOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const expectedBank = bankOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const expectedCard = cardOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Cash expenses paid during this shift
  const shiftExps = branchExpenses.filter(e => {
    const isAfterStart = new Date(e.timestamp).getTime() >= new Date(shiftStartTime).getTime();
    const matchesLoc = e.locationId === locationId;
    const isCash = e.paidVia === 'Cash Float';
    return isAfterStart && matchesLoc && isCash;
  });
  const cashExpensesPaid = shiftExps.reduce((sum, e) => sum + e.amount, 0);

  // Expected Cash in Drawer = Opening Float + Cash Sales - Cash Expenses
  const expectedCashInDrawer = openingFloat + expectedCashSales - cashExpensesPaid;

  return {
    operatorId,
    operatorName,
    locationId,
    startTime: shiftStartTime,
    openingFloat,
    totalSalesOrdersCount: shiftOrders.length,
    totalUnitsSold: Number(totalUnitsSold.toFixed(2)),
    grossSalesRevenue,
    vatLiability,
    netSalesRevenue,
    expectedCashSales,
    expectedCashInDrawer,
    expectedMpesa,
    expectedBank,
    expectedCard,
    cashExpensesPaid,
    shiftOrders
  };
}
