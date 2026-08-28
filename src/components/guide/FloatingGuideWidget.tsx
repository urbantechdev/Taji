import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  BookOpen,
  Search,
  X,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  MousePointer,
  Scale,
  Scissors,
  ShoppingCart,
  Receipt,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { USER_GUIDE_ARTICLES } from '../docs/userGuideData';
import { NavTab } from '../layout/Sidebar';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface FloatingGuideWidgetProps {
  onNavigateToTab: (tab: NavTab) => void;
}

export const FloatingGuideWidget: React.FC<FloatingGuideWidgetProps> = ({ onNavigateToTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = searchQuery.trim()
    ? USER_GUIDE_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : USER_GUIDE_ARTICLES.slice(0, 4);

  const handleOpenGuidePage = () => {
    playClickSound();
    setIsOpen(false);
    onNavigateToTab('guide');
  };

  const handleSelectArticle = (tabId?: string) => {
    if (tabId) {
      playSuccessSound();
      setIsOpen(false);
      onNavigateToTab(tabId as NavTab);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.button
          id="floating-user-guide-btn"
          type="button"
          onClick={() => {
            playClickSound();
            setIsOpen(!isOpen);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative group p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white shadow-xl shadow-rose-900/30 border border-white/20 flex items-center justify-center cursor-pointer transition-all"
          title="User Guide & Feature Help"
        >
          {/* Animated Glow Ring */}
          <div className="absolute -inset-1 rounded-2xl bg-rose-500/40 blur-xs -z-10 animate-pulse" />

          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline font-bold text-xs tracking-tight">
              User Guide &amp; Help
            </span>
          </div>

          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping" />
        </motion.button>
      </div>

      {/* Quick-Help Drawer / Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            id="quick-help-backdrop"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={e => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden m-0 sm:mr-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Instant User Guide &amp; Search
                    </h3>
                    <p className="text-[11px] text-rose-100/90 font-medium">
                      Ask how to use any ERP feature or shortcut
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                  <Search className="w-4 h-4 text-rose-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search e.g. 'Yarn tare', 'Fleece meters', 'POS'..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Results / Quick Topics List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px] max-h-[380px]">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{searchQuery ? 'Search Results' : 'Recommended Guides'}</span>
                </div>

                {filteredArticles.map(article => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleSelectArticle(article.targetTab)}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50/40 text-left transition-all group flex items-start justify-between gap-3 cursor-pointer shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                        {article.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {article.shortSummary}
                      </p>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0 mt-0.5" />
                  </button>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                    <p>No quick results found for "{searchQuery}".</p>
                    <button
                      type="button"
                      onClick={handleOpenGuidePage}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Open Full User Guide Module →
                    </button>
                  </div>
                )}
              </div>

              {/* Footer: Open Full Guide Button */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleOpenGuidePage}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-300" />
                  <span>Open Full User Guide Center</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
