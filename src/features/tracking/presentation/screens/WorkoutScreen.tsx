import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useWorkoutViewModel } from '../viewmodels/useWorkoutViewModel';

export const WorkoutScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { workoutId } = route.params || {};
  const { seconds, distance, isActive, formatTime, getPace, toggleActive } = useWorkoutViewModel(workoutId);

  const handleFinishWorkout = () => {
    navigation.replace('RunSummary', {
      distanceKm: distance,
      timeSeconds: seconds,
      workoutId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Workout</Text>
      </View>

      <View style={styles.statsContainer}>
        {/* Distance Display */}
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <Text style={styles.distanceText}>{distance.toFixed(2)}</Text>
          <Text style={styles.unitText}>kilometers</Text>
        </View>

        {/* Time & Pace Row */}
        <View style={styles.row}>
          <View style={styles.halfStatGroup}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.timeText}>{formatTime(seconds)}</Text>
          </View>
          <View style={styles.halfStatGroup}>
            <Text style={styles.statLabel}>CURRENT PACE</Text>
            <Text style={styles.timeText}>{getPace()}</Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>FINISH</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pauseButton, !isActive && styles.resumeButton]} 
          onPress={toggleActive}
        >
          <Text style={styles.pauseButtonText}>{isActive ? 'PAUSE' : 'RESUME'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9F85FF',
    letterSpacing: 1,
  },
  statsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  statGroup: {
    alignItems: 'center',
    marginBottom: 48,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A0A0AB',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 84,
    fontWeight: '900',
    color: '#FFF',
    includeFontPadding: false,
    lineHeight: 84,
  },
  unitText: {
    fontSize: 16,
    color: '#A0A0AB',
    fontWeight: '600',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 36,
  },
  halfStatGroup: {
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resumeButton: {
    backgroundColor: '#9F85FF',
    borderColor: '#9F85FF',
  },
  pauseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#00F2FE',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  finishButtonText: {
    color: '#0F0F12',
    fontSize: 16,
    fontWeight: '900',
  },
});
