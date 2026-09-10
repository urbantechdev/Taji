import { useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { Award, CheckCircle2, ChevronRight, Leaf, Users, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { CartItem } from './Home';

export default function Compliance() {
  const [cart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeSection, setActiveSection] = useState<string>('kebs-standards');

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
    { id: 'kebs-standards', title: '1. KEBS Standards & Textile Quality' },
    { id: 'fair-labor', title: '2. Fair Wages & Ethical Labor in Nairobi' },
    { id: 'environmental', title: '3. Environmental Stewardship & Scrap Recycling' },
    { id: 'made-in-kenya', title: '4. Buy Kenya Build Kenya & Local Sourcing' },
    { id: 'health-safety', title: '5. Occupational Health & Factory Safety' },
    { id: 'whistleblower', title: '6. Ethics & Compliance Reporting' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Compliance & Ethical Standards | Tewaw Enterprise Kenya"
        description="Learn about Tewaw Enterprise's commitment to KEBS textile compliance, fair artisan wages in Nairobi, fabric recycling, and Buy Kenya Build Kenya value addition."
        canonical="https://tewaw.com/compliance"
      />
      <GlassyBackground />
      <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onOpenCart={() => {}} />
      <BottomNav onOpenCart={() => {}} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-24">
        <LegalHeader
          title="Compliance & Ethics"
          subtitle="Adherence to Kenya Bureau of Standards (KEBS) textile benchmarks, fair artisan wages, safe working conditions, and sustainable apparel manufacturing."
          badge="Ethical Manufacturing"
          lastUpdated="August 14, 2026"
          icon={Award}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Sticky Table of Contents */}
            <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Award className="w-4 h-4 text-brand-orange" />
                  <h3 className="font-display font-black text-brand-blue uppercase text-xs tracking-wider">Compliance Topics</h3>
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

              {/* Made in Kenya Card */}
              <div className="bg-brand-green/10 border border-brand-green/20 p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-brand-green" />
                  <h4 className="font-bold text-sm text-brand-blue">Buy Kenya Build Kenya</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  100% of our garment cutting, tailoring, and precision embroidery is conducted locally in Nairobi by skilled Kenyan textile professionals.
                </p>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Section 1 */}
              <section id="kebs-standards" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 1
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  1. KEBS Standards & Textile Quality
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  TEWAW Enterprises sources raw cotton yarns, polyester blends, heavy drill, and ripstop fabrics that comply with <strong>Kenya Bureau of Standards (KEBS)</strong> specifications:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue">KS 08-662: Cotton & Blended Fabrics</p>
                    <p className="text-slate-600">Strict yarn tensile strength, seam bursting thresholds, and shrinkage tolerances under 3% after washing.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue">KS ISO 105: Color Fastness Benchmarks</p>
                    <p className="text-slate-600">Reactive fabric dyeing rated grade 4-5 against laundry washing, sunlight fading, and perspiration rubbing.</p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="fair-labor" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 2
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  2. Fair Wages & Ethical Labor in Nairobi
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We believe that elite apparel begins with valued craftspeople. Our workforce policies strictly conform to the <strong>Employment Act (2007)</strong> of Kenya:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Above-Minimum Living Wages:</strong> Our tailors, cutters, and embroidery operators receive compensation above national statutory minimums.</li>
                  <li><strong>Zero Child or Forced Labor:</strong> Strict age verification protocols; absolute prohibition of child labor or exploitative subcontracting.</li>
                  <li><strong>Statutory Remittances:</strong> Timely contributions to NSSF (National Social Security Fund) and SHA (Social Health Authority) for employee medical coverage.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="environmental" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 3
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  3. Environmental Stewardship & Scrap Recycling
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Textile manufacturing must be responsible. We actively minimize manufacturing footprint at our Nairobi workshop:
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-brand-green flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-brand-green" /> Fabric Offcut Upcycling:
                  </p>
                  <p className="text-slate-600">
                    Textile offcuts from our cutting tables are sorted and repurposed into durable shopping tote bags, insulation stuffing, or supplied to local artisan upcyclers rather than reaching municipal landfills.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="made-in-kenya" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 4
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  4. Buy Kenya Build Kenya & Local Sourcing
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We proudly champion the <em>"Buy Kenya, Build Kenya"</em> economic strategy. By centralizing our full supply chain—from pattern digitization and fabric cutting to high-speed computerized embroidery and pressing—we generate sustainable manufacturing jobs and stimulate local economic resilience in Nairobi.
                </p>
              </section>

              {/* Section 5 */}
              <section id="health-safety" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 5
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  5. Occupational Health & Factory Safety
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our facility adheres to the <strong>Occupational Safety and Health Act (OSHA 2007)</strong> of Kenya:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-brand-blue">Ergonomic Workstations</p>
                    <p className="text-slate-600 mt-1">Adjustable high-efficiency sewing benches and industrial lighting designed to minimize artisan fatigue.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-brand-blue">Safety PPE & Ventilation</p>
                    <p className="text-slate-600 mt-1">Proper lint filters, eye shields on high-speed needle machines, and trained first-aid response.</p>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="whistleblower" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 6
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  6. Ethics & Compliance Inquiries
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  For compliance inquiries, supplier audits, or to request factory tour credentials for institutional tender committees:
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p><strong>Compliance Directorate:</strong> <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">tewawenterprises@gmail.com</a></p>
                  <p><strong>Factory Address:</strong> Jagoo Lane, Tewaw Enterprise Limited, Uhuru Market, Nairobi</p>
                  <p><strong>Official Phone:</strong> <strong>+254 736 619 688</strong></p>
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
