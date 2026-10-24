"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import styles from "./VendorProducts.module.css";
import AccountGate from "@/app/component/Features/VendorAccount/components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { usePagedProducts } from "@/app/component/CustomHooks/usePagedProducts";
import { AdminProduct, PRODUCT_STATUS_LABELS, ProductStatus } from "@/app/types/vendorProducts";
import { summariseProduct } from "@/app/utils/productFormat";
import { productImageProps } from "@/app/utils/productImage";
import {
  adminPauseProduct,
  adminResumeProduct,
  approveProduct,
  fetchReviewQueue,
  ProductsApiError,
  rejectProduct,
  setProductRooms,
} from "@/app/utils/vendorProductsApi";
import ProductStatusChip from "./components/ProductStatusChip";
import ProductThumb from "./components/ProductThumb";
import StatusTabs from "./components/StatusTabs";

type Mode = "idle" | "reject";

// One vendor product on the owner's review screen: who sells it, what it is, and the decisions the
// owner can make (approve, approve into rooms, reject with a reason, pause, resume, rooms on/off).
const ReviewCard: React.FC<{
  product: AdminProduct;
  token: string;
  onChanged: (product: AdminProduct, message: string) => void;
}> = ({ product, token, onChanged }) => {
  const uid = useId();
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [alsoRooms, setAlsoRooms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "reject") textRef.current?.focus();
  }, [mode]);

  const canUseRooms = product.possibleRooms.length > 0;

  const run = async (action: () => Promise<AdminProduct>, message: (updated: AdminProduct) => string) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      setMode("idle");
      onChanged(updated, message(updated));
    } catch (err) {
      console.error("Review action failed:", err);
      setError(
        err instanceof ProductsApiError
          ? err.message
          : "We couldn't do that. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setReasonError("Add a few words so the vendor knows what to change.");
      return;
    }
    setReasonError(null);
    void run(
      () => rejectProduct(token, product.id, reason),
      (updated) => `${updated.name} was sent back to ${updated.vendorName} with your reason.`,
    );
  };

  return (
    <li className={styles.card}>
      <div className={styles.cardMain}>
        <ProductThumb imageUrl={product.imageUrl} />
        <div className={styles.cardBody}>
          <div className={styles.cardHead}>
            <h3 className={styles.name}>{product.name}</h3>
            <ProductStatusChip status={product.status} />
          </div>
          <p className={styles.vendorLine}>{product.vendorName}</p>
          <p className={styles.meta}>{summariseProduct(product)}</p>
        </div>
      </div>
      {product.description && <p className={styles.description}>{product.description}</p>}
      {product.photos.length > 1 && (
        <ul className={styles.photoStrip} aria-label={`All ${product.photos.length} photos of ${product.name}`}>
          {product.photos.map((url, index) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.photoStripLink}>
                <Image
                  src={url}
                  alt={`Photo ${index + 1} of ${product.name} (opens full size)`}
                  width={72}
                  height={72}
                  className={styles.photoStripImg}
                  {...productImageProps(url)}
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.flagRow}>
        {!product.hasPhoto && <span className={styles.flag}>No photo yet</span>}
        {!product.dimensionsCm && <span className={styles.flag}>No size</span>}
        <span className={styles.flag}>{product.inRooms ? "Shown in rooms" : "Shop only"}</span>
        {product.status === "paused" && product.pausedBy && (
          <span className={styles.flag}>Paused by {product.pausedBy === "admin" ? "you" : "the vendor"}</span>
        )}
      </div>
      {product.status === "rejected" && product.reviewNote && (
        <p className={`${styles.note} ${styles.noteBad}`}>
          <strong>Your reason:</strong> {product.reviewNote}
        </p>
      )}

      {mode === "reject" ? (
        <form className={styles.panel} onSubmit={submitReject} noValidate aria-busy={busy}>
          <div className={styles.field}>
            <label htmlFor={`${uid}-reason`} className={styles.label}>
              What should the vendor change?
            </label>
            <textarea
              id={`${uid}-reason`}
              ref={textRef}
              className={`${styles.textarea} ${reasonError ? styles.inputError : ""}`}
              value={reason}
              maxLength={300}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? `${uid}-reason-error` : undefined}
            />
            {reasonError && (
              <p id={`${uid}-reason-error`} role="alert" className={styles.error}>
                {reasonError}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.btnDanger} disabled={busy}>
              {busy ? "Saving…" : "Send back to vendor"}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setMode("idle")} disabled={busy}>
              Back
            </button>
          </div>
        </form>
      ) : (
        <>
          {product.status === "pending" && canUseRooms && (
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={alsoRooms} onChange={(event) => setAlsoRooms(event.target.checked)} />
              Also show it in the room designer
            </label>
          )}
          {product.status === "pending" && !product.hasPhoto && (
            <p id={`${uid}-needs-photo`} className={styles.hint}>
              The vendor hasn&apos;t added a photo yet, so this can&apos;t be approved. Send it back to ask for one.
            </p>
          )}
          {product.status === "pending" && canUseRooms && alsoRooms && (
            <p className={styles.hint}>
              Rooms look best with a size and a transparent picture. Without them it appears as a labelled tile.
            </p>
          )}
          <div className={styles.actions}>
            {product.status === "pending" && (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={busy || !product.hasPhoto}
                  aria-describedby={!product.hasPhoto ? `${uid}-needs-photo` : undefined}
                  onClick={() =>
                    run(
                      () => approveProduct(token, product.id, alsoRooms && canUseRooms),
                      (updated) => `${updated.name} is live${updated.inRooms ? " and shown in rooms" : " in the shop"}.`,
                    )
                  }
                >
                  {busy ? "Saving…" : "Approve"}
                </button>
                <button type="button" className={styles.btnSecondary} disabled={busy} onClick={() => setMode("reject")}>
                  Send back…
                </button>
              </>
            )}
            {product.status === "live" && (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={busy}
                  onClick={() =>
                    run(() => adminPauseProduct(token, product.id), (updated) => `${updated.name} is paused. The vendor cannot undo this.`)
                  }
                >
                  Pause
                </button>
                {canUseRooms && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => setProductRooms(token, product.id, !product.inRooms),
                        (updated) => `${updated.name} is ${updated.inRooms ? "now shown in rooms" : "no longer shown in rooms"}.`,
                      )
                    }
                  >
                    {product.inRooms ? "Remove from rooms" : "Show in rooms"}
                  </button>
                )}
              </>
            )}
            {product.status === "paused" && (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy}
                onClick={() => run(() => adminResumeProduct(token, product.id), (updated) => `${updated.name} is back on sale.`)}
              >
                Put back on sale
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </>
      )}
    </li>
  );
};

const EMPTY_COPY: Record<ProductStatus, { icon: string; title: string; message: string }> = {
  pending: { icon: "✅", title: "Nothing waiting for review", message: "New products from vendors appear here." },
  live: { icon: "🛍️", title: "No live vendor products yet", message: "Products you approve appear here." },
  paused: { icon: "⏸️", title: "No paused products", message: "Products you or a vendor pause appear here." },
  rejected: { icon: "🗂️", title: "No products sent back", message: "Products you send back appear here until the vendor fixes them." },
};

// The queue first, then what is already decided.
const REVIEW_TABS: { value: ProductStatus; label: string; alert?: boolean }[] = [
  { value: "pending", label: "Waiting for review", alert: true },
  { value: "live", label: PRODUCT_STATUS_LABELS.live },
  { value: "paused", label: PRODUCT_STATUS_LABELS.paused },
  { value: "rejected", label: "Sent back" },
];

const ReviewQueue: React.FC<{ token: string }> = ({ token }) => {
  const [status, setStatus] = useState<ProductStatus>("pending");
  const [message, setMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    (options: { before: string | null; signal: AbortSignal }) =>
      fetchReviewQueue(token, { status, before: options.before, signal: options.signal }),
    [token, status],
  );
  const list = usePagedProducts<AdminProduct>(fetchPage);
  const { counts, setCounts, applyChange, reload } = list;

  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  const handleChanged = (product: AdminProduct, text: string) => {
    const before = list.products.find((item) => item.id === product.id)?.status;
    applyChange(product, (item) => item.status === status);
    if (counts && before && before !== product.status) {
      setCounts({ ...counts, [before]: Math.max(0, counts[before] - 1), [product.status]: counts[product.status] + 1 });
    }
    setMessage(text);
  };

  const empty = EMPTY_COPY[status];

  return (
    <>
      <StatusTabs
        label="Product status"
        tabs={REVIEW_TABS}
        value={status}
        counts={counts}
        onChange={(next) => {
          setMessage(null);
          setStatus(next);
        }}
      />

      {message && (
        <div ref={messageRef} className={styles.message} role="status" tabIndex={-1}>
          <span>{message}</span>
        </div>
      )}

      <h2 className={styles.srOnly}>{PRODUCT_STATUS_LABELS[status]} vendor products</h2>

      {list.isLoading ? (
        <div className={styles.skeleton} role="status" aria-label="Loading products">
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      ) : list.error ? (
        <ErrorState variant="inline" title="We couldn't load the products" message={list.error} actionLabel="Try again" onAction={reload} />
      ) : list.products.length === 0 ? (
        <ErrorState variant="inline" role="status" icon={empty.icon} title={empty.title} message={empty.message} />
      ) : (
        <>
          <ul className={styles.list}>
            {list.products.map((product) => (
              <ReviewCard key={product.id} product={product} token={token} onChanged={handleChanged} />
            ))}
          </ul>
          {(list.nextCursor || list.loadMoreError) && (
            <div className={styles.more}>
              {list.loadMoreError && (
                <p role="alert" className={styles.error}>
                  {list.loadMoreError}
                </p>
              )}
              <button type="button" className={styles.btnSecondary} onClick={list.loadMore} disabled={list.isLoadingMore}>
                {list.isLoadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

const AdminProductReview: React.FC = () => (
  <AccountGate
    heading="Product review"
    intro="Products vendors add wait here until you approve them."
    wide
    signedOutTitle="Sign in to review products"
    signedOutMessage="Sign in with the owner account."
  >
    {(account, token) =>
      account.role === "admin" ? (
        <ReviewQueue token={token} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🔒"
          title="This page is for the owner"
          message="Only the owner account can review products."
          actionLabel="Back to the site"
          href="/"
        />
      )
    }
  </AccountGate>
);

export default AdminProductReview;
