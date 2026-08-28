import React, { useState, useMemo } from 'react';
import {
  FileText,
  Truck,
  Receipt,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  CreditCard,
  Calendar,
  Percent,
  Layers,
  Scale,
  PackageCheck,
  Phone,
  Mail,
  MapPin,
  Car
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { DocumentType, LocationId, CategoryType, UnitType } from '../../types';
import { exportBillingDocumentPDF } from '../../utils/documentExport';

interface CreateBillingDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: DocumentType;
}

interface DocumentLineItem {
  id: string;
  batchId: string;
  productName: string;
  category: CategoryType;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  scaleGrossWeight?: number;
  tareDeduction?: number;
  netBillableWeight?: number;
  tareDescription?: string;
}

export const CreateBillingDocumentModal: React.FC<CreateBillingDocumentModalProps> = ({
  isOpen,
  onClose,
  initialType = 'invoice'
}) => {
  const {
    products,
    locations,
    activeLocation,
    etrConfig,
    orders,
    createBillingDocument
  } = useERP();

  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  const [locationId, setLocationId] = useState<LocationId>(activeLocation);

  // Customer Information
  const [customerName, setCustomerName] = useState('');
  const [customerKraPin, setCustomerKraPin] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Delivery & Logistics
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Financial & Payment
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Credit/On Account'>('M-Pesa');
  const [paymentReference, setPaymentReference] = useState('');
  const [applyWHT5, setApplyWHT5] = useState(false);
  const [whtCertificateNo, setWhtCertificateNo] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isVatExempt, setIsVatExempt] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [validityDays, setValidityDays] = useState<number>(30);
  const [deductInventory, setDeductInventory] = useState(true);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Credit Note fields
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState('');
  const [creditReason, setCreditReason] = useState('Damaged goods / Return for credit');

  // Line items state
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([
    {
      id: `item-${Date.now()}`,
      batchId: '',
      productName: '',
      category: 'Dereck',
      unit: 'meter',
      quantity: 1,
      unitPrice: 0
    }
  ]);

  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill customer suggestions from existing orders
  const existingCustomers = useMemo(() => {
    const map = new Map<string, { name: string; pin?: string; phone?: string; address?: string }>();
    orders.forEach(o => {
      if (o.customerName && !map.has(o.customerName.trim().toLowerCase())) {
        map.set(o.customerName.trim().toLowerCase(), {
          name: o.customerName,
          pin: o.customerKraPin,
          phone: o.customerPhone,
          address: o.customerAddress || o.deliveryAddress
        });
      }
    });
    return Array.from(map.values()).slice(0, 8);
  }, [orders]);

  if (!isOpen) return null;

  const handleSelectExistingCustomer = (c: { name: string; pin?: string; phone?: string; address?: string }) => {
    setCustomerName(c.name);
    if (c.pin) setCustomerKraPin(c.pin);
    if (c.phone) setCustomerPhone(c.phone);
    if (c.address) {
      setCustomerAddress(c.address);
      setDeliveryAddress(c.address);
    }
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        batchId: '',
        productName: '',
        category: 'Dereck',
        unit: 'meter',
        quantity: 1,
        unitPrice: 0
      }
    ]);
  };

  const handleQuickAddProduct = (batchId: string) => {
    if (!batchId) return;
    const prod = products.find(p => p.id === batchId);
    if (!prod) return;

    // Check if empty line exists
    const hasEmptyFirst = lineItems.length === 1 && !lineItems[0].productName && !lineItems[0].batchId;

    const newItem: DocumentLineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      batchId: prod.id,
      productName: prod.name,
      category: prod.category,
      unit: prod.unit,
      quantity: 1,
      unitPrice: prod.unitPriceRetail || prod.costPrice * 1.3,
      scaleGrossWeight: prod.tareProfile?.tareWeightPerUnit ? 1 + prod.tareProfile.tareWeightPerUnit : undefined,
      tareDeduction: prod.tareProfile?.tareWeightPerUnit,
      netBillableWeight: 1,
      tareDescription: prod.tareProfile?.packagingDescription
    };

    if (hasEmptyFirst) {
      setLineItems([newItem]);
    } else {
      setLineItems(prev => [...prev, newItem]);
    }
    setSelectedProductToAdd('');
  };

  const handleUpdateLineItem = (id: string, updates: Partial<DocumentLineItem>) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) {
      setLineItems([
        {
          id: `item-${Date.now()}`,
          batchId: '',
          productName: '',
          category: 'Dereck',
          unit: 'meter',
          quantity: 1,
          unitPrice: 0
        }
      ]);
      return;
    }
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  // Financial calculations
  const rawSubtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discount = Math.min(discountAmount, rawSubtotal);
  const taxableAmount = Math.max(0, rawSubtotal - discount);
  const vatRate = isVatExempt ? 0 : 0.16;
  const vatAmount = Math.round(taxableAmount * vatRate * 100) / 100;
  const grossTotal = documentType === 'delivery_note' ? 0 : Math.round((taxableAmount + vatAmount) * 100) / 100;
  const whtAmount = applyWHT5 ? Math.round(taxableAmount * 0.05 * 100) / 100 : 0;
  const netPayable = Math.max(0, grossTotal - whtAmount);

  const handleSubmit = (downloadAfterCreate: boolean = false) => {
    setErrorMessage(null);

    // Validation
    const validItems = lineItems.filter(i => i.productName.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one line item with a product name and quantity.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please specify the Customer or Consignee name.');
      return;
    }

    if (applyWHT5 && !whtCertificateNo.trim()) {
      setErrorMessage('Please enter the KRA 5% Withholding Tax Certificate Number.');
      return;
    }

    const result = createBillingDocument({
      documentType,
      locationId,
      customerName: customerName.trim(),
      customerKraPin: customerKraPin.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      deliveryAddress: (deliveryAddress.trim() || customerAddress.trim()) || undefined,
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      vehicleRegistration: vehicleRegistration.trim() || undefined,
      dispatchDate,
      packageCount,
      deliveryNotes: deliveryNotes.trim() || undefined,
      items: validItems.map(item => ({
        batchId: item.batchId || `CUSTOM-${Date.now()}`,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        scaleGrossWeight: item.scaleGrossWeight,
        tareDeduction: item.tareDeduction,
        netBillableWeight: item.netBillableWeight,
        tareDescription: item.tareDescription
      })),
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      discountAmount: discount,
      applyWHT5,
      whtCertificateNo: whtCertificateNo.trim() || undefined,
      dueDate: dueDate || undefined,
      validityDays,
      notes: notes.trim() || undefined,
      termsAndConditions: termsAndConditions.trim() || undefined,
      deductInventory: documentType === 'quotation' || documentType === 'proforma' ? false : deductInventory,
      originalInvoiceNumber: originalInvoiceNumber.trim() || undefined,
      creditReason: creditReason.trim() || undefined
    });

    if (result.success && result.order) {
      if (downloadAfterCreate) {
        exportBillingDocumentPDF(result.order, etrConfig, locations);
      }
      onClose();
    } else {
      setErrorMessage(result.message || 'Failed to generate billing document.');
    }
  };

  const documentTypeConfig: Record<DocumentType, { label: string; icon: any; color: string; desc: string }> = {
    invoice: {
      label: 'Tax Invoice',
      icon: FileText,
      color: 'bg-rose-500 text-white border-rose-600',
      desc: 'Official KRA TIMS fiscalized invoice for billed sales'
    },
    quotation: {
      label: 'Commercial Quotation',
      icon: Sparkles,
      color: 'bg-amber-500 text-white border-amber-600',
      desc: 'Formal price quote valid for client procurement'
    },
    proforma: {
      label: 'Proforma Invoice',
      icon: FileSpreadsheet,
      color: 'bg-sky-600 text-white border-sky-700',
      desc: 'Advance payment invoice prior to product dispatch'
    },
    receipt: {
      label: 'Official Receipt',
      icon: Receipt,
      color: 'bg-emerald-600 text-white border-emerald-700',
      desc: 'Payment receipt with ETR Fiscal Confirmation'
    },
    delivery_note: {
      label: 'Delivery Note / Waybill',
      icon: Truck,
      color: 'bg-indigo-600 text-white border-indigo-700',
      desc: 'Goods dispatch note with driver & inspection sign-offs'
    },
    credit_note: {
      label: 'eTIMS Credit Note',
      icon: RotateCcw,
      color: 'bg-orange-600 text-white border-orange-700',
      desc: 'Fiscal adjustment or returns credit note'
    },
    advance_booking: {
      label: 'Advance Order / Reservation',
      icon: Calendar,
      color: 'bg-amber-600 text-white border-amber-700',
      desc: 'Forward-dated stock reservation booking voucher'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Create Billing Document
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 border border-slate-700">
                  {documentTypeConfig[documentType].label}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {documentTypeConfig[documentType].desc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Document Type Selector Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0">
          {(Object.keys(documentTypeConfig) as DocumentType[]).map(type => {
            const cfg = documentTypeConfig[type];
            const Icon = cfg.icon;
            const isSelected = documentType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setDocumentType(type);
                  if (type === 'delivery_note') {
                    setDeductInventory(true);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? `${cfg.color} shadow-xs font-black`
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Branch and Basic Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Origin Branch / Store:
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value as LocationId)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Document Issue Date:
              </label>
              <input
                type="date"
                value={dispatchDate}
                onChange={e => setDispatchDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {documentType === 'quotation' || documentType === 'proforma'
                  ? 'Validity Period:'
                  : 'Payment Due Date:'}
              </label>
              {documentType === 'quotation' || documentType === 'proforma' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={validityDays}
                    onChange={e => setValidityDays(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <span className="text-slate-500 text-[11px] font-medium">Days from issue</span>
                </div>
              ) : (
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>
          </div>

          {/* Customer / Consignee Section */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-rose-600" />
                {documentType === 'delivery_note' ? 'Consignee / Delivery Recipient' : 'Customer & Billing Info'}
              </h4>
              {existingCustomers.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm">
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">Quick fill:</span>
                  {existingCustomers.slice(0, 3).map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectExistingCustomer(c)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded text-[10px] font-medium transition-colors whitespace-nowrap"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="font-bold text-slate-700 block mb-1">
                  Customer / Business Name <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Garments Ltd / John Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Buyer KRA PIN (for B2B eTIMS):
                </label>
                <input
                  type="text"
                  placeholder="e.g. P051982341Z"
                  value={customerKraPin}
                  onChange={e => setCustomerKraPin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Contact Phone:
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +254 712 345 678"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Email Address:
                </label>
                <input
                  type="email"
                  placeholder="e.g. accounts@acmegarments.co.ke"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Delivery & Physical Address:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Industrial Area, Enterprise Road, Godown #4, Nairobi"
                  value={deliveryAddress}
                  onChange={e => {
                    setDeliveryAddress(e.target.value);
                    if (!customerAddress) setCustomerAddress(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Logistics (Always prominent for Delivery Notes) */}
          {(documentType === 'delivery_note' || documentType === 'invoice') && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="font-bold text-indigo-950 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Logistics, Transporter & Waybill Info
                </h4>
                <span className="text-[11px] text-indigo-700 font-medium">
                  {documentType === 'delivery_note' ? 'Required for Waybill' : 'Optional for Invoices'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-indigo-900 block mb-1">Driver / Transporter Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Peter Kamau"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-1">Driver Phone Number:</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0722 000 111"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                    <Car className="w-3 h-3 text-indigo-600" />
                    Vehicle Plate / Reg #:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KDA 892X"
                    value={vehicleRegistration}
                    onChange={e => setVehicleRegistration(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-indigo-600" />
                    Packages / Rolls Count:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packageCount}
                    onChange={e => setPackageCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-indigo-900 block mb-1">
                    Special Dispatch & Handling Instructions:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handle with care. Verify security seals before unloading."
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Credit Note Specific Box */}
          {documentType === 'credit_note' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
              <h4 className="font-bold text-orange-950 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-600" />
                Credit Note Adjustment Particulars
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-orange-900 block mb-1">
                    Original Invoice Number Reference <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KRA-INV-8891"
                    value={originalInvoiceNumber}
                    onChange={e => setOriginalInvoiceNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-orange-900 block mb-1">Reason for Credit / Reversal:</label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={e => setCreditReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  Document Line Items ({lineItems.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select from inventory catalog or enter customized line items
                </p>
              </div>

              {/* Quick Add Product Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductToAdd}
                  onChange={e => {
                    setSelectedProductToAdd(e.target.value);
                    handleQuickAddProduct(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <option value="">+ Add From Inventory Catalog...</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.category}) - Stock: {prod.locationStock ? (prod.locationStock[locationId as keyof typeof prod.locationStock] || 0) : 0} {prod.unit} @ KSh {prod.unitPriceRetail}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
              </div>
            </div>

            {/* Items Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                    <th className="p-2.5 w-8 text-center">#</th>
                    <th className="p-2.5">Product / Item Description</th>
                    <th className="p-2.5 w-28">Category</th>
                    <th className="p-2.5 w-24">Qty &amp; Unit</th>
                    <th className="p-2.5 w-28 font-mono">Unit Price (KSh)</th>
                    <th className="p-2.5 w-28 font-mono text-right">Line Total (KSh)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item, idx) => {
                    const lineTot = (item.quantity || 0) * (item.unitPrice || 0);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="Product name / service description"
                            value={item.productName}
                            onChange={e => handleUpdateLineItem(item.id, { productName: e.target.value })}
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.category}
                            onChange={e => handleUpdateLineItem(item.id, { category: e.target.value as CategoryType })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold"
                          >
                            <option value="Dereck">Dereck</option>
                            <option value="Fleece">Fleece</option>
                            <option value="Yarns">Yarns</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={e => handleUpdateLineItem(item.id, { quantity: Number(e.target.value) })}
                              className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-md font-bold font-mono text-xs"
                            />
                            <select
                              value={item.unit}
                              onChange={e => handleUpdateLineItem(item.id, { unit: e.target.value as UnitType })}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-md text-[11px]"
                            >
                              <option value="meter">m</option>
                              <option value="kg">kg</option>
                              <option value="roll">roll</option>
                              <option value="yard">yd</option>
                              <option value="skein">sk</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={e => handleUpdateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md font-mono font-bold text-slate-900 text-xs"
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-right text-slate-900">
                          KSh {lineTot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Adjustments & Payment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Box: Payment & Tax Governance */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment &amp; Tax Settings
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                  >
                    <option value="M-Pesa">M-Pesa (Till / Paybill)</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Bank Transfer">NCBA Bank Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Bankers Cheque</option>
                    <option value="Credit/On Account">30-Day Credit / Account</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Ref / Slip #:</label>
                  <input
                    type="text"
                    placeholder="e.g. QK892019M"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Tax Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isVatExempt}
                    onChange={e => setIsVatExempt(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
                  />
                  <span>Zero-Rated / VAT Exempt Transaction (0% VAT)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={applyWHT5}
                    onChange={e => setApplyWHT5(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
                  />
                  <span>Apply KRA 5% Withholding Tax (WHT) Deduction</span>
                </label>

                {applyWHT5 && (
                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg space-y-1.5 animate-in fade-in">
                    <label className="font-bold text-purple-950 block text-[11px]">
                      KRA 5% WHT Certificate Number <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KRA-WHT-2026-88192"
                      value={whtCertificateNo}
                      onChange={e => setWhtCertificateNo(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1 bg-white border border-purple-300 rounded text-xs font-mono uppercase font-bold text-purple-900"
                    />
                    <p className="text-[10px] text-purple-700">
                      Deducts 5% (KSh {whtAmount.toLocaleString()}) from gross payable and logs advance tax credit.
                    </p>
                  </div>
                )}

                {/* Stock Deduction Toggle */}
                {documentType !== 'quotation' && documentType !== 'proforma' && (
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={deductInventory}
                      onChange={e => setDeductInventory(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Automatically deduct quantities from {locations.find(l => l.id === locationId)?.name || 'store'} inventory</span>
                  </label>
                )}
              </div>
            </div>

            {/* Right Box: Live Financial Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Percent className="w-4 h-4 text-rose-400" />
                  Financial Breakdown
                </h4>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-bold">KSh {rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>Trade Discount (KSh):</span>
                    <input
                      type="number"
                      min="0"
                      max={rawSubtotal}
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value))}
                      className="w-24 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-white text-right text-xs"
                    />
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>16% Output VAT {isVatExempt ? '(Exempt)' : ''}:</span>
                    <span className="font-mono font-bold text-amber-300">
                      KSh {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-white text-sm">Gross Total:</span>
                    <span className="font-mono font-black text-rose-400 text-base">
                      KSh {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {applyWHT5 && (
                    <>
                      <div className="flex justify-between text-purple-300 text-xs">
                        <span>Less 5% WHT Deduction:</span>
                        <span className="font-mono font-bold">- KSh {whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-baseline">
                        <span className="font-bold text-emerald-400 text-sm">Net Receivable:</span>
                        <span className="font-mono font-black text-emerald-400 text-base">
                          KSh {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Public Document Notes &amp; Terms:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment strictly within 30 days. Cheques payable to Taji Enterprise."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KRA TIMS ETR Ready • Printable &amp; PDF Exportable</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Save &amp; Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Document</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
