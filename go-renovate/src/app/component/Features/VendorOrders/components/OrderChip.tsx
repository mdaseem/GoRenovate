import React from "react";
import styles from "../VendorOrders.module.css";
import { OrderStatus } from "@/app/types/order";
import { VENDOR_STATUS_LABELS } from "@/app/types/vendorOrders";

const CHIP_CLASS: Record<OrderStatus, string> = {
  PLACED: styles.chipNew,
  APPROVED: styles.chipAccepted,
  SHIPMENT_CREATED: styles.chipShipped,
  PICKUP_SCHEDULED: styles.chipShipped,
  IN_TRANSIT: styles.chipShipped,
  DELIVERED: styles.chipDelivered,
  REJECTED: styles.chipDeclined,
  CANCELLED: styles.chipCancelled,
};

// A status in the vendor's own words (New, Accepted, Shipped...), as text with a dot, never colour alone.
const OrderChip: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span className={`${styles.chip} ${CHIP_CLASS[status]}`}>{VENDOR_STATUS_LABELS[status]}</span>
);

export default OrderChip;
