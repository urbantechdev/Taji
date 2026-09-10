import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalView, { LegalType } from '../components/LegalView';
import GlassyBackground from '../components/GlassyBackground';
import QuoteModal from '../components/QuoteModal';
import SEO from '../components/SEO';
import { getOptimizedImageUrl } from '../lib/imageOptimizer';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Award, 
  Zap, 
  Anchor, 
  Clock, 
  Sparkles, 
  Palette, 
  Printer, 
  Scissors, 
  Shirt, 
  Eye, 
  ShieldCheck, 
  FileText, 
  MessageSquareQuote,
  Check
} from 'lucide-react';
import { CartItem } from './Home';
import { STRENGTHS, BRANDING_SERVICES, BrandingService } from '../constants';
import { cn } from '../lib/utils';

const icons = [CheckCircle2, Anchor, Award, Zap, Layers, Clock];

const APPAREL_COLORWAYS = [
  { name: 'Kenya Navy', hex: '#0b2c7a', textDark: false },
  { name: 'Safari Olive', hex: '#2d3728', textDark: false },
  { name: 'Flame Orange', hex: '#ff6600', textDark: false },
  { name: 'Crimson Red', hex: '#b91c1c', textDark: false },
  { name: 'Kenyan Forest Green', hex: '#1e5e3a', textDark: false },
  { name: 'Jet Black', hex: '#111827', textDark: false },
  { name: 'Heather Grey', hex: '#94a3b8', textDark: true },
  { name: 'Crisp White', hex: '#ffffff', textDark: true },
];

const BRANDING_PLACEMENTS = [
  { id: 'chest', label: 'Left Chest Emblem', desc: 'Standard 8-10cm logo placement for corporate polos, scrubs & shirts.' },
  { id: 'pocket_3d', label: '3D Pocket Print / Flap', desc: 'Raised tactile silicone or DTF print engineered directly on pockets.' },
  { id: 'sleeve', label: 'Sleeve Badge / Crest', desc: 'Security insignias, team flags, or secondary brand badges.' },
  { id: 'back', label: 'Full Back Statement', desc: 'Large 25-30cm high-visibility graphic, typography, or safety reflector.' },
  { id: 'allover', label: '360° All-Over Sublimation', desc: 'Seamless edge-to-edge sublimation print for team jerseys & jackets.' },
];

export default function Strengths() {
  const [activeLegal, setActiveLegal] = useState<LegalType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  // Interactive Branding Visualizer State
  const [selectedBrandingId, setSelectedBrandingId] = useState<string>('3d_pocket_print');
  const [selectedColor, setSelectedColor] = useState(APPAREL_COLORWAYS[0]);
  const [selectedPlacement, setSelectedPlacement] = useState(BRANDING_PLACEMENTS[1]);
  const [activeTab, setActiveTab] = useState<'branding' | 'overview'>('branding');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tewaw_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
  }, []);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const orderData = {
        items: cart,
        totalAmount: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      let message = `*NEW ORDER FROM WEBSITE*\nOrder Ref: #${docRef.id.slice(0, 5)}\n\n`;
      cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}\n`;
      });
      message += `\n*TOTAL: KES ${cartTotal.toLocaleString()}*\n\n_Please confirm delivery details._`;
      
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(message)}`;
      
      setCart([]);
      setIsCartOpen(false);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const activeBranding = BRANDING_SERVICES.find(b => b.id === selectedBrandingId) || BRANDING_SERVICES[0];

  const handleDiscussBranding = (serviceName?: string) => {
    const service = serviceName || activeBranding.name;
    const msg = `Hello Tewaw Enterprise, I am interested in your apparel manufacturing & ${service} branding services (Colour matching, 3D pocket print, DTF print, Embroidery, Sublimation). I would like a quote for our custom order.`;
    window.open(`https://wa.me/254736619688?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Apparel Branding & Manufacturing Services | Tewaw Enterprise Kenya"
        description="Explore our specialized apparel branding solutions: 3D pocket printing, DTF digital transfers, precision computer embroidery, sublimation, and custom color matching in Nairobi, Kenya."
        canonical="https://tewaw.com/services"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Apparel Branding and Garment Manufacturing Services",
          "provider": {
            "@type": "Organization",
            "name": "Tewaw Enterprise Limited",
            "url": "https://tewaw.com/"
          },
          "serviceType": "Garment Manufacturing & Apparel Customization",
          "areaServed": "Kenya & East Africa",
          "description": "Custom Pantone colour matching, 3D pocket printing, high-definition DTF digital printing, precision computerized embroidery, and full-garment sublimation."
        }}
      />
      <GlassyBackground />
      <Navbar 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      <BottomNav onOpenCart={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-16">
        {/* Banner Hero */}
        <section className="relative pt-20 pb-28 md:pb-36 bg-brand-orange overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue rounded-full blur-[120px]" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Garment Customization & Manufacturing</span>
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-black uppercase tracking-tight leading-tight mb-6 text-brand-blue">
              GARMENT MANUFACTURING & <span className="text-white">APPAREL BRANDING</span>
            </h1>
            
            <p className="text-brand-blue font-semibold max-w-3xl mx-auto text-sm sm:text-base md:text-xl leading-relaxed">
              We incorporate bespoke branding directly onto every garment — from custom Pantone colour matching and tactile 3D pocket printing to high-definition DTF prints, precision computer embroidery, and 360° all-over sublimation.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('branding-studio');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl flex items-center gap-2"
              >
                <Shirt className="w-4 h-4 text-brand-orange" /> Explore Branding Techniques
              </button>
              
              <button
                onClick={() => setIsQuoteOpen(true)}
                className="px-8 py-4 bg-white text-brand-blue rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-xl flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-brand-green" /> Calculate Instant Quote
              </button>
            </div>
          </div>

          {/* Single Wave Design at the Hero Footer */}
          <div className="absolute bottom-[-2px] left-0 right-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-[32px] md:h-[64px] fill-[#F8F9FA]"
            >
              <path d="M0,60 C400,120 800,0 1200,60 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-30 mb-12">
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
            <button
              onClick={() => setActiveTab('branding')}
              className={cn(
                "flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'branding' 
                  ? "bg-brand-blue text-white shadow-md" 
                  : "text-slate-600 hover:text-brand-blue hover:bg-slate-50"
              )}
            >
              <Printer className="w-4 h-4 text-brand-orange" /> Branding & Customization
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'overview' 
                  ? "bg-brand-blue text-white shadow-md" 
                  : "text-slate-600 hover:text-brand-blue hover:bg-slate-50"
              )}
            >
              <Award className="w-4 h-4 text-brand-green" /> Manufacturing Strengths
            </button>
          </div>
        </div>

        {activeTab === 'branding' && (
          <>
            {/* Interactive Branding Studio Visualizer */}
            <section id="branding-studio" className="py-12 bg-white border-y border-slate-200/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 rounded-full mb-3 text-brand-orange font-bold text-xs uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5" /> Interactive Apparel Customization
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-brand-blue uppercase tracking-tight">
                    How Branding Is <span className="text-brand-orange">Incorporated On Apparel</span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base mt-2">
                    Select a branding technique, customize the garment colorway, and see how our Nairobi factory executes each application.
                  </p>
                </div>

                {/* Technique Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
                  {BRANDING_SERVICES.map((service) => {
                    const isSelected = selectedBrandingId === service.id;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setSelectedBrandingId(service.id)}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                          isSelected
                            ? "bg-brand-blue text-white border-brand-blue shadow-lg scale-[1.02]"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-brand-orange hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                            isSelected ? "bg-white/20 text-white" : "bg-brand-orange/10 text-brand-orange"
                          )}>
                            {service.id === '3d_pocket_print' ? '3D POCKET' : service.id.toUpperCase().replace('_', ' ')}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-brand-orange" />}
                        </div>
                        <p className={cn(
                          "font-bold text-xs leading-tight line-clamp-2",
                          isSelected ? "text-white" : "text-brand-blue"
                        )}>
                          {service.name}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Simulator Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-50 p-6 sm:p-8 rounded-[36px] border border-slate-200">
                  
                  {/* Left Column: Visual Garment Mockup & Placement */}
                  <div className="lg:col-span-6 space-y-6">
                    <div 
                      className="relative rounded-3xl p-8 aspect-square flex flex-col justify-between overflow-hidden shadow-inner border border-black/10 transition-colors duration-500"
                      style={{ backgroundColor: selectedColor.hex }}
                    >
                      {/* Subtle fabric weave texture overlay */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                      
                      {/* Header in Mockup */}
                      <div className="relative z-10 flex justify-between items-start">
                        <div className={cn(
                          "px-3 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-mono font-black uppercase tracking-wider shadow-sm",
                          selectedColor.textDark ? "bg-black/10 text-slate-800" : "bg-white/20 text-white"
                        )}>
                          Colorway: {selectedColor.name}
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          {activeBranding.badge}
                        </div>
                      </div>

                      {/* Mockup Garment & Branding Application Display */}
                      <div className="relative z-10 my-auto text-center py-6">
                        <div className="inline-block relative">
                          <Shirt className={cn(
                            "w-44 h-44 sm:w-56 sm:h-56 mx-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-105",
                            selectedColor.textDark ? "text-slate-800" : "text-white"
                          )} />

                          {/* Dynamic Visual Badges based on active branding technique */}
                          {selectedBrandingId === '3d_pocket_print' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-[48%] left-[58%] -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-white text-[9px] font-black px-2.5 py-2 rounded-lg border-2 border-white shadow-2xl flex flex-col items-center gap-0.5 tracking-wider uppercase transform rotate-[-2deg]"
                            >
                              <span className="text-[7px] text-white/80">3D SILICONE</span>
                              <span>POCKET EMBOSS</span>
                            </motion.div>
                          )}

                          {selectedBrandingId === 'dtf_print' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-[9px] font-black px-3 py-2.5 rounded-xl border border-white/40 shadow-2xl flex flex-col items-center gap-0.5 tracking-wider uppercase"
                            >
                              <span className="text-[7px] text-white/90">FULL-COLOR DTF</span>
                              <span>PHOTO-REALISTIC</span>
                            </motion.div>
                          )}

                          {selectedBrandingId === 'embroidery' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-[40%] left-[38%] -translate-x-1/2 -translate-y-1/2 bg-brand-blue text-amber-300 text-[8px] font-black px-2.5 py-2 rounded-full border-2 border-amber-300 shadow-2xl flex flex-col items-center gap-0.5 tracking-wider uppercase"
                            >
                              <span className="text-[6px] text-white">3D PUFF</span>
                              <span>CREST</span>
                            </motion.div>
                          )}

                          {selectedBrandingId === 'sublimation' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                              <div className="w-36 h-36 border-4 border-dashed border-brand-orange/60 rounded-3xl animate-pulse flex items-center justify-center">
                                <span className="bg-brand-blue/90 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg">
                                  360° ALL-OVER PATTERN
                                </span>
                              </div>
                            </motion.div>
                          )}

                          {selectedBrandingId === 'color_customization' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-[26%] left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg border border-white"
                            >
                              CONTRAST COLLAR & SLEEVE TRIM
                            </motion.div>
                          )}

                          {selectedBrandingId === 'screen_print' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-brand-blue text-[9px] font-black px-3 py-2 rounded-lg border-2 border-brand-blue shadow-2xl flex flex-col items-center tracking-wider uppercase"
                            >
                              <span className="text-[7px] text-slate-400">SILKSCREEN</span>
                              <span>HEAVY PLASTISOL</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Footer in Mockup */}
                      <div className="relative z-10 flex justify-between items-center text-xs">
                        <span className={cn(
                          "font-bold uppercase text-[10px] tracking-wider",
                          selectedColor.textDark ? "text-slate-700" : "text-white/80"
                        )}>
                          Placement: {selectedPlacement.label}
                        </span>
                        <span className={cn(
                          "font-mono font-bold text-[10px]",
                          selectedColor.textDark ? "text-slate-900" : "text-white"
                        )}>
                          Est. Rate: {activeBranding.estimatedCost}
                        </span>
                      </div>
                    </div>

                    {/* Color Swatch Selector */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-brand-orange" /> Choose Apparel Colorway
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {APPAREL_COLORWAYS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setSelectedColor(c)}
                            title={c.name}
                            className={cn(
                              "w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center shadow-sm",
                              selectedColor.name === c.name
                                ? "border-brand-blue ring-2 ring-brand-orange scale-110"
                                : "border-slate-200 hover:scale-105"
                            )}
                            style={{ backgroundColor: c.hex }}
                          >
                            {selectedColor.name === c.name && (
                              <Check className={cn("w-4 h-4", c.textDark ? "text-slate-900" : "text-white")} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Technical Details & Specifications */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-display font-black text-brand-blue uppercase tracking-tight">
                            {activeBranding.name}
                          </h3>
                          <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-black uppercase rounded-full tracking-wider border border-brand-green/20">
                            {activeBranding.badge}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-3">
                          {activeBranding.tagline}
                        </p>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {activeBranding.description}
                        </p>
                      </div>

                      {/* Key Features List */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
                          Technical Advantages & Finish
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeBranding.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Best For Garments */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
                          Recommended Apparels
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeBranding.bestFor.map((item, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-brand-blue/5 text-brand-blue rounded-xl text-xs font-bold border border-brand-blue/10">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Placement Selector */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-brand-orange" /> Recommended Branding Positions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {BRANDING_PLACEMENTS.map((p) => {
                            const isPSelected = selectedPlacement.id === p.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => setSelectedPlacement(p)}
                                className={cn(
                                  "p-3 rounded-xl border text-left transition-all text-xs",
                                  isPSelected
                                    ? "bg-brand-orange text-white border-brand-orange shadow-md"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                )}
                              >
                                <p className="font-bold">{p.label}</p>
                                <p className={cn("text-[10px] mt-0.5", isPSelected ? "text-white/80" : "text-slate-500")}>{p.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action CTAs */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleDiscussBranding(activeBranding.name)}
                          className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1f7743] transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <MessageSquareQuote className="w-4 h-4" /> Discuss on WhatsApp
                        </button>
                        <button
                          onClick={() => setIsQuoteOpen(true)}
                          className="flex-1 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-brand-orange" /> Add to Quote
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* In-Depth Branding Services Grid */}
            <section className="py-16 bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight mb-4">
                    Full Spectrum <span className="text-brand-orange">Branding Techniques</span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
                    Every garment manufactured in our Nairobi factory is engineered to support custom embroidery, DTF, 3D pocket printing, and sublimation with commercial durability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {BRANDING_SERVICES.map((service, idx) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white border border-slate-200 rounded-[32px] overflow-hidden hover:shadow-xl transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Banner */}
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <img
                            referrerPolicy="no-referrer"
                            src={getOptimizedImageUrl(service.imageUrl, 700, 80)}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white text-brand-blue text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                              {service.badge}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">
                              {service.name}
                            </h3>
                            <p className="text-xs text-brand-orange font-bold uppercase tracking-wider">
                              {service.tagline}
                            </p>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {service.description}
                          </p>

                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Highlights:</p>
                            {service.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                                <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Durability:</span>
                            <span className="font-bold text-brand-blue text-[11px] text-right">{service.durability}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="p-6 pt-0">
                        <button
                          onClick={() => {
                            setSelectedBrandingId(service.id);
                            const el = document.getElementById('branding-studio');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full py-3 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview on Garment
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Customization Lifecycle Steps */}
            <section className="py-16 bg-white border-t border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/10 rounded-full mb-3 text-brand-blue font-bold text-xs uppercase tracking-wider">
                    <Scissors className="w-3.5 h-3.5 text-brand-orange" /> Precision Workflow
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">
                    From Vector Design to <span className="text-brand-orange">Finished Apparel</span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base mt-2">
                    Our Nairobi production floor ensures stringent quality control across every stitch and print.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { step: '01', title: 'Design & Digitizing', desc: 'We calibrate your vector logos into embroidery stitch files or high-definition DTF/Sublimation color profiles.' },
                    { step: '02', title: 'Fabric & Color Dyeing', desc: 'Selection of 100% Kenyan cotton, brushed fleece, or ripstop with precise Pantone reactive dye matching.' },
                    { step: '03', title: 'Automated Branding', desc: 'High-speed multi-head embroidery, 3D pocket silicone pressing, DTF heat-transfers, or all-over sublimation.' },
                    { step: '04', title: 'Quality & Steam Press', desc: '100% seam audit, loose thread trimming, high-pressure steam pressing, individual bagging, and prompt dispatch.' },
                  ].map((s, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group hover:border-brand-orange transition-all">
                      <span className="text-3xl font-display font-black text-brand-orange/30 group-hover:text-brand-orange transition-colors">
                        {s.step}
                      </span>
                      <h4 className="text-base font-bold text-brand-blue mt-2 mb-2">{s.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'overview' && (
          /* Strengths Section */
          <section className="py-16 md:py-24 bg-brand-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight mb-4">
                  What Makes Us <span className="text-brand-orange">Competitive</span>
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                  We design and supply robust garments while controlling the entire stitching lifecycle, ensuring unmatched structural speed, quality, and wholesale pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {STRENGTHS.map((strength, idx) => {
                  const Icon = icons[idx] || CheckCircle2;
                  return (
                    <motion.div
                      key={strength.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white border border-slate-100 p-8 rounded-[32px] hover:shadow-xl transition-all group brand-edge-mint hover:translate-x-1 hover:-translate-y-1"
                    >
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                        <Icon className="w-8 h-8 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-bold text-brand-blue mb-3">{strength.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {strength.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="p-8 md:p-12 bg-brand-blue rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 brand-edge-orange hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="max-w-xl text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange bg-white/10 px-3 py-1 rounded-full">
                Custom Production & Samples
              </span>
              <h3 className="text-xl md:text-2xl font-display font-black text-white mt-3 mb-3 leading-tight">
                READY TO BRAND YOUR APPAREL?
              </h3>
              <p className="text-brand-light/70 text-sm leading-relaxed">
                Connect with our Nairobi master tailors and print specialists. We customize colours, 3D pocket prints, DTF transfers, embroidery, and sublimation with rapid dispatch.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 whitespace-nowrap">
              <button 
                onClick={() => setIsQuoteOpen(true)}
                className="px-8 py-4 bg-brand-green text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1f7743] transition-all shadow-xl"
              >
                Instant Quote Generator
              </button>
              <button 
                onClick={() => handleDiscussBranding()}
                className="px-8 py-4 bg-brand-orange text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-brand-blue transition-all shadow-xl"
              >
                Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenLegal={setActiveLegal} />

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        settings={settings}
      />

      <AnimatePresence>
        {activeLegal && (
          <LegalView type={activeLegal} onClose={() => setActiveLegal(null)} />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[1000]" 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[1001] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-brand-blue" />
                  <h2 className="text-lg font-display font-black text-brand-blue uppercase italic">Your Stash</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 brand-edge-orange">
                      <img 
                        referrerPolicy="no-referrer"
                        src={getOptimizedImageUrl(item.imageUrl, 200, 75)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={item.name} 
                        loading="lazy" 
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-brand-blue truncate">{item.name}</h4>
                      <p className="text-xs text-brand-orange font-black uppercase tracking-widest mb-2">{item.category}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-brand-blue transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black text-brand-blue min-w-[20px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-brand-blue transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-brand-blue text-sm">KES {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <p className="font-display font-black text-2xl uppercase tracking-tight text-slate-200 mb-6">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                    <span className="text-xl font-mono font-black text-brand-blue">KES {cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={isSubmittingOrder}
                    className="w-full py-5 bg-brand-blue text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-blue/20 hover:bg-brand-orange transition-all flex items-center justify-center gap-3 brand-edge-orange border-none"
                  >
                    {isSubmittingOrder ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Checkout via WhatsApp <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
