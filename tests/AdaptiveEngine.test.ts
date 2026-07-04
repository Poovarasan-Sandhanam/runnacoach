import { 
  AdaptiveEngine, 
  paceToSeconds, 
  secondsToPace, 
  adjustPace,
  calculateRunLoad,
  getAcuteWorkload,
  getChronicWorkload
} from '../src/features/coaching/domain/engine/AdaptiveEngine';
import { WorkoutPlan } from '../src/features/coaching/domain/models/Workout';
import { RunSession } from '../src/features/tracking/domain/models/RunSession';

describe('Adaptive Engine Utilities', () => {
  test('paceToSeconds should convert pace string to total seconds', () => {
    expect(paceToSeconds('6:00/km')).toBe(360);
    expect(paceToSeconds('6:30/km')).toBe(390);
    expect(paceToSeconds('5:00/km')).toBe(300);
  });

  test('secondsToPace should convert total seconds to pace string', () => {
    expect(secondsToPace(360)).toBe('6:00/km');
    expect(secondsToPace(390)).toBe('6:30/km');
    expect(secondsToPace(343)).toBe('5:43/km');
  });

  test('adjustPace should adjust pace according to multiplier', () => {
    expect(adjustPace('6:00/km', 1.05)).toBe('5:43/km');
    expect(adjustPace('6:00/km', 0.85)).toBe('7:04/km');
  });

  test('calculateRunLoad should calculate Duration * RPE load score', () => {
    const session: RunSession = {
      id: 's1',
      userId: 'user_1',
      distanceKm: 5,
      timeSeconds: 1800, // 30 minutes
      pace: '6:00/km',
      effort: 'Medium',
      rpe: 6,
      consecutiveHardRuns: 0,
      date: '2026-06-01'
    };
    expect(calculateRunLoad(session)).toBe(30 * 6); // 180
  });

  test('getAcuteWorkload and getChronicWorkload should aggregate workloads', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        distanceKm: 5,
        timeSeconds: 1200, // 20 mins
        pace: '6:00/km',
        effort: 'Medium',
        rpe: 5, // load = 100
        consecutiveHardRuns: 0,
        date: '2026-06-01'
      },
      {
        id: 's2',
        userId: 'user_1',
        distanceKm: 6,
        timeSeconds: 1800, // 30 mins
        pace: '5:00/km',
        effort: 'Hard',
        rpe: 8, // load = 240
        consecutiveHardRuns: 0,
        date: '2026-06-06'
      }
    ];

    // Acute load on 2026-06-07 should sum both runs (last 7 days includes 06-01 and 06-06) -> 100 + 240 = 340
    expect(getAcuteWorkload(history, '2026-06-07')).toBe(340);

    // Chronic load uses base blending if history < 8.
    // Base load = 300. Weighted blend (history size 2):
    // historyWeight = 2/8 = 0.25
    // chronicFromHistory = (100 + 240) / 4 = 85
    // blended = 85 * 0.25 + 300 * 0.75 = 21.25 + 225 = 246.25
    expect(getChronicWorkload(history, '2026-06-07', 300)).toBeCloseTo(246.25);
  });
});

describe('Adaptive Engine - Coaching Rules', () => {
  let engine: AdaptiveEngine;
  let basePlan: WorkoutPlan;

  beforeEach(() => {
    engine = new AdaptiveEngine();
    basePlan = {
      id: 'plan_1',
      userId: 'user_1',
      weekNumber: 1,
      intensityMultiplier: 1.00,
      workouts: [
        {
          id: 'w1',
          planId: 'plan_1',
          dayOfWeek: 1,
          type: 'Easy Run',
          duration: 30,
          targetPace: '6:00/km',
          isCompleted: true,
          sessionId: 's1'
        },
        {
          id: 'w2',
          planId: 'plan_1',
          dayOfWeek: 3,
          type: 'Tempo Run',
          duration: 40,
          targetPace: '5:30/km',
          isCompleted: false
        },
        {
          id: 'w3',
          planId: 'plan_1',
          dayOfWeek: 5,
          type: 'Rest Day',
          duration: 0,
          targetPace: '--:--/km',
          isCompleted: false
        },
        {
          id: 'w4',
          planId: 'plan_1',
          dayOfWeek: 7,
          type: 'Long Run',
          duration: 60,
          targetPace: '6:30/km',
          isCompleted: false
        }
      ]
    };
  });

  test('Rule 1: Fatigue Shield should adjust next workout if soreness is high (>=4)', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Hard',
        rpe: 8,
        soreness: 4, // High soreness!
        consecutiveHardRuns: 1,
        date: '2026-06-01'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    // w2 (Tempo Run) should be modified (duration scaled from 40 to 34, pace adjusted by 0.85 multiplier)
    const nextWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    expect(nextWorkout.status).toBe('Modified');
    expect(nextWorkout.duration).toBe(34); // 40 * 0.85 = 34
    expect(nextWorkout.targetPace).toBe('6:28/km'); // 5:30 -> 330s / 0.85 = 388s -> 6:28/km
    expect(nextWorkout.fatigueWarning).toContain('support your muscle recovery');
  });

  test('Rule 1: Fatigue Shield should adjust next workout if ACWR is in danger zone (>1.5)', () => {
    // To trigger ACWR > 1.5, we need high acute load relative to chronic workload baseline.
    // Let's set a single recent run with huge duration/RPE.
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 12,
        timeSeconds: 5400, // 90 minutes
        pace: '7:30/km',
        effort: 'Hard',
        rpe: 9, // load = 810
        soreness: 2, // low soreness, but high load!
        consecutiveHardRuns: 1,
        date: '2026-06-07'
      }
    ];

    // Acute load = 810
    // Chronic load = 810/4 * 1/8 + 300 * 7/8 = 202.5 * 0.125 + 262.5 = 25.3125 + 262.5 = 287.8125
    // ACWR = 810 / 287.8125 = 2.81 (> 1.5)
    const adaptedPlan = engine.adaptPlan(history, basePlan);

    const nextWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    expect(nextWorkout.status).toBe('Modified');
    expect(nextWorkout.fatigueWarning).toContain('support your recovery');
  });

  test('Rule 2: Divergence Detector should warn user if RPE is low but heart rate is high', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Easy',
        rpe: 2, // rated Easy
        soreness: 1,
        avgHeartRate: 160, // but HR was high!
        consecutiveHardRuns: 0,
        date: '2026-06-01'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    const nextWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    expect(nextWorkout.fatigueWarning).toContain('comfortable, controlled pace');
  });

  test('Rule 3: Weekly Rebuilder should rebuild plan if week is completed with low compliance', () => {
    // Complete all workouts but make compliance rate low
    // Let's modify basePlan workouts to be fully completed to trigger rule evaluation.
    basePlan.workouts.forEach(w => {
      if (w.type !== 'Rest Day') {
        w.isCompleted = true;
      }
    });

    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Medium',
        rpe: 5,
        soreness: 4.5, // high average soreness
        consecutiveHardRuns: 0,
        date: '2026-06-01'
      },
      {
        id: 's2',
        userId: 'user_1',
        workoutId: 'w2',
        distanceKm: 6,
        timeSeconds: 2400,
        pace: '6:40/km',
        effort: 'Medium',
        rpe: 6,
        soreness: 4, // high soreness
        consecutiveHardRuns: 0,
        date: '2026-06-03'
      },
      {
        id: 's4',
        userId: 'user_1',
        workoutId: 'w4',
        distanceKm: 10,
        timeSeconds: 3900,
        pace: '6:30/km',
        effort: 'Medium',
        rpe: 5,
        soreness: 4, // high soreness
        consecutiveHardRuns: 0,
        date: '2026-06-07'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    // Multiplier should scale down by 10% (from 1.00 to 0.90) due to average soreness >= 3.5
    expect(adaptedPlan.intensityMultiplier).toBeCloseTo(0.90);
  });
});
