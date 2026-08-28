import React, { useState, useEffect } from 'react';
import { ProductBatch } from '../../types';
import {
  QrCode,
  Barcode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Trash2,
  Sparkles,
  ShieldCheck,
  Share2,
  Layers,
  Scale
} from 'lucide-react';
import { generateRealQRCodeDataURL, generateRealBarcodeDataURL, buildProductQRPayload } from '../../utils/realQrBarcode';
import { playClickSound, playSuccessSound } from '../../utils/audio';

interface ProductQRTagModalProps {
  product: ProductBatch | null;
  onClose: () => void;
  onDeleteRequest?: (product: ProductBatch) => void;
}

export const ProductQRTagModal: React.FC<ProductQRTagModalProps> = ({
  product,
  onClose,
  onDeleteRequest
}) => {
  const [tagFormat, setTagFormat] = useState<'HYBRID' | 'QR_ONLY' | 'BARCODE_ONLY'>('HYBRID');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  useEffect(() => {
    if (!product) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateCodes = async () => {
      try {
        const payload = buildProductQRPayload(product);
        const qrUrl = await generateRealQRCodeDataURL(payload, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'M'
        });

        const bcCode = product.barcode || product.sku;
        const bcUrl = generateRealBarcodeDataURL(bcCode, {
          format: 'CODE128',
          width: 2,
          height: 54,
          displayValue: true,
          fontSize: 12
        });

        if (isMounted) {
          setQrDataUrl(qrUrl);
          setBarcodeDataUrl(bcUrl);
          setIsGenerating(false);
        }
      } catch (e) {
        console.error('Error generating product QR code:', e);
        if (isMounted) setIsGenerating(false);
      }
    };

    generateCodes();

    return () => {
      isMounted = false;
    };
  }, [product]);

  if (!product) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.barcode || product.sku);
    playSuccessSound();
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleCopyPayload = () => {
    const payload = buildProductQRPayload(product);
    navigator.clipboard.writeText(payload);
    playSuccessSound();
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    playClickSound();
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${product.sku}_${product.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectPrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full h-auto max-h-[96dvh] sm:max-h-[90vh] p-5 sm:p-6 space-y-4 border border-rose-100 overflow-y-auto flex flex-col justify-between text-slate-900">
        
        {/* MODAL HEADER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  Authentic Product QR Tag
                  <span title="100% Real Scannable ISO QR Code">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  ISO/IEC 18004 Standard • Scannable on any camera or gun
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FORMAT SELECTOR PILLS */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => { playClickSound(); setTagFormat('HYBRID'); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tagFormat === 'HYBRID'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hybrid (QR + 1D)
            </button>
            <button
              type="button"
              onClick={() => { playClickSound(); setTagFormat('QR_ONLY'); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tagFormat === 'QR_ONLY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QR Code
            </button>
            <button
              type="button"
              onClick={() => { playClickSound(); setTagFormat('BARCODE_ONLY'); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tagFormat === 'BARCODE_ONLY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Code 128
            </button>
          </div>

          {/* AUTHENTIC PRINTABLE STICKER CARD */}
          <div className="p-4 border-2 border-slate-300 rounded-2xl bg-slate-50/80 space-y-3 text-center shadow-xs relative">
            
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                TAJI TEXTILES ERP
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full uppercase">
                {product.category}
              </span>
            </div>

            {/* Product Photo & Details */}
            <div className="flex items-center gap-3 text-left">
              {product.imageUrl ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xs border border-slate-200 shrink-0 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: product.colorHex }}
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-xl border border-slate-300 shadow-xs shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: product.colorHex }}
                >
                  {product.colorName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                  {product.name}
                </h4>
                <p className="text-xs text-rose-700 font-bold mt-0.5">
                  {product.colorName} • {product.fiberComposition}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>SKU: {product.sku}</span>
                  <span>•</span>
                  <span>Batch: {product.id}</span>
                </div>
              </div>
            </div>

            {/* REAL SCANNABLE QR & BARCODE SECTION */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              {isGenerating ? (
                <div className="h-36 flex flex-col items-center justify-center gap-2">
                  <div className="w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Generating authentic QR matrix...</span>
                </div>
              ) : (
                <>
                  {/* QR Matrix */}
                  {tagFormat !== 'BARCODE_ONLY' && qrDataUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={qrDataUrl}
                        alt={`QR Tag for ${product.name}`}
                        className="w-36 h-36 object-contain rounded-lg border border-slate-100 shadow-2xs"
                      />
                      <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-700 font-bold mt-1.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Real Scannable QR Payload</span>
                      </div>
                    </div>
                  )}

                  {/* 1D Barcode */}
                  {tagFormat !== 'QR_ONLY' && barcodeDataUrl && (
                    <div className="flex flex-col items-center justify-center pt-1 border-t border-slate-100">
                      <img
                        src={barcodeDataUrl}
                        alt={`Barcode ${product.barcode || product.sku}`}
                        className="h-12 object-contain max-w-full"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Price & Unit Info */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">Retail Price</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  KSh {product.unitPriceRetail.toLocaleString()}
                  <span className="text-[10px] font-normal text-slate-500"> / {product.unit}</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Net Mass / Roll</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {product.netWeightKg ? `${product.netWeightKg} KG` : `1.0 ${product.unit}`}
                </span>
              </div>
            </div>

          </div>

          {/* QUICK UTILITY ACTIONS: COPY PAYLOAD, COPY SKU */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleCopySku}
              className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedSku ? 'Copied SKU!' : 'Copy SKU / Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrImage}
              disabled={!qrDataUrl}
              className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {onDeleteRequest && (
            <button
              type="button"
              onClick={() => {
                const target = product;
                onClose();
                onDeleteRequest(target);
              }}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Delete this batch from catalog"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDirectPrint}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
          >
            <Printer className="w-4 h-4" />
            <span>Print Real Tag Sticker</span>
          </button>
        </div>

      </div>
    </div>
  );
};
