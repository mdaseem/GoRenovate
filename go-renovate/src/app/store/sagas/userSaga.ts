import { call, put, takeLatest } from "redux-saga/effects";
import { loginFailure } from "../features/authSlice";
import { SagaIterator } from "redux-saga";
import axios, { AxiosResponse } from "axios";
import { getChatUsers, setChatUsers } from "../features/userSlice";

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
    )
    .catch((error) => {
      console.log("Error fetching users:", error);
    });
}

function* handleRequest(action: ReturnType<typeof getChatUsers>): SagaIterator {
  // https://go-renovate-server.onrender.com/products
  try {
    const chatUsers: Response = yield call(getUser, action.payload.token);
    console.log("called----------------1", chatUsers);

    yield put(setChatUsers({ data: chatUsers }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      yield put(loginFailure(error.message));
    } else {
      yield put(loginFailure("An unknown error occurred"));
    }
  }
}

export function* watchUsers() {
  yield takeLatest(getChatUsers.type, handleRequest);
}
