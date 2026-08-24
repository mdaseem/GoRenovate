import { all, fork } from "redux-saga/effects";
import { watchProducts } from "./productsSaga";
import { watchUsers } from "./userSaga";
import { watchAIChat } from "./aiChatSaga";
import { watchOrders } from "./orderSaga";
import { watchSearch } from "./searchSaga";
import { watchFavorites } from "./favoritesSaga";
import { watchCategories } from "./categorySaga";
import { watchEssentialOrders } from "./essentialOrderSaga";

export default function* rootSaga() {
  yield all([
    fork(watchProducts),
    fork(watchUsers),
    fork(watchAIChat),
    fork(watchOrders),
    fork(watchSearch),
    fork(watchFavorites),
    fork(watchCategories),
    fork(watchEssentialOrders),
  ]);
}
