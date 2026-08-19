import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import {
  Mail,
  CheckCircle2,
  PackageCheck,
  X,
  Trash2,
  Clock,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Warehouse,
  Store,
  Layers,
  AlertCircle
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface MailInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MailInboxDrawer: React.FC<MailInboxDrawerProps> = ({ isOpen, onClose }) => {
  const {
    mailNotifications,
    transfers,
    markNotificationRead,
    clearNotifications,
    acceptPurchaseOrder,
    receiveRestockTransfer,
    resumeTransferredSaleToCart,
    activeLocation,
    posSession,
    isAdmin,
    locations
  } = useERP();

  const [activeTab, setActiveTab] = useState<'transfers' | 'messages'>('transfers');
  const [fadingIds, setFadingIds] = useState<{ [id: string]: string }>({});
  const [filterMode, setFilterMode] = useState<'current_store' | 'all'>('current_store');

  if (!isOpen) return null;

  const currentStoreLocation = posSession?.isUnlocked ? posSession.location : activeLocation;
  const currentStoreName = locations.find(l => l.id === currentStoreLocation)?.name || currentStoreLocation;

  // Pending transfers that are heading to currentStoreLocation (or all in admin mode)
  const pendingTransfers = transfers.filter(trf => {
    const isPending = trf.status === 'pending_approval' || trf.status === 'dispatched';
    if (!isPending) return false;
    if (filterMode === 'current_store' || !isAdmin) {
      return trf.toLocation === currentStoreLocation;
    }
    return true;
  });

  const displayedNotifications = mailNotifications.filter(m => {
    if (filterMode === 'current_store' || !isAdmin) {
      return m.toLocation === currentStoreLocation;
    }
    return true;
  });

  const unreadMailsCount = displayedNotifications.filter(m => !m.read && !fadingIds[m.id]).length;
  const totalPendingAlerts = pendingTransfers.length + unreadMailsCount;

  const triggerItemAction = (notifId: string, actionFn: () => void, feedbackText: string) => {
    setFadingIds(prev => ({ ...prev, [notifId]: feedbackText }));
    playSuccessSound();
    setTimeout(() => {
      actionFn();
      setFadingIds(prev => {
        const next = { ...prev };
        delete next[notifId];
        return next;
      });
    }, 450);
  };

  const getLocationName = (locId: string) => locations.find(l => l.id === locId)?.name || locId;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-pink-100 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white p-4 flex items-center justify-between shadow-md">
          <ReflectionOverlay />
          <RightEdgeBlend variant="rainbow" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-xs">
              <Mail className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base">Store Mail &amp; Stock Inbox</h3>
              <p className="text-xs text-pink-100 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {totalPendingAlerts > 0
                  ? `${pendingTransfers.length} transfer(s) pending, ${unreadMailsCount} mail(s)`
                  : `All caught up for ${currentStoreName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:rotate-90 relative z-10"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('transfers');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pending Transfers</span>
            {pendingTransfers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                {pendingTransfers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('messages');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Messages &amp; Orders</span>
            {unreadMailsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {unreadMailsCount}
              </span>
            )}
          </button>
        </div>

        {/* Store Scope Filter for Super Admin */}
        {isAdmin && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Showing items for:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterMode('current_store')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                  filterMode === 'current_store' ? 'bg-pink-100 text-pink-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {currentStoreName}
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                  filterMode === 'all' ? 'bg-pink-100 text-pink-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Branches
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          
          {/* TAB 1: PENDING TRANSFERS TO RECEIVE */}
          {activeTab === 'transfers' && (
            pendingTransfers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <PackageCheck className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No Pending Transfers to Receive</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  All inter-store shipments routed to {currentStoreName} have been received and verified into inventory.
                </p>
              </div>
            ) : (
              pendingTransfers.map(trf => {
                const totalUnits = trf.items.reduce((acc, it) => acc + it.quantity, 0);
                const isFading = Boolean(fadingIds[trf.id]);
                const feedbackMsg = fadingIds[trf.id];

                return (
                  <div
                    key={trf.id}
                    className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
                      isFading
                        ? 'opacity-0 -translate-x-6 scale-95 pointer-events-none'
                        : 'bg-white border-pink-200/80 hover:border-pink-400 shadow-md ring-1 ring-pink-400/15 hover:shadow-lg'
                    }`}
                  >
                    <RightEdgeBlend variant="rainbow" />

                    {/* Feedback overlay */}
                    {feedbackMsg && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 z-30 animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-300" />
                          </div>
                          <span>{feedbackMsg}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                        {trf.status === 'dispatched' ? 'In Transit / Dispatched' : 'Pending Verification'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(trf.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mb-2.5 relative z-10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <span className="text-slate-600">{getLocationName(trf.fromLocation)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span className="text-pink-700">{getLocationName(trf.toLocation)}</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">Manifest Ref: {trf.id}</p>
                    </div>

                    {/* Item lines */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 mb-3 relative z-10">
                      {trf.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="font-medium truncate max-w-[240px]">{it.productName}</span>
                          <span className="font-mono font-bold text-slate-900 shrink-0">
                            {it.quantity} {it.unit}s
                          </span>
                        </div>
                      ))}
                      {trf.notes && (
                        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                          Note: {trf.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Bar: 1-Click Receive Stock */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                      <span className="text-xs font-bold text-slate-600">
                        Total Units: <span className="font-mono text-slate-900">{totalUnits}</span>
                      </span>

                      <button
                        onClick={() => {
                          triggerItemAction(
                            trf.id,
                            () => receiveRestockTransfer(trf.id),
                            'Transfer Received Successfully ✓'
                          );
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Receive Transfer</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: STORE MESSAGES & PURCHASE TICKETS */}
          {activeTab === 'messages' && (
            displayedNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No Messages for {currentStoreName}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Notifications appear here when order tickets or messages are addressed to this location.
                </p>
              </div>
            ) : (
              displayedNotifications.map(notif => {
                const isPurchase = notif.transferType === 'order_fulfillment_reroute';
                const isFading = Boolean(fadingIds[notif.id]);
                const feedbackMsg = fadingIds[notif.id];

                return (
                  <div
                    key={notif.id}
                    className={`group relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isFading
                        ? 'opacity-0 -translate-x-6 scale-95 pointer-events-none'
                        : notif.read
                        ? 'bg-white border-slate-200/80 hover:border-pink-300 opacity-85 hover:opacity-100 shadow-xs'
                        : 'bg-gradient-to-br from-white via-rose-50/40 to-pink-50/60 border-pink-300/80 hover:border-pink-500 shadow-md ring-1 ring-pink-400/20'
                    }`}
                  >
                    <RightEdgeBlend variant={isPurchase ? 'sunset' : 'rainbow'} />

                    {feedbackMsg && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 z-30 animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-300" />
                          </div>
                          <span>{feedbackMsg}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isPurchase
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-pink-100 text-pink-800 border border-pink-300'
                        }`}
                      >
                        {isPurchase ? 'Purchase Ticket' : 'Restock Notice'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mb-1.5 relative z-10">
                      {notif.title}
                    </h4>

                    <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 mb-3 relative z-10">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Ref: {notif.transferId}
                      </span>

                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => {
                              playClickSound();
                              triggerItemAction(notif.id, () => markNotificationRead(notif.id), 'Marked as read');
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-900 underline font-semibold transition-colors cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}

                        {isPurchase ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                playClickSound();
                                triggerItemAction(
                                  notif.id,
                                  () => {
                                    markNotificationRead(notif.id);
                                    resumeTransferredSaleToCart(notif.transferId);
                                    onClose();
                                  },
                                  'Resuming Sale in POS...'
                                );
                              }}
                              className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 hover:scale-105 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 fill-current" />
                              <span>Resume POS</span>
                            </button>
                            <button
                              onClick={() => {
                                triggerItemAction(
                                  notif.id,
                                  () => {
                                    markNotificationRead(notif.id);
                                    acceptPurchaseOrder(notif.transferId, 'M-Pesa');
                                  },
                                  'Order Accepted & Recorded ✓'
                                );
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
                              triggerItemAction(
                                notif.id,
                                () => {
                                  markNotificationRead(notif.id);
                                  receiveRestockTransfer(notif.transferId);
                                },
                                'Transfer Received Successfully ✓'
                              );
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
            )
          )}

        </div>

        {/* Drawer Footer */}
        {mailNotifications.length > 0 && activeTab === 'messages' && (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total: {mailNotifications.length} message(s)
            </span>
            <button
              onClick={() => {
                playClickSound();
                clearNotifications();
              }}
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

