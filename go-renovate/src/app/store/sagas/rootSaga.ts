import { all, fork } from "redux-saga/effects";
import { watchProducts } from "./productsSaga";
import { watchUsers } from "./userSaga";
import { watchAIChat } from "./aiChatSaga";
import { watchOrders } from "./orderSaga";

export default function* rootSaga() {
  yield all([
    fork(watchProducts),
    fork(watchUsers),
    fork(watchAIChat),
    fork(watchOrders),
  ]);
}
