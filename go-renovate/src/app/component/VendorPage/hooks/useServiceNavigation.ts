import { useCallback, useMemo, useState } from "react";
import { ServiceCategory, ServiceOption } from "../vendor";

export interface FlatService {
  service: ServiceOption;
  categoryLabel: string;
}

export type NavigationDirection = "prev" | "next" | null;

interface UseServiceNavigationReturn {
  isOpen: boolean;
  current: FlatService | null;
  index: number | null;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  direction: NavigationDirection;
  open: (service: ServiceOption) => void;
  close: () => void;
  goPrev: () => void;
  goNext: () => void;
}

export function useServiceNavigation(
  categories: ServiceCategory[],
): UseServiceNavigationReturn {
  const flatServices = useMemo<FlatService[]>(
    () =>
      categories.flatMap((category) =>
        category.services.map((service) => ({
          service,
          categoryLabel: category.label,
        })),
      ),
    [categories],
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<NavigationDirection>(null);

  const open = useCallback(
    (service: ServiceOption) => {
      const index = flatServices.findIndex(
        (entry) => entry.service.id === service.id,
      );
      setDirection(null);
      setSelectedIndex(index === -1 ? null : index);
    },
    [flatServices],
  );

  const close = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goPrev = useCallback(() => {
    setDirection("prev");
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setDirection("next");
    setSelectedIndex((prev) =>
      prev !== null && prev < flatServices.length - 1 ? prev + 1 : prev,
    );
  }, [flatServices.length]);

  const current = selectedIndex !== null ? flatServices[selectedIndex] : null;

  return {
    isOpen: selectedIndex !== null,
    current,
    index: selectedIndex,
    total: flatServices.length,
    hasPrev: selectedIndex !== null && selectedIndex > 0,
    hasNext: selectedIndex !== null && selectedIndex < flatServices.length - 1,
    direction,
    open,
    close,
    goPrev,
    goNext,
  };
}
