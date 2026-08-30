import {
  ProductBatch,
  SaleOrder,
  StockAlertSettings,
  ProductStockStatusEvaluation,
  StockThresholdSummary,
  LocationId
} from '../types';

/**
 * Computes live stock status evaluation for a single product batch
 * against the user-configured low stock & dead stock alert settings.
 */
export function evaluateStockStatus(
  product: ProductBatch,
  orders: SaleOrder[],
  settings: StockAlertSettings,
  targetLocation?: LocationId
): ProductStockStatusEvaluation {
  const now = new Date().getTime();
  const locationStockMap: Record<LocationId, number> = product.locationStock || {};
  
  // Calculate total stock across all active locations
  const totalRemainingStock = (Object.values(locationStockMap) as number[]).reduce(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );

  // 1. Determine Applicable Low Stock Threshold
  let lowStockThresholdApplied = settings.defaultLowStockThreshold;
  if (settings.categoryLowStockThresholds && settings.categoryLowStockThresholds[product.category] !== undefined) {
    lowStockThresholdApplied = Number(settings.categoryLowStockThresholds[product.category]);
  }
  if (settings.enableCustomBatchThresholds && product.minReorderLevel && product.minReorderLevel > 0) {
    lowStockThresholdApplied = product.minReorderLevel;
  }

  // 2. Evaluate Low Stock Condition
  const lowStockLocations: LocationId[] = [];
  let isLowStock = false;
  let relevantStockForDeficit = totalRemainingStock;

  if (targetLocation && locationStockMap[targetLocation] !== undefined) {
    const locStock = locationStockMap[targetLocation] || 0;
    if (locStock <= lowStockThresholdApplied) {
      isLowStock = true;
      lowStockLocations.push(targetLocation);
    }
    relevantStockForDeficit = locStock;
  } else if (settings.lowStockEvaluationMode === 'location_specific') {
    Object.entries(locationStockMap).forEach(([locId, qty]) => {
      if ((qty || 0) <= lowStockThresholdApplied) {
        lowStockLocations.push(locId);
      }
    });
    // If any location is low or empty, flag it
    isLowStock = lowStockLocations.length > 0;
  } else {
    // Total aggregate mode
    isLowStock = totalRemainingStock <= lowStockThresholdApplied;
    if (isLowStock) {
      lowStockLocations.push(...Object.keys(locationStockMap));
    }
  }

  const lowStockDeficit = Math.max(0, lowStockThresholdApplied - relevantStockForDeficit);

  // 3. Evaluate Dead Stock Condition
  const minStockForDeadStock = settings.minRemainingStockForDeadStock ?? 1;
  const hasUnsoldStock = totalRemainingStock >= minStockForDeadStock;

  // Calculate batch creation age
  const createdAtTime = product.createdAt ? new Date(product.createdAt).getTime() : now;
  const daysSinceCreation = Math.max(0, Math.floor((now - createdAtTime) / (1000 * 60 * 60 * 24)));

  // Calculate order sales velocity
  const periodCutoffTime = now - (settings.deadStockPeriodDays * 24 * 60 * 60 * 1000);
  let unitsSoldInPeriod = 0;
  let totalLifetimeUnitsSold = 0;
  let latestSaleTimestamp: number | null = null;

  orders.forEach(order => {
    if (order.status !== 'completed') return;
    const item = order.items?.find(i => i.batchId === product.id);
    if (item && item.quantity > 0) {
      const qty = Number(item.quantity) || 0;
      totalLifetimeUnitsSold += qty;
      const orderTime = order.timestamp ? new Date(order.timestamp).getTime() : now;
      
      if (orderTime >= periodCutoffTime) {
        unitsSoldInPeriod += qty;
      }
      if (!latestSaleTimestamp || orderTime > latestSaleTimestamp) {
        latestSaleTimestamp = orderTime;
      }
    }
  });

  const daysSinceLastSale = latestSaleTimestamp
    ? Math.max(0, Math.floor((now - latestSaleTimestamp) / (1000 * 60 * 60 * 24)))
    : null;

  let isDeadStock = false;
  let deadStockReason = '';

  if (hasUnsoldStock) {
    const isAged = daysSinceCreation >= settings.deadStockPeriodDays;
    const hasZeroSalesInPeriod = unitsSoldInPeriod === 0;

    switch (settings.deadStockCalculationBasis) {
      case 'days_since_last_sale':
        if (hasZeroSalesInPeriod) {
          isDeadStock = true;
          deadStockReason = daysSinceLastSale !== null
            ? `No sales recorded in the past ${settings.deadStockPeriodDays} days (Last sale: ${daysSinceLastSale}d ago, ${totalRemainingStock} ${product.unit} unsold)`
            : `0 units sold since intake (${daysSinceCreation}d aged, ${totalRemainingStock} ${product.unit} unsold)`;
        }
        break;

      case 'date_of_creation':
        if (isAged) {
          isDeadStock = true;
          deadStockReason = `Stock batch created ${daysSinceCreation} days ago (Exceeds ${settings.deadStockPeriodDays}-day threshold with ${totalRemainingStock} ${product.unit} remaining)`;
        }
        break;

      case 'both_creation_and_no_sale':
        if (isAged && hasZeroSalesInPeriod) {
          isDeadStock = true;
          deadStockReason = `Batch aged ${daysSinceCreation} days with 0 sales in the past ${settings.deadStockPeriodDays} days (${totalRemainingStock} ${product.unit} unsold)`;
        }
        break;

      case 'either_creation_or_no_sale':
      default:
        if (hasZeroSalesInPeriod || isAged) {
          isDeadStock = true;
          if (isAged && hasZeroSalesInPeriod) {
            deadStockReason = `Aged ${daysSinceCreation}d (> ${settings.deadStockPeriodDays}d) with 0 sales in past ${settings.deadStockPeriodDays}d (${totalRemainingStock} ${product.unit} unsold)`;
          } else if (hasZeroSalesInPeriod) {
            deadStockReason = `0 sales in past ${settings.deadStockPeriodDays} days (${totalRemainingStock} ${product.unit} unsold)`;
          } else {
            deadStockReason = `Batch created ${daysSinceCreation} days ago with ${totalRemainingStock} ${product.unit} remaining unsold`;
          }
        }
        break;
    }
  }

  // 4. Financial Capital Valuation & Markdown Suggestion
  const costPrice = Number(product.costPrice) || 0;
  const retailPrice = Number(product.unitPriceRetail) || 0;
  const tiedUpCapitalCost = totalRemainingStock * costPrice;
  const tiedUpCapitalRetail = totalRemainingStock * retailPrice;
  
  const discountPct = Math.min(90, Math.max(0, settings.deadStockDiscountSuggestionPct || 20));
  const suggestedClearancePrice = Math.max(costPrice, Math.round(retailPrice * (1 - discountPct / 100)));

  return {
    product,
    totalRemainingStock,
    locationStockBreakdown: locationStockMap,
    isLowStock,
    lowStockThresholdApplied,
    lowStockDeficit,
    lowStockLocations,
    isDeadStock,
    deadStockReason,
    daysSinceCreation,
    daysSinceLastSale,
    unitsSoldInPeriod,
    totalLifetimeUnitsSold,
    tiedUpCapitalCost,
    tiedUpCapitalRetail,
    suggestedClearancePrice
  };
}

/**
 * Computes an aggregated executive summary of all inventory batches,
 * extracting low stock counts, dead stock counts, tied up capital, and healthy counts.
 */
export function calculateStockThresholdSummary(
  products: ProductBatch[],
  orders: SaleOrder[],
  settings: StockAlertSettings,
  targetLocation?: LocationId
): StockThresholdSummary {
  const lowStockBatches: ProductStockStatusEvaluation[] = [];
  const deadStockBatches: ProductStockStatusEvaluation[] = [];
  let healthyBatchesCount = 0;
  let totalDeadStockCapitalCost = 0;
  let totalDeadStockCapitalRetail = 0;
  let totalLowStockDeficitUnits = 0;

  products.forEach(p => {
    const status = evaluateStockStatus(p, orders, settings, targetLocation);
    
    if (status.isLowStock) {
      lowStockBatches.push(status);
      totalLowStockDeficitUnits += status.lowStockDeficit;
    }

    if (status.isDeadStock) {
      deadStockBatches.push(status);
      totalDeadStockCapitalCost += status.tiedUpCapitalCost;
      totalDeadStockCapitalRetail += status.tiedUpCapitalRetail;
    }

    if (!status.isLowStock && !status.isDeadStock) {
      healthyBatchesCount++;
    }
  });

  return {
    totalProductsCount: products.length,
    lowStockCount: lowStockBatches.length,
    lowStockBatches,
    deadStockCount: deadStockBatches.length,
    deadStockBatches,
    healthyBatchesCount,
    totalDeadStockCapitalCost,
    totalDeadStockCapitalRetail,
    totalLowStockDeficitUnits
  };
}
