import { call, put, select, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import axios, { AxiosResponse } from "axios";
import { signOut } from "next-auth/react";
import { loginFailure } from "../features/authSlice";
import {
  AIChatApiMessage,
  sendAIChatMessage,
  setAIChatError,
  setAIChatReply,
} from "../features/aiChatSlice";
import { RootState } from "../store";

interface AIChatResponse {
  reply: string;
  messages: AIChatApiMessage[];
}

function postAIChatMessage(token: string, messages: AIChatApiMessage[]) {
  return axios
    .post<AIChatResponse>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/ai/chat`,
      { messages },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then((response: AxiosResponse<AIChatResponse>) => response.data);
}

function* handleSendAIChatMessage(
  action: ReturnType<typeof sendAIChatMessage>,
): SagaIterator {
  try {
    // The reducer has already appended this turn to apiHistory by the time
    // this saga runs, so the current state is exactly the payload to send.
    const apiHistory: AIChatApiMessage[] = yield select(
      (state: RootState) => state.aiChat.apiHistory,
    );
    const data: AIChatResponse = yield call(
      postAIChatMessage,
      action.payload.token,
      apiHistory,
    );
    yield put(setAIChatReply({ reply: data.reply, messages: data.messages }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      yield call(signOut, { redirect: false });
      yield put(loginFailure("Session expired. Please log in again."));
      yield put(setAIChatError("Session expired. Please log in again."));
    } else {
      yield put(
        setAIChatError("Couldn't reach the assistant. Please try again."),
      );
    }
  }
}

export function* watchAIChat() {
  yield takeLatest(sendAIChatMessage.type, handleSendAIChatMessage);
}
