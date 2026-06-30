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

const PendingShops = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (accessToken) {
        const shopsRes = await fetch(`${apiUrl}/shops/my`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          // Filter only pending shops
          setShops(shopsData.filter((s: any) => s.status === 'under_review' || s.status === 'pending'));
        }
      }
    } catch (error) {
      console.error('Failed to fetch pending shops data:', error);
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header Gradient */}
        <LinearGradient
          colors={['#0F3D26', '#145334', '#0E5E2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        >
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Pending Shops</Text>

          {/* Placeholder to balance the back button */}
          <View style={styles.headerRightPlaceholder} />
        </LinearGradient>

        <View style={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
        ) : shops.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={48} color="#D97706" />
            </View>
            <Text style={styles.emptyTitle}>No pending shops</Text>
            <Text style={styles.emptySubtitle}>
              You haven&apos;t added any shops yet, or they have all been approved.
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
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  shopCard: {
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
    borderColor: '#F3F4F6',
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
    justifyContent: 'center',
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  shopTitle: {
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
  statusInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusReview: {
    backgroundColor: '#FFFBEB',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  statusTextReview: {
    color: '#D97706',
  },
  shopCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
  },
  shopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopFooterText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default PendingShops;
