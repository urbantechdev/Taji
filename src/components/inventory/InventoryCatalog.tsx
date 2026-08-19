import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, ProductBatch, UnitType } from '../../types';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { CategoryIntakeModal } from './CategoryIntakeModal';
import {
  Layers,
  Search,
  Plus,
  QrCode,
  Filter,
  Sparkles,
  Printer,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Warehouse,
  Store,
  Flame,
  Tag,
  ArrowRight,
  TrendingDown,
  Zap,
  Barcode,
  Truck,
  DollarSign
} from 'lucide-react';

export const InventoryCatalog: React.FC = () => {
  const {
    products,
    orders,
    locations,
    addProductBatch,
    requestRestock,
    updateProductPrice,
    createDirectDispatchTransfer,
    getTotalAssetValuation,
    setIsQRScannerOpen,
    handleQRScan
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'main_store_low' | 'sales_shop_low' | 'dead_stock'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchModal, setActiveBatchModal] = useState<ProductBatch | null>(null);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isReceiveDeliveryOpen, setIsReceiveDeliveryOpen] = useState(false);
  const [isCategoryIntakeOpen, setIsCategoryIntakeOpen] = useState(false);
  const [categoryIntakeCategory, setCategoryIntakeCategory] = useState<CategoryType>('Dereck');

  // Price Markdown Modal State for Dead Stock Clearance
  const [discountModalBatch, setDiscountModalBatch] = useState<ProductBatch | null>(null);
  const [newPromoPrice, setNewPromoPrice] = useState<number>(1000);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New Batch Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Dereck');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newComposition, setNewComposition] = useState('100% Cotton');
  const [newColorName, setNewColorName] = useState('Crimson Red');
  const [newColorHex, setNewColorHex] = useState('#E91E63');
  const [newUnit, setNewUnit] = useState<UnitType>('meter');
  const [newRetailPrice, setNewRetailPrice] = useState(1200);
  const [newBulkPrice, setNewBulkPrice] = useState(950);
  const [newCostPrice, setNewCostPrice] = useState(600);
  const [newMinLevel, setNewMinLevel] = useState(50);
  const [newMainStock, setNewMainStock] = useState(300);

  // Low stock counts
  const mainStoreLowCount = products.filter(p => p.locationStock.main_store <= p.minReorderLevel).length;
  const salesShopLowCount = products.filter(p => p.locationStock.sales_shop <= p.minReorderLevel).length;

  // Dead Stock calculation (Items with total stock > 0 but 0 sales in order history)
  const deadStockProducts = products.filter(p => {
    const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
    if (totalStock <= 0) return false;
    const unitsSold = orders.reduce((acc, order) => {
      if (order.status !== 'completed') return acc;
      const item = order.items.find(i => i.batchId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return unitsSold === 0;
  });

  const deadStockCount = deadStockProducts.length;
  const deadStockCapital = deadStockProducts.reduce((acc, p) => {
    const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
    return acc + totalStock * p.costPrice;
  }, 0);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.colorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fiberComposition.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStock = true;
    if (stockFilter === 'main_store_low') {
      matchesStock = p.locationStock.main_store <= p.minReorderLevel;
    } else if (stockFilter === 'sales_shop_low') {
      matchesStock = p.locationStock.sales_shop <= p.minReorderLevel;
    } else if (stockFilter === 'dead_stock') {
      const totalStock = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
      const unitsSold = orders.reduce((acc, order) => {
        if (order.status !== 'completed') return acc;
        const item = order.items.find(i => i.batchId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      matchesStock = totalStock > 0 && unitsSold === 0;
    }

    return matchesCat && matchesQuery && matchesStock;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSku) return;

    addProductBatch({
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory,
      subCategory: newSubCategory || `${newCategory} Specialty`,
      fiberComposition: newComposition,
      colorName: newColorName,
      colorHex: newColorHex,
      unit: newUnit,
      unitPriceRetail: Number(newRetailPrice),
      unitPriceBulk: Number(newBulkPrice),
      costPrice: Number(newCostPrice),
      locationStock: {
        main_store: Number(newMainStock),
        sales_shop: 50,
        store_1: 20,
        store_2: 15
      },
      minReorderLevel: Number(newMinLevel)
    });

    setIsAddBatchModalOpen(false);
    // Reset Form
    setNewName('');
    setNewSku('');
  };

  const totalAssetValuation = getTotalAssetValuation();

  return (
    <div className="space-y-6">

      {/* Dynamic Asset Valuation Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-4 rounded-2xl text-white shadow-md border border-rose-500/20">
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Catalog Batches</span>
          <span className="text-base sm:text-lg font-mono font-bold text-white">{products.length} Batches</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Physical Stock Units</span>
          <span className="text-base sm:text-lg font-mono font-bold text-amber-400">{totalAssetValuation.totalUnits.toLocaleString()} units</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost Asset Valuation</span>
          <span className="text-base sm:text-lg font-mono font-bold text-rose-300">KSh {totalAssetValuation.totalCostValuation.toLocaleString()}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Retail Asset Valuation</span>
          <span className="text-base sm:text-lg font-mono font-black text-emerald-400">KSh {totalAssetValuation.totalRetailValuation.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Top Header & Search Controls */}
      <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 group">
        <RightEdgeBlend variant="sunset" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-lg">
                Textile Batch Catalog &amp; Color System
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact Hex Color Codes (#E91E63 Crimson, #9C27B0 Plum, #00BCD4 Teal) &amp; Barcode / QR Tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCategoryIntakeCategory(selectedCategory !== 'All' ? selectedCategory : 'Dereck');
                setIsCategoryIntakeOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-700 via-pink-700 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102 ring-2 ring-rose-500/20"
              title="Category Barcode Scanner Intake Mode for Fleeces, Dereec & Yarns"
            >
              <Barcode className="w-4 h-4 text-amber-300" />
              <span>Category Intake (Yarns, Fleeces, Dereec)</span>
            </button>

            <button
              onClick={() => setIsReceiveDeliveryOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Barcode Scanner Intake Mode for Delivery Manifests"
            >
              <Truck className="w-4 h-4 text-rose-400" />
              <span>Receive Delivery</span>
            </button>

            <button
              onClick={() => setIsAddBatchModalOpen(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Batch</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            {(['All', 'Dereck', 'Fleece', 'Yarns'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                {cat === 'Dereck' ? 'Dereec (Dereck)' : cat === 'Fleece' ? 'Fleeces' : cat}
              </button>
            ))}

            {/* Quick Category Scanner Shortcut for the currently filtered category */}
            {selectedCategory !== 'All' && (
              <button
                onClick={() => {
                  setCategoryIntakeCategory(selectedCategory);
                  setIsCategoryIntakeOpen(true);
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer ml-1 animate-fade-in shadow-xs"
                title={`Initiate batch scanning intake for ${selectedCategory}`}
              >
                <Barcode className="w-3.5 h-3.5 text-amber-700" />
                <span>Scan {selectedCategory === 'Dereck' ? 'Dereec' : selectedCategory} Intake</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Stock Alert Specific Filters */}
            <button
              onClick={() => setStockFilter(stockFilter === 'main_store_low' ? 'All' : 'main_store_low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                stockFilter === 'main_store_low'
                  ? 'bg-slate-900 text-rose-400 border-slate-800 shadow-xs'
                  : mainStoreLowCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5 text-rose-500" />
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Main Store Low ({mainStoreLowCount})</span>
            </button>

            <button
              onClick={() => setStockFilter(stockFilter === 'sales_shop_low' ? 'All' : 'sales_shop_low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                stockFilter === 'sales_shop_low'
                  ? 'bg-pink-900 text-pink-200 border-pink-800 shadow-xs'
                  : salesShopLowCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Shop Low ({salesShopLowCount})</span>
            </button>

            {/* Dead Stock Alert Filter Button */}
            <button
              onClick={() => setStockFilter(stockFilter === 'dead_stock' ? 'All' : 'dead_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                stockFilter === 'dead_stock'
                  ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-700 shadow-md ring-2 ring-purple-500'
                  : deadStockCount > 0
                  ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 animate-pulse'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Dead Stock Alert ({deadStockCount})</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, color name, or fiber..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Dead Stock Alert Banner */}
      {stockFilter === 'dead_stock' && (
        <div className="p-4 bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Flame className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-purple-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dead Stock &amp; Stagnant Capital Clearance Hub</span>
              </h4>
              <p className="text-xs text-purple-200">
                {deadStockCount} inventory batches have recorded 0 sales • Total Tied-Up Capital: <strong className="text-amber-300 font-mono font-bold">KSh {deadStockCapital.toLocaleString()}</strong>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200 px-3 py-1 rounded-full shrink-0">
            Capital Protection Mode
          </span>
        </div>
      )}

      {/* Product Catalog Table */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-rose-100 shadow-xs group">
        <RightEdgeBlend variant="rainbow" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Color &amp; Swatch</th>
                <th className="p-4">Product Batch / SKU</th>
                <th className="p-4">Category / Composition</th>
                <th className="p-4">Prices (KSh)</th>
                <th className="p-4 text-center">Main Store</th>
                <th className="p-4 text-center">Sales Shop</th>
                <th className="p-4 text-center">Store 1</th>
                <th className="p-4 text-center">Store 2</th>
                <th className="p-4 text-right">Batch QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredProducts.map(p => {
                const totalStock = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);

                return (
                  <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                    
                    {/* Color Swatch & Code */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-xl border border-slate-200 shadow-sm shrink-0"
                          style={{ backgroundColor: p.colorHex }}
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{p.colorName}</p>
                          <p className="font-mono text-[10px] text-slate-500">{p.colorHex}</p>
                        </div>
                      </div>
                    </td>

                    {/* Product Name & SKU */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <Layers className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="font-mono text-[10px] text-slate-500">{p.sku} • {p.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Fiber & Subcategory */}
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 mb-0.5">
                        {p.category} ({p.subCategory})
                      </span>
                      <p className="text-[11px] text-slate-500">{p.fiberComposition}</p>
                    </td>

                    {/* Prices */}
                    <td className="p-4 font-mono">
                      <p className="font-bold text-rose-700">Retail: {p.unitPriceRetail.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-600">Bulk: {p.unitPriceBulk.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">Cost: {p.costPrice.toLocaleString()}</p>
                    </td>

                    {/* Main Store Stock */}
                    <td className="p-4 text-center font-mono">
                      {p.locationStock.main_store <= p.minReorderLevel ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-rose-700">{p.locationStock.main_store} {p.unit}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300 mt-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600 animate-bounce" />
                            Low Hub (Min {p.minReorderLevel})
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">{p.locationStock.main_store} {p.unit}</span>
                      )}
                    </td>

                    {/* Sales Shop Stock */}
                    <td className="p-4 text-center font-mono">
                      {p.locationStock.sales_shop <= p.minReorderLevel ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-amber-800">{p.locationStock.sales_shop} {p.unit}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 mt-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600 animate-bounce" />
                            Low Shop (Min {p.minReorderLevel})
                          </span>
                          <button
                            onClick={() => {
                              requestRestock(
                                [{ batchId: p.id, quantity: p.minReorderLevel * 2 }],
                                `Restock Request for ${p.name} at Sales Shop`
                              );
                            }}
                            className="mt-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Request
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">{p.locationStock.sales_shop} {p.unit}</span>
                      )}
                    </td>

                    {/* Store 1 Stock */}
                    <td className="p-4 text-center font-mono font-bold text-slate-800">
                      {p.locationStock.store_1} {p.unit}
                    </td>

                    {/* Store 2 Stock */}
                    <td className="p-4 text-center font-mono font-bold text-slate-800">
                      {p.locationStock.store_2} {p.unit}
                    </td>

                    {/* QR Code Trigger Button */}
                    <td className="p-4 text-right space-y-1">
                      <button
                        onClick={() => setActiveBatchModal(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-rose-600" />
                        View QR
                      </button>

                      {/* Dead Stock Flash Clearance Discount Button */}
                      {deadStockProducts.some(dp => dp.id === p.id) && (
                        <button
                          onClick={() => {
                            setDiscountModalBatch(p);
                            setNewPromoPrice(Math.round(p.unitPriceRetail * 0.8));
                          }}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 w-full text-center cursor-pointer mt-1"
                        >
                          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>Flash Discount</span>
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BATCH QR CODE GENERATOR & TAG MODAL */}
      {activeBatchModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-sm w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border-0 sm:border border-rose-100 animate-in fade-in zoom-in duration-200 overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Product Batch QR Tag
                  </h3>
                </div>
                <button
                  onClick={() => setActiveBatchModal(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable QR Tag Card */}
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 space-y-3 text-center">
                {activeBatchModal.imageUrl && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                    <img
                      src={activeBatchModal.imageUrl}
                      alt={activeBatchModal.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: activeBatchModal.colorHex }}
                      title={activeBatchModal.colorName}
                    />
                  </div>
                )}
                {!activeBatchModal.imageUrl && (
                  <div
                    className="w-10 h-10 rounded-full mx-auto border-2 border-white shadow-md"
                    style={{ backgroundColor: activeBatchModal.colorHex }}
                  />
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {activeBatchModal.name}
                  </h4>
                  <p className="text-xs text-rose-700 font-semibold">
                    {activeBatchModal.colorName} ({activeBatchModal.colorHex})
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    SKU: {activeBatchModal.sku} • ID: {activeBatchModal.id}
                  </p>
                </div>

                {/* QR Code Payload Simulation */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-xs">
                  <QrCode className="w-24 h-24 mx-auto text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">
                    Scannable Batch QR Token
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <p>Fiber: {activeBatchModal.fiberComposition}</p>
                  <p>Retail: KSh {activeBatchModal.unitPriceRetail} / {activeBatchModal.unit}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Batch Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT BATCH MODAL */}
      {isAddBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-lg w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border-0 sm:border border-rose-100 animate-in fade-in zoom-in duration-200 overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-bold text-slate-900 text-base">
                Catalog New Textile Batch
              </h3>
              <button
                onClick={() => setIsAddBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code:</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    placeholder="e.g. DRK-CRIMSON-220"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as CategoryType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Dereck">Dereck</option>
                    <option value="Fleece">Fleece</option>
                    <option value="Yarns">Yarns</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Batch Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Heavy Dereck Suiting Weave"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Name:</label>
                  <input
                    type="text"
                    required
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    placeholder="e.g. Crimson Red"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hex Color Code:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fiber Composition:</label>
                  <input
                    type="text"
                    value={newComposition}
                    onChange={e => setNewComposition(e.target.value)}
                    placeholder="e.g. 80% Wool, 20% Polyester"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Type:</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="meter">Meter</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="roll">Roll</option>
                    <option value="skein">Skein</option>
                    <option value="yard">Yard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retail Price (KSh):</label>
                  <input
                    type="number"
                    value={newRetailPrice}
                    onChange={e => setNewRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bulk Price (KSh):</label>
                  <input
                    type="number"
                    value={newBulkPrice}
                    onChange={e => setNewBulkPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price (KSh):</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={e => setNewCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBatchModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  Catalog Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLASH DISCOUNT PROMOTIONAL MODAL FOR DEAD STOCK */}
      {discountModalBatch && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-md w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border-0 sm:border border-purple-200 animate-scaleUp overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Dead Stock Flash Price Clearance
                  </h3>
                </div>
                <button
                  onClick={() => setDiscountModalBatch(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-1">
                <p className="font-extrabold text-purple-950">{discountModalBatch.name} ({discountModalBatch.sku})</p>
                <p className="text-[11px] text-purple-800">
                  Current Retail Price: <strong>KSh {discountModalBatch.unitPriceRetail.toLocaleString()}</strong>
                </p>
                <p className="text-[10px] text-purple-700">Cost Price Base: KSh {discountModalBatch.costPrice.toLocaleString()}</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-700 block">Preset Discount Percentages:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 40].map(pct => {
                    const promo = Math.round(discountModalBatch.unitPriceRetail * (1 - pct / 100));
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setNewPromoPrice(promo)}
                        className={`py-2 px-1 rounded-xl font-bold border text-xs cursor-pointer transition-all ${
                          newPromoPrice === promo
                            ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-purple-100'
                        }`}
                      >
                        -{pct}% Off<br />
                        <span className="text-[10px] font-mono">KSh {promo}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Promotional Retail Price (KSh):</label>
                  <input
                    type="number"
                    value={newPromoPrice}
                    onChange={e => setNewPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-extrabold text-sm text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDiscountModalBatch(null)}
                className="w-1/2 sm:w-auto px-4 py-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateProductPrice(discountModalBatch.id, newPromoPrice);
                  setDiscountModalBatch(null);
                }}
                className="w-1/2 sm:w-auto px-5 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                Apply Promotional Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Delivery Barcode Intake Modal */}
      <ReceiveDeliveryModal
        isOpen={isReceiveDeliveryOpen}
        onClose={() => setIsReceiveDeliveryOpen(false)}
      />

      {/* Category-Specific Barcode Inventory Intake Modal (Fleeces, Dereec, Yarns) */}
      <CategoryIntakeModal
        isOpen={isCategoryIntakeOpen}
        onClose={() => setIsCategoryIntakeOpen(false)}
        initialCategory={categoryIntakeCategory}
      />

    </div>
  );
};
