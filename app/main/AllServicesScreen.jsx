import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MainHeader from '@/components/MainHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllServicesForScreen } from '../../services';
import CachedSvgImage from '../../components/CachedSvgImage';
import { loadServiceUsage, trackServiceUsage, sortServicesByUsage } from '../../utils/serviceUsageTracker';

// Helper function to detect SVG URL
const isSvg = (url) => url?.toLowerCase().endsWith('.svg');


export default function AllServicesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContents, setSvgContents] = useState({});
  const [redirectedFrom, setRedirectedFrom] = useState('');
  const [serviceUsage, setServiceUsage] = useState({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Handle URL redirects and refresh usage data on focus
  useFocusEffect(
    useCallback(() => {
      const handleUrlRedirect = () => {
        // Check if coming from a specific URL pattern
        const currentUrl = window?.location?.href || '';
        
        // Handle redirect from Home/Tabs?screen=history pattern
        if (currentUrl.includes('/Home/Tabs') || currentUrl.includes('screen=')) {
          const urlParams = new URLSearchParams(window?.location?.search || '');
          const screenParam = urlParams.get('screen');
          
          if (screenParam) {
            // Auto-search for the screen parameter
            setSearchText(screenParam);
            setRedirectedFrom(screenParam);
          }
        }
      };

      // Refresh usage data when screen comes into focus
      const refreshData = async () => {
        await loadUsageData();
        console.log('🔄 AllServices - Refreshed usage data on focus');
      };

      handleUrlRedirect();
      refreshData();
    }, [])
  );

  // Handle direct navigation from URL
  const handleDirectNavigation = (screenName) => {
    const screenKey = screenName.toLowerCase();
    
    // Navigation mapping for all screens
    const navigationMap = {
      // Tab screens
      'history': () => router.push('/(tabs)/history'),
      'profile': () => router.push('/(tabs)/profile'),
      'home': () => router.push('/(tabs)/home'),
      'wallet': () => router.push('/(tabs)/wallet'),
      
      // Direct screens
      'notification': () => router.push('/main/NotificationScreen'),
      'help': () => router.push('/main/HelpScreen'),
    };
    
    const navFunction = navigationMap[screenKey];
    if (navFunction) {
      navFunction();
    } else {
      // Fallback - try to navigate directly using the screen name
      try {
        router.push(`/main/${screenName}Screen`);
      } catch (error) {
        // If direct navigation fails, go to Home
        router.push('/(tabs)/home');
      }
    }
  };

  // Navigation items from drawer and other screens
  const navigationItems = [
    { id: 'nav-1', name: 'Transaction History', route: 'history', icon: 'history', type: 'navigation' },
    { id: 'nav-2', name: 'Profile', route: 'profile', icon: 'user', type: 'navigation' },
    { id: 'nav-3', name: 'Notification', route: 'notification', icon: 'bell', type: 'navigation' },
    { id: 'nav-4', name: 'Help & Support', route: 'help', icon: 'question-circle', type: 'navigation' },
    { id: 'nav-5', name: 'Wallet', route: 'wallet', icon: 'credit-card', type: 'navigation' },
    { id: 'nav-6', name: 'Home', route: 'home', icon: 'home', type: 'navigation' },
  ];

  // Related search terms mapping
  const relatedTerms = {
    'history': ['transaction', 'transactions', 'payment', 'payments', 'record', 'records', 'log'],
    'profile': ['account', 'user', 'settings', 'personal', 'info', 'information'],
    'notification': ['alert', 'alerts', 'notice', 'update', 'updates', 'message', 'messages'],
    'help': ['support', 'assist', 'assistance', 'faq', 'contact', 'issue', 'problem'],
    'wallet': ['balance', 'money', 'cash', 'payment', 'fund'],
    'mobile': ['phone', 'prepaid', 'recharge', 'topup', 'top-up'],
    'dth': ['dish', 'tv', 'cable', 'television', 'set top box', 'satellite'],
    'transaction': ['history', 'payment', 'record', 'log'],
  };

  // Default/fallback services
  const defaultServices = [
    {
      id: '1',
      title: 'Prepaid',
      icon: 'https://reebootz.s3.amazonaws.com/service_icon_2.svg',
      description: 'Mobile recharge',
      color: '#0EA5E9',
    },
    {
      id: '2', 
      title: 'DTH',
      icon: 'https://reebootz.s3.amazonaws.com/service_icon_2.svg',
      description: 'DTH recharge',
      color: '#DC2626',
    },
    {
      id: '3',
      title: 'Postpaid',
      icon: 'https://reebootz.s3.amazonaws.com/service_icon_2.svg', 
      description: 'Pay your postpaid bills',
      color: '#4F46E5',
    },
    {
      id: '4',
      title: 'Electricity',
      icon: 'https://reebootz.s3.amazonaws.com/service_icon_2.svg',
      description: 'Electricity bill payment',
      color: '#F59E0B',
    }
  ];

  // Load service usage data
  const loadUsageData = async () => {
    const usage = await loadServiceUsage();
    setServiceUsage(usage);
    // console.log('🔄 AllServices - Loaded service usage:', Object.keys(usage).length, 'services');
  };

  const getServices = async () => {
    setIsLoading(true);
    try {
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        console.log('No session token found, using default services');
        setServices(defaultServices);
        return;
      }

      const response = await getAllServicesForScreen(sessionToken);
      console.log('AllServices API Response:', response);
      console.log('AllServices Response details:', {
        hasResponse: !!response,
        status: response?.status,
        hasData: !!response?.data,
        dataIsArray: Array.isArray(response?.data),
        dataLength: response?.data?.length,
        firstService: response?.data?.[0]
      });
      
      if (response?.status === 'success' && response?.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('AllServices setting services:', response.data.length);
        const sortedApiServices = sortServicesByUsage(response.data, serviceUsage);
        setServices(sortedApiServices);

        // Preload icons using the cache system
        const iconUrls = response.data
          .map(item => item.icon)
          .filter(Boolean)
          .filter(url => typeof url === 'string' && url.startsWith('http'));
        
        if (iconUrls.length > 0) {
          console.log(`AllServices - Preloading ${iconUrls.length} service icons`);
          const { preloadIcons } = require('../../services/cache/iconCache');
          const results = await preloadIcons(iconUrls);
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          console.log(`AllServices - Successfully preloaded ${successful}/${iconUrls.length} icons`);
        }
      } else {
        console.log('AllServices API failed or no data, using default services. Reason:', {
          status: response?.status,
          hasData: !!response?.data,
          dataIsArray: Array.isArray(response?.data),
          dataLength: response?.data?.length || 0,
          message: response?.message
        });
        const sortedDefaultServices = sortServicesByUsage(defaultServices, serviceUsage);
        setServices(sortedDefaultServices);
      }
    } catch (error) {
      console.error('Services fetch error, using default services:', error);
      const sortedDefaultServices = sortServicesByUsage(defaultServices, serviceUsage);
      setServices(sortedDefaultServices);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
    getServices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sort services when usage data changes
  useEffect(() => {
    if (services.length > 0 && Object.keys(serviceUsage).length > 0) {
      const resorted = sortServicesByUsage(services, serviceUsage);
      setServices(resorted);
      // console.log('🔄 AllServices - Re-sorted services based on updated usage');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceUsage]);

  // Enhanced search function
  const searchItems = (item, query) => {
    const lowercaseQuery = query.toLowerCase().trim();
    const itemName = (item.title || item.name || '').toLowerCase();
    
    // Direct partial match
    if (itemName.includes(lowercaseQuery)) {
      return true;
    }
    
    // Check if query matches any related terms
    for (const [key, terms] of Object.entries(relatedTerms)) {
      if (key.includes(lowercaseQuery) || terms.some(term => term.includes(lowercaseQuery))) {
        // Check if the item name contains the key or any of its related terms
        if (itemName.includes(key) || terms.some(term => itemName.includes(term))) {
          return true;
        }
      }
    }
    
    // Check if any related terms of the item match the query
    const itemWords = itemName.split(/\s+/);
    for (const word of itemWords) {
      const relatedList = relatedTerms[word] || [];
      if (relatedList.some(term => term.includes(lowercaseQuery))) {
        return true;
      }
    }
    
    return false;
  };

  // Combine services and navigation items for search
  const allItems = [
    ...services.map(service => ({ ...service, type: 'service' })),
    ...navigationItems
  ];

  const filteredItems = searchText
    ? allItems.filter(item => searchItems(item, searchText))
    : services.map(service => ({ ...service, type: 'service' }));

  const handlePress = async (item) => {
    if (item.type === 'navigation') {
      // Track navigation usage as well
      const updatedUsage = await trackServiceUsage(`nav-${item.route}`, `Navigate to ${item.name}`);
      if (updatedUsage) {
        setServiceUsage(updatedUsage);
      }
      // Use the same navigation logic as handleDirectNavigation
      handleDirectNavigation(item.route);
    } else {
      // Handle service items
      const serviceName = item.title; // API से title में serviceName आती है
      const serviceId = item.id;

      // Track service usage before navigation
      const updatedUsage = await trackServiceUsage(serviceId, serviceName);
      if (updatedUsage) {
        setServiceUsage(updatedUsage);
      }

      if (serviceName === 'Prepaid' || serviceName === 'Recharge') {
        router.push(`/main/prepaid/ContactListScreen?service=prepaid&serviceId=${serviceId}&serviceName=${serviceName}`);
      } else if (serviceName === 'DTH') {
        router.push(`/main/dth/DthListScreen?service=dth&serviceId=${serviceId}&serviceName=${serviceName}`);
      } else {
        router.push(`/main/biller/BillerListScreen?service=postpaid&serviceId=${serviceId}&serviceName=${serviceName}`);
      }
    }
  };

  const renderServiceItem = ({ item, index }) => {
    const isNavigation = item.type === 'navigation';
    const displayName = item.title || item.name;
    
    return (
      <View style={[styles.serviceCard, isNavigation && styles.navigationCard]}>
        <Pressable
          style={styles.serviceContent}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.iconContainer, isNavigation && styles.navigationIconContainer]}>
            {isNavigation ? (
              <FontAwesome name={item.icon} color="#000" size={24} />
            ) : isSvg(item.icon) ? (
              <CachedSvgImage uri={item.icon} style={{ width: 48, height: 48 }} />
            ) : (
              <Image source={{ uri: item.icon }} style={styles.serviceIcon} />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.serviceName, isNavigation && styles.navigationName]}>
              {displayName}
            </Text>
            <Text style={styles.serviceDescription}>
              {isNavigation 
                ? `Navigate to ${displayName.toLowerCase()}`
                : `Tap to access ${displayName.toLowerCase()} services`
              }
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <MainHeader 
        title="All Services"
        showBack={true}
        showSearch={false}
        showNotification={false}
      />
      
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          isSearchFocused && styles.searchInputContainerFocused
        ]}>
          <FontAwesome name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search services, history, profile, wallet..."
            onChangeText={setSearchText}
            value={searchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={[
              styles.searchInput,
              Platform.OS === 'web' && { outlineStyle: 'none' }
            ]}
            placeholderTextColor="#999"
            selectionColor="#000000"
            underlineColorAndroid="transparent"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} style={styles.clearButton}>
              <FontAwesome name="times" size={16} color="#999" />
            </Pressable>
          )}
        </View>

        {redirectedFrom && (
          <View style={styles.redirectNotice}>
            <Text style={styles.redirectText}>
              🔄 Redirected from: {redirectedFrom}
            </Text>
            <Pressable
              style={styles.quickNavButton}
              onPress={() => handleDirectNavigation(redirectedFrom)}
            >
              <Text style={styles.quickNavText}>Go to {redirectedFrom} →</Text>
            </Pressable>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderServiceItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubText}>
                Try searching with different keywords like "history", "recharge", or "profile"
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.listContainer,
            filteredItems.length === 0 && styles.emptyListContainer
          ]}
          style={styles.flatList}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInputContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  flatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        paddingBottom: 20,
      },
    }),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: '#e8e8e8',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 22,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  navigationCard: {
    backgroundColor: '#f3e8ff',
    borderColor: '#e0d4f7',
  },
  navigationIconContainer: {
    backgroundColor: '#fff',
    borderColor: '#e0d4f7',
  },
  navigationName: {
    color: '#8400E5',
  },
  redirectNotice: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2196f3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    flex: 1,
  },
  quickNavButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  quickNavText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});