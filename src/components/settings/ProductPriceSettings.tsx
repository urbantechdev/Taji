import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CategoryType, ProductBatch } from '../../types';
import {
  Tag,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  RefreshCw,
  Layers,
  Edit2,
  Check,
  X,
  PackageCheck,
  Calculator,
  ShieldCheck,
  Boxes
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const ProductPriceSettings: React.FC = () => {
  const {
    products,
    updateProductPrice,
    updateCategoryPrices,
    updateCategoryPricingConfig,
    categoryPricingConfigs,
    recordAuditLog,
    cloudSyncStatus
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Dereck');
  const [strategy, setStrategy] = useState<'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost'>('set_exact');

  // Config for chosen category
  const activeConfig = categoryPricingConfigs[selectedCategory] || {
    defaultRetailPrice: selectedCategory === 'Dereck' ? 1250 : selectedCategory === 'Yarns' ? 850 : 1650,
    defaultBulkPrice: selectedCategory === 'Dereck' ? 650 : selectedCategory === 'Yarns' ? 650 : 850,
    defaultCostPrice: selectedCategory === 'Dereck' ? 400 : selectedCategory === 'Yarns' ? 450 : 550,
    marginPercentage: 100,
    pricePerKgRate: selectedCategory === 'Dereck' ? 1200 : selectedCategory === 'Yarns' ? 750 : 1500,
    coneTareWeightKg: 0.070,
    baleTareWeightKg: 0.840,
    autoDeductTareAtPOS: true
  };

  const [retailPrice, setRetailPrice] = useState<number>(activeConfig.defaultRetailPrice);
  const [bulkPrice, setBulkPrice] = useState<number>(activeConfig.defaultBulkPrice);
  const [costPrice, setCostPrice] = useState<number>(activeConfig.defaultCostPrice);
  const [pricePerKgRate, setPricePerKgRate] = useState<number>(activeConfig.pricePerKgRate || 1200);
  const [coneTareWeightKg, setConeTareWeightKg] = useState<number>(activeConfig.coneTareWeightKg ?? 0.070);
  const [baleTareWeightKg, setBaleTareWeightKg] = useState<number>(activeConfig.baleTareWeightKg ?? 0.840);
  const [autoDeductTareAtPOS, setAutoDeductTareAtPOS] = useState<boolean>(activeConfig.autoDeductTareAtPOS ?? true);

  // Strategy values
  const [percentValue, setPercentValue] = useState<number>(10);
  const [markupPercent, setMarkupPercent] = useState<number>(50);

  // Status & Feedback
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Item Search & Inline Edit
  const [productSearch, setProductSearch] = useState('');
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<number>(0);

  // When switching category, sync the form inputs
  const handleCategorySwitch = (cat: CategoryType) => {
    playClickSound();
    setSelectedCategory(cat);
    const cfg = categoryPricingConfigs[cat] || {
      defaultRetailPrice: cat === 'Dereck' ? 1250 : cat === 'Yarns' ? 850 : 1650,
      defaultBulkPrice: cat === 'Dereck' ? 650 : cat === 'Yarns' ? 650 : 850,
      defaultCostPrice: cat === 'Dereck' ? 400 : cat === 'Yarns' ? 450 : 550,
      marginPercentage: 100,
      pricePerKgRate: cat === 'Dereck' ? 1200 : cat === 'Yarns' ? 750 : 1500,
      coneTareWeightKg: 0.070,
      baleTareWeightKg: 0.840,
      autoDeductTareAtPOS: true
    };
    setRetailPrice(cfg.defaultRetailPrice);
    setBulkPrice(cfg.defaultBulkPrice);
    setCostPrice(cfg.defaultCostPrice);
    setPricePerKgRate(cfg.pricePerKgRate || (cat === 'Dereck' ? 1200 : cat === 'Yarns' ? 750 : 1500));
    setConeTareWeightKg(cfg.coneTareWeightKg ?? 0.070);
    setBaleTareWeightKg(cfg.baleTareWeightKg ?? 0.840);
    setAutoDeductTareAtPOS(cfg.autoDeductTareAtPOS ?? true);
    setStatusMessage(null);
  };

  const categoryProducts = products.filter(p => p.category === selectedCategory);
  const totalCategoryStock = categoryProducts.reduce(
    (acc, p) => acc + Object.values(p.locationStock || {}).reduce((s, v) => s + (v || 0), 0),
    0
  );

  const calculateProjectedRetail = () => {
    if (strategy === 'set_exact') return retailPrice;
    if (strategy === 'increase_percent') return Math.round(retailPrice * (1 + percentValue / 100));
    if (strategy === 'decrease_percent') return Math.round(retailPrice * (1 - percentValue / 100));
    if (strategy === 'markup_from_cost') return Math.round(costPrice * (1 + markupPercent / 100));
    return retailPrice;
  };

  const projectedRetail = calculateProjectedRetail();
  const projectedGrossMargin = projectedRetail > 0 ? Math.round(((projectedRetail - costPrice) / projectedRetail) * 100) : 0;

  // Handle Save & Apply Batch Category Pricing
  const handleApplyPricing = async () => {
    setIsApplying(true);
    setStatusMessage(null);
    playClickSound();

    try {
      // 1. Update Category Pricing Config
      await updateCategoryPricingConfig(selectedCategory, {
        defaultRetailPrice: strategy === 'set_exact' ? retailPrice : projectedRetail,
        defaultBulkPrice: bulkPrice,
        defaultCostPrice: costPrice,
        pricePerKgRate,
        coneTareWeightKg,
        baleTareWeightKg,
        autoDeductTareAtPOS,
        marginPercentage: projectedGrossMargin
      });

      // 2. Apply updates across all product batches in the category
      const res = await updateCategoryPrices(selectedCategory, {
        retailPrice: strategy === 'set_exact' ? retailPrice : undefined,
        bulkPrice,
        costPrice,
        pricePerKgRate,
        coneTareWeightKg,
        baleTareWeightKg,
        autoDeductTareAtPOS,
        adjustmentType: strategy,
        percentageValue: strategy === 'markup_from_cost' ? markupPercent : percentValue
      });

      playSuccessSound();
      setStatusMessage({
        type: 'success',
        text: `Successfully updated ${selectedCategory} pricing across ${res.updatedCount} product batches! Retail set to KSh ${projectedRetail.toLocaleString()}.`
      });
      recordAuditLog('PRICING_UPDATED', `Category ${selectedCategory} retail updated to KSh ${projectedRetail}`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update category pricing. Please try again.'
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Preset Rates for Kenyan Fabric & Textile Market
  const applyPreset = (preset: 'fleece_polar' | 'dereck_heavy' | 'yarns_cotton') => {
    playClickSound();
    if (preset === 'fleece_polar') {
      setSelectedCategory('Dereck'); // or category mapping
      setRetailPrice(1650);
      setBulkPrice(850);
      setCostPrice(550);
      setPricePerKgRate(1650);
      setConeTareWeightKg(0.080);
      setBaleTareWeightKg(0.900);
    } else if (preset === 'dereck_heavy') {
      setSelectedCategory('Dereck');
      setRetailPrice(1250);
      setBulkPrice(650);
      setCostPrice(400);
      setPricePerKgRate(1200);
      setConeTareWeightKg(0.070);
      setBaleTareWeightKg(0.840);
    } else if (preset === 'yarns_cotton') {
      setSelectedCategory('Yarns');
      setRetailPrice(850);
      setBulkPrice(650);
      setCostPrice(450);
      setPricePerKgRate(750);
      setConeTareWeightKg(0.070);
      setBaleTareWeightKg(0.840);
    }
  };

  const filteredProducts = products.filter(p => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.colorName.toLowerCase().includes(q)
      );
    }
    return p.category === selectedCategory;
  });

  const handleInlinePriceSave = (batchId: string) => {
    if (editPriceInput <= 0) return;
    playSuccessSound();
    updateProductPrice(batchId, editPriceInput);
    setEditingBatchId(null);
    setStatusMessage({
      type: 'success',
      text: `Updated price for ${products.find(p => p.id === batchId)?.name || 'item'} to KSh ${editPriceInput.toLocaleString()}`
    });
  };

  return (
    <div className="space-y-6" id="product-price-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Product & Category Pricing Rules
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                Global Matrix
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Set wholesale, retail, cost prices, profit margins, and variable tare weight formulas for Fleece, Dereec &amp; Yarns.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('fleece_polar')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Fleece (KSh 1,650)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dereck_heavy')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Dereec (KSh 1,250)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('yarns_cotton')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Yarns (KSh 850)
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {(['Dereck', 'Yarns'] as CategoryType[]).map(cat => {
          const isSelected = selectedCategory === cat;
          const count = products.filter(p => p.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySwitch(cat)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-pink-700 text-white border-pink-700 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>{cat === 'Dereck' ? 'Dereec & Fleece Fabrics' : 'Yarns & Cones'}</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count} Batches
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Price Strategy + Live Economics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Adjustments */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-700" />
              1. Master Pricing Strategy for {selectedCategory}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose how new prices are calculated and rolled out across the inventory catalog.
            </p>
          </div>

          {/* Strategy Selection Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'set_exact', label: 'Set Exact Price', icon: DollarSign },
              { id: 'markup_from_cost', label: 'Cost + Markup %', icon: TrendingUp },
              { id: 'increase_percent', label: '+% Increase', icon: Percent },
              { id: 'decrease_percent', label: '-% Discount', icon: Percent },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setStrategy(item.id as any);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  strategy === item.id
                    ? 'bg-pink-50 border-pink-600 text-pink-950 font-bold ring-1 ring-pink-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <item.icon className="w-4 h-4 text-pink-700 mb-1.5" />
                <p className="text-xs leading-tight">{item.label}</p>
              </button>
            ))}
          </div>

          {/* Price Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {/* Cost Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Cost Price (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(Number(e.target.value) || 0)}
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Supplier purchase cost</p>
            </div>

            {/* Bulk / Wholesale Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wholesale / Bulk (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                <input
                  type="number"
                  min="0"
                  value={bulkPrice}
                  onChange={e => setBulkPrice(Number(e.target.value) || 0)}
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">For bulk &amp; b2b orders</p>
            </div>

            {/* Standard Retail Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {strategy === 'set_exact' ? 'Target Retail Price (KSh)' : 'Base Retail Price (KSh)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-pink-700">KSh</span>
                <input
                  type="number"
                  min="0"
                  value={retailPrice}
                  onChange={e => setRetailPrice(Number(e.target.value) || 0)}
                  className="w-full pl-11 pr-3 py-2 bg-pink-50/50 border border-pink-300 rounded-xl text-xs font-black text-pink-900 focus:bg-white focus:border-pink-600 outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Standard counter POS price</p>
            </div>
          </div>

          {/* Strategy Specific Adjustments */}
          {strategy === 'markup_from_cost' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                <span>Desired Profit Markup over Cost</span>
                <span className="text-sm font-black text-amber-700">+{markupPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={markupPercent}
                onChange={e => setMarkupPercent(Number(e.target.value))}
                className="w-full accent-pink-600 cursor-pointer"
              />
              <p className="text-[11px] text-amber-800">
                Formula: KSh {costPrice} + {markupPercent}% = <strong>KSh {projectedRetail.toLocaleString()}</strong> Retail Price
              </p>
            </div>
          )}

          {(strategy === 'increase_percent' || strategy === 'decrease_percent') && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                <span>{strategy === 'increase_percent' ? 'Price Increase Percentage' : 'Discount Percentage'}</span>
                <span className="text-sm font-black text-blue-700">
                  {strategy === 'increase_percent' ? `+${percentValue}%` : `-${percentValue}%`}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={percentValue}
                onChange={e => setPercentValue(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-blue-800">
                Projected New Retail: <strong>KSh {projectedRetail.toLocaleString()}</strong> (Difference: KSh {(projectedRetail - retailPrice).toLocaleString()})
              </p>
            </div>
          )}

          {/* Tare Governance & Variable Rates */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              2. Variable Tare Deduction &amp; Rate-per-KG
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Rate Per KG (KSh/KG)
                </label>
                <input
                  type="number"
                  min="0"
                  value={pricePerKgRate}
                  onChange={e => setPricePerKgRate(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cone Tare Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  value={coneTareWeightKg}
                  onChange={e => setConeTareWeightKg(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bale/Bag Tare (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baleTareWeightKg}
                  onChange={e => setBaleTareWeightKg(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoDeductTare"
                checked={autoDeductTareAtPOS}
                onChange={e => setAutoDeductTareAtPOS(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 accent-pink-600 cursor-pointer"
              />
              <label htmlFor="autoDeductTare" className="text-xs font-bold text-slate-700 cursor-pointer">
                Auto-deduct tare weight at POS terminal when weighing scales are connected
              </label>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Applies to {categoryProducts.length} product batches
            </span>
            <button
              type="button"
              onClick={handleApplyPricing}
              disabled={isApplying}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Catalog...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Apply &amp; Rollout Prices</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Economics & Margin Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-pink-400">Unit Economics</h4>
                  <p className="text-[11px] text-slate-400">{selectedCategory} Margins</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {projectedGrossMargin}% Margin
              </span>
            </div>

            {/* Economics breakdown */}
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Projected Retail Price:</span>
                <span className="font-black text-pink-400 text-sm">KSh {projectedRetail.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Cost Price (COGS):</span>
                <span className="font-bold text-slate-300">KSh {costPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Gross Profit Per Unit:</span>
                <span className="font-black text-emerald-400 text-sm">
                  +KSh {(projectedRetail - costPrice).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-slate-400 font-medium">Active Stock Inventory:</span>
                <span className="font-bold text-slate-300">{totalCategoryStock.toLocaleString()} Units</span>
              </div>
            </div>

            {/* Projected Stock Value */}
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Category Asset Value</p>
              <p className="text-lg font-black text-white">
                KSh {(totalCategoryStock * projectedRetail).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">
                Cost Basis: KSh {(totalCategoryStock * costPrice).toLocaleString()} (Unrealized Profit: KSh {((projectedRetail - costPrice) * totalCategoryStock).toLocaleString()})
              </p>
            </div>
          </div>

          {/* Quick Item Lookup Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Product Price Search</span>
              <span className="text-[10px] font-bold text-slate-500">{filteredProducts.length} Items</span>
            </h4>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by SKU, fabric name, color..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-pink-600 outline-hidden"
              />
            </div>

            {/* Mini Product List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredProducts.slice(0, 10).map(p => {
                const isEditing = editingBatchId === p.id;
                return (
                  <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        {p.sku} • {p.colorName} • {p.unit}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={editPriceInput}
                          onChange={e => setEditPriceInput(Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-white border border-pink-600 rounded-lg text-xs font-bold text-pink-900 outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleInlinePriceSave(p.id)}
                          className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                          title="Save price"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBatchId(null)}
                          className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-slate-900 font-mono">
                          KSh {p.unitPriceRetail.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBatchId(p.id);
                            setEditPriceInput(p.unitPriceRetail);
                          }}
                          className="p-1 text-slate-400 hover:text-pink-700 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors"
                          title="Edit single price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
