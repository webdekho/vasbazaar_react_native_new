import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const SimpleCustomInput = React.forwardRef(({ 
  value, 
  onChangeText, 
  placeholder, 
  label,
  keyboardType = 'default',
  maxLength,
  errorText,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props 
}, ref) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        ref={ref}
        style={[styles.input, errorText && styles.inputError, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        maxLength={maxLength}
        {...props}
      />
      {errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
});

SimpleCustomInput.displayName = 'SimpleCustomInput';

SimpleCustomInput.propTypes = {
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  keyboardType: PropTypes.string,
  maxLength: PropTypes.number,
  errorText: PropTypes.string,
  containerStyle: PropTypes.object,
  inputStyle: PropTypes.object,
  labelStyle: PropTypes.object,
};

SimpleCustomInput.defaultProps = {
  keyboardType: 'default',
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default SimpleCustomInput;