import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Mail, Phone, MapPin, ExternalLink, LayoutDashboard, Camera, FileText } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect?: (category: string) => void;
  onOpenQuote?: () => void;
}

export default function Sidebar({ isOpen, onClose, onCategorySelect, onOpenQuote }: SidebarProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleSectionClick = (sectionId: string) => {
    onClose();
    if (location.pathname !== '/') {
      navigate('/');
      // Delay to allow navigation and home page mounting
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
    onClose();
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

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isOpen) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 8000); // 8 seconds of inactivity will auto-close
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetTimer();
      // Added activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetTimer));
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-[100] lg:z-[150]"
          />

          {/* Sidebar Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 sm:left-auto sm:right-0 h-screen w-full sm:w-[85%] sm:max-w-md bg-white z-[110] lg:z-[160] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-brand-light/50">
              <div className="flex flex-col">
                <BrandLogo size="md" />
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-brand-blue hover:text-brand-orange transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Primary Request Quote Action */}
              <button 
                onClick={() => {
                  onClose();
                  if (onOpenQuote) {
                    onOpenQuote();
                  } else {
                    window.open('https://wa.me/254736619688?text=Hello%20Tewaw%2C%20I%20would%20like%20to%20request%20a%20quote%20for%20my%20team.', '_blank');
                  }
                }}
                className="w-full p-4 rounded-3xl bg-gradient-to-r from-brand-green to-[#1E7642] text-white flex items-center justify-between shadow-xl shadow-brand-green/20 border border-brand-green/30 hover:scale-[1.02] active:scale-[0.98] transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">Request Official Quote</p>
                    <p className="text-[10px] text-white/80 font-medium">Instant PDF or WhatsApp pricing</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Admin Access - Only visible if logged in */}
              {user && (
                <div className="bg-brand-blue/5 p-4 rounded-3xl border border-brand-blue/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white">
                         <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-xs font-black text-brand-blue uppercase">Admin Panel</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized Access</p>
                      </div>
                   </div>
                   <Link 
                     to="/admin" 
                     onClick={onClose}
                     className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-brand-blue/20"
                   >
                      Manage
                   </Link>
                </div>
              )}
              {/* Primary Navigation Links */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (location.pathname !== '/') {
                      navigate('/');
                      setTimeout(() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' }), 300);
                    } else {
                      document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="p-3 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all"
                >
                  Products
                </button>
                <Link
                  to="/services"
                  onClick={onClose}
                  className="p-3 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all"
                >
                  Services
                </Link>
                <Link
                  to="/about"
                  onClick={onClose}
                  className="p-3 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={onClose}
                  className="p-3 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all"
                >
                  Contact
                </Link>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Product Catalogue</p>
                {CATEGORIES.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => handleCategoryClick(cat.title)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-orange/30 hover:bg-white transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-blue shadow-sm">
                        <ChevronRight className="w-4 h-4 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <span className="font-bold text-brand-blue">{cat.title}</span>
                    </div>
                  </button>
                ))}

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-2 mb-2">Specialized Services</p>
                <button 
                  onClick={() => handleCategoryClick('Embroidery')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-orange/30 hover:bg-white transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-blue shadow-sm">
                      <ChevronRight className="w-4 h-4 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="font-bold text-brand-blue">Embroidery</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick('Branding')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-orange/30 hover:bg-white transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-blue shadow-sm">
                      <ChevronRight className="w-4 h-4 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="font-bold text-brand-blue">Branding</span>
                  </div>
                </button>
              </div>

              {/* Company Info */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Corporate</p>
                <Link to="/gallery" onClick={onClose} className="flex items-center gap-3 text-slate-600 font-medium hover:text-brand-blue transition-colors p-2">
                  <Camera className="w-4 h-4" /> Gallery Showcase
                </Link>
                <Link 
                  to="/strengths" 
                  onClick={onClose} 
                  className="flex items-center gap-3 text-slate-600 font-medium hover:text-brand-blue transition-colors p-2"
                >
                  <ExternalLink className="w-4 h-4" /> Our Strengths
                </Link>
                <Link 
                  to="/contact" 
                  onClick={onClose} 
                  className="flex items-center gap-3 text-slate-600 font-medium hover:text-brand-blue transition-colors p-2"
                >
                  <Mail className="w-4 h-4" /> Contact Us
                </Link>
              </div>

              {/* Quick Contact */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Support & Orders</p>
                <div className="flex items-center gap-3 text-sm font-bold text-brand-blue">
                  <Phone className="w-4 h-4 text-brand-orange" /> +254 736 619 688
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <Mail className="w-4 h-4 text-brand-blue" /> tewawenterprises@gmail.com
                </div>
              </div>
            </div>

            <div className="p-6 bg-brand-blue text-white rounded-t-[32px] brand-edge-orange">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Ready to start?</p>
              <h4 className="text-lg font-display font-black mb-4">DRESSING TEAMS & INDIVIDUALS</h4>
              <button 
                onClick={() => {
                  onClose();
                  if (onOpenQuote) {
                    onOpenQuote();
                  } else {
                    window.open('https://wa.me/254736619688?text=Hello%20Tewaw%2C%20I%20would%20like%20to%20request%20a%20quote%20for%20my%20team.', '_blank');
                  }
                }}
                className="w-full py-3 bg-brand-orange text-white rounded-xl font-bold text-sm shadow-xl shadow-black/20 border-none hover:bg-white hover:text-brand-blue transition-all"
              >
                Request a Quote
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
