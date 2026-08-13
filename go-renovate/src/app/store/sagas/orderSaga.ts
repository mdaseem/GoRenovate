import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import { signOut } from "next-auth/react";
import {
  getOrders,
  setOrders,
  getOrderDetail,
  setOrderDetail,
  createOrder,
  setOrderCreated,
  updateOrderStatus,
  setOrderStatusUpdated,
  setOrdersError,
} from "../features/orderSlice";
import {
  CreateOrderPayload,
  Order,
  OrderStatus,
  OrderSummary,
} from "@/app/types/order";

const ORDERS_URL = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/orders`;
const REQUEST_TIMEOUT_MS = 15_000;

function authHeaders(token: string) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    timeout: REQUEST_TIMEOUT_MS,
  };
}

function fetchOrders(token: string) {
  return axios
    .get<OrderSummary[]>(ORDERS_URL, authHeaders(token))
    .then((response) => response.data);
}

function fetchOrderDetail(token: string, id: string) {
  return axios
    .get<Order>(`${ORDERS_URL}/${id}`, authHeaders(token))
    .then((response) => response.data);
}

function postOrder(token: string, data: CreateOrderPayload) {
  return axios
    .post<Order>(ORDERS_URL, data, authHeaders(token))
    .then((response) => response.data);
}

function patchOrderStatus(
  token: string,
  id: string,
  status: OrderStatus,
  note?: string,
) {
  return axios
    .patch<Order>(`${ORDERS_URL}/${id}/status`, { status, note }, authHeaders(token))
    .then((response) => response.data);
}

function isSessionExpired(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

// Surfaces the backend's own validation/error message when it sends one
// (400s from orderRoutes.ts always do), falls back to a network-specific
// message when the request never reached the server, and only falls back
// to the generic message as a last resort.
function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage) {
      return serverMessage;
    }
    if (!error.response) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
  }
  return fallback;
}

function* handleGetOrders(action: ReturnType<typeof getOrders>): SagaIterator {
  try {
    const orders: OrderSummary[] = yield call(fetchOrders, action.payload.token);
    yield put(setOrders({ data: orders }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setOrdersError("Session expired. Please log in again."));
    } else {
      yield put(
        setOrdersError(
          resolveErrorMessage(error, "Couldn't load your orders. Please try again."),
        ),
      );
    }
  }
}

function* handleGetOrderDetail(
  action: ReturnType<typeof getOrderDetail>,
): SagaIterator {
  try {
    const order: Order = yield call(
      fetchOrderDetail,
      action.payload.token,
      action.payload.id,
    );
    yield put(setOrderDetail({ data: order }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setOrdersError("Session expired. Please log in again."));
    } else {
      yield put(
        setOrdersError(
          resolveErrorMessage(error, "Couldn't load this order. Please try again."),
        ),
      );
    }
  }
}

function* handleCreateOrder(action: ReturnType<typeof createOrder>): SagaIterator {
  try {
    const order: Order = yield call(
      postOrder,
      action.payload.token,
      action.payload.data,
    );
    yield put(setOrderCreated({ data: order }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setOrdersError("Session expired. Please log in again."));
    } else {
      yield put(
        setOrdersError(
          resolveErrorMessage(error, "Couldn't place your order. Please try again."),
        ),
      );
    }
  }
}

function* handleUpdateOrderStatus(
  action: ReturnType<typeof updateOrderStatus>,
): SagaIterator {
  try {
    const order: Order = yield call(
      patchOrderStatus,
      action.payload.token,
      action.payload.id,
      action.payload.status,
      action.payload.note,
    );
    yield put(setOrderStatusUpdated({ data: order }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setOrdersError("Session expired. Please log in again."));
    } else {
      yield put(
        setOrdersError(
          resolveErrorMessage(error, "Couldn't update this order. Please try again."),
        ),
      );
    }
  }
}

export function* watchOrders() {
  yield takeLatest(getOrders.type, handleGetOrders);
  yield takeLatest(getOrderDetail.type, handleGetOrderDetail);
  yield takeLatest(createOrder.type, handleCreateOrder);
  yield takeLatest(updateOrderStatus.type, handleUpdateOrderStatus);
}
