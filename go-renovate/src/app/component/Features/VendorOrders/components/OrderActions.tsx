"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styles from "../VendorOrders.module.css";
import {
  ActionFieldErrors,
  nextAction,
  REASON_OPTIONS,
  ReasonCode,
  VendorOrder,
  VendorOrderActionPayload,
  VendorOrderCounts,
} from "@/app/types/vendorOrders";
import { updateVendorOrder, VendorOrdersApiError } from "@/app/utils/vendorOrdersApi";

type Mode = "idle" | "decline" | "cancel" | "ship" | "deliver";

interface OrderActionsProps {
  order: VendorOrder;
  token: string;
  // Called with the order as the server now has it, the fresh counts and a sentence to tell the vendor.
  onUpdated: (order: VendorOrder, counts: VendorOrderCounts, message: string) => void;
  // The server said the order had already moved on: ask the parent to reload it.
  onStale: () => void;
}

// The one next step for an order, in plain words, with the small forms it needs. New: Accept (one
// tap) or Decline (asks why). Accepted: Mark as shipped (courier and tracking are optional) or
// "Can't fulfil". Shipped: Mark as delivered (asks to confirm). Nothing for finished orders.
const OrderActions: React.FC<OrderActionsProps> = ({ order, token, onUpdated, onStale }) => {
  const uid = useId();
  const next = nextAction(order.status);
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState<ReasonCode | "">("");
  const [note, setNote] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ActionFieldErrors>({});
  const panelRef = useRef<HTMLDivElement>(null);

  // Opening a form puts the cursor in it, so a keyboard or screen-reader user lands where the action is.
  useEffect(() => {
    if (mode === "idle") return;
    panelRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
  }, [mode]);

  if (!next) return null;

  const closePanel = () => {
    setMode("idle");
    setError(null);
    setFieldErrors({});
  };

  const send = async (payload: VendorOrderActionPayload, message: string) => {
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const result = await updateVendorOrder(token, order.id, payload);
      onUpdated(result.order, result.counts, message);
      setMode("idle");
      setReason("");
      setNote("");
    } catch (err) {
      console.error("Failed to update order:", err);
      if (err instanceof VendorOrdersApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        if (err.status === 409) onStale();
      } else {
        setError("We couldn't save that. Check your connection and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const submitReason = (event: React.FormEvent<HTMLFormElement>, action: "decline" | "cancel") => {
    event.preventDefault();
    const errors: ActionFieldErrors = {};
    if (!reason) errors.reason = "Choose a reason.";
    else if (reason === "OTHER" && note.trim().length < 3) {
      errors.note = "Add a few words so the buyer knows what happened.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    void send(
      { action, reason: reason as ReasonCode, note: reason === "OTHER" ? note : undefined },
      action === "decline"
        ? `${order.orderNumber} declined. The buyer can see the reason.`
        : `${order.orderNumber} cancelled. The buyer can see the reason.`,
    );
  };

  const submitShip = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: ActionFieldErrors = {};
    const link = trackingUrl.trim();
    if (link && !/^https:\/\//i.test(link)) errors.trackingUrl = "The tracking link must start with https://";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    void send(
      {
        action: "ship",
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: link || undefined,
      },
      `${order.orderNumber} marked as shipped.`,
    );
  };

  const errorLine = error && (
    <p role="alert" className={styles.error}>
      {error}
    </p>
  );

  if (mode === "decline" || mode === "cancel") {
    const isDecline = mode === "decline";
    return (
      <div ref={panelRef}>
      <form
        className={styles.panel}
        onSubmit={(event) => submitReason(event, isDecline ? "decline" : "cancel")}
        noValidate
        aria-busy={isSaving}
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            {isDecline ? "Why are you declining this order?" : "Why can't you fulfil this order?"}
          </legend>
          {REASON_OPTIONS.map((option) => (
            <label key={option.code} className={styles.choice}>
              <input
                type="radio"
                name={`${uid}-reason`}
                value={option.code}
                className={styles.choiceInput}
                checked={reason === option.code}
                onChange={() => {
                  setReason(option.code);
                  setFieldErrors({});
                }}
              />
              <span className={styles.choiceBox}>{option.label}</span>
            </label>
          ))}
          {fieldErrors.reason && (
            <p role="alert" className={styles.error}>
              {fieldErrors.reason}
            </p>
          )}
        </fieldset>

        {reason === "OTHER" && (
          <div className={styles.field}>
            <label htmlFor={`${uid}-note`} className={styles.label}>
              Tell the buyer what happened
            </label>
            <textarea
              id={`${uid}-note`}
              className={`${styles.textarea} ${fieldErrors.note ? styles.inputError : ""}`}
              value={note}
              maxLength={200}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={Boolean(fieldErrors.note)}
              aria-describedby={fieldErrors.note ? `${uid}-note-error` : undefined}
            />
            {fieldErrors.note && (
              <p id={`${uid}-note-error`} role="alert" className={styles.error}>
                {fieldErrors.note}
              </p>
            )}
          </div>
        )}

        {errorLine}
        <div className={styles.panelActions}>
          <button type="submit" className={styles.btnDanger} disabled={isSaving}>
            {isSaving ? "Saving…" : isDecline ? "Decline order" : "Cancel order"}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={closePanel} disabled={isSaving}>
            Back
          </button>
        </div>
      </form>
      </div>
    );
  }

  if (mode === "ship") {
    return (
      <div ref={panelRef}>
      <form
        className={styles.panel}
        onSubmit={submitShip}
        noValidate
        aria-busy={isSaving}
      >
        <h4 className={styles.panelTitle}>Shipping details</h4>
        <p className={styles.panelText}>
          Optional, but a courier name and tracking number help the buyer follow the parcel.
        </p>
        <div className={styles.field}>
          <label htmlFor={`${uid}-courier`} className={styles.label}>
            Courier <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id={`${uid}-courier`}
            className={`${styles.input} ${fieldErrors.courierName ? styles.inputError : ""}`}
            value={courierName}
            maxLength={60}
            autoComplete="off"
            onChange={(event) => setCourierName(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-tracking`} className={styles.label}>
            Tracking number <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id={`${uid}-tracking`}
            className={`${styles.input} ${fieldErrors.trackingNumber ? styles.inputError : ""}`}
            value={trackingNumber}
            maxLength={60}
            autoComplete="off"
            aria-invalid={Boolean(fieldErrors.trackingNumber)}
            aria-describedby={fieldErrors.trackingNumber ? `${uid}-tracking-error` : undefined}
            onChange={(event) => setTrackingNumber(event.target.value)}
          />
          {fieldErrors.trackingNumber && (
            <p id={`${uid}-tracking-error`} role="alert" className={styles.error}>
              {fieldErrors.trackingNumber}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-link`} className={styles.label}>
            Tracking link <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id={`${uid}-link`}
            type="url"
            inputMode="url"
            placeholder="https://"
            className={`${styles.input} ${fieldErrors.trackingUrl ? styles.inputError : ""}`}
            value={trackingUrl}
            maxLength={300}
            autoComplete="off"
            aria-invalid={Boolean(fieldErrors.trackingUrl)}
            aria-describedby={fieldErrors.trackingUrl ? `${uid}-link-error` : `${uid}-link-hint`}
            onChange={(event) => setTrackingUrl(event.target.value)}
          />
          {fieldErrors.trackingUrl ? (
            <p id={`${uid}-link-error`} role="alert" className={styles.error}>
              {fieldErrors.trackingUrl}
            </p>
          ) : (
            <span id={`${uid}-link-hint`} className={styles.hint}>
              Starts with https://
            </span>
          )}
        </div>
        {errorLine}
        <div className={styles.panelActions}>
          <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
            {isSaving ? "Saving…" : "Mark as shipped"}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={closePanel} disabled={isSaving}>
            Back
          </button>
        </div>
      </form>
      </div>
    );
  }

  if (mode === "deliver") {
    return (
      <div
        ref={panelRef}
        className={styles.panel}
        role="group"
        aria-label="Confirm delivery"
        aria-busy={isSaving}
      >
        <p className={styles.panelText}>Has the buyer received this order?</p>
        {errorLine}
        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={isSaving}
            onClick={() => send({ action: "deliver" }, `${order.orderNumber} marked as delivered.`)}
          >
            {isSaving ? "Saving…" : "Yes, it's delivered"}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={closePanel} disabled={isSaving}>
            Not yet
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.actions}>
        {next === "accept" && (
          <>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={isSaving}
              onClick={() =>
                send({ action: "accept" }, `${order.orderNumber} accepted. It's now under To ship.`)
              }
            >
              {isSaving ? "Accepting…" : "Accept order"}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setMode("decline")} disabled={isSaving}>
              Decline
            </button>
          </>
        )}
        {next === "ship" && (
          <>
            <button type="button" className={styles.btnPrimary} onClick={() => setMode("ship")}>
              Mark as shipped
            </button>
            <button type="button" className={styles.btnLink} onClick={() => setMode("cancel")}>
              Can&apos;t fulfil this order
            </button>
          </>
        )}
        {next === "deliver" && (
          <button type="button" className={styles.btnPrimary} onClick={() => setMode("deliver")}>
            Mark as delivered
          </button>
        )}
      </div>
      {errorLine}
    </>
  );
};

export default OrderActions;
