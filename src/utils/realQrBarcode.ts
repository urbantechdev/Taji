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
  try {
    return await QRCode.toDataURL(text, {
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
  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: (options?.format as any) || 'CODE128',
      width: options?.width || 2,
      height: options?.height || 50,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize || 12,
      margin: options?.margin ?? 10,
      background: options?.background || '#ffffff',
      lineColor: options?.lineColor || '#000000'
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate real Barcode Data URL:', err);
    return '';
  }
}

export function buildProductQRPayload(product: ProductBatch): string {
  const payloadObj = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    colorName: product.colorName,
    unit: product.unit,
    priceRetail: product.unitPriceRetail,
    priceBulk: product.unitPriceBulk,
    barcode: product.barcode,
    shadeCode: product.shadeCode,
    dyeLot: product.dyeLot,
    yarnCount: product.yarnCount,
    bagNumber: product.bagNumber
  };
  return JSON.stringify(payloadObj);
}
