import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios, { AxiosResponse } from "axios";
import { signOut } from "next-auth/react";
import {
  getChatUsers,
  setChatUsers,
  setChatUsersError,
} from "../features/userSlice";

async function getUser(token: string) {
  return axios
    .get<Response>(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/user/userlist`, {
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
      yield put(setChatUsersError("Session expired. Please log in again."));
    } else {
      yield put(
        setChatUsersError("Couldn't load your connections. Please try again."),
      );
    }
  }
}

export function* watchUsers() {
  yield takeLatest(getChatUsers.type, handleRequest);
}
