import React, { useState } from 'react';
import {
  ImportShipmentRecord,
  ImportShipmentSummary,
  TaxableBaseOverride
} from '../../types';
import {
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Scale,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
  ArrowRight,
  Lock,
  Edit3
} from 'lucide-react';

interface Props {
  shipment: ImportShipmentRecord;
  summary: ImportShipmentSummary;
  effectiveExchangeRate: number;
  onUpdateOverride: (override: TaxableBaseOverride | undefined) => void;
  onUpdateShipmentField?: (field: keyof ImportShipmentRecord, value: any) => void;
}

export const TaxableBaseOverridePanel: React.FC<Props> = ({
  shipment,
  summary,
  effectiveExchangeRate,
  onUpdateOverride,
  onUpdateShipmentField
}) => {
  // Commercial invoice base totals
  const commFOB_USD = summary.accountsPayable?.supplierFOB_USD ?? summary.totalFOB_USD;
  const commNetWeightKg = summary.accountsPayable?.commercialNetWeightKg ?? summary.totalNetWeightKg;
  const commGrossWeightKg = summary.accountsPayable?.commercialGrossWeightKg ?? summary.totalGrossWeightKg;
  const commFreightUSD = summary.accountsPayable?.commercialFreightUSD ?? shipment.totalFreightUSD;
  const commInsuranceUSD = summary.accountsPayable?.commercialInsuranceUSD ?? shipment.totalInsuranceUSD;
  const commExchangeRate = summary.accountsPayable?.commercialExchangeRate ?? effectiveExchangeRate;
  const totalCommLiabilityUSD = summary.accountsPayable?.totalCommercialLiabilityUSD ?? (commFOB_USD + commFreightUSD + commInsuranceUSD + (shipment.cocFeesUSD || 0));
  const totalCommLiabilityKES = summary.accountsPayable?.totalCommercialLiabilityKES ?? (totalCommLiabilityUSD * commExchangeRate);

  const override = shipment.taxableBaseOverride;
  const isEnabled = Boolean(override?.isEnabled);

  // Local state for direct Box 46 manual override toggle
  const [useManualBox46, setUseManualBox46] = useState<boolean>(
    Boolean(override?.overrideCustomsValueKES && override.overrideCustomsValueKES > 0)
  );

  // Toggle override on / off
  const handleToggleEnable = (enabled: boolean) => {
    if (enabled) {
      // If turning on, initialize with existing override or populate from commercial invoice
      const updated: TaxableBaseOverride = {
        isEnabled: true,
        declaredFOB_USD: override?.declaredFOB_USD ?? commFOB_USD,
        declaredNetWeightKg: override?.declaredNetWeightKg ?? commNetWeightKg,
        declaredGrossWeightKg: override?.declaredGrossWeightKg ?? commGrossWeightKg,
        declaredFreightUSD: override?.declaredFreightUSD ?? commFreightUSD,
        declaredInsuranceUSD: override?.declaredInsuranceUSD ?? commInsuranceUSD,
        declaredExchangeRate: override?.declaredExchangeRate ?? commExchangeRate,
        customsEntryNo: override?.customsEntryNo ?? shipment.customsEntryNo,
        kraEslipRef: override?.kraEslipRef ?? shipment.kraEslipRef,
        valuationMethod: override?.valuationMethod ?? 'benchmark_adjusted',
        justificationReason: override?.justificationReason ?? 'KRA ICMS customs assessment adjustments'
      };
      onUpdateOverride(updated);
    } else {
      if (override) {
        onUpdateOverride({ ...override, isEnabled: false });
      } else {
        onUpdateOverride(undefined);
      }
    }
  };

  // Update specific override field
  const handleFieldChange = (field: keyof TaxableBaseOverride, value: any) => {
    const current = override || {
      isEnabled: true,
      declaredFOB_USD: commFOB_USD,
      declaredNetWeightKg: commNetWeightKg,
      declaredGrossWeightKg: commGrossWeightKg,
      declaredFreightUSD: commFreightUSD,
      declaredInsuranceUSD: commInsuranceUSD,
      declaredExchangeRate: commExchangeRate
    };

    const updated: TaxableBaseOverride = {
      ...current,
      isEnabled: true,
      [field]: value
    };

    onUpdateOverride(updated);

    // Sync Customs Entry No & E-Slip to shipment if edited
    if (field === 'customsEntryNo' && onUpdateShipmentField && typeof value === 'string') {
      onUpdateShipmentField('customsEntryNo', value);
    }
    if (field === 'kraEslipRef' && onUpdateShipmentField && typeof value === 'string') {
      onUpdateShipmentField('kraEslipRef', value);
    }
  };

  // One-click Preset: Official KRA SAD 26EMKIM400968589 Assessment
  const handleLoadOfficialSAD400968589 = () => {
    const officialSAD: TaxableBaseOverride = {
      isEnabled: true,
      declaredFOB_USD: 36900.00,
      declaredNetWeightKg: 22600.0,
      declaredGrossWeightKg: 22850.0,
      declaredFreightUSD: 5500.00,
      declaredInsuranceUSD: 14.38,
      declaredExchangeRate: 129.47,
      overrideCustomsValueKES: 5491374.06,
      customsEntryNo: '26EMKIM400968589',
      kraEslipRef: '1020260001009685',
      valuationMethod: 'benchmark_adjusted',
      justificationReason: 'KRA ICMS valuation benchmark override at ICD Embakasi (Declared FOB USD 36,900.00 vs Commercial FOB USD 46,974.49)'
    };
    onUpdateOverride(officialSAD);
    setUseManualBox46(true);
    if (onUpdateShipmentField) {
      onUpdateShipmentField('customsEntryNo', '26EMKIM400968589');
      onUpdateShipmentField('kraEslipRef', '1020260001009685');
    }
  };

  // Auto-populate from Commercial Invoice
  const handleAutoPopulateFromInvoice = () => {
    const populated: TaxableBaseOverride = {
      isEnabled: true,
      declaredFOB_USD: commFOB_USD,
      declaredNetWeightKg: commNetWeightKg,
      declaredGrossWeightKg: commGrossWeightKg,
      declaredFreightUSD: commFreightUSD,
      declaredInsuranceUSD: commInsuranceUSD,
      declaredExchangeRate: commExchangeRate,
      overrideCustomsValueKES: undefined,
      customsEntryNo: shipment.customsEntryNo || '26EMKIM400968589',
      kraEslipRef: shipment.kraEslipRef || '1020260001009685',
      valuationMethod: 'transaction_value',
      justificationReason: 'Auto-populated from Commercial Invoice line items'
    };
    onUpdateOverride(populated);
    setUseManualBox46(false);
  };

  // Variance & audit calculations
  const varianceSummary = summary.taxableBaseSummary;
  const isOverridden = Boolean(varianceSummary?.isOverridden);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden text-white space-y-0">
      
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shadow-md shrink-0 mt-0.5 ${isEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                KRA Taxable Base Override &amp; Customs SAD Valuation
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                isEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isEnabled ? 'OVERRIDE ACTIVE (KRA SAD VALUATION)' : 'INACTIVE (COMMERCIAL BASE)'}
              </span>
              <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                AP Protected (GL #2000)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Reconcile official KRA SAD declarations (e.g. Cleared FOB USD 36,900 &amp; Net Weight 22,600 kg) for customs taxes without corrupting the true Commercial Invoice liability ($46,974.49) owed in Accounts Payable.
            </p>
          </div>
        </div>

        {/* Action Buttons & Master Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          {/* Preset 26EMKIM400968589 Quick Match */}
          <button
            type="button"
            id="btn-quick-load-sad-400968589"
            onClick={handleLoadOfficialSAD400968589}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Load Official KRA SAD Entry 26EMKIM400968589 ($36,900 FOB / 22,600 kg)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span>Match SAD 26EMKIM400968589</span>
          </button>

          {/* Auto-populate from Commercial Invoice */}
          <button
            type="button"
            id="btn-auto-populate-invoice"
            onClick={handleAutoPopulateFromInvoice}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Pull initial values directly from Commercial Invoice"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Sync Invoice</span>
          </button>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer ml-1">
            <input
              type="checkbox"
              id="toggle-taxable-base-override"
              checked={isEnabled}
              onChange={e => handleToggleEnable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            <span className="ml-2 text-xs font-bold text-slate-300">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 sm:p-5 space-y-5">
        
        {/* SIDE-BY-SIDE DUAL REALITY COMPARISON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* REALITY 1: ACCOUNTS PAYABLE (IMMUTABLE COMMERCIAL REALITY) */}
          <div className="lg:col-span-5 bg-slate-950/80 rounded-xl p-4 border border-blue-500/30 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/10 border-b border-l border-blue-500/30 rounded-bl-lg text-[10px] font-mono font-bold text-blue-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-400" />
              <span>ACCOUNTS PAYABLE REALITY</span>
            </div>

            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-300">
                Commercial Invoice Liability (GL #2010)
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Supplier Name:</span>
                <span className="font-bold text-slate-200 truncate max-w-[200px]" title={shipment.supplierName}>
                  {shipment.supplierName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Commercial Invoice #:</span>
                <span className="font-mono font-bold text-blue-300">{shipment.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Invoiced Supplier FOB:</span>
                <span className="font-mono font-bold text-white text-sm">
                  ${commFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Commercial Net Weight:</span>
                <span className="font-mono font-medium text-slate-200">
                  {commNetWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Commercial Gross Weight:</span>
                <span className="font-mono font-medium text-slate-200">
                  {commGrossWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Invoiced Freight &amp; Insurance:</span>
                <span className="font-mono font-medium text-slate-200">
                  ${(commFreightUSD + commInsuranceUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Accounting Spot FX Rate:</span>
                <span className="font-mono font-medium text-slate-300">
                  KES {commExchangeRate.toFixed(2)} / USD
                </span>
              </div>
            </div>

            {/* Total AP Obligation Banner */}
            <div className="mt-3 p-3 bg-blue-950/60 rounded-xl border border-blue-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-300 uppercase tracking-wider block font-bold">
                  Total AP Liability (Owed to Supplier):
                </span>
                <span className="text-sm font-black text-white font-mono">
                  ${totalCommLiabilityUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-300 block font-mono">
                  KES Equivalent:
                </span>
                <span className="text-xs font-extrabold text-blue-200 font-mono">
                  KSh {totalCommLiabilityKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-400 leading-relaxed italic">
              🔒 <strong>Strict Protection:</strong> This AP liability is recorded in General Ledger #2010. Payout via Stanbic Bank Nostro TT remains strictly anchored to the true supplier contract, unaffected by KRA customs valuations.
            </p>
          </div>

          {/* REALITY 2: KRA CUSTOMS TAXABLE BASE (EDITABLE OVERRIDE PANEL) */}
          <div className={`lg:col-span-7 rounded-xl p-4 border transition-all space-y-4 ${
            isEnabled
              ? 'bg-slate-950/90 border-amber-500/50 ring-1 ring-amber-500/20'
              : 'bg-slate-950/40 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                  KRA Customs SAD Taxable Base (Assessment Parameters)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                ICMS Valuation
              </span>
            </div>

            {/* Parameter Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              
              {/* Declared FOB USD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Declared FOB (USD)</span>
                  <span className="text-[9.5px] font-mono text-amber-400">Box 22</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isEnabled}
                    value={override?.declaredFOB_USD ?? commFOB_USD}
                    onChange={e => handleFieldChange('declaredFOB_USD', parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="e.g. 36900.00"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Cleared FOB on SAD assessment
                </span>
              </div>

              {/* Declared Net Weight KG */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Declared Net Wt (KG)</span>
                  <span className="text-[9.5px] font-mono text-amber-400">Box 38</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isEnabled}
                    value={override?.declaredNetWeightKg ?? commNetWeightKg}
                    onChange={e => handleFieldChange('declaredNetWeightKg', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="e.g. 22600.0"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Specific duty basis ($750/t)
                </span>
              </div>

              {/* Declared Gross Weight KG */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Declared Gross (KG)</span>
                  <span className="text-[9.5px] font-mono text-amber-400">Box 35</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isEnabled}
                    value={override?.declaredGrossWeightKg ?? commGrossWeightKg}
                    onChange={e => handleFieldChange('declaredGrossWeightKg', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="e.g. 22850.0"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  MSS levy basis ($1.75/t)
                </span>
              </div>

              {/* Declared Customs Exchange Rate */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>KRA Customs FX Rate</span>
                  <span className="text-[9.5px] font-mono text-amber-400">SAD FX</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    disabled={!isEnabled}
                    value={override?.declaredExchangeRate ?? commExchangeRate}
                    onChange={e => handleFieldChange('declaredExchangeRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="e.g. 129.47"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  Customs rate on assessment
                </span>
              </div>

              {/* Declared Freight USD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Declared Freight (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isEnabled}
                    value={override?.declaredFreightUSD ?? commFreightUSD}
                    onChange={e => handleFieldChange('declaredFreightUSD', parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="5500.00"
                  />
                </div>
              </div>

              {/* Declared Insurance USD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Declared Insurance (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isEnabled}
                    value={override?.declaredInsuranceUSD ?? commInsuranceUSD}
                    onChange={e => handleFieldChange('declaredInsuranceUSD', parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-900/50 disabled:text-slate-500"
                    placeholder="14.38"
                  />
                </div>
              </div>
            </div>

            {/* Direct Box 46 Customs Value in KES Override */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEnabled}
                    checked={useManualBox46}
                    onChange={e => {
                      setUseManualBox46(e.target.checked);
                      if (!e.target.checked) {
                        handleFieldChange('overrideCustomsValueKES', undefined);
                      } else {
                        // initialize with calculated or 5491374.06
                        handleFieldChange('overrideCustomsValueKES', override?.overrideCustomsValueKES || summary.totalCustomsValueKES);
                      }
                    }}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-amber-200">
                    Direct Box 46 Customs Value Override (KES)
                  </span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {useManualBox46 ? 'Manual KES Override Active' : 'Auto-Computed: CIF (USD) × Customs FX'}
                </span>
              </div>

              {useManualBox46 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 font-mono">KSh</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isEnabled}
                    value={override?.overrideCustomsValueKES ?? summary.totalCustomsValueKES}
                    onChange={e => handleFieldChange('overrideCustomsValueKES', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-amber-500/60 rounded-lg text-xs font-mono font-black text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="e.g. 5491374.06"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    Exact SAD Box 46 Assessment
                  </span>
                </div>
              ) : (
                <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>Computed Taxable Customs Value:</span>
                  <span className="font-bold text-amber-300">
                    KSh {summary.totalCustomsValueKES.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Secondary Audit Identifiers (Customs Entry No, PRN, Reason) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10.5px] font-medium text-slate-400 mb-0.5">
                  KRA Customs Entry (SAD) #
                </label>
                <input
                  type="text"
                  disabled={!isEnabled}
                  value={override?.customsEntryNo ?? shipment.customsEntryNo}
                  onChange={e => handleFieldChange('customsEntryNo', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  placeholder="26EMKIM400968589"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-400 mb-0.5">
                  KRA Tax E-Slip / PRN Ref
                </label>
                <input
                  type="text"
                  disabled={!isEnabled}
                  value={override?.kraEslipRef ?? shipment.kraEslipRef}
                  onChange={e => handleFieldChange('kraEslipRef', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  placeholder="1020260001009685"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-400 mb-0.5">
                  Valuation Assessment Method
                </label>
                <select
                  disabled={!isEnabled}
                  value={override?.valuationMethod ?? 'benchmark_adjusted'}
                  onChange={e => handleFieldChange('valuationMethod', e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-50 cursor-pointer"
                >
                  <option value="benchmark_adjusted">KRA Benchmark Adjusted</option>
                  <option value="transaction_value">Transaction Value (Invoice)</option>
                  <option value="deductive_value">Deductive Value</option>
                  <option value="computed_value">Computed Value</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-medium text-slate-400 mb-0.5">
                Audit Justification / Clearing Agent Reference Note
              </label>
              <input
                type="text"
                disabled={!isEnabled}
                value={override?.justificationReason ?? ''}
                onChange={e => handleFieldChange('justificationReason', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                placeholder="e.g. KRA ICMS valuation benchmark override at ICD Embakasi; original AP liability preserved."
              />
            </div>
          </div>
        </div>

        {/* REAL-TIME TAX RECALCULATION & VARIANCE AUDIT BANNER */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                Live Tax Recalculation Assessment (Calculated from Active Base)
              </span>
            </div>
            {isOverridden && (
              <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Variance: ${Math.abs(varianceSummary?.varianceFOB_USD || 0).toLocaleString()} FOB ({varianceSummary?.varianceFOB_Pct.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* 5 KRA Tax Heads Display */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">1002 Import Duty:</span>
              <span className="font-mono font-bold text-white text-xs">
                KSh {summary.totalImportDuty1002KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                {summary.items[0]?.dutyRuleApplied === 'specific_duty' ? 'Specific Duty Applied' : 'Ad-Valorem 25%'}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">1801 IDF (2.5%):</span>
              <span className="font-mono font-bold text-white text-xs">
                KSh {summary.totalIDF1801KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">Import Declaration</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">6001 RDL (2.0%):</span>
              <span className="font-mono font-bold text-white text-xs">
                KSh {summary.totalRDL6001KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">Railway Dev Levy</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">1202 Import VAT (16%):</span>
              <span className="font-mono font-bold text-emerald-300 text-xs">
                KSh {summary.totalVAT1202KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-emerald-400/80 block truncate">Claimable Input Tax</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">6401 MSS Levy:</span>
              <span className="font-mono font-bold text-white text-xs">
                KSh {summary.totalMSS6401KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">$1.75/gross tonne</span>
            </div>

            <div className="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-800">
              <span className="text-emerald-300 block text-[10px] font-bold">Total KRA Assessment:</span>
              <span className="font-mono font-black text-emerald-200 text-sm">
                KSh {summary.totalKRATaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-emerald-300/80 block truncate">KRA E-Slip PRN Total</span>
            </div>
          </div>

          {/* Variance & Landed Cost Impact Summary */}
          {isOverridden && varianceSummary && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-300 font-bold">Variance Analysis:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] text-rose-300">
                  FOB: {varianceSummary.varianceFOB_USD >= 0 ? '+' : ''}${varianceSummary.varianceFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] text-amber-300">
                  Weight: {varianceSummary.varianceNetWeightKg >= 0 ? '+' : ''}{varianceSummary.varianceNetWeightKg.toLocaleString()} kg
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] text-emerald-300">
                  Tax Diff: {varianceSummary.taxImpactKES.totalTaxDiffKES >= 0 ? '+' : ''}KSh {varianceSummary.taxImpactKES.totalTaxDiffKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Derek Unit Cost:</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  KSh {(summary.items[0]?.landedCostPerUnitExclVat || 0).toFixed(2)} / m
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
