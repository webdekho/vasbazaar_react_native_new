import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ActivityIndicator, Avatar, Card, Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import MainHeader from '../../../components/MainHeader';

export default function BillViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    operator_id = null,
    serviceId = 'NA',
    contact = {},
    operator = 'NA',
    name = 'No Name',
    companyLogo = '',
    bill_details = {},
    amountExactness,
    field1 = null,
    field2 = null,  
  } = params || {};

  // Parse contact if it's a string
  let contactData = {};
  try {
    contactData = typeof contact === 'string' ? JSON.parse(contact) : contact;
  } catch (error) {
    console.warn('Could not parse contact data:', error);
    contactData = {};
  }

  // Parse bill_details if it's a string
  let billDetailsData = {};
  try {
    billDetailsData = typeof bill_details === 'string' ? JSON.parse(bill_details) : bill_details;
  } catch (error) {
    console.warn('Could not parse bill_details data:', error);
    billDetailsData = {};
  }

  const [mobile] = useState(contactData?.number || params.mobile || 'NA');
  const [logo] = useState(companyLogo);
  const [amount, setAmount] = useState(billDetailsData?.billAmount?.toString() || '');
  const amt = billDetailsData?.billAmount || 0;
  
  // Predefined amounts for quick selection
  const quickAmounts = ['500', '2000', '3000', '4000'];

  useEffect(() => {
    console.log('BillViewScreen mounted with params:', params);
    console.log('Parsed bill details:', billDetailsData);
    
    // Set default amount based on serviceId
    if (serviceId === '5' || serviceId === 5 || parseInt(serviceId) === 5) {
      setAmount('1000');
    }
  }, [serviceId, params]);

  const labelMap = {
    customername: 'Customer Name',
    dueDate: 'Due Date',
    billAmount: 'Bill Amount',
    statusMessage: 'Status Message',
    acceptPayment: 'Accept Payment',
    acceptPartPay: 'Accept Partial Payment',
    maxBillAmount: 'Max Bill Amount',
    billnumber: 'Bill Number',
    billdate: 'Bill Date',
    billperiod: 'Bill Period',
    paymentAmountExactness: 'Exact Payment Required',
    // FASTag specific fields
    vehicleNumber: 'Vehicle Number',
    fastagBalance: 'FASTag Balance',
    vehicleModel: 'Vehicle Model',
    tagId: 'Tag ID',
  };

  // Keys to hide from bill details
  const hiddenKeys = ['statusMessage', 'acceptPayment', 'acceptPartPay', 'paymentAmountExactness'];

  const isExactAmount = amountExactness === "Exact" && amt > 0;

  const formatValue = (key, value) => {
    if ((key === 'billAmount' || key === 'fastagBalance') && value) {
      return `₹${value}`;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value;
  };

  const handlePayBill = async () => {
    try {
      setIsSubmitting(true);

      // Validate amount
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }

      // Simulate API call delay (remove this in production)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prepare all required params
      router.push({
        pathname: '/main/common/OfferScreen',
        params: {
          plan: JSON.stringify({ price: "₹" + amount.toString() }),
          serviceId,
          operator_id,
          circleCode: null,
          companyLogo: logo,
          name,
          mobile,
          operator,
          circle: null,
          bill_details: JSON.stringify(billDetailsData),
          field1,
          field2
        }
      });

    } catch (error) {
      console.error('Payment navigation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render FASTag specific layout
  const renderFasTagLayout = () => {
    // Use data from route params and bill_details
    const fastagData = {
      customerName: billDetailsData?.customername || name || 'Customer Name',
      fastagBalance: billDetailsData?.fastagBalance || billDetailsData?.billAmount || '0',
      vehicleModel: billDetailsData?.vehicleModel || 'No Record Found',
      tagId: billDetailsData?.tagId || mobile || ''
    };

    return (
      <>
        <MainHeader 
          title={operator}
          showBack={true}
          onBackPress={() => router.back()}
        />
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={{ paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

        {/* FASTag Card */}
        <View style={styles.fastagCard}>
          <View style={styles.fastagLogoContainer}>
            {logo ? (
              <Image 
                source={{ uri: logo }} 
                style={styles.fastagLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.fastagLogo, styles.fastagLogoPlaceholder]}>
                <Ionicons name="car" size={30} color="#fff" />
              </View>
            )}
            <View style={styles.fastagInfo}>
              <Text style={styles.fastagTitle}>{operator}</Text>
              <Text style={styles.fastagId}>{fastagData.tagId}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer Name</Text>
              <Text style={styles.detailValue}>{fastagData.customerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>FASTag Balance</Text>
              <Text style={[styles.detailValue, styles.balanceText]}>{fastagData.fastagBalance}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle Model</Text>
              <Text style={styles.detailValue}>{fastagData.vehicleModel}</Text>
            </View>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountTitle}>Amount</Text>
          
          {/* Amount Input */}
          <View style={styles.amountInputContainer}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={isExactAmount ? undefined : (text) => {
                // Only allow numbers and decimal point
                const numericText = text.replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                const parts = numericText.split('.');
                const filteredText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                setAmount(filteredText);
              }}
              style={[styles.amountInput, isExactAmount && styles.amountInputDisabled]}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
              editable={!isExactAmount}
            />
          </View>

          {/* Quick Amount Selection */}
          <View style={styles.quickAmountContainer}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount && styles.quickAmountButtonActive,
                  isExactAmount && styles.quickAmountButtonDisabled
                ]}
                onPress={isExactAmount ? undefined : () => setAmount(quickAmount)}
                disabled={isExactAmount}
              >
                <Text 
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount && styles.quickAmountTextActive,
                    isExactAmount && styles.quickAmountTextDisabled
                  ]}
                >
                  ₹{quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {isExactAmount && (
            <Text style={styles.exactAmountNoteFasTag}>
              * Exact amount required for this bill
            </Text>
          )}
        </View>

        {/* Terms Text */}
        <Text style={styles.termsText}>
          By proceeding further, you allow vasbazaar to fetch your current and future bills and remind you
        </Text>
        
        {/* Bottom Button */}
        <View style={styles.bottomPaySection}>
          <TouchableOpacity
            style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
            onPress={handlePayBill}
            disabled={isSubmitting}
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
              <Text style={styles.confirmButtonText}>Proceed to Pay</Text>
            )}
          </TouchableOpacity>
        </View>
        
        </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  };

  // Render default layout for other services
  const renderDefaultLayout = () => {
    return (
      <>
        <MainHeader 
          title={operator}
          showBack={true}
          onBackPress={() => router.back()}
        />
      
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={{ paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Biller Header Card */}
          <Card style={styles.billerHeaderCard}>
            <Card.Content style={styles.billerHeaderContent}>
              <View style={styles.billerInfoRow}>
                <Avatar.Image
                  source={logo ? { uri: logo } : require('../../../assets/icons/default.png')}
                  style={styles.billerLogo}
                  size={48}
                />
                <View style={styles.billerInfo}>
                  <Text style={styles.billerName}>{operator}</Text>
                  <Text style={styles.billerCategory}>Bharat Billpay</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Amount to Pay Section */}
          <View style={styles.amountToPaySection}>
            <Text style={styles.amountToPayLabel}>Amount to pay</Text>
            <Text style={styles.amountToPayValue}>₹{parseFloat(amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>

          {/* Bill Details Card */}
          <Card style={styles.billDetailsCard}>
            <Card.Content style={styles.billDetailsContent}>
              <View style={styles.billDetailsGrid}>
                {Object.entries(billDetailsData)
                  .filter(([key, value]) => 
                    value != null && 
                    value.toString().trim() !== '' &&
                    !hiddenKeys.includes(key)
                  )
                  .map(([key, value], index) => {
                    const formattedKey = labelMap[key] || key
                      .replace(/_/g, ' ')
                      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
                    
                    const allEntries = Object.entries(billDetailsData)
                      .filter(([k, v]) => 
                        v != null && 
                        v.toString().trim() !== '' &&
                        !hiddenKeys.includes(k)
                      );
                    
                    const isEven = index % 2 === 0;
                    const isLastRow = index >= allEntries.length - 2;

                    return (
                      <View key={key} style={[
                        styles.billDetailItem,
                        isEven ? styles.billDetailItemLeft : styles.billDetailItemRight,
                        isLastRow && styles.billDetailItemLastRow
                      ]}>
                        <Text style={styles.billDetailLabel}>{formattedKey}</Text>
                        <Text style={styles.billDetailValue}>{formatValue(key, value)}</Text>
                      </View>
                    );
                  })}
              </View>
            </Card.Content>
          </Card>

          {/* Amount Input Card - Only show if amount is not exact */}
          {!isExactAmount && (
            <Card style={styles.amountInputCard}>
              <Card.Content>
                <Text variant="labelLarge" style={styles.amountFieldLabel}>Amount</Text>
                <TextInput
                  style={styles.amountTextInput}
                  mode="outlined"
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const numericText = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = numericText.split('.');
                    const filteredText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                    setAmount(filteredText);
                  }}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#000000"
                  outlineStyle={{ borderWidth: 2, borderRadius: 12 }}
                  disabled={isSubmitting}
                />
              </Card.Content>
            </Card>
          )}

          {/* Bottom Button */}
          <View style={styles.bottomPaySection}>
            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
              onPress={handlePayBill}
              disabled={isSubmitting}
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
                <Text style={styles.confirmButtonText}>Pay Bill</Text>
              )}
            </TouchableOpacity>
          </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  };

  // Debug logging
  console.log('BillViewScreen route params processed:', params);
  console.log('ServiceId type and value processed:', typeof serviceId, serviceId);

  // Main render - choose layout based on serviceId
  const isFasTagService = serviceId === '5' || serviceId === 5 || parseInt(serviceId) === 5;
  
  if (isFasTagService) {
    return renderFasTagLayout();
  }

  return renderDefaultLayout();
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: { 
    backgroundColor: '#f8f9fa',
    padding: 16,
    flex: 1,
  },
  
  // FASTag specific styles
  fastagCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fastagLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  fastagLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  fastagLogoPlaceholder: {
    backgroundColor: '#000000ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fastagInfo: {
    marginLeft: 16,
    flex: 1,
  },
  fastagTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  fastagId: {
    fontSize: 16,
    color: '#666',
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  balanceText: {
    color: '#e74c3c',
  },
  amountSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  rupeePrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    padding: 0,
    backgroundColor: 'transparent',
  },
  amountInputDisabled: {
    color: '#999',
    backgroundColor: '#f5f5f5',
  },
  quickAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#1a73e8',
  },
  quickAmountButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  quickAmountTextDisabled: {
    color: '#999',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  // Default layout styles
  billerHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  billerHeaderContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  billerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billerLogo: {
    width: 48,
    height: 48,
    backgroundColor: '#f6f6f6',
    marginRight: 16,
  },
  billerInfo: {
    flex: 1,
  },
  billerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  billerCategory: {
    fontSize: 14,
    color: '#666',
  },
  amountToPaySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountToPayLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  amountToPayValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  billDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  billDetailsContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  billDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  billDetailItem: {
    width: '48%',
    marginBottom: 24,
  },
  billDetailItemLeft: {
    marginRight: '2%',
  },
  billDetailItemRight: {
    marginLeft: '2%',
  },
  billDetailItemLastRow: {
    marginBottom: 8,
  },
  billDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  billDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  amountInputCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountFieldLabel: {
    marginBottom: 8,
    color: '#000',
    fontWeight: '600',
  },
  amountTextInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    height: 56,
  },
  viCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logo: { 
    width: 48, 
    height: 48, 
    backgroundColor: '#f6f6f6' 
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  billDetailsContainer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  accordion: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  accordionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  detailsContainer: {
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    minHeight: 44,
  },
  firstInfoRow: {
    paddingTop: 12,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
    paddingBottom: 12,
  },
  infoKey: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    lineHeight: 20,
    paddingRight: 16,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'right',
    lineHeight: 20,
  },
  amountContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  amountLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountInputDefault: {
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  amountInputDefaultDisabled: {
    backgroundColor: '#f5f5f5',
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  exactAmountNote: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exactAmountNoteFasTag: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomPaySection: {
    paddingVertical: 0,
    paddingBottom: Platform.select({
      web: 30,
      default: 20,
    }),
    backgroundColor: '#f8f9fa',
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
  buttonContent: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});