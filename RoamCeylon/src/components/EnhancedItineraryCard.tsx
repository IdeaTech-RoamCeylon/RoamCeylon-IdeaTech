import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TripActivity } from '../services/aiService';
import { PreferenceTag } from './PreferenceTag';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface EnhancedItineraryCardProps {
  activity: TripActivity;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const getCategoryIcon = (category?: string, description?: string): string => {
  if (category) {
    switch (category.toLowerCase()) {
      case 'culture': return '🏛️';
      case 'nature': return '🌿';
      case 'beach': return '🏖️';
      case 'adventure': return '⛰️';
      case 'relaxation': return '🧘';
      case 'history': return '📜';
      case 'sightseeing': return '👁️';
      case 'arrival': return '✈️';
      default: break;
    }
  }
  
  if (!description) return '📍';
  const lower = description.toLowerCase();
  if (lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe')) {
    return '🍽️';
  }
  if (lower.includes('hotel') || lower.includes('check-in') || lower.includes('accommodation') || lower.includes('resort')) {
    return '🏨';
  }
  if (lower.includes('temple') || lower.includes('fort') || lower.includes('museum') || lower.includes('palace')) {
    return '🏛️';
  }
  if (lower.includes('beach') || lower.includes('ocean') || lower.includes('sea')) {
    return '🏖️';
  }
  if (lower.includes('hike') || lower.includes('trek') || lower.includes('mountain') || lower.includes('climb')) {
    return '⛰️';
  }
  if (lower.includes('shop') || lower.includes('market') || lower.includes('bazaar')) {
    return '🛍️';
  }
  if (lower.includes('safari') || lower.includes('wildlife') || lower.includes('park')) {
    return '🦁';
  }
  if (lower.includes('train') || lower.includes('railway')) {
    return '🚂';
  }
  if (lower.includes('tea') || lower.includes('plantation')) {
    return '🍵';
  }
  return '📍';
};

const getMockCost = (description: string, budget: string = 'Medium'): number => {
  const lower = description.toLowerCase();
  const multipliers = { Low: 0.5, Medium: 1, High: 1.5, Luxury: 2.5 };
  const multiplier = multipliers[budget as keyof typeof multipliers] || 1;

  if (lower.includes('hotel') || lower.includes('accommodation') || lower.includes('resort')) {
    return Math.round(80 * multiplier);
  }
  if (lower.includes('breakfast')) return Math.round(10 * multiplier);
  if (lower.includes('lunch')) return Math.round(15 * multiplier);
  if (lower.includes('dinner')) return Math.round(20 * multiplier);
  if (lower.includes('temple') || lower.includes('fort')) return Math.round(8 * multiplier);
  if (lower.includes('safari') || lower.includes('wildlife')) return Math.round(50 * multiplier);
  if (lower.includes('train')) return Math.round(5 * multiplier);
  
  return Math.round(12 * multiplier);
};

const getMockDuration = (description: string): string => {
  const lower = description.toLowerCase();
  if (lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner')) {
    return '1-2 hrs';
  }
  if (lower.includes('hotel') || lower.includes('check-in')) {
    return '15 min';
  }
  if (lower.includes('safari') || lower.includes('wildlife')) {
    return '3-4 hrs';
  }
  if (lower.includes('hike') || lower.includes('trek')) {
    return '2-3 hrs';
  }
  if (lower.includes('temple') || lower.includes('fort') || lower.includes('museum')) {
    return '1-2 hrs';
  }
  return '1-2 hrs';
};

const getMockTime = (index: number): string => {
  const startHour = 8 + (index * 2); // Start at 8 AM, add 2 hours per activity
  if (startHour < 12) return `${startHour < 10 ? '0' : ''}${startHour}:00 AM`;
  if (startHour === 12) return `12:00 PM`;
  const pmHour = startHour - 12;
  return `${pmHour < 10 ? '0' : ''}${pmHour}:00 PM`;
};

const EnhancedItineraryCard: React.FC<EnhancedItineraryCardProps> = ({
  activity,
  index,
  isSelected,
  onPress,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
}) => {
  const icon = getCategoryIcon(activity.category, activity.description);
  const cost = getMockCost(activity.description);
  const duration = getMockDuration(activity.description);
  const time = getMockTime(index);
  
  const hasPreferences = activity.matchedPreferences && activity.matchedPreferences.length > 0;
  const hasTips = activity.tips && activity.tips.length > 0;

  return (
    <View style={styles.timelineRow}>
      {/* Timeline Indicator */}
      <View style={styles.timelineIndicatorContainer}>
        <View style={styles.timelineDotHalo}>
          <View style={styles.timelineDot} />
        </View>
      </View>

      {/* Card Content */}
      <TouchableOpacity
        style={[styles.cardContainer, isSelected && styles.selectedContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.timeLabel}>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <Text style={styles.categoryIcon}>{icon}</Text>
        </View>

        <Text style={styles.titleText}>{activity.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💰</Text>
            <Text style={styles.metaText}>${cost}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{duration}</Text>
          </View>
          {activity.confidenceScore && (
             <View style={styles.metaItem}>
                <ConfidenceIndicator level={activity.confidenceScore} compact />
             </View>
          )}
        </View>

        {activity.hasPositiveFeedback && (
          <View style={styles.positiveFeedbackContainer}>
            <Text style={styles.positiveFeedbackIcon}>✨</Text>
            <Text style={styles.positiveFeedbackText}>Based on your positive history</Text>
          </View>
        )}

        {hasPreferences && (
          <View style={styles.preferencesContainer}>
            <View style={styles.preferencesTags}>
              {activity.matchedPreferences!.map((pref) => (
                <PreferenceTag key={pref} preference={pref} variant="compact" />
              ))}
            </View>
          </View>
        )}

        {hasTips && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsText}>{activity.tips![0]}</Text>
          </View>
        )}

        {(onMoveUp || onMoveDown || onDelete) && (
          <View style={styles.actions}>
            {onMoveUp && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !canMoveUp && styles.actionButtonDisabled,
                ]}
                onPress={onMoveUp}
                disabled={!canMoveUp}
              >
                <Text style={styles.actionText}>↑</Text>
              </TouchableOpacity>
            )}
            {onMoveDown && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !canMoveDown && styles.actionButtonDisabled,
                ]}
                onPress={onMoveDown}
                disabled={!canMoveDown}
              >
                <Text style={styles.actionText}>↓</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineIndicatorContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 15,
  },
  timelineDotHalo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFC107',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedContainer: {
    borderColor: '#FFC107',
    backgroundColor: '#FFFDF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeLabel: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  categoryIcon: {
    fontSize: 20,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  positiveFeedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  positiveFeedbackIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  positiveFeedbackText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  preferencesContainer: {
    marginBottom: 12,
  },
  preferencesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  tipsIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  deleteText: {
    fontSize: 14,
  },
});

export default React.memo(EnhancedItineraryCard);
