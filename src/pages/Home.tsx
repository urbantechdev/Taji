import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HeroSearch from '../components/HeroSearch';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedGallery from '../components/FeaturedGallery';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import LegalView, { LegalType } from '../components/LegalView';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import QuoteModal from '../components/QuoteModal';
import AddToCartModal from '../components/AddToCartModal';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, RefreshCw, Palette, FileText, Scissors, Sparkles, Tag, Barcode } from 'lucide-react';
import { DEFAULT_PRODUCTS, getColorHex, PLACEHOLDER_PRODUCT_IMAGE, getProductSku, copySkuToClipboard } from '../data/defaultProducts';
import { CATEGORIES } from '../constants';

export interface CartItem {
  id: string;
  cartKey?: string;
  sku?: string;
  baseSku?: string;
  name: string;
  basePrice?: number;
  price: number;
  imageUrl: string;
  quantity: number;
  category?: string;
  selectedColor?: string;
  selectedSize?: string;
  brandingType?: string;
  brandingName?: string;
  brandingPrice?: number;
  customNotes?: string;
  colors?: string[];
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [activeLegal, setActiveLegal] = useState<LegalType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tewaw_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tewaw_cart', JSON.stringify(cart));
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Add To Cart Configuration Modal State
  const [productToConfigure, setProductToConfigure] = useState<any | null>(null);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  
  // Customer details for Firestore Schema alignment
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Lifted States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileHeroCollapsed, setIsMobileHeroCollapsed] = useState(false);

  // URL Product resolution for direct /product/:id routing and OG-image auto-picking
  const { id: urlProductId } = useParams();
  const [urlProduct, setUrlProduct] = useState<any | null>(null);

  useEffect(() => {
    if (urlProductId) {
      // Find locally first from default catalog
      const found = DEFAULT_PRODUCTS.find(
        p => p.id === urlProductId || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === urlProductId
      );
      if (found) {
        setUrlProduct(found);
      } else {
        // Fetch from Firestore
        getDoc(doc(db, 'products', urlProductId)).then(snap => {
          if (snap.exists()) {
            setUrlProduct({ id: snap.id, ...snap.data() });
          }
        }).catch(err => console.log('Could not fetch url product', err));
      }
    } else {
      setUrlProduct(null);
    }
  }, [urlProductId]);

  // Dynamic OpenGraph and SEO Configuration (Autopicks from selected product, category, or platform)
  const seoConfig = useMemo(() => {
    if (urlProduct) {
      const priceVal = urlProduct.price ? `KES ${Number(urlProduct.price).toLocaleString()}` : (urlProduct.priceRange || 'Custom Quote');
      const title = `${urlProduct.name} | Tewaw Enterprise Kenyan Garment Manufacturer`;
      const description = urlProduct.description 
        ? `${urlProduct.description} - Available for bulk factory orders & custom branding (${priceVal}) at Tewaw Enterprise, Nairobi.`
        : `Order high-quality ${urlProduct.name} (${priceVal}) direct from Tewaw Enterprise manufacturing facility in Nairobi Kenya.`;
      const img = urlProduct.imageUrl || urlProduct.image || PLACEHOLDER_PRODUCT_IMAGE;

      return {
        title,
        description,
        canonical: `https://tewaw.com/product/${urlProduct.id}`,
        ogType: 'product',
        ogImage: img,
        schema: {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": urlProduct.name,
          "image": [img],
          "description": urlProduct.description || description,
          "sku": `TEWAW-${String(urlProduct.id).toUpperCase()}`,
          "brand": {
            "@type": "Brand",
            "name": "Tewaw Enterprise"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://tewaw.com/product/${urlProduct.id}`,
            "priceCurrency": "KES",
            "price": urlProduct.price || 0,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
              "@type": "Organization",
              "name": "Tewaw Enterprise Limited"
            }
          }
        }
      };
    }

    if (activeCategoryFilter && activeCategoryFilter !== 'All') {
      const matchedCat = CATEGORIES.find(c => c.title.toLowerCase() === activeCategoryFilter.toLowerCase());
      const catTitle = matchedCat ? matchedCat.title : activeCategoryFilter;
      const catDesc = matchedCat?.description || `Explore ${catTitle} manufactured with heavy-duty fabrics and precision branding at Tewaw Enterprise Nairobi.`;
      const catImg = matchedCat?.image || PLACEHOLDER_PRODUCT_IMAGE;

      return {
        title: `${catTitle} Uniforms & Apparel | Tewaw Enterprise Kenya`,
        description: `${catDesc} Custom embroidery, DTF printing, and bulk delivery across Kenya.`,
        canonical: `https://tewaw.com/?category=${encodeURIComponent(activeCategoryFilter)}`,
        ogType: 'website',
        ogImage: catImg,
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${catTitle} Collection - Tewaw Enterprise`,
          "description": catDesc,
          "url": `https://tewaw.com/?category=${encodeURIComponent(activeCategoryFilter)}`,
          "image": catImg
        }
      };
    }

    // Default Platform OG (autopic from settings or factory showcase apparel)
    const platformOgImg = settings?.ogImageUrl || PLACEHOLDER_PRODUCT_IMAGE;

    return {
      title: "Tewaw Enterprise | Garment Manufacturing, DTF Printing & Branding at Uhuru Market, Nairobi",
      description: "Looking for bulk garment manufacturing, custom DTF printing, and corporate branding in Nairobi? Visit Tewaw Enterprise at Uhuru Market. Experts in apparel, uniforms, and high-quality digital textile printing.",
      keywords: "DTF printing Nairobi, custom garment branding Uhuru Market, apparel printing Kenya, corporate t-shirt branding, textile printing Nairobi, screen printing Kenya, bulk garment manufacturing, school uniforms Nairobi, security uniforms Kenya, custom hoodies Nairobi",
      canonical: "https://tewaw.com/",
      ogType: "website",
      ogImage: platformOgImg,
      schema: {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ClothingStore", "Manufacturer"],
        "name": "Tewaw Enterprise",
        "legalName": "Tewaw Enterprise Limited",
        "description": "Looking for bulk garment manufacturing, custom DTF printing, and corporate branding in Nairobi? Visit Tewaw Enterprise at Uhuru Market. Experts in apparel, uniforms, digital textile printing, screen printing, computerized embroidery, and high-quality corporate branding.",
        "url": "https://tewaw.com/",
        "telephone": "+254736619688",
        "keywords": "DTF printing Nairobi, custom garment branding Uhuru Market, apparel printing Kenya, corporate t-shirt branding, textile printing Nairobi, screen printing, computerized embroidery",
        "knowsAbout": [
          "DTF Printing",
          "Direct to Film Digital Transfers",
          "Screen Printing",
          "Custom Apparel Branding",
          "Textile Printing",
          "Corporate T-Shirt Branding",
          "Computerized Embroidery",
          "Garment Manufacturing"
        ],
        "image": platformOgImg,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Jagoo Lane, Uhuru Market",
          "addressLocality": "Nairobi",
          "addressRegion": "Nairobi County",
          "addressCountry": "KE"
        }
      }
    };
  }, [urlProduct, activeCategoryFilter, settings]);

  // Handle URL query parameters for category filtering & deep linking
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveCategoryFilter(categoryParam);
      setTimeout(() => {
        const el = document.getElementById('catalogue');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [searchParams, location]);

  useEffect(() => {
    // Load favicon from settings or use official Tewaw icon
    const isMock = (url?: string) => !url || url.includes('pinimg.com') || url.includes('d33d71d87f12393171b52129b460c431');
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings(data);
        const faviconUrl = data.faviconUrl && !isMock(data.faviconUrl) ? data.faviconUrl : '/favicon.ico';
        const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = faviconUrl;
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = faviconUrl;
          document.head.appendChild(newFavicon);
        }
      }
    });
  }, []);

  const handleOpenAddToCartPrompt = (product: any) => {
    if (product.selectedSize && product.brandingType) {
      // Already fully configured
      handleConfirmAddToCart(product);
    } else {
      setProductToConfigure(product);
      setIsAddToCartModalOpen(true);
    }
  };

  const handleConfirmAddToCart = (configuredItem: CartItem) => {
    const itemKey = configuredItem.cartKey || `${configuredItem.id}-${configuredItem.selectedColor || 'Standard'}-${configuredItem.selectedSize || 'L'}-${configuredItem.brandingType || 'none'}`;
    const resolvedSku = configuredItem.sku || getProductSku(configuredItem);

    setCart(prev => {
      const existingIdx = prev.findIndex(item => (item.cartKey || item.id) === itemKey);
      if (existingIdx > -1) {
        return prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + (configuredItem.quantity || 1) } : item);
      }
      return [...prev, { ...configuredItem, cartKey: itemKey, sku: resolvedSku }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(item => (item.cartKey || item.id) !== key));
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if ((item.cartKey || item.id) === key) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerEmail.trim()) {
      alert("Please enter your name and email first to checkout.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Must map all required schema keys for isValidOrder rule
      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: cart.map(item => ({
          id: item.id,
          sku: item.sku || getProductSku(item),
          name: item.name,
          basePrice: Number(item.basePrice || item.price),
          price: Number(item.price),
          imageUrl: item.imageUrl,
          quantity: Number(item.quantity),
          category: item.category || 'General',
          selectedColor: item.selectedColor || 'Standard',
          selectedSize: item.selectedSize || 'L',
          brandingType: item.brandingType || 'none',
          brandingName: item.brandingName || 'Plain / Standard',
          brandingPrice: Number(item.brandingPrice || 0)
        })),
        totalAmount: Number(cartTotal),
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // WhatsApp message with full size, SKU and branding breakdown
      let message = `*NEW ORDER FROM TEWAW WEBSITE*\nOrder Ref: #${docRef.id.slice(0, 5)}\nCustomer: ${customerName.trim()} (${customerEmail.trim()})\n\n`;
      cart.forEach(item => {
        const itemSku = item.sku || getProductSku(item);
        const skuTag = itemSku ? ` [SKU: ${itemSku}]` : '';
        const sizeTag = item.selectedSize ? ` | Size: ${item.selectedSize}` : '';
        const brandingTag = item.brandingName ? ` | Branding: ${item.brandingName}` : '';
        message += `• ${item.name}${skuTag} (${item.selectedColor || 'Standard'}${sizeTag}${brandingTag}) x${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}\n`;
      });
      message += `\n*TOTAL: KES ${cartTotal.toLocaleString()}*\n\n_Please confirm production schedule and delivery details._`;
      
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(message)}`;
      
      // Clear cart and reset details
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setIsCartOpen(false);
      
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const openQuoteModalWith = (itemsToQuote?: any[]) => {
    if (itemsToQuote && itemsToQuote.length > 0) {
      setQuoteItems(itemsToQuote);
    } else if (cart.length > 0) {
      setQuoteItems(cart);
    } else {
      setQuoteItems([]);
    }
    setIsQuoteModalOpen(true);
  };

  return (
    <div className="min-h-screen relative bg-slate-50/50">
      <a 
        href="#catalogue" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-xl focus:font-bold focus:shadow-xl"
      >
        Skip to product catalogue
      </a>
      <SEO {...seoConfig} />
      <GlassyBackground />
      <Navbar 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenQuote={() => openQuoteModalWith()}
        onCategorySelect={(cat) => {
          setActiveCategoryFilter(cat);
          const el = document.getElementById('catalogue');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      <BottomNav onOpenCart={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />
      
      <main>
        <Hero isCollapsed={isMobileHeroCollapsed} />

        <HeroSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddToCart={handleOpenAddToCartPrompt}
          isHeroCollapsed={isMobileHeroCollapsed}
          onSearchActiveChange={setIsMobileHeroCollapsed}
        />

        <CategoryGrid 
          onAddToCart={handleOpenAddToCartPrompt} 
          onRequestQuote={(product) => openQuoteModalWith([product])}
          activeCategoryFilter={activeCategoryFilter}
          setActiveCategoryFilter={setActiveCategoryFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <FeaturedGallery />
        
        {/* Clients Ticker / Showcase */}
        <section className="py-20 bg-white border-y border-slate-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">
              PROUDLY SUPPLYING APPAREL TO
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['Schools', 'Hospitals', 'Corporate', 'Government', 'NGOs', 'Saccos', 'Restaurants'].map(client => (
                <span key={client} className="text-2xl font-display font-black text-brand-blue">{client}</span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenLegal={setActiveLegal} />

      <AnimatePresence>
        {activeLegal && (
          <LegalView type={activeLegal} onClose={() => setActiveLegal(null)} />
        )}
      </AnimatePresence>

      {/* Product Add To Cart Configuration Modal (Size & Mode of Branding) */}
      <AddToCartModal
        isOpen={isAddToCartModalOpen}
        product={productToConfigure}
        onClose={() => {
          setIsAddToCartModalOpen(false);
          setProductToConfigure(null);
        }}
        onConfirmAddToCart={handleConfirmAddToCart}
      />

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[1000]" 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[1001] shadow-2xl flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-md shadow-brand-blue/20">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black text-brand-blue uppercase italic">Your Cart</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)} items selected
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
                {cart.length > 0 ? cart.map((item, idx) => {
                  const itemKey = item.cartKey || item.id || `cart-${idx}`;
                  const colorHex = item.selectedColor ? getColorHex(item.selectedColor) : null;

                  return (
                    <div key={itemKey} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex gap-3.5 group relative hover:border-slate-200 transition-all">
                      <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          referrerPolicy="no-referrer"
                          src={item.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt={item.name} 
                          loading="lazy" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-black text-xs text-brand-blue truncate uppercase">{item.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Barcode className="w-2.5 h-2.5 text-brand-blue" />
                                {item.sku || getProductSku(item)}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(itemKey)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Size, Color, and Branding badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                          {item.selectedSize && (
                            <span className="text-[9px] font-black text-brand-blue bg-white border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                              <Scissors className="w-2.5 h-2.5 text-brand-orange" />
                              Size: {item.selectedSize}
                            </span>
                          )}

                          {item.selectedColor && (
                            <span className="text-[9px] font-extrabold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                              {colorHex && (
                                <span 
                                  className="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs" 
                                  style={{ background: colorHex }}
                                />
                              )}
                              {item.selectedColor}
                            </span>
                          )}

                          {item.brandingName && (
                            <span className="text-[9px] font-black text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                              <Sparkles className="w-2.5 h-2.5" />
                              {item.brandingName}
                              {item.brandingPrice && item.brandingPrice > 0 ? ` (+KES ${item.brandingPrice})` : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-xl border border-slate-200">
                            <button 
                              onClick={() => updateQuantity(itemKey, -1)} 
                              className="text-slate-400 hover:text-brand-orange transition-colors p-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-black text-brand-blue min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(itemKey, 1)} 
                              className="text-slate-400 hover:text-brand-orange transition-colors p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-mono block">
                              @ KES {item.price.toLocaleString()}
                            </span>
                            <span className="font-mono font-black text-brand-blue text-xs">
                              KES {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <p className="font-display font-black text-xl uppercase tracking-tight text-slate-400 mb-2">Your cart is empty</p>
                    <p className="text-xs text-slate-400 mb-6">Select uniforms & garments to customize sizes & branding</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-orange transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 space-y-3.5">
                  {/* Customer Information Form */}
                  <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer Details for Order</p>
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="Your Full Name (e.g. David Mutua)" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue font-bold"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        required
                        placeholder="Your Email Address (e.g. david@company.co.ke)" 
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal ({cart.reduce((acc, i) => acc + i.quantity, 0)} pcs)</span>
                    <span className="text-xl font-mono font-black text-brand-blue">KES {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        openQuoteModalWith(cart);
                      }}
                      className="w-full py-3.5 bg-brand-green text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-brand-green/20 hover:bg-[#1f7743] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Generate Official PDF Quote
                    </button>

                    <button 
                      onClick={handleCheckout}
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-brand-blue/20 hover:bg-brand-orange transition-all flex items-center justify-center gap-2 border-none"
                    >
                      {isSubmittingOrder ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Checkout via WhatsApp <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-slate-400 font-bold uppercase italic">Direct factory prices & custom branding via Tewaw Enterprise</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        initialItems={quoteItems} 
        settings={settings} 
      />
    </div>
  );
}
