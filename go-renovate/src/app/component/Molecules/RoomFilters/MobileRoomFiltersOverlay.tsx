"use client";

import React from "react";
import { RootState } from "@/app/store/store";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setOpenStateRoomFilters } from "@/app/store/features/overLaySlice";
import RoomFilters from "./RoomFilters";

// Mirrors MobileFiltersOverlay.tsx's role for /vendors — same overlay
// mechanism (isOpenRoomFilters on overLaySlice, rendered by
// RenderFromOverlay), same RoomFilters component the desktop sidebar in
// RoomGrid.tsx already uses, just with onApply wired to close the overlay.
function MobileRoomFiltersOverlay() {
  const dispatch = useAppDispatch();
  const catalogSnapshot = useAppSelector(
    (state: RootState) => state.categoryState.roomGridCatalogSnapshot,
  );
  const resultCount = useAppSelector(
    (state: RootState) => state.categoryState.roomGridResults?.length ?? 0,
  );
  const isRefreshing = useAppSelector((state: RootState) =>
    Boolean(state.categoryState.isLoadingRoomGrid),
  );

  return (
    <RoomFilters
      rooms={catalogSnapshot}
      resultCount={resultCount}
      isRefreshing={isRefreshing && catalogSnapshot.length > 0}
      onApply={() => dispatch(setOpenStateRoomFilters(false))}
    />
  );
}

export default MobileRoomFiltersOverlay;
