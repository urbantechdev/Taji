import React from 'react';
import { CategoryType } from '../../types';
import { StorefrontHeroSlider } from './StorefrontHeroSlider';

interface StorefrontHeroProps {
  onSelectCategory: (category: 'all' | CategoryType) => void;
}

/**
 * StorefrontHero
 * -------------------------------------------------------------
 * Clean, image-only hero slider showing Dereck, Fleece, and Yarn
 * high-resolution textile photography directly beneath the header.
 */
export const StorefrontHero: React.FC<StorefrontHeroProps> = ({
  onSelectCategory
}) => {
  return (
    <section className="w-full bg-slate-900 overflow-hidden" id="storefront-hero">
      <div className="w-full">
        <StorefrontHeroSlider onSelectCategory={onSelectCategory} />
      </div>
    </section>
  );
};

export default StorefrontHero;
