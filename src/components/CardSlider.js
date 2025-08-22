import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import Carousel from "react-native-snap-carousel";
import PropTypes from 'prop-types';

import { AuthContext } from '../context/AuthContext';
import { getRecords } from '../Services/ApiServices';

const { width: screenWidth } = Dimensions.get("window");

/**
 * Interactive card slider component that displays user cards and promotional banners.
 * Combines user cashback/incentive information with dynamic banner content from API.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {number} [props.total_cashback=0] - Total cashback amount to display
 * @param {number} [props.total_incentive=0] - Total incentive amount to display
 * @param {Object} props.userData - User data object containing name and mobile
 * @param {string} [props.userData.name] - User's name
 * @param {string} [props.userData.mobile] - User's mobile number
 * @returns {React.ReactElement} The rendered CardSlider component
 * 
 * @example
 * // Basic card slider with user data
 * <CardSlider 
 *   total_cashback={1500}
 *   total_incentive={500}
 *   userData={{ name: "John Doe", mobile: "9876543210" }}
 * />
 */
const CardSlider = ({total_cashback, total_incentive, userData}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  // Initialize with user card immediately
  const [data, setData] = useState(() => [{
    type: "card",
    id: "user-card",
    name: userData?.name || "User",
    number: `XXX XXX XXX ${userData?.mobile?.slice(-3) || "XXX"}`,
    cashback: `₹ ${total_cashback || 0}`,
    incentives: `₹ ${total_incentive || 0}`,
    backgroundColor: "#000000",
    textColor: "white",
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  
  const authContext = useContext(AuthContext);
  const { userToken } = authContext;

  /**
   * Creates user card data object with cashback and incentive information
   * @function createUserCard
   * @returns {Object} User card data object
   */
  const createUserCard = () => ({
    type: "card",
    id: "user-card",
    name: userData?.name || "User",
    number: `XXX XXX XXX ${userData?.mobile?.slice(-3) || "XXX"}`,
    cashback: `₹ ${total_cashback || 0}`,
    incentives: `₹ ${total_incentive || 0}`,
    backgroundColor: "#000000",
    textColor: "white",
  });

  /**
   * Transforms API banner data to slider format
   * @function transformBannerData
   * @param {Array} banners - Array of banner objects from API
   * @returns {Array} Transformed banner data for slider
   */
  const transformBannerData = (banners) => {
    return banners.map((banner) => ({
      type: "image",
      id: `banner-${banner.id}`,
      image: { uri: banner.banner },
      title: banner.title,
      description: banner.description,
      datetime: banner.datetime,
      screen: banner.screen,
      status: banner.status,
    }));
  };

  /**
   * Fetches slider images and banner data from API
   * @async
   * @function fetchSliderImages
   */
  const fetchSliderImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create user card first
      const userCard = createUserCard();
      
      if (!userToken) {
        setData([userCard]);
        return;
      }

      const response = await getRecords(
        { status: 'home' },
        userToken,
        'api/customer/advertisement/getByStatus'
      );

      if (response?.status === "success" && response?.data && Array.isArray(response.data)) {
        // Transform banner data
        const bannerSlides = transformBannerData(response.data);
        
        // Combine user card with banner slides
        const combinedData = [userCard, ...bannerSlides];
        setData(combinedData);
      } else {
        setData([userCard]);
      }
    } catch (error) {
      setError(error.message);
      
      // Fallback to user card only if API fails
      const userCard = createUserCard();
      setData([userCard]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles slide press to show modal with additional information
   * @function handleSlidePress
   * @param {Object} item - Slide item data
   */
  const handleSlidePress = (item) => {
    // Only show modal for image slides with title or description
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

  // Update the user card when props change
  useEffect(() => {
    setData(prevData => {
      const userCard = createUserCard();
      if (prevData.length > 0 && prevData[0].type === "card") {
        // Replace the existing user card
        return [userCard, ...prevData.slice(1)];
      }
      return [userCard, ...prevData];
    });
  }, [userData, total_cashback, total_incentive]);

  // Load slider data on component mount and token change
  useEffect(() => {
    fetchSliderImages();
  }, [userToken]);

  const renderItem = ({ item }) => {
    if (item.type === "card") {
      return (
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: item.backgroundColor }]}
          onPress={() => handleSlidePress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardTop}>
            <Text style={[styles.name, { color: item.textColor }]}>{item.name}</Text>
            <Text style={[styles.cardNumber, { color: item.textColor }]}>{item.number}</Text>
          </View>
          
          <View style={styles.cardBottom}>
            <View style={styles.leftColumn}>
              <Text style={[styles.label, { color: item.textColor }]}>Lifetime Cashback</Text>
              <Text style={[styles.label, { color: item.textColor }]}>Lifetime Incentives</Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={[styles.value, { color: item.textColor }]}>{item.cashback}</Text>
              <Text style={[styles.value, { color: item.textColor }]}>{item.incentives}</Text>
            </View>
          </View>
        </TouchableOpacity>
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
            onError={() => {
              // Handle image loading error silently
            }}
          />
          {/* Show tap indicator only if there's content to display */}
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

    return null;
  };

  // Always render the carousel with at least the user card

  return (
    <View style={styles.carouselContainer}>
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
      />
      
      {/* Show error message if API failed but we have fallback data */}
      {error && data.length === 1 && (
        <Text style={styles.errorText}>
          Banner images couldn't be loaded
        </Text>
      )}
      
      {/* Popup Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header with Close Button */}
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
                bounces={true}
              >
                {/* Responsive Modal Image */}
                {selectedSlide.image && (
                  <TouchableOpacity 
                    style={styles.modalImageContainer}
                    activeOpacity={1}
                  >
                    <Image 
                      source={selectedSlide.image} 
                      style={styles.modalImage} 
                      resizeMode="contain"
                    />
                    <View style={styles.imageOverlayInfo}>
                      <Text style={styles.swipeHint}>Swipe down to close</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Modal Content */}
                <View style={styles.modalContent}>
                  {selectedSlide.title && (
                    <View style={styles.titleContainer}>
                      <MaterialIcons name="info" size={24} color="#8400E5" />
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
                  
                  {selectedSlide.datetime && (
                    <View style={styles.dateContainer}>
                      <MaterialIcons name="schedule" size={20} color="#666" />
                      <Text style={styles.modalDate}>
                        {new Date(selectedSlide.datetime).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  
                  {/* Additional Info */}
                  <View style={styles.additionalInfo}>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="touch-app" size={20} color="#666" />
                      <Text style={styles.infoText}>Tap anywhere outside to close</Text>
                    </View>
                  </View>
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
    height: 180,
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
  errorText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  card: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    padding: 20,
    justifyContent: "space-between",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardTop: {
    flex: 1,
    justifyContent: "flex-start",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 16,
    opacity: 0.9,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  // Tap indicator styles
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
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalDate: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  additionalInfo: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    fontStyle: "italic",
  },
  imageOverlayInfo: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  swipeHint: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
});

// PropTypes validation
CardSlider.propTypes = {
  total_cashback: PropTypes.number,
  total_incentive: PropTypes.number,
  userData: PropTypes.shape({
    name: PropTypes.string,
    mobile: PropTypes.string,
  }),
};

CardSlider.defaultProps = {
  total_cashback: 0,
  total_incentive: 0,
  userData: {
    name: 'User',
    mobile: '',
  },
};

export default CardSlider;