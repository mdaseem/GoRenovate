"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ActiveFilters,
  countActiveFilters,
  MULTI_VALUE_DELIMITER,
  readActiveFilters,
} from "./roomFilterConfig";

interface UseRoomFiltersReturn {
  activeFilters: ActiveFilters;
  activeCount: number;
  toggleCheckboxOption: (filterId: string, value: string) => void;
  setRadioValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

// Pure URL state, same shape as useVendorFilters — filtering itself happens
// server-side (GET /essentials/categories/:slug accepts the translated
// query params). No toggle filters at the Room level, so no
// setToggleValue.
export function useRoomFilters(): UseRoomFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilters = useMemo(
    () => readActiveFilters(searchParams),
    [searchParams],
  );

  const activeCount = useMemo(
    () => countActiveFilters(activeFilters),
    [activeFilters],
  );

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const toggleCheckboxOption = useCallback(
    (filterId: string, value: string) => {
      updateParams((params) => {
        const current =
          params
            .get(filterId)
            ?.split(MULTI_VALUE_DELIMITER)
            .filter(Boolean) ?? [];
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        if (next.length)
          params.set(filterId, next.join(MULTI_VALUE_DELIMITER));
        else params.delete(filterId);
      });
    },
    [updateParams],
  );

  const setRadioValue = useCallback(
    (filterId: string, value: string) => {
      updateParams((params) => {
        if (value) params.set(filterId, value);
        else params.delete(filterId);
      });
    },
    [updateParams],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    activeFilters,
    activeCount,
    toggleCheckboxOption,
    setRadioValue,
    clearAll,
  };
}
