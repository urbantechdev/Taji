import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import { CategoryType, DeliveryRecord, UnitType } from '../../types';
import {
  Barcode,
  Scan,
  PackagePlus,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Layers,
  Truck,
  X,
  Plus,
  RefreshCw,
  Search,
  Check,
  Building2,
  Calendar,
  FileSpreadsheet,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { playAddToCartSound, playAlertSound, playClickSound, playSuccessSound } from '../../utils/audio';

interface ReceiveDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveDeliveryModal: React.FC<ReceiveDeliveryModalProps> = ({ isOpen, onClose }) => {
  const {
    deliveries,
    activeDeliveryId,
    startReceivingDelivery,
    scanDeliveryBarcode,
    autoCreateAndIntakeProduct,
    completeDelivery,
    createDelivery,
    getTotalAssetValuation,
    products,
    locations,
    activeLocation
  } = useERP();

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(
    activeDeliveryId || (deliveries.length > 0 ? deliveries[0].id : '')
  );
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQty, setScanQty] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Unrecognized Barcode Modal Prompt (Auto-Product Creation)
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Dereck');
  const [newColorName, setNewColorName] = useState('Classic Royal Navy');
  const [newColorHex, setNewColorHex] = useState('#1E3A8A');
  const [newUnit, setNewUnit] = useState<UnitType>('meter');
  const [newCostPrice, setNewCostPrice] = useState<number>(650);
  const [newRetailPrice, setNewRetailPrice] = useState<number>(1250);
  const [newBulkPrice, setNewBulkPrice] = useState<number>(980);

  // New Manifest Creation Modal
  const [isCreatingNewManifest, setIsCreatingNewManifest] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newWaybillRef, setNewWaybillRef] = useState('');
  const [newTargetLocation, setNewTargetLocation] = useState(activeLocation);

  // Delivery Dual-Weight Scale Mode
  const [isScaleIntakeMode, setIsScaleIntakeMode] = useState(false);
  const [deliveryGrossWeight, setDeliveryGrossWeight] = useState<number>(0);
  const [deliveryTareTarePerUnit, setDeliveryTarePerUnit] = useState<number>(0.050);
  const [deliveryCoreUnits, setDeliveryCoreUnits] = useState<number>(1);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedDeliveryId]);

  if (!isOpen) return null;

  const currentDelivery = deliveries.find(d => d.id === selectedDeliveryId) || deliveries[0];
  const globalAssetVal = getTotalAssetValuation();
  const locationAssetVal = getTotalAssetValuation(currentDelivery?.targetLocation || activeLocation);

  const handleSelectDelivery = (id: string) => {
    playClickSound();
    setSelectedDeliveryId(id);
    startReceivingDelivery(id);
    setFeedbackMsg(null);
    setUnrecognizedBarcode(null);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryId || !currentDelivery) {
      setFeedbackMsg({ type: 'error', text: 'Please select a delivery manifest first.' });
      return;
    }

    const code = barcodeInput.trim();
    if (!code) return;

    setFeedbackMsg(null);
    const result = scanDeliveryBarcode(selectedDeliveryId, code, scanQty);

    if (result.isNewProduct) {
      playAlertSound();
      setUnrecognizedBarcode(code);
      setNewProductName(`Imported Textile Item (${code.slice(-6)})`);
      setFeedbackMsg({
        type: 'info',
        text: `Barcode "${code}" is unrecognized in product database. Auto-creating product record...`
      });
    } else if (result.success) {
      playAddToCartSound();
      setFeedbackMsg({
        type: 'success',
        text: `Scanned & Received: ${result.productName} (+${result.scannedQty} units)`
      });
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } else {
      playAlertSound();
      setFeedbackMsg({ type: 'error', text: result.message });
    }
  };

  const handleConfirmAutoProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unrecognizedBarcode || !selectedDeliveryId) return;

    const res = autoCreateAndIntakeProduct(selectedDeliveryId, {
      barcode: unrecognizedBarcode,
      name: newProductName || `Textile Item ${unrecognizedBarcode.slice(-4)}`,
      category: newCategory,
      colorName: newColorName,
      colorHex: newColorHex,
      unit: newUnit,
      costPrice: Number(newCostPrice) || 600,
      unitPriceRetail: Number(newRetailPrice) || 1200,
      unitPriceBulk: Number(newBulkPrice) || 950,
      quantity: Number(scanQty) || 1
    });

    if (res.success) {
      playSuccessSound();
      setFeedbackMsg({
        type: 'success',
        text: `New Product "${res.product?.name}" auto-created and ${scanQty} unit(s) intaked!`
      });
      setUnrecognizedBarcode(null);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleCompleteDeliveryIntake = () => {
    if (!selectedDeliveryId) return;
    const res = completeDelivery(selectedDeliveryId);
    if (res.success) {
      playSuccessSound();
      setFeedbackMsg({ type: 'success', text: res.message });
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleCreateManifestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier) return;

    const res = createDelivery({
      supplierName: newSupplier,
      waybillNumber: newWaybillRef || `WB-${Date.now().toString().slice(-6)}`,
      targetLocation: newTargetLocation,
      items: [],
      notes: 'Direct Barcode Intake Manifest'
    });

    if (res.success && res.deliveryId) {
      setSelectedDeliveryId(res.deliveryId);
      startReceivingDelivery(res.deliveryId);
      setIsCreatingNewManifest(false);
      setNewSupplier('');
      setNewWaybillRef('');
      setFeedbackMsg({ type: 'success', text: `New Delivery Manifest ${res.deliveryId} created.` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-white p-4 sm:p-5 flex items-center justify-between shadow-lg">
          <ReflectionOverlay />
          <RightEdgeBlend variant="rainbow" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-400/40 text-rose-300 flex items-center justify-center shadow-inner">
              <Barcode className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Barcode Inventory Intake &amp; Asset Valuation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  Live Scanner Mode
                </span>
              </div>
              <p className="text-xs text-rose-200/90 font-medium">
                Auto-Product Creation on Unrecognized Barcodes • Real-Time Dynamic Valuation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:rotate-90 relative z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Valuation Summary Bar (Calculates in real time) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Manifest Scanned Qty
            </span>
            <span className="text-sm sm:text-lg font-mono font-black text-amber-300 flex items-center gap-1">
              <Layers className="w-4 h-4 text-amber-400" />
              {currentDelivery ? currentDelivery.totalScannedQty : 0} units
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Manifest Cost Valuation
            </span>
            <span className="text-sm sm:text-lg font-mono font-black text-rose-300">
              KSh {currentDelivery ? currentDelivery.totalCostValuation.toLocaleString() : 0}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Manifest Retail Asset Value
            </span>
            <span className="text-sm sm:text-lg font-mono font-black text-emerald-400">
              KSh {currentDelivery ? currentDelivery.totalRetailValuation.toLocaleString() : 0}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Global Inventory Value
            </span>
            <span className="text-sm sm:text-lg font-mono font-black text-cyan-300">
              KSh {globalAssetVal.totalRetailValuation.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50">
          
          {/* Manifest Selector and Quick Creation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Select Active Delivery Manifest:
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNewManifest(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Supplier Delivery</span>
              </button>
            </div>

            {/* Delivery Cards Carousel / List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {deliveries.map(del => {
                const isSelected = del.id === selectedDeliveryId;
                const locName = locations.find(l => l.id === del.targetLocation)?.name || del.targetLocation;

                return (
                  <button
                    key={del.id}
                    type="button"
                    onClick={() => handleSelectDelivery(del.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-400/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">{del.id}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          del.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : del.status === 'receiving'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {del.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{del.supplierName}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Dest: {locName}</span>
                      <span className="font-mono font-bold text-rose-700">{del.totalScannedQty} units</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Intake Scanner Bar */}
          {currentDelivery && (
            <div className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/40 p-4 sm:p-5 rounded-2xl border-2 border-rose-300 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-rose-600 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Active Intake Scanner Mode ({currentDelivery.id})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Destination Depot: <strong>{locations.find(l => l.id === currentDelivery.targetLocation)?.name}</strong> • Supplier: <strong>{currentDelivery.supplierName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsScaleIntakeMode(!isScaleIntakeMode);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      isScaleIntakeMode
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                    title="Toggle Gross Scale Weighing & Core Deduction Calculator"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>{isScaleIntakeMode ? 'Scale Mode: Active' : 'Gross Scale Mode'}</span>
                  </button>

                  <span className="text-[11px] font-bold text-slate-600">Scan Multiplier:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={scanQty}
                    onChange={e => setScanQty(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Delivery Gross-to-Net Scale Calculator Panel */}
              {isScaleIntakeMode && (
                <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-xs space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 text-rose-800">
                      <Scale className="w-4 h-4 text-rose-600" />
                      Receiving Scale (Gross to Pure Net Inventory Conversion)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Avoid Balance Sheet inflation by deducting packaging cores
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Gross Weight from Scale (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={deliveryGrossWeight || ''}
                        onChange={(e) => setDeliveryGrossWeight(parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 52.500"
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Packaging Core Weight (kg/unit)</label>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        value={deliveryTareTarePerUnit}
                        onChange={(e) => setDeliveryTarePerUnit(parseFloat(e.target.value) || 0.050)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Total Bobbins/Rolls Count</label>
                      <input
                        type="number"
                        min="1"
                        value={deliveryCoreUnits}
                        onChange={(e) => setDeliveryCoreUnits(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  {(() => {
                    const totalTare = deliveryTareTarePerUnit * deliveryCoreUnits;
                    const calculatedNet = Math.max(0, deliveryGrossWeight - totalTare);
                    return (
                      <div className="p-2 bg-rose-50/60 rounded-lg border border-rose-200 flex items-center justify-between">
                        <div className="text-[11px]">
                          <span className="text-slate-600 block">Total Packaging Tare Deducted:</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{totalTare.toFixed(3)} kg ({deliveryCoreUnits} cores @ {(deliveryTareTarePerUnit * 1000).toFixed(0)}g)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-600 text-[11px] block">Actual Net Stock to Record:</span>
                          <span className="font-mono font-black text-emerald-700 text-sm">
                            {calculatedNet.toFixed(3)} kg
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (calculatedNet > 0) {
                              setScanQty(Number(calculatedNet.toFixed(3)));
                              playSuccessSound();
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Use {calculatedNet.toFixed(2)} kg as Intake Qty</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Main Barcode Scanner Input Form */}
              <form onSubmit={handleScanSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode with hardware scanner or type SKU/barcode and hit Enter..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-300 focus:border-rose-500 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Intake</span>
                </button>
              </form>

              {/* Quick Barcode Simulator Buttons for testing */}
              <div className="pt-2 border-t border-rose-100 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Test Barcode Presets:
                </span>
                {products.slice(0, 3).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setBarcodeInput(p.barcode || p.sku);
                      scanDeliveryBarcode(selectedDeliveryId, p.barcode || p.sku, scanQty);
                      playAddToCartSound();
                      setFeedbackMsg({
                        type: 'success',
                        text: `Simulated scan of ${p.name} (+${scanQty})`
                      });
                      setBarcodeInput('');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-700 shadow-2xs cursor-pointer"
                  >
                    {p.name.split(' ')[0]} ({p.barcode || p.sku})
                  </button>
                ))}
                
                {/* Unrecognized barcode simulator */}
                <button
                  type="button"
                  onClick={() => {
                    const testNewCode = `NEW-BARCODE-${Math.floor(1000 + Math.random() * 9000)}`;
                    setBarcodeInput(testNewCode);
                    setUnrecognizedBarcode(testNewCode);
                    setNewProductName(`Imported Fabric (${testNewCode.slice(-4)})`);
                    playAlertSound();
                  }}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer"
                >
                  ⚡ Simulate New / Unrecognized Barcode
                </button>
              </div>

              {/* Alert Feedback Banner */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : feedbackMsg.type === 'info'
                      ? 'bg-cyan-50 border border-cyan-200 text-cyan-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedbackMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* UNRECOGNIZED BARCODE AUTO-PRODUCT CREATION PROMPT */}
          {unrecognizedBarcode && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 p-5 rounded-2xl border-2 border-amber-400 shadow-lg space-y-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Unrecognized Barcode Detected: {unrecognizedBarcode}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Auto-generating new product record and intaking into inventory on the fly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUnrecognizedBarcode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAutoProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                    Product Name:
                  </label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as CategoryType)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Dereck">Dereck</option>
                    <option value="Fleece">Fleece</option>
                    <option value="Yarns">Yarns</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                    Color Name:
                  </label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                    Unit Cost Price (KSh):
                  </label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={e => setNewCostPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                    Unit Retail Price (KSh):
                  </label>
                  <input
                    type="number"
                    value={newRetailPrice}
                    onChange={e => setNewRetailPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnrecognizedBarcode(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>Auto-Create &amp; Intake {scanQty} Unit(s)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delivery Manifest Items Manifest Table */}
          {currentDelivery && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Scanned Manifest Items ({currentDelivery.items.length} product lines):
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Valuation: <strong className="text-rose-700">KSh {currentDelivery.totalCostValuation.toLocaleString()}</strong> cost / <strong className="text-emerald-700">KSh {currentDelivery.totalRetailValuation.toLocaleString()}</strong> retail
                </span>
              </div>

              {currentDelivery.items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  <Barcode className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No barcodes scanned yet for this delivery manifest.</p>
                  <p className="text-[10px] text-slate-400">Scan barcodes in the intake bar above to add stock in real time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Barcode / SKU</th>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3 text-center">Scanned Qty</th>
                        <th className="py-2 px-3 text-right">Cost Price</th>
                        <th className="py-2 px-3 text-right">Retail Price</th>
                        <th className="py-2 px-3 text-right">Asset Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDelivery.items.map(it => (
                        <tr key={it.batchId} className="hover:bg-rose-50/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{it.barcode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.productName}</td>
                          <td className="py-2 px-3 text-center font-mono font-black text-rose-700 bg-rose-50/60 rounded">
                            {it.scannedQty} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            KSh {it.costPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            KSh {it.retailPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                            KSh {(it.retailPrice * it.scannedQty).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Modal for Creating New Manifest */}
          {isCreatingNewManifest && (
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Create New Delivery Manifest</h4>
              <form onSubmit={handleCreateManifestSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Supplier / Factory Name:</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={e => setNewSupplier(e.target.value)}
                    placeholder="e.g. Mombasa Textiles Ltd"
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Waybill / Invoice #:</label>
                  <input
                    type="text"
                    value={newWaybillRef}
                    onChange={e => setNewWaybillRef(e.target.value)}
                    placeholder="e.g. WB-99201"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Target Warehouse:</label>
                  <select
                    value={newTargetLocation}
                    onChange={e => setNewTargetLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewManifest(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    Save Manifest
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          {currentDelivery && currentDelivery.status !== 'completed' && (
            <button
              type="button"
              onClick={handleCompleteDeliveryIntake}
              disabled={currentDelivery.items.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalize &amp; Post Delivery Intake to Ledger</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
