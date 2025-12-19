import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList, Category } from '../../types';
import marketplaceApi from '../../services/marketplaceApi';
import { useApiFetch } from '../../hooks';
import { LoadingState, ErrorState } from '../../components';

type MarketplaceNavigationProp = StackNavigationProp<MainStackParamList, 'Marketplace'>;

// Memoize category icons outside component to prevent recreation
const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '📱',
  'Souvenirs': '🎁',
  'Food': '🍽️',
  'Textiles': '🧵',
  'Tea & Coffee': '☕',
  'Spices': '🌶️',
  'Handicrafts': '🎨',
  'Gemstones': '💎',
  'Coconut Products': '🥥',
};

// Separate category card component for better memoization
interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

const CategoryCard = React.memo<CategoryCardProps>(({ category, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(category);
  }, [category, onPress]);

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={handlePress}
    >
      <Text style={styles.categoryIcon}>
        {CATEGORY_ICONS[category.name] || '📦'}
      </Text>
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );
});

CategoryCard.displayName = 'CategoryCard';

const MarketplaceHomeScreen = () => {
  const navigation = useNavigation<MarketplaceNavigationProp>();
  
  // Use custom hook for API fetching - eliminates manual state management
  const { data: categories, loading, error, refetch } = useApiFetch(
    marketplaceApi.getCategories,
    { showErrorToast: true, errorMessage: 'Failed to load categories. Please try again.' }
  );

  const handleCategoryPress = useCallback((category: Category) => {
    navigation.navigate('MarketplaceCategory', { 
      categoryId: category.id,
      categoryName: category.name 
    });
  }, [navigation]);

  // Memoize keyExtractor to prevent recreation
  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  // Memoize renderItem to prevent recreation
  const renderCategoryItem = useCallback(({ item }: { item: Category }) => (
    <CategoryCard category={item} onPress={handleCategoryPress} />
  ), [handleCategoryPress]);

  // Memoize numColumns calculation
  const numColumns = 3;

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shop by Category</Text>
    </View>
  ), []);

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <LoadingState message="Loading categories..." />;
    }
    
    if (error) {
      return <ErrorState message={error} onRetry={refetch} />;
    }

    return null;
  }, [loading, error, refetch]);

  const ListFooterComponent = useMemo(() => {
    if (!loading && !error) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🛍️</Text>
          <Text style={styles.placeholderTitle}>Product Listings Coming Soon</Text>
          <Text style={styles.placeholderSubtitle}>
            Browse and shop for authentic Sri Lankan products from local artisans
          </Text>
        </View>
      );
    }
    return null;
  }, [loading, error]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Shop authentic Sri Lankan products</Text>
      </View>

      <FlatList
        data={categories || []}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.content}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        columnWrapperStyle={styles.columnWrapper}
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
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default React.memo(MarketplaceHomeScreen);
