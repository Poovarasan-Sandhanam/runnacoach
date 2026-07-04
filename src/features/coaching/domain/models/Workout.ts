export type WorkoutType = 'Easy Run' | 'Tempo Run' | 'Long Run' | 'Rest Day';
export type WorkoutStatus = 'Scheduled' | 'Completed' | 'Modified' | 'Rest Day';

export interface Workout {
  id: string;
  planId: string;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  type: WorkoutType;
  duration: number; // in minutes
  targetPace: string; // e.g. "6:30/km"
  isCompleted: boolean;
  sessionId?: string; // Links to completed RunSession
  status?: WorkoutStatus;
  fatigueWarning?: string; // e.g. "Volume scaled back due to muscle soreness"
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  weekNumber: number;
  workouts: Workout[];
  intensityMultiplier: number; // 1.00 base, dynamically adjusted by adaptive engine
}
