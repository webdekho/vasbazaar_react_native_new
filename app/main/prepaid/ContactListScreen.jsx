import React, { useState, useEffect, useRef } from 'react';
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
  View,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
// Carousel replaced with ScrollView for better compatibility
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';
import { getRequest, postRequest } from '../../../services/api/baseApi';
import { getSessionToken } from '../../../services/auth/sessionManager';

const { width: screenWidth } = Dimensions.get('window');

export default function ContactListScreen({ route }) {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [advertisementImages, setAdvertisementImages] = useState([]);
  const [adLoading, setAdLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [loadingNumber, setLoadingNumber] = useState(null);
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const serviceId = route?.params?.serviceId || 1;

  // Fallback static images
  const fallbackImages = [
    {
      id: 'fallback-1',
      uri: null,
      isStaticImage: true,
      image: require('../../../assets/slider/slider1.png'),
      title: 'Mobile Recharge',
      description: 'Get amazing cashback on mobile recharges'
    },
    {
      id: 'fallback-2', 
      uri: null,
      isStaticImage: true,
      image: require('../../../assets/slider/slider2.png'),
      title: 'Special Discounts',
      description: 'Save more on every recharge'
    }
  ];

  // Initialize user data and token
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const token = await getSessionToken();
      const storedUserData = await AsyncStorage.getItem('userData');
      
      
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
      }
      
      // Initialize with fallback images first
      setAdvertisementImages(fallbackImages);
      
      // Auto-load contacts on all platforms
      loadContacts();
      
      if (token) {
        fetchAdvertisements(token);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  // Create contact list with userData.mobile included in search
  const contactsWithMyNumber = () => {
    const contactList = [];
    
    // Add userData.mobile as "My Number" for search functionality
    if (userData?.mobile) {
      const cleanMobile = userData.mobile.replace(/^(\+91)/, '');
      console.log('Adding My Number to contacts list:', cleanMobile);
      contactList.push({
        id: 'my-number',
        name: 'My Number',
        number: cleanMobile,
        phoneNumbers: [{ number: cleanMobile }],
        isMyNumber: true,
      });
    } else {
      console.log('userData.mobile not available:', userData);
    }
    
    // Add existing contacts with proper IDs
    const contactsWithIds = contacts.map((contact, index) => ({
      ...contact,
      id: contact.id || `contact-${index}`
    }));
    
    return [...contactList, ...contactsWithIds];
  };

  // Fetch advertisement banners from API
  const fetchAdvertisements = async (token) => {
    try {
      setAdLoading(true);
      
      const response = await getRequest(
        'api/customer/advertisement/getByStatus',
        { status: 'Mobile_Recharge' },
        token
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

  // iOS Safari contact import using file input
  const importContactsFromFile = () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.vcf,.csv';
      input.multiple = false;
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve([]);
          return;
        }
        
        try {
          const text = await file.text();
          const contacts = parseContactFile(text, file.name);
          resolve(contacts);
        } catch (error) {
          console.error('File parsing error:', error);
          reject(error);
        }
      };
      
      input.oncancel = () => resolve([]);
      
      // Trigger file picker
      input.click();
    });
  };

  // Parse contact file (VCF or CSV)
  const parseContactFile = (text, fileName) => {
    const contacts = [];
    
    if (fileName.toLowerCase().endsWith('.vcf')) {
      // Parse VCF format
      const vcardBlocks = text.split('BEGIN:VCARD');
      
      vcardBlocks.forEach((block, index) => {
        if (index === 0 && !block.includes('END:VCARD')) return;
        
        const lines = block.split('\n');
        let name = '';
        const phoneNumbers = [];
        
        lines.forEach(line => {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('FN:')) {
            name = cleanLine.substring(3);
          } else if (cleanLine.includes('TEL')) {
            const phoneMatch = cleanLine.match(/:(.+)$/);
            if (phoneMatch) {
              phoneNumbers.push({ number: phoneMatch[1].trim() });
            }
          }
        });
        
        if (name && phoneNumbers.length > 0) {
          contacts.push({
            id: `file-contact-${index}`,
            name: name,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            phoneNumbers: phoneNumbers
          });
        }
      });
    } else if (fileName.toLowerCase().endsWith('.csv')) {
      // Parse CSV format (Name, Phone)
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [name, phone] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (name && phone) {
          contacts.push({
            id: `csv-contact-${index}`,
            name: name,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            phoneNumbers: [{ number: phone }]
          });
        }
      });
    }
    
    return contacts;
  };

  // Detect iOS Safari
  const isIOSSafari = () => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  };

  // Web contact picker using modern browser APIs
  const loadContactsWeb = async () => {
    try {
      setIsLoading(true);
      console.log('Loading contacts on web...');
      console.log('User agent:', navigator.userAgent);
      console.log('iOS Safari detected:', isIOSSafari());
      
      // Check if Contact Picker API is supported
      if ('contacts' in navigator && 'select' in navigator.contacts && !isIOSSafari()) {
        console.log('Contact Picker API is supported');
        
        try {
          // Request contacts with phone numbers
          const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
          
          // Transform web contacts to match mobile contact format
          const transformedContacts = contacts.map((contact, index) => ({
            id: `web-contact-${index}`,
            name: contact.name?.[0] || 'Unknown',
            firstName: contact.name?.[0]?.split(' ')[0] || '',
            lastName: contact.name?.[0]?.split(' ').slice(1).join(' ') || '',
            phoneNumbers: contact.tel?.map(tel => ({ number: tel })) || []
          })).filter(c => c.phoneNumbers.length > 0);
          
          console.log('Loaded web contacts:', transformedContacts.length);
          setContacts(transformedContacts);
          setFilteredContacts(contactsWithMyNumber());
          return;
        } catch (apiError) {
          console.log('Contact Picker API failed, falling back to file import:', apiError);
        }
      }
      
      // iOS Safari or fallback: Use file import
      console.log('Using file import method...');
      Alert.alert(
        'Import Contacts',
        'Select a contact file (VCF or CSV format) to import your contacts. You can export contacts from your phone\'s contact app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Choose File', 
            onPress: async () => {
              try {
                const importedContacts = await importContactsFromFile();
                if (importedContacts.length > 0) {
                  console.log('Imported contacts:', importedContacts.length);
                  setContacts(importedContacts);
                  setFilteredContacts(contactsWithMyNumber());
                  Alert.alert('Success', `Imported ${importedContacts.length} contacts successfully!`);
                } else {
                  Alert.alert('No Contacts', 'No contacts were found in the selected file.');
                }
              } catch (error) {
                console.error('Contact import error:', error);
                Alert.alert('Import Failed', 'Unable to import contacts from the selected file.');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Web contact loading error:', error);
      Alert.alert(
        'Contact Loading Failed',
        'Unable to load contacts. You can still search by entering phone numbers manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        // Use web contact picker for browsers
        await loadContactsWeb();
        return;
      }

      // Mobile platform contact loading
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
      console.error('Contact loading error:', error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = async () => {
    setSearchText('');
    
    // Ensure userData is loaded
    if (!userData) {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          setUserData(parsed);
        }
      } catch (error) {
        console.log('Error loading userData in modal:', error);
      }
    }
    
    const contactsWithMyNum = contactsWithMyNumber();
    console.log('Opening modal with contacts:', contactsWithMyNum.length, 'userData:', userData?.mobile, 'Full userData:', userData);
    setFilteredContacts(contactsWithMyNum);
    setModalVisible(true);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    const query = text.trim().toLowerCase();

    if (query === '') {
      setFilteredContacts(contactsWithMyNumber());
      return;
    }
    
    // Fast and simple search
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
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return null;
      }

      const response = await postRequest(
        'api/customer/operator/fetchOperatorCircle',
        { mobile: mobile_number },
        sessionToken
      );
      if (response?.status === 'success') {
        const data = response.data;
        // Navigate to recharge plan screen
        router.push({
          pathname: '/main/prepaid/RechargePlanScreen',
          params: {
            contactName: contact.name,
            phoneNumber: contact.number,
            operatorData: JSON.stringify(data),
            serviceId
          }
        });
        return data;
      } else {
        Alert.alert('Error', response?.message || 'Something went wrong.');
        return null;
      }
    } catch (error) {
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
      <TouchableOpacity style={styles.myNumberCard} onPress={() => handleRecharge({
        name: 'My Number',
        number: cleanMobile,
        isMyNumber: true
      })}>
        <View style={styles.contactInfo}>
          <View style={styles.myNumberAvatar}>
            <Text style={styles.avatarLabel}>{initial}</Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.myNumberTitle}>My Number</Text>
            <Text style={styles.myNumberSubtitle}>{cleanMobile}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <FontAwesome name="chevron-right" size={16} color="#333" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactItem = ({ item, index }) => {
    const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';
    const number = item.number || item.phoneNumbers?.[0]?.number || 'No number';
    const cleanedNumber = number.replace(/^(\+91)/, '').replace(/\D/g, '');
    const initial = displayName?.charAt(0)?.toUpperCase() || '?';
    const isLoading = loadingNumber === cleanedNumber;
    const contactKey = item.id || `contact-${index}`;

    return (
      <TouchableOpacity
        key={contactKey}
        style={styles.contactItem}
        onPress={() => handleRecharge(item)}
        disabled={isLoading || cleanedNumber.length < 10}
      >
        <View style={styles.contactInfo}>
          <View style={styles.operatorIcon}>
            <Text style={styles.avatarLabel}>{initial}</Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{displayName}</Text>
            <Text style={styles.contactNumber}>{number}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
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
            onError={() => {
              console.log('Error loading advertisement image');
            }}
            onLoad={() => {
              if (item.isApiImage) {
                console.log('API advertisement image loaded successfully');
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

  return (
    <>
      <MainHeader 
        title="Contact List"
        showBack={true}
        showSearch={false}
        showNotification={false}
      />
      <View style={styles.container}>
        {/* Advertisement Carousel */}
        <View style={styles.advertisementContainer}>
          {adLoading && advertisementImages.length === 0 ? (
            <View style={styles.adLoadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.adLoadingText}>Loading advertisements...</Text>
            </View>
          ) : advertisementImages.length > 0 ? (
            <View style={styles.sliderContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const slideWidth = screenWidth * 0.93;
                  const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                  setCurrentSlide(index);
                }}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
              >
                {advertisementImages.map((item, index) => (
                  <View key={item.id || index} style={styles.slideContainer}>
                    {renderAdvertisementItem({ item, index })}
                  </View>
                ))}
              </ScrollView>
              
              {/* Pagination dots removed per user request */}
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
            <FontAwesome name="search" size={20} color="#666666" />
            <Text style={styles.searchBarText}>
              Search by name or number
            </Text>
          </View>
          <FontAwesome name="mobile" size={22} color="#000000" />
        </TouchableOpacity>

        {/* My Number Section */}
        {renderMyNumber()}
        
        {/* Contact List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id || index.toString()}
            ListHeaderComponent={
              contacts.length > 0 ? (
                <Text style={styles.sectionHeader}>Contact List</Text>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={renderContactItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <FontAwesome name="address-book-o" size={80} color="#E5E7EB" />
                    <View style={styles.iconBadge}>
                      <FontAwesome name="plus" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.emptyText}>No contacts available</Text>
                  <Text style={styles.emptySubText}>
                    {Platform.OS === 'web' ? 
                      'Import contacts from a file or\nmanually search for numbers' :
                      'Import contacts from a file or\nmanually search for numbers'
                    }
                  </Text>
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#000" />
              </TouchableOpacity>
              <View style={[
                styles.modalSearchInput,
                isSearchFocused && styles.modalSearchInputFocused
              ]}>
                <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search by name or number"
                  onChangeText={handleSearch}
                  value={searchText}
                  style={styles.searchInputText}
                  autoFocus={true}
                  maxLength={15}
                  placeholderTextColor="#999"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  selectionColor="#000000"
                  underlineColorAndroid="transparent"
                />
              </View>
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
                    <TouchableOpacity
                      key={itemKey}
                      style={styles.myNumberCard}
                      onPress={() => handleRecharge(item)}
                      disabled={isLoading}
                    >
                      <View style={styles.contactInfo}>
                        <View style={styles.myNumberAvatar}>
                          <Text style={styles.avatarLabel}>M</Text>
                        </View>
                        <View style={styles.contactDetails}>
                          <Text style={styles.myNumberTitle}>My Number</Text>
                          <Text style={styles.myNumberSubtitle}>{item.number}</Text>
                        </View>
                        {isLoading ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <FontAwesome name="chevron-right" size={16} color="#333" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }
                
                // For regular contacts, use proper display name
                const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';
                const number = item.number || item.phoneNumbers?.[0]?.number || 'No number';
                const cleanedNumber = number.replace(/^(\+91)/, '').replace(/\D/g, '');
                const initial = displayName?.charAt(0)?.toUpperCase() || '?';
                const isLoading = loadingNumber === cleanedNumber;

                return (
                  <TouchableOpacity
                    key={itemKey}
                    style={styles.contactItem}
                    onPress={() => handleRecharge(item)}
                    disabled={isLoading || cleanedNumber.length < 10}
                  >
                    <View style={styles.contactInfo}>
                      <View style={styles.operatorIcon}>
                        <Text style={styles.avatarLabel}>{initial}</Text>
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactName}>{displayName}</Text>
                        <Text style={styles.contactNumber}>{number}</Text>
                      </View>
                      {isLoading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
                      )}
                    </View>
                  </TouchableOpacity>
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
                        <MaterialIcons name="info" size={24} color="#000" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  separator: {
    height: 4,
    backgroundColor: 'transparent',
  },
  advertisementContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    minHeight: 180,
    justifyContent: 'center',
  },
  adLoadingContainer: {
    height: 180,
    width: screenWidth - 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  adLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  // New ScrollView-based slider styles
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slideContainer: {
    width: screenWidth - 32,
    marginHorizontal: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    transition: 'all 0.2s ease',
  },
  activeDot: {
    backgroundColor: '#000000',
    transform: [{ scale: 1.2 }],
  },
  inactiveDot: {
    backgroundColor: '#CCCCCC',
  },
  advertisementWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  advertisementImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderColor: '#000000',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchBarText: {
    color: '#666666',
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    fontWeight: '400',
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    color: '#000000',
    letterSpacing: -0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    minHeight: 320,
    justifyContent: 'center',
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#000000',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F9FAFB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 24,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contactItem: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    padding: 12,
  },
  myNumberCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#F8F9FA',
    elevation: 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  contactNumber: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
  },
  myNumberTitle: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  myNumberSubtitle: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 15,
  },
  operatorIcon: {
    backgroundColor: '#000000',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  myNumberAvatar: {
    backgroundColor: '#000000',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  loadContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 25,
    minHeight: 56,
    minWidth: 200,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 1 }],
  },
  loadContactsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalSearchInputFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
    fontWeight: '500',
  },
  modalContactsListContainer: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptySearchText: {
    fontSize: 20,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySearchSubText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // Tap indicator styles
  tapIndicatorOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
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
    aspectRatio: 16 / 9,
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