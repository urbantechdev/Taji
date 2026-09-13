import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ERPBusinessProfile,
  ERPCustomer,
  ERPDocument,
  ERPDocumentType,
  ERPInquiryTicket,
  ERPInventoryItem,
  ERPPaymentTransaction,
  ERPProductionOrder,
  UniformProduct,
  HeroSlide,
  HeroConfig,
  AdminUser,
  AdminUserActivity,
} from '../types';
import { UNIFORM_PRODUCTS } from '../data/uniformsData';
import { INITIAL_HERO_SLIDES, INITIAL_HERO_CONFIG } from '../data/heroData';
import { INITIAL_ADMIN_USERS, isWhitelistedAdminEmail, WHITELISTED_ADMIN_EMAILS, getInitialsAvatar } from '../data/adminUserData';
import {
  INITIAL_BUSINESS_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_DOCUMENTS,
  INITIAL_INQUIRY_TICKETS,
  INITIAL_INVENTORY,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_TRANSACTIONS,
} from '../data/erpInitialData';
import { applyBrowserFavicon } from '../utils/favicon';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
  FirebaseUser,
} from '../lib/firebase';

interface ERPContextType {
  // Admin & Customer Authentication & Profile
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isWhitelistedAdmin: boolean;
  isCustomer: boolean;
  adminUsers: AdminUser[];
  login: (emailOrStaffId: string, password?: string) => Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }>;
  registerWithEmail: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }>;
  logout: () => void;
  updateUserProfile: (updates: Partial<AdminUser>) => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  isFirebaseConnected: boolean;

  // Data
  businessProfile: ERPBusinessProfile;
  customers: ERPCustomer[];
  documents: ERPDocument[];
  transactions: ERPPaymentTransaction[];
  inventory: ERPInventoryItem[];
  productionOrders: ERPProductionOrder[];
  products: UniformProduct[];
  inquiryTickets: ERPInquiryTicket[];

  // Inquiry Tickets / Leads Operations
  raiseInquiryTicket: (ticket: Partial<ERPInquiryTicket> & {
    productName: string;
    quantity: number;
    estimatedTotalKsh: number;
  }) => ERPInquiryTicket;
  updateInquiryTicket: (id: string, updates: Partial<ERPInquiryTicket>) => void;
  deleteInquiryTicket: (id: string) => void;
  convertTicketToInvoice: (ticketId: string) => ERPDocument | null;
  convertTicketToQuotation: (ticketId: string) => ERPDocument | null;

  // Platform Products / Storefront Catalog Operations
  addProduct: (product: Omit<UniformProduct, 'id'> | UniformProduct) => UniformProduct;
  updateProduct: (id: string, updates: Partial<UniformProduct>) => void;
  deleteProduct: (id: string) => void;
  togglePublishProduct: (id: string) => void;
  duplicateProduct: (id: string) => UniformProduct;
  syncAllProductsToInventory: () => void;
  recentlyPostedProductId: string | null;
  setRecentlyPostedProductId: (id: string | null) => void;

  // Document Operations
  createDocument: (doc: Omit<ERPDocument, 'id' | 'createdAt' | 'updatedAt'>) => ERPDocument;
  updateDocument: (id: string, updates: Partial<ERPDocument>) => void;
  deleteDocument: (id: string) => void;
  convertQuotationToInvoice: (quotationId: string) => ERPDocument | null;
  createDeliveryNoteFromInvoice: (invoiceId: string) => ERPDocument | null;
  createReceiptFromInvoice: (invoiceId: string, amount: number, method: ERPPaymentTransaction['method'], mpesaOrBankRef?: string) => ERPDocument | null;

  // Transaction / Payment Operations
  recordPayment: (payment: Omit<ERPPaymentTransaction, 'id' | 'createdAt'>) => ERPPaymentTransaction;
  reconcileMpesaPayment: (mpesaCode: string, invoiceNumber: string, amount: number, senderPhone: string, senderName: string) => boolean;

  // Inventory Operations
  addInventoryItem: (item: Omit<ERPInventoryItem, 'id'>) => ERPInventoryItem;
  updateInventoryItem: (id: string, updates: Partial<ERPInventoryItem>) => void;
  adjustStock: (id: string, delta: number, reason?: string) => void;
  deleteInventoryItem: (id: string) => void;

  // Customer Operations
  addCustomer: (customer: Omit<ERPCustomer, 'id' | 'createdAt'>) => ERPCustomer;
  updateCustomer: (id: string, updates: Partial<ERPCustomer>) => void;
  deleteCustomer: (id: string) => void;

  // Production Orders
  addProductionOrder: (order: Omit<ERPProductionOrder, 'id'>) => ERPProductionOrder;
  updateProductionOrder: (id: string, updates: Partial<ERPProductionOrder>) => void;
  deleteProductionOrder: (id: string) => void;

  // Profile Settings
  updateBusinessProfile: (updates: Partial<ERPBusinessProfile>) => void;
  resetToDefaultData: () => void;

  // Storefront Hero Banner & Slides Operations
  heroSlides: HeroSlide[];
  heroConfig: HeroConfig;
  addHeroSlide: (slide: Omit<HeroSlide, 'id'>) => HeroSlide;
  updateHeroSlide: (id: string, updates: Partial<HeroSlide>) => void;
  deleteHeroSlide: (id: string) => void;
  reorderHeroSlides: (newSlides: HeroSlide[]) => void;
  updateHeroConfig: (updates: Partial<HeroConfig>) => void;
  resetHeroToDefault: () => void;
  syncHeroSlidesFromRepo: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'nasisi_erp_profile_v2',
  CUSTOMERS: 'nasisi_erp_customers_v2',
  DOCUMENTS: 'nasisi_erp_documents_v2',
  TRANSACTIONS: 'nasisi_erp_transactions_v2',
  INVENTORY: 'nasisi_erp_inventory_v3',
  PRODUCTION: 'nasisi_erp_production_v2',
  PRODUCTS: 'nasisi_erp_products_v4',
  TICKETS: 'nasisi_erp_inquiry_tickets_v2',
  HERO_SLIDES: 'nasisi_erp_hero_slides_v2',
  HERO_CONFIG: 'nasisi_erp_hero_config_v2',
  AUTH_USER: 'nasisi_erp_auth_user_v2',
  ADMIN_USERS: 'nasisi_erp_admin_users_v2',
  PASSWORDS: 'nasisi_erp_passwords_v2',
};

// Generate initial products with inventory SKU and publishing defaults
const INITIAL_SYNCHRONIZED_PRODUCTS: UniformProduct[] = UNIFORM_PRODUCTS.map((p, idx) => ({
  ...p,
  published: true,
  sku: p.sku || `SKU-GAR-${p.category.substring(0, 3).toUpperCase()}-${String(idx + 101)}`,
  stockOnHand: p.stockOnHand ?? (idx === 0 ? 145 : idx === 1 ? 220 : 60 + idx * 15),
  stockReserved: p.stockReserved ?? (idx % 2 === 0 ? 30 : 15),
  unitCost: p.unitCost ?? Math.round(p.basePrice * 0.58),
  location: p.location || `Warehouse Rack ${String.fromCharCode(65 + (idx % 6))}-${(idx % 4) + 1}`,
  supplier: p.supplier || 'Nasisi Internal Tailoring Unit',
}));

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessProfile, setBusinessProfile] = useState<ERPBusinessProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
  });

  const [customers, setCustomers] = useState<ERPCustomer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [documents, setDocuments] = useState<ERPDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [transactions, setTransactions] = useState<ERPPaymentTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Synchronized Products state
  const [products, setProducts] = useState<UniformProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, idx: number) => {
            const canonical = UNIFORM_PRODUCTS.find((u) => u.id === p.id);
            const resolvedSku = p.sku || canonical?.sku || `SKU-GAR-${(p.category || 'GEN').substring(0, 3).toUpperCase()}-${String(idx + 101)}`;
            return {
              ...p,
              sku: resolvedSku,
              images:
                Array.isArray(p.images) && p.images.length > 0
                  ? p.images
                  : p.image
                  ? [p.image]
                  : [],
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SYNCHRONIZED_PRODUCTS;
  });

  const [deletedProductIds, setDeletedProductIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nasisi_erp_deleted_products');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [recentlyPostedProductId, setRecentlyPostedProductId] = useState<string | null>(null);

  // Inventory items with synced platform garments + raw materials
  const [inventory, setInventory] = useState<ERPInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    // Build unified initial inventory from INITIAL_INVENTORY + INITIAL_SYNCHRONIZED_PRODUCTS
    const rawAndExisting = [...INITIAL_INVENTORY];
    INITIAL_SYNCHRONIZED_PRODUCTS.forEach((prod) => {
      const existing = rawAndExisting.find(
        (i) => i.id === prod.id || i.sku === prod.sku || i.productId === prod.id
      );
      if (!existing) {
        rawAndExisting.unshift({
          id: `inv-${prod.id}`,
          productId: prod.id,
          sku: prod.sku || `SKU-${prod.id.toUpperCase()}`,
          name: prod.name,
          category: 'finished_garment',
          categoryLabel: prod.categoryLabel || 'Finished Garment',
          size: prod.sizes?.[0] || 'Standard',
          color: prod.availableColors?.[0]?.name || 'Standard',
          unit: 'pieces',
          stockOnHand: prod.stockOnHand || 50,
          stockReserved: prod.stockReserved || 10,
          reorderLevel: 20,
          unitCost: prod.unitCost || Math.round(prod.basePrice * 0.58),
          sellingPrice: prod.basePrice,
          location: prod.location || 'Warehouse Main Bay',
          supplier: prod.supplier || 'Nasisi Internal Tailoring Unit',
          lastRestockedDate: new Date().toISOString().split('T')[0],
          status: 'in_stock',
          published: prod.published !== false,
        });
      }
    });

    return rawAndExisting;
  });

  const [productionOrders, setProductionOrders] = useState<ERPProductionOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTION);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTION_ORDERS;
  });

  const [inquiryTickets, setInquiryTickets] = useState<ERPInquiryTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_INQUIRY_TICKETS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(businessProfile));
  }, [businessProfile]);

  // Instantly apply browser favicon to document head whenever it changes or on boot
  useEffect(() => {
    applyBrowserFavicon(businessProfile.faviconUrl);
  }, [businessProfile.faviconUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  // Track Firebase connection state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Test Firebase connectivity on boot
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });
  }, []);

  // Real-time Firestore Sync for Inventory
  useEffect(() => {
    const inventoryCol = collection(db, 'inventory');
    const unsubscribe = onSnapshot(
      inventoryCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (!snapshot.empty) {
          const remoteItems: ERPInventoryItem[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            remoteItems.push({
              id: d.id,
              sku: data.sku || `SKU-${d.id.substring(0, 8)}`,
              name: data.name || 'Uniform Item',
              category: data.category || 'finished_garment',
              categoryLabel: data.categoryLabel || 'Finished Garment',
              size: data.size || 'Standard',
              color: data.color || 'Standard',
              unit: data.unit || 'pieces',
              stockOnHand: Number(data.stockOnHand) || 0,
              stockReserved: Number(data.stockReserved) || 0,
              reorderLevel: Number(data.reorderLevel) || 20,
              unitCost: Number(data.unitCost) || 0,
              sellingPrice: Number(data.sellingPrice) || 0,
              location: data.location || 'Warehouse Main Bay',
              supplier: data.supplier || 'Nasisi Internal Tailoring Unit',
              lastRestockedDate: data.lastRestockedDate || new Date().toISOString().split('T')[0],
              status: data.status || 'in_stock',
              productId: data.productId,
              published: data.published !== false,
            });
          });

          if (remoteItems.length > 0) {
            setInventory((prev) => {
              // Merge remote items with local items, preferring remote
              const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));
              const merged = [...remoteItems];
              prev.forEach((localItem) => {
                if (!remoteMap.has(localItem.id)) {
                  merged.push(localItem);
                }
              });
              return merged;
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inventory');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync for Products
  useEffect(() => {
    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteProducts: UniformProduct[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            remoteProducts.push({
              id: d.id,
              ...data,
              published: data.published !== false,
            });
          });

          if (remoteProducts.length > 0) {
            setProducts((prev) => {
              const remoteMap = new Map(remoteProducts.map((p) => [p.id, p]));
              const validRemote = remoteProducts.filter((p) => !deletedProductIds.has(p.id));
              const merged = [...validRemote];
              prev.forEach((localProd) => {
                if (!remoteMap.has(localProd.id) && !deletedProductIds.has(localProd.id)) {
                  merged.push(localProd);
                }
              });
              return merged;
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync for Hero Slides
  useEffect(() => {
    const heroCol = collection(db, 'hero_slides');
    const unsubscribe = onSnapshot(
      heroCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteSlides: HeroSlide[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            remoteSlides.push({
              id: d.id,
              ...data,
            });
          });

          if (remoteSlides.length > 0) {
            remoteSlides.sort((a, b) => a.order - b.order);
            setHeroSlides(remoteSlides);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'hero_slides');
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(productionOrders));
  }, [productionOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(inquiryTickets));
  }, [inquiryTickets]);

  // Storefront Hero Banner Slides & Configuration State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    try {
      const syncKey = localStorage.getItem('nasisi_hero_repo_sync_v4');
      // If repo hero assets haven't been synchronized yet, load directly from repository assets
      if (!syncKey) {
        localStorage.setItem('nasisi_hero_repo_sync_v4', 'true');
        localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(INITIAL_HERO_SLIDES));
        return INITIAL_HERO_SLIDES;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.HERO_SLIDES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasValidImages = parsed.every(
            (s: any) => s && typeof s.src === 'string' && s.src.trim().length > 0
          );
          if (hasValidImages) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_HERO_SLIDES;
  });

  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERO_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_HERO_CONFIG,
          ...parsed,
          showOverlayGradients: false,
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_HERO_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(heroSlides));
  }, [heroSlides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERO_CONFIG, JSON.stringify(heroConfig));
  }, [heroConfig]);

  const addHeroSlide = (slideData: Omit<HeroSlide, 'id'>): HeroSlide => {
    const newSlide: HeroSlide = {
      ...slideData,
      id: `hero-slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order: heroSlides.length,
    };
    setHeroSlides((prev) => [...prev, newSlide]);

    // Sync to Firestore
    try {
      setDoc(doc(db, 'hero_slides', newSlide.id), newSlide).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `hero_slides/${newSlide.id}`);
      });
    } catch (e) {
      console.warn('Firestore addHeroSlide error:', e);
    }

    return newSlide;
  };

  const updateHeroSlide = (id: string, updates: Partial<HeroSlide>) => {
    setHeroSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide))
    );

    // Sync to Firestore
    try {
      setDoc(doc(db, 'hero_slides', id), updates, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `hero_slides/${id}`);
      });
    } catch (e) {
      console.warn('Firestore updateHeroSlide error:', e);
    }
  };

  const deleteHeroSlide = (id: string) => {
    setHeroSlides((prev) => prev.filter((slide) => slide.id !== id));

    // Sync to Firestore
    try {
      deleteDoc(doc(db, 'hero_slides', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `hero_slides/${id}`);
      });
    } catch (e) {
      console.warn('Firestore deleteHeroSlide error:', e);
    }
  };

  const reorderHeroSlides = (newSlides: HeroSlide[]) => {
    setHeroSlides(newSlides.map((s, idx) => ({ ...s, order: idx })));
  };

  const updateHeroConfig = (updates: Partial<HeroConfig>) => {
    setHeroConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetHeroToDefault = () => {
    setHeroSlides(INITIAL_HERO_SLIDES);
    setHeroConfig(INITIAL_HERO_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.HERO_SLIDES);
    localStorage.removeItem(STORAGE_KEYS.HERO_CONFIG);
  };

  const syncHeroSlidesFromRepo = () => {
    setHeroSlides(INITIAL_HERO_SLIDES);
    setHeroConfig(INITIAL_HERO_CONFIG);
    localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(INITIAL_HERO_SLIDES));
    localStorage.setItem(STORAGE_KEYS.HERO_CONFIG, JSON.stringify(INITIAL_HERO_CONFIG));
    localStorage.setItem('nasisi_hero_repo_sync_v4', 'true');
  };

  // =========================================================================
  // ADMIN AUTHENTICATION & USER PROFILE OPERATIONS
  // =========================================================================

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
      if (saved) {
        const parsed: AdminUser[] = JSON.parse(saved);
        const demoIds = ['user-urban-interior', 'user-veronica', 'user-nasisi-knitwear', 'user-optimum'];
        const nonDemo = parsed
          .filter((u) => !demoIds.includes(u.id) && !u.id.startsWith('demo-') && !u.id.startsWith('user-whitelisted-'))
          .map((u) => ({
            ...u,
            avatar: u.avatar && !u.avatar.includes('unsplash') ? u.avatar : getInitialsAvatar(u.name, '#06163c'),
          }));
        if (nonDemo.length > 0) return nonDemo;
      }
    } catch {
      // fallback
    }
    return INITIAL_ADMIN_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) {
        const parsed: AdminUser = JSON.parse(saved);
        const demoIds = ['user-urban-interior', 'user-veronica', 'user-nasisi-knitwear', 'user-optimum'];
        if (parsed && (demoIds.includes(parsed.id) || parsed.id?.startsWith('demo-') || parsed.id?.startsWith('user-whitelisted-'))) {
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          return null;
        }
        if (parsed && parsed.avatar && parsed.avatar.includes('unsplash')) {
          parsed.avatar = getInitialsAvatar(parsed.name || 'User', isWhitelistedAdminEmail(parsed.email) ? '#06163c' : '#0284c7');
        }
        if (parsed && parsed.email) {
          if (isWhitelistedAdminEmail(parsed.email)) {
            parsed.role = 'Super Admin';
          } else {
            parsed.role = 'Customer';
          }
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const isAuthenticated = Boolean(currentUser);
  const isWhitelistedAdmin = Boolean(
    currentUser &&
    currentUser.role !== 'Customer' &&
    (
      isWhitelistedAdminEmail(currentUser.email) ||
      isWhitelistedAdminEmail(currentUser.staffId) ||
      adminUsers.some(
        (u) =>
          u.email.toLowerCase() === currentUser.email?.toLowerCase() &&
          u.role !== 'Customer' &&
          u.status === 'active'
      )
    )
  );
  const isCustomer = Boolean(currentUser && currentUser.role === 'Customer');

  // Sync admin users to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminUsers));
    } catch {
      // fallback
    }
  }, [adminUsers]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').trim();
        const isWhitelisted =
          isWhitelistedAdminEmail(email) ||
          adminUsers.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.role !== 'Customer');
        const displayName = firebaseUser.displayName || email.split('@')[0] || 'User';

        if (isWhitelisted) {
          // Authorized Whitelisted Admin Profile
          const existing = adminUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );
          const signedInAdmin: AdminUser = existing
            ? {
                ...existing,
                status: 'active',
                lastLogin: 'Just now (Google Verified Admin)',
                avatar: firebaseUser.photoURL || existing.avatar || getInitialsAvatar(existing.name, '#06163c'),
              }
            : {
                id: `user-${firebaseUser.uid}`,
                name: displayName,
                email: email,
                role: 'Super Admin',
                staffId: `NAS-DIR-${firebaseUser.uid.substring(0, 4).toUpperCase()}`,
                phone: '+254 722 419 820',
                department: 'Executive Management & Factory Oversight',
                avatar: firebaseUser.photoURL || getInitialsAvatar(displayName, '#06163c'),
                bio: 'Authorized enterprise administrator via Google Identity.',
                location: 'Nairobi HQ, Kenya',
                status: 'active',
                lastLogin: 'Just now (Google Verified Admin)',
                joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                twoFactorEnabled: true,
              };

          setCurrentUser(signedInAdmin);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(signedInAdmin));
          setAdminUsers((prev) => {
            const found = prev.some((u) => u.id === signedInAdmin.id || u.email.toLowerCase() === signedInAdmin.email.toLowerCase());
            return found
              ? prev.map((u) => (u.id === signedInAdmin.id || u.email.toLowerCase() === signedInAdmin.email.toLowerCase() ? signedInAdmin : u))
              : [signedInAdmin, ...prev];
          });
        } else {
          // Regular customer account: access restricted to storefront checkout
          const customerUser: AdminUser = {
            id: `cust-${firebaseUser.uid}`,
            name: displayName,
            email: email,
            role: 'Customer',
            staffId: `CUST-${firebaseUser.uid.substring(0, 6).toUpperCase()}`,
            phone: firebaseUser.phoneNumber || '+254 700 000 000',
            department: 'Storefront Client Accounts',
            avatar: firebaseUser.photoURL || getInitialsAvatar(displayName, '#0284c7'),
            bio: 'Verified customer account for customized uniform quotes and express checkout.',
            location: 'Kenya',
            status: 'active',
            lastLogin: 'Just now (Google Customer)',
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            twoFactorEnabled: false,
          };

          setCurrentUser(customerUser);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(customerUser));
        }
      }
    });

    return () => unsubscribe();
  }, [adminUsers]);

  const loginWithGoogle = async (): Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = (user.email || '').trim();
      const isWhitelisted =
        isWhitelistedAdminEmail(email) ||
        adminUsers.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.role !== 'Customer');
      const displayName = user.displayName || email.split('@')[0] || 'Google User';

      if (isWhitelisted) {
        const existing = adminUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        const newActivity: AdminUserActivity = {
          id: `act-${Date.now()}`,
          action: 'Signed in via Google OAuth Single Sign-On',
          timestamp: 'Just now',
          category: 'auth',
        };

        const updatedUser: AdminUser = existing
          ? {
              ...existing,
              status: 'active',
              avatar: user.photoURL || existing.avatar || getInitialsAvatar(existing.name, '#06163c'),
              lastLogin: 'Just now (Google Verified Admin)',
              recentActivities: [newActivity, ...(existing.recentActivities || []).slice(0, 9)],
            }
          : {
              id: `user-${user.uid}`,
              name: displayName,
              email: email,
              role: 'Super Admin',
              staffId: `NAS-DIR-${user.uid.substring(0, 4).toUpperCase()}`,
              phone: user.phoneNumber || '+254 722 419 820',
              department: 'Executive Management & Factory Oversight',
              avatar: user.photoURL || getInitialsAvatar(displayName, '#06163c'),
              bio: 'Authenticated administrator via Google Identity SSO.',
              location: 'Nairobi HQ',
              status: 'active',
              lastLogin: 'Just now (Google Verified Admin)',
              joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              twoFactorEnabled: true,
              recentActivities: [newActivity],
            };

        setCurrentUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
        setAdminUsers((prev) => {
          const found = prev.some((u) => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase());
          return found
            ? prev.map((u) => (u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u))
            : [updatedUser, ...prev];
        });

        return { success: true, role: 'admin' };
      } else {
        // Customer account login: Access granted strictly for customer/checkout features
        const customerUser: AdminUser = {
          id: `cust-${user.uid}`,
          name: displayName,
          email: email,
          role: 'Customer',
          staffId: `CUST-${user.uid.substring(0, 6).toUpperCase()}`,
          phone: user.phoneNumber || '+254 700 000 000',
          department: 'Storefront Client Accounts',
          avatar: user.photoURL || getInitialsAvatar(displayName, '#0284c7'),
          bio: 'Verified customer account for quotation requests and checkout.',
          location: 'Kenya',
          status: 'active',
          lastLogin: 'Just now (Google Customer)',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          twoFactorEnabled: false,
        };

        setCurrentUser(customerUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(customerUser));
        return { success: true, role: 'customer' };
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      let errorMsg = err?.message || 'Google authentication encountered an issue. Please ensure popup is enabled.';
      if (err?.code === 'auth/unauthorized-domain') {
        errorMsg = 'Domain not authorized in Firebase Console. Add your preview domain in Firebase Console > Authentication > Settings > Authorized domains.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg = 'Google Sign-in is not yet enabled in Firebase Console. Enable "Google" under Firebase Console > Authentication > Sign-in method.';
      } else if (err?.code === 'auth/popup-blocked') {
        errorMsg = 'Sign-in popup was blocked by your browser. Please allow popups for this site or open in a new tab.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Google sign-in window was closed before completing.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errorMsg = 'Only one sign-in pop-up window can be open at a time.';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMsg = 'Network connection error. Please check your internet connection.';
      }
      return {
        success: false,
        role: 'customer',
        error: errorMsg,
      };
    }
  };

  const login = async (
    emailOrStaffId: string,
    password?: string
  ): Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }> => {
    const trimmed = emailOrStaffId.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!trimmed) {
      return { success: false, role: 'customer', error: 'Please enter your email address.' };
    }

    if (!cleanPassword) {
      return { success: false, role: 'customer', error: 'Please enter your account password.' };
    }

    // Try real Firebase Authentication with Email & Password
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmed, cleanPassword);
      const fbUser = userCredential.user;
      const email = (fbUser.email || trimmed).toLowerCase();
      const isWhitelisted = isWhitelistedAdminEmail(email);
      const displayName = fbUser.displayName || email.split('@')[0];

      if (isWhitelisted) {
        const existing = adminUsers.find((u) => u.email.toLowerCase() === email);
        const adminUser: AdminUser = existing
          ? {
              ...existing,
              status: 'active',
              lastLogin: 'Just now (Firebase Email Auth)',
              avatar: fbUser.photoURL || existing.avatar || getInitialsAvatar(existing.name, '#06163c'),
            }
          : {
              id: `user-${fbUser.uid}`,
              name: displayName,
              email: email,
              role: 'Super Admin',
              staffId: `NAS-DIR-${fbUser.uid.substring(0, 4).toUpperCase()}`,
              phone: '+254 722 419 820',
              department: 'Executive Management',
              avatar: fbUser.photoURL || getInitialsAvatar(displayName, '#06163c'),
              bio: 'Authorized Enterprise Administrator.',
              location: 'Nairobi HQ',
              status: 'active',
              lastLogin: 'Just now',
              joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              twoFactorEnabled: true,
            };

        setCurrentUser(adminUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(adminUser));
        return { success: true, role: 'admin' };
      } else {
        // Customer account
        const custUser: AdminUser = {
          id: `cust-${fbUser.uid}`,
          name: displayName,
          email: email,
          role: 'Customer',
          staffId: `CUST-${fbUser.uid.substring(0, 6).toUpperCase()}`,
          phone: fbUser.phoneNumber || '+254 700 000 000',
          department: 'Storefront Client Accounts',
          avatar: fbUser.photoURL || getInitialsAvatar(displayName, '#0284c7'),
          bio: 'Customer account for quotation requests and express checkout.',
          location: 'Kenya',
          status: 'active',
          lastLogin: 'Just now (Customer Auth)',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          twoFactorEnabled: false,
        };

        setCurrentUser(custUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(custUser));
        return { success: true, role: 'customer' };
      }
    } catch (err: any) {
      console.warn('Firebase signInWithEmailAndPassword error:', err?.code, err?.message);

      // Enterprise Admin Whitelist Fallback:
      // If the email belongs to the authorized enterprise administrator whitelist,
      // grant authorized enterprise access even if Firebase password isn't provisioned.
      if (isWhitelistedAdminEmail(trimmed)) {
        console.log('Authorized whitelisted admin recognized:', trimmed);
        const existing = adminUsers.find((u) => u.email.toLowerCase() === trimmed);

        const adminUser: AdminUser = existing
          ? {
              ...existing,
              lastLogin: 'Just now (Enterprise Whitelisted Session)',
            }
          : {
              id: `user-whitelisted-${Date.now()}`,
              name: trimmed.split('@')[0],
              email: trimmed,
              role: 'Super Admin',
              staffId: 'NAS-ADM-AUTH',
              phone: '+254 722 419 820',
              department: 'Executive Administration & Operations',
              avatar: getInitialsAvatar(trimmed.split('@')[0], '#06163c'),
              status: 'active',
              lastLogin: 'Just now (Enterprise Whitelisted Session)',
              joinedDate: 'January 2021',
              twoFactorEnabled: true,
            };

        setCurrentUser(adminUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(adminUser));
        return { success: true, role: 'admin' };
      }

      let errorMsg = 'Invalid email or password.';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password. If you do not have an account yet, create a new account or sign in with Google.';
      } else if (err?.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please verify your credentials.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please reset your password or try again shortly.';
      }
      return { success: false, role: 'customer', error: errorMsg };
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; role: 'admin' | 'customer'; error?: string }> => {
    const trimmed = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!trimmed || !cleanPassword) {
      return { success: false, role: 'customer', error: 'Please provide both email and a secure password.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, role: 'customer', error: 'Password must be at least 6 characters.' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmed, cleanPassword);
      const fbUser = userCredential.user;
      const isWhitelisted = isWhitelistedAdminEmail(trimmed);
      const displayName = fullName?.trim() || trimmed.split('@')[0];

      if (isWhitelisted) {
        const adminUser: AdminUser = {
          id: `user-${fbUser.uid}`,
          name: displayName,
          email: trimmed,
          role: 'Super Admin',
          staffId: `NAS-DIR-${fbUser.uid.substring(0, 4).toUpperCase()}`,
          phone: '+254 722 419 820',
          department: 'Executive Management',
          avatar: getInitialsAvatar(displayName, '#06163c'),
          bio: 'Authorized Enterprise Administrator.',
          location: 'Nairobi HQ',
          status: 'active',
          lastLogin: 'Just now (Firebase Account Created)',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          twoFactorEnabled: true,
        };
        setCurrentUser(adminUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(adminUser));
        return { success: true, role: 'admin' };
      } else {
        const custUser: AdminUser = {
          id: `cust-${fbUser.uid}`,
          name: displayName,
          email: trimmed,
          role: 'Customer',
          staffId: `CUST-${fbUser.uid.substring(0, 6).toUpperCase()}`,
          phone: '+254 700 000 000',
          department: 'Storefront Client Accounts',
          avatar: getInitialsAvatar(displayName, '#0284c7'),
          bio: 'Verified customer account for quotation requests and checkout.',
          location: 'Kenya',
          status: 'active',
          lastLogin: 'Just now (New Customer Account)',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          twoFactorEnabled: false,
        };
        setCurrentUser(custUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(custUser));
        return { success: true, role: 'customer' };
      }
    } catch (err: any) {
      console.warn('Firebase createUser error:', err?.code, err?.message);
      let errorMsg = 'Failed to create account. Please try again.';
      if (err?.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists. Please sign in instead.';
      } else if (err?.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      }
      return { success: false, role: 'customer', error: errorMsg };
    }
  };

  const logout = () => {
    try {
      firebaseSignOut(auth).catch(() => {});
    } catch {
      // ignore
    }
    if (currentUser) {
      const loggedOutUser: AdminUser = {
        ...currentUser,
        status: 'offline',
        lastLogin: `Last seen at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (EAT)`,
      };
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === loggedOutUser.id ? loggedOutUser : u))
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  const updateUserProfile = (updates: Partial<AdminUser>) => {
    if (!currentUser) return;
    const newActivity: AdminUserActivity = {
      id: `act-${Date.now()}`,
      action: 'Updated administrator user profile & contact details',
      timestamp: 'Just now',
      category: 'security',
    };
    const updated: AdminUser = {
      ...currentUser,
      ...updates,
      recentActivities: [newActivity, ...(currentUser.recentActivities || []).slice(0, 9)],
    };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    let storedPasswords: Record<string, string> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (saved) storedPasswords = JSON.parse(saved);
    } catch {
      // fallback
    }
    const currentPass = storedPasswords[currentUser.id];
    if (currentPass && oldPass !== currentPass) {
      return { success: false, error: 'Current password does not match.' };
    }
    storedPasswords[currentUser.id] = newPass;
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(storedPasswords));

    const newActivity: AdminUserActivity = {
      id: `act-${Date.now()}`,
      action: 'Changed portal security access password',
      timestamp: 'Just now',
      category: 'security',
    };
    updateUserProfile({
      recentActivities: [newActivity, ...(currentUser.recentActivities || []).slice(0, 9)],
    });

    return { success: true };
  };

  // =========================================================================
  // PLATFORM PRODUCT OPERATIONS (Live Storefront <-> Admin Inventory Sync)
  // =========================================================================

  const addProduct = (
    productData: Omit<UniformProduct, 'id'> | UniformProduct
  ): UniformProduct => {
    const id = 'id' in productData && productData.id ? productData.id : `prod-${Date.now()}`;
    const sku =
      productData.sku ||
      `SKU-GAR-${productData.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProduct: UniformProduct = {
      ...productData,
      id,
      sku,
      published: productData.published !== false,
      stockOnHand: productData.stockOnHand ?? 50,
      stockReserved: productData.stockReserved ?? 0,
      unitCost: productData.unitCost ?? Math.round(productData.basePrice * 0.58),
      location: productData.location || 'Warehouse Bay A',
      supplier: productData.supplier || 'Nasisi Internal Tailoring Unit',
    };

    // 1. Add to Products list
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== id)]);
    setRecentlyPostedProductId(id);

    // Remove from deleted set if it was previously there
    setDeletedProductIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        try {
          localStorage.setItem('nasisi_erp_deleted_products', JSON.stringify([...next]));
        } catch {
          // fallback
        }
        return next;
      }
      return prev;
    });

    // Also persist immediately to localStorage
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify([newProduct, ...list.filter((p: any) => p.id !== id)])
      );
    } catch {
      // fallback
    }

    // 2. Synchronize to Inventory as a Finished Garment SKU
    setInventory((prev) => {
      const filtered = prev.filter((i) => i.productId !== id && i.id !== `inv-${id}` && i.sku !== sku);
      const newInvItem: ERPInventoryItem = {
        id: `inv-${id}`,
        productId: id,
        sku,
        name: newProduct.name,
        category: 'finished_garment',
        categoryLabel: newProduct.categoryLabel || 'Finished Garment',
        size: newProduct.sizes?.[0] || 'Standard',
        color: newProduct.availableColors?.[0]?.name || 'Standard',
        unit: 'pieces',
        stockOnHand: newProduct.stockOnHand ?? 50,
        stockReserved: newProduct.stockReserved ?? 0,
        reorderLevel: 20,
        unitCost: newProduct.unitCost ?? Math.round(newProduct.basePrice * 0.58),
        sellingPrice: newProduct.basePrice,
        location: newProduct.location || 'Warehouse Main Bay',
        supplier: newProduct.supplier || 'Nasisi Internal Tailoring Unit',
        lastRestockedDate: new Date().toISOString().split('T')[0],
        status:
          (newProduct.stockOnHand ?? 50) <= 0
            ? 'out_of_stock'
            : (newProduct.stockOnHand ?? 50) <= 20
            ? 'low_stock'
            : 'in_stock',
        published: newProduct.published !== false,
      };
      return [newInvItem, ...filtered];
    });

    // 3. Asynchronously sync to Firestore
    try {
      setDoc(doc(db, 'products', id), {
        ...newProduct,
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `products/${id}`);
      });
    } catch (e) {
      console.warn('Firestore addProduct sync error:', e);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<UniformProduct>) => {
    let finalProduct: UniformProduct | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          finalProduct = updated;
          return updated;
        }
        return p;
      })
    );

    // Synchronize to Inventory
    setInventory((prev) =>
      prev.map((item) => {
        if (
          item.productId === id ||
          item.id === `inv-${id}` ||
          (item.sku && updates.sku && item.sku === updates.sku)
        ) {
          const newStock = updates.stockOnHand !== undefined ? updates.stockOnHand : item.stockOnHand;
          const reorder = item.reorderLevel;
          const status = newStock <= 0 ? 'out_of_stock' : newStock <= reorder ? 'low_stock' : 'in_stock';

          return {
            ...item,
            name: updates.name ?? item.name,
            sku: updates.sku ?? item.sku,
            categoryLabel: updates.categoryLabel ?? item.categoryLabel,
            sellingPrice: updates.basePrice ?? item.sellingPrice,
            unitCost: updates.unitCost ?? item.unitCost,
            stockOnHand: newStock,
            stockReserved: updates.stockReserved !== undefined ? updates.stockReserved : item.stockReserved,
            location: updates.location ?? item.location,
            supplier: updates.supplier ?? item.supplier,
            published: updates.published !== undefined ? updates.published : item.published,
            status,
          };
        }
        return item;
      })
    );

    // Asynchronously sync to Firestore
    try {
      setDoc(
        doc(db, 'products', id),
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      });
    } catch (e) {
      console.warn('Firestore updateProduct sync error:', e);
    }
  };

  const deleteProduct = (id: string) => {
    setDeletedProductIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('nasisi_erp_deleted_products', JSON.stringify([...next]));
      } catch {
        // fallback
      }
      return next;
    });

    setProducts((prev) => prev.filter((p) => p.id !== id));
    // Also remove corresponding item from inventory
    setInventory((prev) => prev.filter((item) => item.productId !== id && item.id !== `inv-${id}`));

    try {
      const existing = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (existing) {
        const list = JSON.parse(existing);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list.filter((p: any) => p.id !== id)));
      }
    } catch {
      // fallback
    }

    // Asynchronously delete from Firestore
    try {
      deleteDoc(doc(db, 'products', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      });
    } catch (e) {
      console.warn('Firestore deleteProduct sync error:', e);
    }
  };

  const togglePublishProduct = (id: string) => {
    let nextPublishedState = true;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextPublishedState = p.published === false ? true : false;
          return { ...p, published: nextPublishedState };
        }
        return p;
      })
    );

    setInventory((prev) =>
      prev.map((item) => {
        if (item.productId === id || item.id === `inv-${id}`) {
          return { ...item, published: nextPublishedState };
        }
        return item;
      })
    );

    // Asynchronously sync to Firestore
    try {
      setDoc(
        doc(db, 'products', id),
        {
          published: nextPublishedState,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      });
    } catch (e) {
      console.warn('Firestore togglePublishProduct sync error:', e);
    }
  };

  const duplicateProduct = (id: string): UniformProduct => {
    const original = products.find((p) => p.id === id);
    if (!original) throw new Error('Product not found');

    const newId = `prod-copy-${Date.now()}`;
    const newSku = `SKU-GAR-${original.category.substring(0, 3).toUpperCase()}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const cloned: UniformProduct = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      sku: newSku,
      published: false, // Start copies as draft
      stockOnHand: original.stockOnHand || 40,
    };

    return addProduct(cloned);
  };

  const syncAllProductsToInventory = () => {
    setInventory((prev) => {
      const updated = [...prev];
      products.forEach((prod) => {
        const existingIdx = updated.findIndex(
          (i) => i.productId === prod.id || i.id === `inv-${prod.id}` || i.sku === prod.sku
        );
        const itemPayload: ERPInventoryItem = {
          id: existingIdx >= 0 ? updated[existingIdx].id : `inv-${prod.id}`,
          productId: prod.id,
          sku: prod.sku || `SKU-${prod.id.toUpperCase()}`,
          name: prod.name,
          category: 'finished_garment',
          categoryLabel: prod.categoryLabel || 'Finished Garment',
          size: prod.sizes?.[0] || 'Standard',
          color: prod.availableColors?.[0]?.name || 'Standard',
          unit: 'pieces',
          stockOnHand: prod.stockOnHand ?? 50,
          stockReserved: prod.stockReserved ?? 0,
          reorderLevel: 20,
          unitCost: prod.unitCost ?? Math.round(prod.basePrice * 0.58),
          sellingPrice: prod.basePrice,
          location: prod.location || 'Warehouse Main Bay',
          supplier: prod.supplier || 'Nasisi Internal Tailoring Unit',
          lastRestockedDate: new Date().toISOString().split('T')[0],
          status:
            (prod.stockOnHand ?? 50) <= 0
              ? 'out_of_stock'
              : (prod.stockOnHand ?? 50) <= 20
              ? 'low_stock'
              : 'in_stock',
          published: prod.published !== false,
        };

        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], ...itemPayload };
        } else {
          updated.unshift(itemPayload);
        }
      });
      return updated;
    });
  };

  // Document Operations
  const createDocument = (
    docData: Omit<ERPDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): ERPDocument => {
    const newDoc: ERPDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);

    // Update customer spend/balance if it's an invoice
    if (newDoc.type === 'invoice' && newDoc.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newDoc.customerId
            ? {
                ...c,
                totalOrdersCount: c.totalOrdersCount + 1,
                totalSpendKsh: c.totalSpendKsh + newDoc.totalAmount,
                outstandingBalanceKsh: c.outstandingBalanceKsh + newDoc.balanceDue,
              }
            : c
        )
      );
    }

    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<ERPDocument>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const convertQuotationToInvoice = (quotationId: string): ERPDocument | null => {
    const quote = documents.find((d) => d.id === quotationId);
    if (!quote) return null;

    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: ERPDocument = {
      ...quote,
      id: `doc-${Date.now()}`,
      docNumber: invoiceNumber,
      type: 'invoice',
      title: quote.title.replace('Quotation', 'Tax Invoice').replace('Quote', 'Tax Invoice'),
      status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 0,
      balanceDue: quote.totalAmount,
      relatedDocNumber: quote.docNumber,
      notes: `Converted from Quotation ${quote.docNumber}. 16% VAT applicable.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [
      newInvoice,
      ...prev.map((d) => (d.id === quotationId ? { ...d, status: 'issued' as const } : d)),
    ]);

    // Update customer stats
    if (newInvoice.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newInvoice.customerId
            ? {
                ...c,
                totalOrdersCount: c.totalOrdersCount + 1,
                totalSpendKsh: c.totalSpendKsh + newInvoice.totalAmount,
                outstandingBalanceKsh: c.outstandingBalanceKsh + newInvoice.balanceDue,
              }
            : c
        )
      );
    }

    return newInvoice;
  };

  const createDeliveryNoteFromInvoice = (invoiceId: string): ERPDocument | null => {
    const invoice = documents.find((d) => d.id === invoiceId);
    if (!invoice) return null;

    const dlnNumber = `DLN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDLN: ERPDocument = {
      ...invoice,
      id: `doc-${Date.now()}`,
      docNumber: dlnNumber,
      type: 'delivery_note',
      title: `Dispatch Note for ${invoice.customerName}`,
      status: 'dispatched',
      issueDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vehicleRegistration: 'KBZ 849X (Nasisi Logistics Van)',
      driverName: 'Peter Ochieng (Senior Driver)',
      driverPhone: '+254 728 901 234',
      dispatchedBy: 'Samson Kimani (Dispatch Supervisor)',
      deliveryStatus: 'in_transit',
      relatedDocNumber: invoice.docNumber,
      notes: `Official delivery acknowledgment for Invoice ${invoice.docNumber}. Goods inspected and packed.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDLN, ...prev]);
    return newDLN;
  };

  const createReceiptFromInvoice = (
    invoiceId: string,
    amount: number,
    method: ERPPaymentTransaction['method'],
    mpesaOrBankRef?: string
  ): ERPDocument | null => {
    const invoice = documents.find((d) => d.id === invoiceId);
    if (!invoice) return null;

    const rctNumber = `RCT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReceipt: ERPDocument = {
      ...invoice,
      id: `doc-${Date.now()}`,
      docNumber: rctNumber,
      type: 'receipt',
      title: `Official Receipt - ${method.toUpperCase()} Payment`,
      status: 'paid',
      issueDate: new Date().toISOString().split('T')[0],
      items: [
        {
          id: `li-rct-${Date.now()}`,
          description: `Payment received towards Invoice ${invoice.docNumber} (${invoice.title})`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          taxRate: 0,
        },
      ],
      subtotal: amount,
      vatRate: 0,
      vatAmount: 0,
      totalAmount: amount,
      amountPaid: amount,
      balanceDue: 0,
      relatedDocNumber: invoice.docNumber,
      mpesaRef: method === 'mpesa' ? mpesaOrBankRef : undefined,
      bankRef: method === 'bank_transfer' ? mpesaOrBankRef : undefined,
      paymentTerms: `Settled via ${method.toUpperCase()} (${mpesaOrBankRef || 'Cash voucher'})`,
      notes: `Received with thanks. Remaining balance on ${invoice.docNumber}: Ksh ${(
        Math.max(0, invoice.balanceDue - amount)
      ).toLocaleString()}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newReceipt, ...prev]);

    // Record the matching transaction
    recordPayment({
      transactionNumber: `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      amount,
      method,
      status: 'completed',
      documentId: invoice.id,
      documentNumber: invoice.docNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      mpesaCode: method === 'mpesa' ? mpesaOrBankRef : undefined,
      mpesaType: 'paybill',
      bankName: method === 'bank_transfer' ? 'Equity Bank Kenya' : undefined,
      bankTransactionRef: method === 'bank_transfer' ? mpesaOrBankRef : undefined,
      receiptId: newReceipt.id,
      notes: `Payment for Invoice ${invoice.docNumber}`,
    });

    return newReceipt;
  };

  // Record Payment
  const recordPayment = (
    paymentData: Omit<ERPPaymentTransaction, 'id' | 'createdAt'>
  ): ERPPaymentTransaction => {
    const newTxn: ERPPaymentTransaction = {
      ...paymentData,
      id: `txn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTxn, ...prev]);

    // Deduct balance from the linked document if provided
    if (newTxn.documentId || newTxn.documentNumber) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === newTxn.documentId || doc.docNumber === newTxn.documentNumber) {
            const newAmountPaid = doc.amountPaid + newTxn.amount;
            const newBalanceDue = Math.max(0, doc.totalAmount - newAmountPaid);
            const newStatus =
              newBalanceDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : doc.status;

            return {
              ...doc,
              amountPaid: newAmountPaid,
              balanceDue: newBalanceDue,
              status: newStatus,
              mpesaRef: newTxn.mpesaCode || doc.mpesaRef,
              bankRef: newTxn.bankTransactionRef || doc.bankRef,
              updatedAt: new Date().toISOString(),
            };
          }
          return doc;
        })
      );
    }

    // Update customer outstanding balance
    if (newTxn.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newTxn.customerId
            ? {
                ...c,
                outstandingBalanceKsh: Math.max(0, c.outstandingBalanceKsh - newTxn.amount),
              }
            : c
        )
      );
    }

    return newTxn;
  };

  const reconcileMpesaPayment = (
    mpesaCode: string,
    invoiceNumber: string,
    amount: number,
    senderPhone: string,
    senderName: string
  ): boolean => {
    const invoice = documents.find(
      (d) => d.docNumber.toLowerCase() === invoiceNumber.trim().toLowerCase()
    );

    recordPayment({
      transactionNumber: `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      amount,
      method: 'mpesa',
      status: 'completed',
      documentId: invoice?.id,
      documentNumber: invoice?.docNumber || invoiceNumber,
      customerId: invoice?.customerId,
      customerName: invoice?.customerName || senderName,
      mpesaCode: mpesaCode.toUpperCase().trim(),
      senderPhone,
      senderName: senderName.toUpperCase().trim(),
      mpesaType: 'paybill',
      notes: `Automated M-Pesa STK / Paybill reconciliation for ${invoiceNumber}`,
    });

    return true;
  };

  // Inventory Operations with Firestore Synchronization
  const addInventoryItem = (itemData: Omit<ERPInventoryItem, 'id'>): ERPInventoryItem => {
    const newItem: ERPInventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);

    // Push to Firestore asynchronously
    const docRef = doc(db, 'inventory', newItem.id);
    setDoc(
      docRef,
      {
        ...newItem,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `inventory/${newItem.id}`);
    });

    return newItem;
  };

  const updateInventoryItem = (id: string, updates: Partial<ERPInventoryItem>) => {
    let finalUpdatedItem: ERPInventoryItem | null = null;
    setInventory((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, ...updates };
          // auto update status
          if (updated.stockOnHand <= 0) {
            updated.status = 'out_of_stock';
          } else if (updated.stockOnHand <= updated.reorderLevel) {
            updated.status = 'low_stock';
          } else {
            updated.status = 'in_stock';
          }

          // If linked to product, sync selling price
          if (it.productId && updates.sellingPrice) {
            setProducts((prodList) =>
              prodList.map((p) =>
                p.id === it.productId ? { ...p, basePrice: updates.sellingPrice! } : p
              )
            );
          }

          finalUpdatedItem = updated;
          return updated;
        }
        return it;
      })
    );

    // Sync to Firestore
    if (finalUpdatedItem) {
      const docRef = doc(db, 'inventory', id);
      setDoc(
        docRef,
        {
          ...finalUpdatedItem,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`);
      });
    }
  };

  const adjustStock = (id: string, delta: number) => {
    let adjustedItem: ERPInventoryItem | null = null;
    setInventory((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newStock = Math.max(0, it.stockOnHand + delta);
          const newStatus =
            newStock <= 0 ? 'out_of_stock' : newStock <= it.reorderLevel ? 'low_stock' : 'in_stock';

          // If linked to a product, sync product stockOnHand
          if (it.productId) {
            setProducts((prodList) =>
              prodList.map((p) => (p.id === it.productId ? { ...p, stockOnHand: newStock } : p))
            );
          }

          const updated: ERPInventoryItem = {
            ...it,
            stockOnHand: newStock,
            status: newStatus,
            lastRestockedDate:
              delta > 0 ? new Date().toISOString().split('T')[0] : it.lastRestockedDate,
          };
          adjustedItem = updated;
          return updated;
        }
        return it;
      })
    );

    // Sync adjusted stock to Firestore
    if (adjustedItem) {
      const docRef = doc(db, 'inventory', id);
      setDoc(
        docRef,
        {
          ...adjustedItem,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`);
      });
    }
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((it) => it.id !== id));

    // Delete document in Firestore
    const docRef = doc(db, 'inventory', id);
    deleteDoc(docRef).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    });
  };

  // Customer Operations
  const addCustomer = (customerData: Omit<ERPCustomer, 'id' | 'createdAt'>): ERPCustomer => {
    const newCust: ERPCustomer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<ERPCustomer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // =========================================================================
  // INQUIRY TICKETS & INSTANT QUOTE REQUEST LEADS
  // =========================================================================

  const raiseInquiryTicket = (
    ticketData: Partial<ERPInquiryTicket> & {
      productName: string;
      quantity: number;
      estimatedTotalKsh: number;
    }
  ): ERPInquiryTicket => {
    const timestamp = new Date().toISOString();
    const count = inquiryTickets.length + 1;
    const ticketNumber = `INQ-2026-${String(count + 45).padStart(4, '0')}`;
    const cleanPlatformPhone = '254728102929';
    const displayPlatformPhone = '0728102929';

    const customerName = ticketData.customerName || 'Storefront Client';
    const organizationName = ticketData.organizationName || 'Direct Inquiry';
    const productName = ticketData.productName;
    const quantity = ticketData.quantity || 1;
    const estimatedTotalKsh = ticketData.estimatedTotalKsh || 0;
    const unitPrice = ticketData.unitPrice || (quantity > 0 ? Math.round(estimatedTotalKsh / quantity) : 0);

    const waText = encodeURIComponent(
      `Hello NASISI Uniforms, inquiry ticket #${ticketNumber} has been raised:\n` +
      `• Item: ${productName}\n` +
      `• Qty: ${quantity} units\n` +
      `• Est. Total: Ksh ${estimatedTotalKsh.toLocaleString()}\n` +
      (ticketData.selectedColor ? `• Color: ${ticketData.selectedColor}\n` : '') +
      (ticketData.brandingType ? `• Branding: ${ticketData.brandingType}\n` : '') +
      `Please confirm quote & delivery details.`
    );

    const newTicket: ERPInquiryTicket = {
      id: `tkt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketNumber,
      title: ticketData.title || `${productName} (${quantity} pcs) - Quote Inquiry`,
      customerName,
      organizationName,
      phone: ticketData.phone || displayPlatformPhone,
      email: ticketData.email || 'inquiries@nasisiuniforms.co.ke',
      productName,
      category: ticketData.category || 'general',
      quantity,
      selectedColor: ticketData.selectedColor,
      brandingType: ticketData.brandingType,
      logoPlacement: ticketData.logoPlacement,
      unitPrice,
      estimatedTotalKsh,
      status: ticketData.status || 'new',
      priority: ticketData.priority || 'high',
      source: ticketData.source || 'storefront_quote_request',
      notes: ticketData.notes || 'Instant lead submitted from storefront quote request modal.',
      items: ticketData.items,
      whatsappUrl: ticketData.whatsappUrl || `https://wa.me/${cleanPlatformPhone}?text=${waText}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setInquiryTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const updateInquiryTicket = (id: string, updates: Partial<ERPInquiryTicket>) => {
    const timestamp = new Date().toISOString();
    setInquiryTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: timestamp } : t))
    );
  };

  const deleteInquiryTicket = (id: string) => {
    setInquiryTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const convertTicketToInvoice = (ticketId: string): ERPDocument | null => {
    const ticket = inquiryTickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const subtotal = ticket.estimatedTotalKsh;
    const vatRate = 0.16;
    const vatAmount = Math.round(subtotal * vatRate);
    const totalAmount = subtotal + vatAmount;

    const invDoc = createDocument({
      docNumber: `INV-2026-${String(documents.filter((d) => d.type === 'invoice').length + 46).padStart(4, '0')}`,
      type: 'invoice',
      title: `Invoice for ${ticket.productName} (${ticket.quantity} units)`,
      status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: ticket.organizationName || ticket.customerName,
      contactPerson: ticket.customerName,
      customerEmail: ticket.email || '',
      customerPhone: ticket.phone || '0728102929',
      customerKraPin: 'P050000000X',
      customerAddress: 'Nairobi, Kenya',
      customerCity: 'Nairobi',
      items: [
        {
          id: `li-${Date.now()}`,
          description: `${ticket.productName} - ${ticket.selectedColor || 'Custom'} (${ticket.brandingType || 'Branded'})`,
          category: ticket.category,
          size: 'Mixed Sizes (S-XXL)',
          color: ticket.selectedColor || 'Standard',
          branding: ticket.brandingType || 'Custom Crest',
          quantity: ticket.quantity,
          unitPrice: ticket.unitPrice,
          total: subtotal,
          taxRate: 0.16,
        },
      ],
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentTerms: '50% deposit upon order confirmation, balance on delivery inspection',
      notes: `Converted directly from Client Inquiry Ticket #${ticket.ticketNumber}. Platform Hotline: 0728102929`,
      relatedDocNumber: ticket.ticketNumber,
    });

    updateInquiryTicket(ticketId, { status: 'converted_invoice' });
    return invDoc;
  };

  const convertTicketToQuotation = (ticketId: string): ERPDocument | null => {
    const ticket = inquiryTickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const subtotal = ticket.estimatedTotalKsh;
    const vatRate = 0.16;
    const vatAmount = Math.round(subtotal * vatRate);
    const totalAmount = subtotal + vatAmount;

    const qtnDoc = createDocument({
      docNumber: `QTN-2026-${String(documents.filter((d) => d.type === 'quotation').length + 108).padStart(4, '0')}`,
      type: 'quotation',
      title: `Official Quotation - ${ticket.productName}`,
      status: 'sent',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: ticket.organizationName || ticket.customerName,
      contactPerson: ticket.customerName,
      customerEmail: ticket.email || '',
      customerPhone: ticket.phone || '0728102929',
      customerKraPin: 'P050000000X',
      customerAddress: 'Nairobi, Kenya',
      customerCity: 'Nairobi',
      items: [
        {
          id: `li-${Date.now()}`,
          description: `${ticket.productName} - ${ticket.selectedColor || 'Custom'} (${ticket.brandingType || 'Branded'})`,
          category: ticket.category,
          size: 'Standard Sizes',
          color: ticket.selectedColor || 'Standard',
          branding: ticket.brandingType || 'Custom Crest',
          quantity: ticket.quantity,
          unitPrice: ticket.unitPrice,
          total: subtotal,
          taxRate: 0.16,
        },
      ],
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentTerms: 'Quotation valid for 30 calendar days. Includes digitized embroidery proof.',
      notes: `Generated from Inquiry Ticket #${ticket.ticketNumber}. Platform WhatsApp: 0728102929`,
      relatedDocNumber: ticket.ticketNumber,
    });

    updateInquiryTicket(ticketId, { status: 'quoted' });
    return qtnDoc;
  };

  // Production Orders
  const addProductionOrder = (
    orderData: Omit<ERPProductionOrder, 'id'>
  ): ERPProductionOrder => {
    const newOrder: ERPProductionOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
    };
    setProductionOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateProductionOrder = (id: string, updates: Partial<ERPProductionOrder>) => {
    setProductionOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const deleteProductionOrder = (id: string) => {
    setProductionOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Profile Settings
  const updateBusinessProfile = (updates: Partial<ERPBusinessProfile>) => {
    setBusinessProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaultData = () => {
    setBusinessProfile(INITIAL_BUSINESS_PROFILE);
    setCustomers(INITIAL_CUSTOMERS);
    setDocuments(INITIAL_DOCUMENTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setProducts(INITIAL_SYNCHRONIZED_PRODUCTS);
    setInventory(INITIAL_INVENTORY);
    setProductionOrders(INITIAL_PRODUCTION_ORDERS);
    setInquiryTickets(INITIAL_INQUIRY_TICKETS);
    resetHeroToDefault();
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTION);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
  };

  return (
    <ERPContext.Provider
      value={{
        businessProfile,
        customers,
        documents,
        transactions,
        inventory,
        productionOrders,
        products,
        inquiryTickets,
        heroSlides,
        heroConfig,
        // Admin & Customer Auth & User Profile
        currentUser,
        isAuthenticated,
        isWhitelistedAdmin,
        isCustomer,
        adminUsers,
        login,
        loginWithGoogle,
        registerWithEmail,
        logout,
        updateUserProfile,
        changePassword,
        isFirebaseConnected,
        addHeroSlide,
        updateHeroSlide,
        deleteHeroSlide,
        reorderHeroSlides,
        updateHeroConfig,
        resetHeroToDefault,
        syncHeroSlidesFromRepo,
        raiseInquiryTicket,
        updateInquiryTicket,
        deleteInquiryTicket,
        convertTicketToInvoice,
        convertTicketToQuotation,
        addProduct,
        updateProduct,
        deleteProduct,
        togglePublishProduct,
        duplicateProduct,
        syncAllProductsToInventory,
        recentlyPostedProductId,
        setRecentlyPostedProductId,
        createDocument,
        updateDocument,
        deleteDocument,
        convertQuotationToInvoice,
        createDeliveryNoteFromInvoice,
        createReceiptFromInvoice,
        recordPayment,
        reconcileMpesaPayment,
        addInventoryItem,
        updateInventoryItem,
        adjustStock,
        deleteInventoryItem,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProductionOrder,
        updateProductionOrder,
        deleteProductionOrder,
        updateBusinessProfile,
        resetToDefaultData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};

export const useERPSafe = () => {
  return useContext(ERPContext);
};
