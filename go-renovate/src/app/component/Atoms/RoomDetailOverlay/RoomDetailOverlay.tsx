"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "./RoomDetailOverlay.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  openSwapPicker,
  closeRoomDetail,
  startCustomFromPieces,
} from "@/app/store/features/categorySlice";
import {
  setOpenStateSlotPicker,
  setOpenStateRoomDetail,
} from "@/app/store/features/overLaySlice";
import EssentialSlotItem from "../EssentialSlotItem/EssentialSlotItem";
import RoomCheckoutFooter from "../../Molecules/RoomCheckoutFooter/RoomCheckoutFooter";
import RoomScene from "../RoomScene/RoomScene";
import { humanizeStyleTag } from "@/app/types/category";
import { resolveScene } from "@/app/utils/sceneSpec";
import { ScenePositions } from "@/app/utils/roomScene";
import { useEssentialAvailability } from "../../CustomHooks/useEssentialAvailability";

export default function RoomDetailOverlay() {
  const dispatch = useAppDispatch();
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
  // The room is previewed in the space it's bound to (Room.spaceSlug), else
  // the category's default.
  const roomSpaceSlug = detail?.rooms.find((candidate) => candidate._id === activeRoomId)?.spaceSlug;
  const scene = useMemo(
    () => resolveScene(detail, roomSpaceSlug),
    [detail, roomSpaceSlug],
  );
  // Manual arrangement in the room preview — kept only while this room is open.
  const [sceneLayout, setSceneLayout] = useState<ScenePositions>({});

  const selectedItemIds = detail
    ? detail.category.slots
        .map((slot) => selectedEssentialBySlot[slot.id])
        .filter((id): id is string => Boolean(id))
    : [];
  const selectedItemIdsKey = selectedItemIds.join(",");

  useEffect(() => {
    setSceneLayout({});
  }, [activeRoomId]);

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

  // Curated Rooms use the same room preview as Customize (read-only) once at
  // least one piece has a vendor cutout; otherwise the original hero is kept.
  const hasScenePreview =
    !room.heroImageUrl && selectedItems.some((item) => item.cutoutUrl);

  const livePrice = (item: { _id: string; price: number }) =>
    availability[item._id]?.price ?? item.price;

  // Hand this room to the Customize tab as a starting point: its pieces (as
  // currently swapped) and the space it's bound to. Replaces any design in
  // progress there.
  const handleCustomize = () => {
    dispatch(
      startCustomFromPieces({
        essentialIds: selectedItems.map((item) => item._id),
        spaceSlug: room.spaceSlug ?? null,
      }),
    );
    dispatch(setOpenStateRoomDetail(false));
    dispatch(closeRoomDetail());
  };

  const handleOrderPlaced = () => {
    dispatch(setOpenStateRoomDetail(false));
    dispatch(closeRoomDetail());
  };

  return (
    <div className="room-detail-overlay">
      {hasScenePreview ? (
        <>
          <RoomScene
            scene={scene}
            items={selectedItems}
            availability={availability}
            layout={sceneLayout}
            onChange={(key, next) =>
              setSceneLayout((prev) => ({ ...prev, [key]: next }))
            }
            onTidy={() => setSceneLayout({})}
          />
          {room.styleTags.length > 0 && (
            <ul className="room-detail-overlay-scene-tags" aria-label="Style">
              {room.styleTags.map((tag) => (
                <li key={tag} className="room-detail-overlay-hero-tag">
                  {humanizeStyleTag(tag)}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
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
      )}

      <div className="room-detail-overlay-customize">
        <button
          type="button"
          className="room-detail-overlay-customize-button"
          onClick={handleCustomize}
        >
          Customize this room →
        </button>
        <span className="room-detail-overlay-customize-note">
          Opens it in Customize so you can add, remove and move pieces. Replaces
          any design you have in progress there.
        </span>
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
              unavailableLabel={
                availability[selected._id]?.stock === 0
                  ? "Out of stock"
                  : undefined
              }
              lowStock={availability[selected._id]?.stock ?? null}
            />
          );
        })}
      </ul>

      <RoomCheckoutFooter
        selectedItems={selectedItems}
        availability={availability}
        isChecking={isChecking}
        checkAvailability={checkAvailability}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
}
