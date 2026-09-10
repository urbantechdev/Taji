/**
 * SKU (Stock Keeping Unit) generation and formatting utilities for Tewaw Enterprise.
 * Standards:
 * Prefix: TEW
 * Category Codes:
 *   - APP: Modern Apparel (T-Shirts, Hoodies, Polos, Sweatshirts)
 *   - UNI: Workwear, Security & Corporate Uniforms
 *   - HRT: Kenyan Heritage, Maasai Shukas, Kikoys
 *   - SCH: School Uniforms, Sweaters, Dresses
 *   - SEC: Security & Protective Gear
 *   - ACC: Accessories, Caps, Bags, Shukas
 *   - GAR: General Garments / Custom Orders
 */

export const CATEGORY_SKU_CODES: Record<string, string> = {
  'apparel': 'APP',
  'modern apparel': 'APP',
  't-shirt': 'APP',
  'hoodie': 'APP',
  'polo': 'APP',
  'sweatshirt': 'APP',
  'uniforms': 'UNI',
  'workwear': 'UNI',
  'workwear & security': 'UNI',
  'security & field uniforms': 'SEC',
  'security': 'SEC',
  'heritage': 'HRT',
  'kenyan heritage': 'HRT',
  'maasai': 'HRT',
  'shuka': 'HRT',
  'school': 'SCH',
  'school uniforms': 'SCH',
  'corporate': 'COR',
  'corporate & school uniforms': 'COR',
  'accessories': 'ACC',
  'overalls': 'UNI',
  'dustcoat': 'UNI',
  'lab coat': 'UNI',
  'apron': 'UNI',
  'scrubs': 'UNI'
};

/**
 * Returns a 3-letter category code for SKU generation
 */
export function getCategorySkuCode(category?: string): string {
  if (!category) return 'GAR';
  const norm = category.toLowerCase().trim();
  
  for (const [key, code] of Object.entries(CATEGORY_SKU_CODES)) {
    if (norm === key || norm.includes(key)) {
      return code;
    }
  }
  
  // Extract first 3 consonant-heavy letters if unrecognized
  const letters = norm.replace(/[^a-z]/g, '').toUpperCase();
  return letters.slice(0, 3) || 'GAR';
}

/**
 * Converts a string or number into a short, safe alphanumeric hash
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return (positive % 900 + 100).toString(); // Always 3 digits: 100-999
}

/**
 * Generates a standard SKU for a product.
 * Example: TEW-APP-102 or TEW-UNI-045
 */
export function generateProductSku(product: { id?: string; name?: string; category?: string }): string {
  const catCode = getCategorySkuCode(product.category);
  const nameBase = (product.name || '').trim();
  const idBase = (product.id || '').trim();
  
  // Generate a distinct 3-digit code
  const seed = `${nameBase}-${idBase}`;
  const code = hashString(seed || 'item');
  
  return `TEW-${catCode}-${code}`;
}

/**
 * Formats variant-level SKU with size and color codes.
 * Example: TEW-APP-102-XL-NVY
 */
export function formatVariantSku(baseSku: string, options?: { size?: string; color?: string }): string {
  if (!baseSku) return '';
  let result = baseSku.trim().toUpperCase();

  if (options?.size && options.size.trim() !== '') {
    const cleanSize = options.size.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanSize) result += `-${cleanSize}`;
  }

  if (options?.color && options.color.trim() !== '') {
    const cleanColor = options.color.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const colorCode = cleanColor.length <= 4 ? cleanColor : cleanColor.slice(0, 3);
    if (colorCode) result += `-${colorCode}`;
  }

  return result;
}

/**
 * Resolves the final SKU for any product object.
 * If product.sku exists and is valid, returns it; otherwise auto-generates a standard SKU.
 */
export function getProductSku(product?: any): string {
  if (!product) return 'TEW-GAR-000';
  
  if (product.sku && typeof product.sku === 'string' && product.sku.trim().length > 0) {
    return product.sku.trim().toUpperCase();
  }
  
  return generateProductSku({
    id: product.id,
    name: product.name,
    category: product.category
  });
}

/**
 * Copies SKU text to clipboard with browser fallback
 */
export async function copySkuToClipboard(sku: string): Promise<boolean> {
  if (!sku) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(sku);
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = sku;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.debug('Failed to copy SKU:', err);
    return false;
  }
}
