import React, { useState, useEffect, useRef } from 'react';
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
  Share,
  PermissionsAndroid,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MainHeader from '@/components/MainHeader';
import { getUserBalance } from '../../services';
import { shareReferralLink } from '../../services/sharing/shareService';

// Note: For better QR section capture on web, install dom-to-image:
// npm install dom-to-image
// This will enable full section download with proper styling

// Platform-specific libraries
let QRCodeLib;
let QRCode;
let domtoimage;
let ViewShot;
let CameraRoll;
let RNFS;

if (Platform.OS === 'web') {
  try {
    QRCodeLib = require('qrcode');
    // Try to import dom-to-image for capturing the section
    try {
      domtoimage = require('dom-to-image');
    } catch (_e) {
      console.log('dom-to-image not available, using fallback method');
    }
  } catch (_error) {
    console.log('QRCode library not available on web');
  }
} else {
  try {
    const qrCodeComponent = require('react-native-qrcode-svg');
    QRCode = qrCodeComponent.default || qrCodeComponent;
    
    // Mobile-specific libraries for screenshot and file saving
    try {
      ViewShot = require('react-native-view-shot');
    } catch (_e) {
      console.log('react-native-view-shot not available');
    }
    
    try {
      CameraRoll = require('@react-native-camera-roll/camera-roll');
    } catch (_e) {
      console.log('@react-native-camera-roll/camera-roll not available');
    }
    
    try {
      RNFS = require('react-native-fs');
    } catch (_e) {
      console.log('react-native-fs not available');
    }
  } catch (_error) {
    console.log('Mobile libraries not available');
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
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Ref for mobile screenshot
  const qrSectionRef = useRef(null);

  // User benefits data
  const userBenefits = [
    {
      id: 1,
      title: 'Instant Recharge',
      description: 'Quick mobile and DTH recharge services',
      icon: 'flash-on',
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
      title: 'Earn Rewards',
      description: 'Earn rewards on every transaction',
      icon: 'currency-rupee',
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
      
      // Get user data from AsyncStorage - using the same pattern as Sidebar
      const [sessionToken, permanentToken, username, storedUserData] = await Promise.all([
        AsyncStorage.getItem('sessionToken'),
        AsyncStorage.getItem('permanentToken'),
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('userData')
      ]);

      if (!sessionToken) {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.replace('/auth/LoginScreen');
        return;
      }

      // Parse user data to get mobile number
      let mobileNumber = 'N/A';
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          mobileNumber = parsed?.mobile || 'N/A';
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      // Fetch wallet balance
      const balanceResponse = await getUserBalance(sessionToken);
      const walletBalance = balanceResponse?.status === 'success' ? balanceResponse.data : { balance: '0.00' };

      const user = {
        username: username || 'User',
        mobileNumber: mobileNumber,
        balance: walletBalance.balance || '0.00',
        sessionToken,
        permanentToken
      };

      setUserData(user);

      // Generate QR data - use URL format with code=mobile number
      const qrString = user.mobileNumber 
        ? `https://vasbazaar.webdekho.in?code=${user.mobileNumber}`
        : `https://vasbazaar.webdekho.in?code=${Date.now()}`;
      
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

  // Cross-platform download functionality
  const downloadQRCode = async () => {
    try {
      setDownloading(true);

      if (Platform.OS === 'web') {
        await downloadForWeb();
      } else if (Platform.OS === 'ios') {
        await downloadForIOS();
      } else if (Platform.OS === 'android') {
        await downloadForAndroid();
      }
    } catch (error) {
      console.error('Error downloading QR section:', error);
      Alert.alert('Error', 'Failed to download QR section. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Web download implementation using built-in browser APIs
  const downloadForWeb = async () => {
    const qrSectionElement = document.getElementById('qr-section-to-download');
    
    if (!qrSectionElement) {
      Alert.alert('Error', 'QR section not found. Please try again.');
      return;
    }

    try {
      console.log('Starting web download...');
      
      // Method 1: Try using dom-to-image if available
      if (domtoimage && domtoimage.toPng) {
        console.log('Using dom-to-image method');
        await downloadWithDomToImage(qrSectionElement);
        return;
      }
      
      // Method 2: Use modern browser screenshot API
      if ('html2canvas' in window) {
        console.log('Using html2canvas method');
        await downloadWithHtml2Canvas(qrSectionElement);
        return;
      }
      
      // Method 3: Custom canvas-based approach
      console.log('Using custom canvas method');
      await downloadWithCustomCanvas(qrSectionElement);
      
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Download failed. Trying alternative method...');
      await downloadUsingBrowserAPI();
    }
  };
  
  // Download using dom-to-image library
  const downloadWithDomToImage = async (element) => {
    const images = element.querySelectorAll('img');
    
    // Wait for all images to load
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: '#ffffff',
      cacheBust: true,
      scale: 2,
      width: element.offsetWidth,
      height: element.offsetHeight
    });
    
    downloadImage(dataUrl, 'VasBazaar-QR-Complete');
    Alert.alert('Success', 'Complete QR section downloaded successfully!');
  };
  
  // Download using html2canvas
  const downloadWithHtml2Canvas = async (element) => {
    const canvas = await window.html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    downloadImage(dataUrl, 'VasBazaar-QR-Complete');
    Alert.alert('Success', 'Complete QR section downloaded successfully!');
  };
  
  // Custom canvas-based download (fallback method) - Enhanced
  const downloadWithCustomCanvas = async (element) => {
    try {
      // Get element dimensions and position
      const rect = element.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set high resolution with proper dimensions
      const scale = 3;
      const padding = 40; // Add padding around content
      canvas.width = (rect.width + padding * 2) * scale;
      canvas.height = (rect.height + padding * 2) * scale;
      ctx.scale(scale, scale);
      
      // Enable better text rendering
      ctx.textRendering = 'optimizeLegibility';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill background with white (with padding)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width + padding * 2, rect.height + padding * 2);
      
      // Enhanced drawing with proper styling (offset by padding)
      await drawEnhancedElementToCanvas(element, ctx, padding, padding);
      
      // Download the canvas
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      downloadImage(dataUrl, 'VasBazaar-QR-Complete');
      Alert.alert('Success', 'QR section downloaded with enhanced quality!');
      
    } catch (error) {
      console.error('Custom canvas error:', error);
      // Fallback to simple method
      await drawSimpleVersion(element);
    }
  };
  
  // Enhanced drawing method with proper styling
  const drawEnhancedElementToCanvas = async (element, ctx, x, y) => {
    const style = window.getComputedStyle(element);
    const elementRect = element.getBoundingClientRect();
    
    // Draw background with proper styling
    const bgColor = style.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, elementRect.width, elementRect.height);
    }
    
    // Draw borders and shadows
    const borderRadius = parseInt(style.borderRadius) || 0;
    const borderColor = style.borderColor || '#000000';
    const borderWidth = parseInt(style.borderWidth) || 0;
    
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      
      if (borderRadius > 0) {
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.roundRect(x, y, elementRect.width, elementRect.height, borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, elementRect.width, elementRect.height);
      }
    }
    
    // Draw shadow if present
    const boxShadow = style.boxShadow;
    if (boxShadow && boxShadow !== 'none') {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
    }
    
    // Handle different element types
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'img') {
      // Draw images
      if (element.complete && element.naturalWidth > 0) {
        try {
          ctx.drawImage(element, x, y, elementRect.width, elementRect.height);
        } catch (e) {
          // If image fails to draw, draw a placeholder
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x, y, elementRect.width, elementRect.height);
          ctx.fillStyle = '#666';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image', x + elementRect.width/2, y + elementRect.height/2);
        }
      }
    } else if (element.children.length === 0 && element.textContent.trim()) {
      // Draw text content for leaf nodes
      const text = element.textContent.trim();
      if (text) {
        ctx.fillStyle = style.color || '#000000';
        ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || '16px'} ${style.fontFamily || 'Arial, sans-serif'}`;
        ctx.textAlign = style.textAlign || 'left';
        ctx.textBaseline = 'top';
        
        const padding = 12;
        const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2 || 20;
        
        // Handle multi-line text
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + ' ' + word).width;
          if (width < elementRect.width - padding * 2) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        
        // Draw each line
        lines.forEach((line, index) => {
          const textY = y + padding + (index * lineHeight);
          let textX = x + padding;
          
          if (ctx.textAlign === 'center') {
            textX = x + elementRect.width / 2;
          } else if (ctx.textAlign === 'right') {
            textX = x + elementRect.width - padding;
          }
          
          ctx.fillText(line, textX, textY);
        });
      }
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw child elements recursively
    for (const child of element.children) {
      const childRect = child.getBoundingClientRect();
      const parentRect = element.getBoundingClientRect();
      
      const childX = x + (childRect.left - parentRect.left);
      const childY = y + (childRect.top - parentRect.top);
      
      await drawEnhancedElementToCanvas(child, ctx, childX, childY);
    }
  };
  
  // Simplified fallback drawing method
  const drawSimpleVersion = async (element) => {
    try {
      const rect = element.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Proper canvas dimensions without stretching - increased width for better appearance
      const scale = 2;
      const padding = 60; // Base padding
      const extraRightPadding = 80; // Additional right-side space for better appearance
      canvas.width = (rect.width + padding * 2 + extraRightPadding) * scale;
      canvas.height = (rect.height + padding * 2) * scale;
      ctx.scale(scale, scale);
      
      // White background with padding - full canvas with extra right space
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width + padding * 2 + extraRightPadding, rect.height + padding * 2);
      
      // Simple layout recreation with padding offset
      await drawSimpleLayout(element, ctx, rect, padding);
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      downloadImage(dataUrl, 'VasBazaar-QR-Simple');
      Alert.alert('Success', 'QR section downloaded (simplified version)!');
      
    } catch (error) {
      console.error('Simple canvas error:', error);
      Alert.alert('Error', 'Canvas download failed. Please try screenshot or install dom-to-image library.');
    }
  };
  
  // Simple layout drawing with improved spacing
  const drawSimpleLayout = async (element, ctx, rect, padding = 0) => {
    // Calculate available content width with extra right space for better appearance
    const extraRightPadding = 80;
    const contentWidth = rect.width + 40; // Add some extra width for better spacing
    const contentHeight = rect.height;
    
    // Draw main container with proper styling - full canvas area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width + padding * 2 + extraRightPadding, rect.height + padding * 2);
    
    // Container border - use content width for proper sizing
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding + 15, padding + 15, contentWidth - 30, contentHeight - 30);
    
    // Logo area background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding + 30, padding + 30, contentWidth - 60, 90);
    
    // VASBAZAAR logo text with styling - properly centered within content area
    ctx.fillStyle = '#f59e0b'; // Orange color for VAS
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    const fullLogoWidth = ctx.measureText('VASBAZAAR').width;
    const vasWidth = ctx.measureText('VAS').width;
    const logoStartX = padding + (contentWidth - fullLogoWidth) / 2;
    ctx.fillText('VAS', logoStartX, padding + 80);
    
    ctx.fillStyle = '#000000'; // Black for BAZAAR
    ctx.fillText('BAZAAR', logoStartX + vasWidth, padding + 80);
    
    // QR Code section title - centered within content area
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const titleX = padding + contentWidth / 2;
    ctx.fillText('My vasbzaar QR Code', titleX, padding + 160);
    
    // Description - centered within content area
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Share this QR code to let others know about your vasbzaar profile', titleX, padding + 185);
    
    // Draw QR code area - centered within content area
    const qrSize = 200;
    const qrX = padding + (contentWidth - qrSize) / 2;
    const qrY = padding + 210;
    
    // QR background with shadow effect
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    
    // QR border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    
    // Try to draw the actual QR code if available
    const qrImage = element.querySelector('img[src*="data:image"]');
    if (qrImage && qrImage.complete) {
      try {
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      } catch (e) {
        drawQRPattern(ctx, qrX, qrY, qrSize);
      }
    } else {
      drawQRPattern(ctx, qrX, qrY, qrSize);
    }
    
    // Benefits section - positioned within content area
    const benefitsY = qrY + qrSize + 50;
    
    // Benefits background - use content width
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding + 30, benefitsY - 20, contentWidth - 60, 280);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(padding + 30, benefitsY - 20, contentWidth - 60, 280);
    
    // Benefits title - centered within content area
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('vasbzaar Benefits', titleX, benefitsY + 10);
    
    // Benefits description - centered within content area
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Enjoy these amazing features with your vasbzaar account', titleX, benefitsY + 35);
    
    // Draw benefit cards - calculated to fit within content area
    const totalCardsWidth = contentWidth - 120; // Leave 60px margin on each side
    const cardWidth = (totalCardsWidth - 20) / 2; // 20px spacing between cards
    const cardHeight = 120;
    const cardsY = benefitsY + 60;
    const cardSpacing = 20;
    const cardsStartX = padding + 60; // Start 60px from left edge
    
    const benefits = [
      { title: 'Instant Recharge', desc: 'Quick mobile and DTH\nrecharge services', icon: '⚡' },
      { title: 'Bill Payments', desc: 'Pay electricity, water\n& other utility bills', icon: '📄' },
      { title: 'Earn Rewards', desc: 'Earn rewards on\nevery transaction', icon: '₹' },
      { title: '24/7 Support', desc: 'Round-the-clock\ncustomer support', icon: '🎧' }
    ];
    
    benefits.forEach((benefit, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const cardX = cardsStartX + (col * (cardWidth + cardSpacing));
      const cardY = cardsY + (row * (cardHeight + cardSpacing));
      
      // Card background with rounded corners effect
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      
      // Card border
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
      
      // Icon background circle - perfectly positioned
      const iconCenterX = cardX + cardWidth / 2;
      const iconCenterY = cardY + 30;
      const circleRadius = 18;
      
      // Draw circle with border
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Icon - perfectly centered in circle
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(benefit.icon, iconCenterX, iconCenterY);
      
      // Card title - positioned below circle with proper gap
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const titleY = iconCenterY + circleRadius + 10;
      ctx.fillText(benefit.title, iconCenterX, titleY);
      
      // Card description - positioned below title with proper gap
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const descLines = benefit.desc.split('\n');
      const descStartY = titleY + 18;
      descLines.forEach((line, lineIndex) => {
        ctx.fillText(line.trim(), iconCenterX, descStartY + (lineIndex * 12));
      });
    });
  };
  
  // Draw QR pattern placeholder
  const drawQRPattern = (ctx, x, y, size) => {
    const cellSize = size / 25;
    ctx.fillStyle = '#000000';
    
    // Draw simple QR-like pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Draw corner squares
    const cornerSize = cellSize * 7;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, cornerSize, cornerSize);
    ctx.fillRect(x + size - cornerSize, y, cornerSize, cornerSize);
    ctx.fillRect(x, y + size - cornerSize, cornerSize, cornerSize);
    
    ctx.fillStyle = '#ffffff';
    const innerSize = cellSize * 5;
    ctx.fillRect(x + cellSize, y + cellSize, innerSize, innerSize);
    ctx.fillRect(x + size - cornerSize + cellSize, y + cellSize, innerSize, innerSize);
    ctx.fillRect(x + cellSize, y + size - cornerSize + cellSize, innerSize, innerSize);
    
    ctx.fillStyle = '#000000';
    const innerInnerSize = cellSize * 3;
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, innerInnerSize, innerInnerSize);
    ctx.fillRect(x + size - cornerSize + cellSize * 2, y + cellSize * 2, innerInnerSize, innerInnerSize);
    ctx.fillRect(x + cellSize * 2, y + size - cornerSize + cellSize * 2, innerInnerSize, innerInnerSize);
  };
  
  
  // Helper function to download image
  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.download = `${filename}-${userData?.username || 'user'}-${new Date().getTime()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // iOS download implementation
  const downloadForIOS = async () => {
    try {
      if (ViewShot && qrSectionRef?.current) {
        // Capture the view as image
        const uri = await ViewShot.captureRef(qrSectionRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        
        // Save to Photos using CameraRoll
        if (CameraRoll && CameraRoll.save) {
          await CameraRoll.save(uri, { type: 'photo' });
          Alert.alert('Success', 'QR section saved to Photos!');
        } else {
          // Fallback: Share the image
          await Share.share({
            url: uri,
            title: 'VasBazaar QR Code',
            message: 'My VasBazaar QR Code with all details'
          });
        }
      } else {
        // Fallback: Show instructions for manual screenshot
        Alert.alert(
          'Screenshot Required',
          'To save your QR code:\n\n1. Take a screenshot of this screen\n2. Crop the QR section if needed\n3. Save to your Photos\n\nFor automatic download, install:\nnpm install react-native-view-shot\nnpm install @react-native-camera-roll/camera-roll'
        );
      }
    } catch (error) {
      console.error('iOS download error:', error);
      Alert.alert('Error', 'Failed to save image. Please try taking a screenshot manually.');
    }
  };

  // Android download implementation
  const downloadForAndroid = async () => {
    try {
      // Request storage permission
      const granted = await requestStoragePermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Storage permission is required to save the QR code.');
        return;
      }

      if (ViewShot && qrSectionRef?.current) {
        // Capture the view as image
        const uri = await ViewShot.captureRef(qrSectionRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        
        if (RNFS) {
          // Create filename with timestamp
          const timestamp = new Date().getTime();
          const filename = `VasBazaar-QR-Complete-${userData?.username || 'user'}-${timestamp}.png`;
          const downloadPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
          
          // Copy file to Downloads folder
          await RNFS.copyFile(uri, downloadPath);
          
          Alert.alert(
            'Success',
            `QR section saved to Downloads folder as:\n${filename}`
          );
        } else {
          // Fallback: Share the image
          await Share.share({
            url: uri,
            title: 'VasBazaar QR Code',
            message: 'My VasBazaar QR Code with all details'
          });
        }
      } else {
        Alert.alert(
          'Screenshot Required',
          'To save your QR code:\n\n1. Take a screenshot of this screen\n2. Crop the QR section if needed\n3. Save to your device\n\nFor automatic download, install:\nnpm install react-native-view-shot\nnpm install react-native-fs'
        );
      }
    } catch (error) {
      console.error('Android download error:', error);
      Alert.alert('Error', 'Failed to save image. Please try taking a screenshot manually.');
    }
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to save your QR code.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Enhanced fallback download method using browser API
  const downloadUsingBrowserAPI = async () => {
    try {
      console.log('Trying browser fallback method...');
      
      // Try using Screen Capture API (modern browsers)
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          Alert.alert(
            'Screen Capture',
            'Your browser will ask permission to capture the screen. Please select the current browser window/tab and click on the QR section area to capture it.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Start Capture', onPress: () => captureScreen() }
            ]
          );
          return;
        } catch (e) {
          console.log('Screen capture not available:', e);
        }
      }
      
      // Try using the QR code image as fallback
      if (qrCodeImage) {
        console.log('Using QR code image fallback');
        downloadImage(qrCodeImage, 'VasBazaar-QR');
        Alert.alert('Success', 'QR code downloaded successfully!\\n\\nNote: Only the QR code was downloaded. For the complete section with logo and benefits, please:\\n\\n1. Install: npm install dom-to-image\\n2. Or take a screenshot manually');
        return;
      }
      
      // Final fallback: Show comprehensive instructions
      Alert.alert(
        'Manual Download Options',
        'Choose one of these methods:\\n\\n' +
        '📸 SCREENSHOT METHOD:\\n' +
        '1. Take a screenshot of this page\\n' +
        '2. Crop the QR section\\n' +
        '3. Save the image\\n\\n' +
        '🖱️ RIGHT-CLICK METHOD:\\n' +
        '1. Right-click on the QR section\\n' +
        '2. Select \"Save as image\"\\n\\n' +
        '⚙️ AUTOMATIC DOWNLOAD:\\n' +
        'Install: npm install dom-to-image'
      );
      
    } catch (error) {
      console.error('Browser API download error:', error);
      Alert.alert(
        'Download Help',
        'Please use one of these methods:\\n\\n' +
        '1. Take a screenshot of the QR section\\n' +
        '2. Right-click and \"Save as image\"\\n' +
        '3. Install libraries for automatic download'
      );
    }
  };
  
  // Screen capture using modern browser API
  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Download the captured image
        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl, 'VasBazaar-QR-Screenshot');
        
        Alert.alert('Success', 'Screen captured! Please crop the QR section from the downloaded image if needed.');
      });
      
    } catch (error) {
      console.error('Screen capture error:', error);
      Alert.alert('Error', 'Screen capture failed. Please use screenshot or right-click method instead.');
    }
  };

  // Share QR Code
  const shareQRCode = async () => {
    try {
      let qrString = '';
      let userName = 'User';

      // First try to use existing qrData if it's already in the correct format
      if (qrData && qrData.includes('vasbazaar.webdekho.in?code=')) {
        qrString = qrData;
        // Get user name from userData
        userName = userData?.username || 'User';
      } else {
        // Load user data to get the mobile number and generate QR string
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          userName = parsed?.name || 'User';
          
          // Generate QR string using mobile number with code parameter
          if (parsed?.mobile) {
            qrString = `https://vasbazaar.webdekho.in?code=${parsed.mobile}`;
          }
        }
      }

      // Final fallback
      if (!qrString) {
        qrString = `https://vasbazaar.webdekho.in?code=${Date.now()}`;
      }

      await shareReferralLink(qrString, userName);
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Unable to share QR code. Please try again.');
    }
  };


  useEffect(() => {
    fetchUserData();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
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
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{
          paddingBottom: Platform.select({
            web: 100,
            default: 80,
          })
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Section */}
        <View 
          style={styles.qrContainer} 
          id="qr-section-to-download"
          ref={Platform.OS === 'web' ? null : qrSectionRef}
        >
          {/* Vasbazaar Logo - Inside QR Code card */}
          <Image 
            source={require('../../assets/images/vasbazaar_logo.png')} 
            style={styles.logoImageInCard}
            resizeMode="contain"
          />
          
          <Text style={styles.qrTitle} numberOfLines={1}>My vasbzaar QR Code</Text>
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

          {/* Benefits Section - Inside QR Code card */}
          <View style={styles.benefitsInCard}>
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

      {/* Fixed Action Buttons at Bottom */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  // Logo inside QR Card
  logoImageInCard: {
    width: 200,
    height: 60,
    marginBottom: 20,
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
    alignSelf: 'center',
    maxWidth: 400, // Prevent container from being too wide
    width: '100%',
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

  // Benefits inside QR Card
  benefitsInCard: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.select({
      web: 30,
      default: 16,
    }),
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        zIndex: 1000,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
      },
    }),
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
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
  },
  benefitCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'flex-start',
    marginBottom: 12,
    width: '45%', // Fixed width to ensure 2 columns
    marginHorizontal: '2.5%', // Center the cards with equal spacing
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
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