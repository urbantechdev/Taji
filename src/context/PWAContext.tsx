import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type PlatformType = 'iOS' | 'Android' | 'Windows' | 'macOS' | 'ChromeOS' | 'Linux' | 'Other';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  platformName: PlatformType;
  isModalOpen: boolean;
  showBanner: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  triggerInstall: () => Promise<boolean>;
  dismissBanner: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [platformName, setPlatformName] = useState<PlatformType>('Other');
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // Detect Platform & Installation State
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Detect user agent / platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    const isWin = /windows/.test(userAgent);
    const isMac = /macintosh|mac os x/.test(userAgent) && !isIosDevice;
    const isChromeOS = /cros/.test(userAgent);
    const isLin = /linux/.test(userAgent) && !isAndroidDevice;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isWin || isMac || isLin || isChromeOS);

    if (isIosDevice) setPlatformName('iOS');
    else if (isAndroidDevice) setPlatformName('Android');
    else if (isWin) setPlatformName('Windows');
    else if (isMac) setPlatformName('macOS');
    else if (isChromeOS) setPlatformName('ChromeOS');
    else if (isLin) setPlatformName('Linux');
    else setPlatformName('Other');

    // On iOS, if not installed, it's installable via Safari instructions
    if (isIosDevice && !isStandalone) {
      setIsInstallable(true);
    }

    // Check banner dismissal timestamp from localStorage
    const dismissedUntil = localStorage.getItem('tewaw_pwa_dismissed_until');
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    // Listen for beforeinstallprompt (Chromium browsers: Android, Windows, Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      if (!isStandalone && !isDismissed) {
        // Show gentle install banner after a 3 second delay for organic viewing
        setTimeout(() => {
          setShowBanner(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('Tewaw Enterprise PWA was successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update().catch(() => {});
            console.log('Tewaw PWA Service Worker registered successfully', reg.scope);
          })
          .catch((err) => {
            console.log('Tewaw PWA Service Worker registration skipped or failed:', err);
          });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    // Don't re-prompt automatically for 5 days
    localStorage.setItem('tewaw_pwa_dismissed_until', String(Date.now() + 5 * 24 * 60 * 60 * 1000));
  }, []);

  // Trigger Native browser prompt if available, or open visual guide
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
          setDeferredPrompt(null);
          setIsInstallable(false);
          setShowBanner(false);
          setIsModalOpen(false);
          return true;
        } else {
          console.log('User dismissed the PWA install prompt');
          return false;
        }
      } catch (err) {
        console.error('Error invoking deferred install prompt', err);
        openInstallModal();
        return false;
      }
    } else {
      // For iOS Safari or desktop without immediate prompt token, open visual modal
      openInstallModal();
      return false;
    }
  }, [deferredPrompt, openInstallModal]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        isDesktop,
        platformName,
        isModalOpen,
        showBanner,
        openInstallModal,
        closeInstallModal,
        triggerInstall,
        dismissBanner,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
