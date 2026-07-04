import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useRunSummaryViewModel } from '../viewmodels/useRunSummaryViewModel';

export const RunSummaryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { distanceKm, timeSeconds, workoutId } = route.params;
  const {
    rpe,
    setRpe,
    soreness,
    setSoreness,
    sleepQuality,
    setSleepQuality,
    avgHeartRate,
    setAvgHeartRate,
    getPace,
    logRun,
  } = useRunSummaryViewModel(distanceKm, timeSeconds, workoutId);

  const handleSave = async () => {
    await logRun();
    navigation.popToTop();
  };

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const getRpeLabel = (val: number) => {
    if (val <= 3) return 'Easy / Recovery';
    if (val <= 7) return 'Moderate / Aerobic Tempo';
    return 'Hard / Threshold / High Intensity';
  };

  const getSorenessLabel = (val: number) => {
    const labels = ['No pain, fully fresh', 'Mild tightness', 'Moderate muscle fatigue', 'Severe fatigue / Guarded movement', 'Sharp pain / Injury warning'];
    return labels[val - 1] || '';
  };

  const getSleepLabel = (val: number) => {
    const labels = ['Restless / Poor sleep', 'Interrupted sleep', 'Good sleep', 'Very restful sleep', 'Peak recovery sleep'];
    return labels[val - 1] || '';
  };

  const getCoachingFeedback = () => {
    if (soreness >= 4) {
      return "High muscle fatigue detected. We'll automatically dial back your next session's volume to safeguard your recovery.";
    }
    if (rpe <= 3 && avgHeartRate >= 155) {
      return "Warning: Your heart rate was elevated for a recovery run. Keep your next runs extra slow to avoid building excess strain.";
    }
    if (rpe <= 3) {
      return "Perfect recovery effort! Staying in this low intensity zone builds capillary networks and accelerates healing.";
    }
    if (rpe >= 8) {
      return "Strong high-effort session! Make sure to hydrate and prioritize sleep today to locked-in these aerobic gains.";
    }
    return "Great work! You logged a consistent, aerobic base building run. Your training load is looking steady.";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Run Completed! 🎉</Text>
        <Text style={styles.subtitle}>Excellent work. Let's record your load signals.</Text>

        {/* Stats card */}
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

        {/* 1. RPE SELECTOR (1-10) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perceived Effort (RPE)</Text>
          <Text style={styles.sectionSubtitle}>Rate the intensity from 1 (rest) to 10 (max effort).</Text>
          <View style={styles.rpeGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.rpeChip,
                  rpe === val && styles.activeRpeChip,
                  rpe === val && val <= 3 && styles.rpeEasy,
                  rpe === val && val > 3 && val <= 7 && styles.rpeMedium,
                  rpe === val && val > 7 && styles.rpeHard,
                ]}
                onPress={() => setRpe(val)}
              >
                <Text style={[styles.rpeText, rpe === val && styles.activeRpeText]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.indicatorLabel}>{getRpeLabel(rpe)}</Text>
        </View>

        {/* 2. SORENESS SELECTOR (1-5) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Soreness</Text>
          <Text style={styles.sectionSubtitle}>Rate localized muscle discomfort or soreness.</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.selectorChip,
                  soreness === val && styles.activeSelectorChip,
                  soreness === val && val >= 4 && styles.sorenessDanger,
                ]}
                onPress={() => setSoreness(val)}
              >
                <Text style={[styles.chipText, soreness === val && styles.activeChipText]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.indicatorLabel}>{getSorenessLabel(soreness)}</Text>
        </View>

        {/* 3. SLEEP QUALITY (1-5) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep & Recovery Feel</Text>
          <Text style={styles.sectionSubtitle}>How restored do you feel from your recent rest?</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.selectorChip,
                  sleepQuality === val && styles.activeSelectorChip,
                ]}
                onPress={() => setSleepQuality(val)}
              >
                <Text style={[styles.chipText, sleepQuality === val && styles.activeChipText]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.indicatorLabel}>{getSleepLabel(sleepQuality)}</Text>
        </View>

        {/* 4. HEART RATE INPUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Heart Rate</Text>
          <Text style={styles.sectionSubtitle}>Used to assess objective aerobic efficiency (Pace/HR).</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.heartIcon}>❤️</Text>
            <TextInput
              style={styles.hrInput}
              keyboardType="number-pad"
              value={avgHeartRate ? avgHeartRate.toString() : ''}
              onChangeText={(text) => {
                const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
                setAvgHeartRate(isNaN(parsed) ? 0 : parsed);
              }}
              placeholder="e.g. 145"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text style={styles.unitText}>BPM</Text>
          </View>
        </View>

        {/* Dynamic Coaching Feedback Box */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Coach's Advice</Text>
          <Text style={styles.feedbackBodyText}>{getCoachingFeedback()}</Text>
        </View>

        {/* Divergence warning simulation */}
        {rpe <= 3 && avgHeartRate >= 155 && (
          <View style={styles.divergenceCard}>
            <Text style={styles.divergenceTitle}>⚠️ Cardiovascular Divergence Alert</Text>
            <Text style={styles.divergenceBody}>
              Your heart rate ({avgHeartRate} BPM) was higher than usual for an easy effort. Let's make sure to keep a comfortable, controlled pace in your next sessions to help your body recover.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE & SYNC TO ADAPTIVE PLAN</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00F2FE',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0AB',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 14,
    lineHeight: 16,
  },
  rpeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  rpeChip: {
    width: '18%',
    aspectRatio: 1.1,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeRpeChip: {
    borderColor: '#9F85FF',
    elevation: 4,
  },
  rpeEasy: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    borderColor: '#4CD964',
  },
  rpeMedium: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: '#00F2FE',
  },
  rpeHard: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  rpeText: {
    color: '#A0A0AB',
    fontSize: 14,
    fontWeight: '700',
  },
  activeRpeText: {
    color: '#FFF',
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  selectorChip: {
    flex: 1,
    aspectRatio: 1.3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSelectorChip: {
    backgroundColor: '#9F85FF',
    borderColor: '#9F85FF',
  },
  sorenessDanger: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  chipText: {
    color: '#A0A0AB',
    fontSize: 14,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#0F0F12',
    fontWeight: '900',
  },
  indicatorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9F85FF',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
  },
  heartIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  hrInput: {
    flex: 1,
    height: 50,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  unitText: {
    color: '#8E8E93',
    fontWeight: '700',
    fontSize: 12,
  },
  divergenceCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    padding: 16,
    marginBottom: 20,
  },
  divergenceTitle: {
    color: '#FF3B30',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  divergenceBody: {
    color: '#A0A0AB',
    fontSize: 12,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#00F2FE',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#0F0F12',
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackBodyText: {
    fontSize: 13,
    color: '#A0A0AB',
    lineHeight: 18,
    fontWeight: '600',
  },
});
