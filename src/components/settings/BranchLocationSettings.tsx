import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LocationInfo, LocationId, LocationType } from '../../types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  DollarSign,
  Smartphone,
  Landmark,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Store,
  Warehouse,
  ShoppingBag
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

const LOCATION_TYPES: LocationType[] = [
  'Main Store',
  'Sales Shop',
  'Central Warehouse',
  'Retail Sales Shop',
  'Independent Branch',
  'Warehouse / Depot',
  'Franchise Outlet',
  'Store 1 (Transfer Only)',
  'Store 2 (Transfer Only)'
];

export const BranchLocationSettings: React.FC = () => {
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    activeLocation,
    recordAuditLog,
    currentUser
  } = useERP();

  const [editingLocationId, setEditingLocationId] = useState<LocationId | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    code: string;
    name: string;
    type: LocationType;
    address: string;
    phone: string;
    email: string;
    operatingHours: string;
    managerName: string;
    managerPhone: string;
    managerEmail: string;
    canSellDirectly: boolean;
    canFulfillOrders: boolean;
    canRequestRestock: boolean;
    isAutonomousFinancial: boolean;
    openingFloat: number;
    mpesaTillNumber: string;
    bankAccountName: string;
    bankAccountNumber: string;
    monthlyBudget: number;
    status: 'active' | 'inactive';
  }>({
    id: '',
    code: '',
    name: '',
    type: 'Sales Shop',
    address: '',
    phone: '',
    email: '',
    operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    canSellDirectly: true,
    canFulfillOrders: true,
    canRequestRestock: true,
    isAutonomousFinancial: true,
    openingFloat: 10000,
    mpesaTillNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    monthlyBudget: 150000,
    status: 'active'
  });

  const handleStartCreate = () => {
    playClickSound();
    setIsCreatingNew(true);
    setEditingLocationId(null);
    setFormData({
      id: '',
      code: `BR-${(locations.length + 1).toString().padStart(2, '0')}`,
      name: '',
      type: 'Sales Shop',
      address: '',
      phone: '+254 700 000 000',
      email: '',
      operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      canSellDirectly: true,
      canFulfillOrders: true,
      canRequestRestock: true,
      isAutonomousFinancial: true,
      openingFloat: 10000,
      mpesaTillNumber: '',
      bankAccountName: '',
      bankAccountNumber: '',
      monthlyBudget: 150000,
      status: 'active'
    });
    setStatusMessage(null);
  };

  const handleStartEdit = (loc: LocationInfo) => {
    playClickSound();
    setIsCreatingNew(false);
    setEditingLocationId(loc.id);
    setFormData({
      id: loc.id,
      code: loc.code || loc.id.toUpperCase(),
      name: loc.name,
      type: loc.type,
      address: loc.address || '',
      phone: loc.phone || '',
      email: loc.email || '',
      operatingHours: loc.operatingHours || 'Mon - Sat: 8:00 AM - 6:00 PM',
      managerName: loc.managerName || '',
      managerPhone: loc.managerPhone || '',
      managerEmail: loc.managerEmail || '',
      canSellDirectly: loc.canSellDirectly ?? true,
      canFulfillOrders: loc.canFulfillOrders ?? true,
      canRequestRestock: loc.canRequestRestock ?? true,
      isAutonomousFinancial: loc.isAutonomousFinancial ?? true,
      openingFloat: loc.openingFloat || 10000,
      mpesaTillNumber: loc.mpesaTillNumber || '',
      bankAccountName: loc.bankAccountName || '',
      bankAccountNumber: loc.bankAccountNumber || '',
      monthlyBudget: loc.monthlyBudget || 150000,
      status: loc.status || 'active'
    });
    setStatusMessage(null);
  };

  const handleCancelForm = () => {
    playClickSound();
    setIsCreatingNew(false);
    setEditingLocationId(null);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Branch name is required.' });
      return;
    }

    setIsSubmitting(true);
    playClickSound();

    try {
      if (isCreatingNew) {
        const genId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
        const res = await addLocation({
          id: genId,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          type: formData.type,
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          operatingHours: formData.operatingHours.trim(),
          managerName: formData.managerName.trim(),
          managerPhone: formData.managerPhone.trim(),
          managerEmail: formData.managerEmail.trim(),
          canSellDirectly: formData.canSellDirectly,
          canFulfillOrders: formData.canFulfillOrders,
          canRequestRestock: formData.canRequestRestock,
          isAutonomousFinancial: formData.isAutonomousFinancial,
          openingFloat: Number(formData.openingFloat) || 0,
          mpesaTillNumber: formData.mpesaTillNumber.trim(),
          bankAccountName: formData.bankAccountName.trim(),
          bankAccountNumber: formData.bankAccountNumber.trim(),
          monthlyBudget: Number(formData.monthlyBudget) || 0,
          status: formData.status
        });

        setStatusMessage({ type: 'success', text: res.message });
        setIsCreatingNew(false);
      } else if (editingLocationId) {
        const res = await updateLocation(editingLocationId, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          type: formData.type,
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          operatingHours: formData.operatingHours.trim(),
          managerName: formData.managerName.trim(),
          managerPhone: formData.managerPhone.trim(),
          managerEmail: formData.managerEmail.trim(),
          canSellDirectly: formData.canSellDirectly,
          canFulfillOrders: formData.canFulfillOrders,
          canRequestRestock: formData.canRequestRestock,
          isAutonomousFinancial: formData.isAutonomousFinancial,
          openingFloat: Number(formData.openingFloat) || 0,
          mpesaTillNumber: formData.mpesaTillNumber.trim(),
          bankAccountName: formData.bankAccountName.trim(),
          bankAccountNumber: formData.bankAccountNumber.trim(),
          monthlyBudget: Number(formData.monthlyBudget) || 0,
          status: formData.status
        });

        setStatusMessage({ type: 'success', text: res.message });
        setEditingLocationId(null);
      }
      playSuccessSound();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save store location.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locId: LocationId, locName: string) => {
    if (!window.confirm(`Are you sure you want to remove the store branch "${locName}"?`)) {
      return;
    }
    playClickSound();
    const res = await deleteLocation(locId);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const getTypeIcon = (type: LocationType) => {
    switch (type) {
      case 'Central Warehouse':
      case 'Warehouse / Depot':
        return Warehouse;
      case 'Main Store':
        return Building2;
      case 'Retail Sales Shop':
      case 'Sales Shop':
      case 'Franchise Outlet':
        return ShoppingBag;
      default:
        return Store;
    }
  };

  return (
    <div className="space-y-6" id="branch-location-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Store Locations &amp; Branch Hierarchy
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                {locations.length} Branches
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure multi-branch retail network, warehouse hubs, dispatch routing, cashier floats &amp; branch manager contacts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store Branch</span>
        </button>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form Drawer / Card (When Creating or Editing) */}
      {(isCreatingNew || editingLocationId) && (
        <form onSubmit={handleSaveLocation} className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                {isCreatingNew ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </div>
              <h4 className="text-sm font-black text-slate-900">
                {isCreatingNew ? 'Create New Store Location / Branch' : `Edit Branch: ${formData.name}`}
              </h4>
            </div>
            <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {formData.type}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch / Store Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Westlands Premium Showroom"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch Code / Identifier
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WST-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-purple-600 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Hierarchy Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as LocationType })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 outline-hidden cursor-pointer"
              >
                {LOCATION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Location &amp; Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Woodvale Grove, Westlands Mall 2nd Floor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +254 711 234 567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operating Schedule
              </label>
              <input
                type="text"
                value={formData.operatingHours}
                onChange={e => setFormData({ ...formData, operatingHours: e.target.value })}
                placeholder="e.g. Mon - Sat: 8:00 AM - 6:00 PM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          {/* Manager & Financial Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              Branch Manager &amp; Financial Autonomy
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Manager In-Charge
                </label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="e.g. Kevin Maina"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Manager Phone
                </label>
                <input
                  type="text"
                  value={formData.managerPhone}
                  onChange={e => setFormData({ ...formData, managerPhone: e.target.value })}
                  placeholder="e.g. +254 722 345 678"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Branch Morning Cash Float (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingFloat}
                  onChange={e => setFormData({ ...formData, openingFloat: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Dedicated M-Pesa Till / Paybill
                </label>
                <input
                  type="text"
                  value={formData.mpesaTillNumber}
                  onChange={e => setFormData({ ...formData, mpesaTillNumber: e.target.value })}
                  placeholder="e.g. 542911"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Settlement Bank Account
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="e.g. Equity Bank - 018029..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Monthly Expense Budget Cap (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyBudget}
                  onChange={e => setFormData({ ...formData, monthlyBudget: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canSellDirectly}
                  onChange={e => setFormData({ ...formData, canSellDirectly: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                />
                <span>Direct POS Counter Sales</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canFulfillOrders}
                  onChange={e => setFormData({ ...formData, canFulfillOrders: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                />
                <span>Fulfill Customer Deliveries</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAutonomousFinancial}
                  onChange={e => setFormData({ ...formData, isAutonomousFinancial: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                />
                <span>Independent P&amp;L / Float Balance Sheet</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isCreatingNew ? 'Create Branch' : 'Update Branch'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Locations Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {locations.map(loc => {
          const Icon = getTypeIcon(loc.type);
          const isCurrentActive = activeLocation === loc.id;

          return (
            <div
              key={loc.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between relative overflow-hidden ${
                isCurrentActive ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl tracking-wider uppercase">
                  Active POS Terminal
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {loc.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {loc.code || loc.id.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {loc.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  {loc.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{loc.address}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                  {loc.managerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="font-bold text-slate-800">Manager: {loc.managerName}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Opening Float</span>
                    <span className="font-black text-slate-800">KSh {(loc.openingFloat || 10000).toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Till / Paybill</span>
                    <span className="font-mono font-bold text-slate-800">{loc.mpesaTillNumber || 'Shared Core'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStartEdit(loc)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLocation(loc.id, loc.name)}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
