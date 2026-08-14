import { createSlice } from "@reduxjs/toolkit";
import { Vendor } from "@/app/component/VendorPage/vendor";

interface FavoritesState {
  items: Vendor[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

const initialState: FavoritesState = {
  items: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const favListSlice = createSlice({
  name: "favroitesState",
  initialState,
  reducers: {
    getFavorites: (store, { payload }: { payload: { token: string } }) => {
      store.isLoading = true;
      store.error = null;
    },
    setFavorites: (store, { payload }: { payload: { data: Vendor[] } }) => {
      store.items = payload.data;
      store.isLoading = false;
      store.hasLoaded = true;
      store.error = null;
    },
    addFavorite: (
      store,
      { payload }: { payload: { vendor: Vendor; token: string } },
    ) => {
      const exists = store.items.some((item) => item.id === payload.vendor.id);
      if (!exists) {
        store.items.push(payload.vendor);
      }
    },
    removeFavorite: (
      store,
      { payload }: { payload: { vendor: Vendor; token: string } },
    ) => {
      store.items = store.items.filter((item) => item.id !== payload.vendor.id);
    },
    // Local-only rollbacks for a failed add/remove — never trigger the saga.
    restoreFavorite: (store, { payload }: { payload: { vendor: Vendor } }) => {
      const exists = store.items.some((item) => item.id === payload.vendor.id);
      if (!exists) {
        store.items.push(payload.vendor);
      }
    },
    discardFavorite: (
      store,
      { payload }: { payload: { vendorId: string } },
    ) => {
      store.items = store.items.filter((item) => item.id !== payload.vendorId);
    },
    setFavoritesError: (store, { payload }: { payload: string }) => {
      store.error = payload;
      store.isLoading = false;
    },
    clearFavorites: () => initialState,
  },
});

export const {
  getFavorites,
  setFavorites,
  addFavorite,
  removeFavorite,
  restoreFavorite,
  discardFavorite,
  setFavoritesError,
  clearFavorites,
} = favListSlice.actions;
export default favListSlice.reducer;
