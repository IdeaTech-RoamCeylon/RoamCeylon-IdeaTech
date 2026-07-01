import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIG } from '../../config';

interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  coverImageUrl: string;
  difficulty: string;
  price: string | number;
  location: string;
}

const ActivitiesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      console.log('Fetching from:', `${CONFIG.API_BASE_URL}/public-activities`);
      const response = await fetch(`${CONFIG.API_BASE_URL}/public-activities`);
      if (response.ok) {
        const responseData = await response.json();
        // The NestJS backend wraps responses in { success, data, ... }
        setActivities(responseData.data || []);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Network error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const renderActivityCard = (activity: Activity) => {
    const imageUrl = activity.coverImageUrl || 'https://via.placeholder.com/400x200?text=No+Image';

    return (
      <TouchableOpacity key={activity.id} style={styles.card} activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{activity.category}</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{activity.name}</Text>
            <Text style={styles.cardPrice}>
              LKR {Number(activity.price).toFixed(0)}<Text style={styles.perPerson}>/pp</Text>
            </Text>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {activity.location || 'Sri Lanka'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="fitness-outline" size={14} color="#6B7280" />
              <Text style={[styles.detailText, { textTransform: 'capitalize' }]}>
                {activity.difficulty}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cardDescription} numberOfLines={2}>
            {activity.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities & Spots</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0E5E2F" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E5E2F" />
          }
        >
          <Text style={styles.sectionTitle}>Explore Local Activities</Text>
          <Text style={styles.sectionSubtitle}>
            Discover hand-picked activities and tourist spots created by our trusted providers.
          </Text>

          {activities.length > 0 ? (
            activities.map(renderActivityCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Activities Yet</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon! Our providers are adding new experiences.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(14, 94, 47, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E5E2F',
  },
  perPerson: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'normal',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});

export default ActivitiesScreen;
