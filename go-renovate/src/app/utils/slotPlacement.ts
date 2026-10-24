import { Essential, EssentialPlacement } from "@/app/types/category";

// Where a piece sits in a room (floor / wall / ceiling / on a surface) is a property of the product's
// `placement`. The seeded catalogue carries it (entered by hand in the seed); a product a vendor adds
// does not, and without a rule it would stand on the floor whatever it is.
//
// This is that rule: a default from the product's TYPE (its `slot`), used only for the parts of
// `placement` the product does not state itself. It covers the types whose place never varies; types
// that do vary (lighting, bedside table, storage, vanity, accessories) are deliberately left out, so they
// keep the floor until the product says otherwise (the vendor form is meant to ask).
// The values mirror what the seeded products of each type already use.
const SLOT_PLACEMENT: Record<string, EssentialPlacement> = {
  sofa: { zone: "floor", layer: 1 },
  bed: { zone: "floor", layer: 1 },
  wardrobe: { zone: "floor", layer: 1 },
  "coffee-table": { zone: "floor", layer: 2, supports: true },
  "dining-table": { zone: "floor", layer: 2, supports: true },
  chairs: { zone: "floor", layer: 3 },
  rug: { zone: "floor", layer: 0 },
  "wall-decor": { zone: "wall", layer: 1 },
  mirror: { zone: "wall", layer: 1 },
  decor: { zone: "surface", layer: 2 },
  countertop: { zone: "surface", layer: 2 },
};

export function defaultPlacementForSlot(slot: string | undefined): EssentialPlacement | undefined {
  return slot ? SLOT_PLACEMENT[slot] : undefined;
}

type PlacedProduct = Pick<Essential, "slot" | "placement">;

// The zone a product asks for: its own, else its type's, else the floor.
export function declaredZone(item: PlacedProduct): NonNullable<EssentialPlacement["zone"]> {
  return item.placement?.zone ?? defaultPlacementForSlot(item.slot)?.zone ?? "floor";
}

// The product's placement with the type's defaults filled in wherever it says nothing.
export function effectivePlacement(item: PlacedProduct): Required<Pick<EssentialPlacement, "zone" | "layer" | "supports">> &
  Pick<EssentialPlacement, "elevationCm"> {
  const base = defaultPlacementForSlot(item.slot);
  return {
    zone: declaredZone(item),
    layer: item.placement?.layer ?? base?.layer ?? 1,
    supports: item.placement?.supports ?? base?.supports ?? false,
    elevationCm: item.placement?.elevationCm,
  };
}
