"use client";
import React, { useCallback, useMemo, useState } from "react";
import styles from "./DollhouseOverlay.module.css";
import RoomDollhouse, { RoomViewMode } from "../../Atoms/RoomDollhouse/RoomDollhouse";
import { MetreField } from "../RoomSizeControl/RoomSizeControl";
import { useCustomRoom } from "../../CustomHooks/useCustomRoom";
import { useRoomAssets } from "../../CustomHooks/useRoomAssets";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { redoCustom, setCustomRoomDepth, undoCustom, updateCustomPiece } from "@/app/store/features/categorySlice";
import { MAX_ROOM_DEPTH_CM, MIN_ROOM_DEPTH_CM, buildWorld, roomDepthCm } from "@/app/utils/roomWorld";
import { ScenePosition, clampPosition, computeAutoLayout } from "@/app/utils/roomScene";
import { buildRoomMesh } from "@/app/utils/gl/roomMesh";
import { ReadyAssets, planPieces } from "@/app/utils/gl/roomPieces";
import {
  ceilingToPosition,
  clampAlongCeiling,
  clampToRoom,
  clampToWall,
  floorToPosition,
  isMovable,
  moveSurfaceOf,
  positionToCeiling,
  positionToFloor,
  positionToWall,
  wallToPosition,
} from "@/app/utils/gl/roomPicking";
import { WALL_NUDGE_CM } from "@/app/utils/roomScene";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
// How far one press of a Move button slides a piece (a wall piece's height: WALL_NUDGE_CM).
const NUDGE_CM = 10;
const metres = (cm: number) => `${(cm / 100).toFixed(2)} m`;

// "3D room": the Customize room as a dollhouse you can turn and zoom (global
// overlay mechanism), and where pieces on the floor or hung on the back wall can be moved.
//
// Moving a piece here edits the SAME arrangement as the flat room: the position is
// converted back to the flat editor's numbers (see roomPicking), so both views always
// agree, undo / redo covers it, and saved designs and share links need no change.
// Ceiling and resting pieces are moved in the flat editor (a resting piece follows
// whatever it rests on).
//
// Each piece is drawn as well as its files allow, and says so: a real 3D model
// when the product has one, otherwise its photo standing in the room (a flat
// "stand-in"), otherwise a plain block. Files arrive in the background and the
// room upgrades piece by piece.
export default function DollhouseOverlay() {
  const dispatch = useAppDispatch();
  const { scene, sceneItems, layout, depthCm } = useCustomRoom();
  const canUndo = useAppSelector((state: RootState) => state.categoryState.customHistory.past.length > 0);
  const canRedo = useAppSelector((state: RootState) => state.categoryState.customHistory.future.length > 0);

  // Seen from outside (move pieces) or standing inside (look around, walk).
  const [mode, setMode] = useState<RoomViewMode>("dollhouse");
  const inside = mode === "inside";
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // While a piece is being dragged its position lives here; it is saved on release.
  const [drag, setDrag] = useState<{ key: string; position: ScenePosition } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const auto = useMemo(() => computeAutoLayout(sceneItems, scene), [sceneItems, scene]);
  const layoutNow = useMemo(() => (drag ? { ...(layout ?? {}), [drag.key]: drag.position } : layout), [layout, drag]);
  const world = useMemo(() => buildWorld(sceneItems, scene, layoutNow, depthCm), [sceneItems, scene, layoutNow, depthCm]);
  const { assets, status } = useRoomAssets(world.pieces);

  // Files the graphics card refused (rare): treated as if they never arrived.
  const [refused, setRefused] = useState<{ models: Set<string>; cards: Set<string> }>(() => ({
    models: new Set(),
    cards: new Set(),
  }));
  const onAssetError = useCallback((kind: "card" | "model", id: string) => {
    setRefused((previous) => {
      const next = { models: new Set(previous.models), cards: new Set(previous.cards) };
      (kind === "model" ? next.models : next.cards).add(id);
      return next;
    });
  }, []);

  // What is ready to draw, in the shape the planner wants (metres, aspect ratios).
  const ready = useMemo<ReadyAssets>(() => {
    const models = new Map<string, { w: number; h: number; d: number }>();
    assets.models.forEach(({ model }, id) => {
      if (refused.models.has(id)) return;
      models.set(id, {
        w: model.max[0] - model.min[0],
        h: model.max[1] - model.min[1],
        d: model.max[2] - model.min[2],
      });
    });
    const cards = new Map<string, number>();
    assets.cards.forEach((canvas, url) => {
      if (!refused.cards.has(url)) cards.set(url, canvas.width / Math.max(1, canvas.height));
    });
    return { models, cards };
  }, [assets, refused]);

  const plan = useMemo(() => planPieces(world, ready), [world, ready]);
  // A piece that no longer exists (undo, removed) cannot stay selected.
  const selectedPlan = inside ? null : (plan.find((entry) => entry.key === selectedKey && isMovable(entry)) ?? null);
  const selectedPiece = selectedPlan ? world.pieces.find((piece) => piece.key === selectedPlan.key) : undefined;
  const mesh = useMemo(
    () => buildRoomMesh({ world, scene, plan, selectedKey: selectedPlan?.key ?? null }),
    [world, scene, plan, selectedPlan?.key],
  );

  // ── moving ──────────────────────────────────────────────────────────────────
  const frame = useMemo(
    () => ({ widthCm: world.widthCm, depthCm: world.depthCm, floorPct: scene.spec.floorLine * 100 }),
    [world.widthCm, world.depthCm, scene.spec.floorLine],
  );

  // A wanted floor centre (cm) → the flat editor's position for that piece: kept
  // inside the room, snapped to a wall when close, and inside the flat editor's own limits.
  const positionFor = useCallback(
    (key: string, centreCm: { x: number; z: number; y?: number }): ScenePosition | null => {
      const piece = world.pieces.find((candidate) => candidate.key === key);
      if (!piece) return null;
      const base = layout?.[key] ?? auto[key];
      if (!base) return null;
      if (piece.kind === "ceiling") {
        // sideways along the ceiling: only x; its height and depth are fixed
        return ceilingToPosition(clampAlongCeiling(centreCm.x, piece.wCm, { widthCm: world.widthCm }), piece.item, scene, base);
      }
      if (piece.kind === "hung") {
        // across the back wall: x along it, y = height of the piece's centre above the floor
        const current = positionToWall(base, piece.item, scene);
        const spot = clampToWall(
          { x: centreCm.x, elevation: centreCm.y ?? current.elevation },
          { w: piece.wCm, h: piece.hCm ?? 30 },
          { widthCm: world.widthCm, heightCm: world.heightCm },
        );
        return wallToPosition(spot, piece.item, scene, base);
      }
      const inside = clampToRoom(centreCm, { w: piece.wCm, d: piece.dCm }, frame);
      const raw = floorToPosition(inside, { d: piece.dCm }, frame, base);
      return { ...raw, ...clampPosition(raw, piece.item, scene) };
    },
    [world.pieces, world.widthCm, world.heightCm, layout, auto, frame, scene],
  );

  // Says where the piece ENDED UP (after the room, a wall or the flat editor's own limits
  // stopped it), not where it was asked to go.
  const announce = useCallback(
    (key: string, position: ScenePosition) => {
      const piece = world.pieces.find((candidate) => candidate.key === key);
      if (!piece) return;
      if (piece.kind === "ceiling") {
        setAnnouncement(
          `Moved ${piece.item.name}: ${metres(positionToCeiling(position, scene) - piece.wCm / 2)} from the left wall, along the ceiling.`,
        );
        return;
      }
      if (piece.kind === "hung") {
        const spot = positionToWall(position, piece.item, scene);
        setAnnouncement(
          `Moved ${piece.item.name}: ${metres(spot.x - piece.wCm / 2)} from the left wall, centre ${Math.round(spot.elevation)} cm above the floor.`,
        );
        return;
      }
      const centreCm = positionToFloor(position, { d: piece.dCm }, frame);
      setAnnouncement(
        `Moved ${piece.item.name}: ${metres(centreCm.x - piece.wCm / 2)} from the left wall, ${metres(centreCm.z - piece.dCm / 2)} from the back wall.`,
      );
    },
    [world.pieces, frame, scene],
  );

  const onMove = useCallback(
    (key: string, centreCm: { x: number; z: number; y?: number }, phase: "drag" | "end") => {
      const position = positionFor(key, centreCm);
      if (!position) return;
      if (phase === "drag") {
        setDrag({ key, position });
        return;
      }
      setDrag(null);
      dispatch(updateCustomPiece({ spaceSlug: scene.slug, key, transform: position }));
      announce(key, position);
    },
    [positionFor, dispatch, scene.slug, announce],
  );

  const surface = selectedPlan ? moveSurfaceOf(selectedPlan) : null;
  const onWall = surface === "wall";
  const onCeiling = surface === "ceiling";
  // dx along the wall / room; `other`: depth on the floor, height on the wall (cm)
  const nudge = (dxCm: number, other: number) => {
    if (!selectedPlan) return;
    if (onCeiling) {
      onMove(selectedPlan.key, { x: selectedPlan.x * 100 + dxCm, z: selectedPlan.z * 100 }, "end");
      return;
    }
    if (onWall) {
      const height = (selectedPlan.yBottom + selectedPlan.h / 2) * 100;
      onMove(selectedPlan.key, { x: selectedPlan.x * 100 + dxCm, z: selectedPlan.z * 100, y: height + other }, "end");
      return;
    }
    onMove(selectedPlan.key, { x: selectedPlan.x * 100 + dxCm, z: selectedPlan.z * 100 + other }, "end");
  };

  const names = world.pieces.map((piece) => piece.item.name);
  const label = `3D model of your room, ${(world.widthCm / 100).toFixed(1)} by ${(world.depthCm / 100).toFixed(1)} metres${
    names.length ? `, with ${names.join(", ")}` : ""
  }. ${
    inside
      ? "You are standing inside it: tap the floor to walk there, drag to look around, or use the arrow keys."
      : "Drag empty space, or use the arrow keys, to turn it. Tap a piece on the floor, the back wall or the ceiling to move it."
  }`;

  const counts = { model: 0, card: 0, block: 0, rug: 0 };
  for (const entry of plan) {
    if (entry.mode === "model") counts.model += 1;
    else if (entry.mode === "block") counts[entry.kind === "rug" ? "rug" : "block"] += 1;
    else counts.card += 1;
  }
  const fitted = plan.filter((entry) => entry.mode === "model" && entry.modelFit === "inside").length;

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>Your room in 3D</h2>
      <div className={styles.modes} role="group" aria-label="How to see the room">
        <button type="button" className={styles.modeButton} aria-pressed={!inside} onClick={() => setMode("dollhouse")}>
          Dollhouse
        </button>
        <button type="button" className={styles.modeButton} aria-pressed={inside} onClick={() => setMode("inside")}>
          Stand inside
        </button>
      </div>
      <p className={styles.hint}>
        {inside
          ? "Tap the floor to walk there. Drag to look around; use the buttons or the arrow keys to walk and turn."
          : "Tap a piece on the floor, the wall or the ceiling to move it. Drag empty space to turn the room, pinch or use + and − to zoom."}
      </p>

      <RoomDollhouse
        mesh={mesh}
        label={label}
        assets={assets}
        plan={plan}
        onAssetError={onAssetError}
        mode={mode}
        movable={!inside}
        onSelect={setSelectedKey}
        onMove={onMove}
      />

      {status.loading > 0 && (
        <p className={styles.status} role="status">
          Loading {plural(status.loading, "3D model")}…
        </p>
      )}
      {(status.failed.length > 0 || status.skipped.length > 0) && (
        <p className={styles.warning} role="status">
          {status.failed.length > 0 &&
            `${status.failed.join(", ")} couldn't be loaded in 3D, so ${status.failed.length === 1 ? "its photo is" : "their photos are"} shown instead. `}
          {status.skipped.length > 0 &&
            `${status.skipped.join(", ")} ${status.skipped.length === 1 ? "was" : "were"} left as ${status.skipped.length === 1 ? "a photo" : "photos"} to keep the room smooth on your device.`}
        </p>
      )}

      {selectedPlan && selectedPiece && (
        <div className={styles.mover} role="group" aria-label={`Move ${selectedPiece.item.name}`}>
          <p className={styles.moverTitle}>
            Moving <strong>{selectedPiece.item.name}</strong>
          </p>
          {onCeiling && <p className={styles.moverNote}>This hangs from the ceiling, so it slides sideways only.</p>}
          <div className={styles.nudges}>
            <button type="button" className={styles.nudge} onClick={() => nudge(-NUDGE_CM, 0)}>
              ← Left
            </button>
            <button type="button" className={styles.nudge} onClick={() => nudge(NUDGE_CM, 0)}>
              Right →
            </button>
            {onCeiling ? null : onWall ? (
              <>
                <button type="button" className={styles.nudge} onClick={() => nudge(0, WALL_NUDGE_CM)}>
                  ↑ Higher
                </button>
                <button type="button" className={styles.nudge} onClick={() => nudge(0, -WALL_NUDGE_CM)}>
                  ↓ Lower
                </button>
              </>
            ) : (
              <>
                <button type="button" className={styles.nudge} onClick={() => nudge(0, -NUDGE_CM)}>
                  ↑ Back
                </button>
                <button type="button" className={styles.nudge} onClick={() => nudge(0, NUDGE_CM)}>
                  ↓ Front
                </button>
              </>
            )}
            <button type="button" className={`${styles.nudge} ${styles.done}`} onClick={() => setSelectedKey(null)}>
              Done
            </button>
          </div>
        </div>
      )}
      <p className={styles.sr} role="status" aria-live="polite">
        {announcement}
      </p>

      {!inside && (
        <div className={styles.history}>
          <button type="button" className={styles.nudge} onClick={() => dispatch(undoCustom())} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className={styles.nudge} onClick={() => dispatch(redoCustom())} disabled={!canRedo}>
            Redo
          </button>
        </div>
      )}

      {names.length > 0 && (
        <p className={styles.legend}>
          {[
            counts.model > 0 ? `${counts.model} in 3D` : null,
            counts.card > 0 ? `${plural(counts.card, "flat photo stand-in")}` : null,
            counts.rug > 0 ? plural(counts.rug, "rug") : null,
            counts.block > 0 ? `${plural(counts.block, "plain block")}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className={styles.depth}>
        <MetreField
          id="dollhouse-room-depth"
          label="Room depth"
          valueCm={depthCm}
          defaultCm={roomDepthCm(scene)}
          minCm={MIN_ROOM_DEPTH_CM}
          maxCm={MAX_ROOM_DEPTH_CM}
          onChange={(cm) => dispatch(setCustomRoomDepth(cm))}
        />
      </div>

      {names.length > 0 && (
        <details className={styles.pieces}>
          <summary>{plural(names.length, "piece")} in this room</summary>
          <ul className={styles.pieceList}>
            {world.pieces.map((piece) => {
              const movable = !inside && plan.some((entry) => entry.key === piece.key && isMovable(entry));
              const isSelected = piece.key === selectedPlan?.key;
              return (
                <li key={piece.key} className={styles.pieceRow}>
                  <span>{piece.item.name}</span>
                  {movable ? (
                    <button
                      type="button"
                      className={styles.pickButton}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedKey(isSelected ? null : piece.key)}
                    >
                      {isSelected ? "Selected" : "Move"}
                    </button>
                  ) : (
                    <span className={styles.pieceNote}>{inside ? "" : "move in the flat room"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <p className={styles.note}>
        {inside
          ? "Standing inside, you can't walk through furniture or walls. "
          : "Moving a piece here moves it in the flat room too (and Undo works in both). "}
        A 3D model is drawn at the
        product&apos;s listed size{fitted > 0 ? " (one that doesn't match its listing is shrunk to fit inside its space)" : ""}.
        A photo stand-in is the product&apos;s picture standing in the room — it looks flat from the side.
        Illustrative preview; the depth is an estimate until you enter yours.
      </p>
    </div>
  );
}
