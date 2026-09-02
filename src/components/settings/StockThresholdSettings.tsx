import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  AlertTriangle,
  PackageX,
  Boxes,
  Clock,
  TrendingDown,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Save,
  Sliders,
  DollarSign,
  Info,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
  Percent,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { playClickSound, playSuccessSound, playAlertSound } from '../../utils/audio';
import {
  StockAlertSettings,
  DeadStockCalculationBasis,
  LowStockEvaluationMode,
  CategoryType
} from '../../types';
import {
  evaluateStockStatus,
  calculateStockThresholdSummary
} from '../../utils/stockThresholdEngine';
import { INITIAL_STOCK_ALERT_SETTINGS } from '../../data/initialData';

export const StockThresholdSettings: React.FC = () => {
  const {
    stockAlertSettings,
    updateStockAlertSettings,
    bulkApplyThresholdToAllProducts,
    products,
    orders,
    locations,
    recordAuditLog
  } = useERP();

  // Local draft state initialized with current context settings
  const [draftSettings, setDraftSettings] = useState<StockAlertSettings>(stockAlertSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewTab, setPreviewTab] = useState<'dead_stock' | 'low_stock' | 'all'>('dead_stock');
  const [previewSearch, setPreviewSearch] = useState('');

  // Update draft whenever context settings change externally
  React.useEffect(() => {
    setDraftSettings(stockAlertSettings);
  }, [stockAlertSettings]);

  // Live simulation summary using the draft settings
  const liveSummary = useMemo(() => {
    return calculateStockThresholdSummary(products, orders, draftSettings);
  }, [products, orders, draftSettings]);

  // Filtered live preview list
  const filteredPreviewBatches = useMemo(() => {
    let list = liveSummary.deadStockBatches;
    if (previewTab === 'low_stock') {
      list = liveSummary.lowStockBatches;
    } else if (previewTab === 'all') {
      list = products.map(p => evaluateStockStatus(p, orders, draftSettings));
    }

    if (!previewSearch.trim()) return list;

    const query = previewSearch.toLowerCase();
    return list.filter(item =>
      item.product.name.toLowerCase().includes(query) ||
      item.product.sku.toLowerCase().includes(query) ||
      item.product.category.toLowerCase().includes(query) ||
      item.product.colorName.toLowerCase().includes(query)
    );
  }, [liveSummary, previewTab, previewSearch, products, orders, draftSettings]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await updateStockAlertSettings(draftSettings);
      if (res.success) {
        playSuccessSound();
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        playAlertSound();
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      playAlertSound();
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset to Defaults
  const handleResetToDefaults = () => {
    playClickSound();
    setDraftSettings(INITIAL_STOCK_ALERT_SETTINGS);
    setStatusMessage({
      type: 'success',
      text: 'Settings reset to factory defaults. Click "Save Alert Rules" to apply.'
    });
  };

  // Handle Bulk Sync of Low Stock Threshold to all existing product records
  const handleBulkSyncThreshold = async () => {
    if (!window.confirm(
      `Are you sure you want to update the minimum reorder level to ${draftSettings.defaultLowStockThreshold} units on all ${products.length} existing inventory batches?`
    )) {
      return;
    }

    setIsBulkSyncing(true);
    try {
      const res = await bulkApplyThresholdToAllProducts(draftSettings.defaultLowStockThreshold);
      if (res.success) {
        playSuccessSound();
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        playAlertSound();
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      playAlertSound();
      setStatusMessage({ type: 'error', text: err.message || 'Bulk synchronization failed' });
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const deadStockBasisOptions: Array<{
    id: DeadStockCalculationBasis;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'either_creation_or_no_sale',
      title: 'Hybrid: Either Creation Date or 0 Sales (Recommended)',
      description: 'Flags batches created over X days ago OR with 0 sales recorded in the past X days. Highest sensitivity for cash-flow protection.',
      badge: 'Comprehensive',
      icon: Sparkles
    },
    {
      id: 'days_since_last_sale',
      title: 'Sales Velocity Basis (Days Since Last Sale)',
      description: 'Flags batches with 0 sales recorded in the past X days, regardless of when they were first stocked.',
      badge: 'Sales Velocity',
      icon: TrendingDown
    },
    {
      id: 'date_of_creation',
      title: 'Batch Creation / Intake Date Age',
      description: 'Flags batches whose initial stocking date exceeds X days and still have remaining unsold inventory.',
      badge: 'Intake Age',
      icon: Calendar
    },
    {
      id: 'both_creation_and_no_sale',
      title: 'Strict: Aged AND Zero Recent Sales',
      description: 'Flags batches that are both older than X days AND have recorded 0 sales in the past X days.',
      badge: 'Strict Filter',
      icon: ShieldCheck
    }
  ];

  const deadStockPeriodPresets = [15, 30, 45, 60, 90, 120, 180];
  const lowStockPresets = [10, 25, 50, 75, 100, 150, 200];

  return (
    <div className="space-y-6" id="stock-threshold-settings-root">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-600/20 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  Low Stock &amp; Dead Stock Alert Rules
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider border border-rose-200">
                  Automated Triggers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Set quantitative thresholds and stagnation timeframes to trigger exact figures for dead stock and low stock across all branches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Alert Rules'}</span>
            </button>
          </div>
        </div>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Live System Impact Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Dead Stock Live Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <PackageX className="w-4 h-4 text-amber-600" />
              Triggered Dead Stock
            </span>
            <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-full text-[10px] font-black">
              &gt; {draftSettings.deadStockPeriodDays} Days
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
              {liveSummary.deadStockCount}
            </span>
            <span className="text-xs font-bold text-amber-800">
              Batches Stagnant ({((liveSummary.deadStockCount / (products.length || 1)) * 100).toFixed(0)}% of catalog)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-semibold">
            <span>Tied-Up Capital (Cost):</span>
            <strong className="font-mono font-black text-amber-950">
              KSh {liveSummary.totalDeadStockCapitalCost.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Low Stock Live Card */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Triggered Low Stock
            </span>
            <span className="px-2 py-0.5 bg-rose-200/80 text-rose-900 rounded-full text-[10px] font-black">
              &le; {draftSettings.defaultLowStockThreshold} Units
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-950 font-mono">
              {liveSummary.lowStockCount}
            </span>
            <span className="text-xs font-bold text-rose-800">
              Batches Under Threshold
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs text-rose-900 font-semibold">
            <span>Reorder Deficit:</span>
            <strong className="font-mono font-black text-rose-950">
              {liveSummary.totalLowStockDeficitUnits.toLocaleString()} units needed
            </strong>
          </div>
        </div>

        {/* Healthy Inventory Velocity Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Healthy Inventory
            </span>
            <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full text-[10px] font-black">
              Optimal Flow
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {liveSummary.healthyBatchesCount}
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Active Batches ({((liveSummary.healthyBatchesCount / (products.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>Total Catalog Batches:</span>
            <strong className="font-mono font-black text-emerald-950">
              {products.length} Batches
            </strong>
          </div>
        </div>

      </div>

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: Low Stock Threshold Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Low Stock Threshold Configuration
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  At what remaining stock level does an item trigger as low stock?
                </p>
              </div>
            </div>
          </div>

          {/* Master Default Low Stock Level */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Default Low Stock Trigger Level (Units / Meters)
              </label>
              <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-mono font-black">
                {draftSettings.defaultLowStockThreshold} Units
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={draftSettings.defaultLowStockThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDraftSettings(prev => ({ ...prev, defaultLowStockThreshold: val }));
              }}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />

            {/* Quick Presets Strip */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
              {lowStockPresets.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setDraftSettings(prev => ({ ...prev, defaultLowStockThreshold: val }));
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    draftSettings.defaultLowStockThreshold === val
                      ? 'bg-rose-600 text-white font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {val}u
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              When remaining stock is equal to or less than <strong>{draftSettings.defaultLowStockThreshold}</strong>, the system will flag the batch with high-visibility amber/red badges and reorder suggestions.
            </p>
          </div>

          {/* Low Stock Scope Evaluation Mode */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Low Stock Scope Evaluation Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setDraftSettings(prev => ({ ...prev, lowStockEvaluationMode: 'location_specific' }));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  draftSettings.lowStockEvaluationMode === 'location_specific'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-rose-600" />
                    Per-Location Level
                  </span>
                  {draftSettings.lowStockEvaluationMode === 'location_specific' && (
                    <Check className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Triggers alert if <em>any active location</em> (e.g. Sales Shop or Main Store) drops below threshold.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setDraftSettings(prev => ({ ...prev, lowStockEvaluationMode: 'total_aggregate' }));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  draftSettings.lowStockEvaluationMode === 'total_aggregate'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-rose-600" />
                    Aggregate Total
                  </span>
                  {draftSettings.lowStockEvaluationMode === 'total_aggregate' && (
                    <Check className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Triggers alert only when the <em>total sum</em> across all locations combined falls below threshold.
                </p>
              </button>

            </div>
          </div>

          {/* Category-Specific Overrides */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Category-Specific Low Stock Overrides (Optional)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Fine-tuned per fabric</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              {(['Dereck', 'Fleece', 'Yarns'] as CategoryType[]).map(cat => {
                const currentVal = draftSettings.categoryLowStockThresholds?.[cat] ?? draftSettings.defaultLowStockThreshold;
                const unitBadge = cat === 'Yarns' ? 'kg' : 'm';
                const label = cat === 'Dereck' ? 'Dereec (m)' : cat === 'Fleece' ? 'Fleece (m)' : 'Yarns (kg)';
                return (
                  <div key={cat} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-700 block truncate" title={label}>
                      {label}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={currentVal}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 0);
                          setDraftSettings(prev => ({
                            ...prev,
                            categoryLowStockThresholds: {
                              ...prev.categoryLowStockThresholds,
                              [cat]: val
                            }
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{unitBadge}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Action: Sync Default Threshold to all Batch Records */}
          <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-extrabold text-rose-950 block">
                Sync to All {products.length} Batches
              </span>
              <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                Bulk-write {draftSettings.defaultLowStockThreshold} units to the minReorderLevel field of all inventory products.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBulkSyncThreshold}
              disabled={isBulkSyncing}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isBulkSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Sync All Batches</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Dead Stock Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <PackageX className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Dead Stock Period &amp; Stagnation Rules
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  At what length of period &amp; criteria do we classify stock as dead / stagnant?
                </p>
              </div>
            </div>
          </div>

          {/* Stagnation Period Length (Days) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Stagnation Period Length (Days)
              </label>
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-mono font-black">
                {draftSettings.deadStockPeriodDays} Days ({Math.round(draftSettings.deadStockPeriodDays / 30)} Months)
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={10}
              max={365}
              step={5}
              value={draftSettings.deadStockPeriodDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDraftSettings(prev => ({ ...prev, deadStockPeriodDays: val }));
              }}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />

            {/* Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
              {deadStockPeriodPresets.map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setDraftSettings(prev => ({ ...prev, deadStockPeriodDays: days }));
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    draftSettings.deadStockPeriodDays === days
                      ? 'bg-amber-600 text-white font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Basis Selection Cards */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Dead Stock Trigger Calculation Basis
            </label>
            <div className="space-y-2">
              {deadStockBasisOptions.map(option => {
                const Icon = option.icon;
                const isSelected = draftSettings.deadStockCalculationBasis === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setDraftSettings(prev => ({ ...prev, deadStockCalculationBasis: option.id }));
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {option.title}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Remaining Stock & Suggested Markdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 block">
                Min Remaining Stock Filter
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0.1}
                  max={500}
                  step={0.5}
                  value={draftSettings.minRemainingStockForDeadStock}
                  onChange={(e) => {
                    const val = Math.max(0.1, Number(e.target.value) || 1);
                    setDraftSettings(prev => ({ ...prev, minRemainingStockForDeadStock: val }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs font-mono text-slate-400 font-bold">units</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight font-medium">
                Prevents sold-out items (0 stock) from being marked as dead stock.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 block">
                Clearance Discount Advice %
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={5}
                  max={80}
                  step={5}
                  value={draftSettings.deadStockDiscountSuggestionPct}
                  onChange={(e) => {
                    const val = Math.min(80, Math.max(5, Number(e.target.value) || 20));
                    setDraftSettings(prev => ({ ...prev, deadStockDiscountSuggestionPct: val }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs font-mono text-slate-400 font-bold">% off</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight font-medium">
                Suggested markdown for clearance sales on dead stock.
              </p>
            </div>

          </div>

        </div>

      </form>

      {/* Interactive Live Preview & Triggered Batches Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Live Inventory Trigger Inspector
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                {filteredPreviewBatches.length} items matching
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time preview of which batches are automatically triggered under these threshold rules.
            </p>
          </div>

          {/* Sub-Filters and Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewTab('dead_stock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewTab === 'dead_stock'
                    ? 'bg-white text-amber-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PackageX className="w-3.5 h-3.5 text-amber-600" />
                <span>Dead Stock ({liveSummary.deadStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('low_stock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewTab === 'low_stock'
                    ? 'bg-white text-rose-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Low Stock ({liveSummary.lowStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Catalog ({products.length})</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search batch or SKU..."
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Preview Table */}
        {filteredPreviewBatches.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-extrabold text-slate-800">No Batches Matching This Alert Filter</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All inventory batches are moving at a healthy velocity and above configured thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-3">Batch &amp; SKU</th>
                  <th className="py-2.5 px-3">Remaining Stock</th>
                  <th className="py-2.5 px-3">Intake Age</th>
                  <th className="py-2.5 px-3">Sales in {draftSettings.deadStockPeriodDays}d</th>
                  <th className="py-2.5 px-3">Triggered Status</th>
                  <th className="py-2.5 px-3 text-right">Tied Capital / Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPreviewBatches.map(item => {
                  return (
                    <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Product Name & SKU */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: item.product.colorHex || '#ccc' }}
                            title={item.product.colorName}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {item.product.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                              <span>{item.product.sku}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-sans font-semibold">{item.product.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Remaining Stock */}
                      <td className="py-3 px-3">
                        <div className="font-mono">
                          <strong className="text-slate-900 font-black">
                            {item.totalRemainingStock.toLocaleString()}
                          </strong>{' '}
                          <span className="text-slate-500 text-[11px]">{item.product.unit}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Cost: KSh {item.product.costPrice} / {item.product.unit}
                        </span>
                      </td>

                      {/* Creation Date Age */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                        <div>
                          <strong className={item.daysSinceCreation >= draftSettings.deadStockPeriodDays ? 'text-amber-700 font-bold' : ''}>
                            {item.daysSinceCreation} days
                          </strong>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {item.product.createdAt ? new Date(item.product.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      {/* Sales Velocity */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>
                          <span className={item.unitsSoldInPeriod === 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                            {item.unitsSoldInPeriod} {item.product.unit} sold
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {item.daysSinceLastSale !== null ? `Last sale ${item.daysSinceLastSale}d ago` : 'Never sold'}
                        </span>
                      </td>

                      {/* Triggered Status Badges */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          {item.isDeadStock && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-extrabold flex items-center gap-1" title={item.deadStockReason}>
                              <PackageX className="w-3 h-3 text-amber-700 shrink-0" />
                              Dead Stock
                            </span>
                          )}
                          {item.isLowStock && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                              Low Stock (&le;{item.lowStockThresholdApplied}u)
                            </span>
                          )}
                          {!item.isDeadStock && !item.isLowStock && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              Healthy Velocity
                            </span>
                          )}
                          {item.deadStockReason && (
                            <span className="text-[10px] text-amber-800 font-medium line-clamp-1 max-w-[220px]" title={item.deadStockReason}>
                              {item.deadStockReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tied Capital & Clearance Advice */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono text-xs font-black text-slate-900">
                          KSh {item.tiedUpCapitalCost.toLocaleString()}
                        </div>
                        {item.isDeadStock && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Suggest: KSh {item.suggestedClearancePrice} (Clearance)
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Floating Save Reminder Footer when Draft differs from Saved */}
      {JSON.stringify(draftSettings) !== JSON.stringify(stockAlertSettings) && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold">
              You have unsaved changes to your stock threshold and dead stock rules.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save &amp; Apply Now</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
