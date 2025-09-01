import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';
import SimpleCardSlider from '@/components/SimpleCardSlider';
import ServicesSection from '@/components/ServicesSection';
import UpcomingDues from '@/components/UpcomingDues';
import { protect, protectedPush } from '../../utils_old/sessionProtection';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  
  const handleNotificationPress = protect(() => {
    console.log('Notification pressed');
    router.push('/main/NotificationScreen');
  });

  const handleSearchPress = protect(() => {
    console.log('Search pressed');
    router.push('/main/AllServicesScreen');
  });

  const handleServicePress = protect((service) => {
    console.log('Service pressed:', service.title);
    
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
      
      console.log('Processed names - Service:', serviceName, 'Provider:', providerName);
      
      // Determine service type based on service name or provider
      let serviceType = 'other'; // default
      
      if (serviceName.includes('prepaid') || serviceName === 'prepaid' || 
          providerName.includes('prepaid')) {
        serviceType = 'prepaid';
      } else if (serviceName.includes('dth') || serviceName === 'dth' || 
                 providerName.includes('dth')) {
        serviceType = 'dth';
      }
      
      console.log('Determined service type:', serviceType);
      
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
      console.error('Error handling due press:', error);
      Alert.alert('Error', 'Unable to process payment. Please try again.');
    }
  });

  // User data for the card
  const userData = {
    name: 'SHAHID HUSEN MOHD SALEEM',
    mobile: '9226926292'
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
  sliderSection: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 0, // Let slider handle its own margins
    height: 190, // Increased height to accommodate taller cards
    justifyContent: 'center',
  },
});
