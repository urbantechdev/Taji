import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { STRENGTHS, BRANDING_SERVICES } from '../constants';
import { CheckCircle2, Award, Zap, Anchor, Layers, Clock, Sparkles, ArrowRight, Printer, Palette } from 'lucide-react';

const icons = [CheckCircle2, Anchor, Award, Zap, Layers, Clock];

export default function StrengthsSection() {
  return (
    <section className="py-24 bg-brand-blue relative overflow-hidden" id="strengths">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full mb-3 text-white font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" /> In-House Customization & Manufacturing
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight mb-4">
            APPAREL BRANDING & <span className="text-brand-orange">MANUFACTURING SERVICES</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            From precision embroidery and 3D pocket printing to vibrant DTF digital transfers and all-over sublimation, we incorporate seamless branding on every Kenyan-made garment.
          </p>
        </div>

        {/* Branding Techniques Grid */}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-brand-orange font-black uppercase text-xs tracking-widest block mb-1">
                Branding Capabilities
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase">
                Specialized Garment Customization
              </h3>
            </div>
            <Link
              to="/services"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-orange hover:text-white transition-colors"
            >
              Explore Full Studio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BRANDING_SERVICES.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm border border-white/15 p-6 rounded-[28px] hover:bg-white/15 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10">
                      {service.badge}
                    </span>
                    <span className="text-brand-orange text-xs font-bold font-mono">
                      {service.estimatedCost}
                    </span>
                  </div>

                  <h4 className="text-lg font-display font-black text-white uppercase mb-1">
                    {service.name}
                  </h4>
                  <p className="text-xs text-brand-orange font-bold uppercase tracking-wider mb-3">
                    {service.tagline}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Durability: {service.durability.split('(')[0]}
                  </span>
                  <Link
                    to="/services"
                    className="text-white hover:text-brand-orange text-xs font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Manufacturing Strengths Grid */}
        <div className="border-t border-white/10 pt-16 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-2">
              Our Manufacturing <span className="text-slate-400">Strengths</span>
            </h3>
            <p className="text-slate-300 text-xs max-w-lg mx-auto">
              Controlling the full cycle from fabric cutting to packaging for unbeatable wholesale value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STRENGTHS.map((strength, idx) => {
              const Icon = icons[idx] || CheckCircle2;
              return (
                <motion.div
                  key={strength.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className="bg-white/5 border border-white/10 p-6 rounded-[24px] hover:bg-white/10 transition-all flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">{strength.title}</h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {strength.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Call to Action Banner */}
        <div className="p-8 md:p-12 bg-brand-green rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 brand-edge-blue hover:translate-x-1 hover:-translate-y-1 transition-all">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-display font-black text-white mb-3 leading-tight">
              NEED CUSTOM APPAREL BRANDING?
            </h3>
            <p className="text-white/90 text-sm font-medium leading-relaxed">
              We design and manufacture customized uniforms, retail hoodies, Maasai heritage fusion, and corporate wear with custom colours, 3D pocket printing, DTF, and embroidery.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 whitespace-nowrap">
            <Link
              to="/services"
              className="px-8 py-4 bg-white text-brand-blue rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl"
            >
              Branding Studio
            </Link>
            <button 
              onClick={() => window.open('https://wa.me/254736619688?text=Hello%20Tewaw%2C%20I%20would%20like%20to%20discuss%20custom%20apparel%20branding%20(3D%20pocket%2C%20DTF%2C%20Embroidery%2C%20Sublimation).', '_blank')}
              className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl"
            >
              WhatsApp Consultation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
