import React, { useState, useRef, useMemo, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Share2, 
  ShoppingBag, 
  Box,
  Zap,
  Layers
} from 'lucide-react';
import { Product, formatPriceDisplay, getColorHex, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import { getOptimizedImageUrl } from '../lib/imageOptimizer';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  idx: number;
  onSelectProduct: (product: Product, initialImageIndex: number) => void;
  onOpenLightbox: (item: { 
    url: string; 
    title?: string; 
    category?: string; 
    priceText?: string; 
    product?: any; 
    imageIndex?: number 
  }) => void;
  onOpenShare: (product: any, e?: React.MouseEvent) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  idx,
  onSelectProduct,
  onOpenLightbox,
  onOpenShare,
  onAddToCart,
}) => {
  // Collect all valid images: primary imageUrl followed by any additionalImages or images array
  const images = useMemo(() => {
    const rawList = [
      product.imageUrl,
      ...(product.additionalImages || (product as any).images || [])
    ].filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    return rawList.length > 0 ? rawList : [PLACEHOLDER_PRODUCT_IMAGE];
  }, [product.imageUrl, product.additionalImages, (product as any).images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Touch gesture support for mobile swiping
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const isSwipingRef = useRef<boolean>(false);

  const hasMultipleImages = images.length > 1;
  const currentImageUrl = images[activeImageIndex] || product.imageUrl || PLACEHOLDER_PRODUCT_IMAGE;

  const handlePrevImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSlideDirection('left');
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSlideDirection('right');
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSlideDirection(index > activeImageIndex ? 'right' : 'left');
    setActiveImageIndex(index);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
    touchEndXRef.current = null;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = Math.abs(currentX - touchStartXRef.current);
    const diffY = Math.abs(currentY - touchStartYRef.current);

    // If horizontal movement is dominant, lock horizontal swipe
    if (diffX > diffY && diffX > 10) {
      isSwipingRef.current = true;
      touchEndXRef.current = currentX;
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    if (touchStartXRef.current !== null && touchEndXRef.current !== null && isSwipingRef.current) {
      const distance = touchStartXRef.current - touchEndXRef.current;
      const swipeThreshold = 35; // minimum horizontal px
      if (distance > swipeThreshold) {
        // Swiped left -> show next image
        handleNextImage(e);
      } else if (distance < -swipeThreshold) {
        // Swiped right -> show prev image
        handlePrevImage(e);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    isSwipingRef.current = false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: (idx % 8) * 0.05 }}
      viewport={{ once: true }}
      onClick={() => onSelectProduct(product, activeImageIndex)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer select-none"
    >
      {/* Product Image Stage & Interactive Carousel */}
      <div 
        className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden mb-2.5 sm:mb-4 bg-slate-50 border border-slate-100 group-hover:brand-edge-orange transition-all duration-300 shadow-xs hover:shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Image Slider with smooth crossfade */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.img 
            key={activeImageIndex}
            referrerPolicy="no-referrer"
            src={getOptimizedImageUrl(currentImageUrl, 550, 80)} 
            alt={`${product.name} - View ${activeImageIndex + 1}`}
            initial={{ opacity: 0.6, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full h-full object-cover object-center group-hover:scale-120 transition-transform duration-700"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
            }}
          />
        </AnimatePresence>

        {/* Top-Right Floating Quick Action Buttons */}
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 flex flex-col gap-1.5 sm:gap-2 z-10">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-xs text-brand-blue flex items-center justify-center shadow-lg hover:bg-brand-orange hover:text-white transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
            title="Add to Cart"
            aria-label={`Add ${product.name} to Cart`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(product, e);
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-xs text-brand-blue flex items-center justify-center shadow-lg hover:bg-brand-green hover:text-white transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:outline-none"
            title="Share Product & Image"
            aria-label={`Share ${product.name} with Image`}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox({
                url: currentImageUrl,
                title: product.name,
                category: product.category,
                priceText: formatPriceDisplay(product),
                product: product,
                imageIndex: activeImageIndex
              });
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-xs text-brand-blue flex items-center justify-center shadow-lg hover:bg-brand-blue hover:text-white transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            title="Tap to View & Zoom Image"
            aria-label={`View high resolution photo of ${product.name}`}
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Featured Lightning Badge */}
        {product.isFeatured && (
          <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg animate-bounce z-10">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}

        {/* 3D Model Badge */}
        {product.model3dUrl && (
          <div className={cn(
            "absolute left-2.5 sm:left-4 bg-brand-blue/80 backdrop-blur-md text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1 z-10 shadow-lg border border-white/20",
            product.isFeatured ? "top-10 sm:top-14" : "top-2.5 sm:top-4"
          )}>
            <Box className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-orange" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-none">3D Model</span>
          </div>
        )}

        {/* Multiple Images Counter Badge */}
        {hasMultipleImages && (
          <div className={cn(
            "absolute left-2.5 sm:left-4 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg flex items-center gap-1 z-10 shadow-sm border border-white/10 transition-opacity",
            product.isFeatured || product.model3dUrl ? "top-12 sm:top-14" : "top-2.5 sm:top-4"
          )}>
            <Layers className="w-2.5 h-2.5 text-brand-orange" />
            <span className="text-[8px] sm:text-[9px] font-mono font-black tracking-wider">
              {activeImageIndex + 1}/{images.length}
            </span>
          </div>
        )}

        {/* Carousel Arrow Controls (Previous / Next) */}
        {hasMultipleImages && (
          <>
            {/* Left Prev Arrow */}
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous product image"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-brand-blue backdrop-blur-xs flex items-center justify-center shadow-md transition-all duration-200 active:scale-90",
                isHovered 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-75 sm:opacity-0 sm:-translate-x-2 pointer-events-auto sm:pointer-events-none"
              )}
            >
              <ChevronLeft className="w-4 h-4 -translate-x-0.5" />
            </button>

            {/* Right Next Arrow */}
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next product image"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-brand-blue backdrop-blur-xs flex items-center justify-center shadow-md transition-all duration-200 active:scale-90",
                isHovered 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-75 sm:opacity-0 sm:translate-x-2 pointer-events-auto sm:pointer-events-none"
              )}
            >
              <ChevronRight className="w-4 h-4 translate-x-0.5" />
            </button>

            {/* Carousel Pagination Dots Indicator */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-20 pointer-events-auto">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-sm">
                {images.slice(0, 6).map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => handleDotClick(e, dotIdx)}
                    aria-label={`Switch to photo ${dotIdx + 1}`}
                    className={cn(
                      "transition-all duration-300 rounded-full",
                      dotIdx === activeImageIndex
                        ? "w-4 h-1.5 bg-brand-orange shadow-sm"
                        : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                    )}
                  />
                ))}
                {images.length > 6 && (
                  <span className="text-[8px] font-bold text-white/90 pl-0.5">
                    +{images.length - 6}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* View Details Banner (on desktop hover when not hovering buttons) */}
        {!hasMultipleImages && (
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
            <div className="bg-brand-blue/90 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center shadow-md">
              <p className="text-[9px] sm:text-[10px] text-white font-black uppercase tracking-wider">View Details</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="px-1 sm:px-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-brand-orange uppercase tracking-wider italic">
              {product.category}
            </p>
            <h4 className="text-xs sm:text-sm md:text-base font-black text-brand-blue leading-tight mt-0.5 line-clamp-2 uppercase group-hover:text-brand-orange transition-colors">
              {product.name}
            </h4>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-mono font-black text-brand-blue">
            {formatPriceDisplay(product)}
          </p>
          {product.price > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-success-bright rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 uppercase hidden sm:inline">Available</span>
            </div>
          )}
        </div>

        {/* Color choices dot preview */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="flex -space-x-1 overflow-hidden p-0.5">
              {product.colors.slice(0, 5).map((c: string, cIdx: number) => {
                const hex = getColorHex(c);
                const isLight = c.toLowerCase() === 'white' || c.toLowerCase().includes('beige');
                return (
                  <span
                    key={cIdx}
                    title={c}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs ring-1 ring-white",
                      isLight ? "border border-slate-300" : ""
                    )}
                    style={{ background: hex }}
                  />
                );
              })}
            </div>
            {product.colors.length > 5 ? (
              <span className="text-[9px] font-black text-slate-400 uppercase">
                +{product.colors.length - 5} colors
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
