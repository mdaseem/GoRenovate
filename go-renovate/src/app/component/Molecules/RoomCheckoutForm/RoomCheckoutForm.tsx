"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "../../VendorPage/components/CheckoutForm.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  clearLastCreatedEssentialOrder,
  createEssentialOrder,
} from "@/app/store/features/essentialOrderSlice";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { EssentialOrderAddress } from "@/app/types/essentialOrder";
import {
  AddressField,
  AddressFieldInput,
  EMPTY_ADDRESS,
  FIELD_ORDER,
  validateField,
} from "../../VendorPage/components/AddressFields";

export interface RoomCheckoutItem {
  essentialId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  vendorId: string;
  vendorName: string;
}

interface RoomCheckoutFormProps {
  items: RoomCheckoutItem[];
  totalPrice: number;
  onClose: () => void;
  onPlaced: (orderId: string) => void;
}

const FALLBACK_IMAGE = "/house.jpg";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function groupByVendor(
  items: RoomCheckoutItem[],
): { vendorId: string; vendorName: string; items: RoomCheckoutItem[] }[] {
  const groups = new Map<
    string,
    { vendorId: string; vendorName: string; items: RoomCheckoutItem[] }
  >();
  items.forEach((item) => {
    if (!groups.has(item.vendorId)) {
      groups.set(item.vendorId, {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        items: [],
      });
    }
    groups.get(item.vendorId)?.items.push(item);
  });
  return Array.from(groups.values());
}

const RoomCheckoutForm: React.FC<RoomCheckoutFormProps> = ({
  items,
  totalPrice,
  onClose,
  onPlaced,
}) => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { isSubmitting, error, lastCreatedOrder } = useAppSelector(
    (state: RootState) => state.essentialOrderState,
  );

  const [address, setAddress] =
    useState<Record<AddressField, string>>(EMPTY_ADDRESS);
  const [touched, setTouched] = useState<
    Partial<Record<AddressField, boolean>>
  >({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const vendorGroups = useMemo(() => groupByVendor(items), [items]);

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
      dispatch(clearLastCreatedEssentialOrder());
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
          "Your room has no items — add something before checking out.",
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

      const orderAddress: EssentialOrderAddress = {
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
        createEssentialOrder({
          token: session.backendToken,
          data: {
            items: items.map(({ essentialId, quantity }) => ({
              essentialId,
              quantity,
            })),
            address: orderAddress,
          },
        }),
      );
    },
    [address, fieldErrors, session?.backendToken, items, dispatch],
  );

  const submissionError = localError || (hasSubmitted && error) || null;

  return (
    <div className={styles.checkout}>
      <h2 className={styles.heading}>Checkout</h2>
      <p className={styles.subheading}>
        Your room includes items from {vendorGroups.length} vendor
        {vendorGroups.length !== 1 ? "s" : ""} — each ships separately, but
        it&apos;s one order and one address.
      </p>

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>
          Order summary
          <span className={styles.summaryCount}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </h3>
        {vendorGroups.map((group) => (
          <div key={group.vendorId} className={styles.summaryVendorGroup}>
            <p className={styles.summaryVendorGroupTitle}>
              From {group.vendorName}
            </p>
            <ul className={styles.summaryList}>
              {group.items.map((item) => (
                <li key={item.essentialId} className={styles.summaryItem}>
                  <div className={styles.summaryItemMedia}>
                    <Image
                      src={item.imageUrl || FALLBACK_IMAGE}
                      alt=""
                      width={44}
                      height={44}
                      className={styles.summaryItemThumb}
                    />
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <span className={styles.summaryItemName}>
                      {item.name}
                    </span>
                    <span className={styles.summaryItemMeta}>
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                  </div>
                  <span className={styles.summaryItemTotal}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
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

export default RoomCheckoutForm;
