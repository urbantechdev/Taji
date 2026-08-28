import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DesktopBottomNav } from './components/layout/DesktopBottomNav';
import { isTabAllowedForRole, ROLE_DEFINITIONS } from './utils/rbac';
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
import { TodaySalesView } from './components/dashboard/TodaySalesView';
import { CloseShiftModal } from './components/pos/CloseShiftModal';
import { ShiftZReportModal } from './components/pos/ShiftZReportModal';
import { PeriodicStatementModal } from './components/dashboard/PeriodicStatementModal';
import { TodaySalesModal } from './components/dashboard/TodaySalesModal';
import { GmailInbox } from './components/gmail/GmailInbox';
import { SettingsModule } from './components/settings/SettingsModule';
import { ETRReceiptModal } from './components/common/ETRReceiptModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { MobileBarcodeScannerModal } from './components/common/MobileBarcodeScannerModal';
import { DuplicateBarcodeAlertModal } from './components/common/DuplicateBarcodeAlertModal';
import { AuthModal } from './components/auth/AuthModal';
import { PlatformLockScreen } from './components/auth/PlatformLockScreen';
import { MailNotificationPopup } from './components/notifications/MailNotificationPopup';
import { ReturnExchangeModal } from './components/ReturnExchangeModal';
import { FabricRollManagerModal } from './components/FabricRollManagerModal';
import { UserGuideModule } from './components/docs/UserGuideModule';
import { Footer } from './components/layout/Footer';

const ERPContent: React.FC = () => {
  const { appMode, isPlatformUnlocked, isAdmin, currentUser } = useERP();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Verify and enforce role permission for currently selected tab
  const roleAllowedTabs = ROLE_DEFINITIONS[currentUser.role]?.allowedTabs || ['pos'];
  const isCurrentTabAllowed = isTabAllowedForRole(currentUser.role, activeTab);
  const effectiveTab: NavTab = isCurrentTabAllowed ? activeTab : (roleAllowedTabs[0] || 'pos');

  // Auto sync if user changes role or activeTab is forbidden
  useEffect(() => {
    if (!isCurrentTabAllowed) {
      setActiveTab(effectiveTab);
    }
  }, [currentUser.role, isCurrentTabAllowed, effectiveTab]);

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

  // HARD AUTHENTICATION GATE: Lock platform until Admin logs in with Gmail or User logs in with PIN
  if (!isPlatformUnlocked) {
    return (
      <>
        <PlatformLockScreen />
        <MailNotificationPopup />
      </>
    );
  }

  // Determine if active view should be POS terminal
  const isPosView = appMode === 'pos' && isTabAllowedForRole(currentUser.role, 'pos');

  return (
    <div className="h-screen max-h-screen w-full bg-slate-50/80 font-sans text-slate-800 flex flex-col antialiased selection:bg-pink-100 selection:text-pink-900 overflow-hidden">
      
      {/* Top Header Bar (Stationary at top) */}
      <Header activeTab={effectiveTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Body (Stationary Sidebar + Scrollable Body) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full min-h-0 relative">
        
        {/* Navigation Sidebar (Stationary left column for Admin & Managers in admin mode) */}
        {isAdmin && appMode === 'admin' && (
          <Sidebar activeTab={effectiveTab} setActiveTab={setActiveTab} />
        )}

        {/* Dynamic View Area (The only area that scrolls up and down) */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden min-h-0 flex flex-col justify-between">
          <main className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-[1680px] mx-auto w-full space-y-6 pb-28 md:pb-36 lg:pb-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={isPosView ? 'pos-view' : effectiveTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {isPosView ? (
                  <POSModule />
                ) : (
                  <>
                    {effectiveTab === 'dashboard' && <AdminDashboard />}
                    {effectiveTab === 'sales_today' && <TodaySalesView />}
                    {effectiveTab === 'branches' && <BranchManagementModule />}
                    {effectiveTab === 'pos' && <POSModule />}
                    {effectiveTab === 'catalog' && <InventoryCatalog />}
                    {effectiveTab === 'transfers' && <InterStoreTransfers />}
                    {effectiveTab === 'ledger' && <AccountingLedger />}
                    {effectiveTab === 'etr' && <ETRModule />}
                    {effectiveTab === 'payroll' && <HRPayrollModule />}
                    {effectiveTab === 'operators' && <POSOperatorManager />}
                    {effectiveTab === 'audit' && <AuditLogsModule />}
                    {effectiveTab === 'gmail' && <GmailInbox />}
                    {effectiveTab === 'settings' && <SettingsModule />}
                    {effectiveTab === 'guide' && <UserGuideModule onNavigateToTab={setActiveTab} />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer inside scroll container */}
          <Footer />
        </div>

      </div>

      {/* Desktop Floating Dock Navigation Bar (Filtered strictly by current user's role) */}
      <DesktopBottomNav activeTab={effectiveTab} setActiveTab={setActiveTab} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeTab={effectiveTab} setActiveTab={setActiveTab} appMode={appMode} />

      {/* Global Toast / Popups & Modals */}
      <MailNotificationPopup />
      <ETRReceiptModal />
      <QRScannerModal />
      <MobileBarcodeScannerModal />
      <DuplicateBarcodeAlertModal />
      <CloseShiftModal />
      <ShiftZReportModal />
      <PeriodicStatementModal />
      <TodaySalesModal />
      <ReturnExchangeModal />
      <FabricRollManagerModal />
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
