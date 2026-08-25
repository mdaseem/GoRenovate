"use client";
import React from "react";
import Image from "next/image";
import "./EssentialSwapPicker.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  selectSlotEssential,
  closeSwapPicker,
  cancelSwapPicker,
} from "@/app/store/features/categorySlice";
import { setOpenStateSlotPicker } from "@/app/store/features/overLaySlice";
import { computeRoomTotal } from "../../CategoryPage/category";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDelta(delta: number): string {
  if (delta === 0) return "Same price";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}₹${Math.abs(delta).toLocaleString("en-IN")}`;
}

export default function EssentialSwapPicker() {
  const dispatch = useAppDispatch();
  const activeSlotId = useAppSelector(
    (state: RootState) => state.categoryState.activeSwapSlotId,
  );
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  const selectedEssentialBySlot = useAppSelector(
    (state: RootState) => state.categoryState.selectedEssentialBySlot,
  );

  if (!activeSlotId || !detail) return null;

  const slot = detail.category.slots.find((item) => item.id === activeSlotId);
  const options = detail.essentialsBySlot[activeSlotId] ?? [];
  const currentId = selectedEssentialBySlot[activeSlotId];
  const currentEssential = options.find((option) => option._id === currentId);
  const roomTotal = computeRoomTotal(detail, selectedEssentialBySlot);

  const handleDone = () => {
    dispatch(setOpenStateSlotPicker(false));
    dispatch(closeSwapPicker());
  };

  const handleCancel = () => {
    dispatch(setOpenStateSlotPicker(false));
    dispatch(cancelSwapPicker());
  };

  return (
    <div className="essential-swap-picker">
      <div className="essential-swap-picker-header">
        <h2 className="essential-swap-picker-title">
          Choose a {slot?.label ?? "item"}
        </h2>
      </div>
      <ul className="essential-swap-picker-grid">
        {options.map((essential) => {
          const inputId = `swap-option-${essential._id}`;
          const isSelected = essential._id === currentId;
          const image = essential.images[0];
          const delta = currentEssential
            ? essential.price - currentEssential.price
            : 0;

          return (
            <li key={essential._id} className="essential-swap-picker-option">
              <input
                type="radio"
                id={inputId}
                name="essential-swap-option"
                className="essential-swap-picker-radio"
                checked={isSelected}
                onChange={() =>
                  dispatch(
                    selectSlotEssential({
                      slotId: activeSlotId,
                      essentialId: essential._id,
                    }),
                  )
                }
              />
              <label
                htmlFor={inputId}
                className={`essential-swap-picker-card${
                  isSelected ? " essential-swap-picker-card-selected" : ""
                }`}
              >
                <span className="essential-swap-picker-card-media">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="160px"
                      className="essential-swap-picker-card-image"
                    />
                  ) : (
                    <span aria-hidden="true">📦</span>
                  )}
                  {isSelected && (
                    <span
                      className="essential-swap-picker-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </span>
                <span className="essential-swap-picker-option-name">
                  {essential.name}
                </span>
                <span className="essential-swap-picker-option-meta">
                  {formatPrice(essential.price)} · {essential.vendorName}
                </span>
                <span
                  className={`essential-swap-picker-delta${
                    isSelected
                      ? " essential-swap-picker-delta-current"
                      : delta > 0
                        ? " essential-swap-picker-delta-up"
                        : delta < 0
                          ? " essential-swap-picker-delta-down"
                          : ""
                  }`}
                >
                  {isSelected ? "Current pick" : formatDelta(delta)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="essential-swap-picker-footer">
        <p className="essential-swap-picker-total" aria-live="polite">
          Room total:{" "}
          <strong key={roomTotal}>{formatPrice(roomTotal)}</strong>
        </p>
        <div className="essential-swap-picker-footer-actions">
          <button
            type="button"
            className="essential-swap-picker-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="essential-swap-picker-done"
            onClick={handleDone}
          >
            <svg
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
