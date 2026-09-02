import React from 'react';
import { TajiStorefrontWebsite } from './TajiStorefrontWebsite';

interface StorefrontViewProps {
  onOpenAdminPortal?: () => void;
}

/**
 * StorefrontView wrapper exporting the dedicated TajiStorefrontWebsite
 */
export const StorefrontView: React.FC<StorefrontViewProps> = ({
  onOpenAdminPortal
}) => {
  return <TajiStorefrontWebsite onOpenAdminPortal={onOpenAdminPortal} />;
};

export default StorefrontView;
