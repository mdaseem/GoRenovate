"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./VendorAccount.module.css";
import AccountGate from "./components/AccountGate";
import ApplicationForm from "./components/ApplicationForm";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { SELLS_LABELS, VendorApplication } from "@/app/types/vendorAccount";
import { fetchMyApplication } from "@/app/utils/vendorAccountApi";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ApplicationSummary: React.FC<{ application: VendorApplication }> = ({ application }) => (
  <div className={styles.card}>
    <div className={styles.cardTop}>
      <h2 className={styles.cardTitle}>{application.businessName}</h2>
      <span className={`${styles.badge} ${styles.badgeWarn}`}>Waiting for review</span>
    </div>
    <dl className={styles.details}>
      <div className={styles.detailsItem}>
        <dt className={styles.detailsLabel}>City</dt>
        <dd className={styles.detailsValue}>{application.city}</dd>
      </div>
      <div className={styles.detailsItem}>
        <dt className={styles.detailsLabel}>Offers</dt>
        <dd className={styles.detailsValue}>{SELLS_LABELS[application.sells]}</dd>
      </div>
      <div className={styles.detailsItem}>
        <dt className={styles.detailsLabel}>Sent on</dt>
        <dd className={styles.detailsValue}>{formatDate(application.createdAt)}</dd>
      </div>
    </dl>
    <p className={styles.muted}>
      We review every application ourselves. We don&apos;t send emails yet, so come back to this page to see the
      result.
    </p>
  </div>
);

interface SellContentProps {
  role: "customer" | "vendor" | "admin";
  token: string;
}

const SellContent: React.FC<SellContentProps> = ({ role, token }) => {
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [isLoading, setIsLoading] = useState(role === "customer");
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (role !== "customer") return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetchMyApplication(token, controller.signal)
      .then(setApplication)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load application:", err);
        setError("We couldn't load your application. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [role, token, reloadCount]);

  if (role === "vendor") {
    return (
      <div className={styles.notice}>
        <strong className={styles.noticeTitle}>You&apos;re already a vendor</strong>
        Your vendor area is where your business profile lives.
        <div className={styles.actions}>
          <Link href="/vendor" className={styles.primaryButton}>
            Open vendor area
          </Link>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className={styles.notice}>
        <strong className={styles.noticeTitle}>Admin accounts can&apos;t apply</strong>
        Use a separate customer account to try the application. Applications are reviewed on the admin page.
        <div className={styles.actions}>
          <Link href="/admin/vendors" className={styles.secondaryButton}>
            Review applications
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.skeleton} role="status" aria-label="Loading your application">
        <div className={styles.skeletonBlock} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant="inline"
        title="Couldn't load your application"
        message={error}
        onAction={() => setReloadCount((count) => count + 1)}
      />
    );
  }

  if (application?.status === "pending") {
    return <ApplicationSummary application={application} />;
  }

  return (
    <>
      {application?.status === "rejected" && (
        <div className={`${styles.notice} ${styles.noticeRejected}`} role="status">
          <strong className={styles.noticeTitle}>Your last application wasn&apos;t approved</strong>
          {application.rejectionReason
            ? `Reason: ${application.rejectionReason}`
            : "No reason was given."}{" "}
          You can send a new application below.
        </div>
      )}
      <ApplicationForm token={token} onSubmitted={setApplication} />
    </>
  );
};

const SellPage: React.FC = () => (
  <AccountGate
    heading="Sell on Go Renovate"
    intro="Tell us about your business. We review every application ourselves, and once it's approved you get a vendor area for your business profile."
    signedOutTitle="Sign in to apply"
    signedOutMessage="Applications are tied to your account, so please sign in or create an account first."
  >
    {(account, token) => <SellContent role={account.role} token={token} />}
  </AccountGate>
);

export default SellPage;
