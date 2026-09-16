"use client";
import React from "react";
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
import { computeRoomTotal } from "@/app/types/category";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

type Props = {
  categorySlug: string;
};

function RoomConfiguratorSkeleton() {
  return (
    <div className="room-configurator" aria-hidden="true">
      <header className="room-configurator-header">
        <span className="room-configurator-skeleton-icon room-configurator-skeleton-shimmer" />
        <div className="room-configurator-skeleton-heading">
          <span className="room-configurator-skeleton-title room-configurator-skeleton-shimmer" />
          <span className="room-configurator-skeleton-subtitle room-configurator-skeleton-shimmer" />
        </div>
      </header>

      <ul className="room-configurator-list">
        {[1, 2, 3, 4].map((key) => (
          <li key={key} className="room-configurator-skeleton-item">
            <span className="room-configurator-skeleton-thumb room-configurator-skeleton-shimmer" />
            <div className="room-configurator-skeleton-lines">
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-label room-configurator-skeleton-shimmer" />
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-name room-configurator-skeleton-shimmer" />
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-meta room-configurator-skeleton-shimmer" />
            </div>
            <span className="room-configurator-skeleton-swap room-configurator-skeleton-shimmer" />
          </li>
        ))}
      </ul>

      <div className="room-configurator-skeleton-total room-configurator-skeleton-shimmer" />
    </div>
  );
}

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

  const handleSwap = (slotId: string) => {
    dispatch(openSwapPicker(slotId));
    dispatch(setOpenStateSlotPicker(true));
  };

  if (isLoading || !detail || detail.category.slug !== categorySlug) {
    if (error) {
      return (
        <div className="room-configurator-status">
          <ErrorState
            title="Couldn't load this category"
            message={error}
            actionLabel="Retry"
            onAction={fetchDetail}
          />
        </div>
      );
    }
    return <RoomConfiguratorSkeleton />;
  }

  const room = detail.rooms[0];

  const total = computeRoomTotal(detail, selectedEssentialBySlot);

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
          const alternatives = options.filter(
            (option) => option._id !== selected._id,
          );
          return (
            <EssentialSlotItem
              key={slot.id}
              slot={slot}
              essential={selected}
              alternatives={alternatives}
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
