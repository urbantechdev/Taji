import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safely get Firestore instance with lazy initialization
let dbInstance: any = null;
function getDb() {
  if (!dbInstance) {
    try {
      let firebaseConfig: any = {};
      const configPath = path.join(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } else if (process.env.FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      }
      if (firebaseConfig && (firebaseConfig.projectId || firebaseConfig.apiKey)) {
        const appFirebase = initializeApp(firebaseConfig);
        dbInstance = firebaseConfig.firestoreDatabaseId 
          ? getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId)
          : getFirestore(appFirebase);
      }
    } catch (e) {
      console.warn('Firebase server initialization warning:', e);
    }
  }
  return dbInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Route: Dispatch ticket notification email to feminiholdings@gmail.com
  app.post('/api/tickets/notify', async (req, res) => {
    try {
      const {
        ticketId = 'TK-' + Math.floor(10000 + Math.random() * 90000),
        customerName = 'Valued Customer',
        customerEmail = '',
        customerPhone = '',
        companyName = '',
        subject = 'New Customer Inquiry',
        message = '',
        category = 'General Inquiry',
        priority = 'medium',
        source = 'Website Contact Form',
        totalAmount,
      } = req.body || {};

      const targetEmail = process.env.NOTIFICATION_EMAIL || 'feminiholdings@gmail.com';
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const adminTicketUrl = `${appUrl}/admin/tickets`;

      const priorityColors: Record<string, { bg: string; text: string }> = {
        urgent: { bg: '#fee2e2', text: '#b91c1c' },
        high: { bg: '#ffedd5', text: '#c2410c' },
        medium: { bg: '#fef3c7', text: '#b45309' },
        low: { bg: '#f1f5f9', text: '#475569' },
      };
      const pColor = priorityColors[priority.toLowerCase()] || priorityColors.medium;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0B2545; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 24px; }
    .ticket-badge { display: inline-block; background: #22C55E; color: #052e16; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }
    .meta-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .meta-row:last-child { border-bottom: none; }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-value { color: #0f172a; font-weight: 700; text-align: right; }
    .message-card { background: #ffffff; border-left: 4px solid #22C55E; padding: 16px; border-radius: 8px; margin: 20px 0; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .message-text { font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin: 0; }
    .cta-row { text-align: center; margin: 28px 0 12px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #0B2545; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; margin: 4px; }
    .btn-green { background: #22C55E; color: #ffffff !important; }
    .footer { padding: 16px 24px; background: #f1f5f9; font-size: 11px; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TEWAW ENTERPRISE</h1>
      <p>Customer Support & Inquiries Notification</p>
    </div>
    <div class="body">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="ticket-badge">Ticket ${escapeHtml(ticketId)}</span>
        <span style="background: ${pColor.bg}; color: ${pColor.text}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase;">
          ${escapeHtml(priority)} Priority
        </span>
      </div>

      <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #0f172a;">${escapeHtml(subject)}</h2>

      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Customer Name:</span>
          <span class="meta-value">${escapeHtml(customerName)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Email:</span>
          <span class="meta-value"><a href="mailto:${escapeHtml(customerEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(customerEmail)}</a></span>
        </div>
        ${customerPhone ? `
        <div class="meta-row">
          <span class="meta-label">Phone / WhatsApp:</span>
          <span class="meta-value"><a href="tel:${escapeHtml(customerPhone)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(customerPhone)}</a></span>
        </div>` : ''}
        ${companyName ? `
        <div class="meta-row">
          <span class="meta-label">Company / Org:</span>
          <span class="meta-value">${escapeHtml(companyName)}</span>
        </div>` : ''}
        <div class="meta-row">
          <span class="meta-label">Inquiry Category:</span>
          <span class="meta-value">${escapeHtml(category)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Source Channel:</span>
          <span class="meta-value">${escapeHtml(source)}</span>
        </div>
        ${totalAmount ? `
        <div class="meta-row">
          <span class="meta-label">Estimated Value:</span>
          <span class="meta-value" style="color: #059669;">KES ${Number(totalAmount).toLocaleString()}</span>
        </div>` : ''}
      </div>

      <p style="font-size: 13px; font-weight: 700; color: #475569; margin: 16px 0 6px 0;">Customer Message / Specifications:</p>
      <div class="message-card">
        <p class="message-text">${escapeHtml(message || 'No additional details provided.')}</p>
      </div>

      <div class="cta-row">
        <a href="${adminTicketUrl}" class="btn">View in Admin Portal</a>
        ${customerEmail ? `<a href="mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(`RE: [${ticketId}] ${subject}`)}" class="btn btn-green">Reply to Customer</a>` : ''}
      </div>
    </div>
    <div class="footer">
      Automated dispatch from Tewaw Enterprise Nairobi Helpdesk System &bull; Received ${new Date().toUTCString()}
    </div>
  </div>
</body>
</html>
`;

      const textContent = `
[NEW SUPPORT TICKET: ${ticketId}]
Priority: ${priority.toUpperCase()}
Category: ${category}
Subject: ${subject}

Customer Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone || 'N/A'}
Company: ${companyName || 'N/A'}
Source: ${source}

Message / Details:
${message}

View in Admin: ${adminTicketUrl}
`;

      // Dispatch via SMTP if configured
      let emailSent = false;
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || `Tewaw Support <${process.env.SMTP_USER}>`,
            to: targetEmail,
            replyTo: customerEmail || undefined,
            subject: `[${ticketId}] ${priority === 'urgent' ? '🚨 URGENT: ' : ''}${subject} - From ${customerName}`,
            text: textContent,
            html: htmlContent,
          });
          emailSent = true;
          console.log(`Email notification successfully sent for ticket ${ticketId} to ${targetEmail}`);
        } catch (mailErr) {
          console.warn('SMTP delivery notice (falling back to ticket logger):', mailErr);
        }
      } else {
        console.log(`[TICKET NOTIFICATION DISPATCHED] Ticket ${ticketId} raised by ${customerName} (${customerEmail}) -> Target: ${targetEmail}`);
      }

      res.status(200).json({
        success: true,
        ticketId,
        targetEmail,
        emailSent,
        message: 'Ticket recorded and email dispatched.',
      });
    } catch (err: any) {
      console.error('Error handling /api/tickets/notify:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to dispatch ticket notification' });
    }
  });

  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist'), {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (!filePath.endsWith('.html') && filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      }
    }));
  }

  // Serve Dynamic Sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const host = req.get('host') || 'tewaw.com';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;

      let dynamicUrls = '';
      try {
        const firestore = getDb();
        if (firestore) {
          // Fetch all products from Firestore to index them dynamically
          const productsRef = collection(firestore, 'products');
          const productsSnap = await getDocs(productsRef);
          productsSnap.forEach((doc) => {
            const product = doc.data();
            if (product.isDeleted) return;
            const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString();
            dynamicUrls += `
  <url>
    <loc>${baseUrl}/product/${doc.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          });
        }
      } catch (e) {
        console.error('Error getting products for dynamic sitemap:', e);
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/gallery</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/strengths</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>${dynamicUrls}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (e) {
      console.error('Sitemap rendering error:', e);
      res.status(500).end();
    }
  });

  // Google Merchant Center XML Feed Generator (/google-merchant-feed.xml & /api/merchant-feed.xml)
  app.get(['/google-merchant-feed.xml', '/api/merchant-feed.xml', '/merchant-feed.xml'], async (req, res) => {
    try {
      const host = req.get('host') || 'tewaw.com';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const origin = `${protocol}://${host}`;

      let allProductsList: any[] = [];

      // 1. Fetch from Firestore
      try {
        const firestore = getDb();
        if (firestore) {
          const productsRef = collection(firestore, 'products');
          const productsSnap = await getDocs(productsRef);
          productsSnap.forEach((d) => {
            const p = d.data();
            if (!p.isDeleted) {
              allProductsList.push({ id: d.id, ...p });
            }
          });
        }
      } catch (err) {
        console.warn('Firestore fetch for merchant feed:', err);
      }

      // 2. Supplement with default products if empty
      if (allProductsList.length === 0) {
        try {
          const defaultModule = await import('./src/data/defaultProducts.ts');
          if (Array.isArray(defaultModule.DEFAULT_PRODUCTS)) {
            allProductsList = [...defaultModule.DEFAULT_PRODUCTS];
          }
        } catch (err) {
          console.error('Error importing default products for feed:', err);
        }
      }

      // Build XML items
      const xmlItems = allProductsList.map((product) => {
        const id = escapeHtml(product.id);
        const title = escapeHtml(product.name || 'Custom Garment');
        const description = escapeHtml(
          product.description || `Premium quality ${product.name} custom manufactured by Tewaw Enterprise Nairobi Kenya.`
        );
        const link = escapeHtml(`${origin}/product/${product.id}`);
        const imageLink = escapeHtml(product.imageUrl || `${origin}/logo.png`);
        
        const additionalImages = (product.additionalImages || [])
          .filter(Boolean)
          .slice(0, 10)
          .map((img: string) => `    <g:additional_image_link>${escapeHtml(img)}</g:additional_image_link>`)
          .join('\n');

        const priceVal = Number(product.price) || 0;
        const priceFormatted = `${priceVal > 0 ? priceVal.toFixed(2) : '1.00'} KES`;
        const availability = product.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
        const brand = escapeHtml(product.brand || 'Tewaw Enterprise');
        const condition = product.condition || 'new';
        const category = escapeHtml(product.googleProductCategory || 'Apparel &amp; Accessories &gt; Clothing');
        const productType = escapeHtml(product.category || 'Apparel');

        const colors = product.colors && product.colors.length > 0
          ? `    <g:color>${escapeHtml(product.colors.join('/'))}</g:color>\n`
          : '';

        const sizes = (product.variants || [])
          .filter((v: any) => v.type === 'Size')
          .map((v: any) => v.name)
          .join('/');
        const sizeTag = sizes ? `    <g:size>${escapeHtml(sizes)}</g:size>\n` : '';

        const gtinTag = product.gtin ? `    <g:gtin>${escapeHtml(product.gtin)}</g:gtin>\n` : '';
        const mpnTag = product.mpn ? `    <g:mpn>${escapeHtml(product.mpn)}</g:mpn>\n` : '';
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
      <g:service>Standard Delivery</g:service>
      <g:price>0.00 KES</g:price>
    </g:shipping>
  </item>`;
      }).join('\n');

      const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tewaw Enterprise Product Feed</title>
    <link>${origin}</link>
    <description>Google Merchant Center Compliant XML Catalog for Tewaw Enterprise Apparel &amp; Uniforms</description>
${xmlItems}
  </channel>
</rss>`;

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xmlFeed);
    } catch (e: any) {
      console.error('Merchant feed generation error:', e);
      res.status(500).type('text/plain').send('Failed to generate merchant feed: ' + e.message);
    }
  });

  // Helper to escape HTML attribute values
  const escapeHtml = (str: string) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper to fetch product data from Firebase Firestore or fallback
  const getProductData = async (productId: string) => {
    let productData: any = null;

    // 1. Fetch from Firebase Firestore
    try {
      const firestore = getDb();
      if (firestore) {
        const productRef = doc(firestore, 'products', productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          productData = { id: productSnap.id, ...productSnap.data() };
        }
      }
    } catch (e) {
      console.error(`Error querying Firebase Firestore for product ${productId}:`, e);
    }

    // 2. Fallback to default products if not found in Firestore
    if (!productData) {
      try {
        const defaultModule = await import('./src/data/defaultProducts.ts');
        const DEFAULT_PRODUCTS = defaultModule.DEFAULT_PRODUCTS;
        if (Array.isArray(DEFAULT_PRODUCTS)) {
          productData = DEFAULT_PRODUCTS.find((p: any) => 
            p.id === productId || String(p.id).toLowerCase() === String(productId).toLowerCase()
          );
        }
      } catch (e) {
        console.error('Error importing default products:', e);
      }
    }

    return productData;
  };

  // Handle Product Sharing Routes for SEO & Social Media Crawlers (/product/:id & /p/:id)
  app.get(['/product/:id', '/p/:id'], async (req, res, next) => {
    const productId = req.params.id;
    const host = req.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    
    try {
      const product = await getProductData(productId);

      let html = '';
      const isDev = process.env.NODE_ENV !== 'production';
      let filePath = isDev 
        ? path.join(__dirname, 'index.html') 
        : path.join(__dirname, 'dist', 'index.html');

      if (fs.existsSync(filePath)) {
        html = fs.readFileSync(filePath, 'utf-8');
      } else {
        html = '<!doctype html><html><head><meta charset="UTF-8"><script type="module" src="/src/main.tsx"></script></head><body><div id="root"></div></body></html>';
      }

      if (isDev && vite) {
        try {
          html = await vite.transformIndexHtml('/index.html', html);
        } catch (err) {
          console.warn('vite.transformIndexHtml failed for /product route:', err);
        }
      }

      if (product) {
        const formattedPrice = product.priceRange || (product.price ? `KSh ${Number(product.price).toLocaleString()}` : '');
        const rawTitle = `${product.name} | Tewaw Enterprise`;
        const rawDesc = product.description 
          ? `${product.description} ${formattedPrice ? `(${formattedPrice})` : ''}` 
          : `High quality ${product.name} from Tewaw Enterprise, Nairobi Kenya. ${formattedPrice}`;
        const rawImg = product.imageUrl || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1200';

        const title = escapeHtml(rawTitle);
        const desc = escapeHtml(rawDesc);
        const img = escapeHtml(rawImg);
        const url = escapeHtml(fullUrl);

        // Build Schema.org/Product structured data for Google Merchant / Rich Snippets
        const priceNum = Number(product.price) || 0;
        const inStock = product.availability !== 'out_of_stock';
        const imageGallery = [
          rawImg,
          ...(product.additionalImages || [])
        ].filter(Boolean);

        const schemaProduct = {
          "@context": "https://schema.org/",
          "@type": "Product",
          "@id": `${fullUrl}#product`,
          "name": product.name,
          "image": imageGallery,
          "description": product.description || `Premium custom-crafted ${product.name} by Tewaw Enterprise Nairobi, Kenya.`,
          "sku": product.sku || product.id,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Tewaw Enterprise"
          },
          "category": product.category || "Apparel",
          "offers": {
            "@type": "Offer",
            "url": fullUrl,
            "priceCurrency": "KES",
            "price": priceNum > 0 ? priceNum.toFixed(2) : "1.00",
            "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "itemCondition": product.condition === 'used' 
              ? "https://schema.org/UsedCondition" 
              : product.condition === 'refurbished' 
                ? "https://schema.org/RefurbishedCondition" 
                : "https://schema.org/NewCondition",
            "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Tewaw Enterprise",
              "url": `${protocol}://${host}`
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
                "currency": "KES"
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

        const dynamicMetaTags = `
    <!-- Dynamic Product Social Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${desc}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Tewaw Enterprise" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="product:price:amount" content="${product.price || ''}" />
    <meta property="product:price:currency" content="KES" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${img}" />
    <!-- Google Merchant Center / Schema.org Product Structured Data -->
    <script type="application/ld+json">
      ${JSON.stringify(schemaProduct, null, 2)}
    </script>
`;

        // Strip static default title and meta tags to avoid duplicate social tags
        html = html.replace(/<title>.*?<\/title>/gi, '');
        html = html.replace(/<meta\s+(?:name|property)="(?:og:|twitter:|title|description)[^"]*"\s+content="[^"]*"\s*\/?>/gi, '');

        // Inject dynamic meta tags before </head>
        html = html.replace('</head>', `${dynamicMetaTags}\n  </head>`);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      console.error('Error serving product route with dynamic meta tags:', e);
      serveHtmlPage('index.html', req, res);
    }
  });

  // Safe helper to render HTML files without 500 server errors
  const serveHtmlPage = async (htmlFileName: string, req: express.Request, res: express.Response) => {
    try {
      let html = '';
      const isDev = process.env.NODE_ENV !== 'production';

      // Determine candidate HTML file path
      let filePath = isDev 
        ? path.join(__dirname, htmlFileName) 
        : path.join(__dirname, 'dist', htmlFileName);

      if (!fs.existsSync(filePath)) {
        filePath = isDev 
          ? path.join(__dirname, 'index.html') 
          : path.join(__dirname, 'dist', 'index.html');
      }

      if (fs.existsSync(filePath)) {
        html = fs.readFileSync(filePath, 'utf-8');
      } else {
        html = '<!doctype html><html><head><meta charset="UTF-8"><script type="module" src="/src/main.tsx"></script></head><body><div id="root"></div></body></html>';
      }

      if (isDev && vite) {
        try {
          const transformUrl = htmlFileName.startsWith('/') ? htmlFileName : `/${htmlFileName}`;
          html = await vite.transformIndexHtml(transformUrl, html);
        } catch (err) {
          console.warn(`vite.transformIndexHtml failed for ${htmlFileName}, falling back to '/' transform:`, err);
          try {
            html = await vite.transformIndexHtml('/', html);
          } catch (err2) {
            console.error('vite.transformIndexHtml fallback also failed:', err2);
          }
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      console.error(`Error serving ${htmlFileName}:`, e);
      res.status(200).set({ 'Content-Type': 'text/html' }).send(
        '<!doctype html><html><head><meta charset="UTF-8"><script type="module" src="/src/main.tsx"></script></head><body><div id="root"></div></body></html>'
      );
    }
  };

  // Serve Gallery Page
  app.get('/gallery', (req, res) => serveHtmlPage('gallery.html', req, res));

  // Serve About Page
  app.get('/about', (req, res) => serveHtmlPage('about.html', req, res));

  // Serve Strengths Page
  app.get('/strengths', (req, res) => serveHtmlPage('strengths.html', req, res));

  // Serve Contact Page
  app.get('/contact', (req, res) => serveHtmlPage('contact.html', req, res));

  // Serve Admin Page and its child routes (e.g. /admin, /admin/sliders, /admin/products)
  app.get('/admin*', (req, res) => serveHtmlPage('admin.html', req, res));

  // Fallback for all other routes
  app.get('*', (req, res) => serveHtmlPage('index.html', req, res));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
