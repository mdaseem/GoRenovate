"use client";
import React from "react";
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
  const store = useAppSelector((state: RootState) => state);
  const { data: session, status } = useSession();

  // if (store.overlay.isUserListOpen && selectedUser) {
  // }
  // const UserList = dynamic(
  //   () => import("@/app/component/Atoms/UserList/UserList"),
  //   {
  //     loading: () => <Loader />,
  //     ssr: false,
  //   },
  // );

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
        isOpen={store.overlay.isOpen}
        setIsOpen={(payload) => dispatch(setOpenState(payload))}
        isDisable={false}
      >
        {store.overlay.isOpen && <WishListPage isOpen={store.overlay.isOpen} />}
      </Overlay>
      <Overlay
        isOpen={store.overlay.isOpenLogin}
        setIsOpen={(payload) => dispatch(setOpenStateLogin(payload))}
        isDisable={false}
        isLoginPage={false}
      >
        {store.overlay.isOpenLogin && <LoginContainer />}
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.overlay.isUserListOpen}
        setIsOpen={(payload) => dispatch(setOpenStateUserList(payload))}
      >
        {store.overlay.isUserListOpen ? (
          <UserList setSelectedUser={setSelectedUser} />
        ) : (
          "users loading..."
        )}
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.overlay.isOpenChat}
        setIsOpen={(payload) => dispatch(setOpenStateChat(payload))}
      >
        <Chat />
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.overlay.isMobileMenuOpen}
        setIsOpen={(payload) => dispatch(setOpenMobileMenu(payload))}
      >
        <Menu />
      </Overlay>
    </>
  );
}

export default Dashboard;
