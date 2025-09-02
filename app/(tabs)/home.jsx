import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';
import SimpleCardSlider from '@/components/SimpleCardSlider';
import ServicesSection from '@/components/ServicesSection';
import UpcomingDues from '@/components/UpcomingDues';
import { protect, protectedPush } from '../../utils_old/sessionProtection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { 
  isBiometricAuthAvailable, 
  setupBiometricAuth,
  checkBiometricSupport
} from '../../services/auth/biometricService';
import { postRequest } from '../../services/api/baseApi';

export default function HomeScreen() {
  const router = useRouter();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricAuthType, setBiometricAuthType] = useState('');

  // Check if we need to show biometric setup on component mount
  useEffect(() => {
    checkBiometricSetupNeeded();
  }, []);

  // Check if we need to show biometric setup
  const checkBiometricSetupNeeded = async () => {
    try {
      // console.log('🏠 Checking if biometric setup is needed on home screen...');
      
      // Check if there's a temp PIN from successful validation
      const tempPin = await AsyncStorage.getItem('tempPinForBiometric');
      // console.log('🏠 Temp PIN found:', tempPin);
      
      if (tempPin) {
        // console.log('🔧 Found temp PIN - checking biometric availability...');
        
        // Check if biometric is available but not set up
        const availability = await isBiometricAuthAvailable();
        const deviceSupport = await checkBiometricSupport();
        
        // console.log('📱 Biometric availability:', availability);
        // console.log('🔧 Device support:', deviceSupport);
        
        // console.log('🔧 Setup conditions check:');
        // console.log('- availability.canSetup:', availability.canSetup);
        // console.log('- !availability.available:', !availability.available);
        // console.log('- deviceSupport.isAvailable:', deviceSupport.isAvailable);
        // console.log('- Will show modal:', availability.canSetup && !availability.available && deviceSupport.isAvailable);
        
        if (availability.canSetup && !availability.available && deviceSupport.isAvailable) {
          // Device supports biometric but not set up yet
          setBiometricAuthType(deviceSupport.authTypes?.[0] || 'Biometric');
          setShowBiometricSetup(true);
          // console.log('✨ Showing biometric setup modal...');
        } else {
          // console.log('ℹ️ Not showing modal - clearing temp PIN');
          await AsyncStorage.removeItem('tempPinForBiometric');
        }
      } else {
        // console.log('ℹ️ No temp PIN found - no biometric setup needed');
      }
    } catch (error) {
      // console.error('❌ Error checking biometric setup:', error);
    }
  };

  // Handle biometric setup from modal
  const handleBiometricSetup = async () => {
    try {
      const tempPin = await AsyncStorage.getItem('tempPinForBiometric');
      if (!tempPin) {
        Alert.alert('Error', 'PIN not found. Please try logging in again.');
        return;
      }

      // console.log('🔧 Setting up biometric from home screen...');
      const result = await setupBiometricAuth(tempPin);
      
      if (result.success) {
        // console.log('✅ Biometric setup successful!');
        Alert.alert(
          'Biometric Enabled!', 
          `${biometricAuthType} authentication has been enabled. You can now use it to login quickly.`,
          [{ text: 'OK' }]
        );
        
        // Clear temp PIN
        await AsyncStorage.removeItem('tempPinForBiometric');
        setShowBiometricSetup(false);
      } else {
        // console.log('❌ Biometric setup failed:', result.error);
        Alert.alert('Setup Failed', result.error || 'Could not enable biometric authentication.');
      }
    } catch (error) {
      // console.error('❌ Error setting up biometric:', error);
      Alert.alert('Error', 'An error occurred while setting up biometric authentication.');
    }
  };

  // Skip biometric setup
  const skipBiometricSetup = async () => {
    await AsyncStorage.removeItem('tempPinForBiometric');
    setShowBiometricSetup(false);
    console.log('⏭️ Biometric setup skipped');
  };
  
  const handleNotificationPress = protect(() => {
    // console.log('Notification pressed');
    router.push('/main/NotificationScreen');
  });

  const handleSearchPress = protect(() => {
    // console.log('Search pressed');
    router.push('/main/AllServicesScreen');
  });

  const handleServicePress = protect((service) => {
    // console.log('Service pressed:', service.title);
    
    const serviceName = service.title;
    const serviceId = service.id || service.originalData?.id || service.title.toLowerCase();
    
    if (serviceName === 'Prepaid' || serviceName === 'Recharge') {
      router.push(`/main/prepaid/ContactListScreen?service=prepaid&serviceId=${serviceId}&serviceName=${serviceName}`);
    } else if (serviceName === 'DTH') {
      router.push(`/main/dth/DthListScreen?service=prepaid&serviceId=${serviceId}&serviceName=${serviceName}`);
    } else {
      router.push(`/main/biller/BillerListScreen?service=postpaid&serviceId=${serviceId}&serviceName=${serviceName}`);
    }
  });

  const handleViewAllPress = protect(() => {
    console.log('View All services pressed');
    router.push('/main/AllServicesScreen');
  });




  const handleDuePress = protect(async (due) => {
  console.log('Due pressed:', JSON.stringify(due, null, 2));
  
  try {
    // Navigate to the deepest originalData for most accurate information
    const deepestData = due.originalData?.originalData || due.originalData || due;
    
    // Extract service information - check multiple locations
    let serviceName = '';
    let serviceId = '';
    
    // Try to get service info from different possible locations
    if (deepestData.operatorId?.serviceId?.serviceName) {
      serviceName = String(deepestData.operatorId.serviceId.serviceName).toLowerCase();
      serviceId = deepestData.operatorId.serviceId.id;
    } else if (due.service?.name) {
      serviceName = String(due.service.name).toLowerCase();
      serviceId = due.service.id;
    } else if (due.originalData?.service?.name) {
      serviceName = String(due.originalData.service.name).toLowerCase();
      serviceId = due.originalData.service.id;
    }
    
    // Extract provider/operator information
    let providerName = '';
    let operatorCode = '';
    let operatorLogo = '';
    let operatorId = '';
    
    if (deepestData.operatorId) {
      providerName = deepestData.operatorId.operatorName || '';
      operatorCode = deepestData.operatorId.operatorCode || '';
      operatorLogo = deepestData.operatorId.logo || '';
      operatorId = deepestData.operatorId.id || '';
    } else if (due.originalData?.operator) {
      providerName = due.originalData.operator.name || '';
      operatorCode = due.originalData.operator.code || '';
      operatorLogo = due.originalData.operator.logo || '';
      operatorId = due.originalData.operator.id || '';
    } else if (due.provider) {
      providerName = due.provider || '';
    }
    
    // Convert provider name to lowercase for comparison if needed
    const providerNameLower = providerName.toLowerCase();
    
    // Extract mobile/account number - check multiple locations
    let contactNumber = '';
    if (deepestData.mobile) {
      contactNumber = deepestData.mobile;
    } else if (due.originalData?.mobile) {
      contactNumber = due.originalData.mobile;
    } else if (due.number) {
      // Remove any masking characters (case-insensitive)
      contactNumber = due.number.replace(/x/gi, '');
    }
    
    // Extract amount
    let amount = '';
    if (deepestData.amount) {
      amount = String(deepestData.amount);
    } else if (due.amount) {
      // Remove currency symbol if present
      amount = due.amount.replace(/[₹,]/g, '').trim();
    }
    
    console.log('Extracted data:', {
      serviceName,
      serviceId,
      providerName,
      operatorCode,
      contactNumber,
      amount,
      operatorLogo
    });
    
    // Determine service type and navigate accordingly
    let serviceType = 'other';
    
    // Convert to lowercase for case-insensitive comparison
    const serviceNameLower = serviceName.toLowerCase();
    
    if (serviceNameLower.includes('prepaid') || serviceNameLower === 'prepaid') {
      serviceType = 'prepaid';
    } else if (serviceNameLower.includes('dth') || serviceNameLower === 'dth') {
      serviceType = 'dth';
    } else if (serviceNameLower.includes('postpaid') || serviceNameLower === 'postpaid') {
      serviceType = 'postpaid';
    } else if (serviceNameLower.includes('electricity') || serviceNameLower === 'electricity') {
      serviceType = 'electricity';
    } else if (serviceNameLower.includes('gas') || serviceNameLower === 'gas') {
      serviceType = 'gas';
    } else if (serviceNameLower.includes('water') || serviceNameLower === 'water') {
      serviceType = 'water';
    }
    
    console.log('Determined service type:', serviceType);
    
    if (serviceType === 'prepaid') {
      // Navigate to RechargePlanScreen for prepaid
      const operatorData = {
        opCode: operatorCode,
        operatorName: providerName,
        operatorLogo: operatorLogo,
        serviceId: serviceId
      };
      
      router.push({
        pathname: '/main/prepaid/RechargePlanScreen',
        params: {
          contactName: providerName || 'Unknown',
          phoneNumber: contactNumber,
          operatorData: JSON.stringify(operatorData),
          serviceId: String(serviceId),
          operatorCode: operatorCode,
          fromDues: 'true'
        }
      });
      
    } else if (serviceType === 'dth') {
      // For DTH, validate DTH number first
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }
      
      // const { validateDthNumber } = require('../../services');
      
      if (contactNumber) {
        console.log('Validating DTH number:', contactNumber);
        
        try {
          // const dthResponse = await validateDthNumber(contactNumber, sessionToken);
          
          
                const requestData = {
                  operatorCode,
                  dthNumber: contactNumber
                };
          
                // Fetch DTH info
                const response = await postRequest(
                  'api/customer/operator/fetch_DTHInfo',
                  requestData,
                  sessionToken
                );
          
                // Handle API response
                if (response?.status !== 'success') {
                  throw new Error(response?.message || 'Failed to fetch DTH information');
                }
                
                router.push({
                  pathname: '/main/dth/DthPlanScreen',
                  params: {
                    serviceId,
                    operator_id: operatorId,
                    contact: JSON.stringify({
                      number: contactNumber,
                      name: response.data?.customerName || 'DTH Customer'
                    }),
                    circleCode: null,
                    companyLogo: operatorLogo,
                    operatorCode,
                    name: response.data?.customerName || 'Customer',
                    dth_info: JSON.stringify(response.data),
                    operator: providerName,
                    circle: null,
                    plan: JSON.stringify({
                      price: `₹0`,
                      validity: 'Custom',
                      name: 'Custom Recharge'
                    })
                  }
              });

        } catch (validationError) {
          console.error('DTH validation error:', validationError);
          Alert.alert('Error', 'Failed to validate DTH number.');
        }
      } else {
        Alert.alert('Error', 'DTH number not available');
      }
      
    } else if (serviceType === 'postpaid') {
      // For postpaid, navigate to postpaid bill payment screen
      const billerData = {
        id: operatorId,
        operatorName: providerName,
        logo: operatorLogo,
        operatorCode: operatorCode,
        inputFields: {
          field1: {
            label: 'Mobile Number',
            type: 'text',
            required: true,
            placeholder: 'Enter mobile number',
            value: contactNumber
          },
          field2: {
            label: 'Amount',
            type: 'number',
            required: true,
            placeholder: 'Enter amount',
            value: amount
          }
        },
        amountExactness: 'false',
        fetchRequirement: 'true'
      };
      
      router.push({
        pathname: '/main/postpaid/PostpaidBillScreen',
        params: {
          serviceId: String(serviceId),
          biller: JSON.stringify(billerData),
          fromDues: 'true'
        }
      });
      
    } else {
      // For other services (electricity, gas, water, etc.)
      // Extract input fields if available
      let inputFields = {};
      
      if (deepestData.operatorId?.inputFields) {
        inputFields = deepestData.operatorId.inputFields;
      } else if (due.originalData?.operator?.inputFields) {
        inputFields = due.originalData.operator.inputFields;
      } else {
        // Default input fields for utility bills
        inputFields = {
          field1: {
            label: 'Account Number',
            type: 'text',
            required: true,
            placeholder: 'Enter account number'
          },
          field2: {
            label: 'Amount',
            type: 'number',
            required: true,
            placeholder: 'Enter amount'
          }
        };
      }
      
      // Pre-fill values in input fields
      if (inputFields.field1) {
        inputFields.field1.value = contactNumber;
      }
      if (inputFields.field2) {
        inputFields.field2.value = amount;
      }
      
      const billerData = {
        id: operatorId,
        operatorName: providerName || 'Unknown Provider',
        logo: operatorLogo,
        operatorCode: operatorCode,
        inputFields: inputFields,
        amountExactness: deepestData.amountExactness || 'false',
        fetchRequirement: deepestData.fetchRequirement || 'false'
      };
      
      router.push({
        pathname: '/main/biller/BillerRechargeScreen',
        params: {
          serviceId: String(serviceId),
          biller: JSON.stringify(billerData),
          fromDues: 'true'
        }
      });
    }
    
  } catch (error) {
    console.error('Error handling due press:', error);
    console.error('Error stack:', error.stack);
    Alert.alert('Error', 'Unable to process payment. Please try again.');
  }
});






  // User data for the card
  const userData = {
    name: 'NA',
    mobile: 'NA'
  };

  // Wallet data
  const walletData = {
    total_cashback: 0.54,
    total_incentive: 0.00,
    balance: "748.31"
  };

  // Custom banner data (optional - will use defaults if not provided)
  const customBanners = [
    {
      type: "image",
      id: "welcome-banner",
      image: require('@/assets/slider/slider1.png'),
      title: "Welcome to vasbzaar",
      description: "Your trusted partner for all utility payments and recharge services. Get started today!",
    },
    {
      type: "image",
      id: "offers-banner", 
      image: require('@/assets/slider/slider2.png'),
      title: "Special Offers & Rewards",
      description: "Earn instant cashback on mobile recharges, DTH, and bill payments. Limited time offer!",
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <Header 
        {...HeaderPresets.tabs}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Slider Section */}
        <ThemedView style={styles.sliderSection}>
          <SimpleCardSlider
            total_cashback={walletData.total_cashback}
            total_incentive={walletData.total_incentive}
            balance={walletData.balance}
            userData={userData}
            banners={customBanners}
          />
        </ThemedView>
        
        {/* Services Section */}
        <ServicesSection
          onServicePress={handleServicePress}
          onViewAllPress={handleViewAllPress}
        />

        {/* Upcoming Dues Section */}
        <UpcomingDues
          onDuePress={handleDuePress}
        />
      </ScrollView>

      {/* Biometric Setup Modal */}
      <Modal
        visible={showBiometricSetup}
        transparent={true}
        animationType="fade"
        onRequestClose={skipBiometricSetup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons 
              name={biometricAuthType === 'Face ID' ? 'face' : 'fingerprint'} 
              size={64} 
              color="#4CAF50" 
              style={styles.modalIcon}
            />
            
            <ThemedText style={styles.modalTitle}>Enable Quick Login</ThemedText>
            
            <ThemedText style={styles.modalText}>
              Would you like to enable {biometricAuthType.toLowerCase()} authentication for quick and secure access to your account?
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.skipButton]} 
                onPress={skipBiometricSetup}
              >
                <ThemedText style={styles.skipButtonText}>Maybe Later</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.enableButton]} 
                onPress={handleBiometricSetup}
              >
                <ThemedText style={styles.enableButtonText}>Enable</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent overlap with tab navigation
  },
  sliderSection: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 0, // Let slider handle its own margins
    height: 190, // Increased height to accommodate taller cards
    justifyContent: 'center',
  },
  // Biometric Setup Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  enableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
