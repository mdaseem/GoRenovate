import React from "react";
import styles from "./OrderStatusTimeline.module.css";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  OrderStatus,
  OrderStatusHistoryEntry,
} from "@/app/types/order";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function findHistoryEntry(
  history: OrderStatusHistoryEntry[],
  status: OrderStatus,
): OrderStatusHistoryEntry | undefined {
  // Last matching entry — e.g. a retried APPROVED step should show its
  // most recent attempt, not the first.
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].status === status) return history[i];
  }
  return undefined;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  status,
  statusHistory,
}) => {
  const isTerminal = status === "REJECTED" || status === "CANCELLED";

  if (isTerminal) {
    const reachedSteps = ORDER_STATUS_STEPS.filter((step) =>
      statusHistory.some((entry) => entry.status === step),
    );
    const terminalEntry = findHistoryEntry(statusHistory, status);

    return (
      <ol className={styles.timeline} aria-label="Order status">
        {reachedSteps.map((step) => {
          const entry = findHistoryEntry(statusHistory, step);
          return (
            <li key={step} className={styles.step}>
              <span className={`${styles.marker} ${styles.markerDone}`} aria-hidden="true" />
              <div className={styles.stepBody}>
                <span className={styles.stepLabel}>
                  {ORDER_STATUS_LABELS[step]}
                </span>
                {entry && (
                  <span className={styles.stepTime}>
                    {formatTimestamp(entry.changedAt)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
        <li className={styles.step} aria-current="step">
          <span
            className={`${styles.marker} ${styles.markerTerminal}`}
            aria-hidden="true"
          />
          <div className={styles.stepBody}>
            <span className={`${styles.stepLabel} ${styles.stepLabelTerminal}`}>
              {ORDER_STATUS_LABELS[status]}
            </span>
            {terminalEntry?.changedAt && (
              <span className={styles.stepTime}>
                {formatTimestamp(terminalEntry.changedAt)}
              </span>
            )}
            {terminalEntry?.note && (
              <span className={styles.stepNote}>{terminalEntry.note}</span>
            )}
          </div>
        </li>
      </ol>
    );
  }

  const currentIndex = ORDER_STATUS_STEPS.indexOf(status);

  return (
    <ol className={styles.timeline} aria-label="Order status">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const entry = findHistoryEntry(statusHistory, step);
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li
            key={step}
            className={styles.step}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={`${styles.marker} ${
                isCompleted ? styles.markerDone : styles.markerUpcoming
              } ${isCurrent ? styles.markerCurrent : ""}`}
              aria-hidden="true"
            />
            <div className={styles.stepBody}>
              <span
                className={`${styles.stepLabel} ${
                  isCompleted ? "" : styles.stepLabelUpcoming
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
              {entry && (
                <span className={styles.stepTime}>
                  {formatTimestamp(entry.changedAt)}
                </span>
              )}
              {entry?.note && (
                <span className={styles.stepNote}>{entry.note}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderStatusTimeline;
