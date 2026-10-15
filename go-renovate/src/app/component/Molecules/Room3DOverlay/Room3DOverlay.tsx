"use client";
import React, { useMemo } from "react";
import styles from "./Room3DOverlay.module.css";
import Room3DView from "../../Atoms/Room3DView/Room3DView";
import { useCustomRoom } from "../../CustomHooks/useCustomRoom";
import { useLookAround } from "../../CustomHooks/useLookAround";
import { buildWorld } from "@/app/utils/roomWorld";

// "Look around": the Customize room as a gentle 3D view. Opened from the button
// on the room (global overlay mechanism); read-only — arranging stays in the
// flat editor, so nothing here can change the design.
export default function Room3DOverlay() {
  const { scene, sceneItems, layout, depthCm } = useCustomRoom();
  const world = useMemo(() => buildWorld(sceneItems, scene, layout, depthCm), [sceneItems, scene, layout, depthCm]);
  const { worldRef, gestureProps, reset, tiltSupported, tiltOn, tiltBlocked, toggleTilt } =
    useLookAround();

  const names = sceneItems.map((item) => item.name).join(", ");
  const label = `3D view of your room${names ? ` with ${names}` : ""}. Drag, or use the arrow keys, to look around.`;

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>Look around</h2>
      <p className={styles.hint}>Drag the room to look around, or use the arrow keys.</p>

      <Room3DView
        scene={scene}
        world={world}
        label={label}
        worldRef={worldRef}
        gestureProps={gestureProps}
      />

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={reset}>
          Reset view
        </button>
        {tiltSupported && (
          <button
            type="button"
            className={styles.button}
            onClick={toggleTilt}
            aria-pressed={tiltOn}
          >
            {tiltOn ? "Stop tilting" : "Tilt with my phone"}
          </button>
        )}
      </div>
      {tiltBlocked && (
        <p className={styles.alert} role="alert">
          Your phone didn&apos;t allow motion access, so the room can&apos;t follow its tilt. You
          can still drag it.
        </p>
      )}

      <p className={styles.note}>
        Pieces are photos of their front, so the room only turns a little. Illustrative preview —
        real colours and sizes may differ.
      </p>
    </div>
  );
}
