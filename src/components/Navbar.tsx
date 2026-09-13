import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { NasisiLogo } from './NasisiLogo';
import { useERP } from '../context/ERPContext';
import {
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  FileText,
  Ruler,
  ChevronDown,
  Scissors,
  Printer,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
  Search,
  Eye,
  Tag,
  Phone,
  MessageSquare,
  GraduationCap,
  HeartPulse,
  HardHat,
  UtensilsCrossed,
  Shirt,
  Palette,
  CheckCircle2,
  Truck,
  Award,
  Clock,
  ExternalLink,
  Factory,
  Zap,
  Check,
  User,
  Lock,
} from 'lucide-react';
import { QuoteItem, UniformProduct } from '../types';

interface NavbarProps {
  quoteItems: QuoteItem[];
  onOpenQuoteModal: () => void;
  onOpenCustomizer: () => void;
  onOpenSizeGuide: () => void;
  onSelectProduct?: (product: UniformProduct) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onOpenCookies?: () => void;
  onOpenLocation?: () => void;
  onOpenAdminERP?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  quoteItems,
  onOpenQuoteModal,
  onOpenCustomizer,
  onOpenSizeGuide,
  onSelectProduct,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onOpenCookies,
  onOpenLocation,
  onOpenAdminERP,
}) => {
  const { products, currentUser, isAuthenticated, isWhitelistedAdmin } = useERP();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navbar Quick Search state
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isNavSearchOpen, setIsNavSearchOpen] = useState(false);
  const [navHighlightedIndex, setNavHighlightedIndex] = useState(0);
  const navSearchRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);

  // Header Action Buttons Quick Preview Windows state (Top of Everything)
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);
  const [mockupPreviewOpen, setMockupPreviewOpen] = useState(false);
  const [sizeGuidePreviewOpen, setSizeGuidePreviewOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);

  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mockupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sizeGuideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const closeAllHeaderPreviews = () => {
    setServicesDropdownOpen(false);
    setCartPreviewOpen(false);
    setMockupPreviewOpen(false);
    setSizeGuidePreviewOpen(false);
    setDesktopSearchOpen(false);
    setIsNavSearchOpen(false);
  };

  const isAnyHeaderPreviewOpen =
    servicesDropdownOpen ||
    cartPreviewOpen ||
    mockupPreviewOpen ||
    sizeGuidePreviewOpen ||
    desktopSearchOpen ||
    isNavSearchOpen;

  const handleCartMouseEnter = () => {
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
    setMockupPreviewOpen(false);
    setSizeGuidePreviewOpen(false);
    setServicesDropdownOpen(false);
    setCartPreviewOpen(true);
  };
  const handleCartMouseLeave = () => {
    cartTimeoutRef.current = setTimeout(() => {
      setCartPreviewOpen(false);
    }, 200);
  };

  const handleMockupMouseEnter = () => {
    if (mockupTimeoutRef.current) clearTimeout(mockupTimeoutRef.current);
    setCartPreviewOpen(false);
    setSizeGuidePreviewOpen(false);
    setServicesDropdownOpen(false);
    setMockupPreviewOpen(true);
  };
  const handleMockupMouseLeave = () => {
    mockupTimeoutRef.current = setTimeout(() => {
      setMockupPreviewOpen(false);
    }, 200);
  };

  const handleSizeGuideMouseEnter = () => {
    if (sizeGuideTimeoutRef.current) clearTimeout(sizeGuideTimeoutRef.current);
    setCartPreviewOpen(false);
    setMockupPreviewOpen(false);
    setServicesDropdownOpen(false);
    setSizeGuidePreviewOpen(true);
  };
  const handleSizeGuideMouseLeave = () => {
    sizeGuideTimeoutRef.current = setTimeout(() => {
      setSizeGuidePreviewOpen(false);
    }, 200);
  };

  const liveProducts = useMemo(() => {
    return (products || []).filter((p) => p && p.published !== false);
  }, [products]);

  const matchingNavProducts = useMemo(() => {
    if (!navSearchQuery.trim()) return [];
    const q = navSearchQuery.toLowerCase().trim();
    return liveProducts
      .filter((p) => {
        if (!p) return false;
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.categoryLabel || '').toLowerCase().includes(q) ||
          (p.tagline || '').toLowerCase().includes(q) ||
          (p.fabric?.composition || '').toLowerCase().includes(q) ||
          (p.idealFor || []).some((item) => (item || '').toLowerCase().includes(q))
        );
      })
      .slice(0, 5);
  }, [liveProducts, navSearchQuery]);

  // Click outside to close navbar search & desktop popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navSearchRef.current && !navSearchRef.current.contains(e.target as Node)) {
        setIsNavSearchOpen(false);
      }
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setDesktopSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Lock body scroll and listen for Escape key when navigation drawer or preview popups are open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        closeAllHeaderPreviews();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen, servicesDropdownOpen, isNavSearchOpen, cartPreviewOpen, mockupPreviewOpen, sizeGuidePreviewOpen, desktopSearchOpen]);

  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingNavProducts.length > 0) {
        const selected = matchingNavProducts[navHighlightedIndex] || matchingNavProducts[0];
        onSelectProduct?.(selected);
        closeAllHeaderPreviews();
        setNavSearchQuery('');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNavHighlightedIndex((prev) => (prev + 1) % Math.max(1, matchingNavProducts.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNavHighlightedIndex((prev) => (prev - 1 + matchingNavProducts.length) % Math.max(1, matchingNavProducts.length));
    } else if (e.key === 'Escape') {
      closeAllHeaderPreviews();
    }
  };

  const totalItemsCount = quoteItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalCartValue = useMemo(() => {
    return quoteItems.reduce(
      (sum, item) => sum + (item.totalPrice || (item.unitPrice || 0) * item.totalQuantity || 0),
      0
    );
  }, [quoteItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setServicesDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 180);
  };

  // Mega Expansive Services Taxonomy
  const megaManufacturingServices = [
    {
      id: 'academic',
      title: 'Academic & Schoolwear Outfitting',
      description: 'Custom tailored blazers, anti-pill v-neck sweaters, pleated pinafores, sports tracksuits & pique polos.',
      icon: GraduationCap,
      badge: 'Bestseller',
      href: '#catalog',
    },
    {
      id: 'medical',
      title: 'Pro-Flex Healthcare & Medical Scrubs',
      description: 'Antimicrobial 4-way stretch scrub sets, lab coats, theatre tunics & doctor monogramming.',
      icon: HeartPulse,
      badge: 'ISO Grade',
      href: '#catalog',
    },
    {
      id: 'workwear',
      title: 'Heavy Industrial & Hi-Vis Safety Gear',
      description: 'Triple-stitched boiler suits, reflective utility vests, mechanic overalls & security uniforms.',
      icon: HardHat,
      badge: 'Heavy Duty',
      href: '#catalog',
    },
    {
      id: 'hospitality',
      title: 'Hospitality, Culinary & Barista Wear',
      description: 'Executive double-breasted chef jackets, heavy canvas barista aprons & front-desk attire.',
      icon: UtensilsCrossed,
      badge: 'Premium',
      href: '#catalog',
    },
  ];

  const megaBrandingTechniques = [
    {
      id: 'embroidery',
      title: 'Tajima Industrial Embroidery',
      description: '15-needle computerized embroidery, 3D puff stitching, metallic gold thread & crest patches.',
      icon: Scissors,
      badge: 'Signature',
      href: '#services',
    },
    {
      id: 'screen-printing',
      title: 'Plastisol & Screen Printing',
      description: 'High-opacity vibrant prints, eco-waterbase inks, sports numbers & high-volume bulk runs.',
      icon: Printer,
      badge: 'High Volume',
      href: '#services',
    },
    {
      id: 'dtf-transfers',
      title: 'Direct-to-Film (DTF) & Badges',
      description: 'Full-color photographic gradients, ultra-crisp micro crests & flexible activewear transfers.',
      icon: Sparkles,
      badge: 'Photo Crisp',
      href: '#services',
    },
    {
      id: 'labels-crests',
      title: 'Woven Crests & Bullion Badges',
      description: 'Laser-cut damask neck labels, blazer pocket bullion crests & custom metallic badges.',
      icon: Layers,
      badge: 'Custom',
      href: '#services',
    },
  ];

  const megaDigitalAndTurnkey = [
    {
      id: 'mockup-studio',
      title: '3D Interactive Mockup Studio',
      description: 'Live 3D garment visualizer, custom pantone picker, multi-crest placement & vector proofs.',
      icon: SlidersHorizontal,
      badge: 'Interactive',
      isCustomizer: true,
    },
    {
      id: 'quote-estimator',
      title: 'Wholesale Quote & Price Matrix',
      description: 'Instant tiered volume pricing, custom branding calculation & Kenyan PDF invoicing.',
      icon: FileText,
      badge: 'Instant KSh',
      isQuote: true,
    },
    {
      id: 'size-guide',
      title: 'Technical Specs & Size Grading',
      description: 'Detailed GSM fabric compositions, shrinkage tolerances & standard sizing charts.',
      icon: Ruler,
      badge: 'Specs',
      isSizeGuide: true,
    },
    {
      id: 'institutional-contracts',
      title: 'Turn-Key School & Corporate Supply',
      description: 'Annual intake fulfillment, scheduled buffer stock storage & dedicated account managers.',
      icon: ShieldCheck,
      badge: 'End-to-End',
      href: '#contact',
    },
  ];

  return (
    <motion.header
      id="main-navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 ${
        isAnyHeaderPreviewOpen || mobileMenuOpen ? 'z-[100000]' : 'z-[9990]'
      } transition-all duration-200 shadow-[0_4px_25px_rgba(6,22,60,0.6)] ${
        isScrolled
          ? 'bg-[#06163c]/98 backdrop-blur-md py-4 sm:py-5'
          : 'bg-[#06163c] py-6 sm:py-7 md:py-8'
      }`}
    >
      {/* Subtle Luminous Ambient Sheen across Header Bar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Angled Sheen Light Beam */}
        <div className="absolute top-0 bottom-0 -left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/8 via-cyan-100/8 to-transparent animate-scanner-ray pointer-events-none" />
        
        {/* Soft Specular Runner */}
        <div className="absolute top-0 left-0 w-48 sm:w-64 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-cyan-300/40 shadow-[0_0_6px_#38bdf8] animate-scanner-laser-delayed pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo in White / Brand Light Variant - Enlarged with restored subtitle & slogan */}
          <a href="#" className="focus:outline-none flex items-center group shrink-0" aria-label="NASISI Home">
            <NasisiLogo
              size="xl"
              variant="white"
              showTagline={true}
              tagline="We stitch it, You wear it, We print it, you represent."
              className="scale-90 sm:scale-100 origin-left transition-transform"
            />
          </a>

          {/* Desktop Navigation Links: Home, Services (with sub domains dropdown), Products, About, Contact */}
          <nav className={`hidden lg:flex items-center gap-7 ${servicesDropdownOpen ? 'relative z-[100000]' : 'relative z-20'}`}>
            {/* 1. Home */}
            <a
              href="#"
              className="text-sm font-semibold text-blue-100 hover:text-white transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-300 after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Home
            </a>

            {/* 2. Services (with Sub Domains Dropdown) */}
            <div
              className={`relative py-2 ${servicesDropdownOpen ? 'z-[100000]' : 'z-20'}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  const nextState = !servicesDropdownOpen;
                  closeAllHeaderPreviews();
                  setServicesDropdownOpen(nextState);
                }}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors py-1 cursor-pointer ${
                  servicesDropdownOpen ? 'text-white' : 'text-blue-100 hover:text-white'
                }`}
                aria-expanded={servicesDropdownOpen}
                aria-haspopup="true"
              >
                <span>Services</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    servicesDropdownOpen ? 'rotate-180 text-white' : 'text-blue-300'
                  }`}
                />
              </button>

              {/* Mega Expansive Dropdown Menu - Appears on Top of Everything */}
              {servicesDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[99999] bg-slate-950/45 backdrop-blur-xs transition-opacity cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setServicesDropdownOpen(false);
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute top-full -left-52 md:-left-64 lg:-left-72 xl:-left-80 w-[960px] lg:w-[1040px] xl:w-[1140px] max-w-[94vw] bg-white rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.45)] border border-slate-200/90 p-6 transition-all animate-fadeIn z-[100000] mt-3 text-slate-900 overflow-hidden ring-1 ring-black/10"
                    role="menu"
                  >
                  {/* Top Mega Menu Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#06163c] flex items-center justify-center font-bold">
                        <Factory className="w-4 h-4 text-[#06163c]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          NASISI Industrial Manufacturing & Embellishment Atelier
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Nairobi Factory • In-House Computerized Embroidery, Screen Printing & Bespoke Uniform Outfitting
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setServicesDropdownOpen(false);
                          onOpenCustomizer();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#06163c] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Launch 3D Studio</span>
                      </button>
                      <a
                        href="#catalog"
                        onClick={() => setServicesDropdownOpen(false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        <span>All Uniforms</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 4-Column Mega Grid */}
                  <div className="grid grid-cols-12 gap-5">
                    {/* Column 1: Garment Manufacturing */}
                    <div className="col-span-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <Shirt className="w-3.5 h-3.5 text-[#06163c]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#06163c]">
                          Garment Manufacturing
                        </span>
                      </div>
                      <div className="space-y-1">
                        {megaManufacturingServices.map((item) => {
                          const Icon = item.icon;
                          return (
                            <a
                              key={item.id}
                              href={item.href}
                              onClick={() => setServicesDropdownOpen(false)}
                              className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200/80 hover:shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#06163c] text-[#06163c] group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 mt-0.5 shadow-2xs">
                                <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#06163c] transition-colors leading-tight">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#06163c] group-hover:bg-blue-100 rounded transition-colors">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2 mt-0.5 group-hover:text-slate-600 transition-colors">
                                  {item.description}
                                </p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Industrial Branding & Embellishment */}
                    <div className="col-span-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <Palette className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                          Branding & Printing
                        </span>
                      </div>
                      <div className="space-y-1">
                        {megaBrandingTechniques.map((item) => {
                          const Icon = item.icon;
                          return (
                            <a
                              key={item.id}
                              href={item.href}
                              onClick={() => setServicesDropdownOpen(false)}
                              className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200/80 hover:shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-blue-100/70 group-hover:bg-[#06163c] text-[#06163c] group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 mt-0.5 shadow-2xs">
                                <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#06163c] transition-colors leading-tight">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 group-hover:bg-amber-200 rounded transition-colors">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2 mt-0.5 group-hover:text-slate-600 transition-colors">
                                  {item.description}
                                </p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 3: Turn-Key Institutional & Digital */}
                    <div className="col-span-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                          Digital & Turn-Key
                        </span>
                      </div>
                      <div className="space-y-1">
                        {megaDigitalAndTurnkey.map((item) => {
                          const Icon = item.icon;
                          const handleClick = () => {
                            setServicesDropdownOpen(false);
                            if (item.isCustomizer) onOpenCustomizer();
                            else if (item.isQuote) onOpenQuoteModal();
                            else if (item.isSizeGuide) onOpenSizeGuide();
                          };

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={handleClick}
                              className="w-full text-left group flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/80 hover:shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-emerald-100/70 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 mt-0.5 shadow-2xs">
                                <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-tight">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 rounded transition-colors">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 4: Premium Spotlight & Quick Action Card */}
                    <div className="col-span-3 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-b from-[#06163c] via-[#022c57] to-[#011b36] text-white shadow-md relative overflow-hidden">
                      {/* Subtle decorative glow */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-white/15 text-[#D1E0FF] text-[10px] font-extrabold tracking-wide uppercase">
                            Factory Direct
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Active Lines
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-white leading-snug">
                            Bulk Tenders & Institutional Supply
                          </h4>
                          <p className="text-[11px] text-blue-200/90 mt-1 leading-relaxed">
                            Serving 150+ schools, hospitals & corporate brands across Kenya with zero outsourcing.
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-[10.5px] text-blue-100">
                            <Check className="w-3 h-3 text-cyan-300 shrink-0" />
                            <span>5–7 Days Fast-Track Sampling</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-blue-100">
                            <Check className="w-3 h-3 text-cyan-300 shrink-0" />
                            <span>Anti-Pill & Colorfast Guaranteed</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-blue-100">
                            <Check className="w-3 h-3 text-cyan-300 shrink-0" />
                            <span>Custom Crest Digitization</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons inside Spotlight Card */}
                      <div className="relative z-10 space-y-2 pt-3 border-t border-white/15 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setServicesDropdownOpen(false);
                            onOpenCustomizer();
                          }}
                          className="w-full py-2 px-3 bg-[#D1E0FF] hover:bg-[#b8d0ff] text-[#06163c] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Open 3D Mockup Studio</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setServicesDropdownOpen(false);
                            onOpenQuoteModal();
                          }}
                          className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-200" />
                          <span>Instant Price Matrix (KSh)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Mega Menu Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 px-6 rounded-b-3xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Award className="w-3.5 h-3.5 text-[#06163c]" />
                        <span><strong>50,000+</strong> Monthly Production</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span><strong>48-Hour</strong> Free Digital Proofs</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Countrywide Delivery Across Kenya</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">Factory Hotline:</span>
                      <a
                        href="tel:0728102929"
                        className="font-mono font-bold text-[#06163c] hover:underline flex items-center gap-1 text-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#06163c]" />
                        <span>0728102929</span>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

            {/* 3. Products */}
            <a
              href="#catalog"
              className="text-sm font-semibold text-blue-100 hover:text-white transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-300 after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Products
            </a>

            {/* 4. Contact */}
            <a
              href="#contact"
              className="text-sm font-semibold text-blue-100 hover:text-white transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-300 after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Contact
            </a>
          </nav>

          {/* Action CTAs - Right-Side Icon Buttons with Live Preview Windows (Top of Everything) */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 relative z-30">
            {/* 0. Desktop Search Toggle & Live Product Search Preview Window */}
            <div className="relative" ref={desktopSearchRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !desktopSearchOpen;
                  closeAllHeaderPreviews();
                  setDesktopSearchOpen(next);
                }}
                className={`btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                  desktopSearchOpen
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105'
                    : 'bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-90'
                }`}
                aria-label="Search Uniforms & Apparel"
                title="Search Catalog"
              >
                <Search className="w-5 h-5 transition-transform duration-200" />
              </button>

              {/* Desktop Live Search Preview Window - Top of Everything */}
              {desktopSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-88 sm:w-96 bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-slate-200/90 p-4 z-[100000] text-slate-900 animate-fadeIn ring-1 ring-black/10">
                  {/* Pointer arrow */}
                  <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200" />

                  {/* Search Input Bar */}
                  <div className="relative z-10 flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={navSearchQuery}
                      onChange={(e) => {
                        setNavSearchQuery(e.target.value);
                        setNavHighlightedIndex(0);
                      }}
                      onKeyDown={handleNavKeyDown}
                      placeholder="Search blazers, scrubs, overalls, polos..."
                      className="w-full py-1 px-2 bg-transparent text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
                    />
                    {navSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setNavSearchQuery('')}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg mr-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Live Results Preview */}
                  <div className="mt-3 relative z-10">
                    {navSearchQuery.trim() === '' ? (
                      <div className="py-4 px-2 text-center text-[11px] text-slate-400">
                        Type keywords like <span className="text-blue-600 font-bold">blazer</span>,{' '}
                        <span className="text-blue-600 font-bold">scrub</span>,{' '}
                        <span className="text-blue-600 font-bold">chef</span>, or{' '}
                        <span className="text-blue-600 font-bold">cotton</span>.
                      </div>
                    ) : matchingNavProducts.length === 0 ? (
                      <div className="py-5 text-center text-xs text-slate-500 font-medium">
                        No uniforms found matching "{navSearchQuery}".
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1">
                          Matching Uniforms ({matchingNavProducts.length})
                        </div>
                        {matchingNavProducts.map((product, idx) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              onSelectProduct?.(product);
                              closeAllHeaderPreviews();
                              setNavSearchQuery('');
                            }}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer ${
                              idx === navHighlightedIndex
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <img
                              src={product.image || product.images?.[0]}
                              alt={product.name}
                              className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {product.name}
                              </h5>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {product.categoryLabel || product.category} • MOQ: {product.minOrder}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-[#06163c] font-['Outfit'] block">
                                Ksh {product.basePrice.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-emerald-600 font-bold">
                                View Specs
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 1. Size Guide Icon Button with Quick Preview Window */}
            <div
              className="relative"
              onMouseEnter={handleSizeGuideMouseEnter}
              onMouseLeave={handleSizeGuideMouseLeave}
            >
              <button
                id="navbar-size-guide-btn"
                onClick={() => {
                  closeAllHeaderPreviews();
                  onOpenSizeGuide();
                }}
                className={`btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                  sizeGuidePreviewOpen
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105'
                    : 'bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-90'
                }`}
                aria-label="Size Guide & Fabric Specifications"
                title="Size Guide"
              >
                <Ruler className="w-5 h-5 transition-transform duration-200" />
              </button>

              {/* Quick Preview Window - Top of Everything */}
              {sizeGuidePreviewOpen && (
                <div
                  className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 w-84 sm:w-96 bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-slate-200/90 p-5 z-[100000] text-slate-900 animate-fadeIn ring-1 ring-black/10"
                  onMouseEnter={handleSizeGuideMouseEnter}
                  onMouseLeave={handleSizeGuideMouseLeave}
                >
                  {/* Pointer arrow */}
                  <div className="absolute -top-2 right-4 sm:left-1/2 sm:-translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          Size & Fabric Standards
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          East Africa KBS & Institutional Specs
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Standardized
                    </span>
                  </div>

                  {/* Quick Sizing Grid */}
                  <div className="mt-3.5 space-y-2 relative z-10 text-[11px]">
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center font-medium">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Nursery</span>
                        <span className="font-bold text-slate-800">Age 3–6</span>
                        <span className="text-[10px] text-slate-500 block">22"–26" Chest</span>
                      </div>
                      <div className="border-x border-slate-200 px-1">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Primary</span>
                        <span className="font-bold text-slate-800">Age 7–13</span>
                        <span className="text-[10px] text-slate-500 block">28"–34" Chest</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">High / Adult</span>
                        <span className="font-bold text-slate-800">S – 3XL</span>
                        <span className="text-[10px] text-slate-500 block">36"–48"+ Chest</span>
                      </div>
                    </div>

                    {/* Fabric specifications note */}
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2 text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong className="text-blue-900">Anti-Pill & Pre-Shrunk:</strong> Heavy 240–280 GSM pique & wool blends certified for 100+ industrial wash cycles.
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
                    <span className="text-[10px] text-slate-400">Exact measurement charts</span>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllHeaderPreviews();
                        onOpenSizeGuide();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#06163c] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md"
                    >
                      <span>Open Sizing Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Live Mockup Studio Icon Button with Quick Preview Window */}
            <div
              className="relative"
              onMouseEnter={handleMockupMouseEnter}
              onMouseLeave={handleMockupMouseLeave}
            >
              <button
                id="navbar-live-mockup-btn"
                type="button"
                onClick={() => {
                  closeAllHeaderPreviews();
                  onOpenCustomizer();
                }}
                className={`btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                  mockupPreviewOpen
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105'
                    : 'bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-90'
                }`}
                aria-label="Launch 3D Live Mockup Studio"
                title="Live 3D Mockup Studio"
              >
                <Sparkles className="w-5 h-5 transition-transform duration-200" />
              </button>

              {/* Quick Preview Window - Top of Everything */}
              {mockupPreviewOpen && (
                <div
                  className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 w-84 sm:w-96 bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-slate-200/90 p-5 z-[100000] text-slate-900 animate-fadeIn ring-1 ring-black/10"
                  onMouseEnter={handleMockupMouseEnter}
                  onMouseLeave={handleMockupMouseLeave}
                >
                  {/* Pointer arrow */}
                  <div className="absolute -top-2 right-4 sm:left-1/2 sm:-translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          3D Mockup Studio
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Real-Time Digital Garment Visualizer
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Interactive
                    </span>
                  </div>

                  {/* Feature Snapshot */}
                  <div className="mt-3.5 space-y-2.5 relative z-10 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold text-slate-800">Pantone Dyeing</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Shirt className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800">360° Visualizer</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-800">Crest Digitizer</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">Instant Estimate</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Upload your school or corporate crest, change collar/body colorways, and view 3D renders before placing batch production.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
                    <span className="text-[10px] text-slate-400">Zero design fee preview</span>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllHeaderPreviews();
                        onOpenCustomizer();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#06163c] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md"
                    >
                      <span>Launch 3D Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Quote Request / Cart Icon Button with Quick Preview Window */}
            <div
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <button
                id="navbar-quote-cart-btn"
                onClick={() => {
                  closeAllHeaderPreviews();
                  onOpenQuoteModal();
                }}
                className={`btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                  cartPreviewOpen
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105'
                    : 'bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-90'
                }`}
                aria-label="View Quote Cart"
                title="Quote Cart"
              >
                <ShoppingBag className="w-5 h-5 transition-transform duration-200" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-black bg-[#06163c] text-white rounded-full border-2 border-white shadow-md animate-scaleIn">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* Quick Preview Window - Top of Everything */}
              {cartPreviewOpen && (
                <div
                  className="absolute top-full right-0 mt-3 w-88 sm:w-96 bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-slate-200/90 p-5 z-[100000] text-slate-900 animate-fadeIn ring-1 ring-black/10"
                  onMouseEnter={handleCartMouseEnter}
                  onMouseLeave={handleCartMouseLeave}
                >
                  {/* Pointer arrow */}
                  <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          Quote Cart Preview
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'} configured
                        </span>
                      </div>
                    </div>
                    {totalItemsCount > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {quoteItems.length} line(s)
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="mt-3.5 relative z-10">
                    {quoteItems.length === 0 ? (
                      <div className="py-6 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Your quote cart is empty</p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Select uniforms from our catalog or use the 3D customizer to configure bulk school or corporate uniforms.
                        </p>
                        <a
                          href="#catalog"
                          onClick={() => closeAllHeaderPreviews()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <span>Explore Uniform Catalog</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <>
                        {/* Scrollable list of items */}
                        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                          {quoteItems.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                            >
                              <img
                                src={item.product?.image || item.product?.images?.[0]}
                                alt={item.product?.name}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate">
                                  {item.product?.name}
                                </h5>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                  {item.selectedColor && (
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                                      {item.selectedColor}
                                    </span>
                                  )}
                                  <span>Qty: {item.totalQuantity}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-[#06163c] font-['Outfit'] block">
                                  Ksh {(item.totalPrice || (item.unitPrice || 0) * item.totalQuantity || 0).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  @ Ksh {(item.unitPrice || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          {quoteItems.length > 4 && (
                            <p className="text-[10px] text-center font-bold text-slate-400 py-1">
                              + {quoteItems.length - 4} more line item(s) in cart
                            </p>
                          )}
                        </div>

                        {/* Order Subtotal Bar */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Estimated Total
                            </span>
                            <span className="text-base font-black text-[#06163c] font-['Outfit']">
                              Ksh {totalCartValue.toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              closeAllHeaderPreviews();
                              onOpenQuoteModal();
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#06163c] hover:bg-blue-900 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                          >
                            <span>Open Full Estimator</span>
                            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>


            {/* 4. Enterprise ERP / Admin Portal Quick Access */}
            {onOpenAdminERP && (
              <div className="relative group">
                <button
                  id="navbar-admin-erp-btn"
                  type="button"
                  onClick={() => {
                    closeAllHeaderPreviews();
                    onOpenAdminERP();
                  }}
                  className={`btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                    currentUser
                      ? isWhitelistedAdmin
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-sm hover:scale-105'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-sm hover:scale-105'
                      : 'bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-110 hover:-translate-y-0.5 active:scale-90'
                  }`}
                  aria-label="Access ERP Portal"
                  title={currentUser ? (isWhitelistedAdmin ? `ERP Portal: ${currentUser.name}` : `Account: ${currentUser.name}`) : 'Enterprise ERP Portal'}
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : currentUser ? (
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#06163c]" />
                  )}
                  {currentUser && isWhitelistedAdmin && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
                {/* Floating Tooltip */}
                <div className={`absolute top-full right-0 mt-2 px-2.5 py-1 bg-slate-950/95 text-white text-[11px] font-bold rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/70 z-50 transition-all duration-150 ${isAnyHeaderPreviewOpen ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                  <span>{currentUser ? (isWhitelistedAdmin ? `ERP Dashboard (${currentUser.role})` : `Customer Portal (${currentUser.name})`) : 'Admin & Staff ERP Portal'}</span>
                  <div className="absolute -top-1 right-3.5 w-2 h-2 bg-slate-950 rotate-45 border-l border-t border-slate-700/70" />
                </div>
              </div>
            )}

            {/* 5. Desktop Hamburger Menu Toggle Button */}
            <div className="relative group">
              <button
                id="navbar-desktop-hamburger-btn"
                type="button"
                onClick={() => {
                  closeAllHeaderPreviews();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="btn-shimmer-sweep relative flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm hover:shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:scale-110 hover:-translate-y-0.5 active:scale-90 transition-all duration-200 cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                title="Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#06163c] transition-transform duration-200 group-hover:rotate-90" />
                ) : (
                  <Menu className="w-5 h-5 text-[#06163c] transition-transform duration-200 group-hover:scale-115" />
                )}
              </button>
              {/* Floating Tooltip */}
              <div className={`absolute top-full right-0 mt-2 px-2.5 py-1 bg-slate-950/95 text-white text-[11px] font-bold rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/70 z-50 transition-all duration-150 ${isAnyHeaderPreviewOpen ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                <span>{mobileMenuOpen ? 'Close Menu' : 'Navigation & Quick Links'}</span>
                <div className="absolute -top-1 right-3.5 w-2 h-2 bg-slate-950 rotate-45 border-l border-t border-slate-700/70" />
              </div>
            </div>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-quote-btn"
              onClick={() => {
                setServicesDropdownOpen(false);
                setMobileMenuOpen(false);
                onOpenQuoteModal();
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm transition-all active:scale-95 cursor-pointer"
              aria-label="View Quote Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#06163c]" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-[#06163c] text-white rounded-full border-2 border-white shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            <button
              id="mobile-menu-toggle-btn"
              onClick={() => {
                setServicesDropdownOpen(false);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-blue-50 text-[#06163c] border border-white/90 shadow-sm focus:outline-none transition-all active:scale-95 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#06163c]" /> : <Menu className="w-5 h-5 text-[#06163c]" />}
            </button>
          </div>
        </div>

        {/* Responsive Hamburger Navigation Drawer (Full screen on mobile, right slide-over on desktop) */}
        {mobileMenuOpen && createPortal(
          <div className="fixed inset-0 z-[9990] flex justify-end">
            {/* Backdrop for desktop with blur and click-to-close */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative z-10 w-full sm:w-[500px] lg:w-[540px] h-full bg-white text-slate-900 flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
              {/* Header Bar with logo & close */}
              <div className="relative bg-white/95 backdrop-blur-md shrink-0 shadow-xs border-b border-slate-200/80">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <NasisiLogo size="lg" showTagline={true} tagline="We stitch it, You wear it, We print it, you represent." />
                    <span className="px-2 py-0.5 bg-blue-50 text-[#06163c] text-[10px] font-black uppercase rounded-md tracking-wider border border-blue-200">
                      Menu
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenQuoteModal();
                      }}
                      className="relative p-2.5 text-[#06163c] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      aria-label="View Quote Cart"
                      title="Quote Cart"
                    >
                      <ShoppingBag className="w-5 h-5 text-[#06163c]" />
                      {totalItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-[#06163c] text-white rounded-full">
                          {totalItemsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                      aria-label="Close Menu"
                      title="Close Menu (Esc)"
                    >
                      <X className="w-5 h-5 text-slate-800" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 overscroll-contain">
              {/* Mobile Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search uniforms, workwear, scrubs, badges..."
                  value={navSearchQuery}
                  onChange={(e) => {
                    setNavSearchQuery(e.target.value);
                    setIsNavSearchOpen(true);
                  }}
                  className="w-full pl-10 pr-9 py-3 text-xs text-slate-900 placeholder-slate-400 bg-slate-100/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#06163c] focus:bg-white transition-all shadow-2xs"
                />
                {navSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setNavSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-1"
                  >
                    ✕
                  </button>
                )}

                {/* Mobile Search Results */}
                {navSearchQuery.trim().length > 0 && (
                  <div className="mt-2 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 max-h-64 overflow-y-auto">
                    <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                      <span>Matching Uniforms</span>
                      <span className="text-[#06163c] font-bold">{matchingNavProducts.length} items</span>
                    </div>
                    {matchingNavProducts.length === 0 ? (
                      <div className="py-3 text-center text-xs text-slate-500">
                        No products found for "{navSearchQuery}"
                      </div>
                    ) : (
                      matchingNavProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectProduct?.(p);
                            setMobileMenuOpen(false);
                            setNavSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200 cursor-pointer transition-colors"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h6 className="text-xs font-bold text-slate-900 truncate">{p.name}</h6>
                            <span className="text-[10px] text-slate-500 block truncate">{p.categoryLabel}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-[#06163c] block">
                              ${p.price.base.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold uppercase">Ready</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Featured Quick Action Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCustomizer();
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#06163c] to-[#024177] text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-white/15 text-cyan-300 mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">3D Mockup Studio</span>
                    <span className="text-[10px] text-blue-200">Custom crests & colors</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenQuoteModal();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-white/15 text-emerald-400 mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Instant Quote Cart</span>
                    <span className="text-[10px] text-slate-300">{totalItemsCount} items ready</span>
                  </div>
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-3 mb-1 block">
                  Factory Navigation
                </span>

                <a
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <span>Home</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>

                {/* Services Expandable Accordion */}
                <div className="rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-[#06163c]" />
                      <span>Manufacturing Services</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        mobileServicesOpen ? 'rotate-180 text-[#06163c]' : ''
                      }`}
                    />
                  </button>

                  {mobileServicesOpen && (
                    <div className="bg-slate-50 p-3 space-y-3 rounded-xl my-1 border border-slate-200/80">
                      {/* Section 1: Garment Manufacturing */}
                      <div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase text-[#06163c] tracking-wider">
                          <Shirt className="w-3 h-3 text-[#06163c]" />
                          <span>Garment Manufacturing</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {megaManufacturingServices.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <a
                                key={sub.id}
                                href={sub.href}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setMobileServicesOpen(false);
                                }}
                                className="group flex items-start gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#06163c] hover:bg-white rounded-xl hover:shadow-2xs active:scale-98 transition-all"
                              >
                                <SubIcon className="w-4 h-4 text-[#06163c] mt-0.5 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 leading-tight group-hover:text-[#06163c] transition-colors">{sub.title}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{sub.description}</div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Branding & Printing */}
                      <div className="border-t border-slate-200/60 pt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase text-blue-700 tracking-wider">
                          <Palette className="w-3 h-3 text-blue-600" />
                          <span>Industrial Branding</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {megaBrandingTechniques.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <a
                                key={sub.id}
                                href={sub.href}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setMobileServicesOpen(false);
                                }}
                                className="flex items-start gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#06163c] hover:bg-white rounded-lg transition-colors"
                              >
                                <SubIcon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 leading-tight">{sub.title}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{sub.description}</div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 3: Digital & Tools */}
                      <div className="border-t border-slate-200/60 pt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Digital Studio & Pricing</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {megaDigitalAndTurnkey.map((sub) => {
                            const SubIcon = sub.icon;
                            const handleClick = () => {
                              setMobileMenuOpen(false);
                              setMobileServicesOpen(false);
                              if (sub.isCustomizer) onOpenCustomizer();
                              else if (sub.isQuote) onOpenQuoteModal();
                              else if (sub.isSizeGuide) onOpenSizeGuide();
                            };
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={handleClick}
                                className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              >
                                <SubIcon className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 leading-tight">{sub.title}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{sub.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <a
                  href="#catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <span>Uniform Catalog</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <span>Client Portfolio & Gallery</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSizeGuide();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#06163c]" />
                    <span>Size & Fabric Standards</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-slate-800 hover:text-[#06163c] hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <span>Contact Factory</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>

                {onOpenAdminERP && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminERP();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer text-left ${
                      currentUser && isWhitelistedAdmin
                        ? 'bg-amber-100/80 text-amber-950 border border-amber-300'
                        : currentUser
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : 'bg-[#06163c] text-white hover:bg-blue-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${currentUser && isWhitelistedAdmin ? 'text-amber-700' : 'text-sky-400'}`} />
                      <span>{currentUser ? (isWhitelistedAdmin ? `ERP Dashboard (${currentUser.role})` : `My Portal (${currentUser.name})`) : 'Staff & Admin ERP Portal'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                  </button>
                )}
              </div>

              {/* Direct WhatsApp & Hotline Quick Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Factory Desk Direct
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:0728102929"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-[#06163c] shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#06163c]" />
                    <span className="font-mono">0728102929</span>
                  </a>

                  <a
                    href="https://wa.me/254728102929?text=Hello%20NASISI%20Uniforms%2C%20I%20would%20like%20to%20inquire%20about%20an%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Mobile Legal Policy Links */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-around text-[11px] text-slate-500 font-medium">
                  {onOpenPrivacyPolicy && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenPrivacyPolicy();
                      }}
                      className="hover:text-[#06163c] hover:underline"
                    >
                      Privacy
                    </button>
                  )}
                  <span>•</span>
                  {onOpenTerms && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenTerms();
                      }}
                      className="hover:text-[#06163c] hover:underline"
                    >
                      Terms
                    </button>
                  )}
                  <span>•</span>
                  {onOpenCookies && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCookies();
                      }}
                      className="hover:text-[#06163c] hover:underline"
                    >
                      Cookies
                    </button>
                  )}
                  {onOpenLocation && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenLocation();
                        }}
                        className="hover:text-[#06163c] hover:underline font-semibold text-blue-700"
                      >
                        Location
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>

      {/* Clean Wave Curve on the Bottom Edge matching the header bar color */}
      <div className="absolute top-full left-0 right-0 w-full overflow-hidden leading-none pointer-events-none -mt-[1px]">
        <svg
          className="w-full h-7 sm:h-9 md:h-10 lg:h-12 block relative z-10"
          viewBox="0 0 1440 60"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Main wave fill matching header bar color (#06163c) */}
          <path
            d="M0,0 L1440,0 L1440,20 C1040,56 400,-6 0,36 Z"
            fill="#06163c"
          />
        </svg>
      </div>
    </motion.header>
  );
};
