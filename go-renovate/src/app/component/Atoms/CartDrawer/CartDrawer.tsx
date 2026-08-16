import React, { useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./CartDrawer.module.css";
import { CartItem } from "../../VendorPage/vendor";
import { UNIT_LABELS } from "../../VendorPage/VendorData";
import { AvailabilityEntry } from "../../CustomHooks/useCartAvailability";
import { useCloseOnBackButton } from "../../CustomHooks/useCloseOnBackButton";

interface CartDrawerProps {
  items: CartItem[];
  totalPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onRemove: (serviceId: string) => void;
  onClear: () => void;
  onRequestQuote: () => void;
  availability: Record<string, AvailabilityEntry>;
  isCheckingAvailability: boolean;
  availabilityCheckError: string | null;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  totalPrice,
  isOpen,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onRequestQuote,
  availability,
  isCheckingAvailability,
  availabilityCheckError,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useCloseOnBackButton(isOpen, onClose);

  // Trap focus inside drawer when open
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();

    return () => {
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const hasUnavailableItems = useMemo(
    () => items.some((item) => availability[item.service.id]?.isAvailable === false),
    [items, availability],
  );

  if (!isOpen) return null;

  const formattedTotal = currencyFormatter.format(totalPrice);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const checkoutDisabled = hasUnavailableItems;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Your quote cart"
    >
      <div className={styles.drawer} ref={drawerRef} tabIndex={-1}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            Your Cart
            {totalQuantity > 0 && (
              <span className={styles.itemCount}>
                · {totalQuantity} service{totalQuantity !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {isCheckingAvailability && (
          <div
            className={styles.availabilityStatus}
            role="status"
            aria-live="polite"
          >
            <span className={styles.availabilitySpinner} aria-hidden="true" />
            Checking availability…
          </div>
        )}
        {!isCheckingAvailability && availabilityCheckError && (
          <div className={styles.availabilityStatus} role="status">
            {availabilityCheckError}
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.emptyCart} role="status" aria-live="polite">
            <span className={styles.emptyIcon} aria-hidden="true">
              🏗️
            </span>
            <p className={styles.emptyText}>No services added yet</p>
            <p className={styles.emptySubtext}>
              Browse categories and add services to get a quote
            </p>
          </div>
        ) : (
          <ul
            className={styles.cartItems}
            role="list"
            aria-label="Selected services"
          >
            {items.map(({ service, categoryLabel, quantity }) => {
              const unitLabel =
                UNIT_LABELS[service.unit] ?? `per ${service.unit}`;
              const itemTotal = currencyFormatter.format(
                service.price * quantity,
              );
              const entry = availability[service.id];
              const isUnavailable = entry?.isAvailable === false;
              const priceChanged =
                !isUnavailable &&
                entry?.price !== null &&
                entry?.price !== undefined &&
                entry.price !== service.price;

              return (
                <li
                  key={service.id}
                  className={`${styles.cartItem} ${isUnavailable ? styles.cartItemUnavailable : ""}`}
                  role="listitem"
                >
                  <div className={styles.cartItemInfo}>
                    <div className={styles.cartItemCategory}>
                      {categoryLabel}
                    </div>
                    <h3 className={styles.cartItemName}>{service.name}</h3>
                    <div className={styles.cartItemPrice}>
                      {itemTotal} · {quantity} × {unitLabel}
                    </div>

                    {isUnavailable && (
                      <div className={styles.unavailableRow}>
                        <span className={styles.unavailableBadge}>
                          No longer available
                        </span>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => onRemove(service.id)}
                          aria-label={`Remove ${service.name} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {priceChanged && entry && (
                      <div className={styles.priceChangedNote} role="status">
                        Price updated to{" "}
                        {currencyFormatter.format(entry.price as number)}
                      </div>
                    )}
                  </div>

                  {!isUnavailable && (
                    <div
                      className={styles.cartItemControl}
                      role="group"
                      aria-label={`Quantity for ${service.name}`}
                    >
                      <button
                        className={styles.cartQtyBtn}
                        onClick={() => onDecrement(service.id)}
                        type="button"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className={styles.cartQtyVal} aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        className={styles.cartQtyBtn}
                        onClick={() => onIncrement(service.id)}
                        type="button"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.totalRow}>
              <div>
                <div className={styles.totalLabel}>Estimated Total</div>
                <div className={styles.totalNote}>
                  Final quote after site inspection
                </div>
              </div>
              <span
                className={styles.totalAmount}
                aria-label={`Total: ${formattedTotal}`}
              >
                {formattedTotal}
              </span>
            </div>
            {checkoutDisabled && (
              <p
                id="cart-checkout-blocked-reason"
                className={styles.checkoutBlockedNote}
                role="alert"
              >
                Remove unavailable items to continue.
              </p>
            )}
            <button
              className={styles.requestQuoteButton}
              onClick={onRequestQuote}
              type="button"
              disabled={checkoutDisabled}
              aria-describedby={
                checkoutDisabled ? "cart-checkout-blocked-reason" : undefined
              }
            >
              Checkout →
            </button>
            <button
              className={styles.clearButton}
              onClick={onClear}
              type="button"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
