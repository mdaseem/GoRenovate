"use client";

import React from "react";
import styles from "./CheckoutForm.module.css";

export type AddressField =
  | "contactName"
  | "phone"
  | "line1"
  | "line2"
  | "city"
  | "state"
  | "pincode";

export const EMPTY_ADDRESS: Record<AddressField, string> = {
  contactName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export const FIELD_ORDER: AddressField[] = [
  "contactName",
  "phone",
  "line1",
  "line2",
  "city",
  "state",
  "pincode",
];

export const REQUIRED_FIELDS: AddressField[] = [
  "contactName",
  "phone",
  "line1",
  "city",
  "state",
  "pincode",
];

export const FIELD_LABELS: Record<AddressField, string> = {
  contactName: "Full name",
  phone: "Phone number",
  line1: "Address line 1",
  line2: "Address line 2 (optional)",
  city: "City",
  state: "State",
  pincode: "Pincode",
};

export const FIELD_AUTOCOMPLETE: Record<AddressField, string> = {
  contactName: "name",
  phone: "tel",
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  state: "address-level1",
  pincode: "postal-code",
};

export const PHONE_PATTERN = /^\d{10}$/;
export const PINCODE_PATTERN = /^\d{6}$/;

export function validateField(
  field: AddressField,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (REQUIRED_FIELDS.includes(field) && !trimmed) {
    return `${FIELD_LABELS[field]} is required`;
  }
  if (field === "phone" && trimmed && !PHONE_PATTERN.test(trimmed)) {
    return "Enter a valid 10-digit phone number";
  }
  if (field === "pincode" && trimmed && !PINCODE_PATTERN.test(trimmed)) {
    return "Enter a valid 6-digit pincode";
  }
  return null;
}

const CheckIcon = () => (
  <svg
    className={styles.successIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface AddressFieldInputProps {
  field: AddressField;
  type?: string;
  value: string;
  error: string | null;
  showSuccess: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const AddressFieldInput: React.FC<AddressFieldInputProps> = ({
  field,
  type = "text",
  value,
  error,
  showSuccess,
  onChange,
  onBlur,
  inputRef,
}) => {
  const errorId = `checkout-${field}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`checkout-${field}`}>
        {FIELD_LABELS[field]}
      </label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={`checkout-${field}`}
          name={field}
          type={type}
          className={`${styles.input} ${error ? styles.inputError : ""}`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          autoComplete={FIELD_AUTOCOMPLETE[field]}
          inputMode={
            field === "phone" || field === "pincode" ? "numeric" : "text"
          }
        />
        {showSuccess && <CheckIcon />}
      </div>
      {error && (
        <span id={errorId} role="alert" className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  );
};
