import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { SaleOrder } from '../../types';
import {
  Receipt,
  Printer,
  QrCode,
  Building,
  CheckCircle2,
  FileText,
  Search,
  Settings,
  ShieldCheck,
  Percent,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  Coins,
  AlertCircle
} from 'lucide-react';

export const ETRModule: React.FC = () => {
  const { orders, etrConfig, updateETRConfig, setSelectedReceipt, convertQuotationToInvoice } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'invoices' | 'quotations' | 'wht'>('all');
  const [isConfigEditing, setIsConfigEditing] = useState(false);

  // Quick Quotation Converter state
  const [convertingQuotation, setConvertingQuotation] = useState<SaleOrder | null>(null);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [convertApplyWHT, setConvertApplyWHT] = useState(false);
  const [convertWhtCert, setConvertWhtCert] = useState('');
  const [convertError, setConvertError] = useState<string | null>(null);

  // Form states for ETR Config
  const [companyName, setCompanyName] = useState(etrConfig.companyName);
  const [taxPin, setTaxPin] = useState(etrConfig.taxPin);
  const [cuSerial, setCuSerial] = useState(etrConfig.cuSerialNumber);
  const [address, setAddress] = useState(etrConfig.companyAddress);
  const [phone, setPhone] = useState(etrConfig.companyPhone);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateETRConfig({
      companyName,
      taxPin,
      cuSerialNumber: cuSerial,
      companyAddress: address,
      companyPhone: phone
    });
    setIsConfigEditing(false);
  };

  const handleConvertQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingQuotation) return;
    setConvertError(null);
    const res = convertQuotationToInvoice(
      convertingQuotation.id,
      convertPaymentMethod,
      convertApplyWHT,
      convertWhtCert
    );
    if (!res.success) {
      setConvertError(res.message);
    } else {
      setConvertingQuotation(null);
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerKraPin && o.customerKraPin.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilterTab === 'invoices') return !o.isQuotation;
    if (activeFilterTab === 'quotations') return !!o.isQuotation;
    if (activeFilterTab === 'wht') return !!o.wht5Applied;
    return true;
  });

  // Calculate high-level billing summary metrics
  const completedOrders = orders.filter(o => !o.isQuotation);
  const activeQuotations = orders.filter(o => !!o.isQuotation);
  const whtInvoices = orders.filter(o => !!o.wht5Applied);

  const totalInvoicedGross = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalVatCollected = completedOrders.reduce((sum, o) => sum + o.vatAmount, 0);
  const totalQuotationValue = activeQuotations.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalWhtCredits = whtInvoices.reduce((sum, o) => sum + (o.whtAmount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rainbow" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <h2 className="font-bold text-lg font-sans">
              Billing, Invoicing, Receipts &amp; Quotations Engine
            </h2>
          </div>
          <p className="text-xs text-rose-100 max-w-2xl">
            Complete automated billing suite with Kenya Revenue Authority (KRA) TIMS 16% VAT compliance, official commercial tax invoices, ETR thermal receipts, proforma quotations, and 5% Withholding Tax management.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs font-mono space-y-1 shrink-0">
          <p><strong>Company Tax PIN:</strong> {etrConfig.taxPin}</p>
          <p><strong>TIMS CU Serial:</strong> {etrConfig.cuSerialNumber}</p>
          <p className="text-emerald-300 font-bold font-sans flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> TIMS Live Online Sync Active
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 font-sans">
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Invoiced Revenue</span>
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg md:text-xl font-bold font-mono text-slate-900">
            KSh {totalInvoicedGross.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            {completedOrders.length} Paid Tax Invoices
          </p>
        </div>

        {/* 16% VAT Collected */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>16% Output VAT Recorded</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg md:text-xl font-bold font-mono text-amber-900">
            KSh {totalVatCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500">
            KRA Output VAT Liability
          </p>
        </div>

        {/* Quotations Pipeline */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Quotations</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg md:text-xl font-bold font-mono text-blue-900">
            KSh {totalQuotationValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-blue-600 font-medium">
            {activeQuotations.length} Proforma Quotations Pending
          </p>
        </div>

        {/* 5% WHT Credits */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>5% Withholding Tax (WHT)</span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg md:text-xl font-bold font-mono text-purple-900">
            KSh {totalWhtCredits.toLocaleString()}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">
            {whtInvoices.length} B2B Invoices with WHT
          </p>
        </div>
      </div>

      {/* Control Navigation, Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs space-y-4 font-sans">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setActiveFilterTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({orders.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('invoices')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'invoices'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tax Invoices &amp; Receipts ({completedOrders.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('quotations')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'quotations'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Official Quotations ({activeQuotations.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('wht')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'wht'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              5% WHT Invoices ({whtInvoices.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Receipt #, PIN, Client..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsConfigEditing(!isConfigEditing)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{isConfigEditing ? 'Close Settings' : 'ETR Tax Settings'}</span>
            </button>
          </div>

        </div>

        {/* ETR Config Editor Form */}
        {isConfigEditing && (
          <form onSubmit={handleSaveConfig} className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3 text-xs font-sans animate-in fade-in duration-150">
            <h4 className="font-bold text-slate-900 border-b border-rose-200 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-600" />
              Update KRA ETR Profile &amp; Letterhead Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Registered Name:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">KRA Tax PIN:</label>
                <input
                  type="text"
                  value={taxPin}
                  onChange={e => setTaxPin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Control Unit (CU) Serial:</label>
                <input
                  type="text"
                  value={cuSerial}
                  onChange={e => setCuSerial(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Physical &amp; Postal Address:</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Phone:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Save Letterhead &amp; ETR Config
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Orders, Invoices, Receipts & Quotations Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-2xs overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Type &amp; Reference</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4 font-mono">16% VAT (KSh)</th>
                <th className="p-4 font-mono">Gross Total (KSh)</th>
                <th className="p-4">Payment &amp; Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No matching billing records found.</p>
                    <p className="text-[11px] text-slate-400">Create sales or quotations from the POS checkout module.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isQuotation = !!order.isQuotation;
                  return (
                    <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                      
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isQuotation ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isQuotation ? 'Quotation' : 'Tax Invoice'}
                          </span>
                        </div>
                        <p className="font-mono font-bold text-slate-900 pt-1">{order.receiptNumber}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleString()}</p>
                        {order.isRerouted && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                            Rerouted Fulfillment
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{order.customerName || 'Retail Client'}</p>
                        {order.customerKraPin ? (
                          <p className="font-mono text-[10px] text-slate-500 font-semibold">PIN: {order.customerKraPin}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">Standard Retail</p>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{order.items.length} Product Line(s)</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-xs">
                          {order.items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}
                        </p>
                      </td>

                      <td className="p-4 font-mono font-bold text-amber-900">
                        KSh {order.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        <span className="text-rose-700">KSh {order.grandTotal.toLocaleString()}</span>
                        {order.wht5Applied && order.whtAmount && (
                          <span className="block text-[10px] font-mono text-purple-700">
                            Less 5% WHT: -KSh {order.whtAmount.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {isQuotation ? (
                          <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block">
                            Proforma (Unpaid)
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold inline-block">
                              {order.paymentMethod}
                            </span>
                            {order.wht5Applied && (
                              <span className="block text-[9px] font-bold text-purple-700">
                                5% WHT Applied
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {isQuotation && (
                          <button
                            onClick={() => setConvertingQuotation(order)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Convert Quotation into Official Tax Invoice &amp; ETR Receipt"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReceipt(order)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View &amp; Print</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CONVERT QUOTATION TO OFFICIAL INVOICE */}
      {convertingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Convert Quotation to Invoice
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ref: {convertingQuotation.receiptNumber} • Gross KSh {convertingQuotation.grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvertingQuotation(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {convertError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{convertError}</span>
              </div>
            )}

            <form onSubmit={handleConvertQuotationSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-slate-700 font-medium">Customer: <strong>{convertingQuotation.customerName || 'Walk-in Client'}</strong></p>
                <p className="text-slate-700 font-medium">Items Count: <strong>{convertingQuotation.items.length} line items</strong></p>
                <p className="text-rose-700 font-bold font-mono">Total Billed Amount: KSh {convertingQuotation.grandTotal.toLocaleString()}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Method Received:
                </label>
                <select
                  value={convertPaymentMethod}
                  onChange={e => setConvertPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                >
                  <option value="M-Pesa">M-Pesa (Till / Paybill)</option>
                  <option value="Cash">Cash at Till</option>
                  <option value="Bank Transfer">Direct Bank Wire / RTGS</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cheque">Corporate Cheque</option>
                </select>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="convert-wht"
                    checked={convertApplyWHT}
                    onChange={e => setConvertApplyWHT(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="convert-wht" className="text-xs font-bold text-amber-950 cursor-pointer">
                    Apply 5% Withholding Tax (WHT)
                  </label>
                </div>

                {convertApplyWHT && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      KRA 5% WHT Certificate Number:
                    </label>
                    <input
                      type="text"
                      value={convertWhtCert}
                      onChange={e => setConvertWhtCert(e.target.value)}
                      placeholder="e.g. KRA-WHT-2026-88192"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertingQuotation(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Tax Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
