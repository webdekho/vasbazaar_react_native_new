import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'serviceUsage';

/**
 * Service Usage Tracker Utility
 * Tracks service usage for dynamic ordering
 */

// Load service usage from AsyncStorage
export const loadServiceUsage = async () => {
  try {
    const storedUsage = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedUsage) {
      const parsedUsage = JSON.parse(storedUsage);
      // console.log('📊 Loaded service usage:', parsedUsage);
      return parsedUsage;
    }
    return {};
  } catch (error) {
    console.error('❌ Error loading service usage:', error);
    return {};
  }
};

// Save service usage to AsyncStorage
export const saveServiceUsage = async (usage) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    // console.log('💾 Saved service usage:', usage);
  } catch (error) {
    console.error('❌ Error saving service usage:', error);
  }
};

// Track service usage
export const trackServiceUsage = async (serviceId, serviceName) => {
  try {
    const currentUsage = await loadServiceUsage();
    const timestamp = Date.now();
    
    // Create a unique key - prefer ID, fallback to name
    const key = serviceId || serviceName?.toLowerCase().replace(/\s+/g, '_');
    
    if (!key) {
      console.warn('⚠️ No valid service identifier provided for tracking');
      return;
    }
    
    const updatedUsage = {
      ...currentUsage,
      [key]: {
        id: serviceId,
        name: serviceName,
        lastUsed: timestamp,
        useCount: (currentUsage[key]?.useCount || 0) + 1,
        firstUsed: currentUsage[key]?.firstUsed || timestamp
      }
    };
    
    await saveServiceUsage(updatedUsage);
    // console.log(`🎯 Tracked usage for "${serviceName}" (${key}):`, {
    //   useCount: updatedUsage[key].useCount,
    //   lastUsed: new Date(updatedUsage[key].lastUsed).toLocaleString()
    // });
    
    return updatedUsage;
  } catch (error) {
    console.error('❌ Error tracking service usage:', error);
    return null;
  }
};

// Sort services based on usage (most recently used first)
export const sortServicesByUsage = (services, serviceUsage = {}) => {
  if (!services || services.length === 0) return services;
  
  const sortedServices = [...services].sort((a, b) => {
    // Try different keys to find usage data
    const aKeys = [a.id, a.title?.toLowerCase().replace(/\s+/g, '_'), a.title?.toLowerCase()];
    const bKeys = [b.id, b.title?.toLowerCase().replace(/\s+/g, '_'), b.title?.toLowerCase()];
    
    const aUsage = aKeys.find(key => serviceUsage[key]) ? serviceUsage[aKeys.find(key => serviceUsage[key])] : null;
    const bUsage = bKeys.find(key => serviceUsage[key]) ? serviceUsage[bKeys.find(key => serviceUsage[key])] : null;
    
    // If both have usage data, sort by last used time (most recent first)
    if (aUsage && bUsage) {
      return bUsage.lastUsed - aUsage.lastUsed;
    }
    
    // If only one has usage data, prioritize it
    if (aUsage && !bUsage) return -1;
    if (!aUsage && bUsage) return 1;
    
    // If neither has usage data, maintain original order
    return 0;
  });
  
  const usedServices = sortedServices.filter(service => {
    const keys = [service.id, service.title?.toLowerCase().replace(/\s+/g, '_'), service.title?.toLowerCase()];
    return keys.some(key => serviceUsage[key]);
  });
  
  const unusedServices = sortedServices.filter(service => {
    const keys = [service.id, service.title?.toLowerCase().replace(/\s+/g, '_'), service.title?.toLowerCase()];
    return !keys.some(key => serviceUsage[key]);
  });
  
  // console.log(`🔄 Sorted ${services.length} services: ${usedServices.length} used, ${unusedServices.length} unused`);
  if (usedServices.length > 0) {
    // console.log('📈 Most used services:', usedServices.slice(0, 3).map(s => s.title));
  }
  
  return sortedServices;
};

// Get service usage statistics
export const getServiceUsageStats = async () => {
  try {
    const usage = await loadServiceUsage();
    const services = Object.entries(usage).map(([key, data]) => ({
      key,
      ...data,
      lastUsedDate: new Date(data.lastUsed),
      firstUsedDate: new Date(data.firstUsed)
    }));
    
    // Sort by use count descending
    services.sort((a, b) => b.useCount - a.useCount);
    
    return {
      totalServices: services.length,
      totalUsage: services.reduce((sum, s) => sum + s.useCount, 0),
      mostUsed: services[0] || null,
      recentlyUsed: services.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5),
      services
    };
  } catch (error) {
    console.error('❌ Error getting service usage stats:', error);
    return null;
  }
};

// Clear service usage data (for testing or reset)
export const clearServiceUsage = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared service usage data');
    return true;
  } catch (error) {
    console.error('❌ Error clearing service usage:', error);
    return false;
  }
};