import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import {
  getProducts,
  setLoading,
  setProducts,
  setProductsError,
} from "../features/productSlice";
import axios from "axios";
import { signOut } from "next-auth/react";

function getProductCall(token: string) {
  return axios
    .get<Response>(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response.data);
}

function* handleRequest(action: ReturnType<typeof getProducts>): SagaIterator {
  try {
    const res: Response = yield call(getProductCall, action.payload.token);

    yield put(setProducts({ data: res }));
    yield put(setLoading({ data: false }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setProductsError("Session expired. Please log in again."));
    } else {
      yield put(
        setProductsError("We couldn't load products. Please try again."),
      );
    }
    yield put(setLoading({ data: false }));
  }
}

export function* watchProducts() {
  yield takeLatest(getProducts.type, handleRequest);
}
