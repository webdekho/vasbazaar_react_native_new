import MainHeader from '../../../components/MainHeader';
import { postRequest } from '../../../services/api/baseApi';
import { getSessionToken } from '../../../services/auth/sessionManager';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrientation } from '../../../hooks/useOrientation';
import { ActivityIndicator, Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DthRecharge() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isLandscape, isIPhone16Pro, hasNotch } = useOrientation();

  // Calculate dynamic tab bar height
  const getTabBarHeight = () => {
    let baseHeight = isLandscape ? 50 : 60;
    
    if (Platform.OS === 'web') {
      baseHeight = isLandscape ? 60 : 70;
    }
    
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
  
  const { serviceId, biller } = params;
  
  // Parse biller data
  let billerData;
  try {
    billerData = typeof biller === 'string' ? JSON.parse(biller) : biller;
  } catch (error) {
    console.error('Error parsing biller data:', error);
    billerData = {};
  }
  
  const { inputFields, id, logo, operatorName, operatorCode } = billerData;

  // Provide default input fields if none are provided
  const defaultInputFields = {
    field1: {
      label: 'DTH Number',
      type: 'number',
      required: true,
      placeholder: 'Enter your DTH number'
    },
    field2: {
      label: 'Amount (Optional)',
      type: 'number',
      required: false,
      placeholder: 'Enter amount'
    }
  };

  const finalInputFields = inputFields && Object.keys(inputFields).length > 0 
    ? inputFields 
    : defaultInputFields;

  console.log('billerData:', billerData);
  console.log('inputFields:', inputFields);
  console.log('finalInputFields:', finalInputFields);

  const [formValues, setFormValues] = useState(
    Object.keys(finalInputFields).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {})
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('No Name');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    console.log('formValues:', formValues);
    console.log('isButtonDisabled:', isButtonDisabled);
    console.log('isFormValid:', isFormValid);
    
    try {
      setIsLoading(true);
      setErrorMessage(''); // Clear previous errors

      // Validate required fields
      if (!formValues.field1) {
        throw new Error('Please fill in all required fields');
      }

      // Validate DTH number format if needed
      if (!/^\d{10,16}$/.test(formValues.field1)) {
        throw new Error('Please enter a valid DTH number (10-16 digits)');
      }

      // Get session token
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }

      // Prepare API request data
      const requestData = {
        operatorCode,
        dthNumber: formValues.field1
      };

      // Fetch DTH info
      const response = await postRequest(
        'api/customer/operator/fetch_DTHInfo',
        requestData,
        sessionToken
      );

      console.log('DTH API Response:', response);
      
      // Handle API response - check for both success and failure
      if (response?.status === 'failure' || response?.Status === 'FAILURE' || response?.status !== 'success') {
        const errorMessage = response?.message || 'Failed to fetch DTH information';
        throw new Error(errorMessage);
      }

      // Navigate to DTH plans screen with all required parameters
      router.push({
        pathname: '/main/dth/DthPlanScreen',
        params: {
          serviceId,
          operator_id: id,
          contact: JSON.stringify({
            number: formValues.field1,
            name: response.data?.customerName || 'DTH Customer'
          }),
          circleCode: null,
          companyLogo: logo,
          operatorCode,
          name: response.data?.customerName || 'Customer',
          dth_info: JSON.stringify(response.data),
          operator: operatorName,
          circle: null,
          plan: JSON.stringify({
            price: `₹${formValues.field2 || '0'}`,
            validity: 'Custom',
            name: 'Custom Recharge'
          })
        }
      });

    } catch (error) {
      console.error('DTH Info Fetch Error:', error);
      
      // Show user-friendly error message
      let displayMessage = 'Failed to fetch DTH information. Please try again.';
      
      if (error.message.includes('Account not found')) {
        displayMessage = 'DTH account not found. Please check your DTH number and try again.';
      } else if (error.message.includes('DTH Info Fetch Failed')) {
        displayMessage = error.message.replace('DTH Info Fetch Failed: ', '');
      } else if (error.message) {
        displayMessage = error.message;
      }
      
      setErrorMessage(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.entries(finalInputFields).every(([key, field]) =>
    field.required ? formValues[key].trim() !== '' : true
  );

  const isButtonDisabled = isLoading || !isFormValid;

  useEffect(() => {
    // Fix MainHeader compression on all platforms
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        /* Prevent header compression globally */
        [data-fixed-header] {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 9999 !important;
          background-color: white !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          height: 60px !important;
          min-height: 60px !important;
          max-height: 60px !important;
        }
        
        /* Content adjustment for fixed header */
        [data-content-wrapper] {
          margin-top: 60px !important;
          height: calc(100vh - 60px) !important;
          overflow: hidden !important;
        }
        
        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          @media screen and (max-width: 768px) {
            [data-fixed-header] {
              position: fixed !important;
              transform: none !important;
              will-change: auto !important;
            }
            
            body {
              position: fixed !important;
              width: 100% !important;
              height: 100vh !important;
              overflow: hidden !important;
            }
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }

    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          if (data.length > 0) {
            const valid = data.filter((c) => c.phoneNumbers && c.phoneNumbers.length);
            setContacts(valid);
            setFilteredContacts(valid);
          }
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    })();
  }, []);

  const openContactModal = () => {
    setSearchQuery('');
    setFilteredContacts(contacts);
    setModalVisible(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = contacts.filter((c) =>
      c.name?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleContactSelect = (number, name) => {
    handleChange('field1', number);
    setModalVisible(false);
    setName(name);
  };

  return (
    <View style={{ flex: 1 }}>
      <View 
        style={styles.headerContainer}
        {...(Platform.OS === 'web' && { 'data-fixed-header': true })}
      >
        <MainHeader
          title={operatorName || 'DTH Recharge'}
          showBack={true}
          showSearch={false}
          showNotification={false}
          rightComponent={
            <Image 
              source={require('../../../assets/icons/bharat_connect.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
          }
        />
      </View>

      <View 
        style={styles.wrapper}
        {...(Platform.OS === 'web' && { 'data-content-wrapper': true })}
      >
        <View style={styles.container}>
        {/* Error Message */}
        {errorMessage ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {Object.entries(finalInputFields).map(([key, field], index) => (
          <Card key={key} style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">{field.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  placeholder={`Enter ${field.label}`}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={formValues[key]}
                  onChangeText={(text) => {
                    handleChange(key, text);
                    if (errorMessage) setErrorMessage(''); // Clear error on input change
                  }}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#000000"
                  outlineStyle={{ borderWidth: 2, borderRadius: 12 }}
                  disabled={isLoading}
                />
                
                {index === 0 && (
                  <View style={styles.contactIcon}>
                    <IconButton 
                      icon="account-box" 
                      onPress={openContactModal} 
                      style={{ height: 45 }}
                      disabled={isLoading}
                    />
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* Info Box */}
        <Card style={styles.infoBox}>
          <Card.Content style={{ flexDirection: 'row', gap: 10 }}>
            <View style={styles.infoLogoContainer}>
              <Image source={require('../../../assets/icons/bharat_connect.png')} style={styles.headerLogo} resizeMode="contain"/> 
            </View>
            <Text style={styles.infoText}>
              By proceeding further, you allow vasbzaar to fetch your current and future bills and remind you.
            </Text>
          </Card.Content>
        </Card>

          {/* DTH Recharge Instruction */}
          <Text style={styles.blakPutti}>Keep Set top box on while recharging.</Text>

          {/* Bottom Button */}
          <View style={styles.bottomPaySection}>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              isButtonDisabled && styles.confirmButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator 
                  size="small" 
                  color="#fff" 
                  style={styles.loadingSpinner}
                />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contact Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <Button onPress={() => setModalVisible(false)}>Close</Button>
          </View>

          <View style={[
            styles.modalSearchContainer
          ]}>
            <TextInput
              placeholder="Search"
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.modalSearchInput}
            />
          </View>

          <FlatList
            data={
              filteredContacts.length > 0
                ? filteredContacts
                : searchQuery
                  ? [{
                      id: 'no_match',
                      name: 'No Name',
                      phoneNumbers: [{ number: searchQuery }]
                    }]
                  : []
            }
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  item.phoneNumbers && item.phoneNumbers.length > 0 &&
                  handleContactSelect(
                    item.phoneNumbers[0].number.replace(/[^\d]/g, ''), 
                    item.name || 'No Name'
                  )
                }
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.name || 'No Name'}</Text>
                <Text style={{ fontSize: 14, color: '#555' }}>
                  {item.phoneNumbers?.[0]?.number || ''}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              !searchQuery ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                  Start typing to search contacts...
                </Text>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 60, // Space for fixed header
  },
  contactIcon: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginLeft: 8,
  },
  container: {
    backgroundColor: '#f7f7f7',
    padding: 16,
    flex: 1,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#fff',
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLogoContainer: {
    
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  infoLogoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  bottomPaySection: {
    paddingVertical: 0,
    paddingBottom: Platform.select({
      web: 30,
      default: 20,
    }),
    backgroundColor: '#f7f7f7',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  confirmButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 0,
    marginVertical: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#000000',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  blakPutti: {
    color: 'white',
    backgroundColor: '#000000ff',
    padding: 10,
    borderRadius: 10,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 10,
  },
  headerLogo: {
    width: 60,
    height: 24,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    height: 56,
  },
  modalSearchContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
  },
});