import { useState } from 'react';
import { useAppDispatch } from '../../../../shared/redux/store';
import { setUser, setLoading } from '../../../../shared/redux/slices/userSlice';
import { setCurrentPlan } from '../../../../shared/redux/slices/coachingSlice';
import { FitnessGoal, FitnessLevel, User } from '../../domain/models/User';
import { Workout, WorkoutPlan } from '../../../coaching/domain/models/Workout';
import { coachingRepository } from '../../../coaching/data/repositories/CoachingRepository';

export const useOnboardingViewModel = () => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<FitnessGoal>('5K');
  const [level, setLevel] = useState<FitnessLevel>('Beginner');
  const [days, setDays] = useState(3);

  const onboardUser = async () => {
    if (!name.trim()) return;
    dispatch(setLoading(true));

    const userId = 'user_mvp';
    const newUser: User = { id: userId, name, goal, level, daysPerWeek: days };

    // Generate Initial structured Workout Plan based on goal/level
    const initialPlan: WorkoutPlan = {
      id: `plan_${Date.now()}`,
      userId,
      weekNumber: 1,
      intensityMultiplier: 1.00,
      workouts: generateDefaultWorkouts(goal, level, days),
    };

    await coachingRepository.saveWorkoutPlan(initialPlan);

    dispatch(setUser(newUser));
    dispatch(setCurrentPlan(initialPlan));
    dispatch(setLoading(false));
  };

  return {
    name,
    setName,
    goal,
    setGoal,
    level,
    setLevel,
    days,
    setDays,
    onboardUser,
  };
};

function generateDefaultWorkouts(goal: FitnessGoal, level: FitnessLevel, days: number): Workout[] {
  const baseWorkouts: Workout[] = [];
  const planId = 'temp_plan_id';

  // Base configurations based on Goal & Level
  const easyRunTime = level === 'Beginner' ? 30 : 45;
  const tempoRunTime = level === 'Beginner' ? 20 : 35;
  const longRunTime = goal === '5K' ? 45 : 75;

  const easyPace = level === 'Beginner' ? '6:30/km' : '5:45/km';
  const tempoPace = level === 'Beginner' ? '5:45/km' : '5:00/km';
  const longPace = level === 'Beginner' ? '7:00/km' : '6:15/km';

  // Distribute workouts across a 7-day week
  if (days >= 3) {
    baseWorkouts.push({ id: 'w_1', planId, dayOfWeek: 2, type: 'Easy Run', duration: easyRunTime, targetPace: easyPace, isCompleted: false });
    baseWorkouts.push({ id: 'w_2', planId, dayOfWeek: 4, type: 'Rest Day', duration: 0, targetPace: '--:--/km', isCompleted: false });
    baseWorkouts.push({ id: 'w_3', planId, dayOfWeek: 5, type: 'Tempo Run', duration: tempoRunTime, targetPace: tempoPace, isCompleted: false });
    baseWorkouts.push({ id: 'w_4', planId, dayOfWeek: 6, type: 'Rest Day', duration: 0, targetPace: '--:--/km', isCompleted: false });
    baseWorkouts.push({ id: 'w_5', planId, dayOfWeek: 7, type: 'Long Run', duration: longRunTime, targetPace: longPace, isCompleted: false });
  }

  // Fill up rest days for remaining slots to preserve structure
  const daysUsed = new Set(baseWorkouts.map(w => w.dayOfWeek));
  for (let i = 1; i <= 7; i++) {
    if (!daysUsed.has(i)) {
      baseWorkouts.push({
        id: `w_rest_${i}`,
        planId,
        dayOfWeek: i,
        type: 'Rest Day',
        duration: 0,
        targetPace: '--:--/km',
        isCompleted: false,
      });
    }
  }

  return baseWorkouts.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
