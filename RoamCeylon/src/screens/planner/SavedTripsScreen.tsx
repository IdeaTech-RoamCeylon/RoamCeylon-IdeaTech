import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import { tripStorageService, SavedTrip } from '../../services/tripStorageService';
import { apiService } from '../../services/api';
import { usePlannerContext } from '../../context/PlannerContext';
import { EmptyState } from '../../components';

type SavedTripsNavigationProp = StackNavigationProp<MainStackParamList, 'AITripPlanner'>;

const SavedTripsScreen = () => {
  const navigation = useNavigation<SavedTripsNavigationProp>();
  const { setTripPlan, setQuery, startEditing, setChatMessages, setChatSessionId } = usePlannerContext();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const [tripsResult, chatsResult] = await Promise.all([
        tripStorageService.getSavedTrips(),
        apiService.get('/ai/chat/history').catch(() => ({ data: [] })) as Promise<any>
      ]);
      
      const trips = Array.isArray(tripsResult) ? tripsResult : tripsResult.data;
      setSavedTrips(trips);
      setChatSessions((chatsResult as any).data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load saved trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadChat = useCallback(async (sessionId: string) => {
    try {
      const response = await apiService.get(`/ai/chat/history/${sessionId}`) as any;
      const msgs = response.data.map((m: any) => {
        if (m.sender === 'user') {
          return {
            id: m.id,
            text: m.content,
            sender: 'user',
            timestamp: new Date(m.createdAt),
            type: 'text'
          };
        } else {
          if (m.content.type === 'planLink') {
            return {
              id: m.id,
              text: '',
              sender: 'ai',
              timestamp: new Date(m.createdAt),
              type: 'planLink',
              planLinkData: { tripId: m.content.tripId, destination: m.content.destination }
            };
          }
          return {
            id: m.id,
            text: m.content.reply,
            sender: 'ai',
            timestamp: new Date(m.createdAt),
            type: 'text',
            tripData: m.content.extractedData
          };
        }
      });
      setChatMessages(msgs);
      setChatSessionId(sessionId);
      navigation.navigate('AIChat' as never);
    } catch (error) {
      console.error('Error loading chat:', error);
      Alert.alert('Error', 'Failed to load chat history');
    }
  }, [navigation, setChatMessages, setChatSessionId]);

  const handleLoadTrip = useCallback((trip: SavedTrip) => {
    // Validate trip data before loading
    if (!trip || !trip.tripPlan || !trip.tripPlan.itinerary) {
      Alert.alert('Error', 'This trip data is corrupted and cannot be loaded.');
      return;
    }

    Alert.alert(
      'Load Trip',
      `Load "${trip.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: () => {
            try {
              setTripPlan(trip.tripPlan);
              setQuery(prev => ({
                ...prev,
                destination: trip.tripPlan.destination || '',
                duration: trip.tripPlan.duration || '1',
                budget: trip.tripPlan.budget || 'Medium',
              }));
              startEditing(trip.id);
              navigation.navigate('AITripPlanner');
            } catch (error) {
              console.error('Error loading trip:', error);
              Alert.alert('Error', 'Failed to load trip. Please try again.');
            }
          },
        },
      ]
    );
  }, [navigation, setTripPlan, setQuery, startEditing]);

  const handleDeleteTrip = useCallback((trip: SavedTrip) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update: Remove from UI immediately
            const previousTrips = [...savedTrips];
            setSavedTrips(prev => prev.filter(t => t.id !== trip.id));
            
            try {
              await tripStorageService.deleteTrip(trip.id);
              // Success - trip is already removed from UI
            } catch (error) {
              // Rollback on error
              setSavedTrips(previousTrips);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            }
          },
        },
      ]
    );
  }, [savedTrips]);

  // Memoize filtered trips to avoid recalculating on every render
  // Also filter out trips with incomplete/malformed data (e.g. auto-saved trips with wrong shape)
  const filteredTrips = useMemo(() => {
    const validTrips = savedTrips.filter(
      trip => trip?.tripPlan?.itinerary && Array.isArray(trip.tripPlan.itinerary)
    );
    if (!searchQuery.trim()) return validTrips;
    const query = searchQuery.toLowerCase();
    return validTrips.filter(trip =>
      trip.name.toLowerCase().includes(query) ||
      trip.tripPlan.destination.toLowerCase().includes(query)
    );
  }, [savedTrips, searchQuery]);

  // Memoized trip card rendering
  const renderTripCard = useCallback(({ item }: { item: SavedTrip }) => {
    const savedDate = new Date(item.savedAt);
    const formattedDate = savedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const activitiesCount = Array.isArray(item.tripPlan?.itinerary)
      ? item.tripPlan.itinerary.reduce((sum, day) => sum + (day?.activities?.length ?? 0), 0)
      : 0;

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleLoadTrip(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripIconContainer}>
            <Text style={styles.tripIcon}>🗺️</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.tripDestination}>{item.tripPlan.destination}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTrip(item)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{item.tripPlan.duration} Days</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={styles.detailText}>{item.tripPlan.budget}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🕒</Text>
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <Text style={styles.activitiesCount}>
            {activitiesCount} Activities
          </Text>
          <Text style={styles.loadText}>Tap to Load →</Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleLoadTrip, handleDeleteTrip]);

  // Optimize FlatList performance
  const keyExtractor = useCallback((item: SavedTrip) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Trips</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Trips</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {savedTrips.length > 0 && (
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search trips..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={searchQuery ? '🔍' : '🗺️'}
            message={searchQuery ? 'No trips found' : 'No saved trips'}
            subtitle={
              searchQuery
                ? 'Try a different search term'
                : 'Save your trip plans to access them later'
            }
          />
        ) : (
          <FlatList
            data={filteredTrips}
            renderItem={renderTripCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            ListHeaderComponent={
              chatSessions.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>Recent Chats</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {chatSessions.map((session) => (
                      <TouchableOpacity 
                        key={session.id} 
                        style={styles.chatCard}
                        onPress={() => handleLoadChat(session.id)}
                      >
                        <Text style={styles.chatIcon}>💬</Text>
                        <View>
                          <Text style={styles.chatTitle}>
                            {session.tripPlans?.[0]?.destination || 'New Plan'}
                          </Text>
                          <Text style={styles.chatDate}>
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripIcon: {
    fontSize: 24,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  tripDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  activitiesCount: {
    fontSize: 13,
    color: '#888',
  },
  loadText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chatDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default React.memo(SavedTripsScreen);
