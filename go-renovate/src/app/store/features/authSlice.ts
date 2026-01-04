import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: { userName: string } | null;
  loading: boolean;
  error: string | null;
  token: string | undefined
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  token: ""
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state, action: PayloadAction<{ email: string | "", token: string | "" }>) => {
      state.loading = true;
      state.error = null;
      state.token = action.payload.token
    },
    loginSuccess: (state, action: PayloadAction<{ user: string, token: string }>) => {
      state.loading = false;
      state.user = action.payload.user ? { userName: action.payload.user } : null;
      state.token = action.payload.token;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = "";
    },
  },
});

export const { loginRequest, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
