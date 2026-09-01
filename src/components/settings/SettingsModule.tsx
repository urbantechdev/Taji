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
  Building2,
  Smartphone,
  Scissors,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

import { BranchLocationSettings } from './BranchLocationSettings';
import { ProductPriceSettings } from './ProductPriceSettings';
import { POSPaymentSettings } from './POSPaymentSettings';
import { FinancialSettings } from './FinancialSettings';
import { FabricInventorySettings } from './FabricInventorySettings';
import { RealBarcodeSettings } from './RealBarcodeSettings';
import { RoleSettings } from './RoleSettings';
import { UserCreationSettings } from './UserCreationSettings';
import { StockThresholdSettings } from './StockThresholdSettings';
import { GeneralPlatformSettings } from './GeneralPlatformSettings';

export type SettingsSubTab =
  | 'branches'
  | 'prices'
  | 'pos_payment'
  | 'financial'
  | 'fabric_inventory'
  | 'barcodes'
  | 'roles'
  | 'users'
  | 'stock_thresholds'
  | 'general';

interface SettingsModuleProps {
  initialSubTab?: SettingsSubTab;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ initialSubTab = 'branches' }) => {
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
      id: 'branches',
      label: '1. Store Locations & Branches',
      description: 'Multi-branch retail network, warehouse hubs & manager assignments',
      icon: Building2,
      badge: 'Branches'
    },
    {
      id: 'prices',
      label: '2. Product Catalog & Pricing',
      description: 'Category margins, bulk pricing & wholesale markup formulas',
      icon: DollarSign,
      badge: 'Margins'
    },
    {
      id: 'pos_payment',
      label: '3. POS & Payment Gateways',
      description: 'M-Pesa till/paybill, bank accounts, cashier float & receipt layout',
      icon: Smartphone,
      badge: 'M-Pesa / POS'
    },
    {
      id: 'financial',
      label: '5. Chart of Accounts & GL',
      description: 'General Ledger account codes, auto-posting rules & expense budgets',
      icon: BookOpen,
      badge: 'Ledger / COA'
    },
    {
      id: 'fabric_inventory',
      label: '6. Fabric & Tare Controls',
      description: 'Dual-weight tare profiles, cut-loss wastage % & defect quarantine',
      icon: Scissors,
      badge: 'Tare / Loss'
    },
    {
      id: 'barcodes',
      label: '7. Barcode & Label Printing',
      description: 'Real Code 128 / QR stickers, thermal rolls & A4 sticker sheets',
      icon: Barcode,
      badge: 'Stickers'
    },
    {
      id: 'roles',
      label: '8. Staff & RBAC Permissions',
      description: 'Role-based access matrix, security permissions & privileges',
      icon: ShieldCheck,
      badge: 'RBAC'
    },
    {
      id: 'users',
      label: 'Staff Users & PINs',
      description: 'Create operators, generate PINs & assign branch locations',
      icon: UserPlus,
      badge: 'Operators'
    },
    {
      id: 'stock_thresholds',
      label: 'Stock Alerts & Stagnation',
      description: 'Low stock level, dead stock period & automated reorder triggers',
      icon: Sliders,
      badge: 'Alerts'
    },
    {
      id: 'general',
      label: '9. Branding & Platform',
      description: 'Brand theme, logo, sound FX, cloud sync & system wipe',
      icon: Palette,
      badge: 'Theme'
    },
  ];

  return (
    <div className="space-y-6 pb-12" id="settings-module-root">
      
      {/* Top Main Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 text-white flex items-center justify-center shadow-lg shrink-0 border border-pink-400/30">
              <Settings className="w-5 h-5 sm:w-7 sm:h-7 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white">
                  System Settings &amp; Adjustments Center
                </h1>
                <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase tracking-wider">
                  Admin Configuration
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-slate-300 font-medium mt-0.5 line-clamp-2 sm:line-clamp-none">
                Govern store branches, catalog pricing, M-Pesa channels, Chart of Accounts, fabric tare, barcode stickers &amp; staff permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[10px] sm:text-xs font-mono text-slate-300 flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{brandSettings.brandName || 'TAJI'} ERP Config v2.8</span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Nav Pill Strip */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
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
        {activeSubTab === 'branches' && <BranchLocationSettings />}
        {activeSubTab === 'prices' && <ProductPriceSettings />}
        {activeSubTab === 'pos_payment' && <POSPaymentSettings />}
        {activeSubTab === 'financial' && <FinancialSettings />}
        {activeSubTab === 'fabric_inventory' && <FabricInventorySettings />}
        {activeSubTab === 'barcodes' && <RealBarcodeSettings />}
        {activeSubTab === 'roles' && <RoleSettings />}
        {activeSubTab === 'users' && <UserCreationSettings />}
        {activeSubTab === 'stock_thresholds' && <StockThresholdSettings />}
        {activeSubTab === 'general' && <GeneralPlatformSettings />}
      </div>
      
    </div>
  );
};
