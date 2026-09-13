import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import tajiLogo from '../../assets/images/taji_logo_1786034537873.jpg';
import { playClickSound, playSuccessSound, playErrorSound } from '../../utils/audio';
import {
  ShieldAlert,
  Landmark,
  Users,
  KeyRound,
  Delete,
  CheckCircle2,
  AlertCircle,
  Globe,
  Loader2,
  ShieldCheck,
  ChevronDown,
  Mail,
  Lock
} from 'lucide-react';
import { LocationId, UserRole } from '../../types';
import { SocialProvider } from '../../lib/firebaseAuthService';

export const PlatformLockScreen: React.FC = () => {
  const {
    unlockPOSWithPin,
    brandSettings,
    locations,
    setViewMode,
    signInWithGoogleAdmin,
    signInWithSocial,
    signInWithEmailPassword,
    posOperators
  } = useERP();

  // Active top-level auth tab: 'social' | 'accountant' | 'pin'
  const [authMode, setAuthMode] = useState<'social' | 'accountant' | 'pin'>('social');

  // Social login states
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  // Email / Password Login States for Real Environment
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmittingAdminEmail, setIsSubmittingAdminEmail] = useState(false);
  const [showAdminEmailForm, setShowAdminEmailForm] = useState(false);

  const [accountantEmail, setAccountantEmail] = useState('');
  const [accountantPassword, setAccountantPassword] = useState('');
  const [isSubmittingAccountantEmail, setIsSubmittingAccountantEmail] = useState(false);
  const [showAccountantEmailForm, setShowAccountantEmailForm] = useState(false);

  // PIN keypad state
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeStaffOperators = posOperators.filter(
    op => op.role !== 'admin' && op.role !== 'accountant' && op.status === 'active'
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const currentStaff = activeStaffOperators.find(op => op.id === selectedStaffId);
  const staffLocations = locations.filter(loc => loc.id !== 'main_store');
  const [selectedStaffLocation, setSelectedStaffLocation] = useState<LocationId>('sales_shop');

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  const displayLogo = brandSettings?.logoUrl || tajiLogo;

  // Sync staff location
  useEffect(() => {
    if (currentStaff?.location) {
      setSelectedStaffLocation(currentStaff.location);
    }
  }, [selectedStaffId, currentStaff]);

  // Focus input when switching to pin mode
  useEffect(() => {
    if (authMode === 'pin' && selectedStaffId) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [authMode, selectedStaffId]);

  // Physical keyboard listener for PIN mode
  useEffect(() => {
    if (authMode !== 'pin' || !selectedStaffId || !currentStaff) return;

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
          attemptUnlockPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, authMode, selectedStaffId, currentStaff, selectedStaffLocation]);

  const handleDigit = (digit: string) => {
    playClickSound();
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);
      if (nextPin.length === 6) {
        attemptUnlockPin(nextPin);
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

  const attemptUnlockPin = (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 6) {
      setErrorMessage(`Please enter all 6 numeric digits of the Staff PIN.`);
      playErrorSound();
      return;
    }

    if (!currentStaff) {
      setErrorMessage('Please select a staff member first.');
      playErrorSound();
      return;
    }

    const adminOrAccountantOp = posOperators.find(
      op => Boolean(op.pin && op.pin.length === 6 && op.pin === pinToSubmit && (op.role === 'admin' || op.role === 'accountant'))
    );
    if (adminOrAccountantOp) {
      playErrorSound();
      setErrorMessage(`"${adminOrAccountantOp.name}" is an ${adminOrAccountantOp.role === 'admin' ? 'Administrator' : 'Accountant'}. Please log in using Social Login or Email.`);
      setPin('');
      return;
    }

    const result = unlockPOSWithPin(pinToSubmit, selectedStaffLocation, currentStaff.id);
    if (result.success) {
      playSuccessSound();
      setSuccessMessage(`Welcome ${currentStaff.name}! Terminal unlocked.`);
      setErrorMessage(null);
    } else {
      playErrorSound();
      setErrorMessage(result.message || `Incorrect 6-digit PIN for ${currentStaff.name}.`);
      setPin('');
    }
  };

  // Google Sign In handler
  const handleSocialLogin = async (provider: SocialProvider = 'google', targetRole?: UserRole) => {
    playClickSound();
    setLoadingProvider(provider);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnauthorizedDomain(null);

    try {
      const res = await signInWithSocial('google', targetRole);
      if (res.success) {
        playSuccessSound();
        setSuccessMessage(res.message || `Signed in successfully${targetRole ? ` as ${targetRole}` : ''} via Google!`);
      } else {
        playErrorSound();
        if (res.isUnauthorizedDomain) {
          setUnauthorizedDomain(res.domain || window.location.hostname);
          setErrorMessage(`Domain "${res.domain || window.location.hostname}" is not authorized in Firebase Console.`);
        } else {
          setErrorMessage(res.message || 'Failed to sign in with Google.');
        }
      }
    } catch (err: any) {
      playErrorSound();
      setErrorMessage(err?.message || 'Google sign-in failed.');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Real Email & Password handlers for Administrator and Accountant
  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }
    setIsSubmittingAdminEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await signInWithEmailPassword(adminEmail.trim(), adminPassword);
      if (res.success) {
        playSuccessSound();
        setSuccessMessage('Welcome Administrator! Terminal unlocked.');
      } else {
        playErrorSound();
        setErrorMessage(res.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      playErrorSound();
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsSubmittingAdminEmail(false);
    }
  };

  const handleAccountantEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountantEmail.trim() || !accountantPassword) {
      setErrorMessage('Please enter both accountant email and password.');
      return;
    }
    setIsSubmittingAccountantEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await signInWithEmailPassword(accountantEmail.trim(), accountantPassword);
      if (res.success) {
        playSuccessSound();
        setSuccessMessage('Welcome Chief Accountant! Financial portal unlocked.');
      } else {
        playErrorSound();
        setErrorMessage(res.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      playErrorSound();
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsSubmittingAccountantEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col items-center justify-between sm:justify-center p-3 sm:p-6 overflow-y-auto min-h-[100dvh] antialiased select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-transparent pointer-events-none rounded-full blur-2xl" />

      <div className="w-full max-w-xl relative z-10 space-y-3 sm:space-y-4 my-auto flex flex-col justify-center">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="relative inline-flex items-center justify-center mb-1 sm:mb-2 group">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-rose-500/30 via-pink-500/25 to-rose-600/30 blur-xl animate-pulse pointer-events-none" />
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 sm:p-1.5 overflow-hidden flex items-center justify-center shadow-2xl shadow-rose-900/20 ring-4 ring-rose-100/70">
              <div
                className="absolute inset-[-100%] animate-spin pointer-events-none"
                style={{
                  animationDuration: '4s',
                  background: 'conic-gradient(from 0deg, #e11d48, #f43f5e, #fb7185, #fda4af, #f43f5e, #e11d48)'
                }}
              />
              <div className="relative w-full h-full rounded-full bg-white p-1 sm:p-1.5 flex items-center justify-center overflow-hidden z-10 shadow-inner">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt={brandSettings.brandName || 'Brand Logo'}
                    className="w-full h-full rounded-full object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-700 flex items-center justify-center text-white font-black text-4xl sm:text-5xl shadow-inner">
                    {(brandSettings.brandName || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {brandSettings.brandName || 'TAJI Enterprise ERP'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Device Textile ERP, Cloud POS & Billing System
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden">
          {/* Top Auth Navigation Tabs */}
          <div className="p-2 sm:p-2.5 bg-slate-100/90 border-b border-slate-200">
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {/* Google Sign In Tab */}
              <button
                type="button"
                id="auth-tab-google"
                onClick={() => {
                  playClickSound();
                  setAuthMode('social');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'social'
                    ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                <span className="truncate">Google Sign In</span>
              </button>

              {/* Accountant Tab */}
              <button
                type="button"
                id="auth-tab-accountant"
                onClick={() => {
                  playClickSound();
                  setAuthMode('accountant');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'accountant'
                    ? 'bg-white text-emerald-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Accountant</span>
              </button>

              {/* Staff PIN Tab */}
              <button
                type="button"
                id="auth-tab-pin"
                onClick={() => {
                  playClickSound();
                  setAuthMode('pin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'pin'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Cashier PIN</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Body Container */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* 1. GOOGLE SIGN IN TAB (Administrator) */}
            {authMode === 'social' && (
              <div className="space-y-3.5">
                <div className="text-center pb-1">
                  <h2 className="text-sm font-bold text-slate-800">Administrator Single Sign-On</h2>
                  <p className="text-xs text-slate-500">
                    Sign in with your Google enterprise administrator account.
                  </p>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  id="btn-social-google"
                  onClick={() => handleSocialLogin('google', 'admin')}
                  disabled={loadingProvider !== null}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-bold text-sm py-3.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                >
                  {loadingProvider === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
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
                  <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">
                      Or Sign in with Email & Password
                    </span>
                  </div>
                </div>

                {/* Administrator Email & Password Form */}
                <form onSubmit={handleAdminEmailLogin} className="space-y-2.5">
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-700">Administrator Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        id="input-admin-email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@enterprise.com"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        id="input-admin-password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-admin-email-login"
                    disabled={isSubmittingAdminEmail}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingAdminEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{isSubmittingAdminEmail ? 'Verifying Credentials...' : 'Sign in as Administrator'}</span>
                  </button>
                </form>

                {unauthorizedDomain && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs">
                    <p className="text-amber-800 text-[11px]">
                      Tip: Add domain <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{unauthorizedDomain}</code> in Firebase Authentication authorized domains list.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. ACCOUNTANT PORTAL TAB */}
            {authMode === 'accountant' && (
              <div className="space-y-3.5">
                <div className="text-center pb-1">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-1.5 shadow-inner">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Chief Accountant Portal</h2>
                  <p className="text-xs text-slate-500">
                    Financial ledger management, eTIMS compliance, audit logs & treasury controls.
                  </p>
                </div>

                {/* Continue with Google as Accountant */}
                <button
                  type="button"
                  id="btn-accountant-google"
                  onClick={() => handleSocialLogin('google', 'accountant')}
                  disabled={loadingProvider !== null}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                >
                  {loadingProvider === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
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
                  <span>{loadingProvider === 'google' ? 'Authenticating...' : 'Sign in with Google (Accountant)'}</span>
                </button>

                <div className="relative py-1.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">
                      Or Sign in with Email & Password
                    </span>
                  </div>
                </div>

                {/* Accountant Email & Password Form */}
                <form onSubmit={handleAccountantEmailLogin} className="space-y-2.5">
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-700">Accountant Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        id="input-accountant-email"
                        value={accountantEmail}
                        onChange={(e) => setAccountantEmail(e.target.value)}
                        placeholder="mwkomu@gmail.com"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        id="input-accountant-password"
                        value={accountantPassword}
                        onChange={(e) => setAccountantPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-accountant-email-login"
                    disabled={isSubmittingAccountantEmail}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingAccountantEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                    <span>{isSubmittingAccountantEmail ? 'Verifying Accountant...' : 'Sign in as Accountant'}</span>
                  </button>
                </form>

                {unauthorizedDomain && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs">
                    <p className="text-amber-800 text-[11px]">
                      Tip: Add domain <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{unauthorizedDomain}</code> in Firebase Authentication authorized domains list.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. CASHIER PIN KEYPAD TAB */}
            {authMode === 'pin' && (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    id="platform-staff-select"
                    value={selectedStaffId}
                    onChange={e => {
                      playClickSound();
                      const newId = e.target.value;
                      setSelectedStaffId(newId);
                      setPin('');
                      setErrorMessage(null);
                    }}
                    className={`w-full bg-white border-2 rounded-xl p-3 text-sm font-bold shadow-xs transition-all appearance-none cursor-pointer pr-10 ${
                      selectedStaffId
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900 bg-indigo-50/20'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <option value="">Select Staff Member...</option>
                    {activeStaffOperators.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.role})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {selectedStaffId && currentStaff && (
                  <div className="space-y-3 pt-1">
                    <div className="relative">
                      <select
                        id="platform-register-select"
                        value={selectedStaffLocation}
                        onChange={e => setSelectedStaffLocation(e.target.value as LocationId)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        {staffLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                        <option value="main_store">Main Store</option>
                      </select>
                    </div>

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
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPin(val);
                          setErrorMessage(null);
                          if (val.length === 6) {
                            attemptUnlockPin(val);
                          }
                        }}
                        className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
                        aria-label={`Staff PIN Passcode for ${currentStaff.name}`}
                        autoFocus
                      />

                      <div className="flex items-center justify-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map(index => {
                          const hasDigit = pin.length > index;
                          return (
                            <div
                              key={index}
                              className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black transition-all ${
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

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                        <button
                          key={digit}
                          onClick={() => handleDigit(digit)}
                          className="h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base sm:text-lg font-black rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                        >
                          {digit}
                        </button>
                      ))}

                      <button
                        onClick={handleClear}
                        className="h-10 sm:h-11 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                      >
                        Clear
                      </button>

                      <button
                        onClick={() => handleDigit('0')}
                        className="h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-base sm:text-lg font-black rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                      >
                        0
                      </button>

                      <button
                        onClick={handleBackspace}
                        className="h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                        title="Backspace"
                      >
                        <Delete className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                      </button>
                    </div>

                    <button
                      onClick={() => attemptUnlockPin()}
                      disabled={pin.length !== 6 || !currentStaff}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Unlock Cashier Session</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: Public Storefront Link */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center">
            <button
              onClick={() => {
                playClickSound();
                setViewMode('storefront');
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Visit Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
