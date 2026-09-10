import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, CheckCheck, Sparkles, Send } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const PREFILLED_MESSAGE = "Hello Tewaw Enterprise, I would like to inquire about bulk garment manufacturing and DTF printing/branding.";

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissedPrompt, setHasDismissedPrompt] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));
  }, []);

  const rawPhone = settings?.whatsappNumber?.replace(/[^\d]/g, '') || '254736619688';
  const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="floating-whatsapp-container" className="fixed bottom-20 lg:bottom-8 right-4 sm:right-7 z-[380] flex flex-col items-end pointer-events-none">
      {/* Interactive Popup Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="whatsapp-chat-preview-card"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-80 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="bg-[#075E54] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden border border-white/20">
                    <img 
                      src="/logo.svg" 
                      alt="Tewaw Enterprise" 
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.svg';
                      }} 
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight leading-none text-white">Tewaw Enterprise</h4>
                  <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Uhuru Market, Nairobi &bull; Online
                  </p>
                </div>
              </div>
              <button
                id="close-whatsapp-preview-btn"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close WhatsApp chat preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Chat Bubble */}
            <div className="p-4 bg-[#ECE5DD]/40 space-y-3">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 max-w-[90%]">
                <p className="text-xs text-slate-700 leading-relaxed">
                  👋 <strong className="text-slate-900 font-semibold">Habari!</strong> Looking for bulk garment manufacturing, custom DTF printing, or corporate uniforms?
                </p>
                <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md inline-flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Instant quote & sample consultations
                </div>
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                  <span>Just now</span>
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                </div>
              </div>

              {/* Pre-filled Message Tag Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider mb-1">
                  Ready to send via WhatsApp:
                </p>
                <p className="text-xs text-slate-700 italic bg-white p-2 rounded-lg border border-slate-100 font-medium">
                  "{PREFILLED_MESSAGE}"
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="p-3.5 bg-white border-t border-slate-100">
              <button
                id="start-whatsapp-direct-chat-btn"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Start Chat on WhatsApp</span>
                <Send className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Subtle quick badge if preview is closed */}
        {!isOpen && !hasDismissedPrompt && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-100 text-slate-800 cursor-pointer group hover:border-emerald-200 transition-all"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-[#075E54] transition-colors">
              Inquire about DTF & Branding
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasDismissedPrompt(true);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        <motion.button
          id="floating-whatsapp-btn"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (isOpen) {
              handleOpenWhatsApp();
            } else {
              setIsOpen(true);
            }
          }}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl shadow-[#25D366]/40 cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
          aria-label="Chat with Tewaw Enterprise on WhatsApp"
        >
          {/* Subtle radar ripple ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />

          {/* Unread dot */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            1
          </span>

          <MessageCircle className="w-7 h-7 fill-white" />
        </motion.button>
      </div>
    </div>
  );
}
