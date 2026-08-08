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
import { Vendor } from "../../component/VendorPage/vendor";

function getProductCall(token?: string, filters?: string) {
  const query = filters ? `?${filters}` : "";
  return axios
    .get<Vendor[]>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors${query}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    )
    .then((response) => response.data);
}

function* handleRequest(action: ReturnType<typeof getProducts>): SagaIterator {
  try {
    const filters: string | undefined = action.payload.filters;
    const res: Vendor[] = yield call(
      getProductCall,
      action.payload.token,
      filters,
    );

    yield put(setProducts({ data: res, isUnfiltered: !filters }));
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
