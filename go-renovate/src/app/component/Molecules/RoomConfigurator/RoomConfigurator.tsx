"use client";
import React, { useEffect } from "react";
import "./RoomConfigurator.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  getCategoryDetail,
  openSwapPicker,
} from "@/app/store/features/categorySlice";
import { setOpenStateSlotPicker } from "@/app/store/features/overLaySlice";
import EssentialSlotItem from "../../Atoms/EssentialSlotItem/EssentialSlotItem";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import { Loader1 } from "../Loader/Loader";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

type Props = {
  categorySlug: string;
};

// Configures the category's first (today, only) Room — unchanged behavior,
// explicitly confirmed out of scope even once a category can have several
// Rooms (no Room-picker built into this tab).
export default function RoomConfigurator({ categorySlug }: Props) {
  const dispatch = useAppDispatch();
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  const isLoading = useAppSelector(
    (state: RootState) => state.categoryState.isLoadingCategoryDetail,
  );
  const error = useAppSelector(
    (state: RootState) => state.categoryState.categoryDetailError,
  );
  const selectedEssentialBySlot = useAppSelector(
    (state: RootState) => state.categoryState.selectedEssentialBySlot,
  );

  const fetchDetail = () =>
    dispatch(getCategoryDetail({ slug: categorySlug }));

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, categorySlug]);

  const handleSwap = (slotId: string) => {
    dispatch(openSwapPicker(slotId));
    dispatch(setOpenStateSlotPicker(true));
  };

  if (isLoading || !detail || detail.category.slug !== categorySlug) {
    return (
      <div className="room-configurator-status">
        {error ? (
          <ErrorState
            title="Couldn't load this category"
            message={error}
            actionLabel="Retry"
            onAction={fetchDetail}
          />
        ) : (
          <Loader1 />
        )}
      </div>
    );
  }

  const room = detail.rooms[0];

  const total = detail.category.slots.reduce((sum, slot) => {
    const selectedId = selectedEssentialBySlot[slot.id];
    const options = detail.essentialsBySlot[slot.id] ?? [];
    const selected = options.find((option) => option._id === selectedId);
    return sum + (selected?.price ?? 0);
  }, 0);

  return (
    <div className="room-configurator">
      <header className="room-configurator-header">
        <span className="room-configurator-icon" aria-hidden="true">
          {detail.category.icon}
        </span>
        <div>
          <h1 className="room-configurator-title">{detail.category.name}</h1>
          {room && (
            <p className="room-configurator-combo-title">{room.title}</p>
          )}
        </div>
      </header>

      <ul className="room-configurator-list">
        {detail.category.slots.map((slot) => {
          const options = detail.essentialsBySlot[slot.id] ?? [];
          const selectedId = selectedEssentialBySlot[slot.id];
          const selected = options.find(
            (option) => option._id === selectedId,
          );
          if (!selected) return null;
          return (
            <EssentialSlotItem
              key={slot.id}
              slot={slot}
              essential={selected}
              onSwap={() => handleSwap(slot.id)}
            />
          );
        })}
      </ul>

      <div className="room-configurator-total">
        <span>Total</span>
        <span className="room-configurator-total-value">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
