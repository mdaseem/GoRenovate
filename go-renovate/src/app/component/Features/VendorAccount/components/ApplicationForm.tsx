"use client";

import React, { useRef, useState } from "react";
import styles from "../VendorAccount.module.css";
import {
  ApplicationField,
  ApplicationFieldErrors,
  ApplicationFormValues,
  SELLS_LABELS,
  SellsOption,
  VendorApplication,
} from "@/app/types/vendorAccount";
import { ApiError, submitApplication } from "@/app/utils/vendorAccountApi";
import { SERVICES_ENABLED } from "@/app/utils/features";

// While services are switched off the form does not ask what is sold: every applicant sells products.
const EMPTY_VALUES: ApplicationFormValues = {
  businessName: "",
  city: "",
  sells: SERVICES_ENABLED ? "" : "products",
  phone: "",
  pickupAddress: "",
  gstin: "",
};

const FIELD_ORDER: ApplicationField[] = [
  "businessName",
  "city",
  ...(SERVICES_ENABLED ? (["sells"] as const) : []),
  "phone",
  "pickupAddress",
  "gstin",
];

// Same rules as the server (routes/vendorApplicationRoutes.ts); the server stays the authority.
const PHONE_PATTERN = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function validate(field: ApplicationField, values: ApplicationFormValues): string | null {
  const value = values[field].trim();
  switch (field) {
    case "businessName":
      return value.length >= 2 && value.length <= 80
        ? null
        : "Enter your business name (2 to 80 characters).";
    case "city":
      return value.length >= 2 && value.length <= 60 ? null : "Enter the city you work from.";
    case "sells":
      return value ? null : "Choose whether you offer services, products or both.";
    case "phone":
      return PHONE_PATTERN.test(value.replace(/[\s-]/g, ""))
        ? null
        : "Enter a 10-digit Indian mobile number.";
    case "pickupAddress":
      return value.length >= 10 && value.length <= 300
        ? null
        : "Enter your address (at least 10 characters).";
    case "gstin":
      return value === "" || GSTIN_PATTERN.test(value.toUpperCase())
        ? null
        : "That GST number does not look right. Leave it empty if you do not have one.";
  }
}

interface ApplicationFormProps {
  token: string;
  onSubmitted: (application: VendorApplication) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ token, onSubmitted }) => {
  const [values, setValues] = useState<ApplicationFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ApplicationFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = (field: ApplicationField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear the message as soon as the person starts fixing it.
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const checkField = (field: ApplicationField) => {
    const message = validate(field, values);
    setErrors((current) => ({ ...current, [field]: message ?? undefined }));
    return message;
  };

  const focusField = (field: ApplicationField) => {
    const target = formRef.current?.querySelector<HTMLElement>(
      field === "sells" ? 'input[name="sells"]' : `[name="${field}"]`,
    );
    target?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    const found: ApplicationFieldErrors = {};
    for (const field of FIELD_ORDER) {
      const message = validate(field, values);
      if (message) found[field] = message;
    }
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setIsSubmitting(true);
    try {
      const application = await submitApplication(token, {
        ...values,
        gstin: values.gstin.trim().toUpperCase(),
      });
      onSubmitted(application);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
        const first = FIELD_ORDER.find((field) => err.fieldErrors?.[field]);
        if (first) focusField(first);
      } else {
        setFormError(
          err instanceof ApiError
            ? err.message
            : "We couldn't submit your application. Check your connection and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const textField = (
    field: Exclude<ApplicationField, "sells">,
    label: string,
    options: {
      optional?: boolean;
      hint?: string;
      autoComplete?: string;
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
      type?: string;
      multiline?: boolean;
    } = {},
  ) => {
    const id = `sell-${field}`;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [options.hint ? hintId : null, errors[field] ? errorId : null]
      .filter(Boolean)
      .join(" ");
    const shared = {
      id,
      name: field,
      value: values[field],
      className: `${styles.input} ${options.multiline ? styles.textarea : ""} ${errors[field] ? styles.inputError : ""}`,
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": describedBy || undefined,
      autoComplete: options.autoComplete,
      onBlur: () => {
        if (values[field].trim() !== "" || errors[field]) checkField(field);
      },
    };

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {label}
          {options.optional && <span className={styles.optional}> (optional)</span>}
        </label>
        {options.multiline ? (
          <textarea
            {...shared}
            rows={3}
            onChange={(event) => setField(field, event.target.value)}
          />
        ) : (
          <input
            {...shared}
            type={options.type ?? "text"}
            inputMode={options.inputMode}
            onChange={(event) => setField(field, event.target.value)}
          />
        )}
        {options.hint && (
          <span id={hintId} className={styles.hint}>
            {options.hint}
          </span>
        )}
        {errors[field] && (
          <span id={errorId} role="alert" className={styles.errorMessage}>
            {errors[field]}
          </span>
        )}
      </div>
    );
  };

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      {textField("businessName", "Business name", { autoComplete: "organization" })}

      <div className={styles.formRow}>
        {textField("city", "City", { autoComplete: "address-level2" })}
        {textField("phone", "Mobile number", {
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          hint: "10 digits, used only to reach you about this application.",
        })}
      </div>

      {SERVICES_ENABLED && (
      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.sells ? "sell-sells-error" : undefined}
      >
        <legend className={styles.legend}>What do you offer?</legend>
        <div className={`${styles.choices} ${errors.sells ? styles.choicesInvalid : ""}`}>
          {(Object.keys(SELLS_LABELS) as SellsOption[]).map((option) => (
            <label key={option} className={styles.choice}>
              <input
                type="radio"
                name="sells"
                value={option}
                className={styles.choiceInput}
                checked={values.sells === option}
                onChange={() => setField("sells", option)}
              />
              <span className={styles.choiceBox}>{SELLS_LABELS[option]}</span>
            </label>
          ))}
        </div>
        {errors.sells && (
          <span id="sell-sells-error" role="alert" className={styles.errorMessage}>
            {errors.sells}
          </span>
        )}
      </fieldset>
      )}

      {textField("pickupAddress", "Shop or pickup address", {
        multiline: true,
        autoComplete: "street-address",
      })}

      {textField("gstin", "GST number", {
        optional: true,
        autoComplete: "off",
        hint: "15 characters. Leave it empty if you do not have one yet.",
      })}

      {formError && (
        <p role="alert" className={styles.formError}>
          {formError}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send application"}
        </button>
      </div>
    </form>
  );
};

export default ApplicationForm;
