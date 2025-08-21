import React, { useRef, useState, useEffect,useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import CommonHeader2 from '../../components/CommoHedder2';
import CrossPlatformWebView from '../../components/CrossPlatformWebView';
import { MaterialIcons } from '@expo/vector-icons';
import { getRecords,postRequest } from '../../Services/ApiServices';
import { AuthContext } from '../../context/AuthContext';

export default function PaymentWebView({ navigation, route }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { userToken } = useContext(AuthContext);
  
  // Get the upiToken from route params
  const upiToken = route?.params?.upiToken;

  // Fetch payment URL from API
  useEffect(() => {
    const fetchPaymentUrl = async () => {
      if (!upiToken) {
        setError('UPI Token is required');
        setApiLoading(false);
        return;
      }

      if (!userToken) {
        setError('User token is required');
        setApiLoading(false);
        return;
      }

      try {
        setApiLoading(true);
        setError(null);
        
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
          setPaymentUrl(response.data);
          console.log('Payment URL set:', response.data);
        } else {
          throw new Error(response.message || 'Failed to generate payment link');
        }
      } catch (error) {
        console.error('Error fetching payment URL:', error);
        setError(error.message || 'Failed to load payment page');
      } finally {
        setApiLoading(false);
      }
    };

    fetchPaymentUrl();
  }, [upiToken, userToken, route?.params?.retry]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      // Show confirmation before leaving payment
      Alert.alert(
        'Exit Payment',
        'Are you sure you want to leave the payment page?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => navigation.goBack() }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack, navigation]);

  // Handle navigation state change
  const onNavigationStateChange = (navState) => {
    console.log('Navigation state changed:', navState);
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
    setLoading(navState.loading);

    // Check if payment is completed based on URL patterns
    const url = navState.url.toLowerCase();
    
    // Payment success patterns
    if (url.includes('success') || 
        url.includes('payment-success') || 
        url.includes('transaction-success') ||
        url.includes('completed')) {
      
      Alert.alert(
        'Payment Successful!',
        'Your payment has been completed successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate back to previous screen or home
              navigation.goBack();
            }
          }
        ]
      );
    }
    
    // Payment failure patterns
    else if (url.includes('failure') || 
             url.includes('payment-failed') || 
             url.includes('transaction-failed') ||
             url.includes('error')) {
      
      // Don't auto-close on failure, let user retry or manually go back
      console.log('Payment failed or error page detected');
    }
  };

  // Add a timer to show helpful message for web users
  useEffect(() => {
    if (Platform.OS === 'web' && paymentUrl && !loading) {
      const timer = setTimeout(() => {
        // Show helpful message after 30 seconds for web users
        Alert.alert(
          'Payment in Progress',
          'Complete your payment in the payment window. The page will automatically close when payment is successful.',
          [{ text: 'OK' }]
        );
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [paymentUrl, loading]);

  // Handle WebView errors
  const onError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    
    Alert.alert(
      'Loading Error',
      'Failed to load the payment page. Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: () => webViewRef.current?.reload() },
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Custom header with back button
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <CommonHeader2 heading="Payment" />
      
      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => webViewRef.current?.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.reload()}
        >
          <MaterialIcons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            Alert.alert(
              'Close Payment',
              'Are you sure you want to close the payment page?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Close', onPress: () => navigation.goBack() }
              ]
            );
          }}
        >
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show API loading state
  if (apiLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Preparing payment...</Text>
          {upiToken && (
            <Text style={styles.urlDebug}>UPI Token: {upiToken.substring(0, 20)}...</Text>
          )}
        </View>
      </View>
    );
  }

  // Show API error state
  if (error && !paymentUrl) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ff4444" />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              // Restart the API call
              setError(null);
              setApiLoading(true);
              // Force re-run of useEffect by changing a dependency
              navigation.setParams({ retry: Date.now() });
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show WebView only when payment URL is available
  if (!paymentUrl) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.errorMessage}>No payment URL available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Loading indicator for WebView - don't show for web platform */}
      {loading && Platform.OS !== 'web' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}
      
      {/* Web-specific info banner */}
      {Platform.OS === 'web' && (
        <View style={styles.webInfoBanner}>
          <MaterialIcons name="info" size={16} color="#0066cc" />
          <Text style={styles.webInfoText}>
            Complete your payment below. The page will close automatically when done.
          </Text>
        </View>
      )}

      {/* Cross-platform WebView */}
      <CrossPlatformWebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webView}
        onNavigationStateChange={onNavigationStateChange}
        onError={onError}
        onLoadStart={() => {
          console.log('WebView started loading:', paymentUrl);
          setLoading(true);
        }}
        onLoadEnd={() => {
          console.log('WebView finished loading');
          setLoading(false);
        }}
        onLoad={() => {
          console.log('WebView loaded successfully');
          setLoading(false);
        }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // Native-specific props (will be ignored on web)
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
        mixedContentMode="compatibility"
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        thirdPartyCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        cacheEnabled={false}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading payment page...</Text>
            <Text style={styles.urlDebug}>URL: {paymentUrl.substring(0, 50)}...</Text>
          </View>
        )}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#ff4444" />
            <Text style={styles.errorTitle}>Failed to Load</Text>
            <Text style={styles.errorMessage}>Error: {errorDesc}</Text>
            <Text style={styles.errorDetails}>Domain: {errorDomain}, Code: {errorCode}</Text>
            <Text style={styles.urlDebug}>URL: {paymentUrl}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => webViewRef.current?.reload()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* URL indicator for debugging */}
      {__DEV__ && (
        <View style={styles.urlContainer}>
          <Text style={styles.urlText} numberOfLines={1}>
            {currentUrl}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  urlContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  urlDebug: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  webInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  webInfoText: {
    fontSize: 14,
    color: '#0066cc',
    marginLeft: 8,
    flex: 1,
  },
  webHelpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});