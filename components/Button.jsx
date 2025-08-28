import { TouchableOpacity, ActivityIndicator , StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  children,
  testID
}) {

  const getButtonStyles = () => {
    const baseStyles = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyles.push(styles.buttonLarge);
        break;
      default:
        baseStyles.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyles.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyles.push(styles.buttonGhost);
        break;
      case 'danger':
        baseStyles.push(styles.buttonDanger);
        break;
      case 'success':
        baseStyles.push(styles.buttonSuccess);
        break;
      case 'warning':
        baseStyles.push(styles.buttonWarning);
        break;
      default:
        baseStyles.push(styles.buttonPrimary);
    }

    // State styles
    if (disabled || loading) {
      baseStyles.push(styles.buttonDisabled);
    }

    // Full width
    if (fullWidth) {
      baseStyles.push(styles.buttonFullWidth);
    }

    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.buttonText];
    
    // Size text styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.buttonTextSmall);
        break;
      case 'large':
        baseStyles.push(styles.buttonTextLarge);
        break;
      default:
        baseStyles.push(styles.buttonTextMedium);
    }

    // Variant text styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(styles.buttonTextSecondary);
        break;
      case 'outline':
        baseStyles.push(styles.buttonTextOutline);
        break;
      case 'ghost':
        baseStyles.push(styles.buttonTextGhost);
        break;
      case 'danger':
        baseStyles.push(styles.buttonTextDanger);
        break;
      case 'success':
        baseStyles.push(styles.buttonTextSuccess);
        break;
      case 'warning':
        baseStyles.push(styles.buttonTextWarning);
        break;
      default:
        baseStyles.push(styles.buttonTextPrimary);
    }

    // Disabled text styles
    if (disabled || loading) {
      baseStyles.push(styles.buttonTextDisabled);
    }

    return baseStyles;
  };

  const getIconColor = () => {
    if (disabled) return '#999';
    if (loading) return '#ffffff'; // White loader for black buttons
    
    switch (variant) {
      case 'secondary':
        return '#333';
      case 'outline':
        return '#000000';
      case 'ghost':
        return '#000000';
      case 'danger':
        return '#ffffff';
      case 'success':
        return '#ffffff';
      case 'warning':
        return '#ffffff';
      default:
        return '#ffffff';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator 
            size={size === 'small' ? 'small' : 'small'} 
            color={getIconColor()} 
            style={styles.loadingSpinner}
          />
          {title && (
            <ThemedText style={[getTextStyles(), textStyle, { marginLeft: 8 }]}>
              {title}
            </ThemedText>
          )}
        </ThemedView>
      );
    }

    if (children) {
      return children;
    }

    const content = [];
    
    if (icon && iconPosition === 'left') {
      content.push(
        <FontAwesome
          key="icon-left"
          name={icon}
          size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
          color={getIconColor()}
          style={title ? styles.iconLeft : undefined}
        />
      );
    }

    if (title) {
      content.push(
        <ThemedText key="title" style={[getTextStyles(), textStyle]}>
          {title}
        </ThemedText>
      );
    }

    if (icon && iconPosition === 'right') {
      content.push(
        <FontAwesome
          key="icon-right"
          name={icon}
          size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
          color={getIconColor()}
          style={title ? styles.iconRight : undefined}
        />
      );
    }

    return content;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      <ThemedView style={styles.buttonContent}>
        {renderContent()}
      </ThemedView>
    </TouchableOpacity>
  );
}

// Preset button configurations
export const ButtonPresets = {
  primary: { variant: 'primary' },
  secondary: { variant: 'secondary' },
  outline: { variant: 'outline' },
  ghost: { variant: 'ghost' },
  danger: { variant: 'danger' },
  success: { variant: 'success' },
  warning: { variant: 'warning' },
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Size styles
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },
  
  // Variant styles
  buttonPrimary: {
    backgroundColor: '#000000',
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: '#FF5722',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonWarning: {
    backgroundColor: '#FF9800',
  },
  
  // State styles
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#ccc',
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: 14,
  },
  buttonTextMedium: {
    fontSize: 16,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  
  // Text variant styles
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#333',
  },
  buttonTextOutline: {
    color: '#000000',
  },
  buttonTextGhost: {
    color: '#000000',
  },
  buttonTextDanger: {
    color: '#ffffff',
  },
  buttonTextSuccess: {
    color: '#ffffff',
  },
  buttonTextWarning: {
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  
  // Icon styles
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  
  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 0,
  },
});