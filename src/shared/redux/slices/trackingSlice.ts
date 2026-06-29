import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RunSession } from '../../../features/tracking/domain/models/RunSession';

interface TrackingState {
  history: RunSession[];
  isLoading: boolean;
}

const initialState: TrackingState = {
  history: [],
  isLoading: false,
};

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    setHistory(state, action: PayloadAction<RunSession[]>) {
      state.history = action.payload;
    },
    addRunSession(state, action: PayloadAction<RunSession>) {
      state.history.push(action.payload);
    },
    setTrackingLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setHistory, addRunSession, setTrackingLoading } = trackingSlice.actions;
export default trackingSlice.reducer;
