import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatKsh } from '../../utils/currency';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Boxes,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Phone,
  Factory,
  Building2,
  Eye,
  Printer,
  Sparkles,
  MessageSquare,
  ExternalLink,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { ERPDocument, ERPPaymentTransaction, ERPInquiryTicket } from '../../types';

interface ERPDashboardOverviewProps {
  onNavigateTab: (tab: any) => void;
  onOpenNewDoc: (type: 'invoice' | 'quotation' | 'receipt' | 'delivery_note') => void;
  onOpenPaymentModal: () => void;
  onOpenInventoryModal: () => void;
  onOpenPostProductModal?: () => void;
  onViewDoc: (doc: ERPDocument) => void;
}

export const ERPDashboardOverview: React.FC<ERPDashboardOverviewProps> = ({
  onNavigateTab,
  onOpenNewDoc,
  onOpenPaymentModal,
  onOpenInventoryModal,
  onOpenPostProductModal,
  onViewDoc,
}) => {
  const {
    products,
    documents,
    transactions,
    inventory,
    customers,
    productionOrders,
    businessProfile,
    inquiryTickets,
    updateInquiryTicket,
    convertTicketToInvoice,
    convertTicketToQuotation,
  } = useERP();

  const [ticketFilter, setTicketFilter] = useState<'all' | 'new' | 'contacted' | 'quoted'>('all');

  const filteredTickets = inquiryTickets.filter((t) => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  const newTicketCount = inquiryTickets.filter((t) => t.status === 'new').length;

  // Metrics
  const totalInvoiced = documents
    .filter((d) => d.type === 'invoice')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const totalCollected = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceivables = documents
    .filter((d) => d.type === 'invoice' && d.status !== 'cancelled')
    .reduce((sum, d) => sum + d.balanceDue, 0);

  const mpesaCollected = transactions
    .filter((t) => t.method === 'mpesa' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const stockValuation = inventory.reduce(
    (sum, item) => sum + item.stockOnHand * item.sellingPrice,
    0
  );

  const lowStockItems = inventory.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#020a1c] via-[#06163c] to-[#030e28] rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-blue-900/50"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/15 transition-colors rounded-full border border-white/20 text-xs font-mono backdrop-blur-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Kenya Shilling ERP Engine (Ksh)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] tracking-tight">
            Operations & Financials Command Center
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Real-time management for garment inventory, invoicing, M-Pesa Till reconciliation, and factory production workflows.
          </p>
        </div>

        {/* Live System Status Indicator */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shrink-0">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Live & Operational</div>
            <div className="text-[11px] text-blue-200 font-mono">16% VAT • M-Pesa C2B/B2B</div>
          </div>
        </div>
      </motion.div>

      {/* Primary KPI Grid (All in Ksh) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {/* Ambient smoke glow backdrop */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-900/10 via-slate-900/10 to-indigo-900/10 rounded-3xl blur-2xl pointer-events-none -z-10" />

        {/* Card 1: Total Invoiced Revenue */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative bg-white/95 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 space-y-3 group cursor-default overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-slate-900/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-900 transition-colors">
              Total Invoiced Revenue
            </span>
            <div className="p-2.5 bg-blue-50 text-[#06163c] rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900 font-['Outfit'] block group-hover:text-blue-950 transition-colors">
              {formatKsh(totalInvoiced)}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Receipt className="w-3 h-3 text-slate-400" />
              Across {documents.filter((d) => d.type === 'invoice').length} tax invoices
            </span>
          </div>
        </motion.div>

        {/* Card 2: Total Payments Collected */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative bg-white/95 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 space-y-3 group cursor-default overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-slate-900/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-900 transition-colors">
              Payments Collected
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-emerald-700 font-['Outfit'] block group-hover:text-emerald-800 transition-colors">
              {formatKsh(totalCollected)}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              M-Pesa: {formatKsh(mpesaCollected)}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Receivables & Balances */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative bg-white/95 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 space-y-3 group cursor-default overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-slate-900/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-900 transition-colors">
              Outstanding Balances
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-amber-700 font-['Outfit'] block group-hover:text-amber-800 transition-colors">
              {formatKsh(totalReceivables)}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Pending client clearance
            </span>
          </div>
        </motion.div>

        {/* Card 4: Inventory Asset Value */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative bg-white/95 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 space-y-3 group cursor-default overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-slate-900/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-900 transition-colors">
              Inventory Valuation
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900 font-['Outfit'] block group-hover:text-purple-950 transition-colors">
              {formatKsh(stockValuation)}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {inventory.length} active SKU lines in warehouse
            </span>
          </div>
        </motion.div>

        {/* Live Storefront Garment Banner */}
        <div className="sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-[#06163c] via-blue-950 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white border border-blue-800/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold font-['Outfit'] tracking-wide text-white">
                  Live Storefront Catalog: {products.filter((p) => p.published !== false).length} Active Garments
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ● Real-time Firestore Sync
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Post new uniforms, blazers, scrubs, or industrial overalls. Products appear instantly on the public catalog with full 3D customizer integration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenPostProductModal && (
              <button
                type="button"
                onClick={onOpenPostProductModal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Post Garment Now</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-sky-300" />
              <span>Catalog Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Inquiry Tickets & Instant WhatsApp Leads Command Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  Instant Storefront Inquiries & WhatsApp Leads
                </h3>
                {newTicketCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full uppercase tracking-wider animate-pulse border border-emerald-300">
                    {newTicketCount} New Requests
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Live tickets raised automatically when clients request quotes or design in the Mockup Studio. Platform Hotline: <strong className="text-emerald-700 font-mono">0728102929</strong>.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
            {(['all', 'new', 'contacted', 'quoted'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTicketFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${
                  ticketFilter === f
                    ? 'bg-white text-[#06163c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table / List */}
        {filteredTickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No inquiry tickets matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <th className="pb-3 px-2">Ticket #</th>
                  <th className="pb-3 px-2">Client / Phone</th>
                  <th className="pb-3 px-2">Product & Specs</th>
                  <th className="pb-3 px-2 text-right">Est. Total</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3.5 px-2">
                      <span className="font-mono font-bold text-[#06163c] block">
                        #{ticket.ticketNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {ticket.createdAt.substring(0, 16)}
                      </span>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="font-bold text-slate-900 block">
                        {ticket.customerName || 'Storefront Visitor'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {ticket.phone || '0728102929'}
                      </span>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="font-semibold text-slate-900 block">
                        {ticket.productName}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Qty: <strong>{ticket.quantity} pcs</strong> • {ticket.brandingType?.toUpperCase()}
                        {ticket.selectedColor && ` • ${ticket.selectedColor}`}
                      </span>
                      {ticket.notes && (
                        <span className="text-[10px] text-slate-400 italic block line-clamp-1">
                          "{ticket.notes}"
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      <span className="font-mono font-extrabold text-slate-900 text-sm block">
                        {formatKsh(ticket.estimatedTotalKsh)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        @{formatKsh(ticket.unitPrice || 0)}/unit
                      </span>
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          updateInquiryTicket(ticket.id, {
                            status: e.target.value as ERPInquiryTicket['status'],
                          })
                        }
                        className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                          ticket.status === 'new'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : ticket.status === 'contacted'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : ticket.status === 'quoted'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : ticket.status === 'converted_invoice'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="new">🟢 NEW</option>
                        <option value="contacted">🔵 CONTACTED</option>
                        <option value="quoted">🟡 QUOTED</option>
                        <option value="converted_invoice">🟣 INVOICED</option>
                        <option value="closed">⚪ CLOSED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* WhatsApp Hotline direct link */}
                        <a
                          href={ticket.whatsappUrl || `https://wa.me/254728102929?text=Hello%20${encodeURIComponent(ticket.customerName || 'Client')},%20regarding%20ticket%20%23${ticket.ticketNumber}%20for%20${ticket.quantity}%20pcs%20of%20${encodeURIComponent(ticket.productName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Open WhatsApp Chat (0728102929)"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Convert to Invoice */}
                        <button
                          type="button"
                          onClick={() => {
                            const newInv = convertTicketToInvoice(ticket.id);
                            if (newInv) {
                              onViewDoc(newInv);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#06163c] hover:bg-[#021a34] text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Generate Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>

                        {/* Convert to Quotation */}
                        <button
                          type="button"
                          onClick={() => {
                            const newQtn = convertTicketToQuotation(ticket.id);
                            if (newQtn) {
                              onViewDoc(newQtn);
                            }
                          }}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Create Quotation Document"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Main Split: Recent Documents & Payment Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invoices & Commercial Documents */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all duration-300"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Recent ERP Invoices & Billing Documents
              </h3>
              <p className="text-xs text-slate-500">
                Invoices, Quotations, Proformas, Receipts and Delivery Notes
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateTab('billing')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer group"
            >
              <span>View All ({documents.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <th className="pb-3 px-2">Type / Doc #</th>
                  <th className="pb-3 px-2">Client / Organization</th>
                  <th className="pb-3 px-2">Issue Date</th>
                  <th className="pb-3 px-2 text-right">Amount (Ksh)</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.slice(0, 5).map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="py-3 px-2">
                      <span className="font-mono font-bold text-[#06163c] block group-hover:text-blue-700 transition-colors">
                        {doc.docNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {doc.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-900 block group-hover:text-blue-900 transition-colors">
                        {doc.customerName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">
                        {doc.title}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">
                      {doc.issueDate}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      {formatKsh(doc.totalAmount)}
                      {doc.balanceDue > 0 && (
                        <span className="block text-[10px] text-red-600 font-semibold">
                          Due: {formatKsh(doc.balanceDue)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-transform group-hover:scale-105 ${
                          doc.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'partially_paid'
                            ? 'bg-blue-100 text-blue-800'
                            : doc.status === 'issued'
                            ? 'bg-amber-100 text-amber-800'
                            : doc.status === 'dispatched'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onViewDoc(doc)}
                        className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-[11px] cursor-pointer shadow-xs"
                        title="Print / View Official Document"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Col: M-Pesa & Bank Transactions Feed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all duration-300"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                M-Pesa & Bank Ledger
              </h3>
              <p className="text-xs text-slate-500">Live Kenyan payments flow</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateTab('payments')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((txn) => (
              <motion.div
                key={txn.id}
                whileHover={{ x: 3, scale: 1.01 }}
                className="p-3 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200 hover:border-emerald-200 text-xs space-y-1 transition-all duration-200 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                      txn.method === 'mpesa'
                        ? 'bg-green-100 text-green-800'
                        : txn.method === 'bank_transfer'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {txn.method === 'mpesa'
                      ? 'M-PESA'
                      : txn.method === 'bank_transfer'
                      ? 'BANK EFT'
                      : 'CASH'}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    +{formatKsh(txn.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-700">
                  <span className="font-semibold">{txn.customerName}</span>
                  {txn.mpesaCode && (
                    <span className="font-mono font-bold text-green-700">
                      Code: {txn.mpesaCode}
                    </span>
                  )}
                  {txn.bankTransactionRef && (
                    <span className="font-mono text-slate-500">
                      Ref: {txn.bankTransactionRef}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                  <span>{txn.documentNumber || 'General Deposit'}</span>
                  <span>{txn.date.substring(0, 16)}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenPaymentModal}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Record New Payment Receipt</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Split: Factory Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Production Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all duration-300"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-[#06163c] rounded-lg">
                <Factory className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Active Factory Production Lines
              </h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateTab('production')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer group"
            >
              <span>Open Kanban</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <div className="space-y-3">
            {productionOrders.map((ord) => (
              <motion.div
                key={ord.id}
                whileHover={{ y: -2, scale: 1.01 }}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 hover:border-blue-200 text-xs space-y-2 transition-all duration-200 cursor-default"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                    <span className="text-[11px] text-slate-500">{ord.productName}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                    {ord.orderNumber}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 capitalize font-medium">
                      Stage: <strong className="text-slate-900">{ord.stage.replace('_', ' ')}</strong>
                    </span>
                    <span className="font-mono font-bold text-blue-600">{ord.stageProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#06163c] to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ord.stageProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Supervisor: {ord.assignedSupervisor}</span>
                  <span>Target: {ord.targetDeliveryDate}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Warehouse Inventory Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all duration-300"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Inventory & Stock Alerts
              </h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer group"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 3, scale: 1.01 }}
                  className="p-3 bg-amber-50/70 hover:bg-amber-100/60 rounded-xl border border-amber-200 text-xs flex justify-between items-center transition-all duration-200 cursor-default"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      SKU: {item.sku} • Location: {item.location}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-red-600 text-sm block">
                      {item.stockOnHand} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Reorder at {item.reorderLevel}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              All finished goods, fabrics, and yarn stocks are within healthy thresholds.
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenInventoryModal}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-[#06163c] font-bold text-xs rounded-xl border border-slate-200 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Add New Stock Item or Raw Fabric</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
