import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface TripPlannerFormProps {
  query: {
    destination: string;
    duration: string;
    budget: string;
  };
  updateQuery: (key: 'destination' | 'duration' | 'budget', value: string) => void;
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

        <TouchableOpacity
          style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
          onPress={onGenerate}
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
