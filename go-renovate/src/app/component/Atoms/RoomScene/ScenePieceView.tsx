"use client";
import React, { memo } from "react";
import Image from "next/image";
import styles from "./RoomScene.module.css";
import { ScenePiece } from "@/app/utils/roomScene";
import { cutoutImageProps, cutoutSizes } from "@/app/utils/cutoutImage";

type Props = {
  item: ScenePiece;
  interactive: boolean;
  // Thumbnail scene (Browse All card): smaller images are enough.
  compact: boolean;
  zone: "floor" | "wall" | "ceiling" | "surface";
  layer: number;
  // Anchor (% of the scene), size (% of the scene; height null = keep the
  // artwork's proportions) and paint order.
  x: number;
  y: number;
  width: number;
  height: number | null;
  zIndex: number;
  flipped: boolean;
  imageFailed: boolean;
  isDragging: boolean;
  isSelected: boolean;
  isUnavailable: boolean;
  stockLabel: string | null;
  offersSupport: boolean;
  isSupportTarget: boolean;
  // Live "N cm from floor" text while a wall piece is dragged.
  dragLabel: string | null;
  dragLabelBelow: boolean;
  // Handlers MUST be referentially stable (see RoomScene) — that is what lets
  // memo() skip every piece that isn't the one being dragged.
  onPointerDown: (event: React.PointerEvent, item: ScenePiece) => void;
  onPointerMove: (event: React.PointerEvent, item: ScenePiece) => void;
  onPointerEnd: (item: ScenePiece) => void;
  onKeyDown: (event: React.KeyboardEvent, item: ScenePiece) => void;
  onFocusPiece: (item: ScenePiece) => void;
  onImageError: (essentialId: string) => void;
};

// One piece in the room. Memoised: during a drag only the moving piece (and
// anything resting on it) gets new props, so the other pieces — each with an
// image — are not re-rendered on every pointer move.
function ScenePieceView({
  item,
  interactive,
  compact,
  zone,
  layer,
  x,
  y,
  width,
  height,
  zIndex,
  flipped,
  imageFailed,
  isDragging,
  isSelected,
  isUnavailable,
  stockLabel,
  offersSupport,
  isSupportTarget,
  dragLabel,
  dragLabelBelow,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onKeyDown,
  onFocusPiece,
  onImageError,
}: Props) {
  const style = {
    "--x": x,
    "--y": y,
    width: `${width}%`,
    ...(height !== null ? { height: `${height}%` } : {}),
    zIndex,
  } as React.CSSProperties;

  const visual =
    item.cutoutUrl && !imageFailed ? (
      <Image
        src={item.cutoutUrl}
        alt=""
        width={0}
        height={0}
        sizes={cutoutSizes(width, compact)}
        {...cutoutImageProps(item.cutoutUrl)}
        // The scene only mounts a piece when it is wanted (and Browse All
        // thumbnails only near the screen), so no extra lazy-load delay.
        loading="eager"
        decoding="async"
        draggable={false}
        onError={() => onImageError(item._id)}
        className={`${styles.cutout}${height !== null ? ` ${styles.cutoutFit}` : ""}${
          zone === "floor" ? ` ${styles.cutoutFloor}` : ""
        }${flipped ? ` ${styles.flipped}` : ""}`}
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
    zone === "wall" || zone === "ceiling" ? styles.itemHung : styles.itemFloor
  }${isDragging ? ` ${styles.itemDragging}` : ""}${
    isUnavailable ? ` ${styles.itemUnavailable}` : ""
  }${interactive ? ` ${styles.itemInteractive}` : ""}${
    isSelected ? ` ${styles.itemSelected}` : ""
  }${offersSupport ? ` ${styles.itemSupport}` : ""}${
    isSupportTarget ? ` ${styles.itemSupportActive}` : ""
  }`;

  const badge = stockLabel ? <span className={styles.badge}>{stockLabel}</span> : null;

  // A soft contact shadow grounds standing pieces (not flat rugs).
  const shadow =
    zone === "floor" && layer >= 1 ? (
      <span className={styles.shadow} aria-hidden="true" />
    ) : null;

  if (!interactive) {
    return (
      <div className={className} style={style}>
        {shadow}
        {visual}
        {badge}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={`${item.name}. Drag or use the arrow keys to move it.`}
      aria-pressed={isSelected}
      onPointerDown={(event) => onPointerDown(event, item)}
      onPointerMove={(event) => onPointerMove(event, item)}
      onPointerUp={() => onPointerEnd(item)}
      onPointerCancel={() => onPointerEnd(item)}
      onKeyDown={(event) => onKeyDown(event, item)}
      onFocus={() => onFocusPiece(item)}
    >
      {shadow}
      {visual}
      {badge}
      {dragLabel && (
        <span
          className={`${styles.dragLabel}${dragLabelBelow ? ` ${styles.dragLabelBelow}` : ""}`}
          aria-hidden="true"
        >
          {dragLabel}
        </span>
      )}
    </button>
  );
}

export default memo(ScenePieceView);
