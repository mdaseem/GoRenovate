import React, { useEffect, useCallback, useRef } from "react";
import styles from "./CartDrawer.module.css";
import { CartItem } from "../../VendorPage/vendor";
import { UNIT_LABELS } from "../../VendorPage/VendorData";

interface CartDrawerProps {
  items: CartItem[];
  totalPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onClear: () => void;
  onRequestQuote: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  totalPrice,
  isOpen,
  onClose,
  onIncrement,
  onDecrement,
  onClear,
  onRequestQuote,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

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
              const itemTotal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(service.price * quantity);

              return (
                <li
                  key={service.id}
                  className={styles.cartItem}
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
                  </div>
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
            <button
              className={styles.requestQuoteButton}
              onClick={onRequestQuote}
              type="button"
            >
              Request a Quote →
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
