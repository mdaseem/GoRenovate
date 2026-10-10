"use client";
import React, { useState } from "react";
import styles from "./RoomSizeControl.module.css";
import {
  MAX_CEILING_HEIGHT_CM,
  MAX_ROOM_WIDTH_CM,
  MIN_CEILING_HEIGHT_CM,
  MIN_ROOM_WIDTH_CM,
} from "@/app/utils/sceneSpec";

type Props = {
  // The user's own width / ceiling height in cm, or null while they're using
  // the space's own.
  widthCm: number | null;
  heightCm: number | null;
  // The chosen space's own values in cm (what "reset" returns to).
  defaultWidthCm: number;
  defaultHeightCm: number;
  onWidthChange: (cm: number | null) => void;
  onHeightChange: (cm: number | null) => void;
};

function toMetres(cm: number): string {
  return String(Number((cm / 100).toFixed(2)));
}

// One labelled number field in metres. While it is being edited it shows
// exactly what was typed; otherwise it mirrors the committed value (or the
// space's own). Valid values apply live; invalid ones explain themselves and
// leave the scene alone.
function MetreField({
  id,
  label,
  valueCm,
  defaultCm,
  minCm,
  maxCm,
  onChange,
}: {
  id: string;
  label: string;
  valueCm: number | null;
  defaultCm: number;
  minCm: number;
  maxCm: number;
  onChange: (cm: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? toMetres(valueCm ?? defaultCm);
  const minM = minCm / 100;
  const maxM = maxCm / 100;
  const parsed = draft === null ? null : Number.parseFloat(draft);
  const hasError =
    draft !== null && (Number.isNaN(parsed) || parsed! < minM || parsed! > maxM);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.1"
          min={minM}
          max={maxM}
          value={shown}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const metres = Number.parseFloat(next);
            if (!Number.isNaN(metres) && metres >= minM && metres <= maxM) {
              onChange(Math.round(metres * 100));
            }
          }}
          onBlur={() => setDraft(null)}
          className={styles.input}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        <span className={styles.unit}>m</span>
      </div>
      {hasError && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          Enter a value between {minM} and {maxM} m.
        </p>
      )}
    </div>
  );
}

// "Fit my room": the user's real room width and ceiling height, so the preview
// is drawn to scale in a room that size (and the "too wide / too tall" notices
// use it).
export default function RoomSizeControl({
  widthCm,
  heightCm,
  defaultWidthCm,
  defaultHeightCm,
  onWidthChange,
  onHeightChange,
}: Props) {
  const isCustom = widthCm !== null || heightCm !== null;

  return (
    <div className={styles.control}>
      <div className={styles.fields}>
        <MetreField
          id="custom-room-width"
          label="Room width"
          valueCm={widthCm}
          defaultCm={defaultWidthCm}
          minCm={MIN_ROOM_WIDTH_CM}
          maxCm={MAX_ROOM_WIDTH_CM}
          onChange={onWidthChange}
        />
        <MetreField
          id="custom-room-height"
          label="Ceiling height"
          valueCm={heightCm}
          defaultCm={defaultHeightCm}
          minCm={MIN_CEILING_HEIGHT_CM}
          maxCm={MAX_CEILING_HEIGHT_CM}
          onChange={onHeightChange}
        />
      </div>
      <p className={styles.hint}>
        Pieces are drawn to scale in a room this size.
        {isCustom && (
          <>
            {" "}
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                onWidthChange(null);
                onHeightChange(null);
              }}
            >
              Use this space&apos;s {toMetres(defaultWidthCm)} ×{" "}
              {toMetres(defaultHeightCm)} m
            </button>
          </>
        )}
      </p>
    </div>
  );
}
