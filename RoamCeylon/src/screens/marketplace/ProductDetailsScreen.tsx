import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';

type ProductDetailsNavigationProp = StackNavigationProp<MainStackParamList, 'ProductDetails'>;
type ProductDetailsRouteProp = RouteProp<MainStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const route = useRoute<ProductDetailsRouteProp>();
  const productId = route.params?.productId;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Medium');

  const sizes = ['Small', 'Medium', 'Large'];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.favoriteButton}>♡</Text>
        </TouchableOpacity>
      </View>

      {/* Product Image Placeholder */}
      <View style={styles.imageContainer}>
        <Text style={styles.productImageIcon}>🏺</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Authentic</Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Traditional Clay Pottery</Text>
          <Text style={styles.price}>Rs. 900.00</Text>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.stars}>
            <Text style={styles.starIcon}>⭐⭐⭐⭐⭐</Text>
          </View>
          <Text style={styles.ratingText}>4.8 (127 reviews)</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerIcon}>
            <Text style={styles.sellerEmoji}>👤</Text>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>Lanka Crafts Co.</Text>
            <Text style={styles.sellerLocation}>📍 Colombo, Sri Lanka</Text>
          </View>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            Handcrafted traditional clay pottery made by skilled artisans in Sri Lanka. Each piece is unique and represents centuries of craftsmanship. Perfect for home decoration or as a special gift.
          </Text>
        </View>

        {/* Size Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.sizeContainer}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeChip,
                  selectedSize === size && styles.sizeChipActive,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === size && styles.sizeTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>100% Handmade</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Eco-friendly materials</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Ships within 2-3 days</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>30-day return policy</Text>
            </View>
          </View>
        </View>

        {/* Placeholder notice */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎨</Text>
          <Text style={styles.placeholderSubtitle}>
            This is a placeholder product. Real product data will be loaded from the API.
          </Text>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton}>
          <Text style={styles.buyNowButtonText}>Buy Now</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  favoriteButton: {
    fontSize: 24,
    color: '#FF6B35',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImageIcon: {
    fontSize: 120,
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stars: {
    marginRight: 8,
  },
  starIcon: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sellerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerEmoji: {
    fontSize: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 13,
    color: '#666',
  },
  contactButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  sizeContainer: {
    flexDirection: 'row',
  },
  sizeChip: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sizeChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  sizeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sizeTextActive: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
  },
  featuresList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 80,
  },
  placeholderText: {
    fontSize: 36,
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailsScreen;
