import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainStack';
import marketplaceApi, { Product } from '../services/marketplaceApi';

type MarketplaceCategoryRouteProp = RouteProp<MainStackParamList, 'MarketplaceCategory'>;
type MarketplaceCategoryNavigationProp = StackNavigationProp<MainStackParamList, 'MarketplaceCategory'>;

const MarketplaceCategoryScreen = () => {
  const route = useRoute<MarketplaceCategoryRouteProp>();
  const navigation = useNavigation<MarketplaceCategoryNavigationProp>();
  const { categoryId, categoryName } = route.params;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceApi.getProducts(categoryId);
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  // Product icons mapping
  const productIcons: Record<string, string> = {
    'Wooden Elephant': '🐘',
    'Ceylon Tea': '☕',
    'Ceylon Black Tea': '☕',
    'Handwoven Basket': '🧺',
    'Cinnamon Sticks': '🌿',
    'Batik Sarong': '🧵',
    'Clay Pottery': '🏺',
    'Ceylon Sapphire': '💎',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <Text style={styles.subtitle}>Explore authentic Sri Lankan products</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Traditional', 'Modern', 'Best Sellers', 'New Arrivals'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : products.length > 0 ? (
          <>
            <View style={styles.grid}>
              {products.map((product) => (
                <TouchableOpacity 
                  key={product.id} 
                  style={styles.productCard}
                  onPress={() => handleProductPress(product)}
                >
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productIcon}>
                      {productIcons[product.name] || '🛍️'}
                    </Text>
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>Rs. {product.price.toFixed(2)}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.ratingText}>4.8 (24)</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Placeholder notice */}
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>🎨</Text>
              <Text style={styles.placeholderTitle}>Mock Data Display</Text>
              <Text style={styles.placeholderSubtitle}>
                Showing products from the backend API.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              There are no products available in this category yet.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 10,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MarketplaceCategoryScreen;
