export type FitnessGoal = '5K' | '10K';
export type FitnessLevel = 'Beginner' | 'Intermediate';

export interface User {
  id: string;
  name: string;
  goal: FitnessGoal;
  level: FitnessLevel;
  daysPerWeek: number; // 3 to 6
  baseChronicLoad?: number; // Base chronic workload baseline when history is insufficient
}
