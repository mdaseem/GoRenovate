import { Essential, EssentialPlacement } from "@/app/types/category";
import { ResolvedScene } from "@/app/utils/sceneSpec";

// Pure helpers behind the room preview (see the room-visual-preview skill).
// Every position is a percentage of the scene's width/height, so it scales to
// any screen — and to any space's aspect ratio — without recomputing.

// Used when a product has no dimensions yet — a plausible mid-size piece, so
// it still shows up and can be dragged rather than vanishing.
export const FALLBACK_WIDTH_CM = 70;

// A flat floor covering (rug) is seen foreshortened from the front: its
// on-screen height is its DEPTH times this factor, not its thickness.
const FLOOR_FLAT_FORESHORTEN = 0.35;
// Widest a single piece may be drawn, as % of the scene (keeps it on screen).
const MAX_PIECE_WIDTH_PCT = 92;

export interface ScenePosition {
  // Horizontal centre, % of scene width.
  x: number;
  // Vertical anchor, % of scene height: the item's BOTTOM edge for floor
  // items, its TOP edge for ceiling/wall items.
  y: number;
  // Per-piece tweaks the user can make (presentation only; all optional).
  scale?: number; // multiplier on the piece's real-world size, MIN–MAX_PIECE_SCALE
  flipped?: boolean; // mirrored horizontally
  front?: boolean; // painted above everything else in its zone
}

export const MIN_PIECE_SCALE = 0.5;
export const MAX_PIECE_SCALE = 2;
export const PIECE_SCALE_STEP = 1.1;

export function clampScale(scale: number): number {
  return Math.min(MAX_PIECE_SCALE, Math.max(MIN_PIECE_SCALE, scale));
}

// A subtle perspective cue only: a floor piece standing nearer the viewer is
// drawn up to 5% larger (and one against the back wall up to 5% smaller) than
// its true size. Kept small on purpose so pieces stay close to real scale.
export function depthScale(
  zone: "floor" | "wall" | "ceiling",
  y: number,
  scene: ResolvedScene,
): number {
  if (zone !== "floor") return 1;
  const { min, max } = yLimits("floor", scene);
  const t = Math.min(1, Math.max(0, (y - min) / (max - min)));
  return 0.95 + 0.1 * t;
}

export type ScenePositions = Record<string, ScenePosition>;

// A product shown in the scene. When the same product appears several times
// (quantity), each copy carries its own `pieceKey`; otherwise the product's
// own id is the key.
export type ScenePiece = Essential & { pieceKey?: string };

export function keyOf(item: ScenePiece): string {
  return item.pieceKey ?? item._id;
}

// A piece's zone, falling back to the floor when the current space doesn't
// support it (e.g. a ceiling pendant in a space with no ceiling) so the
// piece is still shown and movable rather than lost.
export function getPlacement(
  item: Essential,
  scene?: ResolvedScene,
): Required<EssentialPlacement> {
  const zone = item.placement?.zone ?? "floor";
  const supported = !scene || scene.spec.zones.includes(zone);
  return {
    zone: supported ? zone : "floor",
    layer: item.placement?.layer ?? 1,
  };
}

export function itemWidthPct(item: Essential, scene: ResolvedScene): number {
  const widthCm = item.dimensionsCm?.w ?? FALLBACK_WIDTH_CM;
  return Math.min(MAX_PIECE_WIDTH_PCT, (widthCm / scene.sceneWidthCm) * 100);
}

// A piece's on-screen box as % of the scene, from its REAL width and height:
// width = w ÷ room width, height = h ÷ visible room height. `factor`
// multiplies both (the user's resize × the small perspective cue), so the
// proportions never distort. `h` is null when the product has no height (the
// artwork then keeps its own proportions) — and for a flat floor covering the
// height comes from its depth (foreshortened), not its thickness.
export function itemBoxPct(
  item: Essential,
  scene: ResolvedScene,
  zone: "floor" | "wall" | "ceiling",
  layer: number,
  factor = 1,
): { w: number; h: number | null } {
  const dims = item.dimensionsCm;
  const rawW = ((dims?.w ?? FALLBACK_WIDTH_CM) / scene.sceneWidthCm) * 100 * factor;
  // If the width would overflow the scene, shrink both dimensions together.
  const fit = Math.min(1, MAX_PIECE_WIDTH_PCT / rawW);
  const isFlat = zone === "floor" && layer === 0;
  const heightCm = isFlat
    ? dims?.d !== undefined
      ? dims.d * FLOOR_FLAT_FORESHORTEN
      : undefined
    : dims?.h;
  return {
    w: rawW * fit,
    h:
      heightCm !== undefined
        ? (heightCm / scene.heightCm) * 100 * factor * fit
        : null,
  };
}

// Vertical limits (% of scene height) a dragged item may be dropped in.
export function yLimits(
  zone: Required<EssentialPlacement>["zone"],
  scene: ResolvedScene,
): { min: number; max: number } {
  const floor = scene.spec.floorLine * 100;
  const band = 100 - floor; // the visible floor strip, % of scene height
  if (zone === "ceiling") return { min: 0, max: 22 };
  if (zone === "wall") return { min: 6, max: floor - 12 };
  return { min: floor + band * 0.07, max: 98 };
}

export function clampPosition(
  position: ScenePosition,
  item: Essential,
  scene: ResolvedScene,
): ScenePosition {
  const { min, max } = yLimits(getPlacement(item, scene).zone, scene);
  const half = itemWidthPct(item, scene) / 2;
  return {
    x: Math.min(100 - Math.min(half, 45), Math.max(Math.min(half, 45), position.x)),
    y: Math.min(max, Math.max(min, position.y)),
  };
}

// Keep a piece's centre where its full width stays inside the scene.
function clampX(x: number, widthPct: number): number {
  const half = Math.min(widthPct / 2, 45);
  return Math.min(100 - half, Math.max(half, x));
}

function spread(count: number, from: number, to: number): number[] {
  if (count === 1) return [(from + to) / 2];
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
}

// Deterministic "tidy" arrangement for any mix of products. It never assumes
// which product types exist: it only reads each item's zone, layer and width.
export function computeAutoLayout(
  items: ScenePiece[],
  scene: ResolvedScene,
): ScenePositions {
  const positions: ScenePositions = {};
  const floor = scene.spec.floorLine * 100;
  const band = 100 - floor; // the visible floor strip, % of scene height

  const ceiling = items.filter((item) => getPlacement(item, scene).zone === "ceiling");
  spread(ceiling.length, ceiling.length > 1 ? 28 : 50, 72).forEach((x, i) => {
    positions[keyOf(ceiling[i])] = { x, y: 0 };
  });

  const wall = items.filter((item) => getPlacement(item, scene).zone === "wall");
  spread(wall.length, wall.length > 1 ? 30 : 50, 70).forEach((x, i) => {
    positions[keyOf(wall[i])] = { x, y: Math.max(10, floor * 0.3) };
  });

  const floorItems = items.filter((item) => getPlacement(item, scene).zone === "floor");

  // Layer 0: flat floor coverings (rugs) sit centred under everything.
  const flat = floorItems.filter((item) => getPlacement(item, scene).layer === 0);
  flat.forEach((item, i) => {
    positions[keyOf(item)] = { x: 50 + i * 6, y: Math.min(96, floor + band * 0.775 + i * 2) };
  });

  // Layer 1: the main pieces stand along the back of the room, widest in the
  // middle with the rest alternating outwards.
  const main = floorItems
    .filter((item) => getPlacement(item, scene).layer === 1)
    .sort((a, b) => itemWidthPct(b, scene) - itemWidthPct(a, scene));
  const ordered: ScenePiece[] = [];
  main.forEach((item, i) => {
    if (i === 0) ordered.push(item);
    else if (i % 2 === 1) ordered.push(item);
    else ordered.unshift(item);
  });
  const gap = 2;
  const totalWidth =
    ordered.reduce((sum, item) => sum + itemWidthPct(item, scene), 0) +
    gap * Math.max(0, ordered.length - 1);
  // If they don't fit, compress the spacing (items may overlap slightly)
  // rather than running off the edge of the room.
  const fit = totalWidth > 92 ? 92 / totalWidth : 1;
  let cursor = 50 - (totalWidth * fit) / 2;
  ordered.forEach((item) => {
    const width = itemWidthPct(item, scene) * fit;
    positions[keyOf(item)] = {
      x: clampX(cursor + width / 2, itemWidthPct(item, scene)),
      y: floor + band * 0.475,
    };
    cursor += width + gap * fit;
  });

  // Layer 2+: low, front-of-room pieces (coffee tables…) sit in front of the
  // widest main piece, or in the middle when there is none.
  const front = floorItems
    .filter((item) => getPlacement(item, scene).layer >= 2)
    .sort((a, b) => getPlacement(a, scene).layer - getPlacement(b, scene).layer);
  const anchorX = main.length > 0 ? positions[keyOf(main[0])].x : 50;
  front.forEach((item, i) => {
    positions[keyOf(item)] = {
      x: clampX(anchorX + i * 14, itemWidthPct(item, scene)),
      y: Math.min(97, floor + band * 0.825 + i * 2),
    };
  });

  // Anything we missed (defensive): park it on the floor so it still shows.
  items.forEach((item) => {
    if (!positions[keyOf(item)]) positions[keyOf(item)] = { x: 50, y: floor + band * 0.625 };
  });
  return positions;
}

export interface FitIssue {
  id: string;
  name: string;
  reason: "no-ceiling" | "no-wall" | "too-wide" | "too-tall";
}

// Pieces the current space can't show as intended: their zone isn't supported
// (they're parked on the floor instead) or they're wider than the room. The UI
// tells the user instead of silently moving things. Pieces are never dropped.
export function getFitIssues(items: Essential[], scene: ResolvedScene): FitIssue[] {
  const issues: FitIssue[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item._id)) continue; // a product added twice is reported once
    seen.add(item._id);
    const declared = item.placement?.zone ?? "floor";
    if (!scene.spec.zones.includes(declared)) {
      issues.push({
        id: item._id,
        name: item.name,
        reason: declared === "ceiling" ? "no-ceiling" : "no-wall",
      });
      continue;
    }
    if ((item.dimensionsCm?.w ?? 0) > scene.sceneWidthCm * 0.9) {
      issues.push({ id: item._id, name: item.name, reason: "too-wide" });
    } else if (
      declared !== "ceiling" &&
      (item.dimensionsCm?.h ?? 0) > scene.ceilingHeightCm
    ) {
      issues.push({ id: item._id, name: item.name, reason: "too-tall" });
    }
  }
  return issues;
}

// "210 × 85 × 90 cm" for the selected-piece bar; says so when a vendor hasn't
// supplied dimensions rather than implying a size.
export function formatDimensions(item: Essential): string {
  const dims = item.dimensionsCm;
  if (!dims || dims.w === undefined) return "Size not provided";
  const parts = [dims.w, dims.h, dims.d].filter(
    (value): value is number => typeof value === "number",
  );
  return `${parts.join(" × ")} cm`;
}
