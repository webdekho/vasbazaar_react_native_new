import CommonHeader2 from '../../components/CommoHedder2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { useContext, useEffect, useRef, useState } from 'react';
import { 
  Alert, 
  Image, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Share, 
  Dimensions 
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { AuthContext } from '../../context/AuthContext';

import logoInsideQR from '../../../assets/vasbazaar_favicon.png'; 
import vasbazaarLogo from '../../../assets/vasbazaar_logo.png'; 

// Screen height for scroll section
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// QR Libraries
let QRCodeLib;
if (Platform.OS === 'web') {
  QRCodeLib = require('qrcode');
} else {
  QRCodeLib = require('react-native-qrcode-svg').default;
}

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

  // Load saved QR on mount
  useEffect(() => {
    const loadQr = async () => {
      try {
        const savedQR = await AsyncStorage.getItem('VAS_QR_STRING');
        if (savedQR) {
          setQrString(savedQR);
          if (Platform.OS === 'web' && QRCodeLib) {
            const dataURL = await QRCodeLib.toDataURL(savedQR, {
              width: 160,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' }
            });
            setQrDataURL(dataURL);
          }
        }
      } catch (error) {
        console.error('Error loading QR:', error);
      }
    };
    loadQr();
  }, []);

  // Save QR image
  const handleDownload = async () => {
    try {
      setHideDownloadBtn(true);
      await new Promise(res => setTimeout(res, 100));

      if (Platform.OS === 'web') {
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
        const uri = await captureRef(standRef, { format: 'png', quality: 1 });
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Storage permission is required.');
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'QR Code saved to your gallery!');
      }
    } catch (error) {
      console.error('Save Error:', error);
      Alert.alert('Error', 'Failed to save image.');
    } finally {
      setHideDownloadBtn(false);
    }
  };

  // Share QR
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join vasbazaar and start earning cashback! Referral: ${qrString}`,
        title: 'Join vasbazaar',
      });
    } catch (error) {
      console.error('Share Error:', error);
    }
  };



  return (
    <View style={styles.container}>
      <CommonHeader2 heading="QR Print" />

      {/* Logo */}
      

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ height: SCREEN_HEIGHT * 0.5 }}
      >
        {/* QR Section */}
        <View 
          ref={standRef} 
          collapsable={false} 
          style={styles.qrCard} 
          id="stand-container"
        >
          <Text style={styles.cardSubtitle}>Scan to earn cashback on every transaction</Text>

        <View style={styles.logoContainer}>
        <Image source={vasbazaarLogo} style={styles.mainLogo} resizeMode="contain" />
      </View>
          <View style={styles.qrContainer}>
            {qrString ? (
              Platform.OS === 'web' ? (
                qrDataURL ? (
                  <Image source={{ uri: qrDataURL }} style={styles.qrCodeImage} />
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

          {/* User Info */}
          {(userData?.name || userData?.mobile) && (
            <View style={styles.userInfo}>
              {userData?.name && <Text style={styles.userName}>{userData.name}</Text>}
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
            <MaterialIcons name="share" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Share QR</Text>
          </TouchableOpacity>

          {!hideDownloadBtn && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
              <MaterialIcons name="download" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Save QR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Benefits */}
        <Card style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <MaterialIcons name="star" size={20} color="#FF9800" />
            <Text style={styles.benefitsTitle}>Why vasbazaar?</Text>
          </View>
          <View>
            <Text style={styles.benefitText}>✔ Instant cashback on payments</Text>
            <Text style={styles.benefitText}>✔ Secure & fast transactions</Text>
            <Text style={styles.benefitText}>✔ Zero hidden charges</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  logoContainer: { alignItems: 'center', paddingVertical: 16 },
  mainLogo: { width: 200, height: 80 },
  scrollContent: { padding: 16 },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  qrContainer: { padding: 20, backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 16 },
  qrCodeImage: { width: 160, height: 160 },
  loadingText: { fontSize: 16, color: '#666', textAlign: 'center', paddingVertical: 40 },
  userInfo: { alignItems: 'center', marginTop: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  phoneNumber: { marginLeft: 6, fontSize: 14, color: '#1976d2', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', backgroundColor: '#000', padding: 12, borderRadius: 25, alignItems: 'center', elevation: 2, marginVertical: 4 },
  actionBtnText: { marginLeft: 6, fontWeight: '600', fontSize: 14, color: '#fff' },
  benefitsCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  benefitsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  benefitsTitle: { fontWeight: 'bold', marginLeft: 8 },
  benefitText: { fontSize: 14, color: '#333', marginVertical: 2 },
});
