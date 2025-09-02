import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  TextInput
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import MainHeader from '../../../components/MainHeader';
import { AuthContext } from '../../../context/AuthContext';

/**
 * CORE LOGIC EXTRACTED FROM ORIGINAL:
 * 
 * 1. Route Parameters Handling:
 *    - operator_id, serviceId, contact, operator, name, companyLogo, bill_details, amountExactness
 * 
 * 2. Service Type Detection:
 *    - FASTag service (serviceId === '5') gets special UI layout
 *    - Other services use default layout with bill details accordion
 * 
 * 3. Amount Management:
 *    - Dynamic amount input with validation
 *    - Quick amount selection for FASTag
 *    - Exact amount enforcement based on amountExactness
 * 
 * 4. Bill Details Processing:
 *    - Dynamic field mapping with labelMap
 *    - Hide specific fields (statusMessage, acceptPayment, etc.)
 *    - Format currency values with ₹ symbol
 * 
 * 5. Payment Flow:
 *    - Validation before navigation to Payment screen
 *    - Pass all required parameters for payment processing
 */

export default function BillViewScreen({ route, navigation }) {
  const authContext = useContext(AuthContext);
  
  // Extract and set defaults for route parameters
  const {
    operator_id = null,
    serviceId = 'NA',
    contact = {},
    operator = 'NA',
    name = 'No Name',
    companyLogo = '',
    bill_details = {},
    amountExactness
  } = route.params || {};

  // State management
  const [amount, setAmount] = useState(bill_details?.billAmount?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const mobile = contact?.number || 'NA';
  const billAmount = bill_details?.billAmount || 0;
  const isExactAmountRequired = amountExactness === "Exact" && billAmount > 0;
  const isFasTagService = serviceId === '5' || serviceId === 5 || parseInt(serviceId) === 5;

  // Quick amount options for FASTag
  const quickAmounts = ['500', '1000', '2000', '3000'];

  useEffect(() => {
    // Set default amount for FASTag service
    if (isFasTagService && !amount) {
      setAmount('1000');
    }
  }, [serviceId, isFasTagService]);

  // Field mapping for bill details
  const fieldLabels = {
    customername: 'Customer Name',
    dueDate: 'Due Date',
    billAmount: 'Bill Amount',
    billnumber: 'Bill Number',
    billdate: 'Bill Date',
    billperiod: 'Bill Period',
    vehicleNumber: 'Vehicle Number',
    fastagBalance: 'FASTag Balance',
    vehicleModel: 'Vehicle Model',
    tagId: 'Tag ID',
  };

  // Fields to hide from display
  const hiddenFields = ['statusMessage', 'acceptPayment', 'acceptPartPay', 'paymentAmountExactness'];

  const formatFieldValue = (key, value) => {
    if ((key === 'billAmount' || key === 'fastagBalance') && value) {
      return `₹${value}`;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value?.toString() || '';
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount);
  };

  const validateAndProceed = async () => {
    // Amount validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (isExactAmountRequired && Number(amount) !== billAmount) {
      Alert.alert('Exact Amount Required', `Please enter exactly ₹${billAmount}`);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Navigate to payment screen with all required parameters
      navigation.navigate('Payment', {
        plan: { price: "₹" + amount.toString() },
        serviceId,
        operator_id,
        circleCode: null,
        companyLogo,
        name,
        mobile,
        operator,
        circle: null,
        bill_details,
      });

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render company logo/avatar
  const renderCompanyLogo = () => (
    <View style={styles.logoContainer}>
      {companyLogo ? (
        <Image 
          source={{ uri: companyLogo }} 
          style={styles.companyLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Ionicons name="business" size={24} color="#666" />
        </View>
      )}
    </View>
  );

  // Render bill details section
  const renderBillDetails = () => {
    const validDetails = Object.entries(bill_details)
      .filter(([key, value]) => 
        value != null && 
        value.toString().trim() !== '' &&
        !hiddenFields.includes(key)
      );

    if (validDetails.length === 0) return null;

    return (
      <View style={styles.detailsCard}>
        <TouchableOpacity 
          style={styles.detailsHeader}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsTitle}>Bill Details</Text>
          <Ionicons 
            name={showDetails ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {showDetails && (
          <View style={styles.detailsList}>
            {validDetails.map(([key, value], index) => {
              const label = fieldLabels[key] || key
                .replace(/_/g, ' ')
                .replace(/\w\S*/g, txt => 
                  txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
                );
              
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>
                    {formatFieldValue(key, value)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Render amount input section
  const renderAmountSection = () => (
    <View style={styles.amountCard}>
      <Text style={styles.amountTitle}>Enter Amount</Text>
      
      <View style={styles.amountInputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          editable={!isExactAmountRequired && !isLoading}
          placeholderTextColor="#999"
        />
      </View>

      {isExactAmountRequired && (
        <Text style={styles.exactAmountNote}>
          * Exact amount of ₹{billAmount} is required
        </Text>
      )}

      {isFasTagService && (
        <View style={styles.quickAmountGrid}>
          {quickAmounts.map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              style={[
                styles.quickAmountButton,
                amount === quickAmount && styles.quickAmountActive
              ]}
              onPress={() => handleAmountSelect(quickAmount)}
              disabled={isLoading}
            >
              <Text 
                style={[
                  styles.quickAmountText,
                  amount === quickAmount && styles.quickAmountTextActive
                ]}
              >
                ₹{quickAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render FASTag specific layout
  const renderFasTagLayout = () => {
    const fastagData = {
      customerName: bill_details?.customername || name,
      balance: bill_details?.fastagBalance || bill_details?.billAmount || '0',
      vehicleModel: bill_details?.vehicleModel || 'Vehicle',
      tagId: bill_details?.tagId || mobile
    };

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* FASTag Header Card */}
        <View style={styles.fastagCard}>
          <View style={styles.fastagHeader}>
            {renderCompanyLogo()}
            <View style={styles.fastagInfo}>
              <Text style={styles.operatorName}>{operator}</Text>
              <Text style={styles.tagId}>ID: {fastagData.tagId}</Text>
            </View>
          </View>
          
          <View style={styles.fastagDetails}>
            <View style={styles.fastagDetailRow}>
              <Text style={styles.fastagLabel}>Customer Name</Text>
              <Text style={styles.fastagValue}>{fastagData.customerName}</Text>
            </View>
            <View style={styles.fastagDetailRow}>
              <Text style={styles.fastagLabel}>Balance</Text>
              <Text style={[styles.fastagValue, styles.balanceText]}>
                ₹{fastagData.balance}
              </Text>
            </View>
            <View style={styles.fastagDetailRow}>
              <Text style={styles.fastagLabel}>Vehicle</Text>
              <Text style={styles.fastagValue}>{fastagData.vehicleModel}</Text>
            </View>
          </View>
        </View>

        {renderAmountSection()}
        
        <Text style={styles.termsText}>
          By proceeding, you allow vasbazaar to fetch your bills and send reminders
        </Text>
      </ScrollView>
    );
  };

  // Render default layout
  const renderDefaultLayout = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Service Header Card */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          {renderCompanyLogo()}
          <View style={styles.serviceInfo}>
            <Text style={styles.mobileNumber}>{mobile}</Text>
            <Text style={styles.operatorName}>{operator}</Text>
          </View>
        </View>
      </View>

      {renderBillDetails()}
      {renderAmountSection()}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <MainHeader 
        title={operator}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {isFasTagService ? renderFasTagLayout() : renderDefaultLayout()}
      
      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, isLoading && styles.buttonDisabled]}
          onPress={validateAndProceed}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.proceedButtonText}>
              {isFasTagService ? 'Proceed to Pay' : 'Pay Bill'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

BillViewScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  
  // Logo components
  logoContainer: {
    marginRight: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Service card (default layout)
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  mobileNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  operatorName: {
    fontSize: 14,
    color: '#666',
  },

  // FASTag card
  fastagCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fastagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fastagInfo: {
    flex: 1,
  },
  tagId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fastagDetails: {
    gap: 12,
  },
  fastagDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fastagLabel: {
    fontSize: 14,
    color: '#666',
  },
  fastagValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  balanceText: {
    color: '#e74c3c',
  },

  // Bill details
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  detailsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },

  // Amount section
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  amountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#fafafa',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    padding: 0,
  },
  exactAmountNote: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Quick amounts for FASTag
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickAmountActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#2196f3',
  },

  // Terms text
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },

  // Bottom action
  bottomContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  proceedButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});