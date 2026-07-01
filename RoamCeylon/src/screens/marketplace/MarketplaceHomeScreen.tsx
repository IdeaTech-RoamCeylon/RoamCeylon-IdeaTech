import React, { useCallback } from 'react';
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';
import { CONFIG } from '../../config';

type MarketplaceNavigationProp = StackNavigationProp<MainStackParamList, 'Marketplace'>;

const FILTER_TABS = ['Best Sellers', 'Tea', 'Gifts', 'Spices'];

interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  rating: string;
  price?: string;
  description?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  image: { uri: string } | any;
  featured?: boolean;
}

// Static array removed, data will be fetched dynamically.

const noop = () => {};

interface ProductCardProps {
  item: MarketplaceItem;
  onPress: (item: MarketplaceItem) => void;
}

const ProductCard = React.memo<ProductCardProps>(({ item, onPress }) => {
  if (item.featured) {
    return (
      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => onPress(item)}>
        <Image source={item.image} style={styles.featuredImage} resizeMode="cover" />
        <View style={styles.featuredBody}>
          <View style={styles.metaRow}>
            <Text style={styles.categoryLabel}>{item.category}</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{item.rating}</Text>
            </View>
          </View>
          <Text style={styles.featuredTitle}>{item.title}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredPrice}>{item.price}</Text>
            <TouchableOpacity activeOpacity={1} style={styles.addToCartButton} onPress={noop}>
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={() => onPress(item)}>
      <Image source={item.image} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productBody}>
        <View style={styles.productMetaRow}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productRating}>★ {item.rating}</Text>
        </View>
        <Text style={styles.productTitle}>{item.title}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price ? item.price : ''}</Text>
          <TouchableOpacity activeOpacity={1} style={styles.cartCircle} onPress={noop}>
            <Ionicons name="cart-outline" size={18} color="#8F7400" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

const MarketplaceHomeScreen = () => {
  const navigation = useNavigation<MarketplaceNavigationProp>();
  const [items, setItems] = React.useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/marketplace/products`);
        if (res.ok) {
          const json = await res.json();
          const fetchedData = json.data || [];
          
          const mappedItems: MarketplaceItem[] = fetchedData.map((shop: any, index: number) => ({
            id: shop.id,
            title: shop.name,
            category: shop.category || 'SHOP',
            rating: '4.9', // default rating for now
            price: '', // Shops don't have generic prices
            description: shop.description || 'Welcome to our shop! Come visit us for the best experience.',
            website: shop.website,
            instagram: shop.instagram,
            facebook: shop.facebook,
            tiktok: shop.tiktok,
            image: { uri: shop.image || 'https://via.placeholder.com/400x200?text=No+Image' },
            featured: index === 0, // make first one featured
          }));
          setItems(mappedItems);
        }
      } catch (err) {
        console.error('Failed to fetch marketplace shops:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleBackToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="#5A5140" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Marketplace</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Local Treasures & Souvenirs</Text>
          <Text style={styles.heroSubtitle}>
            Discover the soul of Sri Lanka through handcrafted artifacts, world-class tea, and
            unique keepsakes.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={22} color="#6A6153" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for treasures..."
            placeholderTextColor="#A39A8C"
            editable={false}
            pointerEvents="none"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={1}
              onPress={noop}
              style={[styles.chip, index === 0 && styles.activeChip]}
            >
              <Text style={[styles.chipText, index === 0 && styles.activeChipText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardsSection}>
          {items.map((item) => (
            <ProductCard 
              key={item.id} 
              item={item} 
              onPress={(shopItem) => navigation.navigate('ShopDetails', { shop: shopItem })} 
            />
          ))}
          {items.length === 0 && !loading && (
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
              No shops available right now.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.bottomTab}>
          <Ionicons name="home-outline" size={18} color="#8B8B8B" />
          <Text style={styles.bottomTabText}>HOME</Text>
        </View>
        <View style={[styles.bottomTab, styles.bottomTabActive]}>
          <Ionicons name="compass" size={18} color="#222" />
          <Text style={[styles.bottomTabText, styles.bottomTabTextActive]}>EXPLORE</Text>
        </View>
        <View style={styles.bottomTab}>
          <Ionicons name="notifications-outline" size={18} color="#8B8B8B" />
          <Text style={styles.bottomTabText}>ALERTS</Text>
        </View>
        <View style={styles.bottomTab}>
          <Ionicons name="settings-outline" size={18} color="#8B8B8B" />
          <Text style={styles.bottomTabText}>SETTINGS</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    height: 98,
    paddingTop: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DF',
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4A4031',
    letterSpacing: -0.6,
  },
  topBarSpacer: {
    width: 28,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 36,
    letterSpacing: -1.1,
    fontWeight: '800',
    color: '#1E2227',
  },
  heroSubtitle: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 29,
    color: '#534C42',
    maxWidth: 360,
  },
  searchBox: {
    marginHorizontal: 24,
    marginTop: 26,
    backgroundColor: '#F7F6F4',
    borderRadius: 16,
    minHeight: 40,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    marginLeft: 12,
    flex: 1,
    fontSize: 16,
    color: '#766F64',
    fontWeight: '500',
  },
  filterRow: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 22,
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: '#E4E4E4',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 26,
  },
  activeChip: {
    backgroundColor: '#77E978',
  },
  chipText: {
    fontSize: 16,
    color: '#51493E',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#165925',
  },
  cardsSection: {
    marginTop: 12,
    paddingHorizontal: 24,
    gap: 22,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 246,
  },
  featuredBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#0F7D36',
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8E9BC',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 5,
  },
  ratingStar: {
    color: '#E4AC00',
    fontSize: 14,
  },
  ratingValue: {
    color: '#6B5621',
    fontWeight: '700',
    fontSize: 24,
  },
  featuredTitle: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 36,
    color: '#212429',
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  featuredFooter: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredPrice: {
    fontSize: 30,
    color: '#202226',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addToCartButton: {
    backgroundColor: '#F4CF47',
    borderRadius: 999,
    minHeight: 52,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  productBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    color: '#9A9A9A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  productRating: {
    color: '#5B5A58',
    fontSize: 16,
    fontWeight: '700',
  },
  productTitle: {
    marginTop: 10,
    color: '#212429',
    fontSize: 20,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  productFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#212429',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cartCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9E9E9',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  bottomTab: {
    minWidth: 70,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  bottomTabActive: {
    backgroundColor: '#F2D658',
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  bottomTabText: {
    fontSize: 10,
    color: '#8B8B8B',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bottomTabTextActive: {
    color: '#232323',
  },
});

export default React.memo(MarketplaceHomeScreen);
