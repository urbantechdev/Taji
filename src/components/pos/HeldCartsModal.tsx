import React, { useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import { playPopupSound, playClickSound, playTrashSound } from '../../utils/audio';
import { PauseCircle, Play, Trash2, X, Clock, User, ArrowRightLeft, Sparkles, Layers } from 'lucide-react';

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldCartsModal: React.FC<HeldCartsModalProps> = ({ isOpen, onClose }) => {
  const { heldCarts, restoreHeldCart, discardHeldCart, cart } = useERP();

  useEffect(() => {
    if (isOpen) {
      playPopupSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveQueue = cart.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white p-5 flex items-center justify-between">
          <ReflectionOverlay />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Held POS Orders &amp; Transferred Sales</h3>
              <p className="text-xs text-pink-100">Resume saved orders &amp; incoming inter-store transferred sales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Cue/Queue Banner Notification */}
        {hasActiveQueue && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <Layers className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>
              <strong>Active Queue Detected ({cart.length} items):</strong> Resuming an order will automatically place your current queue on hold so no work is lost!
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50">
          {heldCarts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <PauseCircle className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No Orders Currently On Hold</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Transferred sales and orders put on hold will appear here so the receiver can resume and serve them smoothly.
              </p>
            </div>
          ) : (
            heldCarts.map(held => {
              const isTransferred = held.isTransferredSale || Boolean(held.transferId);

              return (
                <div
                  key={held.id}
                  className={`bg-white rounded-2xl p-4 border transition-all space-y-3 ${
                    isTransferred
                      ? 'border-rose-300 shadow-md ring-1 ring-rose-200/60'
                      : 'border-slate-200 shadow-xs hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono ${
                          isTransferred ? 'bg-rose-600 text-white shadow-xs' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {held.id}
                        </span>

                        {isTransferred && (
                          <span className="bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase font-mono flex items-center gap-1 shadow-xs">
                            <ArrowRightLeft className="w-3 h-3" />
                            Transferred Sale {held.transferId ? `(${held.transferId})` : ''}
                          </span>
                        )}

                        <h4 className="font-bold text-sm text-slate-900">{held.note}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {held.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(held.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-rose-600">
                        KSh {held.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {held.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                      </p>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                    {held.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 truncate max-w-[260px]">
                          {item.quantity} {item.unit}(s) x {item.productName} ({item.colorName || 'Default'})
                        </span>
                        <span className="font-mono text-slate-500 ml-2 shrink-0">
                          KSh {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        playTrashSound();
                        discardHeldCart(held.id);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound();
                        restoreHeldCart(held.id);
                        onClose();
                      }}
                      className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{hasActiveQueue ? 'Resume & Auto-Hold Cue' : 'Resume Order to Cart'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {heldCarts.length} order/transferred sale(s) on hold
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
