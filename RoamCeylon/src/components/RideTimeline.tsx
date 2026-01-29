import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type RideStatus = 'requested' | 'assigned' | 'enroute' | 'arrived' | 'inprogress' | 'completed';

interface TimelineStep {
  status: RideStatus;
  label: string;
  icon: string;
}

interface RideTimelineProps {
  currentStatus: RideStatus;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { status: 'requested', label: 'Ride Requested', icon: '📱' },
  { status: 'assigned', label: 'Driver Assigned', icon: '👤' },
  { status: 'enroute', label: 'Driver En Route', icon: '🚗' },
  { status: 'arrived', label: 'Driver Arrived', icon: '📍' },
  { status: 'inprogress', label: 'Trip Started', icon: '🛣️' },
  { status: 'completed', label: 'Trip Completed', icon: '✅' },
];

const RideTimeline: React.FC<RideTimelineProps> = ({ currentStatus }) => {
  const currentIndex = TIMELINE_STEPS.findIndex(step => step.status === currentStatus);

  const getStepStyle = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Status</Text>
      
      <View style={styles.timeline}>
        {TIMELINE_STEPS.map((step, index) => {
          const stepStyle = getStepStyle(index);
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <View key={step.status} style={styles.stepContainer}>
              <View style={styles.stepRow}>
                <View style={styles.iconColumn}>
                  <View
                    style={[
                      styles.iconCircle,
                      stepStyle === 'completed' && styles.iconCircleCompleted,
                      stepStyle === 'active' && styles.iconCircleActive,
                    ]}
                  >
                    <Text style={styles.iconText}>{step.icon}</Text>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.connector,
                        stepStyle === 'completed' && styles.connectorCompleted,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.labelColumn}>
                  <Text
                    style={[
                      styles.label,
                      stepStyle === 'active' && styles.labelActive,
                      stepStyle === 'completed' && styles.labelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {stepStyle === 'active' && (
                    <View style={styles.pulseContainer}>
                      <View style={styles.pulse} />
                      <Text style={styles.activeText}>In Progress</Text>
                    </View>
                  )}
                  {stepStyle === 'completed' && (
                    <Text style={styles.completedText}>✓ Done</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
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
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 5,
  },
  stepContainer: {
    marginBottom: 5,
  },
  stepRow: {
    flexDirection: 'row',
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  iconCircleActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0066CC',
    borderWidth: 3,
  },
  iconCircleCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  iconText: {
    fontSize: 20,
  },
  connector: {
    width: 3,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  labelColumn: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  labelActive: {
    color: '#0066CC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  labelCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066CC',
    marginRight: 8,
  },
  activeText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
});

export default React.memo(RideTimeline);
