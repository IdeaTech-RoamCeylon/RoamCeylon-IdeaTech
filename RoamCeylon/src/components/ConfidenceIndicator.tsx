import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceIndicatorProps {
  level: 'High' | 'Medium' | 'Low';
  compact?: boolean;
}

const getIndicatorConfig = (level: 'High' | 'Medium' | 'Low') => {
  switch (level) {
    case 'High':
      return { icon: '🟢', label: 'High match', color: '#4CAF50' };
    case 'Medium':
      return { icon: '🟡', label: 'Good match', color: '#FFC107' };
    case 'Low':
      return { icon: '🟠', label: 'Suggested', color: '#FF9800' };
  }
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ 
  level, 
  compact = false 
}) => {
  const config = getIndicatorConfig(level);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{config.icon}</Text>
      {!compact && (
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConfidenceIndicator;
