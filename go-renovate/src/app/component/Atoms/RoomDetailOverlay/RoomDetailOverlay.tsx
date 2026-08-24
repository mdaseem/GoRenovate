"use client";
import React, { useState } from "react";
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

  if (!activeRoomId || !detail) return null;

  const room = detail.rooms.find((candidate) => candidate._id === activeRoomId);
  if (!room) return null;

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

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const checkoutItems: RoomCheckoutItem[] = selectedItems.map((item) => ({
    essentialId: item._id,
    name: item.name,
    price: item.price,
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
        ) : (
          <span
            className="room-detail-overlay-hero-placeholder"
            aria-hidden="true"
          >
            🖼️
          </span>
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

      <div className="room-detail-overlay-footer">
        <div className="room-detail-overlay-total-row">
          <span className="room-detail-overlay-total-label">Total</span>
          <span className="room-detail-overlay-total-value">
            {formatPrice(total)}
          </span>
        </div>
        <button
          type="button"
          className="room-detail-overlay-checkout"
          onClick={() => setIsCheckoutOpen(true)}
          disabled={checkoutItems.length === 0}
        >
          Checkout →
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
