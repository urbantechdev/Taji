import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CategoryType, ProductBatch } from '../../types';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  CheckCircle,
  AlertTriangle,
  Cloud,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface CategoryPricingModalProps {
  onClose: () => void;
}

export const CategoryPricingModal: React.FC<CategoryPricingModalProps> = ({ onClose }) => {
  const {
    products,
    updateCategoryPrices,
    categoryPricingConfigs,
    cloudSyncStatus
  } = useERP();

  const [selectedCat, setSelectedCat] = useState<CategoryType>('Dereck');
  const [strategy, setStrategy] = useState<'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost'>('set_exact');

  // Exact Values State
  const catConfig = categoryPricingConfigs[selectedCat] || {
    defaultRetailPrice: 1200,
    defaultBulkPrice: 950,
    defaultCostPrice: 600,
    marginPercentage: 100
  };

  const [exactRetailPrice, setExactRetailPrice] = useState<number>(catConfig.defaultRetailPrice);
  const [exactBulkPrice, setExactBulkPrice] = useState<number>(catConfig.defaultBulkPrice);
  const [exactCostPrice, setExactCostPrice] = useState<number>(catConfig.defaultCostPrice);

  // Percentage Values
  const [percentValue, setPercentValue] = useState<number>(10);
  const [markupPercent, setMarkupPercent] = useState<number>(50);

  const [isApplying, setIsApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Products under chosen category
  const categoryProducts = products.filter(p => p.category === selectedCat);

  // Computed category metrics
  const totalCount = categoryProducts.length;
  const avgRetail = totalCount > 0
    ? Math.round(categoryProducts.reduce((acc, p) => acc + p.unitPriceRetail, 0) / totalCount)
    : 0;
  const avgBulk = totalCount > 0
    ? Math.round(categoryProducts.reduce((acc, p) => acc + p.unitPriceBulk, 0) / totalCount)
    : 0;
  const avgCost = totalCount > 0
    ? Math.round(categoryProducts.reduce((acc, p) => acc + p.costPrice, 0) / totalCount)
    : 0;

  // Calculate simulated preview price for an item
  const getSimulatedPrices = (p: ProductBatch) => {
    let newRetail = p.unitPriceRetail;
    let newBulk = p.unitPriceBulk;
    let newCost = p.costPrice;

    if (strategy === 'set_exact') {
      if (exactRetailPrice > 0) newRetail = exactRetailPrice;
      if (exactBulkPrice > 0) newBulk = exactBulkPrice;
      if (exactCostPrice > 0) newCost = exactCostPrice;
    } else if (strategy === 'increase_percent') {
      const factor = 1 + percentValue / 100;
      newRetail = Math.round(p.unitPriceRetail * factor);
      newBulk = Math.round(p.unitPriceBulk * factor);
    } else if (strategy === 'decrease_percent') {
      const factor = Math.max(0.01, 1 - percentValue / 100);
      newRetail = Math.round(p.unitPriceRetail * factor);
      newBulk = Math.round(p.unitPriceBulk * factor);
    } else if (strategy === 'markup_from_cost') {
      const factor = 1 + markupPercent / 100;
      newRetail = Math.round(p.costPrice * factor);
      newBulk = Math.round(p.costPrice * (1 + (markupPercent * 0.75) / 100));
    }

    return { newRetail, newBulk, newCost };
  };

  const handleApply = async () => {
    if (categoryProducts.length === 0) {
      setFeedback({ type: 'error', message: `No products found in category ${selectedCat}` });
      return;
    }

    setIsApplying(true);
    setFeedback(null);

    let priceUpdates: any = {
      adjustmentType: strategy
    };

    if (strategy === 'set_exact') {
      priceUpdates.retailPrice = Number(exactRetailPrice);
      priceUpdates.bulkPrice = Number(exactBulkPrice);
      priceUpdates.costPrice = Number(exactCostPrice);
    } else if (strategy === 'increase_percent' || strategy === 'decrease_percent') {
      priceUpdates.percentageValue = Number(percentValue);
    } else if (strategy === 'markup_from_cost') {
      priceUpdates.percentageValue = Number(markupPercent);
    }

    const res = await updateCategoryPrices(selectedCat, priceUpdates);
    setIsApplying(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const categories: CategoryType[] = ['Dereck', 'Fleece', 'Yarns'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Category Pricing & Price Manager</h3>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" /> Live Firestore Sync
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Update prices across entire categories simultaneously. Changes synchronize instantly to the cloud database across all phones, laptops, and POS terminals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Category Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Select Target Fabric Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                const isSelected = selectedCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCat(cat);
                      const conf = categoryPricingConfigs[cat];
                      if (conf) {
                        setExactRetailPrice(conf.defaultRetailPrice);
                        setExactBulkPrice(conf.defaultBulkPrice);
                        setExactCostPrice(conf.defaultCostPrice);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{cat}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count} items
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {cat === 'Dereck'
                        ? 'Superfine Weaves & Suitings'
                        : cat === 'Fleece'
                        ? 'Heavyweight Thermal Fleece'
                        : 'Acrylic & Wool Spun Yarns'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Category Statistics Card */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Product Items</span>
              <span className="text-base font-bold text-slate-900">{totalCount} batches</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Avg. Retail Price</span>
              <span className="text-base font-bold text-indigo-700">KSh {avgRetail.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Avg. Bulk Price</span>
              <span className="text-base font-bold text-slate-800">KSh {avgBulk.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Avg. Cost Price</span>
              <span className="text-base font-bold text-slate-700">KSh {avgCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Pricing Strategy Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Choose Pricing Adjustment Strategy
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setStrategy('set_exact')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === 'set_exact'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm text-indigo-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-xs block font-bold">Uniform Exact Prices</span>
                <span className="text-[11px] text-slate-500 font-normal">Set fixed retail, bulk & cost</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('increase_percent')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === 'increase_percent'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs block font-bold">Percentage Increase</span>
                <span className="text-[11px] text-slate-500 font-normal">e.g. +10% price markup</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('decrease_percent')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === 'decrease_percent'
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm text-amber-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs block font-bold">Discount / Promo</span>
                <span className="text-[11px] text-slate-500 font-normal">e.g. -15% clearance sale</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('markup_from_cost')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === 'markup_from_cost'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm text-purple-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-xs block font-bold">Cost-Plus Markup</span>
                <span className="text-[11px] text-slate-500 font-normal">Retail = Cost + X% margin</span>
              </button>
            </div>
          </div>

          {/* Strategy Specific Input Fields */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {strategy === 'set_exact' && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Set Uniform Category Prices for {selectedCat}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Uniform Retail Price (KSh)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={exactRetailPrice}
                      onChange={e => setExactRetailPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Uniform Bulk Price (KSh)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={exactBulkPrice}
                      onChange={e => setExactBulkPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Uniform Cost Price (KSh)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={exactCostPrice}
                      onChange={e => setExactCostPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {(strategy === 'increase_percent' || strategy === 'decrease_percent') && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  {strategy === 'increase_percent' ? 'Percentage Price Increase' : 'Percentage Price Markdown'} for {selectedCat}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={percentValue}
                        onChange={e => setPercentValue(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    {strategy === 'increase_percent' ? (
                      <p>
                        All {totalCount} products in <strong>{selectedCat}</strong> will increase by <strong>{percentValue}%</strong> across Retail and Bulk pricing.
                      </p>
                    ) : (
                      <p>
                        All {totalCount} products in <strong>{selectedCat}</strong> will be discounted by <strong>{percentValue}%</strong> for seasonal / clearance promotions.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {strategy === 'markup_from_cost' && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Cost-Plus Profit Margin Calculation for {selectedCat}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Markup on Cost (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={markupPercent}
                        onChange={e => setMarkupPercent(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    <p>
                      Retail Price will automatically be calculated as <strong>Cost Price + {markupPercent}%</strong> for all {totalCount} items in this category.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Pricing Preview ({categoryProducts.length} Items in {selectedCat})
              </h4>
              <span className="text-xs text-indigo-600 font-semibold">
                Simulated changes before applying
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2.5">Product SKU & Name</th>
                    <th className="px-3.5 py-2.5 text-right">Current Retail</th>
                    <th className="px-3.5 py-2.5 text-center">→</th>
                    <th className="px-3.5 py-2.5 text-right text-indigo-900">New Retail</th>
                    <th className="px-3.5 py-2.5 text-right">New Bulk</th>
                    <th className="px-3.5 py-2.5 text-right">New Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {categoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        No products in this category.
                      </td>
                    </tr>
                  ) : (
                    categoryProducts.map(p => {
                      const { newRetail, newBulk, newCost } = getSimulatedPrices(p);
                      const isChanged = newRetail !== p.unitPriceRetail;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-2">
                            <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                              {p.name}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">{p.sku}</span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                            KSh {p.unitPriceRetail.toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2 text-center text-slate-400">→</td>
                          <td className="px-3.5 py-2 text-right font-mono font-bold text-indigo-700">
                            <span className={isChanged ? 'bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-900 font-extrabold' : ''}>
                              KSh {newRetail.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-slate-800">
                            KSh {newBulk.toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                            KSh {newCost.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Updates will immediately sync to Firebase Firestore for all mobile & desktop users.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isApplying || categoryProducts.length === 0}
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Cloud...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Apply & Sync {totalCount} Item Prices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
