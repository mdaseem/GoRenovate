import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import { getProducts, setLoading, setProducts } from "../features/productSlice";
import axios from "axios";

// http://localhost:3002/products
// https://go-renovate-server.onrender.com/products
function getProductCall(token: string) {
  return axios
    .get<Response>("https://go-renovate-server.onrender.com/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });
}

function* handleRequest(action: ReturnType<typeof getProducts>): SagaIterator {
  // https://go-renovate-server.onrender.com/products
  try {
    const res: Response = yield call(getProductCall, action.payload.token);

    yield put(setProducts({ data: res }));
    yield put(setLoading({ data: false }));
  } catch (error: unknown) {
    if (error instanceof Error) {
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
