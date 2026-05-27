import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface DaySelectorProps {
  days: number[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ days, selectedDay, onSelectDay }) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayTab,
              selectedDay === day && styles.dayTabSelected
            ]}
            onPress={() => onSelectDay(day)}
          >
            <Text 
              style={[
                styles.dayText,
                selectedDay === day && styles.dayTextSelected
              ]}
            >
              Day {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    marginBottom: 5,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginHorizontal: 6,
    borderRadius: 30, // Pill shape
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FFC107', // Yellow border
  },
  dayTabSelected: {
    backgroundColor: '#FFF8E1', // Light yellow/gold background
    borderColor: '#FFC107',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  dayTextSelected: {
    color: '#333', // Dark text when selected
  },
});

export default DaySelector;
