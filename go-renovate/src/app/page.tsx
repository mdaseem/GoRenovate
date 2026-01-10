"use client";
import React from "react";
import ProductListPage from "./component/Molecules/ProductListPage/ProductListPage";
import ProductPage from "./component/HOC/ProductPage/ProductPage";
import WishListPage from "./component/Molecules/WishListPage/WishListPage";
import { setOpenState, setOpenStateLogin } from "./store/features/overLaySlice";
import { RootState } from "./store/store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { LoginContainer } from "./component/Molecules/LoginContainer/LoginContainer";

export default function Home() {
  // const navigate = useRouter();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state: RootState) => state);
  // const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <ProductListPage />
      <ProductPage
        isOpen={store.overlay.isOpen}
        setIsOpen={(payload) => dispatch(setOpenState(payload))}
        isDisable={false}
      >
        {store.overlay.isOpen && <WishListPage isOpen={store.overlay.isOpen} />}
      </ProductPage>
      <ProductPage
        isOpen={store.overlay.isOpenLogin}
        setIsOpen={(payload) => dispatch(setOpenStateLogin(payload))}
        isDisable={false}
        isLoginPage={true}
      >
        {store.overlay.isOpenLogin && <LoginContainer />}
      </ProductPage>
    </div>
  );
}
