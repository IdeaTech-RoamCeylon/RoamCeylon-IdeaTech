import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EndOfListIndicatorProps {
  message?: string;
  showBackToTop?: boolean;
  onBackToTop?: () => void;
}

export const EndOfListIndicator = React.memo(({
  message = "You've reached the end",
  showBackToTop = false,
  onBackToTop,
}: EndOfListIndicatorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.message}>{message}</Text>
      {showBackToTop && onBackToTop && (
        <TouchableOpacity style={styles.button} onPress={onBackToTop}>
          <Text style={styles.buttonText}>↑ Back to Top</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

EndOfListIndicator.displayName = 'EndOfListIndicator';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
  },
});
