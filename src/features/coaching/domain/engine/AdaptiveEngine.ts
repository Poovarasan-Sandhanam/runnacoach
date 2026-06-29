import { RunSession } from '../../../tracking/domain/models/RunSession';
import { WorkoutPlan } from '../models/Workout';

// Helper utilities for pace and calculations
export function paceToSeconds(paceStr: string): number {
  const cleanStr = paceStr.split('/')[0].trim();
  const parts = cleanStr.split(':');
  if (parts.length !== 2) return 360; // Default 6:00/km if parsing fails
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds; 
}

export function secondsToPace(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  const secStr = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${secStr}/km`;
}

export function adjustPace(targetPace: string, multiplier: number): string {
  if (multiplier <= 0) return targetPace;
  const seconds = paceToSeconds(targetPace);
  const adjustedSeconds = Math.round(seconds / multiplier);
  return secondsToPace(adjustedSeconds);
}

export interface AdaptationRule {
  name: string;
  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan;
}

/**
 * Rule 1: High Effort Adjustment
 * If the user's latest logged run was "HARD", reduce intensity by 10%
 * for all future workouts in the current plan.
 */
export class HighEffortRule implements AdaptationRule {
  name = 'High Effort Adjustment';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    if (history.length === 0) return plan;
    const latestSession = history[history.length - 1];

    if (latestSession.effort === 'Hard') {
      const nextMultiplier = plan.intensityMultiplier * 0.9;
      return applyIntensityAdjustment(plan, nextMultiplier);
    }
    return plan;
  }
}

/**
 * Rule 2: Easy Performance Boost
 * If the user's latest logged run was "EASY", increase intensity by 5%
 * for all future workouts in the current plan.
 */
export class EasyPerformanceBoostRule implements AdaptationRule {
  name = 'Easy Performance Boost';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    if (history.length === 0) return plan;
    const latestSession = history[history.length - 1];

    if (latestSession.effort === 'Easy') {
      const nextMultiplier = plan.intensityMultiplier * 1.05;
      return applyIntensityAdjustment(plan, nextMultiplier);
    }
    return plan;
  }
}

/**
 * Rule 3: Recovery Protection
 * If user records 2 or more consecutive hard runs, the next scheduled run
 * is converted to a "Rest Day" to prevent injury.
 */
export class RecoveryProtectionRule implements AdaptationRule {
  name = 'Recovery Protection';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    if (history.length === 0) return plan;
    const latestSession = history[history.length - 1];

    // Check if consecutive hard runs is 2 or more
    if (latestSession.consecutiveHardRuns >= 2) {
      // Find the next incomplete workout in the plan
      const updatedWorkouts = [...plan.workouts];
      const nextRunIndex = updatedWorkouts.findIndex(w => !w.isCompleted && w.type !== 'Rest Day');

      if (nextRunIndex !== -1) {
        // Convert to Rest Day
        updatedWorkouts[nextRunIndex] = {
          ...updatedWorkouts[nextRunIndex],
          type: 'Rest Day',
          duration: 0,
          targetPace: '--:--/km',
        };
      }

      return {
        ...plan,
        workouts: updatedWorkouts,
      };
    }
    return plan;
  }
}

/**
 * Utility to apply intensity multiplier to all incomplete workouts in a plan
 */
function applyIntensityAdjustment(plan: WorkoutPlan, newMultiplier: number): WorkoutPlan {
  const cappedMultiplier = Math.max(0.6, Math.min(1.5, newMultiplier));
  const ratio = cappedMultiplier / plan.intensityMultiplier;

  const adjustedWorkouts = plan.workouts.map(workout => {
    if (workout.isCompleted || workout.type === 'Rest Day') {
      return workout;
    }

    const newDuration = Math.max(10, Math.round(workout.duration * ratio));
    const newPace = adjustPace(workout.targetPace, ratio);

    return {
      ...workout,
      duration: newDuration,
      targetPace: newPace,
    };
  });

  return {
    ...plan,
    intensityMultiplier: cappedMultiplier,
    workouts: adjustedWorkouts,
  };
}

/**
 * Core AdaptiveEngine class orchestrating the coaching rules
 */
export class AdaptiveEngine {
  private rules: AdaptationRule[];

  constructor(customRules?: AdaptationRule[]) {
    this.rules = customRules || [
      new HighEffortRule(),
      new EasyPerformanceBoostRule(),
      new RecoveryProtectionRule(),
    ];
  }

  public adaptPlan(history: RunSession[], currentPlan: WorkoutPlan): WorkoutPlan {
    let adaptedPlan = { ...currentPlan };
    for (const rule of this.rules) {
      adaptedPlan = rule.evaluate(history, adaptedPlan);
    }
    return adaptedPlan;
  }
}
