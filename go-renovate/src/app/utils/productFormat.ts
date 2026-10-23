import { ManagedProduct, ProductSize } from "@/app/types/vendorProducts";
import { formatRupees } from "@/app/utils/vendorOrderFormat";

export function formatSize(size: ProductSize | null): string | null {
  if (!size) return null;
  const parts = [size.w, size.h, ...(size.d ? [size.d] : [])].map((value) => String(Number(value.toFixed(1))));
  return `${parts.join(" × ")} cm`;
}

export function stockText(stock: number | null): string {
  return stock === null ? "Always available" : stock === 0 ? "Out of stock" : `${stock} in stock`;
}

// "Sofa · ₹24,999 · 5 in stock · 210 × 85 × 90 cm" for a product line.
export function summariseProduct(product: ManagedProduct): string {
  return [product.typeLabel, formatRupees(product.price), stockText(product.stock), formatSize(product.dimensionsCm)]
    .filter(Boolean)
    .join(" · ");
}
