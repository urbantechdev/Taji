import React from 'react';

interface ReflectionOverlayProps {
  className?: string;
  opacity?: number;
}

export const ReflectionOverlay: React.FC<ReflectionOverlayProps> = ({ className = '', opacity }) => {
  return (
    <div
      className={`reflection-sheen-container ${className}`}
      style={opacity !== undefined ? { opacity } : undefined}
    >
      <div className="reflection-sheen-beam" />
    </div>
  );
};

export default ReflectionOverlay;
