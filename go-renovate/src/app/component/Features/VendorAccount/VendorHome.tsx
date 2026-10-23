"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./VendorAccount.module.css";
import AccountGate from "./components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { OwnVendorProfile } from "@/app/types/vendorAccount";
import { fetchOwnVendor } from "@/app/utils/vendorAccountApi";
import { fetchMyProducts } from "@/app/utils/vendorProductsApi";
import { ProductCounts } from "@/app/types/vendorProducts";
import productStyles from "../VendorProducts/VendorProducts.module.css";
import { getAvatarStyle, getInitials } from "@/app/utils/vendorAvatar";
import { SERVICES_ENABLED } from "@/app/utils/features";
import orderStyles from "../VendorOrders/VendorOrders.module.css";
import { useAppSelector } from "@/app/store/hooks";

// The first thing a vendor needs: are there orders waiting. The numbers come from the same store the
// header badge uses, so they match it.
const OrdersSummary: React.FC = () => {
  const counts = useAppSelector((state) => state.vendorOrders.counts);
  let text: React.ReactNode;
  if (!counts) {
    text = "Checking for orders…";
  } else if (counts.new > 0 || counts.accepted > 0) {
    text = (
      <>
        {counts.new > 0 && (
          <span className={orderStyles.homeOrdersStrong}>
            {counts.new} new order{counts.new === 1 ? "" : "s"}
          </span>
        )}
        {counts.new > 0 && counts.accepted > 0 && " · "}
        {counts.accepted > 0 && (
          <span className={orderStyles.homeOrdersStrong}>{counts.accepted} to ship</span>
        )}
      </>
    );
  } else {
    text = "No orders waiting. New orders appear here when a buyer checks out.";
  }
  return (
    <section className={styles.section} aria-labelledby="vendor-orders-heading">
      <h2 id="vendor-orders-heading" className={styles.sectionHeading}>
        Orders
      </h2>
      <div className={`${styles.card} ${orderStyles.homeOrders}`}>
        <p className={orderStyles.homeOrdersText} role="status">
          {text}
        </p>
        <Link href="/vendor/orders" className={styles.primaryButton}>
          Open orders
        </Link>
      </div>
    </section>
  );
};

// Where the vendor adds and manages products, with the numbers that matter: how many are live and how
// many are waiting for our review.
const ProductsSummary: React.FC<{ token: string }> = ({ token }) => {
  const [counts, setCounts] = useState<ProductCounts | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyProducts(token, { status: "all", limit: 1, signal: controller.signal })
      .then((page) => setCounts(page.counts))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load product counts:", err);
        setFailed(true);
      });
    return () => controller.abort();
  }, [token]);

  let text: React.ReactNode;
  if (failed) text = "We couldn't check your products right now.";
  else if (!counts) text = "Checking your products…";
  else if (counts.live + counts.pending + counts.paused + counts.rejected === 0) {
    text = "You haven't added a product yet. Add your first one: we review it, then buyers can see it.";
  } else {
    text = (
      <>
        <span className={productStyles.homeProductsStrong}>{counts.live} live</span>
        {counts.pending > 0 && (
          <>
            {" · "}
            <span className={productStyles.homeProductsStrong}>{counts.pending} in review</span>
          </>
        )}
        {counts.rejected > 0 && (
          <>
            {" · "}
            <span className={productStyles.homeProductsStrong}>{counts.rejected} need changes</span>
          </>
        )}
      </>
    );
  }
  return (
    <section className={styles.section} aria-labelledby="vendor-products-heading">
      <h2 id="vendor-products-heading" className={styles.sectionHeading}>
        Products
      </h2>
      <div className={`${styles.card} ${productStyles.homeProducts}`}>
        <p className={productStyles.homeProductsText} role="status">
          {text}
        </p>
        <Link href="/vendor/products" className={styles.primaryButton}>
          My products
        </Link>
      </div>
    </section>
  );
};

const VendorProfile: React.FC<{ token: string }> = ({ token }) => {
  const [vendor, setVendor] = useState<OwnVendorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetchOwnVendor(token, controller.signal)
      .then(setVendor)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load vendor profile:", err);
        setError("We couldn't load your vendor profile. Please try again.");
      });
    return () => controller.abort();
  }, [token, reloadCount]);

  if (error) {
    return (
      <ErrorState
        variant="inline"
        title="Couldn't load your profile"
        message={error}
        onAction={() => setReloadCount((count) => count + 1)}
      />
    );
  }

  if (!vendor) {
    return (
      <div className={styles.skeleton} role="status" aria-label="Loading your profile">
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>
    );
  }

  const avatar = getAvatarStyle(vendor.id);
  const services = vendor.categories.flatMap((category) => category.services);
  const hasServices = services.length > 0;
  const isHidden = vendor.status === "paused" || vendor.status === "pending";
  const visibleOnSite = !isHidden && hasServices;

  return (
    <>
      <OrdersSummary />
      {!SERVICES_ENABLED && <ProductsSummary token={token} />}
      <div className={styles.card}>
        <div className={styles.profileHead}>
          <span
            className={styles.avatar}
            style={{ background: avatar.bg, color: avatar.fg }}
            aria-hidden="true"
          >
            {getInitials(vendor.name)}
          </span>
          <div>
            <h2 className={styles.profileName}>{vendor.name}</h2>
            <span className={`${styles.badge} ${visibleOnSite ? "" : styles.badgeWarn}`}>
              {visibleOnSite ? "Visible on Go Renovate" : "Not visible to customers yet"}
            </span>
          </div>
        </div>

        <dl className={styles.details}>
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>City</dt>
            <dd className={styles.detailsValue}>{vendor.location || "Not set"}</dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>Rating</dt>
            <dd className={styles.detailsValue}>
              {vendor.reviewCount > 0
                ? `${vendor.rating.toFixed(1)} from ${vendor.reviewCount} review${vendor.reviewCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>Completed projects</dt>
            <dd className={styles.detailsValue}>{vendor.completedProjects}</dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>Verified</dt>
            <dd className={styles.detailsValue}>{vendor.verified ? "Yes" : "Not yet"}</dd>
          </div>
        </dl>

        {!visibleOnSite && (
          <p className={styles.muted}>
            {isHidden
              ? "Your profile is currently hidden from customers."
              : SERVICES_ENABLED
                ? "Customers will see your profile on the Vendors pages once you have at least one service listed."
                : "Customers will see your profile on the Vendors pages once you have at least one product listed."}
          </p>
        )}
      </div>

      <section className={styles.section} aria-labelledby="vendor-services-heading">
        <h2 id="vendor-services-heading" className={styles.sectionHeading}>
          {SERVICES_ENABLED ? "Your services" : "Your products"}
        </h2>
        {hasServices ? (
          <ul className={styles.chips}>
            {vendor.categories.map((category) => (
              <li key={category.id} className={styles.chip}>
                {category.label} · {category.services.length}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.notice}>
            <strong className={styles.noticeTitle}>Nothing listed yet</strong>
            {SERVICES_ENABLED
              ? "Tools to add and edit your services and products are the next thing we're building. Your account and profile are set up and ready for them."
              : "Add your first product from My products. Once we have approved it, buyers can find you here."}
          </div>
        )}
      </section>

      {visibleOnSite && (
        <div className={styles.actions}>
          <Link href={`/vendors/${vendor.id}`} className={styles.secondaryButton}>
            See how customers see you
          </Link>
        </div>
      )}
    </>
  );
};

const VendorHome: React.FC = () => (
  <AccountGate
    heading="Vendor area"
    signedOutTitle="Sign in to open your vendor area"
    signedOutMessage="Sign in with the account you applied with."
  >
    {(account, token) =>
      account.role === "vendor" ? (
        <VendorProfile token={token} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🏪"
          title="This area is for vendors"
          message={
            account.role === "admin"
              ? "Admin accounts don't have a vendor profile. Applications are reviewed on the admin page."
              : "Your account isn't a vendor account yet. Apply to sell and we'll review your application."
          }
          actionLabel={account.role === "admin" ? "Review applications" : "Apply to sell"}
          href={account.role === "admin" ? "/admin/vendors" : "/sell"}
        />
      )
    }
  </AccountGate>
);

export default VendorHome;
