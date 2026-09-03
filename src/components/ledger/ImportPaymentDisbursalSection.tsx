import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ImportShipmentRecord,
  SupplierUSDDisbursement,
  KRATaxDisbursement,
  ClearingForwardingDisbursement
} from '../../types';
import {
  DollarSign,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileDown,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  RefreshCw,
  Info,
  Check,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import {
  exportSupplierUSDSwiftVoucherPDF,
  exportSupplierUSDSwiftVoucherCSV,
  exportKRATaxPaymentVoucherPDF,
  exportKRATaxPaymentVoucherCSV,
  exportClearingLogisticsVoucherPDF,
  exportClearingLogisticsVoucherCSV,
  exportThreeWayPaymentSchedulePDF,
  exportThreeWayPaymentScheduleCSV
} from '../../utils/documentExport';

interface Props {
  shipment: ImportShipmentRecord;
  totalCustomsTaxesKES: number;
  duty1002KES: number;
  idf1801KES: number;
  rdl6001KES: number;
  vat1202KES: number;
  mss6401KES: number;
  totalFOB_USD: number;
  totalFreightUSD: number;
  effectiveExchangeRate: number;
  onUpdateShipment?: (updated: ImportShipmentRecord) => void;
}

export const ImportPaymentDisbursalSection: React.FC<Props> = ({
  shipment,
  totalCustomsTaxesKES,
  duty1002KES,
  idf1801KES,
  rdl6001KES,
  vat1202KES,
  mss6401KES,
  totalFOB_USD,
  totalFreightUSD,
  effectiveExchangeRate,
  onUpdateShipment
}) => {
  const { addLedgerEntry, brandSettings, currentUser } = useERP();

  // Active state for recording modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isKRAModalOpen, setIsKRAModalOpen] = useState(false);
  const [isClearingModalOpen, setIsClearingModalOpen] = useState(false);

  // Local state for payment records if not already in shipment
  const totalInvoicedUSD = (totalFOB_USD + totalFreightUSD + (shipment.cocFeesUSD || 0)) || 55600.64;
  const estimatedClearingKES = shipment.portClearingFeesKES || 180000;

  // Initialize payment history from shipment or local state
  const [supplierPayments, setSupplierPayments] = useState<SupplierUSDDisbursement[]>(
    shipment.paymentSchedule?.supplierUSD.payments || []
  );

  const [kraPayments, setKraPayments] = useState<KRATaxDisbursement[]>(
    shipment.paymentSchedule?.kraTaxesKES.payments || []
  );

  const [clearingPayments, setClearingPayments] = useState<ClearingForwardingDisbursement[]>(
    shipment.paymentSchedule?.clearingLogisticsKES.payments || []
  );

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    amountUSD: totalInvoicedUSD,
    exchangeRateActual: effectiveExchangeRate || 129.39,
    sourceAccount: 'USD_NOSTRO_STANBIC',
    sourceAccountLabel: 'Stanbic Bank Kenya - USD Forex Nostro A/C (0100299102)',
    swiftMt103Ref: `TT-${new Date().getFullYear()}-STB-${Math.floor(10000 + Math.random() * 90000)}`,
    beneficiaryName: shipment.supplierName || 'ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD.',
    beneficiaryBank: 'BANK OF CHINA, ZHEJIANG PROVINCIAL BRANCH',
    beneficiaryIbanOrAccount: 'CN38 1040 0001 2991 8820 1192',
    bankChargesUSD: 45.0,
    chargeBorneBy: 'OUR' as 'OUR' | 'BEN' | 'SHA',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: `Settlement of Overseas Commercial Invoice ${shipment.invoiceNumber} ($${totalInvoicedUSD.toLocaleString()} USD)`
  });

  // KRA Form State
  const [kraForm, setKraForm] = useState({
    amountKES: totalCustomsTaxesKES,
    duty1002KES: duty1002KES,
    idf1801KES: idf1801KES,
    rdl6001KES: rdl6001KES,
    vat1202KES: vat1202KES,
    mss6401KES: mss6401KES,
    kraEslipNumber: shipment.kraEslipRef || '1020260001007429',
    customsEntryNo: shipment.customsEntryNo || '26EMKIM400955090',
    bankPaymentPortal: 'KCB_ITAX',
    bankPaymentPortalLabel: 'KCB Bank Kenya - iTax & Customs E-Slip Portal',
    bankTransactionRef: `KCB-TAX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: `Direct E-Slip settlement of KRA Customs Assessment ${shipment.customsEntryNo}`
  });

  // Clearing Form State
  const [clearingForm, setClearingForm] = useState({
    amountKES: estimatedClearingKES,
    declarantName: shipment.declarantName || 'Blue Pearl Logistics Limited',
    declarantPin: shipment.declarantPin || 'P051506858S',
    agentInvoiceRef: `BPL-${new Date().getFullYear()}-INV-${Math.floor(100 + Math.random() * 900)}`,
    paymentMethod: 'RTGS' as 'RTGS' | 'EFT' | 'Corporate M-Pesa' | 'Cheque' | 'Bank Transfer',
    sourceBankName: 'Equity Bank Kenya Ltd - Operations Account (0110299881)',
    paymentRefNo: `RTGS-EQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    declarantAgencyFeeKES: 35000,
    cfsPortWharfageKES: 65000,
    shippingLineDemurrageKES: 25000,
    inlandTransportSgrKES: estimatedClearingKES - (35000 + 65000 + 25000) > 0 ? estimatedClearingKES - (35000 + 65000 + 25000) : 55000,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: `Port clearing, CFS handling & inland transport for container ${shipment.shipmentNumber}`
  });

  // Aggregated totals
  const totalPaidSupplierUSD = supplierPayments.reduce((acc, p) => acc + p.amountUSD, 0);
  const supplierBalanceUSD = Math.max(0, totalInvoicedUSD - totalPaidSupplierUSD);
  const isSupplierFullyPaid = supplierBalanceUSD <= 0.01 && supplierPayments.length > 0;

  const totalPaidKraKES = kraPayments.reduce((acc, p) => acc + p.amountKES, 0);
  const kraBalanceKES = Math.max(0, totalCustomsTaxesKES - totalPaidKraKES);
  const isKraFullyPaid = kraBalanceKES <= 1 && kraPayments.length > 0;

  const totalPaidClearingKES = clearingPayments.reduce((acc, p) => acc + p.amountKES, 0);
  const clearingBalanceKES = Math.max(0, estimatedClearingKES - totalPaidClearingKES);
  const isClearingFullyPaid = clearingBalanceKES <= 1 && clearingPayments.length > 0;

  // Process Supplier Payment in USD
  const handleConfirmSupplierPayment = () => {
    const kshEquivalent = supplierForm.amountUSD * supplierForm.exchangeRateActual;
    const journalId = `JV-USD-${Date.now().toString().slice(-6)}`;

    // Post to ERP General Ledger
    addLedgerEntry({
      transactionRef: supplierForm.swiftMt103Ref,
      description: `Foreign Swift Settlement to ${supplierForm.beneficiaryName} for Inv #${shipment.invoiceNumber} ($${supplierForm.amountUSD.toLocaleString()} USD @ ${supplierForm.exchangeRateActual.toFixed(2)} FX - Swift Ref: ${supplierForm.swiftMt103Ref})`,
      debitAccount: '2010 - Accounts Payable (Overseas Supplier)',
      creditAccount: '1020 - USD Forex Nostro Bank / Forex Spot',
      amount: kshEquivalent,
      locationId: shipment.destinationLocationId || 'main_store',
      category: 'Foreign Overseas Supplier Settlement'
    });

    const newPayment: SupplierUSDDisbursement = {
      id: `PAY-USD-${Date.now()}`,
      paymentDate: supplierForm.paymentDate,
      amountUSD: Number(supplierForm.amountUSD),
      exchangeRateActual: Number(supplierForm.exchangeRateActual),
      amountKESEquivalent: kshEquivalent,
      sourceAccount: supplierForm.sourceAccount,
      sourceAccountLabel: supplierForm.sourceAccountLabel,
      swiftMt103Ref: supplierForm.swiftMt103Ref,
      beneficiaryName: supplierForm.beneficiaryName,
      beneficiaryBank: supplierForm.beneficiaryBank,
      beneficiaryIbanOrAccount: supplierForm.beneficiaryIbanOrAccount,
      bankChargesUSD: Number(supplierForm.bankChargesUSD),
      chargeBorneBy: supplierForm.chargeBorneBy,
      status: 'confirmed',
      journalRef: journalId,
      notes: supplierForm.notes
    };

    const updatedPayments = [newPayment, ...supplierPayments];
    setSupplierPayments(updatedPayments);

    if (onUpdateShipment) {
      onUpdateShipment({
        ...shipment,
        paymentSchedule: {
          shipmentId: shipment.id,
          invoiceNumber: shipment.invoiceNumber,
          supplierUSD: {
            totalInvoicedUSD,
            payments: updatedPayments
          },
          kraTaxesKES: {
            totalAssessedKES: totalCustomsTaxesKES,
            payments: kraPayments
          },
          clearingLogisticsKES: {
            totalEstimatedKES: estimatedClearingKES,
            payments: clearingPayments
          }
        }
      });
    }

    setIsSupplierModalOpen(false);
  };

  // Process KRA Customs Tax Payment in KES
  const handleConfirmKRAPayment = () => {
    const journalId = `JV-KRA-${Date.now().toString().slice(-6)}`;

    // Post to ERP General Ledger
    addLedgerEntry({
      transactionRef: kraForm.kraEslipNumber,
      description: `KRA Customs Tax Payment for Entry ${kraForm.customsEntryNo} (E-Slip PRN: ${kraForm.kraEslipNumber} - Bank Ref: ${kraForm.bankTransactionRef})`,
      debitAccount: '2120 - KRA Customs Duties & Taxes Payable',
      creditAccount: '1002 - Commercial Bank (KES Operational Account)',
      amount: Number(kraForm.amountKES),
      locationId: shipment.destinationLocationId || 'main_store',
      category: 'KRA Customs Duties & Taxes'
    });

    const newPayment: KRATaxDisbursement = {
      id: `PAY-KRA-${Date.now()}`,
      paymentDate: kraForm.paymentDate,
      amountKES: Number(kraForm.amountKES),
      customsEntryNo: kraForm.customsEntryNo,
      kraEslipNumber: kraForm.kraEslipNumber,
      bankPaymentPortal: kraForm.bankPaymentPortal,
      bankPaymentPortalLabel: kraForm.bankPaymentPortalLabel,
      bankTransactionRef: kraForm.bankTransactionRef,
      duty1002KES: Number(kraForm.duty1002KES),
      idf1801KES: Number(kraForm.idf1801KES),
      rdl6001KES: Number(kraForm.rdl6001KES),
      vat1202KES: Number(kraForm.vat1202KES),
      mss6401KES: Number(kraForm.mss6401KES),
      status: 'confirmed',
      journalRef: journalId,
      notes: kraForm.notes
    };

    const updatedPayments = [newPayment, ...kraPayments];
    setKraPayments(updatedPayments);

    if (onUpdateShipment) {
      onUpdateShipment({
        ...shipment,
        paymentSchedule: {
          shipmentId: shipment.id,
          invoiceNumber: shipment.invoiceNumber,
          supplierUSD: {
            totalInvoicedUSD,
            payments: supplierPayments
          },
          kraTaxesKES: {
            totalAssessedKES: totalCustomsTaxesKES,
            payments: updatedPayments
          },
          clearingLogisticsKES: {
            totalEstimatedKES: estimatedClearingKES,
            payments: clearingPayments
          }
        }
      });
    }

    setIsKRAModalOpen(false);
  };

  // Process Clearing & Forwarding Logistics Payment in KES
  const handleConfirmClearingPayment = () => {
    const journalId = `JV-CLR-${Date.now().toString().slice(-6)}`;

    // Post to ERP General Ledger
    addLedgerEntry({
      transactionRef: clearingForm.paymentRefNo,
      description: `Clearing & Forwarding Settlement to ${clearingForm.declarantName} for Inv #${clearingForm.agentInvoiceRef} (${clearingForm.paymentMethod} Ref: ${clearingForm.paymentRefNo})`,
      debitAccount: '2020 - Transporter & Clearing Agent Payable',
      creditAccount: '1002 - Commercial Bank (KES Operational Account)',
      amount: Number(clearingForm.amountKES),
      locationId: shipment.destinationLocationId || 'main_store',
      category: 'Clearing & Freight Logistics'
    });

    const newPayment: ClearingForwardingDisbursement = {
      id: `PAY-CLR-${Date.now()}`,
      paymentDate: clearingForm.paymentDate,
      amountKES: Number(clearingForm.amountKES),
      declarantName: clearingForm.declarantName,
      declarantPin: clearingForm.declarantPin,
      agentInvoiceRef: clearingForm.agentInvoiceRef,
      paymentMethod: clearingForm.paymentMethod,
      sourceBankName: clearingForm.sourceBankName,
      paymentRefNo: clearingForm.paymentRefNo,
      declarantAgencyFeeKES: Number(clearingForm.declarantAgencyFeeKES),
      cfsPortWharfageKES: Number(clearingForm.cfsPortWharfageKES),
      shippingLineDemurrageKES: Number(clearingForm.shippingLineDemurrageKES),
      inlandTransportSgrKES: Number(clearingForm.inlandTransportSgrKES),
      status: 'confirmed',
      journalRef: journalId,
      notes: clearingForm.notes
    };

    const updatedPayments = [newPayment, ...clearingPayments];
    setClearingPayments(updatedPayments);

    if (onUpdateShipment) {
      onUpdateShipment({
        ...shipment,
        paymentSchedule: {
          shipmentId: shipment.id,
          invoiceNumber: shipment.invoiceNumber,
          supplierUSD: {
            totalInvoicedUSD,
            payments: supplierPayments
          },
          kraTaxesKES: {
            totalAssessedKES: totalCustomsTaxesKES,
            payments: kraPayments
          },
          clearingLogisticsKES: {
            totalEstimatedKES: estimatedClearingKES,
            payments: updatedPayments
          }
        }
      });
    }

    setIsClearingModalOpen(false);
  };

  return (
    <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                3-Way Import Payment &amp; Disbursal Hub
                <span className="text-[10.5px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Multicurrency &bull; USD + KES
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Execute and track the 3 distinct financial disbursements for Invoice{' '}
                <span className="text-amber-400 font-mono font-bold">{shipment.invoiceNumber}</span>: Overseas Mill (USD), KRA Tax E-Slip (KES), and Clearing Logistics (KES).
              </p>
            </div>
          </div>
        </div>

        {/* Global Progress Indicators & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
            isSupplierFullyPaid
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>1. Supplier USD: {isSupplierFullyPaid ? 'Settled' : `$${supplierBalanceUSD.toLocaleString()} Due`}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
            isKraFullyPaid
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>2. KRA KES: {isKraFullyPaid ? 'Cleared' : `KSh ${Math.round(kraBalanceKES).toLocaleString()} Due`}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
            isClearingFullyPaid
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>3. Clearing KES: {isClearingFullyPaid ? 'Paid' : `KSh ${Math.round(clearingBalanceKES).toLocaleString()} Due`}</span>
          </div>

          {/* Quick Dual Export Buttons for the Entire 3-Way Disbursal Schedule */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => exportThreeWayPaymentSchedulePDF(shipment, brandSettings)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download Consolidated 3-Way Payment Schedule PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Schedule PDF</span>
            </button>
            <button
              onClick={() => exportThreeWayPaymentScheduleCSV(shipment)}
              className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 rounded-xl border border-emerald-700/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export Consolidated 3-Way Payment Schedule CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Schedule CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Interactive Disbursement Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: OVERSEAS SUPPLIER PAYMENT IN USD */}
        <div className="bg-slate-800/70 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">1. Overseas Supplier Payment</h4>
                  <span className="text-[10px] text-amber-400/90 font-mono font-bold">Currency: USD ($) &bull; Swift / TT</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                isSupplierFullyPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isSupplierFullyPaid ? '100% Paid' : 'Pending Remittance'}
              </span>
            </div>

            {/* Invoiced vs Paid Stats */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-200 truncate max-w-[170px]" title={shipment.supplierName}>
                  {shipment.supplierName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Commercial Invoice:</span>
                <span className="font-mono font-bold text-amber-400">{shipment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Invoiced Amount:</span>
                <span className="font-mono font-black text-white text-sm">
                  ${totalInvoicedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>KES Equiv (@ {effectiveExchangeRate.toFixed(2)} FX):</span>
                <span className="font-mono text-slate-300">
                  KSh {(totalInvoicedUSD * effectiveExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800 font-bold">
                <span className="text-slate-400">Balance Due:</span>
                <span className={`font-mono ${supplierBalanceUSD > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ${supplierBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {/* Payment History List */}
            {supplierPayments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recorded Swift Remittances:
                </span>
                {supplierPayments.map((pmt) => (
                  <div key={pmt.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-emerald-400">
                        ${pmt.amountUSD.toLocaleString()} USD ({pmt.paymentDate})
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {pmt.swiftMt103Ref}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => exportSupplierUSDSwiftVoucherPDF(shipment, pmt, brandSettings)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Download Swift Remittance Advice PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportSupplierUSDSwiftVoucherCSV(shipment, pmt)}
                        className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-800/60 transition-colors cursor-pointer"
                        title="Export Swift Remittance Advice CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setSupplierForm(prev => ({
                ...prev,
                amountUSD: supplierBalanceUSD > 0 ? supplierBalanceUSD : totalInvoicedUSD
              }));
              setIsSupplierModalOpen(true);
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pay Supplier in USD (Swift MT103)</span>
          </button>
        </div>

        {/* CARD 2: KRA CUSTOMS DUTIES & TAXES PAYMENT IN KES */}
        <div className="bg-slate-800/70 border border-slate-700/80 hover:border-rose-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Receipt className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">2. KRA Customs Taxes &amp; Duties</h4>
                  <span className="text-[10px] text-rose-400/90 font-mono font-bold">Currency: KES &bull; Simba / ICMS E-Slip</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                isKraFullyPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {isKraFullyPaid ? 'Cleared with KRA' : 'Awaiting Tax Disbursal'}
              </span>
            </div>

            {/* Tax Heads Breakdown */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>KRA Customs SAD Entry:</span>
                <span className="font-mono font-bold text-slate-200">{shipment.customsEntryNo}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>KRA E-Slip PRN:</span>
                <span className="font-mono font-bold text-rose-400">{shipment.kraEslipRef}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Total KRA Assessment:</span>
                <span className="font-mono font-black text-rose-400 text-sm">
                  KSh {totalCustomsTaxesKES.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[10.5px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <span>Duty (1002): KSh {Math.round(duty1002KES).toLocaleString()}</span>
                <span>VAT (1202): KSh {Math.round(vat1202KES).toLocaleString()}</span>
                <span>IDF (1801): KSh {Math.round(idf1801KES).toLocaleString()}</span>
                <span>RDL (6001): KSh {Math.round(rdl6001KES).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800 font-bold">
                <span className="text-slate-400">Tax Balance Due:</span>
                <span className={`font-mono ${kraBalanceKES > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  KSh {kraBalanceKES.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment History List */}
            {kraPayments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Executed KRA Settlements:
                </span>
                {kraPayments.map((pmt) => (
                  <div key={pmt.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-emerald-400">
                        KSh {pmt.amountKES.toLocaleString()} ({pmt.paymentDate})
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PRN: {pmt.kraEslipNumber} &bull; {pmt.bankTransactionRef}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => exportKRATaxPaymentVoucherPDF(shipment, pmt, brandSettings)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Download KRA Tax Receipt Voucher PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportKRATaxPaymentVoucherCSV(shipment, pmt)}
                        className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-800/60 transition-colors cursor-pointer"
                        title="Export KRA Tax Assessment & Payment CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setKraForm(prev => ({
                ...prev,
                amountKES: kraBalanceKES > 0 ? kraBalanceKES : totalCustomsTaxesKES
              }));
              setIsKRAModalOpen(true);
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pay KRA Taxes in KES (E-Slip Portal)</span>
          </button>
        </div>

        {/* CARD 3: CLEARING & FORWARDING LOGISTICS PAYMENT IN KES */}
        <div className="bg-slate-800/70 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Truck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">3. Clearing &amp; Forwarding Agent</h4>
                  <span className="text-[10px] text-blue-400/90 font-mono font-bold">Currency: KES &bull; Port CFS &amp; SGR Trucking</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                isClearingFullyPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {isClearingFullyPaid ? 'Logistics Settled' : 'Pending Clearing Disbursal'}
              </span>
            </div>

            {/* Logistics Cost Breakdown */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Declarant Agent:</span>
                <span className="font-bold text-slate-200 truncate max-w-[170px]" title={shipment.declarantName}>
                  {shipment.declarantName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Agent KRA PIN:</span>
                <span className="font-mono font-bold text-blue-400">{shipment.declarantPin}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Total Estimated Logistics:</span>
                <span className="font-mono font-black text-blue-400 text-sm">
                  KSh {estimatedClearingKES.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[10.5px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <span>Port CFS: KSh 65,000</span>
                <span>Agency Fee: KSh 35,000</span>
                <span>Demurrage: KSh 25,000</span>
                <span>SGR Inland: KSh {Math.max(0, estimatedClearingKES - 125000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800 font-bold">
                <span className="text-slate-400">Clearing Balance Due:</span>
                <span className={`font-mono ${clearingBalanceKES > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                  KSh {clearingBalanceKES.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment History List */}
            {clearingPayments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recorded Clearing Disbursements:
                </span>
                {clearingPayments.map((pmt) => (
                  <div key={pmt.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-emerald-400">
                        KSh {pmt.amountKES.toLocaleString()} ({pmt.paymentDate})
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Inv: {pmt.agentInvoiceRef} &bull; {pmt.paymentMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => exportClearingLogisticsVoucherPDF(shipment, pmt, brandSettings)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Download Clearing Disbursement Voucher PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportClearingLogisticsVoucherCSV(shipment, pmt)}
                        className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-800/60 transition-colors cursor-pointer"
                        title="Export Clearing Disbursement CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setClearingForm(prev => ({
                ...prev,
                amountKES: clearingBalanceKES > 0 ? clearingBalanceKES : estimatedClearingKES
              }));
              setIsClearingModalOpen(true);
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Pay Clearing &amp; Forwarding in KES</span>
          </button>
        </div>

      </div>

      {/* MODAL 1: PAY OVERSEAS SUPPLIER IN USD */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                  <DollarSign className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Execute Foreign Currency (USD) Swift Remittance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Overseas Supplier Settlement &bull; Commercial Invoice Ref: <span className="font-mono text-amber-700 font-bold">{shipment.invoiceNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Amount to Remit (USD $):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierForm.amountUSD}
                    onChange={e => setSupplierForm({ ...supplierForm, amountUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Bank Actual FX Spot Rate (KES/USD):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierForm.exchangeRateActual}
                    onChange={e => setSupplierForm({ ...supplierForm, exchangeRateActual: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    KES Debit Equivalent: <strong className="text-amber-700 font-mono">KSh {(supplierForm.amountUSD * supplierForm.exchangeRateActual).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Debit Source Bank / Nostro Account:
                  </label>
                  <select
                    value={supplierForm.sourceAccount}
                    onChange={e => {
                      const labels: Record<string, string> = {
                        USD_NOSTRO_STANBIC: 'Stanbic Bank Kenya - USD Forex Nostro A/C (0100299102)',
                        USD_NOSTRO_IM: 'I&M Bank Kenya - USD Corporate Forex A/C (200192881)',
                        USD_NOSTRO_EQUITY: 'Equity Bank Kenya - USD Treasury Nostro (018829910)',
                        KES_SPOT_FOREX_BUY: 'Commercial Bank KES Spot Purchase @ Market Rate'
                      };
                      setSupplierForm({
                        ...supplierForm,
                        sourceAccount: e.target.value,
                        sourceAccountLabel: labels[e.target.value] || e.target.value
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="USD_NOSTRO_STANBIC">Stanbic Bank Kenya - USD Nostro A/C</option>
                    <option value="USD_NOSTRO_IM">I&M Bank Kenya - USD Corporate A/C</option>
                    <option value="USD_NOSTRO_EQUITY">Equity Bank Kenya - USD Treasury</option>
                    <option value="KES_SPOT_FOREX_BUY">KES Spot FX Purchase @ Bank Selling Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Swift MT103 / TT Reference No:
                  </label>
                  <input
                    type="text"
                    value={supplierForm.swiftMt103Ref}
                    onChange={e => setSupplierForm({ ...supplierForm, swiftMt103Ref: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Beneficiary Name:
                  </label>
                  <input
                    type="text"
                    value={supplierForm.beneficiaryName}
                    onChange={e => setSupplierForm({ ...supplierForm, beneficiaryName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Beneficiary Bank &amp; IBAN / Account:
                  </label>
                  <input
                    type="text"
                    value={supplierForm.beneficiaryIbanOrAccount}
                    onChange={e => setSupplierForm({ ...supplierForm, beneficiaryIbanOrAccount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Value / Payment Date:
                  </label>
                  <input
                    type="date"
                    value={supplierForm.paymentDate}
                    onChange={e => setSupplierForm({ ...supplierForm, paymentDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Bank Charges ($ USD):
                  </label>
                  <input
                    type="number"
                    value={supplierForm.bankChargesUSD}
                    onChange={e => setSupplierForm({ ...supplierForm, bankChargesUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Charges Borne By:
                  </label>
                  <select
                    value={supplierForm.chargeBorneBy}
                    onChange={e => setSupplierForm({ ...supplierForm, chargeBorneBy: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="OUR">OUR (Importer pays all)</option>
                    <option value="BEN">BEN (Supplier pays)</option>
                    <option value="SHA">SHA (Shared charges)</option>
                  </select>
                </div>
              </div>

              {/* Live Double Entry Ledger Preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 font-mono text-[11px]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Double-Entry Ledger Posting Impact:
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>Dr: 2010 - Accounts Payable (Overseas Suppliers)</span>
                  <span className="text-emerald-600 font-bold">
                    +KSh {(supplierForm.amountUSD * supplierForm.exchangeRateActual).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Cr: 1020 - USD Forex Nostro Bank / Forex Spot</span>
                  <span className="text-amber-700 font-bold">
                    (KSh {(supplierForm.amountUSD * supplierForm.exchangeRateActual).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSupplierPayment}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Commit Swift Disbursal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAY KRA TAXES IN KES */}
      {isKRAModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                  <Receipt className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Execute KRA Customs Duties &amp; Taxes Settlement (KES)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simba / ICMS E-Slip Clearance &bull; Customs SAD: <span className="font-mono text-rose-400 font-bold">{kraForm.customsEntryNo}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKRAModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Total KRA E-Slip Amount (KES):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={kraForm.amountKES}
                    onChange={e => setKraForm({ ...kraForm, amountKES: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    KRA E-Slip PRN / Payment Ref:
                  </label>
                  <input
                    type="text"
                    value={kraForm.kraEslipNumber}
                    onChange={e => setKraForm({ ...kraForm, kraEslipNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Bank Tax Payment Gateway:
                  </label>
                  <select
                    value={kraForm.bankPaymentPortal}
                    onChange={e => {
                      const labels: Record<string, string> = {
                        KCB_ITAX: 'KCB Bank Kenya - iTax & Customs E-Slip Portal',
                        EQUITY_ESLIP: 'Equity Bank Kenya - E-Slip Direct Settlement',
                        NCBA_DIRECT: 'NCBA Bank - KRA Direct Debit Gateway',
                        COOP_ITAX: 'Co-operative Bank - Customs Tax Collection',
                        CBK_GTAX: 'Central Bank of Kenya (CBK) G-Tax System'
                      };
                      setKraForm({
                        ...kraForm,
                        bankPaymentPortal: e.target.value,
                        bankPaymentPortalLabel: labels[e.target.value] || e.target.value
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="KCB_ITAX">KCB Bank - iTax &amp; Customs E-Slip</option>
                    <option value="EQUITY_ESLIP">Equity Bank - E-Slip Direct Gateway</option>
                    <option value="NCBA_DIRECT">NCBA Bank - KRA Direct Debit</option>
                    <option value="COOP_ITAX">Co-op Bank - Customs Tax Collection</option>
                    <option value="CBK_GTAX">CBK G-Tax Government Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Bank Transaction Ref / FT Code:
                  </label>
                  <input
                    type="text"
                    value={kraForm.bankTransactionRef}
                    onChange={e => setKraForm({ ...kraForm, bankTransactionRef: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tax Heads Allocation Grid */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10.5px] font-bold text-slate-300 block">
                  Tax Head Allocation Breakdown (KES):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1002 Duty:</span>
                    <span className="font-bold text-white">KSh {kraForm.duty1002KES.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1202 VAT (Claimable):</span>
                    <span className="font-bold text-rose-400">KSh {kraForm.vat1202KES.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1801 IDF (2.5%):</span>
                    <span className="font-bold text-white">KSh {kraForm.idf1801KES.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">6001 RDL (2.0%):</span>
                    <span className="font-bold text-white">KSh {kraForm.rdl6001KES.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">6401 MSS:</span>
                    <span className="font-bold text-white">KSh {kraForm.mss6401KES.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Payment Date:</span>
                    <input
                      type="date"
                      value={kraForm.paymentDate}
                      onChange={e => setKraForm({ ...kraForm, paymentDate: e.target.value })}
                      className="bg-transparent text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live Double Entry Ledger Preview */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
                  Double-Entry Ledger Posting Impact:
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Dr: 2120 - KRA Customs Duties &amp; Taxes Payable</span>
                  <span className="text-emerald-400 font-bold">
                    +KSh {Number(kraForm.amountKES).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cr: 1002 - Commercial Bank (KES Operational Account)</span>
                  <span className="text-rose-400 font-bold">
                    (KSh {Number(kraForm.amountKES).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsKRAModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmKRAPayment}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Settle KRA E-Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAY CLEARING & FORWARDING IN KES */}
      {isClearingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Truck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Execute Clearing &amp; Forwarding Agent Disbursal (KES)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Port CFS, Demurrage &amp; Inland Logistics &bull; Declarant: <span className="font-bold text-blue-400">{clearingForm.declarantName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClearingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Total Disbursal Amount (KES):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={clearingForm.amountKES}
                    onChange={e => setClearingForm({ ...clearingForm, amountKES: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Agent Proforma / Invoice Ref:
                  </label>
                  <input
                    type="text"
                    value={clearingForm.agentInvoiceRef}
                    onChange={e => setClearingForm({ ...clearingForm, agentInvoiceRef: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Payment Method:
                  </label>
                  <select
                    value={clearingForm.paymentMethod}
                    onChange={e => setClearingForm({ ...clearingForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="RTGS">RTGS Real-Time Transfer</option>
                    <option value="EFT">Electronic Funds Transfer (EFT)</option>
                    <option value="Corporate M-Pesa">Corporate M-Pesa / Paybill</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Payment Ref / Cheque No:
                  </label>
                  <input
                    type="text"
                    value={clearingForm.paymentRefNo}
                    onChange={e => setClearingForm({ ...clearingForm, paymentRefNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Payment Date:
                  </label>
                  <input
                    type="date"
                    value={clearingForm.paymentDate}
                    onChange={e => setClearingForm({ ...clearingForm, paymentDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Itemized Logistics Breakdown */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10.5px] font-bold text-slate-300 block">
                  Logistics Cost Components Breakdown (KES):
                </span>
                <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-0.5">Declarant Agency Fee:</label>
                    <input
                      type="number"
                      value={clearingForm.declarantAgencyFeeKES}
                      onChange={e => setClearingForm({ ...clearingForm, declarantAgencyFeeKES: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-0.5">KPA Port CFS Wharfage:</label>
                    <input
                      type="number"
                      value={clearingForm.cfsPortWharfageKES}
                      onChange={e => setClearingForm({ ...clearingForm, cfsPortWharfageKES: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-0.5">Demurrage &amp; DO Release:</label>
                    <input
                      type="number"
                      value={clearingForm.shippingLineDemurrageKES}
                      onChange={e => setClearingForm({ ...clearingForm, shippingLineDemurrageKES: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-0.5">Inland SGR / Trucking:</label>
                    <input
                      type="number"
                      value={clearingForm.inlandTransportSgrKES}
                      onChange={e => setClearingForm({ ...clearingForm, inlandTransportSgrKES: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Double Entry Ledger Preview */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
                  Double-Entry Ledger Posting Impact:
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Dr: 2020 - Transporter &amp; Clearing Agent Payable</span>
                  <span className="text-emerald-400 font-bold">
                    +KSh {Number(clearingForm.amountKES).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cr: 1002 - Commercial Bank (KES Operational Account)</span>
                  <span className="text-blue-400 font-bold">
                    (KSh {Number(clearingForm.amountKES).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsClearingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearingPayment}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Disburse Clearing Agent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
