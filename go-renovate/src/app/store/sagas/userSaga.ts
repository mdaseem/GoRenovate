import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios, { AxiosResponse } from "axios";
import { signOut } from "next-auth/react";
import { getChatUsers, setChatUsers } from "../features/userSlice";

// http://localhost:3002/user/userlist
// https://go-renovate-server.onrender.com/user/userlist
async function getUser(token: string) {
  return axios
    .get<Response>("https://go-renovate-server.onrender.com/user/userlist", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(
      (
        response: AxiosResponse<
          Response,
          {
            data:
              | [
                  {
                    id: number;
                    Name: string;
                    status: number;
                  },
                ]
              | null;
          }
        >,
      ) => response.data,
    );
}

function* handleRequest(action: ReturnType<typeof getChatUsers>): SagaIterator {
  try {
    const chatUsers: Response = yield call(getUser, action.payload.token);

    yield put(setChatUsers({ data: chatUsers }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
    } else if (error instanceof Error) {
      yield put(loginFailure(error.message));
    } else {
      yield put(loginFailure("An unknown error occurred"));
    }
  }
}

export function* watchUsers() {
  yield takeLatest(getChatUsers.type, handleRequest);
}
