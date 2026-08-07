import React from 'react';

interface ReflectionOverlayProps {
  className?: string;
}

export const ReflectionOverlay: React.FC<ReflectionOverlayProps> = ({ className = '' }) => {
  return (
    <div className={`reflection-sheen-container ${className}`}>
      <div className="reflection-sheen-beam" />
    </div>
  );
};

export default ReflectionOverlay;
