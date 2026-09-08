import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  InvoiceInventoryBatch,
  InvoiceInventoryBatchItem,
  InvoiceBatchRollItem
} from '../../types';
import {
  FileSpreadsheet,
  Ship,
  Search,
  Plus,
  QrCode,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Boxes,
  Eye,
  X
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { generateRealBarcodeDataURL, generateRealQRCodeDataURL } from '../../utils/realQrBarcode';

interface InvoiceBatchesDrillDownViewProps {
  onOpenCostingSuite?: () => void;
  onOpenInwardWizard?: () => void;
}

export const InvoiceBatchesDrillDownView: React.FC<InvoiceBatchesDrillDownViewProps> = ({
  onOpenCostingSuite,
  onOpenInwardWizard
}) => {
  const { invoiceBatches, locations } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Capitalized' | 'Assessed' | 'Pending Clearance'>('all');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(() => {
    return invoiceBatches && invoiceBatches.length > 0 ? invoiceBatches[0].id : null;
  });
  const [activeSubTab, setActiveSubTab] = useState<'line_items' | 'rolls' | 'customs_summary'>('line_items');
  const [selectedRollForBarcode, setSelectedRollForBarcode] = useState<InvoiceBatchRollItem | null>(null);
  const [rollQrUrl, setRollQrUrl] = useState<string>('');

  const rollBarcodeUrl = useMemo(() => {
    if (!selectedRollForBarcode) return '';
    return generateRealBarcodeDataURL(
      selectedRollForBarcode.barcode || selectedRollForBarcode.rollNumber,
      { format: 'CODE128', height: 48, width: 2, displayValue: true }
    );
  }, [selectedRollForBarcode]);

  useEffect(() => {
    if (!selectedRollForBarcode) return;
    let isMounted = true;
    const payload = JSON.stringify({
      type: 'FABRIC_ROLL',
      rollNumber: selectedRollForBarcode.rollNumber,
      barcode: selectedRollForBarcode.barcode,
      netWeightKg: selectedRollForBarcode.netWeightKg,
      lengthMeters: selectedRollForBarcode.lengthMeters
    });
    generateRealQRCodeDataURL(payload, { width: 140, margin: 1 }).then(url => {
      if (isMounted) setRollQrUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedRollForBarcode]);

  // Filtered invoice batches list
  const filteredBatches = useMemo(() => {
    if (!invoiceBatches) return [];
    return invoiceBatches.filter(batch => {
      const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesSearch =
        batch.invoiceNumber.toLowerCase().includes(q) ||
        batch.supplierName.toLowerCase().includes(q) ||
        (batch.customsEntryNo && batch.customsEntryNo.toLowerCase().includes(q)) ||
        (batch.kraEslipRef && batch.kraEslipRef.toLowerCase().includes(q)) ||
        batch.lineItems.some(li =>
          li.description.toLowerCase().includes(q) ||
          li.hsCode.toLowerCase().includes(q)
        );

      return matchesStatus && matchesSearch;
    });
  }, [invoiceBatches, statusFilter, searchQuery]);

  // Selected batch
  const selectedBatch = useMemo(() => {
    if (!invoiceBatches || invoiceBatches.length === 0) return null;
    return invoiceBatches.find(b => b.id === selectedBatchId) || invoiceBatches[0];
  }, [invoiceBatches, selectedBatchId]);

  // Summary Metrics across all batches
  const summaryMetrics = useMemo(() => {
    if (!invoiceBatches) {
      return { totalBatches: 0, totalLandedCostKES: 0, totalMeters: 0, totalNetKg: 0, totalRolls: 0 };
    }
    return invoiceBatches.reduce(
      (acc, batch) => {
        acc.totalBatches += 1;
        acc.totalLandedCostKES += batch.totalLandedCostKES || 0;
        acc.totalNetKg += batch.totalNetWeightKg || 0;
        let rollsCount = 0;
        let meters = 0;
        batch.lineItems.forEach(li => {
          rollsCount += (li.rolls ? li.rolls.length : li.rollsCount || 0);
          meters += (li.fabricLengthMetres || 0);
        });
        acc.totalRolls += rollsCount;
        acc.totalMeters += meters;
        return acc;
      },
      { totalBatches: 0, totalLandedCostKES: 0, totalMeters: 0, totalNetKg: 0, totalRolls: 0 }
    );
  }, [invoiceBatches]);

  // Selected batch rolls flat list
  const selectedBatchRolls = useMemo(() => {
    if (!selectedBatch) return [];
    const allRolls: { itemDesc: string; roll: InvoiceBatchRollItem }[] = [];
    selectedBatch.lineItems.forEach(li => {
      if (li.rolls && li.rolls.length > 0) {
        li.rolls.forEach(r => {
          allRolls.push({ itemDesc: li.description, roll: r });
        });
      }
    });
    return allRolls;
  }, [selectedBatch]);

  return (
    <div className="space-y-6" id="invoice-batches-drilldown-view">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Inward Commercial Invoices &amp; Batch Roll Drill-Down
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {invoiceBatches?.length || 0} Batches Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live traceability connecting foreign commercial proformas and KRA ICMS Customs SAD entries directly into localized inventory batches, landed unit pricing, and barcode-tagged fabric rolls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onOpenInwardWizard && (
            <button
              type="button"
              id="btn-intake-new-invoice"
              onClick={() => {
                playClickSound();
                onOpenInwardWizard();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Intake Inward Invoice</span>
            </button>
          )}

          {onOpenCostingSuite && (
            <button
              type="button"
              id="btn-open-costing-suite"
              onClick={() => {
                playClickSound();
                onOpenCostingSuite();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Ship className="w-4 h-4" />
              <span>Costing &amp; Tax Suite</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Inward Invoices</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            {summaryMetrics.totalBatches}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Commercial shipments synced</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Landed Asset Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            KSh {Math.round(summaryMetrics.totalLandedCostKES).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Capitalized into inventory ledger</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Fabric Length / Net Wt</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            {Math.round(summaryMetrics.totalMeters).toLocaleString()} m
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {Math.round(summaryMetrics.totalNetKg).toLocaleString()} kg total net weight
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Barcoded Rolls</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            {summaryMetrics.totalRolls}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Piece-level inspection rolls</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="input-search-invoice-batches"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, supplier, customs SAD entry, or HS code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
          {(['all', 'Capitalized', 'Assessed', 'Pending Clearance'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => {
                playClickSound();
                setStatusFilter(st);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Batches' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Batch Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Commercial Invoice Batches ({filteredBatches.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to inspect drill-down</span>
          </div>

          {filteredBatches.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold">No invoice batches match your search criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-3 text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            filteredBatches.map(batch => {
              const isSelected = selectedBatch?.id === batch.id;
              const statusColor =
                batch.status === 'Capitalized'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : batch.status === 'Assessed'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={batch.id}
                  id={`batch-card-${batch.id}`}
                  onClick={() => {
                    playClickSound();
                    setSelectedBatchId(batch.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {batch.invoiceNumber}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {batch.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1 truncate max-w-[240px]">
                        {batch.supplierName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-slate-900 font-mono">
                        KSh {Math.round(batch.totalLandedCostKES).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ${batch.totalFOB_USD.toLocaleString()} FOB
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                    <div>
                      <span className="block text-[10px] text-slate-400">Length/Weight</span>
                      <span className="font-semibold text-slate-700">
                        {batch.totalQuantity.toLocaleString()} {batch.totalQuantityUnit}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400">Customs SAD</span>
                      <span className="font-semibold text-slate-700 truncate block font-mono text-[10px]" title={batch.customsEntryNo}>
                        {batch.customsEntryNo || 'Pending SAD'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400">Lines/Rolls</span>
                      <span className="font-semibold text-slate-700">
                        {batch.lineItems.length} lines • {batch.lineItems.reduce((sum, li) => sum + (li.rolls?.length || li.rollsCount || 0), 0)} rolls
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Batch Detail View */}
        <div className="lg:col-span-7">
          {selectedBatch ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Batch Detail Header */}
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg font-black text-slate-900 font-mono">
                        Invoice {selectedBatch.invoiceNumber}
                      </h3>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                        {selectedBatch.supplierCountry || 'China'}
                      </span>
                      {selectedBatch.journalRef && (
                        <span className="text-[11px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200">
                          {selectedBatch.journalRef}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-600 mt-1">
                      {selectedBatch.supplierName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenCostingSuite && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onOpenCostingSuite();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Reconcile with customs declarations in costing module"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Audit in Costing</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Header Metadata Tags */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Customs Entry No</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {selectedBatch.customsEntryNo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">KRA E-Slip Ref</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {selectedBatch.kraEslipRef || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">FX Spot Rate</span>
                    <span className="font-mono font-bold text-slate-800">
                      KSh {selectedBatch.exchangeRate.toFixed(2)}/USD
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Destination Store</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedBatch.destinationLocationName || selectedBatch.destinationLocationId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center border-b border-slate-200 px-5 bg-white gap-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('line_items')}
                  className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeSubTab === 'line_items'
                      ? 'border-rose-600 text-rose-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Line Items &amp; Costing ({selectedBatch.lineItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('rolls')}
                  className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeSubTab === 'rolls'
                      ? 'border-rose-600 text-rose-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Rolls &amp; Barcode Registry ({selectedBatchRolls.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('customs_summary')}
                  className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeSubTab === 'customs_summary'
                      ? 'border-rose-600 text-rose-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tax &amp; Levies Forensic</span>
                </button>
              </div>

              {/* Sub-Tab Content: Line Items */}
              {activeSubTab === 'line_items' && (
                <div className="p-5 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-2.5 font-bold">Item Description</th>
                          <th className="pb-2.5 font-bold">HS Code</th>
                          <th className="pb-2.5 font-bold text-right">Quantity</th>
                          <th className="pb-2.5 font-bold text-right">FOB ($)</th>
                          <th className="pb-2.5 font-bold text-right">Landed Unit (KES)</th>
                          <th className="pb-2.5 font-bold text-right">Suggested Retail</th>
                          <th className="pb-2.5 font-bold text-right">Total Landed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedBatch.lineItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 pr-2">
                              <div className="font-extrabold text-slate-900">{item.description}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {item.gsm ? `${item.gsm} GSM` : ''} {item.widthCm ? `• ${item.widthCm}cm` : ''} • {item.rollsCount || 0} rolls
                              </div>
                            </td>
                            <td className="py-3 font-mono text-[11px] text-slate-600">
                              {item.hsCode}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-700">
                              {item.quantity.toLocaleString()} {item.unit}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-700">
                              ${item.fobUSD.toLocaleString()}
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-900">
                              KSh {Math.round(item.landedCostKESPerUnit).toLocaleString()}
                              <span className="text-[10px] text-slate-400 block font-normal">/{item.unit}</span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-emerald-700">
                              KSh {Math.round(item.suggestedRetailPriceKES).toLocaleString()}
                            </td>
                            <td className="py-3 text-right font-mono font-black text-slate-900">
                              KSh {Math.round(item.totalLandedCostKES).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Total Batch Landed Inventory Value:</span>
                    <span className="text-sm font-black text-rose-700 font-mono">
                      KSh {Math.round(selectedBatch.totalLandedCostKES).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-Tab Content: Rolls & Barcodes */}
              {activeSubTab === 'rolls' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700">
                        Fabric Rolls Registry ({selectedBatchRolls.length} pieces)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Individual piece weights, tare, length, and warehouse barcodes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        window.print();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print Roll Barcode Sheet</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="p-2.5 font-bold">Roll #</th>
                          <th className="p-2.5 font-bold">Barcode</th>
                          <th className="p-2.5 font-bold">Item</th>
                          <th className="p-2.5 font-bold text-right">Net Wt (kg)</th>
                          <th className="p-2.5 font-bold text-right">Gross Wt (kg)</th>
                          <th className="p-2.5 font-bold text-right">Length (m)</th>
                          <th className="p-2.5 font-bold text-center">Status</th>
                          <th className="p-2.5 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedBatchRolls.map(({ itemDesc, roll }) => (
                          <tr key={roll.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-slate-800">
                              {roll.rollNumber}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {roll.barcode}
                            </td>
                            <td className="p-2.5 text-slate-700 truncate max-w-[140px]" title={itemDesc}>
                              {itemDesc}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-800 font-bold">
                              {roll.netWeightKg}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500">
                              {roll.grossWeightKg}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-800 font-bold">
                              {roll.lengthMeters} m
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                roll.inspectionStatus === 'Passed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {roll.inspectionStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  setSelectedRollForBarcode(roll);
                                }}
                                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                title="View barcode tag"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab Content: Tax & Levies Forensic */}
              {activeSubTab === 'customs_summary' && (
                <div className="p-5 space-y-4">
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Customs Declaration Reference:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {selectedBatch.customsEntryNo || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">KRA E-Slip Number:</span>
                      <span className="text-xs font-mono font-bold text-blue-300">
                        {selectedBatch.kraEslipRef || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Statutory Levies Applied:</span>
                      <span className="text-xs font-semibold text-slate-300">
                        Import Duty (25% / $750/T) • IDF (2.5%) • RDL (2.0%) • MSS ($1.75/T)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-xs font-bold text-slate-300">General Ledger Capitalization Journal:</span>
                      <span className="text-xs font-mono font-bold text-rose-300">
                        {selectedBatch.journalRef || 'Pending Journal'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    To modify statutory customs declarations, adjust specific per-tonne rates, or reconcile variances between proforma invoices and final ICMS assessment entries, switch to the Accountant Landed Costing &amp; Tax Suite.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <p className="text-xs">Select an inward commercial invoice on the left to inspect its lines and rolls.</p>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Tag Preview Modal */}
      {selectedRollForBarcode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-rose-600" />
                <span className="font-extrabold text-sm text-slate-900">Roll Tag Barcode</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRollForBarcode(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                TAJI KNITTERS LIMITED
              </span>
              <div className="text-base font-black text-slate-900 font-mono">
                {selectedRollForBarcode.rollNumber}
              </div>

              {/* Genuine Scannable Code128 Barcode & QR Code */}
              <div className="my-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col items-center">
                {rollBarcodeUrl && (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={rollBarcodeUrl}
                      alt={selectedRollForBarcode.barcode}
                      className="h-12 max-w-full object-contain mx-auto"
                    />
                  </div>
                )}
                {rollQrUrl && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 w-full">
                    <img
                      src={rollQrUrl}
                      alt="Roll QR"
                      className="w-14 h-14 object-contain"
                    />
                    <div className="text-left text-[9.5px] font-mono text-slate-500">
                      <p className="font-bold text-slate-800">SCANNABLE ROLL TOKEN</p>
                      <p>Roll: {selectedRollForBarcode.rollNumber}</p>
                      <p>Barcode: {selectedRollForBarcode.barcode}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 text-left text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Net Weight:</span>
                  <span className="font-bold text-slate-800">{selectedRollForBarcode.netWeightKg} kg</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Length:</span>
                  <span className="font-bold text-slate-800">{selectedRollForBarcode.lengthMeters} m</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                window.print();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
