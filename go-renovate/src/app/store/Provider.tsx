"use client";

import { Provider } from "react-redux";
import { AppStore, makeStore } from "./store";
import { SessionProvider } from "next-auth/react";
import { useRef } from "react";

export function Providers({
  children,
  preloadedState,
}: {
  children: React.ReactNode;
  preloadedState?: any;
}) {
  const storeRef = useRef(makeStore(preloadedState));
  return (
    <SessionProvider>
      <Provider store={storeRef.current}>{children}</Provider>
    </SessionProvider>
  );
}
