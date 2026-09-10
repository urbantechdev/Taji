import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, ShoppingBag, Globe, Phone, FileText } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
import BrandLogo from './BrandLogo';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navbar({ onOpenCart, onOpenQuote, cartCount, onCategorySelect }: { 
  onOpenCart: () => void, 
  onOpenQuote?: () => void,
  cartCount: number,
  onCategorySelect?: (category: string) => void
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set official Tewaw brand favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = "/favicon.ico";

    const isMock = (url?: string) => !url || url.includes('pinimg.com') || url.includes('d33d71d87f12393171b52129b460c431');

    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings(data);
        if (data.faviconUrl && !isMock(data.faviconUrl)) {
          link!.href = data.faviconUrl;
        } else {
          link!.href = "/favicon.ico";
        }
      }
    });
  }, []);

  const handleSectionClick = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleCategoryClick = (categoryTitle: string) => {
    setActiveCategory(null);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        onCategorySelect?.(categoryTitle);
        document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else {
      onCategorySelect?.(categoryTitle);
      document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[500] h-[106px] transition-all duration-300">
      {/* Invisible SVG definition for bottom wave clip path */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="navbar-bottom-wave" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 L 1 0 L 1 0.85 C 0.65 1.00, 0.35 0.72, 0 0.88 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Container for the nav bar content with single bottom wave curve */}
      <div 
        className="relative h-full w-full bg-brand-blue lg:bg-transparent backdrop-blur-md overflow-hidden shadow-xl shadow-black/20"
        style={{ clipPath: 'url(#navbar-bottom-wave)', WebkitClipPath: 'url(#navbar-bottom-wave)' }}
      >
        {/* Split Background Effect with Single Wave Line Partition - Mobile & Desktop */}
        <div className="absolute inset-0 flex pointer-events-none bg-gradient-to-r from-brand-blue to-slate-900 overflow-hidden">
          {/* White side - precisely adjusted so the brand logo stays fully on a solid white background */}
          <div className="w-[72px] sm:w-[82px] lg:w-[380px] xl:w-[calc(50vw-640px+380px)] bg-white z-10 h-full" />
          
          {/* Wave line design partition */}
          <div className="absolute left-[72px] sm:left-[82px] lg:left-[380px] xl:left-[calc(50vw-640px+380px)] top-0 bottom-0 w-16 lg:w-24 -translate-x-1/2 z-20 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              {/* Main white wave fill */}
              <path d="M0 0 H50 C 62 25, 60 75, 80 100 H0 Z" className="fill-white" />
              {/* Elegant Accent Wave Line */}
              <path 
                d="M50 0 C 62 25, 60 75, 80 100" 
                fill="none" 
                stroke="url(#wave-accent-gradient)" 
                strokeWidth="4" 
                strokeLinecap="round"
                className="opacity-95"
              />
              <defs>
                <linearGradient id="wave-accent-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#269453" /> {/* brand-green */}
                  <stop offset="100%" stopColor="#1E7642" /> {/* brand-green */}
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Overlapping soft glow centering near the wave partition */}
          <div className="absolute left-[72px] sm:left-[82px] lg:left-[380px] xl:left-[calc(50vw-640px+380px)] inset-y-0 w-32 lg:w-64 bg-brand-orange/10 blur-2xl -translate-x-1/2 z-10 animate-pulse duration-[8000ms]" />
          
          {/* Global subtle texture line partition accent overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-10 z-30" />
        </div>

        {/* Bottom Single Wave Line Accent & Border */}
        <div className="absolute inset-0 pointer-events-none z-40">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="nav-bottom-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#269453" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#1E7642" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#269453" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Subtle glow underneath stroke */}
            <path 
              d="M 0 88 C 350 72, 650 100, 1000 85" 
              fill="none" 
              stroke="url(#nav-bottom-wave-gradient)" 
              strokeWidth="4" 
              className="blur-[2px] opacity-60"
            />
            {/* Crisp main stroke line along the bottom wave */}
            <path 
              d="M 0 88 C 350 72, 650 100, 1000 85" 
              fill="none" 
              stroke="url(#nav-bottom-wave-gradient)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Animated Glassy Ray Scanner Effect - Enhanced End to End Sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ 
              x: ['-100%', '100vw'],
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="w-52 sm:w-72 h-full -skew-x-[22deg] relative flex items-center justify-center bg-gradient-to-r from-transparent via-white/35 to-transparent backdrop-brightness-125 backdrop-blur-[1px]"
          >
            {/* Glowing outer aura beam */}
            <div className="w-16 h-full bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent blur-md" />

            {/* Ultra-clear glass hairline laser core beam */}
            <motion.div 
              animate={{
                opacity: [0.7, 1, 0.7],
                boxShadow: [
                  '0 0 10px rgba(255,255,255,0.7), 0 0 20px rgba(2,61,23,0.5)',
                  '0 0 18px rgba(255,255,255,1), 0 0 35px rgba(45,106,79,0.8)',
                  '0 0 10px rgba(255,255,255,0.7), 0 0 20px rgba(2,61,23,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[2.5px] h-full bg-gradient-to-b from-brand-orange via-white to-brand-green opacity-95" 
            />
            
            {/* Top edge light refraction flare line */}
            <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_8px_#ffffff]" />
          </motion.div>

          {/* Secondary subtle trailing light shimmer ray */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: ['-100%', '100vw'] }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              repeatDelay: 1.2,
              delay: 0.15,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="w-24 h-full -skew-x-[22deg] absolute top-0 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-sm"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
          <div className="flex justify-between items-center h-[106px]">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center group">
                <BrandLogo variant="responsive" size="lg" />
                
                {/* Gradient Separator */}
                <div className="h-8 w-[2px] mx-6 hidden sm:block bg-gradient-to-b from-transparent via-brand-orange to-transparent opacity-50" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="relative group">
                <button 
                  className={cn(
                    "flex items-center gap-1.5 font-bold hover:text-brand-orange transition-colors py-8 uppercase tracking-widest text-[10px]",
                    location.pathname === '/' || location.pathname.startsWith('/product') ? "text-white" : "text-white/80"
                  )}
                  onMouseEnter={() => setActiveCategory('mega')}
                  onClick={() => {
                    if (location.pathname !== '/') {
                      navigate('/');
                      setTimeout(() => {
                        const element = document.getElementById('catalogue');
                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                      }, 500);
                    } else {
                      const element = document.getElementById('catalogue');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Products <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link 
                to="/services" 
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold hover:text-brand-orange transition-colors",
                  location.pathname === '/services' || location.pathname === '/strengths' ? "text-brand-orange" : "text-white/80"
                )}
              >
                Services
              </Link>

              <Link 
                to="/about" 
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold hover:text-brand-orange transition-colors",
                  location.pathname === '/about' ? "text-brand-orange" : "text-white/80"
                )}
              >
                About
              </Link>

              <Link 
                to="/contact" 
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold hover:text-brand-orange transition-colors",
                  location.pathname === '/contact' ? "text-brand-orange" : "text-white/80"
                )}
              >
                Contact
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3 mr-1">
                <a href={`tel:${settings?.whatsappNumber || '+254736619688'}`} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-white bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4 text-brand-orange" />
                  {settings?.whatsappNumber || '+254 736 619 688'}
                </a>
              </div>

              {/* Cart Button */}
              <button 
                onClick={onOpenCart}
                className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all group"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-[10px] font-black rounded-full border-2 border-white lg:border-brand-blue flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Platform Toggle / Hamburger */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white lg:bg-white lg:text-brand-blue lg:shadow-lg lg:shadow-black/20 hover:scale-110 active:scale-95 transition-all lg:border-none"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>


      </div>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {activeCategory === 'mega' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onMouseLeave={() => setActiveCategory(null)}
            className="hidden lg:block absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl z-50"
          >
            <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-4 gap-8">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-4">
                  <div className="aspect-[16/9] rounded-lg overflow-hidden relative group">
                    <img 
                      referrerPolicy="no-referrer"
                      src={cat.image} 
                      alt={cat.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    <div className="absolute inset-0 bg-brand-blue/20 group-hover:bg-brand-blue/10 transition-colors" />
                  </div>
                  <h3 className="font-bold text-brand-blue border-b border-brand-orange/30 pb-2">{cat.title}</h3>
                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li key={item}>
                        <button 
                          onClick={() => handleCategoryClick(cat.title)}
                          className="text-sm text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2 text-left"
                        >
                          <span className="w-1.5 h-1.5 bg-brand-blue rounded-full opacity-50" />
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-8 py-4">
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Globe className="w-3 h-3 text-brand-blue" />
                100% Proudly Made in Kenya • Premier Garment Manufacturing Platform
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onCategorySelect={onCategorySelect}
        onOpenQuote={onOpenQuote}
      />
    </nav>
  );
}
