import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TripDay } from '../services/aiService';

interface PreferenceSummaryBannerProps {
  selectedPreferences: string[];
  itinerary: TripDay[];
}

export const PreferenceSummaryBanner: React.FC<PreferenceSummaryBannerProps> = ({
  selectedPreferences,
  itinerary,
}) => {
  // Count how many activities match each preference
  const preferenceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    selectedPreferences.forEach(pref => {
      counts[pref] = 0;
    });

    itinerary.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.matchedPreferences) {
          activity.matchedPreferences.forEach(matched => {
            if (counts[matched] !== undefined) {
              counts[matched]++;
            }
          });
        }
      });
    });

    return counts;
  }, [selectedPreferences, itinerary]);

  // Filter to show only preferences that were actually matched
  const matchedPreferences = selectedPreferences.filter(pref => preferenceCounts[pref] > 0);

  if (matchedPreferences.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.title}>Personalized for your interests</Text>
      </View>
      <View style={styles.list}>
        {matchedPreferences.map(pref => (
          <View key={pref} style={styles.item}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.preferenceText}>
              {pref}
              <Text style={styles.count}> ({preferenceCounts[pref]} activities)</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkle: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#7B1FA2',
    marginRight: 8,
    fontWeight: 'bold',
  },
  preferenceText: {
    fontSize: 14,
    color: '#4A148C',
    fontWeight: '500',
  },
  count: {
    fontSize: 13,
    color: '#7B1FA2',
    fontWeight: '400',
  },
});

export default PreferenceSummaryBanner;
