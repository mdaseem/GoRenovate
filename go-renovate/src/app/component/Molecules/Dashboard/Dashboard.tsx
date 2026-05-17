"use client";
import React, { useEffect } from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import Overlay from "../../HOC/Overlay/Overlay";
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
import Loader from "../Loader/Loader";
import Chat from "../../Atoms/Chat/Chat";
import UserList from "../../Atoms/UserList/UserList";
import { useSession } from "next-auth/react";
import Menu from "../../Atoms/Menu/Menu";
import dynamic from "next/dynamic";

type propType = {
  products: void | Response;
};

const LoginContainer = dynamic(
  () => import("@/app/component/Molecules/LoginContainer/LoginContainer"),
  {
    loading: () => <Loader />,
    ssr: false,
  },
);

function Dashboard(props: propType) {
  const dispatch = useAppDispatch();
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    Name: string;
    status: string;
  } | null>(null);
  const store = useAppSelector((state: RootState) => state.overlay);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      store.isOpen ||
      store.isOpenChat ||
      store.isOpenLogin ||
      store.isUserListOpen ||
      store.isMobileMenuOpen ||
      store.isOpenProductPage
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
    store.isMobileMenuOpen,
    store.isOpenProductPage,
  ]);

  if (!session?.loading && !session?.backendToken && !props.products) {
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
      <Overlay
        isOpen={store.isOpen}
        setIsOpen={(payload) => dispatch(setOpenState(payload))}
        isDisable={false}
        shouldReturnNull={store.isOpen ? false : true}
      >
        {store.isOpen && <WishListPage isOpen={store.isOpen} />}
      </Overlay>
      <Overlay
        isOpen={store.isOpenLogin}
        setIsOpen={(payload) => dispatch(setOpenStateLogin(payload))}
        isDisable={false}
        isLoginPage={false}
        shouldReturnNull={store.isOpenLogin ? false : true}
      >
        {store.isOpenLogin && <LoginContainer />}
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.isUserListOpen}
        setIsOpen={(payload) => dispatch(setOpenStateUserList(payload))}
        shouldReturnNull={store.isUserListOpen ? false : true}
      >
        {store.isUserListOpen ? (
          <UserList setSelectedUser={setSelectedUser} />
        ) : (
          "users loading..."
        )}
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.isOpenChat}
        setIsOpen={(payload) => dispatch(setOpenStateChat(payload))}
        shouldReturnNull={store.isOpenChat ? false : true}
      >
        <Chat />
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.isMobileMenuOpen}
        setIsOpen={(payload) => dispatch(setOpenMobileMenu(payload))}
        shouldReturnNull={store.isMobileMenuOpen ? false : true}
      >
        <Menu />
      </Overlay>
    </>
  );
}

export default Dashboard;
