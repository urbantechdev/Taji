import React, { useState } from 'react';
import { CategoryType } from '../../types';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface StorefrontFooterProps {
  onSelectCategory: (category: 'all' | CategoryType) => void;
  onOpenTrackOrder: () => void;
  onOpenContact: () => void;
  onOpenAdminPortal: () => void;
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({
  onSelectCategory,
  onOpenTrackOrder,
  onOpenContact,
  onOpenAdminPortal
}) => {
  const { brandSettings } = useERP();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;
  const brandName = brandSettings?.brandName || 'TAJI';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-[#8C0034] via-[#75002C] to-[#5C0022] text-rose-100 border-t border-rose-900 relative z-20" id="storefront-footer">
      
      {/* Main Elaborate Footer Links Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand Identity & About (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white p-0.5 border border-white/30 shadow-md">
                <img
                  src={displayLogo}
                  alt={brandName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span 
                  className="text-2xl font-black tracking-tight text-white"
                  style={{ fontFamily: "'Audiowide', sans-serif" }}
                >
                  {brandName}
                </span>
                <p className="text-[10px] font-semibold text-rose-300 uppercase tracking-widest">
                  Textile Enterprise
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-100/90 leading-relaxed">
              Taji is Kenya's dedicated textile enterprise providing wholesale &amp; retail supply of structured <strong>Dereck suiting fabrics</strong>, anti-pill <strong>Polar &amp; Coral Fleece</strong> rolls, and 100% High-Bulk <strong>Acrylic &amp; Cotton Knitting Yarns</strong>.
            </p>

            {/* Corporate Tax / Compliance Badges */}
            <div className="p-3 bg-black/25 rounded-xl border border-white/15 text-[11px] font-mono text-rose-200 space-y-1">
              <div className="flex justify-between">
                <span>KRA PIN:</span>
                <span className="text-white font-bold">P051982341Z</span>
              </div>
              <div className="flex justify-between">
                <span>ETR CU Serial:</span>
                <span className="text-white font-bold">KRA-CU-8812930</span>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-white">
                Receive Textile Shipment &amp; Bulk Price Alerts
              </span>
              {isSubscribed ? (
                <div className="p-2.5 bg-black/30 text-emerald-300 border border-emerald-400/50 rounded-xl text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Subscribed! You will receive fabric restock notifications.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/30 border border-white/20 rounded-xl text-xs text-white placeholder-rose-200/60 focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white hover:bg-rose-50 text-[#8C0034] font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2: Categories (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Fabric Categories
            </h4>
            <ul className="space-y-2 text-xs text-rose-100/90">
              <li>
                <button
                  onClick={() => onSelectCategory('Dereck')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Dereck Suiting Weaves</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Dereck')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Blazer &amp; Trouser Weaves</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Fleece')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Anti-Pill Polar Fleece</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Fleece')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Coral Velvet Microfleece</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Yarns')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Acrylic Dyed Yarns 2/28</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Yarns')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Combed Cotton Cones</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Services & Tools (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Services &amp; Inquiries
            </h4>
            <ul className="space-y-2 text-xs text-rose-100/90">
              <li>
                <button
                  onClick={onOpenTrackOrder}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Track Active Order</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenContact}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Nairobi Branch Directory</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/254700111000?text=Hello%20Taji%2C%20I%20need%20a%20wholesale%20quotation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Request Wholesale B2B Quote</span>
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenContact}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-rose-300" />
                  <span>Direct Delivery Support</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Locations (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Head Office &amp; Contact
            </h4>
            
            <div className="space-y-2.5 text-xs text-rose-100/90">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Main Warehouse Hub:</strong><br />
                  Block A1, Industrial Area, Commercial St, Nairobi
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-rose-300 shrink-0" />
                <a href="tel:+254700111000" className="hover:text-white font-mono">
                  +254 700 111 000 / +254 711 000 000
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-rose-300 shrink-0" />
                <a href="mailto:orders@taji.co.ke" className="hover:text-white">
                  orders@taji.co.ke / billing@taji.co.ke
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-rose-200/80">
                <Clock className="w-4 h-4 text-rose-300 shrink-0" />
                <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright & Credit Bar */}
      <div className="border-t border-white/10 bg-black/30 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-rose-200/80">
          
          <div>
            <p>
              &copy; {new Date().getFullYear()} <strong>{brandName} Textile Enterprise</strong>. All Rights Reserved.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://urbantechdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-200 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Powered by <strong>Urbantechdev</strong></span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Discreet Hidden Admin Icon for Staff / ERP Portal */}
            <button
              onClick={onOpenAdminPortal}
              className="opacity-15 hover:opacity-90 text-rose-200 hover:text-amber-300 p-1 rounded-md transition-all cursor-pointer hover:bg-white/10"
              title="Staff Access"
              aria-label="Staff Access"
              id="footer-hidden-admin-icon"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};
