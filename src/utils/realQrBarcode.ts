import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { ProductBatch } from '../types';

// In-memory cache for rendered QR data URLs to ensure snappy instant rendering
const qrCodeCache = new Map<string, string>();
const barcodeCache = new Map<string, string>();

/**
 * Builds standard, scannable QR payload for a textile product batch.
 * Can be decoded by standard phone cameras, POS scanners, and in-app scanners.
 */
export function buildProductQRPayload(product: ProductBatch): string {
  if (product.qrCodeData) {
    return product.qrCodeData;
  }
  return JSON.stringify({
    app: 'TAJI-ERP',
    batch: product.id,
    sku: product.sku,
    barcode: product.barcode || product.sku,
    name: product.name,
    cat: product.category,
    color: product.colorName,
    unitPrice: product.unitPriceRetail,
    unit: product.unit
  });
}

/**
 * Generates an authentic, scan-compliant QR Code PNG data URL using standard Reed-Solomon encoding.
 */
export async function generateRealQRCodeDataURL(
  payload: string | ProductBatch,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  const text = typeof payload === 'string' ? payload : buildProductQRPayload(payload);
  const cacheKey = `${text}_${options?.width || 256}_${options?.darkColor || '#000000'}_${options?.lightColor || '#FFFFFF'}_${options?.errorCorrectionLevel || 'M'}`;

  if (qrCodeCache.has(cacheKey)) {
    return qrCodeCache.get(cacheKey)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      margin: options?.margin ?? 2,
      width: options?.width ?? 256,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#FFFFFF'
      }
    });

    qrCodeCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate authentic QR code:', err);
    // Fallback simple QR generation for direct SKU/text
    return '';
  }
}

/**
 * Generates an authentic, scan-compliant 1D Code-128 / EAN barcode PNG data URL using JsBarcode.
 */
export function generateRealBarcodeDataURL(
  code: string,
  options?: {
    format?: 'CODE128' | 'EAN13' | 'CODE39' | 'ITF' | 'pharmacode';
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    lineColor?: string;
    background?: string;
    margin?: number;
  }
): string {
  const cleanCode = (code || 'SKU-0000').trim().toUpperCase();
  const format = options?.format || 'CODE128';
  const cacheKey = `${cleanCode}_${format}_${options?.width || 2}_${options?.height || 50}_${options?.displayValue !== false}_${options?.fontSize || 12}`;

  if (barcodeCache.has(cacheKey)) {
    return barcodeCache.get(cacheKey)!;
  }

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, cleanCode, {
      format: format,
      width: options?.width ?? 2,
      height: options?.height ?? 50,
      displayValue: options?.displayValue ?? true,
      font: 'monospace',
      fontSize: options?.fontSize ?? 13,
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 3,
      background: options?.background || '#FFFFFF',
      lineColor: options?.lineColor || '#000000',
      margin: options?.margin ?? 6
    });

    const dataUrl = canvas.toDataURL('image/png');
    barcodeCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn(`JsBarcode failed for format ${format} with code "${cleanCode}", falling back to CODE128:`, err);
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, cleanCode, {
        format: 'CODE128',
        width: options?.width ?? 2,
        height: options?.height ?? 50,
        displayValue: options?.displayValue ?? true,
        background: '#FFFFFF',
        lineColor: '#000000'
      });
      const dataUrl = canvas.toDataURL('image/png');
      barcodeCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (e2) {
      console.error('Final fallback barcode creation failed:', e2);
      return '';
    }
  }
}
