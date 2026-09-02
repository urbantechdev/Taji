import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CategoryType, ProductBatch } from '../../types';
import { useERP } from '../../context/ERPContext';
import { StorefrontProductCard } from './StorefrontProductCard';
import {
  SlidersHorizontal,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

interface StorefrontProductGridProps {
  onOpenQuickView: (product: ProductBatch) => void;
  onAddToCartSuccess?: () => void;
  searchQuery: string;
  selectedCategory: 'all' | CategoryType;
  setSelectedCategory: (cat: 'all' | CategoryType) => void;
}

export const StorefrontProductGrid: React.FC<StorefrontProductGridProps> = ({
  onOpenQuickView,
  onAddToCartSuccess,
  searchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const { products } = useERP();
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [selectedColor, setSelectedColor] = useState<string>('all');

  // Extract unique colors available
  const availableColors = useMemo(() => {
    const map = new Map<string, { name: string; hex?: string }>();
    products.forEach(p => {
      if (p.colorName) {
        map.set(p.colorName.toLowerCase(), { name: p.colorName, hex: p.colorHex });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Filtered & Sorted Product List
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSku = (product.sku || '').toLowerCase().includes(q);
        const matchesCategory = product.category.toLowerCase().includes(q);
        const matchesFiber = (product.fiberComposition || '').toLowerCase().includes(q);
        const matchesColor = (product.colorName || '').toLowerCase().includes(q);
        const matchesSub = (product.subCategory || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCategory && !matchesFiber && !matchesColor && !matchesSub) {
          return false;
        }
      }

      // In stock filter
      const totalStock = Object.values(product.locationStock || {}).reduce((a, b) => a + (b || 0), 0);
      if (inStockOnly && totalStock <= 0) {
        return false;
      }

      // Unit filter
      if (selectedUnit !== 'all' && product.unit !== selectedUnit) {
        return false;
      }

      // Color filter
      if (selectedColor !== 'all' && product.colorName?.toLowerCase() !== selectedColor.toLowerCase()) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.unitPriceRetail || 0) - (b.unitPriceRetail || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.unitPriceRetail || 0) - (a.unitPriceRetail || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [products, selectedCategory, searchQuery, inStockOnly, selectedUnit, selectedColor, sortBy]);

  return (
    <section className="py-8 sm:py-12 bg-slate-50/50 min-h-[600px]" id="storefront-catalog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                Real-Time Synchronized
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Live Factory Batches
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Active Inventory Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Showing {filteredProducts.length} certified textile batches available for immediate purchase or branch collection.
            </p>
          </div>

          {/* Quick Sort & Display Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Category Quick Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-rose-600" />
                <span>Filter:</span>
              </span>
              {(['all', 'Dereck', 'Fleece', 'Yarns'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Secondary Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              {/* In Stock Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>In-Stock Only</span>
              </label>

              {/* Unit of Measurement Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Unit:</span>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="bg-slate-100 px-2 py-1 rounded-lg font-semibold text-slate-800 border border-slate-200 outline-hidden"
                >
                  <option value="all">All Units</option>
                  <option value="meter">Meters (Fabric)</option>
                  <option value="roll">Rolls (Fleece)</option>
                  <option value="kg">KGs (Yarn Cones)</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(selectedCategory !== 'all' || inStockOnly || selectedUnit !== 'all' || selectedColor !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setInStockOnly(false);
                    setSelectedUnit('all');
                    setSelectedColor('all');
                  }}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Color Swatch Quick Strip */}
          {availableColors.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Colors:
              </span>
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${
                  selectedColor === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Colors
              </button>
              {availableColors.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all border ${
                    selectedColor.toLowerCase() === c.name.toLowerCase()
                      ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs"
                    style={{ backgroundColor: c.hex || '#94a3b8' }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                onOpenQuickView={onOpenQuickView}
                onAddToCartSuccess={onAddToCartSuccess}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <Layers className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500">
                We couldn't find any batches matching your current filter criteria or search query.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setInStockOnly(false);
                setSelectedUnit('all');
                setSelectedColor('all');
              }}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
