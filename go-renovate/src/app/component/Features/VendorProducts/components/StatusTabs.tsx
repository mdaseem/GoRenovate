import React from "react";
import styles from "../VendorProducts.module.css";
import { PRODUCT_STATUS_LABELS, ProductStatus } from "@/app/types/vendorProducts";

export interface StatusTab<T extends string> {
  value: T;
  label: string;
  // Tabs whose products wait for somebody get the amber count.
  alert?: boolean;
}

interface StatusTabsProps<T extends string> {
  label: string;
  tabs: StatusTab<T>[];
  value: T;
  counts: Partial<Record<T, number>> | null;
  onChange: (value: T) => void;
}

// Filter chips with a count in each, shared by the vendor's list and the owner's review screen.
function StatusTabs<T extends string>({ label, tabs, value, counts, onChange }: StatusTabsProps<T>) {
  return (
    <nav className={styles.tabsBar} aria-label={label}>
      <ul className={styles.tabs}>
        {tabs.map((tab) => {
          const count = counts ? (counts[tab.value] ?? 0) : null;
          return (
            <li key={tab.value} className={styles.tabItem}>
              <button
                type="button"
                className={styles.tab}
                aria-pressed={value === tab.value}
                aria-label={count === null ? tab.label : `${tab.label}, ${count}`}
                onClick={() => onChange(tab.value)}
              >
                {tab.label}
                {count !== null && (
                  <span
                    className={`${styles.tabCount} ${tab.alert && count > 0 ? styles.tabCountAlert : ""}`}
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
}

export default StatusTabs;

// The tab names used on both screens.
export const productTabs = (includeAll: boolean): StatusTab<ProductStatus | "all">[] => [
  ...(includeAll ? [{ value: "all" as const, label: "All" }] : []),
  { value: "live", label: PRODUCT_STATUS_LABELS.live },
  { value: "pending", label: PRODUCT_STATUS_LABELS.pending, alert: true },
  { value: "paused", label: PRODUCT_STATUS_LABELS.paused },
  { value: "rejected", label: PRODUCT_STATUS_LABELS.rejected },
];

