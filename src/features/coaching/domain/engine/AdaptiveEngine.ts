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

/**
 * Calculates training load of a session: Duration (minutes) * RPE (1-10)
 */
export function calculateRunLoad(session: RunSession): number {
  const rpe = session.rpe ?? (session.effort === 'Easy' ? 3 : session.effort === 'Medium' ? 6 : 9);
  const durationMinutes = session.timeSeconds / 60;
  return durationMinutes * rpe;
}

/**
 * Computes acute workload over the last 7 days from the reference date
 */
export function getAcuteWorkload(history: RunSession[], referenceDateStr: string): number {
  const refDate = new Date(referenceDateStr);
  const sevenDaysAgo = new Date(refDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let acuteLoad = 0;
  for (const session of history) {
    const sessionDate = new Date(session.date);
    if (sessionDate >= sevenDaysAgo && sessionDate <= refDate) {
      acuteLoad += calculateRunLoad(session);
    }
  }
  return acuteLoad;
}

/**
 * Computes chronic workload over the last 28 days from the reference date
 */
export function getChronicWorkload(history: RunSession[], referenceDateStr: string, baseChronicLoad: number = 300): number {
  const refDate = new Date(referenceDateStr);
  const twentyEightDaysAgo = new Date(refDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  let totalLoad = 0;
  let sessionsInScope = 0;
  for (const session of history) {
    const sessionDate = new Date(session.date);
    if (sessionDate >= twentyEightDaysAgo && sessionDate <= refDate) {
      totalLoad += calculateRunLoad(session);
      sessionsInScope++;
    }
  }
  
  // Chronic workload is the average weekly load over 4 weeks
  const chronicFromHistory = totalLoad / 4;
  
  // Blend with baseChronicLoad if user has fewer than 8 runs in history to prevent spikes
  if (history.length < 8) {
    const historyWeight = Math.min(1, history.length / 8);
    return chronicFromHistory * historyWeight + baseChronicLoad * (1 - historyWeight);
  }
  
  return chronicFromHistory > 0 ? chronicFromHistory : baseChronicLoad;
}

export interface AdaptationRule {
  name: string;
  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan;
}

/**
 * Rule 1: Fatigue Shield (Overtraining Protection)
 * If the user's latest run has high muscle soreness (>= 4/5) OR their ACWR is in the
 * Danger Zone (> 1.5), automatically scale back the immediate next workout duration
 * and pace by 15% to safeguard against overuse injury.
 */
export class FatigueShieldRule implements AdaptationRule {
  name = 'Fatigue Shield';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    if (history.length === 0) return plan;
    const latestSession = history[history.length - 1];

    const acute = getAcuteWorkload(history, latestSession.date);
    const chronic = getChronicWorkload(history, latestSession.date);
    const acwr = chronic > 0 ? acute / chronic : 1.0;

    const hasHighSoreness = latestSession.soreness !== undefined && latestSession.soreness >= 4;
    const isDangerZone = acwr > 1.5;

    if (hasHighSoreness || isDangerZone) {
      // Find the next incomplete running workout
      const updatedWorkouts = [...plan.workouts];
      const nextRunIndex = updatedWorkouts.findIndex(w => !w.isCompleted && w.type !== 'Rest Day');

      if (nextRunIndex !== -1) {
        const nextWorkout = updatedWorkouts[nextRunIndex];
        
        // Skip if already modified by Fatigue Shield
        if (nextWorkout.status !== 'Modified') {
          const reason = hasHighSoreness 
            ? "We've reduced this session's volume to protect you from overtraining and support your muscle recovery." 
            : "We've dialed back this session's volume slightly to support your recovery.";
          
          updatedWorkouts[nextRunIndex] = {
            ...nextWorkout,
            duration: Math.max(10, Math.round(nextWorkout.duration * 0.85)),
            targetPace: adjustPace(nextWorkout.targetPace, 0.85),
            status: 'Modified',
            fatigueWarning: reason,
          };
        }
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
 * Rule 2: Subjective-Objective Divergence Detector
 * If the user rates their run as "Easy" (RPE <= 3) but their average heart rate
 * was elevated (>= 155 bpm) or completion ratio was low, flag it on the next workout
 * to guide pace awareness and prevent running recovery runs too fast.
 */
export class DivergenceDetectorRule implements AdaptationRule {
  name = 'Subjective-Objective Divergence Detector';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    if (history.length === 0) return plan;
    const latestSession = history[history.length - 1];

    const isRpeLow = latestSession.rpe !== undefined && latestSession.rpe <= 3;
    const isHrElevated = latestSession.avgHeartRate !== undefined && latestSession.avgHeartRate >= 155;

    if (isRpeLow && isHrElevated) {
      const updatedWorkouts = [...plan.workouts];
      const nextRunIndex = updatedWorkouts.findIndex(w => !w.isCompleted && w.type !== 'Rest Day');

      if (nextRunIndex !== -1) {
        const nextWorkout = updatedWorkouts[nextRunIndex];
        updatedWorkouts[nextRunIndex] = {
          ...nextWorkout,
          fatigueWarning: "Your body worked a bit harder than expected last time. Let's focus on keeping a comfortable, controlled pace today.",
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
 * Rule 3: Consistency-Based Weekly Rebuilder
 * Evaluates total plan compliance at the end of the week.
 * - If compliance is low (< 70%) or average soreness is high (>= 3.5), scale back intensity multiplier by 10%.
 * - If compliance is high (>= 90%) and average soreness is low (< 2.5), boost intensity multiplier by 5%.
 */
export class WeeklyRebuilderRule implements AdaptationRule {
  name = 'Weekly Rebuilder';

  evaluate(history: RunSession[], plan: WorkoutPlan): WorkoutPlan {
    const runningWorkouts = plan.workouts.filter(w => w.type !== 'Rest Day');
    if (runningWorkouts.length === 0) return plan;

    const completedRunning = runningWorkouts.filter(w => w.isCompleted);
    const allCompleted = completedRunning.length === runningWorkouts.length;

    // We only trigger weekly rebuild at the end of the training block (when all runs are completed or skipped)
    if (!allCompleted) return plan;

    // Gather user runs logged for this specific plan
    const completedWorkoutsIds = new Set(completedRunning.map(w => w.id));
    const weeklySessions = history.filter(s => s.workoutId && completedWorkoutsIds.has(s.workoutId));

    if (weeklySessions.length === 0) return plan;

    // Calculate average soreness and compliance
    const complianceRate = completedRunning.length / runningWorkouts.length;
    
    let totalSoreness = 0;
    let sorenessCount = 0;
    for (const s of weeklySessions) {
      if (s.soreness !== undefined) {
        totalSoreness += s.soreness;
        sorenessCount++;
      }
    }
    const avgSoreness = sorenessCount > 0 ? totalSoreness / sorenessCount : 1.0;

    let nextMultiplier = plan.intensityMultiplier;
    let rebuildReason = '';

    if (complianceRate < 0.70 || avgSoreness >= 3.5) {
      // Scale down plan load
      nextMultiplier = plan.intensityMultiplier * 0.90;
      rebuildReason = "We've reduced your training intensity slightly to support recovery and help you rebuild consistency.";
    } else if (complianceRate >= 0.90 && avgSoreness < 2.5) {
      // Safely scale up plan load
      nextMultiplier = plan.intensityMultiplier * 1.05;
      rebuildReason = "We've increased your training slightly because last week felt manageable and consistent.";
    }

    // Apply multiplier to all workouts that might be regenerated or future planning steps
    const updatedPlan = applyIntensityAdjustment(plan, nextMultiplier);

    // Set the rebuildReason on the first incomplete running workout of the newly adjusted week
    if (rebuildReason) {
      const firstIncomplete = updatedPlan.workouts.find(w => !w.isCompleted && w.type !== 'Rest Day');
      if (firstIncomplete) {
        firstIncomplete.fatigueWarning = rebuildReason;
      }
    }

    return updatedPlan;
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
      new FatigueShieldRule(),
      new DivergenceDetectorRule(),
      new WeeklyRebuilderRule(),
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
