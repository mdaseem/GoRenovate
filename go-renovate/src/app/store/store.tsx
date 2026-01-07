import { configureStore, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './features/authSlice';
import rootSaga from './sagas/rootSaga';

const rootReducer = combineReducers({
  auth: authReducer,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeStore(preloadedState?: any) {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: rootReducer, // ✅ SINGLE reducer now
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
    preloadedState,
  });

  if (typeof window !== 'undefined') {
    sagaMiddleware.run(rootSaga);
  }

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
