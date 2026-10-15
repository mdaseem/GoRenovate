// The room as a 3D scene, for the "Look around" view (see the room-visual-preview
// skill, "Look around — design").
//
// The editor is a FRONT elevation: a piece has a left-right position and a
// height, and "depth" is only which piece is drawn on top. Looking around needs
// real depth, so this module turns the finished flat arrangement (auto layout +
// the user's drags + resting pieces) into positions in centimetres:
//
//   x  from the left wall, →            (0 … room width)
//   y  up from the floor, ↑             (0 … ceiling height)
//   z  from the BACK wall toward you, ⤢ (0 … room depth)
//
// Nothing is stored: depth is DERIVED, so no saved design or share link changes.
// The depth rule is an assumption, documented in the skill: the floor strip of
// the flat view (floor line → bottom of the picture) becomes the room's depth.

import { ResolvedScene } from "./sceneSpec";
import {
  FALLBACK_WIDTH_CM,
  SURFACE_SINK_PCT,
  ScenePiece,
  ScenePosition,
  ScenePositions,
  computeAutoLayout,
  getPlacement,
  getSpaceSupports,
  keyOf,
  surfaceRestY,
  wallElevationCm,
} from "./roomScene";

// A piece with no depth on file is drawn this deep; one with no height, this tall.
const FALLBACK_DEPTH_CM = 40;
const FALLBACK_HEIGHT_CM = 30;
// Wall pieces are this thick if the product doesn't say.
const WALL_THICKNESS_CM = 4;
// A piece resting on a counter / shelf of the room sits this far from the wall.
const FIXED_SUPPORT_Z_CM = 30;
// Ceiling pieces hang this far into the room (share of the depth).
const CEILING_Z_SHARE = 0.35;

export type WorldKind = "standing" | "hung" | "ceiling" | "rug" | "resting";

// How a piece gets thickness when the room is turned (phase 2):
//   box       — solid furniture (wardrobe, cabinet, vanity, bedside unit): the photo
//               is the front, with side and top faces in shades of its colour;
//   billboard — round things (lamps, plants, vases, pendants): they look the same
//               from every side, so the photo is simply kept facing the viewer;
//   flat      — everything else: sofas and beds (the tall part is only the
//               headboard / backrest), tables and chairs (legs), rugs, wall pieces.
//               They keep their real position and depth, but stay photo cards.
// Giving a front photo depth by stacking copies ("extruding the silhouette") was
// tried and rejected: table legs become planks and chair backs become crates.
export type WorldVolume = "box" | "billboard" | "flat";

// Slots whose products are (close to) solid blocks from front to back.
const BOX_SLOTS = new Set(["wardrobe", "storage", "vanity", "bedside-table"]);
// Slots whose products are round or radially symmetric: a photo that always faces
// the viewer is correct from every angle.
const ROUND_SLOTS = new Set(["lighting", "decor", "accessories", "countertop"]);

export interface WorldPiece {
  key: string;
  item: ScenePiece;
  kind: WorldKind;
  // Centre of the piece's footprint / face, in cm (see the header).
  xCm: number;
  zCm: number;
  // Height of the piece's BOTTOM edge above the floor, cm.
  yBottomCm: number;
  wCm: number;
  // null = the product has no height: the picture keeps its own proportions.
  hCm: number | null;
  dCm: number;
  flipped: boolean;
  volume: WorldVolume;
}

export interface World {
  widthCm: number;
  heightCm: number; // ceiling height
  depthCm: number;
  pieces: WorldPiece[];
}

// Thickness style for a piece (needs a known height: the card must have a real
// box to extrude).
export function volumeOf(piece: Pick<WorldPiece, "kind" | "item" | "hCm">): WorldVolume {
  if (piece.hCm === null) return "flat";
  if (piece.kind === "resting") return "billboard";
  if (piece.kind === "ceiling") return piece.item.slot === "lighting" ? "billboard" : "flat";
  if (piece.kind === "standing") {
    if (ROUND_SLOTS.has(piece.item.slot)) return "billboard";
    return BOX_SLOTS.has(piece.item.slot) ? "box" : "flat";
  }
  return "flat";
}

// How deep the room is for the 3D views: a share of its width, kept sensible —
// unless the person typed their real room depth.
export const MIN_ROOM_DEPTH_CM = 150;
export const MAX_ROOM_DEPTH_CM = 1200;
export function roomDepthCm(scene: ResolvedScene, overrideCm?: number | null): number {
  if (overrideCm) return Math.round(Math.min(MAX_ROOM_DEPTH_CM, Math.max(MIN_ROOM_DEPTH_CM, overrideCm)));
  return Math.round(Math.min(450, Math.max(250, scene.sceneWidthCm * 0.75)));
}

const sizeOf = (item: ScenePiece, scale: number) => {
  const dims = item.dimensionsCm;
  const w = (dims?.w ?? FALLBACK_WIDTH_CM) * scale;
  return {
    w,
    h: dims?.h !== undefined ? dims.h * scale : null,
    d: dims?.d !== undefined ? Math.max(1, dims.d * scale) : Math.min(FALLBACK_DEPTH_CM, w),
  };
};

export function buildWorld(
  items: ScenePiece[],
  scene: ResolvedScene,
  layout: ScenePositions = {},
  depthOverrideCm?: number | null,
): World {
  const widthCm = scene.sceneWidthCm;
  const heightCm = scene.ceilingHeightCm;
  const depthCm = roomDepthCm(scene, depthOverrideCm);
  const floorPct = scene.spec.floorLine * 100;
  const bandPct = 100 - floorPct;
  const pctToCmX = (pct: number) => (pct / 100) * widthCm;

  const auto = computeAutoLayout(items, scene);
  const settled = (item: ScenePiece): ScenePosition => layout[keyOf(item)] ?? auto[keyOf(item)];
  const spaceSupports = getSpaceSupports(scene);

  // Distance from the back wall to the FRONT edge of something standing at flat-y.
  const frontZ = (yPct: number) =>
    Math.min(1, Math.max(0, (yPct - floorPct) / bandPct)) * depthCm;

  const placed = new Map<string, WorldPiece>();
  const place = (piece: Omit<WorldPiece, "volume">) =>
    placed.set(piece.key, { ...piece, volume: volumeOf(piece) });

  const standingAt = (item: ScenePiece, position: ScenePosition, kind: WorldKind, yBottomCm = 0) => {
    const size = sizeOf(item, position.scale ?? 1);
    // The flat view anchors a standing piece's BOTTOM edge at y: that is its front edge.
    const zCm = Math.max(size.d / 2, frontZ(position.y) - size.d / 2);
    place({
      key: keyOf(item),
      item,
      kind,
      xCm: pctToCmX(position.x),
      zCm,
      yBottomCm,
      wCm: size.w,
      hCm: size.h,
      dCm: size.d,
      flipped: Boolean(position.flipped),
    });
  };

  // 1) everything that does not rest on something else.
  for (const item of items) {
    const position = settled(item);
    const { zone, layer } = getPlacement(item, scene);
    if (zone === "floor") {
      standingAt(item, position, layer === 0 ? "rug" : "standing");
    } else if (zone === "wall") {
      const size = sizeOf(item, position.scale ?? 1);
      const hCm = size.h ?? FALLBACK_HEIGHT_CM;
      const elevation = wallElevationCm(item, position, scene);
      const dCm = item.dimensionsCm?.d !== undefined ? size.d : WALL_THICKNESS_CM;
      place({
        key: keyOf(item),
        item,
        kind: "hung",
        xCm: pctToCmX(position.x),
        zCm: dCm / 2,
        yBottomCm: Math.max(0, elevation - hCm / 2),
        wCm: size.w,
        hCm: size.h,
        dCm,
        flipped: Boolean(position.flipped),
      });
    } else if (zone === "ceiling") {
      const size = sizeOf(item, position.scale ?? 1);
      const hCm = size.h ?? FALLBACK_HEIGHT_CM;
      place({
        key: keyOf(item),
        item,
        kind: "ceiling",
        xCm: pctToCmX(position.x),
        zCm: depthCm * CEILING_Z_SHARE,
        yBottomCm: Math.max(0, heightCm - hCm),
        wCm: size.w,
        hCm: size.h,
        dCm: size.d,
        flipped: Boolean(position.flipped),
      });
    }
  }

  // 2) resting pieces sit on the top of a piece, or of a counter / shelf.
  for (const item of items) {
    if (getPlacement(item, scene).zone !== "surface") continue;
    const position = settled(item);
    const size = sizeOf(item, position.scale ?? 1);
    const dxCm = pctToCmX(position.dx ?? 0);
    const parent = position.onKey ? placed.get(position.onKey) : undefined;
    const fixed = position.onKey ? spaceSupports.find((s) => s.key === position.onKey) : undefined;

    if (parent) {
      place({
        key: keyOf(item),
        item,
        kind: "resting",
        xCm: parent.xCm + dxCm,
        zCm: parent.zCm,
        yBottomCm: parent.yBottomCm + (parent.hCm ?? 0),
        wCm: size.w,
        hCm: size.h,
        dCm: size.d,
        flipped: Boolean(position.flipped),
      });
    } else if (fixed) {
      // The flat view stores the top as a % of the picture height: back to cm.
      const topCm = ((floorPct - (fixed.topY - SURFACE_SINK_PCT)) / 100) * scene.heightCm;
      place({
        key: keyOf(item),
        item,
        kind: "resting",
        xCm: pctToCmX(fixed.x) + dxCm,
        zCm: FIXED_SUPPORT_Z_CM,
        yBottomCm: Math.max(0, topCm),
        wCm: size.w,
        hCm: size.h,
        dCm: size.d,
        flipped: Boolean(position.flipped),
      });
    } else {
      // Its support is gone: it stands on the floor row, like in the flat view.
      standingAt(item, { ...position, y: surfaceRestY(scene) }, "standing");
    }
  }

  return {
    widthCm,
    heightCm,
    depthCm,
    pieces: items.map((item) => placed.get(keyOf(item))).filter((p): p is WorldPiece => Boolean(p)),
  };
}
