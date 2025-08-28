import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MainHeader from '@/components/MainHeader';
import { getUserBalance } from '../../services';

// QR Code libraries - platform specific
let QRCodeLib;
let QRCode;
let domtoimage;

if (Platform.OS === 'web') {
  try {
    QRCodeLib = require('qrcode');
  } catch (error) {
    console.log('QRCode library not available on web');
  }
} else {
  try {
    const qrCodeComponent = require('react-native-qrcode-svg');
    QRCode = qrCodeComponent.default || qrCodeComponent;
  } catch (error) {
    console.log('QRCode SVG library not available');
  }
}

export default function QrPrintScreen() {
  const router = useRouter();
  
  // State management
  const [userData, setUserData] = useState(null);
  const [qrData, setQrData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // User benefits data
  const userBenefits = [
    {
      id: 1,
      title: 'Instant Recharge',
      description: 'Quick mobile and DTH recharge services',
      icon: 'mobile',
      color: '#000000'
    },
    {
      id: 2,
      title: 'Bill Payments',
      description: 'Pay electricity, water & other utility bills',
      icon: 'receipt',
      color: '#000000'
    },
    {
      id: 3,
      title: 'Cashback Rewards',
      description: 'Earn cashback on every transaction',
      icon: 'attach-money',
      color: '#000000'
    },
    {
      id: 4,
      title: '24/7 Support',
      description: 'Round-the-clock customer support',
      icon: 'support-agent',
      color: '#000000'
    }
  ];

  // Fetch user data and generate QR
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user data from AsyncStorage
      const [sessionToken, permanentToken, username, mobileNumber] = await Promise.all([
        AsyncStorage.getItem('sessionToken'),
        AsyncStorage.getItem('permanentToken'),
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('mobileNumber')
      ]);

      if (!sessionToken) {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.replace('/auth/LoginScreen');
        return;
      }

      // Fetch wallet balance
      const balanceResponse = await getUserBalance(sessionToken);
      const walletBalance = balanceResponse?.status === 'success' ? balanceResponse.data : { balance: '0.00' };

      const user = {
        username: username || 'User',
        mobileNumber: mobileNumber || 'N/A',
        balance: walletBalance.balance || '0.00',
        sessionToken,
        permanentToken
      };

      setUserData(user);

      // Generate QR data
      const qrInfo = {
        name: user.username,
        mobile: user.mobileNumber,
        balance: user.balance,
        app: 'vasbzaar',
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrInfo);
      setQrData(qrString);

      // Generate QR code image
      await generateQRCode(qrString);

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR Code
  const generateQRCode = async (data) => {
    try {
      if (Platform.OS === 'web') {
        if (QRCodeLib) {
          const qrCodeDataURL = await QRCodeLib.toDataURL(data, {
            width: 200,
            height: 200,
            margin: 2
          });
          setQrCodeImage(qrCodeDataURL);
        }
      } else {
        // For mobile, we'll use the QRCode component directly in render
        setQrCodeImage(data);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Download QR Code
  const downloadQRCode = async () => {
    try {
      setDownloading(true);

      if (Platform.OS === 'web') {
        // Web download
        if (qrCodeImage) {
          const link = document.createElement('a');
          link.download = `VAS-Bazaar-QR-${userData?.username || 'user'}.png`;
          link.href = qrCodeImage;
          link.click();
          
          Alert.alert('Success', 'QR code downloaded successfully!');
        }
      } else {
        // Mobile download would require additional libraries like react-native-fs
        Alert.alert('Info', 'Download feature is available on web version.');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Share QR Code
  const shareQRCode = async () => {
    try {
      if (Platform.OS !== 'web') {
        const shareContent = {
          title: 'My vasbzaar QR Code',
          message: `Check out my vasbzaar profile!\nName: ${userData?.username}\nMobile: ${userData?.mobileNumber}\nWallet Balance: ₹${userData?.balance}`,
        };

        if (qrCodeImage && Platform.OS !== 'web') {
          shareContent.url = qrCodeImage;
        }

        await Share.share(shareContent);
      } else {
        // Web share using navigator.share or fallback
        if (navigator.share) {
          await navigator.share({
            title: 'My vasbzaar QR Code',
            text: `Check out my vasbzaar profile!\nName: ${userData?.username}\nMobile: ${userData?.mobileNumber}`,
          });
        } else {
          Alert.alert('Info', 'Share feature is not supported on this browser.');
        }
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };


  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <MainHeader 
          title="My QR Code" 
          showBack={true}
          showSearch={false}
          showNotification={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Generating QR Code...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MainHeader 
        title="My QR Code" 
        showBack={true}
        showSearch={false}
        showNotification={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* QR Code Section */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>My vasbzaar QR Code</Text>
          <Text style={styles.qrDescription}>
            Share this QR code to let others know about your vasbzaar profile
          </Text>
          
          <View style={styles.qrCodeWrapper}>
            {Platform.OS === 'web' && qrCodeImage ? (
              <Image 
                source={{ uri: qrCodeImage }} 
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            ) : QRCode && qrData ? (
              <QRCode
                value={qrData}
                size={200}
                color="black"
                backgroundColor="white"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <MaterialIcons name="qr-code" size={100} color="#000" />
                <Text style={styles.placeholderText}>QR Code unavailable</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={downloadQRCode}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="download" size={16} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {downloading ? 'Downloading...' : 'Download'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]} 
              onPress={shareQRCode}
            >
              <FontAwesome name="share" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>vasbzaar Benefits</Text>
          <Text style={styles.benefitsDescription}>
            Enjoy these amazing features with your vasbzaar account
          </Text>
          
          <View style={styles.benefitsGrid}>
            {userBenefits.map((benefit) => (
              <View key={benefit.id} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000' }]}>
                  <MaterialIcons name={benefit.icon} size={24} color="#000" />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // QR Code Section
  qrContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Benefits Section
  benefitsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});