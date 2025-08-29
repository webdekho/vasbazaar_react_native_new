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
        const paymentWindow = window.open(
          paymentUrl, 
          'payment',
          'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        if (paymentWindow) {
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
        
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <FontAwesome name="home" size={16} color="white" />
          <ThemedText style={styles.homeButtonText}>Go to Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
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
});