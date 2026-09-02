import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ImportShipmentRecord,
  SupplierDebitNoteRecord
} from '../../types';
import {
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Building,
  RefreshCw,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import { generateSupplierDebitNotePDF } from '../../utils/documentExport';

interface ThreeWayWeightMatchingTabProps {
  shipment: ImportShipmentRecord;
}

export const ThreeWayWeightMatchingTab: React.FC<ThreeWayWeightMatchingTabProps> = ({
  shipment
}) => {
  const { addLedgerEntry, currentUser } = useERP();

  // Scale Intake weights per line item (default to slightly below invoice to simulate real weigh-in variance)
  const [scaleWeights, setScaleWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    shipment.lineItems.forEach((item, idx) => {
      // Simulate real variance on item 1: e.g. 21,719 kg invoiced -> 21,550 kg weighed (-169 kg shortage)
      initial[item.id] = idx === 0 ? item.netWeightKg - 169 : item.netWeightKg;
    });
    return initial;
  });

  const [debitNoteReason, setDebitNoteReason] = useState(
    'Short-delivery recorded on ICD weighbridge scale intake. Total invoiced weight not received.'
  );
  const [generatedDebitNote, setGeneratedDebitNote] = useState<SupplierDebitNoteRecord | null>(null);
  const [isPostingGL, setIsPostingGL] = useState(false);

  // Compute variances
  const weightAuditRows = shipment.lineItems.map(item => {
    const invoicedKg = item.netWeightKg;
    const receivedKg = scaleWeights[item.id] ?? invoicedKg;
    const shortageKg = Math.max(0, invoicedKg - receivedKg);
    const unitFobUSD = (item.fobUSD || 0) / (item.netWeightKg || 1);
    const shortageUSD = shortageKg * unitFobUSD;
    const shortageKES = shortageUSD * shipment.exchangeRate;

    // KRA Duty impact (specific duty 97.5 KES/kg)
    const kraDutyLossKES = shortageKg * 97.5;

    return {
      lineItemId: item.id,
      description: item.description,
      invoicedKg,
      receivedKg,
      shortageKg,
      unitFobUSD,
      shortageUSD,
      shortageKES,
      kraDutyLossKES,
      variancePct: (shortageKg / invoicedKg) * 100
    };
  });

  const totalInvoicedKg = weightAuditRows.reduce((sum, r) => sum + r.invoicedKg, 0);
  const totalReceivedKg = weightAuditRows.reduce((sum, r) => sum + r.receivedKg, 0);
  const totalShortageKg = weightAuditRows.reduce((sum, r) => sum + r.shortageKg, 0);
  const totalShortageUSD = weightAuditRows.reduce((sum, r) => sum + r.shortageUSD, 0);
  const totalShortageKES = weightAuditRows.reduce((sum, r) => sum + r.shortageKES, 0);
  const totalDutyImpactKES = weightAuditRows.reduce((sum, r) => sum + r.kraDutyLossKES, 0);

  const handleUpdateWeight = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setScaleWeights(prev => ({ ...prev, [id]: num }));
  };

  const handleCreateDebitNote = async () => {
    if (totalShortageKg <= 0) {
      alert('No weight shortage detected. Scale weights match or exceed invoiced weights.');
      return;
    }

    setIsPostingGL(true);

    try {
      const debitNoteNo = `DBN-${shipment.invoiceNumber}-${Date.now().toString().slice(-4)}`;
      const journalRef = `JRN-DBN-${debitNoteNo}`;

      // Post Debit Note Journal to GL:
      // Debit: 2010 Accounts Payable (Overseas Supplier) -> reduces liability to supplier
      // Credit: 1200 Raw Material Inventory (adjust capitalized inventory down)
      addLedgerEntry({
        description: `Supplier Debit Note ${debitNoteNo} for ${totalShortageKg.toLocaleString()} kg shortage on Inv ${shipment.invoiceNumber}`,
        transactionRef: journalRef,
        debitAccount: '2010 - Accounts Payable (Overseas Supplier Clearing)',
        creditAccount: '1200 - Raw Materials & Fabric Inventory Asset',
        amount: totalShortageKES,
        locationId: shipment.destinationLocationId || 'loc-nbo-cbd',
        category: 'Inventory Variance'
      });

      const record: SupplierDebitNoteRecord = {
        id: `DBN-REC-${Date.now()}`,
        debitNoteNumber: debitNoteNo,
        date: new Date().toISOString().slice(0, 10),
        supplierName: shipment.supplierName,
        supplierCountry: shipment.supplierCountry,
        originalInvoiceNo: shipment.invoiceNumber,
        customsEntryNo: shipment.customsEntryNo,
        kraEslipRef: shipment.kraEslipRef,
        exchangeRate: shipment.exchangeRate,
        items: weightAuditRows.map(r => ({
          lineItemId: r.lineItemId,
          description: r.description,
          invoicedWeightKg: r.invoicedKg,
          receivedWeightKg: r.receivedKg,
          shortageKg: r.shortageKg,
          unitFobUSD: r.unitFobUSD,
          shortageAmountUSD: r.shortageUSD,
          shortageAmountKES: r.shortageKES
        })),
        totalShortageKg,
        totalShortageUSD,
        totalShortageKES,
        kraDutyImpactKES: totalDutyImpactKES,
        totalClaimAmountUSD: totalShortageUSD,
        totalClaimAmountKES: totalShortageKES,
        reason: debitNoteReason,
        status: 'posted_to_gl',
        glJournalRef: journalRef
      };

      setGeneratedDebitNote(record);
    } catch (err) {
      console.error('Failed to post debit note:', err);
      alert('Error creating supplier debit note.');
    } finally {
      setIsPostingGL(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedDebitNote) return;
    generateSupplierDebitNotePDF({
      debitNoteNumber: generatedDebitNote.debitNoteNumber,
      date: generatedDebitNote.date,
      supplierName: generatedDebitNote.supplierName,
      supplierCountry: generatedDebitNote.supplierCountry,
      originalInvoiceNo: generatedDebitNote.originalInvoiceNo,
      customsEntryNo: generatedDebitNote.customsEntryNo,
      kraEslipRef: generatedDebitNote.kraEslipRef,
      items: generatedDebitNote.items,
      exchangeRate: generatedDebitNote.exchangeRate,
      totalShortageKg: generatedDebitNote.totalShortageKg,
      totalShortageUSD: generatedDebitNote.totalShortageUSD,
      totalShortageKES: generatedDebitNote.totalShortageKES,
      kraDutyImpactKES: generatedDebitNote.kraDutyImpactKES,
      totalClaimAmountUSD: generatedDebitNote.totalClaimAmountUSD,
      totalClaimAmountKES: generatedDebitNote.totalClaimAmountKES,
      reason: generatedDebitNote.reason,
      preparedBy: currentUser?.name || 'Chief Financial Accountant'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                3-Way Landed Weight Matching &amp; Supplier Debit Note Generator
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Reconcile Commercial Invoice vs Warehouse Intake Scale Weights to protect margins against fabric shortages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-[11px]">
            <span className="text-slate-400">Target Invoice:</span>
            <span className="font-mono text-emerald-400 font-bold">{shipment.invoiceNumber}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Customs SAD:</span>
            <span className="font-mono text-amber-300 font-bold">{shipment.customsEntryNo}</span>
          </div>
        </div>
      </div>

      {/* Variance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">Invoiced Net Weight</span>
          <p className="text-lg font-black text-slate-900 font-mono">
            {totalInvoicedKg.toLocaleString()} kg
          </p>
          <span className="text-[10px] text-slate-400">Billed by {shipment.supplierName}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">Scale Intake Net Weight</span>
          <p className="text-lg font-black text-slate-900 font-mono">
            {totalReceivedKg.toLocaleString()} kg
          </p>
          <span className="text-[10px] text-slate-400">Verified at Factory / ICD scale</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          totalShortageKg > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold">Total Shortage</span>
            {totalShortageKg > 0 ? <TrendingDown className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>
          <p className="text-lg font-black font-mono">
            {totalShortageKg > 0 ? `-${totalShortageKg.toLocaleString()} kg` : '0 kg (Matched)'}
          </p>
          <span className="text-[10px] opacity-80">
            {totalShortageKg > 0 ? `${((totalShortageKg / totalInvoicedKg) * 100).toFixed(2)}% net loss` : 'Exact weigh-in'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          totalShortageUSD > 0 ? 'bg-rose-900 text-white border-rose-800' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <span className="text-rose-200 font-medium">Recoverable Claim (USD)</span>
          <p className="text-lg font-black text-amber-300 font-mono">
            ${totalShortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-200">
            Equivalent: KES {totalShortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Audit Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-slate-900 text-sm">Line Item Weigh-In Discrepancy Schedule</h4>
          </div>
          <span className="text-[11px] text-slate-500">Edit scale intake values below to recalculate variances</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Item Description</th>
                <th className="p-3 text-right">Invoiced (kg)</th>
                <th className="p-3 text-right">Actual Scale (kg)</th>
                <th className="p-3 text-right">Shortage (kg)</th>
                <th className="p-3 text-right">Unit FOB ($)</th>
                <th className="p-3 text-right">Claim ($USD)</th>
                <th className="p-3 text-right">Claim (KES)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weightAuditRows.map(row => (
                <tr key={row.lineItemId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-medium text-slate-900">{row.description}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-700">{row.invoicedKg.toLocaleString()} kg</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={scaleWeights[row.lineItemId] ?? row.invoicedKg}
                      onChange={(e) => handleUpdateWeight(row.lineItemId, e.target.value)}
                      className="w-28 p-1.5 text-right font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-rose-500"
                    />
                  </td>
                  <td className={`p-3 text-right font-mono font-bold ${row.shortageKg > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {row.shortageKg > 0 ? `-${row.shortageKg.toLocaleString()} kg` : '0 kg'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">${row.unitFobUSD.toFixed(3)}</td>
                  <td className={`p-3 text-right font-mono font-bold ${row.shortageUSD > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    ${row.shortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right font-mono font-bold ${row.shortageKES > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    KES {row.shortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 text-center">
                    {row.shortageKg > 0 ? (
                      <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Shortage
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
              <tr>
                <td className="p-3 text-slate-900">Total Audit Summary</td>
                <td className="p-3 text-right font-mono">{totalInvoicedKg.toLocaleString()} kg</td>
                <td className="p-3 text-right font-mono">{totalReceivedKg.toLocaleString()} kg</td>
                <td className="p-3 text-right font-mono text-rose-600">-{totalShortageKg.toLocaleString()} kg</td>
                <td className="p-3 text-right">-</td>
                <td className="p-3 text-right font-mono text-rose-600">${totalShortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-rose-600">KES {totalShortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="p-3 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action and Debit Note Generation Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h4 className="font-bold text-slate-900 text-sm">Issue Official Supplier Debit Note</h4>
          </div>
          {generatedDebitNote && (
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Debit Note #{generatedDebitNote.debitNoteNumber} Posted to GL
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <label className="font-bold text-slate-700">Debit Note Reason / Particulars:</label>
            <input
              type="text"
              value={debitNoteReason}
              onChange={(e) => setDebitNoteReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
            <p className="text-[11px] text-slate-500">
              This reason will appear on the printed Debit Note and will be referenced in General Ledger journal entries.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-2">
            {!generatedDebitNote ? (
              <button
                type="button"
                onClick={handleCreateDebitNote}
                disabled={totalShortageKg <= 0 || isPostingGL}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  totalShortageKg > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isPostingGL ? 'Posting Journal...' : 'Generate & Post Debit Note to GL'}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Debit Note PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
