import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface PaceOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const PACE_OPTIONS: PaceOption[] = [
  { 
    id: 'Relaxed', 
    label: 'Relaxed', 
    icon: '🐢', 
    description: 'Take it slow, plenty of downtime' 
  },
  { 
    id: 'Moderate', 
    label: 'Moderate', 
    icon: '🚶', 
    description: 'Balanced mix of activities and rest' 
  },
  { 
    id: 'Fast-Paced', 
    label: 'Fast-Paced', 
    icon: '🏃', 
    description: 'Pack in as much as possible' 
  },
];

interface PaceSelectorProps {
  selectedPace: string;
  onPaceChange: (pace: string) => void;
}

export const PaceSelector = React.memo(({
  selectedPace,
  onPaceChange,
}: PaceSelectorProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.paceOptions}>
        {PACE_OPTIONS.map((pace) => {
          const isSelected = selectedPace === pace.id;
          return (
            <TouchableOpacity
              key={pace.id}
              style={[
                styles.paceOption,
                isSelected && styles.paceOptionSelected,
              ]}
              onPress={() => onPaceChange(pace.id)}
              activeOpacity={0.7}
            >
              <View style={styles.paceHeader}>
                <Text style={styles.paceIcon}>{pace.icon}</Text>
                <Text
                  style={[
                    styles.paceLabel,
                    isSelected && styles.paceLabelSelected,
                  ]}
                >
                  {pace.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.paceDescription,
                  isSelected && styles.paceDescriptionSelected,
                ]}
              >
                {pace.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

PaceSelector.displayName = 'PaceSelector';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paceOptions: {
    gap: 10,
  },
  paceOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  paceOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066CC',
    borderWidth: 2,
  },
  paceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  paceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paceLabelSelected: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  paceDescription: {
    fontSize: 12,
    color: '#888',
    marginLeft: 28,
  },
  paceDescriptionSelected: {
    color: '#0066CC',
  },
});
