import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Lock, Delete, Sparkles, KeyRound, ShieldCheck, CheckCircle, AlertCircle, Store, Keyboard } from 'lucide-react';
import { LocationId } from '../../types';

export const POSPinModal: React.FC = () => {
  const { unlockPOSWithPin, posOperators, activeLocation, setActiveLocation, brandSettings } = useERP();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
  }, [pin]);

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
    } else {
      setErrorMessage(result.message);
      setPin('');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-3 sm:p-6 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl sm:shadow-2xl p-4 sm:p-8 space-y-3.5 sm:space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          {brandSettings.logoUrl ? (
            <img
              src={brandSettings.logoUrl}
              alt={brandSettings.brandName}
              className="w-16 h-16 sm:w-28 sm:h-28 object-contain rounded-full mx-auto mb-1 mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 text-rose-400 border border-slate-800 flex items-center justify-center mx-auto shadow-lg">
              <KeyRound className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-extrabold">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
            <span>6-Digit POS Terminal Lock</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Enter Cashier PIN</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Enter your 6-digit POS PIN to unlock the checkout terminal
          </p>
        </div>

        {/* Location selector for terminal register */}
        <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-rose-600" />
              Register Store Location:
            </span>
          </div>
          <select
            value={activeLocation}
            onChange={(e) => setActiveLocation(e.target.value as LocationId)}
            className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="main_store">Main Store & Central Hub</option>
            <option value="sales_shop">Sales Shop (Retail POS)</option>
            <option value="store_1">Store 1 (Transfer Only)</option>
            <option value="store_2">Store 2 (Transfer Only)</option>
          </select>
        </div>

        {/* Default PIN Banner */}
        <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold">Default Access PIN: </span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-slate-900">123456</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 font-medium">Until updated</span>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-2.5 sm:p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 sm:p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* PIN Dots display & Hidden keyboard input */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="space-y-2 text-center cursor-pointer group"
          title="Click anywhere here or use your keyboard to type the PIN"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600">
            <Keyboard className="w-3.5 h-3.5 text-rose-600" />
            <span>Enter 6-Digit Passcode</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Type with physical keyboard or click numeric keypad below</p>

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
            aria-label="Cashier PIN Passcode"
            autoFocus
          />

          <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const hasDigit = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold transition-all ${
                    hasDigit
                      ? 'border-slate-900 bg-slate-900 text-white scale-105 shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-rose-300'
                  }`}
                >
                  {hasDigit ? '•' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1 sm:pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-xl font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-xl font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Unlock Button */}
        <button
          type="button"
          onClick={() => attemptUnlock()}
          disabled={pin.length !== 6}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Unlock POS Register</span>
        </button>

        {/* Operators list preview */}
        {posOperators && posOperators.length > 0 && (
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700">Configured Operators:</span>
            <div className="flex flex-wrap gap-1">
              {posOperators.map(op => (
                <span key={op.id} className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-medium">
                  {op.name} ({op.pin})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
