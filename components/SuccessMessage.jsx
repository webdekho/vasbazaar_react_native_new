import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function SuccessMessage({ message, visible = true, style = {} }) {
  if (!visible || !message) {
    return null;
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.border} />
      <ThemedView style={styles.content}>
        <ThemedText style={styles.message}>{message}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9f4', // Very light green background
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  border: {
    width: 4,
    height: '100%',
    backgroundColor: '#16a34a', // Green border
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 24, // Extra padding for the green border
  },
  message: {
    color: '#16a34a', // Green text
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});