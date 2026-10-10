"use client";
import React, { useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "./RoomGrid.css";
import "@/app/component/Molecules/ProductListPage/ProductListPage.style.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  getRoomGrid,
  openRoomDetail,
} from "@/app/store/features/categorySlice";
import {
  setOpenStateRoomDetail,
  setOpenStateRoomFilters,
} from "@/app/store/features/overLaySlice";
import { buildRoomsQueryString } from "../RoomFilters/roomFilterConfig";
import { useRoomFilters } from "../RoomFilters/useRoomFilters";
import RoomCard from "../../Atoms/RoomCard/RoomCard";
import { Essential } from "@/app/types/category";
import { resolveScene } from "@/app/utils/sceneSpec";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import { Loader1 } from "../Loader/Loader";

type Props = {
  categorySlug: string;
};

export default function RoomGrid({ categorySlug }: Props) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { activeCount } = useRoomFilters();

  const rooms = useAppSelector(
    (state: RootState) => state.categoryState.roomGridResults,
  );
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  // Each curated room drawn in its own space (Room.spaceSlug, else the
  // category default) for the card thumbnail. Only for rooms whose pieces have
  // vendor cutouts — others keep their hero image / placeholder.
  const previews = useMemo(() => {
    if (!detail || detail.category.slug !== categorySlug) return {};
    const catalog = new Map(
      Object.values(detail.essentialsBySlot)
        .flat()
        .map((item) => [item._id, item] as const),
    );
    const result: Record<
      string,
      { scene: ReturnType<typeof resolveScene>; items: Essential[]; spaceName?: string }
    > = {};
    for (const room of rooms) {
      const items = room.essentialIds
        .map((id) => catalog.get(id))
        .filter((item): item is Essential => Boolean(item));
      if (!items.some((item) => item.cutoutUrl)) continue;
      const scene = resolveScene(detail, room.spaceSlug);
      result[room._id] = {
        scene,
        items,
        spaceName: detail.spaces?.find((space) => space.slug === scene.slug)?.name,
      };
    }
    return result;
  }, [detail, rooms, categorySlug]);

  const catalogSnapshot = useAppSelector(
    (state: RootState) => state.categoryState.roomGridCatalogSnapshot,
  );
  const isLoading = useAppSelector(
    (state: RootState) => state.categoryState.isLoadingRoomGrid,
  );
  const error = useAppSelector(
    (state: RootState) => state.categoryState.roomGridError,
  );

  const queryString = buildRoomsQueryString(searchParams);
  const isUnfiltered = !searchParams.get("style") && !searchParams.get("price");

  const fetchGrid = () => {
    dispatch(getRoomGrid({ categorySlug, queryString, isUnfiltered }));
  };

  useEffect(() => {
    fetchGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, queryString]);

  const handleOpen = (roomId: string) => {
    dispatch(openRoomDetail(roomId));
    dispatch(setOpenStateRoomDetail(true));
  };

  const hasCatalog = catalogSnapshot.length > 0;
  const hasResults = rooms.length > 0;

  return (
    <div className="room-grid-content">
      {isLoading && !hasCatalog ? (
        <Loader1 />
      ) : error && !hasResults ? (
        <ErrorState
          title="Couldn't load rooms"
          message={error}
          actionLabel="Retry"
          onAction={fetchGrid}
        />
      ) : !hasResults ? (
        <ErrorState
          title="No rooms match your filters"
          message="Try clearing a filter or choosing a different combination."
        />
      ) : (
        <div className="room-grid-cards">
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              preview={previews[room._id]}
              onOpen={() => handleOpen(room._id)}
            />
          ))}
        </div>
      )}

      {hasCatalog && (
        <button
          type="button"
          className={`filters-mobile-trigger${activeCount > 0 ? " filters-mobile-trigger-active" : ""}`}
          onClick={() => dispatch(setOpenStateRoomFilters(true))}
          aria-haspopup="dialog"
          aria-label={
            activeCount > 0 ? `Filters, ${activeCount} applied` : "Filters"
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="6" r="2.5" fill="currentColor" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="12" r="2.5" fill="currentColor" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="18" r="2.5" fill="currentColor" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="filters-mobile-badge" aria-hidden="true">
              {activeCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
