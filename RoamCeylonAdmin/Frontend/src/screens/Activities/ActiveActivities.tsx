import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const ActiveActivities = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) return;

      const res = await fetch(`${apiUrl}/activities/list`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [])
  );

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Premium Header Gradient */}
      <LinearGradient
        colors={['#0F3D26', '#145334', '#0E5E2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
      >
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Activities</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.topControlContainer}>
        <View style={styles.searchSection}>
          <Ionicons name="search-outline" size={20} color="#7D8A82" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            placeholderTextColor="#7D8A82"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#7D8A82" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Activities List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 60 }} />
        ) : filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={48} color="#7D8A82" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No activities found' : 'No activities yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search.' : 'Create your first activity to get started.'}
            </Text>
          </View>
        ) : (
          filteredActivities.map((activity) => (
            <TouchableOpacity 
              key={activity.id}
              style={styles.activityCard}
              activeOpacity={0.92}
              onPress={() => router.push({ pathname: '/activities/update', params: { id: activity.id } } as any)}
            >
              {/* Cover Image with Overlay */}
              <View style={styles.cardImageContainer}>
                {activity.coverImageUrl ? (
                  <Image 
                    source={{ uri: activity.coverImageUrl }} 
                    style={styles.activityImage} 
                    contentFit="cover" 
                    transition={300}
                  />
                ) : (
                  <View style={[styles.activityImage, styles.activityImagePlaceholder]}>
                    <View style={styles.placeholderIconWrap}>
                      <MaterialCommunityIcons name="image-plus" size={28} color="#9CA3AF" />
                    </View>
                    <Text style={styles.placeholderText}>No cover photo</Text>
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.imageOverlay}
                />
                {/* Status Badge */}
                <View style={[styles.statusBadge, activity.status === 'active' ? styles.statusActive : styles.statusDraft]}>
                  <View style={[styles.statusDot, { backgroundColor: activity.status === 'active' ? '#059669' : '#4B5563' }]} />
                  <Text style={[styles.statusText, activity.status === 'active' ? styles.statusTextActive : styles.statusTextDraft]}>
                    {activity.status === 'active' ? 'Active' : activity.status === 'draft' ? 'Draft' : 'Inactive'}
                  </Text>
                </View>
                {/* Price Tag */}
                {activity.price > 0 && (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>LKR {Number(activity.price).toFixed(0)}</Text>
                  </View>
                )}
              </View>

              {/* Card Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
                  <View style={styles.difficultyBadge}>
                    <MaterialCommunityIcons 
                      name={activity.difficulty === 'hard' ? 'fire' : activity.difficulty === 'medium' ? 'trending-up' : 'leaf'} 
                      size={12} 
                      color={activity.difficulty === 'hard' ? '#EF4444' : activity.difficulty === 'medium' ? '#F59E0B' : '#10B981'} 
                    />
                    <Text style={[styles.difficultyText, { 
                      color: activity.difficulty === 'hard' ? '#EF4444' : activity.difficulty === 'medium' ? '#F59E0B' : '#10B981' 
                    }]}>
                      {(activity.difficulty || 'easy').charAt(0).toUpperCase() + (activity.difficulty || 'easy').slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag-outline" size={13} color="#6B7280" />
                  <Text style={styles.categoryText}>{activity.category}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottomRow}>
                  <View style={styles.infoChip}>
                    <Ionicons name="location-outline" size={14} color="#0E5E2F" />
                    <Text style={styles.infoChipText} numberOfLines={1}>{activity.location || 'No location'}</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Ionicons name="time-outline" size={14} color="#0E5E2F" />
                    <Text style={styles.infoChipText}>
                      {activity.startTime && activity.endTime 
                        ? `${activity.startTime} - ${activity.endTime}` 
                        : 'Flexible'}
                    </Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Ionicons name="people-outline" size={14} color="#0E5E2F" />
                    <Text style={styles.infoChipText}>{activity.maxParticipants || 20} max</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  topControlContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2EC',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#172B1E',
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172B1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7D8A82',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: {
    backgroundColor: 'rgba(236, 253, 245, 0.95)',
  },
  statusDraft: {
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextDraft: {
    color: '#4B5563',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 61, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.3,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
});

export default ActiveActivities;

