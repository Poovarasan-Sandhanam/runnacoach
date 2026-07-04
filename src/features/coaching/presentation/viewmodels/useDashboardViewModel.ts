import { useAppDispatch, useAppSelector } from '../../../../shared/redux/store';
import { coachingRepository } from '../../data/repositories/CoachingRepository';
import { setCurrentPlan } from '../../../../shared/redux/slices/coachingSlice';
import { getAcuteWorkload, getChronicWorkload } from '../../domain/engine/AdaptiveEngine';
import { Alert } from 'react-native';

export const useDashboardViewModel = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const currentPlan = useAppSelector((state) => state.coaching.currentPlan);
  const history = useAppSelector((state) => state.tracking.history);

  // Expose computed stats
  const totalDistance = history.reduce((sum, run) => sum + run.distanceKm, 0);

  const completedCount = currentPlan
    ? currentPlan.workouts.filter((w) => w.isCompleted).length
    : 0;
  const totalCount = currentPlan
    ? currentPlan.workouts.filter((w) => w.type !== 'Rest Day').length
    : 0;
  const weeklyProgress = totalCount > 0 ? completedCount / totalCount : 0;

  const nextWorkout = currentPlan
    ? currentPlan.workouts.find((w) => !w.isCompleted && w.type !== 'Rest Day')
    : undefined;

  // Determine user's readiness training status
  const getTrainingStatusInfo = () => {
    if (!history || history.length === 0) {
      return {
        status: 'Ready' as const,
        explanation: "You're fresh and primed to start your coaching journey.",
      };
    }
    const latest = history[history.length - 1];
    
    // Check muscle soreness
    if (latest.soreness && latest.soreness >= 4) {
      return {
        status: 'Recovering' as const,
        explanation: "Muscle soreness is elevated. We've dialed back targets to support recovery.",
      };
    }

    const acute = getAcuteWorkload(history, latest.date);
    const chronic = getChronicWorkload(history, latest.date);
    const acwr = chronic > 0 ? acute / chronic : 1.0;

    if (acwr > 1.3) {
      return {
        status: 'Recovering' as const,
        explanation: 'Training load is elevated. Paces are adjusted to prevent overtraining.',
      };
    }
    if (acwr >= 0.8) {
      return {
        status: 'Building' as const,
        explanation: 'Your training load is progressing in the sweet spot. Keep building.',
      };
    }
    return {
      status: 'Ready' as const,
      explanation: 'You are fully recovered and ready for your next training stimulus.',
    };
  };

  const statusInfo = getTrainingStatusInfo();

  // Create human-friendly weekly progress summary
  const getWeeklySummary = () => {
    if (!currentPlan) return '';
    const runningWorkouts = currentPlan.workouts.filter(w => w.type !== 'Rest Day');
    const completed = runningWorkouts.filter(w => w.isCompleted);
    
    // Calculate distance run this week
    const completedWorkoutIds = new Set(completed.map(w => w.id));
    const weeklySessions = history.filter(s => s.workoutId && completedWorkoutIds.has(s.workoutId));
    const completedDist = weeklySessions.reduce((sum, run) => sum + run.distanceKm, 0);

    if (completed.length === 0) {
      return "You haven't started your training week yet. Lace up your shoes for your first session!";
    }
    if (completed.length === runningWorkouts.length) {
      return `Phenomenal job! You hit 100% compliance, completing all ${completed.length} runs and covering ${completedDist.toFixed(1)} km. Ready to advance!`;
    }
    return `Great consistency! You've logged ${completed.length} of your ${runningWorkouts.length} runs this week, covering ${completedDist.toFixed(1)} km. Keep building.`;
  };

  const weeklySummary = getWeeklySummary();

  const syncData = async () => {
    if (!user) return;
    const result = await coachingRepository.syncWithCloud(user.id);
    if (result.success) {
      // Fetch latest plan if any (in a real app)
      const latestPlan = await coachingRepository.getWorkoutPlan(user.id);
      if (latestPlan) {
        dispatch(setCurrentPlan(latestPlan));
      }
      Alert.alert('Sync Successful', `Data synced to cloud at ${new Date(result.lastSyncedAt).toLocaleTimeString()}`);
    } else {
      Alert.alert('Sync Failed', 'Could not sync data. Running in offline fallback mode.');
    }
  };

  return {
    user,
    currentPlan,
    history,
    totalDistance,
    weeklyProgress,
    nextWorkout,
    trainingStatus: statusInfo.status,
    trainingStatusExplanation: statusInfo.explanation,
    weeklySummary,
    syncData,
  };
};
