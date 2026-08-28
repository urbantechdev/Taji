import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { LocationId, DefectReasonType, CategoryType, FabricRollRecord } from '../types';
import {
  Scissors,
  Layers,
  Plus,
  AlertTriangle,
  Tag,
  CheckCircle2,
  Package,
  RotateCcw,
  Sparkles,
  X,
  Search,
  SlidersHorizontal,
  Info,
  Scale,
  ShieldCheck,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export const FabricRollManagerModal: React.FC = () => {
  const {
    fabricRolls,
    products,
    locations,
    activeLocation,
    isFabricRollModalOpen,
    setIsFabricRollModalOpen,
    addFabricRollBatchIntake,
    cutFabricFromRoll,
    logSpoiltFabricMeters,
    setIsReturnExchangeModalOpen,
    currentUser
  } = useERP();

  const [activeTab, setActiveTab] = useState<'roll_list' | 'batch_intake' | 'cut_dispense' | 'spoilage_cutout' | 'remnants'>('roll_list');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Fleece' | 'Dereck'>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'remnants' | 'depleted'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Batch Intake State (Variable Roll Lengths)
  const [intakeBatchId, setIntakeBatchId] = useState<string>(
    products.find(p => p.category === 'Fleece' || p.category === 'Dereck')?.id || products[0]?.id || ''
  );
  const [intakeLocationId, setIntakeLocationId] = useState<LocationId>(activeLocation);
  const [intakeWidthCm, setIntakeWidthCm] = useState<number>(160);
  const [intakeGsm, setIntakeGsm] = useState<number>(300);
  const [intakeSupplier, setIntakeSupplier] = useState<string>('Oster India Garment Fabrics / Udey Udyog');
  const [rollLengthsInput, setRollLengthsInput] = useState<string>('52.4, 48.0, 63.8, 55.0');
  const [intakeSuccessNote, setIntakeSuccessNote] = useState<string | null>(null);

  // Cutting Tool State
  const [selectedRollIdForCut, setSelectedRollIdForCut] = useState<string>(fabricRolls[0]?.id || '');
  const [metersToCut, setMetersToCut] = useState<number>(5.0);
  const [cutNotes, setCutNotes] = useState<string>('');
  const [cutFeedback, setCutFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Spoilt Meters Cutout State
  const [selectedRollIdForSpoilt, setSelectedRollIdForSpoilt] = useState<string>(fabricRolls[0]?.id || '');
  const [spoiltMeters, setSpoiltMeters] = useState<number>(2.5);
  const [spoiltReason, setSpoiltReason] = useState<DefectReasonType>('Weft / Warp Slub & Weaving Flaw');
  const [spoiltNotes, setSpoiltNotes] = useState<string>('2.5m of severe weaving slub and oil stain cut away before counter sale.');
  const [spoilageFeedback, setSpoilageFeedback] = useState<{ success: boolean; message: string; rmaId?: string } | null>(null);

  if (!isFabricRollModalOpen) return null;

  // Filter products for fabric only
  const fabricProducts = products.filter(p => p.category === 'Fleece' || p.category === 'Dereck');
  const selectedIntakeProduct = products.find(p => p.id === intakeBatchId);

  // Filtered rolls
  const filteredRolls = fabricRolls.filter(r => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (selectedLocation !== 'All' && r.locationId !== selectedLocation) return false;
    if (statusFilter === 'active' && (r.status === 'depleted' || r.isRemnant)) return false;
    if (statusFilter === 'remnants' && !r.isRemnant) return false;
    if (statusFilter === 'depleted' && r.status !== 'depleted') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.rollNumber.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.barcode.toLowerCase().includes(q) ||
        (r.colorName && r.colorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate parsed roll lengths for intake
  const parsedRollLengths = rollLengthsInput
    .split(/[\n,;\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n) && n > 0);

  const totalIntakeMeters = parsedRollLengths.reduce((a, b) => a + b, 0);
  const avgRollLength = parsedRollLengths.length > 0 ? (totalIntakeMeters / parsedRollLengths.length).toFixed(1) : '0';
  const estimatedIntakeValue = totalIntakeMeters * (selectedIntakeProduct?.unitPriceRetail || 650);

  // Active roll for cutting
  const activeCutRoll = fabricRolls.find(r => r.id === selectedRollIdForCut);
  const activeSpoiltRoll = fabricRolls.find(r => r.id === selectedRollIdForSpoilt);

  // Handle Batch Intake Submit
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedRollLengths.length === 0) return;

    const res = addFabricRollBatchIntake(
      intakeBatchId,
      intakeLocationId,
      parsedRollLengths,
      intakeWidthCm,
      intakeGsm,
      intakeSupplier
    );

    if (res.success) {
      setIntakeSuccessNote(res.message);
      setTimeout(() => {
        setIntakeSuccessNote(null);
        setActiveTab('roll_list');
      }, 1500);
    }
  };

  // Handle Normal Cut
  const handleExecuteCut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRollIdForCut || metersToCut <= 0) return;

    const res = cutFabricFromRoll(selectedRollIdForCut, metersToCut, undefined, false);
    setCutFeedback({ success: res.success, message: res.message });
  };

  // Handle Spoilt Cutout
  const handleExecuteSpoiltCutout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRollIdForSpoilt || spoiltMeters <= 0) return;

    const res = logSpoiltFabricMeters(selectedRollIdForSpoilt, spoiltMeters, spoiltReason, spoiltNotes);
    setSpoilageFeedback({ success: res.success, message: res.message, rmaId: res.rmaId });
  };

  // Summary Metrics
  const totalActiveMeters = fabricRolls.filter(r => r.status !== 'depleted').reduce((a, r) => a + r.currentLengthMeters, 0);
  const totalRemnantsCount = fabricRolls.filter(r => r.isRemnant && r.status !== 'depleted').length;
  const totalSpoiltCutouts = fabricRolls.reduce((a, r) => a + (r.spoiltMetersLogged || 0), 0);

  return (
    <div
      id="fabric-roll-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="fabric-roll-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-800/60 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Fabric Piece Goods &amp; Roll Inventory
                </h2>
                <span className="bg-teal-400/20 text-teal-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-teal-400/30">
                  Fleece &amp; Dereec (Meters)
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium">
                Variable meterage per roll intake, piece cutting, remnant bundle discounts &amp; defect cutout quarantine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsFabricRollModalOpen(false);
                setIsReturnExchangeModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-teal-100 text-xs font-bold rounded-lg border border-emerald-600/50 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open RMA Customer Returns & Claims"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">RMA Returns &amp; Claims</span>
            </button>
            <button
              onClick={() => setIsFabricRollModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-teal-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-emerald-950/40 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500 font-medium">Total Live Fabric:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {totalActiveMeters.toFixed(1)} Linear Meters
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500 font-medium">Active Rolls:</span>
              <span className="font-bold text-slate-800">
                {fabricRolls.filter(r => r.status !== 'depleted').length} rolls
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500 font-medium">Remnants (&le;3m):</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {totalRemnantsCount} pieces
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500 font-medium">Defect Cutouts:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {totalSpoiltCutouts.toFixed(1)}m quarantined
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Active Station: <strong className="text-slate-800">{locations.find(l => l.id === activeLocation)?.name}</strong>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('roll_list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'roll_list'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Roll Inventory Register ({fabricRolls.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('batch_intake')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'batch_intake'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Variable Roll Intake (Bale Receiving)</span>
            </button>

            <button
              onClick={() => setActiveTab('cut_dispense')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'cut_dispense'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cut &amp; Dispense Fabric</span>
            </button>

            <button
              onClick={() => setActiveTab('spoilage_cutout')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'spoilage_cutout'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Cut Out Spoilt Meters &amp; Quarantine</span>
            </button>

            <button
              onClick={() => setActiveTab('remnants')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'remnants'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Remnants Bin ({totalRemnantsCount})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* TAB 1: ROLL LIST REGISTER */}
          {activeTab === 'roll_list' && (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search roll #, barcode, color, product name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-700 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 outline-none focus:border-emerald-700"
                  >
                    <option value="All">All Fabrics (Fleece &amp; Dereec)</option>
                    <option value="Fleece">Fleece Only</option>
                    <option value="Dereck">Dereec Only</option>
                  </select>

                  {/* Location Filter */}
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 outline-none focus:border-emerald-700"
                  >
                    <option value="All">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 outline-none focus:border-emerald-700"
                  >
                    <option value="All">All Statuses</option>
                    <option value="active">Active Sellable Rolls</option>
                    <option value="remnants">Remnants (&le;3m)</option>
                    <option value="depleted">Depleted (0m)</option>
                  </select>

                  <button
                    onClick={() => setActiveTab('batch_intake')}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Receive New Bale</span>
                  </button>
                </div>
              </div>

              {/* Rolls Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Roll ID &amp; Barcode</th>
                      <th className="p-3">Fabric Product &amp; Shade</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Width / GSM</th>
                      <th className="p-3 text-right">Original</th>
                      <th className="p-3 text-right">Live Remaining</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRolls.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No fabric rolls match your search criteria. Click "Receive New Bale" to add rolls.
                        </td>
                      </tr>
                    ) : (
                      filteredRolls.map(roll => {
                        const pctRemaining = roll.initialLengthMeters > 0
                          ? Math.min(100, Math.round((roll.currentLengthMeters / roll.initialLengthMeters) * 100))
                          : 0;

                        return (
                          <tr key={roll.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium">
                              <div className="font-bold text-slate-900">{roll.rollNumber}</div>
                              <div className="text-[11px] font-mono text-slate-500">{roll.barcode}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {roll.colorHex && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: roll.colorHex }}
                                  />
                                )}
                                <div>
                                  <div className="font-bold text-slate-800">{roll.productName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {roll.category} • {roll.colorName || 'Default'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                {locations.find(l => l.id === roll.locationId)?.name || roll.locationId}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              <div>{roll.widthCm ? `${roll.widthCm} cm` : '160 cm'}</div>
                              <div className="text-[10px] text-slate-400">{roll.gsm ? `${roll.gsm} GSM` : '300 GSM'}</div>
                            </td>
                            <td className="p-3 text-right font-medium text-slate-500">
                              {roll.initialLengthMeters.toFixed(1)}m
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-black text-sm text-emerald-700">
                                {roll.currentLengthMeters.toFixed(2)}m
                              </div>
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    roll.isRemnant ? 'bg-amber-500' : 'bg-emerald-600'
                                  }`}
                                  style={{ width: `${pctRemaining}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {roll.status === 'depleted' ? (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Depleted
                                </span>
                              ) : roll.isRemnant ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                  Remnant End ({roll.remnantDiscountPct || 20}% Off)
                                </span>
                              ) : roll.status === 'sealed_full' ? (
                                <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                                  Full Sealed Roll
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                  Cutting Active
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedRollIdForCut(roll.id);
                                    setActiveTab('cut_dispense');
                                  }}
                                  disabled={roll.currentLengthMeters <= 0}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                  title="Cut meters for customer order"
                                >
                                  <Scissors className="w-3 h-3 text-emerald-600" />
                                  <span>Cut</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedRollIdForSpoilt(roll.id);
                                    setActiveTab('spoilage_cutout');
                                  }}
                                  disabled={roll.currentLengthMeters <= 0}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                  title="Cut out and isolate spoilt section"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Defect</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VARIABLE ROLL INTAKE (BALE RECEIVING) */}
          {activeTab === 'batch_intake' && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <span>Receive Fabric Bale with Variable Roll Meterages</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fleece and Dereec arrive in rolls of differing lengths. Enter each roll length to automatically generate individual roll records and update master stock.
                </p>
              </div>

              {intakeSuccessNote && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{intakeSuccessNote}</span>
                </div>
              )}

              <form onSubmit={handleIntakeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fabric Product Batch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={intakeBatchId}
                      onChange={e => setIntakeBatchId(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none font-bold"
                    >
                      {fabricProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category}) - KSh {p.unitPriceRetail}/m
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Receiving Store Location <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={intakeLocationId}
                      onChange={e => setIntakeLocationId(e.target.value as LocationId)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none font-medium"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fabric Width (cm)</label>
                    <input
                      type="number"
                      value={intakeWidthCm}
                      onChange={e => setIntakeWidthCm(parseFloat(e.target.value) || 160)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Grammage (GSM)</label>
                    <input
                      type="number"
                      value={intakeGsm}
                      onChange={e => setIntakeGsm(parseFloat(e.target.value) || 300)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer / Mill</label>
                    <input
                      type="text"
                      value={intakeSupplier}
                      onChange={e => setIntakeSupplier(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Roll Lengths in Meters (Separated by commas, spaces, or new lines) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      {parsedRollLengths.length} rolls detected
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={rollLengthsInput}
                    onChange={e => setRollLengthsInput(e.target.value)}
                    placeholder="e.g. 52.4, 48.0, 63.8, 55.0, 46.5"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Example: If bale has 4 rolls measuring 52.4m, 48.0m, 63.8m and 55.0m, enter: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">52.4, 48.0, 63.8, 55.0</code>
                  </p>
                </div>

                {/* Live Intake Summary Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      Batch Intake Preview
                    </div>
                    <div className="text-sm font-black text-emerald-950 mt-0.5">
                      {parsedRollLengths.length} Unique Rolls • Total: {totalIntakeMeters.toFixed(2)} Linear Meters
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      Average roll length: {avgRollLength}m | Est. Retail Value: KSh {estimatedIntakeValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {parsedRollLengths.slice(0, 6).map((len, idx) => (
                      <span key={idx} className="bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] px-2 py-0.5 rounded-md shadow-2xs">
                        R{idx + 1}: {len}m
                      </span>
                    ))}
                    {parsedRollLengths.length > 6 && (
                      <span className="bg-emerald-200 text-emerald-900 font-bold text-[11px] px-2 py-0.5 rounded-md">
                        +{parsedRollLengths.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('roll_list')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={parsedRollLengths.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Confirm &amp; Register {parsedRollLengths.length} Rolls</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CUT & DISPENSE FABRIC */}
          {activeTab === 'cut_dispense' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-emerald-600" />
                  <span>Piece Goods Cutting &amp; Counter Dispense</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deduct exact meters cut from an active roll. If remaining length falls below 3.0 meters, it will automatically be flagged as an End Remnant.
                </p>
              </div>

              {cutFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-bold animate-in fade-in ${
                    cutFeedback.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {cutFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{cutFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleExecuteCut} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Active Roll to Cut From <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRollIdForCut}
                    onChange={e => setSelectedRollIdForCut(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-emerald-700 outline-none font-bold"
                  >
                    {fabricRolls
                      .filter(r => r.currentLengthMeters > 0)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.rollNumber} - {r.productName} ({r.currentLengthMeters.toFixed(2)}m available) @ {r.locationId}
                        </option>
                      ))}
                  </select>
                </div>

                {activeCutRoll && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Length</span>
                      <span className="font-black text-slate-900 text-sm">
                        {activeCutRoll.currentLengthMeters.toFixed(2)}m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Color / Category</span>
                      <span className="font-bold text-slate-800">
                        {activeCutRoll.colorName} ({activeCutRoll.category})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Width</span>
                      <span className="font-bold text-slate-800">{activeCutRoll.widthCm || 160} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                      <span className="font-bold text-emerald-700">
                        {activeCutRoll.isRemnant ? 'Remnant' : 'Active Roll'}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meters to Cut <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max={activeCutRoll?.currentLengthMeters || 100}
                      value={metersToCut}
                      onChange={e => setMetersToCut(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 pr-12 text-slate-900 focus:bg-white focus:border-emerald-700 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Meters
                    </span>
                  </div>
                </div>

                {activeCutRoll && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <div className="flex items-center justify-between font-bold">
                      <span>Post-Cut Remaining Length:</span>
                      <span className="text-sm">
                        {Math.max(0, activeCutRoll.currentLengthMeters - metersToCut).toFixed(2)} meters
                      </span>
                    </div>
                    {activeCutRoll.currentLengthMeters - metersToCut <= 3.0 &&
                      activeCutRoll.currentLengthMeters - metersToCut > 0 && (
                        <div className="text-[11px] text-amber-800 mt-1 flex items-center gap-1 font-medium">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>This roll will become an End Remnant and automatically receive a clearance tag.</span>
                        </div>
                      )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!activeCutRoll || metersToCut <= 0 || metersToCut > activeCutRoll.currentLengthMeters}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Confirm Cut ({metersToCut}m)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SPOILAGE CUTOUT & QUARANTINE */}
          {activeTab === 'spoilage_cutout' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Cut Out Spoilt Fabric &amp; Transfer to Quarantine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  When fabric rolls have localized defects (slubs, grease stains, weaving flaws, or holes), cut out the defective length to isolate it into Quarantined Inventory for manufacturer claims.
                </p>
              </div>

              {spoilageFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-bold animate-in fade-in ${
                    spoilageFeedback.success
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <div>{spoilageFeedback.message}</div>
                    {spoilageFeedback.rmaId && (
                      <div className="text-[11px] text-rose-700 font-mono mt-0.5">
                        Quarantine RMA Ref: {spoilageFeedback.rmaId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleExecuteSpoiltCutout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Roll with Defect <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRollIdForSpoilt}
                    onChange={e => setSelectedRollIdForSpoilt(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-rose-700 outline-none font-bold"
                  >
                    {fabricRolls
                      .filter(r => r.currentLengthMeters > 0)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.rollNumber} - {r.productName} ({r.currentLengthMeters.toFixed(2)}m available)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Defective Meters to Cut Away <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max={activeSpoiltRoll?.currentLengthMeters || 50}
                        value={spoiltMeters}
                        onChange={e => setSpoiltMeters(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 pr-12 text-slate-900 focus:bg-white focus:border-rose-700 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Meters
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fabric Defect Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={spoiltReason}
                      onChange={e => setSpoiltReason(e.target.value as DefectReasonType)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-rose-700 outline-none font-medium"
                    >
                      <option value="Weft / Warp Slub & Weaving Flaw">Weft / Warp Slub &amp; Weaving Flaw</option>
                      <option value="Oil / Machine Grease Stain on Fabric">Oil / Machine Grease Stain</option>
                      <option value="Fabric Hole / Run / Tear">Fabric Hole / Run / Tear</option>
                      <option value="Color Shading / Dye Streaks across Width">Color Shading / Dye Streaks</option>
                      <option value="Selvage Edge Damage / Curling">Selvage Edge Damage / Curling</option>
                      <option value="Uneven Width / Short Meterage on Roll">Uneven Width / Short Meterage</option>
                      <option value="Pilling / Uneven Fleece Pile">Pilling / Uneven Fleece Pile</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inspection &amp; Defect Notes
                  </label>
                  <textarea
                    rows={2}
                    value={spoiltNotes}
                    onChange={e => setSpoiltNotes(e.target.value)}
                    placeholder="Describe the flaw and location on roll..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:border-rose-700 outline-none"
                  />
                </div>

                {/* Accounting Impact Card */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>Automatic Double-Entry Journal Entry</span>
                  </div>
                  <p className="text-[11px] text-rose-800 font-mono">
                    Dr. 1350 Quarantined Damaged Inventory Asset (KSh {(spoiltMeters * 400).toLocaleString()})
                    <br />
                    Cr. 1200 Store Active Inventory Asset (KSh {(spoiltMeters * 400).toLocaleString()})
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!activeSpoiltRoll || spoiltMeters <= 0 || spoiltMeters > activeSpoiltRoll.currentLengthMeters}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cut &amp; Quarantine {spoiltMeters}m</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: REMNANTS BIN */}
          {activeTab === 'remnants' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>End-of-Roll Remnants Bin (&le; 3.0 Meters)</span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Short end-pieces suitable for children's wear, craft projects, pocket lining, or clearance bundle sales.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-900 block">Total Remnants:</span>
                  <span className="text-lg font-black text-amber-950">{totalRemnantsCount} pieces</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {fabricRolls
                  .filter(r => r.isRemnant && r.status !== 'depleted')
                  .map(roll => (
                    <div
                      key={roll.id}
                      className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        {roll.remnantDiscountPct || 20}% Clearance
                      </div>

                      <div className="flex items-center gap-2">
                        {roll.colorHex && (
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: roll.colorHex }}
                          />
                        )}
                        <div>
                          <div className="font-black text-slate-900 text-xs">{roll.rollNumber}</div>
                          <div className="text-[11px] text-slate-500">{roll.productName}</div>
                        </div>
                      </div>

                      <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Piece Length:</span>
                        <span className="font-black text-amber-900 text-sm">
                          {roll.currentLengthMeters.toFixed(2)} meters
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Store: {locations.find(l => l.id === roll.locationId)?.name}</span>
                        <span>Width: {roll.widthCm || 160}cm</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRollIdForCut(roll.id);
                          setMetersToCut(roll.currentLengthMeters);
                          setActiveTab('cut_dispense');
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Dispense Whole Remnant ({roll.currentLengthMeters.toFixed(2)}m)</span>
                      </button>
                    </div>
                  ))}
              </div>

              {fabricRolls.filter(r => r.isRemnant && r.status !== 'depleted').length === 0 && (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  No active remnants under 3.0 meters at the moment. As rolls are cut down, they will automatically appear here.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600" />
            <span>Fleece &amp; Dereec tracking integrates with POS, inventory valuations, and supplier defect claims.</span>
          </div>

          <button
            onClick={() => setIsFabricRollModalOpen(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
