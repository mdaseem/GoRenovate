import { ProductCartItem } from "@/app/types/productCart";
import { MAX_QUANTITY_PER_PRODUCT } from "@/app/utils/productFacts";

// The shop cart survives a refresh and moves between vendor pages. Browser storage can be missing,
// full or edited by hand, so every read is wrapped and every line is re-validated; a bad line is
// dropped rather than trusted. (Prices are only for display: the server prices the order itself.)
const STORAGE_KEY = "gr.productCart.v1";
const MAX_LINES = 50;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isValidLine(value: unknown): value is ProductCartItem {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.essentialId === "string" &&
    OBJECT_ID.test(line.essentialId) &&
    isText(line.name, 200) &&
    typeof line.price === "number" &&
    Number.isFinite(line.price) &&
    line.price >= 0 &&
    isText(line.vendorId, 80) &&
    isText(line.vendorName, 120) &&
    isText(line.categoryLabel, 80) &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MAX_QUANTITY_PER_PRODUCT &&
    Number.isInteger(line.maxQuantity) &&
    (line.maxQuantity as number) >= 1 &&
    (line.maxQuantity as number) <= MAX_QUANTITY_PER_PRODUCT &&
    (line.imageUrl === undefined || isText(line.imageUrl, 500))
  );
}

export function loadProductCart(): ProductCartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const lines: ProductCartItem[] = [];
    for (const entry of parsed) {
      if (!isValidLine(entry) || seen.has(entry.essentialId)) continue;
      seen.add(entry.essentialId);
      lines.push({ ...entry, quantity: Math.min(entry.quantity, entry.maxQuantity) });
      if (lines.length >= MAX_LINES) break;
    }
    return lines;
  } catch {
    return [];
  }
}

export function saveProductCart(items: ProductCartItem[]): void {
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Storage unavailable or full: the cart still works for this visit.
  }
}
