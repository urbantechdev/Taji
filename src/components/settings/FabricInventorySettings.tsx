import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CategoryType, DefectReasonType } from '../../types';
import {
  Scissors,
  Scale,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Box,
  FileSpreadsheet
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface CustomTarePreset {
  id: string;
  name: string;
  category: string;
  tareWeightKg: number;
  description: string;
}

export const FabricInventorySettings: React.FC = () => {
  const {
    categoryPricingConfigs,
    updateCategoryPricingConfig,
    recordAuditLog,
    currentUser
  } = useERP();

  // Tare presets state
  const [tarePresets, setTarePresets] = useState<CustomTarePreset[]>(() => {
    try {
      const saved = localStorage.getItem('fabric_tare_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'tare-cone-small', name: 'Plastic Yarn Cone (Standard)', category: 'Yarns', tareWeightKg: 0.070, description: 'Standard plastic inner cone for 1kg - 2kg yarn cones' },
      { id: 'tare-cone-heavy', name: 'Heavy Industrial Spool', category: 'Yarns', tareWeightKg: 0.120, description: 'Heavy-duty industrial plastic core' },
      { id: 'tare-tube-fleece', name: 'Cardboard Core Tube (Fleece)', category: 'Fleece', tareWeightKg: 0.840, description: 'Standard thick cardboard inner tube for 60-80m fleece rolls' },
      { id: 'tare-tube-dereck', name: 'Light Cardboard Tube (Dereck)', category: 'Dereck', tareWeightKg: 0.520, description: 'Medium thickness inner core for 50m dereck rolls' },
      { id: 'tare-bale-cover', name: 'Woven Poly Bale Wrapping', category: 'General', tareWeightKg: 0.350, description: 'Outer protective packaging per bale' }
    ];
  });

  // Cut-Loss & Remnant Controls
  const [cutLossWastagePct, setCutLossWastagePct] = useState<number>(() => {
    return Number(localStorage.getItem('fabric_cutloss_pct')) || 2.0;
  });
  const [remnantThresholdMeters, setRemnantThresholdMeters] = useState<number>(() => {
    return Number(localStorage.getItem('fabric_remnant_threshold')) || 3.0;
  });
  const [remnantDiscountPct, setRemnantDiscountPct] = useState<number>(() => {
    return Number(localStorage.getItem('fabric_remnant_disc_pct')) || 25.0;
  });
  const [autoDeductTareAtScale, setAutoDeductTareAtScale] = useState<boolean>(() => {
    return localStorage.getItem('fabric_auto_tare') !== 'false';
  });

  // Defect Classifications State
  const [defectTypes, setDefectTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fabric_defect_types');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      'Oil Stain / Machine Grease',
      'Weave Flaw / Broken Warp',
      'Color Variation / Shade Banding',
      'Edge Fray / Slit Defect',
      'Short Meterage / Tension Slack',
      'Hole / Tear on Roll',
      'Foreign Thread Contamination'
    ];
  });

  const [newDefectInput, setNewDefectInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Tare Preset Modal / Form
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetForm, setNewPresetForm] = useState({
    name: '',
    category: 'Yarns',
    tareWeightKg: 0.080,
    description: ''
  });

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    playClickSound();

    try {
      localStorage.setItem('fabric_tare_presets', JSON.stringify(tarePresets));
      localStorage.setItem('fabric_cutloss_pct', String(cutLossWastagePct));
      localStorage.setItem('fabric_remnant_threshold', String(remnantThresholdMeters));
      localStorage.setItem('fabric_remnant_disc_pct', String(remnantDiscountPct));
      localStorage.setItem('fabric_auto_tare', String(autoDeductTareAtScale));
      localStorage.setItem('fabric_defect_types', JSON.stringify(defectTypes));

      // Sync default tare weights to CategoryPricingConfigs
      const yarnPreset = tarePresets.find(p => p.category === 'Yarns')?.tareWeightKg ?? 0.070;
      const fleecePreset = tarePresets.find(p => p.category === 'Fleece')?.tareWeightKg ?? 0.840;
      const dereckPreset = tarePresets.find(p => p.category === 'Dereck')?.tareWeightKg ?? 0.520;

      updateCategoryPricingConfig('Yarns', { coneTareWeightKg: yarnPreset, autoDeductTareAtPOS: autoDeductTareAtScale });
      updateCategoryPricingConfig('Fleece', { baleTareWeightKg: fleecePreset, autoDeductTareAtPOS: autoDeductTareAtScale });
      updateCategoryPricingConfig('Dereck', { baleTareWeightKg: dereckPreset, autoDeductTareAtPOS: autoDeductTareAtScale });

      playSuccessSound();
      setStatusMessage({
        type: 'success',
        text: 'Fabric tare weights, cut-loss wastage & defect rules saved successfully!'
      });
      recordAuditLog('FABRIC_SETTINGS_UPDATED', `Saved tare presets, ${cutLossWastagePct}% cut loss, & defect classifications`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save fabric settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTarePreset = () => {
    if (!newPresetForm.name.trim()) return;
    const newP: CustomTarePreset = {
      id: `tare-${Date.now().toString().slice(-4)}`,
      name: newPresetForm.name.trim(),
      category: newPresetForm.category,
      tareWeightKg: Number(newPresetForm.tareWeightKg) || 0,
      description: newPresetForm.description.trim()
    };
    setTarePresets([...tarePresets, newP]);
    setNewPresetForm({ name: '', category: 'Yarns', tareWeightKg: 0.080, description: '' });
    setIsAddingPreset(false);
    playClickSound();
  };

  const handleDeleteTarePreset = (id: string) => {
    setTarePresets(tarePresets.filter(p => p.id !== id));
    playClickSound();
  };

  const handleAddDefectType = () => {
    if (!newDefectInput.trim()) return;
    if (defectTypes.includes(newDefectInput.trim())) return;
    setDefectTypes([...defectTypes, newDefectInput.trim()]);
    setNewDefectInput('');
    playClickSound();
  };

  const handleDeleteDefectType = (defect: string) => {
    setDefectTypes(defectTypes.filter(d => d !== defect));
    playClickSound();
  };

  return (
    <form onSubmit={handleSaveAllSettings} className="space-y-6" id="fabric-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Fabric &amp; Special Inventory Controls
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Tare &amp; Cut-Loss
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Govern dual-weight gross/tare deductions, roll core tare presets, cut-loss wastage %, remnant cutoff thresholds &amp; defect quarantine rules.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Fabric Controls'}</span>
        </button>
      </div>

      {/* Status Feedback */}
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

      {/* 3 Main Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Dual-Weight Tare Governance & Presets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Tare Weight Presets
                </h4>
                <p className="text-[10px] text-slate-400">Cone &amp; core packaging deductions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPreset(!isAddingPreset)}
              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-200"
              title="Add Preset"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Preset Inline Form */}
          {isAddingPreset && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="text-[11px] font-black text-amber-900">Add Tare Preset</div>
              <input
                type="text"
                value={newPresetForm.name}
                onChange={e => setNewPresetForm({ ...newPresetForm, name: e.target.value })}
                placeholder="Core / Spool Name"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-hidden"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newPresetForm.category}
                  onChange={e => setNewPresetForm({ ...newPresetForm, category: e.target.value })}
                  className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-hidden"
                >
                  <option value="Yarns">Yarns</option>
                  <option value="Fleece">Fleece</option>
                  <option value="Dereck">Dereck</option>
                  <option value="General">General</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newPresetForm.tareWeightKg}
                    onChange={e => setNewPresetForm({ ...newPresetForm, tareWeightKg: Number(e.target.value) })}
                    placeholder="Weight (kg)"
                    className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-hidden"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold">kg</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(false)}
                  className="px-2.5 py-1 text-[11px] text-slate-600 font-bold hover:bg-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTarePreset}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-black rounded-md"
                >
                  Add Preset
                </button>
              </div>
            </div>
          )}

          {/* List of Tare Presets */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {tarePresets.map(preset => (
              <div
                key={preset.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 truncate">{preset.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{preset.description || `${preset.tareWeightKg} kg tare deduct`}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-black text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    {preset.tareWeightKg.toFixed(3)} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTarePreset(preset.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Auto-Deduct Tare at Scale</span>
              <span className="text-[10px] text-slate-400">Subtracts core tare from billable weight automatically</span>
            </div>
            <input
              type="checkbox"
              checked={autoDeductTareAtScale}
              onChange={e => setAutoDeductTareAtScale(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Card 2: Cut-Loss Wastage & Remnant Policies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Cut-Loss &amp; Remnants
              </h4>
              <p className="text-[10px] text-slate-400">Roll wastage allowance &amp; off-cut pricing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cutting Wastage Allowance (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={cutLossWastagePct}
                  onChange={e => setCutLossWastagePct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Standard tolerance allowance for blade kerf, tension contraction &amp; edge squaring.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remnant Off-Cut Threshold Length (Meters)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={remnantThresholdMeters}
                  onChange={e => setRemnantThresholdMeters(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">m</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Roll pieces remaining under this length are auto-classified as clearance remnants.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remnant Clearance Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={remnantDiscountPct}
                  onChange={e => setRemnantDiscountPct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Default discount applied to off-cut fabric remnants to accelerate stock liquidation.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Live Policy Simulation:
              </span>
              <p className="text-blue-700">
                A 70m fleece roll with 1.8m left will be tagged as <strong>Remnant</strong> at <strong>{remnantDiscountPct}% off</strong> standard meter rate.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Defect Classifications & Quarantine Rules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Defect Classification
              </h4>
              <p className="text-[10px] text-slate-400">Quarantine reasons &amp; RMA tags</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDefectInput}
                onChange={e => setNewDefectInput(e.target.value)}
                placeholder="New Defect Reason..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddDefectType}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {defectTypes.map((defect, index) => (
                <div
                  key={index}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-bold text-slate-800 truncate">{defect}</span>
                  {defectTypes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDefectType(defect)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              These flaw classifications appear in the Quarantine RMA Return Module for logging manufacturer claims.
            </p>
          </div>
        </div>

      </div>
    </form>
  );
};
