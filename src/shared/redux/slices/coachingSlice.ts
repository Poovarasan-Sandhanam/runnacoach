import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutPlan } from '../../../features/coaching/domain/models/Workout';

interface CoachingState {
  currentPlan: WorkoutPlan | null;
  isLoading: boolean;
}

const initialState: CoachingState = {
  currentPlan: null,
  isLoading: false,
};

const coachingSlice = createSlice({
  name: 'coaching',
  initialState,
  reducers: {
    setCurrentPlan(state, action: PayloadAction<WorkoutPlan | null>) {
      state.currentPlan = action.payload;
    },
    setCoachingLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCurrentPlan, setCoachingLoading } = coachingSlice.actions;
export default coachingSlice.reducer;
