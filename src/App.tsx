import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DesktopBottomNav } from './components/layout/DesktopBottomNav';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { POSModule } from './components/pos/POSModule';
import { InventoryCatalog } from './components/inventory/InventoryCatalog';
import { InterStoreTransfers } from './components/transfers/InterStoreTransfers';
import { AccountingLedger } from './components/ledger/AccountingLedger';
import { ETRModule } from './components/etr/ETRModule';
import { HRPayrollModule } from './components/hr/HRPayrollModule';
import { AuditLogsModule } from './components/audit/AuditLogsModule';
import { POSOperatorManager } from './components/admin/POSOperatorManager';
import { GmailInbox } from './components/gmail/GmailInbox';
import { ETRReceiptModal } from './components/common/ETRReceiptModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { AuthModal } from './components/auth/AuthModal';
import { MailNotificationPopup } from './components/notifications/MailNotificationPopup';
import { Footer } from './components/layout/Footer';
import { Maximize2, Sparkles, X } from 'lucide-react';

const ERPContent: React.FC = () => {
  const { appMode } = useERP();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isFS, setIsFS] = useState(false);

  useEffect(() => {
    const checkFS = () => {
      const doc = window.document as any;
      setIsFS(
        !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', checkFS);
    document.addEventListener('webkitfullscreenchange', checkFS);
    document.addEventListener('mozfullscreenchange', checkFS);
    document.addEventListener('MSFullscreenChange', checkFS);

    checkFS();

    return () => {
      document.removeEventListener('fullscreenchange', checkFS);
      document.removeEventListener('webkitfullscreenchange', checkFS);
      document.removeEventListener('mozfullscreenchange', checkFS);
      document.removeEventListener('MSFullscreenChange', checkFS);
    };
  }, []);

  const triggerFullscreen = () => {
    const doc = window.document;
    const docEl = doc.documentElement as any;
    if (
      !doc.fullscreenElement &&
      !(doc as any).webkitFullscreenElement &&
      !(doc as any).mozFullScreenElement &&
      !(doc as any).msFullscreenElement
    ) {
      const enterMethod =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;

      if (enterMethod) {
        enterMethod.call(docEl).catch((err: any) => {
          console.log('Fullscreen request prevented:', err);
        });
      }
    }
  };

  useEffect(() => {
    // Attempt auto-fullscreen on first user interaction gesture
    const handleGesture = () => {
      triggerFullscreen();
    };

    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  useEffect(() => {
    if (appMode === 'pos') {
      triggerFullscreen();
    }
  }, [appMode]);

  return (
    <div className="min-h-screen w-full bg-slate-50/80 font-sans text-slate-800 flex flex-col antialiased selection:bg-pink-100 selection:text-pink-900 pb-16 md:pb-0">
      
      {/* Top Header Bar */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
        
        {/* Navigation Sidebar (rendered in Admin mode on desktop) */}
        {appMode === 'admin' && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Dynamic View Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-28">
          {appMode === 'pos' ? (
            <POSModule />
          ) : (
            <>
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'pos' && <POSModule />}
              {activeTab === 'catalog' && <InventoryCatalog />}
              {activeTab === 'transfers' && <InterStoreTransfers />}
              {activeTab === 'ledger' && <AccountingLedger />}
              {activeTab === 'etr' && <ETRModule />}
              {activeTab === 'payroll' && <HRPayrollModule />}
              {activeTab === 'operators' && <POSOperatorManager />}
              {activeTab === 'audit' && <AuditLogsModule />}
              {activeTab === 'gmail' && <GmailInbox />}
            </>
          )}
        </main>

      </div>

      {/* Footer */}
      <Footer />

      {/* Desktop Floating Dock Navigation Bar */}
      <DesktopBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} appMode={appMode} />

      {/* Global Toast / Popups & Modals */}
      <MailNotificationPopup />
      <ETRReceiptModal />
      <QRScannerModal />
      <AuthModal />

    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <ERPContent />
    </ERPProvider>
  );
}
