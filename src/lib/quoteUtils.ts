export interface QuoteItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  category?: string;
  selectedColor?: string;
  sizeBreakdown?: {
    S?: number;
    M?: number;
    L?: number;
    XL?: number;
    XXL?: number;
    [key: string]: number | undefined;
  };
}

export type BrandingType = 'none' | 'embroidery' | 'dtf_print' | '3d_pocket_print' | 'sublimation' | 'color_customization' | 'screen_print';

export interface QuoteDetails {
  quoteRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  deliveryLocation?: string;
  items: QuoteItem[];
  brandingType: BrandingType;
  brandingNotes?: string;
  subtotal: number;
  bulkDiscountAmount: number;
  bulkDiscountPercent: number;
  brandingCost: number;
  includeVat: boolean;
  vatAmount: number;
  grandTotal: number;
  createdAt: string;
  validUntil: string;
  notes?: string;
  orderId?: string;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'deposit_paid' | 'pending';
  amountPaid?: number;
  balanceDue?: number;
}

export function calculateQuoteDetails(
  items: QuoteItem[],
  options: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    companyName?: string;
    deliveryLocation?: string;
    brandingType?: BrandingType;
    includeVat?: boolean;
    notes?: string;
    orderId?: string;
    paymentMethod?: string;
    paymentStatus?: 'paid' | 'deposit_paid' | 'pending';
    amountPaid?: number;
  }
): QuoteDetails {
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Bulk Discount Matrix
  let bulkDiscountPercent = 0;
  if (totalQuantity >= 100) {
    bulkDiscountPercent = 15;
  } else if (totalQuantity >= 50) {
    bulkDiscountPercent = 10;
  } else if (totalQuantity >= 20) {
    bulkDiscountPercent = 5;
  }

  const bulkDiscountAmount = Math.round((itemsSubtotal * bulkDiscountPercent) / 100);

  // Branding Cost Calculation per garment
  const brandingType: BrandingType = options.brandingType || 'none';
  let brandingRate = 0;
  if (brandingType === 'embroidery') brandingRate = 350;
  if (brandingType === 'dtf_print') brandingRate = 280;
  if (brandingType === '3d_pocket_print') brandingRate = 320;
  if (brandingType === 'sublimation') brandingRate = 250;
  if (brandingType === 'color_customization') brandingRate = 180;
  if (brandingType === 'screen_print') brandingRate = 200;

  const brandingCost = totalQuantity * brandingRate;

  const netBeforeVat = itemsSubtotal - bulkDiscountAmount + brandingCost;
  const includeVat = options.includeVat ?? true;
  const vatAmount = includeVat ? Math.round(netBeforeVat * 0.16) : 0;
  const grandTotal = netBeforeVat + vatAmount;

  const now = new Date();
  const validDate = new Date();
  validDate.setDate(now.getDate() + 30);

  const quoteRef = `TEQ-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const amountPaid = options.amountPaid ?? (options.paymentStatus === 'paid' ? grandTotal : 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  return {
    quoteRef,
    customerName: options.customerName,
    customerEmail: options.customerEmail,
    customerPhone: options.customerPhone || '',
    companyName: options.companyName || '',
    deliveryLocation: options.deliveryLocation || 'Nairobi, Kenya',
    items,
    brandingType,
    subtotal: itemsSubtotal,
    bulkDiscountAmount,
    bulkDiscountPercent,
    brandingCost,
    includeVat,
    vatAmount,
    grandTotal,
    createdAt: now.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }),
    validUntil: validDate.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }),
    notes: options.notes || '',
    orderId: options.orderId,
    paymentMethod: options.paymentMethod || 'M-PESA / Bank Transfer',
    paymentStatus: options.paymentStatus || 'pending',
    amountPaid,
    balanceDue,
  };
}

export const DEFAULT_LOGO_URL = "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg";

/**
 * Common HTML CSS template used across Quote, Invoice, and Receipt
 */
function getDocumentBaseStyles(accentColor: string = '#269453') {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a;
      background: #fff;
      padding: 40px;
      font-size: 13px;
      line-height: 1.5;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid ${accentColor};
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid ${accentColor};
      box-shadow: 0 4px 12px rgba(11, 44, 122, 0.12);
      display: block;
    }

    .logo-badge {
      width: 64px;
      height: 64px;
      background: ${accentColor};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: -1px;
    }

    .company-title {
      font-size: 22px;
      font-weight: 900;
      color: #0b2c7a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .company-tagline {
      font-size: 10px;
      color: ${accentColor};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 3px;
    }

    .doc-title-badge {
      text-align: right;
    }

    .doc-title-badge h1 {
      font-size: 24px;
      font-weight: 900;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }

    .doc-ref {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }

    .info-card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${accentColor};
      margin-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11.5px;
    }

    .info-label { font-weight: 600; color: #64748b; }
    .info-value { font-weight: 700; color: #0f172a; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }

    th {
      background: #0f172a;
      color: white;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
      padding: 12px 14px;
      text-align: left;
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .summary-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 36px;
      gap: 24px;
    }

    .terms-box {
      width: 54%;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      font-size: 11px;
      color: #334155;
    }

    .terms-box h4 {
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 6px;
      font-size: 11px;
    }

    .terms-box ul {
      padding-left: 16px;
      line-height: 1.6;
    }

    .summary-table {
      width: 42%;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    .summary-row.total {
      border-bottom: none;
      border-top: 2px solid ${accentColor};
      padding-top: 10px;
      margin-top: 4px;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }

    .stamp-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
    }

    .stamp-box {
      border: 2px dashed ${accentColor};
      padding: 10px 20px;
      border-radius: 12px;
      text-align: center;
      color: ${accentColor};
    }

    .stamp-box .title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .stamp-box .verified {
      font-size: 13px;
      font-weight: 800;
      margin-top: 2px;
    }

    .no-print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${accentColor};
      color: white;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(11,44,122,0.25);
      font-family: inherit;
      font-size: 13px;
      z-index: 9999;
    }

    @media print {
      body { padding: 0; }
      .no-print-btn { display: none; }
    }
  `;
}

/**
 * PRINT OFFICIAL PROFORMA QUOTATION (WITH LOGO)
 */
export function printProformaQuote(quote: QuoteDetails, logoUrl?: string) {
  const activeLogoUrl = logoUrl || DEFAULT_LOGO_URL;
  const printWindow = window.open('', '_blank', 'width=920,height=1050');
  if (!printWindow) {
    alert('Pop-up window was blocked. Please allow pop-ups to print or view the quotation.');
    return;
  }

  const brandingLabel = {
    none: 'Standard / Unbranded',
    embroidery: 'Computer Embroidery (Chest/Sleeve/Back)',
    dtf_print: 'DTF Digital Print (Vibrant Full-Color)',
    '3d_pocket_print': '3D Pocket & Silicone Relief Print',
    sublimation: 'All-Over / Panel Sublimation Branding',
    color_customization: 'Custom Color & Contrast Trims',
    screen_print: 'High-Density Screen Printing',
  }[quote.brandingType] || 'Custom Branding';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>PROFORMA QUOTATION - ${quote.quoteRef} | Tewaw Enterprise Limited</title>
        <style>
          ${getDocumentBaseStyles('#269453')}
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

        <!-- Header -->
        <div class="header">
          <div class="brand-logo">
            <img src="${activeLogoUrl}" alt="TEWAW Logo" class="logo-img" crossorigin="anonymous" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-badge" style="display: none;">TE</div>
            <div>
              <div class="company-title">Tewaw Enterprise Ltd</div>
              <div class="company-tagline">Custom Uniforms & Apparel Manufacturing</div>
            </div>
          </div>
          <div class="doc-title-badge">
            <h1>PROFORMA QUOTATION</h1>
            <div class="doc-ref">${quote.quoteRef}</div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title">Issuer (Manufacturer)</div>
            <div class="info-row"><span class="info-label">Company:</span> <span class="info-value">Tewaw Enterprise Ltd</span></div>
            <div class="info-row"><span class="info-label">Address:</span> <span class="info-value">P.O. Box 13653 - 00400 Jagoo Lane, Uhuru Market, Nairobi, Kenya</span></div>
            <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">+254 736 619 688</span></div>
            <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">info@tewaw.co.ke / sales@tewaw.co.ke</span></div>
            <div class="info-row"><span class="info-label">KRA PIN:</span> <span class="info-value">P051239821Z</span></div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Client Details & Validity</div>
            <div class="info-row"><span class="info-label">Attention:</span> <span class="info-value">${quote.customerName}</span></div>
            ${quote.companyName ? `<div class="info-row"><span class="info-label">Organization:</span> <span class="info-value">${quote.companyName}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">${quote.customerEmail}</span></div>
            ${quote.customerPhone ? `<div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${quote.customerPhone}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Delivery To:</span> <span class="info-value">${quote.deliveryLocation}</span></div>
            <div class="info-row"><span class="info-label">Date Issued:</span> <span class="info-value">${quote.createdAt}</span></div>
            <div class="info-row"><span class="info-label">Valid Until:</span> <span class="info-value">${quote.validUntil}</span></div>
          </div>
        </div>

        <!-- Branding Specification -->
        ${quote.brandingType !== 'none' ? `
          <div style="background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 11px;">
            <strong style="color: #0369a1; text-transform: uppercase;">Custom Branding Specification:</strong> 
            <span style="color: #0f172a; font-weight: 700; margin-left: 6px;">${brandingLabel}</span>
            ${quote.brandingNotes ? `<div style="margin-top: 4px; color: #334155;">Note: ${quote.brandingNotes}</div>` : ''}
          </div>
        ` : ''}

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Garment / Product Name</th>
              <th>Category</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Unit Price (KES)</th>
              <th style="text-align: right;">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item, idx) => `
              <tr>
                <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.category || 'General'}</td>
                <td>${item.selectedColor || 'Standard'}</td>
                <td style="font-weight: 800;">${item.quantity}</td>
                <td style="font-family: monospace;">KES ${item.price.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 800;">KES ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary & Terms -->
        <div class="summary-container">
          <div class="terms-box">
            <h4>Terms & Production Notes</h4>
            <ul>
              <li><strong>Payment Terms:</strong> 50% commitment deposit upon quote approval, 50% prior to dispatch.</li>
              <li><strong>Production Timeline:</strong> 3–7 working days depending on quantity & branding options.</li>
              <li><strong>Sample Approval:</strong> Digital embroidery sample proof provided before mass stitching.</li>
              <li><strong>Validity:</strong> Prices guaranteed for 30 days from date of issue.</li>
            </ul>
          </div>

          <div class="summary-table">
            <div class="summary-row">
              <span class="info-label">Items Subtotal:</span>
              <span class="info-value" style="font-family: monospace;">KES ${quote.subtotal.toLocaleString()}</span>
            </div>
            ${quote.bulkDiscountAmount > 0 ? `
              <div class="summary-row" style="color: #269453;">
                <span class="info-label" style="color: #269453;">Bulk Discount (${quote.bulkDiscountPercent}%):</span>
                <span class="info-value" style="font-family: monospace;">- KES ${quote.bulkDiscountAmount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${quote.brandingCost > 0 ? `
              <div class="summary-row">
                <span class="info-label">Custom Branding Fee:</span>
                <span class="info-value" style="font-family: monospace;">+ KES ${quote.brandingCost.toLocaleString()}</span>
              </div>
            ` : ''}
            ${quote.includeVat ? `
              <div class="summary-row">
                <span class="info-label">Estimated VAT (16%):</span>
                <span class="info-value" style="font-family: monospace;">KES ${quote.vatAmount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span style="color: #269453;">KES ${quote.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Stamp & Sign -->
        <div class="stamp-section">
          <div>
            <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 11px;">Prepared By:</div>
            <div style="margin-top: 4px; font-weight: 600; color: #475569;">Tewaw Sales & Estimations Desk</div>
            <div style="font-size: 10px; color: #94a3b8;">Nairobi Factory Floor</div>
          </div>

          <div class="stamp-box">
            <div class="title">TEWAW ENTERPRISE LTD</div>
            <div class="verified">OFFICIAL QUOTATION</div>
            <div style="font-size: 9px; font-weight: 700; margin-top: 2px; text-transform: uppercase;">Factory Approved</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * PRINT OFFICIAL TAX INVOICE (WITH LOGO & KRA DETAILS)
 */
export function printTaxInvoice(quote: QuoteDetails, logoUrl?: string) {
  const activeLogoUrl = logoUrl || DEFAULT_LOGO_URL;
  const printWindow = window.open('', '_blank', 'width=920,height=1050');
  if (!printWindow) {
    alert('Pop-up window was blocked. Please allow pop-ups to print or view the invoice.');
    return;
  }

  const invoiceNo = quote.orderId ? `TEI-2026-${quote.orderId.slice(0, 6).toUpperCase()}` : quote.quoteRef.replace('TEQ', 'TEI');
  const brandingLabel = {
    none: 'Standard / Unbranded',
    embroidery: 'Computer Embroidery (Chest/Sleeve/Back)',
    dtf_print: 'DTF Digital Print (Vibrant Full-Color)',
    '3d_pocket_print': '3D Pocket & Silicone Relief Print',
    sublimation: 'All-Over / Panel Sublimation Branding',
    color_customization: 'Custom Color & Contrast Trims',
    screen_print: 'High-Density Screen Printing',
  }[quote.brandingType] || 'Custom Branding';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>TAX INVOICE - ${invoiceNo} | Tewaw Enterprise Limited</title>
        <style>
          ${getDocumentBaseStyles('#0b2c7a')}
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

        <!-- Header -->
        <div class="header">
          <div class="brand-logo">
            <img src="${activeLogoUrl}" alt="TEWAW Logo" class="logo-img" crossorigin="anonymous" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-badge" style="display: none;">TE</div>
            <div>
              <div class="company-title">Tewaw Enterprise Ltd</div>
              <div class="company-tagline" style="color: #0b2c7a;">Apparel Manufacturing & Garment Branding</div>
            </div>
          </div>
          <div class="doc-title-badge">
            <h1 style="color: #0b2c7a;">TAX INVOICE</h1>
            <div class="doc-ref">${invoiceNo}</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 2px;">ETR / KRA Compliant</div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title" style="color: #0b2c7a;">Issuer (Tax Details)</div>
            <div class="info-row"><span class="info-label">Company:</span> <span class="info-value">Tewaw Enterprise Limited</span></div>
            <div class="info-row"><span class="info-label">Address:</span> <span class="info-value">P.O. Box 13653 - 00400 Jagoo Lane, Uhuru Market, Nairobi</span></div>
            <div class="info-row"><span class="info-label">KRA PIN:</span> <span class="info-value" style="color: #0b2c7a; font-family: monospace;">P051239821Z</span></div>
            <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">+254 736 619 688</span></div>
            <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">accounts@tewaw.co.ke / info@tewaw.co.ke</span></div>
          </div>

          <div class="info-card">
            <div class="info-card-title" style="color: #0b2c7a;">Bill To (Customer)</div>
            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-value">${quote.customerName}</span></div>
            ${quote.companyName ? `<div class="info-row"><span class="info-label">Organization:</span> <span class="info-value">${quote.companyName}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">${quote.customerEmail}</span></div>
            ${quote.customerPhone ? `<div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${quote.customerPhone}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Invoice Date:</span> <span class="info-value">${quote.createdAt}</span></div>
            <div class="info-row"><span class="info-label">Payment Due:</span> <span class="info-value">Upon Receipt / Net 15</span></div>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description / Item Specification</th>
              <th>Color / Type</th>
              <th>Qty</th>
              <th>Unit Rate (KES)</th>
              <th>VAT (16%)</th>
              <th style="text-align: right;">Amount (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item, idx) => {
              const itemTotal = item.price * item.quantity;
              const itemVat = Math.round(itemTotal * 0.16);
              return `
                <tr>
                  <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
                  <td><strong>${item.name}</strong><br/><span style="color: #64748b; font-size: 10px;">${item.category || 'Apparel'}</span></td>
                  <td>${item.selectedColor || 'Standard'}</td>
                  <td style="font-weight: 800;">${item.quantity}</td>
                  <td style="font-family: monospace;">KES ${item.price.toLocaleString()}</td>
                  <td style="font-family: monospace; color: #64748b;">KES ${itemVat.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800;">KES ${(itemTotal + itemVat).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Summary & Banking -->
        <div class="summary-container">
          <div class="terms-box" style="border-left: 4px solid #0b2c7a;">
            <h4 style="color: #0b2c7a;">Official Payment Channels</h4>
            <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
              <li>💳 <strong>M-PESA Paybill:</strong> 247247 | <strong>Account:</strong> 0736619688</li>
              <li>🏦 <strong>Bank:</strong> Equity Bank Kenya | <strong>Branch:</strong> Nairobi CBD</li>
              <li>🏢 <strong>Account Name:</strong> Tewaw Enterprise Limited</li>
              <li>📍 <strong>Physical Collections:</strong> Jagoo Lane, Uhuru Market, Nairobi</li>
            </ul>
          </div>

          <div class="summary-table">
            <div class="summary-row">
              <span class="info-label">Net Subtotal:</span>
              <span class="info-value" style="font-family: monospace;">KES ${quote.subtotal.toLocaleString()}</span>
            </div>
            ${quote.bulkDiscountAmount > 0 ? `
              <div class="summary-row" style="color: #269453;">
                <span class="info-label" style="color: #269453;">Bulk Discount (${quote.bulkDiscountPercent}%):</span>
                <span class="info-value" style="font-family: monospace;">- KES ${quote.bulkDiscountAmount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${quote.brandingCost > 0 ? `
              <div class="summary-row">
                <span class="info-label">Branding (${brandingLabel}):</span>
                <span class="info-value" style="font-family: monospace;">+ KES ${quote.brandingCost.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="summary-row">
              <span class="info-label">VAT 16% (Exclusive):</span>
              <span class="info-value" style="font-family: monospace;">KES ${quote.vatAmount.toLocaleString()}</span>
            </div>
            <div class="summary-row total" style="border-top: 2px solid #0b2c7a;">
              <span>Invoice Total (Incl. VAT):</span>
              <span style="color: #0b2c7a;">KES ${quote.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Stamp & Sign -->
        <div class="stamp-section">
          <div>
            <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 11px;">Authorised Signatory:</div>
            <div style="margin-top: 4px; font-weight: 700; color: #0b2c7a;">Tewaw Finance & Accounts Department</div>
            <div style="font-size: 10px; color: #94a3b8;">Nairobi Central Billing Office</div>
          </div>

          <div class="stamp-box" style="border-color: #0b2c7a; color: #0b2c7a;">
            <div class="title">TEWAW ENTERPRISE LTD</div>
            <div class="verified">TAX INVOICE</div>
            <div style="font-size: 9px; font-weight: 700; margin-top: 2px; text-transform: uppercase;">Official Audit Seal</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * PRINT OFFICIAL PAYMENT RECEIPT (WITH LOGO & ACKNOWLEDGEMENT)
 */
export function printReceipt(quote: QuoteDetails, logoUrl?: string) {
  const activeLogoUrl = logoUrl || DEFAULT_LOGO_URL;
  const printWindow = window.open('', '_blank', 'width=920,height=1050');
  if (!printWindow) {
    alert('Pop-up window was blocked. Please allow pop-ups to print or view the receipt.');
    return;
  }

  const receiptNo = quote.orderId ? `TER-2026-${quote.orderId.slice(0, 6).toUpperCase()}` : quote.quoteRef.replace('TEQ', 'TER');
  const amountPaid = quote.amountPaid ?? quote.grandTotal;
  const balanceDue = quote.balanceDue ?? 0;
  const isFullyPaid = balanceDue <= 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>OFFICIAL RECEIPT - ${receiptNo} | Tewaw Enterprise Limited</title>
        <style>
          ${getDocumentBaseStyles('#269453')}
          .status-stamp {
            display: inline-block;
            padding: 4px 12px;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

        <!-- Header -->
        <div class="header">
          <div class="brand-logo">
            <img src="${activeLogoUrl}" alt="TEWAW Logo" class="logo-img" crossorigin="anonymous" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-badge" style="display: none;">TE</div>
            <div>
              <div class="company-title">Tewaw Enterprise Ltd</div>
              <div class="company-tagline">Apparel Manufacturing & Garment Branding</div>
            </div>
          </div>
          <div class="doc-title-badge">
            <h1>OFFICIAL RECEIPT</h1>
            <div class="doc-ref">${receiptNo}</div>
            <div style="margin-top: 6px;">
              <span class="status-stamp">${isFullyPaid ? '✓ PAID IN FULL' : '✓ DEPOSIT RECEIVED'}</span>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title">Issuer (Payment Recipient)</div>
            <div class="info-row"><span class="info-label">Company:</span> <span class="info-value">Tewaw Enterprise Ltd</span></div>
            <div class="info-row"><span class="info-label">Address:</span> <span class="info-value">P.O. Box 13653 - 00400 Jagoo Lane, Uhuru Market, Nairobi</span></div>
            <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">+254 736 619 688</span></div>
            <div class="info-row"><span class="info-label">KRA PIN:</span> <span class="info-value">P051239821Z</span></div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Customer & Payment Meta</div>
            <div class="info-row"><span class="info-label">Received From:</span> <span class="info-value">${quote.customerName}</span></div>
            ${quote.companyName ? `<div class="info-row"><span class="info-label">Company:</span> <span class="info-value">${quote.companyName}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Payment Mode:</span> <span class="info-value">${quote.paymentMethod || 'M-PESA Express'}</span></div>
            <div class="info-row"><span class="info-label">Date & Time:</span> <span class="info-value">${quote.createdAt}</span></div>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Description</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Unit Rate (KES)</th>
              <th style="text-align: right;">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item, idx) => `
              <tr>
                <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td><strong>${item.name}</strong> (${item.category || 'General'})</td>
                <td>${item.selectedColor || 'Standard'}</td>
                <td style="font-weight: 800;">${item.quantity}</td>
                <td style="font-family: monospace;">KES ${item.price.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 800;">KES ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary & Balance -->
        <div class="summary-container">
          <div class="terms-box">
            <h4>Payment Acknowledgement</h4>
            <p style="margin-bottom: 6px;">Thank you for your business. This official receipt acknowledges verified payment received for custom garment manufacturing.</p>
            <p><strong>Factory Inquiries:</strong> +254 736 619 688 | <strong>Email:</strong> info@tewaw.co.ke</p>
          </div>

          <div class="summary-table">
            <div class="summary-row">
              <span class="info-label">Order Total (Incl. VAT):</span>
              <span class="info-value" style="font-family: monospace;">KES ${quote.grandTotal.toLocaleString()}</span>
            </div>
            <div class="summary-row" style="color: #166534; font-weight: 800;">
              <span class="info-label" style="color: #166534;">Amount Received:</span>
              <span class="info-value" style="font-family: monospace; color: #166534;">KES ${amountPaid.toLocaleString()}</span>
            </div>
            <div class="summary-row total" style="border-top: 2px solid ${isFullyPaid ? '#269453' : '#ea580c'};">
              <span>Balance Remaining:</span>
              <span style="color: ${isFullyPaid ? '#269453' : '#ea580c'};">KES ${balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Stamp & Sign -->
        <div class="stamp-section">
          <div>
            <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 11px;">Acknowledged By:</div>
            <div style="margin-top: 4px; font-weight: 700; color: #269453;">Tewaw Cashier & Accounts Desk</div>
            <div style="font-size: 10px; color: #94a3b8;">Nairobi Garment Facility</div>
          </div>

          <div class="stamp-box">
            <div class="title">TEWAW ENTERPRISE LTD</div>
            <div class="verified">OFFICIAL RECEIPT</div>
            <div style="font-size: 9px; font-weight: 700; margin-top: 2px; text-transform: uppercase;">Payment Cleared</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generate a real .pdf Blob file containing the official logo image and document details
 */
export async function generateDocumentPDFBlob(
  docType: 'quote' | 'invoice' | 'receipt',
  quote: QuoteDetails,
  logoUrl?: string
): Promise<{ blob: Blob; file: File; filename: string }> {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const activeLogoUrl = logoUrl || DEFAULT_LOGO_URL;
  const docTypeLabel = docType === 'invoice' ? 'TAX_INVOICE' : (docType === 'receipt' ? 'RECEIPT' : 'QUOTATION');
  const prefix = docType === 'invoice' ? 'TEI' : (docType === 'receipt' ? 'TER' : 'TEQ');
  const refCode = quote.orderId ? `${prefix}-${quote.orderId.slice(0, 6).toUpperCase()}` : quote.quoteRef.replace('TEQ', prefix);
  const filename = `TEWAW_${docTypeLabel}_${refCode}.pdf`;
  const accentColor = docType === 'invoice' ? '#0b2c7a' : '#269453';

  // Create an offscreen DOM node
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '780px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '32px';
  container.style.fontFamily = "'Plus Jakarta Sans', sans-serif, system-ui";
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  const docTitle = docType === 'invoice' ? 'TAX INVOICE' : (docType === 'receipt' ? 'OFFICIAL RECEIPT' : 'PROFORMA QUOTATION');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${accentColor}; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${activeLogoUrl}" alt="TEWAW Logo" style="width: 58px; height: 58px; object-fit: cover; border-radius: 50%; border: 2px solid ${accentColor};" crossorigin="anonymous" />
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #0b2c7a; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.1;">TEWAW ENTERPRISE LTD</div>
          <div style="font-size: 9px; color: ${accentColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px;">Custom Uniforms & Apparel Manufacturing</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 20px; font-weight: 900; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.5px;">${docTitle}</div>
        <div style="font-family: monospace; font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 3px;">#${refCode}</div>
      </div>
    </div>

    <!-- Info Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${accentColor}; letter-spacing: 1px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">Issuer Details</div>
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Company:</span> <strong>Tewaw Enterprise Ltd</strong></div>
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Location:</span> <strong>Jagoo Lane, Uhuru Market, Nairobi</strong></div>
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Phone:</span> <strong>+254 736 619 688</strong></div>
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Email:</span> <strong>info@tewaw.co.ke</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">KRA PIN:</span> <strong>P051239821Z</strong></div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0b2c7a; letter-spacing: 1px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">Client Information</div>
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Attention:</span> <strong>${quote.customerName}</strong></div>
        ${quote.companyName ? `<div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Organization:</span> <strong>${quote.companyName}</strong></div>` : ''}
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Email:</span> <strong>${quote.customerEmail}</strong></div>
        ${quote.customerPhone ? `<div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Phone:</span> <strong>${quote.customerPhone}</strong></div>` : ''}
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color: #64748b;">Date:</span> <strong>${quote.createdAt}</strong></div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
      <thead>
        <tr style="background: #0f172a; color: white; font-weight: 800; text-transform: uppercase; font-size: 10px;">
          <th style="padding: 10px; text-align: left;">#</th>
          <th style="padding: 10px; text-align: left;">Item Name</th>
          <th style="padding: 10px; text-align: left;">Category</th>
          <th style="padding: 10px; text-align: left;">Color</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Unit Price (KES)</th>
          <th style="padding: 10px; text-align: right;">Total (KES)</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items.map((item, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
            <td style="padding: 10px; font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td style="padding: 10px; font-weight: 800; color: #0b2c7a;">${item.name}</td>
            <td style="padding: 10px;">${item.category || 'General'}</td>
            <td style="padding: 10px;">${item.selectedColor || 'Standard'}</td>
            <td style="padding: 10px; text-align: center; font-weight: 800;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; font-family: monospace;">KES ${item.price.toLocaleString()}</td>
            <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: 800;">KES ${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals & Terms -->
    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px;">
      <div style="width: 55%; background: #f1f5f9; border-radius: 12px; padding: 14px; font-size: 10px; color: #334155;">
        <h4 style="font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">Manufacturing & Payment Notes</h4>
        <ul style="padding-left: 14px; margin: 0; line-height: 1.6;">
          <li><strong>Payment Channel:</strong> M-PESA Paybill 247247 / Acc: 0736619688.</li>
          <li><strong>Premises:</strong> Jagoo Lane, Uhuru Market, Nairobi, Kenya.</li>
          <li><strong>Certified Compliant:</strong> Official document generated by Tewaw ERP System.</li>
        </ul>
      </div>

      <div style="width: 42%; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
          <span>Subtotal:</span>
          <span style="font-family: monospace; font-weight: 700;">KES ${quote.subtotal.toLocaleString()}</span>
        </div>
        ${quote.bulkDiscountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; color: #269453;">
            <span>Bulk Discount:</span>
            <span style="font-family: monospace; font-weight: 700;">- KES ${quote.bulkDiscountAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        ${quote.includeVat ? `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
            <span>VAT (16%):</span>
            <span style="font-family: monospace; font-weight: 700;">KES ${quote.vatAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid ${accentColor}; margin-top: 4px; font-size: 14px; font-weight: 900; color: #0f172a;">
          <span>Total:</span>
          <span style="color: ${accentColor};">KES ${quote.grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Official Stamp & Seal -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      <div>
        <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Issued By:</div>
        <div style="font-size: 11px; font-weight: 700; color: #0b2c7a; margin-top: 2px;">Tewaw Enterprise Limited</div>
        <div style="font-size: 9px; color: #64748b;">Nairobi Garment Facility</div>
      </div>
      <div style="border: 2px dashed ${accentColor}; padding: 8px 16px; border-radius: 10px; text-align: center; color: ${accentColor};">
        <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">TEWAW ENTERPRISE LTD</div>
        <div style="font-size: 12px; font-weight: 800;">${docTitle}</div>
        <div style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Official Document</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    return { blob: pdfBlob, file, filename };
  } catch (err) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw err;
  }
}

export function generateQuotePDFBlob(quote: QuoteDetails, logoUrl?: string) {
  return generateDocumentPDFBlob('quote', quote, logoUrl);
}

export function generateInvoicePDFBlob(quote: QuoteDetails, logoUrl?: string) {
  return generateDocumentPDFBlob('invoice', quote, logoUrl);
}

export function generateReceiptPDFBlob(quote: QuoteDetails, logoUrl?: string) {
  return generateDocumentPDFBlob('receipt', quote, logoUrl);
}

/**
 * Handle WhatsApp sharing with native .pdf attachment or automatic download fallback
 */
export async function shareQuotePDFViaWhatsApp(
  quote: QuoteDetails,
  settings?: any,
  onNotify?: (msg: string, type: 'info' | 'success' | 'warning') => void
) {
  const whatsappNum = settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688';
  const logoUrl = settings?.headerLogoUrl;

  try {
    if (onNotify) onNotify('Generating official PDF quotation document with logo...', 'info');
    const { blob, file, filename } = await generateQuotePDFBlob(quote, logoUrl);

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Tewaw Quotation #${quote.quoteRef}`,
          text: `Official Proforma Quotation #${quote.quoteRef} for ${quote.customerName} - Total: KES ${quote.grandTotal.toLocaleString()}`,
        });
        if (onNotify) onNotify('PDF Quotation shared successfully to WhatsApp!', 'success');
        return;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') return;
        console.warn('Native file share skipped, using automatic download + WhatsApp text:', shareErr);
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    let msg = `*OFFICIAL PROFORMA QUOTATION ATTACHED*\nRef: *#${quote.quoteRef}*\n`;
    msg += `Client: ${quote.customerName} ${quote.companyName ? `(${quote.companyName})` : ''}\n`;
    msg += `Total Amount: *KES ${quote.grandTotal.toLocaleString()}*\n\n`;
    msg += `📄 *The official PDF quotation (${filename}) has been generated and downloaded to your device.* Please attach the downloaded PDF file here in our chat!`;

    const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    if (onNotify) {
      onNotify(`Official PDF (${filename}) downloaded! Attach it in the WhatsApp chat window now open.`, 'success');
    }
  } catch (err) {
    console.error('Error generating PDF for WhatsApp:', err);
    if (onNotify) onNotify('Could not generate PDF file automatically. Opening WhatsApp text draft...', 'warning');

    let msg = `*OFFICIAL QUOTATION REQUEST*\nRef: *#${quote.quoteRef}*\n`;
    msg += `Client: ${quote.customerName}\n`;
    msg += `Total Amount: KES ${quote.grandTotal.toLocaleString()}\n`;
    const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }
}
