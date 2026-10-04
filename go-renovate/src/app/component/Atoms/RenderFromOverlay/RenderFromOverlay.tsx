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
  setOpenStateRoomFilters,
  setOpenStateSlotPicker,
  setOpenStateRoomDetail,
} from "@/app/store/features/overLaySlice";
import { getFavorites, clearFavorites } from "@/app/store/features/favoritesSlice";
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

const MobileRoomFiltersOverlay = dynamic(
  () =>
    import("@/app/component/Molecules/RoomFilters/MobileRoomFiltersOverlay"),
  { loading: () => <Loader1 />, ssr: false },
);

const EssentialSwapPicker = dynamic(
  () =>
    import("@/app/component/Atoms/EssentialSwapPicker/EssentialSwapPicker"),
  { loading: () => <Loader1 />, ssr: false },
);

const RoomDetailOverlay = dynamic(
  () => import("@/app/component/Atoms/RoomDetailOverlay/RoomDetailOverlay"),
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
  const { data: session, status } = useSession();
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
  const isOpenRoomFilters = useAppSelector(
    (state: RootState) => state.overlay.isOpenRoomFilters,
  );
  const isOpenSlotPicker = useAppSelector(
    (state: RootState) => state.overlay.isOpenSlotPicker,
  );
  const isOpenRoomDetail = useAppSelector(
    (state: RootState) => state.overlay.isOpenRoomDetail,
  );
  const favorites = useAppSelector((state: RootState) => state.favoriteList);

  const wasAuthenticatedRef = useRef(status === "authenticated");
  useEffect(() => {
    const justAuthenticated =
      status === "authenticated" && !wasAuthenticatedRef.current;
    if (isOpenLogin && justAuthenticated) {
      dispatch(setOpenStateLogin(false));
    }
    wasAuthenticatedRef.current = status === "authenticated";
  }, [isOpenLogin, status, dispatch]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.backendToken &&
      !favorites.hasLoaded &&
      !favorites.isLoading
    ) {
      dispatch(getFavorites({ token: session.backendToken }));
    } else if (status === "unauthenticated" && favorites.hasLoaded) {
      dispatch(clearFavorites());
    }
  }, [status, session?.backendToken, favorites.hasLoaded, favorites.isLoading, dispatch]);

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
    {
      key: "roomFilters",
      isOpen: isOpenRoomFilters,
      setIsOpen: (payload) => dispatch(setOpenStateRoomFilters(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "Filters are unavailable",
      content: <MobileRoomFiltersOverlay />,
    },
    {
      key: "roomDetail",
      isOpen: isOpenRoomDetail,
      setIsOpen: (payload) => dispatch(setOpenStateRoomDetail(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "This room is unavailable",
      content: <RoomDetailOverlay />,
    },
    {
      // Registered after "roomDetail" so it stacks visually on top when
      // both are open (Swap is triggered from inside the room-detail
      // overlay) — array/DOM order determines paint order here.
      key: "slotPicker",
      isOpen: isOpenSlotPicker,
      setIsOpen: (payload) => dispatch(setOpenStateSlotPicker(payload)),
      mountOnlyWhenOpen: true,
      errorTitle: "This picker is unavailable",
      content: <EssentialSwapPicker />,
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
