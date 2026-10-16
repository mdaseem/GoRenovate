import { ProductExtras } from "@/app/types/vendor";

// Small, shared facts about a product shown in the vendor pages' card, detail panel and cart.

// Same ceiling the room journey uses for one piece (see utils/customPieces.ts MAX_QUANTITY_PER_PIECE).
export const MAX_QUANTITY_PER_PRODUCT = 10;

export const PRODUCT_PLACEHOLDER_IMAGE = "/product-placeholder.svg";

// Low-stock warning threshold.
const LOW_STOCK_AT = 5;

export function formatDimensions(
  dimensions?: ProductExtras["dimensionsCm"],
): string | null {
  if (!dimensions) return null;
  const { w, h, d } = dimensions;
  if (!w || !h) return null;
  const parts = [w, h, ...(d ? [d] : [])].map((value) => Math.round(value));
  return `${parts.join(" × ")} cm`;
}

// How many a buyer may put in the cart: the stock when it is tracked, else the same cap as rooms.
export function maxQuantityFor(product: ProductExtras): number {
  if (typeof product.stock === "number") {
    return Math.max(0, Math.min(product.stock, MAX_QUANTITY_PER_PRODUCT));
  }
  return MAX_QUANTITY_PER_PRODUCT;
}

export function isOutOfStock(product: ProductExtras): boolean {
  return (
    product.purchaseMode !== "external-store" &&
    typeof product.stock === "number" &&
    product.stock <= 0
  );
}

export function stockNote(product: ProductExtras): string | null {
  if (product.purchaseMode === "external-store") return null;
  if (isOutOfStock(product)) return "Out of stock";
  if (typeof product.stock === "number" && product.stock <= LOW_STOCK_AT) {
    return `Only ${product.stock} left`;
  }
  return null;
}
