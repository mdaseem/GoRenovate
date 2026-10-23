// Mirrors go-renovate-server/server/src/routes/vendorProductRoutes.ts and adminProductRoutes.ts, and the
// limits in services/vendorProductRules.ts. The repos share no package, so keep these in sync by hand.

export type ProductStatus = "pending" | "live" | "paused" | "rejected";

export const PRODUCT_STATUSES: ProductStatus[] = ["live", "pending", "paused", "rejected"];

// The words a vendor sees ("rejected" is "Needs changes": it tells them what to do next).
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  live: "Live",
  pending: "In review",
  paused: "Paused",
  rejected: "Needs changes",
};

export type ProductCounts = Record<ProductStatus, number>;

export interface ProductSize {
  w: number;
  h: number;
  d: number | null;
}

export interface ManagedProduct {
  id: string;
  name: string;
  description: string;
  slot: string;
  typeLabel: string;
  icon: string;
  price: number;
  // null = not tracked (always available)
  stock: number | null;
  dimensionsCm: ProductSize | null;
  status: ProductStatus;
  pausedBy: "vendor" | "admin" | null;
  reviewNote: string;
  hasPhoto: boolean;
  imageUrl: string | null;
  inRooms: boolean;
  createdByVendor: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
}

// What the owner sees on the review screen: the product plus who sells it.
export interface AdminProduct extends ManagedProduct {
  vendorId: string;
  vendorName: string;
  // The room categories this product's type could be shown in (empty for "Other").
  possibleRooms: string[];
}

export interface ProductType {
  id: string;
  label: string;
  icon: string;
}

export interface ProductTypesResponse {
  types: ProductType[];
  maxProducts: number;
}

export interface ProductPage<T> {
  products: T[];
  nextCursor: string | null;
  counts: ProductCounts;
}

// What the form sends. Fields the server decides (status, photos, rooms, vendor) are never sent.
export interface ProductInput {
  name: string;
  description: string;
  slot: string;
  price: number;
  stock: number | null;
  dimensionsCm: { w: number; h: number; d?: number } | null;
}

export type ProductField =
  | "name"
  | "description"
  | "slot"
  | "price"
  | "stock"
  | "dimensionsCm"
  | "reason"
  | "showInRooms"
  | "enabled"
  | "form";
export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export const PRODUCT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  descriptionMax: 1000,
  priceMin: 1,
  priceMax: 1_000_000,
  stockMax: 9999,
  sizeMax: 1000,
  reasonMin: 3,
  reasonMax: 300,
} as const;
