"use client";
import React from "react";
import { useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import RoomFilters from "../RoomFilters/RoomFilters";

// Split out of RoomGrid so CategoryDetailView can position it as its own
// column next to the tab switcher + content, instead of RoomGrid owning the
// whole two-column shell. Reads straight from the same categoryState slice
// RoomGrid's content half already does, so no prop drilling is needed
// despite the two living in separate components now.
export default function RoomGridFilters() {
  const rooms = useAppSelector(
    (state: RootState) => state.categoryState.roomGridCatalogSnapshot,
  );
  const resultCount = useAppSelector(
    (state: RootState) => state.categoryState.roomGridResults.length,
  );
  const isLoading = useAppSelector(
    (state: RootState) => state.categoryState.isLoadingRoomGrid,
  );
  const hasCatalog = rooms.length > 0;

  return (
    <RoomFilters
      rooms={rooms}
      resultCount={resultCount}
      isRefreshing={isLoading && hasCatalog}
    />
  );
}
