import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { DEFAULT_PRODUCTS, Product } from '../data/defaultProducts';
import { CATEGORIES } from '../constants';

let isSeeding = false;
let isCategoriesSeeding = false;

export interface SyncResult {
  total: number;
  synced: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Removes all mock/stock unsplash product images from Firestore to retain only real user-uploaded products & images.
 */
export async function removeMockProductImagesFromFirestore(): Promise<{ cleaned: number; deleted: number }> {
  let cleaned = 0;
  let deleted = 0;
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    for (const d of snapshot.docs) {
      const data = d.data();
      const img = data.imageUrl || '';
      const isUnsplash = typeof img === 'string' && img.includes('images.unsplash.com');
      
      // If it has mock unsplash image
      if (isUnsplash) {
        // If it has no user-customized attributes or is an old default mock ID with no custom uploaded additional images
        const hasCustomImages = Array.isArray(data.additionalImages) && data.additionalImages.some((ai: string) => ai && !ai.includes('images.unsplash.com'));
        
        if (!hasCustomImages && (!data.updatedBy || data.isMock)) {
          // Delete uncustomized mock product
          await deleteDoc(doc(db, 'products', d.id));
          deleted++;
        } else {
          // Clear mock image url to retain the user's custom product record
          await updateDoc(doc(db, 'products', d.id), {
            imageUrl: '',
            additionalImages: (data.additionalImages || []).filter((ai: string) => !ai.includes('images.unsplash.com')),
            updatedAt: serverTimestamp()
          });
          cleaned++;
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning mock product images from Firestore:', err);
  }
  return { cleaned, deleted };
}

/**
 * Ensures all standard products are seeded into Firestore if not present (only if DEFAULT_PRODUCTS is populated).
 */
export async function ensureProductsSeeded(): Promise<void> {
  // Do not seed mock products; respect only uploaded products
  if (DEFAULT_PRODUCTS.length === 0) return;
  if (isSeeding) return;
  if (!auth.currentUser) return;

  isSeeding = true;
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const existingMap = new Map(snapshot.docs.map(d => [d.id, d.data()]));

    const missingProducts = DEFAULT_PRODUCTS.filter(p => !existingMap.has(p.id));

    if (missingProducts.length > 0) {
      for (const item of missingProducts) {
        const docRef = doc(db, 'products', item.id);
        await setDoc(docRef, {
          ...item,
          status: 'active',
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (error: any) {
    console.debug('Product sync verification:', error?.message || error);
  } finally {
    isSeeding = false;
  }
}

/**
 * Ensures standard categories exist in Firestore if needed.
 */
export async function ensureCategoriesSeeded(): Promise<void> {
  if (isCategoriesSeeding) return;
  if (!auth.currentUser) return;

  isCategoriesSeeding = true;

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    if (snapshot.empty) {
      for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        const docRef = doc(db, 'categories', cat.id);
        await setDoc(docRef, {
          id: cat.id,
          title: cat.title,
          description: cat.description,
          image: cat.image,
          items: cat.items || [],
          specialties: cat.specialties || [],
          materials: cat.materials || [],
          order: i + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (error: any) {
    console.debug('Categories synchronization notice:', error?.message || error);
  } finally {
    isCategoriesSeeding = false;
  }
}

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'ELITE CRAFT',
    subtitle: 'PREMIUM MANUFACTURING',
    description: 'Kenyan craftsmanship meets global standards. We elevate every stitch with precision.',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Explore Collection',
    buttonLink: '#categories',
    badge: '100% Kenyan',
    status: 'active',
    order: 1
  },
  {
    id: 'slide-2',
    title: 'NAIROBI BORN',
    subtitle: 'BORN IN NAIROBI',
    description: 'Locally produced, globally inspired. Celebrating our roots through premium construction.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Our Story',
    buttonLink: '#about',
    badge: 'Authentic Quality',
    status: 'active',
    order: 2
  },
  {
    id: 'slide-3',
    title: 'PURE FLEECE',
    subtitle: 'TACTICAL QUALITY',
    description: 'The gold standard of African manufacturing. Exceptional quality you can feel.',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Order Custom',
    buttonLink: 'https://wa.me/254736619688',
    badge: 'Global Standards',
    status: 'active',
    order: 3
  }
];

let isSlidersSeeding = false;

/**
 * Ensures standard hero slides are seeded into Firestore if needed.
 */
export async function ensureSlidersSeeded(): Promise<void> {
  if (isSlidersSeeding) return;
  if (!auth.currentUser) return;

  isSlidersSeeding = true;
  try {
    const snapshot = await getDocs(collection(db, 'sliders'));
    if (snapshot.empty) {
      for (const slide of DEFAULT_HERO_SLIDES) {
        const docRef = doc(db, 'sliders', slide.id);
        await setDoc(docRef, {
          ...slide,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (error: any) {
    console.debug('Sliders synchronization notice:', error?.message || error);
  } finally {
    isSlidersSeeding = false;
  }
}
