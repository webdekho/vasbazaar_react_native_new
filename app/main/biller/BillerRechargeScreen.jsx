import MainHeader from '../../../components/MainHeader';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  TextInput,
} from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BillerRechargeScreen() {
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
  
  const { inputFields = {}, id, logo, operatorName, amountExactness, fetchRequirement } = billerData;

  // Provide default input fields if none are provided
  const defaultInputFields = {
    field1: {
      label: 'Account Number',
      type: 'number',
      required: true,
      placeholder: 'Enter your account number'
    },
    field2: {
      label: 'Amount',
      type: 'number',
      required: true,
      placeholder: 'Enter amount'
    }
  };

  const finalInputFields = inputFields && Object.keys(inputFields).length > 0 
    ? inputFields 
    : defaultInputFields;

  const [formValues, setFormValues] = useState(
    Object.keys(finalInputFields).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {})
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalFieldKey, setModalFieldKey] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [originalDropdownOptions, setOriginalDropdownOptions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let bill_details = {};
    let fallbackDetails = {
      dueDate: "NA",
      billAmount: 0,
      statusMessage: "No bill fetch required",
      acceptPayment: "true",
      acceptPartPay: "true",
      maxBillAmount: "",
      customername: "No Name",
      billnumber: "NA",
      billdate: "NA",
      billperiod: "",
      AddInfo: [],
      paymentAmountExactness: true,
    };

    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }

      if (!fetchRequirement || fetchRequirement.toLowerCase() === 'not_supported') {
        bill_details = fallbackDetails;
      } else {
        const requestData = {
          mn: formValues.field1,
          op: id,
          field1: parseInt(formValues.field2)
        };

        const response = await postRequest(
          'api/customer/plan_recharge/viewBill',
          requestData,
          sessionToken
        );

        if (
          response?.status === 'success' &&
          response?.data?.data &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0
        ) {
          const apiData = response.data.data[0];
          bill_details = {
            dueDate: apiData.dueDate || 'NA',
            billAmount: apiData.billAmount || 0,
            statusMessage: apiData.statusMessage || '',
            acceptPayment: apiData.acceptPayment || 'true',
            acceptPartPay: apiData.acceptPartPay || 'false',
            maxBillAmount: apiData.maxBillAmount || '',
            customername: apiData.customername || 'No Name',
            billnumber: apiData.billnumber || 'NA',
            billdate: apiData.billdate || 'NA',
            billperiod: apiData.billperiod || '',
            AddInfo: apiData.AddInfo || [],
            paymentAmountExactness: apiData.paymentAmountExactness || true,
          };
        } else {
          bill_details = {
            ...fallbackDetails,
            statusMessage: "Bill fetch failed: Invalid response"
          };
        }
      }

      // Customer name will be used from bill_details

      router.push({
        pathname: '/main/biller/BillViewScreen',
        params: {
          serviceId,
          operator_id: id,
          contact: JSON.stringify({ number: formValues.field1, name: bill_details.customername }),
          circleCode: null,
          companyLogo: logo,
          name: bill_details.customername,
          bill_details: JSON.stringify(bill_details),
          operator: operatorName,
          circle: null,
          amountExactness,
          fetchRequirement
        }
      });

    } catch (error) {
      bill_details = {
        ...fallbackDetails,
        statusMessage: "Bill fetch failed: Server error"
      };

      // Customer name will be used from bill_details

      Alert.alert(
        'Error',
        'Failed to fetch bill details. Proceeding with manual entry.',
        [{ text: 'OK', style: 'default' }]
      );

      router.push({
        pathname: '/main/biller/BillViewScreen',
        params: {
          serviceId,
          operator_id: id,
          contact: JSON.stringify({ number: formValues.field1, name: bill_details.customername }),
          circleCode: null,
          companyLogo: logo,
          name: bill_details.customername,
          bill_details: JSON.stringify(bill_details),
          operator: operatorName,
          circle: null,
          amountExactness,
          fetchRequirement
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.entries(finalInputFields).every(
    ([key, field]) => !field.required || formValues[key].trim() !== ''
  );

  const isButtonDisabled = isSubmitting || !isFormValid;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          const valid = data.filter((c) => c.phoneNumbers?.length);
          setContacts(valid);
          setFilteredContacts(valid);
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    })();
  }, []);

  const openContactModal = () => {
    setModalFieldKey('field1');
    setSearchQuery('');
    setFilteredContacts(contacts);
    setModalVisible(true);
  };

  const openDropdownModal = async (key) => {
    setModalFieldKey(key);
    setSearchQuery('');
    await fetchOptionsFromApi();
    setModalVisible(true);
  };

  const fetchOptionsFromApi = async () => {
    setIsLoading(true);
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }
      
      const response = await getRequest(
        'api/customer/extra_params/getByOperatorId',
        { id },
        sessionToken
      );
      
      if (response?.status === 'success') {
        const data = response.data;
        const options = data.map(item => ({
          id: item.id,
          label: item.param1,
          value: item.param1,
          description: item.param2
        }));
        setOriginalDropdownOptions(options);
        setDropdownOptions(options);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (modalFieldKey === 'field1') {
      const filtered = contacts.filter((c) =>
        c.name?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered.length > 0 || query ? filtered : contacts);
    } else {
      // Filter locally from original options without API call
      const filtered = originalDropdownOptions.filter(option =>
        option.label.toLowerCase().includes(query.toLowerCase()) ||
        option.description?.toLowerCase().includes(query.toLowerCase())
      );
      setDropdownOptions(filtered.length > 0 || query ? filtered : originalDropdownOptions);
    }
  };

  const handleContactSelect = (number) => {
    handleChange('field1', number);
    setModalVisible(false);
  };

  const handleDropdownSelect = (value) => {
    handleChange(modalFieldKey, value);
    setModalVisible(false);
  };

  return (
    <>
      <MainHeader
        title={operatorName || 'Bill Payment'}
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

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={{ 
            paddingBottom: Platform.select({
              web: 120,
              default: 80,
            })
          }}
          keyboardShouldPersistTaps="handled"
        >

        {Object.entries(finalInputFields).map(([key, field], index) => (
          <Card key={key} style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">{field.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {field.type === 'select' ? (
                  <Pressable onPress={() => openDropdownModal(key)} style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.formTextInput,
                        Platform.OS === 'web' && { outlineStyle: 'none' }
                      ]}
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                      value={formValues[key]}
                      onChangeText={(text) => handleChange(key, text)}
                      editable={false}
                      placeholder={`Select ${field.label}`}
                      placeholderTextColor="#9CA3AF"
                      selectionColor="#000000"
                      underlineColorAndroid="transparent"
                    />
                    <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
                  </Pressable>
                ) : (
                  <View style={[
                    styles.inputContainer,
                    focusedField === key && styles.inputContainerFocused
                  ]}>
                    <TextInput
                      style={[
                        styles.formTextInput,
                        Platform.OS === 'web' && { outlineStyle: 'none' }
                      ]}
                      placeholder={`Enter ${field.label}`}
                      placeholderTextColor="#9CA3AF"
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                      value={formValues[key]}
                      onChangeText={(text) => handleChange(key, text)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      editable={!isSubmitting}
                      selectionColor="#000000"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}
                {index === 0 && (
                  <View style={styles.contactIcon}>
                    <IconButton 
                      icon="account-box" 
                      onPress={openContactModal} 
                      style={{ height: 45 }}
                      disabled={isSubmitting}
                    />
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

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
            {isSubmitting ? (
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

      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          
          <View style={[
            styles.modalSearchContainer,
            isSearchFocused && styles.modalSearchContainerFocused
          ]}>
            <MaterialIcons name="search" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={[
                styles.modalSearchInput,
                Platform.OS === 'web' && { outlineStyle: 'none' }
              ]}
              selectionColor="#000000"
              underlineColorAndroid="transparent"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#000" style={{ flex: 1 }} />
          ) : (
            <FlatList
              data={modalFieldKey === 'field1' ? filteredContacts : dropdownOptions}
              keyExtractor={(item) => item.id?.toString() || item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() =>
                    modalFieldKey === 'field1'
                      ? handleContactSelect(item.phoneNumbers[0].number)
                      : handleDropdownSelect(item.value)
                  }
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemTitle}>{item.name || item.label}</Text>
                  <Text style={styles.modalItemSubtitle}>{item.phoneNumbers?.[0]?.number || item.description}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No results found' : 'Loading options...'}
                </Text>
              }
            />
          )}

          <View style={styles.closeButtonContainer}>
            <Button 
              mode="contained" 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              labelStyle={styles.closeButtonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  contactIcon: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginLeft: 8,
    ...(Platform.OS === 'web' && {
      '& button:focus': {
        outline: 'none',
      },
    }),
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
  searchBar: {
    marginBottom: 16,
    marginTop: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    elevation: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
    fontSize: 16,
  },
  closeButtonContainer: {
    marginTop: 16,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  closeButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    height: 56,
    ...(Platform.OS === 'web' && {
      '& input:focus': {
        outline: 'none',
      },
    }),
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 56,
    paddingHorizontal: 16,
    marginTop: 8,
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  formTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    ...(Platform.OS === 'web' && {
      outline: 'none',
    }),
  },
  modalSearchContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSearchContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    ...(Platform.OS === 'web' && {
      outline: 'none',
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerLogo: {
    width: 60,
    height: 24,
    marginRight: 8,
  },
});