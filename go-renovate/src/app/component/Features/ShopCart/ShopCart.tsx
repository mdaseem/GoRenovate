"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import CartDrawer from "@/app/component/Atoms/CartDrawer/CartDrawer";
import Overlay from "@/app/component/HOC/Overlay/Overlay";
import RoomCheckoutForm from "@/app/component/Molecules/RoomCheckoutForm/RoomCheckoutForm";
import CartFab from "@/app/component/Features/VendorPage/components/CartFab";
import Toast from "@/app/component/Features/VendorPage/components/Toast";
import { useToast } from "@/app/component/Features/VendorPage/hooks/useToast";
import { useProductCart } from "@/app/component/CustomHooks/useProductCart";
import { useProductCartAvailability } from "@/app/component/CustomHooks/useProductCartAvailability";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { hydrateProductCart } from "@/app/store/features/productCartSlice";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { skipHistoryPopOnNextClose } from "@/app/component/CustomHooks/useCloseOnBackButton";
import { toDrawerItem } from "@/app/types/productCart";
import { loadProductCart, saveProductCart } from "@/app/utils/productCartStorage";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// The shop cart: one button, drawer and checkout shared by every vendor page (the cart spans
// vendors). Mounted once in the layout. Buying goes through the same order endpoint rooms use
// (POST /essentials/orders, split per vendor), so a cart order and a room order look alike.
const ShopCart: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const { items, totalItems, totalPrice, setQuantity, removeItem, clearCart } = useProductCart();
  const isHydrated = useAppSelector((state) => state.productCart.isHydrated);
  const { availability, isChecking, checkError, check } = useProductCartAvailability();
  const { toast, showToast } = useToast();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Read the saved cart once, then keep it saved. The cart stays out of server rendering entirely.
  useEffect(() => {
    dispatch(hydrateProductCart(loadProductCart()));
  }, [dispatch]);
  useEffect(() => {
    if (isHydrated) saveProductCart(items);
  }, [items, isHydrated]);

  // Re-check prices and stock whenever the drawer opens (and when the tab comes back into view while
  // it is open). `items` is read through a ref so a price correction does not trigger another check.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const runCheck = useCallback(async () => {
    if (itemsRef.current.length === 0) return;
    const changed = await check(itemsRef.current);
    if (changed > 0) showToast("Some prices or stock limits in your cart were updated.");
  }, [check, showToast]);

  useEffect(() => {
    if (isCartOpen) void runCheck();
  }, [isCartOpen, runCheck]);

  useEffect(() => {
    if (!isCartOpen) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void runCheck();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isCartOpen, runCheck]);

  // Nothing left to show: close whatever is open.
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
    }
  }, [isHydrated, items.length]);

  const drawerItems = useMemo(() => items.map(toDrawerItem), [items]);
  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        essentialId: item.essentialId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
      })),
    [items],
  );

  const hasUnavailableItems = items.some(
    (item) => availability[item.essentialId]?.isAvailable === false,
  );

  const handleCheckout = useCallback(() => {
    if (hasUnavailableItems) {
      showToast("Remove unavailable items before checking out.");
      return;
    }
    if (!session?.backendToken) {
      if (sessionStatus === "authenticated") {
        showToast("Hit a snag loading your account — please sign in again.");
      }
      dispatch(setOpenStateLogin(true));
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [hasUnavailableItems, session?.backendToken, sessionStatus, dispatch, showToast]);

  const handleOrderPlaced = useCallback(
    (orderId: string) => {
      // Closing the checkout overlay normally steps the browser history back; skip that here so it
      // cannot undo the navigation to the new order.
      skipHistoryPopOnNextClose();
      clearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      showToast("Order placed! Redirecting to your order...");
      router.push(`/orders/rooms/${orderId}`);
    },
    [clearCart, showToast, router],
  );

  const handleIncrement = useCallback(
    (essentialId: string) => {
      const line = itemsRef.current.find((item) => item.essentialId === essentialId);
      if (line) setQuantity(essentialId, line.quantity + 1);
    },
    [setQuantity],
  );
  const handleDecrement = useCallback(
    (essentialId: string) => {
      const line = itemsRef.current.find((item) => item.essentialId === essentialId);
      if (line) setQuantity(essentialId, line.quantity - 1);
    },
    [setQuantity],
  );

  // The cart button belongs on the vendor pages (list, category, vendor); elsewhere it would sit on
  // top of other screens' own controls. The drawer and checkout still work wherever they are opened.
  const showFab = totalItems > 0 && (pathname ?? "").startsWith("/vendors");

  return (
    <>
      {showFab && (
        <CartFab
          mode="products"
          totalItems={totalItems}
          formattedTotal={currencyFormatter.format(totalPrice)}
          onClick={() => setIsCartOpen(true)}
        />
      )}

      {/* Mounted only while open: the drawer manages page scroll and the back button itself, which a
          permanently mounted copy in the layout would interfere with on every other page. */}
      {isCartOpen && (
        <CartDrawer
          mode="products"
          items={drawerItems}
          totalPrice={totalPrice}
          isOpen
          onClose={() => setIsCartOpen(false)}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={removeItem}
          onClear={clearCart}
          onRequestQuote={handleCheckout}
          availability={availability}
          isCheckingAvailability={isChecking}
          availabilityCheckError={checkError}
        />
      )}

      <Overlay
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        isDisable={false}
        shouldReturnNull={!isCheckoutOpen}
      >
        <RoomCheckoutForm
          context="shop"
          items={checkoutItems}
          totalPrice={totalPrice}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaced={handleOrderPlaced}
        />
      </Overlay>

      {toast && <Toast key={toast.id} text={toast.text} />}
    </>
  );
};

export default ShopCart;
