import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Search,
  HelpCircle,
  Sparkles,
  Scissors,
  Scale,
  ShoppingCart,
  ArrowLeftRight,
  Receipt,
  BookOpenCheck,
  ShieldCheck,
  Barcode,
  Boxes,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Download,
  Printer,
  X,
  Layers,
  ArrowUpRight,
  Lightbulb,
  MousePointer,
  Compass,
  Zap,
  Info,
  Clock,
  UserCheck,
  Eye,
  Camera,
  RotateCcw,
  Volume2,
  Lock,
  Tag,
  Wallet,
  Building2,
  ClipboardList
} from 'lucide-react';
import { USER_GUIDE_ARTICLES, GuideArticle } from './userGuideData';
import { BUTTON_CAPABILITIES, ButtonCapability } from './buttonCapabilitiesData';
import { NavTab } from '../layout/Sidebar';
import { downloadReadmeMarkdown, downloadReadmePDF } from '../../utils/downloadReadme';
import { playClickSound, playSuccessSound } from '../../utils/audio';
import ReflectionOverlay from '../common/ReflectionOverlay';

interface UserGuideModuleProps {
  onNavigateToTab?: (tab: NavTab) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Guides', icon: Compass },
  { id: 'yarns', label: 'Yarns & Tare Weights', icon: Scale },
  { id: 'fleece_dereec', label: 'Fleece & Dereec (Meters)', icon: Scissors },
  { id: 'pos', label: 'POS Sales & Roll Pricing', icon: ShoppingCart },
  { id: 'transfers', label: 'Inter-Store Transfers', icon: ArrowLeftRight },
  { id: 'etr', label: 'KRA Fiscal Billing', icon: Receipt },
  { id: 'ledger', label: 'Accounting Ledger', icon: BookOpenCheck },
  { id: 'roles_security', label: 'Roles & Security', icon: ShieldCheck },
  { id: 'barcodes', label: 'Barcodes & Labels', icon: Barcode },
  { id: 'capabilities', label: 'Button & Icon Explorer', icon: MousePointer }
];

const SUGGESTED_QUESTIONS = [
  { text: 'Where do I set standard net mass and gross mass for yarn?', targetId: 'yarn-tare-mass-settings' },
  { text: 'How do I adjust meters during Fleece & Dereec inventory creation?', targetId: 'fleece-dereec-meters-adjustment' },
  { text: 'How does Option 1 Hybrid Roll Pricing calculate whole rolls vs loose cuts?', targetId: 'option1-hybrid-roll-pricing' },
  { text: 'How to scan barcodes and checkout at the POS terminal?', targetId: 'pos-sales-checkout' },
  { text: 'How to dispatch and receive stock between stores?', targetId: 'inter-store-transfers' },
  { text: 'How to record branch expenses and adjust cash float?', targetId: 'multi-branch-expense-float' },
  { text: 'How to configure KRA ETR and issue credit notes?', targetId: 'kra-etims-invoicing' },
  { text: 'How to print 50×30mm thermal roll barcodes?', targetId: 'thermal-barcode-printing' }
];

// Helper to render appropriate lucide icon for button capabilities
const getCapabilityIcon = (iconName: string) => {
  switch (iconName) {
    case 'Scissors': return Scissors;
    case 'Scale': return Scale;
    case 'Boxes': return Boxes;
    case 'Tag': return Tag;
    case 'Clock': return Clock;
    case 'Receipt': return Receipt;
    case 'RotateCcw': return RotateCcw;
    case 'Barcode': return Barcode;
    case 'BookOpen': return BookOpen;
    case 'Lock': return Lock;
    case 'Volume2': return Volume2;
    case 'ArrowLeftRight': return ArrowLeftRight;
    case 'Wallet': return Wallet;
    case 'Camera': return Camera;
    case 'TrendingUp': return Zap;
    case 'ClipboardList': return ClipboardList;
    default: return Sparkles;
  }
};

export const UserGuideModule: React.FC<UserGuideModuleProps> = ({ onNavigateToTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>('yarn-tare-mass-settings');
  const [selectedIconModule, setSelectedIconModule] = useState<string>('all');
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [hoveredCapability, setHoveredCapability] = useState<ButtonCapability | null>(BUTTON_CAPABILITIES[0]);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'cards' | 'live_toolbar'>('cards');

  // Filter articles based on search query and selected category
  const filteredArticles = useMemo(() => {
    let list = USER_GUIDE_ARTICLES;

    if (selectedCategory !== 'all' && selectedCategory !== 'capabilities') {
      list = list.filter(a => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.shortSummary.toLowerCase().includes(q) ||
        a.keywords.some(k => k.toLowerCase().includes(q)) ||
        a.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) ||
        a.faq.some(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, selectedCategory]);

  // Filter button capabilities
  const filteredCapabilities = useMemo(() => {
    let list = BUTTON_CAPABILITIES;

    if (selectedIconModule !== 'all') {
      list = list.filter(b => b.module === selectedIconModule);
    }

    if (iconSearchQuery.trim()) {
      const q = iconSearchQuery.toLowerCase().trim();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.locationDescription.toLowerCase().includes(q) ||
        b.capabilities.some(c => c.toLowerCase().includes(q)) ||
        (b.proTip && b.proTip.toLowerCase().includes(q))
      );
    }

    return list;
  }, [iconSearchQuery, selectedIconModule]);

  const handleSelectSuggestedQuestion = (q: typeof SUGGESTED_QUESTIONS[0]) => {
    playClickSound();
    setSearchQuery(q.text);
    setExpandedArticleId(q.targetId);
    setSelectedCategory('all');
  };

  const handleJumpToFeature = (tabId?: string) => {
    if (tabId && onNavigateToTab) {
      playSuccessSound();
      onNavigateToTab(tabId as NavTab);
    }
  };

  // Instant Quick Answer match
  const quickAnswerMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    // Check if query matches tare/mass
    if (q.includes('tare') || q.includes('mass') || q.includes('gross') || q.includes('net') || q.includes('scale')) {
      return {
        title: 'Yarn Tare Mass & Net Deduction Guide',
        summary: 'To calibrate yarn tare: Go to Settings > Product Price Settings > Yarns. Set Cone Tare (0.070 kg) or Bale Tare (0.840 kg for 24.84kg Oster India). Check "Auto-Deduct Tare at POS" so POS scales automatically charge customers strictly for Net Fabric Mass.',
        targetTab: 'settings',
        actionLabel: 'Open Product Price Settings'
      };
    }
    // Check if query matches meter/roll/hybrid
    if (q.includes('hybrid') || q.includes('roll price') || q.includes('wholesale') || q.includes('loose')) {
      return {
        title: 'Option 1 Hybrid Roll Pricing & Loose Meter Discount',
        summary: 'In the POS cart, click the 🏷️ Tag / Roll Pricing icon on any Fleece or Dereec line item. Option 1 automatically bills whole standard rolls (e.g. 70m) at wholesale rates (e.g. KES 440/m for Fleece, KES 220/m for Dereec) and loose cut meters (e.g. 25m) at retail rates (KES 470/m or KES 230/m with loose meter discounts).',
        targetTab: 'pos',
        actionLabel: 'Open POS Terminal'
      };
    }
    // Check if query matches meters/cutting/fleece
    if (q.includes('fleece') || q.includes('dereec') || q.includes('meter') || q.includes('cut') || q.includes('roll')) {
      return {
        title: 'Fleece & Dereec Meter Adjustment',
        summary: 'You can adjust meters in 3 places: 1) During Category Intake by editing the "Qty (Meters)" column before saving; 2) In Fabric Roll Manager (Scissors ✂️) via comma-separated batch intake; or 3) In Inventory Catalog by clicking ✏️ Edit on any product card.',
        targetTab: 'catalog',
        actionLabel: 'Open Inventory Catalog'
      };
    }
    // Check if query matches branch/float/expense
    if (q.includes('float') || q.includes('expense') || q.includes('petty cash') || q.includes('branch')) {
      return {
        title: 'Branch Cash Float & Petty Cash Expenses',
        summary: 'In Autonomous Branches or Accounting Ledger: Click "Adjust Cash Float" to set opening till balance. Click "+ Record Branch Expense" to disburse petty cash for transport, packaging, or utilities with automatic General Ledger debit/credit posting.',
        targetTab: 'branches',
        actionLabel: 'Open Branch Management'
      };
    }
    // Check if query matches etims/tax/invoice/credit note
    if (q.includes('etr') || q.includes('etims') || q.includes('tax') || q.includes('credit note') || q.includes('vat') || q.includes('invoice')) {
      return {
        title: 'KRA eTIMS Invoicing & Credit Notes',
        summary: 'In Billing & Invoices (ETR Module): Configure Company KRA PIN and CU Serial in Settings. Click "+ New Tax Invoice" to issue 16% VAT invoices with QR verification. Click "Issue Credit Note" to reverse returned fabric cuts.',
        targetTab: 'etr',
        actionLabel: 'Open Billing & Invoices'
      };
    }

    return null;
  }, [searchQuery]);

  return (
    <div id="user-guide-module" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Banner with Search & Natural Language Query Box */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-3 sm:p-8 md:p-10 shadow-2xl border border-rose-500/20 overflow-hidden">
        <ReflectionOverlay />

        <div className="relative z-10 max-w-4xl mx-auto space-y-2.5 sm:space-y-6 text-center">
          
          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>Interactive Knowledge Base &amp; Capability Helper</span>
          </div>

          {/* Main Title */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              How can we help you navigate Taji ERP?
            </h1>
            <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto font-medium line-clamp-2 sm:line-clamp-none">
              Ask any question, search step-by-step guides for Fleece, Dereec &amp; Yarns, or explore button &amp; icon capabilities across the platform.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 absolute left-3.5 sm:left-4 pointer-events-none" />
              <input
                id="user-guide-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ask e.g. 'How to set yarn tare', 'Adjust fleece meters', 'POS checkout'..."
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-4 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 rounded-xl sm:rounded-2xl border border-white/20 focus:border-rose-500 shadow-xl focus:outline-hidden focus:ring-4 focus:ring-rose-500/30 transition-all text-xs sm:text-base font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Instant Quick Answer Card (if matched query) */}
          {quickAnswerMatch && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-white text-slate-900 text-left shadow-2xl border border-rose-200 max-w-2xl mx-auto space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Instant Quick Answer</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                  AI Matched
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {quickAnswerMatch.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {quickAnswerMatch.summary}
              </p>
              {quickAnswerMatch.targetTab && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleJumpToFeature(quickAnswerMatch.targetTab)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{quickAnswerMatch.actionLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick Suggested Questions Chips */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-semibold text-rose-300/80 flex items-center justify-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Popular Questions &amp; Textile Quick Links:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestedQuestion(q)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-600/40 text-slate-200 hover:text-white text-xs font-semibold border border-white/15 hover:border-rose-400/50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 text-left"
                >
                  <span>{q.text}</span>
                  <ChevronRight className="w-3 h-3 text-rose-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Download Manual Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => downloadReadmeMarkdown()}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Download raw README.md specification"
            >
              <Download className="w-3.5 h-3.5 text-rose-300" />
              <span>Download README.md</span>
            </button>

            <button
              type="button"
              onClick={() => downloadReadmePDF()}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Download formatted A4 User Manual PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF Manual</span>
            </button>
          </div>

        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-xs border border-slate-200/80 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectedCategory(tab.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-700 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional View: Button & Icon Capability Explorer VS Step-by-Step Guides */}
      {selectedCategory === 'capabilities' ? (
        /* BUTTON & ICON CAPABILITY EXPLORER */
        <div className="space-y-6">
          
          {/* Live Interactive Toolbar Hover Playground */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/80 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/70 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Live Icon &amp; Action Explorer</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Interactive Button &amp; Icon Capability Inspector
                </h3>
                <p className="text-xs text-slate-300">
                  Hover over or tap any icon below to test live capability tooltips and examine role permissions in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                  {BUTTON_CAPABILITIES.length} Tools Documented
                </span>
              </div>
            </div>

            {/* Live Interactive Icon Strip */}
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-black/30 border border-white/10">
              {BUTTON_CAPABILITIES.map(btn => {
                const IconComponent = getCapabilityIcon(btn.iconName);
                const isSelected = hoveredCapability?.id === btn.id;

                return (
                  <button
                    key={btn.id}
                    type="button"
                    onMouseEnter={() => {
                      playClickSound();
                      setHoveredCapability(btn);
                    }}
                    onClick={() => {
                      playClickSound();
                      setHoveredCapability(btn);
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 scale-105 ring-2 ring-rose-400'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10'
                    }`}
                    title={btn.name}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="max-w-[130px] truncate">{btn.name.split('(')[0].trim()}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Live Capability Card Preview */}
            {hoveredCapability && (
              <motion.div
                key={hoveredCapability.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-rose-500/40 shadow-2xl space-y-4 text-slate-100"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-md">
                      {React.createElement(getCapabilityIcon(hoveredCapability.iconName), { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          {hoveredCapability.name}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {hoveredCapability.moduleLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        📍 Location: {hoveredCapability.locationDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hoveredCapability.shortcut && (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
                        ⌨️ {hoveredCapability.shortcut}
                      </span>
                    )}
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    What this button is capable of doing:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hoveredCapability.capabilities.map((cap, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 text-xs text-slate-200 font-medium bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions & Tip */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><strong>Required Role:</strong> {hoveredCapability.requiredRole}</span>
                  </div>
                  {hoveredCapability.proTip && (
                    <div className="text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs font-medium">
                      💡 Pro Tip: {hoveredCapability.proTip}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <MousePointer className="w-5 h-5 text-rose-600" />
                  <span>Full Button &amp; Icon Directory</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Browse complete capabilities and shortcuts organized by ERP module.
                </p>
              </div>

              {/* Module Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Modules' },
                  { id: 'inventory', label: 'Inventory' },
                  { id: 'pos', label: 'POS' },
                  { id: 'transfers', label: 'Transfers' },
                  { id: 'branches', label: 'Branches' },
                  { id: 'ledger', label: 'Ledger' },
                  { id: 'settings', label: 'Settings' },
                  { id: 'header', label: 'Header' }
                ].map(mod => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedIconModule(mod.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedIconModule === mod.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search for Icons */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={iconSearchQuery}
                onChange={e => setIconSearchQuery(e.target.value)}
                placeholder="Search button by name, e.g. 'Scissors', 'Tare Scale', 'Hold Cart', 'Z-Report', 'Float'..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
              />
            </div>

            {/* Grid of Button Capability Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCapabilities.map(btn => {
                const IconComponent = getCapabilityIcon(btn.iconName);

                return (
                  <div
                    key={btn.id}
                    onMouseEnter={() => setHoveredCapability(btn)}
                    className="p-4 rounded-2xl border border-slate-200/90 hover:border-rose-400 bg-gradient-to-b from-white to-slate-50/50 hover:shadow-md transition-all space-y-3 group cursor-default"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                            {btn.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {btn.moduleLabel}
                          </span>
                        </div>
                      </div>

                      {btn.shortcut && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {btn.shortcut}
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Location: {btn.locationDescription}</span>
                    </div>

                    {/* Capability List */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Key Capabilities:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {btn.capabilities.map((cap, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-1.5 font-medium leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Role & Pro Tip */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-600 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-rose-500" />
                        <span>Role: {btn.requiredRole}</span>
                      </div>
                      {btn.proTip && (
                        <div className="text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200/50 font-medium">
                          💡 {btn.proTip}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        /* STEP-BY-STEP GUIDES & FAQS */
        <div className="space-y-4">
          
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold">
              Showing {filteredArticles.length} detailed operational {filteredArticles.length === 1 ? 'guide' : 'guides'}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>
            <span className="text-slate-400 font-medium">
              Click any guide to expand full step-by-step instructions
            </span>
          </div>

          {/* Article Accordion List */}
          <div className="space-y-4">
            {filteredArticles.map(article => {
              const isExpanded = expandedArticleId === article.id;
              return (
                <div
                  key={article.id}
                  id={`guide-article-${article.id}`}
                  className={`rounded-3xl bg-white border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-rose-300 shadow-lg ring-2 ring-rose-500/10'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Article Header (Clickable) */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setExpandedArticleId(isExpanded ? null : article.id);
                    }}
                    className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-white via-slate-50/30 to-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`p-3 rounded-2xl transition-colors shrink-0 ${
                        isExpanded
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {article.categoryLabel}
                          </span>
                          {article.targetTab && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              <span>Direct Shortcut Available</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {article.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                          {article.shortSummary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 p-2 rounded-xl bg-slate-100 text-slate-500">
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-rose-600' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Expanded Body: Steps, Pro Tips, Action Button, FAQ */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-slate-100 p-5 sm:p-7 space-y-6 bg-slate-50/40"
                      >
                        
                        {/* Direct Jump to Feature Banner */}
                        {article.targetTab && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-600" />
                                <span>Ready to try this in the application right now?</span>
                              </div>
                              <p className="text-xs text-rose-700 font-medium">
                                Jump directly to the relevant view or module in one click.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleJumpToFeature(article.targetTab)}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                            >
                              <span>{article.actionLabel || 'Jump to Feature'}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Step-by-Step Procedure */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-rose-600" />
                            <span>Step-by-Step Instructions:</span>
                          </h4>

                          <div className="space-y-3">
                            {article.steps.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5"
                              >
                                <div className="w-7 h-7 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {step.stepNumber}
                                </div>

                                <div className="space-y-1.5 flex-1">
                                  <h5 className="text-sm font-bold text-slate-900">
                                    {step.title}
                                  </h5>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {step.description}
                                  </p>

                                  {step.clickPath && (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                                      <Compass className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>Click Path: {step.clickPath}</span>
                                    </div>
                                  )}

                                  {step.proTip && (
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-start gap-2">
                                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <span>{step.proTip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Frequently Asked Questions (FAQ) */}
                        {article.faq && article.faq.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                              <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Common Questions &amp; Troubleshooting:</span>
                            </h4>

                            <div className="space-y-2">
                              {article.faq.map((faqItem, fIdx) => (
                                <div
                                  key={fIdx}
                                  className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1"
                                >
                                  <div className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                                    <span className="text-rose-600 font-black">Q:</span>
                                    <span>{faqItem.q}</span>
                                  </div>
                                  <div className="text-xs text-slate-600 font-medium pl-4 leading-relaxed">
                                    {faqItem.a}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No matching guides found for "{searchQuery}"
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try searching for general keywords like "Yarn", "Fleece", "Meters", "Tare", "POS", "ETR", or "Transfers".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow transition-all cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

