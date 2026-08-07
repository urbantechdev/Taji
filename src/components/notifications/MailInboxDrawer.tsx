import React from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { Mail, CheckCircle2, PackageCheck, X, Trash2, Clock, Sparkles } from 'lucide-react';

interface MailInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MailInboxDrawer: React.FC<MailInboxDrawerProps> = ({ isOpen, onClose }) => {
  const {
    mailNotifications,
    markNotificationRead,
    clearNotifications,
    acceptPurchaseOrder,
    receiveRestockTransfer,
    resumeTransferredSaleToCart
  } = useERP();

  if (!isOpen) return null;

  const unreadCount = mailNotifications.filter(m => !m.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-pink-100 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white p-4 flex items-center justify-between shadow-md">
          <ReflectionOverlay />
          <RightEdgeBlend variant="rainbow" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-xs">
              <Mail className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base">Store Mail &amp; Notifications</h3>
              <p className="text-xs text-pink-100 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {unreadCount > 0 ? `${unreadCount} unread transfer alert(s)` : 'All notifications caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:rotate-90 relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {mailNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300 animate-pulse" />
              <p className="text-sm font-semibold text-slate-600">No Store Mail Messages</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Notifications will appear here when an order ticket is rerouted or a restock request is submitted to the Main store.
              </p>
            </div>
          ) : (
            mailNotifications.map(notif => {
              const isPurchase = notif.transferType === 'order_fulfillment_reroute';

              return (
                <div
                  key={notif.id}
                  className={`group relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                    notif.read
                      ? 'bg-white border-slate-200/80 hover:border-pink-300 opacity-90'
                      : 'bg-gradient-to-br from-white via-rose-50/40 to-pink-50/60 border-pink-300/80 hover:border-pink-500 shadow-md ring-1 ring-pink-400/20'
                  }`}
                >
                  <RightEdgeBlend variant={isPurchase ? 'sunset' : 'rainbow'} />

                  <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200 group-hover:scale-105 ${
                        isPurchase
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 group-hover:bg-emerald-600 group-hover:text-white'
                          : 'bg-pink-100 text-pink-800 border border-pink-300 group-hover:bg-pink-600 group-hover:text-white'
                      }`}
                    >
                      {isPurchase ? 'Purchase Ticket' : 'Restock Request'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 group-hover:text-rose-500 transition-colors">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 mb-1.5 group-hover:text-rose-700 transition-colors relative z-10">
                    {notif.title}
                  </h4>

                  {/* Message body with animated hover effect */}
                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 group-hover:bg-rose-50/80 group-hover:border-rose-200 transition-all duration-300 mb-3 relative z-10 group/msg">
                    <p className="text-xs text-slate-700 leading-relaxed group-hover/msg:text-slate-900 transition-colors">
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                    <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-rose-600 transition-colors">
                      Ref: {notif.transferId}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-900 underline font-semibold transition-colors"
                        >
                          Mark read
                        </button>
                      )}

                      {isPurchase ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              markNotificationRead(notif.id);
                              resumeTransferredSaleToCart(notif.transferId);
                              onClose();
                            }}
                            className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                            title="Auto-holds receiver active queue and loads transferred sale into POS"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>Resume POS</span>
                          </button>
                          <button
                            onClick={() => {
                              markNotificationRead(notif.id);
                              acceptPurchaseOrder(notif.transferId, 'M-Pesa');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            markNotificationRead(notif.id);
                            receiveRestockTransfer(notif.transferId);
                          }}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Stock</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {mailNotifications.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total: {mailNotifications.length} message(s)
            </span>
            <button
              onClick={clearNotifications}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer hover:scale-105"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
