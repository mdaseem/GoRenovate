export type PurchaseMode = "on-platform" | "external-store";

export interface CategorySlot {
  id: string;
  label: string;
}

// LEGACY single-scene settings for a category (all optional). Superseded by
// spaces; used only as the fallback when a category has none (utils/sceneSpec).
export interface SceneConfig {
  backdrop?: string;
  sceneWidthCm?: number;
  floorLine?: number;
}

export interface EssentialPlacement {
  // "surface" = rests ON another piece (a plant on a table, a vase on a shelf).
  zone?: "floor" | "wall" | "ceiling" | "surface";
  layer?: number;
  // WALL pieces: height of the piece's centre above the floor, in cm.
  elevationCm?: number;
  // Floor/wall pieces that can hold surface pieces (tables, consoles, wall
  // shelves); the resting surface is the piece's top edge.
  supports?: boolean;
}

// ── Spaces: selectable base layouts for the Customize room preview ─────────
// (see the room-visual-preview skill). All fixture coordinates are fractions
// (0–1) of the scene's width/height.
export type SpaceKind = "room-elevation" | "shelf-grid" | "plan";
export type SpaceZone = "floor" | "wall" | "ceiling";

export interface SpaceFixture {
  type: "window" | "door" | "artframe" | "counter" | "bookcase";
  // Current geometry, in real-world centimetres: distance from the left wall,
  // height of the bottom edge above the floor, and the fixture's size.
  xCm?: number;
  bottomCm?: number;
  widthCm?: number;
  heightCm?: number;
  color?: string;
  // bookcase: compartments stacked (rows) and side by side (columns).
  rows?: number;
  columns?: number;
  // LEGACY geometry (0–1 fractions of the old fixed 16:10 box) on spaces seeded
  // before the true-scale model; utils/sceneSpec converts it.
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface SpaceSpec {
  wall: { color: string; shade?: string; pattern?: "plain" | "tiles" };
  floor: { color: string; lineColor?: string };
  baseboard?: string;
  // LEGACY (0–1 from the top). Superseded by SpaceTemplate.ceilingHeightCm.
  floorLine?: number;
  fixtures: SpaceFixture[];
  // Placement zones this space supports.
  zones: SpaceZone[];
}

export interface SpaceTemplate {
  slug: string;
  categorySlug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isDefault?: boolean;
  kind: SpaceKind;
  // Real-world width the scene's full width represents.
  sceneWidthCm: number;
  // Floor-to-ceiling height. With the width it defines the scene's shape.
  ceilingHeightCm?: number;
  // How much floor the camera sees in front of the back wall (default 90 cm).
  floorViewDepthCm?: number;
  // LEGACY: aspect of the old fixed box; used only when ceilingHeightCm is absent.
  aspect?: number;
  spec: SpaceSpec;
}

export interface Category {
  _id: string;
  slug: string;
  name: string;
  icon: string;
  slots: CategorySlot[];
  sortOrder: number;
  scene?: SceneConfig;
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
  // Vendor-supplied transparent, front-view image used by the room preview.
  cutoutUrl?: string;
  dimensionsCm?: { w: number; h: number; d: number };
  placement?: EssentialPlacement;
}

export interface Room {
  _id: string;
  categorySlug: string;
  title: string;
  essentialIds: string[];
  heroImageUrl?: string;
  totalPrice: number;
  styleTags: string[];
  // The Space this curated Room is previewed in; unset/unknown = the category default.
  spaceSlug?: string;
}

export interface CategoryDetail {
  category: Category;
  rooms: Room[];
  essentialsBySlot: Record<string, Essential[]>;
  // Selectable base layouts, default first. Absent on an un-seeded backend.
  spaces?: SpaceTemplate[];
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
