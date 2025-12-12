import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../../components';
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
        <Card
          style={styles.card}
          onPress={() => navigation.navigate('Explore' as never)}
        >
          <Text style={styles.cardTitle}>🗺️ Explore</Text>
          <Text style={styles.cardText}>Discover destinations</Text>
        </Card>

        <Card
          style={styles.card}
          onPress={() => navigation.navigate('Marketplace' as never)}
        >
          <Text style={styles.cardTitle}>🛍️ Marketplace</Text>
          <Text style={styles.cardText}>Shop local goods</Text>
        </Card>

        <Card
          style={styles.card}
          onPress={() => navigation.navigate('Transport' as never)}
        >
          <Text style={styles.cardTitle}>🚗 Transport</Text>
          <Text style={styles.cardText}>Book rides</Text>
        </Card>

        <Card
          style={styles.card}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.cardTitle}>👤 Profile</Text>
          <Text style={styles.cardText}>Your account</Text>
        </Card>
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
    margin: '1%',
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
