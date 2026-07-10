import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../features/user/domain/models/User';

interface UserState {
  isAuthenticated: boolean;
  email: string | null;
  user: User | null;
  isLoading: boolean;
  registeredUsers: { [email: string]: User };
}

const initialState: UserState = {
  isAuthenticated: false,
  email: null,
  user: null,
  isLoading: false,
  registeredUsers: {},
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action: PayloadAction<string>) {
      const email = action.payload.trim().toLowerCase();
      state.isAuthenticated = true;
      state.email = email;
      state.user = state.registeredUsers[email] || null;
    },
    signup(state, action: PayloadAction<string>) {
      const email = action.payload.trim().toLowerCase();
      state.isAuthenticated = true;
      state.email = email;
      state.user = null; // Forces onboarding
    },
    logout(state) {
      state.isAuthenticated = false;
      state.email = null;
      state.user = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      if (action.payload && state.email) {
        state.registeredUsers[state.email] = action.payload;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { login, signup, logout, setUser, setLoading } = userSlice.actions;
export default userSlice.reducer;

