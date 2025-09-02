import { Platform, Alert, Linking, Share } from 'react-native';

/**
 * Enhanced sharing service with WhatsApp integration
 */

// Install required dependencies:
// For Expo: expo install expo-clipboard
// For React Native: npm install @react-native-clipboard/clipboard

let Clipboard;
try {
  // Try Expo Clipboard first
  Clipboard = require('expo-clipboard');
} catch (e) {
  try {
    // Fallback to React Native Clipboard
    Clipboard = require('@react-native-clipboard/clipboard');
  } catch (e2) {
  }
}

/**
 * Share content with WhatsApp priority
 * @param {Object} options - Sharing options
 * @param {string} options.message - Message to share
 * @param {string} options.title - Title for sharing
 * @param {string} options.url - URL to share
 * @param {boolean} options.forceWhatsApp - Try to open WhatsApp specifically
 */
export const shareWithWhatsApp = async (options) => {
  const { message, title = 'Share from VasBazaar', url, forceWhatsApp = true } = options;
  
  try {
    // For mobile platforms, try WhatsApp first if requested
    if (Platform.OS !== 'web' && forceWhatsApp) {
      const success = await shareViaWhatsAppMobile(message);
      if (success) return;
    }
    
    // For web or if WhatsApp failed, try web WhatsApp
    if (Platform.OS === 'web') {
      const success = await shareViaWhatsAppWeb(message);
      if (success) return;
    }
    
    // Fallback to native sharing
    await shareViaNativeShare({ message, title, url });
    
  } catch (error) {
    // Final fallback - copy to clipboard
    await fallbackToClipboard(message);
  }
};

/**
 * Share via WhatsApp on mobile platforms
 */
const shareViaWhatsAppMobile = async (message) => {
  try {
    // WhatsApp URL schemes
    const whatsappUrls = [
      `whatsapp://send?text=${encodeURIComponent(message)}`,
      `https://wa.me/?text=${encodeURIComponent(message)}`
    ];
    
    for (const whatsappUrl of whatsappUrls) {
      try {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          return true;
        }
      } catch (e) {
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Share via WhatsApp Web
 */
const shareViaWhatsAppWeb = async (message) => {
  try {
    const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    const whatsappApiUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Try WhatsApp API URL first (works on mobile browsers too)
    try {
      if (typeof window !== 'undefined') {
        window.open(whatsappApiUrl, '_blank');
        return true;
      }
    } catch (e) {
    }
    
    // Fallback to WhatsApp Web
    try {
      if (typeof window !== 'undefined') {
        window.open(whatsappWebUrl, '_blank');
        return true;
      }
    } catch (e) {
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Share via native platform sharing
 */
const shareViaNativeShare = async ({ message, title, url }) => {
  try {
    if (Platform.OS !== 'web') {
      // Mobile native sharing
      const shareOptions = {
        title: title,
        message: message
      };
      
      if (url) {
        shareOptions.url = url;
      }
      
      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        return true;
      }
    } else {
      // Web sharing
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: title,
          text: message
        };
        
        if (url) {
          shareData.url = url;
        }
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return true;
        }
      }
      
      // Web fallback - copy to clipboard
      await fallbackToClipboard(message);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Fallback to clipboard copying
 */
const fallbackToClipboard = async (message) => {
  try {
    if (Platform.OS === 'web') {
      // Web clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        Alert.alert(
          'Link Copied! 📋',
          'The referral link has been copied to your clipboard. You can now paste it in WhatsApp or any other app.',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback for older browsers
        showManualCopyAlert(message);
      }
    } else {
      // Mobile clipboard
      if (Clipboard) {
        if (Clipboard.setStringAsync) {
          // Expo clipboard
          await Clipboard.setStringAsync(message);
        } else if (Clipboard.setString) {
          // React Native clipboard
          await Clipboard.setString(message);
        }
        
        Alert.alert(
          'Link Copied! 📋',
          'The referral link has been copied to your clipboard. You can now paste it in WhatsApp or any other app.',
          [
            { text: 'Open WhatsApp', onPress: () => openWhatsAppApp() },
            { text: 'OK' }
          ]
        );
      } else {
        showManualCopyAlert(message);
      }
    }
  } catch (error) {
    showManualCopyAlert(message);
  }
};

/**
 * Try to open WhatsApp app directly
 */
const openWhatsAppApp = async () => {
  try {
    const whatsappUrls = [
      'whatsapp://',
      'https://wa.me/',
      'whatsapp://send'
    ];
    
    for (const url of whatsappUrls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      } catch (e) {
      }
    }
    
    // If WhatsApp can't be opened, show app store link
    Alert.alert(
      'WhatsApp Not Found',
      'WhatsApp is not installed on your device. Would you like to install it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install', 
          onPress: () => {
            const appStoreUrl = Platform.OS === 'ios' 
              ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
              : 'https://play.google.com/store/apps/details?id=com.whatsapp';
            Linking.openURL(appStoreUrl);
          }
        }
      ]
    );
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Show manual copy alert when automatic clipboard fails
 */
const showManualCopyAlert = (message) => {
  Alert.alert(
    'Share Your Referral Link',
    'Copy this link and share it with your friends:\n\n' + message,
    [
      { 
        text: 'Try WhatsApp', 
        onPress: () => openWhatsAppApp() 
      },
      { text: 'OK' }
    ]
  );
};

/**
 * Share referral link specifically
 */
export const shareReferralLink = async (referralUrl, userName = '') => {
  const message = `🎉 Hey! I'm using VasBazaar to earn cashback on every transaction. ${userName ? `Join me (${userName}) ` : 'Join me '}and start earning too! 💰\n\n🔗 Sign up here: ${referralUrl}\n\n✨ Get instant cashback on mobile recharges, bill payments & more!`;
  
  await shareWithWhatsApp({
    message: message,
    title: 'Join VasBazaar - Earn Cashback!',
    url: referralUrl,
    forceWhatsApp: true
  });
};

/**
 * Share transaction success
 */
export const shareTransactionSuccess = async (transactionDetails) => {
  const { amount, operator, service, referralUrl } = transactionDetails;
  
  const message = `💸 Just saved money on my ${service} with ${operator}! Paid only ₹${amount} and got instant cashback! 🎉\n\n💡 You can save too! Join VasBazaar and get cashback on every transaction:\n${referralUrl}\n\n#SaveMoney #Cashback #VasBazaar`;
  
  await shareWithWhatsApp({
    message: message,
    title: 'I just saved money with VasBazaar!',
    url: referralUrl,
    forceWhatsApp: true
  });
};

export default {
  shareWithWhatsApp,
  shareReferralLink,
  shareTransactionSuccess
};