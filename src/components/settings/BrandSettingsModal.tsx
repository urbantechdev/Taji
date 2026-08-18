import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import { Palette, Image as ImageIcon, Upload, Link as LinkIcon, Trash2, Sparkles, X, Check, RefreshCw, Globe, FileImage } from 'lucide-react';

export const BrandSettingsModal: React.FC = () => {
  const {
    brandSettings,
    updateBrandSettings,
    isBrandSettingsModalOpen,
    setIsBrandSettingsModalOpen
  } = useERP();

  const [brandName, setBrandName] = useState(brandSettings.brandName);
  const [tagline, setTagline] = useState(brandSettings.tagline);
  const [headerBgColor, setHeaderBgColor] = useState(brandSettings.headerBgColor);
  const [primaryColor, setPrimaryColor] = useState(brandSettings.primaryColor);
  const [logoUrl, setLogoUrl] = useState(brandSettings.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(brandSettings.faviconUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);

  if (!isBrandSettingsModalOpen) return null;

  const colorPresets = [
    { name: 'Taji Pink', hex: '#B50044', bgOption: 'pink' },
    { name: 'Rose Red', hex: '#e11d48', bgOption: 'rose' },
    { name: 'Royal Indigo', hex: '#4f46e5', bgOption: 'indigo' },
    { name: 'Emerald Green', hex: '#059669', bgOption: 'emerald' },
    { name: 'Warm Amber', hex: '#d97706', bgOption: 'amber' },
    { name: 'Slate Dark', hex: '#1e293b', bgOption: 'slate' },
  ];

  const handleLogoFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WEBP, ICO).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WEBP, ICO).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFaviconUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandSettings({
      brandName,
      tagline,
      headerBgColor,
      primaryColor,
      logoUrl: logoUrl.trim() || undefined,
      faviconUrl: faviconUrl.trim() || undefined
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsBrandSettingsModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white p-5 flex items-center justify-between shrink-0">
          <ReflectionOverlay />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Brand, Logo &amp; Favicon Settings</h3>
              <p className="text-xs text-pink-100">Upload or link your custom logo, favicon &amp; header theme</p>
            </div>
          </div>
          <button
            onClick={() => setIsBrandSettingsModalOpen(false)}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Brand Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Platform / Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="e.g. Taji"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subhead / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Multi-Location ERP & POS Platform"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Header Theme &amp; Brand Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {colorPresets.map(preset => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => {
                    setHeaderBgColor(preset.bgOption);
                    setPrimaryColor(preset.hex);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    headerBgColor === preset.bgOption
                      ? 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-lg shrink-0 shadow-xs border border-white"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{preset.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{preset.hex}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Logo Section */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 text-pink-700 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brand Logo</h4>
                  <p className="text-[11px] text-slate-500">Appears in header, invoices &amp; reports</p>
                </div>
              </div>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            {/* Logo Preview & Upload Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Preview Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center min-h-[110px] shadow-xs">
                {logoUrl ? (
                  <div className="w-20 h-20 rounded-full border-2 border-pink-500/40 p-1 bg-slate-50 ring-4 ring-pink-50 flex items-center justify-center overflow-hidden">
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-sm border-2 border-white">
                      {(brandName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Logo Badge</span>
                  </div>
                )}
              </div>

              {/* Upload Drop Zone & URL */}
              <div className="sm:col-span-2 space-y-2">
                {/* Upload Button Box */}
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleLogoFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleLogoFileUpload(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-pink-500 bg-white rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                >
                  <Upload className="w-4 h-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-pink-600">
                    Upload Logo File
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(PNG, JPG, SVG)</span>
                </div>

                {/* URL Input */}
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="Or paste Logo Image URL..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Favicon Section */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Browser Favicon</h4>
                  <p className="text-[11px] text-slate-500">Appears in browser tab &amp; mobile bookmarks</p>
                </div>
              </div>

              {faviconUrl && (
                <button
                  type="button"
                  onClick={() => setFaviconUrl('')}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Favicon</span>
                </button>
              )}
            </div>

            {/* Favicon Preview & Upload Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tab Preview Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col items-center justify-center text-center">
                {/* Simulated Browser Tab */}
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 shadow-xs">
                  <div className="w-4 h-4 rounded-xs border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {faviconUrl || logoUrl ? (
                      <img src={faviconUrl || logoUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain" />
                    ) : (
                      <FileImage className="w-3 h-3 text-pink-600" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 truncate">{brandName || 'Taji'}</span>
                </div>
                <span className="text-[9px] font-medium text-slate-400 mt-1">Browser Tab Preview</span>
              </div>

              {/* Upload Drop Zone & URL */}
              <div className="sm:col-span-2 space-y-2">
                {/* Upload Favicon Input Box */}
                <input
                  type="file"
                  ref={faviconFileInputRef}
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFaviconFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <div
                  onClick={() => faviconFileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFaviconFileUpload(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                >
                  <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                    Upload Favicon File
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(ICO, PNG 32x32)</span>
                </div>

                {/* Favicon URL Input */}
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={faviconUrl.startsWith('data:') ? '' : faviconUrl}
                    onChange={e => setFaviconUrl(e.target.value)}
                    placeholder="Or paste Favicon Image URL..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setBrandName('Taji');
                setTagline('Textile Inventory & ETR Billing Platform');
                setHeaderBgColor('pink');
                setPrimaryColor('#B50044');
                setLogoUrl('');
                setFaviconUrl('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBrandSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-200" />
                    <span>Apply Brand Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
