import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const ShoppingHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shops, setShops] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, underReview: 0, networkGrowthPercent: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      // Fetch stats (public)
      const statsRes = await fetch(`${apiUrl}/shops/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch my shops (requires auth)
      if (accessToken) {
        const shopsRes = await fetch(`${apiUrl}/shops/my`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          setShops(shopsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#103B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Shops</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color="#103B2E" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/shopping/settings' as any)}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#103B2E" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Partner{'\n'}Network</Text>
        <Text style={styles.pageSubtitle}>Curating premium Sri Lankan{'\n'}experiences</Text>

        <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => router.push('/shopping/add' as any)}>
          <Feather name="plus" size={18} color="#493D1B" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add New Shop</Text>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>Total Shops</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <MaterialCommunityIcons name="storefront-outline" size={24} color="#4F7962" />
        </View>

        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>Pending Reviews</Text>
            <Text style={styles.statValue}>{stats.underReview}</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#4F7962" />
        </View>

        <View style={styles.growthCard}>
          <View>
            <Text style={styles.growthLabel}>Network Growth</Text>
            <View style={styles.growthValueContainer}>
              <Text style={styles.growthValue}>+{stats.networkGrowthPercent}%</Text>
              <Text style={styles.growthSubtext}>this month</Text>
            </View>
          </View>
          <Feather name="trending-up" size={24} color="#FFFFFF" />
        </View>

        {/* Shop List or Empty State */}
        {shops.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="storefront-outline" size={56} color="#D0DDD7" />
            <Text style={styles.emptyTitle}>No shops yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap <Text style={styles.emptyHighlight}>+ Add New Shop</Text> to register your first shop.
            </Text>
          </View>
        ) : (
          shops.map((item) => (
            <View key={item.id} style={styles.shopCard}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopTitle}>{item.name}</Text>
                <Text style={styles.shopCategory}>{item.category}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7} onPress={() => router.push({ pathname: '/shopping/edit', params: { id: item.id } } as any)}>
                    <Ionicons name="pencil" size={20} color="#4A4A4A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={20} color="#4A4A4A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#103B2E',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchButton: {
    padding: 8,
    marginRight: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EAD26B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 46,
    marginBottom: 8,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 100,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '600',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  growthCard: {
    backgroundColor: '#0F3D26',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  growthLabel: {
    fontSize: 14,
    color: '#A0B4AA',
    fontWeight: '600',
    marginBottom: 16,
  },
  growthValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  growthValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  growthSubtext: {
    fontSize: 14,
    color: '#A0B4AA',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EAD26B',
    backgroundColor: '#F0F7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    padding: 20,
  },
  shopTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  emptyHighlight: {
    color: '#0E5E2F',
    fontWeight: '700',
  },
});

export default ShoppingHomeScreen;
