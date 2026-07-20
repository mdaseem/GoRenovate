"use client";
import React from "react";
import Overlay from "../../HOC/Overlay/Overlay";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  setOpenState,
  setOpenStateChat,
  setOpenStateLogin,
  setOpenStateUserList,
} from "@/app/store/features/overLaySlice";
import Chat from "../../Atoms/Chat/Chat";
import UserList from "../../Atoms/UserList/UserList";
import dynamic from "next/dynamic";
import Loader, { Loader1 } from "../../Molecules/Loader/Loader";
import { useStopScrollOnOverlay } from "../../CustomHooks/useStopScrollOnOverlay";
import ErrorBoundary from "../../HOC/ErrorBoundary/ErrorBoundary";

function RenderFromOverlay() {
  const dispatch = useAppDispatch();
  useStopScrollOnOverlay();
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    Name: string;
    status: string;
  } | null>(null);
  const store = useAppSelector((state: RootState) => state.overlay);

  const WishListPage =
    store.isOpen &&
    dynamic(
      () => import("@/app/component/Molecules/WishListPage/WishListPage"),
      {
        loading: () => <Loader1 />,
        ssr: false,
      },
    );

  const LoginContainer =
    store.isOpenLogin &&
    dynamic(
      () => import("@/app/component/Molecules/LoginContainer/LoginContainer"),
      {
        loading: () => <Loader />,
        ssr: false,
      },
    );

  return (
    <>
      <Overlay
        isOpen={store.isOpen}
        setIsOpen={(payload) => dispatch(setOpenState(payload))}
        isDisable={false}
        shouldReturnNull={store.isOpen ? false : true}
      >
        <ErrorBoundary title="Wishlist is unavailable">
          {WishListPage && <WishListPage isOpen={store.isOpen} />}
        </ErrorBoundary>
      </Overlay>
      <Overlay
        isOpen={store.isOpenLogin}
        setIsOpen={(payload) => dispatch(setOpenStateLogin(payload))}
        isDisable={false}
        isLoginPage={false}
        shouldReturnNull={store.isOpenLogin ? false : true}
      >
        <ErrorBoundary title="Login is unavailable">
          {LoginContainer && <LoginContainer />}
        </ErrorBoundary>
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.isUserListOpen}
        setIsOpen={(payload) => dispatch(setOpenStateUserList(payload))}
      >
        <ErrorBoundary title="Connections list is unavailable">
          <UserList setSelectedUser={setSelectedUser} />
        </ErrorBoundary>
      </Overlay>
      <Overlay
        isDisable={false}
        isOpen={store.isOpenChat}
        setIsOpen={(payload) => dispatch(setOpenStateChat(payload))}
        shouldReturnNull={store.isOpenChat ? false : true}
      >
        <ErrorBoundary title="Chat is unavailable">
          <Chat />
        </ErrorBoundary>
      </Overlay>
    </>
  );
}

export default RenderFromOverlay;
