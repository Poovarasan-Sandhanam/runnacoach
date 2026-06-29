export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  ActiveWorkout: { workoutId?: string };
  RunSummary: { distanceKm: number; timeSeconds: number; workoutId?: string };
};
