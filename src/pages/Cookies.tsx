import { useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { Cookie, CheckCircle2, ChevronRight, Settings2, Shield, Trash2, HelpCircle } from 'lucide-react';
import { CartItem } from './Home';

export default function Cookies() {
  const [cart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeSection, setActiveSection] = useState<string>('what-are-cookies');

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
    { id: 'what-are-cookies', title: '1. What Are Cookies & Local Storage' },
    { id: 'how-we-use', title: '2. How Tewaw Uses Cookies' },
    { id: 'categories', title: '3. Categories of Cookies We Use' },
    { id: 'local-storage', title: '4. Cart Persistence & LocalStorage' },
    { id: 'third-party', title: '5. Third-Party Integrations' },
    { id: 'manage-cookies', title: '6. How to Control & Clear Cookies' },
    { id: 'updates', title: '7. Policy Revisions & Inquiries' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <SEO 
        title="Cookie Policy | Tewaw Enterprise Kenya"
        description="Learn how Tewaw Enterprise uses cookies and browser local storage to preserve your customized uniform shopping cart and improve your browsing experience."
        canonical="https://tewaw.com/cookies"
      />
      <GlassyBackground />
      <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onOpenCart={() => {}} />
      <BottomNav onOpenCart={() => {}} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-24">
        <LegalHeader
          title="Cookie Policy"
          subtitle="Understanding how browser cookies and local storage maintain your cart items, color customizations, and catalog layout preferences."
          badge="Cookie & Cache Notice"
          lastUpdated="August 14, 2026"
          icon={Cookie}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Sticky Table of Contents */}
            <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Settings2 className="w-4 h-4 text-brand-orange" />
                  <h3 className="font-display font-black text-brand-blue uppercase text-xs tracking-wider">Cookie Topics</h3>
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

              {/* Cache Insight */}
              <div className="bg-brand-blue text-white p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-sm">Privacy-First Guarantee</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We never use intrusive cross-site ad trackers. Our cookies strictly power core catalog functionalities and quote generation.
                </p>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Section 1 */}
              <section id="what-are-cookies" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 1
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  1. What Are Cookies & Local Storage?
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Cookies are small text files placed on your device (computer, tablet, or smartphone) by websites that you visit. They are widely used to make websites work efficiently, remember your customized preferences, and provide information to site owners.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Modern web applications also use <strong>HTML5 LocalStorage</strong>, a secure browser mechanism that allows data to be stored locally within the user's browser without transferring sensitive credentials across the network on every page load.
                </p>
              </section>

              {/* Section 2 */}
              <section id="how-we-use" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 2
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  2. How Tewaw Uses Cookies
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  TEWAW Enterprises Limited uses cookies and local storage for essential operational purposes:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" /> Shopping Cart Preservation
                    </p>
                    <p className="text-slate-600">Preserves your configured garments, chosen sizes, and branding add-ons as you browse between pages.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" /> Filter & Category Memory
                    </p>
                    <p className="text-slate-600">Remembers whether you were viewing Security Uniforms, Corporate Wear, or Sports Jerseys.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" /> Quote Builder Stash
                    </p>
                    <p className="text-slate-600">Stores selected items when generating an official PDF quotation for school boards or corporate committees.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-brand-blue flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" /> Admin Security Tokens
                    </p>
                    <p className="text-slate-600">Maintains secure authenticated session tokens for factory supervisors accessing the admin management portal.</p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="categories" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 3
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  3. Categories of Cookies We Use
                </h2>
                
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-brand-blue space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand-blue text-sm">Strictly Necessary Cookies & Storage</span>
                      <span className="px-2 py-0.5 bg-brand-blue text-white rounded-md text-[10px] font-black uppercase">Essential</span>
                    </div>
                    <p className="text-slate-600">
                      These items are essential for the website to function. Without them, order customization, WhatsApp checkout payload assembly, and security tokens cannot operate.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-brand-orange space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand-blue text-sm">Functional & Preference Cookies</span>
                      <span className="px-2 py-0.5 bg-brand-orange text-white rounded-md text-[10px] font-black uppercase">Preference</span>
                    </div>
                    <p className="text-slate-600">
                      These allow our website to remember choices you make (such as search queries, 3D interactive viewer angles, and preferred colorways) to provide a smoother tailoring experience.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="local-storage" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 4
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  4. Cart Persistence & LocalStorage Keys
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  For full transparency, here is the exact local storage key utilized by our web application:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 rounded-2xl overflow-hidden">
                    <thead className="bg-slate-50 font-bold text-brand-blue uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Key Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-3 font-mono font-bold text-brand-orange">tewaw_cart</td>
                        <td className="p-3">LocalStorage</td>
                        <td className="p-3">Stores cart items, sizes (S/M/L/XL), fabric colors, and branding surcharges.</td>
                        <td className="p-3">Persistent until cleared</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-brand-blue">firebase:authUser</td>
                        <td className="p-3">IndexedDB / Session</td>
                        <td className="p-3">Manages authenticated admin session state for factory product updates.</td>
                        <td className="p-3">Session based</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 5 */}
              <section id="third-party" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black uppercase">
                  Section 5
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  5. Third-Party Integrations
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  When interacting with specific features on our website, third-party services may set cookies:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Google Maps:</strong> Embedded location maps of our Jagoo Lane, Uhuru Market factory may set cookies for map rendering and route navigation.</li>
                  <li><strong>WhatsApp (Meta):</strong> Tapping to checkout or discuss quotes transfers your structured order summary into the official WhatsApp service subject to Meta's privacy and cookie terms.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section id="manage-cookies" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-black uppercase">
                  Section 6
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  6. How to Control & Clear Cookies
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  You can choose to disable cookies and clear local browser data through your browser settings. Below are links for major browsers:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700">Google Chrome</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700">Apple Safari</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700">Mozilla Firefox</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700">Microsoft Edge</div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Note: Disabling local storage or cookies will reset your active garment cart upon browser refresh.
                </p>
              </section>

              {/* Section 7 */}
              <section id="updates" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-xs font-black uppercase">
                  Section 7
                </div>
                <h2 className="text-2xl font-display font-black text-brand-blue uppercase">
                  7. Policy Revisions & Inquiries
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect technological upgrades or legal changes in Kenyan digital commerce regulations.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p><strong>Questions or concerns?</strong></p>
                  <p>Contact our web team at <a href="mailto:tewawenterprises@gmail.com" className="text-brand-orange font-bold hover:underline">tewawenterprises@gmail.com</a> or call <strong>+254 736 619 688</strong>.</p>
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
