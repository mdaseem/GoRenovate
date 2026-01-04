import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './features/authSlice';
import rootSaga from './sagas/rootSaga';

export function makeStore(preloadedState?: any) {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
    preloadedState,
  });

  if (typeof window !== 'undefined') {
    sagaMiddleware.run(rootSaga);
  }

  return store;
}

// ✅ Type helpers — defined AFTER store creation
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
