import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Trash2, 
  HelpCircle,
  Loader2
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  icon?: 'trash' | 'alert' | 'info' | 'help' | 'check';
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success' | 'info';
  onClose?: () => void;
}

interface PopupPromptContextType {
  // Toasts
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
  };
  // Dialog Prompts
  promptConfirm: (options: ConfirmDialogOptions) => void;
  promptAlert: (options: AlertDialogOptions) => void;
}

const PopupPromptContext = createContext<PopupPromptContextType | undefined>(undefined);

export function PopupPromptProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertDialogOptions | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Add a toast
  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts(prev => [newToast, ...prev].slice(0, 5));

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: useCallback((title: string, message?: string, duration?: number) => {
      showToast('success', title, message, duration);
    }, [showToast]),
    error: useCallback((title: string, message?: string, duration?: number) => {
      showToast('error', title, message, duration || 5000);
    }, [showToast]),
    warning: useCallback((title: string, message?: string, duration?: number) => {
      showToast('warning', title, message, duration);
    }, [showToast]),
    info: useCallback((title: string, message?: string, duration?: number) => {
      showToast('info', title, message, duration);
    }, [showToast]),
  };

  const promptConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const promptAlert = useCallback((options: AlertDialogOptions) => {
    setAlertDialog(options);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    try {
      setIsActionLoading(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err: any) {
      console.error('Confirmation action error:', err);
      toast.error('Action Failed', err?.message || 'An unexpected error occurred.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <PopupPromptContext.Provider
      value={{
        showToast,
        toast,
        promptConfirm,
        promptAlert
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map(t => {
            let bgClass = 'bg-white border-slate-200 text-slate-800 shadow-xl';
            let iconElement = <Info className="w-5 h-5 text-brand-blue shrink-0" />;
            let accentColor = 'bg-brand-blue';

            if (t.type === 'success') {
              bgClass = 'bg-white border-emerald-200 text-slate-800 shadow-xl shadow-emerald-500/10';
              iconElement = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
              accentColor = 'bg-emerald-500';
            } else if (t.type === 'error') {
              bgClass = 'bg-white border-rose-200 text-slate-800 shadow-xl shadow-rose-500/10';
              iconElement = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
              accentColor = 'bg-rose-500';
            } else if (t.type === 'warning') {
              bgClass = 'bg-white border-amber-200 text-slate-800 shadow-xl shadow-amber-500/10';
              iconElement = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
              accentColor = 'bg-amber-500';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-4 ${bgClass} flex items-start gap-3 backdrop-blur-md`}
              >
                {/* Accent top line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />

                <div className="pt-0.5">{iconElement}</div>
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
                    {t.title}
                  </h4>
                  {t.message && (
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-snug break-words">
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Dismiss toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelAction}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 overflow-hidden text-left"
            >
              {/* Header Icon */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : confirmDialog.variant === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-brand-blue/10 text-brand-blue'
                  }`}
                >
                  {confirmDialog.variant === 'danger' || confirmDialog.icon === 'trash' ? (
                    <Trash2 className="w-6 h-6" />
                  ) : confirmDialog.variant === 'warning' || confirmDialog.icon === 'alert' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : confirmDialog.variant === 'success' || confirmDialog.icon === 'check' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {confirmDialog.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Confirmation Prompt
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                {confirmDialog.message}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleCancelAction}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {confirmDialog.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleConfirmAction}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : confirmDialog.variant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-brand-blue hover:bg-brand-blue/90 shadow-brand-blue/20'
                  }`}
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{confirmDialog.confirmText || 'Confirm'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Modal Dialog */}
      <AnimatePresence>
        {alertDialog && (
          <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (alertDialog.onClose) alertDialog.onClose();
                setAlertDialog(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    alertDialog.variant === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : alertDialog.variant === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : alertDialog.variant === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-brand-blue/10 text-brand-blue'
                  }`}
                >
                  {alertDialog.variant === 'danger' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : alertDialog.variant === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : alertDialog.variant === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {alertDialog.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                {alertDialog.message}
              </p>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (alertDialog.onClose) alertDialog.onClose();
                    setAlertDialog(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-black uppercase tracking-wider hover:bg-brand-blue/90 transition-colors shadow-md shadow-brand-blue/20"
                >
                  {alertDialog.buttonText || 'Understood'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupPromptContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupPromptContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupPromptProvider');
  }
  return context;
}
