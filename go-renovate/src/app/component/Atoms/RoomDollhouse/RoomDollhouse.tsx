"use client";
import React, { useCallback, useEffect, useRef } from "react";
import styles from "./RoomDollhouse.module.css";
import { RoomMesh } from "@/app/utils/gl/roomMesh";
import { PiecePlan } from "@/app/utils/gl/roomPieces";
import { moveSurfaceOf, pickPiece, rayPlane, rayWall, screenRay } from "@/app/utils/gl/roomPicking";
import { DollhouseScene, createDollhouseScene } from "@/app/utils/gl/dollhouseScene";
import { RoomAssets } from "../../CustomHooks/useRoomAssets";
import { useGLCanvas } from "../../CustomHooks/useGLCanvas";
import { useWalkPose } from "../../CustomHooks/useWalkPose";
import { WALK_STEP } from "@/app/utils/gl/roomWalk";
import { ZOOM_STEP, useOrbitCamera } from "../../CustomHooks/useOrbitCamera";

// The room seen from above and a little in front, with the near walls cut away.
const START_VIEW = { yaw: -0.5, pitch: 0.7, zoom: 1 };
const MIN_PITCH = 0.12; // never flat on: the floor must stay visible
const MAX_PITCH = 1.35; // nearly straight down
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3;
const QUARTER_TURN = Math.PI / 4; // the turn buttons: 45° each
// Standing inside: look straight at the back wall, level, with a wider lens that can narrow a little.
const INSIDE_VIEW = { yaw: 0, pitch: 0, zoom: 1 };
const KEY_TURN = 0.12; // radians per arrow-key press (the same as the camera hook's)
const INSIDE_MAX_PITCH = 0.9; // about 50° up or down
const INSIDE_MIN_ZOOM = 0.8;
const INSIDE_MAX_ZOOM = 2.5;

export type RoomViewMode = "dollhouse" | "inside";

// The 3D room ("dollhouse"). React owns the element and the buttons; the room's
// triangles come from utils/gl/roomMesh and are drawn by utils/gl/dollhouseScene.
// The loop only runs while the view is moving AND on screen, like the product viewer.
export default function RoomDollhouse({
  mesh,
  label,
  assets,
  plan,
  onAssetError,
  movable = false,
  onSelect,
  onMove,
  mode = "dollhouse",
}: {
  mesh: RoomMesh;
  label: string;
  // The pictures and 3D models that have arrived so far, and how each piece uses them.
  assets: RoomAssets;
  plan: PiecePlan[];
  // A picture or model the graphics card refused: the caller stops counting it as ready.
  onAssetError?: (kind: "card" | "model", id: string) => void;
  // Moving pieces: with `movable`, pressing a piece selects it and dragging slides it
  // (a standing piece along the floor, a hung one across the back wall, a hanging one
  // sideways along the ceiling); pressing
  // anything else turns the room, and a tap on empty space deselects. `onMove` gets
  // the piece's new CENTRE in cm — x and z on the floor for a standing piece; x and y
  // (height above the floor) on the wall for a hung one — not yet kept inside the
  // room (the caller decides), "drag" while moving and "end" once on release.
  movable?: boolean;
  onSelect?: (key: string | null) => void;
  onMove?: (key: string, centreCm: { x: number; z: number; y?: number }, phase: "drag" | "end") => void;
  // "dollhouse": the room seen from outside with the near walls cut away.
  // "inside": the person stands in it (tap the floor or use the buttons to walk,
  // drag to look). Pieces cannot be moved from inside.
  mode?: RoomViewMode;
}) {
  const inside = mode === "inside";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DollhouseScene | null>(null);
  const meshRef = useRef(mesh);
  const assetsRef = useRef(assets);
  const planRef = useRef(plan);
  const onAssetErrorRef = useRef(onAssetError);
  const onSelectRef = useRef(onSelect);
  const onMoveRef = useRef(onMove);
  // The piece being dragged: where on the floor it was grabbed, and the last position.
  const dragRef = useRef<{
    key: string;
    surface: "floor" | "wall" | "ceiling";
    // the wall piece's front face, metres from the back wall (where its drag plane is)
    planeZ: number;
    // a ceiling piece is dragged in the horizontal plane through its middle (metres up)
    planeY: number;
    // where on the surface it was grabbed, relative to its centre: [across, down-the-floor or up-the-wall]
    grab: [number, number];
    // a wall piece keeps its depth; a floor piece keeps its height (none)
    z: number;
    startX: number;
    startY: number;
    moved: boolean;
    last: { x: number; z: number; y?: number } | null;
    frame: number;
  } | null>(null);
  // What is already on the graphics card, so each file is uploaded once.
  const uploaded = useRef({ models: new Set<string>(), cards: new Set<string>() });
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const tickRef = useRef<FrameRequestCallback>(() => {});
  const insideRef = useRef(inside);

  const requestFrame = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame((time) => tickRef.current(time));
  }, []);

  useEffect(() => {
    insideRef.current = inside;
    requestFrame();
  }, [inside, requestFrame]);

  // The camera numbers the next frame is drawn with (standing inside adds the person).
  const currentView = () =>
    insideRef.current
      ? { ...camera.current, walk: { x: walk.pose.current.x, z: walk.pose.current.z, eye: walk.eye } }
      : camera.current;

  // A press on the canvas as a ray through the room (null if the room is not up yet).
  const rayAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return null;
    const rect = canvas.getBoundingClientRect();
    // the same camera the picture is drawn with, so a tap lands where the finger is
    const matrix = scene.viewProjection({ width: canvas.width, height: canvas.height, ...currentView() });
    return screenRay(matrix, event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
  };

  const orbit = useOrbitCamera({
    initial: inside ? INSIDE_VIEW : START_VIEW,
    minPitch: inside ? -INSIDE_MAX_PITCH : MIN_PITCH,
    maxPitch: inside ? INSIDE_MAX_PITCH : MAX_PITCH,
    minZoom: inside ? INSIDE_MIN_ZOOM : MIN_ZOOM,
    maxZoom: inside ? INSIDE_MAX_ZOOM : MAX_ZOOM,
    canvasRef,
    requestFrame,
    intercept: movable && !inside
      ? {
          down: (event) => {
            const ray = rayAt(event);
            const hit = ray ? pickPiece(planRef.current, ray) : null;
            if (!ray || !hit) return false;
            const surface = moveSurfaceOf(hit) ?? "floor";
            const planeZ = hit.z + hit.d / 2;
            const planeY = hit.yBottom + hit.h / 2;
            const grabbed = surface === "wall" ? rayWall(ray, planeZ) : rayPlane(ray, surface === "ceiling" ? planeY : 0);
            const centre: [number, number] = surface === "wall" ? [hit.x, planeY] : [hit.x, hit.z];
            dragRef.current = {
              key: hit.key,
              surface,
              planeZ,
              planeY,
              z: hit.z,
              grab: grabbed ? [grabbed[0] - centre[0], grabbed[1] - centre[1]] : [0, 0],
              startX: event.clientX,
              startY: event.clientY,
              moved: false,
              last: null,
              frame: 0,
            };
            onSelectRef.current?.(hit.key);
            return true;
          },
          move: (event) => {
            const drag = dragRef.current;
            if (!drag) return;
            // a press that barely moved is a tap on the piece, not a drag
            if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
            drag.moved = true;
            const ray = rayAt(event);
            const spot = ray
              ? drag.surface === "wall"
                ? rayWall(ray, drag.planeZ)
                : rayPlane(ray, drag.surface === "ceiling" ? drag.planeY : 0)
              : null;
            if (!spot) return;
            drag.last =
              drag.surface === "wall"
                ? { x: (spot[0] - drag.grab[0]) * 100, z: drag.z * 100, y: (spot[1] - drag.grab[1]) * 100 }
                : drag.surface === "ceiling"
                  ? { x: (spot[0] - drag.grab[0]) * 100, z: drag.z * 100 } // sideways only: its depth is fixed
                  : { x: (spot[0] - drag.grab[0]) * 100, z: (spot[1] - drag.grab[1]) * 100 };
            // at most one update per frame, however fast the pointer moves
            if (!drag.frame) {
              drag.frame = requestAnimationFrame(() => {
                drag.frame = 0;
                if (drag.last) onMoveRef.current?.(drag.key, drag.last, "drag");
              });
            }
          },
          up: () => {
            const drag = dragRef.current;
            dragRef.current = null;
            if (!drag) return;
            if (drag.frame) cancelAnimationFrame(drag.frame);
            if (drag.moved && drag.last) onMoveRef.current?.(drag.key, drag.last, "end");
          },
        }
      : undefined,
    onTap: (event) => {
      if (!inside) {
        if (movable) onSelectRef.current?.(null);
        return;
      }
      // inside: a tap on the floor walks there
      const ray = rayAt(event);
      const floor = ray ? rayPlane(ray, 0) : null;
      if (floor) walk.moveTo({ x: floor[0], z: floor[1] });
    },
  });
  const { camera, coast } = orbit;
  const walk = useWalkPose(mesh, plan, requestFrame);
  const sectionRef = useRef<HTMLElement>(null);

  // Changing between the two views: start the new one from its own starting view.
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    if (mode === "inside") walk.reset();
    orbit.setView(mode === "inside" ? INSIDE_VIEW : START_VIEW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Bring the graphics card up to date with the assets and the plan: upload what
  // arrived, drop what left, and tell the scene how each piece is drawn.
  const syncAssets = useCallback(
    (scene: DollhouseScene) => {
      const { models, cards } = assetsRef.current;
      const up = uploaded.current;
      models.forEach((loaded, id) => {
        if (up.models.has(id)) return;
        up.models.add(id);
        try {
          scene.setModel(id, loaded.model, loaded.bitmaps);
        } catch {
          scene.removeModel(id);
          onAssetErrorRef.current?.("model", id);
        }
      });
      [...up.models].forEach((id) => {
        if (models.has(id)) return;
        scene.removeModel(id);
        up.models.delete(id);
      });
      cards.forEach((canvas, url) => {
        if (up.cards.has(url)) return;
        up.cards.add(url);
        try {
          scene.setCard(url, canvas);
        } catch {
          scene.removeCard(url);
          onAssetErrorRef.current?.("card", url);
        }
      });
      [...up.cards].forEach((url) => {
        if (cards.has(url)) return;
        scene.removeCard(url);
        up.cards.delete(url);
      });
      scene.setPlan(planRef.current);
      requestFrame();
    },
    [requestFrame],
  );

  // (Re)build the GPU copy of the room; the old one is released first.
  const attachScene = useCallback(
    (gl: WebGL2RenderingContext | null) => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
      uploaded.current = { models: new Set(), cards: new Set() };
      if (!gl) return;
      const scene = createDollhouseScene(gl, meshRef.current);
      sceneRef.current = scene;
      syncAssets(scene);
    },
    [syncAssets],
  );

  const { status, message, visibleRef, reportError } = useGLCanvas(canvasRef, requestFrame, {
    attach: attachScene,
    onContextLost: () => {
      sceneRef.current = null;
    },
    onTeardown: () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    },
    cancelFrame: () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    },
  });

  // One frame; asks for the next only while a flick is still coasting on screen.
  const tick = useCallback(
    (time: number) => {
      frameRef.current = 0;
      const elapsed = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;
      const active = visibleRef.current && !document.hidden;
      const coasting = coast(Math.min(elapsed, 0.1), active);
      const gliding = insideRef.current && walk.advance(performance.now());
      const canvas = canvasRef.current;
      if (canvas && sceneRef.current) {
        sceneRef.current.draw({ width: canvas.width, height: canvas.height, ...currentView() });
        // where the person stands, in cm (read by tests and handy for debugging)
        if (insideRef.current && sectionRef.current) {
          sectionRef.current.dataset.walk = `${Math.round(walk.pose.current.x * 100)},${Math.round(walk.pose.current.z * 100)}`;
        }
      }
      if (coasting || gliding) frameRef.current = requestAnimationFrame(tick);
      else lastTimeRef.current = 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camera, coast, visibleRef, walk],
  );
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // The room changed (a piece moved, a colour or the depth was edited): swap the
  // room mesh only — models and photos already on the card stay where they are.
  useEffect(() => {
    onAssetErrorRef.current = onAssetError;
    onSelectRef.current = onSelect;
    onMoveRef.current = onMove;
  });
  useEffect(() => {
    if (meshRef.current === mesh) return;
    meshRef.current = mesh;
    try {
      sceneRef.current?.setMesh(mesh);
      requestFrame();
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Unknown error");
    }
  }, [mesh, requestFrame, reportError]);
  // New pictures / models arrived, or pieces changed how they are drawn.
  useEffect(() => {
    assetsRef.current = assets;
    planRef.current = plan;
    const scene = sceneRef.current;
    if (scene) syncAssets(scene);
  }, [assets, plan, syncAssets]);

  // Inside, the arrow keys up / down (and W / S) walk and A / D step sideways; left /
  // right still turn. Everything else is the camera hook's.
  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (inside) {
      const yaw = camera.current.yaw;
      const key = event.key.toLowerCase();
      const moves: Record<string, [number, number]> = {
        arrowup: [WALK_STEP, 0],
        w: [WALK_STEP, 0],
        arrowdown: [-WALK_STEP, 0],
        s: [-WALK_STEP, 0],
        a: [0, -WALK_STEP],
        d: [0, WALK_STEP],
      };
      // inside, a positive yaw looks LEFT, so the left arrow raises it
      if (key === "arrowleft" || key === "arrowright") {
        event.preventDefault();
        orbit.setView({ yaw: yaw + (key === "arrowleft" ? KEY_TURN : -KEY_TURN) });
        return;
      }
      const move = moves[key];
      if (move) {
        event.preventDefault();
        walk.step(yaw, move[0], move[1]);
        return;
      }
    }
    orbit.handlers.onKeyDown(event);
  };

  const unavailable = status === "unsupported" || status === "error" || status === "lost";
  const ready = status === "ready";

  return (
    <section
      ref={sectionRef}
      className={styles.viewer}
      data-mode={mode}
      data-gl-status={status}
      data-piece-modes={modeSummary(plan)}
      aria-label="3D room"
    >
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={label}
          tabIndex={0}
          style={movable && !inside ? { cursor: "grab" } : undefined}
          {...orbit.handlers}
          onKeyDown={onKeyDown}
        />
        {unavailable && (
          <p className={styles.message} role="alert">
            {status === "unsupported" && "This browser can't show the 3D room. The flat room and Look around still work."}
            {status === "lost" && "The 3D view was paused by your device. Close it and open it again."}
            {status === "error" && `The 3D room couldn't start. ${message}`}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        {inside && (
          <>
            <button
              type="button"
              className={styles.button}
              onClick={() => walk.step(camera.current.yaw, WALK_STEP, 0)}
              disabled={!ready}
              aria-label="Walk forward"
            >
              ▲ Forward
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => walk.step(camera.current.yaw, -WALK_STEP, 0)}
              disabled={!ready}
              aria-label="Walk back"
            >
              ▼ Back
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => walk.step(camera.current.yaw, 0, -WALK_STEP)}
              disabled={!ready}
              aria-label="Step left"
            >
              ◀ Step
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => walk.step(camera.current.yaw, 0, WALK_STEP)}
              disabled={!ready}
              aria-label="Step right"
            >
              Step ▶
            </button>
          </>
        )}
        <button
          type="button"
          className={styles.button}
          onClick={() => orbit.setView({ yaw: camera.current.yaw + (inside ? QUARTER_TURN : -QUARTER_TURN) })}
          disabled={!ready}
          aria-label={inside ? "Turn left" : "Turn the room left"}
        >
          ↺ Turn
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => orbit.setView({ yaw: camera.current.yaw + (inside ? -QUARTER_TURN : QUARTER_TURN) })}
          disabled={!ready}
          aria-label={inside ? "Turn right" : "Turn the room right"}
        >
          Turn ↻
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            if (inside) walk.reset();
            orbit.reset();
          }}
          disabled={!ready}
        >
          {inside ? "Back to the door" : "Reset view"}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.zoomButton}`}
          onClick={() => orbit.zoomBy(1 / ZOOM_STEP)}
          aria-label={inside ? "Wider view" : "Zoom out"}
          disabled={!ready || orbit.zoomLimit === "min"}
        >
          −
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.zoomButton}`}
          onClick={() => orbit.zoomBy(ZOOM_STEP)}
          aria-label={inside ? "Closer view" : "Zoom in"}
          disabled={!ready || orbit.zoomLimit === "max"}
        >
          +
        </button>
      </div>
    </section>
  );
}

// "model:1 card:3 block:1": how the pieces are drawn right now (for the legend line and tests).
export function modeSummary(plan: PiecePlan[]): string {
  const counts: Record<string, number> = {};
  for (const entry of plan) counts[entry.mode] = (counts[entry.mode] ?? 0) + 1;
  return Object.entries(counts)
    .map(([mode, count]) => `${mode}:${count}`)
    .join(" ");
}
