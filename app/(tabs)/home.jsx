import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';
import SimpleCardSlider from '@/components/SimpleCardSlider';
import ServicesSection from '@/components/ServicesSection';
import UpcomingDues from '@/components/UpcomingDues';
import { protect, protectedPush } from '../utils/sessionProtection';

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

  const handleDuePress = protect((due) => {
    console.log('Due pressed:', due.provider);
    // Navigate to bill payment for this due
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
