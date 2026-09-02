import React, { useState, useEffect, useMemo } from 'react';
import { CategoryType, ProductBatch } from '../../types';
import { useERP } from '../../context/ERPContext';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontHero } from './StorefrontHero';
import { StorefrontProductGrid } from './StorefrontProductGrid';
import { StorefrontProductDetailModal } from './StorefrontProductDetailModal';
import { StorefrontCartDrawer } from './StorefrontCartDrawer';
import { StorefrontCheckoutModal } from './StorefrontCheckoutModal';
import { StorefrontOrderTracker } from './StorefrontOrderTracker';
import { StorefrontContactModal } from './StorefrontContactModal';
import { StorefrontFooter } from './StorefrontFooter';
import { playClickSound } from '../../utils/audio';

interface TajiStorefrontWebsiteProps {
  onOpenAdminPortal?: () => void;
}

/**
 * TajiStorefrontWebsite
 * -------------------------------------------------------------
 * Dedicated, crawlable, and indexable public e-commerce storefront
 * architecture for Taji Textile Enterprise.
 * 
 * Features:
 * - Schema.org JSON-LD structured data for search engine bots (Googlebot, Bingbot)
 * - Deep URL state synchronization (?category=..., ?product=..., ?q=...)
 * - SEO-optimized dynamic metadata, OpenGraph tags, and canonical references
 * - High-speed decoupled client rendering
 */
export const TajiStorefrontWebsite: React.FC<TajiStorefrontWebsiteProps> = ({
  onOpenAdminPortal = () => {}
}) => {
  const { products, brandSettings } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryType>('all');
  
  // Modals & Drawers state
  const [quickViewProduct, setQuickViewProduct] = useState<ProductBatch | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // 1. URL Query / Hash Parsing on Mount (supports search engine crawler deep links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const prodParam = params.get('product');
      const searchParam = params.get('q') || params.get('search');

      if (catParam && (catParam === 'Dereck' || catParam === 'Fleece' || catParam === 'Yarns')) {
        setSelectedCategory(catParam as CategoryType);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
      if (prodParam && products.length > 0) {
        const found = products.find(p => p.id === prodParam || p.barcode === prodParam || p.name.toLowerCase().includes(prodParam.toLowerCase()));
        if (found) {
          setQuickViewProduct(found);
        }
      }
    } catch {
      // Safe fallback
    }
  }, [products]);

  // 2. Sync URL query params with state changes without full page reload
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedCategory !== 'all') {
        url.searchParams.set('category', selectedCategory);
      } else {
        url.searchParams.delete('category');
      }

      if (searchQuery.trim()) {
        url.searchParams.set('q', searchQuery.trim());
      } else {
        url.searchParams.delete('q');
      }

      if (quickViewProduct) {
        url.searchParams.set('product', quickViewProduct.id);
      } else {
        url.searchParams.delete('product');
      }

      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore if in restricted iframe
    }
  }, [selectedCategory, searchQuery, quickViewProduct]);

  // 3. Dynamic SEO Title & Meta Description for Crawlers
  useEffect(() => {
    const brandName = brandSettings?.brandName || 'TAJI';
    let pageTitle = `${brandName} | Wholesale & Retail Textiles, Dereck Fabrics, Fleece & Knitting Yarns Kenya`;
    let pageDesc = 'Order Dereck suiting fabrics, anti-pill polar fleece rolls, and acrylic/cotton knitting yarn cones directly with KRA eTIMS invoices in Nairobi, Kenya.';

    if (quickViewProduct) {
      pageTitle = `${quickViewProduct.name} - KSh ${quickViewProduct.unitPriceRetail.toLocaleString()} | ${brandName} Kenya`;
      pageDesc = `Buy ${quickViewProduct.name} (${quickViewProduct.category}) wholesale & retail. Price: KSh ${quickViewProduct.unitPriceRetail} per ${quickViewProduct.unit}. Instant countrywide dispatch.`;
    } else if (selectedCategory !== 'all') {
      pageTitle = `${selectedCategory} Textiles & Fabrics | ${brandName} Kenya Direct Wholesale`;
      pageDesc = `Explore premium ${selectedCategory} catalog. Direct factory roll supply, wholesale bulk discounts, and countrywide delivery across Kenya.`;
    } else if (searchQuery.trim()) {
      pageTitle = `Search: "${searchQuery}" | ${brandName} Online Store`;
    }

    document.title = pageTitle;

    // Update or insert meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    // Update OpenGraph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
  }, [selectedCategory, searchQuery, quickViewProduct, brandSettings]);

  // 4. Generate Schema.org JSON-LD Structured Data for Googlebot and Web Crawlers
  const structuredData = useMemo(() => {
    const brandName = brandSettings?.brandName || 'TAJI';
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://taji.co.ke';

    const items = products.map((prod, index) => {
      const totalStock = Object.values(prod.locationStock || {}).reduce((acc: number, val: number) => acc + (val || 0), 0);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: prod.name,
          description: `${prod.category} textile material, high-density quality weave. Unit: ${prod.unit}`,
          sku: prod.sku || prod.barcode || prod.id,
          image: prod.imageUrl || `${currentUrl}/assets/taji-logo.png`,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'KES',
            price: prod.unitPriceRetail,
            availability: totalStock > 0 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: `${brandName} Textile Enterprise`
            }
          }
        }
      };
    });

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${currentUrl}/#organization`,
          name: `${brandName} Textile Enterprise`,
          url: currentUrl,
          logo: `${currentUrl}/assets/taji-logo.png`,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+254700111000',
            contactType: 'Sales & Customer Support',
            areaServed: 'KE',
            availableLanguage: ['English', 'Swahili']
          }
        },
        {
          '@type': 'WebSite',
          '@id': `${currentUrl}/#website`,
          url: currentUrl,
          name: `${brandName} Online Store`,
          description: 'Textile wholesale & retail e-commerce platform for Dereck suiting, Fleece rolls, and Knitting Yarns in Kenya',
          publisher: {
            '@id': `${currentUrl}/#organization`
          }
        },
        {
          '@type': 'ItemList',
          '@id': `${currentUrl}/#catalog`,
          name: `${brandName} Available Textiles & Inventory`,
          itemListElement: items
        }
      ]
    };
  }, [products, brandSettings]);

  const handleOpenProductDetail = (product: ProductBatch) => {
    playClickSound();
    setQuickViewProduct(product);
  };

  return (
    <div 
      className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 selection:bg-rose-500 selection:text-white" 
      id="taji-ecommerce-storefront"
    >
      {/* Search Engine Crawler JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 1. Header Navigation Bar */}
      <StorefrontHeader
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackOrder={() => setIsOrderTrackerOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAdminPortal={onOpenAdminPortal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 2. Hero Presentation & Direct Category Quick Filters */}
      <StorefrontHero
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 3. Crawlable Live Product Catalog */}
      <StorefrontProductGrid
        onOpenQuickView={handleOpenProductDetail}
        onAddToCartSuccess={() => {}}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 4. Branded Pink Footer */}
      <StorefrontFooter
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('storefront-catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTrackOrder={() => setIsOrderTrackerOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAdminPortal={onOpenAdminPortal}
      />

      {/* MODALS & DRAWERS */}

      {/* Product Detail / Quick Specs Modal */}
      <StorefrontProductDetailModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCartSuccess={() => {}}
      />

      {/* Sliding Cart Drawer */}
      <StorefrontCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <StorefrontCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Live Order Tracker */}
      <StorefrontOrderTracker
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
      />

      {/* Branch Locations & Contact Modal */}
      <StorefrontContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

    </div>
  );
};

export default TajiStorefrontWebsite;
