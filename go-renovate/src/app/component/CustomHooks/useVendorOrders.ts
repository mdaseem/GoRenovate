"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VendorOrder, VendorOrderCounts, VendorStage } from "@/app/types/vendorOrders";
import { fetchVendorOrders } from "@/app/utils/vendorOrdersApi";

const REFRESH_EVERY_MS = 60_000;
const LOAD_ERROR = "We couldn't load your orders. Please check your connection and try again.";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// A silent refresh brings the newest page up to date without throwing away older pages the vendor
// already scrolled to: orders in the refreshed range that are no longer in this stage disappear,
// older ones stay. (Order ids are time-ordered hex strings, so comparing them compares age.)
function mergeFirstPage(fresh: VendorOrder[], existing: VendorOrder[], hasOlderLoaded: boolean) {
  if (!hasOlderLoaded || fresh.length === 0) return fresh;
  const boundary = fresh[fresh.length - 1].id;
  return [...fresh, ...existing.filter((order) => order.id < boundary)];
}

// The vendor's order list for one stage: newest first, "load more", a quiet refresh once a minute and
// when the tab becomes visible again, and `applyUpdate` to patch a card after an action.
export function useVendorOrders(
  token: string,
  stage: VendorStage,
  onCounts: (counts: VendorOrderCounts) => void,
) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const hasOlderLoadedRef = useRef(false);
  const onCountsRef = useRef(onCounts);
  useEffect(() => {
    onCountsRef.current = onCounts;
  }, [onCounts]);

  const loadFirstPage = useCallback(
    async (silent: boolean) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const data = await fetchVendorOrders(token, { stage, signal: controller.signal });
        if (controller.signal.aborted) return;
        onCountsRef.current(data.counts);
        if (silent) {
          setOrders((current) => mergeFirstPage(data.orders, current, hasOlderLoadedRef.current));
          if (!hasOlderLoadedRef.current) setNextCursor(data.nextCursor);
        } else {
          hasOlderLoadedRef.current = false;
          setOrders(data.orders);
          setNextCursor(data.nextCursor);
        }
        setError(null);
      } catch (err) {
        if (isAbort(err) || controller.signal.aborted) return;
        console.error("Failed to load vendor orders:", err);
        // A failed quiet refresh keeps what is on screen; only a visible load shows an error.
        if (!silent) setError(LOAD_ERROR);
      } finally {
        if (!silent && controllerRef.current === controller) setIsLoading(false);
      }
    },
    [token, stage],
  );

  // New stage (or first mount): start from an empty list so another stage's orders never flash.
  useEffect(() => {
    setOrders([]);
    setNextCursor(null);
    setLoadMoreError(null);
    void loadFirstPage(false);
    return () => controllerRef.current?.abort();
  }, [loadFirstPage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadFirstPage(true);
    }, REFRESH_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadFirstPage(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await fetchVendorOrders(token, { stage, before: nextCursor });
      onCountsRef.current(data.counts);
      hasOlderLoadedRef.current = true;
      setOrders((current) => {
        const seen = new Set(current.map((order) => order.id));
        return [...current, ...data.orders.filter((order) => !seen.has(order.id))];
      });
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Failed to load more vendor orders:", err);
      setLoadMoreError("We couldn't load more orders. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, token, stage]);

  // After an action succeeded: keep the card if it still belongs to this stage, else drop it.
  const applyUpdate = useCallback(
    (updated: VendorOrder) => {
      setOrders((current) =>
        updated.stage === stage
          ? current.map((order) => (order.id === updated.id ? updated : order))
          : current.filter((order) => order.id !== updated.id),
      );
    },
    [stage],
  );

  const refresh = useCallback(() => loadFirstPage(true), [loadFirstPage]);
  const retry = useCallback(() => loadFirstPage(false), [loadFirstPage]);

  return {
    orders,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    loadMore,
    applyUpdate,
    refresh,
    retry,
  };
}
