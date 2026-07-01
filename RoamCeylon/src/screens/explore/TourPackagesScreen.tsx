import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MainStackParamList } from '../../types/navigation.types';

export default function TourPackagesScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
      const res = await fetch(`${apiUrl}/public-tours/packages`);
      if (res.ok) {
        const json = await res.json();
        // Backend wraps response in { data: [...] } envelope
        const pkgs = Array.isArray(json) ? json : (json?.data || []);
        setPackages(pkgs);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Nature', 'Culture', 'Adventure', 'Wildlife', 'Beach', 'City', 'Other'];

  const filteredPackages = packages.filter(pkg => 
    activeCategory === 'All' || pkg.category === activeCategory
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tour Packages</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {categories.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterButton, activeCategory === filter && styles.filterButtonActive]}
              onPress={() => setActiveCategory(filter)}
            >
              <Text style={[styles.filterText, activeCategory === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#9B7B4A" style={{ marginTop: 40 }} />
        ) : filteredPackages.length === 0 ? (
          <Text style={styles.emptyText}>No packages available at the moment.</Text>
        ) : (
          filteredPackages.map((pkg) => (
            <TouchableOpacity 
              key={pkg.id} 
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('TourPackageDetails', { tourPackage: pkg })}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={pkg.coverImageUrl ? { uri: pkg.coverImageUrl } : require('../../assets/Homepage.png')} 
                  style={styles.cardImage} 
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageGradient}
                />
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{pkg.name}</Text>
                  <Text style={styles.cardDuration}>{pkg.duration} Days</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.cardCategory}>{pkg.category}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.cardPrice}>LKR {pkg.price}</Text>
                    <Text style={styles.perPerson}> / person</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{pkg.description}</Text>
                <TouchableOpacity 
                  style={styles.bookBtn}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('TourPackageDetails', { tourPackage: pkg })}
                >
                  <LinearGradient
                    colors={['#111', '#333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bookGradient}
                  >
                    <Text style={styles.bookBtnText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  filtersContainer: { marginBottom: 20 },
  filterButton: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#EEE', marginRight: 10,
  },
  filterButtonActive: { backgroundColor: '#98F59B' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#555' },
  filterTextActive: { color: '#111' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  card: {
    marginBottom: 25, backgroundColor: '#FFF', borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  imageContainer: {
    width: '100%', height: 220, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', position: 'relative',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageGradient: { ...StyleSheet.absoluteFillObject, top: '50%' },
  cardHeader: {
    position: 'absolute', bottom: 15, left: 15, right: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', flex: 1, marginRight: 10 },
  cardDuration: { fontSize: 14, fontWeight: '600', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardInfo: { padding: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardCategory: { fontSize: 12, fontWeight: '700', color: '#0E5E2F', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryBadge: { backgroundColor: '#EAF7EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardPrice: { fontSize: 22, fontWeight: '900', color: '#111' },
  perPerson: { fontSize: 12, fontWeight: '600', color: '#888' },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  bookBtn: { 
    borderRadius: 16, overflow: 'hidden', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  bookGradient: {
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  bookBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});
