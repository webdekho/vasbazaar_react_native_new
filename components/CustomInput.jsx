import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export const CustomSearchInput = ({ 
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = "#666",
  editable = true,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon()}</View>}
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        editable={editable}
        {...props}
      />
      {rightIcon && <View style={styles.rightIconContainer}>{rightIcon()}</View>}
    </View>
  );
};

export const CustomInput = ({ 
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = "#666",
  editable = true,
  keyboardType = "default",
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <TextInput
        style={[styles.textInput, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        editable={editable}
        keyboardType={keyboardType}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
});