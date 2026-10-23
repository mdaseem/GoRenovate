"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setVendorOrderCounts } from "@/app/store/features/vendorOrdersSlice";
import { useAccountInfo } from "@/app/component/CustomHooks/useAccountInfo";
import { fetchVendorOrderCounts } from "@/app/utils/vendorOrdersApi";

const REFRESH_EVERY_MS = 60_000;

// Keeps the vendor's order counts fresh for the whole app (header dot, account menu, vendor home):
// asks the server for the counts when a vendor is signed in, again once a minute while the tab is
// visible, and straight away when the vendor comes back to the tab. Returns the number of NEW orders
// (0 for everyone who is not a vendor). Mount it once, in the header.
export function useVendorOrderBadge(): number {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const token = session?.backendToken;
  const { account } = useAccountInfo();
  const isVendor = account?.role === "vendor";
  const newCount = useAppSelector((state) => state.vendorOrders.counts?.new ?? 0);

  useEffect(() => {
    if (status !== "authenticated" || !token || !isVendor) {
      dispatch(setVendorOrderCounts(null));
      return;
    }

    let controller: AbortController | null = null;
    const load = () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      fetchVendorOrderCounts(token, current.signal)
        .then((counts) => {
          if (!current.signal.aborted) dispatch(setVendorOrderCounts(counts));
        })
        .catch((error: unknown) => {
          if (current.signal.aborted) return;
          // The badge is a convenience: keep the last known numbers and try again later.
          console.error("Failed to refresh order counts:", error);
        });
    };

    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, token, isVendor, dispatch]);

  return newCount;
}
