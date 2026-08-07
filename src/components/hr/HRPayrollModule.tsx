import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { PayrollRecord, StaffMember } from '../../types';
import { LOCATIONS } from '../../data/initialData';
import {
  Users,
  DollarSign,
  Printer,
  Calendar,
  CheckCircle2,
  X,
  Plus
} from 'lucide-react';

export const HRPayrollModule: React.FC = () => {
  const { staff, payroll, generateMonthlyPayroll } = useERP();
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [isGeneratedMsg, setIsGeneratedMsg] = useState(false);

  const handleGenerateClick = () => {
    generateMonthlyPayroll(selectedMonth);
    setIsGeneratedMsg(true);
    setTimeout(() => setIsGeneratedMsg(false), 4000);
  };

  const activeMonthRecords = payroll.filter(p => p.monthYear === selectedMonth);
  const displayRecords = activeMonthRecords.length > 0 ? activeMonthRecords : payroll;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-lg">
                Human Resources &amp; KRA Tax Payroll Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated PAYE, NSSF, NHIF, and 1.5% Housing Levy tax calculations across all store locations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-200 text-xs font-bold rounded-xl focus:outline-none"
            >
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
            </select>

            <button
              onClick={handleGenerateClick}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Calendar className="w-4 h-4" />
              Run {selectedMonth} Payroll
            </button>
          </div>
        </div>

        {isGeneratedMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Monthly payroll for {selectedMonth} successfully calculated and published!</span>
          </div>
        )}
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Employee Payslips &amp; Tax Deductions ({selectedMonth})
          </h3>
          <span className="text-xs font-semibold text-rose-700">
            {staff.length} Active Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Employee</th>
                <th className="p-4">Role &amp; Location</th>
                <th className="p-4 font-mono">Gross Pay (KSh)</th>
                <th className="p-4 font-mono">PAYE Tax</th>
                <th className="p-4 font-mono">1.5% Housing</th>
                <th className="p-4 font-mono">NSSF/NHIF</th>
                <th className="p-4 font-mono">Net Pay (KSh)</th>
                <th className="p-4 text-right">Payslip Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {displayRecords.map(pay => {
                const loc = LOCATIONS.find(l => l.id === pay.locationId);

                return (
                  <tr key={pay.id} className="hover:bg-rose-50/30 transition-colors">
                    
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{pay.staffName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{pay.employeeNo}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{(pay.role || '').replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-[10px] text-slate-500">{loc?.name}</p>
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-900">
                      KSh {pay.grossPay.toLocaleString()}
                    </td>

                    <td className="p-4 font-mono text-rose-700">
                      KSh {pay.payeTax.toLocaleString()}
                    </td>

                    <td className="p-4 font-mono text-amber-800">
                      KSh {pay.housingLevy.toLocaleString()}
                    </td>

                    <td className="p-4 font-mono text-slate-600">
                      KSh {(pay.nssfDeduction + pay.nhifDeduction).toLocaleString()}
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-800">
                      KSh {pay.netPay.toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(pay)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-600" />
                        Payslip
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYSLIP MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Official Employee Payslip ({selectedPayslip.monthYear})
              </h3>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200" id="printable-payslip">
              <div className="text-center border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Dereck Fleece &amp; Yarns Ltd</h4>
                <p className="text-[10px] text-slate-500">Employee Confidential Payslip</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Employee Name:</span><span className="font-bold">{selectedPayslip.staffName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Employee No:</span><span className="font-mono">{selectedPayslip.employeeNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Designation:</span><span className="font-semibold">{selectedPayslip.role}</span></div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-slate-600">Basic Salary:</span><span className="font-mono">KSh {selectedPayslip.basicSalary.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Allowances:</span><span className="font-mono">KSh {selectedPayslip.allowances.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-slate-900"><span className="text-slate-700">GROSS EARNINGS:</span><span className="font-mono text-emerald-700">KSh {selectedPayslip.grossPay.toLocaleString()}</span></div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1 text-slate-600">
                <div className="flex justify-between"><span>PAYE Income Tax:</span><span className="font-mono text-rose-700">- KSh {selectedPayslip.payeTax.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Housing Levy (1.5%):</span><span className="font-mono text-amber-800">- KSh {selectedPayslip.housingLevy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>NSSF Pension:</span><span className="font-mono">- KSh {selectedPayslip.nssfDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>NHIF Health Insurance:</span><span className="font-mono">- KSh {selectedPayslip.nhifDeduction.toLocaleString()}</span></div>
              </div>

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>NET SALARY PAYABLE:</span>
                <span className="font-mono text-emerald-800">KSh {selectedPayslip.netPay.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Payslip
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
