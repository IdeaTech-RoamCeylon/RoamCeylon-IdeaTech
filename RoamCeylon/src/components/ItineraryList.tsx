import React from 'react';
import { View, StyleSheet } from 'react-native';

import { TripActivity } from '../services/aiService';
import { ItineraryItem } from './ItineraryItem';

interface ItineraryListProps {
  activities: TripActivity[];
  onActivitySelect?: (activity: TripActivity) => void;
  selectedActivity?: TripActivity | null;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDelete?: (index: number) => void;
}

const ItineraryList: React.FC<ItineraryListProps> = ({ 
  activities, 
  onActivitySelect, 
  selectedActivity,
  onMoveUp,
  onMoveDown,
  onDelete
}) => {
  return (
    <View style={styles.container}>
      {activities.map((activity, index) => (
        <ItineraryItem
          key={`${index}-${activity.description}`}
          activity={activity}
          index={index}
          isSelected={selectedActivity === activity}
          isLast={index === activities.length - 1}
          onSelect={onActivitySelect}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
});

export default ItineraryList;
