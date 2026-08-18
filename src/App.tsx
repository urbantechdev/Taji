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
import { BranchManagementModule } from './components/branches/BranchManagementModule';
import { GmailInbox } from './components/gmail/GmailInbox';
import { ETRReceiptModal } from './components/common/ETRReceiptModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { AuthModal } from './components/auth/AuthModal';
import { MailNotificationPopup } from './components/notifications/MailNotificationPopup';
import { Footer } from './components/layout/Footer';

const ERPContent: React.FC = () => {
  const { appMode } = useERP();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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
        enterMethod.call(docEl).catch(() => {
          // Handled silently if browser security blocks non-gesture fullscreen
        });
      }
    }
  };

  useEffect(() => {
    // Attempt immediate fullscreen upon platform mount
    triggerFullscreen();

    // Browser security may require a user gesture; automatically trigger on any first user interaction
    const handleGesture = () => {
      triggerFullscreen();
    };

    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });
    window.addEventListener('keydown', handleGesture, { passive: true });
    window.addEventListener('pointerdown', handleGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
    };
  }, []);

  useEffect(() => {
    triggerFullscreen();
  }, [appMode, activeTab]);

  return (
    <div className="h-screen max-h-screen w-full bg-slate-50/80 font-sans text-slate-800 flex flex-col antialiased selection:bg-pink-100 selection:text-pink-900 overflow-hidden">
      
      {/* Top Header Bar (Stationary at top) */}
      <Header />

      {/* Main Workspace Body (Stationary Sidebar + Scrollable Body) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full min-h-0 relative">
        
        {/* Navigation Sidebar (Stationary left column - does NOT scroll with page content) */}
        {appMode === 'admin' && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Dynamic View Area (The only area that scrolls up and down) */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden min-h-0 flex flex-col justify-between">
          <main className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-28 md:pb-36">
            {appMode === 'pos' ? (
              <POSModule />
            ) : (
              <>
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'branches' && <BranchManagementModule />}
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

          {/* Footer inside scroll container */}
          <Footer />
        </div>

      </div>

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
