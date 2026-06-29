import { useAppDispatch, useAppSelector } from '../../../../shared/redux/store';
import { coachingRepository } from '../../data/repositories/CoachingRepository';
import { setCurrentPlan } from '../../../../shared/redux/slices/coachingSlice';
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
    syncData,
  };
};
