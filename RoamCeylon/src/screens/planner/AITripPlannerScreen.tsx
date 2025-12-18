import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';

type AITripPlannerNavigationProp = StackNavigationProp<MainStackParamList, 'AITripPlanner'>;

const AITripPlannerScreen = () => {
  const navigation = useNavigation<AITripPlannerNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🤖✨</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>AI Trip Planner</Text>
        <Text style={styles.badge}>Coming Soon in Sprint 2</Text>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>What's Coming</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureText}>Chat-based trip planning with AI assistant</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>Personalized itinerary recommendations</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>Smart budget planning</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏨</Text>
            <Text style={styles.featureText}>Accommodation and activity suggestions</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureText}>Optimized travel schedules</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚀 In Development</Text>
          <Text style={styles.infoText}>
            Our AI-powered trip planner is being built to help you create the perfect Sri Lankan adventure.
            Get ready for intelligent recommendations tailored to your preferences, budget, and travel style.
          </Text>
        </View>

        {/* Expected Release */}
        <View style={styles.releaseCard}>
          <Text style={styles.releaseText}>Expected in Next Release</Text>
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
  backButton: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#0066CC',
    color: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 30,
  },
  descriptionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  releaseCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  releaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
  },
});

export default React.memo(AITripPlannerScreen);
