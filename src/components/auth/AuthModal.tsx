import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  LogOut,
  KeyRound,
  Delete,
  Store,
  CheckCircle,
  AlertCircle,
  UserCheck,
  X,
  User
} from 'lucide-react';
import { LocationId } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    posSession,
    unlockPOSWithPin,
    lockPOSSession,
    adminUser,
    isGoogleAdminAuthenticated,
    isGoogleAuthLoading,
    signInWithGoogleAdmin,
    signOutGoogleAdmin,
    activeLocation,
    setActiveLocation,
    brandSettings
  } = useERP();

  const [activeTab, setActiveTab] = useState<'pin' | 'admin'>('pin');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;

  if (!isAuthModalOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);
      if (nextPin.length === 6) {
        attemptUnlock(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const attemptUnlock = (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your cashier PIN.');
      return;
    }
    const result = unlockPOSWithPin(pinToSubmit);
    if (result.success) {
      setSuccessMessage(result.message);
      setErrorMessage(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setPin('');
        setIsAuthModalOpen(false);
      }, 800);
    } else {
      setErrorMessage(result.message);
      setPin('');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const res = await signInWithGoogleAdmin();
    setIsSigningIn(false);
    if (res.success) {
      setSuccessMessage('Successfully signed in as Administrator!');
      setTimeout(() => {
        setSuccessMessage(null);
        setIsAuthModalOpen(false);
      }, 800);
    } else {
      setErrorMessage(res.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] sm:max-w-md bg-white rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 shadow-2xl overflow-y-auto flex flex-col animate-scaleUp">
        
        {/* Header Bar */}
        <div className="bg-white p-4 sm:p-5 text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-rose-100 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={brandSettings.brandName || 'Logo'}
                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-lg sm:rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-sm sm:text-base">
                  {(brandSettings.brandName || 'T').charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900">System Authentication</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{brandSettings.brandName} • {brandSettings.tagline}</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('pin'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-rose-600" />
            <span>Cashier PIN Login</span>
          </button>

          <button
            onClick={() => { setActiveTab('admin'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Admin Google Login</span>
          </button>
        </div>

        {/* Current Active Session Status Info */}
        {(posSession?.isUnlocked || isGoogleAdminAuthenticated) && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold">Active Logged-In Identity:</p>
                <p className="font-medium text-[11px] text-emerald-800">
                  {posSession?.isUnlocked ? `${posSession.operatorName} (${posSession.role})` : `Admin: ${adminUser?.email}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                lockPOSSession();
                signOutGoogleAdmin();
                setSuccessMessage('Logged out successfully.');
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <LogOut className="w-3 h-3" />
              <span>Lock / Exit</span>
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: 6-DIGIT POS PIN KEYPAD LOGIN */}
        {activeTab === 'pin' && (
          <div className="p-5 space-y-4">
            
            {/* Store Terminal Selection */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-rose-600" />
                Select Terminal Register Location:
              </label>
              <select
                value={activeLocation === 'main_store' ? 'sales_shop' : activeLocation}
                onChange={(e) => setActiveLocation(e.target.value as LocationId)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="sales_shop">Sales Shop (Retail POS)</option>
                <option value="branch_westlands">Westlands Flagship Branch</option>
                <option value="store_1">Store 1 (Transfer Only)</option>
                <option value="store_2">Store 2 (Transfer Only)</option>
              </select>
            </div>

            {/* Default Access PIN Banner */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold">Default Access PIN: </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-slate-900">123456</span>
              </div>
            </div>

            {/* PIN Dots display */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const hasDigit = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-9 h-11 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      hasDigit
                        ? 'border-slate-900 bg-slate-900 text-white scale-105 shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {hasDigit ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-lg font-black rounded-2xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleClear}
                className="h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-2xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>

              <button
                onClick={() => handleDigit('0')}
                className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-lg font-black rounded-2xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <button
              onClick={() => attemptUnlock()}
              disabled={pin.length !== 6}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Unlock Terminal Session</span>
            </button>
          </div>
        )}

        {/* TAB 2: ADMIN GOOGLE SIGN-IN & SUPER ADMIN AUTH */}
        {activeTab === 'admin' && (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Executive Administrator Authentication</h3>
              <p className="text-xs text-slate-500">
                Google OAuth sign-in for store owners, accounting controllers, and whitelisted administrators.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer border border-slate-800 disabled:opacity-50"
            >
              {isSigningIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Sign in with Google Admin</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Whitelisted Admin Email:
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Super Admin
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-rose-700 bg-white p-2 rounded-xl border border-slate-200">
                urbaninteriorkenya@gmail.com
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
