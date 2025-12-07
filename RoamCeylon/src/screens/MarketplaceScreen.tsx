import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MarketplaceScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Shop authentic Sri Lankan products</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🛍️</Text>
          <Text style={styles.placeholderTitle}>Marketplace Coming Soon</Text>
          <Text style={styles.placeholderSubtitle}>
            Browse local crafts, spices, tea, and more
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
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
  },
});

export default MarketplaceScreen;
