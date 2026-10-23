"use client";

import { useCallback, useEffect, useState } from "react";
import { VendorOrder } from "@/app/types/vendorOrders";
import { fetchVendorOrder, VendorOrdersApiError } from "@/app/utils/vendorOrdersApi";

// One order, for the vendor's order page. `notFound` is true for an order that does not exist or is
// not the vendor's (the server answers 404 for both, on purpose).
export function useVendorOrder(token: string, orderId: string) {
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    fetchVendorOrder(token, orderId, controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) setOrder(loaded);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof VendorOrdersApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        console.error("Failed to load vendor order:", err);
        setError("We couldn't load this order. Please check your connection and try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [token, orderId, reloadCount]);

  // Coming back to the tab: pick up changes quietly (for example the buyer-side changes later).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      fetchVendorOrder(token, orderId)
        .then(setOrder)
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [token, orderId]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { order, setOrder, isLoading, notFound, error, reload };
}
