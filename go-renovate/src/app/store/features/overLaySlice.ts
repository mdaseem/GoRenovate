import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  isOpenChat: false,
  isUserListOpen: false,
  isMobileMenuOpen: false,
  isOpenProductPage: false,
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
    setOpenStateChat: (store, { payload }) => {
      store.isOpenChat = payload;
      return store;
    },
    setOpenStateUserList: (store, { payload }) => {
      store.isUserListOpen = payload;
      return store;
    },
    setOpenMobileMenu: (store, { payload }) => {
      store.isMobileMenuOpen = payload;
      return store;
    },
    setOpenStateProductPage: (store, { payload }) => {
      store.isOpenProductPage = payload;
      return store;
    },
  },
});

export const {
  setOpenState,
  setOpenStateLogin,
  setOpenStateChat,
  setOpenStateUserList,
  setOpenMobileMenu,
  setOpenStateProductPage,
} = overlaySlice.actions;
export default overlaySlice.reducer;
