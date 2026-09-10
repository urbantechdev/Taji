import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 
  | 'General Inquiry' 
  | 'Bulk Quotation' 
  | 'School Uniforms' 
  | 'Corporate Workwear' 
  | 'Custom Embroidery & Printing' 
  | 'Order Status & Tracking' 
  | 'Urgent Delivery' 
  | 'Factory Visit';

export interface TicketNote {
  id: string;
  author: string;
  content: string;
  createdAt: any;
  isInternal?: boolean;
}

export interface SupportTicket {
  id?: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  subject: string;
  message: string;
  category: TicketCategory | string;
  priority: TicketPriority;
  status: TicketStatus;
  source: 'Website Contact Form' | 'Quote Request' | 'WhatsApp Consultation' | 'Admin Portal' | string;
  emailDispatched?: boolean;
  assignedTo?: string;
  adminNotes?: string;
  notesHistory?: TicketNote[];
  items?: any[];
  totalAmount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const TARGET_GMAIL = 'feminiholdings@gmail.com';

/**
 * Generate human-friendly reference ID (e.g. TK-84920)
 */
export function generateTicketReference(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TK-${rand}`;
}

/**
 * Creates a support ticket in Firestore, logs a real-time notification,
 * and notifies the official Gmail address.
 */
export async function createSupportTicket(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  subject: string;
  message: string;
  category?: TicketCategory | string;
  priority?: TicketPriority;
  source?: string;
  items?: any[];
  totalAmount?: number;
}): Promise<{ docId: string; ticketId: string }> {
  const ticketRefCode = generateTicketReference();
  const ticketCategory = data.category || 'General Inquiry';
  const ticketPriority = data.priority || (ticketCategory.toLowerCase().includes('urgent') ? 'urgent' : 'medium');
  const ticketSource = data.source || 'Website Contact Form';

  const ticketPayload = {
    ticketId: ticketRefCode,
    customerName: data.customerName.trim(),
    customerEmail: data.customerEmail.trim(),
    customerPhone: data.customerPhone?.trim() || '',
    companyName: data.companyName?.trim() || '',
    subject: data.subject?.trim() || 'New Customer Inquiry',
    message: data.message.trim(),
    category: ticketCategory,
    priority: ticketPriority,
    status: 'open' as TicketStatus,
    source: ticketSource,
    emailDispatched: false,
    assignedTo: 'Unassigned',
    adminNotes: '',
    notesHistory: [],
    items: data.items || [],
    totalAmount: data.totalAmount || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    // 1. Save ticket in Firestore
    const docRef = await addDoc(collection(db, 'tickets'), ticketPayload);

    // 2. Also log in `messages` collection for backward compatibility with existing Webmail
    try {
      await addDoc(collection(db, 'messages'), {
        subject: `[${ticketRefCode}] ${ticketPayload.subject}`,
        from: ticketPayload.customerName,
        fromEmail: ticketPayload.customerEmail,
        body: ticketPayload.message,
        receivedAt: serverTimestamp(),
        isStarred: ticketPriority === 'urgent' || ticketPriority === 'high',
        ticketId: ticketRefCode,
        ticketDocId: docRef.id,
      });
    } catch (msgErr) {
      console.warn('Could not mirror to messages collection:', msgErr);
    }

    // 3. Create real-time notification alert for Admin Dashboard
    try {
      await addDoc(collection(db, 'notifications'), {
        title: `🎫 New Ticket #${ticketRefCode}`,
        message: `${data.customerName} raised a ticket: "${data.subject}"`,
        type: 'ticket',
        ticketId: ticketRefCode,
        ticketDocId: docRef.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifErr) {
      console.warn('Could not create admin notification:', notifErr);
    }

    // 4. Dispatch Email to Gmail (feminiholdings@gmail.com) via backend endpoint
    try {
      notifyGmailViaApi({
        ticketId: ticketRefCode,
        customerName: ticketPayload.customerName,
        customerEmail: ticketPayload.customerEmail,
        customerPhone: ticketPayload.customerPhone,
        companyName: ticketPayload.companyName,
        subject: ticketPayload.subject,
        message: ticketPayload.message,
        category: ticketPayload.category,
        priority: ticketPayload.priority,
        source: ticketPayload.source,
        totalAmount: ticketPayload.totalAmount,
      }).catch(e => console.warn('Background email dispatch notice:', e));
    } catch (emailErr) {
      console.warn('Email dispatch invocation:', emailErr);
    }

    return { docId: docRef.id, ticketId: ticketRefCode };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tickets');
    throw error;
  }
}

/**
 * Triggers the server-side API to send an email to feminiholdings@gmail.com
 */
export async function notifyGmailViaApi(ticketInfo: {
  ticketId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  source: string;
  totalAmount?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/tickets/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ticketInfo,
        targetEmail: TARGET_GMAIL,
      }),
    });
    if (!res.ok) {
      console.warn('Email notification API returned non-200:', res.statusText);
      return false;
    }
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.warn('Failed to contact /api/tickets/notify:', err);
    return false;
  }
}

/**
 * Updates a ticket status or priority in Firestore
 */
export async function updateTicketStatus(
  docId: string, 
  updates: Partial<SupportTicket>
): Promise<void> {
  try {
    const ticketDoc = doc(db, 'tickets', docId);
    await updateDoc(ticketDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tickets/${docId}`);
    throw err;
  }
}

/**
 * Delete a ticket
 */
export async function deleteTicket(docId: string): Promise<void> {
  try {
    const ticketDoc = doc(db, 'tickets', docId);
    await deleteDoc(ticketDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `tickets/${docId}`);
    throw err;
  }
}
