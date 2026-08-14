import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import { signOut } from "next-auth/react";
import {
  getFavorites,
  setFavorites,
  addFavorite,
  removeFavorite,
  restoreFavorite,
  discardFavorite,
  setFavoritesError,
} from "../features/favroites";
import { Vendor } from "../../component/VendorPage/vendor";

const WISHLIST_URL = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/wishlist`;
const REQUEST_TIMEOUT_MS = 15_000;

function authHeaders(token: string) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    timeout: REQUEST_TIMEOUT_MS,
  };
}

function fetchFavorites(token: string) {
  return axios
    .get<Vendor[]>(WISHLIST_URL, authHeaders(token))
    .then((response) => response.data);
}

function postFavorite(token: string, vendorId: string) {
  return axios
    .post<Vendor[]>(WISHLIST_URL, { vendorId }, authHeaders(token))
    .then((response) => response.data);
}

function deleteFavorite(token: string, vendorId: string) {
  return axios
    .delete<Vendor[]>(`${WISHLIST_URL}/${vendorId}`, authHeaders(token))
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

function* handleGetFavorites(
  action: ReturnType<typeof getFavorites>,
): SagaIterator {
  try {
    const data: Vendor[] = yield call(fetchFavorites, action.payload.token);
    yield put(setFavorites({ data }));
  } catch (error: unknown) {
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setFavoritesError("Session expired. Please log in again."));
    } else {
      yield put(
        setFavoritesError(
          resolveErrorMessage(error, "Couldn't load your wishlist. Please try again."),
        ),
      );
    }
  }
}

function* handleAddFavorite(
  action: ReturnType<typeof addFavorite>,
): SagaIterator {
  try {
    const data: Vendor[] = yield call(
      postFavorite,
      action.payload.token,
      action.payload.vendor.id,
    );
    yield put(setFavorites({ data }));
  } catch (error: unknown) {
    yield put(discardFavorite({ vendorId: action.payload.vendor.id }));
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setFavoritesError("Session expired. Please log in again."));
    } else {
      yield put(
        setFavoritesError(
          resolveErrorMessage(error, "Couldn't save this to your wishlist. Please try again."),
        ),
      );
    }
  }
}

function* handleRemoveFavorite(
  action: ReturnType<typeof removeFavorite>,
): SagaIterator {
  try {
    const data: Vendor[] = yield call(
      deleteFavorite,
      action.payload.token,
      action.payload.vendor.id,
    );
    yield put(setFavorites({ data }));
  } catch (error: unknown) {
    yield put(restoreFavorite({ vendor: action.payload.vendor }));
    if (isSessionExpired(error)) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setFavoritesError("Session expired. Please log in again."));
    } else {
      yield put(
        setFavoritesError(
          resolveErrorMessage(error, "Couldn't remove this from your wishlist. Please try again."),
        ),
      );
    }
  }
}

export function* watchFavorites() {
  yield takeLatest(getFavorites.type, handleGetFavorites);
  yield takeLatest(addFavorite.type, handleAddFavorite);
  yield takeLatest(removeFavorite.type, handleRemoveFavorite);
}
