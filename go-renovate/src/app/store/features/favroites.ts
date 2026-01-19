import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: any = [];
type prodType = {
  _id: number;
  name: string;
  price: number;
  image: string;
};

export const favListSlice = createSlice({
  name: "favroitesState",
  initialState,
  reducers: {
    setFavsData: (store, { payload }) => {
      const prodfound = store?.filter(
        (item: prodType) => item._id === payload._id
      );
      if (prodfound.length) {
        return store;
      } else {
        store.push(payload);
      }
      return store;
    },
    unsetFavState: (store,{payload}) => {
        const prodAfterUnFav = store?.filter(
            (item: prodType) => item._id != payload._id
          );
          return prodAfterUnFav
    }
  },
});

export const { setFavsData,unsetFavState } = favListSlice.actions;
export default favListSlice.reducer;