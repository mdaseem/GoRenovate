import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
};
type prodType = {
  id: number;
  name: string;
  price: number;
  image: string;
};

export const overlaySlice = createSlice({
  name: "overlayState",
  initialState,
  reducers: {
    setOpenState: (store, { payload }) => {
      store.isOpen = payload;
      return store;
    },
    setOpenStateLogin: (store, { payload }) => {
      store.isOpenLogin = payload;
      return store;
    },
  },
});

export const { setOpenState, setOpenStateLogin } = overlaySlice.actions;
export default overlaySlice.reducer;
