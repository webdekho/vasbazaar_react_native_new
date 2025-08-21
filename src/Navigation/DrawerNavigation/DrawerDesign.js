import { AuthContext } from '../../context/AuthContext';
import { getRecords } from '../../Services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, useDrawerStatus } from '@react-navigation/drawer';
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View, Image, TouchableOpacity, Platform, Modal, Dimensions, Animated, PanResponder } from 'react-native';
import { ActivityIndicator, Button, Divider, List, Text, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';


function CustomDrawerContent(props) {
  const isDrawerOpen = useDrawerStatus() === 'open';
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const [photoZoomVisible, setPhotoZoomVisible] = useState(false);

  // const [data, setData] = useState(null);
  const authContext = useContext(AuthContext);
  const { userData,userToken } = authContext;
  const theme = useTheme();
  const [qrString, setQrString] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [cashback, setCashback] = useState('0.00');
  const [incentive, setIncentive] = useState('0.00');
  const [referal_bonus, setReferal_bonus] = useState('0.00');
  
  // Constants
  const PROFILE_PHOTO_KEY = 'profile_photo';
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Handle photo zoom
  const handlePhotoPress = () => {
    if (profilePhotoUrl) {
      setPhotoZoomVisible(true);
    }
  };
  // console.log("sesstion Token ",userToken)
  // const FetchUserData = async () => {
  //   const userDataString = await AsyncStorage.getItem('UserData');
  //   if (userDataString) {
  //     const userData = JSON.parse(userDataString);
  //     setData(userData);
  //   }
  // };

  // Load profile photo from AsyncStorage
  const loadProfilePhoto = useCallback(async () => {
    try {
      setIsPhotoLoading(true);
      const storedPhotoUrl = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
      
      if (storedPhotoUrl) {
        console.log('Profile photo loaded from storage:', storedPhotoUrl);
        setProfilePhotoUrl(storedPhotoUrl);
      } else {
        console.log('No profile photo found in storage, using default');
        setProfilePhotoUrl(null);
      }
    } catch (error) {
      console.error('Error loading profile photo from AsyncStorage:', error);
      setProfilePhotoUrl(null);
    } finally {
      setIsPhotoLoading(false);
    }
  }, []);

  // Listen for AsyncStorage changes (when profile photo is updated)
  const checkForPhotoUpdates = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const currentPhotoUrl = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
        if (currentPhotoUrl !== profilePhotoUrl) {
          setProfilePhotoUrl(currentPhotoUrl);
        }
      } catch (error) {
        console.error('Error checking for photo updates:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [profilePhotoUrl]);

  const handleShareLink = () => {
    if (!qrString) return;

    const message = `Turn your trasacting into earnings! Join vasbazaar today & get cashback on every spend. Sign up here: ${qrString}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed');
        }
      })
      .catch((err) => console.error('Failed to open WhatsApp:', err));
  };

  const getBalance = async () => {
      // setLoading(true);
      setBalanceLoading(true);
      try {
        const response = await getRecords({},userToken,'api/customer/user/getByUserId');  // Your API call
        console.log("Balance API OTP Response", response);
        if (response?.status === 'success') {
          const { balance, cashback, incentive, referralBonus } = response.data;
           if (balance != null && !isNaN(balance)) {
              setBalance(parseFloat(balance).toFixed(2));
            }

            if (cashback != null && !isNaN(cashback)) {
              setCashback(parseFloat(cashback).toFixed(2));
            }

            if (incentive != null && !isNaN(incentive)) {
              setIncentive(parseFloat(incentive).toFixed(2));
            }

            if (referralBonus != null && !isNaN(referralBonus)) {
              setReferal_bonus(parseFloat(referralBonus).toFixed(2));
            }
            

        } else {
          // setErrorMessage(response?.message || "Invalid OTP");
        }

      } catch (error) {
        console.error("OTP Verification Error", error);
        // setErrorMessage("Failed to verify OTP. Please try again later.");
      } finally {
        setBalanceLoading(false);
      }
};

  // Photo Zoom Modal Component with gestures
  const PhotoZoomModal = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    
    const lastScale = useRef(1);
    const lastTranslateX = useRef(0);
    const lastTranslateY = useRef(0);
    const initialDistance = useRef(null);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          translateX.setOffset(lastTranslateX.current);
          translateY.setOffset(lastTranslateY.current);
          translateX.setValue(0);
          translateY.setValue(0);
        },
        onPanResponderMove: (evt, gestureState) => {
          // Handle pinch-to-zoom
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            const touch1 = evt.nativeEvent.touches[0];
            const touch2 = evt.nativeEvent.touches[1];
            
            const distance = Math.sqrt(
              Math.pow(touch2.pageX - touch1.pageX, 2) + 
              Math.pow(touch2.pageY - touch1.pageY, 2)
            );
            
            if (!initialDistance.current) {
              initialDistance.current = distance;
            }
            
            const scaleValue = (distance / initialDistance.current) * lastScale.current;
            const boundedScale = Math.max(0.5, Math.min(scaleValue, 4));
            
            scale.setValue(boundedScale);
          } else {
            // Handle single finger pan
            translateX.setValue(gestureState.dx);
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: () => {
          if (initialDistance.current) {
            // Was pinch gesture
            lastScale.current = scale._value;
          } else {
            // Was pan gesture
            lastTranslateX.current += translateX._value;
            lastTranslateY.current += translateY._value;
          }
          
          translateX.flattenOffset();
          translateY.flattenOffset();
          
          // Reset if zoomed out too much
          if (lastScale.current < 0.8) {
            resetZoom();
          } else if (lastScale.current > 4) {
            lastScale.current = 4;
            Animated.spring(scale, {
              toValue: 4,
              useNativeDriver: true,
            }).start();
          }
          
          initialDistance.current = null;
        },
      })
    ).current;

    const resetZoom = () => {
      lastScale.current = 1;
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
      
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Double tap to zoom
    const handleDoubleTap = () => {
      if (lastScale.current === 1) {
        // Zoom in
        lastScale.current = 2;
        Animated.spring(scale, {
          toValue: 2,
          useNativeDriver: true,
        }).start();
      } else {
        // Reset zoom
        resetZoom();
      }
    };

    let lastTap = 0;
    const handleTap = () => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      
      if (now - lastTap < DOUBLE_PRESS_DELAY) {
        handleDoubleTap();
      }
      lastTap = now;
    };

    return (
      <Modal
        visible={photoZoomVisible}
        transparent={true}
        onRequestClose={() => setPhotoZoomVisible(false)}
        animationType="fade"
      >
        <View style={drawerStyles.photoZoomContainer}>
          <TouchableOpacity
            style={drawerStyles.photoZoomBackground}
            activeOpacity={1}
            onPress={() => setPhotoZoomVisible(false)}
          >
            {/* Close button */}
            <TouchableOpacity
              style={drawerStyles.closeButton}
              onPress={() => setPhotoZoomVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={drawerStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Zoomable photo container */}
            <View style={drawerStyles.photoZoomWrapper}>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={handleTap}
                {...panResponder.panHandlers}
                style={drawerStyles.photoContainer}
              >
                <Animated.Image
                  source={profilePhotoUrl ? { uri: profilePhotoUrl } : require('../../../assets/images/user.png')}
                  style={[
                    drawerStyles.zoomedPhoto,
                    {
                      transform: [
                        { scale: scale },
                        { translateX: translateX },
                        { translateY: translateY },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              {/* Instructions */}
              <View style={drawerStyles.instructionsContainer}>
                <Text style={drawerStyles.instructionsText}>
                  Double tap to zoom • Pinch to zoom • Drag to pan
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    // FetchUserData();

    const generateOrGetQR = async () => {
      const key = 'VAS_QR_STRING';
      const savedQR = await AsyncStorage.getItem(key);
      if (savedQR) {
        setQrString(savedQR);
        console.log("VAS_QR_STRING",savedQR)
      } else if (userData?.mobile) {
        const value = `https://vasbazaar.web.webdekho.in?code=${userData.mobile}`;
        console.log("VAS_QR_STRING",value)
        await AsyncStorage.setItem(key, value);
        setQrString(value);
      }
    };

    generateOrGetQR();
    loadProfilePhoto();
    
    if (isDrawerOpen) {
      getBalance(); // Call API when drawer is opened
      loadProfilePhoto(); // Refresh profile photo when drawer opens
    }

    console.log("QRSTRING",qrString)
    
  }, [userData, isDrawerOpen, loadProfilePhoto]);
  
  // Set up periodic check for photo updates
  useEffect(() => {
    const cleanup = checkForPhotoUpdates();
    return cleanup;
  }, [checkForPhotoUpdates]);


  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      
      {/* Header with User Info */}
      <View style={styles.headerContainer}>
        <View style={styles.userInfoRow}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePhotoPress}
            activeOpacity={0.8}
            disabled={!profilePhotoUrl}
          >
            {isPhotoLoading ? (
              <MaterialIcons name="account-circle" size={50} color="#000000ff" />
            ) : profilePhotoUrl ? (
              <Image
                style={styles.profileImage}
                source={{ uri: profilePhotoUrl }}
                onError={(error) => {
                  console.error('Error loading profile image:', error);
                  setProfilePhotoUrl(null);
                }}
                onLoad={() => {
                  console.log('Profile image loaded successfully');
                }}
              />
            ) : (
              <MaterialIcons name="account-circle" size={50} color="#000000ff" />
            )}
          </TouchableOpacity>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{userData?.name || 'User Name'}</Text>
            <Text style={styles.userPhone}>+91 {userData?.mobile || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <View style={styles.qrOuterBorder}>
          <View style={styles.qrMiddleBorder}>
            <View style={styles.qrInnerBorder}>
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
                <Text style={styles.loadingQRText}>Loading QR...</Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.qrButtonsContainer}>
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => props.navigation.navigate('QrPrint')}
          >
            <MaterialIcons name="download" size={20} color="#ffffff" />
            <Text style={styles.qrButtonText} numberOfLines={1}>Download QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={handleShareLink}
          >
            <MaterialIcons name="share" size={20} color="#ffffff" />
            <Text style={styles.qrButtonText} numberOfLines={1}>Share Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => props.navigation.navigate('Tabs', { screen: 'history' })}
        >
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="history" size={24} color="#000000ff" />
          </View>
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => props.navigation.navigate('Notification')}
        >
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="notifications" size={24} color="#000000ff" />
          </View>
          <Text style={styles.quickActionText}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => props.navigation.navigate('Help')}
        >
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="help-outline" size={24} color="#000000ff" />
          </View>
          <Text style={styles.quickActionText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Balance Cards */}
      <View style={styles.balanceSection}>
        <Text style={styles.sectionTitle}>My Wallet</Text>
        
        {balanceLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000ff" />
          </View>
        ) : (
          <View style={styles.balanceGrid}>
            <View style={styles.balanceCard}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#4CAF50" />
              <Text style={styles.balanceAmount}>₹{balance}</Text>
              <Text style={styles.balanceLabel}>Wallet</Text>
            </View>
            
            <View style={styles.balanceCard}>
              <MaterialIcons name="card-giftcard" size={20} color="#FF9800" />
              <Text style={styles.balanceAmount}>₹{cashback}</Text>
              <Text style={styles.balanceLabel}>Cashback</Text>
            </View>
            
            <View style={styles.balanceCard}>
              <MaterialIcons name="stars" size={20} color="#9C27B0" />
              <Text style={styles.balanceAmount}>₹{incentive}</Text>
              <Text style={styles.balanceLabel}>Incentive</Text>
            </View>
            
            <View style={styles.balanceCard}>
              <MaterialIcons name="group-add" size={20} color="#000000ff" />
              <Text style={styles.balanceAmount}>₹{referal_bonus}</Text>
              <Text style={styles.balanceLabel}>Referral</Text>
            </View>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Services</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Tabs', { screen: 'history' })}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="history" size={22} color="#666" />
          </View>
          <Text style={styles.menuItemText}>Transaction History</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Tabs', { screen: 'Profile' })}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="person" size={22} color="#666" />
          </View>
          <Text style={styles.menuItemText}>Profile</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Notification')}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="notifications" size={22} color="#666" />
          </View>
          <Text style={styles.menuItemText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Complaint')}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="report-problem" size={22} color="#666" />
          </View>
          <Text style={styles.menuItemText}>Complaints</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Help')}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="help-outline" size={22} color="#666" />
          </View>
          <Text style={styles.menuItemText}>Help & Support</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.bottomActionItem}
          onPress={async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }}
        >
          <MaterialIcons name="cleaning-services" size={20} color="#666" />
          <Text style={styles.bottomActionText}>Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.bottomActionItem, styles.logoutAction]}
          onPress={() => props.navigation.navigate('log_out')}
        >
          <MaterialIcons name="logout" size={20} color="#E53E3E" />
          <Text style={[styles.bottomActionText, { color: '#E53E3E' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Zoom Modal */}
      <PhotoZoomModal />
      
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    resizeMode: 'cover',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  qrOuterBorder: {
    padding: 6,
    borderRadius: 18,
    borderWidth: 5,
    borderColor: '#000000ff',
    marginBottom: 16,
  },
  qrMiddleBorder: {
    padding: 5,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#000',
    backgroundColor: '#000',
  },
  qrInnerBorder: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingQRText: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 53,
    paddingHorizontal: 20,
  },
  qrButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    gap: 12,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    minWidth: 120,
  },
  qrButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flexShrink: 0,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#e3e3e3',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#000000ff',
    fontWeight: '500',
  },
  balanceSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  balanceCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuSection: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bottomActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 'auto',
  },
  bottomActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutAction: {
    marginTop: 8,
  },
  bottomActionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
});

// Separate styles for zoom modal to avoid conflicts
const drawerStyles = {
  photoZoomContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoZoomBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoZoomWrapper: {
    position: 'relative',
    width: '90%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  zoomedPhoto: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.7,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    textAlign: 'center',
  },
};

export default CustomDrawerContent;
