import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { TripActivity } from '../services/aiService';

interface ItineraryListProps {
  activities: TripActivity[];
  onActivitySelect?: (activity: TripActivity) => void;
  selectedActivity?: TripActivity | null;
}

const ItineraryList: React.FC<ItineraryListProps> = ({ activities, onActivitySelect, selectedActivity }) => {
  return (
    <View style={styles.container}>
      {activities.map((activity, index) => {
        const isSelected = selectedActivity === activity;
        const hasCoordinate = !!activity.coordinate;
        
        return (
            <View key={index} style={styles.activityRow}>
            <View style={styles.timelineContainer}>
                <View style={[styles.dot, isSelected && styles.selectedDot]} />
                {index !== activities.length - 1 && <View style={styles.line} />}
            </View>
            <TouchableOpacity 
                style={styles.contentContainer}
                activeOpacity={hasCoordinate ? 0.7 : 1}
                onPress={() => hasCoordinate && onActivitySelect?.(activity)}
            >
                <Text style={[
                    styles.activityText, 
                    isSelected && styles.selectedActivityText,
                    !hasCoordinate && styles.dimmedText
                ]}>
                    {activity.description}
                </Text>
            </TouchableOpacity>
            </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineContainer: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066CC',
    marginTop: 5,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#0066CC',
    opacity: 0.3,
    marginVertical: 4,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 25,
    paddingLeft: 5,
  },
  activityText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: -5, 
    // Shadow for cards
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 2,
  },
  selectedActivityText: {
    borderColor: '#0066CC',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  dimmedText: {
    color: '#888',
    backgroundColor: '#FAFAFA',
  },
  selectedDot: {
    backgroundColor: '#FF9800',
    transform: [{ scale: 1.2 }],
  },
});

export default ItineraryList;
