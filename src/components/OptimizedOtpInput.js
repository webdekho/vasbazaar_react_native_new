import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

const OptimizedOtpInput = React.memo(({
  length = 6,
  onComplete,
  onChangeText,
  value = [],
  errorState = false,
  autoFocus = true,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef(Array(length).fill(null).map(() => React.createRef()));

  // Memoize styles to prevent recalculation
  const inputSize = useMemo(() => {
    if (width < 320) return Math.max((width - 60) / length, 40);
    if (width < 350) return Math.max((width - 80) / length, 45);
    return Math.min(width * 0.12, 55);
  }, [length]);

  const inputStyles = useMemo(() => ({
    width: inputSize,
    height: inputSize,
    fontSize: width < 320 ? 16 : width < 350 ? 18 : 24,
  }), [inputSize]);

  const handleInputChange = useCallback((index, text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newValue = [...value];
      newValue[index] = numericValue;
      onChangeText(newValue);

      // Auto-focus next input without setTimeout for instant response
      if (numericValue && index < length - 1) {
        inputRefs.current[index + 1]?.current?.focus();
        setFocusedIndex(index + 1);
      }

      // Check completion without delay
      if (newValue.every(digit => digit !== '') && newValue.join('').length === length) {
        onComplete?.(newValue.join(''));
      }
    }
  }, [value, length, onChangeText, onComplete]);

  const handleKeyPress = useCallback((index, event) => {
    if (event.nativeEvent.key === 'Backspace') {
      const newValue = [...value];
      
      if (value[index]) {
        newValue[index] = '';
        onChangeText(newValue);
      } else if (index > 0) {
        newValue[index - 1] = '';
        onChangeText(newValue);
        inputRefs.current[index - 1]?.current?.focus();
        setFocusedIndex(index - 1);
      }
    }
  }, [value, onChangeText]);

  const handleFocus = useCallback((index) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  const getInputStyle = useCallback((index) => {
    const baseStyle = [styles.otpInput, inputStyles];
    
    if (focusedIndex === index) {
      baseStyle.push(styles.focused);
    }
    if (value[index]) {
      baseStyle.push(styles.filled);
    }
    if (errorState) {
      baseStyle.push(styles.error);
    }
    
    return baseStyle;
  }, [focusedIndex, value, errorState, inputStyles]);

  return (
    <View style={styles.container}>
      {Array(length).fill(null).map((_, index) => (
        <TextInput
          key={index}
          ref={inputRefs.current[index]}
          style={getInputStyle(index)}
          value={value[index] || ''}
          onChangeText={(text) => handleInputChange(index, text)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          keyboardType="numeric"
          maxLength={1}
          returnKeyType={index === length - 1 ? 'done' : 'next'}
          onSubmitEditing={() => {
            if (index < length - 1) {
              inputRefs.current[index + 1]?.current?.focus();
            }
          }}
          textAlign="center"
          selectTextOnFocus
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus && index === 0}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: width < 320 ? 6 : width < 350 ? 8 : 12,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: width < 320 ? 8 : 10,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    color: '#000000',
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  focused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  filled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  error: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFFFFF',
  },
});

export default OptimizedOtpInput;