import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { TripActivity } from '../services/aiService';
import { CONFIG } from '../config';

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
  const cat = (category || '').toLowerCase();
  const desc = (description || '').toLowerCase();
  if (cat === 'culture' || desc.includes('temple') || desc.includes('sacred')) return '🏛️';
  if (cat === 'nature' || desc.includes('garden') || desc.includes('botanical')) return '🌿';
  if (cat === 'beach' || desc.includes('beach') || desc.includes('ocean') || desc.includes('surf')) return '🏖️';
  if (cat === 'adventure' || desc.includes('hike') || desc.includes('trek') || desc.includes('climb') || desc.includes('ella rock')) return '⛰️';
  if (cat === 'relaxation' || desc.includes('spa') || desc.includes('yoga')) return '🧘';
  if (cat === 'history' || desc.includes('fort') || desc.includes('museum') || desc.includes('colonial')) return '📜';
  if (desc.includes('breakfast') || desc.includes('lunch') || desc.includes('dinner') || desc.includes('cafe') || desc.includes('restaurant') || desc.includes('food')) return '🍽️';
  if (desc.includes('hotel') || desc.includes('check-in') || desc.includes('resort')) return '🏨';
  if (desc.includes('safari') || desc.includes('wildlife') || desc.includes('elephant')) return '🦁';
  if (desc.includes('train') || desc.includes('railway')) return '🚂';
  if (desc.includes('tea') || desc.includes('plantation')) return '🍵';
  if (desc.includes('whale') || desc.includes('dolphin') || desc.includes('boat')) return '🐋';
  if (cat === 'arrival' || desc.includes('arrival') || desc.includes('pickup')) return '✈️';
  if (desc.includes('shop') || desc.includes('market') || desc.includes('bazaar')) return '🛍️';
  return '📍';
};

const getCategoryColor = (category?: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat === 'culture') return '#7C4DFF';
  if (cat === 'nature') return '#2E7D32';
  if (cat === 'beach') return '#0288D1';
  if (cat === 'adventure') return '#E65100';
  if (cat === 'relaxation') return '#AD1457';
  if (cat === 'history') return '#5D4037';
  if (cat === 'arrival') return '#1565C0';
  return '#F9A825';
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
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  const icon = getCategoryIcon(activity.category, activity.description);
  const accentColor = getCategoryColor(activity.category);
  const time = activity.time || (() => {
    const h = 8 + index * 2;
    if (h < 12) return `0${h}:00 AM`.replace('0' + (h >= 10 ? '' : ''), h < 10 ? `0${h}` : `${h}`);
    if (h === 12) return '12:00 PM';
    return `0${h - 12}:00 PM`.replace('0' + ((h - 12) >= 10 ? '' : ''), (h - 12) < 10 ? `0${h - 12}` : `${h - 12}`);
  })();
  const richDescription = activity.richDescription || activity.description;
  const tip = activity.tip || (activity.tips && activity.tips[0]) || '';
  const cost = activity.costUSD ?? 0;
  let photoUrl = activity.imageUrl || activity.photoUrl;
  if (photoUrl && photoUrl.startsWith('/')) {
    photoUrl = `${CONFIG.API_BASE_URL}${photoUrl}`;
  }
  
  console.log('Rendering EnhancedItineraryCard for:', activity.placeName, 'photoUrl:', photoUrl);

  return (
    <View style={styles.timelineRow}>
      {/* Timeline dot */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDotOuter, { borderColor: accentColor }]}>
          <View style={[styles.timelineDotInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Card */}
      <TouchableOpacity
        style={[styles.card, isSelected && { borderColor: accentColor, borderWidth: 1.5 }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Photo Banner */}
        <View style={styles.photoContainer}>
          {photoUrl && !imgError ? (
            <>
              {imgLoading && (
                <Animated.View style={[styles.photoPlaceholder, { opacity: fadeAnim, backgroundColor: '#E0E0E0', ...StyleSheet.absoluteFillObject }]} />
              )}
              <Image
                source={{ uri: photoUrl }}
                style={[styles.photo, imgLoading && { opacity: 0 }]}
                onLoad={() => setImgLoading(false)}
                onError={(e) => { 
                  console.error('Image load failed for', photoUrl, 'Error:', e.nativeEvent.error);
                  setImgError(true); 
                  setImgLoading(false); 
                }}
                resizeMode="cover"
              />
            </>
          ) : (
            <Image
              source={require('../../assets/RoamCeylon.png')}
              style={styles.photo}
              resizeMode="cover"
            />
          )}
          {/* Dark gradient overlay for text readability */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
          
          {/* Time badge over photo */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{time}</Text>
          </View>
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.categoryBadgeText}>{icon}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.placeName} numberOfLines={2}>
            {activity.description}
          </Text>

          <Text style={styles.richDesc} numberOfLines={3}>
            {richDescription}
          </Text>

          {/* Meta row: cost + duration */}
          {(cost > 0 || activity.estimatedDuration) && (
            <View style={styles.metaRow}>
              {cost > 0 && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipIcon}>💵</Text>
                  <Text style={styles.metaChipText}>${cost} USD</Text>
                </View>
              )}
              {activity.estimatedDuration && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipIcon}>⏱</Text>
                  <Text style={styles.metaChipText}>{activity.estimatedDuration}</Text>
                </View>
              )}
              {activity.confidenceScore && (
                <View
                  style={[
                    styles.metaChip,
                    {
                      backgroundColor:
                        activity.confidenceScore === 'High'
                          ? '#E8F5E9'
                          : activity.confidenceScore === 'Medium'
                          ? '#FFF8E1'
                          : '#FFEBEE',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceDot,
                      {
                        backgroundColor:
                          activity.confidenceScore === 'High'
                            ? '#43A047'
                            : activity.confidenceScore === 'Medium'
                            ? '#FFB300'
                            : '#EF5350',
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          )}

          {/* Local tip */}
          {tip ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipLabel}>📌 </Text>
              <Text style={styles.tipText} numberOfLines={2}>{tip}</Text>
            </View>
          ) : null}

          {/* Matched preferences */}
          {activity.matchedPreferences && activity.matchedPreferences.length > 0 && (
            <View style={styles.prefRow}>
              {activity.matchedPreferences.slice(0, 3).map((p) => (
                <View key={p} style={[styles.prefChip, { borderColor: accentColor }]}>
                  <Text style={[styles.prefChipText, { color: accentColor }]}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Edit controls */}
          {(onMoveUp || onMoveDown || onDelete) && (
            <View style={styles.actions}>
              {onMoveUp && (
                <TouchableOpacity
                  style={[styles.actionBtn, !canMoveUp && { opacity: 0.3 }]}
                  onPress={onMoveUp}
                  disabled={!canMoveUp}
                >
                  <Text style={styles.actionBtnText}>↑</Text>
                </TouchableOpacity>
              )}
              {onMoveDown && (
                <TouchableOpacity
                  style={[styles.actionBtn, !canMoveDown && { opacity: 0.3 }]}
                  onPress={onMoveDown}
                  disabled={!canMoveDown}
                >
                  <Text style={styles.actionBtnText}>↓</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                  <Text style={styles.actionBtnText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  // ── Photo section ──────────────────────────────────────────────
  photoContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  photoPlaceholder: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    fontSize: 17,
  },
  // ── No-photo header ─────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  timePill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 0.3,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  // ── Card body ───────────────────────────────────────────────────
  body: {
    padding: 16,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 23,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  richDesc: {
    fontSize: 13.5,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  metaChipIcon: {
    fontSize: 13,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F9A825',
  },
  tipLabel: {
    fontSize: 13,
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#6D4C00',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  prefRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  prefChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  prefChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default React.memo(EnhancedItineraryCard);
