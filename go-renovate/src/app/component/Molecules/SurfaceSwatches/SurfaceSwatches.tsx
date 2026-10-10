import React from "react";
import Link from "next/link";
import styles from "./SurfaceSwatches.module.css";
import {
  FLOOR_SWATCHES,
  WALL_SWATCHES,
} from "@/app/utils/surfaceSwatches";

type Props = {
  wallId: string | null;
  floorId: string | null;
  onWallChange: (id: string | null) => void;
  onFloorChange: (id: string | null) => void;
};

type Option = { id: string | null; name: string; color: string | null };

function SwatchGroup({
  legend,
  name,
  options,
  selectedId,
  onSelect,
  round,
}: {
  legend: string;
  name: string;
  options: Option[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  round: boolean;
}) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const inputId = `${name}-${option.id ?? "default"}`;
          const isSelected = option.id === selectedId;
          return (
            <div key={inputId} className={styles.option}>
              <input
                type="radio"
                id={inputId}
                name={name}
                className={styles.radio}
                checked={isSelected}
                onChange={() => onSelect(option.id)}
              />
              <label
                htmlFor={inputId}
                className={`${styles.swatch}${round ? ` ${styles.round}` : ""}${
                  isSelected ? ` ${styles.selected}` : ""
                }${option.color === null ? ` ${styles.defaultSwatch}` : ""}`}
                style={option.color ? { backgroundColor: option.color } : undefined}
                title={option.name}
              >
                <span className={styles.srOnly}>{option.name}</span>
                {isSelected && (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

// "Walls & floor": try a wall colour and a floor material in the preview.
// Both apply to whichever space is chosen. Choosing one offers the matching
// renovation service — the other half of the app — as a link.
export default function SurfaceSwatches({
  wallId,
  floorId,
  onWallChange,
  onFloorChange,
}: Props) {
  const wall = WALL_SWATCHES.find((swatch) => swatch.id === wallId);
  const floor = FLOOR_SWATCHES.find((swatch) => swatch.id === floorId);
  const summary = [wall && `${wall.name} walls`, floor && `${floor.name} floor`]
    .filter(Boolean)
    .join(", ");

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <span className={styles.summaryTitle}>Walls &amp; floor</span>
        <span className={styles.summaryValue}>
          {summary || "Try colours and materials"}
        </span>
      </summary>

      <div className={styles.body}>
        <SwatchGroup
          legend="Wall colour"
          name="custom-wall"
          options={[
            { id: null, name: "Space default", color: null },
            ...WALL_SWATCHES,
          ]}
          selectedId={wallId}
          onSelect={onWallChange}
          round
        />
        <SwatchGroup
          legend="Floor"
          name="custom-floor"
          options={[
            { id: null, name: "Space default", color: null },
            ...FLOOR_SWATCHES,
          ]}
          selectedId={floorId}
          onSelect={onFloorChange}
          round={false}
        />

        {(wall || floor) && (
          <div className={styles.cta}>
            <p className={styles.ctaNote}>
              Colours are approximate. Ready to make it real?
            </p>
            <div className={styles.ctaLinks}>
              {wall && (
                <Link href="/vendors/category/painting" className={styles.ctaLink}>
                  Get the walls painted →
                </Link>
              )}
              {floor && (
                <Link href="/vendors/category/flooring" className={styles.ctaLink}>
                  Get new flooring →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
