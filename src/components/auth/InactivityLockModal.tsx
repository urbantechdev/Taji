import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useERP } from '../../context/ERPContext';
import { playAlertSound, playClickSound, playSuccessSound } from '../../utils/audio';
import { Lock, Clock, ShieldAlert, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InactivityLockModal: React.FC = () => {
  const { isPlatformUnlocked, lockPlatform, currentUser, brandSettings } = useERP();

  // Dynamic configuration based on brand settings or default 2 minutes (120s)
  const timeoutMinutes = Math.max(1, brandSettings?.autoLockMinutes || 2);
  const totalInactivitySeconds = timeoutMinutes * 60;
  // Warning countdown triggers 30s before lock (or 20s if total timeout is 1 min)
  const countdownWarningSeconds = Math.min(30, Math.max(15, Math.floor(totalInactivitySeconds / 2)));
  const triggerAtInactivitySeconds = totalInactivitySeconds - countdownWarningSeconds;

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(countdownWarningSeconds);

  // Stable references to prevent unneeded re-subscriptions
  const isWarningVisibleRef = useRef<boolean>(false);
  isWarningVisibleRef.current = isWarningVisible;

  const lastActivityRef = useRef<number>(Date.now());
  const lastAlertSecondPlayedRef = useRef<number | null>(null);
  const lastMouseMoveRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const lockPlatformRef = useRef(lockPlatform);
  lockPlatformRef.current = lockPlatform;

  const totalInactivitySecondsRef = useRef(totalInactivitySeconds);
  totalInactivitySecondsRef.current = totalInactivitySeconds;

  const triggerAtInactivitySecondsRef = useRef(triggerAtInactivitySeconds);
  triggerAtInactivitySecondsRef.current = triggerAtInactivitySeconds;

  const countdownWarningSecondsRef = useRef(countdownWarningSeconds);
  countdownWarningSecondsRef.current = countdownWarningSeconds;

  // Handle explicit "Continue" action
  const handleContinueSession = useCallback(() => {
    playClickSound();
    lastActivityRef.current = Date.now();
    lastAlertSecondPlayedRef.current = null;
    isWarningVisibleRef.current = false;
    setIsWarningVisible(false);
    setSecondsRemaining(countdownWarningSecondsRef.current);
    try {
      sessionStorage.setItem('taji_last_active', String(Date.now()));
    } catch {}
  }, []);

  // Handle explicit "Log Off Now" action
  const handleLogOffNow = useCallback(() => {
    playClickSound();
    isWarningVisibleRef.current = false;
    setIsWarningVisible(false);
    lockPlatformRef.current();
  }, []);

  // Setup global event listeners to detect user activity
  useEffect(() => {
    if (!isPlatformUnlocked) {
      setIsWarningVisible(false);
      isWarningVisibleRef.current = false;
      lastAlertSecondPlayedRef.current = null;
      return;
    }

    // Initialize activity anchor on mount or when unlocked
    lastActivityRef.current = Date.now();
    isWarningVisibleRef.current = false;
    lastAlertSecondPlayedRef.current = null;
    try {
      sessionStorage.setItem('taji_last_active', String(Date.now()));
    } catch {}

    // Intentional user actions that strictly reset the idle timer (when prompt is NOT visible)
    const onDirectInteraction = () => {
      // STRICT RULE: If countdown prompt is visible, background events MUST NOT cancel it!
      // The user MUST act on the prompt directly (click "Continue" or press Enter/Space).
      if (isWarningVisibleRef.current) return;
      lastActivityRef.current = Date.now();
    };

    // Filter mousemove to prevent micro-vibrations or optical sensor drift from preventing auto-lock
    const onMouseMove = (e: MouseEvent) => {
      if (isWarningVisibleRef.current) return;
      const now = Date.now();
      const prev = lastMouseMoveRef.current;
      // Only count mouse movements with deliberate distance (> 15 pixels) or spaced by at least 250ms
      const distance = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
      if (distance > 15 || now - prev.time > 3000) {
        lastMouseMoveRef.current = { x: e.clientX, y: e.clientY, time: now };
        lastActivityRef.current = now;
      }
    };

    // Listen for visibility change (e.g. user returns to tab after leaving for 10 minutes)
    const onVisibilityOrFocus = () => {
      if (!isPlatformUnlocked) return;
      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      
      // Strict: If elapsed time exceeded total timeout while tab was hidden, lock immediately!
      if (elapsed >= totalInactivitySecondsRef.current) {
        setIsWarningVisible(false);
        isWarningVisibleRef.current = false;
        lockPlatformRef.current();
      }
    };

    // Listen for custom test trigger from settings module
    const onTestTrigger = () => {
      lastActivityRef.current = Date.now() - (triggerAtInactivitySecondsRef.current * 1000);
      setSecondsRemaining(countdownWarningSecondsRef.current);
      setIsWarningVisible(true);
      isWarningVisibleRef.current = true;
      try {
        playAlertSound();
      } catch {}
    };

    const directEvents = ['mousedown', 'keydown', 'touchstart', 'pointerdown', 'wheel'];
    directEvents.forEach(evt => window.addEventListener(evt, onDirectInteraction, { passive: true }));
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('taji:test-inactivity-lock', onTestTrigger);

    return () => {
      directEvents.forEach(evt => window.removeEventListener(evt, onDirectInteraction));
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('taji:test-inactivity-lock', onTestTrigger);
    };
  }, [isPlatformUnlocked]);

  // Keyboard shortcut listener while modal is visible
  useEffect(() => {
    if (!isWarningVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleContinueSession();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleLogOffNow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWarningVisible, handleContinueSession, handleLogOffNow]);

  // High-precision ticker loop running every 500ms while platform is unlocked
  useEffect(() => {
    if (!isPlatformUnlocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const totalLimit = totalInactivitySecondsRef.current;
      const triggerThreshold = triggerAtInactivitySecondsRef.current;

      // STRICT CONDITION 1: Total inactivity elapsed -> LOCK IMMEDIATELY
      if (elapsedSeconds >= totalLimit) {
        setIsWarningVisible(false);
        isWarningVisibleRef.current = false;
        lastAlertSecondPlayedRef.current = null;
        lockPlatformRef.current();
        return;
      }

      // STRICT CONDITION 2: Inactivity reached warning threshold -> COUNTDOWN ACTIVE
      if (elapsedSeconds >= triggerThreshold) {
        const remaining = Math.max(0, totalLimit - elapsedSeconds);
        setSecondsRemaining(remaining);

        // If countdown hit 0 -> Lock immediately!
        if (remaining <= 0) {
          setIsWarningVisible(false);
          isWarningVisibleRef.current = false;
          lastAlertSecondPlayedRef.current = null;
          lockPlatformRef.current();
          return;
        }

        if (!isWarningVisibleRef.current) {
          isWarningVisibleRef.current = true;
          setIsWarningVisible(true);
          try {
            playAlertSound();
          } catch {}
        }

        // Play audible countdown chime when 10s, 5s, 4s, 3s, 2s, 1s remain
        if (remaining <= 10 && lastAlertSecondPlayedRef.current !== remaining) {
          lastAlertSecondPlayedRef.current = remaining;
          try {
            playAlertSound();
          } catch {}
        }
      } else {
        // Active usage occurred BEFORE the warning was triggered
        if (isWarningVisibleRef.current) {
          setIsWarningVisible(false);
          isWarningVisibleRef.current = false;
          lastAlertSecondPlayedRef.current = null;
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlatformUnlocked]);

  if (!isPlatformUnlocked || !isWarningVisible) {
    return null;
  }

  // Progress percentage for circular ring or bar (from 100% down to 0%)
  const progressPercent = Math.max(0, Math.min(100, Math.round((secondsRemaining / countdownWarningSeconds) * 100)));
  const isUrgent = secondsRemaining <= 10;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-warning-title"
        id="modal-inactivity-lock"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.90, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.90, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`bg-white rounded-3xl shadow-2xl border ${
            isUrgent ? 'border-rose-500/80 ring-4 ring-rose-500/20' : 'border-slate-200'
          } max-w-md w-full overflow-hidden text-center p-6 sm:p-8 space-y-5 sm:space-y-6 relative transition-all duration-300`}
        >
          {/* Top urgency accent bar */}
          <div 
            className={`absolute top-0 left-0 right-0 h-2 ${
              isUrgent 
                ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse' 
                : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500'
            }`} 
          />

          {/* Security Badge & Icon */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative mb-3">
              <div 
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-300 ${
                  isUrgent 
                    ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-bounce' 
                    : 'bg-amber-50 border border-amber-200 text-amber-600'
                }`}
              >
                {isUrgent ? (
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                ) : (
                  <Clock className="w-8 h-8 animate-pulse text-amber-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <span 
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isUrgent 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Strict Auto Log-Off Triggered
            </span>
          </div>

          {/* Main Title & Countdown Display */}
          <div className="space-y-3">
            <h2 id="inactivity-warning-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Are you still working?
            </h2>

            {/* Countdown Badge */}
            <div className="py-1.5 flex flex-col items-center justify-center">
              <div 
                className={`inline-flex items-baseline gap-1.5 px-6 py-3 rounded-2xl text-white shadow-lg border transition-all duration-300 ${
                  isUrgent 
                    ? 'bg-rose-950 border-rose-600 ring-4 ring-rose-500/40 animate-pulse' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                  isUrgent ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
                <span className="text-sm sm:text-base font-extrabold uppercase text-slate-300 tracking-wide">
                  sec
                </span>
              </div>
              
              {/* Visual Progress Bar */}
              <div className="w-56 sm:w-64 bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-500 ease-linear rounded-full ${
                    isUrgent ? 'bg-rose-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Terminal has been idle for {timeoutMinutes} min. Unless you confirm you are active, the system will log off automatically to safeguard registers and data.
            </p>

            {currentUser && (
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Session: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Tap Continue or Log Off Now */}
          <div className="flex flex-col gap-2.5 pt-2">
            {/* Primary Option: Tap Continue */}
            <button
              type="button"
              id="btn-inactivity-continue"
              onClick={handleContinueSession}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-98 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer ring-4 ring-emerald-400/30"
              autoFocus
            >
              <ShieldCheck className="w-5 h-5 text-emerald-100 shrink-0" />
              <span>I'm Still Working — Keep Active</span>
            </button>

            {/* Secondary Option: Log Off Now */}
            <button
              type="button"
              id="btn-inactivity-logoff"
              onClick={handleLogOffNow}
              className="w-full bg-slate-100 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
              <span>Log Off Terminal Now</span>
            </button>
          </div>

          {/* Helper keyboard hint */}
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">Enter</kbd> to stay signed in or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">Esc</kbd> to lock</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
