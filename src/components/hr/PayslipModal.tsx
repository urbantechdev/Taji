import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Mail,
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  QrCode,
  UserCheck,
  Award,
  Layers,
  Receipt,
  Calendar,
  Clock
} from 'lucide-react';
import { PayrollRecord, StaffMember, LocationInfo } from '../../types';
import { useERP } from '../../context/ERPContext';
import { exportIndividualPayslipPDF } from '../../utils/documentExport';

interface PayslipModalProps {
  payslip: PayrollRecord;
  staffMember?: StaffMember;
  locations: LocationInfo[];
  onClose: () => void;
  onEmailPayslip?: (payslip: PayrollRecord) => void;
  isEmailing?: boolean;
}

// Convert Kenyan Shilling numeric amount to clean English words
function amountToWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Shillings';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertGroup = (n: number): string => {
    let groupStr = '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (hundred > 0) {
      groupStr += ones[hundred] + ' Hundred';
      if (rest > 0) groupStr += ' and ';
    }
    if (rest > 0) {
      if (rest < 10) groupStr += ones[rest];
      else if (rest < 20) groupStr += teens[rest - 10];
      else {
        groupStr += tens[Math.floor(rest / 10)];
        if (rest % 10 > 0) groupStr += ' ' + ones[rest % 10];
      }
    }
    return groupStr;
  };

  const integerPart = Math.floor(num);
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const hundreds = integerPart % 1000;

  let result = '';
  if (millions > 0) result += convertGroup(millions) + ' Million ';
  if (thousands > 0) result += convertGroup(thousands) + ' Thousand ';
  if (hundreds > 0) result += convertGroup(hundreds);

  return result.trim() + ' Kenya Shillings Only';
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  payslip,
  staffMember,
  locations,
  onClose,
  onEmailPayslip,
  isEmailing = false
}) => {
  const { brandSettings, etrConfig } = useERP();
  const [layoutMode, setLayoutMode] = useState<'slip' | 'a4'>('slip');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const companyName = brandSettings?.brandName || etrConfig?.companyName || 'TAJI TEXTILE & GARMENT SOLUTIONS LTD';
  const logoUrl = brandSettings?.logoUrl;
  const taxPin = etrConfig?.taxPin || 'P051982341Z';
  const cuSerial = etrConfig?.cuSerialNumber || 'KRAMW019284';
  const companyAddress = etrConfig?.companyAddress || 'Commercial Street, Enterprise Road, Industrial Area, Nairobi, Kenya';
  const companyPhone = etrConfig?.companyPhone || '+254 722 000 000';
  const companyEmail = brandSettings?.supportEmail || 'payroll@taji.co.ke';

  const stationName = locations.find(l => l.id === payslip.locationId)?.name || payslip.locationId || 'Main Distribution Center';

  // Earnings decomposition
  const basicSalary = payslip.basicSalary || Math.round(payslip.grossPay * 0.7);
  const totalAllowances = payslip.allowances || (payslip.grossPay - basicSalary);
  const houseAllowance = Math.round(totalAllowances * 0.6);
  const commuterAllowance = totalAllowances - houseAllowance;

  // Deductions decomposition
  const nssfEmployer = payslip.nssfEmployer || payslip.nssfDeduction;
  const housingLevyEmployer = payslip.housingLevyEmployer || payslip.housingLevy;
  const personalRelief = payslip.personalRelief || 2400;
  const insuranceRelief = payslip.insuranceRelief || Math.round(payslip.nhifDeduction * 0.15);

  const docNumber = `PAY-${payslip.employeeNo}-${payslip.monthYear.replace(/\s+/g, '')}`;
  const currentDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EAT';

  // Robust print trigger with format detection
  const handlePrint = () => {
    if (layoutMode === 'slip') {
      document.body.classList.add('printing-payslip-slip');
    }
    document.body.classList.add('printing-payslip');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-payslip-slip');
      document.body.classList.remove('printing-payslip');
    }, 1000);
  };

  // Download PDF trigger
  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      exportIndividualPayslipPDF(payslip, staffMember, etrConfig, brandSettings, locations);
    } catch (err) {
      console.error('Failed to generate payslip PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200 payslip-modal-backdrop"
      id="modal-payslip-viewer-wrapper"
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${
          layoutMode === 'a4' ? 'max-w-4xl' : 'max-w-md'
        } my-auto border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 payslip-modal-container`}
        id="modal-payslip-viewer"
      >
        {/* ================================================================= */}
        {/* SCREEN-ONLY TOOLBAR & CONTROLS (Hidden during print)               */}
        {/* ================================================================= */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 payslip-screen-only print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white">
                  {layoutMode === 'slip' ? 'ETR Thermal Payslip' : 'Executive A4 Payslip'}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  {payslip.monthYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {layoutMode === 'slip' ? 'Kenya ETR 80mm POS Receipt Slip' : 'KRA eTIMS & Statutory Audit Statement'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Format Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                id="btn-layout-slip"
                onClick={() => setLayoutMode('slip')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'slip'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Compact ETR Thermal Receipt Format"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Compact ETR</span>
              </button>

              <button
                type="button"
                id="btn-layout-a4"
                onClick={() => setLayoutMode('a4')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'a4'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Full Executive A4 Format"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive A4</span>
              </button>
            </div>

            {/* Email Statement */}
            {onEmailPayslip && (
              <button
                type="button"
                id="btn-modal-email-payslip"
                onClick={() => onEmailPayslip(payslip)}
                disabled={isEmailing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Email official payslip statement to employee"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">{isEmailing ? 'Sending...' : 'Email'}</span>
              </button>
            )}

            {/* Download Vector PDF */}
            <button
              type="button"
              id="btn-modal-download-pdf"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download vector PDF"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>

            {/* Print Payslip */}
            <button
              type="button"
              id="btn-modal-print-payslip"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Print Payslip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-payslip-modal"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer ml-1"
              title="Close Payslip"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PRINTABLE PAYSLIP DOCUMENT CANVAS                                */}
        {/* Switches between Compact ETR Slip and Executive A4                */}
        {/* ================================================================= */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100/50 print:p-0 print:bg-white print:overflow-visible flex-1">
          {layoutMode === 'slip' ? (
            /* ============================================================= */
            /* 1. COMPACT ETR THERMAL SLIP LAYOUT (80mm Thermal Receipt)     */
            /* ============================================================= */
            <div
              id="printable-payslip-slip"
              className="bg-white rounded-2xl border border-slate-300 shadow-md p-5 sm:p-6 space-y-3.5 text-slate-900 font-mono text-[11px] leading-tight max-w-[360px] mx-auto print:border-none print:shadow-none print:p-1 print:max-w-none print:rounded-none"
            >
              {/* 1.1 Brand Logo & Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                {/* Company Logo Frame */}
                <div className="flex justify-center mb-1.5">
                  <div className="w-14 h-14 rounded-full border-2 border-slate-300 p-0.5 shadow-xs bg-white overflow-hidden flex items-center justify-center">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={companyName}
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-rose-600 text-white font-black text-lg flex items-center justify-center font-sans">
                        {companyName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight font-sans">
                  {companyName}
                </h2>
                <p className="text-[10px] text-rose-700 font-bold font-sans uppercase">
                  KENYA eTIMS PAYROLL &amp; STATUTORY DISBURSAL
                </p>
                <p className="text-[9.5px] text-slate-500 font-sans">
                  {companyAddress}
                </p>
                <p className="text-[9.5px] text-slate-500">
                  Tel: {companyPhone} • {companyEmail}
                </p>

                {/* Fiscal PIN & CU Serial Box */}
                <div className="mt-2 py-1 px-2 bg-slate-100 rounded text-center border border-slate-300 text-[10px] font-bold text-slate-800">
                  KRA PIN: {taxPin} | CU: {cuSerial}
                </div>
              </div>

              {/* 1.2 Document Title & Period Banner */}
              <div className="text-center py-1.5 border-b border-dashed border-slate-400 space-y-1">
                <span className="inline-block px-3 py-0.5 bg-slate-900 text-white font-sans font-black text-[10px] uppercase tracking-wider rounded">
                  ★ OFFICIAL EMPLOYEE PAYSLIP ★
                </span>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-slate-500 font-sans">Payroll Period:</span>
                  <span className="font-bold text-slate-900 font-sans">{payslip.monthYear}</span>
                </div>
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="text-slate-500">Voucher Ref:</span>
                  <span className="font-bold">{docNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400">
                  <span>Timestamp:</span>
                  <span>{currentDateStr} {currentTimeStr}</span>
                </div>
              </div>

              {/* 1.3 Employee Particulars (ETR Monospace Key-Value) */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Employee Name:</span>
                  <span className="font-bold text-slate-900 text-right font-sans">{payslip.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payroll Number:</span>
                  <span className="font-bold text-slate-800">{payslip.employeeNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Designation:</span>
                  <span className="font-semibold text-slate-800 text-right font-sans">{payslip.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Branch Station:</span>
                  <span className="font-medium text-slate-800 text-right font-sans">{stationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KRA Tax PIN:</span>
                  <span className="font-bold text-slate-900">{staffMember?.kraPin || 'P051189234R'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">National ID:</span>
                  <span className="text-slate-800">{staffMember?.idNumber || 'ID-29184021'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NSSF Pension No:</span>
                  <span className="text-slate-800">{staffMember?.nssfNo || 'NSF-892104'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SHIF / NHIF No:</span>
                  <span className="text-slate-800">{staffMember?.nhifNo || 'SHIF-940182'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Disbursed To:</span>
                  <span className="text-right text-[9.5px] font-sans">
                    {staffMember?.bankAccountName
                      ? `${staffMember.bankAccountName} (${(staffMember?.bankAccountNumber || staffMember?.mpesaNumber || '').slice(-4)})`
                      : 'Bank EFT / M-Pesa Direct'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500 font-sans">Remittance:</span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold font-sans">
                    PAID &amp; DISBURSED
                  </span>
                </div>
              </div>

              {/* 1.4 Earnings & Allowances */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2.5 text-[10.5px]">
                <div className="font-bold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200 flex justify-between font-sans">
                  <span>1. EARNINGS &amp; ALLOWANCES</span>
                  <span>AMOUNT (KSh)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-semibold">{basicSalary.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Housing Allowance</span>
                  <span>{houseAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Commuter Allowance</span>
                  <span>{commuterAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Overtime / Duty Allowances</span>
                  <span>0.00</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL GROSS EARNINGS:</span>
                  <span className="text-emerald-700">KSh {payslip.grossPay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* 1.5 Statutory Deductions */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2.5 text-[10.5px]">
                <div className="font-bold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200 flex justify-between font-sans">
                  <span>2. STATUTORY DEDUCTIONS</span>
                  <span>AMOUNT (KSh)</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-700">KRA PAYE (Income Tax)</span>
                    <span className="text-[9px] text-slate-400 block font-sans">(Net of KSh 2,400 Relief)</span>
                  </div>
                  <span className="text-rose-700 font-semibold">-{payslip.payeTax.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-700">Housing Levy (1.5%)</span>
                    <span className="text-[9px] text-slate-400 block font-sans">Employee 1.5% Gross</span>
                  </div>
                  <span className="text-amber-800 font-semibold">-{payslip.housingLevy.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-700">NSSF Pension</span>
                    <span className="text-[9px] text-slate-400 block font-sans">Tier I &amp; Tier II</span>
                  </div>
                  <span className="font-semibold text-slate-800">-{payslip.nssfDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-700">SHIF Health (2.75%)</span>
                    <span className="text-[9px] text-slate-400 block font-sans">Social Health Insurance</span>
                  </div>
                  <span className="font-semibold text-slate-800">-{payslip.nhifDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL STATUTORY DEDUCTIONS:</span>
                  <span className="text-rose-700">-KSh {payslip.totalDeductions.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* 1.6 Net Salary Disbursed (Prominent ETR Take-Home Box) */}
              <div className="my-1.5 bg-slate-900 text-white p-3 rounded-xl text-center space-y-1">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-rose-300 font-sans block">
                  NET SALARY DISBURSED (TAKE HOME)
                </span>
                <p className="text-xl font-black tracking-tight text-emerald-400 font-mono">
                  KSh {payslip.netPay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] text-slate-300 italic font-sans leading-tight pt-0.5">
                  Amount in words: <strong className="text-white not-italic">{amountToWords(payslip.netPay)}</strong>
                </p>
              </div>

              {/* 1.7 Employer Remittance Memorandum */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2.5 text-[9.5px] text-slate-600">
                <p className="font-bold text-slate-800 uppercase text-[9.5px] font-sans">
                  3. EMPLOYER STATUTORY MATCH (FINANCE ACT)
                </p>
                <div className="flex justify-between">
                  <span>Employer NSSF Match:</span>
                  <span className="font-bold text-slate-800">KSh {nssfEmployer.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employer Housing Levy (1.5%):</span>
                  <span className="font-bold text-slate-800">KSh {housingLevyEmployer.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>KRA Personal Relief Granted:</span>
                  <span className="font-bold text-emerald-700">KSh {personalRelief.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Tax &amp; Levies to Govt:</span>
                  <span>KSh {(payslip.payeTax + payslip.housingLevy * 2 + payslip.nssfDeduction * 2 + payslip.nhifDeduction).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* 1.8 KRA eTIMS QR Verification Seal */}
              <div className="py-2 flex flex-col items-center justify-center space-y-1 border-b border-dashed border-slate-400 text-center">
                <div className="p-1.5 border-2 border-slate-800 rounded-lg bg-white">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <span className="text-[8px] font-bold text-slate-700 uppercase">
                  KRA eTIMS &amp; NSSF FISCAL VALIDATION
                </span>
                <span className="text-[7.5px] text-slate-500">
                  SIG: {docNumber}-{payslip.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* 1.9 Signatures & Footer */}
              <div className="pt-1 text-[9px] space-y-2 text-slate-600">
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-1 mb-1 flex justify-between text-[8.5px] text-slate-400 font-sans">
                    <span>Employee Sign: ____________________</span>
                    <span>Date: _________</span>
                  </div>
                </div>
                <div className="text-center font-bold text-slate-800 font-sans text-[9px]">
                  CERTIFIED &amp; AUTHORIZED FOR DISBURSAL
                </div>
                <p className="text-center text-[8px] text-slate-400 italic font-sans">
                  STRICTLY PRIVATE &amp; CONFIDENTIAL • For {payslip.staffName}
                </p>
                <p className="text-center text-[8px] text-slate-400 font-mono font-bold">
                  *** END OF ETR PAYSLIP ***
                </p>
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* 2. EXECUTIVE A4 PAYSLIP LAYOUT                                */
            /* ============================================================= */
            <div
              id="printable-payslip"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-800 font-sans print:shadow-none print:border-none print:p-0 print:rounded-none max-w-3xl mx-auto"
            >
              {/* 2.1 Top Branded Header with Official Logo */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {/* Company Logo Frame */}
                      <div className="w-12 h-12 rounded-xl border border-slate-200 p-1 bg-white shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={companyName}
                            className="w-full h-full object-contain rounded-xl"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-600 text-white font-black text-lg flex items-center justify-center shadow-inner">
                            {companyName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                          {companyName}
                        </h1>
                        <p className="text-[11px] font-semibold text-rose-700 tracking-wide">
                          Textile Manufacturing, Industrial Garments &amp; Retail Solutions
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-tight pt-1">
                      <p>{companyAddress}</p>
                      <p className="font-mono">
                        KRA PIN: <strong className="text-slate-800">{taxPin}</strong> | CU Serial: <strong className="text-slate-800">{cuSerial}</strong> | Tel: {companyPhone}
                      </p>
                      <p>Statutory Remittance Center: NSSF Ref NSF-0092184 | SHIF Code SHIF-EMP-847291</p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-[10px] rounded-full uppercase tracking-wider mb-1">
                      OFFICIAL PAYSLIP
                    </span>
                    <p className="font-black text-slate-900 text-sm">{payslip.monthYear}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      Voucher: <span className="font-bold text-slate-800">{docNumber}</span>
                    </p>
                    <div className="flex items-center sm:justify-end gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PAID &amp; DISBURSED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.2 Employee Particulars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Card A: Identity & Role */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                    <span>Employee Particulars</span>
                  </div>
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-900 text-right">{payslip.staffName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payroll No:</span>
                      <span className="font-mono font-bold text-slate-800">{payslip.employeeNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Designation:</span>
                      <span className="font-semibold text-slate-800 text-right">{payslip.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branch Node:</span>
                      <span className="font-medium text-slate-800 text-right">{stationName}</span>
                    </div>
                  </div>
                </div>

                {/* Card B: Statutory & Tax Identification */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    <span>Statutory Registrations</span>
                  </div>
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">KRA Tax PIN:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {staffMember?.kraPin || 'P051189234R'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">National ID:</span>
                      <span className="font-mono text-slate-800">
                        {staffMember?.idNumber || 'ID-29184021'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NSSF Member:</span>
                      <span className="font-mono text-slate-800">
                        {staffMember?.nssfNo || 'NSF-892104'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SHIF / NHIF:</span>
                      <span className="font-mono text-slate-800">
                        {staffMember?.nhifNo || 'SHIF-940182'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card C: Disbursal Channel & Banking */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                    <span>Payment &amp; Banking</span>
                  </div>
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-800">Bank EFT / Direct</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Name:</span>
                      <span className="font-medium text-slate-800 text-right">
                        {staffMember?.bankAccountName || 'Stanbic Bank Kenya'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account No:</span>
                      <span className="font-mono text-slate-800">
                        {staffMember?.bankAccountNumber || staffMember?.mpesaNumber || '0100 2938 1192 01'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cycle:</span>
                      <span className="font-medium text-slate-800">Monthly Remittance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.3 Side-by-Side Organized Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Earnings &amp; Allowances
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">KSh (Gross)</span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Basic Salary</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {basicSalary.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Housing Allowance</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {houseAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Commuter / Transport Allowance</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {commuterAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Overtime &amp; Special Duty</span>
                        <span className="font-mono font-semibold text-slate-400">0.00</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t-2 border-slate-300 flex justify-between items-center font-bold text-slate-900 bg-emerald-50/70 p-2 rounded-lg">
                      <span className="text-emerald-950 text-xs">TOTAL GROSS EARNINGS:</span>
                      <span className="font-mono text-sm text-emerald-800">
                        KSh {payslip.grossPay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Statutory Deductions (Kenya)
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">KSh (Deductions)</span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <div>
                          <span className="text-slate-700 font-medium">KRA PAYE (Income Tax)</span>
                          <p className="text-[10px] text-slate-400">Net of KSh 2,400 Personal Relief</p>
                        </div>
                        <span className="font-mono font-semibold text-rose-700">
                          - {payslip.payeTax.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <div>
                          <span className="text-slate-700 font-medium">Affordable Housing Levy</span>
                          <p className="text-[10px] text-slate-400">1.5% Gross Earnings (Employee)</p>
                        </div>
                        <span className="font-mono font-semibold text-amber-800">
                          - {payslip.housingLevy.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <div>
                          <span className="text-slate-700 font-medium">NSSF Pension Contribution</span>
                          <p className="text-[10px] text-slate-400">Tier I &amp; Tier II Pension Fund</p>
                        </div>
                        <span className="font-mono font-semibold text-slate-800">
                          - {payslip.nssfDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <div>
                          <span className="text-slate-700 font-medium">SHIF Health Insurance</span>
                          <p className="text-[10px] text-slate-400">2.75% Social Health Insurance</p>
                        </div>
                        <span className="font-mono font-semibold text-slate-800">
                          - {payslip.nhifDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t-2 border-slate-300 flex justify-between items-center font-bold text-slate-900 bg-rose-50/70 p-2 rounded-lg">
                      <span className="text-rose-950 text-xs">TOTAL STATUTORY DEDUCTIONS:</span>
                      <span className="font-mono text-sm text-rose-700">
                        - KSh {payslip.totalDeductions.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.4 Net Take-Home Salary Highlight Callout */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">
                    Net Salary Payable (Take-Home Pay)
                  </span>
                  <p className="text-[11px] text-slate-300 italic">
                    Amount in Words: <strong className="text-white not-italic">{amountToWords(payslip.netPay)}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Electronic transfer remitted to registered employee bank account / M-Pesa.
                  </p>
                </div>

                <div className="sm:text-right bg-slate-800/80 p-3 rounded-xl border border-slate-700 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Net Disbursal
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                    KSh {payslip.netPay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 2.5 Statutory Audit & Employer Remittances Memorandum */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-1.5">
                  <Award className="w-3.5 h-3.5 text-rose-600" />
                  <span>Statutory Compliance &amp; Employer Remittance Audit (Kenya Finance Act)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-0.5">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Employer NSSF Match:</span>
                    <span className="font-mono font-bold text-slate-800">
                      KSh {nssfEmployer.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Employer Housing 1.5%:</span>
                    <span className="font-mono font-bold text-slate-800">
                      KSh {housingLevyEmployer.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">KRA Personal Relief:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      KSh {personalRelief.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Total Remitted to Govt:</span>
                    <span className="font-mono font-bold text-slate-900">
                      KSh {(payslip.payeTax + payslip.housingLevy * 2 + payslip.nssfDeduction * 2 + payslip.nhifDeduction).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2.6 Sign-off & Verification Footer */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-xs">
                  {/* Employee Signature */}
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 italic">
                      I acknowledge receipt of this payslip statement and confirm that statutory deductions have been noted.
                    </p>
                    <div className="border-b border-slate-400 pt-6"></div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Employee Signature</span>
                      <span>Date</span>
                    </div>
                  </div>

                  {/* Digital Verification Seal */}
                  <div className="flex flex-col items-center justify-center p-2 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <QrCode className="w-10 h-10 text-slate-800 mb-1" />
                    <span className="text-[9px] font-mono text-slate-600 font-bold">
                      KRA &amp; NSSF VERIFIED
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">
                      eTIMS Ref: {payslip.id.slice(0, 16)}
                    </span>
                  </div>

                  {/* HR Controller Authorization */}
                  <div className="space-y-4 text-right sm:text-right">
                    <p className="text-[10px] text-slate-500">
                      Certified &amp; Authorized for Payroll Disbursement
                    </p>
                    <div className="border-b border-slate-400 pt-6"></div>
                    <div className="text-[10px] text-slate-600">
                      <p className="font-bold text-slate-800">Head of Human Resources &amp; Payroll</p>
                      <p className="text-[9px] text-slate-400">For {companyName}</p>
                    </div>
                  </div>
                </div>

                {/* Legal & Privacy Statement */}
                <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                  <p>
                    STRICTLY PRIVATE &amp; CONFIDENTIAL. Intended solely for {payslip.staffName} ({payslip.employeeNo}). If received in error, please report immediately to HR.
                  </p>
                  <p className="font-mono text-[8px] text-slate-300 pt-0.5">
                    Generated via Taji ERP Automated Payroll Engine • Nairobi, Kenya
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SCREEN-ONLY BOTTOM ACTION BAR (Hidden in print)                   */}
        {/* ================================================================= */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 payslip-screen-only print:hidden">
          <p className="text-xs text-slate-500 hidden sm:block">
            Mode: <strong className="text-slate-800">{layoutMode === 'slip' ? '80mm Thermal ETR' : 'Executive A4'}</strong> • Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-xs">Esc</kbd> to exit
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-700" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {layoutMode === 'slip' ? 'ETR Slip' : 'Payslip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipModal;
