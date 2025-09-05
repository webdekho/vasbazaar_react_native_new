import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrientation } from '@/hooks/useOrientation';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareReferralLink } from '../../../services/sharing/shareService';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orientation = useOrientation();
  const insets = useSafeAreaInsets();
  const [referenceLink, setReferenceLink] = useState("https://vasbazaar.webdekho.in");

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
    status: params.status || 'SUCCESS',
    couponName: params.couponName || '',
    couponDesc: params.couponDesc || '',
    selectedCoupon2: params.selectedCoupon2 || ''
  };

  useEffect(() => {
    GetReferenceLink();
  }, []);

  const GetReferenceLink = async () => {
    try {
      const key = 'VAS_QR_STRING';
      const savedLink = await AsyncStorage.getItem(key);
      if (savedLink) {
        setReferenceLink(savedLink);
      }
    } catch (error) {
      // keep fallback
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
      const userName = transactionData.customerName || transactionData.contactName || 'User';
      await shareReferralLink(referenceLink, userName);
    } catch (error) {
      console.error('Error sharing referral:', error);
      Alert.alert("Error", "Unable to share referral link. Please try again.");
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit/Debit Card';
      case 'netbanking': return 'Net Banking';
      case 'wallet': return 'Wallet';
      case 'cod': return 'Cash on Delivery';
      default: return method;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top', 'bottom']}>
      <ThemedView style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={[styles.content, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
        >
          {/* Success Section */}
          <ThemedView style={styles.successContainer}>
            <ThemedView style={styles.successIconContainer}>
              <FontAwesome name="check-circle" size={70} color="#4CAF50" />
            </ThemedView>
            <ThemedText style={styles.successTitle}>Transaction Successful!</ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Your transaction has been completed successfully.
            </ThemedText>
          </ThemedView>

          {/* Cashback / Coupon */}
          {(
            transactionData.commission > 0 &&
            ["discount", "cashback"].some(keyword =>
              transactionData?.couponName?.toLowerCase().includes(keyword.toLowerCase())
            )
          ) ? (
            <ThemedView style={styles.cashbackCard}>
              <ThemedText style={styles.cashbackTitle}>Congratulations! 🎉</ThemedText>
              <ThemedText style={styles.cashbackAmount}>
                ₹{transactionData.commission.toFixed(2)} {transactionData.couponName} Earned
              </ThemedText>
              <ThemedText style={styles.cashbackText}>
                Your cashback has been credited to your wallet instantly
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.couponCard}>
              <ThemedText style={styles.couponTitle}>Congratulations! 🎉</ThemedText>
              <ThemedText style={styles.couponAmount}>
                You earned {transactionData.couponName} coupon
              </ThemedText>
              <ThemedText style={styles.couponText}>
                {transactionData.couponDesc}
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
                  onPress={async () => {
                    await Clipboard.setStringAsync(transactionData.transactionId);
                    Alert.alert('Copied!', 'Transaction ID copied');
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
                    onPress={async () => {
                      await Clipboard.setStringAsync(transactionData.referenceId);
                      Alert.alert('Copied!', 'Reference ID copied');
                    }}
                  >
                    <ThemedText style={[styles.detailValue, styles.copyableText]}>
                      {transactionData.referenceId} 📋
                    </ThemedText>
                  </TouchableOpacity>
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
          <ThemedView style={styles.blankSpaces}></ThemedView>
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <ThemedView
          style={[
            styles.bottomActions,
            { paddingBottom: insets.bottom + 12 }, // safe area padding
          ]}
        >
          <TouchableOpacity style={styles.shareButton} onPress={handleShareReferral}>
            <ThemedText style={styles.shareButtonText}>Share & Earn</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <FontAwesome name="home" size={16} color="white" />
            <ThemedText style={styles.homeButtonText}>Go to Home</ThemedText>
          </TouchableOpacity>
        </ThemedView>

       
      </ThemedView>




    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blankSpaces:{height:200},
  container: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { flex: 1 },
  content: { padding: 20 },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIconContainer: { marginBottom: 10 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 16, opacity: 0.7, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  cashbackCard: { backgroundColor: '#000', borderRadius: 12, padding: 20, marginBottom: 20 },
  cashbackTitle: { fontSize: 16, fontWeight: '600', color: '#FFD700', textAlign: 'center', marginBottom: 15 },
  cashbackAmount: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 8, textAlign: 'center' },
  cashbackText: { fontSize: 14, color: '#ccc', textAlign: 'center' },
  couponCard: { backgroundColor: '#fffaab', borderRadius: 12, padding: 20, marginBottom: 20 },
  couponTitle: { fontSize: 16, fontWeight: '600', color: '#000', textAlign: 'center', marginBottom: 15 },
  couponAmount: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  couponText: { fontSize: 14, color: '#000', textAlign: 'center' },
  detailsCard: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 20, marginBottom: 20 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  detailsTitle: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  detailsList: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 14, opacity: 0.7, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  copyableText: { color: '#4CAF50', textDecorationLine: 'underline' },
  amountRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  amountLabel: { fontSize: 16, fontWeight: '600', flex: 1 },
  amountValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', flex: 1, textAlign: 'right' },
  
  
  bottomActions: {
  position: 'fixed',   // stick at bottom
  left: 0,
  right: 0,
  bottom: 0,
  flexDirection: 'row',
  padding: 20,
  borderTopWidth: 1,
  borderTopColor: '#eee',
  gap: 12,
  backgroundColor: '#fff',
},

  
  
  
  shareButton: { flex: 1, padding: 18, borderRadius: 8, backgroundColor: '#000', alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  homeButton: { flex: 1, padding: 18, borderRadius: 8, backgroundColor: '#000', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 56 },
  homeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
