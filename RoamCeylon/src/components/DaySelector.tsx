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
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  dayTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dayTabSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dayTextSelected: {
    color: '#fff',
  },
});

export default DaySelector;
