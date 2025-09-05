import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform, Modal, View, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { postRequest } from '../../../services/api/baseApi';
import { checkTransactionStatus as checkTransactionStatusAPI } from '../../../services/transaction/transactionService';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

export default function PendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [rotateAnim] = useState(new Animated.Value(0));
  const [countdown, setCountdown] = useState(30);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCalledPayment, setHasCalledPayment] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(false);
  const [savedPayload, setSavedPayload] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(true);
  
  // Function to navigate to home - can be called from WebView JavaScript
  const goToHome = () => {
    console.log('PendingScreen goToHome called - navigating to home screen');
    setShowWebView(false);
    router.replace('/(tabs)/home');
  };

  // Parse API response if available
  let apiResponse = null;
  try {
    if (params.response) {
      apiResponse = JSON.parse(params.response);
    }
  } catch (error) {
    console.warn('Could not parse API response:', error);
  }

  // Parse plan data if available
  let planData = {};
  try {
    if (params.plan) {
      planData = typeof params.plan === 'string' ? JSON.parse(params.plan) : params.plan;
    }
  } catch (error) {
    console.warn('Could not parse plan data:', error);
  }

  // Extract transaction ID from params - supports both txn_id and transactionId
  const txnId = params.requestId || params.transactionId || params.txn_id || apiResponse?.data?.requestId || 'TXN' + Date.now();

  const transactionData = {
    // Service type based on serviceId
    type: params.serviceId === '1' ? 'prepaid' : params.serviceId === '2' ? 'dth' : 'bill',
    amount: parseFloat(planData?.price?.replace(/[₹,\s]/g, '')) || parseFloat(params.finalAmount) || parseFloat(params.amount) || 0,
    phoneNumber: params.mobile || params.phoneNumber || '',
    subscriberId: params.subscriberId || '',
    accountNumber: params.accountNumber || '',
    operator: params.operator || '',
    billerName: params.billerName || '',
    customerName: params.name || params.customerName || '',
    contactName: params.name || params.contactName || '',
    paymentMethod: params.paymentType || params.paymentMethod || '',
    transactionId: txnId,
    referenceId: params.referenceId || apiResponse?.data?.referenceId || 'N/A',
    vendorRefId: params.vendorRefId || apiResponse?.data?.vendorRefId || 'N/A',
    commission: apiResponse?.data?.commission || '0',
    timestamp: new Date().toLocaleString(),
    upiToken: params.upiToken || ''
  };

  // Load saved payload from AsyncStorage
  const loadSavedPayload = async () => {
    try {
      const savedPayloadStr = await AsyncStorage.getItem('pendingRechargePayload');
      if (savedPayloadStr) {
        const payload = JSON.parse(savedPayloadStr);
        console.log('Loaded saved recharge payload for status check:', payload);
        setSavedPayload(payload);
        return payload;
      }
    } catch (error) {
      console.error('Error loading saved payload:', error);
    }
    return null;
  };

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
    // Load saved payload first
    loadSavedPayload();

    // Call payment URL on screen load if upiToken exists
    if (transactionData.upiToken && !hasCalledPayment) {
      setHasCalledPayment(true);
      fetchPaymentUrl(transactionData.upiToken);
    }

    // If we have a transaction ID from params (direct URL access), check status immediately
    if (params.txn_id && !transactionData.upiToken && !isInitialCheck) {
      console.log('Direct access with transaction ID:', params.txn_id);
      setIsInitialCheck(true);
      // Check status after a short delay to ensure screen is mounted
      setTimeout(() => {
        // checkTransactionStatus();
      }, 1000);
    }

    // Animate pending icon (continuous rotation)
    const rotateAnimation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => rotateAnimation());
    };

    rotateAnimation();

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // checkTransactionStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [transactionData.upiToken, hasCalledPayment, params.txn_id, isInitialCheck]);

  const checkTransactionStatus = async () => {
    setIsChecking(true);
    
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.replace('/auth/LoginScreen');
        return;
      }

      console.log('==============start===============');
      console.log('STATUS CHECK REQUEST INITIATED');
      console.log('Transaction ID:', transactionData.transactionId);
      console.log('Session Token (first 20 chars):', sessionToken.substring(0, 20) + '...');

      // Get the latest saved payload or use current savedPayload state
      const currentPayload = savedPayload || await loadSavedPayload();
      
      // Prepare additional payload for status check if we have saved data
      let additionalPayload = {};
      if (currentPayload) {
        additionalPayload = {
          field1: currentPayload.field1,
          viewBillResponse: currentPayload.viewBillResponse,
          validity: currentPayload.validity
        };
        console.log('USING SAVED PAYLOAD FOR STATUS CHECK:');
        console.log('Field1:', currentPayload.field1);
        console.log('ViewBillResponse:', JSON.stringify(currentPayload.viewBillResponse, null, 2));
        console.log('Validity:', currentPayload.validity);
      } else {
        console.log('NO SAVED PAYLOAD FOUND - USING BASIC STATUS CHECK');
      }
      
      console.log('FINAL REQUEST PAYLOAD TO API:');
      const finalRequestPayload = {
        txnId: transactionData.transactionId,
        ...additionalPayload
      };
      console.log('API Endpoint: api/customer/plan_recharge/check-status');
      console.log('Request Method: POST');
      console.log('Complete Payload:', JSON.stringify(finalRequestPayload, null, 2));
      console.log('TxnId:', transactionData.transactionId);
      console.log('AdditionalPayload:', JSON.stringify(additionalPayload, null, 2));
      console.log('==============end===============');
      
      const response = await checkTransactionStatusAPI(transactionData.transactionId, sessionToken, additionalPayload);
      
      console.log('==============start===============');
      console.log('STATUS CHECK RESPONSE RECEIVED');
      console.log('Response Status:', response?.status);
      console.log('Full Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === 'success' && response?.data) {
        const { transactionStatus, message, requestId, referenceId, commission } = response.data;
        
        console.log('STATUS CHECK SUCCESS - PARSED DATA:');
        console.log('Transaction Status:', transactionStatus);
        console.log('Message:', message);
        console.log('Request ID:', requestId);
        console.log('Reference ID:', referenceId);
        console.log('Commission:', commission);
        console.log('==============end===============');
        
        if (transactionStatus === 'SUCCESS') {
          // Transaction successful - redirect to success screen
          router.replace({
            pathname: '/main/common/SuccessScreen',
            params: {
              ...params,
              transactionId: requestId || transactionData.transactionId,
              referenceId: referenceId,
              commission: commission,
              status: 'SUCCESS',
              finalAmount: transactionData.amount
            }
          });
        } else if (transactionStatus === 'FAILED') {
          // Transaction failed - redirect to failed screen
          router.replace({
            pathname: '/main/common/FailedScreen',
            params: {
              ...params,
              transactionId: requestId || transactionData.transactionId,
              referenceId: referenceId,
              reason: message || 'Transaction failed during processing',
              status: 'FAILED'
            }
          });
        } else if (transactionStatus === 'PENDING') {
          // Still pending
          setCountdown(60);
          Alert.alert(
            'Still Processing',
            message || 'Your transaction is still being processed. We\'ll continue checking for you.',
            [{ text: 'OK' }]
          );
        } else {
          // Unknown status - treat as pending but with shorter interval
          setCountdown(30);
          Alert.alert(
            'Status Unknown',
            `Transaction status: ${transactionStatus}. ${message || 'We\'ll continue monitoring your transaction.'}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // API error or invalid response
        console.log('==============start===============');
        console.log('STATUS CHECK FAILED - INVALID RESPONSE');
        console.log('Response Status:', response?.status);
        console.log('Response Message:', response?.message);
        console.log('Full Response:', JSON.stringify(response, null, 2));
        console.log('==============end===============');
        
        setCountdown(30);
        Alert.alert(
          'Status Check Failed',
          response?.message || 'Unable to check transaction status. We\'ll try again shortly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('==============start===============');
      console.log('STATUS CHECK ERROR - NETWORK/EXCEPTION');
      console.log('Error Type:', error.name || 'Unknown');
      console.log('Error Message:', error.message || 'Unknown error');
      console.log('Error Stack:', error.stack || 'No stack trace');
      console.log('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.log('==============end===============');
      
      setCountdown(30);
      Alert.alert(
        'Network Error',
        'Unable to check transaction status due to network issues. We\'ll try again shortly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckNow = () => {
    if (!isChecking) {
      // checkTransactionStatus();
    }
  };

  const handleGoHome = () => {
    console.log('Go to Home button pressed');
    
    // Direct navigation for testing
    if (Platform.OS === 'web') {
      // On web, navigate directly without alert
      router.replace('/(tabs)/home');
      return;
    }
    
    try {
      Alert.alert(
        'Transaction Pending',
        'Your transaction is still being processed. You will receive SMS/Email notification once completed.',
        [
          { text: 'Stay Here', style: 'cancel' },
          { 
            text: 'Go Home', 
            onPress: () => {
              console.log('Navigating to home...');
              router.replace('/(tabs)/home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing alert:', error);
      // If Alert fails, navigate directly
      router.replace('/(tabs)/home');
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
      // Make API call to get payment URL
      const response = await postRequest(`pay?upiToken=${upiToken}`, {}, sessionToken);
      console.log("fetch url to redirect",response);
      if (response.status === 'success' && response.data) {
        // Store payment URL for potential manual access
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.sessionStorage.setItem('lastPaymentUrl', response.data);
        }
        
        openPaymentWindow(response.data);
      } else {
        throw new Error(response.message || 'Failed to generate payment link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate payment link. Please try again.');
    }
  };

  const openPaymentWindow = async(paymentUrl) => {
    console.log('PendingScreen openPaymentWindow called with Platform.OS:', Platform.OS);
    console.log('Payment URL:', paymentUrl);
    
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      // For Android and iOS, use WebView
      console.log('Using WebView for mobile platform');
      setPaymentUrl(paymentUrl);
      setShowWebView(true);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Redirect to payment URL in same tab
        window.location.href = paymentUrl;
      } catch (error) {
        Alert.alert('Error', 'Failed to redirect to payment: ' + error.message);
      }
    } else {
      // For unknown platforms, show message
      console.log('Unknown platform, showing alert');
      Alert.alert('Info', 'Payment functionality is available on Android, iOS and Web platforms.');
    }
  };

  const getServiceTitle = () => {
    switch (transactionData.type) {
      case 'prepaid': return 'Mobile Recharge';
      case 'dth': return 'DTH Recharge';
      case 'bill': return 'Bill Payment';
      default: return 'Service';
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit/Debit Card';
      case 'netbanking': return 'Net Banking';
      case 'wallet': return 'Digital Wallet';
      case 'cod': return 'Cash on Delivery';
      default: return method;
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending Animation */}
        <ThemedView style={styles.pendingContainer}>
          <Animated.View style={[styles.pendingIconContainer, { transform: [{ rotate: spin }] }]}>
            <FontAwesome name="clock-o" size={80} color="#FF9800" />
          </Animated.View>
          <ThemedText style={styles.pendingTitle}>Transaction Pending</ThemedText>
          <ThemedText style={styles.pendingSubtitle}>
            {params.txn_id && !params.type 
              ? `Transaction ${params.txn_id} is being processed. Please wait for confirmation.`
              : `Your ${getServiceTitle().toLowerCase()} is being processed. Please wait for confirmation.`
            }
          </ThemedText>
        </ThemedView>


        {/* Transaction Details */}
        <ThemedView style={styles.detailsCard}>
          <ThemedView style={styles.detailsHeader}>
            <ThemedText style={styles.detailsTitle}>Transaction Details</ThemedText>
            <ThemedView style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
              <FontAwesome name="clock-o" size={12} color="white" />
              <ThemedText style={styles.statusText}>PENDING</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.detailsList}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Transaction ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{transactionData.transactionId}</ThemedText>
            </ThemedView>
            
            {transactionData.referenceId && transactionData.referenceId !== 'N/A' && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Reference ID:</ThemedText>
                <ThemedText style={styles.detailValue}>{transactionData.referenceId}</ThemedText>
              </ThemedView>
            )}
            
            {transactionData.type && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Service:</ThemedText>
                <ThemedText style={styles.detailValue}>{getServiceTitle()}</ThemedText>
              </ThemedView>
            )}

            {transactionData.type === 'prepaid' && (
              <>
                {transactionData.contactName && (
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Name:</ThemedText>
                    <ThemedText style={styles.detailValue}>{transactionData.contactName}</ThemedText>
                  </ThemedView>
                )}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Mobile Number:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.phoneNumber}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Operator:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.operator}</ThemedText>
                </ThemedView>
              </>
            )}

            {transactionData.type === 'dth' && (
              <>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Operator:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.operator}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Subscriber ID:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.subscriberId}</ThemedText>
                </ThemedView>
              </>
            )}

            {transactionData.type === 'bill' && (
              <>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Biller:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.billerName}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Account Number:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transactionData.accountNumber}</ThemedText>
                </ThemedView>
              </>
            )}

            {transactionData.paymentMethod && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Payment Method:</ThemedText>
                <ThemedText style={styles.detailValue}>{getPaymentMethodName(transactionData.paymentMethod)}</ThemedText>
              </ThemedView>
            )}

            {transactionData.amount > 0 && (
              <ThemedView style={[styles.detailRow, styles.amountRow]}>
                <ThemedText style={styles.amountLabel}>Amount:</ThemedText>
                <ThemedText style={styles.amountValue}>₹{transactionData.amount.toFixed(2)}</ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date & Time:</ThemedText>
              <ThemedText style={styles.detailValue}>{transactionData.timestamp}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

      </ScrollView>

      {/* Bottom Actions */}
      <ThemedView style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.checkButton, isChecking && styles.checkButtonDisabled]} 
          onPress={handleCheckNow}
          disabled={isChecking}
        >
          {isChecking ? (
            <ThemedView style={styles.checkingContainer}>
              <FontAwesome name="spinner" size={16} color="#ffffff" />
              <ThemedText style={styles.checkButtonText}>Checking...</ThemedText>
            </ThemedView>
          ) : (
            <ThemedText style={styles.checkButtonText}>Check Status</ThemedText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <FontAwesome name="home" size={16} color="white" />
          <ThemedText style={styles.homeButtonText}>Go to Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* WebView Modal for Android/iOS UPI Payment */}
      <Modal visible={showWebView} animationType="slide" presentationStyle="fullScreen">
        <StatusBar barStyle="dark-content" backgroundColor="#000000" />
        <View style={styles.webviewContainer}>
          <View style={[styles.webviewHeader, { paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 40 }]}>
            <TouchableOpacity onPress={() => {
              setShowWebView(false);
              router.replace('/(tabs)/home');
            }} style={styles.webviewCloseButton}>
              <ThemedText style={styles.webviewCloseButtonText}>🏠 Go to Home</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.webviewTitle}>UPI Payment</ThemedText>
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
            userAgent={Platform.select({
              ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              android: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
              default: 'Mozilla/5.0 (Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
            })}
            setSupportMultipleWindows={true}
            allowsProtectedMedia={true}
            onMessage={(event) => {
              console.log('PendingScreen WebView Message:', event.nativeEvent.data);
              
              try {
                const message = JSON.parse(event.nativeEvent.data);
                
                // Handle go to home request from WebView JavaScript
                if (message.type === 'goto-home') {
                  console.log('PendingScreen received goto-home message from WebView');
                  goToHome();
                  return;
                }
                
                // Handle UPI link messages
                if (message.type === 'upi-link' && message.url) {
                  console.log('PendingScreen intercepted UPI link via message:', message.url);
                  
                  Linking.canOpenURL(message.url)
                    .then((supported) => {
                      if (supported) {
                        console.log('PendingScreen opening UPI app via message...');
                        Linking.openURL(message.url);
                      } else {
                        console.log('PendingScreen no UPI app found via message:', message.url);
                        Alert.alert(
                          'UPI App Required',
                          'Please install a UPI app like PhonePe, Google Pay, or Paytm to complete the payment.',
                          [{ text: 'OK' }]
                        );
                      }
                    })
                    .catch((err) => {
                      console.error('PendingScreen error opening UPI app via message:', err);
                    });
                }
              } catch (error) {
                // Not a JSON message, check for simple string commands
                const messageStr = event.nativeEvent.data;
                if (messageStr === 'goto-home' || messageStr === 'goToHome') {
                  console.log('PendingScreen received string goto-home message from WebView');
                  goToHome();
                }
              }
            }}
            injectedJavaScript={`
              (function() {
                console.log('PendingScreen injected JavaScript running');
                
                // Override window.open to catch UPI links
                const originalOpen = window.open;
                window.open = function(url, target, features) {
                  console.log('PendingScreen window.open called with:', url);
                  if (url && (url.startsWith('upi://') || url.startsWith('phonepe://') || 
                             url.startsWith('paytm://') || url.startsWith('gpay://') || 
                             url.startsWith('bhim://'))) {
                    console.log('PendingScreen detected UPI link in window.open:', url);
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
                    console.log('PendingScreen location.href set to:', url);
                    if (url && (url.startsWith('upi://') || url.startsWith('phonepe://') || 
                               url.startsWith('paytm://') || url.startsWith('gpay://') || 
                               url.startsWith('bhim://'))) {
                      console.log('PendingScreen detected UPI link in location.href:', url);
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
                  console.log('PendingScreen location.assign called with:', url);
                  if (url && (url.includes('phonepe://') || url.includes('upi://') || 
                             url.includes('paytm://') || url.includes('gpay://') || 
                             url.includes('bhim://'))) {
                    console.log('PendingScreen detected UPI link in location.assign:', url);
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
                    console.log('PendingScreen link clicked:', target.href);
                    if (target.href.includes('phonepe://') || target.href.includes('upi://') || 
                        target.href.includes('paytm://') || target.href.includes('gpay://') || 
                        target.href.includes('bhim://')) {
                      console.log('PendingScreen detected UPI link in click:', target.href);
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
                  console.log('PendingScreen location.replace called with:', url);
                  if (url && (url.includes('phonepe://') || url.includes('upi://') || 
                             url.includes('paytm://') || url.includes('gpay://') || 
                             url.includes('bhim://'))) {
                    console.log('PendingScreen detected UPI link in location.replace:', url);
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
                    console.log('PendingScreen detected UPI link in document.write:', html);
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
                  console.log('PendingScreen WebView JavaScript called goToHome()');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'goto-home'
                  }));
                };
                
                // Also expose as simple string message (alternative method)
                window.navigateToHome = function() {
                  console.log('PendingScreen WebView JavaScript called navigateToHome()');
                  window.ReactNativeWebView.postMessage('goto-home');
                };
                
                console.log('PendingScreen WebView JavaScript bridge initialized. Available functions:');
                console.log('- window.goToHome() - Navigate to home screen');
                console.log('- window.navigateToHome() - Alternative method to navigate to home');
                console.log('Usage example: window.goToHome();');
              })();
            `}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onShouldStartLoadWithRequest={(request) => {
              console.log('PendingScreen WebView attempting to load:', request.url);
              
              // Handle Android intent URLs specifically
              if (request.url.startsWith('intent://')) {
                console.log('PendingScreen detected Android intent URL:', request.url);
                // Parse intent URL to extract actual UPI URL
                try {
                  // Intent format: intent://upi/pay?pa=...&pn=...#Intent;scheme=upi;package=com.phonepe.app;end
                  const intentMatch = request.url.match(/intent:\/\/(.+?)#Intent;scheme=([^;]+);package=([^;]+);/);
                  if (intentMatch) {
                    const [, path, scheme, packageName] = intentMatch;
                    const upiUrl = `${scheme}://${path}`;
                    console.log('PendingScreen parsed UPI URL from intent:', upiUrl);
                    console.log('PendingScreen target package:', packageName);
                    
                    // Try to open the UPI URL
                    Linking.openURL(upiUrl).catch((err) => {
                      console.error('PendingScreen failed to open UPI URL from intent:', err);
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
                    console.log('PendingScreen could not parse intent URL, trying generic UPI apps');
                    const fallbackApps = ['phonepe://', 'gpay://', 'paytm://', 'upi://'];
                    fallbackApps.forEach(app => {
                      Linking.openURL(app).catch(() => {});
                    });
                  }
                } catch (error) {
                  console.error('PendingScreen error parsing intent URL:', error);
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

                console.log('PendingScreen BLOCKED direct UPI scheme, opening externally:', request.url);
                // Open UPI app immediately
                Linking.openURL(request.url).catch((err) => {
                  console.error('PendingScreen failed to open UPI app:', err);
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
              console.log('PendingScreen WebView navigation:', navState.url);
              // Handle UPI deep links in navigation state change
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
                console.log('PendingScreen navigation intercepted UPI deep link:', navState.url);
                
                // Try to open the UPI app
                Linking.openURL(navState.url)
                  .then(() => {
                    console.log('PendingScreen successfully opened UPI app via navigation');
                  })
                  .catch((err) => {
                    console.error('PendingScreen error opening UPI app via navigation:', err);
                    
                    // Try alternative UPI apps
                    const alternativeApps = ['phonepe://upi/pay', 'gpay://upi/pay', 'paytm://upi/pay'];
                    let appOpened = false;
                    
                    alternativeApps.forEach((appUrl) => {
                      if (!appOpened) {
                        Linking.openURL(appUrl)
                          .then(() => {
                            appOpened = true;
                            console.log('PendingScreen opened alternative UPI app:', appUrl);
                          })
                          .catch(() => {});
                      }
                    });
                  });
                
                return; // Don't process further
              }
              
              // Check if payment is completed based on URL patterns
              if (navState.url.includes('success') || navState.url.includes('completed')) {
                setShowWebView(false);
                // Go directly to home instead of success screen
                router.replace('/(tabs)/home');
              } else if (navState.url.includes('failed') || navState.url.includes('cancel')) {
                setShowWebView(false);
                // Go directly to home instead of failure screen
                router.replace('/(tabs)/home');
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('PendingScreen WebView error: ', nativeEvent);
              setShowWebView(false);
              // Go directly to home instead of showing error alert
              router.replace('/(tabs)/home');
            }}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#000000" />
                <ThemedText style={styles.webviewLoadingText}>Loading payment gateway...</ThemedText>
              </View>
            )}
          />
          {webViewLoading && (
            <View style={styles.webviewLoadingOverlay}>
              <ActivityIndicator size="large" color="#000000" />
              <ThemedText style={styles.webviewLoadingOverlayText}>Loading payment gateway...</ThemedText>
            </View>
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  pendingContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  pendingIconContainer: {
    marginBottom: 20,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FF9800',
  },
  statusSteps: {
    marginBottom: 20,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0d6a6',
  },
  countdownLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginRight: 8,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  detailsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  detailsList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  amountRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    flex: 1,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 10,
    opacity: 0.8,
    flex: 1,
  },
  timeCard: {
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 1,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
    zIndex: 10,
    elevation: 10,
  },
  checkButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor:'black'
  },
  homeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  webviewLoadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});