import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Sparkles, Monitor } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export default function PWAInstallBanner() {
  const { 
    showBanner, 
    dismissBanner, 
    openInstallModal, 
    triggerInstall, 
    platformName, 
    isInstalled, 
    isDesktop 
  } = usePWA();

  if (!showBanner || isInstalled) return null;

  const handleAction = async () => {
    await triggerInstall();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[600] max-w-sm w-[calc(100%-2rem)] sm:w-auto"
      >
        <div className="p-3 sm:p-3.5 bg-brand-blue/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-white/15 flex items-center gap-3 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/20 rounded-full blur-xl pointer-events-none" />

          {/* App Icon */}
          <div className="w-11 h-11 rounded-2xl bg-white p-0.5 shrink-0 shadow-md border border-white/20 overflow-hidden flex items-center justify-center">
            <img
              src="/icon-192.png"
              alt="Tewaw App"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-tight text-white truncate">
                Tewaw Enterprise
              </span>
              <span className="text-[8px] bg-brand-green font-black uppercase px-1.5 py-0.2 rounded text-white shrink-0">
                App
              </span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
              Install for instant offline catalogue & 1-tap re-order
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAction}
              className="py-1.5 px-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-orange/30 flex items-center gap-1 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
            >
              <Download className="w-3 h-3" />
              Install
            </button>

            <button
              type="button"
              onClick={dismissBanner}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              aria-label="Dismiss App Install Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
