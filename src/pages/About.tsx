import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalView, { LegalType } from '../components/LegalView';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, RefreshCw, 
  Scissors, Heart, Sparkles, TrendingUp, ShieldCheck, Award, 
  Users, CheckCircle2, Factory, Layers, ArrowUpRight 
} from 'lucide-react';
import { CartItem } from './Home';
import { getOptimizedImageUrl } from '../lib/imageOptimizer';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';

export default function About() {
  const [activeLegal, setActiveLegal] = useState<LegalType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

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
    if (!customerName.trim() || !customerEmail.trim()) {
      alert("Please enter your name and email first to checkout.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          imageUrl: item.imageUrl,
          quantity: Number(item.quantity),
          category: item.category || 'General'
        })),
        totalAmount: Number(cartTotal),
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      let message = `*NEW ORDER FROM WEBSITE*\nOrder Ref: #${docRef.id.slice(0, 5)}\nCustomer: ${customerName.trim()} (${customerEmail.trim()})\n\n`;
      cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}\n`;
      });
      message += `\n*TOTAL: KES ${cartTotal.toLocaleString()}*\n\n_Please confirm delivery details._`;
      
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(message)}`;
      
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setIsCartOpen(false);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="About Tewaw Enterprise | Premier Kenyan Garment Manufacturer"
        description="Learn about Tewaw Enterprise — Nairobi's premier garment manufacturing factory specializing in high-quality apparel, security uniforms, and tactical fleece."
        canonical="https://tewaw.com/about"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Tewaw Enterprise",
          "description": "Authentic Kenyan garment craftsmanship. Stitching dreams into real, premium-crafted apparel with heart and purpose.",
          "publisher": {
            "@type": "Organization",
            "name": "Tewaw Enterprise Limited",
            "url": "https://tewaw.com/",
            "logo": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800"
          }
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
        <section className="relative pt-20 pb-28 md:pb-36 bg-brand-blue overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-0 right-0 w-96 h-96 bg-slate-400 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green rounded-full blur-[140px]" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/15"
            >
              <Scissors className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Our Story & Legacy</span>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight leading-none mb-6">
              ABOUT TEWAW • <span className="text-brand-orange">THE SEW-GURU</span> LEGACY
            </h1>
            <p className="text-brand-light/80 max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-normal leading-relaxed">
              Authentic Kenyan garment craftsmanship. Stitching dreams into real, premium-crafted apparel with heart, precision, and purpose.
            </p>
          </div>

          {/* Single Wave Design at the Hero Footer */}
          <div className="absolute bottom-[-2px] left-0 right-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-[32px] md:h-[64px] fill-slate-50"
            >
              <path d="M0,60 C400,120 800,0 1200,60 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>

        {/* Story Section - Modern Redesign */}
        <section className="py-12 md:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* Top Grid: Story Highlight & Mandate */}
            <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
              
              {/* Childhood Dream Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 bg-white p-8 md:p-12 rounded-[36px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 flex flex-col justify-between relative overflow-hidden brand-edge-blue"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-slate-400/20 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand-blue text-slate-300 flex items-center justify-center shadow-lg shadow-brand-blue/20">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Genesis</span>
                      <h2 className="text-2xl font-display font-black text-brand-blue uppercase">Our Story</h2>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-base md:text-lg mb-5 font-semibold">
                    Tewaw Enterprises Limited started as a simple belief and a childhood dream that manufacturing should do more than produce clothing it should create opportunities.
                  </p>
                  
                  <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-5">
                    What started as a small apparel business has grown into a proudly Kenyan manufacturer producing garment in-house, from cutting and stitching to branding and quality control, ensuring exceptional quality at every stage.
                  </p>

                  <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-5">
                    We specialize in manufacturing premium school uniforms, corporate wear, sportswear, promotional merchandise, campaign apparel and custom-branded apparel. With a commitment to quality, reliability and affordability, we help our clients showcase their identity with confidence.
                  </p>

                  <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-8">
                    Today, every garment tells a story of opportunity, dignity and hope. Every stitch represents more than craftsmanship, it represents a livelihood. Proudly Made in Kenya, we believe that clothing has the power to transform lives, creating meaningful employment and equipping underserved youth, women and men with practical skills that enable them to earn a living and build a better future. At Tewaw, we don't just manufacture apparel, we weave stronger communities, restore dignity through meaningful work, and proudly produce garments that carry the spirit of Kenya to individuals, organizations and brands across Africa and beyond.
                  </p>
                </div>

                {/* Quote Box */}
                <div className="p-6 bg-brand-blue text-white rounded-3xl relative overflow-hidden shadow-lg shadow-brand-blue/20 border border-brand-blue">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-400/10 rounded-full blur-xl" />
                  <p className="italic font-display font-bold text-lg md:text-xl leading-snug relative z-10 text-slate-300">
                    "When you wear Tewaw, you wear a dream realized."
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">
                    — Tewaw Enterprise Motto
                  </p>
                </div>
              </motion.div>

              {/* Garment Stitching Gurus Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-5 space-y-6 flex flex-col justify-between"
              >
                <div className="bg-gradient-to-br from-brand-blue to-slate-900 text-white p-8 md:p-10 rounded-[36px] shadow-xl border border-brand-blue/30 relative overflow-hidden flex-1 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-slate-400/10 rounded-full blur-2xl" />
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6 border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Our Identity</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight leading-tight mb-4">
                      WE ARE <span className="text-slate-400">GARMENT</span> STITCHING GURUS.
                    </h2>

                    <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                      At Tewaw Enterprises, every piece tells a story of dedication, luxury, and affordability. From weaving to stitching, we are passionate about dressing individuals, teams, and brands with apparel that resonates with both comfort and prestige.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" /> High Precision Apparel
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" /> Authentic Kenyan Craft
                    </span>
                  </div>
                </div>

                {/* Vision & Mission Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-brand-green" />
                      <h3 className="font-black text-brand-blue uppercase text-xs tracking-widest">Vision</h3>
                    </div>
                    <p className="text-xs text-slate-600 italic">"To create opportunities and prove that world-class apparel can be proudly made in Kenya while transforming lives, one stitch at a time."</p>
                  </div>

                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-brand-blue transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="w-4 h-4 text-brand-blue" />
                      <h3 className="font-black text-brand-blue uppercase text-xs tracking-widest">Mission</h3>
                    </div>
                    <p className="text-xs text-slate-600 italic">"To become Africa's leading socially driven apparel manufacturer, transforming lives through quality Kenyan craftsmanship by creating sustainable employment, empowering underserved communities and proudly showcasing the excellence of Made in Kenya to the world."</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Core Values / Craft Pillars */}
            <div className="space-y-8 pt-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-blue bg-slate-200 px-3 py-1 rounded-full">
                  Our Foundation
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase">
                  WHY CLIENTS TRUST TEWAW
                </h2>
                <p className="text-sm text-slate-500">
                  Four core pillars powering our Nairobi garment manufacturing output.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: ShieldCheck,
                    title: "AUTHENTICITY",
                    desc: "Genuine Kenyan craftsmanship stitched with genuine cotton & durable field fabrics.",
                    badge: "100% Kenyan"
                  },
                  {
                    icon: Award,
                    title: "PRECISION QUALITY",
                    desc: "Rigorous quality checks at every seam to ensure longevity for security & corporate wear.",
                    badge: "Zero Flaws"
                  },
                  {
                    icon: Users,
                    title: "CLIENT CARE",
                    desc: "Tailored consultations for schools, security firms, NGOs, and corporate uniforms.",
                    badge: "Dedicated Support"
                  },
                  {
                    icon: Factory,
                    title: "ETHICAL PRODUCTION",
                    desc: "Empowerment of local Kenyan artisans and fair labor practices in Nairobi.",
                    badge: "Local Artisans"
                  }
                ].map((pillar, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-brand-blue flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-slate-300 transition-colors">
                        <pillar.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-green bg-[#269453]/10 px-2.5 py-1 rounded-full mb-3 inline-block">
                        {pillar.badge}
                      </span>
                      <h3 className="font-display font-black text-brand-blue text-lg uppercase mb-2">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="bg-brand-blue rounded-[36px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
                <div>
                  <span className="text-4xl md:text-5xl font-display font-black text-slate-300 block">100%</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300 mt-2">Kenyan Craft</p>
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-display font-black text-white block">50K+</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300 mt-2">Garments Stitched</p>
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-display font-black text-slate-300 block">15+</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300 mt-2">Product Categories</p>
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-display font-black text-white block">24/7</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300 mt-2">WhatsApp Support</p>
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div className="bg-white p-8 md:p-12 rounded-[36px] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-slate-200 px-3 py-1 rounded-full mb-3 inline-block">
                  Custom Orders
                </span>
                <h3 className="text-2xl font-display font-black text-brand-blue uppercase">
                  READY TO STITCH YOUR TEAM'S VISION?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Connect with our Nairobi garment team for custom uniform quotes and fast delivery.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-green transition-all shadow-lg flex items-center justify-center gap-2 w-full md:w-auto"
                >
                  Contact Our Team <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer onOpenLegal={setActiveLegal} />

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
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 brand-edge-blue">
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
                      <p className="text-xs text-brand-green font-black uppercase tracking-widest mb-2">{item.category}</p>
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
                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Details</p>
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="Your Name (e.g. John Doe)" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        required
                        placeholder="Your Email Address" 
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                    <span className="text-xl font-mono font-black text-brand-blue">KES {cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={isSubmittingOrder}
                    className="w-full py-5 bg-brand-blue text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-blue/20 hover:bg-brand-green transition-all flex items-center justify-center gap-3 brand-edge-blue border-none"
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
