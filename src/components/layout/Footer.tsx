import React from 'react';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { ExternalLink, Layers, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto border-t border-rose-200/80 bg-white/95 backdrop-blur-md text-slate-600 py-6 px-4 sm:px-8">
      <ReflectionOverlay />
      <RightEdgeBlend variant="rainbow" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs relative z-10">
        
        {/* Left: Brand & Company info */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Textile Enterprise ERP &amp; POS</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                KRA TIMS ETR Ready
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Dereck, Fleece &amp; Yarns Multi-Store Control Hub • Nairobi, Kenya
            </p>
          </div>
        </div>

        {/* Center/Right: Powered by Urbantechdev with link */}
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-2xl border border-rose-100 shadow-2xs hover:border-pink-300 transition-all">
          <span className="text-[11px] font-medium text-slate-500">Powered by</span>
          <a
            href="https://urbantechdev.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 hover:underline text-xs"
          >
            <span>Urbantechdev</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </footer>
  );
};
