import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingBag, Phone, LayoutGrid, MessageCircle, Mail, X, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav({ onOpenCart, cartCount }: { onOpenCart: () => void, cartCount: number }) {
  const [activeTab, setActiveTab] = useState('home');
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));
  }, []);

  const navItemsLeft = [
    { id: 'home', label: 'Home', icon: Home, onClick: () => {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } },
    { id: 'categories', label: 'Catalog', icon: LayoutGrid, onClick: () => {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
      }
    } },
  ];

  const navItemsRight = [
    { 
      id: 'cart', 
      label: 'Cart', 
      icon: ShoppingBag, 
      isCart: true, 
      onClick: () => onOpenCart() 
    },
    { id: 'contact', label: 'Contact', icon: Phone, onClick: () => navigate('/contact') },
  ];

  // Simple scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'categories', 'strengths', 'contact'];
      let current = 'home';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            current = section === 'strengths' ? 'categories' : section;
          }
        }
      }
      setActiveTab(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full z-[400]">
      {/* Inquiry Popup */}
      <AnimatePresence>
        {isInquiryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInquiryOpen(false)}
              className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-[1001]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-xl bg-white rounded-t-[32px] md:rounded-3xl md:mb-8 p-8 pb-12 md:pb-8 z-[1002] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-brand-blue uppercase tracking-tight">Need Help?</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Speak with our experts</p>
                </div>
                <button 
                  onClick={() => setIsInquiryOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-brand-orange hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <a 
                  href={`https://wa.me/${settings?.whatsappNumber?.replace(/[^\d]/g, '') || '254736619688'}?text=${encodeURIComponent('Hello Tewaw Enterprise, I would like to inquire about bulk garment manufacturing and DTF printing/branding.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-3xl bg-[#269453]/10 border-2 border-[#269453]/20 hover:border-brand-green transition-all group"
                >
                  <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-green/30 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">WhatsApp</span>
                </a>

                <a 
                  href={`mailto:${settings?.email || 'sales@tewaw.com'}`}
                  className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-3xl bg-blue-50 border-2 border-blue-100 hover:border-brand-blue transition-all group"
                >
                  <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/30 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Send Email</span>
                </a>
              </div>

              {/* Inquiry prompt note */}
              <p className="mt-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Typically responds within 1 hour
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="relative bg-white/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(15,23,42,0.1)] flex justify-between items-center px-4 sm:px-8 md:px-12 lg:px-16 pt-3.5 pb-10 sm:pb-8 md:pb-6 pb-[calc(2.25rem+env(safe-area-inset-bottom,0px))]"
      >
        {/* Single Wave Curved Top Edge SVG */}
        <div className="absolute bottom-full left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10 -mb-[1px]">
          <svg 
            viewBox="0 0 1440 32" 
            preserveAspectRatio="none" 
            className="w-full h-6 sm:h-8 block drop-shadow-sm"
          >
            <defs>
              <linearGradient id="bottomnav-wave-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1B365D" /> {/* brand-blue */}
                <stop offset="45%" stopColor="#269453" /> {/* brand-green */}
                <stop offset="100%" stopColor="#1E7642" /> {/* brand-green */}
              </linearGradient>
            </defs>

            {/* Main single wave fill connected seamlessly to the bottom nav background */}
            <path 
              d="M 0,32 L 0,16 C 360,32 1080,0 1440,14 L 1440,32 Z" 
              className="fill-white/95"
            />

            {/* Elegant single wave top curved accent line */}
            <path 
              d="M 0,16 C 360,32 1080,0 1440,14" 
              fill="none" 
              stroke="url(#bottomnav-wave-stroke)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              className="opacity-90"
            />
          </svg>
        </div>
        {/* Left items */}
        <div className="flex gap-6 md:gap-12 lg:gap-16">
          {navItemsLeft.map((item) => (
            <NavItem key={item.id} item={item} activeTab={activeTab} setActiveTab={setActiveTab} cartCount={0} />
          ))}
        </div>

        {/* Center Inquiry Button */}
        <div className="absolute left-1/2 -top-7 -translate-x-1/2 flex flex-col items-center gap-1.5 z-30">
          <motion.button 
            onClick={() => setIsInquiryOpen(true)}
            animate={{ 
              y: [0, -4, 0],
              boxShadow: [
                '0 10px 25px -5px rgba(27, 54, 93, 0.4), 0 0 15px rgba(2, 61, 23, 0.3)',
                '0 18px 35px -5px rgba(2, 61, 23, 0.6), 0 0 25px rgba(2, 61, 23, 0.6)',
                '0 10px 25px -5px rgba(27, 54, 93, 0.4), 0 0 15px rgba(2, 61, 23, 0.3)'
              ]
            }}
            transition={{ 
              duration: 2.8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            whileHover={{ scale: 1.15, y: -6 }}
            whileTap={{ scale: 0.92 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-brand-blue rounded-3xl flex items-center justify-center text-white border-4 border-white brand-glow-blue cursor-pointer relative overflow-hidden group"
          >
            {/* Shimmer overlay effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
              animate={{ x: ['-150%', '150%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
            />

            <motion.div
              animate={{ rotate: [0, 6, 0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Send className="w-8 h-8 md:w-10 md:h-10 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.div>
          </motion.button>
          <motion.span 
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] font-black text-brand-blue uppercase tracking-widest bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md border border-slate-100"
          >
            Inquire
          </motion.span>
        </div>

        {/* Right items */}
        <div className="flex gap-6 md:gap-12 lg:gap-16">
          {navItemsRight.map((item) => (
            <NavItem key={item.id} item={item} activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function NavItem({ item, activeTab, setActiveTab, cartCount }: any) {
  const Icon = item.icon;
  const isActive = activeTab === item.id;
  
  return (
    <a
      href={item.href || '#'}
      onClick={(e) => {
        if (item.onClick) {
          e.preventDefault();
          item.onClick();
        } else {
          setActiveTab(item.id);
        }
      }}
      className="relative flex flex-col items-center gap-1.5 min-w-[50px]"
    >
      <div 
        className={cn(
          "relative transition-all duration-300",
          isActive ? "text-brand-green scale-110" : "text-slate-400"
        )}
      >
        <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
        {item.isCart && cartCount > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[18px] h-4.5 px-1 bg-brand-green text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {cartCount}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-wider transition-all",
        isActive ? "text-brand-green" : "text-slate-400"
      )}>
        {item.label}
      </span>
    </a>
  );
}
