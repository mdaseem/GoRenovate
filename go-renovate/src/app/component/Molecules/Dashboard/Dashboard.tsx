"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import Loader from "../Loader/Loader";
import { useSession } from "next-auth/react";
import RenderFromOverlay from "../../Atoms/RenderFromOverlay/RenderFromOverlay";
import { useStopScrollOnOverlay } from "../../CustomHooks/useStopScrollOnOverlay";
import LoginContainer from "../LoginContainer/LoginContainer";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  const { data: session, status } = useSession();

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
