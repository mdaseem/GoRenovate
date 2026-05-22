"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import { useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import Loader from "../Loader/Loader";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import RenderFromOverlay from "../../Atoms/RenderFromOverlay/RenderFromOverlay";
import { useStopScrollOnOverlay } from "../../CustomHooks/useStopScrollOnOverlay";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  const store = useAppSelector((state: RootState) => state.overlay);
  const { data: session, status } = useSession();

  const LoginContainer =
    store.isOpenLogin &&
    dynamic(
      () => import("@/app/component/Molecules/LoginContainer/LoginContainer"),
      {
        loading: () => <Loader />,
        ssr: false,
      },
    );

  useStopScrollOnOverlay();

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
      <RenderFromOverlay />
    </>
  );
}

export default Dashboard;
