import { useCallback, useEffect, useRef, useState } from "react";

export interface AvailabilityEntry {
  isAvailable: boolean;
  price: number | null;
  // Units left for tracked on-platform items; null = not tracked.
  stock: number | null;
}

type AvailabilityMap = Record<string, AvailabilityEntry>;

// The backend caps /essentials/availability at 50 ids per request, so larger
// lists (e.g. a whole category catalog) are split into chunks.
const MAX_IDS_PER_REQUEST = 50;

interface CheckAvailabilityOptions {
  force?: boolean;
}

interface UseEssentialAvailabilityReturn {
  availability: AvailabilityMap;
  isChecking: boolean;
  checkError: string | null;
  checkAvailability: (
    essentialIds: string[],
    options?: CheckAvailabilityOptions,
  ) => Promise<AvailabilityMap | null>;
}

export function useEssentialAvailability(): UseEssentialAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const lastCheckedKeyRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    async (
      essentialIds: string[],
      options?: CheckAvailabilityOptions,
    ): Promise<AvailabilityMap | null> => {
      if (essentialIds.length === 0) {
        abortControllerRef.current?.abort();
        lastCheckedKeyRef.current = "";
        setAvailability({});
        return {};
      }

      const key = [...essentialIds].sort().join(",");
      if (!options?.force && key === lastCheckedKeyRef.current) {
        return null;
      }
      lastCheckedKeyRef.current = key;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsChecking(true);
      setCheckError(null);
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < essentialIds.length; i += MAX_IDS_PER_REQUEST) {
          chunks.push(essentialIds.slice(i, i + MAX_IDS_PER_REQUEST));
        }
        const responses = await Promise.all(
          chunks.map((chunk) =>
            fetch(
              `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/availability?ids=${chunk
                .map(encodeURIComponent)
                .join("|")}`,
              { signal: controller.signal },
            ),
          ),
        );

        if (responses.some((res) => !res.ok)) {
          throw new Error("Failed to check availability");
        }

        const payloads = await Promise.all(responses.map((res) => res.json()));
        const next: AvailabilityMap = {};
        for (const entry of payloads.flatMap((data) => data?.essentials ?? [])) {
          next[entry.id] = {
            isAvailable: entry.isAvailable !== false,
            price: typeof entry.price === "number" ? entry.price : null,
            stock: typeof entry.stock === "number" ? entry.stock : null,
          };
        }
        setAvailability(next);
        return next;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return null;
        }
        console.error("Failed to check essential availability:", error);
        lastCheckedKeyRef.current = "";
        setCheckError(
          "Couldn't verify item availability. You can still continue.",
        );
        return null;
      } finally {
        if (abortControllerRef.current === controller) {
          setIsChecking(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { availability, isChecking, checkError, checkAvailability };
}
