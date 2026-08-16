import React, { useState, useEffect } from 'react';
import { ProductBatch, LocationId } from '../../types';
import { LOCATIONS } from '../../data/initialData';
import { playPopupSound, playClickSound, playAddToCartSound } from '../../utils/audio';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRightLeft,
  QrCode,
  Package,
  Layers,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Building,
  Sparkles,
  TrendingUp,
  Scale
} from 'lucide-react';
import ReflectionOverlay from '../common/ReflectionOverlay';

interface ProductDetailModalProps {
  product: ProductBatch | null;
  onClose: () => void;
  onAddToCart: (product: ProductBatch, quantity: number) => void;
  onQuickTransfer: (product: ProductBatch) => void;
  activeLocation: LocationId;
  canSellDirectly: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onQuickTransfer,
  activeLocation,
  canSellDirectly
}) => {
  if (!product) return null;

  useEffect(() => {
    playPopupSound();
  }, []);

  const [quantity, setQuantity] = useState<number>(1);
  const currentLocStock = product.locationStock[activeLocation] || 0;
  const totalEnterpriseStock = (Object.values(product.locationStock) as number[]).reduce((a, b) => a + b, 0);
  const isOutOfStock = currentLocStock <= 0;
  const isLowStock = currentLocStock > 0 && currentLocStock <= product.minReorderLevel;
  
  const estimatedSubtotal = quantity * product.unitPriceRetail;
  const marginPercentage = product.unitPriceRetail > 0 
    ? Math.round(((product.unitPriceRetail - product.costPrice) / product.unitPriceRetail) * 100)
    : 0;

  const handleAdd = () => {
    playAddToCartSound();
    onAddToCart(product, quantity);
    onClose();
  };

  const handleTransfer = () => {
    playClickSound();
    onQuickTransfer(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <ReflectionOverlay />
          
          <div className="space-y-1 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 backdrop-blur-xs text-white border border-white/30">
                {product.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-900/60 text-pink-100 border border-pink-400/30">
                {product.subCategory}
              </span>
              <span className="font-mono text-[11px] text-pink-200 bg-black/25 px-2 py-0.5 rounded-md">
                SKU: {product.sku}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
              {product.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer relative z-10 shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* Top Section: Visual Preview & Key Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            {/* Product Image / Color Visual (5 cols) */}
            <div className="sm:col-span-5 relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-4 text-white font-bold"
                  style={{ backgroundColor: product.colorHex }}
                >
                  <Palette className="w-10 h-10 mb-1 drop-shadow-md opacity-80" />
                  <span className="drop-shadow-md text-sm">{product.colorName}</span>
                </div>
              )}

              {/* Color Swatch Pill floating on image */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-md border border-white/20">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white shrink-0"
                  style={{ backgroundColor: product.colorHex }}
                />
                <span className="text-[10px] font-bold truncate max-w-[120px]">{product.colorName}</span>
              </div>
            </div>

            {/* Specifications & Textile Properties (7 cols) */}
            <div className="sm:col-span-7 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                    <Layers className="w-3 h-3 text-rose-600" />
                    <span>Fiber Composition</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                    {product.fiberComposition}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                    <Scale className="w-3 h-3 text-indigo-600" />
                    <span>Measurement Unit</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-0.5 text-xs">
                    Per {product.unit.toUpperCase()}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                    <QrCode className="w-3 h-3 text-slate-700" />
                    <span>QR Data</span>
                  </div>
                  <p className="font-mono font-bold text-slate-700 mt-0.5 text-[10.5px] truncate">
                    {product.qrCodeData || product.sku}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>Gross Profit Margin</span>
                  </div>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5 text-xs">
                    ~{marginPercentage}% Est. Margin
                  </p>
                </div>
              </div>

              {/* Price Tier Showcase */}
              <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-rose-600 tracking-wider">
                    Retail Sale Price
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base sm:text-lg font-mono font-black text-rose-700">
                      KSh {product.unitPriceRetail.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      / {product.unit}
                    </span>
                  </div>
                </div>

                <div className="text-right pl-3 border-l border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Bulk Price (Main)
                  </span>
                  <p className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                    KSh {product.unitPriceBulk.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Multi-Location Inventory Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                <Building className="w-3.5 h-3.5 text-rose-600" />
                <span>Multi-Store Stock Distribution</span>
              </div>
              <span className="font-mono font-bold text-slate-500 text-[11px]">
                Total Enterprise: <strong className="text-slate-900">{totalEnterpriseStock} {product.unit}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOCATIONS.map(loc => {
                const stock = product.locationStock[loc.id] || 0;
                const isCurrent = loc.id === activeLocation;
                const isLocOut = stock <= 0;

                return (
                  <div
                    key={loc.id}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span className="truncate">{loc.name.replace('Zamoda ', '')}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-600 text-white rounded-md shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`font-mono text-sm font-black ${
                        isLocOut ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {stock} <span className="text-[10px] font-normal text-slate-500">{product.unit}</span>
                      </span>
                      {isLocOut ? (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                          Empty
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Store Status Notice */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 border border-slate-200/80">
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : isLowStock ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-700">
                {isOutOfStock
                  ? `Out of stock at active store (${currentLocStock} ${product.unit}). Use Inter-Store Transfer to request restock.`
                  : isLowStock
                  ? `Low stock threshold reached (${currentLocStock} ${product.unit} remaining). Reorder level: ${product.minReorderLevel}.`
                  : `Stock is healthy at active store (${currentLocStock} ${product.unit} available for billing).`}
              </span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER & ACTION DOCK */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Quantity Selector & Subtotal Preview */}
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-2xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="px-2 text-center">
                <input
                  type="number"
                  min={1}
                  max={canSellDirectly ? Math.max(1, currentLocStock) : 999}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center font-mono font-black text-sm bg-transparent focus:outline-none"
                />
                <p className="text-[9px] text-slate-400 font-bold -mt-0.5">{product.unit}</p>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[10px] text-slate-400 font-bold block">Cart Subtotal:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                KSh {estimatedSubtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTransfer}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Request or dispatch inter-store transfer for this batch"
            >
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <span>Transfer Stock</span>
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock && canSellDirectly}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock && canSellDirectly
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-rose-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add {quantity} {product.unit} to Cart</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
