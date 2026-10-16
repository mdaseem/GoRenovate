import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/app/store/hooks";
import { refreshProductCartLines } from "@/app/store/features/productCartSlice";
import { ProductCartItem } from "@/app/types/productCart";
import { AvailabilityEntry } from "@/app/component/CustomHooks/useCartAvailability";
import { MAX_QUANTITY_PER_PRODUCT } from "@/app/utils/productFacts";

interface CatalogueEntry {
  id: string;
  isAvailable: boolean;
  price: number | null;
  // null = stock is not tracked.
  stock: number | null;
}

// Asks the server (GET /essentials/availability) whether the cart's products still exist, are in
// stock and still cost what the cart says. Prices and stock limits are brought back in line in the
// cart itself; anything that is gone is marked so the drawer can offer "Remove". The server prices
// the order on its own either way - this only keeps what the buyer SEES honest.
export function useProductCartAvailability() {
  const dispatch = useAppDispatch();
  const [availability, setAvailability] = useState<Record<string, AvailabilityEntry>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Resolves to how many lines had their price or stock limit changed (0 when nothing changed or the
  // check could not run).
  const check = useCallback(
    async (items: ProductCartItem[]): Promise<number> => {
      controllerRef.current?.abort();
      if (items.length === 0) {
        setAvailability({});
        return 0;
      }
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsChecking(true);
      setCheckError(null);
      try {
        const ids = items.map((item) => encodeURIComponent(item.essentialId)).join("|");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/availability?ids=${ids}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Availability check failed (${res.status})`);
        const data: { essentials?: CatalogueEntry[] } = await res.json();

        const next: Record<string, AvailabilityEntry> = {};
        const updates: { essentialId: string; price: number; maxQuantity: number }[] = [];
        let changed = 0;
        for (const entry of data.essentials ?? []) {
          next[entry.id] = {
            isAvailable: entry.isAvailable !== false,
            price: typeof entry.price === "number" ? entry.price : null,
          };
          const line = items.find((item) => item.essentialId === entry.id);
          if (!line || !entry.isAvailable || typeof entry.price !== "number") continue;
          const maxQuantity =
            typeof entry.stock === "number"
              ? Math.min(entry.stock, MAX_QUANTITY_PER_PRODUCT)
              : MAX_QUANTITY_PER_PRODUCT;
          if (entry.price !== line.price || maxQuantity !== line.maxQuantity) {
            if (entry.price !== line.price || maxQuantity < line.quantity) changed += 1;
            updates.push({ essentialId: entry.id, price: entry.price, maxQuantity });
          }
        }
        if (updates.length > 0) dispatch(refreshProductCartLines(updates));
        setAvailability(next);
        return changed;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return 0;
        console.error("Failed to check cart availability:", error);
        setCheckError("Couldn't verify item availability. You can still continue.");
        return 0;
      } finally {
        if (controllerRef.current === controller) setIsChecking(false);
      }
    },
    [dispatch],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { availability, isChecking, checkError, check };
}
