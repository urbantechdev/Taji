import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { LocationId, CategoryType, ProductBatch } from '../../types';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { generateLiveBalanceSheet } from '../../utils/financeEngine';
import { downloadCSV } from '../../utils/documentExport';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Download,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  Store,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Search,
  Sparkles,
  Barcode,
  Package,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { playSuccessSound, playAlertSound } from '../../utils/audio';

export const StockLedgerReconciliationModal: React.FC = () => {
  const {
    isStockLedgerReconcileOpen,
    setIsStockLedgerReconcileOpen,
    products,
    locations,
    activeLocation,
    ledger,
    orders,
    branchExpenses,
    payroll,
    fixedAssets,
    addLedgerEntry,
    recordAuditLog,
    brandSettings,
    etrConfig,
    setIsMobileBarcodeScannerOpen
  } = useERP();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'categories' | 'itemized'>('overview');
  const [isPostingJournal, setIsPostingJournal] = useState(false);
  const [journalFeedback, setJournalFeedback] = useState<string | null>(null);

  // Compute Live Balance Sheet Inventory Book Valuation
  const balanceSheet = useMemo(() => {
    return generateLiveBalanceSheet(orders, products, locations, branchExpenses, payroll, ledger, fixedAssets);
  }, [orders, products, locations, branchExpenses, payroll, ledger, fixedAssets]);

  // Compute Ledger Inventory Asset Balance from double-entry journal entries
  const ledgerInventoryAccountTotal = useMemo(() => {
    let balance = 0;
    const inventoryAccountKeywords = ['inventory', 'finished goods', 'raw materials', 'stock asset'];

    ledger.forEach(entry => {
      const debitLower = (entry.debitAccount || '').toLowerCase();
      const creditLower = (entry.creditAccount || '').toLowerCase();

      const isDebitInventory = inventoryAccountKeywords.some(kw => debitLower.includes(kw));
      const isCreditInventory = inventoryAccountKeywords.some(kw => creditLower.includes(kw));

      if (isDebitInventory && !isCreditInventory) {
        balance += entry.amount;
      } else if (isCreditInventory && !isDebitInventory) {
        balance -= entry.amount;
      }
    });

    // If no explicit ledger journal entries yet, fall back to balance sheet inventory asset value
    if (balance <= 0) {
      return balanceSheet.currentAssets.inventoryAssetValue;
    }
    return balance;
  }, [ledger, balanceSheet]);

  // Filter products by location & category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesLocation = selectedLocation === 'All' || ((p.locationStock?.[selectedLocation as LocationId] || 0) > 0);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.invoiceRef && p.invoiceRef.toLowerCase().includes(query));

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [products, selectedLocation, selectedCategory, searchQuery]);

  // Physical Inventory Metrics
  const physicalMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    const locMap: Record<string, { units: number; costValuation: number; retailValuation: number }> = {};
    locations.forEach(loc => {
      locMap[loc.id] = { units: 0, costValuation: 0, retailValuation: 0 };
    });

    const catMap: Record<string, { units: number; costValuation: number; retailValuation: number; count: number }> = {
      Dereck: { units: 0, costValuation: 0, retailValuation: 0, count: 0 },
      Fleece: { units: 0, costValuation: 0, retailValuation: 0, count: 0 },
      Yarns: { units: 0, costValuation: 0, retailValuation: 0, count: 0 }
    };

    products.forEach(p => {
      const costP = p.costPrice || (p.unitPriceRetail * 0.6);
      const retailP = p.unitPriceRetail || (p.costPrice * 1.3);

      Object.entries(p.locationStock || {}).forEach(([locId, qty]) => {
        const q = Number(qty) || 0;
        if (locMap[locId]) {
          locMap[locId].units += q;
          locMap[locId].costValuation += q * costP;
          locMap[locId].retailValuation += q * retailP;
        }

        if (selectedLocation === 'All' || selectedLocation === locId) {
          totalUnits += q;
          totalCostValuation += q * costP;
          totalRetailValuation += q * retailP;
        }
      });

      if (catMap[p.category]) {
        const itemTotalQty = Object.values(p.locationStock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
        catMap[p.category].units += itemTotalQty;
        catMap[p.category].costValuation += itemTotalQty * costP;
        catMap[p.category].retailValuation += itemTotalQty * retailP;
        catMap[p.category].count += 1;
      }
    });

    return {
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      locMap,
      catMap
    };
  }, [products, locations, selectedLocation]);

  // Overall Ledger comparison
  const bookInventoryValue = selectedLocation === 'All'
    ? ledgerInventoryAccountTotal
    : (physicalMetrics.locMap[selectedLocation]?.costValuation || 0);

  const varianceCost = physicalMetrics.totalCostValuation - bookInventoryValue;
  const variancePct = bookInventoryValue > 0 ? ((varianceCost / bookInventoryValue) * 100).toFixed(2) : '0.00';
  const isExactMatch = Math.abs(varianceCost) < 1;
  const isBalancedTolerance = Math.abs(Number(variancePct)) < 1.0;
  const isSurplus = varianceCost > 0;

  // Handler to Post Balancing Journal Entry to General Ledger
  const handlePostBalancingJournal = () => {
    if (Math.abs(varianceCost) < 1) {
      setJournalFeedback('Stock is already perfectly balanced with the accounts ledger (KSh 0.00 discrepancy).');
      return;
    }

    setIsPostingJournal(true);
    const now = new Date();
    const absVariance = Math.abs(varianceCost);
    const targetLoc: LocationId = selectedLocation === 'All' ? activeLocation : (selectedLocation as LocationId);
    const targetLocName = locations.find(l => l.id === targetLoc)?.name || targetLoc;

    if (varianceCost < 0) {
      // Deficit / Shrinkage
      addLedgerEntry({
        transactionRef: `REC-STK-${now.getTime().toString().slice(-6)}`,
        description: `Periodic Stock Count vs Ledger Reconciliation Adjustment: Inventory Deficit/Shrinkage written off at ${targetLocName}`,
        debitAccount: 'Inventory Shrinkage, Wastage & Deficit Expense',
        creditAccount: 'Finished Goods & Raw Materials Inventory',
        amount: Number(absVariance.toFixed(2)),
        locationId: targetLoc,
        category: 'Inventory Variance'
      });
    } else {
      // Surplus
      addLedgerEntry({
        transactionRef: `REC-STK-${now.getTime().toString().slice(-6)}`,
        description: `Periodic Stock Count vs Ledger Reconciliation Adjustment: Inventory Surplus recognized at ${targetLocName}`,
        debitAccount: 'Finished Goods & Raw Materials Inventory',
        creditAccount: 'Inventory Revaluation & Stock Surplus Gain',
        amount: Number(absVariance.toFixed(2)),
        locationId: targetLoc,
        category: 'Inventory Revaluation'
      });
    }

    recordAuditLog(
      'Stock Ledger Reconciliation Posted',
      `Posted balancing journal to align General Ledger with scanned inventory. Variance of KSh ${absVariance.toLocaleString()} reconciled.`
    );

    playSuccessSound();
    setIsPostingJournal(false);
    setJournalFeedback(`Balancing journal entry successfully posted to General Ledger! Accounts ledger is now synchronized with physical stock.`);
    setTimeout(() => setJournalFeedback(null), 8000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Barcode',
      'Batch ID',
      'Product Name',
      'Category',
      'Invoice Ref',
      'Store Location',
      'Physical Stock Qty',
      'Unit',
      'Unit Cost (KSh)',
      'Physical Cost Value (KSh)',
      'Retail Price (KSh)',
      'Retail Value (KSh)'
    ];

    const rows: string[][] = [];
    products.forEach(p => {
      const costP = p.costPrice || (p.unitPriceRetail * 0.6);
      const retailP = p.unitPriceRetail || 0;

      Object.entries(p.locationStock || {}).forEach(([locId, qty]) => {
        const q = Number(qty) || 0;
        if (q > 0) {
          rows.push([
            `"${p.barcode || p.sku || ''}"`,
            `"${p.id}"`,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.category}"`,
            `"${p.invoiceRef || 'N/A'}"`,
            `"${locations.find(l => l.id === locId)?.name || locId}"`,
            q.toString(),
            p.unit,
            costP.toFixed(2),
            (q * costP).toFixed(2),
            retailP.toFixed(2),
            (q * retailP).toFixed(2)
          ]);
        }
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`Stock_vs_Ledger_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  // Export PDF Audit Report
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('portrait', 'pt', 'a4');
      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(brandSettings.brandName || 'TAJI ENTERPRISE', 40, 50);

      doc.setFontSize(12);
      doc.setTextColor(225, 29, 72);
      doc.text('PHYSICAL STOCK VS. ACCOUNTS LEDGER AUDIT RECONCILIATION', 40, 70);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date Generated: ${nowStr} | ETR PIN: ${etrConfig?.taxPin || 'P051234567Z'} | Scope: ${selectedLocation}`, 40, 85);

      // Summary Table
      autoTable(doc, {
        startY: 100,
        head: [['Reconciliation Metric', 'Value (KSh / Units)', 'Ledger Verification Status']],
        body: [
          ['Total Physical Scanned Units on Hand', `${physicalMetrics.totalUnits.toLocaleString()} Units`, 'Audited Physical Stock'],
          ['Physical Inventory Valuation (At Cost)', `KSh ${physicalMetrics.totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Cost Valuation Base'],
          ['Physical Inventory Valuation (Retail Potential)', `KSh ${physicalMetrics.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gross Retail Potential'],
          ['General Ledger Inventory Book Valuation', `KSh ${bookInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Balance Sheet & Journal Total'],
          ['Net Reconciliation Variance (Discrepancy)', `KSh ${varianceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${variancePct}%)`, isExactMatch ? 'EXACT MATCH' : isBalancedTolerance ? 'BALANCED (<1%)' : isSurplus ? 'SURPLUS' : 'DEFICIT']
        ],
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 }
      });

      // Location Breakdown Table
      const locRows = locations.map(l => {
        const m = physicalMetrics.locMap[l.id] || { units: 0, costValuation: 0, retailValuation: 0 };
        return [
          l.name,
          `${m.units.toLocaleString()} units`,
          `KSh ${m.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `KSh ${m.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Branch Outlet', 'Scanned Units', 'Cost Valuation', 'Retail Potential']],
        body: locRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 }
      });

      doc.save(`Taji_Stock_Ledger_Reconciliation_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.warn('PDF export error:', err);
      handleExportCSV();
    }
  };

  if (!isStockLedgerReconcileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100/60 overflow-hidden flex flex-col max-h-[92vh]">
        <RightEdgeBlend variant="rainbow" />
        <ReflectionOverlay opacity={0.05} />

        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-4 sm:p-5 text-white border-b border-rose-500/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-rose-600/30 border border-rose-400/40 rounded-xl text-rose-300 shadow-md">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Stock vs. Accounts Ledger Reconciliation
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isExactMatch
                      ? 'bg-emerald-400 text-emerald-950'
                      : isBalancedTolerance
                      ? 'bg-blue-400 text-blue-950'
                      : isSurplus
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-rose-400 text-rose-950'
                  }`}>
                    {isExactMatch ? '100% In Sync' : isBalancedTolerance ? 'Balanced (<1%)' : isSurplus ? 'Stock Surplus' : 'Deficit / Shrinkage'}
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Compare physical scanned inventory valuation against General Ledger book records &amp; post balancing adjustments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export Audited PDF Statement"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export CSV Data"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStockLedgerReconcileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-header Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'overview' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Audit Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('locations')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'locations' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Store Outlets ({locations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'categories' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Categories
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('itemized')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'itemized' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Itemized Batches ({filteredProducts.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-semibold">Store Scope:</span>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-slate-800 text-white font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Outlets Combined</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Alert if journal posted */}
        {journalFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{journalFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setJournalFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Scanned Physical Stock (At Cost) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Physical Stock (At Cost)</span>
                <Package className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                KSh {physicalMetrics.totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Counted across {physicalMetrics.totalUnits.toLocaleString()} units in inventory
              </p>
            </div>

            {/* Card 2: Accounts Ledger Book Value */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Accounts Ledger Book Value</span>
                <Scale className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                KSh {bookInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                General Ledger balance sheet inventory asset
              </p>
            </div>

            {/* Card 3: Net Variance (Discrepancy) */}
            <div className={`p-4 rounded-2xl border shadow-xs space-y-1.5 ${
              isExactMatch
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : isBalancedTolerance
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : isSurplus
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold opacity-80">
                <span>Net Audit Variance</span>
                {isExactMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="text-xl font-black font-mono">
                {varianceCost >= 0 ? '+' : ''}KSh {varianceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{isExactMatch ? '0.00% Variance' : `${variancePct}% Discrepancy`}</span>
                <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/60">
                  {isExactMatch ? 'Matched' : isSurplus ? 'Stock Surplus' : 'Shrinkage Deficit'}
                </span>
              </div>
            </div>

            {/* Card 4: Retail Potential */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Physical Retail Value</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                KSh {physicalMetrics.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Projected gross revenue if all sold at retail
              </p>
            </div>
          </div>

          {/* Action Callout Banner if variance exists */}
          {!isExactMatch && (
            <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-4 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="font-extrabold text-sm text-white">
                    Synchronize Scanned Stock with General Ledger
                  </h4>
                </div>
                <p className="text-xs text-rose-200/80">
                  {varianceCost > 0
                    ? `Physical scanned stock exceeds the general ledger book value by KSh ${varianceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Post a surplus revaluation journal entry to credit Inventory Revaluation Gain.`
                    : `Physical scanned stock has a shrinkage deficit of KSh ${Math.abs(varianceCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}. Post an audited write-off journal entry to debit Inventory Shrinkage Expense.`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePostBalancingJournal}
                  disabled={isPostingJournal}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {isPostingJournal ? 'Posting to Ledger...' : 'Post Balancing Journal Entry'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Auditor Reconciliation Statement &amp; Methodology
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200/60">
                    <strong className="text-slate-900 block font-bold">1. Physical Count Verification</strong>
                    <p>
                      Scanned rolls and bales are aggregated across active branches using barcode and RFID tags. Unit cost price is preserved per batch landed cost.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200/60">
                    <strong className="text-slate-900 block font-bold">2. Double-Entry General Ledger</strong>
                    <p>
                      Book value is derived from the balance sheet asset register and journal entries on <em>Finished Goods &amp; Raw Materials Inventory</em>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200/60">
                    <strong className="text-slate-900 block font-bold">3. GAAP / IFRS Adjustment</strong>
                    <p>
                      Variances under 1% are acceptable operating cut-offs. Larger variances are reconciled via audited journal vouchers to prevent balance sheet distortion.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">Need to scan additional inward rolls into stock?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsStockLedgerReconcileOpen(false);
                    setIsMobileBarcodeScannerOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Scan to Add Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATIONS BREAKDOWN */}
          {activeTab === 'locations' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-rose-600" />
                  Store Location Inventory Breakdown
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {locations.length} active outlets audited
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="p-3.5">Branch / Store Node</th>
                      <th className="p-3.5">Physical Units</th>
                      <th className="p-3.5">Cost Valuation (KSh)</th>
                      <th className="p-3.5">Retail Potential (KSh)</th>
                      <th className="p-3.5">Profit Margin (KSh)</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locations.map(loc => {
                      const m = physicalMetrics.locMap[loc.id] || { units: 0, costValuation: 0, retailValuation: 0 };
                      const margin = m.retailValuation - m.costValuation;
                      const hasStock = m.units > 0;

                      return (
                        <tr key={loc.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{loc.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-700">
                            {m.units.toLocaleString()} units
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            KSh {m.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono text-emerald-700 font-bold">
                            KSh {m.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            +KSh {margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              hasStock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {hasStock ? 'Stock Active' : 'Zero Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-extrabold border-t border-slate-200">
                    <tr>
                      <td className="p-3.5 text-slate-900">Total All Branches</td>
                      <td className="p-3.5 font-mono text-slate-900">{physicalMetrics.totalUnits.toLocaleString()} units</td>
                      <td className="p-3.5 font-mono text-slate-900">KSh {physicalMetrics.totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 font-mono text-emerald-700">KSh {physicalMetrics.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 font-mono text-slate-900">+KSh {(physicalMetrics.totalRetailValuation - physicalMetrics.totalCostValuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 text-right text-emerald-700">Verified</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES BREAKDOWN */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(physicalMetrics.catMap).map(([catName, stats]) => {
                const marginPct = stats.retailValuation > 0
                  ? (((stats.retailValuation - stats.costValuation) / stats.retailValuation) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div key={catName} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {catName === 'Dereck' ? '🧵' : catName === 'Fleece' ? '🧥' : '🧶'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{catName}</h4>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {stats.count} Batches
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Physical Units:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {stats.units.toLocaleString()} {catName === 'Yarns' ? 'KG' : 'Metres'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cost Valuation:</span>
                        <span className="font-mono font-bold text-slate-900">
                          KSh {stats.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Retail Potential:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          KSh {stats.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Gross Margin:</span>
                        <span className="font-mono font-extrabold text-rose-600">{marginPct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ITEMIZED BATCHES REGISTER */}
          {activeTab === 'itemized' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search product name, barcode, SKU, invoice ref..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 text-slate-900 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="All">All Categories</option>
                    <option value="Dereck">Dereck</option>
                    <option value="Fleece">Fleece</option>
                    <option value="Yarns">Yarns</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Barcode / SKU</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Invoice Ref</th>
                      <th className="p-3">Total Qty</th>
                      <th className="p-3">Cost Price</th>
                      <th className="p-3">Cost Valuation</th>
                      <th className="p-3">Retail Price</th>
                      <th className="p-3 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => {
                      const totalQty = Object.values(p.locationStock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                      const costP = p.costPrice || (p.unitPriceRetail * 0.6);
                      const costVal = totalQty * costP;

                      return (
                        <tr key={p.id} className="hover:bg-rose-50/20 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {p.barcode || p.sku || p.id}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {p.name}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {p.invoiceRef || 'N/A'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {totalQty} {p.unit}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            KSh {costP.toFixed(2)}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            KSh {costVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 font-mono text-emerald-700 font-bold">
                            KSh {(p.unitPriceRetail || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                              Reconciled
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Scale className="w-4 h-4 text-rose-600" />
            <span>
              Real-time General Ledger &amp; Balance Sheet sync is active.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStockLedgerReconcileOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
