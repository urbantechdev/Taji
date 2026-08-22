import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from './ReflectionOverlay';
import {
  X,
  Printer,
  CheckCircle2,
  QrCode,
  Building2,
  FileText,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Percent,
  Calendar,
  User,
  MapPin,
  Sparkles
} from 'lucide-react';
import { LOCATIONS } from '../../data/initialData';

export const ETRReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, etrConfig, convertQuotationToInvoice } = useERP();
  const [documentLayout, setDocumentLayout] = useState<'thermal' | 'a4_invoice'>('thermal');
  const [isConverting, setIsConverting] = useState(false);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [convertApplyWHT, setConvertApplyWHT] = useState(false);
  const [convertWhtCert, setConvertWhtCert] = useState('');
  const [convertFeedback, setConvertFeedback] = useState<string | null>(null);

  if (!selectedReceipt) return null;

  const originLoc = LOCATIONS.find(l => l.id === selectedReceipt.originLocation);
  const fulfilledLoc = LOCATIONS.find(l => l.id === selectedReceipt.fulfilledByLocation);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteConvert = () => {
    setConvertFeedback(null);
    const res = convertQuotationToInvoice(
      selectedReceipt.id,
      convertPaymentMethod,
      convertApplyWHT,
      convertWhtCert
    );
    if (!res.success) {
      setConvertFeedback(res.message);
    } else {
      setIsConverting(false);
    }
  };

  const isQuotation = !!selectedReceipt.isQuotation;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-none sm:rounded-2xl shadow-2xl w-full ${documentLayout === 'a4_invoice' ? 'max-w-2xl' : 'max-w-md'} h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto border-0 sm:border border-rose-100 animate-in fade-in zoom-in duration-200 flex flex-col transition-all duration-300`}>
        
        {/* Modal Top Header (Screen Only) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 text-white p-4 flex items-center justify-between print:hidden shrink-0">
          <ReflectionOverlay />
          <div className="flex items-center gap-2 relative z-10">
            {isQuotation ? (
              <FileText className="w-5 h-5 text-amber-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isQuotation ? 'Official Commercial Quotation / Proforma' : 'Kenya Revenue Authority (KRA) Tax Invoice'}
              </h3>
              <p className="text-[11px] text-rose-100">
                {isQuotation ? 'Valid Proforma Estimate • No Stock Deducted' : 'TIMS Compliant • 16% VAT Registered'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Format Switcher Bar (Screen Only) */}
        <div className="bg-rose-50/80 px-4 py-2.5 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-rose-200 shadow-2xs">
            <button
              onClick={() => setDocumentLayout('thermal')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                documentLayout === 'thermal'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Receipt</span>
            </button>
            <button
              onClick={() => setDocumentLayout('a4_invoice')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                documentLayout === 'a4_invoice'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Tax Invoice</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isQuotation && (
              <button
                onClick={() => setIsConverting(!isConverting)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isConverting ? 'Cancel Conversion' : 'Convert to Invoice'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {isQuotation ? 'Quotation' : 'Document'}</span>
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* QUOTATION CONVERSION DRAWER */}
        {isConverting && isQuotation && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 space-y-3 print:hidden animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Convert Quotation {selectedReceipt.receiptNumber} to Official Tax Invoice &amp; ETR Receipt
              </h4>
            </div>
            <p className="text-[11px] text-emerald-800">
              Converting will immediately deduct physical stock from <strong>{fulfilledLoc?.name || 'Store'}</strong>, post entries to the accounting ledger, and issue an official KRA TIMS receipt.
            </p>

            {convertFeedback && (
              <div className="p-2 bg-rose-100 border border-rose-200 text-rose-900 text-xs rounded-lg font-bold">
                {convertFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  Payment Method Captured:
                </label>
                <select
                  value={convertPaymentMethod}
                  onChange={e => setConvertPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="M-Pesa">M-Pesa Till / Paybill</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Bank Transfer">Direct Bank Wire / RTGS</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cheque">Corporate Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  5% Withholding Tax (WHT):
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modal-wht"
                    checked={convertApplyWHT}
                    onChange={e => setConvertApplyWHT(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300"
                  />
                  <label htmlFor="modal-wht" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Apply 5% WHT Deduction
                  </label>
                </div>
              </div>

              {convertApplyWHT && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    KRA 5% Withholding Certificate No:
                  </label>
                  <input
                    type="text"
                    value={convertWhtCert}
                    onChange={e => setConvertWhtCert(e.target.value)}
                    placeholder="e.g. KRA-WHT-2026-99120"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConverting(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Issue Final Invoice</span>
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT PAPER CONTAINER (Target for Print) */}
        {documentLayout === 'thermal' ? (
          /* ==============================================================
             THERMAL 80mm RECEIPT LAYOUT
             ============================================================== */
          <div className="p-6 font-mono text-xs text-slate-800 space-y-4 print:p-0 print:text-black" id="printable-receipt">
            {/* Company Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center items-center gap-1 text-rose-600 font-sans font-bold text-base uppercase tracking-tight">
                <Building2 className="w-4 h-4 text-rose-600 print:hidden" />
                {etrConfig.companyName}
              </div>
              <p className="text-[10px] text-slate-500 font-sans">{etrConfig.companyAddress}</p>
              <p className="text-[10px] text-slate-500 font-sans">Tel: {etrConfig.companyPhone}</p>
              <div className="mt-2 text-[10px] bg-slate-100 py-1 rounded font-bold text-slate-700">
                KRA PIN: {etrConfig.taxPin} | CU SERIAL: {etrConfig.cuSerialNumber}
              </div>
            </div>

            {/* Document Header Badge */}
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-sans font-bold uppercase tracking-wider ${
                isQuotation ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-900 text-white'
              }`}>
                {isQuotation ? 'OFFICIAL QUOTATION / PROFORMA' : 'KRA TIMS ETR TAX INVOICE'}
              </span>
            </div>

            {/* Reroute / Origin Tag */}
            {selectedReceipt.isRerouted && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center text-[11px] font-sans text-amber-900">
                <span className="font-bold">REROUTED FULFILLMENT:</span> Routed from {originLoc?.name} &amp; Fulfilled at {fulfilledLoc?.name}
              </div>
            )}

            {/* Order Meta Info */}
            <div className="space-y-1 text-[11px] font-sans border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">{isQuotation ? 'Quotation Ref:' : 'Invoice Ref:'}</span>
                <span className="font-bold">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isQuotation ? 'Estimate Serial:' : 'ETR Receipt No:'}</span>
                <span className="font-bold">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span>{new Date(selectedReceipt.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.customerName || 'Walk-in Client'}</span>
              </div>
              {selectedReceipt.customerKraPin && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer KRA PIN:</span>
                  <span className="font-semibold">{selectedReceipt.customerKraPin}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold">{isQuotation ? 'Quotation (Unpaid)' : selectedReceipt.paymentMethod}</span>
              </div>
              {selectedReceipt.operatorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier / Operator:</span>
                  <span>{selectedReceipt.operatorName}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div>
              <div className="grid grid-cols-12 font-bold font-sans text-[11px] border-b border-slate-300 pb-1 mb-2 text-slate-700">
                <span className="col-span-6">Item Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total (KSh)</span>
              </div>
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                {selectedReceipt.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] font-mono">
                    <div className="col-span-6 pr-1">
                      <p className="font-sans font-medium text-slate-900 leading-tight">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">@ KSh {item.unitPrice.toLocaleString()} / {item.unit}</p>
                      {item.tareDeduction && item.tareDeduction > 0 && (
                        <p className="text-[9px] text-emerald-600 font-sans">
                          Net Billed: {item.quantity} {item.unit} (Gross {item.scaleGrossWeight?.toFixed(3)}kg - {item.tareDeduction?.toFixed(3)}kg tare)
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-center my-auto text-slate-700">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="col-span-4 text-right font-semibold my-auto text-slate-900">
                      {item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="space-y-1.5 font-sans text-xs border-b border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal (Excl. 16% VAT):</span>
                <span>KSh {selectedReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Output VAT (16% Rate):</span>
                <span>KSh {selectedReceipt.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>GROSS TOTAL (INCLUSIVE):</span>
                <span className="text-rose-700">KSh {selectedReceipt.grandTotal.toLocaleString()}</span>
              </div>

              {/* 5% Withholding Tax Section if applied */}
              {selectedReceipt.wht5Applied && selectedReceipt.whtAmount && (
                <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 bg-amber-50/70 p-2 rounded text-[11px]">
                  <div className="flex justify-between text-amber-900 font-bold">
                    <span>Less 5% Withholding Tax (WHT):</span>
                    <span>- KSh {selectedReceipt.whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-xs">
                    <span>NET RECEIVABLE COLLECTED:</span>
                    <span className="text-emerald-700">KSh {(selectedReceipt.netReceivableAmount || (selectedReceipt.grandTotal - selectedReceipt.whtAmount)).toLocaleString()}</span>
                  </div>
                  {selectedReceipt.whtCertificateNo && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      WHT Cert: {selectedReceipt.whtCertificateNo}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KRA QR Code Verification Simulation */}
            <div className="pt-2 flex flex-col items-center justify-center space-y-2">
              <div className="p-2 border-2 border-slate-800 rounded bg-white flex flex-col items-center">
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="text-[8px] font-mono mt-1 text-slate-500 uppercase">KRA TIMS Verification Code</span>
              </div>
              <p className="text-[9px] text-center text-slate-500 font-sans italic max-w-xs">
                {etrConfig.receiptFooterMessage}
              </p>
            </div>
          </div>
        ) : (
          /* ==============================================================
             A4 COMMERCIAL TAX INVOICE / QUOTATION LETTERHEAD LAYOUT
             ============================================================== */
          <div className="p-8 font-sans text-xs text-slate-800 space-y-6 print:p-0 print:text-black" id="printable-receipt">
            {/* Top Company Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-rose-600 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-600 text-white rounded-xl print:bg-black">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-slate-900 uppercase tracking-tight">
                      {etrConfig.companyName}
                    </h2>
                    <p className="text-xs text-rose-700 font-bold font-mono">
                      TEXTILE MANUFACTURING &amp; DISTRIBUTION ERP
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-1">{etrConfig.companyAddress}</p>
                <p className="text-xs text-slate-500">Phone: {etrConfig.companyPhone} • Email: billing@zamodasports.com</p>
              </div>

              <div className="text-right space-y-1">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  isQuotation ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900 border border-rose-200'
                }`}>
                  {isQuotation ? 'Official Commercial Quotation' : 'KRA ETR Commercial Tax Invoice'}
                </span>
                <p className="font-mono text-sm font-bold text-slate-900 pt-1">
                  #{selectedReceipt.receiptNumber}
                </p>
                <p className="text-[11px] text-slate-500">
                  Ref ID: <span className="font-mono font-bold text-slate-700">{selectedReceipt.id}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Date: <span className="font-semibold">{new Date(selectedReceipt.timestamp).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* B2B Customer & KRA Tax Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Billed To / Customer Information:
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedReceipt.customerName || 'Walk-in Customer'}</p>
                {selectedReceipt.customerKraPin ? (
                  <p className="font-mono text-xs text-slate-700">
                    KRA PIN: <strong>{selectedReceipt.customerKraPin}</strong>
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No KRA PIN provided (Retail Tax Sale)</p>
                )}
                <p className="text-slate-500">Payment Terms: <strong>{isQuotation ? 'Prepayment on Acceptance' : selectedReceipt.paymentMethod}</strong></p>
              </div>

              <div className="space-y-1 border-l border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  KRA TIMS Fiscal Metadata:
                </span>
                <p className="font-mono text-xs">Company KRA PIN: <strong>{etrConfig.taxPin}</strong></p>
                <p className="font-mono text-xs">ETR CU Serial: <strong>{etrConfig.cuSerialNumber}</strong></p>
                <p className="text-xs text-slate-600">
                  Fulfillment Branch: <strong>{fulfilledLoc?.name || 'Main Store'}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Issued By Operator: <strong>{selectedReceipt.operatorName || 'System Admin'}</strong>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                    <th className="p-3">#</th>
                    <th className="p-3">Description &amp; Specifications</th>
                    <th className="p-3 text-center">Category</th>
                    <th className="p-3 text-center">Billed Qty</th>
                    <th className="p-3 text-right">Unit Rate (KSh)</th>
                    <th className="p-3 text-right">Amount (KSh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {selectedReceipt.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-sans font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">SKU: {item.batchId}</p>
                        {item.tareDeduction && item.tareDeduction > 0 && (
                          <p className="text-[10px] text-emerald-600 font-sans">
                            Scale Reading: {item.scaleGrossWeight?.toFixed(3)}kg • Tare packaging removed: {item.tareDeduction?.toFixed(3)}kg • Net billed: {item.quantity} {item.unit}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right">
                        {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Banking Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs block">Bank Wire &amp; M-Pesa Payment Details:</span>
                <p className="text-slate-600">Bank: <strong>NCBA Bank Kenya</strong></p>
                <p className="text-slate-600">Account Name: <strong>{etrConfig.companyName}</strong></p>
                <p className="text-slate-600 font-mono">Account No: <strong>72819038201</strong></p>
                <p className="text-slate-600 font-mono">M-Pesa Paybill: <strong>882901</strong> | Acc: <strong>{selectedReceipt.receiptNumber}</strong></p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
                  {isQuotation ? 'Quotation validity: 30 days from date of issuance.' : 'Official computer generated tax invoice. Goods received in good order.'}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Base Value (Excl. VAT):</span>
                  <span className="font-mono font-semibold">KSh {selectedReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>KRA 16% Output Value Added Tax:</span>
                  <span className="font-mono font-semibold">KSh {selectedReceipt.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-300 pt-2">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-rose-700">KSh {selectedReceipt.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {selectedReceipt.wht5Applied && selectedReceipt.whtAmount && (
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-amber-900 font-bold">
                      <span>Less 5% Withholding Tax (WHT):</span>
                      <span className="font-mono">- KSh {selectedReceipt.whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs text-slate-900 border-t border-amber-200 pt-1">
                      <span>Net Settlement Amount:</span>
                      <span className="font-mono text-emerald-700">KSh {(selectedReceipt.netReceivableAmount || (selectedReceipt.grandTotal - selectedReceipt.whtAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {selectedReceipt.whtCertificateNo && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Certificate No: {selectedReceipt.whtCertificateNo}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-slate-300 rounded-lg bg-white">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <div className="text-[10px] text-slate-500">
                  <p className="font-bold text-slate-700">KRA TIMS DIGITAL SIGNATURE</p>
                  <p className="font-mono">VERIFY: kra.go.ke/verify/{selectedReceipt.receiptNumber}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-sans text-[11px] font-bold text-slate-800">
                  Authorized Signatory
                </div>
                <span className="text-[10px] text-slate-400 uppercase">For {etrConfig.companyName}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
