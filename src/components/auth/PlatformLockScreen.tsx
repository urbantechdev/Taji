import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LocationId } from '../../types';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playClickSound, playSuccessSound, playErrorSound } from '../../utils/audio';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  Delete,
  Store,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Building,
  UserCheck
} from 'lucide-react';

export const PlatformLockScreen: React.FC = () => {
  const {
    unlockPOSWithPin,
    signInWithGoogleAdmin,
    signInAsWhitelistedAdmin,
    isGoogleAuthLoading,
    activeLocation,
    setActiveLocation,
    brandSettings,
    locations,
    posOperators
  } = useERP();

  const [activeTab, setActiveTab] = useState<'pin' | 'admin'>('pin');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;
  
  // Non-admin staff locations (Main Store is managed via Admin Gmail login)
  const staffLocations = locations.filter(loc => loc.id !== 'main_store');

  const handleDigit = (digit: string) => {
    playClickSound();
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
    playClickSound();
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    playClickSound();
    setPin('');
    setErrorMessage(null);
  };

  const attemptUnlock = (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 6) {
      setErrorMessage('Please enter all 6 numeric digits of your staff PIN.');
      playErrorSound();
      return;
    }

    const result = unlockPOSWithPin(pinToSubmit);
    if (result.success) {
      playSuccessSound();
      setSuccessMessage(result.message);
      setErrorMessage(null);
    } else {
      playErrorSound();
      setErrorMessage(result.message);
      setPin('');
    }
  };

  const handleGoogleSignIn = async () => {
    playClickSound();
    setIsSigningIn(true);
    setErrorMessage(null);
    const res = await signInWithGoogleAdmin();
    setIsSigningIn(false);
    if (res.success) {
      playSuccessSound();
      setSuccessMessage('Successfully authenticated as Executive Administrator!');
    } else {
      playErrorSound();
      setErrorMessage(res.message || 'Google authentication failed.');
    }
  };

  // Quick fallback login for whitelisted admin (if Google popup blocked in container)
  const handleQuickAdminLogin = () => {
    playSuccessSound();
    setSuccessMessage('Admin session granted for whitelisted administrator.');
    signInAsWhitelistedAdmin('urbaninteriorkenya@gmail.com');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col items-center justify-between sm:justify-center p-3 sm:p-6 overflow-y-auto min-h-[100dvh] antialiased select-none">
      
      {/* Crisp Light Ambient Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-transparent pointer-events-none rounded-full blur-2xl" />

      <div className="w-full max-w-md relative z-10 space-y-3 sm:space-y-5 my-auto flex flex-col justify-center">
        
        {/* Prominent Brand Logo & Title Header */}
        <div className="text-center space-y-1.5 sm:space-y-3">
          
          {/* Logo Frame */}
          <div className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-white border-2 border-rose-100 shadow-lg sm:shadow-xl shadow-rose-900/10 ring-2 sm:ring-4 ring-rose-50 transition-transform hover:scale-105">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={brandSettings.brandName || 'Brand Logo'}
                className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-700 flex items-center justify-center text-white font-black text-xl sm:text-3xl shadow-inner">
                {(brandSettings.brandName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] sm:text-[11px] font-bold tracking-wide">
              <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
              <span>Enterprise Terminal Access</span>
            </div>
            
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {brandSettings.brandName}
            </h1>
            
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium max-w-xs mx-auto">
              {brandSettings.tagline || 'Textile Inventory & ETR Billing Platform'}
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl sm:shadow-2xl shadow-slate-200/80 overflow-hidden">
          
          {/* Mode Switcher Tabs */}
          <div className="p-1 sm:p-1.5 bg-slate-100/90 border-b border-slate-200 grid grid-cols-2 gap-1 sm:gap-1.5">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('pin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
              <span>Staff PIN Login</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('admin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              <span>Admin Gmail</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mx-4 sm:mx-5 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mx-4 sm:mx-5 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: 6-DIGIT STAFF PIN LOGIN */}
          {activeTab === 'pin' && (
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              
              {/* Location Selector */}
              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                    Assigned Store Location:
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Auto-syncs on PIN</span>
                </label>
                <select
                  value={activeLocation === 'main_store' ? (staffLocations[0]?.id || 'sales_shop') : activeLocation}
                  onChange={e => setActiveLocation(e.target.value as LocationId)}
                  className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {staffLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {!loc.canSellDirectly ? '(Sub-Depot)' : '(Active Register)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6-Digit PIN Indicators */}
              <div className="space-y-1 text-center">
                <p className="text-[11px] sm:text-xs font-bold text-slate-600">Enter 6-Digit Cashier / Staff Passcode</p>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-0.5 sm:py-1">
                  {[0, 1, 2, 3, 4, 5].map(index => {
                    const hasDigit = pin.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black transition-all ${
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
              </div>

              {/* 3x4 Keypad */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    onClick={() => handleDigit(digit)}
                    className="h-10 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  onClick={handleClear}
                  className="h-10 sm:h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                >
                  Clear
                </button>

                <button
                  onClick={() => handleDigit('0')}
                  className="h-10 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                >
                  0
                </button>

                <button
                  onClick={handleBackspace}
                  className="h-10 sm:h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl sm:rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => attemptUnlock()}
                disabled={pin.length !== 6}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Unlock Terminal Session</span>
              </button>

            </div>
          )}

          {/* TAB 2: EXECUTIVE ADMIN GOOGLE GMAIL LOGIN */}
          {activeTab === 'admin' && (
            <div className="p-5 sm:p-6 space-y-5">
              
              <div className="text-center space-y-2 py-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Executive Admin Authentication
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Sign in with your verified Google / Gmail administrator account to access the executive dashboard, ledger, payroll, and settings.
                </p>
              </div>

              {/* Primary Google OAuth Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isGoogleAuthLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs py-3.5 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer border border-slate-300 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span className="text-sm font-bold">Sign in with Google</span>
              </button>

              {/* Whitelisted Super Admin Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Authorized Administrator:
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Full Admin Access
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-xs font-bold text-rose-700 flex items-center justify-between">
                  <span>urbaninteriorkenya@gmail.com</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">(Owner)</span>
                </div>

                {/* Instant Whitelisted Admin Bypass Button */}
                <button
                  onClick={handleQuickAdminLogin}
                  className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Authenticate as Executive Super Admin</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
