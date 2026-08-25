import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Building2, ShieldCheck, Truck, FileText, Receipt, Sparkles } from 'lucide-react';

export type DocumentBadgeVariant =
  | 'invoice'
  | 'delivery_note'
  | 'quotation'
  | 'proforma'
  | 'receipt'
  | 'credit_note'
  | 'statement'
  | 'payslip'
  | 'waybill'
  | 'audit';

interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
  documentNumber?: string;
  docNumber?: string;
  documentDate?: string | Date;
  docDate?: string | Date;
  badgeVariant?: DocumentBadgeVariant;
  variant?: string;
  badgeLabel?: string;
  badgeText?: string;
  refId?: string;
  extraMetaRight?: React.ReactNode;
  compact?: boolean;
  className?: string;
  themeBorder?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  title,
  subtitle,
  documentNumber,
  docNumber,
  documentDate,
  docDate,
  badgeVariant = 'invoice',
  variant,
  badgeLabel,
  badgeText,
  refId,
  extraMetaRight,
  compact = false,
  className = '',
  themeBorder = true
}) => {
  const finalDocNumber = documentNumber || docNumber;
  const finalDocDate = documentDate || docDate;
  const finalBadgeLabel = badgeLabel || badgeText;
  const finalBadgeVariant = (variant === 'payslip' ? 'payslip' : variant === 'waybill' ? 'waybill' : badgeVariant) as DocumentBadgeVariant;
  const isCompact = compact || variant === 'thermal';
  const { brandSettings, etrConfig } = useERP();

  const brandName = brandSettings?.brandName || etrConfig?.companyName || 'TAJI TEXTILE & APPAREL ERP';
  const logoUrl = brandSettings?.logoUrl;
  const companyAddress = etrConfig?.companyAddress || 'Industrial Area, Commercial Street, Enterprise Road, Nairobi, Kenya';
  const companyPhone = etrConfig?.companyPhone || '+254 722 000 000';
  const companyEmail = brandSettings?.supportEmail || 'billing@zamodasports.com';
  const taxPin = etrConfig?.taxPin || 'P051982341Z';
  const cuSerial = etrConfig?.cuSerialNumber || 'KRAMW019284';

  // Variant color mapping
  const getVariantStyles = (bVariant: DocumentBadgeVariant) => {
    switch (bVariant) {
      case 'delivery_note':
        return {
          borderColor: 'border-indigo-600',
          badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
          accentText: 'text-indigo-700',
          icon: <Truck className="w-5 h-5 text-indigo-600" />
        };
      case 'quotation':
        return {
          borderColor: 'border-amber-500',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          accentText: 'text-amber-700',
          icon: <Sparkles className="w-5 h-5 text-amber-600" />
        };
      case 'proforma':
        return {
          borderColor: 'border-sky-600',
          badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
          accentText: 'text-sky-700',
          icon: <FileText className="w-5 h-5 text-sky-600" />
        };
      case 'receipt':
        return {
          borderColor: 'border-emerald-600',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          accentText: 'text-emerald-700',
          icon: <Receipt className="w-5 h-5 text-emerald-600" />
        };
      case 'credit_note':
        return {
          borderColor: 'border-orange-600',
          badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
          accentText: 'text-orange-700',
          icon: <Receipt className="w-5 h-5 text-orange-600" />
        };
      case 'statement':
        return {
          borderColor: 'border-slate-800',
          badgeBg: 'bg-slate-900 text-white border-slate-700',
          accentText: 'text-rose-600',
          icon: <FileText className="w-5 h-5 text-rose-500" />
        };
      case 'payslip':
        return {
          borderColor: 'border-rose-600',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
          accentText: 'text-rose-700',
          icon: <ShieldCheck className="w-5 h-5 text-rose-600" />
        };
      case 'waybill':
        return {
          borderColor: 'border-slate-800',
          badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
          accentText: 'text-slate-700',
          icon: <Truck className="w-5 h-5 text-slate-700" />
        };
      case 'audit':
        return {
          borderColor: 'border-rose-600',
          badgeBg: 'bg-rose-50 text-rose-900 border-rose-200',
          accentText: 'text-rose-600',
          icon: <ShieldCheck className="w-5 h-5 text-rose-600" />
        };
      case 'invoice':
      default:
        return {
          borderColor: 'border-rose-600',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
          accentText: 'text-rose-700',
          icon: <Building2 className="w-5 h-5 text-rose-600" />
        };
    }
  };

  const styles = getVariantStyles(finalBadgeVariant);
  const formattedDate = finalDocDate
    ? typeof finalDocDate === 'string'
      ? finalDocDate
      : finalDocDate.toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  return (
    <div
      className={`pb-4 ${themeBorder ? `border-b-2 ${styles.borderColor}` : ''} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand & Logo Section */}
        <div className="flex items-center gap-3.5">
          {/* Official Logo Frame with subtle glow & fallback */}
          <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-2xl bg-white border border-slate-200 shadow-md p-1 flex items-center justify-center shrink-0 overflow-hidden relative group`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback on image error to stylish monogram badge
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-600 text-white font-black text-xl flex items-center justify-center shadow-inner">
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-tight font-ai leading-tight">
                {brandName}
              </h2>
            </div>
            
            <p className={`text-[11px] font-bold font-mono uppercase tracking-wider ${styles.accentText}`}>
              {subtitle || 'Textile Manufacturing & Multi-Branch Distribution Hub'}
            </p>

            <div className="text-[10.5px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
              <span>{companyAddress}</span>
              <span className="text-slate-300">•</span>
              <span>Tel: <strong className="text-slate-700">{companyPhone}</strong></span>
              <span className="text-slate-300">•</span>
              <span>PIN: <strong className="font-mono text-slate-700">{taxPin}</strong></span>
              <span className="text-slate-300">•</span>
              <span>CU: <strong className="font-mono text-slate-700">{cuSerial}</strong></span>
            </div>
          </div>
        </div>

        {/* Document Classification & Serial Badge */}
        <div className="text-left sm:text-right space-y-1 shrink-0">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-2xs ${styles.badgeBg}`}
            >
              {styles.icon}
              <span>{finalBadgeLabel || title}</span>
            </span>
          </div>

          {finalDocNumber && (
            <p className="font-mono text-sm font-extrabold text-slate-900 pt-0.5">
              #{finalDocNumber}
            </p>
          )}

          {refId && (
            <p className="text-[10px] font-mono text-slate-500">
              Ref: <span className="font-bold text-slate-700">{refId}</span>
            </p>
          )}

          <p className="text-[11px] text-slate-500 font-medium">
            Date: <span className="font-semibold text-slate-800">{formattedDate}</span>
          </p>

          {extraMetaRight}
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
