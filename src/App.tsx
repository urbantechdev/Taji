import React, { useState, useEffect } from 'react';
import { UniformProduct, QuoteItem } from './types';
import { UNIFORM_PRODUCTS } from './data/uniformsData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UniformCatalog } from './components/UniformCatalog';
import { InteractiveCustomizer } from './components/InteractiveCustomizer';
import { Footer } from './components/Footer';
import { UniformModal } from './components/UniformModal';
import { QuoteEstimatorModal } from './components/QuoteEstimatorModal';
import { SizeAndFabricGuide } from './components/SizeAndFabricGuide';
import { MobileStorefrontBottomNav } from './components/MobileStorefrontBottomNav';
import { ERPProvider } from './context/ERPContext';
import { AdminERPSuite } from './components/admin/AdminERPSuite';
import { PlatformPolicyPage } from './pages/PlatformPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { LocationPage } from './pages/LocationPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ServicesSection } from './components/ServicesSection';
import { ContactSection } from './components/ContactSection';
import { updateSEO } from './utils/seo';

export type AppViewMode = 'storefront' | 'erp' | 'privacy' | 'terms' | 'cookies' | 'location';

export default function App() {
  // View mode: storefront website always loads first. Admin is accessed through the lock icon at the footer.
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    // Clear any lingering erp mode or hashes so storefront website ALWAYS loads first
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy' || hash === '#policy') return 'privacy';
      if (hash === '#terms' || hash === '#tos') return 'terms';
      if (hash === '#cookies' || hash === '#cookie-policy') return 'cookies';
      if (hash === '#location' || hash === '#directions' || hash === '#map') return 'location';
      // If URL contains admin/erp hash on startup, clear it so website loads first
      if (hash === '#erp' || hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      try {
        localStorage.removeItem('nasisi_view_mode');
      } catch {
        // ignore
      }
    }
    return 'storefront';
  });

  // Listen to browser URL hash changes for deep linking & back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy' || hash === '#policy') {
        setViewMode('privacy');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#terms' || hash === '#tos') {
        setViewMode('terms');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#cookies' || hash === '#cookie-policy') {
        setViewMode('cookies');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#location' || hash === '#directions' || hash === '#map') {
        setViewMode('location');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#erp' || hash === '#admin') {
        setViewMode('erp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '' || hash === '#catalog' || hash === '#products' || hash === '#services' || hash === '#portfolio' || hash === '#contact' || hash === '#contacts') {
        // If coming from a standalone page to a section hash, return to storefront
        setViewMode((current) => (current === 'privacy' || current === 'terms' || current === 'cookies' || current === 'location' ? 'storefront' : current));
        if (hash === '#services') updateSEO('services');
        else if (hash === '#catalog' || hash === '#products') updateSEO('products');
        else if (hash === '#contact' || hash === '#contacts') updateSEO('contacts');
        else updateSEO('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync SEO whenever viewMode changes
  useEffect(() => {
    if (viewMode === 'storefront') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#services') updateSEO('services');
      else if (hash === '#catalog' || hash === '#products') updateSEO('products');
      else if (hash === '#contact' || hash === '#contacts') updateSEO('contacts');
      else updateSEO('home');
    }
  }, [viewMode]);

  // Helper to switch view mode with scroll-to-top and hash synchronization
  const navigateToView = (mode: AppViewMode) => {
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mode === 'privacy') {
      window.location.hash = 'privacy';
      updateSEO('privacy');
    } else if (mode === 'terms') {
      window.location.hash = 'terms';
      updateSEO('terms');
    } else if (mode === 'cookies') {
      window.location.hash = 'cookies';
      updateSEO('cookies');
    } else if (mode === 'location') {
      window.location.hash = 'location';
      updateSEO('location');
    } else if (mode === 'erp') {
      window.location.hash = 'erp';
    } else if (mode === 'storefront') {
      if (window.location.hash.includes('privacy') || window.location.hash.includes('terms') || window.location.hash.includes('cookies') || window.location.hash.includes('location') || window.location.hash.includes('erp')) {
        window.history.pushState(null, '', window.location.pathname);
      }
      updateSEO('home');
    }
  };

  // Auto full screen activation on open and first interaction
  useEffect(() => {
    const triggerFullscreen = () => {
      try {
        if (!document.fullscreenElement) {
          const docEl = document.documentElement as any;
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          }
        }
      } catch {
        // Handled silently
      }
    };

    // Attempt immediately on mount
    triggerFullscreen();

    // Trigger automatically on first user gesture anywhere on the window
    const handleFirstGesture = () => {
      triggerFullscreen();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Cart state persisted to localStorage
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('nasisi_quote_items');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default starter item to showcase instant quote readiness
    return [
      {
        id: 'initial-blazer',
        product: UNIFORM_PRODUCTS[0],
        selectedColor: 'Royal Blue',
        quantities: { 'Youth M': 20, 'Adult S': 30 },
        totalQuantity: 50,
        brandingType: 'embroidery',
        logoPlacement: ['Left Chest'],
        logoNotes: 'School Crest Gold Stitching Sample',
        unitPrice: 37.31,
        totalPrice: 1865.5,
      },
    ];
  });

  const [selectedProductForModal, setSelectedProductForModal] = useState<UniformProduct | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [customizerProduct, setCustomizerProduct] = useState<UniformProduct | null>(null);
  const [customizerColorHex, setCustomizerColorHex] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      // Storefront website must always load first on initial visits & refreshes
      if (viewMode !== 'erp') {
        localStorage.setItem('nasisi_view_mode', viewMode);
      } else {
        localStorage.removeItem('nasisi_view_mode');
      }
    } catch {
      // ignore
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('nasisi_quote_items', JSON.stringify(quoteItems));
    } catch {
      // ignore
    }
  }, [quoteItems]);

  const handleAddToCart = (item: QuoteItem) => {
    setQuoteItems((prev) => [item, ...prev]);
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setQuoteItems([]);
  };

  const handleOpenCustomizerWithProduct = (product: UniformProduct, colorHex: string) => {
    setCustomizerProduct(product);
    setCustomizerColorHex(colorHex);
    setIsCustomizerModalOpen(true);
  };

  return (
    <ERPProvider>
      {/* 1. Independent Platform & Privacy Policy Page */}
      {viewMode === 'privacy' && (
        <PlatformPolicyPage
          onBackToStorefront={() => navigateToView('storefront')}
          onNavigateToTerms={() => navigateToView('terms')}
          onNavigateToCookies={() => navigateToView('cookies')}
        />
      )}

      {/* 2. Independent Terms of Service Page */}
      {viewMode === 'terms' && (
        <TermsOfServicePage
          onBackToStorefront={() => navigateToView('storefront')}
          onNavigateToPrivacy={() => navigateToView('privacy')}
          onNavigateToCookies={() => navigateToView('cookies')}
        />
      )}

      {/* 3. Independent Cookies & Storage Policy Page */}
      {viewMode === 'cookies' && (
        <CookiePolicyPage
          onBackToStorefront={() => navigateToView('storefront')}
          onNavigateToPrivacy={() => navigateToView('privacy')}
          onNavigateToTerms={() => navigateToView('terms')}
        />
      )}

      {/* 4. Independent Location & Google Map Details Page */}
      {viewMode === 'location' && (
        <LocationPage
          onBackToStorefront={() => navigateToView('storefront')}
          onNavigateToServices={() => {
            navigateToView('storefront');
            setTimeout(() => {
              const el = document.getElementById('services');
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
          }}
          onNavigateToCatalog={() => {
            navigateToView('storefront');
            setTimeout(() => {
              const el = document.getElementById('catalog');
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
          }}
        />
      )}

      {/* 5. Enterprise ERP & Invoicing Center */}
      {viewMode === 'erp' && (
        <AdminERPSuite onSwitchToStorefront={() => navigateToView('storefront')} />
      )}

      {/* 6. Main Storefront & 3D Mockup Studio */}
      {viewMode === 'storefront' && (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Header & Sticky Nav with Mega Menu */}
          <Navbar
            quoteItems={quoteItems}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
            onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            onSelectProduct={(product) => setSelectedProductForModal(product)}
            onOpenPrivacyPolicy={() => navigateToView('privacy')}
            onOpenTerms={() => navigateToView('terms')}
            onOpenCookies={() => navigateToView('cookies')}
            onOpenLocation={() => navigateToView('location')}
            onOpenAdminERP={() => navigateToView('erp')}
          />

          <main className="flex-1 pt-32 sm:pt-36 md:pt-40 pb-24 lg:pb-0">
            {/* Plain Hero Banner with animated images and no text overlay */}
            <Hero />

            {/* Uniform Catalog (Products) */}
            <UniformCatalog
              onSelectProduct={(product) => setSelectedProductForModal(product)}
              onOpenCustomizerWithProduct={handleOpenCustomizerWithProduct}
            />

            {/* In-House Services Section (Embroidery, Screen Printing, Custom Knitwear) */}
            <ServicesSection
              onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
              onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
            />

            {/* Inquiries & Workshop Contact Section */}
            <ContactSection
              onOpenLocation={() => navigateToView('location')}
            />
          </main>

          {/* Modern Mobile Bottom Navigation */}
          <MobileStorefrontBottomNav
            quoteItems={quoteItems}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
            onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />

          {/* Modern Footer with Direct Legal & Location Links */}
          <Footer
            onOpenAdminERP={() => navigateToView('erp')}
            onOpenPrivacyPolicy={() => navigateToView('privacy')}
            onOpenTerms={() => navigateToView('terms')}
            onOpenCookies={() => navigateToView('cookies')}
            onOpenLocation={() => navigateToView('location')}
          />

          {/* Cookie Consent Floating Banner */}
          <CookieConsentBanner
            onOpenCookiePolicy={() => navigateToView('cookies')}
            onOpenPrivacyPolicy={() => navigateToView('privacy')}
          />

          {/* Modals & Studios */}
          <InteractiveCustomizer
            isOpen={isCustomizerModalOpen}
            onClose={() => setIsCustomizerModalOpen(false)}
            onAddToCart={handleAddToCart}
            preselectedProduct={customizerProduct}
            preselectedColorHex={customizerColorHex}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
          />

          <UniformModal
            product={selectedProductForModal}
            onClose={() => setSelectedProductForModal(null)}
            onAddToCart={handleAddToCart}
            onOpenCustomizerWithProduct={handleOpenCustomizerWithProduct}
          />

          <QuoteEstimatorModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            quoteItems={quoteItems}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />

          <SizeAndFabricGuide
            isOpen={isSizeGuideOpen}
            onClose={() => setIsSizeGuideOpen(false)}
          />
        </div>
      )}
    </ERPProvider>
  );
}
