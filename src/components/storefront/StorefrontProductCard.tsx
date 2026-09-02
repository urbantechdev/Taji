import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ProductBatch } from '../../types';
import { useERP } from '../../context/ERPContext';
import { playAddToCartSound, playClickSound } from '../../utils/audio';
import {
  ShoppingBag,
  Layers,
  Check,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Calculator,
  MessageCircle,
  Truck,
  ShieldCheck
} from 'lucide-react';

interface StorefrontProductCardProps {
  product: ProductBatch;
  onOpenQuickView: (product: ProductBatch) => void;
  onAddToCartSuccess?: () => void;
}

export const StorefrontProductCard: React.FC<StorefrontProductCardProps> = ({
  product,
  onOpenQuickView,
  onAddToCartSuccess
}) => {
  const { addToCart, brandSettings, categoryPricingConfigs } = useERP();
  const [selectedUnitMode, setSelectedUnitMode] = useState<'retail' | 'bulk' | 'custom_meters'>('retail');
  const [customMeters, setCustomMeters] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  // Total stock across all branches
  const totalStock = Object.values(product.locationStock || {}).reduce((a, b) => a + (b || 0), 0);
  const isOutOfStock = totalStock <= 0;

  // Pricing calculations
  const retailPrice = product.unitPriceRetail || 1200;
  const bulkPrice = product.unitPriceBulk || Math.round(retailPrice * 0.82);

  // Standard roll length for fabric if applicable
  const categoryConfig = categoryPricingConfigs[product.category];
  const standardRollMeters = categoryConfig?.standardRollLengthMeters || (product.category === 'Fleece' ? 70 : 50);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    playAddToCartSound();
    setIsAdded(true);

    if (selectedUnitMode === 'custom_meters' && customMeters > 0) {
      // Add custom meter cut
      addToCart(product, customMeters, false);
    } else if (selectedUnitMode === 'bulk') {
      addToCart(product, 1, true);
    } else {
      addToCart(product, 1, false);
    }

    if (onAddToCartSuccess) {
      onAddToCartSuccess();
    }

    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = '254700111000';
    const text = encodeURIComponent(
      `Hello Taji Textile! I am interested in inquiring about "${product.name}" (SKU: ${product.sku || product.id}) in ${product.colorName || 'standard color'} priced at KSh ${retailPrice.toLocaleString()}/${product.unit}. Is this available for order?`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Badge styling per category
  const categoryBadgeColor = 
    product.category === 'Dereck'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : product.category === 'Fleece'
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : 'bg-indigo-50 text-indigo-800 border-indigo-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl border border-rose-100/80 shadow-xs hover:shadow-xl hover:border-pink-300/80 transition-all duration-300 flex flex-col overflow-hidden relative"
      id={`product-card-${product.id}`}
    >
      {/* Product Image & Quick Badges */}
      <div 
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onOpenQuickView(product)}
      >
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView(product);
            }}
            className="px-3.5 py-2 bg-white/95 hover:bg-white text-slate-900 font-bold rounded-xl shadow-md backdrop-blur-xs flex items-center gap-1.5 text-xs transition-transform hover:scale-105 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-rose-600" />
            <span>Quick Specs</span>
          </button>
          <button
            onClick={openWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-transform hover:scale-105 cursor-pointer"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Category Badge Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-2xs backdrop-blur-md ${categoryBadgeColor}`}>
            {product.category}
          </span>
          {product.subCategory && (
            <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded-md backdrop-blur-md max-w-[150px] truncate">
              {product.subCategory}
            </span>
          )}
        </div>

        {/* Stock Status Badge Top Right */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-red-600/90 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 backdrop-blur-md">
              <AlertCircle className="w-3 h-3" />
              <span>Out of Stock</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-700/90 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>{totalStock} {product.unit}s in Stock</span>
            </span>
          )}
        </div>

        {/* Color Swatch Pill Bottom Left */}
        {product.colorName && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
            <span
              className="w-3 h-3 rounded-full border border-slate-300 shrink-0 shadow-2xs"
              style={{ backgroundColor: product.colorHex || '#94a3b8' }}
            />
            <span className="truncate max-w-[120px]">{product.colorName}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Fiber Composition */}
          {product.fiberComposition && (
            <p className="text-[11px] font-semibold text-rose-700/90 uppercase tracking-wider mb-1 line-clamp-1">
              {product.fiberComposition}
            </p>
          )}

          {/* Product Name */}
          <h3 
            onClick={() => onOpenQuickView(product)}
            className="text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* SKU & Barcode tag */}
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">SKU: {product.sku || product.id}</span>
            {product.tareProfile?.packagingDescription && (
              <span className="text-[10px] text-slate-500 truncate" title={product.tareProfile.packagingDescription}>
                • {product.tareProfile.packagingDescription}
              </span>
            )}
          </div>
        </div>

        {/* Price & Buying Options Block */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-slate-500 font-medium">Retail Price:</span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-baseline gap-1">
                <span className="text-xs font-semibold text-rose-700">KSh</span>
                <span>{retailPrice.toLocaleString()}</span>
                <span className="text-[11px] font-normal text-slate-500">/{product.unit}</span>
              </div>
            </div>

            {bulkPrice < retailPrice && (
              <div className="text-right">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Wholesale Bulk Tier
                </span>
                <p className="text-xs font-bold text-emerald-800 mt-0.5">
                  KSh {bulkPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/bulk</span>
                </p>
              </div>
            )}
          </div>

          {/* Actions & Add to Cart */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-200 scale-[1.02]'
                  : 'bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white shadow-rose-200 hover:shadow-md active:scale-98'
              }`}
              id={`add-to-cart-${product.id}`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>Added to Cart!</span>
                </>
              ) : isOutOfStock ? (
                <>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Sold Out</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenQuickView(product);
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer hover:text-rose-700"
              title="View Fabric Specs & Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
