"use client";
import React, { useEffect, useMemo } from "react";
import "./RoomConfigurator.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  getCategoryDetail,
  openCustomPicker,
  addCustomPiece,
  removeCustomEssential,
  removeOneCustomPiece,
  resetCustomSelection,
  selectCustomSpace,
  setCustomRoomWidth,
  setCustomRoomHeight,
  setCustomSurface,
  undoCustom,
  redoCustom,
  clearCustomHistory,
} from "@/app/store/features/categorySlice";
import { setOpenStateSlotPicker } from "@/app/store/features/overLaySlice";
import EssentialSlotItem from "../../Atoms/EssentialSlotItem/EssentialSlotItem";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import RoomCheckoutFooter from "../RoomCheckoutFooter/RoomCheckoutFooter";
import CustomRoomScene from "../CustomRoomScene/CustomRoomScene";
import ShareDesign from "../ShareDesign/ShareDesign";
import RoomDock, { DockTool } from "../RoomDock/RoomDock";
import { useEssentialAvailability } from "../../CustomHooks/useEssentialAvailability";
import { Essential } from "@/app/types/category";
import { getSelectableSpaces, resolveScene } from "@/app/utils/sceneSpec";
import { FitIssue, getFitIssues } from "@/app/utils/roomScene";
import SpacePicker from "../SpacePicker/SpacePicker";
import RoomSizeControl from "../RoomSizeControl/RoomSizeControl";
import SurfaceSwatches, { describeSurfaces } from "../SurfaceSwatches/SurfaceSwatches";
import { sceneOverridesFor } from "@/app/utils/surfaceSwatches";
import { ScenePiece } from "@/app/utils/roomScene";
import {
  MAX_QUANTITY_PER_PIECE,
  buildPieces,
  countById,
  uniqueIds,
} from "@/app/utils/customPieces";

type Props = {
  categorySlug: string;
  // Lets the "need a head start?" prompt jump to the ready-made rooms.
  onBrowseRooms?: () => void;
};

function describeFitIssue(issue: FitIssue): string {
  switch (issue.reason) {
    case "no-ceiling":
      return "has no ceiling here, so it sits on the floor";
    case "no-wall":
      return "has no wall space here, so it sits on the floor";
    case "too-tall":
      return "is taller than this room's ceiling";
    case "no-size":
      return "has no size from its vendor, so it is drawn at an estimated size";
    default:
      return "is wider than this space";
  }
}

// 450 -> "4.5", 300 -> "3" (metres, at most one decimal).
function formatMetres(cm: number): string {
  return String(Number((cm / 100).toFixed(1)));
}

// "Bedroom — window wall" -> "Window wall" (the chip already sits in the bedroom).
function shortSpaceName(name: string): string {
  const part = name.includes("—") ? (name.split("—").pop() ?? name).trim() : name;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function RoomConfiguratorSkeleton() {
  return (
    <div className="room-configurator" aria-hidden="true">
      <header className="room-configurator-header">
        <span className="room-configurator-skeleton-icon room-configurator-skeleton-shimmer" />
        <div className="room-configurator-skeleton-heading">
          <span className="room-configurator-skeleton-title room-configurator-skeleton-shimmer" />
          <span className="room-configurator-skeleton-subtitle room-configurator-skeleton-shimmer" />
        </div>
      </header>

      <ul className="room-configurator-list">
        {[1, 2, 3].map((key) => (
          <li key={key} className="room-configurator-skeleton-item">
            <span className="room-configurator-skeleton-thumb room-configurator-skeleton-shimmer" />
            <div className="room-configurator-skeleton-lines">
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-label room-configurator-skeleton-shimmer" />
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-name room-configurator-skeleton-shimmer" />
              <span className="room-configurator-skeleton-line room-configurator-skeleton-line-meta room-configurator-skeleton-shimmer" />
            </div>
            <span className="room-configurator-skeleton-swap room-configurator-skeleton-shimmer" />
          </li>
        ))}
      </ul>

      <div className="room-configurator-skeleton-total room-configurator-skeleton-shimmer" />
    </div>
  );
}

// "Design your own" tab. A room here is whatever the user wants it to be —
// any mix of products from the category's catalog, big or small. There are
// deliberately no prescribed slots ("choose a bed", "choose a wardrobe"):
// the user starts from an empty canvas and adds pieces one by one. Ready-made
// curated rooms live in Browse All.
export default function RoomConfigurator({
  categorySlug,
  onBrowseRooms,
}: Props) {
  const dispatch = useAppDispatch();
  const detail = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail,
  );
  const isLoading = useAppSelector(
    (state: RootState) => state.categoryState.isLoadingCategoryDetail,
  );
  const error = useAppSelector(
    (state: RootState) => state.categoryState.categoryDetailError,
  );
  const customEssentialIds = useAppSelector(
    (state: RootState) => state.categoryState.customEssentialIds,
  );
  const customSpaceSlug = useAppSelector(
    (state: RootState) => state.categoryState.customSpaceSlug,
  );
  const customRoomWidthCm = useAppSelector(
    (state: RootState) => state.categoryState.customRoomWidthCm,
  );
  const customRoomHeightCm = useAppSelector(
    (state: RootState) => state.categoryState.customRoomHeightCm,
  );
  const customSurfaces = useAppSelector(
    (state: RootState) => state.categoryState.customSurfaces,
  );
  const designNotice = useAppSelector(
    (state: RootState) => state.categoryState.designNotice,
  );
  const hasSavedLink = useAppSelector(
    (state: RootState) =>
      state.designState.savedCategorySlug === categorySlug &&
      state.designState.savedDesignId !== null,
  );
  const canUndo = useAppSelector(
    (state: RootState) => state.categoryState.customHistory.past.length > 0,
  );
  const canRedo = useAppSelector(
    (state: RootState) => state.categoryState.customHistory.future.length > 0,
  );

  const { availability, isChecking, checkAvailability } =
    useEssentialAvailability();

  // The space (base layout) the preview is drawn in: the user's choice, else
  // the category's default. Each space remembers its own arrangement.
  const scene = useMemo(
    () =>
      resolveScene(detail, customSpaceSlug, {
        roomWidthCm: customRoomWidthCm,
        ceilingHeightCm: customRoomHeightCm,
        overrides: sceneOverridesFor(customSurfaces.wallId, customSurfaces.floorId),
      }),
    [detail, customSpaceSlug, customRoomWidthCm, customRoomHeightCm, customSurfaces],
  );
  const selectableSpaces = useMemo(() => getSelectableSpaces(detail), [detail]);
  // The space at its own size — the baseline "Fit my room" resets to.
  const defaultScene = useMemo(
    () => resolveScene(detail, customSpaceSlug),
    [detail, customSpaceSlug],
  );

  // Derived from the catalog + the user's list. Memoised (and declared before
  // the early returns below) so the scene gets stable props: unrelated
  // re-renders (undo/redo availability, totals) don't rebuild every piece.
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
  const fitNotices = useMemo(
    () => [
      ...(designNotice ? [designNotice] : []),
      ...getFitIssues(addedItems, scene).map(
        (issue) => `${issue.name} ${describeFitIssue(issue)}.`,
      ),
    ],
    [designNotice, addedItems, scene],
  );


  // Live stock check for every added piece — re-runs when the list changes,
  // so an out-of-stock piece is flagged right away.
  const addedIdsKey = uniqueIds(customEssentialIds).sort().join(",");
  useEffect(() => {
    if (!addedIdsKey) return;
    checkAvailability(addedIdsKey.split(","), { force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedIdsKey]);

  const fetchDetail = () =>
    dispatch(getCategoryDetail({ slug: categorySlug }));

  const handleAddPiece = () => {
    dispatch(openCustomPicker());
    dispatch(setOpenStateSlotPicker(true));
  };

  if (isLoading || !detail || detail.category.slug !== categorySlug) {
    if (error) {
      return (
        <div className="room-configurator-status">
          <ErrorState
            title="Couldn't load this category"
            message={error}
            actionLabel="Retry"
            onAction={fetchDetail}
          />
        </div>
      );
    }
    return <RoomConfiguratorSkeleton />;
  }

  const slotById = new Map(detail.category.slots.map((slot) => [slot.id, slot]));
  const quantityById = countById(customEssentialIds);
  const pieceCount = sceneItems.length;
  const vendorCount = new Set(catalog.map((item) => item.vendorId)).size;

  // The room's settings, as chips under the room (see RoomDock).
  const dockTools: DockTool[] = [
    ...(selectableSpaces.length > 1
      ? [
          {
            id: "space",
            label: "Space",
            summary: shortSpaceName(
              selectableSpaces.find((space) => space.slug === scene.slug)?.name ?? "Default",
            ),
            content: (
              <SpacePicker
                spaces={selectableSpaces}
                selectedSlug={scene.slug}
                onSelect={(slug) => dispatch(selectCustomSpace(slug))}
                hideLegend
              />
            ),
          },
        ]
      : []),
    {
      id: "colours",
      label: "Colours",
      summary: describeSurfaces(customSurfaces.wallId, customSurfaces.floorId) || "Space default",
      content: (
        <SurfaceSwatches
          embedded
          wallId={customSurfaces.wallId}
          floorId={customSurfaces.floorId}
          onWallChange={(id) => dispatch(setCustomSurface({ surface: "wall", id }))}
          onFloorChange={(id) => dispatch(setCustomSurface({ surface: "floor", id }))}
        />
      ),
    },
    {
      id: "size",
      label: "Size",
      summary: `${formatMetres(scene.sceneWidthCm)} × ${formatMetres(scene.ceilingHeightCm)} m`,
      content: (
        <RoomSizeControl
          widthCm={customRoomWidthCm}
          heightCm={customRoomHeightCm}
          defaultWidthCm={defaultScene.sceneWidthCm}
          defaultHeightCm={defaultScene.ceilingHeightCm}
          onWidthChange={(widthCm) => dispatch(setCustomRoomWidth(widthCm))}
          onHeightChange={(heightCm) => dispatch(setCustomRoomHeight(heightCm))}
        />
      ),
    },
    ...(addedItems.length > 0
      ? [
          {
            id: "share",
            label: "Share",
            summary: hasSavedLink ? "Link ready" : "Get a link",
            content: (
              <ShareDesign
                embedded
                categorySlug={categorySlug}
                categoryName={detail.category.name}
                spaceSlug={scene.slug}
              />
            ),
          },
        ]
      : []),
  ];

  // Ctrl/Cmd+Z undoes, Ctrl+Shift+Z / Ctrl+Y redoes (not while typing in a field).
  const handleShortcuts = (event: React.KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      if (!canUndo) return;
      event.preventDefault();
      dispatch(undoCustom());
    } else if (key === "y" || (key === "z" && event.shiftKey)) {
      if (!canRedo) return;
      event.preventDefault();
      dispatch(redoCustom());
    }
  };

  return (
    <div className="room-configurator" onKeyDown={handleShortcuts}>
      <header className="room-configurator-header">
        <span className="room-configurator-icon" aria-hidden="true">
          {detail.category.icon}
        </span>
        <div className="room-configurator-heading">
          <h1 className="room-configurator-title">
            Design your {detail.category.name.toLowerCase()}
          </h1>
          <p className="room-configurator-combo-title">
            Add anything you love — big or small. There are no rules.
          </p>
        </div>
      </header>

      <CustomRoomScene
        scene={scene}
        items={sceneItems}
        availability={availability}
        notices={fitNotices}
      />

      <RoomDock tools={dockTools} ariaLabel="Room settings" />

      {addedItems.length === 0 ? (
        <div className="room-configurator-canvas">
          <h2 className="room-configurator-canvas-title">
            Your room is ready for its first piece
          </h2>
          <p className="room-configurator-canvas-sub">
            Pick from {catalog.length} piece{catalog.length === 1 ? "" : "s"}{" "}
            across {vendorCount} vendor{vendorCount === 1 ? "" : "s"} and place
            them in your room.
          </p>
          <div className="room-configurator-canvas-actions">
            <button
              type="button"
              className="room-configurator-canvas-cta"
              onClick={handleAddPiece}
              disabled={catalog.length === 0}
            >
              <span aria-hidden="true">+</span> Add your first piece
            </button>
            {onBrowseRooms && (
              <button
                type="button"
                className="room-configurator-canvas-secondary"
                onClick={onBrowseRooms}
              >
                Start from a ready-made room
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="room-configurator-list-head">
            <h2 className="room-configurator-list-title">
              <strong>
                {pieceCount} piece{pieceCount === 1 ? "" : "s"}
              </strong>{" "}
              in your room
            </h2>
            <button
              type="button"
              className="room-configurator-add-piece"
              onClick={handleAddPiece}
            >
              <span aria-hidden="true">+</span> Add piece
            </button>
          </div>

          <ul className="room-configurator-list">
            {addedItems.map((item) => {
              const entry = availability[item._id];
              const quantity = quantityById[item._id] ?? 1;
              const stock = entry?.stock ?? null;
              const exceedsStock = stock !== null && quantity > stock;
              return (
                <EssentialSlotItem
                  key={item._id}
                  slot={slotById.get(item.slot) ?? { id: item.slot, label: "Piece" }}
                  essential={{ ...item, price: entry?.price ?? item.price }}
                  alternatives={[]}
                  onSwap={handleAddPiece}
                  onRemove={() => dispatch(removeCustomEssential(item._id))}
                  quantity={quantity}
                  maxQuantity={Math.min(MAX_QUANTITY_PER_PIECE, stock ?? MAX_QUANTITY_PER_PIECE)}
                  onQuantityChange={(next) =>
                    dispatch(
                      next > quantity
                        ? addCustomPiece(item._id)
                        : removeOneCustomPiece(item._id),
                    )
                  }
                  isUnavailable={entry?.isAvailable === false || exceedsStock}
                  unavailableLabel={
                    entry?.stock === 0
                      ? "Out of stock"
                      : exceedsStock
                        ? `Only ${stock} in stock — lower the quantity`
                        : undefined
                  }
                  lowStock={entry?.stock ?? null}
                  compact
                />
              );
            })}
          </ul>

          <RoomCheckoutFooter
            selectedItems={addedItems}
            availability={availability}
            isChecking={isChecking}
            checkAvailability={checkAvailability}
            quantityById={quantityById}
            onOrderPlaced={() => {
              dispatch(resetCustomSelection());
              // The order is done — nothing to undo back into.
              dispatch(clearCustomHistory());
            }}
          />
        </>
      )}
    </div>
  );
}
