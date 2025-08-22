import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, List, Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ViewBill({ route, navigation }) {
  const [expanded, setExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authContext = useContext(AuthContext);

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

  const [mobile] = useState(contact?.number || 'NA');
  const [circle] = useState(null);
  const [logo] = useState(companyLogo);
  const [amount, setAmount] = useState(bill_details?.billAmount?.toString() || '');
  const amt = bill_details?.billAmount || 0;
  
  const handleAccordionToggle = () => setExpanded(prev => !prev);

  // Predefined amounts for quick selection
  const quickAmounts = ['500', '2000', '3000', '4000'];

  useEffect(() => {
    console.log('ViewBill mounted with params:', route.params);
    console.log('Full route object:', route);
    
    // Set default amount based on serviceId
    if (serviceId === '5' || serviceId === 5 || parseInt(serviceId) === 5) {
      setAmount('1000');
    }
  }, [serviceId, route]);

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

  const isExactAmount = amountExactness !== "Exact" || amt === 0;

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
      navigation.navigate('Payment', {
        plan: { price: "₹" + amount.toString() },
        serviceId,
        operator_id,
        circleCode: 'NA',
        companyLogo: logo,
        name,
        mobile,
        operator,
        circle,
        bill_details,
      });

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render FASTag specific layout
  const renderFasTagLayout = () => {
    // Use data from route params and bill_details
    const fastagData = {
      customerName: bill_details?.customername || name || 'Customer Name',
      fastagBalance: bill_details?.fastagBalance || bill_details?.billAmount || '-59.5',
      vehicleModel: bill_details?.vehicleModel || '8 seater Maruti Omni',
      tagId: bill_details?.tagId || mobile || 'MH11Y4381'
    };

    return (
      <>
        <CommonHeader2
          heading={operator}
          showLogo={true}
          bharat_connect="bharat_connect"
          whiteHeader={true}
          whiteText={false}
        />
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

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
              onChangeText={setAmount}
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Quick Amount Selection */}
          <View style={styles.quickAmountContainer}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount && styles.quickAmountButtonActive
                ]}
                onPress={() => setAmount(quickAmount)}
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
        </View>

        {/* Terms Text */}
        <Text style={styles.termsText}>
          By proceeding further, you allow vasbazaar to fetch your current and future bills and remind you
        </Text>

        {/* Proceed to Pay Button */}
        <TouchableOpacity
          style={[styles.proceedButton, isSubmitting && styles.proceedButtonDisabled]}
          onPress={handlePayBill}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
          )}
        </TouchableOpacity>
        
        </ScrollView>
      </>
    );
  };

  // Render default layout for other services
  const renderDefaultLayout = () => {
    return (
      <>
        <CommonHeader2
          heading={operator}
          showLogo={true}
          bharat_connect="bharat_connect"
          whiteHeader={true}
          whiteText={false}
        />
      
        <View style={styles.container}>
          {/* User Info Card */}
          <Card style={styles.viCard}>
            <Card.Title
              title={`${mobile}`}
              subtitle={circle ? `${operator} • ${circle}` : operator}
              titleStyle={styles.cardTitle}
              subtitleStyle={styles.cardSubtitle}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  source={logo ? { uri: logo } : require('../../../../assets/icons/default.png')}
                  style={styles.logo}
                />
              )}
            />

            {/* Professional Bill Details Section */}
            <Card.Content style={styles.billDetailsContainer}>
              <List.Accordion
                onPress={handleAccordionToggle}
                expanded={expanded}
                title="Bill Details"
                titleStyle={styles.accordionTitle}
                style={styles.accordion}
              >
                <View style={styles.detailsContainer}>
                  {Object.entries(bill_details)
                    .filter(([key, value]) => 
                      value != null && 
                      value.toString().trim() !== '' &&
                      !hiddenKeys.includes(key)
                    )
                    .map(([key, value], index) => {
                      const formattedKey = labelMap[key] || key
                        .replace(/_/g, ' ')
                        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

                      const filteredEntries = Object.entries(bill_details)
                        .filter(([k, v]) => 
                          v != null && 
                          v.toString().trim() !== '' &&
                          !hiddenKeys.includes(k)
                        );

                      return (
                        <View key={key} style={[
                          styles.infoRow,
                          index === 0 && styles.firstInfoRow,
                          index === filteredEntries.length - 1 && styles.lastInfoRow
                        ]}>
                          <Text style={styles.infoKey}>{formattedKey}</Text>
                          <Text style={styles.infoValue}>
                            {formatValue(key, value)}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </List.Accordion>
            </Card.Content>
          </Card>

          {/* Amount Input Card */}
          <Card style={styles.viCard}>
            <Card.Content style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Enter Amount</Text>
              <TextInput
                label="Amount"
                editable={isExactAmount && !isSubmitting}
                value={amount}
                onChangeText={(text) => setAmount(text)}
                keyboardType="numeric"
                style={styles.amountInputDefault}
                mode="outlined"
                outlineColor="#000"
                activeOutlineColor="#000"
                textColor="#000"
                disabled={isSubmitting}
                left={<TextInput.Icon icon={() => <Text style={styles.rupeeSymbol}>₹</Text>} />}
              />
              {!isExactAmount && (
                <Text style={styles.exactAmountNote}>
                  * Exact amount required for this bill
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Pay Bill Button with Loader */}
          <Button
            style={[
              styles.confirmButton,
              { 
                backgroundColor: isSubmitting ? '#666' : '#000',
                opacity: isSubmitting ? 0.7 : 1,
              }
            ]}
            mode="contained"
            disabled={isSubmitting}
            onPress={handlePayBill}
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
              <Text style={styles.buttonText}>Pay Bill</Text>
            )}
          </Button>
        </View>
      </>
    );
  };

  // Debug logging
  console.log('ViewBill route params:', { serviceId, operator, bill_details });
  console.log('ServiceId type:', typeof serviceId, 'Value:', serviceId);

  // Main render - choose layout based on serviceId
  if (serviceId === '5' || serviceId === 5 || parseInt(serviceId) === 5) {
    return renderFasTagLayout();
  }

  return renderDefaultLayout();
}

ViewBill.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
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
    outlineStyle: 'none',
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
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  proceedButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  proceedButtonDisabled: {
    opacity: 0.7,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Default layout styles
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
  confirmButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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