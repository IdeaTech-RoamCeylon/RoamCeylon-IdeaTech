import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { TripActivity } from '../services/aiService';

interface ItineraryListProps {
  activities: TripActivity[];
  onActivitySelect?: (activity: TripActivity) => void;
  selectedActivity?: TripActivity | null;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDelete?: (index: number) => void;
}

interface ItineraryItemProps {
  activity: TripActivity;
  index: number;
  isSelected: boolean;
  isLast: boolean;
  onSelect?: (activity: TripActivity) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDelete?: (index: number) => void;
}

const ItineraryItem = React.memo(({ 
  activity, 
  index, 
  isSelected, 
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete 
}: ItineraryItemProps) => {
  const hasCoordinate = !!activity.coordinate;

  return (
    <View style={styles.activityRow}>
      <View style={styles.timelineContainer}>
          <View style={[styles.dot, isSelected && styles.selectedDot]} />
          {!isLast && <View style={styles.line} />}
      </View>
      <TouchableOpacity 
          style={styles.contentContainer}
          activeOpacity={hasCoordinate ? 0.7 : 1}
          onPress={() => hasCoordinate && onSelect?.(activity)}
      >
          <Text style={[
              styles.activityText, 
              isSelected && styles.selectedActivityText,
              !hasCoordinate && styles.dimmedText
          ]}>
              {activity.description}
          </Text>

          {isSelected && (
            <View style={styles.controlsContainer}>
              <View style={styles.moveControls}>
                {index > 0 && (
                  <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={() => onMoveUp?.(index)}
                  >
                    <Text style={styles.controlText}>⬆️</Text>
                  </TouchableOpacity>
                )}
                
                {!isLast && (
                  <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={() => onMoveDown?.(index)}
                  >
                    <Text style={styles.controlText}>⬇️</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.deleteButton]} 
                onPress={() => onDelete?.(index)}
              >
                <Text style={styles.controlText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.activity.description === nextProps.activity.description &&
    prevProps.index === nextProps.index
  );
});

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
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  moveControls: {
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    marginRight: 0,
  },
  controlText: {
    fontSize: 16,
  },
});

export default ItineraryList;
