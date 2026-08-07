import React from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from './ReflectionOverlay';
import { X, Printer, Download, CheckCircle2, QrCode, Building2 } from 'lucide-react';
import { LOCATIONS } from '../../data/initialData';

export const ETRReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, etrConfig } = useERP();

  if (!selectedReceipt) return null;

  const originLoc = LOCATIONS.find(l => l.id === selectedReceipt.originLocation);
  const fulfilledLoc = LOCATIONS.find(l => l.id === selectedReceipt.fulfilledByLocation);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Top Header (Screen Only) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 text-white p-4 flex items-center justify-between print:hidden">
          <ReflectionOverlay />
          <div className="flex items-center gap-2 relative z-10">
            <CheckCircle2 className="w-5 h-5 text-rose-200" />
            <h3 className="font-semibold text-lg">
              {selectedReceipt.isQuotation ? 'Official Quotation' : 'KRA ETR Tax Invoice'}
            </h3>
          </div>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Screen Only) */}
        <div className="bg-rose-50 px-6 py-3 border-b border-rose-100 flex items-center justify-between print:hidden">
          <span className="text-xs font-medium text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
            Receipt: {selectedReceipt.receiptNumber}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* RECEIPT PAPER CONTAINER (Target for Print) */}
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

          {/* Reroute / Origin Tag */}
          {selectedReceipt.isRerouted && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center text-[11px] font-sans text-amber-900">
              <span className="font-bold">REROUTED FULFILLMENT:</span> Routed from {originLoc?.name} &amp; Fulfilled at {fulfilledLoc?.name}
            </div>
          )}

          {/* Order Meta Info */}
          <div className="space-y-1 text-[11px] font-sans border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Ref:</span>
              <span className="font-bold">{selectedReceipt.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ETR Receipt No:</span>
              <span className="font-bold">{selectedReceipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date &amp; Time:</span>
              <span>{new Date(selectedReceipt.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-medium">{selectedReceipt.customerName || 'Retail Customer'}</span>
            </div>
            {selectedReceipt.customerKraPin && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer KRA PIN:</span>
                <span className="font-semibold">{selectedReceipt.customerKraPin}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold">{selectedReceipt.paymentMethod}</span>
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
              <span>Taxable Amount (Excl. VAT):</span>
              <span>KSh {selectedReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT (16% Standard Rate):</span>
              <span>KSh {selectedReceipt.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL INCLUSIVE:</span>
              <span className="text-rose-700">KSh {selectedReceipt.grandTotal.toLocaleString()}</span>
            </div>
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

      </div>
    </div>
  );
};
