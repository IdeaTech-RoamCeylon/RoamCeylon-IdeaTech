import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import { aiService, TripPlanResponse } from '../../services/aiService';
import { usePlannerContext } from '../../context/PlannerContext';

type AITripPlannerNavigationProp = StackNavigationProp<MainStackParamList, 'AITripPlanner'>;

const AITripPlannerScreen = () => {
  const navigation = useNavigation<AITripPlannerNavigationProp>();
  const { query, setQuery, tripPlan, setTripPlan } = usePlannerContext();
  
  const [isLoading, setIsLoading] = useState(false);

  const budgets = ['Low', 'Medium', 'High', 'Luxury'];

  const updateQuery = (key: keyof typeof query, value: string) => {
    setQuery(prev => ({ ...prev, [key]: value }));
  };

  const handleGeneratePlan = async () => {
    if (!query.destination || !query.duration) {
      Alert.alert('Missing Info', 'Please enter both destination and duration.');
      return;
    }

    setIsLoading(true);
    // don't clear tripPlan immediately if you want to show previous results, but usually we want fresh request visual
    // setTripPlan(null); 

    try {
      const plan = await aiService.generateTripPlan(query);
      setTripPlan(plan);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate trip plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItinerary = (plan: TripPlanResponse) => (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultTitle}> Your Trip to {plan.destination}</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{plan.duration} Days</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Budget</Text>
          <Text style={styles.summaryValue}>{plan.budget}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Daily Itinerary</Text>
      {plan.itinerary.map((day) => (
        <View key={day.day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>Day {day.day}</Text>
          {day.activities.map((activity, index) => (
            <View key={index} style={styles.activityRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.activityText}>{activity}</Text>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={() => setTripPlan(null)}
      >
        <Text style={styles.resetButtonText}>Plan Another Trip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Trip Planner</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        {!tripPlan ? (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖✨</Text>
            </View>
            <Text style={styles.title}>Plan Your Adventure</Text>
            <Text style={styles.subtitle}>
              Let our AI assistant create a personalized itinerary for you.
            </Text>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Where to?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kandy, Ella, Sigiriya"
                  value={query.destination}
                  onChangeText={(text) => updateQuery('destination', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration (Days)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3"
                  keyboardType="numeric"
                  value={query.duration}
                  onChangeText={(text) => updateQuery('duration', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget Level</Text>
                <View style={styles.budgetSelector}>
                  {budgets.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.budgetOption,
                        query.budget === b && styles.budgetOptionSelected,
                      ]}
                      onPress={() => updateQuery('budget', b)}
                    >
                      <Text
                        style={[
                          styles.budgetOptionText,
                          query.budget === b && styles.budgetOptionTextSelected,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>✨ Generate Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          renderItinerary(tripPlan)
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    marginTop: 10,
    marginBottom: 10,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  budgetSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  budgetOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  budgetOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066CC',
  },
  budgetOptionText: {
    fontSize: 13,
    color: '#666',
  },
  budgetOptionTextSelected: {
    color: '#0066CC',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Iterinary Results Styles
  resultsContainer: {
    width: '100%',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    color: '#0066CC',
    marginRight: 8,
    marginTop: -2,
  },
  activityText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#0066CC',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default React.memo(AITripPlannerScreen);
