"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./OrderDetailPage.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import {
  getOrderDetail,
  updateOrderStatus,
} from "@/app/store/features/orderSlice";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import OrderStatusBadge from "../../Atoms/OrderStatusBadge/OrderStatusBadge";
import OrderStatusTimeline from "../../Atoms/OrderStatusTimeline/OrderStatusTimeline";
import BackLink from "../../Atoms/BackLink/BackLink";
import { UNIT_LABELS } from "../../VendorPage/VendorData";
import { OrderItem } from "@/app/types/order";

interface OrderDetailPageProps {
  id: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ id }) => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoadingDetail, isSubmitting, error } = useAppSelector(
    (state: RootState) => state.orderState,
  );

  useEffect(() => {
    if (session?.backendToken) {
      dispatch(getOrderDetail({ token: session.backendToken, id }));
    }
  }, [session?.backendToken, id, dispatch]);

  const handleSimulateApproval = () => {
    if (!session?.backendToken) return;
    dispatch(
      updateOrderStatus({
        token: session.backendToken,
        id,
        status: "APPROVED",
      }),
    );
  };

  if (status === "loading" || (status === "authenticated" && isLoadingDetail)) {
    return (
      <div className={styles.page}>
        <BackLink className={styles.backLink} />
        <div className={styles.skeleton} aria-hidden="true" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className={styles.page}>
        <BackLink className={styles.backLink} />
        <ErrorState
          variant="page"
          title="Sign in to view this order"
          actionLabel="Sign in"
          onAction={() => dispatch(setOpenStateLogin(true))}
        />
      </div>
    );
  }

  if (!currentOrder || currentOrder._id !== id) {
    if (error) {
      return (
        <div className={styles.page}>
          <BackLink className={styles.backLink} />
          <ErrorState
            variant="page"
            title="Couldn't load this order"
            message={error}
            actionLabel="Back to orders"
            href="/orders"
          />
        </div>
      );
    }
    return (
      <div className={styles.page}>
        <BackLink className={styles.backLink} />
        <div className={styles.skeleton} aria-hidden="true" />
      </div>
    );
  }

  const order = currentOrder;

  return (
    <div className={styles.page}>
      <BackLink className={styles.backLink} />
      <div className={styles.header}>
        <div>
          <p className={styles.orderNumber}>{order.orderNumber}</p>
          <h1 className={styles.vendorName}>{order.vendorName}</h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Items</h2>
            <ul className={styles.itemsList}>
              {order.items.map((item: OrderItem) => {
                const unitLabel = UNIT_LABELS[item.unit] ?? `per ${item.unit}`;
                return (
                  <li key={item.serviceId} className={styles.item}>
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.quantity} × {formatCurrency(item.price)} ·{" "}
                        {unitLabel}
                      </p>
                    </div>
                    <span className={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className={styles.total}>
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping address</h2>
            <p className={styles.address}>
              {order.address.contactName} · {order.address.phone}
              <br />
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address.city}, {order.address.state} —{" "}
              {order.address.pincode}
            </p>
          </section>

          {order.shiprocket && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Shipment</h2>
              <dl className={styles.shipmentInfo}>
                {order.shiprocket.courierName && (
                  <div>
                    <dt>Courier</dt>
                    <dd>{order.shiprocket.courierName}</dd>
                  </div>
                )}
                {order.shiprocket.awbCode && (
                  <div>
                    <dt>AWB</dt>
                    <dd>{order.shiprocket.awbCode}</dd>
                  </div>
                )}
                {order.shiprocket.trackingUrl && (
                  <div>
                    <dt>Tracking</dt>
                    <dd>
                      <a
                        href={order.shiprocket.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Track shipment
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        <div className={styles.column}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Status</h2>
            <OrderStatusTimeline
              status={order.status}
              statusHistory={order.statusHistory}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
