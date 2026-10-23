"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./VendorOrders.module.css";
import AccountGate from "@/app/component/Features/VendorAccount/components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { useVendorOrders } from "@/app/component/CustomHooks/useVendorOrders";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setVendorOrderCounts } from "@/app/store/features/vendorOrdersSlice";
import {
  STAGE_TAB_LABELS,
  VendorOrder,
  VendorOrderCounts,
  VendorStage,
} from "@/app/types/vendorOrders";
import OrderCard from "./components/OrderCard";
import StageTabs from "./components/StageTabs";

const EMPTY_COPY: Record<VendorStage, { icon: string; title: string; message: string }> = {
  new: {
    icon: "📭",
    title: "No new orders right now",
    message: "New orders appear here as soon as a buyer checks out. We check again every minute.",
  },
  accepted: {
    icon: "📦",
    title: "Nothing waiting to ship",
    message: "Orders you accept stay here until you mark them as shipped.",
  },
  shipped: {
    icon: "🚚",
    title: "No orders on the way",
    message: "Orders you ship stay here until you mark them as delivered.",
  },
  delivered: {
    icon: "✅",
    title: "No delivered orders yet",
    message: "Orders you have delivered are kept here.",
  },
  closed: {
    icon: "🗂️",
    title: "No declined or cancelled orders",
    message: "Orders you decline or cancel are kept here.",
  },
};

const OrdersInbox: React.FC<{ token: string }> = ({ token }) => {
  const dispatch = useAppDispatch();
  const counts = useAppSelector((state) => state.vendorOrders.counts);
  const [stage, setStage] = useState<VendorStage>("new");
  const [message, setMessage] = useState<{ text: string; stage?: VendorStage } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pickedByVendorRef = useRef(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const onCounts = useCallback(
    (next: VendorOrderCounts) => dispatch(setVendorOrderCounts(next)),
    [dispatch],
  );
  const list = useVendorOrders(token, stage, onCounts);

  // "5 min ago" labels stay honest without every card running its own timer.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // The tab count in the browser tab: "(2) Orders", so a vendor with the page open in the background sees it.
  useEffect(() => {
    const waiting = counts?.new ?? 0;
    document.title = `${waiting > 0 ? `(${waiting}) ` : ""}Orders | Go Renovate`;
  }, [counts?.new]);

  // Open on New; if there is nothing new but something to ship, start there instead (once, and only
  // until the vendor picks a tab themselves).
  useEffect(() => {
    if (pickedByVendorRef.current || list.isLoading || !counts) return;
    if (stage === "new" && counts.new === 0 && counts.accepted > 0) {
      pickedByVendorRef.current = true;
      setStage("accepted");
    }
  }, [stage, counts, list.isLoading]);

  // After an action the confirmation takes the keyboard/screen-reader focus, because the card that
  // had it may have left this list.
  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  const chooseStage = (next: VendorStage) => {
    pickedByVendorRef.current = true;
    setMessage(null);
    setStage(next);
  };

  const handleUpdated = (order: VendorOrder, nextCounts: VendorOrderCounts, text: string) => {
    onCounts(nextCounts);
    list.applyUpdate(order);
    setMessage({ text, stage: order.stage !== stage ? order.stage : undefined });
  };

  const empty = EMPTY_COPY[stage];

  return (
    <>
      <StageTabs stage={stage} counts={counts} onChange={chooseStage} />

      {message && (
        <div ref={messageRef} className={styles.message} role="status" tabIndex={-1}>
          <span>{message.text}</span>
          {message.stage && (
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => chooseStage(message.stage as VendorStage)}
            >
              See in {STAGE_TAB_LABELS[message.stage]}
            </button>
          )}
        </div>
      )}

      <h2 className={styles.srOnly}>{STAGE_TAB_LABELS[stage]} orders</h2>

      {list.isLoading ? (
        <div className={styles.skeleton} role="status" aria-label="Loading orders">
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      ) : list.error ? (
        <ErrorState
          variant="inline"
          title="We couldn't load your orders"
          message={list.error}
          actionLabel="Try again"
          onAction={list.retry}
        />
      ) : list.orders.length === 0 ? (
        <ErrorState
          variant="inline"
          role="status"
          icon={empty.icon}
          title={empty.title}
          message={empty.message}
        />
      ) : (
        <>
          <ul className={styles.list}>
            {list.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                token={token}
                onUpdated={handleUpdated}
                onStale={list.refresh}
              />
            ))}
          </ul>
          {(list.nextCursor || list.loadMoreError) && (
            <div className={styles.more}>
              {list.loadMoreError && (
                <p role="alert" className={styles.error}>
                  {list.loadMoreError}
                </p>
              )}
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={list.loadMore}
                disabled={list.isLoadingMore}
              >
                {list.isLoadingMore ? "Loading…" : "Show older orders"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

const VendorOrdersPage: React.FC = () => (
  <AccountGate
    heading="Orders"
    wide
    signedOutTitle="Sign in to see your orders"
    signedOutMessage="Sign in with your vendor account."
  >
    {(account, token) =>
      account.role === "vendor" ? (
        <OrdersInbox token={token} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🏪"
          title="Orders are for vendors"
          message="Orders from buyers show up here once your application to sell has been approved."
          actionLabel={account.role === "admin" ? "Review applications" : "Apply to sell"}
          href={account.role === "admin" ? "/admin/vendors" : "/sell"}
        />
      )
    }
  </AccountGate>
);

export default VendorOrdersPage;
