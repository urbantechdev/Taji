import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Globe2,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileText,
  Clock,
  ShieldCheck,
  Tag,
  ArrowRight,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface SupplierDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplierForInvoice?: (supplier: Supplier) => void;
}

export const SupplierDirectoryModal: React.FC<SupplierDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSupplierForInvoice
}) => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'overseas_import' | 'domestic_local'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'overseas_import' | 'domestic_local'>('overseas_import');
  const [formCountry, setFormCountry] = useState('China');
  const [formKraPin, setFormKraPin] = useState('');
  const [formCurrency, setFormCurrency] = useState<'USD' | 'KES' | 'EUR' | 'GBP'>('USD');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankAccountNo, setFormBankAccountNo] = useState('');
  const [formSwiftBic, setFormSwiftBic] = useState('');
  const [formPaymentTermsDays, setFormPaymentTermsDays] = useState<number>(30);
  const [formCategory, setFormCategory] = useState('Fabrics & Textiles');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesType = typeFilter === 'all' || sup.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sup.name.toLowerCase().includes(q) ||
      sup.country.toLowerCase().includes(q) ||
      (sup.kraPin && sup.kraPin.toLowerCase().includes(q)) ||
      (sup.category && sup.category.toLowerCase().includes(q)) ||
      (sup.contactPerson && sup.contactPerson.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const overseasCount = suppliers.filter(s => s.type === 'overseas_import').length;
  const domesticCount = suppliers.filter(s => s.type === 'domestic_local').length;

  const resetForm = () => {
    setFormName('');
    setFormType('overseas_import');
    setFormCountry('China');
    setFormKraPin('');
    setFormCurrency('USD');
    setFormContactPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormBankName('');
    setFormBankAccountNo('');
    setFormSwiftBic('');
    setFormPaymentTermsDays(30);
    setFormCategory('Fabrics & Textiles');
    setFormNotes('');
    setFormError(null);
    setEditingSupplierId(null);
    setIsAddingNew(false);
  };

  const handleStartEdit = (sup: Supplier) => {
    playClickSound();
    setEditingSupplierId(sup.id);
    setFormName(sup.name);
    setFormType(sup.type);
    setFormCountry(sup.country);
    setFormKraPin(sup.kraPin || '');
    setFormCurrency(sup.currency);
    setFormContactPerson(sup.contactPerson || '');
    setFormEmail(sup.email || '');
    setFormPhone(sup.phone || '');
    setFormAddress(sup.address || '');
    setFormBankName(sup.bankName || '');
    setFormBankAccountNo(sup.bankAccountNo || '');
    setFormSwiftBic(sup.swiftBic || '');
    setFormPaymentTermsDays(sup.paymentTermsDays || 30);
    setFormCategory(sup.category || 'Fabrics & Textiles');
    setFormNotes(sup.notes || '');
    setFormError(null);
    setIsAddingNew(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Supplier organization name is required.');
      return;
    }
    if (formType === 'domestic_local' && formKraPin && !/^[A-Z]\d{9}[A-Z]$/i.test(formKraPin.trim())) {
      setFormError('Kenyan KRA PIN must be valid (e.g. P051187654M).');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingSupplierId) {
        await updateSupplier(editingSupplierId, {
          name: formName.trim(),
          type: formType,
          country: formCountry.trim(),
          kraPin: formKraPin.trim().toUpperCase() || undefined,
          currency: formCurrency,
          contactPerson: formContactPerson.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          address: formAddress.trim() || undefined,
          bankName: formBankName.trim() || undefined,
          bankAccountNo: formBankAccountNo.trim() || undefined,
          swiftBic: formSwiftBic.trim().toUpperCase() || undefined,
          paymentTermsDays: Number(formPaymentTermsDays) || 30,
          category: formCategory.trim() || undefined,
          notes: formNotes.trim() || undefined
        });
      } else {
        await addSupplier({
          name: formName.trim(),
          type: formType,
          country: formCountry.trim(),
          kraPin: formKraPin.trim().toUpperCase() || undefined,
          currency: formCurrency,
          contactPerson: formContactPerson.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          address: formAddress.trim() || undefined,
          bankName: formBankName.trim() || undefined,
          bankAccountNo: formBankAccountNo.trim() || undefined,
          swiftBic: formSwiftBic.trim().toUpperCase() || undefined,
          paymentTermsDays: Number(formPaymentTermsDays) || 30,
          category: formCategory.trim() || undefined,
          notes: formNotes.trim() || undefined,
          status: 'active'
        });
      }

      playSuccessSound();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save supplier.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the supplier registry?`)) {
      playClickSound();
      await deleteSupplier(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Suppliers &amp; Accounts Payable Registry
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                  {suppliers.length} Registered
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Master vendor directory for Overseas Import consignments (USD) &amp; Domestic KRA eTIMS purchases (KES).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                type="button"
                id="btn-quick-add-supplier"
                onClick={() => {
                  playClickSound();
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register New Supplier</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Total Suppliers</div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">{suppliers.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active trade accounts</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-sky-700 font-semibold flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-sky-600" /> Overseas Imports
            </div>
            <div className="text-xl font-black text-sky-700 mt-1 font-mono">{overseasCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">USD Commercial Invoices</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Domestic (eTIMS)
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{domesticCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">KES with KRA PINs</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-purple-600" /> Currencies Active
            </div>
            <div className="text-xl font-black text-purple-700 mt-1 font-mono">USD • KES</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Forex &amp; Local clearing</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
          {/* Add / Edit Form Drawer */}
          {isAddingNew && (
            <form onSubmit={handleSaveSupplier} className="bg-slate-50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                    {editingSupplierId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingSupplierId ? 'Edit Supplier Profile' : 'Register New Supplier Organization'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supplier / Legal Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZHEJIANG PUAN TEXTILE TECHNOLOGY CO.,LTD."
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supply Classification *
                  </label>
                  <select
                    value={formType}
                    onChange={e => {
                      const t = e.target.value as 'overseas_import' | 'domestic_local';
                      setFormType(t);
                      if (t === 'overseas_import') {
                        setFormCurrency('USD');
                        setFormCountry('China');
                      } else {
                        setFormCurrency('KES');
                        setFormCountry('Kenya');
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="overseas_import">Overseas Import (Forex USD)</option>
                    <option value="domestic_local">Kenyan Domestic (eTIMS KES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country of Origin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. China, India, Kenya"
                    value={formCountry}
                    onChange={e => setFormCountry(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Default Currency *
                  </label>
                  <select
                    value={formCurrency}
                    onChange={e => setFormCurrency(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono font-medium"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="KES">KES (KSh - Kenya Shilling)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    KRA PIN (Mandatory for eTIMS)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. P051187654M"
                    value={formKraPin}
                    onChange={e => setFormKraPin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={formPaymentTermsDays}
                    onChange={e => setFormPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Banking & Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Name &amp; Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BANK OF CHINA / KCB"
                    value={formBankName}
                    onChange={e => setFormBankName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Account / IBAN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3819 0291 0021 88"
                    value={formBankAccountNo}
                    onChange={e => setFormBankAccountNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SWIFT / BIC Code (For Overseas TT)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BKCHCNBJ920"
                    value={formSwiftBic}
                    onChange={e => setFormSwiftBic(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Contact & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lin Xiaowei (Sales Director)"
                    value={formContactPerson}
                    onChange={e => setFormContactPerson(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. sales@puantextile.cn"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +86 575 8899 1234"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Category / Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Knitted Fabrics (Poly Derek / Polar Fleece / Interlock)"
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Notes &amp; Customs / Port Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Preferred clearing agent at Mombasa Port CFS, standard demurrage allowance, etc."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingSupplierId ? 'Save Changes' : 'Complete Registration'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by supplier name, PIN, country..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({suppliers.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('overseas_import')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'overseas_import'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Overseas ({overseasCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('domestic_local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'domestic_local'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Domestic ({domesticCount})</span>
              </button>
            </div>
          </div>

          {/* Supplier Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSuppliers.map(sup => (
              <div
                key={sup.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all hover:shadow-md flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top line badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          sup.type === 'overseas_import'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {sup.type === 'overseas_import' ? <Globe2 className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {sup.type === 'overseas_import' ? 'Overseas Vendor' : 'Kenyan Domestic'}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {sup.currency}
                      </span>

                      {sup.kraPin && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          PIN: {sup.kraPin}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sup)}
                        title="Edit Supplier"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sup.id, sup.name)}
                        title="Delete Supplier"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Supplier Name & Category */}
                  <h4 className="font-bold text-sm text-slate-900 mt-2 leading-snug">{sup.name}</h4>
                  <div className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 shrink-0 text-rose-500" />
                    <span className="truncate">{sup.category || 'General Textile Materials'}</span>
                  </div>

                  {/* Details grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">{sup.country}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sup.paymentTermsDays || 30} Days Terms</span>
                    </div>

                    {sup.contactPerson && (
                      <div className="col-span-2 text-slate-600 truncate">
                        Contact: <span className="text-slate-800 font-medium">{sup.contactPerson}</span>
                      </div>
                    )}

                    {sup.bankName && (
                      <div className="col-span-2 text-slate-600 truncate flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {sup.bankName} {sup.swiftBic ? `(${sup.swiftBic})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {sup.id}</span>
                  {onSelectSupplierForInvoice && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onSelectSupplierForInvoice(sup);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Create Invoice / Intake</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-sm text-slate-700">No suppliers found</p>
              <p className="text-xs text-slate-400 mt-1">Try changing your search terms or register a new vendor above.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            All suppliers are synchronized with Firestore and KRA eTIMS / SAD-ICMS verification protocols.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default SupplierDirectoryModal;
