import React from "react";
import styles from "./RoomScene.module.css";
import { ResolvedScene } from "@/app/utils/sceneSpec";

// A 170 cm person standing on the floor, drawn with the same scale as the
// room, as a quick "does this fit?" reference. Decorative (aria-hidden) and not
// interactive; toggled from the scene's caption row.
const SCALE_FIGURE_HEIGHT_CM = 170;
const FIGURE_WIDTH_CM = 45;

type Props = {
  scene: ResolvedScene;
};

export default function ScaleFigure({ scene }: Props) {
  const floor = scene.spec.floorLine * 100;
  const band = 100 - floor;
  const widthPct = (FIGURE_WIDTH_CM / scene.sceneWidthCm) * 100;
  const heightPct = (SCALE_FIGURE_HEIGHT_CM / scene.heightCm) * 100;
  // Stands on the same row as the main pieces, near the left edge.
  const bottomY = floor + band * 0.475;

  return (
    <div
      className={styles.scaleFigure}
      aria-hidden="true"
      style={{
        left: `${Math.max(2, widthPct / 2 + 2)}%`,
        bottom: `${100 - bottomY}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
      }}
    >
      <span className={styles.scaleLabel}>{SCALE_FIGURE_HEIGHT_CM} cm</span>
      <svg
        viewBox="0 0 45 170"
        preserveAspectRatio="xMidYMax meet"
        width="100%"
        height="100%"
        fill="currentColor"
      >
        <circle cx="22.5" cy="13" r="11" />
        <rect x="8" y="28" width="29" height="58" rx="11" />
        <rect x="1" y="31" width="8" height="52" rx="4" />
        <rect x="36" y="31" width="8" height="52" rx="4" />
        <rect x="11" y="82" width="10" height="88" rx="4" />
        <rect x="24" y="82" width="10" height="88" rx="4" />
      </svg>
    </div>
  );
}
