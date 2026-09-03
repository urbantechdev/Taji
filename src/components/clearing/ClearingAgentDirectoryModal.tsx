import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ClearingAgent } from '../../types';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Tag,
  Anchor,
  FileText,
  BadgeCheck,
  CreditCard,
  Building,
  ExternalLink
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface ClearingAgentDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClearingAgent?: (agent: ClearingAgent) => void;
}

export const ClearingAgentDirectoryModal: React.FC<ClearingAgentDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectClearingAgent
}) => {
  const { clearingAgents, addClearingAgent, updateClearingAgent, deleteClearingAgent } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [portFilter, setPortFilter] = useState<'all' | 'mombasa' | 'icd_nairobi' | 'air_cargo'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formKraPin, setFormKraPin] = useState('');
  const [formDeclarantCode, setFormDeclarantCode] = useState('');
  const [formOperatingPorts, setFormOperatingPorts] = useState('Mombasa Port (Kilindini CFS) & ICD Embakasi Nairobi');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankAccountNo, setFormBankAccountNo] = useState('');
  const [formBankBranch, setFormBankBranch] = useState('');
  const [formMpesaPaybill, setFormMpesaPaybill] = useState('');
  const [formStandardAgencyFeeKES, setFormStandardAgencyFeeKES] = useState<number>(35000);
  const [formCfsPortWharfageKES, setFormCfsPortWharfageKES] = useState<number>(65000);
  const [formDemurrageAllowanceDays, setFormDemurrageAllowanceDays] = useState<number>(21);
  const [formPaymentTermsDays, setFormPaymentTermsDays] = useState<number>(14);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const filteredAgents = clearingAgents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    const ports = (agent.operatingPorts || '').toLowerCase();
    
    let matchesPort = true;
    if (portFilter === 'mombasa') {
      matchesPort = ports.includes('mombasa') || ports.includes('kilindini');
    } else if (portFilter === 'icd_nairobi') {
      matchesPort = ports.includes('icd') || ports.includes('embakasi') || ports.includes('nairobi');
    } else if (portFilter === 'air_cargo') {
      matchesPort = ports.includes('air') || ports.includes('jkia') || ports.includes('cargo');
    }

    const matchesSearch =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.kraPin.toLowerCase().includes(q) ||
      (agent.declarantCode && agent.declarantCode.toLowerCase().includes(q)) ||
      (agent.contactPerson && agent.contactPerson.toLowerCase().includes(q)) ||
      (agent.operatingPorts && agent.operatingPorts.toLowerCase().includes(q)) ||
      (agent.phone && agent.phone.toLowerCase().includes(q));

    return matchesPort && matchesSearch;
  });

  const licensedCount = clearingAgents.filter(a => !!a.declarantCode).length;
  const mombasaCount = clearingAgents.filter(a => (a.operatingPorts || '').toLowerCase().includes('mombasa') || (a.operatingPorts || '').toLowerCase().includes('kilindini')).length;
  const icdCount = clearingAgents.filter(a => (a.operatingPorts || '').toLowerCase().includes('icd') || (a.operatingPorts || '').toLowerCase().includes('embakasi')).length;

  const avgAgencyFee = clearingAgents.length > 0
    ? Math.round(clearingAgents.reduce((sum, a) => sum + (a.standardAgencyFeeKES || 35000), 0) / clearingAgents.length)
    : 35000;

  const resetForm = () => {
    setFormName('');
    setFormKraPin('');
    setFormDeclarantCode('');
    setFormOperatingPorts('Mombasa Port (Kilindini CFS) & ICD Embakasi Nairobi');
    setFormContactPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormBankName('');
    setFormBankAccountNo('');
    setFormBankBranch('');
    setFormMpesaPaybill('');
    setFormStandardAgencyFeeKES(35000);
    setFormCfsPortWharfageKES(65000);
    setFormDemurrageAllowanceDays(21);
    setFormPaymentTermsDays(14);
    setFormNotes('');
    setFormError(null);
    setEditingAgentId(null);
    setIsAddingNew(false);
  };

  const handleStartEdit = (agent: ClearingAgent) => {
    playClickSound();
    setEditingAgentId(agent.id);
    setFormName(agent.name);
    setFormKraPin(agent.kraPin);
    setFormDeclarantCode(agent.declarantCode || '');
    setFormOperatingPorts(agent.operatingPorts || 'Mombasa Port (Kilindini CFS) & ICD Embakasi Nairobi');
    setFormContactPerson(agent.contactPerson || '');
    setFormEmail(agent.email || '');
    setFormPhone(agent.phone || '');
    setFormAddress(agent.address || '');
    setFormBankName(agent.bankName || '');
    setFormBankAccountNo(agent.bankAccountNo || '');
    setFormBankBranch(agent.bankBranch || '');
    setFormMpesaPaybill(agent.mpesaPaybill || '');
    setFormStandardAgencyFeeKES(agent.standardAgencyFeeKES || 35000);
    setFormCfsPortWharfageKES(agent.cfsPortWharfageKES || 65000);
    setFormDemurrageAllowanceDays(agent.demurrageAllowanceDays || 21);
    setFormPaymentTermsDays(agent.paymentTermsDays || 14);
    setFormNotes(agent.notes || '');
    setFormError(null);
    setIsAddingNew(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Clearing agent legal name is required.');
      return;
    }
    const cleanPin = formKraPin.trim().toUpperCase();
    if (!cleanPin) {
      setFormError('KRA Tax PIN is required for customs declarants.');
      return;
    }
    if (!/^[A-Z]\d{9}[A-Z]$/i.test(cleanPin)) {
      setFormError('Kenyan KRA PIN must follow format (e.g. P051506858S).');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingAgentId) {
        await updateClearingAgent(editingAgentId, {
          name: formName.trim(),
          kraPin: cleanPin,
          declarantCode: formDeclarantCode.trim().toUpperCase() || undefined,
          operatingPorts: formOperatingPorts.trim() || undefined,
          contactPerson: formContactPerson.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          address: formAddress.trim() || undefined,
          bankName: formBankName.trim() || undefined,
          bankAccountNo: formBankAccountNo.trim() || undefined,
          bankBranch: formBankBranch.trim() || undefined,
          mpesaPaybill: formMpesaPaybill.trim() || undefined,
          standardAgencyFeeKES: Number(formStandardAgencyFeeKES) || 35000,
          cfsPortWharfageKES: Number(formCfsPortWharfageKES) || 65000,
          demurrageAllowanceDays: Number(formDemurrageAllowanceDays) || 21,
          paymentTermsDays: Number(formPaymentTermsDays) || 14,
          notes: formNotes.trim() || undefined
        });
      } else {
        await addClearingAgent({
          name: formName.trim(),
          kraPin: cleanPin,
          declarantCode: formDeclarantCode.trim().toUpperCase() || undefined,
          operatingPorts: formOperatingPorts.trim() || undefined,
          contactPerson: formContactPerson.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          address: formAddress.trim() || undefined,
          bankName: formBankName.trim() || undefined,
          bankAccountNo: formBankAccountNo.trim() || undefined,
          bankBranch: formBankBranch.trim() || undefined,
          mpesaPaybill: formMpesaPaybill.trim() || undefined,
          standardAgencyFeeKES: Number(formStandardAgencyFeeKES) || 35000,
          cfsPortWharfageKES: Number(formCfsPortWharfageKES) || 65000,
          demurrageAllowanceDays: Number(formDemurrageAllowanceDays) || 21,
          paymentTermsDays: Number(formPaymentTermsDays) || 14,
          notes: formNotes.trim() || undefined,
          status: 'active'
        });
      }

      playSuccessSound();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save clearing agent.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove clearing agent "${name}" from the registry?`)) {
      playClickSound();
      await deleteClearingAgent(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Agent ID',
      'Company Name',
      'KRA PIN',
      'License CB Code',
      'Operating Ports',
      'Contact Person',
      'Phone',
      'Email',
      'Bank Name',
      'Account No',
      'M-Pesa Paybill',
      'Standard Agency Fee (KES)',
      'Wharfage Baseline (KES)',
      'Demurrage Free Days',
      'Payment Terms (Days)',
      'Status'
    ];

    const rows = clearingAgents.map(a => [
      `"${a.id}"`,
      `"${a.name}"`,
      `"${a.kraPin}"`,
      `"${a.declarantCode || ''}"`,
      `"${a.operatingPorts || ''}"`,
      `"${a.contactPerson || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.email || ''}"`,
      `"${a.bankName || ''}"`,
      `"${a.bankAccountNo || ''}"`,
      `"${a.mpesaPaybill || ''}"`,
      a.standardAgencyFeeKES || 35000,
      a.cfsPortWharfageKES || 65000,
      a.demurrageAllowanceDays || 21,
      a.paymentTermsDays || 14,
      `"${a.status || 'active'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Taji_Clearing_Agents_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Clearing &amp; Forwarding Declarants Registry
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                  {clearingAgents.length} Registered
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                KRA Customs Broker (CB) licensed declarants, Kilindini Port CFS logistics &amp; SGR trucking handlers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-clearing-agents-csv"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="Download Clearing Agents CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {!isAddingNew && (
              <button
                type="button"
                id="btn-quick-add-clearing-agent"
                onClick={() => {
                  playClickSound();
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register New Agent</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-200 bg-white shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Total Clearing Agents</div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">{clearingAgents.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active logistics partners</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-600" /> KRA Licensed CBs
            </div>
            <div className="text-xl font-black text-blue-700 mt-1 font-mono">{licensedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Customs Broker License codes</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
              <Anchor className="w-3.5 h-3.5 text-indigo-600" /> Kilindini / CFS Hubs
            </div>
            <div className="text-xl font-black text-indigo-700 mt-1 font-mono">{mombasaCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Mombasa &amp; Inland ICDs</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Avg Agency Fee
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
              KSh {avgAgencyFee.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Baseline per 40ft container</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
          {/* Add / Edit Form Drawer */}
          {isAddingNew && (
            <form onSubmit={handleSaveAgent} className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    {editingAgentId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingAgentId ? 'Edit Clearing Agent Profile' : 'Register New Clearing & Forwarding Declarant'}
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
                    Agency / Declarant Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLUE PEARL LOGISTICS LIMITED"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    KRA Tax PIN * (Customs Declarant)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P051506858S"
                    value={formKraPin}
                    onChange={e => setFormKraPin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    KRA License / CB Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KRA-CB-8841"
                    value={formDeclarantCode}
                    onChange={e => setFormDeclarantCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Operating Ports &amp; CFS Hubs *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mombasa Port (Kilindini CFS) & ICD Embakasi Nairobi"
                    value={formOperatingPorts}
                    onChange={e => setFormOperatingPorts(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Standard Costing Parameters */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Std Agency Fee (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="35000"
                    value={formStandardAgencyFeeKES}
                    onChange={e => setFormStandardAgencyFeeKES(Number(e.target.value))}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Port CFS Wharfage (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="65000"
                    value={formCfsPortWharfageKES}
                    onChange={e => setFormCfsPortWharfageKES(Number(e.target.value))}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Demurrage Free Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="21"
                    value={formDemurrageAllowanceDays}
                    onChange={e => setFormDemurrageAllowanceDays(Number(e.target.value))}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Credit Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="14"
                    value={formPaymentTermsDays}
                    onChange={e => setFormPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Banking & M-Pesa Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Settlement Bank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQUITY BANK KENYA"
                    value={formBankName}
                    onChange={e => setFormBankName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Account No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0460 2938 1102 33"
                    value={formBankAccountNo}
                    onChange={e => setFormBankAccountNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mombasa Supreme"
                    value={formBankBranch}
                    onChange={e => setFormBankBranch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    M-Pesa Paybill / Till No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 400222"
                    value={formMpesaPaybill}
                    onChange={e => setFormMpesaPaybill(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Declarant / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hassan Omar (Senior Declarant)"
                    value={formContactPerson}
                    onChange={e => setFormContactPerson(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. operations@bluepearllogistics.co.ke"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +254 722 789 450"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Office Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cannon Towers II, 5th Floor, Moi Avenue, P.O. Box 90210, Mombasa, Kenya"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Logistics Instructions &amp; CFS Bond Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dedicated CFS berth allocation at Kilindini. Pre-clearance customs entries via Simba/ICMS with rapid release."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingAgentId ? 'Save Changes' : 'Complete Agent Registration'}</span>
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
                placeholder="Search clearing agent, PIN, CB code, port..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
              <button
                type="button"
                onClick={() => setPortFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  portFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Ports ({clearingAgents.length})
              </button>
              <button
                type="button"
                onClick={() => setPortFilter('mombasa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  portFilter === 'mombasa'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Mombasa Port ({mombasaCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPortFilter('icd_nairobi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  portFilter === 'icd_nairobi'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ICD Embakasi ({icdCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPortFilter('air_cargo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  portFilter === 'air_cargo'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>JKIA / Air</span>
              </button>
            </div>
          </div>

          {/* Clearing Agent Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all hover:shadow-md flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-blue-600" />
                        <span>KRA Declarant</span>
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        PIN: {agent.kraPin}
                      </span>

                      {agent.declarantCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-indigo-500" />
                          <span>CB: {agent.declarantCode}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(agent)}
                        title="Edit Clearing Agent Profile"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(agent.id, agent.name)}
                        title="Delete Clearing Agent"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Agent Name & Ports */}
                  <h4 className="font-bold text-sm text-slate-900 mt-2 leading-snug">{agent.name}</h4>
                  <div className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1.5">
                    <Anchor className="w-3 h-3 shrink-0 text-blue-500" />
                    <span className="truncate">{agent.operatingPorts || 'Mombasa Kilindini Port & ICD Embakasi'}</span>
                  </div>

                  {/* Operational Metrics Pill */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[10.5px] bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Std Fee:</span>
                      <span className="font-bold text-slate-800">
                        KSh {(agent.standardAgencyFeeKES || 35000).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Wharfage:</span>
                      <span className="font-bold text-slate-800">
                        KSh {(agent.cfsPortWharfageKES || 65000).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Free Days:</span>
                      <span className="font-bold text-emerald-700">
                        {agent.demurrageAllowanceDays || 21} Days
                      </span>
                    </div>
                  </div>

                  {/* Contact & Banking Details Grid */}
                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                    {agent.contactPerson && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400 text-[10px]">Contact:</span>
                        <span className="font-medium text-slate-800 truncate">{agent.contactPerson}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10.5px] text-slate-500 flex-wrap">
                      {agent.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{agent.phone}</span>
                        </span>
                      )}
                      {agent.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{agent.email}</span>
                        </span>
                      )}
                    </div>

                    {(agent.bankName || agent.mpesaPaybill) && (
                      <div className="text-[10.5px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
                        {agent.bankName && (
                          <span className="flex items-center gap-1 truncate">
                            <Landmark className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{agent.bankName} {agent.bankAccountNo ? `(${agent.bankAccountNo})` : ''}</span>
                          </span>
                        )}
                        {agent.mpesaPaybill && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                            Paybill: {agent.mpesaPaybill}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {agent.id}</span>
                  {onSelectClearingAgent && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onSelectClearingAgent(agent);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Select Agent</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <Truck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-sm text-slate-700">No clearing agents found</p>
              <p className="text-xs text-slate-400 mt-1">Try changing your search terms or register a new declarant above.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            All clearing agent profiles are synchronized with Firestore and linked to KRA SAD ICMS logistics disbursements.
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

export default ClearingAgentDirectoryModal;
