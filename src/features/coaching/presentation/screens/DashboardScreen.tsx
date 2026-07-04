import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { Workout } from '../../domain/models/Workout';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { 
    user, 
    currentPlan, 
    history, 
    totalDistance, 
    weeklyProgress, 
    nextWorkout, 
    trainingStatus, 
    trainingStatusExplanation, 
    weeklySummary, 
    syncData 
  } = useDashboardViewModel();

  if (!user || !currentPlan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Loading Plan...</Text>
      </View>
    );
  }

  const handleStartWorkout = (workoutId: string) => {
    navigation.navigate('ActiveWorkout', { workoutId });
  };

  const getDayName = (dayNum: number) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayNum - 1] || 'Day';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={syncData}>
          <Text style={styles.syncButtonText}>Sync</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* WEEKLY OUTCOME SUMMARY */}
        <View style={styles.weeklySummaryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={styles.summaryTitle}>Coach's Weekly Log</Text>
            <View style={[
              styles.statusBadge,
              trainingStatus === 'Building' && styles.statusBuilding,
              trainingStatus === 'Recovering' && styles.statusRecovering,
              trainingStatus === 'Ready' && styles.statusReady
            ]}>
              <Text style={[
                styles.statusBadgeText,
                trainingStatus === 'Building' && styles.statusBuildingText,
                trainingStatus === 'Recovering' && styles.statusRecoveringText,
                trainingStatus === 'Ready' && styles.statusReadyText
              ]}>
                {trainingStatus === 'Building' ? '⚡ BUILDING' : trainingStatus === 'Recovering' ? '🛡️ RECOVERING' : '🟢 READY'}
              </Text>
            </View>
          </View>
          <Text style={styles.summaryBody}>{weeklySummary}</Text>
          <Text style={styles.statusExplanationText}>{trainingStatusExplanation}</Text>
        </View>

        {/* STATS OVERVIEW CARD */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Training Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{history.length}</Text>
              <Text style={styles.statLbl}>Runs Logged</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalDistance.toFixed(1)} km</Text>
              <Text style={styles.statLbl}>Total Distance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{Math.round(weeklyProgress * 100)}%</Text>
              <Text style={styles.statLbl}>Plan Progress</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${weeklyProgress * 100}%` }]} />
          </View>
        </View>

        {/* NEXT WORKOUT CALLOUT */}
        {nextWorkout ? (
          <View style={[
            styles.nextWorkoutCard, 
            nextWorkout.status === 'Modified' && styles.nextWorkoutModifiedCard
          ]}>
            <View style={{ flex: 1 }}>
              <View style={styles.tagRow}>
                <Text style={styles.nextWorkoutTag}>NEXT SESSION</Text>
                {nextWorkout.status === 'Modified' && (
                  <View style={styles.modifiedBadge}>
                    <Text style={styles.modifiedBadgeText}>🛡️ ADAPTED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.nextWorkoutTitle}>{nextWorkout.type}</Text>
              <Text style={styles.nextWorkoutDetail}>
                {nextWorkout.duration} mins • Target: {nextWorkout.targetPace}
              </Text>
              {nextWorkout.fatigueWarning && (
                <Text style={styles.fatigueWarningText}>
                  {nextWorkout.fatigueWarning}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={[
                styles.startWorkoutButton,
                nextWorkout.status === 'Modified' && styles.startWorkoutModifiedButton
              ]}
              onPress={() => handleStartWorkout(nextWorkout.id)}
            >
              <Text style={styles.startWorkoutButtonText}>START</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nextWorkoutCard}>
            <Text style={styles.nextWorkoutTitle}>Week Completed! 🎉</Text>
            <Text style={styles.nextWorkoutDetail}>Great effort this week. Syncing will generate your next adapted training phase.</Text>
          </View>
        )}

        {/* WEEKLY SCHEDULE */}
        <Text style={styles.sectionHeader}>Weekly Schedule</Text>
        {currentPlan.workouts.map((workout: Workout) => (
          <View 
            key={workout.id} 
            style={[
              styles.workoutRow, 
              workout.isCompleted && styles.completedWorkoutRow,
              workout.type === 'Rest Day' && styles.restDayRow
            ]}
          >
            <View style={styles.dayCol}>
              <Text style={styles.dayText}>{getDayName(workout.dayOfWeek)}</Text>
            </View>
            <View style={styles.workoutInfoCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.workoutTypeText, workout.isCompleted && styles.completedText]}>
                  {workout.type}
                </Text>
                {workout.status === 'Modified' && (
                  <View style={styles.rowModifiedBadge}>
                    <Text style={styles.rowModifiedBadgeText}>ADAPTED</Text>
                  </View>
                )}
              </View>
              {workout.type !== 'Rest Day' && (
                <Text style={styles.workoutDurationText}>
                  {workout.duration} mins • Target: {workout.targetPace}
                </Text>
              )}
              {workout.fatigueWarning && !workout.isCompleted && (
                <Text style={styles.rowWarningText} numberOfLines={1}>
                  ⚠️ {workout.fatigueWarning}
                </Text>
              )}
            </View>
            <View style={styles.actionCol}>
              {workout.isCompleted ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>DONE</Text>
                </View>
              ) : workout.type !== 'Rest Day' ? (
                <TouchableOpacity 
                  style={styles.rowStartButton}
                  onPress={() => handleStartWorkout(workout.id)}
                >
                  <Text style={styles.rowStartButtonText}>GO</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.restDayText}>REST</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F12',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00F2FE',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#A0A0AB',
    fontWeight: '500',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  syncButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncButtonText: {
    color: '#00F2FE',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  weeklySummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00F2FE',
  },
  summaryBody: {
    fontSize: 14,
    color: '#E0E0E6',
    lineHeight: 20,
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBuilding: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  statusRecovering: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  statusReady: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBuildingText: {
    color: '#00F2FE',
  },
  statusRecoveringText: {
    color: '#FF9500',
  },
  statusReadyText: {
    color: '#4CD964',
  },
  statusExplanationText: {
    fontSize: 12,
    color: '#9F85FF',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E0E6',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00F2FE',
  },
  statLbl: {
    fontSize: 11,
    color: '#A0A0AB',
    marginTop: 4,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9F85FF',
    borderRadius: 3,
  },
  nextWorkoutCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(159, 133, 255, 0.1)', // Subtle neon purple backing
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(159, 133, 255, 0.2)',
    alignItems: 'center',
    marginBottom: 24,
  },
  nextWorkoutModifiedCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modifiedBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  modifiedBadgeText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '800',
  },
  fatigueWarningText: {
    color: '#FF9500',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 15,
  },
  startWorkoutModifiedButton: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  rowModifiedBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  rowModifiedBadgeText: {
    color: '#00F2FE',
    fontSize: 8,
    fontWeight: '800',
  },
  rowWarningText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  nextWorkoutTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9F85FF',
    letterSpacing: 1.2,
  },
  nextWorkoutTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  nextWorkoutDetail: {
    fontSize: 13,
    color: '#A0A0AB',
    marginTop: 4,
  },
  startWorkoutButton: {
    backgroundColor: '#9F85FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#9F85FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startWorkoutButtonText: {
    color: '#0F0F12',
    fontWeight: '900',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  completedWorkoutRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.6,
  },
  restDayRow: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCol: {
    width: 48,
    alignItems: 'flex-start',
  },
  dayText: {
    color: '#9F85FF',
    fontWeight: '700',
    fontSize: 14,
  },
  workoutInfoCol: {
    flex: 1,
  },
  workoutTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  workoutDurationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  actionCol: {
    width: 60,
    alignItems: 'flex-end',
  },
  rowStartButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00F2FE',
  },
  rowStartButtonText: {
    color: '#00F2FE',
    fontWeight: '700',
    fontSize: 12,
  },
  completedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
  },
  completedBadgeText: {
    color: '#4CD964',
    fontSize: 10,
    fontWeight: '800',
  },
  restDayText: {
    color: '#3A3A3C',
    fontSize: 12,
    fontWeight: '700',
  },
});
