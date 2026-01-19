import { all, fork } from "redux-saga/effects";
import { watchAuth } from "./authSaga";
import { watchProducts } from "./productsSaga";

export default function* rootSaga() {
  yield all([fork(watchAuth), fork(watchProducts)]);
}
