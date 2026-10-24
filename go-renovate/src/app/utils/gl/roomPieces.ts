// Deciding how each piece of the 3D room is drawn, and where. Pure maths, no
// browser. For every piece in the World (utils/roomWorld.ts, centimetres) it picks
// the best thing that is READY right now:
//
//   model       — the product's real 3D model, fitted to the piece's size;
//   card        — its cutout photo standing in the room (a "photo stand-in");
//   block+card  — solid furniture (wardrobe, cabinet…): a block with the photo on its front;
//   block       — a plain block, until a model or photo is ready (or if it has neither).
//
// Models and photos arrive one by one while the room is on screen, so this is
// re-run as they become ready; a piece starts as a block and "upgrades" in place.
//
// Honest by construction: a photo is a stand-in, never passed off as a model, and
// a model whose size is clearly off the listing is shrunk to fit inside the
// piece's box rather than stretched out of shape.
import { pieceImageUrl } from "../pieceImage";
import { World, WorldKind, WorldPiece } from "../roomWorld";
import { CLOSE_TOLERANCE, MISMATCH_TOLERANCE } from "./modelCheck";

export type PieceMode = "model" | "card" | "block" | "block+card";

// What is ready: model extents (metres, by product id) and photo aspect ratios
// (width ÷ height, by cutout URL).
export interface ReadyAssets {
  models: Map<string, { w: number; h: number; d: number }>;
  cards: Map<string, number>;
}

export interface PiecePlan {
  key: string;
  mode: PieceMode;
  // What the piece is (a rug is always a flat slab, whatever its photo).
  kind: WorldKind;
  shadow: boolean;
  // Metres, room space: centre of the footprint and height of the bottom edge.
  x: number;
  z: number;
  yBottom: number;
  w: number;
  h: number;
  d: number;
  modelId?: string;
  // Multiplies the model's own extents (metres) to reach its size in the room.
  modelScale?: [number, number, number];
  modelFit?: "exact" | "inside";
  cardUrl?: string;
  cardW?: number;
  cardH?: number;
  // Metres from the back wall to the card's plane.
  cardZ?: number;
  // "front": fixed, facing the front of the room; "camera": turns to face the viewer.
  facing?: "front" | "camera";
}

const M = (cm: number) => cm / 100;
const FALLBACK_HEIGHT_CM = 30;
// A card stands this far off the surface it is drawn on, so it never flickers into it.
const CARD_LIFT = 0.003;

export interface ModelFit {
  scale: [number, number, number];
  fit: "exact" | "inside";
}

// Scale a model (extents in metres) into a piece's box (metres; h null = unknown).
// Within the tolerance of the listing on every given axis: stretch to the exact
// listed size (the numbers are the truth). Further off: keep the model's shape and
// shrink it until it fits INSIDE the box.
export function fitModelToBox(
  model: { w: number; h: number; d: number },
  box: { w: number; h: number | null; d: number },
): ModelFit {
  const safe = (v: number) => Math.max(1e-3, v);
  const rx = box.w / safe(model.w);
  const rz = box.d / safe(model.d);
  const ry = box.h === null ? null : box.h / safe(model.h);
  const diffs = [Math.abs(model.w - box.w) / box.w, Math.abs(model.d - box.d) / box.d];
  if (box.h !== null) diffs.push(Math.abs(model.h - box.h) / box.h);
  if (Math.max(...diffs) <= MISMATCH_TOLERANCE) {
    // up to 5% is noise; up to 25% is still "the same product", so use the listed size
    return { scale: [rx, ry ?? (rx + rz) / 2, rz], fit: "exact" };
  }
  const s = Math.min(rx, rz, ry ?? Infinity);
  return { scale: [s, s, s], fit: "inside" };
}

// Re-exported so tests and callers see the one set of thresholds.
export { CLOSE_TOLERANCE, MISMATCH_TOLERANCE };

export function planPieces(world: World, ready: ReadyAssets): PiecePlan[] {
  return world.pieces.map((piece: WorldPiece): PiecePlan => {
    const item = piece.item;
    const w = M(piece.wCm);
    const d = M(piece.dCm);
    const h = M(piece.hCm ?? FALLBACK_HEIGHT_CM);
    const base: PiecePlan = {
      key: piece.key,
      mode: "block",
      kind: piece.kind,
      shadow: piece.kind === "standing",
      x: M(piece.xCm),
      z: M(piece.zCm),
      yBottom: M(piece.yBottomCm),
      w,
      h,
      d,
    };

    const modelExtent = item.model3d ? ready.models.get(item._id) : undefined;
    if (modelExtent) {
      const { scale, fit } = fitModelToBox(modelExtent, { w, h: piece.hCm === null ? null : h, d });
      return { ...base, mode: "model", modelId: item._id, modelScale: scale, modelFit: fit };
    }

    // a rug is a thin slab; its front-view photo says nothing about its top
    if (piece.kind === "rug") return base;

    const pictureUrl = pieceImageUrl(item);
    const aspect = pictureUrl ? ready.cards.get(pictureUrl) : undefined;
    if (!pictureUrl || !aspect) return base;

    const cardH = piece.hCm === null ? w / aspect : h;
    const common = { cardUrl: pictureUrl, cardW: w, cardH };

    if (piece.volume === "box") {
      return { ...base, ...common, mode: "block+card", facing: "front", cardZ: base.z + d / 2 + CARD_LIFT };
    }
    if (piece.volume === "billboard") {
      // round things look the same from every side: the photo keeps facing the viewer
      return { ...base, ...common, mode: "card", facing: "camera", cardZ: base.z };
    }
    if (piece.kind === "hung") {
      return { ...base, ...common, mode: "card", facing: "front", cardZ: d + CARD_LIFT };
    }
    return { ...base, ...common, mode: "card", facing: "front", cardZ: base.z + d / 2 + CARD_LIFT };
  });
}

export const drawsBlock = (plan: PiecePlan) => plan.mode === "block" || plan.mode === "block+card";
