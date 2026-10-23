"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./VendorOrders.module.css";
import AccountGate from "@/app/component/Features/VendorAccount/components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import OrderStatusTimeline from "@/app/component/Atoms/OrderStatusTimeline/OrderStatusTimeline";
import { useVendorOrder } from "@/app/component/CustomHooks/useVendorOrder";
import { useAppDispatch } from "@/app/store/hooks";
import { setVendorOrderCounts } from "@/app/store/features/vendorOrdersSlice";
import { VendorOrder, VendorOrderCounts, VendorOrderItem } from "@/app/types/vendorOrders";
import { copyToClipboard } from "@/app/utils/clipboard";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/app/utils/productFacts";
import { addressAsText, formatRupees, fullDateTime } from "@/app/utils/vendorOrderFormat";
import OrderActions from "./components/OrderActions";
import OrderChip from "./components/OrderChip";

const GUIDANCE: Partial<Record<VendorOrder["status"], string>> = {
  PLACED: "Check you have everything in stock, then accept. The buyer is waiting for your answer.",
  APPROVED: "Pack the items and hand them to your courier, then mark the order as shipped.",
  SHIPMENT_CREATED: "When the buyer has received the order, mark it as delivered.",
  PICKUP_SCHEDULED: "When the buyer has received the order, mark it as delivered.",
  IN_TRANSIT: "When the buyer has received the order, mark it as delivered.",
  DELIVERED: "Delivered. There is nothing more to do for this order.",
  REJECTED: "You declined this order. The buyer can see your reason.",
  CANCELLED: "This order was cancelled. The buyer can see the reason.",
};

// A small product photo that never leaves an empty box: any failure falls back to the placeholder.
const Thumb: React.FC<{ item: VendorOrderItem }> = ({ item }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed || !item.imageUrl ? PRODUCT_PLACEHOLDER_IMAGE : item.imageUrl}
      alt=""
      width={56}
      height={56}
      unoptimized
      className={styles.thumb}
      onError={() => setFailed(true)}
    />
  );
};

const OrderDetail: React.FC<{ token: string; orderId: string }> = ({ token, orderId }) => {
  const dispatch = useAppDispatch();
  const { order, setOrder, isLoading, notFound, error, reload } = useVendorOrder(token, orderId);
  const [message, setMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  const handleUpdated = useCallback(
    (updated: VendorOrder, counts: VendorOrderCounts, text: string) => {
      dispatch(setVendorOrderCounts(counts));
      setOrder(updated);
      setMessage(text);
    },
    [dispatch, setOrder],
  );

  const copyAddress = async () => {
    if (!order) return;
    if (await copyToClipboard(addressAsText(order))) {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } else {
      setCopyState("failed");
    }
  };

  if (isLoading && !order) {
    return (
      <div className={styles.skeleton} role="status" aria-label="Loading order">
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>
    );
  }
  if (notFound) {
    return (
      <ErrorState
        variant="inline"
        role="status"
        icon="🔍"
        title="We couldn't find this order"
        message="It may not be one of yours, or the link may be wrong."
        actionLabel="Back to your orders"
        href="/vendor/orders"
      />
    );
  }
  if (error || !order) {
    return (
      <ErrorState
        variant="inline"
        title="We couldn't load this order"
        message={error ?? "Please try again."}
        actionLabel="Try again"
        onAction={reload}
      />
    );
  }

  const { delivery } = order;
  const guidance = GUIDANCE[order.status];

  return (
    <div className={styles.detail}>
      {message && (
        <div ref={messageRef} className={styles.message} role="status" tabIndex={-1}>
          <span>{message}</span>
          <Link href="/vendor/orders" className={styles.btnLink}>
            Back to orders
          </Link>
        </div>
      )}

      <section className={styles.section} aria-labelledby="order-summary-heading">
        <div className={styles.summaryTop}>
          <div>
            <h2 id="order-summary-heading" className={styles.summaryNumber}>
              {order.orderNumber}
            </h2>
            <time className={styles.time} dateTime={order.createdAt}>
              Placed {fullDateTime(order.createdAt)}
            </time>
          </div>
          <OrderChip status={order.status} />
        </div>
        {guidance && <p className={styles.guidance}>{guidance}</p>}
        <OrderActions
          order={order}
          token={token}
          onUpdated={handleUpdated}
          onStale={reload}
        />
      </section>

      <section className={styles.section} aria-labelledby="order-items-heading">
        <h2 id="order-items-heading" className={styles.sectionHeading}>
          Pack list
        </h2>
        <ul className={styles.itemList}>
          {order.items.map((item) => (
            <li key={`${item.essentialId ?? item.name}`} className={styles.itemRow}>
              <Thumb item={item} />
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemMeta}>
                  {formatRupees(item.price)} each · {formatRupees(item.price * item.quantity)}
                </p>
              </div>
              <span className={styles.qty} aria-label={`Quantity ${item.quantity}`}>
                ×{item.quantity}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.subtotal}>
          <span>Your part of the order</span>
          <span>{formatRupees(order.subtotal)}</span>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="order-delivery-heading">
        <h2 id="order-delivery-heading" className={styles.sectionHeading}>
          Deliver to
        </h2>
        <address className={styles.address}>
          <span className={styles.addressName}>{delivery.contactName}</span>
          <br />
          {delivery.line1}
          {delivery.line2 ? `, ${delivery.line2}` : ""}
          <br />
          {delivery.city}, {delivery.state} — {delivery.pincode}
          <br />
          {delivery.phone}
        </address>
        <div className={styles.contactActions}>
          {delivery.phone && (
            <a href={`tel:+91${delivery.phone}`} className={styles.btnSecondary}>
              Call buyer
            </a>
          )}
          <button type="button" className={styles.btnSecondary} onClick={copyAddress}>
            {copyState === "copied" ? "Address copied ✓" : "Copy address"}
          </button>
        </div>
        <p className={styles.srOnly} role="status">
          {copyState === "copied" ? "Address copied to the clipboard." : ""}
        </p>
        {copyState === "failed" && (
          <p role="alert" className={styles.error}>
            We couldn&apos;t copy it. You can select the address above instead.
          </p>
        )}
      </section>

      {order.shipment && (
        <section className={styles.section} aria-labelledby="order-shipment-heading">
          <h2 id="order-shipment-heading" className={styles.sectionHeading}>
            Shipping details
          </h2>
          <dl className={styles.shipment}>
            {order.shipment.courierName && (
              <div>
                <dt className={styles.shipmentLabel}>Courier</dt>
                <dd className={styles.shipmentValue}>{order.shipment.courierName}</dd>
              </div>
            )}
            {order.shipment.trackingNumber && (
              <div>
                <dt className={styles.shipmentLabel}>Tracking number</dt>
                <dd className={styles.shipmentValue}>{order.shipment.trackingNumber}</dd>
              </div>
            )}
            {order.shipment.trackingUrl && (
              <div>
                <dt className={styles.shipmentLabel}>Tracking link</dt>
                <dd className={styles.shipmentValue}>
                  <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                    Track shipment
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className={styles.section} aria-labelledby="order-status-heading">
        <h2 id="order-status-heading" className={styles.sectionHeading}>
          Status
        </h2>
        <OrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />
      </section>
    </div>
  );
};

const VendorOrderDetailPage: React.FC<{ orderId: string }> = ({ orderId }) => (
  <AccountGate
    heading="Order details"
    wide
    signedOutTitle="Sign in to see this order"
    signedOutMessage="Sign in with your vendor account."
  >
    {(account, token) =>
      account.role === "vendor" ? (
        <OrderDetail token={token} orderId={orderId} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🏪"
          title="Orders are for vendors"
          message="This page is only available to approved vendors."
          actionLabel="Back to the site"
          href="/"
        />
      )
    }
  </AccountGate>
);

export default VendorOrderDetailPage;
