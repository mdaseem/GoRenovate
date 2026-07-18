import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import { getProducts, setLoading, setProducts } from "../features/productSlice";
import axios from "axios";
import { signOut } from "next-auth/react";

// http://localhost:3002/products
// https://go-renovate-server.onrender.com/products
function getProductCall(token: string) {
  return axios
    .get<Response>("https://go-renovate-server.onrender.com/products", {
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
    } else if (error instanceof Error) {
      yield put(loginFailure(error.message));
    } else {
      yield put(loginFailure("An unknown error occurred"));
    }
    yield put(setLoading({ data: false }));
  }
}

export function* watchProducts() {
  yield takeLatest(getProducts.type, handleRequest);
}
