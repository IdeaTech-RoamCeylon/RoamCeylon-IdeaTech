import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingFooterProps {
  message?: string;
}

export const LoadingFooter = React.memo(({ message = 'Loading more...' }: LoadingFooterProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#0066CC" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
});

LoadingFooter.displayName = 'LoadingFooter';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  text: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});
