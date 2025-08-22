import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Button, Card, IconButton, Searchbar } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import Carousel from 'react-native-snap-carousel';
import { MaterialIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';

const { width: screenWidth } = Dimensions.get('window');

/**
 * ContactList component for displaying and managing contacts for mobile recharge
 * 
 * Features:
 * - Advertisement carousel with tap to view details
 * - Contact list with search functionality
 * - My Number quick access
 * - Contact selection from device contacts
 * - Operator and circle detection
 * - Modal for contact search and selection
 * - Loading states and error handling
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing service parameters
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} The ContactList component
 */
export default function ContactList({ route, navigation }) {
  const [contacts, setContacts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [advertisementImages, setAdvertisementImages] = useState([]);
  const [adLoading, setAdLoading] = useState(false);
  const carouselRef = useRef(null);
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;
  const [btnLoading, setBtnLoading] = useState(false);
  const serviceId = route.params?.serviceId || 0;
  const [loadingNumber, setLoadingNumber] = useState(null);
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [carouselReady, setCarouselReady] = useState(false);

  // Fallback static images
  const fallbackImages = [
    {
      id: 'fallback-1',
      uri: null,
      isStaticImage: true,
      image: require('../../../../assets/images/slider1.png'),
      title: 'Recharge Offers',
      description: 'Get amazing cashback on mobile recharges'
    },
    {
      id: 'fallback-2', 
      uri: null,
      isStaticImage: true,
      image: require('../../../../assets/images/slider2.png'),
      title: 'Special Discounts',
      description: 'Save more on every recharge'
    }
  ];

  // Create contact list with userData.mobile included in search
  const contactsWithMyNumber = () => {
    const contactList = [];
    
    // Add userData.mobile as "My Number" for search functionality
    if (userData?.mobile) {
      const cleanMobile = userData.mobile.replace(/^(\+91)/, '');
      contactList.push({
        id: 'my-number',
        name: 'My Number',
        number: cleanMobile,
        phoneNumbers: [{ number: cleanMobile }],
        isMyNumber: true,
      });
    }
    
    // Add existing contacts with proper IDs
    const contactsWithIds = contacts.map((contact, index) => ({
      ...contact,
      id: contact.id || `contact-${index}`
    }));
    
    return [...contactList, ...contactsWithIds];
  };

  // Fetch advertisement banners from API
  const fetchAdvertisements = async () => {
    try {
      setAdLoading(true);
      
      if (!userToken) {
        setAdvertisementImages(fallbackImages);
        return;
      }

      const response = await getRecords(
        { status: 'Mobile_Recharge' },
        userToken,
        'api/customer/advertisement/getByStatus'
      );

      if (response?.status === "success" && response?.data && Array.isArray(response.data)) {
        
        // Transform API response to image format with proper IDs
        const apiImages = response.data.map((banner, index) => ({
          id: banner.id ? `api-${banner.id}` : `api-banner-${index}`,
          uri: banner.banner,
          title: banner.title,
          description: banner.description,
          isApiImage: true,
        }));

        if (apiImages.length > 0) {
          setAdvertisementImages(apiImages);
        } else {
          setAdvertisementImages(fallbackImages);
        }
      } else {
        setAdvertisementImages(fallbackImages);
      }
    } catch (error) {
      setAdvertisementImages(fallbackImages);
    } finally {
      setAdLoading(false);
    }
  };

  // Handle advertisement click to show popup
  const handleAdPress = (item) => {
    if (item.title || item.description) {
      setSelectedAd(item);
      setAdModalVisible(true);
    }
  };

  // Close advertisement modal
  const closeAdModal = () => {
    setAdModalVisible(false);
    setSelectedAd(null);
  };

  useEffect(() => {
    // Initialize with fallback images first
    setAdvertisementImages(fallbackImages);
    loadContacts();
    
    // Force carousel to be ready after a brief delay
    setTimeout(() => {
      setCarouselReady(true);
      fetchAdvertisements();
    }, 200);
  }, []);

  const loadContacts = async () => {
    if (Platform.OS === 'web') return;

    try {
      setIsLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow contact access from Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Load contacts with name fields
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers
        ],
      });

      const valid = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
      setContacts(valid);
      setFilteredContacts(contactsWithMyNumber());
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setSearchText('');
    setFilteredContacts(contactsWithMyNumber());
    setModalVisible(true);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    const query = text.trim().toLowerCase();

    if (query === '') {
      setFilteredContacts(contactsWithMyNumber());
      return;
    }
    
    // Fast and simple search - no logging
    const filtered = contactsWithMyNumber().filter((contact) => {
      // Check name field
      if (contact.name && contact.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check firstName + lastName
      const firstName = contact.firstName || '';
      const lastName = contact.lastName || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      
      if (fullName && fullName.includes(query)) {
        return true;
      }
      
      // Check phone numbers (only if query contains digits)
      const queryDigits = query.replace(/\D/g, '');
      if (queryDigits.length > 0) {
        // Check phoneNumbers array
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const numberMatch = contact.phoneNumbers.some(phone => {
            const number = (phone.number || '').replace(/\D/g, '');
            return number.includes(queryDigits);
          });
          if (numberMatch) return true;
        }
        
        // Check direct number field (My Number)
        if (contact.number && contact.number.replace(/\D/g, '').includes(queryDigits)) {
          return true;
        }
      }
      
      return false;
    });

    // If no matches and query looks like a number, add "Enter Number" option
    if (filtered.length === 0 && /^\d{6,}$/.test(query.replace(/\D/g, ''))) {
      setFilteredContacts([
        { 
          id: 'new-number',
          name: 'Enter Number', 
          number: query.replace(/\D/g, ''), 
          isNew: true,
          phoneNumbers: [{ number: query.replace(/\D/g, '') }]
        }
      ]);
    } else {
      setFilteredContacts(filtered);
    }
  };

  // Fetch Plan By Operator
  const fetchOperatorAndCircle = async (contact, mobile_number) => {
    try {
      const response = await postRequest(
        { mobile: mobile_number },
        userToken,
        'api/customer/operator/fetchOperatorCircle'
      );
      if (response?.status === 'success') {
        const data = response.data;
        console.log('data:', data);
        navigation.navigate('RechargePlan', {
          contact,
          OperatorCircle: data,
          serviceId,
        });
        return data;
      } else {
        Alert.alert('Error', response?.message || 'Something went wrong.');
        return null;
      }
    } catch (error) {
      console.log('fetchOperatorAndCircle Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      return null;
    }
  };

  const handleRecharge = async (contact) => {
    try {
      const name = contact.name || 'No Name';
      const number = contact.number || contact.phoneNumbers?.[0]?.number || contact.phoneNumbers?.[0]?.digits;

      if (!number) {
        Alert.alert('Error', 'No valid phone number found.');
        return;
      }

      const cleanNumber = number.replace(/^(\+91)/, '').replace(/\D/g, '');
      
      if (cleanNumber.length < 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
        return;
      }

      const contactObj = { name, number: cleanNumber };

      setLoadingNumber(cleanNumber);
      await fetchOperatorAndCircle(contactObj, cleanNumber);
    } catch (error) {
      console.error('Recharge error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoadingNumber(null);
      setModalVisible(false);
    }
  };

  const renderMyNumber = () => {
    if (!userData?.mobile) return null;

    const cleanMobile = userData.mobile.replace(/^(\+91)/, '');
    const initial = 'M'; // M for My Number
    const isLoading = loadingNumber === cleanMobile;

    return (
      <Card style={styles.myNumberCard}>
        <Card.Title
          title="My Number"
          subtitle={cleanMobile}
          titleStyle={styles.myNumberTitle}
          subtitleStyle={styles.myNumberSubtitle}
          left={(props) => (
            <Avatar.Text 
              size={props.size}
              label={initial} 
              style={styles.myNumberAvatar}
              labelStyle={styles.avatarLabel}
            />
          )}
          right={() =>
            cleanMobile && cleanMobile.length >= 10 && (
              <Button
                mode="contained"
                onPress={() => handleRecharge({
                  name: 'My Number',
                  number: cleanMobile,
                  isMyNumber: true
                })}
                style={styles.myNumberButton}
                labelStyle={styles.rechargeButtonLabel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  'Recharge'
                )}
              </Button>
            )
          }
        />
      </Card>
    );
  };

  const renderContactItem = ({ item, index }) => {
    const name = item.name || item.firstName || item.lastName || 'No Name';
    const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';
    const number = item.number || item.phoneNumbers?.[0]?.number || 'No number';
    const cleanedNumber = number.replace(/^(\+91)/, '').replace(/\D/g, '');
    const initial = displayName?.charAt(0)?.toUpperCase() || '?';
    const isLoading = loadingNumber === cleanedNumber;
    const contactKey = item.id || `contact-${index}`;

    return (
      <View key={contactKey}>
        <Card style={styles.card}>
          <Card.Title
            title={displayName}
            subtitle={number}
            titleStyle={styles.cardTitle}
            subtitleStyle={styles.cardSubtitle}
            left={(props) => (
              <Avatar.Text 
                size={props.size}
                label={initial} 
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
            )}
            right={() =>
              number !== 'No number' && cleanedNumber.length >= 10 && (
                <Button
                  mode="contained"
                  onPress={() => handleRecharge(item)}
                  style={styles.rechargeButton}
                  labelStyle={styles.rechargeButtonLabel}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    'Recharge'
                  )}
                </Button>
              )
            }
          />
        </Card>
      </View>
    );
  };

  const renderAdvertisementItem = ({ item, index }) => {
    // Handle both API images and fallback static images
    const imageSource = item.isStaticImage ? item.image : item.isApiImage ? { uri: item.uri } : item;
    
    return (
      <View key={item.id || `ad-${index}`}>
        <TouchableOpacity 
          style={styles.advertisementWrapper}
          onPress={() => handleAdPress(item)}
          activeOpacity={0.9}
        >
          <Image 
            source={imageSource} 
            style={styles.advertisementImage} 
            resizeMode="cover"
            onError={(error) => {
              console.error('Error loading advertisement image:', error.nativeEvent?.error);
            }}
            onLoad={() => {
              if (item.isApiImage) {
                console.log('API advertisement image loaded successfully:', item.uri);
              }
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
      </View>
    );
  };

  // Component render
  return (
    <>
      <CommonHeader2 heading="Contact List" />
      <View style={styles.container}>
        {/* Advertisement Carousel */}
        <View style={styles.advertisementContainer}>
          {adLoading && advertisementImages.length === 0 ? (
            <View style={styles.adLoadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.adLoadingText}>Loading advertisements...</Text>
            </View>
          ) : advertisementImages.length > 0 && carouselReady ? (
            <View style={{ width: screenWidth, alignItems: 'center' }}>
              <Carousel
                ref={carouselRef}
                data={advertisementImages}
                renderItem={renderAdvertisementItem}
                sliderWidth={screenWidth}
                itemWidth={screenWidth * 0.93}
                autoplay={advertisementImages.length > 1}
                loop={advertisementImages.length > 1}
                autoplayDelay={3000}
                autoplayInterval={4000}
                enableMomentum={false}
                lockScrollWhileSnapping={true}
                inactiveSlideScale={0.94}
                inactiveSlideOpacity={0.7}
                useScrollView={false}
                firstItem={0}
                removeClippedSubviews={false}
                onSnapToItem={(index) => console.log('Carousel snapped to item:', index)}
              />
            </View>
          ) : advertisementImages.length > 0 ? (
            <View style={styles.adLoadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.adLoadingText}>Initializing slider...</Text>
            </View>
          ) : (
            <View style={styles.adLoadingContainer}>
              <Text style={styles.adLoadingText}>No advertisements available</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={openModal}>
          <View style={styles.searchBarContent}>
            <IconButton icon="magnify" size={20} iconColor="#666" />
            <Text style={styles.searchBarText}>
               Search by name or number
            </Text>
          </View>
          <IconButton icon="cellphone" size={20} iconColor="#333" />
        </TouchableOpacity>

        {/* My Number Section */}
        {renderMyNumber()}
        
        {/* Contact List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id || index.toString()}
            ListHeaderComponent={
              contacts.length > 0 ? (
                <Text style={styles.sectionHeader}>Contact List</Text>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No contacts found</Text>
                  <Text style={styles.emptySubText}>
                    You can still search for numbers using the search bar above
                  </Text>
                </View>
              )
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={renderContactItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  
                </View>
              ) : null
            }
          />
        )}

        {/* Search Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <IconButton 
                icon="close" 
                onPress={() => setModalVisible(false)}
                iconColor="#000"
                style={styles.closeButton}
              />
              <Searchbar
                placeholder="Search by name or number"
                onChangeText={handleSearch}
                value={searchText}
                style={styles.modalSearchInput}
                inputStyle={styles.searchInputText}
                autoFocus={true}
                iconColor="#666"
                maxLength={15}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => item.id || `filtered-${index}`}
              renderItem={({ item, index }) => {
                const itemKey = item.id || `modal-item-${index}`;
                
                if (item.isMyNumber) {
                  // Render My Number with special styling in modal
                  const cleanedNumber = item.number.replace(/^(\+91)/, '').replace(/\D/g, '');
                  const isLoading = loadingNumber === cleanedNumber;

                  return (
                    <View key={itemKey}>
                      <Card style={styles.myNumberCard}>
                        <Card.Title
                          title="My Number"
                          subtitle={item.number}
                          titleStyle={styles.myNumberTitle}
                          subtitleStyle={styles.myNumberSubtitle}
                          left={(props) => (
                            <Avatar.Text 
                              size={props.size}
                              label="M"
                              style={styles.myNumberAvatar}
                              labelStyle={styles.avatarLabel}
                            />
                          )}
                          right={() => (
                            <Button
                              mode="contained"
                              onPress={() => handleRecharge(item)}
                              style={styles.myNumberButton}
                              labelStyle={styles.rechargeButtonLabel}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                'Recharge'
                              )}
                            </Button>
                          )}
                        />
                      </Card>
                    </View>
                  );
                }
                
                // For regular contacts, use proper display name
                const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';
                const number = item.number || item.phoneNumbers?.[0]?.number || 'No number';
                const cleanedNumber = number.replace(/^(\+91)/, '').replace(/\D/g, '');
                const initial = displayName?.charAt(0)?.toUpperCase() || '?';
                const isLoading = loadingNumber === cleanedNumber;

                return (
                  <View key={itemKey}>
                    <Card style={styles.card}>
                      <Card.Title
                        title={displayName}
                        subtitle={number}
                        titleStyle={styles.cardTitle}
                        subtitleStyle={styles.cardSubtitle}
                        left={(props) => (
                          <Avatar.Text 
                            size={props.size}
                            label={initial} 
                            style={styles.avatar}
                            labelStyle={styles.avatarLabel}
                          />
                        )}
                        right={() =>
                          number !== 'No number' && cleanedNumber.length >= 10 && (
                            <Button
                              mode="contained"
                              onPress={() => handleRecharge(item)}
                              style={styles.rechargeButton}
                              labelStyle={styles.rechargeButtonLabel}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                'Recharge'
                              )}
                            </Button>
                          )
                        }
                      />
                    </Card>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.modalContactsListContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySearchContainer}>
                  <Text style={styles.emptySearchText}>No contacts found</Text>
                  <Text style={styles.emptySearchSubText}>
                    Try entering a 10-digit mobile number
                  </Text>
                </View>
              }
            />
          </View>
        </Modal>

        {/* Advertisement Popup Modal */}
        <Modal
          visible={adModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeAdModal}
        >
          <View style={styles.adModalOverlay}>
            <View style={styles.adModalContainer}>
              {/* Header with Close Button */}
              <View style={styles.adModalHeader}>
                <Text style={styles.adModalHeaderTitle}>Details</Text>
                <TouchableOpacity style={styles.adCloseButton} onPress={closeAdModal}>
                  <MaterialIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              
              {selectedAd && (
                <ScrollView 
                  style={styles.adModalScrollView}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {/* Responsive Modal Image */}
                  {(selectedAd.uri || selectedAd.image) && (
                    <TouchableOpacity 
                      style={styles.adModalImageContainer}
                      activeOpacity={1}
                    >
                      <Image 
                        source={selectedAd.isStaticImage ? selectedAd.image : { uri: selectedAd.uri }} 
                        style={styles.adModalImage} 
                        resizeMode="contain"
                      />
                      <View style={styles.imageOverlayInfo}>
                        <Text style={styles.swipeHint}>Swipe down to close</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {/* Modal Content */}
                  <View style={styles.adModalContent}>
                    {selectedAd.title && (
                      <View style={styles.titleContainer}>
                        <MaterialIcons name="info" size={24} color="#8400E5" />
                        <Text style={styles.adModalTitle}>
                          {selectedAd.title}
                        </Text>
                      </View>
                    )}
                    
                    {selectedAd.description && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Description</Text>
                        <Text style={styles.adModalDescription}>
                          {selectedAd.description}
                        </Text>
                      </View>
                    )}
                    
                    {/* Additional Info if available */}
                    <View style={styles.additionalInfo}>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="schedule" size={20} color="#666" />
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
    </>
  );
}

ContactList.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginVertical: 1,
  },
  advertisementContainer: {
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#ffffff',
    minHeight: 150,
    justifyContent: 'center',
  },
  adLoadingContainer: {
    height: 150,
    width: screenWidth * 0.93,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  adLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  advertisementWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  advertisementImage: {
    width: screenWidth * 0.93,
    height: 150,
    borderRadius: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderColor: '#000',
    borderWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  searchBarText: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#000',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 10,
  },
  card: {
    marginVertical: 3,
    backgroundColor: '#ffffff',
    elevation: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  myNumberCard: {
    marginVertical: 4,
    backgroundColor: '#f8f8f8',
    elevation: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardTitle: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  myNumberTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  myNumberSubtitle: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  avatar: {
    backgroundColor: '#000',
  },
  myNumberAvatar: {
    backgroundColor: '#333',
  },
  avatarLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  rechargeButton: {
    marginTop: 6,
    marginRight: 8,
    backgroundColor: '#000',
    minWidth: 90,
    borderRadius: 8,
  },
  myNumberButton: {
    marginTop: 6,
    marginRight: 8,
    backgroundColor: '#333',
    minWidth: 90,
    borderRadius: 8,
  },
  rechargeButtonLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    margin: 0,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#ffffff',
    elevation: 0,
    borderWidth: 0.5,
    borderColor: '#000',
    borderRadius: 8,
  },
  searchInputText: {
    fontSize: 14,
    color: '#000',
  },
  modalContactsListContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: '#ffffff',
  },
  emptySearchText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySearchSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  // Tap indicator styles
  tapIndicatorOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Advertisement Modal Styles
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  adModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    height: '90%',
    width: '100%',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  adModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  adModalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  adCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  adModalScrollView: {
    flex: 1,
  },
  adModalImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // Maintain aspect ratio
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  adModalImage: {
    width: '100%',
    height: '100%',
  },
  adModalContent: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  adModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 10,
    lineHeight: 32,
  },
  descriptionContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  adModalDescription: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
  },
  additionalInfo: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontStyle: 'italic',
  },
  imageOverlayInfo: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
});