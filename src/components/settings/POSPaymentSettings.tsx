import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Smartphone,
  CreditCard,
  Receipt,
  Landmark,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  DollarSign,
  QrCode,
  Store,
  FileText,
  Printer
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const POSPaymentSettings: React.FC = () => {
  const {
    etrConfig,
    updateETRConfig,
    recordAuditLog,
    locations,
    currentUser
  } = useERP();

  // Payment Gateway Configuration
  const [mpesaTillNumber, setMpesaTillNumber] = useState(
    localStorage.getItem('pos_mpesa_till') || '542910'
  );
  const [mpesaPaybillNumber, setMpesaPaybillNumber] = useState(
    localStorage.getItem('pos_mpesa_paybill') || '880100'
  );
  const [mpesaAccountRef, setMpesaAccountRef] = useState(
    localStorage.getItem('pos_mpesa_ref') || 'TAJI-FABRICS'
  );
  const [primaryBankName, setPrimaryBankName] = useState(
    localStorage.getItem('pos_primary_bank') || 'Equity Bank Kenya'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    localStorage.getItem('pos_bank_acc') || '0180293849102'
  );
  const [bankBranchName, setBankBranchName] = useState(
    localStorage.getItem('pos_bank_branch') || 'Nairobi Supreme Centre'
  );
  const [enableCardPOS, setEnableCardPOS] = useState(
    localStorage.getItem('pos_enable_card') !== 'false'
  );
  const [cardTerminalId, setCardTerminalId] = useState(
    localStorage.getItem('pos_card_terminal') || 'PDQ-KEN-8921'
  );

  // Shift & Cash Drawer Controls
  const [defaultMorningFloat, setDefaultMorningFloat] = useState<number>(
    Number(localStorage.getItem('pos_morning_float')) || 10000
  );
  const [maxCashDrawerLimit, setMaxCashDrawerLimit] = useState<number>(
    Number(localStorage.getItem('pos_max_cash_limit')) || 60000
  );
  const [requireManagerDiscountPin, setRequireManagerDiscountPin] = useState(
    localStorage.getItem('pos_req_mgr_pin') !== 'false'
  );
  const [maxCashierDiscountPercent, setMaxCashierDiscountPercent] = useState<number>(
    Number(localStorage.getItem('pos_max_cashier_disc')) || 10
  );
  const [strictCashReconciliation, setStrictCashReconciliation] = useState(
    localStorage.getItem('pos_strict_reconcile') !== 'false'
  );

  // Receipt Layout Customization
  const [receiptHeaderTitle, setReceiptHeaderTitle] = useState(
    localStorage.getItem('pos_receipt_title') || 'TAJI FABRICS KENYA'
  );
  const [receiptTagline, setReceiptTagline] = useState(
    localStorage.getItem('pos_receipt_tagline') || 'Premium Dereck, Fleece & Knitting Yarns'
  );
  const [receiptPhone, setReceiptPhone] = useState(
    localStorage.getItem('pos_receipt_phone') || '+254 700 111 222'
  );
  const [receiptEmail, setReceiptEmail] = useState(
    localStorage.getItem('pos_receipt_email') || 'sales@tajifabrics.co.ke'
  );
  const [whatsappSupport, setWhatsappSupport] = useState(
    localStorage.getItem('pos_receipt_whatsapp') || '+254 711 999 888'
  );
  const [returnPolicyText, setReturnPolicyText] = useState(
    localStorage.getItem('pos_receipt_policy') ||
    'Goods once cut or processed are strictly non-returnable. Uncut rolls exchangeable within 7 days in original condition with valid receipt.'
  );
  const [showVatBreakdown, setShowVatBreakdown] = useState(
    localStorage.getItem('pos_receipt_vat_breakdown') !== 'false'
  );
  const [showQrVerification, setShowQrVerification] = useState(
    localStorage.getItem('pos_receipt_qr') !== 'false'
  );

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSavePOSConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    playClickSound();

    try {
      // Save all keys to local storage for instant persistence
      localStorage.setItem('pos_mpesa_till', mpesaTillNumber.trim());
      localStorage.setItem('pos_mpesa_paybill', mpesaPaybillNumber.trim());
      localStorage.setItem('pos_mpesa_ref', mpesaAccountRef.trim());
      localStorage.setItem('pos_primary_bank', primaryBankName.trim());
      localStorage.setItem('pos_bank_acc', bankAccountNumber.trim());
      localStorage.setItem('pos_bank_branch', bankBranchName.trim());
      localStorage.setItem('pos_enable_card', String(enableCardPOS));
      localStorage.setItem('pos_card_terminal', cardTerminalId.trim());

      localStorage.setItem('pos_morning_float', String(defaultMorningFloat));
      localStorage.setItem('pos_max_cash_limit', String(maxCashDrawerLimit));
      localStorage.setItem('pos_req_mgr_pin', String(requireManagerDiscountPin));
      localStorage.setItem('pos_max_cashier_disc', String(maxCashierDiscountPercent));
      localStorage.setItem('pos_strict_reconcile', String(strictCashReconciliation));

      localStorage.setItem('pos_receipt_title', receiptHeaderTitle.trim());
      localStorage.setItem('pos_receipt_tagline', receiptTagline.trim());
      localStorage.setItem('pos_receipt_phone', receiptPhone.trim());
      localStorage.setItem('pos_receipt_email', receiptEmail.trim());
      localStorage.setItem('pos_receipt_whatsapp', whatsappSupport.trim());
      localStorage.setItem('pos_receipt_policy', returnPolicyText.trim());
      localStorage.setItem('pos_receipt_vat_breakdown', String(showVatBreakdown));
      localStorage.setItem('pos_receipt_qr', String(showQrVerification));

      // Also update ETR config if applicable
      updateETRConfig({
        receiptFooterMessage: returnPolicyText.trim()
      });

      playSuccessSound();
      setStatusMessage({
        type: 'success',
        text: 'POS checkout rules, M-Pesa/Bank gateways & receipt layout saved successfully!'
      });
      recordAuditLog('POS_CONFIG_UPDATED', `Updated POS checkout & payment gateway rules`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save POS settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    playClickSound();
    setMpesaTillNumber('542910');
    setMpesaPaybillNumber('880100');
    setMpesaAccountRef('TAJI-FABRICS');
    setPrimaryBankName('Equity Bank Kenya');
    setBankAccountNumber('0180293849102');
    setBankBranchName('Nairobi Supreme Centre');
    setEnableCardPOS(true);
    setCardTerminalId('PDQ-KEN-8921');

    setDefaultMorningFloat(10000);
    setMaxCashDrawerLimit(60000);
    setRequireManagerDiscountPin(true);
    setMaxCashierDiscountPercent(10);
    setStrictCashReconciliation(true);

    setReceiptHeaderTitle('TAJI FABRICS KENYA');
    setReceiptTagline('Premium Dereck, Fleece & Knitting Yarns');
    setReceiptPhone('+254 700 111 222');
    setReceiptEmail('sales@tajifabrics.co.ke');
    setWhatsappSupport('+254 711 999 888');
    setReturnPolicyText('Goods once cut or processed are strictly non-returnable. Uncut rolls exchangeable within 7 days in original condition with valid receipt.');
    setShowVatBreakdown(true);
    setShowQrVerification(true);

    setStatusMessage({
      type: 'success',
      text: 'Reset POS checkout settings to system defaults.'
    });
  };

  return (
    <form onSubmit={handleSavePOSConfig} className="space-y-6" id="pos-payment-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              POS, Checkout &amp; Payment Gateway Settings
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                Payment Channels
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Govern M-Pesa Tills, Paybill details, bank settlement, cashier shift floats, discount thresholds &amp; receipt customization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save POS Settings'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Payment Gateways & Settlement Accounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. M-Pesa &amp; Bank Channels
              </h4>
              <p className="text-[10px] text-slate-400">Direct customer payment gateways</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                M-Pesa Buy Goods Till Number
              </label>
              <input
                type="text"
                value={mpesaTillNumber}
                onChange={e => setMpesaTillNumber(e.target.value)}
                placeholder="e.g. 542910"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Displayed prominently on POS prompt &amp; receipt</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  M-Pesa Paybill
                </label>
                <input
                  type="text"
                  value={mpesaPaybillNumber}
                  onChange={e => setMpesaPaybillNumber(e.target.value)}
                  placeholder="e.g. 880100"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Name / Ref
                </label>
                <input
                  type="text"
                  value={mpesaAccountRef}
                  onChange={e => setMpesaAccountRef(e.target.value)}
                  placeholder="e.g. TAJI"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Settlement Bank Name
              </label>
              <input
                type="text"
                value={primaryBankName}
                onChange={e => setPrimaryBankName(e.target.value)}
                placeholder="e.g. Equity Bank Kenya"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 0180293849102"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="cardPos" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                  <span>Enable Card PDQ Terminal</span>
                </label>
                <input
                  type="checkbox"
                  id="cardPos"
                  checked={enableCardPOS}
                  onChange={e => setEnableCardPOS(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>
              {enableCardPOS && (
                <input
                  type="text"
                  value={cardTerminalId}
                  onChange={e => setCardTerminalId(e.target.value)}
                  placeholder="Terminal Serial: e.g. PDQ-KEN-8921"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 outline-hidden"
                />
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Shift, Float & Cash Drawer Governance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Shift &amp; Drawer Controls
              </h4>
              <p className="text-[10px] text-slate-400">Cash float &amp; discount authorization</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Morning Opening Cash Float (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={defaultMorningFloat}
                onChange={e => setDefaultMorningFloat(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Pre-loaded cash change amount at shift start</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Drawer Cash Limit Alert (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={maxCashDrawerLimit}
                onChange={e => setMaxCashDrawerLimit(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Triggers safety prompt to bank excess counter cash</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="mgrPin" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Require Manager PIN for Custom Discounts
                </label>
                <input
                  type="checkbox"
                  id="mgrPin"
                  checked={requireManagerDiscountPin}
                  onChange={e => setRequireManagerDiscountPin(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Prevents unauthorized cashier price cuts above standard threshold without supervisor approval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cashier Discretionary Discount Cap (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxCashierDiscountPercent}
                  onChange={e => setMaxCashierDiscountPercent(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Maximum % a cashier can apply without manager unlock</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="strictRecon" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Strict Shift End Cash Reconciliation
                </label>
                <input
                  type="checkbox"
                  id="strictRecon"
                  checked={strictCashReconciliation}
                  onChange={e => setStrictCashReconciliation(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Requires physical denomination breakdown (1000s, 500s, coins) upon shift closure.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Receipt Template Customizer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Receipt Layout &amp; Policies
              </h4>
              <p className="text-[10px] text-slate-400">Customer thermal receipt header &amp; footer</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Banner Title
              </label>
              <input
                type="text"
                value={receiptHeaderTitle}
                onChange={e => setReceiptHeaderTitle(e.target.value)}
                placeholder="e.g. TAJI FABRICS KENYA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={receiptTagline}
                onChange={e => setReceiptTagline(e.target.value)}
                placeholder="e.g. Premium Dereck, Fleece & Knitting Yarns"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sales Phone
                </label>
                <input
                  type="text"
                  value={receiptPhone}
                  onChange={e => setReceiptPhone(e.target.value)}
                  placeholder="+254 700 111 222"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Support
                </label>
                <input
                  type="text"
                  value={whatsappSupport}
                  onChange={e => setWhatsappSupport(e.target.value)}
                  placeholder="+254 711 999 888"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Return &amp; Exchange Policy Statement
              </label>
              <textarea
                rows={3}
                value={returnPolicyText}
                onChange={e => setReturnPolicyText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-hidden resize-none"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span>Print VAT 16% Subtotal Breakdown</span>
                <input
                  type="checkbox"
                  checked={showVatBreakdown}
                  onChange={e => setShowVatBreakdown(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span>Print QR Code Verification on Receipt</span>
                <input
                  type="checkbox"
                  checked={showQrVerification}
                  onChange={e => setShowQrVerification(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
};
