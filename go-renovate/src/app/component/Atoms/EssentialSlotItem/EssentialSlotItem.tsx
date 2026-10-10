import React from "react";
import Image from "next/image";
import "./EssentialSlotItem.css";
import { Essential, CategorySlot } from "@/app/types/category";

type Props = {
  slot: CategorySlot;
  essential: Essential;
  // Other options for this slot (currently-selected one excluded) — shown
  // as a peeking thumbnail stack on the Swap control so "you have other
  // choices here" is visible before tapping, not just discovered by
  // accident.
  alternatives: Essential[];
  onSwap: () => void;
  // Set when a live availability check (see useEssentialAvailability) found
  // this exact item is no longer in the catalog — the row still renders
  // (name/image/last-known price), just flagged so Swap reads as the
  // obvious next step instead of an optional one.
  isUnavailable?: boolean;
  // Why it is unavailable: "Out of stock" vs the default "No longer available".
  unavailableLabel?: string;
  // Units left when stock is tracked and running low — shown as a nudge.
  lowStock?: number | null;
  // Customize only: lets the user empty the slot again.
  onRemove?: () => void;
  // Customize only: how many copies are in the room, with a stepper. Omit for
  // single-quantity rows (curated rooms).
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  maxQuantity?: number;
};

export const LOW_STOCK_THRESHOLD = 5;

const MAX_PEEK_THUMBS = 2;

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function EssentialSlotItem({
  slot,
  essential,
  alternatives,
  onSwap,
  isUnavailable = false,
  unavailableLabel = "No longer available",
  lowStock = null,
  onRemove,
  quantity,
  onQuantityChange,
  maxQuantity = 10,
}: Props) {
  const image = essential.images[0];
  const peekItems = alternatives.slice(0, MAX_PEEK_THUMBS);
  const extraCount = alternatives.length - peekItems.length;

  return (
    <li
      className={`essential-slot-item${
        isUnavailable ? " essential-slot-item-unavailable" : ""
      }`}
    >
      <div className="essential-slot-item-media">
        {image ? (
          <Image
            src={image}
            alt=""
            width={84}
            height={84}
            className="essential-slot-item-image"
          />
        ) : (
          <span
            className="essential-slot-item-placeholder"
            aria-hidden="true"
          >
            📦
          </span>
        )}
      </div>
      <div className="essential-slot-item-details">
        <span className="essential-slot-item-slot-label">{slot.label}</span>
        <p className="essential-slot-item-name">{essential.name}</p>
        {isUnavailable ? (
          <p className="essential-slot-item-unavailable-notice">
            {unavailableLabel}
            {alternatives.length > 0 ? " — tap Swap to choose another" : ""}
          </p>
        ) : (
          <p className="essential-slot-item-meta">
            {formatPrice(essential.price)}
            {quantity !== undefined && quantity > 1 ? ` × ${quantity}` : ""} ·{" "}
            {essential.vendorName}
            {lowStock !== null &&
              lowStock > 0 &&
              lowStock <= LOW_STOCK_THRESHOLD && (
                <span className="essential-slot-item-low-stock">
                  {" "}
                  · Only {lowStock} left
                </span>
              )}
          </p>
        )}
      </div>
      {onQuantityChange && quantity !== undefined && (
        <div
          className="essential-slot-item-qty"
          role="group"
          aria-label={`Quantity of ${essential.name}`}
        >
          <button
            type="button"
            className="essential-slot-item-qty-button"
            onClick={() => onQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            aria-label={`Decrease quantity of ${essential.name}`}
          >
            <span aria-hidden="true">−</span>
          </button>
          <span className="essential-slot-item-qty-value" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="essential-slot-item-qty-button"
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={quantity >= maxQuantity}
            aria-label={`Increase quantity of ${essential.name}`}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          className="essential-slot-item-remove"
          onClick={onRemove}
          aria-label={`Remove ${essential.name} from ${slot.label}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
      {alternatives.length > 0 && (
        <button
          type="button"
          className={`essential-slot-item-swap${
            isUnavailable ? " essential-slot-item-swap-urgent" : ""
          }`}
          onClick={onSwap}
          aria-label={`Swap ${slot.label} — ${alternatives.length} more option${
            alternatives.length === 1 ? "" : "s"
          } available`}
        >
          <span className="essential-slot-item-swap-stack" aria-hidden="true">
            {peekItems.map((alt) =>
              alt.images[0] ? (
                <Image
                  key={alt._id}
                  src={alt.images[0]}
                  alt=""
                  width={28}
                  height={28}
                  className="essential-slot-item-swap-thumb"
                />
              ) : (
                <span
                  key={alt._id}
                  className="essential-slot-item-swap-thumb essential-slot-item-swap-thumb-placeholder"
                >
                  📦
                </span>
              ),
            )}
            {extraCount > 0 && (
              <span className="essential-slot-item-swap-thumb essential-slot-item-swap-more">
                +{extraCount}
              </span>
            )}
          </span>
          <span className="essential-slot-item-swap-label">Swap</span>
        </button>
      )}
    </li>
  );
}
