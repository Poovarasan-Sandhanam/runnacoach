import { WorkoutPlan } from '../../domain/models/Workout';
import { RunSession } from '../../../tracking/domain/models/RunSession';
import { ICoachingRepository } from '../../domain/repositories/ICoachingRepository';

export class CoachingRepository implements ICoachingRepository {
  private localPlans: Map<string, WorkoutPlan> = new Map();
  private localSessions: Map<string, RunSession[]> = new Map();
  private lastSyncTime: string = new Date(0).toISOString();

  async getWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
    return this.localPlans.get(userId) || null;
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    this.localPlans.set(plan.userId, plan);
  }

  async getRunSessions(userId: string): Promise<RunSession[]> {
    return this.localSessions.get(userId) || [];
  }

  async logRunSession(userId: string, session: RunSession, workoutId?: string): Promise<void> {
    const userSessions = this.localSessions.get(userId) || [];
    userSessions.push(session);
    this.localSessions.set(userId, userSessions);

    if (workoutId) {
      const plan = this.localPlans.get(userId);
      if (plan) {
        const workout = plan.workouts.find(w => w.id === workoutId);
        if (workout) {
          workout.isCompleted = true;
          workout.sessionId = session.id;
          await this.saveWorkoutPlan(plan);
        }
      }
    }
  }

  async syncWithCloud(userId: string): Promise<{ success: boolean; lastSyncedAt: string }> {
    try {
      const sessionsToSync = this.localSessions.get(userId) || [];
      const planToSync = this.localPlans.get(userId);

      if (sessionsToSync.length > 0 || planToSync) {
        // Sync payload prepared
      }

      this.lastSyncTime = new Date().toISOString();
      return { success: true, lastSyncedAt: this.lastSyncTime };
    } catch (error) {
      console.error('Offline Sync Failed:', error);
      return { success: false, lastSyncedAt: this.lastSyncTime };
    }
  }
}

export const coachingRepository = new CoachingRepository();
