import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, View, Platform } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrientation } from '../../hooks/useOrientation';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const router = useRouter();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricAuthType, setBiometricAuthType] = useState('');
  const insets = useSafeAreaInsets();
  const { isLandscape, isIPhone16Pro, hasNotch } = useOrientation();

  // Calculate dynamic tab bar height - same logic as in _layout.jsx
  const getTabBarHeight = () => {
    let baseHeight = isLandscape ? 50 : 60;
    
    // Web browser needs extra height for proper label display
    if (Platform.OS === 'web') {
      baseHeight = isLandscape ? 60 : 70;
    }
    
    // Adjust for iPhone 16 Pro and other modern devices
    if (isIPhone16Pro) {
      baseHeight = isLandscape ? 55 : 65;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 70 : 80;
      }
    } else if (hasNotch) {
      baseHeight = isLandscape ? 52 : 62;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 65 : 75;
      }
    }
    
    const bottomSafeArea = insets.bottom;
    return baseHeight + bottomSafeArea;
  };

  // Track focus but without PWA prompt functionality
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 [Home] Screen focused');
      // Version check or other functionality can be added here
    }, [])
  );

  // Check if we need to show biometric setup
  const checkBiometricSetupNeeded = async () => {
    try {
      // Check if there's a temp PIN from successful validation
      const tempPin = await AsyncStorage.getItem('tempPinForBiometric');
      if (!tempPin) {
        // console.log('🏠 No temp PIN found, skipping biometric setup check');
        return;
      }

      // Check if biometric is available on device
      const biometricAvailable = await isBiometricAuthAvailable();
      if (!biometricAvailable.isAvailable) {
        console.log('🏠 Biometric not available, clearing temp PIN');
        await AsyncStorage.removeItem('tempPinForBiometric');
        return;
      }

      // Check if biometric is already set up
      const biometricSetup = await AsyncStorage.getItem('biometricSetup');
      if (biometricSetup === 'true') {
        // console.log('🏠 Biometric already set up, clearing temp PIN');
        await AsyncStorage.removeItem('tempPinForBiometric');
        return;
      }

      // Check if user has declined biometric setup
      const biometricDeclined = await AsyncStorage.getItem('biometricDeclined');
      if (biometricDeclined === 'true') {
        // console.log('🏠 User previously declined biometric setup');
        await AsyncStorage.removeItem('tempPinForBiometric');
        return;
      }

      // All conditions met - show biometric setup
      console.log('🏠 ✅ Showing biometric setup modal');
      const authType = await checkBiometricSupport();
      setBiometricAuthType(authType);
      setShowBiometricSetup(true);
      
    } catch (error) {
      console.error('🏠 ❌ Error checking biometric setup:', error);
    }
  };

  // Check biometric setup on mount with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      checkBiometricSetupNeeded();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSetupBiometric = async () => {
    try {
      const tempPin = await AsyncStorage.getItem('tempPinForBiometric');
      if (!tempPin) {
        Alert.alert('Error', 'PIN not found. Please try again.');
        setShowBiometricSetup(false);
        return;
      }

      const result = await setupBiometricAuth(tempPin);
      if (result.success) {
        // Mark biometric as set up
        await AsyncStorage.setItem('biometricSetup', 'true');
        await AsyncStorage.removeItem('tempPinForBiometric');
        
        Alert.alert(
          'Success', 
          'Biometric authentication has been set up successfully!',
          [{ text: 'OK', onPress: () => setShowBiometricSetup(false) }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to set up biometric authentication');
      }
    } catch (error) {
      console.error('Error setting up biometric:', error);
      Alert.alert('Error', 'Failed to set up biometric authentication');
    }
  };

  const handleSkipBiometric = async () => {
    // Mark as declined and clear temp PIN
    await AsyncStorage.setItem('biometricDeclined', 'true');
    await AsyncStorage.removeItem('tempPinForBiometric');
    setShowBiometricSetup(false);
  };

  const isIPhoneBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  };

  // Handler functions
  const handleNotificationPress = protect(() => {
    router.push('/main/NotificationScreen');
  });

  const handleSearchPress = protect(() => {
    router.push('/main/AllServicesScreen');
  });

  const handleServicePress = protect((service) => {
    const serviceId = service?.id;
    const serviceName = service?.name;
    
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
    try {
      console.log('Due pressed:', due);

      const serviceType = due.serviceType?.toLowerCase();
      console.log('Service type:', serviceType);

      if (serviceType === 'prepaid' || serviceType === 'recharge') {
        const contact = {
          name: due.customerName || 'Customer',
          number: due.operatorNo
        };

        console.log('Navigating to prepaid with:', {
          contactName: contact.name,
          phoneNumber: contact.number,
          operatorData: JSON.stringify(due)
        });

        router.push({
          pathname: '/main/prepaid/RechargePlanScreen',
          params: {
            contactName: contact.name,
            phoneNumber: contact.number,
            operatorData: JSON.stringify(due),
            fromDues: 'true'
          }
        });
      } else if (serviceType === 'dth') {
        console.log('DTH due details:', due);
        
        const dthInfo = {
          customerName: due.customerName,
          operatorNo: due.operatorNo,
          serviceType: due.serviceType,
          circle: due.circle,
          operatorId: due.operatorId?.operatorId || due.operatorId,
          operatorName: due.operatorId?.operatorName || 'DTH Operator',
          logo: due.operatorId?.logo || ''
        };

        console.log('Prepared DTH info:', dthInfo);

        if (!due.operatorId?.opCode) {
          console.error('DTH due missing opCode:', due);
          Alert.alert('Error', 'DTH operator information is incomplete');
          return;
        }
        
        router.push({
          pathname: '/main/dth/DthPlanScreen',
          params: {
            operatorCode: due.operatorId.opCode,
            operator_id: due.operatorId.operatorId || due.operatorId,
            companyLogo: due.operatorId.logo || '',
            operator: due.operatorId.operatorName || 'DTH Operator',
            name: due.customerName || 'Customer',
            dth_info: JSON.stringify(dthInfo),
            fromDues: 'true'
          }
        });
      } else {
        console.log('Bill payment due - operatorId details:', due.operatorId);
        
        const billerInfo = {
          id: due.operatorId?.operatorId || due.operatorId,
          operatorName: due.operatorId?.operatorName || 'Biller',
          logo: due.operatorId?.logo || '',
          opCode: due.operatorId?.opCode,
          inputFields: due.operatorId?.inputFields || {
            field1: {
              label: 'Account Number',
              type: 'text',
              required: true,
              placeholder: 'Enter account number'
            }
          },
          amountExactness: due.operatorId?.amountExactness,
          fetchRequirement: due.operatorId?.fetchRequirement
        };

        console.log('Prepared biller info:', billerInfo);
        
        router.push({
          pathname: '/main/biller/BillerRechargeScreen',
          params: {
            serviceId: due.serviceId || '3',
            biller: JSON.stringify(billerInfo),
            fromDues: 'true'
          }
        });
      }
    } catch (error) {
      console.error('Error handling due press:', error);
      Alert.alert('Error', 'Failed to open due payment');
    }
  });

  return (
    <ThemedView style={styles.container}>
      <Header 
        preset={HeaderPresets.HOME}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: getTabBarHeight() + 20
        }}
      >
        <SimpleCardSlider />
        <ServicesSection onServicePress={handleServicePress} onViewAllPress={handleViewAllPress} />
        <UpcomingDues onDuePress={handleDuePress} />
      </ScrollView>

      {/* Biometric Setup Modal */}
      <Modal
        visible={showBiometricSetup}
        transparent={true}
        animationType="slide"
        onRequestClose={handleSkipBiometric}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons 
              name={biometricAuthType === 'FaceID' ? "face" : "fingerprint"} 
              size={56} 
              color="#000000" 
              style={styles.modalIcon} 
            />
            
            <ThemedText style={styles.modalTitle}>
              Enable {biometricAuthType}?
            </ThemedText>
            
            <ThemedText style={styles.modalText}>
              Use {biometricAuthType} to quickly and securely access your account instead of entering your PIN every time.
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.skipButton]} 
                onPress={handleSkipBiometric}
              >
                <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.enableButton]} 
                onPress={handleSetupBiometric}
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
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  // Biometric Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  enableButton: {
    backgroundColor: '#000000',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});