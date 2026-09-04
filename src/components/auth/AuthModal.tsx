import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playClickSound, playSuccessSound, playErrorSound } from '../../utils/audio';
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
  Users,
  X,
  User,
  Keyboard,
  Loader2
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
    brandSettings,
    locations,
    posOperators
  } = useERP();

  // Selected login box: 'admin' (Login as Admin) or 'staff' (Login as Staff)
  const [selectedBox, setSelectedBox] = useState<'admin' | 'staff'>('admin');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;

  // Focus hidden input when modal opens or when switching boxes
  useEffect(() => {
    if (isAuthModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAuthModalOpen, selectedBox]);

  // Global physical keyboard listener when AuthModal is open
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
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
  }, [isAuthModalOpen, pin, selectedBox]);

  if (!isAuthModalOpen) return null;

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
      setErrorMessage(`Please enter all 6 digits of your ${selectedBox === 'admin' ? 'Admin' : 'Staff'} PIN.`);
      playErrorSound();
      return;
    }

    if (selectedBox === 'admin') {
      // Validate that PIN belongs to an admin
      const matchedOp = posOperators.find(op => Boolean(op.pin && op.pin.length === 6 && op.pin === pinToSubmit));
      if (matchedOp && matchedOp.role !== 'admin') {
        playErrorSound();
        setErrorMessage(`"${matchedOp.name}" has staff role (${matchedOp.role}). Please select the "Login as Staff" box to access your register.`);
        setPin('');
        return;
      }

      const result = unlockPOSWithPin(pinToSubmit);
      if (result.success) {
        playSuccessSound();
        setSuccessMessage('Welcome Administrator! Unlocked successfully.');
        setErrorMessage(null);
        setTimeout(() => {
          setSuccessMessage(null);
          setPin('');
          setIsAuthModalOpen(false);
        }, 700);
      } else {
        playErrorSound();
        setErrorMessage(result.message || 'Invalid 6-digit Admin PIN. Please verify credentials.');
        setPin('');
      }
    } else {
      // Staff login
      const result = unlockPOSWithPin(pinToSubmit);
      if (result.success) {
        playSuccessSound();
        setSuccessMessage(result.message);
        setErrorMessage(null);
        setTimeout(() => {
          setSuccessMessage(null);
          setPin('');
          setIsAuthModalOpen(false);
        }, 700);
      } else {
        playErrorSound();
        setErrorMessage(result.message || 'Invalid 6-digit Staff PIN code.');
        setPin('');
      }
    }
  };

  const handleGoogleAdminLogin = async () => {
    playClickSound();
    setIsGoogleSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogleAdmin();
      if (res.success) {
        playSuccessSound();
        setSuccessMessage('Administrator authenticated successfully via Google.');
        setTimeout(() => {
          setSuccessMessage(null);
          setIsAuthModalOpen(false);
        }, 700);
      } else {
        playErrorSound();
        setErrorMessage(res.message || 'Google Admin authentication failed.');
      }
    } catch (err: any) {
      playErrorSound();
      setErrorMessage(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] sm:max-w-lg bg-white rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 shadow-2xl overflow-y-auto flex flex-col animate-scaleUp">
        
        {/* Header Bar */}
        <div className="bg-white p-3.5 sm:p-4 text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-rose-100 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={brandSettings.brandName || 'Logo'}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-rose-600 text-white font-black flex items-center justify-center text-sm">
                  {(brandSettings.brandName || 'T').charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900">System Authentication</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>{brandSettings.brandName}</span>
                <span>•</span>
                <a
                  href="https://urbantechdev.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-rose-600 font-semibold transition-colors"
                >
                  Powered by urbantechdev
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TWO SELECTABLE LOGIN BOXES */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
            Select Login Access Mode
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* Box 1: Select Login as Admin */}
            <button
              type="button"
              id="authmodal-select-admin-box"
              onClick={() => handleSelectBox('admin')}
              className={`p-3 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border relative ${
                selectedBox === 'admin'
                  ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20 text-slate-900'
                  : 'bg-white/70 border-slate-200 hover:border-rose-300 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  selectedBox === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  selectedBox === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  Admin
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900">Login as Admin</div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  ERP &amp; Management
                </p>
              </div>
              {selectedBox === 'admin' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* Box 2: Select Login as Staff */}
            <button
              type="button"
              id="authmodal-select-staff-box"
              onClick={() => handleSelectBox('staff')}
              className={`p-3 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border relative ${
                selectedBox === 'staff'
                  ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20 text-slate-900'
                  : 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
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
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  Cashier &amp; POS Registers
                </p>
              </div>
              {selectedBox === 'staff' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              )}
            </button>

          </div>
        </div>

        {/* Current Active Session Status Info */}
        {(posSession?.isUnlocked || isGoogleAdminAuthenticated) && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-[11px]">Active Session:</p>
                <p className="font-medium text-[10px] text-emerald-800">
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

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6-DIGIT POS PIN KEYPAD LOGIN */}
        <div className="p-4 sm:p-5 space-y-3.5">
          
          {/* Staff-Only: Store Terminal Selection */}
          {selectedBox === 'staff' && (
            <div className="p-2.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                Select Terminal Register Location:
              </label>
              <select
                value={activeLocation === 'main_store' ? 'sales_shop' : activeLocation}
                onChange={(e) => setActiveLocation(e.target.value as LocationId)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {locations.filter(l => l.status === 'active' && l.id !== 'main_store').map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN Dots display & Hidden keyboard input */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="space-y-1.5 text-center cursor-pointer group"
            title="Click anywhere here or type with your physical keyboard"
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600">
              <Keyboard className={`w-3.5 h-3.5 ${selectedBox === 'admin' ? 'text-rose-600' : 'text-indigo-600'}`} />
              <span>Enter 6-Digit {selectedBox === 'admin' ? 'Admin' : 'Staff'} Passcode</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Type with physical keyboard or click keypad below</p>

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

            <div className="flex items-center justify-center gap-2 py-0.5">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const hasDigit = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-8 h-10 sm:w-9 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold transition-all ${
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

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
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
              className="h-10 sm:h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl sm:rounded-2xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
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
            className={`w-full text-white font-bold text-xs py-3 px-4 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 ${
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
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or Sign In with Google
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={isGoogleSigningIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl sm:rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
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
                <span>{isGoogleSigningIn ? 'Signing In...' : 'Sign In with Google Admin'}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

