import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Palette,
  Volume2,
  VolumeX,
  Cloud,
  Download,
  Trash2,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Upload,
  Globe,
  Database,
  Radio
} from 'lucide-react';
import {
  playClickSound,
  playSuccessSound,
  playBarcodeScanBeep,
  playAddToCartSound,
  isSoundEnabled,
  toggleSound
} from '../../utils/audio';

export const GeneralPlatformSettings: React.FC = () => {
  const {
    brandSettings,
    updateBrandSettings,
    cloudSyncStatus,
    syncCloudInventory,
    lastCloudSync,
    purgeAllMockData,
    products,
    orders,
    ledger,
    transfers,
    staff,
    locations,
    recordAuditLog
  } = useERP();

  // Brand state
  const [brandName, setBrandName] = useState(brandSettings.brandName || 'TAJI');
  const [tagline, setTagline] = useState(brandSettings.tagline || 'Textile ERP & Autonomous Branch Operations');
  const [headerBgColor, setHeaderBgColor] = useState(brandSettings.headerBgColor || 'pink');
  const [primaryColor, setPrimaryColor] = useState(brandSettings.primaryColor || '#B50044');
  const [logoUrl, setLogoUrl] = useState(brandSettings.logoUrl || '');
  const [supportEmail, setSupportEmail] = useState(brandSettings.supportEmail || 'support@taji.co.ke');
  const [supportPhone, setSupportPhone] = useState(brandSettings.supportPhone || '+254 700 000 000');
  const [address, setAddress] = useState(brandSettings.address || 'Biashara Street, Nairobi, Kenya');

  // Audio state
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  // Feedback & sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorPresets = [
    { name: 'Taji Pink', hex: '#B50044', bgOption: 'pink' },
    { name: 'Rose Red', hex: '#e11d48', bgOption: 'rose' },
    { name: 'Royal Indigo', hex: '#4f46e5', bgOption: 'indigo' },
    { name: 'Emerald Green', hex: '#059669', bgOption: 'emerald' },
    { name: 'Warm Amber', hex: '#d97706', bgOption: 'amber' },
    { name: 'Slate Dark', hex: '#1e293b', bgOption: 'slate' },
  ];

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    updateBrandSettings({
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      headerBgColor,
      primaryColor,
      logoUrl: logoUrl.trim() || undefined,
      supportEmail: supportEmail.trim() || undefined,
      supportPhone: supportPhone.trim() || undefined,
      address: address.trim() || undefined
    });
    playSuccessSound();
    setStatusMessage({ type: 'success', text: 'Brand identity & store details updated successfully!' });
    recordAuditLog('BRAND_SETTINGS_UPDATED', `Brand name ${brandName} updated`);
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setLogoUrl(e.target.result as string);
        playSuccessSound();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playSuccessSound();
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    playClickSound();
    try {
      const res = await syncCloudInventory();
      playSuccessSound();
      setStatusMessage({ type: 'success', text: `Cloud synchronization complete! Synced ${res.count} inventory batches.` });
      recordAuditLog('CLOUD_SYNC_FORCED', 'Manual cloud sync triggered');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Cloud sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJsonBackup = () => {
    playClickSound();
    const backupData = {
      exportedAt: new Date().toISOString(),
      platform: 'Taji Textile ERP',
      brand: brandSettings,
      productsCount: products.length,
      products,
      ordersCount: orders.length,
      orders,
      ledgerCount: ledger.length,
      ledger,
      transfersCount: transfers.length,
      transfers,
      staffCount: staff.length,
      staff,
      locations
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Taji_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSuccessSound();
    setStatusMessage({ type: 'success', text: 'Downloaded complete JSON system database backup!' });
  };

  return (
    <div className="space-y-6" id="general-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              General Platform &amp; Brand Settings
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                System Hub
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Customize brand logo, header colors, audio sound feedback, cloud Firestore synchronization &amp; data backups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Database</span>
          </button>
        </div>
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

      {/* 2-Column Grid: Brand Form + System Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Brand Identity & Colors */}
        <form onSubmit={handleSaveBrand} className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Palette className="w-5 h-5 text-pink-700" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1. Brand Identity &amp; Header Theme
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Company Name</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Theme Color Palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {colorPresets.map(preset => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setHeaderBgColor(preset.bgOption);
                    setPrimaryColor(preset.hex);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    headerBgColor === preset.bgOption
                      ? 'border-pink-600 bg-pink-50 ring-1 ring-pink-600 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full shadow-xs shrink-0" style={{ backgroundColor: preset.hex }} />
                  <span className="text-xs text-slate-800">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logo & Contact details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Logo Image URL or Upload</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Store Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              Save Brand Customization
            </button>
          </div>
        </form>

        {/* Right Column: Audio & Cloud Persistence */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Audio & Sound FX */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  2. Sound FX &amp; Audio Feedback
                </h4>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !soundOn
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {!soundOn ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{!soundOn ? 'Muted' : 'Enabled'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Interactive audio chimes for barcode scanning, cart additions, and success alerts.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playBarcodeScanBeep();
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Test Barcode Beep
              </button>
              <button
                type="button"
                onClick={() => {
                  playAddToCartSound();
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Test Add to Cart Chime
              </button>
            </div>
          </div>

          {/* Cloud Synchronization & Backups */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-pink-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-pink-400">
                  3. Cloud Firestore Synchronization
                </h4>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {cloudSyncStatus}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Active Multi-Store Database: <strong>Live Firestore</strong></p>
              <p className="text-[11px] text-slate-400">
                Last Synchronized: {lastCloudSync ? new Date(lastCloudSync).toLocaleTimeString() : 'Real-time Stream Connected'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleForceSync}
              disabled={isSyncing}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing Cloud...' : 'Force Cloud Sync Now'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
