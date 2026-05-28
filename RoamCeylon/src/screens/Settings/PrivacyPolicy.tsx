import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B5E27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Terms</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

          <Text style={styles.paragraph}>
            Welcome to Roam Ceylon! Your privacy is of paramount importance to us. This Privacy Policy details how we collect, use, disclose, and safeguard your personal information when you use our mobile application and services.
          </Text>

          <Text style={styles.subHeader}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect personal details such as your name, email address, phone number, date of birth, and nationality to customize your travel experience. We also collect location coordinates when you search for rides or explore destinations.
          </Text>

          <Text style={styles.subHeader}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your information helps us generate personalized AI itineraries, handle hotel reservations, coordinate transport services, and ensure security and customer support when utilizing emergency tools.
          </Text>

          <Text style={styles.subHeader}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We execute robust technical and administrative security measures to prevent unauthorized access, loss, or leakage of your private user profile data.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Terms of Use</Text>

          <Text style={styles.subHeader}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By creating an account or accessing Roam Ceylon, you agree to comply with and be bound by these Terms of Use and all applicable laws and regulations of Sri Lanka.
          </Text>

          <Text style={styles.subHeader}>2. App Usage Rules</Text>
          <Text style={styles.paragraph}>
            You agree to provide true and accurate information during registration. You shall not misuse the AI trip planner, book fraudulent rides or stays, or place false alerts through the emergency console.
          </Text>

          <Text style={styles.subHeader}>3. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Roam Ceylon serves as a digital companion and aggregator. We are not liable for scheduling disruptions, quality issues of third-party vendors, or external force majeure occurrences.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
    marginTop:50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6B5E27',
    letterSpacing: -0.5,
  },
  headerPlaceholder: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6B5E27',
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#A1A09B',
    marginBottom: 16,
    fontWeight: '600',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F4E4A',
    marginBottom: 18,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F3E3A',
    marginBottom: 8,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EFEA',
    marginVertical: 24,
  },
});

export default PrivacyPolicyScreen;
