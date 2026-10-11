"use client";
import React, { useCallback } from "react";
import styles from "./CustomRoomScene.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  clearCustomPositions,
  redoCustom,
  removeOneCustomPiece,
  resetCustomSelection,
  undoCustom,
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
  const canUndo = useAppSelector(
    (state: RootState) => state.categoryState.customHistory.past.length > 0,
  );
  const canRedo = useAppSelector(
    (state: RootState) => state.categoryState.customHistory.future.length > 0,
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
      leadingActions={
        <>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => dispatch(undoCustom())}
            disabled={!canUndo}
            aria-label="Undo"
            aria-keyshortcuts="Control+Z Meta+Z"
            title="Undo (Ctrl+Z)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => dispatch(redoCustom())}
            disabled={!canRedo}
            aria-label="Redo"
            aria-keyshortcuts="Control+Shift+Z Control+Y Meta+Shift+Z"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m15 14 5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      }
      trailingActions={
        <button
          type="button"
          className={styles.textButton}
          onClick={() => dispatch(resetCustomSelection())}
        >
          Start over
        </button>
      }
    />
  );
}
