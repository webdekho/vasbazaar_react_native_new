import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function FailedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [shakeAnim] = useState(new Animated.Value(0));

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
    reason: params.reason || 'Transaction failed due to technical issues',
    timestamp: new Date().toLocaleString(),
    referenceId: 'REF' + Date.now()
  };

  const failureReasons = [
    'Insufficient balance in your account',
    'Payment gateway timeout',
    'Network connectivity issues',
    'Bank server temporarily unavailable',
    'Invalid card details or expired card',
    'Transaction limit exceeded',
    'Technical error at payment processor'
  ];

  const solutions = [
    {
      title: 'Check Your Balance',
      description: 'Ensure sufficient balance in your payment method',
      icon: 'credit-card'
    },
    {
      title: 'Retry Payment',
      description: 'Try again with the same or different payment method',
      icon: 'refresh'
    },
    {
      title: 'Contact Bank',
      description: 'Contact your bank for transaction related issues',
      icon: 'phone'
    },
    {
      title: 'Customer Support',
      description: 'Reach out to our support team for assistance',
      icon: 'support'
    }
  ];

  useEffect(() => {
    // Animate failure icon with shake effect
    const shake = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    shake();
  }, []);

  const handleRetryPayment = () => {
    // Navigate back to payment screen with same parameters
    router.push({
      pathname: '/main/common/PaymentScreen',
      params
    });
  };

  const handleContactSupport = () => {
    router.push('/main/HelpScreen');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleTryDifferentService = () => {
    router.replace('/(tabs)/home');
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

  const renderSolution = (solution, index) => (
    <TouchableOpacity key={index} style={styles.solutionCard}>
      <ThemedView style={styles.solutionIcon}>
        <FontAwesome name={solution.icon} size={20} color="#000000" />
      </ThemedView>
      <ThemedView style={styles.solutionContent}>
        <ThemedText style={styles.solutionTitle}>{solution.title}</ThemedText>
        <ThemedText style={styles.solutionDescription}>{solution.description}</ThemedText>
      </ThemedView>
      <FontAwesome name="chevron-right" size={14} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Failure Animation */}
        <ThemedView style={styles.failureContainer}>
          <Animated.View style={[styles.failureIconContainer, { transform: [{ translateX: shakeAnim }] }]}>
            <FontAwesome name="times-circle" size={80} color="#FF5722" />
          </Animated.View>
          <ThemedText style={styles.failureTitle}>Payment Failed</ThemedText>
          <ThemedText style={styles.failureSubtitle}>
            We couldn't process your {getServiceTitle().toLowerCase()}. Don't worry, no money was deducted.
          </ThemedText>
        </ThemedView>

        {/* Failure Reason */}
        <ThemedView style={styles.reasonCard}>
          <ThemedView style={styles.reasonHeader}>
            <FontAwesome name="exclamation-triangle" size={16} color="#FF9800" />
            <ThemedText style={styles.reasonTitle}>What went wrong?</ThemedText>
          </ThemedView>
          <ThemedText style={styles.reasonText}>{transactionData.reason}</ThemedText>
        </ThemedView>

        {/* Transaction Details */}
        <ThemedView style={styles.detailsCard}>
          <ThemedView style={styles.detailsHeader}>
            <ThemedText style={styles.detailsTitle}>Transaction Details</ThemedText>
            <ThemedView style={[styles.statusBadge, { backgroundColor: '#FF5722' }]}>
              <FontAwesome name="times" size={12} color="white" />
              <ThemedText style={styles.statusText}>FAILED</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.detailsList}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Reference ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{transactionData.referenceId}</ThemedText>
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
              <ThemedText style={styles.amountLabel}>Attempted Amount:</ThemedText>
              <ThemedText style={styles.amountValue}>₹{transactionData.amount.toFixed(2)}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date & Time:</ThemedText>
              <ThemedText style={styles.detailValue}>{transactionData.timestamp}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Solutions */}
        

       
        
      </ScrollView>

      {/* Bottom Actions */}
      

      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <FontAwesome name="home" size={16} color="#f7f7f7ff" />
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
    paddingBottom: 180,
  },
  failureContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  failureIconContainer: {
    marginBottom: 20,
  },
  failureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 8,
    textAlign: 'center',
  },
  failureSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  reasonCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FF9800',
  },
  reasonText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
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
    color: '#FF5722',
    flex: 1,
    textAlign: 'right',
  },
  solutionsSection: {
    marginBottom: 20,
  },
  solutionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  solutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  solutionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  solutionContent: {
    flex: 1,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  solutionDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  assuranceCard: {
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  assuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assuranceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#4CAF50',
  },
  assuranceText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 16,
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  supportButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
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
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  primaryButtonText: {
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
    backgroundColor: '#000000ff',
    gap: 8,
  },
  homeButtonText: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});