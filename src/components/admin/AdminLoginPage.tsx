import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { NasisiLogo } from '../NasisiLogo';

interface AdminLoginPageProps {
  onBackToStorefront: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onBackToStorefront,
}) => {
  const { login, loginWithGoogle, registerWithEmail } = useERP();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [customerNotice, setCustomerNotice] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailOrId.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage(null);
    setCustomerNotice(null);
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        const res = await registerWithEmail(cleanEmail, password, fullName);
        if (res.success) {
          if (res.role === 'customer') {
            setCustomerNotice('Account registered successfully! Access granted for customer quotations and checkout. Redirecting...');
            setTimeout(() => {
              onBackToStorefront();
            }, 1400);
          } else {
            setSuccessNotice(true);
          }
        } else {
          setErrorMessage(res.error || 'Could not complete account registration. Please try again.');
          setIsLoading(false);
        }
      } else {
        const res = await login(cleanEmail, password);
        if (res.success) {
          if (res.role === 'customer') {
            setCustomerNotice('Welcome! Signed in as Storefront Customer. Redirecting to catalog & express checkout...');
            setTimeout(() => {
              onBackToStorefront();
            }, 1400);
          } else {
            setSuccessNotice(true);
          }
        } else {
          setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
          setIsLoading(false);
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setCustomerNotice(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        if (res.role === 'customer') {
          setCustomerNotice('Signed in with Google as Storefront Customer. Redirecting to catalog & express checkout...');
          setTimeout(() => {
            onBackToStorefront();
          }, 1400);
        } else {
          setSuccessNotice(true);
        }
      } else {
        setErrorMessage(res.error || 'Google login could not be completed.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      setErrorMessage(err?.message || 'Google Authentication was cancelled or blocked by browser.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] relative select-none">
      {/* Top Bar with Return to Storefront */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onBackToStorefront}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-[#06163c] border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Back to Storefront & Catalog</span>
        </motion.button>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 relative overflow-hidden"
        >
          {/* Subtle Top Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#06163c]" />

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs mb-3">
              <NasisiLogo size="xl" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Outfit']">
              Nasisi Enterprise Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
              Sign in to access your Nasisi account, Enterprise ERP, or customer orders.
            </p>
          </div>

          {/* Google SSO Button (Primary 1-Click Option) */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 mb-3"
          >
            {isGoogleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Continue with Google Account</span>
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              or continue with email
            </span>
          </div>

          {/* Success or Error Notice */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </motion.div>
            )}

            {customerNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5 font-medium"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span>{customerNotice}</span>
              </motion.div>
            )}

            {successNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Administrator verified! Launching Enterprise ERP Suite...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <AnimatePresence initial={false}>
              {authMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Organization
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Veronica Njeri / Optimum Engineering"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#06163c]/20 focus:border-[#06163c] focus:bg-white transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#06163c]/20 focus:border-[#06163c] focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#06163c]/20 focus:border-[#06163c] focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Security badge */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#06163c] focus:ring-[#06163c]/30"
                />
                <span className="text-slate-600 font-medium">Keep me signed in</span>
              </label>

              <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit TLS Encrypted</span>
              </span>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 bg-[#06163c] hover:bg-[#0a235c] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : authMode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4 text-cyan-300" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-cyan-300" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>

            {/* Collapsed Option to Toggle Sign In / Create Account in a Simplified Way */}
            <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100 mt-3">
              {authMode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[#06163c] hover:text-blue-600 transition-colors cursor-pointer underline underline-offset-2 ml-1"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[#06163c] hover:text-blue-600 transition-colors cursor-pointer underline underline-offset-2 ml-1"
                  >
                    Sign in instead
                  </button>
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </main>
      <div />
    </div>
  );
};
