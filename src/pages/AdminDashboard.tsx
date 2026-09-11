import React, { useState, useEffect } from 'react';
import GlassyBackground from '../components/GlassyBackground';
// @ts-ignore
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Mail, 
  Settings, 
  Bell, 
  Search, 
  LogOut,
  Plus,
  X,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Users,
  Box,
  Globe,
  Camera,
  Layers,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  Pencil,
  Menu,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ChevronRight,
  Info,
  Palette,
  ExternalLink,
  Printer,
  FileText,
  Receipt,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileJson,
  Filter,
  Lock,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ChevronLeft,
  Check,
  Sparkles,
  User,
  Laptop,
  CircleDot,
  Tag,
  Grid,
  Copy,
  EyeOff,
  Image as ImageIcon,
  Images,
  Star,
  UploadCloud,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TicketsModule from '../components/admin/TicketsModule';
import { CATEGORIES } from '../constants';
import { DEFAULT_PRODUCTS, PRICE_DISCLAIMER_NOTE, formatPriceDisplay, COLOR_HEX_MAP, getColorHex, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import { ensureProductsSeeded, ensureCategoriesSeeded, ensureSlidersSeeded, removeMockProductImagesFromFirestore, DEFAULT_HERO_SLIDES } from '../lib/firebaseSeeder';
import { compressImage, getOptimizedImageUrl, formatBytes } from '../lib/imageOptimizer';
import { cn } from '../lib/utils';
import BrandLogo from '../components/BrandLogo';
import AdminProfileModal from '../components/AdminProfileModal';
import { calculateQuoteDetails, printProformaQuote, printTaxInvoice, printReceipt } from '../lib/quoteUtils';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import {
  getCachedGmailToken,
  setCachedGmailToken,
  connectGmailAccount,
  fetchGmailInbox,
  sendGmailEmail
} from '../lib/gmail';
import type { GmailMessage } from '../lib/gmail';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  getDoc,
  setDoc,
  limit
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { usePopup } from '../components/PopupPrompt';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { toast, promptConfirm, promptAlert } = usePopup();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const lastActivityTime = React.useRef(Date.now());

  // Admin Users & Authority States
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [dashboardSettings, setDashboardSettings] = useState<any>(null);

  // Fetch registered admins and settings
  useEffect(() => {
    // Seed default Super Admin docs and clean up revoked emails
    const seedSuperAdmin = async () => {
      try {
        const superAdmins = [
          { email: 'tewawenterprises@gmail.com', name: 'TEWAW Enterprises' },
          { email: 'feminiholdings@gmail.com', name: 'Femini Holdings' }
        ];
        for (const sa of superAdmins) {
          const superAdminRef = doc(db, 'admins', sa.email.toLowerCase());
          const snap = await getDoc(superAdminRef);
          if (!snap.exists() || snap.data()?.role !== 'superadmin') {
            await setDoc(superAdminRef, {
              name: sa.name,
              email: sa.email.toLowerCase(),
              role: 'superadmin',
              addedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        // Whitelist & seed dedicated Product & Inventory Editor
        const editorRef = doc(db, 'admins', 'tww943@gmail.com');
        const editorSnap = await getDoc(editorRef);
        if (!editorSnap.exists() || editorSnap.data()?.role !== 'editor') {
          await setDoc(editorRef, {
            name: 'Product & Inventory Editor',
            email: 'tww943@gmail.com',
            role: 'editor',
            department: 'Inventory & Product Management',
            addedAt: serverTimestamp()
          }, { merge: true });
        }

        // Whitelist & seed Cyrus Mwangi as Staff Admin
        const cyrusAdminRef = doc(db, 'admins', 'mwangicyrus1186@gmail.com');
        const cyrusSnap = await getDoc(cyrusAdminRef);
        if (!cyrusSnap.exists()) {
          await setDoc(cyrusAdminRef, {
            name: 'Cyrus Mwangi',
            email: 'mwangicyrus1186@gmail.com',
            role: 'admin',
            department: 'Operations & Management',
            addedAt: serverTimestamp()
          }, { merge: true });
        }

        // Remove revoked admin accounts if they exist in database
        const revokedEmails = ['admin@tewaw.co.ke', 'info@tewaw.co.ke', 'sales@tewaw.co.ke'];
        for (const email of revokedEmails) {
          const revokedRef = doc(db, 'admins', email);
          const snap = await getDoc(revokedRef);
          if (snap.exists()) {
            await deleteDoc(revokedRef);
          }
        }
      } catch (err) {
        console.warn("Notice seeding super admin doc:", err);
      }
    };
    seedSuperAdmin();

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      setAdminUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Admins list fetch notice:", err));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) setDashboardSettings(snapshot.data());
    }, (err) => console.warn("Settings fetch notice:", err));

    return () => {
      unsubAdmins();
      unsubSettings();
    };
  }, []);

  // Constants
  const IDLE_TIMEOUT_SEC = 1800; // 30 minutes
  const WARNING_THRESHOLD_SEC = 60; // 60 seconds before logout

  // Idle Logic
  useEffect(() => {
    if (!user) {
      setShowIdleModal(false);
      return;
    }

    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // List of events to track activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastActivityTime.current) / 1000);
      
      if (elapsedSec >= IDLE_TIMEOUT_SEC) {
        handleLogout();
        clearInterval(checkInterval);
      } else if (elapsedSec >= (IDLE_TIMEOUT_SEC - WARNING_THRESHOLD_SEC)) {
        setShowIdleModal(true);
        setIdleCountdown(IDLE_TIMEOUT_SEC - elapsedSec);
      } else {
        setShowIdleModal(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(checkInterval);
    };
  }, [user]);

  // Auth Listener & Redirect Handling
  useEffect(() => {
    // Process redirect sign-in result if returning from a redirect
    getRedirectResult(auth).then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setCachedGmailToken(credential.accessToken);
        }
      }
    }).catch((err) => {
      console.warn("Redirect auth info:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        ensureProductsSeeded();
        ensureCategoriesSeeded();
        ensureSlidersSeeded();
      }
    });
    return () => unsubscribe();
  }, []);

  // Notifications Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));
  }, [user]);

  // Support Tickets Real-time Counter
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tickets'));
    return onSnapshot(q, (snapshot) => {
      const openCount = snapshot.docs.filter(d => {
        const data = d.data();
        return data.status === 'open' || data.status === 'in_progress';
      }).length;
      setOpenTicketsCount(openCount);
    }, (err) => {
      console.warn("Tickets count notice:", err);
    });
  }, [user]);

  const handleLoginWithRedirect = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setLoginError('Domain pending Firebase authorization in Google Cloud Console. Please authenticate with Email & Password or authorize this domain.');
      } else {
        setLoginError(err.message || 'Redirect authentication failed');
      }
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      if (loginMode === 'google') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setCachedGmailToken(credential.accessToken);
          }
        } catch (popupErr: any) {
          const popStr = String(popupErr?.code || popupErr?.message || popupErr || '');
          if (popStr.includes('unauthorized-domain')) {
            setLoginError('Domain pending Firebase authorization in Google Cloud Console. Please authenticate with Email & Password or authorize this domain.');
            return;
          }
          if (
            popStr.includes('popup-blocked') ||
            popStr.includes('cancelled-popup-request') ||
            popStr.includes('popup-closed-by-user') ||
            popStr.includes('popup_closed')
          ) {
            console.warn('Pop-up blocked or closed by user, switching to redirect sign-in...');
            try {
              await signInWithRedirect(auth, provider);
              return;
            } catch (redirectErr: any) {
              console.warn('Redirect trigger exception:', redirectErr);
              if (redirectErr?.code === 'auth/unauthorized-domain') {
                setLoginError('Domain pending Firebase authorization in Google Cloud Console. Please authenticate with Email & Password.');
                return;
              }
            }
          }
          throw popupErr;
        }
      } else {
        if (isSignUp) {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        } else {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
          } catch (emailErr: any) {
            if (emailErr?.code === 'auth/user-not-found' || emailErr?.code === 'auth/invalid-credential') {
              setLoginError('Account not found or password incorrect. If this is your first time logging in with this email, click "Need an account? Register Email" below.');
              return;
            }
            throw emailErr;
          }
        }
      }
    } catch (error: any) {
      const errStr = String(error?.code || error?.message || error || '');
      if (
        errStr.includes('cancelled-popup-request') ||
        errStr.includes('popup-closed-by-user') ||
        errStr.includes('popup-blocked') ||
        errStr.includes('popup_closed')
      ) {
        console.warn('Google sign-in popup closed or blocked by user:', errStr);
        setLoginError('Pop-up window was closed or blocked by browser. You can click "Sign In via Page Redirect" below or use Email login.');
      } else if (errStr.includes('unauthorized-domain')) {
        setLoginError('This domain is pending Firebase authorization in Google Cloud Console. Please use Email login.');
      } else {
        console.error("Login failed:", error);
        setLoginError(error.message || 'Authentication failed');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      setCachedGmailToken(null);
      setIsProfileDropdownOpen(false);
      setIsProfileModalOpen(false);
      setIsMobileSidebarOpen(false);
      await signOut(auth);
      setUser(null);
      toast.success('Session Terminated', 'You have been safely signed out of the TEWAW Admin Panel.');
      navigate('/');
    } catch (err: any) {
      console.warn("Logout notice:", err);
      navigate('/');
    }
  };

  const SUPER_ADMIN_EMAILS = [
    'feminiholdings@gmail.com',
    'tewawenterprises@gmail.com'
  ];

  const WHITELISTED_ADMIN_EMAILS = [
    'mwangicyrus1186@gmail.com'
  ];

  const WHITELISTED_EDITOR_EMAILS = [
    'tww943@gmail.com'
  ];

  const rawEmail = user?.email || user?.providerData?.[0]?.email || '';
  const userEmailLower = rawEmail.trim().toLowerCase();
  const isEmailSuperAdmin = !!userEmailLower && SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmailLower);
  const isEmailWhitelistedAdmin = !!userEmailLower && WHITELISTED_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmailLower);
  const isEmailWhitelistedEditor = !!userEmailLower && WHITELISTED_EDITOR_EMAILS.some(e => e.toLowerCase() === userEmailLower);
  const isEmailListedAdmin = !!userEmailLower && (
    isEmailSuperAdmin || 
    isEmailWhitelistedAdmin ||
    isEmailWhitelistedEditor ||
    adminUsers.some((a: any) => {
      const aEmail = (a.email || a.id || '').trim().toLowerCase();
      return aEmail === userEmailLower;
    })
  );
  
  // Gated Admin Access with Google & Registered Admin Verification
  const IS_ADMIN_GATED = true;
  const isAuthorized = isEmailSuperAdmin || isEmailListedAdmin;
  const isSuperAdmin = isEmailSuperAdmin || (!!userEmailLower && !isEmailWhitelistedEditor && !isEmailWhitelistedAdmin && adminUsers.some((a: any) => (a.email || a.id || '').toLowerCase() === userEmailLower && a.role === 'superadmin'));

  // Precise role identification
  const matchedAdminDoc = adminUsers.find((a: any) => (a.email || a.id || '').trim().toLowerCase() === userEmailLower);
  const userRole: 'superadmin' | 'admin' | 'editor' = (() => {
    if (isEmailSuperAdmin) return 'superadmin';
    if (isEmailWhitelistedEditor) return 'editor';
    if (isEmailWhitelistedAdmin) return 'admin';
    if (matchedAdminDoc?.role === 'superadmin') return 'superadmin';
    if (matchedAdminDoc?.role === 'editor') return 'editor';
    return 'admin';
  })();
  const isEditor = userRole === 'editor';
  const roleDisplayLabel = isSuperAdmin ? 'Super Administrator' : (isEditor ? 'Product & Inventory Editor' : 'Staff Admin');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-light">
        <RefreshCw className="w-10 h-10 text-brand-blue animate-spin" />
      </div>
    );
  }

  // State 1: Unauthenticated -> Show Admin Sign-In Portal
  if (IS_ADMIN_GATED && !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-light p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center max-w-md w-full brand-edge-orange my-auto"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border border-slate-100">
            <img referrerPolicy="no-referrer" src="https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-display font-black text-brand-blue mb-1 uppercase tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 mb-6 text-xs font-medium">Authorized TEWAW Enterprises Management System</p>
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('google'); setLoginError(''); }}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${loginMode === 'google' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.57-1.02-1.32-1.19-2.09z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('email'); setLoginError(''); }}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${loginMode === 'email' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Email & Password
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {loginMode === 'google' && (
            <div className="space-y-3">
              <button 
                disabled={isLoggingIn}
                onClick={() => handleLogin()}
                className="w-full py-4 bg-white text-slate-800 border-2 border-slate-200 hover:border-brand-blue rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm active:scale-[0.99]"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 text-brand-blue animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.57-1.02-1.32-1.19-2.09z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                {isLoggingIn ? 'Authenticating...' : 'Sign in with Google Account'}
              </button>

              <button
                type="button"
                onClick={handleLoginWithRedirect}
                className="w-full py-2.5 px-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-xs"
              >
                <Globe className="w-3.5 h-3.5 shrink-0 text-brand-orange" /> Sign In via Page Redirect
              </button>
            </div>
          )}

          {loginMode === 'email' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <input 
                type="email" 
                placeholder="Admin Email Address" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                required
              />
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-brand-blue/20 text-xs disabled:opacity-50"
              >
                {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Create Authorized Account' : 'Access Dashboard')}
              </button>
              
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[11px] text-slate-500 hover:text-brand-blue font-bold transition-colors"
                >
                  {isSignUp ? 'Already registered? Sign In' : 'Need an account? Register Email'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <button 
              onClick={() => navigate('/')}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors"
            >
              Return to Public Storefront
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // State 2: Authenticated but NOT in Admin List -> Show Access Denied View
  if (IS_ADMIN_GATED && user && !isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-light p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-red-100 text-center max-w-md w-full brand-edge-orange"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-display font-black text-brand-blue mb-1 uppercase">Access Restricted</h2>
          <p className="text-slate-500 mb-4 text-xs">This Google account is authenticated but lacks administrator privileges on TEWAW Enterprises.</p>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left mb-6 font-mono text-xs text-slate-700 flex items-center justify-between">
            <span className="text-slate-400 font-sans text-[10px] font-bold uppercase">Connected:</span>
            <span className="font-bold truncate max-w-[200px] text-brand-blue">{user.email || 'Google User'}</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-1 mb-6">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <KeyRound className="w-3.5 h-3.5 text-brand-orange" /> Need Administrative Access?
            </p>
            <p className="text-[11px] text-amber-850">
              Please sign in with a registered Super Admin account (e.g. <span className="font-semibold text-brand-orange">tewawenterprises@gmail.com</span>) or request your administrator to add your email to the Team List.
            </p>
          </div>

          <div className="space-y-2.5">
            <button 
              onClick={handleLogout}
              className="w-full py-3.5 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-md text-xs"
            >
              <LogOut className="w-4 h-4 shrink-0" /> Sign Out & Switch Google Account
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs"
            >
              Return to Store
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket, path: '/admin/tickets', badge: openTicketsCount },
    { id: 'sliders', label: 'Hero Slides', icon: Layers, path: '/admin/sliders' },
    { id: 'categories', label: 'Collections & Circles', icon: CircleDot, path: '/admin/categories' },
    { id: 'gallery', label: 'Gallery', icon: Camera, path: '/admin/gallery' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'mail', label: 'Webmail', icon: Mail, path: '/admin/mail' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users', hidden: !isSuperAdmin },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden font-sans relative">
      <GlassyBackground />
      {/* Mobile Fullscreen Navigation Menu */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] lg:hidden bg-gradient-to-b from-brand-blue via-[#071F57] to-slate-950 text-white flex flex-col h-full w-full overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-0 w-80 h-80 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header Bar */}
            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-white/10 shrink-0 relative z-10 backdrop-blur-md bg-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl shadow-white/10 p-0.5 border border-white/20">
                  <img 
                    referrerPolicy="no-referrer"
                    src={dashboardSettings?.headerLogoUrl || "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg"} 
                    alt="TEWAW Logo" 
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg";
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-widest uppercase text-white font-display">TEWAW ENTERPRISE</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-[10px] text-brand-orange font-black uppercase tracking-wider">Admin Control Panel</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-11 h-11 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-2xl flex items-center justify-center transition-colors border border-white/15 shadow-lg"
                title="Close Menu"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Authenticated User Status Strip */}
            {user && (
              <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0 text-xs">
                <div className="flex items-center gap-2 truncate text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                  <span className="text-[11px] truncate">{user.email || 'Authorized Staff'}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded-lg shrink-0">
                  {roleDisplayLabel}
                </span>
              </div>
            )}

            {/* Fullscreen Navigation Links Grid */}
            <nav className="flex-1 px-5 py-6 space-y-2 overflow-y-auto relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 px-3 mb-2">
                Management Modules
              </p>
              {navItems.filter(item => !item.hidden).map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path || (item.id === 'overview' && currentPath === '/admin');
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl transition-all relative group border",
                        isActive 
                          ? "bg-gradient-to-r from-brand-orange/25 to-brand-orange/10 text-white border-brand-orange/40 shadow-lg shadow-brand-orange/15 font-black" 
                          : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/5 font-bold"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative",
                          isActive ? "bg-brand-orange text-white" : "bg-white/10 text-white/80 group-hover:text-white"
                        )}>
                          <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base tracking-wide">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        isActive ? "text-brand-orange translate-x-1" : "text-white/30 group-hover:translate-x-1 group-hover:text-white/60"
                      )} />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Bottom Footer Actions */}
            <div className="p-5 border-t border-white/10 bg-slate-950/60 backdrop-blur-md shrink-0 space-y-2.5 relative z-10">
              <button
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                <User className="w-4 h-4 text-brand-orange" />
                <span>My Profile & Security</span>
              </button>
              <Link
                to="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-2.5 py-3 bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/40 text-brand-green rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Return to Public Storefront</span>
              </Link>
              <button 
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  promptConfirm({
                    title: 'Sign Out Administrator',
                    message: 'Are you sure you want to end your admin session and sign out?',
                    confirmText: 'Sign Out',
                    variant: 'danger',
                    icon: 'alert',
                    onConfirm: () => handleLogout()
                  });
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-2xl text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Admin</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar - Positioned at z-40 so sidebar passes BEHIND it at the junction */}
      <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between z-40 shrink-0 relative shadow-xl shadow-brand-blue/10">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-brand-blue/20 transition-all"
            title="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-xl transition-all"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Junction Brand Logo Title Badge */}
          <div className="flex items-center gap-3 pr-3 border-r border-slate-200/80">
            <motion.div 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-black shrink-0 shadow-md shadow-brand-blue/20 cursor-pointer border border-slate-200 bg-white"
              title="TEWAW Enterprises Control Center"
            >
              <img 
                referrerPolicy="no-referrer"
                src={dashboardSettings?.headerLogoUrl || "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg"} 
                alt="TEWAW Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg";
                }}
              />
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-black tracking-widest text-brand-blue uppercase leading-none">TEWAW</span>
              <span className="text-[9px] text-brand-orange font-bold uppercase tracking-tighter mt-0.5">Control Center</span>
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-display font-black text-brand-blue uppercase tracking-tight truncate max-w-[150px] md:max-w-none ml-1">
            {navItems.find(n => n.path === currentPath || (n.id === 'overview' && currentPath === '/admin'))?.label || 'Overview'}
          </h2>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative hidden md:block text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
            <span className="w-2 h-2 bg-success-bright rounded-full inline-block mr-2 animate-pulse" />
            Live System
          </div>
          
          <div className="relative">
            <button className="p-2 text-slate-400 hover:text-brand-blue relative group transition-colors">
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full border-2 border-white animate-ping" />
              )}
              {/* Simple Notification Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all origin-top-right z-50">
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Recent Alerts</h4>
                <div className="space-y-3">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="text-[10px] flex flex-col gap-1 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                      <span className="font-bold text-brand-blue">{n.title}</span>
                      <span className="text-slate-500">{n.message}</span>
                      <span className="text-slate-300 uppercase">{n.createdAt?.toDate ? format(n.createdAt.toDate(), 'HH:mm') : 'Just now'}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 text-center py-4">No new notifications</p>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Profile Trigger & Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-slate-200 hover:opacity-95 transition-opacity text-left group focus:outline-none"
              title="Admin Profile & Settings"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-brand-blue leading-none group-hover:text-brand-orange transition-colors">
                  {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Authorized Staff')}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {roleDisplayLabel}
                  </p>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.08 }}
                className="w-10 h-10 bg-white rounded-full border-2 border-brand-orange/40 shadow-md overflow-hidden whitespace-nowrap cursor-pointer ring-2 ring-brand-blue/10 shrink-0"
              >
                <img 
                  referrerPolicy="no-referrer" 
                  src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform hidden sm:block", isProfileDropdownOpen && "rotate-180 text-brand-blue")} />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-3 z-50 overflow-hidden"
                  >
                    {/* Header Info */}
                    <div className="p-3.5 bg-gradient-to-br from-brand-blue via-[#071F57] to-slate-900 text-white rounded-2xl mb-2">
                      <p className="text-xs font-black uppercase tracking-wider truncate">
                        {user?.displayName || 'Administrator'}
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono truncate mt-0.5">
                        {user?.email || 'Authorized System Session'}
                      </p>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-orange/20 border border-brand-orange/40 rounded-lg text-[9px] font-black text-brand-orange uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        {roleDisplayLabel}
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-brand-blue shrink-0" />
                        <span>Profile & Security Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Platform Brand Settings</span>
                      </button>

                      <Link
                        to="/"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-green transition-colors text-left"
                      >
                        <Eye className="w-4 h-4 text-brand-green shrink-0" />
                        <span>Public Storefront</span>
                      </Link>

                      <div className="pt-2 mt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            promptConfirm({
                              title: 'Sign Out Administrator',
                              message: 'Are you sure you want to end your administrator session?',
                              confirmText: 'Sign Out Now',
                              variant: 'danger',
                              icon: 'alert',
                              onConfirm: () => handleLogout()
                            });
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out / Log Out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Edge Single Wave Design */}
        <div className="absolute -bottom-3.5 left-0 right-0 w-full overflow-hidden pointer-events-none z-20 leading-none">
          <svg 
            className="w-full h-4 text-white fill-current filter drop-shadow-[0_4px_6px_rgba(11,44,122,0.08)]" 
            viewBox="0 0 1440 48" 
            preserveAspectRatio="none"
          >
            <path d="M0,0 C480,40 960,40 1440,0 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </header>

      {/* Main Body Layout Row */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar - Positioned at z-20 so it glides BEHIND the header bar at top */}
        <aside 
          className={cn(
            "bg-brand-blue text-white transition-all duration-300 hidden lg:flex flex-col z-20 shadow-[8px_0_30px_rgba(11,44,122,0.15)] relative border-r border-white/10",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          {/* Desktop Sidebar Top Logo Banner */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/20 p-0.5">
              <img 
                referrerPolicy="no-referrer"
                src={dashboardSettings?.headerLogoUrl || "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg"} 
                alt="TEWAW Logo" 
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg";
                }}
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-black text-sm uppercase tracking-wider text-white truncate">TEWAW ENTERPRISE</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green truncate">Control Panel</span>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.filter(item => !item.hidden).map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.id === 'overview' && currentPath === '/admin');
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-all relative z-10 group",
                      isActive 
                        ? "text-brand-orange font-black" 
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarTab"
                        className="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-brand-orange shadow-lg shadow-brand-orange/10 z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "stroke-[2.5] text-brand-orange" : "stroke-[2]")} />
                    {isSidebarOpen && (
                      <div className="flex items-center justify-between flex-1 relative z-10">
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-2">
            {isSidebarOpen && (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-xl"
              >
                <User className="w-4 h-4 text-brand-orange" />
                <span>My Profile Settings</span>
              </button>
            )}
            <motion.button 
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                promptConfirm({
                  title: 'Exit Admin Session',
                  message: 'Are you sure you want to end your administrator session and log out?',
                  confirmText: 'Log Out',
                  variant: 'danger',
                  icon: 'alert',
                  onConfirm: () => handleLogout()
                });
              }}
              className="w-full flex items-center gap-4 p-3 text-red-300 hover:text-white hover:bg-red-500/20 transition-colors rounded-xl font-bold"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-wider">Log Out</span>}
            </motion.button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative pb-32 lg:pb-8">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              <motion.div
                key={currentPath}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Routes>
                  <Route path="/" element={<OverviewModule notifications={notifications} />} />
                  <Route path="/tickets" element={<TicketsModule user={user} />} />
                  <Route path="/sliders" element={<SlidersModule />} />
                  <Route path="/categories" element={<CategoriesModule />} />
                  <Route path="/gallery" element={<GalleryModule />} />
                  <Route path="/products" element={<ProductsModule />} />
                  <Route path="/orders" element={<OrdersModule />} />
                  <Route path="/mail" element={<MailModule user={user} />} />
                  <Route path="/users" element={isSuperAdmin ? <UsersModule /> : <OverviewModule notifications={notifications} />} />
                  <Route path="/settings" element={<SettingsModule user={user} isSuperAdmin={isSuperAdmin} roleDisplayLabel={roleDisplayLabel} onLogout={handleLogout} onOpenProfileModal={() => setIsProfileModalOpen(true)} />} />
                </Routes>
              </motion.div>
            </div>

            {/* Admin Footer */}
            <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 pb-2 text-center md:text-left">
              <div className="flex items-center gap-4">
                <BrandLogo size="sm" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Admin Management Suite v2.4</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand-orange uppercase tracking-widest transition-colors group">
                  <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  View Site
                </Link>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-success-bright rounded-full animate-pulse" />
                  System Online
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                  © {new Date().getFullYear()} Tewaw Holdings
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        {/* Single Wave Top Curve SVG */}
        <div className="w-full overflow-hidden leading-none pointer-events-none -mb-[2px]">
          <svg 
            viewBox="0 0 1000 60" 
            className="w-full h-7 sm:h-9 text-white fill-current block filter drop-shadow-[0_-4px_6px_rgba(0,0,0,0.06)]"
            preserveAspectRatio="none"
          >
            {/* Wave top border line */}
            <path 
              d="M 0,28 C 250,58 750,-2 1000,28" 
              fill="none" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
            />
            {/* Single Sine Wave filled area */}
            <path 
              d="M 0,28 C 250,58 750,-2 1000,28 L 1000,60 L 0,60 Z" 
            />
          </svg>
        </div>

        <div className="bg-white border-t border-slate-100 px-2 sm:px-4 py-2 pb-6 shadow-2xl relative">
          <div className="grid grid-cols-5 items-end text-center">
          {/* 1. Overview */}
          <Link
            to="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all py-1",
              currentPath === '/admin' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              currentPath === '/admin' ? "bg-brand-orange/10" : ""
            )}>
              <LayoutDashboard className={cn("w-5 h-5", currentPath === '/admin' ? "stroke-[2.5]" : "stroke-[2]")} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Overview</span>
          </Link>

          {/* 2. Orders */}
          <Link
            to="/admin/orders"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all py-1",
              currentPath === '/admin/orders' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              currentPath === '/admin/orders' ? "bg-brand-orange/10" : ""
            )}>
              <ShoppingCart className={cn("w-5 h-5", currentPath === '/admin/orders' ? "stroke-[2.5]" : "stroke-[2]")} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Orders</span>
          </Link>

          {/* 3. Center Big Icon: Add New Product */}
          <div className="flex flex-col items-center justify-center relative -top-3">
            <button
              onClick={() => {
                navigate('/admin/products', { state: { openAddModal: true } });
                window.dispatchEvent(new CustomEvent('open-add-product-modal'));
              }}
              className="w-13 h-13 sm:w-14 sm:h-14 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-orange/40 border-4 border-white active:scale-90 transition-all hover:bg-brand-orange/90"
              title="Add New Product"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-black text-brand-orange uppercase tracking-tighter mt-0.5">Add New</span>
          </div>

          {/* 4. Products */}
          <Link
            to="/admin/products"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all py-1",
              currentPath === '/admin/products' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              currentPath === '/admin/products' ? "bg-brand-orange/10" : ""
            )}>
              <Package className={cn("w-5 h-5", currentPath === '/admin/products' ? "stroke-[2.5]" : "stroke-[2]")} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Products</span>
          </Link>

          {/* 5. Settings */}
          <Link
            to="/admin/settings"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all py-1",
              currentPath === '/admin/settings' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              currentPath === '/admin/settings' ? "bg-brand-orange/10" : ""
            )}>
              <Settings className={cn("w-5 h-5", currentPath === '/admin/settings' ? "stroke-[2.5]" : "stroke-[2]")} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Settings</span>
          </Link>
        </div>
      </div>
    </nav>

      {/* Session Idle Modal */}
      <AnimatePresence>
        {showIdleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-blue/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 text-center max-w-md w-full brand-edge-orange relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(idleCountdown / 30) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full bg-brand-orange"
                />
              </div>
              
              <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange mx-auto mb-8 animate-pulse">
                <RefreshCw className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <h3 className="text-3xl font-display font-black text-brand-blue mb-2 uppercase italic tracking-tighter">Session Expiring</h3>
              <p className="text-slate-500 mb-8 font-medium">You've been idle for a while. Logging off in <span className="text-brand-orange font-black text-xl tabular-nums">{idleCountdown}s</span></p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    lastActivityTime.current = Date.now();
                    setShowIdleModal(false);
                  }}
                  className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:translate-x-1 hover:-translate-y-1 transition-all shadow-xl shadow-brand-blue/20"
                >
                  Continue Working
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Log Off Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Profile & Security Settings Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        isSuperAdmin={isSuperAdmin}
        onLogout={handleLogout}
        dashboardSettings={dashboardSettings}
      />
    </div>
  );
}
function SlidersModule() {
  const { toast, promptConfirm } = usePopup();
  const [sliders, setSliders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'manage' | 'single' | 'batch' | 'presets'>('manage');
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Single slide form state
  const [formData, setFormData] = useState({ 
    title: '', 
    subtitle: '',
    description: '', 
    imageUrl: '', 
    buttonText: 'Explore Collection', 
    buttonLink: '#categories',
    badge: '100% Kenyan',
    status: 'active' as 'active' | 'inactive',
    order: 0
  });

  // Batch slides queue
  interface BatchSlideItem {
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    buttonText: string;
    buttonLink: string;
    status: 'active' | 'inactive';
  }
  const [batchQueue, setBatchQueue] = useState<BatchSlideItem[]>([]);

  // Curated Kenyan Factory Photo Presets
  const PHOTO_PRESETS = [
    {
      title: 'HEAVYWEIGHT FLEECE',
      subtitle: 'TACTICAL MANUFACTURING',
      description: 'Kenyan craftsmanship meets global standards. 100% brushed Kenyan cotton fleece hoodies and sweatshirts.',
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1200',
      badge: '100% Kenyan Fleece',
      buttonText: 'Explore Fleeces',
      buttonLink: '#categories'
    },
    {
      title: 'PRECISION EMBROIDERY',
      subtitle: 'HIGH-SPEED THREAD CRAFT',
      description: 'Computerized multi-head Japanese embroidery machinery for ultra-sharp school and corporate logos.',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
      badge: 'Custom Embroidery',
      buttonText: 'Order Branding',
      buttonLink: 'https://wa.me/254736619688'
    },
    {
      title: 'INSTITUTIONAL UNIFORMS',
      subtitle: 'DURABLE SCHOOL & HOSPITAL WEAR',
      description: 'Lab coats, patient gowns, school skirts, tracksuits and blazers engineered for 3+ years daily wear.',
      imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200',
      badge: 'KEBS Standard',
      buttonText: 'Bulk Uniforms',
      buttonLink: '#categories'
    },
    {
      title: 'TACTICAL & SECURITY',
      subtitle: 'REINFORCED HEAVY DRILL',
      description: 'Security sweaters, cargo combat trousers, reflector jackets, and rip-stop field combat attire.',
      imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=1200',
      badge: 'Reinforced Drill',
      buttonText: 'Security Apparel',
      buttonLink: '#categories'
    },
    {
      title: 'SPORTS & ATHLETICS KITS',
      subtitle: 'SUBLIMATED DRY-FIT POLYESTER',
      description: 'Moisture-wicking athletic jerseys, basketball kits, football uniforms, and warm-up tracksuits.',
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=1200',
      badge: 'Dry-Fit Performance',
      buttonText: 'Order Sports Kits',
      buttonLink: 'https://wa.me/254736619688'
    },
    {
      title: 'CORPORATE EXECUTIVE POLOS',
      subtitle: 'PIQUE COTTON ELEGANCE',
      description: 'Heavy pique cotton polo shirts and executive knitwear for top Kenyan corporate institutions.',
      imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1200',
      badge: 'Corporate Regalia',
      buttonText: 'Executive Catalog',
      buttonLink: '#categories'
    }
  ];

  // Quick Badge Suggestions
  const BADGE_PRESETS = [
    '100% Kenyan',
    'Direct Factory Prices',
    'Heavyweight Fleece',
    'KEBS Approved',
    'Fast Nairobi Delivery',
    'Custom Embroidery',
    'Bulk Order Discounts',
    'School Uniforms',
    'Security Regalia'
  ];

  // Quick CTA Link Suggestions
  const LINK_PRESETS = [
    { label: 'Collection Grid', link: '#categories' },
    { label: 'Product Catalog', link: '#products' },
    { label: 'Instant WhatsApp', link: 'https://wa.me/254736619688' },
    { label: 'Call Factory', link: 'tel:+254736619688' },
    { label: 'Request Quote', link: '#quote' },
    { label: 'Our Story', link: '/about' }
  ];

  useEffect(() => {
    const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setSliders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sliders'));
  }, []);

  const handleSyncDefaults = async () => {
    promptConfirm({
      title: 'Sync Default Hero Slides',
      message: 'This will seed and synchronize the default Kenyan factory hero slides into your Firestore database. Continue?',
      confirmText: 'Sync Hero Slides',
      variant: 'primary',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          for (const slide of DEFAULT_HERO_SLIDES) {
            await setDoc(doc(db, 'sliders', slide.id), {
              ...slide,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          toast.success('Hero Slides Synchronized', 'Default hero carousel slides saved to database.');
        } catch (err: any) {
          toast.error('Sync Failed', err?.message || 'Could not synchronize slides.');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      subtitle: '',
      description: '', 
      imageUrl: '', 
      buttonText: 'Explore Collection', 
      buttonLink: '#categories',
      badge: '100% Kenyan',
      status: 'active',
      order: sliders.length + 1
    });
    setEditingId(null);
    setActiveTab('manage');
  };

  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  const processAndCompressFile = async (file: File, callback: (url: string) => void) => {
    try {
      const res = await compressImage(file, { maxDimension: 1400, quality: 0.84, format: 'image/webp' });
      callback(res.dataUrl);
      const info = `${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)} (${res.reductionPercentage}% lighter)`;
      setCompressionInfo(info);
      toast.info('Image Optimized', `Image converted to WebP: ${info}`);
    } catch (err: any) {
      console.error('Image compression error:', err);
      // Fallback to simple reader
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSingleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSingle(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndCompressFile(file, (url) => setFormData(prev => ({ ...prev, imageUrl: url })));
    }
  };

  const handleSingleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressFile(file, (url) => setFormData(prev => ({ ...prev, imageUrl: url })));
    }
  };

  // Batch Image Handler - Can accept multiple image files
  const handleBatchFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.warning('No Images', 'Please choose valid image files.');
      return;
    }

    let totalOriginal = 0;
    let totalCompressed = 0;
    const newItems: BatchSlideItem[] = [];

    for (let idx = 0; idx < validFiles.length; idx++) {
      const file = validFiles[idx];
      try {
        const res = await compressImage(file, { maxDimension: 1400, quality: 0.84, format: 'image/webp' });
        totalOriginal += res.originalSize;
        totalCompressed += res.compressedSize;

        const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const cleanTitle = rawName.length > 2 ? rawName.toUpperCase() : `HERO SLIDE ${sliders.length + batchQueue.length + idx + 1}`;

        newItems.push({
          id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          imageUrl: res.dataUrl,
          title: cleanTitle,
          subtitle: 'FACTORY DIRECT MANUFACTURING',
          description: 'Engineered with premium Kenyan craftsmanship and heavy-duty reinforced construction.',
          badge: '100% Kenyan',
          buttonText: 'Explore Collection',
          buttonLink: '#categories',
          status: 'active'
        });
      } catch (err) {
        console.error('Error compressing batch image:', err);
      }
    }

    if (newItems.length > 0) {
      setBatchQueue(prev => [...prev, ...newItems]);
      const savedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;
      toast.success(
        'Batch Optimized & Ready',
        `${newItems.length} image(s) processed. Total size reduced from ${formatBytes(totalOriginal)} to ${formatBytes(totalCompressed)} (${savedPct}% saved).`
      );
    }
  };

  const handleBatchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBatch(false);
    if (e.dataTransfer.files?.length) {
      handleBatchFiles(e.dataTransfer.files);
    }
  };

  const handleBatchImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleBatchFiles(e.target.files);
    }
  };

  const handleEdit = (slide: any) => {
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      imageUrl: slide.imageUrl || '',
      buttonText: slide.buttonText || 'Explore Collection',
      buttonLink: slide.buttonLink || '#categories',
      badge: slide.badge || '100% Kenyan',
      status: slide.status || 'active',
      order: slide.order ?? sliders.length + 1
    });
    setEditingId(slide.id);
    setActiveTab('single');
  };

  const handleDuplicate = async (slide: any) => {
    try {
      const highestOrder = sliders.reduce((max, s) => Math.max(max, s.order || 0), 0);
      await addDoc(collection(db, 'sliders'), {
        title: `${slide.title} (Copy)`,
        subtitle: slide.subtitle || '',
        description: slide.description || '',
        imageUrl: slide.imageUrl || '',
        buttonText: slide.buttonText || 'Explore Collection',
        buttonLink: slide.buttonLink || '#categories',
        badge: slide.badge || '100% Kenyan',
        status: slide.status || 'active',
        order: highestOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Slide Duplicated', `Created duplicate of "${slide.title}".`);
    } catch (err: any) {
      toast.error('Failed to Duplicate', err?.message || 'Could not duplicate slide.');
    }
  };

  const handleAddPreset = async (preset: typeof PHOTO_PRESETS[0]) => {
    try {
      const highestOrder = sliders.reduce((max, s) => Math.max(max, s.order || 0), 0);
      await addDoc(collection(db, 'sliders'), {
        ...preset,
        status: 'active',
        order: highestOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Hero Preset Added', `Added "${preset.title}" to your homepage hero carousel.`);
    } catch (err: any) {
      toast.error('Failed to Add Preset', err?.message || 'Could not save preset slide.');
    }
  };

  const handleToggleStatus = async (slide: any) => {
    const nextStatus = slide.status === 'inactive' ? 'active' : 'inactive';
    try {
      await setDoc(doc(db, 'sliders', slide.id), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.info(
        nextStatus === 'active' ? 'Slide Activated' : 'Slide Hidden',
        `"${slide.title}" is now ${nextStatus === 'active' ? 'visible on homepage' : 'hidden from public view'}.`
      );
    } catch (err: any) {
      toast.error('Status Error', err?.message || 'Could not change slide status.');
    }
  };

  const handleSubmitSingle = async () => {
    if (!formData.title || !formData.imageUrl) {
      toast.warning('Missing Information', 'Please provide a slide title and image.');
      return;
    }
    try {
      if (editingId) {
        await setDoc(doc(db, 'sliders', editingId), {
          ...formData,
          order: Number(formData.order) || 0,
          updatedAt: serverTimestamp()
        }, { merge: true });
        toast.success('Hero Slide Updated', `Slide "${formData.title}" updated successfully.`);
      } else {
        await addDoc(collection(db, 'sliders'), {
          ...formData,
          order: Number(formData.order) || (sliders.length + 1),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Hero Slide Added', `New slide "${formData.title}" published to homepage.`);
      }
      resetForm();
    } catch (err: any) {
      toast.error('Failed to Save Slide', err?.message || 'Could not save hero slide.');
    }
  };

  const handlePublishBatch = async () => {
    if (batchQueue.length === 0) {
      toast.warning('Queue Empty', 'Please upload at least one image before publishing.');
      return;
    }

    setIsSubmittingBatch(true);
    try {
      let currentOrder = sliders.reduce((max, s) => Math.max(max, s.order || 0), 0);
      for (const item of batchQueue) {
        currentOrder += 1;
        await addDoc(collection(db, 'sliders'), {
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          imageUrl: item.imageUrl,
          badge: item.badge,
          buttonText: item.buttonText,
          buttonLink: item.buttonLink,
          status: item.status,
          order: currentOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast.success('Batch Published', `Successfully added ${batchQueue.length} new hero slide(s) to homepage.`);
      setBatchQueue([]);
      setActiveTab('manage');
    } catch (err: any) {
      toast.error('Batch Upload Failed', err?.message || 'Could not save batch slides.');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    promptConfirm({
      title: 'Delete Hero Slide',
      message: `Are you sure you want to remove "${title}" from the homepage hero carousel?`,
      confirmText: 'Delete Slide',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'sliders', id));
          toast.success('Slide Removed', 'Hero slide removed from database.');
        } catch (err: any) {
          toast.error('Failed to Delete', err?.message || 'Could not delete hero slide.');
        }
      }
    });
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      await setDoc(doc(db, 'sliders', id), { order: newOrder, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err: any) {
      toast.error('Failed to Reorder', err?.message || 'Could not reorder slide.');
    }
  };

  const moveSlide = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sliders.length) return;

    const currentSlide = sliders[currentIndex];
    const targetSlide = sliders[targetIndex];

    const currentOrder = currentSlide.order ?? (currentIndex + 1);
    const targetOrder = targetSlide.order ?? (targetIndex + 1);

    try {
      await Promise.all([
        setDoc(doc(db, 'sliders', currentSlide.id), { order: targetOrder, updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'sliders', targetSlide.id), { order: currentOrder, updatedAt: serverTimestamp() }, { merge: true })
      ]);
      toast.info('Slide Reordered', `Moved slide ${direction}.`);
    } catch (err: any) {
      toast.error('Reorder Failed', err?.message || 'Could not swap slide positions.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">
                Hero Carousel & Images Manager
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Upload single or multiple hero banner images, select presets, customize copy & CTAs, and organize playback order.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => { resetForm(); setActiveTab('manage'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              activeTab === 'manage'
                ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Active Slides ({sliders.length})</span>
          </button>

          <button
            onClick={() => { resetForm(); setActiveTab('single'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              activeTab === 'single'
                ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20"
                : "bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Slide</span>
          </button>

          <button
            onClick={() => { setActiveTab('batch'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              activeTab === 'batch'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Batch Upload ({batchQueue.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('presets'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              activeTab === 'presets'
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Factory Presets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BATCH / MULTIPLE IMAGE UPLOAD */}
      {activeTab === 'batch' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 md:p-8 rounded-[36px] border border-purple-200 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                  Multi-Image Hero Loader
                </span>
                <h3 className="text-xl font-display font-black text-brand-blue uppercase mt-1">
                  Upload Multiple Hero Images at Once
                </h3>
                <p className="text-xs text-slate-500">
                  Select 2, 5, or 10+ photos from your computer or phone. They will be auto-compressed, formatted, and queued for 1-click publishing.
                </p>
              </div>

              {batchQueue.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setBatchQueue([])}
                    className="px-4 py-2.5 text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-wider"
                  >
                    Clear Queue
                  </button>
                  <button
                    onClick={handlePublishBatch}
                    disabled={isSubmittingBatch}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isSubmittingBatch ? 'Publishing...' : `Publish All (${batchQueue.length}) to Carousel`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drag and Drop Zone for Multiple Images */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setIsDraggingBatch(true); }}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingBatch(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingBatch(false); }}
              onDrop={handleBatchDrop}
              className={cn(
                "border-2 border-dashed rounded-[28px] p-8 md:p-12 text-center transition-all cursor-pointer relative overflow-hidden",
                isDraggingBatch
                  ? "border-purple-500 bg-purple-50/80 scale-[1.01]"
                  : "border-slate-300 bg-slate-50/60 hover:bg-purple-50/30 hover:border-purple-400"
              )}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleBatchImagePick}
              />
              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-base md:text-lg font-black text-brand-blue uppercase">
                Drop multiple hero images here or click to browse
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Supports JPG, PNG, WebP. High-res manufacturing photos, uniform shoots, and factory machinery banners.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-purple-200 rounded-xl text-xs font-black text-purple-700 shadow-xs pointer-events-none">
                <Camera className="w-3.5 h-3.5" />
                Select Multiple Files from Device
              </span>
            </div>

            {/* Queue List Preview */}
            {batchQueue.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Queue Ready for Publishing ({batchQueue.length})
                  </h4>
                  <span className="text-[10px] text-purple-600 font-bold">
                    You can edit details for each slide below before publishing
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchQueue.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 items-start relative group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-300 bg-white relative">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">Slide Title</label>
                          <input
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBatchQueue(prev => prev.map(s => s.id === item.id ? { ...s, title: val } : s));
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-brand-blue"
                            placeholder="Hero Slide Title"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400">Badge</label>
                            <input
                              value={item.badge}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchQueue(prev => prev.map(s => s.id === item.id ? { ...s, badge: val } : s));
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                              placeholder="Badge"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400">CTA Button</label>
                            <input
                              value={item.buttonText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchQueue(prev => prev.map(s => s.id === item.id ? { ...s, buttonText: val } : s));
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                              placeholder="Button Text"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setBatchQueue(prev => prev.filter(s => s.id !== item.id))}
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center shrink-0 transition-colors"
                        title="Remove from batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handlePublishBatch}
                    disabled={isSubmittingBatch}
                    className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingBatch ? 'Publishing All Slides...' : `Publish All (${batchQueue.length}) Hero Slides`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 2: CURATED FACTORY PRESETS */}
      {activeTab === 'presets' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-[36px] border border-emerald-200 shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Factory Imagery Library
              </span>
              <h3 className="text-xl font-display font-black text-brand-blue uppercase mt-1">
                Kenyan Textile Manufacturing Presets
              </h3>
              <p className="text-xs text-slate-500">
                Click any preset to immediately add a professional hero slide with vetted copywriting to your carousel.
              </p>
            </div>
            <button
              onClick={handleSyncDefaults}
              disabled={isSyncing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? 'Restoring...' : 'Reset Default 3 Slides'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PHOTO_PRESETS.map((preset, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col group hover:border-emerald-300 transition-all">
                <div className="h-44 relative overflow-hidden bg-slate-900">
                  <img
                    src={preset.imageUrl}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 p-4 flex flex-col justify-between">
                    <span className="self-start text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      {preset.badge}
                    </span>
                    <h4 className="text-base font-display font-black text-white uppercase tracking-tight">
                      {preset.title}
                    </h4>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                  <button
                    onClick={() => handleAddPreset(preset)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Hero Carousel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 3: SINGLE SLIDE FULL CUSTOMIZER & LIVE PREVIEW */}
      {activeTab === 'single' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-[40px] border border-brand-orange/20 shadow-xl overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full">
                {editingId ? 'Edit Mode' : 'New Slide Studio'}
              </span>
              <h3 className="text-xl md:text-2xl font-display font-black text-brand-blue uppercase mt-1">
                {editingId ? 'Edit Hero Carousel Slide' : 'Design & Add New Hero Slide'}
              </h3>
            </div>
            <button 
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-brand-orange transition-colors"
              title="Cancel and close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Slide Headline *</label>
                  <input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-brand-blue" 
                    placeholder="Ex: TACTICAL DRILL WEAR" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Subtitle / Category</label>
                  <input 
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm" 
                    placeholder="Ex: FACTORY DIRECT PRODUCTION" 
                  />
                </div>
              </div>

              {/* Image Input & Dropzone */}
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">
                  Hero Background Image * (URL or Upload File)
                </label>
                <div 
                  onDragEnter={(e) => { e.preventDefault(); setIsDraggingSingle(true); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingSingle(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingSingle(false); }}
                  onDrop={handleSingleImageDrop}
                  className={cn(
                    "flex flex-col sm:flex-row gap-2 p-2 rounded-2xl border transition-all duration-300",
                    isDraggingSingle ? "bg-brand-orange/10 border-brand-orange ring-2 ring-brand-orange/20" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <input 
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    placeholder="Paste image URL (https://...)" 
                  />
                  <label className="cursor-pointer px-4 py-3 bg-brand-blue hover:bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shrink-0">
                    <Camera className="w-4 h-4 text-brand-orange" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSingleImagePick} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Tip: You can drag & drop any image file directly onto this box for automatic client-side compression.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Slide Description Copy</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-xs leading-relaxed" 
                  placeholder="Kenyan craftsmanship meets global standards. We elevate every stitch with precision..." 
                />
              </div>

              {/* Badge & Quick Presets */}
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Top Badge / Pill Tag</label>
                <input 
                  value={formData.badge}
                  onChange={e => setFormData({...formData, badge: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs" 
                  placeholder="Ex: 100% Kenyan" 
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BADGE_PRESETS.map((bp) => (
                    <button
                      key={bp}
                      type="button"
                      onClick={() => setFormData({ ...formData, badge: bp })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-orange/10 hover:text-brand-orange rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      +{bp}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Button & Target Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">CTA Button Text</label>
                  <input 
                    value={formData.buttonText}
                    onChange={e => setFormData({...formData, buttonText: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                    placeholder="Explore Collection" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">CTA Action / URL</label>
                  <input 
                    value={formData.buttonLink}
                    onChange={e => setFormData({...formData, buttonLink: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" 
                    placeholder="#categories" 
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-1 flex items-center">Preset Actions:</span>
                {LINK_PRESETS.map((lp) => (
                  <button
                    key={lp.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, buttonText: lp.label, buttonLink: lp.link })}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-brand-blue hover:text-white rounded-lg text-[10px] font-bold text-slate-600 transition-all"
                  >
                    {lp.label} ({lp.link})
                  </button>
                ))}
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Carousel Order</label>
                  <input 
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({...formData, order: Number(e.target.value)})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase">Visibility</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={resetForm} 
                  className="px-6 py-3.5 font-bold text-slate-400 hover:text-slate-600 uppercase text-xs tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitSingle}
                  className="px-8 py-3.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-brand-orange/30 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Publish Hero Slide'}</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Hero Banner Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Live Hero Slide Simulation
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                  Desktop / Tablet Aspect
                </span>
              </div>

              <div className="relative rounded-[28px] overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 aspect-[4/3] flex flex-col justify-end p-6 text-white group">
                {/* Background Image */}
                {formData.imageUrl ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={formData.imageUrl}
                    alt={formData.title || 'Preview'}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-slate-900 flex items-center justify-center text-slate-500 text-xs">
                    No image uploaded yet
                  </div>
                )}

                {/* Hero Dark Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Content Simulation */}
                <div className="relative z-10 space-y-2">
                  {formData.badge && (
                    <span className="inline-block text-[9px] font-black bg-brand-orange text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {formData.badge}
                    </span>
                  )}
                  {formData.subtitle && (
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {formData.subtitle}
                    </p>
                  )}
                  <h4 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight line-clamp-2">
                    {formData.title || 'Slide Headline'}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {formData.description || 'Slide description copy will appear here...'}
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button className="px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span>{formData.buttonText || 'Explore'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {formData.status === 'inactive' && (
                      <span className="text-[9px] bg-red-500/80 text-white px-2 py-1 rounded font-bold uppercase">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                This preview updates in real-time as you type copy or change images.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: ACTIVE SLIDES MANAGEMENT GRID */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {sliders.length === 0 && (
            <div className="bg-gradient-to-br from-brand-blue via-slate-900 to-brand-blue text-white p-8 md:p-12 rounded-[40px] text-center border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center mx-auto mb-4 border border-brand-orange/30">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display font-black uppercase mb-2">No Custom Slides in Database</h3>
              <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
                Your homepage is currently using fallback default slides. Synchronize default slides or upload your custom factory photos now.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleSyncDefaults}
                  disabled={isSyncing}
                  className="px-6 py-3.5 bg-brand-orange text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl hover:bg-brand-orange/90 transition-all inline-flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                  {isSyncing ? 'Syncing...' : 'Sync Standard Slides'}
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className="px-6 py-3.5 bg-purple-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl hover:bg-purple-700 transition-all inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Multiple Images
                </button>
              </div>
            </div>
          )}

          {sliders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sliders.map((s, idx) => {
                const isActive = s.status !== 'inactive';
                return (
                  <div 
                    key={s.id} 
                    className={cn(
                      "bg-white rounded-[32px] overflow-hidden border shadow-sm group flex flex-col justify-between transition-all",
                      isActive ? "border-slate-200 hover:border-brand-blue/30" : "border-slate-200 opacity-60 bg-slate-50"
                    )}
                  >
                    <div>
                      {/* Image Header */}
                      <div className="h-48 relative overflow-hidden bg-slate-900">
                        <img 
                          referrerPolicy="no-referrer" 
                          src={s.imageUrl} 
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE; }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/95 via-brand-blue/30 to-transparent p-5 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black bg-brand-orange text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                #{s.order ?? (idx + 1)}
                              </span>
                              {s.badge && (
                                <span className="text-[10px] font-black bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded uppercase tracking-wider">
                                  {s.badge}
                                </span>
                              )}
                            </div>

                            {/* Top Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(s)}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md backdrop-blur-sm",
                                  isActive ? "bg-emerald-500/90 text-white hover:bg-emerald-600" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                )}
                                title={isActive ? "Hide slide from homepage" : "Make slide visible"}
                              >
                                {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => handleDuplicate(s)}
                                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-brand-blue transition-colors shadow-md"
                                title="Duplicate slide"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleEdit(s)}
                                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-brand-orange transition-colors shadow-md"
                                title="Edit slide"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(s.id, s.title)}
                                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                                title="Delete slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            {s.subtitle && (
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">
                                {s.subtitle}
                              </p>
                            )}
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-tight line-clamp-1">
                              {s.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Description & Metadata */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {s.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            CTA: {s.buttonText || 'Explore'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                            {s.buttonLink || '#categories'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Order Controls */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Sequence:</span>
                        <input 
                          type="number" 
                          value={s.order ?? (idx + 1)} 
                          onChange={(e) => updateOrder(s.id, Number(e.target.value))}
                          className="w-14 p-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-brand-blue text-center shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSlide(idx, 'up')}
                          disabled={idx === 0}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-brand-blue hover:border-brand-blue disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs"
                          title="Move up in carousel"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSlide(idx, 'down')}
                          disabled={idx === sliders.length - 1}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-brand-blue hover:border-brand-blue disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs"
                          title="Move down in carousel"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoriesModule() {
  const DEFAULT_CATEGORIES = [
    {
      id: 'apparel',
      title: 'Modern Apparel',
      description: 'Premium everyday wear and custom casuals designed for comfort and style.',
      items: [
        'Round Neck T-Shirts',
        'Hoodies, Jumpers & Sweatshirts',
        'Jackets & Fleeces',
        'Designer Tracksuits',
        'Polo Shirts',
        'Sweaters',
        'Shorts & Jeans'
      ],
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
      specialties: ['Custom Screen Printing', 'Premium Embroidery', 'Brushed Fleece Lining'],
      materials: ['100% Kenyan Cotton', 'Heavyweight Fleece', 'Cotton-Polyester Blends'],
      order: 1
    },
    {
      id: 'heritage',
      title: 'Kenyan Heritage',
      description: 'Authentic cultural garments celebrating Kenyan traditions and Maasai craftsmanship.',
      items: [
        'Maasai Shuka Shawls',
        'Kikoy Wraps & Scarves',
        'Traditional Robes & Vests',
        'Heritage Accessories',
        'Beaded & Embroidered Tunics'
      ],
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
      specialties: ['Authentic Maasai Weaving', 'Traditional Color Patterns', 'Hand-stitched Details'],
      materials: ['Pure Acrylic Shuka', '100% Cotton Kikoy', 'Hand-spun Yarns'],
      order: 2
    },
    {
      id: 'uniforms',
      title: 'Workwear & Security',
      description: 'Durable, high-visibility uniforms engineered for security, industrial, and institutional excellence.',
      items: [
        'Security Uniforms',
        'School Uniforms',
        'High-Vis Vests',
        'Industrial Overalls & Dungarees',
        'Reflector Jackets',
        'Lab Coats & Dust Coats',
        'Chef Coats & Kitchen Aprons'
      ],
      image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&q=80&w=800',
      specialties: ['Reinforced Triple-Stitching', 'High-Reflective 3M Strips', 'Tear-Resistant Construction'],
      materials: ['Heavy-Duty Twill', 'Ripstop Poly-Cotton', 'Flame-Retardant Drill'],
      order: 3
    },
    {
      id: 'other',
      title: 'Accessories & Custom',
      description: 'Bespoke corporate gifts, bags, and branded gear tailored for businesses and events.',
      items: [
        'Custom Caps & Hats',
        'Tote Bags & Backpacks',
        'Raincoats & Umbrellas',
        'Table Mats & Aprons',
        'Promotional Banners & Flags'
      ],
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
      specialties: ['Sublimation Branding', 'Direct-to-Film (DTF)', 'Weatherproof Sealing'],
      materials: ['Canvas & Waterproof Nylon', 'Structured Twill', 'PVC-Coated Polyester'],
      order: 4
    }
  ];

  const PRESET_IMAGES = [
    { label: 'Hoodies & Fleece', url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800' },
    { label: 'Maasai Shuka / Heritage', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' },
    { label: 'Security & Workwear', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&q=80&w=800' },
    { label: 'Caps & Accessories', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800' },
    { label: 'Sports & Tracksuits', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800' },
    { label: 'Corporate Polos', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800' },
    { label: 'Industrial Overalls', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=800' }
  ];

  const { toast, promptConfirm } = usePopup();
  const [categories, setCategories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    itemsInput: '',
    specialtiesInput: '',
    materialsInput: '',
    order: 1
  });

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));
  }, []);

  const handleSyncDefaults = async () => {
    promptConfirm({
      title: 'Sync Factory Default Categories',
      message: 'This will seed and synchronize the 4 official collection categories into your database so you can edit their circular images, titles, and product lists. Continue?',
      confirmText: 'Sync Categories',
      variant: 'primary',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
            const cat = DEFAULT_CATEGORIES[i];
            await setDoc(doc(db, 'categories', cat.id), {
              ...cat,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          toast.success('Categories Synchronized', 'Default collection showcase categories seeded into database.');
        } catch (err: any) {
          toast.error('Sync Failed', err?.message || 'Could not synchronize categories.');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      itemsInput: '',
      specialtiesInput: '',
      materialsInput: '',
      order: categories.length + 1
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const processImageFile = async (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    try {
      const res = await compressImage(file, { maxDimension: 1000, quality: 0.82, format: 'image/webp' });
      callback(res.dataUrl);
      toast.info('Category Image Optimized', `Compressed to WebP: ${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)} (${res.reductionPercentage}% saved)`);
    } catch (err) {
      console.error('Error compressing category image:', err);
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (cat: any) => {
    setFormData({
      title: cat.title || '',
      description: cat.description || '',
      image: cat.image || '',
      itemsInput: Array.isArray(cat.items) ? cat.items.join(', ') : (cat.items || ''),
      specialtiesInput: Array.isArray(cat.specialties) ? cat.specialties.join(', ') : (cat.specialties || ''),
      materialsInput: Array.isArray(cat.materials) ? cat.materials.join(', ') : (cat.materials || ''),
      order: cat.order ?? 1
    });
    setEditingId(cat.id);
    setIsAdding(true);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image) {
      toast.warning('Incomplete Information', 'Please provide both a Category Title and an Image.');
      return;
    }

    const itemsArray = formData.itemsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const specialtiesArray = formData.specialtiesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const materialsArray = formData.materialsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const docId = editingId || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;

    try {
      await setDoc(doc(db, 'categories', docId), {
        id: docId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        items: itemsArray,
        specialties: specialtiesArray,
        materials: materialsArray,
        order: Number(formData.order) || 1,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      toast.success(
        editingId ? 'Category Updated' : 'Category Published',
        `"${formData.title}" is now live on the homepage circular showcase!`
      );
      resetForm();
    } catch (err: any) {
      toast.error('Failed to Save Category', err?.message || 'Could not save category.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    promptConfirm({
      title: `Delete Collection "${title}"`,
      message: 'Are you sure you want to remove this category circle from the homepage? This cannot be undone.',
      confirmText: 'Delete Category',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'categories', id));
          toast.success('Category Removed', `"${title}" has been deleted.`);
        } catch (err: any) {
          toast.error('Failed to Delete', err?.message || 'Could not delete category.');
        }
      }
    });
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      await setDoc(doc(db, 'categories', id), { order: newOrder }, { merge: true });
      toast.info('Order Updated', `Category sequence updated to #${newOrder}.`);
    } catch (err: any) {
      toast.error('Failed to Reorder', err?.message || 'Could not update order.');
    }
  };

  const parsedItems = formData.itemsInput.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              Homepage Showcase Below Search
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">
            Round Circles & Categories Manager
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Control the circular image bubbles and showcase category cards displayed right under the hero search on the homepage. Change photos, titles, descriptions, and linked product types anytime.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={handleSyncDefaults}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial px-4 py-3.5 bg-slate-800 text-white hover:bg-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50 shadow-sm"
            title="Seed / Reset Factory Default 4 Categories"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Factory Categories'}</span>
          </button>
          <button 
            onClick={() => {
              if (isAdding) resetForm();
              else {
                resetForm();
                setIsAdding(true);
              }
            }}
            className="flex-1 sm:flex-initial px-6 py-3.5 bg-brand-orange text-white rounded-2xl font-bold flex items-center justify-center gap-2 brand-edge-blue hover:translate-x-0.5 hover:-translate-y-0.5 transition-all text-xs shadow-md shadow-brand-orange/25"
          >
            <Plus className="w-5 h-5" /> {isAdding ? 'Close Form' : 'Add New Category'}
          </button>
        </div>
      </div>

      {/* Empty State with Fast Sync */}
      {categories.length === 0 && !isAdding && (
        <div className="bg-gradient-to-br from-brand-blue via-slate-900 to-brand-blue text-white p-8 md:p-12 rounded-[40px] text-center border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center mx-auto mb-4 border border-brand-orange/30">
            <CircleDot className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-display font-black uppercase mb-2">No Custom Categories in Database</h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
            Your homepage is currently using fallback default collection categories. Click the button below to synchronize all 4 default categories (Modern Apparel, Kenyan Heritage, Workwear & Security, Accessories & Custom) to Firestore so you can customize their circular images and text.
          </p>
          <button
            onClick={handleSyncDefaults}
            disabled={isSyncing}
            className="px-8 py-4 bg-brand-orange text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl hover:bg-brand-orange/90 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing Categories...' : 'Sync Factory Categories Now'}
          </button>
        </div>
      )}

      {/* Add / Edit Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-6 md:p-8 rounded-[40px] border border-brand-orange/20 shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest block mb-1">
                  {editingId ? 'Edit Showcase Category' : 'Create New Showcase Category'}
                </span>
                <h3 className="text-xl font-display font-black text-brand-blue uppercase">
                  {editingId ? `Editing "${formData.title || 'Category'}"` : 'New Round Circle Category'}
                </h3>
              </div>
              <button onClick={resetForm} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Inputs */}
              <div className="lg:col-span-7 space-y-6">
                {/* Title & Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-orange" /> Category Title *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Modern Apparel, Kenyan Heritage, Security Uniforms" 
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-orange transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider">
                      Display Order #
                    </label>
                    <input 
                      type="number" 
                      value={formData.order}
                      onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-center focus:outline-none focus:border-brand-orange transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider">
                    Short Description
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Short summary of this collection (e.g. Premium everyday wear and custom casuals...)" 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-orange transition-all leading-relaxed resize-none"
                  />
                </div>

                {/* Image Upload & URL */}
                <div className="space-y-3">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-orange" /> Round Image / Cover Photo *
                  </label>
                  
                  {/* Drag and drop upload zone */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        processImageFile(e.dataTransfer.files[0], (url) => setFormData(prev => ({ ...prev, image: url })));
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer relative bg-slate-50 hover:bg-slate-100/80",
                      isDragging ? "border-brand-orange bg-brand-orange/5" : "border-slate-200"
                    )}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          processImageFile(e.target.files[0], (url) => setFormData(prev => ({ ...prev, image: url })));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <Upload className="w-5 h-5 text-brand-orange" />
                      <p className="text-xs font-bold text-slate-700">Drop local image here or click to browse</p>
                      <p className="text-[10px] text-slate-400">Auto-compressed for instant high-speed rendering</p>
                    </div>
                  </div>

                  {/* Or Custom URL */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Or paste image URL (https://...)" 
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-brand-orange"
                    />
                    {formData.image && (
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="px-3 py-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-xs font-bold transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Curated Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Quick Kenyan Garment Photo Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image: preset.url })}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border",
                            formData.image === preset.url
                              ? "bg-brand-orange text-white border-brand-orange shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub-Items / Product Types */}
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Product Types / Sub-Items (Comma Separated)</span>
                    <span className="text-brand-orange font-bold">{parsedItems.length} types detected</span>
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Round Neck T-Shirts, Hoodies & Jumpers, Security Uniforms, Caps & Hats" 
                    value={formData.itemsInput}
                    onChange={e => setFormData({ ...formData, itemsInput: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-brand-orange transition-all leading-relaxed"
                  />
                  {parsedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedItems.map((item, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-brand-blue rounded-lg text-[10px] font-bold border border-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specialties & Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider">
                      Specialties (Comma Separated)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Screen Printing, Embroidery, Heavyweight" 
                      value={formData.specialtiesInput}
                      onChange={e => setFormData({ ...formData, specialtiesInput: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-wider">
                      Materials (Comma Separated)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 100% Kenyan Cotton, Poly-Cotton" 
                      value={formData.materialsInput}
                      onChange={e => setFormData({ ...formData, materialsInput: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live Dual Preview */}
              <div className="lg:col-span-5 bg-slate-50/80 rounded-[32px] p-6 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Live Homepage Preview
                    </span>
                    <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                          previewMode === 'mobile' ? "bg-brand-blue text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        Mobile Circle
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                          previewMode === 'desktop' ? "bg-brand-blue text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        Desktop Card
                      </button>
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[260px]">
                    {previewMode === 'mobile' ? (
                      /* Mobile Round Circle Preview */
                      <div className="flex flex-col items-center text-center max-w-[140px]">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-white ring-4 ring-brand-orange/30 shadow-lg bg-slate-900 group">
                          <img 
                            referrerPolicy="no-referrer"
                            src={formData.image || PLACEHOLDER_PRODUCT_IMAGE} 
                            alt={formData.title || 'Category'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                            }}
                          />
                        </div>
                        <h4 className="text-xs font-black text-brand-blue uppercase leading-tight line-clamp-2">
                          {formData.title || 'Category Name'}
                        </h4>
                        <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider mt-0.5">
                          {parsedItems.length} Types
                        </span>
                      </div>
                    ) : (
                      /* Desktop Card Preview */
                      <div className="w-full max-w-[220px] aspect-[4/5] rounded-[28px] overflow-hidden relative shadow-lg bg-slate-900 border border-slate-100">
                        <img 
                          referrerPolicy="no-referrer"
                          src={formData.image || PLACEHOLDER_PRODUCT_IMAGE} 
                          alt={formData.title || 'Category'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/95 via-brand-blue/40 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <div className="w-8 h-8 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-2 shadow-sm">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-display font-black text-white leading-tight mb-1 uppercase">
                            {formData.title || 'Category Name'}
                          </h4>
                          <span className="text-[9px] font-black text-brand-green uppercase tracking-wider">
                            {parsedItems.length} Product Types
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={resetForm} 
                    className="px-5 py-3.5 font-bold text-slate-400 hover:text-slate-600 uppercase text-xs tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    className="px-7 py-3.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-brand-orange/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'Save Changes' : 'Publish Category'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {categories.map((cat, idx) => {
          const itemsList = Array.isArray(cat.items) ? cat.items : [];
          return (
            <div 
              key={cat.id || idx} 
              className="bg-white rounded-[32px] overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Header with Circular Image and Card Thumbnail */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    {/* Round Image Capsule Icon */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white ring-2 ring-brand-orange/40 shadow-md bg-slate-900 group-hover:scale-105 transition-transform">
                      <img 
                        referrerPolicy="no-referrer"
                        src={cat.image} 
                        alt={cat.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-brand-blue text-white rounded-md text-[9px] font-black uppercase">
                          #{cat.order ?? idx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-display font-black text-brand-blue uppercase tracking-tight">
                          {cat.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider block mt-0.5">
                        {itemsList.length} Product Types Attached
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleEdit(cat)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-xs"
                      title="Edit Category Details & Image"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id, cat.title)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-xs"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-4">
                  {cat.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>
                  )}

                  {/* Sub-items Tags */}
                  {itemsList.length > 0 && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Catalog Sub-Items:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {itemsList.slice(0, 6).map((item: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold">
                            {item}
                          </span>
                        ))}
                        {itemsList.length > 6 && (
                          <span className="px-2 py-1 bg-slate-200/60 text-slate-500 rounded-lg text-[10px] font-bold">
                            +{itemsList.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specialties & Materials */}
                  {((cat.specialties && cat.specialties.length > 0) || (cat.materials && cat.materials.length > 0)) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10px]">
                      {cat.specialties && cat.specialties.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider block">Specialties:</span>
                          <span className="text-slate-600 truncate block">{cat.specialties.join(', ')}</span>
                        </div>
                      )}
                      {cat.materials && cat.materials.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider block">Materials:</span>
                          <span className="text-slate-600 truncate block">{cat.materials.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer with Live Order Control */}
              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Sort Order:</span>
                  <input 
                    type="number" 
                    value={cat.order ?? idx + 1} 
                    onChange={(e) => updateOrder(cat.id, Number(e.target.value))}
                    className="w-14 p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 flex items-center gap-1"
                >
                  Edit Copy & Image <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GalleryModule() {
  const { toast, promptConfirm } = usePopup();
  const [images, setImages] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [batchCategory, setBatchCategory] = useState('Showcase Work');

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    imageUrl: '', 
    linkUrl: '', 
    category: 'Showcase Work',
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'gallery'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000);
        return timeB - timeA;
      });
      setImages(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));
  }, []);

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      imageUrl: '', 
      linkUrl: '', 
      category: 'Showcase Work',
      order: 0
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const compressImageFile = async (file: File, callback: (url: string) => void) => {
    try {
      const res = await compressImage(file, { maxDimension: 1200, quality: 0.82, format: 'image/webp' });
      callback(res.dataUrl);
      toast.info('Gallery Image Compressed', `${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)} (${res.reductionPercentage}% saved)`);
    } catch (err) {
      console.error('Gallery compression error:', err);
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent, callback: (url: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 1) {
      handleBatchUploadFiles(Array.from(files));
    } else if (files && files[0]) {
      compressImageFile(files[0], callback);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const files = e.target.files;
    if (files && files.length > 1) {
      handleBatchUploadFiles(Array.from(files));
    } else if (files && files[0]) {
      compressImageFile(files[0], callback);
    }
  };

  const handleBatchUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploadingBatch(true);

    try {
      let count = 0;
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());

        await new Promise<void>((resolve) => {
          compressImageFile(file, async (compressedUrl) => {
            await addDoc(collection(db, 'gallery'), {
              title: cleanTitle || 'Tewaw Showcase Work',
              category: batchCategory || 'Showcase Work',
              description: 'Custom handcrafted garment manufacturing showcase piece.',
              imageUrl: compressedUrl,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            count++;
            resolve();
          });
        });
      }

      await addDoc(collection(db, 'notifications'), {
        title: 'Gallery Batch Upload',
        message: `Successfully uploaded ${count} new image(s) to gallery showcase.`,
        type: 'system',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast.success('Gallery Uploaded', `Successfully uploaded ${count} image(s) to your Gallery.`);
    } catch (err: any) {
      toast.error('Upload Failed', err?.message || 'Could not upload gallery images.');
    } finally {
      setIsUploadingBatch(false);
    }
  };

  const handleToggleSelectImage = (id: string) => {
    setSelectedImageIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllImages = (checked: boolean) => {
    if (checked) {
      setSelectedImageIds(images.map(img => img.id));
    } else {
      setSelectedImageIds([]);
    }
  };

  const handleBatchDeleteImages = async () => {
    if (selectedImageIds.length === 0) return;
    promptConfirm({
      title: 'Batch Delete Photos',
      message: `Are you sure you want to permanently delete ${selectedImageIds.length} selected gallery photos?`,
      confirmText: `Delete ${selectedImageIds.length} Photos`,
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        setIsDeletingBatch(true);
        try {
          for (const id of selectedImageIds) {
            await deleteDoc(doc(db, 'gallery', id));
          }
          const deletedCount = selectedImageIds.length;
          setSelectedImageIds([]);
          toast.success('Photos Deleted', `Successfully deleted ${deletedCount} gallery photos.`);
        } catch (err: any) {
          toast.error('Delete Failed', err?.message || 'Could not delete gallery photos.');
        } finally {
          setIsDeletingBatch(false);
        }
      }
    });
  };

  const handleSeedGallerySamples = async () => {
    promptConfirm({
      title: 'Seed Showcase Samples',
      message: 'Seed standard high-quality garment showcase images into gallery?',
      confirmText: 'Seed Gallery',
      variant: 'primary',
      onConfirm: async () => {
        const samples = [
          {
            title: 'Heavyweight Fleece Hoodie Stitching',
            category: 'Custom Apparel',
            description: 'Double-needle seam detailing on 380gsm Kenyan fleece hoodie.',
            imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800'
          },
          {
            title: 'Tactical Security Combat Uniform',
            category: 'Security Wear',
            description: 'Reinforced ripstop fabric security uniform with high-vis accents.',
            imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
          },
          {
            title: 'Precision Embroidery Machine Unit',
            category: 'Embroidery',
            description: 'Multi-head automated embroidery unit placing institutional crests.',
            imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
          },
          {
            title: 'Institutional Blazer Stitch',
            category: 'School Uniforms',
            description: 'Tailored school blazers with custom brass buttons and crest piping.',
            imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800'
          },
          {
            title: 'Heavy Duty Flame-Resistant Overalls',
            category: 'Workwear',
            description: 'Industrial safety overalls designed for extreme field conditions.',
            imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800'
          },
          {
            title: 'Executive Corporate Silk Tie & Shirt',
            category: 'Corporate Wear',
            description: 'Premium crisp cotton dress shirts for corporate staff.',
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800'
          }
        ];

        try {
          for (const s of samples) {
            await addDoc(collection(db, 'gallery'), {
              ...s,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          toast.success('Gallery Seeded', 'Successfully added garment showcase portfolio images.');
        } catch (err: any) {
          toast.error('Seeding Failed', err?.message || 'Could not seed gallery photos.');
        }
      }
    });
  };

  const handleEdit = (img: any) => {
    setFormData({
      title: img.title || '',
      description: img.description || '',
      imageUrl: img.imageUrl || '',
      linkUrl: img.linkUrl || '',
      category: img.category || 'Showcase Work',
      order: img.order || 0
    });
    setEditingId(img.id);
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.imageUrl) {
      toast.warning('Missing Information', 'Please provide a title and photo image URL.');
      return;
    }
    try {
      if (editingId) {
        await setDoc(doc(db, 'gallery', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        }, { merge: true });
        toast.success('Gallery Item Updated', `Updated "${formData.title}".`);
      } else {
        await addDoc(collection(db, 'gallery'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Gallery Item Published', `Added "${formData.title}" to gallery.`);
      }
      resetForm();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save gallery item.');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id) return;
    promptConfirm({
      title: 'Delete Gallery Photo',
      message: 'Permanently remove this photo from your portfolio showcase gallery?',
      confirmText: 'Delete Photo',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'gallery', id));
          setSelectedImageIds(prev => prev.filter(i => i !== id));
          toast.success('Photo Deleted', 'Gallery item successfully deleted.');
        } catch (err: any) {
          toast.error('Failed to Delete', err?.message || 'Could not delete gallery photo.');
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Gallery Management</h2>
          <p className="text-xs md:text-sm text-slate-500">Upload high-res photos, drag & drop multiple files, and manage your portfolio showcase.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleSeedGallerySamples}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs border border-slate-200"
            title="Seed standard showcase images"
          >
            <RefreshCw className="w-4 h-4 text-brand-blue" />
            <span>Seed Samples</span>
          </button>

          <a 
            href="/gallery" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-3 bg-white text-brand-blue border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs"
          >
            <ExternalLink className="w-4 h-4 text-brand-orange" />
            <span>View Live Gallery</span>
          </a>

          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-3 bg-brand-orange text-white rounded-2xl font-bold flex items-center justify-center gap-2 brand-edge-blue shadow-none hover:translate-x-1 hover:-translate-y-1 transition-all text-xs"
          >
            <Camera className="w-4 h-4" /> Add Single Photo
          </button>
        </div>
      </div>

      {/* Floating Batch Action Toolbar */}
      <AnimatePresence>
        {selectedImageIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-brand-blue text-white p-4 md:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-orange/30"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white font-black text-xs flex items-center justify-center">
                {selectedImageIds.length}
              </span>
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wide">Gallery Photos Selected</p>
                <p className="text-[10px] text-slate-300 font-medium">Select actions to apply to all chosen portfolio pieces.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
              <button
                onClick={handleBatchDeleteImages}
                disabled={isDeletingBatch}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
              >
                {isDeletingBatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedImageIds([])}
                className="px-3 py-2 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone / Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-6 md:p-8 rounded-[40px] border border-brand-orange/20 shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-brand-blue uppercase">
                  {editingId ? 'Edit Work' : 'Upload Portfolio Showcase Image'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Auto-optimizes images on canvas for instant high-speed rendering.</p>
              </div>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-brand-orange transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Title</label>
                  <input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Ex: Custom Security Tactical Uniform" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700"
                  >
                    <option value="Showcase Work">Showcase Work</option>
                    <option value="Security Wear">Security Wear</option>
                    <option value="School Uniforms">School Uniforms</option>
                    <option value="Workwear">Workwear & Overalls</option>
                    <option value="Custom Apparel">Custom Apparel & Hoodies</option>
                    <option value="Embroidery">Custom Embroidery</option>
                    <option value="Corporate Wear">Corporate Wear</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm" placeholder="Detail the stitching specifications, fabric, or client project context..." 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Link URL (Optional)</label>
                  <input 
                    value={formData.linkUrl}
                    onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="https://..." 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Image Upload (Drag & Drop or Multi-Select)</label>
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={(e) => handleDrop(e, (url) => setFormData({...formData, imageUrl: url}))}
                    className={cn(
                      "relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 text-center cursor-pointer",
                      isDragging ? "bg-brand-orange/10 border-brand-orange ring-4 ring-brand-orange/5" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {formData.imageUrl ? (
                      <>
                        <img referrerPolicy="no-referrer" src={formData.imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-brand-blue/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setFormData({...formData, imageUrl: ''}); }}
                             className="p-3 bg-white text-red-500 rounded-2xl font-bold flex items-center gap-2 translate-y-2 hover:translate-y-0 transition-all"
                           >
                             <Trash2 className="w-5 h-5" /> Remove Image
                           </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange mb-3">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black text-brand-blue uppercase tracking-wider mb-1">
                          {isDragging ? "Drop Photos to Upload" : "Click to Browse or Drag Photos Here"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Select 1 or multiple photos. High-res images automatically compressed.</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleImagePick(e, (url) => setFormData({...formData, imageUrl: url}))} 
                        />
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase">External Image URL (Optional Fallback)</label>
                  <input 
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" 
                    placeholder="Alternatively, paste an external URL (e.g., https://...)" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={resetForm} className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
              <button 
                onClick={handleSubmit}
                disabled={isUploadingBatch}
                className="px-8 py-4 bg-brand-orange hover:bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-orange/20 transition-all flex items-center gap-2"
              >
                {isUploadingBatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Uploading Batch...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Publish to Gallery'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All Controls Header */}
      {images.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={selectedImageIds.length > 0 && selectedImageIds.length === images.length} 
              onChange={(e) => handleSelectAllImages(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer" 
            />
            <span>Select All ({images.length} Photos)</span>
          </label>
          <span className="text-xs text-slate-400 font-medium">Click card checkboxes to multi-select for bulk delete</span>
        </div>
      )}

      {/* Gallery Showcase Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img) => {
          const isSelected = selectedImageIds.includes(img.id);
          return (
            <div 
              key={img.id} 
              className={cn(
                "relative aspect-square rounded-3xl overflow-hidden group shadow-xs border transition-all bg-white",
                isSelected ? "border-brand-orange ring-4 ring-brand-orange/20" : "border-slate-100 hover:border-slate-300"
              )}
            >
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => handleToggleSelectImage(img.id)}
                className="absolute top-3 left-3 z-20 w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer shadow-md"
              />
              <img referrerPolicy="no-referrer" src={img.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE; }} />
              {/* Desktop Hover Overlay */}
              <div className="hidden sm:flex absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center p-4 text-center z-10">
                <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest">{img.category || 'Portfolio'}</span>
                <p className="text-white font-bold text-xs uppercase truncate w-full px-2 mt-1">{img.title}</p>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(img); }}
                    className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-brand-blue transition-all shadow-md"
                    title="Edit Item Details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(img.id, e)}
                    className="w-9 h-9 rounded-full bg-red-600/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Touch-Friendly Persistent Action Badge */}
              <div className="sm:hidden absolute bottom-2 right-2 z-20 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-lg">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(img); }}
                  className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
                  title="Edit Item"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => handleDelete(img.id, e)}
                  className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center active:scale-90 transition-transform"
                  title="Delete Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {images.length === 0 && !isAdding && (
        <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-display font-black text-brand-blue uppercase">No Gallery Photos Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Upload custom photo stitches, drag and drop files directly, or click below to seed standard showcase samples into your gallery.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedGallerySamples}
              className="px-6 py-3 bg-brand-blue text-white rounded-2xl text-xs font-bold uppercase tracking-wider"
            >
              Seed Showcase Samples
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-brand-orange text-white rounded-2xl text-xs font-bold uppercase tracking-wider"
            >
              Upload Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewModule({ notifications }: { notifications: any[] }) {
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, inventory: 0, visitors: 4200, gallery: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Analytics Mock / Real Integration
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      const revenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      setStats(prev => ({ ...prev, orders: orders.length, revenue }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const invUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, inventory: snapshot.size }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const galleryUnsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      setStats(prev => ({ ...prev, gallery: snapshot.size }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));

    // Monthly Sales Feed (Product Sales & Volume in KES / Units)
    setMonthlySales([
      { month: 'Jan', sales: 42, revenue: 125000 },
      { month: 'Feb', sales: 58, revenue: 168000 },
      { month: 'Mar', sales: 74, revenue: 210000 },
      { month: 'Apr', sales: 91, revenue: 290000 },
      { month: 'May', sales: 115, revenue: 340000 },
      { month: 'Jun', sales: 138, revenue: 420000 }
    ]);

    // User Growth Trend Feed
    setUserGrowth([
      { month: 'Jan', users: 150 },
      { month: 'Feb', users: 210 },
      { month: 'Mar', users: 320 },
      { month: 'Apr', users: 480 },
      { month: 'May', users: 690 },
      { month: 'Jun', users: 920 }
    ]);

    return () => {
      unsubscribe();
      invUnsubscribe();
      galleryUnsubscribe();
    };
  }, []);

  const [isSalesExpanded, setIsSalesExpanded] = useState(false);
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  const [isGrowthExpanded, setIsGrowthExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <div className="space-y-8">
      {/* Expandable Stat Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`KES ${stats.revenue.toLocaleString()}`} 
          trend="+12.5%" 
          icon={TrendingUp} 
          color="blue" 
          details={[
            { label: 'Store Product Sales', value: `KES ${Math.round(stats.revenue * 0.72).toLocaleString()}` },
            { label: 'Custom Tailoring Quotes', value: `KES ${Math.round(stats.revenue * 0.28).toLocaleString()}` },
            { label: 'Average Order Value', value: 'KES 8,450' }
          ]}
          onAction={() => navigate('/admin/orders')}
        />
        <StatCard 
          title="Active Orders" 
          value={stats.orders.toString()} 
          trend="+3" 
          icon={ShoppingCart} 
          color="orange" 
          details={[
            { label: 'Pending Processing', value: '2 orders' },
            { label: 'Awaiting Dispatch', value: '1 order' },
            { label: 'Fulfilled Today', value: '5 orders' }
          ]}
          onAction={() => navigate('/admin/orders')}
        />
        <StatCard 
          title="Inventory Items" 
          value={stats.inventory.toString()} 
          trend="In Stock" 
          icon={Box} 
          color="slate" 
          details={[
            { label: 'Stitching Equipment', value: '14 machines' },
            { label: 'Fabric & Embroidery Thread', value: `${stats.inventory} units` },
            { label: 'Low Stock Alerts', value: '2 items' }
          ]}
          onAction={() => navigate('/admin/products')}
        />
        <StatCard 
          title="Gallery Pieces" 
          value={stats.gallery.toString()} 
          trend="+2 New" 
          icon={Camera} 
          color="blue" 
          details={[
            { label: 'High-Res Masterpieces', value: `${stats.gallery} items` },
            { label: 'Active Category Filters', value: 'All 6 active' },
            { label: 'Total Client Impressions', value: '4,290 views' }
          ]}
          onAction={() => navigate('/admin/gallery')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Product Sales Line Chart - Expandable Block */}
        <motion.div 
          layout
          whileHover={{ y: -4, scale: 1.005 }}
          className={cn(
            "lg:col-span-2 bg-white/95 backdrop-blur-sm p-4 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 brand-edge-orange group cursor-pointer relative overflow-hidden",
            isSalesExpanded ? "ring-2 ring-brand-orange/30 border-brand-orange" : "hover:border-brand-orange/40"
          )}
          onClick={() => setIsSalesExpanded(!isSalesExpanded)}
        >
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-sm md:text-lg font-black text-brand-blue uppercase tracking-wider flex items-center gap-2">
                Monthly Product Sales
                <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                  Units Sold
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tap block to {isSalesExpanded ? 'collapse breakdown' : 'expand detailed metrics log'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {isSalesExpanded ? 'Hide Table' : 'Tap to Expand'}
              </span>
              <motion.div animate={{ rotate: isSalesExpanded ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-brand-blue" />
              </motion.div>
            </div>
          </div>

          <div className="h-[220px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#252A56' }}
                />
                <Line type="monotone" dataKey="sales" name="Products Sold" stroke="#0B2C7A" strokeWidth={4} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence>
            {isSalesExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-100 pt-4 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-wider">Detailed Sales Breakdown</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Monthly Performance Ledger</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                      <th className="p-2.5 rounded-l-xl">Month</th>
                      <th className="p-2.5">Units Sold</th>
                      <th className="p-2.5">Est Revenue (KES)</th>
                      <th className="p-2.5 text-right rounded-r-xl">Growth Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlySales.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold text-brand-blue">{m.month}</td>
                        <td className="p-2.5 font-semibold text-slate-600">{m.sales} units</td>
                        <td className="p-2.5 font-mono font-bold text-brand-orange">KES {m.revenue ? m.revenue.toLocaleString() : (m.sales * 3200).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-black text-[#269453]">+{(10 + idx * 3.2).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Real-time Feed - Expandable Block */}
        <motion.div 
          layout
          whileHover={{ y: -4, scale: 1.005 }}
          className={cn(
            "bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 brand-edge-blue flex flex-col group cursor-pointer relative overflow-hidden",
            isFeedExpanded ? "ring-2 ring-brand-blue/30 border-brand-blue" : "hover:border-brand-blue/40"
          )}
          onClick={() => setIsFeedExpanded(!isFeedExpanded)}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-black text-brand-blue uppercase flex items-center gap-2">
              Real-time Feed
              <span className="w-2.5 h-2.5 bg-[#269453] rounded-full animate-ping" />
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full uppercase">
                {isFeedExpanded ? 'Collapse' : 'Expand Logs'}
              </span>
              <motion.div animate={{ rotate: isFeedExpanded ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-brand-blue" />
              </motion.div>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1 max-h-[260px]">
            {notifications.map(n => (
              <div key={n.id} className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                  n.type === 'order' ? "bg-brand-orange" : "bg-brand-blue"
                )} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-brand-blue">{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {isFeedExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
                className="border-t border-slate-100 pt-4 space-y-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between font-bold text-brand-blue">
                    <span>Audit System Monitor</span>
                    <span className="text-[9px] text-[#269453] bg-[#269453]/10 px-2 py-0.5 rounded uppercase font-black">All Services Online</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Firestore database listeners are actively streaming live transactions, inquiries, and gallery updates in real-time.
                  </p>
                  <button 
                    onClick={() => navigate('/admin/mail')}
                    className="w-full mt-1 py-2 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-orange transition-colors flex items-center justify-center gap-1.5"
                  >
                    Open Admin Webmail Inbox <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Growth Trends Bar Chart - Expandable Block */}
        <motion.div 
          layout
          whileHover={{ y: -4, scale: 1.005 }}
          className={cn(
            "lg:col-span-2 bg-white/95 backdrop-blur-sm p-4 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 brand-edge-blue group cursor-pointer relative overflow-hidden",
            isGrowthExpanded ? "ring-2 ring-brand-blue/30 border-brand-blue" : "hover:border-brand-blue/40"
          )}
          onClick={() => setIsGrowthExpanded(!isGrowthExpanded)}
        >
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-sm md:text-lg font-black text-brand-blue uppercase tracking-wider flex items-center gap-2">
                User Growth Trends
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                  Active Accounts
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tap block to {isGrowthExpanded ? 'collapse details' : 'expand user cohort audit log'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {isGrowthExpanded ? 'Hide Breakdown' : 'Tap to Expand'}
              </span>
              <motion.div animate={{ rotate: isGrowthExpanded ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-brand-blue" />
              </motion.div>
            </div>
          </div>

          <div className="h-[220px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#269453' }}
                />
                <Bar dataKey="users" name="Registered Users" fill="#269453" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence>
            {isGrowthExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-100 pt-4 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-wider">User Cohort Audit</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Quarterly Growth Analysis</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                      <th className="p-2.5 rounded-l-xl">Month</th>
                      <th className="p-2.5">Registered Users</th>
                      <th className="p-2.5">Active Stitching Gurus</th>
                      <th className="p-2.5 text-right rounded-r-xl">Retention Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userGrowth.map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold text-brand-blue">{u.month}</td>
                        <td className="p-2.5 font-mono font-bold text-brand-orange">{u.users} accounts</td>
                        <td className="p-2.5 text-slate-600">{Math.floor(u.users * 0.14)} tailors</td>
                        <td className="p-2.5 text-right font-black text-[#269453]">91.5%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Growth Statistics Info Card - Expandable Block */}
        <motion.div 
          layout
          whileHover={{ y: -4, scale: 1.005 }}
          className={cn(
            "bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 brand-edge-orange flex flex-col justify-center items-center text-center group cursor-pointer relative overflow-hidden",
            isInfoExpanded ? "ring-2 ring-brand-orange/30 border-brand-orange" : "hover:border-brand-orange/40"
          )}
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
        >
          <div className="w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mb-4 shadow-md transition-transform group-hover:scale-110 group-hover:rotate-6 shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h4 className="text-xl font-display font-black text-brand-blue uppercase mb-2">Steady Escalation</h4>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
            Our stitching guru network, brand outreach, and active client roster has witnessed a stellar 28% growth spike in this quarter alone!
          </p>

          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-brand-orange uppercase bg-brand-orange/10 px-3 py-1 rounded-full">
            <span>{isInfoExpanded ? 'Hide Milestone Progress' : 'Tap for Quarterly Milestones'}</span>
            <motion.div animate={{ rotate: isInfoExpanded ? 180 : 0 }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </div>

          <AnimatePresence>
            {isInfoExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full border-t border-slate-100 pt-4 space-y-3 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-500">Q1 Outreach Target</span>
                    <span className="font-black text-brand-blue">100% Achieved</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-blue h-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-500">Q2 Revenue Growth</span>
                    <span className="font-black text-brand-orange">+28.4% (Exceeded)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-orange h-full w-[94%]" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Client Repeat Order Rate</span>
                  <span className="font-mono font-black text-[#269453]">88.2%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div>
        <h3 className="text-sm font-black text-brand-blue uppercase mb-6 tracking-widest pl-4">Priority Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard 
            title="New Product" 
            description="Add high-quality items to store" 
            icon={Package} 
            onClick={() => navigate('/admin/products')} 
            color="blue"
            actionHint="Create, configure price variants, and launch new custom stitching products directly into the online storefront."
          />
          <QuickActionCard 
            title="Upload to Gallery" 
            description="Showcase your latest stitch work" 
            icon={Camera} 
            onClick={() => navigate('/admin/gallery')} 
            color="orange"
            actionHint="Publish high-resolution tailoring photos, update showcase categories, and manage client engagement gallery pieces."
          />
          <QuickActionCard 
            title="Manage Sliders" 
            description="Update homepage hero visuals" 
            icon={Layers} 
            onClick={() => navigate('/admin/sliders')} 
            color="slate"
            actionHint="Configure interactive hero slider banners, CTA buttons, and background imagery for the main landing page."
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, color, actionHint }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "flex flex-col p-6 md:p-8 rounded-[32px] border transition-all text-left group shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 cursor-pointer relative overflow-hidden select-none",
        color === 'blue' ? "bg-brand-blue text-white border-brand-blue" : 
        color === 'orange' ? "bg-white border-brand-orange/40 text-brand-blue hover:border-brand-orange" : 
        "bg-white border-slate-200/80 text-brand-blue hover:border-slate-300",
        isExpanded && "ring-2 ring-brand-orange/30"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-6">
        <div className={cn(
          "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-md",
          color === 'blue' ? "bg-white/10 text-white" : 
          color === 'orange' ? "bg-brand-orange/10 text-brand-orange" : 
          "bg-slate-100 text-slate-400"
        )}>
          <Icon className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h4 className="text-lg md:text-xl font-display font-black uppercase leading-tight">{title}</h4>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5 opacity-60 group-hover:opacity-100" />
            </motion.div>
          </div>
          <p className={cn(
            "text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1",
            color === 'blue' ? "text-white/60" : "text-slate-400"
          )}>{description}</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "border-t pt-4 space-y-3",
              color === 'blue' ? "border-white/10" : "border-slate-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={cn(
              "text-xs leading-relaxed font-medium",
              color === 'blue' ? "text-white/80" : "text-slate-500"
            )}>
              {actionHint || `Directly launch the ${title} workspace to make updates or view detailed records.`}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all",
                color === 'blue' 
                  ? "bg-brand-orange text-white hover:bg-white hover:text-brand-blue" 
                  : "bg-brand-blue text-white hover:bg-brand-orange"
              )}
            >
              Open Workspace <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, details, onAction }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "bg-white/95 backdrop-blur-sm p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 group cursor-pointer relative overflow-hidden select-none",
        isExpanded ? "border-brand-orange ring-2 ring-brand-orange/20" : "hover:border-brand-orange/40"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm",
          color === 'blue' ? "bg-blue-50 text-brand-blue" : 
          color === 'orange' ? "bg-brand-orange/10 text-brand-orange" : 
          "bg-slate-50 text-slate-600"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#269453] bg-[#269453]/10 px-2.5 py-1 rounded-lg shadow-sm border border-[#269453]/20">{trend}</span>
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-black text-brand-blue">{value}</h4>
          <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider flex items-center gap-1 opacity-80 group-hover:opacity-100">
            {isExpanded ? 'Collapse' : 'Tap to expand'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-t border-slate-100 pt-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Metric Breakdown</span>
              <span className="text-[9px] text-brand-blue bg-blue-50 px-2 py-0.5 rounded font-black">Live Data</span>
            </div>

            {details && details.length > 0 && (
              <div className="space-y-2">
                {details.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50/80 border border-slate-100/80 hover:bg-slate-100/80 transition-colors">
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <span className="font-black text-brand-blue font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {onAction && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
                className="w-full mt-2 py-2.5 px-3 bg-brand-blue text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-orange transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-blue/10"
              >
                Open Module Page <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Module Templates
interface ProductVariant {
  name: string;
  type: string;
  price?: number;
}

function ProductsModule() {
  const { toast, promptConfirm } = usePopup();
  const location = useLocation();

  const PRESET_FABRIC_COLORS = [
    'Navy Blue', 'Black', 'Royal Blue', 'Sky Blue', 'Red', 'Heather Grey',
    'Charcoal', 'Bottle Green', 'Jungle Green', 'Olive', 'White', 'Yellow',
    'Orange', 'Maroon', 'Khaki', 'Beige', 'Pink', 'Purple'
  ];

  const PRESET_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  const getDefaultVariants = (): ProductVariant[] => PRESET_SIZES.map(s => ({ name: s, type: 'Size' }));

  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [productWizardStep, setProductWizardStep] = useState<number>(1);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setProductWizardStep(1);
      setIsAdding(true);
    }
    const handleOpen = () => {
      setProductWizardStep(1);
      setIsAdding(true);
    };
    window.addEventListener('open-add-product-modal', handleOpen);
    return () => window.removeEventListener('open-add-product-modal', handleOpen);
  }, [location]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: 0, 
    priceRange: '', 
    imageUrl: '', 
    additionalImages: [] as string[],
    model3dUrl: '', 
    category: '', 
    description: '', 
    linkUrl: '', 
    brand: 'Tewaw Enterprise',
    sku: '',
    gtin: '',
    mpn: '',
    condition: 'new' as 'new' | 'refurbished' | 'used',
    availability: 'in_stock' as 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder',
    googleProductCategory: 'Apparel & Accessories > Clothing',
    colors: [...PRESET_FABRIC_COLORS] 
  });
  const [additionalImageUrlInput, setAdditionalImageUrlInput] = useState('');
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [customColorInput, setCustomColorInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>(getDefaultVariants());
  const [newVariant, setNewVariant] = useState<ProductVariant>({ name: '', type: 'Size' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingImageProduct, setEditingImageProduct] = useState<any | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [quickAdditionalImages, setQuickAdditionalImages] = useState<string[]>([]);
  const [quickAdditionalInput, setQuickAdditionalInput] = useState('');
  const [isQuickUploadingAdditional, setIsQuickUploadingAdditional] = useState(false);

  // Selection & Import/Export States
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedProductsPreview, setImportedProductsPreview] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleAddAdditionalImageUrl = () => {
    const rawInput = additionalImageUrlInput.trim();
    if (!rawInput) return;
    
    // Split input on newlines, commas, semicolons, or multiple whitespace characters
    const candidateUrls = rawInput
      .split(/[\n,;\s]+/)
      .map(u => u.trim())
      .filter(u => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')));

    if (candidateUrls.length === 0) {
      toast.warning('Invalid URL', 'Please enter valid image URL(s) starting with http://, https://, or data:');
      return;
    }

    const currentImages = newProduct.additionalImages || [];
    const newUniqueUrls = candidateUrls.filter(u => !currentImages.includes(u) && u !== newProduct.imageUrl);

    if (newUniqueUrls.length === 0) {
      toast.info('Already Attached', 'The provided image URL(s) are already in your gallery.');
    } else {
      setNewProduct({
        ...newProduct,
        additionalImages: [...currentImages, ...newUniqueUrls]
      });
      toast.success('Photos Added', `Added ${newUniqueUrls.length} photo(s) to product gallery.`);
    }
    setAdditionalImageUrlInput('');
  };

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    const currentImages = newProduct.additionalImages || [];
    setNewProduct({
      ...newProduct,
      additionalImages: currentImages.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleSetAdditionalAsPrimary = (indexToPromote: number) => {
    const currentImages = newProduct.additionalImages || [];
    const imageToPromote = currentImages[indexToPromote];
    const oldPrimary = newProduct.imageUrl;
    
    const updatedAdditional = currentImages.filter((_, idx) => idx !== indexToPromote);
    if (oldPrimary && !updatedAdditional.includes(oldPrimary)) {
      updatedAdditional.unshift(oldPrimary);
    }
    
    setNewProduct({
      ...newProduct,
      imageUrl: imageToPromote,
      additionalImages: updatedAdditional
    });
    toast.success('Cover Image Updated', 'Selected photo set as the primary cover image.');
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.warning('No Images', 'Please select valid image files.');
      return;
    }

    setIsUploadingAdditional(true);
    try {
      const uploadPromises = imageFiles.map(file => 
        new Promise<string>((resolve) => {
          compressImageFile(file, (url) => resolve(url), false);
        })
      );
      
      const compressedUrls = await Promise.all(uploadPromises);
      const validUrls = compressedUrls.filter(Boolean);
      const current = newProduct.additionalImages || [];
      const newUrls = validUrls.filter(u => !current.includes(u) && u !== newProduct.imageUrl);
      
      setNewProduct(prev => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...newUrls]
      }));
      toast.success('Photos Added', `Successfully added ${newUrls.length} new photo(s) to gallery.`);
    } catch (err) {
      console.error('Error adding additional photos:', err);
      toast.error('Upload Error', 'Could not process additional images.');
    } finally {
      setIsUploadingAdditional(false);
      e.target.value = '';
    }
  };

  const toggleColor = (colorName: string) => {
    const currentColors = newProduct.colors || [];
    if (currentColors.includes(colorName)) {
      setNewProduct({
        ...newProduct,
        colors: currentColors.filter(c => c !== colorName)
      });
    } else {
      setNewProduct({
        ...newProduct,
        colors: [...currentColors, colorName]
      });
    }
  };

  const toggleAllColors = () => {
    const currentColors = newProduct.colors || [];
    if (currentColors.length === PRESET_FABRIC_COLORS.length) {
      setNewProduct({ ...newProduct, colors: [] });
    } else {
      setNewProduct({ ...newProduct, colors: [...PRESET_FABRIC_COLORS] });
    }
  };

  const toggleSizeVariant = (sizeName: string) => {
    const exists = variants.some(v => v.name === sizeName && v.type === 'Size');
    if (exists) {
      setVariants(variants.filter(v => !(v.name === sizeName && v.type === 'Size')));
    } else {
      setVariants([...variants, { name: sizeName, type: 'Size' }]);
    }
  };

  const toggleAllSizes = () => {
    const sizeVariantsCount = variants.filter(v => v.type === 'Size').length;
    if (sizeVariantsCount === PRESET_SIZES.length) {
      setVariants(variants.filter(v => v.type !== 'Size'));
    } else {
      const nonSizeVariants = variants.filter(v => v.type !== 'Size');
      const allSizes = PRESET_SIZES.map(s => ({ name: s, type: 'Size' }));
      setVariants([...nonSizeVariants, ...allSizes]);
    }
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (!trimmed) return;
    const currentColors = newProduct.colors || [];
    if (!currentColors.includes(trimmed)) {
      setNewProduct({
        ...newProduct,
        colors: [...currentColors, trimmed]
      });
    }
    setCustomColorInput('');
  };

  useEffect(() => {
    ensureProductsSeeded();
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000);
        return timeB - timeA;
      });
      setProducts(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
  }, []);

  // Compute products list for Admin view (retains only user uploaded Firestore products)
  const displayProducts = React.useMemo(() => {
    return products.filter(p => p && !p.isDeleted);
  }, [products]);

  // Selection Logic
  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(displayProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedProductIds.length === 0) return;
    promptConfirm({
      title: 'Batch Delete Products',
      message: `Are you sure you want to permanently delete ${selectedProductIds.length} selected product(s) from your catalogue?`,
      confirmText: `Delete ${selectedProductIds.length} Items`,
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        setIsDeletingBatch(true);
        try {
          for (const id of selectedProductIds) {
            await setDoc(doc(db, 'products', id), {
              id,
              isDeleted: true,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          await addDoc(collection(db, 'notifications'), {
            title: 'Batch Inventory Delete',
            message: `Deleted ${selectedProductIds.length} item(s) from inventory`,
            type: 'system',
            isRead: false,
            createdAt: serverTimestamp()
          });
          const count = selectedProductIds.length;
          setSelectedProductIds([]);
          toast.success('Batch Delete Completed', `Successfully deleted ${count} selected item(s).`);
        } catch (err: any) {
          toast.error('Batch Delete Failed', err?.message || 'Could not delete selected products.');
        } finally {
          setIsDeletingBatch(false);
        }
      }
    });
  };

  // Export Inventory Functions
  const exportCSV = (subsetIds?: string[]) => {
    const targetProducts = subsetIds && subsetIds.length > 0 
      ? displayProducts.filter(p => subsetIds.includes(p.id)) 
      : displayProducts;

    if (targetProducts.length === 0) {
      toast.warning('No Products', 'No products available to export.');
      return;
    }

    const headers = ['id', 'name', 'category', 'price', 'priceRange', 'imageUrl', 'additionalImages', 'model3dUrl', 'linkUrl', 'description', 'colors', 'variants'];
    const rows = targetProducts.map(p => [
      `"${(p.id || '').replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.price || 0,
      `"${(p.priceRange || '').replace(/"/g, '""')}"`,
      `"${(p.imageUrl || '').replace(/"/g, '""')}"`,
      `"${(p.additionalImages && Array.isArray(p.additionalImages) ? p.additionalImages.join(';') : '').replace(/"/g, '""')}"`,
      `"${(p.model3dUrl || '').replace(/"/g, '""')}"`,
      `"${(p.linkUrl || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${(p.colors ? p.colors.join(';') : '').replace(/"/g, '""')}"`,
      `"${(p.variants ? JSON.stringify(p.variants).replace(/"/g, '""') : '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tewaw_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported', `Exported ${targetProducts.length} product(s) to CSV.`);
  };

  const exportJSON = (subsetIds?: string[]) => {
    const targetProducts = subsetIds && subsetIds.length > 0 
      ? displayProducts.filter(p => subsetIds.includes(p.id)) 
      : displayProducts;

    if (targetProducts.length === 0) {
      toast.warning('No Products', 'No products available to export.');
      return;
    }

    const jsonContent = JSON.stringify(targetProducts, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tewaw_inventory_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('JSON Exported', `Exported ${targetProducts.length} product(s) to JSON.`);
  };

  // Import Inventory Functions
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseRow = (rowStr: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          if (inQuotes && rowStr[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const parsedItems = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i]);
      if (cols.length === 0 || !cols.some(c => c)) continue;

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });

      const name = rowObj['name'] || rowObj['productname'] || rowObj['title'] || cols[1] || '';
      if (!name) continue;

      const price = Number(rowObj['price'] || rowObj['baseprice'] || rowObj['pricekes'] || 0) || 0;
      const category = rowObj['category'] || 'General Uniforms';
      const imageUrl = rowObj['imageurl'] || rowObj['image'] || rowObj['img'] || '';
      const description = rowObj['description'] || rowObj['desc'] || '';
      const priceRange = rowObj['pricerange'] || rowObj['range'] || '';
      const id = rowObj['id'] || `prod-${Date.now()}-${i}`;
      const colorsStr = rowObj['colors'] || rowObj['fabriccolors'] || '';
      const colors = colorsStr ? colorsStr.split(';').map((c: string) => c.trim()).filter(Boolean) : [];
      const addlImagesStr = rowObj['additionalimages'] || rowObj['additionalimage'] || rowObj['galleryimages'] || rowObj['extraimages'] || '';
      const additionalImages = addlImagesStr ? addlImagesStr.split(';').map((u: string) => u.trim()).filter(Boolean) : (Array.isArray(rowObj['additionalimages']) ? rowObj['additionalimages'] : []);

      let variantsArr = [];
      if (rowObj['variants']) {
        try {
          variantsArr = JSON.parse(rowObj['variants']);
        } catch (e) {
          variantsArr = [];
        }
      }

      parsedItems.push({
        id,
        name,
        category,
        price,
        priceRange,
        imageUrl,
        additionalImages,
        description,
        colors,
        variants: variantsArr,
        model3dUrl: rowObj['model3durl'] || '',
        linkUrl: rowObj['linkurl'] || ''
      });
    }

    return parsedItems;
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setImportedProductsPreview(parsed);
            setImportModalOpen(true);
          } else {
            toast.error('Invalid JSON', 'JSON file must contain an array of products.');
          }
        } else {
          const parsed = parseCSVText(content);
          if (parsed.length > 0) {
            setImportedProductsPreview(parsed);
            setImportModalOpen(true);
          } else {
            toast.error('Invalid CSV', 'Could not parse any valid products from this CSV file.');
          }
        }
      } catch (err) {
        console.error('Import parse error:', err);
        toast.error('Import Error', 'Failed to parse import file. Ensure it is valid CSV or JSON.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (importedProductsPreview.length === 0) return;
    setIsImporting(true);

    try {
      for (const p of importedProductsPreview) {
        const prodId = p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await setDoc(doc(db, 'products', prodId), {
          id: prodId,
          name: p.name || 'Unnamed Garment',
          category: p.category || 'General Uniforms',
          price: Number(p.price) || 0,
          priceRange: p.priceRange || '',
          imageUrl: p.imageUrl || '',
          additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
          description: p.description || '',
          colors: p.colors || [],
          variants: p.variants || [],
          model3dUrl: p.model3dUrl || '',
          linkUrl: p.linkUrl || '',
          isDeleted: false,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      await addDoc(collection(db, 'notifications'), {
        title: 'Inventory Imported',
        message: `Successfully imported ${importedProductsPreview.length} products to inventory catalog`,
        type: 'system',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast.success('Import Successful', `Imported ${importedProductsPreview.length} products into database.`);
      setImportModalOpen(false);
      setImportedProductsPreview([]);
      setImportFileName('');
    } catch (err: any) {
      toast.error('Import Failed', err?.message || 'Could not import products.');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePurgeMockImages = async () => {
    promptConfirm({
      title: 'Purge Mock Images',
      message: 'This will scan your database and remove all mock/stock Unsplash images from products, retaining strictly your uploaded product images. Continue?',
      confirmText: 'Purge Mock Images',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const res = await removeMockProductImagesFromFirestore();
          await addDoc(collection(db, 'notifications'), {
            title: 'Mock Images Purged',
            message: `Cleaned ${res.cleaned} products and deleted ${res.deleted} mock placeholder items from Firestore.`,
            type: 'system',
            isRead: false,
            createdAt: serverTimestamp()
          });
          toast.success('Mock Images Purged', `Successfully cleaned ${res.cleaned} products and removed ${res.deleted} mock records. Only your uploaded images are retained.`);
        } catch (err: any) {
          console.error('Error purging mock images:', err);
          toast.error('Purge Failed', err?.message || 'Could not purge mock images.');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const compressImageFile = async (
    file: File, 
    callback: (url: string) => void, 
    showToast: boolean = true,
    opts?: { maxDimension?: number; quality?: number }
  ) => {
    try {
      const res = await compressImage(file, { 
        maxDimension: opts?.maxDimension || 900, 
        quality: opts?.quality || 0.78, 
        format: 'image/webp' 
      });
      callback(res.dataUrl);
      if (showToast) {
        toast.info('Image Optimized', `Saved ${res.reductionPercentage}% (${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)})`);
      }
    } catch (err) {
      console.error('Product image compression error:', err);
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, singleCallback?: (url: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const fileList = e.dataTransfer.files;
    if (!fileList || fileList.length === 0) return;
    
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.warning('Invalid Format', 'Please drop image files (JPG, PNG, WebP).');
      return;
    }

    if (imageFiles.length === 1 && singleCallback) {
      compressImageFile(imageFiles[0], singleCallback);
      return;
    }

    // Process multiple dropped files: first fills cover if empty, rest fill gallery
    setIsUploadingAdditional(true);
    try {
      const uploadPromises = imageFiles.map(file => 
        new Promise<string>((resolve) => {
          compressImageFile(file, resolve, false);
        })
      );
      const compressedUrls = await Promise.all(uploadPromises);
      const validUrls = compressedUrls.filter(Boolean);

      let targetCover = newProduct.imageUrl;
      const additionalToAdd: string[] = [];

      validUrls.forEach((url, i) => {
        if (!targetCover && i === 0) {
          targetCover = url;
        } else if (!additionalToAdd.includes(url) && !(newProduct.additionalImages || []).includes(url) && url !== targetCover) {
          additionalToAdd.push(url);
        }
      });

      setNewProduct(prev => ({
        ...prev,
        imageUrl: targetCover,
        additionalImages: [...(prev.additionalImages || []), ...additionalToAdd]
      }));

      toast.success('Photos Added', `Processed ${validUrls.length} dropped photo(s) (${additionalToAdd.length} added to gallery).`);
    } catch (err) {
      console.error('Error processing dropped images:', err);
      toast.error('Upload Error', 'Could not process dropped photos.');
    } finally {
      setIsUploadingAdditional(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>, singleCallback?: (url: string) => void) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    if (imageFiles.length === 1 && singleCallback) {
      compressImageFile(imageFiles[0], singleCallback);
      e.target.value = '';
      return;
    }

    // Process multiple files selected
    setIsUploadingAdditional(true);
    try {
      const uploadPromises = imageFiles.map(file => 
        new Promise<string>((resolve) => {
          compressImageFile(file, resolve, false);
        })
      );
      const compressedUrls = await Promise.all(uploadPromises);
      const validUrls = compressedUrls.filter(Boolean);

      let targetCover = newProduct.imageUrl;
      const additionalToAdd: string[] = [];

      validUrls.forEach((url, i) => {
        if (!targetCover && i === 0) {
          targetCover = url;
        } else if (!additionalToAdd.includes(url) && !(newProduct.additionalImages || []).includes(url) && url !== targetCover) {
          additionalToAdd.push(url);
        }
      });

      setNewProduct(prev => ({
        ...prev,
        imageUrl: targetCover,
        additionalImages: [...(prev.additionalImages || []), ...additionalToAdd]
      }));

      toast.success('Photos Added', `Processed ${validUrls.length} photo(s).`);
    } catch (err) {
      console.error('Error processing picked images:', err);
      toast.error('Upload Error', 'Could not process photos.');
    } finally {
      setIsUploadingAdditional(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setNewProduct({ 
      name: '', 
      price: 0, 
      priceRange: '', 
      imageUrl: '', 
      additionalImages: [],
      model3dUrl: '', 
      category: '', 
      description: '', 
      linkUrl: '', 
      brand: 'Tewaw Enterprise',
      sku: '',
      gtin: '',
      mpn: '',
      condition: 'new' as 'new' | 'refurbished' | 'used',
      availability: 'in_stock' as 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder',
      googleProductCategory: 'Apparel & Accessories > Clothing',
      colors: [...PRESET_FABRIC_COLORS] 
    });
    setAdditionalImageUrlInput('');
    setCustomColorInput('');
    setVariants(getDefaultVariants());
    setNewVariant({ name: '', type: 'Size' });
    setEditingId(null);
    setProductWizardStep(1);
    setIsAdding(false);
  };

  const handleEdit = (p: any) => {
    setNewProduct({
      name: p.name || '',
      price: p.price || 0,
      priceRange: p.priceRange || '',
      imageUrl: p.imageUrl || '',
      additionalImages: Array.isArray(p.additionalImages) 
        ? [...p.additionalImages] 
        : (Array.isArray(p.images) ? [...p.images] : []),
      model3dUrl: p.model3dUrl || '',
      category: p.category || '',
      description: p.description || '',
      linkUrl: p.linkUrl || '',
      brand: p.brand || 'Tewaw Enterprise',
      sku: p.sku || '',
      gtin: p.gtin || '',
      mpn: p.mpn || '',
      condition: p.condition || 'new',
      availability: p.availability || 'in_stock',
      googleProductCategory: p.googleProductCategory || 'Apparel & Accessories > Clothing',
      colors: p.colors && p.colors.length > 0 ? p.colors : [...PRESET_FABRIC_COLORS]
    });
    setAdditionalImageUrlInput('');
    setVariants(p.variants && p.variants.length > 0 ? p.variants : getDefaultVariants());
    setEditingId(p.id);
    setProductWizardStep(1);
    setIsAdding(true);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast.warning('Name Required', 'Please enter a name for the product.');
      return;
    }
    if (!newProduct.imageUrl) {
      toast.warning('Image Required', 'Please provide or upload a product image.');
      return;
    }
    try {
      if (editingId) {
        await setDoc(doc(db, 'products', editingId), {
          id: editingId,
          ...newProduct,
          additionalImages: newProduct.additionalImages || [],
          price: Number(newProduct.price) || 0,
          colors: newProduct.colors || [],
          variants: variants,
          isDeleted: false,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        await addDoc(collection(db, 'notifications'), {
          title: 'Inventory Updated',
          message: `Updated product: ${newProduct.name}`,
          type: 'system',
          isRead: false,
          createdAt: serverTimestamp()
        });
        toast.success('Product Updated', `Successfully updated "${newProduct.name}".`);
      } else {
        const prodId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await setDoc(doc(db, 'products', prodId), {
          id: prodId,
          ...newProduct,
          additionalImages: newProduct.additionalImages || [],
          price: Number(newProduct.price) || 0,
          colors: newProduct.colors || [],
          variants: variants,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        await addDoc(collection(db, 'notifications'), {
          title: 'Inventory Created',
          message: `Added new product: ${newProduct.name}`,
          type: 'system',
          isRead: false,
          createdAt: serverTimestamp()
        });
        toast.success('Product Added', `Added "${newProduct.name}" to catalogue.`);
      }
      resetForm();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save product details.');
    }
  };

  const handleQuickImageOpen = (p: any) => {
    setEditingImageProduct(p);
    setQuickImageUrl(p.imageUrl || '');
    const addl = Array.isArray(p.additionalImages) 
      ? [...p.additionalImages] 
      : (Array.isArray(p.images) ? [...p.images] : []);
    setQuickAdditionalImages(addl);
    setQuickAdditionalInput('');
  };

  const handleSaveQuickImage = async () => {
    if (!editingImageProduct || !quickImageUrl) {
      toast.warning('Image Required', 'Please provide an image URL.');
      return;
    }
    try {
      await setDoc(doc(db, 'products', editingImageProduct.id), {
        id: editingImageProduct.id,
        name: editingImageProduct.name,
        category: editingImageProduct.category || '',
        priceRange: editingImageProduct.priceRange || '',
        price: Number(editingImageProduct.price) || 0,
        description: editingImageProduct.description || '',
        imageUrl: quickImageUrl,
        additionalImages: quickAdditionalImages || [],
        isDeleted: false,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'notifications'), {
        title: 'Images Updated',
        message: `Updated cover and ${quickAdditionalImages.length} additional images for ${editingImageProduct.name}`,
        type: 'system',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast.success('Images Updated', `Updated imagery for ${editingImageProduct.name}.`);
      setEditingImageProduct(null);
      setQuickImageUrl('');
      setQuickAdditionalImages([]);
      setQuickAdditionalInput('');
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update product image.');
    }
  };

  const handleDelete = async (id: string) => {
    promptConfirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product from the inventory catalogue?',
      confirmText: 'Delete Product',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await setDoc(doc(db, 'products', id), {
            id,
            isDeleted: true,
            updatedAt: serverTimestamp()
          }, { merge: true });

          await addDoc(collection(db, 'notifications'), {
            title: 'Inventory Item Deleted',
            message: `Removed product (${id}) from catalog`,
            type: 'system',
            isRead: false,
            createdAt: serverTimestamp()
          });

          toast.success('Product Deleted', 'The product was removed from your inventory catalogue.');
        } catch (err: any) {
          toast.error('Delete Failed', err?.message || 'Could not delete product.');
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Inventory Management</h2>
          <p className="text-xs md:text-sm text-slate-500">Manage catalog products, bulk delete, and import/export inventory datasets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Import Button */}
          <label className="px-4 py-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-brand-orange" />
            <span>Import</span>
            <input 
              type="file" 
              accept=".csv,.json" 
              className="hidden" 
              onChange={handleImportFileSelect} 
            />
          </label>

          {/* Export CSV / JSON Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => exportCSV(selectedProductIds)}
              className="px-3 py-2 text-slate-700 hover:text-brand-blue hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors"
              title="Export Inventory as CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportJSON(selectedProductIds)}
              className="px-3 py-2 text-slate-700 hover:text-brand-blue hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors"
              title="Export Inventory as JSON Data"
            >
              <FileJson className="w-4 h-4 text-amber-600" />
              <span>JSON</span>
            </button>
            <a
              href="/api/merchant-feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-slate-700 hover:text-brand-blue hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors"
              title="Open Live Google Merchant Center XML Feed"
            >
              <ExternalLink className="w-4 h-4 text-brand-orange" />
              <span>XML Feed</span>
            </a>
          </div>

          <button 
            onClick={handlePurgeMockImages}
            disabled={isSyncing}
            className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs border border-red-200 shadow-xs"
            title="Clean mock/stock Unsplash images from products database"
          >
            <Trash2 className={cn("w-4 h-4", isSyncing && "animate-spin")} /> {isSyncing ? "Purging..." : "Purge Mock Images"}
          </button>
          
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="px-5 py-3 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 brand-edge-orange shadow-none hover:translate-x-1 hover:-translate-y-1 transition-all text-xs"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      <AnimatePresence>
        {selectedProductIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-brand-blue text-white p-4 md:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-orange/30"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white font-black text-xs flex items-center justify-center">
                {selectedProductIds.length}
              </span>
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wide">Products Selected</p>
                <p className="text-[10px] text-slate-300 font-medium">Select actions to apply to all chosen items simultaneously.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                onClick={() => exportCSV(selectedProductIds)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export ({selectedProductIds.length})
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={isDeletingBatch}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
              >
                {isDeletingBatch ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedProductIds([])}
                className="px-3 py-2 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 md:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-none sm:rounded-[32px] border-0 sm:border sm:border-brand-orange/30 shadow-2xl w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Sticky Header with Step Navigator */}
              <div className="shrink-0 p-4 sm:p-6 border-b border-slate-100 bg-white z-10 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse shrink-0" />
                      <h4 className="text-base sm:text-xl font-display font-black text-brand-blue uppercase tracking-tight truncate">
                        {editingId ? 'Edit Product' : 'Create Product'}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-wider shrink-0">
                        Step {productWizardStep} of 4: {[
                          'Basics & Category',
                          'Media & 3D',
                          'Pricing & Tiers',
                          'Colors & Variants'
                        ][productWizardStep - 1]}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate mt-0.5 hidden sm:block">
                      {editingId ? 'Refine garment specifications, media assets, pricing tiers, and variations.' : 'Step-by-step product catalog creation with automatic preset colors and size variants.'}
                    </p>
                  </div>
                  <button 
                    onClick={resetForm}
                    className="p-2 text-slate-400 hover:text-brand-orange hover:bg-slate-100 rounded-full transition-all shrink-0 active:scale-95"
                    title="Close Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Wizard Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-brand-orange h-full rounded-full transition-all duration-300"
                    initial={false}
                    animate={{ width: `${(productWizardStep / 4) * 100}%` }}
                  />
                </div>

                {/* Mobile Compact Step Pills (Horizontal Scroll) */}
                <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { step: 1, label: '1. Basics', icon: Package, isDone: !!newProduct.name },
                    { step: 2, label: '2. Media', icon: Camera, isDone: !!newProduct.imageUrl },
                    { step: 3, label: '3. Pricing', icon: Receipt, isDone: Number(newProduct.price) > 0 || !!newProduct.priceRange },
                    { step: 4, label: '4. Variants', icon: Palette, isDone: (newProduct.colors?.length || 0) > 0 && variants.length > 0 },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = productWizardStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setProductWizardStep(s.step)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                          isActive 
                            ? "border-brand-orange bg-brand-orange text-white shadow-xs" 
                            : s.isDone 
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                              : "border-slate-200 bg-slate-50 text-slate-500"
                        )}
                      >
                        {s.isDone && !isActive ? <Check className="w-3 h-3 text-emerald-600" /> : <Icon className="w-3 h-3" />}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop 4 Interactive Step Tabs */}
                <div className="hidden sm:grid grid-cols-4 gap-2 pt-1">
                  {[
                    { step: 1, label: '1. Basics', desc: 'Name & Category', icon: Package, isDone: !!newProduct.name },
                    { step: 2, label: '2. Media & 3D', desc: 'Images & Assets', icon: Camera, isDone: !!newProduct.imageUrl },
                    { step: 3, label: '3. Pricing', desc: 'KES & Tier Format', icon: Receipt, isDone: Number(newProduct.price) > 0 || !!newProduct.priceRange },
                    { step: 4, label: '4. Variants', desc: 'Colors & Sizes', icon: Palette, isDone: (newProduct.colors?.length || 0) > 0 && variants.length > 0 },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = productWizardStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setProductWizardStep(s.step)}
                        className={cn(
                          "p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative group",
                          isActive 
                            ? "border-brand-orange bg-brand-orange/5 text-brand-blue shadow-xs ring-2 ring-brand-orange/20" 
                            : s.isDone 
                              ? "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100/80" 
                              : "border-slate-100 bg-white text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors text-xs font-black",
                          isActive 
                            ? "bg-brand-orange text-white" 
                            : s.isDone 
                              ? "bg-emerald-500 text-white" 
                              : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                        )}>
                          {s.isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <p className={cn("text-xs font-black truncate leading-tight uppercase", isActive ? "text-brand-blue" : "text-slate-700")}>
                            {s.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                            {s.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable Wizard Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 overscroll-contain custom-scrollbar">
                {/* STEP 1: BASIC INFORMATION & CATEGORY */}
                {productWizardStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5 sm:space-y-6"
                  >
                    <div className="p-3.5 sm:p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 flex items-center gap-3">
                      <Package className="w-5 h-5 text-brand-orange shrink-0" />
                      <div>
                        <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Step 1: General Product Details</h5>
                        <p className="text-[11px] text-slate-500">Provide the garment name, category classification, and customer description.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase flex items-center justify-between">
                          <span>Product Name <span className="text-brand-orange">*</span></span>
                          {newProduct.name && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Valid</span>}
                        </label>
                        <input 
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm font-bold text-brand-blue focus:bg-white focus:border-brand-orange transition-all placeholder:font-normal" 
                          placeholder="Ex: Executive Heavy Duty Workwear Overall" 
                          autoFocus
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase">Product Category</label>
                        <select 
                          value={newProduct.category}
                          onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm font-bold text-brand-blue focus:bg-white focus:border-brand-orange transition-all cursor-pointer"
                        >
                          <option value="">-- Select Standard Factory Category --</option>
                          {CATEGORIES.map(cat => (
                            <optgroup key={cat.title} label={cat.title}>
                              {cat.items.map(item => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase">Product Description & Specs (Optional)</label>
                        <textarea 
                          value={newProduct.description}
                          onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 sm:h-28 text-base sm:text-sm focus:bg-white focus:border-brand-orange transition-all" 
                          placeholder="Briefly describe fabric composition, stitching quality, or customization options (appears on WhatsApp quote requests)..." 
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase">External Catalogue Link (Optional)</label>
                        <input 
                          value={newProduct.linkUrl || ''}
                          onChange={e => setNewProduct({...newProduct, linkUrl: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm focus:bg-white focus:border-brand-orange transition-all font-mono" 
                          placeholder="https://tewaw.co.ke/catalogue/..." 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: MEDIA & 3D ASSETS */}
                {productWizardStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5 sm:space-y-6"
                  >
                    <div className="p-3.5 sm:p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 flex items-center gap-3">
                      <Camera className="w-5 h-5 text-brand-orange shrink-0" />
                      <div>
                        <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Step 2: Media & Interactive 3D Assets</h5>
                        <p className="text-[11px] text-slate-500">Upload high-resolution photography, specify image URLs, or provide 3D GLB model links.</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase flex justify-between items-center">
                          <span>Main Product Cover Image (File Pick or URL) <span className="text-brand-orange">*</span></span>
                          {newProduct.imageUrl && (
                            <button 
                              type="button"
                              onClick={() => setNewProduct({...newProduct, imageUrl: ''})}
                              className="text-brand-orange hover:text-brand-blue transition-colors text-[10px] font-bold"
                            >
                              Clear Cover Image
                            </button>
                          )}
                        </label>
                        
                        {/* Drag & Drop / Mobile Upload Container */}
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={(e) => handleDrop(e, (url) => setNewProduct({...newProduct, imageUrl: url}))}
                          className={cn(
                            "relative group flex flex-col sm:flex-row gap-4 p-4 rounded-3xl transition-all duration-300 border-2 border-dashed bg-slate-50/70",
                            isDragging ? "bg-brand-orange/10 border-brand-orange ring-4 ring-brand-orange/20" : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex-1 space-y-3">
                            <input 
                              value={newProduct.imageUrl}
                              onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 focus:outline-none focus:border-brand-orange"
                              placeholder="Paste direct cover image URL (e.g. https://...)" 
                            />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                              <label className="cursor-pointer w-full sm:w-auto px-4 py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 active:scale-98 transition-all shadow-md shadow-brand-blue/20 flex items-center justify-center gap-2">
                                <Camera className="w-4 h-4 text-brand-orange" />
                                Browse / Take Photo(s)
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple
                                  className="hidden" 
                                  onChange={(e) => handleImagePick(e, (url) => setNewProduct({...newProduct, imageUrl: url}))}
                                />
                              </label>
                              <span className="text-[10px] text-slate-400 font-medium text-center sm:text-left">
                                Drop 1 or multiple photos (1st is cover, rest go to gallery)
                              </span>
                            </div>
                          </div>

                          {/* Live Preview Square */}
                          <div className="w-full sm:w-32 h-44 sm:h-32 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0 relative shadow-inner flex items-center justify-center">
                            {newProduct.imageUrl ? (
                              <img 
                                referrerPolicy="no-referrer"
                                src={newProduct.imageUrl} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                }}
                              />
                            ) : (
                              <div className="text-center p-3">
                                <Camera className="w-8 h-8 sm:w-6 sm:h-6 text-slate-300 mx-auto mb-1" />
                                <span className="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase block">No Cover Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Gallery Images / Angles Section */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="text-xs font-black text-brand-blue uppercase flex items-center gap-1.5">
                              <Images className="w-4 h-4 text-brand-orange" />
                              Additional Product Photos & Gallery Angles
                            </label>
                            <p className="text-[11px] text-slate-500">
                              Upload secondary photos (back views, fabric textures, embroidery close-ups, or model angles).
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit">
                            {(newProduct.additionalImages || []).length} Additional {((newProduct.additionalImages || []).length === 1) ? 'Photo' : 'Photos'}
                          </span>
                        </div>

                        {/* Inputs & Multi-Upload Bar */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <input 
                              value={additionalImageUrlInput}
                              onChange={e => setAdditionalImageUrlInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddAdditionalImageUrl();
                                }
                              }}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none focus:border-brand-orange"
                              placeholder="Paste photo URL(s) separated by comma/enter and click Add..." 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAddAdditionalImageUrl}
                              disabled={!additionalImageUrlInput.trim()}
                              className="px-4 py-3 bg-brand-blue hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add URL
                            </button>

                            <label className="cursor-pointer px-4 py-3 bg-brand-orange text-white hover:bg-brand-orange/90 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-brand-orange/20">
                              {isUploadingAdditional ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{isUploadingAdditional ? 'Processing...' : 'Upload Photos'}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                className="hidden" 
                                onChange={handleAdditionalImagesUpload}
                                disabled={isUploadingAdditional}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Additional Images Grid */}
                        {(newProduct.additionalImages && newProduct.additionalImages.length > 0) ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 max-h-64 overflow-y-auto">
                            {newProduct.additionalImages.map((imgUrl, imgIdx) => (
                              <div 
                                key={imgIdx} 
                                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs flex items-center justify-center"
                              >
                                <img 
                                  referrerPolicy="no-referrer"
                                  src={imgUrl} 
                                  alt={`Additional view ${imgIdx + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                  }}
                                />
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-brand-blue/80 backdrop-blur-xs text-white text-[9px] font-black rounded-md uppercase">
                                  #{imgIdx + 1}
                                </div>

                                {/* Hover Action Overlay */}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                                  <button
                                    type="button"
                                    onClick={() => handleSetAdditionalAsPrimary(imgIdx)}
                                    className="w-full py-1 px-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                    title="Set this photo as the main product cover"
                                  >
                                    <Star className="w-3 h-3 fill-current" /> Make Cover
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAdditionalImage(imgIdx)}
                                    className="w-full py-1 px-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                    title="Remove this photo"
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                            <p className="text-xs font-bold text-slate-500">No additional gallery photos added yet</p>
                            <p className="text-[10px] text-slate-400">Upload multiple photos or paste image URLs above to showcase back angles, embroidery close-ups, or fabric details.</p>
                          </div>
                        )}
                      </div>

                      {/* 3D Model GLB/GLTF */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                          <Box className="w-3.5 h-3.5 text-brand-orange" />
                          3D Interactive Model URL (GLB / GLTF - Optional)
                        </label>
                        <input 
                          value={newProduct.model3dUrl || ''}
                          onChange={e => setNewProduct({...newProduct, model3dUrl: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm focus:bg-white focus:border-brand-orange transition-all font-mono" 
                          placeholder="https://assets.tewaw.co.ke/models/jacket_3d.glb" 
                        />
                        <p className="text-[10px] text-slate-400">If supplied, buyers can rotate and inspect the 3D garment model live in the modal view.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PRICING & TIERS */}
                {productWizardStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5 sm:space-y-6"
                  >
                    <div className="p-3.5 sm:p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-brand-orange shrink-0" />
                      <div>
                        <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Step 3: Pricing Structure & Commercials</h5>
                        <p className="text-[11px] text-slate-500">Configure base unit pricing in KES and optional custom price tier display text.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase">Base Unit Price (KES)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-brand-orange">KES</span>
                          <input 
                            type="number"
                            value={newProduct.price}
                            onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                            className="w-full p-3.5 sm:p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl text-lg sm:text-base font-black text-brand-blue focus:bg-white focus:border-brand-orange transition-all" 
                            placeholder="1500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">Used as the base calculation price during instant quote estimations.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase">Formatted Price Range / Bulk Tier Text</label>
                        <input 
                          type="text"
                          value={newProduct.priceRange || ''}
                          onChange={e => setNewProduct({...newProduct, priceRange: e.target.value})}
                          className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-base sm:text-sm text-brand-blue focus:bg-white focus:border-brand-orange transition-all" 
                          placeholder="e.g. 1,500 - 2,500 or 100+ pcs @ 1,200"
                        />
                        <p className="text-[10px] text-slate-400">Custom label shown prominently on cards (overrides default KES display if provided).</p>
                      </div>

                      {/* Live Price Tag Preview */}
                      <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Storefront Card Preview:</span>
                          <span className="text-xs font-bold text-slate-600 truncate max-w-[180px] sm:max-w-none block">{newProduct.name || 'Garment Item'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-brand-blue bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                            {formatPriceDisplay(newProduct)}
                          </span>
                        </div>
                      </div>

                      {/* Google Merchant Center Compliance Sub-section */}
                      <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase rounded-md tracking-wider">Google Merchant & SEO</span>
                          <h6 className="text-xs font-black text-brand-blue uppercase tracking-wider">Merchant Center Standards</h6>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">Brand / Manufacturer</label>
                            <input 
                              type="text"
                              value={newProduct.brand || ''}
                              onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-orange transition-all"
                              placeholder="Tewaw Enterprise"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">SKU (Stock Keeping Unit)</label>
                            <input 
                              type="text"
                              value={newProduct.sku || ''}
                              onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-brand-orange transition-all"
                              placeholder="TEW-OVR-001"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">Stock Availability</label>
                            <select 
                              value={newProduct.availability || 'in_stock'}
                              onChange={e => setNewProduct({...newProduct, availability: e.target.value as any})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-orange transition-all cursor-pointer"
                            >
                              <option value="in_stock">In Stock (in_stock)</option>
                              <option value="out_of_stock">Out of Stock (out_of_stock)</option>
                              <option value="preorder">Preorder (preorder)</option>
                              <option value="backorder">Backorder (backorder)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">Condition</label>
                            <select 
                              value={newProduct.condition || 'new'}
                              onChange={e => setNewProduct({...newProduct, condition: e.target.value as any})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-orange transition-all cursor-pointer"
                            >
                              <option value="new">Brand New (new)</option>
                              <option value="refurbished">Refurbished</option>
                              <option value="used">Used / Pre-owned</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">GTIN / Barcode (Optional)</label>
                            <input 
                              type="text"
                              value={newProduct.gtin || ''}
                              onChange={e => setNewProduct({...newProduct, gtin: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-brand-orange transition-all"
                              placeholder="e.g. 0123456789012"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">MPN / Part Number (Optional)</label>
                            <input 
                              type="text"
                              value={newProduct.mpn || ''}
                              onChange={e => setNewProduct({...newProduct, mpn: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-brand-orange transition-all"
                              placeholder="e.g. MPN-UNIFORM-2025"
                            />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase">Google Taxonomy Category (Taxonomy)</label>
                            <input 
                              type="text"
                              value={newProduct.googleProductCategory || 'Apparel & Accessories > Clothing'}
                              onChange={e => setNewProduct({...newProduct, googleProductCategory: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-orange transition-all"
                              placeholder="Apparel & Accessories > Clothing > Uniforms"
                            />
                            <p className="text-[10px] text-slate-400">Included automatically in XML Merchant feed (`/api/merchant-feed.xml`) and Schema.org rich snippets.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: FABRIC COLORS & SIZES (VARIANTS) */}
                {productWizardStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5 sm:space-y-6"
                  >
                    <div className="p-3.5 sm:p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 flex items-center gap-3">
                      <Palette className="w-5 h-5 text-brand-orange shrink-0" />
                      <div>
                        <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Step 4: Fabric Colors & Sizing Variations</h5>
                        <p className="text-[11px] text-slate-500">Pick supported textile colors, standard garment sizes, and custom tailoring variants.</p>
                      </div>
                    </div>

                    {/* Fabric Colors Section */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-brand-orange" />
                          <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Available Fabric Colors</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleAllColors}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors"
                          >
                            {newProduct.colors?.length === PRESET_FABRIC_COLORS.length ? 'Deselect All' : 'Select All Presets'}
                          </button>
                          <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {newProduct.colors?.length || 0} / {PRESET_FABRIC_COLORS.length}
                          </span>
                        </div>
                      </div>

                      {/* Preset Color Pills */}
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar">
                        {PRESET_FABRIC_COLORS.map((c) => {
                          const isSelected = newProduct.colors?.includes(c);
                          const hex = getColorHex(c);
                          const isLight = c.toLowerCase() === 'white' || c.toLowerCase().includes('beige');
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleColor(c)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer select-none",
                                isSelected
                                  ? "border-brand-orange bg-brand-orange text-white shadow-xs scale-[1.02]"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-100 opacity-60"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-3 h-3 rounded-full inline-block shrink-0 shadow-xs",
                                  isLight && !isSelected ? "border border-slate-300" : ""
                                )}
                                style={{ background: hex }}
                              />
                              <span className="text-[11px] font-extrabold uppercase">{c}</span>
                              {isSelected && <X className="w-3 h-3 text-white/80 shrink-0 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Color Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customColorInput}
                          onChange={(e) => setCustomColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomColor();
                            }
                          }}
                          placeholder="Add custom color (e.g. Lime Green)..."
                          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-medium focus:outline-none focus:border-brand-orange"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="px-4 py-3 bg-brand-blue text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-brand-orange transition-colors shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Sizes & Variants Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand-orange" />
                          <h5 className="text-xs font-black text-brand-blue uppercase tracking-wider">Garment Sizes</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleAllSizes}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors"
                          >
                            {variants.filter(v => v.type === 'Size').length === PRESET_SIZES.length ? 'Deselect All' : 'Select All Sizes'}
                          </button>
                          <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {variants.length} Active
                          </span>
                        </div>
                      </div>

                      {/* Standard Size Preset Pills */}
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        {PRESET_SIZES.map((sizeName) => {
                          const isSelected = variants.some(v => v.name === sizeName && v.type === 'Size');
                          return (
                            <button
                              key={sizeName}
                              type="button"
                              onClick={() => toggleSizeVariant(sizeName)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border select-none flex items-center gap-1.5",
                                isSelected
                                  ? "border-brand-blue bg-brand-blue text-white shadow-xs scale-[1.02]"
                                  : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100 opacity-60"
                              )}
                            >
                              <span>{sizeName}</span>
                              {isSelected && <X className="w-3 h-3 text-white/80 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Variant Adder */}
                      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 sm:hidden">Type</label>
                          <select 
                            value={newVariant.type}
                            onChange={e => setNewVariant({...newVariant, type: e.target.value})}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          >
                            <option>Size</option>
                            <option>Color</option>
                            <option>Material</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 sm:hidden">Name</label>
                          <input 
                            placeholder="Name (e.g. 5XL, Heavy Cotton)"
                            value={newVariant.name}
                            onChange={e => setNewVariant({...newVariant, name: e.target.value})}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 sm:hidden">Add. Price (KES)</label>
                          <input 
                            type="number"
                            placeholder="Add. Price"
                            value={newVariant.price || ''}
                            onChange={e => setNewVariant({...newVariant, price: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button 
                            type="button"
                            onClick={() => {
                              if (newVariant.name) {
                                setVariants([...variants, newVariant]);
                                setNewVariant({ name: '', type: 'Size' });
                              }
                            }}
                            className="w-full py-2.5 bg-brand-blue text-white rounded-xl font-black text-xs uppercase hover:bg-brand-orange transition-colors"
                          >
                            ADD
                          </button>
                        </div>
                      </div>

                      {/* Active Variants Chips */}
                      {variants.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {variants.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white border border-brand-orange/30 px-3 py-1.5 rounded-xl shadow-2xs group">
                              <div className="flex flex-col leading-none">
                                <span className="text-[8px] font-black text-brand-orange uppercase">{v.type}</span>
                                <span className="text-xs font-bold text-brand-blue">{v.name}</span>
                              </div>
                              {v.price && <span className="text-[10px] font-mono font-bold text-slate-400">+{v.price}</span>}
                              <button 
                                type="button"
                                onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                                title="Remove variant"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary Card */}
                    <div className="p-3.5 sm:p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h6 className="text-xs font-black text-emerald-900 uppercase">Product Configuration Complete</h6>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          {newProduct.name || 'Unnamed'} • {newProduct.category || 'General'} • {newProduct.colors?.length || 0} colors • {variants.length} size variants
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 shadow-xs">
                        Ready to Save
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sticky Wizard Footer with Navigation */}
              <div className="shrink-0 p-3.5 sm:p-5 border-t border-slate-100 bg-white sm:bg-slate-50/95 backdrop-blur-md flex items-center justify-between gap-3 z-10 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-3 sm:px-4 py-2.5 font-bold text-slate-400 hover:text-slate-700 uppercase text-xs transition-colors shrink-0"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {/* Back Button */}
                  {productWizardStep > 1 && (
                    <button 
                      type="button"
                      onClick={() => setProductWizardStep(prev => Math.max(1, prev - 1))}
                      className="px-3.5 sm:px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold uppercase text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                    </button>
                  )}

                  {/* Next Step Button */}
                  {productWizardStep < 4 ? (
                    <button 
                      type="button"
                      onClick={() => {
                        if (productWizardStep === 1 && !newProduct.name) {
                          toast.warning('Name Required', 'Please enter a product name before proceeding.');
                          return;
                        }
                        if (productWizardStep === 2 && !newProduct.imageUrl) {
                          toast.warning('Image Required', 'Please provide or upload a product photo.');
                          return;
                        }
                        setProductWizardStep(prev => Math.min(4, prev + 1));
                      }}
                      className="px-5 sm:px-6 py-2.5 bg-brand-blue text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md hover:bg-slate-900 active:scale-98 transition-all flex items-center gap-1.5"
                    >
                      Next Step <ChevronRight className="w-4 h-4 text-brand-orange" />
                    </button>
                  ) : (
                    /* Final Save / Update Button */
                    <button 
                      type="button"
                      onClick={handleAddProduct}
                      className="px-6 sm:px-8 py-2.5 bg-brand-orange text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-brand-orange/25 hover:bg-brand-orange/90 active:scale-98 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Update' : 'Save'} Product
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white/95 backdrop-blur-sm rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedProductIds.length > 0 && selectedProductIds.length === displayProducts.length} 
                    onChange={(e) => handleSelectAllProducts(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer" 
                  />
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Image</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Price (KES)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayProducts.map((p, idx) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <tr key={p.id || `disp-${idx}`} className={cn("hover:bg-slate-50 transition-colors group", isSelected && "bg-orange-50/40")}>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleToggleSelectProduct(p.id)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleQuickImageOpen(p)}
                        className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group/img cursor-pointer block"
                        title="Click to Manage Photos & Gallery"
                      >
                        <img referrerPolicy="no-referrer" src={p.imageUrl || PLACEHOLDER_PRODUCT_IMAGE} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE; }} />
                        {((p.additionalImages && p.additionalImages.length > 0) || (p.images && p.images.length > 0)) && (
                          <div className="absolute top-0.5 right-0.5 px-1 py-0.2 bg-brand-orange text-white text-[8px] font-black rounded-xs uppercase leading-none shadow-xs">
                            +{(p.additionalImages || p.images).length}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-brand-blue/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Images className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-blue">
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {((p.additionalImages && p.additionalImages.length > 0) || (p.images && p.images.length > 0)) && (
                            <span className="text-[8px] text-brand-blue uppercase font-black bg-brand-blue/5 border border-brand-blue/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Images className="w-2.5 h-2.5 text-brand-orange" />
                              {1 + (p.additionalImages || p.images).length} Photos
                            </span>
                          )}
                          {p.variants && p.variants.length > 0 && (
                            <span className="text-[8px] text-brand-orange uppercase font-black bg-brand-orange/5 px-2 py-0.5 rounded-full w-fit">
                              {p.variants.length} Variants
                            </span>
                          )}
                          {p.colors && p.colors.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-1 overflow-hidden p-0.5">
                                {p.colors.slice(0, 5).map((c: string, cIdx: number) => (
                                  <span
                                    key={cIdx}
                                    title={c}
                                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs border border-white"
                                    style={{ background: getColorHex(c) }}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                                {p.colors.length} {p.colors.length === 1 ? 'color' : 'colors'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 uppercase tracking-tighter font-bold">{p.category}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-orange">
                      {formatPriceDisplay(p)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                      <button 
                        onClick={() => handleQuickImageOpen(p)}
                        className="px-3 py-1.5 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        title="Manage Images & Gallery"
                      >
                        <Images className="w-3.5 h-3.5" /> Photos
                      </button>
                      <button 
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Edit Product Details"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
           {displayProducts.map((p, idx) => {
             const isSelected = selectedProductIds.includes(p.id);
             return (
               <div key={p.id || `disp-m-${idx}`} className={cn("p-4 flex items-center gap-3", isSelected && "bg-orange-50/40")}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => handleToggleSelectProduct(p.id)}
                    className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange shrink-0 cursor-pointer" 
                  />
                  <button 
                    onClick={() => handleQuickImageOpen(p)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group/mimg cursor-pointer"
                    title="Click to Manage Photos"
                  >
                     <img referrerPolicy="no-referrer" src={p.imageUrl || PLACEHOLDER_PRODUCT_IMAGE} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE; }} />
                     {((p.additionalImages && p.additionalImages.length > 0) || (p.images && p.images.length > 0)) && (
                       <div className="absolute top-0.5 right-0.5 px-1 py-0.2 bg-brand-orange text-white text-[8px] font-black rounded-xs uppercase leading-none shadow-xs">
                         +{(p.additionalImages || p.images).length}
                       </div>
                     )}
                     <div className="absolute inset-0 bg-brand-blue/60 text-white flex items-center justify-center opacity-0 group-hover/mimg:opacity-100 transition-opacity">
                        <Images className="w-5 h-5" />
                     </div>
                  </button>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-1.5 flex-wrap">
                       <p className="text-[9px] font-black text-brand-orange uppercase tracking-widest">{p.category}</p>
                       {((p.additionalImages && p.additionalImages.length > 0) || (p.images && p.images.length > 0)) && (
                         <span className="text-[7px] text-brand-blue font-black uppercase bg-brand-blue/10 px-1.5 py-0.2 rounded-full">
                           {1 + (p.additionalImages || p.images).length} Photos
                         </span>
                       )}
                     </div>
                     <h4 className="font-bold text-brand-blue leading-tight truncate">{p.name}</h4>
                     <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                        {formatPriceDisplay(p)}
                     </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => handleQuickImageOpen(p)}
                      className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center active:scale-90 transition-transform"
                      title="Manage Photos"
                    >
                      <Images className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(p)}
                      className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90 transition-transform"
                      title="Edit Product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-transform"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Import Dataset Preview Modal */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 bg-brand-blue/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[36px] max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-brand-orange/30"
            >
              <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-display font-black text-brand-blue uppercase">Import Preview</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    File: <span className="font-bold text-brand-orange">{importFileName}</span> ({importedProductsPreview.length} item{importedProductsPreview.length === 1 ? '' : 's'} parsed)
                  </p>
                </div>
                <button
                  onClick={() => { setImportModalOpen(false); setImportedProductsPreview([]); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Ready to Import to Firestore</p>
                    <p className="text-slate-650 mt-0.5">
                      Review the parsed products below before confirming. Products with matching IDs or names will be updated seamlessly.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 font-black uppercase">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price (KES)</th>
                        <th className="p-3">Colors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {importedProductsPreview.slice(0, 50).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-brand-blue">{item.name}</td>
                          <td className="p-3 text-slate-600">{item.category}</td>
                          <td className="p-3 font-mono font-bold text-brand-orange">{item.price || item.priceRange || '0'}</td>
                          <td className="p-3 text-slate-500">{item.colors?.length ? `${item.colors.length} colors` : 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedProductsPreview.length > 50 && (
                    <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-bold uppercase">
                      + {importedProductsPreview.length - 50} more items
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => { setImportModalOpen(false); setImportedProductsPreview([]); }}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-8 py-3 bg-brand-orange hover:bg-brand-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-brand-orange/20"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Confirm & Import {importedProductsPreview.length} Items
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Image Update Modal */}
      <AnimatePresence>
        {editingImageProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setEditingImageProduct(null)}
                className="absolute right-6 top-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest">{editingImageProduct.category}</span>
                <h3 className="text-xl font-display font-black text-brand-blue uppercase">{editingImageProduct.name}</h3>
                <p className="text-xs text-slate-500">Update cover image and additional gallery photos directly in the database.</p>
              </div>

              {/* Image Preview & Upload Zone */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {/* Cover Image Section */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center justify-between">
                    <span>Cover Photo (Primary)</span>
                    <span className="text-[10px] font-bold text-brand-blue">Main Thumbnail</span>
                  </label>
                  <div className="w-full h-44 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                    <img 
                      referrerPolicy="no-referrer"
                      src={quickImageUrl || editingImageProduct.imageUrl} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white text-xs font-bold uppercase tracking-wider">
                      Primary Cover
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={quickImageUrl}
                      onChange={(e) => setQuickImageUrl(e.target.value)}
                      placeholder="Paste cover photo URL..."
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none focus:border-brand-orange"
                    />
                    <label className="cursor-pointer px-4 bg-slate-100 hover:bg-slate-200 text-brand-blue border border-slate-200 rounded-xl flex items-center justify-center transition-colors shrink-0" title="Upload cover photo">
                      <Camera className="w-4 h-4 text-brand-orange" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImagePick(e, (url) => setQuickImageUrl(url))}
                      />
                    </label>
                  </div>
                </div>

                {/* Additional Images Section */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                      <Images className="w-3.5 h-3.5 text-brand-orange" />
                      Additional Gallery Photos ({quickAdditionalImages.length})
                    </label>
                  </div>

                  {/* Add Input Bar */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={quickAdditionalInput}
                      onChange={(e) => setQuickAdditionalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = quickAdditionalInput.trim();
                          if (!val) return;
                          const urls = val
                            .split(/[\n,;\s]+/)
                            .map(u => u.trim())
                            .filter(u => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')));
                          if (urls.length > 0) {
                            const valid = urls.filter(u => !quickAdditionalImages.includes(u) && u !== quickImageUrl);
                            if (valid.length > 0) {
                              setQuickAdditionalImages(prev => [...prev, ...valid]);
                              toast.success('Photos Added', `Added ${valid.length} photo(s) to gallery.`);
                            }
                            setQuickAdditionalInput('');
                          }
                        }
                      }}
                      placeholder="Paste additional image URL(s)..."
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = quickAdditionalInput.trim();
                        if (!val) return;
                        const urls = val
                          .split(/[\n,;\s]+/)
                          .map(u => u.trim())
                          .filter(u => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')));
                        if (urls.length > 0) {
                          const valid = urls.filter(u => !quickAdditionalImages.includes(u) && u !== quickImageUrl);
                          if (valid.length > 0) {
                            setQuickAdditionalImages(prev => [...prev, ...valid]);
                            toast.success('Photos Added', `Added ${valid.length} photo(s) to gallery.`);
                          }
                          setQuickAdditionalInput('');
                        }
                      }}
                      disabled={!quickAdditionalInput.trim()}
                      className="px-3 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-900 transition-colors"
                      title="Add URL(s)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <label className="cursor-pointer px-3 py-2 bg-brand-orange text-white hover:bg-brand-orange/90 rounded-xl flex items-center justify-center transition-colors shrink-0 text-xs font-bold gap-1 shadow-xs" title="Upload multiple gallery photos">
                      {isQuickUploadingAdditional ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="hidden" 
                        onChange={async (e) => {
                          const fileList = e.target.files;
                          if (!fileList || fileList.length === 0) return;
                          
                          const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
                          if (imageFiles.length === 0) return;

                          setIsQuickUploadingAdditional(true);
                          try {
                            const uploadPromises = imageFiles.map(file => 
                              new Promise<string>((resolve) => compressImageFile(file, resolve, false))
                            );
                            const urls = await Promise.all(uploadPromises);
                            const valid = urls.filter(Boolean).filter(u => !quickAdditionalImages.includes(u) && u !== quickImageUrl);
                            setQuickAdditionalImages(prev => [...prev, ...valid]);
                            toast.success('Photos Added', `Added ${valid.length} photo(s) to gallery.`);
                          } catch (err) {
                            console.error('Error uploading quick gallery images:', err);
                            toast.error('Upload Error', 'Could not process selected photos.');
                          } finally {
                            setIsQuickUploadingAdditional(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Thumbnail Previews */}
                  {quickAdditionalImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80 max-h-36 overflow-y-auto">
                      {quickAdditionalImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square">
                          <img 
                            referrerPolicy="no-referrer"
                            src={img} 
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newAddl = quickAdditionalImages.filter((_, i) => i !== idx);
                                if (quickImageUrl) newAddl.unshift(quickImageUrl);
                                setQuickImageUrl(img);
                                setQuickAdditionalImages(newAddl);
                              }}
                              className="p-1.5 bg-brand-orange text-white rounded-md text-[9px] hover:bg-brand-orange/90"
                              title="Make Cover"
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickAdditionalImages(quickAdditionalImages.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 bg-red-600 text-white rounded-md text-[9px] hover:bg-red-700"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic text-center py-1">No additional gallery photos attached.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setEditingImageProduct(null)}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveQuickImage}
                  disabled={!quickImageUrl}
                  className="px-6 py-3 rounded-xl bg-brand-orange text-white font-bold text-xs hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 disabled:opacity-50"
                >
                  Save Images to Database
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersModule() {
  const { toast, promptConfirm } = usePopup();
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    return () => {
      unsubOrders();
      unsubSettings();
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      await addDoc(collection(db, 'notifications'), {
        title: 'Order Updated',
        message: `Order #${id.slice(0, 5)} moved to ${status}`,
        type: 'order',
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast.success('Status Updated', `Order #${id.slice(0, 8)} status changed to ${status}.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
      toast.error('Update Failed', err.message || 'Could not update order status.');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    promptConfirm({
      title: 'Delete Order Record',
      message: `Are you sure you want to permanently delete order #${orderId.slice(0, 8)} from the database?`,
      confirmText: 'Delete Order',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'orders', orderId));
          toast.success('Order Deleted', `Order #${orderId.slice(0, 8)} removed successfully.`);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.DELETE, 'orders');
          toast.error('Delete Failed', err.message || 'Could not delete order.');
        }
      }
    });
  };

  const getOrderQuoteData = (o: any) => {
    return calculateQuoteDetails(
      (o.items || []).map((item: any) => ({
        id: item.id || 'item',
        name: item.name || 'Custom Garment',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        category: item.category || 'General',
        selectedColor: item.selectedColor || 'Standard',
      })),
      {
        customerName: o.customerName || 'Valued Client',
        customerEmail: o.customerEmail || 'client@example.com',
        customerPhone: o.customerPhone || '',
        companyName: o.companyName || '',
        deliveryLocation: o.deliveryLocation || 'Nairobi, Kenya',
        brandingType: 'embroidery',
        includeVat: true,
        orderId: o.id,
        paymentStatus: o.status === 'completed' ? 'paid' : 'pending',
      }
    );
  };

  const handlePrintOrderQuote = (o: any) => {
    const quoteData = getOrderQuoteData(o);
    printProformaQuote(quoteData, settings?.headerLogoUrl);
  };

  const handlePrintTaxInvoice = (o: any) => {
    const quoteData = getOrderQuoteData(o);
    printTaxInvoice(quoteData, settings?.headerLogoUrl);
  };

  const handlePrintReceipt = (o: any) => {
    const quoteData = getOrderQuoteData(o);
    printReceipt(quoteData, settings?.headerLogoUrl);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Orders & Documentation</h2>
          <p className="text-xs md:text-sm text-slate-500">Manage customer orders, generate branded Proforma Quotes, Tax Invoices, and Official Receipts.</p>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total (KES)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Branded Documents & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">#{o.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-blue">{o.customerName || 'Guest'}</p>
                    <p className="text-[10px] text-slate-400">{o.customerEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {o.items?.length || 0} Items
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-blue">{o.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      o.status === 'completed' ? "bg-[#269453]/10 text-[#269453]" : "bg-orange-100 text-orange-700"
                    )}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 items-center">
                      <button
                        onClick={() => handlePrintOrderQuote(o)}
                        className="px-2.5 py-1.5 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-brand-green hover:text-white transition-all"
                        title="Print Official Proforma Quotation with Logo"
                      >
                        <Printer className="w-3 h-3" /> Quote
                      </button>
                      <button
                        onClick={() => handlePrintTaxInvoice(o)}
                        className="px-2.5 py-1.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-brand-blue hover:text-white transition-all"
                        title="Print Official Tax Invoice with Logo & KRA PIN"
                      >
                        <FileText className="w-3 h-3" /> Invoice
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(o)}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-all"
                        title="Print Official Payment Receipt with Logo & Stamp"
                      >
                        <Receipt className="w-3 h-3" /> Receipt
                      </button>
                      <select 
                        value={o.status || 'pending'}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="text-[10px] font-black uppercase bg-slate-100 border-none rounded-lg px-2 py-1.5 ml-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button 
                        onClick={() => handleDeleteOrder(o.id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-1"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {orders.map(o => (
            <div key={o.id} className="p-4 space-y-4">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-300">#{o.id.slice(0, 8)}</p>
                    <h4 className="font-bold text-brand-blue">{o.customerName || 'Guest'}</h4>
                    <p className="text-[10px] text-slate-400">{o.customerEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      o.status === 'completed' ? "bg-[#269453]/10 text-[#269453]" : "bg-orange-100 text-orange-700"
                    )}>
                      {o.status}
                    </span>
                    <button 
                      onClick={() => handleDeleteOrder(o.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
               
               <div className="flex justify-between items-center py-2 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.items?.length || 0} Items</span>
                  <span className="font-mono font-black text-brand-blue">KES {o.totalAmount?.toLocaleString()}</span>
               </div>

               <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handlePrintOrderQuote(o)}
                    className="py-2 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-1"
                    title="Print Quote with Logo"
                  >
                    <Printer className="w-3 h-3" /> Quote
                  </button>
                  <button
                    onClick={() => handlePrintTaxInvoice(o)}
                    className="py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-1"
                    title="Print Tax Invoice with Logo"
                  >
                    <FileText className="w-3 h-3" /> Invoice
                  </button>
                  <button
                    onClick={() => handlePrintReceipt(o)}
                    className="py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-1"
                    title="Print Receipt with Logo"
                  >
                    <Receipt className="w-3 h-3" /> Receipt
                  </button>
               </div>

               <select 
                 value={o.status || 'pending'}
                 onChange={(e) => updateStatus(o.id, e.target.value)}
                 className="w-full text-[10px] font-black uppercase bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5"
               >
                 <option value="pending">Status: Pending</option>
                 <option value="processing">Status: Processing</option>
                 <option value="completed">Status: Completed</option>
                 <option value="cancelled">Status: Cancelled</option>
               </select>
            </div>
          ))}
          {orders.length === 0 && (
             <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No orders found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MailModule({ user }: { user: any }) {
  const { toast, promptConfirm } = usePopup();
  const [activeTab, setActiveTab] = useState<'inquiries' | 'gmail'>('inquiries');
  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com');

  // Inquiries State
  const [mails, setMails] = useState<any[]>([]);
  const [activeMail, setActiveMail] = useState<any | null>(null);
  const [inquiriesSearch, setInquiriesSearch] = useState('');

  // Gmail State
  const [gmailToken, setGmailToken] = useState<string | null>(getCachedGmailToken());
  const [gmailMails, setGmailMails] = useState<GmailMessage[]>([]);
  const [activeGmailMail, setActiveGmailMail] = useState<GmailMessage | null>(null);
  const [gmailSearch, setGmailSearch] = useState('');
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Portal Compose / Reply State
  const [isComposing, setIsComposing] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '', threadId: '', messageId: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [gmailSendError, setGmailSendError] = useState<string | null>(null);
  const [gmailSendSuccess, setGmailSendSuccess] = useState<string | null>(null);

  const handleDeleteInquiry = (mailId: string) => {
    promptConfirm({
      title: 'Archive / Delete Inquiry',
      message: 'Are you sure you want to permanently delete this customer inquiry message?',
      confirmText: 'Delete Message',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'messages', mailId));
          setActiveMail(null);
          toast.success('Message Removed', 'The customer inquiry was deleted successfully.');
        } catch (err: any) {
          handleFirestoreError(err, OperationType.DELETE, 'messages');
          toast.error('Delete Failed', err.message || 'Failed to delete message.');
        }
      }
    });
  };

  // Helper to extract email address from "Name <email@domain.com>"
  const parseSenderEmail = (fromStr: string): string => {
    if (!fromStr) return '';
    const match = fromStr.match(/<([^>]+)>/);
    return match ? match[1] : fromStr.trim();
  };

  // Inquiries listener
  useEffect(() => {
    return onSnapshot(query(collection(db, 'messages'), orderBy('receivedAt', 'desc')), (snapshot) => {
      setMails(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));
  }, []);

  // Fetch Gmail
  const loadGmail = async (tokenToUse: string) => {
    setGmailLoading(true);
    setGmailError(null);
    try {
      const gMails = await fetchGmailInbox(tokenToUse, 15);
      setGmailMails(gMails);
    } catch (err: any) {
      setGmailError(err.message || 'Failed to fetch messages from your Gmail account.');
    } finally {
      setGmailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gmail' && gmailToken) {
      loadGmail(gmailToken);
    }
  }, [activeTab, gmailToken]);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setGmailError(null);
    try {
      const token = await connectGmailAccount();
      setGmailToken(token);
    } catch (err: any) {
      setGmailError(err.message || 'Gmail OAuth connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = () => {
    setCachedGmailToken(null);
    setGmailToken(null);
    setGmailMails([]);
    setActiveGmailMail(null);
    setIsComposing(false);
  };

  // Switch to composition view with empty fields
  const handleOpenNewCompose = () => {
    setComposeForm({ to: '', subject: '', body: '', threadId: '', messageId: '' });
    setGmailSendError(null);
    setGmailSendSuccess(null);
    setIsComposing(true);
    setActiveMail(null);
    setActiveGmailMail(null);
  };

  // Switch to composition prefilled as reply to website inquiry
  const handleInquiryReplyPortal = (mail: any) => {
    setComposeForm({
      to: mail.fromEmail || '',
      subject: (mail.subject || '').startsWith('RE:') ? mail.subject : `RE: ${mail.subject || 'Website Inquiry'}`,
      body: `\n\n--- Original Inquiry ---\nReceived on: ${mail.receivedAt?.toDate ? mail.receivedAt.toDate().toLocaleString() : 'Recent'}\nFrom: ${mail.from || 'Web Customer'}\nMessage:\n${mail.body}`,
      threadId: '',
      messageId: ''
    });
    setGmailSendError(null);
    setGmailSendSuccess(null);
    setIsComposing(true);
  };

  // Switch to composition prefilled as reply to Gmail message
  const handleGmailReplyPortal = (gmailMail: GmailMessage) => {
    const toEmail = parseSenderEmail(gmailMail.from);
    setComposeForm({
      to: toEmail,
      subject: gmailMail.subject.toLowerCase().startsWith('re:') ? gmailMail.subject : `Re: ${gmailMail.subject}`,
      body: `\n\n--- Original Message ---\nOn ${gmailMail.date}, ${gmailMail.from} wrote:\n> ${gmailMail.body.replace(/\n/g, '\n> ')}`,
      threadId: gmailMail.threadId,
      messageId: gmailMail.messageId || ''
    });
    setGmailSendError(null);
    setGmailSendSuccess(null);
    setIsComposing(true);
  };

  // Filter computations
  const filteredInquiries = mails.filter(m => {
    const q = inquiriesSearch.toLowerCase();
    return (
      (m.subject || '').toLowerCase().includes(q) ||
      (m.from || '').toLowerCase().includes(q) ||
      (m.fromEmail || '').toLowerCase().includes(q) ||
      (m.body || '').toLowerCase().includes(q)
    );
  });

  const filteredGmail = gmailMails.filter(m => {
    const q = gmailSearch.toLowerCase();
    return (
      (m.subject || '').toLowerCase().includes(q) ||
      (m.from || '').toLowerCase().includes(q) ||
      (m.body || '').toLowerCase().includes(q)
    );
  });
  // Render the central Compose pane when isComposing is true
  const renderComposePane = () => (
    <div className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl md:text-2xl font-display font-black text-brand-blue tracking-tight uppercase text-left">
            {composeForm.threadId ? "Reply to Email Thread" : "Compose Message"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 text-left">Compose, review and dispatch emails directly via your Google Workspace account.</p>
        </div>
        <button 
          onClick={() => setIsComposing(false)}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {gmailSendSuccess && (
        <div className="p-5 bg-[#269453]/10 text-[#269453] rounded-3xl border border-[#269453]/20 text-xs font-bold flex items-center gap-3 text-left">
          <CheckCircle2 className="w-5 h-5 text-[#269453] shrink-0" />
          <div>
            <p className="font-extrabold text-[#269453] uppercase tracking-wide">Email Sent!</p>
            <p className="text-[#269453]/80 font-medium">Your reply has been successfully delivered through secured Google API relays.</p>
          </div>
        </div>
      )}

      {gmailSendError && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 text-xs font-semibold flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{gmailSendError}</span>
        </div>
      )}

      {!gmailToken && (
        <div className="p-5 bg-amber-50 text-amber-900 rounded-3xl border border-amber-100 text-xs font-semibold flex items-start gap-3 text-left leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block mb-1 uppercase tracking-wide">Gmail Authorized Access Required</span>
            <span className="text-slate-650">
              You must link your business Google environment under the <strong>"Gmail Inbox"</strong> tab before you can transmit secure emails from the portal helper.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 text-left">Recipient To Email</label>
          <input 
            type="email" 
            required
            placeholder="recipient@example.com"
            value={composeForm.to}
            onChange={e => setComposeForm({...composeForm, to: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 text-left">Subject Header</label>
          <input 
            type="text" 
            required
            placeholder="Enter subject..."
            value={composeForm.subject}
            onChange={e => setComposeForm({...composeForm, subject: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 text-left">Compose Message</label>
          <textarea 
            required
            rows={12}
            placeholder="Write your email here..."
            value={composeForm.body}
            onChange={e => setComposeForm({...composeForm, body: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue font-sans whitespace-pre-wrap leading-relaxed" 
          />
        </div>

        <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsComposing(false)}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sendingEmail || !gmailToken || !composeForm.to || !composeForm.subject || !composeForm.body}
            onClick={async () => {
              if (!gmailToken) return;
              setSendingEmail(true);
              setGmailSendError(null);
              setGmailSendSuccess(null);
              try {
                await sendGmailEmail(
                  gmailToken,
                  composeForm.to,
                  composeForm.subject,
                  composeForm.body,
                  composeForm.threadId || undefined,
                  composeForm.messageId || undefined
                );
                setGmailSendSuccess("Success");
                setTimeout(() => {
                  setGmailSendSuccess(null);
                  setIsComposing(false);
                  if (activeTab === 'gmail') {
                    loadGmail(gmailToken);
                  }
                }, 1500);
              } catch (err: any) {
                setGmailSendError(err.message || 'Error occurred while sending raw mime email payload through Google APIs.');
              } finally {
                setSendingEmail(false);
              }
            }}
            className={cn(
              "px-6 py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center gap-2",
              (sendingEmail || !gmailToken || !composeForm.to || !composeForm.subject || !composeForm.body) && "opacity-50 cursor-not-allowed"
            )}
          >
            {sendingEmail ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> Dispatching...
              </>
            ) : (
              "Send Dispatch"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Internal Webmail</h2>
          <p className="text-slate-550 text-xs mt-1 font-medium mr-4">Manage customer website inquiries or your linked business Gmail inbox directly.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200/60 w-full sm:w-auto shrink-0 animate-fade-in">
          <button
            onClick={() => {
              setActiveTab('inquiries');
              setIsComposing(false);
            }}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'inquiries' 
                ? "bg-white text-brand-blue shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Website Inquiries
          </button>
          <button
            onClick={() => {
              setActiveTab('gmail');
              setIsComposing(false);
            }}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'gmail' 
                ? "bg-white text-brand-blue shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Gmail Inbox
            {gmailToken ? (
              <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'inquiries' ? (
        <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden brand-edge-blue h-[750px]">
          {/* Inquiries Sidebar */}
          <div className={cn(
            "w-full md:w-1/3 border-r border-slate-100 overflow-y-auto flex flex-col",
            (activeMail || isComposing) ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
              <button 
                onClick={handleOpenNewCompose}
                className="w-full py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Compose New Email
              </button>
              <input 
                type="text" 
                placeholder="Search website inquiries..." 
                value={inquiriesSearch}
                onChange={e => setInquiriesSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue" 
              />
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
              {filteredInquiries.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => {
                    setActiveMail(m);
                    setIsComposing(false);
                  }}
                  className={cn(
                    "p-4 md:p-6 cursor-pointer transition-colors block text-left",
                    activeMail?.id === m.id && !isComposing ? "bg-blue-50 border-l-4 border-brand-blue" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-bold text-brand-blue truncate w-3/4 text-sm">{m.subject || '(No Subject)'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
                      {m.receivedAt?.toDate ? format(m.receivedAt.toDate(), 'HH:mm') : 'Now'}
                    </span>
                  </div>
                  <p className="text-xs text-brand-orange font-bold uppercase tracking-widest mb-1.5">
                    From: {m.from || m.fromEmail || 'Web Customer'}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.body}</p>
                </div>
              ))}
              {filteredInquiries.length === 0 && (
                <p className="p-10 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">No matching inquiries found</p>
              )}
            </div>
          </div>

          {/* Inquiry Reader */}
          <div className={cn(
            "flex-1 flex flex-col",
            (activeMail || isComposing) ? "flex" : "hidden md:flex"
          )}>
            {isComposing ? (
              renderComposePane()
            ) : activeMail ? (
              <div className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                  <div className="w-full">
                    <div className="flex items-center gap-3 md:hidden mb-4">
                      <button 
                        onClick={() => setActiveMail(null)}
                        className="p-2 -ml-2 text-brand-blue font-black text-xs uppercase flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Back to List
                      </button>
                    </div>
                    <h3 className="text-xl md:text-2xl font-display font-black text-brand-blue tracking-tight leading-tight uppercase text-left">
                      {activeMail.subject || '(No Subject)'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 text-left">
                      Inquiry From: <span className="font-extrabold text-brand-blue">{activeMail.from || 'Web Customer'}</span>
                    </p>
                    {activeMail.fromEmail && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5 text-left">{activeMail.fromEmail}</p>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto shrink-0 animate-fade-in flex-wrap md:flex-nowrap">
                    <button 
                      onClick={() => handleInquiryReplyPortal(activeMail)}
                      className="flex-1 md:flex-none px-5 py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors"
                    >
                      Reply Online (Portal)
                    </button>
                    <button 
                      onClick={() => {
                        const subject = encodeURIComponent(`RE: ${activeMail.subject}`);
                        const body = encodeURIComponent(`\n\n--- Original Inquiry ---\n${activeMail.body}`);
                        window.open(`mailto:${activeMail.fromEmail || ''}?subject=${subject}&body=${body}`);
                      }}
                      className="flex-1 md:flex-none px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                      title="Generate external mailto action link inside default OS clients"
                    >
                      External Client
                    </button>
                    <button 
                      onClick={() => handleDeleteInquiry(activeMail.id)}
                      className="flex-1 md:flex-none px-5 py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-red-50 hover:text-red-700 transition-all font-medium"
                    >
                      Archive / Delete
                    </button>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none text-slate-650 leading-relaxed bg-brand-light/25 p-6 md:p-8 rounded-[32px] border border-slate-100 text-sm md:text-base whitespace-pre-wrap text-left">
                  {activeMail.body}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 animate-pulse text-brand-blue/30" />
                </div>
                <p className="font-display font-black text-xl uppercase tracking-tight text-slate-300">Select an inquiry to read</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden brand-edge-blue h-[750px]">
          {!gmailToken ? (
            /* Gmail Connection Card */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6 my-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 ring-8 ring-slate-50">
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-4">
                <h4 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue text-center">Connect your Gmail</h4>
                {isGoogleUser ? (
                  <p className="text-xs text-slate-650 leading-relaxed text-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 max-w-sm mx-auto">
                    🎉 <strong>Seamless Link Available!</strong> Since you signed in using your Google account (<strong>{user?.email}</strong>), you can fast-link webmail permissions with a single click.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed text-center">
                    Securely authorize your Google Workspace account to read primary inbox emails and send/compose mail directly inside the portal.
                  </p>
                )}
              </div>
              
              {gmailError && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl border border-red-100 flex items-start gap-2 text-left max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{gmailError}</span>
                </div>
              )}

              <button
                onClick={handleConnectGmail}
                disabled={isConnecting}
                className="w-full relative group transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 duration-200 text-white rounded-2xl font-black hover:bg-slate-800 transition-all select-none">
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span className="text-xs uppercase tracking-widest text-white">
                    {isConnecting ? 'Linking Account...' : isGoogleUser ? 'Fast-Link Google Gmail' : 'Connect Google Gmail'}
                  </span>
                </div>
              </button>
              <div className="flex justify-center text-[10px] uppercase font-mono tracking-wider text-slate-400 gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#269453] rounded-full mt-1 animate-ping" />
                Read-Write Portal Integrations
              </div>
            </div>
          ) : (
            /* Gmail Inbox dual column Layout */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
              {/* Left Column: Gmail list */}
              <div className={cn(
                "w-full md:w-1/3 border-r border-slate-100 overflow-y-auto flex flex-col",
                (activeGmailMail || isComposing) ? "hidden md:flex" : "flex"
              )}>
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-2">
                  <button 
                    onClick={handleOpenNewCompose}
                    className="w-full py-2.5 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Compose New Email
                  </button>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Search Gmail..." 
                      value={gmailSearch}
                      onChange={e => setGmailSearch(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue" 
                    />
                    <button 
                      onClick={() => loadGmail(gmailToken)}
                      disabled={gmailLoading}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shrink-0 flex items-center"
                      title="Refresh Inbox"
                    >
                      <RefreshCw className={cn("w-4 h-4", gmailLoading && "animate-spin")} />
                    </button>
                    <button 
                      onClick={handleDisconnectGmail}
                      className="px-3 py-2 bg-slate-100 font-black text-[9px] tracking-wider uppercase rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all shrink-0"
                      title="Disconnect Google account"
                    >
                      Exit
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-50 overflow-y-auto flex-1 text-left">
                  {gmailLoading && gmailMails.length === 0 && (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-blue" />
                      <p className="text-xs uppercase font-bold tracking-widest">Loading Gmail Messages...</p>
                    </div>
                  )}

                  {gmailError && (
                    <div className="p-4 m-4 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                      <p className="font-bold mb-1">Gmail Fetch Issue</p>
                      <p className="text-slate-600">{gmailError}</p>
                      <button 
                        onClick={() => loadGmail(gmailToken)}
                        className="mt-2 text-[10px] font-bold text-brand-blue uppercase underline tracking-wider block text-left"
                      >
                        Try Refreshing
                      </button>
                    </div>
                  )}

                  {!gmailLoading && filteredGmail.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        setActiveGmailMail(m);
                        setIsComposing(false);
                      }}
                      className={cn(
                        "p-4 md:p-6 cursor-pointer transition-colors block text-left",
                        activeGmailMail?.id === m.id && !isComposing ? "bg-blue-50 border-l-4 border-brand-blue" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-brand-blue truncate w-3/4 text-sm">{m.subject}</span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0 mt-0.5 truncate max-w-[80px]">
                          {m.date ? m.date.split(',')[0] : 'Recent'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-orange font-bold uppercase tracking-widest mb-1.5 mr-2 truncate">
                        From: {m.from}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.snippet}</p>
                    </div>
                  ))}

                  {!gmailLoading && filteredGmail.length === 0 && !gmailError && (
                    <p className="p-10 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">No matching emails found</p>
                  )}
                </div>
              </div>

              {/* Right Column: Gmail message details */}
              <div className={cn(
                "flex-1 flex flex-col",
                (activeGmailMail || isComposing) ? "flex" : "hidden md:flex"
              )}>
                {isComposing ? (
                  renderComposePane()
                ) : activeGmailMail ? (
                  <div className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                      <div className="w-full">
                        <div className="flex items-center gap-3 md:hidden mb-4">
                          <button 
                            onClick={() => setActiveGmailMail(null)}
                            className="p-2 -ml-2 text-brand-blue font-black text-xs uppercase flex items-center gap-1.5 font-sans"
                          >
                            <X className="w-4 h-4" /> Back to List
                          </button>
                        </div>
                        <h3 className="text-xl md:text-2xl font-display font-black text-brand-blue tracking-tight leading-tight uppercase text-left">
                          {activeGmailMail.subject}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 truncate text-left font-sans">
                          From: <span className="font-extrabold text-brand-blue">{activeGmailMail.from}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 text-left font-mono">{activeGmailMail.date}</p>
                      </div>
                      <div className="shrink-0 w-full md:w-auto flex gap-2">
                        <button 
                          onClick={() => handleGmailReplyPortal(activeGmailMail)}
                          className="flex-1 md:flex-none px-5 py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors font-sans"
                        >
                          Reply Inline (Portal)
                        </button>
                        <button 
                          onClick={() => {
                            const toEmail = parseSenderEmail(activeGmailMail.from);
                            const subject = encodeURIComponent(`RE: ${activeGmailMail.subject}`);
                            const body = encodeURIComponent(`\n\n--- Original Gmail ---\n${activeGmailMail.body.substring(0, 500)}`);
                            window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`);
                          }}
                          className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors font-sans"
                          title="Generate mailto fallback link"
                        >
                          External Client
                        </button>
                      </div>
                    </div>
                    
                    <div className="prose prose-slate max-w-none text-slate-650 leading-relaxed bg-slate-50/50 p-6 md:p-8 rounded-[32px] border border-slate-100 text-sm md:text-base whitespace-pre-line font-medium text-left">
                      {activeGmailMail.body || activeGmailMail.snippet}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Mail className="w-10 h-10 animate-pulse text-brand-blue/30" />
                    </div>
                    <p className="font-display font-black text-xl uppercase tracking-tight text-slate-300">Select a Gmail message to read</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersModule() {
  const { toast, promptConfirm } = usePopup();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', role: 'editor' });

  useEffect(() => {
    return onSnapshot(collection(db, 'admins'), (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Users module admins list notice:", err));
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.name) {
      toast.error('Missing Information', 'Please enter both full name and email address for the administrator.');
      return;
    }
    try {
      // Use email directly as ID to match firestore.rules
      await setDoc(doc(db, 'admins', newAdmin.email.trim().toLowerCase()), {
        name: newAdmin.name.trim(),
        email: newAdmin.email.trim().toLowerCase(),
        role: newAdmin.role,
        addedAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewAdmin({ email: '', name: '', role: 'editor' });
      // notify
      await addDoc(collection(db, 'notifications'), {
        title: 'System Access Granted',
        message: `New administrator added: ${newAdmin.name}`,
        type: 'system',
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast.success('Administrator Authorized', `${newAdmin.name} has been added. They can now sign in using ${newAdmin.email}.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'admins');
      toast.error('Action Failed', err?.message || 'Could not add administrator.');
    }
  };

  const removeAdmin = (id: string, name?: string) => {
    promptConfirm({
      title: 'Revoke Administrator Access',
      message: `Are you sure you want to revoke administrative permissions for ${name || id}?`,
      confirmText: 'Revoke Access',
      variant: 'danger',
      icon: 'alert',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'admins', id));
          toast.info('Access Revoked', `Administrative access for ${name || id} has been revoked.`);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.DELETE, 'admins');
          toast.error('Revocation Failed', err?.message || 'Failed to remove administrator.');
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Authority Management</h2>
          <p className="text-xs md:text-sm text-slate-500">Manage administrative access and system privileges.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto px-6 py-4 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 brand-edge-orange shadow-none hover:translate-x-1 hover:-translate-y-1 transition-all"
        >
          <UserPlus className="w-5 h-5" /> Grant Access
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-8 rounded-[40px] border border-brand-orange/20 shadow-xl overflow-hidden"
          >
             <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Full Name</label>
                  <input 
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" placeholder="Ex: John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Email Address</label>
                  <input 
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" placeholder="admin@tewaw.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Access Level</label>
                  <select 
                    value={newAdmin.role}
                    onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <option value="editor">Editor (Orders + Products)</option>
                    <option value="moderator">Moderator (Mail + Orders)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                </div>
             </div>
             <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-slate-400 uppercase text-xs">Cancel</button>
                <button onClick={handleAddAdmin} className="px-8 py-3 bg-brand-orange text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-brand-orange/20">Authorize Admin</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/95 backdrop-blur-sm rounded-[32px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 transition-all duration-300 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Administrator</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Level</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Granted On</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center font-bold text-brand-blue uppercase text-[10px]">
                        {a.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-brand-blue">{a.name}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{a.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {a.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                  {a.addedAt?.toDate ? format(a.addedAt.toDate(), 'dd MMM yyyy') : 'Fixed'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeAdmin(a.id, a.name)}
                    className="text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {/* Hardcoded Super Admin for visibility */}
            {[
              { email: 'feminiholdings@gmail.com', name: 'Femini Holdings (Super Admin)' },
              { email: 'tewawenterprises@gmail.com', name: 'TEWAW Enterprises (Super Admin)' },
            ].map((sa) => (
              <tr key={sa.email} className="bg-blue-50/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center font-bold text-white uppercase text-[10px]">
                      {sa.name.charAt(0)}
                    </div>
                    <span className="font-black text-brand-blue">{sa.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-brand-blue font-bold">{sa.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-brand-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Super User</span>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">System Initialized</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[10px] font-black text-slate-300 uppercase italic">Immutable</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsModule({ user, isSuperAdmin, roleDisplayLabel, onLogout, onOpenProfileModal }: any) {
  const { toast, promptConfirm } = usePopup();
  const [settings, setSettings] = useState<any>({
    headerLogoUrl: '',
    faviconUrl: '',
    footerLogoUrl: '',
    analyticsId: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      const fallbackUrl = 'https://i.pinimg.com/736x/d3/3d/71/d33d71d87f12393171b52129b460c431.jpg';
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          ...data,
          headerLogoUrl: data.headerLogoUrl || fallbackUrl,
          faviconUrl: data.faviconUrl || fallbackUrl,
          footerLogoUrl: data.footerLogoUrl || fallbackUrl,
        });
        const faviconUrlToUse = data.faviconUrl || fallbackUrl;
        const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
        if (favicon) favicon.href = faviconUrlToUse;
      } else {
        setSettings({
          headerLogoUrl: fallbackUrl,
          faviconUrl: fallbackUrl,
          footerLogoUrl: fallbackUrl,
          analyticsId: ''
        });
      }
    };
    fetchSettings();
  }, []);

  const processImageFile = async (file: File, callback: (url: string) => void) => {
    try {
      const res = await compressImage(file, { maxDimension: 600, quality: 0.90, format: 'image/webp' });
      callback(res.dataUrl);
      toast.info('Logo Optimized', `Compressed to WebP: ${formatBytes(res.originalSize)} ➔ ${formatBytes(res.compressedSize)} (${res.reductionPercentage}% saved)`);
    } catch (err) {
      console.error('Logo compression error:', err);
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(id);
    } else if (e.type === "dragleave") {
      setIsDragging(null);
    }
  };

  const handleDrop = (e: React.DragEvent, callback: (url: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, callback);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file, callback);
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      
      // Update favicon immediately in admin too
      if (settings.faviconUrl) {
        const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
        if (favicon) favicon.href = settings.faviconUrl;
      }

      setSaveSuccess(true);
      toast.success('Settings Saved', 'Platform settings and branding assets have been updated.');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
      toast.error('Save Failed', err?.message || 'Could not save platform settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (settings.headerLogoUrl && settings.headerLogoUrl.includes('kommodo.ai') && !settings.headerLogoUrl.includes('direct')) {
      promptConfirm({
        title: 'Image URL Check',
        message: 'The header logo link looks like a web page rather than a direct image URL. It might not display properly. Proceed anyway?',
        confirmText: 'Proceed Anyway',
        variant: 'warning',
        icon: 'alert',
        onConfirm: async () => {
          await performSave();
        }
      });
      return;
    }
    await performSave();
  };

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      <div className="space-y-4">
        <h2 className="text-3xl font-display font-black text-brand-blue uppercase tracking-tight">Global Platform Settings</h2>
        <p className="text-slate-500">Configure your brand assets, logo, and integration secrets.</p>
        
        <AnimatePresence>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-success-bright text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-success-bright/20 border border-success-bright/30"
            >
              <div className="bg-white/20 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Update Successful!</p>
                <p className="text-[10px] font-medium opacity-80">All platform settings have been synchronized.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-10">
        {/* Administrator Profile & Account Banner */}
        <section className="bg-gradient-to-br from-brand-blue via-[#071F57] to-slate-950 p-8 rounded-[40px] text-white shadow-xl shadow-brand-blue/20 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-white/10 border-2 border-brand-orange/40 overflow-hidden shadow-xl shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                  alt="Admin Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-black tracking-tight">{user?.displayName || 'Authorized Administrator'}</h3>
                  <span className="px-2.5 py-0.5 bg-brand-orange/30 border border-brand-orange/40 text-brand-orange rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {roleDisplayLabel || (isSuperAdmin ? 'Super Admin' : 'Admin')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">{user?.email || 'Signed in via Factory Session'}</p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-brand-green font-bold">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  Active Administrator Session
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onOpenProfileModal && (
                <button
                  onClick={onOpenProfileModal}
                  className="px-5 py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Edit Profile & Security</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    promptConfirm({
                      title: 'Sign Out Administrator',
                      message: 'Are you sure you want to end your administrator session and sign out?',
                      confirmText: 'Sign Out',
                      variant: 'danger',
                      icon: 'alert',
                      onConfirm: () => onLogout()
                    });
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/15 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white/95 backdrop-blur-sm p-8 rounded-[40px] border border-slate-200/80 shadow-xl shadow-brand-blue/5 hover:shadow-2xl hover:shadow-brand-blue/15 hover:border-brand-orange/40 transition-all duration-300 space-y-8 brand-edge-orange group">
           <div className="flex items-center gap-4 text-brand-blue border-b border-slate-100 pb-4">
              <Camera className="w-6 h-6" />
              <h3 className="font-display font-black uppercase text-xl">Brand Visuals</h3>
           </div>
           
           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                    Primary Logo
                    {settings.headerLogoUrl && (
                      <button onClick={() => setSettings({...settings, headerLogoUrl: ''})} className="text-brand-orange hover:text-brand-blue">Use Default</button>
                    )}
                 </label>
                 
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex flex-col gap-6">
                        <div 
                          onDragEnter={(e) => handleDrag(e, 'headerLogo')}
                          onDragOver={(e) => handleDrag(e, 'headerLogo')}
                          onDragLeave={(e) => handleDrag(e, 'headerLogo')}
                          onDrop={(e) => handleDrop(e, (url) => setSettings({...settings, headerLogoUrl: url}))}
                          className={cn(
                            "flex items-center justify-center h-32 bg-white rounded-2xl border-2 border-dashed overflow-hidden relative group transition-all duration-300",
                            isDragging === 'headerLogo' ? "border-brand-orange bg-brand-orange/5 scale-[1.02]" : "border-slate-200"
                          )}
                        >
                           {settings.headerLogoUrl ? (
                             <img 
                               referrerPolicy="no-referrer"
                               src={settings.headerLogoUrl} 
                               className={cn("max-h-full max-w-full object-contain p-4 transition-opacity", isDragging === 'headerLogo' ? "opacity-20" : "opacity-100")} 
                               onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/400?text=Invalid+Link`}
                             />
                           ) : (
                             <div className={cn("text-center transition-opacity", isDragging === 'headerLogo' ? "opacity-20" : "opacity-100")}>
                                <BrandLogo size="lg" showText={false} />
                                <p className="text-[10px] font-bold text-slate-400 mt-2">RECREATED LOGO ACTIVE</p>
                             </div>
                           )}
                           {isDragging === 'headerLogo' && (
                             <div className="absolute inset-0 flex items-center justify-center text-brand-orange font-black uppercase text-[10px] tracking-widest pointer-events-none">
                               Drop Image
                             </div>
                           )}
                           <label className="absolute inset-0 bg-brand-blue/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <div className="text-white text-center">
                                 <Upload className="w-6 h-6 mx-auto mb-1" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Upload New</span>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImagePick(e, (url) => setSettings({...settings, headerLogoUrl: url}))}
                              />
                           </label>
                        </div>
                       
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct Link URL</p>
                          <input 
                            type="text" 
                            value={settings.headerLogoUrl}
                            onChange={e => setSettings({...settings, headerLogoUrl: e.target.value})}
                            placeholder="Paste direct .png or .jpg link..." 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono" 
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                    Browser Favicon
                    {settings.faviconUrl && (
                      <button onClick={() => setSettings({...settings, faviconUrl: ''})} className="text-brand-orange hover:text-brand-blue">Clear</button>
                    )}
                 </label>
                 
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex flex-col gap-6">
                       <div className="flex items-center justify-center h-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                          {settings.faviconUrl ? (
                            <img 
                              referrerPolicy="no-referrer"
                              src={settings.faviconUrl} 
                              className="w-12 h-12 object-contain" 
                              onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/64?text=X`}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center text-white font-black">T</div>
                          )}
                          <label className="absolute inset-0 bg-brand-blue/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                             <div className="text-white text-center">
                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                             </div>
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={(e) => handleImagePick(e, (url) => setSettings({...settings, faviconUrl: url}))}
                             />
                          </label>
                       </div>
                       
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct Link URL</p>
                          <input 
                            type="text" 
                            value={settings.faviconUrl}
                            onChange={e => setSettings({...settings, faviconUrl: e.target.value})}
                            placeholder="Paste favicon link..." 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono" 
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>         </section>

         <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 brand-edge-orange">
            <div className="flex items-center gap-4 text-brand-blue border-b border-slate-100 pb-4">
               <Camera className="w-6 h-6" />
               <h3 className="font-display font-black uppercase text-xl">Additional Assets</h3>
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                 Footer Logo (URL) or Pick File
                 {settings.footerLogoUrl && (
                   <button onClick={() => setSettings({...settings, footerLogoUrl: ''})} className="text-brand-orange hover:text-brand-blue">Clear</button>
                 )}
               </label>                <div className="flex items-center gap-4">
                  <label 
                    onDragEnter={(e) => handleDrag(e, 'footerLogo')}
                    onDragOver={(e) => handleDrag(e, 'footerLogo')}
                    onDragLeave={(e) => handleDrag(e, 'footerLogo')}
                    onDrop={(e) => handleDrop(e, (url) => setSettings({...settings, footerLogoUrl: url}))}
                    className={cn(
                      "w-16 h-16 bg-white rounded-xl flex items-center justify-center border shrink-0 overflow-hidden shadow-sm cursor-pointer hover:bg-slate-50 transition-all group",
                      isDragging === 'footerLogo' ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange ring-dashed ring-offset-2" : "border-slate-200"
                    )}
                  >
                     {settings.footerLogoUrl ? (
                       <img 
                         referrerPolicy="no-referrer"
                         src={settings.footerLogoUrl} 
                         className={cn("w-full h-full object-contain transition-opacity", isDragging === 'footerLogo' ? "opacity-20" : "opacity-100")} 
                         onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/400?text=Logo+Error"}
                       />
                     ) : (
                       <Camera className={cn("w-6 h-6 transition-colors", isDragging === 'footerLogo' ? "text-brand-orange" : "text-slate-200 group-hover:text-brand-blue")} />
                     )}
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => handleImagePick(e, (url) => setSettings({...settings, footerLogoUrl: url}))}
                     />
                  </label>
                  <input 
                    type="text" 
                    value={settings.footerLogoUrl}
                    onChange={e => setSettings({...settings, footerLogoUrl: e.target.value})}
                    placeholder={isDragging === 'footerLogo' ? "Drop footer logo here..." : "Paste footer logo link..."} 
                    className={cn("flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all", isDragging === 'footerLogo' ? "opacity-30" : "opacity-100")} 
                  />
               </div>

            </div>
         </section>


        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 brand-edge-blue">
           <div className="flex items-center gap-4 text-brand-blue border-b border-slate-100 pb-4">
              <Lock className="w-6 h-6 text-brand-orange" />
              <h3 className="font-display font-black uppercase text-xl">Integrations & Tracking</h3>
           </div>
           
           <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Google Analytics ID</label>
              <p className="text-xs text-slate-500">
                Measurement ID for tracking live visitor traffic, quote requests, and store conversion metrics.
              </p>
              <input 
                type="text" 
                value={settings.analyticsId || ''}
                onChange={e => setSettings({...settings, analyticsId: e.target.value})}
                placeholder="e.g. G-B8XJV2..." 
                className="w-full max-w-md px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" 
              />
           </div>
        </section>

        <div className="flex justify-end gap-4 mt-6">
           <button 
            disabled={isSaving}
            onClick={handleSave}
            className="px-10 py-4 bg-brand-blue text-white rounded-2xl font-bold brand-edge-orange hover:translate-x-1 hover:-translate-y-1 transition-all uppercase text-sm tracking-widest flex items-center gap-2 group"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            Apply All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
