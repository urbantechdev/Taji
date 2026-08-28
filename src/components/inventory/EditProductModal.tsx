import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductBatch, CategoryType, UnitType, LocationId } from '../../types';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Cloud,
  CheckCircle,
  Sparkles,
  DollarSign,
  Layers,
  Scale,
  Package,
  Store,
  Tag,
  Barcode,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';

interface EditProductModalProps {
  product: ProductBatch;
  onClose: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose }) => {
  const {
    updateProductBatch,
    deleteProductBatch,
    locations,
    isSuperAdmin,
    isAdmin,
    brandSettings
  } = useERP();

  // Form State
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode || product.sku);
  const [category, setCategory] = useState<CategoryType>(product.category);
  const [subCategory, setSubCategory] = useState(product.subCategory || '');
  const [fiberComposition, setFiberComposition] = useState(product.fiberComposition || '');
  const [colorName, setColorName] = useState(product.colorName || '');
  const [colorHex, setColorHex] = useState(product.colorHex || '#1E3A8A');
  const [unit, setUnit] = useState<UnitType>(product.unit);
  const [unitPriceRetail, setUnitPriceRetail] = useState<number>(product.unitPriceRetail);
  const [unitPriceBulk, setUnitPriceBulk] = useState<number>(product.unitPriceBulk);
  const [costPrice, setCostPrice] = useState<number>(product.costPrice);
  const [minReorderLevel, setMinReorderLevel] = useState<number>(product.minReorderLevel);
  const [imageUrl, setImageUrl] = useState<string>(product.imageUrl || '');

  // Yarn Specifications (Defaults: 24.000kg Net, 24.840kg Gross, 12 Cones)
  const [yarnCount, setYarnCount] = useState<string>(product.yarnCount || '2/24 NM');
  const [dyeLot, setDyeLot] = useState<string>(product.dyeLot || '');
  const [shadeCode, setShadeCode] = useState<string>(product.shadeCode || '');
  const [bagNumber, setBagNumber] = useState<string>(product.bagNumber || '');
  const [packagesCount, setPackagesCount] = useState<number>(product.packagesCount || 12);
  const [netWeightKg, setNetWeightKg] = useState<number>(product.netWeightKg || 24.000);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(product.grossWeightKg || 24.840);
  const [tareWeightKg, setTareWeightKg] = useState<number>(product.tareWeightKg || 0.840);
  const [manufacturer, setManufacturer] = useState<string>(product.manufacturer || (brandSettings.brandName ? `${brandSettings.brandName} TEXTILES` : 'TAJI TEXTILES'));

  // Branch Stocks
  const [locationStock, setLocationStock] = useState<Record<LocationId, number>>({
    ...product.locationStock
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculations
  const grossMarginKsh = unitPriceRetail - costPrice;
  const grossMarginPercent = costPrice > 0 ? Math.round((grossMarginKsh / costPrice) * 100) : 0;
  const totalUnitsAcrossStores = (Object.values(locationStock) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleStockChange = (locId: LocationId, val: number) => {
    setLocationStock(prev => ({
      ...prev,
      [locId]: Math.max(0, val)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setFeedback({ type: 'error', message: 'Product Name and SKU/Barcode are required.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const updates: Partial<ProductBatch> = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim().toUpperCase(),
      category,
      subCategory: subCategory.trim() || `${category} Stock`,
      fiberComposition: fiberComposition.trim(),
      colorName: colorName.trim(),
      colorHex,
      unit,
      unitPriceRetail: Number(unitPriceRetail),
      unitPriceBulk: Number(unitPriceBulk),
      costPrice: Number(costPrice),
      minReorderLevel: Number(minReorderLevel),
      imageUrl: imageUrl.trim() || undefined,
      yarnCount: category === 'Yarns' ? yarnCount : undefined,
      dyeLot: category === 'Yarns' ? dyeLot : undefined,
      shadeCode: category === 'Yarns' ? shadeCode : undefined,
      bagNumber: category === 'Yarns' ? bagNumber : undefined,
      packagesCount: category === 'Yarns' ? Number(packagesCount) : undefined,
      netWeightKg: category === 'Yarns' ? Number(netWeightKg) : undefined,
      grossWeightKg: category === 'Yarns' ? Number(grossWeightKg) : undefined,
      tareWeightKg: category === 'Yarns' ? Number(tareWeightKg) : undefined,
      weightPerPackageKg: category === 'Yarns' && packagesCount > 0 ? Number((netWeightKg / packagesCount).toFixed(3)) : undefined,
      manufacturer: category === 'Yarns' ? manufacturer : undefined,
      locationStock
    };

    const res = await updateProductBatch(product.id, updates);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteProductBatch(product.id);
    setIsDeleting(false);
    if (res.success) {
      onClose();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner text-white font-bold"
              style={{ backgroundColor: colorHex }}
            >
              <Tag className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {brandSettings.brandName || 'TAJI'} Item Master Editor
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {product.id}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" /> Global Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {brandSettings.brandName || 'TAJI'} Enterprise Cloud Database • Real-time synchronization across all stores and devices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Row: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 shadow-sm"
                placeholder="e.g. Royal Navy Heavyweight Dereck"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CategoryType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 bg-white shadow-sm"
              >
                <option value="Dereck">Dereck</option>
                <option value="Fleece">Fleece</option>
                <option value="Yarns">Yarns</option>
              </select>
            </div>
          </div>

          {/* Identification & Barcodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                SKU / Batch Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={e => setSku(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold text-slate-800 uppercase"
                  placeholder="TFX-DRK-101"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Barcode / UPC
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-800"
                  placeholder="Barcode number"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Sub-Category / Fabric Grade
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                placeholder="e.g. Polar Fleece, Superfine Weave"
              />
            </div>
          </div>

          {/* Color & Material Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Color Name
              </label>
              <input
                type="text"
                value={colorName}
                onChange={e => setColorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                placeholder="e.g. Midnight Navy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Color Swatch
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 bg-white"
              >
                <option value="meter">Meters (m)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="roll">Rolls</option>
                <option value="skein">Skeins</option>
                <option value="yard">Yards</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Min Reorder Alert Level
              </label>
              <input
                type="number"
                min="0"
                value={minReorderLevel}
                onChange={e => setMinReorderLevel(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Fiber Composition & Specification
              </label>
              <input
                type="text"
                value={fiberComposition}
                onChange={e => setFiberComposition(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                placeholder="e.g. 100% Superfine Cotton, 80% Acrylic 20% Wool"
              />
            </div>
          </div>

          {/* Yarn Specific Batch Specifications & Mass Configurator */}
          {category === 'Yarns' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 p-4 rounded-xl border-2 border-amber-300 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-700" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>Yarn Bale Batch &amp; Weight Specifications</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        Default: 24.000 KG Net / 24.840 KG Gross (12 pcs)
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Configure full bale (12 cones) or half batch (6 cones) mass calibration.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNetWeightKg(24.000);
                      setGrossWeightKg(24.840);
                      setTareWeightKg(0.840);
                      setPackagesCount(12);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      netWeightKg === 24.000 && packagesCount === 12
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Full Batch (12 pcs • 24kg)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNetWeightKg(12.000);
                      setGrossWeightKg(12.420);
                      setTareWeightKg(0.420);
                      setPackagesCount(6);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      netWeightKg === 12.000 && packagesCount === 6
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Half Batch (6 pcs • 12kg)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Net Mass (KG) *
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      value={netWeightKg}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNetWeightKg(val);
                        if (grossWeightKg > val) {
                          setTareWeightKg(Number((grossWeightKg - val).toFixed(3)));
                        }
                      }}
                      className="w-full font-mono font-bold text-rose-800 text-sm focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400">KG</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Gross Mass (KG) *
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      value={grossWeightKg}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setGrossWeightKg(val);
                        if (val > netWeightKg) {
                          setTareWeightKg(Number((val - netWeightKg).toFixed(3)));
                        }
                      }}
                      className="w-full font-mono font-bold text-slate-900 text-sm focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400">KG</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Tare Deduction (KG)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={tareWeightKg}
                      onChange={e => setTareWeightKg(Number(e.target.value))}
                      className="w-full font-mono font-bold text-amber-700 text-sm focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400">KG</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Batch Cones / Pieces *
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={packagesCount}
                      onChange={e => setPackagesCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full font-mono font-bold text-indigo-700 text-sm focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400">PCS</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Dye Lot
                  </label>
                  <input
                    type="text"
                    value={dyeLot}
                    onChange={e => setDyeLot(e.target.value)}
                    placeholder="e.g. 26E081"
                    className="w-full font-mono text-slate-800 text-xs focus:outline-none"
                  />
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Shade Code
                  </label>
                  <input
                    type="text"
                    value={shadeCode}
                    onChange={e => setShadeCode(e.target.value)}
                    placeholder="e.g. MIX GREY-4251"
                    className="w-full font-mono text-slate-800 text-xs focus:outline-none"
                  />
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Bag / Bale #
                  </label>
                  <input
                    type="text"
                    value={bagNumber}
                    onChange={e => setBagNumber(e.target.value)}
                    placeholder="e.g. 148"
                    className="w-full font-mono text-slate-800 text-xs focus:outline-none"
                  />
                </div>

                <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 block">
                    Weight Per Cone
                  </span>
                  <span className="font-mono font-black text-xs text-amber-950">
                    {packagesCount > 0 ? (netWeightKg / packagesCount).toFixed(3) : '2.000'} KG / cone
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing & Financial Margins */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Pricing & Profit Margins (KSh)
                </h4>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="text-slate-600">
                  Gross Profit Margin: <strong className="text-indigo-700">KSh {grossMarginKsh.toLocaleString()}</strong> ({grossMarginPercent}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retail Price (per {unit}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={unitPriceRetail}
                    onChange={e => setUnitPriceRetail(Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bulk / Wholesale Price (per {unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={unitPriceBulk}
                    onChange={e => setUnitPriceBulk(Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cost / Acquisition Price (per {unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">KSh</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={costPrice}
                    onChange={e => setCostPrice(Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Branch Inventory Stock Allocation */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Stock Allocation Across Branches
                </h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Total Business Stock: {totalUnitsAcrossStores} {unit}s
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {locations.map(loc => {
                const currentQty = locationStock[loc.id] || 0;
                return (
                  <div
                    key={loc.id}
                    className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="mb-2">
                      <span className="text-xs font-bold text-slate-800 block truncate" title={loc.name}>
                        {loc.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {loc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={currentQty}
                        onChange={e => handleStockChange(loc.id, Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                      />
                      <span className="text-xs font-medium text-slate-500">{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Image Management */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Product Display Image
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Syncs with POS cards and online catalog
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-3">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative shadow-sm">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center text-white font-bold p-2 text-center"
                      style={{ backgroundColor: colorHex }}
                    >
                      <Tag className="w-6 h-6 mb-1 opacity-80" />
                      <span className="text-[10px] uppercase tracking-wider">{category}</span>
                    </div>
                  )}
                </div>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="w-full text-center text-[11px] text-rose-600 hover:text-rose-700 font-semibold mt-1"
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {/* Upload & URL Input */}
              <div className="sm:col-span-9 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image Source / Direct URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <LinkIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-mono bg-white"
                      placeholder="https://example.com/fabrics/sample.jpg"
                    />
                  </div>
                </div>

                {/* File Upload Trigger */}
                <div>
                  <input
                    type="file"
                    id="edit-modal-file-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setImageUrl(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="edit-modal-file-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File from Device
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-semibold">Are you sure?</span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Item
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Syncing to Cloud...' : 'Save & Sync to Database'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
