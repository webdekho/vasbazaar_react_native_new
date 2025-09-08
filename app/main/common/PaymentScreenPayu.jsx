import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar, Card, List } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';
import MainHeader from '../../../components/MainHeader';
import { useOrientation } from '../../../hooks/useOrientation';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLandscape, isIPhone16Pro, hasNotch } = useOrientation();

  const [walletBalance, setWalletBalance] = useState('0');
  const [userEmail, setUserEmail] = useState('customer@vasbazaar.com');
  const [userName, setUserName] = useState('Customer');
  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [stepCount, setStepCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedPaymentMethod, setClickedPaymentMethod] = useState(null);
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [errorMessage, setErrorMessage] = useState("Something went wrong");
//   const [paymentMethod, setPaymentMethod] = useState(false);

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
    selectedCoupon2 = null,
    bill_details = null,
    couponDesc = null,
    couponName = null,
    field1 = null,
    field2 = null,
  } = params || {};

  const planData = typeof plan === 'string' ? JSON.parse(plan || '{}') : (plan || {});
  const amount = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));

  const paymentIcons = {
    wallet: require('../../../assets/icons/wallet.png'),
    upi: require('../../../assets/icons/upi.png'),
  };

  const handlePayment = async (paymentType) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setClickedPaymentMethod(paymentType);
    setShowPopup(true);

    try {
      const result = await recharge(paymentType);

      const apiSuccess = result?.Status?.toLowerCase() === 'success' ||
                        result?.status?.toLowerCase() === 'success';

       if (!apiSuccess) {
            showPaymentError(result?.message || 'Payment failed');
            return;
        }

        const innerStatus = result.data.status?.toLowerCase();
        
        console.log('Payment Analysis:');
        console.log('- Payment Type:', paymentType);
        console.log('- Outer Status:', result?.Status || result?.status);
        console.log('- Inner Status:', innerStatus);

       
       if (paymentType === 'wallet') {
          if (innerStatus === 'success') {
            console.log('Wallet payment successful');
            redirectToSuccess(paymentType, result);
          } else if (innerStatus === 'pending') {
            console.log('Wallet payment pending');
            showPaymentError('Your Transaction is pending please check the status in history', 'Pending');
          } else {
            console.log('Wallet payment failed:', result.data.message);
            showPaymentError(result.data.message || 'Payment failed');
          }
        } else if (paymentType === 'upi') {
            if (innerStatus === 'pending') {
                
                await startPayUCheckout(result.data,paymentType);
            } else {
                console.log('UPI payment failed:', result.data.message);
                showPaymentError(result.data.message || 'UPI Payment failed');
            }
        } else {
            showPaymentError('Unknown payment method');
        }
    

    } catch (error) {
      showPaymentError(error.message || 'Payment processing failed');
    } finally {
      setShowPopup(false);
    }
  };

  const showPaymentError = (message, status = 'Failed') => {
    setShowFailurePopup(true);
    setIsProcessing(false);
    setStatus(status);
    setErrorMessage(message);
  };

  const redirectToSuccess = async (paymentType, data) => {
    if (serviceId) {
      await AsyncStorage.setItem('lastUsedServiceId', serviceId.toString());
    }

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
        paymentType,
        selectedCoupon2,
        response: JSON.stringify(data),
        couponName,
        couponDesc,
      }
    });
  };

  const getBalance = async () => {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) return;

      const response = await getRequest('api/customer/user/getByUserId', {}, sessionToken);
      if (response?.status === 'success') {
        const { balance, email, name, firstName, fullName } = response.data;
        setWalletBalance(balance.toFixed(2));
        setUserEmail(email || 'customer@vasbazaar.com');
        setUserName(firstName || name || fullName?.split(' ')[0] || 'Customer');
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  const recharge = async (paymentType) => {
    try {
      const amountValue = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));
      const validityString = planData?.validity || '';
      const validity = parseInt(validityString.replace(/[^\d]/g, ''), 10) || null;

      let parsedBillDetails = {};
      try {
        parsedBillDetails = typeof bill_details === 'string' ? JSON.parse(bill_details) : (bill_details || {});
      } catch {
        parsedBillDetails = {};
      }

      const payload = {
        amount: amountValue,
        operatorId: parseInt(operator_id),
        circleId: circleCode ? String(circleCode) : null,
        validity: validity ? validity : 30,
        couponId1: parseInt(coupon) || null,
        couponId2: selectedCoupon2 || null,
        payType: paymentType,
        mobile: mobile,
        name: name,
        couponDisc: couponDesc,
        platform: Platform.OS,
        field1,
        field2,
        viewBillResponse: parsedBillDetails
      };

      const sessionToken = await getSessionToken();
      if (!sessionToken) throw new Error('No session token available');

      const response = await postRequest('api/customer/plan_recharge/recharge', payload, sessionToken);
      return response;
    } catch (error) {
      showPaymentError('An error occurred during payment');
      throw error;
    }
  };


  const status_check = async (txnid,paymentType) => {
    try {
    setIsProcessing(true);
    setClickedPaymentMethod(paymentType);
    setShowPopup(true);

      const validityString = planData?.validity || '';
      const validity = parseInt(validityString.replace(/[^\d]/g, ''), 10) || null;

      let parsedBillDetails = {};
      try {
        parsedBillDetails = typeof bill_details === 'string' ? JSON.parse(bill_details) : (bill_details || {});
      } catch {
        parsedBillDetails = {};
      }

      const payload = {
        txnId: txnid,
        field1,
        field2,
        validity: validity ? validity : 30,
        recharge: true,
        viewBillResponse: parsedBillDetails
      };

      const sessionToken = await getSessionToken();
      if (!sessionToken) throw new Error('No session token available');
        const response = await postRequest('api/customer/plan_recharge/check-status', payload, sessionToken);
        const innerStatus = response.data.status?.toLowerCase();
        console.log('Payment Analysis:');
        console.log('- Outer Status:', response?.Status || response?.status);
        console.log('- Inner Status:', innerStatus);
        
        if (innerStatus === 'success') {
            console.log('Wallet payment successful');
            redirectToSuccess(paymentType, response);
          } else if (innerStatus === 'pending') {
            console.log('Wallet payment pending');
            showPaymentError('Your Transaction is pending please check the status in history', 'Pending');
          } else {
            console.log('Wallet payment failed:', response.data.message);
            showPaymentError(response.data.message,'Failed');
          }

        // return response;
    } catch (error) {
      showPaymentError('An error occurred during payment','Failed');
      throw error;
    }finally {
      setShowPopup(false);
    }
  };

  useEffect(() => {
    getBalance();

    if (Platform.OS === 'web' && !window.bolt) {
          const script = document.createElement('script');
          script.src = 'https://jssdk.payu.in/bolt/bolt.min.js'; // ✅ Sandbox SDK
          script.async = true;
          script.onload = () => console.log('✅ PayU Bolt SDK loaded');
          script.onerror = () => console.error('❌ Failed to load PayU Bolt SDK');
          document.body.appendChild(script);
    }
  }, []);


 // PayU Payment Initiate

   const waitForBolt = () => new Promise((resolve) => {
     const interval = setInterval(() => {
       if (window.bolt) {
         clearInterval(interval);
         resolve(true);
       }
     }, 50);
     setTimeout(() => resolve(false), 5000);
   });
 
   const startPayUCheckout = async (responseData,paymentType="payu") => {
  const boltReady = await waitForBolt();

  if (!boltReady) {
    showPaymentError('PayU SDK not loaded', 'Failed');
    return;
  }

  const paymentOptions = {
    key: responseData.key,
    txnid: responseData.requestId,
    amount: responseData.amount,
    productinfo: responseData.productinfo,
    firstname: responseData.firstname,
    email: responseData.email,
    phone: responseData.phone,
    hash: responseData.hash,
    surl: window.location.origin,
    furl: window.location.origin,
  };

  console.log("🚀 Launching PayU Bolt with:", paymentOptions);

  window.bolt.launch(paymentOptions, {
    responseHandler: async (BOLT) => {
      console.log("📨 Payment Response:", BOLT);
      if (BOLT.response.txnStatus === "SUCCESS") {

        await status_check(BOLT.response.txnid,paymentType);
        // getBalance();
        // showPaymentError(`Transaction ID: ${BOLT.response.txnid}`, 'Success');
      } else {
        showPaymentError(BOLT.response.txnMessage || "Something went wrong", 'Failed');
        return null;
      }
    },
    catchException: async (BOLT) => {
      console.error("❌ PayU Exception:", BOLT);

      // Handle 429 status specifically
      if (BOLT && (BOLT.status === 429 || BOLT.responseCode === 429)) {
        showPaymentError("Too many requests. Please try again later.", 'Failed');
        return null;
      } else {
        showPaymentError(BOLT.message || "Unexpected error during payment", 'Failed');
        return null;
      }
    },
  });
};
 


  return (
    <>
      <MainHeader title="Payment" onBackPress={() => router.replace('/(tabs)/home')} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Info */}
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

        {/* Wallet Payment */}
        <Text style={styles.paymentSectionTitle}>Select Payment Method</Text>
        <View 
          style={[
            styles.paymentMethodCard,
            (parseFloat(walletBalance) < amount || isProcessing) && styles.disabledPaymentMethod
          ]}
        >
          <View style={styles.paymentMethodIcon}>
            <Image source={paymentIcons.wallet} style={styles.paymentIcon} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>Wallet Balance</Text>
            <Text style={styles.paymentMethodDescription}>Available: ₹{walletBalance}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.payButton,
              (parseFloat(walletBalance) < amount || isProcessing) && styles.payButtonDisabled
            ]}
            onPress={() => {
              if (!(parseFloat(walletBalance) < amount || isProcessing)) handlePayment('wallet');
            }}
            disabled={parseFloat(walletBalance) < amount || isProcessing}
          >
            <Text style={styles.payButtonText}>
              {isProcessing && clickedPaymentMethod === 'wallet' ? 'Processing...' : 'Pay'}
            </Text>
          </TouchableOpacity>
        </View>

             {/* UPI Payment Method */}
        
         {Platform.OS === "web" ? (
        
        <View 
                  style={[
                    styles.paymentMethodCard,
                    isProcessing && styles.disabledPaymentMethod
                  ]}
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
                  <TouchableOpacity 
                    style={[
                      styles.payButton,
                      isProcessing && styles.payButtonDisabled
                    ]}
                    onPress={() => {
                      if (!isProcessing) {
                        handlePayment('upi');
                      }
                    }}
                    disabled={isProcessing}
                  >
                    <Text style={[
                      styles.payButtonText,
                      isProcessing && styles.payButtonTextDisabled
                    ]}>
                      {isProcessing && clickedPaymentMethod === 'upi' ? 'Processing...' : 'Pay'}
                    </Text>
                  </TouchableOpacity>
                </View>
         ) : null} 

      </ScrollView>


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

      {/* Dynamically choose icon and color */}
      <Image
        source={
          status === 'Failed'
            ? require('../../../assets/icons/failure.png')
            : status === 'Success'
            ? require('../../../assets/icons/success.png')
            : require('../../../assets/icons/pending.png')
        }
        style={styles.popupImage}
        resizeMode="contain"
      />

      <Text
        style={[
          styles.popupText,
          {
            color:
              status === 'Failed'
                ? 'red'
                : status === 'Pending'
                ? 'orange'
                : 'green',
          },
        ]}
      >
        Transaction {status}
      </Text>

      <Text style={styles.errorMessage}>{errorMessage}</Text>

      <TouchableOpacity
        onPress={() => {
          setShowFailurePopup(false);
          
          router.replace('/(tabs)/home');
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingBottom: 10,
      },
      default: {
        paddingBottom: 20,
      },
    }),
    // Enhanced shadow for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
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
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  webviewCloseButton: {
    padding: 8,
  },
  webviewCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webviewTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  webviewSpacer: {
    width: 50,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  webviewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  webviewLoadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  payButtonTextDisabled: {
    color: '#999',
  },
  debugButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F57C00',
    borderStyle: 'dashed',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});