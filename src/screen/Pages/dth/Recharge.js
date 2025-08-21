import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { postRequest } from '../../../Services/ApiServices';
import * as Contacts from 'expo-contacts';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Searchbar, Text } from 'react-native-paper';
import CustomInput from '../../../components/CustomInput';
import imageMap from '../../../components/icons';

export default function DthRecharge({ route, navigation }) {
  const authContext = useContext(AuthContext);
  const { userToken } = authContext;
  const { serviceId, biller } = route.params;
  const { inputFields, id, logo, operatorName, operatorCode } = biller;
  console.log("biller", biller);

  const [formValues, setFormValues] = useState(
    Object.keys(inputFields).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {})
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('No Name');
  const [isLoading, setIsLoading] = useState(false); // Loading state for button

  const handleChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true); // Start loading

      console.log('Submitted values:', formValues);

      // Validate required fields
      if (!formValues.field1) {
        throw new Error('Please fill in all required fields');
      }

      // Validate DTH number format if needed
      if (!/^\d{10}$/.test(formValues.field1)) {
        throw new Error('Please enter a valid 10-digit DTH number');
      }

      // Prepare API request data
      const requestData = {
        operatorCode,
        dthNumber: formValues.field1
      };

      // Fetch DTH info
      const response = await postRequest(
        requestData,
        userToken,
        'api/customer/operator/fetch_DTHInfo'
      );

      // Handle API response
      if (response?.status !== 'success') {
        throw new Error(response?.message || 'Failed to fetch DTH information');
      }

      // Process successful response
      console.log("DTH info response:", response.data);

      // Navigate to DTH plans screen with all required parameters
      navigation.navigate('DthPlan', {
        serviceId,
        operator_id: id,
        contact: {
          number: formValues.field1,
          name: response.data.customerName || 'No Name'
        },
        circleCode: null,
        companyLogo: logo,
        operatorCode,
        name: response.data.customerName || 'Customer',
        dth_info: response.data,
        operator: operatorName,
        circle: null,
        plan: {
          price: `₹${formValues.field2}`,
          validity: 'Custom',
          name: 'Custom Recharge'
        }
      });

    } catch (error) {
      console.error('Submission error:', error);
      
      // Show error alert with better UX
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
      setIsLoading(false); // Stop loading regardless of success or failure
    }
  };

  const isFormValid = Object.entries(inputFields).every(([key, field]) =>
    field.required ? formValues[key].trim() !== '' : true
  );

  // Button should be disabled when loading OR form is invalid
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
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleContactSelect = (number, name) => {
    handleChange('field1', number);
    setModalVisible(false);
    console.log("field1", number, name);
    setName(name);
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

      <ScrollView style={styles.container}>
        {Object.entries(inputFields).map(([key, field], index) => (
          <Card key={key} style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge">{field.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <CustomInput
                  placeholder={`Enter ${field.label}`}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={formValues[key]}
                  onChangeText={(text) => handleChange(key, text)}
                  editable={!isLoading}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  inputStyle={{
                    backgroundColor: 'white',
                    borderColor: '#ccc',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                />
                
                {index === 0 && (
                  <IconButton
                    icon="account-box"
                    onPress={openContactModal}
                    accessibilityLabel="Pick Contact"
                    style={{ 
                      height: 45,
                      marginLeft: 8,
                      backgroundColor: 'rgb(231 224 236)',
                    }}
                    disabled={isLoading}
                  />
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* Info Box */}
        <Card style={styles.infoBox}>
          <Card.Content style={{ flexDirection: 'row', gap: 10 }}>
            <Image source={imageMap['bharat_connect']} style={styles.infoLogo} />
            <Text style={styles.infoText}>
              By proceeding further, you allow vasbazaar to fetch your current and future bills and remind you.
            </Text>
          </Card.Content>
        </Card>

        {/* DTH Recharge Instruction */}
        <Text style={styles.blakPutti}> Keep Set top box on while recharging.</Text>

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
            'CONFIRM'
          )}
        </Button>
      </ScrollView>

      {/* Contact Selection Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
          <Searchbar
            placeholder="Search Contacts"
            onChangeText={handleSearch}
            value={searchQuery}
            style={{
              marginBottom: 10,
              marginTop: 40,
              backgroundColor: 'white',
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 8,
            }}
            inputStyle={{
              color: 'black',
              fontSize: 14,
            }}
            placeholderTextColor="#888"
            iconColor="black"
          />

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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  item.phoneNumbers && item.phoneNumbers.length > 0 &&
                  handleContactSelect(item.phoneNumbers[0].number, item.name || 'No Name1')
                }
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.name || 'No Name1'}</Text>
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

          <View style={{ backgroundColor: 'black', borderRadius: 4 }}>
            <Button
              mode="text"
              onPress={() => setModalVisible(false)}
              labelStyle={{ color: 'white' }}
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
  blakPutti: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});