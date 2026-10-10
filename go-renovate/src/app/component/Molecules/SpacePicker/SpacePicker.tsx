import React from "react";
import styles from "./SpacePicker.module.css";
import SceneBackdrop from "../../Atoms/RoomScene/SceneBackdrop";
import { SpaceTemplate } from "@/app/types/category";
import { resolveSpaceTemplate } from "@/app/utils/sceneSpec";

type Props = {
  spaces: SpaceTemplate[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

function formatWidth(widthCm: number): string {
  const metres = widthCm / 100;
  return `${Number.isInteger(metres) ? metres : metres.toFixed(1)} m wide`;
}

// "Choose your space": a row of the base layouts available for this category
// (see the room-visual-preview skill). Native radio inputs, so arrow keys and
// screen readers work for free; the row scrolls sideways on narrow screens.
// Switching is non-destructive — pieces stay and each space remembers its own
// arrangement — so it is safe to offer at any point.
export default function SpacePicker({ spaces, selectedSlug, onSelect }: Props) {
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Choose your space</legend>
      <div className={styles.track}>
        {spaces.map((space) => {
          const inputId = `custom-space-${space.slug}`;
          const isSelected = space.slug === selectedSlug;
          const thumb = resolveSpaceTemplate(space);
          return (
            <div key={space.slug} className={styles.option}>
              <input
                type="radio"
                id={inputId}
                name="custom-space"
                className={styles.radio}
                checked={isSelected}
                onChange={() => onSelect(space.slug)}
              />
              <label
                htmlFor={inputId}
                className={`${styles.card}${isSelected ? ` ${styles.cardSelected}` : ""}`}
              >
                <span
                  className={styles.thumb}
                  // Fixed 16:10 thumbnail for every card (a tall room is cropped from the
                  // top, never squashed) so the row stays even.
                  style={{ aspectRatio: 1.6 }}
                  aria-hidden="true"
                >
                  <SceneBackdrop scene={thumb} />
                  {isSelected && <span className={styles.tick}>✓</span>}
                </span>
                <span className={styles.name}>{space.name}</span>
                <span className={styles.meta}>{formatWidth(space.sceneWidthCm)}</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
