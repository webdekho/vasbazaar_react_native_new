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
import { Avatar, Button, Card, List } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';
import MainHeader from '../../../components/MainHeader';
import { useOrientation } from '../../../hooks/useOrientation';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isLandscape, isIPhone16Pro, hasNotch } = useOrientation();

  // Calculate dynamic tab bar height
  const getTabBarHeight = () => {
    let baseHeight = isLandscape ? 50 : 60;
    
    if (Platform.OS === 'web') {
      baseHeight = isLandscape ? 60 : 70;
    }
    
    if (isIPhone16Pro) {
      baseHeight = isLandscape ? 55 : 65;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 70 : 80;
      }
    } else if (hasNotch) {
      baseHeight = isLandscape ? 52 : 62;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 65 : 75;
      }
    }
    
    const bottomSafeArea = insets.bottom;
    return baseHeight + bottomSafeArea;
  };
  
  // State variables
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [errorMessage, setErrorMessage] = useState("Something went wrong");
  const [errorDetails, setErrorDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');
  const [userEmail, setUserEmail] = useState('customer@vasbazaar.com');
  const [userName, setUserName] = useState('Customer');
  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [stepCount, setStepCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedPaymentMethod, setClickedPaymentMethod] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(true);
  
  // Function to navigate to home - can be called from WebView JavaScript
  const goToHome = () => {
    console.log('goToHome called - navigating to home screen');
    setShowWebView(false);
    router.replace('/(tabs)/home');
  };
  
  // Extract parameters
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

  // Parse plan data
  const planData = typeof plan === 'string' ? JSON.parse(plan || '{}') : (plan || {});
  const amount = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));
  
  const paymentIcons = {
    upi: require('../../../assets/icons/upi.png'),
    wallet: require('../../../assets/icons/wallet.png'),
  };

  const handlePayment = async (paymentType) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setClickedPaymentMethod(paymentType);
    setShowPopup(true);
    
    try {
      const result = await recharge(paymentType);
      console.log('Payment result:', JSON.stringify(result, null, 2));
      
      const apiSuccess = result?.Status?.toLowerCase() === 'success' || 
                        result?.status?.toLowerCase() === 'success';
      
      if (apiSuccess && result?.data) {
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
            showPaymentError('Transaction in progress. It may take a few minutes to complete.', 'Pending');
          } else {
            console.log('Wallet payment failed:', result.data.message);
            showPaymentError(result.data.message || 'Wallet payment failed');
          }
        } else if (paymentType === 'upi') {
          if (innerStatus === 'pending') {
            console.log('UPI payment pending');
            redirectToPending(paymentType, result);
          } else if (innerStatus === 'success') {
            console.log('UPI payment successful');
            redirectToSuccess(paymentType, result);
          } else {
            console.log('UPI payment failed:', result.data.message);
            showPaymentError(result.data.message || 'UPI payment failed');
          }
        }
      } else {
        const errorMessage = result?.message || 'API call failed';
        console.log('API call failed:', errorMessage);
        showPaymentError(errorMessage);
      }
    } catch (error) {
      console.error('Payment exception:', error);
      showPaymentError('Payment processing failed: ' + error.message);
    } finally {
      setShowPopup(false);
    }
  };

  const showPaymentError = (message,status='Failed') => {
    setShowFailurePopup(true);
    setIsProcessing(false);
    setStatus(status);
    setErrorMessage(message);
  };

  const fetchPaymentUrl = async (upiToken) => {
    if (!upiToken) return;

    const sessionToken = await getSessionToken();
    if (!sessionToken) return;

    try {
      const response = await postRequest(`pay?upiToken=${upiToken}`, {}, sessionToken);

      if (response.status === 'success' && response.data) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.sessionStorage.setItem('lastPaymentUrl', response.data);
        }
        openPaymentWindow(response.data);
      } else {
        throw new Error(response.message || 'Failed to generate payment link');
      }
    } catch (error) {
      showPaymentError('Failed to generate payment link. Please try again.');
    }
  };

  const redirectToSuccess = async (paymentType, data) => {
    await saveServiceId();

    if (paymentType === 'upi' && data?.data?.upiToken) {
      fetchPaymentUrl(data.data.upiToken);
    } else {
      console.log('Navigating to SuccessScreen');
      
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
          couponName,
          couponDesc,
        }
      });
    }
  };

  const redirectToPending = async (paymentType, data) => {
    await saveServiceId();

    console.log('Navigating to PendingScreen');

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

  const saveServiceId = async () => {
    if (serviceId) {
      try {
        await AsyncStorage.setItem('lastUsedServiceId', serviceId.toString());
        console.log('Saved lastUsedServiceId to AsyncStorage');
      } catch (error) {
        console.error('Error saving lastUsedServiceId to AsyncStorage:', error);
      }
    }
  };

  const openPaymentWindow = async(paymentUrl) => {
    console.log('openPaymentWindow called with Platform.OS:', Platform.OS);
    console.log('Payment URL:', paymentUrl);
    
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      console.log('Using WebView for mobile platform');
      setWebViewLoading(true);
      setPaymentUrl(paymentUrl);
      setShowWebView(true);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const userConfirmed = window.confirm(
          'You will be redirected to the payment gateway.\n\n' +
          'Note: If you see a security warning from your browser, it\'s because the payment gateway uses test/staging URLs. ' +
          'You can safely proceed by clicking "Advanced" and then "Proceed to site" if you trust this payment.\n\n' +
          'Click OK to continue to payment.'
        );
        
        if (!userConfirmed) return;
        
        const paymentWindow = window.open(
          paymentUrl, 
          'payment',
          'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        if (paymentWindow) {
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              
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

          paymentWindow.focus();
        } else {
          alert(
            'Payment window was blocked by your browser.\n\n' +
            'Please allow popups for this site and try again.\n' +
            'Alternatively, you can copy this URL and open it manually:\n\n' + 
            paymentUrl
          );
        }
      } catch (error) {
        alert('Failed to open payment window: ' + error.message);
      }
    } else {
      console.log('Unknown platform, showing alert');
      alert('Payment functionality is available on Android, iOS and Web platforms.');
    }
  };

  const getBalance = async () => {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) return;

      const response = await getRequest('api/customer/user/getByUserId', {}, sessionToken);
      if (response?.status === 'success') {
        const { balance, email, name, firstName, fullName } = response.data;
        setWalletBalance(balance.toFixed(2));
        
        if (email && email.includes('@')) {
          setUserEmail(email);
        }
        
        if (firstName) {
          setUserName(firstName);
        } else if (name) {
          setUserName(name);
        } else if (fullName) {
          setUserName(fullName.split(' ')[0]);
        }
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  const recharge = async (paymentType) => {
    try {
      const amount = parseFloat((planData?.price || '0').replace(/[₹,\s]/g, ''));
      const validityString = planData?.validity || '';
      const validity = parseInt(validityString.replace(/[^\d]/g, ''), 10) || null;

      // Parse bill_details safely
      let parsedBillDetails = {};
      try {
        if (typeof bill_details === 'string') {
          parsedBillDetails = JSON.parse(bill_details);
        } else if (bill_details && typeof bill_details === 'object') {
          parsedBillDetails = bill_details;
        }
      } catch (e) {
        console.error('Error parsing bill_details:', e);
        parsedBillDetails = {};
      }

      // Extract and parse the data array
      let parsedData = [];
      if (parsedBillDetails?.data && Array.isArray(parsedBillDetails.data)) {
        parsedData = parsedBillDetails.data.map(item => {
          try {
            return typeof item === "string" ? JSON.parse(item) : item;
          } catch (e) {
            return item;
          }
        });
      } else if (parsedBillDetails && Object.keys(parsedBillDetails).length > 0) {
        parsedData = [parsedBillDetails];
      }

      // Determine success status
      let isSuccess = true;

      if (parsedBillDetails?.statusMessage) {
        const directStatusMsg = parsedBillDetails.statusMessage.toLowerCase();
        if (directStatusMsg.includes("failed") || directStatusMsg.includes("failure") || directStatusMsg.includes("error")) {
          isSuccess = false;
        }
      }

      if (
        parsedData.some(
          d => {
            const statusMsg = d?.statusMessage?.toLowerCase() || '';
            return statusMsg.includes("failed") || statusMsg.includes("failure") || statusMsg.includes("error");
          }
        )
      ) {
        isSuccess = false;
      }

      if (parsedData.length === 0 && isSuccess) {
        isSuccess = false;
      }

      const payload = {
        amount: amount,
        operatorId: parseInt(operator_id),
        circleId: circleCode ? String(circleCode) : null,
        validity: validity,
        couponId1: parseInt(coupon) || null,
        couponId2: selectedCoupon2 || null,
        payType: paymentType || "wallet",
        mobile: mobile,
        couponDisc: couponDesc,
        platform: Platform.OS,
        viewBillResponse: {
          data: parsedData,
          success: isSuccess.toString()
        }
      };

      console.log('Recharge payload:', payload);

      // Save recharge payload for status checks
      const rechargePayloadForStatusCheck = {
        field1: mobile,
        viewBillResponse: payload.viewBillResponse,
        validity: validity,
        operatorId: payload.operatorId,
        circleId: payload.circleId,
        amount: payload.amount,
        paymentType: paymentType,
        timestamp: new Date().toISOString(),
        originalParams: params
      };
      
      try {
        await AsyncStorage.setItem('pendingRechargePayload', JSON.stringify(rechargePayloadForStatusCheck));
        console.log('Saved recharge payload for status check');
      } catch (storageError) {
        console.error('Error saving recharge payload to AsyncStorage:', storageError);
      }
      
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const response = await postRequest(
        'api/customer/plan_recharge/recharge',
        payload,
        sessionToken
      );
      
      console.log('Recharge API complete response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      showPaymentError('An error occurred during payment');
      throw error;
    }
  };

  useEffect(() => {
    getBalance();

    // Add iPhone Safari specific CSS for button visibility
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        /* iPhone Safari specific styles for bottom button */
        @supports (-webkit-touch-callout: none) {
          @media screen and (max-width: 768px) {
            /* Ensure bottom button is above mobile browser UI */
            [data-bottom-pay] {
              padding-bottom: calc(env(safe-area-inset-bottom) + 15px) !important;
              min-height: 60px !important;
            }
          }
        }
        
        /* Additional iPhone viewport fixes */
        @media screen and (max-device-width: 480px) {
          [data-bottom-pay] {
            padding-bottom: 20px !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // Handle status bar changes for WebView modal
  useEffect(() => {
    if (Platform.OS === 'ios') {
      if (showWebView) {
        StatusBar.setBarStyle('dark-content', true);
      } else {
        StatusBar.setBarStyle('dark-content', true);
      }
    }
  }, [showWebView]);

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
        contentContainerStyle={[
          {
            paddingBottom: 20   // Standard padding since no fixed bottom button
          }
        ]}
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
        
        {/* Debug/Test Button - Only show in development */}
        {/* {__DEV__ && (
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => router.push('/main/PayUUpiTestScreen')}
          >
            <Text style={styles.debugButtonText}>🧪 PayU UPI SDK Test</Text>
          </TouchableOpacity>
        )} */}
        
        {/* Wallet Payment Method */}
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
          <TouchableOpacity 
            style={[
              styles.payButton,
              (parseFloat(walletBalance) < amount || isProcessing) && styles.payButtonDisabled
            ]}
            onPress={() => {
              if (!(parseFloat(walletBalance) < amount || isProcessing)) {
                handlePayment('wallet');
              }
            }}
            disabled={parseFloat(walletBalance) < amount || isProcessing}
          >
            <Text style={[
              styles.payButtonText,
              (parseFloat(walletBalance) < amount || isProcessing) && styles.payButtonTextDisabled
            ]}>
              {isProcessing && clickedPaymentMethod === 'wallet' ? 'Processing...' : 'Pay'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* UPI Payment Method */}
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
            : status === 'Pending'
            ? require('../../../assets/icons/pending.png')
            : require('../../../assets/icons/success.png')
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
          setErrorDetails(null);
        }}
        style={styles.closeButton}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* WebView Modal for Mobile UPI Payment */}
      <Modal visible={showWebView} animationType="slide" presentationStyle="fullScreen">
        <StatusBar barStyle="dark-content" backgroundColor="#000000" />
        <View style={styles.webviewContainer}>
          <View style={[styles.webviewHeader, { paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 40 }]}>
            <TouchableOpacity onPress={() => {
              setShowWebView(false);
              router.replace('/(tabs)/home');
            }} style={styles.webviewCloseButton}>
              <Text style={styles.webviewCloseButtonText}>🏠 Go to Home</Text>
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>UPI Payment</Text>
            <View style={styles.webviewSpacer} />
          </View>
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            originWhitelist={['https://*', 'http://*', 'file://*', 'data:*', 'about:*']}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            allowFileAccess={true}
            userAgent={Platform.select({
              ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              android: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
              default: 'Mozilla/5.0 (Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
            })}
            setSupportMultipleWindows={true}
            allowsProtectedMedia={true}
            onMessage={(event) => {
              console.log('WebView Message:', event.nativeEvent.data);
              
              try {
                const message = JSON.parse(event.nativeEvent.data);
                
                // Handle go to home request from WebView JavaScript
                if (message.type === 'goto-home') {
                  console.log('Received goto-home message from WebView');
                  goToHome();
                  return;
                }
                
                // Handle UPI link messages
                if (message.type === 'upi-link' && message.url) {
                  console.log('Intercepted UPI link via message:', message.url);
                  
                  Linking.canOpenURL(message.url)
                    .then((supported) => {
                      if (supported) {
                        console.log('Opening UPI app via message...');
                        Linking.openURL(message.url);
                      } else {
                        console.log('No UPI app found via message:', message.url);
                        Alert.alert(
                          'UPI App Required',
                          'Please install a UPI app like PhonePe, Google Pay, or Paytm to complete the payment.',
                          [{ text: 'OK' }]
                        );
                      }
                    })
                    .catch((err) => {
                      console.error('Error opening UPI app via message:', err);
                    });
                }
              } catch (error) {
                // Not a JSON message, check for simple string commands
                const messageStr = event.nativeEvent.data;
                if (messageStr === 'goto-home' || messageStr === 'goToHome') {
                  console.log('Received string goto-home message from WebView');
                  goToHome();
                }
              }
            }}
            injectedJavaScript={`
              (function() {
                console.log('Injected JavaScript running');
                
                // Override window.open to catch UPI links
                const originalOpen = window.open;
                window.open = function(url, target, features) {
                  console.log('window.open called with:', url);
                  if (url && (url.startsWith('upi://') || url.startsWith('phonepe://') || 
                             url.startsWith('paytm://') || url.startsWith('gpay://') || 
                             url.startsWith('bhim://'))) {
                    console.log('Detected UPI link in window.open:', url);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'upi-link',
                      url: url
                    }));
                    return null;
                  }
                  return originalOpen.call(this, url, target, features);
                };
                
                // Override location.href assignments
                let originalLocation = window.location.href;
                Object.defineProperty(window.location, 'href', {
                  get: function() { return originalLocation; },
                  set: function(url) {
                    console.log('location.href set to:', url);
                    if (url && (url.startsWith('upi://') || url.startsWith('phonepe://') || 
                               url.startsWith('paytm://') || url.startsWith('gpay://') || 
                               url.startsWith('bhim://'))) {
                      console.log('Detected UPI link in location.href:', url);
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'upi-link',
                        url: url
                      }));
                      return;
                    }
                    originalLocation = url;
                  }
                });
                
                // Monitor for all attempts to navigate to UPI links
                const originalNavigate = window.location.assign;
                window.location.assign = function(url) {
                  console.log('location.assign called with:', url);
                  if (url && (url.includes('phonepe://') || url.includes('upi://') || 
                             url.includes('paytm://') || url.includes('gpay://') || 
                             url.includes('bhim://'))) {
                    console.log('Detected UPI link in location.assign:', url);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'upi-link',
                      url: url
                    }));
                    return;
                  }
                  originalNavigate.call(this, url);
                };
                
                // Monitor for links being clicked
                document.addEventListener('click', function(e) {
                  const target = e.target.closest('a');
                  if (target && target.href) {
                    console.log('Link clicked:', target.href);
                    if (target.href.includes('phonepe://') || target.href.includes('upi://') || 
                        target.href.includes('paytm://') || target.href.includes('gpay://') || 
                        target.href.includes('bhim://')) {
                      console.log('Detected UPI link in click:', target.href);
                      e.preventDefault();
                      e.stopPropagation();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'upi-link',
                        url: target.href
                      }));
                    }
                  }
                });
                
                // Monitor for any navigation attempts
                const originalReplace = window.location.replace;
                window.location.replace = function(url) {
                  console.log('location.replace called with:', url);
                  if (url && (url.includes('phonepe://') || url.includes('upi://') || 
                             url.includes('paytm://') || url.includes('gpay://') || 
                             url.includes('bhim://'))) {
                    console.log('Detected UPI link in location.replace:', url);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'upi-link',
                      url: url
                    }));
                    return;
                  }
                  originalReplace.call(this, url);
                };
                
                // Override document.write to catch any UPI links
                const originalWrite = document.write;
                document.write = function(html) {
                  if (html && (html.includes('phonepe://') || html.includes('upi://'))) {
                    console.log('Detected UPI link in document.write:', html);
                    const matches = html.match(/(phonepe:\/\/[^"'\s<>]+|upi:\/\/[^"'\s<>]+)/g);
                    if (matches) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'upi-link',
                        url: matches[0]
                      }));
                    }
                  }
                  originalWrite.call(this, html);
                };
                
                // Expose goToHome function to WebView JavaScript
                window.goToHome = function() {
                  console.log('WebView JavaScript called goToHome()');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'goto-home'
                  }));
                };
                
                // Also expose as simple string message (alternative method)
                window.navigateToHome = function() {
                  console.log('WebView JavaScript called navigateToHome()');
                  window.ReactNativeWebView.postMessage('goto-home');
                };
                
                // Monitor form submissions
                const originalSubmit = HTMLFormElement.prototype.submit;
                HTMLFormElement.prototype.submit = function() {
                  console.log('Form is being submitted to:', this.action);
                  if (this.action && (this.action.includes('phonepe://') || this.action.includes('upi://'))) {
                    console.log('Detected UPI link in form action:', this.action);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'upi-link',
                      url: this.action
                    }));
                    return;
                  }
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'form-submit',
                    action: this.action,
                    method: this.method
                  }));
                  originalSubmit.call(this);
                };
                
                console.log('PaymentScreen WebView JavaScript bridge initialized. Available functions:');
                console.log('- window.goToHome() - Navigate to home screen');
                console.log('- window.navigateToHome() - Alternative method to navigate to home');
                console.log('Usage example: window.goToHome();');
              })();
            `}
            onShouldStartLoadWithRequest={(request) => {
              console.log('WebView attempting to load:', request.url);
              
              // Handle Android intent URLs specifically
              if (request.url.startsWith('intent://')) {
                console.log('Detected Android intent URL:', request.url);
                
                // Parse intent URL to extract actual UPI URL
                try {
                  // Intent format: intent://upi/pay?pa=...&pn=...#Intent;scheme=upi;package=com.phonepe.app;end
                  const intentMatch = request.url.match(/intent:\/\/(.+?)#Intent;scheme=([^;]+);package=([^;]+);/);
                  if (intentMatch) {
                    const [, path, scheme, packageName] = intentMatch;
                    const upiUrl = `${scheme}://${path}`;
                    console.log('Parsed UPI URL from intent:', upiUrl);
                    console.log('Target package:', packageName);
                    
                    // Try to open the UPI URL
                    Linking.openURL(upiUrl).catch((err) => {
                      console.error('Failed to open UPI URL from intent:', err);
                      // Try alternative UPI apps
                      const alternativeApps = [
                        'phonepe://upi/pay?' + path.split('?')[1],
                        'gpay://upi/pay?' + path.split('?')[1],
                        'paytm://upi/pay?' + path.split('?')[1],
                        'upi://pay?' + path.split('?')[1]
                      ];
                      
                      alternativeApps.forEach(app => {
                        Linking.openURL(app).catch(() => {});
                      });
                    });
                  } else {
                    // Fallback for malformed intent URLs
                    console.log('Could not parse intent URL, trying generic UPI apps');
                    const fallbackApps = ['phonepe://', 'gpay://', 'paytm://', 'upi://'];
                    fallbackApps.forEach(app => {
                      Linking.openURL(app).catch(() => {});
                    });
                  }
                } catch (error) {
                  console.error('Error parsing intent URL:', error);
                }
                
                return false; // Don't load intent URLs in WebView
              }
              
              // Handle direct UPI schemes
              if (request.url.startsWith('upi:') || 
                  request.url.startsWith('phonepe:') || 
                  request.url.startsWith('paytm:') || 
                  request.url.startsWith('gpay:') || 
                  request.url.startsWith('googlepay:') ||
                  request.url.startsWith('bhim:') ||
                  request.url.startsWith('whatsapp:') ||
                  request.url.startsWith('tez:')) {
                
                console.log('BLOCKED direct UPI scheme, opening externally:', request.url);
                
                // Open UPI app immediately
                Linking.openURL(request.url).catch((err) => {
                  console.error('Failed to open UPI app:', err);
                  // Try generic UPI apps as fallback
                  const fallbackApps = ['phonepe://', 'gpay://', 'paytm://'];
                  fallbackApps.forEach(app => {
                    Linking.openURL(app).catch(() => {});
                  });
                });
                
                return false; // Never load UPI schemes in WebView
              }
              
              // Allow web URLs and other safe schemes
              return request.url.startsWith('https:') || request.url.startsWith('http:') || request.url.startsWith('data:') || request.url.startsWith('about:') || request.url.startsWith('file:');
            }}
            onNavigationStateChange={(navState) => {
              console.log('WebView navigation:', navState.url);
              
              // Handle UPI deep links in navigation state change as well
              const isUpiLink = navState.url && (
                navState.url.includes('phonepe://') || 
                navState.url.includes('upi://') || 
                navState.url.includes('paytm://') || 
                navState.url.includes('gpay://') || 
                navState.url.includes('googlepay://') ||
                navState.url.includes('bhim://') ||
                navState.url.includes('whatsapp://') ||
                navState.url.includes('tez://') ||
                navState.url.includes('intent://')
              );
              
              if (isUpiLink) {
                console.log('Navigation intercepted UPI deep link:', navState.url);
                
                // Try to open the UPI app
                Linking.openURL(navState.url)
                  .then(() => {
                    console.log('Successfully opened UPI app via navigation');
                  })
                  .catch((err) => {
                    console.error('Error opening UPI app via navigation:', err);
                    
                    // Try alternative UPI apps
                    const alternativeApps = ['phonepe://upi/pay', 'gpay://upi/pay', 'paytm://upi/pay'];
                    let appOpened = false;
                    
                    alternativeApps.forEach((appUrl) => {
                      if (!appOpened) {
                        Linking.openURL(appUrl)
                          .then(() => {
                            appOpened = true;
                            console.log('Opened alternative UPI app:', appUrl);
                          })
                          .catch(() => {});
                      }
                    });
                  });
                
                return; // Don't process further
              }
              
              // Check for generic success/failure patterns
              if (navState.url.includes('/success') || navState.url.includes('payment-success')) {
                setShowWebView(false);
                setWebViewLoading(false);
                // Go directly to home instead of success screen
                router.replace('/(tabs)/home');
              } else if (navState.url.includes('/fail') || navState.url.includes('/cancel') || 
                         navState.url.includes('payment-failed') || navState.url.includes('payment-cancelled')) {
                setShowWebView(false);
                setWebViewLoading(false);
                // Go directly to home instead of failure screen
                router.replace('/(tabs)/home');
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setShowWebView(false);
              setWebViewLoading(false);
              // Go directly to home instead of showing error popup
              router.replace('/(tabs)/home');
            }}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.webviewLoadingText}>Loading payment gateway...</Text>
              </View>
            )}
          />
          {/* Loading overlay for WebView */}
          {webViewLoading && (
            <View style={styles.webviewLoadingOverlay}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.webviewLoadingOverlayText}>Loading UPI Payment...</Text>
            </View>
          )}
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