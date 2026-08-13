import React from "react";
import styles from "./OrderStatusBadge.module.css";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/app/types/order";

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  PLACED: { bg: "#FFF8E1", text: "#8A6C00" },
  APPROVED: { bg: "#E8F0FE", text: "#2A50A0" },
  SHIPMENT_CREATED: { bg: "#E6F8F6", text: "#1F8A7A" },
  PICKUP_SCHEDULED: { bg: "#E6F8F6", text: "#1F8A7A" },
  IN_TRANSIT: { bg: "#F0EAF8", text: "#6A3FA0" },
  DELIVERED: { bg: "#EAF7EC", text: "#1F6B25" },
  REJECTED: { bg: "#FDEEF0", text: "#A13A53" },
  CANCELLED: { bg: "#EFEFEF", text: "#555555" },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={styles.badge}
      style={{ background: color.bg, color: color.text }}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
};

export default OrderStatusBadge;
