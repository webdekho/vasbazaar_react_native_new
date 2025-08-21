import CommonHeader2 from '../../components/CommoHedder2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
// Platform-specific QR code imports
let QRCodeLib;
if (Platform.OS === 'web') {
  // Use qrcode library for web
  QRCodeLib = require('qrcode');
} else {
  // Use react-native-qrcode-svg for native platforms
  QRCodeLib = require('react-native-qrcode-svg').default;
}
import { captureRef } from 'react-native-view-shot';
import { AuthContext } from '../../context/AuthContext';

import logoInsideQR from '../../../assets/vasbazaar_favicon.png'; // logo for QR

// Only import html2canvas in web
let html2canvas;
if (Platform.OS === 'web') {
  html2canvas = require('html2canvas');
}

export default function QrPrint({ navigation }) {
  const [qrString, setQrString] = useState('');
  const [qrDataURL, setQrDataURL] = useState('');
  const [hideDownloadBtn, setHideDownloadBtn] = useState(false);
  const standRef = useRef(null);
  const { userData } = useContext(AuthContext);

  useEffect(() => {
    const loadQr = async () => {
      const savedQR = await AsyncStorage.getItem('VAS_QR_STRING');
      if (savedQR) {
        setQrString(savedQR);
        
        // Generate QR code data URL for web
        if (Platform.OS === 'web' && QRCodeLib) {
          try {
            const dataURL = await QRCodeLib.toDataURL(savedQR, {
              width: 160,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            setQrDataURL(dataURL);
          } catch (error) {
            console.error('QR Code generation error:', error);
          }
        }
      }
    };
    loadQr();
  }, []);

  const handleDownload = async () => {
    try {
      setHideDownloadBtn(true);
      await new Promise((res) => setTimeout(res, 100));

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const element = document.getElementById('stand-container');
        if (element && html2canvas) {
          const canvas = await html2canvas(element);
          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = 'vasbazaar-qr.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const uri = await captureRef(standRef, {
          format: 'png',
          quality: 1,
        });

        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Storage permission is required to save the image.');
          return;
        }

        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'QR Code saved to your gallery!');
      }
    } catch (error) {
      console.error('Download Error:', error);
      Alert.alert('Error', 'Failed to save image.');
    } finally {
      setHideDownloadBtn(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Join vasbazaar and start earning cashback on every payment! Use my referral link: ${qrString}`,
        title: 'Join vasbazaar',
      });
    } catch (error) {
      console.error('Share Error:', error);
    }
  };

  return (
    <>
      <CommonHeader2 heading="QR Print" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main QR Card */}
        <View
          ref={standRef}
          collapsable={false}
          style={styles.qrCard}
          id="stand-container"
        >
          <View style={styles.cardHeader}>
            <Image
              source={require('../../../assets/vasbazaar_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.cardSubtitle}>Scan to download application & earn on every transaction</Text>
          </View>

          <View style={styles.qrContainer}>
            {qrString ? (
              Platform.OS === 'web' ? (
                qrDataURL ? (
                  <Image 
                    source={{ uri: qrDataURL }}
                    style={styles.qrCodeImage}
                  />
                ) : (
                  <Text style={styles.loadingText}>Generating QR...</Text>
                )
              ) : (
                <QRCodeLib
                  value={qrString}
                  size={160}
                  logo={logoInsideQR}
                  logoSize={32}
                  logoBackgroundColor="transparent"
                />
              )
            ) : (
              <Text style={styles.loadingText}>Loading QR...</Text>
            )}
          </View>

          {(userData?.name || userData?.mobile) && (
            <View style={styles.userInfo}>
              {userData?.name && (
                <Text style={styles.userName}>{userData.name}</Text>
              )}
              {userData?.mobile && (
                <View style={styles.phoneRow}>
                  <MaterialIcons name="phone" size={16} color="#666" />
                  <Text style={styles.phoneNumber}>+91 {userData.mobile}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#000" />
            <Text style={styles.actionBtnText}>Share QR</Text>
          </TouchableOpacity>
          
          {!hideDownloadBtn && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
              <MaterialIcons name="download" size={20} color="#000" />
              <Text style={styles.actionBtnText}>Save QR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Benefits Section */}
        <Card style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <MaterialIcons name="star" size={20} color="#FF9800" />
            <Text style={styles.benefitsTitle}>Why use vasbazaar?</Text>
          </View>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Instant cashback on every payment</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Secure & fast transactions</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>No hidden charges</Text>
            </View>
          </View>
        </Card>

        {/* Referral Link */}
        <Card style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <MaterialIcons name="group-add" size={20} color="#2196F3" />
            <Text style={styles.referralTitle}>Invite Friends</Text>
          </View>
          <Text style={styles.referralText}>Share your referral link and earn for lifetime</Text>
          <TouchableOpacity style={styles.referralButton} onPress={handleShare}>  
            <Text style={styles.referralButtonText}>Share Referral Link</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeImage: {
    width: 160,
    height: 160,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 80,
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  userName: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  actionBtnText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  referralCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  referralText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  referralButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  referralButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
