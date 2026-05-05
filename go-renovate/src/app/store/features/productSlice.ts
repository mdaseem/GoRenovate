import { createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = {
  isOpen: false,
  isOpenLogin: false,
  prodList: [] as ProductType[],
  isloading: false,
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
      store.isloading = true;
      return store;
    },
    setLoading: (store, { payload }) => {
      store.isloading = payload.data;
      return store;
    }
  },
});

export const { setProducts, getProducts, setLoading } = productSlice.actions;
export default productSlice.reducer;