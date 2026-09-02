import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryType } from '../../types';
import { useERP } from '../../context/ERPContext';
import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface StorefrontHeroSliderProps {
  onSelectCategory: (category: 'all' | CategoryType) => void;
}

interface ImageSlide {
  id: CategoryType;
  category: CategoryType;
  imageUrl: string;
  fallbackImage: string;
  alt: string;
}

export const StorefrontHeroSlider: React.FC<StorefrontHeroSliderProps> = ({
  onSelectCategory
}) => {
  const { categoryImages } = useERP();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const slides: ImageSlide[] = [
    {
      id: 'Dereck',
      category: 'Dereck',
      alt: 'Dereck Suiting Fabrics',
      imageUrl: categoryImages.Dereck || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1600&q=85',
      fallbackImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1600&q=85'
    },
    {
      id: 'Fleece',
      category: 'Fleece',
      alt: 'Polar & Coral Fleece Rolls',
      imageUrl: categoryImages.Fleece || 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1600&q=85',
      fallbackImage: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1600&q=85'
    },
    {
      id: 'Yarns',
      category: 'Yarns',
      alt: 'Knitting & Cone Yarns',
      imageUrl: categoryImages.Yarns || 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=1600&q=85',
      fallbackImage: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=1600&q=85'
    }
  ];

  const currentSlide = slides[currentSlideIndex];

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    playClickSound();
    setDirection(idx > currentSlideIndex ? 1 : -1);
    setCurrentSlideIndex(idx);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const handleSlideClick = (category: CategoryType) => {
    playClickSound();
    onSelectCategory(category);
    const el = document.getElementById('storefront-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div 
      className="relative w-full rounded-none overflow-hidden bg-slate-950 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="storefront-image-slide"
    >
      {/* Aspect Ratio Container for Full Screen Wide Responsive Height (Reduced by 30%) */}
      <div 
        className="relative w-full h-[180px] xs:h-[225px] sm:h-[295px] md:h-[365px] lg:h-[420px] xl:h-[460px] cursor-pointer overflow-hidden"
        onClick={() => handleSlideClick(currentSlide.category)}
        title={`Click to view ${currentSlide.category} collection`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.alt}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== currentSlide.fallbackImage) {
                  target.src = currentSlide.fallbackImage;
                }
              }}
              className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Vignette Overlay along top and bottom for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/25 pointer-events-none" />

        {/* Category Pill Tag Overlay at Top Left */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-8 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#E50046] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">{currentSlide.category} Collection</span>
          </div>
        </div>

        {/* Navigation Arrow Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            prevSlide();
          }}
          className="absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-[#8C0034] backdrop-blur-md text-white shadow-xl border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
          title="Previous Collection"
          aria-label="Previous Collection"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Navigation Arrow Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            nextSlide();
          }}
          className="absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-[#8C0034] backdrop-blur-md text-white shadow-xl border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
          title="Next Collection"
          aria-label="Next Collection"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Indicator Dots Bar */}
        <div 
          className="absolute bottom-8 sm:bottom-12 md:bottom-14 inset-x-0 z-30 flex items-center justify-center gap-2.5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {slides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlideIndex === idx
                  ? 'w-10 bg-white shadow-lg shadow-white/30'
                  : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
              title={`View ${slide.category}`}
              aria-label={`View ${slide.category}`}
            />
          ))}
        </div>

        {/* Single Wave Design Curved Bottom Edge */}
        <div className="absolute -bottom-1 inset-x-0 w-full overflow-hidden leading-none pointer-events-none z-20">
          <svg
            className="relative block w-full h-8 sm:h-12 md:h-16 lg:h-20"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Subtle brand glow wave underlay */}
            <path
              d="M0,62 C480,125 960,18 1440,78 L1440,120 L0,120 Z"
              className="fill-rose-500/25"
            />
            {/* Main clean single wave curving into the catalog section */}
            <path
              d="M0,46 C480,112 960,6 1440,62 L1440,120 L0,120 Z"
              className="fill-slate-50"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StorefrontHeroSlider;
