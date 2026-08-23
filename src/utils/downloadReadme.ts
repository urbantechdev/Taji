import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const README_MARKDOWN_CONTENT = `# Taji — Enterprise Multi-Device Textile ERP & Billing System

**Taji** is a modern, high-performance, multi-device Enterprise Resource Planning (ERP) platform purpose-built for textile manufacturers, fabric wholesalers, and retail chains. It features real-time cloud data synchronization, multi-store inventory routing, KRA TIMS ETR 16% VAT & 5% Withholding Tax (WHT) fiscal compliance, double-entry accounting, Kenya statutory payroll, POS barcode scanning with sound feedback, and multi-format document exporting (PDF, CSV, JSON, TXT).

---

## Table of Contents
1. System Architecture
2. Core Functional Modules
   - 1. Executive Hub & Analytics Dashboard
   - 2. Autonomous Branches & Multi-Store Management
   - 3. Point of Sale (POS) & Checkout Engine
   - 4. Textile Inventory & Roll Tare Management
   - 5. Inter-Store Inventory Transfers & Waybills
   - 6. KRA TIMS ETR Billing, Invoicing & Documents
   - 7. Financial Accounting & Double-Entry Ledger
   - 8. Accountant Zero-Effort Countercheck & Filing Suite
   - 9. HR & Kenya Statutory Payroll (PAYE, NSSF, SHIF, Housing Levy)
   - 10. POS Operators, Roles & PIN Security
   - 11. Audit Trails & Forensic System Logs
   - 12. Gmail Inbox & Workspace Communications
3. Document Generation & Export Engine
4. Hardware & Peripheral Support
5. Keyboard Shortcuts
6. Security & Role-Based Access Control (RBAC)
7. Installation & Deployment

---

## 1. System Architecture
- Universal Responsiveness: Fully adaptive UI optimized for desktop workstations, POS counter terminals, handheld mobile scanners, and tablet displays.
- Real-Time Data Layer: Persistent synchronization across all operational branches and cash tills with Cloud Firestore.
- Offline Resilient: Local fallback caching ensuring continuous checkout continuity during temporary connectivity drops.

---

## 2. Core Functional Modules

### 1. Executive Hub & Analytics Dashboard
- Live Revenue, Gross Profit, VAT collected, and inventory asset valuation charts.
- Top-moving textile lines ranking (Cotton Drill, Linen, Silk, Khaki, Polyester, Denim, Wool, Poplin).
- Autonomous branch performance matrix and real-time inventory reorder triggers.

### 2. Autonomous Branches & Multi-Store Management
- Manage physical stores (Nairobi Central Store, Mombasa Road Depot, Industrial Area Main Warehouse, Store 1 & Store 2 Transfer Hubs).
- Location-specific inventory stocking, independent reorder thresholds, and designated store managers.
- Autonomous cash drawer and M-Pesa float reconciliation per branch.

### 3. Point of Sale (POS) & Checkout Engine
- High-velocity optical barcode and camera scanning with synthesized dual-tone audio beep feedback (880Hz - 1760Hz).
- Customer classification price tiers (Retail, Wholesale, Contractor, Export).
- Multi-tender support: M-Pesa, Cash, Bank Transfer / RTGS, Credit/Debit Cards, Corporate Cheques.
- 5% Withholding Tax (WHT) deduction toggle with certificate reference capture.
- Dynamic stock routing: dispatch from local shop floor or central warehouse.

### 4. Textile Inventory & Roll Tare Management
- Native textile units: Meters, Yards, Rolls, Pieces, and Kilograms.
- Dual-Weight & Fabric Tare Deduction: Automatic net billable weight calculation deducting spool/core/packaging tare weights from gross scale readings.
- Roll / Bale ID, dye lot/shade numbers, fabric composition, and weight (GSM) tracking.
- Duplicate barcode prevention and real-time reorder threshold alerts.

### 5. Inter-Store Inventory Transfers & Waybills
- 4-Stage State Machine: Draft -> Approved -> Dispatched / In Transit -> Received & Reconciled.
- Automatic ledger updates and printed A4 Transfer Waybills with driver & vehicle details.

### 6. KRA TIMS ETR Billing, Invoicing & Documents
- KRA eTIMS Tax Invoices with 16% Output VAT, KRA PIN, CU serial numbers, and encrypted QR codes.
- Commercial Quotations & Proforma Invoices with 1-click conversion to official invoices.
- Goods Delivery Notes & Waybills with consignee addresses, vehicle plates, package counts, and 3-party sign-offs.
- eTIMS Credit Notes linked to original invoice numbers for inventory and ledger reversals.
- Comprehensive bulk CSV and PDF document export suite.

### 7. Financial Accounting & Double-Entry Ledger
- Fully automated balancing engine posting real-time journal entries for sales, COGS, VAT, WHT, and expenses.
- Standard Chart of Accounts (Cash, M-Pesa Float, Inventory, Accounts Receivable, KRA VAT Liability, WHT Receivable, Sales Revenue, Payroll).

### 8. Accountant Zero-Effort Countercheck & Filing Suite
- Automated Reconciliation Sentinels:
  - Debit = Credit balance verification with zero variance.
  - POS vs. eTIMS electronic register matching.
  - Cash drawer float and M-Pesa till reconciliation.
  - Mandatory customer KRA PIN, WHT certificate, and margin guard checks.
- 1-Click Statutory Filing & Audit Export Packs:
  - KRA iTax VAT-3 ready CSV.
  - Unified statutory payroll CSV (PAYE P10, NSSF, SHIF, Housing Levy).
  - Consolidated Balance Sheet, Income Statement (P&L), and Trial Balance PDF audit dossier.
  - General Ledger CSV for external accounting packages.

### 9. HR & Kenya Statutory Payroll
- Kenya statutory deduction engine: PAYE progressive tax brackets, NSSF Tier I & II, SHIF (2.75%), Affordable Housing Levy (1.5%).
- Automated employee payslip generation with direct PDF download.

### 10. POS Operators, Roles & PIN Security
- Operator profiles with individual numeric security PINs for cashier login, switch, and audit tracking.
- Every transaction, price override, and discount logged against active operator.

### 11. Audit Trails & Forensic System Logs
- Immutable audit log capturing user IDs, timestamps, affected documents, and before/after payloads.

### 12. Gmail Inbox & Workspace Communications
- Direct client-side Google Workspace integration to manage customer order emails and supplier delivery correspondence.

---

## 3. Document Generation & Export Engine
- Tax Invoices (A4 PDF, CSV, Thermal Slip, JSON)
- Quotations & Proformas (A4 PDF, CSV, JSON)
- Cash & ETR Receipts (80mm Thermal Slip, PDF, JSON)
- Goods Delivery Notes / Waybills (A4 PDF, Gate Pass, CSV)
- Credit Notes (A4 PDF, CSV, JSON)
- KRA iTax VAT-3 CSV (Macro-ready monthly return schedule)
- Payroll Statutory CSV (PAYE P10, NSSF, SHIF, Housing Levy)
- General Ledger & Trial Balance (CSV, PDF)
- Employee Payslips (A4 PDF)
- Complete System Manual (Markdown .md, PDF, TXT)

---

## 4. Hardware & Peripheral Support
- USB & Bluetooth 1D/2D Barcode Scanners.
- Integrated Camera Barcode / QR Readers with audio feedback.
- 80mm and 58mm ESC/POS Thermal Receipt Printers.
- Standard Office A4 Laser/Inkjet Printers.

---

## 5. Keyboard Shortcuts
- F2: Open POS Checkout Screen
- F3: Trigger Camera / Barcode Scanner Modal
- F4: Open Billing & Invoicing Engine
- F8: Open Inventory Catalog
- F9: Open Stock Transfers
- Escape: Close Active Modal / Return to Workspace

---

## 6. Security & Role-Based Access Control (RBAC)
- Super Admin: Full system control across all branches, finance, payroll, and settings.
- Store Manager: POS, Catalog, Stock Intake, Transfers, Quotations, and Operator Oversight.
- Cashier / POS Operator: Restricted to checkout sales, receipt issuance, and cash drawer tallies.
- Accountant / Auditor: Direct access to the Zero-Effort Countercheck & Filing Center, general ledger, VAT-3/PAYE downloads, and audit logs.

---

## 7. Installation & Deployment
- Development: npm install && npm run dev
- Production: npm run build && npm run start

© 2026 Taji Textile ERP. All Rights Reserved.`;

/**
 * Trigger browser download for README.md file
 */
export const downloadReadmeMarkdown = (filename: string = 'README.md') => {
  const blob = new Blob([README_MARKDOWN_CONTENT], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Trigger browser download for README as Plain Text (.txt)
 */
export const downloadReadmeText = (filename: string = 'TAJI_ERP_SYSTEM_MANUAL.txt') => {
  const blob = new Blob([README_MARKDOWN_CONTENT], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate and download formatted PDF System Manual
 */
export const downloadReadmePDF = (filename: string = 'TAJI_ERP_DOCUMENTATION_MANUAL.pdf') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(225, 29, 72); // Rose 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TAJI TEXTILE ENTERPRISE ERP', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('System Operations Manual & Technical Documentation • Version 2026.1', margin, 20);

  let cursorY = 36;

  // System Highlights Box
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(254, 205, 211); // Rose 200
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 24, 3, 3, 'FD');

  doc.setTextColor(159, 18, 57); // Rose 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CORE PLATFORM OVERVIEW', margin + 4, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const summaryText =
    'Taji is an enterprise-grade, multi-device textile resource planning platform featuring real-time cloud data synchronization, multi-store inventory routing, KRA TIMS 16% VAT & 5% WHT compliance, automated double-entry accounting, Kenya statutory payroll, POS barcode scanning with sound feedback, and multi-format document exporting.';
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - margin * 2 - 8);
  doc.text(splitSummary, margin + 4, cursorY + 13);

  cursorY += 32;

  // System Modules Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CORE FUNCTIONAL MODULES', margin, cursorY);
  cursorY += 4;

  const modulesTableData = [
    ['Executive Hub & Analytics', 'Live revenue, gross margins, inventory asset valuation, top-moving textile fabrics, and branch comparison.'],
    ['Autonomous Branches', 'Multi-location inventory tracking (Main Store, Sales Shop, Regional Depots, Store 1 & 2) with independent reorder points.'],
    ['POS Checkout & Scanning', 'High-speed 1D/2D optical barcode scanning with synthesized audio chime, customer price tiers, and 5 tender types.'],
    ['Textile Roll & Tare System', 'Textile units (Meters, Yards, Rolls, Pieces, Kg), automated spool/packaging tare deduction, roll IDs, GSM, and reorder alerts.'],
    ['Inter-Store Transfers', '4-stage state machine (Draft -> Approved -> Dispatched -> Received) with printed waybills and ledger updates.'],
    ['KRA TIMS ETR Invoicing', '16% VAT Tax Invoices, Quotations, Proformas, Official Receipts, Goods Delivery Notes, and eTIMS Credit Notes.'],
    ['Double-Entry Ledger', 'Automated balancing journal entries posting across Cash, Bank, Inventory, VAT Liability, WHT Receivable, and Sales.'],
    ['Accountant Audit & Filing', 'Automated debit=credit sentinels, till reconciliation, and 1-click filing packs for VAT-3, PAYE, NSSF, SHIF, and P&L.'],
    ['Kenya Statutory Payroll', 'Full statutory compliance: PAYE progressive tax brackets, NSSF Tier I/II, SHIF (2.75%), Affordable Housing Levy (1.5%).'],
    ['POS Operators & PIN', 'Role-Based Access Control (Admin, Store Manager, Cashier, Auditor) with operator-specific PIN authentication.'],
    ['System Audit Trails', 'Immutable transaction and modification event logs with timestamps, operator IDs, and before/after payloads.'],
    ['Workspace Gmail', 'Client-side OAuth synchronization for customer quotation emails and supplier delivery correspondence.']
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Module', 'Functional Description & Operational Capabilities']],
    body: modulesTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = 20;
  }

  // Document Export & Peripheral Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DOCUMENT EXPORTS & PERIPHERAL COMPATIBILITY', margin, cursorY);
  cursorY += 4;

  const exportTableData = [
    ['KRA TIMS Tax Invoice', 'A4 PDF, CSV, 80mm Thermal Slip, JSON', '16% VAT, 5% WHT, KRA PIN, CU Serial, QR Code'],
    ['Commercial Quotation', 'A4 PDF, CSV, JSON', 'Validity Days, Terms, 1-Click Convert to Invoice'],
    ['Official Cash Receipt', '80mm Thermal Slip, PDF, JSON', 'Fiscal Receipt #, Operator Name, Tender split'],
    ['Goods Delivery Note', 'A4 PDF, CSV, Gate Pass', 'Consignee, Driver, Vehicle Plate, 3-Party Signatures'],
    ['Credit Note', 'A4 PDF, CSV, JSON', 'Original Invoice Ref, Reason, VAT Adjustment'],
    ['KRA VAT-3 Return Schedule', 'CSV / Excel Ready', 'Macro-ready fields matching official iTax portal upload'],
    ['Payroll Statutory CSV', 'CSV', 'KRA P10, NSSF, SHIF, and Housing Levy breakdown'],
    ['Employee Payslip', 'A4 PDF', 'Gross Pay, PAYE, NSSF, SHIF, Housing Levy, Net Pay'],
    ['Peripheral Hardware', 'USB/BT 1D/2D Scanners, ESC/POS 80mm & 58mm Thermal Printers, A4 Laser/Inkjet Printers', 'Plug-and-play']
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Document / Hardware', 'Supported Formats', 'Key Capabilities']],
    body: exportTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for shortcuts & footer
  if (cursorY > pageHeight - 35) {
    doc.addPage();
    cursorY = 20;
  }

  // Keyboard Shortcuts & Support Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KEYBOARD SHORTCUTS & OPERATIONAL ASSISTANCE', margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('• F2: Open POS Checkout   • F3: Camera Scanner   • F4: ETR Billing   • F8: Inventory Catalog   • F9: Transfers   • Esc: Close Modal', margin + 4, cursorY + 12);
  doc.text('Technical Documentation & Architecture Manual • Generated from Taji Textile ERP Platform', margin + 4, cursorY + 17);

  // Add Page Numbers
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Taji Textile ERP Manual • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(filename);
};
