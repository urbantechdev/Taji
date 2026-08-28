import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ROLE_DEFINITIONS, getRoleMetadata } from '../../utils/rbac';
import { LocationId, UserRole, POSOperator } from '../../types';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Building,
  Phone,
  Mail,
  UserCheck,
  Check,
  X,
  Lock,
  RotateCcw
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../utils/audio';

export const UserCreationSettings: React.FC = () => {
  const {
    posOperators,
    addPOSOperator,
    updatePOSOperator,
    deletePOSOperator,
    unlockPOSWithPin,
    locations,
    currentUser,
    recordAuditLog
  } = useERP();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationId | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [showPins, setShowPins] = useState(true);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<POSOperator | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 700 000 000');
  const [kraPin, setKraPin] = useState('P051982341Z');
  const [pin, setPin] = useState('123456');
  const [location, setLocation] = useState<LocationId>('sales_shop');
  const [role, setRole] = useState<UserRole>('sales_shop_cashier');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PIN Tester State
  const [testPinInput, setTestPinInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; operator?: POSOperator } | null>(null);

  const openAddModal = () => {
    playClickSound();
    setEditingOperator(null);
    setName('');
    setEmail('');
    setPhone('+254 700 000 000');
    setKraPin('P051982341Z');
    setPin(Math.floor(100000 + Math.random() * 900000).toString());
    setLocation('sales_shop');
    setRole('sales_shop_cashier');
    setStatus('active');
    setIsModalOpen(true);
    setStatusMessage(null);
  };

  const openEditModal = (op: POSOperator) => {
    playClickSound();
    setEditingOperator(op);
    setName(op.name);
    setEmail(op.email);
    setPhone(op.phone || '+254 700 000 000');
    setKraPin(op.kraPin || 'P051982341Z');
    setPin(op.pin);
    setLocation(op.location);
    setRole(op.role);
    setStatus(op.status || 'active');
    setIsModalOpen(true);
    setStatusMessage(null);
  };

  const generateRandomPin = () => {
    playClickSound();
    const random6Digits = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random6Digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !pin.trim()) {
      setStatusMessage({ type: 'error', text: 'Name, email, and 6-digit PIN are required.' });
      return;
    }

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setStatusMessage({ type: 'error', text: 'PIN code must be exactly 6 numeric digits.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    playClickSound();

    try {
      if (editingOperator) {
        const res = await updatePOSOperator(editingOperator.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          kraPin: kraPin.trim().toUpperCase(),
          pin: pin.trim(),
          location,
          role,
          status
        });
        if (res.success) {
          playSuccessSound();
          setStatusMessage({ type: 'success', text: `Updated user profile for "${name}".` });
          recordAuditLog('USER_UPDATED', `Operator ${name} updated`);
          setIsModalOpen(false);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      } else {
        const res = await addPOSOperator({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          kraPin: kraPin.trim().toUpperCase(),
          pin: pin.trim(),
          location,
          role,
          status
        });
        if (res.success) {
          playSuccessSound();
          setStatusMessage({ type: 'success', text: `Successfully registered user "${name}" with PIN ${pin}.` });
          recordAuditLog('USER_CREATED', `Operator ${name} created with role ${role}`);
          setIsModalOpen(false);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save user account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    playClickSound();
    try {
      const res = await deletePOSOperator(id);
      if (res.success) {
        playSuccessSound();
        setStatusMessage({ type: 'success', text: `Deleted user "${userName}".` });
        recordAuditLog('USER_DELETED', `Deleted operator ${userName}`);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to delete user.' });
    }
  };

  const handleTestPin = () => {
    if (!testPinInput.trim()) return;
    playClickSound();
    const result = unlockPOSWithPin(testPinInput.trim());
    setTestResult(result);
  };

  const filteredOperators = posOperators.filter(op => {
    const matchesSearch =
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (op.phone && op.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (op.kraPin && op.kraPin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      op.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLoc = locationFilter === 'All' || op.location === locationFilter;
    const matchesRole = roleFilter === 'All' || op.role === roleFilter;

    return matchesSearch && matchesLoc && matchesRole;
  });

  return (
    <div className="space-y-6" id="user-creation-settings-container">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              User Creation &amp; POS Operator Directory
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                Staff Roster
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create new system accounts, assign RBAC roles, generate secure 6-digit terminal PINs &amp; manage branch access.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Feedback Banner */}
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

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search users by name, email, phone, KRA PIN or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Filter */}
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-hidden cursor-pointer"
          >
            <option value="All">All Locations ({locations.length})</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-hidden cursor-pointer"
          >
            <option value="All">All Roles</option>
            {Object.keys(ROLE_DEFINITIONS).map(r => (
              <option key={r} value={r}>
                {ROLE_DEFINITIONS[r as UserRole].title}
              </option>
            ))}
          </select>

          {/* Toggle Show PINs */}
          <button
            type="button"
            onClick={() => setShowPins(prev => !prev)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title={showPins ? 'Hide PINs' : 'Show PINs'}
          >
            {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPins ? 'Mask PINs' : 'Show PINs'}</span>
          </button>
        </div>
      </div>

      {/* Operator Table & Directory */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Staff Member / User</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Branch Location</th>
                <th className="py-3.5 px-4">Contact / KRA PIN</th>
                <th className="py-3.5 px-4">Terminal PIN</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching users or operators found.
                  </td>
                </tr>
              ) : (
                filteredOperators.map(op => {
                  const roleMeta = getRoleMetadata(op.role);
                  const locInfo = locations.find(l => l.id === op.location);

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-800 font-black flex items-center justify-center text-xs shrink-0 border border-pink-200">
                            {op.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{op.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{op.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleMeta.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dotColor}`} />
                          {roleMeta.shortLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{locInfo?.name || op.location}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <p className="text-slate-600 font-mono">{op.phone || '—'}</p>
                          <p className="text-slate-400 font-mono">KRA: {op.kraPin || '—'}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-xs">
                          <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                          <span>{showPins ? op.pin : '••••••'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            op.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {op.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(op)}
                            className="p-1.5 hover:bg-pink-50 text-slate-600 hover:text-pink-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(op.id, op.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* PIN Verification & Tester Console */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-400">
                Interactive Operator PIN Authentication Tester
              </h4>
              <p className="text-[11px] text-slate-400">
                Simulate cashier terminal login with any 6-digit PIN code.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="password"
              maxLength={6}
              placeholder="Enter 6-digit PIN..."
              value={testPinInput}
              onChange={e => setTestPinInput(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono font-black tracking-widest text-lg text-white focus:border-pink-500 outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={handleTestPin}
            className="w-full sm:w-auto px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
          >
            Verify PIN Authorization
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>
              {testResult.message}
              {testResult.operator && (
                <span className="ml-2 underline">
                  (Operator: {testResult.operator.name} • Location: {testResult.operator.location})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* User Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-pink-700 to-rose-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingOperator ? `Edit User: ${editingOperator.name}` : 'Create New System User'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Mwangi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="samuel@taji.co.ke"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 700 000 000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="P051982341Z"
                    value={kraPin}
                    onChange={e => setKraPin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-600 outline-hidden uppercase font-mono"
                  />
                </div>
              </div>

              {/* PIN Code with auto-generate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Terminal Login PIN
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="6 digits"
                    className="flex-1 px-3 py-2 bg-pink-50/50 border border-pink-300 rounded-xl text-sm font-mono font-black text-pink-950 focus:bg-white focus:border-pink-600 outline-hidden tracking-wider text-center"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>Generate Random</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden cursor-pointer"
                  >
                    {Object.keys(ROLE_DEFINITIONS).map(r => (
                      <option key={r} value={r}>
                        {ROLE_DEFINITIONS[r as UserRole].title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Location</label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value as LocationId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-hidden cursor-pointer"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-pink-600 accent-pink-600"
                    />
                    <span>Active Operator</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-pink-600 accent-pink-600"
                    />
                    <span>Suspended / Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingOperator ? 'Save Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
