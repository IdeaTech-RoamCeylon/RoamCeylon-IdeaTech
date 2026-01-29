import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import marketplaceApi, { Product } from '../../services/marketplaceApi';
import { useApiFetch } from '../../hooks';
import { LoadingState, ErrorState, EmptyState } from '../../components';

type MarketplaceCategoryRouteProp = RouteProp<MainStackParamList, 'MarketplaceCategory'>;
type MarketplaceCategoryNavigationProp = StackNavigationProp<MainStackParamList, 'MarketplaceCategory'>;

// Memoize product icons outside component
const PRODUCT_ICONS: Record<string, string> = {
  'Wooden Elephant': '🐘',
  'Ceylon Tea': '☕',
  'Ceylon Black Tea': '☕',
  'Handwoven Basket': '🧺',
  'Cinnamon Sticks': '🌿',
  'Batik Sarong': '🧵',
  'Clay Pottery': '🏺',
  'Ceylon Sapphire': '💎',
};

const FILTER_OPTIONS = ['All', 'Traditional', 'Modern', 'Best Sellers', 'New Arrivals'];

// Separate filter chip component
interface FilterChipProps {
  filter: string;
  isActive: boolean;
  onPress: (filter: string) => void;
}

const FilterChip = React.memo<FilterChipProps>(({ filter, isActive, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(filter);
  }, [filter, onPress]);

  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={handlePress}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );
});

FilterChip.displayName = 'FilterChip';

// Separate product card component
interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductCard = React.memo<ProductCardProps>(({ product, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(product);
  }, [product, onPress]);

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={handlePress}
    >
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productIcon}>
          {PRODUCT_ICONS[product.name] || '🛍️'}
        </Text>
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>Rs. {product.price.toFixed(2)}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.starIcon}>⭐</Text>
        <Text style={styles.ratingText}>4.8 (24)</Text>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

const MarketplaceCategoryScreen = () => {
  const route = useRoute<MarketplaceCategoryRouteProp>();
  const navigation = useNavigation<MarketplaceCategoryNavigationProp>();
  const { categoryId, categoryName } = route.params;
  
  // Use custom hook for API fetching
  const { data: products, loading, error, refetch } = useApiFetch(
    () => marketplaceApi.getProducts(categoryName),
    { showErrorToast: true, errorMessage: 'Failed to load products. Please try again.' }
  );

  const [activeFilter, setActiveFilter] = useState('All');

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  }, [navigation]);

  const handleFilterPress = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  // Memoized filter keyExtractor
  const filterKeyExtractor = useCallback((item: string) => item, []);

  // Memoized product keyExtractor
  const productKeyExtractor = useCallback((item: Product) => item.id.toString(), []);

  // Memoized renderItem for filters
  const renderFilterItem = useCallback(({ item }: { item: string }) => (
    <FilterChip filter={item} isActive={activeFilter === item} onPress={handleFilterPress} />
  ), [activeFilter, handleFilterPress]);

  // Memoized renderItem for products
  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  const ListHeaderComponent = useMemo(() => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <Text style={styles.subtitle}>Explore authentic Sri Lankan products</Text>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTER_OPTIONS}
          renderItem={renderFilterItem}
          keyExtractor={filterKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
    </>
  ), [categoryName, navigation, renderFilterItem, filterKeyExtractor]);

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <LoadingState message="Loading products..." />;
    }
    
    if (error) {
      return <ErrorState message={error} onRetry={refetch} />;
    }

    if (!products || products.length === 0) {
      return (
        <EmptyState
          icon="📦"
          message="No Products Found"
          subtitle="There are no products available in this category yet."
        />
      );
    }

    return null;
  }, [loading, error, products, refetch]);

  const ListFooterComponent = useMemo(() => {
    if (!loading && !error && products && products.length > 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎨</Text>
          <Text style={styles.placeholderTitle}>Mock Data Display</Text>
          <Text style={styles.placeholderSubtitle}>
            Showing products from the backend API.
          </Text>
        </View>
      );
    }
    return null;
  }, [loading, error, products?.length]);

  return (
    <View style={styles.container}>
      <FlatList
        data={products || []}
        renderItem={renderProductItem}
        keyExtractor={productKeyExtractor}
        numColumns={2}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.productColumnWrapper}
        ListHeaderComponent={ListHeaderComponent}
        ListHeaderComponentStyle={styles.headerWrapper}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerWrapper: {
    marginHorizontal: -15,
    marginTop: -15,
    marginBottom: 0,
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersList: {
    paddingHorizontal: 10,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    padding: 15,
  },
  productColumnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIcon: {
    fontSize: 48,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 10,
    paddingBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    paddingHorizontal: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: 5,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 15,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default React.memo(MarketplaceCategoryScreen);
