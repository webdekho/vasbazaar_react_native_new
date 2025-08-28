import React, { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Dimensions, 
  Image, 
  Modal, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import Carousel from "react-native-snap-carousel";
import PropTypes from 'prop-types';

const { width: screenWidth } = Dimensions.get("window");

/**
 * Interactive card slider component that displays user cards and promotional banners.
 * Combines user wallet information with dynamic banner content.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {number} [props.total_cashback=0] - Total cashback amount to display
 * @param {number} [props.total_incentive=0] - Total incentive amount to display
 * @param {string} [props.balance=0] - Current wallet balance
 * @param {Object} props.userData - User data object containing name and mobile
 * @param {string} [props.userData.name] - User's name
 * @param {string} [props.userData.mobile] - User's mobile number
 * @param {Array} [props.banners] - Array of banner images for slider
 * @returns {React.ReactElement} The rendered CardSlider component
 */
const CardSlider = ({
  total_cashback = 0, 
  total_incentive = 0, 
  balance = "748.31",
  userData,
  banners = []
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);

  /**
   * Creates user card data object with wallet information
   * @function createUserCard
   * @returns {Object} User card data object
   */
  const createUserCard = () => ({
    type: "card",
    id: "user-card",
    name: userData?.name || "SHAHID HUSEN MOHD SALEEM",
    number: `5432  1098  7654  ${userData?.mobile?.slice(-4) || "3210"}`,
    balance: `₹ ${balance}`,
    cashback: `₹ ${total_cashback}`,
    incentives: `₹ ${total_incentive}`,
    backgroundColor: "#000000",
    textColor: "white",
    cardType: "VISA"
  });

  /**
   * Creates default banner slides
   * @function createDefaultBanners
   * @returns {Array} Array of default banner objects
   */
  const createDefaultBanners = () => [
    {
      type: "image",
      id: "banner-1",
      image: { uri: 'https://via.placeholder.com/350x180/FF6B35/FFFFFF?text=Welcome+to+VAS+Bazaar' },
      title: "Welcome to vasbzaar",
      description: "Your one-stop solution for all utility payments and recharge services",
    },
    {
      type: "image", 
      id: "banner-2",
      image: { uri: 'https://via.placeholder.com/350x180/0066CC/FFFFFF?text=Mobile+Recharge+Cashback' },
      title: "Mobile Recharge Cashback",
      description: "Get instant cashback on mobile recharges. Limited time offer!",
    },
    {
      type: "image",
      id: "banner-3", 
      image: { uri: 'https://via.placeholder.com/350x180/28A745/FFFFFF?text=Bill+Payment+Rewards' },
      title: "Bill Payment Rewards",
      description: "Pay your utility bills and earn reward points with every transaction",
    }
  ];

  /**
   * Initialize slider data with user card and banners
   * @function initializeSliderData
   */
  const initializeSliderData = () => {
    setLoading(true);
    
    const userCard = createUserCard();
    const sliderBanners = banners.length > 0 ? banners : createDefaultBanners();
    
    const combinedData = [userCard, ...sliderBanners];
    setData(combinedData);
    setLoading(false);
  };

  /**
   * Handles slide press to show modal with additional information
   * @function handleSlidePress
   * @param {Object} item - Slide item data
   */
  const handleSlidePress = (item) => {
    if (item.type === "image" && (item.title || item.description)) {
      setSelectedSlide(item);
      setModalVisible(true);
    }
  };

  /**
   * Closes the detail modal
   * @function closeModal
   */
  const closeModal = () => {
    setModalVisible(false);
    setSelectedSlide(null);
  };

  // Initialize data on component mount and when props change
  useEffect(() => {
    initializeSliderData();
  }, [userData, total_cashback, total_incentive, balance, banners]);

  const renderItem = ({ item, index }) => {
    if (!item) {
      return <View style={styles.emptySlide} />;
    }

    if (item.type === "card") {
      return (
        <View style={[styles.card, { backgroundColor: item.backgroundColor || '#000000' }]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: item.textColor || 'white' }]}>vasbzaar</Text>
            <MaterialIcons name="credit-card" size={28} color={item.textColor || 'white'} />
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <Text style={[styles.balanceLabel, { color: item.textColor || 'white' }]}>Available Balance</Text>
            <Text style={[styles.balanceAmount, { color: item.textColor || 'white' }]}>{item.balance || '₹0'}</Text>
          </View>

          {/* Card Number */}
          <View style={styles.cardNumberSection}>
            <Text style={[styles.cardNumber, { color: item.textColor || 'white' }]}>{item.number || '****  ****  ****  ****'}</Text>
          </View>

          {/* Card Bottom Info */}
          <View style={styles.cardBottom}>
            <View style={styles.leftColumn}>
              <Text style={[styles.label, { color: item.textColor || 'white' }]}>Lifetime Cashback</Text>
              <Text style={[styles.label, { color: item.textColor || 'white' }]}>Lifetime Incentives</Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={[styles.value, { color: item.textColor || 'white' }]}>{item.cashback || '₹0'}</Text>
              <Text style={[styles.value, { color: item.textColor || 'white' }]}>{item.incentives || '₹0'}</Text>
            </View>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          
          {/* Card Holder Name */}
          <View style={styles.cardHolderSection}>
            <Text style={[styles.cardHolderName, { color: item.textColor || 'white' }]}>{item.name || 'USER'}</Text>
          </View>
        </View>
      );
    } else if (item.type === "image") {
      return (
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => handleSlidePress(item)}
          activeOpacity={0.9}
        >
          <Image 
            source={item.image} 
            style={styles.image} 
            resizeMode="cover"
            onError={(error) => {
              console.log('Image load error:', error);
            }}
          />
          {(item.title || item.description) && (
            <View style={styles.tapIndicatorOverlay}>
              <View style={styles.tapIndicator}>
                <MaterialIcons name="touch-app" size={16} color="#fff" />
                <Text style={styles.tapText}>Tap for details</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return <View style={styles.emptySlide} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      {data.length > 0 ? (
        <Carousel
          data={data}
          renderItem={renderItem}
          sliderWidth={screenWidth}
          itemWidth={screenWidth * 0.9}
          inactiveSlideScale={0.95}
          inactiveSlideOpacity={0.7}
          contentContainerCustomStyle={{
            paddingHorizontal: screenWidth * 0.05,
          }}
          onSnapToItem={(index) => setActiveSlide(index)}
          loop={data.length > 1}
          autoplay={data.length > 1}
          autoplayDelay={3000}
          autoplayInterval={5000}
          enableMomentum={false}
          lockScrollWhileSnapping={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
      
      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedSlide && (
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Modal Image */}
                {selectedSlide.image && (
                  <View style={styles.modalImageContainer}>
                    <Image 
                      source={selectedSlide.image} 
                      style={styles.modalImage} 
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                {/* Modal Content */}
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
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  emptySlide: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  // Card Styles
  card: {
    width: "100%",
    height: 200,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  balanceSection: {
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  cardNumberSection: {
    marginBottom: 15,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    opacity: 0.8,
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardHolderSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  // Decorative Elements
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
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
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
    overflow: "hidden",
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
    aspectRatio: 16 / 9,
    backgroundColor: "#f0f0f0",
  },
  modalImage: {
    width: "100%",
    height: "100%",
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
});

CardSlider.propTypes = {
  total_cashback: PropTypes.number,
  total_incentive: PropTypes.number,
  balance: PropTypes.string,
  userData: PropTypes.shape({
    name: PropTypes.string,
    mobile: PropTypes.string,
  }),
  banners: PropTypes.array,
};

CardSlider.defaultProps = {
  total_cashback: 0,
  total_incentive: 0,
  balance: "748.31",
  userData: {
    name: 'SHAHID HUSEN MOHD SALEEM',
    mobile: '9226926292',
  },
  banners: [],
};

export default CardSlider;