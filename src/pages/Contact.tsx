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
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, RefreshCw, Mail, Phone, MapPin, Send, MessageSquare, ExternalLink, Instagram, Facebook, Ticket, CheckCircle2, Copy, Check } from 'lucide-react';
import { CartItem } from './Home';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import GoogleMapLocation from '../components/GoogleMapLocation';
import { createSupportTicket, TicketCategory, TicketPriority } from '../lib/ticketService';

export default function Contact() {
  const [activeLegal, setActiveLegal] = useState<LegalType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Contact Form State & Support Ticket State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: 'General Inquiry' as TicketCategory,
    priority: 'medium' as TicketPriority,
    subject: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string>('');
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return;
    setSubmittingContact(true);
    try {
      // 1. Create Formal Support Ticket in Firestore & trigger Email Dispatch to feminiholdings@gmail.com
      const res = await createSupportTicket({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        companyName: formData.company,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject || `${formData.category} - ${formData.name}`,
        message: formData.message,
        source: 'Website Contact Form',
      });
      
      setSubmittedTicketId(res.ticketId);

      // 2. Open WhatsApp pre-populated draft with the Ticket Reference Number
      const formatMsg = `*SUPPORT TICKET [${res.ticketId}]*\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone}\n*Category:* ${formData.category}\n*Subject:* ${formData.subject || formData.category}\n\n*Message:* ${formData.message}`;
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(formatMsg)}`;
      
      setFormSubmitted(true);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        company: '',
        category: 'General Inquiry',
        priority: 'medium',
        subject: '', 
        message: '' 
      });

      // Try opening WhatsApp in new window safely
      try {
        window.open(whatsappUrl, '_blank');
      } catch (_) {}
    } catch (err) {
      console.error("Inquiry ticket generation failed", err);
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <SEO 
        title="Contact Tewaw Enterprise | Nairobi Garment Factory & Orders"
        description="Get in touch with Tewaw Enterprise in Nairobi, Kenya for wholesale quotes, custom uniform orders, and bulk garment manufacturing inquiries."
        canonical="https://tewaw.com/contact"
        schema={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Tewaw Enterprise",
          "description": "Connect with Tewaw's stitching consultants for quotes, custom uniform orders, and fast delivery timelines."
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
        <section className="relative pt-20 pb-28 md:pb-36 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue rounded-full blur-[120px]" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6"
            >
              <MessageSquare className="w-4 h-4 text-brand-green" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Get in Touch</span>
            </motion.div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-black uppercase tracking-tight leading-none mb-6">
              CONTACT TEWAW • <span className="text-brand-green">FACTORY & SALES TEAM</span>
            </h1>
            <p className="text-brand-light/70 max-w-2xl mx-auto text-sm sm:text-base md:text-xl">
              Connect with Tewaw's stitching consultants to request bespoke pricing, custom uniform quotes, and fast delivery timelines.
            </p>
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

        {/* Contact Layout */}
        <section className="py-16 md:py-24 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Column: Details */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-2xl font-display font-black text-brand-blue uppercase">Factory Headquarter</h3>
                  <p className="text-slate-600">
                    We operate right in Nairobi, dispatching high-end tailored garments directly to organisations, colleges, NGOs, and retailers across the country.
                  </p>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Call Expert</p>
                        <a href="tel:+254736619688" className="text-base font-bold text-brand-blue hover:text-brand-orange transition-colors">
                          +254 736 619 688
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Us</p>
                        <a href="mailto:tewawenterprises@gmail.com" className="text-base font-bold text-brand-blue hover:text-brand-orange transition-colors">
                          tewawenterprises@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                          <a
                            href="https://share.google/M7dvWHTuFItX3Uhjb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-brand-orange hover:underline uppercase flex items-center gap-1"
                          >
                            Open Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-sm font-bold text-brand-blue">
                          P.O. Box 13653 - 00400 Jagoo Lane, Tewaw Enterprise Limited, Uhuru Market, Nairobi
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Follow Us on Social Media</p>
                      <div className="flex items-center gap-3">
                        <a 
                          href="https://www.instagram.com/tewaw_enterprises/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <Instagram className="w-4 h-4" />
                          <span>@tewaw_enterprises</span>
                        </a>
                        <a 
                          href="https://www.facebook.com/tewaw.enterprises" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <Facebook className="w-4 h-4" />
                          <span>@tewaw.enterprises</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-orange/10 p-8 rounded-[32px] border border-brand-orange/20 text-center">
                  <h4 className="text-lg font-black text-brand-blue uppercase mb-2">FACTORY WORKING HOURS</h4>
                  <p className="text-slate-600 text-sm">Monday — Friday: 08:00 AM - 05:00 PM</p>
                  <p className="text-slate-600 text-sm mt-1">Saturday: 09:00 AM - 01:00 PM</p>
                </div>
              </div>

              {/* Right Column: Inquiry Form */}
              <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-display font-black text-brand-blue uppercase mb-2">Send Inquiry</h3>
                <p className="text-slate-500 mb-8">
                  Fill in the layout form below to outline your project scope. This will also connect you directly to our WhatsApp consultant line.
                </p>

                {formSubmitted ? (
                  <div className="p-8 md:p-10 bg-slate-900 text-white rounded-3xl border border-slate-800 text-center shadow-xl">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl mx-auto flex items-center justify-center mb-5 text-emerald-400">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-xs font-black uppercase tracking-widest rounded-full mb-3">
                      Ticket Raised & Registered
                    </span>
                    <h4 className="text-2xl font-display font-black text-white uppercase tracking-tight">Support Ticket Generated!</h4>
                    
                    <div className="my-6 p-4 bg-slate-800/90 rounded-2xl border border-slate-700 max-w-sm mx-auto flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Your Ticket Reference</p>
                        <p className="text-xl font-mono font-black text-emerald-400">{submittedTicketId || 'TK-CONFIRMED'}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (submittedTicketId) {
                            navigator.clipboard.writeText(submittedTicketId);
                            setCopiedTicket(true);
                            setTimeout(() => setCopiedTicket(false), 2000);
                          }
                        }}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                      >
                        {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedTicket ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                      Your inquiry has been logged in our factory system and an alert has been dispatched to our support desk (<span className="text-white font-semibold">feminiholdings@gmail.com</span>). Our team is also ready on WhatsApp.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <button 
                        onClick={() => {
                          const formatMsg = `*SUPPORT TICKET [${submittedTicketId}]*\n\nHello Tewaw Enterprise, I just submitted support ticket #${submittedTicketId}. Following up here on WhatsApp.`;
                          const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(formatMsg)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" /> Open Chat on WhatsApp
                      </button>
                      <button 
                        onClick={() => setFormSubmitted(false)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Name *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                          placeholder="e.g. Jane Mwangi"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Email *</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone / WhatsApp Number</label>
                        <input 
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                          placeholder="+254 755 000 000"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company / School / Org</label>
                        <input 
                          type="text"
                          value={formData.company}
                          onChange={e => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                          placeholder="e.g. Nairobi Academy / Tech Ltd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inquiry Category *</label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm font-semibold text-slate-800"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Bulk Quotation">Bulk Quotation Request</option>
                          <option value="School Uniforms">School Uniforms</option>
                          <option value="Corporate Workwear">Corporate Workwear & Security</option>
                          <option value="Custom Embroidery & Printing">Custom Embroidery & Screen Print</option>
                          <option value="Order Status & Tracking">Order Status & Tracking</option>
                          <option value="Urgent Delivery">Urgent Rush Order</option>
                          <option value="Factory Visit">Factory Visit / Consultation</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inquiry Subject</label>
                        <input 
                          type="text"
                          value={formData.subject}
                          onChange={e => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                          placeholder="e.g. 500 Pcs Pique Polo Shirts Quote"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Message *</label>
                        <span className="text-[10px] text-brand-blue font-semibold">Raises Ticket in Admin & Dispatches Email</span>
                      </div>
                      <textarea 
                        required
                        rows={5}
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                        placeholder="Please state fabric preference, estimated quantity, delivery timeline, branding requirements..."
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={submittingContact}
                      className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-blue/20 hover:bg-brand-orange transition-all flex items-center justify-center gap-3 border-none text-xs"
                    >
                      {submittingContact ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Ticket className="w-4 h-4 text-emerald-400" />
                          Raise Ticket & Send Message
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Google Map Section */}
            <div className="mt-16">
              <GoogleMapLocation />
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
                        src={item.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={item.name} 
                        loading="lazy" 
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
