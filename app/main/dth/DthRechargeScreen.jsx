import MainHeader from '../../../components/MainHeader';
import { postRequest } from '../../../services/api/baseApi';
import { getSessionToken } from '../../../services/auth/sessionManager';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DthRecharge() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
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

      // Handle API response
      if (response?.status !== 'success') {
        throw new Error(response?.message || 'Failed to fetch DTH information');
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
            price: `₹${formValues.field2 || '299'}`,
            validity: 'Custom',
            name: 'Custom Recharge'
          })
        }
      });

    } catch (error) {
      Alert.alert(
        'Error',
        error.message,
        [
          {
            text: 'OK',
            style: 'default',
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.entries(finalInputFields).every(([key, field]) =>
    field.required ? formValues[key].trim() !== '' : true
  );

  const isButtonDisabled = isLoading || !isFormValid;

  useEffect(() => {
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
    <>
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

      <View style={styles.wrapper}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
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
                  onChangeText={(text) => handleChange(key, text)}
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
        </ScrollView>

        {/* Fixed Bottom Button */}
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
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            )}
          </TouchableOpacity>
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
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f7f7f7',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: '#f7f7f7',
  },
  confirmButton: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
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