"use client";

import { Provider } from "react-redux";
import { makeStore } from "./store";
import { SessionProvider } from "next-auth/react";
import { useRef } from "react";

export function Providers({
  children,
  preloadedState,
}: {
  children: React.ReactNode;
  // disable-next-line @typescript-eslint/no-explicit-any
  preloadedState?: any;
}) {
  const storeRef = useRef(makeStore(preloadedState));
  return (
    <SessionProvider>
      <Provider store={storeRef.current}>{children}</Provider>
    </SessionProvider>
  );
}
