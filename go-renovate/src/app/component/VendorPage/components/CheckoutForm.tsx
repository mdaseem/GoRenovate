"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "./CheckoutForm.module.css";
import { CartItem } from "../vendor";
import { UNIT_LABELS } from "../VendorData";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  clearLastCreatedOrder,
  createOrder,
} from "@/app/store/features/orderSlice";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { OrderAddress, OrderItem } from "@/app/types/order";

interface CheckoutFormProps {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onPlaced: (orderId: string) => void;
}

type AddressField =
  | "contactName"
  | "phone"
  | "line1"
  | "line2"
  | "city"
  | "state"
  | "pincode";

const EMPTY_ADDRESS: Record<AddressField, string> = {
  contactName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const FIELD_ORDER: AddressField[] = [
  "contactName",
  "phone",
  "line1",
  "line2",
  "city",
  "state",
  "pincode",
];

const REQUIRED_FIELDS: AddressField[] = [
  "contactName",
  "phone",
  "line1",
  "city",
  "state",
  "pincode",
];

const FIELD_LABELS: Record<AddressField, string> = {
  contactName: "Full name",
  phone: "Phone number",
  line1: "Address line 1",
  line2: "Address line 2 (optional)",
  city: "City",
  state: "State",
  pincode: "Pincode",
};

const FIELD_AUTOCOMPLETE: Record<AddressField, string> = {
  contactName: "name",
  phone: "tel",
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  state: "address-level1",
  pincode: "postal-code",
};

const PHONE_PATTERN = /^\d{10}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const FALLBACK_IMAGE = "/house.jpg";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function validateField(field: AddressField, value: string): string | null {
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

const AddressFieldInput: React.FC<AddressFieldInputProps> = ({
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

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  vendorId,
  vendorName,
  items,
  totalPrice,
  onClose,
  onPlaced,
}) => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { isSubmitting, error, lastCreatedOrder } = useAppSelector(
    (state: RootState) => state.orderState,
  );

  const [address, setAddress] =
    useState<Record<AddressField, string>>(EMPTY_ADDRESS);
  const [touched, setTouched] = useState<
    Partial<Record<AddressField, boolean>>
  >({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  useEffect(() => {
    if (hasSubmitted && lastCreatedOrder) {
      onPlaced(lastCreatedOrder._id);
      dispatch(clearLastCreatedOrder());
    }
  }, [hasSubmitted, lastCreatedOrder, onPlaced, dispatch]);

  const fieldErrors = useMemo(
    () =>
      FIELD_ORDER.reduce<Partial<Record<AddressField, string | null>>>(
        (acc, field) => {
          acc[field] = validateField(field, address[field]);
          return acc;
        },
        {},
      ),
    [address],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const field = event.target.name as AddressField;
      setAddress((prev) => ({ ...prev, [field]: event.target.value }));
    },
    [],
  );

  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as AddressField;
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLocalError(null);

      if (items.length === 0) {
        setLocalError(
          "Your cart is empty — add a service before checking out.",
        );
        return;
      }

      const firstInvalidField = FIELD_ORDER.find((field) => fieldErrors[field]);
      if (firstInvalidField) {
        setTouched(
          FIELD_ORDER.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        );
        document.getElementById(`checkout-${firstInvalidField}`)?.focus();
        return;
      }

      if (!session?.backendToken) {
        setLocalError("Your session has expired — please sign in again.");
        dispatch(setOpenStateLogin(true));
        return;
      }

      const orderItems: OrderItem[] = items.map(
        ({ service, categoryLabel, quantity }) => ({
          serviceId: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          unit: service.unit,
          quantity,
          categoryLabel,
          imageUrl: service.imageUrl,
        }),
      );

      const orderAddress: OrderAddress = {
        contactName: address.contactName.trim(),
        phone: address.phone.trim(),
        line1: address.line1.trim(),
        line2: address.line2.trim() || undefined,
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      };

      setHasSubmitted(true);
      dispatch(
        createOrder({
          token: session.backendToken,
          data: {
            vendorId,
            vendorName,
            items: orderItems,
            address: orderAddress,
          },
        }),
      );
    },
    [
      address,
      fieldErrors,
      session?.backendToken,
      items,
      vendorId,
      vendorName,
      dispatch,
    ],
  );

  const submissionError = localError || (hasSubmitted && error) || null;

  return (
    <div className={styles.checkout}>
      <h2 className={styles.heading}>Checkout</h2>
      <p className={styles.subheading}>
        Confirm your details so {vendorName} can arrange pickup and delivery.
      </p>

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>
          Order summary
          <span className={styles.summaryCount}>
            {items.length} service{items.length !== 1 ? "s" : ""}
          </span>
        </h3>
        <ul className={styles.summaryList}>
          {items.map(({ service, quantity }) => {
            const unitLabel = UNIT_LABELS[service.unit] ?? `per ${service.unit}`;
            return (
              <li key={service.id} className={styles.summaryItem}>
                <div className={styles.summaryItemMedia}>
                  <Image
                    src={service.imageUrl || FALLBACK_IMAGE}
                    alt=""
                    width={44}
                    height={44}
                    className={styles.summaryItemThumb}
                  />
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemName}>
                    {service.name}
                  </span>
                  <span className={styles.summaryItemMeta}>
                    {quantity} × {formatCurrency(service.price)} · {unitLabel}
                  </span>
                </div>
                <span className={styles.summaryItemTotal}>
                  {formatCurrency(service.price * quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Contact details</legend>
          <div className={styles.fieldRow}>
            <AddressFieldInput
              field="contactName"
              value={address.contactName}
              error={touched.contactName ? fieldErrors.contactName ?? null : null}
              showSuccess={!!touched.contactName && !fieldErrors.contactName}
              onChange={handleChange}
              onBlur={handleBlur}
              inputRef={firstFieldRef}
            />
            <AddressFieldInput
              field="phone"
              type="tel"
              value={address.phone}
              error={touched.phone ? fieldErrors.phone ?? null : null}
              showSuccess={!!touched.phone && !fieldErrors.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Delivery address</legend>
          <AddressFieldInput
            field="line1"
            value={address.line1}
            error={touched.line1 ? fieldErrors.line1 ?? null : null}
            showSuccess={!!touched.line1 && !fieldErrors.line1}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <AddressFieldInput
            field="line2"
            value={address.line2}
            error={touched.line2 ? fieldErrors.line2 ?? null : null}
            showSuccess={false}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <div className={styles.fieldRow}>
            <AddressFieldInput
              field="city"
              value={address.city}
              error={touched.city ? fieldErrors.city ?? null : null}
              showSuccess={!!touched.city && !fieldErrors.city}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <AddressFieldInput
              field="state"
              value={address.state}
              error={touched.state ? fieldErrors.state ?? null : null}
              showSuccess={!!touched.state && !fieldErrors.state}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          <AddressFieldInput
            field="pincode"
            value={address.pincode}
            error={touched.pincode ? fieldErrors.pincode ?? null : null}
            showSuccess={!!touched.pincode && !fieldErrors.pincode}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </fieldset>

        <div className={styles.footer}>
          {submissionError && (
            <span className={styles.formError} role="alert">
              {submissionError}
            </span>
          )}
          <div className={styles.footerRow}>
            <div className={styles.footerTotal}>
              <span className={styles.footerTotalLabel}>Total</span>
              <span className={styles.footerTotalValue}>
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.placeOrderButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Placing order…" : "Place order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutForm;
