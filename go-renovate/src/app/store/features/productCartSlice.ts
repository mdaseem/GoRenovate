import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProductCartItem } from "@/app/types/productCart";
import { MAX_QUANTITY_PER_PRODUCT } from "@/app/utils/productFacts";

// The shop cart: products bought from vendor pages, across vendors. Rooms have their own flow
// (categorySlice) and are not touched by this slice.
interface ProductCartState {
  items: ProductCartItem[];
  // False until the saved cart has been read from the browser (see ShopCart).
  isHydrated: boolean;
}

const MAX_LINES = 50;

const initialState: ProductCartState = { items: [], isHydrated: false };

const clamp = (quantity: number, max: number) =>
  Math.max(0, Math.min(quantity, max, MAX_QUANTITY_PER_PRODUCT));

export const productCartSlice = createSlice({
  name: "productCart",
  initialState,
  reducers: {
    hydrateProductCart: (store, { payload }: PayloadAction<ProductCartItem[]>) => {
      // Lines added before the saved cart was read win over saved lines with the same id.
      const live = new Set(store.items.map((item) => item.essentialId));
      store.items = [...store.items, ...payload.filter((item) => !live.has(item.essentialId))].slice(
        0,
        MAX_LINES,
      );
      store.isHydrated = true;
    },
    addProductToCart: (
      store,
      { payload }: PayloadAction<Omit<ProductCartItem, "quantity">>,
    ) => {
      const existing = store.items.find((item) => item.essentialId === payload.essentialId);
      if (existing) {
        existing.maxQuantity = payload.maxQuantity;
        existing.price = payload.price;
        existing.quantity = clamp(existing.quantity + 1, existing.maxQuantity);
        return;
      }
      if (store.items.length >= MAX_LINES || payload.maxQuantity < 1) return;
      store.items.push({ ...payload, quantity: 1 });
    },
    setProductQuantity: (
      store,
      { payload }: PayloadAction<{ essentialId: string; quantity: number }>,
    ) => {
      const line = store.items.find((item) => item.essentialId === payload.essentialId);
      if (!line) return;
      const next = clamp(Math.floor(payload.quantity), line.maxQuantity);
      if (next <= 0) {
        store.items = store.items.filter((item) => item.essentialId !== payload.essentialId);
      } else {
        line.quantity = next;
      }
    },
    removeProductFromCart: (store, { payload }: PayloadAction<string>) => {
      store.items = store.items.filter((item) => item.essentialId !== payload);
    },
    // Brings prices and stock limits back in line with the catalogue (never adds or removes a line).
    refreshProductCartLines: (
      store,
      {
        payload,
      }: PayloadAction<{ essentialId: string; price: number; maxQuantity: number }[]>,
    ) => {
      for (const update of payload) {
        const line = store.items.find((item) => item.essentialId === update.essentialId);
        if (!line) continue;
        line.price = update.price;
        line.maxQuantity = Math.max(1, Math.min(update.maxQuantity, MAX_QUANTITY_PER_PRODUCT));
        line.quantity = Math.min(line.quantity, line.maxQuantity);
      }
    },
    clearProductCart: (store) => {
      store.items = [];
    },
  },
});

export const {
  hydrateProductCart,
  addProductToCart,
  setProductQuantity,
  removeProductFromCart,
  refreshProductCartLines,
  clearProductCart,
} = productCartSlice.actions;
export default productCartSlice.reducer;
