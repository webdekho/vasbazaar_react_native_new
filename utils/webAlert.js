import { Platform, Alert } from 'react-native';

// Web alert state manager
let webAlertCallback = null;

export const setWebAlertCallback = (callback) => {
  webAlertCallback = callback;
};

export const showAlert = (title, message, buttons = []) => {
  if (Platform.OS === 'web' && webAlertCallback) {
    // Show web modal
    webAlertCallback({
      visible: true,
      title,
      message,
      buttons: buttons.map(button => ({
        text: button.text || 'OK',
        style: button.style || 'default',
        onPress: button.onPress || (() => {})
      }))
    });
  } else if (Platform.OS !== 'web') {
    // Use native Alert for mobile platforms
    Alert.alert(title, message, buttons);
  } else {
    // Fallback to browser's native alert/confirm if no callback set
    if (buttons.length === 0) {
      alert(`${title}\n\n${message}`);
    } else if (buttons.length === 1) {
      alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) buttons[0].onPress();
    } else {
      // For multiple buttons, use confirm (OK/Cancel)
      const result = confirm(`${title}\n\n${message}`);
      if (result && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress(); // "OK" or second button
      } else if (!result && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress(); // "Cancel" or first button
      }
    }
  }
};