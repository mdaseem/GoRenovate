import React from "react";
import styles from "../VendorProducts.module.css";
import { PRODUCT_STATUS_LABELS, ProductStatus } from "@/app/types/vendorProducts";

const CHIP_CLASS: Record<ProductStatus, string> = {
  live: styles.chipLive,
  pending: styles.chipPending,
  paused: styles.chipPaused,
  rejected: styles.chipRejected,
};

// A product's status in plain words (Live, In review, Paused, Needs changes), as text with a dot.
const ProductStatusChip: React.FC<{ status: ProductStatus }> = ({ status }) => (
  <span className={`${styles.chip} ${CHIP_CLASS[status]}`}>{PRODUCT_STATUS_LABELS[status]}</span>
);

export default ProductStatusChip;
