"use client";
import React, { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Overlay from "../../HOC/Overlay/Overlay";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  setOpenState,
  setOpenStateChat,
  setOpenStateLogin,
  setOpenStateUserList,
  setOpenStateAIChat,
  setOpenStateFilters,
} from "@/app/store/features/overLaySlice";
import Chat from "../../Atoms/Chat/Chat";
import dynamic from "next/dynamic";
import Loader, { Loader1 } from "../../Molecules/Loader/Loader";
import { useStopScrollOnOverlay } from "../../CustomHooks/useStopScrollOnOverlay";
import ErrorBoundary from "../../HOC/ErrorBoundary/ErrorBoundary";

const WishListPage = dynamic(
  () => import("@/app/component/Molecules/WishListPage/WishListPage"),
  { loading: () => <Loader1 />, ssr: false },
);

const LoginContainer = dynamic(
  () => import("@/app/component/Molecules/LoginContainer/LoginContainer"),
  { loading: () => <Loader />, ssr: false },
);

const AIChat = dynamic(() => import("@/app/component/Atoms/AIChat/AIChat"), {
  loading: () => <Loader1 />,
  ssr: false,
});

const UserList = dynamic(
  () => import("@/app/component/Atoms/UserList/UserList"),
  { loading: () => <Loader1 />, ssr: false },
);

const MobileFiltersOverlay = dynamic(
  () => import("@/app/component/Molecules/Filters/view/MobileFiltersOverlay"),
  { loading: () => <Loader1 />, ssr: false },
);

type OverlaySurface = {
  key: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoginPage?: boolean;
  mountOnlyWhenOpen?: boolean;
  errorTitle: string;
  content: React.ReactNode;
};

function RenderFromOverlay() {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  useStopScrollOnOverlay();
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    Name: string;
    status: string;
  } | null>(null);
  const isOpen = useAppSelector((state: RootState) => state.overlay.isOpen);
  const isOpenLogin = useAppSelector(
    (state: RootState) => state.overlay.isOpenLogin,
  );
  const isOpenChat = useAppSelector(
    (state: RootState) => state.overlay.isOpenChat,
  );
  const isUserListOpen = useAppSelector(
    (state: RootState) => state.overlay.isUserListOpen,
  );
  const isOpenAIChat = useAppSelector(
    (state: RootState) => state.overlay.isOpenAIChat,
  );
  const isOpenFilters = useAppSelector(
    (state: RootState) => state.overlay.isOpenFilters,
  );

  const wasAuthenticatedRef = useRef(status === "authenticated");
  useEffect(() => {
    const justAuthenticated =
      status === "authenticated" && !wasAuthenticatedRef.current;
    if (isOpenLogin && justAuthenticated) {
      dispatch(setOpenStateLogin(false));
    }
    wasAuthenticatedRef.current = status === "authenticated";
  }, [isOpenLogin, status, dispatch]);

  const surfaces: OverlaySurface[] = [
    {
      key: "wishlist",
      isOpen,
      setIsOpen: (payload) => dispatch(setOpenState(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "Wishlist is unavailable",
      content: <WishListPage isOpen={isOpen} />,
    },
    {
      key: "login",
      isOpen: isOpenLogin,
      setIsOpen: (payload) => dispatch(setOpenStateLogin(payload)),
      isLoginPage: false,
      mountOnlyWhenOpen: true,
      errorTitle: "Login is unavailable",
      content: <LoginContainer />,
    },
    {
      key: "userList",
      isOpen: isUserListOpen,
      setIsOpen: (payload) => dispatch(setOpenStateUserList(payload)),
      errorTitle: "Connections list is unavailable",
      content: <UserList setSelectedUser={setSelectedUser} />,
    },
    {
      key: "chat",
      isOpen: isOpenChat,
      setIsOpen: (payload) => dispatch(setOpenStateChat(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "Chat is unavailable",
      content: <Chat />,
    },
    {
      key: "aiChat",
      isOpen: isOpenAIChat,
      setIsOpen: (payload) => dispatch(setOpenStateAIChat(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "Assistant is unavailable",
      content: <AIChat />,
    },
    {
      key: "filters",
      isOpen: isOpenFilters,
      setIsOpen: (payload) => dispatch(setOpenStateFilters(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "Filters are unavailable",
      content: <MobileFiltersOverlay />,
    },
  ];

  return (
    <>
      {surfaces.map((surface) => (
        <Overlay
          key={surface.key}
          isOpen={surface.isOpen}
          setIsOpen={surface.setIsOpen}
          isDisable={false}
          isLoginPage={surface.isLoginPage}
          shouldReturnNull={
            surface.mountOnlyWhenOpen ? !surface.isOpen : undefined
          }
        >
          <ErrorBoundary title={surface.errorTitle}>
            {surface.content}
          </ErrorBoundary>
        </Overlay>
      ))}
    </>
  );
}

export default RenderFromOverlay;
