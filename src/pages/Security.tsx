import { useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { Shield, ShieldCheck, Lock, Factory, CheckCircle2, ChevronRight, EyeOff, FileText, Scale } from 'lucide-react';
import { CartItem } from './Home';

export default function Security() {
  const [cart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeSection, setActiveSection] = useState<string>('design-ip');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const SECTIONS = [
    { id: 'design-ip', title: '1. Design IP & Logo Confidentiality' },
    { id: 'security-uniforms', title: '2. Security Force & Guard Uniform Controls' },
    { id: 'facility-security', title: '3. Physical Factory Security at Jagoo Lane' },
    { id: 'cloud-infrastructure', title: '4. Digital Infrastructure & Cloud Protocols' },
    { id: 'transaction-integrity', title: '5. Financial Transaction Integrity' },
    { id: 'incident-response', title: '6. Incident Response & Vulnerability Reporting' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Security Standards & Design Protection | Tewaw Enterprise"
        description="Comprehensive security protocols at Tewaw Enterprise: corporate uniform design protection, physical workshop security at Jagoo Lane Nairobi, and secure cloud operations."
        canonical="https://tewaw.com/security"
      />
      <GlassyBackground />
      <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onOpenCart={() => {}} />
      <BottomNav onOpenCart={() => {}} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-24">
        <LegalHeader
          title="Security Standards"
          subtitle="Rigorous physical and digital security protocols protecting client corporate brand assets, tactical uniform designs, and transaction integrity."
          badge="Security & IP Protection"
          lastUpdated="August 14, 2026"
          icon={ShieldCheck}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Sticky Table of Contents */}
            <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-brand-orange" />
                  <h3 className="font-display font-black text-brand-blue uppercase text-xs tracking-wider">Security Topics</h3>
                </div>
                <nav className="space-y-1">
                  {SECTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        activeSection === sec.id
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-brand-blue'
                      }`}
                    >
                      <span className="truncate">{sec.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeSection === sec.id ? 'text-brand-orange' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </nav>
              </div>

              {/* Security Shield Card */}
              <div className="bg-brand-blue text-white p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-sm">Design Non-Disclosure</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We sign formal bilateral Non-Disclosure Agreements (NDAs) with corporate institutions, government bodies, and security agencies upon request.
                </p>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Section 1 */}
              <section id="design-ip" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 1
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  1. Design IP & Logo Confidentiality
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Every company brand logo, school badge, or institutional insignia entrusted to TEWAW Enterprises is treated as strictly confidential intellectual property.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-brand-blue flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green" /> Digitized Pattern Isolation:
                  </p>
                  <p className="text-slate-600">
                    Embroidery stitch files (.DST, .PES, .EMB) and DTF digital print films created for a client are stored in isolated encrypted directories. They are never repurposed, shared, or adapted for third-party orders without explicit written authorization.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="security-uniforms" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 2
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  2. Security Force & Guard Uniform Controls
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Given the sensitive nature of security firm uniforms, tactical combat shirts, and registered guard apparel:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Verification of Authority:</strong> Uniform orders bearing registered security company logos or badges are only processed after verifying official company registration (CR12) and authorization letters.</li>
                  <li><strong>Scrap Disposal Control:</strong> Defective branded cutouts and misprints are shredded under supervision to prevent unauthorized garment distribution.</li>
                  <li><strong>Serial Dispatch Tracking:</strong> High-security tactical apparel batches are logged with serial dispatch numbers.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="facility-security" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 3
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  3. Physical Factory Security at Jagoo Lane
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our garment manufacturing premises at Jagoo Lane, Uhuru Market, Nairobi are maintained under robust physical security protocols:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue">24/7 Monitored Access</p>
                    <p className="text-slate-600">Access to raw fabric rolls, embroidery machines, and client finished goods storage is strictly controlled.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue">Fire & Safety Audits</p>
                    <p className="text-slate-600">Regular fire suppression maintenance and textile dust mitigation protecting workers and client inventory.</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="cloud-infrastructure" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 4
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  4. Digital Infrastructure & Cloud Protocols
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our web application runs on enterprise-grade Google Cloud container infrastructure with HTTPS TLS 1.3 encryption in transit and AES-256 encryption at rest.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Database access rules strictly isolate client quotes and customer records, preventing unauthorized reading or enumeration by unauthenticated web users.
                </p>
              </section>

              {/* Section 5 */}
              <section id="transaction-integrity" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 5
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  5. Financial Transaction Integrity
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We process payments strictly through verified Kenyan commercial banking and registered Safaricom M-PESA Buy Goods / Paybill merchant channels.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We never store debit/credit card numbers or banking PINs on our servers. All financial receipts are issued with official KRA-compliant documentation.
                </p>
              </section>

              {/* Section 6 */}
              <section id="incident-response" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 6
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  6. Incident Response & Vulnerability Reporting
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  If you discover any vulnerability or security concern on our platform, please report it immediately to our security response team:
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p><strong>Security Operations:</strong> <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">tewawenterprises@gmail.com</a></p>
                  <p><strong>Emergency Hotline:</strong> <strong>+254 736 619 688</strong></p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer onOpenLegal={() => {}} />
    </div>
  );
}
