import { WorkoutPlan } from '../../domain/models/Workout';
import { RunSession } from '../../../tracking/domain/models/RunSession';
import { ICoachingRepository } from '../../domain/repositories/ICoachingRepository';

interface SyncResult {
  success: boolean;
  lastSyncedAt: string;
}

export class CoachingRepository implements ICoachingRepository {
  private readonly plans = new Map<string, WorkoutPlan>();
  private readonly sessions = new Map<string, RunSession[]>();
  private readonly lastSyncTimes = new Map<string, string>();

  async getWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
    const plan = this.plans.get(userId);

    return plan ? structuredClone(plan) : null;
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    if (!plan.userId) {
      throw new Error('WorkoutPlan.userId is required.');
    }

    this.plans.set(plan.userId, structuredClone(plan));
  }

  async getRunSessions(userId: string): Promise<RunSession[]> {
    return structuredClone(this.sessions.get(userId) ?? []);
  }

  async logRunSession(
    userId: string,
    session: RunSession,
    workoutId?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('userId is required.');
    }

    if (!session?.id) {
      throw new Error('RunSession.id is required.');
    }

    const userSessions = this.sessions.get(userId) ?? [];

    const alreadyExists = userSessions.some(
      existing => existing.id === session.id
    );

    if (!alreadyExists) {
      userSessions.push(structuredClone(session));
      this.sessions.set(userId, userSessions);
    }

    if (!workoutId) {
      return;
    }

    const plan = this.plans.get(userId);

    if (!plan) {
      throw new Error(`Workout plan not found for user ${userId}.`);
    }

    const workout = plan.workouts.find(w => w.id === workoutId);

    if (!workout) {
      throw new Error(`Workout ${workoutId} not found.`);
    }

    workout.isCompleted = true;
    workout.sessionId = session.id;

    this.plans.set(userId, structuredClone(plan));
  }

  async syncWithCloud(userId: string): Promise<SyncResult> {
    try {

      // TODO:
      // Upload `plan` and `sessions` to your backend.
      //
      // Example:
      // await api.sync({
      //   userId,
      //   workoutPlan: plan,
      //   runSessions: sessions,
      // });

      const syncedAt = new Date().toISOString();

      this.lastSyncTimes.set(userId, syncedAt);

      return {
        success: true,
        lastSyncedAt: syncedAt,
      };
    } catch {
      return {
        success: false,
        lastSyncedAt:
          this.lastSyncTimes.get(userId) ?? new Date(0).toISOString(),
      };
    }
  }

  async clearUserData(userId: string): Promise<void> {
    this.plans.delete(userId);
    this.sessions.delete(userId);
    this.lastSyncTimes.delete(userId);
  }

  async hasWorkoutPlan(userId: string): Promise<boolean> {
    return this.plans.has(userId);
  }
}

export const coachingRepository = new CoachingRepository();