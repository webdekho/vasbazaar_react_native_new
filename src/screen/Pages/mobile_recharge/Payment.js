import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal, Platform, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Button, Card, List } from 'react-native-paper';

export default function Payment({ route, navigation }) {
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [errorMessage, setErrorMessage] = useState("Something went wrong");
  const [errorDetails, setErrorDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');
 const {
  plan = null,
  serviceId = null,
  operator_id = null,
  circleCode = null,
  companyLogo = null,
  name = null,
  mobile = null,
  operator = null,
  circle = null,
  coupon = null,
  coupon2 = null,
  selectedCoupon2 = null,
  bill_details = null,
  couponDesc = null,
} = route?.params || {};

  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [stepCount, setStepCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedPaymentMethod, setClickedPaymentMethod] = useState(null);
  const amount = parseFloat((plan?.price || '0').replace(/[₹,\s]/g, ''));
  
  const paymentIcons = {
    upi: require('../../../../assets/icons/upi.png'),
    wallet: require('../../../../assets/icons/wallet.png'),
  };

  const handlePayment = async (paymentType) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    console.log(`Payment initiated: ${paymentType}`);
    setIsProcessing(true);
    setClickedPaymentMethod(paymentType);
    setShowPopup(true);
    
    try {
      const result = await recharge(paymentType);
      
      console.log("=== PAYMENT HANDLER RESULT ===");
      console.log(JSON.stringify(result, null, 2));
      console.log("=============================");

      // Check for success/pending status (handle both 'Status' and 'status' fields)
      const isSuccessOrPending = 
        result?.Status?.toLowerCase() === 'success' || 
        result?.status?.toLowerCase() === 'success' ||
        result?.Status?.toLowerCase() === 'pending' || 
        result?.status?.toLowerCase() === 'pending';

      if (isSuccessOrPending) {
        Redirect(paymentType, result);
      } else {
        setShowFailurePopup(true);
        
        // Handle different error response formats
        const errorStatus = result?.Status || result?.status || "Failed";
        const errorMessage = result?.message || 
                           result?.data?.error || 
                           result?.d?.remark || 
                           'Recharge failed';
        
        setStatus(errorStatus);
        setErrorMessage(errorMessage);
        setErrorDetails(result); // Store full error response
        
        // Log error details
        console.log("=== PAYMENT ERROR DETAILS ===");
        console.log("Status:", errorStatus);
        console.log("StatusCode:", result?.StatusCode);
        console.log("Error Message:", errorMessage);
        console.log("Full Error Data:", result?.data);
        console.log("============================");
      }
    } catch (error) {
      console.error('=== PAYMENT EXCEPTION ===');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('========================');
      
      setShowFailurePopup(true);
      setStatus("Failed");
      setErrorMessage('Payment processing failed: ' + error.message);
    } finally {
      setShowPopup(false);
      // Keep buttons permanently disabled after any payment attempt
      // Do not reset isProcessing or clickedPaymentMethod
    }
  };

  
  const fetchPaymentUrl = async (upiToken) => {
        if (!upiToken) {
          return;
        }
  
        if (!userToken) {
          return;
        }
  
        try {
          console.log('Fetching payment URL with upiToken:', upiToken);
          
          // Make API call to get payment URL
          // Using getRecords since this is a GET request with query params
          // const response = await getRecords(
          //   { upiToken }, // query parameters
          //   userToken,    // access token
          //   'pay' // endpoint (upiToken will be added as query param)
          // );
  
          const response = await postRequest({},userToken,`pay?upiToken=${upiToken}`);
  
          console.log('Payment API response:', response);
          if (response.status === 'success' && response.data) {
            console.log('Payment URL set:', response.data);
            
            // Store payment URL for potential manual access
            if (Platform.OS === 'web') {
              window.sessionStorage.setItem('lastPaymentUrl', response.data);
            }
            
            openPaymentWindow(response.data);
          } else {
            throw new Error(response.message || 'Failed to generate payment link');
          }
        } catch (error) {
          console.error('Error fetching payment URL:', error);
          setShowFailurePopup(true);
          setStatus("Failed");
          setErrorMessage('Failed to generate payment link. Please try again.');
        }
      };

  const Redirect = async (paymentType, data) => {
    // Save last used serviceId to AsyncStorage for prioritization in Home.js
    if (serviceId) {
      try {
        await AsyncStorage.setItem('lastUsedServiceId', serviceId.toString());
        console.log('✅ Saved lastUsedServiceId to AsyncStorage:', serviceId);
      } catch (error) {
        console.error('❌ Error saving lastUsedServiceId to AsyncStorage:', error);
      }
    }

    if (paymentType === 'upi') {
      // For UPI payments, fetch the payment URL using the token
      if (data && data.upiToken) {
        fetchPaymentUrl(data.upiToken);
      } else {
        console.error('No UPI token received for payment');
        setShowFailurePopup(true);
        setStatus("Failed");
        setErrorMessage('Payment token not received. Please try again.');
      }
    } else {
      // For wallet payments, navigate directly to success
      // Do not reset isProcessing or clickedPaymentMethod
      // Buttons remain permanently disabled
      navigation.navigate('Success', {
        serviceId,
        operator_id,
        plan,
        circleCode,
        companyLogo,
        name,
        mobile,
        operator,
        circle,
        coupon,
        coupon2,
        paymentType,
        selectedCoupon2,
        response: data,
      });
    }
  };

  const openPaymentWindow = async(paymentUrl) => {
    if (Platform.OS === 'web') {
      try {
        // Show warning about potential security message
        const userConfirmed = window.confirm(
          'You will be redirected to the payment gateway.\n\n' +
          'Note: If you see a security warning from your browser, it\'s because the payment gateway uses test/staging URLs. ' +
          'You can safely proceed by clicking "Advanced" and then "Proceed to site" if you trust this payment.\n\n' +
          'Click OK to continue to payment.'
        );
        
        if (!userConfirmed) {
          console.log('User cancelled payment redirect');
          return;
        }
        
        const paymentWindow = window.open(
          paymentUrl, 
          'payment',
          'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        if (paymentWindow) {
          console.log('Payment window opened successfully');
          
          // Monitor the payment window
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              console.log('Payment window closed');
              
              // Show completion message with enhanced instructions
              setTimeout(() => {
                const result = window.confirm(
                  'Payment window has been closed.\n\n' +
                  'If you saw a "Dangerous site" warning:\n' +
                  '1. This is normal for test payment gateways\n' +
                  '2. If you completed the payment by proceeding anyway, click OK\n' +
                  '3. If you cancelled due to the warning, click Cancel\n\n' +
                  'Did you complete your payment successfully?'
                );
                
                if (result) {
                  // User confirms payment was successful
                  console.log('User confirmed payment success');
                  // Navigate to success page
                  // Do not reset isProcessing or clickedPaymentMethod
                  // Buttons remain permanently disabled
                  navigation.navigate('Success', {
                    serviceId,
                    operator_id,
                    plan,
                    circleCode,
                    companyLogo,
                    name,
                    mobile,
                    operator,
                    circle,
                    coupon,
                    coupon2,
                    paymentType: 'upi',
                    selectedCoupon2,
                    response: { status: 'success', message: 'Payment completed successfully' },
                  });
                } else {
                  console.log('User indicated payment was not completed');
                  // Show helpful message about the security warning
                  alert(
                    'Payment was not completed.\n\n' +
                    'If you encountered a browser security warning:\n' +
                    '• This is common with test/staging payment gateways\n' +
                    '• The payment gateway is safe to use\n' +
                    '• You can try again and click "Advanced" → "Proceed to site" when you see the warning'
                  );
                }
              }, 1000);
            }
          }, 1000);

          // Focus the payment window
          paymentWindow.focus();
          
        } else {
          // Popup was blocked
          alert(
            'Payment window was blocked by your browser.\n\n' +
            'Please allow popups for this site and try again.\n' +
            'Alternatively, you can copy this URL and open it manually:\n\n' + 
            paymentUrl
          );
          console.error('Payment window was blocked');
        }
      } catch (error) {
        console.error('Error opening payment window:', error);
        alert('Failed to open payment window: ' + error.message);
      }
    } else {
      // For mobile platforms, open in browser
      alert('Payment functionality is only available on web platform.');
    }
  }

  const getBalance = async () => {
    try {
      const response = await getRecords({}, userToken, 'api/customer/user/getByUserId');
      if (response?.status === 'success') {
        const { balance } = response.data;
        setWalletBalance(balance.toFixed(2));
      }
    } catch (error) {
      if (Platform.OS === "web") {
        console.error('Balance fetch error', error);
      }
    }
  };

  const recharge = async (paymentType) => {
    try {
      const amount = parseFloat((plan?.price || '0').replace(/[₹,\s]/g, ''));
      const validityString = plan?.validity || '';
      const validity = parseInt(validityString.replace(/[^\d]/g, ''), 10) || null;

      const payload = {
        amount: amount,
        operatorId: operator_id,
        circleId: circleCode,
        validity: validity,
        couponId1: coupon || null,
        couponId2: selectedCoupon2 || null,
        payType: paymentType || 'wallet',
        mobile: mobile,
        couponDisc:couponDesc,
        viewBillResponse:{"data": [bill_details],"success": "true"}
      };
      
      // Log the request payload
      console.log("=== RECHARGE API REQUEST ===");
      console.log("URL: api/customer/plan_recharge/recharge");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      console.log("Payment Type:", paymentType);
      console.log("===========================");
      
      const response = await postRequest(
        payload,
        userToken,
        'api/customer/plan_recharge/recharge'
      );
      
      // Log the complete API response
      console.log("=== COMPLETE RECHARGE API RESPONSE ===");
      console.log(JSON.stringify(response, null, 2));
      console.log("=====================================");
      
      // Also log individual fields for clarity
      if (response) {
        console.log("Status:", response.Status || response.status);
        console.log("StatusCode:", response.StatusCode);
        console.log("Message:", response.message);
        console.log("Data:", response.data);
      }
      
      // Check for success status (handle both 'Status' and 'status' fields)
      const isSuccess = response?.Status?.toLowerCase() === 'success' || 
                       response?.status?.toLowerCase() === 'success';
      
      if (isSuccess) {
        return response.data || response;
      } else {
        // Return the full response for error handling
        return response;
      }
    } catch (error) {
      setShowFailurePopup(true);
      setStatus("Error");
      setErrorMessage('An error occurred during payment');
      throw error;
    }
  };

  useEffect(() => {
    getBalance();
  }, []);

  useEffect(() => {
    let interval;
    if (showPopup) {
      setStepCount(1);
      interval = setInterval(() => {
        setStepCount(prev => prev >= 3 ? prev : prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPopup]);

  return (
    <>
      <CommonHeader2 heading="Payment" goback="Home" />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Number + Operator Info */}
        <Card style={styles.viCard}>
          <Card.Title
            title={`${name} • ${mobile}`}
            subtitle={`${operator} • ${circle}`}
            left={(props) => (
              <Avatar.Image
                {...props}
                source={companyLogo ? { uri: companyLogo } : require('../../../../assets/icons/default.png')}
                style={styles.logo}
              />
            )}
            titleStyle={styles.userName}
            subtitleStyle={styles.userPlan}
          />
        </Card>

        {/* Plan Details */}
        <Card style={styles.planCard}>
          <Card.Content>
            <View style={styles.planRowSingle}>
              {plan.price && (
                <View style={styles.planColumn}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
              )}
        
              {plan.validity && (
                <View style={styles.planColumn}>
                  <Text style={styles.detailLabel}>Validity</Text>
                  <Text style={styles.detailValue}>{plan.validity}</Text>
                </View>
              )}
        
              {plan.data && (
                <View style={styles.planColumn}>
                  <Text style={styles.detailLabel}>Data</Text>
                  <Text style={styles.detailValue}>{plan.data}</Text>
                </View>
              )}
            </View>
        
            {plan.description && (
              <View style={styles.accordionContainer}>
                <List.Accordion
                  title="View Details"
                  expanded={expanded}
                  onPress={() => setExpanded(!expanded)}
                  titleStyle={styles.accordionTitle}
                  style={styles.accordion}
                >
                  <Text style={styles.planDescriptionText}>{plan.description}</Text>
                </List.Accordion>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Options */}
        <Text style={styles.paymentHeader}>Payment options</Text>
        {[
          {
            title: 'Wallet balance',
            description: `₹ ${walletBalance}`,
            payment_method: 'wallet',
            disabled: parseFloat(walletBalance) < amount || isProcessing,
            insufficientFunds: parseFloat(walletBalance) < amount,
          },
          {
            title: 'Pay using UPI',
            description: '& more',
            payment_method: 'upi',
            disabled: isProcessing,
            insufficientFunds: false,
          },
        ].map((item, index) => {
          const isThisButtonClicked = clickedPaymentMethod === item.payment_method;
          const isOtherButtonClicked = clickedPaymentMethod && clickedPaymentMethod !== item.payment_method;
          
          return (
            <View key={index} style={[
              styles.paymentOption,
              isOtherButtonClicked && styles.paymentOptionDisabled
            ]}>
              <Image
                source={paymentIcons[item.payment_method]}
                style={[
                  styles.paymentIcon,
                  (item.disabled || isOtherButtonClicked) && styles.paymentIconDisabled
                ]}
              />
              <View style={styles.paymentInfo}>
                <Text style={[
                  styles.paymentTitle,
                  (item.disabled || isOtherButtonClicked) && styles.paymentTextDisabled
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.paymentDescription,
                  (item.disabled || isOtherButtonClicked) && styles.paymentTextDisabled
                ]}>
                  {item.insufficientFunds && !isProcessing ? 'Insufficient balance' : item.description}
                </Text>
              </View>
              <Button
                mode="contained"
                disabled={item.disabled}
                onPress={() => !item.disabled && handlePayment(item.payment_method)}
                style={[
                  styles.payButton,
                  item.disabled && styles.disabledButton,
                  isThisButtonClicked && styles.processingButton
                ]}
                loading={isThisButtonClicked}
                labelStyle={[
                  isThisButtonClicked && { color: '#fff' }
                ]}
              >
                {isThisButtonClicked ? 'Processing...' : (isProcessing ? 'Disabled' : 'Pay')}
              </Button>
            </View>
          );
        })}
      </ScrollView>

      {/* Processing Modal */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.popupBox}>
            <Image
              source={companyLogo ? { uri: companyLogo } : require('../../../../assets/icons/default.png')}
              style={styles.popupImage}
              resizeMode="contain"
            />
            <View style={styles.stepCircle}>
              <Text style={styles.stepText}>{stepCount}</Text>
            </View>
            <Text style={styles.popupText}>Processing payment</Text>
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          </View>
        </View>
      </Modal>

      {/* Failure Modal */}
      <Modal visible={showFailurePopup} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.popupBox, { maxWidth: 350 }]}>
            <Image
              source={require('../../../../assets/icons/failure.png')}
              style={styles.popupImage}
              resizeMode="contain"
            />
            <Text style={[styles.popupText, { color: 'red' }]}>Transaction {status}</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Text style={[styles.errorMessage, { fontSize: 12, marginTop: 10, fontStyle: 'italic' }]}>
              Payment buttons are now disabled. Please go back to try again with a new transaction.
            </Text>
            
            {/* Show manual payment link option if available */}
            {Platform.OS === 'web' && window.sessionStorage.getItem('lastPaymentUrl') && (
              <TouchableOpacity
                onPress={() => {
                  const paymentUrl = window.sessionStorage.getItem('lastPaymentUrl');
                  if (paymentUrl) {
                    const userChoice = window.confirm(
                      'Would you like to copy the payment URL to open it manually?\n\n' +
                      'This can be helpful if you\'re experiencing browser security warnings.'
                    );
                    
                    if (userChoice) {
                      // Copy to clipboard
                      navigator.clipboard.writeText(paymentUrl).then(() => {
                        alert('Payment URL copied to clipboard!\n\nYou can now paste it in a new browser tab.');
                      }).catch(() => {
                        // Fallback: show the URL
                        window.prompt('Copy this payment URL:', paymentUrl);
                      });
                    }
                  }
                }}
                style={[styles.closeButton, { backgroundColor: '#007AFF', marginTop: 10 }]}
              >
                <Text style={[styles.closeButtonText, { color: '#fff' }]}>Copy Payment Link</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => {
                setShowFailurePopup(false);
                setErrorDetails(null);
                // Do not reset isProcessing or clickedPaymentMethod
                // Buttons remain permanently disabled
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 16,
  },
  viCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
    elevation: 1,
  },
  logo: {
    width: 45,
    height: 45,
    backgroundColor: '#f6f6f6',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userPlan: {
    fontSize: 14,
    color: '#666',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    marginVertical: 10,
    elevation: 2,
  },
  planRowSingle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planColumn: {
    flex: 1,
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  accordionContainer: {
    marginTop: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
  },
  accordion: {
    backgroundColor: '#F2F2F2',
    borderRadius: 6,
    paddingHorizontal: 0,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000ff',
  },
  planDescriptionText: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 8,
    lineHeight: 18,
  },
  paymentHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#888',
  },
  payButton: {
    paddingHorizontal: 8,
    backgroundColor: '#000000ff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  processingButton: {
    backgroundColor: '#666',
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentIconDisabled: {
    opacity: 0.5,
  },
  paymentTextDisabled: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 250,
  },
  popupImage: {
    width: 70,
    height: 70,
    marginBottom: 12,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  stepText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  popupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    color: '#000000ff',
    fontWeight: '600',
    textAlign: 'center',
  },
});