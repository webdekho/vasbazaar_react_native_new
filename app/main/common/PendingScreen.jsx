import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { postRequest } from '../../../services/api/baseApi';

export default function PendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rotateAnim] = useState(new Animated.Value(0));
  const [countdown, setCountdown] = useState(30);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCalledPayment, setHasCalledPayment] = useState(false);

  const transactionData = {
    type: params.type || 'recharge',
    amount: parseFloat(params.finalAmount) || parseFloat(params.amount) || 0,
    phoneNumber: params.phoneNumber || '',
    subscriberId: params.subscriberId || '',
    accountNumber: params.accountNumber || '',
    operator: params.operator || '',
    billerName: params.billerName || '',
    customerName: params.customerName || '',
    contactName: params.contactName || '',
    paymentMethod: params.paymentMethod || '',
    transactionId: params.transactionId || 'TXN' + Date.now(),
    timestamp: new Date().toLocaleString(),
    upiToken: params.upiToken || ''
  };

  useEffect(() => {
    // Call payment URL on screen load if upiToken exists
    if (transactionData.upiToken && !hasCalledPayment) {
      setHasCalledPayment(true);
      fetchPaymentUrl(transactionData.upiToken);
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
          checkTransactionStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [transactionData.upiToken, hasCalledPayment]);

  const checkTransactionStatus = () => {
    setIsChecking(true);
    // Simulate API call to check transaction status
    setTimeout(() => {
      setIsChecking(false);
      // Randomly determine final status for demo
      const outcomes = ['success', 'failed', 'pending'];
      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      if (randomOutcome === 'success') {
        router.replace({
          pathname: '/main/common/SuccessScreen',
          params: {
            ...params,
            transactionId: transactionData.transactionId
          }
        });
      } else if (randomOutcome === 'failed') {
        router.replace({
          pathname: '/main/common/FailedScreen',
          params: {
            ...params,
            reason: 'Transaction timeout after verification'
          }
        });
      } else {
        // Still pending, reset countdown
        setCountdown(60);
        Alert.alert(
          'Still Processing',
          'Your transaction is still being processed. We\'ll continue checking for you.',
          [{ text: 'OK' }]
        );
      }
    }, 3000);
  };

  const handleCheckNow = () => {
    if (!isChecking) {
      checkTransactionStatus();
    }
  };

  const handleGoHome = () => {
    Alert.alert(
      'Transaction Pending',
      'Your transaction is still being processed. You will receive SMS/Email notification once completed.',
      [
        { text: 'Stay Here', style: 'cancel' },
        { 
          text: 'Go Home', 
          onPress: () => router.replace('/(tabs)/home')
        }
      ]
    );
  };

  const handleContactSupport = () => {
    router.push('/main/HelpScreen');
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

      if (response.status === 'success' && response.data) {
        // Store payment URL for potential manual access
        if (Platform.OS === 'web') {
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
          return;
        }
        
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
                  router.replace({
                    pathname: '/main/common/SuccessScreen',
                    params: {
                      ...params,
                      response: JSON.stringify({ status: 'success', message: 'Payment completed successfully' }),
                    }
                  });
                } else {
                  // User indicated payment was not completed
                  Alert.alert(
                    'Payment Not Completed',
                    'If you encountered a browser security warning:\n• This is common with test/staging payment gateways\n• The payment gateway is safe to use\n• You can try again and click "Advanced" → "Proceed to site" when you see the warning'
                  );
                }
              }, 1000);
            }
          }, 1000);

          // Focus the payment window
          paymentWindow.focus();
          
        } else {
          // Popup was blocked
          Alert.alert(
            'Payment Window Blocked',
            'Payment window was blocked by your browser.\n\nPlease allow popups for this site and try again.\nAlternatively, you can copy this URL and open it manually:\n\n' + paymentUrl
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open payment window: ' + error.message);
      }
    } else {
      // For mobile platforms, open in browser
      Alert.alert('Info', 'Payment functionality is only available on web platform.');
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
            Your {getServiceTitle().toLowerCase()} is being processed. Please wait for confirmation.
          </ThemedText>
        </ThemedView>

        {/* Status Update */}
        <ThemedView style={styles.statusCard}>
          <ThemedView style={styles.statusHeader}>
            <FontAwesome name="info-circle" size={16} color="#FF9800" />
            <ThemedText style={styles.statusTitle}>Processing Status</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statusSteps}>
            <ThemedView style={styles.statusStep}>
              <ThemedView style={[styles.stepIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={12} color="white" />
              </ThemedView>
              <ThemedText style={styles.stepText}>Payment Initiated</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statusStep}>
              <ThemedView style={[styles.stepIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={12} color="white" />
              </ThemedView>
              <ThemedText style={styles.stepText}>Amount Debited</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statusStep}>
              <Animated.View style={[styles.stepIcon, { backgroundColor: '#FF9800', transform: [{ rotate: spin }] }]}>
                <FontAwesome name="clock-o" size={12} color="white" />
              </Animated.View>
              <ThemedText style={[styles.stepText, { color: '#FF9800' }]}>Verifying Transaction</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statusStep}>
              <ThemedView style={[styles.stepIcon, { backgroundColor: '#ccc' }]}>
                <FontAwesome name="gift" size={12} color="white" />
              </ThemedView>
              <ThemedText style={[styles.stepText, { opacity: 0.5 }]}>Service Activation</ThemedText>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.countdownContainer}>
            <ThemedText style={styles.countdownLabel}>Auto-checking in:</ThemedText>
            <ThemedText style={styles.countdownTime}>{formatTime(countdown)}</ThemedText>
          </ThemedView>
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
            
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Service:</ThemedText>
              <ThemedText style={styles.detailValue}>{getServiceTitle()}</ThemedText>
            </ThemedView>

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

            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Payment Method:</ThemedText>
              <ThemedText style={styles.detailValue}>{getPaymentMethodName(transactionData.paymentMethod)}</ThemedText>
            </ThemedView>

            <ThemedView style={[styles.detailRow, styles.amountRow]}>
              <ThemedText style={styles.amountLabel}>Amount:</ThemedText>
              <ThemedText style={styles.amountValue}>₹{transactionData.amount.toFixed(2)}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date & Time:</ThemedText>
              <ThemedText style={styles.detailValue}>{transactionData.timestamp}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* What's Happening */}
        <ThemedView style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>What's happening now?</ThemedText>
          <ThemedView style={styles.infoItem}>
            <FontAwesome name="check" size={14} color="#4CAF50" />
            <ThemedText style={styles.infoText}>Your payment has been processed</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <FontAwesome name="clock-o" size={14} color="#FF9800" />
            <ThemedText style={styles.infoText}>We're confirming with the service provider</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <FontAwesome name="bell" size={14} color="#000000" />
            <ThemedText style={styles.infoText}>You'll get SMS/Email confirmation once completed</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Typical Time */}
        <ThemedView style={styles.timeCard}>
          <ThemedText style={styles.timeTitle}>Typical Processing Time</ThemedText>
          <ThemedView style={styles.timeInfo}>
            <FontAwesome name="clock-o" size={16} color="#000000" />
            <ThemedText style={styles.timeText}>
              {transactionData.type === 'prepaid' && '2-5 minutes for mobile recharge'}
              {transactionData.type === 'dth' && '5-15 minutes for DTH recharge'}
              {transactionData.type === 'bill' && '1-24 hours for bill payment confirmation'}
            </ThemedText>
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
              <FontAwesome name="spinner" size={16} color="#000000" />
              <ThemedText style={styles.checkButtonText}>Checking...</ThemedText>
            </ThemedView>
          ) : (
            <ThemedText style={styles.checkButtonText}>Check Status Now</ThemedText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <FontAwesome name="support" size={16} color="white" />
          <ThemedText style={styles.supportButtonText}>Get Help</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <FontAwesome name="home" size={16} color="#000000" />
        <ThemedText style={styles.homeButtonText}>Go to Home</ThemedText>
      </TouchableOpacity>
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
    paddingBottom: 160,
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
    padding: 20,
    marginBottom: 20,
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
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  amountRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
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
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  checkButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
  },
  checkButtonDisabled: {
    borderColor: '#ccc',
  },
  checkButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    gap: 8,
  },
  homeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});