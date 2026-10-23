"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCounts, ProductPage } from "@/app/types/vendorProducts";

const LOAD_ERROR = "We couldn't load the products. Please check your connection and try again.";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

type Fetcher<T> = (options: { before: string | null; signal: AbortSignal }) => Promise<ProductPage<T>>;

// A list of products that loads page by page ("Show more") for either the vendor's own list or the
// owner's review queue. `fetchPage` must change identity whenever the filter changes (wrap it in
// useCallback on the status): that is what starts a fresh list. `applyChange` swaps in a product after
// an action, or drops it when `keep` says it no longer belongs in this list.
export function usePagedProducts<T extends { id: string }>(fetchPage: Fetcher<T>) {
  const [products, setProducts] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [counts, setCounts] = useState<ProductCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const loadFirst = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const page = await fetchPage({ before: null, signal: controller.signal });
      if (controller.signal.aborted) return;
      setProducts(page.products);
      setNextCursor(page.nextCursor);
      setCounts(page.counts);
    } catch (err) {
      if (isAbort(err) || controller.signal.aborted) return;
      console.error("Failed to load products:", err);
      setError(LOAD_ERROR);
    } finally {
      if (controllerRef.current === controller) setIsLoading(false);
    }
  }, [fetchPage]);

  // A new filter (or first mount) starts from an empty list so another tab's products never flash.
  useEffect(() => {
    setProducts([]);
    setNextCursor(null);
    setLoadMoreError(null);
    void loadFirst();
    return () => controllerRef.current?.abort();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const controller = new AbortController();
      const page = await fetchPage({ before: nextCursor, signal: controller.signal });
      setProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        return [...current, ...page.products.filter((product) => !seen.has(product.id))];
      });
      setNextCursor(page.nextCursor);
      setCounts(page.counts);
    } catch (err) {
      console.error("Failed to load more products:", err);
      setLoadMoreError("We couldn't load more. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, fetchPage]);

  const applyChange = useCallback((changed: T, keep: (product: T) => boolean) => {
    setProducts((current) =>
      keep(changed)
        ? current.map((product) => (product.id === changed.id ? changed : product))
        : current.filter((product) => product.id !== changed.id),
    );
  }, []);

  return {
    products,
    nextCursor,
    counts,
    setCounts,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    loadMore,
    applyChange,
    reload: loadFirst,
  };
}
