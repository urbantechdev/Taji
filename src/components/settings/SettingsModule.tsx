import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Settings,
  DollarSign,
  ShieldCheck,
  Receipt,
  UserPlus,
  Barcode,
  Palette,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

import { ProductPriceSettings } from './ProductPriceSettings';
import { RoleSettings } from './RoleSettings';
import { FinancialSettings } from './FinancialSettings';
import { UserCreationSettings } from './UserCreationSettings';
import { RealBarcodeSettings } from './RealBarcodeSettings';
import { GeneralPlatformSettings } from './GeneralPlatformSettings';

export type SettingsSubTab = 'prices' | 'roles' | 'financial' | 'users' | 'barcodes' | 'general';

interface SettingsModuleProps {
  initialSubTab?: SettingsSubTab;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ initialSubTab = 'prices' }) => {
  const { currentUser, brandSettings } = useERP();
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  const tabs: Array<{
    id: SettingsSubTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    {
      id: 'prices',
      label: 'Product Price Settings',
      description: 'Category margins, bulk pricing & tare weights',
      icon: DollarSign,
      badge: 'Margins'
    },
    {
      id: 'roles',
      label: 'Role Settings',
      description: 'RBAC permissions matrix & access governance',
      icon: ShieldCheck,
      badge: 'Security'
    },
    {
      id: 'financial',
      label: 'Financial & Accounting',
      description: 'KRA ETR device, VAT, M-Pesa till & ledger policies',
      icon: Receipt,
      badge: 'KRA / ETR'
    },
    {
      id: 'users',
      label: 'User Creation',
      description: 'Create operators, generate PINs & manage branches',
      icon: UserPlus,
      badge: 'Staff'
    },
    {
      id: 'barcodes',
      label: 'Real Bar Code Generator',
      description: 'Real Code 128 / QR stickers for Fleece & Dereec',
      icon: Barcode,
      badge: 'Fleece/Dereec'
    },
    {
      id: 'general',
      label: 'General & Platform',
      description: 'Brand theme, logo, sound FX & cloud sync',
      icon: Palette,
      badge: 'Theme'
    },
  ];

  return (
    <div className="space-y-6 pb-12" id="settings-module-root">
      
      {/* Top Main Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 text-white flex items-center justify-center shadow-lg shrink-0 border border-pink-400/30">
              <Settings className="w-7 h-7 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  System Settings &amp; Governance Center
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase tracking-wider">
                  Admin Central
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Configure master product pricing, role permissions, KRA accounting, staff user accounts &amp; real fabric barcodes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{brandSettings.brandName || 'TAJI'} ERP Core v2.6</span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Nav Pill Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveSubTab(tab.id);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md font-black'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-pink-100 text-pink-800' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-Module Content */}
      <div className="animate-in fade-in duration-150">
        {activeSubTab === 'prices' && <ProductPriceSettings />}
        {activeSubTab === 'roles' && <RoleSettings />}
        {activeSubTab === 'financial' && <FinancialSettings />}
        {activeSubTab === 'users' && <UserCreationSettings />}
        {activeSubTab === 'barcodes' && <RealBarcodeSettings />}
        {activeSubTab === 'general' && <GeneralPlatformSettings />}
      </div>
      
    </div>
  );
};
