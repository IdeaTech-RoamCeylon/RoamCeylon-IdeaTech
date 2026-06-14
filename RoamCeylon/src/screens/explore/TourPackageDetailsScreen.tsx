import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../../types/navigation.types';

const { width, height } = Dimensions.get('window');

type DetailsRouteProp = RouteProp<MainStackParamList, 'TourPackageDetails'>;

export default function TourPackageDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<DetailsRouteProp>();
  const insets = useSafeAreaInsets();
  const { tourPackage } = route.params;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = [
    ...(tourPackage.coverImageUrl ? [tourPackage.coverImageUrl] : []),
    ...(tourPackage.galleryUrls || []),
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={images[activeImageIndex] ? { uri: images[activeImageIndex] } : require('../../assets/Homepage.png')}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />
          
          <View style={[styles.headerControls, { top: Math.max(insets.top, 20) }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{tourPackage.category || 'Tour Package'}</Text>
            </View>
            <Text style={styles.title}>{tourPackage.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#FFF" />
                <Text style={styles.metaText}>{tourPackage.duration} Days</Text>
              </View>
              {tourPackage.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color="#FFF" />
                  <Text style={styles.metaText}>{tourPackage.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          
          {/* Gallery Thumbnails inside the white sheet */}
          {images.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.galleryContainer}
            >
              {images.map((img: string, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => setActiveImageIndex(idx)}
                  style={[styles.thumbnailWrapper, activeImageIndex === idx && styles.thumbnailActive]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnail} />
                  {activeImageIndex !== idx && <View style={styles.thumbnailOverlay} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Price per person</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.price}>LKR {tourPackage.price}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FF9800" />
              <Text style={styles.ratingText}>4.9 (120+)</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this journey</Text>
          <Text style={styles.description}>{tourPackage.description || 'No description available for this package.'}</Text>

          {tourPackage.highlights && tourPackage.highlights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.highlightsContainer}>
                {tourPackage.highlights.map((highlight: string, idx: number) => (
                  <View key={idx} style={styles.highlightItem}>
                    <View style={styles.highlightDot} />
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBarWrapper}>
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.bottomPriceInfo}>
            <Text style={styles.bottomPriceLabel}>Total Price</Text>
            <Text style={styles.bottomPrice}>LKR {tourPackage.price}</Text>
            <Text style={styles.perPersonText}>/ person</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookBtn} 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('TourPackageBooking', { tourPackage })}
          >
            <LinearGradient
              colors={['#111', '#333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookGradient}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 180,
  },
  heroSection: {
    width: width,
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    backgroundColor: '#98F59B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    backgroundColor: '#FAFAFA',
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 500,
  },
  galleryContainer: {
    paddingVertical: 20,
  },
  thumbnailWrapper: {
    width: 75,
    height: 75,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  thumbnailActive: {
    borderColor: '#FFB700',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D3008',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20,
  },
  highlightsContainer: {
    marginTop: 5,
    gap: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  highlightDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  highlightText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 20,
  },
  bottomPriceInfo: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111',
  },
  perPersonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  bookBtn: {
    width: 170,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  bookGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
