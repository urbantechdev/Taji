import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Send,
  RefreshCw,
  LogOut,
  KeyRound,
  Database,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { getRoleMetadata } from '../../utils/rbac';
import firebaseConfig from '../../../firebase-applet-config.json';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    adminUser,
    currentUser,
    isEmailVerified,
    sendUserEmailVerification,
    checkEmailVerification,
    verifyEmailManual,
    sendUserPasswordReset,
    signOutGoogleAdmin,
    lockPOSSession,
    locations
  } = useERP();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const userEmail = adminUser?.email || currentUser?.email || 'N/A';
  const userName = adminUser?.displayName || currentUser?.name || 'User';
  const userRole = currentUser?.role || 'pos_cashier';
  const roleMeta = getRoleMetadata(userRole);
  const userLocation = locations.find((l) => l.id === currentUser?.assignedLocation)?.name || 'Main Store';

  const handleResend = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await sendUserEmailVerification();
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Verification link dispatched!' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Could not send verification email.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await checkEmailVerification();
      if (res.isVerified) {
        setFeedback({ type: 'success', text: 'Email verified successfully!' });
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Status refreshed: Email has not been confirmed yet.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to check status.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userEmail || userEmail === 'N/A') return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await sendUserPasswordReset(userEmail);
      if (res.success) {
        setFeedback({ type: 'success', text: `Password reset email sent to ${userEmail}.` });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to send password reset.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Error sending password reset.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center justify-center font-black text-xl">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">{userName}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${roleMeta.dotColor}`} />
                <span>{roleMeta.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`m-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-5">
          {/* Account Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
              <p className="text-xs font-mono font-bold text-slate-900 truncate">{userEmail}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Branch</span>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{userLocation}</span>
              </p>
            </div>
          </div>

          {/* Email Verification Box */}
          <div
            className={`p-4 rounded-2xl border ${
              isEmailVerified
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            } space-y-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEmailVerified ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <h4 className="text-xs font-black">
                    {isEmailVerified ? 'Email Verified via Firebase' : 'Email Verification Pending'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {isEmailVerified
                      ? 'Your account has verified email credentials.'
                      : 'Firebase email verification is required for full administrative access.'}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isEmailVerified
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-amber-200 text-amber-900 animate-pulse'
                }`}
              >
                {isEmailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            {!isEmailVerified && (
              <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Resend Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Check Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    verifyEmailManual();
                    setFeedback({ type: 'success', text: 'Email marked as verified in preview mode!' });
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Instant Verify (Preview)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Send Password Reset Email</span>
              </span>
              <span className="text-[10px] text-slate-400">Firebase Auth</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-600 text-xs">
              <div className="flex items-center justify-between font-bold text-[11px] text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-500" />
                  Firebase Project Connected
                </span>
                <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                  Online
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                Project ID: {firebaseConfig.projectId}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                lockPOSSession();
                signOutGoogleAdmin();
                onClose();
              }}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out &amp; Lock Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
