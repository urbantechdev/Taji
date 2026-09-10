import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BrandLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'white' | 'responsive';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function BrandLogo({ className, variant = 'light', showText = true, size = 'md' }: BrandLogoProps) {
  const [settings, setSettings] = useState<any>(null);
  const isDark = variant === 'dark';
  const isWhite = variant === 'white';

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });
  }, []);
  
  const iconSizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12',
    md: 'w-12 h-12 md:w-[60px] md:h-[60px]',
    lg: 'w-[52px] h-[52px] md:w-[72px] md:h-[72px]',
    xl: 'w-20 h-20 md:w-24 md:h-24'
  };

  const renderIcon = () => {
    const rawLogo = settings?.headerLogoUrl;
    const isMock = !rawLogo || rawLogo.includes('pinimg.com') || rawLogo.includes('d33d71d87f12393171b52129b460c431');
    const logoUrl = isMock ? "/logo.svg" : rawLogo;
    return (
      <img 
        referrerPolicy="no-referrer"
        src={logoUrl} 
        alt="TEWAW Logo" 
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-115 group-hover:rotate-6"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          if (img.src !== window.location.origin + '/logo.svg') {
            img.src = '/logo.svg';
          } else {
            img.style.display = 'none';
            const fallback = document.getElementById(`logo-fallback-${size}`);
            if (fallback) fallback.style.display = 'block';
          }
        }}
      />
    );
  };

  return (
    <div className={cn("flex items-center gap-2 md:gap-4 group cursor-pointer select-none", className)}>
      <motion.div 
        animate={{ 
          y: [0, -4, 0],
          rotate: [0, 1, -1, 0]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        whileHover={{ scale: 1.15, y: -6, rotate: 6 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-white/40 shadow-[0_4px_18px_rgba(11,44,122,0.3)] transition-all duration-300",
          iconSizes[size]
        )}
      >
        {/* Continuous Pulsing Ambient Glow Aura */}
        <motion.div 
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-tr from-brand-blue/30 via-brand-green/30 to-emerald-400/20 rounded-full pointer-events-none z-10" 
        />

        {renderIcon()}

        {/* Continuous Glint Streak Animation (Loops non-stop across the circular badge) */}
        <motion.span 
          animate={{ x: ['-140%', '160%'] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none z-20" 
        />
        
        {/* Top Arc Specular Highlight */}
        <span className="absolute top-0 left-0 right-0 h-[40%] bg-white/25 rounded-t-full pointer-events-none z-15" />
        
        {/* Hidden Fallback SVG for Image Error */}
        <div id={`logo-fallback-${size}`} className="hidden absolute inset-0 bg-brand-blue flex items-center justify-center rounded-full">
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-2"
          >
            <path 
              d="M50 25C50 25 50 10 62 10C70 10 75 18 70 25C65 32 52 35 50 45" 
              stroke="white" 
              strokeWidth="6" 
              strokeLinecap="round"
            />
            <path 
              d="M15 55C15 55 35 45 50 45C65 45 85 55 85 55L50 85L15 55Z" 
              fill="white" 
            />
          </svg>
        </div>
      </motion.div>

      {showText && (
        <div className="flex flex-col ml-3 sm:ml-0 transition-transform duration-300 group-hover:translate-x-0.5">
          <span className={cn(
            "font-display font-black tracking-tight leading-none uppercase transition-colors duration-300",
            size === 'sm' ? "text-base md:text-lg" : (size === 'md' ? "text-lg md:text-xl" : "text-xl md:text-3xl"),
            variant === 'responsive' 
              ? "text-white lg:text-brand-blue" 
              : (isWhite || isDark ? "text-white" : "text-brand-blue")
          )}>
            TEWAW
          </span>
          <span className={cn(
            "font-bold uppercase tracking-[0.2em] transition-colors duration-300",
            size === 'sm' ? "text-[7px] md:text-[8px]" : "text-[8px] md:text-[10px]",
            variant === 'responsive'
              ? "text-brand-green lg:text-brand-green"
              : (isWhite || isDark ? "text-brand-green" : "text-brand-green")
          )}>
            {settings?.subtext || "Enterprises Limited"}
          </span>
        </div>
      )}
    </div>
  );
}
