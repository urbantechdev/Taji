import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { playClickSound } from '../../utils/audio';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Receipt,
  Layers,
  Sparkles
} from 'lucide-react';

interface StorefrontCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const StorefrontCartDrawer: React.FC<StorefrontCartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout
}) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart, products } = useERP();

  if (!isOpen) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.rollPricing?.totalPrice ?? (item.unitPrice * item.quantity)), 0);
  const vatAmount = Math.round(subtotal * 0.16);
  const grandTotal = subtotal + vatAmount;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
        id="storefront-cart-drawer"
      >
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Fabric Cart</h3>
                <p className="text-xs text-slate-500">{totalItems} {totalItems === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    playClickSound();
                    clearCart();
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                  title="Clear entire cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items Scrollable List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">Your Cart is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Explore our certified Dereck suiting, Polar fleece rolls, and knitting yarn cones to add items to your cart.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                // Find matching product batch to get current image
                const matchedProduct = products.find(p => p.id === item.batchId);
                const imageUrl = matchedProduct?.imageUrl || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80';

                return (
                  <motion.div
                    key={item.batchId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-3 items-start"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                      <img
                        src={imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.batchId)}
                          className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-rose-700">
                          {item.category}
                        </span>
                        <span>
                          KSh {item.unitPrice.toLocaleString()}/{item.unit}
                        </span>
                      </div>

                      {/* Quantity Selector & Line Total */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            onClick={() => updateCartQuantity(item.batchId, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.batchId, item.quantity + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          KSh {(item.rollPricing?.totalPrice ?? (item.unitPrice * item.quantity)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Cart Footer / Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal ({totalItems} items):</span>
                  <span className="font-mono font-bold text-slate-900">KSh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-rose-600" />
                    <span>16% KRA VAT (Included):</span>
                  </span>
                  <span className="font-mono text-slate-700">KSh {vatAmount.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-lg font-mono text-rose-700">
                    KSh {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                id="cart-proceed-checkout-button"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KRA ETR Verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-rose-600" />
                  <span>Branch Pickup or Delivery</span>
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
