import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useERP } from '../../context/ERPContext';
import { SaleOrder, LocationId } from '../../types';
import { playSuccessSound, playClickSound } from '../../utils/audio';
import {
  X,
  Check,
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  FileText,
  Printer,
  MessageCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface StorefrontCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: SaleOrder) => void;
}

export const StorefrontCheckoutModal: React.FC<StorefrontCheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted
}) => {
  const { 
    cart, 
    clearCart, 
    locations, 
    createBillingDocument, 
    recordAuditLog,
    brandSettings 
  } = useERP();

  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  
  // Customer details state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerKraPin, setCustomerKraPin] = useState('');

  // Fulfillment state
  const [fulfillmentType, setFulfillmentType] = useState<'store_pickup' | 'dispatch_delivery'>('store_pickup');
  const [pickupLocation, setPickupLocation] = useState<LocationId>('main_store');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTown, setDeliveryTown] = useState('Nairobi');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Bank Transfer' | 'Card' | 'Cash'>('M-Pesa');
  const [mpesaReference, setMpesaReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<SaleOrder | null>(null);

  if (!isOpen) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.rollPricing?.totalPrice ?? (item.unitPrice * item.quantity)), 0);
  const deliveryFee = fulfillmentType === 'dispatch_delivery' && subtotal < 10000 ? 500 : 0;
  const vatAmount = Math.round(subtotal * 0.16);
  const grandTotal = subtotal + vatAmount + deliveryFee;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter your full name and phone number to proceed with order fulfillment.');
      return;
    }
    if (fulfillmentType === 'dispatch_delivery' && !deliveryAddress.trim()) {
      alert('Please enter your delivery address/street in ' + deliveryTown);
      return;
    }
    playClickSound();
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    playClickSound();

    try {
      // Auto-generate M-Pesa reference if blank
      const ref = mpesaReference.trim() || `TJI${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const res = await createBillingDocument({
        documentType: 'receipt',
        locationId: pickupLocation,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerKraPin: customerKraPin.trim() || undefined,
        customerAddress: fulfillmentType === 'dispatch_delivery' ? `${deliveryAddress}, ${deliveryTown}` : undefined,
        paymentMethod: paymentMethod,
        paymentReference: ref,
        items: cart.map(c => ({
          batchId: c.batchId,
          productName: c.productName,
          category: c.category,
          unit: c.unit,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          totalPrice: c.rollPricing?.totalPrice ?? (c.unitPrice * c.quantity),
          scaleGrossWeight: c.scaleGrossWeight,
          tareDeduction: c.tareDeduction,
          netBillableWeight: c.netBillableWeight,
          tareDescription: c.tareDescription
        })),
        notes: `Online Storefront Order (${fulfillmentType === 'store_pickup' ? 'Branch Pickup at ' + pickupLocation : 'Delivery to ' + deliveryTown})`
      });

      if (res.success && res.order) {
        playSuccessSound();
        setCompletedOrder(res.order);
        clearCart();
        setStep('confirmation');
        if (onOrderCompleted) {
          onOrderCompleted(res.order);
        }
        recordAuditLog('Online Order Placed', `Order ${res.order.receiptNumber} placed by ${customerName} (${customerPhone})`);
      } else {
        alert(res.message || 'Failed to place order. Please check inventory or try again.');
      }
    } catch (err: any) {
      console.error('Order error:', err);
      alert('An error occurred during order submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const openWhatsAppConfirmation = () => {
    if (!completedOrder) return;
    const phone = '254700111000';
    const text = encodeURIComponent(
      `Hello Taji Textile! I just placed Online Order #${completedOrder.receiptNumber} for KSh ${completedOrder.grandTotal.toLocaleString()}. Name: ${customerName}, Phone: ${customerPhone}. Please confirm dispatch / pickup readiness!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
        id="storefront-checkout-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {step === 'confirmation' ? 'Order Confirmed!' : 'Complete Your Textile Order'}
                </h3>
                <p className="text-xs text-slate-500">
                  {step === 'details' && 'Step 1 of 2: Customer & Delivery Details'}
                  {step === 'payment' && 'Step 2 of 2: Payment & ETR Verification'}
                  {step === 'confirmation' && 'Receipt & Fulfillment Notification'}
                </p>
              </div>
            </div>

            {step !== 'confirmation' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* STEP 1: CUSTOMER & FULFILLMENT DETAILS */}
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                
                {/* Customer Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    1. Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Kamau / Nairobi Uniforms"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number (M-Pesa Verified) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+254 7XX XXX XXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address (For eTIMS Digital Invoice)
                      </label>
                      <input
                        type="email"
                        placeholder="orders@yourbusiness.co.ke"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        KRA PIN (Optional for ETR Tax Credit)
                      </label>
                      <input
                        type="text"
                        placeholder="P051982341Z"
                        value={customerKraPin}
                        onChange={(e) => setCustomerKraPin(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Fulfillment Selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Fulfillment Method
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('store_pickup')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        fulfillmentType === 'store_pickup'
                          ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-xs">Branch Store Pickup</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold mt-1">FREE Collection</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentType('dispatch_delivery')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        fulfillmentType === 'dispatch_delivery'
                          ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-xs">Countrywide Delivery</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">Nairobi / Fargo / Matatu Parcel</span>
                    </button>
                  </div>

                  {/* Branch Selector or Address Inputs */}
                  {fulfillmentType === 'store_pickup' ? (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Select Collection Branch:
                      </label>
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value as LocationId)}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-rose-500 cursor-pointer"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} — {loc.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Town / City *
                        </label>
                        <select
                          value={deliveryTown}
                          onChange={(e) => setDeliveryTown(e.target.value)}
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-rose-500 cursor-pointer"
                        >
                          <option value="Nairobi">Nairobi (CBD &amp; Environs)</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Eldoret">Eldoret</option>
                          <option value="Thika">Thika</option>
                          <option value="Machakos">Machakos</option>
                          <option value="Other">Other Kenya Town</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Delivery Street / Building Address *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. River Road, Shop 12 / Industrial Area"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-rose-500 outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Cost Preview */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({totalItems} items):</span>
                    <span className="font-mono font-bold text-slate-900">KSh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>16% VAT:</span>
                    <span className="font-mono text-slate-700">KSh {vatAmount.toLocaleString()}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className="font-mono text-slate-700">KSh {deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-rose-700 text-base">KSh {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD & ETR PROCESSING */}
            {step === 'payment' && (
              <div className="space-y-5">
                <button
                  onClick={() => setStep('details')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Customer Details</span>
                </button>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Payment Method
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['M-Pesa', 'Bank Transfer', 'Card', 'Cash'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          paymentMethod === method
                            ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {method === 'M-Pesa' && <Smartphone className="w-4 h-4" />}
                        {method === 'Bank Transfer' && <Building className="w-4 h-4" />}
                        {method === 'Card' && <CreditCard className="w-4 h-4" />}
                        {method === 'Cash' && <ShoppingBag className="w-4 h-4" />}
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* M-Pesa Instructions Box */}
                {paymentMethod === 'M-Pesa' && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 text-xs text-emerald-950">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>Lipa Na M-Pesa • Buy Goods Till</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Buy Goods Till No:</span>
                        <p className="font-mono font-black text-sm text-slate-900">8829101</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Account Name:</span>
                        <p className="font-bold text-xs text-slate-900 truncate">TAJI TEXTILE ENTERPRISE</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                        M-Pesa Transaction Confirmation Code (Optional or auto-generated):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. QK89128X9P"
                        value={mpesaReference}
                        onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                )}

                {/* Bank Transfer Instructions */}
                {paymentMethod === 'Bank Transfer' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-800">
                    <p className="font-bold text-slate-900">Bank Transfer / Pesalink Account:</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                      <p><strong>Bank:</strong> Equity Bank Kenya</p>
                      <p><strong>Account Name:</strong> Taji Textile Ltd</p>
                      <p><strong>Account Number:</strong> 0180299182301</p>
                      <p><strong>Branch:</strong> Supreme Centre Nairobi</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Bank Ref / Slip Number"
                      value={mpesaReference}
                      onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                )}

                {/* Cash on Delivery / Store Collection Note */}
                {(paymentMethod === 'Cash' || paymentMethod === 'Card') && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold">Pay Upon Pickup or Driver Arrival</p>
                    <p className="text-[11px]">
                      Our store terminals and dispatch drivers carry active card POS and official M-Pesa Till readers.
                    </p>
                  </div>
                )}

                {/* Final Order Confirmation Button */}
                <button
                  onClick={handleCompleteOrder}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                  id="checkout-place-order-button"
                >
                  {isSubmitting ? (
                    <span>Registering Order with eTIMS...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Confirm &amp; Place Order (KSh {grandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>

              </div>
            )}

            {/* STEP 3: ORDER CONFIRMATION & ETR RECEIPT */}
            {step === 'confirmation' && completedOrder && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Thank You, {customerName}!</h3>
                  <p className="text-xs text-slate-600">
                    Your order has been recorded in the Taji ERP system and synchronized with KRA eTIMS.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Official Order #</span>
                      <p className="font-mono font-black text-sm text-rose-700">{completedOrder.receiptNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                      {completedOrder.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Customer:</span>
                      <span className="font-bold text-slate-800">{completedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone:</span>
                      <span className="font-mono font-semibold text-slate-800">{completedOrder.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fulfillment:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {fulfillmentType === 'store_pickup' ? `Pickup (${pickupLocation})` : `Delivery (${deliveryTown})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Payment Ref:</span>
                      <span className="font-mono font-semibold text-slate-800">{completedOrder.paymentReference || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>Total Paid:</span>
                    <span className="font-mono text-rose-700">KSh {completedOrder.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Post Order Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={openWhatsAppConfirmation}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Dispatch Confirmation</span>
                  </button>

                  <button
                    onClick={handlePrintReceipt}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print ETR Receipt</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
