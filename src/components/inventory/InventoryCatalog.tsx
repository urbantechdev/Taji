import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, ProductBatch, UnitType } from '../../types';
import { hasPermission } from '../../utils/rbac';
import { evaluateStockStatus, calculateStockThresholdSummary } from '../../utils/stockThresholdEngine';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { CategoryIntakeModal } from './CategoryIntakeModal';
import { WeightReconciliationModule } from './WeightReconciliationModule';
import { TareSettingsModal } from './TareSettingsModal';
import { EditProductModal } from './EditProductModal';
import { CategoryPricingModal } from './CategoryPricingModal';
import { ProductImageManagerModal } from './ProductImageManagerModal';
import { BulkBarcodeGeneratorModal } from './BulkBarcodeGeneratorModal';
import { DuplicateAuditModal } from './DuplicateAuditModal';
import { StocktakeDashboard } from './StocktakeDashboard';
import {
  Boxes,
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
  Camera,
  Truck,
  DollarSign,
  Scale,
  ShieldCheck,
  Edit3,
  Cloud,
  CheckCircle,
  Image as ImageIcon,
  Trash2,
  Undo2,
  ClipboardCheck
} from 'lucide-react';

export const InventoryCatalog: React.FC = () => {
  const {
    products,
    orders,
    locations,
    addProductBatch,
    updateProductBatch,
    deleteProductBatch,
    deleteMultipleProducts,
    restoreProductBatch,
    requestRestock,
    updateProductPrice,
    updateProductTareProfile,
    createDirectDispatchTransfer,
    getTotalAssetValuation,
    setIsQRScannerOpen,
    setIsMobileBarcodeScannerOpen,
    handleQRScan,
    cloudSyncStatus,
    lastCloudSync,
    syncCloudInventory,
    isProductImageModalOpen,
    setIsProductImageModalOpen,
    checkProductDuplicate,
    scanAllCatalogDuplicates,
    restockExistingProduct,
    stockAlertSettings,
    currentUser,
    isAdmin
  } = useERP();

  // Role-Based Feature Permission Gates
  const canAdd = isAdmin || hasPermission(currentUser.role, 'canAddProductBatches');
  const canViewCost = isAdmin || hasPermission(currentUser.role, 'canViewCostPrice');
  const canEditPrices = isAdmin || hasPermission(currentUser.role, 'canEditMasterPricing');
  const canDelete = isAdmin || hasPermission(currentUser.role, 'canDeleteInventory');
  const canTareWeight = isAdmin || hasPermission(currentUser.role, 'canDispatchTransfers');

  const [isDuplicateAuditOpen, setIsDuplicateAuditOpen] = useState(false);
  const [activeInventoryTab, setActiveInventoryTab] = useState<'catalog' | 'weight_reconciliation' | 'stocktake'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'main_store_low' | 'sales_shop_low' | 'dead_stock'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchModal, setActiveBatchModal] = useState<ProductBatch | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductBatch | null>(null);
  const [isCategoryPricingOpen, setIsCategoryPricingOpen] = useState(false);
  const [tareSettingsProduct, setTareSettingsProduct] = useState<ProductBatch | null>(null);
  const [isBulkBarcodeGeneratorOpen, setIsBulkBarcodeGeneratorOpen] = useState(false);
  const [bulkBarcodePreselectedId, setBulkBarcodePreselectedId] = useState<string | undefined>(undefined);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isReceiveDeliveryOpen, setIsReceiveDeliveryOpen] = useState(false);
  const [isCategoryIntakeOpen, setIsCategoryIntakeOpen] = useState(false);
  const [categoryIntakeCategory, setCategoryIntakeCategory] = useState<CategoryType>('Dereck');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Price Markdown Modal State for Dead Stock Clearance
  const [discountModalBatch, setDiscountModalBatch] = useState<ProductBatch | null>(null);
  const [newPromoPrice, setNewPromoPrice] = useState<number>(1000);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Instant Product Deletion & Bulk Management State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<ProductBatch | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [undoNotification, setUndoNotification] = useState<{
    message: string;
    products: ProductBatch[];
    timeoutId: any;
  } | null>(null);

  // New Batch Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
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

  // Centralized Stock Threshold Summary Engine
  const stockSummary = useMemo(() => {
    return calculateStockThresholdSummary(products, orders, stockAlertSettings);
  }, [products, orders, stockAlertSettings]);

  // Low stock counts per location based on configured settings
  const mainStoreLowCount = useMemo(() => {
    return products.filter(p => evaluateStockStatus(p, orders, stockAlertSettings, 'main_store').isLowStock).length;
  }, [products, orders, stockAlertSettings]);

  const salesShopLowCount = useMemo(() => {
    return products.filter(p => evaluateStockStatus(p, orders, stockAlertSettings, 'sales_shop').isLowStock).length;
  }, [products, orders, stockAlertSettings]);

  // Dead Stock calculation (Evaluated dynamically via configured settings & stagnation timeframe)
  const deadStockProducts = useMemo(() => {
    return stockSummary.deadStockBatches.map(item => item.product);
  }, [stockSummary]);

  const deadStockCount = stockSummary.deadStockCount;
  const deadStockCapital = stockSummary.totalDeadStockCapitalCost;

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.colorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fiberComposition.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStock = true;
    if (stockFilter === 'main_store_low') {
      matchesStock = evaluateStockStatus(p, orders, stockAlertSettings, 'main_store').isLowStock;
    } else if (stockFilter === 'sales_shop_low') {
      matchesStock = evaluateStockStatus(p, orders, stockAlertSettings, 'sales_shop').isLowStock;
    } else if (stockFilter === 'dead_stock') {
      matchesStock = evaluateStockStatus(p, orders, stockAlertSettings).isDeadStock;
    }

    return matchesCat && matchesQuery && matchesStock;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSku) return;

    const res = await addProductBatch({
      sku: newSku.toUpperCase(),
      barcode: newBarcode.trim() ? newBarcode.trim().toUpperCase() : newSku.toUpperCase(),
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
    if (res?.message) {
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 3500);
    }
    // Reset Form
    setNewName('');
    setNewSku('');
    setNewBarcode('');
  };

  // Handle Single Product Instant Delete
  const handleInstantDeleteProduct = async (product: ProductBatch) => {
    setProductToDelete(null);
    const res = await deleteProductBatch(product.id);
    
    // Clear from selection if selected
    setSelectedProductIds(prev => prev.filter(id => id !== product.id));

    // Setup Undo notification
    if (undoNotification?.timeoutId) {
      clearTimeout(undoNotification.timeoutId);
    }
    const timeoutId = setTimeout(() => {
      setUndoNotification(null);
    }, 8000);

    setUndoNotification({
      message: `Deleted "${product.name}" (${product.sku}) from inventory.`,
      products: [product],
      timeoutId
    });

    if (res?.message) {
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  // Handle Bulk Instant Delete
  const handleBulkInstantDelete = async () => {
    if (selectedProductIds.length === 0) return;
    setShowBulkDeleteModal(false);
    setIsBulkDeleting(true);
    
    const targets = products.filter(p => selectedProductIds.includes(p.id));
    const res = await deleteMultipleProducts(selectedProductIds);
    setIsBulkDeleting(false);
    setSelectedProductIds([]);

    // Setup Undo notification
    if (undoNotification?.timeoutId) {
      clearTimeout(undoNotification.timeoutId);
    }
    const timeoutId = setTimeout(() => {
      setUndoNotification(null);
    }, 8000);

    setUndoNotification({
      message: `Deleted ${targets.length} product(s) from inventory.`,
      products: targets,
      timeoutId
    });

    if (res?.message) {
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  // Handle Undo / Restore
  const handleUndo = async () => {
    if (!undoNotification || !undoNotification.products.length) return;
    clearTimeout(undoNotification.timeoutId);
    const prodsToRestore = [...undoNotification.products];
    setUndoNotification(null);

    for (const prod of prodsToRestore) {
      await restoreProductBatch(prod);
    }

    setSyncToast(`Restored ${prodsToRestore.length} product(s) back to inventory.`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const filteredIds = filteredProducts.map(p => p.id);
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const totalAssetValuation = getTotalAssetValuation();

  return (
    <div className="space-y-6">

      {/* Dynamic Asset Valuation Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-rose-500/20">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Catalog Batches</span>
          <span className="text-base sm:text-xl font-mono font-bold text-white mt-0.5 block">{products.length} Batches</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Physical Stock Units</span>
          <span className="text-base sm:text-xl font-mono font-bold text-amber-400 mt-0.5 block">{totalAssetValuation.totalUnits.toLocaleString()} units</span>
        </div>
        {canViewCost ? (
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost Valuation</span>
            <span className="text-base sm:text-xl font-mono font-bold text-rose-300 mt-0.5 block">KSh {totalAssetValuation.totalCostValuation.toLocaleString()}</span>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Stock Categories</span>
            <span className="text-base sm:text-xl font-mono font-bold text-rose-300 mt-0.5 block">Dereec, Fleece, Yarns</span>
          </div>
        )}
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Retail Valuation</span>
          <span className="text-base sm:text-xl font-mono font-black text-emerald-400 mt-0.5 block">KSh {totalAssetValuation.totalRetailValuation.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Top Header & Search Controls */}
      <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 group">
        <RightEdgeBlend variant="sunset" />
        
        {/* Title & View Switcher Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Multi-Store Inventory Management &amp; Catalog
                </h2>
                <p className="text-xs text-slate-500">
                  Live Stock Levels, Barcode/QR Intake, Multi-Branch Valuation &amp; Markdown Clearance
                </p>
              </div>
            </div>
          </div>

          {/* View Tab Switcher & Primary Action */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveInventoryTab('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInventoryTab === 'catalog'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-rose-600" />
                <span>Catalog Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInventoryTab('stocktake')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInventoryTab === 'stocktake'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Monthly Stocktake</span>
              </button>

              {canTareWeight && (
                <button
                  type="button"
                  onClick={() => setActiveInventoryTab('weight_reconciliation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeInventoryTab === 'weight_reconciliation'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Gross vs Net Reconciler</span>
                </button>
              )}
            </div>

            {canAdd && (
              <button
                onClick={() => setIsAddBatchModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* Organized Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:p-4 rounded-b-2xl">
          {/* Cloud Database Global Sync Status */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              cloudSyncStatus === 'synced' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' :
              cloudSyncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <div className="text-left hidden sm:block">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                {cloudSyncStatus === 'synced' ? 'Cloud: Live' : cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
              </span>
            </div>
            {canAdd && (
              <button
                type="button"
                disabled={isSyncingManual}
                onClick={async () => {
                  setIsSyncingManual(true);
                  const res = await syncCloudInventory();
                  setIsSyncingManual(false);
                  setSyncToast(res.message);
                  setTimeout(() => setSyncToast(null), 3000);
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Force push/pull inventory items to Firestore cloud database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingManual ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            )}
          </div>

          {/* Master Catalog Tools & Scanners */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Catalog Pricing & Images Group */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setIsProductImageModalOpen(true)}
                className="px-2.5 py-1.5 hover:bg-teal-50 text-teal-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Manage Master Product Images for Dereck, Fleeces & Yarns"
              >
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Images</span>
              </button>

              {canEditPrices && (
                <button
                  onClick={() => setIsCategoryPricingOpen(true)}
                  className="px-2.5 py-1.5 hover:bg-indigo-50 text-indigo-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Manage & Bulk Update Category Prices (Dereck, Fleece, Yarns)"
                >
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Prices</span>
                </button>
              )}

              <button
                onClick={() => {
                  setBulkBarcodePreselectedId(undefined);
                  setIsBulkBarcodeGeneratorOpen(true);
                }}
                className="px-2.5 py-1.5 hover:bg-amber-50 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Generate, Preview and Print Bulk Product Barcodes & QR Sticker Sheets"
              >
                <Barcode className="w-3.5 h-3.5 text-amber-600" />
                <span>Bulk Barcodes</span>
              </button>
            </div>

            {/* Scanner Controls Group */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Open Live Product Batch QR Code & Barcode Scanner"
              >
                <QrCode className="w-3.5 h-3.5 text-pink-600" />
                <span>Batch QR</span>
              </button>

              {canAdd && (
                <>
                  <button
                    onClick={() => setIsMobileBarcodeScannerOpen(true)}
                    className="px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Activate Phone Camera Barcode Scanner to Add Products Instantly"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan to Add</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategoryIntakeCategory(selectedCategory !== 'All' ? selectedCategory : 'Dereck');
                      setIsCategoryIntakeOpen(true);
                    }}
                    className="px-2.5 py-1.5 hover:bg-pink-50 text-pink-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Category Barcode Scanner Intake Mode for Fleeces, Dereec & Yarns"
                  >
                    <Barcode className="w-3.5 h-3.5 text-pink-600" />
                    <span>Intake Mode</span>
                  </button>

                  <button
                    onClick={() => setIsReceiveDeliveryOpen(true)}
                    className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Open Barcode Scanner Intake Mode for Delivery Manifests"
                  >
                    <Truck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Delivery</span>
                  </button>
                </>
              )}

              {canDelete && (
                <button
                  onClick={() => setIsDuplicateAuditOpen(true)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Scan and Resolve Product Duplicates to prevent financial audit errors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span>Duplication Control</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
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

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search SKU, color, or fiber..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Catalog vs Weight Reconciliation vs Stocktake Audit */}
      {activeInventoryTab === 'stocktake' ? (
        <StocktakeDashboard />
      ) : activeInventoryTab === 'weight_reconciliation' ? (
        <WeightReconciliationModule />
      ) : (
        <>
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
                    {deadStockCount} inventory batches stagnant (&gt;{stockAlertSettings.deadStockPeriodDays}d threshold) • Total Tied-Up Capital: <strong className="text-amber-300 font-mono font-bold">KSh {deadStockCapital.toLocaleString()}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deadStockCount > 0 && (
                  <button
                    onClick={() => {
                      const deadIds = deadStockProducts.map(p => p.id);
                      setSelectedProductIds(deadIds);
                    }}
                    className="px-3 py-1.5 bg-purple-800/80 hover:bg-purple-700 text-purple-100 text-xs font-bold rounded-xl border border-purple-400/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Select All Dead Stock ({deadStockCount})</span>
                  </button>
                )}
                <span className="text-[11px] font-mono font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200 px-3 py-1 rounded-full shrink-0">
                  Capital Protection Mode
                </span>
              </div>
            </div>
          )}

          {/* Product Catalog Table */}
          <div className="relative overflow-hidden bg-white rounded-2xl border border-rose-100 shadow-xs group">
            <RightEdgeBlend variant="rainbow" />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {canDelete ? (
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          title="Select All Filtered Products"
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                      </th>
                    ) : (
                      <th className="p-4 w-10 text-center text-slate-400">#</th>
                    )}
                    <th className="p-4">Color &amp; Swatch</th>
                    <th className="p-4">Product Batch / SKU</th>
                    <th className="p-4">Category / Composition</th>
                    <th className="p-4">Prices (KSh)</th>
                    <th className="p-4 text-center">Main Store</th>
                    <th className="p-4 text-center">Sales Shop</th>
                    <th className="p-4 text-center">Store 1</th>
                    <th className="p-4 text-center">Store 2</th>
                    <th className="p-4 text-right">Actions &amp; QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-sans">
                  {filteredProducts.map((p, idx) => {
                    const totalStock = (Object.values(p.locationStock) as number[]).reduce((a: number, b: number) => a + b, 0);
                    const isSelected = selectedProductIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${isSelected ? 'bg-rose-50/70' : 'hover:bg-rose-50/30'}`}
                      >
                        {/* Checkbox or Row Index */}
                        <td className="p-4 text-center">
                          {canDelete ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(p.id)}
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                          ) : (
                            <span className="font-mono text-slate-400 text-[11px]">{idx + 1}</span>
                          )}
                        </td>

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
                          {canViewCost && (
                            <p className="text-[10px] text-slate-400">Cost: {p.costPrice.toLocaleString()}</p>
                          )}
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

                        {/* Actions: Edit, Delete, QR, Barcode, Tare */}
                        <td className="p-3 text-right">
                          <div className="flex flex-col gap-1 w-40 ml-auto">
                            {(canAdd || canEditPrices || canDelete) && (
                              <div className={`grid ${canDelete ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                                {(canAdd || canEditPrices) && (
                                  <button
                                    onClick={() => setEditingProduct(p)}
                                    className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                    title="Edit Product, Stock Allocation & Prices"
                                  >
                                    <Edit3 className="w-3 h-3 text-indigo-600" />
                                    <span>Edit</span>
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    onClick={() => setProductToDelete(p)}
                                    className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-[11px] font-bold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                    title="Instant Delete Product from Inventory"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}

                            <div className={`grid ${canTareWeight ? 'grid-cols-3' : 'grid-cols-2'} gap-1`}>
                              <button
                                onClick={() => setActiveBatchModal(p)}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 text-[10px] font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-0.5 cursor-pointer"
                                title="View & Print Product QR Code Tag"
                              >
                                <QrCode className="w-3 h-3 text-rose-600" />
                                <span>QR</span>
                              </button>

                              <button
                                onClick={() => {
                                  setBulkBarcodePreselectedId(p.id);
                                  setIsBulkBarcodeGeneratorOpen(true);
                                }}
                                className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-0.5 cursor-pointer"
                                title="Generate and print barcode stickers"
                              >
                                <Barcode className="w-3 h-3 text-amber-600" />
                                <span>Bar</span>
                              </button>

                              {canTareWeight && (
                                <button
                                  onClick={() => setTareSettingsProduct(p)}
                                  className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 text-[10px] font-bold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-0.5 cursor-pointer"
                                  title="Configure Tare & Packaging Weight"
                                >
                                  <Scale className="w-3 h-3 text-amber-700" />
                                  <span>Tare</span>
                                </button>
                              )}
                            </div>

                            {/* Dead Stock Flash Clearance Discount Button */}
                            {canEditPrices && deadStockProducts.some(dp => dp.id === p.id) && (
                              <button
                                onClick={() => {
                                  setDiscountModalBatch(p);
                                  setNewPromoPrice(Math.round(p.unitPriceRetail * 0.8));
                                }}
                                className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold rounded-lg shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                                <span>Flash Discount</span>
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
                onClick={() => {
                  const target = activeBatchModal;
                  setActiveBatchModal(null);
                  setProductToDelete(target);
                }}
                className="px-3 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Instant Delete this product from inventory"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Batch</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                  <label className="font-bold text-slate-700 block mb-1">Barcode (EAN-13 / Code128):</label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={e => setNewBarcode(e.target.value)}
                    placeholder="Scan or enter barcode (e.g. 616400012345)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instant Real-Time Duplication Warning Prompt */}
              {(() => {
                const conflict = (newBarcode.trim() || newSku.trim() || newName.trim())
                  ? checkProductDuplicate({
                      barcode: newBarcode.trim() || newSku.trim(),
                      sku: newSku.trim(),
                      name: newName.trim()
                    })
                  : null;

                if (!conflict?.isDuplicate || !conflict.existingProduct) return null;

                return (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                      <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Duplicate Item Detected ({conflict.matchType?.toUpperCase() || 'MATCH'})</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Matches existing item: <strong>{conflict.existingProduct.name}</strong> ({conflict.existingProduct.sku}).
                      Creating a duplicate batch will distort inventory audits.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-slate-600">
                        Current Stock: {Object.values(conflict.existingProduct.locationStock).reduce((a, b) => a + Number(b || 0), 0)} units
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await restockExistingProduct(conflict.existingProduct!.id, Number(newMainStock) || 50, 'main_store');
                          setIsAddBatchModalOpen(false);
                          setSyncToast(`Successfully merged & added stock to ${conflict.existingProduct!.name}`);
                          setTimeout(() => setSyncToast(null), 3500);
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Restock Existing Instead
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subcategory / Line:</label>
                  <input
                    type="text"
                    value={newSubCategory}
                    onChange={e => setNewSubCategory(e.target.value)}
                    placeholder="e.g. Heavy Suiting Line"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
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

      {/* Tare & Packaging Profile Configuration Modal */}
      {tareSettingsProduct && (
        <TareSettingsModal
          isOpen={!!tareSettingsProduct}
          product={tareSettingsProduct}
          onClose={() => setTareSettingsProduct(null)}
          onSaveTareProfile={(batchId, profile) => {
            updateProductTareProfile(batchId, profile);
            setTareSettingsProduct(null);
          }}
        />
      )}

      {/* EDIT INVENTORY PRODUCT MODAL (With Global Firestore Sync) */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* CATEGORY PRICING BATCH MANAGER MODAL (With Global Firestore Sync) */}
      {isCategoryPricingOpen && (
        <CategoryPricingModal
          onClose={() => setIsCategoryPricingOpen(false)}
        />
      )}

      {/* MASTER PRODUCT IMAGE MANAGER MODAL (Dereck, Fleece, Yarns) */}
      <ProductImageManagerModal />

      {/* Master Bulk Barcode & QR Label Generator Modal */}
      <BulkBarcodeGeneratorModal
        isOpen={isBulkBarcodeGeneratorOpen}
        onClose={() => {
          setIsBulkBarcodeGeneratorOpen(false);
          setBulkBarcodePreselectedId(undefined);
        }}
        preselectedBatchId={bulkBarcodePreselectedId}
      />

      {/* SINGLE PRODUCT INSTANT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Instant Delete Product
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Permanently remove batch from cloud database &amp; branch stock
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-sm shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: productToDelete.colorHex }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {productToDelete.name}
                  </h4>
                  <p className="font-mono text-xs text-slate-500">
                    SKU: <span className="text-slate-800 font-bold">{productToDelete.sku}</span> • {productToDelete.category}
                  </p>
                </div>
              </div>

              {/* Stock Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200 font-mono text-[11px] text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Main Store</span>
                  <span className="font-bold text-slate-800">{productToDelete.locationStock.main_store}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Sales Shop</span>
                  <span className="font-bold text-slate-800">{productToDelete.locationStock.sales_shop}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Store 1</span>
                  <span className="font-bold text-slate-800">{productToDelete.locationStock.store_1}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Store 2</span>
                  <span className="font-bold text-slate-800">{productToDelete.locationStock.store_2}</span>
                </div>
              </div>

              {/* Total Stock & Valuation */}
              {(() => {
                const totalUnits = (Object.values(productToDelete.locationStock) as number[]).reduce((a, b) => a + b, 0);
                return (
                  <div className="flex justify-between items-center text-xs pt-1 text-slate-600 font-mono">
                    <span>Total Units: <strong>{totalUnits} {productToDelete.unit}</strong></span>
                    <span>Tied Cost: <strong className="text-rose-700">KSh {(totalUnits * productToDelete.costPrice).toLocaleString()}</strong></span>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Instant delete will sync to Firestore and remove this item from POS lookups and warehouse inventory. An <strong>Undo</strong> button will remain active for 8 seconds.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInstantDeleteProduct(productToDelete)}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Instant Delete Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK INSTANT DELETE MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Bulk Instant Delete
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Permanently delete {selectedProductIds.length} selected products
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const selectedItems = products.filter(p => selectedProductIds.includes(p.id));
              const totalUnits = selectedItems.reduce((acc, p) => {
                const sum = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
                return acc + sum;
              }, 0);
              const totalCostVal = selectedItems.reduce((acc, p) => {
                const sum = (Object.values(p.locationStock) as number[]).reduce((a, b) => a + b, 0);
                return acc + (sum * p.costPrice);
              }, 0);

              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Selected Items:</span>
                    <span className="font-bold font-mono text-slate-900">{selectedItems.length} Batches</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Total Physical Units:</span>
                    <span className="font-bold font-mono text-slate-900">{totalUnits.toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between text-rose-700 border-t border-slate-200 pt-1.5 font-bold">
                    <span>Total Cost Value:</span>
                    <span className="font-mono">KSh {totalCostVal.toLocaleString()}</span>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 pt-2 border-t border-slate-200 divide-y divide-slate-100">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span className="truncate pr-2">{item.name} ({item.sku})</span>
                        <span className="font-mono text-[10px] shrink-0 text-slate-400">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                All selected items will be deleted instantly across all stores. You can restore them with the <strong>Undo</strong> button immediately after deletion.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkInstantDelete}
                disabled={isBulkDeleting}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isBulkDeleting ? 'Deleting...' : `Delete All ${selectedProductIds.length} Items`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK SELECTION ACTION BAR */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/30 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
              {selectedProductIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200">
              Products Selected
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Instant Delete ({selectedProductIds.length})</span>
          </button>

          <button
            onClick={() => setSelectedProductIds([])}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* FLOATING UNDO RESTORE TOAST NOTIFICATION */}
      {undoNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-500/40 text-xs font-semibold animate-in slide-in-from-bottom duration-200 max-w-md">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-100 truncate">{undoNotification.message}</p>
            <p className="text-[10px] text-slate-400">Available to restore for 8s</p>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            onClick={() => {
              if (undoNotification.timeoutId) clearTimeout(undoNotification.timeoutId);
              setUndoNotification(null);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Cloud Sync Toast Notification */}
      {syncToast && !undoNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Duplication Control & Financial Audit Scanner Modal */}
      <DuplicateAuditModal
        isOpen={isDuplicateAuditOpen}
        onClose={() => setIsDuplicateAuditOpen(false)}
      />

    </div>
  );
};
