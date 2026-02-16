import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { InterestSelector } from '../../components/InterestSelector';
import { PaceSelector } from '../../components/PaceSelector';

interface TripPlannerFormProps {
  query: {
    destination: string;
    duration: string;
    budget: string;
    interests: string[];
    pace: string;
  };
  updateQuery: (key: 'destination' | 'duration' | 'budget' | 'interests' | 'pace', value: string | string[]) => void;
  isLoading: boolean;
  onGenerate: () => void;
  isConnected: boolean;
  budgets: string[];
  error?: string | null;
}

export const TripPlannerForm = React.memo(({
  query,
  updateQuery,
  isLoading,
  onGenerate,
  isConnected,
  budgets,
  error
}: TripPlannerFormProps) => {
  return (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🤖✨</Text>
      </View>
      <Text style={styles.title}>Plan Your Adventure</Text>
      <Text style={styles.subtitle}>
        Let our AI assistant create a personalized itinerary for you.
      </Text>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Travel Interests</Text>
          <InterestSelector
            selectedInterests={query.interests}
            onInterestsChange={(interests) => updateQuery('interests', interests)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Travel Pace</Text>
          <PaceSelector
            selectedPace={query.pace}
            onPaceChange={(pace) => updateQuery('pace', pace)}
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
          onPress={() => {
            // Client-side validations for edge cases
            const days = parseInt(query.duration, 10);
            
            // 1. Validate Duration Limits
            if (isNaN(days) || days < 1) {
               // Alert.alert('Invalid Duration', 'Trip must be at least 1 day.');
               // Using onGenerate which parent parses, but we intercept here.
               // Actually parent currently checks for empty strings.
                updateQuery('duration', '1'); // Auto-fix
                return;
            }
            if (days > 30) {
              updateQuery('duration', '30'); // Cap at 30
               // You might want to alert the user too
            }

            // 2. Conflicting Preferences: Short Trip + Many Interests
            // Validation Logic
            const validationErrors = [];
            
            if (!query.destination.trim()) {
                validationErrors.push("Please enter a destination.");
            }
            
            if (isNaN(days) || days <= 0) {
                validationErrors.push("Duration must be at least 1 day.");
            } else if (days > 30) {
                validationErrors.push("Trips cannot exceed 30 days.");
            }

            // Edge Case: Conflicting Preferences (Too many interests for short duration)
            if (days <= 2 && query.interests.length > 3) {
                 validationErrors.push(`Too many interests for a ${days}-day trip. Please remove ${query.interests.length - 3} interests.`);
            }

            // Edge Case: Conflicting Pace (Relaxed vs Many Interests)
            if (query.pace === 'Relaxed' && query.interests.length > 4) {
                validationErrors.push("Too many interests for a 'Relaxed' pace. Try 'Fast' or remove interests.");
            }

            if (validationErrors.length > 0) {
                // Show first error
                // We can't set the parent 'error' prop. 
                // We will use alert for immediate feedback
                const React = require('react'); // Ensure React is available if not in scope, though it is at top
                const { Alert } = require('react-native');
                Alert.alert("Please Check Your Plan", validationErrors[0]);
                return;
            }

            onGenerate();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate Plan</Text>
          )}
        </TouchableOpacity>
        
        {error && (
          <View style={styles.errorContainer}>
             <Text style={styles.errorText}>{error}</Text>
             <TouchableOpacity 
               style={styles.retryButton}
               onPress={onGenerate}
               disabled={isLoading || !isConnected}
             >
               <Text style={styles.retryButtonText}>Retry</Text>
             </TouchableOpacity>
          </View>
        )}
        
        {!isConnected && (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>📡 Offline</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
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
  errorContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignItems: 'center',
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
});
