import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';
import * as Contacts from 'expo-contacts';
import React, { useContext, useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { Button, Card, IconButton, Searchbar, Text, TextInput } from 'react-native-paper';
import imageMap from '../../../components/icons';
import PropTypes from 'prop-types';

export default function DthRecharge({ route, navigation }) {
  const { serviceId, biller } = route.params;
  const { inputFields, id, logo, operatorName, amountExactness, fetchRequirement } = biller;
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;

  console.log("biller ", biller);

  const [formValues, setFormValues] = useState(
    Object.keys(inputFields).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {})
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalFieldKey, setModalFieldKey] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('No Name');
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for button loader

  const handleChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true); // Start button loading
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
      if (!fetchRequirement || fetchRequirement.toLowerCase() === 'not_supported') {
        // No bill fetch required
        bill_details = fallbackDetails;
      } else {
        const requestData = {
          mn: formValues.field1,
          op: id,
          field1: parseInt(formValues.field2)
        };

        const response = await postRequest(
          requestData,
          userToken,
          'api/customer/plan_recharge/viewBill'
        );

        console.log("bill Response", response);
        
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
          // API returned unexpected structure
          bill_details = {
            ...fallbackDetails,
            statusMessage: "Bill fetch failed: Invalid response"
          };
        }
      }

      setName(bill_details.customername);

      navigation.navigate('ViewBill', {
        serviceId,
        operator_id: id,
        contact: { number: formValues.field1, name: bill_details.customername },
        circleCode: null,
        companyLogo: logo,
        name: bill_details.customername,
        bill_details,
        operator: operatorName,
        circle: null,
        amountExactness,
        fetchRequirement
      });

    } catch (error) {
      console.error('Bill fetch error:', error);

      bill_details = {
        ...fallbackDetails,
        statusMessage: "Bill fetch failed: Server error"
      };

      setName(bill_details.customername);

      // Show error alert
      Alert.alert(
        'Error',
        'Failed to fetch bill details. Proceeding with manual entry.',
        [{ text: 'OK', style: 'default' }]
      );

      navigation.navigate('ViewBill', {
        serviceId,
        operator_id: id,
        contact: { number: formValues.field1, name: bill_details.customername },
        circleCode: null,
        companyLogo: logo,
        name: bill_details.customername,
        bill_details,
        operator: operatorName,
        circle: null,
        amountExactness,
        fetchRequirement
      });
    } finally {
      setIsSubmitting(false); // Stop button loading
    }
  };

  const isFormValid = Object.entries(inputFields).every(
    ([key, field]) => !field.required || formValues[key].trim() !== ''
  );

  // Button should be disabled when submitting OR form is invalid
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
      const response = await getRecords({id}, userToken, 'api/customer/extra_params/getByOperatorId');
      if (response?.status === 'success') {
        const data = response.data;
        
        const options = data.map(item => ({
          id: item.id,
          label: item.param1,
          value: item.param1,
          description: item.param2
        }));
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
      fetchOptionsFromApi().then(() => {
        setDropdownOptions((prevOptions) =>
          prevOptions.filter(option =>
            option.label.toLowerCase().includes(query.toLowerCase()) ||
            option.description?.toLowerCase().includes(query.toLowerCase())
          )
        );
      });
    }
  };

  const handleContactSelect = (number, name) => {
    handleChange('field1', number);
    setModalVisible(false);
    setName(name);
  };

  const handleDropdownSelect = (value) => {
    handleChange(modalFieldKey, value);
    setModalVisible(false);
  };

  return (
    <>
      <CommonHeader2
        heading={operatorName}
        showLogo={true}
        bharat_connect="bharat_connect"
        whiteHeader={true}
        whiteText={false}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
        {Object.entries(inputFields).map(([key, field], index) => (
          <Card key={key} style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">{field.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {field.type === 'select' ? (
                  <Pressable onPress={() => openDropdownModal(key)} style={{ flex: 1 }}>
                    <TextInput
                      right={<TextInput.Icon icon="menu-down" />}
                      style={{
                        flex: 1,
                        backgroundColor: 'white',
                      }}
                      mode="outlined"
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                      value={formValues[key]}
                      onChangeText={(text) => handleChange(key, text)}
                      outlineColor="#ccc"
                      activeOutlineColor="black"
                      disabled={isSubmitting} // Disable during submission
                      placeholder={`Select ${field.label}`}
                      editable={false}
                    />
                  </Pressable>
                ) : (
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: 'white',
                    }}
                    mode="outlined"
                    placeholder={`Enter ${field.label}`}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    value={formValues[key]}
                    onChangeText={(text) => handleChange(key, text)}
                    outlineColor="#ccc"
                    activeOutlineColor="black"
                    disabled={isSubmitting} // Disable during submission
                  />
                )}
                {index === 0 && (
                  <View style={styles.contactIcon}>
                    <IconButton 
                      icon="account-box" 
                      onPress={openContactModal} 
                      style={{ height: 45 }}
                      disabled={isSubmitting} // Disable during submission
                    />
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.infoBox}>
          <Card.Content style={{ flexDirection: 'row', gap: 10 }}>
            <Image source={imageMap['bharat_connect']} style={styles.infoLogo} />
            <Text style={styles.infoText}>
              By proceeding further, you allow vasbazaar to fetch your current and future bills and remind you
            </Text>
          </Card.Content>
        </Card>

        {/* Submit Button with Loader */}
        <Button
          mode="contained"
          disabled={isButtonDisabled}
          onPress={handleSubmit}
          style={[
            styles.confirmButton,
            { 
              backgroundColor: isButtonDisabled ? '#cccccc' : '#000',
              opacity: isButtonDisabled ? 0.7 : 1,
            },
          ]}
          labelStyle={{
            fontWeight: '600',
            color: isButtonDisabled ? '#666' : '#fff',
          }}
          contentStyle={styles.buttonContent}
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
            'CONFIRM'
          )}
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal with Updated Search Bar */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
          <Searchbar
            placeholder="Search"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#666"
            placeholderTextColor="#999"
          />

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
                      ? handleContactSelect(item.phoneNumbers[0].number, item.name)
                      : handleDropdownSelect(item.value)
                  }
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                >
                  <Text style={{ fontSize: 16 }}>{item.name || item.label}</Text>
                  <Text style={{ fontSize: 14, color: '#555' }}>{item.phoneNumbers?.[0]?.number || item.description}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
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

DthRecharge.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  contactIcon: {
    backgroundColor: 'rgb(231 224 236)',
  },
  container: {
    backgroundColor: '#f7f7f7',
    padding: 16,
    flex: 1,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  infoBox: {
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 10,
  },
  infoLogo: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
    marginTop: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  confirmButton: {
    borderRadius: 6,
    paddingVertical: 12,
    marginTop: 24,
    elevation: 2,
  },
  buttonContent: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  searchInput: {
    color: '#000',
    fontSize: 14,
  },
  closeButtonContainer: {
    marginTop: 16,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#000',
    borderRadius: 8,
  },
  closeButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});