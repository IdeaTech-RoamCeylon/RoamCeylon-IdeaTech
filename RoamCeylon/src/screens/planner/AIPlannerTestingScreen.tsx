import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import { aiService, TripPlanRequest, TripActivity } from '../../services/aiService';

type AIPlannerTestingNavigationProp = StackNavigationProp<MainStackParamList, 'AIPlannerTesting'>;

interface RankingComparison {
  activity: TripActivity;
  baselineScore: number;
  optimizedScore: number;
  scoreDifference: number;
  percentChange: number;
}

interface TestResult {
  destination: string;
  timestamp: Date;
  optimizationEnabled: boolean;
  comparisons: RankingComparison[];
  averageImprovement: number;
}

const AIPlannerTestingScreen = () => {
  const navigation = useNavigation<AIPlannerTestingNavigationProp>();
  const [optimizationEnabled, setOptimizationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);

  // Test configuration
  const [testDestination, setTestDestination] = useState('Kandy');
  const [testDuration, setTestDuration] = useState('3 days');
  const [testBudget] = useState('Medium');
  const [testInterests] = useState(['Culture', 'Nature', 'Adventure']);

  // Calculate ranking score based on activity properties
  const calculateRankingScore = (activity: TripActivity, useOptimized: boolean): number => {
    let score = 50; // Base score

    // Confidence score weighting
    if (activity.confidenceScore === 'High') score += 25;
    else if (activity.confidenceScore === 'Medium') score += 15;
    else if (activity.confidenceScore === 'Low') score += 5;

    // Preference matching
    const matchCount = activity.matchedPreferences?.length || 0;
    score += matchCount * 8;

    // Positive feedback bonus
    if (activity.hasPositiveFeedback) {
      score += 15;
    }

    // Optimization algorithm improvements (simulated)
    if (useOptimized) {
      // Weighted improvements for better context matching
      score += matchCount * 2; // Better preference weighting
      if (activity.hasPositiveFeedback) score += 5; // Enhanced feedback influence
      if (activity.confidenceScore === 'High') score += 8; // Confidence boost

      // Penalty reduction for low confidence
      if (activity.confidenceScore === 'Low') score += 3;
    }

    return Math.min(100, Math.max(0, score));
  };

  const runComparisonTest = useCallback(async () => {
    setIsLoading(true);
    try {
      // Prepare request
      const request: TripPlanRequest = {
        destination: testDestination,
        duration: testDuration,
        budget: testBudget,
        interests: testInterests,
        useSavedContext: true,
        mode: 'new',
      };

      // Generate trip plan
      const planResponse = await aiService.generateTripPlan(request);

      // Extract all activities from the itinerary
      const allActivities: TripActivity[] = [];
      planResponse.itinerary.forEach(day => {
        allActivities.push(...day.activities);
      });

      if (allActivities.length === 0) {
        Alert.alert('No Activities', 'No activities were generated for comparison.');
        return;
      }

      // Compare baseline vs optimized scores
      const comparisons: RankingComparison[] = allActivities.map(activity => {
        const baselineScore = calculateRankingScore(activity, false);
        const optimizedScore = calculateRankingScore(activity, true);
        const scoreDifference = optimizedScore - baselineScore;
        const percentChange = baselineScore > 0
          ? ((scoreDifference / baselineScore) * 100)
          : 0;

        return {
          activity,
          baselineScore,
          optimizedScore,
          scoreDifference,
          percentChange,
        };
      });

      // Calculate average improvement
      const avgImprovement = comparisons.reduce((sum, comp) =>
        sum + comp.scoreDifference, 0) / comparisons.length;

      const results: TestResult = {
        destination: testDestination,
        timestamp: new Date(),
        optimizationEnabled,
        comparisons,
        averageImprovement: parseFloat(avgImprovement.toFixed(2)),
      };

      setTestResults(results);

      Alert.alert(
        'Test Complete',
        `Average improvement: ${avgImprovement.toFixed(2)} points\n` +
        `Total activities tested: ${comparisons.length}`
      );
    } catch (error) {
      console.error('Comparison test failed:', error);
      Alert.alert('Test Failed', 'Unable to run comparison test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [testDestination, testDuration, testBudget, testInterests, optimizationEnabled]);

  const renderComparisonCard = (comparison: RankingComparison, index: number) => {
    const isImproved = comparison.scoreDifference > 0;
    const isNeutral = comparison.scoreDifference === 0;

    return (
      <View key={index} style={styles.comparisonCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={2}>
            {comparison.activity.description}
          </Text>
          {comparison.activity.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{comparison.activity.category}</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Baseline</Text>
            <Text style={styles.scoreValue}>{comparison.baselineScore.toFixed(1)}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons
              name={isImproved ? "arrow-forward" : isNeutral ? "remove" : "arrow-back"}
              size={24}
              color={isImproved ? "#10B981" : isNeutral ? "#6B7280" : "#EF4444"}
            />
          </View>

          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Optimized</Text>
            <Text style={[
              styles.scoreValue,
              isImproved ? styles.improvedScore : isNeutral ? styles.neutralScore : styles.decreasedScore
            ]}>
              {comparison.optimizedScore.toFixed(1)}
            </Text>
          </View>

          <View style={styles.differenceContainer}>
            <Text style={[
              styles.differenceText,
              isImproved ? styles.positiveChange : isNeutral ? styles.neutralChange : styles.negativeChange
            ]}>
              {comparison.scoreDifference > 0 ? '+' : ''}{comparison.scoreDifference.toFixed(1)}
            </Text>
            <Text style={styles.percentText}>
              ({comparison.percentChange > 0 ? '+' : ''}{comparison.percentChange.toFixed(1)}%)
            </Text>
          </View>
        </View>

        {/* Activity Metadata */}
        <View style={styles.metadataContainer}>
          {comparison.activity.confidenceScore && (
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons name="chart-line" size={14} color="#6B7280" />
              <Text style={styles.metadataText}>{comparison.activity.confidenceScore}</Text>
            </View>
          )}
          {comparison.activity.hasPositiveFeedback && (
            <View style={styles.metadataItem}>
              <Ionicons name="thumbs-up" size={14} color="#10B981" />
              <Text style={styles.metadataText}>Positive Feedback</Text>
            </View>
          )}
          {comparison.activity.matchedPreferences && comparison.activity.matchedPreferences.length > 0 && (
            <View style={styles.metadataItem}>
              <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
              <Text style={styles.metadataText}>
                {comparison.activity.matchedPreferences.length} matches
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#edfaea', '#d5f2ce', '#b6e9ab']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Planner Testing</Text>
        <View style={styles.internalBadge}>
          <Text style={styles.internalText}>INTERNAL</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Optimization Toggle Card */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleHeader}>
            <MaterialCommunityIcons name="brain" size={24} color="#F59E0B" />
            <Text style={styles.toggleTitle}>Optimization Mode</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {optimizationEnabled ? 'Optimized Ranking ON' : 'Baseline Ranking'}
            </Text>
            <Switch
              value={optimizationEnabled}
              onValueChange={setOptimizationEnabled}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={optimizationEnabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
          <Text style={styles.toggleDescription}>
            {optimizationEnabled
              ? 'Using enhanced ranking algorithm with improved weighting'
              : 'Using standard baseline ranking algorithm'}
          </Text>
        </View>

        {/* Test Configuration */}
        <View style={styles.configCard}>
          <Text style={styles.sectionTitle}>Test Configuration</Text>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Destination:</Text>
            <Text style={styles.configValue}>{testDestination}</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Duration:</Text>
            <Text style={styles.configValue}>{testDuration}</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Budget:</Text>
            <Text style={styles.configValue}>{testBudget}</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Interests:</Text>
            <Text style={styles.configValue}>{testInterests.join(', ')}</Text>
          </View>
        </View>

        {/* Run Test Button */}
        <TouchableOpacity
          onPress={runComparisonTest}
          disabled={isLoading}
          style={styles.testButton}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#FFDE59', '#FFBD0C']}
            style={styles.testButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="test-tube" size={20} color="#000" />
                <Text style={styles.testButtonText}>Run Comparison Test</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Test Results */}
        {testResults && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsSummary}>
              <Text style={styles.resultsTitle}>Test Results</Text>
              <Text style={styles.resultsTimestamp}>
                {testResults.timestamp.toLocaleTimeString()}
              </Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Activities Tested</Text>
                  <Text style={styles.summaryValue}>{testResults.comparisons.length}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Improvement</Text>
                  <Text style={[
                    styles.summaryValue,
                    testResults.averageImprovement > 0 ? styles.positiveChange : styles.neutralChange
                  ]}>
                    {testResults.averageImprovement > 0 ? '+' : ''}{testResults.averageImprovement}
                  </Text>
                </View>
              </View>
            </View>

            {/* Individual Comparisons */}
            <Text style={styles.comparisonHeader}>Ranking Comparisons</Text>
            {testResults.comparisons.map((comparison, index) =>
              renderComparisonCard(comparison, index)
            )}
          </View>
        )}

        {!testResults && !isLoading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-box-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No test results yet</Text>
            <Text style={styles.emptyStateDescription}>
              Run a comparison test to see baseline vs optimized ranking differences
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  internalBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    right: 20,
    top: 50,
  },
  internalText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  configLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  configValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  testButton: {
    marginBottom: 24,
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  resultsTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  comparisonHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  improvedScore: {
    color: '#10B981',
  },
  neutralScore: {
    color: '#6B7280',
  },
  decreasedScore: {
    color: '#EF4444',
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  differenceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  differenceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveChange: {
    color: '#10B981',
  },
  neutralChange: {
    color: '#6B7280',
  },
  negativeChange: {
    color: '#EF4444',
  },
  percentText: {
    fontSize: 11,
    color: '#6B7280',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metadataText: {
    fontSize: 11,
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default AIPlannerTestingScreen;
