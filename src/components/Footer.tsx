import { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Twitter, Youtube, Music2, Scissors, Camera, Linkedin, ShieldCheck, CheckCircle2, Lock, FileText, Cookie, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../constants';
import { LegalType } from './LegalView';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

interface FooterProps {
  onOpenLegal?: (type: LegalType) => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'subscribed' | 'error'>('idle');

  const handleCategoryClick = (categoryTitle: string) => {
    if (location.pathname !== '/') {
      navigate(`/?category=${encodeURIComponent(categoryTitle)}`);
    } else {
      const element = document.getElementById('catalogue');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      return;
    }
    setNewsletterStatus('subscribed');
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterStatus('idle');
    }, 4000);
  };

  return (
    <footer className="relative bg-white pt-24 pb-32 sm:pb-24 lg:pb-12" id="contact">
      {/* Single Wave Design at the Footer Top Edge */}
      <div className="absolute bottom-full translate-y-[2px] left-0 right-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-[40px] md:h-[72px]"
        >
          <defs>
            <linearGradient id="footer-rainbow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA4335" />
              <stop offset="15%" stopColor="#FBBC05" />
              <stop offset="30%" stopColor="#34A853" />
              <stop offset="50%" stopColor="#0B2C7A" />
              <stop offset="70%" stopColor="#4285F4" />
              <stop offset="85%" stopColor="#8F5FE6" />
              <stop offset="100%" stopColor="#FF1493" />
            </linearGradient>
          </defs>
          
          {/* Rainbow Accent Wave Line */}
          <path 
            d="M0,58 C400,118 800,-2 1200,58" 
            fill="none"
            stroke="url(#footer-rainbow-grad)"
            strokeWidth="6"
            className="opacity-90"
          />
          
          {/* Main Brand Blue Wave Line */}
          <path 
            d="M0,60 C400,120 800,0 1200,60" 
            fill="none"
            stroke="#0B2C7A"
            strokeWidth="3.5"
          />

          {/* White wave body to transition directly into the white footer */}
          <path 
            d="M0,61 C400,121 800,1 1200,61 L1200,120 L0,120 Z" 
            fill="#FFFFFF"
          />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link to="/">
              <BrandLogo size="md" />
            </Link>
            <p className="text-slate-600 leading-relaxed text-sm">
              Weaving Dreams, Stitching Excellence. Elite Kenyan garment manufacturing and custom branding for corporate, security, institutional, and authentic heritage wear.
            </p>
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                Connect On Social
              </span>
              <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 scrollbar-none">
                {[
                  { 
                    icon: Instagram, 
                    gradient: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white hover:shadow-lg hover:shadow-pink-500/30', 
                    label: 'Instagram (@tewaw_enterprises)',
                    href: 'https://www.instagram.com/tewaw_enterprises/'
                  },
                  { 
                    icon: Facebook, 
                    gradient: 'hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-blue-500/30', 
                    label: 'Facebook (@msupa.tess)',
                    href: 'https://www.facebook.com/msupa.tess'
                  },
                  { 
                    icon: ({ className }: { className?: string }) => (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ), 
                    gradient: 'hover:bg-black hover:text-white hover:shadow-lg hover:shadow-slate-900/30', 
                    label: 'X',
                    href: 'https://x.com'
                  },
                  { 
                    icon: Music2, 
                    gradient: 'hover:bg-black hover:text-[#00f2fe] hover:shadow-lg hover:shadow-cyan-500/25', 
                    label: 'TikTok',
                    href: 'https://tiktok.com'
                  },
                  { 
                    icon: Youtube, 
                    gradient: 'hover:bg-[#FF0000] hover:text-white hover:shadow-lg hover:shadow-red-500/30', 
                    label: 'YouTube',
                    href: 'https://youtube.com'
                  },
                  { 
                    icon: Linkedin, 
                    gradient: 'hover:bg-[#0A66C2] hover:text-white hover:shadow-lg hover:shadow-sky-600/30', 
                    label: 'LinkedIn',
                    href: 'https://linkedin.com'
                  },
                ].map((social, i) => (
                  <motion.a 
                    key={i}
                    whileHover={{ y: -3, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-500 ${social.gradient} hover:border-transparent transition-all duration-300 shadow-sm relative group`}
                    title={social.label}
                  >
                    <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-brand-blue mb-6 border-l-4 border-brand-orange pl-3 uppercase tracking-wider text-sm">Catalog</h4>
            <ul className="space-y-3">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => handleCategoryClick(cat.title)}
                    className="text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2 group text-left cursor-pointer"
                  >
                    <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-brand-orange group-hover:w-2 transition-all" />
                    {cat.title}
                  </button>
                </li>
              ))}
              <li>
                <Link to="/gallery" className="text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-brand-orange group-hover:w-2 transition-all" />
                  Visual Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-bold text-brand-blue mb-6 border-l-4 border-brand-orange pl-3 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Our Story', path: '/about' },
                { label: 'Our Strengths & Services', path: '/strengths' },
                { label: 'Contact Us', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    to={item.path}
                    className="text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-brand-orange group-hover:w-2 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => window.open('https://wa.me/254736619688?text=' + encodeURIComponent('Hello Tewaw Enterprise, I would like to inquire about a custom garment and uniform production order.'), '_blank')}
                  className="text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2 group cursor-pointer"
                >
                  <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-brand-orange group-hover:w-2 transition-all" />
                  Custom Orders
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="font-display font-bold text-brand-blue mb-6 border-l-4 border-brand-orange pl-3 uppercase tracking-wider text-sm">Stay Updated</h4>
            <p className="text-sm text-slate-500">Subscribe for new catalog reveals and exclusive corporate bulk offers.</p>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@company.co.ke" 
                required
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm font-medium"
              />
              <button 
                type="submit"
                aria-label="Subscribe to newsletter"
                className="absolute right-2 top-2 bottom-2 bg-brand-orange text-white px-3 rounded-lg hover:bg-brand-orange/90 transition-colors shadow-lg shadow-brand-orange/20 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <AnimatePresence>
              {newsletterStatus === 'subscribed' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-xs font-bold text-brand-green flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Thank you! You've been subscribed to catalog updates.
                </motion.div>
              )}
            </AnimatePresence>
            
            <a 
              href="https://share.google/M7dvWHTuFItX3Uhjb" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10 flex items-center gap-3 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all group cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-brand-blue group-hover:text-brand-orange shrink-0 transition-colors" />
              <p className="text-xs text-slate-600 font-medium group-hover:text-brand-blue transition-colors leading-relaxed">
                P.O. Box 13653 - 00400 Jagoo Lane, Tewaw Enterprise Limited, Uhuru Market, Nairobi
              </p>
            </a>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <a href="tel:+254736619688" className="flex items-center gap-4 bg-brand-light p-4 rounded-2xl border-l-4 border-brand-blue hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Call Expert</p>
              <p className="text-sm font-bold text-brand-blue">+254 736 619 688</p>
            </div>
          </a>
          <a href="mailto:tewawenterprises@gmail.com" className="flex items-center gap-4 bg-brand-light p-4 rounded-2xl border-l-4 border-brand-green hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-[#269453]/10 flex items-center justify-center text-brand-green">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Us</p>
              <p className="text-sm font-bold text-brand-blue">tewawenterprises@gmail.com</p>
            </div>
          </a>
          <a 
            href="https://share.google/M7dvWHTuFItX3Uhjb" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-4 bg-brand-light p-4 rounded-2xl border-l-4 border-brand-orange hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visit Us (Google Maps)</p>
              <p className="text-sm font-bold text-brand-blue group-hover:text-brand-orange transition-colors">Jagoo Lane, Uhuru Market, Nairobi</p>
            </div>
          </a>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-6 text-[9px] lg:text-[10px]">
          <p className="font-bold text-slate-400 uppercase tracking-wider text-center md:text-left whitespace-nowrap">
            © {new Date().getFullYear()} TEWAW Enterprises Limited. All Rights Reserved.
          </p>
          <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-2 sm:gap-3 lg:gap-4 font-bold uppercase tracking-wider whitespace-nowrap">
            <Link to="/privacy" className="text-slate-500 hover:text-brand-blue transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/terms" className="text-slate-500 hover:text-brand-blue transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/cookies" className="text-slate-500 hover:text-brand-blue transition-colors">
              Cookies
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/security" className="text-slate-500 hover:text-brand-blue transition-colors">
              Security
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/compliance" className="text-slate-500 hover:text-brand-blue transition-colors">
              Compliance
            </Link>
            <span className="text-slate-300">•</span>
            <Link 
              to="/admin" 
              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-brand-blue text-slate-500 hover:text-white inline-flex items-center justify-center transition-all group shadow-xs shrink-0" 
              title="Admin Portal"
              aria-label="Admin Portal"
            >
              <ShieldCheck className="w-3 h-3 text-brand-orange group-hover:text-white transition-colors" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Powered by</span>
            <a 
              href="https://urbantechdev.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-brand-blue hover:text-brand-orange transition-colors uppercase tracking-wider underline underline-offset-2"
            >
              urbantechdev
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
