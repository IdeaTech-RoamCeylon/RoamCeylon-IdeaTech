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
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#172B1E" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Active Activities</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push('/activities/settings' as any)}
          >
            <View style={styles.profilePlaceholder}>
              <MaterialCommunityIcons name="account" size={22} color="#0E5E2F" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

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
              activeOpacity={0.9}
              onPress={() => router.push('/activities/update' as any)}
            >
              <Image 
                source={activity.coverImageUrl ? { uri: activity.coverImageUrl } : require('../../assets/Activities/Sunrise Yoga.png')} 
                style={styles.activityImage} 
                contentFit="cover" 
              />
              <View style={styles.activityInfo}>
                <View style={styles.activityHeaderRow}>
                  <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
                  <View style={[styles.statusBadge, activity.status === 'active' ? styles.statusActive : styles.statusDraft]}>
                    <Text style={[styles.statusText, activity.status === 'active' ? styles.statusTextActive : styles.statusTextDraft]}>
                      {activity.status === 'active' ? 'Active' : activity.status === 'draft' ? 'Draft' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityCategory} numberOfLines={1}>{activity.category} • {activity.difficulty || 'Easy'}</Text>
                <View style={styles.activityFooter}>
                  <View style={styles.activityFooterItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.activityFooterText} numberOfLines={1}>{activity.location || 'No location'}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#D1D5DB" />
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0E5E2F',
    overflow: 'hidden',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F3F1',
  },
  activityImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusDraft: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextDraft: {
    color: '#4B5563',
  },
  activityCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityFooterText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ActiveActivities;
