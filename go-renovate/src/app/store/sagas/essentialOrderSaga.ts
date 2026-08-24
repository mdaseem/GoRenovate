import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import { signOut } from "next-auth/react";
import {
  getEssentialOrders,
  setEssentialOrders,
  getEssentialOrderDetail,
  setEssentialOrderDetail,
  createEssentialOrder,
  setEssentialOrderCreated,
  setEssentialOrderError,
} from "../features/essentialOrderSlice";
import {
  CreateEssentialOrderPayload,
  EssentialOrder,
  EssentialOrderSummary,
} from "@/app/types/essentialOrder";

const ESSENTIAL_ORDERS_URL = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/orders`;
const REQUEST_TIMEOUT_MS = 15_000;

function authHeaders(token: string) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    timeout: REQUEST_TIMEOUT_MS,
  };
}

function fetchEssentialOrders(token: string) {
  return axios
    .get<EssentialOrderSummary[]>(ESSENTIAL_ORDERS_URL, authHeaders(token))
    .then((response) => response.data);
}

function fetchEssentialOrderDetail(token: string, id: string) {
  return axios
    .get<EssentialOrder>(`${ESSENTIAL_ORDERS_URL}/${id}`, authHeaders(token))
    .then((response) => response.data);
}

function postEssentialOrder(token: string, data: CreateEssentialOrderPayload) {
  return axios
    .post<EssentialOrder>(ESSENTIAL_ORDERS_URL, data, authHeaders(token))
    .then((response) => response.data);
}

function isSessionExpired(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}


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

function* handleGetEssentialOrders(
  action: ReturnType<typeof getEssentialOrders>,
): SagaIterator {
  try {
    const orders: EssentialOrderSummary[] = yield call(
      fetchEssentialOrders,
      action.payload.token,
    );
    yield put(setEssentialOrders({ data: orders }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setEssentialOrderError("Session expired. Please log in again."));
    } else {
      yield put(
        setEssentialOrderError(
          resolveErrorMessage(error, "Couldn't load your room orders. Please try again."),
        ),
      );
    }
  }
}

function* handleGetEssentialOrderDetail(
  action: ReturnType<typeof getEssentialOrderDetail>,
): SagaIterator {
  try {
    const order: EssentialOrder = yield call(
      fetchEssentialOrderDetail,
      action.payload.token,
      action.payload.id,
    );
    yield put(setEssentialOrderDetail({ data: order }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setEssentialOrderError("Session expired. Please log in again."));
    } else {
      yield put(
        setEssentialOrderError(
          resolveErrorMessage(error, "Couldn't load this order. Please try again."),
        ),
      );
    }
  }
}

function* handleCreateEssentialOrder(
  action: ReturnType<typeof createEssentialOrder>,
): SagaIterator {
  try {
    const order: EssentialOrder = yield call(
      postEssentialOrder,
      action.payload.token,
      action.payload.data,
    );
    yield put(setEssentialOrderCreated({ data: order }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setEssentialOrderError("Session expired. Please log in again."));
    } else {
      yield put(
        setEssentialOrderError(
          resolveErrorMessage(error, "Couldn't place your order. Please try again."),
        ),
      );
    }
  }
}

export function* watchEssentialOrders() {
  yield takeLatest(getEssentialOrders.type, handleGetEssentialOrders);
  yield takeLatest(getEssentialOrderDetail.type, handleGetEssentialOrderDetail);
  yield takeLatest(createEssentialOrder.type, handleCreateEssentialOrder);
}
