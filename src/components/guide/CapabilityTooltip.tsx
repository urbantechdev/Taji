import React, { useState } from 'react';
import { HelpCircle, Sparkles, Shield, Key } from 'lucide-react';

interface CapabilityTooltipProps {
  title: string;
  description: string;
  roleRequired?: string;
  shortcut?: string;
  tip?: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'left' | 'right';
  className?: string;
}

export const CapabilityTooltip: React.FC<CapabilityTooltipProps> = ({
  title,
  description,
  roleRequired,
  shortcut,
  tip,
  children,
  placement = 'bottom',
  align = 'center',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (placement) {
      case 'top':
        if (align === 'right') return 'bottom-full mb-2.5 right-0';
        if (align === 'left') return 'bottom-full mb-2.5 left-0';
        return 'bottom-full mb-2.5 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2.5 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2.5 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        if (align === 'right') return 'top-full mt-2.5 right-0';
        if (align === 'left') return 'top-full mt-2.5 left-0';
        return 'top-full mt-2.5 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    if (placement === 'top') {
      if (align === 'right') return 'top-full right-4 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]';
      if (align === 'left') return 'top-full left-4 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]';
      return 'top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]';
    }
    // Default bottom placement: arrow at top pointing upward toward the trigger button
    if (align === 'right') return 'bottom-full right-4 w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-white drop-shadow-[0_-1px_1px_rgba(0,0,0,0.08)]';
    if (align === 'left') return 'bottom-full left-4 w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-white drop-shadow-[0_-1px_1px_rgba(0,0,0,0.08)]';
    return 'bottom-full left-1/2 -translate-x-1/2 -mb-px w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-white drop-shadow-[0_-1px_1px_rgba(0,0,0,0.08)]';
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-[999999] w-72 sm:w-80 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()}`}
        >
          <div className="relative bg-white text-slate-800 text-xs rounded-2xl p-3.5 shadow-2xl border border-slate-200/90 space-y-2 ring-1 ring-black/5">
            {/* Arrow Indicator pointing toward the button */}
            <div className={`absolute ${getArrowClasses()}`} />

            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-black text-rose-600 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{title}</span>
              </div>
              {shortcut && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs">
                  {shortcut}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
              {description}
            </p>

            {/* Role & Tip Badges */}
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
              {roleRequired && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1 shadow-2xs">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{roleRequired}</span>
                </span>
              )}
              {tip && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 font-semibold inline-flex items-center gap-1 shadow-2xs">
                  <span>💡</span>
                  <span>{tip}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
