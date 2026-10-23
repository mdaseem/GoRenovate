"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./VendorProducts.module.css";
import AccountGate from "@/app/component/Features/VendorAccount/components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { usePagedProducts } from "@/app/component/CustomHooks/usePagedProducts";
import { ManagedProduct, PRODUCT_STATUS_LABELS, ProductStatus } from "@/app/types/vendorProducts";
import { takeFlashMessage } from "@/app/utils/flashMessage";
import { fetchMyProducts } from "@/app/utils/vendorProductsApi";
import ProductRow from "./components/ProductRow";
import StatusTabs, { productTabs } from "./components/StatusTabs";

const EMPTY_COPY: Record<ProductStatus | "all", { icon: string; title: string; message: string }> = {
  all: {
    icon: "🛋️",
    title: "You haven't added a product yet",
    message: "Add your first product. We review it, and then buyers can see and order it.",
  },
  live: { icon: "🛍️", title: "Nothing is live yet", message: "Products appear here once we have approved them." },
  pending: { icon: "⏳", title: "Nothing waiting for review", message: "New products you add wait here until we approve them." },
  paused: { icon: "⏸️", title: "No paused products", message: "Products you pause stay here until you put them back on sale." },
  rejected: { icon: "✅", title: "Nothing needs changes", message: "If we ask for a change to a product, it appears here with the reason." },
};

const Products: React.FC<{ token: string }> = ({ token }) => {
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [message, setMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    (options: { before: string | null; signal: AbortSignal }) =>
      fetchMyProducts(token, { status, before: options.before, signal: options.signal }),
    [token, status],
  );
  const list = usePagedProducts<ManagedProduct>(fetchPage);

  // A message left by the add/edit screen ("Product added...") shows once here.
  useEffect(() => {
    const flash = takeFlashMessage();
    if (flash) setMessage(flash);
  }, []);
  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  const { counts, setCounts, applyChange, reload } = list;

  const handleChanged = (product: ManagedProduct, text: string) => {
    const before = list.products.find((item) => item.id === product.id)?.status;
    applyChange(product, (item) => status === "all" || item.status === status);
    if (counts && before && before !== product.status) {
      setCounts({ ...counts, [before]: Math.max(0, counts[before] - 1), [product.status]: counts[product.status] + 1 });
    }
    setMessage(text);
  };

  const handleDuplicated = (copy: ManagedProduct) => {
    setMessage(`A copy of the product was added as "${copy.name}". It is in review: change its name and details when you are ready.`);
    void reload();
  };

  const tabCounts = counts
    ? { ...counts, all: counts.live + counts.pending + counts.paused + counts.rejected }
    : null;
  const empty = EMPTY_COPY[status];

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.toolbarText}>New products are reviewed before buyers can see them.</p>
        <Link href="/vendor/products/new" className={styles.btnPrimary}>
          Add a product
        </Link>
      </div>

      <StatusTabs
        label="Product status"
        tabs={productTabs(true)}
        value={status}
        counts={tabCounts}
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

      <h2 className={styles.srOnly}>
        {status === "all" ? "All products" : `${PRODUCT_STATUS_LABELS[status]} products`}
      </h2>

      {list.isLoading ? (
        <div className={styles.skeleton} role="status" aria-label="Loading products">
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      ) : list.error ? (
        <ErrorState
          variant="inline"
          title="We couldn't load your products"
          message={list.error}
          actionLabel="Try again"
          onAction={reload}
        />
      ) : list.products.length === 0 ? (
        <ErrorState
          variant="inline"
          role="status"
          icon={empty.icon}
          title={empty.title}
          message={empty.message}
          actionLabel={status === "all" ? "Add your first product" : undefined}
          href={status === "all" ? "/vendor/products/new" : undefined}
        />
      ) : (
        <>
          <ul className={styles.list}>
            {list.products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                token={token}
                onChanged={handleChanged}
                onDuplicated={handleDuplicated}
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

const VendorProductsPage: React.FC = () => (
  <AccountGate
    heading="My products"
    wide
    signedOutTitle="Sign in to manage your products"
    signedOutMessage="Sign in with your vendor account."
  >
    {(account, token) =>
      account.role === "vendor" ? (
        <Products token={token} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🏪"
          title="Products are for vendors"
          message="Once your application to sell has been approved, you can add your products here."
          actionLabel={account.role === "admin" ? "Review products" : "Apply to sell"}
          href={account.role === "admin" ? "/admin/products" : "/sell"}
        />
      )
    }
  </AccountGate>
);

export default VendorProductsPage;
