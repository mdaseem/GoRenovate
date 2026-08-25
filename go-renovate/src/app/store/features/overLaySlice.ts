import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  isOpenChat: false,
  isUserListOpen: false,
  isMobileMenuOpen: false,
  isOpenProductPage: false,
  isMobileSearchOpen: false,
  isOpenAIChat: false,
  isOpenFilters: false,
  isOpenRoomFilters: false,
  isOpenSlotPicker: false,
  isOpenRoomDetail: false,
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
    setOpenMobileSearch: (store, { payload }) => {
      store.isMobileSearchOpen = payload;
      return store;
    },
    setOpenStateAIChat: (store, { payload }) => {
      store.isOpenAIChat = payload;
      return store;
    },
    setOpenStateFilters: (store, { payload }) => {
      store.isOpenFilters = payload;
      return store;
    },
    setOpenStateRoomFilters: (store, { payload }) => {
      store.isOpenRoomFilters = payload;
      return store;
    },
    setOpenStateSlotPicker: (store, { payload }) => {
      store.isOpenSlotPicker = payload;
      return store;
    },
    setOpenStateRoomDetail: (store, { payload }) => {
      store.isOpenRoomDetail = payload;
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
  setOpenMobileSearch,
  setOpenStateAIChat,
  setOpenStateFilters,
  setOpenStateRoomFilters,
  setOpenStateSlotPicker,
  setOpenStateRoomDetail,
} = overlaySlice.actions;
export default overlaySlice.reducer;
