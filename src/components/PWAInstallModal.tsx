import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  ArrowUpRight, 
  Layers, 
  Zap, 
  WifiOff, 
  ShieldCheck,
  Globe
} from 'lucide-react';
import { usePWA, PlatformType } from '../context/PWAContext';
import { cn } from '../lib/utils';

export default function PWAInstallModal() {
  const { 
    isModalOpen, 
    closeInstallModal, 
    platformName, 
    triggerInstall, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isDesktop 
  } = usePWA();

  const [activePlatformTab, setActivePlatformTab] = useState<PlatformType>(
    isIOS ? 'iOS' : isAndroid ? 'Android' : isDesktop ? 'Windows' : 'Android'
  );

  if (!isModalOpen) return null;

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeInstallModal}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden z-10 my-auto"
        >
          {/* Header Bar */}
          <div className="relative bg-gradient-to-r from-brand-blue via-[#0c2e78] to-brand-green px-6 pt-6 pb-5 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-lg border border-white/20 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src="https://i.pinimg.com/1200x/fd/75/c0/fd75c0b874a3b2278a234befb8abc283.jpg"
                    alt="Tewaw App Icon"
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-orange text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      PWA App
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      Universal Install
                    </span>
                  </div>
                  <h3 id="pwa-modal-title" className="text-base sm:text-lg font-black uppercase tracking-tight text-white mt-0.5">
                    Install Tewaw Enterprise App
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInstallModal}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
                aria-label="Close Install Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Why Install Value Points Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-1.5">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Instant Launch</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">Zero load lag</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-1.5">
                  <WifiOff className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Offline Mode</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">Cached catalogue</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-1.5">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Full Screen</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">No browser bars</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">100% Free</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">No store signup</span>
              </div>
            </div>

            {/* Visual App Preview Banner */}
            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-brand-blue to-slate-900 text-white overflow-hidden shadow-md">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-sm bg-white">
                <img
                  src="https://i.pinimg.com/1200x/fd/75/c0/fd75c0b874a3b2278a234befb8abc283.jpg"
                  alt="Tewaw Enterprise App Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-tight text-white truncate">
                    Tewaw Enterprise Official
                  </span>
                  <span className="text-[9px] bg-brand-green/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-bold uppercase">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">
                  Direct factory app with offline catalogue, custom uniforms commissioning, and fast WhatsApp order tracking.
                </p>
              </div>
            </div>

            {/* Platform Selection Tabs */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Instructions By Device
              </p>

              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                {(['Android', 'iOS', 'Windows', 'macOS'] as PlatformType[]).map((tab) => {
                  const isActive = activePlatformTab === tab;
                  const isCurrent = platformName === tab || (tab === 'Windows' && isDesktop);

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivePlatformTab(tab)}
                      className={cn(
                        "flex-1 py-2 px-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 relative",
                        isActive
                          ? "bg-white text-brand-blue shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {tab === 'Android' ? (
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#3DDC84]" aria-hidden="true">
                            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8563 8.125 12 8.125c-1.8563 0-3.5902.2864-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                          </svg>
                          Android
                        </span>
                      ) : tab === 'iOS' ? 'iOS' : tab === 'macOS' ? 'Mac' : tab}
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step-by-step visual instruction card */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
              {/* iOS (iPhone / iPad) */}
              {activePlatformTab === 'iOS' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      In <span className="font-bold text-brand-blue">Safari</span>, tap the <span className="inline-flex items-center gap-1 font-bold text-brand-blue bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"><Share2 className="w-3 h-3 text-brand-blue" /> Share</span> icon at the bottom of the screen.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Scroll down through the share options and tap <span className="inline-flex items-center gap-1 font-bold text-brand-blue bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"><PlusSquare className="w-3 h-3 text-brand-green" /> Add to Home Screen</span>.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Tap <span className="font-bold text-brand-orange">Add</span> in the top right corner. The Tewaw app icon will appear instantly on your home screen!
                    </p>
                  </div>
                </div>
              )}

              {/* Android (Chrome / Firefox / Edge / Samsung Internet) */}
              {activePlatformTab === 'Android' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Tap the <span className="font-black text-brand-green">"Install App Now"</span> button below to invoke the native Android installer.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Or tap browser menu (<span className="font-bold">⋮</span>) in Chrome/Firefox and tap <span className="font-bold text-brand-blue">"Install app"</span> or <span className="font-bold text-brand-blue">"Add to Home screen"</span>.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Confirm installation to launch Tewaw Enterprise as a standalone app with full offline support.
                    </p>
                  </div>
                </div>
              )}

              {/* Windows / PC */}
              {activePlatformTab === 'Windows' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      In Chrome or Edge, click the <span className="inline-flex items-center gap-1 font-bold text-brand-blue bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"><Download className="w-3 h-3 text-brand-orange" /> Install</span> icon located on the right side of your browser's address bar.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Click <span className="font-bold text-brand-blue">Install</span> in the dialog. The app will pin to your Taskbar and Start Menu.
                    </p>
                  </div>
                </div>
              )}

              {/* macOS */}
              {activePlatformTab === 'macOS' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      In <span className="font-bold text-brand-blue">Safari (macOS Sonoma+)</span>: Click <span className="font-bold">File</span> in the top menu bar &gt; <span className="font-bold text-brand-green">Add to Dock...</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      In <span className="font-bold text-brand-blue">Chrome / Edge</span>: Click the install icon in the URL bar or menu &gt; <span className="font-bold text-brand-green">Install Tewaw Enterprise</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-[#E65100] to-brand-green text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-brand-orange/30 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
              >
                <Download className="w-4 h-4 animate-bounce" />
                {isInstalled 
                  ? 'App Already Installed' 
                  : `Install App on ${platformName === 'Other' ? 'Your Device' : platformName}`}
              </button>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                Tewaw Enterprise PWA • Lightweight (&lt; 2 MB) • Automatic Background Updates
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
