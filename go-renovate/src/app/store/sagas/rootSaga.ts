import { all, fork } from "redux-saga/effects";
import { watchAuth } from "./authSaga";
import { watchProducts } from "./productsSaga";
import { watchUsers } from "./userSaga";

export default function* rootSaga() {
  yield all([fork(watchAuth), fork(watchProducts), fork(watchUsers)]);
}
