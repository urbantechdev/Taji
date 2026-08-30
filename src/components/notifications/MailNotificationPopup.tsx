import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { Mail, CheckCircle2, PackageCheck, X, Clock, Sparkles, Check } from 'lucide-react';
import { playNotificationSound, playClickSound, playSuccessSound } from '../../utils/audio';

export const MailNotificationPopup: React.FC = () => {
  const {
    activeToastNotification,
    setActiveToastNotification,
    markNotificationRead,
    acceptPurchaseOrder,
    receiveRestockTransfer,
    resumeTransferredSaleToCart,
    activeLocation,
    posSession
  } = useERP();

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [actionDoneText, setActionDoneText] = useState<string | null>(null);

  // Effective current store location of the active session / operator terminal
  const currentStoreLocation = posSession?.isUnlocked ? posSession.location : activeLocation;

  // STRICT RECIPIENT VISIBILITY RULE:
  // Show incoming notifications to target store.
  // Also show direct operation confirmation popups (e.g. transfer received successfully).
  const isTargetRecipient = Boolean(
    activeToastNotification &&
    (
      activeToastNotification.toLocation === currentStoreLocation ||
      activeToastNotification.toLocation === activeLocation ||
      activeToastNotification.fromLocation === activeToastNotification.toLocation
    )
  );

  useEffect(() => {
    if (activeToastNotification && isTargetRecipient) {
      setIsFadingOut(false);
      setActionDoneText(null);
      playNotificationSound();
    }
  }, [activeToastNotification?.id, isTargetRecipient]);

  if (!activeToastNotification || !isTargetRecipient) return null;

  const notif = activeToastNotification;
  const isPurchase = notif.transferType === 'order_fulfillment_reroute';

  const triggerFadeAndComplete = (callback: () => void, feedbackText?: string) => {
    if (feedbackText) {
      setActionDoneText(feedbackText);
    }
    setIsFadingOut(true);
    setTimeout(() => {
      callback();
      setActiveToastNotification(null);
      setIsFadingOut(false);
      setActionDoneText(null);
    }, 600);
  };

  const handleAction = () => {
    playSuccessSound();
    triggerFadeAndComplete(() => {
      markNotificationRead(notif.id, isPurchase ? 'Accepted & Processed' : 'Stock Received');
      if (notif.transferType === 'order_fulfillment_reroute') {
        acceptPurchaseOrder(notif.transferId, 'M-Pesa');
      } else {
        receiveRestockTransfer(notif.transferId);
      }
    }, isPurchase ? 'Purchase Order Accepted & Processed ✓' : 'Stock Received into Inventory ✓');
  };

  const handleResumeInPOS = () => {
    playClickSound();
    triggerFadeAndComplete(() => {
      markNotificationRead(notif.id, 'Resumed in POS Checkout');
      resumeTransferredSaleToCart(notif.transferId);
    }, 'Resuming Sale in POS Counter...');
  };

  const handleDismiss = () => {
    triggerFadeAndComplete(() => {
      markNotificationRead(notif.id, 'Dismissed & Moved to History');
    }, 'Moved to History ✓');
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:max-w-md w-auto sm:w-full transition-all duration-600 ease-in-out ${
        isFadingOut
          ? 'opacity-0 translate-y-6 scale-95 pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5 duration-300'
      }`}
    >
      <div className="group relative overflow-hidden bg-slate-900/95 text-white rounded-2xl shadow-2xl border-2 border-pink-500/80 hover:border-pink-400 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(244,63,94,0.3)] p-4 backdrop-blur-md">
        
        {/* Blended Color Edge Accent */}
        <RightEdgeBlend variant="rainbow" />

        {/* Top Animated Pulse Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-pink-500 via-purple-500 to-rose-500 animate-pulse group-hover:h-2 transition-all" />

        {/* Action Done Feedback Overlay */}
        {actionDoneText && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 z-20 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-emerald-300 font-extrabold text-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-300 animate-scaleUp" />
              </div>
              <span>{actionDoneText}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pink-600/40 border border-pink-400 flex items-center justify-center text-pink-300 shrink-0 relative group-hover:scale-110 group-hover:bg-pink-500/50 transition-all duration-300">
              <Mail className="w-5 h-5 animate-bounce text-pink-300 group-hover:text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-pink-300 bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-700/50 flex items-center gap-1 w-fit group-hover:border-pink-400 transition-colors">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                {isPurchase ? 'Purchase Reroute' : 'Restock Request'}
              </span>
              <h4 className="font-bold text-sm text-white mt-0.5 leading-tight group-hover:text-pink-200 transition-colors">
                {notif.title}
              </h4>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Message body with hover effect */}
        <div className="my-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-pink-500/50 transition-all duration-200 hover:shadow-inner group/msg">
          <p className="text-xs text-slate-200 leading-relaxed group-hover/msg:text-white transition-colors">
            {notif.message}
          </p>
        </div>

        {/* Details & Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 font-medium transition-colors cursor-pointer"
            >
              Dismiss
            </button>

            {isPurchase ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResumeInPOS}
                  className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                  title="Auto-holds receiver active queue and loads transferred sale into POS"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Resume in POS</span>
                </button>
                <button
                  onClick={handleAction}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quick Accept</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAction}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-pink-950 flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Receive Stock</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
