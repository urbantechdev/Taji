import { useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { FileText, ShieldAlert, CheckCircle2, ChevronRight, Scale, AlertTriangle, Truck, Clock, RefreshCw, Layers } from 'lucide-react';
import { CartItem } from './Home';

export default function Terms() {
  const [cart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeSection, setActiveSection] = useState<string>('acceptance');

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
    { id: 'acceptance', title: '1. Agreement to Terms & Scope' },
    { id: 'custom-orders', title: '2. Custom Manufacturing & MOQs' },
    { id: 'artwork-proofs', title: '3. Artwork Approval & Digitization' },
    { id: 'pricing-payment', title: '4. Pricing, Currency & Payment Terms' },
    { id: 'production-delivery', title: '5. Production Lead Times & Dispatch' },
    { id: 'inspection-returns', title: '6. Inspection Window & Return Policy' },
    { id: 'intellectual-property', title: '7. Intellectual Property & Patterns' },
    { id: 'warranty-liability', title: '8. KEBS Standards & Limitation of Liability' },
    { id: 'force-majeure', title: '9. Force Majeure & Supply Chain' },
    { id: 'governing-law', title: '10. Dispute Resolution & Kenyan Law' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Terms & Conditions | Tewaw Enterprise Kenya"
        description="Official Terms of Service & Custom Manufacturing Conditions for Tewaw Enterprise Limited. Details on order MOQs, embroidery approvals, deposit terms, and nationwide dispatch."
        canonical="https://tewaw.com/terms"
      />
      <GlassyBackground />
      <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onOpenCart={() => {}} />
      <BottomNav onOpenCart={() => {}} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-24">
        <LegalHeader
          title="Terms & Conditions"
          subtitle="Clear, fair, and professional terms governing custom garment manufacturing, corporate apparel orders, digitization proofs, and nationwide delivery."
          badge="Manufacturing Agreement"
          lastUpdated="August 14, 2026"
          icon={FileText}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Sticky Table of Contents */}
            <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Scale className="w-4 h-4 text-brand-orange" />
                  <h3 className="font-display font-black text-brand-blue uppercase text-xs tracking-wider">Terms Sections</h3>
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

              {/* Manufacturing Highlight */}
              <div className="bg-brand-orange/10 border border-brand-orange/20 p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-sm text-brand-blue">Production Assurance</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All custom uniforms and apparel are stitched in Nairobi under rigorous KEBS-compliant fabric specifications.
                </p>
                <div className="pt-2 text-xs font-bold text-brand-orange">
                  Standard turnaround: 3 – 7 business days.
                </div>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Section 1 */}
              <section id="acceptance" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 1
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  1. Agreement to Terms & Scope
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These Terms and Conditions constitute a legally binding agreement made between you ("Client", "Buyer", or "Customer") and <strong>TEWAW Enterprises Limited</strong> ("TEWAW", "Company", "we", "us", or "our"), concerning your access to and use of our online catalog, quote builder, and manufacturing services at our workshop in Nairobi, Kenya.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  By approving a formal quote, submitting an order on our platform, or commissioning custom garment production via WhatsApp/Email, you agree that you have read, understood, and agreed to be bound by all of these Terms and Conditions.
                </p>
              </section>

              {/* Section 2 */}
              <section id="custom-orders" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 2
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  2. Custom Manufacturing & Minimum Orders (MOQs)
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  TEWAW Enterprises provides wholesale, institutional, and custom tailored apparel. The following guidelines govern custom orders:
                </p>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <Layers className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-brand-blue">Minimum Order Quantities (MOQs):</p>
                      <p className="text-slate-600 mt-0.5">Standard custom branding MOQs begin at <strong>10 pieces</strong> per design. Bespoke reactive fabric dyeing or specialized custom trims require an MOQ of <strong>50 pieces</strong>.</p>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-brand-blue">Sample Development:</p>
                      <p className="text-slate-600 mt-0.5">Pre-production physical samples are provided for high-volume orders upon payment of a refundable sample development fee (credited toward the bulk production balance).</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="artwork-proofs" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 3
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  3. Artwork Approval & Digitization Proofs
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Before any fabric is branded with computerized embroidery, DTF digital heat transfer, 3D pocket silicone, or sublimation:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Digital Visual Proof:</strong> Our design team will generate a digital mockup showing placement, dimensions (in cm), stitch thread codes, and Pantone color matches.</li>
                  <li><strong>Client Written Sign-Off:</strong> The Client must review and confirm spelling, color codes, and positioning via WhatsApp or Email.</li>
                  <li><strong>Finality of Approval:</strong> Once the Client provides written confirmation and cutting/stitching commences, changes cannot be made without additional material and re-tooling surcharges.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="pricing-payment" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 4
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  4. Pricing, Currency & Payment Terms
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  All prices displayed on this website or in official quotes are in <strong>Kenyan Shillings (KES / KSh)</strong> and are valid for thirty (30) calendar days from the date of quote generation.
                </p>
                <div className="p-4 bg-brand-light rounded-2xl border-l-4 border-brand-orange space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-brand-blue">Standard Payment Milestones for Bulk Production:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>60% Commitment Deposit:</strong> Required upon approval of artwork/sizes to procure raw fabric rolls and initiate cutting.</li>
                    <li><strong>40% Final Balance:</strong> Due upon completion of quality assurance and before final logistics dispatch or collection.</li>
                    <li><strong>Government / Institutional LPOs:</strong> Valid Local Purchase Orders (LPOs) from registered educational institutions and corporations are accepted subject to credit approval.</li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="production-delivery" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 5
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  5. Production Lead Times & Dispatch
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Standard production lead times are typically <strong>3 to 7 business days</strong> depending on batch quantity and embroidery complexity.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5 mb-1">
                      <Truck className="w-4 h-4 text-brand-orange" /> Nairobi Metropolitan
                    </p>
                    <p className="text-slate-600">Same-day courier dispatch or factory collection at Jagoo Lane once production is complete.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5 mb-1">
                      <Truck className="w-4 h-4 text-brand-green" /> Nationwide & Regional
                    </p>
                    <p className="text-slate-600">Overnight parcel transport to all 47 counties (Mombasa, Kisumu, Nakuru, Eldoret, Garissa, etc.) via licensed parcel couriers.</p>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="inspection-returns" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 6
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  6. Inspection Window & Return Policy
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Because customized garments are tailored to client-specific colors, sizes, and embroidered logos, custom-branded apparel cannot be returned for simple change-of-mind.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-brand-blue">48-Hour Quality Inspection Protocol:</p>
                  <p>
                    The Client has <strong>forty-eight (48) hours</strong> from receipt of shipment to inspect all items. If any garment exhibits a manufacturing defect (e.g. broken seam, mismatched embroidery text compared to approved proof, or flawed fabric weave), TEWAW will immediately repair or replace the defective unit at no additional cost.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="intellectual-property" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 7
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  7. Intellectual Property & Patterns
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The Client warrants that they possess full legal ownership, trademark rights, or licensing permissions for all logos, artwork, and insignias submitted for production.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  TEWAW Enterprises retains all proprietary rights over our tailored pattern blocks, bespoke digital cutting profiles, website source code, and catalog imagery.
                </p>
              </section>

              {/* Section 8 */}
              <section id="warranty-liability" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 8
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  8. KEBS Standards & Limitation of Liability
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  All apparel manufactured by TEWAW Enterprises adheres to Kenya Bureau of Standards (KEBS) guidelines for textile durability, colorfastness, and seam tensile strength.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To the maximum extent permitted by Kenyan law, TEWAW's total aggregate liability arising out of any order shall strictly be limited to the total monetary amount actually paid by the Client for the specific defective garment batch.
                </p>
              </section>

              {/* Section 9 */}
              <section id="force-majeure" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 9
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  9. Force Majeure & Supply Chain
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Neither party shall be held liable for failure or delay in fulfilling production obligations where such delay is caused by acts of God, severe extreme weather, regional power grid interruptions, national transport disruptions, or severe cotton import embargoes beyond reasonable control.
                </p>
              </section>

              {/* Section 10 */}
              <section id="governing-law" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 10
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  10. Dispute Resolution & Kenyan Law
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These Terms and Conditions shall be governed by and construed in accordance with the <strong>Laws of the Republic of Kenya</strong>.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Any dispute, controversy, or claim arising out of or relating to this agreement shall first be subjected to good-faith amicable negotiation. If unresolved within thirty (30) days, the dispute shall be referred to arbitration in Nairobi in accordance with the Arbitration Act (1995) of Kenya.
                </p>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                  <span>Registered: <strong>TEWAW Enterprises Limited</strong></span>
                  <span>Legal Inquiries: <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">tewawenterprises@gmail.com</a></span>
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
