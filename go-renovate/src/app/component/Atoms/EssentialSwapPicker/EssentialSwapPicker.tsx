"use client";
import React from "react";
import "./EssentialSwapPicker.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  selectSlotEssential,
  closeSwapPicker,
} from "@/app/store/features/categorySlice";
import { setOpenStateSlotPicker } from "@/app/store/features/overLaySlice";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
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

  const handleDone = () => {
    dispatch(setOpenStateSlotPicker(false));
    dispatch(closeSwapPicker());
  };

  return (
    <div className="essential-swap-picker">
      <h2 className="essential-swap-picker-title">
        Choose a {slot?.label ?? "item"}
      </h2>
      <ul className="essential-swap-picker-list">
        {options.map((essential) => {
          const inputId = `swap-option-${essential._id}`;
          return (
            <li key={essential._id} className="essential-swap-picker-option">
              <input
                type="radio"
                id={inputId}
                name="essential-swap-option"
                className="essential-swap-picker-radio"
                checked={essential._id === currentId}
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
                className="essential-swap-picker-option-label"
              >
                <span className="essential-swap-picker-option-name">
                  {essential.name}
                </span>
                <span className="essential-swap-picker-option-meta">
                  {formatPrice(essential.price)} · {essential.vendorName}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="essential-swap-picker-done"
        onClick={handleDone}
      >
        Done
      </button>
    </div>
  );
}
