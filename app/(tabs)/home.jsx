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
      // Safe string conversion with type checking
      const serviceName = (typeof due.service === 'string' ? due.service.toLowerCase() : 
                          due.service ? String(due.service).toLowerCase() : '') || '';
      const providerName = (typeof due.provider === 'string' ? due.provider.toLowerCase() : 
                           due.provider ? String(due.provider).toLowerCase() : '') || '';
      const originalData = due.originalData || due;
      
      // console.log('Processed names - Service:', serviceName, 'Provider:', providerName);
      
      // Determine service type based on service name or provider
      let serviceType = 'other'; // default
      
      if (serviceName.includes('prepaid') || serviceName === 'prepaid' || 
          providerName.includes('prepaid')) {
        serviceType = 'prepaid';
      } else if (serviceName.includes('dth') || serviceName === 'dth' || 
                 providerName.includes('dth')) {
        serviceType = 'dth';
      }
      
      // console.log('Determined service type:', serviceType);
      
      if (serviceType === 'prepaid') {
        // Navigate to RechargePlanScreen directly
        const operatorData = {
          opCode: originalData.operatorId?.operatorCode || originalData.operatorCode,
          operatorName: due.provider,
          operatorLogo: originalData.operatorId?.logo || originalData.logo,
          serviceId: originalData.operatorId?.serviceId?.id || originalData.serviceId
        };
        
        // Extract phone number safely
        const phoneNumber = originalData.mobile || 
                           (typeof due.number === 'string' ? due.number.replace(/x/g, '') : '') ||
                           '';
        
        router.push({
          pathname: '/main/prepaid/RechargePlanScreen',
          params: {
            contactName: due.provider || 'Unknown',
            phoneNumber: phoneNumber,
            operatorData: JSON.stringify(operatorData),
            serviceId: originalData.operatorId?.serviceId?.id || '1',
            operatorCode: operatorData.opCode || '',
            fromDues: 'true'
          }
        });
        
      } else if (serviceType === 'dth') {
        // For DTH, first fetch DTH info then navigate to DthPlanScreen
        const sessionToken = await AsyncStorage.getItem('sessionToken');
        if (!sessionToken) {
          Alert.alert('Error', 'Session expired. Please login again.');
          return;
        }
        
        // Use require instead of dynamic import to avoid module resolution issues
        const { validateDthNumber } = require('../../services');
        
        // Extract DTH number safely
        const dthNumber = originalData.mobile || originalData.dthNumber || 
                         (typeof due.number === 'string' ? due.number.replace(/x/g, '') : '') ||
                         '';
        
        if (dthNumber) {
          console.log('Validating DTH number:', dthNumber);
          const dthResponse = await validateDthNumber(dthNumber, sessionToken);
          
          if (dthResponse?.status === 'success' && dthResponse?.data) {
            const dthInfo = dthResponse.data;
            const contact = { number: dthNumber, name: due.provider };
            
            router.push({
              pathname: '/main/dth/DthPlanScreen',
              params: {
                contact: JSON.stringify(contact),
                dth_info: JSON.stringify(dthInfo),
                serviceId: originalData.operatorId?.serviceId?.id || 'NA',
                operatorCode: originalData.operatorId?.operatorCode || '',
                operator_id: originalData.operatorId?.id || null,
                fromDues: 'true'
              }
            });
          } else {
            Alert.alert('Error', 'Unable to validate DTH number. Please try again.');
          }
        } else {
          Alert.alert('Error', 'DTH number not available');
        }
        
      } else {
        // For other services, navigate to BillerRechargeScreen with auto-filled data
        // Extract account number safely  
        const accountNumber = originalData.mobile || originalData.accountNumber ||
                             (typeof due.number === 'string' ? due.number.replace(/x/g, '') : '') ||
                             '';
        
        // Extract amount safely
        const amount = originalData.amount ? String(originalData.amount) : '';
        
        const billerData = {
          id: originalData.operatorId?.id || originalData.id,
          operatorName: due.provider || 'Unknown Provider',
          logo: originalData.operatorId?.logo || originalData.logo,
          inputFields: {
            field1: {
              label: 'Account Number',
              type: 'text',
              required: true,
              placeholder: 'Enter account number',
              value: accountNumber // Pre-fill with available data
            },
            field2: {
              label: 'Amount',
              type: 'number', 
              required: true,
              placeholder: 'Enter amount',
              value: amount // Pre-fill amount if available
            }
          },
          amountExactness: originalData.amountExactness || 'false',
          fetchRequirement: originalData.fetchRequirement || 'false'
        };
        
        router.push({
          pathname: '/main/biller/BillerRechargeScreen',
          params: {
            serviceId: originalData.operatorId?.serviceId?.id || originalData.serviceId || '1',
            biller: JSON.stringify(billerData),
            fromDues: 'true'
          }
        });
      }
      
    } catch (error) {
      // console.error('Error handling due press:', error);
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
