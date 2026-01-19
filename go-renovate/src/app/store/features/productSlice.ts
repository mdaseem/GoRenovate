import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  prodList: [] as ProductType[],
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
      return store;
    },
    getProducts: (store, { payload }) => {
      return store;
    },
  },
});

export const { setProducts, getProducts } = productSlice.actions;
export default productSlice.reducer;