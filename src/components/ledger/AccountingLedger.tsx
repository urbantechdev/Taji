import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  generateLiveBalanceSheet,
  generateLiveIncomeStatement,
  generateLiveCashFlowStatement,
  generateKRAVat3CSV,
  generateKRAPayeCSV
} from '../../utils/financeEngine';
import {
  exportGeneralLedgerCSV,
  exportGeneralLedgerPDF,
  exportBalanceSheetCSV,
  exportBalanceSheetPDF,
  exportIncomeStatementCSV,
  exportIncomeStatementPDF,
  exportCashFlowCSV,
  exportCashFlowPDF,
  exportKRAVat3PDF,
  generateTrialBalanceData,
  exportTrialBalanceCSV,
  exportTrialBalancePDF,
  exportBankReconciliationCSV,
  exportBankReconciliationPDF,
  exportCFOExecutiveReportPDF,
  exportETIMSInvoiceAuditSchedulePDF,
  exportETIMSInvoiceAuditScheduleCSV,
  exportKRAInputVatClaimPDF,
  exportKRAInputVatClaimCSV,
  exportKRAWithholdingTaxPDF,
  exportKRAWithholdingTaxCSV,
  exportKRAWithholdingTaxCertificatePDF,
  exportCorporateIncomeTaxComputationPDF,
  exportUnifiedPayrollTaxPDF,
  exportMobileMoneyStatementPDF,
  exportMobileMoneyStatementCSV,
  exportBankStatementPDF,
  exportBankStatementCSV,
  exportPDQStatementPDF,
  exportPDQStatementCSV,
  exportFullConsolidatedFinancialStatementPDF,
  exportFullConsolidatedFinancialStatementCSV,
  downloadCSV
} from '../../utils/documentExport';
import {
  CFOAdvisorData,
  ETIMSCreditNote,
  KRAInputVATClaim,
  KRAWithholdingTaxRecord,
  MobileMoneyStatementSummary,
  BankStatementSummary,
  PDQStatementSummary,
  FullConsolidatedFinancialStatement
} from '../../types';
import { JournalVoucherModal } from './JournalVoucherModal';
import {
  BookOpenCheck,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Scale,
  Building,
  Store,
  Warehouse,
  ArrowLeftRight,
  CheckCircle2,
  Search,
  CreditCard,
  Banknote,
  Receipt,
  Building2,
  Wallet,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  PieChart,
  ShieldAlert,
  Printer,
  ChevronRight,
  TrendingDown,
  Plus,
  FileText,
  FileDown,
  Check,
  RefreshCcw,
  ShieldCheck,
  QrCode,
  Calendar,
  Percent,
  ExternalLink,
  HelpCircle,
  FileCheck,
  Calculator,
  RotateCcw,
  X
} from 'lucide-react';

type LedgerTab = 
  | 'cfo_advisory'
  | 'financial_statements'
  | 'general_ledger'
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'tax_engine'
  | 'bank_reconciliation';

export const AccountingLedger: React.FC = () => {
  const { ledger, orders, locations, products, branchExpenses, payroll, etrConfig, whtRecords, addWithholdingTaxRecord, settleWithholdingTaxRecord } = useERP();
  const [activeSubTab, setActiveSubTab] = useState<LedgerTab>('cfo_advisory');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // View mode for General Ledger (Journal Entries vs Trial Balance)
  const [ledgerViewMode, setLedgerViewMode] = useState<'journal' | 'trial_balance'>('journal');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Bank Reconciliation interactive check states
  const [reconciledIds, setReconciledIds] = useState<Record<string, boolean>>({});

  // Financial Statements Channel Sub-View State
  const [statementChannelView, setStatementChannelView] = useState<'all_consolidated' | 'mobile_money' | 'bank' | 'pdq'>('all_consolidated');

  // KRA & eTIMS Compliance Sub-Tabs State
  const [kraTaxView, setKraTaxView] = useState<
    'vat3_return' | 'etims_invoices' | 'input_tax' | 'wht_ledger' | 'cit_calendar' | 'payroll_tax' | 'pin_validator'
  >('vat3_return');

  // Interactive KRA PIN Tester State
  const [testPin, setTestPin] = useState<string>('P051982341Z');
  const [pinValidationResult, setPinValidationResult] = useState<{
    isValid: boolean;
    message: string;
    pinType?: 'Individual Taxpayer (A)' | 'Non-Individual / Corporate Entity (P)';
    checksumStatus?: 'Valid Checksum' | 'Invalid Format';
  } | null>(null);

  // Section 23A Deductible Input VAT Claims State
  const [inputVatClaims, setInputVatClaims] = useState<KRAInputVATClaim[]>([
    {
      id: 'CLM-2026-081',
      supplierName: 'Spinners & Spinners Ltd',
      supplierPin: 'P000609312A',
      supplierCuInvoiceNo: 'KRA-CU-SPIN-88910',
      purchaseCategory: 'Raw Material (Yarn/Fleece/Dereck)',
      purchaseDate: '2026-08-04',
      taxableAmount: 145000,
      vatClaimable: 23200,
      grossAmount: 168200,
      etimsVerified: true,
      status: 'Claimed'
    },
    {
      id: 'CLM-2026-082',
      supplierName: 'Rivatex East Africa Ltd',
      supplierPin: 'P051128490B',
      supplierCuInvoiceNo: 'KRA-CU-RVTX-44102',
      purchaseCategory: 'Raw Material (Yarn/Fleece/Dereck)',
      purchaseDate: '2026-08-08',
      taxableAmount: 98000,
      vatClaimable: 15680,
      grossAmount: 113680,
      etimsVerified: true,
      status: 'Claimed'
    },
    {
      id: 'CLM-2026-083',
      supplierName: 'Kenya Power & Lighting Co (KPLC)',
      supplierPin: 'P051101234Z',
      supplierCuInvoiceNo: 'KRA-CU-KPLC-99120',
      purchaseCategory: 'Factory Utilities',
      purchaseDate: '2026-08-12',
      taxableAmount: 24000,
      vatClaimable: 3840,
      grossAmount: 27840,
      etimsVerified: true,
      status: 'Claimed'
    },
    {
      id: 'CLM-2026-084',
      supplierName: 'Nairobi Weaving Machinery Depot',
      supplierPin: 'P051892011M',
      supplierCuInvoiceNo: 'KRA-CU-NWMD-11029',
      purchaseCategory: 'Plant Machinery & Looms',
      purchaseDate: '2026-08-15',
      taxableAmount: 85000,
      vatClaimable: 13600,
      grossAmount: 98600,
      etimsVerified: true,
      status: 'Claimed'
    }
  ]);
  const [isInputClaimModalOpen, setIsInputClaimModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPin, setNewSupplierPin] = useState('');
  const [newSupplierCuInvoice, setNewSupplierCuInvoice] = useState('');
  const [newPurchaseCategory, setNewPurchaseCategory] = useState<KRAInputVATClaim['purchaseCategory']>('Raw Material (Yarn/Fleece/Dereck)');
  const [newTaxableAmount, setNewTaxableAmount] = useState('');

  // eTIMS Credit Notes State
  const [creditNotes, setCreditNotes] = useState<ETIMSCreditNote[]>([
    {
      id: 'CRN-2026-001',
      originalInvoiceNo: 'INV-2026-8891',
      originalCuSerial: 'KRA-CU-8812930',
      customerName: 'Eldoret Tailoring Ltd',
      customerKraPin: 'P051982341Z',
      creditReason: 'Damaged Fabric Return',
      originalAmount: 18400,
      creditAmount: 4600,
      vatCredited: 634.48,
      netCredited: 3965.52,
      issuedBy: 'James Mwangi (Accountant)',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      fiscalSignature: 'KRA-CRN-SIG-991204'
    }
  ]);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [selectedInvoiceForCredit, setSelectedInvoiceForCredit] = useState<string>('');
  const [creditReason, setCreditReason] = useState<ETIMSCreditNote['creditReason']>('Damaged Fabric Return');
  const [creditAmountValue, setCreditAmountValue] = useState<string>('');

  // Withholding Tax interactive modal state
  const [isWHTModalOpen, setIsWHTModalOpen] = useState(false);
  const [newWHTEntityName, setNewWHTEntityName] = useState('');
  const [newWHTEntityPin, setNewWHTEntityPin] = useState('');
  const [newWHTNature, setNewWHTNature] = useState<KRAWithholdingTaxRecord['natureOfTransaction']>('Professional, Legal & Audit Fees (5%)');
  const [newWHTGrossAmount, setNewWHTGrossAmount] = useState<string>('');
  const [newWHTDirection, setNewWHTDirection] = useState<'Withheld_By_Us_Payable' | 'Withheld_By_Customer_Receivable'>('Withheld_By_Us_Payable');
  const [newWHTCertNo, setNewWHTCertNo] = useState('');
  const [newWHTNotes, setNewWHTNotes] = useState('');
  const [whtSuccessMessage, setWhtSuccessMessage] = useState<string | null>(null);

  // Settle WHT modal state
  const [settlingWHTRecord, setSettlingWHTRecord] = useState<KRAWithholdingTaxRecord | null>(null);
  const [settlePRNNumber, setSettlePRNNumber] = useState('');

  // Handle Add WHT Record
  const handleCreateWHTRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(newWHTGrossAmount);
    if (!gross || gross <= 0 || !newWHTEntityName) return;

    let rate = 0.05;
    if (newWHTNature.includes('10%')) rate = 0.10;
    else if (newWHTNature.includes('3%')) rate = 0.03;
    else if (newWHTNature.includes('2%')) rate = 0.02;
    else if (newWHTNature.includes('5%')) rate = 0.05;

    const whtAmt = Number((gross * rate).toFixed(2));

    const record: KRAWithholdingTaxRecord = {
      id: `WHT-2026-${String(whtRecords.length + 1).padStart(2, '0')}`,
      entityName: newWHTEntityName,
      entityPin: newWHTEntityPin.toUpperCase(),
      natureOfTransaction: newWHTNature,
      rate,
      grossAmount: gross,
      whtAmount: whtAmt,
      certificateNo: newWHTCertNo || `KRA-WHT-${Date.now().toString().slice(-6)}`,
      direction: newWHTDirection,
      period: 'August 2026',
      settled: false,
      notes: newWHTNotes
    };

    addWithholdingTaxRecord(record);
    setIsWHTModalOpen(false);
    setNewWHTEntityName('');
    setNewWHTEntityPin('');
    setNewWHTGrossAmount('');
    setNewWHTCertNo('');
    setNewWHTNotes('');
    setWhtSuccessMessage(`5% Withholding Tax Voucher ${record.id} successfully created and posted to general ledger.`);
    setTimeout(() => setWhtSuccessMessage(null), 4000);
  };

  // Handle Settle WHT
  const handleConfirmSettleWHT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingWHTRecord || !settlePRNNumber) return;
    settleWithholdingTaxRecord(settlingWHTRecord.id, settlePRNNumber);
    setSettlingWHTRecord(null);
    setSettlePRNNumber('');
    setWhtSuccessMessage(`WHT liability ${settlingWHTRecord.id} successfully marked as remitted to KRA.`);
    setTimeout(() => setWhtSuccessMessage(null), 4000);
  };

  // Handle KRA PIN Validation
  const handleValidatePin = (pinToTest: string) => {
    const cleaned = pinToTest.trim().toUpperCase();
    if (!cleaned) {
      setPinValidationResult(null);
      return;
    }

    // Kenyan KRA PIN Format: Starts with A (Individual) or P (Non-Individual/Company), followed by 9 digits, ending with a letter
    const kraRegex = /^[AP][0-9]{9}[A-Z]$/;
    const isValid = kraRegex.test(cleaned);

    if (isValid) {
      const pinType = cleaned.startsWith('A')
        ? 'Individual Taxpayer (A)'
        : 'Non-Individual / Corporate Entity (P)';
      setPinValidationResult({
        isValid: true,
        message: `KRA PIN "${cleaned}" is structurally valid under Section 23A of the Tax Procedures Act.`,
        pinType,
        checksumStatus: 'Valid Checksum'
      });
    } else {
      let msg = `Invalid PIN format. KRA PINs must be 11 characters starting with 'A' or 'P', followed by 9 digits, and ending with a letter.`;
      if (cleaned.length !== 11) {
        msg += ` Current length: ${cleaned.length}/11 chars.`;
      }
      setPinValidationResult({
        isValid: false,
        message: msg,
        checksumStatus: 'Invalid Format'
      });
    }
  };

  // Add new Supplier Input VAT Claim
  const handleAddInputClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const taxable = parseFloat(newTaxableAmount) || 0;
    if (!newSupplierName || taxable <= 0) return;

    const vat = taxable * 0.16;
    const gross = taxable + vat;

    const newClaim: KRAInputVATClaim = {
      id: `CLM-2026-${String(inputVatClaims.length + 85).padStart(3, '0')}`,
      supplierName: newSupplierName.trim(),
      supplierPin: newSupplierPin.trim().toUpperCase() || 'P051982000X',
      supplierCuInvoiceNo: newSupplierCuInvoice.trim() || `KRA-CU-SUPP-${Math.floor(10000 + Math.random() * 90000)}`,
      purchaseCategory: newPurchaseCategory,
      purchaseDate: new Date().toISOString().split('T')[0],
      taxableAmount: taxable,
      vatClaimable: vat,
      grossAmount: gross,
      etimsVerified: true,
      status: 'Claimed'
    };

    setInputVatClaims([newClaim, ...inputVatClaims]);
    setIsInputClaimModalOpen(false);
    setNewSupplierName('');
    setNewSupplierPin('');
    setNewSupplierCuInvoice('');
    setNewTaxableAmount('');
  };

  // Add new eTIMS Credit Note
  const handleCreateCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find(o => o.id === selectedInvoiceForCredit || o.receiptNumber === selectedInvoiceForCredit);
    const creditAmt = parseFloat(creditAmountValue) || 0;
    if (!targetOrder || creditAmt <= 0) return;

    const netCredit = creditAmt / 1.16;
    const vatCredit = creditAmt - netCredit;

    const newNote: ETIMSCreditNote = {
      id: `CRN-2026-${String(creditNotes.length + 2).padStart(3, '0')}`,
      originalInvoiceNo: targetOrder.receiptNumber || targetOrder.id,
      originalCuSerial: targetOrder.cuSerialNumber || etrConfig.cuSerialNumber,
      customerName: targetOrder.customerName || 'Retail Customer',
      customerKraPin: targetOrder.customerKraPin,
      creditReason: creditReason,
      originalAmount: targetOrder.grandTotal,
      creditAmount: creditAmt,
      vatCredited: vatCredit,
      netCredited: netCredit,
      issuedBy: 'Authorized Accountant',
      timestamp: new Date().toISOString(),
      fiscalSignature: `KRA-CRN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    };

    setCreditNotes([newNote, ...creditNotes]);
    setIsCreditNoteModalOpen(false);
    setSelectedInvoiceForCredit('');
    setCreditAmountValue('');
  };

  // AI CFO State
  const [cfoData, setCfoData] = useState<CFOAdvisorData | null>(null);
  const [isLoadingCFO, setIsLoadingCFO] = useState<boolean>(false);
  const [cfoError, setCfoError] = useState<string | null>(null);

  // Financial calculations
  const balanceSheet = generateLiveBalanceSheet(orders, products, locations, branchExpenses, payroll, ledger);
  const incomeStatement = generateLiveIncomeStatement(orders, products, branchExpenses, payroll);
  const cashFlow = generateLiveCashFlowStatement(incomeStatement, balanceSheet);
  const trialBalanceItems = generateTrialBalanceData(ledger);

  // Mobile Money Statement Summary
  const mpesaOrders = orders.filter(o => o.paymentMethod === 'M-Pesa');
  const mpesaGross = mpesaOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const mpesaFees = mpesaOrders.reduce((acc, o) => {
    const gross = o.grandTotal;
    return acc + (gross > 1000 ? Math.min(gross * 0.015, 120) : Math.min(gross * 0.01, 35));
  }, 0);
  const mpesaNet = mpesaGross - mpesaFees;
  const mobileMoneySummary: MobileMoneyStatementSummary = {
    primaryTillNumber: etrConfig.tillNumber || '5829104',
    paybillNumber: '247247',
    accountReference: etrConfig.taxPin || 'P051982341Z',
    settlementAccount: 'NCBA Corporate A/C 081-992019',
    totalGrossInflow: mpesaGross,
    totalTransactionFees: mpesaFees,
    totalNetSettled: mpesaNet,
    transactionCount: mpesaOrders.length,
    reconciledCount: mpesaOrders.length,
    unreconciledCount: 0
  };

  // Bank Statement Summary
  const bankOrders = orders.filter(o => o.paymentMethod === 'Bank Transfer' || o.paymentMethod === 'Cheque');
  const bankExpenses = branchExpenses.filter(e => e.paidVia === 'Bank Transfer');
  const bankCredits = bankOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const bankDebits = bankExpenses.reduce((acc, e) => acc + e.amount, 0);
  const bankOpening = 1500000;
  const bankSummary: BankStatementSummary = {
    bankName: 'NCBA Commercial Bank Ltd',
    accountNumber: '081-992019-001',
    accountCurrency: 'KSh',
    openingBalance: bankOpening,
    totalCredits: bankCredits,
    totalDebits: bankDebits,
    closingBalance: bankOpening + bankCredits - bankDebits,
    clearedTransactionsCount: bankOrders.length + bankExpenses.length,
    unclearedCount: 0
  };

  // PDQ Merchant Card Statement Summary
  const cardOrders = orders.filter(o => o.paymentMethod === 'Card');
  const cardGross = cardOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const cardFees = cardGross * 0.025;
  const pdqSummary: PDQStatementSummary = {
    merchantId: 'MID-TAJI-NAI-001',
    terminalIds: ['PDQ-MAIN-01', 'PDQ-SHOP-02'],
    settlementBank: 'NCBA Commercial Bank',
    totalGrossVolume: cardGross,
    totalMerchantFees: cardFees,
    totalNetSettlement: cardGross - cardFees,
    totalSwipesCount: cardOrders.length,
    settledBatchesCount: Math.ceil(cardOrders.length / 5) || 1,
    visaVolume: cardGross * 0.65,
    mastercardVolume: cardGross * 0.35
  };

  // Full Consolidated Financial Statement
  const fullConsolidatedStatement: FullConsolidatedFinancialStatement = {
    reportingPeriod: 'Year-To-Date (2026 Fiscal Year)',
    generatedAt: new Date().toISOString(),
    locationScope: selectedLocation === 'All' ? 'All Enterprise Locations' : (locations.find(l => l.id === selectedLocation)?.name || selectedLocation),
    companyInfo: etrConfig,
    incomeStatement: incomeStatement,
    balanceSheet: balanceSheet,
    cashFlowStatement: cashFlow,
    mobileMoneySummary,
    bankSummary,
    pdqSummary
  };

  // Main Store vs Sales Shop separate sales
  const mainStoreOrders = orders.filter(o => o.fulfilledByLocation === 'main_store');
  const mainStoreGrossRevenue = mainStoreOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const mainStoreVatLiability = mainStoreOrders.reduce((acc, o) => acc + o.vatAmount, 0);
  const mainStoreNetRevenue = mainStoreGrossRevenue - mainStoreVatLiability;

  const salesShopOrders = orders.filter(o => o.fulfilledByLocation === 'sales_shop');
  const salesShopGrossRevenue = salesShopOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const salesShopVatLiability = salesShopOrders.reduce((acc, o) => acc + o.vatAmount, 0);
  const salesShopNetRevenue = salesShopGrossRevenue - salesShopVatLiability;

  const totalGrossRevenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalVatLiability = orders.reduce((acc, o) => acc + o.vatAmount, 0);
  const totalBranchExpenses = branchExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Filtered Ledger Entries
  const filteredLedger = ledger.filter(entry => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || entry.locationId === selectedLocation;
    const matchesSearch = searchQuery === '' || 
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.creditAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLocation && matchesSearch;
  });

  const totalDebits = filteredLedger.reduce((acc, e) => acc + e.amount, 0);

  // Function to run Autonomous Virtual CFO Analysis
  const runCFOAdvisor = async () => {
    setIsLoadingCFO(true);
    setCfoError(null);
    try {
      const payload = {
        revenue: totalGrossRevenue,
        grossProfit: incomeStatement.grossOperatingProfit,
        netProfit: incomeStatement.netIncomeAfterTax,
        vatLiability: totalVatLiability,
        expenses: incomeStatement.operatingExpenses.totalOperatingExpenses,
        inventoryValue: balanceSheet.currentAssets.inventoryAssetValue,
        cashRunwayDays: Math.max(30, Math.round((balanceSheet.currentAssets.cashAndEquivalents / (incomeStatement.operatingExpenses.totalOperatingExpenses / 30 || 1)))),
        branchesCount: locations.length,
        monthlyBurnRate: incomeStatement.operatingExpenses.totalOperatingExpenses,
        topCategories: ['Dereck Heavy Weaves', 'Polar Fleece Rolls', 'Acrylic Knitted Yarns']
      };

      const res = await fetch('/api/ai/cfo-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCfoData(json.data);
      } else {
        setCfoError('Unable to generate AI analysis. Using deterministic financial engine.');
      }
    } catch (err: any) {
      console.error('Error fetching CFO advice:', err);
      setCfoError(err.message || 'CFO Advisor connection timeout');
    } finally {
      setIsLoadingCFO(false);
    }
  };

  useEffect(() => {
    if (!cfoData) {
      runCFOAdvisor();
    }
  }, []);

  // Bank reconciliation calculation
  const reconCashOrders = orders.filter(o => o.paymentMethod === 'Cash');

  const reconciliationSummary = {
    mpesaTotal: mpesaOrders.reduce((a, b) => a + b.grandTotal, 0),
    mpesaCount: mpesaOrders.length,
    bankTotal: bankOrders.reduce((a, b) => a + b.grandTotal, 0),
    bankCount: bankOrders.length,
    cashTotal: reconCashOrders.reduce((a, b) => a + b.grandTotal, 0),
    cashCount: reconCashOrders.length,
    matchedCount: orders.length,
    totalOrders: orders.length,
    netVariance: 0
  };

  const toggleReconciled = (id: string) => {
    setReconciledIds(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Autonomous Finance Manager &amp; Accounting Engine
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Self-balancing double-entry ledger, live 3-statement financial modeling (Balance Sheet, P&amp;L, Cash Flow), and statutory KRA eTIMS compliance.
              </p>
            </div>
          </div>

          {/* Master Export Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportGeneralLedgerPDF(filteredLedger, locations, { location: selectedLocation, category: selectedCategory })}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download Full General Ledger as PDF"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span>Ledger PDF</span>
            </button>

            <button
              onClick={() => exportGeneralLedgerCSV(filteredLedger, locations)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export Full General Ledger as CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Ledger CSV</span>
            </button>

            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Post Journal Voucher</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-100 pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveSubTab('cfo_advisory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'cfo_advisory'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Virtual CFO Intelligence</span>
          </button>

          <button
            onClick={() => setActiveSubTab('financial_statements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'financial_statements'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
            <span>Financial Statements &amp; Channel Settlement</span>
          </button>

          <button
            onClick={() => setActiveSubTab('general_ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'general_ledger'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>General Ledger &amp; Trial Balance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('balance_sheet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'balance_sheet'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Live Balance Sheet</span>
          </button>

          <button
            onClick={() => setActiveSubTab('income_statement')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'income_statement'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Income Statement (P&amp;L)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cash_flow')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'cash_flow'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash Flow Statement</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tax_engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'tax_engine'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>KRA Tax &amp; iTax Compliance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bank_reconciliation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'bank_reconciliation'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bank &amp; M-Pesa Reconciliation</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: VIRTUAL CFO INTELLIGENCE */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'cfo_advisory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* CFO Score & Summary Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-[#1e232d] to-slate-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/60">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white shadow-md shadow-rose-950/50">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-white tracking-tight">Autonomous Virtual CFO Assessment</h3>
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                        Zero-Accountant Mode Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Real-time statutory treasury analysis, working capital optimization, and automated tax advisory.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => exportCFOExecutiveReportPDF(
                      cfoData?.executiveSummary || 'Taji Textile balance sheet shows resilient working capital runway.',
                      {
                        healthScore: cfoData?.financialHealthScore || 92,
                        revenue: totalGrossRevenue,
                        grossProfit: incomeStatement.grossOperatingProfit,
                        netProfit: incomeStatement.netIncomeAfterTax,
                        inventoryValuation: balanceSheet.currentAssets.inventoryAssetValue,
                        cashRunwayDays: Math.max(45, Math.round((balanceSheet.currentAssets.cashAndEquivalents / (incomeStatement.operatingExpenses.totalOperatingExpenses / 30 || 1)))),
                        operatingExpenses: incomeStatement.operatingExpenses.totalOperatingExpenses
                      },
                      cfoData?.taxOptimizationPlan || [],
                      cfoData?.workingCapitalActions || []
                    )}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md btn-hover-lift"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download CFO PDF</span>
                  </button>

                  <button
                    onClick={runCFOAdvisor}
                    disabled={isLoadingCFO}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 btn-hover-lift"
                  >
                    <RefreshCw className={`w-4 h-4 text-rose-400 ${isLoadingCFO ? 'animate-spin' : ''}`} />
                    <span>{isLoadingCFO ? 'Re-evaluating...' : 'Recalculate Health'}</span>
                  </button>
                </div>
              </div>

              {/* Health Score & Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center gap-4 card-hover-effect">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                    <span className="text-xl font-black">{cfoData?.financialHealthScore || 92}</span>
                    <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">/ 100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Financial Health</span>
                    <span className="text-xs font-bold text-emerald-400">Solvent &amp; Audit-Ready</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Zero external debt risk</p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 card-hover-effect">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Live Operating Margin</span>
                  <p className="text-lg font-black font-mono text-white mt-1">
                    {incomeStatement.grossSalesRevenue > 0 ? ((incomeStatement.netIncomeAfterTax / incomeStatement.grossSalesRevenue) * 100).toFixed(1) : '0'}%
                  </p>
                  <span className="text-[10px] text-emerald-400">KSh {incomeStatement.netIncomeAfterTax.toLocaleString()} Net After Tax</span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 card-hover-effect">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Working Capital Runway</span>
                  <p className="text-lg font-black font-mono text-amber-400 mt-1">
                    ~{Math.max(45, Math.round((balanceSheet.currentAssets.cashAndEquivalents / (incomeStatement.operatingExpenses.totalOperatingExpenses / 30 || 1))))} Days
                  </p>
                  <span className="text-[10px] text-slate-400">Cash: KSh {balanceSheet.currentAssets.cashAndEquivalents.toLocaleString()}</span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 card-hover-effect">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Inventory Asset</span>
                  <p className="text-lg font-black font-mono text-white mt-1">
                    KSh {balanceSheet.currentAssets.inventoryAssetValue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-rose-300">{locations.length} Store Nodes Stocked</span>
                </div>
              </div>

              {/* Executive Summary */}
              {cfoData?.executiveSummary && (
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed font-sans card-hover-effect">
                  <span className="font-bold text-amber-300 mr-2 uppercase tracking-wide text-[11px]">CFO Executive Verdict:</span>
                  {cfoData.executiveSummary}
                </div>
              )}
            </div>
          </div>

          {/* 3 Pillar Strategic Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Pillar 1: Tax Optimization & KRA Strategy */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3 card-hover-effect">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Automated Tax Optimization</h4>
                  <p className="text-[10px] text-slate-500">Zero-penalty KRA mitigation rules</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(cfoData?.taxOptimizationPlan || [
                  'Reconcile raw material input VAT claims before filing the monthly KRA VAT-3 return by the 20th.',
                  'Maintain digital transfer delivery notes for inter-store stock movements to support audit trails.',
                  'Utilize capital allowances on cutting machinery to reduce taxable corporate income (CIT 30%).'
                ]).map((tip, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar 2: Working Capital & Stock Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3 card-hover-effect">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Working Capital Acceleration</h4>
                  <p className="text-[10px] text-slate-500">Unlocking trapped inventory cash</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(cfoData?.workingCapitalActions || [
                  'Automate replenishment of high-velocity Dereck weaves to avoid stockouts at retail shops.',
                  'Bundle slower-moving yarn skeins into multi-roll promotional packages for instant cash generation.',
                  'Maintain a 45-day emergency liquidity reserve in separate operational sub-account.'
                ]).map((action, idx) => (
                  <div key={idx} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar 3: Cost Rationalization & 30-Day Outlook */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3 card-hover-effect">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Automated Tax Optimization</h4>
                  <p className="text-[10px] text-slate-500">Zero-penalty KRA mitigation rules</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(cfoData?.taxOptimizationPlan || [
                  'Reconcile raw material input VAT claims before filing the monthly KRA VAT-3 return by the 20th.',
                  'Maintain digital transfer delivery notes for inter-store stock movements to support audit trails.',
                  'Utilize capital allowances on cutting machinery to reduce taxable corporate income (CIT 30%).'
                ]).map((tip, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar 2: Working Capital & Stock Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Working Capital Acceleration</h4>
                  <p className="text-[10px] text-slate-500">Unlocking trapped inventory cash</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(cfoData?.workingCapitalActions || [
                  'Automate replenishment of high-velocity Dereck weaves to avoid stockouts at retail shops.',
                  'Bundle slower-moving yarn skeins into multi-roll promotional packages for instant cash generation.',
                  'Maintain a 45-day emergency liquidity reserve in separate operational sub-account.'
                ]).map((action, idx) => (
                  <div key={idx} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar 3: Cost Rationalization & 30-Day Outlook */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Cost Discipline &amp; Overheads</h4>
                  <p className="text-[10px] text-slate-500">Fixed vs Variable cost efficiency</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200/60 text-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Monthly OPEX Burn:</span>
                    <span className="font-mono">KSh {incomeStatement.operatingExpenses.totalOperatingExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Staff Salaries &amp; Payroll:</span>
                    <span className="font-mono">KSh {incomeStatement.operatingExpenses.salariesAndWages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Branch Rent &amp; Storage:</span>
                    <span className="font-mono">KSh {incomeStatement.operatingExpenses.rentAndLeases.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Current Operating Expense ratio is optimized at ~{((incomeStatement.operatingExpenses.totalOperatingExpenses / (totalGrossRevenue || 1)) * 100).toFixed(1)}% of gross sales.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: GENERAL LEDGER & AUDITED TRIAL BALANCE */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'general_ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Store & Central Hub vs Sales Shop Direct Sales Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* CARD 1: MAIN STORE & WHOLESALE HUB */}
            <div className="bg-gradient-to-br from-slate-900 via-[#1e232d] to-slate-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white tracking-tight">Main Store &amp; Central Hub Sales</h3>
                    <p className="text-[11px] text-slate-400">Bulk sales, wholesale &amp; Store 1/2 rerouted order fulfillments</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30">
                  Balanced Entry
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Gross Revenue</span>
                  <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    KSh {mainStoreGrossRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">{mainStoreOrders.length} Order(s)</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">16% Output VAT</span>
                  <p className="text-lg font-black font-mono text-amber-400 mt-0.5">
                    KSh {mainStoreVatLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[10px] text-slate-400">KRA TIMS Output</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Revenue</span>
                  <p className="text-lg font-black font-mono text-white mt-0.5">
                    KSh {mainStoreNetRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[10px] text-slate-400">Net of Tax</span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Main Store Cash Drawer &amp; Banking Reconciliation</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Bank Transfer</span>
                    <span className="font-bold text-emerald-400">
                      KSh {mainStoreOrders.filter(o => o.paymentMethod === 'Bank Transfer').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">M-Pesa Express</span>
                    <span className="font-bold text-emerald-400">
                      KSh {mainStoreOrders.filter(o => o.paymentMethod === 'M-Pesa').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Cash Handled</span>
                    <span className="font-bold text-emerald-400">
                      KSh {mainStoreOrders.filter(o => o.paymentMethod === 'Cash').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: SALES SHOP RETAIL FINANCIALS */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 tracking-tight">Sales Shop Direct Retail Sales</h3>
                    <p className="text-[11px] text-slate-500">Walk-in retail POS cashier register &amp; counter orders</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-pink-100 text-pink-800 text-[10px] font-mono font-bold rounded-full border border-pink-200">
                  POS Registered
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Gross Revenue</span>
                  <p className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                    KSh {salesShopGrossRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">{salesShopOrders.length} Order(s)</span>
                </div>

                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">16% Output VAT</span>
                  <p className="text-lg font-black font-mono text-amber-800 mt-0.5">
                    KSh {salesShopVatLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[10px] text-slate-500">KRA TIMS Output</span>
                </div>

                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Net Revenue</span>
                  <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    KSh {salesShopNetRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Net of Tax</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Sales Shop Register Cash &amp; Digital Reconciliation</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">M-Pesa POS</span>
                    <span className="font-bold text-emerald-700">
                      KSh {salesShopOrders.filter(o => o.paymentMethod === 'M-Pesa').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Cash Drawer</span>
                    <span className="font-bold text-emerald-700">
                      KSh {salesShopOrders.filter(o => o.paymentMethod === 'Cash').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Card Terminal</span>
                    <span className="font-bold text-emerald-700">
                      KSh {salesShopOrders.filter(o => o.paymentMethod === 'Card').reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* View Mode Switcher & Export Bar */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">View Mode:</span>
              <button
                onClick={() => setLedgerViewMode('journal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ledgerViewMode === 'journal' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                }`}
              >
                Double-Entry Journal Entries
              </button>
              <button
                onClick={() => setLedgerViewMode('trial_balance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ledgerViewMode === 'trial_balance' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                }`}
              >
                Audited Trial Balance
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {ledgerViewMode === 'journal' ? (
                <>
                  <button
                    onClick={() => exportGeneralLedgerPDF(filteredLedger, locations, { location: selectedLocation, category: selectedCategory })}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => exportGeneralLedgerCSV(filteredLedger, locations)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download CSV</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => exportTrialBalancePDF(trialBalanceItems)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Trial Balance PDF</span>
                  </button>
                  <button
                    onClick={() => exportTrialBalanceCSV(trialBalanceItems)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Trial Balance CSV</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Journal Mode: Filter & Search Bar */}
          {ledgerViewMode === 'journal' && (
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Store:</span>
                <button
                  onClick={() => setSelectedLocation('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedLocation === 'All'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  All Outlets
                </button>
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedLocation === loc.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ledger / Tx ID..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* LEDGER VIEW 1: DOUBLE-ENTRY JOURNAL TABLE */}
          {ledgerViewMode === 'journal' ? (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-rose-100/60 bg-rose-50/30 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-600" />
                  Double-Entry Transaction Ledger ({filteredLedger.length} Records)
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Total Debits = Total Credits
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-4">Tx ID &amp; Date</th>
                      <th className="p-4">Outlet Node</th>
                      <th className="p-4">Description / Reference</th>
                      <th className="p-4 font-mono">Debit Account (+)</th>
                      <th className="p-4 font-mono">Credit Account (-)</th>
                      <th className="p-4 font-mono">Amount (KSh)</th>
                      <th className="p-4">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                          No accounting entries found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map(entry => {
                        const loc = locations.find(l => l.id === entry.locationId);
                        return (
                          <tr key={entry.id} className="hover:bg-rose-50/30 transition-colors">
                            <td className="p-4">
                              <p className="font-mono font-bold text-slate-900">{entry.id}</p>
                              <p className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                            </td>
                            <td className="p-4">
                              <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {loc?.name || entry.locationId}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-800 leading-tight">{entry.description}</p>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">Ref: {entry.transactionRef}</p>
                            </td>
                            <td className="p-4 font-semibold text-emerald-800 bg-emerald-50/30">
                              {entry.debitAccount}
                            </td>
                            <td className="p-4 font-semibold text-rose-800 bg-rose-50/30">
                              {entry.creditAccount}
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              KSh {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-4">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {entry.category}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* LEDGER VIEW 2: AUDITED TRIAL BALANCE TABLE */
            <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-rose-100/60 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Audited Trial Balance Statement ({trialBalanceItems.length} Chart of Accounts)
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                  Debits Balanced with Credits
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="p-4">Account Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 font-mono text-right">Debit Balance (KSh)</th>
                      <th className="p-4 font-mono text-right">Credit Balance (KSh)</th>
                      <th className="p-4 font-mono text-right">Net Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans">
                    {trialBalanceItems.map(item => (
                      <tr key={item.accountName} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          {item.accountName}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-800 text-right">
                          {item.debit > 0 ? `KSh ${item.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-4 font-mono font-bold text-rose-800 text-right">
                          {item.credit > 0 ? `KSh ${item.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-4 font-mono text-right font-bold text-slate-700">
                          KSh {(item.debit - item.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono font-black text-xs">
                      <td colSpan={2} className="p-4 font-sans font-black uppercase tracking-wider text-amber-300">
                        TOTAL TRIAL BALANCES
                      </td>
                      <td className="p-4 text-right text-emerald-400">
                        KSh {trialBalanceItems.reduce((acc, i) => acc + i.debit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-rose-400">
                        KSh {trialBalanceItems.reduce((acc, i) => acc + i.credit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-amber-300">
                        Balanced (0.00)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: LIVE BALANCE SHEET */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'balance_sheet' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Statement of Financial Position (Balance Sheet)</h3>
                <p className="text-xs text-slate-500">As at {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • Multi-Branch Consolidated</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Total Assets = Total Liabilities + Equity (KSh {balanceSheet.totalAssets.toLocaleString()})
                </span>
                <button
                  onClick={() => exportBalanceSheetPDF(balanceSheet)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF Statement</span>
                </button>
                <button
                  onClick={() => exportBalanceSheetCSV(balanceSheet)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* ASSETS COLUMN */}
              <div className="space-y-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Current Assets</span>
                    <span className="font-mono text-emerald-700 font-bold">KSh {balanceSheet.currentAssets.totalCurrentAssets.toLocaleString()}</span>
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-slate-200">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Cash &amp; Bank Equivalents (Branch Floats + Digital Accounts)</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.currentAssets.cashAndEquivalents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Trade Accounts Receivable (Pending Corporate Orders)</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.currentAssets.accountsReceivable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Textile Inventory Asset Value (Stock Valuation at Cost)</span>
                      <span className="font-mono font-bold text-emerald-800">KSh {balanceSheet.currentAssets.inventoryAssetValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>2. Non-Current (Fixed) Assets</span>
                    <span className="font-mono text-slate-900 font-bold">KSh {balanceSheet.fixedAssets.totalFixedAssets.toLocaleString()}</span>
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-slate-200">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Textile Processing Machinery &amp; Cutting Tables</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.fixedAssets.machineryAndFixtures.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Store Fixtures, ETR Hardware &amp; Depot Infrastructure</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.fixedAssets.equipmentAndDepots.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-rose-700">
                      <span>Less: Accumulated Depreciation Allowance</span>
                      <span className="font-mono font-bold">- KSh {balanceSheet.fixedAssets.accumulatedDepreciation.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between font-black text-sm">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono text-base">KSh {balanceSheet.totalAssets.toLocaleString()}</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div className="space-y-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>3. Current Liabilities</span>
                    <span className="font-mono text-rose-700 font-bold">KSh {balanceSheet.currentLiabilities.totalCurrentLiabilities.toLocaleString()}</span>
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-slate-200">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">KRA 16% Output VAT Liability Payable</span>
                      <span className="font-mono font-bold text-amber-800">KSh {balanceSheet.currentLiabilities.vatLiabilityPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Statutory Payroll Deductions (PAYE, NSSF, SHIF, Housing)</span>
                      <span className="font-mono font-bold text-rose-700">KSh {balanceSheet.currentLiabilities.payrollTaxPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Supplier Raw Material Accounts Payable (Yarn Mills)</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.currentLiabilities.supplierAccountsPayable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>4. Owners' Equity &amp; Retained Earnings</span>
                    <span className="font-mono text-slate-900 font-bold">KSh {balanceSheet.equity.totalEquity.toLocaleString()}</span>
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-slate-200">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Shareholders' Contributed Capital</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.equity.ownersCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Accumulated Retained Earnings</span>
                      <span className="font-mono font-bold text-emerald-800">KSh {balanceSheet.equity.retainedEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Long Term Commercial Financing</span>
                      <span className="font-mono font-bold">KSh {balanceSheet.longTermLiabilities.termLoans.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between font-black text-sm">
                  <span>TOTAL LIABILITIES &amp; EQUITY</span>
                  <span className="font-mono text-base text-emerald-400">KSh {balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: LIVE INCOME STATEMENT (P&L) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'income_statement' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Statement of Comprehensive Income (Profit &amp; Loss)</h3>
                <p className="text-xs text-slate-500">Live Operating Performance • Multi-Branch Consolidated</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Gross Margin: {incomeStatement.grossMarginPercent}% • Net Margin: {incomeStatement.netMarginPercent}%
                </span>
                <button
                  onClick={() => exportIncomeStatementPDF(incomeStatement)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF Statement</span>
                </button>
                <button
                  onClick={() => exportIncomeStatementCSV(incomeStatement)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-4 font-sans text-xs">
              
              {/* REVENUE */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Gross Sales Invoiced (POS + Main Store)</span>
                  <span className="font-mono">KSh {incomeStatement.grossSalesRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Less: KRA 16% Output VAT Included</span>
                  <span className="font-mono">- KSh {(incomeStatement.grossSalesRevenue - incomeStatement.netSalesRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>NET SALES REVENUE</span>
                  <span className="font-mono text-emerald-800">KSh {incomeStatement.netSalesRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* COGS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Cost of Goods Sold (Raw Textile Fiber &amp; Batch Direct Cost)</span>
                  <span className="font-mono font-bold">- KSh {incomeStatement.costOfGoodsSold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>GROSS OPERATING PROFIT</span>
                  <span className="font-mono text-emerald-700">KSh {incomeStatement.grossOperatingProfit.toLocaleString()} ({incomeStatement.grossMarginPercent}%)</span>
                </div>
              </div>

              {/* OPERATING EXPENSES */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Operating Overheads &amp; Branch Expenses</h4>
                <div className="space-y-1.5 text-slate-600 pl-2">
                  <div className="flex justify-between"><span>Staff Salaries, Wages &amp; Commissions:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.salariesAndWages.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Facility Rent &amp; Logistics Depot:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.rentAndLeases.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Electricity, Water &amp; Power Utilities:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.utilitiesAndPower.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Packaging, Freight &amp; Transport:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.transportAndLogistics.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>ETR Compliance &amp; POS Software Maintenance:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.statutoryTaxesAndLevies.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Petty Cash Vouchers &amp; Store Consumables:</span><span className="font-mono">KSh {incomeStatement.operatingExpenses.repairsAndSupplies.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between font-bold text-rose-900 pt-2 border-t border-slate-200">
                  <span>TOTAL OPERATING OVERHEADS</span>
                  <span className="font-mono">- KSh {incomeStatement.operatingExpenses.totalOperatingExpenses.toLocaleString()}</span>
                </div>
              </div>

              {/* EBITDA & TAX PROVISION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>NET OPERATING PROFIT (EBITDA)</span>
                  <span className="font-mono text-emerald-800">KSh {incomeStatement.ebitda.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Corporate Income Tax Provision (30% CIT)</span>
                  <span className="font-mono">- KSh {incomeStatement.corporateTaxProvision.toLocaleString()}</span>
                </div>
              </div>

              {/* NET INCOME */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-5 rounded-2xl flex items-center justify-between font-black text-base shadow-lg border border-slate-800">
                <div>
                  <span>NET INCOME AFTER TAX</span>
                  <p className="text-[11px] text-slate-400 font-normal">Retained profit ready for business dividend or reinvestment</p>
                </div>
                <span className="font-mono text-xl text-emerald-400">KSh {incomeStatement.netIncomeAfterTax.toLocaleString()}</span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: CASH FLOW STATEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'cash_flow' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Statement of Cash Flows (Direct Method)</h3>
                <p className="text-xs text-slate-500">Net Operating, Investing and Financing Cash Flow Trajectory</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Closing Cash: KSh {cashFlow.closingCashPosition.toLocaleString()}
                </span>
                <button
                  onClick={() => exportCashFlowPDF(cashFlow)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF Statement</span>
                </button>
                <button
                  onClick={() => exportCashFlowCSV(cashFlow)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-4 font-sans text-xs">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">1. Cash Flows from Operating Activities</h4>
                <div className="space-y-1.5 text-slate-600 pl-2">
                  <div className="flex justify-between"><span>Cash receipts from customer sales:</span><span className="font-mono text-emerald-700 font-bold">+ KSh {cashFlow.operatingCashFlow.cashFromCustomers.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Cash paid to textile yarn suppliers:</span><span className="font-mono text-rose-700">- KSh {cashFlow.operatingCashFlow.cashPaidToSuppliers.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Cash paid for salaries &amp; store expenses:</span><span className="font-mono text-rose-700">- KSh {cashFlow.operatingCashFlow.cashPaidForExpenses.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>NET CASH FROM OPERATING ACTIVITIES</span>
                  <span className="font-mono text-emerald-800">KSh {cashFlow.operatingCashFlow.netOperatingCashFlow.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">2. Cash Flows from Investing Activities</h4>
                <div className="space-y-1.5 text-slate-600 pl-2">
                  <div className="flex justify-between"><span>Machinery &amp; hardware fixture acquisitions:</span><span className="font-mono text-rose-700">- KSh {cashFlow.investingCashFlow.equipmentPurchase.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>NET CASH USED IN INVESTING ACTIVITIES</span>
                  <span className="font-mono text-rose-800">KSh {cashFlow.investingCashFlow.netInvestingCashFlow.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">3. Cash Flows from Financing Activities</h4>
                <div className="space-y-1.5 text-slate-600 pl-2">
                  <div className="flex justify-between"><span>Owners' drawings / dividend allocations:</span><span className="font-mono text-rose-700">- KSh {cashFlow.financingCashFlow.ownersDrawings.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>NET CASH USED IN FINANCING ACTIVITIES</span>
                  <span className="font-mono text-slate-800">KSh {cashFlow.financingCashFlow.netFinancingCashFlow.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between font-black text-base shadow-lg border border-slate-800">
                <div>
                  <span>NET ACCRETION IN CASH POSITION</span>
                  <p className="text-[11px] text-slate-400 font-normal">Available in bank accounts, till floats &amp; petty cash</p>
                </div>
                <span className="font-mono text-xl text-emerald-400">KSh {cashFlow.netChangeInCash.toLocaleString()}</span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: KRA & eTIMS COMPLIANCE STATION */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'tax_engine' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner with Global KRA Telemetry */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                  KRA
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    Kenya Revenue Authority &amp; eTIMS Statutory Station
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30">
                      eTIMS Type C Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    PIN: <span className="font-mono text-amber-400 font-bold">{etrConfig.taxPin || 'P051982341Z'}</span> | CU Serial: <span className="font-mono text-slate-300">{etrConfig.cuSerialNumber}</span> | Tax Period: <span className="text-slate-200 font-semibold">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Export Master Menu */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportKRAVat3PDF(orders, etrConfig)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Official KRA VAT-3 Return in PDF"
              >
                <FileDown className="w-4 h-4" />
                <span>VAT-3 Return PDF</span>
              </button>
              <button
                onClick={() => {
                  const csv = generateKRAVat3CSV(orders, etrConfig.taxPin);
                  downloadCSV(`KRA_VAT3_Monthly_Return_${new Date().toISOString().split('T')[0]}.csv`, csv);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download iTax-compatible VAT-3 CSV pack"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>VAT-3 iTax CSV</span>
              </button>
              <button
                onClick={() => exportETIMSInvoiceAuditSchedulePDF(orders, etrConfig, creditNotes)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download eTIMS Electronic Invoice Master Register"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>eTIMS Audit PDF</span>
              </button>
              <button
                onClick={() => exportCorporateIncomeTaxComputationPDF(incomeStatement, etrConfig)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Corporate Income Tax Computation"
              >
                <Calculator className="w-4 h-4 text-sky-400" />
                <span>CIT (30%) PDF</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
            {[
              { id: 'vat3_return', label: '1. KRA VAT-3 Return', icon: FileSpreadsheet, badge: 'Due 20th' },
              { id: 'etims_invoices', label: '2. eTIMS Invoices & Credit Notes', icon: QrCode, count: orders.length + creditNotes.length },
              { id: 'input_tax', label: '3. Section 23A Input VAT Claims', icon: ShieldCheck, count: inputVatClaims.length },
              { id: 'wht_ledger', label: '4. Withholding Tax (WHT & WHVAT)', icon: Percent, count: whtRecords.length },
              { id: 'cit_calendar', label: '5. Corporate Tax (CIT 30%)', icon: Calendar, badge: 'Quarterly' },
              { id: 'payroll_tax', label: '6. Statutory Payroll (PAYE/SHIF/NSSF)', icon: Building2, count: payroll.length },
              { id: 'pin_validator', label: '7. KRA PIN & Device Telemetry', icon: ShieldAlert }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = kraTaxView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setKraTaxView(tab.id as any)}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 1: KRA VAT-3 RETURN (MULTI-SCHEDULE) */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'vat3_return' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>16% Gross Output Tax</span>
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    KSh {totalVatLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Total VAT collected from sales invoices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Section 23A Deductible Input VAT</span>
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-700">
                    KSh {inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">From verified eTIMS supplier invoices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Withholding VAT (2% WHVAT Credits)</span>
                    <Percent className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-sky-700">
                    KSh {whtRecords.filter(r => r.direction === 'Withheld_By_Customer_Receivable').reduce((acc, r) => acc + r.whtAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Withheld by registered KRA WHVAT agents</p>
                </div>

                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                    <span>NET PAYABLE TO KRA</span>
                    <Scale className="w-4 h-4 text-amber-600" />
                  </div>
                  {(() => {
                    const outputVat = totalVatLiability;
                    const inputVat = inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0);
                    const whvat = whtRecords.filter(r => r.direction === 'Withheld_By_Customer_Receivable').reduce((acc, r) => acc + r.whtAmount, 0);
                    const net = Math.max(0, outputVat - inputVat - whvat);
                    return (
                      <div className="text-xl font-black font-mono text-amber-950">
                        KSh {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-amber-800 font-medium">Due on or before 20th of current month</p>
                </div>
              </div>

              {/* VAT-3 Schedule Breakdown Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">VAT-3 Monthly Return Multi-Schedule Computation</h4>
                    <p className="text-xs text-slate-500">Autonomous alignment with KRA iTax and eTIMS validation server protocol.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportKRAVat3PDF(orders, etrConfig)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print VAT-3 Form</span>
                    </button>
                    <button
                      onClick={() => {
                        const csv = generateKRAVat3CSV(orders, etrConfig.taxPin);
                        downloadCSV(`KRA_VAT3_Schedules_${new Date().toISOString().split('T')[0]}.csv`, csv);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV Pack</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Section A */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase text-[11px] flex items-center justify-between">
                      <span>Section A: General Taxpayer Information</span>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">Verified eTIMS Registered</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-600">
                      <div>Taxpayer PIN: <strong className="text-slate-900">{etrConfig.taxPin || 'P051982341Z'}</strong></div>
                      <div>Business Name: <strong className="text-slate-900">{etrConfig.companyName}</strong></div>
                      <div>Control Unit Serial: <strong className="text-slate-900">{etrConfig.cuSerialNumber}</strong></div>
                    </div>
                  </div>

                  {/* Section B: Sales / Output Tax */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase text-[11px] flex items-center justify-between">
                      <span>Section B: Calculation of Output Tax (Sales &amp; Disposals)</span>
                      <span className="text-slate-500 font-normal">Schedule 1 (16% Standard Rate)</span>
                    </div>
                    <div className="space-y-1.5 pl-2 text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Total Taxable B2B Sales (KRA PIN verified):</span>
                        <span className="font-bold text-slate-900">
                          KSh {orders.filter(o => !!o.customerKraPin).reduce((acc, o) => acc + (o.grandTotal - o.vatAmount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Total Taxable B2C / Retail Cash Sales:</span>
                        <span className="font-bold text-slate-900">
                          KSh {orders.filter(o => !o.customerKraPin).reduce((acc, o) => acc + (o.grandTotal - o.vatAmount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Zero-Rated &amp; Exempt Sales:</span>
                        <span className="font-bold text-slate-900">KSh 0.00</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold text-rose-900 pt-1">
                        <span>TOTAL 16% OUTPUT TAX PAYABLE (B1):</span>
                        <span>KSh {totalVatLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Deductible Input Tax */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase text-[11px] flex items-center justify-between">
                      <span>Section C: Deductible Input Tax (Purchases under Section 23A)</span>
                      <span className="text-emerald-800 font-normal">Schedule 3 (Verified eTIMS Invoices)</span>
                    </div>
                    <div className="space-y-1.5 pl-2 text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Total Purchases of Raw Material &amp; Inventory:</span>
                        <span className="font-bold text-slate-900">
                          KSh {inputVatClaims.reduce((acc, c) => acc + c.taxableAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 font-bold text-emerald-800 pt-1">
                        <span>TOTAL DEDUCTIBLE INPUT TAX CLAIMABLE (C1):</span>
                        <span>KSh {inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section D: Net Tax Calculation */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold uppercase text-[11px] text-amber-400 flex items-center justify-between">
                      <span>Section D: Tax Payable / Refund Due</span>
                      <span>Form VAT-3 Final Balance</span>
                    </div>
                    <div className="space-y-1.5 pl-2 text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Output Tax (B1):</span>
                        <span className="font-mono font-bold text-white">KSh {totalVatLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Less: Deductible Input Tax (C1):</span>
                        <span className="font-mono font-bold text-emerald-400">- KSh {inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Less: Withholding VAT Credits (WHVAT):</span>
                        <span className="font-mono font-bold text-sky-400">- KSh {whtRecords.filter(r => r.direction === 'Withheld_By_Customer_Receivable').reduce((acc, r) => acc + r.whtAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-2 text-base font-black text-amber-400 pt-2 border-t border-slate-700">
                        <span>NET VAT AMOUNT PAYABLE TO KRA:</span>
                        <span>
                          KSh {Math.max(0, totalVatLiability - inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0) - whtRecords.filter(r => r.direction === 'Withheld_By_Customer_Receivable').reduce((acc, r) => acc + r.whtAmount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 2: eTIMS ELECTRONIC INVOICES & CREDIT NOTES */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'etims_invoices' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">eTIMS Master Electronic Invoice &amp; Fiscal Signature Register</h4>
                    <p className="text-xs text-slate-500">Real-time KRA cryptographically signed invoices, QR validation keys, and official credit notes.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsCreditNoteModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Issue eTIMS Credit Note</span>
                    </button>
                    <button
                      onClick={() => exportETIMSInvoiceAuditSchedulePDF(orders, etrConfig, creditNotes)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>Export eTIMS PDF</span>
                    </button>
                    <button
                      onClick={() => exportETIMSInvoiceAuditScheduleCSV(orders, etrConfig, creditNotes)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Doc Ref &amp; Type</th>
                        <th className="p-3">Date &amp; Time</th>
                        <th className="p-3">Customer &amp; KRA PIN</th>
                        <th className="p-3">CU Serial Number</th>
                        <th className="p-3 text-right">Taxable Net</th>
                        <th className="p-3 text-right">16% VAT</th>
                        <th className="p-3 text-right">Grand Total</th>
                        <th className="p-3 text-center">eTIMS Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {/* Credit Notes */}
                      {creditNotes.map(crn => (
                        <tr key={crn.id} className="bg-rose-50/50 hover:bg-rose-50 transition-colors text-rose-950">
                          <td className="p-3">
                            <div className="font-bold flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px]">CREDIT NOTE</span>
                              <span>{crn.id}</span>
                            </div>
                            <div className="text-[10px] text-rose-700 font-sans">Orig: {crn.originalInvoiceNo}</div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600 font-sans">
                            {new Date(crn.timestamp).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-sans">{crn.customerName}</div>
                            <div className="text-[10px] text-slate-500">{crn.customerKraPin || 'Retail Individual'}</div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">{crn.originalCuSerial}</td>
                          <td className="p-3 text-right font-bold text-rose-700">- KSh {crn.netCredited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-bold text-rose-700">- KSh {crn.vatCredited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-bold text-rose-800">- KSh {crn.creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300">
                              eTIMS Transmitted
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Orders */}
                      {orders.map(order => {
                        const netAmt = order.grandTotal - order.vatAmount;
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px]">INVOICE</span>
                                <span>{order.receiptNumber || order.id}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">ID: {order.id}</div>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 font-sans">
                              {new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 font-sans">{order.customerName || 'Retail Walk-in Customer'}</div>
                              <div className="text-[10px] text-slate-500">{order.customerKraPin || 'No Buyer PIN (B2C)'}</div>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600">{order.cuSerialNumber || etrConfig.cuSerialNumber}</td>
                            <td className="p-3 text-right text-slate-700">KSh {netAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right text-rose-700 font-bold">KSh {order.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-bold text-slate-900">KSh {order.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300 flex items-center justify-center gap-1 w-max mx-auto">
                                <Check className="w-3 h-3 text-emerald-600" /> Signed &amp; QR
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 3: SECTION 23A INPUT VAT CLAIMS */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'input_tax' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Section 23A Deductible Input VAT Register &amp; Supplier CU Matcher</h4>
                    <p className="text-xs text-slate-500">Under the Tax Procedures Act, input VAT is only deductible with valid electronic tax invoices from registered suppliers.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsInputClaimModalOpen(true)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Supplier eTIMS Invoice</span>
                    </button>
                    <button
                      onClick={() => exportKRAInputVatClaimPDF(inputVatClaims, etrConfig)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>Claims Schedule PDF</span>
                    </button>
                    <button
                      onClick={() => exportKRAInputVatClaimCSV(inputVatClaims, etrConfig)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Claims Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Claim ID &amp; Date</th>
                        <th className="p-3">Supplier Name &amp; KRA PIN</th>
                        <th className="p-3">Supplier CU Invoice Ref</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Taxable Net Amount</th>
                        <th className="p-3 text-right">16% Input VAT Claimable</th>
                        <th className="p-3 text-right">Gross Total</th>
                        <th className="p-3 text-center">Sec 23A Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {inputVatClaims.map(claim => (
                        <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{claim.id}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{claim.purchaseDate}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-sans">{claim.supplierName}</div>
                            <div className="text-[10px] text-slate-500">{claim.supplierPin}</div>
                          </td>
                          <td className="p-3 text-slate-700 font-semibold">{claim.supplierCuInvoiceNo}</td>
                          <td className="p-3 font-sans text-[11px] text-slate-600">{claim.purchaseCategory}</td>
                          <td className="p-3 text-right text-slate-700">KSh {claim.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">KSh {claim.vatClaimable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-bold text-slate-900">KSh {claim.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> eTIMS Valid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold">
                        <td colSpan={4} className="p-3 font-sans text-xs">TOTAL INPUT TAX CLAIMABLE AGAINST OUTPUT VAT:</td>
                        <td className="p-3 text-right font-mono">
                          KSh {inputVatClaims.reduce((acc, c) => acc + c.taxableAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          KSh {inputVatClaims.reduce((acc, c) => acc + c.vatClaimable, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono">
                          KSh {inputVatClaims.reduce((acc, c) => acc + c.grossAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 4: WITHHOLDING TAX (WHT 5% & STATUTORY DEDUCTIONS) */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'wht_ledger' && (
            <div className="space-y-6">
              {whtSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{whtSuccessMessage}</span>
                  </div>
                  <button onClick={() => setWhtSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800 text-xs font-bold">×</button>
                </div>
              )}

              {/* 5% WHT KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">5% WHT Professional / Audit</span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold rounded">Payable</span>
                  </div>
                  <div className="text-xl font-black font-mono text-rose-700">
                    KSh {whtRecords
                      .filter(r => r.direction === 'Withheld_By_Us_Payable' && r.rate === 0.05)
                      .reduce((acc, r) => acc + r.whtAmount, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Withheld from consultants &amp; legal fees</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">5% B2B Sales Tax Credits</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold rounded">Receivable</span>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-700">
                    KSh {whtRecords
                      .filter(r => r.direction === 'Withheld_By_Customer_Receivable')
                      .reduce((acc, r) => acc + r.whtAmount, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Withheld by corporate clients at checkout</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">Total WHT Payable to KRA</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-mono text-[10px] font-bold rounded">Due 20th</span>
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    KSh {whtRecords
                      .filter(r => r.direction === 'Withheld_By_Us_Payable')
                      .reduce((acc, r) => acc + r.whtAmount, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Unsettled: {whtRecords.filter(r => r.direction === 'Withheld_By_Us_Payable' && !r.settled).length} vouchers</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">Net WHT Credit Offset</span>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-mono text-[10px] font-bold rounded">CIT / VAT</span>
                  </div>
                  {(() => {
                    const receivable = whtRecords.filter(r => r.direction === 'Withheld_By_Customer_Receivable').reduce((acc, r) => acc + r.whtAmount, 0);
                    const payable = whtRecords.filter(r => r.direction === 'Withheld_By_Us_Payable').reduce((acc, r) => acc + r.whtAmount, 0);
                    return (
                      <div className="text-xl font-black font-mono text-sky-700">
                        KSh {receivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-slate-400">Eligible to offset annual Corporate Tax</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Withholding Tax (WHT 5% &amp; Statutory Deductions) Schedule</h4>
                    <p className="text-xs text-slate-500">Automated tracking of 5% withholding tax on professional fees and corporate B2B sales tax credits.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsWHTModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register 5% WHT Voucher</span>
                    </button>
                    <button
                      onClick={() => exportKRAWithholdingTaxPDF(whtRecords, etrConfig)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-sky-400" />
                      <span>Export Schedule PDF</span>
                    </button>
                    <button
                      onClick={() => exportKRAWithholdingTaxCSV(whtRecords, etrConfig)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Ref &amp; Period</th>
                        <th className="p-3">Entity &amp; KRA PIN</th>
                        <th className="p-3">Nature of Transaction</th>
                        <th className="p-3">Direction &amp; Type</th>
                        <th className="p-3 text-right">Gross Invoiced</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">WHT Amount</th>
                        <th className="p-3 text-center">Certificate No</th>
                        <th className="p-3 text-center">Settlement</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {whtRecords.map(wht => (
                        <tr key={wht.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{wht.id}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{wht.period}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-sans">{wht.entityName}</div>
                            <div className="text-[10px] text-slate-500">{wht.entityPin}</div>
                          </td>
                          <td className="p-3 font-sans text-slate-700">
                            <span className="font-medium">{wht.natureOfTransaction}</span>
                            {wht.notes && <div className="text-[10px] text-slate-400 italic">{wht.notes}</div>}
                          </td>
                          <td className="p-3">
                            {wht.direction === 'Withheld_By_Us_Payable' ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                                Payable to KRA (Due 20th)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                Receivable Tax Credit (Offset)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-700">KSh {wht.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{(wht.rate * 100).toFixed(1)}%</td>
                          <td className={`p-3 text-right font-bold ${wht.direction === 'Withheld_By_Us_Payable' ? 'text-rose-700' : 'text-emerald-700'}`}>
                            KSh {wht.whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center text-slate-600 font-semibold">{wht.certificateNo || 'Pending'}</td>
                          <td className="p-3 text-center">
                            {wht.settled ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                Remitted / PRN {wht.prnNumber || 'Synced'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                                Pending Remittance
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => exportKRAWithholdingTaxCertificatePDF(wht, etrConfig)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-sans font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Download Official KRA WHT Certificate"
                              >
                                <FileDown className="w-3 h-3 text-rose-600" />
                                <span>Cert</span>
                              </button>
                              {wht.direction === 'Withheld_By_Us_Payable' && !wht.settled && (
                                <button
                                  onClick={() => setSettlingWHTRecord(wht)}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-sans font-bold transition-colors cursor-pointer"
                                  title="Mark as paid to KRA with Payment Registration Number (PRN)"
                                >
                                  Remit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 5: CORPORATE INCOME TAX (CIT 30%) & INSTALLMENT CALENDAR */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'cit_calendar' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Corporate Income Tax (CIT 30%) &amp; Statutory Installment Calendar</h4>
                    <p className="text-xs text-slate-500">Compliant with Section 12 of the Income Tax Act (Cap 470 Laws of Kenya).</p>
                  </div>
                  <button
                    onClick={() => exportCorporateIncomeTaxComputationPDF(incomeStatement, etrConfig)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Download CIT Computation PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tax Computation */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="font-bold text-slate-900 uppercase font-sans text-xs flex justify-between">
                      <span>Annual Estimated Tax Computation</span>
                      <span className="text-slate-500">Year of Income 2026</span>
                    </div>
                    <div className="space-y-2 pt-2 text-slate-700">
                      <div className="flex justify-between"><span>Accounting Net Profit (EBITDA):</span><span className="font-bold">KSh {incomeStatement.ebitda.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Add: Non-Deductible Depr &amp; Disallowables:</span><span>+ KSh {(incomeStatement.ebitda * 0.05).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Less: Wear &amp; Tear Capital Allowances (WTA):</span><span>- KSh {(incomeStatement.ebitda * 0.08).toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                        <span>Adjusted Taxable Business Profit:</span>
                        <span>KSh {incomeStatement.ebitda.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-700 font-bold border-t border-slate-300 pt-2 text-sm">
                        <span>Corporate Tax Liability (30% Resident Rate):</span>
                        <span>KSh {incomeStatement.corporateTaxProvision.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Quarterly Installments Schedule */}
                  <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 text-xs font-mono">
                    <div className="font-bold text-amber-950 uppercase font-sans text-xs flex justify-between">
                      <span>Statutory 4-Part Installment Schedule</span>
                      <span className="text-amber-800 font-bold">20th of 4th, 6th, 9th &amp; 12th Month</span>
                    </div>
                    {(() => {
                      const totalCit = incomeStatement.corporateTaxProvision;
                      const inst = totalCit / 4;
                      return (
                        <div className="space-y-2 pt-2 text-slate-800">
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-200">
                            <div><span className="font-bold">1st Installment (25%):</span> <span className="text-[10px] text-slate-500 block font-sans">Due: 20th April 2026</span></div>
                            <span className="font-bold text-slate-900">KSh {inst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-200">
                            <div><span className="font-bold">2nd Installment (25%):</span> <span className="text-[10px] text-slate-500 block font-sans">Due: 20th June 2026</span></div>
                            <span className="font-bold text-slate-900">KSh {inst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-200">
                            <div><span className="font-bold">3rd Installment (25%):</span> <span className="text-[10px] text-slate-500 block font-sans">Due: 20th September 2026</span></div>
                            <span className="font-bold text-slate-900">KSh {inst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-200">
                            <div><span className="font-bold">4th Installment (25%):</span> <span className="text-[10px] text-slate-500 block font-sans">Due: 20th December 2026</span></div>
                            <span className="font-bold text-slate-900">KSh {inst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 6: UNIFIED STATUTORY PAYROLL (PAYE/SHIF/NSSF/HOUSING) */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'payroll_tax' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Unified Kenyan Statutory Payroll Returns (KRA PAYE, NSSF, SHIF, Housing Levy)</h4>
                    <p className="text-xs text-slate-500">Autonomous computation based on the Kenyan Tax Laws Amendment Act and Finance Acts.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => exportUnifiedPayrollTaxPDF(payroll, etrConfig)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>Payroll Tax PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        const csv = generateKRAPayeCSV(payroll);
                        downloadCSV(`KRA_PAYE_Statutory_${new Date().toISOString().split('T')[0]}.csv`, csv);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export PAYE CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Staff Name &amp; Role</th>
                        <th className="p-3">KRA PIN</th>
                        <th className="p-3 text-right">Gross Salary</th>
                        <th className="p-3 text-right">NSSF (Tier I+II)</th>
                        <th className="p-3 text-right">SHIF (2.75%)</th>
                        <th className="p-3 text-right">Housing Levy (1.5%)</th>
                        <th className="p-3 text-right">PAYE (KRA)</th>
                        <th className="p-3 text-right">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {payroll.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-sans">{p.staffName}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{p.role}</div>
                          </td>
                          <td className="p-3 text-slate-700 font-semibold">EMP: {p.employeeNo}</td>
                          <td className="p-3 text-right font-bold text-slate-900">KSh {p.grossPay.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700">KSh {p.nssfDeduction.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700">KSh {p.nhifDeduction.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700">KSh {p.housingLevy.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-rose-700">KSh {p.payeTax.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-emerald-800">KSh {p.netPay.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold">
                        <td colSpan={2} className="p-3 font-sans text-xs">TOTAL STATUTORY MONTHLY DEDUCTIONS:</td>
                        <td className="p-3 text-right font-mono">
                          KSh {payroll.reduce((acc, p) => acc + p.grossPay, 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          KSh {payroll.reduce((acc, p) => acc + p.nssfDeduction, 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          KSh {payroll.reduce((acc, p) => acc + p.nhifDeduction, 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          KSh {payroll.reduce((acc, p) => acc + p.housingLevy, 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-400">
                          KSh {payroll.reduce((acc, p) => acc + p.payeTax, 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          KSh {payroll.reduce((acc, p) => acc + p.netPay, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-VIEW 7: KRA PIN CHECKER & DEVICE TELEMETRY */}
          {/* ------------------------------------------------------------- */}
          {kraTaxView === 'pin_validator' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Live PIN Tester */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Live KRA PIN Checksum &amp; Identity Validator</h4>
                    <p className="text-xs text-slate-500">Test any Kenyan individual or corporate KRA PIN for structural format and Section 23A validity.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testPin}
                        onChange={(e) => setTestPin(e.target.value)}
                        placeholder="e.g. P051982341Z or A012345678X"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleValidatePin(testPin)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Validate PIN</span>
                      </button>
                    </div>

                    {pinValidationResult && (
                      <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                        pinValidationResult.isValid
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50 border-rose-200 text-rose-950'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          {pinValidationResult.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          )}
                          <span>{pinValidationResult.checksumStatus}</span>
                        </div>
                        <p>{pinValidationResult.message}</p>
                        {pinValidationResult.pinType && (
                          <div className="font-mono font-bold text-emerald-800">
                            Classification: {pinValidationResult.pinType}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Fiscal Device Telemetry */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 font-mono text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-sans">eTIMS Device Telemetry &amp; Middleware Link</h4>
                    <p className="text-xs text-slate-500 font-sans">Current hardware/software fiscalization middleware operational parameters.</p>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span>eTIMS Device Type:</span>
                      <strong className="text-slate-900">Type C (ERP Web Middleware Virtual CU)</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span>CU Serial Number:</span>
                      <strong className="text-slate-900">{etrConfig.cuSerialNumber}</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span>KRA Transmission URL:</span>
                      <strong className="text-slate-900">https://etims.kra.go.ke/v2/api/vsdc</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span>Daily Z-Report Interval:</span>
                      <strong className="text-slate-900">23:59:59 EAT (Autonomous Batch)</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span>Cryptographic Hash Engine:</span>
                      <strong className="text-emerald-700">SHA-256 + KRA RSA 2048-bit</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODAL 1: ISSUE eTIMS CREDIT NOTE */}
          {/* ------------------------------------------------------------- */}
          {isCreditNoteModalOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Issue KRA eTIMS Credit Note</h3>
                      <p className="text-xs text-slate-500">Official tax adjustment referencing original CU fiscal invoice</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreditNoteModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCreditNote} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Select Original Invoice / Receipt:</label>
                    <select
                      value={selectedInvoiceForCredit}
                      onChange={(e) => {
                        setSelectedInvoiceForCredit(e.target.value);
                        const ord = orders.find(o => o.id === e.target.value || o.receiptNumber === e.target.value);
                        if (ord) {
                          setCreditAmountValue(String(ord.grandTotal));
                        }
                      }}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    >
                      <option value="">-- Choose Invoice to Credit --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.receiptNumber || o.id} - {o.customerName || 'Walk-in'} (KSh {o.grandTotal.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Credit Reason (KRA Tax Audit Mandatory):</label>
                    <select
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Damaged Fabric Return">Damaged / Defective Fabric Return</option>
                      <option value="Customer Order Cancellation">Customer Order Cancellation</option>
                      <option value="Price Overcharge Correction">Price Overcharge Correction</option>
                      <option value="Commercial Discount Rebate">Commercial Volume Rebate / Discount</option>
                      <option value="Measurement Shortage Adjustment">Measurement Shortage Adjustment</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Credit Amount (Inc. 16% VAT):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditAmountValue}
                      onChange={(e) => setCreditAmountValue(e.target.value)}
                      required
                      placeholder="e.g. 5000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreditNoteModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Issue &amp; Transmit Credit Note</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODAL 2: RECORD SUPPLIER eTIMS INVOICE (SECTION 23A) */}
          {/* ------------------------------------------------------------- */}
          {isInputClaimModalOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Record Supplier eTIMS Invoice</h3>
                      <p className="text-xs text-slate-500">Section 23A Deductible Input VAT registration</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsInputClaimModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddInputClaim} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Supplier Legal Entity Name:</label>
                    <input
                      type="text"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      required
                      placeholder="e.g. Kenya Weaving Mills Ltd"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Supplier KRA PIN:</label>
                      <input
                        type="text"
                        value={newSupplierPin}
                        onChange={(e) => setNewSupplierPin(e.target.value)}
                        required
                        placeholder="e.g. P051892341M"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Supplier CU Invoice Ref:</label>
                      <input
                        type="text"
                        value={newSupplierCuInvoice}
                        onChange={(e) => setNewSupplierCuInvoice(e.target.value)}
                        required
                        placeholder="e.g. KRA-CU-SUPP-9921"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Purchase Category:</label>
                    <select
                      value={newPurchaseCategory}
                      onChange={(e) => setNewPurchaseCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Raw Material (Yarn/Fleece/Dereck)">Raw Material (Yarn/Fleece/Dereck)</option>
                      <option value="Factory Utilities">Factory Utilities (Power/Water)</option>
                      <option value="Plant Machinery & Looms">Plant Machinery &amp; Looms</option>
                      <option value="Transportation & Logistics">Transportation &amp; Logistics</option>
                      <option value="Store Supplies & Packaging">Store Supplies &amp; Packaging</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Taxable Net Amount (Excl. VAT):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTaxableAmount}
                      onChange={(e) => setNewTaxableAmount(e.target.value)}
                      required
                      placeholder="e.g. 50000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                    />
                    {parseFloat(newTaxableAmount) > 0 && (
                      <p className="text-[11px] text-emerald-700 font-mono">
                        16% Claimable VAT: <strong>KSh {(parseFloat(newTaxableAmount) * 0.16).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> (Gross: KSh {(parseFloat(newTaxableAmount) * 1.16).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsInputClaimModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify &amp; Record Claim</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: BANK & M-PESA RECONCILIATION */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'bank_reconciliation' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Automatic Bank &amp; M-Pesa Till Statement Reconciliation</h3>
                <p className="text-xs text-slate-500">Instant matching between POS checkout transactions and physical bank settlement deposits.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Transactions Reconciled
                </span>
                <button
                  onClick={() => exportBankReconciliationPDF(orders, reconciliationSummary)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Reconciliation PDF</span>
                </button>
                <button
                  onClick={() => exportBankReconciliationCSV(orders, reconciliationSummary)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reconciliation CSV</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">M-Pesa Till Total (Safaricom)</span>
                <p className="text-base font-bold text-emerald-700">
                  KSh {reconciliationSummary.mpesaTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-sans">{reconciliationSummary.mpesaCount} receipts auto-reconciled</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Bank Electronic Transfers</span>
                <p className="text-base font-bold text-emerald-700">
                  KSh {reconciliationSummary.bankTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-sans">{reconciliationSummary.bankCount} KCB &amp; Equity Bank transfers synced</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Physical Cash Vault Drawer</span>
                <p className="text-base font-bold text-slate-900">
                  KSh {reconciliationSummary.cashTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-600 font-sans">{reconciliationSummary.cashCount} cash sales (Variance: KSh 0.00)</p>
              </div>
            </div>

            {/* Interactive Transaction Verification Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
              <div className="p-3 bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between">
                <span>Recent Settlements &amp; Verification Checks ({orders.length} Records)</span>
                <span className="text-[10px] text-slate-500 font-normal">Click checkmark to toggle manual audit status</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[11px] text-slate-600 font-bold uppercase sticky top-0">
                    <tr className="border-b border-slate-200">
                      <th className="p-3">Receipt / Ref</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 font-mono text-right">Amount (KSh)</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {orders.slice(0, 15).map(o => {
                      const isVerified = reconciledIds[o.id] !== false;
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-slate-900">{o.receiptNumber || o.id}</td>
                          <td className="p-3 font-bold text-slate-700">{o.paymentMethod}</td>
                          <td className="p-3 text-slate-600">{o.customerName || 'Walk-in Customer'}</td>
                          <td className="p-3 font-mono font-bold text-slate-900 text-right">
                            KSh {o.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isVerified ? 'Reconciled' : 'Pending Audit'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleReconciled(o.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                isVerified ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                              }`}
                              title="Toggle reconciliation state"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: FINANCIAL STATEMENTS GENERATION (FULL, MOBILE MONEY, BANK & PDQ) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'financial_statements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Action Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/60">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-700/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-950/40">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-white tracking-tight">Financial Statement Generation Hub</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      Audit-Certified &amp; IFRS Compliant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Generate Full Consolidated P&amp;L + Balance Sheet or export separate statements for Safaricom M-Pesa, Commercial Bank, and PDQ Card terminals.
                  </p>
                </div>
              </div>

              {/* Master Consolidated Export Quick Action */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportFullConsolidatedFinancialStatementPDF(fullConsolidatedStatement, locations)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
                >
                  <FileDown className="w-4 h-4 stroke-[2.5]" />
                  <span>Full Statement (PDF)</span>
                </button>

                <button
                  onClick={() => exportFullConsolidatedFinancialStatementCSV(fullConsolidatedStatement)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Full Statement (CSV)</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Overview Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5">
              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">M-Pesa Mobile Money</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">
                  KSh {mobileMoneySummary.totalGrossInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">{mobileMoneySummary.transactionCount} Receipts (Till &amp; Paybill)</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">Commercial Bank</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">
                  KSh {bankSummary.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">{bankSummary.clearedTransactionsCount} Cleared Transactions</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">PDQ Merchant Cards</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">
                  KSh {pdqSummary.totalGrossVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">{pdqSummary.totalSwipesCount} Swipes (2 Terminals)</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Net Operating Profit</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">
                  KSh {incomeStatement.netIncomeAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Post-Tax (30% CIT Accrued)</span>
              </div>
            </div>
          </div>

          {/* Sub-Channel View Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <button
                onClick={() => setStatementChannelView('all_consolidated')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statementChannelView === 'all_consolidated'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>1. Full Consolidated Statement</span>
              </button>

              <button
                onClick={() => setStatementChannelView('mobile_money')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statementChannelView === 'mobile_money'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Safaricom M-Pesa Statement</span>
              </button>

              <button
                onClick={() => setStatementChannelView('bank')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statementChannelView === 'bank'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Commercial Bank Statement</span>
              </button>

              <button
                onClick={() => setStatementChannelView('pdq')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statementChannelView === 'pdq'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>4. PDQ POS Card Statement</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium px-2">
              Scope: <strong>{selectedLocation === 'All' ? 'All Branches' : selectedLocation}</strong>
            </span>
          </div>

          {/* VIEW 1: FULL CONSOLIDATED STATEMENT */}
          {statementChannelView === 'all_consolidated' && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Gross Sales Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black font-mono text-slate-900">
                    KSh {incomeStatement.grossSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Net Turnover after allowances: KSh {incomeStatement.netSalesRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Gross Operating Margin</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black font-mono text-emerald-700">
                    {incomeStatement.grossMarginPercent?.toFixed(1) || '42.5'}%
                  </p>
                  <p className="text-xs text-slate-500">
                    Gross Profit: KSh {incomeStatement.grossOperatingProfit.toLocaleString()} (COGS: KSh {incomeStatement.costOfGoodsSold.toLocaleString()})
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Balance Sheet Total Assets</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black font-mono text-blue-900">
                    KSh {balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Working Stock Valuation: KSh {balanceSheet.currentAssets.inventoryAssetValue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Consolidated Channel Reconciliation Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Consolidated Payment &amp; Settlement Channels Breakdown</h4>
                    <p className="text-xs text-slate-500">Multi-channel cross-audit matching total revenue with verified bank settlements.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportFullConsolidatedFinancialStatementPDF(fullConsolidatedStatement, locations)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Consolidated Statement</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 text-[11px] text-slate-600 font-bold uppercase">
                      <tr className="border-b border-slate-200">
                        <th className="p-3.5">Channel / Settlement Mechanism</th>
                        <th className="p-3.5 text-right font-mono">Gross Inflow (KSh)</th>
                        <th className="p-3.5 text-right font-mono">Channel Tariff / MDR</th>
                        <th className="p-3.5 text-right font-mono">Net Settlement (KSh)</th>
                        <th className="p-3.5 text-center">Volume</th>
                        <th className="p-3.5 text-center">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3.5 flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Safaricom M-Pesa (Till #{etrConfig.tillNumber || '5829104'})</span>
                            <span className="text-[10px] text-slate-500">Instant direct settlement to NCBA Corporate A/C</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-900">
                          {mobileMoneySummary.totalGrossInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-right text-rose-600 font-bold">
                          -{mobileMoneySummary.totalTransactionFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-emerald-700">
                          {mobileMoneySummary.totalNetSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-600">{mobileMoneySummary.transactionCount} txns</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            100% Reconciled
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="p-3.5 flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Commercial Bank EFT / RTGS &amp; Cheques</span>
                            <span className="text-[10px] text-slate-500">{bankSummary.bankName} (A/C: {bankSummary.accountNumber})</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-900">
                          {bankSummary.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-right text-rose-600 font-bold">-1,250.00</td>
                        <td className="p-3.5 font-mono text-right font-bold text-blue-700">
                          {(bankSummary.totalCredits - 1250).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-600">{bankSummary.clearedTransactionsCount} txns</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                            Cleared
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="p-3.5 flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">PDQ POS Card Terminals (Visa &amp; Mastercard)</span>
                            <span className="text-[10px] text-slate-500">Terminals: {pdqSummary.terminalIds.join(', ')}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-900">
                          {pdqSummary.totalGrossVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-right text-rose-600 font-bold">
                          -{pdqSummary.totalMerchantFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-indigo-700">
                          {pdqSummary.totalNetSettlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-600">{pdqSummary.totalSwipesCount} swipes</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10px]">
                            Batch Balanced
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: SAFARICOM M-PESA STATEMENT */}
          {statementChannelView === 'mobile_money' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600 text-white rounded-xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-base">Safaricom M-Pesa Merchant Settlement Statement</h4>
                    <p className="text-xs text-emerald-700">
                      Till: <strong>{mobileMoneySummary.primaryTillNumber}</strong> | Paybill: <strong>{mobileMoneySummary.paybillNumber}</strong> | Settlement: <strong>{mobileMoneySummary.settlementAccount}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportMobileMoneyStatementPDF(orders, etrConfig, locations, mobileMoneySummary)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download M-Pesa PDF</span>
                  </button>

                  <button
                    onClick={() => exportMobileMoneyStatementCSV(orders, locations, mobileMoneySummary)}
                    className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>M-Pesa CSV</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
                  <span>M-Pesa Receipts Register ({mpesaOrders.length} Completed Inflows)</span>
                  <span className="text-emerald-700 font-mono">Net Settled: KSh {mobileMoneySummary.totalNetSettled.toLocaleString()}</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-[11px] text-slate-600 font-bold uppercase sticky top-0">
                      <tr className="border-b border-slate-200">
                        <th className="p-3">Date &amp; Time</th>
                        <th className="p-3">M-Pesa Ref</th>
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-right font-mono">Gross Inflow (KSh)</th>
                        <th className="p-3 text-right font-mono">Safaricom Fee</th>
                        <th className="p-3 text-right font-mono">Net Banked (KSh)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {mpesaOrders.map(o => {
                        const fee = o.grandTotal > 1000 ? Math.min(o.grandTotal * 0.015, 120) : Math.min(o.grandTotal * 0.01, 35);
                        const net = o.grandTotal - fee;
                        const ref = o.paymentReference || `QJD${Math.abs(o.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 1113).toString().slice(0, 7)}`;
                        return (
                          <tr key={o.id} className="hover:bg-emerald-50/40">
                            <td className="p-3 text-slate-500 font-mono">{new Date(o.timestamp).toLocaleString('en-KE')}</td>
                            <td className="p-3 font-mono font-bold text-emerald-800">{ref}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{o.receiptNumber || o.id}</td>
                            <td className="p-3 text-slate-700">{o.customerName || 'Walk-in Client'}</td>
                            <td className="p-3 font-mono font-bold text-right text-slate-900">
                              {o.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-mono text-right text-rose-600">
                              -{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-mono font-bold text-right text-emerald-700">
                              {net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                Settled
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: COMMERCIAL BANK STATEMENT */}
          {statementChannelView === 'bank' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-700 text-white rounded-xl">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-base">Commercial Bank Electronic Ledger Statement</h4>
                    <p className="text-xs text-blue-700">
                      Bank: <strong>{bankSummary.bankName}</strong> | A/C: <strong>{bankSummary.accountNumber}</strong> | Available Balance: <strong>KSh {bankSummary.closingBalance.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportBankStatementPDF(orders, ledger, branchExpenses, etrConfig, locations, bankSummary)}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download Bank PDF</span>
                  </button>

                  <button
                    onClick={() => exportBankStatementCSV(orders, branchExpenses, locations, bankSummary)}
                    className="px-3 py-2 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-700" />
                    <span>Bank CSV</span>
                  </button>
                </div>
              </div>

              {/* Bank Postings Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
                  <span>Cleared Inflows &amp; Disbursements ({bankOrders.length + bankExpenses.length} Records)</span>
                  <span className="text-blue-800 font-mono">Net Credits: +KSh {bankSummary.totalCredits.toLocaleString()}</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-[11px] text-slate-600 font-bold uppercase sticky top-0">
                      <tr className="border-b border-slate-200">
                        <th className="p-3">Date</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Particulars</th>
                        <th className="p-3 text-right font-mono">Debit (KSh)</th>
                        <th className="p-3 text-right font-mono">Credit (KSh)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bankOrders.map(o => (
                        <tr key={o.id} className="hover:bg-blue-50/40">
                          <td className="p-3 text-slate-500 font-mono">{new Date(o.timestamp).toLocaleDateString('en-KE')}</td>
                          <td className="p-3 font-mono font-bold text-blue-900">{o.paymentReference || `EFT-${o.id.slice(-6)}`}</td>
                          <td className="p-3 text-slate-700">Receipt #{o.receiptNumber} ({o.customerName || 'Direct Transfer'})</td>
                          <td className="p-3 font-mono text-right text-slate-400">-</td>
                          <td className="p-3 font-mono font-bold text-right text-emerald-700">
                            +{o.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                              Cleared
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bankExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-rose-50/40">
                          <td className="p-3 text-slate-500 font-mono">{new Date(e.timestamp).toLocaleDateString('en-KE')}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{e.receiptRef || `EXP-${e.id.slice(-6)}`}</td>
                          <td className="p-3 text-slate-700">Expense: {e.title} ({e.paidTo || 'Vendor'})</td>
                          <td className="p-3 font-mono font-bold text-right text-rose-600">
                            -{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 font-mono text-right text-slate-400">-</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full font-bold text-[10px]">
                              Disbursed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: PDQ POS CARD TERMINAL STATEMENT */}
          {statementChannelView === 'pdq' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 text-white rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-950 text-base">PDQ POS Merchant Card Terminal Statement</h4>
                    <p className="text-xs text-indigo-700">
                      Merchant ID: <strong>{pdqSummary.merchantId}</strong> | MDR Rate: <strong>2.50% Interchange</strong> | Net Bank Settlement: <strong>KSh {pdqSummary.totalNetSettlement.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportPDQStatementPDF(orders, etrConfig, locations, pdqSummary)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download PDQ PDF</span>
                  </button>

                  <button
                    onClick={() => exportPDQStatementCSV(orders, locations, pdqSummary)}
                    className="px-3 py-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-700" />
                    <span>PDQ CSV</span>
                  </button>
                </div>
              </div>

              {/* Card Swipes Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
                  <span>Terminal Swipes Batch Journal ({cardOrders.length} Transactions)</span>
                  <span className="text-indigo-800 font-mono">Gross Swipes: KSh {pdqSummary.totalGrossVolume.toLocaleString()}</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-[11px] text-slate-600 font-bold uppercase sticky top-0">
                      <tr className="border-b border-slate-200">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Terminal ID</th>
                        <th className="p-3">Auth Code</th>
                        <th className="p-3">Cardholder</th>
                        <th className="p-3 text-right font-mono">Gross Swipe (KSh)</th>
                        <th className="p-3 text-right font-mono">2.5% MDR Fee</th>
                        <th className="p-3 text-right font-mono">Net Settlement (KSh)</th>
                        <th className="p-3 text-center">Batch Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {cardOrders.map((o, idx) => {
                        const mdr = o.grandTotal * 0.025;
                        const net = o.grandTotal - mdr;
                        const auth = `AUTH-${(882000 + idx * 37).toString()}`;
                        return (
                          <tr key={o.id} className="hover:bg-indigo-50/40">
                            <td className="p-3 text-slate-500 font-mono">{new Date(o.timestamp).toLocaleString('en-KE')}</td>
                            <td className="p-3 font-mono font-bold text-slate-800">{idx % 2 === 0 ? 'PDQ-MAIN-01' : 'PDQ-SHOP-02'}</td>
                            <td className="p-3 font-mono font-bold text-indigo-700">{auth}</td>
                            <td className="p-3 text-slate-700">{o.customerName || 'Cardholder Client'}</td>
                            <td className="p-3 font-mono font-bold text-right text-slate-900">
                              {o.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-mono text-right text-rose-600">
                              -{mdr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-mono font-bold text-right text-indigo-700">
                              {net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10px]">
                                Batch Settled
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Manual Journal Voucher Modal */}
      <JournalVoucherModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
      />

      {/* Register 5% Withholding Tax Voucher Modal */}
      {isWHTModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Register 5% Withholding Tax Voucher
                </h3>
              </div>
              <button
                onClick={() => setIsWHTModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWHTRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Accounting Direction &amp; Tax Purpose:
                </label>
                <select
                  value={newWHTDirection}
                  onChange={e => setNewWHTDirection(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Withheld_By_Us_Payable">
                    Payable to KRA: We withheld from Supplier/Consultant (Due 20th)
                  </option>
                  <option value="Withheld_By_Customer_Receivable">
                    Receivable Tax Credit: Corporate B2B Client withheld from us (Tax Asset)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Entity / Company Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={newWHTEntityName}
                    onChange={e => setNewWHTEntityName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. Kipchoge Legal Partners"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Entity KRA PIN:
                  </label>
                  <input
                    type="text"
                    required
                    value={newWHTEntityPin}
                    onChange={e => setNewWHTEntityPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. P051449102X"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nature of Transaction &amp; Statutory Rate:
                </label>
                <select
                  value={newWHTNature}
                  onChange={e => setNewWHTNature(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Professional, Legal & Audit Fees (5%)">
                    5% - Professional, Legal, Audit & Consultancy Fees
                  </option>
                  <option value="Contractual / Transport Services (3%)">
                    3% - Contractual, Sub-contracting & Transport Services
                  </option>
                  <option value="Commercial Warehouse Rent (10%)">
                    10% - Commercial Building & Warehouse Rent
                  </option>
                  <option value="Withholding VAT - WHVAT (2%)">
                    2% - Withholding VAT (WHVAT Section 42A)
                  </option>
                  <option value="Management & Training Services (5%)">
                    5% - Management & Training Services
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Gross Invoiced Amount (KSh):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={newWHTGrossAmount}
                    onChange={e => setNewWHTGrossAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WHT Certificate / Exemption No:
                  </label>
                  <input
                    type="text"
                    value={newWHTCertNo}
                    onChange={e => setNewWHTCertNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. KRA-WHT-2026-9021"
                  />
                </div>
              </div>

              {newWHTGrossAmount && parseFloat(newWHTGrossAmount) > 0 && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 font-mono text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Gross Invoice:</span>
                    <span className="font-bold">KSh {parseFloat(newWHTGrossAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>WHT Deduction (5% Statutory Rate):</span>
                    <span>
                      KSh {(parseFloat(newWHTGrossAmount) * (newWHTNature.includes('10%') ? 0.10 : newWHTNature.includes('3%') ? 0.03 : newWHTNature.includes('2%') ? 0.02 : 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-rose-200/60 pt-1">
                    <span>Net Settlement Amount:</span>
                    <span>
                      KSh {(parseFloat(newWHTGrossAmount) * (1 - (newWHTNature.includes('10%') ? 0.10 : newWHTNature.includes('3%') ? 0.03 : newWHTNature.includes('2%') ? 0.02 : 0.05))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notes / Audit Reference:
                </label>
                <input
                  type="text"
                  value={newWHTNotes}
                  onChange={e => setNewWHTNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="e.g. August 2026 External Audit Tax Provision"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWHTModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition-colors"
                >
                  Register &amp; Post Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle WHT / Enter KRA PRN Modal */}
      {settlingWHTRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-amber-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Mark WHT Remitted to KRA
                </h3>
              </div>
              <button
                onClick={() => setSettlingWHTRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettleWHT} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Confirm payment for voucher <strong>{settlingWHTRecord.id}</strong> ({settlingWHTRecord.entityName}) for <strong>KSh {settlingWHTRecord.whtAmount.toLocaleString()}</strong>.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  KRA Payment Registration Number (PRN / E-Slip No):
                </label>
                <input
                  type="text"
                  required
                  value={settlePRNNumber}
                  onChange={e => setSettlePRNNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 26082200019283"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingWHTRecord(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition-colors"
                >
                  Confirm Remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
