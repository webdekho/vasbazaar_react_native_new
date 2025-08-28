import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';

const { width } = Dimensions.get("window");

/**
 * SuccessScreen component for displaying payment status and results
 * 
 * Features:
 * - Dynamic status display (success, pending, failed)
 * - Cashback information display
 * - Transaction details with reference IDs
 * - Referral link sharing functionality
 * - WhatsApp integration for sharing
 * - Status-specific action buttons
 * - Responsive layout with animations
 */
export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [referenceLink, setReferenceLink] = useState("https://vasbazaar.web.webdekho.in"); // Default fallback
  
  // Extract transaction data from params
  const {
    plan = { price: params.amount || params.finalAmount || "0" },
    serviceId = params.serviceId,
    operator_id = params.operator_id,
    circleCode = params.circleCode,
    companyLogo = params.companyLogo,
    name = params.contactName || params.customerName,
    mobile = params.phoneNumber || params.subscriberId || params.accountNumber,
    operator = params.operator || params.billerName,
    circle = params.circle,
    coupon = params.coupon,
    coupon2 = params.coupon2,
    userData = {},
    response = {
        "status": params.status || "SUCCESS", // Can be SUCCESS, PENDING, FAILED
        "message": params.message || "Transaction Success.",
        "requestId": params.requestId || params.transactionId || "REQ" + Date.now().toString().slice(-6),
        "referenceId": params.referenceId || "REF" + Date.now().toString().slice(-8),
        "vendorRefId": params.vendorRefId || "VND" + Date.now().toString().slice(-10),
        "commission": parseFloat(params.commission) || parseFloat(params.discount) || 0.02,
        "categoryId": params.categoryId || 1
    },
  } = params;

  // Generate or get reference link
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

  useEffect(() => {
    GetReferenceLink();
  }, [userData?.mobile, mobile]);

  // Get status configuration
  const getStatusConfig = () => {
    const status = response?.status?.toUpperCase();
    
    switch (status) {
      case 'SUCCESS':
        return {
          backgroundColor: '#E8F5E8',
          iconBackground: '#FFFFFF',
          borderColor: '#4CAF50',
          icon: '✅',
          title: 'Payment Successful!',
          subtitle: 'Your transaction has been completed successfully',
          titleColor: '#2E7D32',
          subtitleColor: '#4CAF50',
          showCashback: true,
          showReferral: true
        };
      case 'PENDING':
        return {
          backgroundColor: '#FFF8E1',
          iconBackground: '#FFFFFF',
          borderColor: '#FF9800',
          icon: '⏳',
          title: 'Payment Pending',
          subtitle: 'Your transaction is being processed',
          titleColor: '#F57C00',
          subtitleColor: '#FF9800',
          showCashback: false,
          showReferral: false
        };
      default: // FAILED or any other status
        return {
          backgroundColor: '#FFEBEE',
          iconBackground: '#FFFFFF',
          borderColor: '#F44336',
          icon: '❌',
          title: 'Payment Failed',
          subtitle: 'Your transaction could not be completed',
          titleColor: '#D32F2F',
          subtitleColor: '#F44336',
          showCashback: false,
          showReferral: false
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isSuccess = response?.status?.toUpperCase() === 'SUCCESS';
  const isPending = response?.status?.toUpperCase() === 'PENDING';

  const copyToClipboard = () => {
    Clipboard.setString(referenceLink);
    Alert.alert("Copied", "Referral link copied to clipboard!");
  };

  const shareReferralLink = async () => {
    if (!referenceLink) {
      Alert.alert("Error", "Referral link not available.");
      return;
    }

    try {
      const message = `🎉 Turn your transactions into earnings! Join vasbazaar today & get cashback on every spend. Sign up here: ${referenceLink}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share to WhatsApp.");
    }
  };

  const getHeaderTitle = () => {
    if (isSuccess) return "Congratulations!";
    if (isPending) return "Processing...";
    return "Transaction Status";
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleRechargeAgain = () => {
    router.back();
  };

  return (
    <>
      <MainHeader heading={getHeaderTitle()} showBackButton={false} />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cashback Section for Success */}
        {statusConfig.showCashback && (
          <View style={styles.cashbackCard}>
            <Text style={styles.cashbackTitle}>🏆 Congratulations!</Text>
            <Text style={styles.cashbackAmount}>
              You've won ₹{response?.commission ? response.commission.toFixed(2) : '0'}
            </Text>
            <Text style={styles.cashbackText}>
              Your cashback will be credited to your wallet instantly
            </Text>
          </View>
        )}

        {/* Status Card */}
        <View style={[styles.statusCard, { 
          backgroundColor: statusConfig.backgroundColor,
          borderColor: statusConfig.borderColor 
        }]}>
          <View style={[styles.iconContainer, { 
            backgroundColor: statusConfig.iconBackground,
            borderColor: statusConfig.borderColor 
          }]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
          </View>
          <Text style={[styles.statusTitle, { color: statusConfig.titleColor }]}>
            {statusConfig.title}
          </Text>
          <Text style={[styles.statusSubtitle, { color: statusConfig.subtitleColor }]}>
            {statusConfig.subtitle}
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Detail</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>₹{plan?.price || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request ID:</Text>
            <Text style={styles.detailValue}>{response?.requestId || '--'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference ID:</Text>
            <Text style={[styles.detailValue, styles.referenceId]}>
              {response?.referenceId || '--'}
            </Text>
          </View>

          {name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{name}</Text>
            </View>
          )}

          {mobile && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Number:</Text>
              <Text style={styles.detailValue}>{mobile}</Text>
            </View>
          )}

          {operator && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operator:</Text>
              <Text style={styles.detailValue}>{operator}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isSuccess ? (
            <>
              <TouchableOpacity style={styles.shareButton} onPress={shareReferralLink}>
                <Text style={styles.shareButtonText}>📤 Refer & Earn</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={handleGoHome}
              >
                <Text style={styles.buttonText}>🏠 Go to Home</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[
                  styles.homeButton, 
                  !isPending && styles.fullWidthButton
                ]} 
                onPress={handleGoHome}
              >
                <Text style={styles.buttonText}>
                  {isPending ? '🏠 Go to Home' : '🏠 Go to Home'}
                </Text>
              </TouchableOpacity>
              
              {!isPending && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={handleRechargeAgain}
                >
                  <Text style={styles.buttonText}>🔄 Retry Payment</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  statusCard: {
    margin: 16,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 3,
  },
  statusIcon: {
    fontSize: 60,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  statusSubtitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  referenceId: {
    fontFamily: "monospace",
    backgroundColor: "#F5F5F5",
    padding: 6,
    borderRadius: 6,
    fontSize: 14,
  },
  cashbackCard: {
    backgroundColor: "#000000ff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cashbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
  },
  cashbackAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  cashbackText: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shareButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 0,
    gap: 12,
  },
  homeButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  retryButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fullWidthButton: {
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});