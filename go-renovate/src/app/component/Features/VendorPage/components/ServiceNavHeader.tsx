import React from "react";
import styles from "./ServiceNavHeader.module.css";

interface ServiceNavHeaderProps {
  index: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const ServiceNavHeader: React.FC<ServiceNavHeaderProps> = ({
  index,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) => {
  if (total <= 1) return null;

  return (
    <div className={styles.nav} role="group" aria-label="Browse services">
      <button
        type="button"
        className={styles.navButton}
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous service"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6L9 12L15 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <span className={styles.counter} aria-live="polite" aria-atomic="true">
        {index + 1} / {total}
      </span>

      <button
        type="button"
        className={styles.navButton}
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next service"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 6L15 12L9 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default ServiceNavHeader;
