import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus, Scale } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface CartQuantityInputProps {
  value: number;
  unit: string;
  category?: string;
  onChange: (newQty: number) => void;
  min?: number;
  size?: 'sm' | 'md' | 'lg';
  showPresets?: boolean;
  onOpenScale?: () => void;
  className?: string;
}

export const CartQuantityInput: React.FC<CartQuantityInputProps> = ({
  value,
  unit,
  category,
  onChange,
  min = 0.001,
  size = 'md',
  showPresets = false,
  onOpenScale,
  className = ''
}) => {
  // Keep local string state to allow effortless decimal typing (e.g. "1.", "1.4", "1.43")
  const [localText, setLocalText] = useState<string>(
    typeof value === 'number' ? (Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/\.?0+$/, '')) : '1'
  );
  const isFocusedRef = useRef(false);

  // Sync external value changes when not actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      const formatted = typeof value === 'number'
        ? (Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/\.?0+$/, ''))
        : '1';
      setLocalText(formatted);
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);

    // Allow empty or trailing dot while typing without crashing
    if (raw === '' || raw.endsWith('.')) {
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      // Clean decimal rounding to 3 decimal places
      const cleanVal = Number(parsed.toFixed(3));
      onChange(cleanVal);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const parsed = parseFloat(localText);
    if (isNaN(parsed) || parsed < min) {
      const fallback = Math.max(min, value || 1);
      const formatted = Number.isInteger(fallback) ? fallback.toString() : fallback.toFixed(3).replace(/\.?0+$/, '');
      setLocalText(formatted);
      onChange(fallback);
    } else {
      const cleanVal = Number(parsed.toFixed(3));
      const formatted = Number.isInteger(cleanVal) ? cleanVal.toString() : cleanVal.toFixed(3).replace(/\.?0+$/, '');
      setLocalText(formatted);
      onChange(cleanVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleStep = (delta: number) => {
    playClickSound();
    const current = parseFloat(localText) || value || 0;
    const nextVal = Math.max(min, Number((current + delta).toFixed(3)));
    const formatted = Number.isInteger(nextVal) ? nextVal.toString() : nextVal.toFixed(3).replace(/\.?0+$/, '');
    setLocalText(formatted);
    onChange(nextVal);
  };

  const isYarns = category === 'Yarns' || unit.toLowerCase() === 'kg';
  const isMeter = unit.toLowerCase() === 'meter' || unit.toLowerCase() === 'm';

  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1 bg-white border border-slate-300 hover:border-slate-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 rounded-xl p-1 shadow-2xs transition-all">
        {/* Step Minus Button */}
        <button
          type="button"
          onClick={() => handleStep(value <= 2 && isYarns ? -0.1 : -1)}
          className={`hover:bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center ${
            isSm ? 'p-1' : isLg ? 'p-2' : 'p-1.5'
          }`}
          title={value <= 2 && isYarns ? 'Subtract 0.100 kg' : 'Subtract 1 unit'}
        >
          <Minus className={isSm ? 'w-3 h-3' : isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        </button>

        {/* Live Decimal Numeric Input */}
        <div className="relative flex-1 min-w-[65px]">
          <input
            type="number"
            step="0.001"
            min={min}
            inputMode="decimal"
            value={localText}
            onChange={handleTextChange}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className={`w-full font-mono font-black text-center text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 select-all ${
              isSm ? 'text-xs py-0.5' : isLg ? 'text-base py-1' : 'text-sm py-0.5'
            }`}
          />
        </div>

        {/* Step Plus Button */}
        <button
          type="button"
          onClick={() => handleStep(value < 2 && isYarns ? 0.1 : 1)}
          className={`hover:bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center ${
            isSm ? 'p-1' : isLg ? 'p-2' : 'p-1.5'
          }`}
          title={value < 2 && isYarns ? 'Add 0.100 kg' : 'Add 1 unit'}
        >
          <Plus className={isSm ? 'w-3 h-3' : isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        </button>

        {/* Unit Badge */}
        <span
          className={`font-black uppercase tracking-wider text-slate-500 bg-slate-100 rounded-md px-1.5 py-0.5 select-none ${
            isSm ? 'text-[9px]' : 'text-[10px]'
          }`}
        >
          {unit}
        </span>

        {/* Quick Tare / Scale Launcher Button */}
        {onOpenScale && (
          <button
            type="button"
            onClick={onOpenScale}
            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Open Digital Scale & Tare Weigher"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Decimal Presets for Immediate POS & Checkout Speed */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {isYarns ? (
            <>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(1.430);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md cursor-pointer transition-colors"
                title="Set to 1.430 KG (Standard Weighed Cone)"
              >
                1.43 kg
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(2.000);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer transition-colors"
                title="Set to 2.000 KG (Standard Yarn Cone)"
              >
                2.0 kg
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(12.000);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md cursor-pointer transition-colors"
                title="Set to 12.000 KG (Half Bag)"
              >
                12 kg
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(24.000);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md cursor-pointer transition-colors"
                title="Set to 24.000 KG (Full Yarn Bale)"
              >
                24 kg
              </button>
            </>
          ) : isMeter ? (
            <>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(1.0);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md cursor-pointer transition-colors"
              >
                1.0 m
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(2.5);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md cursor-pointer transition-colors"
              >
                2.5 m
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(3.5);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md cursor-pointer transition-colors"
              >
                3.5 m
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(5.0);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md cursor-pointer transition-colors"
              >
                5.0 m
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(70.0);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md cursor-pointer transition-colors"
                title="70m (1 Full Roll @ Wholesale)"
              >
                70m (Roll)
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onChange(100.0);
                }}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md cursor-pointer transition-colors"
                title="100m (1 Roll @ Wholesale + 30m Cut @ Option 1 Discount)"
              >
                100m (Split)
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
