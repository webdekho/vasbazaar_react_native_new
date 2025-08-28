import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Icon Cache Service - Caches service icons to prevent repeated API calls
 * 
 * Features:
 * - Stores both SVG content and regular image URLs
 * - Cache expiration management (7 days default)
 * - Memory optimization with size limits
 * - Platform-specific handling for web and mobile
 * - Fallback mechanisms for failed loads
 */

const ICON_CACHE_PREFIX = 'icon_cache_';
const ICON_METADATA_KEY = 'icon_cache_metadata';
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50; // Maximum number of cached icons
const MAX_SVG_SIZE = 100000; // Maximum SVG content size (100KB)

/**
 * Cache metadata structure for tracking cached icons
 */
class IconCacheMetadata {
  constructor() {
    this.icons = {}; // { iconUrl: { cachedAt, size, type, accessed } }
    this.totalSize = 0;
    this.lastCleanup = Date.now();
  }
}

/**
 * Get cache metadata from storage
 */
const getCacheMetadata = async () => {
  try {
    const metadataStr = await AsyncStorage.getItem(ICON_METADATA_KEY);
    if (metadataStr) {
      const metadata = JSON.parse(metadataStr);
      return Object.assign(new IconCacheMetadata(), metadata);
    }
  } catch (error) {
    console.warn('IconCache - Error reading metadata:', error);
  }
  return new IconCacheMetadata();
};

/**
 * Save cache metadata to storage
 */
const saveCacheMetadata = async (metadata) => {
  try {
    await AsyncStorage.setItem(ICON_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('IconCache - Error saving metadata:', error);
  }
};

/**
 * Generate cache key from icon URL
 */
const getCacheKey = (iconUrl) => {
  // Create a simple hash from URL for shorter keys
  const hash = iconUrl.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${ICON_CACHE_PREFIX}${Math.abs(hash)}`;
};

/**
 * Check if cached icon is still valid
 */
const isCacheValid = (cachedAt, duration = DEFAULT_CACHE_DURATION) => {
  return Date.now() - cachedAt < duration;
};

/**
 * Clean up expired cache entries
 */
const cleanupExpiredCache = async (metadata) => {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [iconUrl, cacheInfo] of Object.entries(metadata.icons)) {
    if (!isCacheValid(cacheInfo.cachedAt)) {
      expiredKeys.push(getCacheKey(iconUrl));
      metadata.totalSize -= cacheInfo.size || 0;
      delete metadata.icons[iconUrl];
    }
  }
  
  if (expiredKeys.length > 0) {
    console.log(`IconCache - Removing ${expiredKeys.length} expired icons`);
    await AsyncStorage.multiRemove(expiredKeys);
  }
  
  metadata.lastCleanup = now;
  return metadata;
};

/**
 * Remove least recently used icons to make space
 */
const evictLRU = async (metadata, targetCount = 5) => {
  const sortedIcons = Object.entries(metadata.icons)
    .sort(([,a], [,b]) => (a.accessed || a.cachedAt) - (b.accessed || b.cachedAt));
  
  const toRemove = sortedIcons.slice(0, targetCount);
  const keysToRemove = toRemove.map(([iconUrl]) => getCacheKey(iconUrl));
  
  for (const [iconUrl, cacheInfo] of toRemove) {
    metadata.totalSize -= cacheInfo.size || 0;
    delete metadata.icons[iconUrl];
  }
  
  if (keysToRemove.length > 0) {
    console.log(`IconCache - Evicting ${keysToRemove.length} LRU icons`);
    await AsyncStorage.multiRemove(keysToRemove);
  }
  
  return metadata;
};

/**
 * Fetch and parse SVG content from URL
 */
const fetchSvgContent = async (iconUrl) => {
  try {
    const response = await fetch(iconUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    // Validate SVG content
    if ((contentType?.includes('image/svg+xml') || iconUrl.endsWith('.svg')) &&
        text.includes('<svg') && text.includes('</svg>')) {
      
      // Check size limit
      if (text.length > MAX_SVG_SIZE) {
        console.warn(`IconCache - SVG too large: ${text.length} bytes`);
        return null;
      }
      
      return {
        type: 'svg',
        content: text,
        size: text.length
      };
    }
    
    // For non-SVG images, just store the URL
    return {
      type: 'image',
      content: iconUrl,
      size: iconUrl.length
    };
    
  } catch (error) {
    console.warn(`IconCache - Failed to fetch ${iconUrl}:`, error.message);
    return null;
  }
};

/**
 * Cache an icon from URL
 */
export const cacheIcon = async (iconUrl) => {
  if (!iconUrl || typeof iconUrl !== 'string') return null;
  
  try {
    // Get metadata
    let metadata = await getCacheMetadata();
    
    // Clean up expired entries periodically
    const shouldCleanup = Date.now() - metadata.lastCleanup > 24 * 60 * 60 * 1000; // Daily
    if (shouldCleanup) {
      metadata = await cleanupExpiredCache(metadata);
    }
    
    // Check if already cached and valid
    const existingCache = metadata.icons[iconUrl];
    if (existingCache && isCacheValid(existingCache.cachedAt)) {
      // Update access time
      existingCache.accessed = Date.now();
      await saveCacheMetadata(metadata);
      
      const cacheKey = getCacheKey(iconUrl);
      const cachedContent = await AsyncStorage.getItem(cacheKey);
      
      if (cachedContent) {
        return JSON.parse(cachedContent);
      }
    }
    
    // Fetch new content
    const iconData = await fetchSvgContent(iconUrl);
    if (!iconData) return null;
    
    // Check cache size limits
    if (Object.keys(metadata.icons).length >= MAX_CACHE_SIZE) {
      metadata = await evictLRU(metadata);
    }
    
    // Store in cache
    const cacheKey = getCacheKey(iconUrl);
    const now = Date.now();
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(iconData));
    
    // Update metadata
    metadata.icons[iconUrl] = {
      cachedAt: now,
      accessed: now,
      size: iconData.size,
      type: iconData.type
    };
    metadata.totalSize += iconData.size;
    
    await saveCacheMetadata(metadata);
    
    console.log(`IconCache - Cached ${iconData.type} icon: ${iconUrl}`);
    return iconData;
    
  } catch (error) {
    console.error('IconCache - Cache error:', error);
    return null;
  }
};

/**
 * Get cached icon or fetch if not cached
 */
export const getCachedIcon = async (iconUrl) => {
  if (!iconUrl || typeof iconUrl !== 'string') return null;
  
  try {
    const metadata = await getCacheMetadata();
    const existingCache = metadata.icons[iconUrl];
    
    // Check if cached and valid
    if (existingCache && isCacheValid(existingCache.cachedAt)) {
      const cacheKey = getCacheKey(iconUrl);
      const cachedContent = await AsyncStorage.getItem(cacheKey);
      
      if (cachedContent) {
        // Update access time
        existingCache.accessed = Date.now();
        await saveCacheMetadata(metadata);
        
        return JSON.parse(cachedContent);
      }
    }
    
    // Not cached or expired, fetch and cache
    return await cacheIcon(iconUrl);
    
  } catch (error) {
    console.error('IconCache - Get error:', error);
    return null;
  }
};

/**
 * Preload multiple icons (useful for service lists)
 */
export const preloadIcons = async (iconUrls) => {
  if (!Array.isArray(iconUrls)) return [];
  
  console.log(`IconCache - Preloading ${iconUrls.length} icons`);
  
  const promises = iconUrls.map(async (url) => {
    try {
      const cached = await getCachedIcon(url);
      return { url, cached, success: !!cached };
    } catch (error) {
      return { url, cached: null, success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  
  console.log(`IconCache - Preloaded ${successful}/${iconUrls.length} icons`);
  return results;
};

/**
 * Clear all cached icons
 */
export const clearIconCache = async () => {
  try {
    const metadata = await getCacheMetadata();
    const keysToRemove = Object.keys(metadata.icons).map(url => getCacheKey(url));
    keysToRemove.push(ICON_METADATA_KEY);
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log(`IconCache - Cleared ${keysToRemove.length - 1} cached icons`);
    
    return true;
  } catch (error) {
    console.error('IconCache - Clear error:', error);
    return false;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const metadata = await getCacheMetadata();
    
    return {
      totalIcons: Object.keys(metadata.icons).length,
      totalSize: metadata.totalSize,
      oldestCache: Math.min(...Object.values(metadata.icons).map(i => i.cachedAt)),
      newestCache: Math.max(...Object.values(metadata.icons).map(i => i.cachedAt)),
      lastCleanup: metadata.lastCleanup
    };
  } catch (error) {
    console.error('IconCache - Stats error:', error);
    return null;
  }
};

/**
 * Hook for React components to use cached icons
 */
export const useCachedIcon = (iconUrl) => {
  const [iconData, setIconData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadIcon = async () => {
      if (!iconUrl) {
        setError(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(false);
        
        const cached = await getCachedIcon(iconUrl);
        
        if (isMounted) {
          if (cached) {
            setIconData(cached);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadIcon();
    
    return () => {
      isMounted = false;
    };
  }, [iconUrl]);
  
  return { iconData, loading, error };
};