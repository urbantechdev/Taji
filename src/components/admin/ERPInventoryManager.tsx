import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatKsh } from '../../utils/currency';
import { ERPInventoryItem, UniformProduct } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ERPProductEditModal } from './ERPProductEditModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Trash2,
  Edit2,
  Package,
  Layers,
  Sparkles,
  Globe,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Tag,
  Check,
  Building2,
  DollarSign,
  Shirt,
  Scissors,
} from 'lucide-react';

interface ERPInventoryManagerProps {
  onOpenAddStockModal: () => void;
  onViewOnStorefront?: (productId: string) => void;
}

export const ERPInventoryManager: React.FC<ERPInventoryManagerProps> = ({
  onOpenAddStockModal,
  onViewOnStorefront,
}) => {
  const {
    inventory,
    products,
    adjustStock,
    deleteInventoryItem,
    deleteProduct,
    togglePublishProduct,
    duplicateProduct,
    syncAllProductsToInventory,
    isFirebaseConnected,
  } = useERP();

  const [activeView, setActiveView] = useState<'garments' | 'materials' | 'all'>('garments');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncedNotice, setSyncedNotice] = useState(false);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UniformProduct | null>(null);

  // Calculations
  const totalStockCount = inventory.reduce((sum, i) => sum + i.stockOnHand, 0);
  const totalCostValue = inventory.reduce((sum, i) => sum + i.stockOnHand * i.unitCost, 0);
  const totalSalesValue = inventory.reduce((sum, i) => sum + i.stockOnHand * i.sellingPrice, 0);

  const publishedCount = (products || []).filter((p) => p && p.published !== false).length;
  const draftCount = (products || []).length - publishedCount;

  // Filtered platform garments
  const filteredProducts = (products || []).filter((prod) => {
    if (!prod) return false;
    const matchesCategory = categoryFilter === 'all' || prod.category === categoryFilter;
    const matchesSearch =
      (prod.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.tagline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.location && prod.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.fabric?.composition || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filtered raw materials
  const rawMaterials = inventory.filter((i) => i.category !== 'finished_garment');
  const filteredMaterials = rawMaterials.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Filtered unified inventory items
  const filteredAllItems = inventory.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: UniformProduct) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleDuplicate = (prodId: string) => {
    try {
      const cloned = duplicateProduct(prodId);
      alert(`Created duplicate: ${cloned.name} (${cloned.sku}). Saved as Draft.`);
    } catch {
      alert('Failed to clone product.');
    }
  };

  const handleSyncAll = () => {
    syncAllProductsToInventory();
    setSyncedNotice(true);
    setTimeout(() => setSyncedNotice(false), 3500);
  };

  const handleQuickAdjust = (item: ERPInventoryItem, isAddition: boolean) => {
    const promptDelta = prompt(
      `${isAddition ? 'Add to' : 'Deduct from'} stock for ${item.name} (${item.sku}):`,
      '10'
    );
    if (!promptDelta) return;
    const delta = parseInt(promptDelta);
    if (isNaN(delta) || delta <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    adjustStock(item.id, isAddition ? delta : -delta);
  };

  return (
    <div className="space-y-6">
      {/* Synchronization Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#06163c] via-blue-900 to-indigo-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm font-['Outfit']">
                Storefront & Factory Inventory Real-Time Sync Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30">
                100% LIVE SYNCED
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                isFirebaseConnected 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isFirebaseConnected ? 'Firestore DB Connected' : 'Firestore DB Ready'}
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Any creation, edit, price adjustment, or deletion updates both the client-facing storefront and ERP inventory immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSyncAll}
            className="px-3.5 py-2 bg-blue-600/40 hover:bg-blue-600/70 border border-blue-400/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{syncedNotice ? '✓ Synced!' : 'Force Re-Sync All'}</span>
          </button>

          <button
            onClick={handleOpenCreateProduct}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Garment</span>
          </button>
        </div>
      </div>

      {/* Valuation & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 hover:border-blue-300 transition-all duration-300"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Inventory Valuation (Selling)
          </span>
          <span className="text-2xl font-black text-[#06163c] font-['Outfit'] block">
            {formatKsh(totalSalesValue)}
          </span>
          <span className="text-[11px] text-slate-500">Cost Basis: {formatKsh(totalCostValue)}</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 hover:border-blue-300 transition-all duration-300"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Platform Catalog Products
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-['Outfit'] block">
              {products.length} Items
            </span>
            <span className="text-xs text-emerald-600 font-bold">({publishedCount} Live)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {draftCount > 0 ? `${draftCount} drafts hidden from client store` : 'All items published to storefront'}
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 hover:border-amber-300 transition-all duration-300"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Low Stock Reorder Alerts
          </span>
          <span className="text-2xl font-black text-amber-600 font-['Outfit'] block">
            {inventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length} Items
          </span>
          <span className="text-[11px] text-amber-700">Requires factory batch replenishment</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 hover:border-blue-300 transition-all duration-300"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Warehouse Units
          </span>
          <span className="text-2xl font-black text-blue-700 font-['Outfit'] block">
            {totalStockCount.toLocaleString()} units
          </span>
          <span className="text-[11px] text-slate-500">Across {inventory.length} distinct SKUs</span>
        </motion.div>
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all duration-300"
      >
        {/* Top Controls: View Switcher & Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-slate-200">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveView('garments');
                setCategoryFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'garments'
                  ? 'bg-[#06163c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Platform Garments Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveView('materials');
                setCategoryFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'materials'
                  ? 'bg-[#06163c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Raw Materials & Trims ({rawMaterials.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveView('all');
                setCategoryFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'all'
                  ? 'bg-[#06163c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>All Inventory SKUs ({inventory.length})</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenCreateProduct}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#06163c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Garment Product</span>
            </button>

            <button
              onClick={onOpenAddStockModal}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Raw Material / SKU</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeView === 'garments'
                  ? 'Search by Garment Name, SKU, Tagline, Category, or Fabric...'
                  : 'Search by SKU, Material name, Shelf location or Supplier...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Category Chips for Garments */}
          {activeView === 'garments' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'all', label: 'All Garments' },
                { id: 'safety_industrial', label: 'Safety & Industrial' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'school', label: 'School' },
                { id: 'security', label: 'Security' },
                { id: 'healthcare', label: 'Healthcare' },
                { id: 'hospitality', label: 'Hospitality' },
                { id: 'promotional', label: 'Promotional' },
                { id: 'sportswear', label: 'Sportswear' },
                { id: 'specialized_workwear', label: 'Specialized' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-[#06163c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Category Chips for Materials */}
          {activeView === 'materials' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'all', label: 'All Materials' },
                { id: 'raw_fabric', label: 'Raw Fabrics' },
                { id: 'yarn_knit', label: 'Knitwear Yarn' },
                { id: 'accessories', label: 'Trims & Embroidery' },
                { id: 'packaging', label: 'Packaging' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-[#06163c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. VIEW: PLATFORM GARMENTS CATALOG */}
        {activeView === 'garments' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Garment & Image</th>
                  <th className="py-3 px-3">Category & SKU</th>
                  <th className="py-3 px-3 text-center">Storefront Status</th>
                  <th className="py-3 px-3 text-center">Stock on Hand</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">Cost Basis</th>
                  <th className="py-3 px-3">Warehouse Bay</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No catalog garments found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Image & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={(prod.images && prod.images[0]) || prod.image}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            {prod.images && prod.images.length > 1 && (
                              <span
                                className="absolute -bottom-1 -right-1 bg-[#06163c] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs"
                                title={`${prod.images.length} product gallery images`}
                              >
                                {prod.images.length}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                                {prod.name}
                              </span>
                              {prod.badge && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 line-clamp-1 block">
                              {prod.tagline || ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & SKU */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 uppercase block w-fit">
                          {prod.categoryLabel}
                        </span>
                        <span className="font-mono text-slate-500 text-[10px] mt-1 block">
                          {prod.sku || `SKU-${prod.id.toUpperCase()}`}
                        </span>
                      </td>

                      {/* Storefront Status Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => togglePublishProduct(prod.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1 cursor-pointer ${
                            prod.published !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                          }`}
                          title="Click to toggle between Published & Draft on customer storefront"
                        >
                          {prod.published !== false ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Stock on Hand */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-black text-xs text-slate-900">
                          {prod.stockOnHand ?? 50} pcs
                        </div>
                        <span className="text-[10px] text-blue-600 font-medium">
                          {prod.stockReserved ? `${prod.stockReserved} reserved` : '0 reserved'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                        {formatKsh(prod.basePrice)}
                      </td>

                      {/* Cost Basis */}
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-xs">
                        {formatKsh(prod.unitCost || Math.round(prod.basePrice * 0.58))}
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-3 px-3 text-[11px] text-slate-600 font-medium">
                        {prod.location || 'Warehouse Bay A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewOnStorefront && (
                            <button
                              onClick={() => onViewOnStorefront(prod.id)}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              title="View this Garment live on Storefront"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            title="Edit Garment Specifications, Colors & Prices"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(prod.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            title="Duplicate Product SKU"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete ${prod.name} from platform catalog and inventory?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Garment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. VIEW: RAW MATERIALS & WAREHOUSE SKUS */}
        {activeView === 'materials' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Material / SKU Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Stock on Hand</th>
                  <th className="py-3 px-3 text-center">Allocated</th>
                  <th className="py-3 px-3 text-right">Unit Cost (Ksh)</th>
                  <th className="py-3 px-3 text-right">Selling Value (Ksh)</th>
                  <th className="py-3 px-3">Location & Supplier</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Stock Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No raw materials found.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block group-hover:text-blue-900 transition-colors">
                          {item.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px] block">
                          SKU: {item.sku} {item.color && `• Color: ${item.color}`}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 uppercase">
                          {item.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-black text-xs text-slate-900">
                        {item.stockOnHand} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-xs text-blue-700 font-bold">
                        {item.stockReserved}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatKsh(item.unitCost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatKsh(item.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        <span className="font-semibold block">{item.location}</span>
                        <span className="text-slate-400 text-[10px]">{item.supplier || 'Rivatex / Local Mills'}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'low_stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickAdjust(item, true)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs cursor-pointer"
                            title="Restock (+ Units)"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(item, false)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs cursor-pointer"
                            title="Issue to Factory (- Units)"
                          >
                            - Issue
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${item.name}?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. VIEW: ALL INVENTORY ITEMS (UNIFIED LEDGER) */}
        {activeView === 'all' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">SKU / Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Stock on Hand</th>
                  <th className="py-3 px-3 text-center">Reserved</th>
                  <th className="py-3 px-3 text-right">Cost (Ksh)</th>
                  <th className="py-3 px-3 text-right">Selling (Ksh)</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAllItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  filteredAllItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block group-hover:text-blue-900 transition-colors">
                          {item.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px] block">
                          SKU: {item.sku} {item.size && `• Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 uppercase">
                          {item.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-black text-xs text-slate-900">
                        {item.stockOnHand} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-xs text-blue-700 font-bold">
                        {item.stockReserved}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatKsh(item.unitCost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatKsh(item.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        {item.location}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'low_stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickAdjust(item, true)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs cursor-pointer"
                            title="Restock (+ Units)"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(item, false)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs cursor-pointer"
                            title="Issue to Factory (- Units)"
                          >
                            - Issue
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${item.name}?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Product Edit & Create Modal */}
      <ERPProductEditModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        onViewOnStorefront={onViewOnStorefront}
      />
    </div>
  );
};
