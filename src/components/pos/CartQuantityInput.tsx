import React, { useState, useEffect } from 'react';
import { Plus, Minus, Scale } from 'lucide-react';
import { CategoryType, UnitType } from '../../types';

interface CartQuantityInputProps {
  value: number;
  unit: UnitType;
  category?: CategoryType;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showPresets?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onOpenScale?: () => void;
  className?: string;
}

export const CartQuantityInput: React.FC<CartQuantityInputProps> = ({
  value,
  unit,
  category,
  onChange,
  min = 0.01,
  max = 99999,
  step,
  showPresets = true,
  size = 'sm',
  onOpenScale,
  className = ''
}) => {
  const [localInput, setLocalInput] = useState<string>(value.toString());
  const isDecimalUnit = unit === 'kg' || unit === 'meter' || unit === 'yard';
  const defaultStep = step ?? (isDecimalUnit ? (unit === 'kg' ? 0.5 : 1) : 1);

  useEffect(() => {
    setLocalInput(value.toString());
  }, [value]);

  const handleCommit = (valStr: string) => {
    let parsed = parseFloat(valStr);
    if (isNaN(parsed) || parsed < min) {
      parsed = min;
    } else if (parsed > max) {
      parsed = max;
    }
    const finalVal = isDecimalUnit ? Math.round(parsed * 1000) / 1000 : Math.round(parsed);
    setLocalInput(finalVal.toString());
    onChange(finalVal);
  };

  const handleIncrement = () => {
    const current = parseFloat(localInput) || value || 0;
    const next = current + defaultStep;
    handleCommit(next.toString());
  };

  const handleDecrement = () => {
    const current = parseFloat(localInput) || value || 0;
    const next = Math.max(min, current - defaultStep);
    handleCommit(next.toString());
  };

  const isSmall = size === 'sm';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 transition-all">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={`${isSmall ? 'p-1.5' : 'p-2'} text-slate-500 hover:text-rose-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0`}
          title={`Decrease by ${defaultStep}`}
        >
          <Minus className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>

        <div className="flex-1 flex items-center justify-center min-w-0">
          <input
            type="number"
            step={isDecimalUnit ? '0.001' : '1'}
            min={min}
            max={max}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onBlur={(e) => handleCommit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommit(localInput);
              }
            }}
            className={`w-full text-center font-mono font-bold text-slate-900 bg-transparent outline-hidden px-1 ${
              isSmall ? 'text-xs py-1' : 'text-sm py-1.5'
            }`}
          />
          <span className="text-[10px] font-semibold text-slate-400 pr-2 shrink-0 select-none">
            {unit}
          </span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`${isSmall ? 'p-1.5' : 'p-2'} text-slate-500 hover:text-emerald-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0`}
          title={`Increase by ${defaultStep}`}
        >
          <Plus className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>

        {onOpenScale && (unit === 'kg' || category === 'Yarns') && (
          <button
            type="button"
            onClick={onOpenScale}
            className={`${isSmall ? 'p-1.5' : 'p-2'} bg-rose-50 hover:bg-rose-100 text-rose-700 border-l border-rose-200 transition-colors shrink-0`}
            title="Open digital tare scale"
          >
            <Scale className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        )}
      </div>

      {showPresets && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {isDecimalUnit ? (
            unit === 'kg' ? (
              [0.5, 1, 2, 5, 10, 24].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCommit(preset.toString())}
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border transition-all shrink-0 ${
                    Math.abs(value - preset) < 0.001
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                >
                  {preset}kg
                </button>
              ))
            ) : (
              [1, 5, 10, 25, 50, 70].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCommit(preset.toString())}
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border transition-all shrink-0 ${
                    Math.abs(value - preset) < 0.001
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                >
                  {preset}m
                </button>
              ))
            )
          ) : (
            [1, 2, 5, 10, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleCommit(preset.toString())}
                className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border transition-all shrink-0 ${
                  value === preset
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
