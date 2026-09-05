import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { LocationId } from '../../types';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playClickSound, playSuccessSound, playErrorSound } from '../../utils/audio';
import {
  Lock,
  KeyRound,
  Delete,
  Store,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Users,
  Keyboard,
  Globe,
  Loader2,
  Sparkles
} from 'lucide-react';

export const PlatformLockScreen: React.FC = () => {
  const {
    unlockPOSWithPin,
    activeLocation,
    setActiveLocation,
    brandSettings,
    locations,
    setViewMode,
    signInWithGoogleAdmin,
    signInAsWhitelistedAdmin,
    signInAsAccountant,
    posOperators
  } = useERP();

  // Selected login box: 'admin' (Login as Admin) or 'staff' (Login as Staff)
  const [selectedBox, setSelectedBox] = useState<'admin' | 'staff'>('admin');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;
  
  // Non-admin staff locations
  const staffLocations = locations.filter(loc => loc.id !== 'main_store');

  // Auto-focus input on mount or when switching boxes
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedBox]);

  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 6) {
          attemptUnlock(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, selectedBox]);

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

  const handleSelectBox = (box: 'admin' | 'staff') => {
    if (selectedBox !== box) {
      playClickSound();
      setSelectedBox(box);
      setPin('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const attemptUnlock = (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 6) {
      setErrorMessage(`Please enter all 6 numeric digits of your ${selectedBox === 'admin' ? 'Admin' : 'Staff'} PIN.`);
      playErrorSound();
      return;
    }

    if (selectedBox === 'admin') {
      // Allow PIN login for both Administrators and Accountants
      const matchedOp = posOperators.find(op => Boolean(op.pin && op.pin.length === 6 && op.pin === pinToSubmit));
      if (matchedOp && matchedOp.role !== 'admin' && matchedOp.role !== 'accountant') {
        playErrorSound();
        setErrorMessage(`"${matchedOp.name}" has staff role (${matchedOp.role}). Please select the "Login as Staff" box to access your register.`);
        setPin('');
        return;
      }

      const result = unlockPOSWithPin(pinToSubmit);
      if (result.success) {
        playSuccessSound();
        setSuccessMessage(
          matchedOp?.role === 'accountant'
            ? 'Welcome Chief Accountant! Finance Portal Unlocked.'
            : 'Welcome Administrator! Executive Portal Unlocked.'
        );
        setErrorMessage(null);
      } else {
        playErrorSound();
        setErrorMessage(result.message || 'Invalid 6-digit Admin/Accountant PIN. Please verify your credentials or use Google Sign-In.');
        setPin('');
      }
    } else {
      // Staff login: check if operator is admin or accountant
      const matchedOp = posOperators.find(op => Boolean(op.pin && op.pin.length === 6 && op.pin === pinToSubmit));
      if (matchedOp && (matchedOp.role === 'admin' || matchedOp.role === 'accountant')) {
        playErrorSound();
        setErrorMessage(`"${matchedOp.name}" is an ${matchedOp.role === 'admin' ? 'Administrator' : 'Accountant'}. Please select the "Admin / Accountant" box.`);
        setPin('');
        return;
      }

      const result = unlockPOSWithPin(pinToSubmit);
      if (result.success) {
        playSuccessSound();
        setSuccessMessage(result.message);
        setErrorMessage(null);
      } else {
        playErrorSound();
        setErrorMessage(result.message || 'Invalid 6-digit Staff PIN code. Please contact your store manager.');
        setPin('');
      }
    }
  };

  const handleGoogleAdminLogin = async () => {
    playClickSound();
    setIsGoogleSigningIn(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    try {
      const res = await signInWithGoogleAdmin();
      if (res.success) {
        playSuccessSound();
        setSuccessMessage(res.message || 'Authenticated successfully via Google.');
      } else {
        playErrorSound();
        if (res.isUnauthorizedDomain) {
          setUnauthorizedDomain(res.domain || window.location.hostname);
          setErrorMessage(`Firebase Auth Error: Domain "${res.domain || window.location.hostname}" is not authorized in Firebase Console.`);
        } else {
          setErrorMessage(res.message || 'Google authentication failed.');
        }
      }
    } catch (err: any) {
      playErrorSound();
      const msg = err?.message || 'Failed to sign in with Google.';
      if (msg.includes('unauthorized-domain')) {
        setUnauthorizedDomain(window.location.hostname);
      }
      setErrorMessage(msg);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col items-center justify-between sm:justify-center p-3 sm:p-6 overflow-y-auto min-h-[100dvh] antialiased select-none">
      
      {/* Crisp Light Ambient Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-transparent pointer-events-none rounded-full blur-2xl" />

      <div className="w-full max-w-lg relative z-10 space-y-3 sm:space-y-4 my-auto flex flex-col justify-center">
        
        {/* Prominent Brand Logo & Title Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          
          {/* Logo Frame */}
          <div className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-white border-2 border-rose-100 shadow-lg sm:shadow-xl shadow-rose-900/10 ring-2 sm:ring-4 ring-rose-50 transition-transform hover:scale-105">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={brandSettings.brandName || 'Brand Logo'}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-700 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-inner">
                {(brandSettings.brandName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {brandSettings.brandName}
            </h1>
            
            <div className="pt-0.5">
              <a
                href="https://urbantechdev.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-medium max-w-xs mx-auto transition-colors"
                title="Visit urbantechdev.com"
              >
                <span>Powered by <strong className="text-slate-700 hover:text-rose-600 font-bold">urbantechdev</strong></span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden">
          
          {/* TWO SELECTABLE LOGIN BOXES */}
          <div className="p-3 sm:p-4 bg-slate-50/90 border-b border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              Select Login Access Mode
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              
              {/* Box 1: Select Login as Admin / Accountant */}
              <button
                type="button"
                id="login-select-admin-box"
                onClick={() => handleSelectBox('admin')}
                className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border relative ${
                  selectedBox === 'admin'
                    ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20 text-slate-900'
                    : 'bg-white/70 border-slate-200 hover:border-rose-300 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    selectedBox === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    selectedBox === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Admin &amp; Finance
                  </span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">Admin / Accountant</div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Google Sign-In Required for Accountants
                  </p>
                </div>
                {selectedBox === 'admin' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Box 2: Select Login as Staff */}
              <button
                type="button"
                id="login-select-staff-box"
                onClick={() => handleSelectBox('staff')}
                className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border relative ${
                  selectedBox === 'staff'
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20 text-slate-900'
                    : 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    selectedBox === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    selectedBox === 'staff' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Staff
                  </span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">Login as Staff</div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Cashier POS &amp; Registers
                  </p>
                </div>
                {selectedBox === 'staff' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </button>

            </div>
          </div>

          {/* Active Box Sub-Header Label */}
          <div className="py-2 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-2">
            {selectedBox === 'admin' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                  Administrator Portal Passcode
                </span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                  Staff Terminal Passcode
                </span>
              </>
            )}
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

          {/* FORM BODY FOR SELECTED LOGIN BOX */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            
            {/* Staff-Only: Store Register Location Selector */}
            {selectedBox === 'staff' && (
              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
                    Assigned Store Register:
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Syncs with staff</span>
                </label>
                <select
                  value={activeLocation === 'main_store' ? (staffLocations[0]?.id || 'sales_shop') : activeLocation}
                  onChange={e => setActiveLocation(e.target.value as LocationId)}
                  className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {staffLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {!loc.canSellDirectly ? '(Sub-Depot)' : '(Active Register)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 6-Digit PIN Indicators */}
            <div 
              onClick={() => inputRef.current?.focus()} 
              className="space-y-1.5 text-center cursor-pointer group"
              title="Click anywhere here or use your physical keyboard or numpad directly"
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600">
                <Keyboard className={`w-3.5 h-3.5 ${selectedBox === 'admin' ? 'text-rose-600' : 'text-indigo-600'}`} />
                <span>Enter 6-Digit {selectedBox === 'admin' ? 'Admin' : 'Staff'} Passcode</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Type with physical keyboard numbers/numpad or click keypad below</p>

              {/* Hidden input to ensure soft keyboard on touch and direct focus capture */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(val);
                  setErrorMessage(null);
                  if (val.length === 6) {
                    attemptUnlock(val);
                  }
                }}
                className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
                aria-label={`${selectedBox === 'admin' ? 'Admin' : 'Staff'} PIN Passcode`}
                autoFocus
              />

              <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-0.5 sm:py-1">
                {[0, 1, 2, 3, 4, 5].map(index => {
                  const hasDigit = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black transition-all ${
                        hasDigit
                          ? selectedBox === 'admin'
                            ? 'border-rose-600 bg-rose-600 text-white scale-105 shadow-md'
                            : 'border-slate-900 bg-slate-900 text-white scale-105 shadow-md'
                          : selectedBox === 'admin'
                            ? 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-rose-300'
                            : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-indigo-300'
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
              className={`w-full text-white font-bold text-xs py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 ${
                selectedBox === 'admin'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {selectedBox === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-rose-200" />
                  <span>Unlock Admin Portal</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Unlock Terminal Session</span>
                </>
              )}
            </button>

            {/* Admin-Only: Google Sign-In Alternative */}
            {selectedBox === 'admin' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Use Google OAuth
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAdminLogin}
                  disabled={isGoogleSigningIn}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
                >
                  {isGoogleSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>{isGoogleSigningIn ? 'Signing In...' : 'Sign In with Google (Admin & Accountant)'}</span>
                </button>

                {/* Unauthorized Domain Error Callout with One-Click Access */}
                {unauthorizedDomain && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-left animate-fadeIn">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900 leading-tight">
                        <span className="font-bold">Firebase Authorized Domain Notice:</span>
                        <p className="mt-0.5 text-amber-800">
                          Domain <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{unauthorizedDomain}</code> must be added to <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-amber-200/80 space-y-1.5">
                      <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                        Quick Preview Authorization:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            signInAsWhitelistedAdmin('feminiholdings@gmail.com');
                            playSuccessSound();
                            setSuccessMessage('Welcome Administrator! Session authorized.');
                          }}
                          className="p-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer shadow-2xs"
                        >
                          Continue as Super Admin
                          <span className="block text-[9px] text-slate-400 font-mono font-normal truncate">feminiholdings@gmail.com</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            signInAsAccountant('accountant@taji.co.ke');
                            playSuccessSound();
                            setSuccessMessage('Welcome Chief Accountant! Session authorized.');
                          }}
                          className="p-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer shadow-2xs"
                        >
                          Continue as Accountant
                          <span className="block text-[9px] text-slate-400 font-mono font-normal">Finance &amp; Ledger Access</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick PINs:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPin('123456');
                      attemptUnlock('123456');
                    }}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Admin (123456)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPin('654321');
                      attemptUnlock('654321');
                    }}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Accountant (654321)
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-500 font-medium">
                  Accountants &amp; Administrators use Google Sign-In for role-verified access.
                </p>
              </div>
            )}

          </div>

          {/* Return to Public Customer Storefront Footer */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                playClickSound();
                setViewMode('storefront');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-rose-600" />
              <span>Visit Public Website</span>
            </button>
            <span className="text-[11px] text-slate-500 font-medium">
              Taji Enterprise ERP
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

