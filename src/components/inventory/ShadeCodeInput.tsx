import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Sparkles, X } from 'lucide-react';
import { findMillShadeByQuery, searchMillShades } from '../../utils/textileShadeEngine';

export interface ShadeOption {
  code: string;
  name: string;
  hex: string;
  category?: string;
  defaultDyeLot?: string;
  description?: string;
  source?: string;
}

interface ShadeCodeInputProps {
  value: string;
  colorHex?: string;
  category?: string;
  knownShades: ShadeOption[];
  onSelectShade: (shade: ShadeOption) => void;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const ShadeCodeInput: React.FC<ShadeCodeInputProps> = ({
  value,
  colorHex,
  category,
  knownShades,
  onSelectShade,
  onChangeText,
  placeholder = 'Type shade code or # (e.g. 4251, 3059)',
  className = '',
  id
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered suggestions based on user input
  const suggestions = React.useMemo(() => {
    if (!isOpen) return [];
    if (!inputValue.trim()) {
      // If empty, prioritize current category
      const recs = category
        ? knownShades.filter(s => s.category === category || s.category === 'All')
        : knownShades;
      return recs.slice(0, 15);
    }
    return searchMillShades(inputValue, knownShades, 15);
  }, [inputValue, isOpen, knownShades, category]);

  // Handle direct typing with instant smart number autofill
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    setInputValue(raw);
    onChangeText(raw);
    setIsOpen(true);
    setHighlightedIndex(0);

    const trimmed = raw.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');

    // If user types exact numeric code (e.g. "4251", "3059", "3075", "4551", "3025", "3061", "108", "900")
    if (digitsOnly.length >= 3 && /^\d+$/.test(trimmed)) {
      const matched = findMillShadeByQuery(trimmed, knownShades);
      if (matched) {
        // Auto-expand and autofill immediately!
        setInputValue(matched.code);
        onSelectShade(matched);
        return;
      }
    }

    // If user types or pastes complete dye lot (e.g. "26E081", "26C002")
    if (/^26[A-Z]\d{3,}$/i.test(trimmed)) {
      const matched = findMillShadeByQuery(trimmed, knownShades);
      if (matched) {
        setInputValue(matched.code);
        onSelectShade(matched);
        return;
      }
    }
  };

  // On blur, resolve if input matches known shade number or code
  const handleBlur = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const matched = findMillShadeByQuery(trimmed, knownShades);
    if (matched && matched.code.toUpperCase() !== trimmed) {
      setInputValue(matched.code);
      onSelectShade(matched);
    }
  };

  const handleSelect = (shade: ShadeOption) => {
    setInputValue(shade.code);
    onSelectShade(shade);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      } else {
        const matched = findMillShadeByQuery(inputValue, knownShades);
        if (matched) {
          handleSelect(matched);
        } else {
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Tab') {
      if (isOpen && suggestions.length > 0) {
        handleSelect(suggestions[highlightedIndex] || suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Find active swatch color
  const matchedActive = knownShades.find(
    s => s.code.toUpperCase() === (inputValue || '').trim().toUpperCase()
  );
  const displayHex = colorHex || matchedActive?.hex;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Color Swatch Indicator */}
        {displayHex && (
          <span
            className="absolute left-2.5 w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0 pointer-events-none z-10 transition-transform"
            style={{ backgroundColor: displayHex }}
            title={`Active Swatch: ${displayHex}`}
          />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-white border border-slate-300 rounded-xl py-2 pr-8 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500 transition-colors ${
            displayHex ? 'pl-8' : 'pl-3'
          } ${className}`}
        />

        {/* Right action buttons: Clear or Dropdown toggle */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onChangeText('');
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear shade code"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Browse all shade codes"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3 h-3 text-rose-500" />
              {inputValue.trim() ? `Matching Shades (${suggestions.length})` : `Known Mill Catalog (${knownShades.length})`}
            </span>
            <span>Type &quot;4251&quot; or &quot;3059&quot; to autofill</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100/80 scrollbar-thin">
            {suggestions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                <span>No exact mill code found. Will use custom code: </span>
                <span className="font-mono font-bold text-slate-800">{inputValue}</span>
              </div>
            ) : (
              suggestions.map((shade, idx) => {
                const isSelected = shade.code.toUpperCase() === (inputValue || '').trim().toUpperCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${shade.code}-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input onBlur before selection
                      handleSelect(shade);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-2.5 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isHighlighted ? 'bg-rose-50/80 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Color Swatch */}
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: shade.hex }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900 truncate">
                            {shade.code}
                          </span>
                          {shade.category && shade.category !== 'All' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              {shade.category}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {shade.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {shade.defaultDyeLot && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Lot: {shade.defaultDyeLot}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick manual option footer */}
          {inputValue.trim() && !suggestions.some(s => s.code.toUpperCase() === inputValue.trim()) && (
            <div className="p-2 bg-amber-50/60 border-t border-amber-200/60 text-[10px] text-amber-800 flex items-center justify-between">
              <span>Press <b>Enter</b> to use <b>{inputValue}</b> as custom shade</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
