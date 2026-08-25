import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  FileText,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Layers,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, exportPeriodicSalesStatementPDF, exportPeriodicSalesStatementCSV } from '../../utils/documentExport';
import { PeriodicStatementPeriod, LocationId } from '../../types';
import { getLocalDateString } from '../../utils/salesStatementEngine';

export const PeriodicStatementModal: React.FC = () => {
  const {
    isPeriodicStatementModalOpen,
    setIsPeriodicStatementModalOpen,
    getPeriodicStatementSummary,
    locations,
    etrConfig,
    brandSettings
  } = useERP();

  const [periodType, setPeriodType] = useState<PeriodicStatementPeriod>('daily');
  const [selectedLocation, setSelectedLocation] = useState<LocationId | 'All'>('All');

  // Compute default dates based on periodType
  const todayStr = getLocalDateString();
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  if (!isPeriodicStatementModalOpen) return null;

  // Calculate start and end date based on active period selection
  let startDate = todayStr;
  let endDate = todayStr;

  const now = new Date();

  if (periodType === 'daily') {
    startDate = todayStr;
    endDate = todayStr;
  } else if (periodType === 'weekly') {
    // Current week starting Monday
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    startDate = getLocalDateString(monday);
    endDate = todayStr;
  } else if (periodType === 'monthly') {
    // Current month starting on 1st
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = getLocalDateString(firstDay);
    endDate = todayStr;
  } else if (periodType === 'custom') {
    startDate = customStartDate;
    endDate = customEndDate;
  }

  const statement = getPeriodicStatementSummary(
    periodType,
    startDate,
    endDate,
    selectedLocation
  );

  const handleDownloadPDF = () => {
    exportPeriodicSalesStatementPDF(statement, etrConfig, brandSettings);
  };

  const handleDownloadCSV = () => {
    exportPeriodicSalesStatementCSV(statement);
  };

  return (
    <div id="periodic-statement-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="periodic-statement-modal-container" className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Periodic Sales & Financial Statements
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30 capitalize">
                  {periodType} Statement
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate official daily, weekly, or monthly revenue statements with full payment channel audits.
              </p>
            </div>
          </div>
          <button
            id="periodic-statement-dismiss-btn"
            onClick={() => setIsPeriodicStatementModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector & Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Period Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              <button
                id="statement-period-daily-btn"
                type="button"
                onClick={() => setPeriodType('daily')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  periodType === 'daily'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily (Today)
              </button>
              <button
                id="statement-period-weekly-btn"
                type="button"
                onClick={() => setPeriodType('weekly')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  periodType === 'weekly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly (This Week)
              </button>
              <button
                id="statement-period-monthly-btn"
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  periodType === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly (This Month)
              </button>
              <button
                id="statement-period-custom-btn"
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  periodType === 'custom'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Location Scope:</span>
              <select
                id="statement-location-filter"
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value as any)}
                className="font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="All">All Locations & Central Stores</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Pickers (if custom selected) */}
          {periodType === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Start Date:</span>
                <input
                  id="statement-custom-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">End Date:</span>
                <input
                  id="statement-custom-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Statement Live Preview Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Statement Header Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                Official ETR Tax Statement Preview
              </span>
              <h3 className="text-base font-bold text-white">{statement.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scope: {statement.locationName} | Generated: {new Date().toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Gross Sales Turnover</span>
              <span className="text-xl font-black text-rose-400">{formatCurrency(statement.grossSalesRevenue)}</span>
            </div>
          </div>

          {/* Section 1: Statement Financial Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Gross Turnover</span>
              <span className="text-sm font-extrabold text-slate-900">{formatCurrency(statement.grossSalesRevenue)}</span>
              <span className="text-[10px] text-slate-400 block">{statement.totalOrders} total orders</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">16% VAT Liability</span>
              <span className="text-sm font-extrabold text-rose-600">{formatCurrency(statement.vat16Amount)}</span>
              <span className="text-[10px] text-slate-400 block">KRA Output VAT</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Net Sales Revenue</span>
              <span className="text-sm font-extrabold text-teal-700">{formatCurrency(statement.netSalesRevenue)}</span>
              <span className="text-[10px] text-slate-400 block">{statement.totalUnitsSold.toLocaleString()} units sold</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Gross Operating Profit</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(statement.grossProfit)}</span>
              <span className="text-[10px] text-emerald-600 font-bold block">{statement.grossMarginPercent}% margin</span>
            </div>
          </div>

          {/* Section 2: Payment Channels Audit (Cash vs M-Pesa vs Bank) */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Settlement Breakdown by Channel (Cash at Hand vs M-Pesa vs Bank)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Revenue Channel</th>
                    <th className="py-2.5 px-3 text-center">Orders Count</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue (KSh)</th>
                    <th className="py-2.5 px-3 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Cash at Hand (Physical Register Receipts)
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{statement.cashSalesCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(statement.cashSalesTotal)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {statement.grossSalesRevenue > 0 ? ((statement.cashSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <Smartphone className="w-3.5 h-3.5 text-green-600" />
                      Safaricom M-Pesa (Buy Goods Till / Paybill)
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{statement.mpesaSalesCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(statement.mpesaSalesTotal)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {statement.grossSalesRevenue > 0 ? ((statement.mpesaSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Commercial Bank Direct Wire / EFT / RTGS
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{statement.bankSalesCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(statement.bankSalesTotal)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {statement.grossSalesRevenue > 0 ? ((statement.bankSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      Card Swipes / Other
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{statement.cardSalesCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(statement.cardSalesTotal)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {statement.grossSalesRevenue > 0 ? ((statement.cardSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-900">Total Consolidated Settlement</td>
                    <td className="py-2.5 px-3 text-center text-slate-800">{statement.totalOrders}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-extrabold">{formatCurrency(statement.grossSalesRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Recent Transactions Sample Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Matching Transactions ({statement.orders.length} orders)</span>
              <span className="text-[11px] text-slate-400 font-normal">Full list included in PDF/CSV export</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Receipt #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3 text-right">16% VAT</th>
                    <th className="py-2 px-3 text-right">Total (KSh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statement.orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No orders recorded during this statement period.
                      </td>
                    </tr>
                  ) : (
                    statement.orders.slice(0, 10).map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{o.receiptNumber || o.id}</td>
                        <td className="py-2 px-3 text-slate-500">{new Date(o.timestamp).toLocaleDateString()}</td>
                        <td className="py-2 px-3 text-slate-700">{o.customerName || 'Retail Customer'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(o.vatAmount)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(o.grandTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            id="statement-modal-close-btn"
            onClick={() => setIsPeriodicStatementModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Dismiss
          </button>
          
          <div className="flex items-center gap-2">
            <button
              id="statement-download-csv-btn"
              onClick={handleDownloadCSV}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Statement
            </button>
            <button
              id="statement-download-pdf-btn"
              onClick={handleDownloadPDF}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official {periodType.toUpperCase()} PDF Statement
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
