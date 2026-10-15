import React from "react";
import styles from "./View3DButton.module.css";

// "View in 3D" for a product, as a small pill used on picker cards and Browse All
// cards. The caller decides when it shows (only for products with a model) and what
// it opens; `className` lets a card place it (e.g. above a card-wide checkbox).
export default function View3DButton({
  label,
  onClick,
  className = "",
}: {
  // What it opens, for screen readers: "Oak Coffee Table" -> "View Oak Coffee Table in 3D".
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className}`.trim()}
      onClick={onClick}
      aria-label={`View ${label} in 3D`}
    >
      <span aria-hidden="true">⬡</span> 3D
    </button>
  );
}
