import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, FileCheck, ShieldAlert, Scale, Factory, ChevronDown } from 'lucide-react';

export type LegalType = 'privacy' | 'security' | 'compliance';

interface LegalViewProps {
  type: LegalType;
  onClose: () => void;
}

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    icon: Lock,
    subtitle: 'Kenya Data Protection Act (2019) Compliant.',
    sections: [
      {
        title: 'Information We Collect & Measurements',
        content: 'We collect information provided directly when requesting a quote, commissioning uniforms, or ordering. This includes representative name, company/institution, phone number, email address, delivery county/address, plus technical uniform sizing measurements (collar, chest, waist, inseam) and vector artwork/DST embroidery files.'
      },
      {
        title: 'How We Process & Use Your Information',
        content: 'Your information is used strictly to engineer garments, calculate fabric yardage, digitize bespoke embroidery files, maintain KRA e-TIMS electronic tax records, and coordinate direct parcel dispatch across Kenya and East Africa.'
      },
      {
        title: 'Data Sovereignty & Security Protocols',
        content: 'In strict conformity with the Kenya Data Protection Act (No. 24 of 2019), student uniform rosters and private client data are stored on encrypted, access-restricted databases. Rosters for minors are permanently purged following seasonal supply completion.'
      },
      {
        title: 'Confidentiality of Brand Artworks & Insignia',
        content: 'Vector logos, tactical security badges, school crests, and embroidery patterns submitted by clients are proprietary intellectual property. TEWAW guarantees zero third-party replication, lease, or unauthorized resale.'
      }
    ]
  },
  security: {
    title: 'Security Standards',
    icon: Shield,
    subtitle: 'Protecting your designs, regalia, and transactions.',
    sections: [
      {
        title: 'Design & Insignia Protection',
        content: 'We respect corporate and institutional identity. Your custom logos, digitized embroidery stitch files (.DST, .PES), and specialized security guard uniform designs are treated as confidential intellectual property and never shared.'
      },
      {
        title: 'Secure Manufacturing Premises',
        content: 'Our manufacturing facility at Jagoo Lane, Uhuru Market is monitored 24/7. Physical access to cutting and stitching bays containing client regalia and stock is strictly logged and restricted.'
      },
      {
        title: 'Transaction & Payment Integrity',
        content: 'All financial transactions follow verified banking and M-Pesa protocols in Kenya. We do not store sensitive payment card details or unencrypted banking credentials on local machines.'
      }
    ]
  },
  compliance: {
    title: 'Compliance & Ethics',
    icon: FileCheck,
    subtitle: 'KEBS standards and ethical manufacturing.',
    sections: [
      {
        title: 'Quality Certification (KEBS Aligned)',
        content: 'TEWAW Enterprises products are manufactured to meet or exceed KEBS (Kenya Bureau of Standards) requirements for cotton fleece apparel, high-visibility reflective standards, and industrial workwear durability.'
      },
      {
        title: 'Fair Labor Practices & Master Artisans',
        content: 'We are committed to ethical manufacturing. Our stitchers, tailors, and weavers work in safe, well-ventilated environments with fair living wages and recognition as our industry gurus.'
      },
      {
        title: 'Environmental Stewardship & Fabric Efficiency',
        content: 'We source high-grade cotton fleece and eco-conscious dyes with precision CAD pattern nesting that minimizes textile offcut waste during the cutting and fabrication phases.'
      }
    ]
  }
};

export default function LegalView({ type, onClose }: LegalViewProps) {
  const data = CONTENT[type];
  const Icon = data.icon;
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({ 0: true });

  const toggleIndex = (idx: number) => {
    setOpenIndices(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8"
    >
      <div 
        className="absolute inset-0 bg-brand-blue/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] overflow-hidden shadow-2xl flex flex-col brand-edge-orange"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-brand-light border-b border-slate-100 flex items-start justify-between">
          <div className="flex gap-4 sm:gap-5 items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-blue rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-blue/20">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-display font-black text-brand-blue uppercase tracking-tight">{data.title}</h2>
              <p className="text-brand-orange font-bold text-xs uppercase tracking-widest">{data.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsible Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          {data.sections.map((section, i) => {
            const isOpen = !!openIndices[i];
            return (
              <div 
                key={i} 
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen ? 'border-brand-blue/30 bg-slate-50/50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 select-none"
                >
                  <h3 className="text-sm sm:text-base font-bold text-brand-blue flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-brand-orange rounded-full shrink-0" />
                    {section.title}
                  </h3>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs">
            <Scale className="w-4 h-4 text-brand-orange shrink-0" />
            <p className="font-medium uppercase tracking-wider text-[10px]">
              Official TEWAW Legal Documentation • Kenya Sector
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 sm:px-8 sm:py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-brand-blue/20 text-xs sm:text-sm uppercase tracking-wider"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
