import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from '../../../Services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { Alert, Platform, ScrollView, View, Modal, TouchableOpacity, Image, Dimensions, Animated, PanResponder } from 'react-native';
import { BASE_URL } from '../../../Services/Base_Url';

import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Dialog,
  List,
  Portal,
  Snackbar,
  Text
} from 'react-native-paper';

const Profile = () => {
  const authContext = useContext(AuthContext);
  const { userToken } = authContext;

  // State management
  const [photo, setPhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [displayCount, setDisplayCount] = useState(3);
  const [photoZoomVisible, setPhotoZoomVisible] = useState(false);

  // Constants
  const ITEMS_PER_PAGE = 10;
  const PROFILE_PHOTO_KEY = 'profile_photo';
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Handle photo zoom
  const handlePhotoPress = () => {
    if (photo) {
      setPhotoZoomVisible(true);
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
        <View style={styles.photoZoomContainer}>
          <TouchableOpacity
            style={styles.photoZoomBackground}
            activeOpacity={1}
            onPress={() => setPhotoZoomVisible(false)}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPhotoZoomVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Zoomable photo container */}
            <View style={styles.photoZoomWrapper}>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={handleTap}
                {...panResponder.panHandlers}
                style={styles.photoContainer}
              >
                <Animated.Image
                  source={photo ? { uri: photo } : require('../../../../assets/images/user.png')}
                  style={[
                    styles.zoomedPhoto,
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
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  Double tap to zoom • Pinch to zoom • Drag to pan
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // Load profile photo from AsyncStorage
  const loadProfilePhotoFromStorage = useCallback(async () => {
    try {
      const storedPhotoUrl = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
      if (storedPhotoUrl) {
        console.log('Loaded profile photo URL from storage:', storedPhotoUrl);
        setProfilePhotoUrl(storedPhotoUrl);
        setPhoto(storedPhotoUrl); // Set as display photo
      } else {
        console.log('No profile photo found in storage');
      }
    } catch (error) {
      console.error('Error loading profile photo from AsyncStorage:', error);
    }
  }, []);

  // Save profile photo URL to AsyncStorage
  const saveProfilePhotoToStorage = async (photoUrl) => {
    try {
      await AsyncStorage.setItem(PROFILE_PHOTO_KEY, photoUrl);
      console.log('Profile photo URL saved to storage:', photoUrl);
    } catch (error) {
      console.error('Error saving profile photo to AsyncStorage:', error);
    }
  };

  // Clear profile photo from AsyncStorage
  const clearProfilePhotoFromStorage = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
      console.log('Profile photo URL cleared from storage');
    } catch (error) {
      console.error('Error clearing profile photo from AsyncStorage:', error);
    }
  };

  // Fetch referrals with proper error handling
  const fetchReferrals = useCallback(async () => {
    if (!userToken) return;

    try {
      setLoading(true);
      const response = await getRecords(
        { 
          pageNumber: page, 
          pageSize: ITEMS_PER_PAGE, 
          isactive: 1 
        },
        userToken,
        'api/customer/user/getReffered_user'
      );

      if (response?.status === "success") {
        const { records = [], totalRecords: total = 0 } = response.data || {};
        setReferrals(prev => page === 0 ? records : [...prev, ...records]);
        setTotalRecords(total);
      } else {
        throw new Error(response?.message || 'Failed to fetch referrals');
      }
    } catch (error) {
      console.error('Fetch referrals error:', error);
      showSnackbar('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [page, userToken]);

  // Show snackbar helper
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Get MIME type helper
  const getMimeType = (fileExtension) => {
    const ext = fileExtension.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg'; // Default to JPEG
    }
  };

  // Fix iOS file URI
  const fixIOSUri = (uri) => {
    if (Platform.OS === 'ios') {
      // Handle different iOS URI formats
      if (uri.startsWith('ph://')) {
        // Photo library URI - needs special handling
        return uri;
      } else if (uri.startsWith('assets-library://')) {
        // Legacy format
        return uri;
      } else if (uri.startsWith('file:///')) {
        // Already has file protocol
        return uri;
      } else if (uri.startsWith('file://')) {
        // Missing one slash
        return uri.replace('file://', 'file:///');
      } else if (uri.startsWith('/')) {
        // Absolute path without protocol
        return `file://${uri}`;
      }
    }
    return uri;
  };

  // Clean and generate proper filename
  const generateCleanFilename = (originalUri, mimeType) => {
    try {
      // Extract original filename from URI
      let originalName = originalUri.split('/').pop() || '';
      
      // Remove query parameters and invalid characters
      originalName = originalName.split('?')[0].split('#')[0];
      
      // Remove any base64 data or special characters
      originalName = originalName.replace(/[^a-zA-Z0-9._-]/g, '');
      
      // Get proper extension from MIME type
      let extension = 'jpg'; // default
      if (mimeType === 'image/png') extension = 'png';
      else if (mimeType === 'image/gif') extension = 'gif';
      else if (mimeType === 'image/webp') extension = 'webp';
      else if (mimeType === 'image/jpeg') extension = 'jpg';
      
      // Generate clean filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const cleanFilename = `profile_${timestamp}_${randomId}.${extension}`;
      
      console.log('Original URI:', originalUri);
      console.log('Generated filename:', cleanFilename);
      console.log('MIME type:', mimeType);
      
      return cleanFilename;
    } catch (error) {
      console.error('Error generating filename:', error);
      return `profile_${Date.now()}.jpg`;
    }
  };

  // Get image info and determine MIME type
  const getImageInfo = async (imageUri) => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll determine from the blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return {
          mimeType: blob.type || 'image/jpeg',
          size: blob.size
        };
      } else {
        // For mobile, try to get info from file system
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        
        // Determine MIME type from URI or default to JPEG
        let mimeType = 'image/jpeg';
        if (imageUri.toLowerCase().includes('.png')) mimeType = 'image/png';
        else if (imageUri.toLowerCase().includes('.gif')) mimeType = 'image/gif';
        else if (imageUri.toLowerCase().includes('.webp')) mimeType = 'image/webp';
        
        return {
          mimeType,
          size: fileInfo.size || 0
        };
      }
    } catch (error) {
      console.error('Error getting image info:', error);
      return {
        mimeType: 'image/jpeg',
        size: 0
      };
    }
  };

  // Pick and upload profile photo with proper filename handling
  const pickAndUploadProfilePhoto = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      setUploadLoading(true);
      console.log(`📸 Starting photo upload attempt ${retryCount + 1}/${maxRetries + 1}`);

      // Request permissions - Android needs special handling
      if (Platform.OS === 'android') {
        const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission Required', 
            'Please allow access to photos to upload your profile picture. You may need to enable this in your device settings.'
          );
          return;
        }
      } else {
        // iOS permission handling
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            'Permission Required', 
            'Please allow access to photos to upload your profile picture.'
          );
          return;
        }
      }

      // Platform-specific image picker configuration
      let imagePickerOptions = {
        quality: 0.8,
        base64: Platform.OS === 'web', // Only get base64 on web
      };

      // Configure platform-specific options
      if (Platform.OS === 'web') {
        // Web configuration - no cropping to avoid errors
        imagePickerOptions = {
          ...imagePickerOptions,
          allowsEditing: false, // Disable editing/cropping on web
          quality: 0.9, // Higher quality for web since no cropping
          base64: true,
        };
        console.log('Web platform: Cropping disabled, using direct upload');
      } else {
        // Mobile platforms (iOS & Android) - enable cropping
        imagePickerOptions = {
          ...imagePickerOptions,
          allowsEditing: true, // Enable cropping on mobile
          aspect: [1, 1], // Square aspect ratio for profile photos
          quality: 0.8,
          base64: false, // Use URI on mobile
        };
        console.log(`${Platform.OS} platform: Cropping enabled with square aspect ratio`);
      }

      // Debug log to check available options
      console.log('ImagePicker available options:', {
        MediaTypeOptions: ImagePicker.MediaTypeOptions,
        MediaType: ImagePicker.MediaType,
        platform: Platform.OS,
        cropEnabled: imagePickerOptions.allowsEditing
      });

      // Handle mediaTypes based on what's available
      if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images !== undefined) {
        imagePickerOptions.mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else if (ImagePicker.MediaType && ImagePicker.MediaType.IMAGES !== undefined) {
        imagePickerOptions.mediaTypes = ImagePicker.MediaType.IMAGES;
      } else {
        // Fallback - don't set mediaTypes, let it use default (Images)
        console.log('Using default mediaTypes for ImagePicker');
      }

      // Launch image picker with platform-specific options
      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      } catch (pickerError) {
        console.error('Image picker launch error:', pickerError);
        
        // Handle platform-specific picker errors
        let errorMessage = 'Failed to open image picker';
        let errorCategory = 'Image Picker Error';
        
        if (Platform.OS === 'web') {
          errorMessage = 'Unable to access image picker on web browser. Please ensure your browser supports file selection.';
        } else if (Platform.OS === 'android') {
          errorMessage = 'Unable to access image picker on Android. Please check app permissions.';
        } else if (Platform.OS === 'ios') {
          errorMessage = 'Unable to access image picker on iOS. Please check app permissions.';
        }
        
        Alert.alert(
          errorCategory,
          `${errorMessage}\n\n💡 What to do:\nPlease check your device permissions and try again.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Handle cancellation
      if (result.canceled) {
        console.log('Image selection cancelled by user');
        return;
      }

      // Validate result structure
      if (!result.assets || result.assets.length === 0) {
        throw new Error('No image assets found in picker result');
      }

      const image = result.assets[0];
      if (!image?.uri) {
        throw new Error('Invalid image selected - no URI found');
      }

      // Platform-specific validation and processing
      console.log('Selected image details:', {
        platform: Platform.OS,
        uri: image.uri.substring(0, 50) + '...',
        width: image.width || 'unknown',
        height: image.height || 'unknown',
        cropped: imagePickerOptions.allowsEditing && (image.width === image.height),
        fileSize: image.fileSize || 'unknown'
      });

      // Validate image dimensions if cropping was enabled
      if (Platform.OS !== 'web' && imagePickerOptions.allowsEditing) {
        if (image.width && image.height && Math.abs(image.width - image.height) > 50) {
          console.warn('Image may not be properly cropped to square aspect ratio');
        }
      }

      // Additional validation for web platform
      if (Platform.OS === 'web' && !image.base64 && !image.uri.startsWith('blob:')) {
        console.warn('Web image does not have expected format (base64 or blob)');
      }

      // Immediately update local photo for instant feedback
      setPhoto(image.uri);

      // Get proper image info
      const imageInfo = await getImageInfo(image.uri);
      
      // Generate clean filename
      const cleanFilename = generateCleanFilename(image.uri, imageInfo.mimeType);

      // Create FormData - platform specific approach
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Web platform handling
        try {
          if (image.base64) {
            // Convert base64 to blob for web
            const byteCharacters = atob(image.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: imageInfo.mimeType });
            
            // Create File object from blob
            const file = new File([blob], cleanFilename, { 
              type: imageInfo.mimeType,
              lastModified: Date.now()
            });
            
            formData.append('photo', file);
          } else {
            // Fallback: fetch blob from URI
            const response = await fetch(image.uri);
            const blob = await response.blob();
            const file = new File([blob], cleanFilename, { 
              type: imageInfo.mimeType,
              lastModified: Date.now()
            });
            formData.append('photo', file);
          }
        } catch (webError) {
          console.error('Web upload preparation error:', webError);
          throw new Error('Failed to prepare image for upload');
        }
      } else if (Platform.OS === 'ios') {
        // iOS specific handling
        const fixedUri = fixIOSUri(image.uri);
        formData.append('photo', {
          uri: fixedUri,
          type: imageInfo.mimeType || 'image/jpeg',
          name: cleanFilename,
        });
      } else if (Platform.OS === 'android') {
        // Android specific handling
        // Ensure proper file URI format for Android
        const androidUri = image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`;
        
        formData.append('photo', {
          uri: androidUri,
          type: imageInfo.mimeType || 'image/jpeg',
          name: cleanFilename,
          fileName: cleanFilename, // Some APIs expect fileName instead of name
        });
        
        console.log('Android FormData photo:', {
          uri: androidUri,
          type: imageInfo.mimeType || 'image/jpeg',
          name: cleanFilename,
        });
      }

      console.log('Platform:', Platform.OS);
      console.log('Uploading file:', cleanFilename);
      console.log('MIME type:', imageInfo.mimeType);
      
      // Show progress indicator to user
      console.log('🚀 Starting upload process...');

      // Upload to server with platform-specific configuration
      let response;
      
      if (Platform.OS === 'web') {
        // Web upload configuration
        try {
          console.log('Starting web upload...');
          response = await axios.put(
            `${BASE_URL}/api/customer/user/updateProfile`,
            formData,
            {
              headers: {
                'access_token': userToken,
                'Accept': 'application/json',
                // Let browser set Content-Type with boundary
              },
              timeout: 60000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              validateStatus: (status) => status < 500, // Accept 4xx errors to handle them properly
            }
          );
          
          console.log('Web upload response status:', response.status);
          if (response.status >= 400) {
            throw new Error(`Server returned status ${response.status}: ${response.data?.message || 'Unknown error'}`);
          }
        } catch (webUploadError) {
          console.error('Web upload with axios failed:', webUploadError);
          throw webUploadError;
        }
      } else {
        // Mobile upload configuration (iOS & Android)
        console.log('Upload URL:', `${BASE_URL}/api/customer/user/updateProfile`);
        console.log('Original image URI:', image.uri);
        
        // For Android, we need a completely different approach
        if (Platform.OS === 'android') {
          try {
            // Method 1: Using fetch API which often works better on Android
            const uploadUrl = `${BASE_URL}/api/customer/user/updateProfile`;
            
            // Create form data with proper structure
            const formData = new FormData();
            
            // Android requires specific file URI format
            const fileUri = Platform.select({
              android: image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`,
              default: image.uri,
            });
            
            formData.append('photo', {
              uri: fileUri,
              type: 'image/jpeg',
              name: cleanFilename,
            });
            
            console.log('Attempting fetch upload for Android...');
            
            const fetchResponse = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'access_token': userToken,
                'Accept': 'application/json',
                // Don't set Content-Type, let fetch handle it
              },
              body: formData,
            });
            
            if (!fetchResponse.ok) {
              throw new Error(`HTTP error! status: ${fetchResponse.status}`);
            }
            
            const responseData = await fetchResponse.json();
            response = { data: responseData };
            
          } catch (fetchError) {
            console.error('Fetch upload failed:', fetchError);
            
            // Method 2: Try with XMLHttpRequest as last resort
            try {
              response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                
                formData.append('photo', {
                  uri: image.uri,
                  type: 'image/jpeg',
                  name: cleanFilename,
                });
                
                xhr.open('PUT', `${BASE_URL}/api/customer/user/updateProfile`);
                xhr.setRequestHeader('access_token', userToken);
                xhr.setRequestHeader('Accept', 'application/json');
                
                xhr.onload = () => {
                  if (xhr.status === 200) {
                    try {
                      const data = JSON.parse(xhr.responseText);
                      resolve({ data });
                    } catch (e) {
                      reject(new Error('Invalid JSON response'));
                    }
                  } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                  }
                };
                
                xhr.onerror = () => reject(new Error('Network request failed'));
                xhr.ontimeout = () => reject(new Error('Request timeout'));
                xhr.timeout = 60000;
                
                xhr.send(formData);
              });
            } catch (xhrError) {
              console.error('XHR upload failed:', xhrError);
              throw new Error('All upload methods failed. Please check your network connection.');
            }
          }
        } else {
          // iOS upload using axios (usually works fine)
          try {
            const uploadConfig = {
              headers: {
                'access_token': userToken,
                'Accept': 'application/json',
              },
              timeout: 60000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              validateStatus: (status) => status < 500, // Accept 4xx errors to handle them properly
            };
            
            console.log('Starting iOS upload with axios...');
            response = await axios.put(
              `${BASE_URL}/api/customer/user/updateProfile`,
              formData,
              uploadConfig
            );
            
            console.log('iOS upload response status:', response.status);
            if (response.status >= 400) {
              throw new Error(`Server returned status ${response.status}: ${response.data?.message || 'Unknown error'}`);
            }
          } catch (iosUploadError) {
            console.error('iOS upload with axios failed:', iosUploadError);
            throw iosUploadError;
          }
        }
      }

      // Handle response with better validation
      console.log('Upload completed, processing response...');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server - no data received');
      }
      
      const { data } = response;
      const message = data?.message || 'Profile photo updated successfully';
      
      // Check for success status - handle different response formats
      const isSuccess = data?.Status === 'SUCCESS' || 
                       data?.status === 'SUCCESS' || 
                       data?.success === true ||
                       (response.status >= 200 && response.status < 300);
                       
      console.log('Upload success status:', isSuccess);
      
      if (isSuccess) {
        // Extract the uploaded photo URL from response
        let uploadedPhotoUrl = null;
        
        // Check various possible response structures for the photo URL
        if (data?.data?.profile_photo) {
          uploadedPhotoUrl = data.data.profile_photo;
        } else if (data?.profile_photo) {
          uploadedPhotoUrl = data.profile_photo;
        } else if (data?.photo_url) {
          uploadedPhotoUrl = data.photo_url;
        } else if (data?.data) {
          uploadedPhotoUrl = data?.data;
        } else if (data?.user?.profile_photo) {
          uploadedPhotoUrl = data.user.profile_photo;
        }

        console.log('Upload response data:', data);
        console.log('Extracted photo URL:', uploadedPhotoUrl);

        if (uploadedPhotoUrl) {
          // Save the uploaded photo URL to AsyncStorage
          await saveProfilePhotoToStorage(uploadedPhotoUrl);
          
          // Update state with the server URL
          setProfilePhotoUrl(uploadedPhotoUrl);
          setPhoto(uploadedPhotoUrl);
          
          console.log('✅ Profile photo upload successful!');
          showSnackbar(message);
        } else {
          // Critical issue: Server says success but no photo URL returned
          console.error('❌ Server response indicates success but no photo URL found!');
          console.error('Response data structure:', data);
          
          // Keep the local image for now but show warning
          showSnackbar('Upload completed, but photo URL not received. Please try again if photo doesn\'t appear.');
          
          // You might want to throw an error here instead to force a retry
          // throw new Error('Upload succeeded but no photo URL returned from server');
        }
      } else {
        // Reset to previous photo on failure
        setPhoto(profilePhotoUrl);
        
        // Better error message based on response data
        const errorMsg = data?.message || data?.error || `Upload failed with status: ${response.status}`;
        console.error('Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        platform: Platform.OS,
      });
      
      // Reset to previous photo on error
      setPhoto(profilePhotoUrl);
      
      // Categorize and format error messages for better user experience
      const getDetailedErrorInfo = (error) => {
        let category = 'Unknown Error';
        let title = 'Photo Upload Failed';
        let message = 'An unexpected error occurred while uploading your photo.';
        let technicalDetails = '';
        let userAction = 'Please try again or contact support if the problem persists.';
        
        // Network-related errors
        if (error.request && !error.response) {
          category = 'Network Issue';
          title = 'Connection Problem';
          message = 'Unable to connect to the server. Please check your internet connection.';
          userAction = 'Verify your internet connection and try again.';
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          category = 'Network Issue';
          title = 'Upload Timeout';
          message = 'The upload took too long to complete. This might be due to a slow internet connection or a large file size.';
          userAction = 'Try using a smaller image or check your internet connection.';
        } else if (error.message.includes('Network') || error.message.includes('ERR_NETWORK')) {
          category = 'Network Issue';
          title = 'Network Error';
          message = 'A network error occurred during upload.';
          userAction = 'Please check your internet connection and try again.';
        }
        
        // Server errors
        else if (error.response) {
          const status = error.response.status;
          const serverMessage = error.response.data?.message || error.response.data?.error;
          
          if (status >= 500) {
            category = 'Server Error';
            title = 'Server Problem';
            message = 'The server is experiencing issues and cannot process your upload right now.';
            technicalDetails = serverMessage ? `Server response: ${serverMessage}` : `HTTP ${status} error`;
            userAction = 'Please try again later or contact support.';
          } else if (status === 413) {
            category = 'Invalid File Type';
            title = 'File Too Large';
            message = 'The image file you selected is too large to upload.';
            userAction = 'Please select a smaller image or compress the current one.';
          } else if (status === 415) {
            category = 'Invalid File Type';
            title = 'Unsupported File Format';
            message = 'The file format is not supported. Please use JPEG, PNG, or other common image formats.';
            userAction = 'Convert your image to JPEG or PNG format and try again.';
          } else if (status === 400) {
            category = 'Invalid File Type';
            title = 'Invalid Upload Request';
            message = serverMessage || 'The upload request is invalid or the file format is not supported.';
            userAction = 'Please select a valid image file and try again.';
          } else if (status === 401 || status === 403) {
            category = 'Server Error';
            title = 'Authentication Issue';
            message = 'Your session has expired or you don\'t have permission to upload photos.';
            userAction = 'Please log out and log back in, then try again.';
          } else {
            category = 'Server Error';
            title = 'Server Error';
            message = serverMessage || `The server returned an error (${status}).`;
            technicalDetails = serverMessage || `HTTP ${status} error`;
            userAction = 'Please try again or contact support.';
          }
        }
        
        // File system errors
        else if (error.message.includes('ENOENT') || error.message.includes('file not found')) {
          category = 'Invalid File Type';
          title = 'File Not Found';
          message = 'The selected image file could not be found or accessed.';
          userAction = 'Please select a different image from your gallery.';
        } else if (error.message.includes('permission') || error.message.includes('Permission')) {
          category = 'Invalid File Type';
          title = 'Permission Denied';
          message = 'Unable to access the selected image due to permission restrictions.';
          userAction = 'Please check app permissions and try selecting a different image.';
        }
        
        // Image picker and cropping errors
        else if (error.message.includes('No image assets found') || error.message.includes('Invalid image selected')) {
          category = 'Invalid File Type';
          title = 'Image Selection Failed';
          message = 'The image picker did not return a valid image.';
          userAction = 'Please try selecting a different image from your gallery.';
        }
        
        // Platform-specific errors
        else if (Platform.OS === 'web') {
          if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            category = 'Network Issue';
            title = 'Browser Security Issue';
            message = 'A browser security policy is blocking the upload.';
            technicalDetails = 'CORS or mixed content policy violation';
            userAction = 'Try refreshing the page or using a different browser.';
          } else if (error.message.includes('Failed to prepare image')) {
            category = 'Invalid File Type';
            title = 'Image Processing Failed';
            message = 'The selected image could not be processed for upload. Web platform does not support image cropping.';
            userAction = 'Please select a different image. For best results, use a square image that doesn\'t require cropping.';
          } else if (error.message.includes('cropping') || error.message.includes('editing')) {
            category = 'Invalid File Type';
            title = 'Cropping Not Supported';
            message = 'Image cropping is not available on web browsers for security reasons.';
            technicalDetails = 'Web platform limitation - cropping disabled';
            userAction = 'Please use a pre-cropped square image or edit your image before uploading.';
          }
        } else if (Platform.OS === 'ios') {
          if (error.message.includes('NSURLErrorDomain') || error.message.includes('NSURLError')) {
            category = 'Network Issue';
            title = 'iOS Network Error';
            message = 'A network error occurred on your iOS device.';
            userAction = 'Check your network settings and try again.';
          } else if (error.message.includes('cropping') || error.message.includes('editing')) {
            category = 'Invalid File Type';
            title = 'iOS Cropping Issue';
            message = 'The image cropping feature encountered an issue on iOS.';
            userAction = 'Try selecting the image again and crop it to a square shape.';
          }
        } else if (Platform.OS === 'android') {
          if (error.message.includes('All upload methods failed')) {
            category = 'Network Issue';
            title = 'Android Upload Failed';
            message = 'Multiple upload methods failed on your Android device.';
            userAction = 'Check your network connection and app permissions.';
          } else if (error.message.includes('cropping') || error.message.includes('editing')) {
            category = 'Invalid File Type';
            title = 'Android Cropping Issue';
            message = 'The image cropping feature encountered an issue on Android.';
            userAction = 'Try selecting the image again and use the crop tool to make it square.';
          }
        }
        
        // Generic error fallback
        if (error.message && category === 'Unknown Error') {
          message = error.message;
          technicalDetails = `Error code: ${error.code || 'N/A'}`;
        }
        
        return { category, title, message, technicalDetails, userAction };
      };
      
      const errorInfo = getDetailedErrorInfo(error);
      
      // Format the complete error message
      let fullMessage = errorInfo.message;
      if (errorInfo.technicalDetails) {
        fullMessage += `\n\n📋 Technical Details:\n${errorInfo.technicalDetails}`;
      }
      fullMessage += `\n\n💡 What to do:\n${errorInfo.userAction}`;
      fullMessage += `\n\n🔧 Error Category: ${errorInfo.category}`;
      
      // Show detailed error popup with retry logic
      const buttons = [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        }
      ];
      
      // Add retry button if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        buttons.push({
          text: `Retry (${maxRetries - retryCount} left)`, 
          onPress: () => pickAndUploadProfilePhoto(retryCount + 1),
          style: 'default'
        });
      } else {
        buttons.push({
          text: 'Try Again', 
          onPress: () => pickAndUploadProfilePhoto(0), // Reset retry count
          style: 'default'
        });
      }
      
      Alert.alert(
        errorInfo.title,
        fullMessage,
        buttons,
        { cancelable: true }
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // Remove profile photo
  const removeProfilePhoto = async () => {
    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearProfilePhotoFromStorage();
            setPhoto(null);
            setProfilePhotoUrl(null);
            showSnackbar('Profile photo removed');
          },
        },
      ]
    );
  };

  // Load more referrals
  const loadMoreReferrals = () => {
    if (referrals.length < totalRecords && !loading) {
      setPage(prev => prev + 1);
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    }
  };

  // Reset referrals to initial state
  const resetReferrals = () => {
    setPage(0);
    setDisplayCount(ITEMS_PER_PAGE);
    setReferrals([]);
  };

  // Effect to load profile photo when component mounts
  useEffect(() => {
    loadProfilePhotoFromStorage();
  }, [loadProfilePhotoFromStorage]);

  // Effect to fetch referrals when page changes
  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Styles
  const styles = {
    container: {
      padding: 16,
      backgroundColor: '#fff',
    },
    card: {
      marginBottom: 16,
      backgroundColor: '#fff',
      elevation: 2,
    },
    textColor: {
      color: '#000',
    },
    iconColor: '#000',
    profileContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    changePhotoButton: {
      marginTop: 15,
      borderColor: '#000',
    },
    removePhotoButton: {
      marginTop: 10,
      borderColor: '#ff4444',
    },
    buttonLabel: {
      color: '#000',
    },
    removeButtonLabel: {
      color: '#ff4444',
    },
    noRecordText: {
      textAlign: 'center',
      marginVertical: 20,
      color: '#666',
      fontStyle: 'italic',
    },
    loadingContainer: {
      marginVertical: 15,
    },
    noMoreText: {
      textAlign: 'center',
      marginTop: 15,
      color: '#666',
      fontSize: 12,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    photoButtonsContainer: {
      alignItems: 'center',
    },
    platformHelpText: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
      marginTop: 8,
      marginHorizontal: 20,
      fontStyle: 'italic',
    },
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
      top: 20,
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
      width: screenWidth * 0.9,
      height: screenHeight * 0.7,
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

  return (
    <>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <Card style={styles.card}>
          <Card.Title 
            title="Profile Photo" 
            titleStyle={[styles.textColor, { fontWeight: 'bold', fontSize: 18 }]} 
          />
          <Card.Content style={styles.profileContainer}>
            <TouchableOpacity
              onPress={handlePhotoPress}
              activeOpacity={0.8}
              disabled={!photo}
            >
              <Avatar.Image
                size={120}
                source={photo ? { uri: photo } : require('../../../../assets/images/user.png')}
                style={{ backgroundColor: '#f0f0f0' }}
              />
            </TouchableOpacity>
            <View style={styles.photoButtonsContainer}>
              <Button
                mode="outlined"
                onPress={pickAndUploadProfilePhoto}
                loading={uploadLoading}
                disabled={uploadLoading}
                style={styles.changePhotoButton}
                labelStyle={styles.buttonLabel}
                icon="camera"
              >
                {uploadLoading ? 'Uploading...' : Platform.OS === 'web' ? 'Upload Photo' : 'Crop & Upload'}
              </Button>
              
              {/* Platform-specific help text */}
              <Text style={styles.platformHelpText}>
                {Platform.OS === 'web' 
                  ? '💡 For best results, use a square image' 
                  : '✂️ Crop your photo to a square shape before uploading'
                }
              </Text>
              
              {/* {photo && (
                <Button
                  mode="outlined"
                  onPress={removeProfilePhoto}
                  disabled={uploadLoading}
                  style={styles.removePhotoButton}
                  labelStyle={styles.removeButtonLabel}
                  icon="delete"
                >
                  Remove Photo
                </Button>
              )} */}
            </View>
          </Card.Content>
        </Card>

        {/* Referred Users Section */}
        <Card style={styles.card}>
          <Card.Title
            title="Referred Users"
            titleStyle={[styles.textColor, { fontWeight: 'bold', fontSize: 18 }]}
            subtitle={totalRecords > 0 ? `${referrals.length} of ${totalRecords} users` : null}
            subtitleStyle={{ color: '#666' }}
            right={() => (
              <View style={styles.buttonContainer}>
                {referrals.length > ITEMS_PER_PAGE && (
                  <Button
                    onPress={resetReferrals}
                    disabled={page === 0 || loading}
                    labelStyle={styles.buttonLabel}
                    compact
                  >
                    Reset
                  </Button>
                )}
                {referrals.length < totalRecords && (
                  <Button
                    onPress={loadMoreReferrals}
                    loading={loading}
                    disabled={loading}
                    labelStyle={styles.buttonLabel}
                    compact
                  >
                    Load More
                  </Button>
                )}
              </View>
            )}
          />
          <Card.Content>
            {referrals.length === 0 && !loading ? (
              <Text style={styles.noRecordText}>
                No referrals found
              </Text>
            ) : (
              <>
                {referrals.slice(0, displayCount).map((user) => (
                  <List.Item
                    key={`${user.id}-${user.name}`}
                    title={user.name || 'Unknown User'}
                    description={user.phone || 'No phone number'}
                    titleStyle={styles.textColor}
                    descriptionStyle={styles.textColor}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon="account-circle" 
                        color={styles.iconColor} 
                      />
                    )}
                  />
                ))}
                
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator 
                      animating={true} 
                      color="#000" 
                      size="small"
                    />
                  </View>
                )}
                
                {referrals.length >= totalRecords && totalRecords > 0 && (
                  <Text style={styles.noMoreText}>
                    All referrals loaded
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Success Modal */}
      <Portal>
        <Dialog 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)} 
          style={{ backgroundColor: '#fff' }}
        >
          <Dialog.Title style={styles.textColor}>Success</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textColor}>
              Operation completed successfully!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setModalVisible(false)} 
              labelStyle={styles.buttonLabel}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#333' }}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Photo Zoom Modal */}
      <PhotoZoomModal />
    </>
  );
};

export default Profile;