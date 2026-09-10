import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import LegalView, { LegalType } from '../components/LegalView';
import GlassyBackground from '../components/GlassyBackground';
import SEO from '../components/SEO';
import { Camera, Eye, X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import { CartItem } from './Home';
import { getOptimizedImageUrl, getGalleryImageUrl } from '../lib/imageOptimizer';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../data/defaultProducts';

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  const [activeLegal, setActiveLegal] = useState<LegalType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
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

  useEffect(() => {
    const q = query(collection(db, 'gallery'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000);
        return timeB - timeA;
      });
      setImages(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
  }, []);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const orderData = {
        items: cart,
        totalAmount: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      let message = `*NEW ORDER FROM WEBSITE*\nOrder Ref: #${docRef.id.slice(0, 5)}\n\n`;
      cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}\n`;
      });
      message += `\n*TOTAL: KES ${cartTotal.toLocaleString()}*\n\n_Please confirm delivery details._`;
      
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '254736619688'}?text=${encodeURIComponent(message)}`;
      
      setCart([]);
      setIsCartOpen(false);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const gallerySchema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": "https://tewaw.com/gallery#gallery",
    "name": "Tewaw Enterprise Garment Manufacturing Gallery",
    "description": "Showcase of custom security uniforms, tactical hoodies, school dresses, corporate wear, medical scrubs, chef coats, and African heritage apparel manufactured by Tewaw Enterprise in Kenya.",
    "url": "https://tewaw.com/gallery",
    "publisher": {
      "@type": "Organization",
      "name": "Tewaw Enterprise",
      "url": "https://tewaw.com/",
      "logo": "https://tewaw.com/icon-512.png"
    },
    "image": images.map((img) => ({
      "@type": "ImageObject",
      "@id": `https://tewaw.com/gallery#image-${img.id}`,
      "name": `Tewaw Enterprise - ${img.title}`,
      "caption": img.description || `Custom ${img.title} manufactured by Tewaw Enterprise`,
      "description": `Tewaw Enterprise ${img.title} (${img.category || 'Custom Apparel'}). High quality garment manufacturing in Nairobi Kenya.`,
      "contentUrl": img.imageUrl?.startsWith('data:')
        ? `https://tewaw.com/api/gallery/image/${img.id}.webp`
        : img.imageUrl,
      "thumbnailUrl": img.imageUrl?.startsWith('data:')
        ? `https://tewaw.com/api/gallery/image/${img.id}.webp`
        : img.imageUrl,
      "author": {
        "@type": "Organization",
        "name": "Tewaw Enterprise"
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white relative">
      <SEO 
        title="Garment Gallery & Uniform Portfolio | Tewaw Enterprise"
        description="Explore Tewaw Enterprise's portfolio showcase of custom cotton apparel, security uniforms, tactical hoodies, school dresses, and industrial workwear manufactured in Kenya."
        canonical="https://tewaw.com/gallery"
        schema={gallerySchema}
      />
      <GlassyBackground />
      <Navbar 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      <BottomNav onOpenCart={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />

      <main className="pt-[106px] pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#269453]/10 rounded-full mb-4"
            >
              <Camera className="w-4 h-4 text-brand-green" />
              <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em]">Our Portfolio</span>
            </motion.div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-black text-brand-blue uppercase tracking-tight mb-4">
              GARMENT GALLERY • <span className="text-brand-green italic">VISUAL SHOWCASE</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              A curated collection of our finest stitching works, client projects, and artisanal highlights.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {images.map((img, i) => (
                <motion.figure
                  key={img.id}
                  itemScope
                  itemType="https://schema.org/ImageObject"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedImage(img)}
                  className="group relative aspect-square rounded-[28px] sm:rounded-[36px] overflow-hidden cursor-pointer shadow-xs hover:shadow-xl transition-all duration-500 border border-slate-100 m-0"
                >
                  <img 
                    itemProp="contentUrl"
                    referrerPolicy="no-referrer"
                    src={getGalleryImageUrl(img, 600)} 
                    alt={`Tewaw Enterprise - ${img.title} (${img.category || 'Garment Showcase'})`}
                    title={`Tewaw Enterprise - ${img.title}`}
                    className="w-full h-full object-cover object-center scale-110 group-hover:scale-125 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                    }}
                  />
                  <meta itemProp="name" content={`Tewaw Enterprise - ${img.title}`} />
                  <meta itemProp="caption" content={img.description || img.title} />
                  <figcaption className="sr-only">Tewaw Enterprise - {img.title} ({img.category || 'Garment'})</figcaption>
                  <div className="absolute inset-0 bg-brand-blue/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
                    <Eye className="w-8 h-8 text-white mb-2" />
                    <h3 className="text-white font-bold leading-tight uppercase tracking-tight">{img.title}</h3>
                    <p className="text-white/70 text-[10px] font-black uppercase mt-2 tracking-widest">{img.category || 'Tewaw Stitch'}</p>
                  </div>
                </motion.figure>
              ))}
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Camera className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-300 uppercase">Gallery is empty</h3>
              <p className="text-slate-400 mt-2 italic">We're currently stitching some beautiful visuals for you.</p>
            </div>
          )}
        </div>
      </main>

      <Footer onOpenLegal={setActiveLegal} />

      <AnimatePresence>
        {activeLegal && (
          <LegalView type={activeLegal} onClose={() => setActiveLegal(null)} />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[2000] bg-brand-blue/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-8 right-8 w-12 h-12 bg-brand-green hover:bg-[#1E7642] text-white shadow-lg shadow-brand-green/40 rounded-full flex items-center justify-center transition-all z-50 transform hover:rotate-90 hover:scale-110"
            onClick={() => setSelectedImage(null)}
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full md:w-2/3 h-64 sm:h-80 md:h-auto bg-slate-100 overflow-hidden shrink-0 relative">
               <img 
                 referrerPolicy="no-referrer"
                 src={getGalleryImageUrl(selectedImage, 1000)} 
                 alt={`Tewaw Enterprise - ${selectedImage.title}`}
                 title={`Tewaw Enterprise - ${selectedImage.title}`}
                 className="w-full h-full object-cover object-center scale-110 sm:scale-105 transition-transform duration-500"
                 decoding="async"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                 }}
               />
            </div>
            <div className="md:w-1/3 p-8 md:p-12 flex flex-col justify-center">
               <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                 {selectedImage.category || 'Portfolio Item'}
               </span>
               <h2 className="text-xl md:text-2xl font-display font-black text-brand-blue uppercase tracking-tight mb-6">
                 {selectedImage.title}
               </h2>
               <p className="text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2 mb-8">
                 {selectedImage.description || 'No description provided for this work.'}
               </p>
               <div className="space-y-4">
                 {selectedImage.linkUrl && (
                   <a 
                     href={selectedImage.linkUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="block w-full py-4 bg-brand-orange text-white text-center rounded-2xl font-black uppercase tracking-widest text-[10px] hover:translate-x-1 hover:-translate-y-1 transition-all brand-edge-blue"
                   >
                     Visit Link
                   </a>
                 )}
                 <button 
                   onClick={() => setSelectedImage(null)}
                   className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-orange transition-all"
                 >
                   Close Viewer
                 </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}

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
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-brand-blue" />
                  <h2 className="text-lg font-display font-black text-brand-blue uppercase italic">Your Stash</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 brand-edge-orange">
                      <img 
                        referrerPolicy="no-referrer"
                        src={getOptimizedImageUrl(item.imageUrl, 200, 75)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={item.name} 
                        loading="lazy" 
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-brand-blue truncate">{item.name}</h4>
                      <p className="text-xs text-brand-orange font-black uppercase tracking-widest mb-2">{item.category}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-brand-blue transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black text-brand-blue min-w-[20px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-brand-blue transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-brand-blue text-sm">KES {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <p className="font-display font-black text-2xl uppercase tracking-tight text-slate-200 mb-6">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                    <span className="text-xl font-mono font-black text-brand-blue">KES {cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={isSubmittingOrder}
                    className="w-full py-5 bg-brand-blue text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-blue/20 hover:bg-brand-orange transition-all flex items-center justify-center gap-3 brand-edge-orange border-none"
                  >
                    {isSubmittingOrder ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Checkout via WhatsApp <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
