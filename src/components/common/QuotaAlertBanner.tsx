import React, { useState } from 'react';
import { AlertCircle, ExternalLink, X, Database, ShieldAlert } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const QuotaAlertBanner: React.FC = () => {
  const { isQuotaExceeded, setIsQuotaExceeded } = useERP();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isQuotaExceeded || isDismissed) {
    return null;
  }

  const databaseId = 'ai-studio-taji-9c7acca3-fcfc-48ad-9890-2ef0d95f9983';
  const projectId = 'gen-lang-client-0971248288';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data?openUpgradeDialog=true`;
  const pricingUrl = 'https://firebase.google.com/pricing#cloud-firestore';

  return (
    <div
      id="firestore-quota-alert-banner"
      className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 sm:px-6 relative z-30 transition-all shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3 text-xs sm:text-sm">
          <div className="p-1 bg-amber-100 rounded-md text-amber-700 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-amber-950">
              Firestore Daily Free-Tier Quota Limit Reached
            </span>
            <span className="text-amber-800 ml-1.5">
              Cloud write operations are paused until daily quota resets at midnight Pacific Time. Taji is operating in
              <strong className="font-medium text-amber-950 ml-1">Local Resilient Mode</strong> — all POS sales, stock changes, ETR receipts, and ledger updates remain active and safely cached.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={pricingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-300 bg-white/80 hover:bg-white text-amber-800 font-medium transition-colors"
          >
            <span>Quota Info</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition-colors"
            title="Dismiss notice for this session"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
