import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [referenceLink, setReferenceLink] = useState("https://vasbazaar.web.webdekho.in");

  // Extract transaction data from params
  const transactionData = {
    type: params.type || 'recharge',
    amount: parseFloat(params.finalAmount) || parseFloat(params.amount) || parseFloat(params.plan ? JSON.parse(params.plan).price?.replace(/[₹,\s]/g, '') : 0) || 0,
    phoneNumber: params.phoneNumber || params.mobile || '',
    subscriberId: params.subscriberId || '',
    accountNumber: params.accountNumber || '',
    operator: params.operator || params.billerName || '',
    billerName: params.billerName || '',
    customerName: params.customerName || params.contactName || params.name || '',
    contactName: params.contactName || params.name || '',
    paymentMethod: params.paymentType || 'upi',
    transactionId: params.requestId || params.transactionId || 'TXN' + Date.now(),
    referenceId: params.referenceId || 'REF' + Date.now().toString().slice(-8),
    timestamp: new Date().toLocaleString(),
    commission: parseFloat(params.commission) || 0.02,
    status: params.status || 'SUCCESS'
  };

  useEffect(() => {
    GetReferenceLink();
  }, []);

  // Get reference link
  const GetReferenceLink = async () => {
    try {
      const key = 'VAS_QR_STRING';
      const savedLink = await AsyncStorage.getItem(key);
      if (savedLink) {
        setReferenceLink(savedLink);
      } 
    } catch (error) {
      // Keep default fallback URL if error occurs
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleShareReferral = async () => {
    if (!referenceLink) {
      Alert.alert("Error", "Referral link not available.");
      return;
    }

    try {
      const message = `🎉 Turn your transactions into earnings! Join vasbazaar today & get cashback on every spend. Sign up here: ${referenceLink}`;
      
      // For web, copy to clipboard and show alert
      await Clipboard.setString(message);
      Alert.alert(
        'Referral Link Copied!',
        'Share this link with your friends to earn rewards.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert("Error", "Unable to copy referral link.");
    }
  };

  const handleViewHistory = () => {
    router.push('/(tabs)/history');
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
      case 'payu': return 'PayU Gateway';
      case 'cod': return 'Cash on Delivery';
      default: return method;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <ThemedView style={styles.successContainer}>
          <ThemedView style={styles.successIconContainer}>
            <FontAwesome name="check-circle" size={80} color="#4CAF50" />
          </ThemedView>
          <ThemedText style={styles.successTitle}>Transaction Successful!</ThemedText>
          <ThemedText style={styles.successSubtitle}>
            Your {getServiceTitle().toLowerCase()} has been completed successfully.
          </ThemedText>
        </ThemedView>

        {/* Cashback Card */}
        {transactionData.commission > 0 && (
          <ThemedView style={styles.cashbackCard}>
            <ThemedText style={styles.cashbackTitle}>Congratulations! 🎉</ThemedText>
            
            <ThemedText style={styles.cashbackAmount}>
              ₹{transactionData.commission.toFixed(2)} Cashback Earned
            </ThemedText>
            <ThemedText style={styles.cashbackText}>
              Your cashback has been credited to your wallet instantly
            </ThemedText>
          </ThemedView>
        )}


        {/* Transaction Details */}
        <ThemedView style={styles.detailsCard}>
          <ThemedView style={styles.detailsHeader}>
            <ThemedText style={styles.detailsTitle}>Transaction Details</ThemedText>
            <ThemedView style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
              <FontAwesome name="check-circle" size={12} color="white" />
              <ThemedText style={styles.statusText}>SUCCESS</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.detailsList}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Transaction ID:</ThemedText>
              <TouchableOpacity 
                onPress={() => {
                  Clipboard.setString(transactionData.transactionId);
                  Alert.alert('Copied!', 'Transaction ID copied to clipboard');
                }}
              >
                <ThemedText style={[styles.detailValue, styles.copyableText]}>
                  {transactionData.transactionId} 📋
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {transactionData.referenceId && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Reference ID:</ThemedText>
                <TouchableOpacity 
                  onPress={() => {
                    Clipboard.setString(transactionData.referenceId);
                    Alert.alert('Copied!', 'Reference ID copied to clipboard');
                  }}
                >
                  <ThemedText style={[styles.detailValue, styles.copyableText]}>
                    {transactionData.referenceId} 📋
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
            
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
          style={styles.shareButton} 
          onPress={handleShareReferral}
        >
          <ThemedText style={styles.shareButtonText}>Share & Earn</ThemedText>
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
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cashbackCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cashbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  cashbackAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  cashbackText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    color: '#4CAF50',
  },
  statusSteps: {
    marginBottom: 0,
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
  copyableText: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
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
    color: '#4CAF50',
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
  shareButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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