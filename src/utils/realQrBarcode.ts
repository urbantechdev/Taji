import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { ProductBatch } from '../types';

export interface BarcodeRenderOptions {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

export async function generateRealQRCodeDataURL(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    return await QRCode.toDataURL(text.trim(), {
      width: options?.width || 256,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      color: options?.color || {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate real QR Code Data URL:', err);
    return '';
  }
}

export function generateRealBarcodeDataURL(
  text: string,
  options?: BarcodeRenderOptions
): string {
  if (!text || !text.trim()) return '';
  const cleanText = text.trim();

  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    const requestedFormat = (options?.format || 'CODE128').toUpperCase();

    // If EAN13 is requested, check if text is 12 or 13 digits; otherwise fallback to CODE128
    const formatToUse = requestedFormat === 'EAN13' && !/^\d{12,13}$/.test(cleanText)
      ? 'CODE128'
      : requestedFormat;

    JsBarcode(canvas, cleanText, {
      format: formatToUse as any,
      width: options?.width || 2,
      height: options?.height || 50,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize || 12,
      margin: options?.margin ?? 8,
      background: options?.background || '#ffffff',
      lineColor: options?.lineColor || '#000000'
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    // If specific format failed, try once more with CODE128
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, cleanText, {
        format: 'CODE128',
        width: options?.width || 2,
        height: options?.height || 50,
        displayValue: options?.displayValue ?? true,
        fontSize: options?.fontSize || 12,
        margin: options?.margin ?? 8,
        background: options?.background || '#ffffff',
        lineColor: options?.lineColor || '#000000'
      });
      return canvas.toDataURL('image/png');
    } catch (fallbackErr) {
      console.error('Failed to generate real Barcode Data URL:', fallbackErr);
      return '';
    }
  }
}

export async function generateReceiptQRDataURL(
  receiptNumber: string,
  taxPin: string = 'P051982341Z',
  grandTotal: number = 0
): Promise<string> {
  const cleanReceipt = (receiptNumber || 'REC-PENDING').trim();
  const verifyUrl = `https://itax.kra.go.ke/KRA-Portal/invoiceVerification.htm?invoiceNo=${encodeURIComponent(cleanReceipt)}&pin=${encodeURIComponent(taxPin)}&amount=${grandTotal}`;
  return generateRealQRCodeDataURL(verifyUrl, { width: 280, margin: 1, errorCorrectionLevel: 'M' });
}

export function generateReceiptBarcodeDataURL(
  code: string,
  options?: BarcodeRenderOptions
): string {
  return generateRealBarcodeDataURL(code || 'REC-PENDING', {
    format: 'CODE128',
    width: options?.width || 2,
    height: options?.height || 45,
    displayValue: options?.displayValue ?? true,
    fontSize: options?.fontSize || 10,
    margin: options?.margin ?? 6
  });
}

export function buildProductQRPayload(product: ProductBatch): string {
  const lotSku = (product.dyeLot || product.sku || '').trim();
  const payloadObj = {
    id: product.id,
    sku: lotSku,
    name: product.name,
    category: product.category,
    colorName: product.colorName,
    unit: product.unit,
    priceRetail: product.unitPriceRetail,
    priceBulk: product.unitPriceBulk,
    barcode: product.barcode || lotSku,
    shadeCode: product.shadeCode,
    dyeLot: lotSku,
    yarnCount: product.yarnCount,
    bagNumber: product.bagNumber
  };
  return JSON.stringify(payloadObj);
}
