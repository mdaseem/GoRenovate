// Standing inside the 3D room. Pure maths, no browser.
//
// The camera is a person: a spot on the floor (x, z, metres), an eye height, and
// the two angles the camera hook already tracks — yaw (turning) and pitch (looking
// up or down). Dragging the picture "drags the world": drag right and what is in
// front slides right, so the view turns LEFT; drag down and you look UP. That is
// why the angles are negated when they become a view matrix.
//
// Walking stays inside the room and cannot pass through furniture: the person is
// a circle on the floor (WALK_RADIUS) and anything standing is a box, so a step
// that would end inside a box is pushed back out along the shortest way.
import { Mat4, multiply, rotationX, rotationY, translation } from "./mat4";
import { PiecePlan } from "./roomPieces";

export interface WalkPose {
  x: number; // metres from the left wall
  z: number; // metres from the back wall
}

export interface FloorBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WalkRoom {
  width: number;
  depth: number;
  height: number;
}

// A comfortable personal space: about a shoulder's width either side.
export const WALK_RADIUS = 0.25;
// One press of Forward / Back / Step.
export const WALK_STEP = 0.4;
// Vertical field of view when standing: wider than the dollhouse, like a phone camera.
export const WALK_FOV = (68 * Math.PI) / 180;
// Pieces lower than this (a rug, a mat) are walked over, not around.
const MIN_OBSTACLE_HEIGHT = 0.12;

// Eye height: a standing adult's, but never above what a low ceiling allows.
export const eyeHeight = (roomHeight: number) => Math.min(1.5, roomHeight * 0.6);

// Which way the person faces on the floor, as (x, z), for a yaw. At yaw 0 they
// face the back wall (−z); positive yaw turns the view to the right.
export const forwardOf = (yaw: number): [number, number] => [-Math.sin(yaw), -Math.cos(yaw)];
// …and the way their right hand points.
export const rightOf = (yaw: number): [number, number] => [Math.cos(yaw), -Math.sin(yaw)];

// The view matrix for a person: move the world so their eyes are at the origin,
// then turn it the opposite way to their head.
export function walkView(pose: WalkPose, eye: number, yaw: number, pitch: number): Mat4 {
  return multiply(rotationX(-pitch), multiply(rotationY(-yaw), translation(-pose.x, -eye, -pose.z)));
}

// Standing furniture as boxes on the floor (rugs and mats are walked over).
export function pieceObstacles(plans: PiecePlan[]): FloorBox[] {
  return plans
    .filter((plan) => plan.kind === "standing" && plan.h >= MIN_OBSTACLE_HEIGHT)
    .map((plan) => ({
      minX: plan.x - plan.w / 2,
      maxX: plan.x + plan.w / 2,
      minZ: plan.z - plan.d / 2,
      maxZ: plan.z + plan.d / 2,
    }));
}

// Keep a person's spot inside the room and out of every box. The step is cut into
// pieces of at most 10 cm so a long move cannot jump clean through a thin piece.
export function resolveMove(
  from: WalkPose,
  to: WalkPose,
  room: WalkRoom,
  boxes: FloorBox[],
  radius = WALK_RADIUS,
): WalkPose {
  const place = (p: WalkPose): WalkPose => {
    let x = Math.min(room.width - radius, Math.max(radius, p.x));
    let z = Math.min(room.depth - radius, Math.max(radius, p.z));
    for (let pass = 0; pass < 3; pass += 1) {
      for (const box of boxes) {
        const minX = box.minX - radius;
        const maxX = box.maxX + radius;
        const minZ = box.minZ - radius;
        const maxZ = box.maxZ + radius;
        if (x <= minX || x >= maxX || z <= minZ || z >= maxZ) continue;
        // inside the padded box: leave by the closest side that is still inside the room
        // (a box running wall to wall can only be left the other way)
        const options = [
          { d: x - minX, axis: "x" as const, to: minX },
          { d: maxX - x, axis: "x" as const, to: maxX },
          { d: z - minZ, axis: "z" as const, to: minZ },
          { d: maxZ - z, axis: "z" as const, to: maxZ },
        ]
          .filter((option) =>
            option.axis === "x"
              ? option.to >= radius && option.to <= room.width - radius
              : option.to >= radius && option.to <= room.depth - radius,
          )
          .sort((first, second) => first.d - second.d);
        const out = options[0];
        if (out) {
          if (out.axis === "x") x = out.to;
          else z = out.to;
        }
      }
      x = Math.min(room.width - radius, Math.max(radius, x));
      z = Math.min(room.depth - radius, Math.max(radius, z));
    }
    return { x, z };
  };

  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.max(1, Math.ceil(distance / 0.1));
  let current = place(from);
  for (let i = 1; i <= steps; i += 1) {
    current = place({
      x: current.x + (to.x - from.x) / steps,
      z: current.z + (to.z - from.z) / steps,
    });
  }
  return current;
}

// How far someone at (x, z) can walk straight toward the back wall before something
// stops them (a piece of furniture, or the wall): metres.
export function runAhead(from: WalkPose, boxes: FloorBox[], radius = WALK_RADIUS): number {
  let stop = radius; // the back wall
  for (const box of boxes) {
    const overlapsLane = from.x > box.minX - radius && from.x < box.maxX + radius;
    const inFront = box.maxZ + radius <= from.z + 1e-9;
    if (overlapsLane && inFront) stop = Math.max(stop, box.maxZ + radius);
  }
  return from.z - stop;
}

// Where someone first stands: just inside the front of the room, in the middle,
// looking at the back wall — or, if furniture is right in front of that spot, the
// nearest spot along the front of the room with a clear way ahead (so the first
// step is never into a chair).
export function startPose(room: WalkRoom, boxes: FloorBox[]): WalkPose {
  const clearRun = Math.min(1.0, room.depth * 0.3);
  const ideal = { x: room.width / 2, z: room.depth - 0.7 };
  const candidates: WalkPose[] = [];
  for (let dz = 0; dz <= 0.6; dz += 0.2) {
    for (let dx = 0; dx <= room.width / 2 - WALK_RADIUS; dx += 0.25) {
      candidates.push({ x: ideal.x + dx, z: ideal.z + dz }, { x: ideal.x - dx, z: ideal.z + dz });
    }
  }
  let best: WalkPose | null = null;
  for (const candidate of candidates) {
    const spot = resolveMove(candidate, candidate, room, boxes);
    // resolved onto itself = it was already a free spot (not pushed out of a piece)
    if (Math.abs(spot.x - candidate.x) > 1e-6 || Math.abs(spot.z - candidate.z) > 1e-6) continue;
    if (runAhead(spot, boxes) >= clearRun) return spot;
    if (!best) best = spot;
  }
  return best ?? resolveMove(ideal, ideal, room, boxes);
}
