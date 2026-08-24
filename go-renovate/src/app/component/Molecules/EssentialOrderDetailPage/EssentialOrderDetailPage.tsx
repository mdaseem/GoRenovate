"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./EssentialOrderDetailPage.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { getEssentialOrderDetail } from "@/app/store/features/essentialOrderSlice";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import OrderStatusBadge from "../../Atoms/OrderStatusBadge/OrderStatusBadge";
import OrderStatusTimeline from "../../Atoms/OrderStatusTimeline/OrderStatusTimeline";
import BackLink from "../../Atoms/BackLink/BackLink";
import { EssentialOrderItem, VendorOrder } from "@/app/types/essentialOrder";

interface EssentialOrderDetailPageProps {
  id: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const EssentialOrderDetailPage: React.FC<EssentialOrderDetailPageProps> = ({
  id,
}) => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoadingDetail, error } = useAppSelector(
    (state: RootState) => state.essentialOrderState,
  );

  useEffect(() => {
    if (session?.backendToken) {
      dispatch(getEssentialOrderDetail({ token: session.backendToken, id }));
    }
  }, [session?.backendToken, id, dispatch]);

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
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={styles.page}>
      <BackLink className={styles.backLink} />
      <div className={styles.header}>
        <p className={styles.orderNumber}>{order.orderNumber}</p>
        <h1 className={styles.heading}>Room order</h1>
        <p className={styles.headerMeta}>
          Placed {formattedDate} · {order.vendorOrders.length} vendor
          {order.vendorOrders.length !== 1 ? "s" : ""} ·{" "}
          {formatCurrency(order.total)} total
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shipping address</h2>
        <p className={styles.address}>
          {order.address.contactName} · {order.address.phone}
          <br />
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}
          <br />
          {order.address.city}, {order.address.state} — {order.address.pincode}
        </p>
      </section>

      {order.vendorOrders.map((vendorOrder: VendorOrder) => (
        <div key={vendorOrder._id} className={styles.vendorBlock}>
          <div className={styles.vendorBlockHeader}>
            <h2 className={styles.vendorBlockTitle}>
              From {vendorOrder.vendorName}
            </h2>
            <OrderStatusBadge status={vendorOrder.status} />
          </div>

          <div className={styles.grid}>
            <div className={styles.column}>
              <ul className={styles.itemsList}>
                {vendorOrder.items.map((item: EssentialOrderItem) => (
                  <li key={item.essentialId} className={styles.item}>
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <span className={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span>{formatCurrency(vendorOrder.subtotal)}</span>
              </div>

              {vendorOrder.shiprocket && (
                <dl className={styles.shipmentInfo}>
                  {vendorOrder.shiprocket.courierName && (
                    <div>
                      <dt>Courier</dt>
                      <dd>{vendorOrder.shiprocket.courierName}</dd>
                    </div>
                  )}
                  {vendorOrder.shiprocket.awbCode && (
                    <div>
                      <dt>AWB</dt>
                      <dd>{vendorOrder.shiprocket.awbCode}</dd>
                    </div>
                  )}
                  {vendorOrder.shiprocket.trackingUrl && (
                    <div>
                      <dt>Tracking</dt>
                      <dd>
                        <a
                          href={vendorOrder.shiprocket.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Track shipment
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            <div className={styles.column}>
              <OrderStatusTimeline
                status={vendorOrder.status}
                statusHistory={vendorOrder.statusHistory}
              />
            </div>
          </div>
        </div>
      ))}

      <div className={styles.section}>
        <div className={styles.orderTotal}>
          <span>Order total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default EssentialOrderDetailPage;
