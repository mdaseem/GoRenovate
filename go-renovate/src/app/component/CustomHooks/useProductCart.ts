import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  addProductToCart,
  clearProductCart,
  removeProductFromCart,
  setProductQuantity,
} from "@/app/store/features/productCartSlice";
import { ServiceOption } from "@/app/types/vendor";
import { maxQuantityFor } from "@/app/utils/productFacts";

// The shop cart (products across vendors) as the vendor pages use it. Same method names as the
// services `useCart`, so the page wiring reads the same; the state lives in Redux (productCartSlice)
// so the cart follows the buyer from one vendor page to the next.
export function useProductCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.productCart.items);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const addProduct = useCallback(
    (
      service: ServiceOption,
      categoryLabel: string,
      vendor: { id: string; name: string },
    ) => {
      if (!service.product) return;
      dispatch(
        addProductToCart({
          essentialId: service.id,
          name: service.name,
          price: service.price,
          imageUrl: service.imageUrl,
          vendorId: vendor.id,
          vendorName: vendor.name,
          categoryLabel,
          maxQuantity: maxQuantityFor(service.product),
        }),
      );
    },
    [dispatch],
  );

  const getQuantity = useCallback(
    (essentialId: string): number =>
      items.find((item) => item.essentialId === essentialId)?.quantity ?? 0,
    [items],
  );

  const setQuantity = useCallback(
    (essentialId: string, quantity: number) =>
      dispatch(setProductQuantity({ essentialId, quantity })),
    [dispatch],
  );

  const removeItem = useCallback(
    (essentialId: string) => dispatch(removeProductFromCart(essentialId)),
    [dispatch],
  );

  const clearCart = useCallback(() => dispatch(clearProductCart()), [dispatch]);

  return {
    items,
    totalItems,
    totalPrice,
    addProduct,
    getQuantity,
    setQuantity,
    removeItem,
    clearCart,
  };
}
