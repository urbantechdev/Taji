import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Printer, 
  Send, 
  CheckCircle2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  Percent,
  Scissors,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { cn } from '../lib/utils';
import { QuoteItem, BrandingType, calculateQuoteDetails, printProformaQuote, shareQuotePDFViaWhatsApp } from '../lib/quoteUtils';
import { createSupportTicket } from '../lib/ticketService';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: QuoteItem[];
  settings?: any;
}

export default function QuoteModal({ isOpen, onClose, initialItems = [], settings }: QuoteModalProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Nairobi, Kenya');
  const [brandingType, setBrandingType] = useState<BrandingType>('embroidery');
  const [includeVat, setIncludeVat] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharingPDF, setIsSharingPDF] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (!customerName && user.displayName) setCustomerName(user.displayName);
        if (!customerEmail && user.email) setCustomerEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, [customerName, customerEmail]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        if (result.user.displayName) setCustomerName(result.user.displayName);
        if (result.user.email) setCustomerEmail(result.user.email);
        setNotification({ msg: `Signed in as ${result.user.displayName || result.user.email}`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setNotification({ msg: err?.message || 'Google sign-in cancelled or failed', type: 'warning' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  if (!isOpen) return null;

  const quoteDetails = calculateQuoteDetails(items, {
    customerName: customerName.trim() || 'Valued Client',
    customerEmail: customerEmail.trim() || 'client@example.com',
    customerPhone: customerPhone.trim(),
    companyName: companyName.trim(),
    deliveryLocation: deliveryLocation.trim(),
    brandingType,
    includeVat,
    notes: notes.trim(),
  });

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handlePrintPDF = () => {
    printProformaQuote(quoteDetails, settings?.headerLogoUrl);
  };

  const handleWhatsAppSend = async () => {
    setIsSharingPDF(true);
    setNotification({ msg: 'Compiling official PDF quotation document with logo...', type: 'info' });
    
    try {
      await shareQuotePDFViaWhatsApp(quoteDetails, settings, (msg, type) => {
        setNotification({ msg, type });
      });
    } catch (err) {
      console.error('Failed to share PDF via WhatsApp:', err);
      setNotification({ msg: 'WhatsApp draft opened. Download official PDF manually if needed.', type: 'warning' });
    } finally {
      setIsSharingPDF(false);
    }
  };

  const handleSubmitQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one product item to request a quote.');
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Please provide your name and email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        companyName: companyName.trim(),
        deliveryLocation: deliveryLocation.trim(),
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userPhotoUrl: currentUser?.photoURL || null,
        items: items.map(item => ({
          id: item.id || 'quote-item',
          name: item.name,
          price: Number(item.price),
          imageUrl: item.imageUrl || '',
          quantity: Number(item.quantity),
          category: item.category || 'General',
          selectedColor: item.selectedColor || 'Standard'
        })),
        totalAmount: Number(quoteDetails.grandTotal),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Also raise formal Support & Quotation Ticket and notify feminiholdings@gmail.com
      try {
        const itemSummary = items.map(i => `${i.quantity}x ${i.name} (KES ${(i.price * i.quantity).toLocaleString()})`).join(', ');
        await createSupportTicket({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          companyName: companyName.trim(),
          category: 'Bulk Quotation',
          priority: 'high',
          subject: `Wholesale Quotation Request #${quoteDetails.quoteRef} (${items.length} items)`,
          message: `Quotation Reference: ${quoteDetails.quoteRef}\nItems: ${itemSummary}\nBranding: ${brandingType}\nSubtotal: KES ${quoteDetails.subtotal.toLocaleString()}\nGrand Total: KES ${quoteDetails.grandTotal.toLocaleString()}\nDelivery: ${deliveryLocation || 'Factory Pickup'}\nNotes: ${notes.trim() || 'None'}`,
          source: 'Quote Request',
          items: items,
          totalAmount: Number(quoteDetails.grandTotal),
        });
      } catch (ticketErr) {
        console.warn('Quote ticket raise background notice:', ticketErr);
      }

      setSubmittedRef(quoteDetails.quoteRef);
    } catch (err) {
      console.error('Failed to submit quote request:', err);
      alert('Could not submit quote request. Please try WhatsApp or PDF download.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-blue/70 backdrop-blur-md z-[2000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-green/20 rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4">
            <img 
              src={settings?.headerLogoUrl || "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg"} 
              alt="Tewaw Enterprise Logo" 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-green shadow-lg shadow-brand-green/30"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full border border-brand-green/20">
                  Tewaw Enterprise Ltd
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">#{quoteDetails.quoteRef}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-white mt-1">
                Formal Proforma Quotation
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedRef ? (
          <div className="p-8 sm:p-12 text-center space-y-6 my-auto">
            <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black text-brand-blue uppercase">Quote Request Submitted!</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto">
                Your quotation request <span className="font-mono font-bold text-brand-blue">#{submittedRef}</span> has been logged with our Nairobi sales desk.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                onClick={handlePrintPDF}
                className="px-6 py-3.5 bg-brand-green text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg hover:bg-[#1f7743] transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Download Official PDF Quote
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3.5 bg-slate-100 text-slate-700 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
            {/* Customer & Company Details Form */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-brand-blue font-black uppercase text-xs tracking-wider">
                  <User className="w-4 h-4 text-brand-green" /> Client Information & Destination
                </div>

                {/* Google Sign In Quick Auto-Fill */}
                {currentUser ? (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                    )}
                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-extrabold transition-all shadow-xs"
                    title="Sign in with Google to auto-fill your contact info"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
                    ) : (
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.57-1.02-1.32-1.19-2.09z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>1-Click Auto-Fill with Google</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">Your Name / Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane@company.co.ke"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">Organization / Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Security Ltd"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="e.g. +254 700 000000"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
            </div>

            {/* Selected Garments & Quantities */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-brand-orange" /> Line Items & Quantities ({items.length})
                </h4>

                {quoteDetails.bulkDiscountPercent > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Tier Discount Applied: {quoteDetails.bulkDiscountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                      )}
                      <div>
                        <p className="font-bold text-brand-blue text-sm">{item.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {item.category} • Color: {item.selectedColor || 'Standard'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        <button onClick={() => updateQuantity(idx, -1)} className="text-slate-500 font-black px-1.5 hover:text-brand-blue">-</button>
                        <span className="text-xs font-mono font-black text-brand-blue min-w-[24px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="text-slate-500 font-black px-1.5 hover:text-brand-blue">+</button>
                      </div>

                      <div className="text-right font-mono font-bold text-brand-blue text-sm">
                        KES {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    No products added to quote yet.
                  </div>
                )}
              </div>
            </div>

            {/* Custom Branding & VAT Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Custom Branding & Finishing</label>
                <select
                  value={brandingType}
                  onChange={e => setBrandingType(e.target.value as BrandingType)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-blue focus:outline-none"
                >
                  <option value="none">Standard / Unbranded Garments</option>
                  <option value="embroidery">Precision Computer Embroidery (+KES 350/item)</option>
                  <option value="dtf_print">DTF Full-Color Digital Transfer (+KES 280/item)</option>
                  <option value="3d_pocket_print">3D Pocket & Silicone Relief Print (+KES 320/item)</option>
                  <option value="sublimation">Full & Panel Sublimation (+KES 250/item)</option>
                  <option value="color_customization">Custom Color Matching & Trims (+KES 180/item)</option>
                  <option value="screen_print">High-Capacity Silk Screen Print (+KES 200/item)</option>
                </select>
                <p className="text-[10px] text-slate-400">Includes front chest, 3D pocket, sleeve, or full-panel placement.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Tax & VAT Calculation</label>
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={e => setIncludeVat(e.target.checked)}
                    className="w-4 h-4 text-brand-green rounded focus:ring-brand-green"
                  />
                  <span className="text-xs font-bold text-slate-700">Include Estimated 16% VAT</span>
                </label>
                <p className="text-[10px] text-slate-400">Official tax invoices issued with KRA PIN receipt upon payment.</p>
              </div>
            </div>

            {/* Quotation Summary Card */}
            <div className="bg-brand-blue text-white p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold uppercase tracking-wider border-b border-white/10 pb-3">
                <span>Items Subtotal</span>
                <span className="font-mono text-white font-black text-sm">KES {quoteDetails.subtotal.toLocaleString()}</span>
              </div>

              {quoteDetails.bulkDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-brand-green font-bold uppercase tracking-wider">
                  <span>Bulk Quantity Discount ({quoteDetails.bulkDiscountPercent}%)</span>
                  <span className="font-mono text-brand-green font-black text-sm">- KES {quoteDetails.bulkDiscountAmount.toLocaleString()}</span>
                </div>
              )}

              {quoteDetails.brandingCost > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-300 font-bold uppercase tracking-wider">
                  <span>Custom Branding ({quoteDetails.brandingType.toUpperCase()})</span>
                  <span className="font-mono text-white font-black text-sm">+ KES {quoteDetails.brandingCost.toLocaleString()}</span>
                </div>
              )}

              {quoteDetails.includeVat && (
                <div className="flex justify-between items-center text-xs text-slate-300 font-bold uppercase tracking-wider">
                  <span>Estimated VAT (16%)</span>
                  <span className="font-mono text-white font-black text-sm">KES {quoteDetails.vatAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-white/20">
                <div>
                  <p className="text-xs font-black uppercase text-brand-green tracking-widest">Estimated Grand Total</p>
                  <p className="text-[10px] text-slate-400">Includes manufacturing & packaging</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-brand-green">
                    KES {quoteDetails.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Toast Banner */}
            {notification && (
              <div className={cn(
                "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border animate-in fade-in slide-in-from-bottom-2",
                notification.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : (
                  notification.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-sky-50 border-sky-200 text-sky-800"
                )
              )}>
                {notification.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />}
                {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                <span className="flex-1">{notification.msg}</span>
                <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="py-4 px-4 bg-brand-green text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1f7743] transition-all shadow-lg shadow-brand-green/20"
              >
                <Printer className="w-4 h-4" /> Download Official PDF Quote
              </button>

              <button
                type="button"
                onClick={handleWhatsAppSend}
                disabled={isSharingPDF}
                className="py-4 px-4 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1ebd59] transition-all shadow-lg shadow-green-500/20 disabled:opacity-60"
              >
                {isSharingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Share PDF via WhatsApp
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSubmitQuoteRequest}
                disabled={isSubmitting}
                className="py-4 px-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
              >
                <FileText className="w-4 h-4 text-brand-orange" /> Submit Formal Request
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
