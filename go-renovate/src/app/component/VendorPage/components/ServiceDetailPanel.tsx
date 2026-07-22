"use client";

import React, { useCallback, useEffect, useRef } from "react";
import styles from "./ServiceDetailPanel.module.css";
import ServiceDetail from "../../Molecules/ServiceDetail/ServiceDetail";
import { ServiceOption } from "../vendor";
import { NavigationDirection } from "../hooks/useServiceNavigation";

interface ServiceDetailPanelProps {
  service: ServiceOption;
  categoryLabel: string;
  quantity: number;
  hasPrev: boolean;
  hasNext: boolean;
  direction: NavigationDirection;
  onAdd: (service: ServiceOption, categoryLabel: string) => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_RESTRAINT = 80;

const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({
  service,
  categoryLabel,
  quantity,
  hasPrev,
  hasNext,
  direction,
  onAdd,
  onIncrement,
  onDecrement,
  onPrev,
  onNext,
}) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD ||
        Math.abs(deltaY) > SWIPE_RESTRAINT
      ) {
        return;
      }

      if (deltaX < 0 && hasNext) {
        onNext();
      } else if (deltaX > 0 && hasPrev) {
        onPrev();
      }
    },
    [hasNext, hasPrev, onNext, onPrev],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrev) {
        onPrev();
      } else if (event.key === "ArrowRight" && hasNext) {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext]);

  const slideClassName =
    direction === "next"
      ? styles.slideNext
      : direction === "prev"
        ? styles.slidePrev
        : "";

  return (
    <div
      className={styles.panel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {hasPrev && (
        <button
          type="button"
          className={`${styles.navArrow} ${styles.navArrowPrev}`}
          onClick={onPrev}
          aria-label="Previous service"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          className={`${styles.navArrow} ${styles.navArrowNext}`}
          onClick={onNext}
          aria-label="Next service"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 6L15 12L9 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div key={service.id} className={`${styles.slide} ${slideClassName}`}>
        <ServiceDetail
          service={service}
          categoryLabel={categoryLabel}
          quantity={quantity}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </div>
    </div>
  );
};

export default ServiceDetailPanel;
