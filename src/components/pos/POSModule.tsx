import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, ProductBatch, LocationId } from '../../types';
import { hasPermission } from '../../utils/rbac';
import { HeldCartsModal } from './HeldCartsModal';
import { ProductDetailModal } from './ProductDetailModal';
import { ForwardReservationsModal } from './ForwardReservationsModal';
import { CartQuantityInput } from './CartQuantityInput';
import { playClickSound, playPopupSound, playSuccessSound, playAlertSound, playAddToCartSound, playBarcodeScanBeep, playScannerErrorBeep } from '../../utils/audio';
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
  Eye,
  Mail,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Barcode,
  Scan,
  Scale,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Lock,
  RotateCcw,
  Calendar,
  CalendarDays,
  Scissors,
  Boxes,
  Tag,
  Sliders
} from 'lucide-react';
import { formatRollPricingSummary } from '../../utils/rollPricingEngine';

export const POSModule: React.FC = () => {
  const {
    activeLocation,
    locations,
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartItemRollPricing,
    clearCart,
    processPOSCheckout,
    createOrderRerouteTicket,
    createDirectDispatchTransfer,
    setIsQRScannerOpen,
    etrConfig,
    heldCarts,
    holdCurrentCart,
    setIsMailDrawerOpen,
    mailNotifications,
    updateCartTare,
    setIsShiftClosureModalOpen,
    setIsTodaySalesModalOpen,
    setIsPeriodicStatementModalOpen,
    categoryPricingConfigs,
    setIsReturnExchangeModalOpen,
    quarantinedDefects,
    orders,
    isForwardReservationsModalOpen,
    setIsForwardReservationsModalOpen,
    currentUser,
    isAdmin
  } = useERP();

  const canCloseShift = isAdmin || hasPermission(currentUser.role, 'canDirectPOSSale') || hasPermission(currentUser.role, 'canAdjustCashFloat');
  const canViewReports = isAdmin || hasPermission(currentUser.role, 'canExecuteForensicAudit') || hasPermission(currentUser.role, 'canManageGeneralLedger');
  const canDispatchTransfers = isAdmin || hasPermission(currentUser.role, 'canDispatchTransfers');

  const unreadMails = mailNotifications ? mailNotifications.filter(m => !m.read).length : 0;
  const activeForwardReservationsCount = orders ? orders.filter(o => o.status === 'reserved' || o.reservationStatus === 'reserved_active').length : 0;

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerKraPin, setCustomerKraPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [applyWHT5, setApplyWHT5] = useState(false);
  const [whtCertificateNo, setWhtCertificateNo] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isRerouteModalOpen, setIsRerouteModalOpen] = useState(false);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [isQuotation, setIsQuotation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Forward-Dated Reservation & Advance Order State
  const [isForwardDated, setIsForwardDated] = useState(false);
  const [forwardFulfillmentDate, setForwardFulfillmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [depositOption, setDepositOption] = useState<'full' | 'half' | 'custom'>('full');
  const [customDepositInput, setCustomDepositInput] = useState<number>(0);
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

  // Digital Scale & Variable Cone Weigher Pad State
  const [isDigitalScaleOpen, setIsDigitalScaleOpen] = useState(false);
  const [scaleSelectedProduct, setScaleSelectedProduct] = useState<ProductBatch | null>(null);
  const [scaleGrossWeight, setScaleGrossWeight] = useState<number>(2.080);
  const [scaleRatePerKg, setScaleRatePerKg] = useState<number>(750);
  const [scaleConeCount, setScaleConeCount] = useState<number>(1);
  const [scaleTarePerCone, setScaleTarePerCone] = useState<number>(0.070);
  const [scaleAutoTare, setScaleAutoTare] = useState<boolean>(true);
  const [scaleTarePresetType, setScaleTarePresetType] = useState<'standard_cone' | 'two_cones' | 'bale_bag' | 'zero' | 'custom'>('standard_cone');
  const [scaleCustomTareKg, setScaleCustomTareKg] = useState<number>(0.070);

  // Active Tare Scale Modal / In-Line Drawer State
  const [activeTareItemBatchId, setActiveTareItemBatchId] = useState<string | null>(null);
  const [tareInputGrossWeight, setTareInputGrossWeight] = useState<number>(0);
  const [tareInputCoreCount, setTareInputCoreCount] = useState<number>(1);
  const [tareInputCustomPerUnit, setTareInputCustomPerUnit] = useState<number>(0.050);

  // Option 1 Split Roll & Loose Meter Pricing In-Line Drawer State
  const [activeRollPricingBatchId, setActiveRollPricingBatchId] = useState<string | null>(null);
  const [rollPricingModalDiscountPct, setRollPricingModalDiscountPct] = useState<number>(10);
  const [rollPricingModalStandardMeters, setRollPricingModalStandardMeters] = useState<number>(70);
  const [rollPricingModalMode, setRollPricingModalMode] = useState<'hybrid_discounted_loose' | 'all_wholesale' | 'all_retail' | 'custom'>('hybrid_discounted_loose');

  // Product Quick View Modal State
  const [selectedViewProduct, setSelectedViewProduct] = useState<ProductBatch | null>(null);

  // Barcode Checkout Scanner State
  const [barcodeCheckoutInput, setBarcodeCheckoutInput] = useState('');
  const [barcodeScanFeedback, setBarcodeScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inter-Store Stock Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromLocation, setTransferFromLocation] = useState<LocationId>(activeLocation || 'main_store');
  const [transferToLocation, setTransferToLocation] = useState<LocationId>('sales_shop');
  const [transferItems, setTransferItems] = useState<{ batchId: string; quantity: number }[]>([]);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferFeedback, setTransferFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [transferSearch, setTransferSearch] = useState('');

  const activeLocInfo = locations.find(l => l.id === activeLocation);

  // Handle Barcode Checkout Scan (Processes real-time scan into cart with stock check)
  const handleBarcodeScanCheckout = (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const rawCode = (directCode || barcodeCheckoutInput).trim();
    if (!rawCode) return;

    setBarcodeScanFeedback(null);
    const codeUpper = rawCode.toUpperCase();

    // Find product by exact barcode, SKU, or ID
    const matchedProduct = products.find(p =>
      (p.barcode && p.barcode.toUpperCase() === codeUpper) ||
      (p.sku && p.sku.toUpperCase() === codeUpper) ||
      p.id.toUpperCase() === codeUpper
    );

    if (matchedProduct) {
      const availableStock = matchedProduct.locationStock[activeLocation] || 0;
      const currentInCart = cart.find(c => c.batchId === matchedProduct.id)?.quantity || 0;

      if (availableStock <= currentInCart && !activeLocInfo?.canSellDirectly) {
        // Warning if stock depleted
        playScannerErrorBeep();
        setBarcodeScanFeedback({
          type: 'error',
          message: `Zero stock for "${matchedProduct.name}" at ${activeLocInfo?.name || activeLocation}. Reroute needed.`
        });
      } else {
        addToCart(matchedProduct, 1, false);
        playBarcodeScanBeep(true);
        setBarcodeScanFeedback({
          type: 'success',
          message: `Scanned & Added: ${matchedProduct.name} (${matchedProduct.barcode || matchedProduct.sku})`
        });
      }
      setBarcodeCheckoutInput('');
    } else {
      playScannerErrorBeep();
      setBarcodeScanFeedback({
        type: 'error',
        message: `Unrecognized Barcode "${rawCode}". Product not found in database.`
      });
    }
  };

  // Filtered product catalog
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.colorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate cart totals (prioritizing Option 1 rollPricing.totalPrice if present)
  const totalGross = cart.reduce((acc, item) => {
    const itemTotal = (item.rollPricing && item.rollPricing.totalPrice > 0)
      ? item.rollPricing.totalPrice
      : item.unitPrice * item.quantity;
    return acc + itemTotal;
  }, 0);
  const subtotal = Number((totalGross / (1 + etrConfig.vatRate)).toFixed(2));
  const vatAmount = Number((totalGross - subtotal).toFixed(2));

  // Compute calculated deposit amount for forward reservations
  const netGrossPayable = applyWHT5 ? totalGross - Number((totalGross * 0.05).toFixed(2)) : totalGross;
  const computedDeposit = isForwardDated
    ? depositOption === 'full'
      ? netGrossPayable
      : depositOption === 'half'
      ? Math.round(netGrossPayable / 2)
      : Math.min(netGrossPayable, Math.max(0, customDepositInput))
    : netGrossPayable;
  const balanceDue = Math.max(0, netGrossPayable - computedDeposit);

  // Handle Checkout
  const handleCheckoutSubmit = () => {
    setCheckoutError(null);
    const res = processPOSCheckout(
      paymentMethod,
      customerName,
      customerKraPin,
      isQuotation,
      applyWHT5,
      whtCertificateNo,
      isForwardDated,
      forwardFulfillmentDate,
      computedDeposit,
      fulfillmentNotes
    );
    if (!res.success) {
      setCheckoutError(res.message || 'Checkout failed.');
    } else {
      setIsCheckoutModalOpen(false);
      setApplyWHT5(false);
      setWhtCertificateNo('');
      setIsForwardDated(false);
      setDepositOption('full');
      setFulfillmentNotes('');
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
    const firstOther = locations.find(l => l.id !== (activeLocation || 'main_store'))?.id || 'sales_shop';
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
      playAlertSound();
      return;
    }
    if (transferFromLocation === transferToLocation) {
      setTransferFeedback({ success: false, message: 'Source and destination locations must be different.' });
      playAlertSound();
      return;
    }

    const res = createDirectDispatchTransfer(
      transferFromLocation,
      transferToLocation,
      transferItems,
      transferNotes || 'POS Inter-Store Stock Dispatch'
    );

    if (res.success) {
      playSuccessSound();
      // Auto-close modal window automatically upon confirmation & execution
      setIsTransferModalOpen(false);
      setTransferItems([]);
      setTransferNotes('');
      setTransferSearch('');
      setTransferFeedback(null);
      // Clear cart if items were transferred from cart
      clearCart();
    } else {
      playAlertSound();
      setTransferFeedback({ success: false, message: res.message || 'Transfer failed.' });
    }
  };

  // Open Digital Scale Weigher & Variable Cone Auto-Calculator
  const handleOpenDigitalScale = (product?: ProductBatch, initialGross?: number, existingCartItem?: any) => {
    const targetProduct =
      product ||
      (existingCartItem ? products.find(p => p.id === existingCartItem.batchId) : null) ||
      products.find(p => p.category === 'Yarns') ||
      products[0];

    if (!targetProduct) return;

    setScaleSelectedProduct(targetProduct);
    const catConf = categoryPricingConfigs[targetProduct.category];
    const catRate = catConf?.pricePerKgRate || targetProduct.unitPriceRetail || (targetProduct.category === 'Yarns' ? 750 : 1200);
    const coneTare = catConf?.coneTareWeightKg ?? 0.070;
    const autoTarePref = catConf?.autoDeductTareAtPOS ?? true;

    setScaleRatePerKg(existingCartItem?.unitPrice || catRate);
    setScaleTarePerCone(coneTare);
    setScaleAutoTare(autoTarePref);
    setScaleTarePresetType('standard_cone');
    setScaleCustomTareKg(coneTare);

    if (existingCartItem) {
      const gross = existingCartItem.scaleGrossWeight || (existingCartItem.quantity + (existingCartItem.tareDeduction || 0));
      setScaleGrossWeight(gross || 2.080);
      setScaleConeCount(1);
    } else {
      setScaleGrossWeight(initialGross || (targetProduct.weightPerPackageKg ? targetProduct.weightPerPackageKg : 2.080));
      setScaleConeCount(1);
    }

    setIsDigitalScaleOpen(true);
    playPopupSound();
  };

  // Confirm Scale Weight and apply into cart
  const handleConfirmScaleWeight = () => {
    if (!scaleSelectedProduct) return;

    let computedTarePerUnit = scaleTarePerCone;
    if (scaleTarePresetType === 'zero' || !scaleAutoTare) {
      computedTarePerUnit = 0;
    } else if (scaleTarePresetType === 'standard_cone') {
      computedTarePerUnit = scaleTarePerCone;
    } else if (scaleTarePresetType === 'two_cones') {
      computedTarePerUnit = scaleTarePerCone * 2;
    } else if (scaleTarePresetType === 'bale_bag') {
      computedTarePerUnit = 0.840;
    } else if (scaleTarePresetType === 'custom') {
      computedTarePerUnit = scaleCustomTareKg;
    }

    const totalTare = (scaleAutoTare && scaleTarePresetType !== 'zero') ? (computedTarePerUnit * (scaleTarePresetType === 'two_cones' ? 1 : scaleConeCount)) : 0;
    const netWeight = Math.max(0.01, Number((scaleGrossWeight - totalTare).toFixed(3)));

    const existingIndex = cart.findIndex(c => c.batchId === scaleSelectedProduct.id);

    if (existingIndex >= 0) {
      updateCartTare(
        scaleSelectedProduct.id,
        scaleGrossWeight,
        totalTare,
        netWeight,
        totalTare > 0 ? `${scaleConeCount} Cone(s) Spool Tare (-${(totalTare * 1000).toFixed(0)}g)` : 'Zero Tare (Pure Net)'
      );
      if (scaleRatePerKg !== cart[existingIndex].unitPrice) {
        updateCartQuantity(scaleSelectedProduct.id, netWeight);
      }
    } else {
      addToCart(scaleSelectedProduct, netWeight, false);
      updateCartTare(
        scaleSelectedProduct.id,
        scaleGrossWeight,
        totalTare,
        netWeight,
        totalTare > 0 ? `${scaleConeCount} Cone(s) Spool Tare (-${(totalTare * 1000).toFixed(0)}g)` : 'Zero Tare (Pure Net)'
      );
    }

    playAddToCartSound();
    playSuccessSound();
    setIsDigitalScaleOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* DIRECT POS DISABLED ALERT BANNER FOR STORE 1 & STORE 2 */}
      {!activeLocInfo?.canSellDirectly && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg shadow-rose-200 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4 group">
          <ReflectionOverlay />
          <RightEdgeBlend variant="sunset" />
          <div className="flex items-start gap-2 sm:gap-3 relative z-10">
            <ShieldAlert className="w-4 h-4 sm:w-6 sm:h-6 text-amber-200 shrink-0 mt-0.5 sm:mt-1 animate-pulse" />
            <div>
              <h3 className="font-bold text-xs sm:text-base">
                Direct POS Sales Disabled at {activeLocInfo?.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-rose-100 mt-0.5 line-clamp-2 sm:line-clamp-none">
                Per enterprise operational rules, Store 1 &amp; Store 2 do not collect cash or dispatch directly. Add customer items to ticket and click below to route to Main Store for billing and fulfillment.
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setIsRerouteModalOpen(true)}
              className="w-full sm:w-auto px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white text-rose-700 font-bold text-xs rounded-xl shadow-md hover:bg-rose-50 shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 relative z-10"
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
          <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100 shadow-xs space-y-2 sm:space-y-3">
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

              {/* Quick Action Buttons: Scale Weigher, Sales Today, Statements, Close Shift, Inbox, POS Transfer & QR Scanner */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleOpenDigitalScale()}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 border border-indigo-500/50"
                  title="Digital Cone Weigher Scale & Auto-Tare Price-per-KG Calculator"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  <span>Scale Weigher (KG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReturnExchangeModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 border border-amber-400/40"
                  title="Process Returned Spoilt Cones, 1:1 Replacement or Bank Refund & eTIMS Credit Notes"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
                  <span>RMA / Returns</span>
                  {quarantinedDefects.length > 0 && (
                    <span className="bg-amber-300 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {quarantinedDefects.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsForwardReservationsModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/60"
                  title="View, Fulfill & Dispatch Forward-Dated Reservations & Advance Bookings"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-slate-950" />
                  <span>Advance Bookings</span>
                  {activeForwardReservationsCount > 0 && (
                    <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                      {activeForwardReservationsCount}
                    </span>
                  )}
                </button>

                {canViewReports && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsTodaySalesModalOpen(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="View Today's Real-time Sales, Cash at hand, Bank & M-Pesa"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sales Today</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPeriodicStatementModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="Download Daily, Weekly, or Monthly Statements"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Statements</span>
                    </button>
                  </>
                )}

                {canCloseShift && (
                  <button
                    type="button"
                    onClick={() => setIsShiftClosureModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                    title="Close Shift at End of Day - Reconcile Cash in Hand vs Bank & M-Pesa"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-200" />
                    <span>Close Shift</span>
                  </button>
                )}

                <button
                  onClick={() => setIsMailDrawerOpen(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border hover:scale-105 active:scale-95 ${
                    unreadMails > 0
                      ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse ring-2 ring-amber-300/80 shadow-md shadow-amber-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Store Mail & Transfer Inbox"
                >
                  <Mail className={`w-4 h-4 ${unreadMails > 0 ? 'text-slate-950 font-bold' : 'text-rose-600'}`} />
                  <span>Inbox</span>
                  {unreadMails > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadMails}
                    </span>
                  )}
                </button>

                {canDispatchTransfers && (
                  <button
                    onClick={() => handleOpenTransferModalWithCart()}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-900 to-rose-900 hover:from-indigo-800 hover:to-rose-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border border-indigo-700/50 hover:scale-105 active:scale-95"
                    title="Direct Inter-Store Stock Dispatch & Transfer from POS"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                    <span>Inter-Store POS Transfer</span>
                  </button>
                )}

                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <QrCode className="w-4 h-4 text-rose-400" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            {/* Barcode Checkout Scanner & Search Controls */}
            <div className="space-y-2.5 pt-1">
              
              {/* Barcode Scanner Input Form for Real-time Checkout */}
              <form onSubmit={handleBarcodeScanCheckout} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-rose-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={barcodeCheckoutInput}
                    onChange={e => setBarcodeCheckoutInput(e.target.value)}
                    placeholder="Scan product barcode (USB / Bluetooth / Camera) or enter SKU..."
                    className="w-full pl-9 pr-4 py-2 bg-gradient-to-r from-rose-50/50 to-amber-50/30 border-2 border-rose-200 focus:border-rose-500 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Scan item into active checkout cart"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Scan Checkout</span>
                </button>
              </form>

              {/* Barcode Scanner Feedback Alert */}
              {barcodeScanFeedback && (
                <div
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    barcodeScanFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {barcodeScanFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{barcodeScanFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcodeScanFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search Catalog Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter catalog by name, SKU (e.g. DRK-CRIMSON), or color name..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
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
                      {(prod.shadeCode || prod.dyeLot || prod.yarnCount) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prod.shadeCode && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                              Shade: {prod.shadeCode}
                            </span>
                          )}
                          {prod.dyeLot && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                              Lot: {prod.dyeLot}
                            </span>
                          )}
                          {prod.yarnCount && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {prod.yarnCount}
                            </span>
                          )}
                          {prod.packagesCount && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                              {prod.packagesCount} Cones / {prod.netWeightKg || 24} KG Bale
                            </span>
                          )}
                        </div>
                      )}
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
                          handleOpenDigitalScale(prod);
                        }}
                        disabled={isOut && activeLocInfo?.canSellDirectly}
                        className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                        title={`Weigh ${prod.name} on scale & auto-calculate price by net KG`}
                      >
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Weigh</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBarcodeScanCheckout(undefined, prod.barcode || prod.sku);
                        }}
                        disabled={isOut && activeLocInfo?.canSellDirectly}
                        className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        title={`Scan Barcode (${prod.barcode || prod.sku}) directly to cart`}
                      >
                        <Barcode className="w-3.5 h-3.5" />
                      </button>

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
            <div className="space-y-2">
              {/* Scroll / Item Count Notification Bar if > 2 items */}
              {cart.length > 2 && (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-rose-50 border border-rose-200/80 rounded-xl text-[11px]">
                  <span className="font-bold text-rose-900 flex items-center gap-1">
                    <ChevronsUpDown className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    {isCartExpanded ? `All ${cart.length} items shown` : `2 of ${cart.length} items in view`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsCartExpanded(!isCartExpanded);
                    }}
                    className="font-black text-rose-700 hover:text-rose-900 underline underline-offset-2 cursor-pointer flex items-center gap-0.5"
                  >
                    {isCartExpanded ? (
                      <>
                        <span>Collapse</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Expand all ({cart.length})</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 2-Item Height Constrained Scroll Container */}
              <div
                className={`space-y-2.5 overflow-y-auto pr-1 transition-all duration-300 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 ${
                  isCartExpanded ? 'max-h-[460px]' : 'max-h-[210px]'
                }`}
              >
                {cart.map(item => {
                  const prod = products.find(p => p.id === item.batchId);
                  const isTareOpen = activeTareItemBatchId === item.batchId;
                  const isRollPricingOpen = activeRollPricingBatchId === item.batchId;
                  const defaultTareKg = prod?.tareProfile?.tareWeightPerUnit ?? (prod?.category === 'Yarns' ? 0.050 : 0.250);
                  const effectiveLineTotal = (item.rollPricing && item.rollPricing.totalPrice > 0)
                    ? item.rollPricing.totalPrice
                    : item.unitPrice * item.quantity;
                  const isFabric = item.unit === 'meter' || item.unit === 'roll' || item.unit === 'yard' || item.category === 'Fleece' || item.category === 'Dereck';

                  return (
                    <div
                      key={item.batchId}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        item.rollPricing?.isHybridApplied
                          ? 'bg-indigo-50/40 border-indigo-200'
                          : item.isTareApplied
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
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
                            {(item.shadeCode || item.dyeLot || item.yarnCount) && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {item.shadeCode && (
                                  <span className="text-[8px] font-bold px-1 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                                    Shade: {item.shadeCode}
                                  </span>
                                )}
                                {item.dyeLot && (
                                  <span className="text-[8px] font-bold px-1 py-0.2 bg-purple-100 text-purple-800 rounded">
                                    Lot: {item.dyeLot}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isFabric && (
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                if (activeRollPricingBatchId === item.batchId) {
                                  setActiveRollPricingBatchId(null);
                                } else {
                                  setActiveRollPricingBatchId(item.batchId);
                                  setRollPricingModalDiscountPct(item.rollPricing?.looseDiscountPct ?? 10);
                                  setRollPricingModalStandardMeters(item.rollPricing?.standardRollMeters ?? (item.category === 'Fleece' ? 70 : 50));
                                  setRollPricingModalMode(item.rollPricing?.pricingMode ?? 'hybrid_discounted_loose');
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                item.rollPricing?.isHybridApplied
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                              }`}
                              title="Option 1 Split Roll & Discounted Loose Pricing"
                            >
                              <Scissors className="w-3 h-3" />
                              <span>{item.rollPricing?.isHybridApplied ? 'Option 1 Split' : '✂️ Roll Pricing'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              handleOpenDigitalScale(prod, item.scaleGrossWeight || item.quantity, item);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                              item.isTareApplied
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Open Digital Scale & Variable Weight Calculator"
                          >
                            <Scale className="w-3 h-3" />
                            <span>{item.isTareApplied ? 'Tare Active' : '⚖️ Tare'}</span>
                          </button>

                          <button
                            onClick={() => removeFromCart(item.batchId)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Option 1 Roll & Loose Meters Breakdown Badge */}
                      {item.rollPricing && (
                        <div className="p-2.5 bg-white border border-indigo-200 rounded-xl space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                            <span className="flex items-center gap-1">
                              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                              {item.rollPricing.isHybridApplied
                                ? 'Option 1: Roll + Discounted Loose Cut'
                                : item.rollPricing.pricingMode === 'all_wholesale'
                                ? 'All Wholesale Pricing'
                                : item.rollPricing.pricingMode === 'all_retail'
                                ? 'All Retail Pricing'
                                : 'Fabric Roll Pricing'}
                            </span>
                            {item.rollPricing.savingsAmount > 0 && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                Saves KSh {item.rollPricing.savingsAmount.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
                            {item.rollPricing.fullRollsCount > 0 && (
                              <div className="flex justify-between">
                                <span>📦 {item.rollPricing.fullRollsCount} Full Roll ({item.rollPricing.fullRollMeters}m @ KSh {item.rollPricing.wholesaleRatePerMeter.toLocaleString()}/m W/S):</span>
                                <strong className="text-slate-900 font-sans">KSh {item.rollPricing.fullRollsSubtotal.toLocaleString()}</strong>
                              </div>
                            )}
                            {item.rollPricing.looseMeters > 0 && (
                              <div className="flex justify-between text-indigo-900">
                                <span>✂️ {item.rollPricing.looseMeters}m Loose Cut @ KSh {item.rollPricing.discountedLooseRatePerMeter.toLocaleString()}/m (-{item.rollPricing.looseDiscountPct}% Disc):</span>
                                <strong className="text-indigo-800 font-sans">KSh {item.rollPricing.looseMetersSubtotal.toLocaleString()}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* In-Line Option 1 Roll Pricing Drawer */}
                      {isRollPricingOpen && (
                        <div className="p-3 bg-white rounded-xl border border-indigo-300 shadow-xs space-y-2.5 animate-fade-in text-xs">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                            <span className="font-bold text-indigo-950 text-[11px] flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                              Option 1 Hybrid Roll Split Config
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Batch: {item.batchId}
                            </span>
                          </div>

                          {/* Mode Switch */}
                          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setRollPricingModalMode('hybrid_discounted_loose')}
                              className={`py-1 rounded text-center cursor-pointer transition-colors ${
                                rollPricingModalMode === 'hybrid_discounted_loose'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Option 1 Hybrid
                            </button>
                            <button
                              type="button"
                              onClick={() => setRollPricingModalMode('all_wholesale')}
                              className={`py-1 rounded text-center cursor-pointer transition-colors ${
                                rollPricingModalMode === 'all_wholesale'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              All Wholesale
                            </button>
                            <button
                              type="button"
                              onClick={() => setRollPricingModalMode('all_retail')}
                              className={`py-1 rounded text-center cursor-pointer transition-colors ${
                                rollPricingModalMode === 'all_retail'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              All Retail
                            </button>
                          </div>

                          {rollPricingModalMode === 'hybrid_discounted_loose' && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Roll Size (Meters)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={rollPricingModalStandardMeters}
                                  onChange={(e) => setRollPricingModalStandardMeters(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Loose Discount %</label>
                                <div className="flex items-center gap-1">
                                  {[5, 10, 15, 20].map(pct => (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() => setRollPricingModalDiscountPct(pct)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        rollPricingModalDiscountPct === pct
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      }`}
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveRollPricingBatchId(null)}
                              className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSuccessSound();
                                updateCartItemRollPricing(item.batchId, {
                                  looseDiscountPct: rollPricingModalDiscountPct,
                                  standardRollMeters: rollPricingModalStandardMeters,
                                  pricingMode: rollPricingModalMode
                                });
                                setActiveRollPricingBatchId(null);
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Apply Roll Pricing</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tare Applied Tag */}
                      {item.isTareApplied && item.tareDeduction && item.tareDeduction > 0 && (
                        <div className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-[10px] text-rose-950 flex items-center justify-between font-mono">
                          <span>Gross: <strong className="text-amber-900">{item.scaleGrossWeight?.toFixed(3)}kg</strong></span>
                          <span>Tare: <strong className="text-rose-700">-{item.tareDeduction.toFixed(3)}kg</strong></span>
                          <span>Net Billed: <strong className="text-emerald-700 font-black">{item.netBillableWeight?.toFixed(3)}kg</strong></span>
                        </div>
                      )}

                      {/* In-Line Tare Scale Drawer */}
                      {isTareOpen && (
                        <div className="p-3 bg-white rounded-xl border border-rose-300 shadow-xs space-y-2.5 animate-fade-in text-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-rose-600" />
                              Gross-to-Net Scale Deductor
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {prod?.tareProfile?.packagingDescription || 'Standard Core'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Scale Gross (kg)</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={tareInputGrossWeight || ''}
                                onChange={(e) => setTareInputGrossWeight(parseFloat(e.target.value) || 0)}
                                placeholder="e.g. 5.250"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Cores / Cones Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={tareInputCoreCount}
                                onChange={(e) => setTareInputCoreCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                              />
                            </div>
                          </div>

                          {/* Calculated Pure Net Preview */}
                          {(() => {
                            const totalTare = tareInputCustomPerUnit * tareInputCoreCount;
                            const calculatedNet = Math.max(0, tareInputGrossWeight - totalTare);
                            return (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Tare Deducted</span>
                                  <span className="font-mono font-bold text-rose-700">
                                    - {totalTare.toFixed(3)} kg ({tareInputCoreCount}x {(tareInputCustomPerUnit * 1000).toFixed(0)}g)
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-500 text-[10px] block">Net Billable Stock</span>
                                  <span className="font-mono font-black text-emerald-700 text-xs">
                                    {calculatedNet.toFixed(3)} kg
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveTareItemBatchId(null)}
                              className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSuccessSound();
                                const totalTare = tareInputCustomPerUnit * tareInputCoreCount;
                                const calculatedNet = Math.max(0, tareInputGrossWeight - totalTare);
                                updateCartTare(
                                  item.batchId,
                                  tareInputGrossWeight,
                                  totalTare,
                                  calculatedNet,
                                  `${tareInputCoreCount}x ${(tareInputCustomPerUnit * 1000).toFixed(0)}g Cones`
                                );
                                setActiveTareItemBatchId(null);
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Apply Net Weight</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quantity Decimal Controls & Line Total */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 max-w-[200px]">
                            <CartQuantityInput
                              value={item.quantity}
                              unit={item.unit}
                              category={prod?.category || item.category}
                              onChange={(newQty) => updateCartQuantity(item.batchId, newQty)}
                              showPresets={true}
                              size="sm"
                              onOpenScale={() => {
                                playClickSound();
                                handleOpenDigitalScale(prod, item.scaleGrossWeight || item.quantity, item);
                              }}
                            />
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Line Total</span>
                            <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                              KSh {effectiveLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md btn-hover-lift flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Process Payment &amp; Issue ETR Receipt
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRerouteModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md btn-hover-lift flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Route Order Ticket to Main Store
                  </button>
                )}

                {/* Put On Hold Button */}
                <button
                  onClick={() => setIsHoldModalOpen(true)}
                  className="w-full py-2 bg-slate-50 hover:bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  Put Order On Hold
                </button>

                {/* Transfer Cart Items directly to Shop / Other Store */}
                <button
                  onClick={handleOpenTransferModalWithCart}
                  className="w-full py-2 bg-gradient-to-r from-indigo-50 to-rose-50 hover:from-indigo-100 hover:to-rose-100 text-indigo-900 border border-indigo-200 font-extrabold text-xs rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-sm w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 space-y-4 border-0 sm:border border-amber-200 overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <PauseCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base">Put Order On Hold</h3>
                </div>
                <button
                  onClick={() => setIsHoldModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
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
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="w-1/2 sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  holdCurrentCart(holdNote || 'Order Put On Hold', customerName || 'Walk-in Customer');
                  setHoldNote('');
                  setIsHoldModalOpen(false);
                }}
                className="w-1/2 sm:w-auto px-4 py-2.5 sm:py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-lg w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto border-0 sm:border border-rose-100 space-y-4 p-5 sm:p-6 animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isForwardDated ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {isForwardDated ? <CalendarDays className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isForwardDated ? 'Forward-Dated Reservation Booking' : 'Payment Capture & ETR Billing'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isForwardDated ? 'Stock locked now • Deferred KRA Tax Invoice on fulfillment' : 'Real-time sale • Immediate KRA eTIMS receipt'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sale Mode Selector Switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setIsForwardDated(false)}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  !isForwardDated 
                    ? 'bg-white text-rose-700 shadow-xs border border-rose-200/50' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⚡ Immediate POS Sale</span>
              </button>
              <button
                type="button"
                onClick={() => setIsForwardDated(true)}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isForwardDated 
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black border border-amber-400' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📅 Forward-Dated Order</span>
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold shrink-0">
                {checkoutError}
              </div>
            )}

            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              
              {/* EDITABLE CART ITEMS & WEIGHED QUANTITIES IN CHECKOUT WINDOW */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-rose-600" />
                    <span className="font-extrabold text-slate-900 text-xs">
                      Cart Line Items &amp; Weighed Quantities
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-mono">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Weighed a yarn cone or cut fabric? Edit exact decimal KGS or meters (e.g. <strong className="text-purple-800">1.43 kg</strong>) below:
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {cart.map((item) => {
                    const prod = products.find(p => p.id === item.batchId);
                    return (
                      <div
                        key={item.batchId}
                        className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {item.colorName} • KSh {item.unitPrice.toLocaleString()} / {item.unit}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.batchId)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Remove from checkout"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Direct Decimal Quantity Input Inside Checkout Window */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <div className="flex-1 max-w-[210px]">
                            <CartQuantityInput
                              value={item.quantity}
                              unit={item.unit}
                              category={prod?.category || item.category}
                              onChange={(newQty) => updateCartQuantity(item.batchId, newQty)}
                              showPresets={true}
                              size="sm"
                              onOpenScale={() => {
                                playClickSound();
                                handleOpenDigitalScale(prod, item.scaleGrossWeight || item.quantity, item);
                              }}
                            />
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 block font-sans">Line Total</span>
                            <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                              KSh {(item.unitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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

              {/* Forward-Dated Specific Configuration Box */}
              {isForwardDated && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Forward Fulfillment Date:
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                      Advance Order
                    </span>
                  </div>

                  <input
                    type="date"
                    value={forwardFulfillmentDate}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    onChange={e => setForwardFulfillmentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  {/* Advance Deposit Option Selection */}
                  <div className="space-y-2 pt-1 border-t border-amber-200">
                    <label className="text-xs font-bold text-amber-950 block">
                      Advance Deposit to Collect Today:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setDepositOption('full')}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                          depositOption === 'full'
                            ? 'bg-amber-600 text-white border-amber-600 font-extrabold'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        100% Full (KSh {netGrossPayable.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositOption('half')}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                          depositOption === 'half'
                            ? 'bg-amber-600 text-white border-amber-600 font-extrabold'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        50% Down (KSh {Math.round(netGrossPayable / 2).toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDepositOption('custom');
                          if (!customDepositInput) setCustomDepositInput(Math.round(netGrossPayable * 0.3));
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                          depositOption === 'custom'
                            ? 'bg-amber-600 text-white border-amber-600 font-extrabold'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        Custom KSh
                      </button>
                    </div>

                    {depositOption === 'custom' && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Custom Deposit:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">KSh</span>
                          <input
                            type="number"
                            min="0"
                            max={netGrossPayable}
                            value={customDepositInput}
                            onChange={e => setCustomDepositInput(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full pl-10 pr-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Deposit Breakdown preview */}
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] space-y-1 text-slate-700 font-medium">
                      <div className="flex justify-between">
                        <span>Advance Deposit Collected Today:</span>
                        <span className="font-mono font-bold text-emerald-700">KSh {computedDeposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>Balance Due on Fulfillment:</span>
                        <span className="font-mono">KSh {balanceDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-950 block mb-1">
                      Fulfillment &amp; Delivery Instructions (Optional):
                    </label>
                    <input
                      type="text"
                      value={fulfillmentNotes}
                      onChange={e => setFulfillmentNotes(e.target.value)}
                      placeholder="e.g. Customer to collect at Sales Shop on delivery date"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

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
                  {isForwardDated ? 'Deposit Payment Channel:' : 'Payment Method:'}
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

              {!isForwardDated && (
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
              )}

              {/* 5% Withholding Tax (WHT) Toggle Section */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="applyWHT5"
                      checked={applyWHT5}
                      onChange={e => setApplyWHT5(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="applyWHT5" className="text-xs font-bold text-amber-950 cursor-pointer select-none">
                      Apply 5% Withholding Tax (WHT Credit)
                    </label>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded font-mono text-[10px] font-bold">
                    KRA 5%
                  </span>
                </div>

                {applyWHT5 && (
                  <div className="space-y-2 pt-1.5 border-t border-amber-200/70">
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      For registered corporate/B2B clients withholding 5% tax at source. Registers advance tax credit in ledger.
                    </p>
                    <div>
                      <label className="text-[11px] font-bold text-amber-900 block mb-0.5">
                        Client WHT Certificate No. (Optional):
                      </label>
                      <input
                        type="text"
                        value={whtCertificateNo}
                        onChange={e => setWhtCertificateNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="e.g. KRA-WHT-2026-9921"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cost & Tax Summary Banner */}
              <div className={`${isForwardDated ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'} p-4 rounded-2xl border text-xs space-y-2`}>
                <div className="flex justify-between font-black text-slate-900 items-baseline">
                  <span className="text-xs uppercase font-extrabold text-slate-700">
                    {isForwardDated ? 'Deposit Payable Today:' : applyWHT5 ? 'Net Amount Collectible:' : 'Grand Total Payable:'}
                  </span>
                  <span className={`${isForwardDated ? 'text-amber-700' : 'text-rose-700'} font-mono text-3xl sm:text-4xl font-black tracking-tight`}>
                    KSh {(isForwardDated ? computedDeposit : netGrossPayable).toLocaleString()}
                  </span>
                </div>

                {isForwardDated ? (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-1 text-[11px] text-slate-700 font-medium">
                    <div className="flex justify-between">
                      <span>Total Reserved Order Value:</span>
                      <span className="font-mono font-bold text-slate-900">KSh {totalGross.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-semibold">
                      <span>Balance on Target Date ({forwardFulfillmentDate}):</span>
                      <span className="font-mono font-bold">KSh {balanceDue.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  applyWHT5 && (
                    <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 space-y-1 text-[11px] text-slate-700 font-medium">
                      <div className="flex justify-between">
                        <span>Gross Invoice Value:</span>
                        <span className="font-mono font-bold text-slate-900">KSh {totalGross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-800 font-semibold">
                        <span>Less 5% Withholding Tax (WHT):</span>
                        <span className="font-mono font-bold">- KSh {Number((totalGross * 0.05).toFixed(2)).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                )}

                <p className="text-[11px] text-slate-600 font-medium border-t border-slate-200/60 pt-1.5 flex justify-between items-center">
                  <span>{isForwardDated ? 'KRA eTIMS invoice triggered upon fulfillment' : `Includes 16% KRA VAT: KSh ${vatAmount.toLocaleString()}`}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono font-bold text-slate-800">PIN: {etrConfig.taxPin}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 shrink-0">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckoutSubmit}
                className={`w-1/2 py-3 text-white font-bold text-xs rounded-xl shadow transition-colors ${
                  isForwardDated
                    ? 'bg-amber-600 hover:bg-amber-700 text-slate-950 font-black'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isForwardDated ? 'Confirm & Lock Stock Reservation' : 'Confirm & Issue ETR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REROUTE TICKET CONFIRMATION MODAL FOR STORE 1 / STORE 2 */}
      {isRerouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-md w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border-0 sm:border border-amber-200 animate-in fade-in zoom-in duration-200 overflow-y-auto flex flex-col justify-between sm:justify-start">
            <div className="space-y-4">
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
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={() => setIsRerouteModalOpen(false)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRerouteSubmit}
                className="w-1/2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT INTER-STORE POS STOCK TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-2xl w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-5 border-0 sm:border border-indigo-200 animate-in fade-in zoom-in duration-200 my-0 sm:my-8 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
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
                  {locations.map(loc => (
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
                  {locations.filter(l => l.id !== transferFromLocation).map(loc => (
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
                        {p.name} ({p.colorName}) - Avail at {locations.find(l => l.id === transferFromLocation)?.name}: {srcStock} {p.unit}
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

      {/* DIGITAL SCALE & VARIABLE CONE AUTO-CALCULATOR MODAL */}
      {isDigitalScaleOpen && scaleSelectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-4 max-h-[94vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Digital Scale &amp; Variable Weight Calculator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                      1 KG = KSh {scaleRatePerKg}
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Live gross scale weigh-in with automatic spool tare deduction for accurate inventory and ledger balance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDigitalScaleOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
              {/* Product Info Banner */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl border border-white shadow-xs shrink-0"
                    style={{ backgroundColor: scaleSelectedProduct.colorHex }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {scaleSelectedProduct.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {scaleSelectedProduct.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {scaleSelectedProduct.colorName} • SKU: {scaleSelectedProduct.sku}
                      {scaleSelectedProduct.shadeCode && ` • Shade: ${scaleSelectedProduct.shadeCode}`}
                      {scaleSelectedProduct.dyeLot && ` • Lot: ${scaleSelectedProduct.dyeLot}`}
                      {scaleSelectedProduct.yarnCount && ` • ${scaleSelectedProduct.yarnCount}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                    Active Store Stock: <strong className="font-mono text-slate-900">{scaleSelectedProduct.locationStock[activeLocation] || 0} {scaleSelectedProduct.unit}</strong>
                  </span>
                </div>
              </div>

              {/* Grid: Left Column (Scale Display & Input) | Right Column (Rate, Tare & Calculation) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: Digital Scale Display */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Glowing LED Scale Weight Readout */}
                  <div className="bg-slate-950 rounded-2xl p-5 border-2 border-indigo-500/40 shadow-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between text-xs text-indigo-300 font-mono">
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        DIGITAL SCALE WEIGH-IN
                      </span>
                      <span className="text-[10px] text-slate-400">UNITS: KG</span>
                    </div>

                    <div className="bg-black/60 rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-widest block mb-1">
                        Measured Gross Weight
                      </span>
                      <div className="flex items-baseline gap-2">
                        <input
                          type="number"
                          step="0.001"
                          min="0.01"
                          value={scaleGrossWeight}
                          onChange={e => setScaleGrossWeight(Math.max(0.001, parseFloat(e.target.value) || 0))}
                          className="text-4xl md:text-5xl font-mono font-black text-amber-300 bg-transparent text-center focus:outline-none w-48 border-b border-amber-400/30"
                        />
                        <span className="text-xl font-mono font-bold text-amber-400/70">KG</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-1">
                        = {(scaleGrossWeight * 1000).toFixed(0)} Grams
                      </span>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setScaleGrossWeight(w => Math.max(0.01, Number((w - 0.050).toFixed(3))))}
                        className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        -50g
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleGrossWeight(w => Math.max(0.01, Number((w - 0.010).toFixed(3))))}
                        className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        -10g
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleGrossWeight(2.000)}
                        className="py-1.5 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        2.00kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleGrossWeight(w => Number((w + 0.010).toFixed(3)))}
                        className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        +10g
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleGrossWeight(w => Number((w + 0.050).toFixed(3)))}
                        className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        +50g
                      </button>
                    </div>

                    {/* Common Preset Cones Weights */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Quick Weight Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[1.430, 1.920, 1.950, 2.000, 2.050, 2.080, 2.100, 2.150, 12.000, 24.000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setScaleGrossWeight(val)}
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              scaleGrossWeight === val
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {val.toFixed(3)}kg
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quantity of Cones / Units Input */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Number of Physical Cones on Scale:
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Multiplies spool tare deduction for single or multiple cones.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScaleConeCount(c => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={scaleConeCount}
                        onChange={e => setScaleConeCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 py-1 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setScaleConeCount(c => c + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Rate, Tare & Real-Time Calculation */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Price Rate Per KG */}
                  <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-900">
                        Rate per 1 KG (KSh / KG):
                      </label>
                      <span className="text-[11px] text-indigo-700 font-bold">
                        100g = KSh {(scaleRatePerKg / 10).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={scaleRatePerKg}
                          onChange={e => setScaleRatePerKg(Math.max(1, Number(e.target.value)))}
                          className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setScaleRatePerKg(750)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            scaleRatePerKg === 750 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          750/kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setScaleRatePerKg(850)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            scaleRatePerKg === 850 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          850/kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setScaleRatePerKg(650)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            scaleRatePerKg === 650 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          650/kg
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tare Deduction Presets */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-900">
                        Packaging / Spool Tare Deduction:
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scaleAutoTare}
                          onChange={e => setScaleAutoTare(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-semibold">Auto-Tare</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScaleTarePresetType('standard_cone');
                          setScaleTarePerCone(0.070);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          scaleTarePresetType === 'standard_cone'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-bold">1 Spool</span>
                        <span className="text-[10px] text-slate-500 font-mono">-70g (0.070kg)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setScaleTarePresetType('two_cones');
                          setScaleTarePerCone(0.070);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          scaleTarePresetType === 'two_cones'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-bold">2 Spools</span>
                        <span className="text-[10px] text-slate-500 font-mono">-140g (0.140kg)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setScaleTarePresetType('bale_bag');
                          setScaleTarePerCone(0.840);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          scaleTarePresetType === 'bale_bag'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-bold">Bale Bag</span>
                        <span className="text-[10px] text-slate-500 font-mono">-840g (0.840kg)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setScaleTarePresetType('zero');
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          scaleTarePresetType === 'zero'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-bold">Zero Tare</span>
                        <span className="text-[10px] text-slate-500 font-mono">0g (Pure Net)</span>
                      </button>
                    </div>

                    {scaleTarePresetType === 'custom' && (
                      <div className="pt-2 flex items-center gap-2">
                        <label className="text-xs text-slate-600 font-medium">Custom Tare (KG):</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={scaleCustomTareKg}
                          onChange={e => setScaleCustomTareKg(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Calculated Results Card */}
                  {(() => {
                    let computedTarePerUnit = scaleTarePerCone;
                    if (scaleTarePresetType === 'zero' || !scaleAutoTare) {
                      computedTarePerUnit = 0;
                    } else if (scaleTarePresetType === 'standard_cone') {
                      computedTarePerUnit = scaleTarePerCone;
                    } else if (scaleTarePresetType === 'two_cones') {
                      computedTarePerUnit = scaleTarePerCone * 2;
                    } else if (scaleTarePresetType === 'bale_bag') {
                      computedTarePerUnit = 0.840;
                    } else if (scaleTarePresetType === 'custom') {
                      computedTarePerUnit = scaleCustomTareKg;
                    }

                    const totalTare = (scaleAutoTare && scaleTarePresetType !== 'zero')
                      ? (computedTarePerUnit * (scaleTarePresetType === 'two_cones' ? 1 : scaleConeCount))
                      : 0;

                    const netWeight = Math.max(0.01, Number((scaleGrossWeight - totalTare).toFixed(3)));
                    const totalLineAmount = Number((netWeight * scaleRatePerKg).toFixed(2));
                    const lineVat = Number(((totalLineAmount * 16) / 116).toFixed(2));
                    const lineNet = Number((totalLineAmount - lineVat).toFixed(2));

                    return (
                      <div className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-indigo-500/40 shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                            Calculation Breakdown
                          </span>
                          <span className="text-[11px] font-mono text-amber-300">
                            {netWeight.toFixed(3)} KG × KSh {scaleRatePerKg.toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/5 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">Gross Scale</span>
                            <span className="font-mono font-bold text-xs text-white">{scaleGrossWeight.toFixed(3)} kg</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl">
                            <span className="text-[10px] text-rose-300 block uppercase">Spool Tare</span>
                            <span className="font-mono font-bold text-xs text-rose-300">-{totalTare.toFixed(3)} kg</span>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl">
                            <span className="text-[10px] text-emerald-300 block uppercase font-bold">Pure Net</span>
                            <span className="font-mono font-black text-sm text-emerald-400">{netWeight.toFixed(3)} kg</span>
                          </div>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-white/10">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Billable Price</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (Net: KSh {lineNet.toLocaleString()} + 16% VAT: KSh {lineVat.toLocaleString()})
                            </span>
                          </div>
                          <span className="text-2xl font-black font-mono text-amber-300">
                            KSh {totalLineAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Ledger Explanation Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-900">Ledger &amp; Inventory Accuracy Guarantee: </strong>
                  The system will relieve exactly the pure net weight from inventory stock at <strong>{activeLocInfo?.name}</strong>. No phantom variance will be recorded. The accounting ledger automatically posts the exact billed cash value to Sales Revenue and 16% KRA Output VAT liability.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDigitalScaleOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmScaleWeight}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Scale className="w-4 h-4 text-amber-300" />
                <span>
                  Confirm &amp; Add Net Weight to Cart (KSh {(
                    Math.max(
                      0.01,
                      Number((scaleGrossWeight - (scaleAutoTare && scaleTarePresetType !== 'zero' ? (scaleTarePresetType === 'bale_bag' ? 0.840 : scaleTarePresetType === 'two_cones' ? scaleTarePerCone * 2 : scaleTarePerCone * scaleConeCount) : 0)).toFixed(3))
                    ) * scaleRatePerKg
                  ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
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

      {/* FORWARD-DATED RESERVATIONS & ADVANCE ORDERS MODAL */}
      <ForwardReservationsModal />

    </div>
  );
};
