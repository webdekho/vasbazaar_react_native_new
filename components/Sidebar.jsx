// Sidebar.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
  View,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { getUserBalance } from '../services';
import { logout } from '../services/auth/sessionManager';
import { useAuth } from '../hooks/useAuth';
import { authEvents, AUTH_EVENTS } from '../services/auth/authEvents';
import ProfilePhotoViewer from './ProfilePhotoViewer';
import { shareReferralLink } from '../services/sharing/shareService';

/**
 * Enhanced sharing with multiple platform options
 * @param {Object} options - Sharing options
 * @param {string} options.message - Message to share
 * @param {string} options.title - Title for sharing
 * @param {string} options.url - URL to share
 */
const shareWithMultiplePlatforms = async (options) => {
  const { message, title = 'Share from VasBazaar', url } = options;
  
  try {
    if (Platform.OS === 'web' && navigator.share && navigator.canShare) {
      // Use Web Share API if available (works on mobile browsers)
      const shareData = {
        title: title,
        text: message,
        url: url
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log('✅ Successfully shared via Web Share API');
        return;
      }
    }
    
    // Fallback to existing WhatsApp sharing
    await shareReferralLink(url, options.userName);
    
  } catch (error) {
    console.error('💥 Error sharing:', error);
    // Final fallback
    await shareReferralLink(url, options.userName);
  }
};

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 78; // wrapper size including border
const AVATAR_IMAGE_SIZE = AVATAR_SIZE - 6; // inner image size (to allow border width)

export default function Sidebar({ visible, onClose, userInfo }) {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [slideAnim] = useState(new Animated.Value(-width * 0.85));

  // API / UI state
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [cashback, setCashback] = useState('0.00');
  const [incentive, setIncentive] = useState('0.00');
  const [referralBonus, setReferralBonus] = useState('0.00');
  const [qrString, setQrString] = useState('');
  const [userData, setUserData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  const serviceItems = [
    { id: 'home', title: 'Home', icon: 'home', route: '/(tabs)/home' },
    { id: 'wallet', title: 'Wallet', icon: 'account-balance-wallet', route: '/(tabs)/wallet', iconType: 'MaterialIcons' },
    { id: 'history', title: 'Transaction History', icon: 'history', route: '/(tabs)/history' },
    { id: 'profile', title: 'Profile', icon: 'person', route: '/(tabs)/profile', iconType: 'MaterialIcons' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications', route: '/main/NotificationScreen', iconType: 'MaterialIcons' },
    { id: 'complaints', title: 'Complaints', icon: 'warning', route: '/main/ComplaintScreen', iconType: 'MaterialIcons' },
    { id: 'help', title: 'Help & Support', icon: 'help', route: '/main/HelpScreen', iconType: 'MaterialIcons' },
  ];

  // --- Loaders ---
  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
        if (parsed?.mobile) {
          setQrString(`https://vasbazaar.webdekho.in?code=${parsed.mobile}`);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const storedPhoto = await AsyncStorage.getItem('profile_photo');
      if (storedPhoto) setProfilePhoto(storedPhoto);
    } catch (err) {
      console.error('Error loading profile photo:', err);
    }
  };

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) return;
      const response = await getUserBalance(sessionToken);
      if (response?.status === 'success' && response?.data) {
        const { balance: bal, cashback: cb, incentive: inc, referralBonus: rb } = response.data;
        setBalance(bal);
        setCashback(cb);
        setIncentive(inc);
        setReferralBonus(rb);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      loadUserData();
      loadProfilePhoto();
      fetchBalance();
    } else {
      Animated.timing(slideAnim, { toValue: -width * 0.85, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
  }, []);

  const defaultUserInfo = userInfo || userData || {
    name: 'User Name',
    phone: '+91 0000000000',
    avatar: profilePhoto ? { uri: profilePhoto } : require('@/assets/images/avatar.jpg'),
  };

  // --- Handlers ---
  const handleMenuItemPress = (item) => {
    onClose();
    setTimeout(() => router.push(item.route), 250);
  };

  const handleLogout = async () => {
    try {
      onClose();
      await AsyncStorage.multiRemove(['permanentToken', 'sessionToken', 'sessionExpiry']);
      if (refreshAuth) await refreshAuth();
      authEvents.emit(AUTH_EVENTS.LOGOUT);
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  const handleDownloadQR = () => {
    onClose();
    setTimeout(() => router.push('/main/QrPrintScreen'), 250);
  };

  const handleShareLink = async () => {
    if (!qrString) return Alert.alert('Error', 'Referral link not available.');
    try {
      const userName = userData?.name || defaultUserInfo.name;
      const message = `🎉 Hey! I'm using VasBazaar to earn cashback on every transaction. ${userName ? `Join me (${userName}) ` : 'Join me '}and start earning too! 💰\n\n🔗 Sign up here: ${qrString}\n\n✨ Get instant cashback on mobile recharges, bill payments & more!`;
      
      await shareWithMultiplePlatforms({
        message: message,
        title: 'Join VasBazaar - Earn Cashback!',
        url: qrString,
        userName: userName
      });
    } catch (err) {
      console.error('Error sharing referral:', err);
      Alert.alert('Error', 'Unable to share referral link. Please try again.');
    }
  };

  const handleProfilePhotoPress = () => {
    if (profilePhoto) setPhotoViewerVisible(true);
  };
  const handlePhotoViewerClose = () => setPhotoViewerVisible(false);

  // --- Render helpers ---
  const renderUserProfile = () => (
    <ThemedView style={styles.userProfileSection}>
      <ThemedView style={styles.userHeader}>
        <TouchableOpacity onPress={handleProfilePhotoPress} activeOpacity={0.8}>
          {/* Avatar wrapper ensures circle clipping on web & native */}
          <View style={styles.avatarWrapper}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatarImage}
                resizeMode="cover"
                accessible
                accessibilityLabel="Profile photo"
              />
            ) : (
              <View style={[styles.avatarImage, styles.userAvatarPlaceholder]}>
                <MaterialIcons name="person" size={36} color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <ThemedView style={styles.userTextInfo}>
          <ThemedText style={styles.userName}>{defaultUserInfo.name}</ThemedText>
          <ThemedText style={styles.userPhone}>
            +91 {defaultUserInfo.mobile || defaultUserInfo.phone?.replace('+91 ', '')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* QR */}
      <ThemedView style={styles.qrSection}>
        <ThemedView style={styles.qrContainer}>
          <ThemedView style={styles.qrCode}>
            {qrString ? (
              Platform.OS === 'web' ? (
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrString)}` }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
              ) : (
                <QRCode value={qrString} size={120} />
              )
            ) : (
              <ThemedView style={styles.qrPlaceholder}>
                <MaterialIcons name="qr-code" size={80} color="#000" />
                <ThemedText style={styles.loadingQRText}>Loading QR...</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.qrButtonsContainer}>
          <TouchableOpacity style={styles.qrButton} onPress={handleDownloadQR}>
            <MaterialIcons name="download" size={16} color="#000000" />
            <ThemedText style={styles.qrButtonText}>Download QR</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrButton} onPress={handleShareLink}>
            <MaterialIcons name="share" size={16} color="#000000" />
            <ThemedText style={styles.qrButtonText}>Share Link</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderWalletSection = () => (
    <ThemedView style={styles.walletSection}>
      <ThemedText style={styles.walletTitle}>My Wallet</ThemedText>
      {balanceLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <ThemedText style={styles.loadingText}>Loading wallet data...</ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.walletCardsContainer}>
          <ThemedView style={styles.walletCardRow}>
            <ThemedView style={styles.walletCard}>
              <ThemedView style={styles.walletCardIcon}>
                <MaterialIcons name="account-balance-wallet" size={22} color="#ffffff" />
              </ThemedView>
              <ThemedText style={styles.walletAmount}>₹{balance}</ThemedText>
              <ThemedText style={styles.walletLabel}>Wallet Balance</ThemedText>
            </ThemedView>

            <ThemedView style={styles.walletCard}>
              <ThemedView style={styles.walletCardIcon}>
                <MaterialIcons name="group" size={22} color="#ffffff" />
              </ThemedView>
              <ThemedText style={styles.walletAmount}>₹{referralBonus}</ThemedText>
              <ThemedText style={styles.walletLabel}>Referral Bonus</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.walletCardRow}>
            <ThemedView style={styles.walletCard}>
              <ThemedView style={styles.walletCardIcon}>
                <MaterialIcons name="card-giftcard" size={22} color="#ffffff" />
              </ThemedView>
              <ThemedText style={styles.walletAmount}>₹{cashback}</ThemedText>
              <ThemedText style={styles.walletLabel}>Lifetime Cashback</ThemedText>
            </ThemedView>

            <ThemedView style={styles.walletCard}>
              <ThemedView style={styles.walletCardIcon}>
                <MaterialIcons name="stars" size={22} color="#ffffff" />
              </ThemedView>
              <ThemedText style={styles.walletAmount}>₹{incentive}</ThemedText>
              <ThemedText style={styles.walletLabel}>Lifetime Incentive</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );

  const renderServiceMenuItem = (item) => {
    const IconComponent = item.iconType === 'MaterialIcons' ? MaterialIcons : FontAwesome;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.serviceMenuItem}
        onPress={() => handleMenuItemPress(item)}
        activeOpacity={0.8}
      >
        <ThemedView style={styles.serviceMenuIcon}>
          <IconComponent name={item.icon} size={20} color="#ffffff" />
        </ThemedView>
        <ThemedText style={styles.serviceMenuText}>{item.title}</ThemedText>
        <MaterialIcons name="chevron-right" size={20} color="#666666" />
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <ThemedView style={styles.overlay}>
        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
            {renderUserProfile()}
            {/* Quick actions omitted for brevity in this render - add if needed */}
            {renderWalletSection()}

            <ThemedView style={styles.servicesSection}>
              <ThemedText style={styles.servicesTitle}>Services</ThemedText>
              {serviceItems.map(renderServiceMenuItem)}

              <TouchableOpacity style={[styles.serviceMenuItem, { marginTop: 10 }]} onPress={handleClearCache} activeOpacity={0.8}>
                <ThemedView style={styles.serviceMenuIcon}>
                  <MaterialIcons name="delete" size={20} color="#ffffff" />
                </ThemedView>
                <ThemedText style={styles.serviceMenuText}>Clear Cache</ThemedText>
                <MaterialIcons name="chevron-right" size={20} color="#666666" />
              </TouchableOpacity>
            </ThemedView>

            {/* padding so last item isn't hidden behind bottom actions */}
            <View style={{ height: 28 }} />
          </ScrollView>

          <ThemedView style={styles.bottomActions}>
            <TouchableOpacity style={styles.logoutBottomButton} onPress={handleLogout} activeOpacity={0.8}>
              <MaterialIcons name="logout" size={20} color="#000000" />
              <ThemedText style={styles.logoutBottomText}>Logout</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Animated.View>

        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={onClose} />
      </ThemedView>

      <ProfilePhotoViewer visible={photoViewerVisible} onClose={handlePhotoViewerClose} imageUri={profilePhoto} userName={userData?.name || defaultUserInfo.name} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    position: 'relative',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  sidebarContainer: {
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: '#ffffff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  scrollView: { flex: 1 },

  // USER PROFILE
  userProfileSection: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 38,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'transparent',
  },

  // Avatar wrapper (important for circle clipping on web)
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    overflow: 'hidden', // crucial: clip child image to circle on web + native
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // elevation/shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },

  // Image fills the wrapper
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },

  userTextInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500',
  },

  // QR Section
  qrSection: { alignItems: 'center', marginBottom: 10, backgroundColor: 'transparent' },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCode: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  qrButtonsContainer: { flexDirection: 'row', gap: 12, backgroundColor: 'transparent' },
  qrButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginHorizontal: 6,
  },
  qrButtonText: { color: '#000000', fontWeight: '700', fontSize: 13 },

  // Wallet/Services etc. (kept mostly same)
  walletSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 15,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 14,
  },
  walletTitle: { fontSize: 20, fontWeight: '700', color: '#000000', marginBottom: 14, textAlign: 'center' },
  walletCardsContainer: { gap: 12 },
  walletCardRow: { flexDirection: 'row', gap: 12 },
  walletCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
  },
  walletCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletAmount: { fontSize: 16, fontWeight: '700', color: '#000000' },
  walletLabel: { fontSize: 11, color: '#666666', textAlign: 'center', fontWeight: '500' },

  servicesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 0,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 14,
  },
  servicesTitle: { fontSize: 20, fontWeight: '700', color: '#000000', marginBottom: 12, textAlign: 'center' },
  serviceMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceMenuText: { flex: 1, fontSize: 16, color: '#000000', fontWeight: '600' },

  bottomActions: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 10,
  },
  logoutBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
  },
  logoutBottomText: { fontSize: 16, color: '#000000', fontWeight: '700' },

  // Loading styles
  loadingContainer: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#666', marginTop: 12, fontWeight: '500' },
  loadingQRText: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' },
});
