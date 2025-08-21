import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';

// Cross-platform WebView component
let NativeWebView;
if (Platform.OS !== 'web') {
  try {
    const { WebView } = require('react-native-webview');
    NativeWebView = WebView;
  } catch (error) {
    console.warn('react-native-webview not available:', error);
    NativeWebView = null;
  }
}

const CrossPlatformWebView = forwardRef(({
  source,
  style,
  onLoad,
  onLoadStart,
  onLoadEnd,
  onError,
  onNavigationStateChange,
  renderLoading,
  renderError,
  javaScriptEnabled = true,
  domStorageEnabled = true,
  startInLoadingState = true,
  ...otherProps
}, ref) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(startInLoadingState);
  const [error, setError] = useState(null);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    reload: () => {
      if (Platform.OS === 'web') {
        if (webViewRef.current) {
          setLoading(true);
          setError(null);
          webViewRef.current.src = webViewRef.current.src;
        }
      } else {
        webViewRef.current?.reload();
      }
    },
    goBack: () => {
      if (Platform.OS === 'web') {
        try {
          if (webViewRef.current && webViewRef.current.contentWindow) {
            webViewRef.current.contentWindow.history.back();
          }
        } catch (e) {
          console.warn('Cannot go back in iframe due to cross-origin restrictions');
        }
      } else {
        webViewRef.current?.goBack();
      }
    },
    goForward: () => {
      if (Platform.OS === 'web') {
        try {
          if (webViewRef.current && webViewRef.current.contentWindow) {
            webViewRef.current.contentWindow.history.forward();
          }
        } catch (e) {
          console.warn('Cannot go forward in iframe due to cross-origin restrictions');
        }
      } else {
        webViewRef.current?.goForward();
      }
    },
    stopLoading: () => {
      if (Platform.OS !== 'web') {
        webViewRef.current?.stopLoading();
      }
    },
  }));

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleLoad = () => {
    console.log('CrossPlatformWebView: handleLoad called');
    setLoading(false);
    onLoad?.();
  };

  const handleError = (errorEvent) => {
    setLoading(false);
    setError(errorEvent);
    onError?.(errorEvent);
  };

  if (Platform.OS === 'web') {
    // Automatically call onLoad for web since we're not actually loading anything
    useEffect(() => {
      if (onLoad) {
        const timer = setTimeout(() => {
          handleLoad();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [onLoad]);

    return (
      <div style={{ 
        ...StyleSheet.flatten(style),
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '400px'
      }}>
        {/* Payment Window Instructions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #007AFF',
          borderRadius: '12px',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            💳
          </div>
          <h2 style={{
            color: '#333',
            marginBottom: '16px',
            fontSize: '24px'
          }}>
            Payment Window
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '24px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Click the button below to open the secure payment window.<br/>
            Complete your payment there and return to this page.
          </p>
          
          <button
            onClick={() => {
              const paymentUrl = source?.uri || source;
              console.log('Opening payment window:', paymentUrl);
              
              // Open payment in new window
              const paymentWindow = window.open(
                paymentUrl, 
                'payment',
                'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
              );

              if (paymentWindow) {
                // Monitor the payment window
                const checkClosed = setInterval(() => {
                  if (paymentWindow.closed) {
                    clearInterval(checkClosed);
                    console.log('Payment window closed');
                    
                    // Notify parent that payment window was closed
                    if (onNavigationStateChange) {
                      onNavigationStateChange({
                        url: 'payment-window-closed',
                        loading: false,
                        title: 'Payment Complete',
                        canGoBack: true,
                        canGoForward: false
                      });
                    }

                    // Show completion message
                    setTimeout(() => {
                      const result = window.confirm(
                        'Payment window has been closed. Did you complete your payment successfully?'
                      );
                      
                      if (result) {
                        // User confirms payment was successful
                        if (onNavigationStateChange) {
                          onNavigationStateChange({
                            url: 'payment-success-confirmed',
                            loading: false,
                            title: 'Payment Successful',
                            canGoBack: true,
                            canGoForward: false
                          });
                        }
                      }
                    }, 500);
                  }
                }, 1000);

                // Focus the payment window
                paymentWindow.focus();
                
                // Provide navigation state
                if (onNavigationStateChange) {
                  onNavigationStateChange({
                    url: paymentUrl,
                    loading: false,
                    title: 'Payment Window Opened',
                    canGoBack: true,
                    canGoForward: false
                  });
                }
              } else {
                // Popup was blocked
                alert('Please allow popups for this site to open the payment window, or copy the URL to open manually: ' + paymentUrl);
                handleError({
                  domain: 'popup-blocked',
                  code: -1,
                  description: 'Payment window was blocked by browser'
                });
              }
            }}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007AFF'}
          >
            Open Payment Window
          </button>
          
          <p style={{
            color: '#888',
            fontSize: '14px',
            marginTop: '16px'
          }}>
            A new secure window will open for payment processing
          </p>
        </div>

        {/* Error overlay */}
        {error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 10,
            padding: '20px',
            textAlign: 'center'
          }}>
            {renderError ? (
              <div>{renderError(error.domain, error.code, error.description)}</div>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ color: '#ff4444', marginBottom: '8px' }}>Payment Error</h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  {error.description || 'Unable to open payment window. Please check your browser settings.'}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    handleLoad();
                  }}
                  style={{
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Native platforms
  if (!NativeWebView) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>WebView not available on this platform</Text>
      </View>
    );
  }

  return (
    <NativeWebView
      ref={webViewRef}
      source={source}
      style={style}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
      onLoad={handleLoad}
      onError={handleError}
      onNavigationStateChange={onNavigationStateChange}
      renderLoading={renderLoading}
      renderError={renderError}
      javaScriptEnabled={javaScriptEnabled}
      domStorageEnabled={domStorageEnabled}
      startInLoadingState={startInLoadingState}
      {...otherProps}
    />
  );
});

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CrossPlatformWebView;