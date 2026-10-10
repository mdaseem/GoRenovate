"use client";
import React, { useState } from "react";
import styles from "./RoomCheckoutFooter.module.css";
import Overlay from "@/app/component/HOC/Overlay/Overlay";
import RoomCheckoutForm, {
  RoomCheckoutItem,
} from "../RoomCheckoutForm/RoomCheckoutForm";
import { useToast } from "@/app/component/Features/VendorPage/hooks/useToast";
import Toast from "@/app/component/Features/VendorPage/components/Toast";
import { Essential } from "@/app/types/category";
import { AvailabilityEntry } from "@/app/component/CustomHooks/useEssentialAvailability";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

type Props = {
  // The products currently picked for the Room (one per filled slot).
  selectedItems: Essential[];
  // Live results from useEssentialAvailability, owned by the parent so the
  // same check also drives its per-slot "out of stock" flags.
  availability: Record<string, AvailabilityEntry>;
  isChecking: boolean;
  checkAvailability: (
    essentialIds: string[],
    options?: { force?: boolean },
  ) => Promise<Record<string, AvailabilityEntry> | null>;
  onOrderPlaced: () => void;
  // Copies of each piece (Customize quantities). Missing = 1.
  quantityById?: Record<string, number>;
};

export default function RoomCheckoutFooter({
  selectedItems,
  availability,
  isChecking,
  checkAvailability,
  onOrderPlaced,
  quantityById = {},
}: Props) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast, showToast } = useToast();

  const livePrice = (item: Essential) =>
    availability[item._id]?.price ?? item.price;
  const quantityOf = (item: Essential) => quantityById[item._id] ?? 1;
  const total = selectedItems.reduce(
    (sum, item) => sum + livePrice(item) * quantityOf(item),
    0,
  );
  const itemCount = selectedItems.reduce((sum, item) => sum + quantityOf(item), 0);
  const vendorCount = new Set(selectedItems.map((item) => item.vendorId)).size;

  const checkoutItems: RoomCheckoutItem[] = selectedItems.map((item) => ({
    essentialId: item._id,
    name: item.name,
    price: livePrice(item),
    quantity: quantityOf(item),
    imageUrl: item.images[0],
    vendorId: item.vendorId,
    vendorName: item.vendorName,
  }));

  // More copies than are in stock counts as unavailable too.
  const isShort = (
    item: Essential,
    entries: Record<string, AvailabilityEntry>,
  ) => {
    const entry = entries[item._id];
    return (
      entry?.isAvailable === false ||
      (entry?.stock != null && quantityOf(item) > entry.stock)
    );
  };
  const hasUnavailableSelectedItem = selectedItems.some((item) =>
    isShort(item, availability),
  );

  const handleCheckoutClick = async () => {
    // Re-check right before opening the form — stock can change while the
    // user is browsing. The server still has the final say at order time.
    const fresh = await checkAvailability(
      checkoutItems.map((item) => item.essentialId),
      { force: true },
    );
    const hasUnavailable = fresh
      ? selectedItems.some((item) => isShort(item, fresh))
      : hasUnavailableSelectedItem;
    if (hasUnavailable) {
      showToast(
        "Some items are out of stock or you've chosen more than are available. Adjust them and try again.",
      );
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = () => {
    setIsCheckoutOpen(false);
    onOrderPlaced();
    showToast("Order placed! You'll see it in My Orders soon.");
  };

  return (
    <div className={styles.footer}>
      {toast && <Toast text={toast.text} />}
      <div className={styles.totalRow}>
        <div className={styles.totalInfo}>
          <span className={styles.totalLabel}>Room total</span>
          <span className={styles.totalSub}>
            {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
            {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
          </span>
        </div>
        <span key={total} className={styles.totalValue} aria-live="polite">
          {formatPrice(total)}
        </span>
      </div>
      <button
        type="button"
        className={styles.checkout}
        onClick={handleCheckoutClick}
        disabled={checkoutItems.length === 0 || isChecking}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9V7a6 6 0 1 1 12 0v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="4"
            y="9"
            width="16"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        {isChecking ? "Checking…" : "Checkout →"}
      </button>

      <Overlay
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        isDisable={false}
        shouldReturnNull={!isCheckoutOpen}
      >
        <RoomCheckoutForm
          items={checkoutItems}
          totalPrice={total}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaced={handleOrderPlaced}
        />
      </Overlay>
    </div>
  );
}
