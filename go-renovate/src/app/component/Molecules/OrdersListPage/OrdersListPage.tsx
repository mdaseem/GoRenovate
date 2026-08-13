"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./OrdersListPage.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { getOrders } from "@/app/store/features/orderSlice";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import OrderStatusBadge from "../../Atoms/OrderStatusBadge/OrderStatusBadge";
import BackLink from "../../Atoms/BackLink/BackLink";
import { OrderSummary } from "@/app/types/order";

function OrdersListSkeleton() {
  return (
    <div className={styles.skeletonList} aria-hidden="true">
      {[1, 2, 3].map((key) => (
        <div className={styles.skeletonCard} key={key} />
      ))}
    </div>
  );
}

const OrdersListPage: React.FC = () => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { orders, isLoading, error } = useAppSelector(
    (state: RootState) => state.orderState,
  );

  useEffect(() => {
    if (session?.backendToken) {
      dispatch(getOrders({ token: session.backendToken }));
    }
  }, [session?.backendToken, dispatch]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <BackLink className={styles.backLink} />
        <OrdersListSkeleton />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className={styles.page}>
        <BackLink className={styles.backLink} />
        <ErrorState
          variant="page"
          title="Sign in to view your orders"
          message="Once you're signed in, every quote you've checked out with will show up here."
          actionLabel="Sign in"
          onAction={() => dispatch(setOpenStateLogin(true))}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <BackLink className={styles.backLink} />
      <h1 className={styles.heading}>My Orders</h1>

      {isLoading && <OrdersListSkeleton />}

      {!isLoading && error && (
        <ErrorState
          variant="inline"
          title="Couldn't load your orders"
          message={error}
        />
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            📦
          </span>
          <p className={styles.emptyText}>No orders yet</p>
          <p className={styles.emptySubtext}>
            Browse vendors and check out a quote to see it here.
          </p>
          <Link href="/vendors" className={styles.emptyAction}>
            Browse vendors
          </Link>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <ul className={styles.list} role="list">
          {orders.map((order: OrderSummary) => {
            const formattedTotal = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(order.total);
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short", year: "numeric" },
            );

            return (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.orderNumber}>
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className={styles.vendorName}>{order.vendorName}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.meta}>
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} ·{" "}
                      {formattedDate}
                    </span>
                    <span className={styles.total}>{formattedTotal}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OrdersListPage;
