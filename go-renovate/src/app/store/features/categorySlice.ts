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
  selectedEssentialBySlot: Record<string, string>;
  activeSwapSlotId: string | null;
  activeSwapOriginalEssentialId: string | null;
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
      store.activeSwapOriginalEssentialId =
        store.selectedEssentialBySlot[payload] ?? null;
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
  closeSwapPicker,
  cancelSwapPicker,
  getRoomGrid,
  setRoomGrid,
  setRoomGridError,
  openRoomDetail,
  closeRoomDetail,
} = categorySlice.actions;
export default categorySlice.reducer;
