import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductBatch } from '../../types';
import { useERP } from '../../context/ERPContext';
import { playAddToCartSound, playClickSound } from '../../utils/audio';
import {
  X,
  ShoppingBag,
  MapPin,
  Check,
  ShieldCheck,
  Truck,
  MessageCircle,
  Calculator,
  Scale,
  Sparkles,
  Layers,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  Receipt
} from 'lucide-react';
import polarFleeceRollsImg from '../../assets/images/polar_fleece_rolls_1788533080208.jpg';

interface StorefrontProductDetailModalProps {
  product: ProductBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCartSuccess?: () => void;
}

export const StorefrontProductDetailModal: React.FC<StorefrontProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCartSuccess
}) => {
  const { addToCart, categoryPricingConfigs } = useERP();
  const [purchaseMode, setPurchaseMode] = useState<'standard' | 'bulk_tier' | 'custom_meters'>('standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !product) return null;

  const totalStock = Object.values(product.locationStock || {}).reduce((a, b) => a + (b || 0), 0);
  const isOutOfStock = totalStock <= 0;

  const retailPrice = product.unitPriceRetail || 1200;
  const bulkPrice = product.unitPriceBulk || Math.round(retailPrice * 0.82);

  // Category specific config
  const categoryConfig = categoryPricingConfigs[product.category];
  const standardRollMeters = categoryConfig?.standardRollLengthMeters || (product.category === 'Fleece' ? 70 : 50);

  // Calculation of effective unit price and total
  const unitPrice = purchaseMode === 'bulk_tier' ? bulkPrice : retailPrice;
  const lineSubtotal = unitPrice * quantity;
  const lineVat = Math.round(lineSubtotal * 0.16);
  const lineGrandTotal = lineSubtotal + lineVat;

  const handleAddToCart = () => {
    if (isOutOfStock || quantity <= 0) return;
    playAddToCartSound();
    setIsAdded(true);

    if (purchaseMode === 'bulk_tier') {
      addToCart(product, quantity, true);
    } else {
      addToCart(product, quantity, false);
    }

    if (onAddToCartSuccess) {
      onAddToCartSuccess();
    }

    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  const handleWhatsAppOrder = () => {
    const phone = '254700111000';
    const text = encodeURIComponent(
      `Hello Taji Textile! I want to order ${quantity} ${product.unit}(s) of "${product.name}" (SKU: ${product.sku || product.id}) in ${product.colorName || 'standard'}. Total Quote: KSh ${lineSubtotal.toLocaleString()}. Please assist me with delivery and payment.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
        id="product-detail-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-100/80 text-rose-800 font-bold text-xs rounded-xl border border-rose-200">
                {product.category}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                SKU: {product.sku || product.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200/70 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Product Image Left Column (5 Cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-4/3 md:aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-sm">
                  <img
                    src={
                      product.category === 'Fleece'
                        ? (product.imageUrl || polarFleeceRollsImg)
                        : (product.imageUrl || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80')
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {product.colorName && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: product.colorHex || '#94a3b8' }}
                      />
                      <span>{product.colorName}</span>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">100% Verified</p>
                      <p className="text-[10px] text-slate-500">Quality Assured</p>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Fast Dispatch</p>
                      <p className="text-[10px] text-slate-500">Across Kenya</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info & Pricing Right Column (7 Cols) */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-sm font-semibold text-rose-700 mt-1">
                    {product.subCategory || product.category} • {product.fiberComposition}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Retail Price:</span>
                    <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-rose-700">KSh</span>
                      <span>{retailPrice.toLocaleString()}</span>
                      <span className="text-xs font-normal text-slate-500">/{product.unit}</span>
                    </div>
                  </div>

                  {bulkPrice < retailPrice && (
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Wholesale Tier
                      </span>
                      <div className="text-lg font-bold text-emerald-800 mt-0.5">
                        KSh {bulkPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/bulk</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Technical Specifications */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-rose-600" />
                    <span>Fabric &amp; Manufacturing Specs</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3.5 rounded-xl border border-slate-200 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-semibold">{product.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Fiber Composition</span>
                      <span className="font-semibold">{product.fiberComposition || '100% Premium Textile'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit of Measurement</span>
                      <span className="font-semibold capitalize">{product.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tare Deduction</span>
                      <span className="font-semibold">
                        {product.tareProfile?.tareWeightPerUnit 
                          ? `${product.tareProfile.tareWeightPerUnit * 1000}g (${product.tareProfile.packagingDescription || 'Packaging'})` 
                          : 'Auto-zeroed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordering & Calculator Controls */}
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/90 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-rose-600" />
                      <span>Order Quantity ({product.unit}s):</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={totalStock > 0 ? totalStock : 9999}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center py-1 bg-white border border-rose-200 rounded-lg font-bold font-mono text-slate-900 text-sm focus:outline-rose-500"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPurchaseMode('standard')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        purchaseMode === 'standard'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Retail Rate (KSh {retailPrice.toLocaleString()})
                    </button>
                    {bulkPrice < retailPrice && (
                      <button
                        onClick={() => setPurchaseMode('bulk_tier')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          purchaseMode === 'bulk_tier'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Wholesale Rate (KSh {bulkPrice.toLocaleString()})
                      </button>
                    )}
                  </div>

                  {/* Dynamic Quote Summary */}
                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="text-slate-600">Calculated Subtotal:</span>
                    <span className="text-base text-rose-700 font-mono">
                      KSh {lineSubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white shadow-rose-200 hover:scale-[1.01]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added to Cart!</span>
                      </>
                    ) : isOutOfStock ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        <span>Currently Sold Out</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add {quantity} {product.unit}(s) to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full sm:w-auto py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire / WhatsApp</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
