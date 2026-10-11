"use client";
import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  clearCustomPositions,
  removeOneCustomPiece,
  updateCustomPiece,
} from "@/app/store/features/categorySlice";
import RoomScene from "../../Atoms/RoomScene/RoomScene";
import { AvailabilityEntry } from "../../CustomHooks/useEssentialAvailability";
import { ScenePiece, ScenePosition } from "@/app/utils/roomScene";
import { ResolvedScene } from "@/app/utils/sceneSpec";

type Props = {
  scene: ResolvedScene;
  items: ScenePiece[];
  availability: Record<string, AvailabilityEntry>;
  notices: string[];
};

// The Customize tab's room: RoomScene wired to the store. It reads the piece
// positions ITSELF, so moving a piece re-renders only the room — not the whole
// Customize tab (product list, checkout footer, size and colour controls).
export default function CustomRoomScene({ scene, items, availability, notices }: Props) {
  const dispatch = useAppDispatch();
  const layout = useAppSelector(
    (state: RootState) => state.categoryState.customPositions[scene.slug],
  );
  const sceneSlug = scene.slug;

  const handleChange = useCallback(
    (key: string, transform: ScenePosition) =>
      dispatch(updateCustomPiece({ spaceSlug: sceneSlug, key, transform })),
    [dispatch, sceneSlug],
  );
  const handleTidy = useCallback(
    () => dispatch(clearCustomPositions(sceneSlug)),
    [dispatch, sceneSlug],
  );
  const handleRemoveOne = useCallback(
    (item: ScenePiece) => dispatch(removeOneCustomPiece(item._id)),
    [dispatch],
  );

  return (
    <RoomScene
      scene={scene}
      items={items}
      availability={availability}
      layout={layout}
      onChange={handleChange}
      onTidy={handleTidy}
      onRemove={handleRemoveOne}
      sticky
      notices={notices}
    />
  );
}
