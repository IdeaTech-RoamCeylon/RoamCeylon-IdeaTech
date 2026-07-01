import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../../types/navigation.types';

const { width } = Dimensions.get('window');

type DetailsRouteProp = RouteProp<MainStackParamList, 'ShopDetails'>;

export default function ShopDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<DetailsRouteProp>();
  const insets = useSafeAreaInsets();
  const { shop } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={shop.image || require('../../assets/Homepage.png')}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)', '#000']}
            locations={[0, 0.4, 0.8, 1]}
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
              <Text style={styles.categoryText}>{shop.category || 'SHOP'}</Text>
            </View>
            <Text style={styles.title}>{shop.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#FFF" />
                <Text style={styles.metaText}>{shop.rating || '4.9'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>About this shop</Text>
          <Text style={styles.description}>{shop.description || 'Welcome to our shop! Please visit us to find out more.'}</Text>
          
          {(shop.website || shop.instagram || shop.facebook || shop.tiktok) && (
            <>
              <Text style={styles.sectionTitle}>Connect with us</Text>
              <View style={styles.socialContainer}>
                {shop.website && (
                  <TouchableOpacity 
                    style={styles.socialBtn} 
                    onPress={() => Linking.openURL(shop.website)}
                  >
                    <Ionicons name="globe-outline" size={24} color="#0E5E2F" />
                  </TouchableOpacity>
                )}
                {shop.instagram && (
                  <TouchableOpacity 
                    style={styles.socialBtn} 
                    onPress={() => Linking.openURL(shop.instagram)}
                  >
                    <Ionicons name="logo-instagram" size={24} color="#0E5E2F" />
                  </TouchableOpacity>
                )}
                {shop.facebook && (
                  <TouchableOpacity 
                    style={styles.socialBtn} 
                    onPress={() => Linking.openURL(shop.facebook)}
                  >
                    <Ionicons name="logo-facebook" size={24} color="#0E5E2F" />
                  </TouchableOpacity>
                )}
                {shop.tiktok && (
                  <TouchableOpacity 
                    style={styles.socialBtn} 
                    onPress={() => Linking.openURL(shop.tiktok)}
                  >
                    <Ionicons name="logo-tiktok" size={24} color="#0E5E2F" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Visit Bar */}
      <View style={styles.bottomBarWrapper}>
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.bottomPriceInfo}>
            <Text style={styles.bottomPriceLabel}>Status</Text>
            <Text style={styles.bottomPrice}>Open Now</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookBtn} 
            activeOpacity={0.9}
            onPress={() => alert('Map directions not implemented yet!')}
          >
            <LinearGradient
              colors={['#1A6A3B', '#0E5E2F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookBtnGradient}
            >
              <Text style={styles.bookBtnText}>Get Directions</Text>
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
    paddingBottom: 120,
  },
  heroSection: {
    height: 400,
    width: '100%',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0E5E2F',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
    lineHeight: 38,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 1,
  },
  metaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  detailsContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 30,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 94, 47, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  bookBtn: {
    width: 160,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bookBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
