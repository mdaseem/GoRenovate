import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: { userName: string } | null;
  loading: boolean;
  error: string | null;
  token: string | undefined;
  email: string | undefined;
  password?: string | undefined;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  token: "",
  email: "",
  password: "",

};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state, action: PayloadAction<{ email: string | "", password: string | "", token: string | "" }>) => {
      state.loading = true;
      state.error = null;
      state.token = action.payload.token
    },
    SignupRequest: (state, action: PayloadAction<{ email: string | "", password: string | ""}>) => {
      state.loading = true;
      state.error = null;
      state.email = action.payload.email
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

export const { loginRequest, SignupRequest, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
