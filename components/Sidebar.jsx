import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions, Image, View, ActivityIndicator, Alert, Linking, Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBalance } from '../services';
import QRCode from 'react-native-qrcode-svg';
import { logout } from '../services/auth/sessionManager';
import { useAuth } from '../app/hooks/useAuth';
import { authEvents, AUTH_EVENTS } from '../services/auth/authEvents';
import ProfilePhotoViewer from './ProfilePhotoViewer';
import { shareReferralLink } from '../services/sharing/shareService';

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose, userInfo }) {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [slideAnim] = useState(new Animated.Value(-width * 0.85));
  
  // State for API data
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
    {
      id: 'home',
      title: 'Home',
      icon: 'home',
      route: '/(tabs)/home'
    },
    {
      id: 'wallet',
      title: 'Wallet',
      icon: 'account-balance-wallet',
      route: '/(tabs)/wallet',
      iconType: 'MaterialIcons'
    },
    {
      id: 'history',
      title: 'Transaction History',
      icon: 'history',
      route: '/(tabs)/history'
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      route: '/(tabs)/profile',
      iconType: 'MaterialIcons'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      route: '/main/NotificationScreen',
      iconType: 'MaterialIcons'
    },
    {
      id: 'complaints',
      title: 'Complaints',
      icon: 'warning',
      route: '/main/ComplaintScreen',
      iconType: 'MaterialIcons'
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help',
      route: '/main/HelpScreen',
      iconType: 'MaterialIcons'
    }
  ];

  // Load user data from AsyncStorage
  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      const storedProfilePhoto = await AsyncStorage.getItem('profile_photo');
      
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
        
        // Generate QR string
        if (parsed?.mobile) {
          const qrValue = `https://vasbazaar.webdekho.in?code=${parsed.mobile}`;
          setQrString(qrValue);
        }
      }
      
      if (storedProfilePhoto) {
        setProfilePhoto(storedProfilePhoto);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  // Fetch balance data from API
  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      console.log('Fetching user balance from sidebar...');
      
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        console.log('No session token found');
        return;
      }

      const response = await getUserBalance(sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        const { balance: bal, cashback: cb, incentive: inc, referralBonus: rb } = response.data;
        setBalance(bal);
        setCashback(cb);
        setIncentive(inc);
        setReferralBonus(rb);
        console.log('Balance loaded successfully');
      } else {
        console.log('Failed to fetch balance:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };
  
  const defaultUserInfo = userInfo || userData || {
    name: 'User Name',
    phone: '+91 0000000000',
    avatar: profilePhoto ? { uri: profilePhoto } : require('@/assets/images/avatar.jpg')
  };

  // Animate sidebar and load data
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Load data when sidebar opens
      loadUserData();
      fetchBalance();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.85,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const handleMenuItemPress = (item) => {
    onClose();
    setTimeout(() => {
      router.push(item.route);
    }, 250);
  };

  const handleLogout = async () => {
    try {
      console.log('=== LOGOUT START ===');
      
      // Close sidebar immediately
      onClose();
      
      // Clear all authentication tokens
      await AsyncStorage.multiRemove([
        'permanentToken',
        'sessionToken', 
        'sessionExpiry'
      ]);
      console.log('✓ All auth tokens removed');
      
      // Force auth context to refresh with new state
      if (refreshAuth) {
        await refreshAuth();
        console.log('✓ Auth context refreshed');
      }
      
      // Emit logout event to clear any cached state
      authEvents.emit(AUTH_EVENTS.LOGOUT);
      
      // Let AuthGuard handle navigation naturally via auth state changes
      console.log('=== LOGOUT COMPLETE - AuthGuard will handle navigation ===');
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  const handleDownloadQR = () => {
    onClose();
    setTimeout(() => {
      router.push('/main/QrPrintScreen');
    }, 250);
  };

  const handleShareLink = async () => {
    if (!qrString) {
      Alert.alert('Error', 'Referral link not available.');
      return;
    }

    try {
      const userName = userData?.name || defaultUserInfo.name;
      await shareReferralLink(qrString, userName);
    } catch (error) {
      console.error('Error sharing referral:', error);
      Alert.alert('Error', 'Unable to share referral link. Please try again.');
    }
  };

  const handleProfilePhotoPress = () => {
    if (profilePhoto) {
      setPhotoViewerVisible(true);
    }
  };

  const handlePhotoViewerClose = () => {
    setPhotoViewerVisible(false);
  };

  const renderUserProfile = () => (
    <ThemedView style={styles.userProfileSection}>
      <ThemedView style={styles.userHeader}>
        <TouchableOpacity onPress={handleProfilePhotoPress} disabled={!profilePhoto}>
          {profilePhoto ? (
            <Image 
              source={{ uri: profilePhoto }} 
              style={styles.userAvatar}
            />
          ) : (
            <ThemedView style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
              <MaterialIcons name="person" size={36} color="#FFFFFF" />
            </ThemedView>
          )}
        </TouchableOpacity>
        <ThemedView style={styles.userTextInfo}>
          <ThemedText style={styles.userName}>
            {defaultUserInfo.name}
          </ThemedText>
          <ThemedText style={styles.userPhone}>
            +91 {defaultUserInfo.mobile || defaultUserInfo.phone?.replace('+91 ', '')}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* QR Code Section */}
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
                <MaterialIcons name="qr-code" size={120} color="#000" />
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

  const renderQuickActions = () => null;

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
        activeOpacity={0.7}
      >
        <ThemedView style={styles.serviceMenuIcon}>
          <IconComponent
            name={item.icon}
            size={20}
            color="#ffffff"
          />
        </ThemedView>
        <ThemedText style={styles.serviceMenuText}>
          {item.title}
        </ThemedText>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color="#666666"
        />
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView style={styles.overlay}>
        <Animated.View style={[
          styles.sidebarContainer,
          { 
            transform: [{ translateX: slideAnim }],
            backgroundColor: '#ffffff'
          }
        ]}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* User Profile and QR Section */}
            {renderUserProfile()}

            {/* Quick Actions Row */}
            {renderQuickActions()}

            {/* My Wallet Section */}
            {renderWalletSection()}

            {/* Services Section */}
            <ThemedView style={styles.servicesSection}>
              <ThemedText style={styles.servicesTitle}>Services</ThemedText>
              {serviceItems.map(renderServiceMenuItem)}
            </ThemedView>
          </ScrollView>

          {/* Bottom Actions */}
          <ThemedView style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.bottomActionButton} 
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete" size={20} color="#000000" />
              <ThemedText style={styles.bottomActionText}>Clear Cache</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutBottomButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialIcons name="logout" size={20} color="#000000" />
              <ThemedText style={styles.logoutBottomText}>Logout</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Animated.View>
        
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </ThemedView>

      {/* Profile Photo Viewer */}
      <ProfilePhotoViewer
        visible={photoViewerVisible}
        onClose={handlePhotoViewerClose}
        imageUri={profilePhoto}
        userName={userData?.name || defaultUserInfo.name}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    maxWidth: 350,
    backgroundColor: '#ffffff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // User Profile Section
  userProfileSection: {
    backgroundColor: '#000000',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // QR Code Section
  qrSection: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  qrCode: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  qrButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  qrButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
  
  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Wallet Section
  walletSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 15,
  },
  walletTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  walletCardsContainer: {
    gap: 12,
  },
  walletCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletCardIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  walletAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  walletLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Services Section
  servicesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 0,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 15,
  },
  servicesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  serviceMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 2,
    borderRadius: 15,
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
    marginRight: 15,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceMenuText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  
  // Bottom Actions
  bottomActions: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 10,
  },
  bottomActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bottomActionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  logoutBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 15,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000000',
  },
  logoutBottomText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
  },
  
  // Loading styles
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  loadingQRText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});