"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// How far the user can turn the room: past this the flat picture cards give
// themselves away (they are photos of the FRONT of a product).
export const MAX_YAW_DEG = 32;
export const MAX_PITCH_DEG = 10;

const DRAG_DEG_PER_PX = 0.12;
const KEY_STEP_DEG = 3;
const TILT_YAW_PER_DEG = 0.6;
const TILT_PITCH_PER_DEG = 0.4;

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

// Drag / keyboard / phone-tilt control of the room's camera for the Look-around
// view. The camera angles live in refs and are written straight to the world
// element's own `transform` — so turning the room never re-renders React and
// never restyles the pieces inside it (a custom property would be inherited by
// every descendant and make the browser re-check all of them on every move).
export function useLookAround() {
  const worldRef = useRef<HTMLDivElement>(null);
  const angles = useRef({ yaw: 0, pitch: 0 });
  const frame = useRef(0);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const tiltBase = useRef<{ gamma: number; beta: number } | null>(null);
  const [tiltOn, setTiltOn] = useState(false);
  const [tiltBlocked, setTiltBlocked] = useState(false);
  // Only offered where a phone-like sensor can exist (decided after mount, so the
  // server and client markup agree).
  const [tiltSupported, setTiltSupported] = useState(false);
  useEffect(() => {
    setTiltSupported(
      typeof DeviceOrientationEvent !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    );
  }, []);

  const write = useCallback(() => {
    frame.current = 0;
    const world = worldRef.current;
    if (!world) return;
    const { yaw, pitch } = angles.current;
    world.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    // Round pieces (lamps, plants…) turn the other way so they keep facing the viewer.
    world
      .querySelectorAll<HTMLElement>("[data-billboard]")
      .forEach((el) => (el.style.transform = `rotateY(${-yaw}deg)`));
    // Readable by tests and the debugger; costs nothing (no selector uses them).
    world.dataset.yaw = String(yaw);
    world.dataset.pitch = String(pitch);
  }, []);

  const turnTo = useCallback(
    (yaw: number, pitch: number) => {
      angles.current = { yaw: clamp(yaw, MAX_YAW_DEG), pitch: clamp(pitch, MAX_PITCH_DEG) };
      if (!frame.current) frame.current = requestAnimationFrame(write);
    },
    [write],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Straight back to the front view, easing unless the user prefers less motion.
  const reset = useCallback(() => {
    const world = worldRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (world && !reduce) {
      world.dataset.easing = "";
      window.setTimeout(() => delete world.dataset.easing, 450);
    }
    turnTo(0, 0);
  }, [turnTo]);

  // Phone tilt. iOS asks for permission, and only from a tap.
  useEffect(() => {
    if (!tiltOn) return;
    tiltBase.current = null;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      // The pose when tilt was switched on is "straight ahead".
      tiltBase.current ??= { gamma: event.gamma, beta: event.beta };
      turnTo(
        (event.gamma - tiltBase.current.gamma) * TILT_YAW_PER_DEG,
        -(event.beta - tiltBase.current.beta) * TILT_PITCH_PER_DEG,
      );
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [tiltOn, turnTo]);

  const toggleTilt = useCallback(async () => {
    if (tiltOn) {
      setTiltOn(false);
      reset();
      return;
    }
    const request = (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission;
    if (request) {
      try {
        if ((await request()) !== "granted") {
          setTiltBlocked(true);
          return;
        }
      } catch {
        setTiltBlocked(true);
        return;
      }
    }
    setTiltBlocked(false);
    setTiltOn(true);
  }, [tiltOn, reset]);

  // Props for the element that receives the gestures.
  const gestureProps = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (tiltOn) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY, ...angles.current };
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const start = drag.current;
      if (!start) return;
      turnTo(
        start.yaw + (event.clientX - start.x) * DRAG_DEG_PER_PX,
        start.pitch - (event.clientY - start.y) * DRAG_DEG_PER_PX,
      );
    },
    onPointerUp: () => {
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      const { yaw, pitch } = angles.current;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [yaw - KEY_STEP_DEG, pitch],
        ArrowRight: [yaw + KEY_STEP_DEG, pitch],
        ArrowUp: [yaw, pitch + KEY_STEP_DEG],
        ArrowDown: [yaw, pitch - KEY_STEP_DEG],
      };
      if (event.key === "Home") {
        event.preventDefault();
        reset();
        return;
      }
      const next = moves[event.key];
      if (!next) return;
      event.preventDefault();
      turnTo(next[0], next[1]);
    },
  };

  return { worldRef, gestureProps, reset, tiltSupported, tiltOn, tiltBlocked, toggleTilt };
}
