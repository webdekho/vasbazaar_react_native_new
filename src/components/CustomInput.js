import React, { forwardRef, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import PropTypes from 'prop-types';
import { inputStyles, inputTheme } from '../styles/inputStyles';

/**
 * Versatile custom input component with extensive styling and functionality options.
 * Supports standard TextInput, Material Design Paper inputs, icons, and validation.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {string} [props.value] - Input value
 * @param {Function} props.onChangeText - Text change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.label] - Input label
 * @param {string} [props.helperText] - Helper text below input
 * @param {string} [props.errorText] - Error message to display
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.secureTextEntry=false] - Whether to hide input text
 * @param {boolean} [props.multiline=false] - Whether input is multiline
 * @param {boolean} [props.usePaperInput=false] - Whether to use Material Design Paper input
 * @param {Object} [props.leftIcon] - Left icon configuration
 * @param {Object} [props.rightIcon] - Right icon configuration
 * @param {Object} [props.style] - Custom input styles
 * @param {Object} [props.containerStyle] - Custom container styles
 * @returns {React.ReactElement} The rendered CustomInput component
 * 
 * @example
 * // Basic input
 * <CustomInput 
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter email"
 *   label="Email Address"
 * />
 * 
 * @example
 * // Paper input with validation
 * <CustomInput 
 *   usePaperInput={true}
 *   value={password}
 *   onChangeText={setPassword}
 *   label="Password"
 *   secureTextEntry={true}
 *   errorText={passwordError}
 *   required={true}
 * />
 */
const CustomInput = forwardRef(({
  // Basic props
  value,
  onChangeText,
  placeholder,
  label,
  helperText,
  errorText,
  required = false,

  // Input behavior
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  maxLength,
  editable = true,
  autoFocus = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardType = 'default',
  returnKeyType = 'default',
  textContentType,

  // Styling
  style,
  inputStyle,
  containerStyle,
  labelStyle,
  errorStyle,
  placeholderTextColor,

  // Icons and actions
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,

  // Paper input specific (Material Design)
  mode = 'flat', // 'flat' or 'outlined' for paper inputs
  usePaperInput = false,
  paperTheme,

  // Events
  onFocus,
  onBlur,
  onSubmitEditing,
  onKeyPress,

  // Other props
  testID,
  accessibilityLabel,
  ...otherProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const toggleSecureText = () => {
    setIsSecure(!isSecure);
  };

  // Determine input state styles
  const getInputStateStyle = () => {
    const stateStyles = [];
    
    if (isFocused) stateStyles.push(inputStyles.inputFocused);
    if (errorText) stateStyles.push(inputStyles.inputError);
    if (!editable) stateStyles.push(inputStyles.inputDisabled);
    if (leftIcon) stateStyles.push(inputStyles.inputWithLeftIcon);
    if (rightIcon || secureTextEntry) stateStyles.push(inputStyles.inputWithRightIcon);
    if (multiline) stateStyles.push(inputStyles.multilineInput);

    return stateStyles;
  };

  // Handle secure text entry icon
  const getRightIcon = () => {
    if (secureTextEntry) {
      return {
        name: isSecure ? 'eye-off' : 'eye',
        onPress: toggleSecureText,
      };
    }
    return rightIcon;
  };

  const finalRightIcon = getRightIcon();

  // Paper Input (Material Design) rendering
  if (usePaperInput) {
    const paperInputProps = {
      ref,
      label,
      value,
      onChangeText,
      placeholder,
      secureTextEntry: isSecure,
      multiline,
      numberOfLines,
      maxLength,
      disabled: !editable,
      autoFocus,
      autoCapitalize,
      autoCorrect,
      keyboardType,
      returnKeyType,
      textContentType,
      mode,
      error: !!errorText,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onSubmitEditing,
      testID,
      accessibilityLabel,
      style: [inputStyles.paperInput, inputStyle],
      contentStyle: [inputStyles.paperInputContent],
      theme: paperTheme || {
        colors: {
          primary: inputTheme.colors.focusedBorder,
          background: inputTheme.colors.background,
          surface: inputTheme.colors.surface,
          error: inputTheme.colors.error,
          text: inputTheme.colors.text,
          placeholder: inputTheme.colors.placeholder,
        },
      },
      ...otherProps,
    };

    // Add left icon if provided
    if (leftIcon) {
      paperInputProps.left = (
        <PaperTextInput.Icon 
          icon={leftIcon.name} 
          onPress={leftIcon.onPress}
          size={leftIcon.size || 20}
        />
      );
    }

    // Add right icon if provided
    if (finalRightIcon) {
      paperInputProps.right = (
        <PaperTextInput.Icon 
          icon={finalRightIcon.name} 
          onPress={finalRightIcon.onPress}
          size={finalRightIcon.size || 20}
        />
      );
    }

    return (
      <View style={[inputStyles.inputContainer, containerStyle]}>
        <View style={inputStyles.paperInputContainer}>
          <PaperTextInput {...paperInputProps} />
        </View>
        {errorText && (
          <Text style={[inputStyles.errorText, errorStyle]}>
            {errorText}
          </Text>
        )}
        {helperText && !errorText && (
          <Text style={inputStyles.helperText}>
            {helperText}
          </Text>
        )}
      </View>
    );
  }

  // Standard TextInput rendering
  return (
    <View style={[inputStyles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[
          inputStyles.label,
          required && inputStyles.labelRequired,
          labelStyle
        ]}>
          {label}
          {required && ' *'}
        </Text>
      )}
      
      <View style={{ position: 'relative' }}>
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity
            style={inputStyles.leftIconContainer}
            onPress={onLeftIconPress || leftIcon.onPress}
            disabled={!onLeftIconPress && !leftIcon.onPress}
          >
            {typeof leftIcon === 'function' ? leftIcon() : leftIcon}
          </TouchableOpacity>
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            placeholderTextColor || 
            (editable ? inputTheme.colors.placeholder : inputTheme.colors.placeholder)
          }
          secureTextEntry={isSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          autoFocus={autoFocus}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          style={[
            inputStyles.baseInput,
            ...getInputStateStyle(),
            inputStyle,
            style,
          ]}
          {...otherProps}
        />

        {/* Right Icon */}
        {finalRightIcon && (
          <TouchableOpacity
            style={inputStyles.rightIconContainer}
            onPress={onRightIconPress || finalRightIcon.onPress}
            disabled={!onRightIconPress && !finalRightIcon.onPress}
          >
            {typeof finalRightIcon === 'function' ? finalRightIcon() : finalRightIcon}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Text */}
      {errorText && (
        <Text style={[inputStyles.errorText, errorStyle]}>
          {errorText}
        </Text>
      )}

      {/* Helper Text */}
      {helperText && !errorText && (
        <Text style={inputStyles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
});

// PIN Input Component for OTP/PIN entry
export const CustomPinInput = forwardRef(({
  value = '',
  onChangeText,
  length = 4,
  style,
  containerStyle,
  inputStyle,
  focusedStyle,
  filledStyle,
  onComplete,
  secureTextEntry = true,
  autoFocus = false,
  keyboardType = 'numeric',
  ...otherProps
}, ref) => {
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = React.useRef([]);

  // Initialize refs array
  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    for (let i = inputRefs.current.length; i < length; i++) {
      inputRefs.current.push(React.createRef());
    }
  }, [length]);

  const handleChangeText = (text, index) => {
    const newValue = value.split('');
    newValue[index] = text;
    const updatedValue = newValue.join('');
    
    onChangeText?.(updatedValue);

    // Auto-focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.current?.focus();
    }

    // Call onComplete when all fields are filled
    if (updatedValue.length === length) {
      onComplete?.(updatedValue);
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    }
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const getInputStyle = (index) => {
    const styles = [inputStyles.pinInput];
    
    if (focusedIndex === index) {
      styles.push(inputStyles.pinInputFocused, focusedStyle);
    }
    
    if (value[index]) {
      styles.push(inputStyles.pinInputFilled, filledStyle);
    }
    
    styles.push(inputStyle);
    
    return styles;
  };

  return (
    <View style={[inputStyles.pinContainer, containerStyle, style]}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={inputRefs.current[index]}
          value={value[index] || ''}
          onChangeText={(text) => handleChangeText(text.slice(-1), index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          maxLength={1}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textAlign="center"
          selectTextOnFocus
          style={getInputStyle(index)}
          {...otherProps}
        />
      ))}
    </View>
  );
});

// Search Input Component
export const CustomSearchInput = forwardRef(({
  value,
  onChangeText,
  placeholder = 'Search...',
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  containerStyle,
  inputStyle,
  iconStyle,
  showSearchIcon = true,
  ...otherProps
}, ref) => {
  const SearchIcon = leftIcon || (showSearchIcon && (() => (
    <Text style={[inputStyles.searchIcon, iconStyle]}>🔍</Text>
  )));

  return (
    <View style={[inputStyles.searchContainer, containerStyle]}>
      {SearchIcon && (
        <TouchableOpacity onPress={onLeftIconPress} disabled={!onLeftIconPress}>
          {typeof SearchIcon === 'function' ? <SearchIcon /> : SearchIcon}
        </TouchableOpacity>
      )}
      
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={inputTheme.colors.placeholder}
        style={[inputStyles.searchInput, inputStyle]}
        {...otherProps}
      />
      
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
          {typeof rightIcon === 'function' ? rightIcon() : rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';
CustomPinInput.displayName = 'CustomPinInput';
CustomSearchInput.displayName = 'CustomSearchInput';

export default CustomInput;