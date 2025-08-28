import { useState, forwardRef } from 'react';
import { TextInput, TouchableOpacity, Animated , StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const InputField = forwardRef(({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  variant = 'default',
  size = 'medium',
  showCharacterCount = false,
  clearable = false,
  onClear,
  testID,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [labelAnimation] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = (e) => {
    setIsFocused(true);
    animateLabel(1);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (!value) {
      animateLabel(0);
    }
    onBlur?.(e);
  };

  const animateLabel = (toValue) => {
    Animated.timing(labelAnimation, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getContainerStyles = () => {
    const baseStyles = [styles.container];
    
    switch (variant) {
      case 'outlined':
        baseStyles.push(styles.containerOutlined);
        break;
      case 'filled':
        baseStyles.push(styles.containerFilled);
        break;
      case 'underlined':
        baseStyles.push(styles.containerUnderlined);
        break;
      default:
        baseStyles.push(styles.containerDefault);
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.containerSmall);
        break;
      case 'large':
        baseStyles.push(styles.containerLarge);
        break;
      default:
        baseStyles.push(styles.containerMedium);
    }

    // State styles
    if (isFocused) {
      baseStyles.push(styles.containerFocused);
      if (variant === 'outlined') baseStyles.push(styles.containerOutlinedFocused);
    }
    
    if (error) {
      baseStyles.push(styles.containerError);
    }
    
    if (disabled) {
      baseStyles.push(styles.containerDisabled);
    }

    return baseStyles;
  };

  const getInputStyles = () => {
    const baseStyles = [styles.input];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.inputSmall);
        break;
      case 'large':
        baseStyles.push(styles.inputLarge);
        break;
      default:
        baseStyles.push(styles.inputMedium);
    }

    // Multiline styles
    if (multiline) {
      baseStyles.push(styles.inputMultiline);
    }


    // Icon padding
    if (leftIcon) {
      baseStyles.push(styles.inputWithLeftIcon);
    }
    if (rightIcon || secureTextEntry || clearable) {
      baseStyles.push(styles.inputWithRightIcon);
    }

    return baseStyles;
  };

  const getLabelStyles = () => {
    const baseStyles = [styles.label];
    
    if (variant === 'floating') {
      baseStyles.push(styles.labelFloating);
      if (isFocused || value) {
        baseStyles.push(styles.labelFloatingActive);
      }
    }
    
    if (error) {
      baseStyles.push(styles.labelError);
    }
    

    return baseStyles;
  };

  const getIconColor = () => {
    if (disabled) return '#ccc';
    if (error) return '#FF5722';
    if (isFocused) return '#000000';
    return '#999';
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    
    return (
      <TouchableOpacity
        style={styles.leftIconContainer}
        onPress={onLeftIconPress}
        disabled={!onLeftIconPress}
      >
        <FontAwesome
          name={leftIcon}
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
          color={getIconColor()}
        />
      </TouchableOpacity>
    );
  };

  const renderRightIcons = () => {
    const icons = [];
    
    // Clear button
    if (clearable && value && !disabled) {
      icons.push(
        <TouchableOpacity
          key="clear"
          style={styles.rightIconButton}
          onPress={handleClear}
        >
          <FontAwesome
            name="times-circle"
            size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
            color={getIconColor()}
          />
        </TouchableOpacity>
      );
    }
    
    // Password toggle
    if (secureTextEntry) {
      icons.push(
        <TouchableOpacity
          key="password"
          style={styles.rightIconButton}
          onPress={togglePasswordVisibility}
        >
          <FontAwesome
            name={showPassword ? 'eye-slash' : 'eye'}
            size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
            color={getIconColor()}
          />
        </TouchableOpacity>
      );
    }
    
    // Custom right icon
    if (rightIcon) {
      icons.push(
        <TouchableOpacity
          key="custom"
          style={styles.rightIconButton}
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
        >
          <FontAwesome
            name={rightIcon}
            size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
            color={getIconColor()}
          />
        </TouchableOpacity>
      );
    }
    
    if (icons.length === 0) return null;
    
    return (
      <ThemedView style={styles.rightIconContainer}>
        {icons}
      </ThemedView>
    );
  };

  const renderLabel = () => {
    if (!label) return null;
    
    if (variant === 'floating') {
      const labelTop = labelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      });
      
      const labelFontSize = labelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
      });
      
      return (
        <Animated.View style={[styles.floatingLabelContainer, { top: labelTop }]}>
          <Animated.Text style={[
            getLabelStyles(),
            { fontSize: labelFontSize },
            labelStyle
          ]}>
            {label}{required && ' *'}
          </Animated.Text>
        </Animated.View>
      );
    }
    
    return (
      <ThemedText style={[getLabelStyles(), labelStyle]}>
        {label}{required && ' *'}
      </ThemedText>
    );
  };

  const renderHelperText = () => {
    const hasHelper = helperText || showCharacterCount;
    if (!hasHelper) return null;
    
    return (
      <ThemedView style={styles.helperContainer}>
        {helperText && (
          <ThemedText style={[
            styles.helperText,
          ]}>
            {helperText}
          </ThemedText>
        )}
        {showCharacterCount && maxLength && (
          <ThemedText style={[
            styles.characterCount,
          ]}>
            {value?.length || 0}/{maxLength}
          </ThemedText>
        )}
      </ThemedView>
    );
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <ThemedText style={[styles.errorText, errorStyle]}>
        {error}
      </ThemedText>
    );
  };

  return (
    <ThemedView style={[styles.fieldContainer, containerStyle]}>
      {variant !== 'floating' && renderLabel()}
      
      <ThemedView style={getContainerStyles()}>
        {renderLeftIcon()}
        
        {variant === 'floating' && renderLabel()}
        
        <TextInput
          ref={ref}
          style={[getInputStyles(), inputStyle]}
          placeholder={isFocused || variant === 'floating' ? '' : placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable && !disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry && !showPassword}
          testID={testID}
          {...props}
        />
        
        {renderRightIcons()}
      </ThemedView>
      
      {renderError()}
      {renderHelperText()}
    </ThemedView>
  );
});

InputField.displayName = 'InputField';

export default InputField;

// Preset configurations
export const InputPresets = {
  email: {
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    autoComplete: 'email',
    leftIcon: 'envelope'
  },
  password: {
    secureTextEntry: true,
    autoCapitalize: 'none',
    leftIcon: 'lock'
  },
  phone: {
    keyboardType: 'phone-pad',
    leftIcon: 'phone'
  },
  search: {
    leftIcon: 'search',
    clearable: true,
    placeholder: 'Search...'
  },
  currency: {
    keyboardType: 'numeric',
    leftIcon: 'rupee'
  }
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  
  // Container styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  containerDefault: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  containerFilled: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  containerUnderlined: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: 0,
  },
  
  // Size styles
  containerSmall: {
    minHeight: 36,
  },
  containerMedium: {
    minHeight: 44,
  },
  containerLarge: {
    minHeight: 52,
  },
  
  // State styles
  containerFocused: {
    borderColor: '#000000',
  },
  containerOutlinedFocused: {
    borderWidth: 2,
  },
  containerError: {
    borderColor: '#FF5722',
  },
  containerDisabled: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  
  // Input styles
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  inputSmall: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputMedium: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLarge: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  
  // Label styles
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  labelError: {
    color: '#FF5722',
  },
  labelFloating: {
    position: 'absolute',
    left: 16,
    color: '#999',
    backgroundColor: 'transparent',
  },
  labelFloatingActive: {
    color: '#000000',
  },
  floatingLabelContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  
  // Icon styles
  leftIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  rightIconContainer: {
    flexDirection: 'row',
    paddingRight: 16,
    paddingLeft: 8,
  },
  rightIconButton: {
    marginLeft: 8,
  },
  
  // Helper and error styles
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 6,
  },
});