import { Essential, EssentialPlacement } from "@/app/types/category";
import { ResolvedScene, bookcaseLayout } from "@/app/utils/sceneSpec";

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
// Wall pieces without an elevation hang at this height (cm to their centre).
const DEFAULT_WALL_ELEVATION_CM = 150;
// Raise / Lower buttons move a wall piece by this much.
export const WALL_NUDGE_CM = 5;
// A wall piece may not hang lower than the baseboard.
const BASEBOARD_CM = 10;
// Height assumed for a wall piece with no `h`, as % of the scene.
const WALL_FALLBACK_HEIGHT_PCT = 8;

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
  // SURFACE pieces: the piece (key) this one rests on, and its horizontal
  // offset from that piece's centre (% of scene width). The piece's own x/y are
  // then derived from its support, so it moves with it.
  onKey?: string;
  dx?: number;
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
  zone: "floor" | "wall" | "ceiling" | "surface",
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
interface ResolvedPlacement {
  zone: "floor" | "wall" | "ceiling" | "surface";
  layer: number;
  elevationCm?: number;
  supports: boolean;
}

export function getPlacement(
  item: Essential,
  scene?: ResolvedScene,
): ResolvedPlacement {
  const zone = item.placement?.zone ?? "floor";
  // A surface piece rests on other pieces, so no space can 'not support' it.
  const supported =
    zone === "surface" || !scene || scene.spec.zones.includes(zone);
  return {
    zone: supported ? zone : "floor",
    layer: item.placement?.layer ?? 1,
    elevationCm: item.placement?.elevationCm,
    supports: Boolean(item.placement?.supports),
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
  zone: "floor" | "wall" | "ceiling" | "surface",
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
  // Ceiling pieces hang from the ceiling: they slide along it but never down.
  if (zone === "ceiling") return { min: 0, max: 0 };
  if (zone === "wall") return { min: 6, max: floor - 12 };
  return { min: floor + band * 0.07, max: 98 };
}

export function clampPosition(
  position: ScenePosition,
  item: Essential,
  scene: ResolvedScene,
): ScenePosition {
  const placement = getPlacement(item, scene);
  const half = itemWidthPct(item, scene) / 2;
  const x = Math.min(
    100 - Math.min(half, 45),
    Math.max(Math.min(half, 45), position.x),
  );
  if (placement.zone === "wall") {
    // y is the TOP edge: keep the whole piece between the ceiling and the
    // baseboard, whatever its height / resize.
    const heightPct = wallHeightPct(item, scene, placement.layer, position.scale);
    const floorPct = scene.spec.floorLine * 100;
    const baseboardPct = (BASEBOARD_CM / scene.heightCm) * 100;
    const min = 1;
    const max = Math.max(min, floorPct - baseboardPct - heightPct);
    return { x, y: Math.min(max, Math.max(min, position.y)) };
  }
  const { min, max } = yLimits(placement.zone, scene);
  return { x, y: Math.min(max, Math.max(min, position.y)) };
}

// A wall piece's on-screen height as % of the scene (its real height).
function wallHeightPct(
  item: Essential,
  scene: ResolvedScene,
  layer: number,
  scale = 1,
): number {
  return itemBoxPct(item, scene, "wall", layer, scale).h ?? WALL_FALLBACK_HEIGHT_PCT;
}

// Height of a wall piece's CENTRE above the floor, in cm, from its stored top
// edge (y). Used for the live "150 cm from floor" label and the Raise/Lower bar.
export function wallElevationCm(
  item: Essential,
  position: ScenePosition,
  scene: ResolvedScene,
): number {
  const { layer } = getPlacement(item, scene);
  const heightPct = wallHeightPct(item, scene, layer, position.scale);
  const centreY = position.y + heightPct / 2;
  const floorPct = scene.spec.floorLine * 100;
  return Math.max(0, Math.round(((floorPct - centreY) / 100) * scene.heightCm));
}

// Inverse: the top-edge y (% of scene) that puts a wall piece's centre at the
// given height above the floor.
export function yForWallElevation(
  item: Essential,
  elevationCm: number,
  scene: ResolvedScene,
  scale = 1,
): number {
  const { layer } = getPlacement(item, scene);
  const heightPct = wallHeightPct(item, scene, layer, scale);
  const floorPct = scene.spec.floorLine * 100;
  return floorPct - (elevationCm / scene.heightCm) * 100 - heightPct / 2;
}

interface CmRect {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

const OVERLAP_MARGIN_CM = 4;

function rectsOverlap(a: CmRect, b: CmRect): boolean {
  return (
    a.left < b.right + OVERLAP_MARGIN_CM &&
    a.right > b.left - OVERLAP_MARGIN_CM &&
    a.bottom < b.top + OVERLAP_MARGIN_CM &&
    a.top > b.bottom - OVERLAP_MARGIN_CM
  );
}

function fixtureRects(scene: ResolvedScene): { type: string; rect: CmRect }[] {
  return scene.spec.fixtures.map((fixture) => ({
    type: fixture.type,
    rect: {
      left: fixture.xCm,
      right: fixture.xCm + fixture.widthCm,
      bottom: fixture.bottomCm,
      top: fixture.bottomCm + fixture.heightCm,
    },
  }));
}

// A wall piece's rectangle in room centimetres (x = left edge from the left wall).
function wallPieceRect(
  item: Essential,
  xPct: number,
  elevationCm: number,
  scene: ResolvedScene,
  scale = 1,
): CmRect {
  const widthCm = (item.dimensionsCm?.w ?? FALLBACK_WIDTH_CM) * scale;
  const heightCm = (item.dimensionsCm?.h ?? 30) * scale;
  const centreX = (xPct / 100) * scene.sceneWidthCm;
  return {
    left: centreX - widthCm / 2,
    right: centreX + widthCm / 2,
    bottom: elevationCm - heightCm / 2,
    top: elevationCm + heightCm / 2,
  };
}

// Nearest x (as % of the scene) to the preferred spot where a wall piece
// clears every fixture (window/door/frame/counter) and the wall pieces placed
// before it; falls back to the preferred spot when the wall is too crowded.
function findFreeWallX(
  item: Essential,
  preferredPct: number,
  elevationCm: number,
  scene: ResolvedScene,
  taken: CmRect[],
): number {
  const blockers = [...fixtureRects(scene).map((entry) => entry.rect), ...taken];
  const halfPct = Math.min(itemWidthPct(item, scene) / 2, 45);
  for (let step = 0; step <= 100; step += 2) {
    for (const direction of step === 0 ? [0] : [1, -1]) {
      const candidate = preferredPct + direction * step;
      if (candidate < halfPct || candidate > 100 - halfPct) continue;
      const rect = wallPieceRect(item, candidate, elevationCm, scene);
      if (!blockers.some((blocker) => rectsOverlap(rect, blocker))) return candidate;
    }
  }
  return preferredPct;
}

interface FixtureOverlap {
  id: string;
  name: string;
  fixture: string;
}

const FIXTURE_WORDS: Record<string, string> = {
  window: "the window",
  door: "the door",
  artframe: "the wall art",
  counter: "the counter",
  bookcase: "the bookcase",
};

// Wall pieces whose current spot overlaps a window/door/frame/counter, so the
// UI can tell the user (placing there is allowed — it is only a heads-up).
export function getFixtureOverlaps(
  pieces: { item: ScenePiece; position: ScenePosition }[],
  scene: ResolvedScene,
): FixtureOverlap[] {
  const fixtures = fixtureRects(scene);
  const overlaps: FixtureOverlap[] = [];
  const seen = new Set<string>();
  for (const { item, position } of pieces) {
    if (getPlacement(item, scene).zone !== "wall") continue;
    const rect = wallPieceRect(
      item,
      position.x,
      wallElevationCm(item, position, scene),
      scene,
      position.scale,
    );
    const hit = fixtures.find((entry) => rectsOverlap(rect, entry.rect));
    if (hit && !seen.has(item._id)) {
      seen.add(item._id);
      overlaps.push({
        id: item._id,
        name: item.name,
        fixture: FIXTURE_WORDS[hit.type] ?? "a fixture",
      });
    }
  }
  return overlaps;
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

  // Wall pieces hang at their elevation (default 150 cm) and are spread along
  // the wall, nudged sideways to clear windows, doors and each other.
  const wall = items.filter((item) => getPlacement(item, scene).zone === "wall");
  const takenOnWall: CmRect[] = [];
  const preferredX = spread(wall.length, wall.length > 1 ? 30 : 50, 70);
  // Widest pieces choose their spot first, so a crowded wall still finds room
  // for the big ones (a shelf) and the small ones fit in around them.
  const byWidth = wall
    .map((item, i) => ({ item, preferred: preferredX[i] }))
    .sort((a, b) => itemWidthPct(b.item, scene) - itemWidthPct(a.item, scene));
  byWidth.forEach(({ item, preferred }) => {
    const elevation =
      getPlacement(item, scene).elevationCm ?? DEFAULT_WALL_ELEVATION_CM;
    const x = findFreeWallX(item, preferred, elevation, scene, takenOnWall);
    takenOnWall.push(wallPieceRect(item, x, elevation, scene));
    positions[keyOf(item)] = clampPosition(
      { x, y: yForWallElevation(item, elevation, scene) },
      item,
      scene,
    );
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

  // Resting pieces (plants, vases, lamps…) go onto the available supports in
  // turn — supporting pieces (tables, wall shelves) and the space's own (counter
  // worktops, bookcase shelves) — spread along each top; with no support they
  // stand on the floor row. A bookcase compartment takes one piece; tables,
  // shelves and counters take as many as are given. Their x/y here are only the
  // fallback: while the support exists they are derived from it, so they follow
  // it when it moves.
  const resting = items.filter((item) => getPlacement(item, scene).zone === "surface");
  const pieceSupports = items.filter((item) => {
    const placement = getPlacement(item, scene);
    return placement.supports && (placement.zone === "floor" || placement.zone === "wall");
  });
  const targets = [
    ...pieceSupports.map((piece) => ({
      key: keyOf(piece),
      halfWidth: itemWidthPct(piece, scene) / 2,
      capacity: Infinity,
    })),
    ...getSpaceSupports(scene).map((support) => ({
      key: support.key,
      halfWidth: support.halfWidth,
      capacity: support.key.startsWith("space:cell-") ? 1 : Infinity,
    })),
  ];
  const onTarget = new Map<string, ScenePiece[]>();
  const loose: ScenePiece[] = [];
  let pointer = 0;
  resting.forEach((item) => {
    for (let tries = 0; tries < targets.length; tries += 1) {
      const target = targets[(pointer + tries) % targets.length];
      if ((onTarget.get(target.key)?.length ?? 0) < target.capacity) {
        onTarget.set(target.key, [...(onTarget.get(target.key) ?? []), item]);
        pointer = (pointer + tries + 1) % targets.length;
        return;
      }
    }
    loose.push(item);
  });
  onTarget.forEach((kids, key) => {
    const halfWidth = targets.find((target) => target.key === key)?.halfWidth ?? 0;
    kids.forEach((child, index) => {
      const room = Math.max(0, halfWidth - itemWidthPct(child, scene) / 2);
      positions[keyOf(child)] = {
        x: 50,
        y: surfaceRestY(scene),
        onKey: key,
        dx: spread(kids.length, -room, room)[index],
      };
    });
  });
  spread(loose.length, loose.length > 1 ? 40 : 50, 60).forEach((x, index) => {
    positions[keyOf(loose[index])] = { x, y: surfaceRestY(scene) };
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
    if (declared !== "surface" && !scene.spec.zones.includes(declared)) {
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

// ── Surfaces: pieces that rest ON other pieces ───────────────────────────
// A piece with `placement.supports` offers its TOP EDGE as a resting surface.
// (Today the surface is simply the piece's top: a table top, a shelf plank.)

// The resting piece's bottom overlaps the surface by this much so it looks
// seated rather than floating.
const SURFACE_SINK_PCT = 0.4;
// A dropped piece snaps to a surface whose top is within this vertical distance.
const SNAP_RANGE_PCT = 10;

export interface SupportInfo {
  key: string;
  name: string;
  // Horizontal centre and half-width of the surface, % of scene width.
  x: number;
  halfWidth: number;
  // y (% of scene height) a resting piece's bottom edge sits at.
  topY: number;
  // The support's own perspective factor (resting pieces inherit it so the
  // pair keep their relative size).
  depth: number;
  // True for supports that belong to the SPACE (a counter's worktop, a
  // bookcase shelf) rather than to a piece; they never move.
  fixed?: boolean;
}

export function getSupportInfo(
  item: ScenePiece,
  position: ScenePosition,
  scene: ResolvedScene,
): SupportInfo | null {
  const placement = getPlacement(item, scene);
  if (!placement.supports) return null;
  if (placement.zone !== "floor" && placement.zone !== "wall") return null;
  const depth = depthScale(placement.zone, position.y, scene);
  const box = itemBoxPct(
    item,
    scene,
    placement.zone,
    placement.layer,
    (position.scale ?? 1) * depth,
  );
  if (box.h === null) return null; // can't know where its top is
  // Floor pieces are anchored by their bottom edge, wall pieces by their top.
  const top = placement.zone === "wall" ? position.y : position.y - box.h;
  return {
    key: keyOf(item),
    name: item.name,
    x: position.x,
    halfWidth: box.w / 2,
    topY: top + SURFACE_SINK_PCT,
    depth,
  };
}

// Supports that belong to the space itself: each counter fixture's worktop and
// every compartment of each bookcase fixture (reading order: top shelf first,
// left to right). Keys are prefixed "space:" so they can't clash with piece keys.
export function getSpaceSupports(scene: ResolvedScene): SupportInfo[] {
  const floorPct = scene.spec.floorLine * 100;
  const toX = (cm: number) => (cm / scene.sceneWidthCm) * 100;
  const toY = (cm: number) => floorPct - (cm / scene.heightCm) * 100 + SURFACE_SINK_PCT;
  const counters = scene.spec.fixtures.filter((fixture) => fixture.type === "counter");
  const supports: SupportInfo[] = [];

  scene.spec.fixtures.forEach((fixture, index) => {
    if (fixture.type === "counter") {
      supports.push({
        key: `space:counter-${index}`,
        name: counters.length > 1 ? `Counter ${counters.indexOf(fixture) + 1}` : "Counter",
        x: toX(fixture.xCm + fixture.widthCm / 2),
        halfWidth: toX(fixture.widthCm / 2),
        topY: toY(fixture.bottomCm + fixture.heightCm),
        depth: 1,
        fixed: true,
      });
    }
    if (fixture.type === "bookcase") {
      for (const cell of bookcaseLayout(fixture).cells) {
        const section =
          cell.columns === 1
            ? ""
            : cell.columns === 2
              ? [" — left", " — right"][cell.col]
              : cell.columns === 3
                ? [" — left", " — middle", " — right"][cell.col]
                : ` — section ${cell.col + 1}`;
        supports.push({
          key: `space:cell-${index}-${cell.row}-${cell.col}`,
          name: `Bookcase shelf ${cell.rowFromTop}${section}`,
          x: toX(cell.leftCm + cell.widthCm / 2),
          halfWidth: toX(cell.widthCm / 2),
          topY: toY(cell.surfaceCm),
          depth: 1,
          fixed: true,
        });
      }
    }
  });
  return supports;
}

// Where a resting piece stands when it has no support: the main floor row.
export function surfaceRestY(scene: ResolvedScene): number {
  const floor = scene.spec.floorLine * 100;
  return floor + (100 - floor) * 0.475;
}

// The support (if any) a piece dropped with its centre at x and its bottom
// edge at bottomY should snap onto: the nearest surface whose top is within
// range and whose width spans x.
export function findSupportAt(
  supports: SupportInfo[],
  x: number,
  bottomY: number,
): SupportInfo | null {
  let best: SupportInfo | null = null;
  let bestGap = Infinity;
  for (const support of supports) {
    if (Math.abs(x - support.x) > support.halfWidth) continue;
    const gap = Math.abs(bottomY - support.topY);
    if (gap <= SNAP_RANGE_PCT && gap < bestGap) {
      best = support;
      bestGap = gap;
    }
  }
  return best;
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
