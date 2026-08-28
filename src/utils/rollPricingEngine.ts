import { CategoryPricingConfig, CategoryType, ProductBatch, RollPricingBreakdown, UnitType } from '../types';

export interface CalculateRollPricingOptions {
  quantity: number;
  unitPriceRetail: number;
  unitPriceBulk: number;
  category: CategoryType;
  unit: UnitType;
  standardRollMeters?: number;
  looseDiscountPct?: number; // e.g. 10 for Option 1
  pricingMode?: 'hybrid_discounted_loose' | 'all_wholesale' | 'all_retail' | 'custom';
  customLooseRate?: number;
}

/**
 * Option 1 Split Roll & Discounted Loose Meter Pricing Engine:
 * Full roll(s) billed at wholesale rate, while extra loose meters cut from another roll
 * are billed at retail rate minus an Option 1 loose cut discount (e.g. 10% off retail).
 */
export function calculateRollPricing({
  quantity,
  unitPriceRetail,
  unitPriceBulk,
  category,
  unit,
  standardRollMeters,
  looseDiscountPct = 10,
  pricingMode = 'hybrid_discounted_loose',
  customLooseRate
}: CalculateRollPricingOptions): RollPricingBreakdown | null {
  // Only apply to fabric length units (meter, yard, roll) or fabric categories (Fleece, Dereck)
  const isFabricUnit = unit === 'meter' || unit === 'roll' || unit === 'yard';
  const isFabricCategory = category === 'Fleece' || category === 'Dereck';
  
  if (!isFabricUnit && !isFabricCategory) {
    return null;
  }

  // Determine standard roll size (Default: Fleece = 70m, Dereck = 50m)
  const rollSize = standardRollMeters && standardRollMeters > 0 
    ? standardRollMeters 
    : (category === 'Fleece' ? 70 : (category === 'Dereck' ? 50 : 60));

  const wholesaleRate = unitPriceBulk > 0 ? unitPriceBulk : Math.round(unitPriceRetail * 0.8);
  const retailRate = unitPriceRetail > 0 ? unitPriceRetail : Math.round(wholesaleRate * 1.25);
  
  // Effective discounted loose meter rate (Option 1)
  const effectiveLooseDiscountPct = Math.max(0, Math.min(100, looseDiscountPct));
  const calculatedDiscountedLooseRate = customLooseRate !== undefined && customLooseRate > 0
    ? customLooseRate
    : Math.round(retailRate * (1 - effectiveLooseDiscountPct / 100));

  // Determine full roll count and loose cut meters
  const fullRollsCount = Math.floor(quantity / rollSize);
  const fullRollMeters = Number((fullRollsCount * rollSize).toFixed(3));
  const looseMeters = Number(Math.max(0, quantity - fullRollMeters).toFixed(3));

  let fullRollsSubtotal = 0;
  let looseMetersSubtotal = 0;
  let totalPrice = 0;

  if (pricingMode === 'all_wholesale') {
    fullRollsSubtotal = Number((quantity * wholesaleRate).toFixed(2));
    looseMetersSubtotal = 0;
    totalPrice = fullRollsSubtotal;
  } else if (pricingMode === 'all_retail') {
    fullRollsSubtotal = 0;
    looseMetersSubtotal = Number((quantity * retailRate).toFixed(2));
    totalPrice = looseMetersSubtotal;
  } else {
    // Default: 'hybrid_discounted_loose' (Option 1)
    if (fullRollsCount > 0) {
      fullRollsSubtotal = Number((fullRollMeters * wholesaleRate).toFixed(2));
      looseMetersSubtotal = Number((looseMeters * calculatedDiscountedLooseRate).toFixed(2));
      totalPrice = Number((fullRollsSubtotal + looseMetersSubtotal).toFixed(2));
    } else {
      // Less than 1 roll (pure cut retail, or loose discount if explicitly set > 0)
      fullRollsSubtotal = 0;
      looseMetersSubtotal = Number((looseMeters * calculatedDiscountedLooseRate).toFixed(2));
      totalPrice = looseMetersSubtotal;
    }
  }

  const effectiveRatePerMeter = quantity > 0 ? Number((totalPrice / quantity).toFixed(2)) : retailRate;
  const standardFullRetailTotal = Number((quantity * retailRate).toFixed(2));
  const savingsAmount = Math.max(0, Number((standardFullRetailTotal - totalPrice).toFixed(2)));

  return {
    isHybridApplied: fullRollsCount > 0 && looseMeters > 0 && pricingMode === 'hybrid_discounted_loose',
    pricingMode,
    standardRollMeters: rollSize,
    fullRollsCount,
    fullRollMeters,
    looseMeters,
    wholesaleRatePerMeter: wholesaleRate,
    retailRatePerMeter: retailRate,
    looseDiscountPct: effectiveLooseDiscountPct,
    discountedLooseRatePerMeter: calculatedDiscountedLooseRate,
    fullRollsSubtotal,
    looseMetersSubtotal,
    totalPrice,
    effectiveRatePerMeter,
    savingsAmount
  };
}

/**
 * Formats a clean human-readable summary of the roll split and loose meters for receipt/invoices
 */
export function formatRollPricingSummary(breakdown: RollPricingBreakdown): string {
  if (breakdown.fullRollsCount > 0 && breakdown.looseMeters > 0) {
    return `${breakdown.fullRollsCount} Roll (${breakdown.fullRollMeters}m @ KSh ${breakdown.wholesaleRatePerMeter.toLocaleString()} W/S) + ${breakdown.looseMeters}m Cut @ KSh ${breakdown.discountedLooseRatePerMeter.toLocaleString()} (-${breakdown.looseDiscountPct}% Disc)`;
  }
  if (breakdown.fullRollsCount > 0 && breakdown.looseMeters === 0) {
    return `${breakdown.fullRollsCount} Full Roll(s) (${breakdown.fullRollMeters}m @ KSh ${breakdown.wholesaleRatePerMeter.toLocaleString()} Wholesale)`;
  }
  if (breakdown.looseDiscountPct > 0) {
    return `${breakdown.looseMeters}m Cut @ KSh ${breakdown.discountedLooseRatePerMeter.toLocaleString()} (${breakdown.looseDiscountPct}% Loose Discount)`;
  }
  return `${breakdown.looseMeters}m Cut @ KSh ${breakdown.retailRatePerMeter.toLocaleString()} Retail`;
}
