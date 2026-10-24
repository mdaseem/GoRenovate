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
  // How the vendor said it is fitted; null for the types that do not ask.
  fit: FitZone | null;
  hasPhoto: boolean;
  imageUrl: string | null;
  // The vendor's own uploaded photos in order (the first is the main picture).
  photos: string[];
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

// Where a piece sits in a room. The answer to "How is it fitted?" (see services/vendorProductRules.ts).
export type FitZone = "floor" | "wall" | "ceiling" | "surface";

export const FIT_CHOICES: { id: FitZone; label: string; icon: string }[] = [
  { id: "floor", label: "Stands on the floor", icon: "🛋️" },
  { id: "wall", label: "Hangs on the wall", icon: "🖼️" },
  { id: "ceiling", label: "Hangs from the ceiling", icon: "💡" },
  { id: "surface", label: "Sits on a table or shelf", icon: "🪴" },
];

export const FIT_LABELS: Record<FitZone, string> = Object.fromEntries(
  FIT_CHOICES.map((choice) => [choice.id, choice.label]),
) as Record<FitZone, string>;

export interface ProductType {
  id: string;
  label: string;
  icon: string;
  // Present only for the types that ask "How is it fitted?": the answers that make sense for the type.
  fits?: FitZone[];
}

// What the photo step may do right now (`enabled` is false when the server has no photo storage set up).
export interface PhotoRules {
  enabled: boolean;
  maxPerProduct: number;
  maxBytes: number;
  minSide: number;
}

// One upload permission from POST /vendor/products/photo-ticket: where to send the file and the signed
// fields to send with it. Good for one photo, for about an hour.
export interface PhotoTicket {
  uploadUrl: string;
  fields: Record<string, string>;
  publicId: string;
}

export interface ProductTypesResponse {
  types: ProductType[];
  maxProducts: number;
  photos: PhotoRules;
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
  // Sent only for the types that ask.
  fit?: FitZone;
}

export type ProductField =
  | "name"
  | "description"
  | "slot"
  | "fit"
  | "price"
  | "stock"
  | "dimensionsCm"
  | "photos"
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
