import React, { useCallback } from 'react';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';

type MarketplaceCategoryRouteProp = RouteProp<MainStackParamList, 'MarketplaceCategory'>;
type MarketplaceCategoryNavigationProp = StackNavigationProp<MainStackParamList, 'MarketplaceCategory'>;

interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  rating: string;
  price: string;
  image: ImageSourcePropType;
}

const CATEGORY_ITEMS: MarketplaceItem[] = [
  {
    id: 'ves-muhunu-mask',
    title: 'Vibrant Ves Muhunu Mask',
    category: 'HANDICRAFTS',
    rating: '4.8',
    price: '$72.00',
    image: require('../../assets/mask.png'),
  },
  {
    id: 'cinnamon-sticks',
    title: 'True Ceylon Cinnamon Sticks',
    category: 'SPICES',
    rating: '5.0',
    price: '$18.50',
    image: require('../../assets/cinnamon.png'),
  },
  {
    id: 'ebony-elephant',
    title: 'Handcrafted Ebony Elephant',
    category: 'SOUVENIRS',
    rating: '4.7',
    price: '$120.00',
    image: require('../../assets/elephant.png'),
  },
  {
    id: 'dumbara-scarf',
    title: 'Dumbara Weave Cotton Scarf',
    category: 'TEXTILES',
    rating: '4.6',
    price: '$34.00',
    image: require('../../assets/scarf.png'),
  },
];

const noop = () => {};

interface ProductCardProps {
  item: MarketplaceItem;
}

const ProductCard = React.memo<ProductCardProps>(({ item }) => {
  return (
    <View style={styles.productCard}>
      <Image source={item.image} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productBody}>
        <View style={styles.productMetaRow}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productRating}>★ {item.rating}</Text>
        </View>
        <Text style={styles.productTitle}>{item.title}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price}</Text>
          <TouchableOpacity style={styles.cartCircle} activeOpacity={1} onPress={noop}>
            <Ionicons name="cart-outline" size={18} color="#8F7400" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

const MarketplaceCategoryScreen = () => {
  const route = useRoute<MarketplaceCategoryRouteProp>();
  const navigation = useNavigation<MarketplaceCategoryNavigationProp>();
  const { categoryName } = route.params;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#5A5140" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{categoryName}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Explore authentic Sri Lankan products</Text>

        <View style={styles.cardsSection}>
          {CATEGORY_ITEMS.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
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
    height: 78,
    paddingTop: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 30,
    color: '#4A4031',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  topBarSpacer: {
    width: 28,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#554B40',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  cardsSection: {
    marginTop: 16,
    gap: 18,
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
    height: 260,
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  productFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#212429',
    fontSize: 38,
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
});

export default React.memo(MarketplaceCategoryScreen);
