import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  chatUsers: [] as { id: string; name: string, status: number }[],
  isLoading: false,
  error: null as string | null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (store, { payload }) => {
      store.prodList = payload;
      return store;
    },
    getChatUsers: (store, { payload }) => {
      store.isLoading = true;
      store.error = null;
      return store;
    },
    setChatUsers: (store, { payload }) => {
      store.chatUsers = payload.data;
      store.isLoading = false;
      store.error = null;
      return store;
    },
    setChatUsersError: (store, { payload }) => {
      store.isLoading = false;
      store.error = payload;
      return store;
    },
  },
});

export const { setUser, getChatUsers, setChatUsers, setChatUsersError } =
  userSlice.actions;
export default userSlice.reducer;