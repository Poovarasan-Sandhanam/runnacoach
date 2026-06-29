export type EffortLevel = 'Easy' | 'Medium' | 'Hard';

export interface RunSession {
  id: string;
  userId: string;
  workoutId?: string; // Optional if session is manual and not linked to a specific target workout
  distanceKm: number;
  timeSeconds: number;
  pace: string; // calculated: time / distance formatted (e.g. "6:00/km")
  effort: EffortLevel;
  consecutiveHardRuns: number; // Track count for recovery protection rule
  date: string; // ISO date format "YYYY-MM-DD"
}
