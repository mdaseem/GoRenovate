"use client";
import React from "react";
import ProductListPage from "./component/Molecules/ProductListPage/ProductListPage";
import ProductPage from "./component/HOC/ProductPage/ProductPage";
import WishListPage from "./component/Molecules/WishListPage/WishListPage";
import { setOpenState } from "./store/features/overLaySlice";
import { RootState } from "./store/store";
import { useAppDispatch, useAppSelector } from "./store/hooks";

export default function Home() {
  // const { data: session, status } = useSession();
  // const navigate = useRouter();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state: RootState) => state.overlay);
  // const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <ProductListPage />
      <ProductPage
        isOpen={store.isOpen}
        setIsOpen={(payload) => dispatch(setOpenState(payload))}
      >
        <WishListPage isOpen={store.isOpen} />
      </ProductPage>
      {/* <LoginContainer /> */}
    </div>
  );
}
