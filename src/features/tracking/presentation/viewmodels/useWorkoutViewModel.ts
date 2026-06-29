import { useState, useEffect, useRef } from 'react';
import { WatchBridge } from '../../data/bridge/WatchBridge';

export const useWorkoutViewModel = (workoutId?: string) => {
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0.0);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // 1. Alert watch that a run has started
    WatchBridge.sendAlert('START', { workoutId, timestamp: Date.now() }).catch(err => {
      console.warn('Could not alert watch:', err);
    });

    // 2. Listen to Watch real-time HR and GPS data updates
    const subscription = WatchBridge.addWatchListener('onWatchStatsUpdate', (stats: any) => {
      if (stats.distanceKm) {
        setDistance(stats.distanceKm);
      }
      if (stats.durationSeconds) {
        setSeconds(stats.durationSeconds);
      }
    });

    // 3. Start local simulator timer in case watch is not connected/active
    startTimer();

    return () => {
      stopTimer();
      subscription.remove();
    };
  }, []);

  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        const nextSec = prev + 1;
        // Simulate speed/distance increase (e.g. roughly 6:00/km -> 2.77 meters per second)
        setDistance(dist => dist + 0.0028);
        return nextSec;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleActive = () => {
    if (isActive) {
      stopTimer();
      WatchBridge.sendAlert('STOP', { action: 'PAUSED' }).catch(() => {});
    } else {
      startTimer();
      WatchBridge.sendAlert('START', { action: 'RESUMED' }).catch(() => {});
    }
    setIsActive(!isActive);
  };

  // Helper to format seconds -> HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}`;
  };

  // Helper to compute pace
  const getPace = () => {
    if (distance <= 0) return '--:--/km';
    const totalMins = seconds / 60;
    const paceMins = totalMins / distance;
    const mins = Math.floor(paceMins);
    const secs = Math.round((paceMins - mins) * 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${mins}:${pad(secs)}/km`;
  };

  return {
    seconds,
    distance,
    isActive,
    formatTime,
    getPace,
    toggleActive,
  };
};
