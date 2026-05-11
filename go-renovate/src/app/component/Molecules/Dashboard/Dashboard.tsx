"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import ProductPage from "../../HOC/ProductPage/ProductPage";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  setOpenMobileMenu,
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
import Menu from "../../Atoms/Menu/Menu";

type propType = {
  products: void | Response;
};

// const Chat = dynamic(() => import("@/app/component/Atoms/Chat/Chat"), {
//   loading: () => <p><Loader /></p>,
//   ssr: false,
// });

function Dashboard(props: propType) {
  const dispatch = useAppDispatch();
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    Name: string;
    status: string;
  } | null>(null);
  const store = useAppSelector((state: RootState) => state);
  const { data: session, status } = useSession();

  if (
    !session?.loading &&
    !session?.backendToken &&
    !props.products
  ) {
    switch (status) {
      case "loading":
        return <Loader />;
      case "unauthenticated":
        return <LoginContainer />;
      default:
        return <LoginContainer />;
    }
  }

  return (
    <>
      <ProductListPage products={props.products} />
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
      <ProductPage
        isDisable={false}
        isOpen={store.overlay.isMobileMenuOpen}
        setIsOpen={(payload) => dispatch(setOpenMobileMenu(payload))}
      >
        <Menu />
      </ProductPage>
    </>
  );
}

export default Dashboard;
