import { all, fork } from "redux-saga/effects";
import { watchProducts } from "./productsSaga";
import { watchUsers } from "./userSaga";

export default function* rootSaga() {
  yield all([fork(watchProducts), fork(watchUsers)]);
}
