import { call, put, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import { signOut } from "next-auth/react";
import { loginFailure } from "../features/authSlice";
import {
  getRecentSearches,
  addRecentSearchRequest,
  removeRecentSearchRequest,
  clearRecentSearchesRequest,
  setRecentSearches,
  setSearchError,
} from "../features/searchSlice";

const RECENT_SEARCHES_URL = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/user/recent-searches`;

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function fetchRecentSearches(token?: string) {
  return axios
    .get<string[]>(RECENT_SEARCHES_URL, { headers: authHeaders(token) })
    .then((response) => response.data);
}

function postRecentSearch(term: string, token?: string) {
  return axios
    .post<string[]>(
      RECENT_SEARCHES_URL,
      { term },
      { headers: authHeaders(token) },
    )
    .then((response) => response.data);
}

function deleteRecentSearch(term: string, token?: string) {
  return axios
    .delete<string[]>(`${RECENT_SEARCHES_URL}/${encodeURIComponent(term)}`, {
      headers: authHeaders(token),
    })
    .then((response) => response.data);
}

function deleteAllRecentSearches(token?: string) {
  return axios
    .delete<string[]>(RECENT_SEARCHES_URL, { headers: authHeaders(token) })
    .then((response) => response.data);
}

function* handleError(error: unknown, fallbackMessage: string): SagaIterator {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    yield call(signOut, { redirect: false });
    yield put(loginFailure("Session expired. Please log in again."));
    yield put(setSearchError("Session expired. Please log in again."));
  } else {
    yield put(setSearchError(fallbackMessage));
  }
}

function* handleGetRecentSearches(
  action: ReturnType<typeof getRecentSearches>,
): SagaIterator {
  try {
    const terms: string[] = yield call(
      fetchRecentSearches,
      action.payload.token,
    );
    yield put(setRecentSearches(terms));
  } catch (error: unknown) {
    yield call(handleError, error, "Couldn't load recent searches.");
  }
}

function* handleAddRecentSearch(
  action: ReturnType<typeof addRecentSearchRequest>,
): SagaIterator {
  try {
    const terms: string[] = yield call(
      postRecentSearch,
      action.payload.term,
      action.payload.token,
    );
    yield put(setRecentSearches(terms));
  } catch (error: unknown) {
    yield call(handleError, error, "Couldn't save your search.");
  }
}

function* handleRemoveRecentSearch(
  action: ReturnType<typeof removeRecentSearchRequest>,
): SagaIterator {
  try {
    const terms: string[] = yield call(
      deleteRecentSearch,
      action.payload.term,
      action.payload.token,
    );
    yield put(setRecentSearches(terms));
  } catch (error: unknown) {
    yield call(handleError, error, "Couldn't remove that search.");
  }
}

function* handleClearRecentSearches(
  action: ReturnType<typeof clearRecentSearchesRequest>,
): SagaIterator {
  try {
    const terms: string[] = yield call(
      deleteAllRecentSearches,
      action.payload.token,
    );
    yield put(setRecentSearches(terms));
  } catch (error: unknown) {
    yield call(handleError, error, "Couldn't clear recent searches.");
  }
}

export function* watchSearch() {
  yield takeLatest(getRecentSearches.type, handleGetRecentSearches);
  yield takeLatest(addRecentSearchRequest.type, handleAddRecentSearch);
  yield takeLatest(removeRecentSearchRequest.type, handleRemoveRecentSearch);
  yield takeLatest(clearRecentSearchesRequest.type, handleClearRecentSearches);
}
