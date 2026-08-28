export interface ButtonCapability {
  id: string;
  name: string;
  iconName: string;
  module: 'header' | 'pos' | 'inventory' | 'transfers' | 'ledger' | 'settings' | 'branches' | 'hr' | 'audit' | 'general';
  moduleLabel: string;
  locationDescription: string;
  capabilities: string[];
  requiredRole: string;
  proTip?: string;
  shortcut?: string;
}

export const BUTTON_CAPABILITIES: ButtonCapability[] = [
  {
    id: 'btn-fabric-roll-manager',
    name: 'Fabric Roll Manager (Scissors)',
    iconName: 'Scissors',
    module: 'inventory',
    moduleLabel: 'Inventory & Stock',
    locationDescription: 'Inventory Catalog toolbar or product cards (Scissors icon ✂️)',
    capabilities: [
      'Manage individual Fleece and Dereec fabric rolls with exact meter tracking',
      'Batch intake multiple rolls with custom comma-separated meter lengths (e.g. 52.4, 48.0, 63.8)',
      'Record roll cuts for customer orders and track residual roll balances',
      'Print individual 50×30mm thermal barcode stickers for each roll',
      'Mark rolls as Quarantine or Defective with audit trail reasons'
    ],
    requiredRole: 'Admin, Branch Manager, Warehouse Operator',
    proTip: 'Quickly cut and register partial roll balances without affecting other inventory batches.',
    shortcut: 'Alt + R'
  },
  {
    id: 'btn-tare-settings',
    name: 'Tare & Weight Calibration (Scale)',
    iconName: 'Scale',
    module: 'inventory',
    moduleLabel: 'Inventory & Stock',
    locationDescription: 'Inventory Catalog cards & Settings > Product Price Settings (Scale icon ⚖️)',
    capabilities: [
      'Calibrate standard cone core tare (70g) and bale cardboard tare (0.840kg) for yarn',
      'Toggle auto-deduct tare at POS digital scale checkout',
      'Set Gross Mass vs Net Mass formulas per category or individual SKU',
      'Prevent billing customers for packaging weights and plastic spools'
    ],
    requiredRole: 'Admin, Branch Manager, Accountant',
    proTip: 'Set Oster India bale tare once in category settings to apply across all future yarn intakes automatically.',
    shortcut: 'Alt + T'
  },
  {
    id: 'btn-category-intake',
    name: 'Category Rapid Intake / Barcode Gun Intake',
    iconName: 'Boxes',
    module: 'inventory',
    moduleLabel: 'Inventory & Stock',
    locationDescription: 'Inventory Catalog top action bar',
    capabilities: [
      'Scan dozens of fabric rolls or yarn bales in seconds using standard USB barcode guns',
      'Select category mode (Fleece, Dereec, Yarns) with auto-formatted units (Meters / KG)',
      'Adjust meter lengths or kg weights directly inside the manifest table before saving',
      'Auto-generate serial roll numbers and batch barcodes on the fly'
    ],
    requiredRole: 'Admin, Branch Manager, Warehouse Operator',
    proTip: 'Set "Scan Qty" to your standard roll length (e.g. 50m) to auto-fill every scanned roll with one trigger pull.',
    shortcut: 'Alt + I'
  },
  {
    id: 'btn-pos-roll-pricing',
    name: 'Option 1 Hybrid Roll Pricing Calculator',
    iconName: 'Tag',
    module: 'pos',
    moduleLabel: 'POS Terminal & Cart',
    locationDescription: 'POS Terminal cart items (Roll Pricing Tag / Calculator)',
    capabilities: [
      'Automatically calculates whole rolls at discounted wholesale pricing (e.g., KES 440/m for Fleece, KES 220/m for Dereec)',
      'Calculates loose cut remainder meters with percentage discount (e.g., 10% off retail KES 470/m or KES 230/m)',
      'Allows cashiers to preview exact savings and cost breakdown for customer transparency',
      'Supports manual override between All Wholesale, All Retail, or Custom hybrid rates'
    ],
    requiredRole: 'All POS Cashiers, Branch Managers, Admin',
    proTip: 'Option 1 gives customers the best transparent pricing when purchasing 1 full roll plus loose cut meters.',
    shortcut: 'Alt + P'
  },
  {
    id: 'btn-pos-hold-cart',
    name: 'Hold Cart / Multi-Customer Session',
    iconName: 'Clock',
    module: 'pos',
    moduleLabel: 'POS Terminal',
    locationDescription: 'POS Terminal bottom action strip',
    capabilities: [
      'Temporarily suspend the current customer cart with all items, fabric cuts, and discounts intact',
      'Serve another customer in queue without losing ongoing transactions',
      'Recall any held cart anytime from the "Held Carts" drawer with one click',
      'Auto-save customer phone number or name for reference'
    ],
    requiredRole: 'All POS Cashiers, Branch Managers, Admin',
    proTip: 'Useful when a customer steps away to pick additional yarn colors or verify fabric meterage.',
    shortcut: 'Alt + H'
  },
  {
    id: 'btn-close-shift-z-report',
    name: 'Close Shift & Fiscal Z-Report',
    iconName: 'Receipt',
    module: 'pos',
    moduleLabel: 'POS Terminal & Sales',
    locationDescription: 'POS Terminal header & Today Sales view',
    capabilities: [
      'Calculate end-of-shift cash drawer totals, M-Pesa settlements, and card transactions',
      'Reconcile physical cash counted vs expected system revenue with variance detection',
      'Generate official End-of-Day Z-Report and X-Reading audit snapshots',
      'Lock terminal till and prepare float for incoming cashier shift'
    ],
    requiredRole: 'Cashiers, Branch Managers, Accountants, Admin',
    proTip: 'Always compare physical notes in drawer with system cash balance before clicking "Finalize Shift".',
    shortcut: 'Alt + Z'
  },
  {
    id: 'btn-rma-quarantine',
    name: 'RMA / Returns & Defect Quarantine',
    iconName: 'RotateCcw',
    module: 'header',
    moduleLabel: 'Header & Customer Care',
    locationDescription: 'Top right header bar (Rotate RMA icon 🔄)',
    capabilities: [
      'Process customer fabric returns, yarn exchanges, and damaged item claims',
      'Inspect return reasons (e.g. weave flaw, wrong shade, customer over-order)',
      'Quarantine defective rolls to prevent accidental resale at retail branches',
      'Issue store credit vouchers or trigger automatic KRA eTIMS credit notes'
    ],
    requiredRole: 'Branch Managers, Accountants, Admin',
    proTip: 'Quarantined rolls remain isolated in defect inventory until approved for supplier return or write-off.',
    shortcut: 'Alt + M'
  },
  {
    id: 'btn-barcode-qr-studio',
    name: 'Barcode & QR Studio / Thermal Roll Printer',
    iconName: 'Barcode',
    module: 'settings',
    moduleLabel: 'Settings & Tools',
    locationDescription: 'Settings > Barcode Studio or Inventory quick bar',
    capabilities: [
      'Generate crisp Code 128 visual linear barcodes and 2D QR codes',
      'Apply pre-configured presets for Fleece, Dereec, and Oster India Yarn bales',
      'Print single 50×30mm thermal adhesive stickers directly to Zebra/Xprinter rolls',
      'Generate 12-up PDF sticker sheets ready for standard A4 adhesive paper'
    ],
    requiredRole: 'Admin, Branch Manager, Warehouse Operator',
    proTip: 'Thermal labels include GSM, Color, Price per Meter, and Barcode for rapid counter scanning.',
    shortcut: 'Alt + B'
  },
  {
    id: 'btn-user-guide-helper',
    name: 'Interactive User Guide & Search',
    iconName: 'BookOpen',
    module: 'header',
    moduleLabel: 'Top Navigation & Header',
    locationDescription: 'Top right header bar (Book icon 📖) or floating quick-help button',
    capabilities: [
      'Ask any question in natural language (e.g. "How to set yarn tare" or "Adjust fleece meters")',
      'Explore step-by-step guides with direct "Jump to Feature" shortcut buttons',
      'Lookup button and icon capabilities across the entire ERP platform',
      'Download formatted PDF or Markdown official User Manual'
    ],
    requiredRole: 'Accessible to all 9 system user roles',
    shortcut: 'Alt + G'
  },
  {
    id: 'btn-lock-platform',
    name: 'Lock Session Terminal',
    iconName: 'Lock',
    module: 'header',
    moduleLabel: 'Top Navigation & Header',
    locationDescription: 'Top right header bar (Red Lock icon 🔒)',
    capabilities: [
      'Instantly freeze and lock the terminal workspace with a secure backdrop',
      'Requires employee 6-digit PIN or Google Admin login to unlock',
      'Prevents unauthorized transactions or data viewing when stepping away from the counter',
      'Keeps active carts and open tabs safely preserved in memory'
    ],
    requiredRole: 'All roles & operators',
    proTip: 'Click whenever stepping away from the counter or handing over the workstation.',
    shortcut: 'Alt + L'
  },
  {
    id: 'btn-sound-toggle',
    name: 'Audio Synthesizer & Beep Feedback',
    iconName: 'Volume2',
    module: 'header',
    moduleLabel: 'Top Navigation & Header',
    locationDescription: 'Top right header bar (Speaker icon 🔊)',
    capabilities: [
      'Toggle audio sound effects across the application',
      'Provides instant audio feedback on barcode scans, cart additions, errors, and checkout success',
      'Synthesized purely with Web Audio API without requiring external audio files'
    ],
    requiredRole: 'All users'
  },
  {
    id: 'btn-inter-store-transfer',
    name: 'New Transfer Ticket',
    iconName: 'ArrowLeftRight',
    module: 'transfers',
    moduleLabel: 'Inter-Store Transfers',
    locationDescription: 'Inter-Store Transfers module action bar',
    capabilities: [
      'Create multi-location stock movement tickets between Main Store, Store 1, Store 2, and Sales Shop',
      'Select individual fabric rolls or yarn batches with stock balance validation',
      'Generate dispatch waybills with driver details and departure time',
      'Two-step verification: Source branch dispatches -> Destination branch confirms arrival'
    ],
    requiredRole: 'Admin, Branch Manager, Warehouse Operator',
    proTip: 'Stock is temporarily tagged as "In Transit" until destination attendant confirms receipt.'
  },
  {
    id: 'btn-record-expense-voucher',
    name: 'Record Branch Expense Voucher',
    iconName: 'Receipt',
    module: 'branches',
    moduleLabel: 'Branches & Accounting',
    locationDescription: 'Branch Management & Accounting Ledger > Record Expense',
    capabilities: [
      'Record petty cash disbursements for store utility, transport, tea, packaging, or maintenance',
      'Upload or capture digital photos of vendor physical receipts',
      'Route high-value vouchers to Branch Manager or CFO for two-factor authorization',
      'Automatically post balanced debit/credit journals to the general ledger upon approval'
    ],
    requiredRole: 'Branch Manager, Accountant, Admin'
  },
  {
    id: 'btn-adjust-cash-float',
    name: 'Adjust Cash Float & Till Opening Balance',
    iconName: 'Wallet',
    module: 'branches',
    moduleLabel: 'Branch Management',
    locationDescription: 'Branch Management action bar (Wallet icon 💳)',
    capabilities: [
      'Top-up or deduct physical cash float in branch sales cash register',
      'Record reason for float adjustments with timestamp and cashier PIN signature',
      'Reconciles cash-in-drawer for shift opening and end-of-day Z-Report verification'
    ],
    requiredRole: 'Branch Manager, Accountant, Admin',
    proTip: 'Set cash float at morning shift opening to ensure cashiers have small notes for change.'
  },
  {
    id: 'btn-camera-scanner',
    name: 'Mobile / Tablet Camera Barcode Scanner',
    iconName: 'Camera',
    module: 'general',
    moduleLabel: 'Universal Scanner',
    locationDescription: 'Header camera icon or POS search bar',
    capabilities: [
      'Use smartphone or tablet camera to scan 1D Code 128 barcodes and 2D QR codes',
      'Ideal for floor stock audits, inventory intake, and fast checkout without a physical scanner gun'
    ],
    requiredRole: 'All roles'
  },
  {
    id: 'btn-today-sales-view',
    name: 'Sales Today & Cash Reconciliation',
    iconName: 'TrendingUp',
    module: 'header',
    moduleLabel: 'Executive Analytics',
    locationDescription: 'Sidebar & Desktop Dock (Live Sales Today)',
    capabilities: [
      'View real-time today gross sales, net revenue, and collected 16% VAT',
      'Breakdown sales across Cash, M-Pesa Till, Bank Transfer, and Card payments',
      'Inspect line-by-line hourly transactions and cashier performance',
      'Export today ledger summary for daily banking deposit'
    ],
    requiredRole: 'Admin, Branch Manager, Accountant, Cashier'
  },
  {
    id: 'btn-forensic-audit',
    name: 'Tamper-Evident Forensic Audit Trail',
    iconName: 'ClipboardList',
    module: 'audit',
    moduleLabel: 'Governance & Security',
    locationDescription: 'Sidebar & Bottom Dock (Operator Audit Trail)',
    capabilities: [
      'Immutable cryptographic hash-chain logging of every inventory, price, or financial action',
      'Verify digital signatures to detect unauthorized data modifications or fraud',
      'Filter logs by operator, timestamp, action type, and branch location',
      'Export forensic audit certificates for external KRA and financial audits'
    ],
    requiredRole: 'Admin, Accountant, HR Manager'
  }
];

