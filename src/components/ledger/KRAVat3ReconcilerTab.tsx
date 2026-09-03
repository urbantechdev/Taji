import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileSpreadsheet,
  FileDown,
  Receipt,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { generateKRAVat3FilingPackPDF } from '../../utils/documentExport';

export const KRAVat3ReconcilerTab: React.FC = () => {
  const {
    orders,
    branchExpenses,
    etrConfig,
    currentUser
  } = useERP();

  const [selectedPeriod, setSelectedPeriod] = useState<'current_month' | 'last_month' | 'q1_2026'>('current_month');
  const [whvatCredit, setWhvatCredit] = useState<number>(48500); // 2% Withholding VAT certificates

  // Aggregate Sales & Output VAT (Section D)
  const salesOutput = useMemo(() => {
    const totalSalesGross = (orders || []).reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const totalSalesExclVat = totalSalesGross > 0 ? totalSalesGross / 1.16 : 3850000;
    const outputVat16 = totalSalesGross > 0 ? totalSalesGross - totalSalesExclVat : 616000;
    return {
      grossSales: totalSalesGross > 0 ? totalSalesGross : 4466000,
      netSalesExclVat: totalSalesExclVat,
      outputVat16
    };
  }, [orders]);

  // Aggregate Local Purchases & Input VAT (Section C)
  const localPurchases = useMemo(() => {
    // Registered supplier purchases
    const baseExclVat = (branchExpenses || []).length > 0 
      ? branchExpenses.reduce((s, e) => s + (e.amount || 0), 0)
      : 890000;
    const inputVat16 = baseExclVat * 0.16;
    return {
      purchasesExclVat: baseExclVat,
      inputVat16
    };
  }, [branchExpenses]);

  // Aggregate Customs Import VAT (Section B - Head 1202)
  const customsImports = useMemo(() => {
    // Container 26PA222 (Zhejiang Puan) + Udey Udyog Container
    const customsValueKES = 7409072 + 5382624;
    const importVat1202 = 1438991 + 1045431; // 16% on taxable import bases
    return {
      customsValueKES,
      importVat1202
    };
  }, []);

  // Net VAT Calculation
  const totalInputDeductions = localPurchases.inputVat16 + customsImports.importVat1202 + whvatCredit;
  const netVatPayable = salesOutput.outputVat16 - totalInputDeductions;
  const isCreditCarriedForward = netVatPayable < 0;

  // 1-Click iTax CSV Export (Section B, C, D)
  const handleExportITaxCSV = () => {
    const csvContent = [
      ['KRA iTAX VAT-3 RETURN RECONCILIATION FILE', '', '', '', ''],
      ['Taxpayer PIN', etrConfig?.taxPin || 'P051234567Z', 'Tax Period', 'FEB-2026', ''],
      ['Taxpayer Name', etrConfig?.companyName || 'TAJI TEXTILE ENTERPRISES LTD', '', '', ''],
      ['', '', '', '', ''],
      ['SECTION D - OUTPUT TAX ON SALES', '', '', '', ''],
      ['Sale Description', 'Gross Sales (KES)', 'Net Sales Excl VAT', 'Rate', 'Output VAT (KES)'],
      ['POS & Wholesale Store Sales (eTIMS)', salesOutput.grossSales.toFixed(2), salesOutput.netSalesExclVat.toFixed(2), '16%', salesOutput.outputVat16.toFixed(2)],
      ['', '', '', '', ''],
      ['SECTION C - LOCAL PURCHASES INPUT TAX', '', '', '', ''],
      ['Supplier PIN', 'Supplier Name', 'Invoice Ref', 'Taxable Amount (KES)', 'Input VAT 16% (KES)'],
      ['P051892341M', 'Kenya Weaving Mills Ltd', 'eTIMS-KWM-9901', '500,000.00', '80,000.00'],
      ['P051992019K', 'Mombasa Industrial Dyes Ltd', 'eTIMS-MID-1102', '390,000.00', '62,400.00'],
      ['', '', '', '', ''],
      ['SECTION B - IMPORT TAX CLAIMS (HEAD 1202)', '', '', '', ''],
      ['Customs Entry (SAD)', 'KRA E-Slip Ref', 'Supplier / Country', 'Customs Value (KES)', '1202 Import VAT Claimed (KES)'],
      ['26EMKIM400826138', '1020260001007429', 'Zhejiang Puan Textile (China)', '7,409,072.00', '1,438,991.00'],
      ['26EMKIM400955090', '1020260001008892', 'Udey Udyog / Oster (India)', '5,382,624.00', '1,045,431.00'],
      ['', '', '', '', ''],
      ['SUMMARY RECONCILIATION', '', '', '', ''],
      ['Gross Output Tax', salesOutput.outputVat16.toFixed(2), '', '', ''],
      ['Less: Local Input Tax (Sec C)', `-${localPurchases.inputVat16.toFixed(2)}`, '', '', ''],
      ['Less: Customs Import VAT 1202 (Sec B)', `-${customsImports.importVat1202.toFixed(2)}`, '', '', ''],
      ['Less: Withholding VAT 2% Credits', `-${whvatCredit.toFixed(2)}`, '', '', ''],
      [isCreditCarriedForward ? 'NET TAX CREDIT (CARRIED FORWARD)' : 'NET KRA VAT-3 PAYABLE', Math.abs(netVatPayable).toFixed(2), '', '', '']
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KRA_iTax_VAT3_Upload_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportPDFPack = () => {
    generateKRAVat3FilingPackPDF({
      taxPeriod: selectedPeriod === 'current_month' ? 'February 2026' : 'January 2026',
      companyPin: etrConfig?.taxPin || 'P051234567Z',
      companyName: etrConfig?.companyName || 'TAJI TEXTILE ENTERPRISES LTD',
      grossSalesExclVat: salesOutput.netSalesExclVat,
      outputVat16: salesOutput.outputVat16,
      localPurchasesExclVat: localPurchases.purchasesExclVat,
      localInputVat16: localPurchases.inputVat16,
      importCustomsValueExclVat: customsImports.customsValueKES,
      importVat1202Claimable: customsImports.importVat1202,
      withholdingVat2Percent: whvatCredit,
      netVatPayable,
      isCreditCarriedForward,
      sections: {
        sectionB_Imports: [
          {
            entryNo: '26EMKIM400826138',
            eslip: '1020260001007429',
            supplier: 'Zhejiang Puan Textile (China)',
            taxableValue: 7409072,
            vatAmount: 1438991
          },
          {
            entryNo: '26EMKIM400955090',
            eslip: '1020260001008892',
            supplier: 'Udey Udyog / Oster (India)',
            taxableValue: 5382624,
            vatAmount: 1045431
          }
        ],
        sectionC_Purchases: [
          {
            supplierName: 'Kenya Weaving Mills Ltd',
            supplierPin: 'P051892341M',
            invoiceNo: 'eTIMS-KWM-9901',
            taxableValue: 500000,
            vatAmount: 80000
          },
          {
            supplierName: 'Mombasa Industrial Dyes Ltd',
            supplierPin: 'P051992019K',
            invoiceNo: 'eTIMS-MID-1102',
            taxableValue: 390000,
            vatAmount: 62400
          }
        ],
        sectionD_Sales: [
          {
            branch: 'Main Warehouse & Showroom',
            taxableSales: salesOutput.netSalesExclVat,
            vatAmount: salesOutput.outputVat16
          }
        ]
      },
      generatedBy: currentUser?.name || 'Chief Tax Accountant'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b2230] to-slate-950 p-5 rounded-2xl border border-slate-700 shadow-md text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  KRA Unified VAT-3 Net Return &amp; iTax Filing Pack
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Section 23A Deductions Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically offsets Output VAT against direct container import VAT (Head 1202), registered local supplier eTIMS invoices, and 2% WHVAT certificates.
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportITaxCSV}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Download iTax-formatted CSV reconciliation file"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportPDFPack}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Download Complete KRA VAT-3 Return Pack PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Net Position Mathematical Formula Hero Card */}
      <div className={`p-5 rounded-3xl border shadow-md space-y-4 ${
        isCreditCarriedForward
          ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-800/80'
          : 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 text-white border-rose-800/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isCreditCarriedForward ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
            <span className="font-bold text-xs tracking-wider uppercase opacity-90">
              {isCreditCarriedForward ? 'Net KRA VAT Position: Tax Credit Carried Forward' : 'Net KRA VAT Position: VAT-3 Payment Due by 20th'}
            </span>
          </div>
          <span className="text-[11px] font-mono opacity-80">
            Filing Deadline: 20th of the Following Month
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <span className="text-xs opacity-75 font-medium block">
              {isCreditCarriedForward ? 'Total Input Tax Credit (Deductible against future sales):' : 'Total Net VAT Payable to KRA:'}
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
              KSh {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Mathematical Step Breakdown */}
          <div className="bg-black/30 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-[11px] space-y-1 font-mono">
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">(+) Section D Output VAT Charged:</span>
              <span className="font-bold text-white">KSh {salesOutput.outputVat16.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">(-) Section C Local Input VAT:</span>
              <span className="font-bold text-emerald-400">-KSh {localPurchases.inputVat16.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">(-) Section B Customs 1202 Import VAT:</span>
              <span className="font-bold text-emerald-400">-KSh {customsImports.importVat1202.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">(-) Withholding VAT 2% Credit:</span>
              <span className="font-bold text-emerald-400">-KSh {whvatCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main VAT Return Sections Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Section D: Sales Output VAT */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs">Section D: Sales Output VAT</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">16% Tax Rate</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px]">Gross Sales (Incl VAT)</span>
            <p className="font-mono text-base font-bold text-slate-900">
              KSh {salesOutput.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-0.5">
            <span className="text-[10px] font-bold text-blue-900">Output VAT Collected:</span>
            <p className="font-mono font-black text-blue-700 text-sm">
              KSh {salesOutput.outputVat16.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Section C: Local Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs">Section C: Local Purchases</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">eTIMS Claim</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px]">Taxable Local Base</span>
            <p className="font-mono text-base font-bold text-slate-900">
              KSh {localPurchases.purchasesExclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-900">Deductible Input VAT:</span>
            <p className="font-mono font-black text-emerald-700 text-sm">
              KSh {localPurchases.inputVat16.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Section B: Customs Import VAT */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs">Section B: Customs 1202 Imports</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">ICMS SAD</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px]">Taxable Customs Import Base</span>
            <p className="font-mono text-base font-bold text-slate-900">
              KSh {customsImports.customsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-900">1202 Customs VAT Offset:</span>
            <p className="font-mono font-black text-rose-700 text-sm">
              KSh {customsImports.importVat1202.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
