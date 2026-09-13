import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const EmailVerificationBanner: React.FC = () => {
  const {
    adminUser,
    isEmailVerified,
    sendUserEmailVerification,
    checkEmailVerification,
    verifyEmailManual
  } = useERP();

  const [isDismissed, setIsDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If no user email or already verified, don't show
  if (!adminUser?.email || isEmailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setFeedback(null);
    try {
      const res = await sendUserEmailVerification();
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Verification link resent!' });
        setResendCooldown(30);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to resend.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Error sending email.' });
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const res = await checkEmailVerification();
      if (res.isVerified) {
        setFeedback({ type: 'success', text: 'Email verified successfully!' });
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Email is not verified yet. Please click the link in your inbox.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Verification check failed.' });
    } finally {
      setChecking(false);
    }
  };

  const handleQuickVerify = () => {
    verifyEmailManual();
    setFeedback({ type: 'success', text: 'Email verified (Preview Mode)!' });
  };

  return (
    <div
      id="firebase-email-verification-banner"
      className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white shadow-md relative z-40 px-3 py-2 sm:py-2.5 transition-all animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-3 text-xs">
        {/* Information Left Column */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold tracking-wide uppercase text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                Action Required
              </span>
              <span className="font-bold">
                Please verify your email: <strong className="font-mono underline">{adminUser.email}</strong>
              </span>
            </div>
            <p className="text-[11px] text-amber-100 hidden sm:block">
              Verify your email to unlock multi-branch accounting ledgers and secure automated ETR &amp; VAT filings.
            </p>
          </div>
        </div>

        {/* Actions Right Column */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full md:w-auto justify-end">
          {feedback && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                feedback.type === 'success' ? 'bg-emerald-800/80 text-emerald-100' : 'bg-rose-900/80 text-rose-100'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {feedback.text}
            </span>
          )}

          {/* Resend button */}
          <button
            id="resend-verification-email-btn"
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="px-2.5 py-1 bg-white text-amber-900 font-bold rounded-lg text-[11px] hover:bg-amber-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 shadow-xs"
          >
            <Send className="w-3 h-3 text-amber-700" />
            <span>{resending ? 'Sending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Link'}</span>
          </button>

          {/* Check Status button */}
          <button
            id="check-verification-status-btn"
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-900/60 text-white font-bold rounded-lg text-[11px] border border-white/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Check Status'}</span>
          </button>

          {/* Instant Verify (Preview Mode test helper) */}
          <button
            id="simulate-verification-btn"
            type="button"
            onClick={handleQuickVerify}
            title="Mark as verified for instant testing in preview environment"
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] active:scale-95 transition-all cursor-pointer flex items-center gap-1 border border-emerald-400/50 shadow-xs"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-200" />
            <span>Mark Verified</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-all cursor-pointer ml-1"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
