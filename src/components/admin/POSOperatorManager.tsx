import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ROLE_DEFINITIONS, getRoleMetadata } from '../../utils/rbac';
import {
  Users,
  Plus,
  Trash2,
  KeyRound,
  ShieldCheck,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  Lock,
  UserCheck,
  Check,
  X,
  HelpCircle,
  ShieldAlert,
  Phone,
  FileCheck,
  Building,
  RotateCcw,
  Shield
} from 'lucide-react';
import { LocationId, UserRole, POSOperator } from '../../types';

export const POSOperatorManager: React.FC = () => {
  const {
    posOperators,
    addPOSOperator,
    updatePOSOperator,
    deletePOSOperator,
    isSuperAdmin,
    adminUser,
    unlockPOSWithPin,
    posSession,
    locations,
    currentUser
  } = useERP();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<LocationId | 'All'>('All');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'All'>('All');
  const [showPins, setShowPins] = useState<boolean>(true);

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<POSOperator | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 700 000 000');
  const [kraPin, setKraPin] = useState('P051982341Z');
  const [pin, setPin] = useState('123456');
  const [location, setLocation] = useState<LocationId>('main_store');
  const [role, setRole] = useState<UserRole>('sales_shop_cashier');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PIN Tester Widget state
  const [testPinInput, setTestPinInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; operator?: POSOperator } | null>(null);

  const openAddModal = () => {
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
    const random6Digits = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random6Digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full user name is required.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Valid email address is required.' });
      return;
    }
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      setStatusMessage({ type: 'error', text: 'PIN code must be exactly 6 numeric digits.' });
      return;
    }

    if (editingOperator) {
      const res = await updatePOSOperator(editingOperator.id, {
        name,
        email,
        phone,
        kraPin: kraPin.toUpperCase(),
        pin,
        location,
        role,
        status
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setIsModalOpen(false);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } else {
      const res = await addPOSOperator({
        name,
        email,
        phone,
        kraPin: kraPin.toUpperCase(),
        pin,
        location,
        role,
        status
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setIsModalOpen(false);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to create user account.' });
      }
    }
  };

  const handleDelete = async (id: string, opName: string) => {
    if (window.confirm(`Are you sure you want to remove user "${opName}"? They will no longer be able to log in.`)) {
      const res = await deletePOSOperator(id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }
  };

  const handleTestPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPinInput || testPinInput.length !== 6) {
      setTestResult({ success: false, message: 'Please enter a 6-digit PIN to test.' });
      return;
    }
    const matched = posOperators.find(op => op.pin === testPinInput.trim());
    if (matched) {
      const roleMeta = getRoleMetadata(matched.role);
      setTestResult({
        success: true,
        message: `VALID PIN! Belongs to ${matched.name} (${roleMeta.title}) at ${(matched.location || '').replace('_', ' ').toUpperCase()}`,
        operator: matched
      });
    } else {
      setTestResult({
        success: false,
        message: `INVALID PIN: No user is registered with passcode ${testPinInput}`
      });
    }
  };

  // Filtered operators list
  const filteredOperators = posOperators.filter(op => {
    const matchesLocation = selectedLocationFilter === 'All' || op.location === selectedLocationFilter;
    const matchesRole = selectedRoleFilter === 'All' || op.role === selectedRoleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (op.name || '').toLowerCase().includes(q) ||
      (op.email || '').toLowerCase().includes(q) ||
      (op.pin || '').includes(q) ||
      (op.phone || '').toLowerCase().includes(q) ||
      (op.role || '').toLowerCase().includes(q);
    return matchesLocation && matchesRole && matchesSearch;
  });

  const totalOps = posOperators.length;
  const adminCount = posOperators.filter(op => op.role === 'admin').length;
  const cashiersCount = posOperators.filter(op => op.role === 'sales_shop_cashier' || op.role === 'branch_cashier').length;
  const managersCount = posOperators.filter(op => op.role === 'branch_manager' || op.role === 'accountant').length;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-3 sm:p-8 space-y-3 sm:space-y-6">
      
      {/* Executive Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Master User &amp; Role Access Control (RBAC)</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
            User Accounts &amp; Role Separation
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
            Only the Executive Administrator has the capacity to create new users, configure roles, and assign branch locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPins(!showPins)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {showPins ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{showPins ? 'Mask PINs' : 'Show PINs'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New User Account</span>
          </button>
        </div>
      </div>

      {/* Role-Based Overview Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Active Users</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalOps}</p>
          <span className="text-[10px] text-emerald-600 font-extrabold">Registered in System</span>
        </div>

        <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span>Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 font-mono">{adminCount}</p>
          <span className="text-[10px] text-rose-700 font-bold">Root User Authority</span>
        </div>

        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-800">
            <span>Managers &amp; Finance</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 font-mono">{managersCount}</p>
          <span className="text-[10px] text-blue-700 font-bold">Branch Operations</span>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Retail Cashiers</span>
            <KeyRound className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">{cashiersCount}</p>
          <span className="text-[10px] text-emerald-700 font-bold">POS Terminal Desks</span>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive 6-Digit PIN Tester & Verifier Tool */}
      <div className="p-2.5 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-xl space-y-2 sm:space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border-b border-rose-500/30 pb-2 sm:pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white">Live PIN Passcode Verifier</h3>
              <p className="text-[10px] sm:text-[11px] text-rose-200 line-clamp-1 sm:line-clamp-none">Test any 6-digit PIN code to verify user identity, role permissions, and branch allocation</p>
            </div>
          </div>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
            RBAC Authenticator
          </span>
        </div>

        <form onSubmit={handleTestPin} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit PIN..."
              value={testPinInput}
              onChange={(e) => setTestPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-rose-300 focus:outline-none focus:border-rose-400 placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify User Credentials</span>
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, phone, role, or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="All">All Roles</option>
            {Object.keys(ROLE_DEFINITIONS).map(r => (
              <option key={r} value={r}>
                {ROLE_DEFINITIONS[r as UserRole].shortLabel}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocationFilter}
            onChange={e => setSelectedLocationFilter(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="All">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operators Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOperators.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No user accounts found matching filter</p>
            <p className="text-xs text-slate-500">Click &quot;Create New User Account&quot; to register team members.</p>
          </div>
        ) : (
          filteredOperators.map((op) => {
            const isCurrentlyActiveSession = currentUser?.id === op.id || posSession?.operatorId === op.id || posSession?.pin === op.pin;
            const roleMeta = getRoleMetadata(op.role);
            const locInfo = locations.find(l => l.id === op.location);

            return (
              <div
                key={op.id}
                className={`p-5 rounded-2xl border space-y-3 relative transition-all ${
                  isCurrentlyActiveSession
                    ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20 shadow-md'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{op.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeClass}`}>
                        {roleMeta.shortLabel}
                      </span>
                      {isCurrentlyActiveSession && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                          <Check className="w-2.5 h-2.5" /> Current User
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{op.email}</span>
                      </span>
                      {op.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{op.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(op)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200"
                      title="Edit User Details & Permissions"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {op.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(op.id, op.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-200"
                        title="Remove User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] text-slate-600 line-clamp-2">{roleMeta.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-800 font-bold shadow-2xs">
                    <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                    <span>PIN: </span>
                    <span className="font-mono text-rose-700 tracking-wider">
                      {showPins ? op.pin : '••••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{locInfo?.name || (op.location || '').replace('_', ' ').toUpperCase()}</span>
                  </div>

                  {op.kraPin && (
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 font-bold">
                      <FileCheck className="w-3 h-3 text-slate-400" />
                      <span>{op.kraPin}</span>
                    </div>
                  )}

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                    op.status === 'inactive' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {op.status === 'inactive' ? 'INACTIVE' : 'ACTIVE'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Operator Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingOperator ? 'Edit User & Role Assignment' : 'Create New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure role-based access permissions and terminal PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. kamau@taji.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">KRA Tax PIN</label>
                <input
                  type="text"
                  placeholder="P051982341Z"
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">6-Digit Access PIN</label>
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Branch Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as LocationId)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Separated User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="admin">Super Administrator (Master Authority)</option>
                  <option value="branch_manager">Autonomous Branch Manager (Petty Cash &amp; Branch Ops)</option>
                  <option value="accountant">Finance Manager &amp; Tax Auditor (3-Statement Books)</option>
                  <option value="sales_shop_cashier">Retail POS Cashier (POS &amp; Invoicing)</option>
                  <option value="branch_cashier">Branch POS Cashier (Branch Desks)</option>
                  <option value="main_store_operator">Main Store &amp; Central Warehouse Operator</option>
                  <option value="store_1_attendant">Store 1 Transfer Node Attendant</option>
                  <option value="store_2_attendant">Store 2 Transfer Node Attendant</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {ROLE_DEFINITIONS[role]?.description}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Active (Permit Terminal Login)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Inactive (Suspend Access)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>{editingOperator ? 'Update User Account' : 'Save & Authorize User'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
