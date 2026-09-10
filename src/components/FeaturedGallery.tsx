import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getOptimizedImageUrl } from '../lib/imageOptimizer';

export default function FeaturedGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'gallery'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000);
        return timeB - timeA;
      });
      setImages(docs.slice(0, 4));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));
    return () => unsubscribe();
  }, []);

  if (loading && images.length === 0) return null;
  if (!loading && images.length === 0) return null;

  return (
    <section className="py-20 bg-brand-light relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 text-center md:text-left">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#269453]/10 rounded-full mb-4"
            >
              <Camera className="w-4 h-4 text-brand-green" />
              <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em]">Showcase</span>
            </motion.div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-brand-blue uppercase tracking-tight">
              Our <span className="text-brand-green italic">Gallery</span>
            </h2>
          </div>
          <Link 
            to="/gallery"
            className="hidden md:flex px-6 py-3 bg-white text-brand-blue rounded-xl font-bold uppercase tracking-widest text-[10px] items-center gap-2 border border-slate-200 hover:bg-brand-blue hover:text-white transition-all brand-edge-green"
          >
            View Full Gallery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-500 border border-slate-100 block cursor-pointer"
            >
              <Link to="/gallery">
                <img 
                  referrerPolicy="no-referrer"
                  src={getOptimizedImageUrl(img.imageUrl, 600, 80)} 
                  alt={img.title}
                  className="w-full h-full object-cover object-center scale-110 group-hover:scale-125 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-brand-blue/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
                  <Eye className="w-8 h-8 text-white mb-2" />
                  <h3 className="text-white font-bold leading-tight uppercase tracking-tight break-words line-clamp-2">{img.title}</h3>
                  <p className="text-white/70 text-[10px] font-black uppercase mt-2 tracking-widest">{img.category || 'Portfolio'}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/gallery"
            className="inline-flex px-8 py-4 bg-brand-green text-white rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-2 w-full hover:bg-brand-blue transition-all"
          >
            View Full Gallery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
