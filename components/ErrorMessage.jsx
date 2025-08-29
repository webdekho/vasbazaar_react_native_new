import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function ErrorMessage({ message, visible = true, style = {} }) {
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
    backgroundColor: '#fef2f2', // Very light red background
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  border: {
    width: 4,
    height: '100%',
    backgroundColor: '#dc2626', // Red border
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 24, // Extra padding for the red border
  },
  message: {
    color: '#dc2626', // Red text
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});