import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { 
  Lock, 
  Shield, 
  Eye, 
  Database, 
  FileCheck, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Layers, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Scale, 
  Truck, 
  Cookie as CookieIcon,
  Sparkles,
  Maximize2,
  Minimize2,
  Users,
  CreditCard
} from 'lucide-react';
import { CartItem } from './Home';

interface PolicySection {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  summary: string;
  icon: any;
  content: React.ReactNode;
}

export default function PrivacyPolicy() {
  const [cart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // State to track which accordions are open. By default, open the first 2 sections.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'intro': true,
    'data-collected': true,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    SECTIONS.forEach(s => { allOpen[s.id] = true; });
    setOpenSections(allOpen);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const scrollToAndOpen = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -120;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  const SECTIONS: PolicySection[] = [
    {
      id: 'intro',
      badge: 'Section 1 • Governance',
      badgeColor: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
      title: '1. Introduction, Legal Identity & Statutory Scope',
      summary: 'Corporate details, manufacturing premises, and regulatory alignment under the Kenya Data Protection Act 2019.',
      icon: Scale,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Welcome to <strong>TEWAW Enterprises Limited</strong> ("TEWAW", "we", "our", or "us"), an elite Kenyan garment manufacturing enterprise incorporated under the Companies Act of the Republic of Kenya. Our primary manufacturing facility, administrative offices, and sample design studios are situated at:
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
            <p className="font-bold text-brand-blue flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-orange shrink-0" /> Factory & Registered Headquarters:
            </p>
            <p className="pl-6">Jagoo Lane, Tewaw Enterprise Limited, Uhuru Market, Nairobi, Kenya</p>
            <p className="pl-6">Postal Address: P.O. Box 13653 - 00400 Nairobi, Kenya</p>
            <p className="pl-6">Official Inquiries: <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">tewawenterprises@gmail.com</a> | <a href="tel:+254736619688" className="text-brand-blue font-bold hover:underline">+254 736 619 688</a></p>
          </div>
          <p>
            This Privacy Policy governs the collection, digitization, storage, and processing of personal data, corporate logos, embroidery vector artwork (DST/PES), school rosters, and body measurements provided via our web platform (<strong>tewaw.com</strong>), WhatsApp business channels, phone inquiries, and in-person factory visits.
          </p>
          <div className="p-4 bg-brand-blue/5 rounded-2xl border-l-4 border-brand-blue text-xs text-slate-700 space-y-1">
            <p className="font-bold text-brand-blue uppercase tracking-wider">Statutory Compliance Statement:</p>
            <p>
              TEWAW operates in strict conformity with the <strong>Kenya Data Protection Act (No. 24 of 2019)</strong>, the <strong>Data Protection (General) Regulations 2021</strong>, and guidelines issued by the Office of the Data Protection Commissioner (ODPC).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'data-collected',
      badge: 'Section 2 • Collection',
      badgeColor: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
      title: '2. Information We Collect & Sizing Data Processing',
      summary: 'Categories of personal, institutional, and garment production data gathered for custom manufacturing.',
      icon: Database,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            To fabricate customized uniforms, supply bulk workwear, generate official quotation schedules, and dispatch parcels across Kenya and East Africa, we collect specific categories of data:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-brand-blue text-xs uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green" /> Direct Client & Entity Details
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Individual contact name or institutional representative</li>
                <li>Corporate / school / organization name</li>
                <li>Direct phone number for order verification & WhatsApp dispatch updates</li>
                <li>Official email address for digital quotes & eTIMS receipts</li>
                <li>Physical delivery address, county, town, and postal code</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-brand-blue text-xs uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Technical Garment & Sizing Data
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Sizing rosters (collar, chest, waist, inseam, height)</li>
                <li>Vector logo artwork (AI, EPS, PDF, high-res PNG)</li>
                <li>Digitized embroidery pattern files (.DST, .PES, .EMB)</li>
                <li>Pantone fabric color codes and reactive dye specifications</li>
                <li>Reflective tape placements & security badge alignments</li>
              </ul>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" /> Protection of Student & Minor Measurement Rosters:
            </p>
            <p>
              When schools or sports academies provide uniform sizing rosters for minors under 18 years, data is processed solely for garment fabrication without retaining student identity records in public systems. Rosters are purged following seasonal supply completion.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'purpose',
      badge: 'Section 3 • Lawful Basis',
      badgeColor: 'bg-brand-green/10 text-brand-green border-brand-green/20',
      title: '3. Purpose & Lawful Basis for Processing (Section 30 KDPA)',
      summary: 'Contractual performance, KRA tax compliance, quality verification, and legitimate manufacturing interests.',
      icon: FileCheck,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Under Section 30 of the Kenya Data Protection Act 2019, TEWAW only processes your personal and corporate information where a legitimate, statutory legal basis exists:
          </p>
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="font-bold text-brand-blue uppercase tracking-wider shrink-0 min-w-[170px]">Contractual Fulfillment:</span>
              <span className="text-slate-600">To calculate bespoke fabric yardage, digitize logos, cut & stitch garments, package, generate courier manifests, and fulfill purchase orders.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="font-bold text-brand-blue uppercase tracking-wider shrink-0 min-w-[170px]">Tax & Regulatory Compliance:</span>
              <span className="text-slate-600">To satisfy Kenya Revenue Authority (KRA) e-TIMS electronic tax invoicing, maintain accounting books, and adhere to KEBS uniform safety standards.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="font-bold text-brand-blue uppercase tracking-wider shrink-0 min-w-[170px]">Legitimate Business Interest:</span>
              <span className="text-slate-600">To provide prompt customer support via WhatsApp, verify anti-fraud M-Pesa transaction reference codes, and maintain repeatable stitching accuracy for client re-orders.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'custom-designs',
      badge: 'Section 4 • Intellectual Property',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: '4. Corporate Logos, Embroidery DST Files & IP Protection',
      summary: 'Strict confidentiality agreements safeguarding client branding, tactical emblems, and custom artwork.',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            We recognize that institutional crests, military-style tactical patches, security agency badges, and brand logos represent proprietary intellectual property:
          </p>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-blue">Strict Non-Disclosure & Non-Replication:</strong>
                <p className="text-slate-600 mt-0.5">Digitized stitch files and high-resolution vector artwork submitted by your organization will never be sold, leased, or repurposed for any other customer.</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-blue">Tactical & Security Guard Regalia Control:</strong>
                <p className="text-slate-600 mt-0.5">Private security uniforms and specialized insignia are produced strictly with verified authorization letters on official corporate letterheads to prevent unauthorized uniform duplication.</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-blue">Public Gallery Showcase Consent:</strong>
                <p className="text-slate-600 mt-0.5">Photographs of finished uniforms are only showcased on our public website or social media portfolios with prior verbal or written consent from the commissioning client.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'storage-security',
      badge: 'Section 5 • Cybersecurity',
      badgeColor: 'bg-blue-50 text-brand-blue border-blue-200',
      title: '5. Data Sovereignty, Cloud Security & Payment Integrity',
      summary: 'Multi-factor authentication, SSL encryption, M-Pesa transaction safety, and role-based access.',
      icon: Lock,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            TEWAW implements comprehensive administrative, physical, and technological controls to safeguard client data against accidental loss, unauthorized alteration, or cyber exposure:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <Lock className="w-4 h-4 text-brand-orange" />
              <p className="font-bold text-brand-blue">SSL & Cloud Encryption</p>
              <p className="text-slate-500">All web traffic and database entries are encrypted with TLS 1.3 / AES-256 standards.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <CreditCard className="w-4 h-4 text-brand-green" />
              <p className="font-bold text-brand-blue">M-Pesa Payment Security</p>
              <p className="text-slate-500">Direct Paybill and bank transactions are processed via Safaricom; no credit card numbers or PINs are stored.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <p className="font-bold text-brand-blue">Role-Based Factory Access</p>
              <p className="text-slate-500">Order rosters are restricted to authorized production managers with 2-Factor Authentication.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'third-parties',
      badge: 'Section 6 • Disclosures',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: '6. Third-Party Disclosures & Countrywide Logistics',
      summary: 'Vetted courier couriers (Fargo, G4S, Speedaf), communication APIs, and zero data selling guarantee.',
      icon: Truck,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>We do not sell, rent, or trade your personal or corporate data to advertisers.</strong> We only share minimal necessary information with vetted logistics and infrastructure providers strictly to execute orders:
          </p>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <li><strong>Licensed Freight & Parcel Couriers:</strong> Delivery names, physical addresses, and contact numbers are provided to partners (e.g., Fargo Courier, G4S Secure Logistics, Speedaf, Sendy, Easy Coach Parcels) to dispatch cartons.</li>
            <li><strong>Official WhatsApp / Meta Business API:</strong> Used solely to send real-time quote approvals, sample photographs, tracking waybills, and delivery notifications.</li>
            <li><strong>Government Authorities & Law Enforcement:</strong> Strictly when mandated under valid Kenyan court orders or statutory subpoenas from the Office of the Data Protection Commissioner.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'cookies-tracking',
      badge: 'Section 7 • Cache & Cookies',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: '7. Cookies, Local Storage & Offline PWA Cache',
      summary: 'Essential cart storage, catalog color preferences, and progressive web application caching.',
      icon: CookieIcon,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Our web application uses modern browser LocalStorage and essential session tokens to enhance your browsing and ordering experience:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue">Catalog Cart State (LocalStorage)</p>
              <p className="text-slate-500 mt-1">Saves selected apparel items, quantities, and branding preferences so you don't lose your quote draft when navigating.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue">PWA Service Worker Cache</p>
              <p className="text-slate-500 mt-1">Caches product imagery and stylesheets locally to allow instant loading even under spotty mobile network conditions.</p>
            </div>
          </div>
          <p className="text-xs">
            For more details on cookie categories and opt-out preferences, please consult our dedicated <a href="/cookies" className="text-brand-orange font-bold hover:underline">Cookie Policy</a>.
          </p>
        </div>
      )
    },
    {
      id: 'data-rights',
      badge: 'Section 8 • Statutory Rights',
      badgeColor: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
      title: '8. Your Rights Under the Kenya Data Protection Act 2019',
      summary: 'Right to access, rectify, delete, object, and withdraw consent under Section 26 of the Act.',
      icon: Scale,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            As a data subject in Kenya, Section 26 of the Data Protection Act guarantees you specific statutory rights:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" /> Right to Access
              </p>
              <p className="text-slate-500 mt-1">Request a copy of your stored contact history, measurement rosters, or invoice records.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" /> Right to Rectification
              </p>
              <p className="text-slate-500 mt-1">Update or correct inaccurate phone numbers, company names, or delivery addresses.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" /> Right to Erasure ("To Be Forgotten")
              </p>
              <p className="text-slate-500 mt-1">Request deletion of old sizing charts or artwork files once production contracts conclude.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-brand-blue flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" /> Right to Object & Opt-Out
              </p>
              <p className="text-slate-500 mt-1">Opt out of marketing WhatsApp broadcasts or seasonal textile catalogs with one click.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            * Data subject access requests (DSAR) are fulfilled free of charge within 21 business days upon identity verification.
          </p>
        </div>
      )
    },
    {
      id: 'retention',
      badge: 'Section 9 • Data Lifecycle',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      title: '9. Data Retention Schedules & Secure Erasure',
      summary: '7-year statutory tax compliance retention, 12-month quote lifecycle, and secure cryptographic wiping.',
      icon: Clock,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            We retain information only as long as necessary for manufacturing, statutory tax compliance, and client re-order convenience:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-brand-blue">Active Production Orders & Invoices:</span>
              <span className="text-slate-600 font-semibold">7 Years (KRA e-TIMS Tax Audits)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-brand-blue">Digitized Embroidery (DST) Files:</span>
              <span className="text-slate-600 font-semibold">Retained for lifetime client re-orders (or deleted upon written request)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-brand-blue">Unfulfilled Sample Quotes & Inquiries:</span>
              <span className="text-slate-600 font-semibold">Purged automatically after 12 months</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contact-dpo',
      badge: 'Section 10 • Compliance Desk',
      badgeColor: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
      title: '10. Contact Our Data Protection Officer (DPO)',
      summary: 'Direct contacts for privacy inquiries, legal notices, and statutory access requests.',
      icon: Shield,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            If you have questions regarding this Privacy Policy, wish to exercise your statutory data rights, or need assistance regarding your customized uniform data, please contact our Compliance Desk:
          </p>
          <div className="p-5 bg-gradient-to-br from-brand-blue to-slate-900 text-white rounded-2xl shadow-md space-y-3">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Official Data Protection Officer
            </div>
            <div className="text-xs space-y-1.5 text-slate-200">
              <p><strong>Entity:</strong> TEWAW Enterprises Limited</p>
              <p><strong>Department:</strong> Legal & Data Privacy Compliance Desk</p>
              <p><strong>Physical Address:</strong> Jagoo Lane, Tewaw Enterprise Limited, Uhuru Market, Nairobi, Kenya</p>
              <p><strong>Postal Address:</strong> P.O. Box 13653 - 00400 Nairobi, Kenya</p>
              <p className="flex items-center gap-2 pt-1">
                <Mail className="w-3.5 h-3.5 text-brand-orange" />
                <span>Email:</span>
                <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">
                  tewawenterprises@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-green" />
                <span>Direct Hotline:</span>
                <a href="tel:+254736619688" className="text-brand-light font-bold hover:underline">
                  +254 736 619 688
                </a>
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            If you are not satisfied with our response, you also have the statutory right to lodge a complaint with the Office of the Data Protection Commissioner of Kenya (ODPC) at <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline">www.odpc.go.ke</a>.
          </p>
        </div>
      )
    }
  ];

  // Filter sections based on search query
  const filteredSections = SECTIONS.filter(sec => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Privacy Policy | Tewaw Enterprise Kenya"
        description="Official Privacy Policy of Tewaw Enterprise Limited. We protect customer contact details, custom uniform designs, and order data under the Kenya Data Protection Act 2019."
        canonical="https://tewaw.com/privacy"
      />
      <GlassyBackground />
      <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onOpenCart={() => {}} />
      <BottomNav onOpenCart={() => {}} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-24">
        <LegalHeader
          title="Privacy Policy"
          subtitle="Committed to protecting your personal information, corporate vector designs, and garment manufacturing data under the Kenya Data Protection Act (2019)."
          badge="Data Protection & Privacy"
          lastUpdated="August 15, 2026"
          icon={Lock}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Quick Controls Bar: Search & Expand/Collapse */}
          <div className="mb-8 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Live Search */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search privacy topics (e.g. logos, M-Pesa, DST files)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Expand / Collapse All Controls */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <span className="text-xs text-slate-400 hidden sm:inline-block font-semibold">
                {filteredSections.length} Sections
              </span>
              <button
                type="button"
                onClick={expandAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 border border-brand-blue/20 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive Table of Contents */}
            <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-orange" />
                    <h3 className="font-display font-black text-brand-blue uppercase text-xs tracking-wider">Quick Navigation</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                    10 Clauses
                  </span>
                </div>
                <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {SECTIONS.map((sec) => {
                    const isOpen = !!openSections[sec.id];
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToAndOpen(sec.id)}
                        className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                          isOpen
                            ? 'bg-brand-blue/10 text-brand-blue font-black'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-brand-blue'
                        }`}
                      >
                        <span className="truncate">{sec.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Privacy Support Card */}
              <div className="bg-gradient-to-br from-brand-blue to-[#071e56] text-white p-6 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-sm">Need Privacy Assistance?</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Have inquiries regarding vector logo confidentiality or wish to submit a data erasure request?
                </p>
                <div className="pt-2 text-xs space-y-2 text-slate-200">
                  <a 
                    href="mailto:tewawenterprises@gmail.com" 
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                    <span className="truncate">tewawenterprises@gmail.com</span>
                  </a>
                  <a 
                    href="tel:+254736619688" 
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>+254 736 619 688</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Collapsible Accordion Cards */}
            <div className="lg:col-span-8 space-y-4">
              {filteredSections.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <AlertCircle className="w-8 h-8 text-brand-orange mx-auto" />
                  <h3 className="font-bold text-brand-blue text-base">No Matching Policy Clauses</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No clauses matched your query "{searchQuery}". Try searching for keywords like "embroidery", "M-Pesa", "courier", or "retention".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                filteredSections.map((section) => {
                  const isOpen = !!openSections[section.id];
                  const SectionIcon = section.icon;

                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                        isOpen 
                          ? 'border-brand-blue/30 shadow-md ring-1 ring-brand-blue/10' 
                          : 'border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* Accordion Header / Trigger Button */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 select-none focus:outline-none"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            isOpen ? 'bg-brand-blue text-white shadow-md' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <SectionIcon className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${section.badgeColor}`}>
                                {section.badge}
                              </span>
                            </div>
                            <h2 className="text-base sm:text-lg font-display font-black text-brand-blue uppercase tracking-tight leading-snug">
                              {section.title}
                            </h2>
                            {!isOpen && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {section.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors hidden sm:inline-block ${
                            isOpen ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isOpen ? 'Collapse' : 'Expand'}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                              isOpen ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </button>

                      {/* Accordion Body Content */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-2 border-t border-slate-100">
                              {section.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer onOpenLegal={() => {}} />
    </div>
  );
}
