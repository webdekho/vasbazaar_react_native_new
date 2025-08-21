import { getRecords } from '@/src/Services/ApiServices';
import { styles, styles2 } from '@/src/components/Css';
import imageMap from '@/src/components/icons';
import { AuthContext } from '../../../context/AuthContext';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
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
import CardSlider from '../../../components/CardSlider';
import HomeInstallPrompt from '../../../components/HomeInstallPrompt';

const { width } = Dimensions.get('window');

const SvgImage = ({ uri, style }) => {
  const [svgXml, setSvgXml] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Add cache busting parameter to avoid cached errors
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(uri + cacheBuster);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        // Check if response is SVG
        if (contentType?.includes('image/svg+xml') || uri.endsWith('.svg')) {
          const text = await response.text();
          console.log('✅ SVG fetched successfully:', uri.substring(0, 50) + '...', 'Length:', text.length);
          
          // Validate SVG content
          if (text.includes('<svg') && text.includes('</svg>')) {
            setSvgXml(text);
            console.log('✅ Valid SVG content detected');
          } else {
            console.warn('⚠️ Invalid SVG content, falling back to Image');
            setError(true);
          }
        } else {
          // If not SVG, treat as regular image
          console.log('ℹ️ Not an SVG, using Image component:', uri);
          setError(true);
        }
      } catch (err) {
        console.error('SVG Load Error for', uri, ':', err.message);
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
      // On web, render SVG as HTML element
      // Extract existing viewBox or create a default one
      const viewBoxMatch = svgXml.match(/viewBox="([^"]+)"/);
      const existingViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 30 30";
      
      // Clean and optimize the SVG for web display
      let cleanSvg = svgXml
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '')
        .replace(/viewBox="[^"]*"/g, '')
        .replace(/<svg/, `<svg width="100%" height="100%" viewBox="${existingViewBox}" preserveAspectRatio="xMidYMid meet"`);
      
      console.log('🌐 Rendering SVG on web:', uri.substring(0, 30) + '...', 'ViewBox:', existingViewBox);
      
      return (
        <div
          style={{
            width: style.width || 35,
            height: style.height || 35,
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
      // Fallback to Image component for web
      return <Image source={{ uri }} style={style} resizeMode="contain" />;
    }
  }

  // Mobile platforms (iOS/Android)
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

export default function Home() {
  const navigation = useNavigation();
  const route = useRoute();
  const authContext = useContext(AuthContext);
  
  // Add safety check for auth context
  if (!authContext) {
    console.error('❌ Home: AuthContext not found');
    return (
      <View style={localStyles.errorContainer}>
        <Text style={localStyles.errorText}>Authentication error. Please restart the app.</Text>
      </View>
    );
  }

  const { userData, userToken } = authContext;
  const [cashback, setCashback] = useState('0.00');
  const [incentive, setIncentive] = useState('0.00');
  const [services, setServices] = useState([]);
  const [upcomingDues, setUpcomingDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const suggestionsdata = [
    { icon: 'vi', label: 'Due 01 June', onPress: () => navigation.navigate('ContactList', { service: 'prepaid' }) },
    { icon: 'mahavitaran', label: 'Due 05 June', onPress: () => navigation.navigate('ContactList', { service: 'postpaid' }) },
  ];

  // Cache keys
  const SERVICES_CACHE_KEY = 'services_cache';
  const SERVICES_TIMESTAMP_KEY = 'services_timestamp';
  const LAST_USED_SERVICE_KEY = 'lastUsedServiceId';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Check if cache is valid (not expired)
  const isCacheValid = useCallback(async () => {
    try {
      const timestamp = await AsyncStorage.getItem(SERVICES_TIMESTAMP_KEY);
      if (!timestamp) return false;
      
      const cacheTime = parseInt(timestamp);
      const currentTime = new Date().getTime();
      const isValid = (currentTime - cacheTime) < CACHE_DURATION;
      
      console.log('Cache validation:', {
        cacheTime: new Date(cacheTime).toLocaleString(),
        currentTime: new Date(currentTime).toLocaleString(),
        age: Math.floor((currentTime - cacheTime) / 1000 / 60 / 60), // hours
        isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('Cache validation error:', error);
      return false;
    }
  }, []);

  // Load services from cache
  const loadServicesFromCache = useCallback(async () => {
    try {
      const cachedServices = await AsyncStorage.getItem(SERVICES_CACHE_KEY);
      if (cachedServices) {
        const services = JSON.parse(cachedServices);
        console.log('Loaded services from cache:', services.length, 'services');
        return services;
      }
      return null;
    } catch (error) {
      console.error('Error loading services from cache:', error);
      return null;
    }
  }, []);

  // Save services to cache
  const saveServicesToCache = useCallback(async (servicesData) => {
    try {
      await AsyncStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(servicesData));
      await AsyncStorage.setItem(SERVICES_TIMESTAMP_KEY, new Date().getTime().toString());
      console.log('Services cached successfully:', servicesData.length, 'services');
    } catch (error) {
      console.error('Error saving services to cache:', error);
    }
  }, []);

  // Get last used service ID
  const getLastUsedServiceId = useCallback(async () => {
    try {
      const lastUsedServiceId = await AsyncStorage.getItem(LAST_USED_SERVICE_KEY);
      return lastUsedServiceId ? parseInt(lastUsedServiceId) : null;
    } catch (error) {
      console.error('Error getting last used service ID:', error);
      return null;
    }
  }, []);

  // Sort services with last used service at the top
  const sortServicesWithLastUsed = useCallback((servicesArray, lastUsedServiceId) => {
    if (!lastUsedServiceId) return servicesArray;
    
    const sortedServices = [...servicesArray];
    const lastUsedIndex = sortedServices.findIndex(service => service.id === lastUsedServiceId);
    
    if (lastUsedIndex > 0) {
      // Move last used service to the top
      const lastUsedService = sortedServices.splice(lastUsedIndex, 1)[0];
      sortedServices.unshift(lastUsedService);
      console.log('Moved last used service to top:', lastUsedService.serviceName);
    }
    
    return sortedServices;
  }, []);

  const getServices = useCallback(async (display) => {
    try {
      console.log('🔄 Home: Starting service fetch, userToken:', !!userToken);
      
      // Safety check for userToken
      if (!userToken) {
        console.warn('⚠️ Home: No userToken available, using cached services only');
        const cachedServices = await loadServicesFromCache();
        if (cachedServices) {
          const servicesWithValidIcons = cachedServices.map(service => ({
            ...service,
            icon: service.icon?.startsWith('http') ? service.icon : `https://example.com/default-icon.svg`
          }));
          setServices(servicesWithValidIcons);
        }
        return;
      }
      
      // Check cache first
      const cacheValid = await isCacheValid();
      const lastUsedServiceId = await getLastUsedServiceId();
      
      if (cacheValid) {
        // Load from cache
        const cachedServices = await loadServicesFromCache();
        if (cachedServices) {
          console.log('✅ Using cached services, skipping API call');
          // Ensure icons have proper URLs
          const servicesWithValidIcons = cachedServices.map(service => ({
            ...service,
            icon: service.icon?.startsWith('http') ? service.icon : `https://example.com/default-icon.svg`
          }));
          
          // Sort with last used service at the top
          const sortedServices = sortServicesWithLastUsed(servicesWithValidIcons, lastUsedServiceId);
          setServices(sortedServices);
          return;
        }
      }
      
      // Cache not valid or doesn't exist, fetch from API
      console.log('🔄 Cache expired or not found, fetching from API');
      const response = await getRecords({ displayOnScreen: display }, userToken, 'api/customer/service/allService');
      
      if (response?.status === 'success') {
        console.log('📡 API response received:', response.data.length, 'services');
        
        // Ensure icons have proper URLs
        const servicesWithValidIcons = response.data.map(service => ({
          ...service,
          icon: service.icon?.startsWith('http') ? service.icon : `https://example.com/default-icon.svg`
        }));
        
        // Save to cache
        await saveServicesToCache(servicesWithValidIcons);
        
        // Sort with last used service at the top
        const sortedServices = sortServicesWithLastUsed(servicesWithValidIcons, lastUsedServiceId);
        setServices(sortedServices);
      } else {
        console.error('API call failed, trying cache as fallback');
        // Try to load from cache as fallback
        const cachedServices = await loadServicesFromCache();
        if (cachedServices) {
          console.log('🔄 Using expired cache as fallback');
          const servicesWithValidIcons = cachedServices.map(service => ({
            ...service,
            icon: service.icon?.startsWith('http') ? service.icon : `https://example.com/default-icon.svg`
          }));
          
          const sortedServices = sortServicesWithLastUsed(servicesWithValidIcons, lastUsedServiceId);
          setServices(sortedServices);
        }
      }
    } catch (error) {
      console.error('Services fetch error:', error);
      
      // Try to load from cache as fallback
      try {
        const cachedServices = await loadServicesFromCache();
        if (cachedServices) {
          console.log('🔄 Using cached services due to error');
          const servicesWithValidIcons = cachedServices.map(service => ({
            ...service,
            icon: service.icon?.startsWith('http') ? service.icon : `https://example.com/default-icon.svg`
          }));
          
          const lastUsedServiceId = await getLastUsedServiceId();
          const sortedServices = sortServicesWithLastUsed(servicesWithValidIcons, lastUsedServiceId);
          setServices(sortedServices);
        }
      } catch (cacheError) {
        console.error('Cache fallback also failed:', cacheError);
      }
    }
  }, [userToken, isCacheValid, loadServicesFromCache, saveServicesToCache, getLastUsedServiceId, sortServicesWithLastUsed]);

  const getBalance = useCallback(async () => {
    try {
      const response = await getRecords({}, userToken, 'api/customer/user/getByUserId');
      if (response?.status === 'success') {
        const { cashback, incentive } = response.data;

        if (cashback != null && !isNaN(cashback)) {
          setCashback(parseFloat(cashback).toFixed(2));
        }

        if (incentive != null && !isNaN(incentive)) {
          setIncentive(parseFloat(incentive).toFixed(2));
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') console.error('Balance fetch error', error);
    }
  }, [userToken]);

  // Fetch upcoming dues data
  const getUpcomingDues = useCallback(async () => {
    try {
      setDuesLoading(true);
      console.log('🔄 Fetching upcoming dues with token:', userToken ? 'Token present' : 'No token');
      
      const response = await getRecords({}, userToken, 'api/customer/schedular/suggestion');
      console.log('📡 API Response:', JSON.stringify(response, null, 2));
      
      if ((response?.Status === 'SUCCESS' || response?.status === 'success') && response?.data) {
        console.log('✅ Upcoming dues fetched:', response.data.length, 'items');
        console.log('📊 Raw dues data:', JSON.stringify(response.data, null, 2));
        
        // Group by mobile number and operator to avoid duplicates
        const uniqueDues = [];
        const seen = new Set();
        
        response.data.forEach(due => {
          const key = `${due.mobile}-${due.operatorId?.id}`;
          console.log('🔍 Processing due:', {
            mobile: due.mobile,
            operatorName: due.operatorId?.operatorName,
            serviceName: due.operatorId?.serviceId?.serviceName,
            fromDate: due.fromDate,
            key: key
          });
          
          if (!seen.has(key)) {
            seen.add(key);
            uniqueDues.push({
              ...due,
              // Format date for display
              displayDate: due.fromDate ? new Date(due.fromDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) : 'No date',
            });
          }
        });
        
        console.log('📋 Processed unique dues:', uniqueDues.length);
        console.log('🎯 Final dues data:', JSON.stringify(uniqueDues, null, 2));
        
        setUpcomingDues(uniqueDues.slice(0, 8)); // Limit to 8 items for better UI
      } else {
        console.log('ℹ️ No upcoming dues found or API returned:', response);
        setUpcomingDues([]);
      }
    } catch (error) {
      console.error('❌ Upcoming dues fetch error:', error);
      setUpcomingDues([]);
    } finally {
      setDuesLoading(false);
      console.log('✅ Dues loading completed');
    }
  }, [userToken]);

  const refreshData = useCallback(async () => {
    await getBalance();
    await getServices(1);
    await getUpcomingDues();
    setLastRefresh(new Date());
  }, [getBalance, getServices, getUpcomingDues]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      if (!lastRefresh || new Date() - lastRefresh > 10000) {
        refreshData();
      }
    }, [lastRefresh, refreshData])
  );

  const handlePress = (serviceName, serviceId) => {
    if (serviceName === 'Prepaid' || serviceName === 'Recharge') {
      navigation.navigate('ContactList', { service: 'prepaid', serviceId, serviceName });
    } else if (serviceName === 'DTH') {
      navigation.navigate('DthOperatorList', { service: 'prepaid', serviceId, serviceName });
    } else {
      navigation.navigate('BillerList', { service: 'postpaid', serviceId, serviceName });
    }
  };

  // Handle dues item click - navigate to appropriate screen based on service type
  const handleDuePress = (dueItem) => {
    const { operatorId, mobile, name } = dueItem;
    const { serviceId, operatorName, logo, inputFields } = operatorId;
    const serviceName = serviceId?.serviceName;

    console.log('Due item pressed:', {
      serviceName,
      operatorName,
      mobile,
      serviceType: serviceId?.id
    });

    // Prepare navigation parameters from API response
    const navigationParams = {
      serviceId: serviceId?.id,
      operator_id: operatorId?.id,
      operatorName: operatorName,
      logo: logo,
      inputFields: inputFields,
      mobile: mobile,
      contact: { 
        number: mobile, 
        name: name || 'Unknown' 
      },
      biller: {
        id: operatorId?.id,
        operatorName: operatorName,
        logo: logo,
        inputFields: inputFields,
        operatorCode: operatorId?.operatorCode,
        amountExactness: 'Exact',
        fetchRequirement: 'MANDATORY'
      }
    };

    // Navigate based on service type
    if (serviceName === 'Prepaid' || serviceName === 'Recharge') {
      // Navigate to RechargePlan.js for prepaid services
      navigation.navigate('RechargePlan', {
        service: 'prepaid',
        operator_id: operatorId?.id,
        contact: { number: mobile, name: name || 'Unknown' },
        circleCode: null,
        companyLogo: logo,
        operator: operatorName,
        circle: null
      });
    } else if (serviceName === 'DTH') {
      // Navigate to DthPlan.js for DTH services
      navigation.navigate('DthPlan', {
        service: 'dth',
        operator_id: operatorId?.id,
        contact: { number: mobile, name: name || 'Unknown' },
        circleCode: null,
        companyLogo: logo,
        operator: operatorName,
        circle: null
      });
    } else {
      // Navigate to ViewBill.js for postpaid/bill payment services
      navigation.navigate('ViewBill', {
        ...navigationParams,
        circleCode: null,
        circle: null,
        name: name || 'No Name',
        bill_details: {
          dueDate: dueItem.fromDate || 'NA',
          billAmount: 0,
          statusMessage: 'Upcoming due - fetch latest bill',
          acceptPayment: 'true',
          acceptPartPay: 'true',
          maxBillAmount: '',
          customername: name || 'No Name',
          billnumber: 'NA',
          billdate: 'NA',
          billperiod: '',
          AddInfo: [],
          paymentAmountExactness: true,
        },
        amountExactness: 'Exact',
        fetchRequirement: 'MANDATORY'
      });
    }
  };

  return (
    <>
      <ScrollView 
        bounces={false} 
        style={[styles2.container, { padding: 0 }]}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 110 }}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.imageBackground}>
        <CardSlider total_cashback={cashback} total_incentive={incentive} userData={userData} />
      </View>

      <View style={[styles.container, { paddingTop: 5, paddingBottom: 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Services</Text>
          <Pressable onPress={() => navigation.navigate('AllServices')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={localStyles.grid}>
          {services.slice(0, 8).map((item, index) => (
            <Pressable
              key={index}
              style={localStyles.gridItem}
              onPress={() => handlePress(item.serviceName, item.id)}
            >
              <View style={localStyles.icons}>
                <SvgImage 
                  uri={item.icon} 
                  style={localStyles.icon} 
                />
              </View>
              <Text style={localStyles.label} numberOfLines={2}>{item.serviceName}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Upcoming Dues Section */}
      {upcomingDues.length > 0 && (
        <View style={[styles.container, { marginTop: 5, marginBottom: 5 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Upcoming Dues</Text>
            {duesLoading && (
              <ActivityIndicator size="small" color="#666" style={{ marginLeft: 10 }} />
            )}
          </View>
          
          <View style={localStyles.grid}>
            {upcomingDues.map((item, index) => {
              const operator = item.operatorId;
              const serviceName = operator?.serviceId?.serviceName;
              const dueLabel = `Due ${item.displayDate}`;
              const mobileNumber = item.mobile?.substring(0, 4) + 'xxxx' + item.mobile?.substring(8);
              
              return (
                <Pressable 
                  key={`${item.mobile}-${operator?.id}-${index}`} 
                  style={localStyles.gridItem} 
                  onPress={() => handleDuePress(item)}
                >
                  <View style={localStyles.icons}>
                    {operator?.logo ? (
                      <SvgImage 
                        uri={operator.logo} 
                        style={localStyles.icon} 
                      />
                    ) : (
                      <View style={[localStyles.icon, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 10, color: '#666' }}>
                          {serviceName?.substring(0, 3).toUpperCase() || 'DUE'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={localStyles.dueLabel} numberOfLines={1}>
                    {operator?.operatorName || 'Unknown'}
                  </Text>
                  <Text style={localStyles.dueMobile} numberOfLines={1}>
                    {mobileNumber}
                  </Text>
                  <Text style={localStyles.dueDate} numberOfLines={1}>
                    {dueLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

    </ScrollView>
    
      {/* Home Install Prompt - Only for Web */}
      <HomeInstallPrompt />
    </>
  );
}

const localStyles = StyleSheet.create({
  icons: {
    padding: 5,
    borderRadius: 10,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f5f5f5', // Add background for better visibility
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  gridItem: {
    width: '25%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  icon: {
    width: 35,
    height: 35,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  // Styles for upcoming dues
  dueLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  dueMobile: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    color: '#FF6B35',
  },
  // Error container styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});