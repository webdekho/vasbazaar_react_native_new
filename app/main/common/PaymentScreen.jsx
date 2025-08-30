import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar, Button, Card, List } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';
import MainHeader from '../../../components/MainHeader';
import { initiatePayUPayment } from '../../../services/payment/payuService';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
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
    couponName = null
  } = params || {};

  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [stepCount, setStepCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedPaymentMethod, setClickedPaymentMethod] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // UPI selected by default
  
  // Parse plan data
  const planData = typeof plan === 'string' ? JSON.parse(plan || '{}') : (plan || {});
  const amount = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));
  
  const paymentIcons = {
    upi: require('../../../assets/icons/upi.png'),
    wallet: require('../../../assets/icons/wallet.png'),
    payu: require('../../../assets/icons/upi.png'), // Using UPI icon as placeholder for PayU
  };


  const handlePayment = async (paymentType) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    // Payment initiated
    setIsProcessing(true);
    setClickedPaymentMethod(paymentType);
    setShowPopup(true);
    
    try {
      const result = await recharge(paymentType);
      console.log('Payment result:', JSON.stringify(result, null, 2));
      
      // Check if outer API call was successful
      const apiSuccess = result?.Status?.toLowerCase() === 'success' || 
                        result?.status?.toLowerCase() === 'success';
      
      if (apiSuccess && result?.data) {
        // API call successful, now check inner data status
        const innerStatus = result.data.status?.toLowerCase();
        
        console.log('🔍 Payment Analysis:');
        console.log('  - Payment Type:', paymentType);
        console.log('  - Outer Status:', result?.Status || result?.status);
        console.log('  - Inner Status (raw):', result.data.status);
        console.log('  - Inner Status (processed):', innerStatus);
        console.log('  - Full data object:', result.data);
        
        if (paymentType === 'wallet') {
          // Wallet payment logic
          console.log('Wallet payment - checking inner status:', innerStatus);
          console.log('Raw data.status:', result.data.status);
          
          if (innerStatus === 'success') {
            // Wallet payment successful - redirect to SuccessScreen
            console.log('✅ Wallet payment successful, redirecting to SuccessScreen');
            Redirect(paymentType, result);
          } else {
            // Wallet payment failed - show failure popup
            console.log('❌ Wallet payment failed. Status:', innerStatus, 'Message:', result.data.message);
            setShowFailurePopup(true);
            setIsProcessing(false);
            setStatus("Failed");
            setErrorMessage(result.data.message || 'Wallet payment failed');
            setErrorDetails(result);
          }
        } else if (paymentType === 'upi') {
          // UPI payment logic
          if (innerStatus === 'pending') {
            // UPI payment pending - redirect to PendingScreen
            console.log('UPI payment pending, redirecting to PendingScreen');
            RedirectToPending(paymentType, result);
          } else if (innerStatus === 'success') {
            // UPI payment successful - redirect to SuccessScreen
            console.log('UPI payment successful, redirecting to SuccessScreen');
            Redirect(paymentType, result);
          } else {
            // UPI payment failed - show failure popup
            console.log('UPI payment failed:', result.data.message);
            setShowFailurePopup(true);
            setIsProcessing(false);
            setStatus("Failed");
            setErrorMessage(result.data.message || 'UPI payment failed');
            setErrorDetails(result);
          }
        } else if (paymentType === 'payu') {
          // PayU payment logic
          console.log('PayU payment initiated, handling PayU flow...');
          
          // For PayU, we need to redirect to PayU gateway
          const paymentData = {
            amount: amount,
            productInfo: `${serviceId === '1' ? 'Mobile Recharge' : serviceId === '2' ? 'DTH Recharge' : 'Bill Payment'} - ${operator || name}`,
            firstName: name || 'Customer',
            email: 'customer@vasbazaar.com', // You might want to get this from user data
            phone: mobile || '',
            transactionId: result.data.requestId || result.data.txnId || `TXN${Date.now()}`,
            udf1: serviceId || '',
            udf2: operator_id || '',
            udf3: mobile || '',
            udf4: circleCode || '',
            udf5: '',
          };
          
          // Save transaction data for later use
          const savedData = {
            ...paymentData,
            apiResponse: result.data,
            planData: planData,
            params: params,
            couponName: couponName,
          };
          console.log('Saving PayU transaction data to AsyncStorage:', savedData);
          await AsyncStorage.setItem('pendingPayUTransaction', JSON.stringify(savedData));
          
          // Initiate PayU payment
          const payuResult = await initiatePayUPayment(paymentData);
          
          if (payuResult.status === 'success') {
            console.log('PayU payment initiated successfully');
            // PayU will redirect back to callback URL
            setIsProcessing(false);
          } else {
            console.log('PayU payment initiation failed:', payuResult.message);
            setShowFailurePopup(true);
            setIsProcessing(false);
            setStatus("Failed");
            setErrorMessage(payuResult.message || 'Failed to initiate PayU payment');
          }
        }
      } else {
        // API call failed
        setShowFailurePopup(true);
        setIsProcessing(false);
        
        const errorStatus = result?.Status || result?.status || "Failed";
        const errorMessage = result?.message || 'API call failed';
        
        setStatus(errorStatus);
        setErrorMessage(errorMessage);
        setErrorDetails(result);
      }
    } catch (error) {
      console.error('Payment exception:', error);
      setShowFailurePopup(true);
      setStatus("Error");
      setErrorMessage('Payment processing failed: ' + error.message);
    } finally {
      setShowPopup(false);
    }
  };

  
  const fetchPaymentUrl = async (upiToken) => {
        if (!upiToken) {
          return;
        }
  
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          return;
        }
  
        try {
          // Fetching payment URL with upiToken
          
          // Make API call to get payment URL
          const response = await postRequest(`pay?upiToken=${upiToken}`, {}, sessionToken);

          // Payment API response processed
          if (response.status === 'success' && response.data) {
            // Payment URL set
            
            // Store payment URL for potential manual access
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.sessionStorage.setItem('lastPaymentUrl', response.data);
            }
            
            openPaymentWindow(response.data);
          } else {
            throw new Error(response.message || 'Failed to generate payment link');
          }
        } catch (error) {
          // Error fetching payment URL
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
        console.log('Saved lastUsedServiceId to AsyncStorage');
      } catch (error) {
        console.error('Error saving lastUsedServiceId to AsyncStorage:', error);
      }
    }

    if (paymentType === 'upi' && data?.data?.upiToken) {
      // For UPI payments with token, fetch the payment URL
      fetchPaymentUrl(data.data.upiToken);
    } else {
      // For wallet payments or UPI without token, navigate directly to success
      console.log('Navigating to SuccessScreen with data:', {
        paymentType,
        responseData: data?.data
      });
      
      router.push({
        pathname: '/main/common/SuccessScreen',
        params: {
          serviceId,
          operator_id,
          plan: typeof planData === 'object' ? JSON.stringify(planData) : plan,
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
          response: JSON.stringify(data),
          requestId: data?.data?.requestId || '',
          referenceId: data?.data?.referenceId || '',
          vendorRefId: data?.data?.vendorRefId || '',
          commission: data?.data?.commission || 0,
          couponName
        }
      });
    }
  };

  const RedirectToPending = async (paymentType, data) => {
    // Save last used serviceId to AsyncStorage for prioritization in Home.js
    if (serviceId) {
      try {
        await AsyncStorage.setItem('lastUsedServiceId', serviceId.toString());
        console.log('Saved lastUsedServiceId to AsyncStorage');
      } catch (error) {
        console.error('Error saving lastUsedServiceId to AsyncStorage:', error);
      }
    }

    console.log('Navigating to PendingScreen with data:', {
      paymentType,
      responseData: data?.data
    });

    router.push({
      pathname: '/main/common/PendingScreen',
      params: {
        serviceId,
        operator_id,
        plan: typeof planData === 'object' ? JSON.stringify(planData) : plan,
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
        response: JSON.stringify(data),
        requestId: data?.data?.requestId || '',
        referenceId: data?.data?.referenceId || '',
        vendorRefId: data?.data?.vendorRefId || '',
        commission: data?.data?.commission || 0,
        upiToken: data?.data?.upiToken || '',
      }
    });
  };

  const openPaymentWindow = async(paymentUrl) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Show warning about potential security message
        const userConfirmed = window.confirm(
          'You will be redirected to the payment gateway.\n\n' +
          'Note: If you see a security warning from your browser, it\'s because the payment gateway uses test/staging URLs. ' +
          'You can safely proceed by clicking "Advanced" and then "Proceed to site" if you trust this payment.\n\n' +
          'Click OK to continue to payment.'
        );
        
        if (!userConfirmed) {
          // User cancelled payment redirect
          return;
        }
        
        const paymentWindow = window.open(
          paymentUrl, 
          'payment',
          'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        if (paymentWindow) {
          // Payment window opened successfully
          
          // Monitor the payment window
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              // Payment window closed
              
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
                  // User confirmed payment success
                  // Navigate to success page
                  // Do not reset isProcessing or clickedPaymentMethod
                  // Buttons remain permanently disabled
                  router.push({
                    pathname: '/main/common/SuccessScreen',
                    params: {
                      serviceId,
                      operator_id,
                      plan: typeof planData === 'object' ? JSON.stringify(planData) : plan,
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
                      response: JSON.stringify({ status: 'success', message: 'Payment completed successfully' }),
                    }
                  });
                } else {
                  // User indicated payment was not completed
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
          // Payment window was blocked
        }
      } catch (error) {
        // Error opening payment window
        alert('Failed to open payment window: ' + error.message);
      }
    } else {
      // For mobile platforms, open in browser
      alert('Payment functionality is only available on web platform.');
    }
  }

  const getBalance = async () => {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) return;

      const response = await getRequest('api/customer/user/getByUserId', {}, sessionToken);
      if (response?.status === 'success') {
        const { balance } = response.data;
        setWalletBalance(balance.toFixed(2));
      }
    } catch (error) {
      if (Platform.OS === "web") {
        // Balance fetch error
      }
    }
  };

  const recharge = async (paymentType) => {
    try {
      const amount = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));
      const validityString = planData?.validity || '';
      const validity = parseInt(validityString.replace(/[^\d]/g, ''), 10) || null;

      const payload = {
        amount: amount,
        operatorId: parseInt(operator_id),
        circleId: circleCode ? String(circleCode) : null,
        validity: validity,
        couponId1: parseInt(coupon) || null,
        couponId2: selectedCoupon2 || null,
        payType: paymentType === 'payu' ? 'upi' : (paymentType || 'wallet'),
        mobile: mobile,
        couponDisc: couponDesc,
        viewBillResponse: {"data": [bill_details], "success": "true"}
      };

      // Save recharge payload to AsyncStorage for PendingScreen status checks
      const rechargePayloadForStatusCheck = {
        field1: mobile, // Using mobile number as field1
        viewBillResponse: payload.viewBillResponse,
        validity: validity,
        operatorId: payload.operatorId,
        circleId: payload.circleId,
        amount: payload.amount,
        paymentType: paymentType,
        timestamp: new Date().toISOString(),
        originalParams: params // Save original params for context
      };
      
      try {
        await AsyncStorage.setItem('pendingRechargePayload', JSON.stringify(rechargePayloadForStatusCheck));
        console.log('Saved recharge payload for status check:', rechargePayloadForStatusCheck);
      } catch (storageError) {
        console.error('Error saving recharge payload to AsyncStorage:', storageError);
        // Continue with API call even if storage fails
      }
      
      // Log the request payload
      // Recharge API request prepared
      
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const response = await postRequest(
        'api/customer/plan_recharge/recharge',
        payload,
        sessionToken
      );
      
      // Log the complete API response
      // Recharge API response received
      
      // Also log individual fields for clarity
      if (response) {
        // Response details processed
      }
      
      // Always return the complete response structure for proper handling
      console.log('Recharge API complete response:', JSON.stringify(response, null, 2));
      return response;
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
      <MainHeader title="Payment" />
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
                source={companyLogo ? { uri: companyLogo } : require('../../../assets/icons/default.png')}
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
              {planData.price && (
                <View style={styles.planColumn}>
                  <Text style={styles.planPrice}>{planData.price}</Text>
                </View>
              )}
        
              {planData.validity && (
                <View style={styles.planColumn}>
                  <Text style={styles.detailLabel}>Validity</Text>
                  <Text style={styles.detailValue}>{planData.validity}</Text>
                </View>
              )}
        
              {planData.data && (
                <View style={styles.planColumn}>
                  <Text style={styles.detailLabel}>Data</Text>
                  <Text style={styles.detailValue}>{planData.data}</Text>
                </View>
              )}
            </View>
        
            {planData.description && (
              <View style={styles.accordionContainer}>
                <List.Accordion
                  title="View Details"
                  expanded={expanded}
                  onPress={() => setExpanded(!expanded)}
                  titleStyle={styles.accordionTitle}
                  style={styles.accordion}
                >
                  <Text style={styles.planDescriptionText}>{planData.description}</Text>
                </List.Accordion>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Options */}
        <Text style={styles.paymentSectionTitle}>Select Payment Method</Text>
        
        {/* Wallet Payment Method */}
        <TouchableOpacity 
          style={[
            styles.paymentMethodCard,
            selectedPaymentMethod === 'wallet' && styles.selectedPaymentMethod,
            (parseFloat(walletBalance) < amount || isProcessing) && styles.disabledPaymentMethod
          ]}
          onPress={() => {
            if (!(parseFloat(walletBalance) < amount || isProcessing)) {
              setSelectedPaymentMethod('wallet');
            }
          }}
          disabled={parseFloat(walletBalance) < amount || isProcessing}
        >
          <View style={styles.paymentMethodIcon}>
            <Image source={paymentIcons.wallet} style={styles.paymentIcon} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodHeader}>
              <Text style={[
                styles.paymentMethodName,
                (parseFloat(walletBalance) < amount || isProcessing) && styles.disabledText
              ]}>
                Wallet Balance
              </Text>
              {parseFloat(walletBalance) < amount && (
                <View style={styles.insufficientBadge}>
                  <Text style={styles.insufficientText}>Insufficient</Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.paymentMethodDescription,
              (parseFloat(walletBalance) < amount || isProcessing) && styles.disabledText
            ]}>
              Available: ₹{walletBalance}
            </Text>
          </View>
          {selectedPaymentMethod === 'wallet' && !parseFloat(walletBalance) < amount && (
            <View style={styles.checkIcon}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          )}
        </TouchableOpacity>



        {/* UPI Payment Method */}
        <TouchableOpacity 
          style={[
            styles.paymentMethodCard,
            selectedPaymentMethod === 'upi' && styles.selectedPaymentMethod,
            isProcessing && styles.disabledPaymentMethod
          ]}
          onPress={() => {
            if (!isProcessing) {
              setSelectedPaymentMethod('upi');
            }
          }}
          disabled={isProcessing}
        >
          <View style={styles.paymentMethodIcon}>
            <Image source={paymentIcons.upi} style={styles.paymentIcon} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodHeader}>
              <Text style={styles.paymentMethodName}>UPI</Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            </View>
            <Text style={styles.paymentMethodDescription}>Pay using UPI ID or QR code</Text>
          </View>
          {selectedPaymentMethod === 'upi' && (
            <View style={styles.checkIcon}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* PayU Payment Method - Hidden as requested */}
        {false && (
          <TouchableOpacity 
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'payu' && styles.selectedPaymentMethod,
              isProcessing && styles.disabledPaymentMethod
            ]}
            onPress={() => {
              if (!isProcessing) {
                setSelectedPaymentMethod('payu');
              }
            }}
            disabled={isProcessing}
          >
            <View style={styles.paymentMethodIcon}>
              <Image source={paymentIcons.payu} style={styles.paymentIcon} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <View style={styles.paymentMethodHeader}>
                <Text style={styles.paymentMethodName}>PayU Gateway</Text>
                <View style={styles.secureBadge}>
                  <Text style={styles.secureText}>Secure</Text>
                </View>
              </View>
              <Text style={styles.paymentMethodDescription}>Pay using Credit/Debit Card, Net Banking, UPI</Text>
            </View>
            {selectedPaymentMethod === 'payu' && (
              <View style={styles.checkIcon}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Fixed Pay Button at Bottom */}
      <View style={styles.bottomPaySection}>
        <TouchableOpacity 
          style={[
            styles.payNowButton,
            isProcessing
          ]}
          onPress={() => {
            if (selectedPaymentMethod && !isProcessing) {
              handlePayment(selectedPaymentMethod);
            }
          }}
          disabled={isProcessing}
        >
          <Text style={styles.payNowButtonText}>
            {isProcessing ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Processing Modal */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.popupBox}>
            <Image
              source={companyLogo ? { uri: companyLogo } : require('../../../assets/icons/default.png')}
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
              source={require('../../../assets/icons/failure.png')}
              style={styles.popupImage}
              resizeMode="contain"
            />
            <Text style={[styles.popupText, { color: 'red' }]}>Transaction {status}</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            
            
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
  paymentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectedPaymentMethod: {
    borderColor: '#000000',
    backgroundColor: '#e8f4f8',
  },
  disabledPaymentMethod: {
    opacity: 0.5,
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 1,
  },
  paymentIcon: {
    width: 30,
    height: 30,
    tintColor: '#000',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  secureBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  secureText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  insufficientBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  insufficientText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  walletInfoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  walletInfoHeader: {
    marginBottom: 8,
  },
  walletInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  walletInfoDescription: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPaySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  payNowButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payNowButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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