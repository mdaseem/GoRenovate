import { useCallback, useEffect, useRef, useState } from "react";

// Turn-and-zoom camera controls shared by the product viewer and the 3D room
// (dollhouse): drag to turn (a flick keeps coasting), two-finger pinch / buttons /
// + - keys / Ctrl+wheel to zoom, arrow keys to turn. The hook owns the camera
// numbers and the gestures; the component owns the canvas, the frame loop and
// anything specific to it (like the product viewer's idle spin).
//
// The camera lives in a ref, not state: it changes every frame while dragging and
// must not re-render React.

export interface OrbitView {
  yaw: number; // radians, turn about the vertical axis
  pitch: number; // radians, positive = looking down from above
  zoom: number; // 1 = fitted
}

export interface OrbitOptions {
  initial: OrbitView;
  minPitch: number;
  maxPitch: number;
  minZoom: number;
  maxZoom: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Ask for a redraw (the component's frame loop).
  requestFrame: () => void;
  // Called when the person grabs or keys the camera (the product viewer stops its idle spin).
  onUserInput?: () => void;
  // Lets the component claim a touch for something else (the 3D room: dragging a
  // piece). `down` returns true to claim it; that pointer then goes to `move` / `up`
  // and never turns the camera, and a second finger is ignored while it is held.
  intercept?: {
    down: (event: React.PointerEvent<HTMLCanvasElement>) => boolean;
    move: (event: React.PointerEvent<HTMLCanvasElement>) => void;
    up: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  };
  // A quick press-and-release that did not turn the camera (and was not claimed).
  onTap?: (event: React.PointerEvent<HTMLCanvasElement>) => void;
}

const TAP_MAX_MOVE_PX = 6;
const TAP_MAX_MS = 400;

const DRAG_RADIANS_PER_PIXEL = 0.01;
const KEY_STEP_RADIANS = 0.12;
export const ZOOM_STEP = 1.25;
const WHEEL_ZOOM_PER_PIXEL = 0.01; // ctrl + wheel (a trackpad pinch arrives this way)
// Letting go of a drag while it is still moving keeps it coasting, slowing down by
// this factor each second, until it is slower than the stop speed.
const INERTIA_DECAY_PER_SECOND = 4;
const INERTIA_STOP_SPEED = 0.03; // radians per second
const INERTIA_MAX_SPEED = 8;
const INERTIA_STALE_MS = 90; // a pause this long before release means "let go while still"

type Gesture =
  | { kind: "turn"; x: number; y: number; yaw: number; pitch: number }
  | { kind: "pinch"; distance: number; zoom: number }
  | null;

export function useOrbitCamera(options: OrbitOptions) {
  const { initial, minPitch, maxPitch, minZoom, maxZoom, canvasRef, requestFrame } = options;
  const onUserInputRef = useRef(options.onUserInput);
  const interceptRef = useRef(options.intercept);
  const onTapRef = useRef(options.onTap);
  useEffect(() => {
    onUserInputRef.current = options.onUserInput;
    interceptRef.current = options.intercept;
    onTapRef.current = options.onTap;
  });
  // The pointer a component has claimed, and where / when a possible tap began.
  const claimedId = useRef<number | null>(null);
  const tapStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const camera = useRef<OrbitView>({ ...initial });
  const velocity = useRef({ yaw: 0, pitch: 0 }); // radians per second, set by a flick
  const lastMove = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>(null);
  const [zoomLimit, setZoomLimit] = useState<"min" | "max" | null>(null);

  const clampPitch = useCallback((pitch: number) => Math.max(minPitch, Math.min(maxPitch, pitch)), [minPitch, maxPitch]);
  const clampZoom = useCallback((zoom: number) => Math.max(minZoom, Math.min(maxZoom, zoom)), [minZoom, maxZoom]);

  const stopMotion = useCallback(() => {
    velocity.current = { yaw: 0, pitch: 0 };
  }, []);

  // The one place the camera changes: clamps, redraws, and tells the zoom buttons
  // when they hit an end stop.
  const setView = useCallback(
    (next: Partial<OrbitView>) => {
      const current = camera.current;
      const zoom = clampZoom(next.zoom ?? current.zoom);
      camera.current = {
        yaw: next.yaw ?? current.yaw,
        pitch: clampPitch(next.pitch ?? current.pitch),
        zoom,
      };
      setZoomLimit(zoom <= minZoom ? "min" : zoom >= maxZoom ? "max" : null);
      requestFrame();
    },
    [clampPitch, clampZoom, minZoom, maxZoom, requestFrame],
  );

  // Ctrl + wheel zooms; a plain wheel is left alone so the page can still scroll.
  // Needs a non-passive native listener: React's onWheel cannot cancel the page zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      stopMotion();
      setView({ zoom: camera.current.zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_PER_PIXEL) });
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasRef, setView, stopMotion]);

  const startTurn = (point: { x: number; y: number }) => {
    gesture.current = { kind: "turn", x: point.x, y: point.y, yaw: camera.current.yaw, pitch: camera.current.pitch };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (claimedId.current !== null) return; // a second finger while a piece is held: ignored
    if (interceptRef.current?.down(event)) {
      claimedId.current = event.pointerId;
      tapStart.current = null;
      stopMotion();
      return;
    }
    tapStart.current = pointers.current.size === 0 ? { x: event.clientX, y: event.clientY, time: event.timeStamp } : null;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stopMotion(); // touching a coasting view stops it
    lastMove.current = event.timeStamp;
    onUserInputRef.current?.();
    const points = [...pointers.current.values()];
    if (points.length === 1) startTurn(points[0]);
    else if (points.length === 2) {
      // a second finger turns the gesture into a pinch
      gesture.current = {
        kind: "pinch",
        distance: Math.max(1, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)),
        zoom: camera.current.zoom,
      };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (claimedId.current === event.pointerId) {
      interceptRef.current?.move(event);
      return;
    }
    const point = pointers.current.get(event.pointerId);
    const active = gesture.current;
    if (!point || !active) return;
    point.x = event.clientX;
    point.y = event.clientY;
    if (active.kind === "turn") {
      const before = camera.current;
      const yaw = active.yaw + (event.clientX - active.x) * DRAG_RADIANS_PER_PIXEL;
      const pitch = clampPitch(active.pitch + (event.clientY - active.y) * DRAG_RADIANS_PER_PIXEL);
      // speed of this move, smoothed, so a flick can carry on after release
      const seconds = (event.timeStamp - lastMove.current) / 1000;
      if (seconds > 0) {
        const blend = (old: number, now: number) => old * 0.6 + now * 0.4;
        velocity.current = {
          yaw: blend(velocity.current.yaw, (yaw - before.yaw) / seconds),
          pitch: blend(velocity.current.pitch, (pitch - before.pitch) / seconds),
        };
      }
      lastMove.current = event.timeStamp;
      setView({ yaw, pitch });
    } else if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      setView({ zoom: active.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / active.distance) });
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (claimedId.current === event.pointerId) {
      claimedId.current = null;
      interceptRef.current?.up(event);
      return;
    }
    if (!pointers.current.delete(event.pointerId)) return;
    const start = tapStart.current;
    if (
      start &&
      pointers.current.size === 0 &&
      event.type === "pointerup" &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_MAX_MOVE_PX &&
      event.timeStamp - start.time <= TAP_MAX_MS
    ) {
      onTapRef.current?.(event);
    }
    tapStart.current = null;
    const remaining = [...pointers.current.values()];
    if (remaining.length === 1) {
      // one finger lifted off a pinch: carry on turning from where the other is
      startTurn(remaining[0]);
      stopMotion();
      return;
    }
    if (remaining.length > 0) return;
    gesture.current = null;
    const stillWhenReleased = event.timeStamp - lastMove.current > INERTIA_STALE_MS;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const v = velocity.current;
    const speed = Math.hypot(v.yaw, v.pitch);
    if (stillWhenReleased || reduceMotion || speed < INERTIA_STOP_SPEED) {
      stopMotion();
    } else {
      const scale = Math.min(1, INERTIA_MAX_SPEED / speed);
      velocity.current = { yaw: v.yaw * scale, pitch: v.pitch * scale };
      requestFrame();
    }
  };

  const zoomBy = (factor: number) => {
    stopMotion();
    setView({ zoom: camera.current.zoom * factor });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const { yaw, pitch } = camera.current;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => setView({ yaw: yaw - KEY_STEP_RADIANS }),
      ArrowRight: () => setView({ yaw: yaw + KEY_STEP_RADIANS }),
      ArrowUp: () => setView({ pitch: pitch - KEY_STEP_RADIANS }),
      ArrowDown: () => setView({ pitch: pitch + KEY_STEP_RADIANS }),
      "+": () => zoomBy(ZOOM_STEP),
      "=": () => zoomBy(ZOOM_STEP),
      "-": () => zoomBy(1 / ZOOM_STEP),
      _: () => zoomBy(1 / ZOOM_STEP),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    stopMotion();
    onUserInputRef.current?.();
    move();
  };

  const reset = () => {
    onUserInputRef.current?.();
    stopMotion();
    setView(initial);
  };

  // Called once per frame by the component's loop: keeps a flicked camera
  // coasting. Returns true while it is still moving (so the loop asks for another frame).
  const coast = useCallback((dt: number, active: boolean): boolean => {
    const v = velocity.current;
    if (gesture.current || (v.yaw === 0 && v.pitch === 0)) return false;
    if (!active || Math.hypot(v.yaw, v.pitch) <= INERTIA_STOP_SPEED) {
      stopMotion();
      return false;
    }
    camera.current.yaw += v.yaw * dt;
    camera.current.pitch = clampPitch(camera.current.pitch + v.pitch * dt);
    const keep = Math.exp(-INERTIA_DECAY_PER_SECOND * dt);
    v.yaw *= keep;
    v.pitch *= keep;
    return true;
  }, [clampPitch, stopMotion]);

  return {
    camera,
    zoomLimit,
    setView,
    zoomBy,
    reset,
    coast,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  };
}
