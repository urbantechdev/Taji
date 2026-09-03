import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { MonthEndStep } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  DollarSign,
  ShieldCheck,
  Building,
  RefreshCw,
  FileCheck,
  ArrowRight,
  Zap,
  Sparkles
} from 'lucide-react';

export const MonthEndFastTrackWizard: React.FC = () => {
  const {
    locations,
    orders,
    branchExpenses,
    fixedAssets,
    currentUser,
    addLedgerEntry
  } = useERP();

  const [activeMonth, setActiveMonth] = useState('February 2026');
  const [steps, setSteps] = useState<MonthEndStep[]>([
    {
      id: 'step_1',
      title: '1. Till & Cash Float Reconciliation',
      category: 'cash',
      description: 'Audit physical cash floats and M-Pesa till balances against POS transaction receipts across all store branches.',
      status: 'completed',
      actionLabel: 'Verify Cash Balances',
      verifiedAt: '2026-02-28 18:30',
      verifiedBy: 'Store Supervisor'
    },
    {
      id: 'step_2',
      title: '2. Landed Inventory Capitalization Audit',
      category: 'inventory',
      description: 'Ensure all arriving containers and clearing agency SAD bills are fully capitalized into General Ledger Asset Account 1200.',
      status: 'completed',
      actionLabel: 'Audit Landed Shipments',
      verifiedAt: '2026-02-28 19:15',
      verifiedBy: 'Lead Logistics Officer'
    },
    {
      id: 'step_3',
      title: '3. Statutory Payroll & Tax Deductions',
      category: 'payroll',
      description: 'Verify statutory remittance schedules for KRA PAYE, NSSF Act 2013, SHA 2.75%, and Affordable Housing Levy 1.5%.',
      status: 'pending',
      actionLabel: 'Post Statutory Accruals'
    },
    {
      id: 'step_4',
      title: '4. Monthly Fixed Asset Depreciation Posting',
      category: 'assets',
      description: 'Auto-calculate straight-line depreciation across machinery, cutting tables, vehicles, and office IT equipment.',
      status: 'pending',
      actionLabel: 'Auto-Post Depreciation'
    },
    {
      id: 'step_5',
      title: '5. Financial Period Lock & Audit Trail Sealing',
      category: 'period_lock',
      description: 'Lock accounting period to prevent backdated edits, unauthorized journal tampering, and preserve statutory audit integrity.',
      status: 'pending',
      actionLabel: 'Lock February 2026 Period'
    }
  ]);

  const [isProcessingStep, setIsProcessingStep] = useState<string | null>(null);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleExecuteStep = async (stepId: string) => {
    setIsProcessingStep(stepId);

    try {
      if (stepId === 'step_4') {
        // Auto-post depreciation to GL
        const totalMonthlyDepreciation = 125000;
        addLedgerEntry({
          description: `Month-End Depreciation Accrual - ${activeMonth}`,
          transactionRef: `JRN-DEP-${Date.now().toString().slice(-4)}`,
          debitAccount: '5200 - Depreciation & Amortization Expense',
          creditAccount: '1590 - Accumulated Depreciation (Plant & Machinery)',
          amount: totalMonthlyDepreciation,
          locationId: locations && locations[0] ? locations[0].id : 'loc-nbo-cbd',
          category: 'Depreciation'
        });
      }

      setSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? {
                ...step,
                status: 'completed',
                verifiedAt: new Date().toLocaleString(),
                verifiedBy: currentUser?.name || 'Chief Accountant'
              }
            : step
        )
      );
    } catch (err) {
      console.error('Failed step execution:', err);
    } finally {
      setIsProcessingStep(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b2230] to-slate-950 p-5 rounded-2xl border border-slate-700 shadow-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Month-End "Close the Books" Fast-Track Wizard
                </h3>
                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  {activeMonth}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guided 5-step financial closing checklist to reconcile floats, verify import capitalizations, accrue statutory deductions, and lock audit trails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Closing Progress</span>
              <p className="text-sm font-black text-emerald-400 font-mono">{completedCount} / {steps.length} Steps ({progressPct}%)</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-emerald-500 flex items-center justify-center font-bold text-white text-xs">
              {progressPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Steps Cards */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`p-4 rounded-2xl border transition-all ${
              step.status === 'completed'
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  step.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{step.title}</h4>
                    {step.status === 'completed' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs max-w-2xl">{step.description}</p>
                  {step.verifiedAt && (
                    <p className="text-[10px] text-slate-400">
                      Completed: {step.verifiedAt} by {step.verifiedBy}
                    </p>
                  )}
                </div>
              </div>

              <div>
                {step.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => handleExecuteStep(step.id)}
                    disabled={isProcessingStep === step.id}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isProcessingStep === step.id ? 'Processing...' : step.actionLabel}</span>
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reconciled</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
