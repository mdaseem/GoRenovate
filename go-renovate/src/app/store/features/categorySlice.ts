import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Category,
  CategoryDetail,
  Room,
} from "../../component/CategoryPage/category";

interface CategoryState {
  categories: Category[];
  isLoadingCategories: boolean;
  categoriesError: string | null;

  activeCategoryDetail: CategoryDetail | null;
  isLoadingCategoryDetail: boolean;
  categoryDetailError: string | null;

  // slotId -> currently selected essentialId. Used by both the "Customize"
  // configurator (defaults to the category's first Room) and the Room-detail
  // overlay (re-initialized to whichever Room was opened from the grid) —
  // shared rather than duplicated because the two are never shown at once.
  // With exactly one Room per Category today (no admin curation screen yet
  // to make more), opening the overlay can't actually clobber in-progress
  // Customize-tab swaps in practice; revisit if that stops being true.
  selectedEssentialBySlot: Record<string, string>;
  activeSwapSlotId: string | null;

  // Room grid ("Browse All" tab) — filtered list of Rooms for the active
  // category, a separate fetch concern from activeCategoryDetail so
  // Browse-All filters can't affect what Customize treats as "the" room.
  roomGridResults: Room[];
  // Snapshot from the last *unfiltered* fetch — used only to build filter
  // option lists so they don't shrink as filters narrow roomGridResults.
  roomGridCatalogSnapshot: Room[];
  isLoadingRoomGrid: boolean;
  roomGridError: string | null;

  // Which Room's detail overlay is open — content-side state, matching how
  // other overlay surfaces read their own domain slice.
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

  roomGridResults: [],
  roomGridCatalogSnapshot: [],
  isLoadingRoomGrid: false,
  roomGridError: null,

  activeRoomId: null,
};

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
      store.selectedEssentialBySlot = selectionFromRoom(
        payload,
        payload.rooms[0],
      );
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
      store.activeSwapSlotId = payload;
    },
    closeSwapPicker: (store) => {
      store.activeSwapSlotId = null;
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
  closeSwapPicker,
  getRoomGrid,
  setRoomGrid,
  setRoomGridError,
  openRoomDetail,
  closeRoomDetail,
} = categorySlice.actions;
export default categorySlice.reducer;
