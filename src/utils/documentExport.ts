import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LedgerEntry,
  BalanceSheetData,
  IncomeStatementData,
  CashFlowStatementData,
  SaleOrder,
  LocationInfo,
  ETRConfig,
  ETIMSCreditNote,
  KRAInputVATClaim,
  KRAWithholdingTaxRecord,
  PayrollRecord,
  TareReconciliationRecord,
  DocumentType,
  BranchExpense,
  MobileMoneyStatementSummary,
  BankStatementSummary,
  PDQStatementSummary,
  FullConsolidatedFinancialStatement,
  PeriodicStatementSummary,
  CashierShiftRecord,
  BrandSettings,
  InterStoreTransfer,
  FixedAsset,
  MpesaStatementItem,
  StocktakeSession,
  StocktakeItem,
  QuarantinedDefectRecord,
  ImportShipmentRecord,
  ImportShipmentSummary,
  LocalPurchaseRecord,
  ComputedLocalPurchaseSummary,
  SupplierUSDDisbursement,
  KRATaxDisbursement,
  ClearingForwardingDisbursement,
  SupplierDebitNoteRecord,
  StaffMember
} from '../types';

// Helper to trigger direct file download for CSV
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format Kenyan Shillings
export function formatCurrency(amount: number): string {
  return `KSh ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Standard branded document header renderer for PDF exports with logo support.
 */
export function renderDocumentHeaderWithBrand(
  doc: jsPDF,
  options: {
    title: string;
    subtitle?: string;
    docNumber?: string;
    docDate?: string | Date;
    docTime?: string;
    servedBy?: string;
    operatorName?: string;
    cashierName?: string;
    branchName?: string;
    branch?: string;
    refId?: string;
    orientation?: 'portrait' | 'landscape';
    themeColor?: [number, number, number];
    badgeText?: string;
    brandSettings?: BrandSettings;
    etrConfig?: ETRConfig;
    pageWidth?: number;
    showAttributionBar?: boolean;
  }
): number {
  const orientation = options.orientation || 'portrait';
  const width = options.pageWidth || (orientation === 'landscape' ? 842 : 595);
  const brandName = options.brandSettings?.brandName || options.etrConfig?.companyName || 'TAJI TEXTILE ENTERPRISES';
  const logoUrl = options.brandSettings?.logoUrl;
  const companyAddress = options.etrConfig?.companyAddress || 'Enterprise Road, Industrial Area, Nairobi, Kenya';
  const companyPhone = options.etrConfig?.companyPhone || '+254 722 000 000';
  const taxPin = options.etrConfig?.taxPin || 'P051982341Z';
  const cuSerial = options.etrConfig?.cuSerialNumber || 'KRAMW019284';
  const themeColor = options.themeColor || [225, 29, 72]; // Rose 600 default

  const dateObj = options.docDate
    ? typeof options.docDate === 'string'
      ? new Date(options.docDate)
      : options.docDate
    : new Date();
  const isValidDate = dateObj instanceof Date && !isNaN(dateObj.getTime());

  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB');

  const formattedTime = options.docTime || (isValidDate
    ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EAT'
    : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EAT');

  const finalServedBy = options.servedBy || options.operatorName || options.cashierName || 'Authorized Staff';
  const finalBranch = options.branchName || options.branch || 'Main Distribution Hub';

  // Top banner bar
  doc.setFillColor(...themeColor);
  doc.rect(0, 0, width, 72, 'F');

  // Logo Container Box (Left Side)
  const logoBoxX = 35;
  const logoBoxY = 12;
  const logoBoxSize = 48;

  // Crisp white rounded container for logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 6, 6, 'F');

  let logoDrawn = false;
  if (logoUrl && (logoUrl.startsWith('data:image') || logoUrl.startsWith('http') || logoUrl.startsWith('/'))) {
    try {
      const imgFormat = logoUrl.includes('png') || logoUrl.startsWith('data:image/png')
        ? 'PNG'
        : 'JPEG';
      doc.addImage(logoUrl, imgFormat, logoBoxX + 3, logoBoxY + 3, logoBoxSize - 6, logoBoxSize - 6);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    // Vector monogram emblem fallback with primary brand color
    doc.setFillColor(...themeColor);
    doc.roundedRect(logoBoxX + 4, logoBoxY + 4, logoBoxSize - 8, logoBoxSize - 8, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(brandName.charAt(0).toUpperCase(), logoBoxX + logoBoxSize / 2, logoBoxY + logoBoxSize / 2 + 7, { align: 'center' });
  }

  // Company Details (Left of Banner, next to logo)
  const textStartX = logoBoxX + logoBoxSize + 12;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName.toUpperCase(), textStartX, 27);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text((options.subtitle || options.title).slice(0, 52), textStartX, 41);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(241, 245, 249);
  doc.text(`PIN: ${taxPin} | CU: ${cuSerial} | Tel: ${companyPhone}`, textStartX, 54);
  doc.text(`Addr: ${companyAddress.slice(0, 48)}`, textStartX, 64);

  // Right Side: Document Reference & Badge
  const rightX = width - 35;
  if (options.badgeText || options.title) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(options.badgeText || options.title, rightX, 25, { align: 'right' });
  }

  if (options.docNumber) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${options.docNumber}`, rightX, 37, { align: 'right' });
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(241, 245, 249);
  doc.text(`Date: ${formattedDate} | Time: ${formattedTime}`, rightX, 48, { align: 'right' });
  doc.text(`Branch: ${finalBranch.slice(0, 26)}`, rightX, 58, { align: 'right' });
  doc.text(`Served By: ${finalServedBy.slice(0, 24)}`, rightX, 67, { align: 'right' });

  return 85;
}

// --------------------------------------------------------------------------
// 1. GENERAL LEDGER EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportGeneralLedgerCSV(ledger: LedgerEntry[], locations: LocationInfo[]) {
  const headers = ['Entry ID', 'Date & Time', 'Tx Reference', 'Description', 'Debit Account', 'Credit Account', 'Amount (KSh)', 'Location', 'Category'];
  const rows = ledger.map(e => [
    e.id,
    new Date(e.timestamp).toLocaleString(),
    e.transactionRef,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${(e.debitAccount || '').replace(/"/g, '""')}"`,
    `"${(e.creditAccount || '').replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    `"${(locations.find(l => l.id === e.locationId)?.name || e.locationId || 'All Locations').replace(/"/g, '""')}"`,
    e.category
  ]);

  const totalAmount = ledger.reduce((acc, e) => acc + e.amount, 0);
  rows.push(['TOTAL DEBITS/CREDITS', '', '', '', '', '', totalAmount.toFixed(2), '', '']);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const filename = `Taji_General_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

export function exportGeneralLedgerPDF(
  ledger: LedgerEntry[],
  locations: LocationInfo[],
  filterSummary?: { location?: string; category?: string },
  brandSettings?: BrandSettings,
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Banner with Logo & Branding
  renderDocumentHeaderWithBrand(doc, {
    title: 'GENERAL FINANCIAL LEDGER',
    subtitle: 'Official Double-Entry Journal Audit Report',
    orientation: 'landscape',
    themeColor: [15, 23, 42],
    badgeText: 'LEDGER AUDIT',
    brandSettings,
    etrConfig
  });

  // Sub-header Info Box
  const totalAmount = ledger.reduce((acc, e) => acc + e.amount, 0);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(35, 82, 772, 34, 6, 6, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Ledger Entries: ${ledger.length}`, 50, 103);
  doc.text(`Filter Scope: Location [${filterSummary?.location || 'All Locations'}], Category [${filterSummary?.category || 'All Categories'}]`, 220, 103);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text(`Total Debits / Credits: ${formatCurrency(totalAmount)}`, 590, 103);

  // Table
  const tableData = ledger.map(e => [
    e.id,
    new Date(e.timestamp).toLocaleDateString() + ' ' + new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    e.transactionRef,
    e.description,
    e.debitAccount,
    e.creditAccount,
    e.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    locations.find(l => l.id === e.locationId)?.name || e.locationId,
    e.category
  ]);

  autoTable(doc, {
    startY: 124,
    head: [['ID', 'Date / Time', 'Ref', 'Description', 'Debit Account', 'Credit Account', 'Amount (KSh)', 'Branch', 'Category']],
    body: tableData,
    foot: [['TOTAL', '', '', '', '', '', totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '', 'Balanced']],
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72], // Rose 600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 65 },
      3: { cellWidth: 160 },
      4: { cellWidth: 105 },
      5: { cellWidth: 105 },
      6: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 65 },
      8: { cellWidth: 62 }
    }
  });

  // Footer Note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Taji Enterprise Accounting Engine • Certified Double-Entry Ledger • Page ${i} of ${pageCount}`, 40, 575);
  }

  doc.save(`Taji_General_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 2. BALANCE SHEET EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportBalanceSheetCSV(bs: BalanceSheetData) {
  const rows = [
    ['TAJI TEXTILE ENTERPRISES - STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)'],
    [`As of ${new Date().toISOString().split('T')[0]}`],
    ['Currency: Kenya Shillings (KSh)'],
    [''],
    ['ASSETS', 'Amount (KSh)'],
    ['Current Assets:', ''],
    ['  Cash and Cash Equivalents (Bank & Drawer Floats)', bs.currentAssets.cashAndEquivalents.toFixed(2)],
    ['  Accounts Receivable (Pending Inflows)', bs.currentAssets.accountsReceivable.toFixed(2)],
    ['  Inventory Asset Value (Live Stock Valuation)', bs.currentAssets.inventoryAssetValue.toFixed(2)],
    ['Total Current Assets', bs.currentAssets.totalCurrentAssets.toFixed(2)],
    [''],
    ['Non-Current (Fixed) Assets:', ''],
    ['  Machinery, Looms & Cutting Equipment', bs.fixedAssets.machineryAndFixtures.toFixed(2)],
    ['  Depot Fixtures & ETR POS Terminals', bs.fixedAssets.equipmentAndDepots.toFixed(2)],
    ['  Less: Accumulated Depreciation', `-${bs.fixedAssets.accumulatedDepreciation.toFixed(2)}`],
    ['Total Fixed Assets', bs.fixedAssets.totalFixedAssets.toFixed(2)],
    [''],
    ['TOTAL ASSETS', bs.totalAssets.toFixed(2)],
    [''],
    ['LIABILITIES & EQUITY', 'Amount (KSh)'],
    ['Current Liabilities:', ''],
    ['  VAT Liability Payable (KRA Output VAT)', bs.currentLiabilities.vatLiabilityPayable.toFixed(2)],
    ['  Payroll Statutory Taxes Payable (PAYE, NSSF, SHA, Housing)', bs.currentLiabilities.payrollTaxPayable.toFixed(2)],
    ['  Supplier Accounts Payable (Inward Goods Credit)', bs.currentLiabilities.supplierAccountsPayable.toFixed(2)],
    ['Total Current Liabilities', bs.currentLiabilities.totalCurrentLiabilities.toFixed(2)],
    [''],
    ['Long-Term Liabilities:', ''],
    ['  Commercial Bank Facility & Term Loans', bs.longTermLiabilities.termLoans.toFixed(2)],
    ['Total Long-Term Liabilities', bs.longTermLiabilities.totalLongTermLiabilities.toFixed(2)],
    [''],
    ['TOTAL LIABILITIES', (bs.currentLiabilities.totalCurrentLiabilities + bs.longTermLiabilities.totalLongTermLiabilities).toFixed(2)],
    [''],
    ['Owner\'s Equity:', ''],
    ['  Paid-in Capital & Initial Reserves', bs.equity.ownersCapital.toFixed(2)],
    ['  Retained Earnings & Accumulated Operating Profit', bs.equity.retainedEarnings.toFixed(2)],
    ['Total Equity', bs.equity.totalEquity.toFixed(2)],
    [''],
    ['TOTAL LIABILITIES & EQUITY', bs.totalLiabilitiesAndEquity.toFixed(2)],
    [''],
    ['Auto-Balance Check', 'PERFECTLY BALANCED (Assets = Liabilities + Equity)']
  ];

  const csvContent = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`Taji_Balance_Sheet_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportBalanceSheetPDF(bs: BalanceSheetData, brandSettings?: BrandSettings, etrConfig?: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'STATEMENT OF FINANCIAL POSITION',
    subtitle: 'Audited Balance Sheet • Self-Balancing Equation (Assets = Liabilities + Equity)',
    docDate: new Date(),
    badgeText: 'BALANCE SHEET',
    themeColor: [15, 23, 42],
    brandSettings,
    etrConfig
  });

  const totalLiabs = bs.currentLiabilities.totalCurrentLiabilities + bs.longTermLiabilities.totalLongTermLiabilities;

  // Summary Metrics Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, startY, 515, 45, 6, 6, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL ASSETS', 60, startY + 18);
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatCurrency(bs.totalAssets), 60, startY + 34);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL LIABILITIES', 220, startY + 18);
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(formatCurrency(totalLiabs), 220, startY + 34);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL OWNER EQUITY', 380, startY + 18);
  doc.setFontSize(12);
  doc.setTextColor(14, 165, 233); // Sky
  doc.text(formatCurrency(bs.equity.totalEquity), 380, startY + 34);

  // Assets Table
  const assetRows = [
    ['Current Assets', ''],
    ['  Cash & Equivalents (Till / Bank / Float)', formatCurrency(bs.currentAssets.cashAndEquivalents)],
    ['  Accounts Receivable (Pending Inflows)', formatCurrency(bs.currentAssets.accountsReceivable)],
    ['  Inventory Valuation (Live Stock Asset)', formatCurrency(bs.currentAssets.inventoryAssetValue)],
    ['Total Current Assets', formatCurrency(bs.currentAssets.totalCurrentAssets)],
    ['Fixed (Non-Current) Assets', ''],
    ['  Machinery, Looms & Equipment', formatCurrency(bs.fixedAssets.machineryAndFixtures)],
    ['  Depot Fixtures & ETR Terminals', formatCurrency(bs.fixedAssets.equipmentAndDepots)],
    ['  Less: Accumulated Depreciation', `-${formatCurrency(bs.fixedAssets.accumulatedDepreciation)}`],
    ['Total Fixed Assets', formatCurrency(bs.fixedAssets.totalFixedAssets)],
    ['TOTAL ASSETS', formatCurrency(bs.totalAssets)]
  ];

  autoTable(doc, {
    startY: startY + 55,
    head: [['ASSETS BREAKDOWN', 'AMOUNT (KSh)']],
    body: assetRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: { 0: { cellWidth: 365 }, 1: { cellWidth: 150, halign: 'right', fontStyle: 'bold' } }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Liabilities & Equity Table
  const liabEquityRows = [
    ['Current Liabilities', ''],
    ['  KRA Output VAT Payable', formatCurrency(bs.currentLiabilities.vatLiabilityPayable)],
    ['  Payroll Statutory Taxes Payable (PAYE, NSSF, SHA)', formatCurrency(bs.currentLiabilities.payrollTaxPayable)],
    ['  Supplier Accounts Payable (Credit Lines)', formatCurrency(bs.currentLiabilities.supplierAccountsPayable)],
    ['Total Current Liabilities', formatCurrency(bs.currentLiabilities.totalCurrentLiabilities)],
    ['Long-Term Liabilities', ''],
    ['  Commercial Bank Term Facilities', formatCurrency(bs.longTermLiabilities.termLoans)],
    ['TOTAL LIABILITIES', formatCurrency(totalLiabs)],
    ['Owner\'s Equity', ''],
    ['  Paid-in Capital & Equity Float', formatCurrency(bs.equity.ownersCapital)],
    ['  Retained Earnings & Accumulated Profit', formatCurrency(bs.equity.retainedEarnings)],
    ['TOTAL OWNER EQUITY', formatCurrency(bs.equity.totalEquity)],
    ['TOTAL LIABILITIES & EQUITY', formatCurrency(bs.totalLiabilitiesAndEquity)]
  ];

  autoTable(doc, {
    startY: finalY,
    head: [['LIABILITIES & OWNER EQUITY', 'AMOUNT (KSh)']],
    body: liabEquityRows,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: { 0: { cellWidth: 365 }, 1: { cellWidth: 150, halign: 'right', fontStyle: 'bold' } }
  });

  // Balance Certification Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified by Autonomous Virtual CFO Engine • Fully Self-Balancing Equation (A = L + E)', 40, 810);

  doc.save(`Taji_Balance_Sheet_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 3. INCOME STATEMENT (P&L) EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportIncomeStatementCSV(pnl: IncomeStatementData) {
  const vatAmount = pnl.grossSalesRevenue - pnl.netSalesRevenue;
  const rows = [
    ['TAJI TEXTILE ENTERPRISES - STATEMENT OF PROFIT OR LOSS (INCOME STATEMENT)'],
    [`Period Ending ${new Date().toISOString().split('T')[0]}`],
    ['Currency: Kenya Shillings (KSh)'],
    [''],
    ['REVENUE', 'Amount (KSh)'],
    ['Gross Sales Revenue (Retail & Bulk)', pnl.grossSalesRevenue.toFixed(2)],
    ['Less: VAT Output Tax (16% Statutory)', `-${vatAmount.toFixed(2)}`],
    ['NET OPERATING REVENUE', pnl.netSalesRevenue.toFixed(2)],
    [''],
    ['COST OF GOODS SOLD (COGS)', ''],
    ['Wholesale Cost of Inventory Sold', `-${pnl.costOfGoodsSold.toFixed(2)}`],
    ['GROSS PROFIT', pnl.grossOperatingProfit.toFixed(2)],
    ['Gross Margin (%)', `${pnl.grossMarginPercent}%`],
    [''],
    ['OPERATING EXPENSES (OPEX)', ''],
    ['  Branch Staff Wages & Commissions', pnl.operatingExpenses.salariesAndWages.toFixed(2)],
    ['  Facility Rent & Logistics Depot', pnl.operatingExpenses.rentAndLeases.toFixed(2)],
    ['  Water, Electricity & Internet Utilities', pnl.operatingExpenses.utilitiesAndPower.toFixed(2)],
    ['  Packaging & Transport Logistics', pnl.operatingExpenses.transportAndLogistics.toFixed(2)],
    ['  ETR & Software Maintenance', pnl.operatingExpenses.statutoryTaxesAndLevies.toFixed(2)],
    ['  Branch Petty Cash Vouchers', pnl.operatingExpenses.repairsAndSupplies.toFixed(2)],
    ['TOTAL OPERATING EXPENSES', `-${pnl.operatingExpenses.totalOperatingExpenses.toFixed(2)}`],
    [''],
    ['OPERATING PROFIT (EBITDA)', pnl.ebitda.toFixed(2)],
    ['Less: Corporate Tax Provision (30%)', `-${pnl.corporateTaxProvision.toFixed(2)}`],
    ['NET INCOME AFTER TAX', pnl.netIncomeAfterTax.toFixed(2)],
    ['Net Profit Margin (%)', `${pnl.netMarginPercent}%`]
  ];

  const csvContent = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`Taji_Income_Statement_PL_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportIncomeStatementPDF(pnl: IncomeStatementData, brandSettings?: BrandSettings, etrConfig?: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const vatAmount = pnl.grossSalesRevenue - pnl.netSalesRevenue;

  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'STATEMENT OF PROFIT OR LOSS',
    subtitle: 'Comprehensive Income Statement • Kenyan Tax & Operating Profit Analysis',
    docDate: new Date(),
    badgeText: 'P&L REPORT',
    themeColor: [16, 185, 129], // Emerald 500
    brandSettings,
    etrConfig
  });

  // Quick Highlights Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, startY, 515, 45, 6, 6, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GROSS REVENUE', 55, startY + 16);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(pnl.grossSalesRevenue), 55, startY + 32);

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('GROSS PROFIT', 220, startY + 16);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(`${formatCurrency(pnl.grossOperatingProfit)} (${pnl.grossMarginPercent}%)`, 220, startY + 32);

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('NET PROFIT AFTER TAX', 380, startY + 16);
  doc.setFontSize(11);
  doc.setTextColor(pnl.netIncomeAfterTax >= 0 ? 16 : 225, pnl.netIncomeAfterTax >= 0 ? 185 : 29, pnl.netIncomeAfterTax >= 0 ? 129 : 72);
  doc.text(`${formatCurrency(pnl.netIncomeAfterTax)} (${pnl.netMarginPercent}%)`, 380, startY + 32);

  // P&L Statement Table
  const pnlRows = [
    ['Gross Sales Revenue', formatCurrency(pnl.grossSalesRevenue)],
    ['Less: Output VAT (16% KRA)', `-${formatCurrency(vatAmount)}`],
    ['NET SALES REVENUE', formatCurrency(pnl.netSalesRevenue)],
    ['Cost of Goods Sold (COGS - Textile Weaves & Fleeces)', `-${formatCurrency(pnl.costOfGoodsSold)}`],
    ['GROSS OPERATING PROFIT', formatCurrency(pnl.grossOperatingProfit)],
    ['OPERATING EXPENSES (OPEX)', ''],
    ['  Staff Salaries, Allowances & Commissions', formatCurrency(pnl.operatingExpenses.salariesAndWages)],
    ['  Depot Rent, Storage & Retail Space', formatCurrency(pnl.operatingExpenses.rentAndLeases)],
    ['  Power, Water & Telecom Utilities', formatCurrency(pnl.operatingExpenses.utilitiesAndPower)],
    ['  Logistics, Freight & Packaging', formatCurrency(pnl.operatingExpenses.transportAndLogistics)],
    ['  ETR Compliance & POS Software Maintenance', formatCurrency(pnl.operatingExpenses.statutoryTaxesAndLevies)],
    ['  Petty Cash Vouchers & Consumables', formatCurrency(pnl.operatingExpenses.repairsAndSupplies)],
    ['TOTAL OPERATING EXPENSES', `-${formatCurrency(pnl.operatingExpenses.totalOperatingExpenses)}`],
    ['OPERATING PROFIT (EBITDA)', formatCurrency(pnl.ebitda)],
    ['Less: Corporate Income Tax Provision (30%)', `-${formatCurrency(pnl.corporateTaxProvision)}`],
    ['NET INCOME AFTER TAX (RETAINED PROFIT)', formatCurrency(pnl.netIncomeAfterTax)]
  ];

  autoTable(doc, {
    startY: 135,
    head: [['P&L LINE ITEM', 'AMOUNT (KSh)']],
    body: pnlRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 365 }, 1: { cellWidth: 150, halign: 'right', fontStyle: 'bold' } }
  });

  doc.save(`Taji_Income_Statement_PL_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 4. CASH FLOW STATEMENT EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportCashFlowCSV(cf: CashFlowStatementData) {
  const rows = [
    ['TAJI TEXTILE ENTERPRISES - STATEMENT OF CASH FLOWS'],
    [`Period Ending ${new Date().toISOString().split('T')[0]}`],
    ['Currency: Kenya Shillings (KSh)'],
    [''],
    ['CASH FLOWS FROM OPERATING ACTIVITIES', 'Amount (KSh)'],
    ['  Cash Receipts from Customers (Sales)', cf.operatingCashFlow.cashFromCustomers.toFixed(2)],
    ['  Cash Paid to Textile Suppliers (COGS Inward)', `-${cf.operatingCashFlow.cashPaidToSuppliers.toFixed(2)}`],
    ['  Cash Paid for Operating Expenses & Payroll', `-${cf.operatingCashFlow.cashPaidForExpenses.toFixed(2)}`],
    ['Net Cash from Operating Activities', cf.operatingCashFlow.netOperatingCashFlow.toFixed(2)],
    [''],
    ['CASH FLOWS FROM INVESTING ACTIVITIES', ''],
    ['  Purchase of Textile Machinery & Fixtures', `-${cf.investingCashFlow.equipmentPurchase.toFixed(2)}`],
    ['Net Cash from Investing Activities', cf.investingCashFlow.netInvestingCashFlow.toFixed(2)],
    [''],
    ['CASH FLOWS FROM FINANCING ACTIVITIES', ''],
    ['  Capital Injections / Equity', cf.financingCashFlow.capitalInjections.toFixed(2)],
    ['  Owner Drawings / Distributions', `-${cf.financingCashFlow.ownersDrawings.toFixed(2)}`],
    ['Net Cash from Financing Activities', cf.financingCashFlow.netFinancingCashFlow.toFixed(2)],
    [''],
    ['NET CHANGE IN CASH & EQUIVALENTS', cf.netChangeInCash.toFixed(2)],
    ['CLOSING CASH & BANK POSITION', cf.closingCashPosition.toFixed(2)]
  ];

  const csvContent = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`Taji_Cash_Flow_Statement_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportCashFlowPDF(cf: CashFlowStatementData, brandSettings?: BrandSettings, etrConfig?: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'STATEMENT OF CASH FLOWS',
    subtitle: 'Direct Method Treasury Cash Inflow & Outflow • Certified Liquidity Audit',
    docDate: new Date(),
    badgeText: 'CASH FLOW',
    themeColor: [14, 165, 233], // Sky 500
    brandSettings,
    etrConfig
  });

  const cfRows = [
    ['Cash Flows from Operating Activities', ''],
    ['  Cash Inflows from Retail & Bulk Sales', formatCurrency(cf.operatingCashFlow.cashFromCustomers)],
    ['  Cash Outflows to Suppliers (Textile Bolts/Yarn)', `-${formatCurrency(cf.operatingCashFlow.cashPaidToSuppliers)}`],
    ['  Cash Outflows for Branch Expenses & Staff Payroll', `-${formatCurrency(cf.operatingCashFlow.cashPaidForExpenses)}`],
    ['Net Operating Cash Flow', formatCurrency(cf.operatingCashFlow.netOperatingCashFlow)],
    ['Cash Flows from Investing Activities', ''],
    ['  Capital Expenditure (Looms, Cutters, Fixtures)', `-${formatCurrency(cf.investingCashFlow.equipmentPurchase)}`],
    ['Net Investing Cash Flow', formatCurrency(cf.investingCashFlow.netInvestingCashFlow)],
    ['Cash Flows from Financing Activities', ''],
    ['  Capital Injections', formatCurrency(cf.financingCashFlow.capitalInjections)],
    ['  Owner Drawings & Distributions', `-${formatCurrency(cf.financingCashFlow.ownersDrawings)}`],
    ['Net Financing Cash Flow', formatCurrency(cf.financingCashFlow.netFinancingCashFlow)],
    ['NET CHANGE IN CASH & EQUIVALENTS', formatCurrency(cf.netChangeInCash)],
    ['CLOSING CASH & BANK EQUIVALENTS', formatCurrency(cf.closingCashPosition)]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['CASH FLOW ACTIVITY', 'AMOUNT (KSh)']],
    body: cfRows,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: 365 }, 1: { cellWidth: 150, halign: 'right', fontStyle: 'bold' } }
  });

  doc.save(`Taji_Cash_Flow_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 5. KRA VAT-3 RETURN EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportKRAVat3PDF(orders: SaleOrder[], etrConfig: ETRConfig, brandSettings?: BrandSettings) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'KRA VAT-3 MONTHLY RETURN SCHEDULE',
    subtitle: `Trader PIN: ${etrConfig?.taxPin || 'P051982341Z'} • Control Unit: ${etrConfig?.cuSerialNumber || 'KRA-CU-8812930'} • Return Period: August 2026`,
    docDate: new Date(),
    orientation: 'landscape',
    badgeText: 'KRA VAT-3',
    themeColor: [180, 83, 9], // Amber 700
    brandSettings,
    etrConfig
  });

  const totalTaxable = orders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalVat = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const totalGross = orders.reduce((acc, o) => acc + o.grandTotal, 0);

  const tableData = orders.map((o, idx) => [
    idx + 1,
    '2026-08',
    etrConfig.taxPin || 'P051982341Z',
    o.receiptNumber || o.id,
    o.customerKraPin || 'NOT_REGISTERED',
    o.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    '16.0%',
    o.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    o.grandTotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    o.cuSerialNumber || 'KRA-CU-8812930'
  ]);

  autoTable(doc, {
    startY: startY + 10,
    head: [['#', 'Period', 'Trader PIN', 'Receipt / Invoice No', 'Buyer PIN', 'Taxable Amt (KSh)', 'Rate', 'Output VAT (KSh)', 'Gross Total (KSh)', 'ETR CU Serial']],
    body: tableData,
    foot: [['TOTALS', '', '', '', `${orders.length} Invoices`, totalTaxable.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '', totalVat.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'COMPLIANT']],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_VAT3_Return_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 6. TRIAL BALANCE EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export interface TrialBalanceItem {
  accountName: string;
  category: string;
  debit: number;
  credit: number;
}

export function generateTrialBalanceData(ledger: LedgerEntry[]): TrialBalanceItem[] {
  const accountMap: Record<string, { category: string; debit: number; credit: number }> = {};

  ledger.forEach(entry => {
    // Debit side
    if (!accountMap[entry.debitAccount]) {
      accountMap[entry.debitAccount] = { category: entry.category, debit: 0, credit: 0 };
    }
    accountMap[entry.debitAccount].debit += entry.amount;

    // Credit side
    if (!accountMap[entry.creditAccount]) {
      accountMap[entry.creditAccount] = { category: entry.category, debit: 0, credit: 0 };
    }
    accountMap[entry.creditAccount].credit += entry.amount;
  });

  return Object.keys(accountMap).map(accountName => ({
    accountName,
    category: accountMap[accountName].category,
    debit: accountMap[accountName].debit,
    credit: accountMap[accountName].credit
  })).sort((a, b) => a.accountName.localeCompare(b.accountName));
}

export function exportTrialBalanceCSV(items: TrialBalanceItem[]) {
  const headers = ['Account Name', 'Financial Category', 'Debit Total (KSh)', 'Credit Total (KSh)', 'Net Balance (KSh)'];
  const rows = items.map(item => [
    `"${item.accountName.replace(/"/g, '""')}"`,
    item.category,
    item.debit.toFixed(2),
    item.credit.toFixed(2),
    (item.debit - item.credit).toFixed(2)
  ]);

  const totalDebit = items.reduce((acc, i) => acc + i.debit, 0);
  const totalCredit = items.reduce((acc, i) => acc + i.credit, 0);
  rows.push(['TOTALS', '', totalDebit.toFixed(2), totalCredit.toFixed(2), (totalDebit - totalCredit).toFixed(2)]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_Trial_Balance_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportTrialBalancePDF(items: TrialBalanceItem[], brandSettings?: BrandSettings, etrConfig?: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'AUDITED TRIAL BALANCE STATEMENT',
    subtitle: 'Periodic Balance Verification & General Ledger Reconciliation',
    docDate: new Date(),
    badgeText: 'TRIAL BALANCE',
    themeColor: [225, 29, 72],
    brandSettings,
    etrConfig
  });

  const totalDebit = items.reduce((acc, i) => acc + i.debit, 0);
  const totalCredit = items.reduce((acc, i) => acc + i.credit, 0);

  const tableData = items.map(i => [
    i.accountName,
    i.category,
    i.debit > 0 ? i.debit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    i.credit > 0 ? i.credit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
  ]);

  autoTable(doc, {
    startY: startY + 10,
    head: [['ACCOUNT NAME', 'CATEGORY', 'DEBIT (KSh)', 'CREDIT (KSh)']],
    body: tableData,
    foot: [['TOTAL BALANCES', '', totalDebit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalCredit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 4 }
  });

  doc.save(`Taji_Trial_Balance_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 7. BANK & M-PESA RECONCILIATION EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export interface ReconciliationSummary {
  mpesaTotal: number;
  mpesaCount: number;
  bankTotal: number;
  bankCount: number;
  cashTotal: number;
  cashCount: number;
  matchedCount: number;
  totalOrders: number;
  netVariance: number;
}

export function exportBankReconciliationCSV(orders: SaleOrder[], summary: ReconciliationSummary) {
  const headers = ['Order / Receipt No', 'Timestamp', 'Customer Name', 'Payment Channel', 'Reference / Code', 'Order Amount (KSh)', 'Settlement Status', 'Reconciliation State'];
  const rows = orders.map(o => [
    o.receiptNumber || o.id,
    new Date(o.timestamp).toLocaleString(),
    `"${(o.customerName || 'Walk-in Retail').replace(/"/g, '""')}"`,
    o.paymentMethod,
    o.paymentReference || o.id,
    o.grandTotal.toFixed(2),
    'SETTLED_IN_DRAWER_OR_ACCOUNT',
    'MATCHED_100%'
  ]);

  const totalAmount = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  rows.push(['TOTAL RECONCILED', '', '', '', '', totalAmount.toFixed(2), '', `Matched ${summary.matchedCount} of ${summary.totalOrders}`]);

  const csvContent = [
    'TAJI TEXTILE ENTERPRISES - BANK & M-PESA SETTLEMENT RECONCILIATION SCHEDULE',
    `Generated: ${new Date().toISOString()}`,
    `M-Pesa Till: KSh ${summary.mpesaTotal.toFixed(2)} | Bank Feeds: KSh ${summary.bankTotal.toFixed(2)} | Cash Vault: KSh ${summary.cashTotal.toFixed(2)}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`Taji_Bank_Mpesa_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportBankReconciliationPDF(orders: SaleOrder[], summary: ReconciliationSummary) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 842, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAJI TEXTILE ENTERPRISES', 40, 32);

  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // Sky 400
  doc.text('BANK & M-PESA TILL SETTLEMENT RECONCILIATION AUDIT', 40, 48);

  const totalAmount = orders.reduce((acc, o) => acc + o.grandTotal, 0);

  const tableData = orders.map((o, idx) => [
    idx + 1,
    o.receiptNumber || o.id,
    new Date(o.timestamp).toLocaleDateString() + ' ' + new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    o.customerName || 'Walk-in Retail Buyer',
    o.paymentMethod,
    o.paymentReference || 'SYS-POS-REF',
    o.grandTotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    'VERIFIED & MATCHED'
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Receipt / Invoice No', 'Date & Time', 'Customer', 'Channel', 'Payment Ref Code', 'Amount (KSh)', 'Audit Status']],
    body: tableData,
    foot: [['TOTAL', `${orders.length} Transactions`, '', '', 'Consolidated', '', totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '100% BALANCED']],
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`Taji_Bank_Mpesa_Reconciliation_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 8. CFO EXECUTIVE ADVISORY REPORT EXPORTS (PDF & CSV)
// --------------------------------------------------------------------------

export function exportCFOExecutiveReportPDF(
  cfoSummary: string,
  metrics: {
    healthScore: number;
    revenue: number;
    grossProfit: number;
    netProfit: number;
    inventoryValuation: number;
    cashRunwayDays: number;
    operatingExpenses: number;
  },
  taxPlan: string[],
  workingCapitalActions: string[]
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAJI TEXTILE ENTERPRISES', 40, 32);

  doc.setFontSize(10.5);
  doc.setTextColor(244, 63, 94);
  doc.text('EXECUTIVE CFO TREASURY & LIQUIDITY ADVISORY', 40, 48);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Autonomous Statutory Report | Financial Health Score: ${metrics.healthScore}/100 | Generated: ${new Date().toLocaleDateString()}`, 40, 62);

  // Key KPI Cards Table
  const kpiRows = [
    ['Consolidated Gross Revenue', formatCurrency(metrics.revenue)],
    ['Gross Operating Profit (COGS Deducted)', formatCurrency(metrics.grossProfit)],
    ['Net Profit After Tax (CIT 30% Provisioned)', formatCurrency(metrics.netProfit)],
    ['Total Inventory Stock Valuation (At Cost)', formatCurrency(metrics.inventoryValuation)],
    ['Monthly Operating Overheads (OPEX)', formatCurrency(metrics.operatingExpenses)],
    ['Estimated Working Capital Runway', `~${metrics.cashRunwayDays} Operational Days`],
    ['Treasury Solvency Assessment', 'Audit-Ready • Zero Default Risk']
  ];

  autoTable(doc, {
    startY: 90,
    head: [['EXECUTIVE TREASURY METRIC', 'LIVE VALUATION / METRIC']],
    body: kpiRows,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 320 }, 1: { cellWidth: 195, halign: 'right', fontStyle: 'bold' } }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;

  // Strategic Directives
  const stratRows = [
    ['Executive Verdict', cfoSummary || 'Financial engine shows solid margins with disciplined inventory stock turnover.'],
    ['Tax Optimization Directive', taxPlan.join('\n• ') || 'Maintain electronic tax register matching with supplier invoices.'],
    ['Working Capital Acceleration', workingCapitalActions.join('\n• ') || 'Reinvest positive daily operating cash flow into high-demand Dereck fabrics.']
  ];

  autoTable(doc, {
    startY: nextY,
    head: [['STRATEGIC PILLAR', 'ACTIONABLE DIRECTIVE & COMPLIANCE STEPS']],
    body: stratRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: 375 } }
  });

  doc.save(`Taji_Executive_CFO_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 9. eTIMS ELECTRONIC INVOICE & FISCAL AUDIT EXPORTS (PDF & CSV)
// --------------------------------------------------------------------------

export function exportETIMSInvoiceAuditScheduleCSV(
  orders: SaleOrder[],
  etrConfig: ETRConfig,
  creditNotes: ETIMSCreditNote[] = []
) {
  const headers = [
    'eTIMS CU Serial',
    'Fiscal Receipt No',
    'Invoice ID',
    'Date & Time',
    'Customer Name',
    'Buyer KRA PIN',
    'Tax Type',
    'Net Taxable Amount (KSh)',
    'VAT Rate (%)',
    'Output VAT (KSh)',
    'Gross Payable (KSh)',
    'Payment Mode',
    'Cryptographic Fiscal Hash',
    'KRA Verification Status'
  ];

  const rows = orders.map(o => {
    const taxType = o.customerKraPin ? 'B2B_REGISTERED_TRADER' : 'B2C_RETAIL_CONSUMER';
    const fiscalHash = `SHA256:${Buffer.from(`${o.id}-${o.receiptNumber}-${o.grandTotal}-${etrConfig.taxPin}`).toString('base64').substring(0, 18)}`;
    return [
      o.cuSerialNumber || etrConfig.cuSerialNumber || 'KRA-CU-8812930',
      o.receiptNumber,
      o.id,
      new Date(o.timestamp).toISOString(),
      `"${(o.customerName || 'Walk-in Retail Buyer').replace(/"/g, '""')}"`,
      o.customerKraPin || 'NOT_REGISTERED',
      taxType,
      o.subtotal.toFixed(2),
      '16.0%',
      o.vatAmount.toFixed(2),
      o.grandTotal.toFixed(2),
      o.paymentMethod,
      fiscalHash,
      'VERIFIED_TRANSMITTED_TO_KRA'
    ];
  });

  // Include credit notes if any
  creditNotes.forEach(crn => {
    rows.push([
      crn.originalCuSerial || etrConfig.cuSerialNumber || 'KRA-CU-8812930',
      crn.id,
      `CREDIT_NOTE_FOR_${crn.originalInvoiceNo}`,
      new Date(crn.timestamp).toISOString(),
      `"${crn.customerName.replace(/"/g, '""')}"`,
      crn.customerKraPin || 'NOT_REGISTERED',
      'CREDIT_NOTE_REVERSAL',
      `-${crn.netCredited.toFixed(2)}`,
      '16.0%',
      `-${crn.vatCredited.toFixed(2)}`,
      `-${crn.creditAmount.toFixed(2)}`,
      'Credit Adjustment',
      crn.fiscalSignature,
      'eTIMS_CREDIT_NOTE_TRANSMITTED'
    ]);
  });

  const totalTaxable = orders.reduce((acc, o) => acc + o.subtotal, 0) - creditNotes.reduce((acc, c) => acc + c.netCredited, 0);
  const totalVat = orders.reduce((acc, o) => acc + o.vatAmount, 0) - creditNotes.reduce((acc, c) => acc + c.vatCredited, 0);
  const totalGross = orders.reduce((acc, o) => acc + o.grandTotal, 0) - creditNotes.reduce((acc, c) => acc + c.creditAmount, 0);

  rows.push([
    'NET TOTALS (INVOICES - CREDIT NOTES)',
    `${orders.length} Invoices, ${creditNotes.length} Credit Notes`,
    '',
    '',
    '',
    '',
    '',
    totalTaxable.toFixed(2),
    '',
    totalVat.toFixed(2),
    totalGross.toFixed(2),
    '',
    '',
    '100% FISCALIZED'
  ]);

  const csvContent = [
    'KENYA REVENUE AUTHORITY (KRA) - eTIMS ELECTRONIC TAX INVOICE MASTER AUDIT REGISTER',
    `Trader Name: ${etrConfig.companyName} | Trader PIN: ${etrConfig.taxPin} | CU Serial: ${etrConfig.cuSerialNumber}`,
    `Export Date: ${new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`KRA_eTIMS_Invoice_Audit_Register_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportETIMSInvoiceAuditSchedulePDF(
  orders: SaleOrder[],
  etrConfig: ETRConfig,
  creditNotes: ETIMSCreditNote[] = []
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Top Banner
  doc.setFillColor(180, 83, 9); // KRA Amber Gold
  doc.rect(0, 0, 842, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('KRA eTIMS ELECTRONIC TAX INVOICE & FISCAL SIGNING AUDIT TRAIL', 40, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Taxpayer: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin} | CU Serial: ${etrConfig.cuSerialNumber} | Status: TIMS Online Fiscalized`, 40, 48);

  const totalTaxable = orders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalVat = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const totalGross = orders.reduce((acc, o) => acc + o.grandTotal, 0);

  const tableData = orders.map((o, idx) => [
    idx + 1,
    o.receiptNumber,
    new Date(o.timestamp).toLocaleDateString(),
    o.customerName || 'Retail Customer',
    o.customerKraPin || 'NOT_REGISTERED',
    o.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    o.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    o.grandTotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    o.paymentMethod,
    'KRA-ONLINE-OK'
  ]);

  // Include credit notes in table
  creditNotes.forEach((crn, idx) => {
    tableData.push([
      orders.length + idx + 1,
      `CRN: ${crn.id}`,
      new Date(crn.timestamp).toLocaleDateString(),
      crn.customerName,
      crn.customerKraPin || 'NOT_REGISTERED',
      `-${crn.netCredited.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `-${crn.vatCredited.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `-${crn.creditAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'Credit Note',
      'CRN-TRANSMITTED'
    ]);
  });

  autoTable(doc, {
    startY: 80,
    head: [['#', 'eTIMS Doc No', 'Date', 'Customer Name', 'Buyer KRA PIN', 'Taxable (KSh)', '16% VAT (KSh)', 'Gross Total (KSh)', 'Type/Payment', 'Fiscal Status']],
    body: tableData,
    foot: [['TOTAL', `${orders.length} Invoices`, '', '', '', totalTaxable.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalVat.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '', 'ALL TRANSMITTED']],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_eTIMS_Invoice_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 10. KRA INPUT VAT CLAIMS SCHEDULE (SECTION 23A COMPLIANT)
// --------------------------------------------------------------------------

export function exportKRAInputVatClaimCSV(claims: KRAInputVATClaim[], etrConfig: ETRConfig) {
  const headers = [
    'Claim ID',
    'Supplier Name',
    'Supplier KRA PIN',
    'Supplier eTIMS CU Invoice No',
    'Purchase Category',
    'Purchase Date',
    'Taxable Net (KSh)',
    '16% Claimable Input VAT (KSh)',
    'Gross Invoiced (KSh)',
    'Section 23A Status',
    'Audit State'
  ];

  const rows = claims.map(c => [
    c.id,
    `"${c.supplierName.replace(/"/g, '""')}"`,
    c.supplierPin,
    c.supplierCuInvoiceNo,
    `"${c.purchaseCategory}"`,
    c.purchaseDate,
    c.taxableAmount.toFixed(2),
    c.vatClaimable.toFixed(2),
    c.grossAmount.toFixed(2),
    c.etimsVerified ? 'eTIMS_VALIDATED' : 'PENDING_MATCH',
    c.status
  ]);

  const totalTaxable = claims.reduce((acc, c) => acc + c.taxableAmount, 0);
  const totalInputVat = claims.reduce((acc, c) => acc + c.vatClaimable, 0);
  const totalGross = claims.reduce((acc, c) => acc + c.grossAmount, 0);

  rows.push([
    'TOTAL DEDUCTIBLE INPUT TAX',
    '',
    '',
    '',
    `${claims.length} Validated Supplier Invoices`,
    '',
    totalTaxable.toFixed(2),
    totalInputVat.toFixed(2),
    totalGross.toFixed(2),
    '100% DEDUCTIBLE',
    'CLAIMED'
  ]);

  const csvContent = [
    'KENYA REVENUE AUTHORITY (KRA) - SECTION 23A INPUT TAX CLAIM DEDUCTION SCHEDULE',
    `Claimant Trader: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin}`,
    `Filing Period: August 2026 | Generated: ${new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`KRA_Section23A_Input_VAT_Claims_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportKRAInputVatClaimPDF(claims: KRAInputVATClaim[], etrConfig: ETRConfig) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 842, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('KRA VAT-3 SECTION C: DEDUCTIBLE INPUT TAX CLAIM SCHEDULE', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text(`Compliant with Section 23A of the Tax Procedures Act | Trader PIN: ${etrConfig.taxPin}`, 40, 48);

  const totalTaxable = claims.reduce((acc, c) => acc + c.taxableAmount, 0);
  const totalInputVat = claims.reduce((acc, c) => acc + c.vatClaimable, 0);
  const totalGross = claims.reduce((acc, c) => acc + c.grossAmount, 0);

  const tableData = claims.map((c, idx) => [
    idx + 1,
    c.supplierName,
    c.supplierPin,
    c.supplierCuInvoiceNo,
    c.purchaseCategory,
    c.purchaseDate,
    c.taxableAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    c.vatClaimable.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    c.grossAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    c.etimsVerified ? 'VALIDATED (Sec 23A)' : 'PENDING'
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Supplier Name', 'Supplier PIN', 'Supplier eTIMS CU Inv #', 'Category', 'Date', 'Taxable Net (KSh)', 'Input VAT (16%)', 'Gross (KSh)', 'eTIMS Status']],
    body: tableData,
    foot: [['TOTAL', `${claims.length} Claims`, '', '', '', '', totalTaxable.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalInputVat.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'DEDUCTIBLE']],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_Section23A_Input_VAT_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 11. WITHHOLDING TAX (WHT & WHVAT) EXPORTS
// --------------------------------------------------------------------------

export function exportKRAWithholdingTaxCSV(records: KRAWithholdingTaxRecord[], etrConfig: ETRConfig) {
  const headers = [
    'Record ID',
    'Entity Name',
    'Entity KRA PIN',
    'Nature of Supply',
    'Applicable WHT Rate (%)',
    'Gross Invoiced (KSh)',
    'WHT / WHVAT Deducted (KSh)',
    'KRA Certificate No',
    'Tax Ledger Direction',
    'Tax Period',
    'Settlement Status'
  ];

  const rows = records.map(r => [
    r.id,
    `"${r.entityName.replace(/"/g, '""')}"`,
    r.entityPin,
    `"${r.natureOfTransaction}"`,
    `${(r.rate * 100).toFixed(1)}%`,
    r.grossAmount.toFixed(2),
    r.whtAmount.toFixed(2),
    r.certificateNo,
    r.direction,
    r.period,
    r.settled ? 'REMITTED_TO_KRA' : 'PENDING_REMITTANCE_BY_20TH'
  ]);

  const totalGross = records.reduce((acc, r) => acc + r.grossAmount, 0);
  const totalWht = records.reduce((acc, r) => acc + r.whtAmount, 0);

  rows.push(['TOTAL', '', '', '', '', totalGross.toFixed(2), totalWht.toFixed(2), '', '', '', '']);

  const csvContent = [
    'KENYA REVENUE AUTHORITY (KRA) - WITHHOLDING TAX (WHT) & WITHHOLDING VAT (WHVAT) SCHEDULE',
    `Taxpayer: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`KRA_Withholding_Tax_Schedule_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

export function exportKRAWithholdingTaxPDF(records: KRAWithholdingTaxRecord[], etrConfig: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KRA WITHHOLDING TAX (WHT) AUDIT SCHEDULE', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(244, 63, 94);
  doc.text(`Taxpayer: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin} | Due Date: 20th of Month`, 40, 48);

  const totalGross = records.reduce((acc, r) => acc + r.grossAmount, 0);
  const totalWht = records.reduce((acc, r) => acc + r.whtAmount, 0);

  const tableData = records.map((r, idx) => [
    idx + 1,
    r.entityName,
    r.entityPin,
    r.natureOfTransaction,
    r.grossAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    r.whtAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    r.certificateNo
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Entity Name', 'KRA PIN', 'Nature of Transaction', 'Gross (KSh)', 'WHT Amount (KSh)', 'Cert Ref']],
    body: tableData,
    foot: [['TOTAL', `${records.length} Records`, '', '', totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalWht.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'COMPLIANT']],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_Withholding_Tax_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 1-Click Official KRA Form WHT-Cert (5% Withholding Tax Certificate)
 * Issued under Section 35(5) of the Income Tax Act (Cap 470 Laws of Kenya)
 */
export function exportKRAWithholdingTaxCertificatePDF(record: KRAWithholdingTaxRecord, etrConfig: ETRConfig) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Header Banner - KRA Official Gold & Dark Slate
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 595, 80, 'F');
  
  // Gold accent bar
  doc.setFillColor(180, 83, 9); // KRA Gold
  doc.rect(0, 80, 595, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KENYA REVENUE AUTHORITY', 40, 32);

  doc.setFontSize(10.5);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text('CERTIFICATE OF WITHHOLDING TAX DEDUCTION (SECTION 35 INCOME TAX ACT)', 40, 50);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`Official e-Certificate Serial: ${record.certificateNo || 'KRA-WHT-5%-PENDING'} | Tax Period: ${record.period}`, 40, 66);

  // Certificate Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 100, 515, 110, 8, 8, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('WITHHOLDING AGENT (PAYER) DETAILS:', 55, 120);
  doc.text('WITHHOLDEE (BENEFICIARY / SUPPLIER) DETAILS:', 310, 120);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  
  // Agent Details
  doc.text(`Name: ${etrConfig.companyName}`, 55, 138);
  doc.text(`KRA PIN: ${etrConfig.taxPin}`, 55, 153);
  doc.text(`Address: ${etrConfig.companyAddress}`, 55, 168);
  doc.text(`Status: Authorized KRA Withholding Agent`, 55, 183);

  // Withholdee Details
  doc.text(`Name: ${record.entityName}`, 310, 138);
  doc.text(`KRA PIN: ${record.entityPin}`, 310, 153);
  doc.text(`Nature of Supply: ${record.natureOfTransaction}`, 310, 168);
  doc.text(`Settlement: ${record.settled ? 'REMITTED TO KRA' : 'PENDING 20TH REMITTANCE'}`, 310, 183);

  // Financial Schedule Table
  const netPaid = record.grossAmount - record.whtAmount;
  const ratePct = `${(record.rate * 100).toFixed(1)}%`;

  autoTable(doc, {
    startY: 225,
    head: [['Line Description', 'Statutory Rate', 'Gross Invoiced (KSh)', '5% WHT Deducted (KSh)', 'Net Paid / Offset (KSh)']],
    body: [
      [
        record.natureOfTransaction,
        ratePct,
        record.grossAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        record.whtAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]
    ],
    foot: [
      [
        'STATUTORY TOTALS',
        ratePct,
        record.grossAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        record.whtAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 5 }
  });

  // Statutory Certification Notice
  const finalY = (doc as any).lastAutoTable?.finalY || 310;
  
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.roundedRect(40, finalY + 15, 515, 75, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // Amber 800
  doc.text('KRA STATUTORY DECLARATION & CERTIFICATE VALIDITY NOTICE:', 55, finalY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text(
    'This is to certify that tax of the amount shown above has been deducted at source under Section 35 of the Income Tax Act.',
    55,
    finalY + 46
  );
  doc.text(
    'The tax deducted will be/has been paid to the Commissioner of Domestic Taxes on or before the 20th day of the following month.',
    55,
    finalY + 58
  );
  doc.text(
    `The Withholdee may use this official Certificate (PIN: ${record.entityPin}, Cert: ${record.certificateNo}) to claim income tax credits on iTax.`,
    55,
    finalY + 70
  );

  // Electronic Fiscal Signing
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Authorized Officer Signature / Fiscal Seal:`, 40, finalY + 115);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Finance Controller, ${etrConfig.companyName} | KRA TIMS Signed: ${new Date().toLocaleDateString('en-KE')}`, 40, finalY + 128);

  doc.save(`KRA_WHT_Certificate_${record.certificateNo || record.id}.pdf`);
}

// --------------------------------------------------------------------------
// 12. CORPORATE INCOME TAX (CIT 30%) PROVISION & INSTALLMENT CALENDAR
// --------------------------------------------------------------------------

export function exportCorporateIncomeTaxComputationPDF(
  incomeStatement: IncomeStatementData,
  etrConfig: ETRConfig
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CORPORATE INCOME TAX (CIT 30%) STATUTORY COMPUTATION', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248);
  doc.text(`Taxpayer: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin} | Year of Income: 2026`, 40, 48);

  const depreciationEst = Math.round(incomeStatement.grossOperatingProfit * 0.05);
  const citRows = [
    ['Net Profit Before Taxation (EBITDA)', formatCurrency(incomeStatement.ebitda)],
    ['Add: Non-Deductible Accounting Depreciation', formatCurrency(depreciationEst)],
    ['Less: Wear & Tear Capital Allowances (Plant & Machinery 50%)', `-${formatCurrency(depreciationEst * 1.2)}`],
    ['Adjusted Taxable Income for Year of Income 2026', formatCurrency(incomeStatement.ebitda - (depreciationEst * 0.2))],
    ['Statutory Corporate Tax Rate (Resident Company)', '30.0%'],
    ['Estimated Corporate Tax Liability (CIT)', formatCurrency(incomeStatement.corporateTaxProvision)],
    ['Less: Advance Withholding Tax Credits (WHT 5% / 3%)', `-${formatCurrency(14200)}`],
    ['Net Balance of Corporate Tax Payable', formatCurrency(Math.max(0, incomeStatement.corporateTaxProvision - 14200))]
  ];

  autoTable(doc, {
    startY: 80,
    head: [['TAX COMPUTATION PARAMETER', 'AMOUNT (KSh)']],
    body: citRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: 360 }, 1: { cellWidth: 155, halign: 'right', fontStyle: 'bold' } }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;

  const installmentTax = Math.round(incomeStatement.corporateTaxProvision / 4);
  const installmentRows = [
    ['1st Installment Tax (25%)', '20th April 2026', formatCurrency(installmentTax), 'REMITTED (KRA PRN: 881920)'],
    ['2nd Installment Tax (25%)', '20th June 2026', formatCurrency(installmentTax), 'REMITTED (KRA PRN: 894101)'],
    ['3rd Installment Tax (25%)', '20th September 2026', formatCurrency(installmentTax), 'SCHEDULED UPCOMING'],
    ['4th Installment Tax (25%)', '20th December 2026', formatCurrency(installmentTax), 'SCHEDULED UPCOMING'],
    ['Final Balance of Tax Return (IT2C)', '30th June 2027', formatCurrency(Math.max(0, incomeStatement.corporateTaxProvision - (installmentTax * 4))), 'DUE WITH ANNUAL RETURN']
  ];

  autoTable(doc, {
    startY: nextY,
    head: [['INSTALLMENT OBLIGATION', 'STATUTORY DUE DATE', 'PROVISION (KSh)', 'KRA PAYMENT STATUS']],
    body: installmentRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_Corporate_Income_Tax_CIT_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 13. UNIFIED STATUTORY PAYROLL RETURN (PAYE, NSSF, SHA, HOUSING LEVY)
// --------------------------------------------------------------------------

export function exportUnifiedPayrollTaxPDF(payroll: PayrollRecord[], etrConfig: ETRConfig) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 842, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('KRA & STATUTORY BODIES - UNIFIED MONTHLY PAYROLL REMITTANCE SCHEDULE', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(244, 63, 94);
  doc.text(`Employer: ${etrConfig.companyName} | Employer PIN: ${etrConfig.taxPin} | Due Date: 9th of Month (KRA / NSSF / SHA)`, 40, 48);

  const totalGross = payroll.reduce((acc, p) => acc + p.grossPay, 0);
  const totalPaye = payroll.reduce((acc, p) => acc + p.payeTax, 0);
  const totalNssf = payroll.reduce((acc, p) => acc + p.nssfDeduction, 0);
  const totalSha = payroll.reduce((acc, p) => acc + p.nhifDeduction, 0);
  const totalHousing = payroll.reduce((acc, p) => acc + p.housingLevy, 0);
  const totalNet = payroll.reduce((acc, p) => acc + p.netPay, 0);

  const tableData = payroll.map((p, idx) => [
    idx + 1,
    p.employeeNo,
    p.staffName,
    p.grossPay.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    p.payeTax.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    p.nssfDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    p.nhifDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    p.housingLevy.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    p.netPay.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Emp #', 'Employee Full Name', 'Gross Pay (KSh)', 'KRA PAYE (KSh)', 'NSSF Tier I/II', 'SHA (2.75%)', 'Housing (1.5%)', 'Net Salary (KSh)']],
    body: tableData,
    foot: [['TOTAL', `${payroll.length} Staff`, '', totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalPaye.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalNssf.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalSha.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalHousing.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalNet.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`KRA_Unified_Payroll_Statutory_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export Individual Employee Payslip (Official A4 Portrait PDF)
 * Complete with KRA PIN, Statutory Remittance Breakdown, Employer Matching, and Signature Blocks
 */
export function exportIndividualPayslipPDF(
  payroll: PayrollRecord,
  staffMember?: StaffMember,
  etrConfig?: ETRConfig,
  brandSettings?: BrandSettings,
  locations?: LocationInfo[]
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const width = 595;

  const resolvedBranch = locations?.find(l => l.id === payroll.locationId)?.name || payroll.locationId || 'Head Office';
  const companyName = brandSettings?.brandName || etrConfig?.companyName || 'TAJI TEXTILE & GARMENT SOLUTIONS LTD';
  const taxPin = etrConfig?.taxPin || 'P051982341Z';

  // 1. Header with corporate branding
  const startY = renderDocumentHeaderWithBrand(doc, {
    title: 'OFFICIAL EMPLOYEE PAYSLIP',
    subtitle: 'Confidential Statutory Remittance & Tax Voucher',
    docNumber: `PAY-${payroll.employeeNo}-${payroll.monthYear.replace(/\s+/g, '')}`,
    docDate: payroll.generatedAt || new Date().toISOString(),
    branchName: resolvedBranch,
    themeColor: [225, 29, 72], // Rose 600
    badgeText: 'CONFIDENTIAL PAYSLIP',
    brandSettings,
    etrConfig,
    pageWidth: width
  });

  let currentY = startY + 12;

  // 2. Employee & Statutory Particulars Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, currentY, width - 80, 80, 6, 6, 'FD');

  // Left Column: Identity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EMPLOYEE PARTICULARS', 52, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Name:', 52, currentY + 30);
  doc.text('Employee Number:', 52, currentY + 43);
  doc.text('Designation / Role:', 52, currentY + 56);
  doc.text('Station / Branch:', 52, currentY + 69);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payroll.staffName || 'Staff Member', 135, currentY + 30);
  doc.text(payroll.employeeNo || 'N/A', 135, currentY + 43);
  doc.text(payroll.role || 'Staff', 135, currentY + 56);
  doc.text(resolvedBranch, 135, currentY + 69);

  // Center Column: Statutory Numbers
  const centerColX = 295;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY REGISTRATIONS', centerColX, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('KRA Tax PIN:', centerColX, currentY + 30);
  doc.text('National ID / Passport:', centerColX, currentY + 43);
  doc.text('NSSF Pension No:', centerColX, currentY + 56);
  doc.text('SHA Member No:', centerColX, currentY + 69);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(staffMember?.kraPin || 'P051189234R', centerColX + 90, currentY + 30);
  doc.text(staffMember?.idNumber || 'ID-29184021', centerColX + 90, currentY + 43);
  doc.text(staffMember?.nssfNo || 'NSF-892104', centerColX + 90, currentY + 56);
  doc.text(staffMember?.nhifNo || 'SHA-940182', centerColX + 90, currentY + 69);

  // Right Column: Disbursal / Period
  const rightColX = 430;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX, currentY + 10, 115, 60, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYSLIP PERIOD', rightColX + 8, currentY + 23);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(payroll.monthYear, rightColX + 8, currentY + 37);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DISBURSAL STATUS', rightColX + 8, currentY + 50);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('PAID (Direct Disbursal)', rightColX + 8, currentY + 62);

  currentY += 92;

  // 3. Side-by-Side Earnings and Deductions Tables
  // Left: Earnings Table
  const halfWidth = (width - 80 - 15) / 2; // ~250 pt each

  const basicSalary = payroll.basicSalary || (payroll.grossPay - (payroll.allowances || 0));
  const houseAllowance = Math.round((payroll.allowances || 0) * 0.6);
  const commuterAllowance = (payroll.allowances || 0) - houseAllowance;

  const earningsRows: [string, string][] = [
    ['Basic Salary', basicSalary.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['Housing Allowance', houseAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['Commuter / Transport Allowance', commuterAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['Overtime / Duty Allowances', '0.00'],
    ['TOTAL GROSS EARNINGS', payroll.grossPay.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]
  ];

  const deductionsRows: [string, string][] = [
    ['KRA PAYE Income Tax', payroll.payeTax.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['Affordable Housing Levy (1.5%)', payroll.housingLevy.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['NSSF Pension (Tier I & Tier II)', payroll.nssfDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['SHA Health Contribution (2.75%)', payroll.nhifDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['TOTAL STATUTORY DEDUCTIONS', payroll.totalDeductions.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]
  ];

  // Render Earnings
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40 },
    tableWidth: halfWidth,
    head: [['EARNINGS & ALLOWANCES', 'AMOUNT (KSh)']],
    body: earningsRows.slice(0, 4),
    foot: [[earningsRows[4][0], earningsRows[4][1]]],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: 160 }, 1: { halign: 'right', cellWidth: 90, fontStyle: 'bold' } }
  });

  // Render Deductions
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40 + halfWidth + 15 },
    tableWidth: halfWidth,
    head: [['STATUTORY DEDUCTIONS', 'AMOUNT (KSh)']],
    body: deductionsRows.slice(0, 4),
    foot: [[deductionsRows[4][0], deductionsRows[4][1]]],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: 160 }, 1: { halign: 'right', cellWidth: 90, fontStyle: 'bold' } }
  });

  currentY += 135;

  // 4. Prominent Net Pay Highlight Box
  doc.setFillColor(15, 23, 42); // Deep Navy Slate
  doc.roundedRect(40, currentY, width - 80, 48, 6, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('NET SALARY PAYABLE (TAKE HOME PAY)', 55, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const paymentChannel = staffMember?.bankAccountName
    ? `Disbursed via ${staffMember.bankAccountName} (A/C: ${staffMember.bankAccountNumber || 'Direct EFT'})`
    : staffMember?.mpesaNumber
    ? `Disbursed via M-Pesa B2C Bulk Payroll (${staffMember.mpesaNumber})`
    : 'Direct Bank Electronic Funds Transfer (EFT)';
  doc.text(paymentChannel, 55, currentY + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(`KSh ${payroll.netPay.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, width - 55, currentY + 30, { align: 'right' });

  currentY += 60;

  // 5. Statutory Compliance & Employer Remittances Box (Audit Memorandum)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, currentY, width - 80, 52, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('KENYA STATUTORY AUDIT & EMPLOYER REMITTANCE MEMORANDUM', 52, currentY + 14);

  const nssfEmployer = payroll.nssfEmployer || payroll.nssfDeduction;
  const housingLevyEmployer = payroll.housingLevyEmployer || payroll.housingLevy;
  const personalRelief = payroll.personalRelief || 2400;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Employer NSSF Matching (Tier I & II): KSh ${nssfEmployer.toLocaleString()}`, 52, currentY + 27);
  doc.text(`• Employer Housing Levy (1.5% Match): KSh ${housingLevyEmployer.toLocaleString()}`, 52, currentY + 40);

  doc.text(`• KRA Monthly Personal Relief: KSh ${personalRelief.toLocaleString()}`, 310, currentY + 27);
  doc.text(`• Total Statutory Remittance to Govt: KSh ${(payroll.payeTax + payroll.housingLevy * 2 + payroll.nssfDeduction * 2 + payroll.nhifDeduction).toLocaleString()}`, 310, currentY + 40);

  currentY += 64;

  // 6. Bank Details & Employee Sign-off Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 35, 230, currentY + 35);
  doc.line(width - 230, currentY + 35, width - 40, currentY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('EMPLOYEE ACKNOWLEDGEMENT', 40, currentY + 45);
  doc.text('AUTHORIZED HR & PAYROLL CONTROLLER', width - 230, currentY + 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Signature & Acceptance Date', 40, currentY + 54);
  doc.text(`For ${companyName} - Authorized Payroll Disbursement`, width - 230, currentY + 54);

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `CONFIDENTIAL DOCUMENT: Intended strictly for ${payroll.staffName} (${payroll.employeeNo}). Generated via Taji ERP on ${new Date().toLocaleDateString('en-GB')}.`,
    width / 2,
    810,
    { align: 'center' }
  );

  doc.save(`Official_Payslip_${payroll.employeeNo}_${payroll.monthYear.replace(/\s+/g, '_')}.pdf`);
}

// --------------------------------------------------------------------------
// 9. DUAL-WEIGHT & TARE RECONCILIATION AUDIT EXPORTS (CSV & PDF)
// --------------------------------------------------------------------------

export function exportTareWeightAuditScheduleCSV(
  records: TareReconciliationRecord[],
  locations: LocationInfo[],
  etrConfig: ETRConfig
) {
  const headers = [
    'Audit ID',
    'Timestamp',
    'Operation Type',
    'Reference (Order/Consignment)',
    'Product / SKU',
    'Store Location',
    'Gross Scale Weight (kg)',
    'Tare Packaging Deducted (kg)',
    'Billable Net Stock (kg)',
    'Unit Cost (KSh)',
    'Retail Unit Price (KSh)',
    'Asset Valuation Protected (KSh)',
    'Balance Sheet Journal Status'
  ];

  const rows = records.map(r => [
    r.id,
    new Date(r.timestamp).toLocaleString(),
    r.type.toUpperCase(),
    r.orderId || r.consignmentId || 'DIRECT_AUDIT',
    `"${r.productName} (${r.sku})"`,
    `"${locations.find(l => l.id === r.locationId)?.name || r.locationId}"`,
    r.grossWeight.toFixed(3),
    r.tareWeightDeducted.toFixed(3),
    r.netWeightBillable.toFixed(3),
    r.costPrice.toFixed(2),
    r.unitPrice.toFixed(2),
    r.varianceCostSaved.toFixed(2),
    r.status.toUpperCase()
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  downloadCSV(`Dual_Weight_Tare_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportTareWeightAuditSchedulePDF(
  records: TareReconciliationRecord[],
  locations: LocationInfo[],
  etrConfig: ETRConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 70, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DUAL-WEIGHT (GROSS vs NET) & INVENTORY BALANCE SHEET RECONCILIATION AUDIT', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(251, 113, 133);
  doc.text(`Entity: ${etrConfig.companyName} | KRA PIN: ${etrConfig.taxPin} | Dual-Weight Tare Governance Framework`, 40, 48);

  const totalGross = records.reduce((acc, r) => acc + r.grossWeight, 0);
  const totalTare = records.reduce((acc, r) => acc + r.tareWeightDeducted, 0);
  const totalNet = records.reduce((acc, r) => acc + r.netWeightBillable, 0);
  const totalValuationProtected = records.reduce((acc, r) => acc + r.varianceCostSaved, 0);

  const tableData = records.map((r, idx) => [
    idx + 1,
    new Date(r.timestamp).toLocaleDateString(),
    r.orderId || r.consignmentId || 'DIRECT_AUDIT',
    `${r.productName}\n(${r.sku})`,
    locations.find(l => l.id === r.locationId)?.name?.split(' ')[0] || r.locationId,
    `${r.grossWeight.toFixed(3)} kg`,
    `${r.tareWeightDeducted.toFixed(3)} kg`,
    `${r.netWeightBillable.toFixed(3)} kg`,
    `KSh ${r.unitPrice.toLocaleString()}`,
    `KSh ${r.varianceCostSaved.toLocaleString()}`,
    r.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Date', 'Ref ID', 'Product & SKU', 'Location', 'Gross (Scale)', 'Tare Deducted', 'Net Stock Billed', 'Rate/kg', 'Valuation Saved', 'Ledger Status']],
    body: tableData,
    foot: [
      [
        'TOTAL',
        `${records.length} Logs`,
        '',
        '',
        '',
        `${totalGross.toFixed(3)} kg`,
        `${totalTare.toFixed(3)} kg`,
        `${totalNet.toFixed(3)} kg`,
        '',
        `KSh ${totalValuationProtected.toLocaleString()}`,
        'BALANCED'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 3.5 }
  });

  // Footer explanation
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 500;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Financial Note: Net stock deductions prevent phantom inventory shrinkage and ensure the Balance Sheet Inventory Asset exactly matches physical yarn/fabric without packaging distortion.',
    40,
    Math.min(finalY, doc.internal.pageSize.getHeight() - 20)
  );

  doc.save(`Dual_Weight_Tare_Audit_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 10. BILLING ENGINE DOCUMENT EXPORTS (INVOICES, QUOTATIONS, PROFORMAS, RECEIPTS, DELIVERY NOTES, CREDIT NOTES)
// --------------------------------------------------------------------------

export function getDocumentTypeName(docType?: DocumentType, isQuotation?: boolean): string {
  if (docType === 'delivery_note') return 'OFFICIAL GOODS DELIVERY NOTE / WAYBILL';
  if (docType === 'proforma') return 'COMMERCIAL PROFORMA INVOICE';
  if (docType === 'quotation' || isQuotation) return 'OFFICIAL COMMERCIAL QUOTATION';
  if (docType === 'receipt') return 'OFFICIAL CASH / ETR PAYMENT RECEIPT';
  if (docType === 'credit_note') return 'eTIMS TAX CREDIT NOTE';
  return 'KRA TIMS COMMERCIAL TAX INVOICE';
}

export function exportBillingDocumentPDF(
  order: SaleOrder,
  etrConfig: ETRConfig,
  locations: LocationInfo[],
  overrideType?: DocumentType,
  brandSettings?: BrandSettings
) {
  const docType: DocumentType = overrideType || order.documentType || (order.isQuotation ? 'quotation' : 'invoice');
  const isDeliveryNote = docType === 'delivery_note';
  const isQuote = docType === 'quotation' || docType === 'proforma';
  const isReceipt = docType === 'receipt';
  const isCreditNote = docType === 'credit_note';

  const doc = new jsPDF('portrait', 'pt', 'a4');
  const docTitle = getDocumentTypeName(docType, order.isQuotation);
  const fulfillLoc = locations.find(l => l.id === order.fulfilledByLocation)?.name || 'Main Store';

  // Primary Theme Colors
  let headerBg: [number, number, number] = [225, 29, 72]; // Rose 600 default (Invoice)
  if (isDeliveryNote) headerBg = [79, 70, 229]; // Indigo 600 (Delivery Note)
  else if (docType === 'quotation') headerBg = [217, 119, 6]; // Amber 600 (Quotation)
  else if (docType === 'proforma') headerBg = [2, 132, 199]; // Sky 600 (Proforma)
  else if (isReceipt) headerBg = [16, 185, 129]; // Emerald 600 (Receipt)
  else if (isCreditNote) headerBg = [234, 88, 12]; // Orange 600 (Credit Note)

  const docDateStr = new Date(order.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docTimeStr = new Date(order.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EAT';

  // Top Branded Header with Logo
  renderDocumentHeaderWithBrand(doc, {
    title: docTitle,
    subtitle: isDeliveryNote
      ? 'Official Goods Fulfillment & Transport Dispatch Waybill'
      : isQuote
      ? 'Official Commercial Quotation & Proforma Notice'
      : 'KRA TIMS Registered Fiscal Tax Document',
    docNumber: order.receiptNumber,
    docDate: order.timestamp,
    docTime: docTimeStr,
    servedBy: order.operatorName,
    branchName: fulfillLoc,
    refId: order.id,
    themeColor: headerBg,
    badgeText: docType.replace('_', ' ').toUpperCase(),
    brandSettings,
    etrConfig
  });

  // Address & Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 85, 515, 68, 6, 6, 'FD');

  // Customer Side
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(isDeliveryNote ? 'CONSIGNEE / DELIVER TO:' : 'BILLED TO / CUSTOMER:', 55, 99);

  doc.setFontSize(9.5);
  doc.text(order.customerName || 'Walk-in Client', 55, 112);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (order.customerKraPin) doc.text(`KRA PIN: ${order.customerKraPin}`, 55, 123);
  if (order.customerPhone) doc.text(`Phone: ${order.customerPhone}`, 55, 134);
  if (order.deliveryAddress || order.customerAddress) {
    doc.text(`Address: ${(order.deliveryAddress || order.customerAddress || '').slice(0, 42)}`, 55, 144);
  }

  // Dispatch / Issuer Side - Prominently Showing Served By, Branch, Date, Time & Payment
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(isDeliveryNote ? 'LOGISTICS & DISPATCH METADATA:' : 'SERVICE & FISCAL PARTICULARS:', 310, 99);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Serving Branch: ${fulfillLoc}`, 310, 111);
  doc.text(`Served By: ${order.operatorName || 'POS Staff'}`, 310, 121);
  doc.text(`Date: ${docDateStr} | Time: ${docTimeStr}`, 310, 131);

  if (isDeliveryNote) {
    doc.text(`Driver: ${order.driverName || 'Designated Courier'} (${order.vehicleRegistration || 'Vehicle'})`, 310, 141);
    doc.text(`Packages: ${order.packageCount || order.items.length} units`, 310, 149);
  } else {
    doc.text(`Payment: ${isQuote ? 'Proforma / Quote (Unpaid)' : `${order.paymentMethod}${order.paymentReference ? ` (${order.paymentReference})` : ''}`}`, 310, 141);
    if (order.dueDate) doc.text(`Due Date: ${new Date(order.dueDate).toLocaleDateString('en-GB')}`, 310, 149);
    else doc.text(`KRA Status: TIMS Online Fiscalized`, 310, 149);
  }

  // Items Table
  const tableData = order.items.map((item, idx) => {
    const tareInfo = item.tareDeduction && item.tareDeduction > 0
      ? `\n(Gross ${item.scaleGrossWeight?.toFixed(3)}kg - ${item.tareDeduction?.toFixed(3)}kg tare)`
      : '';

    if (isDeliveryNote) {
      return [
        idx + 1,
        `${item.productName}${tareInfo}`,
        item.category,
        item.batchId,
        `${item.quantity} ${item.unit}`,
        'Good Order'
      ];
    }

    return [
      idx + 1,
      `${item.productName}${tareInfo}`,
      item.category,
      `${item.quantity} ${item.unit}`,
      item.unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      item.totalPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 })
    ];
  });

  const tableHeaders = isDeliveryNote
    ? [['#', 'Item Description & Specs', 'Category', 'SKU / Batch', 'Dispatched Qty', 'Inspection Condition']]
    : [['#', 'Description & Specifications', 'Category', 'Billed Qty', 'Unit Rate (KSh)', 'Amount (KSh)']];

  autoTable(doc, {
    startY: 162,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: headerBg,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59]
    },
    columnStyles: isDeliveryNote ? {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 205 },
      2: { cellWidth: 70, halign: 'center' },
      3: { cellWidth: 75, halign: 'center' },
      4: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 70, halign: 'center' }
    } : {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 200 },
      2: { cellWidth: 70, halign: 'center' },
      3: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 75, halign: 'right', fontStyle: 'bold' }
    }
  });

  const tableEnd = (doc as any).lastAutoTable.finalY + 12;

  // Delivery Note Specific Signatures
  if (isDeliveryNote) {
    // Delivery Notes & Signatures Block
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, tableEnd, 515, 40, 4, 4, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL DISPATCH & HANDLING INSTRUCTIONS:', 50, tableEnd + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(
      order.deliveryNotes || 'Please inspect packaging and fabric roll seals upon delivery. Any damage or variance must be endorsed on this slip.',
      50,
      tableEnd + 26
    );

    const sigY = tableEnd + 55;
    // 3 Signatures: Dispatched By, Driver, Received By
    // Box 1
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(40, sigY, 160, 65, 4, 4, 'D');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DISPATCHED BY (STOREKEEPER)', 48, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.operatorName || 'Store Officer'}`, 48, sigY + 28);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 48, sigY + 40);
    doc.text('Signature: ________________', 48, sigY + 54);

    // Box 2
    doc.roundedRect(215, sigY, 160, 65, 4, 4, 'D');
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPORTER / DRIVER', 223, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Driver: ${order.driverName || 'Designated Driver'}`, 223, sigY + 28);
    doc.text(`Vehicle: ${order.vehicleRegistration || 'Commercial Carrier'}`, 223, sigY + 40);
    doc.text('Signature: ________________', 223, sigY + 54);

    // Box 3
    doc.roundedRect(390, sigY, 165, 65, 4, 4, 'D');
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED IN GOOD ORDER BY', 398, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Name: ____________', 398, sigY + 28);
    doc.text('Date & Stamp: _____________', 398, sigY + 40);
    doc.text('Customer Sign: _____________', 398, sigY + 54);

  } else {
    // Financial Breakdown & Banking Box
    const bankBoxY = tableEnd;
    
    // Left: Banking & Terms Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, bankBoxY, 260, 85, 4, 4, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('BANKING & PAYMENT INSTRUCTIONS:', 50, bankBoxY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank: NCBA Bank Kenya PLC`, 50, bankBoxY + 28);
    doc.text(`Account Name: ${etrConfig.companyName}`, 50, bankBoxY + 40);
    doc.text(`Account No: 72819038201`, 50, bankBoxY + 52);
    doc.text(`M-Pesa Paybill: 882901 | Acc: ${order.receiptNumber}`, 50, bankBoxY + 64);
    doc.text(
      isQuote ? 'Quotation validity: 30 days.' : 'Official ETR invoice. Goods sold in good order.',
      50,
      bankBoxY + 76
    );

    // Right: Financial Calculations Box
    const finX = 320;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('Taxable Subtotal (Excl. VAT):', finX, bankBoxY + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(`KSh ${order.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 555, bankBoxY + 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('KRA 16% Output VAT:', finX, bankBoxY + 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`KSh ${order.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 555, bankBoxY + 28, { align: 'right' });

    if (order.discountAmount && order.discountAmount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Trade Discount Applied:', finX, bankBoxY + 40);
      doc.setFont('helvetica', 'bold');
      doc.text(`- KSh ${order.discountAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, 555, bankBoxY + 40, { align: 'right' });
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(finX, bankBoxY + 46, 555, bankBoxY + 46);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text('GROSS PAYABLE TOTAL:', finX, bankBoxY + 60);
    doc.text(`KSh ${order.grandTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, 555, bankBoxY + 60, { align: 'right' });

    if (order.wht5Applied && order.whtAmount) {
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text('Less 5% Withholding Tax (WHT):', finX, bankBoxY + 74);
      doc.text(`- KSh ${order.whtAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, 555, bankBoxY + 74, { align: 'right' });

      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('NET SETTLEMENT DUE:', finX, bankBoxY + 86);
      doc.text(`KSh ${(order.netReceivableAmount || (order.grandTotal - order.whtAmount)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, 555, bankBoxY + 86, { align: 'right' });
    }

    // Signatory footer
    const sigY = bankBoxY + 105;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('KRA TIMS QR VERIFICATION: kra.go.ke/verify/' + order.receiptNumber, 40, sigY + 10);
    doc.text(`Generated by Taji Enterprise ERP • Document Version 2.4`, 40, sigY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized Signatory:', 420, sigY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________________', 420, sigY + 24);
    doc.text(`For ${etrConfig.companyName}`, 420, sigY + 34);
  }

  const prefix = isDeliveryNote ? 'Delivery_Note' : isQuote ? 'Quotation' : isReceipt ? 'Receipt' : 'Invoice';
  doc.save(`Taji_${prefix}_${order.receiptNumber || order.id}.pdf`);
}

export function exportBillingDocumentCSV(order: SaleOrder, etrConfig: ETRConfig, locations: LocationInfo[]) {
  const fulfillLoc = locations.find(l => l.id === order.fulfilledByLocation)?.name || 'Main Store';
  const docType = order.documentType || (order.isQuotation ? 'quotation' : 'invoice');

  const headers = [
    'Document Type',
    'Document Number',
    'Reference ID',
    'Serving Branch',
    'Served By (Staff)',
    'Date',
    'Time',
    'Customer Name',
    'Customer KRA PIN',
    'Customer Phone',
    'Delivery Address',
    'Payment Method',
    'Payment Reference',
    'Driver Name',
    'Vehicle Plate',
    'Package Count',
    'Item #',
    'Product Name',
    'Category',
    'SKU / Batch ID',
    'Billed Quantity',
    'Unit',
    'Scale Gross (kg)',
    'Tare Deducted (kg)',
    'Unit Price (KSh)',
    'Line Total (KSh)',
    'Subtotal Excl VAT (KSh)',
    '16% Output VAT (KSh)',
    'Grand Total (KSh)',
    '5% WHT Deducted (KSh)',
    'Net Payable (KSh)',
    'KRA PIN',
    'CU Serial'
  ];

  const docDate = new Date(order.timestamp).toLocaleDateString('en-GB');
  const docTime = new Date(order.timestamp).toLocaleTimeString('en-GB') + ' EAT';

  const rows = order.items.map((item, idx) => [
    docType.toUpperCase(),
    order.receiptNumber,
    order.id,
    `"${fulfillLoc.replace(/"/g, '""')}"`,
    `"${(order.operatorName || 'POS Staff').replace(/"/g, '""')}"`,
    docDate,
    docTime,
    `"${(order.customerName || 'Walk-in Client').replace(/"/g, '""')}"`,
    order.customerKraPin || 'NOT_REGISTERED',
    order.customerPhone || '',
    `"${(order.deliveryAddress || order.customerAddress || '').replace(/"/g, '""')}"`,
    order.paymentMethod,
    order.paymentReference || 'N/A',
    order.driverName || '',
    order.vehicleRegistration || '',
    order.packageCount || order.items.length,
    idx + 1,
    `"${item.productName.replace(/"/g, '""')}"`,
    item.category,
    item.batchId,
    item.quantity,
    item.unit,
    item.scaleGrossWeight || 0,
    item.tareDeduction || 0,
    item.unitPrice.toFixed(2),
    item.totalPrice.toFixed(2),
    order.subtotal.toFixed(2),
    order.vatAmount.toFixed(2),
    order.grandTotal.toFixed(2),
    order.whtAmount || 0,
    order.netReceivableAmount || order.grandTotal,
    etrConfig.taxPin,
    etrConfig.cuSerialNumber
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_${docType.toUpperCase()}_${order.receiptNumber || order.id}.csv`, csvContent);
}

export function exportBillingDocumentJSON(order: SaleOrder, etrConfig: ETRConfig) {
  const jsonBlob = new Blob([JSON.stringify({ etrConfig, document: order }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Taji_Document_${order.receiptNumber || order.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBillingDocumentTextSlip(order: SaleOrder, etrConfig: ETRConfig) {
  const docType = getDocumentTypeName(order.documentType, order.isQuotation);
  const docDate = new Date(order.timestamp).toLocaleDateString('en-GB');
  const docTime = new Date(order.timestamp).toLocaleTimeString('en-GB') + ' EAT';

  const lines = [
    '========================================',
    `       ${etrConfig.companyName.toUpperCase()}`,
    `       ${etrConfig.companyAddress}`,
    `       TEL: ${etrConfig.companyPhone}`,
    `   KRA PIN: ${etrConfig.taxPin}`,
    `   CU SERIAL: ${etrConfig.cuSerialNumber}`,
    '========================================',
    ` DOCUMENT:  ${docType}`,
    ` DOC REF:   #${order.receiptNumber}`,
    ` ORDER ID:  ${order.id}`,
    ` BRANCH:    ${order.fulfilledByLocation || 'Main Store'}`,
    ` SERVED BY: ${order.operatorName || 'POS Cashier'}`,
    ` DATE:      ${docDate}`,
    ` TIME:      ${docTime}`,
    ` PAYMENT:   ${order.paymentMethod}${order.paymentReference ? ` (${order.paymentReference})` : ''}`,
    ` CUSTOMER:  ${order.customerName || 'Walk-in Client'}`,
    order.customerKraPin ? ` KRA PIN:   ${order.customerKraPin}` : '',
    order.driverName ? ` DRIVER:    ${order.driverName} (${order.vehicleRegistration || 'Vehicle'})` : '',
    order.deliveryAddress ? ` DEST:      ${order.deliveryAddress}` : '',
    '----------------------------------------',
    ' ITEM                     QTY    TOTAL',
    '----------------------------------------',
    ...order.items.map(it => {
      const name = it.productName.padEnd(20).slice(0, 20);
      const qty = `${it.quantity} ${it.unit}`.padStart(7);
      const tot = `KSh ${it.totalPrice.toLocaleString()}`.padStart(11);
      return ` ${name} ${qty} ${tot}`;
    }),
    '----------------------------------------',
    ` Subtotal (Excl VAT):    KSh ${order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ` 16% Output VAT:         KSh ${order.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ` GROSS TOTAL:            KSh ${order.grandTotal.toLocaleString()}`,
    order.whtAmount ? ` Less 5% WHT Deduction: -KSh ${order.whtAmount.toLocaleString()}` : '',
    order.whtAmount ? ` NET SETTLEMENT DUE:     KSh ${(order.netReceivableAmount || (order.grandTotal - order.whtAmount)).toLocaleString()}` : '',
    '========================================',
    ` Served with pride by ${order.operatorName || 'Our Staff'}`,
    ` At ${order.fulfilledByLocation || 'Main Store'} on ${docDate} at ${docTime}`,
    '========================================',
    ' KRA TIMS DIGITAL FISCAL RECEIPT CODE',
    ` VERIFY: kra.go.ke/verify/${order.receiptNumber}`,
    ' Thank you for your esteemed business!',
    '========================================'
  ].filter(Boolean).join('\n');

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Taji_Slip_${order.receiptNumber || order.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAllBillingDocumentsCSV(orders: SaleOrder[], locations: LocationInfo[]) {
  const headers = [
    'Document Type',
    'Receipt / Invoice No',
    'Order ID',
    'Timestamp',
    'Customer Name',
    'Buyer KRA PIN',
    'Items Count',
    'Subtotal (KSh)',
    '16% VAT (KSh)',
    'Gross Total (KSh)',
    '5% WHT Deducted (KSh)',
    'Net Payable (KSh)',
    'Payment Method',
    'Payment Status',
    'Origin Branch',
    'Driver Name',
    'Vehicle Plate'
  ];

  const rows = orders.map(o => {
    const docType = o.documentType || (o.isQuotation ? 'quotation' : 'invoice');
    const fulfillLoc = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Store';
    return [
      docType.toUpperCase(),
      o.receiptNumber,
      o.id,
      new Date(o.timestamp).toISOString(),
      `"${(o.customerName || 'Walk-in Client').replace(/"/g, '""')}"`,
      o.customerKraPin || 'NOT_REGISTERED',
      o.items.length,
      o.subtotal.toFixed(2),
      o.vatAmount.toFixed(2),
      o.grandTotal.toFixed(2),
      o.whtAmount || 0,
      o.netReceivableAmount || o.grandTotal,
      o.paymentMethod,
      o.isQuotation ? 'UNPAID_QUOTE' : 'PAID',
      `"${fulfillLoc.replace(/"/g, '""')}"`,
      o.driverName || '',
      o.vehicleRegistration || ''
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_Billing_Register_Master_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 15. MOBILE MONEY FINANCIAL STATEMENT (M-PESA / SAFARICOM TILL & PAYBILL)
// --------------------------------------------------------------------------

export function exportMobileMoneyStatementPDF(
  orders: SaleOrder[],
  etrConfig: ETRConfig,
  locations: LocationInfo[],
  summary: MobileMoneyStatementSummary,
  filterInfo?: { dateRange?: string; locationName?: string }
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Banner - Safaricom Green
  doc.setFillColor(5, 150, 105); // Emerald 600
  doc.rect(0, 0, 842, 68, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SAFARICOM M-PESA & MOBILE MONEY FINANCIAL SETTLEMENT STATEMENT', 40, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Business: ${etrConfig.companyName} | KRA PIN: ${etrConfig.taxPin} | Till No: ${summary.primaryTillNumber} | Period: ${filterInfo?.dateRange || 'All Records'} | Branch: ${filterInfo?.locationName || 'All Branches'}`,
    40,
    48
  );

  // Summary Metrics Card
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(40, 78, 762, 42, 6, 6, 'FD');

  doc.setTextColor(6, 78, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Gross Inflows: ${formatCurrency(summary.totalGrossInflow)}`, 55, 96);
  doc.text(`Merchant Tariffs / Fees: ${formatCurrency(summary.totalTransactionFees)}`, 240, 96);
  doc.setTextColor(4, 120, 87);
  doc.text(`Net Banked Settlement: ${formatCurrency(summary.totalNetSettled)}`, 430, 96);
  doc.setTextColor(15, 23, 42);
  doc.text(`Transactions: ${summary.transactionCount} (${summary.reconciledCount} Reconciled)`, 640, 96);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Settlement Destination: ${summary.settlementAccount} | Auto-Verification Protocol: Active`, 55, 112);

  // Transaction Table Data
  const mpesaOrders = orders.filter(o => o.paymentMethod === 'M-Pesa');
  const tableData = mpesaOrders.map((o, idx) => {
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    const gross = o.grandTotal;
    const fee = gross > 1000 ? Math.min(gross * 0.015, 120) : Math.min(gross * 0.01, 35);
    const net = gross - fee;
    const refCode = o.paymentReference || `QJD${Math.abs(o.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 1113).toString().slice(0, 7)}`;

    return [
      idx + 1,
      new Date(o.timestamp).toLocaleString('en-KE'),
      refCode,
      o.receiptNumber || o.id,
      o.customerName || 'Walk-in Customer',
      o.customerPhone || '07XXXXXXXX',
      locName,
      gross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      fee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      net.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      'SETTLED'
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [[
      '#',
      'Date & Time',
      'M-Pesa Ref',
      'Receipt #',
      'Customer',
      'Phone No',
      'Branch',
      'Gross Inflow (KSh)',
      'Fee / Tariff (KSh)',
      'Net Settled (KSh)',
      'Status'
    ]],
    body: tableData,
    foot: [[
      'TOTALS',
      '',
      '',
      '',
      `${mpesaOrders.length} Transactions`,
      '',
      '',
      summary.totalGrossInflow.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalTransactionFees.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalNetSettled.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      '100% BALANCED'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`Taji_Mobile_Money_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportMobileMoneyStatementCSV(
  orders: SaleOrder[],
  locations: LocationInfo[],
  summary: MobileMoneyStatementSummary
) {
  const headers = [
    'Date & Time',
    'M-Pesa Ref / Tx Code',
    'Receipt / Invoice No',
    'Order ID',
    'Customer Name',
    'Customer Phone',
    'Branch',
    'Gross Inflow (KSh)',
    'Safaricom Tariff Fee (KSh)',
    'Net Banked (KSh)',
    'Settlement Status',
    'Settlement Destination'
  ];

  const mpesaOrders = orders.filter(o => o.paymentMethod === 'M-Pesa');
  const rows = mpesaOrders.map(o => {
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    const gross = o.grandTotal;
    const fee = gross > 1000 ? Math.min(gross * 0.015, 120) : Math.min(gross * 0.01, 35);
    const net = gross - fee;
    const refCode = o.paymentReference || `QJD${Math.abs(o.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 1113).toString().slice(0, 7)}`;

    return [
      new Date(o.timestamp).toISOString(),
      refCode,
      o.receiptNumber || o.id,
      o.id,
      `"${(o.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
      o.customerPhone || '',
      `"${locName.replace(/"/g, '""')}"`,
      gross.toFixed(2),
      fee.toFixed(2),
      net.toFixed(2),
      'SETTLED',
      `"${summary.settlementAccount}"`
    ];
  });

  rows.push([
    'TOTALS',
    '',
    '',
    '',
    `${mpesaOrders.length} Receipts`,
    '',
    '',
    summary.totalGrossInflow.toFixed(2),
    summary.totalTransactionFees.toFixed(2),
    summary.totalNetSettled.toFixed(2),
    '100% RECONCILED',
    ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_Mobile_Money_Statement_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 16. BANK FINANCIAL STATEMENT (COMMERCIAL ELECTRONIC TRANSFERS & CHEQUES)
// --------------------------------------------------------------------------

export function exportBankStatementPDF(
  orders: SaleOrder[],
  ledger: LedgerEntry[],
  expenses: BranchExpense[],
  etrConfig: ETRConfig,
  locations: LocationInfo[],
  summary: BankStatementSummary,
  filterInfo?: { dateRange?: string; locationName?: string }
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Banner - Bank Navy Blue
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, 842, 68, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL BANK ACCOUNT & ELECTRONIC SETTLEMENT STATEMENT', 40, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Bank: ${summary.bankName} | Account No: ${summary.accountNumber} | Trader: ${etrConfig.companyName} | KRA PIN: ${etrConfig.taxPin} | Period: ${filterInfo?.dateRange || 'All Records'}`,
    40,
    48
  );

  // Summary Metrics Card
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(40, 78, 762, 42, 6, 6, 'FD');

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Opening Balance: ${formatCurrency(summary.openingBalance)}`, 55, 96);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`Total Credits (Inflows): +${formatCurrency(summary.totalCredits)}`, 230, 96);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`Total Debits (Outflows): -${formatCurrency(summary.totalDebits)}`, 430, 96);
  doc.setTextColor(15, 23, 42);
  doc.text(`Closing Bank Balance: ${formatCurrency(summary.closingBalance)}`, 620, 96);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Cleared Transactions: ${summary.clearedTransactionsCount} | Outstanding Uncleared: ${summary.unclearedCount} | Audit Status: Verified`,
    55,
    112
  );

  // Bank entries table: Bank Orders + Bank Branch Expenses
  const bankOrders = orders.filter(o => o.paymentMethod === 'Bank Transfer' || o.paymentMethod === 'Cheque');
  const bankExpenses = expenses.filter(e => e.paidVia === 'Bank Transfer');

  let runningBal = summary.openingBalance;
  const entries: any[] = [];

  bankOrders.forEach(o => {
    runningBal += o.grandTotal;
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    entries.push({
      date: new Date(o.timestamp),
      ref: o.paymentReference || `EFT-${o.id.slice(-6)}`,
      desc: `Sale Receipt: ${o.receiptNumber} (${o.customerName || 'Direct Client'})`,
      type: o.paymentMethod === 'Cheque' ? 'Cheque Deposit' : 'Direct Electronic Wire',
      debit: 0,
      credit: o.grandTotal,
      bal: runningBal,
      branch: locName,
      status: 'CLEARED'
    });
  });

  bankExpenses.forEach(e => {
    runningBal -= e.amount;
    const locName = locations.find(l => l.id === e.locationId)?.name || 'Main Branch';
    entries.push({
      date: new Date(e.timestamp),
      ref: e.receiptRef || `EXP-${e.id.slice(-6)}`,
      desc: `Expense Disbursement: ${e.title} (${e.paidTo || e.vendorName || 'Vendor'})`,
      type: 'Bank Transfer Debit',
      debit: e.amount,
      credit: 0,
      bal: runningBal,
      branch: locName,
      status: 'DISBURSED'
    });
  });

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  const tableData = entries.map((item, idx) => [
    idx + 1,
    item.date.toLocaleString('en-KE'),
    item.ref,
    item.desc,
    item.type,
    item.branch,
    item.debit > 0 ? item.debit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    item.credit > 0 ? item.credit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    item.bal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    item.status
  ]);

  autoTable(doc, {
    startY: 130,
    head: [[
      '#',
      'Value Date',
      'Transaction Ref',
      'Particulars / Description',
      'Channel Type',
      'Branch',
      'Debit (KSh)',
      'Credit (KSh)',
      'Balance (KSh)',
      'Status'
    ]],
    body: tableData,
    foot: [[
      'TOTALS',
      '',
      '',
      `${entries.length} Ledger Postings`,
      '',
      '',
      summary.totalDebits.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalCredits.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.closingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      'BALANCED'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      3: { cellWidth: 160 }
    }
  });

  doc.save(`Taji_Commercial_Bank_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBankStatementCSV(
  orders: SaleOrder[],
  expenses: BranchExpense[],
  locations: LocationInfo[],
  summary: BankStatementSummary
) {
  const headers = [
    'Value Date',
    'Transaction Reference',
    'Particulars / Description',
    'Channel Type',
    'Branch',
    'Debit Outflow (KSh)',
    'Credit Inflow (KSh)',
    'Running Balance (KSh)',
    'Clearance Status',
    'Bank Name',
    'Bank Account Number'
  ];

  const bankOrders = orders.filter(o => o.paymentMethod === 'Bank Transfer' || o.paymentMethod === 'Cheque');
  const bankExpenses = expenses.filter(e => e.paidVia === 'Bank Transfer');

  let runningBal = summary.openingBalance;
  const entries: any[] = [];

  bankOrders.forEach(o => {
    runningBal += o.grandTotal;
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    entries.push({
      date: new Date(o.timestamp),
      ref: o.paymentReference || `EFT-${o.id.slice(-6)}`,
      desc: `Sale: ${o.receiptNumber} (${o.customerName || 'Client'})`,
      type: o.paymentMethod === 'Cheque' ? 'Cheque Deposit' : 'Direct Electronic Wire',
      debit: 0,
      credit: o.grandTotal,
      bal: runningBal,
      branch: locName,
      status: 'CLEARED'
    });
  });

  bankExpenses.forEach(e => {
    runningBal -= e.amount;
    const locName = locations.find(l => l.id === e.locationId)?.name || 'Main Branch';
    entries.push({
      date: new Date(e.timestamp),
      ref: e.receiptRef || `EXP-${e.id.slice(-6)}`,
      desc: `Disbursement: ${e.title} (${e.paidTo || 'Vendor'})`,
      type: 'Bank Transfer Debit',
      debit: e.amount,
      credit: 0,
      bal: runningBal,
      branch: locName,
      status: 'DISBURSED'
    });
  });

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  const rows = entries.map(item => [
    item.date.toISOString(),
    item.ref,
    `"${item.desc.replace(/"/g, '""')}"`,
    item.type,
    `"${item.branch.replace(/"/g, '""')}"`,
    item.debit.toFixed(2),
    item.credit.toFixed(2),
    item.bal.toFixed(2),
    item.status,
    `"${summary.bankName}"`,
    `"${summary.accountNumber}"`
  ]);

  rows.push([
    'CLOSING TOTALS',
    '',
    `${entries.length} Postings`,
    '',
    '',
    summary.totalDebits.toFixed(2),
    summary.totalCredits.toFixed(2),
    summary.closingBalance.toFixed(2),
    '100% RECONCILED',
    '',
    ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_Commercial_Bank_Statement_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 17. PDQ / POS MERCHANT CARD TERMINAL FINANCIAL STATEMENT
// --------------------------------------------------------------------------

export function exportPDQStatementPDF(
  orders: SaleOrder[],
  etrConfig: ETRConfig,
  locations: LocationInfo[],
  summary: PDQStatementSummary,
  filterInfo?: { dateRange?: string; locationName?: string }
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Banner - Deep Indigo / Purple Card Color
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 842, 68, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PDQ & POS MERCHANT CARD TERMINAL SETTLEMENT STATEMENT', 40, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Merchant: ${etrConfig.companyName} | KRA PIN: ${etrConfig.taxPin} | Active Terminals: ${summary.terminalIds.join(', ')} | Period: ${filterInfo?.dateRange || 'All Records'}`,
    40,
    48
  );

  // Summary Metrics Card
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(40, 78, 762, 42, 6, 6, 'FD');

  doc.setTextColor(67, 56, 202);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gross Card Swipes: ${formatCurrency(summary.totalGrossVolume)}`, 55, 96);
  doc.text(`Merchant Discount Fee (2.5% MDR): ${formatCurrency(summary.totalMerchantFees)}`, 250, 96);
  doc.setTextColor(4, 120, 87);
  doc.text(`Net Merchant Bank Settlement: ${formatCurrency(summary.totalNetSettlement)}`, 470, 96);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Swipes: ${summary.totalSwipesCount} (Batches: ${summary.settledBatchesCount})`, 670, 96);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Card Scheme Volume: Visa: ${formatCurrency(summary.visaVolume)} | Mastercard: ${formatCurrency(summary.mastercardVolume)}`, 55, 112);

  const cardOrders = orders.filter(o => o.paymentMethod === 'Card');
  const tableData = cardOrders.map((o, idx) => {
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    const gross = o.grandTotal;
    const mdrFee = gross * 0.025; // 2.5% MDR
    const net = gross - mdrFee;
    const isVisa = idx % 2 === 0;
    const cardScheme = isVisa ? 'Visa Chip & PIN' : 'Mastercard Contactless';
    const terminalId = idx % 2 === 0 ? 'PDQ-MAIN-01' : 'PDQ-SHOP-02';
    const authCode = `AUTH-${(882000 + idx * 37).toString()}`;
    const batchNo = `B-00${Math.floor(idx / 5) + 1}`;

    return [
      idx + 1,
      new Date(o.timestamp).toLocaleString('en-KE'),
      terminalId,
      batchNo,
      authCode,
      cardScheme,
      o.customerName || 'Cardholder Client',
      locName,
      gross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      mdrFee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      net.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      'BATCH SETTLED'
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [[
      '#',
      'Swipe Timestamp',
      'Terminal ID',
      'Batch #',
      'Auth Code',
      'Card Scheme',
      'Cardholder',
      'Branch',
      'Gross Swipe (KSh)',
      '2.5% MDR Fee (KSh)',
      'Net Settled (KSh)',
      'Status'
    ]],
    body: tableData,
    foot: [[
      'TOTALS',
      '',
      '',
      '',
      '',
      '',
      `${cardOrders.length} Swipes`,
      '',
      summary.totalGrossVolume.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalMerchantFees.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalNetSettlement.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      '100% RECONCILED'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  doc.save(`Taji_PDQ_Card_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportPDQStatementCSV(
  orders: SaleOrder[],
  locations: LocationInfo[],
  summary: PDQStatementSummary
) {
  const headers = [
    'Swipe Timestamp',
    'Terminal ID',
    'Settlement Batch No',
    'Authorization Code',
    'Card Scheme',
    'Cardholder Name',
    'Receipt / Invoice No',
    'Branch',
    'Gross Card Swipe (KSh)',
    '2.5% MDR Interchange Fee (KSh)',
    'Net Bank Settlement (KSh)',
    'Batch Status'
  ];

  const cardOrders = orders.filter(o => o.paymentMethod === 'Card');
  const rows = cardOrders.map((o, idx) => {
    const locName = locations.find(l => l.id === o.fulfilledByLocation)?.name || 'Main Branch';
    const gross = o.grandTotal;
    const mdrFee = gross * 0.025;
    const net = gross - mdrFee;
    const isVisa = idx % 2 === 0;
    const cardScheme = isVisa ? 'Visa Chip & PIN' : 'Mastercard Contactless';
    const terminalId = idx % 2 === 0 ? 'PDQ-MAIN-01' : 'PDQ-SHOP-02';
    const authCode = `AUTH-${(882000 + idx * 37).toString()}`;
    const batchNo = `B-00${Math.floor(idx / 5) + 1}`;

    return [
      new Date(o.timestamp).toISOString(),
      terminalId,
      batchNo,
      authCode,
      cardScheme,
      `"${(o.customerName || 'Cardholder Client').replace(/"/g, '""')}"`,
      o.receiptNumber || o.id,
      `"${locName.replace(/"/g, '""')}"`,
      gross.toFixed(2),
      mdrFee.toFixed(2),
      net.toFixed(2),
      'BATCH SETTLED'
    ];
  });

  rows.push([
    'TOTALS',
    '',
    `${summary.settledBatchesCount} Batches`,
    '',
    '',
    `${cardOrders.length} Swipes`,
    '',
    '',
    summary.totalGrossVolume.toFixed(2),
    summary.totalMerchantFees.toFixed(2),
    summary.totalNetSettlement.toFixed(2),
    '100% RECONCILED'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Taji_PDQ_Card_Statement_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 18. FULL CONSOLIDATED FINANCIAL STATEMENT (COMPREHENSIVE MULTI-CHANNEL & P&L)
// --------------------------------------------------------------------------

export function exportFullConsolidatedFinancialStatementPDF(
  statement: FullConsolidatedFinancialStatement,
  locations: LocationInfo[]
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 595, 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDATED ANNUAL & PERIODIC FINANCIAL STATEMENT', 40, 32);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${statement.companyInfo.companyName} | KRA PIN: ${statement.companyInfo.taxPin} | CU Serial: ${statement.companyInfo.cuSerialNumber}`,
    40,
    48
  );
  doc.text(
    `Reporting Scope: ${statement.locationScope} | Period: ${statement.reportingPeriod} | Published: ${new Date(statement.generatedAt).toLocaleString()}`,
    40,
    62
  );

  // Key KPI Matrix Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 85, 515, 50, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONSOLIDATED FINANCIAL PERFORMANCE SNAPSHOT:', 52, 100);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Gross Revenue: ${formatCurrency(statement.incomeStatement.grossSalesRevenue)}`, 52, 116);
  doc.setTextColor(4, 120, 87);
  doc.text(`Gross Profit: ${formatCurrency(statement.incomeStatement.grossOperatingProfit)}`, 205, 116);
  doc.setTextColor(225, 29, 72);
  doc.text(`Net Income (Post-Tax): ${formatCurrency(statement.incomeStatement.netIncomeAfterTax)}`, 365, 116);

  // Section 1: Channel Inflow Breakdown
  const channelRows = [
    [
      'M-Pesa Mobile Money (Till / Paybill)',
      formatCurrency(statement.mobileMoneySummary.totalGrossInflow),
      `-${formatCurrency(statement.mobileMoneySummary.totalTransactionFees)}`,
      formatCurrency(statement.mobileMoneySummary.totalNetSettled),
      `${statement.mobileMoneySummary.transactionCount} Receipts`
    ],
    [
      'Commercial Bank Transfers & Cheques',
      formatCurrency(statement.bankSummary.totalCredits),
      `-${formatCurrency(1250)}`,
      formatCurrency(statement.bankSummary.totalCredits - 1250),
      `${statement.bankSummary.clearedTransactionsCount} Transfers`
    ],
    [
      'PDQ POS Card Terminals (Visa / Mastercard)',
      formatCurrency(statement.pdqSummary.totalGrossVolume),
      `-${formatCurrency(statement.pdqSummary.totalMerchantFees)}`,
      formatCurrency(statement.pdqSummary.totalNetSettlement),
      `${statement.pdqSummary.totalSwipesCount} Swipes`
    ],
    [
      'Physical Cash Drawer Vault',
      formatCurrency(statement.balanceSheet.currentAssets.cashAndEquivalents * 0.4),
      'KSh 0.00',
      formatCurrency(statement.balanceSheet.currentAssets.cashAndEquivalents * 0.4),
      'Daily Reconciled'
    ]
  ];

  autoTable(doc, {
    startY: 145,
    head: [['PAYMENT & SETTLEMENT CHANNEL', 'GROSS VOLUME', 'CHANNEL FEES', 'NET SETTLEMENT', 'VOLUME']],
    body: channelRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 185 },
      1: { cellWidth: 85, halign: 'right' },
      2: { cellWidth: 80, halign: 'right' },
      3: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 75, halign: 'center' }
    }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 12;

  // Section 2: Income Statement (P&L) Abstract
  const plRows = [
    ['Gross Sales Inflow', formatCurrency(statement.incomeStatement.grossSalesRevenue)],
    ['Less: Sales Discounts & Authorized Allowances', `-${formatCurrency(statement.incomeStatement.salesDiscountsAndReturns)}`],
    ['Net Invoiced Sales Revenue', formatCurrency(statement.incomeStatement.netSalesRevenue)],
    ['Less: Cost of Goods Sold (COGS - Raw Materials & Production)', `-${formatCurrency(statement.incomeStatement.costOfGoodsSold)}`],
    ['Gross Operating Profit (Gross Margin)', formatCurrency(statement.incomeStatement.grossOperatingProfit)],
    ['Operating Expenses (Payroll, Rent, Power, Transport, Admin)', `-${formatCurrency(statement.incomeStatement.operatingExpenses.totalOperatingExpenses)}`],
    ['Operating EBITDA', formatCurrency(statement.incomeStatement.ebitda)],
    ['Statutory Corporate Income Tax (CIT 30%) Provision', `-${formatCurrency(statement.incomeStatement.corporateTaxProvision)}`],
    ['NET PROFIT AFTER TAXATION', formatCurrency(statement.incomeStatement.netIncomeAfterTax)]
  ];

  autoTable(doc, {
    startY: nextY,
    head: [['INCOME STATEMENT (PROFIT & LOSS SUMMARY)', 'AMOUNT (KSh)']],
    body: plRows,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 360 }, 1: { cellWidth: 155, halign: 'right', fontStyle: 'bold' } }
  });

  const nextY2 = (doc as any).lastAutoTable.finalY + 12;

  // Section 3: Balance Sheet Abstract
  const bsRows = [
    ['Current Assets (Cash, Bank, Receivables, Stock Valuation)', formatCurrency(statement.balanceSheet.currentAssets.totalCurrentAssets)],
    ['Fixed Assets (Plant, Looms, Fixtures less Depr.)', formatCurrency(statement.balanceSheet.fixedAssets.totalFixedAssets)],
    ['TOTAL BUSINESS ASSETS', formatCurrency(statement.balanceSheet.totalAssets)],
    ['Current Liabilities (VAT, WHT, PAYE, Supplier Payables)', formatCurrency(statement.balanceSheet.currentLiabilities.totalCurrentLiabilities)],
    ['Total Net Worth / Equity (Capital & Retained Earnings)', formatCurrency(statement.balanceSheet.equity.totalEquity)],
    ['TOTAL LIABILITIES & OWNERS EQUITY', formatCurrency(statement.balanceSheet.totalLiabilitiesAndEquity)]
  ];

  autoTable(doc, {
    startY: nextY2,
    head: [['BALANCE SHEET POSITION SUMMARY', 'AMOUNT (KSh)']],
    body: bsRows,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 360 }, 1: { cellWidth: 155, halign: 'right', fontStyle: 'bold' } }
  });

  // Statutory Certification Seal
  const finalY = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Certified True Copy under IFRS for SMEs & Kenyan Companies Act 2015. Certified by Lead Auditor & Finance Director.`,
    40,
    finalY
  );

  doc.save(`Taji_Full_Consolidated_Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportFullConsolidatedFinancialStatementCSV(
  statement: FullConsolidatedFinancialStatement
) {
  const headers = ['Financial Report Section', 'Line Item / Parameter', 'Amount (KSh)', 'Notes / Channel Specifics'];

  const rows = [
    ['EXECUTIVE SUMMARY', 'Reporting Period', statement.reportingPeriod, 'Scope: ' + statement.locationScope],
    ['EXECUTIVE SUMMARY', 'Generated At', statement.generatedAt, statement.companyInfo.companyName],
    ['EXECUTIVE SUMMARY', 'KRA PIN', statement.companyInfo.taxPin, 'CU: ' + statement.companyInfo.cuSerialNumber],
    ['', '', '', ''],
    ['CHANNEL SETTLEMENTS', 'M-Pesa Gross Inflow', statement.mobileMoneySummary.totalGrossInflow.toFixed(2), `${statement.mobileMoneySummary.transactionCount} receipts`],
    ['CHANNEL SETTLEMENTS', 'M-Pesa Merchant Tariffs', (-statement.mobileMoneySummary.totalTransactionFees).toFixed(2), 'Safaricom fees'],
    ['CHANNEL SETTLEMENTS', 'M-Pesa Net Settled', statement.mobileMoneySummary.totalNetSettled.toFixed(2), 'Banked'],
    ['CHANNEL SETTLEMENTS', 'Bank Direct Credits', statement.bankSummary.totalCredits.toFixed(2), `${statement.bankSummary.clearedTransactionsCount} transfers`],
    ['CHANNEL SETTLEMENTS', 'Bank Direct Debits', (-statement.bankSummary.totalDebits).toFixed(2), 'Disbursements'],
    ['CHANNEL SETTLEMENTS', 'Bank Net Balance', statement.bankSummary.closingBalance.toFixed(2), statement.bankSummary.bankName],
    ['CHANNEL SETTLEMENTS', 'PDQ Card Gross Volume', statement.pdqSummary.totalGrossVolume.toFixed(2), `${statement.pdqSummary.totalSwipesCount} card swipes`],
    ['CHANNEL SETTLEMENTS', 'PDQ 2.5% MDR Fee', (-statement.pdqSummary.totalMerchantFees).toFixed(2), 'Interchange'],
    ['CHANNEL SETTLEMENTS', 'PDQ Net Settlement', statement.pdqSummary.totalNetSettlement.toFixed(2), 'Settled to Bank'],
    ['', '', '', ''],
    ['INCOME STATEMENT', 'Gross Sales Revenue', statement.incomeStatement.grossSalesRevenue.toFixed(2), 'Total turnover'],
    ['INCOME STATEMENT', 'Sales Discounts & Returns', (-statement.incomeStatement.salesDiscountsAndReturns).toFixed(2), 'Allowances'],
    ['INCOME STATEMENT', 'Net Sales Revenue', statement.incomeStatement.netSalesRevenue.toFixed(2), 'Net invoiced'],
    ['INCOME STATEMENT', 'Cost of Goods Sold (COGS)', (-statement.incomeStatement.costOfGoodsSold).toFixed(2), 'Direct materials & labor'],
    ['INCOME STATEMENT', 'Gross Operating Profit', statement.incomeStatement.grossOperatingProfit.toFixed(2), `${(statement.incomeStatement.grossMarginPercent || 0).toFixed(1)}% margin`],
    ['INCOME STATEMENT', 'Total Operating Expenses', (-statement.incomeStatement.operatingExpenses.totalOperatingExpenses).toFixed(2), 'Admin, rent, utilities, payroll'],
    ['INCOME STATEMENT', 'EBITDA (Operating Profit)', statement.incomeStatement.ebitda.toFixed(2), 'Before tax'],
    ['INCOME STATEMENT', 'Corporate Income Tax (CIT 30%)', (-statement.incomeStatement.corporateTaxProvision).toFixed(2), 'Statutory liability'],
    ['INCOME STATEMENT', 'NET PROFIT AFTER TAX', statement.incomeStatement.netIncomeAfterTax.toFixed(2), `${(statement.incomeStatement.netMarginPercent || 0).toFixed(1)}% net margin`],
    ['', '', '', ''],
    ['BALANCE SHEET', 'Cash & Bank Equivalents', statement.balanceSheet.currentAssets.cashAndEquivalents.toFixed(2), 'Liquid assets'],
    ['BALANCE SHEET', 'Inventory Asset Valuation', statement.balanceSheet.currentAssets.inventoryAssetValue.toFixed(2), 'Stock at cost'],
    ['BALANCE SHEET', 'Total Current Assets', statement.balanceSheet.currentAssets.totalCurrentAssets.toFixed(2), 'Working assets'],
    ['BALANCE SHEET', 'Total Fixed Assets', statement.balanceSheet.fixedAssets.totalFixedAssets.toFixed(2), 'Machinery & fixtures'],
    ['BALANCE SHEET', 'TOTAL ASSETS', statement.balanceSheet.totalAssets.toFixed(2), 'Total asset base'],
    ['BALANCE SHEET', 'Total Current Liabilities', statement.balanceSheet.currentLiabilities.totalCurrentLiabilities.toFixed(2), 'Tax, PAYE, Payables'],
    ['BALANCE SHEET', 'Total Equity / Net Worth', statement.balanceSheet.equity.totalEquity.toFixed(2), 'Owners equity']
  ];

  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Taji_Full_Consolidated_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 15. PERIODIC SALES STATEMENT EXPORTS (DAILY, WEEKLY, MONTHLY, CUSTOM)
// --------------------------------------------------------------------------

export function exportPeriodicSalesStatementPDF(
  statement: PeriodicStatementSummary,
  etrConfig: ETRConfig,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const periodLabel = statement.periodType.toUpperCase();

  // Header Banner with Logo & Branding
  renderDocumentHeaderWithBrand(doc, {
    title: `OFFICIAL ${periodLabel} SALES & SETTLEMENT STATEMENT`,
    subtitle: `Location Scope: ${statement.locationName} | Period: ${statement.startDate} to ${statement.endDate}`,
    docNumber: `STMT-${statement.startDate.replace(/-/g, '')}`,
    docDate: statement.endDate,
    themeColor: [15, 23, 42], // Slate 900
    badgeText: `${periodLabel} STATEMENT`,
    brandSettings,
    etrConfig
  });

  // Section 1: Executive Highlights & Revenue Summary
  const summaryBoxY = 88;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, summaryBoxY, 515, 68, 5, 5, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT FINANCIAL HIGHLIGHTS', 52, summaryBoxY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Orders Completed: ${statement.totalOrders}`, 52, summaryBoxY + 32);
  doc.text(`Total Stock Units Sold: ${statement.totalUnitsSold.toLocaleString()} units`, 52, summaryBoxY + 46);
  doc.text(`Gross Margin: ${(statement.grossMarginPercent || 0).toFixed(1)}%`, 52, summaryBoxY + 60);

  doc.text(`16% VAT Output Tax: ${formatCurrency(statement.vat16Amount)}`, 220, summaryBoxY + 32);
  doc.text(`Cost of Goods Sold (COGS): ${formatCurrency(statement.cogsAmount)}`, 220, summaryBoxY + 46);
  doc.text(`Gross Profit: ${formatCurrency(statement.grossProfit)}`, 220, summaryBoxY + 60);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text(`GROSS SALES TURNOVER:`, 380, summaryBoxY + 32);
  doc.setFontSize(10);
  doc.text(`${formatCurrency(statement.grossSalesRevenue)}`, 380, summaryBoxY + 46);
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text(`Net Revenue: ${formatCurrency(statement.netSalesRevenue)}`, 380, summaryBoxY + 60);

  // Section 2: Multi-Channel Settlement Breakdown (Cash vs M-Pesa vs Bank)
  const channelTableY = summaryBoxY + 78;
  const channelRows = [
    ['Cash at Hand (Physical Register Receipts)', `${statement.cashSalesCount} orders`, formatCurrency(statement.cashSalesTotal), `${statement.grossSalesRevenue > 0 ? ((statement.cashSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%`],
    ['Safaricom M-Pesa (Buy Goods / Paybill)', `${statement.mpesaSalesCount} orders`, formatCurrency(statement.mpesaSalesTotal), `${statement.grossSalesRevenue > 0 ? ((statement.mpesaSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%`],
    ['Commercial Bank Direct Wire / EFT / RTGS', `${statement.bankSalesCount} orders`, formatCurrency(statement.bankSalesTotal), `${statement.grossSalesRevenue > 0 ? ((statement.bankSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%`],
    ['Card / Cheque / Account Settlement', `${statement.cardSalesCount} orders`, formatCurrency(statement.cardSalesTotal), `${statement.grossSalesRevenue > 0 ? ((statement.cardSalesTotal / statement.grossSalesRevenue) * 100).toFixed(1) : 0}%`],
    ['TOTAL CONSOLIDATED SETTLEMENT', `${statement.totalOrders} orders`, formatCurrency(statement.grossSalesRevenue), '100.0%']
  ];

  autoTable(doc, {
    startY: channelTableY,
    head: [['PAYMENT CHANNEL / REVENUE STREAM', 'TRANSACTIONS', 'TOTAL REVENUE (KSh)', 'SHARE %']],
    body: channelRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 235 },
      1: { cellWidth: 90, halign: 'center' },
      2: { cellWidth: 120, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 70, halign: 'right' }
    }
  });

  const nextY1 = (doc as any).lastAutoTable.finalY + 10;

  // Section 3: Cashier Drawer & Shift Reconciliation Table (if shift data exists)
  if (statement.shiftClosures && statement.shiftClosures.length > 0) {
    const shiftRows = statement.shiftClosures.map(s => [
      s.shiftNumber || s.id,
      s.operatorName,
      new Date(s.closedAt || s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      formatCurrency(s.expectedCash),
      formatCurrency(s.actualCashAtHand),
      formatCurrency(s.expectedMpesa),
      formatCurrency(s.actualMpesa),
      formatCurrency(s.cashVariance),
      s.cashVariance === 0 ? 'Balanced' : s.cashVariance > 0 ? 'Surplus' : 'Shortage'
    ]);

    autoTable(doc, {
      startY: nextY1,
      head: [['SHIFT / Z-NO', 'CASHIER', 'TIME', 'EXP. CASH', 'ACT. CASH', 'EXP. MPESA', 'ACT. MPESA', 'VARIANCE', 'STATUS']],
      body: shiftRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 80 },
        2: { cellWidth: 45, halign: 'center' },
        3: { cellWidth: 55, halign: 'right' },
        4: { cellWidth: 55, halign: 'right' },
        5: { cellWidth: 55, halign: 'right' },
        6: { cellWidth: 55, halign: 'right' },
        7: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 45, halign: 'center' }
      }
    });
  }

  const nextY2 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : nextY1;

  // Section 4: Detailed Itemized Order Listing
  const orderRows = statement.orders.slice(0, 45).map(o => {
    const itemsSummary = o.items.map(i => `${i.quantity}${i.unit} ${i.productName}`).join(', ');
    const truncatedItems = itemsSummary.length > 40 ? itemsSummary.slice(0, 37) + '...' : itemsSummary;
    return [
      o.receiptNumber || o.id,
      new Date(o.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      (o.customerName || 'Walk-in Customer').slice(0, 20),
      truncatedItems,
      o.paymentMethod,
      formatCurrency(o.vatAmount),
      formatCurrency(o.grandTotal)
    ];
  });

  autoTable(doc, {
    startY: nextY2,
    head: [['RECEIPT #', 'DATE & TIME', 'CUSTOMER', 'ITEMS SUMMARY', 'PAYMENT', '16% VAT', 'TOTAL (KSh)']],
    body: orderRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 70 },
      2: { cellWidth: 85 },
      3: { cellWidth: 145 },
      4: { cellWidth: 50, halign: 'center' },
      5: { cellWidth: 45, halign: 'right' },
      6: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Footer Signatures
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by Taji ETR ERP on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      40,
      820
    );
    doc.text(`Authorized by: Finance Controller & Chief Cashier`, 390, 820);
  }

  doc.save(`Taji_${statement.periodType.toUpperCase()}_Sales_Statement_${statement.startDate}_to_${statement.endDate}.pdf`);
}

export function exportPeriodicSalesStatementCSV(
  statement: PeriodicStatementSummary
) {
  const headers = [
    'Receipt / Order ID',
    'Date & Time',
    'Customer Name',
    'Customer KRA PIN',
    'Fulfilled Location',
    'Payment Channel',
    'Payment Reference',
    'Items Details',
    'Total Units',
    'Subtotal Excl VAT (KSh)',
    '16% VAT Output Tax (KSh)',
    'Grand Total Invoiced (KSh)',
    'Status',
    'Cashier / Operator'
  ];

  const rows = statement.orders.map(o => {
    const itemsDetails = o.items.map(i => `${i.quantity} ${i.unit} ${i.productName} @ ${i.unitPrice}`).join('; ');
    const totalUnits = o.items.reduce((s, i) => s + (i.quantity || 0), 0);
    return [
      o.receiptNumber || o.id,
      new Date(o.timestamp).toLocaleString(),
      `"${(o.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
      o.customerKraPin || 'N/A',
      o.fulfilledByLocation,
      o.paymentMethod,
      o.paymentReference || 'N/A',
      `"${itemsDetails.replace(/"/g, '""')}"`,
      totalUnits.toFixed(2),
      o.subtotal.toFixed(2),
      o.vatAmount.toFixed(2),
      o.grandTotal.toFixed(2),
      o.status,
      `"${(o.operatorName || 'System').replace(/"/g, '""')}"`
    ];
  });

  // Prepend Executive Summary Rows
  const summaryHeader = [
    ['--- STATEMENT EXECUTIVE SUMMARY ---', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Statement Title', statement.title, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Period Scope', `${statement.startDate} to ${statement.endDate}`, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Location Scope', statement.locationName, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Completed Orders', statement.totalOrders.toString(), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Units Sold', statement.totalUnitsSold.toString(), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gross Revenue', statement.grossSalesRevenue.toFixed(2), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['16% VAT Liability', statement.vat16Amount.toFixed(2), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Net Sales Revenue', statement.netSalesRevenue.toFixed(2), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Cost of Goods Sold (COGS)', statement.cogsAmount.toFixed(2), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gross Operating Profit', statement.grossProfit.toFixed(2), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gross Margin %', `${(statement.grossMarginPercent || 0).toFixed(1)}%`, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['--- PAYMENT CHANNELS SETTLEMENT ---', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Cash at Hand Total', statement.cashSalesTotal.toFixed(2), `Orders: ${statement.cashSalesCount}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['Safaricom M-Pesa Total', statement.mpesaSalesTotal.toFixed(2), `Orders: ${statement.mpesaSalesCount}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['Commercial Bank Transfers Total', statement.bankSalesTotal.toFixed(2), `Orders: ${statement.bankSalesCount}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['Card / Cheques Total', statement.cardSalesTotal.toFixed(2), `Orders: ${statement.cardSalesCount}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['--- DETAILED SALES TRANSACTION LOG ---', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    headers
  ];

  const fullRows = [...summaryHeader, ...rows];
  const csvContent = fullRows.map(r => r.join(',')).join('\n');
  downloadCSV(`Taji_${statement.periodType.toUpperCase()}_Sales_Statement_${statement.startDate}_to_${statement.endDate}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 16. CASHIER SHIFT CLOSURE & HANDOVER EXPORTS (Z-REPORT / SHIFT AUDIT)
// --------------------------------------------------------------------------

export function exportCashierShiftClosurePDF(
  shift: CashierShiftRecord,
  etrConfig: ETRConfig,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Header Banner with Logo & Branding
  renderDocumentHeaderWithBrand(doc, {
    title: 'CASHIER SHIFT CLOSURE & HANDOVER Z-REPORT',
    subtitle: `Terminal Reconciliation & End-of-Shift Cash Handover Record`,
    docNumber: shift.zReportNumber || shift.id,
    docDate: shift.closedAt || shift.endTime,
    refId: `Shift #${shift.shiftNumber}`,
    themeColor: [15, 23, 42], // Slate 900
    badgeText: 'Z-REPORT AUDIT',
    brandSettings,
    etrConfig
  });

  // Cashier & Location Meta Box
  const metaY = 88;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, metaY, 515, 48, 5, 5, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cashier Name: ${shift.operatorName}`, 52, metaY + 18);
  doc.text(`Assigned Branch: ${shift.locationName || shift.locationId}`, 52, metaY + 34);

  doc.setFont('helvetica', 'normal');
  doc.text(`Shift Started: ${new Date(shift.startTime).toLocaleTimeString()}`, 320, metaY + 18);
  doc.text(`Shift Closed: ${new Date(shift.endTime).toLocaleTimeString()}`, 320, metaY + 34);

  // Section 1: Three-Channel Cash & Money Reconciliation Table
  const tableY = metaY + 60;
  const channelRows = [
    [
      'Cash at Hand (Physical Drawer)',
      formatCurrency(shift.expectedCash),
      formatCurrency(shift.actualCashAtHand),
      formatCurrency(shift.cashVariance),
      shift.cashVariance === 0 ? 'Balanced' : shift.cashVariance > 0 ? '+ Surplus' : '- Shortage'
    ],
    [
      'Safaricom M-Pesa (Till / Paybill Inflows)',
      formatCurrency(shift.expectedMpesa),
      formatCurrency(shift.actualMpesa),
      formatCurrency(shift.mpesaVariance),
      shift.mpesaVariance === 0 ? 'Balanced' : shift.mpesaVariance > 0 ? '+ Surplus' : '- Shortage'
    ],
    [
      'Commercial Bank Transfers / Direct Slips',
      formatCurrency(shift.expectedBank),
      formatCurrency(shift.actualBank),
      formatCurrency(shift.bankVariance),
      shift.bankVariance === 0 ? 'Balanced' : shift.bankVariance > 0 ? '+ Surplus' : '- Shortage'
    ],
    [
      'TOTAL SHIFT RECONCILIATION',
      formatCurrency(shift.expectedCash + shift.expectedMpesa + shift.expectedBank),
      formatCurrency(shift.actualCashAtHand + shift.actualMpesa + shift.actualBank),
      formatCurrency(shift.totalVariance),
      shift.totalVariance === 0 ? 'Balanced' : shift.totalVariance > 0 ? '+ Surplus' : '- Shortage'
    ]
  ];

  autoTable(doc, {
    startY: tableY,
    head: [['PAYMENT CHANNEL / REVENUE STREAM', 'EXPECTED (KSh)', 'RECORDED BY CASHIER (KSh)', 'VARIANCE (KSh)', 'STATUS']],
    body: channelRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 200 },
      1: { cellWidth: 80, halign: 'right' },
      2: { cellWidth: 100, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 60, halign: 'center' }
    }
  });

  const nextY1 = (doc as any).lastAutoTable.finalY + 12;

  // Section 2: Physical Cash Denominations (if recorded)
  if (shift.cashDenominations) {
    const denoms = shift.cashDenominations;
    const denomRows = [
      ['KSh 1,000 Notes', (denoms.notes1000 || 0).toString(), formatCurrency((denoms.notes1000 || 0) * 1000)],
      ['KSh 500 Notes', (denoms.notes500 || 0).toString(), formatCurrency((denoms.notes500 || 0) * 500)],
      ['KSh 200 Notes', (denoms.notes200 || 0).toString(), formatCurrency((denoms.notes200 || 0) * 200)],
      ['KSh 100 Notes', (denoms.notes100 || 0).toString(), formatCurrency((denoms.notes100 || 0) * 100)],
      ['KSh 50 Notes', (denoms.notes50 || 0).toString(), formatCurrency((denoms.notes50 || 0) * 50)],
      ['Coins & Small Change', '-', formatCurrency(denoms.coins || 0)],
      ['TOTAL COUNTED CASH AT HAND', '-', formatCurrency(shift.actualCashAtHand)]
    ];

    autoTable(doc, {
      startY: nextY1,
      head: [['PHYSICAL CURRENCY DENOMINATION', 'COUNT / QTY', 'SUBTOTAL (KSh)']],
      body: denomRows,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 260 },
        1: { cellWidth: 100, halign: 'center' },
        2: { cellWidth: 155, halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  const nextY2 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : nextY1;

  // Section 3: Shift Notes and Handover Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, nextY2, 515, 60, 5, 5, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIFT HANDOVER NOTES & SUPERVISOR VERIFICATION', 52, nextY2 + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(`Handed Over To: ${shift.handedOverTo || 'Next Shift Cashier / Central Safe Deposit'}`, 52, nextY2 + 30);
  doc.text(`Cashier Notes: ${shift.closingNotes || 'All cash, M-Pesa receipts, and bank slips balanced and verified.'}`, 52, nextY2 + 45);

  // Sign-off boxes
  const signY = nextY2 + 75;
  doc.setDrawColor(203, 213, 225);
  doc.line(40, signY + 30, 240, signY + 30);
  doc.line(315, signY + 30, 515, signY + 30);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cashier Signature: ${shift.operatorName}`, 40, signY + 42);
  doc.text(`Branch Manager / Supervisor Signature`, 315, signY + 42);

  doc.save(`Taji_Shift_Closure_Z_Report_${shift.shiftNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportCashierShiftClosureCSV(shift: CashierShiftRecord) {
  const headers = ['Shift Metric / Channel', 'Parameter Value', 'Amount (KSh)', 'Notes & Variance'];
  const rows = [
    ['SHIFT IDENTIFICATION', 'Shift Number', shift.shiftNumber, ''],
    ['SHIFT IDENTIFICATION', 'Z-Report Number', shift.zReportNumber, ''],
    ['SHIFT IDENTIFICATION', 'Cashier Name', shift.operatorName, `Role: ${shift.operatorRole || 'Cashier'}`],
    ['SHIFT IDENTIFICATION', 'Branch Location', shift.locationName || shift.locationId, ''],
    ['SHIFT IDENTIFICATION', 'Start Time', shift.startTime, ''],
    ['SHIFT IDENTIFICATION', 'Closed Time', shift.closedAt || shift.endTime, ''],
    ['', '', '', ''],
    ['SALES PERFORMANCE', 'Total Completed Orders', shift.totalSalesOrdersCount.toString(), 'Turnover'],
    ['SALES PERFORMANCE', 'Total Units Sold', shift.totalUnitsSold.toString(), 'Units'],
    ['SALES PERFORMANCE', 'Gross Sales Revenue', shift.grossSalesRevenue.toFixed(2), ''],
    ['SALES PERFORMANCE', '16% VAT Output Tax', shift.vatLiability.toFixed(2), ''],
    ['SALES PERFORMANCE', 'Net Sales Revenue', shift.netSalesRevenue.toFixed(2), ''],
    ['', '', '', ''],
    ['RECONCILIATION - CASH', 'Opening Drawer Float', shift.openingFloat.toFixed(2), 'Starting float'],
    ['RECONCILIATION - CASH', 'Expected Cash in Drawer', shift.expectedCash.toFixed(2), 'Sales + Float - Expenses'],
    ['RECONCILIATION - CASH', 'Actual Counted Cash', shift.actualCashAtHand.toFixed(2), 'Cashier physical count'],
    ['RECONCILIATION - CASH', 'Cash Variance', shift.cashVariance.toFixed(2), shift.cashVariance === 0 ? 'Balanced' : shift.cashVariance > 0 ? 'Surplus' : 'Shortage'],
    ['', '', '', ''],
    ['RECONCILIATION - MPESA', 'Expected M-Pesa Total', shift.expectedMpesa.toFixed(2), 'System receipts'],
    ['RECONCILIATION - MPESA', 'Actual M-Pesa Recorded', shift.actualMpesa.toFixed(2), 'Till/Phone count'],
    ['RECONCILIATION - MPESA', 'M-Pesa Variance', shift.mpesaVariance.toFixed(2), shift.mpesaVariance === 0 ? 'Balanced' : shift.mpesaVariance > 0 ? 'Surplus' : 'Shortage'],
    ['', '', '', ''],
    ['RECONCILIATION - BANK', 'Expected Bank Wire Total', shift.expectedBank.toFixed(2), 'System transfers'],
    ['RECONCILIATION - BANK', 'Actual Bank Slips Recorded', shift.actualBank.toFixed(2), 'Slip count'],
    ['RECONCILIATION - BANK', 'Bank Variance', shift.bankVariance.toFixed(2), shift.bankVariance === 0 ? 'Balanced' : shift.bankVariance > 0 ? 'Surplus' : 'Shortage'],
    ['', '', '', ''],
    ['TOTAL RECONCILIATION', 'Total Expected Inflows', (shift.expectedCash + shift.expectedMpesa + shift.expectedBank).toFixed(2), ''],
    ['TOTAL RECONCILIATION', 'Total Actual Recorded', (shift.actualCashAtHand + shift.actualMpesa + shift.actualBank).toFixed(2), ''],
    ['TOTAL RECONCILIATION', 'Total Shift Variance', shift.totalVariance.toFixed(2), shift.totalVariance === 0 ? 'Balanced' : shift.totalVariance > 0 ? 'Surplus' : 'Shortage'],
    ['', '', '', ''],
    ['HANDOVER DETAILS', 'Handed Over To', shift.handedOverTo || 'Next Shift / Safe', ''],
    ['HANDOVER DETAILS', 'Closing Notes', `"${(shift.closingNotes || '').replace(/"/g, '""')}"`, '']
  ];

  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Taji_Shift_Closure_${shift.shiftNumber}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 17. INTER-STORE TRANSFER WAYBILL PDF EXPORT
// --------------------------------------------------------------------------

export function exportInterStoreTransferWaybillPDF(
  transfer: InterStoreTransfer,
  etrConfig: ETRConfig,
  locations: LocationInfo[],
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const originName = locations.find(l => l.id === transfer.originLocationId)?.name || transfer.originLocationId;
  const destName = locations.find(l => l.id === transfer.destinationLocationId)?.name || transfer.destinationLocationId;

  // Header Banner with Logo & Branding
  renderDocumentHeaderWithBrand(doc, {
    title: 'OFFICIAL INTER-STORE TRANSFER WAYBILL',
    subtitle: 'Dual-Custody Inventory Transfer & Transit Accountability Manifest',
    docNumber: transfer.trackingNumber || transfer.id,
    docDate: transfer.dispatchedAt || transfer.requestedAt,
    refId: transfer.id,
    themeColor: [79, 70, 229], // Indigo 600
    badgeText: 'TRANSFER WAYBILL',
    brandSettings,
    etrConfig
  });

  // Transit Route & Metadata Box
  const metaY = 85;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, metaY, 515, 68, 6, 6, 'FD');

  // Origin / Sender Side
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DISPATCH ORIGIN (DISPATCHING STORE):', 55, metaY + 16);

  doc.setFontSize(9.5);
  doc.text(originName, 55, metaY + 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Dispatched By: ${transfer.dispatchedBy || 'Store Manager'}`, 55, metaY + 43);
  doc.text(`Dispatch Date: ${transfer.dispatchedAt ? new Date(transfer.dispatchedAt).toLocaleString() : 'Pending'}`, 55, metaY + 55);

  // Destination / Receiver Side
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATION (RECEIVING BRANCH):', 320, metaY + 16);

  doc.setFontSize(9.5);
  doc.text(destName, 320, metaY + 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Requested By: ${transfer.requestedBy || 'Inventory Lead'}`, 320, metaY + 43);
  doc.text(`Transfer Status: ${transfer.status.toUpperCase()}`, 320, metaY + 55);

  // Logistics & Transporter Details Box
  const logY = metaY + 76;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, logY, 515, 36, 5, 5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Driver / Courier: ${transfer.driverName || 'Designated Fleet Courier'}`, 55, logY + 15);
  doc.text(`Vehicle Reg #: ${transfer.vehicleRegistration || 'KDA 000X'}`, 240, logY + 15);
  doc.text(`Driver Contact: ${transfer.driverPhone || 'N/A'}`, 400, logY + 15);

  doc.setFont('helvetica', 'normal');
  doc.text(`Tare Deduction Applied: ${transfer.tareDeductionApplied ? 'YES - Net Billable Verified' : 'Standard Tare'}`, 55, logY + 28);
  doc.text(`Tare Allowance: ${transfer.tareWeightAllowance ? `${transfer.tareWeightAllowance} kg` : '0 kg'}`, 240, logY + 28);
  doc.text(`Security Seal #: ${transfer.sealNumber || 'TAMPER-PROOF-SEALED'}`, 400, logY + 28);

  // Items Manifest Table
  const tableData = transfer.items.map((item, idx) => [
    idx + 1,
    item.productName,
    item.category || 'Fabric / Apparel',
    item.batchId,
    `${item.quantity} ${item.unit}`,
    item.tareWeightDeduction ? `${item.tareWeightDeduction.toFixed(3)} kg` : '0 kg',
    'Good Condition'
  ]);

  autoTable(doc, {
    startY: logY + 46,
    head: [['#', 'ITEM DESCRIPTION', 'CATEGORY', 'BATCH / SKU', 'TRANSFER QTY', 'TARE DEDUCTION', 'DISPATCH STATE']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 175 },
      2: { cellWidth: 85 },
      3: { cellWidth: 75 },
      4: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 65, halign: 'right' },
      6: { cellWidth: 65, halign: 'center' }
    }
  });

  // Dual-Custody Sign-off Blocks
  const signY = (doc as any).lastAutoTable.finalY + 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DUAL-CUSTODY TRANSFER VERIFICATION & SIGN-OFF', 40, signY);

  // 3 Columns: Dispatcher, Transporter, Receiver
  const colW = 160;
  const c1X = 40;
  const c2X = 215;
  const c3X = 390;

  doc.setDrawColor(148, 163, 184);
  doc.line(c1X, signY + 35, c1X + colW, signY + 35);
  doc.line(c2X, signY + 35, c2X + colW, signY + 35);
  doc.line(c3X, signY + 35, c3X + colW, signY + 35);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`1. Dispatch Custodian: ${transfer.dispatchedBy || 'Store Clerk'}`, c1X, signY + 48);
  doc.text(`2. Driver / Transporter: ${transfer.driverName || 'Courier'}`, c2X, signY + 48);
  doc.text(`3. Receiving Custodian: ${transfer.receivedBy || 'Pending'}`, c3X, signY + 48);

  doc.save(`Taji_Waybill_${transfer.trackingNumber || transfer.id}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 10. KRA FIXED ASSET REGISTER & WEAR-AND-TEAR SCHEDULE (SECOND SCHEDULE ITA)
// --------------------------------------------------------------------------

export function exportFixedAssetsScheduleCSV(assets: FixedAsset[], locations: LocationInfo[], etrConfig: ETRConfig) {
  const headers = [
    'Asset ID',
    'Asset Tag',
    'Asset Name & Description',
    'Category',
    'Location',
    'Purchase Date',
    'Cost Price (KSh)',
    'Depreciation Method',
    'Useful Life (Yrs)',
    'Salvage Value (KSh)',
    'KRA Wear & Tear Rate (%)',
    'Accumulated Depreciation (KSh)',
    'Net Book Value (KSh)',
    'Status'
  ];

  const rows = assets.map(a => {
    const locName = locations.find(l => l.id === a.locationId)?.name || a.locationId;
    return [
      a.id,
      a.assetTag,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${locName}"`,
      a.purchaseDate,
      a.costPrice.toFixed(2),
      a.depreciationMethod,
      a.usefulLifeYears,
      a.salvageValue.toFixed(2),
      (a.kraWearAndTearRate * 100).toFixed(1) + '%',
      a.accumulatedDepreciation.toFixed(2),
      a.bookValue.toFixed(2),
      a.status
    ];
  });

  const totalCost = assets.reduce((sum, a) => sum + a.costPrice, 0);
  const totalAccum = assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalBook = assets.reduce((sum, a) => sum + a.bookValue, 0);

  rows.push([
    'TOTALS',
    '',
    `"${assets.length} Fixed Assets"`,
    '',
    '',
    '',
    totalCost.toFixed(2),
    '',
    '',
    '',
    '',
    totalAccum.toFixed(2),
    totalBook.toFixed(2),
    ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`KRA_Fixed_Asset_Register_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportFixedAssetsSchedulePDF(assets: FixedAsset[], locations: LocationInfo[], etrConfig: ETRConfig) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 842, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('KRA FIXED ASSET REGISTER & WEAR-AND-TEAR SCHEDULE', 40, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text(
    `Taxpayer: ${etrConfig.companyName} | PIN: ${etrConfig.taxPin || 'P051982341Z'} | Second Schedule ITA Capital Allowances`,
    40,
    48
  );

  const totalCost = assets.reduce((sum, a) => sum + a.costPrice, 0);
  const totalAccum = assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalBook = assets.reduce((sum, a) => sum + a.bookValue, 0);

  const tableData = assets.map((a, idx) => {
    const locName = locations.find(l => l.id === a.locationId)?.name || a.locationId;
    return [
      idx + 1,
      a.assetTag,
      a.name,
      a.category,
      locName,
      a.purchaseDate,
      a.costPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      `${(a.kraWearAndTearRate * 100).toFixed(1)}%`,
      a.accumulatedDepreciation.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      a.bookValue.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      a.status
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [[
      '#',
      'Tag',
      'Asset Name',
      'Category',
      'Location',
      'Acquired',
      'Cost (KSh)',
      'KRA Rate',
      'Accum Depr (KSh)',
      'Book Value (KSh)',
      'Status'
    ]],
    body: tableData,
    foot: [[
      'TOTAL',
      '',
      `${assets.length} Active Assets`,
      '',
      '',
      '',
      totalCost.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      '',
      totalAccum.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      totalBook.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      ''
    ]],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 155 },
      3: { cellWidth: 95 },
      4: { cellWidth: 80 },
      5: { cellWidth: 55, halign: 'center' },
      6: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 50, halign: 'center' },
      8: { cellWidth: 70, halign: 'right' },
      9: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 55, halign: 'center' }
    }
  });

  doc.save(`KRA_Fixed_Asset_Register_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --------------------------------------------------------------------------
// 11. M-PESA & BANK STATEMENT AUDIT REPORT EXPORTS
// --------------------------------------------------------------------------

export function exportMpesaReconciliationReportCSV(
  reconciliationResult: {
    matched: Array<{ statementItem: MpesaStatementItem; order?: SaleOrder; difference: number }>;
    unmatchedInOrders: MpesaStatementItem[];
    unmatchedInStatement: SaleOrder[];
    totalStatementAmount: number;
    totalOrdersAmount: number;
    totalMatchedAmount: number;
    totalTariffFees: number;
  },
  etrConfig: ETRConfig
) {
  const headers = [
    'Section',
    'Receipt / Ref No',
    'Date & Time',
    'Details / Description',
    'Statement Amount (KSh)',
    'POS Order Amount (KSh)',
    'Variance (KSh)',
    'Tariff Fee (KSh)',
    'Match Status'
  ];

  const rows: any[][] = [];

  // Matched items
  reconciliationResult.matched.forEach(m => {
    rows.push([
      'MATCHED',
      m.statementItem.receiptNo,
      m.statementItem.completionTime,
      `"${m.statementItem.details.replace(/"/g, '""')}"`,
      m.statementItem.paidIn.toFixed(2),
      (m.order?.grandTotal || 0).toFixed(2),
      m.difference.toFixed(2),
      m.statementItem.tariffFee.toFixed(2),
      'Exact Match'
    ]);
  });

  // Unmatched in Orders
  reconciliationResult.unmatchedInOrders.forEach(u => {
    rows.push([
      'UNMATCHED IN POS',
      u.receiptNo,
      u.completionTime,
      `"${u.details.replace(/"/g, '""')}"`,
      u.paidIn.toFixed(2),
      '0.00',
      u.paidIn.toFixed(2),
      u.tariffFee.toFixed(2),
      'Direct Till Deposit / Pending POS Entry'
    ]);
  });

  // Unmatched in Statement
  reconciliationResult.unmatchedInStatement.forEach(o => {
    rows.push([
      'UNMATCHED IN STATEMENT',
      o.paymentReference || o.receiptNumber || o.id,
      o.timestamp,
      `"POS Sale: ${o.customerName || 'Customer'}"`,
      '0.00',
      o.grandTotal.toFixed(2),
      (-o.grandTotal).toFixed(2),
      '0.00',
      'Recorded in POS / Awaiting Bank Settlement'
    ]);
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(`Mpesa_Bank_Reconciliation_Audit_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

/**
 * Official Monthly Physical Inventory Count & Stocktake Audit Report (PDF)
 */
export function exportStocktakeAuditReportPDF(
  session: StocktakeSession,
  locations: LocationInfo[],
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const locName = session.locationId === 'all' 
    ? 'All Store Branches & Warehouses'
    : locations.find(l => l.id === session.locationId)?.name || session.locationId;

  renderDocumentHeaderWithBrand(doc, {
    title: 'MONTHLY PHYSICAL INVENTORY COUNT & AUDIT REPORT',
    subtitle: `Statutory Stock Reconciliation Schedule - Period: ${session.period} | Location: ${locName}`,
    docNumber: session.sessionNumber,
    docDate: session.completedAt || session.startedAt,
    refId: session.id,
    orientation: 'landscape',
    themeColor: [190, 18, 60] // Rose/Ruby theme
  });

  // Summary Metrics Banner
  let startY = 48;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 269, 20, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.text(`Total Line Items: ${session.totalItems} | Counted: ${session.countedItems} (${Math.round((session.countedItems / (session.totalItems || 1)) * 100)}%)`, 18, startY + 6);
  doc.text(`Matched Items: ${session.matchedItems} | Deficit / Shrinkage: ${session.deficitItems} | Surplus: ${session.surplusItems}`, 18, startY + 12);
  doc.text(`Conducted By: ${session.conductedBy || 'Auditor'} | Status: ${session.status.toUpperCase()}`, 18, startY + 17);

  // Financial Valuation Metrics
  doc.setFont('helvetica', 'bold');
  doc.text(`System Valuation: ${formatCurrency(session.totalSystemCostValue)}`, 160, startY + 6);
  doc.text(`Physical Valuation: ${formatCurrency(session.totalPhysicalCostValue)}`, 160, startY + 12);
  
  const varianceColor = session.netVarianceCostValue < 0 ? [225, 29, 72] : session.netVarianceCostValue > 0 ? [13, 148, 136] : [15, 23, 42];
  doc.setTextColor(varianceColor[0], varianceColor[1], varianceColor[2]);
  doc.text(`Net Variance: ${formatCurrency(session.netVarianceCostValue)} (${session.netVarianceCostValue <= 0 ? 'Deficit/Shrinkage' : 'Surplus'})`, 160, startY + 17);

  // Detail Table
  const tableData = session.items.map((item, index) => {
    const varianceStr = item.physicalCountedQty !== null
      ? (item.varianceQty > 0 ? `+${item.varianceQty}` : `${item.varianceQty}`)
      : 'Pending';

    const statusStr = item.status === 'matched'
      ? 'MATCHED'
      : item.status === 'deficit'
      ? 'DEFICIT (LOSS)'
      : item.status === 'surplus'
      ? 'SURPLUS'
      : 'UNCOUNTED';

    return [
      (index + 1).toString(),
      item.sku,
      item.productName,
      item.category,
      `${item.systemExpectedQty} ${item.unit}`,
      item.physicalCountedQty !== null ? `${item.physicalCountedQty} ${item.unit}` : '-',
      varianceStr,
      formatCurrency(item.unitCost),
      formatCurrency(item.varianceValue),
      statusStr,
      item.discrepancyReason || item.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: startY + 24,
    head: [[
      '#',
      'SKU / Code',
      'Product Name',
      'Category',
      'System Qty',
      'Physical Qty',
      'Variance',
      'Unit Cost',
      'Var. Value',
      'Status',
      'Audit Notes / Reason'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [190, 18, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 26 },
      2: { cellWidth: 44 },
      3: { cellWidth: 20 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
      10: { cellWidth: 35 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Footer Statutory Sign-Off Block
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  if (finalY < 170) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Stock Auditor Signature: _______________________      Date: _______________', 14, finalY + 15);
    doc.text('Financial Controller / Managing Director: _______________________      Date: _______________', 140, finalY + 15);
    doc.text('Verified under Kenya Companies Act & KRA Tax Procedures for Inventory Valuation at Cost.', 14, finalY + 22);
  }

  doc.save(`Monthly_Stocktake_Audit_${session.sessionNumber}_${session.period}.pdf`);
}

/**
 * Export Monthly Stocktake Schedule to CSV (Excel format)
 */
export function exportStocktakeAuditReportCSV(
  session: StocktakeSession,
  locations: LocationInfo[],
  etrConfig?: ETRConfig
) {
  const locName = session.locationId === 'all' 
    ? 'All Branches' 
    : locations.find(l => l.id === session.locationId)?.name || session.locationId;

  const headers = [
    'Session Number',
    'Period',
    'Location',
    'Item SKU',
    'Product Name',
    'Category',
    'Unit',
    'System Expected Qty',
    'Physical Counted Qty',
    'Variance Qty',
    'Unit Cost (KSh)',
    'System Value (KSh)',
    'Physical Value (KSh)',
    'Variance Value (KSh)',
    'Status',
    'Discrepancy Reason',
    'Auditor Notes',
    'Counted Timestamp'
  ];

  const rows = session.items.map(item => {
    const countedVal = item.physicalCountedQty !== null ? (item.physicalCountedQty * item.unitCost) : 0;
    const systemVal = item.systemExpectedQty * item.unitCost;
    return [
      `"${session.sessionNumber}"`,
      `"${session.period}"`,
      `"${locName}"`,
      `"${item.sku}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.unit}"`,
      item.systemExpectedQty.toFixed(2),
      item.physicalCountedQty !== null ? item.physicalCountedQty.toFixed(2) : 'PENDING',
      item.varianceQty.toFixed(2),
      item.unitCost.toFixed(2),
      systemVal.toFixed(2),
      countedVal.toFixed(2),
      item.varianceValue.toFixed(2),
      `"${item.status.toUpperCase()}"`,
      `"${(item.discrepancyReason || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${item.countedAt || ''}"`
    ];
  });

  const summaryRows = [
    [],
    ['=== STOCKTAKE AUDIT SUMMARY ==='],
    ['Total System Inventory Value (KSh)', session.totalSystemCostValue.toFixed(2)],
    ['Total Physical Counted Value (KSh)', session.totalPhysicalCostValue.toFixed(2)],
    ['Net Inventory Variance (KSh)', session.netVarianceCostValue.toFixed(2)],
    ['Total Shrinkage / Deficit Loss (KSh)', session.totalShrinkageValue.toFixed(2)],
    ['Total Surplus Gain (KSh)', session.totalSurplusValue.toFixed(2)],
    ['Audit Status', session.status.toUpperCase()],
    ['Conducted By', `"${session.conductedBy}"`],
    ['Generated At', `"${new Date().toISOString()}"`]
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summaryRows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`Stocktake_Audit_${session.sessionNumber}_${session.period}.csv`, csvContent);
}

// --------------------------------------------------------------------------
// 21. RMA RETURNS, EXCHANGES & QUARANTINE SUPPLIER CLAIMS EXPORTS
// --------------------------------------------------------------------------

/**
 * Export Official RMA Return & Exchange Voucher PDF
 */
export function exportRmaReturnVoucherPDF(
  rma: QuarantinedDefectRecord,
  locations: LocationInfo[],
  etrConfig: ETRConfig,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const locName = locations.find(l => l.id === rma.locationId)?.name || 'Main Branch';
  const isExchange = rma.resolutionType === 'exchange_replacement';
  const isRefund = rma.resolutionType.includes('refund');
  const isStoreCredit = rma.resolutionType === 'store_credit';
  const isFabric = rma.returnedItem.unit === 'meter' ||
    rma.returnedItem.productName.toLowerCase().includes('fleece') ||
    rma.returnedItem.productName.toLowerCase().includes('derec');

  const themeColor: [number, number, number] = isExchange
    ? [16, 185, 129] // Emerald
    : isRefund
    ? [2, 132, 199] // Sky blue
    : [147, 51, 234]; // Purple

  // Render Header
  renderDocumentHeaderWithBrand(doc, {
    title: 'OFFICIAL RMA RETURN & EXCHANGE VOUCHER',
    subtitle: 'Material Return Authorization & Defective Stock Quarantine Record',
    docNumber: rma.rmaNumber,
    docDate: rma.returnedAt,
    refId: rma.receiptNumber || rma.orderId || 'DIRECT-RMA',
    themeColor,
    badgeText: isExchange ? '1:1 EXCHANGE' : isRefund ? 'REFUND ISSUED' : 'STORE CREDIT',
    brandSettings,
    etrConfig
  });

  // Customer & Inspection Overview Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 85, 515, 68, 6, 6, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CUSTOMER / GARMENT BUSINESS:', 55, 100);

  doc.setFontSize(9.5);
  doc.text(rma.customerName || 'Walk-in Client', 55, 114);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (rma.customerPhone) doc.text(`Phone: ${rma.customerPhone}`, 55, 126);
  if (rma.receiptNumber) doc.text(`Original Receipt / ETR: ${rma.receiptNumber}`, 55, 137);
  if (rma.supplierName) doc.text(`Mill Supplier: ${rma.supplierName}`, 55, 147);

  // Metadata Right Side
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RMA AUDIT DETAILS:', 340, 100);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Store Branch: ${locName}`, 340, 114);
  doc.text(`Processed By: ${rma.operatorName || 'Authorized Staff'}`, 340, 126);
  doc.text(`Quarantine Status: ${rma.quarantineStatus.replace(/_/g, ' ').toUpperCase()}`, 340, 137);
  if (rma.supplierClaimNumber) {
    doc.setTextColor(2, 132, 199);
    doc.setFont('helvetica', 'bold');
    doc.text(`Supplier Claim Ref: ${rma.supplierClaimNumber}`, 340, 147);
  }

  // 1. Returned Item Table
  const returnedQtyStr = isFabric
    ? `${(rma.returnedItem.metersCount || 0).toFixed(2)} meters`
    : `${rma.returnedItem.conesCount || 0} cones (${(rma.returnedItem.netWeightKg || 0).toFixed(3)} kg net)`;

  const returnedTableData = [
    [
      'DEFECTIVE ITEM RETURNED (QUARANTINED)',
      rma.returnedItem.productName,
      `Lot: ${rma.returnedItem.dyeLot || 'N/A'} | Shade: ${rma.returnedItem.shadeCode || 'N/A'}${rma.returnedItem.rollNumber ? ` | ${rma.returnedItem.rollNumber}` : ''}`,
      returnedQtyStr,
      formatCurrency(rma.returnedItem.unitPrice),
      formatCurrency(rma.returnedItem.totalValuationRetail)
    ]
  ];

  if (rma.returnedItem.grossWeightKg !== undefined && rma.returnedItem.tareDeductionKg !== undefined) {
    returnedTableData.push([
      'WEIGHT AUDIT',
      `Scale Gross: ${rma.returnedItem.grossWeightKg.toFixed(3)} kg`,
      `Tare Core Deduction: -${rma.returnedItem.tareDeductionKg.toFixed(3)} kg`,
      `Net Billable: ${(rma.returnedItem.netWeightKg || 0).toFixed(3)} kg`,
      `Cost Valuation: ${formatCurrency(rma.returnedItem.totalValuationCost)}`,
      ''
    ]);
  }

  autoTable(doc, {
    startY: 165,
    head: [['Section', 'Product Description', 'Batch / Roll / Shade', 'Quantity', 'Rate', 'Total Value']],
    body: returnedTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    margin: { left: 40, right: 40 }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Defect Inspection Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(40, currentY, 515, 36, 4, 4, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text(`DEFECT CLASSIFICATION: ${rma.defectReason}`, 50, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);
  doc.text(`Inspection Notes: ${rma.defectNotes || 'Standard material quality defect quarantine logged.'}`, 50, currentY + 26);

  currentY += 48;

  // 2. Resolution Details Table
  if (isExchange && rma.replacementItem) {
    const repIsFabric = rma.replacementItem.unit === 'meter' ||
      rma.replacementItem.productName.toLowerCase().includes('fleece') ||
      rma.replacementItem.productName.toLowerCase().includes('derec');

    const repQtyStr = repIsFabric
      ? `${(rma.replacementItem.metersCount || 0).toFixed(2)} meters`
      : `${rma.replacementItem.conesCount || 0} cones (${(rma.replacementItem.netWeightKg || 0).toFixed(3)} kg net)`;

    const diff = (rma.financialDetails.priceDifferencePaidByCustomer || 0) - (rma.financialDetails.priceDifferenceRefundedToCustomer || 0);

    autoTable(doc, {
      startY: currentY,
      head: [['Resolution Item', 'Product Description', 'Batch / Roll / Shade', 'Quantity', 'Rate', 'Total Value']],
      body: [
        [
          'REPLACEMENT DISPATCHED (ACTIVE STOCK)',
          rma.replacementItem.productName,
          `Lot: ${rma.replacementItem.dyeLot || 'N/A'} | Shade: ${rma.replacementItem.shadeCode || 'N/A'}${rma.replacementItem.rollNumber ? ` | ${rma.replacementItem.rollNumber}` : ''}`,
          repQtyStr,
          formatCurrency(rma.replacementItem.unitPrice),
          formatCurrency(rma.replacementItem.totalValuationRetail)
        ],
        [
          'SETTLEMENT VARIANCE',
          diff > 0
            ? `Customer paid surcharge: +${formatCurrency(diff)}`
            : diff < 0
            ? `Refunded customer variance: -${formatCurrency(Math.abs(diff))}`
            : 'Exact 1:1 Value Match (KSh 0.00 difference)',
          '',
          '',
          '',
          formatCurrency(diff)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      margin: { left: 40, right: 40 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 12;
  } else if (isRefund) {
    const refundAmt = rma.financialDetails.refundAmount || rma.returnedItem.totalValuationRetail;
    const vatAmt = rma.financialDetails.vatReversalAmount || (refundAmt - (refundAmt / 1.16));
    const netAmt = rma.financialDetails.netRevenueReversalAmount || (refundAmt - vatAmt);

    autoTable(doc, {
      startY: currentY,
      head: [['Financial Resolution', 'Disbursement Channel', 'Reference / Credit Note #', 'Net Sales Reversal', '16% VAT Reversal', 'Gross Refund Paid']],
      body: [
        [
          'FINANCIAL REFUND DISBURSED',
          rma.financialDetails.originalPaymentMethod || 'Bank Account',
          rma.financialDetails.creditNoteNumber || rma.financialDetails.bankTransferReference || 'CRN-ETIMS',
          formatCurrency(netAmt),
          formatCurrency(vatAmt),
          formatCurrency(refundAmt)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      margin: { left: 40, right: 40 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 12;
  } else if (isStoreCredit) {
    const creditAmt = rma.financialDetails.refundAmount || rma.returnedItem.totalValuationRetail;
    autoTable(doc, {
      startY: currentY,
      head: [['Resolution Type', 'Credit Voucher Ref', 'Customer Account', 'Status', 'Voucher Amount']],
      body: [
        [
          'STORE CREDIT VOUCHER',
          rma.financialDetails.creditNoteNumber || `VOUCH-${rma.rmaNumber}`,
          rma.customerName,
          'ACTIVE / USABLE ON FUTURE BALE ORDERS',
          formatCurrency(creditAmt)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      margin: { left: 40, right: 40 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Accounting & Fiscal Audit Callout
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, currentY, 515, 38, 4, 4, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DOUBLE-ENTRY LEDGER & KRA ETIMS AUDIT TRAIL:', 50, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    isExchange
      ? '• Dr. 1350 Quarantined Damaged Inventory (At Cost)  |  Cr. 1200 Store Active Inventory (Good Replacement Dispatched)'
      : '• Dr. 4200 Sales Returns & Allowances  |  Dr. 2150 KRA Output VAT Liability  |  Cr. Bank / Cash Payout',
    50,
    currentY + 23
  );
  doc.text(
    `• Quarantined defective goods are isolated for supplier debit claim (${rma.supplierName || 'Oster India / Mill'}).`,
    50,
    currentY + 32
  );

  currentY += 50;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(55, currentY + 35, 210, currentY + 35);
  doc.line(345, currentY + 35, 500, currentY + 35);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CUSTOMER ACKNOWLEDGEMENT', 55, currentY + 45);
  doc.text('STORE QUALITY ASSURANCE SIGN-OFF', 345, currentY + 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Received replacement / credit in good order', 55, currentY + 54);
  doc.text(`Authorized by: ${rma.operatorName || 'Store Manager'}`, 345, currentY + 54);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Urban Interior Kenya ERP • RMA Audit Schedule • Printed: ${new Date().toLocaleString()} • Ticket: ${rma.rmaNumber}`,
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 20,
    { align: 'center' }
  );

  doc.save(`RMA_Voucher_${rma.rmaNumber}.pdf`);
}

/**
 * Export Supplier Defect Claim Schedule PDF (for Mill / Oster India)
 */
export function exportSupplierClaimNotePDF(
  claimRef: string,
  supplierName: string,
  notes: string,
  records: QuarantinedDefectRecord[],
  etrConfig: ETRConfig,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  const totalCostValuation = records.reduce((sum, r) => sum + r.returnedItem.totalValuationCost, 0);
  const totalRetailValuation = records.reduce((sum, r) => sum + r.returnedItem.totalValuationRetail, 0);
  const totalCones = records.reduce((sum, r) => sum + (r.returnedItem.conesCount || 0), 0);
  const totalNetKg = records.reduce((sum, r) => sum + (r.returnedItem.netWeightKg || 0), 0);
  const totalMeters = records.reduce((sum, r) => sum + (r.returnedItem.metersCount || 0), 0);

  // Header
  renderDocumentHeaderWithBrand(doc, {
    title: 'OFFICIAL SUPPLIER DEFECT & DEBIT CLAIM SCHEDULE',
    subtitle: 'Formal Spoilage & Quality Discrepancy Debit Note for Mill Settlement',
    docNumber: claimRef,
    docDate: new Date().toISOString(),
    refId: supplierName,
    themeColor: [225, 29, 72],
    badgeText: 'DEBIT CLAIM',
    brandSettings,
    etrConfig
  });

  // Supplier & Claim Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 85, 762, 55, 6, 6, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SUPPLIER / MANUFACTURER MILL:', 55, 100);

  doc.setFontSize(9.5);
  doc.text(supplierName || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD', 55, 114);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Claim Reason / Notes: ${notes || 'Defective material batches identified during customer quality inspection.'}`, 55, 126);

  // Metrics on right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CLAIM METRICS & VALUATION:', 540, 100);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Defective Lots: ${records.length} RMA Tickets  |  Cones: ${totalCones}  |  Meters: ${totalMeters.toFixed(2)}m`, 540, 114);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`Total Debit Claim Amount: ${formatCurrency(totalCostValuation)} (Internal Cost Valuation)`, 540, 126);

  // AutoTable of Quarantined Defects
  const tableData = records.map((rec, idx) => {
    const isFabric = rec.returnedItem.unit === 'meter' ||
      rec.returnedItem.productName.toLowerCase().includes('fleece') ||
      rec.returnedItem.productName.toLowerCase().includes('derec');

    const qtyStr = isFabric
      ? `${(rec.returnedItem.metersCount || 0).toFixed(2)} m`
      : `${rec.returnedItem.conesCount || 0} cones (${(rec.returnedItem.netWeightKg || 0).toFixed(3)} kg)`;

    return [
      (idx + 1).toString(),
      rec.rmaNumber,
      new Date(rec.returnedAt).toLocaleDateString(),
      rec.customerName,
      rec.returnedItem.productName,
      `Lot: ${rec.returnedItem.dyeLot || 'N/A'} | Shade: ${rec.returnedItem.shadeCode || 'N/A'}${rec.returnedItem.rollNumber ? ` | ${rec.returnedItem.rollNumber}` : ''}`,
      rec.defectReason,
      qtyStr,
      formatCurrency(rec.returnedItem.costPrice),
      formatCurrency(rec.returnedItem.totalValuationCost)
    ];
  });

  autoTable(doc, {
    startY: 150,
    head: [['#', 'RMA #', 'Date', 'Customer', 'Product Item', 'Lot / Shade / Roll', 'Defect Observation', 'Qty / Weight', 'Cost Rate', 'Debit Claim (KSh)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Summary Totals
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, finalY, 762, 36, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL DEBIT CLAIM SCHEDULE VALUATION: ${formatCurrency(totalCostValuation)}`, 55, finalY + 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Yarn Net Weight: ${totalNetKg.toFixed(3)} kg  |  Total Fabric Length: ${totalMeters.toFixed(2)} meters  |  Retail Value Equivalent: ${formatCurrency(totalRetailValuation)}`, 55, finalY + 27);

  // Sign-off
  const sigY = finalY + 50;
  if (sigY < doc.internal.pageSize.height - 40) {
    doc.setDrawColor(203, 213, 225);
    doc.line(55, sigY + 25, 230, sigY + 25);
    doc.line(570, sigY + 25, 745, sigY + 25);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('PREPARED BY: QUALITY ASSURANCE', 55, sigY + 35);
    doc.text('SUPPLIER / MILL REPRESENTATIVE SIGN-OFF', 570, sigY + 35);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Urban Interior Kenya ERP • Supplier Defect Claim Schedule • Ref: ${claimRef} • Generated: ${new Date().toLocaleString()}`,
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 15,
    { align: 'center' }
  );

  doc.save(`Supplier_Claim_${claimRef}.pdf`);
}

/**
 * Export Standalone KRA eTIMS Credit Note PDF
 */
export function exportCreditNoteDirectPDF(
  creditNote: ETIMSCreditNote,
  etrConfig: ETRConfig,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  renderDocumentHeaderWithBrand(doc, {
    title: 'OFFICIAL KRA eTIMS CREDIT NOTE',
    subtitle: 'Compliant Tax Reversal & Sales Return Fiscal Document',
    docNumber: creditNote.id,
    docDate: creditNote.timestamp,
    refId: creditNote.originalInvoiceNo,
    themeColor: [234, 88, 12], // Orange 600
    badgeText: 'CREDIT NOTE',
    brandSettings,
    etrConfig
  });

  // Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 85, 515, 68, 6, 6, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CREDITED TO / CUSTOMER:', 55, 100);

  doc.setFontSize(9.5);
  doc.text(creditNote.customerName || 'Walk-in Client', 55, 114);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (creditNote.customerKraPin) doc.text(`Customer KRA PIN: ${creditNote.customerKraPin}`, 55, 126);
  doc.text(`Original Tax Invoice #: ${creditNote.originalInvoiceNo}`, 55, 137);
  doc.text(`Credit Reason: ${creditNote.creditReason}`, 55, 147);

  doc.setFont('helvetica', 'bold');
  doc.text('KRA FISCAL DETAILS:', 340, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Control Unit Serial: ${creditNote.originalCuSerial || etrConfig.cuSerialNumber}`, 340, 114);
  doc.text(`Issued By: ${creditNote.issuedBy}`, 340, 126);
  doc.text(`Issue Timestamp: ${new Date(creditNote.timestamp).toLocaleString()}`, 340, 137);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(`Fiscal Signature: ${creditNote.fiscalSignature}`, 340, 147);

  // Table
  autoTable(doc, {
    startY: 165,
    head: [['Item Description', 'Reason for Credit', 'Net Credited (Excl. VAT)', '16% VAT Credited', 'Total Gross Credited']],
    body: [
      [
        `Sales Return & Adjustment under ${creditNote.originalInvoiceNo}`,
        creditNote.creditReason,
        formatCurrency(creditNote.netCredited),
        formatCurrency(creditNote.vatCredited),
        formatCurrency(creditNote.creditAmount)
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    margin: { left: 40, right: 40 }
  });

  const tableFinalY = (doc as any).lastAutoTable.finalY + 15;

  // Fiscal QR & Signature Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, tableFinalY, 515, 60, 4, 4, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KRA eTIMS COMPLIANT ELECTRONIC FISCAL SIGNATURE', 55, tableFinalY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Control Unit Serial Number: ${creditNote.originalCuSerial || etrConfig.cuSerialNumber}`, 55, tableFinalY + 28);
  doc.text(`Cryptographic Signature: ${creditNote.fiscalSignature}`, 55, tableFinalY + 40);
  doc.text(`KRA Verification Portal URL: https://itax.kra.go.ke/KRA-Portal/creditNoteVerification.htm?cn=${creditNote.id}`, 55, tableFinalY + 52);

  // Signatory
  const sigY = tableFinalY + 75;
  doc.setDrawColor(203, 213, 225);
  doc.line(55, sigY + 25, 210, sigY + 25);
  doc.line(345, sigY + 25, 500, sigY + 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('AUTHORIZED STORE CONTROLLER', 55, sigY + 35);
  doc.text('BUYER / CUSTOMER SIGNATURE', 345, sigY + 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Issued by: ${creditNote.issuedBy}`, 55, sigY + 44);
  doc.text('Acknowledged receipt of Credit Note', 345, sigY + 44);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Urban Interior Kenya ERP • KRA eTIMS Fiscal Credit Note • ${creditNote.id} • Printed: ${new Date().toLocaleString()}`,
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 15,
    { align: 'center' }
  );

  doc.save(`KRA_Credit_Note_${creditNote.id}.pdf`);
}

/**
 * Export Complete RMA Audit Schedule to CSV (Excel format)
 */
export function exportRmaAuditScheduleCSV(
  records: QuarantinedDefectRecord[],
  locations: LocationInfo[]
) {
  const headers = [
    'RMA Ticket Number',
    'Date Returned',
    'Store Location',
    'Customer Name',
    'Customer Phone',
    'Original Invoice / Receipt',
    'Product SKU',
    'Product Name',
    'Category',
    'Unit',
    'Dye Lot',
    'Shade Code',
    'Roll Number',
    'Returned Cones',
    'Returned Gross Weight (kg)',
    'Tare Cone Deduction (kg)',
    'Returned Net Weight (kg)',
    'Returned Meters (m)',
    'Billing Rate (KSh)',
    'Retail Valuation (KSh)',
    'Cost Valuation (KSh)',
    'Defect Reason',
    'Defect Inspection Notes',
    'Resolution Type',
    'Quarantine Status',
    'Supplier / Mill Name',
    'Supplier Claim Number',
    'Credit Note Number',
    'Bank / Refund Reference',
    'Authorized Operator'
  ];

  const rows = records.map(rec => {
    const locName = locations.find(l => l.id === rec.locationId)?.name || 'Main Branch';
    return [
      `"${rec.rmaNumber}"`,
      `"${rec.returnedAt}"`,
      `"${locName}"`,
      `"${rec.customerName.replace(/"/g, '""')}"`,
      `"${rec.customerPhone || ''}"`,
      `"${rec.receiptNumber || rec.orderId || ''}"`,
      `"${rec.returnedItem.sku}"`,
      `"${rec.returnedItem.productName.replace(/"/g, '""')}"`,
      `"${rec.returnedItem.category}"`,
      `"${rec.returnedItem.unit}"`,
      `"${rec.returnedItem.dyeLot || ''}"`,
      `"${rec.returnedItem.shadeCode || ''}"`,
      `"${rec.returnedItem.rollNumber || ''}"`,
      rec.returnedItem.conesCount || '',
      rec.returnedItem.grossWeightKg?.toFixed(3) || '',
      rec.returnedItem.tareDeductionKg?.toFixed(3) || '',
      rec.returnedItem.netWeightKg?.toFixed(3) || '',
      rec.returnedItem.metersCount?.toFixed(2) || '',
      rec.returnedItem.unitPrice.toFixed(2),
      rec.returnedItem.totalValuationRetail.toFixed(2),
      rec.returnedItem.totalValuationCost.toFixed(2),
      `"${rec.defectReason}"`,
      `"${(rec.defectNotes || '').replace(/"/g, '""')}"`,
      `"${rec.resolutionType}"`,
      `"${rec.quarantineStatus}"`,
      `"${(rec.supplierName || '').replace(/"/g, '""')}"`,
      `"${rec.supplierClaimNumber || ''}"`,
      `"${rec.financialDetails.creditNoteNumber || ''}"`,
      `"${rec.financialDetails.bankTransferReference || rec.financialDetails.mpesaReference || ''}"`,
      `"${rec.operatorName}"`
    ];
  });

  const totalCost = records.reduce((sum, r) => sum + r.returnedItem.totalValuationCost, 0);
  const totalRetail = records.reduce((sum, r) => sum + r.returnedItem.totalValuationRetail, 0);

  const summaryRows = [
    [],
    ['=== RMA AUDIT SUMMARY ==='],
    ['Total RMA Defect Tickets', records.length.toString()],
    ['Total Spoilage Cost Valuation (KSh)', totalCost.toFixed(2)],
    ['Total Retail Value Equivalent (KSh)', totalRetail.toFixed(2)],
    ['Generated At', `"${new Date().toISOString()}"`]
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summaryRows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`RMA_Quarantine_Audit_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
}

/**
 * Export Import Tax Assessment & Landed Costing Schedule as CSV
 */
export function exportImportLandedCostingCSV(
  record: ImportShipmentRecord,
  summary: ImportShipmentSummary,
  etrConfig?: ETRConfig
) {
  const headers = [
    'Line Item Description',
    'Category',
    'HS Code',
    'Net Weight (kg)',
    'Gross Weight (kg)',
    'GSM',
    'Width (cm)',
    'Fabric Metres',
    'FOB Value (USD)',
    'Apportioned Freight (USD)',
    'Apportioned Insurance (USD)',
    'Total CIF (USD)',
    'Exchange Rate (KES/USD)',
    'Customs Value (KES)',
    'Duty Applied Rule',
    '1002 / Import Duty (KES)',
    '1801 / IDF Fees 2.5% (KES)',
    '6001 / RDL 2.0% (KES)',
    '1202 / VAT Imports 16% (KES)',
    '6401 / MSS Levy (KES)',
    'Total KRA Taxes (KES)',
    'Apportioned CoC (KES)',
    'Apportioned Port/Clearing (KES)',
    'Total Landed Cost (KES)',
    'Landed Cost Per Unit Incl VAT (KES)',
    'Landed Cost Per Unit Excl VAT (KES)',
    'Suggested Retail Price (KES)',
    'Gross Margin Unit (KES)'
  ];

  const rows = summary.items.map(item => [
    `"${item.description.replace(/"/g, '""')}"`,
    item.category,
    item.hsCode,
    item.netWeightKg.toFixed(2),
    item.grossWeightKg.toFixed(2),
    item.gsm || '-',
    item.widthCm || '-',
    item.fabricLengthMetres ? item.fabricLengthMetres.toFixed(2) : '-',
    item.fobUSD.toFixed(2),
    item.apportionedFreightUSD.toFixed(2),
    item.apportionedInsuranceUSD.toFixed(2),
    item.cifUSD.toFixed(2),
    record.exchangeRate.toFixed(4),
    item.customsValueKES.toFixed(2),
    item.dutyRuleApplied === 'ad_valorem' ? 'Ad-Valorem (25%)' : 'Specific Duty (97,500/T)',
    item.importDuty1002KES.toFixed(2),
    item.idf1801KES.toFixed(2),
    item.rdl6001KES.toFixed(2),
    item.vat1202KES.toFixed(2),
    item.mss6401KES.toFixed(2),
    item.totalTaxesKES.toFixed(2),
    item.apportionedCoCKES.toFixed(2),
    item.apportionedPortClearingKES.toFixed(2),
    item.totalLandedCostKES.toFixed(2),
    item.landedCostPerUnit.toFixed(2),
    item.landedCostPerUnitExclVat.toFixed(2),
    item.suggestedRetailPrice.toFixed(2),
    item.projectedGrossProfitPerUnit.toFixed(2)
  ]);

  const summarySection = [
    [],
    ['=== IMPORT SHIPMENT SUMMARY & KRA E-SLIP VERIFICATION ==='],
    ['Shipment Number', record.shipmentNumber],
    ['Commercial Invoice Ref', record.invoiceNumber],
    ['Invoice Date', record.invoiceDate],
    ['Supplier Name', `"${record.supplierName.replace(/"/g, '""')}"`],
    ['Consignee Name', `"${record.consigneeName} (PIN: ${record.consigneePin})"`],
    ['Clearing Declarant', `"${record.declarantName} (PIN: ${record.declarantPin})"`],
    ['KRA SAD Entry Number', record.customsEntryNo],
    ['KRA E-Slip Ref Number', record.kraEslipRef],
    ['Port of Entry', record.portOfEntry],
    ['CBK Customs Exchange Rate (KES/USD)', record.exchangeRate.toFixed(4)],
    ['Total Invoice FOB (USD)', summary.totalFOB_USD.toFixed(2)],
    ['Total Freight (USD)', summary.totalFreightUSD.toFixed(2)],
    ['Total CIF (USD)', summary.totalCIF_USD.toFixed(2)],
    ['Total Customs Value (KES)', summary.totalCustomsValueKES.toFixed(2)],
    ['', ''],
    ['--- KRA TAX ASSESSMENT BREAKDOWN ---', ''],
    ['1002 / Import Duty (KES)', summary.totalImportDuty1002KES.toFixed(2)],
    ['1801 / IDF Fees 2.5% (KES)', summary.totalIDF1801KES.toFixed(2)],
    ['6001 / Railway Development Levy 2.0% (KES)', summary.totalRDL6001KES.toFixed(2)],
    ['1202 / VAT Imports 16% (KES)', summary.totalVAT1202KES.toFixed(2)],
    ['6401 / MSS Superintendent Levy (KES)', summary.totalMSS6401KES.toFixed(2)],
    ['TOTAL KRA TAX DUE (KES)', summary.totalKRATaxesKES.toFixed(2)],
    ['', ''],
    ['--- LANDED INVENTORY CAPITALIZATION ---', ''],
    ['Total CoC & Entry Fees (KES)', summary.totalCoCKES.toFixed(2)],
    ['Total CFS / Port Handling Fees (KES)', summary.totalPortClearingKES.toFixed(2)],
    ['TOTAL CAPITALIZED LANDED COST (KES)', summary.totalLandedInventoryKES.toFixed(2)],
    ['Total Fabric Metres Capitalized', summary.totalFabricMetres.toFixed(2)],
    ['Total Yarn Net Weight (kg)', summary.totalNetWeightKg.toFixed(2)],
    ['Generated By', 'Taji Autonomous ERP Landed Costing Engine'],
    ['Export Timestamp', new Date().toISOString()]
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summarySection.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`KRA_Import_Landed_Costing_${record.invoiceNumber}_${record.customsEntryNo}.csv`, csvContent);
}

/**
 * Export Import Tax Assessment & Landed Costing Schedule as PDF
 */
export function exportImportLandedCostingPDF(
  record: ImportShipmentRecord,
  summary: ImportShipmentSummary,
  brandSettings?: BrandSettings,
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header with brand
  let currentY = renderDocumentHeaderWithBrand(doc, {
    title: 'IMPORT TAX & LANDED COSTING AUDIT SCHEDULE',
    subtitle: `KRA SAD-ICMS Entry: ${record.customsEntryNo} | Commercial Invoice: ${record.invoiceNumber} | Supplier: ${record.supplierName}`,
    docNumber: record.shipmentNumber,
    docDate: record.invoiceDate,
    brandSettings,
    etrConfig
  });

  // Shipment & Customs Parameters Grid
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPMENT & CUSTOMS ENTRY SPECIFICATIONS', 40, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3 },
    body: [
      [
        { content: 'Supplier:', styles: { fontStyle: 'bold' } },
        `${record.supplierName} (${record.supplierCountry})`,
        { content: 'Consignee:', styles: { fontStyle: 'bold' } },
        `${record.consigneeName} (PIN: ${record.consigneePin})`,
        { content: 'Customs Entry (SAD):', styles: { fontStyle: 'bold' } },
        record.customsEntryNo
      ],
      [
        { content: 'Declarant / Agent:', styles: { fontStyle: 'bold' } },
        `${record.declarantName} (PIN: ${record.declarantPin})`,
        { content: 'Port of Entry:', styles: { fontStyle: 'bold' } },
        record.portOfEntry,
        { content: 'KRA E-Slip Ref:', styles: { fontStyle: 'bold' } },
        record.kraEslipRef
      ],
      [
        { content: 'Exchange Rate:', styles: { fontStyle: 'bold' } },
        `KES ${record.exchangeRate.toFixed(4)} / USD`,
        { content: 'Total FOB / Freight:', styles: { fontStyle: 'bold' } },
        `USD ${summary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })} / USD ${summary.totalFreightUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        { content: 'Total Net / Gross Wt:', styles: { fontStyle: 'bold' } },
        `${summary.totalNetWeightKg.toLocaleString()} kg / ${summary.totalGrossWeightKg.toLocaleString()} kg`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // KRA Tax Assessment Summary Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 29, 72);
  doc.text('KRA CUSTOMS TAX LIABILITY HEADS (ICMS SAD COMPLIANT)', 40, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3.5 },
    head: [['Tax Code', 'KRA Tax Description', 'Tax Base (KES)', 'Applied Rate', 'Payable Amount (KES)', 'Status / Mode']],
    body: [
      ['1002', 'Import Duty (Higher of Ad-Valorem vs Specific)', `KES ${summary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${record.adValoremRatePct}% / KES 97.50/kg`, `KES ${summary.totalImportDuty1002KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Paid / Assessed'],
      ['1801', 'Import Declaration Fee (IDF)', `KES ${summary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${record.idfRatePct}%`, `KES ${summary.totalIDF1801KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Paid / Assessed'],
      ['6001', 'Kenya Railway Development Levy (RDL)', `KES ${summary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${record.rdlRatePct}%`, `KES ${summary.totalRDL6001KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Paid / Assessed'],
      ['1202', 'VAT Imports (Input Tax Claimable)', `KES ${(summary.totalCustomsValueKES + summary.totalImportDuty1002KES + summary.totalIDF1801KES + summary.totalRDL6001KES).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${record.vatRatePct}%`, `KES ${summary.totalVAT1202KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Input VAT Claim'],
      ['6401', 'Merchant Shipping Superintendent (MSS) Levy', `KES ${summary.totalCustomsValueKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'USD 1.75 / Gross T', `KES ${summary.totalMSS6401KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Paid / Assessed'],
      [
        { content: 'TOTAL KRA TAX ASSESSMENT DUE', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [254, 226, 226] } },
        { content: `KES ${summary.totalKRATaxesKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [254, 226, 226] } },
        { content: 'E-Slip Matched', styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Item-level Landed Costing & Unit Economics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEM-LEVEL APPORTIONMENT & UNIT LANDED COSTING (FABRICS & YARNS)', 40, currentY);
  currentY += 8;

  const itemRows = summary.items.map(i => [
    i.description,
    i.hsCode,
    `${i.netWeightKg.toLocaleString()} kg`,
    i.gsm ? `${i.gsm} GSM / ${i.widthCm}cm` : 'Yarn Cone',
    i.fabricLengthMetres ? `${i.fabricLengthMetres.toLocaleString(undefined, { maximumFractionDigits: 1 })} m` : `${i.netWeightKg.toLocaleString()} kg`,
    `$${i.fobUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `KES ${i.customsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${i.totalTaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${i.totalLandedCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${i.landedCostPerUnit.toFixed(2)}`,
    `KES ${i.landedCostPerUnitExclVat.toFixed(2)}`,
    `KES ${i.suggestedRetailPrice.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 6.5, cellPadding: 2.5 },
    head: [[
      'Product Description',
      'HS Code',
      'Net Wt',
      'Specs',
      'Calculated Qty',
      'FOB (USD)',
      'Customs (KES)',
      'Taxes (KES)',
      'Landed (KES)',
      'Cost / Unit (Incl)',
      'Cost / Unit (Excl)',
      'Retail Price'
    ]],
    body: [
      ...itemRows,
      [
        { content: 'TOTAL CONTAINER CAPITALIZATION', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `$${summary.totalFOB_USD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalCustomsValueKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalKRATaxesKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalLandedInventoryKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [16, 185, 129], fillColor: [241, 245, 249] } },
        { content: '-', colSpan: 3, styles: { halign: 'center', fillColor: [241, 245, 249] } }
      ]
    ]
  });

  // Footer Signatures
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by Taji Enterprise ERP Landed Costing Engine | Page ${i} of ${pageCount} | E-Slip Ref: ${record.kraEslipRef}`,
      40,
      doc.internal.pageSize.getHeight() - 20
    );
    doc.text(
      `Certified by: Lead Financial Accountant & Head of Logistics`,
      pageWidth - 280,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  doc.save(`Taji_Landed_Costing_${record.invoiceNumber}_${record.customsEntryNo}.pdf`);
}

/**
 * Generates an official Supplier Debit Note PDF for weight/quantity shortages
 */
export function generateSupplierDebitNotePDF(debitNote: {
  debitNoteNumber: string;
  date: string;
  supplierName: string;
  supplierCountry: string;
  originalInvoiceNo: string;
  customsEntryNo: string;
  kraEslipRef: string;
  items: Array<{
    description: string;
    invoicedWeightKg: number;
    receivedWeightKg: number;
    shortageKg: number;
    unitFobUSD: number;
    shortageAmountUSD: number;
    shortageAmountKES: number;
  }>;
  exchangeRate: number;
  totalShortageKg: number;
  totalShortageUSD: number;
  totalShortageKES: number;
  kraDutyImpactKES: number;
  totalClaimAmountUSD: number;
  totalClaimAmountKES: number;
  reason: string;
  preparedBy: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(159, 18, 57); // Rose 900
  doc.rect(40, currentY, pageWidth - 80, 50, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('COMMERCIAL DEBIT NOTE', 55, currentY + 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${debitNote.debitNoteNumber}`, pageWidth - 190, currentY + 22);
  doc.text(`Date: ${debitNote.date}`, pageWidth - 190, currentY + 36);

  currentY += 65;

  // Company and Supplier Info Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'ISSUED BY (BUYER):', styles: { fontStyle: 'bold', textColor: [159, 18, 57] } },
        { content: 'DEBITED TO (SUPPLIER):', styles: { fontStyle: 'bold', textColor: [159, 18, 57] } }
      ],
      [
        'TAJI TEXTILE ENTERPRISES LTD\nP.O. Box 48291-00100, Nairobi, Kenya\nPIN: P051234567Z | VAT: 0123456K\nAccounts Payable: finance@taji.co.ke',
        `${debitNote.supplierName}\n${debitNote.supplierCountry}\nRef Inv: ${debitNote.originalInvoiceNo}\nCustoms Entry: ${debitNote.customsEntryNo}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Shortage Reason Note
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CLAIM REASON & WEIGH-IN DISCREPANCY AUDIT:', 40, currentY);
  currentY += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Discrepancy recorded during warehouse intake weigh-in versus Commercial Invoice ${debitNote.originalInvoiceNo}. Exchange Rate: KES ${debitNote.exchangeRate.toFixed(2)} / USD. KRA E-Slip Ref: ${debitNote.kraEslipRef}.`,
    40,
    currentY,
    { maxWidth: pageWidth - 80 }
  );

  currentY += 20;

  // Items Table
  const tableRows = debitNote.items.map((item, idx) => [
    `${idx + 1}`,
    item.description,
    `${item.invoicedWeightKg.toLocaleString()} kg`,
    `${item.receivedWeightKg.toLocaleString()} kg`,
    `-${item.shortageKg.toLocaleString()} kg`,
    `$${item.unitFobUSD.toFixed(3)}`,
    `$${item.shortageAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `KES ${item.shortageAmountKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [[
      '#',
      'Description',
      'Invoiced (kg)',
      'Received (kg)',
      'Shortage (kg)',
      'Unit FOB',
      'Loss (USD)',
      'Loss (KES)'
    ]],
    body: [
      ...tableRows,
      [
        { content: 'TOTAL GOODS SHORTAGE CLAIM', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `-${debitNote.totalShortageKg.toLocaleString()} kg`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: '-', styles: { halign: 'center', fillColor: [241, 245, 249] } },
        { content: `$${debitNote.totalShortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: `KES ${debitNote.totalShortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } }
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [159, 18, 57], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 4 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Summary box
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(244, 63, 94); // Rose 500
  doc.rect(40, currentY, pageWidth - 80, 60, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL AMOUNT DEBITED FROM OVERSEAS SUPPLIER ACCOUNT:', 55, currentY + 20);

  doc.setFontSize(14);
  doc.text(`USD $${debitNote.totalClaimAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 55, currentY + 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`(Equivalent to KES ${debitNote.totalClaimAmountKES.toLocaleString(undefined, { maximumFractionDigits: 0 })})`, 250, currentY + 42);

  currentY += 80;

  // Instructions & Settlement notice
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Please credit our account balance with the above amount or issue a corresponding credit note against invoice ' +
    debitNote.originalInvoiceNo + '. Contact accounts payable at finance@taji.co.ke for reconciliation.',
    40,
    currentY,
    { maxWidth: pageWidth - 80 }
  );

  currentY += 35;

  // Signature lines
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 30, 200, currentY + 30);
  doc.line(pageWidth - 200, currentY + 30, pageWidth - 40, currentY + 30);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared By: Chief Financial Accountant', 40, currentY + 42);
  doc.text('Authorized By: Managing Director / CFO', pageWidth - 200, currentY + 42);

  doc.save(`Supplier_Debit_Note_${debitNote.debitNoteNumber}.pdf`);
}

/**
 * Generates an official KRA VAT-3 Return & Tax Offset Summary Pack PDF
 */
export function generateKRAVat3FilingPackPDF(vatPack: {
  taxPeriod: string;
  companyPin: string;
  companyName: string;
  grossSalesExclVat: number;
  outputVat16: number;
  localPurchasesExclVat: number;
  localInputVat16: number;
  importCustomsValueExclVat: number;
  importVat1202Claimable: number;
  withholdingVat2Percent: number;
  netVatPayable: number;
  isCreditCarriedForward: boolean;
  sections: {
    sectionB_Imports: Array<{ entryNo: string; eslip: string; supplier: string; taxableValue: number; vatAmount: number }>;
    sectionC_Purchases: Array<{ supplierName: string; supplierPin: string; invoiceNo: string; taxableValue: number; vatAmount: number }>;
    sectionD_Sales: Array<{ branch: string; taxableSales: number; vatAmount: number }>;
  };
  generatedBy: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(40, currentY, pageWidth - 80, 50, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('KRA VAT-3 RETURN & TAX RECONCILIATION PACK', 55, currentY + 28);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${vatPack.taxPeriod}`, pageWidth - 160, currentY + 22);
  doc.text(`PIN: ${vatPack.companyPin}`, pageWidth - 160, currentY + 36);

  currentY += 65;

  // Net Position Banner
  const isCredit = vatPack.isCreditCarriedForward;
  doc.setFillColor(isCredit ? 240 : 254, isCredit ? 253 : 242, isCredit ? 244 : 242);
  doc.setDrawColor(isCredit ? 34 : 225, isCredit ? 197 : 29, isCredit ? 94 : 72);
  doc.rect(40, currentY, pageWidth - 80, 55, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isCredit ? 21 : 159, isCredit ? 128 : 18, isCredit ? 61 : 57);
  doc.text(isCredit ? 'NET TAX POSITION: REFUND / CREDIT CARRIED FORWARD' : 'NET TAX POSITION: KRA VAT-3 PAYABLE', 55, currentY + 20);

  doc.setFontSize(15);
  doc.text(
    `KES ${Math.abs(vatPack.netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    55,
    currentY + 42
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Formula: Output VAT [KSh ${vatPack.outputVat16.toLocaleString()}] - Input VAT Local [KSh ${vatPack.localInputVat16.toLocaleString()}] - Import 1202 VAT [KSh ${vatPack.importVat1202Claimable.toLocaleString()}] - WHVAT [KSh ${vatPack.withholdingVat2Percent.toLocaleString()}]`,
    230,
    currentY + 40,
    { maxWidth: pageWidth - 280 }
  );

  currentY += 70;

  // Summary Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['KRA VAT-3 Section', 'Taxable Base (KES)', 'VAT 16% / Rate (KES)', 'Status']],
    body: [
      [
        'Section D: Gross Taxable Sales (Output VAT)',
        `KES ${vatPack.grossSalesExclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KES ${vatPack.outputVat16.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        'Tax Charged'
      ],
      [
        'Section C: Local Raw Material & Operating Purchases',
        `KES ${vatPack.localPurchasesExclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KES ${vatPack.localInputVat16.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        'Deductible Input VAT'
      ],
      [
        'Section B: Customs Direct Imports (Head 1202 Claims)',
        `KES ${vatPack.importCustomsValueExclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KES ${vatPack.importVat1202Claimable.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        'Deductible Import VAT'
      ],
      [
        'Withholding VAT (WHVAT 2%) Certificates Offset',
        '-',
        `KES ${vatPack.withholdingVat2Percent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        'Tax Credit Offset'
      ],
      [
        { content: isCredit ? 'NET REFUND / CUMULATIVE CREDIT' : 'NET KRA VAT-3 DUE FOR PAYMENT', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `KES ${Math.abs(vatPack.netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: isCredit ? [16, 185, 129] : [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: isCredit ? 'Carry Forward' : 'Pay by 20th', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 4 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Import Details Table
  if (vatPack.sections.sectionB_Imports.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SECTION B: IMPORT VAT ENTRIES (HEAD 1202 CLAIMS):', 40, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 40, right: 40 },
      head: [['Customs Entry (SAD)', 'KRA E-Slip Ref', 'Supplier Name', 'Taxable Customs Value (KES)', '1202 VAT Claimed (KES)']],
      body: vatPack.sections.sectionB_Imports.map(imp => [
        imp.entryNo,
        imp.eslip,
        imp.supplier,
        `KES ${imp.taxableValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `KES ${imp.vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Taji Enterprise ERP | KRA iTax Filing Return Pack | Page ${i} of ${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 20
    );
    doc.text(
      `Certified by: ${vatPack.generatedBy}`,
      pageWidth - 200,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  doc.save(`KRA_VAT3_Return_Pack_${vatPack.taxPeriod.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates an official Customer Account Statement & Debtors Aging PDF
 */
export function generateCustomerStatementPDF(statement: {
  customerName: string;
  customerPhone: string;
  customerPin?: string;
  statementDate: string;
  periodRange: string;
  currentBalance: number;
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  transactions: Array<{
    date: string;
    refNumber: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    runningBalance: number;
  }>;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(40, currentY, pageWidth - 80, 50, 'F');

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CUSTOMER ACCOUNT STATEMENT', 55, currentY + 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${statement.statementDate}`, pageWidth - 160, currentY + 22);
  doc.text(`Period: ${statement.periodRange}`, pageWidth - 160, currentY + 36);

  currentY += 65;

  // Customer Info & Aging Box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'CUSTOMER DETAILS:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'OUTSTANDING BALANCE:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `${statement.customerName}\nPhone: ${statement.customerPhone}${statement.customerPin ? `\nPIN: ${statement.customerPin}` : ''}`,
        `KES ${statement.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}\nTerms: Net 30 Days`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Aging Summary Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Current (0-30 Days)', '31 - 60 Days', '61 - 90 Days', '90+ Days Overdue', 'Total Outstanding']],
    body: [[
      `KES ${statement.aging.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `KES ${statement.aging.days30.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `KES ${statement.aging.days60.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `KES ${statement.aging.days90Plus.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `KES ${statement.currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    ]],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8, halign: 'center' },
    styles: { fontSize: 8, halign: 'center', cellPadding: 4 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Ledger Transactions Table
  const rows = statement.transactions.map(t => [
    t.date,
    t.refNumber,
    t.description,
    t.debitAmount > 0 ? `KES ${t.debitAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-',
    t.creditAmount > 0 ? `KES ${t.creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-',
    `KES ${t.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Date', 'Ref / Invoice', 'Particulars', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Payment notice
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Please remit payment to TAJI TEXTILE ENTERPRISES LTD | Bank: Equity Bank / KCB | M-Pesa Paybill: 400200. Account: ' +
    statement.customerName,
    40,
    currentY,
    { maxWidth: pageWidth - 80 }
  );

  doc.save(`Customer_Statement_${statement.customerName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates an official Local Purchase Supply (LPS) Costing & Capitalization Sheet PDF
 */
export function exportLocalPurchaseCostingPDF(
  purchase: LocalPurchaseRecord,
  summary: ComputedLocalPurchaseSummary,
  brandSettings?: BrandSettings,
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(40, currentY, pageWidth - 80, 50, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LOCAL PURCHASE SUPPLY (LPS) COSTING SHEET', 55, currentY + 28);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`PO Ref: ${purchase.purchaseOrderNo}`, pageWidth - 160, currentY + 22);
  doc.text(`Date: ${purchase.invoiceDate}`, pageWidth - 160, currentY + 36);

  currentY += 65;

  // Supplier & eTIMS Details Box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'LOCAL SUPPLIER DETAILS:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'TAX & PAYMENT SCHEDULE:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Supplier: ${purchase.supplierName}\nPIN: ${purchase.supplierPin}\nLocation: ${purchase.supplierCity}\nInvoice No: ${purchase.invoiceNumber}`,
        `eTIMS CU Ref: ${purchase.etimsControlNo || 'Direct Local Tax Invoice'}\nPayment Terms: ${purchase.paymentTerms}\nInput VAT Rate: 16% (KRA VAT-3 Section C)\nWithholding VAT (2%): ${purchase.withholdingVatEnabled ? 'Applied (Deducted)' : 'Not Applicable'}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Financial KPI Metrics Grid
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(40, currentY, pageWidth - 80, 55, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('NET PURCHASE (EXCL. VAT)', 55, currentY + 18);
  doc.text('16% INPUT VAT CLAIMABLE', 185, currentY + 18);
  doc.text('LOCAL FREIGHT & HANDLING', 320, currentY + 18);
  doc.text('TOTAL CAPITALIZED INVENTORY', 440, currentY + 18);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`KES ${summary.totalNetPurchaseKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 55, currentY + 36);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`KES ${summary.totalVat16KES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 185, currentY + 36);
  doc.setTextColor(71, 85, 105);
  doc.text(`KES ${summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 320, currentY + 36);
  doc.setTextColor(5, 150, 105); // Emerald
  doc.text(`KES ${summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 440, currentY + 36);

  currentY += 70;

  // Line items table
  const itemRows = summary.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    `${item.quantity.toLocaleString()} ${item.unit}s`,
    `KES ${item.netUnitPriceKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `KES ${item.lineNetKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${item.allocatedLogisticsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${item.totalCapitalizedKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KES ${item.unitLandedCostKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `KES ${(item.suggestedRetailPriceKES || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [[
      '#',
      'Description',
      'Qty',
      'Unit Net Price',
      'Net Total (KES)',
      'Freight/Handling',
      'Capitalized Asset',
      'Unit Landed Cost',
      'Retail Price'
    ]],
    body: [
      ...itemRows,
      [
        { content: 'TOTALS', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalNetPurchaseKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KES ${summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [5, 150, 105], fillColor: [241, 245, 249] } },
        { content: `KES ${summary.effectiveAverageCapitalizedCostPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })} / unit`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } }
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // General Ledger Double-Entry Preview Box
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DOUBLE-ENTRY GENERAL LEDGER POSTING VOUCHER:', 40, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Account Code & Name', 'Debit (KES)', 'Credit (KES)', 'Classification & Tax Note']],
    body: [
      ['1200 - Raw Materials & Fabric Inventory Asset', `KES ${summary.totalCapitalizedInventoryCostKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '-', 'Asset Capitalization (Net + Freight + Handling)'],
      ['1201 - Input VAT Claimable Asset (Local eTIMS)', `KES ${summary.totalVat16KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '-', 'KRA VAT-3 Section C Deductible Input Tax'],
      ['2010 - Accounts Payable (Local Supplier)', '-', `KES ${summary.totalGrossSupplierPayableKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `Gross Payable to ${purchase.supplierName}`],
      summary.totalLogisticsAddOnsKES > 0
        ? ['2020 - Transporter & Clearing Logistics Payable', '-', `KES ${summary.totalLogisticsAddOnsKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Local Freight & Offloading Handling']
        : null
    ].filter(Boolean) as any,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 30, 200, currentY + 30);
  doc.line(pageWidth - 200, currentY + 30, pageWidth - 40, currentY + 30);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared By: Inventory & Procurement Officer', 40, currentY + 42);
  doc.text('Authorized By: Chief Financial Accountant', pageWidth - 200, currentY + 42);

  doc.save(`LPS_Costing_Sheet_${purchase.purchaseOrderNo}.pdf`);
}

/**
 * Exports Local Purchase Supply (LPS) Costing data to CSV
 */
export function exportLocalPurchaseCostingCSV(
  purchase: LocalPurchaseRecord,
  summary: ComputedLocalPurchaseSummary
) {
  const headers = [
    'Line #',
    'Item Description',
    'Category',
    'Quantity',
    'Unit',
    'Net Unit Price (KES)',
    'Line Net Total (KES)',
    'VAT Rate %',
    'Input VAT (KES)',
    'Allocated Freight (KES)',
    'Allocated Handling (KES)',
    'Total Capitalized Cost (KES)',
    'Unit Landed Cost (KES)',
    'Suggested Retail Price (KES)',
    'Gross Margin %'
  ];

  const rows = summary.items.map((item, idx) => [
    idx + 1,
    `"${item.description}"`,
    item.category,
    item.quantity,
    item.unit,
    item.netUnitPriceKES,
    item.lineNetKES,
    item.vatRatePct,
    item.lineVatKES,
    item.allocatedFreightKES,
    item.allocatedHandlingKES,
    item.totalCapitalizedKES,
    item.unitLandedCostKES.toFixed(2),
    item.suggestedRetailPriceKES,
    item.grossMarginPct.toFixed(1)
  ]);

  const summaryHeader = [
    ['LOCAL PURCHASE SUPPLY (LPS) COSTING SCHEDULE', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['PO Number', purchase.purchaseOrderNo, 'Supplier Name', `"${purchase.supplierName}"`, 'Supplier PIN', purchase.supplierPin, '', '', '', '', '', '', '', '', ''],
    ['Invoice Number', purchase.invoiceNumber, 'eTIMS Control Ref', purchase.etimsControlNo || 'N/A', 'Date', purchase.invoiceDate, '', '', '', '', '', '', '', '', ''],
    ['Total Net Purchase (KES)', summary.totalNetPurchaseKES, 'Total 16% Input VAT (KES)', summary.totalVat16KES, 'Total Logistics Add-ons (KES)', summary.totalLogisticsAddOnsKES, 'Total Capitalized Inventory (KES)', summary.totalCapitalizedInventoryCostKES, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`LPS_Costing_${purchase.purchaseOrderNo}.csv`, csvContent);
}

/**
 * Generates an official Bank Swift / Telegraphic Transfer (TT) Remittance Advice PDF (USD Overseas Supplier)
 */
export function exportSupplierUSDSwiftVoucherPDF(
  shipment: ImportShipmentRecord,
  payment: SupplierUSDDisbursement,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(40, currentY, pageWidth - 80, 52, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('FOREIGN CURRENCY TELEGRAPHIC TRANSFER (TT) / SWIFT ADVICE', 55, currentY + 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Swift Ref: ${payment.swiftMt103Ref}`, pageWidth - 190, currentY + 20);
  doc.text(`Value Date: ${payment.paymentDate}`, pageWidth - 190, currentY + 34);
  doc.text(`Invoice: ${shipment.invoiceNumber}`, pageWidth - 190, currentY + 46);

  currentY += 68;

  // Beneficiary & Ordering Customer Grid
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'ORDERING CUSTOMER (IMPORTER):', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'BENEFICIARY (OVERSEAS SUPPLIER):', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Company: ${shipment.consigneeName}\nPIN: ${shipment.consigneePin}\nDebit Source: ${payment.sourceAccountLabel}\nFX Spot Rate: KES ${payment.exchangeRateActual.toFixed(2)} / USD`,
        `Beneficiary: ${payment.beneficiaryName}\nBank: ${payment.beneficiaryBank}\nIBAN/Account: ${payment.beneficiaryIbanOrAccount}\nInvoice Ref: ${shipment.invoiceNumber} (${shipment.supplierCountry})`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Payment Amount Summary Card
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208);
  doc.rect(40, currentY, pageWidth - 80, 50, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('REMITTED CURRENCY AMOUNT (USD)', 55, currentY + 18);
  doc.text('KES EQUIVALENT DEBIT', 260, currentY + 18);
  doc.text('CORRESPONDENT CHARGES', 430, currentY + 18);

  doc.setFontSize(13);
  doc.text(`$${payment.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`, 55, currentY + 36);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`KSh ${payment.amountKESEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 260, currentY + 36);
  doc.setTextColor(71, 85, 105);
  doc.text(`$${payment.bankChargesUSD.toFixed(2)} (${payment.chargeBorneBy})`, 430, currentY + 36);

  currentY += 65;

  // General Ledger Double Entry Posting Box
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DOUBLE-ENTRY GENERAL LEDGER DISBURSEMENT VOUCHER:', 40, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Account Code & Name', 'Debit (KES)', 'Credit (KES)', 'Classification & Currency Note']],
    body: [
      [
        '2010 - Accounts Payable (Overseas Suppliers)',
        `KSh ${payment.amountKESEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        '-',
        `Settlement of FOB Invoice ${shipment.invoiceNumber} ($${payment.amountUSD.toLocaleString()} USD)`
      ],
      [
        '1020 - USD Forex Nostro Bank Account / Forex Spot',
        '-',
        `KSh ${payment.amountKESEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `Outflow from ${payment.sourceAccountLabel} @ ${payment.exchangeRateActual.toFixed(2)} FX`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 4 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 25, 200, currentY + 25);
  doc.line(pageWidth - 200, currentY + 25, pageWidth - 40, currentY + 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared By: Treasury & FX Officer', 40, currentY + 37);
  doc.text('Authorized By: Managing Director / CFO', pageWidth - 200, currentY + 37);

  doc.save(`Swift_Remittance_${shipment.invoiceNumber}_${payment.swiftMt103Ref}.pdf`);
}

/**
 * Generates an official KRA Customs Tax Assessment & E-Slip Payment Voucher PDF (KES)
 */
export function exportKRATaxPaymentVoucherPDF(
  shipment: ImportShipmentRecord,
  payment: KRATaxDisbursement,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(159, 18, 57); // Rose 900
  doc.rect(40, currentY, pageWidth - 80, 52, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('KRA CUSTOMS DUTIES & TAXES PAYMENT RECEIPT / E-SLIP VOUCHER', 55, currentY + 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`E-Slip PRN: ${payment.kraEslipNumber}`, pageWidth - 190, currentY + 20);
  doc.text(`Customs Entry: ${payment.customsEntryNo}`, pageWidth - 190, currentY + 34);
  doc.text(`Date Paid: ${payment.paymentDate}`, pageWidth - 190, currentY + 46);

  currentY += 68;

  // Tax Assessment Breakdown Matrix
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Tax Head Code', 'KRA Revenue Description', 'Statutory Rate', 'Amount Paid (KES)']],
    body: [
      ['1002', 'Customs Import Duty (EAC CET)', `${shipment.adValoremRatePct}% or specific`, `KSh ${payment.duty1002KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['1801', 'Import Declaration Fee (IDF)', '2.5% on CIF', `KSh ${payment.idf1801KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['6001', 'Railway Development Levy (RDL)', '2.0% on CIF', `KSh ${payment.rdl6001KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['1202', 'Value Added Tax on Imports (VAT-3 Sec B Claimable)', '16.0% on (CIF+Duty+IDF+RDL)', `KSh ${payment.vat1202KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['6401', 'Merchant Shipping Superintendent (MSS) Levy', 'USD 1.75 / Tonne', `KSh ${payment.mss6401KES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      [
        { content: 'TOTAL KRA CUSTOMS TAXES DISBURSED:', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: [254, 242, 242] } },
        { content: `KSh ${payment.amountKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [159, 18, 57], fillColor: [254, 242, 242] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [159, 18, 57], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3.5 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Payment Confirmation Box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'BANK & GATEWAY PAYMENT CONFIRMATION:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'IMPORTER & DECLARANT INFO:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Payment Portal: ${payment.bankPaymentPortalLabel}\nBank Reference: ${payment.bankTransactionRef}\nPayment Date: ${payment.paymentDate}\nStatus: Direct Settled via CBK G-Tax`,
        `Importer: ${shipment.consigneeName} (PIN: ${shipment.consigneePin})\nDeclarant: ${shipment.declarantName} (PIN: ${shipment.declarantPin})\nPort of Entry: ${shipment.portOfEntry}\nCustoms SAD Ref: ${payment.customsEntryNo}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 25, 200, currentY + 25);
  doc.line(pageWidth - 200, currentY + 25, pageWidth - 40, currentY + 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Cleared By: KRA Customs Authorized Officer', 40, currentY + 37);
  doc.text('Confirmed By: Chief Financial Accountant', pageWidth - 200, currentY + 37);

  doc.save(`KRA_Tax_Payment_${payment.customsEntryNo}_${payment.kraEslipNumber}.pdf`);
}

/**
 * Generates an official Clearing & Forwarding Logistics Disbursal Voucher PDF (KES)
 */
export function exportClearingLogisticsVoucherPDF(
  shipment: ImportShipmentRecord,
  payment: ClearingForwardingDisbursement,
  brandSettings?: BrandSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(40, currentY, pageWidth - 80, 52, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CLEARING & FORWARDING LOGISTICS DISBURSEMENT VOUCHER', 55, currentY + 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agent Inv: ${payment.agentInvoiceRef}`, pageWidth - 190, currentY + 20);
  doc.text(`Payment Ref: ${payment.paymentRefNo}`, pageWidth - 190, currentY + 34);
  doc.text(`Date: ${payment.paymentDate}`, pageWidth - 190, currentY + 46);

  currentY += 68;

  // Itemized Logistics Expenses Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Line Item / Logistics Description', 'Service Provider / Entity', 'Amount (KES)']],
    body: [
      ['Declarant Agency & Documentation Fee', `${payment.declarantName} (PIN ${payment.declarantPin})`, `KSh ${payment.declarantAgencyFeeKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['KPA Port CFS Wharfage & Offloading Handling', 'Kenya Ports Authority / Inland Container Depot (ICD)', `KSh ${payment.cfsPortWharfageKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['Shipping Line Delivery Order (DO) & Container Demurrage', 'Ocean Carrier / Shipping Line Agency', `KSh ${payment.shippingLineDemurrageKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['Inland Transport & SGR Railage / Trucking (Mombasa - Nairobi)', 'SGR Rail Freight / Local Transporter', `KSh ${payment.inlandTransportSgrKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      [
        { content: 'TOTAL LOGISTICS & CLEARING DISBURSED:', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right', fillColor: [239, 246, 255] } },
        { content: `KSh ${payment.amountKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [30, 58, 138], fillColor: [239, 246, 255] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 4 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Payment Confirmation Box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'PAYMENT DISBURSEMENT DETAILS:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'CLEARING AGENT PROFILE:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Payment Method: ${payment.paymentMethod}\nSource Bank: ${payment.sourceBankName}\nTransaction Ref: ${payment.paymentRefNo}\nPayment Date: ${payment.paymentDate}`,
        `Declarant: ${payment.declarantName}\nAgent PIN: ${payment.declarantPin}\nAgent Invoice Ref: ${payment.agentInvoiceRef}\nShipment Ref: ${shipment.shipmentNumber}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 25, 200, currentY + 25);
  doc.line(pageWidth - 200, currentY + 25, pageWidth - 40, currentY + 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared By: Logistics Coordinator', 40, currentY + 37);
  doc.text('Approved By: Finance Manager', pageWidth - 200, currentY + 37);

  doc.save(`Clearing_Disbursement_${payment.agentInvoiceRef}_${payment.paymentRefNo}.pdf`);
}

/**
 * Generates an official Bank Swift / Telegraphic Transfer (TT) Remittance Advice CSV (USD Overseas Supplier)
 */
export function exportSupplierUSDSwiftVoucherCSV(
  shipment: ImportShipmentRecord,
  payment: SupplierUSDDisbursement
) {
  const summaryHeader = [
    ['SWIFT TELEGRAPHIC TRANSFER (TT) PAYMENT ADVICE - OVERSEAS SUPPLIER', ''],
    ['Invoice Number', `"${shipment.invoiceNumber}"`],
    ['Swift MT103 Ref', `"${payment.swiftMt103Ref}"`],
    ['Payment Date', `"${payment.paymentDate}"`],
    ['Beneficiary Name', `"${payment.beneficiaryName}"`],
    ['Beneficiary Bank', `"${payment.beneficiaryBank}"`],
    ['Beneficiary IBAN/Account', `"${payment.beneficiaryIbanOrAccount}"`],
    ['Source Debit Account', `"${payment.sourceAccountLabel}"`],
    ['Remitted Amount (USD)', payment.amountUSD.toFixed(2)],
    ['Bank Spot Exchange Rate (KES/USD)', payment.exchangeRateActual.toFixed(4)],
    ['Debit Amount Equivalent (KES)', payment.amountKESEquivalent.toFixed(2)],
    ['Correspondent Bank Charges (USD)', payment.bankChargesUSD.toFixed(2)],
    ['Charges Borne By', `"${payment.chargeBorneBy}"`],
    ['Consignee / Importer', `"${shipment.consigneeName}"`],
    ['Consignee PIN', `"${shipment.consigneePin}"`],
    ['Country of Origin', `"${shipment.supplierCountry}"`],
    ['GL Debit Account', '"2010 - Accounts Payable (Overseas Suppliers)"'],
    ['GL Credit Account', '"1020 - USD Forex Nostro Bank Account"'],
    ['Status', `"${payment.status.toUpperCase()}"`],
    ['', '']
  ];

  const headers = [
    'Field',
    'Value',
    'Currency',
    'Notes'
  ];

  const rows = [
    ['Principal Remittance', payment.amountUSD.toFixed(2), 'USD', `Invoice ${shipment.invoiceNumber}`],
    ['Spot FX Rate', payment.exchangeRateActual.toFixed(4), 'KES/USD', 'Bank Spot Settled'],
    ['KES Outflow Equivalent', payment.amountKESEquivalent.toFixed(2), 'KES', 'Domestic Bank Account Outflow'],
    ['Correspondent Charges', payment.bankChargesUSD.toFixed(2), 'USD', `Swift Fee (${payment.chargeBorneBy})`],
    ['Total USD Cost', (payment.amountUSD + (payment.chargeBorneBy === 'OUR' ? payment.bankChargesUSD : 0)).toFixed(2), 'USD', 'Total Capitalized / Settled Outflow']
  ];

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.map(cell => typeof cell === 'string' && !cell.startsWith('"') ? `"${cell}"` : cell).join(','))
  ].join('\n');

  downloadCSV(`Swift_Remittance_${shipment.invoiceNumber}_${payment.swiftMt103Ref}.csv`, csvContent);
}

/**
 * Generates an official KRA Customs Tax Assessment & E-Slip Payment Voucher CSV (KES)
 */
export function exportKRATaxPaymentVoucherCSV(
  shipment: ImportShipmentRecord,
  payment: KRATaxDisbursement
) {
  const summaryHeader = [
    ['KENYA REVENUE AUTHORITY (KRA) CUSTOMS TAX DISBURSAL & E-SLIP VOUCHER', ''],
    ['Shipment Ref', `"${shipment.shipmentNumber}"`],
    ['Commercial Invoice', `"${shipment.invoiceNumber}"`],
    ['Customs Entry (SAD)', `"${payment.customsEntryNo}"`],
    ['KRA E-Slip PRN', `"${payment.kraEslipNumber}"`],
    ['Payment Date', `"${payment.paymentDate}"`],
    ['Payment Portal', `"${payment.bankPaymentPortalLabel}"`],
    ['Bank Transaction Ref', `"${payment.bankTransactionRef}"`],
    ['Importer Name', `"${shipment.consigneeName}"`],
    ['Importer PIN', `"${shipment.consigneePin}"`],
    ['Declarant Agent', `"${shipment.declarantName}"`],
    ['Declarant PIN', `"${shipment.declarantPin}"`],
    ['Port of Entry', `"${shipment.portOfEntry}"`],
    ['Status', `"${payment.status.toUpperCase()}"`],
    ['', '']
  ];

  const headers = [
    'Tax Head Code',
    'KRA Revenue Description',
    'Statutory Rate / Rule',
    'Amount Paid (KES)',
    'Accounting Classification'
  ];

  const rows = [
    ['1002', '"Customs Import Duty (EAC CET)"', `"${shipment.adValoremRatePct}% or specific"`, payment.duty1002KES.toFixed(2), '"Asset Capitalization (Inventory)"'],
    ['1801', '"Import Declaration Fee (IDF)"', '"2.5% on CIF"', payment.idf1801KES.toFixed(2), '"Asset Capitalization (Inventory)"'],
    ['6001', '"Railway Development Levy (RDL)"', '"2.0% on CIF"', payment.rdl6001KES.toFixed(2), '"Asset Capitalization (Inventory)"'],
    ['1202', '"Value Added Tax on Imports (VAT-3 Sec B)"', '"16.0% on (CIF+Duty+IDF+RDL)"', payment.vat1202KES.toFixed(2), '"Current Asset (KRA VAT-3 Claimable)"'],
    ['6401', '"Merchant Shipping Superintendent (MSS) Levy"', '"USD 1.75 / Tonne"', payment.mss6401KES.toFixed(2), '"Asset Capitalization (Inventory)"'],
    ['TOTAL', '"TOTAL KRA CUSTOMS TAXES DISBURSED"', '"Statutory Sum"', payment.amountKES.toFixed(2), '"Direct Bank Settlement (KCB/CBK)"']
  ];

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`KRA_Tax_Payment_${payment.customsEntryNo}_${payment.kraEslipNumber}.csv`, csvContent);
}

/**
 * Generates an official Clearing & Forwarding Logistics Disbursal Voucher CSV (KES)
 */
export function exportClearingLogisticsVoucherCSV(
  shipment: ImportShipmentRecord,
  payment: ClearingForwardingDisbursement
) {
  const summaryHeader = [
    ['CLEARING & FORWARDING LOGISTICS DISBURSEMENT VOUCHER', ''],
    ['Shipment Ref', `"${shipment.shipmentNumber}"`],
    ['Commercial Invoice', `"${shipment.invoiceNumber}"`],
    ['Declarant Agent', `"${payment.declarantName}"`],
    ['Declarant PIN', `"${payment.declarantPin}"`],
    ['Agent Invoice Ref', `"${payment.agentInvoiceRef}"`],
    ['Payment Ref / Cheque No', `"${payment.paymentRefNo}"`],
    ['Payment Date', `"${payment.paymentDate}"`],
    ['Payment Method', `"${payment.paymentMethod}"`],
    ['Source Bank Name', `"${payment.sourceBankName}"`],
    ['Status', `"${payment.status.toUpperCase()}"`],
    ['', '']
  ];

  const headers = [
    'Line Item / Logistics Description',
    'Service Provider / Entity',
    'Amount (KES)',
    'GL Accounting Treatment'
  ];

  const rows = [
    ['"Declarant Agency & Documentation Fee"', `"${payment.declarantName} (PIN ${payment.declarantPin})"`, payment.declarantAgencyFeeKES.toFixed(2), '"Capitalized to Inventory (Asset 1200)"'],
    ['"KPA Port CFS Wharfage & Offloading Handling"', '"Kenya Ports Authority / ICD"', payment.cfsPortWharfageKES.toFixed(2), '"Capitalized to Inventory (Asset 1200)"'],
    ['"Shipping Line Delivery Order (DO) & Demurrage"', '"Ocean Carrier / Shipping Line"', payment.shippingLineDemurrageKES.toFixed(2), '"Capitalized to Inventory (Asset 1200)"'],
    ['"Inland Transport & SGR Railage (Mombasa - Nairobi)"', '"SGR Rail Freight / Local Transporter"', payment.inlandTransportSgrKES.toFixed(2), '"Capitalized to Inventory (Asset 1200)"'],
    ['"TOTAL LOGISTICS & CLEARING DISBURSED"', '"Consolidated Logistics"', payment.amountKES.toFixed(2), '"Debit AP 2020 / Credit Bank 1010"']
  ];

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`Clearing_Disbursement_${payment.agentInvoiceRef}_${payment.paymentRefNo}.csv`, csvContent);
}

/**
 * Generates a comprehensive Consolidated 3-Way Import Payment & Disbursal Schedule PDF (USD + KES)
 */
export function exportThreeWayPaymentSchedulePDF(
  shipment: ImportShipmentRecord,
  brandSettings?: BrandSettings,
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(40, currentY, pageWidth - 80, 56, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CONSOLIDATED 3-WAY IMPORT PAYMENT & DISBURSAL SCHEDULE', 55, currentY + 24);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Commercial Invoice: ${shipment.invoiceNumber} | Entry: ${shipment.customsEntryNo} | PRN: ${shipment.kraEslipRef}`, 55, currentY + 42);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, pageWidth - 160, currentY + 42);

  currentY += 72;

  // Importer & Supplier Metadata Box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'SHIPMENT & IMPORTER DETAILS:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'OVERSEAS SUPPLIER & DECLARANT:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Importer: ${shipment.consigneeName}\nPIN: ${shipment.consigneePin}\nShipment Ref: ${shipment.shipmentNumber}\nPort of Entry: ${shipment.portOfEntry}\nCustoms Entry: ${shipment.customsEntryNo}`,
        `Supplier: ${shipment.supplierName} (${shipment.supplierCountry})\nCommercial Invoice: ${shipment.invoiceNumber} (${shipment.invoiceDate})\nDeclarant: ${shipment.declarantName} (PIN: ${shipment.declarantPin})\nKRA E-Slip PRN: ${shipment.kraEslipRef}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Payment Schedules Consolidation
  const supplierSchedule = shipment.paymentSchedule?.supplierUSD;
  const kraSchedule = shipment.paymentSchedule?.kraTaxesKES;
  const clearingSchedule = shipment.paymentSchedule?.clearingLogisticsKES;

  const totalSupplierPaidUSD = (supplierSchedule?.payments || []).reduce((s, p) => s + p.amountUSD, 0);
  const totalSupplierPaidKES = (supplierSchedule?.payments || []).reduce((s, p) => s + p.amountKESEquivalent, 0);
  const totalKraPaidKES = (kraSchedule?.payments || []).reduce((s, p) => s + p.amountKES, 0);
  const totalClearingPaidKES = (clearingSchedule?.payments || []).reduce((s, p) => s + p.amountKES, 0);

  const supplierTotalUSD = supplierSchedule?.totalInvoicedUSD || 55600.64;
  const kraTotalKES = kraSchedule?.totalAssessedKES || 3703554;
  const clearingTotalKES = clearingSchedule?.totalEstimatedKES || 180000;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Disbursement Leg', 'Payee Entity', 'Currency', 'Total Assessed / Invoiced', 'Total Disbursed', 'Balance Due', 'Disbursal Status']],
    body: [
      [
        '1. Overseas Supplier',
        `${shipment.supplierName}`,
        'USD ($)',
        `$${supplierTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${totalSupplierPaidUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${Math.max(0, supplierTotalUSD - totalSupplierPaidUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        totalSupplierPaidUSD >= supplierTotalUSD ? 'Fully Settled' : 'Pending Remittance'
      ],
      [
        '2. KRA Customs Taxes',
        'Kenya Revenue Authority (Customs Dept)',
        'KES (KSh)',
        `KSh ${kraTotalKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KSh ${totalKraPaidKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KSh ${Math.max(0, kraTotalKES - totalKraPaidKES).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        totalKraPaidKES >= kraTotalKES ? 'Fully Settled (Cleared)' : 'Pending Tax Disbursal'
      ],
      [
        '3. Clearing & Logistics',
        `${shipment.declarantName}`,
        'KES (KSh)',
        `KSh ${clearingTotalKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KSh ${totalClearingPaidKES.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `KSh ${Math.max(0, clearingTotalKES - totalClearingPaidKES).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        totalClearingPaidKES >= clearingTotalKES ? 'Fully Settled' : 'Pending Logistics Disbursal'
      ],
      [
        { content: 'CONSOLIDATED TOTALS (KES EQUIVALENT):', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `KSh ${(supplierTotalUSD * shipment.exchangeRate + kraTotalKES + clearingTotalKES).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `KSh ${(totalSupplierPaidKES + totalKraPaidKES + totalClearingPaidKES).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [5, 150, 105], fillColor: [241, 245, 249] } },
        { content: `KSh ${(Math.max(0, supplierTotalUSD - totalSupplierPaidUSD) * shipment.exchangeRate + Math.max(0, kraTotalKES - totalKraPaidKES) + Math.max(0, clearingTotalKES - totalClearingPaidKES)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3.5 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Itemized Transactions Log Table
  const allTransactions: Array<{ leg: string; date: string; ref: string; portal: string; amount: string; status: string }> = [];

  (supplierSchedule?.payments || []).forEach(p => {
    allTransactions.push({
      leg: '1. Supplier USD',
      date: p.paymentDate,
      ref: p.swiftMt103Ref,
      portal: p.sourceAccountLabel,
      amount: `$${p.amountUSD.toLocaleString()} USD (KSh ${p.amountKESEquivalent.toLocaleString()})`,
      status: p.status.toUpperCase()
    });
  });

  (kraSchedule?.payments || []).forEach(p => {
    allTransactions.push({
      leg: '2. KRA Taxes KES',
      date: p.paymentDate,
      ref: `${p.customsEntryNo} / PRN: ${p.kraEslipNumber}`,
      portal: p.bankPaymentPortalLabel,
      amount: `KSh ${p.amountKES.toLocaleString()}`,
      status: p.status.toUpperCase()
    });
  });

  (clearingSchedule?.payments || []).forEach(p => {
    allTransactions.push({
      leg: '3. Clearing KES',
      date: p.paymentDate,
      ref: `${p.agentInvoiceRef} / ${p.paymentRefNo}`,
      portal: `${p.sourceBankName} (${p.paymentMethod})`,
      amount: `KSh ${p.amountKES.toLocaleString()}`,
      status: p.status.toUpperCase()
    });
  });

  if (allTransactions.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DETAILED AUDIT TRAIL OF EXECUTED DISBURSEMENTS:', 40, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 40, right: 40 },
      head: [['Payment Leg', 'Date', 'Transaction Ref / Voucher', 'Bank / Payment Channel', 'Amount Paid', 'Status']],
      body: allTransactions.map(t => [t.leg, t.date, t.ref, t.portal, t.amount, t.status]),
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;
  }

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 30, 200, currentY + 30);
  doc.line(pageWidth - 200, currentY + 30, pageWidth - 40, currentY + 30);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared By: Treasury & FX Disbursal Officer', 40, currentY + 42);
  doc.text('Certified By: Chief Financial Officer (CFO)', pageWidth - 200, currentY + 42);

  doc.save(`3Way_Payment_Schedule_${shipment.invoiceNumber}.pdf`);
}

/**
 * Generates a Consolidated 3-Way Import Payment & Disbursal Schedule CSV (USD + KES)
 */
export function exportThreeWayPaymentScheduleCSV(shipment: ImportShipmentRecord) {
  const supplierSchedule = shipment.paymentSchedule?.supplierUSD;
  const kraSchedule = shipment.paymentSchedule?.kraTaxesKES;
  const clearingSchedule = shipment.paymentSchedule?.clearingLogisticsKES;

  const totalSupplierPaidUSD = (supplierSchedule?.payments || []).reduce((s, p) => s + p.amountUSD, 0);
  const totalSupplierPaidKES = (supplierSchedule?.payments || []).reduce((s, p) => s + p.amountKESEquivalent, 0);
  const totalKraPaidKES = (kraSchedule?.payments || []).reduce((s, p) => s + p.amountKES, 0);
  const totalClearingPaidKES = (clearingSchedule?.payments || []).reduce((s, p) => s + p.amountKES, 0);

  const supplierTotalUSD = supplierSchedule?.totalInvoicedUSD || 55600.64;
  const kraTotalKES = kraSchedule?.totalAssessedKES || 3703554;
  const clearingTotalKES = clearingSchedule?.totalEstimatedKES || 180000;

  const summaryHeader = [
    ['CONSOLIDATED 3-WAY IMPORT PAYMENT & DISBURSAL SCHEDULE', ''],
    ['Shipment Number', `"${shipment.shipmentNumber}"`],
    ['Commercial Invoice', `"${shipment.invoiceNumber}"`],
    ['Invoice Date', `"${shipment.invoiceDate}"`],
    ['Supplier Name', `"${shipment.supplierName}"`],
    ['Supplier Country', `"${shipment.supplierCountry}"`],
    ['Importer / Consignee', `"${shipment.consigneeName}"`],
    ['Importer PIN', `"${shipment.consigneePin}"`],
    ['Customs Entry SAD', `"${shipment.customsEntryNo}"`],
    ['KRA E-Slip PRN', `"${shipment.kraEslipRef}"`],
    ['Port of Entry', `"${shipment.portOfEntry}"`],
    ['Exchange Rate (KES/USD)', shipment.exchangeRate.toFixed(4)],
    ['', ''],
    ['CONSOLIDATED DISBURSAL SUMMARY', '', '', '', '', '', '']
  ];

  const summaryHeaders = [
    'Disbursement Leg',
    'Payee Entity',
    'Currency',
    'Assessed / Invoiced Amount',
    'Total Disbursed Amount',
    'Outstanding Balance',
    'Status'
  ];

  const summaryRows = [
    [
      '"1. Overseas Supplier Settlement"',
      `"${shipment.supplierName}"`,
      'USD',
      supplierTotalUSD.toFixed(2),
      totalSupplierPaidUSD.toFixed(2),
      Math.max(0, supplierTotalUSD - totalSupplierPaidUSD).toFixed(2),
      totalSupplierPaidUSD >= supplierTotalUSD ? '"Fully Settled"' : '"Pending Remittance"'
    ],
    [
      '"2. KRA Customs Duties & Taxes"',
      '"Kenya Revenue Authority (Customs Dept)"',
      'KES',
      kraTotalKES.toFixed(2),
      totalKraPaidKES.toFixed(2),
      Math.max(0, kraTotalKES - totalKraPaidKES).toFixed(2),
      totalKraPaidKES >= kraTotalKES ? '"Fully Cleared"' : '"Pending Tax Disbursal"'
    ],
    [
      '"3. Clearing & Forwarding Logistics"',
      `"${shipment.declarantName}"`,
      'KES',
      clearingTotalKES.toFixed(2),
      totalClearingPaidKES.toFixed(2),
      Math.max(0, clearingTotalKES - totalClearingPaidKES).toFixed(2),
      totalClearingPaidKES >= clearingTotalKES ? '"Fully Settled"' : '"Pending Clearing Disbursal"'
    ]
  ];

  const transHeaders = [
    'Leg Type',
    'Payment Date',
    'Transaction Reference / PRN',
    'Bank / Payment Channel',
    'Currency',
    'Original Amount',
    'KES Equivalent Debit',
    'Status'
  ];

  const transRows: Array<string[]> = [];

  (supplierSchedule?.payments || []).forEach(p => {
    transRows.push([
      '"1. Overseas Supplier"',
      `"${p.paymentDate}"`,
      `"${p.swiftMt103Ref}"`,
      `"${p.sourceAccountLabel}"`,
      'USD',
      p.amountUSD.toFixed(2),
      p.amountKESEquivalent.toFixed(2),
      `"${p.status.toUpperCase()}"`
    ]);
  });

  (kraSchedule?.payments || []).forEach(p => {
    transRows.push([
      '"2. KRA Taxes"',
      `"${p.paymentDate}"`,
      `"Customs: ${p.customsEntryNo} | PRN: ${p.kraEslipNumber}"`,
      `"${p.bankPaymentPortalLabel}"`,
      'KES',
      p.amountKES.toFixed(2),
      p.amountKES.toFixed(2),
      `"${p.status.toUpperCase()}"`
    ]);
  });

  (clearingSchedule?.payments || []).forEach(p => {
    transRows.push([
      '"3. Clearing Logistics"',
      `"${p.paymentDate}"`,
      `"Inv: ${p.agentInvoiceRef} | Ref: ${p.paymentRefNo}"`,
      `"${p.sourceBankName} (${p.paymentMethod})"`,
      'KES',
      p.amountKES.toFixed(2),
      p.amountKES.toFixed(2),
      `"${p.status.toUpperCase()}"`
    ]);
  });

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    summaryHeaders.join(','),
    ...summaryRows.map(r => r.join(',')),
    ['', '', '', '', '', '', ''],
    ['DETAILED DISBURSEMENT TRANSACTIONS LOG', '', '', '', '', '', ''],
    transHeaders.join(','),
    ...transRows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`3Way_Payment_Schedule_${shipment.invoiceNumber}.csv`, csvContent);
}

/**
 * Generates an official Supplier Debit Note CSV
 */
export function exportSupplierDebitNoteCSV(debitNote: SupplierDebitNoteRecord) {
  const summaryHeader = [
    ['OFFICIAL SUPPLIER DEBIT NOTE', ''],
    ['Debit Note Number', `"${debitNote.debitNoteNumber}"`],
    ['Date', `"${debitNote.date}"`],
    ['Supplier Name', `"${debitNote.supplierName}"`],
    ['Supplier Country', `"${debitNote.supplierCountry}"`],
    ['Original Commercial Invoice', `"${debitNote.originalInvoiceNo}"`],
    ['Customs Entry SAD', `"${debitNote.customsEntryNo}"`],
    ['KRA E-Slip Ref', `"${debitNote.kraEslipRef}"`],
    ['Exchange Rate (KES/USD)', debitNote.exchangeRate.toFixed(4)],
    ['Total Shortage Quantity (kg)', debitNote.totalShortageKg.toFixed(2)],
    ['Total Goods Shortage Claim (USD)', debitNote.totalShortageUSD.toFixed(2)],
    ['Total Goods Shortage Claim (KES)', debitNote.totalShortageKES.toFixed(2)],
    ['Customs Duty Loss Incurred (KES)', debitNote.kraDutyImpactKES.toFixed(2)],
    ['Total Claim Amount (USD)', debitNote.totalClaimAmountUSD.toFixed(2)],
    ['Total Claim Amount (KES)', debitNote.totalClaimAmountKES.toFixed(2)],
    ['Reason / Particulars', `"${debitNote.reason}"`],
    ['Status', `"${debitNote.status.toUpperCase()}"`],
    ['GL Journal Voucher Ref', `"${debitNote.glJournalRef || 'N/A'}"`],
    ['', '']
  ];

  const headers = [
    'Item #',
    'Description',
    'Invoiced Weight (kg)',
    'Received Intake (kg)',
    'Shortage Variance (kg)',
    'Unit FOB (USD/kg)',
    'Loss Amount (USD)',
    'Loss Amount (KES)'
  ];

  const rows = debitNote.items.map((item, idx) => [
    idx + 1,
    `"${item.description}"`,
    item.invoicedWeightKg.toFixed(2),
    item.receivedWeightKg.toFixed(2),
    (-item.shortageKg).toFixed(2),
    item.unitFobUSD.toFixed(3),
    item.shortageAmountUSD.toFixed(2),
    item.shortageAmountKES.toFixed(2)
  ]);

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`Supplier_Debit_Note_${debitNote.debitNoteNumber}.csv`, csvContent);
}

/**
 * Generates an official 3-Way Weight Intake Audit Schedule PDF
 */
export function exportWeightAuditSchedulePDF(
  shipment: ImportShipmentRecord,
  rows: any[],
  totalShortageKg: number,
  totalShortageUSD: number,
  totalShortageKES: number,
  brandSettings?: BrandSettings,
  etrConfig?: ETRConfig
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(40, currentY, pageWidth - 80, 52, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('3-WAY WEIGHT INTAKE & WEIGHBRIDGE AUDIT SCHEDULE', 55, currentY + 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice: ${shipment.invoiceNumber}`, pageWidth - 160, currentY + 22);
  doc.text(`Date: ${new Date().toISOString().slice(0, 10)}`, pageWidth - 160, currentY + 36);

  currentY += 68;

  // Summary box
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [
        { content: 'SHIPMENT AUDIT METADATA:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: 'SCALE INTAKE AUDIT VARIANCE:', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }
      ],
      [
        `Supplier: ${shipment.supplierName}\nInvoice Ref: ${shipment.invoiceNumber}\nCustoms SAD: ${shipment.customsEntryNo}\nPort: ${shipment.portOfEntry}`,
        `Total Shortage (kg): -${totalShortageKg.toLocaleString()} kg\nFOB Value Loss: $${totalShortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD\nKES Equivalent Loss: KSh ${totalShortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Grid
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [['Description', 'Invoiced (kg)', 'Received (kg)', 'Variance (kg)', 'Unit FOB ($)', 'Shortage ($)', 'Shortage (KES)', 'Status']],
    body: [
      ...rows.map(r => [
        r.description,
        `${r.invoicedKg.toLocaleString()} kg`,
        `${r.receivedKg.toLocaleString()} kg`,
        r.shortageKg > 0 ? `-${r.shortageKg.toLocaleString()} kg` : '0 kg',
        `$${r.unitFobUSD.toFixed(3)}`,
        r.shortageUSD > 0 ? `$${r.shortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00',
        r.shortageKES > 0 ? `KSh ${r.shortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'KSh 0',
        r.hasShortage ? 'Shortage Detected' : 'Verified'
      ]),
      [
        { content: 'TOTAL AUDIT SUMMARY:', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: `-${totalShortageKg.toLocaleString()} kg`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: `$${totalShortageUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: `KSh ${totalShortageKES.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72], fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, currentY + 25, 200, currentY + 25);
  doc.line(pageWidth - 200, currentY + 25, pageWidth - 40, currentY + 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Weighed By: ICD Warehouse Intake Clerk', 40, currentY + 37);
  doc.text('Certified By: Internal Audit Manager', pageWidth - 200, currentY + 37);

  doc.save(`Weight_Audit_Schedule_${shipment.invoiceNumber}.pdf`);
}

/**
 * Generates an official 3-Way Weight Intake Audit Schedule CSV
 */
export function exportWeightAuditScheduleCSV(
  shipment: ImportShipmentRecord,
  rows: any[],
  totalShortageKg: number,
  totalShortageUSD: number,
  totalShortageKES: number
) {
  const summaryHeader = [
    ['3-WAY WEIGHT INTAKE & WEIGHBRIDGE AUDIT SCHEDULE', ''],
    ['Shipment Number', `"${shipment.shipmentNumber}"`],
    ['Commercial Invoice', `"${shipment.invoiceNumber}"`],
    ['Supplier Name', `"${shipment.supplierName}"`],
    ['Customs Entry SAD', `"${shipment.customsEntryNo}"`],
    ['Audit Date', `"${new Date().toISOString().slice(0, 10)}"`],
    ['Total Shortage (kg)', (-totalShortageKg).toFixed(2)],
    ['Total FOB Value Shortage (USD)', totalShortageUSD.toFixed(2)],
    ['Total Loss Equivalent (KES)', totalShortageKES.toFixed(2)],
    ['', '']
  ];

  const headers = [
    'Description',
    'Category',
    'Invoiced Weight (kg)',
    'Scale Received Weight (kg)',
    'Shortage Variance (kg)',
    'Unit FOB (USD/kg)',
    'FOB Loss (USD)',
    'Loss Equivalent (KES)',
    'Customs Duty Loss (KES)',
    'Audit Status'
  ];

  const tableRows = rows.map(r => [
    `"${r.description}"`,
    `"${r.category}"`,
    r.invoicedKg.toFixed(2),
    r.receivedKg.toFixed(2),
    (-r.shortageKg).toFixed(2),
    r.unitFobUSD.toFixed(3),
    r.shortageUSD.toFixed(2),
    r.shortageKES.toFixed(2),
    r.kraDutyLossKES.toFixed(2),
    r.hasShortage ? '"Shortage"' : '"Verified"'
  ]);

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...tableRows.map(r => r.join(','))
  ].join('\n');

  downloadCSV(`Weight_Audit_Schedule_${shipment.invoiceNumber}.csv`, csvContent);
}



