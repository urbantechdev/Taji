import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { PopupPromptProvider } from './components/PopupPrompt';
import { PWAProvider } from './context/PWAContext';
import PWAInstallModal from './components/PWAInstallModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Home from './pages/Home';

// Lazy load secondary routes so initial homepage payload is featherweight & instant
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Strengths = lazy(() => import('./pages/Strengths'));
const Contact = lazy(() => import('./pages/Contact'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Security = lazy(() => import('./pages/Security'));
const Compliance = lazy(() => import('./pages/Compliance'));

// Instant route prefetcher during idle time
function RoutePrefetcher() {
  useEffect(() => {
    const prefetchRoutes = () => {
      // Silently pre-cache JavaScript chunks into browser memory
      import('./pages/About');
      import('./pages/Gallery');
      import('./pages/Strengths');
      import('./pages/Contact');
    };

    if ('requestIdleCallback' in window) {
      // @ts-ignore
      window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
    } else {
      setTimeout(prefetchRoutes, 1500);
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PWAProvider>
        <PopupPromptProvider>
          <ScrollToTop />
          <PWAInstallModal />
          <RoutePrefetcher />
          <FloatingWhatsApp />
          <Suspense fallback={
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<Home />} />
              <Route path="/products" element={<Home />} />
              <Route path="/services" element={<Strengths />} />
              <Route path="/about" element={<About />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/strengths" element={<Strengths />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/terms-and-conditions" element={<Terms />} />
              <Route path="/terms-of-service" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/cookie-policy" element={<Cookies />} />
              <Route path="/security" element={<Security />} />
              <Route path="/security-standards" element={<Security />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/ethics-compliance" element={<Compliance />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </PopupPromptProvider>
      </PWAProvider>
    </BrowserRouter>
  );
}

