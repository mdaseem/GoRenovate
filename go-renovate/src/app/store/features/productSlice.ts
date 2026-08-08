import { createSlice } from "@reduxjs/toolkit";
import { Vendor } from "../../component/VendorPage/vendor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  prodList: { data: [] as Vendor[] },
  // Reference snapshot from the last *unfiltered* fetch — used only to build
  // filter option lists (categories/locations) so they don't shrink to just
  // what's currently visible once a filter narrows prodList.
  catalogSnapshot: [] as Vendor[],
  isloading: false,
  error: null as string | null,
};

export const productSlice = createSlice({
  name: "productState",
  initialState,
  reducers: {
    setProducts: (store, { payload }) => {
      store.prodList = { data: payload.data };
      if (payload.isUnfiltered) {
        store.catalogSnapshot = payload.data;
      }
      store.error = null;
      return store;
    },
    setCatalogSnapshot: (store, { payload }) => {
      store.catalogSnapshot = payload;
      return store;
    },
    getProducts: (store, { payload }) => {
      store.isloading = true;
      store.error = null;
      return store;
    },
    setLoading: (store, { payload }) => {
      store.isloading = payload.data;
      return store;
    },
    setProductsError: (store, { payload }) => {
      store.error = payload;
      store.isloading = false;
      return store;
    },
  },
});

export const {
  setProducts,
  setCatalogSnapshot,
  getProducts,
  setLoading,
  setProductsError,
} = productSlice.actions;
export default productSlice.reducer;