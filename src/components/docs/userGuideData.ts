export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  clickPath?: string;
  proTip?: string;
}

export interface GuideArticle {
  id: string;
  category: 'yarns' | 'fleece_dereec' | 'pos' | 'transfers' | 'etr' | 'ledger' | 'roles_security' | 'barcodes' | 'general';
  categoryLabel: string;
  categoryIcon: string;
  title: string;
  shortSummary: string;
  keywords: string[];
  targetTab?: string;
  actionLabel?: string;
  steps: GuideStep[];
  faq: { q: string; a: string }[];
  relatedArticles?: string[];
}

export const USER_GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: 'yarn-tare-mass-settings',
    category: 'yarns',
    categoryLabel: 'Yarns & Mass Calibration',
    categoryIcon: 'Scale',
    title: 'How to Set Standard Net Mass, Gross Mass & Tare for Yarn',
    shortSummary: 'Configure cone plastic tare (70g), bale tare (0.840kg), and automated POS scale net deductions.',
    keywords: [
      'yarn', 'net mass', 'gross mass', 'tare', 'bale', 'cone', 'weight', 'scale', 'kg',
      'tare weight', 'packaging allowance', 'oster india', 'lot', 'mass', 'calibration'
    ],
    targetTab: 'settings',
    actionLabel: 'Open Product Price Settings',
    steps: [
      {
        stepNumber: 1,
        title: 'Open System Settings',
        description: 'Click the ⚙️ Settings Gear icon in the top header or select "Settings" from the left sidebar navigation.',
        clickPath: 'Top Navigation > ⚙️ Settings > Product Price Settings'
      },
      {
        stepNumber: 2,
        title: 'Select the Yarns Category',
        description: 'In the Category Selector tab strip, choose "Yarns (Knitting & Weaving)".',
        clickPath: 'Product Price Settings > Select [Yarns (Knitting & Weaving)]'
      },
      {
        stepNumber: 3,
        title: 'Calibrate Bale & Cone Tare Standards',
        description: 'Under "Tare Weight & Packaging Allowance Calibration", enter the standard tare allowance: e.g. 0.840 kg per 24.84kg Oster India Bale (24.00 kg Net) or 0.070 kg (70g) per individual plastic cone core.',
        proTip: 'Check the "Auto-Deduct Tare at POS Checkout" box so cashiers weighing yarn cones on digital scales are automatically billed strictly for Net Fabric Mass!'
      },
      {
        stepNumber: 4,
        title: 'Save Category Calibration',
        description: 'Click "Save & Apply Category Pricing" at the bottom right. All future yarn intake and POS terminal weighing will use these calibrated tare standards.'
      }
    ],
    faq: [
      {
        q: 'Can I calibrate tare for a specific individual yarn batch rather than the whole category?',
        a: 'Yes! In the Inventory Catalog, click the ⚖️ Scale icon on any yarn product card to open the Tare Settings Modal and set custom tare for that specific batch.'
      },
      {
        q: 'How does POS handle gross vs net yarn sales?',
        a: 'When an operator enters or scans a gross scale weight (e.g. 2.070 kg), the POS automatically subtracts 0.070 kg cone tare and charges the customer for exactly 2.000 kg net.'
      }
    ],
    relatedArticles: ['fleece-dereec-meters-adjustment', 'pos-sales-checkout', 'category-intake-scanning']
  },
  {
    id: 'fleece-dereec-meters-adjustment',
    category: 'fleece_dereec',
    categoryLabel: 'Fleece & Dereec (Meters & Rolls)',
    categoryIcon: 'Scissors',
    title: 'How to Adjust Meters During Fleece & Dereec Inventory Creation',
    shortSummary: 'Adjust roll meter lengths during Category Intake, batch roll registration, or stock balance editing.',
    keywords: [
      'meters', 'fleece', 'dereec', 'adjust meters', 'roll length', 'fabric', 'cutting',
      'inventory creation', 'category intake', 'fabric roll manager', 'gsm', 'rolls'
    ],
    targetTab: 'catalog',
    actionLabel: 'Open Inventory Catalog',
    steps: [
      {
        stepNumber: 1,
        title: 'Method 1: During Category Rapid Intake',
        description: 'Go to Inventory > Click "Category Intake" > Select "Fleeces" or "Dereec". In the "Scan Qty" field, set your default meters (e.g. 50m). When you scan or add rolls, you can click directly into the "Qty (Meters)" input field on each row to fine-tune exact meter lengths before saving.',
        clickPath: 'Inventory > Category Intake > Scan Qty / Manifest Table'
      },
      {
        stepNumber: 2,
        title: 'Method 2: Multi-Roll Batch Registration (Fabric Roll Manager)',
        description: 'Go to Inventory > Open "Fabric Roll Manager" (Scissors icon ✂️) > Click the "Batch Intake (Rolls)" tab. Enter your comma-separated roll lengths (e.g. 52.4, 48.0, 63.8, 55.0). The system generates unique barcode stickers for each roll with its exact meterage.',
        clickPath: 'Inventory > Fabric Roll Manager ✂️ > Batch Intake'
      },
      {
        stepNumber: 3,
        title: 'Method 3: Direct Stock Balance Adjustment',
        description: 'In the Inventory Catalog, click the ✏️ Edit (Pencil) button on any existing Fleece or Dereec product. Scroll to "Store & Warehouse Stock Levels" and update the meter balance for Main Store, Sales Shop, Store 1, or Store 2.',
        clickPath: 'Inventory Catalog > Product Card > ✏️ Edit Product'
      }
    ],
    faq: [
      {
        q: 'What happens when a customer buys a partial cut of a Fleece roll?',
        a: 'The POS automatically deducts the cut meters from the active roll and registers the remaining balance with updated roll tracking.'
      },
      {
        q: 'Can I print barcode labels for each adjusted roll?',
        a: 'Yes! In the Fabric Roll Manager, click "Print Barcode" next to any roll to generate 50×30mm thermal adhesive labels showing GSM, Color, and Roll Meters.'
      }
    ],
    relatedArticles: ['yarn-tare-mass-settings', 'thermal-barcode-printing', 'category-intake-scanning']
  },
  {
    id: 'pos-sales-checkout',
    category: 'pos',
    categoryLabel: 'POS Sales & Registers',
    categoryIcon: 'ShoppingCart',
    title: 'How to Run POS Sales, Weigh Items & Process M-Pesa Payments',
    shortSummary: 'Scan barcodes, input digital scale weights, apply split payments, and print ETR receipts.',
    keywords: [
      'pos', 'sales', 'checkout', 'barcode', 'm-pesa', 'cash', 'terminal', 'register',
      'cart', 'held cart', 'discount', 'receipt', 'scale', 'weigh'
    ],
    targetTab: 'pos',
    actionLabel: 'Open POS Sales Terminal',
    steps: [
      {
        stepNumber: 1,
        title: 'Scan or Select Fabric Items',
        description: 'Use the USB barcode scanner or click products in the catalog grid. For weighed items like yarn, click the ⚖️ Scale icon to enter digital scale weight or let tare auto-deduct.',
        clickPath: 'POS Terminal > Search / Barcode Input'
      },
      {
        stepNumber: 2,
        title: 'Review Cart & Adjust Meterage / Quantity',
        description: 'In the right-hand cart panel, verify the cut length (meters) or net weight (kg). You can apply item-level discounts or add customer notes if required.',
        clickPath: 'POS Terminal > Cart Panel'
      },
      {
        stepNumber: 3,
        title: 'Select Payment Method (Cash / M-Pesa / Split)',
        description: 'Click "Complete Checkout". Choose M-Pesa (Buy Goods Till / Paybill) with transaction code, Cash with change computation, or Split Multi-Pay.',
        clickPath: 'Cart Panel > Complete Checkout > Payment Modal'
      },
      {
        stepNumber: 4,
        title: 'Print KRA ETR Fiscal Receipt',
        description: 'Upon confirmation, the ETR Receipt modal pops up with QR verification code, CU serial number, and VAT breakdown ready for 80mm thermal printing.',
        proTip: 'Use Ctrl+P or click "Print Receipt" for instant 80mm thermal receipt output.'
      }
    ],
    faq: [
      {
        q: 'Can I put a customer order on hold while they continue shopping?',
        a: 'Yes! Click the "Hold Cart" button at the bottom of the POS cart. You can recall any held cart anytime from the "Held Carts" drawer.'
      },
      {
        q: 'How do I perform an End-of-Day Shift Closure & Z-Report?',
        a: 'Click "Close Shift / Z-Report" in the POS header or Today Sales view to reconcile cash in drawer, M-Pesa settlements, and print the fiscal Z-Report.'
      }
    ],
    relatedArticles: ['fleece-dereec-meters-adjustment', 'kra-etims-invoicing', 'cashier-shift-z-report']
  },
  {
    id: 'inter-store-transfers',
    category: 'transfers',
    categoryLabel: 'Inter-Store Transfers',
    categoryIcon: 'ArrowLeftRight',
    title: 'How to Dispatch & Receive Stock Transfers Between Stores',
    shortSummary: 'Request rolls or yarn from Main Hub to Store 1, Store 2, or Sales Shop with full audit verification.',
    keywords: [
      'transfers', 'inter-store', 'dispatch', 'receive', 'main store', 'store 1', 'store 2',
      'sales shop', 'restock', 'manifest', 'waybill', 'approval'
    ],
    targetTab: 'transfers',
    actionLabel: 'Open Inter-Store Transfers',
    steps: [
      {
        stepNumber: 1,
        title: 'Initiate Transfer Request',
        description: 'Navigate to "Inter-Store Transfers" > Click "+ New Transfer Ticket". Select Source Location (e.g. Main Central Hub) and Destination Store.',
        clickPath: 'Transfers > + New Transfer Ticket'
      },
      {
        stepNumber: 2,
        title: 'Add Fabric Rolls & Yarn Bales',
        description: 'Search products by SKU or barcode. Specify the exact meters or kg to transfer. The system validates available stock at the source location.',
        clickPath: 'Transfer Modal > Add Items > Enter Quantities'
      },
      {
        stepNumber: 3,
        title: 'Dispatch & Print Waybill',
        description: 'Warehouse operators click "Dispatch Transfer". A dispatch manifest waybill is generated with driver details and departure timestamp.',
        clickPath: 'Transfers Table > Actions > Dispatch'
      },
      {
        stepNumber: 4,
        title: 'Destination Branch Receiving & Verification',
        description: 'When stock arrives at the destination store, the receiving attendant clicks "Verify & Accept". Quantities are automatically credited to the branch balance in real time.',
        clickPath: 'Transfers Table > Actions > Receive & Confirm'
      }
    ],
    faq: [
      {
        q: 'What if some rolls are damaged during transit?',
        a: 'Receiving attendants can accept partial quantities and mark discrepancies or quarantine defective rolls with audit reasons.'
      }
    ],
    relatedArticles: ['fleece-dereec-meters-adjustment', 'yarn-tare-mass-settings']
  },
  {
    id: 'kra-etims-invoicing',
    category: 'etr',
    categoryLabel: 'KRA eTIMS & Billing',
    categoryIcon: 'Receipt',
    title: 'How to Configure KRA ETR, Issue Invoices & Credit Notes',
    shortSummary: 'Manage Tax PIN, CU Serial numbers, 16% VAT computation, eTIMS QR codes, and sales credit notes.',
    keywords: [
      'kra', 'etims', 'etr', 'tax', 'vat', 'cu serial', 'pin', 'credit note', 'invoice',
      'proforma', 'fiscal', 'withholding'
    ],
    targetTab: 'etr',
    actionLabel: 'Open Billing & Invoices',
    steps: [
      {
        stepNumber: 1,
        title: 'Configure Company Tax PIN & CU Serial',
        description: 'Go to Settings > Financial & Accounting Settings. Enter Company KRA PIN (e.g. P051234567Z) and Control Unit (CU) Serial Number.',
        clickPath: 'Settings > Financial & Accounting Settings > KRA ETR Configuration'
      },
      {
        stepNumber: 2,
        title: 'Issue Fiscal Tax Invoice',
        description: 'In "Billing & Invoices" (ETR module), click "+ New Tax Invoice". Select customer PIN, fabric line items, and generate compliant invoices with QR codes.',
        clickPath: 'Billing & Invoices > + New Tax Invoice'
      },
      {
        stepNumber: 3,
        title: 'Issue eTIMS Credit Note for Returns',
        description: 'To reverse a sale or process fabric defect returns, click "Issue Credit Note", link the original invoice number, and credit customer ledger.',
        clickPath: 'Billing & Invoices > Credit Notes Tab > Issue Credit Note'
      }
    ],
    faq: [
      {
        q: 'Is 16% VAT automatically split on POS thermal receipts?',
        a: 'Yes! Every receipt calculates Net Vatable Amount, 16% VAT Tax, and Total Gross automatically.'
      }
    ],
    relatedArticles: ['pos-sales-checkout', 'accounting-ledger-vouchers']
  },
  {
    id: 'accounting-ledger-vouchers',
    category: 'ledger',
    categoryLabel: 'Accounting & Ledger',
    categoryIcon: 'BookOpenCheck',
    title: 'How to Manage Double-Entry Ledgers, Petty Cash & Expense Vouchers',
    shortSummary: 'Post sales revenues, disburse branch petty cash, track accounts payable, and view trial balances.',
    keywords: [
      'accounting', 'ledger', 'petty cash', 'expenses', 'voucher', 'trial balance',
      'balance sheet', 'double entry', 'journal', 'cfo', 'reconciliation'
    ],
    targetTab: 'ledger',
    actionLabel: 'Open Accounting Ledger',
    steps: [
      {
        stepNumber: 1,
        title: 'View Auto-Posted Sales Journals',
        description: 'Every POS sale automatically generates balanced debit/credit journal entries (Cash/M-Pesa Dr, Sales Revenue Cr, VAT Output Cr).',
        clickPath: 'Accounting Ledger > Journal Entries Tab'
      },
      {
        stepNumber: 2,
        title: 'Create Branch Expense Voucher',
        description: 'Click "+ Record Expense Voucher". Enter expense category (e.g. Electricity, Transport, Packaging), branch location, amount, and receipt attachment.',
        clickPath: 'Accounting Ledger > Expense Vouchers > + Record Expense'
      },
      {
        stepNumber: 3,
        title: 'Manager Approval Workflow',
        description: 'Branch managers or CFOs review pending vouchers and click "Approve & Disburse" to deduct from petty cash and post to expense ledger.',
        clickPath: 'Expense Vouchers > Actions > Approve'
      },
      {
        stepNumber: 4,
        title: 'Generate Trial Balance & P&L Statement',
        description: 'Switch to the "Financial Reports" tab to generate real-time Profit & Loss statements, Balance Sheets, and Tax Summary reports.',
        clickPath: 'Accounting Ledger > Financial Reports Tab'
      }
    ],
    faq: [
      {
        q: 'Can branch cashiers disburse large expenses without manager authorization?',
        a: 'No. Expenses exceeding the threshold configured in Settings require two-factor approval by a Branch Manager or Accountant.'
      }
    ],
    relatedArticles: ['kra-etims-invoicing', 'user-roles-security']
  },
  {
    id: 'user-roles-security',
    category: 'roles_security',
    categoryLabel: 'Roles, Users & Security',
    categoryIcon: 'ShieldCheck',
    title: 'How to Onboard Staff, Assign Roles & Set 6-Digit POS PINs',
    shortSummary: 'Create operators, enforce RBAC permissions, configure quick-switch login PINs, and lock terminals.',
    keywords: [
      'users', 'roles', 'rbac', 'pin', 'operators', 'permissions', 'staff', 'security',
      'lock', 'cashier', 'branch manager', 'hr'
    ],
    targetTab: 'settings',
    actionLabel: 'Open Roles & Governance Settings',
    steps: [
      {
        stepNumber: 1,
        title: 'Open User & Role Management',
        description: 'Go to Settings > "User Creation & Staff Profiles" or "Role Settings & Access Matrix".',
        clickPath: 'Settings > User Creation & Staff Profiles'
      },
      {
        stepNumber: 2,
        title: 'Create New Employee Account',
        description: 'Fill in Operator Full Name, Phone Number, KRA PIN, Assigned Store Branch, and Role (e.g. Retail POS Cashier, Branch Manager, Accountant).',
        clickPath: 'Settings > User Creation > Fill Form'
      },
      {
        stepNumber: 3,
        title: 'Assign or Auto-Generate 6-Digit PIN',
        description: 'Click "Auto-Generate Secure PIN" or enter a memorable 6-digit numeric code. The user uses this PIN for rapid terminal sign-in.',
        proTip: 'Operators can quickly lock the POS terminal by clicking the 🔒 Lock icon in the header when stepping away from the counter.'
      },
      {
        stepNumber: 4,
        title: 'Verify Permissions in Role Matrix',
        description: 'Use the Role Inspector tool in Settings to review what modules and actions this user can perform.',
        clickPath: 'Settings > Role Settings > Inspect Role'
      }
    ],
    faq: [
      {
        q: 'What should I do if a cashier forgets their PIN?',
        a: 'An Admin or HR Manager can view or reset any user PIN under Settings > User Creation > Staff Directory.'
      }
    ],
    relatedArticles: ['pos-sales-checkout', 'accounting-ledger-vouchers']
  },
  {
    id: 'thermal-barcode-printing',
    category: 'barcodes',
    categoryLabel: 'Barcodes & Label Printing',
    categoryIcon: 'Barcode',
    title: 'How to Generate & Print 50×30mm Thermal Barcodes for Fleece, Dereec & Yarns',
    shortSummary: 'Generate Code 128 barcodes, 2D QR codes, roll stickers, and multi-item PDF label sheets.',
    keywords: [
      'barcode', 'qr code', 'print labels', 'thermal printer', 'code 128', '50x30mm',
      'stickers', 'fleece labels', 'dereec labels', 'yarn cones', 'pdf'
    ],
    targetTab: 'settings',
    actionLabel: 'Open Barcode & Label Studio',
    steps: [
      {
        stepNumber: 1,
        title: 'Open Barcode & Label Studio',
        description: 'Go to Settings > "Barcode & QR Studio" or click the Barcode 🏷️ button in Inventory Catalog.',
        clickPath: 'Settings > Barcode & QR Studio'
      },
      {
        stepNumber: 2,
        title: 'Load Quick Preset (Fleece / Dereec / Yarn)',
        description: 'Click any one-click preset: "Polar Fleece Heavy 320gsm", "Heavy Dereec Twill 400gsm", or "Oster India 24.84kg Yarn Bale".',
        clickPath: 'Barcode Studio > Quick Preset Buttons'
      },
      {
        stepNumber: 3,
        title: 'Customize Barcode & Label Details',
        description: 'Set custom Barcode value, Product Title, GSM/Weight, Color Shade, Lot Number, and Price.',
        clickPath: 'Barcode Studio > Label Configuration Form'
      },
      {
        stepNumber: 4,
        title: 'Print Single 50×30mm Thermal Sticker or Multi-Item PDF Sheet',
        description: 'Click "Print 50×30mm Label" for continuous roll thermal printers (Zebra/Xprinter) or "Generate 12-Up Label Sheet (PDF)" for A4 sticker sheets.',
        clickPath: 'Barcode Studio > Print / Export PDF'
      }
    ],
    faq: [
      {
        q: 'Can the USB scanner read both barcodes and QR codes?',
        a: 'Yes! All POS and Intake screens support 1D Code 128 and 2D QR codes seamlessly.'
      }
    ],
    relatedArticles: ['fleece-dereec-meters-adjustment', 'yarn-tare-mass-settings']
  },
  {
    id: 'category-intake-scanning',
    category: 'fleece_dereec',
    categoryLabel: 'Inventory Intake & Batch Scanning',
    categoryIcon: 'Boxes',
    title: 'How to Perform Rapid Barcode Scanning & Delivery Intake',
    shortSummary: 'Rapidly intake bulk supplier shipments of Fleece, Dereec, and Yarns with barcode guns.',
    keywords: [
      'intake', 'delivery', 'receive', 'supplier', 'bulk intake', 'barcode gun',
      'batch intake', 'scan qty', 'manifest'
    ],
    targetTab: 'catalog',
    actionLabel: 'Open Inventory Catalog',
    steps: [
      {
        stepNumber: 1,
        title: 'Launch Category Intake Modal',
        description: 'In the Inventory Catalog, click the "Category Intake / Rapid Barcode Scanning" button.',
        clickPath: 'Inventory Catalog > Category Intake'
      },
      {
        stepNumber: 2,
        title: 'Select Category Mode (Fleece, Dereec, or Yarns)',
        description: 'Choose your active intake mode. Each mode tailors the unit (Meters for fabrics, KG for yarns) and default pricing markup.',
        clickPath: 'Category Intake Modal > Select Fabric Category'
      },
      {
        stepNumber: 3,
        title: 'Scan Rolls or Bales Continuously',
        description: 'Point your barcode gun at fabric roll tags. Each beep adds a line item with auto-incremented roll numbers and default meterage.',
        proTip: 'You can adjust meters or kg directly on any scanned row before committing to database!'
      },
      {
        stepNumber: 4,
        title: 'Save & Commit to Store Stock',
        description: 'Click "Save & Finalize Intake". All scanned items are immediately added to stock balances and logged in the tamper-evident audit trail.'
      }
    ],
    faq: [
      {
        q: 'Can I upload supplier delivery notes (PDF / Images)?',
        a: 'Yes! In "Receive Delivery" modal, you can attach supplier delivery notes and invoice numbers.'
      }
    ],
    relatedArticles: ['fleece-dereec-meters-adjustment', 'thermal-barcode-printing']
  },
  {
    id: 'option1-hybrid-roll-pricing',
    category: 'pos',
    categoryLabel: 'POS Pricing & Roll Discounts',
    categoryIcon: 'Scissors',
    title: 'How Option 1 Hybrid Roll Pricing & Loose Cut Discounts Work',
    shortSummary: 'Combine whole-roll wholesale pricing with discounted loose cut meters for maximum customer value.',
    keywords: [
      'hybrid pricing', 'option 1', 'whole roll', 'loose meters', 'roll discount', 'wholesale',
      'cut meters', 'fleece', 'dereec', 'standard roll', '70m', '50m', 'discount percentage'
    ],
    targetTab: 'pos',
    actionLabel: 'Open POS Terminal',
    steps: [
      {
        stepNumber: 1,
        title: 'Add Fabric Roll or Cut to POS Cart',
        description: 'Scan or select a Fleece or Dereec product. Enter total meters required by customer (e.g., 95 meters when standard roll is 70m).',
        clickPath: 'POS Terminal > Select Product > Enter 95m'
      },
      {
        stepNumber: 2,
        title: 'Click the Tag / Calculator Icon',
        description: 'In the cart item row, click the 🏷️ Tag / Roll Pricing button to open the Option 1 Hybrid Roll Pricing Calculator modal.',
        clickPath: 'POS Cart > Line Item > 🏷️ Tag Icon'
      },
      {
        stepNumber: 3,
        title: 'Inspect Split Calculation',
        description: 'The modal automatically breaks down: 1 Whole Roll (70m @ wholesale price KES 440/m = KES 30,800) + 25 Loose Meters (@ 10% discounted retail e.g. KES 423/m = KES 10,575). Total = KES 41,375.',
        proTip: 'You can adjust the standard roll length (e.g. 50m vs 70m) or customize the loose meter discount percentage on the fly.'
      },
      {
        stepNumber: 4,
        title: 'Apply Hybrid Pricing to Cart',
        description: 'Click "Apply Hybrid Pricing". The cart line item is updated with the blended unit rate and savings summary displayed clearly for the customer.'
      }
    ],
    faq: [
      {
        q: 'Where do I configure default standard roll lengths and category loose meter discounts?',
        a: 'Go to Settings > Product Price Settings > Select Category > Adjust "Standard Roll Length (Meters)" and "Loose Cut Discount %".'
      },
      {
        q: 'Can I switch back to Standard Retail or All Wholesale pricing?',
        a: 'Yes, inside the Roll Pricing Modal, simply click "All Wholesale" or "All Retail" tabs.'
      }
    ],
    relatedArticles: ['pos-sales-checkout', 'fleece-dereec-meters-adjustment']
  },
  {
    id: 'multi-branch-expense-float',
    category: 'pos',
    categoryLabel: 'Branches & Petty Cash Float',
    categoryIcon: 'BookOpenCheck',
    title: 'How to Record Branch Expenses & Manage Cash Float',
    shortSummary: 'Top-up till opening floats, record branch petty expenses, and reconcile register variances.',
    keywords: [
      'float', 'cash float', 'branch expense', 'petty cash', 'variance', 'opening balance',
      'reconciliation', 'branch manager', 'drawer'
    ],
    targetTab: 'branches',
    actionLabel: 'Open Branch Management',
    steps: [
      {
        stepNumber: 1,
        title: 'Navigate to Branch Management',
        description: 'Select "Autonomous Branches" from the sidebar or click "Branches" in the bottom dock.',
        clickPath: 'Sidebar > Autonomous Branches'
      },
      {
        stepNumber: 2,
        title: 'Adjust Branch Cash Float',
        description: 'Click "Adjust Cash Float". Enter the opening cash amount in the register till (e.g. KES 5,000) and specify reason (e.g., Morning Shift Till Float).',
        clickPath: 'Branch Management > Cash Float Bar > Adjust Float'
      },
      {
        stepNumber: 3,
        title: 'Log Store Petty Cash Expense',
        description: 'Click "+ Record Branch Expense". Choose Category (Transport, Utilities, Tea & Meals, Cleaning, Packaging), enter amount, and enter cashier PIN.',
        clickPath: 'Branch Management > Expense Vouchers > + Record Expense'
      },
      {
        stepNumber: 4,
        title: 'Verify General Ledger Auto-Posting',
        description: 'The system deducts the expense from the branch petty cash ledger and automatically posts balanced debit/credit entries to the General Ledger.'
      }
    ],
    faq: [
      {
        q: 'Can I view expense history per branch location?',
        a: 'Yes! Branch Management displays individual voucher history with date, cashier name, amount, and receipt status.'
      }
    ],
    relatedArticles: ['accounting-ledger-vouchers', 'pos-sales-checkout']
  }
];
