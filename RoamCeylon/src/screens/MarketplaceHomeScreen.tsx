import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainStack';

type MarketplaceNavigationProp = StackNavigationProp<MainStackParamList, 'Marketplace'>;

const MarketplaceHomeScreen = () => {
  const navigation = useNavigation<MarketplaceNavigationProp>();

  const handleCategoryPress = (categoryName: string) => {
    // Navigate to ProductDetails screen
    navigation.navigate('ProductDetails', { productId: categoryName });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Shop authentic Sri Lankan products</Text>
      </View>

      <View style={styles.content}>
        {/* Featured Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Textiles')}>
              <Text style={styles.categoryIcon}>🧵</Text>
              <Text style={styles.categoryName}>Textiles</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Tea & Coffee')}>
              <Text style={styles.categoryIcon}>☕</Text>
              <Text style={styles.categoryName}>Tea & Coffee</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Spices')}>
              <Text style={styles.categoryIcon}>🌶️</Text>
              <Text style={styles.categoryName}>Spices</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Handicrafts')}>
              <Text style={styles.categoryIcon}>🎨</Text>
              <Text style={styles.categoryName}>Handicrafts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Gemstones')}>
              <Text style={styles.categoryIcon}>💎</Text>
              <Text style={styles.categoryName}>Gemstones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Coconut Products')}>
              <Text style={styles.categoryIcon}>🥥</Text>
              <Text style={styles.categoryName}>Coconut Products</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Placeholder for products */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🛍️</Text>
          <Text style={styles.placeholderTitle}>Product Listings Coming Soon</Text>
          <Text style={styles.placeholderSubtitle}>
            Browse and shop for authentic Sri Lankan products from local artisans
          </Text>
        </View>
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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#fff',
    margin: '1%',
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

export default MarketplaceHomeScreen;
