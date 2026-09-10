import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  Mail, 
  Phone, 
  MessageSquare, 
  Building2, 
  ExternalLink, 
  Send, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Download, 
  Tag, 
  User, 
  Calendar,
  FileText,
  DollarSign,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  SupportTicket, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory, 
  createSupportTicket, 
  updateTicketStatus, 
  deleteTicket, 
  notifyGmailViaApi,
  TARGET_GMAIL 
} from '../../lib/ticketService';
import { getCachedGmailToken, sendGmailEmail } from '../../lib/gmail';

interface TicketsModuleProps {
  user: any;
  onOpenMailTab?: () => void;
}

export default function TicketsModule({ user, onOpenMailTab }: TicketsModuleProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Search and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modals & Forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    subject: '',
    message: '',
    category: 'General Inquiry' as TicketCategory,
    priority: 'medium' as TicketPriority,
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Reply Form
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState('');

  // Resend Alert State
  const [resendingAlert, setResendingAlert] = useState(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: SupportTicket[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as any)
      }));
      setTickets(docs);
      setLoading(false);

      // Keep selected ticket in sync if open
      if (selectedTicket) {
        const found = docs.find(t => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    }, (err) => {
      console.error('Tickets snapshot error:', err);
      handleFirestoreError(err, OperationType.LIST, 'tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      t.ticketId?.toLowerCase().includes(term) ||
      t.customerName?.toLowerCase().includes(term) ||
      t.customerEmail?.toLowerCase().includes(term) ||
      t.customerPhone?.toLowerCase().includes(term) ||
      t.subject?.toLowerCase().includes(term) ||
      t.companyName?.toLowerCase().includes(term) ||
      t.message?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const urgentCount = tickets.filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'closed' && t.status !== 'resolved').length;

  const handleStatusChange = async (docId: string, newStatus: TicketStatus) => {
    try {
      await updateTicketStatus(docId, { status: newStatus });
    } catch (e) {
      console.error('Failed to change ticket status:', e);
    }
  };

  const handlePriorityChange = async (docId: string, newPriority: TicketPriority) => {
    try {
      await updateTicketStatus(docId, { priority: newPriority });
    } catch (e) {
      console.error('Failed to change ticket priority:', e);
    }
  };

  const handleAddNote = async (ticket: SupportTicket) => {
    if (!internalNoteInput.trim() || !ticket.id) return;
    try {
      const existingNotes = ticket.notesHistory || [];
      const newNote = {
        id: 'note_' + Date.now(),
        author: user?.displayName || user?.email || 'Admin Staff',
        content: internalNoteInput.trim(),
        createdAt: new Date().toISOString(),
        isInternal: true,
      };
      await updateDoc(doc(db, 'tickets', ticket.id), {
        notesHistory: [newNote, ...existingNotes],
        updatedAt: serverTimestamp(),
      });
      setInternalNoteInput('');
    } catch (e) {
      console.error('Failed to add note:', e);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this support ticket?')) return;
    try {
      await deleteTicket(docId);
      if (selectedTicket?.id === docId) setSelectedTicket(null);
    } catch (e) {
      console.error('Failed to delete ticket:', e);
    }
  };

  const handleCreateManualTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.customerName || !newTicketForm.message) return;
    setCreatingTicket(true);
    try {
      await createSupportTicket({
        customerName: newTicketForm.customerName,
        customerEmail: newTicketForm.customerEmail || 'walkin@tewaw.com',
        customerPhone: newTicketForm.customerPhone,
        companyName: newTicketForm.companyName,
        subject: newTicketForm.subject || `${newTicketForm.category} - ${newTicketForm.customerName}`,
        message: newTicketForm.message,
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        source: 'Admin Portal (Manual Log)',
      });
      setIsCreateModalOpen(false);
      setNewTicketForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        companyName: '',
        subject: '',
        message: '',
        category: 'General Inquiry',
        priority: 'medium',
      });
    } catch (e) {
      console.error('Failed to create ticket:', e);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleResendAlert = async (ticket: SupportTicket) => {
    setResendingAlert(true);
    setAlertNotice(null);
    try {
      const ok = await notifyGmailViaApi({
        ticketId: ticket.ticketId,
        customerName: ticket.customerName,
        customerEmail: ticket.customerEmail,
        customerPhone: ticket.customerPhone,
        companyName: ticket.companyName,
        subject: ticket.subject,
        message: ticket.message,
        category: ticket.category,
        priority: ticket.priority,
        source: ticket.source,
        totalAmount: ticket.totalAmount,
      });
      if (ok) {
        setAlertNotice(`Email alert re-dispatched to ${TARGET_GMAIL} successfully.`);
      } else {
        setAlertNotice(`Alert logged in system queue for ${TARGET_GMAIL}.`);
      }
    } catch (e) {
      setAlertNotice('Failed to dispatch alert.');
    } finally {
      setResendingAlert(false);
      setTimeout(() => setAlertNotice(null), 4000);
    }
  };

  const handleSendReply = async (ticket: SupportTicket) => {
    if (!replyMessage.trim() || !ticket.customerEmail) return;
    setReplySending(true);
    setReplySuccess(null);

    const gmailToken = getCachedGmailToken();
    if (gmailToken) {
      try {
        await sendGmailEmail(
          gmailToken,
          ticket.customerEmail,
          `RE: [${ticket.ticketId}] ${ticket.subject}`,
          replyMessage
        );
        // Log reply in ticket history
        const existingNotes = ticket.notesHistory || [];
        if (ticket.id) {
          await updateDoc(doc(db, 'tickets', ticket.id), {
            notesHistory: [{
              id: 'reply_' + Date.now(),
              author: user?.email || 'Tewaw Support',
              content: `[GMAIL SENT TO ${ticket.customerEmail}]: ${replyMessage}`,
              createdAt: new Date().toISOString(),
              isInternal: false,
            }, ...existingNotes],
            status: ticket.status === 'open' ? 'in_progress' : ticket.status,
            updatedAt: serverTimestamp(),
          });
        }
        setReplySuccess('Reply sent via connected Gmail!');
        setReplyMessage('');
        setTimeout(() => setIsReplyModalOpen(false), 1500);
      } catch (err: any) {
        console.warn('Gmail API send failed, opening default mail client:', err);
        openMailto(ticket);
      } finally {
        setReplySending(false);
      }
    } else {
      openMailto(ticket);
      setReplySending(false);
      setIsReplyModalOpen(false);
    }
  };

  const openMailto = (ticket: SupportTicket) => {
    const subject = encodeURIComponent(`RE: [${ticket.ticketId}] ${ticket.subject}`);
    const body = encodeURIComponent(`Dear ${ticket.customerName},\n\nThank you for contacting Tewaw Enterprise regarding Ticket #${ticket.ticketId}.\n\n${replyMessage || ''}\n\nKind regards,\nCustomer Support Team\nTewaw Enterprise Nairobi`);
    window.open(`mailto:${ticket.customerEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const openWhatsApp = (ticket: SupportTicket) => {
    const phone = ticket.customerPhone?.replace(/\+/g, '').replace(/\s+/g, '') || '254736619688';
    const text = encodeURIComponent(`Hello ${ticket.customerName}, this is regarding your Tewaw Enterprise Support Ticket #${ticket.ticketId} ("${ticket.subject}"). We are following up with you on WhatsApp.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const exportCSV = () => {
    if (tickets.length === 0) return;
    const headers = ['Ticket ID', 'Status', 'Priority', 'Category', 'Customer Name', 'Email', 'Phone', 'Company', 'Subject', 'Source', 'Created At'];
    const rows = tickets.map(t => [
      `"${t.ticketId || ''}"`,
      `"${t.status || ''}"`,
      `"${t.priority || ''}"`,
      `"${t.category || ''}"`,
      `"${t.customerName || ''}"`,
      `"${t.customerEmail || ''}"`,
      `"${t.customerPhone || ''}"`,
      `"${t.companyName || ''}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${t.source || ''}"`,
      `"${t.createdAt?.toDate ? t.createdAt.toDate().toISOString() : ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tewaw_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20"><AlertCircle className="w-3 h-3" /> Urgent</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20"><AlertTriangle className="w-3 h-3" /> High</span>;
      case 'medium':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">Medium</span>;
      case 'low':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 border border-slate-500/20">Low</span>;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"><Clock className="w-3 h-3 animate-pulse text-emerald-600" /> Open</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 border border-blue-500/30"><RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-700 border border-teal-500/30"><CheckCircle2 className="w-3 h-3 text-teal-600" /> Resolved</span>;
      case 'closed':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/15 text-slate-700 border border-slate-500/30"><XCircle className="w-3 h-3 text-slate-500" /> Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-brand-blue uppercase tracking-tight">
                Customer Support & Helpdesk Tickets
              </h2>
              <p className="text-xs text-slate-500">
                Live customer contacts & quotation requests linked to <span className="font-semibold text-brand-blue">{TARGET_GMAIL}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            title="Export all tickets to CSV"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-brand-blue/15 transition-all"
          >
            <Plus className="w-4 h-4" /> Log Phone / Walk-in Ticket
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Inquiries</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-display font-black text-brand-blue">{totalCount}</p>
            <Ticket className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-emerald-600">Open Tickets</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-display font-black text-emerald-700">{openCount}</p>
            <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-600">In Progress</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-display font-black text-blue-700">{inProgressCount}</p>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-teal-600">Resolved</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-display font-black text-teal-700">{resolvedCount}</p>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-rose-600">Urgent Attention</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-display font-black text-rose-700">{urgentCount}</p>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ticket #, name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100/80 rounded-xl">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  statusFilter === st 
                    ? 'bg-white text-brand-blue shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Bulk Quotation">Bulk Quotation</option>
              <option value="School Uniforms">School Uniforms</option>
              <option value="Corporate Workwear">Corporate Workwear</option>
              <option value="Custom Embroidery & Printing">Custom Embroidery</option>
              <option value="Order Status & Tracking">Order Tracking</option>
              <option value="Urgent Delivery">Urgent Rush</option>
              <option value="Factory Visit">Factory Visit</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
              }}
              className="text-brand-orange hover:underline font-bold text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets List Table & Detail Drawer */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-orange" />
            <p className="text-sm font-bold">Synchronizing Helpdesk Tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-700">No Tickets Found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or active filters.'
                : 'When customers contact via the website or request a wholesale quote, tickets will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-black tracking-wider border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="py-4 px-6">Ticket ID</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-6">Subject / Message</th>
                  <th className="py-4 px-4">Source</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono font-black text-brand-blue group-hover:text-brand-orange transition-colors flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-brand-orange" />
                        {ticket.ticketId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                        {ticket.category}
                      </div>
                    </td>

                    <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                      <select
                        value={ticket.status}
                        onChange={e => ticket.id && handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                        className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="open">🟢 Open</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="resolved">🟢 Resolved</option>
                        <option value="closed">⚪ Closed</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{ticket.customerName}</div>
                      <div className="text-[11px] text-slate-400">{ticket.customerEmail}</div>
                      {ticket.customerPhone && (
                        <div className="text-[10px] text-slate-500 font-mono">{ticket.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{ticket.subject}</div>
                      <div className="text-[11px] text-slate-500 truncate">{ticket.message}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {ticket.source || 'Website'}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openWhatsApp(ticket)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                          title="Chat with Customer on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsReplyModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Reply to Customer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => ticket.id && handleDelete(ticket.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Inspector Modal */}
      <AnimatePresence>
        {selectedTicket && !isReplyModalOpen && (
          <div className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-emerald-400">{selectedTicket.ticketId}</span>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <p className="text-xs text-slate-400">{selectedTicket.subject}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTicket.ticketId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId ? 'Copied' : 'Copy Ref'}
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status and Priority Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ticket Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={e => selectedTicket.id && handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="open">🟢 Open (Awaiting Action)</option>
                      <option value="in_progress">🔵 In Progress</option>
                      <option value="resolved">🟢 Resolved</option>
                      <option value="closed">⚪ Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Priority Level</label>
                    <select
                      value={selectedTicket.priority}
                      onChange={e => selectedTicket.id && handlePriorityChange(selectedTicket.id, e.target.value as TicketPriority)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="urgent">🚨 Urgent Priority</option>
                      <option value="high">⚠️ High Priority</option>
                      <option value="medium">🔷 Medium Priority</option>
                      <option value="low">◽ Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Inquiry Category</label>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 truncate">
                      {selectedTicket.category}
                    </div>
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-blue" /> Customer & Contact Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Full Name:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedTicket.customerName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Email Address:</span>
                      <p className="font-bold text-blue-600 mt-0.5">
                        <a href={`mailto:${selectedTicket.customerEmail}`} className="hover:underline">{selectedTicket.customerEmail}</a>
                      </p>
                    </div>
                    {selectedTicket.customerPhone && (
                      <div>
                        <span className="text-slate-400">Phone / WhatsApp:</span>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedTicket.customerPhone}</p>
                      </div>
                    )}
                    {selectedTicket.companyName && (
                      <div>
                        <span className="text-slate-400">Company / Organization:</span>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedTicket.companyName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Origin Channel:</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{selectedTicket.source || 'Website'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Logged Date:</span>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-orange" /> Inquired Message / Specifications
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Internal Notes & History */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-brand-blue" /> Internal Staff Notes & Progress Log
                  </h4>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={internalNoteInput}
                      onChange={e => setInternalNoteInput(e.target.value)}
                      placeholder="Add an internal progress note (e.g. Sent swatch samples to client)..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddNote(selectedTicket);
                      }}
                    />
                    <button
                      onClick={() => handleAddNote(selectedTicket)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Add Note
                    </button>
                  </div>

                  {selectedTicket.notesHistory && selectedTicket.notesHistory.length > 0 ? (
                    <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                      {selectedTicket.notesHistory.map((note, idx) => (
                        <div key={note.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-600">{note.author}</span>
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-800">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No internal notes added yet.</p>
                  )}
                </div>

                {alertNotice && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>{alertNotice}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResendAlert(selectedTicket)}
                    disabled={resendingAlert}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    title={`Resend email alert to ${TARGET_GMAIL}`}
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-orange" />
                    {resendingAlert ? 'Sending...' : 'Resend to Gmail'}
                  </button>

                  <button
                    onClick={() => selectedTicket.id && handleDelete(selectedTicket.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openWhatsApp(selectedTicket)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                  </button>
                  <button
                    onClick={() => setIsReplyModalOpen(true)}
                    className="px-5 py-2.5 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-brand-blue/20 transition-all"
                  >
                    <Send className="w-4 h-4" /> Reply to Customer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reply Composer Modal */}
      <AnimatePresence>
        {isReplyModalOpen && selectedTicket && (
          <div className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[2600] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wide">Reply to {selectedTicket.customerName}</h3>
                </div>
                <button
                  onClick={() => setIsReplyModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold">Recipient: </span>
                  <span className="font-bold text-slate-800">{selectedTicket.customerEmail}</span>
                  <div className="mt-1">
                    <span className="text-slate-400 font-semibold">Subject: </span>
                    <span className="font-bold text-slate-800">RE: [{selectedTicket.ticketId}] {selectedTicket.subject}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Your Reply Message:</label>
                  <textarea
                    rows={6}
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your official response to the customer here..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-xs"
                  />
                </div>

                {replySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold">
                    {replySuccess}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendReply(selectedTicket)}
                  disabled={replySending || !replyMessage.trim()}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-orange disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  {replySending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Reply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual "Log Ticket" Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">
                    Log Phone / Walk-in Customer Ticket
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateManualTicket} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={newTicketForm.customerName}
                      onChange={e => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                      placeholder="e.g. John Kamau"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={newTicketForm.customerEmail}
                      onChange={e => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      value={newTicketForm.customerPhone}
                      onChange={e => setNewTicketForm({ ...newTicketForm, customerPhone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Company / School</label>
                    <input
                      type="text"
                      value={newTicketForm.companyName}
                      onChange={e => setNewTicketForm({ ...newTicketForm, companyName: e.target.value })}
                      placeholder="e.g. Apex Security"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Inquiry Category</label>
                    <select
                      value={newTicketForm.category}
                      onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value as TicketCategory })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-semibold"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Bulk Quotation">Bulk Quotation</option>
                      <option value="School Uniforms">School Uniforms</option>
                      <option value="Corporate Workwear">Corporate Workwear</option>
                      <option value="Custom Embroidery & Printing">Custom Embroidery</option>
                      <option value="Urgent Delivery">Urgent Rush Order</option>
                      <option value="Factory Visit">Factory Visit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={e => setNewTicketForm({ ...newTicketForm, priority: e.target.value as TicketPriority })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-semibold"
                    >
                      <option value="urgent">🚨 Urgent Priority</option>
                      <option value="high">⚠️ High Priority</option>
                      <option value="medium">🔷 Medium Priority</option>
                      <option value="low">◽ Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Inquiry Subject</label>
                  <input
                    type="text"
                    value={newTicketForm.subject}
                    onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    placeholder="e.g. Inquiry for 200pcs High-Vis Jackets"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Requirements / Notes *</label>
                  <textarea
                    rows={4}
                    required
                    value={newTicketForm.message}
                    onChange={e => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                    placeholder="Record notes from phone call or in-person factory visit..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTicket}
                    className="px-5 py-2 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-blue/20"
                  >
                    {creatingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save & Dispatch Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
