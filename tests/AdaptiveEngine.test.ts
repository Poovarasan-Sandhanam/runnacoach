import { AdaptiveEngine, paceToSeconds, secondsToPace, adjustPace } from '../src/features/coaching/domain/engine/AdaptiveEngine';
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
    // 1.05 multiplier (faster) -> 6:00/km -> 5:43/km
    expect(adjustPace('6:00/km', 1.05)).toBe('5:43/km');
    // 0.90 multiplier (slower) -> 6:00/km -> 6:40/km
    expect(adjustPace('6:00/km', 0.90)).toBe('6:40/km');
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

  test('Rule 1: Should reduce intensity when latest run effort is HARD', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Hard',
        consecutiveHardRuns: 1,
        date: '2026-06-01'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    // Intensity multiplier should drop to 0.90
    expect(adaptedPlan.intensityMultiplier).toBeCloseTo(0.90);

    // Incomplete run durations should be scaled by 0.9 (Tempo Run 40 -> 36 mins, Long Run 60 -> 54 mins)
    const tempoWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    const longWorkout = adaptedPlan.workouts.find(w => w.id === 'w4')!;
    const restWorkout = adaptedPlan.workouts.find(w => w.id === 'w3')!;

    expect(tempoWorkout.duration).toBe(36);
    expect(longWorkout.duration).toBe(54);
    // Rest day duration should remain 0
    expect(restWorkout.duration).toBe(0);

    // Target paces should slow down
    // Tempo pace originally 5:30/km (330s). Adjusted by 0.9 -> 330 / 0.9 = 367s -> 6:07/km
    expect(tempoWorkout.targetPace).toBe('6:07/km');
    // Long run pace originally 6:30/km (390s). Adjusted by 0.9 -> 390 / 0.9 = 433s -> 7:13/km
    expect(longWorkout.targetPace).toBe('7:13/km');

    // Already completed workouts should NOT change
    const completedWorkout = adaptedPlan.workouts.find(w => w.id === 'w1')!;
    expect(completedWorkout.duration).toBe(30);
    expect(completedWorkout.targetPace).toBe('6:00/km');
  });

  test('Rule 2: Should boost intensity when latest run effort is EASY', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Easy',
        consecutiveHardRuns: 0,
        date: '2026-06-01'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    // Intensity multiplier should increase to 1.05
    expect(adaptedPlan.intensityMultiplier).toBeCloseTo(1.05);

    const tempoWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    const longWorkout = adaptedPlan.workouts.find(w => w.id === 'w4')!;

    // Incomplete run durations should be scaled by 1.05 (Tempo Run 40 -> 42 mins, Long Run 60 -> 63 mins)
    expect(tempoWorkout.duration).toBe(42);
    expect(longWorkout.duration).toBe(63);

    // Target paces should speed up (Tempo 5:30 -> 330s. 330 / 1.05 = 314s -> 5:14/km)
    expect(tempoWorkout.targetPace).toBe('5:14/km');
  });

  test('Rule 3: Should insert Rest Day when runner logs 2 consecutive hard runs', () => {
    const history: RunSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        workoutId: 'w1',
        distanceKm: 5,
        timeSeconds: 1800,
        pace: '6:00/km',
        effort: 'Hard',
        consecutiveHardRuns: 2, // 2 consecutive hard runs!
        date: '2026-06-01'
      }
    ];

    const adaptedPlan = engine.adaptPlan(history, basePlan);

    // Rule 1 triggers (multiplier becomes 0.90) AND Rule 3 triggers (next workout becomes rest day)
    expect(adaptedPlan.intensityMultiplier).toBeCloseTo(0.90);

    // Next incomplete workout (w2: Tempo Run) should have been converted to Rest Day
    const nextWorkout = adaptedPlan.workouts.find(w => w.id === 'w2')!;
    expect(nextWorkout.type).toBe('Rest Day');
    expect(nextWorkout.duration).toBe(0);
    expect(nextWorkout.targetPace).toBe('--:--/km');

    // Future workouts after that (w4: Long Run) should still be runs, but adjusted by the 0.90 multiplier
    const futureWorkout = adaptedPlan.workouts.find(w => w.id === 'w4')!;
    expect(futureWorkout.type).toBe('Long Run');
    expect(futureWorkout.duration).toBe(54); // 60 * 0.9 = 54
    expect(futureWorkout.targetPace).toBe('7:13/km');
  });
});
