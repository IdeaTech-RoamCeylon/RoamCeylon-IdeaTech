import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RoamCeylon</Text>
        <Text style={styles.subtitle}>Explore Sri Lanka</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Explore' as never)}
        >
          <Text style={styles.cardTitle}>🗺️ Explore</Text>
          <Text style={styles.cardText}>Discover destinations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Marketplace' as never)}
        >
          <Text style={styles.cardTitle}>🛍️ Marketplace</Text>
          <Text style={styles.cardText}>Shop local goods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Transport' as never)}
        >
          <Text style={styles.cardTitle}>🚗 Transport</Text>
          <Text style={styles.cardText}>Book rides</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.cardTitle}>👤 Profile</Text>
          <Text style={styles.cardText}>Your account</Text>
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
    backgroundColor: '#0066CC',
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});

export default HomeScreen;
