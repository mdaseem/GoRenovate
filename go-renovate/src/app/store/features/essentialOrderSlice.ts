import { createSlice } from "@reduxjs/toolkit";
import { EssentialOrder, EssentialOrderSummary } from "@/app/types/essentialOrder";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  orders: [] as EssentialOrderSummary[],
  currentOrder: null as EssentialOrder | null,
  lastCreatedOrder: null as EssentialOrder | null,
  isLoading: false,
  isLoadingDetail: false,
  isSubmitting: false,
  error: null as string | null,
};

export const essentialOrderSlice = createSlice({
  name: "essentialOrderState",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getEssentialOrders: (store, { payload }) => {
      store.isLoading = true;
      store.error = null;
      return store;
    },
    setEssentialOrders: (store, { payload }) => {
      store.orders = payload.data;
      store.isLoading = false;
      return store;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getEssentialOrderDetail: (store, { payload }) => {
      store.isLoadingDetail = true;
      store.error = null;
      return store;
    },
    setEssentialOrderDetail: (store, { payload }) => {
      store.currentOrder = payload.data;
      store.isLoadingDetail = false;
      return store;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createEssentialOrder: (store, { payload }) => {
      store.isSubmitting = true;
      store.error = null;
      store.lastCreatedOrder = null;
      return store;
    },
    setEssentialOrderCreated: (store, { payload }) => {
      store.lastCreatedOrder = payload.data;
      store.isSubmitting = false;
      return store;
    },
    clearLastCreatedEssentialOrder: (store) => {
      store.lastCreatedOrder = null;
      return store;
    },
    setEssentialOrderError: (store, { payload }) => {
      store.error = payload;
      store.isLoading = false;
      store.isLoadingDetail = false;
      store.isSubmitting = false;
      return store;
    },
  },
});

export const {
  getEssentialOrders,
  setEssentialOrders,
  getEssentialOrderDetail,
  setEssentialOrderDetail,
  createEssentialOrder,
  setEssentialOrderCreated,
  clearLastCreatedEssentialOrder,
  setEssentialOrderError,
} = essentialOrderSlice.actions;
export default essentialOrderSlice.reducer;
