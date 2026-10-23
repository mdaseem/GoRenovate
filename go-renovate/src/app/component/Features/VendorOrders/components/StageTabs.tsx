import React from "react";
import styles from "../VendorOrders.module.css";
import { STAGE_TAB_LABELS, VENDOR_STAGES, VendorOrderCounts, VendorStage } from "@/app/types/vendorOrders";

interface StageTabsProps {
  stage: VendorStage;
  counts: VendorOrderCounts | null;
  onChange: (stage: VendorStage) => void;
}

// Filter chips for the inbox, with the number of orders in each. They scroll sideways on a narrow
// phone instead of squeezing. Orders waiting on the vendor (New, To ship) get the amber count.
const StageTabs: React.FC<StageTabsProps> = ({ stage, counts, onChange }) => (
  <nav className={styles.tabsBar} aria-label="Order stages">
    <ul className={styles.tabs}>
      {VENDOR_STAGES.map((item) => {
        const count = counts ? counts[item] : null;
        const needsAttention = (item === "new" || item === "accepted") && count !== null && count > 0;
        return (
          <li key={item} className={styles.tabItem}>
            <button
              type="button"
              className={styles.tab}
              aria-pressed={stage === item}
              aria-label={
                count === null
                  ? STAGE_TAB_LABELS[item]
                  : `${STAGE_TAB_LABELS[item]}, ${count} order${count === 1 ? "" : "s"}`
              }
              onClick={() => onChange(item)}
            >
              {STAGE_TAB_LABELS[item]}
              {count !== null && (
                <span
                  className={`${styles.tabCount} ${needsAttention ? styles.tabCountAlert : ""}`}
                  aria-hidden="true"
                >
                  {count}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default StageTabs;
