import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VendorOrderCounts } from "@/app/types/vendorOrders";

// Only the order counts live here, so the header badge, the account menu, the vendor home and the
// orders page all show the same numbers the moment any of them learns a newer one. The orders
// themselves are fetched by the orders pages' own hooks.
interface VendorOrdersState {
  counts: VendorOrderCounts | null;
}

const initialState: VendorOrdersState = { counts: null };

export const vendorOrdersSlice = createSlice({
  name: "vendorOrders",
  initialState,
  reducers: {
    setVendorOrderCounts: (store, { payload }: PayloadAction<VendorOrderCounts | null>) => {
      store.counts = payload;
    },
  },
});

export const { setVendorOrderCounts } = vendorOrdersSlice.actions;
export default vendorOrdersSlice.reducer;
