import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image, Platform } from 'react-native';
import { getCachedIcon } from '../services/cache/iconCache';

// Platform-specific SVG imports
let SvgXml;
if (Platform.OS !== 'web') {
  try {
    const svgModule = require('react-native-svg');
    SvgXml = svgModule.SvgXml;
  } catch (error) {
    console.warn('react-native-svg not available, using Image fallback');
  }
}

/**
 * CachedSvgImage - A cached version of SvgImage that stores icons locally
 * 
 * Features:
 * - Automatic caching of SVG content and regular images
 * - Cache-first loading with network fallback
 * - Platform-specific rendering (web vs mobile)
 * - Loading and error states
 * - Memory optimization
 * 
 * @param {Object} props
 * @param {string} props.uri - The icon URL to load and cache
 * @param {Object} props.style - Style object for the image
 * @param {Object} props.fallbackIcon - Fallback icon component or source
 * @param {boolean} props.showLoading - Whether to show loading indicator (default: true)
 */
export default function CachedSvgImage({ 
  uri, 
  style = {}, 
  fallbackIcon = null,
  showLoading = true 
}) {
  const [iconData, setIconData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCachedIcon = async () => {
      if (!uri || typeof uri !== 'string') {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // Try to get cached icon
        const cached = await getCachedIcon(uri);

        if (isMounted) {
          if (cached) {
            setIconData(cached);
            console.log(`CachedSvgImage - Loaded ${cached.type} from cache: ${uri}`);
          } else {
            console.warn(`CachedSvgImage - Failed to load icon: ${uri}`);
            setError(true);
          }
        }
      } catch (err) {
        console.error('CachedSvgImage - Load error:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCachedIcon();

    return () => {
      isMounted = false;
    };
  }, [uri]);

  // Show loading state
  if (loading && showLoading) {
    return (
      <View style={[
        style, 
        { 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#f0f0f0' 
        }
      ]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  // Show error state or fallback
  if (error || !iconData) {
    if (fallbackIcon) {
      return fallbackIcon;
    }
    
    // Default fallback - try to load as regular image
    return (
      <Image 
        source={{ uri }} 
        style={style} 
        resizeMode="contain"
        onError={() => console.warn(`CachedSvgImage - Image fallback failed: ${uri}`)}
      />
    );
  }

  // Render based on icon type and platform
  if (iconData.type === 'svg') {
    return renderSvg(iconData.content, style);
  } else {
    return (
      <Image 
        source={{ uri: iconData.content }} 
        style={style} 
        resizeMode="contain" 
      />
    );
  }
}

/**
 * Render SVG content based on platform
 */
const renderSvg = (svgContent, style) => {
  if (Platform.OS === 'web') {
    return renderSvgWeb(svgContent, style);
  } else {
    return renderSvgMobile(svgContent, style);
  }
};

/**
 * Render SVG on web platform using dangerouslySetInnerHTML
 */
const renderSvgWeb = (svgContent, style) => {
  try {
    // Extract viewBox for proper scaling
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    const existingViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
    
    // Clean and prepare SVG for web
    let cleanSvg = svgContent
      .replace(/width="[^"]*"/g, '')
      .replace(/height="[^"]*"/g, '')
      .replace(/viewBox="[^"]*"/g, '')
      .replace(/<svg/, `<svg width="100%" height="100%" viewBox="${existingViewBox}" preserveAspectRatio="xMidYMid meet"`);
    
    return (
      <div
        style={{
          width: style.width || 24,
          height: style.height || 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );
  } catch (error) {
    console.error('CachedSvgImage - Web SVG render error:', error);
    return (
      <View style={[style, { backgroundColor: '#f0f0f0' }]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }
};

/**
 * Render SVG on mobile platform using react-native-svg
 */
const renderSvgMobile = (svgContent, style) => {
  if (!SvgXml) {
    // Fallback to placeholder if react-native-svg is not available
    return (
      <View style={[
        style, 
        { 
          backgroundColor: '#f0f0f0', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }
      ]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  try {
    return (
      <SvgXml 
        xml={svgContent} 
        width={style.width || 24} 
        height={style.height || 24}
        style={style}
      />
    );
  } catch (error) {
    console.error('CachedSvgImage - Mobile SVG render error:', error);
    return (
      <View style={[style, { backgroundColor: '#f0f0f0' }]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }
};

/**
 * Preload icons for better performance
 * Call this when you know which icons will be needed
 */
export const preloadServiceIcons = async (services) => {
  if (!Array.isArray(services)) return;
  
  const iconUrls = services
    .map(service => service.icon || service.icon?.uri)
    .filter(Boolean)
    .filter(url => typeof url === 'string' && url.startsWith('http'));
  
  if (iconUrls.length === 0) return;
  
  console.log(`CachedSvgImage - Preloading ${iconUrls.length} service icons`);
  
  // Use require instead of dynamic import to avoid module resolution issues
  const { preloadIcons } = require('../services/cache/iconCache');
  const results = await preloadIcons(iconUrls);
  
  const successful = results.filter(r => r.value?.success).length;
  console.log(`CachedSvgImage - Successfully preloaded ${successful}/${iconUrls.length} icons`);
  
  return results;
};