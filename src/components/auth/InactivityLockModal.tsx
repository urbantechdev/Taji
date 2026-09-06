import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useERP } from '../../context/ERPContext';
import { playAlertSound, playClickSound, playSuccessSound } from '../../utils/audio';
import { Lock, Clock, ShieldAlert, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Total inactivity before lock: 2 minutes = 120 seconds
const TOTAL_INACTIVITY_SECONDS = 120;
// Countdown popup triggers 30 seconds before locking (at 90 seconds of inactivity)
const COUNTDOWN_WARNING_SECONDS = 30;
const TRIGGER_AT_INACTIVITY_SECONDS = TOTAL_INACTIVITY_SECONDS - COUNTDOWN_WARNING_SECONDS; // 90s

export const InactivityLockModal: React.FC = () => {
  const { isPlatformUnlocked, lockPlatform, currentUser } = useERP();

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_WARNING_SECONDS);
  
  // Track last active timestamp in milliseconds
  const lastActivityRef = useRef<number>(Date.now());
  const hasAlertSoundPlayedRef = useRef<boolean>(false);
  const lockPlatformRef = useRef(lockPlatform);
  lockPlatformRef.current = lockPlatform;

  // Reset activity function (for continuous user interaction during normal use)
  const recordActivity = useCallback(() => {
    // Only update if warning modal is not currently open
    // (If the modal is open, user must explicitly click "Continue" or "Log Off Now")
    if (!isWarningVisible) {
      lastActivityRef.current = Date.now();
    }
  }, [isWarningVisible]);

  // Handle explicit "Continue" action
  const handleContinueSession = useCallback(() => {
    playClickSound();
    lastActivityRef.current = Date.now();
    hasAlertSoundPlayedRef.current = false;
    setIsWarningVisible(false);
    setSecondsRemaining(COUNTDOWN_WARNING_SECONDS);
  }, []);

  // Handle explicit "Log Off Now" action
  const handleLogOffNow = useCallback(() => {
    playClickSound();
    setIsWarningVisible(false);
    lockPlatformRef.current();
  }, []);

  // Setup global event listeners to detect user activity
  useEffect(() => {
    if (!isPlatformUnlocked) {
      setIsWarningVisible(false);
      hasAlertSoundPlayedRef.current = false;
      return;
    }

    // Initialize activity anchor on mount or unlock
    lastActivityRef.current = Date.now();
    hasAlertSoundPlayedRef.current = false;

    // Events to monitor for activity (throttled naturally by recording timestamp)
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'pointerdown',
      'scroll',
      'click'
    ];

    const onActivity = () => {
      recordActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, onActivity);
      });
    };
  }, [isPlatformUnlocked, recordActivity]);

  // Keyboard shortcut listener while modal is visible
  useEffect(() => {
    if (!isWarningVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleContinueSession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWarningVisible, handleContinueSession]);

  // Main ticker loop running once per second while platform is unlocked
  useEffect(() => {
    if (!isPlatformUnlocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);

      // Check if 2 minutes (120s) has elapsed -> LOCK IMMEDIATELY
      if (elapsedSeconds >= TOTAL_INACTIVITY_SECONDS) {
        setIsWarningVisible(false);
        hasAlertSoundPlayedRef.current = false;
        lockPlatformRef.current();
        return;
      }

      // Check if inactivity reached the warning threshold (90s)
      if (elapsedSeconds >= TRIGGER_AT_INACTIVITY_SECONDS) {
        const remaining = Math.max(0, TOTAL_INACTIVITY_SECONDS - elapsedSeconds);
        setSecondsRemaining(remaining);
        setIsWarningVisible(true);

        // Play alert chime on first trigger
        if (!hasAlertSoundPlayedRef.current) {
          hasAlertSoundPlayedRef.current = true;
          try {
            playAlertSound();
          } catch (e) {
            // Silently swallow audio errors if blocked by browser policy
          }
        }

        // Secondary alert chime at 5 seconds remaining
        if (remaining === 5) {
          try {
            playAlertSound();
          } catch (e) {}
        }
      } else {
        // Active usage detected, close warning if previously shown
        if (isWarningVisible) {
          setIsWarningVisible(false);
          hasAlertSoundPlayedRef.current = false;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlatformUnlocked, isWarningVisible]);

  if (!isPlatformUnlocked || !isWarningVisible) {
    return null;
  }

  // Progress percentage for circular ring or bar (from 100% down to 0%)
  const progressPercent = Math.round((secondsRemaining / COUNTDOWN_WARNING_SECONDS) * 100);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-warning-title"
        id="modal-inactivity-lock"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden text-center p-6 sm:p-8 space-y-6 relative"
        >
          {/* Top subtle emergency accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

          {/* Security Badge & Icon */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Inactivity Auto-Lock
            </span>
          </div>

          {/* Main Title & Countdown Display */}
          <div className="space-y-3">
            <h2 id="inactivity-warning-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Are you still working?
            </h2>

            {/* Countdown Badge */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="inline-flex items-baseline gap-1 px-5 py-2.5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-rose-400">
                  {secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
                <span className="text-sm font-bold text-slate-300">sec</span>
              </div>
              
              {/* Visual Progress Bar */}
              <div className="w-48 bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                    secondsRemaining <= 10 ? 'bg-rose-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              No activity detected for 90 seconds. To safeguard confidential accounts and inventory data, this terminal will automatically lock.
            </p>

            {currentUser && (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 inline-block">
                Active User: <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.role})
              </div>
            )}
          </div>

          {/* Action Buttons: Tap Continue or Log Off Now */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Primary Option: Tap Continue */}
            <button
              type="button"
              id="btn-inactivity-continue"
              onClick={handleContinueSession}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer ring-2 ring-emerald-400/30"
              autoFocus
            >
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
              <span>Tap to Continue</span>
            </button>

            {/* Secondary Option: Log Off Now */}
            <button
              type="button"
              id="btn-inactivity-logoff"
              onClick={handleLogOffNow}
              className="sm:w-auto bg-slate-100 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold py-3 px-4 rounded-2xl border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
              <span>Log Off Now</span>
            </button>
          </div>

          {/* Helper hint */}
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">Space</kbd> to continue</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
