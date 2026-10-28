/**
 * Persistent Image Storage Service for BrandPilot
 * Uses IndexedDB to store creative image Blobs keyed by assetId,
 * avoiding localStorage quota limits and bloat.
 * Maintains an in-memory cache of active Object URLs.
 */

const DB_NAME = 'brandpilot_db';
const DB_VERSION = 1;
const STORE_NAME = 'asset_images';

// In-memory cache of assetId -> objectUrl
const urlCache = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'assetId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Could not open IndexedDB, falling back to memory cache.');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB initialization error:', err);
      resolve(null);
    }
  });
}

/**
 * Checks whether a previewUrl string represents a real, loadable image.
 * Distinguishes real images from placeholder tags (e.g. 'campaign-asset-custom', 'sms-preview').
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Placeholder tags are NOT valid image URLs
  if (
    trimmed === 'campaign-asset-custom' ||
    trimmed === 'sms-preview' ||
    trimmed === 'push-preview' ||
    trimmed === 'pharma-pdf-preview' ||
    trimmed === 'compliant-preview' ||
    trimmed === 'clinic-brochure' ||
    trimmed === 'website-hero'
  ) {
    return false;
  }

  return (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(trimmed)
  );
}

/**
 * Save an asset's image Blob in IndexedDB and cache its object URL.
 * Returns the active Object URL.
 */
export async function saveAssetImage(assetId: string, fileOrBlob: Blob | File): Promise<string> {
  // Revoke existing URL if any
  const existingUrl = urlCache.get(assetId);
  if (existingUrl && existingUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(existingUrl);
    } catch {
      // Ignore revoke errors
    }
  }

  const objectUrl = URL.createObjectURL(fileOrBlob);
  urlCache.set(assetId, objectUrl);

  const db = await openDatabase();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record = {
          assetId,
          blob: fileOrBlob,
          mimeType: fileOrBlob.type || 'image/png',
          filename: 'name' in fileOrBlob ? (fileOrBlob as File).name : 'creative.png',
          updatedAt: new Date().toISOString()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Failed to persist image in IndexedDB:', e);
    }
  }

  return objectUrl;
}

/**
 * Retrieve the active Object URL for an asset image.
 */
export async function getAssetImage(assetId: string): Promise<string | null> {
  if (urlCache.has(assetId)) {
    return urlCache.get(assetId)!;
  }

  const db = await openDatabase();
  if (!db) return null;

  try {
    const record = await new Promise<{ blob: Blob } | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(assetId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      urlCache.set(assetId, url);
      return url;
    }
  } catch (e) {
    console.warn('Error reading asset image from IndexedDB:', e);
  }

  return null;
}

/**
 * Delete image record for an asset.
 */
export async function deleteAssetImage(assetId: string): Promise<void> {
  const existingUrl = urlCache.get(assetId);
  if (existingUrl && existingUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(existingUrl);
    } catch {}
  }
  urlCache.delete(assetId);

  const db = await openDatabase();
  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(assetId);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  }
}

/**
 * Resolve the image URL for an asset, either from memory, previewUrl, or IndexedDB.
 */
export async function resolveAssetImageUrl(assetId: string, previewUrl?: string): Promise<string | null> {
  // If memory cache has an active URL, use it
  if (urlCache.has(assetId)) {
    return urlCache.get(assetId)!;
  }

  // If previewUrl is a valid non-blob URL (like static /assets/... or data:), use it
  if (previewUrl && isValidImageUrl(previewUrl) && !previewUrl.startsWith('blob:')) {
    return previewUrl;
  }

  // Check IndexedDB
  const stored = await getAssetImage(assetId);
  if (stored) return stored;

  // Fallback to previewUrl if valid
  if (previewUrl && isValidImageUrl(previewUrl)) {
    return previewUrl;
  }

  return null;
}
