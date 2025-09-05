import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUpcomingDues } from '../services';

const UpcomingDues = ({ dues = [], onDuePress = () => {} }) => {
  const [apiDues, setApiDues] = useState([]);
  const [loadingDues, setLoadingDues] = useState(true);

  // Fetch upcoming dues from API
  const fetchUpcomingDues = async () => {
    try {
      setLoadingDues(true);
      // console.log('Fetching upcoming dues...');
      
      // Get user's session token (access_token)
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        // console.log('No session token found, using default dues');
        setApiDues([]);
        setLoadingDues(false);
        return;
      }

      const response = await getUpcomingDues(sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        // console.log('Successfully fetched upcoming dues:', response.data.length);
        
        // Transform API dues to match component format
        const transformedDues = response.data.map((due) => {
          // Try multiple possible paths for the data
          const amount = due.amount || due.Amount || (due.originalData && due.originalData.amount);
          const operatorName = due.operatorId?.operatorName || 
                              due.operatorId?.name || 
                              due.operator?.name || 
                              due.operator?.operatorName ||
                              'Unknown Provider';
          const operatorLogo = due.operatorId?.logo || 
                              due.operatorId?.Logo ||
                              due.operator?.logo ||
                              due.operator?.Logo;
          
          const transformedDue = {
            id: due.id,
            provider: operatorName,
            number: due.mobile ? `${due.mobile.slice(0, 4)}xxxx${due.mobile.slice(-2)}` : 'N/A',
            dueDate: `Due ${formatDate(due.fromDate)}`,
            logo: operatorLogo ? { uri: operatorLogo } : require('@/assets/icons/default.png'),
            amount: amount ? `₹${amount}` : null,
            status: 'pending',
            service: due.operatorId?.serviceId?.serviceName || due.service || 'Service',
            originalData: due
          };
          
          return transformedDue;
        });
        
        setApiDues(transformedDues);
      } else {
        // console.log('Failed to fetch upcoming dues:', response?.message);
        setApiDues([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming dues:', error);
      setApiDues([]);
    } finally {
      setLoadingDues(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Fetch dues on component mount
  useEffect(() => {
    fetchUpcomingDues();
  }, []);

  // Default dues if no dues provided
  const defaultDues = [
    // {
    //   id: 'vi-idea',
    //   provider: 'Vi - idea',
    //   number: '9226xxxx93',
    //   dueDate: 'Due Aug 20',
    //   logo: require('@/assets/icons/vi.png'),
    //   amount: '₹199',
    //   status: 'pending'
    // },
    // {
    //   id: 'airtel-postpaid',
    //   provider: 'Airtel Postpaid',
    //   number: '8765xxxx21',
    //   dueDate: 'Due Aug 22',
    //   logo: require('@/assets/icons/airtel.png'),
    //   amount: '₹549',
    //   status: 'pending'
    // },
    // {
    //   id: 'electricity-bill',
    //   provider: 'MSEDCL',
    //   number: 'ACC 123456789',
    //   dueDate: 'Due Aug 28',
    //   logo: require('@/assets/icons/mahavitaran.png'),
    //   amount: '₹2,450',
    //   status: 'pending'
    // },
    // {
    //   id: 'gas-bill',
    //   provider: 'Mahanagar Gas',
    //   number: 'CA 9876543',
    //   dueDate: 'Due Sep 5',
    //   logo: require('@/assets/icons/gas-cylinder.png'),
    //   amount: '₹890',
    //   status: 'pending'
    // }
  ];

  // Priority: API dues > props dues > default dues
  // If API call completed but no dues found, don't show component
  let displayDues = [];
  if (apiDues.length > 0) {
    displayDues = apiDues;
    console.log('Using API dues:', apiDues.length);
  } else if (!loadingDues && apiDues.length === 0) {
    // API call completed but returned no dues - hide component completely
    // console.log('API call completed with no dues - hiding component');
    displayDues = [];
  } else if (dues && dues.length > 0) {
    displayDues = dues;
    // console.log('Using props dues:', dues.length);
  } else {
    displayDues = defaultDues;
    // console.log('Using default dues');
  }

  const renderDueItem = (due, index) => (
    <TouchableOpacity
      key={`due-${due.id}-${index}`}
      style={styles.dueItem}
      onPress={() => onDuePress(due)}
      activeOpacity={0.7}
    >
      <View style={styles.dueContent}>
        <View style={styles.logoContainer}>
          <Image
            source={due.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.dueInfo}>
          <Text style={styles.providerName}>{due.provider}</Text>
          <Text style={styles.phoneNumber}>{due.number}</Text>
          <Text style={styles.dueDate}>{due.dueDate}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {due.amount || 
             (due.originalData?.amount ? `₹${due.originalData.amount}` : null) ||
             'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show loading or component based on state
  if (loadingDues && apiDues.length === 0 && !dues?.length) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Upcoming Dues</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading upcoming dues...</Text>
        </View>
      </ThemedView>
    );
  }

  if (displayDues.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Upcoming Dues</Text>
      </View>

      {/* Dues List */}
      <View style={styles.duesList}>
        {displayDues.map((due, index) => renderDueItem(due, index))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: Platform.select({
      web: 0, // Extra margin for web browsers, especially iPhone Safari
      default: 0,
    }),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    // Additional web-specific styles for iPhone Safari
    ...(Platform.OS === 'web' && {
      paddingBottom: 25, // Extra bottom padding
      marginBottom: 0, // More aggressive bottom margin
    }),
  },
  header: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  duesList: {
    gap: 12,
  },
  dueItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  logoContainer: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  logo: {
    width: 50,
    height: 30,
  },
  dueInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0, // Allow text to wrap properly
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    minWidth: 80, // Ensure minimum width for amount display
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
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

export default UpcomingDues;