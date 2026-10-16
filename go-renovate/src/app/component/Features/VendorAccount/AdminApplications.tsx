"use client";

import React, { useCallback, useEffect, useState } from "react";
import styles from "./VendorAccount.module.css";
import AccountGate from "./components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import {
  ApplicationStatus,
  SELLS_LABELS,
  VendorApplication,
} from "@/app/types/vendorAccount";
import {
  ApiError,
  approveApplication,
  fetchApplications,
  linkTestVendor,
  rejectApplication,
  unlinkTestVendor,
} from "@/app/utils/vendorAccountApi";

const FILTERS: { value: ApplicationStatus; label: string }[] = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const messageFor = (err: unknown) =>
  err instanceof ApiError ? err.message : "Something went wrong. Check your connection and try again.";

interface ApplicationCardProps {
  application: VendorApplication;
  token: string;
  onDecided: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, token, onDecided }) => {
  const [mode, setMode] = useState<"idle" | "approving" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idPrefix = `application-${application.id}`;

  const decide = async (action: "approve" | "reject") => {
    setIsBusy(true);
    setError(null);
    try {
      if (action === "approve") await approveApplication(token, application.id);
      else await rejectApplication(token, application.id, reason.trim());
      onDecided();
    } catch (err) {
      setError(messageFor(err));
      setIsBusy(false);
    }
  };

  const statusClass =
    application.status === "approved"
      ? styles.badge
      : application.status === "rejected"
        ? `${styles.badge} ${styles.badgeBad}`
        : `${styles.badge} ${styles.badgeWarn}`;

  return (
    <li className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{application.businessName}</h3>
        <span className={statusClass}>
          {application.status === "pending" ? "Waiting" : application.status === "approved" ? "Approved" : "Rejected"}
        </span>
      </div>

      <dl className={styles.details}>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>Account</dt>
          <dd className={styles.detailsValue}>{application.userEmail ?? "Unknown"}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>City</dt>
          <dd className={styles.detailsValue}>{application.city}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>Offers</dt>
          <dd className={styles.detailsValue}>{SELLS_LABELS[application.sells]}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>Mobile</dt>
          <dd className={styles.detailsValue}>{application.phone}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>Address</dt>
          <dd className={styles.detailsValue}>{application.pickupAddress}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>GST number</dt>
          <dd className={styles.detailsValue}>{application.gstin || "Not given"}</dd>
        </div>
        <div className={styles.detailsItem}>
          <dt className={styles.detailsLabel}>Sent on</dt>
          <dd className={styles.detailsValue}>{formatDate(application.createdAt)}</dd>
        </div>
        {application.vendorId && (
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>Vendor profile id</dt>
            <dd className={styles.detailsValue}>{application.vendorId}</dd>
          </div>
        )}
        {application.status === "rejected" && application.rejectionReason && (
          <div className={styles.detailsItem}>
            <dt className={styles.detailsLabel}>Reason given</dt>
            <dd className={styles.detailsValue}>{application.rejectionReason}</dd>
          </div>
        )}
      </dl>

      {application.status === "pending" && (
        <div className={styles.decision}>
          {mode === "idle" && (
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={() => setMode("approving")}>
                Approve
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => setMode("rejecting")}>
                Reject
              </button>
            </div>
          )}

          {mode === "approving" && (
            <>
              <p className={styles.muted}>
                This makes {application.userEmail ?? "the applicant"} a vendor and creates a new, empty vendor
                profile for &quot;{application.businessName}&quot;. It can&apos;t be undone from this page.
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={isBusy}
                  onClick={() => decide("approve")}
                >
                  {isBusy ? "Approving…" : "Yes, approve"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isBusy}
                  onClick={() => setMode("idle")}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {mode === "rejecting" && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${idPrefix}-reason`}>
                  Reason <span className={styles.optional}>(optional, shown to the applicant)</span>
                </label>
                <textarea
                  id={`${idPrefix}-reason`}
                  className={`${styles.input} ${styles.textarea}`}
                  rows={2}
                  maxLength={300}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={isBusy}
                  onClick={() => decide("reject")}
                >
                  {isBusy ? "Rejecting…" : "Confirm rejection"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isBusy}
                  onClick={() => setMode("idle")}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className={styles.formError}>
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
};

const TestLinkShortcut: React.FC<{ token: string }> = ({ token }) => {
  const [userId, setUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: "link" | "unlink") => {
    const numericId = Number(userId.trim());
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setResult({ ok: false, text: "Enter the account's numeric user id." });
      return;
    }
    if (action === "link" && !vendorId.trim()) {
      setResult({ ok: false, text: "Enter the demo vendor's id (for example 1)." });
      return;
    }
    setIsBusy(true);
    setResult(null);
    try {
      if (action === "link") await linkTestVendor(token, numericId, vendorId.trim());
      else await unlinkTestVendor(token, numericId);
      setResult({ ok: true, text: action === "link" ? "Linked. That account is now a vendor of that demo profile." : "Unlinked. That account is a customer again." });
    } catch (err) {
      setResult({ ok: false, text: messageFor(err) });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <details className={styles.shortcut}>
      <summary className={styles.shortcutSummary}>Test shortcut: link a test account to a demo vendor</summary>
      <p className={styles.muted}>
        For trying the vendor area without applying. It only works with demo (seeded) vendors, never with real ones.
        Find an account&apos;s user id in your browser at <code>/api/auth/session</code> after signing in as it.
      </p>
      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="link-user-id">
              User id
            </label>
            <input
              id="link-user-id"
              className={styles.input}
              inputMode="numeric"
              autoComplete="off"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="link-vendor-id">
              Demo vendor id
            </label>
            <input
              id="link-vendor-id"
              className={styles.input}
              autoComplete="off"
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} disabled={isBusy} onClick={() => run("link")}>
            Link
          </button>
          <button type="button" className={styles.secondaryButton} disabled={isBusy} onClick={() => run("unlink")}>
            Unlink
          </button>
        </div>
        {result && (
          <p role={result.ok ? "status" : "alert"} className={result.ok ? styles.statusLine : styles.formError}>
            {result.text}
          </p>
        )}
      </div>
    </details>
  );
};

const ApplicationList: React.FC<{ token: string }> = ({ token }) => {
  const [filter, setFilter] = useState<ApplicationStatus>("pending");
  const [applications, setApplications] = useState<VendorApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setApplications(null);
    setError(null);
    fetchApplications(token, filter, controller.signal)
      .then(setApplications)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load applications:", err);
        setError("We couldn't load the applications. Please try again.");
      });
    return () => controller.abort();
  }, [token, filter, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Show applications">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            className={`${styles.filterButton} ${filter === value ? styles.filterButtonActive : ""}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <ErrorState variant="inline" title="Couldn't load applications" message={error} onAction={reload} />
      )}

      {!error && !applications && (
        <div className={styles.skeleton} role="status" aria-label="Loading applications">
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      )}

      {!error && applications && applications.length === 0 && (
        <p className={styles.muted} role="status">
          {filter === "pending" ? "No applications are waiting." : `No ${filter} applications.`}
        </p>
      )}

      {!error && applications && applications.length > 0 && (
        <ul className={styles.cardList}>
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} token={token} onDecided={reload} />
          ))}
        </ul>
      )}

      <TestLinkShortcut token={token} />
    </>
  );
};

const AdminApplications: React.FC = () => (
  <AccountGate
    heading="Vendor applications"
    intro="People who asked to sell on Go Renovate. Approving creates their vendor profile and makes their account a vendor."
    wide
    signedOutTitle="Sign in as an admin"
    signedOutMessage="This page is for Go Renovate admins."
  >
    {(account, token) =>
      account.role === "admin" ? (
        <ApplicationList token={token} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🔒"
          title="Admins only"
          message="Your account doesn't have access to this page."
          actionLabel="Back to home"
          href="/"
        />
      )
    }
  </AccountGate>
);

export default AdminApplications;
