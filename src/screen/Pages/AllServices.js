import CommonHeader2 from '../../components/CommoHedder2';
import { styles2 } from '../../components/Css';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from '../../Services/ApiServices';
import { useFocusEffect } from '@react-navigation/native';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Card, List, Searchbar } from 'react-native-paper';
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

// Helper function to detect SVG URL
const isSvg = (url) => url?.toLowerCase().endsWith('.svg');

// Reusable SVG Image component
const SvgImage = ({ uri, style }) => {
  const [svgXml, setSvgXml] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(uri + cacheBuster);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('image/svg+xml') || uri.endsWith('.svg')) {
          const text = await response.text();
          console.log('✅ AllServices SVG fetched:', uri.substring(0, 50) + '...', 'Length:', text.length);
          
          // Validate SVG content
          if (text.includes('<svg') && text.includes('</svg>')) {
            setSvgXml(text);
            console.log('✅ AllServices Valid SVG content detected');
          } else {
            console.warn('⚠️ AllServices Invalid SVG content, falling back to Image');
            setError(true);
          }
        } else {
          console.log('ℹ️ AllServices Not an SVG, using Image component:', uri);
          setError(true);
        }
      } catch (err) {
        console.error('AllServices SVG Load Error:', uri, err.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (uri && uri.trim()) {
      fetchSvg();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [uri]);

  // Platform-specific rendering
  if (Platform.OS === 'web') {
    if (loading) {
      return (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      );
    }
    
    if (svgXml) {
      // Extract existing viewBox or create a default one
      const viewBoxMatch = svgXml.match(/viewBox="([^"]+)"/);
      const existingViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 30 30";
      
      // Clean and optimize the SVG for web display
      let cleanSvg = svgXml
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '')
        .replace(/viewBox="[^"]*"/g, '')
        .replace(/<svg/, `<svg width="100%" height="100%" viewBox="${existingViewBox}" preserveAspectRatio="xMidYMid meet"`);
      
      console.log('🌐 AllServices Rendering SVG on web:', uri.substring(0, 30) + '...', 'ViewBox:', existingViewBox);
      
      return (
        <div
          style={{
            width: style.width || 48,
            height: style.height || 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: cleanSvg }}
        />
      );
    } else {
      return <Image source={{ uri }} style={style} resizeMode="contain" />;
    }
  }

  // Mobile platforms
  if (error) {
    return <Image source={{ uri }} style={style} resizeMode="contain" />;
  }

  if (loading) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  return svgXml && SvgXml ? (
    <SvgXml xml={svgXml} width={style.width} height={style.height} />
  ) : (
    <Image source={{ uri }} style={style} resizeMode="contain" />
  );
};

// Helper to fetch SVG content
const fetchSvgContent = async (url) => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error("Failed to load SVG:", error);
    return null;
  }
};

export default function AllServices({ navigation, route }) {
  const [searchText, setSearchText] = useState('');
  const { userData, userToken } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContents, setSvgContents] = useState({});
  const [redirectedFrom, setRedirectedFrom] = useState('');

  // Handle URL redirects and deep links
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
            
            // Optionally, you can directly navigate to the screen
            // handleDirectNavigation(screenParam);
          }
        }
        
        // Handle route params for direct navigation
        if (route?.params?.redirectTo) {
          setSearchText(route.params.redirectTo);
        }
      };

      handleUrlRedirect();
    }, [route?.params])
  );

  // Handle direct navigation from URL
  const handleDirectNavigation = (screenName) => {
    const screenKey = screenName.toLowerCase();
    
    // For tab navigation, we need to navigate to the DrawerNavigation with specific tab
    if (['history', 'profile', 'rewards', 'home'].includes(screenKey)) {
      // Navigate to the main DrawerNavigation with tab screen parameter
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Home', 
          params: { screen: screenKey }
        }],
      });
    } else {
      // For direct screens
      const navigationMap = {
        'notification': () => navigation.navigate('Notification'),
        'help': () => navigation.navigate('Help'),
        'qrprint': () => navigation.navigate('QrPrint'),
      };
      
      const navFunction = navigationMap[screenKey];
      if (navFunction) {
        navFunction();
      }
    }
  };

  // Navigation items from drawer and other screens
  const navigationItems = [
    { id: 'nav-1', name: 'See Transaction History', route: 'history', icon: 'history', type: 'navigation' },
    { id: 'nav-2', name: 'Profile', route: 'Profile', icon: 'account', type: 'navigation' },
    { id: 'nav-3', name: 'Notification', route: 'Notification', icon: 'bell-outline', type: 'navigation' },
    { id: 'nav-4', name: 'Help & Support', route: 'Help', icon: 'help', type: 'navigation' },
    { id: 'nav-5', name: 'Rewards', route: 'Rewards', icon: 'gift', type: 'navigation' },
    { id: 'nav-6', name: 'QR Code', route: 'QrPrint', icon: 'qrcode', type: 'navigation' },
    { id: 'nav-7', name: 'Home', route: 'Home', icon: 'home', type: 'navigation' },
  ];

  // Related search terms mapping
  const relatedTerms = {
    'history': ['transaction', 'transactions', 'payment', 'payments', 'record', 'records', 'log'],
    'profile': ['account', 'user', 'settings', 'personal', 'info', 'information'],
    'notification': ['alert', 'alerts', 'notice', 'update', 'updates', 'message', 'messages'],
    'help': ['support', 'assist', 'assistance', 'faq', 'contact', 'issue', 'problem'],
    'rewards': ['reward', 'cashback', 'incentive', 'bonus', 'offer', 'offers', 'coupon'],
    'mobile': ['phone', 'prepaid', 'recharge', 'topup', 'top-up'],
    'dth': ['dish', 'tv', 'cable', 'television', 'set top box', 'satellite'],
    'transaction': ['history', 'payment', 'record', 'log'],
    'qr': ['qrcode', 'qr code', 'scan', 'scanner', 'barcode'],
  };

  const getServices = async (display) => {
    setIsLoading(true);
    try {
      const response = await getRecords({ 'displayOnScreen': display }, userToken, 'api/customer/service/allService');
      if (response?.status === 'success') {
        setServices(response.data);

        // Preload SVG contents
        const svgPromises = response.data
          .filter(item => isSvg(item.icon))
          .map(async (item) => {
            const content = await fetchSvgContent(item.icon);
            return { id: item.id, content };
          });

        const svgResults = await Promise.all(svgPromises);
        const svgMap = {};
        svgResults.forEach(({ id, content }) => {
          svgMap[id] = content;
        });

        setSvgContents(svgMap);
      }
    } catch (error) {
      console.error('Services fetch error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getServices('');
  }, []);

  // Enhanced search function
  const searchItems = (item, query) => {
    const lowercaseQuery = query.toLowerCase().trim();
    const itemName = (item.serviceName || item.name || '').toLowerCase();
    
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

  const handlePress = (item) => {
    if (item.type === 'navigation') {
      // Use the same navigation logic as handleDirectNavigation
      handleDirectNavigation(item.route);
    } else {
      // Handle service items
      const serviceName = item.serviceName;
      const serviceId = item.id;


    if (serviceName === 'Prepaid' || serviceName === 'Recharge') {
      navigation.navigate('ContactList', { service: 'prepaid', serviceId, serviceName });
    } else if (serviceName === 'DTH') {
      navigation.navigate('DthOperatorList', { service: 'prepaid', serviceId, serviceName });
    } else {
      navigation.navigate('BillerList', { service: 'postpaid', serviceId, serviceName });
    }


      
    }
  };

  const renderServiceItem = ({ item, index }) => {
    const isNavigation = item.type === 'navigation';
    const displayName = item.serviceName || item.name;
    
    return (
      <Card style={[styles.serviceCard, isNavigation && styles.navigationCard]}>
        <Pressable
          style={styles.serviceContent}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.iconContainer, isNavigation && styles.navigationIconContainer]}>
            {isNavigation ? (
              <List.Icon icon={item.icon} color="#8400E5" size={48} />
            ) : isSvg(item.icon) ? (
              <SvgImage uri={item.icon} style={{ width: 48, height: 48 }} />
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
      </Card>
    );
  };

  // Render content for web using native div
  const renderWebContent = () => {
    if (Platform.OS !== 'web') return null;
    
    const contentToRender = filteredItems.length === 0 ? (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No results found</h3>
        <p>Try searching with different keywords like "history", "recharge", or "profile"</p>
      </div>
    ) : (
      <div>
        {filteredItems.map((item, index) => (
          <div key={item.id?.toString() || index.toString()}>
            <div style={{ marginBottom: '12px' }}>
              {React.createElement(renderServiceItem, { item, index })}
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ flexShrink: 0 }}>
          <CommonHeader2 heading="All Services" />
        </div>
        <div style={{ 
          flexShrink: 0,
          padding: '16px'
        }}>
          <Searchbar
            placeholder="Search services, history, profile, rewards..."
            onChangeText={setSearchText}
            value={searchText}
            style={styles.searchbar}
            inputStyle={{ fontSize: 14 }}
            iconColor="#666"
          />
          {redirectedFrom && (
            <div style={styles.redirectNotice}>
              <span style={styles.redirectText}>
                🔄 Redirected from: {redirectedFrom}
              </span>
              <button
                style={styles.quickNavButton}
                onClick={() => handleDirectNavigation(redirectedFrom)}
              >
                Go to {redirectedFrom} →
              </button>
            </div>
          )}
        </div>
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          height: 0 // Force flex item to shrink
        }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <ActivityIndicator size="large" color="#000" />
              <span style={{ marginTop: '12px', color: '#666' }}>Loading services...</span>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {contentToRender}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile render
  const renderMobileContent = () => (
    <View style={styles.mainContainer}>
      <CommonHeader2 heading="All Services" />
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search services, history, profile, rewards..."
          onChangeText={setSearchText}
          value={searchText}
          style={styles.searchbar}
          inputStyle={{ fontSize: 14 }}
          iconColor="#666"
        />

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

  return Platform.OS === 'web' ? renderWebContent() : renderMobileContent();
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 40,
  },
  flatList: {
    flex: 1,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
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
    marginBottom: 16,
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