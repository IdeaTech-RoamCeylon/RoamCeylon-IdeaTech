import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface Interest {
  id: string;
  label: string;
  icon: string;
}

export const INTERESTS: Interest[] = [
  { id: 'culture', label: 'Culture & Heritage', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure & Nature', icon: '🏔️' },
  { id: 'food', label: 'Food & Dining', icon: '🍜' },
  { id: 'wellness', label: 'Relaxation & Wellness', icon: '🧘' },
  { id: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🎉' },
];

interface InterestSelectorProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
}

export const InterestSelector = React.memo(({
  selectedInterests,
  onInterestsChange,
}: InterestSelectorProps) => {
  const handleToggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      // Remove interest
      onInterestsChange(selectedInterests.filter(id => id !== interestId));
    } else {
      // Add interest
      onInterestsChange([...selectedInterests, interestId]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.interestsGrid}>
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          return (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestChip,
                isSelected && styles.interestChipSelected,
              ]}
              onPress={() => handleToggleInterest(interest.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.interestIcon}>{interest.icon}</Text>
              <Text
                style={[
                  styles.interestLabel,
                  isSelected && styles.interestLabelSelected,
                ]}
              >
                {interest.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

InterestSelector.displayName = 'InterestSelector';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  interestChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066CC',
  },
  interestIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  interestLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  interestLabelSelected: {
    color: '#0066CC',
    fontWeight: '600',
  },
});
