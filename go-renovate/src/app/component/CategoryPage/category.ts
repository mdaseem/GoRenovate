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

// Shared by RoomConfigurator, RoomDetailOverlay, and EssentialSwapPicker —
// previously computed inline in each with the same reduce, easy to drift
// out of sync. A slot with no matching selection (or no options at all)
// just contributes 0, same as the inline versions did.
export function computeRoomTotal(
  detail: CategoryDetail,
  selectedEssentialBySlot: Record<string, string>,
): number {
  return detail.category.slots.reduce((sum, slot) => {
    const selectedId = selectedEssentialBySlot[slot.id];
    const options = detail.essentialsBySlot[slot.id] ?? [];
    const selected = options.find((option) => option._id === selectedId);
    return sum + (selected?.price ?? 0);
  }, 0);
}

// Was local to roomFilterConfig.ts; moved here once a second consumer
// (the swap picker's style-tag pills) needed the same kebab-case ->
// Title Case formatting.
export function humanizeStyleTag(tag: string): string {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
