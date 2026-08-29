import { CartItemRollPricing } from '../types';

export interface CalculateRollPricingOptions {
  totalMeters: number;
  retailPricePerMeter: number;
  wholesalePricePerMeter: number;
  standardRollMeters?: number;
  looseDiscountPct?: number;
  pricingMode?: 'hybrid_discounted_loose' | 'all_wholesale' | 'all_retail' | 'custom';
}

export function calculateRollPricing(options: CalculateRollPricingOptions): CartItemRollPricing {
  const {
    totalMeters,
    retailPricePerMeter,
    wholesalePricePerMeter,
    standardRollMeters = 70,
    looseDiscountPct = 10,
    pricingMode = 'hybrid_discounted_loose'
  } = options;

  if (pricingMode === 'all_retail' || standardRollMeters <= 0) {
    const totalPrice = totalMeters * retailPricePerMeter;
    return {
      isHybridApplied: false,
      pricingMode: 'all_retail',
      fullRollsCount: 0,
      fullRollMeters: 0,
      fullRollsSubtotal: 0,
      wholesaleRatePerMeter: wholesalePricePerMeter,
      looseMeters: totalMeters,
      discountedLooseRatePerMeter: retailPricePerMeter,
      looseDiscountPct: 0,
      looseMetersSubtotal: totalPrice,
      standardRollMeters,
      savingsAmount: 0,
      totalPrice
    };
  }

  if (pricingMode === 'all_wholesale') {
    const totalPrice = totalMeters * wholesalePricePerMeter;
    const baseRetail = totalMeters * retailPricePerMeter;
    return {
      isHybridApplied: true,
      pricingMode: 'all_wholesale',
      fullRollsCount: Math.floor(totalMeters / standardRollMeters),
      fullRollMeters: totalMeters,
      fullRollsSubtotal: totalPrice,
      wholesaleRatePerMeter: wholesalePricePerMeter,
      looseMeters: 0,
      discountedLooseRatePerMeter: wholesalePricePerMeter,
      looseDiscountPct,
      looseMetersSubtotal: 0,
      standardRollMeters,
      savingsAmount: Math.max(0, baseRetail - totalPrice),
      totalPrice
    };
  }

  // Hybrid Mode (Option 1: Full rolls at wholesale rate, remainder loose cut at discounted retail rate)
  const fullRollsCount = Math.floor(totalMeters / standardRollMeters);
  const fullRollMeters = fullRollsCount * standardRollMeters;
  const looseMeters = Math.max(0, totalMeters - fullRollMeters);

  const fullRollsSubtotal = fullRollMeters * wholesalePricePerMeter;
  const discountedLooseRatePerMeter = Math.round(retailPricePerMeter * (1 - looseDiscountPct / 100));
  const looseMetersSubtotal = looseMeters * discountedLooseRatePerMeter;
  const totalPrice = fullRollsSubtotal + looseMetersSubtotal;

  const standardRetailTotal = totalMeters * retailPricePerMeter;
  const savingsAmount = Math.max(0, standardRetailTotal - totalPrice);

  return {
    isHybridApplied: fullRollsCount > 0 || (looseMeters > 0 && looseDiscountPct > 0),
    pricingMode: 'hybrid_discounted_loose',
    fullRollsCount,
    fullRollMeters,
    fullRollsSubtotal,
    wholesaleRatePerMeter: wholesalePricePerMeter,
    looseMeters,
    discountedLooseRatePerMeter,
    looseDiscountPct,
    looseMetersSubtotal,
    standardRollMeters,
    savingsAmount,
    totalPrice
  };
}

export function formatRollPricingSummary(pricing: CartItemRollPricing): string {
  if (!pricing.isHybridApplied) return '';
  if (pricing.fullRollsCount > 0 && pricing.looseMeters > 0) {
    return `${pricing.fullRollsCount} Roll (${pricing.fullRollMeters}m @ ${pricing.wholesaleRatePerMeter}/m) + ${pricing.looseMeters}m Loose (-${pricing.looseDiscountPct}%)`;
  }
  if (pricing.fullRollsCount > 0) {
    return `${pricing.fullRollsCount} Full Roll(s) (${pricing.fullRollMeters}m @ ${pricing.wholesaleRatePerMeter}/m)`;
  }
  if (pricing.looseMeters > 0 && pricing.looseDiscountPct > 0) {
    return `${pricing.looseMeters}m Loose @ KSh ${pricing.discountedLooseRatePerMeter}/m (-${pricing.looseDiscountPct}%)`;
  }
  return '';
}
