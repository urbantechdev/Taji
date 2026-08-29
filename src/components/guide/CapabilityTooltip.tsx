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
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const CapabilityTooltip: React.FC<CapabilityTooltipProps> = ({
  title,
  description,
  roleRequired,
  shortcut,
  tip,
  children,
  placement = 'top',
  align = 'center',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    let horizontalAlign = 'left-1/2 -translate-x-1/2';
    if (align === 'right') {
      horizontalAlign = 'right-0 left-auto translate-x-0';
    } else if (align === 'left') {
      horizontalAlign = 'left-0 translate-x-0';
    }

    switch (placement) {
      case 'bottom':
        return `top-full mt-2 ${horizontalAlign}`;
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return `bottom-full mb-2 ${horizontalAlign}`;
    }
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
          className={`absolute z-50 w-72 sm:w-80 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()}`}
        >
          <div className="bg-slate-900/95 text-white text-xs rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 backdrop-blur-md space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{title}</span>
              </div>
              {shortcut && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {shortcut}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-300 text-[11px] leading-relaxed font-medium">
              {description}
            </p>

            {/* Role & Tip Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
              {roleRequired && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{roleRequired}</span>
                </span>
              )}
              {tip && (
                <span className="text-amber-300/90 font-medium italic">
                  💡 {tip}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
