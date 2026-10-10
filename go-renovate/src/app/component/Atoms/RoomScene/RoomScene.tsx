"use client";
import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./RoomScene.module.css";
import SceneBackdrop from "./SceneBackdrop";
import ScaleFigure from "./ScaleFigure";
import { ResolvedScene } from "@/app/utils/sceneSpec";
import { AvailabilityEntry } from "@/app/component/CustomHooks/useEssentialAvailability";
import {
  MAX_PIECE_SCALE,
  MIN_PIECE_SCALE,
  PIECE_SCALE_STEP,
  clampPosition,
  clampScale,
  computeAutoLayout,
  depthScale,
  formatDimensions,
  getPlacement,
  itemBoxPct,
  keyOf,
  ScenePiece,
  ScenePosition,
  ScenePositions,
} from "@/app/utils/roomScene";

type Props = {
  // The space being rendered (see utils/sceneSpec — resolveScene()).
  scene: ResolvedScene;
  items: ScenePiece[];
  // Live stock info — out-of-stock pieces are desaturated and badged so the
  // scene never presents an unbuyable piece as available.
  availability?: Record<string, AvailabilityEntry>;
  // Manual arrangement per piece (overrides the auto layout): position plus
  // optional scale / flipped / front tweaks.
  layout?: ScenePositions;
  // When provided the scene is interactive: pieces can be dragged, nudged with
  // the arrow keys, and — once selected — resized, flipped or brought to the
  // front. Called with the piece's FULL new transform. Omit for read-only.
  onChange?: (key: string, next: ScenePosition) => void;
  onTidy?: () => void;
  // Thumbnail use (e.g. Browse All cards): no caption, tighter chrome.
  compact?: boolean;
};

const NUDGE_PCT = 2;

export default function RoomScene({
  scene,
  items,
  availability = {},
  layout = {},
  onChange,
  onTidy,
  compact = false,
}: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const autoLayout = useMemo(
    () => computeAutoLayout(items, scene),
    [items, scene],
  );
  // A piece currently being dragged is tracked locally and only committed on
  // release, so a drag doesn't re-render the whole page per pointer move.
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  // Products whose cutout image failed to load (404, bad URL): drawn as the
  // labelled tile instead of an invisible empty box.
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // Optional 170 cm person drawn at the room's scale (a quick "does it fit?" check).
  const [showScale, setShowScale] = useState(false);
  // The piece the toolbar below the scene acts on.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Where inside the piece the user grabbed it (distance from the piece's
  // anchor to the pointer, in scene %), so it follows the pointer from that
  // exact spot instead of jumping to put its edge under the cursor.
  const grabOffsetRef = useRef({ dx: 0, dy: 0 });
  const isInteractive = Boolean(onChange);

  // The saved/auto transform of a piece, ignoring any drag in progress.
  const settledOf = (item: ScenePiece): ScenePosition =>
    layout[keyOf(item)] ?? autoLayout[keyOf(item)];

  const positionOf = (item: ScenePiece): ScenePosition => {
    const settled = settledOf(item);
    return drag?.id === keyOf(item)
      ? { ...settled, x: drag.x, y: drag.y }
      : settled;
  };

  const pointerToScene = (event: React.PointerEvent) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handlePointerDown = (event: React.PointerEvent, item: ScenePiece) => {
    if (!isInteractive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedKey(keyOf(item));
    const current = positionOf(item);
    const point = pointerToScene(event);
    grabOffsetRef.current = point
      ? { dx: current.x - point.x, dy: current.y - point.y }
      : { dx: 0, dy: 0 };
    setDrag({ id: keyOf(item), x: current.x, y: current.y });
  };

  const handlePointerMove = (event: React.PointerEvent, item: ScenePiece) => {
    if (!drag || drag.id !== keyOf(item)) return;
    const point = pointerToScene(event);
    if (!point) return;
    const next = clampPosition(
      {
        x: point.x + grabOffsetRef.current.dx,
        y: point.y + grabOffsetRef.current.dy,
      },
      item,
      scene,
    );
    setDrag({ id: keyOf(item), x: next.x, y: next.y });
  };

  const handlePointerEnd = (item: ScenePiece) => {
    if (!drag || drag.id !== keyOf(item)) return;
    const { x, y } = drag;
    setDrag(null);
    // A tap (no movement) selects without recording an undo step.
    const settled = settledOf(item);
    if (x !== settled.x || y !== settled.y) {
      onChange?.(keyOf(item), { ...settled, x, y });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: ScenePiece) => {
    if (!onChange) return;
    const step = event.shiftKey ? NUDGE_PCT * 2.5 : NUDGE_PCT;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[event.key];
    if (!move) return;
    event.preventDefault();
    const current = positionOf(item);
    const next = clampPosition(
      { x: current.x + move[0], y: current.y + move[1] },
      item,
      scene,
    );
    onChange(keyOf(item), { ...current, x: next.x, y: next.y });
  };

  const selected = items.find((item) => keyOf(item) === selectedKey);
  const selectedPosition = selected ? positionOf(selected) : null;
  const selectedScale = selectedPosition?.scale ?? 1;

  const tweak = (patch: Partial<ScenePosition>) => {
    if (!selected || !selectedPosition) return;
    onChange?.(keyOf(selected), { ...selectedPosition, ...patch });
  };

  const summary = items.length
    ? `Room preview with ${items.map((item) => item.name).join(", ")}.`
    : "Empty room preview.";

  return (
    <div className={`${styles.wrapper}${compact ? ` ${styles.wrapperCompact}` : ""}`}>
      <div
        ref={sceneRef}
        className={styles.scene}
        style={{ aspectRatio: scene.aspect }}
        role={isInteractive ? "group" : "img"}
        aria-label={
          isInteractive
            ? "Room preview. Drag pieces to arrange them; select a piece to resize or flip it."
            : summary
        }
        onPointerDown={(event) => {
          // Pressing the bare room (not a piece) deselects.
          if (!(event.target as HTMLElement).closest("button")) setSelectedKey(null);
        }}
      >
        <SceneBackdrop scene={scene} />
        {showScale && <ScaleFigure scene={scene} />}

        {items.map((item) => {
          const position = positionOf(item);
          const { zone, layer } = getPlacement(item, scene);
          const entry = availability[item._id];
          const isUnavailable = entry?.isAvailable === false;
          const isDragging = drag?.id === keyOf(item);
          const isSelected = isInteractive && selectedKey === keyOf(item);
          // Real width AND height (a product without a height keeps its
          // artwork's proportions). The user's resize and the small
          // perspective cue scale both together.
          const box = itemBoxPct(
            item,
            scene,
            zone,
            layer,
            (position.scale ?? 1) * depthScale(zone, position.y, scene),
          );
          const style = {
            "--x": position.x,
            "--y": position.y,
            width: `${box.w}%`,
            ...(box.h !== null ? { height: `${box.h}%` } : {}),
            // Painted above everything when brought to the front, and above
            // even that while being dragged.
            zIndex:
              (isDragging ? 1000 : 0) +
              (position.front ? 500 : 0) +
              (zone === "floor"
                ? layer * 100 + Math.round(position.y)
                : 50 + layer),
          } as React.CSSProperties;

          const visual = item.cutoutUrl && !failedImages.has(item._id) ? (
            <Image
              src={item.cutoutUrl}
              alt=""
              width={0}
              height={0}
              sizes="(max-width: 640px) 90vw, 560px"
              unoptimized
              draggable={false}
              onError={() =>
                setFailedImages((prev) => new Set(prev).add(item._id))
              }
              className={`${styles.cutout}${box.h !== null ? ` ${styles.cutoutFit}` : ""}${
                zone === "floor" ? ` ${styles.cutoutFloor}` : ""
              }${position.flipped ? ` ${styles.flipped}` : ""}`}
            />
          ) : (
            // No vendor cutout yet: a labelled tile keeps the piece visible
            // and movable instead of silently dropping it from the preview.
            <span className={styles.placeholder}>
              <span aria-hidden="true">📦</span>
              <span className={styles.placeholderName}>{item.name}</span>
            </span>
          );

          const className = `${styles.item} ${
            zone === "floor" ? styles.itemFloor : styles.itemHung
          }${isDragging ? ` ${styles.itemDragging}` : ""}${
            isUnavailable ? ` ${styles.itemUnavailable}` : ""
          }${isInteractive ? ` ${styles.itemInteractive}` : ""}${
            isSelected ? ` ${styles.itemSelected}` : ""
          }`;

          const badge = isUnavailable ? (
            <span className={styles.badge}>
              {entry?.stock === 0 ? "Out of stock" : "Unavailable"}
            </span>
          ) : null;

          // A soft contact shadow grounds standing pieces (not flat rugs).
          const shadow =
            zone === "floor" && layer >= 1 ? (
              <span className={styles.shadow} aria-hidden="true" />
            ) : null;

          return isInteractive ? (
            <button
              key={keyOf(item)}
              type="button"
              className={className}
              style={style}
              aria-label={`${item.name}. Drag or use the arrow keys to move it.`}
              aria-pressed={isSelected}
              onPointerDown={(event) => handlePointerDown(event, item)}
              onPointerMove={(event) => handlePointerMove(event, item)}
              onPointerUp={() => handlePointerEnd(item)}
              onPointerCancel={() => handlePointerEnd(item)}
              onKeyDown={(event) => handleKeyDown(event, item)}
              onFocus={() => setSelectedKey(keyOf(item))}
            >
              {shadow}
              {visual}
              {badge}
            </button>
          ) : (
            <div key={keyOf(item)} className={className} style={style}>
              {shadow}
              {visual}
              {badge}
            </div>
          );
        })}
      </div>

      {isInteractive && selected && selectedPosition && (
        <div
          className={styles.toolbar}
          role="toolbar"
          aria-label={`Adjust ${selected.name}`}
        >
          <div className={styles.toolbarInfo}>
            <span className={styles.toolbarName}>{selected.name}</span>
            <span className={styles.toolbarSize}>{formatDimensions(selected)}</span>
          </div>
          <div className={styles.toolbarButtons}>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => tweak({ scale: clampScale(selectedScale / PIECE_SCALE_STEP) })}
              disabled={selectedScale <= MIN_PIECE_SCALE}
              aria-label="Make smaller"
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => tweak({ scale: clampScale(selectedScale * PIECE_SCALE_STEP) })}
              disabled={selectedScale >= MAX_PIECE_SCALE}
              aria-label="Make larger"
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => tweak({ flipped: !selectedPosition.flipped })}
              aria-pressed={Boolean(selectedPosition.flipped)}
            >
              Flip
            </button>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => tweak({ front: !selectedPosition.front })}
              aria-pressed={Boolean(selectedPosition.front)}
            >
              Bring to front
            </button>
          </div>
        </div>
      )}

      {!compact && (
        <p className={styles.caption}>
          <span>
            Preview only — real colours and sizes may vary.
            {isInteractive && " Drag pieces to arrange; tap one to resize or flip it."}
          </span>
          <span className={styles.captionActions}>
            {isInteractive && (
              <button
                type="button"
                className={styles.tidy}
                onClick={() => setShowScale((on) => !on)}
                aria-pressed={showScale}
              >
                {showScale ? "Hide scale" : "Show scale"}
              </button>
            )}
            {onTidy && items.length > 0 && (
              <button type="button" className={styles.tidy} onClick={onTidy}>
                Tidy up
              </button>
            )}
          </span>
        </p>
      )}
    </div>
  );
}
