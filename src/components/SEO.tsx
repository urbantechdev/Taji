import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  schema?: Record<string, any>;
  breadcrumbs?: BreadcrumbItem[];
  noindex?: boolean;
}

export default function SEO({
  title,
  description = "Elite Kenyan garment manufacturing specialising in high-quality cotton apparel, security & field uniforms, school uniforms, and corporate branding. Located at Uhuru Market, Jagoo Lane, Nairobi, Kenya.",
  keywords = "Tewaw, Tewaw Enterprise, tewaw.com, garment manufacturer Kenya, school uniforms Nairobi, corporate uniforms, industrial overalls, security apparel Kenya, DTF printing Nairobi, fleece hoodies Kenya",
  canonical,
  ogType = "website",
  ogImage = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1200",
  schema,
  breadcrumbs,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Determine Canonical URL mapped to tewaw.com
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const resolvedCanonical = canonical || `https://tewaw.com${currentPath === '/' ? '' : currentPath}`;

    // Update Title
    const fullTitle = title.includes('Tewaw') ? title : `${title} | Tewaw Enterprise Kenya`;
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Primary Meta
    setMetaTag('meta[name="google-site-verification"]', 'name', 'google-site-verification', 'google51773db1bffc7ca6');
    setMetaTag('meta[name="title"]', 'name', 'title', fullTitle);
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // Robots meta tag for Google and Bing
    const robotsContent = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);
    setMetaTag('meta[name="googlebot"]', 'name', 'googlebot', robotsContent);
    setMetaTag('meta[name="bingbot"]', 'name', 'bingbot', robotsContent);

    // Geo tags
    setMetaTag('meta[name="geo.region"]', 'name', 'geo.region', 'KE-30');
    setMetaTag('meta[name="geo.placename"]', 'name', 'geo.placename', 'Nairobi');
    setMetaTag('meta[name="geo.position"]', 'name', 'geo.position', '-1.286389;36.817223');
    setMetaTag('meta[name="ICBM"]', 'name', 'ICBM', '-1.286389, 36.817223');

    // OpenGraph
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Tewaw Enterprise');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', ogImage);
    setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', fullTitle);
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', resolvedCanonical);
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_KE');

    // Twitter Card
    setMetaTag('meta[property="twitter:card"]', 'property', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', fullTitle);
    setMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', description);
    setMetaTag('meta[property="twitter:image"]', 'property', 'twitter:image', ogImage);
    setMetaTag('meta[property="twitter:image:alt"]', 'property', 'twitter:image:alt', fullTitle);
    setMetaTag('meta[property="twitter:url"]', 'property', 'twitter:url', resolvedCanonical);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', resolvedCanonical);

    // Prepare JSON-LD schemas
    const schemasToInject: Record<string, any>[] = [];

    if (schema) {
      schemasToInject.push(schema);
    }

    // Generate BreadcrumbList Schema if provided or derived from subpath
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url.startsWith('http') ? crumb.url : `https://tewaw.com${crumb.url}`,
        })),
      });
    } else if (currentPath !== '/') {
      // Automatic breadcrumb fallback
      const pathSegments = currentPath.split('/').filter(Boolean);
      const autoCrumbs = [
        { name: 'Home', url: 'https://tewaw.com/' },
        ...pathSegments.map((segment, idx) => ({
          name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          url: `https://tewaw.com/${pathSegments.slice(0, idx + 1).join('/')}`,
        })),
      ];
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: autoCrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      });
    }

    // Dynamic JSON-LD Script tag in DOM
    let schemaScript = document.getElementById('dynamic-json-ld-schema') as HTMLScriptElement | null;
    if (schemasToInject.length > 0) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-json-ld-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(
        schemasToInject.length === 1 ? schemasToInject[0] : { '@context': 'https://schema.org', '@graph': schemasToInject }
      );
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [title, description, keywords, canonical, ogType, ogImage, schema, breadcrumbs, noindex]);

  return null;
}

