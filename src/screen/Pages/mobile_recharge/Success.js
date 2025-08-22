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
import PropTypes from 'prop-types';

import CommonHeader2 from '../../../components/CommoHedder2';

const { width } = Dimensions.get("window");

/**
 * PaymentStatusScreen component for displaying payment status and results
 * 
 * Features:
 * - Dynamic status display (success, pending, failed)
 * - Cashback information display
 * - Transaction details with reference IDs
 * - Referral link sharing functionality
 * - WhatsApp integration for sharing
 * - Status-specific action buttons
 * - Responsive layout with animations
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing transaction parameters
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} The PaymentStatusScreen component
 */
export default function PaymentStatusScreen({ route, navigation }) {
  const [referenceLink, setReferenceLink] = useState(""); // Default fallback
  
  const {
    plan = { price: "0" }, // Default plan with price
    serviceId,
    operator_id,
    circleCode,
    companyLogo,
    name,
    mobile,
    operator,
    circle,
    coupon,
    coupon2,
    userData, // Add userData to get mobile number
    response = {
        "status": "SUCCESS", // Can be SUCCESS, PENDING, FAILED
        "message": "Recharge Success.",
        "requestId": "18T5",
        "referenceId": "BR000CLGJ318",
        "vendorRefId": "3314542641261484128",
        "commission": 0.02,
        "categoryId": 1
    },
  } = route?.params || {};

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
          icon: require("../../../../assets/icons/success.png"),
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
          icon: require("../../../../assets/icons/pending.png"),
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
          icon: require("../../../../assets/icons/failed.png"),
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

  return (
    <>
      <CommonHeader2 heading={getHeaderTitle()} goback='Home' />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}

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

        <View style={[styles.statusCard, { 
          backgroundColor: statusConfig.backgroundColor,
          borderColor: statusConfig.borderColor 
        }]}>
          <View style={[styles.iconContainer, { 
            backgroundColor: statusConfig.iconBackground,
            borderColor: statusConfig.borderColor 
          }]}>
            <Image source={statusConfig.icon} style={styles.statusIcon} />
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
            <Text style={styles.detailValue}>{plan?.price || 'N/A'}</Text>
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
                onPress={() => navigation.navigate('Home')}
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
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.buttonText}>
                  {isPending ? '🔄 Check Status' : '🏠 Go to Home'}
                </Text>
              </TouchableOpacity>
              
              {!isPending && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>🔄 Retry Payment</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        
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
    width: 60,
    height: 60,
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
  referralCard: {
    backgroundColor: "#E8F5E8",
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  referralHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  linkContainer: {
    width: "100%",
    alignItems: "center",
  },
  referralLink: {
    fontSize: 16,
    color: "#1976D2",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  copyButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shareButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  footer: {
    alignItems: "center",
    margin: 20,
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});

PaymentStatusScreen.propTypes = {
  route: PropTypes.object,
  navigation: PropTypes.object.isRequired,
};