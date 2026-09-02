import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Users,
  FileDown,
  AlertCircle,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Mail,
  Phone
} from 'lucide-react';
import { generateCustomerStatementPDF } from '../../utils/documentExport';

export const DebtorsAgingScheduleTab: React.FC = () => {
  const { currentUser } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample wholesale clients with aging breakdown
  const debtorClients = [
    {
      id: 'DEBT-001',
      name: 'Nairobi Uniform Garment Industries Ltd',
      phone: '+254 722 998 811',
      pin: 'P051982341M',
      creditLimit: 2500000,
      currentBalance: 840000,
      aging: {
        current: 520000,
        days30: 220000,
        days60: 100000,
        days90Plus: 0
      },
      lastPaymentDate: '2026-02-20',
      transactions: [
        { date: '2026-01-15', refNumber: 'INV-2026-0091', description: 'Special Derek 260 GSM (400m)', debitAmount: 320000, creditAmount: 0, runningBalance: 320000 },
        { date: '2026-02-01', refNumber: 'INV-2026-0142', description: 'Interlock Lining 120 GSM (300m)', debitAmount: 220000, creditAmount: 0, runningBalance: 540000 },
        { date: '2026-02-20', refNumber: 'RCT-2026-0044', description: 'Bank Transfer Payment (Ref: FT26051)', debitAmount: 0, creditAmount: 200000, runningBalance: 340000 },
        { date: '2026-02-25', refNumber: 'INV-2026-0188', description: 'Polar Fleece 280 GSM (600m)', debitAmount: 500000, creditAmount: 0, runningBalance: 840000 }
      ]
    },
    {
      id: 'DEBT-002',
      name: 'Mombasa School Outfitter Co.',
      phone: '+254 733 112 233',
      pin: 'P051112233B',
      creditLimit: 1500000,
      currentBalance: 410000,
      aging: {
        current: 180000,
        days30: 150000,
        days60: 80000,
        days90Plus: 0
      },
      lastPaymentDate: '2026-02-12',
      transactions: [
        { date: '2026-01-10', refNumber: 'INV-2026-0045', description: 'High Bulk Acrylic Yarn (200kg)', debitAmount: 230000, creditAmount: 0, runningBalance: 230000 },
        { date: '2026-02-12', refNumber: 'RCT-2026-0021', description: 'M-Pesa Bulk Payment', debitAmount: 0, creditAmount: 100000, runningBalance: 130000 },
        { date: '2026-02-24', refNumber: 'INV-2026-0179', description: 'Special Derek 260 GSM (350m)', debitAmount: 280000, creditAmount: 0, runningBalance: 410000 }
      ]
    },
    {
      id: 'DEBT-003',
      name: 'Eldoret Apparel Manufacturers',
      phone: '+254 711 445 566',
      pin: 'P051778899C',
      creditLimit: 1000000,
      currentBalance: 195000,
      aging: {
        current: 95000,
        days30: 50000,
        days60: 0,
        days90Plus: 50000
      },
      lastPaymentDate: '2026-01-28',
      transactions: [
        { date: '2025-11-20', refNumber: 'INV-2025-0812', description: 'Interlock 120 GSM (100m)', debitAmount: 50000, creditAmount: 0, runningBalance: 50000 },
        { date: '2026-02-18', refNumber: 'INV-2026-0160', description: '2/24 NM Acrylic Yarn (150kg)', debitAmount: 145000, creditAmount: 0, runningBalance: 195000 }
      ]
    }
  ];

  const filteredClients = debtorClients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const totalOutstanding = debtorClients.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalOverdue60Plus = debtorClients.reduce((sum, c) => sum + c.aging.days60 + c.aging.days90Plus, 0);

  const handleDownloadStatement = (client: typeof debtorClients[0]) => {
    generateCustomerStatementPDF({
      customerName: client.name,
      customerPhone: client.phone,
      customerPin: client.pin,
      statementDate: new Date().toISOString().slice(0, 10),
      periodRange: '1 Jan 2026 - 28 Feb 2026',
      currentBalance: client.currentBalance,
      aging: client.aging,
      transactions: client.transactions
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b2230] to-slate-950 p-5 rounded-2xl border border-slate-700 shadow-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Debtors Aging Schedule &amp; Customer Statement Dispatch
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor 30/60/90+ day credit exposures and export branded customer account statements with 1 click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Accounts Receivable</span>
              <p className="text-sm font-black text-white font-mono">
                KSh {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aging KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">Current (0-30 Days)</span>
          <p className="text-lg font-black text-emerald-600 font-mono">
            KSh {debtorClients.reduce((s, c) => s + c.aging.current, 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Within standard terms</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">31 - 60 Days</span>
          <p className="text-lg font-black text-amber-600 font-mono">
            KSh {debtorClients.reduce((s, c) => s + c.aging.days30, 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-amber-600">Reminder notice due</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">61 - 90 Days</span>
          <p className="text-lg font-black text-orange-600 font-mono">
            KSh {debtorClients.reduce((s, c) => s + c.aging.days60, 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-orange-600">Credit hold warning</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 font-medium">90+ Days Overdue</span>
          <p className="text-lg font-black text-rose-600 font-mono">
            KSh {debtorClients.reduce((s, c) => s + c.aging.days90Plus, 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-rose-600">Critical recovery action</span>
        </div>
      </div>

      {/* Customer List and Statements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search wholesale debtor by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:bg-white focus:outline-rose-500"
            />
          </div>
          <span className="text-slate-500 text-[11px]">{filteredClients.length} wholesale debtor accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Customer Legal Name</th>
                <th className="p-3 text-right">Outstanding (KES)</th>
                <th className="p-3 text-right">0 - 30 Days</th>
                <th className="p-3 text-right">31 - 60 Days</th>
                <th className="p-3 text-right">61 - 90 Days</th>
                <th className="p-3 text-right">90+ Days</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{client.name}</p>
                    <p className="text-[10px] text-slate-400">{client.phone} | PIN: {client.pin}</p>
                  </td>
                  <td className="p-3 text-right font-mono font-black text-slate-900">
                    KSh {client.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    KSh {client.aging.current.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-700 font-bold">
                    KSh {client.aging.days30.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-orange-700 font-bold">
                    KSh {client.aging.days60.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-600 font-black">
                    {client.aging.days90Plus > 0 ? `KSh ${client.aging.days90Plus.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDownloadStatement(client)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Export Statement PDF</span>
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
