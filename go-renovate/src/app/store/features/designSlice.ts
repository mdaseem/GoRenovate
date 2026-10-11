import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SharedDesign } from "@/app/types/design";

// Saving a Customize design to a share link, and opening one from a link.
// (Applying a loaded design to the Customize build lives in categorySlice —
// applyCustomDesign — because that is where the build is stored.)
interface DesignState {
  isSaving: boolean;
  // The id of the last design saved from this session, and a signature of the
  // design as it was then (to tell when the user has changed it since).
  savedDesignId: string | null;
  savedCategorySlug: string | null;
  savedSignature: string | null;
  saveError: string | null;
  isLoading: boolean;
  loadError: string | null;
}

const initialState: DesignState = {
  isSaving: false,
  savedDesignId: null,
  savedCategorySlug: null,
  savedSignature: null,
  saveError: null,
  isLoading: false,
  loadError: null,
};

export const designSlice = createSlice({
  name: "designState",
  initialState,
  reducers: {
    // `signature` rides along so the saved link can be compared with later edits.
    saveDesignRequest: (
      store,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{ design: SharedDesign; signature: string }>,
    ) => {
      store.isSaving = true;
      store.saveError = null;
    },
    saveDesignSuccess: (
      store,
      { payload }: PayloadAction<{ id: string; categorySlug: string; signature: string }>,
    ) => {
      store.isSaving = false;
      store.savedDesignId = payload.id;
      store.savedCategorySlug = payload.categorySlug;
      store.savedSignature = payload.signature;
    },
    saveDesignFailure: (store, { payload }: PayloadAction<string>) => {
      store.isSaving = false;
      store.saveError = payload;
    },
    loadDesignRequest: (
      store,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{ id: string; categorySlug: string }>,
    ) => {
      store.isLoading = true;
      store.loadError = null;
    },
    loadDesignSuccess: (store) => {
      store.isLoading = false;
    },
    loadDesignFailure: (store, { payload }: PayloadAction<string>) => {
      store.isLoading = false;
      store.loadError = payload;
    },
    dismissLoadError: (store) => {
      store.loadError = null;
    },
  },
});

export const {
  saveDesignRequest,
  saveDesignSuccess,
  saveDesignFailure,
  loadDesignRequest,
  loadDesignSuccess,
  loadDesignFailure,
  dismissLoadError,
} = designSlice.actions;

export default designSlice.reducer;
