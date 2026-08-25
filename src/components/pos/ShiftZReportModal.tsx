import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Smartphone,
  DollarSign,
  User,
  Clock,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, exportCashierShiftClosurePDF, exportCashierShiftClosureCSV } from '../../utils/documentExport';

export const ShiftZReportModal: React.FC = () => {
  const {
    selectedShiftRecord,
    setSelectedShiftRecord,
    etrConfig,
    brandSettings
  } = useERP();

  if (!selectedShiftRecord) return null;

  const shift = selectedShiftRecord;

  const handleDownloadPDF = () => {
    exportCashierShiftClosurePDF(shift, etrConfig, brandSettings);
  };

  const handleDownloadCSV = () => {
    exportCashierShiftClosureCSV(shift);
  };

  return (
    <div id="shift-zreport-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="shift-zreport-modal-container" className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Shift Closure Z-Report
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">
                  {shift.zReportNumber || shift.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Cashier Handover & ETR End-of-Day Terminal Reconciliation
              </p>
            </div>
          </div>
          <button
            id="shift-zreport-dismiss-btn"
            onClick={() => setSelectedShiftRecord(null)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Meta Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Cashier</span>
            <span className="font-bold text-slate-900">{shift.operatorName}</span>
            <span className="text-[10px] text-slate-400 block capitalize">{shift.operatorRole || 'Cashier'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Branch Location</span>
            <span className="font-bold text-slate-900">{shift.locationName || shift.locationId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Shift Timing</span>
            <span className="font-bold text-slate-900">
              {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.closedAt || shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {new Date(shift.closedAt || shift.endTime).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              shift.totalVariance === 0
                ? 'bg-emerald-100 text-emerald-800'
                : shift.totalVariance > 0
                ? 'bg-blue-100 text-blue-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {shift.totalVariance === 0 ? '✓ Balanced' : shift.totalVariance > 0 ? '+ Surplus' : '- Shortage'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Revenue Turnover Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Gross Sales</span>
              <span className="text-sm font-extrabold text-slate-900">{formatCurrency(shift.grossSalesRevenue)}</span>
              <span className="text-[10px] text-slate-400 block">{shift.totalSalesOrdersCount} orders</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">16% Output VAT</span>
              <span className="text-sm font-extrabold text-rose-600">{formatCurrency(shift.vatLiability)}</span>
              <span className="text-[10px] text-slate-400 block">Tax Liability</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Net Turnover</span>
              <span className="text-sm font-extrabold text-teal-700">{formatCurrency(shift.netSalesRevenue)}</span>
              <span className="text-[10px] text-slate-400 block">{shift.totalUnitsSold} units sold</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Net Variance</span>
              <span className={`text-sm font-extrabold ${
                shift.totalVariance === 0 ? 'text-emerald-600' : shift.totalVariance > 0 ? 'text-blue-600' : 'text-rose-600'
              }`}>
                {shift.totalVariance === 0 ? 'KSh 0.00' : `${shift.totalVariance > 0 ? '+' : ''}${formatCurrency(shift.totalVariance)}`}
              </span>
              <span className="text-[10px] text-slate-400 block">Reconciliation</span>
            </div>
          </div>

          {/* Three Channel Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Three-Channel Settlement Audit (Cash vs M-Pesa vs Bank)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Revenue Channel</th>
                    <th className="py-2.5 px-3 text-right">Expected (KSh)</th>
                    <th className="py-2.5 px-3 text-right">Cashier Count (KSh)</th>
                    <th className="py-2.5 px-3 text-right">Variance (KSh)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Cash at Hand (Drawer)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(shift.expectedCash)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(shift.actualCashAtHand)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      shift.cashVariance === 0 ? 'text-emerald-600' : shift.cashVariance > 0 ? 'text-blue-600' : 'text-rose-600'
                    }`}>
                      {shift.cashVariance === 0 ? '0.00' : `${shift.cashVariance > 0 ? '+' : ''}${formatCurrency(shift.cashVariance)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        shift.cashVariance === 0 ? 'bg-emerald-50 text-emerald-700' : shift.cashVariance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {shift.cashVariance === 0 ? 'Balanced' : shift.cashVariance > 0 ? 'Surplus' : 'Shortage'}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <Smartphone className="w-3.5 h-3.5 text-green-600" />
                      Safaricom M-Pesa Till
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(shift.expectedMpesa)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(shift.actualMpesa)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      shift.mpesaVariance === 0 ? 'text-emerald-600' : shift.mpesaVariance > 0 ? 'text-blue-600' : 'text-rose-600'
                    }`}>
                      {shift.mpesaVariance === 0 ? '0.00' : `${shift.mpesaVariance > 0 ? '+' : ''}${formatCurrency(shift.mpesaVariance)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        shift.mpesaVariance === 0 ? 'bg-emerald-50 text-emerald-700' : shift.mpesaVariance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {shift.mpesaVariance === 0 ? 'Balanced' : shift.mpesaVariance > 0 ? 'Surplus' : 'Shortage'}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Commercial Bank Wire
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(shift.expectedBank)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(shift.actualBank)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      shift.bankVariance === 0 ? 'text-emerald-600' : shift.bankVariance > 0 ? 'text-blue-600' : 'text-rose-600'
                    }`}>
                      {shift.bankVariance === 0 ? '0.00' : `${shift.bankVariance > 0 ? '+' : ''}${formatCurrency(shift.bankVariance)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        shift.bankVariance === 0 ? 'bg-emerald-50 text-emerald-700' : shift.bankVariance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {shift.bankVariance === 0 ? 'Balanced' : shift.bankVariance > 0 ? 'Surplus' : 'Shortage'}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-900">Total Liquid Assets Reconciled</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {formatCurrency(shift.expectedCash + shift.expectedMpesa + shift.expectedBank)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900">
                      {formatCurrency(shift.actualCashAtHand + shift.actualMpesa + shift.actualBank)}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${
                      shift.totalVariance === 0 ? 'text-emerald-600' : shift.totalVariance > 0 ? 'text-blue-600' : 'text-rose-600'
                    }`}>
                      {shift.totalVariance === 0 ? '0.00' : `${shift.totalVariance > 0 ? '+' : ''}${formatCurrency(shift.totalVariance)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        shift.totalVariance === 0 ? 'bg-emerald-100 text-emerald-800' : shift.totalVariance > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {shift.totalVariance === 0 ? 'Balanced' : 'Audited'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Denominations (if counted) */}
          {shift.cashDenominations && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Physical Cash Breakdown (Denominations)
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">1,000s</span>
                  <span className="font-bold text-slate-800">{shift.cashDenominations.notes1000 || 0} pcs</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency((shift.cashDenominations.notes1000 || 0) * 1000)}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">500s</span>
                  <span className="font-bold text-slate-800">{shift.cashDenominations.notes500 || 0} pcs</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency((shift.cashDenominations.notes500 || 0) * 500)}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">200s</span>
                  <span className="font-bold text-slate-800">{shift.cashDenominations.notes200 || 0} pcs</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency((shift.cashDenominations.notes200 || 0) * 200)}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">100s</span>
                  <span className="font-bold text-slate-800">{shift.cashDenominations.notes100 || 0} pcs</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency((shift.cashDenominations.notes100 || 0) * 100)}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">50s</span>
                  <span className="font-bold text-slate-800">{shift.cashDenominations.notes50 || 0} pcs</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency((shift.cashDenominations.notes50 || 0) * 50)}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Coins</span>
                  <span className="font-bold text-slate-800">-</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency(shift.cashDenominations.coins || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Handover & Notes */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Handed Over To:</span>
              <span className="font-bold text-slate-900">{shift.handedOverTo || 'Central Safe / Next Shift'}</span>
            </div>
            {shift.closingNotes && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Cashier Closing Notes:</span>
                <span className="text-slate-800 italic">{shift.closingNotes}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
              <span>Timestamp:</span>
              <span>{new Date(shift.closedAt || shift.endTime).toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            id="shift-zreport-close-btn"
            onClick={() => setSelectedShiftRecord(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Dismiss
          </button>
          <div className="flex items-center gap-2">
            <button
              id="shift-zreport-download-csv-btn"
              onClick={handleDownloadCSV}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              id="shift-zreport-download-pdf-btn"
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF Z-Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
