import { createSlice } from "@reduxjs/toolkit";

interface SearchState {
  recentSearches: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  recentSearches: [],
  isLoading: false,
  error: null,
};

export const searchSlice = createSlice({
  name: "searchState",
  initialState,
  reducers: {
    getRecentSearches: {
      reducer: (store) => {
        store.isLoading = true;
        store.error = null;
      },
      prepare: (payload: { token?: string }) => ({ payload }),
    },
    addRecentSearchRequest: {
      reducer: (store) => {
        store.error = null;
      },
      prepare: (payload: { term: string; token?: string }) => ({ payload }),
    },
    removeRecentSearchRequest: {
      reducer: (store) => {
        store.error = null;
      },
      prepare: (payload: { term: string; token?: string }) => ({ payload }),
    },
    clearRecentSearchesRequest: {
      reducer: (store) => {
        store.error = null;
      },
      prepare: (payload: { token?: string }) => ({ payload }),
    },
    setRecentSearches: (store, { payload }: { payload: string[] }) => {
      store.recentSearches = payload;
      store.isLoading = false;
      store.error = null;
    },
    setSearchError: (store, { payload }: { payload: string }) => {
      store.error = payload;
      store.isLoading = false;
    },
  },
});

export const {
  getRecentSearches,
  addRecentSearchRequest,
  removeRecentSearchRequest,
  clearRecentSearchesRequest,
  setRecentSearches,
  setSearchError,
} = searchSlice.actions;
export default searchSlice.reducer;
