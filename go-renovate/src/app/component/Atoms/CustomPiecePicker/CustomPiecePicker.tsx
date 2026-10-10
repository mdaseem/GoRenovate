"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./CustomPiecePicker.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  toggleCustomEssential,
  addCustomPiece,
  removeOneCustomPiece,
  closeCustomPicker,
  cancelCustomPicker,
} from "@/app/store/features/categorySlice";
import { setOpenStateSlotPicker } from "@/app/store/features/overLaySlice";
import { useEssentialAvailability } from "@/app/component/CustomHooks/useEssentialAvailability";
import { MAX_QUANTITY_PER_PIECE, countById } from "@/app/utils/customPieces";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

// Content of the shared slot-picker overlay when the user taps "Add a piece"
// in the Customize tab. Unlike the Room swap picker there is no slot to fill:
// the whole catalog for the category is on offer, and the product-type chips
// are only a way to narrow the list — nothing is required or prescribed.
export default function CustomPiecePicker() {
  const dispatch = useAppDispatch();
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  const addedIds = useAppSelector(
    (state: RootState) => state.categoryState.customEssentialIds,
  );
  const { availability, checkError, checkAvailability } =
    useEssentialAvailability();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const allEssentials = useMemo(
    () => (detail ? Object.values(detail.essentialsBySlot).flat() : []),
    [detail],
  );
  const visibleEssentials = useMemo(
    () =>
      typeFilter && detail
        ? (detail.essentialsBySlot[typeFilter] ?? [])
        : allEssentials,
    [typeFilter, detail, allEssentials],
  );

  const visibleIdsKey = visibleEssentials.map((item) => item._id).join(",");
  useEffect(() => {
    if (!visibleIdsKey) return;
    // Runs as soon as the picker opens (and when the type filter changes),
    // so stock is verified before the user can add anything.
    checkAvailability(visibleIdsKey.split(","), { force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdsKey]);

  if (!detail) return null;

  const counts = countById(addedIds);
  const addedItems = allEssentials.filter((item) => counts[item._id]);
  const pieceCount = addedIds.length;
  const total = addedItems.reduce(
    (sum, item) =>
      sum + (availability[item._id]?.price ?? item.price) * counts[item._id],
    0,
  );

  const handleDone = () => {
    dispatch(setOpenStateSlotPicker(false));
    dispatch(closeCustomPicker());
  };
  const handleCancel = () => {
    dispatch(setOpenStateSlotPicker(false));
    dispatch(cancelCustomPicker());
  };

  const chips: { id: string | null; label: string; count: number }[] = [
    { id: null, label: "All", count: allEssentials.length },
    ...detail.category.slots
      .map((slot) => ({
        id: slot.id,
        label: slot.label,
        count: (detail.essentialsBySlot[slot.id] ?? []).length,
      }))
      .filter((chip) => chip.count > 0),
  ];

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add to your room</h2>
        <p className={styles.sub}>
          Tap anything you like — add as many pieces as you want.
        </p>
      </div>

      {checkError && (
        <p className={styles.notice} role="status">
          We couldn&apos;t verify stock just now. You can still add pieces —
          we&apos;ll check again at checkout.
        </p>
      )}

      <ul className={styles.chips} aria-label="Filter by type">
        {chips.map((chip) => (
          <li key={chip.id ?? "all"}>
            <button
              type="button"
              className={`${styles.chip}${
                typeFilter === chip.id ? ` ${styles.chipActive}` : ""
              }`}
              aria-pressed={typeFilter === chip.id}
              onClick={() => setTypeFilter(chip.id)}
            >
              {chip.label}
              <span className={styles.chipCount}>{chip.count}</span>
            </button>
          </li>
        ))}
      </ul>

      <ul className={styles.grid}>
        {visibleEssentials.map((essential) => {
          const inputId = `custom-piece-${essential._id}`;
          const quantity = counts[essential._id] ?? 0;
          const isAdded = quantity > 0;
          const entry = availability[essential._id];
          const isUnavailable = entry?.isAvailable === false;
          // No answer yet (the check runs the moment the picker opens): hold off so a
          // piece can't be picked before we know it's in stock.
          const isPending = !entry && !checkError;
          const image = essential.images[0];
          const price = entry?.price ?? essential.price;
          // Never offer more copies than are in stock.
          const maxQuantity = Math.min(
            MAX_QUANTITY_PER_PIECE,
            entry?.stock ?? MAX_QUANTITY_PER_PIECE,
          );

          return (
            <li key={essential._id} className={styles.option}>
              <input
                type="checkbox"
                id={inputId}
                className={styles.check}
                checked={isAdded}
                // An unavailable piece can't be added, but one that's
                // already in the room can still be taken out.
                disabled={(isUnavailable || isPending) && !isAdded}
                onChange={() => dispatch(toggleCustomEssential(essential._id))}
              />
              <label
                htmlFor={inputId}
                className={`${styles.card}${isAdded ? ` ${styles.cardAdded}` : ""}${
                  isUnavailable ? ` ${styles.cardUnavailable}` : ""
                }`}
              >
                <span className={styles.media}>
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="160px"
                      className={styles.image}
                    />
                  ) : (
                    <span aria-hidden="true">📦</span>
                  )}
                  {isAdded && (
                    <span className={styles.tick} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </span>
                <span className={styles.name}>{essential.name}</span>
                <span className={styles.meta}>
                  {formatPrice(price)} · {essential.vendorName}
                </span>
                <span
                  className={`${styles.status}${
                    isUnavailable ? ` ${styles.statusBad}` : ""
                  }`}
                >
                  {isPending
                    ? "Checking stock…"
                    : isUnavailable
                    ? entry?.stock === 0
                      ? "Out of stock"
                      : "Unavailable"
                    : isAdded
                      ? "Added · tap to remove"
                      : entry?.stock != null && entry.stock <= 5
                        ? `Only ${entry.stock} left`
                        : "Tap to add"}
                </span>
                {isAdded && (
                  <span
                    className={styles.stepper}
                    role="group"
                    aria-label={`Quantity of ${essential.name}`}
                  >
                    <button
                      type="button"
                      className={styles.stepButton}
                      onClick={() => dispatch(removeOneCustomPiece(essential._id))}
                      disabled={quantity <= 1}
                      aria-label={`Decrease quantity of ${essential.name}`}
                    >
                      <span aria-hidden="true">−</span>
                    </button>
                    <span className={styles.stepValue} aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className={styles.stepButton}
                      onClick={() => dispatch(addCustomPiece(essential._id))}
                      disabled={quantity >= maxQuantity}
                      aria-label={`Increase quantity of ${essential.name}`}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <p className={styles.total} aria-live="polite">
          {pieceCount} piece{pieceCount !== 1 ? "s" : ""} ·{" "}
          <strong key={total}>{formatPrice(total)}</strong>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className={styles.done} onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
