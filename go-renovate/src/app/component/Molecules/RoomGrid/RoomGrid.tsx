"use client";
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "./RoomGrid.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  getRoomGrid,
  openRoomDetail,
} from "@/app/store/features/categorySlice";
import { setOpenStateRoomDetail } from "@/app/store/features/overLaySlice";
import { buildRoomsQueryString } from "../RoomFilters/roomFilterConfig";
import RoomFilters from "../RoomFilters/RoomFilters";
import RoomCard from "../../Atoms/RoomCard/RoomCard";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import { Loader1 } from "../Loader/Loader";

type Props = {
  categorySlug: string;
};

export default function RoomGrid({ categorySlug }: Props) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const rooms = useAppSelector(
    (state: RootState) => state.categoryState.roomGridResults,
  );
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
    <div className="room-grid">
      <div className="room-grid-filters">
        <RoomFilters
          rooms={catalogSnapshot}
          resultCount={rooms.length}
          isRefreshing={isLoading && hasCatalog}
        />
      </div>
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
                onOpen={() => handleOpen(room._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
