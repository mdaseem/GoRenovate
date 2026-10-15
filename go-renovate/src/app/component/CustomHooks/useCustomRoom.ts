import { useMemo } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { Essential } from "@/app/types/category";
import { resolveScene } from "@/app/utils/sceneSpec";
import { sceneOverridesFor } from "@/app/utils/surfaceSwatches";
import { ScenePiece } from "@/app/utils/roomScene";
import { buildPieces, uniqueIds } from "@/app/utils/customPieces";

// The Customize room as data: the space (with the user's room size and colours),
// the catalogue, the products they added and one scene piece per COPY, plus the
// arrangement they made. Shared by the Customize tab and the Look-around view so
// both always describe the same room. Everything is memoised so consumers get
// stable references.
export function useCustomRoom() {
  const detail = useAppSelector((s: RootState) => s.categoryState.activeCategoryDetail);
  const customEssentialIds = useAppSelector((s: RootState) => s.categoryState.customEssentialIds);
  const customSpaceSlug = useAppSelector((s: RootState) => s.categoryState.customSpaceSlug);
  const customRoomWidthCm = useAppSelector((s: RootState) => s.categoryState.customRoomWidthCm);
  const customRoomHeightCm = useAppSelector((s: RootState) => s.categoryState.customRoomHeightCm);
  const customRoomDepthCm = useAppSelector((s: RootState) => s.categoryState.customRoomDepthCm);
  const customSurfaces = useAppSelector((s: RootState) => s.categoryState.customSurfaces);
  const customPositions = useAppSelector((s: RootState) => s.categoryState.customPositions);

  // The space the room is drawn in: the user's choice, else the category's default.
  const scene = useMemo(
    () =>
      resolveScene(detail, customSpaceSlug, {
        roomWidthCm: customRoomWidthCm,
        ceilingHeightCm: customRoomHeightCm,
        overrides: sceneOverridesFor(customSurfaces.wallId, customSurfaces.floorId),
      }),
    [detail, customSpaceSlug, customRoomWidthCm, customRoomHeightCm, customSurfaces],
  );
  // The space at its own size — the baseline "Fit my room" resets to.
  const defaultScene = useMemo(
    () => resolveScene(detail, customSpaceSlug),
    [detail, customSpaceSlug],
  );

  const catalog = useMemo(
    () => Object.values(detail?.essentialsBySlot ?? {}).flat(),
    [detail],
  );
  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item._id, item])),
    [catalog],
  );
  // One entry per distinct product (list rows, stock checks, checkout)…
  const addedItems = useMemo(
    () =>
      uniqueIds(customEssentialIds)
        .map((id) => catalogById.get(id))
        .filter((item): item is Essential => Boolean(item)),
    [customEssentialIds, catalogById],
  );
  // …and one per COPY for the preview, so two bedside tables are two pieces.
  const sceneItems = useMemo(
    () =>
      buildPieces(customEssentialIds)
        .map((piece): ScenePiece | undefined => {
          const item = catalogById.get(piece.essentialId);
          return item ? { ...item, pieceKey: piece.key } : undefined;
        })
        .filter((item): item is ScenePiece => Boolean(item)),
    [customEssentialIds, catalogById],
  );

  return {
    detail,
    scene,
    defaultScene,
    catalog,
    catalogById,
    addedItems,
    sceneItems,
    // The user's manual positions in THIS space (pieces without one use the auto layout).
    layout: customPositions[scene.slug],
    // The room depth the person typed for the 3D views (null = automatic).
    depthCm: customRoomDepthCm,
  };
}
