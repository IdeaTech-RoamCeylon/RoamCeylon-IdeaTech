import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TripActivity } from '../services/aiService';

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

const getActivityIcon = (description: string): string => {
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

const getMockRating = (): number => {
  return 4 + Math.random(); // Random rating between 4.0 and 5.0
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
  const icon = getActivityIcon(activity.description);
  const cost = getMockCost(activity.description);
  const duration = getMockDuration(activity.description);
  const rating = getMockRating();

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.index}>#{index + 1}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{activity.description}</Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>💰</Text>
          <Text style={styles.metaText}>${cost}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱️</Text>
          <Text style={styles.metaText}>{duration}</Text>
        </View>
        {activity.coordinate && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>On Map</Text>
          </View>
        )}
      </View>

      {(onMoveUp || onMoveDown || onDelete) && (
        <View style={styles.actions}>
          {onMoveUp && (
            <TouchableOpacity
              style={[styles.actionButton, !canMoveUp && styles.actionButtonDisabled]}
              onPress={onMoveUp}
              disabled={!canMoveUp}
            >
              <Text style={styles.actionText}>↑</Text>
            </TouchableOpacity>
          )}
          {onMoveDown && (
            <TouchableOpacity
              style={[styles.actionButton, !canMoveDown && styles.actionButtonDisabled]}
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedContainer: {
    borderColor: '#0066CC',
    backgroundColor: '#f0f7ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  index: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
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
    fontSize: 16,
  },
});

export default React.memo(EnhancedItineraryCard);
