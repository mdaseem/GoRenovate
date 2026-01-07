import { all, fork } from "redux-saga/effects";
import { watchAuth } from "./authSaga";

export default function* rootSaga() {
  yield all([fork(watchAuth)]);
}
