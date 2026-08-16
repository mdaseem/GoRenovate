import { useCallback, useEffect, useRef, useState } from "react";

export interface AvailabilityEntry {
  isAvailable: boolean;
  price: number | null;
}

interface CheckAvailabilityOptions {
  force?: boolean;
}

interface UseCartAvailabilityReturn {
  availability: Record<string, AvailabilityEntry>;
  isChecking: boolean;
  checkError: string | null;
  checkAvailability: (
    vendorId: string,
    serviceIds: string[],
    options?: CheckAvailabilityOptions,
  ) => Promise<void>;
}

export function useCartAvailability(): UseCartAvailabilityReturn {
  const [availability, setAvailability] = useState<
    Record<string, AvailabilityEntry>
  >({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const lastCheckedKeyRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    async (
      vendorId: string,
      serviceIds: string[],
      options?: CheckAvailabilityOptions,
    ) => {
      if (serviceIds.length === 0) {
        abortControllerRef.current?.abort();
        lastCheckedKeyRef.current = "";
        setAvailability({});
        return;
      }

      const key = `${vendorId}:${[...serviceIds].sort().join(",")}`;
      if (!options?.force && key === lastCheckedKeyRef.current) return;
      lastCheckedKeyRef.current = key;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsChecking(true);
      setCheckError(null);
      try {
        const params = serviceIds.map(encodeURIComponent).join(",");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors/${vendorId}/services/availability?ids=${params}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          throw new Error(`Failed to check availability (${res.status})`);
        }

        const data = await res.json();
        const next: Record<string, AvailabilityEntry> = {};
        for (const entry of data?.services ?? []) {
          next[entry.id] = {
            isAvailable: entry.isAvailable !== false,
            price: typeof entry.price === "number" ? entry.price : null,
          };
        }
        setAvailability(next);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to check cart availability:", error);
        lastCheckedKeyRef.current = "";
        setCheckError(
          "Couldn't verify item availability. You can still continue.",
        );
      } finally {
        // A superseded request's controller no longer matches the ref, so it
        // must not clear isChecking out from under the request that replaced it.
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
