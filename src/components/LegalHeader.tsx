import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Lock, FileText, Cookie, Award, ShieldCheck, Printer, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalHeaderProps {
  title: string;
  subtitle: string;
  badge: string;
  lastUpdated?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LEGAL_PAGES = [
  { path: '/privacy', label: 'Privacy Policy', icon: Lock, desc: 'Data protection & privacy rights' },
  { path: '/terms', label: 'Terms & Conditions', icon: FileText, desc: 'Manufacturing & order terms' },
  { path: '/cookies', label: 'Cookie Policy', icon: Cookie, desc: 'Browser cookies & local cache' },
  { path: '/security', label: 'Security Standards', icon: ShieldCheck, desc: 'Factory & design IP security' },
  { path: '/compliance', label: 'Compliance & Ethics', icon: Award, desc: 'KEBS, fair labor & sustainability' },
];

export default function LegalHeader({ title, subtitle, badge, lastUpdated = 'August 2026', icon: Icon }: LegalHeaderProps) {
  const location = useLocation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Banner Section */}
      <section className="relative pt-20 pb-20 md:pb-28 bg-brand-blue overflow-hidden text-white">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green rounded-full blur-[140px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest group w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-brand-orange group-hover:-translate-x-1 transition-transform" />
              Back to Store
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                Official Kenya Legal Registry
              </span>
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-white/15 hover:bg-white text-white hover:text-brand-blue px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>

          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-orange/20 border border-brand-orange/40 rounded-full mb-4 text-brand-orange"
            >
              <Icon className="w-4 h-4 text-brand-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{badge}</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black uppercase tracking-tight leading-tight mb-4">
              {title}
            </h1>

            <p className="text-slate-200 text-sm sm:text-base md:text-lg leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-slate-300 font-medium">
              <span>Effective Date: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span>Jurisdiction: <strong>Republic of Kenya</strong></span>
              <span>•</span>
              <span>Registered Entity: <strong>TEWAW Enterprises Limited</strong></span>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-[-2px] left-0 right-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[32px] md:h-[50px] fill-slate-50">
            <path d="M0,60 C400,120 800,0 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Navigation Pills Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-30 mb-10">
        <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-nowrap overflow-x-auto gap-2 scrollbar-none">
          {LEGAL_PAGES.map((page) => {
            const isActive = location.pathname === page.path;
            const PageIcon = page.icon;
            return (
              <Link
                key={page.path}
                to={page.path}
                className={`py-3 px-4 sm:px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-600 hover:text-brand-blue hover:bg-slate-50'
                }`}
              >
                <PageIcon className={`w-4 h-4 ${isActive ? 'text-brand-orange' : 'text-slate-400'}`} />
                {page.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
