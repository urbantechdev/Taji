import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { CategoryType } from '../../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Cloud,
  Layers,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Eye,
  Check,
  Tag,
  Store,
  Info
} from 'lucide-react';
import polarFleeceRollsImg from '../../assets/images/polar_fleece_rolls_1788533080208.jpg';

interface PresetImage {
  name: string;
  url: string;
  description: string;
}

const CATEGORY_PRESETS: Record<CategoryType, PresetImage[]> = {
  Dereck: [
    {
      name: 'Crimson Suiting Weave',
      url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      description: 'Fine high-density textile weave, rich crimson finish'
    },
    {
      name: 'Royal Tweed Weave',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
      description: 'Structured wool-blend suitings texture'
    },
    {
      name: 'Executive Navy Weave',
      url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80',
      description: 'Smooth executive suiting poly-cotton'
    },
    {
      name: 'Charcoal Fine Weave',
      url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
      description: 'Subtle textured weave for formal wear'
    }
  ],
  Fleece: [
    {
      name: 'Polar & Coral Fleece Rolls (Official Taji)',
      url: polarFleeceRollsImg,
      description: 'Official soft thermal polar fleece and coral fleece rolls'
    },
    {
      name: 'Sherpa Warm Plush Fleece Rolls',
      url: polarFleeceRollsImg,
      description: 'High-loft bonded sherpa fleece roll fabric'
    },
    {
      name: 'Coral Velvet Microfleece Rolls',
      url: polarFleeceRollsImg,
      description: 'Ultra-soft lightweight fleece textile rolls'
    },
    {
      name: 'Thermal Heavy Fleece Rolls',
      url: polarFleeceRollsImg,
      description: 'Dense insulating fleece textile weave in rolls'
    }
  ],
  Yarns: [
    {
      name: 'Acrylic 4-Ply Balls',
      url: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=800&q=80',
      description: 'Spun acrylic balls for retail & knitting'
    },
    {
      name: 'Merino Wool Skeins',
      url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      description: 'Natural chunky wool skeins and cones'
    },
    {
      name: 'Velvet Chenille Spools',
      url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      description: 'Lustrous weaving yarn spools'
    },
    {
      name: 'Pastel Hand-Spun Wool',
      url: 'https://images.unsplash.com/photo-1615789591457-74a63395c990?auto=format&fit=crop&w=800&q=80',
      description: 'Vibrant dyed knitting & crochet yarn'
    }
  ]
};

const CATEGORY_META: Record<CategoryType, { label: string; tag: string; description: string; color: string; bg: string }> = {
  Dereck: {
    label: 'Dereck',
    tag: 'Suitings & Superfine Weaves',
    description: 'Fine formal fabrics, poly-viscose weaves, and suiting materials measured in meters & rolls.',
    color: 'text-indigo-700 border-indigo-200 bg-indigo-50',
    bg: 'bg-indigo-600'
  },
  Fleece: {
    label: 'Fleeces',
    tag: 'Polar & Sherpa Fleeces',
    description: 'Heavyweight thermal polar fleece, anti-pill sherpa, and plush fabrics measured in meters & rolls.',
    color: 'text-teal-700 border-teal-200 bg-teal-50',
    bg: 'bg-teal-600'
  },
  Yarns: {
    label: 'Yarns',
    tag: 'Knitting & Weaving Yarns',
    description: '100% Acrylic, cotton, and wool spinning skeins, cones, and balls measured in kilograms (kg) & skeins.',
    color: 'text-amber-700 border-amber-200 bg-amber-50',
    bg: 'bg-amber-600'
  }
};

export const ProductImageManagerModal: React.FC = () => {
  const {
    categoryImages,
    updateCategoryImage,
    isProductImageModalOpen,
    setIsProductImageModalOpen,
    products,
    locations
  } = useERP();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('Dereck');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [applyToAllBatches, setApplyToAllBatches] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isProductImageModalOpen) return null;

  const currentImage = customUrl || categoryImages[activeCategory] || CATEGORY_PRESETS[activeCategory][0].url;
  const categoryProducts = products.filter(p => p.category === activeCategory);
  const totalCategoryUnits = categoryProducts.reduce((sum, p) => {
    const stocks = Object.values(p.locationStock) as number[];
    return sum + stocks.reduce((a, b) => a + (Number(b) || 0), 0);
  }, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WEBP, or SVG).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomUrl(event.target.result as string);
        setFeedback({ type: 'success', message: 'Image loaded successfully! Click "Save Image & Sync to Cloud" to persist.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setCustomUrl(url);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = customUrl.trim() || categoryImages[activeCategory] || CATEGORY_PRESETS[activeCategory][0].url;
    
    setIsSaving(true);
    setFeedback(null);

    const res = await updateCategoryImage(activeCategory, finalUrl, applyToAllBatches);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setCustomUrl('');
      setTimeout(() => {
        setFeedback(null);
      }, 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const meta = CATEGORY_META[activeCategory];
  const presets = CATEGORY_PRESETS[activeCategory];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Product Image Management</h3>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" /> Live Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Update master product images for the 3 core product lines: Dereck, Fleeces, and Yarns.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProductImageModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-3 border-b text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 3 Core Product Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {(['Dereck', 'Fleece', 'Yarns'] as CategoryType[]).map((cat) => {
            const isSelected = activeCategory === cat;
            const catInfo = CATEGORY_META[cat];
            const catBatches = products.filter(p => p.category === cat);
            const img = categoryImages[cat] || CATEGORY_PRESETS[cat][0].url;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCustomUrl('');
                  setFeedback(null);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <img
                  src={img}
                  alt={cat}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">{catInfo.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {catBatches.length} Batches
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Active Product Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-slate-900">{meta.label} Product Line</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${meta.color}`}>
                  {meta.tag}
                </span>
              </div>
              <p className="text-xs text-slate-600">{meta.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Active Stock</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {totalCategoryUnits.toLocaleString()} units ({categoryProducts.length} items)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Live Preview Card */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Image Preview
              </label>
              
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 aspect-4/3 group">
                <img
                  src={currentImage}
                  alt={meta.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-xs font-medium text-slate-300">Product Display Image</span>
                  <p className="text-base font-bold drop-shadow">{meta.label}</p>
                  <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium mt-0.5">
                    <Check className="w-3 h-3" /> Ready for POS, Catalog &amp; E-Commerce
                  </span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image from Computer or Phone
                </button>
              </div>
            </div>

            {/* Right Column: Custom URL & Curated Preset Patterns */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Direct Image URL input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Or Paste Custom Image URL
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Preset Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Curated High-Res Fabric Presets
                  </label>
                  <span className="text-[11px] text-slate-500">Click any preset to apply</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {presets.map((preset, index) => {
                    const isCurrent = currentImage === preset.url;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{preset.name}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</p>
                        </div>
                        {isCurrent && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Batch Propagation Setting */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAllBatches}
                    onChange={e => setApplyToAllBatches(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Apply to all existing {meta.label} inventory batches ({categoryProducts.length} items)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Syncs this image across all {locations.length} branches and cloud Firestore so POS cashiers and inventory managers see the updated image immediately.
                    </span>
                  </div>
                </label>
              </div>

            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCustomUrl(CATEGORY_PRESETS[activeCategory][0].url);
              setFeedback(null);
            }}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Default Texture
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProductImageModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              {isSaving ? 'Syncing to Cloud...' : `Save & Sync ${meta.label} Image`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
