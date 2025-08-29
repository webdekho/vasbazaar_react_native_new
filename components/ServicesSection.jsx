import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHomeServices } from '../services';
import CachedSvgImage from './CachedSvgImage';
import { loadServiceUsage, trackServiceUsage, sortServicesByUsage } from '../utils/serviceUsageTracker';

const { width } = Dimensions.get('window');

const ServicesSection = ({ 
  services: propServices, 
  onServicePress = () => {}, 
  onViewAllPress = () => {} 
}) => {
  const [apiServices, setApiServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceUsage, setServiceUsage] = useState({});
  const [sortedServices, setSortedServices] = useState([]);

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      console.log('Fetching home services...');
      
      // Get user's session token (access_token)
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.log('No session token found, using default services');
        setApiServices([]);
        setLoadingServices(false);
        return;
      }

      const response = await getHomeServices(sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        console.log('Successfully fetched services:', response.data.length);
        
        // Transform API services to match component format
        const transformedServices = response.data.map((service, index) => ({
          id: service.id,
          title: service.name,
          icon: service.icon.uri, // Already transformed to URI in service
          route: `/main/${service.name.toLowerCase().replace(/\s+/g, '')}`,
          color: getServiceColor(index), // Assign colors based on index
          originalData: service
        }));
        
        setApiServices(transformedServices);
      } else {
        console.log('Failed to fetch services:', response?.message);
        setApiServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setApiServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Helper function to assign colors to services
  const getServiceColor = (index) => {
    const colors = [
      '#4F46E5', '#059669', '#0EA5E9', '#DC2626', 
      '#F59E0B', '#8B5CF6', '#10B981', '#EF4444',
      '#6366F1', '#F97316', '#EC4899', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  // Load service usage data
  const loadUsageData = async () => {
    const usage = await loadServiceUsage();
    setServiceUsage(usage);
  };

  // Load data on component mount
  useEffect(() => {
    loadUsageData();
    fetchServices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update sorted services when usage or services change
  useEffect(() => {
    let baseServices = [];
    if (apiServices.length > 0) {
      baseServices = apiServices;
    } else if (propServices && propServices.length > 0) {
      baseServices = propServices;
    } else {
      baseServices = defaultServices;
    }

    const sorted = sortServicesByUsage(baseServices, serviceUsage);
    setSortedServices(sorted);
    console.log('Services re-sorted based on usage:', sorted.map(s => s.title));
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [apiServices, propServices, serviceUsage]);

  // Default demo services using the same SVG icon for all
  const defaultServices = [];

  // Use sorted services from state
  const services = sortedServices;

  const renderServiceItem = (service) => {
    const isUrl = service.icon.startsWith('http');
    
    return (
      <TouchableOpacity
        key={service.id}
        style={styles.serviceItem}
        onPress={async () => {
          // Track usage before calling the parent handler
          const updatedUsage = await trackServiceUsage(service.id, service.title);
          if (updatedUsage) {
            setServiceUsage(updatedUsage);
          }
          // Call the original handler
          onServicePress(service);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.serviceIconContainer}>
          {isUrl ? (
            // For URL icons (SVG, PNG, JPG) - now using cached version
            <CachedSvgImage
              uri={service.icon}
              style={styles.serviceIcon}
            />
          ) : (
            // For FontAwesome icons (fallback/demo)
            <FontAwesome
              name={service.icon}
              size={32}
              color={service.color}
            />
          )}
        </View>
        <Text style={styles.serviceTitle}>{service.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Services</Text>
        <TouchableOpacity onPress={onViewAllPress} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      {loadingServices && apiServices.length === 0 && !propServices ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : (
        <View style={styles.servicesGrid}>
          <View style={styles.row}>
            {services.slice(0, 4).map(renderServiceItem)}
          </View>
          <View style={styles.row}>
            {services.slice(4, 8).map(renderServiceItem)}
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  servicesGrid: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  serviceIcon: {
    width: 36,
    height: 36,
    position: 'absolute',
    zIndex: 2,
  },
  fallbackIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  // Loading Styles
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
});

export default ServicesSection;