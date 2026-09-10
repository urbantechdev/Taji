export interface Product {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  price: number;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  isFeatured?: boolean;
  model3dUrl?: string;
  linkUrl?: string;
  colors?: string[];
  variants?: Array<{ name: string; type: string; price?: number }>;
  brand?: string;
  sku?: string;
  gtin?: string;
  mpn?: string;
  condition?: 'new' | 'refurbished' | 'used';
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
  googleProductCategory?: string;
}

export const COLOR_HEX_MAP: Record<string, string> = {
  'Navy Blue': '#1e3a8a',
  'Navy': '#1e3a8a',
  'Black': '#0f172a',
  'Royal Blue': '#2563eb',
  'Sky Blue': '#38bdf8',
  'Red': '#dc2626',
  'Heather Grey': '#94a3b8',
  'Grey': '#64748b',
  'Charcoal': '#334155',
  'Bottle Green': '#14532d',
  'Jungle Green': '#3f6212',
  'Olive': '#4d7c0f',
  'White': '#ffffff',
  'Yellow': '#eab308',
  'Orange': '#f97316',
  'Maroon': '#831843',
  'Khaki': '#d97706',
  'Beige': '#fde68a',
  'Pink': '#ec4899',
  'Purple': '#7e22ce',
  'Red/Blue': 'linear-gradient(135deg, #dc2626 50%, #1e3a8a 50%)',
  'Red/Black': 'linear-gradient(135deg, #dc2626 50%, #0f172a 50%)',
  'Blue/Yellow': 'linear-gradient(135deg, #2563eb 50%, #eab308 50%)',
  'Green/Red': 'linear-gradient(135deg, #14532d 50%, #dc2626 50%)',
  'Purple/Black': 'linear-gradient(135deg, #7e22ce 50%, #0f172a 50%)'
};

export function getColorHex(colorName: string): string {
  const normalized = String(colorName).trim();
  return COLOR_HEX_MAP[normalized] || '#94a3b8';
}

export const PRICE_DISCLAIMER_NOTE = "Please note that the price may vary depending on the design, branding and level of customization.";

export function formatPriceDisplay(product: any): string {
  if (!product) return 'Price on Enquiry';
  
  // Explicit price range string
  if (product.priceRange && String(product.priceRange).trim() !== '') {
    const range = String(product.priceRange).trim();
    if (range.toLowerCase().startsWith('kes') || range.toLowerCase().includes('enquiry')) {
      return range;
    }
    return `KES ${range}`;
  }

  // Fallback numeric price
  if (product.price && Number(product.price) > 0) {
    return `KES ${Number(product.price).toLocaleString()}`;
  }

  return 'Price on Enquiry';
}

export const PLACEHOLDER_PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Crect x='80' y='80' width='240' height='240' rx='24' fill='%23e2e8f0'/%3E%3Cpath d='M140 240l35-45 45 55 35-40 55 70H90l50-40z' fill='%23cbd5e1'/%3E%3Ccircle cx='150' cy='150' r='20' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='82%25' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='15' font-weight='700'%3ETewaw Enterprise%3C/text%3E%3C/svg%3E";

// Zero mock/stock products - retain only user-uploaded products
export const DEFAULT_PRODUCTS: Product[] = [];

export { getProductSku, copySkuToClipboard, generateProductSku, formatVariantSku } from '../utils/sku';
