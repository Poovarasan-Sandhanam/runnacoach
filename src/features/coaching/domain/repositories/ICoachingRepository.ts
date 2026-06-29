import { WorkoutPlan } from '../models/Workout';
import { RunSession } from '../../../tracking/domain/models/RunSession';

export interface ICoachingRepository {
  getWorkoutPlan(userId: string): Promise<WorkoutPlan | null>;
  saveWorkoutPlan(plan: WorkoutPlan): Promise<void>;
  getRunSessions(userId: string): Promise<RunSession[]>;
  logRunSession(userId: string, session: RunSession, workoutId?: string): Promise<void>;
  syncWithCloud(userId: string): Promise<{ success: boolean; lastSyncedAt: string }>;
}
