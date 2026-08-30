import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from './ReflectionOverlay';
import { DocumentHeader } from './DocumentHeader';
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
  Sparkles,
  Download,
  FileSpreadsheet,
  Truck,
  RotateCcw,
  PackageCheck,
  Phone,
  Car,
  ChevronDown
} from 'lucide-react';
import { LOCATIONS } from '../../data/initialData';
import {
  exportBillingDocumentPDF,
  exportBillingDocumentCSV,
  exportBillingDocumentJSON,
  exportBillingDocumentTextSlip,
  getDocumentTypeName
} from '../../utils/documentExport';
import { DocumentType } from '../../types';

export const ETRReceiptModal: React.FC = () => {
  const {
    selectedReceipt,
    setSelectedReceipt,
    etrConfig,
    brandSettings,
    locations,
    convertQuotationToInvoice,
    createBillingDocument
  } = useERP();

  const docType: DocumentType = selectedReceipt?.documentType || (selectedReceipt?.isQuotation ? 'quotation' : 'invoice');

  const [documentLayout, setDocumentLayout] = useState<'thermal' | 'a4_invoice' | 'delivery_note'>(
    docType === 'delivery_note' ? 'delivery_note' : 'a4_invoice'
  );
  const [isConverting, setIsConverting] = useState(false);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('M-Pesa');
  const [convertApplyWHT, setConvertApplyWHT] = useState(false);
  const [convertWhtCert, setConvertWhtCert] = useState('');
  const [convertFeedback, setConvertFeedback] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  if (!selectedReceipt) return null;

  const originLoc = locations.find(l => l.id === selectedReceipt.originLocation) || LOCATIONS.find(l => l.id === selectedReceipt.originLocation);
  const fulfilledLoc = locations.find(l => l.id === selectedReceipt.fulfilledByLocation) || LOCATIONS.find(l => l.id === selectedReceipt.fulfilledByLocation);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = (overrideType?: DocumentType) => {
    exportBillingDocumentPDF(selectedReceipt, etrConfig, locations, overrideType);
  };

  const handleDownloadCSV = () => {
    exportBillingDocumentCSV(selectedReceipt, etrConfig, locations);
  };

  const handleDownloadJSON = () => {
    exportBillingDocumentJSON(selectedReceipt, etrConfig);
  };

  const handleDownloadTextSlip = () => {
    exportBillingDocumentTextSlip(selectedReceipt, etrConfig);
  };

  const handleGenerateDeliveryNoteFromInvoice = () => {
    const result = createBillingDocument({
      documentType: 'delivery_note',
      locationId: selectedReceipt.fulfilledByLocation,
      customerName: selectedReceipt.customerName || 'Client',
      customerKraPin: selectedReceipt.customerKraPin,
      customerPhone: selectedReceipt.customerPhone,
      customerEmail: selectedReceipt.customerEmail,
      customerAddress: selectedReceipt.customerAddress,
      deliveryAddress: selectedReceipt.deliveryAddress || selectedReceipt.customerAddress,
      driverName: selectedReceipt.driverName || 'Courier Driver',
      driverPhone: selectedReceipt.driverPhone,
      vehicleRegistration: selectedReceipt.vehicleRegistration || 'KDA 000X',
      dispatchDate: new Date().toISOString().split('T')[0],
      packageCount: selectedReceipt.packageCount || selectedReceipt.items.length,
      deliveryNotes: `Dispatched against Tax Invoice #${selectedReceipt.receiptNumber}`,
      items: selectedReceipt.items.map(it => ({
        batchId: it.batchId,
        productName: it.productName,
        category: it.category,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        scaleGrossWeight: it.scaleGrossWeight,
        tareDeduction: it.tareDeduction,
        netBillableWeight: it.netBillableWeight,
        tareDescription: it.tareDescription
      })),
      deductInventory: false // already deducted on invoice
    });

    if (result.success && result.order) {
      setDocumentLayout('delivery_note');
    }
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

  const isQuotation = docType === 'quotation' || docType === 'proforma' || !!selectedReceipt.isQuotation;
  const isDeliveryNote = docType === 'delivery_note';
  const isCreditNote = docType === 'credit_note';
  const isReceipt = docType === 'receipt';

  // Theme Header Colors
  let headerGradient = 'from-rose-800 via-rose-700 to-rose-600';
  let badgeColor = 'bg-rose-100 text-rose-900 border-rose-200';
  if (isDeliveryNote) {
    headerGradient = 'from-indigo-900 via-indigo-800 to-indigo-700';
    badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-200';
  } else if (docType === 'quotation') {
    headerGradient = 'from-amber-800 via-amber-700 to-amber-600';
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (docType === 'proforma') {
    headerGradient = 'from-sky-900 via-sky-800 to-sky-700';
    badgeColor = 'bg-sky-100 text-sky-900 border-sky-300';
  } else if (isReceipt) {
    headerGradient = 'from-emerald-900 via-emerald-800 to-emerald-700';
    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (isCreditNote) {
    headerGradient = 'from-orange-900 via-orange-800 to-orange-700';
    badgeColor = 'bg-orange-100 text-orange-900 border-orange-300';
  }

  const documentTitle = getDocumentTypeName(docType, selectedReceipt.isQuotation);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto font-sans">
      <div className={`bg-white rounded-none sm:rounded-2xl shadow-2xl w-full ${documentLayout === 'thermal' ? 'max-w-md' : 'max-w-3xl'} h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto border-0 sm:border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col transition-all duration-300`}>
        
        {/* Modal Top Header (Screen Only) */}
        <div className={`relative overflow-hidden bg-gradient-to-r ${headerGradient} text-white p-4 flex items-center justify-between print:hidden shrink-0`}>
          <ReflectionOverlay />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              {isDeliveryNote ? (
                <Truck className="w-5 h-5 text-indigo-200" />
              ) : isQuotation ? (
                <Sparkles className="w-5 h-5 text-amber-200" />
              ) : isCreditNote ? (
                <RotateCcw className="w-5 h-5 text-orange-200" />
              ) : isReceipt ? (
                <Receipt className="w-5 h-5 text-emerald-200" />
              ) : (
                <FileText className="w-5 h-5 text-rose-200" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight text-white flex items-center gap-2">
                {documentTitle}
              </h3>
              <p className="text-[11px] text-white/80">
                Ref #{selectedReceipt.receiptNumber} • ID: {selectedReceipt.id}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Format Switcher Bar (Screen Only) */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          
          {/* Layout View Mode Buttons */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setDocumentLayout('a4_invoice')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                documentLayout === 'a4_invoice'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Document</span>
            </button>

            <button
              onClick={() => setDocumentLayout('delivery_note')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                documentLayout === 'delivery_note'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Note</span>
            </button>

            <button
              onClick={() => setDocumentLayout('thermal')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                documentLayout === 'thermal'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm Slip</span>
            </button>
          </div>

          {/* Quick Actions & Download Dropdown */}
          <div className="flex items-center gap-2">
            
            {/* Generate Delivery Note from invoice */}
            {!isDeliveryNote && !isQuotation && (
              <button
                onClick={handleGenerateDeliveryNoteFromInvoice}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Create a linked delivery note for driver fulfillment"
              >
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Issue Delivery Note</span>
              </button>
            )}

            {/* Quotation convert trigger */}
            {isQuotation && (
              <button
                onClick={() => setIsConverting(!isConverting)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isConverting ? 'Cancel Convert' : 'Convert to Invoice'}</span>
              </button>
            )}

            {/* Direct Download PDF Button */}
            <button
              onClick={() => handleDownloadPDF(documentLayout === 'delivery_note' ? 'delivery_note' : undefined)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Download formatted PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* More Export Formats Menu */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="p-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="More export options (CSV, JSON, Slip)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in duration-100">
                  <button
                    onClick={() => {
                      handleDownloadCSV();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Excel / CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadJSON();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download JSON Format</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadTextSlip();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>Download Text Slip (.txt)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* QUOTATION CONVERSION DRAWER */}
        {isConverting && isQuotation && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 space-y-3 print:hidden animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Convert Quotation #{selectedReceipt.receiptNumber} into Official KRA Tax Invoice
              </h4>
            </div>
            <p className="text-[11px] text-emerald-800">
              Converting will deduct physical stock from <strong>{fulfilledLoc?.name || 'Store'}</strong>, post entries to the accounting ledger, and issue an official KRA TIMS receipt.
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
                  <option value="Bank Transfer">NCBA Bank Wire / RTGS</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cheque">Corporate Bankers Cheque</option>
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
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
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
                    onChange={e => setConvertWhtCert(e.target.value.toUpperCase())}
                    placeholder="e.g. KRA-WHT-2026-99120"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono uppercase text-xs font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConverting(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
            {/* Company Header with Logo */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1.5">
                <div className="w-12 h-12 rounded-full border border-slate-300 p-0.5 shadow-xs bg-white overflow-hidden flex items-center justify-center">
                  {brandSettings?.logoUrl ? (
                    <img
                      src={brandSettings.logoUrl}
                      alt={brandSettings.brandName || etrConfig.companyName}
                      className="w-full h-full object-contain rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-rose-600 text-white font-bold text-base flex items-center justify-center">
                      {(brandSettings?.brandName || etrConfig.companyName).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center items-center gap-1 text-rose-600 font-sans font-bold text-base uppercase tracking-tight">
                {brandSettings?.brandName || etrConfig.companyName}
              </div>
              <p className="text-[10px] text-slate-500 font-sans">{etrConfig.companyAddress}</p>
              <p className="text-[10px] text-slate-500 font-sans">Tel: {etrConfig.companyPhone} • {brandSettings?.supportEmail || 'billing@zamodasports.com'}</p>
              <div className="mt-2 text-[10px] bg-slate-100 py-1 rounded font-bold text-slate-700">
                KRA PIN: {etrConfig.taxPin} | CU SERIAL: {etrConfig.cuSerialNumber}
              </div>
            </div>

            {/* Document Header Badge */}
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-sans font-bold uppercase tracking-wider ${
                isQuotation ? 'bg-amber-100 text-amber-900 border border-amber-300' : isDeliveryNote ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-slate-900 text-white'
              }`}>
                {documentTitle}
              </span>
            </div>

            {/* Reroute / Origin Tag */}
            {selectedReceipt.isRerouted && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center text-[11px] font-sans text-amber-900">
                <span className="font-bold">REROUTED FULFILLMENT:</span> Routed from {originLoc?.name} &amp; Fulfilled at {fulfilledLoc?.name}
              </div>
            )}

            {/* Order Meta Info */}
            <div className="space-y-1.5 text-[11px] font-sans border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Document Ref:</span>
                <span className="font-bold">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt / ETR No:</span>
                <span className="font-bold font-mono">#{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serving Branch:</span>
                <span className="font-bold text-slate-900">{fulfilledLoc?.name || originLoc?.name || 'Main Store'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Served By:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.operatorName || 'POS Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium">{new Date(selectedReceipt.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-mono font-medium">{new Date(selectedReceipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} EAT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.customerName || 'Walk-in Client'}</span>
              </div>
              {selectedReceipt.customerKraPin && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer KRA PIN:</span>
                  <span className="font-semibold font-mono">{selectedReceipt.customerKraPin}</span>
                </div>
              )}
              {selectedReceipt.driverName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver / Vehicle:</span>
                  <span className="font-semibold">{selectedReceipt.driverName} ({selectedReceipt.vehicleRegistration || 'Courier'})</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-semibold">{isQuotation ? 'Quotation (Unpaid)' : `${selectedReceipt.paymentMethod}${selectedReceipt.paymentReference ? ` (${selectedReceipt.paymentReference})` : ''}`}</span>
              </div>
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
                <span>GROSS TOTAL:</span>
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

            {/* KRA QR Code Verification */}
            <div className="pt-2 flex flex-col items-center justify-center space-y-2">
              <div className="p-2 border-2 border-slate-800 rounded bg-white flex flex-col items-center">
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="text-[8px] font-mono mt-1 text-slate-500 uppercase">KRA TIMS Fiscal Verification Code</span>
              </div>
              <p className="text-[9px] text-center text-slate-500 font-sans italic max-w-xs">
                {etrConfig.receiptFooterMessage}
              </p>

              {/* Verified Attribution Notice on Thermal Slip */}
              <div className="w-full pt-2 border-t border-dashed border-slate-300 text-center text-[9.5px] font-sans text-slate-700 space-y-0.5">
                <p className="font-extrabold text-slate-900">
                  You were served by: {selectedReceipt.operatorName || 'Cashier / POS Staff'}
                </p>
                <p className="font-bold text-indigo-950">
                  Branch: {fulfilledLoc?.name || originLoc?.name || 'Main Branch'}
                </p>
                <p className="text-slate-500 font-mono text-[9px]">
                  {new Date(selectedReceipt.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} at {new Date(selectedReceipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} EAT
                </p>
              </div>
            </div>
          </div>
        ) : documentLayout === 'delivery_note' ? (
          /* ==============================================================
             A4 GOODS DELIVERY NOTE / DISPATCH WAYBILL LAYOUT
             ============================================================== */
          <div className="p-8 font-sans text-xs text-slate-800 space-y-6 print:p-0 print:text-black" id="printable-receipt">
            {/* Top Branded Header */}
            <DocumentHeader
              title="Official Goods Delivery Note & Dispatch Waybill"
              subtitle="Textile Manufacturing & Distribution Hub"
              documentNumber={selectedReceipt.receiptNumber}
              documentDate={selectedReceipt.dispatchDate || selectedReceipt.timestamp}
              servedBy={selectedReceipt.operatorName || 'Store Officer'}
              branchName={fulfilledLoc?.name || 'Main Distribution Hub'}
              badgeVariant="delivery_note"
              badgeLabel="Goods Delivery Note"
              extraMetaRight={
                <p className="text-[11px] text-slate-500 font-medium">
                  Packages: <span className="font-bold text-indigo-900">{selectedReceipt.packageCount || selectedReceipt.items.length} Bundles/Rolls</span>
                </p>
              }
            />

            {/* Consignee & Transporter Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  CONSIGNEE / DELIVER TO:
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedReceipt.customerName || 'Direct Client'}</p>
                {selectedReceipt.customerPhone && (
                  <p className="text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedReceipt.customerPhone}
                  </p>
                )}
                <p className="text-slate-600 flex items-start gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedReceipt.deliveryAddress || selectedReceipt.customerAddress || 'Customer Warehouse / Factory'}</span>
                </p>
              </div>

              <div className="space-y-1 border-l border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  LOGISTICS &amp; TRANSPORTER PARTICULARS:
                </span>
                <p className="text-xs">Driver: <strong>{selectedReceipt.driverName || 'Designated Driver'}</strong></p>
                {selectedReceipt.driverPhone && (
                  <p className="text-xs text-slate-600">Driver Phone: <strong>{selectedReceipt.driverPhone}</strong></p>
                )}
                <p className="text-xs font-mono">
                  Vehicle Plate: <strong className="uppercase bg-slate-200 px-1.5 py-0.5 rounded">{selectedReceipt.vehicleRegistration || 'COMMERCIAL CARRIER'}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Dispatched From: <strong>{fulfilledLoc?.name || 'Main Distribution Hub'}</strong>
                </p>
              </div>
            </div>

            {/* Line Items Table for Delivery Note */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/70 text-indigo-950 text-[11px] font-bold uppercase border-b border-indigo-100">
                    <th className="p-3 w-8">#</th>
                    <th className="p-3">Item Description &amp; Specifications</th>
                    <th className="p-3 text-center">Category</th>
                    <th className="p-3 text-center">SKU / Batch</th>
                    <th className="p-3 text-center">Dispatched Qty</th>
                    <th className="p-3 text-center">Inspection Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {selectedReceipt.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-sans font-bold text-slate-900">{item.productName}</p>
                        {item.tareDeduction && item.tareDeduction > 0 && (
                          <p className="text-[10px] text-emerald-600 font-sans">
                            Gross {item.scaleGrossWeight?.toFixed(3)}kg • Packaging tare {item.tareDeduction?.toFixed(3)}kg • Pure Net Fabric {item.quantity} {item.unit}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {item.batchId}
                      </td>
                      <td className="p-3 text-center font-black text-indigo-950 text-sm">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Good Order
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Special Instructions */}
            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs text-indigo-950">
              <span className="font-bold block mb-0.5">Special Dispatch &amp; Delivery Instructions:</span>
              <p className="text-slate-600">
                {selectedReceipt.deliveryNotes || 'Please inspect rolls, carton packaging, and seals upon handover. Sign below only when all quantities and textile specifications are verified.'}
              </p>
            </div>

            {/* 3 Signature Endorsement Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                  1. Dispatched By (Storekeeper)
                </span>
                <p className="text-slate-600">Name: <strong>{selectedReceipt.operatorName || 'Store Officer'}</strong></p>
                <p className="text-slate-600">Date: <strong>{new Date().toLocaleDateString()}</strong></p>
                <div className="pt-3">
                  <p className="text-[10px] text-slate-400">Signature:</p>
                  <div className="border-b border-dashed border-slate-400 h-6"></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                  2. Transporter / Driver Handover
                </span>
                <p className="text-slate-600">Driver: <strong>{selectedReceipt.driverName || 'Designated Driver'}</strong></p>
                <p className="text-slate-600">Vehicle: <strong>{selectedReceipt.vehicleRegistration || 'Carrier'}</strong></p>
                <div className="pt-3">
                  <p className="text-[10px] text-slate-400">Signature:</p>
                  <div className="border-b border-dashed border-slate-400 h-6"></div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-300 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-indigo-950 block border-b border-indigo-200 pb-1">
                  3. Received in Good Order (Customer)
                </span>
                <p className="text-slate-700">Recipient Name: ____________</p>
                <p className="text-slate-700">Date &amp; Stamp: ____________</p>
                <div className="pt-3">
                  <p className="text-[10px] text-indigo-700 font-bold">Signature / Official Stamp:</p>
                  <div className="border-b border-dashed border-indigo-400 h-6"></div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ==============================================================
             A4 COMMERCIAL TAX INVOICE / QUOTATION LETTERHEAD LAYOUT
             ============================================================== */
          <div className="p-8 font-sans text-xs text-slate-800 space-y-6 print:p-0 print:text-black" id="printable-receipt">
            {/* Top Company Branded Letterhead */}
            <DocumentHeader
              title={documentTitle}
              subtitle="Textile Manufacturing & Multi-Branch Distribution Hub"
              documentNumber={selectedReceipt.receiptNumber}
              documentDate={selectedReceipt.timestamp}
              servedBy={selectedReceipt.operatorName || 'POS Staff'}
              branchName={fulfilledLoc?.name || originLoc?.name || 'Main Distribution Hub'}
              refId={selectedReceipt.id}
              badgeVariant={
                isDeliveryNote
                  ? 'delivery_note'
                  : docType === 'quotation'
                  ? 'quotation'
                  : docType === 'proforma'
                  ? 'proforma'
                  : isReceipt
                  ? 'receipt'
                  : isCreditNote
                  ? 'credit_note'
                  : 'invoice'
              }
              badgeLabel={documentTitle}
            />

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
                {selectedReceipt.customerPhone && (
                  <p className="text-slate-600">Phone: {selectedReceipt.customerPhone}</p>
                )}
                {selectedReceipt.deliveryAddress && (
                  <p className="text-slate-600">Address: {selectedReceipt.deliveryAddress}</p>
                )}
                <p className="text-slate-500 pt-1">Payment Method: <strong>{isQuotation ? 'Prepayment on Acceptance' : selectedReceipt.paymentMethod}</strong></p>
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
                {selectedReceipt.dueDate && (
                  <p className="text-xs text-rose-700 font-bold">
                    Due Date: <strong>{new Date(selectedReceipt.dueDate).toLocaleDateString()}</strong>
                  </p>
                )}
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
                  {selectedReceipt.notes || (isQuotation ? 'Quotation validity: 30 days from date of issuance.' : 'Official computer generated tax invoice. Goods received in good order.')}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Base Value (Excl. VAT):</span>
                  <span className="font-mono font-semibold">KSh {selectedReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {selectedReceipt.discountAmount && selectedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Trade Discount Applied:</span>
                    <span className="font-mono font-semibold">- KSh {selectedReceipt.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
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
