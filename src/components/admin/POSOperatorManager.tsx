import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
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
  ShieldAlert
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
    posSession
  } = useERP();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<LocationId | 'All'>('All');
  const [showPins, setShowPins] = useState<boolean>(true);

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<POSOperator | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('123456');
  const [location, setLocation] = useState<LocationId>('main_store');
  const [role, setRole] = useState<UserRole>('main_store_operator');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PIN Tester Widget state
  const [testPinInput, setTestPinInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; operator?: POSOperator } | null>(null);

  const openAddModal = () => {
    setEditingOperator(null);
    setName('');
    setEmail('');
    setPin('123456');
    setLocation('main_store');
    setRole('main_store_operator');
    setIsModalOpen(true);
    setStatusMessage(null);
  };

  const openEditModal = (op: POSOperator) => {
    setEditingOperator(op);
    setName(op.name);
    setEmail(op.email);
    setPin(op.pin);
    setLocation(op.location);
    setRole(op.role);
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
      setStatusMessage({ type: 'error', text: 'Operator full name is required.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Valid operator email address is required.' });
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
        pin,
        location,
        role
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
        pin,
        location,
        role
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setIsModalOpen(false);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to create operator.' });
      }
    }
  };

  const handleDelete = async (id: string, opName: string) => {
    if (window.confirm(`Are you sure you want to remove POS operator "${opName}"?`)) {
      const res = await deletePOSOperator(id);
      setStatusMessage({ type: 'success', text: res.message });
    }
  };

  const handleResetToDefaultPin = async (op: POSOperator) => {
    const res = await updatePOSOperator(op.id, { pin: '123456' });
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Reset PIN for ${op.name} to default 123456` });
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
      setTestResult({
        success: true,
        message: `VALID PIN! Belongs to ${matched.name} (${matched.email}) assigned at ${(matched.location || '').replace('_', ' ').toUpperCase()}`,
        operator: matched
      });
    } else if (testPinInput.trim() === '123456') {
      setTestResult({
        success: true,
        message: 'VALID DEFAULT PIN! Accesses Default Store Operator session.'
      });
    } else {
      setTestResult({
        success: false,
        message: `INVALID PIN: No operator configured with PIN ${testPinInput}`
      });
    }
  };

  // Filtered operators list
  const filteredOperators = posOperators.filter(op => {
    const matchesLocation = selectedLocationFilter === 'All' || op.location === selectedLocationFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (op.name || '').toLowerCase().includes(q) ||
      (op.email || '').toLowerCase().includes(q) ||
      (op.pin || '').includes(q) ||
      (op.role || '').toLowerCase().includes(q);
    return matchesLocation && matchesSearch;
  });

  const totalOps = posOperators.length;
  const cashiersCount = posOperators.filter(op => op.role === 'sales_shop_cashier' || op.location === 'sales_shop').length;
  const mainStoreOpsCount = posOperators.filter(op => op.role === 'main_store_operator' || op.location === 'main_store').length;
  const customPinCount = posOperators.filter(op => op.pin !== '123456').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-8 space-y-6">
      
      {/* Executive Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Executive POS Operator Security</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-600" />
            POS Users, Cashiers &amp; PIN Passcodes
          </h2>
          <p className="text-xs text-slate-500">
            Configure 6-digit terminal PIN access for cashiers, store operators, and administrators across all retail points.
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
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Create New POS Operator</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Operators</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalOps}</p>
          <span className="text-[10px] text-emerald-600 font-extrabold">Active Users</span>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Retail Cashiers</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 font-mono">{cashiersCount}</p>
          <span className="text-[10px] text-amber-700 font-bold">Sales Shop Terminal</span>
        </div>

        <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span>Main Store Hub</span>
            <ShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 font-mono">{mainStoreOpsCount}</p>
          <span className="text-[10px] text-rose-700 font-bold">Warehouse Operations</span>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Custom PIN Security</span>
            <KeyRound className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">{customPinCount}</p>
          <span className="text-[10px] text-emerald-700 font-bold">Unique Passcodes</span>
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
      <div className="p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Interactive POS PIN Verifier</h3>
              <p className="text-[11px] text-rose-200">Test any 6-digit cashier PIN to verify ownership and store terminal authorization</p>
            </div>
          </div>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
            Real-Time Audit Check
          </span>
        </div>

        <form onSubmit={handleTestPin} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit PIN..."
              value={testPinInput}
              onChange={(e) => setTestPinInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-rose-300 focus:outline-none focus:border-rose-400 placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Passcode</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, role, or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['All', 'main_store', 'sales_shop', 'store_1', 'store_2'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocationFilter(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedLocationFilter === loc
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {loc === 'All' ? 'All Locations' : (loc || '').replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Operators Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOperators.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No matching POS operators found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or add a new operator.</p>
          </div>
        ) : (
          filteredOperators.map((op) => {
            const isCurrentlyActiveSession = posSession?.operatorId === op.id || posSession?.pin === op.pin;
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
                      {isCurrentlyActiveSession && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                          <Check className="w-2.5 h-2.5" /> Logged In Session
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{op.email}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(op)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200"
                      title="Edit Operator Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleResetToDefaultPin(op)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-amber-200"
                      title="Reset PIN to Default 123456"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {op.email !== 'urbaninteriorkenya@gmail.com' && (
                      <button
                        onClick={() => handleDelete(op.id, op.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-200"
                        title="Remove Operator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                    <span>{(op.location || '').replace('_', ' ').toUpperCase()}</span>
                  </div>

                  <span className="text-[10px] uppercase font-extrabold bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
                    {(op.role || '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Operator Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingOperator ? 'Edit POS Operator' : 'Create Authorized Operator'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure 6-digit terminal access code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operator Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operator Email</label>
                <input
                  type="email"
                  placeholder="e.g. kamau@urbaninterior.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">6-Digit POS Access PIN</label>
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
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Store Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as LocationId)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="main_store">Main Store &amp; Hub</option>
                  <option value="sales_shop">Sales Shop (Retail POS)</option>
                  <option value="store_1">Store 1 (Transfer Only)</option>
                  <option value="store_2">Store 2 (Transfer Only)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Operator Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="main_store_operator">Main Store Operator</option>
                  <option value="sales_shop_cashier">Sales Shop Cashier</option>
                  <option value="store_1_attendant">Store 1 Attendant</option>
                  <option value="store_2_attendant">Store 2 Attendant</option>
                  <option value="admin">Store Admin</option>
                </select>
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
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{editingOperator ? 'Update Operator' : 'Save Operator'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
