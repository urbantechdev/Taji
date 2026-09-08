import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { LogoEffectType } from '../../types';
import { playClickSound } from '../../utils/audio';

export interface BrandLogoProps {
  logoUrl?: string;
  brandName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'hero' | 'custom';
  customSizeClass?: string;
  effect?: LogoEffectType;
  primaryColor?: string;
  onClick?: () => void;
  className?: string;
  showSparkle?: boolean;
  interactive?: boolean;
  title?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  brandName = 'Taji',
  size = 'lg',
  customSizeClass,
  effect = 'gleam',
  primaryColor = '#B50044',
  onClick,
  className = '',
  showSparkle = true,
  interactive = true,
  title
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Size mapping with accurate optical metrics
  const sizeConfig = {
    xs: { container: 'w-8 h-8', border: 'border-2', padding: 'p-0.5', text: 'text-xs', ring: 'ring-1' },
    sm: { container: 'w-10 h-10', border: 'border-2', padding: 'p-0.5', text: 'text-sm', ring: 'ring-2' },
    md: { container: 'w-14 h-14', border: 'border-2.5', padding: 'p-1', text: 'text-lg', ring: 'ring-2' },
    lg: { container: 'w-16 h-16 lg:w-22 lg:h-22', border: 'border-3 lg:border-4', padding: 'p-1 lg:p-1.5', text: 'text-2xl lg:text-3xl', ring: 'ring-2 lg:ring-4' },
    xl: { container: 'w-24 h-24 sm:w-28 sm:h-28', border: 'border-4', padding: 'p-1.5 sm:p-2', text: 'text-3xl sm:text-4xl', ring: 'ring-4' },
    '2xl': { container: 'w-32 h-32 sm:w-36 sm:h-36', border: 'border-4', padding: 'p-2 sm:p-2.5', text: 'text-5xl', ring: 'ring-4' },
    '3xl': { container: 'w-36 h-36 sm:w-48 sm:h-48', border: 'border-4 sm:border-6', padding: 'p-2 sm:p-2.5', text: 'text-5xl sm:text-7xl', ring: 'ring-4 sm:ring-6' },
    hero: { container: 'w-36 h-36 sm:w-48 sm:h-48', border: 'border-4 sm:border-6', padding: 'p-2 sm:p-2.5', text: 'text-5xl sm:text-7xl', ring: 'ring-4 sm:ring-6' },
    custom: { container: customSizeClass || 'w-16 h-16', border: 'border-3', padding: 'p-1', text: 'text-2xl', ring: 'ring-2' }
  }[size];

  const initialLetter = (brandName || 'T').charAt(0).toUpperCase();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      playClickSound();
      onClick();
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ------------------------------------------------------------- */}
      {/* CSS Keyframes for High-Fidelity Sheen & Conic Orbital Sweep   */}
      {/* ------------------------------------------------------------- */}
      <style>{`
        @keyframes logoSheenGlint {
          0% {
            transform: translateX(-180%) skewX(-25deg);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          50% {
            transform: translateX(180%) skewX(-25deg);
            opacity: 0.9;
          }
          100% {
            transform: translateX(180%) skewX(-25deg);
            opacity: 0;
          }
        }
        @keyframes logoOrbitalSpinClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logoOrbitalSpinCounter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes logoAcousticPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* 1. BACKGROUND AMBIENT EFFECTS & HALOS                         */}
      {/* ------------------------------------------------------------- */}
      {effect === 'pulse' && (
        <>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: 'logoAcousticPulse 2.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
              border: `2px solid ${primaryColor}88`
            }}
          />
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: 'logoAcousticPulse 2.8s cubic-bezier(0, 0.2, 0.8, 1) infinite 1.4s',
              border: `2px solid rgba(255, 255, 255, 0.6)`
            }}
          />
        </>
      )}

      {effect === 'orbital' && (
        <>
          {/* Outer Segmented Orbital Bezel */}
          <div
            className="absolute -inset-1.5 lg:-inset-2.5 rounded-full pointer-events-none"
            style={{
              animation: 'logoOrbitalSpinClockwise 12s linear infinite',
              background: `conic-gradient(from 0deg, transparent 0deg, ${primaryColor}99 90deg, transparent 180deg, rgba(255,255,255,0.85) 270deg, transparent 360deg)`
            }}
          />
          {/* Counter-rotating Dotted Trace */}
          <div
            className="absolute -inset-1 rounded-full pointer-events-none opacity-60"
            style={{
              animation: 'logoOrbitalSpinCounter 7s linear infinite',
              border: '2px dashed rgba(255, 255, 255, 0.6)'
            }}
          />
        </>
      )}

      {effect === 'gleam' && (
        <>
          {/* Dynamic Breathing Halo Aura */}
          <motion.div
            className="absolute -inset-2 rounded-full pointer-events-none blur-md"
            animate={{
              opacity: [0.35, 0.7, 0.35],
              scale: [0.98, 1.08, 0.98]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              background: `radial-gradient(circle, ${primaryColor}77 0%, rgba(255,255,255,0.4) 60%, transparent 100%)`
            }}
          />
          {/* Rotating Conic Sheen Ring */}
          <div
            className="absolute -inset-1 rounded-full pointer-events-none opacity-70"
            style={{
              animation: 'logoOrbitalSpinClockwise 16s linear infinite',
              background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.9) 120deg, transparent 240deg, ${primaryColor}aa 300deg, transparent 360deg)`
            }}
          />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN LOGO BADGE CONTAINER                                  */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        onClick={handleClick}
        title={title || (onClick ? 'Click to customize brand logo & settings' : brandName)}
        animate={
          effect === 'float'
            ? {
                y: [0, -6, 0],
                rotate: [-1, 1, -1]
              }
            : effect === 'gleam'
            ? {
                scale: isHovered ? 1.08 : [1, 1.025, 1],
                boxShadow: [
                  '0 0 0 0px rgba(255, 255, 255, 0.5)',
                  '0 0 0 14px rgba(255, 255, 255, 0)',
                  '0 0 0 0px rgba(255, 255, 255, 0.5)'
                ]
              }
            : effect === 'orbital'
            ? {
                scale: isHovered ? 1.06 : 1
              }
            : {
                scale: isHovered ? 1.05 : 1
              }
        }
        transition={
          effect === 'float'
            ? {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            : effect === 'gleam'
            ? {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            : {
                type: 'spring',
                stiffness: 300,
                damping: 20
              }
        }
        whileHover={interactive ? { scale: 1.08, rotate: [0, -2, 2, 0] } : undefined}
        whileTap={interactive ? { scale: 0.94 } : undefined}
        className={`
          ${sizeConfig.container}
          ${sizeConfig.border}
          ${sizeConfig.padding}
          ${sizeConfig.ring}
          rounded-full
          bg-white/30
          border-white/80
          ring-white/30
          shadow-2xl
          flex items-center justify-center
          shrink-0
          backdrop-blur-md
          overflow-hidden
          relative
          ${interactive ? 'cursor-pointer group/logo' : ''}
          transition-colors duration-200
        `}
        style={{
          boxShadow: `0 10px 25px -5px ${primaryColor}44, 0 8px 10px -6px ${primaryColor}33`
        }}
      >
        {/* Central Graphic: Image or Monogram */}
        {logoUrl && !imgError ? (
          <div className="w-full h-full rounded-full overflow-hidden relative bg-white p-0.5 shadow-inner flex items-center justify-center">
            <motion.img
              src={logoUrl}
              alt={brandName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-full"
              animate={
                effect === 'orbital'
                  ? { rotate: [0, 2, -2, 0] }
                  : effect === 'gleam'
                  ? { scale: [1, 1.02, 1] }
                  : {}
              }
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Glass Sheen Glint Sweep across image */}
            {(effect === 'gleam' || effect === 'orbital') && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
                    animation: 'logoSheenGlint 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-full h-full rounded-full flex items-center justify-center text-white font-black ${sizeConfig.text} shadow-inner border border-white/40 relative overflow-hidden`}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, #e11d48, #fb7185)`
            }}
          >
            {/* Monogram Sheen Sweep */}
            {(effect === 'gleam' || effect === 'orbital') && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
                  animation: 'logoSheenGlint 3.8s ease-in-out infinite'
                }}
              />
            )}
            <span className="relative z-10 drop-shadow-md">{initialLetter}</span>
          </div>
        )}

        {/* Outer Ring Reflection Accent */}
        <div className="absolute inset-0 rounded-full border border-white/50 pointer-events-none" />
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 3. OPTIONAL DIAMOND SPARKLE STAR (Top-Right Glint)            */}
      {/* ------------------------------------------------------------- */}
      {showSparkle && (effect === 'gleam' || effect === 'orbital') && (
        <motion.div
          className="absolute -top-1 -right-1 pointer-events-none z-20 text-amber-300 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]"
          animate={{
            scale: [0.75, 1.25, 0.75],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 45, 0]
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-300 stroke-white stroke-[1.5]" />
        </motion.div>
      )}
    </div>
  );
};
