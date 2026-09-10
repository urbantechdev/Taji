import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ShoppingBag, ArrowRight, Sparkles, Tag, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_PRODUCTS, formatPriceDisplay, getColorHex, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface HeroSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddToCart?: (product: any) => void;
  isHeroCollapsed?: boolean;
  onSearchActiveChange?: (isActive: boolean) => void;
}

const POPULAR_SUGGESTIONS = [
  'Security Uniforms',
  'Heavy Duty Overalls',
  'Cotton Polo Shirts',
  'Executive Chef Jackets',
  'Reflective Safety Vests',
  'Hospital Scrubs & Lab Coats',
  'School Sweaters',
  'Tactical Combat Trousers',
  'Corporate Oxford Shirts',
  'Fleece Jackets & Hoodies'
];

export default function HeroSearch({ 
  searchQuery, 
  setSearchQuery, 
  onAddToCart,
  isHeroCollapsed = false,
  onSearchActiveChange
}: HeroSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent on focus/typing
  const handleFocus = () => {
    setIsOpen(true);
    // Keep hero expanded so upward reveal has ample canvas
    onSearchActiveChange?.(false);
  };

  const handleRestoreHero = () => {
    setIsOpen(false);
    onSearchActiveChange?.(false);
    inputRef.current?.blur();
  };

  // Load Firestore products to merge with default catalogue
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
    }, (err) => {
      console.warn("HeroSearch: using default products fallback", err);
    });
    return () => unsubscribe();
  }, []);

  // Use only user-uploaded Firestore products
  const allProducts = useMemo(() => {
    return products.filter(p => p && !p.isDeleted);
  }, [products]);

  // Matching products based on search query
  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [allProducts, searchQuery]);

  // Autocomplete suggestions based on query
  const matchingSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_SUGGESTIONS.slice(0, 5);
    const q = searchQuery.toLowerCase().trim();
    const suggestions: string[] = [];

    // Check popular suggestions
    POPULAR_SUGGESTIONS.forEach(s => {
      if (s.toLowerCase().includes(q) && !suggestions.includes(s)) {
        suggestions.push(s);
      }
    });

    // Check product categories
    const categories = Array.from(new Set(allProducts.map(p => p.category))).filter(Boolean);
    categories.forEach(cat => {
      if (cat.toLowerCase().includes(q) && !suggestions.includes(cat)) {
        suggestions.push(cat);
      }
    });

    // Check product titles
    allProducts.forEach(p => {
      if (p.name && p.name.toLowerCase().includes(q) && !suggestions.includes(p.name)) {
        suggestions.push(p.name);
      }
    });

    return suggestions.slice(0, 6);
  }, [allProducts, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onSearchActiveChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onSearchActiveChange]);

  const handleSelectSuggestion = (text: string) => {
    setSearchQuery(text);
    setIsOpen(false);
    onSearchActiveChange?.(false);
    inputRef.current?.blur();
    // Smooth scroll to catalogue to display results
    setTimeout(() => {
      const el = document.getElementById('categories') || document.getElementById('catalogue');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      onSearchActiveChange?.(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && matchingSuggestions[highlightedIndex]) {
        handleSelectSuggestion(matchingSuggestions[highlightedIndex]);
      } else {
        setIsOpen(false);
        onSearchActiveChange?.(false);
        inputRef.current?.blur();
        const el = document.getElementById('categories') || document.getElementById('catalogue');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, matchingSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    }
  };

  return (
    <section 
      className={cn(
        "relative z-40 max-w-3xl mx-auto px-4 transition-all duration-500 ease-in-out",
        isHeroCollapsed ? "mt-1 sm:mt-2 mb-1.5 sm:mb-3" : "mt-1.5 sm:mt-2.5 mb-2 sm:mb-6"
      )} 
      ref={containerRef}
    >
      <div className="relative w-full">
        {/* Mobile/Tablet Collapse State Notice & 1-Tap Restore Header Button */}
        {isHeroCollapsed && (
          <div className="flex items-center justify-between px-1.5 pb-2 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[11px] font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
              Direct Factory Search Mode
            </span>
            <button
              type="button"
              onClick={handleRestoreHero}
              className="text-[11px] font-black text-brand-orange hover:text-brand-blue uppercase tracking-wider flex items-center gap-1 bg-brand-orange/10 hover:bg-brand-orange/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              ▲ Restore Hero
            </button>
          </div>
        )}

        {/* Search Input Box */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-slate-400 group-focus-within:text-brand-orange transition-colors">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={handleFocus}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search factory apparel, uniforms, overalls, safety wear..."
            className="w-full pl-12 pr-28 py-3.5 sm:py-4 bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 font-bold text-sm sm:text-base text-brand-blue placeholder:text-slate-400 focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsOpen(false);
                  onSearchActiveChange?.(false);
                  inputRef.current?.focus();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!searchQuery && (
              <span className="hidden sm:inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Live Search
              </span>
            )}
          </div>
        </div>

        {/* Live Search Autofill & Product Results Dropdown (Reveals upward) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom center' }}
              className="absolute left-0 right-0 bottom-full mb-3.5 bg-white/98 backdrop-blur-md rounded-3xl shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.2)] border-2 border-slate-200/90 overflow-hidden z-50 divide-y divide-slate-100 max-h-[68vh] sm:max-h-[75vh] flex flex-col"
            >
              {/* Header Suggestions Bar */}
              <div className="p-4 bg-slate-50/90 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  <span className="text-[11px] font-black text-brand-blue uppercase tracking-wider">
                    {searchQuery.trim() ? `Search Autofill for "${searchQuery}"` : 'Popular Factory Categories & Products'}
                  </span>
                </div>
                {searchQuery.trim() && (
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {matchingProducts.length} {matchingProducts.length === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>

              {/* Scrollable Container */}
              <div className="overflow-y-auto p-4 space-y-4 flex-1">
                {/* 1. Quick Autofill Pills */}
                {matchingSuggestions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Suggested Terms
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {matchingSuggestions.map((term, idx) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleSelectSuggestion(term)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 border",
                            highlightedIndex === idx 
                              ? "bg-brand-blue text-white border-brand-blue shadow-xs" 
                              : "bg-slate-50 hover:bg-brand-orange/10 text-slate-700 hover:text-brand-orange border-slate-200 hover:border-brand-orange/30"
                          )}
                        >
                          <Tag className="w-3 h-3 opacity-60" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Direct Matching Product Cards */}
                {matchingProducts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                        Matching Catalog Garments
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(searchQuery)}
                        className="text-[10px] font-black text-brand-orange hover:underline uppercase flex items-center gap-1"
                      >
                        View in Catalog <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchingProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectSuggestion(prod.name)}
                          className="p-2.5 rounded-2xl border border-slate-100 hover:border-brand-orange/40 bg-slate-50/60 hover:bg-white transition-all flex items-center gap-3 cursor-pointer group shadow-xs hover:shadow-md"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                            <img
                              referrerPolicy="no-referrer"
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-brand-orange uppercase tracking-wider block truncate">
                              {prod.category}
                            </span>
                            <h4 className="text-xs font-black text-brand-blue truncate uppercase mt-0.5">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] font-mono font-bold text-slate-700 mt-0.5">
                              {formatPriceDisplay(prod)}
                            </p>
                          </div>

                          {onAddToCart && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onSearchActiveChange?.(false);
                                onAddToCart(prod);
                              }}
                              className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center hover:bg-brand-orange/90 active:scale-95 transition-all shrink-0 shadow-sm"
                              title="Add to Cart with size & branding configuration"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* If searching with no matches */}
                {searchQuery.trim() && matchingProducts.length === 0 && matchingSuggestions.length === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">No products match "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsOpen(false);
                        onSearchActiveChange?.(false);
                      }}
                      className="mt-3 text-[11px] font-black text-brand-orange uppercase hover:underline"
                    >
                      Show all products
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Action */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Press <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">Enter</kbd> to search
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSearchActiveChange?.(false);
                    const el = document.getElementById('categories') || document.getElementById('catalogue');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[10px] font-black text-brand-blue hover:text-brand-orange uppercase tracking-wider flex items-center gap-1"
                >
                  Explore Complete Catalogue <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
