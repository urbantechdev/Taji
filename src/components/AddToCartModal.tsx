import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Scissors, 
  Shirt, 
  Palette, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Info,
  Layers,
  Zap,
  Tag
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getColorHex, formatPriceDisplay, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';

export interface BrandingOption {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
  iconType?: string;
}

export const BRANDING_OPTIONS: BrandingOption[] = [
  {
    id: 'none',
    name: 'Plain / No Branding',
    price: 0,
    description: 'Factory-finished unbranded garment',
    badge: 'Standard'
  },
  {
    id: 'embroidery',
    name: 'Computerized Embroidery',
    price: 350,
    description: 'High-density stitch logo on chest, sleeve, or back',
    badge: 'Most Popular'
  },
  {
    id: 'screen_print',
    name: 'Screen Printing (Front / Back)',
    price: 200,
    description: 'Durable multi-color screen print for uniforms & promo wear',
    badge: 'Best Value'
  },
  {
    id: 'dtf_print',
    name: 'DTF Full Color Digital Print',
    price: 280,
    description: 'Photographic resolution direct-to-film heat transfer',
    badge: 'High Detail'
  },
  {
    id: '3d_pocket_print',
    name: '3D High-Density Pocket Print',
    price: 320,
    description: 'Embossed textured silicone/rubber feel crest branding',
  },
  {
    id: 'reflective',
    name: 'Reflective Safety Banding (Hi-Vis)',
    price: 250,
    description: 'EN ISO industrial grade reflective safety bands',
    badge: 'Safety Gear'
  },
  {
    id: 'sublimation',
    name: 'Sublimation Sportswear Print',
    price: 250,
    description: 'Breathable all-over dye sublimation for activewear & jerseys',
  }
];

export const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom / Mixed'];

interface AddToCartModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddToCart: (cartItem: any) => void;
}

export default function AddToCartModal({
  product,
  isOpen,
  onClose,
  onConfirmAddToCart
}: AddToCartModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedBranding, setSelectedBranding] = useState<BrandingOption>(BRANDING_OPTIONS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Reset or initialize when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setCustomNotes('');
      // Default color
      if (product.selectedColor) {
        setSelectedColor(product.selectedColor);
      } else if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      } else {
        setSelectedColor('Standard');
      }

      // Default size
      setSelectedSize('L');
      // Default branding
      setSelectedBranding(BRANDING_OPTIONS[0]);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Base numerical price of product
  const basePrice = Number(product.price) > 0 ? Number(product.price) : 1000;
  const brandingChargePerUnit = selectedBranding.price;
  const unitPrice = basePrice + brandingChargePerUnit;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const chosenColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : 'Standard');
    const itemKey = `${product.id}-${chosenColor}-${selectedSize}-${selectedBranding.id}`;

    const cartPayload = {
      id: product.id,
      cartKey: itemKey,
      name: product.name,
      basePrice: basePrice,
      brandingType: selectedBranding.id,
      brandingName: selectedBranding.name,
      brandingPrice: brandingChargePerUnit,
      price: unitPrice,
      imageUrl: product.imageUrl,
      quantity: quantity,
      category: product.category || 'Apparel',
      selectedColor: chosenColor,
      selectedSize: selectedSize,
      customNotes: customNotes.trim() || undefined,
      colors: product.colors
    };

    onConfirmAddToCart(cartPayload);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 md:p-6 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-blue/70 backdrop-blur-md z-[1501]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl z-[1502] overflow-hidden brand-edge-orange flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black shadow-md shadow-brand-orange/20 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange leading-none">
                  Configure Garment Specifications
                </p>
                <h3 className="text-base sm:text-lg font-display font-black text-brand-blue uppercase tracking-tight truncate mt-1">
                  {product.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-white transition-all shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left flex-1">
            {/* Product Summary Preview Bar */}
            <div className="flex items-center gap-3.5 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-md tracking-wider">
                  {product.category || 'Manufacturing'}
                </span>
                <p className="text-xs sm:text-sm font-black text-brand-blue mt-1 truncate uppercase">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs sm:text-sm font-mono font-black text-brand-orange">
                    Base: KES {basePrice.toLocaleString()}
                  </span>
                  {selectedBranding.price > 0 && (
                    <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                      +{selectedBranding.name}: +KES {selectedBranding.price}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-brand-orange" />
                  1. Select Garment Size
                </label>
                <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full uppercase">
                  Size: {selectedSize}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {STANDARD_SIZES.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-2.5 px-2 rounded-xl font-black text-xs uppercase tracking-tight transition-all border text-center flex flex-col items-center justify-center",
                        isSelected
                          ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20 ring-2 ring-brand-blue/30 scale-[1.03]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange hover:bg-slate-50"
                      )}
                    >
                      <span>{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Fabric Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-brand-orange" />
                    2. Select Fabric Color
                  </label>
                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                    {selectedColor || 'Standard'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => {
                    const isSelected = selectedColor === c;
                    const hex = getColorHex(c);
                    const isLight = c.toLowerCase() === 'white' || c.toLowerCase().includes('beige') || c.toLowerCase().includes('yellow');

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all",
                          isSelected
                            ? "border-brand-orange bg-brand-orange/5 text-brand-blue ring-2 ring-brand-orange/30 shadow-xs font-black"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs",
                            isLight ? "border border-slate-300" : ""
                          )}
                          style={{ background: hex }}
                        />
                        <span className="uppercase text-[10px]">{c}</span>
                        {isSelected && <Check className="w-3 h-3 text-brand-orange ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Mode of Branding (Customization & Logo Placement) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  3. Mode of Branding & Customization
                </label>
                <span className="text-[10px] font-black text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full uppercase">
                  {selectedBranding.price === 0 ? 'Plain Garment (KES 0)' : `+KES ${selectedBranding.price} / pc`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BRANDING_OPTIONS.map((opt) => {
                  const isSelected = selectedBranding.id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedBranding(opt)}
                      className={cn(
                        "p-3 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group",
                        isSelected
                          ? "border-brand-orange bg-brand-orange/[0.04] shadow-md shadow-brand-orange/10"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "text-xs font-black uppercase tracking-tight",
                              isSelected ? "text-brand-blue" : "text-slate-700"
                            )}>
                              {opt.name}
                            </span>
                            {opt.badge && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-brand-green/15 text-brand-green rounded-md">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {opt.description}
                          </p>
                        </div>

                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          isSelected ? "border-brand-orange bg-brand-orange text-white" : "border-slate-300"
                        )}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Branding Cost:</span>
                        <span className={cn(
                          "font-mono font-black",
                          opt.price === 0 ? "text-slate-600" : "text-brand-orange"
                        )}>
                          {opt.price === 0 ? 'FREE (Plain)' : `+KES ${opt.price.toLocaleString()} / pc`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Quantity Adjuster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-orange" />
                  4. Quantity
                </label>
                <div className="flex gap-1">
                  {[1, 5, 10, 25, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-md border transition-colors",
                        quantity === q
                          ? "bg-brand-blue text-white border-brand-blue"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-brand-orange hover:text-white transition-all shadow-xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center font-mono font-black text-base text-brand-blue bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-brand-orange hover:text-white transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Unit Rate (Base + Branding)</p>
                  <p className="font-mono font-black text-sm text-brand-blue">
                    KES {unitPrice.toLocaleString()} <span className="text-[10px] text-slate-400">/ pc</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Live Price & Add to Cart Confirm Action */}
          <div className="p-4 sm:p-6 bg-slate-900 text-white border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Cart Amount:</span>
                <span className="text-[10px] text-brand-green font-bold bg-brand-green/20 px-2 py-0.5 rounded-full">
                  ({quantity} {quantity === 1 ? 'Garment' : 'Garments'})
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                  KES {totalPrice.toLocaleString()}
                </span>
                {selectedBranding.price > 0 && (
                  <span className="text-xs text-slate-400">
                    (incl. KES {(brandingChargePerUnit * quantity).toLocaleString()} branding)
                  </span>
                )}
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 sm:flex-none px-7 py-3.5 rounded-2xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-orange/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Confirm & Add to Cart</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
