import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { BrandLogo } from '../common/BrandLogo';
import { playClickSound, playSuccessSound, playErrorSound } from '../../utils/audio';
import { getRoleMetadata } from '../../utils/rbac';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  Landmark,
  LogOut,
  KeyRound,
  Delete,
  Store,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Users,
  X,
  Keyboard,
  Loader2,
  Check,
  ChevronDown
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
    signInWithGoogleAdmin,
    signInAsWhitelistedAdmin,
    signInAsAccountant,
    signOutGoogleAdmin,
    activeLocation,
    setActiveLocation,
    brandSettings,
    locations,
    posOperators
  } = useERP();

  // Exactly three selectable login boxes: 'admin', 'accountant', 'staff'
  const [selectedBox, setSelectedBox] = useState<'admin' | 'accountant' | 'staff'>('admin');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;

  // Active created staff operators (excluding admin & accountant)
  const activeStaffOperators = posOperators.filter(
    op => op.role !== 'admin' && op.role !== 'accountant' && op.status === 'active'
  );

  // Selected staff created name - starts unselected so user picks from dropdown first
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const currentStaff = activeStaffOperators.find(op => op.id === selectedStaffId);

  // Non-admin staff locations
  const staffLocations = locations.filter(loc => loc.id !== 'main_store');
  const [selectedStaffLocation, setSelectedStaffLocation] = useState<LocationId>('sales_shop');

  // Sync location when staff selection changes
  useEffect(() => {
    if (currentStaff?.location) {
      setSelectedStaffLocation(currentStaff.location);
    }
  }, [selectedStaffId, currentStaff]);

  // Focus input when modal opens or switches to staff and a staff member is selected
  useEffect(() => {
    if (isAuthModalOpen && selectedBox === 'staff' && selectedStaffId) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isAuthModalOpen, selectedBox, selectedStaffId]);

  // Physical keyboard listener when modal is open - ONLY active when Staff is chosen AND a staff member is selected
  useEffect(() => {
    if (!isAuthModalOpen || selectedBox !== 'staff' || !selectedStaffId || !currentStaff) return;

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
        setIsAuthModalOpen(false);
      } else if (e.key === 'Delete') {
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
  }, [isAuthModalOpen, pin, selectedBox, selectedStaffId, currentStaff, selectedStaffLocation]);

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

  const handleSelectBox = (box: 'admin' | 'accountant' | 'staff') => {
    if (selectedBox !== box) {
      playClickSound();
      setSelectedBox(box);
      setPin('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setUnauthorizedDomain(null);
    }
  };

  const attemptUnlock = (pinToSubmit: string = pin) => {
    if (selectedBox !== 'staff') {
      return;
    }

    if (pinToSubmit.length !== 6) {
      setErrorMessage(`Please enter all 6 numeric digits of the Staff PIN.`);
      playErrorSound();
      return;
    }

    if (!currentStaff) {
      setErrorMessage('No staff member found. Please contact the administrator.');
      playErrorSound();
      return;
    }

    // Check if PIN belongs to admin or accountant
    const adminOrAccountantOp = posOperators.find(
      op => Boolean(op.pin && op.pin.length === 6 && op.pin === pinToSubmit && (op.role === 'admin' || op.role === 'accountant'))
    );
    if (adminOrAccountantOp) {
      playErrorSound();
      setErrorMessage(`"${adminOrAccountantOp.name}" is an ${adminOrAccountantOp.role === 'admin' ? 'Administrator' : 'Accountant'}. Administrators and Accountants must log in using Gmail. Please select the Admin or Accountant box above.`);
      setPin('');
      return;
    }

    // Unlock under selected staff created name
    const result = unlockPOSWithPin(pinToSubmit, selectedStaffLocation, currentStaff.id);
    if (result.success) {
      playSuccessSound();
      setSuccessMessage(`Welcome ${currentStaff.name}! Terminal session unlocked.`);
      setErrorMessage(null);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMessage(null);
      }, 700);
    } else {
      playErrorSound();
      setErrorMessage(result.message || `Incorrect 6-digit PIN for ${currentStaff.name}. Please enter the assigned PIN.`);
      setPin('');
    }
  };

  const handleGoogleLogin = async (targetRole: 'admin' | 'accountant') => {
    playClickSound();
    setIsGoogleSigningIn(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    try {
      const res = await signInWithGoogleAdmin(targetRole);
      if (res.success) {
        playSuccessSound();
        setSuccessMessage(res.message || `Authenticated successfully as ${targetRole === 'admin' ? 'Administrator' : 'Accountant'}.`);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setSuccessMessage(null);
        }, 700);
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo
              logoUrl={displayLogo}
              brandName={brandSettings.brandName}
              size="sm"
              effect={brandSettings?.logoEffect || 'gleam'}
              primaryColor={brandSettings?.primaryColor || '#B50044'}
            />
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                {brandSettings.brandName}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* THREE ACCESS BUTTONS */}
        <div className="p-2 sm:p-2.5 bg-slate-100/80 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            
            {/* Admin Button */}
            <button
              type="button"
              id="authmodal-select-admin-box"
              onClick={() => handleSelectBox('admin')}
              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedBox === 'admin'
                  ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin</span>
            </button>

            {/* Accountant Button */}
            <button
              type="button"
              id="authmodal-select-accountant-box"
              onClick={() => handleSelectBox('accountant')}
              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedBox === 'accountant'
                  ? 'bg-white text-emerald-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Accountant</span>
            </button>

            {/* Staff Button */}
            <button
              type="button"
              id="authmodal-select-staff-box"
              onClick={() => handleSelectBox('staff')}
              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedBox === 'staff'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff</span>
            </button>
          </div>
        </div>

        {/* Current Active Session Status Info */}
        {(posSession?.isUnlocked || isGoogleAdminAuthenticated) && (
          <div className="mx-4 sm:mx-5 mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-bold text-[11px] text-emerald-800">
                {posSession?.isUnlocked ? `${posSession.operatorName} (${posSession.role})` : `Admin: ${adminUser?.email}`}
              </p>
            </div>
            <button
              onClick={() => {
                lockPOSSession();
                signOutGoogleAdmin();
                setSuccessMessage('Logged out successfully.');
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <LogOut className="w-3 h-3" />
              <span>Lock</span>
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* CARD BODY */}
        <div className="p-4 sm:p-5 space-y-3">
          
          {/* VIEW 1: ADMIN */}
          {selectedBox === 'admin' && (
            <div className="space-y-3 text-center">
              <button
                type="button"
                onClick={() => handleGoogleLogin('admin')}
                disabled={isGoogleSigningIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
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
                <span>{isGoogleSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  signInAsWhitelistedAdmin();
                  playSuccessSound();
                  setSuccessMessage('Welcome Administrator');
                  setTimeout(() => {
                    setIsAuthModalOpen(false);
                    setSuccessMessage(null);
                  }, 600);
                }}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Continue as Admin</span>
              </button>

              {unauthorizedDomain && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                  Domain <code className="font-mono font-bold">{unauthorizedDomain}</code> needs authorization in Firebase Console.
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ACCOUNTANT */}
          {selectedBox === 'accountant' && (
            <div className="space-y-3 text-center">
              <button
                type="button"
                onClick={() => handleGoogleLogin('accountant')}
                disabled={isGoogleSigningIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
              >
                {isGoogleSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
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
                <span>{isGoogleSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  signInAsAccountant('mwkomu@gmail.com');
                  playSuccessSound();
                  setSuccessMessage('Welcome Accountant (mwkomu@gmail.com)');
                  setTimeout(() => {
                    setIsAuthModalOpen(false);
                    setSuccessMessage(null);
                  }, 600);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm"
              >
                <Landmark className="w-4 h-4" />
                <span>Continue as Accountant</span>
              </button>

              <div className="p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Whitelisted Accountant:</span>
                </div>
                <code className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                  mwkomu@gmail.com
                </code>
              </div>

              {unauthorizedDomain && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                  Domain <code className="font-mono font-bold">{unauthorizedDomain}</code> needs authorization in Firebase Console.
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: STAFF */}
          {selectedBox === 'staff' && (
            <div className="space-y-3">
              <div className="relative">
                <select
                  id="auth-modal-staff-select"
                  value={selectedStaffId}
                  onChange={(e) => {
                    playClickSound();
                    const newId = e.target.value;
                    setSelectedStaffId(newId);
                    setPin('');
                    setErrorMessage(null);
                  }}
                  className={`w-full bg-white border-2 rounded-xl p-2.5 text-xs font-bold shadow-xs transition-all appearance-none cursor-pointer pr-9 ${
                    selectedStaffId
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900 bg-indigo-50/20'
                      : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <option value="">Select Staff...</option>
                  {activeStaffOperators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {selectedStaffId && currentStaff && (
                <div className="space-y-3 pt-1 animate-fadeIn">

                  {/* Register Selector */}
                  <div className="relative">
                    <select
                      id="auth-modal-register-select"
                      value={selectedStaffLocation}
                      onChange={e => setSelectedStaffLocation(e.target.value as LocationId)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      {staffLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                      <option value="main_store">Main Store</option>
                    </select>
                  </div>

                  {/* PIN dots */}
                  <div 
                    onClick={() => inputRef.current?.focus()} 
                    className="text-center cursor-pointer group py-1"
                  >
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
                      aria-label={`Staff PIN Passcode for ${currentStaff.name}`}
                      autoFocus
                    />

                    {/* PIN Dots */}
                    <div className="flex items-center justify-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map(index => {
                        const hasDigit = pin.length > index;
                        return (
                          <div
                            key={index}
                            className={`w-8 h-10 sm:w-9 sm:h-11 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black transition-all ${
                              hasDigit
                                ? 'border-indigo-600 bg-indigo-600 text-white scale-105 shadow-md'
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
                  <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                      <button
                        key={digit}
                        onClick={() => handleDigit(digit)}
                        className="h-9 sm:h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base font-black rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                      >
                        {digit}
                      </button>
                    ))}

                    <button
                      onClick={handleClear}
                      className="h-9 sm:h-10 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      Clear
                    </button>

                    <button
                      onClick={() => handleDigit('0')}
                      className="h-9 sm:h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base font-black rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      0
                    </button>

                    <button
                      onClick={handleBackspace}
                      className="h-9 sm:h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => attemptUnlock()}
                    disabled={pin.length !== 6 || !currentStaff}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Unlock</span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
