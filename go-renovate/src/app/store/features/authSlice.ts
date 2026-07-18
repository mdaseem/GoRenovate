import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  error: string | null;
}

const initialState: AuthState = {
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.error = null;
    },
  },
});

export const { loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
