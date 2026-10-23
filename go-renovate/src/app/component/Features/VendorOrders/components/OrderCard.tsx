import React from "react";
import Link from "next/link";
import styles from "../VendorOrders.module.css";
import { VendorOrder, VendorOrderCounts } from "@/app/types/vendorOrders";
import { formatRupees, fullDateTime, summariseItems, timeAgo } from "@/app/utils/vendorOrderFormat";
import OrderActions from "./OrderActions";
import OrderChip from "./OrderChip";

interface OrderCardProps {
  order: VendorOrder;
  now: number;
  token: string;
  onUpdated: (order: VendorOrder, counts: VendorOrderCounts, message: string) => void;
  onStale: () => void;
}

// One order in the inbox. The whole card opens the order (one real link on the order number,
// stretched over the card); the action buttons sit above it so they stay separately tappable.
const OrderCard: React.FC<OrderCardProps> = ({ order, now, token, onUpdated, onStale }) => (
  <li className={`${styles.card} ${order.status === "PLACED" ? styles.cardNew : ""}`}>
    <div className={styles.cardHead}>
      <div>
        <h3 className={styles.orderNumber}>
          <Link href={`/vendor/orders/${order.id}`} className={styles.orderLink}>
            {order.orderNumber}
          </Link>
        </h3>
        <time className={styles.time} dateTime={order.createdAt} title={fullDateTime(order.createdAt)}>
          {timeAgo(order.createdAt, now)}
        </time>
      </div>
      <OrderChip status={order.status} />
    </div>

    <p className={styles.itemsLine}>{summariseItems(order)}</p>
    <p className={styles.meta}>
      <span className={styles.metaStrong}>{formatRupees(order.subtotal)}</span> · {order.itemCount} item
      {order.itemCount === 1 ? "" : "s"}
      {order.delivery.city ? ` · ${order.delivery.city}` : ""}
    </p>

    <OrderActions order={order} token={token} onUpdated={onUpdated} onStale={onStale} />
  </li>
);

export default OrderCard;
