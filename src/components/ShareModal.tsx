import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  MessageCircle, 
  ExternalLink, 
  Sparkles, 
  Image as ImageIcon,
  Send,
  Mail,
  QrCode
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatPriceDisplay, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';

export interface ShareProduct {
  id: string | number;
  name: string;
  category?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  pricingType?: string;
  imageUrl: string;
  description?: string;
  linkUrl?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShareProduct | null;
}

export default function ShareModal({ isOpen, onClose, product }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImageLink, setCopiedImageLink] = useState(false);
  const [copiedImageFile, setCopiedImageFile] = useState(false);
  const [isSharingDevice, setIsSharingDevice] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Reset copied states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
      setCopiedImageLink(false);
      setCopiedImageFile(false);
      setShowQrCode(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tewaw.com';
  const productShareUrl = `${origin}/product/${product.id}`;
  const priceDisplay = formatPriceDisplay(product);
  const shareTitle = `${product.name} | Tewaw Enterprise Kenya`;
  const shareText = `Check out the ${product.name} (${product.category || 'Apparel'}) - ${priceDisplay} from Tewaw Enterprise Kenyan Garment Manufacturing.`;

  // Native Device Share with Image File support
  const handleNativeShare = async () => {
    setIsSharingDevice(true);
    try {
      if (navigator.share) {
        // Attempt to fetch image and share as a File if supported
        let fileShared = false;
        if (navigator.canShare && product.imageUrl) {
          try {
            const response = await fetch(product.imageUrl);
            const blob = await response.blob();
            const extension = blob.type.includes('png') ? 'png' : 'jpg';
            const filename = `tewaw-${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${extension}`;
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: shareTitle,
                text: `${shareText}\n\nView details: ${productShareUrl}`,
                files: [file]
              });
              fileShared = true;
            }
          } catch (e) {
            console.log('File sharing not permitted or failed, falling back to URL share', e);
          }
        }

        if (!fileShared) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: productShareUrl
          });
        }
      } else {
        // Fallback: Copy link
        await handleCopyLink();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error sharing product:', err);
      }
    } finally {
      setIsSharingDevice(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback input method
      const input = document.createElement('input');
      input.value = productShareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyImageLink = async () => {
    try {
      await navigator.clipboard.writeText(product.imageUrl);
      setCopiedImageLink(true);
      setTimeout(() => setCopiedImageLink(false), 2500);
    } catch (e) {
      console.error('Failed to copy image URL', e);
    }
  };

  const handleCopyImageToClipboard = async () => {
    try {
      setCopiedImageFile(true);
      const res = await fetch(product.imageUrl);
      const blob = await res.blob();
      
      // Convert to PNG for Clipboard API compatibility
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const imageLoaded = new Promise<Blob>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) resolve(pngBlob);
            else reject(new Error('Canvas conversion failed'));
          }, 'image/png');
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      const pngBlob = await imageLoaded;
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
      } else {
        await handleCopyLink();
      }
      setTimeout(() => setCopiedImageFile(false), 2500);
    } catch (err) {
      console.error('Failed to copy image to clipboard', err);
      setCopiedImageFile(false);
      handleCopyLink();
    }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(product.imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `tewaw-${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image', err);
      window.open(product.imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Social Share Channels
  const shareWhatsApp = () => {
    const message = `*🔥 ${product.name}*\n🏷️ Category: ${product.category || 'Apparel'}\n💰 Price: ${priceDisplay}\n\n📸 *Product Image & Details:*\n${productShareUrl}\n\n_Manufactured by Tewaw Enterprise Kenya_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sharePinterest = () => {
    const description = `${product.name} - ${product.category || 'Kenyan Garments'} (${priceDisplay}) | Tewaw Enterprise`;
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productShareUrl)}&media=${encodeURIComponent(product.imageUrl)}&description=${encodeURIComponent(description)}`,
      '_blank'
    );
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productShareUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    const text = `Check out ${product.name} (${priceDisplay}) manufactured by @TewawEnterprise Kenya! 🧵🇰🇪`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productShareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    const text = `🔥 ${product.name} - ${priceDisplay} | Tewaw Enterprise Kenya`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(productShareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = `${product.name} - Tewaw Enterprise Kenya`;
    const body = `Hi,\n\nI thought you would like this product from Tewaw Enterprise:\n\nProduct: ${product.name}\nCategory: ${product.category || 'Apparel'}\nPrice: ${priceDisplay}\n\nView Product & High-Res Image:\n${productShareUrl}\n\nDirect Photo Link:\n${product.imageUrl}\n\nBest regards!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-green text-white flex items-center justify-center shadow-md shadow-brand-green/30">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 id="share-modal-title" className="text-sm sm:text-base font-display font-black text-brand-blue uppercase tracking-tight">
                  Share Product & Image
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Send this creation with image preview
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
              aria-label="Close Share Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Product Preview Card */}
            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5 shadow-2xs">
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
                <img
                  referrerPolicy="no-referrer"
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                  }}
                />
                <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                  HD
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block text-[9px] font-black text-brand-green uppercase tracking-wider mb-0.5">
                  {product.category || 'Factory Gear'}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-brand-blue leading-tight truncate uppercase">
                  {product.name}
                </h4>
                <p className="text-xs font-mono font-black text-slate-800 mt-1">
                  {priceDisplay}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  Kenyan Crafted • Premium Cotton & Synthetic Fabrics
                </p>
              </div>
            </div>

            {/* Main Primary Share CTA: Native Device Share / Quick WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isSharingDevice}
                className="py-3.5 px-4 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl font-black uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/25 hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
              >
                <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                {isSharingDevice ? 'Opening Share...' : 'Device Share (Image)'}
              </button>

              <button
                type="button"
                onClick={shareWhatsApp}
                className="py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl font-black uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Share to WhatsApp
              </button>
            </div>

            {/* Social Channels Row */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Share To Social Platforms
              </p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {/* Pinterest */}
                <button
                  type="button"
                  onClick={sharePinterest}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 transition-all group focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  title="Pin Product Image on Pinterest"
                  aria-label="Share on Pinterest"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="font-serif font-black text-sm">P</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-1">Pinterest</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={shareFacebook}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 transition-all group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="font-black text-sm">f</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-1">Facebook</span>
                </button>

                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={shareTwitter}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300/60 transition-all group focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="font-black text-xs">𝕏</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-1">X / Post</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={shareTelegram}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/60 transition-all group focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                  title="Share on Telegram"
                  aria-label="Share on Telegram"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-1">Telegram</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={shareEmail}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/60 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  title="Email product link and image"
                  aria-label="Share via Email"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-1">Email</span>
                </button>
              </div>
            </div>

            {/* Direct Copy & Image Tools */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* Copy Product Link Box */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Direct Product Web Link
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={productShareUrl}
                    className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-600 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all",
                      copiedLink 
                        ? "bg-brand-green text-white" 
                        : "bg-white border border-slate-200 hover:bg-slate-100 text-brand-blue shadow-2xs"
                    )}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extra Image Operations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-brand-green" />
                  {isDownloading ? 'Saving...' : 'Save Image'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyImageLink}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedImageLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-green" /> Link Copied
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-brand-blue" /> Image URL
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 col-span-2 sm:col-span-1"
                >
                  <QrCode className="w-3.5 h-3.5 text-brand-orange" />
                  {showQrCode ? 'Hide QR' : 'Show QR'}
                </button>
              </div>

              {/* Collapsible QR Code view */}
              <AnimatePresence>
                {showQrCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productShareUrl)}`}
                      alt="Product QR Code"
                      className="w-32 h-32 rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
                    />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                      Scan to view product on mobile
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Tewaw Enterprise Limited</span>
            <span>Nairobi, Kenya 🇰🇪</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
