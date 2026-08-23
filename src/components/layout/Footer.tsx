import React, { useState } from 'react';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { ExternalLink, Layers, ShieldCheck, BookOpen, Download } from 'lucide-react';
import { ReadmeModal } from '../docs/ReadmeModal';
import { downloadReadmeMarkdown } from '../../utils/downloadReadme';

export const Footer: React.FC = () => {
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

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

        {/* Center: System Documentation Quick Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReadmeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-xl font-bold transition-all cursor-pointer text-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>System README &amp; User Manual</span>
          </button>
          <button
            onClick={() => downloadReadmeMarkdown()}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Download README.md"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Powered by Urbantechdev with link */}
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

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />
    </footer>
  );
};
