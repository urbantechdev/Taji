/**
 * Google Merchant Center & Schema.org Structured Data Helper
 * Generates valid JSON-LD metadata and Google Merchant Center RSS 2.0 / XML feed items.
 */

export interface GoogleMerchantProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceRange?: string;
  category?: string;
  imageUrl?: string;
  additionalImages?: string[];
  colors?: string[];
  variants?: Array<{ name: string; type: string; price?: number }>;
  brand?: string;
  sku?: string;
  gtin?: string;
  mpn?: string;
  condition?: 'new' | 'refurbished' | 'used';
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
  googleProductCategory?: string;
  linkUrl?: string;
  updatedAt?: string;
  createdAt?: string;
}

export const DEFAULT_BRAND = "Tewaw Enterprise";
export const DEFAULT_CURRENCY = "KES";
export const DEFAULT_COUNTRY = "KE";
export const DEFAULT_GOOGLE_PRODUCT_CATEGORY = "Apparel & Accessories > Clothing";

/**
 * Generates Schema.org/Product JSON-LD structure compliant with Google Rich Results
 */
export function generateProductJsonLd(product: GoogleMerchantProduct, origin: string = 'https://tewaw.com') {
  if (!product) return null;

  const productUrl = `${origin}/product/${product.id}`;
  const priceVal = Number(product.price) || 0;
  const inStock = product.availability !== 'out_of_stock';

  const imageList = [
    product.imageUrl,
    ...(product.additionalImages || [])
  ].filter((img): img is string => typeof img === 'string' && img.trim().length > 0);

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    "name": product.name,
    "image": imageList.length > 0 ? imageList : [`${origin}/logo.png`],
    "description": product.description || `Premium custom-crafted ${product.name} by Tewaw Enterprise Nairobi, Kenya.`,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || DEFAULT_BRAND
    },
    "category": product.category || "Apparel",
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": DEFAULT_CURRENCY,
      "price": priceVal > 0 ? priceVal.toFixed(2) : "1.00",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": product.condition === 'used' 
        ? "https://schema.org/UsedCondition" 
        : product.condition === 'refurbished' 
          ? "https://schema.org/RefurbishedCondition" 
          : "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": DEFAULT_BRAND,
        "url": origin
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "KE",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": DEFAULT_CURRENCY
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "KE"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 4,
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  if (product.gtin) {
    jsonLd.gtin = product.gtin;
  }
  if (product.mpn) {
    jsonLd.mpn = product.mpn;
  }
  if (product.colors && product.colors.length > 0) {
    jsonLd.color = product.colors.join(', ');
  }

  return jsonLd;
}

/**
 * Escapes special XML characters for RSS / XML feeds
 */
export function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an XML item entry conforming to Google Merchant Center RSS 2.0 specs
 */
export function generateMerchantFeedItem(product: GoogleMerchantProduct, origin: string = 'https://tewaw.com'): string {
  const id = escapeXml(product.id);
  const title = escapeXml(product.name);
  const description = escapeXml(
    product.description || `High-quality ${product.name} manufactured by Tewaw Enterprise Nairobi Kenya.`
  );
  const link = escapeXml(`${origin}/product/${product.id}`);
  const imageLink = escapeXml(product.imageUrl || `${origin}/logo.png`);
  
  const additionalImages = (product.additionalImages || [])
    .filter(Boolean)
    .slice(0, 10)
    .map(img => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
    .join('\n');

  const priceVal = Number(product.price) || 0;
  const priceFormatted = `${priceVal.toFixed(2)} ${DEFAULT_CURRENCY}`;
  const availability = product.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
  const brand = escapeXml(product.brand || DEFAULT_BRAND);
  const condition = product.condition || 'new';
  const category = escapeXml(product.googleProductCategory || DEFAULT_GOOGLE_PRODUCT_CATEGORY);
  const productType = escapeXml(product.category || 'Apparel');

  const colors = product.colors && product.colors.length > 0
    ? `    <g:color>${escapeXml(product.colors.join('/'))}</g:color>\n`
    : '';

  const sizes = (product.variants || [])
    .filter(v => v.type === 'Size')
    .map(v => v.name)
    .join('/');
  const sizeTag = sizes ? `    <g:size>${escapeXml(sizes)}</g:size>\n` : '';

  const gtinTag = product.gtin ? `    <g:gtin>${escapeXml(product.gtin)}</g:gtin>\n` : '';
  const mpnTag = product.mpn ? `    <g:mpn>${escapeXml(product.mpn)}</g:mpn>\n` : '';
  const identifierExists = product.gtin || product.mpn ? 'yes' : 'no';

  return `  <item>
    <g:id>${id}</g:id>
    <g:title>${title}</g:title>
    <g:description>${description}</g:description>
    <g:link>${link}</g:link>
    <g:image_link>${imageLink}</g:image_link>
${additionalImages ? additionalImages + '\n' : ''}    <g:condition>${condition}</g:condition>
    <g:availability>${availability}</g:availability>
    <g:price>${priceFormatted}</g:price>
    <g:brand>${brand}</g:brand>
    <g:google_product_category>${category}</g:google_product_category>
    <g:product_type>${productType}</g:product_type>
${colors}${sizeTag}${gtinTag}${mpnTag}    <g:identifier_exists>${identifierExists}</g:identifier_exists>
    <g:shipping>
      <g:country>KE</g:country>
      <g:service>Standard Courier</g:service>
      <g:price>0.00 KES</g:price>
    </g:shipping>
  </item>`;
}
