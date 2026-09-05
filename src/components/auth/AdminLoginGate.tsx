import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Lock, ShieldCheck, ShieldAlert, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

export const AdminLoginGate: React.FC = () => {
  const {
    adminUser,
    isGoogleAdminAuthenticated,
    isGoogleAuthLoading,
    signInWithGoogleAdmin,
    signOutGoogleAdmin,
    brandSettings
  } = useERP();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await signInWithGoogleAdmin();
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to authenticate with Google.');
    }
  };

  if (isGoogleAuthLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center animate-pulse">
          <Lock className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-600">Verifying Admin Credentials...</p>
      </div>
    );
  }

  // Case 1: User is logged into Google, but not whitelisted
  if (adminUser && !isGoogleAdminAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-2xl p-8 sm:p-10 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-700">
            <span>Unauthorized Google Account</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            You are signed in as <strong className="text-slate-900 font-mono">{adminUser.email}</strong>, which is not an authorized administrator account for this platform.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Super Admin Whitelist:</span>
          </p>
          <p className="text-xs font-mono text-rose-700 bg-white px-3 py-1.5 rounded-xl border border-rose-200 font-semibold">
            urbaninteriorkenya@gmail.com
          </p>
          <p className="text-[11px] text-slate-500">
            Only whitelisted administrators and operators created by the Super Admin can access executive management controls.
          </p>
        </div>

        <button
          onClick={signOutGoogleAdmin}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out &amp; Use Authorized Google Account</span>
        </button>
      </div>
    );
  }

  // Case 2: Not logged into Google at all
  return (
    <div className="max-w-xl mx-auto my-8 sm:my-12 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-8 text-white text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-7 h-7 text-rose-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Firebase OAuth Secured</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Executive &amp; Finance Portal Locked</h1>
        <p className="text-xs text-rose-100 max-w-md mx-auto leading-relaxed">
          Google Sign-In authentication is required to access executive store analytics, catalog management, General Ledger, KRA VAT compliance, and payroll.
        </p>
      </div>

      {/* Main Form Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 border border-slate-800"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google (Admin &amp; Accountant)</span>
          </button>
        </div>

        {/* Super Admin Whitelist Badge Callout */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Whitelisted Super Admin
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Active
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-rose-700">
              urbaninteriorkenya@gmail.com
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside leading-normal">
            <li>Full executive access to all store locations</li>
            <li>Create &amp; manage POS users, Cashier 6-digit PINs, and operators</li>
            <li>Configure ETR, VAT, and financial ledgers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
