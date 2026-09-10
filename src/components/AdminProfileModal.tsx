import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Camera, 
  Upload, 
  Check, 
  RefreshCw, 
  LogOut, 
  Lock, 
  Bell, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateProfile, updatePassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { usePopup } from './PopupPrompt';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { compressImage, formatBytes } from '../lib/imageOptimizer';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isSuperAdmin: boolean;
  onLogout: () => void;
  dashboardSettings?: any;
}

const AVATAR_PRESETS = [
  { id: 'felix', label: 'Classic Lead', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'sarah', label: 'Executive', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'alex', label: 'Operations', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'maya', label: 'Embroidery Lead', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
  { id: 'ryan', label: 'Quality Control', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan' },
  { id: 'jordan', label: 'Design Master', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
];

export default function AdminProfileModal({
  isOpen,
  onClose,
  user,
  isSuperAdmin,
  onLogout,
  dashboardSettings
}: AdminProfileModalProps) {
  const { toast, promptConfirm } = usePopup();

  // Profile Form States
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Operations & Production');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Security Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Notification Preferences
  const [notifyQuotes, setNotifyQuotes] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyStock, setNotifyStock] = useState(true);
  const [notifyInvoices, setNotifyInvoices] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>('admin');

  // Load existing profile from Firestore if available
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || (user.email ? user.email.split('@')[0] : 'Administrator'));
    setPhotoURL(user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

    const fetchAdminDetails = async () => {
      try {
        const userDocId = user.email || user.uid;
        if (!userDocId) return;
        
        const docRef = doc(db, 'admins', userDocId.toLowerCase());
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.name && !user.displayName) setDisplayName(data.name);
          if (data.phone) setPhone(data.phone);
          if (data.department) setDepartment(data.department);
          if (data.photoURL) setPhotoURL(data.photoURL);
          if (data.role) setCurrentRole(data.role);
          if (data.notifyQuotes !== undefined) setNotifyQuotes(data.notifyQuotes);
          if (data.notifyOrders !== undefined) setNotifyOrders(data.notifyOrders);
          if (data.notifyStock !== undefined) setNotifyStock(data.notifyStock);
          if (data.notifyInvoices !== undefined) setNotifyInvoices(data.notifyInvoices);
        } else if (user?.email?.toLowerCase() === 'tww943@gmail.com') {
          setCurrentRole('editor');
          if (!department) setDepartment('Inventory & Product Management');
        }
      } catch (err) {
        console.warn("Could not fetch admin extra profile data:", err);
      }
    };
    fetchAdminDetails();
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImage(file, { maxDimension: 400, quality: 0.85, format: 'image/webp' });
      setPhotoURL(res.dataUrl);
      toast.info('Avatar Optimized', `Compressed to WebP: ${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)} (${res.reductionPercentage}% saved)`);
    } catch (err) {
      console.error('Error compressing profile photo:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save General Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!displayName.trim()) {
      toast.error('Missing Name', 'Please enter your full administrator name.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL
        });
      }

      // 2. Update Firestore doc in 'admins'
      const userDocId = user?.email || user?.uid || 'staff_session';
      const adminRef = doc(db, 'admins', userDocId.toLowerCase());
      const roleToSave = isSuperAdmin ? 'superadmin' : (currentRole === 'editor' || user?.email?.toLowerCase() === 'tww943@gmail.com' ? 'editor' : 'admin');
      await setDoc(adminRef, {
        name: displayName.trim(),
        email: user?.email || 'Authorized Staff',
        phone: phone.trim(),
        department: department.trim(),
        photoURL: photoURL,
        role: roleToSave,
        notifyQuotes,
        notifyOrders,
        notifyStock,
        notifyInvoices,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success('Profile Updated', 'Your administrator profile details have been saved successfully.');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'admins');
      toast.error('Update Failed', err?.message || 'Could not update profile data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.warning('No Email on Account', 'This session is authenticated without an email address (PIN or Anonymous session).');
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(
        'Password Reset Email Sent',
        `A secure password recovery link has been delivered to ${user.email}. Check your inbox.`
      );
    } catch (err: any) {
      toast.error('Reset Failed', err?.message || 'Could not dispatch password reset link.');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Direct Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password Too Short', 'Password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords Do Not Match', 'Please ensure both password fields match.');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Authentication Error', 'No active user session found.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password Updated', 'Your administrative login password has been changed successfully.');
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('requires-recent-login')) {
        toast.warning(
          'Re-authentication Required',
          'For security, please log out and sign in again before updating your password.'
        );
      } else {
        toast.error('Password Change Failed', err?.message || 'Could not update password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Logout Confirmation
  const confirmLogout = () => {
    promptConfirm({
      title: 'Sign Out Administrator',
      message: 'Are you sure you want to end your current administrative session and return to the storefront?',
      confirmText: 'Sign Out Now',
      variant: 'danger',
      icon: 'alert',
      onConfirm: () => {
        onClose();
        onLogout();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-[36px] shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden my-auto relative flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header Banner */}
        <div className="relative bg-gradient-to-r from-brand-blue via-[#0c2f78] to-slate-900 text-white p-6 sm:p-8 shrink-0 overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-2xl flex items-center justify-center transition-colors border border-white/15"
            title="Close Profile Settings"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            {/* Avatar with Status Ring */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/30 bg-white shadow-2xl overflow-hidden shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                  alt={displayName || 'Admin Avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
                  }}
                />
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-brand-green border-2 border-brand-blue rounded-full" title="Active Admin Session" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight uppercase">
                  {displayName || 'Authorized Administrator'}
                </h2>
                <span className="px-3 py-0.5 bg-brand-orange/20 text-brand-orange border border-brand-orange/40 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {isSuperAdmin ? 'Super Administrator' : (currentRole === 'editor' || user?.email?.toLowerCase() === 'tww943@gmail.com' ? 'Product & Inventory Editor' : 'Staff Admin')}
                </span>
              </div>

              <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-mono mb-2">
                <Mail className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span>{user?.email || 'Nairobi Staff Override Session'}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-300/80">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-green" /> Authority Verified
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-brand-orange" /> {department}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0",
                activeTab === 'profile'
                  ? "bg-white text-brand-blue shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <User className="w-4 h-4" /> Personal Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0",
                activeTab === 'security'
                  ? "bg-white text-brand-blue shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Lock className="w-4 h-4" /> Security & Passwords
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0",
                activeTab === 'notifications'
                  ? "bg-white text-brand-blue shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Bell className="w-4 h-4" /> Notification Alerts
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Selector Section */}
              <div className="space-y-3 p-5 bg-slate-50 rounded-3xl border border-slate-200/80">
                <label className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center justify-between">
                  <span>Profile Avatar Image</span>
                  <span className="text-[10px] text-slate-400 font-bold">Presets or Custom Photo</span>
                </label>

                {/* Avatar Presets Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPhotoURL(preset.url)}
                      className={cn(
                        "p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 group bg-white",
                        photoURL === preset.url
                          ? "border-brand-orange ring-2 ring-brand-orange/30 shadow-md bg-brand-orange/5"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                        <img referrerPolicy="no-referrer" src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center">{preset.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Photo Upload / Direct URL */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:border-brand-blue text-brand-blue rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>

                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or paste avatar image URL..."
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                    {customAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoURL(customAvatarUrl);
                          setCustomAvatarUrl('');
                        }}
                        className="px-3 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold uppercase"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Administrator Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Kamau"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Contact Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Department / Designation</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  >
                    <option value="Operations & Production">Operations & Factory Production</option>
                    <option value="Senior Management">Senior Executive Management</option>
                    <option value="Embroidery & Printing">Embroidery & Graphic Printing</option>
                    <option value="Sales & Customer Quotes">Sales & Corporate Inquiries</option>
                    <option value="Dispatch & Logistics">Dispatch & 47 Counties Logistics</option>
                    <option value="Quality Assurance">Quality Assurance & KEBS Inspector</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Account Email (Immutable)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || 'Nairobi Internal Admin'}
                    className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-red-200"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 text-slate-400 hover:text-slate-700 text-xs font-bold uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-7 py-3.5 bg-brand-blue hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-blue/20 flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORDS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Reset Via Email Card */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-brand-blue uppercase text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-orange" /> Password Recovery Link
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispatches a secure Firebase password reset email to <span className="font-bold text-slate-800">{user?.email || 'your registered address'}</span>.
                    </p>
                  </div>
                  <button
                    onClick={handleSendResetEmail}
                    disabled={isSendingResetEmail || !user?.email}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:border-brand-orange text-brand-blue rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 shadow-sm flex items-center gap-2"
                  >
                    {isSendingResetEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-brand-orange" />}
                    Send Reset Link
                  </button>
                </div>
              </div>

              {/* Direct Change Password Form */}
              <form onSubmit={handleChangePassword} className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
                <h3 className="font-display font-black text-brand-blue uppercase text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brand-green" /> Change Account Password
                </h3>
                <p className="text-xs text-slate-500">
                  Update your administrative password for direct email/password sign-in.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword}
                    className="px-6 py-3 bg-brand-blue hover:bg-slate-900 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                  >
                    {isChangingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Password
                  </button>
                </div>
              </form>

              {/* Master PIN Status */}
              <div className="p-6 bg-amber-50/70 rounded-3xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Shield className="w-4 h-4 text-brand-orange" />
                  <span>Factory Emergency PIN Override</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Authorized staff can also sign in on floor devices using the Master Passcode (Configured in Global Settings).
                </p>
              </div>

              {/* Session Termination */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Need to exit this workstation?</p>
                  <p className="text-[11px] text-slate-400">Clears auth tokens and locks administrative controls.</p>
                </div>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> End Admin Session
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-black text-brand-blue uppercase text-sm">System Alerts & Notifications</h3>
                <p className="text-xs text-slate-500">Configure which factory and customer events trigger dashboard alerts.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'quotes', label: 'New Proforma Quote Inquiries', desc: 'Alert when a corporate client requests bulk pricing or PDF proforma.', checked: notifyQuotes, setChecked: setNotifyQuotes },
                  { id: 'orders', label: 'New Production Orders', desc: 'Real-time alert on completed cart checkout or customized order submission.', checked: notifyOrders, setChecked: setNotifyOrders },
                  { id: 'stock', label: 'Fabric Stock & Inventory Limits', desc: 'Receive notices when apparel stock falls below safety minimum threshold.', checked: notifyStock, setChecked: setNotifyStock },
                  { id: 'invoices', label: 'Tax Invoices & Milestone Payments', desc: 'Alert when customer deposit slips or M-PESA transaction references are logged.', checked: notifyInvoices, setChecked: setNotifyInvoices },
                ].map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.setChecked(!item.checked)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0",
                        item.checked ? "bg-brand-orange" : "bg-slate-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                          item.checked ? "translate-x-6" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-7 py-3.5 bg-brand-blue hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-blue/20 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
