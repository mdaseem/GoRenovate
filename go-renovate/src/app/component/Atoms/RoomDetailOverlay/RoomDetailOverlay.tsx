"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import "./RoomDetailOverlay.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  openSwapPicker,
  closeRoomDetail,
} from "@/app/store/features/categorySlice";
import {
  setOpenStateSlotPicker,
  setOpenStateRoomDetail,
} from "@/app/store/features/overLaySlice";
import EssentialSlotItem from "../EssentialSlotItem/EssentialSlotItem";
import Overlay from "../../HOC/Overlay/Overlay";
import RoomCheckoutForm, {
  RoomCheckoutItem,
} from "../../Molecules/RoomCheckoutForm/RoomCheckoutForm";
import { useToast } from "../../VendorPage/hooks/useToast";
import Toast from "../../VendorPage/components/Toast";
import { humanizeStyleTag } from "@/app/types/category";
import { useEssentialAvailability } from "../../CustomHooks/useEssentialAvailability";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function RoomDetailOverlay() {
  const dispatch = useAppDispatch();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast, showToast } = useToast();
  const activeRoomId = useAppSelector(
    (state: RootState) => state.categoryState.activeRoomId,
  );
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  const selectedEssentialBySlot = useAppSelector(
    (state: RootState) => state.categoryState.selectedEssentialBySlot,
  );
  const { availability, isChecking, checkAvailability } =
    useEssentialAvailability();

  const selectedItemIds = detail
    ? detail.category.slots
        .map((slot) => selectedEssentialBySlot[slot.id])
        .filter((id): id is string => Boolean(id))
    : [];
  const selectedItemIdsKey = selectedItemIds.join(",");

  useEffect(() => {
    if (!activeRoomId || selectedItemIds.length === 0) return;
    checkAvailability(selectedItemIds, { force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, selectedItemIdsKey]);

  if (!activeRoomId || !detail) return null;

  const room = detail.rooms.find((candidate) => candidate._id === activeRoomId);
  if (!room) {
    return (
      <div className="room-detail-overlay">
        <div className="room-detail-overlay-hero">
          <span className="room-detail-overlay-hero-placeholder" aria-hidden="true">
            🚫
          </span>
        </div>
        <h2 className="room-detail-overlay-title">This room is no longer available</h2>
        <p role="alert">
          It may have been updated or removed. Please go back and pick another room.
        </p>
        <button
          type="button"
          className="room-detail-overlay-checkout"
          onClick={() => dispatch(setOpenStateRoomDetail(false))}
        >
          Back to rooms
        </button>
      </div>
    );
  }

  const handleSwap = (slotId: string) => {
    dispatch(openSwapPicker(slotId));
    dispatch(setOpenStateSlotPicker(true));
  };

  const selectedItems = detail.category.slots
    .map((slot) => {
      const options = detail.essentialsBySlot[slot.id] ?? [];
      const selectedId = selectedEssentialBySlot[slot.id];
      return options.find((option) => option._id === selectedId);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const livePrice = (item: { _id: string; price: number }) =>
    availability[item._id]?.price ?? item.price;
  const total = selectedItems.reduce((sum, item) => sum + livePrice(item), 0);
  const vendorCount = new Set(selectedItems.map((item) => item.vendorId)).size;
  const hasUnavailableSelectedItem = selectedItems.some(
    (item) => availability[item._id]?.isAvailable === false,
  );

  const checkoutItems: RoomCheckoutItem[] = selectedItems.map((item) => ({
    essentialId: item._id,
    name: item.name,
    price: livePrice(item),
    quantity: 1,
    imageUrl: item.images[0],
    vendorId: item.vendorId,
    vendorName: item.vendorName,
  }));

  const handleOrderPlaced = () => {
    setIsCheckoutOpen(false);
    dispatch(setOpenStateRoomDetail(false));
    dispatch(closeRoomDetail());
    showToast("Order placed! You'll see it in My Orders soon.");
  };

  const handleCheckoutClick = async () => {
    const fresh = await checkAvailability(
      checkoutItems.map((item) => item.essentialId),
      { force: true },
    );
    const hasUnavailable = fresh
      ? checkoutItems.some(
          (item) => fresh[item.essentialId]?.isAvailable === false,
        )
      : hasUnavailableSelectedItem;
    if (hasUnavailable) {
      showToast("Some items are no longer available. Tap Swap to choose another.");
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div className="room-detail-overlay">
      {toast && <Toast text={toast.text} />}
      <div className="room-detail-overlay-hero">
        {room.heroImageUrl ? (
          <Image
            src={room.heroImageUrl}
            alt=""
            width={480}
            height={320}
            className="room-detail-overlay-hero-image"
          />
        ) : selectedItems.length > 0 ? (
          <div className="room-detail-overlay-hero-mosaic">
            {selectedItems.slice(0, 4).map((item) => (
              <div key={item._id} className="room-detail-overlay-hero-mosaic-tile">
                {item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt=""
                    fill
                    sizes="280px"
                    className="room-detail-overlay-hero-mosaic-image"
                  />
                ) : (
                  <span aria-hidden="true">📦</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span
            className="room-detail-overlay-hero-placeholder"
            aria-hidden="true"
          >
            🖼️
          </span>
        )}
        {room.styleTags.length > 0 && (
          <ul className="room-detail-overlay-hero-tags" aria-label="Style">
            {room.styleTags.map((tag) => (
              <li key={tag} className="room-detail-overlay-hero-tag">
                {humanizeStyleTag(tag)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="room-detail-overlay-title">
        {room.title}
        <span className="room-detail-overlay-count">
          · {detail.category.slots.length} item
          {detail.category.slots.length !== 1 ? "s" : ""}
        </span>
      </h2>

      <ul className="room-detail-overlay-list">
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
              essential={{ ...selected, price: livePrice(selected) }}
              alternatives={alternatives}
              onSwap={() => handleSwap(slot.id)}
              isUnavailable={availability[selected._id]?.isAvailable === false}
            />
          );
        })}
      </ul>

      <div className="room-detail-overlay-footer">
        <div className="room-detail-overlay-total-row">
          <div className="room-detail-overlay-total-info">
            <span className="room-detail-overlay-total-label">Room total</span>
            <span className="room-detail-overlay-total-sub">
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} ·{" "}
              {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
            </span>
          </div>
          <span
            key={total}
            className="room-detail-overlay-total-value"
            aria-live="polite"
          >
            {formatPrice(total)}
          </span>
        </div>
        <button
          type="button"
          className="room-detail-overlay-checkout"
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
      </div>

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
