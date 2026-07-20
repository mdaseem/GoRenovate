import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  prodList: [] as ProductType[],
  isloading: false,
  error: null as string | null,
};
type ProductType = {
  id: number;
  name: string;
  price: number;
  image: string;
};

export const productSlice = createSlice({
  name: "productState",
  initialState,
  reducers: {
    setProducts: (store, { payload }) => {
      store.prodList = payload;
      store.error = null;
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

export const { setProducts, getProducts, setLoading, setProductsError } =
  productSlice.actions;
export default productSlice.reducer;