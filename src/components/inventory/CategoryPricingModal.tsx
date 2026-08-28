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
  HelpCircle,
  Calculator,
  Package,
  Scale,
  Check
} from 'lucide-react';

interface CategoryPricingModalProps {
  onClose: () => void;
}

export const CategoryPricingModal: React.FC<CategoryPricingModalProps> = ({ onClose }) => {
  const {
    products,
    updateCategoryPrices,
    updateCategoryPricingConfig,
    categoryPricingConfigs,
    cloudSyncStatus
  } = useERP();

  const [selectedCat, setSelectedCat] = useState<CategoryType>('Yarns');
  const [strategy, setStrategy] = useState<'set_exact' | 'increase_percent' | 'decrease_percent' | 'markup_from_cost'>('set_exact');

  // Exact Values State
  const catConfig = categoryPricingConfigs[selectedCat] || {
    defaultRetailPrice: selectedCat === 'Yarns' ? 950 : selectedCat === 'Dereck' ? 230 : 470,
    defaultBulkPrice: selectedCat === 'Yarns' ? 950 : selectedCat === 'Dereck' ? 220 : 440,
    defaultCostPrice: selectedCat === 'Yarns' ? 650 : selectedCat === 'Dereck' ? 160 : 320,
    marginPercentage: 100,
    pricePerKgRate: selectedCat === 'Yarns' ? 950 : selectedCat === 'Dereck' ? 230 : 470,
    coneTareWeightKg: 0.070,
    baleTareWeightKg: 0.840,
    autoDeductTareAtPOS: true
  };

  const [exactRetailPrice, setExactRetailPrice] = useState<number>(catConfig.defaultRetailPrice);
  const [exactBulkPrice, setExactBulkPrice] = useState<number>(catConfig.defaultBulkPrice);
  const [exactCostPrice, setExactCostPrice] = useState<number>(catConfig.defaultCostPrice);

  // Variable Cone Weight & Rate-Per-KG Settings
  const [pricePerKgRate, setPricePerKgRate] = useState<number>(catConfig.pricePerKgRate || (selectedCat === 'Yarns' ? 950 : selectedCat === 'Dereck' ? 230 : 470));
  const [coneTareWeightKg, setConeTareWeightKg] = useState<number>(catConfig.coneTareWeightKg ?? 0.070);
  const [baleTareWeightKg, setBaleTareWeightKg] = useState<number>(catConfig.baleTareWeightKg ?? 0.840);
  const [autoDeductTareAtPOS, setAutoDeductTareAtPOS] = useState<boolean>(catConfig.autoDeductTareAtPOS ?? true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Live Scale Simulator
  const [simScaleGross, setSimScaleGross] = useState<number>(2.080);
  const [simConeCount, setSimConeCount] = useState<number>(1);

  // Percentage Values
  const [percentValue, setPercentValue] = useState<number>(10);
  const [markupPercent, setMarkupPercent] = useState<number>(50);

  // Bale Economics Interactive Calculator
  const [calcBagWeightKg, setCalcBagWeightKg] = useState<number>(24);
  const [calcConesCount, setCalcConesCount] = useState<number>(12);
  const [calcCostPerKg, setCalcCostPerKg] = useState<number>(650);
  const [calcWholesalePerKg, setCalcWholesalePerKg] = useState<number>(950);
  const [calcRetailPerKg, setCalcRetailPerKg] = useState<number>(950);

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

  // Apply Recommended Industry Standard Presets
  const handleApplyRecommendedPreset = (cat: CategoryType) => {
    if (cat === 'Yarns') {
      setExactRetailPrice(950); // Standard Retail Rate (KSh/KG)
      setExactBulkPrice(950);   // Standard Wholesale Rate (KSh/KG)
      setExactCostPrice(650);   // Landed Cost (KSh/KG)
    } else if (cat === 'Dereck') {
      setExactRetailPrice(230); // Cut length per meter retail
      setExactBulkPrice(220);   // Full roll per meter wholesale
      setExactCostPrice(160);   // Landed cost per meter
    } else if (cat === 'Fleece') {
      setExactRetailPrice(470); // Cut length per meter retail
      setExactBulkPrice(440);   // Full bolt per meter wholesale
      setExactCostPrice(320);   // Landed cost per meter
    }
  };

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

  // Handle category settings save
  const handleSaveCategoryConfig = async () => {
    setIsSavingConfig(true);
    const res = await updateCategoryPricingConfig(selectedCat, {
      pricePerKgRate: Number(pricePerKgRate),
      coneTareWeightKg: Number(coneTareWeightKg),
      baleTareWeightKg: Number(baleTareWeightKg),
      autoDeductTareAtPOS: Boolean(autoDeductTareAtPOS)
    });
    setIsSavingConfig(false);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleApply = async () => {
    if (categoryProducts.length === 0) {
      setFeedback({ type: 'error', message: `No products found in category ${selectedCat}` });
      return;
    }

    setIsApplying(true);
    setFeedback(null);

    let priceUpdates: any = {
      adjustmentType: strategy,
      pricePerKgRate: Number(pricePerKgRate),
      coneTareWeightKg: Number(coneTareWeightKg),
      baleTareWeightKg: Number(baleTareWeightKg),
      autoDeductTareAtPOS: Boolean(autoDeductTareAtPOS)
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

  const categories: CategoryType[] = ['Yarns', 'Dereck', 'Fleece'];

  // Unit calculations
  const weightPerCone = calcConesCount > 0 ? (calcBagWeightKg / calcConesCount) : 2.0;
  const bagCostTotal = calcBagWeightKg * calcCostPerKg;
  const bagWholesaleRevenue = calcBagWeightKg * calcWholesalePerKg;
  const bagWholesaleGrossProfit = bagWholesaleRevenue - bagCostTotal;
  const wholesaleMarginPercent = bagCostTotal > 0 ? ((bagWholesaleGrossProfit / bagCostTotal) * 100).toFixed(1) : '0';

  const bagRetailRevenue = calcBagWeightKg * calcRetailPerKg;
  const bagRetailGrossProfit = bagRetailRevenue - bagCostTotal;
  const retailMarginPercent = bagCostTotal > 0 ? ((bagRetailGrossProfit / bagCostTotal) * 100).toFixed(1) : '0';
  const pricePerConeRetail = weightPerCone * calcRetailPerKg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Category Pricing & Bale Tier Architecture</h3>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" /> Live Firestore Sync
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Configure Wholesale (Full Bale/Roll) vs Retail (Single Cone/Cut Piece) pricing and auto-synchronize to all checkout stations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
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
                        setPricePerKgRate(conf.pricePerKgRate || (cat === 'Yarns' ? 750 : 1200));
                        setConeTareWeightKg(conf.coneTareWeightKg ?? 0.070);
                        setBaleTareWeightKg(conf.baleTareWeightKg ?? 0.840);
                        setAutoDeductTareAtPOS(conf.autoDeductTareAtPOS ?? true);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">
                        {cat === 'Yarns' ? '🧶 Yarns' : cat === 'Dereck' ? '🧵 Dereec' : '🧥 Fleece'}
                      </span>
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
                        ? 'Superfine Weaves & Suitings (KSh/Meter)'
                        : cat === 'Fleece'
                        ? 'Heavyweight Thermal Fleece (KSh/Meter)'
                        : 'Acrylic & Wool Dyed Yarns (KSh/KG & Cones)'}
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
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Avg. Retail ({selectedCat === 'Yarns' ? 'KG / Cone' : 'Meter'})
              </span>
              <span className="text-base font-bold text-indigo-700">KSh {avgRetail.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Avg. Wholesale ({selectedCat === 'Yarns' ? 'Full Bale' : 'Full Roll'})
              </span>
              <span className="text-base font-bold text-slate-800">KSh {avgBulk.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Avg. Landed Cost</span>
              <span className="text-base font-bold text-slate-700">KSh {avgCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Dedicated Category Pricing Advice & Bale Margin Calculator */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-4 rounded-2xl text-white shadow-md border border-indigo-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm text-indigo-200">
                  {selectedCat === 'Yarns' ? 'Yarn Bale (24 KG) & Cone Pricing Architecture Guide' : `${selectedCat} Textile Pricing Best Practices`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleApplyRecommendedPreset(selectedCat)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Load Recommended {selectedCat} Margins</span>
              </button>
            </div>

            {selectedCat === 'Yarns' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                {/* Advice Column */}
                <div className="lg:col-span-6 space-y-2 text-slate-300">
                  <p className="font-semibold text-indigo-200">Recommended Wholesale vs Retail Structure for 2/24 NM Acrylic Yarns:</p>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-300">
                    <li><strong className="text-white">Full Bale / Wholesale Rate:</strong> Set at <strong>KSh 650/KG</strong> (KSh 15,600 / 24 KG Bag). Targets manufacturing clients & bulk knitters with a solid ~44.4% gross margin.</li>
                    <li><strong className="text-white">Broken Bale / Single Cone Rate:</strong> Set at <strong>KSh 850/KG</strong> (KSh 1,700 / 2.0 KG Cone). Covers broken packaging and small customer sales with ~88.9% gross margin.</li>
                    <li><strong className="text-white">Packaging Tare (840g):</strong> Deducted automatically on gross scale weigh-in so cashiers bill the net weight cleanly.</li>
                    <li><strong className="text-white">Dye Lot Consistency:</strong> In POS and Inward Intake, items of the same shade but different dye lot (e.g. 26E081 vs 26E090) are segregated to prevent fabric color shade banding.</li>
                  </ul>
                </div>

                {/* Interactive Simulator Box */}
                <div className="lg:col-span-6 bg-white/10 border border-white/15 p-3 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Live Bale Economics Simulator (24 KG Bag / 12 Cones)
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Landed Cost / KG</label>
                      <input
                        type="number"
                        value={calcCostPerKg}
                        onChange={e => setCalcCostPerKg(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-xs font-mono font-bold text-white text-right"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Wholesale / KG</label>
                      <input
                        type="number"
                        value={calcWholesalePerKg}
                        onChange={e => setCalcWholesalePerKg(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 text-right"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Retail / KG</label>
                      <input
                        type="number"
                        value={calcRetailPerKg}
                        onChange={e => setCalcRetailPerKg(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <div className="bg-black/30 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Wholesale Full Bag (24 KG)</span>
                      <span className="font-bold text-xs text-white">Rev: KSh {bagWholesaleRevenue.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-400 block font-semibold">Profit: +KSh {bagWholesaleGrossProfit.toLocaleString()} (+{wholesaleMarginPercent}%)</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Retail Single Cone (2.0 KG)</span>
                      <span className="font-bold text-xs text-white">Cone: KSh {pricePerConeRetail.toLocaleString()}</span>
                      <span className="text-[10px] text-amber-300 block font-semibold">Bag: +KSh {bagRetailGrossProfit.toLocaleString()} (+{retailMarginPercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 space-y-1.5">
                <p>
                  For <strong>{selectedCat}</strong> fabrics, maintain standard roll rates for bulk clients taking 30+ meter bolts, and a 50-80% markup on cut lengths to compensate for remnant cuts and roll end waste.
                </p>
              </div>
            )}
          </div>

          {/* Variable Cone Breakdown, Scale Tare & 1 KG Pricing Provision */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>Variable Weight & Rate Settings Provision (1 KG = KSh X)</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      POS Auto-Calculation
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Define the price-per-KG formula and empty cone spool tare deduction to balance variable cone scale weights at checkout.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCategoryConfig}
                disabled={isSavingConfig}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Save {selectedCat} Scale Setting</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rate per KG */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                <label className="block text-xs font-bold text-indigo-950">
                  Rate per 1 KG (KSh / KG)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-indigo-600">KSh</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pricePerKgRate}
                    onChange={e => setPricePerKgRate(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-indigo-200 text-sm font-mono font-bold text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 750"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPricePerKgRate(750)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded"
                  >
                    KSh 750/kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricePerKgRate(850)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded"
                  >
                    KSh 850/kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricePerKgRate(650)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded"
                  >
                    KSh 650/kg (Bulk)
                  </button>
                </div>
              </div>

              {/* Single Cone Spool Tare */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Single Cone Spool Tare (KG)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={coneTareWeightKg}
                    onChange={e => setConeTareWeightKg(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    = {(coneTareWeightKg * 1000).toFixed(0)}g
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setConeTareWeightKg(0.070)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                  >
                    70g (Plastic/Paper)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConeTareWeightKg(0.050)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                  >
                    50g (Light)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConeTareWeightKg(0)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                  >
                    0g (None)
                  </button>
                </div>
              </div>

              {/* Auto Tare Switch & Bale Tare */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Auto Tare at POS Checkout
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Automatically subtract cone spool weight when cashier weighs item on scale.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={autoDeductTareAtPOS}
                    onChange={e => setAutoDeductTareAtPOS(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {autoDeductTareAtPOS ? 'Active (Auto-Deducts Tare)' : 'Manual (Gross = Net)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Interactive Live Scale & Ledger Impact Preview */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-xl text-white space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Live Scale Testing & Ledger Impact Simulator
                </span>
                <span className="text-[11px] text-slate-300 font-mono">
                  Formula: (Gross - Tare) × Rate/KG
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Inputs */}
                <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Simulate Measured Weight (KG)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      value={simScaleGross}
                      onChange={e => setSimScaleGross(Math.max(0.01, Number(e.target.value)))}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Number of Cones</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={simConeCount}
                      onChange={e => setSimConeCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-white"
                    />
                  </div>
                </div>

                {/* Calculation Outputs */}
                {(() => {
                  const totalTare = autoDeductTareAtPOS ? coneTareWeightKg * simConeCount : 0;
                  const netWeight = Math.max(0, simScaleGross - totalTare);
                  const totalAmount = netWeight * pricePerKgRate;
                  const vat = (totalAmount * 16) / 116;
                  const netRev = totalAmount - vat;

                  return (
                    <div className="sm:col-span-6 bg-white/10 border border-white/15 p-3 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5 text-xs">
                        <div className="text-[11px] text-slate-300">
                          Gross: <strong className="text-white font-mono">{simScaleGross.toFixed(3)} kg</strong>
                        </div>
                        <div className="text-[11px] text-rose-300">
                          Tare: <strong className="font-mono">-{totalTare.toFixed(3)} kg</strong> ({simConeCount}x {(coneTareWeightKg * 1000).toFixed(0)}g)
                        </div>
                        <div className="text-[11px] text-emerald-300 font-bold">
                          Net Billed: <strong className="font-mono">{netWeight.toFixed(3)} kg</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">Total Billable</span>
                        <span className="text-base font-black font-mono text-white">
                          KSh {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          (Net: KSh {netRev.toFixed(0)} | VAT: KSh {vat.toFixed(0)})
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Ledger explanation note */}
              <div className="text-[11px] bg-black/30 p-2.5 rounded-lg border border-white/10 text-slate-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ledger & Inventory Integrity: </strong>
                  Stock ledger automatically decrements the exact pure net weight (<span className="text-emerald-300 font-mono">Net KG</span>), completely eliminating phantom excess inventory variance. Financial accounts credit Sales Revenue & KRA 16% Output VAT strictly on billed net value.
                </div>
              </div>
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                      New Uniform Retail Price ({selectedCat === 'Yarns' ? 'KSh/KG / Cone' : 'KSh/Meter'})
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
                      New Uniform Bulk Price ({selectedCat === 'Yarns' ? 'KSh/KG / Full Bale' : 'KSh/Meter / Full Roll'})
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
                            <span className="text-[11px] font-mono text-slate-500">
                              {p.sku} {p.dyeLot ? `• Lot: ${p.dyeLot}` : ''}
                            </span>
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
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isApplying || categoryProducts.length === 0}
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
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
