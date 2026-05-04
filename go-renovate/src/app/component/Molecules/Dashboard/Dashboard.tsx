"use client";
import React, { Suspense } from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import ProductPage from "../../HOC/ProductPage/ProductPage";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  setOpenState,
  setOpenStateChat,
  setOpenStateLogin,
  setOpenStateUserList,
} from "@/app/store/features/overLaySlice";
import WishListPage from "../WishListPage/WishListPage";
import { LoginContainer } from "../LoginContainer/LoginContainer";
import Loader from "../Loader/Loader";
import Chat from "../../Atoms/Chat/Chat";
import UserList from "../../Atoms/UserList/UserList";
import { useSession } from "next-auth/react";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  const dispatch = useAppDispatch();
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    Name: string;
    status: string;
  } | null>(null);
  const store = useAppSelector((state: RootState) => state);
  
  return (
    <>
      <Suspense fallback={<Loader />}>
        <ProductListPage products={props.products} />
      </Suspense>
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
        isLoginPage={false}
      >
        {store.overlay.isOpenLogin && <LoginContainer />}
      </ProductPage>
      <ProductPage
        isDisable={false}
        isOpen={store.overlay.isUserListOpen}
        setIsOpen={(payload) => dispatch(setOpenStateUserList(payload))}
      >
        <UserList setSelectedUser={setSelectedUser} />
      </ProductPage>
      <ProductPage
        isDisable={false}
        isOpen={store.overlay.isOpenChat}
        setIsOpen={(payload) => dispatch(setOpenStateChat(payload))}
      >
        <Chat />
      </ProductPage>
    </>
  );
}

export default Dashboard;
