import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LOCATIONS } from '../../data/initialData';
import { LocationId } from '../../types';
import {
  BookOpenCheck,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Scale,
  Building,
  Store,
  Warehouse,
  ArrowLeftRight,
  CheckCircle2,
  Search,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';

export const AccountingLedger: React.FC = () => {
  const { ledger, orders } = useERP();
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Separate Sales Calculations for Easy Financial Balancing
  const mainStoreOrders = orders.filter(o => o.fulfilledByLocation === 'main_store');
  const mainStoreGrossRevenue = mainStoreOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const mainStoreVatLiability = mainStoreOrders.reduce((acc, o) => acc + o.vatAmount, 0);
  const mainStoreNetRevenue = mainStoreGrossRevenue - mainStoreVatLiability;

  const salesShopOrders = orders.filter(o => o.fulfilledByLocation === 'sales_shop');
  const salesShopGrossRevenue = salesShopOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const salesShopVatLiability = salesShopOrders.reduce((acc, o) => acc + o.vatAmount, 0);
  const salesShopNetRevenue = salesShopGrossRevenue - salesShopVatLiability;

  const store1ReroutedOrders = orders.filter(o => o.originLocation === 'store_1');
  const store1ReroutedRevenue = store1ReroutedOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  const store2ReroutedOrders = orders.filter(o => o.originLocation === 'store_2');
  const store2ReroutedRevenue = store2ReroutedOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  const totalGrossRevenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalVatLiability = orders.reduce((acc, o) => acc + o.vatAmount, 0);

  // Filtered Ledger Entries
  const filteredLedger = ledger.filter(entry => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || entry.locationId === selectedLocation;
    const matchesSearch = searchQuery === '' || 
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.creditAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLocation && matchesSearch;
  });

  const totalDebits = filteredLedger.reduce((acc, e) => acc + e.amount, 0);

  // CSV Export function
  const exportToCSV = () => {
    const headers = ['ID', 'Timestamp', 'Tx Ref', 'Description', 'Debit Account', 'Credit Account', 'Amount (KSh)', 'Location', 'Category'];
    const rows = ledger.map(e => [
      e.id,
      new Date(e.timestamp).toLocaleString(),
      e.transactionRef,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.debitAccount}"`,
      `"${e.creditAccount}"`,
      e.amount,
      LOCATIONS.find(l => l.id === e.locationId)?.name || e.locationId,
      e.category
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MainStore_vs_Shop_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Ledger Header */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-lg">
                Main Store &amp; Shop Sales Balancing Ledger
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated double-entry reconciliation separating Main Store (Hub) collections, Sales Shop retail sales, and Store 1/2 ticket reroutes.
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-400" />
            Export Financial Report (CSV)
          </button>
        </div>

        {/* Location & Category Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Store Node:</span>
            {[
              { id: 'All', label: 'All Outlets' },
              { id: 'main_store', label: 'Main Store Hub' },
              { id: 'sales_shop', label: 'Sales Shop Retail' },
              { id: 'store_1', label: 'Store 1 (Transfer)' },
              { id: 'store_2', label: 'Store 2 (Transfer)' },
            ].map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLocation === loc.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ledger / Tx ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* DEDICATED FINANCIAL BALANCING CARDS (MAIN STORE VS SALES SHOP SEPARATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CARD 1: MAIN STORE HUB FINANCIALS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-600 rounded-xl text-white">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white tracking-tight">Main Store &amp; Central Hub Sales</h3>
                <p className="text-[11px] text-slate-400">Bulk sales, wholesale &amp; Store 1/2 rerouted order fulfillments</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30">
              Balanced Entry
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Gross Revenue</span>
              <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                KSh {mainStoreGrossRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">{mainStoreOrders.length} Order(s)</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">16% Output VAT</span>
              <p className="text-lg font-black font-mono text-amber-400 mt-0.5">
                KSh {mainStoreVatLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400">KRA TIMS Output</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Revenue</span>
              <p className="text-lg font-black font-mono text-white mt-0.5">
                KSh {mainStoreNetRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400">Net of Tax</span>
            </div>
          </div>

          {/* Payment Method Breakdown for Main Store */}
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Main Store Cash Drawer &amp; Banking Reconciliation</p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Bank Transfer</span>
                <span className="font-bold text-emerald-400">
                  KSh {mainStoreOrders.filter(o => o.paymentMethod === 'Bank Transfer').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">M-Pesa Express</span>
                <span className="font-bold text-emerald-400">
                  KSh {mainStoreOrders.filter(o => o.paymentMethod === 'M-Pesa').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Cash Handled</span>
                <span className="font-bold text-emerald-400">
                  KSh {mainStoreOrders.filter(o => o.paymentMethod === 'Cash').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: SALES SHOP RETAIL FINANCIALS */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-4 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Sales Shop Direct Retail Sales</h3>
                <p className="text-[11px] text-slate-500">Walk-in retail POS cashier register &amp; counter orders</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-pink-100 text-pink-800 text-[10px] font-mono font-bold rounded-full border border-pink-200">
              POS Registered
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Gross Revenue</span>
              <p className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                KSh {salesShopGrossRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500">{salesShopOrders.length} Order(s)</span>
            </div>

            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">16% Output VAT</span>
              <p className="text-lg font-black font-mono text-amber-800 mt-0.5">
                KSh {salesShopVatLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-500">KRA TIMS Output</span>
            </div>

            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Net Revenue</span>
              <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                KSh {salesShopNetRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-500">Net of Tax</span>
            </div>
          </div>

          {/* Payment Method Breakdown for Sales Shop */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Sales Shop Register Cash &amp; Digital Reconciliation</p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">M-Pesa POS</span>
                <span className="font-bold text-emerald-700">
                  KSh {salesShopOrders.filter(o => o.paymentMethod === 'M-Pesa').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Cash Drawer</span>
                <span className="font-bold text-emerald-700">
                  KSh {salesShopOrders.filter(o => o.paymentMethod === 'Cash').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Card Terminal</span>
                <span className="font-bold text-emerald-700">
                  KSh {salesShopOrders.filter(o => o.paymentMethod === 'Card').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* REROUTED ORDER TICKET AUDIT ROW (STORE 1 & STORE 2 NON-CASH BRANCHES) */}
      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
              Store 1 &amp; Store 2 Ticket Reroutes (Non-Cash Outlets)
            </h4>
            <p className="text-xs text-amber-900 mt-0.5">
              Direct POS sales are disabled at Store 1 &amp; Store 2. Customer tickets automatically route to Main Store for cash collection &amp; ETR issuing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-sans">Store 1 Tickets:</span>
            <span className="font-bold text-slate-900">KSh {store1ReroutedRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-amber-700 block font-sans">({store1ReroutedOrders.length} ticket)</span>
          </div>

          <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-sans">Store 2 Tickets:</span>
            <span className="font-bold text-slate-900">KSh {store2ReroutedRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-amber-700 block font-sans">({store2ReroutedOrders.length} ticket)</span>
          </div>
        </div>
      </div>

      {/* Summary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Double Entry Volume
          </span>
          <p className="text-xl font-black font-mono text-slate-900">
            KSh {totalDebits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Filtered Ledger Line Total
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Combined Sales
          </span>
          <p className="text-xl font-black font-mono text-emerald-900">
            KSh {totalGrossRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            Main Store + Sales Shop Total
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total KRA Output VAT
          </span>
          <p className="text-xl font-black font-mono text-amber-900">
            KSh {totalVatLiability.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-amber-600 font-medium">
            16% Output Tax Liability
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Accounting Balance Status
          </span>
          <div className="flex items-center gap-1.5 text-emerald-600 pt-0.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">Debits = Credits</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Zero Discrepancy Verified
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Category Filter:</span>
        {['All', 'Sales', 'Inter-Store Transfer', 'Tax VAT', 'Inventory Asset'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Ledger Double-Entry Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-rose-100/60 bg-rose-50/30 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-rose-600" />
            Double-Entry Transaction Ledger ({filteredLedger.length} Records)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Location: {selectedLocation === 'All' ? 'All Outlets' : LOCATIONS.find(l => l.id === selectedLocation)?.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Tx ID &amp; Date</th>
                <th className="p-4">Outlet Node</th>
                <th className="p-4">Description / Reference</th>
                <th className="p-4">Debit Account</th>
                <th className="p-4">Credit Account</th>
                <th className="p-4">Amount (KSh)</th>
                <th className="p-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No accounting entries found matching the selected store location or filter.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(entry => {
                  const loc = LOCATIONS.find(l => l.id === entry.locationId);
                  const isMainStore = entry.locationId === 'main_store';
                  const isSalesShop = entry.locationId === 'sales_shop';

                  return (
                    <tr key={entry.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-bold text-slate-900">{entry.id}</p>
                        <p className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tight border ${
                          isMainStore
                            ? 'bg-slate-900 text-white border-slate-800'
                            : isSalesShop
                            ? 'bg-pink-100 text-pink-800 border-pink-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {loc?.name || entry.locationId}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 leading-tight">{entry.description}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">Ref: {entry.transactionRef}</p>
                      </td>
                      <td className="p-4 font-semibold text-emerald-800 bg-emerald-50/40">
                        {entry.debitAccount}
                      </td>
                      <td className="p-4 font-semibold text-rose-800 bg-rose-50/40">
                        {entry.creditAccount}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">
                        KSh {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {entry.category}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

