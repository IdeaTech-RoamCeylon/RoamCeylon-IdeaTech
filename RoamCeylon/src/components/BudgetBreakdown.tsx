import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BudgetCategory {
  name: string;
  amount: number;
  color: string;
  icon: string;
}

interface BudgetBreakdownProps {
  budget: string;
  duration: string;
}

const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ budget, duration }) => {
  // Mock budget data based on budget level
  const getBudgetData = (): { total: number; categories: BudgetCategory[] } => {
    const days = parseInt(duration) || 1;
    
    const budgetMultipliers = {
      Low: 50,
      Medium: 100,
      High: 200,
      Luxury: 400,
    };

    const baseAmount = budgetMultipliers[budget as keyof typeof budgetMultipliers] || 100;
    const total = baseAmount * days;

    return {
      total,
      categories: [
        { name: 'Accommodation', amount: total * 0.35, color: '#FF6B6B', icon: '🏨' },
        { name: 'Food', amount: total * 0.25, color: '#4ECDC4', icon: '🍽️' },
        { name: 'Activities', amount: total * 0.25, color: '#45B7D1', icon: '🎭' },
        { name: 'Transport', amount: total * 0.15, color: '#FFA07A', icon: '🚗' },
      ],
    };
  };

  const budgetData = getBudgetData();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estimated Budget</Text>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Estimated Cost</Text>
        <Text style={styles.totalAmount}>${budgetData.total.toFixed(0)}</Text>
        <Text style={styles.perDay}>≈ ${(budgetData.total / parseInt(duration)).toFixed(0)} per day</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {budgetData.categories.map((category, index) => {
          const percentage = (category.amount / budgetData.total) * 100;
          return (
            <View key={index} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
              <View style={styles.categoryDetails}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { width: `${percentage}%`, backgroundColor: category.color }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryAmount}>${category.amount.toFixed(0)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          💡 This is an estimated budget. Actual costs may vary.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  totalContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  perDay: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryRow: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  disclaimer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

export default React.memo(BudgetBreakdown);
