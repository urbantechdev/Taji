import React, { useState } from 'react';
import { ProductBatch, TareProfile, TareCalculationType } from '../../types';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import {
  Scale,
  X,
  Check,
  Package,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface TareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductBatch;
  onSaveTareProfile: (batchId: string, profile: TareProfile) => void;
}

const PRESET_TARE_CONTAINERS = [
  { name: 'Plastic Yarn Cone (50g)', tareKg: 0.050, cost: 15, type: 'fixed_tare' as TareCalculationType, desc: 'Standard conical plastic core for 4-ply/8-ply acrylic & wool' },
  { name: 'Heavy Paper/Cardboard Tube (250g)', tareKg: 0.250, cost: 35, type: 'fixed_tare' as TareCalculationType, desc: 'Rolled cylindrical core for fleeces and microfibers' },
  { name: 'Heavy Wooden Spool (120g)', tareKg: 0.120, cost: 40, type: 'fixed_tare' as TareCalculationType, desc: 'Flanged wooden bobbin for industrial sewing & weaving yarns' },
  { name: 'Cardboard Dereck Core (350g)', tareKg: 0.350, cost: 45, type: 'fixed_tare' as TareCalculationType, desc: 'Rigid cardboard roll for heavy Dereck and tweed suiting' },
  { name: 'Polybag Wrap Tare (20g)', tareKg: 0.020, cost: 5, type: 'fixed_tare' as TareCalculationType, desc: 'Protective shrinkwrap / polythene envelope' },
  { name: 'Custom Percentage Tare (2.5%)', tareKg: 0, cost: 0, percent: 2.5, type: 'percentage_tare' as TareCalculationType, desc: 'Dynamic tare percentage deduction based on gross batch scale weight' }
];

export const TareSettingsModal: React.FC<TareSettingsModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaveTareProfile
}) => {
  const currentProfile = product.tareProfile || {
    tareWeightPerUnit: product.category === 'Yarns' ? 0.050 : product.category === 'Fleece' ? 0.250 : 0.350,
    tareType: 'fixed_tare',
    packagingDescription: product.category === 'Yarns' ? 'Plastic Yarn Cone (50g)' : 'Cardboard Roll Core',
    packagingCost: product.category === 'Yarns' ? 15 : 35,
    isTareDeductedAtPOS: true
  };

  const [tareType, setTareType] = useState<TareCalculationType>(currentProfile.tareType || 'fixed_tare');
  const [tareWeightKg, setTareWeightKg] = useState<number>(currentProfile.tareWeightPerUnit ?? 0.050);
  const [tarePercent, setTarePercent] = useState<number>(currentProfile.tarePercent ?? 2.5);
  const [packagingDescription, setPackagingDescription] = useState<string>(currentProfile.packagingDescription || 'Plastic Yarn Cone');
  const [packagingCost, setPackagingCost] = useState<number>(currentProfile.packagingCost ?? 15);
  const [isTareDeductedAtPOS, setIsTareDeductedAtPOS] = useState<boolean>(currentProfile.isTareDeductedAtPOS ?? true);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TARE_CONTAINERS[0]) => {
    playClickSound();
    setTareType(preset.type);
    setTareWeightKg(preset.tareKg);
    if (preset.percent) setTarePercent(preset.percent);
    setPackagingDescription(preset.name);
    setPackagingCost(preset.cost);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessSound();
    const updatedProfile: TareProfile = {
      tareType,
      tareWeightPerUnit: tareType === 'fixed_tare' ? Number(tareWeightKg) : 0,
      tarePercent: tareType === 'percentage_tare' ? Number(tarePercent) : undefined,
      packagingDescription,
      packagingCost: Number(packagingCost),
      isTareDeductedAtPOS
    };
    onSaveTareProfile(product.id, updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-8">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rose" />

        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
                  Tare Packaging Profile
                </span>
                <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">{product.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Informational Guidance Banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3">
            <Info className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 space-y-1">
              <p className="font-bold">Net Stock & Balance Sheet Protection</p>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                When goods arrive in Net Weight and are weighed on scales in Gross Weight, configuring this Tare profile guarantees the POS and inventory modules auto-deduct core weight before decrementing inventory stock.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Standard Textile Packaging Presets</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TARE_CONTAINERS.map(preset => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                    packagingDescription === preset.name
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{preset.name}</span>
                    <span className="font-mono text-rose-700">{preset.tareKg > 0 ? `${preset.tareKg * 1000}g` : `${preset.percent}%`}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tare Mode Toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tare Calculation Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTareType('fixed_tare')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  tareType === 'fixed_tare'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Fixed Core (kg)
              </button>
              <button
                type="button"
                onClick={() => setTareType('percentage_tare')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  tareType === 'percentage_tare'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setTareType('none')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  tareType === 'none'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Zero Tare (100% Net)
              </button>
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tareType === 'fixed_tare' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tare Weight Per Unit / Core (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="10"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                    kg ({(tareWeightKg * 1000).toFixed(0)}g)
                  </span>
                </div>
              </div>
            )}

            {tareType === 'percentage_tare' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deduction Tare Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={tarePercent}
                    onChange={(e) => setTarePercent(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Packaging Asset Cost (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={packagingCost}
                onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 15"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Packaging Description / Core Label
            </label>
            <input
              type="text"
              value={packagingDescription}
              onChange={(e) => setPackagingDescription(e.target.value)}
              placeholder="e.g., Plastic Yarn Cone 50g"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Auto-Deduct Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <input
              type="checkbox"
              id="isTareDeductedAtPOS"
              checked={isTareDeductedAtPOS}
              onChange={(e) => setIsTareDeductedAtPOS(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="isTareDeductedAtPOS" className="text-xs text-slate-800 font-medium cursor-pointer">
              <span className="font-bold text-slate-900 block">Enforce Auto-Deduction at POS Checkout</span>
              When cashier enters gross scale reading, automatically calculate and bill pure net weight.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Tare Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
