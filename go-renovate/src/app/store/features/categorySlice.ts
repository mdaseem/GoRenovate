import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ScenePosition } from "@/app/utils/roomScene";
import {
  MAX_QUANTITY_PER_PIECE,
  buildPieces,
  countById,
  pieceKey,
} from "@/app/utils/customPieces";
import {
  Category,
  CategoryDetail,
  Room,
} from "@/app/types/category";

interface CustomSnapshot {
  ids: string[];
  positions: Record<string, Record<string, ScenePosition>>;
}

const MAX_HISTORY = 30;

interface CategoryState {
  categories: Category[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  activeCategoryDetail: CategoryDetail | null;
  isLoadingCategoryDetail: boolean;
  categoryDetailError: string | null;
  // Room-detail overlay: one pick per slot, seeded from the opened Room.
  selectedEssentialBySlot: Record<string, string>;
  activeSwapSlotId: string | null;
  activeSwapOriginalEssentialId: string | null;
  // Customize tab: a free-form list of pieces the user has added, in the
  // order they were added. NOT tied to slots — a room here can be any
  // combination of products. Starts empty and is never auto-filled; kept
  // separate from the Room-detail selection so opening a Room from Browse
  // All never overwrites the user's build.
  // Ordered; the same id may appear several times (quantity). Each occurrence
  // is its own draggable piece — see utils/customPieces.
  customEssentialIds: string[];
  // The space (base layout) the Customize preview is drawn in; null = the
  // category's default space. See the room-visual-preview skill.
  customSpaceSlug: string | null;
  // Where each added piece sits in the preview, remembered PER SPACE so
  // switching spaces is non-destructive (presentation only —
  // customEssentialIds stays the source of truth for what is in the room).
  // Pieces without an entry use the automatic tidy layout.
  customPositions: Record<string, Record<string, ScenePosition>>;
  // The user's real room width in cm ("Fit my room"); null = use the space's own width.
  customRoomWidthCm: number | null;
  // The user's real ceiling height in cm (null = the space's own).
  customRoomHeightCm: number | null;
  // Wall colour / floor material the user is trying (swatch ids, null = the
  // space's own). Applies to whichever space is shown; like room width it is a
  // view setting, not part of undo/redo.
  customSurfaces: { wallId: string | null; floorId: string | null };
  // Undo/redo for the Customize design (pieces + their positions). View
  // settings (space, room width) are deliberately not part of it.
  customHistory: { past: CustomSnapshot[]; future: CustomSnapshot[] };
  // Length of the undo stack when the add-pieces picker opened, so Cancel can
  // drop the history entries made during that session.
  customPickerHistoryMark: number;
  // Set when something outside the category view (the Room-detail overlay's
  // "Customize this room") wants the Customize tab to open; CategoryDetailView
  // acknowledges it.
  customizeRequested: boolean;
  // True while the "add pieces" picker (CustomPiecePicker) is the content of
  // the shared slot-picker overlay; customPickerSnapshot is the list as it
  // was when the picker opened, so Cancel can restore it.
  isCustomPickerActive: boolean;
  customPickerSnapshot: string[];
  roomGridResults: Room[];
  roomGridCatalogSnapshot: Room[];
  isLoadingRoomGrid: boolean;
  roomGridError: string | null;
  activeRoomId: string | null;
}

const initialState: CategoryState = {
  categories: [],
  isLoadingCategories: false,
  categoriesError: null,

  activeCategoryDetail: null,
  isLoadingCategoryDetail: false,
  categoryDetailError: null,

  selectedEssentialBySlot: {},
  activeSwapSlotId: null,
  activeSwapOriginalEssentialId: null,
  customEssentialIds: [],
  customSpaceSlug: null,
  customPositions: {},
  customRoomWidthCm: null,
  customRoomHeightCm: null,
  customSurfaces: { wallId: null, floorId: null },
  customHistory: { past: [], future: [] },
  customPickerHistoryMark: 0,
  customizeRequested: false,
  isCustomPickerActive: false,
  customPickerSnapshot: [],

  roomGridResults: [],
  roomGridCatalogSnapshot: [],
  isLoadingRoomGrid: false,
  roomGridError: null,

  activeRoomId: null,
};

// Forget saved positions (in every space) for pieces that left the room.
function dropPositionsWhere(
  positions: Record<string, Record<string, ScenePosition>>,
  shouldDrop: (pieceKey: string) => boolean,
) {
  for (const spacePositions of Object.values(positions)) {
    for (const key of Object.keys(spacePositions)) {
      if (shouldDrop(key)) delete spacePositions[key];
    }
  }
}

// Drop positions of any piece that is no longer in the room.
function dropStalePositions(
  positions: Record<string, Record<string, ScenePosition>>,
  essentialIds: string[],
) {
  const live = new Set(buildPieces(essentialIds).map((piece) => piece.key));
  dropPositionsWhere(positions, (key) => !live.has(key));
}

function snapshotCustom(store: CategoryState): CustomSnapshot {
  return {
    ids: [...store.customEssentialIds],
    positions: JSON.parse(JSON.stringify(store.customPositions)),
  };
}

// Call BEFORE mutating the design: records the current state for undo and
// invalidates redo.
function pushHistory(store: CategoryState) {
  store.customHistory.past = [
    ...store.customHistory.past.slice(-(MAX_HISTORY - 1)),
    snapshotCustom(store),
  ];
  store.customHistory.future = [];
}

function selectionFromRoom(
  detail: CategoryDetail,
  room: Room | undefined,
): Record<string, string> {
  const selection: Record<string, string> = {};
  const roomEssentialIds = new Set(room?.essentialIds ?? []);
  Object.entries(detail.essentialsBySlot).forEach(([slotId, essentials]) => {
    const picked = essentials.find((essential) =>
      roomEssentialIds.has(essential._id),
    );
    const fallback = essentials[0];
    if (picked) {
      selection[slotId] = picked._id;
    } else if (fallback) {
      selection[slotId] = fallback._id;
    }
  });
  return selection;
}

export const categorySlice = createSlice({
  name: "categoryState",
  initialState,
  reducers: {
    getCategories: (store) => {
      store.isLoadingCategories = true;
      store.categoriesError = null;
    },
    setCategories: (store, { payload }: PayloadAction<Category[]>) => {
      store.categories = payload;
      store.isLoadingCategories = false;
    },
    setCategoriesError: (store, { payload }: PayloadAction<string>) => {
      store.categoriesError = payload;
      store.isLoadingCategories = false;
    },
    getCategoryDetail: (
      store,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{ slug: string }>,
    ) => {
      store.isLoadingCategoryDetail = true;
      store.categoryDetailError = null;
    },
    setCategoryDetail: (
      store,
      { payload }: PayloadAction<CategoryDetail>,
    ) => {
      store.activeCategoryDetail = payload;
      // Nothing is pre-picked: the Room-detail overlay seeds its own
      // selection in openRoomDetail, and Customize starts empty.
      store.selectedEssentialBySlot = {};
      store.customEssentialIds = [];
      store.customSpaceSlug = null;
      store.customPositions = {};
      store.customRoomWidthCm = null;
      store.customRoomHeightCm = null;
      store.customSurfaces = { wallId: null, floorId: null };
      store.customHistory = { past: [], future: [] };
      store.isLoadingCategoryDetail = false;
    },
    setCategoryDetailError: (store, { payload }: PayloadAction<string>) => {
      store.categoryDetailError = payload;
      store.isLoadingCategoryDetail = false;
    },
    selectSlotEssential: (
      store,
      {
        payload,
      }: PayloadAction<{ slotId: string; essentialId: string }>,
    ) => {
      store.selectedEssentialBySlot[payload.slotId] = payload.essentialId;
    },
    openSwapPicker: (store, { payload }: PayloadAction<string>) => {
      store.isCustomPickerActive = false;
      store.activeSwapSlotId = payload;
      store.activeSwapOriginalEssentialId =
        store.selectedEssentialBySlot[payload] ?? null;
    },
    // ── Customize tab: free-form pieces ──────────────────────────────
    openCustomPicker: (store) => {
      store.isCustomPickerActive = true;
      store.customPickerSnapshot = [...store.customEssentialIds];
      store.customPickerHistoryMark = store.customHistory.past.length;
    },
    // Checkbox-style toggle in the picker: add ONE if the piece isn't in the
    // room, otherwise take every copy of it out.
    toggleCustomEssential: (store, { payload }: PayloadAction<string>) => {
      pushHistory(store);
      if (store.customEssentialIds.includes(payload)) {
        store.customEssentialIds = store.customEssentialIds.filter(
          (id) => id !== payload,
        );
      } else {
        store.customEssentialIds = [...store.customEssentialIds, payload];
      }
      dropStalePositions(store.customPositions, store.customEssentialIds);
    },
    // Quantity "+": one more copy (capped).
    addCustomPiece: (store, { payload }: PayloadAction<string>) => {
      const count = countById(store.customEssentialIds)[payload] ?? 0;
      if (count >= MAX_QUANTITY_PER_PIECE) return;
      pushHistory(store);
      store.customEssentialIds = [...store.customEssentialIds, payload];
    },
    // Quantity "−": remove the LAST copy of a piece (keeps earlier copies' keys stable).
    removeOneCustomPiece: (store, { payload }: PayloadAction<string>) => {
      const last = store.customEssentialIds.lastIndexOf(payload);
      if (last === -1) return;
      pushHistory(store);
      const count = countById(store.customEssentialIds)[payload];
      store.customEssentialIds = store.customEssentialIds.filter(
        (_id, index) => index !== last,
      );
      const removedKey = pieceKey(payload, count - 1);
      dropPositionsWhere(store.customPositions, (key) => key === removedKey);
    },
    // Remove a piece entirely (every copy).
    removeCustomEssential: (store, { payload }: PayloadAction<string>) => {
      pushHistory(store);
      store.customEssentialIds = store.customEssentialIds.filter(
        (id) => id !== payload,
      );
      dropStalePositions(store.customPositions, store.customEssentialIds);
    },
    resetCustomSelection: (store) => {
      if (store.customEssentialIds.length > 0) pushHistory(store);
      store.customEssentialIds = [];
      // "Start over" empties the room but keeps the chosen space and room width.
      store.customPositions = {};
    },
    // "Customize this room": replace the Customize build with a curated
    // room's pieces and the space it is bound to, then ask for the tab.
    startCustomFromPieces: (
      store,
      {
        payload,
      }: PayloadAction<{ essentialIds: string[]; spaceSlug?: string | null }>,
    ) => {
      pushHistory(store);
      store.customEssentialIds = [...payload.essentialIds];
      store.customPositions = {};
      store.customSpaceSlug = payload.spaceSlug ?? null;
      store.customizeRequested = true;
    },
    setCustomRoomHeight: (store, { payload }: PayloadAction<number | null>) => {
      store.customRoomHeightCm = payload;
    },
    // Try a wall colour or floor material (null = back to the space's own).
    setCustomSurface: (
      store,
      {
        payload,
      }: PayloadAction<{ surface: "wall" | "floor"; id: string | null }>,
    ) => {
      if (payload.surface === "wall") store.customSurfaces.wallId = payload.id;
      else store.customSurfaces.floorId = payload.id;
    },
    acknowledgeCustomizeRequest: (store) => {
      store.customizeRequested = false;
    },
    // "Fit my room": the user's real room width in cm, or null to go back to
    // the space's own width. Positions are percentages so they carry over.
    setCustomRoomWidth: (store, { payload }: PayloadAction<number | null>) => {
      store.customRoomWidthCm = payload;
    },
    // Pick the space the Customize preview is drawn in (non-destructive: the
    // pieces stay, and each space remembers its own arrangement).
    selectCustomSpace: (store, { payload }: PayloadAction<string>) => {
      store.customSpaceSlug = payload;
    },
    // Commit a change to ONE piece in one space's arrangement: a drag/nudge
    // (x, y) or a tweak (scale, flipped, front). Pass the piece's full
    // transform; one history entry per call.
    updateCustomPiece: (
      store,
      {
        payload,
      }: PayloadAction<{
        spaceSlug: string;
        key: string;
        transform: ScenePosition;
      }>,
    ) => {
      pushHistory(store);
      store.customPositions[payload.spaceSlug] = {
        ...(store.customPositions[payload.spaceSlug] ?? {}),
        [payload.key]: payload.transform,
      };
    },
    // "Tidy up": forget manual positions in THIS space only.
    clearCustomPositions: (store, { payload }: PayloadAction<string>) => {
      if (!store.customPositions[payload]) return;
      pushHistory(store);
      delete store.customPositions[payload];
    },
    undoCustom: (store) => {
      const previous = store.customHistory.past.at(-1);
      if (!previous) return;
      store.customHistory.future = [
        ...store.customHistory.future,
        snapshotCustom(store),
      ];
      store.customHistory.past = store.customHistory.past.slice(0, -1);
      store.customEssentialIds = previous.ids;
      store.customPositions = previous.positions;
    },
    redoCustom: (store) => {
      const next = store.customHistory.future.at(-1);
      if (!next) return;
      store.customHistory.past = [
        ...store.customHistory.past,
        snapshotCustom(store),
      ];
      store.customHistory.future = store.customHistory.future.slice(0, -1);
      store.customEssentialIds = next.ids;
      store.customPositions = next.positions;
    },
    // After an order is placed the design is finished — nothing to undo into.
    clearCustomHistory: (store) => {
      store.customHistory = { past: [], future: [] };
    },
    // "Done" / overlay close keeps what was added (changes apply live).
    closeCustomPicker: (store) => {
      store.isCustomPickerActive = false;
      store.customPickerSnapshot = [];
    },
    // "Cancel" puts the list back the way it was when the picker opened.
    cancelCustomPicker: (store) => {
      store.customEssentialIds = [...store.customPickerSnapshot];
      store.customHistory = {
        past: store.customHistory.past.slice(0, store.customPickerHistoryMark),
        future: [],
      };
      dropStalePositions(store.customPositions, store.customEssentialIds);
      store.isCustomPickerActive = false;
      store.customPickerSnapshot = [];
    },
    // Used by "Done" and the overlay's own back/close button — keeps
    // whatever's currently selected (already applied live on tap).
    closeSwapPicker: (store) => {
      store.activeSwapSlotId = null;
      store.activeSwapOriginalEssentialId = null;
    },
    // Used by "Cancel" — restores whatever was selected before the picker
    // opened, discarding any swap made during this picker session.
    cancelSwapPicker: (store) => {
      if (store.activeSwapSlotId && store.activeSwapOriginalEssentialId) {
        store.selectedEssentialBySlot[store.activeSwapSlotId] =
          store.activeSwapOriginalEssentialId;
      }
      store.activeSwapSlotId = null;
      store.activeSwapOriginalEssentialId = null;
    },
    getRoomGrid: (
      store,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{
        categorySlug: string;
        queryString: string;
        isUnfiltered: boolean;
      }>,
    ) => {
      store.isLoadingRoomGrid = true;
      store.roomGridError = null;
    },
    setRoomGrid: (
      store,
      {
        payload,
      }: PayloadAction<{ data: Room[]; isUnfiltered: boolean }>,
    ) => {
      store.roomGridResults = payload.data;
      if (payload.isUnfiltered) {
        store.roomGridCatalogSnapshot = payload.data;
      }
      store.isLoadingRoomGrid = false;
    },
    setRoomGridError: (store, { payload }: PayloadAction<string>) => {
      store.roomGridError = payload;
      store.isLoadingRoomGrid = false;
    },
    openRoomDetail: (store, { payload }: PayloadAction<string>) => {
      store.activeRoomId = payload;
      if (store.activeCategoryDetail) {
        const room = store.activeCategoryDetail.rooms.find(
          (candidate) => candidate._id === payload,
        );
        store.selectedEssentialBySlot = selectionFromRoom(
          store.activeCategoryDetail,
          room,
        );
      }
    },
    closeRoomDetail: (store) => {
      store.activeRoomId = null;
    },
  },
});

export const {
  getCategories,
  setCategories,
  setCategoriesError,
  getCategoryDetail,
  setCategoryDetail,
  setCategoryDetailError,
  selectSlotEssential,
  openSwapPicker,
  openCustomPicker,
  toggleCustomEssential,
  addCustomPiece,
  removeOneCustomPiece,
  removeCustomEssential,
  startCustomFromPieces,
  acknowledgeCustomizeRequest,
  setCustomRoomWidth,
  setCustomRoomHeight,
  setCustomSurface,
  resetCustomSelection,
  selectCustomSpace,
  updateCustomPiece,
  clearCustomPositions,
  undoCustom,
  redoCustom,
  clearCustomHistory,
  closeCustomPicker,
  cancelCustomPicker,
  closeSwapPicker,
  cancelSwapPicker,
  getRoomGrid,
  setRoomGrid,
  setRoomGridError,
  openRoomDetail,
  closeRoomDetail,
} = categorySlice.actions;
export default categorySlice.reducer;
