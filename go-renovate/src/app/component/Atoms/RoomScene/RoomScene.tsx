"use client";
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./RoomScene.module.css";
import SceneBackdrop from "./SceneBackdrop";
import ScaleFigure from "./ScaleFigure";
import ScenePieceView from "./ScenePieceView";
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
  WALL_NUDGE_CM,
  formatDimensions,
  getFixtureOverlaps,
  wallElevationCm,
  yForWallElevation,
  findSupportAt,
  getSpaceSupports,
  getSupportInfo,
  surfaceRestY,
  SupportInfo,
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
  // Removes one copy of a piece (toolbar Remove button, Delete key).
  onRemove?: (item: ScenePiece) => void;
  // On phones, pin the room (and its selected-piece bar) under the site header
  // while the page below it scrolls. Ignored on wider screens and for thumbnails.
  sticky?: boolean;
  // Heads-ups about the arrangement (a piece that doesn't fit, has no size…),
  // shown together with the scene's own overlap warnings in one place.
  notices?: string[];
  // Buttons for the slim bar under the room (Customize puts Undo/Redo before
  // "Show scale" / "Tidy up", and "Start over" after them).
  leadingActions?: React.ReactNode;
  trailingActions?: React.ReactNode;
  // Thumbnail use (e.g. Browse All cards): no caption, tighter chrome.
  compact?: boolean;
};

const NUDGE_PCT = 2;
// Per-viewer convenience: the first-use hint stays dismissed.
const HINT_STORAGE_KEY = "gr-room-scene-hint-dismissed";
// Paint order of a piece resting on a counter / bookcase shelf.
const FIXED_SUPPORT_Z = 55;

function RoomScene({
  scene,
  items,
  availability = {},
  layout = {},
  onChange,
  onTidy,
  onRemove,
  sticky = false,
  notices = [],
  leadingActions,
  trailingActions,
  compact = false,
}: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const autoLayout = useMemo(
    () => computeAutoLayout(items, scene),
    [items, scene],
  );
  // A piece currently being dragged is tracked locally and only committed on
  // release, so a drag doesn't re-render the whole page per pointer move.
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    onKey?: string;
    dx?: number;
  } | null>(null);
  // Pointer moves can arrive faster than frames (120 Hz+ touch screens): the
  // latest drag state waits here and is applied once per animation frame.
  const pendingDragRef = useRef<NonNullable<typeof drag> | null>(null);
  const frameRef = useRef(0);
  // Pinch-to-resize: the fingers currently on the room (touch / pen only — a
  // mouse can't pinch, and a missed mouse-up must never leave a ghost pointer),
  // the gesture's starting distance/scale, and the live scale shown while pinching.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ key: string; distance: number; scale: number } | null>(null);
  const [pinch, setPinch] = useState<{ key: string; scale: number } | null>(null);
  // Where the drag began, so a plain tap (no movement) records no undo step.
  const dragStartRef = useRef<{ x: number; y: number; onKey?: string; dx?: number } | null>(null);
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

  // First-use coaching: shown until dismissed (or the first piece is touched).
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(HINT_STORAGE_KEY) !== "1") setShowHint(true);
    } catch {
      // Storage blocked: show the hint; it just returns on the next visit.
      setShowHint(true);
    }
  }, []);
  // The removed piece (or the button that removed it) takes keyboard focus with
  // it, so hand focus to the room — Ctrl+Z still works from there.
  const removePiece = (item: ScenePiece) => {
    onRemove?.(item);
    setSelectedKey(null);
    sceneRef.current?.focus();
  };
  const dismissHint = () => {
    setShowHint(false);
    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, "1");
    } catch {
      // Storage blocked: nothing to persist.
    }
  };

  // The saved/auto transform of a piece, ignoring any drag in progress.
  const settledOf = (item: ScenePiece): ScenePosition =>
    layout[keyOf(item)] ?? autoLayout[keyOf(item)];

  const itemByKey = new Map(items.map((item) => [keyOf(item), item]));
  // Supports that belong to the space itself (counters, bookcase shelves).
  const spaceSupports = useMemo(() => getSpaceSupports(scene), [scene]);

  // Settled position with any drag in progress applied (a resting piece keeps
  // the support it is hovering over while dragged).
  const baseOf = (item: ScenePiece): ScenePosition => {
    const settled = settledOf(item);
    if (pinch?.key === keyOf(item)) return { ...settled, scale: pinch.scale };
    return drag?.id === keyOf(item)
      ? { ...settled, x: drag.x, y: drag.y, onKey: drag.onKey, dx: drag.dx }
      : settled;
  };

  // The surface a resting piece is on right now (null when it has none, or
  // its support was removed).
  const supportOf = (base: ScenePosition): SupportInfo | null => {
    if (!base.onKey) return null;
    const fixed = spaceSupports.find((support) => support.key === base.onKey);
    if (fixed) return fixed;
    const parent = itemByKey.get(base.onKey);
    return parent ? getSupportInfo(parent, baseOf(parent), scene) : null;
  };

  const positionOf = (item: ScenePiece): ScenePosition => {
    const base = baseOf(item);
    if (getPlacement(item, scene).zone !== "surface") return base;
    const support = supportOf(base);
    // On a support: x/y come from it, so the piece moves whenever it does.
    if (support) {
      return { ...base, x: support.x + (base.dx ?? 0), y: support.topY };
    }
    // Support removed (or never set): the piece stands on the floor.
    return { ...base, y: surfaceRestY(scene), onKey: undefined, dx: undefined };
  };

  // Every surface currently on offer (tables, wall shelves…), optionally
  // leaving one piece out (the one being placed).
  const supportInfos = (excludeKey?: string): SupportInfo[] => [
    ...items
      .filter((candidate) => keyOf(candidate) !== excludeKey)
      .map((candidate) => getSupportInfo(candidate, baseOf(candidate), scene))
      .filter((info): info is SupportInfo => info !== null),
    ...spaceSupports,
  ];

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
    // A second finger belongs to the pinch, not to another piece.
    if (event.pointerType !== "mouse" && pointersRef.current.size >= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedKey(keyOf(item));
    if (showHint) dismissHint();
    const current = positionOf(item);
    const point = pointerToScene(event);
    grabOffsetRef.current = point
      ? { dx: current.x - point.x, dy: current.y - point.y }
      : { dx: 0, dy: 0 };
    dragStartRef.current = {
      x: current.x,
      y: current.y,
      onKey: current.onKey,
      dx: current.dx,
    };
    setDrag({
      id: keyOf(item),
      x: current.x,
      y: current.y,
      onKey: current.onKey,
      dx: current.dx,
    });
  };

  const queueDrag = (next: NonNullable<typeof drag>) => {
    pendingDragRef.current = next;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      if (pendingDragRef.current) setDrag(pendingDragRef.current);
    });
  };

  const handlePointerMove = (event: React.PointerEvent, item: ScenePiece) => {
    if (!drag || drag.id !== keyOf(item)) return;
    const point = pointerToScene(event);
    if (!point) return;
    const candidate = {
      x: point.x + grabOffsetRef.current.dx,
      y: point.y + grabOffsetRef.current.dy,
    };
    if (getPlacement(item, scene).zone === "surface") {
      // Over a table / shelf → snap onto it; otherwise stand on the floor.
      const hit = findSupportAt(supportInfos(keyOf(item)), candidate.x, candidate.y);
      if (hit) {
        const childHalf = itemBoxPct(item, scene, "surface", 2).w / 2;
        const range = Math.max(0, hit.halfWidth - childHalf);
        const dx = Math.min(range, Math.max(-range, candidate.x - hit.x));
        queueDrag({ id: keyOf(item), x: hit.x + dx, y: hit.topY, onKey: hit.key, dx });
        return;
      }
    }
    const next = clampPosition(
      { ...candidate, scale: settledOf(item).scale },
      item,
      scene,
    );
    queueDrag({ id: keyOf(item), x: next.x, y: next.y });
  };

  const handlePointerEnd = (item: ScenePiece) => {
    if (!drag || drag.id !== keyOf(item)) return;
    // The newest move may still be waiting for its frame — it is the real drop point.
    const { x, y, onKey, dx } = pendingDragRef.current ?? drag;
    pendingDragRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    const start = dragStartRef.current;
    setDrag(null);
    // A tap (no movement) selects without recording an undo step.
    const changed =
      !start ||
      x !== start.x ||
      y !== start.y ||
      onKey !== start.onKey ||
      dx !== start.dx;
    if (changed) onChange?.(keyOf(item), { ...settledOf(item), x, y, onKey, dx });
  };

  const fingerDistance = () => {
    const [a, b] = [...pointersRef.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handleSceneDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    const onPiece = Boolean((event.target as HTMLElement).closest("button"));
    const isTouch = event.pointerType !== "mouse";
    if (!onPiece) {
      // Pressing the bare room (first finger / mouse) deselects.
      if (pointersRef.current.size === 0) setSelectedKey(null);
      else if (isTouch) event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!isTouch) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size !== 2 || !selectedKey) return;
    // Second finger down with a piece selected: pinch it. Any half-done drag of
    // the first finger is dropped.
    const target = items.find((item) => keyOf(item) === selectedKey);
    const distance = fingerDistance();
    if (!target || distance < 10) return;
    pendingDragRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    setDrag(null);
    const scale = positionOf(target).scale ?? 1;
    pinchStartRef.current = { key: selectedKey, distance, scale };
    setPinch({ key: selectedKey, scale });
  };

  const handleSceneMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const start = pinchStartRef.current;
    if (!start || pointersRef.current.size < 2) return;
    const scale = clampScale((start.scale * fingerDistance()) / start.distance);
    setPinch((prev) =>
      prev && Math.abs(prev.scale - scale) < 0.005 ? prev : { key: start.key, scale },
    );
  };

  const handleSceneEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.delete(event.pointerId)) return;
    if (!pinchStartRef.current || pointersRef.current.size >= 2) return;
    // Fingers lifted: commit the final size as ONE undo step.
    const { key } = pinchStartRef.current;
    pinchStartRef.current = null;
    const target = items.find((item) => keyOf(item) === key);
    const finalScale = pinch?.scale;
    setPinch(null);
    if (target && finalScale !== undefined && finalScale !== (settledOf(target).scale ?? 1)) {
      onChange?.(key, { ...positionOf(target), scale: finalScale });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: ScenePiece) => {
    if (!onChange) return;
    if ((event.key === "Delete" || event.key === "Backspace") && onRemove) {
      event.preventDefault();
      removePiece(item);
      return;
    }
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
    const support = getPlacement(item, scene).zone === "surface" ? supportOf(current) : null;
    if (support) {
      // Resting on a surface: arrows slide along it (up/down do nothing).
      const childHalf = itemBoxPct(item, scene, "surface", 2).w / 2;
      const range = Math.max(0, support.halfWidth - childHalf);
      const dx = Math.min(range, Math.max(-range, (current.dx ?? 0) + move[0]));
      if (dx !== (current.dx ?? 0)) onChange(keyOf(item), { ...settledOf(item), dx });
      return;
    }
    const next = clampPosition(
      { x: current.x + move[0], y: current.y + move[1] },
      item,
      scene,
    );
    if (next.x === current.x && next.y === current.y) return;
    onChange(keyOf(item), { ...current, x: next.x, y: next.y });
  };

  // Stable callbacks for the memoised pieces: they always call the latest
  // handler, so memo() can skip pieces whose own props didn't change.
  const latest = useRef({
    down: handlePointerDown,
    move: handlePointerMove,
    end: handlePointerEnd,
    key: handleKeyDown,
  });
  useLayoutEffect(() => {
    latest.current = {
      down: handlePointerDown,
      move: handlePointerMove,
      end: handlePointerEnd,
      key: handleKeyDown,
    };
  });
  const onPieceDown = useCallback(
    (event: React.PointerEvent, item: ScenePiece) => latest.current.down(event, item),
    [],
  );
  const onPieceMove = useCallback(
    (event: React.PointerEvent, item: ScenePiece) => latest.current.move(event, item),
    [],
  );
  const onPieceEnd = useCallback((item: ScenePiece) => latest.current.end(item), []);
  const onPieceKey = useCallback(
    (event: React.KeyboardEvent, item: ScenePiece) => latest.current.key(event, item),
    [],
  );
  const onPieceFocus = useCallback((item: ScenePiece) => setSelectedKey(keyOf(item)), []);
  const onImageError = useCallback(
    (essentialId: string) => setFailedImages((prev) => new Set(prev).add(essentialId)),
    [],
  );

  const selected = items.find((item) => keyOf(item) === selectedKey);
  const selectedPosition = selected ? positionOf(selected) : null;
  const selectedScale = selectedPosition?.scale ?? 1;
  const selectedPrice = selected ? (availability[selected._id]?.price ?? selected.price) : null;

  const selectedPlacement = selected ? getPlacement(selected, scene) : null;
  const isWallSelected = selectedPlacement?.zone === "wall";
  const selectedElevation =
    selected && selectedPosition && isWallSelected
      ? wallElevationCm(selected, selectedPosition, scene)
      : null;

  const isSurfaceSelected = selectedPlacement?.zone === "surface";
  const selectedSupports =
    selected && isSurfaceSelected ? supportInfos(keyOf(selected)) : [];
  // "Place on…" labels: duplicate names get a number so they stay distinguishable.
  const supportLabels = selectedSupports.map((support) => {
    const same = selectedSupports.filter((other) => other.name === support.name);
    return same.length > 1
      ? `${support.name} (${same.indexOf(support) + 1})`
      : support.name;
  });
  const placeOnValue =
    selectedPosition?.onKey && selectedSupports.some((s) => s.key === selectedPosition.onKey)
      ? selectedPosition.onKey
      : "floor";

  // The keyboard / touch / screen-reader way to put a piece on a surface (or
  // back on the floor) without dragging.
  const placeOn = (value: string) => {
    if (!selected || !selectedPosition) return;
    const settled = settledOf(selected);
    if (value === "floor") {
      onChange?.(keyOf(selected), {
        ...settled,
        x: selectedPosition.x,
        y: surfaceRestY(scene),
        onKey: undefined,
        dx: undefined,
      });
      return;
    }
    const target = selectedSupports.find((support) => support.key === value);
    if (!target) return;
    onChange?.(keyOf(selected), {
      ...settled,
      x: target.x,
      y: target.topY,
      onKey: target.key,
      dx: 0,
    });
  };

  // Raise / Lower a wall piece by a few cm (clamped between baseboard and ceiling).
  const moveWall = (deltaCm: number) => {
    if (!selected || !selectedPosition || selectedElevation === null) return;
    const y = yForWallElevation(
      selected,
      selectedElevation + deltaCm,
      scene,
      selectedPosition.scale,
    );
    const next = clampPosition({ ...selectedPosition, y }, selected, scene);
    if (next.y !== selectedPosition.y) tweak({ y: next.y });
  };

  // Heads-up for wall pieces sitting on a window/door/frame (allowed, just flagged).
  const overlaps = isInteractive
    ? getFixtureOverlaps(
        items.map((item) => ({ item, position: positionOf(item) })),
        scene,
      )
    : [];

  const allNotices = [
    ...notices,
    ...(overlaps.length > 0
      ? [
          `${overlaps
            .map((overlap) => `${overlap.name} overlaps ${overlap.fixture}`)
            .join("; ")}. Move it if you'd rather keep it clear.`,
        ]
      : []),
  ];

  const tweak = (patch: Partial<ScenePosition>) => {
    if (!selected || !selectedPosition) return;
    onChange?.(keyOf(selected), { ...selectedPosition, ...patch });
  };

  // Paint order of a supporting piece, so its resting pieces sit just above it.
  const baseZ = (item: ScenePiece): number => {
    const position = positionOf(item);
    const { zone, layer } = getPlacement(item, scene);
    return (
      (position.front ? 500 : 0) +
      (zone === "wall" || zone === "ceiling" ? 50 + layer : layer * 100 + Math.round(position.y))
    );
  };

  // Pinned only on phones (CSS) and only once there is something to arrange.
  const isSticky = sticky && isInteractive && !compact && items.length > 0;
  // With no pieces yet the room is not pinned, but it is still kept short on phones.
  const isCapped = sticky && isInteractive && !compact && !isSticky;

  const summary = items.length
    ? `Room preview with ${items.map((item) => item.name).join(", ")}.`
    : "Empty room preview.";

  return (
    <div
      className={`${styles.wrapper}${compact ? ` ${styles.wrapperCompact}` : ""}${
        isSticky ? ` ${styles.wrapperSticky}` : ""
      }${isCapped ? ` ${styles.wrapperCapped}` : ""}`}
    >
      <div className={styles.stage} data-sticky-stage={isSticky ? "" : undefined}>
        <div
          ref={sceneRef}
          className={`${styles.scene}${
            isInteractive && selectedKey ? ` ${styles.sceneSelected}` : ""
          }`}
          style={{ aspectRatio: scene.aspect, "--scene-aspect": scene.aspect } as React.CSSProperties}
          tabIndex={isInteractive ? -1 : undefined}
          data-room-scene={isInteractive ? "" : undefined}
          role={isInteractive ? "group" : "img"}
          aria-label={
            isInteractive
              ? "Room preview. Drag pieces to arrange them; select a piece to resize or flip it."
              : summary
          }
          onPointerDown={handleSceneDown}
          onPointerMove={handleSceneMove}
          onPointerUp={handleSceneEnd}
          onPointerCancel={handleSceneEnd}
        >
          <SceneBackdrop scene={scene} simple={compact} />
          {showScale && <ScaleFigure scene={scene} />}

          {/* While a resting piece is dragged, mark every shelf / worktop it can land on. */}
          {isInteractive &&
            drag !== null &&
            getPlacement(itemByKey.get(drag.id) ?? items[0], scene).zone === "surface" &&
            spaceSupports.map((support) => (
              <span
                key={support.key}
                aria-hidden="true"
                className={`${styles.surfaceHint}${
                  drag.onKey === support.key ? ` ${styles.surfaceHintActive}` : ""
                }`}
                style={{
                  left: `${support.x - support.halfWidth}%`,
                  width: `${support.halfWidth * 2}%`,
                  top: `${support.topY}%`,
                }}
              />
            ))}

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
            // A piece on a support inherits the support's perspective factor so
            // the pair keep their relative size.
            const support = zone === "surface" ? supportOf(position) : null;
            const box = itemBoxPct(
              item,
              scene,
              zone,
              layer,
              (position.scale ?? 1) *
                (support ? support.depth : depthScale(zone, position.y, scene)),
            );
            const isSupportTarget =
              isInteractive && drag !== null && drag.onKey === keyOf(item);
            const offersSupport =
              isInteractive &&
              drag !== null &&
              drag.id !== keyOf(item) &&
              getPlacement(itemByKey.get(drag.id) ?? item, scene).zone === "surface" &&
              getPlacement(item, scene).supports;
            const zIndex =
              // Painted above everything when brought to the front, and above
              // even that while being dragged.
              (isDragging ? 1000 : 0) +
              (position.front ? 500 : 0) +
              (support
                ? // Just above whatever it rests on (a room fixture: above wall
                  // pieces, below anything standing on the floor).
                  itemByKey.has(support.key)
                  ? baseZ(itemByKey.get(support.key) as ScenePiece) + 1
                  : FIXED_SUPPORT_Z
                : zone === "wall" || zone === "ceiling"
                  ? 50 + layer
                  : layer * 100 + Math.round(position.y));

            const stockLabel = isUnavailable
              ? entry?.stock === 0
                ? "Out of stock"
                : "Unavailable"
              : null;
            const dragLabel =
              pinch?.key === keyOf(item)
                ? `Size ${Math.round(pinch.scale * 100)}%`
                : isDragging && zone === "wall"
                  ? `${wallElevationCm(item, position, scene)} cm from floor`
                  : null;

            return (
              <ScenePieceView
                key={keyOf(item)}
                item={item}
                interactive={isInteractive}
              compact={compact}
                zone={zone}
                layer={layer}
                x={position.x}
                y={position.y}
                width={box.w}
                height={box.h}
                zIndex={zIndex}
                flipped={Boolean(position.flipped)}
                imageFailed={failedImages.has(item._id)}
                isDragging={isDragging}
                isSelected={isSelected}
                isUnavailable={isUnavailable}
                stockLabel={stockLabel}
                offersSupport={Boolean(offersSupport)}
                isSupportTarget={isSupportTarget}
                dragLabel={dragLabel}
                dragLabelBelow={position.y < 10}
                onPointerDown={onPieceDown}
                onPointerMove={onPieceMove}
                onPointerEnd={onPieceEnd}
                onKeyDown={onPieceKey}
                onFocusPiece={onPieceFocus}
                onImageError={onImageError}
              />
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
              <span className={styles.toolbarName}>
                {selected.name}
                {selectedPrice !== null && ` · ₹${selectedPrice.toLocaleString("en-IN")}`}
              </span>
              <span
              className={`${styles.toolbarSize}${
                selected.dimensionsCm?.w === undefined ? ` ${styles.toolbarSizeMissing}` : ""
              }`}
            >
                {formatDimensions(selected)}
                {selectedElevation !== null &&
                  ` · hangs ${selectedElevation} cm above the floor`}
              </span>
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
              {isSurfaceSelected && (
                <label className={styles.placeOn}>
                  <span>Place on</span>
                  <select
                    value={placeOnValue}
                    onChange={(event) => placeOn(event.target.value)}
                    className={styles.placeOnSelect}
                  >
                    <option value="floor">The floor</option>
                    {selectedSupports.map((support, index) =>
                      support.fixed ? null : (
                        <option key={support.key} value={support.key}>
                          {supportLabels[index]}
                        </option>
                      ),
                    )}
                    {selectedSupports.some((support) => support.fixed) && (
                      <optgroup label="In the room">
                        {selectedSupports.map((support, index) =>
                          support.fixed ? (
                            <option key={support.key} value={support.key}>
                              {supportLabels[index]}
                            </option>
                          ) : null,
                        )}
                      </optgroup>
                    )}
                  </select>
                </label>
              )}
              {isWallSelected && (
                <>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => moveWall(WALL_NUDGE_CM)}
                    aria-label={`Raise ${WALL_NUDGE_CM} cm`}
                  >
                    Raise
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => moveWall(-WALL_NUDGE_CM)}
                    aria-label={`Lower ${WALL_NUDGE_CM} cm`}
                  >
                    Lower
                  </button>
                </>
              )}
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
              {onRemove && (
                <button
                  type="button"
                  className={`${styles.toolButton} ${styles.toolButtonDanger}`}
                  onClick={() => removePiece(selected)}
                  aria-label={`Remove ${selected.name}`}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isInteractive && !compact && (
        <div className={styles.roomBar}>
          {leadingActions}
          <span className={styles.roomBarSpacer} />
          <button
            type="button"
            className={styles.tidy}
            onClick={() => setShowScale((on) => !on)}
            aria-pressed={showScale}
          >
            {showScale ? "Hide scale" : "Show scale"}
          </button>
          {onTidy && items.length > 0 && (
            <button type="button" className={styles.tidy} onClick={onTidy}>
              Tidy up
            </button>
          )}
          {trailingActions}
        </div>
      )}

      {isInteractive && !compact && showHint && items.length > 0 && (
        <p className={styles.hint} role="note">
          <span aria-hidden="true">👆</span>
          <span className={styles.hintText}>
            Drag a piece to move it. Tap one to flip or remove it, or pinch to resize.
          </span>
          <button type="button" className={styles.hintDismiss} onClick={dismissHint}>
            Got it
          </button>
        </p>
      )}

      {allNotices.length > 0 && (
        <ul className={styles.notices} role="status">
          {allNotices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      )}

      {!compact && (
        <p className={styles.caption}>
          Illustrative preview — real colours, sizes and finishes may differ.
        </p>
      )}
    </div>
  );
}

// Memoised: unrelated state changes in the parent (undo availability, the
// order total, a text field) don't redraw the room.
export default memo(RoomScene);
