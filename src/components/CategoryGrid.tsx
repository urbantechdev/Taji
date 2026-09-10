import { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, Category } from '../constants';
import { 
  ArrowUpRight, 
  ShoppingBag, 
  X, 
  CheckCircle2, 
  Factory, 
  MessageCircle, 
  ArrowRight, 
  Search, 
  SlidersHorizontal, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  LayoutGrid,
  Zap,
  Box,
  Image as ImageIcon,
  Info,
  Palette,
  Check,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Eye
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DEFAULT_PRODUCTS, PRICE_DISCLAIMER_NOTE, formatPriceDisplay, getColorHex, PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';
import { ensureProductsSeeded, ensureCategoriesSeeded } from '../lib/firebaseSeeder';
import { getOptimizedImageUrl, preloadImages } from '../lib/imageOptimizer';
import { generateProductJsonLd } from '../utils/googleMerchant';
import ShareModal from './ShareModal';
import ProductCard from './ProductCard';

const Product3DViewer = lazy(() => import('./Product3DViewer'));

export default function CategoryGrid({ 
  onAddToCart,
  onRequestQuote,
  activeCategoryFilter,
  setActiveCategoryFilter,
  searchQuery,
  setSearchQuery
}: { 
  onAddToCart: (product: any) => void,
  onRequestQuote?: (product: any) => void,
  activeCategoryFilter: string,
  setActiveCategoryFilter: (cat: string) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isDetailsCollapsedMobile, setIsDetailsCollapsedMobile] = useState<boolean>(true);

  useEffect(() => {
    if (selectedProduct) {
      setIsDetailsCollapsedMobile(true);
      if (selectedProduct.colors && selectedProduct.colors.length > 0) {
        setSelectedColor(selectedProduct.colors[0]);
      } else {
        setSelectedColor('');
      }

      // Dynamically update document title and Open Graph meta tags in client DOM
      const title = `${selectedProduct.name} | Tewaw Enterprise Kenya`;
      const priceText = selectedProduct.priceRange || (selectedProduct.price ? `KES ${Number(selectedProduct.price).toLocaleString()}` : '');
      const desc = selectedProduct.description 
        ? `${selectedProduct.description} ${priceText ? `(${priceText})` : ''}`
        : `High quality ${selectedProduct.name} from Tewaw Enterprise, Nairobi Kenya.`;
      const img = selectedProduct.imageUrl || '';

      document.title = title;

      const setMeta = (attrName: string, attrValue: string, contentValue: string) => {
        let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attrName, attrValue);
          document.head.appendChild(el);
        }
        el.setAttribute('content', contentValue);
      };

      setMeta('name', 'title', title);
      setMeta('name', 'description', desc);
      setMeta('property', 'og:title', title);
      setMeta('property', 'og:description', desc);
      setMeta('property', 'og:type', 'product');
      setMeta('property', 'og:url', `https://tewaw.com/product/${selectedProduct.id}`);
      setMeta('name', 'twitter:title', title);
      setMeta('name', 'twitter:description', desc);
      if (img) {
        setMeta('property', 'og:image', img);
        setMeta('property', 'og:image:secure_url', img);
        setMeta('property', 'og:image:alt', title);
        setMeta('property', 'og:image:width', '1200');
        setMeta('property', 'og:image:height', '630');
        setMeta('name', 'twitter:image', img);
        setMeta('property', 'twitter:image', img);
        setMeta('name', 'twitter:image:alt', title);
      }
    } else {
      document.title = 'Tewaw Enterprise | Premium Kenyan Garment Manufacturer';
    }
  }, [selectedProduct]);
  
  // Catalogue States
  const [sortOrder, setSortOrder] = useState<'none' | 'price-asc' | 'price-desc' | 'name-asc'>('none');
  const [displayLimit, setDisplayLimit] = useState(8);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const { id: urlProductId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Share Modal State
  const [productToShare, setProductToShare] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleOpenShare = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToShare(product);
    setIsShareModalOpen(true);
  };

  // Lightbox and Image Zoom states
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string; category?: string; priceText?: string; product?: any; imageIndex?: number } | null>(null);
  const [modalImageFitMode, setModalImageFitMode] = useState<'fit' | 'fill'>('fill');
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialGalleryIndexRef = useRef<number>(0);

  // Reset gallery index and inject Schema.org JSON-LD whenever selected product changes
  useEffect(() => {
    setSelectedGalleryIndex(initialGalleryIndexRef.current || 0);
    initialGalleryIndexRef.current = 0;
    
    // Inject Schema.org/Product structured data for Google Rich Results & Google Merchant
    const scriptId = 'google-merchant-product-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (selectedProduct) {
      const jsonLdData = generateProductJsonLd(selectedProduct, window.location.origin);
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(jsonLdData);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [selectedProduct]);

  // Handle keyboard ESC for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
          setLightboxZoom(1);
          setLightboxPan({ x: 0, y: 0 });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const handleOpenLightbox = (item: { url: string; title?: string; category?: string; priceText?: string; product?: any; imageIndex?: number }) => {
    setLightboxImage(item);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setLightboxZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setLightboxZoom(prev => Math.max(prev - 0.5, 0.75));
  const handleResetZoom = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    // If URL has product ID, fetch it explicitly if not in list
    if (urlProductId) {
      const fetchUrlProduct = async () => {
        try {
          const docRef = doc(db, 'products', urlProductId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setSelectedProduct({ id: snap.id, ...snap.data() });
          }
        } catch (err) {
          console.error("Error fetching product from URL", err);
        }
      };
      fetchUrlProduct();
    }
  }, [urlProductId]);

  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Ensure all 33 products and default categories exist in Firestore
    ensureProductsSeeded();
    ensureCategoriesSeeded();

    // Fetch dynamic categories from Firestore
    const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCategories = onSnapshot(catQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setDbCategories(docs);
      } else {
        setDbCategories([]);
      }
    }, (err) => {
      console.debug('Categories subscription notice:', err);
    });

    // Fetch products
    const q = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000);
        return timeB - timeA;
      });
      setProducts(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  // Preload top category and product images in the background
  useEffect(() => {
    const urlsToPreload: string[] = [];
    CATEGORIES.slice(0, 8).forEach(c => {
      if (c.image) urlsToPreload.push(getOptimizedImageUrl(c.image, 380, 75));
    });
    DEFAULT_PRODUCTS.slice(0, 8).forEach(p => {
      if (p.imageUrl) urlsToPreload.push(getOptimizedImageUrl(p.imageUrl, 550, 80));
    });
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, []);

  // Use dynamic categories from Firestore if available, otherwise fallback to defaults
  const activeCategories = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories;
    }
    return CATEGORIES;
  }, [dbCategories]);

  // Retain only user-uploaded Firestore products
  const allProducts = useMemo(() => {
    return products.filter(p => p && !p.isDeleted);
  }, [products]);

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category Filter
    if (activeCategoryFilter !== 'All') {
      result = result.filter(p => p.category === activeCategoryFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortOrder === 'price-asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [allProducts, searchQuery, activeCategoryFilter, sortOrder]);

  const displayedProducts = filteredProducts.slice(0, displayLimit);

  const productCategories = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category));
    return ['All', ...Array.from(cats)].filter(Boolean);
  }, [allProducts]);

  return (
    <section className="pt-0 pb-10 sm:py-20 bg-white relative overflow-hidden" id="categories">
      {/* Category/Product Detail Popup */}
      <AnimatePresence>
        {(selectedCategory || selectedProduct) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedCategory(null); setSelectedProduct(null); setViewMode('2d'); }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[24px] sm:rounded-[36px] md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[94vh] sm:max-h-[90vh] md:max-h-[85vh] brand-edge-orange border-none"
            >
              {/* Close Button - Unified Green Styling */}
              <button 
                onClick={() => { setSelectedCategory(null); setSelectedProduct(null); setViewMode('2d'); }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-brand-green hover:bg-[#1E7642] text-white shadow-lg shadow-brand-green/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-[220] transform hover:rotate-90 hover:scale-110 group"
                title="Close"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              </button>

              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                {/* Image / 3D Viewer Side */}
                {(() => {
                  const modalGalleryImages = selectedProduct 
                    ? [selectedProduct.imageUrl, ...(selectedProduct.additionalImages || (selectedProduct as any).images || [])].filter(Boolean)
                    : (selectedCategory?.image ? [selectedCategory.image] : []);
                  const currentImage = modalGalleryImages[selectedGalleryIndex] || modalGalleryImages[0] || selectedCategory?.image || selectedProduct?.imageUrl;

                  return (
                    <div className="w-full md:w-5/12 h-80 sm:h-96 md:h-auto relative shrink-0 bg-slate-900/5 flex flex-col items-center justify-center p-0 overflow-hidden group/modalimg select-none">
                      {selectedProduct?.model3dUrl && viewMode === '3d' ? (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div></div>}>
                          <Product3DViewer url={selectedProduct.model3dUrl} />
                        </Suspense>
                      ) : (
                        <div 
                          onClick={() => handleOpenLightbox({
                            url: currentImage,
                            title: selectedCategory?.title || selectedProduct?.name,
                            category: selectedCategory ? 'Collection' : selectedProduct?.category,
                            priceText: selectedProduct ? formatPriceDisplay(selectedProduct) : undefined,
                            product: selectedProduct,
                            imageIndex: selectedGalleryIndex
                          })}
                          className="w-full flex-1 flex items-center justify-center relative cursor-zoom-in overflow-hidden"
                          title="Click or tap to view high-resolution image"
                        >
                          <img 
                            referrerPolicy="no-referrer"
                            src={getOptimizedImageUrl(currentImage, 900, 80)} 
                            alt={selectedCategory?.title || selectedProduct?.name} 
                            className={cn(
                              "w-full h-full transition-all duration-500 rounded-t-[20px] md:rounded-none min-h-[260px] sm:min-h-[320px] md:min-h-0",
                              modalImageFitMode === 'fit' 
                                ? "object-contain p-2 sm:p-4 scale-100 group-hover/modalimg:scale-105" 
                                : "object-cover object-center scale-105 sm:scale-100 group-hover/modalimg:scale-110"
                            )}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                            }}
                          />

                          {/* Multiple Images Navigation Arrows */}
                          {modalGalleryImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGalleryIndex((prev) => (prev > 0 ? prev - 1 : modalGalleryImages.length - 1));
                                }}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-blue/80 hover:bg-brand-blue text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
                                title="Previous photo"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGalleryIndex((prev) => (prev < modalGalleryImages.length - 1 ? prev + 1 : 0));
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-blue/80 hover:bg-brand-blue text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
                                title="Next photo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Image Zoom Mode & Fullscreen Action Badges */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 opacity-90 group-hover/modalimg:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalImageFitMode(prev => prev === 'fit' ? 'fill' : 'fit');
                              }}
                              className="px-2.5 py-1.5 bg-brand-blue/80 hover:bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-md transition-all"
                              title={modalImageFitMode === 'fit' ? "Switch to Fill / Zoom view" : "Switch to Fit Full Image"}
                            >
                              {modalImageFitMode === 'fit' ? (
                                <>
                                  <Maximize2 className="w-3 h-3 text-brand-orange" /> Fit
                                </>
                              ) : (
                                <>
                                  <Minimize2 className="w-3 h-3 text-brand-orange" /> Fill
                                </>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLightbox({
                                  url: currentImage,
                                  title: selectedCategory?.title || selectedProduct?.name,
                                  category: selectedCategory ? 'Collection' : selectedProduct?.category,
                                  priceText: selectedProduct ? formatPriceDisplay(selectedProduct) : undefined,
                                  product: selectedProduct,
                                  imageIndex: selectedGalleryIndex
                                });
                              }}
                              className="p-1.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-[10px] font-black uppercase backdrop-blur-md flex items-center justify-center shadow-md transition-all"
                              title="Open Fullscreen High-Res Zoom"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Click to Zoom Bottom Overlay Hint */}
                          <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
                            <span className="px-3 py-1 bg-brand-blue/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 opacity-80 group-hover/modalimg:opacity-100 transition-opacity">
                              <ZoomIn className="w-2.5 h-2.5 text-brand-orange" /> Tap Image to Zoom & Expand
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Gallery Thumbnails Strip */}
                      {modalGalleryImages.length > 1 && viewMode === '2d' && (
                        <div className="w-full p-2.5 bg-slate-950/80 backdrop-blur-md flex items-center justify-center gap-2 overflow-x-auto z-20 shrink-0">
                          {modalGalleryImages.map((img, idx) => {
                            const isSelected = idx === selectedGalleryIndex;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGalleryIndex(idx);
                                }}
                                className={cn(
                                  "w-11 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative",
                                  isSelected ? "border-brand-orange scale-105 shadow-md shadow-brand-orange/40 ring-2 ring-brand-orange/30" : "border-white/30 opacity-60 hover:opacity-100"
                                )}
                                title={`View photo ${idx + 1}`}
                              >
                                <img
                                  referrerPolicy="no-referrer"
                                  src={getOptimizedImageUrl(img, 120, 70)}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 && (
                                  <div className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-brand-orange text-[7px] font-black text-white rounded-xs uppercase leading-none">
                                    Main
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedProduct?.model3dUrl && (
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[200] flex gap-2">
                           <button
                             onClick={() => setViewMode('2d')}
                             className={cn(
                               "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg",
                               viewMode === '2d' ? "bg-brand-blue text-white" : "bg-white text-slate-400 hover:bg-slate-50"
                             )}
                           >
                             <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 2D
                           </button>
                           <button
                             onClick={() => setViewMode('3d')}
                             className={cn(
                               "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg",
                               viewMode === '3d' ? "bg-brand-blue text-white" : "bg-white text-slate-400 hover:bg-slate-50"
                             )}
                           >
                             <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 3D Flow
                           </button>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/40 via-transparent to-transparent md:hidden pointer-events-none rounded-t-[20px]" />
                    </div>
                  );
                })()}

                {/* Content Side */}
                <div className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto">
                  {selectedCategory ? (
                    <>
                      <p className="text-brand-orange text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] mb-2">Collection Profile</p>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-display font-black text-brand-blue mb-4 leading-snug">{selectedCategory.title}</h3>
                      
                      <p className="text-slate-600 mb-6 text-xs sm:text-sm leading-relaxed font-medium">
                        {selectedCategory.description}
                      </p>

                      <div className="space-y-6">
                        {/* Items List */}
                        <div>
                          <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             Available Garments
                             <div className="flex-1 h-px bg-slate-100" />
                          </h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                            {selectedCategory.items.map((item, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-brand-blue uppercase tracking-tight">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Materials & Specialties */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-8">
                          <div>
                            <h4 className="text-[10px] sm:text-xs font-black text-brand-orange uppercase tracking-widest mb-3">Specialties</h4>
                            <div className="space-y-1.5">
                              {selectedCategory.specialties?.map((spec, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-600">
                                  <Factory className="w-3 h-3 text-brand-orange shrink-0" />
                                  <span>{spec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] sm:text-xs font-black text-brand-blue uppercase tracking-widest mb-3">Materials</h4>
                            <div className="space-y-1.5">
                              {selectedCategory.materials?.map((mat, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-600">
                                  <CheckCircle2 className="w-3 h-3 text-brand-blue shrink-0" />
                                  <span>{mat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <button 
                          onClick={() => {
                            setSelectedCategory(null);
                            const msg = `Hello! I'm interested in learning more about the ${selectedCategory.title} collection and placing an order.`;
                            window.open(`https://wa.me/254736619688?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="w-full py-3.5 sm:py-4 bg-brand-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 brand-glow-blue hover:translate-x-1 transition-all"
                        >
                          Start Order <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : selectedProduct && (
                    <>
                      <p className="text-brand-orange text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] mb-1.5">{selectedProduct.category}</p>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-display font-black text-brand-blue mb-1 leading-snug uppercase">{selectedProduct.name}</h3>
                      <p className="text-base sm:text-lg md:text-xl font-mono font-black text-brand-blue mb-3">
                        {formatPriceDisplay(selectedProduct)}
                      </p>

                      {/* Mobile Collapsible Details */}
                      <div className="md:hidden mb-3">
                        <button
                          type="button"
                          onClick={() => setIsDetailsCollapsedMobile(!isDetailsCollapsedMobile)}
                          className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200/80 rounded-2xl text-xs font-black text-brand-blue transition-all"
                        >
                          <span className="flex items-center gap-2 uppercase tracking-wider text-[10px] sm:text-[11px]">
                            <Info className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Product Details & Pricing Info
                          </span>
                          <span className="text-slate-500 font-bold text-[9px] sm:text-[10px] flex items-center gap-1 uppercase tracking-wider shrink-0">
                            {isDetailsCollapsedMobile ? 'Expand' : 'Hide'}
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", !isDetailsCollapsedMobile && "rotate-180")} />
                          </span>
                        </button>

                        <AnimatePresence>
                          {!isDetailsCollapsedMobile && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2.5 space-y-2.5"
                            >
                              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-[10px] sm:text-[11px] font-medium text-amber-900 leading-relaxed shadow-xs flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <p><strong>Pricing Note:</strong> {PRICE_DISCLAIMER_NOTE}</p>
                              </div>
                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-xs leading-relaxed">
                                {selectedProduct.description || "A premium creation from the Tewaw factory floor. Built for durability, style, and professional performance."}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Desktop Full View Details */}
                      <div className="hidden md:block space-y-4 mb-5">
                        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-[11px] font-medium text-amber-900 leading-relaxed flex items-start gap-2.5 shadow-xs">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p><strong>Pricing Note:</strong> {PRICE_DISCLAIMER_NOTE}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 italic font-medium text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {selectedProduct.description || "A premium creation from the Tewaw factory floor. Built for durability, style, and professional performance."}
                        </div>
                      </div>

                      <div className="space-y-4 sm:space-y-5">

                        {/* Color Choice Selection */}
                        {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                          <div className="p-3.5 sm:p-5 bg-slate-50/80 rounded-2xl sm:rounded-3xl border border-slate-200/80">
                            <div className="flex items-center justify-between mb-2.5">
                              <h4 className="text-[10px] sm:text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-brand-orange" /> Fabric Colors
                              </h4>
                              {selectedColor && (
                                <span className="text-[9px] sm:text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider border border-brand-orange/20 truncate max-w-[150px]">
                                  {selectedColor}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {selectedProduct.colors.map((c: string) => {
                                const isSelected = selectedColor === c;
                                const bgHex = getColorHex(c);
                                const isLight = c.toLowerCase() === 'white' || c.toLowerCase().includes('beige') || c.toLowerCase().includes('yellow');

                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    title={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={cn(
                                      "px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer select-none",
                                      isSelected 
                                        ? "border-brand-orange bg-white text-brand-blue shadow-sm ring-2 ring-brand-orange/20" 
                                        : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white"
                                    )}
                                  >
                                    <span 
                                      className={cn(
                                        "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full inline-block shrink-0 shadow-xs",
                                        isLight ? "border border-slate-300" : ""
                                      )}
                                      style={{ background: bgHex }}
                                    />
                                    <span className="uppercase text-[9px] sm:text-[10px] font-extrabold tracking-tight">{c}</span>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-brand-orange ml-0.5 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div>
                             <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                Options Available
                                <div className="flex-1 h-px bg-slate-100" />
                             </h4>
                             <div className="flex flex-wrap gap-1.5">
                               {selectedProduct.variants.map((v: any, i: number) => (
                                 <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] sm:text-[10px] font-bold text-brand-blue uppercase">
                                   <span className="text-slate-400 mr-1">{v.type}:</span> {v.name}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}

                        {/* Modal Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                          <button 
                            onClick={() => {
                              onAddToCart({
                                ...selectedProduct,
                                selectedColor: selectedColor || (selectedProduct.colors?.[0] || 'Standard')
                              });
                              setSelectedProduct(null);
                            }}
                            className="py-3 sm:py-4 bg-brand-orange text-white rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 brand-glow-orange hover:-translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:outline-none"
                            aria-label={`Add ${selectedProduct.name} to Cart`}
                          >
                            Add to Cart <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenShare(selectedProduct)}
                            className="py-3 sm:py-4 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:outline-none"
                            aria-label={`Share ${selectedProduct.name} and image`}
                          >
                            Share <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                          {onRequestQuote && (
                            <button 
                              onClick={() => {
                                onRequestQuote({
                                  ...selectedProduct,
                                  quantity: 10,
                                  selectedColor: selectedColor || (selectedProduct.colors?.[0] || 'Standard')
                                });
                                setSelectedProduct(null);
                              }}
                              className="w-full py-3 sm:py-4 bg-brand-green text-white rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#1f7743] transition-all shadow-md shadow-brand-green/20"
                            >
                              Get Quote (PDF) <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              const colorMsg = selectedColor ? ` | Selected Color: ${selectedColor}` : '';
                              const msg = `Hello! I'm interested in the ${selectedProduct.name} (${selectedProduct.category})${colorMsg}. Price: KES ${selectedProduct.price.toLocaleString()}`;
                              window.open(`https://wa.me/254736619688?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-full py-3 sm:py-4 bg-brand-blue text-white rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-brand-orange transition-all"
                          >
                            Chat on WhatsApp <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        
                        {selectedProduct.linkUrl && (
                          <a 
                            href={selectedProduct.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 bg-slate-100 text-brand-blue text-center rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-slate-200 transition-all"
                          >
                            Visit Product Link <LinkIcon className="w-3.5 h-3.5 inline ml-1 align-sub" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-2 sm:pt-6">
        {/* Collections Cards - Smaller & Round Image Capsules on Mobile, Full Cards on Desktop */}
        <div 
          id="collections-scroll-container"
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none pb-2 sm:pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar mb-2 sm:mb-6 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {activeCategories.map((cat, idx) => (
            <motion.div 
              key={cat.id || idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              viewport={{ once: true }}
              onClick={() => setSelectedCategory(cat)}
              className="w-24 xs:w-28 sm:w-auto shrink-0 snap-start sm:snap-align-none flex flex-col items-center sm:block group cursor-pointer text-center sm:text-left select-none"
            >
              {/* Round & Compact on Mobile / Aspect 4:5 on Tablet & Desktop */}
              <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-full sm:h-auto sm:aspect-[4/5] rounded-full sm:rounded-[36px] overflow-hidden mb-2 sm:mb-4 border-2 sm:border border-white sm:border-slate-100/90 shadow-md sm:shadow-sm hover:shadow-xl group-hover:scale-105 sm:group-hover:scale-[1.02] transition-all duration-500 bg-slate-900 ring-2 ring-brand-orange/30 sm:ring-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={getOptimizedImageUrl(cat.image, 380, 75)} 
                  alt={cat.title} 
                  className="w-full h-full object-cover object-center scale-110 group-hover:scale-125 transition-transform duration-700" 
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                  }}
                />
                
                {/* Desktop Gradient Overlay */}
                <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-brand-blue/95 via-brand-blue/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                
                {/* Mobile Glow Pulse Accent */}
                <div className="sm:hidden absolute inset-0 bg-brand-blue/10 group-hover:bg-transparent transition-colors" />

                {/* Desktop Content Overlay */}
                <div className="hidden sm:flex absolute inset-0 p-4 sm:p-7 flex-col justify-end">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/25 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 sm:mb-4 group-hover:bg-brand-orange group-hover:scale-110 transition-all shadow-md">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-sm sm:lg md:text-xl font-display font-black text-white leading-tight mb-1 sm:mb-2 uppercase truncate sm:whitespace-normal">{cat.title}</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-black text-brand-green uppercase tracking-wider">{(cat.items || []).length} Product Types</span>
                    <div className="w-1 h-1 bg-white/40 rounded-full hidden sm:block" />
                    <span className="text-[8px] sm:text-[10px] font-bold text-white/70 tracking-tight uppercase hidden sm:inline">Technical View</span>
                  </div>
                </div>
              </div>

              {/* Mobile-Only Labels Underneath the Round Image */}
              <div className="sm:hidden w-full px-0.5">
                <h3 className="text-[11px] font-black text-brand-blue leading-tight uppercase line-clamp-2 group-hover:text-brand-orange transition-colors">
                  {cat.title}
                </h3>
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block mt-0.5">
                  {(cat.items || []).length} Types
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full Product Catalogue Section */}
        <div className="mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-slate-100 relative" id="catalogue">
          {/* Section Heading & Pricing Note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-display font-black text-brand-blue uppercase leading-none mb-1">
                PRODUCT <span className="text-brand-green">CATALOGUE</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {displayedProducts.length} of {allProducts.length} Factory Creations
                </p>
              </div>
            </div>

            {/* Pricing Disclaimer Banner */}
            <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 font-medium shadow-2xs max-w-xl">
              <Info className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              <span className="line-clamp-1 sm:line-clamp-none"><strong>Pricing Note:</strong> {PRICE_DISCLAIMER_NOTE}</span>
            </div>
          </div>

          {/* Dynamic Products Grid */}
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {displayedProducts.map((product, idx) => (
                <ProductCard
                  key={product.id || `prod-${product.name}-${idx}`}
                  product={product}
                  idx={idx}
                  onSelectProduct={(p, initialImgIdx) => {
                    initialGalleryIndexRef.current = initialImgIdx;
                    setSelectedProduct(p);
                    setViewMode('2d');
                  }}
                  onOpenLightbox={handleOpenLightbox}
                  onOpenShare={handleOpenShare}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Search className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-display font-black text-slate-300 uppercase italic mb-2">No Match Found</h4>
              <p className="text-slate-500 text-sm">We couldn't find any products matching your current filters.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategoryFilter('All');
                  setSortOrder('none');
                }}
                className="mt-8 px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-orange hover:text-white transition-all shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination / Load More */}
          {displayLimit < filteredProducts.length && (
            <div className="mt-20 flex justify-center">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 12)}
                className="group relative px-12 py-5 bg-white border-2 border-brand-blue rounded-[32px] overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-brand-blue translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 text-brand-blue group-hover:text-white font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3 transition-colors">
                  Load More Gear <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen High-Resolution Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-6 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setLightboxImage(null);
                handleResetZoom();
              }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />

            {/* Lightbox Toolbar & Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] flex flex-col z-10 overflow-hidden bg-slate-900/60 rounded-3xl sm:rounded-[36px] border border-white/10 shadow-2xl"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-950/70 border-b border-white/10 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-orange text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest leading-none truncate">
                      {lightboxImage.category || 'High-Res Preview'}
                    </p>
                    <h3 className="text-white text-xs sm:text-base font-display font-black uppercase tracking-tight truncate mt-1">
                      {lightboxImage.title || 'Product View'}
                    </h3>
                  </div>
                </div>

                {/* Top Action Controls */}
                <div className="flex items-center gap-2">
                  {lightboxImage.priceText && (
                    <span className="hidden sm:inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-full font-mono font-bold text-xs text-white">
                      {lightboxImage.priceText}
                    </span>
                  )}

                  {lightboxImage.product && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(lightboxImage.product);
                      }}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add to Cart</span>
                    </button>
                  )}

                  <a
                    href={lightboxImage.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Open / Download Full Image"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxImage(null);
                      handleResetZoom();
                    }}
                    className="p-2 sm:px-3 sm:py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center ml-1"
                    title="Close Lightbox (Esc)"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Main Image Canvas View */}
              {(() => {
                const lightboxProduct = lightboxImage.product;
                const lightboxImages = lightboxProduct
                  ? [lightboxProduct.imageUrl, ...(lightboxProduct.additionalImages || (lightboxProduct as any).images || [])].filter(Boolean)
                  : [lightboxImage.url];
                const currentIndex = lightboxImage.imageIndex !== undefined 
                  ? lightboxImage.imageIndex 
                  : Math.max(0, lightboxImages.indexOf(lightboxImage.url));

                const handleSwitchImage = (newIdx: number) => {
                  const targetUrl = lightboxImages[newIdx];
                  if (!targetUrl) return;
                  setLightboxImage({
                    ...lightboxImage,
                    url: targetUrl,
                    imageIndex: newIdx
                  });
                  setSelectedGalleryIndex(newIdx);
                  handleResetZoom();
                };

                return (
                  <div 
                    className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-2 sm:p-6 bg-radial from-slate-900 to-slate-950 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      if (lightboxZoom > 1) {
                        setIsDraggingImage(true);
                        dragStartRef.current = { x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y };
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingImage && lightboxZoom > 1) {
                        setLightboxPan({
                          x: e.clientX - dragStartRef.current.x,
                          y: e.clientY - dragStartRef.current.y
                        });
                      }
                    }}
                    onMouseUp={() => setIsDraggingImage(false)}
                    onMouseLeave={() => setIsDraggingImage(false)}
                  >
                    <motion.div
                      animate={{
                        scale: lightboxZoom,
                        x: lightboxPan.x,
                        y: lightboxPan.y
                      }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="w-full flex-1 flex items-center justify-center pointer-events-none"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={getOptimizedImageUrl(lightboxImage.url, 1400, 85)}
                        alt={lightboxImage.title}
                        className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] select-none"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                        }}
                      />
                    </motion.div>

                    {/* Lightbox Prev/Next Gallery Arrow Buttons */}
                    {lightboxImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const prevIdx = currentIndex > 0 ? currentIndex - 1 : lightboxImages.length - 1;
                            handleSwitchImage(prevIdx);
                          }}
                          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-950/80 hover:bg-brand-orange text-white rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-all hover:scale-110 z-30 pointer-events-auto"
                          title="Previous photo (Gallery)"
                        >
                          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextIdx = currentIndex < lightboxImages.length - 1 ? currentIndex + 1 : 0;
                            handleSwitchImage(nextIdx);
                          }}
                          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-950/80 hover:bg-brand-orange text-white rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-all hover:scale-110 z-30 pointer-events-auto"
                          title="Next photo (Gallery)"
                        >
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </>
                    )}

                    {/* Gallery Thumbnails inside Lightbox */}
                    {lightboxImages.length > 1 && (
                      <div className="w-full py-2 flex items-center justify-center gap-2 overflow-x-auto z-30 pointer-events-auto shrink-0 mb-14 sm:mb-16">
                        {lightboxImages.map((imgUrl, i) => {
                          const isCur = i === currentIndex;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitchImage(i);
                              }}
                              className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative",
                                isCur ? "border-brand-orange scale-110 shadow-lg shadow-brand-orange/50 ring-2 ring-brand-orange/40" : "border-white/30 opacity-60 hover:opacity-100"
                              )}
                              title={`Image ${i + 1}`}
                            >
                              <img
                                referrerPolicy="no-referrer"
                                src={getOptimizedImageUrl(imgUrl, 120, 70)}
                                alt={`Gallery thumbnail ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Floating Bottom Zoom Controller Bar */}
                    <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex justify-center z-30 pointer-events-auto">
                      <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          disabled={lightboxZoom <= 0.75}
                          className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>

                        <span className="text-[10px] sm:text-xs font-mono font-bold text-white px-1.5 min-w-[50px] text-center">
                          {Math.round(lightboxZoom * 100)}%
                        </span>

                        <button
                          type="button"
                          onClick={handleZoomIn}
                          disabled={lightboxZoom >= 4}
                          className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>

                        <div className="h-4 w-px bg-white/20 mx-0.5" />

                        <button
                          type="button"
                          onClick={handleResetZoom}
                          className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-[10px] sm:text-[11px] font-extrabold uppercase transition-all flex items-center gap-1"
                          title="Reset Zoom"
                        >
                          <RotateCcw className="w-3 h-3 text-brand-orange" /> Reset
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLightboxZoom(2);
                            setLightboxPan({ x: 0, y: 0 });
                          }}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-extrabold uppercase transition-all"
                          title="2x Zoom Fit"
                        >
                          2x
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Product & Image Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        product={productToShare} 
      />
    </section>
  );
}
