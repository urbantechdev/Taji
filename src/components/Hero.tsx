import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, ShoppingBag, Instagram, MessageCircle, Facebook, Phone, Mail } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { getOptimizedImageUrl, preloadImages } from '../lib/imageOptimizer';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  badge?: string;
  status?: string;
  order: number;
}

const SOCIAL_LINKS = [
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    href: 'https://wa.me/254736619688',
    bgClass: 'bg-gradient-to-tr from-[#075E54] via-[#25D366] to-[#DCF8C6] text-white',
    glowClass: 'shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:shadow-[0_0_35px_rgba(37,211,102,1),0_0_15px_rgba(255,255,255,0.8)] border-emerald-300/50',
    label: 'Chat on WhatsApp',
    badge: 'Live',
    badgeBg: 'bg-emerald-400',
  },
  {
    name: 'Instagram',
    icon: Instagram,
    href: 'https://www.instagram.com/tewaw_enterprises/',
    bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
    glowClass: 'shadow-[0_0_20px_rgba(225,48,108,0.6)] hover:shadow-[0_0_35px_rgba(225,48,108,1),0_0_15px_rgba(255,255,255,0.8)] border-pink-300/50',
    label: 'Instagram (@tewaw_enterprises)',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://www.facebook.com/tewaw.enterprises',
    bgClass: 'bg-gradient-to-tr from-[#0b5ed7] via-[#1877F2] to-[#60a5fa] text-white',
    glowClass: 'shadow-[0_0_20px_rgba(24,119,242,0.6)] hover:shadow-[0_0_35px_rgba(24,119,242,1),0_0_15px_rgba(255,255,255,0.8)] border-blue-300/50',
    label: 'Facebook (@tewaw.enterprises)',
  },
  {
    name: 'Phone',
    icon: Phone,
    href: 'tel:+254736619688',
    bgClass: 'bg-gradient-to-tr from-[#15803d] via-[#269453] to-[#86efac] text-white',
    glowClass: 'shadow-[0_0_20px_rgba(38,148,83,0.6)] hover:shadow-[0_0_35px_rgba(38,148,83,1),0_0_15px_rgba(255,255,255,0.8)] border-green-300/50',
    label: 'Call Us Direct',
  },
  {
    name: 'Email',
    icon: Mail,
    href: 'mailto:tewawenterprises@gmail.com',
    bgClass: 'bg-gradient-to-tr from-[#0B2C7A] via-[#1d4ed8] to-[#93c5fd] text-white',
    glowClass: 'shadow-[0_0_20px_rgba(29,78,216,0.6)] hover:shadow-[0_0_35px_rgba(29,78,216,1),0_0_15px_rgba(255,255,255,0.8)] border-indigo-300/50',
    label: 'Send Email',
  },
];

function FloatingSocials() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="hidden lg:flex flex-row gap-3 fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      {/* Outer Glowing Glass Container */}
      <div className="relative flex flex-row items-center gap-3 p-3 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]">
        {/* Ambient background aura glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/30 via-brand-green/20 to-purple-500/20 rounded-full blur-xl -z-10 animate-pulse pointer-events-none" />

        {SOCIAL_LINKS.map((social, index) => {
          const Icon = social.icon;
          return (
            <motion.a
              key={social.name}
              href={social.href}
              target={social.href.startsWith('http') ? '_blank' : undefined}
              rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={social.label}
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.35,
              }}
              whileHover={{ scale: 1.2, y: -6 }}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "relative group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border overflow-hidden cursor-pointer shiny-scan-button",
                social.bgClass,
                social.glowClass
              )}
            >
              {/* Shiny Glare Streak Animation */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-20" />
              <span className="absolute top-0 left-0 right-0 h-[40%] bg-white/25 rounded-t-full pointer-events-none" />

              {/* Live indicator badge */}
              {social.badge && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 z-30">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-slate-900"></span>
                </span>
              )}

              <Icon className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-115 relative z-10" />

              {/* Shiny Glowing Tooltip */}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-950/95 text-white text-xs font-black tracking-wide rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.2)] border border-white/20 flex items-center gap-2 z-50">
                {social.badge && (
                  <span className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]", social.badgeBg)} />
                )}
                <span>{social.label}</span>
                {/* Arrow pointer */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950/95 border-r border-b border-white/20 rotate-45" />
              </div>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default-1',
    title: 'ELITE CRAFT',
    subtitle: 'PREMIUM MANUFACTURING',
    description: 'Kenyan craftsmanship meets global standards. We elevate every stitch with precision.',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Explore Collection',
    buttonLink: '#categories',
    badge: '100% Kenyan',
    order: 1
  },
  {
    id: 'default-2',
    title: 'NAIROBI BORN',
    subtitle: 'BORN IN NAIROBI',
    description: 'Locally produced, globally inspired. Celebrating our roots through premium construction.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Our Story',
    buttonLink: '#about',
    badge: 'Authentic Quality',
    order: 2
  },
  {
    id: 'default-3',
    title: 'PURE FLEECE',
    subtitle: 'TACTICAL QUALITY',
    description: 'The gold standard of African manufacturing. Exceptional quality you can feel.',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Order Custom',
    buttonLink: 'https://wa.me/254736619688',
    badge: 'Global Standards',
    order: 3
  }
];

interface HeroProps {
  isCollapsed?: boolean;
}

export default function Hero({ isCollapsed = false }: HeroProps) {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Instant image preload for all slides
  useEffect(() => {
    if (slides && slides.length > 0) {
      const urls = slides.map(s => getOptimizedImageUrl(s.imageUrl, 1200, 80));
      preloadImages(urls);
    }
  }, [slides]);

  useEffect(() => {
    const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const slidesData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Slide))
          .filter(slide => slide.status !== 'inactive');
        const finalSlides = slidesData.length > 0 ? slidesData : DEFAULT_SLIDES;
        setSlides(finalSlides);
        // Preload any dynamic slider images
        preloadImages(finalSlides.map(s => getOptimizedImageUrl(s.imageUrl, 1200, 80)));
      } else {
        setSlides(DEFAULT_SLIDES);
      }
      setIsLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sliders'));
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleCtaClick = (e: React.MouseEvent, link: string) => {
    if (link.startsWith('#')) {
      e.preventDefault();
      const sectionId = link.substring(1);
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (link.startsWith('http')) {
      // Standard anchor behavior for external
    } else if (link) {
      e.preventDefault();
      navigate(link);
    }
  };

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [slides.length, currentSlide]);

  if (isLoading) {
    return (
      <div 
        className={cn(
          "w-full transition-all duration-500 ease-in-out overflow-hidden",
          isCollapsed 
            ? "max-lg:max-h-0 max-lg:opacity-0 max-lg:pointer-events-none max-lg:scale-95 origin-top" 
            : "max-lg:max-h-[1000px] max-lg:opacity-100 max-lg:scale-100"
        )}
      >
        <div className="h-[45vh] sm:h-[52vh] lg:h-[58vh] min-h-[300px] bg-brand-light animate-pulse" />
      </div>
    );
  }

  // Fallback if no slides - showing the original design
  if (slides.length === 0 && !isLoading) {
    return (
      <div 
        className={cn(
          "w-full transition-all duration-500 ease-in-out overflow-hidden",
          isCollapsed 
            ? "max-lg:max-h-0 max-lg:opacity-0 max-lg:pointer-events-none max-lg:scale-95 origin-top" 
            : "max-lg:max-h-[1000px] max-lg:opacity-100 max-lg:scale-100"
        )}
      >
        <section className="relative h-[45vh] sm:h-[52vh] lg:h-[58vh] min-h-[300px] overflow-hidden bg-brand-blue uppercase lg:flex lg:flex-row">
        {/* Floating Social Icons (Desktop Only) */}
        <FloatingSocials />

        {/* Left Side: Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-end lg:justify-center items-center lg:items-start px-6 sm:px-8 lg:px-12 xl:px-24 absolute lg:relative inset-0 lg:inset-auto z-20 bg-gradient-to-t from-brand-blue from-0% via-brand-blue/90 via-30% to-transparent to-60% lg:bg-brand-blue lg:to-transparent transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-xl text-center lg:text-left mb-4 sm:mb-8 lg:mb-0"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-orange text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2 sm:mb-3 lg:mb-5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Elite Manufacturing
            </motion.div>
            
            <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-display font-black text-white leading-[1] sm:leading-[0.9] mb-2 sm:mb-3 lg:mb-5 tracking-tighter uppercase text-center lg:text-left">
              CRAFTING <span className="text-brand-orange underline decoration-[6px] sm:decoration-[8px] decoration-white/10">HERITAGE</span>
            </h1>
            
            <p className="text-[11px] sm:text-sm lg:text-base text-white/95 lg:text-white/60 mb-2.5 sm:mb-4 lg:mb-6 leading-relaxed font-medium mx-auto lg:mx-0 max-w-md lg:max-w-none text-center lg:text-left">
              Elite Kenyan garment manufacturing for the global stage. 
              Elevating every stitch with passion, precision, and purpose.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 sm:px-8 lg:px-9 py-2.5 sm:py-3.5 lg:py-4 bg-brand-green text-white rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-xs flex items-center justify-center gap-3 hover:bg-[#1f7743] transition-all brand-glow-green shiny-scan-button group shadow-[0_0_25px_rgba(38,148,83,0.6)] hover:shadow-[0_0_35px_rgba(38,148,83,0.9)]"
              >
                Explore Catalogue <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-4 lg:mt-10 flex items-center justify-center lg:justify-start gap-6 lg:gap-8 border-t border-white/10 pt-3 sm:pt-4 lg:pt-5 overflow-x-auto no-scrollbar">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white italic">100%</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap">Kenyan Made</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/10" />
              <div>
                <p className="text-xl sm:text-2xl font-black text-brand-orange">PREMIUM</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap">Tactical Fleece</p>
              </div>
            </div>
          </motion.div>
        </div>

          {/* Image Container */}
          <div className="w-full lg:w-1/2 absolute lg:relative inset-0 lg:inset-auto h-full lg:h-auto overflow-hidden z-10">
            <img 
              referrerPolicy="no-referrer"
              src={PLACEHOLDER_PRODUCT_IMAGE} 
              alt="Manufacturing Excellence" 
              className="w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
              }}
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-transparent to-transparent hidden lg:block" />
            
            <div className="absolute bottom-8 right-8 z-10 text-right opacity-0 lg:opacity-100">
               <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] block mb-2">Featured Series</span>
               <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter bg-brand-blue/40 backdrop-blur-md px-4 py-2 rounded-xl">Heritage Collection 2024</h3>
            </div>
          </div>

          {/* Single Wave Design at the Hero Footer */}
          <div className="absolute bottom-[-2px] left-0 right-0 w-full overflow-hidden leading-[0] z-30 pointer-events-none">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-[32px] md:h-[64px] fill-[#F8F9FA]"
            >
              <path d="M0,60 C400,120 800,0 1200,60 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div 
      className={cn(
        "w-full transition-all duration-500 ease-in-out overflow-hidden",
        isCollapsed 
          ? "max-lg:max-h-0 max-lg:opacity-0 max-lg:pointer-events-none max-lg:scale-95 origin-top" 
          : "max-lg:max-h-[1000px] max-lg:opacity-100 max-lg:scale-100"
      )}
    >
      <section 
        className="relative h-[45vh] sm:h-[52vh] lg:h-[58vh] min-h-[300px] overflow-hidden bg-brand-blue"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured Manufacturing Highlights"
      >
        {/* Floating Social Icons (Desktop Only) */}
        <FloatingSocials />

        <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 lg:flex lg:flex-row"
              role="group"
              aria-roledescription="slide"
              aria-label={`${currentSlide + 1} of ${slides.length}: ${slide.title}`}
            >
              {/* Content Overlay with Gradient Partition for Mobile */}
              <div className="w-full lg:w-1/2 flex flex-col justify-end lg:justify-center items-center lg:items-start px-6 sm:px-8 lg:px-12 xl:px-24 absolute lg:relative inset-0 lg:inset-auto z-20 bg-gradient-to-t from-brand-blue from-0% via-brand-blue/90 via-30% to-transparent to-60% lg:bg-transparent transition-all duration-300">
                <div className="max-w-xl w-full text-center lg:text-left mb-4 sm:mb-8 lg:mb-0">
                  {slide.badge && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green text-white text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-3 lg:mb-5 shadow-lg shadow-brand-green/30"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {slide.badge}
                    </motion.div>
                  )}
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-display font-black text-white leading-[1] sm:leading-[0.9] mb-2 sm:mb-3 lg:mb-5 uppercase tracking-tighter text-center lg:text-left"
                  >
                    <span className="block text-[10px] sm:text-xs lg:text-sm font-sans font-bold text-brand-orange uppercase tracking-[0.2em] mb-1 sm:mb-2">
                      Tewaw Enterprise • {slide.subtitle || 'Garment Manufacturer & Uniforms'}
                    </span>
                    {slide.title.split(' ').slice(0, 3).map((word, i) => (
                      <span key={i} className={i % 2 === 1 ? "text-brand-green" : ""}>
                        {word}{' '}
                      </span>
                    ))}
                    {slide.title.split(' ').length > 3 && "..."}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[11px] sm:text-sm lg:text-base text-white/95 lg:text-white/60 mb-2.5 sm:mb-4 lg:mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium text-center lg:text-left"
                  >
                    {slide.description}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                  >
                    <a 
                      href={slide.buttonLink || '#'}
                      onClick={(e) => handleCtaClick(e, slide.buttonLink || '#')}
                      className="w-full sm:w-auto px-6 sm:px-8 lg:px-9 py-2.5 sm:py-3.5 lg:py-4 bg-brand-green text-white rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-xs flex items-center justify-center gap-3 hover:bg-[#1f7743] transition-all brand-glow-green shiny-scan-button group shadow-[0_0_25px_rgba(38,148,83,0.6)] hover:shadow-[0_0_35px_rgba(38,148,83,0.9)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      {slide.buttonText || 'Discover More'} 
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </motion.div>
                </div>
              </div>

              {/* Image Container */}
              <div className="w-full lg:w-1/2 absolute lg:relative inset-0 lg:inset-auto h-full lg:h-full z-10 group overflow-hidden">
                <motion.img 
                  referrerPolicy="no-referrer"
                  key={slide.imageUrl}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  src={getOptimizedImageUrl(slide.imageUrl, 1200, 80)} 
                  alt={slide.title} 
                  className="w-full h-full object-cover"
                  fetchPriority={currentSlide === 0 ? "high" : "auto"}
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                  }}
                />
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-transparent to-transparent hidden lg:block" />
                
                {/* Visual Accents */}
                <div className="absolute top-10 right-10 hidden lg:flex items-center gap-2">
                   <div className="h-px w-12 bg-white/30" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">TEWAW PLATFORM</span>
                </div>
              </div>
            </motion.div>
        </AnimatePresence>

      {/* Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 right-4 sm:right-10 z-20 flex gap-3">
          <button 
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-brand-orange transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center hover:bg-brand-orange transition-all shadow-xl shadow-brand-blue/30 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute left-1/2 bottom-5 lg:bottom-7 -translate-x-1/2 z-20 flex gap-2.5" role="tablist" aria-label="Slide Selection">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={currentSlide === i}
              role="tab"
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
                currentSlide === i ? "w-8 sm:w-10 bg-brand-orange shadow-[0_0_15px_rgba(2,61,23,0.5)]" : "w-2.5 sm:w-3 bg-white/40"
              )}
            />
          ))}
        </div>
      )}

      {/* Single Wave Design at the Hero Footer */}
      <div className="absolute bottom-[-2px] left-0 right-0 w-full overflow-hidden leading-[0] z-30 pointer-events-none">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-[32px] md:h-[64px] fill-[#F8F9FA]"
        >
          <path d="M0,60 C400,120 800,0 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  </div>
  );
}
