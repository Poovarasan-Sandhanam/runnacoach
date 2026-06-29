import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRunSummaryViewModel } from '../viewmodels/useRunSummaryViewModel';
import { EffortLevel } from '../../domain/models/RunSession';

export const RunSummaryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { distanceKm, timeSeconds, workoutId } = route.params;
  const { effort, setEffort, getPace, logRun } = useRunSummaryViewModel(distanceKm, timeSeconds, workoutId);

  const handleSave = async () => {
    await logRun();
    navigation.popToTop();
  };

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Run Completed! 🎉</Text>
        <Text style={styles.subtitle}>You did awesome. Here are your stats:</Text>

        <View style={styles.summaryCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{formatDuration(timeSeconds)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>AVERAGE PACE</Text>
            <Text style={styles.statValue}>{getPace()}</Text>
          </View>
        </View>

        {/* Effort level picker */}
        <View style={styles.effortSection}>
          <Text style={styles.effortTitle}>How did that effort feel?</Text>
          <Text style={styles.effortSubtitle}>Our Adaptive Coach uses this rating to optimize your next workout.</Text>

          <View style={styles.optionsContainer}>
            {(['Easy', 'Medium', 'Hard'] as EffortLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  effort === level && styles.selectedOptionButton,
                  level === 'Easy' && effort === 'Easy' && styles.optionEasy,
                  level === 'Medium' && effort === 'Medium' && styles.optionMedium,
                  level === 'Hard' && effort === 'Hard' && styles.optionHard
                ]}
                onPress={() => setEffort(level)}
              >
                <Text style={[styles.optionText, effort === level && styles.selectedOptionText]}>
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>SAVE & BACK TO DASHBOARD</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00F2FE',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0AB',
    textAlign: 'center',
    marginBottom: 36,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 24,
    marginBottom: 40,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  effortSection: {
    alignItems: 'center',
  },
  effortTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  effortSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedOptionButton: {
    borderWidth: 1,
    elevation: 4,
  },
  optionEasy: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    borderColor: '#4CD964',
  },
  optionMedium: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: '#00F2FE',
  },
  optionHard: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0A0AB',
  },
  selectedOptionText: {
    color: '#FFF',
    fontWeight: '900',
  },
  saveButton: {
    backgroundColor: '#00F2FE',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#0F0F12',
    fontSize: 15,
    fontWeight: '900',
  },
});
