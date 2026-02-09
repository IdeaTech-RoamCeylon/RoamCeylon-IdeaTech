import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PreferenceTagProps {
  preference: string;
  variant?: 'default' | 'compact';
}

export const PreferenceTag: React.FC<PreferenceTagProps> = ({ 
  preference, 
  variant = 'default' 
}) => {
  return (
    <View style={[styles.container, variant === 'compact' && styles.compact]}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={[styles.text, variant === 'compact' && styles.textCompact]}>
        {preference}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  checkmark: {
    fontSize: 12,
    color: '#1976D2',
    marginRight: 4,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  textCompact: {
    fontSize: 12,
  },
});

export default PreferenceTag;
