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
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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

      // Fetch my stats and shops (requires auth)
      if (accessToken) {
        const statsRes = await fetch(`${apiUrl}/shops/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Premium Header Gradient */}
      <LinearGradient
        colors={['#0F3D26', '#145334', '#0E5E2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.headerTitle}>Partner Dashboard</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/shopping/settings' as any)}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={24} color="#0F3D26" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color="#0E5E2F" />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Shops</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.underReview}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="trending-up" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.statValue}>+{stats.networkGrowthPercent}%</Text>
              <Text style={styles.statLabel}>Growth</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Shops</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
        ) : shops.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="storefront-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No shops yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven&apos;t added any shops. Tap the button below to register your first business.
            </Text>
          </View>
        ) : (
          shops.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.shopCard}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/shopping/edit', params: { id: item.id } } as any)}
            >
              {item.coverImageUrl && item.coverImageUrl.length > 10 ? (
                <Image 
                  source={{ uri: item.coverImageUrl }} 
                  style={styles.shopImage} 
                  contentFit="cover" 
                  transition={200}
                />
              ) : (
                <View style={[styles.shopImage, styles.shopImagePlaceholder]}>
                  <MaterialCommunityIcons name="storefront" size={32} color="#9CA3AF" />
                </View>
              )}
              
              <View style={styles.shopInfo}>
                <View style={styles.shopHeaderRow}>
                  <Text style={styles.shopTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={[
                    styles.statusBadge, 
                    item.status === 'active' ? styles.statusActive : 
                    item.status === 'inactive' ? styles.statusInactive : 
                    styles.statusReview
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.status === 'active' ? styles.statusTextActive : 
                      item.status === 'inactive' ? styles.statusTextInactive : 
                      styles.statusTextReview
                    ]}>
                      {item.status === 'under_review' ? 'Review' : item.status}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.shopCategory}>{item.category || 'Category'}</Text>
                
                <View style={styles.shopFooter}>
                  <View style={styles.shopFooterItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.shopFooterText} numberOfLines={1}>{item.location || 'No location'}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#D1D5DB" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 24 }]} 
        activeOpacity={0.8}
        onPress={() => router.push('/shopping/add' as any)}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },
  shopImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  shopImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  shopTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  shopCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusReview: { backgroundColor: '#FFFBEB' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },
  statusTextReview: { color: '#D97706' },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  shopFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  shopFooterText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShoppingHomeScreen;
