import { useCallback, useEffect, useRef } from "react";
import { RoomMesh } from "@/app/utils/gl/roomMesh";
import { PiecePlan } from "@/app/utils/gl/roomPieces";
import {
  WALK_STEP,
  WalkPose,
  eyeHeight,
  forwardOf,
  pieceObstacles,
  resolveMove,
  rightOf,
  startPose,
} from "@/app/utils/gl/roomWalk";

const WALK_MS = 350; // a step glides rather than jumps

// Where the person standing in the 3D room is, and how they get somewhere else:
// a step in a direction or a tap on the floor glides there (never through a wall
// or a piece of furniture). The pose lives in a ref — it changes every frame while
// gliding and must not re-render React; the component's frame loop asks `advance`.
export function useWalkPose(mesh: RoomMesh, plan: PiecePlan[], requestFrame: () => void) {
  const pose = useRef<WalkPose>({ x: mesh.width / 2, z: mesh.depth - 0.7 });
  const glide = useRef<{ from: WalkPose; to: WalkPose; start: number } | null>(null);
  const room = useRef({ width: mesh.width, depth: mesh.depth, height: mesh.height });
  const obstacles = useRef(pieceObstacles(plan).concat(mesh.obstacles));

  // The room or its furniture changed: keep the person inside the room and out of a
  // piece that has just been put where they stand.
  useEffect(() => {
    room.current = { width: mesh.width, depth: mesh.depth, height: mesh.height };
    obstacles.current = pieceObstacles(plan).concat(mesh.obstacles);
    pose.current = resolveMove(pose.current, pose.current, room.current, obstacles.current);
    glide.current = null;
    requestFrame();
  }, [mesh, plan, requestFrame]);

  const moveTo = useCallback(
    (target: WalkPose) => {
      const to = resolveMove(pose.current, target, room.current, obstacles.current);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        pose.current = to;
        glide.current = null;
      } else {
        glide.current = { from: pose.current, to, start: performance.now() };
      }
      requestFrame();
    },
    [requestFrame],
  );

  // One step: `forward` metres ahead of where they face (negative = back) and
  // `right` metres to their right (negative = left).
  const step = useCallback(
    (yaw: number, forward: number, right: number) => {
      // aim from where they are heading, so quick repeated presses add up
      const origin = glide.current?.to ?? pose.current;
      const [fx, fz] = forwardOf(yaw);
      const [rx, rz] = rightOf(yaw);
      moveTo({ x: origin.x + fx * forward + rx * right, z: origin.z + fz * forward + rz * right });
    },
    [moveTo],
  );

  const reset = useCallback(() => {
    pose.current = startPose(room.current, obstacles.current);
    glide.current = null;
    requestFrame();
  }, [requestFrame]);

  // Called once per frame by the component's loop; true while a glide is still going.
  const advance = useCallback((now: number): boolean => {
    const g = glide.current;
    if (!g) return false;
    const t = Math.min(1, (now - g.start) / WALK_MS);
    const eased = 1 - (1 - t) * (1 - t);
    pose.current = { x: g.from.x + (g.to.x - g.from.x) * eased, z: g.from.z + (g.to.z - g.from.z) * eased };
    if (t >= 1) glide.current = null;
    return t < 1;
  }, []);

  return {
    pose,
    eye: eyeHeight(mesh.height),
    step,
    moveTo,
    reset,
    advance,
    stepSize: WALK_STEP,
  };
}
