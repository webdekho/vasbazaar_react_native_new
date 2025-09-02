import React, { useEffect, useState, useRef } from "react";
import { 
  StyleSheet, 
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHomeAdvertisements, getUserBalance } from '../services';

const { width: screenWidth } = Dimensions.get("window");

const SimpleCardSlider = ({
  total_cashback = 0, 
  total_incentive = 0, 
  balance = "748.31",
  userData,
  banners = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [apiBanners, setApiBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [userDataFromStorage, setUserDataFromStorage] = useState(null);
  const [balanceData, setBalanceData] = useState({
    balance: "748.31",
    cashback: "0.00",
    incentive: "0.00",
    referralBonus: "0.00"
  });
  const scrollViewRef = useRef(null);

  const createUserCard = () => {
    // Use localStorage data first, then props as fallback
    const displayUserData = userDataFromStorage || userData;
    
    return {
      type: "card",
      id: "user-card",
      name: displayUserData?.name || "SHAHID HUSEN MOHD SALEEM",
      number: `5432  1098  7654  ${displayUserData?.mobile?.slice(-4) || "3210"}`,
      balance: `₹ ${balanceData.balance}`,
      cashback: `₹ ${balanceData.cashback}`, // Show real API value
      incentives: `₹ ${balanceData.incentive}`, // Show real API value
      backgroundColor: "#000000",
      textColor: "white",
    };
  };

  const createDefaultBanners = () => [
    {
      type: "image",
      id: "banner-1",
      image: require('@/assets/slider/slider1.png'),
      title: "Welcome to vasbzaar",
      description: "Your one-stop solution for all utility payments and recharge services",
    },
    {
      type: "image", 
      id: "banner-2",
      image: require('@/assets/slider/slider2.png'),
      title: "Special Offers",
      description: "Get instant cashback on mobile recharges, DTH, and bill payments. Limited time offer!",
    }
  ];

  // Load user data from localStorage
  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserDataFromStorage(parsed);
        // console.log('Loaded user data from localStorage:', parsed.name, parsed.mobile);
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }
  };

  // Fetch user balance from API
  const fetchUserBalance = async () => {
    try {
      // console.log('Fetching user balance for card...');
      
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        console.log('No session token found, using default balance');
        return;
      }

      const response = await getUserBalance(sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        // console.log('Successfully fetched balance data:', response.data);
        setBalanceData(response.data);
      } else {
        console.log('Failed to fetch balance:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  // Fetch advertisements from API
  const fetchAdvertisements = async () => {
    try {
      setLoadingBanners(true);
      // console.log('Fetching home advertisements...');
      
      // Get user's session token (access_token)
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.log('No session token found, using default banners');
        setApiBanners([]);
        setLoadingBanners(false);
        return;
      }

      const response = await getHomeAdvertisements(sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        // console.log('Successfully fetched advertisements:', response.data.length);
        setApiBanners(response.data);
      } else {
        console.log('Failed to fetch advertisements:', response?.message);
        setApiBanners([]);
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setApiBanners([]);
    } finally {
      setLoadingBanners(false);
    }
  };

  const initializeSliderData = () => {
    const userCard = createUserCard();
    
    // Priority: API banners > props banners > default banners
    let sliderBanners = [];
    if (apiBanners.length > 0) {
      sliderBanners = apiBanners;
      // console.log('Using API banners:', apiBanners.length);
    } else if (banners.length > 0) {
      sliderBanners = banners;
      // console.log('Using props banners:', banners.length);
    } else {
      sliderBanners = createDefaultBanners();
      console.log('Using default banners');
    }
    
    const combinedData = [userCard, ...sliderBanners];
    setData(combinedData);
  };

  // Load data on component mount
  useEffect(() => {
    loadUserData();
    fetchUserBalance();
    fetchAdvertisements();
  }, []);

  // Update slider data when dependencies change
  useEffect(() => {
    initializeSliderData();
  }, [userData, userDataFromStorage, balanceData, banners, apiBanners]);

  // Auto scroll functionality
  useEffect(() => {
    if (data.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % data.length;
        setCurrentIndex(nextIndex);
        const slideWidth = (screenWidth - 40) + 10; // Card width + gap
        scrollViewRef.current?.scrollTo({
          x: nextIndex * slideWidth,
          animated: true
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentIndex, data.length]);

  const handleScroll = (event) => {
    const slideWidth = (screenWidth - 40) + 10; // Card width + gap
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(index);
  };

  const handleSlidePress = (item) => {
    if (item.type === "image" && 
        ((item.title && item.title.trim() !== '') || 
         (item.description && item.description.trim() !== ''))) {
      setSelectedSlide(item);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedSlide(null);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    const slideWidth = (screenWidth - 40) + 10; // Card width + gap
    scrollViewRef.current?.scrollTo({
      x: index * slideWidth,
      animated: true
    });
  };

  const renderCard = (item) => (
    <View style={[styles.card, { backgroundColor: item.backgroundColor }]}>
      {/* Card Holder Name at Top */}
      <View style={styles.cardNameSection}>
        <Text style={[styles.cardHolderName, { color: item.textColor }]}>{item.name}</Text>
      </View>

      {/* Masked Card Number */}
      <View style={styles.cardNumberSection}>
        <Text style={[styles.cardNumber, { color: item.textColor }]}>XXX XXX XXX {(userDataFromStorage || userData)?.mobile?.slice(-3) || "292"}</Text>
      </View>

      {/* Bottom Section with Cashback and Incentives */}
      <View style={styles.cardBottomSection}>
        <View style={styles.leftColumn}>
          <Text style={[styles.lifetimeLabel, { color: item.textColor }]}>Lifetime Cashback</Text>
          <Text style={[styles.lifetimeLabel, { color: item.textColor }]}>Lifetime Incentives</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={[styles.lifetimeValue, { color: item.textColor }]}>{item.cashback}</Text>
          <Text style={[styles.lifetimeValue, { color: item.textColor }]}>{item.incentives}</Text>
        </View>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </View>
  );

  const renderImage = (item) => (
    <TouchableOpacity 
      style={styles.imageContainer}
      onPress={() => handleSlidePress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={item.image} 
        style={styles.image}
      />
      {(item.title && item.title.trim() !== '') || (item.description && item.description.trim() !== '') ? (
        <View style={styles.tapIndicatorOverlay}>
          <View style={styles.tapIndicator}>
            <MaterialIcons name="touch-app" size={16} color="#fff" />
            <Text style={styles.tapText}>Tap for details</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loadingBanners && data.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading banners...</Text>
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        snapToInterval={(screenWidth - 40) + 10} // Card width + gap
        snapToAlignment="start"
        decelerationRate="fast"
        autoplayInterval={5000} // 7 seconds
        loop={true}
      >
        {data.map((item, index) => (
          <View key={item.id} style={[styles.slideContainer, index === data.length - 1 ? styles.lastSlide : null]}>
            {item.type === "card" ? renderCard(item) : renderImage(item)}
          </View>
        ))}
      </ScrollView>


      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedSlide && (
              <ScrollView style={styles.modalScrollView}>
                {selectedSlide.image && (
                  <View style={styles.modalImageContainer}>
                    <Image 
                      source={selectedSlide.image} 
                      style={styles.modalImage} 
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                <View style={styles.modalContent}>
                  {selectedSlide.title && (
                    <View style={styles.titleContainer}>
                      <MaterialIcons name="info" size={24} color="#FF6B35" />
                      <Text style={styles.modalTitle}>
                        {selectedSlide.title}
                      </Text>
                    </View>
                  )}
                  
                  {selectedSlide.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Description</Text>
                      <Text style={styles.modalDescription}>
                        {selectedSlide.description}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    width: screenWidth,
  },
  scrollContent: {
    alignItems: 'center',
    paddingLeft: 15, // Fixed left padding for consistent spacing
    paddingRight: 15, // Fixed right padding for consistent spacing
  },
  slideContainer: {
    width: screenWidth - 40, // Full width minus left/right margins (20px each side)
    marginRight: 10, // Gap between slides
  },
  lastSlide: {
    marginRight: 0, // Remove margin from last slide
  },
  // Card Styles
  card: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardNameSection: {
    marginBottom: 20,
  },
  cardHolderName: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardNumberSection: {
    marginBottom: 30,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 2,
  },
  cardBottomSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  lifetimeLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
  },
  lifetimeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -40,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -20,
  },
  // Image Styles
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    position: "relative",
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    resizeMode: 'cover', // Ensure image covers the entire container
  },
  tapIndicatorOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tapIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  tapText: {
    color: "#fff",
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "500",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "90%",
    height: "90%",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  modalScrollView: {
    flex: 1,
  },
  modalImageContainer: {
    width: "100%",
    height: 280,
    backgroundColor: "#f5f5f5",
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  modalContent: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    flex: 1,
    marginLeft: 10,
    lineHeight: 32,
  },
  descriptionContainer: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: "#444",
    lineHeight: 26,
  },
  // Loading Styles
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    marginHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
});

export default SimpleCardSlider;