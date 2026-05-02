import { call, put, takeLatest } from "redux-saga/effects";
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  SignupRequest,
} from "../features/authSlice";
import { SagaIterator } from "redux-saga";

const setPayload = (email: string, password: string) => {
  return {
    userEmail: email,
    password: password,
    userName: "",
  };
};

function* handleSignup(action: ReturnType<typeof SignupRequest>): SagaIterator {
  try {
    // Replace this with your actual API call
    const response = yield call(
      fetch,
      "https://go-renovate-server.onrender.com/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: setPayload(
            action.payload.email,
            action.payload.password,
            // action.payload.token
          ),
        }),
      }
    );

    const data = yield call([response, "json"]);

    if (!response.ok) throw new Error(data.message || "Login failed");

    yield put(
      loginSuccess({ user: data?.validUserData.userName, token: data?.token })
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      yield put(loginFailure(error.message));
    } else {
      yield put(loginFailure("An unknown error occurred"));
    }
  }
}

function* handleLogin(action: ReturnType<typeof loginRequest>): SagaIterator {
  try {
    // Replace this with your actual API call
    const response = yield call(
      fetch,
      "https://go-renovate-server.onrender.com/auth",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: setPayload(
            action.payload.email,
            action.payload.password,
          ),
        }),
      }
    );

    const data = yield call([response, "json"]);

    if (!response.ok) throw new Error(data.message || "Login failed");

    yield put(
      loginSuccess({ user: data?.validUserData.userName, token: data?.token })
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      yield put(loginFailure(error.message));
    } else {
      yield put(loginFailure("An unknown error occurred"));
    }
  }
}

export function* watchAuth() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(SignupRequest.type, handleSignup);
}
