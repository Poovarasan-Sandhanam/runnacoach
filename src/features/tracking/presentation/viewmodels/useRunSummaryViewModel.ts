import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../shared/redux/store';
import { addRunSession } from '../../../../shared/redux/slices/trackingSlice';
import { setCurrentPlan } from '../../../../shared/redux/slices/coachingSlice';
import { coachingRepository } from '../../../coaching/data/repositories/CoachingRepository';
import { AdaptiveEngine } from '../../../coaching/domain/engine/AdaptiveEngine';
import { EffortLevel, RunSession } from '../../domain/models/RunSession';

export const useRunSummaryViewModel = (
  distanceKm: number,
  timeSeconds: number,
  workoutId?: string
) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const currentPlan = useAppSelector((state) => state.coaching.currentPlan);
  const history = useAppSelector((state) => state.tracking.history);

  const [effort, setEffort] = useState<EffortLevel>('Medium');

  // Compute pace
  const getPace = () => {
    if (distanceKm <= 0) return '--:--/km';
    const totalMins = timeSeconds / 60;
    const paceMins = totalMins / distanceKm;
    const mins = Math.floor(paceMins);
    const secs = Math.round((paceMins - mins) * 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${mins}:${pad(secs)}/km`;
  };

  const logRun = async () => {
    if (!user) return;

    // 1. Calculate consecutive hard runs
    let consecutiveHard = 0;
    if (effort === 'Hard') {
      consecutiveHard = 1;
      // Look back at history
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].effort === 'Hard') {
          consecutiveHard++;
        } else {
          break;
        }
      }
    }

    // 2. Create the completed run session entity
    const newSession: RunSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      workoutId,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      timeSeconds,
      pace: getPace(),
      effort,
      consecutiveHardRuns: consecutiveHard,
      date: new Date().toISOString().split('T')[0],
    };

    // 3. Save session locally
    await coachingRepository.logRunSession(user.id, newSession, workoutId);
    dispatch(addRunSession(newSession));

    // 4. Run coaching adaptation engine rules to mutate current training plan
    if (currentPlan) {
      const engine = new AdaptiveEngine();
      // Re-query database to ensure local repository mutations are loaded
      const currentLocalPlan = await coachingRepository.getWorkoutPlan(user.id);
      if (currentLocalPlan) {
        const updatedHistory = [...history, newSession];
        const adaptedPlan = engine.adaptPlan(updatedHistory, currentLocalPlan);

        await coachingRepository.saveWorkoutPlan(adaptedPlan);
        dispatch(setCurrentPlan(adaptedPlan));
      }
    }
  };

  return {
    effort,
    setEffort,
    getPace,
    logRun,
  };
};
