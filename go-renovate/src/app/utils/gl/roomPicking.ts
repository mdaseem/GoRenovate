// Touching the 3D room: which piece is under a finger, and where on the floor a
// dragged piece should land. Pure maths, no browser.
//
// A tap on the screen is a line through the room (a RAY). Pieces are tested as
// boxes; the floor is the plane y = 0. Positions are converted back to the flat
// editor's numbers (x as % of the width, y as the % of the picture height where
// the piece's FRONT edge meets the floor), so moving a piece here moves it in the
// flat editor too — one arrangement, two views, nothing new to save.
import { Mat4, invert } from "./mat4";
import { PiecePlan } from "./roomPieces";
import {
  ScenePosition,
  clampPosition,
  wallElevationCm,
  yForWallElevation,
} from "../roomScene";
import { ResolvedScene } from "../sceneSpec";
import { Essential } from "@/app/types/category";

export interface Ray {
  origin: [number, number, number];
  direction: [number, number, number];
}

// Pixel (x, y from the canvas's top-left, in CSS px) → the ray through the room.
// `viewProjection` is the matrix the scene draws with.
export function screenRay(
  viewProjection: Mat4,
  x: number,
  y: number,
  width: number,
  height: number,
): Ray | null {
  const inverse = invert(viewProjection);
  if (!inverse || width <= 0 || height <= 0) return null;
  const ndcX = (x / width) * 2 - 1;
  const ndcY = 1 - (y / height) * 2;
  const unproject = (z: number): [number, number, number] => {
    const vx = inverse[0] * ndcX + inverse[4] * ndcY + inverse[8] * z + inverse[12];
    const vy = inverse[1] * ndcX + inverse[5] * ndcY + inverse[9] * z + inverse[13];
    const vz = inverse[2] * ndcX + inverse[6] * ndcY + inverse[10] * z + inverse[14];
    const vw = inverse[3] * ndcX + inverse[7] * ndcY + inverse[11] * z + inverse[15];
    return [vx / vw, vy / vw, vz / vw];
  };
  const near = unproject(-1);
  const far = unproject(1);
  const direction: [number, number, number] = [far[0] - near[0], far[1] - near[1], far[2] - near[2]];
  const length = Math.hypot(...direction);
  if (!Number.isFinite(length) || length === 0) return null;
  return { origin: near, direction: [direction[0] / length, direction[1] / length, direction[2] / length] };
}

// Distance along the ray to a box, or null when it misses (the "slab" method:
// the ray is inside the box where it is inside all three pairs of walls at once).
export function rayBox(
  ray: Ray,
  min: readonly [number, number, number],
  max: readonly [number, number, number],
): number | null {
  let near = -Infinity;
  let far = Infinity;
  for (let axis = 0; axis < 3; axis += 1) {
    const origin = ray.origin[axis];
    const direction = ray.direction[axis];
    if (Math.abs(direction) < 1e-9) {
      if (origin < min[axis] || origin > max[axis]) return null;
      continue;
    }
    const t1 = (min[axis] - origin) / direction;
    const t2 = (max[axis] - origin) / direction;
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (near > far) return null;
  }
  if (far < 0) return null;
  return near >= 0 ? near : far;
}

// Where the ray meets the horizontal plane at `height` (metres), as [x, z]; null
// when it never does (parallel, or the plane is behind the camera).
export function rayPlane(ray: Ray, height = 0): [number, number] | null {
  if (Math.abs(ray.direction[1]) < 1e-9) return null;
  const t = (height - ray.origin[1]) / ray.direction[1];
  if (t < 0) return null;
  return [ray.origin[0] + ray.direction[0] * t, ray.origin[2] + ray.direction[2] * t];
}

// Pieces that can be moved in the 3D room: standing furniture and rugs slide on the
// FLOOR, pieces hung on the wall slide across the BACK WALL (the one the flat room
// shows), and pieces hanging from the ceiling slide SIDEWAYS along it (the flat room
// gives them no depth, so they only ever move left and right). Resting pieces move
// with whatever they rest on.
export type MoveSurface = "floor" | "wall" | "ceiling";
export const moveSurfaceOf = (plan: PiecePlan): MoveSurface | null =>
  plan.kind === "standing" || plan.kind === "rug"
    ? "floor"
    : plan.kind === "hung"
      ? "wall"
      : plan.kind === "ceiling"
        ? "ceiling"
        : null;
export const isMovable = (plan: PiecePlan) => moveSurfaceOf(plan) !== null;

// A thin wall piece (a picture is 3 cm deep) is hard to hit from the side: its box
// reaches this far out from the wall so a tap near it still counts.
const WALL_PICK_REACH = 0.1;

// The nearest movable piece under the ray (its footprint box, floor to top), or null.
export function pickPiece(plans: PiecePlan[], ray: Ray): PiecePlan | null {
  let best: { plan: PiecePlan; t: number } | null = null;
  for (const plan of plans) {
    if (!isMovable(plan)) continue;
    const top = plan.yBottom + Math.max(plan.h, 0.02);
    const reach = plan.kind === "hung" ? WALL_PICK_REACH : 0;
    const t = rayBox(
      ray,
      [plan.x - plan.w / 2, plan.yBottom, plan.z - plan.d / 2],
      [plan.x + plan.w / 2, top, plan.z + plan.d / 2 + reach],
    );
    if (t !== null && (!best || t < best.t)) best = { plan, t };
  }
  return best?.plan ?? null;
}

// ── room ⇄ flat editor numbers ───────────────────────────────────────────────

export interface FloorFrame {
  widthCm: number;
  depthCm: number;
  // Where the wall meets the floor in the flat picture, % of its height (0–100).
  floorPct: number;
}

// The flat editor stores a standing piece's front edge as a % of the picture; the
// floor strip of that picture IS the room's depth (see roomWorld). So:
//   front z (cm from the back wall) = (y% − floor%) ÷ (100 − floor%) × depth.
export function floorToPosition(
  centreCm: { x: number; z: number },
  sizeCm: { d: number },
  frame: FloorFrame,
  base: ScenePosition,
): ScenePosition {
  const band = Math.max(1, 100 - frame.floorPct);
  const frontCm = centreCm.z + sizeCm.d / 2;
  return {
    ...base,
    x: (centreCm.x / frame.widthCm) * 100,
    y: frame.floorPct + (frontCm / frame.depthCm) * band,
  };
}

// Keep the whole footprint inside the room, and snap flush to a wall when within
// `snapCm` of it (so a piece slides up to a wall instead of stopping a hair short).
export function clampToRoom(
  centreCm: { x: number; z: number },
  sizeCm: { w: number; d: number },
  frame: FloorFrame,
  snapCm = 4,
): { x: number; z: number } {
  const halfW = Math.min(sizeCm.w / 2, frame.widthCm / 2);
  const halfD = Math.min(sizeCm.d / 2, frame.depthCm / 2);
  let x = Math.min(frame.widthCm - halfW, Math.max(halfW, centreCm.x));
  let z = Math.min(frame.depthCm - halfD, Math.max(halfD, centreCm.z));
  if (x - halfW < snapCm) x = halfW;
  if (frame.widthCm - (x + halfW) < snapCm) x = frame.widthCm - halfW;
  if (z - halfD < snapCm) z = halfD;
  if (frame.depthCm - (z + halfD) < snapCm) z = frame.depthCm - halfD;
  return { x, z };
}

// The other way round: where a flat-editor position puts a standing piece on the
// floor (its centre, cm). The same rule the 3D room is built with (roomWorld): the
// front edge is at y, the piece is `d` deep, and it can never reach back past the wall.
export function positionToFloor(
  position: Pick<ScenePosition, "x" | "y">,
  sizeCm: { d: number },
  frame: FloorFrame,
): { x: number; z: number } {
  const band = Math.max(1, 100 - frame.floorPct);
  const frontCm = Math.min(1, Math.max(0, (position.y - frame.floorPct) / band)) * frame.depthCm;
  return {
    x: (position.x / 100) * frame.widthCm,
    z: Math.max(sizeCm.d / 2, frontCm - sizeCm.d / 2),
  };
}

// ── pieces hung on the back wall ─────────────────────────────────────────────

// Where the ray meets the vertical plane z = `depth` (metres from the back wall),
// as [x, y] — across and up the wall. null when parallel or behind the camera.
export function rayWall(ray: Ray, depth: number): [number, number] | null {
  if (Math.abs(ray.direction[2]) < 1e-9) return null;
  const t = (depth - ray.origin[2]) / ray.direction[2];
  if (t < 0) return null;
  return [ray.origin[0] + ray.direction[0] * t, ray.origin[1] + ray.direction[1] * t];
}

export interface WallSpot {
  x: number; // centre, cm from the left wall
  elevation: number; // centre, cm above the floor
}

// Keep a wall piece's whole face on the wall: inside left / right and between the
// floor and the ceiling.
export function clampToWall(
  spot: WallSpot,
  sizeCm: { w: number; h: number },
  room: { widthCm: number; heightCm: number },
): WallSpot {
  const halfW = Math.min(sizeCm.w / 2, room.widthCm / 2);
  const halfH = Math.min(sizeCm.h / 2, room.heightCm / 2);
  return {
    x: Math.min(room.widthCm - halfW, Math.max(halfW, spot.x)),
    elevation: Math.min(room.heightCm - halfH, Math.max(halfH, spot.elevation)),
  };
}

// The flat editor stores a wall piece as its centre x (% of the width) and its TOP
// edge y (% of the picture height); `yForWallElevation` is the editor's own
// conversion from "centre this many cm above the floor".
export function wallToPosition(
  spot: WallSpot,
  item: Essential,
  scene: ResolvedScene,
  base: ScenePosition,
): ScenePosition {
  const raw: ScenePosition = {
    ...base,
    x: (spot.x / scene.sceneWidthCm) * 100,
    y: yForWallElevation(item, spot.elevation, scene, base.scale ?? 1),
  };
  // the flat editor's own limits (between the ceiling and the baseboard) have the last word
  return { ...raw, ...clampPosition(raw, item, scene) };
}

// …and back: where a flat-editor position puts the piece on the wall.
export function positionToWall(position: ScenePosition, item: Essential, scene: ResolvedScene): WallSpot {
  return {
    x: (position.x / 100) * scene.sceneWidthCm,
    elevation: wallElevationCm(item, position, scene),
  };
}

// ── pieces hanging from the ceiling ──────────────────────────────────────────

// Keep a ceiling piece's whole width between the side walls.
export function clampAlongCeiling(xCm: number, widthCm: number, room: { widthCm: number }): number {
  const half = Math.min(widthCm / 2, room.widthCm / 2);
  return Math.min(room.widthCm - half, Math.max(half, xCm));
}

// The flat editor stores a ceiling piece as its centre x (% of the width) and a height
// that is always 0 (it hangs from the ceiling and never moves down). Only x changes;
// `clampPosition` has the last word, as for every other piece.
export function ceilingToPosition(
  xCm: number,
  item: Essential,
  scene: ResolvedScene,
  base: ScenePosition,
): ScenePosition {
  const raw: ScenePosition = { ...base, x: (xCm / scene.sceneWidthCm) * 100 };
  return { ...raw, ...clampPosition(raw, item, scene) };
}

// …and back: where a flat-editor position puts the piece along the ceiling (cm from the left wall).
export const positionToCeiling = (position: Pick<ScenePosition, "x">, scene: ResolvedScene): number =>
  (position.x / 100) * scene.sceneWidthCm;
