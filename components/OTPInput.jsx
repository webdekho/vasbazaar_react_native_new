import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform, Clipboard } from 'react-native';

export default function OTPInput({ 
  length = 6, 
  value = [],
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  style,
  containerStyle,
  cellStyle,
  cellStyleFocused,
  textStyle,
  secureTextEntry = false,
}) {
  const [otp, setOtp] = useState(value.length > 0 ? value : new Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value && value.length > 0) {
      setOtp(value);
    }
  }, [value]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (autoFocus) {
      setTimeout(() => {
        try {
          if (inputRefs.current[0] && inputRefs.current[0].focus) {
            inputRefs.current[0].focus();
          }
        } catch (error) {
          console.log('Auto-focus not available:', error);
        }
      }, 100);
    }
  }, [autoFocus]);

  const handleOtpChange = (text, index) => {
    // Handle paste operation
    if (text.length > 1) {
      handlePaste(text);
      return;
    }

    // Handle single character input - only allow numbers
    const numericText = text.replace(/\D/g, '');
    if (numericText.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericText;
      setOtp(newOtp);
      
      if (onChange) {
        onChange(newOtp);
      }

      // Move to next input
      if (numericText && index < length - 1) {
        setTimeout(() => {
          if (inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
          }
        }, 10);
      }

      // Check if OTP is complete
      const completeOtp = [...newOtp];
      if (completeOtp.every(digit => digit !== '')) {
        if (onComplete) {
          setTimeout(() => {
            onComplete(completeOtp.join(''));
          }, 100);
        }
      }
    }
  };

  const handlePaste = async (pastedText) => {
    // Clean the pasted text to only include numbers
    const cleanedText = pastedText.replace(/\D/g, '');
    
    if (cleanedText.length === 0) return;

    // Split the pasted text into individual digits
    const pastedDigits = cleanedText.slice(0, length).split('');
    const newOtp = [...otp];

    // Fill the OTP fields with pasted digits
    pastedDigits.forEach((digit, index) => {
      if (index < length) {
        newOtp[index] = digit;
      }
    });

    // Fill remaining fields with empty strings
    for (let i = pastedDigits.length; i < length; i++) {
      newOtp[i] = '';
    }

    setOtp(newOtp);
    
    if (onChange) {
      onChange(newOtp);
    }

    // Focus the next empty field or the last field
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    
    setTimeout(() => {
      try {
        if (inputRefs.current[focusIndex] && inputRefs.current[focusIndex].focus) {
          inputRefs.current[focusIndex].focus();
        }
      } catch (error) {
        console.log('Focus not available:', error);
      }
    }, 100);

    // Check if OTP is complete after paste
    if (newOtp.every(digit => digit !== '')) {
      if (onComplete) {
        setTimeout(() => {
          onComplete(newOtp.join(''));
        }, 100);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input and clear it
      const prevIndex = index - 1;
      const newOtp = [...otp];
      newOtp[prevIndex] = '';
      setOtp(newOtp);
      
      if (onChange) {
        onChange(newOtp);
      }
      
      setTimeout(() => {
        try {
          if (inputRefs.current[prevIndex] && inputRefs.current[prevIndex].focus) {
            inputRefs.current[prevIndex].focus();
          }
        } catch (error) {
          console.log('Focus not available:', error);
        }
      }, 10);
    }
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
    
    // Select text on focus for easy replacement
    // Use setTimeout to ensure the input is fully focused
    if (inputRefs.current[index] && otp[index]) {
      setTimeout(() => {
        try {
          // Check if setSelection method exists before calling
          if (inputRefs.current[index] && typeof inputRefs.current[index].setSelection === 'function') {
            inputRefs.current[index].setSelection(0, 1);
          } else if (inputRefs.current[index] && inputRefs.current[index].select) {
            // Fallback to select() method
            inputRefs.current[index].select();
          }
        } catch (error) {
          // Silently handle if selection methods are not available
          console.log('Text selection not available on this platform');
        }
      }, 50);
    }
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  // Handle clipboard paste on web
  const handleWebPaste = async (e, index) => {
    if (Platform.OS === 'web' && e && e.clipboardData) {
      try {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        if (pastedData) {
          handlePaste(pastedData);
        }
      } catch (error) {
        console.log('Web paste error:', error);
      }
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length }, (_, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            cellStyle,
            focusedIndex === index && styles.cellFocused,
            focusedIndex === index && cellStyleFocused,
            style,
          ]}
        >
          <TextInput
            ref={ref => {
              try {
                inputRefs.current[index] = ref;
              } catch (error) {
                console.log('Ref assignment error:', error);
              }
            }}
            style={[styles.input, textStyle]}
            value={otp[index] || ''}
            onChangeText={text => {
              try {
                handleOtpChange(text, index);
              } catch (error) {
                console.log('OTP change error:', error);
              }
            }}
            onKeyPress={e => {
              try {
                handleKeyPress(e, index);
              } catch (error) {
                console.log('Key press error:', error);
              }
            }}
            onFocus={() => {
              try {
                handleFocus(index);
              } catch (error) {
                console.log('Focus error:', error);
              }
            }}
            onBlur={() => {
              try {
                handleBlur();
              } catch (error) {
                console.log('Blur error:', error);
              }
            }}
            onPaste={e => {
              try {
                handleWebPaste(e, index);
              } catch (error) {
                console.log('Paste error:', error);
              }
            }}
            keyboardType="number-pad"
            maxLength={Platform.OS === 'android' ? 1 : 6} // Android needs 1, iOS can handle paste with 6
            selectionColor="#000000"
            underlineColorAndroid="transparent"
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'off'}
            importantForAutofill="yes"
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            caretHidden={Platform.OS === 'android'} // Hide caret on Android for cleaner look
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  cellFocused: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#111827',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      caretColor: 'transparent',
    }),
  },
});