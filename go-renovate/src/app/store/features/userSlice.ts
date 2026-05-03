import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  chatUsers: [] as { id: string; name: string, status: number }[],
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
      return store;
    },
    setChatUsers: (store, { payload }) => {
      store.chatUsers = payload.data;
      return store;
    },
  },
});

export const { setUser, getChatUsers, setChatUsers } = userSlice.actions;
export default userSlice.reducer;