import { createSlice } from "@reduxjs/toolkit";
import { Order, OrderSummary } from "@/app/types/order";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  orders: [] as OrderSummary[],
  currentOrder: null as Order | null,
  lastCreatedOrder: null as Order | null,
  isLoading: false,
  isLoadingDetail: false,
  isSubmitting: false,
  error: null as string | null,
};

export const orderSlice = createSlice({
  name: "orderState",
  initialState,
  reducers: {
    getOrders: (store, { payload }) => {
      store.isLoading = true;
      store.error = null;
      return store;
    },
    setOrders: (store, { payload }) => {
      store.orders = payload.data;
      store.isLoading = false;
      return store;
    },
    getOrderDetail: (store, { payload }) => {
      store.isLoadingDetail = true;
      store.error = null;
      return store;
    },
    setOrderDetail: (store, { payload }) => {
      store.currentOrder = payload.data;
      store.isLoadingDetail = false;
      return store;
    },
    createOrder: (store, { payload }) => {
      store.isSubmitting = true;
      store.error = null;
      store.lastCreatedOrder = null;
      return store;
    },
    setOrderCreated: (store, { payload }) => {
      store.lastCreatedOrder = payload.data;
      store.isSubmitting = false;
      return store;
    },
    clearLastCreatedOrder: (store) => {
      store.lastCreatedOrder = null;
      return store;
    },
    updateOrderStatus: (store, { payload }) => {
      store.isSubmitting = true;
      store.error = null;
      return store;
    },
    setOrderStatusUpdated: (store, { payload }) => {
      store.currentOrder = payload.data;
      store.isSubmitting = false;
      return store;
    },
    setOrdersError: (store, { payload }) => {
      store.error = payload;
      store.isLoading = false;
      store.isLoadingDetail = false;
      store.isSubmitting = false;
      return store;
    },
  },
});

export const {
  getOrders,
  setOrders,
  getOrderDetail,
  setOrderDetail,
  createOrder,
  setOrderCreated,
  clearLastCreatedOrder,
  updateOrderStatus,
  setOrderStatusUpdated,
  setOrdersError,
} = orderSlice.actions;
export default orderSlice.reducer;
