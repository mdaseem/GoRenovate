export type PurchaseMode = "on-platform" | "external-store";

export interface CategorySlot {
  id: string;
  label: string;
}

export interface Category {
  _id: string;
  slug: string;
  name: string;
  icon: string;
  slots: CategorySlot[];
  sortOrder: number;
}

export interface Essential {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  vendorId: string;
  vendorName: string;
  categorySlugs: string[];
  slot: string;
  purchaseMode: PurchaseMode;
  externalStoreUrl?: string;
}

export interface Room {
  _id: string;
  categorySlug: string;
  title: string;
  essentialIds: string[];
  heroImageUrl?: string;
  totalPrice: number;
  styleTags: string[];
}

export interface CategoryDetail {
  category: Category;
  rooms: Room[];
  essentialsBySlot: Record<string, Essential[]>;
}
