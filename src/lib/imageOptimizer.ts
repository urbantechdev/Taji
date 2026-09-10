/**
 * Image Optimization & Compression Utility
 * Automatically converts raw camera/phone photos and bulky PNG/JPG files to ultra-lightweight WebP/JPEG formats.
 * Includes instant in-memory image preloading and warm-cache management.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

// In-memory image cache set to prevent redundant fetches and keep decoded bitmaps ready in RAM
const preloadedImageUrls = new Set<string>();

/**
 * Preload a single image URL into browser cache and memory.
 */
export function preloadImage(url: string, priority: 'high' | 'auto' | 'low' = 'auto'): Promise<void> {
  if (!url || preloadedImageUrls.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    // @ts-ignore
    if (priority === 'high' && 'fetchPriority' in img) {
      // @ts-ignore
      img.fetchPriority = 'high';
    }
    img.decoding = 'async';
    img.onload = () => {
      preloadedImageUrls.add(url);
      resolve();
    };
    img.onerror = () => {
      // Resolve anyway so Promise.all won't block
      resolve();
    };
    img.src = url;
  });
}

/**
 * Preload multiple images in parallel in the background.
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const validUrls = urls.filter(u => u && !preloadedImageUrls.has(u));
  return Promise.all(validUrls.map(u => preloadImage(u)));
}

/**
 * Optimizes an image file (File or Blob) using HTML5 Canvas.
 * Automatically tries WebP with JPEG fallback.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 1200,
    quality = 0.82,
    format = 'image/webp'
  } = options;

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          const fallbackUrl = e.target?.result as string;
          resolve({
            dataUrl: fallbackUrl,
            originalSize,
            compressedSize: originalSize,
            reductionPercentage: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Apply smooth downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let targetFormat = format;
        let dataUrl = canvas.toDataURL(targetFormat, quality);

        // Check if browser actually produced WebP or fell back to png
        if (targetFormat === 'image/webp' && dataUrl.startsWith('data:image/png')) {
          targetFormat = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetFormat, quality);
        }

        // Estimate size in bytes from base64
        const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
        const compressedSize = Math.round((stringLength * 3) / 4);
        const reductionPercentage = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          reductionPercentage,
          width,
          height,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an external image URL (e.g. Unsplash, Pinterest, Cloudinary) by injecting optimized query parameters.
 */
export function getOptimizedImageUrl(url: string, maxWidth = 800, quality = 80): string {
  if (!url) return '';
  
  // Base64 or local images
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }

  try {
    // Unsplash
    if (url.includes('images.unsplash.com')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('w', String(maxWidth));
      urlObj.searchParams.set('q', String(quality));
      return urlObj.toString();
    }

    // Cloudinary
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${maxWidth}/`);
    }

    // Pinimg (Pinterest)
    if (url.includes('i.pinimg.com')) {
      if (maxWidth <= 400) {
        return url.replace(/\/1200x\/|\/736x\/|\/564x\/|\/originals\//, '/474x/');
      } else if (maxWidth <= 736) {
        return url.replace(/\/1200x\/|\/474x\/|\/564x\/|\/originals\//, '/736x/');
      }
    }
  } catch (err) {
    // Return original if parsing fails
    return url;
  }

  return url;
}

/**
 * Human-readable byte formatter.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

