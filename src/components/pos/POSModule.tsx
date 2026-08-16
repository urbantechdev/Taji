import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, ProductBatch, LocationId } from '../../types';
import { LOCATIONS } from '../../data/initialData';
import { HeldCartsModal } from './HeldCartsModal';
import { ProductDetailModal } from './ProductDetailModal';
import { playClickSound, playPopupSound } from '../../utils/audio';
import {
  Search,
  QrCode,
  Plus,
  Minus,
  Trash2,
  ShieldAlert,
  ArrowRightLeft,
  CreditCard,
  FileText,
  CheckCircle2,
  Building,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  PauseCircle,
  Clock,
  BookmarkPlus,
  Package,
  Truck,
  Store,
  Warehouse,
  AlertCircle,
  X,
  Eye
} from 'lucide-react';

export const POSModule: React.FC = () => {
  const {
    activeLocation,
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processPOSCheckout,
    createOrderRerouteTicket,
    createDirectDispatchTransfer,
    setIsQRScannerOpen,
    etrConfig,
    heldCarts,
    holdCurrentCart
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerKraPin, setCustomerKraPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isRerouteModalOpen, setIsRerouteModalOpen] = useState(false);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [isQuotation, setIsQuotation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Product Quick View Modal State
  const [selectedViewProduct, setSelectedViewProduct] = useState<ProductBatch | null>(null);

  // Inter-Store Stock Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromLocation, setTransferFromLocation] = useState<LocationId>(activeLocation || 'main_store');
  const [transferToLocation, setTransferToLocation] = useState<LocationId>('sales_shop');
  const [transferItems, setTransferItems] = useState<{ batchId: string; quantity: number }[]>([]);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferFeedback, setTransferFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [transferSearch, setTransferSearch] = useState('');

  const activeLocInfo = LOCATIONS.find(l => l.id === activeLocation);

  // Filtered product catalog
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.colorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate cart totals
  const totalGross = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const subtotal = Number((totalGross / (1 + etrConfig.vatRate)).toFixed(2));
  const vatAmount = Number((totalGross - subtotal).toFixed(2));

  // Handle Checkout
  const handleCheckoutSubmit = () => {
    setCheckoutError(null);
    const res = processPOSCheckout(paymentMethod, customerName, customerKraPin, isQuotation);
    if (!res.success) {
      setCheckoutError(res.message || 'Checkout failed.');
    } else {
      setIsCheckoutModalOpen(false);
    }
  };

  // Handle Reroute Ticket Creation for Store 1 / Store 2 or Out-of-Stock
  const handleRerouteSubmit = () => {
    if (cart.length === 0) return;
    const items = cart.map(c => ({ batchId: c.batchId, quantity: c.quantity }));
    createOrderRerouteTicket(items, customerName, 'main_store');
    setIsRerouteModalOpen(false);
  };

  // Open POS Stock Transfer Modal with current Cart or empty
  const handleOpenTransferModalWithCart = () => {
    if (cart.length > 0) {
      setTransferItems(cart.map(c => ({ batchId: c.batchId, quantity: c.quantity })));
    } else if (transferItems.length === 0 && products.length > 0) {
      setTransferItems([{ batchId: products[0].id, quantity: 1 }]);
    }
    setTransferFromLocation(activeLocation || 'main_store');
    const firstOther = LOCATIONS.find(l => l.id !== (activeLocation || 'main_store'))?.id || 'sales_shop';
    setTransferToLocation(firstOther as LocationId);
    setTransferFeedback(null);
    setIsTransferModalOpen(true);
  };

  // Open POS Stock Transfer Modal with specific product batch
  const handleQuickTransferProduct = (product: ProductBatch) => {
    setTransferItems([{ batchId: product.id, quantity: 1 }]);
    setTransferFromLocation('main_store');
    setTransferToLocation(activeLocation !== 'main_store' ? activeLocation : 'sales_shop');
    setTransferFeedback(null);
    setIsTransferModalOpen(true);
  };

  // Execute Inter-Store Transfer
  const handleExecuteTransfer = () => {
    setTransferFeedback(null);
    if (transferItems.length === 0) {
      setTransferFeedback({ success: false, message: 'Please select at least one item to transfer.' });
      return;
    }
    if (transferFromLocation === transferToLocation) {
      setTransferFeedback({ success: false, message: 'Source and destination locations must be different.' });
      return;
    }

    const res = createDirectDispatchTransfer(
      transferFromLocation,
      transferToLocation,
      transferItems,
      transferNotes || 'POS Inter-Store Stock Dispatch'
    );

    if (res.success) {
      setTransferFeedback({ success: true, message: res.message || 'Stock successfully transferred and updated!' });
      // Clear cart if items were transferred from cart
      clearCart();
    } else {
      setTransferFeedback({ success: false, message: res.message || 'Transfer failed.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* DIRECT POS DISABLED ALERT BANNER FOR STORE 1 & STORE 2 */}
      {!activeLocInfo?.canSellDirectly && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white p-5 rounded-2xl shadow-lg shadow-rose-200 flex flex-col md:flex-row items-center justify-between gap-4 group">
          <ReflectionOverlay />
          <RightEdgeBlend variant="sunset" />
          <div className="flex items-start gap-3 relative z-10">
            <ShieldAlert className="w-6 h-6 text-amber-200 shrink-0 mt-1 animate-pulse" />
            <div>
              <h3 className="font-bold text-base">
                Direct POS Sales Disabled at {activeLocInfo?.name}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Per enterprise operational rules, Store 1 &amp; Store 2 do not collect cash or dispatch directly. Add customer items to ticket and click below to route to Main Store for billing and fulfillment.
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setIsRerouteModalOpen(true)}
              className="px-5 py-2.5 bg-white text-rose-700 font-bold text-xs rounded-xl shadow-md hover:bg-rose-50 shrink-0 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 relative z-10"
            >
              <ArrowRightLeft className="w-4 h-4 text-rose-600 animate-spin-slow" />
              Route Order Ticket to Main Store ({cart.length} items)
            </button>
          )}
        </div>
      )}

      {/* POS Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Selection Catalog (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Controls: Search & Category Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['All', 'Dereck', 'Fleece', 'Yarns'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      playClickSound();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Action Buttons: POS Transfer & QR Scanner */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenTransferModalWithCart()}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-900 to-rose-900 hover:from-indigo-800 hover:to-rose-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border border-indigo-700/50 hover:scale-105 active:scale-95"
                  title="Direct Inter-Store Stock Dispatch & Transfer from POS"
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  <span>Inter-Store POS Transfer</span>
                </button>

                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <QrCode className="w-4 h-4 text-rose-400" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search textile batch name, SKU (e.g. DRK-CRIMSON), or color name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map(prod => {
              const currentLocStock = prod.locationStock[activeLocation] || 0;
              const isOut = currentLocStock <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedViewProduct(prod)}
                  className={`relative overflow-hidden bg-white p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-rose-300 flex flex-col justify-between group cursor-pointer ${
                    isOut ? 'border-slate-200 opacity-75 bg-slate-50' : 'border-rose-100'
                  }`}
                  title="Tap product to view full details and stock breakdown"
                >
                  <RightEdgeBlend variant="rainbow" />
                  
                  {/* Subtle Tap to View Indicator on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      <Eye className="w-3 h-3 text-rose-400" />
                      <span>Tap to view</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Product Image preview */}
                    {prod.imageUrl && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 group-hover:shadow-xs transition-all mb-2">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                        <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          {prod.subCategory}
                        </span>
                      </div>
                    )}

                    {/* Color Swatch & Category Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-white shadow-xs group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: prod.colorHex }}
                          title={`Color Hex: ${prod.colorHex}`}
                        />
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-rose-50 group-hover:text-rose-700 transition-colors">
                          {prod.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {prod.sku}
                      </span>
                    </div>

                    {/* Product Title */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-tight group-hover:text-rose-700 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {prod.colorName} • {prod.fiberComposition}
                      </p>
                    </div>

                    {/* Prices & Unit */}
                    <div className="pt-1 flex items-baseline justify-between border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400">Retail: </span>
                        <span className="font-bold text-rose-700 text-xs font-mono">
                          KSh {prod.unitPriceRetail.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500"> / {prod.unit}</span>
                      </div>
                      {activeLocation === 'main_store' && (
                        <div className="text-[10px] text-emerald-600 font-semibold font-mono">
                          Bulk: KSh {prod.unitPriceBulk.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Location Stock Availability Breakdown */}
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 my-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-slate-500 uppercase">Stock Holdings:</span>
                      <span className="font-mono text-slate-400">Total: {(Object.values(prod.locationStock) as number[]).reduce((a, b) => a + b, 0)} {prod.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span className="text-slate-700">Main: <strong>{prod.locationStock.main_store || 0}</strong></span>
                      <span className="text-pink-800">Shop: <strong>{prod.locationStock.sales_shop || 0}</strong></span>
                      <span className="text-slate-600">Store 1: <strong>{prod.locationStock.store_1 || 0}</strong></span>
                      <span className="text-slate-600">Store 2: <strong>{prod.locationStock.store_2 || 0}</strong></span>
                    </div>
                  </div>

                  {/* Stock Level & Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOut
                          ? 'bg-rose-100 text-rose-700'
                          : currentLocStock <= prod.minReorderLevel
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Active Loc: {currentLocStock} {prod.unit}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViewProduct(prod);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-700 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod, 1);
                        }}
                        disabled={isOut && activeLocInfo?.canSellDirectly}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                          isOut
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Active Cart / Order Ticket Builder (4-5 Cols) */}
        <div id="pos-cart-section" className="relative overflow-hidden lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-rose-100 shadow-xs p-5 space-y-4 lg:sticky lg:top-20 group">
          <RightEdgeBlend variant="rose" />
          
          <div className="flex items-center justify-between border-b border-rose-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {!activeLocInfo?.canSellDirectly ? 'Order Ticket Builder' : 'Retail Cart & Checkout'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Held Carts Badge Button */}
              <button
                onClick={() => setIsHeldCartsModalOpen(true)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Held Orders"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Held ({heldCarts.length})</span>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-200" />
              <p>No textile items in cart.</p>
              <p className="text-[10px] text-slate-400">
                Select items from catalog or scan batch QR code.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cart.map(item => (
                <div
                  key={item.batchId}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-xs shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs leading-tight">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.colorName} • KSh {item.unitPrice.toLocaleString()} / {item.unit}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.batchId)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Controls & Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1">
                      <button
                        onClick={() => updateCartQuantity(item.batchId, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black font-mono text-sm px-2.5 min-w-[30px] text-center text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.batchId, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">{item.unit}</span>
                    </div>

                    <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                      KSh {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Financial Summary */}
          {cart.length > 0 && (
            <div className="space-y-2 border-t-2 border-slate-200 pt-3 text-xs font-sans">
              <div className="flex justify-between text-slate-600">
                <span className="font-semibold">Taxable Amount (Excl. VAT):</span>
                <span className="font-mono font-bold text-sm text-slate-800">KSh {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-semibold">16% KRA VAT:</span>
                <span className="font-mono font-bold text-sm text-amber-900">KSh {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL GROSS:</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-rose-700">KSh {totalGross.toLocaleString()}</span>
              </div>

              {/* Action Buttons depending on Store Type */}
              <div className="pt-2 space-y-2">
                {activeLocInfo?.canSellDirectly ? (
                  <button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    Process Payment &amp; Issue ETR Receipt
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRerouteModalOpen(true)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Route Order Ticket to Main Store
                  </button>
                )}

                {/* Put On Hold Button */}
                <button
                  onClick={() => setIsHoldModalOpen(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  Put Order On Hold
                </button>

                {/* Transfer Cart Items directly to Shop / Other Store */}
                <button
                  onClick={handleOpenTransferModalWithCart}
                  className="w-full py-2 bg-gradient-to-r from-indigo-50 to-rose-50 hover:from-indigo-100 hover:to-rose-100 text-indigo-900 border border-indigo-200 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>Transfer Cart Items to Shop / Store</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Sticky Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Cart Total</p>
              <p className="text-base sm:text-lg font-black font-mono text-rose-300">KSh {totalGross.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeLocInfo?.canSellDirectly ? (
              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Checkout</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRerouteModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Route Ticket</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* HELD CARTS LIST MODAL */}
      <HeldCartsModal
        isOpen={isHeldCartsModalOpen}
        onClose={() => setIsHeldCartsModalOpen(false)}
      />

      {/* HOLD ORDER PROMPT MODAL */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900">
              <PauseCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base">Put Order On Hold</h3>
            </div>
            <p className="text-xs text-slate-600">
              Save this cart to process later without losing selected items.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Customer Name / Ref (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Kipchoge Tailors"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Hold Note / Order Label
                </label>
                <input
                  type="text"
                  value={holdNote}
                  onChange={e => setHoldNote(e.target.value)}
                  placeholder="e.g. Waiting for M-Pesa phone confirmation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  holdCurrentCart(holdNote || 'Order Put On Hold', customerName || 'Walk-in Customer');
                  setHoldNote('');
                  setIsHoldModalOpen(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Payment Capture &amp; ETR Billing
              </h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {checkoutError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer Name:
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="e.g. Kipchoge Garment Tailors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer KRA PIN (Optional for B2B Invoice):
                </label>
                <input
                  type="text"
                  value={customerKraPin}
                  onChange={e => setCustomerKraPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="e.g. A008129384Z"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="M-Pesa">M-Pesa Express</option>
                  <option value="Cash">Cash Currency</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="proforma"
                  checked={isQuotation}
                  onChange={e => setIsQuotation(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="proforma" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Generate Proforma Quotation Only (Do not deduct stock)
                </label>
              </div>

              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs space-y-2">
                <div className="flex justify-between font-black text-slate-900 items-baseline">
                  <span className="text-sm uppercase font-extrabold text-slate-700">Grand Total Payable:</span>
                  <span className="text-rose-700 font-mono text-3xl sm:text-4xl font-black tracking-tight">KSh {totalGross.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium border-t border-rose-200/60 pt-1.5 flex justify-between items-center">
                  <span>Includes 16% KRA VAT: <strong className="font-mono text-slate-900 font-bold">KSh {vatAmount.toLocaleString()}</strong></span>
                  <span className="bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-mono font-bold text-rose-800">PIN: {etrConfig.taxPin}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckoutSubmit}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Confirm &amp; Issue ETR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REROUTE TICKET CONFIRMATION MODAL FOR STORE 1 / STORE 2 */}
      {isRerouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-amber-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  Route Order Ticket to Main Store
                </h3>
              </div>
              <button
                onClick={() => setIsRerouteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Direct sales are disabled at <strong>{activeLocInfo?.name}</strong>. Submitting this order ticket sends an inter-store fulfillment request to <strong>Main Store</strong>. The Main Store operator will capture payment and issue the KRA ETR receipt.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer Name / Note:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
              <p className="font-bold text-amber-900">
                Ticket Summary ({cart.length} item lines):
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                {cart.map(c => (
                  <li key={c.batchId}>
                    {c.quantity} {c.unit} {c.productName} ({c.colorName})
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsRerouteModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRerouteSubmit}
                className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT INTER-STORE POS STOCK TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-indigo-200 animate-in fade-in zoom-in duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Direct Inter-Store POS Stock Transfer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deducts stock from source store and adds immediately to receiving store node.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Alert */}
            {transferFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
                  transferFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {transferFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{transferFeedback.message}</span>
                </div>
              </div>
            )}

            {/* Source & Destination Location Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  1. Source Store (Stock Deducted From):
                </label>
                <select
                  value={transferFromLocation}
                  onChange={e => setTransferFromLocation(e.target.value as LocationId)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. Destination Store (Stock Added To):
                </label>
                <select
                  value={transferToLocation}
                  onChange={e => setTransferToLocation(e.target.value as LocationId)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {LOCATIONS.filter(l => l.id !== transferFromLocation).map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Picker Search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Items to Transfer ({transferItems.length} Batch Lines):</span>
                <span className="text-[10px] text-indigo-600 font-mono">Select product &amp; quantity</span>
              </label>

              {/* Add item dropdown/search */}
              <div className="flex gap-2">
                <select
                  value={transferSearch}
                  onChange={e => {
                    const batchId = e.target.value;
                    if (batchId) {
                      if (!transferItems.some(i => i.batchId === batchId)) {
                        setTransferItems(prev => [...prev, { batchId, quantity: 1 }]);
                      }
                      setTransferSearch('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">+ Add item batch to transfer queue...</option>
                  {products.map(p => {
                    const srcStock = p.locationStock[transferFromLocation] || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.colorName}) - Avail at {LOCATIONS.find(l => l.id === transferFromLocation)?.name}: {srcStock} {p.unit}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Items List */}
              {transferItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  No items selected for transfer yet. Pick an item above or click "Transfer" on catalog cards.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {transferItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.batchId);
                    if (!prod) return null;
                    const srcStock = prod.locationStock[transferFromLocation] || 0;
                    const dstStock = prod.locationStock[transferToLocation] || 0;

                    return (
                      <div
                        key={item.batchId}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            SKU: {prod.sku} • {prod.colorName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 pt-0.5">
                            <span className="text-slate-800">Source Available: <strong>{srcStock} {prod.unit}</strong></span>
                            <span>→</span>
                            <span className="text-indigo-700">Target After: <strong>{dstStock + item.quantity} {prod.unit}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1">
                            <label className="text-[10px] text-slate-500 font-bold px-1">Qty:</label>
                            <input
                              type="number"
                              min={1}
                              max={srcStock}
                              value={item.quantity}
                              onChange={e => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setTransferItems(prev =>
                                  prev.map((ti, i) => (i === idx ? { ...ti, quantity: val } : ti))
                                );
                              }}
                              className="w-16 px-1.5 py-0.5 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                            />
                            <span className="text-[10px] font-mono text-slate-500 pr-1">{prod.unit}</span>
                          </div>

                          <button
                            onClick={() =>
                              setTransferItems(prev => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove item line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dispatch / Transfer Notes (Optional):
              </label>
              <input
                type="text"
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
                placeholder="e.g. Routine morning shop replenishment from Main Warehouse"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleExecuteTransfer}
                disabled={transferItems.length === 0}
                className={`w-2/3 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  transferItems.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirm &amp; Execute Inter-Store Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL POPUP MODAL */}
      {selectedViewProduct && (
        <ProductDetailModal
          product={selectedViewProduct}
          onClose={() => setSelectedViewProduct(null)}
          onAddToCart={(prod, qty) => addToCart(prod, qty)}
          onQuickTransfer={handleQuickTransferProduct}
          activeLocation={activeLocation}
          canSellDirectly={activeLocInfo?.canSellDirectly ?? true}
        />
      )}

    </div>
  );
};
