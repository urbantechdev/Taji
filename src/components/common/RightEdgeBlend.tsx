import React from 'react';

interface RightEdgeBlendProps {
  className?: string;
  variant?: 'rose' | 'rainbow' | 'sunset' | 'ocean';
}

export const RightEdgeBlend: React.FC<RightEdgeBlendProps> = ({
  className = '',
  variant = 'rainbow'
}) => {
  const getGradientClass = () => {
    switch (variant) {
      case 'rose':
        return 'from-rose-500 via-pink-500 to-rose-700 shadow-rose-500/40';
      case 'sunset':
        return 'from-rose-500 via-amber-500 to-pink-600 shadow-amber-500/40';
      case 'ocean':
        return 'from-rose-500 via-purple-500 to-indigo-600 shadow-purple-500/40';
      case 'rainbow':
      default:
        return 'from-rose-500 via-pink-500 via-purple-500 to-amber-400 shadow-pink-500/40';
    }
  };

  return (
    <div
      className={`absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b ${getGradientClass()} rounded-r-2xl pointer-events-none transition-all duration-300 group-hover:w-2.5 group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)] z-10 ${className}`}
    />
  );
};

export default RightEdgeBlend;
