# Taji — Enterprise Multi-Device Textile ERP & Billing System

**Taji** is a modern, high-performance, multi-device Enterprise Resource Planning (ERP) platform purpose-built for textile manufacturers, fabric wholesalers, and retail chains. It features real-time cloud data synchronization, multi-store inventory routing, KRA TIMS ETR 16% VAT & 5% Withholding Tax (WHT) fiscal compliance, automated double-entry accounting, Kenya statutory payroll, zero-effort accountant counterchecking & 1-click filing packs (PDF & CSV), POS barcode scanning with sound feedback, and multi-format document exporting (PDF, CSV, JSON, TXT).

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Core Functional Modules](#core-functional-modules)
   - [1. Executive Hub & Analytics Dashboard](#1-executive-hub--analytics-dashboard)
   - [2. Autonomous Branches & Multi-Store Management](#2-autonomous-branches--multi-store-management)
   - [3. Point of Sale (POS) & Checkout Engine](#3-point-of-sale-pos--checkout-engine)
   - [4. Textile Inventory & Roll Tare Management](#4-textile-inventory--roll-tare-management)
   - [5. Inter-Store Inventory Transfers & Waybills](#5-inter-store-inventory-transfers--waybills)
   - [6. KRA TIMS ETR Billing, Invoicing & Documents](#6-kra-tims-etr-billing-invoicing--documents)
   - [7. Financial Accounting & Double-Entry Ledger](#7-financial-accounting--double-entry-ledger)
   - [8. Accountant Zero-Effort Countercheck & Filing Suite](#8-accountant-zero-effort-countercheck--filing-suite)
   - [9. HR & Kenya Statutory Payroll (PAYE, NSSF, SHIF, Housing Levy)](#9-hr--kenya-statutory-payroll)
   - [10. POS Operators, Roles & PIN Security](#10-pos-operators-roles--pin-security)
   - [11. Audit Trails & Forensic System Logs](#11-audit-trails--forensic-system-logs)
   - [12. Gmail Inbox & Workspace Communications](#12-gmail-inbox--workspace-communications)
3. [Document Generation & Export Engine](#document-generation--export-engine)
4. [Hardware & Peripheral Support](#hardware--peripheral-support)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Security & Role-Based Access Control (RBAC)](#security--role-based-access-control-rbac)
7. [Installation & Deployment](#installation--deployment)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TAJI TEXTILE ERP PLATFORM                          │
├────────────────────────┬──────────────────────────┬─────────────────────────┤
│    CLIENT INTERFACE    │    BUSINESS LOGIC CORE   │   DATA & COMPLIANCE     │
│  • React 19 + Vite     │  • ERP State Engine      │  • Cloud Firestore Sync │
│  • Tailwind CSS v4     │  • Barcode & Dual Audio  │  • KRA TIMS 16% VAT     │
│  • Motion Animations   │  • Role-Based Access     │  • 5% WHT Certificates  │
│  • Responsive Layouts  │  • Multi-Store Routing   │  • PDF / CSV Generators │
└────────────────────────┴──────────────────────────┴─────────────────────────┘
```

- **Universal Responsiveness**: Fully adaptive UI optimized for desktop workstations, POS counter terminals, handheld mobile scanners, and tablet displays.
- **Real-Time Data Layer**: Persistent synchronization across all operational branches, main warehouses, and cash tills via Cloud Firestore.
- **Offline Resilient**: Local fallback caching ensuring continuous checkout continuity during temporary connectivity drops.

---

## Core Functional Modules

### 1. Executive Hub & Analytics Dashboard
- **Revenue & Gross Profit Tracking**: Live charts tracking daily, weekly, and monthly sales volume, gross margins, and VAT collections.
- **Real-Time Stock Valuation**: Aggregate asset valuation broken down across wholesale main stores and retail front desks.
- **Top Moving Textile Lines**: Instant ranking of high-velocity fabrics (Cotton Drill, Linen, Silk, Khaki, Polyester, Denim, Wool, Poplin).
- **Branch Performance Comparison**: Side-by-side branch turnover, conversion rates, and pending inter-branch transfers.

### 2. Autonomous Branches & Multi-Store Management
- **Branch Directory**: Manage physical branches (e.g., *Nairobi Central Store*, *Mombasa Road Depot*, *Industrial Area Main Warehouse*, *Store 1 & Store 2 Transfer Hubs*).
- **Location-Specific Stocking**: Stock quantities are tracked per-location with independent reorder points and designated floor managers.
- **Autonomous Till Reconciliation**: End-of-day cash drawer counts, M-Pesa float audits, and variance tracking per branch.

### 3. Point of Sale (POS) & Checkout Engine
- **High-Velocity Barcode & Camera Scanning**: Scan 1D barcodes and 2D QR codes with instant optical detection and high-frequency synthesized audio feedback (880Hz to 1760Hz).
- **Flexible Pricing Tiers**: Automated price application based on customer classification (Retail, Wholesale, Contractor, Export).
- **Tender Types Supported**:
  - **M-Pesa**: Direct Till & Paybill reference tracking.
  - **Cash**: Automated change calculation with denomination helper.
  - **Bank Transfer / RTGS**: Wire reference verification.
  - **Credit / Debit Cards**: Point-of-Sale swipe/chip reference logging.
  - **Cheque**: Corporate cheque number and clearance tracking.
- **Withholding Tax (5% WHT)**: Toggle 5% WHT deduction for government parastatals and corporate clients, recording certificate numbers on receipts.
- **Stock Routing & Store Selection**: Dispatch goods from local shop inventory or directly route fulfillment from the central warehouse.

### 4. Textile Inventory & Roll Tare Management
- **Textile-Specific Units**: Native support for Meters, Yards, Rolls, Pieces, and Kilograms.
- **Dual-Weight & Fabric Tare Deduction**: Automatic net billable weight calculation deducting spool/core/packaging tare weights from gross scale readings.
- **Roll & Bale Tracking**: Record specific roll IDs, dye lot/shade numbers, fabric composition, and weight (GSM).
- **Smart Catalog Search**: Fuzzy instant search by SKU, barcode, fabric category, color tone, or supplier code.
- **Reorder Threshold Alerts**: Visual indicators and automated low-stock warnings when inventory drops below safety buffers.
- **Duplicate Barcode Prevention**: Automatic validation preventing duplicate barcode assignments across SKUs.

### 5. Inter-Store Inventory Transfers & Waybills
- **4-Stage State Machine**:
  1. `Draft / Requested`: Initiated by destination store.
  2. `Approved`: Authorized by central inventory controller.
  3. `Dispatched / In-Transit`: Waybill issued with driver & vehicle registration details.
  4. `Received & Reconciled`: Stock automatically credited to destination ledger and debited from source warehouse.
- **Printed Transfer Waybills**: Formatted A4 gate passes and delivery sheets with physical signature blocks.

### 6. KRA TIMS ETR Billing, Invoicing & Documents
- **KRA TIMS eTIMS Tax Invoices**: Full statutory compliance with KRA PIN, CU serial numbers, 16% Output VAT breakdown, and verified fiscal QR codes.
- **Commercial Quotations & Proformas**: Generate formal estimates with customizable validity periods without prematurely reserving inventory.
- **One-Click Quotation-to-Invoice Conversion**: Seamlessly convert approved quotes into fiscal tax invoices and adjust stock in real-time.
- **Goods Delivery Notes & Waybills**: Formal dispatch documentation recording consignee address, vehicle registration, driver details, roll/package counts, and 3-party sign-offs (*Storekeeper*, *Driver*, *Customer*).
- **eTIMS Credit Notes**: Issue partial or full invoice reversals with linked credit notes and automatic ledger reconciliation.
- **Document Exporter**: Instant download of individual or master batch registers in **PDF**, **Excel/CSV**, **80mm Thermal Slip**, and **JSON**.

### 7. Financial Accounting & Double-Entry Ledger
- **Automated Balancing Engine**: Every sales transaction, transfer cost, expense, and payroll disbursement automatically posts balanced debits and credits.
- **Chart of Accounts**:
  - *Cash & Bank Balances (1010)*
  - *M-Pesa Float Account (1020)*
  - *Inventory Assets (1200)*
  - *Accounts Receivable (1100)*
  - *KRA Output VAT 16% Liability (2100)*
  - *KRA Withholding Tax 5% Receivable (1150)*
  - *Accounts Payable (2000)*
  - *Sales Revenue (4000)*
  - *Cost of Goods Sold (5000)*
  - *Payroll & Statutory Liabilities (2200)*
- **Journal Entries & Trial Balance**: Real-time visibility into financial statements with date filtering and CSV export.

### 8. Accountant Zero-Effort Countercheck & Filing Suite
- **Pre-Audited Automated Reconciliation**:
  - **Debit = Credit Equilibrium**: Automated check ensuring total general ledger entries balance with zero variance.
  - **Sales vs. ETR Register Match**: Real-time verification matching POS transactions to eTIMS fiscal invoices.
  - **Till Float & M-Pesa Reconciliation**: Reconciles daily drawer collections against expected tender totals.
  - **Statutory Tax Validation**: Flags missing customer KRA PINs, unremitted WHT certificates, or abnormal manual cashier discounts.
- **1-Click Statutory Tax & Audit Export Packs**:
  - **KRA iTax VAT-3 Ready CSV**: Structured to match KRA's official iTax upload macro template (*Purchaser PIN*, *CU Invoice Number*, *Taxable Base*, *VAT Amount*).
  - **Unified Payroll Statutory CSV**: Ready for direct upload to KRA P10 (PAYE), NSSF, SHIF, and Affordable Housing Levy portals.
  - **Master Audit Dossier (PDF)**: Executive financial statements including Income Statement (P&L), Balance Sheet, and Trial Balance.
  - **General Ledger CSV**: Full debit/credit transaction export for external ERP and audit software.

### 9. HR & Kenya Statutory Payroll
- **Kenya Statutory Deductions Compliant**:
  - **PAYE (Income Tax)**: Progressive tax brackets (10%, 25%, 30%, 32.5%, 35%) with personal relief applied.
  - **NSSF (Social Security)**: Tier I and Tier II statutory contributions.
  - **SHIF (Social Health Insurance Fund)**: 2.75% gross salary deduction.
  - **Affordable Housing Levy (AHL)**: 1.5% employee contribution + 1.5% employer matching.
- **Automated Payslip Generation**: Formatted PDF payslips with breakdown of earnings, deductions, net salary, and tax PINs.

### 10. POS Operators, Roles & PIN Security
- **Multi-Operator Profiles**: Setup individual cashiers, storekeepers, supervisors, and administrative users.
- **PIN Lock & Fast Switch**: Operators quickly log in and out with personal numeric security PINs.
- **Operator Audit Trail**: Every sale, price override, discount, and refund is strictly tied to the active operator ID.

### 11. Audit Trails & Forensic System Logs
- **Immutable Log Register**: Records user actions, timestamps, affected document IDs, and before/after payloads.
- **Security Alerts**: Flags suspicious events such as abnormal discounts, manual stock adjustments, or failed PIN entries.

### 12. Gmail Inbox & Workspace Communications
- **Client-Side OAuth Workspace Integration**: View customer order inquiries, send quotations, and receive supplier delivery notes directly inside the ERP interface.

---

## Document Generation & Export Engine

| Document Type | Primary Formats | Key Features & Metadata |
|---|---|---|
| **Tax Invoice (eTIMS)** | PDF (A4), CSV, Thermal Slip, JSON | KRA PIN, CU Serial, 16% VAT, 5% WHT, QR Code |
| **Quotation / Proforma** | PDF (A4), CSV, JSON | Validity Days, Terms, 1-Click Convert to Invoice |
| **Receipt (ETR)** | 80mm Slip, PDF, JSON | Fiscal Receipt #, Cashier Name, Tender Breakdown |
| **Delivery Note / Waybill** | PDF (A4), CSV, Gate Pass | Consignee, Driver, Vehicle Plate, 3-Party Signatures |
| **Credit Note** | PDF (A4), CSV, JSON | Original Invoice Ref, Reason, VAT Adjustment |
| **KRA iTax VAT-3 CSV** | CSV | Macro-ready fields for monthly VAT return filing |
| **Payroll Statutory CSV** | CSV | PAYE P10, NSSF, SHIF, Housing Levy schedule |
| **General Ledger & Trial Balance** | CSV, PDF | Chart of accounts, balanced debits/credits |
| **Employee Payslip** | PDF (A4) | Gross Pay, PAYE, NSSF, SHIF, Housing Levy, Net Pay |
| **Documentation Manual** | Markdown (.md), PDF, TXT | Complete offline documentation & reference guide |

---

## Hardware & Peripheral Support

- **Barcode Scanners**: USB & Bluetooth 1D/2D Scanners, Integrated Camera Barcode/QR readers with synthesized audio chimes.
- **Thermal Receipt Printers**: Standard 80mm & 58mm ESC/POS USB, Ethernet, and Bluetooth printers.
- **Standard Laser / Inkjet Printers**: A4 Commercial Invoices, Quotations, Waybills, and Payslips.

---

## Keyboard Shortcuts

- `F2` — Open POS Checkout Screen
- `F3` — Trigger Camera / Barcode Scanner Modal
- `F4` — Open Billing & Invoicing Engine
- `F8` — Open Inventory Catalog
- `F9` — Open Stock Transfers
- `Escape` — Close Active Modal / Return to Workspace

---

## Security & Role-Based Access Control (RBAC)

1. **Super Admin**: Complete access to all modules, financial ledgers, payroll, settings, and branch management.
2. **Store Manager**: Access to POS, Catalog, Inventory Intake, Transfers, Quotations, and Operator Oversight.
3. **Cashier / POS Operator**: Restricted to active POS checkout, receipt issuance, and personal cash drawer reconciliation.
4. **Accountant / Auditor**: Direct access to the Zero-Effort Countercheck & Filing Center, general ledger, VAT-3/PAYE downloads, and audit logs.

---

## Installation & Deployment

### Development Mode
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build & Container Execution
```bash
# Compile client assets & build server bundle
npm run build

# Start production server
npm run start
```

---

*© 2026 Taji Textile ERP. All Rights Reserved. Built for high-volume enterprise operations.*

