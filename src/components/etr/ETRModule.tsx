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
  ShieldCheck
} from 'lucide-react';

export const ETRModule: React.FC = () => {
  const { orders, etrConfig, updateETRConfig, setSelectedReceipt } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigEditing, setIsConfigEditing] = useState(false);

  const [companyName, setCompanyName] = useState(etrConfig.companyName);
  const [taxPin, setTaxPin] = useState(etrConfig.taxPin);
  const [cuSerial, setCuSerial] = useState(etrConfig.cuSerialNumber);
  const [address, setAddress] = useState(etrConfig.companyAddress);
  const [phone, setPhone] = useState(etrConfig.companyPhone);

  const filteredOrders = orders.filter(o => {
    return (
      o.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

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

  return (
    <div className="space-y-6">
      
      {/* Top Device Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rainbow" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <h2 className="font-bold text-lg font-sans">
              Kenya Revenue Authority (KRA) TIMS ETR Engine
            </h2>
          </div>
          <p className="text-xs text-rose-100 max-w-2xl">
            Automated KRA 16% VAT ETR tax receipts, CU Serial validation, QR code verification, and official tax invoices for Dereck, Fleece, and Yarns.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs font-mono space-y-1 shrink-0">
          <p><strong>Device KRA PIN:</strong> {etrConfig.taxPin}</p>
          <p><strong>CU Serial No:</strong> {etrConfig.cuSerialNumber}</p>
          <p className="text-emerald-300 font-bold font-sans flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> TIMS Online Connected
          </p>
        </div>
      </div>

      {/* Control Actions & Search */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ETR receipt number, customer, or invoice ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsConfigEditing(!isConfigEditing)}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-4 h-4" />
            {isConfigEditing ? 'Close Settings' : 'ETR Device Settings'}
          </button>
        </div>

        {/* ETR Config Editor Form */}
        {isConfigEditing && (
          <form onSubmit={handleSaveConfig} className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3 text-xs font-sans">
            <h4 className="font-bold text-slate-900 border-b border-rose-200 pb-2">
              Update KRA ETR &amp; Company Tax Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Registered Name:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">KRA Tax PIN:</label>
                <input
                  type="text"
                  value={taxPin}
                  onChange={e => setTaxPin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Control Unit (CU) Serial:</label>
                <input
                  type="text"
                  value={cuSerial}
                  onChange={e => setCuSerial(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Phone:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow"
            >
              Save ETR Settings
            </button>
          </form>
        )}
      </div>

      {/* Orders & ETR Receipts Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">ETR Receipt No</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4 font-mono">16% VAT (KSh)</th>
                <th className="p-4 font-mono">Grand Total (KSh)</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                  
                  <td className="p-4">
                    <p className="font-mono font-bold text-rose-700">{order.receiptNumber}</p>
                    <p className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleString()}</p>
                    {order.isRerouted && (
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                        Rerouted Order
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-slate-900">{order.customerName || 'Retail Customer'}</p>
                    {order.customerKraPin && (
                      <p className="font-mono text-[10px] text-slate-500">PIN: {order.customerKraPin}</p>
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
                    KSh {order.grandTotal.toLocaleString()}
                  </td>

                  <td className="p-4 font-semibold text-slate-700">
                    <span className="bg-slate-100 px-2 py-1 rounded text-[11px]">
                      {order.paymentMethod}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(order)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View / Print ETR
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
