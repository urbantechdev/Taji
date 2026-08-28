import React, { useState, useEffect } from 'react';
import ReflectionOverlay from '../common/ReflectionOverlay';
import RightEdgeBlend from '../common/RightEdgeBlend';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  Plus,
  CheckCircle2,
  X,
  LogOut,
  UserCheck,
  Sparkles,
  Inbox,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface FullGmailMessage extends GmailMessage {
  to?: string;
  body?: string;
}

interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

export const GmailInbox: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'inbox' | 'unread' | 'sent' | 'trash'>('inbox');
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [selectedMsgDetail, setSelectedMsgDetail] = useState<FullGmailMessage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUserProfile(data.user);
        fetchMessages('in:inbox');
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setIsAuthenticated(false);
    }
  };

  const handleConnectGoogle = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '/api/auth/google',
      'google_oauth',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        checkAuthStatus();
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        checkAuthStatus();
      }
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUserProfile(null);
      setMessages([]);
      setSelectedMsgDetail(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const fetchMessages = async (query = searchQuery) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `/api/gmail/messages?q=${encodeURIComponent(query)}`
        : '/api/gmail/messages';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: 'inbox' | 'unread' | 'sent' | 'trash') => {
    setActiveFilter(filter);
    let q = 'in:inbox';
    if (filter === 'unread') q = 'is:unread';
    if (filter === 'sent') q = 'in:sent';
    if (filter === 'trash') q = 'in:trash';
    fetchMessages(q);
  };

  const handleSelectMessage = async (msgId: string) => {
    setSelectedMsgId(msgId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/gmail/messages/${msgId}`);
      const data = await res.json();
      if (data.id) {
        setSelectedMsgDetail(data);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, isUnread: false } : m))
        );
      }
    } catch (err) {
      console.error('Failed to fetch message detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTrashMessage = async (msgId: string) => {
    try {
      await fetch(`/api/gmail/trash/${msgId}`, { method: 'POST' });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      if (selectedMsgId === msgId) {
        setSelectedMsgId(null);
        setSelectedMsgDetail(null);
      }
    } catch (err) {
      console.error('Error trashing email:', err);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    setSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          message: composeBody,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccess('Email sent successfully!');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setTimeout(() => {
          setIsComposeOpen(false);
          setSendSuccess(null);
          fetchMessages();
        }, 1200);
      } else {
        setSendError(data.error || 'Failed to send email.');
      }
    } catch (err: any) {
      setSendError(err.message || 'Error sending email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-2 sm:p-6 lg:p-8 space-y-3 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-pink-900 to-slate-900 text-white p-3 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-500/30">
        <ReflectionOverlay />
        <RightEdgeBlend variant="rainbow" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-pink-950/80 text-pink-300 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border border-pink-700/50">
              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
              <span>Mail Workspace</span>
            </div>
            <h1 className="text-lg sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 sm:gap-3">
              <span>Inbox</span>
            </h1>
            <p className="text-[11px] sm:text-sm text-pink-100 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
              Read, search, and send store communications, supplier purchase orders, and customer dispatch receipts.
            </p>
          </div>

          {/* Account Status / Google Login Pill */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl w-full md:w-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {userProfile?.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    className="w-11 h-11 rounded-full border-2 border-pink-400 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center border-2 border-white">
                    {userProfile?.name?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{userProfile?.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </p>
                  <p className="text-[11px] text-pink-200 font-mono">{userProfile?.email}</p>
                  <button
                    onClick={handleLogout}
                    className="mt-1 text-[10px] text-rose-300 hover:text-white flex items-center gap-1 underline font-medium cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Disconnect Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Inbox Workspace Partition */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center shadow-xl space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
            <Mail className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sign in to Access Inbox</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Log in with your Google Account to view messages, send store receipts, and manage email communications directly inside this panel.
          </p>
          <button
            onClick={handleConnectGoogle}
            className="mt-2 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-950/20 inline-flex items-center gap-3 transition-all hover:scale-105 cursor-pointer"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Connect Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[720px]">
          
          {/* Partition 1: Left 10% Navigation Rail (col-span-2 out of 12) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl p-3 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Compose Action */}
              <button
                onClick={() => setIsComposeOpen(true)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Compose</span>
              </button>

              {/* Folder List */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleFilterChange('inbox')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'inbox'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span className="truncate">Inbox</span>
                </button>

                <button
                  onClick={() => handleFilterChange('unread')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="truncate">Unread</span>
                </button>

                <button
                  onClick={() => handleFilterChange('sent')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'sent'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span className="truncate">Sent</span>
                </button>

                <button
                  onClick={() => handleFilterChange('trash')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'trash'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Trash</span>
                </button>
              </nav>
            </div>

            {/* Bottom Status Box */}
            <div className="pt-3 border-t border-slate-100 text-center space-y-2">
              <button
                onClick={() => fetchMessages()}
                disabled={loading}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
                <span>Sync</span>
              </button>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
          </div>

          {/* Partition 2: Middle Email Message List (col-span-4 out of 12) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
            {/* Search Bar Toolbar */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMessages(searchQuery)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-hidden"
                />
              </div>
            </div>

            {/* Message Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-7 h-7 text-rose-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Fetching messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Inbox className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Messages</p>
                  <p className="text-[11px] text-slate-400">Zero emails found in this filter.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = msg.id === selectedMsgId;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg.id)}
                      className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 relative ${
                        isSelected ? 'bg-rose-50/70 border-l-4 border-l-rose-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-xs truncate font-bold ${
                            msg.isUnread ? 'text-slate-900 font-black' : 'text-slate-700'
                          }`}
                        >
                          {msg.from}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      <p
                        className={`text-xs mb-1 truncate ${
                          msg.isUnread ? 'font-bold text-slate-900' : 'text-slate-800'
                        }`}
                      >
                        {msg.subject}
                      </p>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                        {msg.snippet}
                      </p>

                      {msg.isUnread && (
                        <span className="absolute top-3.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Partition 3: Right Message Detail Reading Pane (col-span-6 out of 12) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden h-full flex flex-col">
            {selectedMsgDetail ? (
              <div className="flex flex-col h-full">
                {/* Email Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-black text-slate-900 leading-snug">
                      {selectedMsgDetail.subject}
                    </h2>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTrashMessage(selectedMsgDetail.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Trash Email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setComposeTo(selectedMsgDetail.from);
                          setComposeSubject(`Re: ${selectedMsgDetail.subject}`);
                          setIsComposeOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-0.5 font-medium text-slate-600">
                    <p><span className="text-slate-400">From:</span> <strong className="text-slate-900">{selectedMsgDetail.from}</strong></p>
                    <p><span className="text-slate-400">To:</span> {selectedMsgDetail.to || 'Me'}</p>
                    <p><span className="text-slate-400">Date:</span> {selectedMsgDetail.date}</p>
                  </div>
                </div>

                {/* Email Body */}
                <div className="flex-1 p-5 overflow-y-auto bg-white text-slate-800 text-xs sm:text-sm leading-relaxed">
                  {selectedMsgDetail.body?.includes('<') ? (
                    <div
                      className="gmail-html-body"
                      dangerouslySetInnerHTML={{ __html: selectedMsgDetail.body }}
                    />
                  ) : (
                    <pre className="font-sans whitespace-pre-wrap">{selectedMsgDetail.body}</pre>
                  )}
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                <p className="text-xs font-bold text-slate-700">Loading email...</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
                <Mail className="w-12 h-12 stroke-1 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No Email Selected</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Select an email from the message list to read or reply.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-200 animate-in zoom-in-95 duration-200 relative">
            <ReflectionOverlay />
            <RightEdgeBlend variant="rainbow" />

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-900 to-pink-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-pink-300" />
                <h3 className="font-bold text-base">New Gmail Message</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {sendSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{sendSuccess}</span>
                </div>
              )}

              {sendError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{sendError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To (Recipient Email)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. supplier@textiles.co.ke or customer@gmail.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restock Order Dispatch #4092 or ETR Receipt"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write your email message here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{sending ? 'Sending...' : 'Send Gmail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
