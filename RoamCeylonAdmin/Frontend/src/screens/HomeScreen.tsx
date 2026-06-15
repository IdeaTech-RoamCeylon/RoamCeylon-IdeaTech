import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('nhostRefreshToken');
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="home-outline" size={40} color="#0E5E2F" />
        </View>
        <Text style={styles.title}>Welcome, Partner!</Text>
        <Text style={styles.subtitle}>
          Your admin dashboard is coming soon. This is a placeholder home screen.
        </Text>
      </View>

      {/* Info Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={28} color="#0E5E2F" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Dashboard</Text>
            <Text style={styles.cardDescription}>
              Role-based dashboards will be available soon for Hotel Managers, Activity Providers, Shop Partners, and Tour Guides.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="account-check-outline" size={28} color="#0E5E2F" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Authentication</Text>
            <Text style={styles.cardDescription}>
              You&apos;re successfully logged in! Your session is secured with Nhost authentication.
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAF6',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E5E2F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#494034',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dc3545',
    height: 52,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc3545',
  },
});

export default HomeScreen;
