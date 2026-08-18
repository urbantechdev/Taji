import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { getRoleMetadata } from '../../utils/rbac';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Edit2,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Users,
  CreditCard,
  FileCheck,
  Check
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    isUserProfileModalOpen,
    setIsUserProfileModalOpen,
    currentUser,
    updateCurrentUserProfile,
    posSession,
    lockPOSSession,
    locations,
    isSuperAdmin,
    posOperators,
    setIsAuthModalOpen
  } = useERP();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+254 700 111 000');
  const [kraPin, setKraPin] = useState(currentUser.kraPin || 'P051982341Z');
  
  // PIN change state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isUserProfileModalOpen) return null;

  const roleMeta = getRoleMetadata(currentUser.role);
  const assignedLoc = locations.find(l => l.id === currentUser.assignedLocation);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full name is required.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'A valid email address is required.' });
      return;
    }

    const res = await updateCurrentUserProfile({
      name,
      email,
      phone,
      kraPin
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Account profile updated successfully.' });
      setIsEditing(false);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setStatusMessage({ type: 'error', text: 'New PIN must be exactly 6 numeric digits.' });
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMessage({ type: 'error', text: 'New PIN and confirmation PIN do not match.' });
      return;
    }

    const res = await updateCurrentUserProfile({
      pin: newPin
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Security 6-digit PIN code changed successfully.' });
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-rose-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-rose-400 border border-white/20 flex items-center justify-center text-xl font-black shadow-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">{currentUser.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeClass}`}>
                  {roleMeta.shortLabel}
                </span>
              </div>
              <p className="text-xs text-rose-200">{currentUser.email} • {assignedLoc?.name || currentUser.assignedLocation}</p>
            </div>
          </div>

          <button
            onClick={() => setIsUserProfileModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Status Feedback Banner */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Profile Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Personal &amp; Statutory Profile</h3>
              </div>
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setName(currentUser.name);
                    setEmail(currentUser.email);
                    setPhone(currentUser.phone || '+254 700 111 000');
                    setKraPin(currentUser.kraPin || 'P051982341Z');
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">KRA Tax PIN</label>
                    <input
                      type="text"
                      value={kraPin}
                      onChange={e => setKraPin(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 uppercase"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">Official Email</p>
                    <p className="font-bold text-slate-900">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">Contact Phone</p>
                    <p className="font-bold text-slate-900">{currentUser.phone || '+254 700 111 000'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">KRA Tax PIN</p>
                    <p className="font-mono font-bold text-rose-700">{currentUser.kraPin || 'P051982341Z'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">Assigned Primary Location</p>
                    <p className="font-bold text-slate-900">{assignedLoc?.name || currentUser.assignedLocation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security & 6-Digit PIN Code */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Security &amp; Cashier PIN</h3>
              </div>

              {!isChangingPin && (
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Change PIN</span>
                </button>
              )}
            </div>

            {isChangingPin ? (
              <form onSubmit={handleSavePin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New 6-Digit PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repeat 6 digits"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Update PIN</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-extrabold text-slate-800 text-sm tracking-widest">
                    {showPin ? (currentUser.pin || '123456') : '••••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-slate-500 text-[11px]">
                  Use this 6-digit numeric PIN for quick terminal unlocks &amp; cash register shifts.
                </p>
              </div>
            )}
          </div>

          {/* Role & Permissions Capability Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Role Capabilities: {roleMeta.title}</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RBAC Enforced</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {roleMeta.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canDirectPOSSale
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canDirectPOSSale ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>POS Retail Sales &amp; Invoicing</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canManageGeneralLedger
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canManageGeneralLedger ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>3-Statement General Ledger</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canAccessCFOAdvisor
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canAccessCFOAdvisor ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>AI Virtual CFO Advisor</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canExecuteForensicAudit
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canExecuteForensicAudit ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Forensic Tax &amp; Audit Engine</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canDisbursePayroll
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canDisbursePayroll ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>HR &amp; 2026 Kenyan Payroll</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                roleMeta.permissions.canManageUsers
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}>
                <Check className={`w-3.5 h-3.5 ${roleMeta.permissions.canManageUsers ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>User &amp; Operator Creation Authority</span>
              </div>
            </div>
          </div>

          {/* Registered Users Count Info for Admin */}
          {currentUser.role === 'admin' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Master Administrator Active:</strong> You have capacity to create, assign, and delete staff accounts across all branches.
                </span>
              </div>
              <span className="font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
                {posOperators.length} User{posOperators.length === 1 ? '' : 's'} Total
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              lockPOSSession();
              setIsUserProfileModalOpen(false);
              setIsAuthModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch User / Lock</span>
          </button>

          <button
            onClick={() => setIsUserProfileModalOpen(false)}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
