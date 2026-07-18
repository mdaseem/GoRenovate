"use client";
import { useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { useEffect } from "react";

export const useStopScrollOnOverlay = () => {
  const store = useAppSelector((state: RootState) => state.overlay);
  useEffect(() => {
    // isMobileMenuOpen is intentionally excluded: the account menu is now a
    // small anchored dropdown (Overlay variant="menu"), not a full-page
    // takeover, so it shouldn't lock background scroll.
    if (
      store.isOpen ||
      store.isOpenChat ||
      store.isOpenLogin ||
      store.isUserListOpen ||
      store.isOpenProductPage ||
      store.isOpenProductPageFromSearch ||
      store.isMobileSearchOpen
    ) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [
    store.isOpen,
    store.isOpenChat,
    store.isOpenLogin,
    store.isUserListOpen,
    store.isOpenProductPage,
    store.isOpenProductPageFromSearch,
    store.isMobileSearchOpen,
  ]);
};
